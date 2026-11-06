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

type OpenAIProvider struct {
	ApiKey string
}

func NewOpenAIProvider(apiKey string) *OpenAIProvider {
	return &OpenAIProvider{ApiKey: apiKey}
}

func (p *OpenAIProvider) StreamChat(ctx context.Context, model string, prompt string) (<-chan ResponseChunk, <-chan error) {
	chunks := make(chan ResponseChunk)
	errs := make(chan error, 1)

	go func() {
		defer close(chunks)
		defer close(errs)

		reqBody := map[string]interface{}{
			"model": model,
			"messages": []map[string]string{
				{"role": "user", "content": prompt},
			},
			"stream": true,
		}
		jsonBytes, _ := json.Marshal(reqBody)

		req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBytes))
		if err != nil {
			errs <- err
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+p.ApiKey)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			errs <- err
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			errs <- fmt.Errorf("openai api error: status %d", resp.StatusCode)
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
					Choices []struct {
						Delta struct {
							Content string `json:"content"`
						} `json:"delta"`
					} `json:"choices"`
				}
				if err := json.Unmarshal([]byte(data), &parsed); err == nil {
					if len(parsed.Choices) > 0 && parsed.Choices[0].Delta.Content != "" {
						chunks <- ResponseChunk{Text: parsed.Choices[0].Delta.Content}
					}
				}
			}
		}

		if err := scanner.Err(); err != nil {
			errs <- err
		}
	}()

	return chunks, errs
}
