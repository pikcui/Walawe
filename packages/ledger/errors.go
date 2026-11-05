package ledger

import "errors"

var (
	ErrInvalidAmount         = errors.New("ledger: amount must be positive")
	ErrOverflow              = errors.New("ledger: amount overflows int64 micro-USD")
	ErrMissingAccount        = errors.New("ledger: account is required")
	ErrSameAccount           = errors.New("ledger: debit and credit accounts must differ")
	ErrMissingIdempotencyKey = errors.New("ledger: idempotency key is required")
	ErrMissingRequestID      = errors.New("ledger: request id is required")
	ErrInvalidTTL            = errors.New("ledger: hold ttl must be positive")
	ErrInsufficientBalance   = errors.New("ledger: insufficient balance")
	ErrHoldNotFound          = errors.New("ledger: hold not found")
	ErrHoldNotOpen           = errors.New("ledger: hold is not open")
	ErrActualExceedsHold     = errors.New("ledger: actual amount exceeds held amount")
	ErrIdempotencyConflict   = errors.New("ledger: idempotency key reused with different parameters")
)
