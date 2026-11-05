package ledger

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"
)

const (
	acctExternal AccountID = "external"
	acctCredit   AccountID = "credit:agent-1"
	acctHold     AccountID = "hold:agent-1"
	acctRevenue  AccountID = "revenue:org-1"
)

type fakeClock struct {
	mu sync.Mutex
	t  time.Time
}

func newFakeClock() *fakeClock {
	return &fakeClock{t: time.Date(2026, 11, 5, 0, 0, 0, 0, time.UTC)}
}

func (c *fakeClock) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.t
}

func (c *fakeClock) Advance(d time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.t = c.t.Add(d)
}

func newTestLedger() (*Ledger, *MemStore, *fakeClock) {
	store := NewMemStore()
	clock := newFakeClock()
	return New(store, clock.Now), store, clock
}

func mustCredit(t *testing.T, l *Ledger, amount MicroUSD, key string) {
	t.Helper()
	err := l.Credit(context.Background(), CreditParams{Source: acctExternal, Destination: acctCredit, Amount: amount, RefID: "test", IdempotencyKey: key})
	if err != nil {
		t.Fatalf("credit: %v", err)
	}
}

func mustReserve(t *testing.T, l *Ledger, id string, amount MicroUSD) Hold {
	t.Helper()
	h, err := l.Reserve(context.Background(), reserveParams(id, amount))
	if err != nil {
		t.Fatalf("reserve %s: %v", id, err)
	}
	return h
}

func mustBalance(t *testing.T, l *Ledger, account AccountID, want MicroUSD) {
	t.Helper()
	got, err := l.Balance(context.Background(), account)
	if err != nil {
		t.Fatalf("balance(%s): %v", account, err)
	}
	if got != want {
		t.Fatalf("balance(%s) = %d, want %d", account, got, want)
	}
}

func reserveParams(id string, amount MicroUSD) ReserveParams {
	return ReserveParams{RequestID: id, CreditAccount: acctCredit, HoldAccount: acctHold, Amount: amount, TTL: 5 * time.Minute}
}

func TestCreditIsIdempotent(t *testing.T) {
	l, _, _ := newTestLedger()
	mustCredit(t, l, 1000, "k1")
	mustCredit(t, l, 1000, "k1")
	mustBalance(t, l, acctCredit, 1000)
	mustBalance(t, l, acctExternal, -1000)

	err := l.Credit(context.Background(), CreditParams{Source: acctExternal, Destination: acctCredit, Amount: 999, RefID: "test", IdempotencyKey: "k1"})
	if !errors.Is(err, ErrIdempotencyConflict) {
		t.Fatalf("got %v, want ErrIdempotencyConflict", err)
	}
	mustBalance(t, l, acctCredit, 1000)
}

func TestCreditRejectsInvalidInput(t *testing.T) {
	l, _, _ := newTestLedger()
	ctx := context.Background()
	base := CreditParams{Source: acctExternal, Destination: acctCredit, Amount: 10, RefID: "r", IdempotencyKey: "k"}

	zero := base
	zero.Amount = 0
	if err := l.Credit(ctx, zero); !errors.Is(err, ErrInvalidAmount) {
		t.Fatalf("zero amount: got %v, want ErrInvalidAmount", err)
	}

	negative := base
	negative.Amount = -5
	if err := l.Credit(ctx, negative); !errors.Is(err, ErrInvalidAmount) {
		t.Fatalf("negative amount: got %v, want ErrInvalidAmount", err)
	}

	same := base
	same.Destination = acctExternal
	if err := l.Credit(ctx, same); !errors.Is(err, ErrSameAccount) {
		t.Fatalf("same account: got %v, want ErrSameAccount", err)
	}

	noKey := base
	noKey.IdempotencyKey = ""
	if err := l.Credit(ctx, noKey); !errors.Is(err, ErrMissingIdempotencyKey) {
		t.Fatalf("missing key: got %v, want ErrMissingIdempotencyKey", err)
	}

	mustBalance(t, l, acctCredit, 0)
}

func TestReserveMovesFundsToHold(t *testing.T) {
	l, _, _ := newTestLedger()
	mustCredit(t, l, 1000, "fund")

	h := mustReserve(t, l, "req-1", 400)
	if h.Status != HoldOpen || h.Amount != 400 {
		t.Fatalf("hold = %+v, want open hold of 400", h)
	}
	mustBalance(t, l, acctCredit, 600)
	mustBalance(t, l, acctHold, 400)
}

func TestReserveInsufficientBalanceChangesNothing(t *testing.T) {
	l, store, _ := newTestLedger()
	mustCredit(t, l, 100, "fund")

	_, err := l.Reserve(context.Background(), reserveParams("req-1", 101))
	if !errors.Is(err, ErrInsufficientBalance) {
		t.Fatalf("got %v, want ErrInsufficientBalance", err)
	}
	mustBalance(t, l, acctCredit, 100)
	mustBalance(t, l, acctHold, 0)
	if _, ok := store.Snapshot().Holds["req-1"]; ok {
		t.Fatal("hold was created despite insufficient balance")
	}
}

func TestReserveIsIdempotent(t *testing.T) {
	l, _, _ := newTestLedger()
	mustCredit(t, l, 1000, "fund")

	first := mustReserve(t, l, "req-1", 400)
	second := mustReserve(t, l, "req-1", 400)
	if first != second {
		t.Fatalf("replay returned a different hold: %+v vs %+v", first, second)
	}
	mustBalance(t, l, acctCredit, 600)
	mustBalance(t, l, acctHold, 400)

	_, err := l.Reserve(context.Background(), reserveParams("req-1", 500))
	if !errors.Is(err, ErrIdempotencyConflict) {
		t.Fatalf("got %v, want ErrIdempotencyConflict", err)
	}
	mustBalance(t, l, acctCredit, 600)
}

func TestReserveRejectsInvalidInput(t *testing.T) {
	l, _, _ := newTestLedger()
	ctx := context.Background()
	mustCredit(t, l, 1000, "fund")

	if _, err := l.Reserve(ctx, reserveParams("", 10)); !errors.Is(err, ErrMissingRequestID) {
		t.Fatalf("empty id: got %v, want ErrMissingRequestID", err)
	}
	if _, err := l.Reserve(ctx, reserveParams("r", 0)); !errors.Is(err, ErrInvalidAmount) {
		t.Fatalf("zero amount: got %v, want ErrInvalidAmount", err)
	}
	noTTL := reserveParams("r", 10)
	noTTL.TTL = 0
	if _, err := l.Reserve(ctx, noTTL); !errors.Is(err, ErrInvalidTTL) {
		t.Fatalf("zero ttl: got %v, want ErrInvalidTTL", err)
	}
}

func TestSettleBillsActualAndReturnsRemainder(t *testing.T) {
	l, _, _ := newTestLedger()
	mustCredit(t, l, 1000, "fund")
	mustReserve(t, l, "req-1", 400)

	h, err := l.Settle(context.Background(), SettleParams{RequestID: "req-1", Actual: 150, RevenueAccount: acctRevenue})
	if err != nil {
		t.Fatalf("settle: %v", err)
	}
	if h.Status != HoldSettled || h.BilledAmount != 150 {
		t.Fatalf("hold = %+v, want settled with billed 150", h)
	}
	mustBalance(t, l, acctCredit, 850)
	mustBalance(t, l, acctHold, 0)
	mustBalance(t, l, acctRevenue, 150)
}

func TestSettleZeroActualReturnsEverything(t *testing.T) {
	l, _, _ := newTestLedger()
	mustCredit(t, l, 1000, "fund")
	mustReserve(t, l, "req-1", 400)

	if _, err := l.Settle(context.Background(), SettleParams{RequestID: "req-1", Actual: 0, RevenueAccount: acctRevenue}); err != nil {
		t.Fatalf("settle: %v", err)
	}
	mustBalance(t, l, acctCredit, 1000)
	mustBalance(t, l, acctHold, 0)
	mustBalance(t, l, acctRevenue, 0)
}

func TestSettleFullAmountLeavesNoRemainder(t *testing.T) {
	l, _, _ := newTestLedger()
	mustCredit(t, l, 1000, "fund")
	mustReserve(t, l, "req-1", 400)

	if _, err := l.Settle(context.Background(), SettleParams{RequestID: "req-1", Actual: 400, RevenueAccount: acctRevenue}); err != nil {
		t.Fatalf("settle: %v", err)
	}
	mustBalance(t, l, acctCredit, 600)
	mustBalance(t, l, acctHold, 0)
	mustBalance(t, l, acctRevenue, 400)
}

func TestSettleActualExceedingHoldIsRejected(t *testing.T) {
	l, store, _ := newTestLedger()
	mustCredit(t, l, 1000, "fund")
	mustReserve(t, l, "req-1", 400)

	_, err := l.Settle(context.Background(), SettleParams{RequestID: "req-1", Actual: 401, RevenueAccount: acctRevenue})
	if !errors.Is(err, ErrActualExceedsHold) {
		t.Fatalf("got %v, want ErrActualExceedsHold", err)
	}
	mustBalance(t, l, acctCredit, 600)
	mustBalance(t, l, acctHold, 400)
	mustBalance(t, l, acctRevenue, 0)
	if got := store.Snapshot().Holds["req-1"].Status; got != HoldOpen {
		t.Fatalf("hold status = %s, want open", got)
	}
}

func TestSettleErrors(t *testing.T) {
	l, _, _ := newTestLedger()
	ctx := context.Background()
	mustCredit(t, l, 1000, "fund")

	if _, err := l.Settle(ctx, SettleParams{RequestID: "missing", Actual: 1, RevenueAccount: acctRevenue}); !errors.Is(err, ErrHoldNotFound) {
		t.Fatalf("unknown hold: got %v, want ErrHoldNotFound", err)
	}
	if _, err := l.Settle(ctx, SettleParams{RequestID: "", Actual: 1, RevenueAccount: acctRevenue}); !errors.Is(err, ErrMissingRequestID) {
		t.Fatalf("empty id: got %v, want ErrMissingRequestID", err)
	}
	if _, err := l.Settle(ctx, SettleParams{RequestID: "x", Actual: -1, RevenueAccount: acctRevenue}); !errors.Is(err, ErrInvalidAmount) {
		t.Fatalf("negative actual: got %v, want ErrInvalidAmount", err)
	}
	mustReserve(t, l, "req-1", 400)
	if _, err := l.Settle(ctx, SettleParams{RequestID: "req-1", Actual: 10, RevenueAccount: ""}); !errors.Is(err, ErrMissingAccount) {
		t.Fatalf("missing revenue account: got %v, want ErrMissingAccount", err)
	}
	mustBalance(t, l, acctHold, 400)
}

func TestSettleIsIdempotent(t *testing.T) {
	l, _, _ := newTestLedger()
	ctx := context.Background()
	mustCredit(t, l, 1000, "fund")
	mustReserve(t, l, "req-1", 400)

	p := SettleParams{RequestID: "req-1", Actual: 150, RevenueAccount: acctRevenue}
	if _, err := l.Settle(ctx, p); err != nil {
		t.Fatalf("first settle: %v", err)
	}
	if _, err := l.Settle(ctx, p); err != nil {
		t.Fatalf("replayed settle: %v", err)
	}
	mustBalance(t, l, acctCredit, 850)
	mustBalance(t, l, acctRevenue, 150)

	different := p
	different.Actual = 200
	if _, err := l.Settle(ctx, different); !errors.Is(err, ErrIdempotencyConflict) {
		t.Fatalf("different actual: got %v, want ErrIdempotencyConflict", err)
	}
	if _, err := l.Release(ctx, "req-1"); !errors.Is(err, ErrHoldNotOpen) {
		t.Fatalf("release after settle: got %v, want ErrHoldNotOpen", err)
	}
	mustBalance(t, l, acctCredit, 850)
}

func TestReleaseReturnsFundsAndIsIdempotent(t *testing.T) {
	l, _, _ := newTestLedger()
	ctx := context.Background()
	mustCredit(t, l, 1000, "fund")
	mustReserve(t, l, "req-1", 400)

	h, err := l.Release(ctx, "req-1")
	if err != nil {
		t.Fatalf("release: %v", err)
	}
	if h.Status != HoldReleased {
		t.Fatalf("status = %s, want released", h.Status)
	}
	if _, err := l.Release(ctx, "req-1"); err != nil {
		t.Fatalf("replayed release: %v", err)
	}
	mustBalance(t, l, acctCredit, 1000)
	mustBalance(t, l, acctHold, 0)

	if _, err := l.Settle(ctx, SettleParams{RequestID: "req-1", Actual: 10, RevenueAccount: acctRevenue}); !errors.Is(err, ErrHoldNotOpen) {
		t.Fatalf("settle after release: got %v, want ErrHoldNotOpen", err)
	}
	if _, err := l.Release(ctx, "missing"); !errors.Is(err, ErrHoldNotFound) {
		t.Fatalf("unknown hold: got %v, want ErrHoldNotFound", err)
	}
}

func TestReleaseExpiredOnlyReleasesExpiredOpenHolds(t *testing.T) {
	l, _, clock := newTestLedger()
	ctx := context.Background()
	mustCredit(t, l, 1000, "fund")
	mustReserve(t, l, "old", 100)
	mustReserve(t, l, "settled", 100)
	if _, err := l.Settle(ctx, SettleParams{RequestID: "settled", Actual: 50, RevenueAccount: acctRevenue}); err != nil {
		t.Fatalf("settle: %v", err)
	}

	clock.Advance(4 * time.Minute)
	mustReserve(t, l, "fresh", 100)

	clock.Advance(2 * time.Minute)
	n, err := l.ReleaseExpired(ctx, 100)
	if err != nil {
		t.Fatalf("release expired: %v", err)
	}
	if n != 1 {
		t.Fatalf("released %d holds, want 1", n)
	}
	mustBalance(t, l, acctHold, 100)
	mustBalance(t, l, acctRevenue, 50)
	mustBalance(t, l, acctCredit, 850)

	n, err = l.ReleaseExpired(ctx, 100)
	if err != nil || n != 0 {
		t.Fatalf("second run = %d, %v; want 0, nil", n, err)
	}
}

func TestCancelledContextDoesNothing(t *testing.T) {
	l, _, _ := newTestLedger()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err := l.Credit(ctx, CreditParams{Source: acctExternal, Destination: acctCredit, Amount: 10, RefID: "r", IdempotencyKey: "k"})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("got %v, want context.Canceled", err)
	}
	mustBalance(t, l, acctCredit, 0)
}

func TestConcurrentReservesNeverOverspend(t *testing.T) {
	l, _, _ := newTestLedger()
	mustCredit(t, l, 1000, "fund")

	var wg sync.WaitGroup
	var mu sync.Mutex
	succeeded := 0
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_, err := l.Reserve(context.Background(), reserveParams(fmt.Sprintf("req-%d", i), 100))
			if err == nil {
				mu.Lock()
				succeeded++
				mu.Unlock()
				return
			}
			if !errors.Is(err, ErrInsufficientBalance) {
				t.Errorf("unexpected error: %v", err)
			}
		}(i)
	}
	wg.Wait()

	if succeeded != 10 {
		t.Fatalf("%d reservations succeeded, want exactly 10", succeeded)
	}
	mustBalance(t, l, acctCredit, 0)
	mustBalance(t, l, acctHold, 1000)
}
