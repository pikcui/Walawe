package main

import (
	"net/http"
	"sync"
	"time"
)

var (
	rlMutex sync.Mutex
	rlMap   = make(map[string][]time.Time)
)

func rateLimitMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		rlMutex.Lock()
		now := time.Now()
		var valid []time.Time

		for _, t := range rlMap[ip] {
			if now.Sub(t) < time.Second {
				valid = append(valid, t)
			}
		}

		if len(valid) >= 5 {
			rlMutex.Unlock()
			http.Error(w, "Too Many Requests (Rate Limit Exceeded)", http.StatusTooManyRequests)
			return
		}

		rlMap[ip] = append(valid, now)
		rlMutex.Unlock()

		next.ServeHTTP(w, r)
	}
}
