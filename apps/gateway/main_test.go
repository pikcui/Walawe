package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pikcui/Walawe/packages/ledger"
	"github.com/redis/go-redis/v9"
)

func TestHealthz(t *testing.T) {
	// Inisialisasi dependensi dummy agar newMux() tidak panic saat test
	var err error
	dbPool, err = pgxpool.New(context.Background(), "postgres://dummy")
	if err != nil {
		t.Fatal(err)
	}
	dbStore = ledger.NewPgStore(dbPool)
	redisClient = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	srv := httptest.NewServer(newMux())
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/healthz")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusOK)
	}
}
