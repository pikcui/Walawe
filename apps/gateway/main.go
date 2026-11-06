package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pikcui/Walawe/packages/ledger"
	policyengine "github.com/pikcui/Walawe/packages/policy-engine"
	"github.com/pikcui/Walawe/packages/providers"
)

type ChatRequest struct {
	Model     string    `json:"model"`
	Messages  []Message `json:"messages"`
	MaxTokens int64     `json:"max_tokens"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

var (
	dbStore  *ledger.PgStore
	dbPool   *pgxpool.Pool
	provider providers.Provider
)

func main() {
	dsn := "postgres://android@localhost:5432/walawe?sslmode=disable"
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	dbStore = ledger.NewPgStore(pool)
	dbPool = pool

	provider = providers.NewSimulatedProvider()

	mux := newMux()
	port := ":8080"
	fmt.Printf("Walawe Gateway running on %s\n", port)
	log.Fatal(http.ListenAndServe(port, mux))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-PAYMENT")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func newMux() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	mux.HandleFunc("/v1/chat/completions", rateLimitMiddleware(authMiddleware(handleChatCompletions)))
	mux.HandleFunc("/admin/balance", handleGetBalance)

	// Endpoint baru: Butuh pembayaran 1000 micro-USD (0.001 USD)
	mux.HandleFunc("/v1/premium-data", rateLimitMiddleware(X402Middleware(1000, "0xYourSmartContractAddress")(handlePremiumData)))

	return corsMiddleware(mux)
}

func handlePremiumData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"data": "Ini adalah data rahasia yang hanya bisa diakses setelah membayar via x402!",
	})
}

func handleChatCompletions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	writeAuditLog("chat_completion_request", agentIDStr)

	agentID := ledger.AccountID(agentIDStr)
	holdAcc := ledger.AccountID("hold_" + agentIDStr)
	estimatedCost := ledger.MicroUSD(req.MaxTokens * 10)

	policy := policyengine.Policy{
		Status:            "active",
		MaxCostPerRequest: ledger.MicroUSD(5000),
		AllowedModels:     []string{"gpt-4"},
	}
	usage := policyengine.Usage{SpentToday: 0, SpentMonth: 0}
	policyReq := policyengine.Request{Model: req.Model, MaxTokens: req.MaxTokens, EstimatedCost: estimatedCost}

	if !policyengine.Evaluate(policyReq, usage, policy).Allowed {
		http.Error(w, "Policy denied", http.StatusForbidden)
		return
	}

	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())
	ctx := r.Context()

	err := dbStore.Do(ctx, func(tx ledger.Tx) error {
		h := ledger.Hold{
			RequestID:     requestID,
			CreditAccount: agentID,
			HoldAccount:   holdAcc,
			Amount:        estimatedCost,
			Status:        ledger.HoldOpen,
			ExpiresAt:     time.Now().Add(5 * time.Minute),
		}
		if err := tx.PutHold(h); err != nil {
			return err
		}
		_, err := tx.InsertEntry(ledger.Entry{
			Debit:          agentID,
			Credit:         holdAcc,
			Amount:         estimatedCost,
			RefType:        "reserve",
			RefID:          requestID,
			IdempotencyKey: "res_" + requestID,
		})
		return err
	})

	if err != nil {
		http.Error(w, "Insufficient balance", http.StatusPaymentRequired)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	chunks, errs := provider.StreamChat(ctx, req.Model, req.Messages[0].Content)
	var totalTokens int64 = 0

	for {
		select {
		case chunk, ok := <-chunks:
			if !ok {
				goto Settle
			}
			fmt.Fprintf(w, "data: {\"text\": \"%s\"}\n\n", chunk.Text)
			flusher.Flush()
			totalTokens += 2

		case err := <-errs:
			if err != nil {
				log.Printf("Stream error: %v", err)
			}
			goto Settle

		case <-ctx.Done():
			log.Printf("Client disconnected. Settling for %d tokens.", totalTokens)
			goto Settle
		}
	}

Settle:
	actualCost := ledger.MicroUSD(totalTokens * 10)
	if actualCost > estimatedCost {
		actualCost = estimatedCost
	}

	err = dbStore.Do(context.Background(), func(tx ledger.Tx) error {
		h, found, err := tx.HoldByRequestID(requestID)
		if err != nil || !found {
			return fmt.Errorf("hold not found")
		}
		returnAmount := h.Amount - actualCost
		h.BilledAmount = actualCost
		h.Status = ledger.HoldSettled
		h.SettledAt = time.Now()

		if err := tx.PutHold(h); err != nil {
			return err
		}
		if returnAmount > 0 {
			_, err = tx.InsertEntry(ledger.Entry{
				Debit:          holdAcc,
				Credit:         agentID,
				Amount:         returnAmount,
				RefType:        "settle_return",
				RefID:          requestID,
				IdempotencyKey: "settle_" + requestID,
			})
			return err
		}
		return nil
	})

	if err != nil {
		log.Printf("WARNING: Settle failed for %s: %v", requestID, err)
	}
}

func handleGetBalance(w http.ResponseWriter, r *http.Request) {
	var balance int64
	agentUUID := "11111111-1111-1111-1111-111111111111"

	err := dbPool.QueryRow(r.Context(), "SELECT balance FROM accounts WHERE id = $1", agentUUID).Scan(&balance)
	if err != nil {
		http.Error(w, "Failed to get balance", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"agent_id":          agentUUID,
		"balance_micro_usd": balance,
	})
}
