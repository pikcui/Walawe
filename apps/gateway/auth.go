package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
)

type contextKey string

const agentIDKey contextKey = "agentID"

func hashKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
			return
		}

		rawKey := strings.TrimPrefix(authHeader, "Bearer ")
		keyHash := hashKey(rawKey)

		var agentID string
		// Perhatikan tambahan ::text di sini
		err := dbPool.QueryRow(r.Context(), "SELECT agent_id::text FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL", keyHash).Scan(&agentID)
		if err != nil {
			http.Error(w, "Invalid API key", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), agentIDKey, agentID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
