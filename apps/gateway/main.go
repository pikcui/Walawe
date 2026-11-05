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

// Struktur Request dari Agen AI (Kompatibel dengan OpenAI)
type ChatRequest struct {
	Model     string    `json:"model"`
	Messages  []Message `json:"messages"`
	MaxTokens int64     `json:"max_tokens"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// Struktur Response (Simulasi)
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
	// 1. Koneksi ke Database
	dsn := "postgres://android@localhost:5432/walawe?sslmode=disable"
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	dbStore = ledger.NewPgStore(pool)

	// 2. Setup HTTP Router
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// 3. Endpoint Utama (OpenAI Compatible)
	mux.HandleFunc("/v1/chat/completions", handleChatCompletions)

	port := ":8080"
	fmt.Printf("Walawe Gateway running on %s\n", port)
	log.Fatal(http.ListenAndServe(port, mux))
}

func handleChatCompletions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1. Parse Request
	var req ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Hardcode agent ID untuk testing (Nanti diganti API Key di Stage 5)
	agentID := ledger.AccountID("agent_1")
	holdAcc := ledger.AccountID("hold_agent_1")

	// Estimasi biaya kasar untuk testing: 1 token = 10 MicroUSD
	estimatedCost := ledger.MicroUSD(req.MaxTokens * 10)

	// 2. Cek Policy (Satpam)
	policy := policyengine.Policy{
		Status:            "active",
		MaxCostPerRequest: ledger.MicroUSD(5000),
		MaxCostPerDay:     ledger.MicroUSD(50000),
		AllowedModels:     []string{"gpt-4"},
	}
	usage := policyengine.Usage{SpentToday: 0, SpentMonth: 0} // Nanti diambil dari DB
	policyReq := policyengine.Request{Model: req.Model, MaxTokens: req.MaxTokens, EstimatedCost: estimatedCost}

	decision := policyengine.Evaluate(policyReq, usage, policy)
	if !decision.Allowed {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": decision.Reason})
		return
	}

	// 3. Reserve (Tahan Uang)
	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())
	ctx := r.Context()

	err := dbStore.Do(ctx, func(tx ledger.Tx) error {
		// Taruh hold
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

		// Pindahkan saldo ke hold
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

	// 4. Route ke Provider (Simulasi)
	// Di Stage 4, ini akan memanggil OpenAI/Anthropic asli.
	// Untuk sekarang kita beri jeda 1 detik lalu kembalikan dummy response.
	time.Sleep(1 * time.Second)

	// Simulasi pemakaian token aktual (lebih kecil dari estimasi)
	actualTokens := int64(10)
	actualCost := ledger.MicroUSD(actualTokens * 10) // 100 MicroUSD

	// 5. Settle (Tagih biaya asli, kembalikan sisanya)
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

		// Kembalikan sisa hold ke agen
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

	// 6. Return Response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ChatResponse{
		ID:     requestID,
		Object: "chat.completion",
		Choices: []Choice{
			{Message: Message{Role: "assistant", Content: "Halo! Ini adalah respons simulasi dari Walawe Gateway."}},
		},
	})
}

func newMux() http.Handler {
	// Placeholder untuk main_test.go
	m := http.NewServeMux()
	return m
}
