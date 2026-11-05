package ledger

import (
	"context"
	"time"
)

// Ledger performs money operations on top of a Store.
type Ledger struct {
	store Store
	now   func() time.Time
}

// New creates a Ledger on top of store. If now is nil, time.Now is used.
func New(store Store, now func() time.Time) *Ledger {
	if now == nil {
		now = time.Now
	}
	return &Ledger{store: store, now: now}
}

func validateEntry(debit, credit AccountID, amount MicroUSD) error {
	if amount <= 0 {
		return ErrInvalidAmount
	}
	if debit == "" || credit == "" {
		return ErrMissingAccount
	}
	if debit == credit {
		return ErrSameAccount
	}
	return nil
}

// CreditParams describes a top-up: Amount moves from Source (an external
// funding account) to Destination.
type CreditParams struct {
	Source         AccountID
	Destination    AccountID
	Amount         MicroUSD
	RefID          string
	IdempotencyKey string
}

// Credit adds funds to an account from a funding (external) account.
// It is idempotent on IdempotencyKey.
func (l *Ledger) Credit(ctx context.Context, p CreditParams) error {
	if err := validateEntry(p.Source, p.Destination, p.Amount); err != nil {
		return err
	}
	if p.IdempotencyKey == "" {
		return ErrMissingIdempotencyKey
	}
	return l.store.Do(ctx, func(tx Tx) error {
		_, err := tx.InsertEntry(Entry{Debit: p.Source, Credit: p.Destination, Amount: p.Amount, RefType: "topup", RefID: p.RefID, IdempotencyKey: p.IdempotencyKey})
		return err
	})
}

// ReserveParams describes a hold on funds for one request.
type ReserveParams struct {
	RequestID     string
	CreditAccount AccountID
	HoldAccount   AccountID
	Amount        MicroUSD
	TTL           time.Duration
}

// Reserve holds Amount from the credit account for one request. It fails with
// ErrInsufficientBalance if the credit account cannot cover it. It is
// idempotent on RequestID: repeating the same call returns the same hold, and
// repeating it with different parameters returns ErrIdempotencyConflict.
func (l *Ledger) Reserve(ctx context.Context, p ReserveParams) (Hold, error) {
	if p.RequestID == "" {
		return Hold{}, ErrMissingRequestID
	}
	if err := validateEntry(p.CreditAccount, p.HoldAccount, p.Amount); err != nil {
		return Hold{}, err
	}
	if p.TTL <= 0 {
		return Hold{}, ErrInvalidTTL
	}

	var out Hold
	err := l.store.Do(ctx, func(tx Tx) error {
		existing, found, err := tx.HoldByRequestID(p.RequestID)
		if err != nil {
			return err
		}
		if found {
			if existing.CreditAccount != p.CreditAccount || existing.HoldAccount != p.HoldAccount || existing.Amount != p.Amount {
				return ErrIdempotencyConflict
			}
			out = existing
			return nil
		}

		balance, err := tx.Balance(p.CreditAccount)
		if err != nil {
			return err
		}
		if balance < p.Amount {
			return ErrInsufficientBalance
		}

		if _, err := tx.InsertEntry(Entry{Debit: p.CreditAccount, Credit: p.HoldAccount, Amount: p.Amount, RefType: "reserve", RefID: p.RequestID, IdempotencyKey: "reserve:" + p.RequestID}); err != nil {
			return err
		}
		h := Hold{RequestID: p.RequestID, CreditAccount: p.CreditAccount, HoldAccount: p.HoldAccount, Amount: p.Amount, Status: HoldOpen, ExpiresAt: l.now().Add(p.TTL)}
		if err := tx.PutHold(h); err != nil {
			return err
		}
		out = h
		return nil
	})
	if err != nil {
		return Hold{}, err
	}
	return out, nil
}

// SettleParams describes the final billing of a hold.
type SettleParams struct {
	RequestID      string
	Actual         MicroUSD
	RevenueAccount AccountID
}

// Settle bills Actual to the revenue account and returns the unused remainder
// of the hold to the credit account. Actual may be 0 and must not exceed the
// held amount (ErrActualExceedsHold). Settling an already settled hold with the
// same Actual is a no-op; with a different Actual it is ErrIdempotencyConflict.
// A released hold cannot be settled (ErrHoldNotOpen).
func (l *Ledger) Settle(ctx context.Context, p SettleParams) (Hold, error) {
	if p.RequestID == "" {
		return Hold{}, ErrMissingRequestID
	}
	if p.Actual < 0 {
		return Hold{}, ErrInvalidAmount
	}

	var out Hold
	err := l.store.Do(ctx, func(tx Tx) error {
		h, found, err := tx.HoldByRequestID(p.RequestID)
		if err != nil {
			return err
		}
		if !found {
			return ErrHoldNotFound
		}
		switch h.Status {
		case HoldSettled:
			if h.BilledAmount == p.Actual {
				out = h
				return nil
			}
			return ErrIdempotencyConflict
		case HoldReleased:
			return ErrHoldNotOpen
		}
		if p.Actual > h.Amount {
			return ErrActualExceedsHold
		}

		if p.Actual > 0 {
			if err := validateEntry(h.HoldAccount, p.RevenueAccount, p.Actual); err != nil {
				return err
			}
			if _, err := tx.InsertEntry(Entry{Debit: h.HoldAccount, Credit: p.RevenueAccount, Amount: p.Actual, RefType: "settle", RefID: h.RequestID, IdempotencyKey: "settle:" + h.RequestID + "#billed"}); err != nil {
				return err
			}
		}
		remainder := h.Amount - p.Actual
		if remainder > 0 {
			if _, err := tx.InsertEntry(Entry{Debit: h.HoldAccount, Credit: h.CreditAccount, Amount: remainder, RefType: "settle", RefID: h.RequestID, IdempotencyKey: "settle:" + h.RequestID + "#remainder"}); err != nil {
				return err
			}
		}

		h.Status = HoldSettled
		h.BilledAmount = p.Actual
		h.SettledAt = l.now()
		if err := tx.PutHold(h); err != nil {
			return err
		}
		out = h
		return nil
	})
	if err != nil {
		return Hold{}, err
	}
	return out, nil
}

// Release returns the whole held amount to the credit account. Releasing an
// already released hold is a no-op. A settled hold cannot be released
// (ErrHoldNotOpen).
func (l *Ledger) Release(ctx context.Context, requestID string) (Hold, error) {
	if requestID == "" {
		return Hold{}, ErrMissingRequestID
	}

	var out Hold
	err := l.store.Do(ctx, func(tx Tx) error {
		h, found, err := tx.HoldByRequestID(requestID)
		if err != nil {
			return err
		}
		if !found {
			return ErrHoldNotFound
		}
		switch h.Status {
		case HoldReleased:
			out = h
			return nil
		case HoldSettled:
			return ErrHoldNotOpen
		}
		out, err = releaseHold(tx, h, l.now())
		return err
	})
	if err != nil {
		return Hold{}, err
	}
	return out, nil
}

// ReleaseExpired releases up to limit open holds whose TTL has passed and
// returns how many were released. If limit is not positive it defaults to 100.
func (l *Ledger) ReleaseExpired(ctx context.Context, limit int) (int, error) {
	if limit <= 0 {
		limit = 100
	}

	released := 0
	err := l.store.Do(ctx, func(tx Tx) error {
		released = 0
		now := l.now()
		holds, err := tx.ExpiredOpenHolds(now, limit)
		if err != nil {
			return err
		}
		for _, h := range holds {
			if _, err := releaseHold(tx, h, now); err != nil {
				return err
			}
			released++
		}
		return nil
	})
	if err != nil {
		return 0, err
	}
	return released, nil
}

// Balance returns the balance (credits minus debits) of an account.
func (l *Ledger) Balance(ctx context.Context, account AccountID) (MicroUSD, error) {
	var balance MicroUSD
	err := l.store.Do(ctx, func(tx Tx) error {
		var err error
		balance, err = tx.Balance(account)
		return err
	})
	return balance, err
}

func releaseHold(tx Tx, h Hold, now time.Time) (Hold, error) {
	if _, err := tx.InsertEntry(Entry{Debit: h.HoldAccount, Credit: h.CreditAccount, Amount: h.Amount, RefType: "release", RefID: h.RequestID, IdempotencyKey: "release:" + h.RequestID}); err != nil {
		return Hold{}, err
	}
	h.Status = HoldReleased
	h.SettledAt = now
	if err := tx.PutHold(h); err != nil {
		return Hold{}, err
	}
	return h, nil
}
