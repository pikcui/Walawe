package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
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
	dbStore *ledger.PgStore
	dbPool  *pgxpool.Pool
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://android@localhost:5432/walawe?sslmode=disable"
	}

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	dbStore = ledger.NewPgStore(pool)
	dbPool = pool

	mux := newMux()
	port := ":8080"
	fmt.Printf("Walawe Gateway running on %s\n", port)
	log.Fatal(http.ListenAndServe(port, mux))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-PAYMENT, X-REQUIRE-APPROVAL, X-Provider-Key")
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

	// Agent Routes
	mux.HandleFunc("/v1/chat/completions", rateLimitMiddleware(authMiddleware(handleChatCompletions)))
	mux.HandleFunc("/v1/premium-data", rateLimitMiddleware(authMiddleware(X402Middleware(dbStore, 1000, "0xYourSmartContractAddress")(handlePremiumData))))

	// Admin Auth Route
	mux.HandleFunc("/admin/login", handleAdminLogin)

	// Protected Admin Routes (JWT)
	mux.HandleFunc("/admin/balance", AdminAuthMiddleware(handleGetBalance))
	mux.HandleFunc("/admin/approvals", AdminAuthMiddleware(handleGetApprovals))
	mux.HandleFunc("/admin/approvals/resolve", AdminAuthMiddleware(handleResolveApproval))

	return corsMiddleware(mux)
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
		MaxCostPerRequest: ledger.MicroUSD(100000),
		AllowedModels:     []string{"gpt-4"},
		ApprovalThreshold: ledger.MicroUSD(5000),
	}
	usage := policyengine.Usage{SpentToday: 0, SpentMonth: 0}
	policyReq := policyengine.Request{Model: req.Model, MaxTokens: req.MaxTokens, EstimatedCost: estimatedCost}

	decision := policyengine.Evaluate(policyReq, usage, policy)
	if !decision.Allowed {
		if decision.Reason == "require_approval" {
			_, err := dbPool.Exec(r.Context(), `
				INSERT INTO approval_requests (agent_id, model, estimated_cost_micro_usd)
				VALUES ($1, $2, $3)
			`, agentIDStr, req.Model, int64(estimatedCost))
			if err != nil {
				log.Printf("Failed to save approval request: %v", err)
			}

			w.Header().Set("X-REQUIRE-APPROVAL", "true")
			http.Error(w, "Requires human approval", http.StatusForbidden)
			return
		}
		http.Error(w, "Policy denied: "+decision.Reason, http.StatusForbidden)
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

	// BYOK Logic (Pemilihan Provider)
	providerKey := r.Header.Get("X-Provider-Key")
	var activeProvider providers.Provider

	if providerKey != "" {
		activeProvider = providers.NewOpenAIProvider(providerKey)
	} else {
		activeProvider = providers.NewSimulatedProvider()
	}

	chunks, errs := activeProvider.StreamChat(ctx, req.Model, req.Messages[0].Content)
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

func handleGetApprovals(w http.ResponseWriter, r *http.Request) {
	rows, err := dbPool.Query(r.Context(), "SELECT id, agent_id, model, estimated_cost_micro_usd, status, created_at FROM approval_requests WHERE status = 'pending' ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, "Failed to get approvals", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var approvals []map[string]interface{}
	for rows.Next() {
		var id, agentID, model, status string
		var cost int64
		var createdAt time.Time
		if err := rows.Scan(&id, &agentID, &model, &cost, &status, &createdAt); err != nil {
			continue
		}
		approvals = append(approvals, map[string]interface{}{
			"id": id, "agent_id": agentID, "model": model, "cost": cost, "status": status, "created_at": createdAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(approvals)
}

func handleResolveApproval(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		ID     string `json:"id"`
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	status := "approved"
	if payload.Action == "reject" {
		status = "rejected"
	}

	_, err := dbPool.Exec(r.Context(), "UPDATE approval_requests SET status = $1, resolved_at = now() WHERE id = $2", status, payload.ID)
	if err != nil {
		http.Error(w, "Failed to update approval", http.StatusInternalServerError)
		return
	}

	var webhookURL string
	err = dbPool.QueryRow(r.Context(), `
		SELECT a.webhook_url 
		FROM agents a 
		JOIN approval_requests ar ON a.id = ar.agent_id 
		WHERE ar.id = $1`, payload.ID).Scan(&webhookURL)

	if err == nil && webhookURL != "" {
		sendWebhook(webhookURL, map[string]interface{}{
			"event":      "approval_resolved",
			"request_id": payload.ID,
			"status":     status,
		})
	} else if err != nil {
		log.Printf("Warning: could not find webhook_url for approval %s: %v", payload.ID, err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Success"))
}

func handlePremiumData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"data": "Ini adalah data rahasia yang hanya bisa diakses setelah membayar via x402!",
	})
}
