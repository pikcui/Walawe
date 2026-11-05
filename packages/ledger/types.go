package ledger

import "time"

// AccountID identifies a ledger account. It is opaque to the ledger package.
type AccountID string

// Entry moves Amount from the Debit account to the Credit account.
type Entry struct {
	ID             int64
	Debit          AccountID
	Credit         AccountID
	Amount         MicroUSD
	RefType        string
	RefID          string
	IdempotencyKey string
}

// HoldStatus is the lifecycle state of a hold.
type HoldStatus string

const (
	HoldOpen     HoldStatus = "open"
	HoldSettled  HoldStatus = "settled"
	HoldReleased HoldStatus = "released"
)

// Hold is funds reserved for one request.
// BilledAmount is set when the hold is settled. SettledAt is set when the
// hold is settled or released.
type Hold struct {
	RequestID     string
	CreditAccount AccountID
	HoldAccount   AccountID
	Amount        MicroUSD
	BilledAmount  MicroUSD
	Status        HoldStatus
	ExpiresAt     time.Time
	SettledAt     time.Time
}
