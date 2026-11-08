package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pikcui/Walawe/packages/ledger"
	policyengine "github.com/pikcui/Walawe/packages/policy-engine"
	"github.com/pikcui/Walawe/packages/providers"
	"github.com/redis/go-redis/v9"
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
	dbStore     *ledger.PgStore
	dbPool      *pgxpool.Pool
	detector    *AnomalyDetector
	redisClient *redis.Client
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

	redisURL := os.Getenv("REDIS_URL")
	redisURL = strings.ReplaceAll(redisURL, "\"", "")
	redisURL = strings.TrimSpace(redisURL)

	var rdb *redis.Client
	if redisURL == "" {
		rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	} else {
		opt, err := redis.ParseURL(redisURL)
		if err != nil {
			log.Fatalf("Invalid REDIS_URL: %v", err)
		}
		rdb = redis.NewClient(opt)
	}
	redisClient = rdb

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Printf("WARNING: Failed to connect to Redis: %v", err)
	}

	detector = NewAnomalyDetector(rdb, pool)

	mux := newMux()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Walawe Gateway running on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-PAYMENT, X-REQUIRE-APPROVAL, X-Provider-Key, X-Provider-Name")
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

	// Public Routes
	mux.HandleFunc("/v1/chat/completions", rateLimitMiddleware(authMiddleware(handleChatCompletions)))
	mux.HandleFunc("/v1/premium-data", rateLimitMiddleware(authMiddleware(X402Middleware(dbStore, 1000, "0x8a21C2f8F19123de2bcc5F7932d2351eba1Db6Eb")(handlePremiumData))))
	mux.HandleFunc("/admin/login", handleAdminLogin)
	mux.HandleFunc("/admin/register", handleAdminRegister)

	// Protected Admin Routes
	mux.HandleFunc("/admin/balance", AdminAuthMiddleware(handleGetBalance))
	mux.HandleFunc("/admin/approvals", AdminAuthMiddleware(handleGetApprovals))
	mux.HandleFunc("/admin/usage", AdminAuthMiddleware(handleGetUsage))

	// Admin Only Routes
	mux.HandleFunc("/admin/approvals/resolve", AdminOnlyMiddleware(handleResolveApproval))
	mux.HandleFunc("/admin/users", AdminOnlyMiddleware(handleCreateUser))
	mux.HandleFunc("/admin/deposit", AdminOnlyMiddleware(handleAdminDeposit))
	mux.HandleFunc("/admin/deposit-web3", AdminOnlyMiddleware(handleWeb3Deposit))

	// API Keys Management
	mux.HandleFunc("/admin/api-keys", AdminOnlyMiddleware(handleGetAPIKeys))
	mux.HandleFunc("/admin/api-keys/create", AdminOnlyMiddleware(handleCreateAPIKey))
	mux.HandleFunc("/admin/api-keys/revoke", AdminOnlyMiddleware(handleRevokeAPIKey))

	// Policy Management
	mux.HandleFunc("/admin/policy", AdminOnlyMiddleware(handleGetPolicy))
	mux.HandleFunc("/admin/policy/update", AdminOnlyMiddleware(handleUpdatePolicy))

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

	providerKey := r.Header.Get("X-Provider-Key")
	providerName := r.Header.Get("X-Provider-Name")

	if providerKey == "" {
		http.Error(w, "Missing X-Provider-Key header. BYOK is mandatory.", http.StatusBadRequest)
		return
	}

	var activeProvider providers.Provider
	if providerName == "anthropic" {
		activeProvider = providers.NewAnthropicProvider(providerKey)
	} else {
		activeProvider = providers.NewOpenAIProvider(providerKey)
	}

	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if detector.RecordAndCheck(r.Context(), agentIDStr) {
		http.Error(w, "Anomaly detected: Agent suspended (Spam)", http.StatusForbidden)
		return
	}
	agentID := ledger.AccountID(agentIDStr)
	holdAcc := ledger.AccountID("hold_" + agentIDStr)
	estimatedCost := ledger.MicroUSD(req.MaxTokens * 10)

	if detector.RecordSpending(r.Context(), agentIDStr, estimatedCost) {
		http.Error(w, "Anomaly detected: Agent suspended (High Spending Rate)", http.StatusForbidden)
		return
	}

	writeAuditLog("chat_completion_request", agentIDStr)

	var agentStatus string
	err := dbPool.QueryRow(r.Context(), "SELECT status FROM agents WHERE id = $1::uuid", agentIDStr).Scan(&agentStatus)
	if err != nil {
		http.Error(w, "Agent not found", http.StatusUnauthorized)
		return
	}

	var ruleJSON []byte
	err = dbPool.QueryRow(r.Context(), "SELECT rule_json FROM policies WHERE agent_id = $1::uuid ORDER BY created_at DESC LIMIT 1", agentIDStr).Scan(&ruleJSON)
	if err != nil {
		http.Error(w, "Policy not found for this agent", http.StatusForbidden)
		return
	}

	var dynamicPolicy policyengine.Policy
	if err := json.Unmarshal(ruleJSON, &dynamicPolicy); err != nil {
		log.Printf("Failed to parse policy JSON: %v", err)
		http.Error(w, "Invalid policy format", http.StatusInternalServerError)
		return
	}
	dynamicPolicy.Status = agentStatus

	usage, err := getAgentUsage(r.Context(), agentID)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	policyReq := policyengine.Request{Model: req.Model, MaxTokens: req.MaxTokens, EstimatedCost: estimatedCost}

	decision := policyengine.Evaluate(policyReq, usage, dynamicPolicy)
	if !decision.Allowed {
		if decision.Reason == "require_approval" {
			_, dbErr := dbPool.Exec(r.Context(), `
INSERT INTO approval_requests (agent_id, model, estimated_cost_micro_usd)
VALUES ($1, $2, $3)
`, agentIDStr, req.Model, int64(estimatedCost))
			if dbErr != nil {
				log.Printf("Failed to save approval request: %v", dbErr)
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

	err = dbStore.Do(ctx, func(tx ledger.Tx) error {
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

		case streamErr := <-errs:
			if streamErr != nil {
				log.Printf("Stream error: %v", streamErr)
				fmt.Fprintf(w, "data: {\"error\": \"%s\"}\n\n", streamErr.Error())
				flusher.Flush()
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

		if actualCost > 0 {
			_, err = tx.InsertEntry(ledger.Entry{
				Debit:          holdAcc,
				Credit:         "external",
				Amount:         actualCost,
				RefType:        "settle",
				RefID:          requestID,
				IdempotencyKey: "settle_cost_" + requestID,
			})
			if err != nil {
				return err
			}
		}

		if returnAmount > 0 {
			_, err = tx.InsertEntry(ledger.Entry{
				Debit:          holdAcc,
				Credit:         agentID,
				Amount:         returnAmount,
				RefType:        "settle_return",
				RefID:          requestID,
				IdempotencyKey: "settle_ret_" + requestID,
			})
			return err
		}
		return nil
	})

	if err != nil {
		log.Printf("WARNING: Settle failed for %s: %v", requestID, err)
	}
}

func getAgentUsage(ctx context.Context, agentID ledger.AccountID) (policyengine.Usage, error) {
	var spentToday, spentMonth int64
	query := `
SELECT
COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN amount ELSE 0 END), 0) as spent_today,
COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as spent_month
FROM entries
WHERE debit = $1 AND ref_type IN ('settle', 'x402_payment')
`
	err := dbPool.QueryRow(ctx, query, string(agentID)).Scan(&spentToday, &spentMonth)
	if err != nil {
		return policyengine.Usage{}, err
	}
	return policyengine.Usage{
		SpentToday: ledger.MicroUSD(spentToday),
		SpentMonth: ledger.MicroUSD(spentMonth),
	}, nil
}

func handleGetBalance(w http.ResponseWriter, r *http.Request) {
	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var balance int64
	err := dbPool.QueryRow(r.Context(), "SELECT balance FROM accounts WHERE id = $1", agentIDStr).Scan(&balance)
	if err != nil {
		http.Error(w, "Failed to get balance", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"agent_id":          agentIDStr,
		"balance_micro_usd": balance,
	})
}

func handleGetUsage(w http.ResponseWriter, r *http.Request) {
	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := `
SELECT
TO_CHAR(created_at, 'YYYY-MM-DD') as usage_date,
COALESCE(SUM(amount), 0) as total
FROM entries
WHERE debit = $1 AND ref_type IN ('settle', 'x402_payment')
AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
ORDER BY usage_date ASC
`

	rows, err := dbPool.Query(r.Context(), query, agentIDStr)
	if err != nil {
		http.Error(w, "Failed to get usage data", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var usageData []map[string]interface{}
	for rows.Next() {
		var dateStr string
		var total int64
		if err := rows.Scan(&dateStr, &total); err != nil {
			continue
		}
		usageData = append(usageData, map[string]interface{}{
			"date":  dateStr,
			"total": total,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(usageData)
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
