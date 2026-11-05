package main

import (
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("Gateway is not implemented yet (Stage 3).")
}

// newMux mengembalikan http.Handler agar sesuai dengan ekspektasi main_test.go
func newMux() http.Handler {
	mux := http.NewServeMux()
	return mux
}
