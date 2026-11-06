package main

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AnomalyDetector struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	db       *pgxpool.Pool
}

func NewAnomalyDetector(db *pgxpool.Pool) *AnomalyDetector {
	return &AnomalyDetector{
		requests: make(map[string][]time.Time),
		db:       db,
	}
}

// RecordAndCheck mencatat request dan memeriksa apakah agen melakukan spam
func (a *AnomalyDetector) RecordAndCheck(ctx context.Context, agentID string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	now := time.Now()
	var validRequests []time.Time

	// Hanya simpan request dalam 1 menit terakhir
	for _, t := range a.requests[agentID] {
		if now.Sub(t) < time.Minute {
			validRequests = append(validRequests, t)
		}
	}

	// Batas anomali: > 20 request per menit
	if len(validRequests) >= 20 {
		log.Printf("ANOMALY DETECTED: Agent %s made too many requests", agentID)

		// Suspend agen di database (menggunakan cast ::uuid agar aman)
		_, err := a.db.Exec(ctx, "UPDATE agents SET status = 'suspended' WHERE id = $1::uuid", agentID)
		if err != nil {
			log.Printf("Failed to suspend agent %s: %v", agentID, err)
		} else {
			log.Printf("Agent %s suspended successfully", agentID)
		}

		// Bersihkan history agar tidak memicu berulang kali
		delete(a.requests, agentID)
		return true
	}

	a.requests[agentID] = append(validRequests, now)
	return false
}
