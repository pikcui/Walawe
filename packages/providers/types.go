package providers

import (
	"context"
)

// ResponseChunk adalah potongan teks yang dikirim via streaming.
type ResponseChunk struct {
	Text string
}

// Provider adalah interface yang harus diimplementasikan oleh OpenAI, Anthropic, dll.
type Provider interface {
	// StreamChat mengirim request dan mengembalikan channel berisi potongan teks.
	StreamChat(ctx context.Context, model string, prompt string) (<-chan ResponseChunk, <-chan error)
}
