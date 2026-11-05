package ledger

import (
	"errors"
	"math"
	"testing"
)

func TestAddChecked(t *testing.T) {
	if got, err := addChecked(1, 2); err != nil || got != 3 {
		t.Fatalf("addChecked(1, 2) = %d, %v; want 3, nil", got, err)
	}
	if got, err := addChecked(5, -8); err != nil || got != -3 {
		t.Fatalf("addChecked(5, -8) = %d, %v; want -3, nil", got, err)
	}
	if _, err := addChecked(MicroUSD(math.MaxInt64), 1); !errors.Is(err, ErrOverflow) {
		t.Fatalf("max+1: got %v, want ErrOverflow", err)
	}
	if _, err := addChecked(MicroUSD(math.MinInt64), -1); !errors.Is(err, ErrOverflow) {
		t.Fatalf("min-1: got %v, want ErrOverflow", err)
	}
}
