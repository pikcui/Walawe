package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pikcui/Walawe/packages/ledger"
	"github.com/redis/go-redis/v9"
)

type AnomalyDetector struct {
	rdb *redis.Client
	db  *pgxpool.Pool
}

func NewAnomalyDetector(rdb *redis.Client, db *pgxpool.Pool) *AnomalyDetector {
	return &AnomalyDetector{
		rdb: rdb,
		db:  db,
	}
}

// RecordAndCheck mencatat request di Redis dan memeriksa apakah agen melakukan spam request
func (a *AnomalyDetector) RecordAndCheck(ctx context.Context, agentID string) bool {
	key := fmt.Sprintf("anomaly:req:%s", agentID)

	count, err := a.rdb.Incr(ctx, key).Result()
	if err != nil {
		log.Printf("Redis error: %v", err)
		return false
	}

	if count == 1 {
		a.rdb.Expire(ctx, key, 1*time.Minute)
	}

	// Batas anomali: > 20 request per menit
	if count > 20 {
		return a.suspendAgent(ctx, agentID, fmt.Sprintf("spam request (%d req/min)", count))
	}

	return false
}

// RecordSpending mencatat total biaya yang di-reserve dan memeriksa laju pengeluaran
func (a *AnomalyDetector) RecordSpending(ctx context.Context, agentID string, amount ledger.MicroUSD) bool {
	key := fmt.Sprintf("anomaly:spend:%s", agentID)

	// Tambahkan biaya ke total dalam menit ini
	newTotal, err := a.rdb.IncrBy(ctx, key, int64(amount)).Result()
	if err != nil {
		log.Printf("Redis error: %v", err)
		return false
	}

	// Set expired 1 menit pada request pertama
	if newTotal == int64(amount) {
		a.rdb.Expire(ctx, key, 1*time.Minute)
	}

	// Batas anomali: > 50,000 micro-USD ($0.05) per menit
	limit := int64(50000)
	if newTotal > limit {
		return a.suspendAgent(ctx, agentID, fmt.Sprintf("high spending rate (%d micro-USD/min)", newTotal))
	}

	return false
}

func (a *AnomalyDetector) suspendAgent(ctx context.Context, agentID string, reason string) bool {
	log.Printf("ANOMALY DETECTED: Agent %s suspended. Reason: %s", agentID, reason)

	// Update status di database
	_, err := a.db.Exec(ctx, "UPDATE agents SET status = 'suspended' WHERE id = $1::uuid", agentID)
	if err != nil {
		log.Printf("Failed to suspend agent %s: %v", agentID, err)
	}

	return true
}
