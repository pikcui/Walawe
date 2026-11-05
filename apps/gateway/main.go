package main

import (
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("Gateway is running on :8080")
	mux := newMux()
	http.ListenAndServe(":8080", mux)
}

func newMux() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})
	return mux
}
