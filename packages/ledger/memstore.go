package ledger

import (
	"context"
	"sort"
	"sync"
	"time"
)

// MemStore is an in-memory Store for tests.
type MemStore struct {
	mu    sync.Mutex
	state memState
}

type memState struct {
	nextID   int64
	entries  []Entry
	byKey    map[string]Entry
	balances map[AccountID]MicroUSD
	holds    map[string]Hold
}

func newMemState() memState {
	return memState{byKey: map[string]Entry{}, balances: map[AccountID]MicroUSD{}, holds: map[string]Hold{}}
}

func (s memState) clone() memState {
	c := newMemState()
	c.nextID = s.nextID
	c.entries = append(c.entries, s.entries...)
	for k, v := range s.byKey {
		c.byKey[k] = v
	}
	for k, v := range s.balances {
		c.balances[k] = v
	}
	for k, v := range s.holds {
		c.holds[k] = v
	}
	return c
}

// NewMemStore returns an empty in-memory Store. It serializes all
// transactions, so it is safe for concurrent use. It is intended for tests.
func NewMemStore() *MemStore {
	return &MemStore{state: newMemState()}
}

// Do runs fn on a copy of the state and commits it only if fn succeeds.
func (s *MemStore) Do(ctx context.Context, fn func(Tx) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	work := s.state.clone()
	if err := fn(&memTx{st: &work}); err != nil {
		return err
	}
	s.state = work
	return nil
}

// Snapshot is a read-only copy of a MemStore, for assertions in tests.
type Snapshot struct {
	Balances map[AccountID]MicroUSD
	Holds    map[string]Hold
	Entries  int
}

// Snapshot returns a copy of all balances, holds and the entry count.
func (s *MemStore) Snapshot() Snapshot {
	s.mu.Lock()
	defer s.mu.Unlock()

	snap := Snapshot{Balances: map[AccountID]MicroUSD{}, Holds: map[string]Hold{}, Entries: len(s.state.entries)}
	for k, v := range s.state.balances {
		snap.Balances[k] = v
	}
	for k, v := range s.state.holds {
		snap.Holds[k] = v
	}
	return snap
}

type memTx struct {
	st *memState
}

func (t *memTx) Balance(account AccountID) (MicroUSD, error) {
	return t.st.balances[account], nil
}

func (t *memTx) HoldByRequestID(requestID string) (Hold, bool, error) {
	h, ok := t.st.holds[requestID]
	return h, ok, nil
}

func (t *memTx) PutHold(h Hold) error {
	t.st.holds[h.RequestID] = h
	return nil
}

func (t *memTx) InsertEntry(e Entry) (bool, error) {
	if e.IdempotencyKey == "" {
		return false, ErrMissingIdempotencyKey
	}
	if err := validateEntry(e.Debit, e.Credit, e.Amount); err != nil {
		return false, err
	}
	if prev, ok := t.st.byKey[e.IdempotencyKey]; ok {
		if prev.Debit == e.Debit && prev.Credit == e.Credit && prev.Amount == e.Amount {
			return false, nil
		}
		return false, ErrIdempotencyConflict
	}

	newCredit, err := addChecked(t.st.balances[e.Credit], e.Amount)
	if err != nil {
		return false, err
	}
	newDebit, err := addChecked(t.st.balances[e.Debit], -e.Amount)
	if err != nil {
		return false, err
	}

	t.st.nextID++
	e.ID = t.st.nextID
	t.st.entries = append(t.st.entries, e)
	t.st.byKey[e.IdempotencyKey] = e
	t.st.balances[e.Credit] = newCredit
	t.st.balances[e.Debit] = newDebit
	return true, nil
}

func (t *memTx) ExpiredOpenHolds(now time.Time, limit int) ([]Hold, error) {
	var out []Hold
	for _, h := range t.st.holds {
		if h.Status == HoldOpen && !h.ExpiresAt.After(now) {
			out = append(out, h)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if !out[i].ExpiresAt.Equal(out[j].ExpiresAt) {
			return out[i].ExpiresAt.Before(out[j].ExpiresAt)
		}
		return out[i].RequestID < out[j].RequestID
	})
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}
