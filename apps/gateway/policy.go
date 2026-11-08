package main

import (
	"encoding/json"
	"net/http"
	"time"
)

// GET /admin/policy
func handleGetPolicy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}

	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var ruleJSON []byte
	err := dbPool.QueryRow(r.Context(), `
SELECT rule_json FROM policies 
WHERE agent_id = $1::uuid 
ORDER BY created_at DESC LIMIT 1
`, agentIDStr).Scan(&ruleJSON)

	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "policy_not_found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(ruleJSON)
}

// POST /admin/policy
func handleUpdatePolicy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
		return
	}

	agentIDStr, ok := r.Context().Value(agentIDKey).(string)
	if !ok || agentIDStr == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var newPolicy json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&newPolicy); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_json"})
		return
	}

	// Validasi minimal: pastikan JSON valid
	var testMap map[string]interface{}
	if err := json.Unmarshal(newPolicy, &testMap); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_policy_format"})
		return
	}

	// Karena sistem kita mengambil policy terbaru (ORDER BY created_at DESC),
	// Kita akan menyisipkan baris baru sebagai histori perubahan (Audit Trail).
	_, err := dbPool.Exec(r.Context(), `
INSERT INTO policies (agent_id, rule_json, created_at) 
VALUES ($1::uuid, $2::jsonb, $3)
`, agentIDStr, string(newPolicy), time.Now())

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db_insert_failed"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Policy updated successfully"})
}
