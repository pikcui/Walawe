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
	provider providers.Provider
)

func main() {
	dsn := "postgres://android@localhost:5432/walawe?sslmode=disable"
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	dbStore = ledger.NewPgStore(pool)

	// Gunakan simulasi provider
	provider = providers.NewSimulatedProvider()

	mux := newMux()
	port := ":8080"
	fmt.Printf("Walawe Gateway running on %s\n", port)
	log.Fatal(http.ListenAndServe(port, mux))
}

func newMux() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})
	mux.HandleFunc("/v1/chat/completions", handleChatCompletions)
	return mux
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

	agentID := ledger.AccountID("agent_1")
	holdAcc := ledger.AccountID("hold_agent_1")
	estimatedCost := ledger.MicroUSD(req.MaxTokens * 10)

	// 1. Cek Policy
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

	// 2. Reserve (Hold)
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

	// 3. STREAMING: Setup HTTP Flusher
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

	// Loop untuk mengirim data ke client
	for {
		select {
		case chunk, ok := <-chunks:
			if !ok {
				// Stream selesai
				goto Settle
			}
			// Format SSE
			fmt.Fprintf(w, "data: {\"text\": \"%s\"}\n\n", chunk.Text)
			flusher.Flush()
			totalTokens += 2 // Simulasi hitungan token per kata

		case err := <-errs:
			if err != nil {
				log.Printf("Stream error: %v", err)
			}
			goto Settle

		case <-ctx.Done():
			// CLIENT DISCONNECT! Hentikan stream dan settle sesuai token terpakai
			log.Printf("Client disconnected. Settling for %d tokens.", totalTokens)
			goto Settle
		}
	}

Settle:
	// 4. Settle berdasarkan token yang benar-benar terkirim
	actualCost := ledger.MicroUSD(totalTokens * 10)
	if actualCost > estimatedCost {
		actualCost = estimatedCost // Jangan pernah tagih melebihi hold
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
