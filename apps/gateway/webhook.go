package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// sendWebhook mengirim notifikasi ke agen secara asinkron
func sendWebhook(webhookURL string, payload map[string]interface{}) {
	// Jalankan di background (goroutine) agar tidak memblokir response Admin
	go func() {
		body, err := json.Marshal(payload)
		if err != nil {
			log.Printf("Failed to marshal webhook payload: %v", err)
			return
		}

		client := &http.Client{Timeout: 5 * time.Second}
		req, err := http.NewRequest("POST", webhookURL, bytes.NewBuffer(body))
		if err != nil {
			log.Printf("Failed to create webhook request: %v", err)
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "Walawe-Webhook/1.0")

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Webhook delivery failed to %s: %v", webhookURL, err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Printf("Webhook successfully delivered to %s", webhookURL)
		} else {
			log.Printf("Webhook delivery to %s returned status %d", webhookURL, resp.StatusCode)
		}
	}()
}
