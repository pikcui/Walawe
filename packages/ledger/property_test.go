package ledger

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"testing"
	"time"
)

func allowed(err error, targets ...error) bool {
	if err == nil {
		return true
	}
	for _, target := range targets {
		if errors.Is(err, target) {
			return true
		}
	}
	return false
}

// checkInvariants verifies the properties that must hold after every operation.
func checkInvariants(t *testing.T, store *MemStore, seed int64, step int) {
	t.Helper()
	snap := store.Snapshot()

	var sum MicroUSD
	for _, balance := range snap.Balances {
		sum += balance
	}
	if sum != 0 {
		t.Fatalf("seed=%d step=%d: balances sum to %d, want 0 (debits must equal credits)", seed, step, sum)
	}

	for _, account := range []AccountID{acctCredit, acctHold, acctRevenue} {
		if snap.Balances[account] < 0 {
			t.Fatalf("seed=%d step=%d: account %s is negative: %d", seed, step, account, snap.Balances[account])
		}
	}

	var open MicroUSD
	for _, h := range snap.Holds {
		if h.Status == HoldOpen {
			open += h.Amount
		}
	}
	if snap.Balances[acctHold] != open {
		t.Fatalf("seed=%d step=%d: hold account = %d, open holds total %d", seed, step, snap.Balances[acctHold], open)
	}
}

func TestRandomOperationsPreserveInvariants(t *testing.T) {
	ctx := context.Background()
	for seed := int64(1); seed <= 300; seed++ {
		rng := rand.New(rand.NewSource(seed))
		l, store, clock := newTestLedger()
		var ids []string

		for step := 0; step < 200; step++ {
			switch rng.Intn(5) {
			case 0:
				amount := MicroUSD(rng.Int63n(1000) + 1)
				err := l.Credit(ctx, CreditParams{Source: acctExternal, Destination: acctCredit, Amount: amount, RefID: "topup", IdempotencyKey: fmt.Sprintf("topup-%d", step)})
				if err != nil {
					t.Fatalf("seed=%d step=%d credit: %v", seed, step, err)
				}
			case 1:
				id := fmt.Sprintf("req-%d", step)
				amount := MicroUSD(rng.Int63n(500) + 1)
				_, err := l.Reserve(ctx, reserveParams(id, amount))
				if err == nil {
					ids = append(ids, id)
				} else if !errors.Is(err, ErrInsufficientBalance) {
					t.Fatalf("seed=%d step=%d reserve: %v", seed, step, err)
				}
			case 2:
				if len(ids) == 0 {
					continue
				}
				id := ids[rng.Intn(len(ids))]
				h := store.Snapshot().Holds[id]
				actual := MicroUSD(rng.Int63n(int64(h.Amount) + 1))
				_, err := l.Settle(ctx, SettleParams{RequestID: id, Actual: actual, RevenueAccount: acctRevenue})
				if !allowed(err, ErrHoldNotOpen, ErrIdempotencyConflict) {
					t.Fatalf("seed=%d step=%d settle: %v", seed, step, err)
				}
			case 3:
				if len(ids) == 0 {
					continue
				}
				id := ids[rng.Intn(len(ids))]
				_, err := l.Release(ctx, id)
				if !allowed(err, ErrHoldNotOpen) {
					t.Fatalf("seed=%d step=%d release: %v", seed, step, err)
				}
			case 4:
				clock.Advance(time.Duration(rng.Intn(10)) * time.Minute)
				if _, err := l.ReleaseExpired(ctx, 100); err != nil {
					t.Fatalf("seed=%d step=%d release expired: %v", seed, step, err)
				}
			}
			checkInvariants(t, store, seed, step)
		}
	}
}
