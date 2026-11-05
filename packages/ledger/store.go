package ledger

import (
	"context"
	"time"
)

// Tx is a single atomic unit of work against a Store. All methods see the
// writes made earlier in the same Tx.
type Tx interface {
	// Balance returns credits minus debits for the account (0 if unknown).
	Balance(account AccountID) (MicroUSD, error)

	// HoldByRequestID returns the hold for a request, if any.
	HoldByRequestID(requestID string) (Hold, bool, error)

	// PutHold inserts or updates a hold, keyed by RequestID.
	PutHold(h Hold) error

	// InsertEntry appends an entry and applies it to balances. If an entry
	// with the same idempotency key and same debit, credit and amount already
	// exists it does nothing and returns false. If the key exists with
	// different values it returns ErrIdempotencyConflict.
	InsertEntry(e Entry) (inserted bool, err error)

	// ExpiredOpenHolds returns up to limit open holds with ExpiresAt <= now,
	// oldest first.
	ExpiredOpenHolds(now time.Time, limit int) ([]Hold, error)
}

// Store runs functions atomically. If fn returns an error, none of its writes
// may be applied. Implementations may call fn more than once (for example to
// retry after a serialization failure), so fn must not have side effects
// outside the Tx.
type Store interface {
	Do(ctx context.Context, fn func(Tx) error) error
}
