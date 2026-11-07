package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
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

// RecordAndCheck mencatat request di Redis dan memeriksa apakah agen melakukan spam
func (a *AnomalyDetector) RecordAndCheck(ctx context.Context, agentID string) bool {
	key := fmt.Sprintf("anomaly:%s", agentID)

	// Increment request count for this agent
	count, err := a.rdb.Incr(ctx, key).Result()
	if err != nil {
		log.Printf("Redis error: %v", err)
		return false // Fail open (jangan blokir jika Redis mati)
	}

	// Set expiration to 1 minute on the first request
	if count == 1 {
		a.rdb.Expire(ctx, key, 1*time.Minute)
	}

	// If more than 20 requests in 1 minute, suspend the agent
	if count > 20 {
		log.Printf("ANOMALY DETECTED: Agent %s made %d requests in a minute", agentID, count)

		// Suspend agen di database
		_, dbErr := a.db.Exec(ctx, "UPDATE agents SET status = 'suspended' WHERE id = $1::uuid", agentID)
		if dbErr != nil {
			log.Printf("Failed to suspend agent %s: %v", agentID, dbErr)
		}

		return true
	}

	return false
}
