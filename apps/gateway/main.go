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

type ChatResponse struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Choices []Choice `json:"choices"`
}

type Choice struct {
	Message Message `json:"message"`
}

var (
	dbStore *ledger.PgStore
)

func main() {
	dsn := "postgres://android@localhost:5432/walawe?sslmode=disable"
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	dbStore = ledger.NewPgStore(pool)

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

	policy := policyengine.Policy{
		Status:            "active",
		MaxCostPerRequest: ledger.MicroUSD(5000),
		MaxCostPerDay:     ledger.MicroUSD(50000),
		AllowedModels:     []string{"gpt-4"},
	}
	usage := policyengine.Usage{SpentToday: 0, SpentMonth: 0}
	policyReq := policyengine.Request{Model: req.Model, MaxTokens: req.MaxTokens, EstimatedCost: estimatedCost}

	decision := policyengine.Evaluate(policyReq, usage, policy)
	if !decision.Allowed {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": decision.Reason})
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
		http.Error(w, fmt.Sprintf("Ledger reserve failed: %v", err), http.StatusPaymentRequired)
		return
	}

	time.Sleep(1 * time.Second)
	actualTokens := int64(10)
	actualCost := ledger.MicroUSD(actualTokens * 10)

	err = dbStore.Do(ctx, func(tx ledger.Tx) error {
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ChatResponse{
		ID:     requestID,
		Object: "chat.completion",
		Choices: []Choice{
			{Message: Message{Role: "assistant", Content: "Halo! Ini adalah respons simulasi dari Walawe Gateway."}},
		},
	})
}
