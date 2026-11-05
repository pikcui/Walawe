package ledger

import (
	"context"
	"fmt"
	"os"
	"os/user"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestPgStore_Integration(t *testing.T) {
	// JIKA BERJALAN DI GITHUB ACTIONS (CI), LEWATI TEST INI
	// Karena server GitHub tidak menyediakan database PostgreSQL.
	if os.Getenv("CI") != "" {
		t.Skip("Skipping PostgreSQL integration test in CI environment")
	}

	// Ambil username OS secara langsung (u0_a1302)
	currentUser, err := user.Current()
	if err != nil {
		t.Fatalf("Failed to get current user: %v", err)
	}

	dsn := fmt.Sprintf("postgres://%s@localhost:5432/walawe?sslmode=disable", currentUser.Username)

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Skipf("Skipping PostgreSQL test, cannot connect: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		t.Skipf("Skipping PostgreSQL test, ping failed: %v", err)
	}

	// Bersihkan tabel sebelum tes
	_, err = pool.Exec(context.Background(), "TRUNCATE accounts, entries, holds CASCADE")
	if err != nil {
		t.Fatalf("Failed to truncate tables: %v", err)
	}

	store := NewPgStore(pool)
	ctx := context.Background()

	// 1. Setup akun
	agentAcc := AccountID("agent_1")
	externalAcc := AccountID("external")
	holdAcc := AccountID("hold_agent_1")

	_, err = pool.Exec(ctx, "INSERT INTO accounts (id, balance) VALUES ($1, 0), ($2, 0), ($3, 0)", string(agentAcc), string(externalAcc), string(holdAcc))
	if err != nil {
		t.Fatalf("Failed to insert accounts: %v", err)
	}

	// 2. Credit (Top Up)
	err = store.Do(ctx, func(tx Tx) error {
		_, err := tx.InsertEntry(Entry{
			Debit:          externalAcc,
			Credit:         agentAcc,
			Amount:         1000000, // $1
			RefType:        "deposit",
			RefID:          "dep_1",
			IdempotencyKey: "key_1",
		})
		return err
	})
	if err != nil {
		t.Fatalf("Credit failed: %v", err)
	}

	// 3. Verifikasi Credit
	err = store.Do(ctx, func(tx Tx) error {
		bal, err := tx.Balance(agentAcc)
		if err != nil {
			return err
		}
		if bal != 1000000 {
			return fmt.Errorf("expected agent balance 1000000, got %d", bal)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	// 4. Reserve (Hold)
	err = store.Do(ctx, func(tx Tx) error {
		h := Hold{
			RequestID:     "req_1",
			CreditAccount: agentAcc,
			HoldAccount:   holdAcc,
			Amount:        500000,
			Status:        HoldOpen,
			ExpiresAt:     time.Now().Add(5 * time.Minute),
		}
		err := tx.PutHold(h)
		if err != nil {
			return err
		}

		_, err = tx.InsertEntry(Entry{
			Debit:          agentAcc,
			Credit:         holdAcc,
			Amount:         500000,
			RefType:        "reserve",
			RefID:          "req_1",
			IdempotencyKey: "res_req_1",
		})
		return err
	})
	if err != nil {
		t.Fatalf("Reserve failed: %v", err)
	}

	// 5. Verifikasi Reserve
	err = store.Do(ctx, func(tx Tx) error {
		bal, _ := tx.Balance(agentAcc)
		if bal != 500000 {
			return fmt.Errorf("expected agent balance 500000, got %d", bal)
		}
		holdBal, _ := tx.Balance(holdAcc)
		if holdBal != 500000 {
			return fmt.Errorf("expected hold balance 500000, got %d", holdBal)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	// 6. Settle (Tagih 400000, kembalikan 100000)
	err = store.Do(ctx, func(tx Tx) error {
		h, found, err := tx.HoldByRequestID("req_1")
		if err != nil {
			return err
		}
		if !found {
			return fmt.Errorf("hold not found")
		}

		actual := MicroUSD(400000)
		returnAmount := h.Amount - actual
		h.BilledAmount = actual
		h.Status = HoldSettled
		h.SettledAt = time.Now()

		err = tx.PutHold(h)
		if err != nil {
			return err
		}

		_, err = tx.InsertEntry(Entry{
			Debit:          holdAcc,
			Credit:         agentAcc,
			Amount:         returnAmount,
			RefType:        "settle_return",
			RefID:          "req_1",
			IdempotencyKey: "settle_ret_req_1",
		})
		return err
	})
	if err != nil {
		t.Fatalf("Settle failed: %v", err)
	}

	// 7. Verifikasi Settle
	err = store.Do(ctx, func(tx Tx) error {
		bal, _ := tx.Balance(agentAcc)
		if bal != 600000 {
			return fmt.Errorf("expected agent balance 600000, got %d", bal)
		}
		holdBal, _ := tx.Balance(holdAcc)
		if holdBal != 400000 { // Diperbaiki: Sisa uang yang ditagihkan tetap di hold
			return fmt.Errorf("expected hold balance 400000, got %d", holdBal)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	t.Log("PostgreSQL store integration test passed successfully!")
}
