package main

import (
"context"
"crypto/rand"
"crypto/sha256"
"encoding/hex"
"encoding/json"
"errors"
"log"
"net"
"net/http"
"net/mail"
"os"
"strings"
"time"

"github.com/golang-jwt/jwt/v5"
"github.com/jackc/pgx/v5/pgconn"
"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte(getEnv("JWT_SECRET", "super_secret_dev_key"))

func getEnv(key, fallback string) string {
if value, exists := os.LookupEnv(key); exists {
return value
}
return fallback
}

type CustomClaims struct {
Role    string `json:"role"`
AgentID string `json:"agent_id"`
jwt.RegisteredClaims
}

func handleAdminLogin(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
return
}

var creds struct {
Email    string `json:"email"`
Password string `json:"password"`
}
if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
http.Error(w, "Invalid request", http.StatusBadRequest)
return
}

var storedHash, role, agentID string
err := dbPool.QueryRow(r.Context(), "SELECT password_hash, role, COALESCE(agent_id::text, '') FROM users WHERE email = $1", creds.Email).Scan(&storedHash, &role, &agentID)
if err != nil {
http.Error(w, "Invalid credentials", http.StatusUnauthorized)
return
}

err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(creds.Password))
if err != nil {
http.Error(w, "Invalid credentials", http.StatusUnauthorized)
return
}

expirationTime := time.Now().Add(24 * time.Hour)
claims := &CustomClaims{
Role:    role,
AgentID: agentID,
RegisteredClaims: jwt.RegisteredClaims{
Subject:   creds.Email,
ExpiresAt: jwt.NewNumericDate(expirationTime),
},
}

token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
tokenString, err := token.SignedString(jwtKey)
if err != nil {
http.Error(w, "Failed to generate token", http.StatusInternalServerError)
return
}

w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(map[string]string{"token": tokenString, "role": role})
}

func AdminAuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
authHeader := r.Header.Get("Authorization")
if !strings.HasPrefix(authHeader, "Bearer ") {
http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
return
}

tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
claims := &CustomClaims{}

token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
return jwtKey, nil
})

if err != nil || !token.Valid {
http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
return
}

ctx := context.WithValue(r.Context(), agentIDKey, claims.AgentID)
next.ServeHTTP(w, r.WithContext(ctx))
}
}

func AdminOnlyMiddleware(next http.HandlerFunc) http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
authHeader := r.Header.Get("Authorization")
if !strings.HasPrefix(authHeader, "Bearer ") {
http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
return
}

tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
claims := &CustomClaims{}

token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
return jwtKey, nil
})

if err != nil || !token.Valid {
http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
return
}

if claims.Role != "admin" {
http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
return
}

ctx := context.WithValue(r.Context(), agentIDKey, claims.AgentID)
next.ServeHTTP(w, r.WithContext(ctx))
}
}

func handleCreateUser(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
return
}

var req struct {
Email    string `json:"email"`
Password string `json:"password"`
Role     string `json:"role"`
}
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
http.Error(w, "Invalid JSON", http.StatusBadRequest)
return
}

if req.Role != "admin" && req.Role != "viewer" {
http.Error(w, "Invalid role", http.StatusBadRequest)
return
}

hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
if err != nil {
http.Error(w, "Failed to hash password", http.StatusInternalServerError)
return
}

defaultAgentID := "11111111-1111-1111-1111-111111111111"
_, err = dbPool.Exec(r.Context(),
"INSERT INTO users (email, password_hash, role, agent_id) VALUES ($1, $2, $3, $4::uuid)",
req.Email, string(hashedPassword), req.Role, defaultAgentID)

if err != nil {
http.Error(w, "Failed to create user (email might already exist)", http.StatusConflict)
return
}

w.WriteHeader(http.StatusCreated)
w.Write([]byte("User created successfully"))
}

// ============================================================
// FASE 3: REGISTRASI (POST /admin/register)
// ============================================================

type registerRequest struct {
Email     string `json:"email"`
Password  string `json:"password"`
OrgName   string `json:"org_name"`
AgentName string `json:"agent_name"`
}

type registerResponse struct {
UserID         string `json:"user_id"`
AgentID        string `json:"agent_id"`
OrganizationID string `json:"organization_id"`
APIKey         string `json:"api_key"`
Message        string `json:"message"`
}

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(code)
_ = json.NewEncoder(w).Encode(v)
}

func generateAPIKey() (plain, hashHex string, err error) {
buf := make([]byte, 32)
if _, err = rand.Read(buf); err != nil {
return "", "", err
}
plain = "wlw_" + hex.EncodeToString(buf)
sum := sha256.Sum256([]byte(plain))
return plain, hex.EncodeToString(sum[:]), nil
}

func isValidEmail(s string) bool {
if len(s) < 5 || len(s) > 254 {
return false
}
addr, err := mail.ParseAddress(s)
if err != nil {
return false
}
return addr.Address == s && strings.Contains(addr.Address, ".")
}

func clientIP(r *http.Request) string {
if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
if i := strings.IndexByte(xff, ','); i > 0 {
return strings.TrimSpace(xff[:i])
}
return strings.TrimSpace(xff)
}
if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
return host
}
return r.RemoteAddr
}

func allowRegisterRate(ctx context.Context, ip string) bool {
if redisClient == nil {
return true
}
key := "rate:register:" + ip
val, err := redisClient.Incr(ctx, key).Result()
if err != nil {
log.Printf("register: rate limit incr failed: %v", err)
return true
}
if val == 1 {
redisClient.Expire(ctx, key, time.Minute)
}
return val <= 5
}

func handleAdminRegister(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method_not_allowed"})
return
}

if !allowRegisterRate(r.Context(), clientIP(r)) {
writeJSON(w, http.StatusTooManyRequests, map[string]string{
"error":   "rate_limited",
"message": "Maksimal 5 registrasi per menit dari IP ini.",
})
return
}

var req registerRequest
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_json"})
return
}

req.Email = strings.ToLower(strings.TrimSpace(req.Email))
req.OrgName = strings.TrimSpace(req.OrgName)
req.AgentName = strings.TrimSpace(req.AgentName)
if req.AgentName == "" {
req.AgentName = "Default Agent"
}

if !isValidEmail(req.Email) {
writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_email"})
return
}
if len(req.Password) < 12 {
writeJSON(w, http.StatusBadRequest, map[string]string{"error": "password_too_short", "min": "12"})
return
}
if len(req.OrgName) < 1 || len(req.OrgName) > 64 {
writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_org_name"})
return
}
if len(req.AgentName) > 64 {
writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_agent_name"})
return
}

ctx := r.Context()
tx, err := dbPool.Begin(ctx)
if err != nil {
log.Printf("register: begin tx failed: %v", err)
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "db_begin_failed"})
return
}
defer tx.Rollback(ctx)

var orgID, agentID, userID string

if err := tx.QueryRow(ctx,
`INSERT INTO organizations (name) VALUES ($1) RETURNING id::text`,
req.OrgName,
).Scan(&orgID); err != nil {
log.Printf("register: org insert failed: %v", err)
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "org_insert_failed"})
return
}

if err := tx.QueryRow(ctx,
`INSERT INTO agents (organization_id, name, status) VALUES ($1::uuid, $2, 'active') RETURNING id::text`,
orgID, req.AgentName,
).Scan(&agentID); err != nil {
log.Printf("register: agent insert failed: %v", err)
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "agent_insert_failed"})
return
}

if _, err := tx.Exec(ctx,
`INSERT INTO accounts (id, balance) VALUES ($1, 0), ($2, 0)`,
agentID, "hold_"+agentID,
); err != nil {
log.Printf("register: accounts insert failed: %v", err)
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "account_insert_failed"})
return
}

plainKey, keyHash, err := generateAPIKey()
if err != nil {
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "keygen_failed"})
return
}
if _, err := tx.Exec(ctx,
`INSERT INTO api_keys (agent_id, key_hash) VALUES ($1::uuid, $2)`,
agentID, keyHash,
); err != nil {
log.Printf("register: api_key insert failed: %v", err)
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "api_key_insert_failed"})
return
}

pwdHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
if err != nil {
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "hash_failed"})
return
}
if err := tx.QueryRow(ctx,
`INSERT INTO users (email, password_hash, role, agent_id) VALUES ($1, $2, 'admin', $3::uuid) RETURNING id::text`,
req.Email, string(pwdHash), agentID,
).Scan(&userID); err != nil {
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) && pgErr.Code == "23505" {
writeJSON(w, http.StatusConflict, map[string]string{"error": "email_already_registered"})
return
}
log.Printf("register: user insert failed: %v", err)
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "user_insert_failed"})
return
}

defaultPolicy := `{"allowed_models":["gpt-4o-mini","claude-haiku-4-5"],"max_per_tx_micro_usd":1000000,"daily_limit_micro_usd":10000000}`
if _, err := tx.Exec(ctx,
`INSERT INTO policies (agent_id, rule_json) VALUES ($1::uuid, $2::jsonb)`,
agentID, defaultPolicy,
); err != nil {
log.Printf("register: policy insert failed: %v", err)
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "policy_insert_failed"})
return
}

if err := tx.Commit(ctx); err != nil {
log.Printf("register: commit failed: %v", err)
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "commit_failed"})
return
}

writeJSON(w, http.StatusCreated, registerResponse{
UserID:         userID,
AgentID:        agentID,
OrganizationID: orgID,
APIKey:         plainKey,
Message:        "Simpan API key ini. Hanya ditampilkan sekali.",
})
}
