package providers

import (
	"context"
	"strings"
	"time"
)

type SimulatedProvider struct{}

func NewSimulatedProvider() *SimulatedProvider {
	return &SimulatedProvider{}
}

func (s *SimulatedProvider) StreamChat(ctx context.Context, model string, prompt string) (<-chan ResponseChunk, <-chan error) {
	chunks := make(chan ResponseChunk)
	errs := make(chan error, 1)

	go func() {
		defer close(chunks)
		defer close(errs)

		// Simulasi teks respons
		words := strings.Split("Halo! Ini adalah respons streaming simulasi dari Walawe Gateway.", " ")

		for _, word := range words {
			select {
			case <-ctx.Done():
				// Jika client disconnect, hentikan stream
				errs <- ctx.Err()
				return
			case <-time.After(100 * time.Millisecond): // Jeda antar kata
				chunks <- ResponseChunk{Text: word + " "}
			}
		}
	}()

	return chunks, errs
}
