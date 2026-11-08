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

type OpenRouterProvider struct {
	apiKey string
}

func NewOpenRouterProvider(apiKey string) *OpenRouterProvider {
	return &OpenRouterProvider{apiKey: strings.TrimSpace(apiKey)}
}

func (p *OpenRouterProvider) StreamChat(ctx context.Context, model string, prompt string) (<-chan ResponseChunk, <-chan error) {
	chunks := make(chan ResponseChunk)
	errs := make(chan error, 1)

	go func() {
		defer close(chunks)
		defer close(errs)

		baseURL := "https://openrouter.ai/api/v1"

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

		req, err := http.NewRequestWithContext(ctx, "POST", baseURL+"/chat/completions", bytes.NewBuffer(jsonBody))
		if err != nil {
			errs <- err
			return
		}

		// Header yang sangat ketat untuk OpenRouter
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+p.apiKey)
		req.Header.Set("HTTP-Referer", "https://walawe-amber.vercel.app")
		req.Header.Set("X-Title", "Walawe")

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			errs <- err
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			// Baca body error untuk debugging
			var errBody struct {
				Error struct {
					Message string `json:"message"`
				} `json:"error"`
			}
			_ = json.NewDecoder(resp.Body).Decode(&errBody)
			errs <- fmt.Errorf("openrouter error: %s - %s", resp.Status, errBody.Error.Message)
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

		if err := scanner.Err(); err != nil {
			errs <- err
		}
	}()

	return chunks, errs
}
