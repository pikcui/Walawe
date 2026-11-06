package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
)

// X402Middleware mensimulasikan gerbang pembayaran HTTP 402
func X402Middleware(priceMicroUSD int64, payToAddress string) func(http.HandlerFunc) http.HandlerFunc {
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

			// Decode payload base64 (simulasi dari agen)
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

			// Validasi pembayaran (Mock: Pastikan ada tanda tangan dan jumlahnya sesuai)
			sig, ok := payload["signature"].(string)
			if !ok || sig == "" {
				http.Error(w, "Missing signature in payment payload", http.StatusBadRequest)
				return
			}

			// Di dunia nyata, kita akan memanggil Facilitator (misal: Coinbase) di sini
			// untuk memverifikasi EIP-3009 transferWithAuthorization menggunakan Smart Contract kita.
			// TODO(verify): Implement real EIP-712 signature verification.

			// Jika valid, catat ke Ledger dan lanjutkan ke handler berikutnya
			// (Kita nanti akan menghubungkan ini ke fungsi ledger).

			next.ServeHTTP(w, r)
		}
	}
}
