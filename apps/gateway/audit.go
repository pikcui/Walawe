package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"sync"
	"time"
)

var (
	auditMutex sync.Mutex
	lastHash   = "0000000000000000000000000000000000000000000000000000000000000000"
)

func writeAuditLog(action string, agentID string) {
	auditMutex.Lock()
	defer auditMutex.Unlock()

	timestamp := time.Now().UTC().Format(time.RFC3339)
	record := fmt.Sprintf("%s|%s|%s|%s", timestamp, agentID, action, lastHash)
	hash := sha256.Sum256([]byte(record))
	newHash := hex.EncodeToString(hash[:])

	f, err := os.OpenFile("audit.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err == nil {
		f.WriteString(record + "|" + newHash + "\n")
		f.Close()
	}

	lastHash = newHash
}
