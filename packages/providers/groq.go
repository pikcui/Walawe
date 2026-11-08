package providers

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

type GroqProvider struct {
	apiKey string
}

func NewGroqProvider(apiKey string) *GroqProvider {
	return &GroqProvider{apiKey: strings.TrimSpace(apiKey)}
}

func (p *GroqProvider) StreamChat(ctx context.Context, model string, prompt string) (<-chan ResponseChunk, <-chan error) {
	chunks := make(chan ResponseChunk)
	errs := make(chan error, 1)

	go func() {
		defer close(chunks)
		defer close(errs)

		// URL OpenAI-Compatible dari Groq
		baseURL := "https://api.groq.com/openai/v1/chat/completions"

		reqBody := map[string]interface{}{
			"model": model,
			"messages": []map[string]string{
				{"role": "user", "content": prompt},
			},
			"stream": true,
		}

		jsonBody, err := json.Marshal(reqBody)
		if err != nil {
			errs <- err
			return
		}

		req, err := http.NewRequestWithContext(ctx, "POST", baseURL, bytes.NewBuffer(jsonBody))
		if err != nil {
			errs <- err
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+p.apiKey)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			errs <- err
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			errs <- errors.New("groq error: " + resp.Status)
			return
		}

		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "data: ") {
				data := strings.TrimPrefix(line, "data: ")
				if data == "[DONE]" {
					return
				}

				var streamResp struct {
					Choices []struct {
						Delta struct {
							Content string `json:"content"`
						} `json:"delta"`
					} `json:"choices"`
				}

				if err := json.Unmarshal([]byte(data), &streamResp); err == nil {
					if len(streamResp.Choices) > 0 && streamResp.Choices[0].Delta.Content != "" {
						chunks <- ResponseChunk{Text: streamResp.Choices[0].Delta.Content}
					}
				}
			}
		}
	}()

	return chunks, errs
}
