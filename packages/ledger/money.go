package ledger

import "math"

// MicroUSD is an amount of money in micro-USD (1 USD = 1,000,000 units).
// Money is never represented as floating point in Walawe.
type MicroUSD int64

// MicroPerUSD is the number of micro-USD in one USD.
const MicroPerUSD MicroUSD = 1_000_000

// addChecked returns a+b or ErrOverflow if the result does not fit in int64.
func addChecked(a, b MicroUSD) (MicroUSD, error) {
	if (b > 0 && a > math.MaxInt64-b) || (b < 0 && a < math.MinInt64-b) {
		return 0, ErrOverflow
	}
	return a + b, nil
}
