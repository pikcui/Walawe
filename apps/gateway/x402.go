package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	walawcrypto "github.com/pikcui/Walawe/packages/crypto"
	"github.com/pikcui/Walawe/packages/ledger"
)

func X402Middleware(store *ledger.PgStore, priceMicroUSD int64, payToAddress string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			paymentHeader := r.Header.Get("X-PAYMENT")

			if paymentHeader == "" {
				w.Header().Set("X-PRICE", fmt.Sprintf("%d", priceMicroUSD))
				w.Header().Set("X-PAY-TO", payToAddress)
				w.WriteHeader(http.StatusPaymentRequired)
				w.Write([]byte("Payment Required"))
				return
			}

			agentIDStr, ok := r.Context().Value(agentIDKey).(string)
			if !ok || agentIDStr == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			agentID := ledger.AccountID(agentIDStr)

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

			sig, ok := payload["signature"].(string)
			if !ok || sig == "" {
				http.Error(w, "Missing signature", http.StatusBadRequest)
				return
			}

			// --- VERIFIKASI KRIPTOGRAFI ---
			// Ambil wallet_address milik agen dari database
			var expectedWallet string
			err = dbPool.QueryRow(r.Context(), "SELECT wallet_address FROM agents WHERE id = $1", agentIDStr).Scan(&expectedWallet)
			if err != nil || expectedWallet == "" {
				http.Error(w, "Agent wallet not configured", http.StatusForbidden)
				return
			}

			// Pesan yang ditandatangani (bisa berupa string apapun, misal ID transaksi)
			message := fmt.Sprintf("Walawe x402 Payment: %d to %s", priceMicroUSD, payToAddress)
			recoveredAddress, err := walawcrypto.VerifySignature(message, sig)
			if err != nil {
				http.Error(w, "Invalid signature cryptography: "+err.Error(), http.StatusBadRequest)
				return
			}

			if recoveredAddress != expectedWallet {
				http.Error(w, "Signature does not match agent's wallet", http.StatusForbidden)
				return
			}

			// --- INTEGRASI LEDGER ---
			ctx := r.Context()
			err = store.Do(ctx, func(tx ledger.Tx) error {
				_, err := tx.InsertEntry(ledger.Entry{
					Debit:          agentID,
					Credit:         "external",
					Amount:         ledger.MicroUSD(priceMicroUSD),
					RefType:        "x402_payment",
					RefID:          payToAddress,
					IdempotencyKey: "x402_" + sig,
				})
				return err
			})

			if err != nil {
				http.Error(w, "Payment failed: "+err.Error(), http.StatusPaymentRequired)
				return
			}

			next.ServeHTTP(w, r)
		}
	}
}
