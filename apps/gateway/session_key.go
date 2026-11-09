package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum/common"
)

func cleanPEM(pemStr string) string {
	decoded, err := base64.StdEncoding.DecodeString(pemStr)
	if err == nil && strings.Contains(string(decoded), "-----BEGIN PRIVATE KEY-----") {
		return string(decoded)
	}
	pemStr = strings.TrimSpace(pemStr)
	pemStr = strings.Trim(pemStr, "\"")
	pemStr = strings.ReplaceAll(pemStr, "\\n", "\n")
	return pemStr
}

func handleGetRSAPublicKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	privKeyPEM := cleanPEM(os.Getenv("RSA_PRIVATE_KEY_PEM"))
	if privKeyPEM == "" {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	block, _ := pem.Decode([]byte(privKeyPEM))
	if block == nil {
		http.Error(w, "Failed to parse PEM block", http.StatusInternalServerError)
		return
	}
	privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		http.Error(w, "Failed to parse Private Key", http.StatusInternalServerError)
		return
	}
	rsaPrivKey, ok := privKey.(*rsa.PrivateKey)
	if !ok {
		http.Error(w, "Key is not RSA", http.StatusInternalServerError)
		return
	}
	pubKeyBytes, err := x509.MarshalPKIXPublicKey(&rsaPrivKey.PublicKey)
	if err != nil {
		http.Error(w, "Failed to marshal Public Key", http.StatusInternalServerError)
		return
	}
	pubKeyPEM := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubKeyBytes})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"publicKey": string(pubKeyPEM)})
}

func handleGenerateSessionKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var req struct {
		EncryptedPrivateKey string `json:"encryptedPrivateKey"`
		AgentPublicAddress  string `json:"agentPublicAddress"`
		TxHash              string `json:"txHash"`
		ValidUntil          int64  `json:"validUntil"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	privKeyPEM := cleanPEM(os.Getenv("RSA_PRIVATE_KEY_PEM"))
	block, _ := pem.Decode([]byte(privKeyPEM))
	privKey, _ := x509.ParsePKCS8PrivateKey(block.Bytes)
	rsaPrivKey := privKey.(*rsa.PrivateKey)
	encryptedBytes, _ := base64.StdEncoding.DecodeString(req.EncryptedPrivateKey)

	// PERBAIKAN 1: Gunakan := untuk mendeklarasikan decryptedBytes dan err
	decryptedBytes, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, rsaPrivKey, encryptedBytes, nil)
	if err != nil {
		http.Error(w, "Failed to decrypt", http.StatusInternalServerError)
		return
	}
	if len(decryptedBytes) == 0 {
		http.Error(w, "Decrypted key is empty", http.StatusBadRequest)
		return
	}

	createTableQuery := `
CREATE TABLE IF NOT EXISTS agent_session_keys (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
agent_public_address VARCHAR(42) NOT NULL UNIQUE,
encrypted_private_key TEXT NOT NULL,
tx_hash VARCHAR(66) NOT NULL,
valid_until BIGINT NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`
	_, _ = dbPool.Exec(context.Background(), createTableQuery)
	query := `
INSERT INTO agent_session_keys (agent_id, agent_public_address, encrypted_private_key, tx_hash, valid_until, created_at) 
VALUES ($1::uuid, $2, $3, $4, $5, now())
ON CONFLICT (agent_public_address) DO UPDATE SET encrypted_private_key = EXCLUDED.encrypted_private_key;
`
	_, err = dbPool.Exec(context.Background(), query, agentIDStr, req.AgentPublicAddress, req.EncryptedPrivateKey, req.TxHash, req.ValidUntil)
	if err != nil {
		http.Error(w, "DB error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "success", "status": "success"})
}

func handleTestSettlement(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		AgentPublicAddress string `json:"agentPublicAddress"`
		Destination        string `json:"destination"`
		AmountWei          string `json:"amountWei"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	var encryptedKey string
	err := dbPool.QueryRow(r.Context(), "SELECT encrypted_private_key FROM agent_session_keys WHERE agent_public_address = $1", req.AgentPublicAddress).Scan(&encryptedKey)
	if err != nil {
		http.Error(w, "Session key not found in DB", http.StatusNotFound)
		return
	}

	privKeyPEM := cleanPEM(os.Getenv("RSA_PRIVATE_KEY_PEM"))
	block, _ := pem.Decode([]byte(privKeyPEM))
	privKey, _ := x509.ParsePKCS8PrivateKey(block.Bytes)
	rsaPrivKey := privKey.(*rsa.PrivateKey)
	encryptedBytes, _ := base64.StdEncoding.DecodeString(encryptedKey)

	// PERBAIKAN 2: Di sini decryptedBytes BENAR-BENAR dipakai untuk Pimlico
	decryptedBytes, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, rsaPrivKey, encryptedBytes, nil)
	if err != nil {
		http.Error(w, "Failed to decrypt key", http.StatusInternalServerError)
		return
	}

	smartAccount := common.HexToAddress("0xb3e2D0A16bBC1d7b8c3543aEB458D22ddD961F68")
	entryPoint := common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789")
	dest := common.HexToAddress(req.Destination)
	amount := new(big.Int)
	amount.SetString(req.AmountWei, 10)

	txHash, err := SendTransactionViaPimlico(r.Context(), smartAccount, entryPoint, string(decryptedBytes), dest, amount)
	if err != nil {
		log.Printf("Bundler error: %v", err)
		http.Error(w, fmt.Sprintf("Bundler error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"txHash": txHash,
	})
}
