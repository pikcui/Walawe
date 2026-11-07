package providers

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type AnthropicProvider struct {
	ApiKey string
}

func NewAnthropicProvider(apiKey string) *AnthropicProvider {
	return &AnthropicProvider{ApiKey: apiKey}
}

func (p *AnthropicProvider) StreamChat(ctx context.Context, model string, prompt string) (<-chan ResponseChunk, <-chan error) {
	chunks := make(chan ResponseChunk)
	errs := make(chan error, 1)

	go func() {
		defer close(chunks)
		defer close(errs)

		reqBody := map[string]interface{}{
			"model":      model,
			"max_tokens": 4096,
			"messages": []map[string]string{
				{"role": "user", "content": prompt},
			},
			"stream": true,
		}
		jsonBytes, _ := json.Marshal(reqBody)

		req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonBytes))
		if err != nil {
			errs <- err
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("x-api-key", p.ApiKey)
		req.Header.Set("anthropic-version", "2023-06-01")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			errs <- err
			return
		}
		defer resp.Body.Close()

		// Jika status bukan 200
		if resp.StatusCode != http.StatusOK {
			var errBody struct {
				Error struct {
					Message string `json:"message"`
				} `json:"error"`
			}
			json.NewDecoder(resp.Body).Decode(&errBody)
			if errBody.Error.Message != "" {
				errs <- fmt.Errorf("anthropic api error (%d): %s", resp.StatusCode, errBody.Error.Message)
			} else {
				errs <- fmt.Errorf("anthropic api error: status %d", resp.StatusCode)
			}
			return
		}

		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "data: ") {
				data := strings.TrimPrefix(line, "data: ")
				if data == "[DONE]" {
					break
				}

				var parsed struct {
					Type  string `json:"type"`
					Delta struct {
						Type string `json:"type"`
						Text string `json:"text"`
					} `json:"delta"`
				}

				// Jika JSON rusak, lewati baris ini
				if err := json.Unmarshal([]byte(data), &parsed); err != nil {
					continue
				}

				if parsed.Type == "content_block_delta" && parsed.Delta.Text != "" {
					chunks <- ResponseChunk{Text: parsed.Delta.Text}
				}
			}
		}

		if err := scanner.Err(); err != nil {
			errs <- err
		}
	}()

	return chunks, errs
}
