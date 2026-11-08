package main

import (
	"encoding/json"
	"net/http"
	"time"
)

// GET /admin/api-keys
func handleGetAPIKeys(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}

	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	rows, err := dbPool.Query(r.Context(), `
SELECT id::text, key_hash, created_at 
FROM api_keys 
WHERE agent_id = $1::uuid AND revoked_at IS NULL
ORDER BY created_at DESC
`, agentIDStr)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db_query_failed"})
		return
	}
	defer rows.Close()

	var keys []map[string]interface{}
	for rows.Next() {
		var id, keyHash string
		var createdAt time.Time
		if err := rows.Scan(&id, &keyHash, &createdAt); err != nil {
			continue
		}
		// Tampilkan hanya 8 karakter pertama dari hash untuk indikator visual
		maskedHash := "wlw_****" + keyHash[len(keyHash)-8:]
		keys = append(keys, map[string]interface{}{
			"id":         id,
			"masked_key": maskedHash,
			"created_at": createdAt,
		})
	}

	writeJSON(w, http.StatusOK, keys)
}

// POST /admin/api-keys (Generate New)
func handleCreateAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}

	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	plainKey, keyHash, err := generateAPIKey() // fungsi dari admin_auth.go
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "keygen_failed"})
		return
	}

	_, err = dbPool.Exec(r.Context(), `
INSERT INTO api_keys (agent_id, key_hash) VALUES ($1::uuid, $2)
`, agentIDStr, keyHash)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db_insert_failed"})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"message": "API Key generated successfully",
		"api_key": plainKey, // Hanya dikembalikan sekali
	})
}

// POST /admin/api-keys/revoke (Revoke Key)
func handleRevokeAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}

	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_json"})
		return
	}

	// Update revoked_at, pastikan hanya bisa revoke key milik agent sendiri
	tag, err := dbPool.Exec(r.Context(), `
UPDATE api_keys SET revoked_at = now() 
WHERE id = $1::uuid AND agent_id = $2::uuid
`, req.ID, agentIDStr)

	if err != nil || tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "key_not_found_or_unauthorized"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "API Key revoked"})
}
