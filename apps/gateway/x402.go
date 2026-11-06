package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/pikcui/Walawe/packages/ledger"
)

// X402Middleware mensimulasikan gerbang pembayaran HTTP 402 dan mencatatnya ke Ledger
func X402Middleware(store *ledger.PgStore, priceMicroUSD int64, payToAddress string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			paymentHeader := r.Header.Get("X-PAYMENT")

			// Jika tidak ada header pembayaran, kirim 402
			if paymentHeader == "" {
				w.Header().Set("X-PRICE", fmt.Sprintf("%d", priceMicroUSD))
				w.Header().Set("X-PAY-TO", payToAddress)
				w.WriteHeader(http.StatusPaymentRequired)
				w.Write([]byte("Payment Required: Please provide X-PAYMENT header with a valid payload."))
				return
			}

			// Ambil Agent ID dari context (karena endpoint ini wajib dilindungi authMiddleware)
			agentIDStr, ok := r.Context().Value(agentIDKey).(string)
			if !ok || agentIDStr == "" {
				http.Error(w, "Unauthorized: Missing agent ID in context", http.StatusUnauthorized)
				return
			}
			agentID := ledger.AccountID(agentIDStr)

			// Decode payload base64
			payloadBytes, err := base64.StdEncoding.DecodeString(paymentHeader)
			if err != nil {
				http.Error(w, "Invalid payment payload encoding", http.StatusBadRequest)
				return
			}

			var payload map[string]interface{}
			if err := json.Unmarshal(payloadBytes, &payload); err != nil {
				http.Error(w, "Invalid payment JSON payload", http.StatusBadRequest)
				return
			}

			// Validasi pembayaran (Mock: Pastikan ada tanda tangan)
			sig, ok := payload["signature"].(string)
			if !ok || sig == "" {
				http.Error(w, "Missing signature in payment payload", http.StatusBadRequest)
				return
			}

			// --- INTEGRASI LEDGER ---
			// Gunakan signature sebagai Idempotency Key
			// Jika agen mengirim ulang header yang sama, tidak akan ditagih dua kali.
			ctx := r.Context()
			err = store.Do(ctx, func(tx ledger.Tx) error {
				_, err := tx.InsertEntry(ledger.Entry{
					Debit:          agentID,
					Credit:         "external", // Uang masuk ke provider API (external)
					Amount:         ledger.MicroUSD(priceMicroUSD),
					RefType:        "x402_payment",
					RefID:          payToAddress,
					IdempotencyKey: "x402_" + sig,
				})
				return err
			})

			if err != nil {
				// Jika saldo tidak cukup, Ledger akan mengembalikan ErrInsufficientBalance
				http.Error(w, "Payment failed: "+err.Error(), http.StatusPaymentRequired)
				return
			}

			// Jika valid, lanjutkan ke handler berikutnya
			next.ServeHTTP(w, r)
		}
	}
}
