package ledger

import (
"context"
"errors"
"time"

"github.com/jackc/pgx/v5"
"github.com/jackc/pgx/v5/pgconn" // <-- Diperbaiki (import pgconn)
"github.com/jackc/pgx/v5/pgxpool"
)

type PgStore struct {
pool *pgxpool.Pool
}

func NewPgStore(pool *pgxpool.Pool) *PgStore {
return &PgStore{pool: pool}
}

// Do runs fn inside a serializable transaction. Retries on serialization failure.
func (s *PgStore) Do(ctx context.Context, fn func(Tx) error) error {
for i := 0; i < 3; i++ {
tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
if err != nil {
return err
}

err = fn(&pgTx{tx: tx})
if err != nil {
tx.Rollback(ctx)
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) && pgErr.Code == "40001" { // serialization_failure
continue
}
return err
}

err = tx.Commit(ctx)
if err == nil {
return nil
}

var pgErr *pgconn.PgError
if errors.As(err, &pgErr) && pgErr.Code == "40001" {
continue
}
return err
}
return errors.New("transaction retry limit exceeded")
}

type pgTx struct {
tx pgx.Tx
}

func (t *pgTx) Balance(account AccountID) (MicroUSD, error) {
var bal int64
err := t.tx.QueryRow(context.Background(), "SELECT balance FROM accounts WHERE id = $1", string(account)).Scan(&bal)
if errors.Is(err, pgx.ErrNoRows) {
return 0, nil
}
return MicroUSD(bal), err
}

func (t *pgTx) HoldByRequestID(requestID string) (Hold, bool, error) {
var h Hold
var credit, holdAcc, status string
var amt, billed int64
var exp, settled time.Time

err := t.tx.QueryRow(context.Background(), 
"SELECT request_id, credit_account, hold_account, amount, billed_amount, status, expires_at, settled_at FROM holds WHERE request_id = $1", 
requestID).Scan(&h.RequestID, &credit, &holdAcc, &amt, &billed, &status, &exp, &settled)

if errors.Is(err, pgx.ErrNoRows) {
return Hold{}, false, nil
}
if err != nil {
return Hold{}, false, err
}

h.CreditAccount = AccountID(credit)
h.HoldAccount = AccountID(holdAcc)
h.Amount = MicroUSD(amt)
h.BilledAmount = MicroUSD(billed)
h.Status = HoldStatus(status)
h.ExpiresAt = exp
h.SettledAt = settled

return h, true, nil
}

func (t *pgTx) PutHold(h Hold) error {
_, err := t.tx.Exec(context.Background(), `
INSERT INTO holds (request_id, credit_account, hold_account, amount, billed_amount, status, expires_at, settled_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (request_id) DO UPDATE SET
billed_amount = EXCLUDED.billed_amount,
status = EXCLUDED.status,
settled_at = EXCLUDED.settled_at`,
h.RequestID, string(h.CreditAccount), string(h.HoldAccount), int64(h.Amount), int64(h.BilledAmount), string(h.Status), h.ExpiresAt, h.SettledAt)
return err
}

func (t *pgTx) InsertEntry(e Entry) (bool, error) {
// 1. Check idempotency
var existing MicroUSD // <-- Diperbaiki (sebelumnya Amount)
var debit, credit string
err := t.tx.QueryRow(context.Background(), 
"SELECT amount, debit, credit FROM entries WHERE idempotency_key = $1", 
e.IdempotencyKey).Scan(&existing, &debit, &credit)

if err == nil {
if existing != e.Amount || debit != string(e.Debit) || credit != string(e.Credit) {
return false, ErrIdempotencyConflict
}
return false, nil // already applied
} else if !errors.Is(err, pgx.ErrNoRows) {
return false, err
}

// 2. Insert entry
_, err = t.tx.Exec(context.Background(), `
INSERT INTO entries (debit, credit, amount, ref_type, ref_id, idempotency_key)
VALUES ($1, $2, $3, $4, $5, $6)`,
string(e.Debit), string(e.Credit), int64(e.Amount), e.RefType, e.RefID, e.IdempotencyKey)
if err != nil {
return false, err
}

// 3. Update balances (lock rows to prevent race conditions)
// Debit account decreases
_, err = t.tx.Exec(context.Background(), 
"UPDATE accounts SET balance = balance - $1 WHERE id = $2", 
int64(e.Amount), string(e.Debit))
if err != nil {
return false, err
}

// Credit account increases
_, err = t.tx.Exec(context.Background(), 
"UPDATE accounts SET balance = balance + $1 WHERE id = $2", 
int64(e.Amount), string(e.Credit))
if err != nil {
return false, err
}

return true, nil
}

func (t *pgTx) ExpiredOpenHolds(now time.Time, limit int) ([]Hold, error) {
rows, err := t.tx.Query(context.Background(), 
"SELECT request_id, credit_account, hold_account, amount, billed_amount, status, expires_at, settled_at FROM holds WHERE status = 'open' AND expires_at <= $1 ORDER BY expires_at ASC LIMIT $2", 
now, limit)
if err != nil {
return nil, err
}
defer rows.Close()

var holds []Hold
for rows.Next() {
var h Hold
var credit, holdAcc, status string
var amt, billed int64
var exp, settled time.Time

err := rows.Scan(&h.RequestID, &credit, &holdAcc, &amt, &billed, &status, &exp, &settled)
if err != nil {
return nil, err
}
h.CreditAccount = AccountID(credit)
h.HoldAccount = AccountID(holdAcc)
h.Amount = MicroUSD(amt)
h.BilledAmount = MicroUSD(billed)
h.Status = HoldStatus(status)
h.ExpiresAt = exp
h.SettledAt = settled
holds = append(holds, h)
}
return holds, rows.Err()
}
