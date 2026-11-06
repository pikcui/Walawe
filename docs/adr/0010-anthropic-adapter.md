# 0010. Anthropic (Claude) Multi-Provider Adapter

- Status: Accepted
- Date: 2026-11-06

## Context
Walawe currently supports OpenAI and a Simulated Provider. To be truly model-agnostic, we must support Anthropic (Claude), which uses a different API structure (`/v1/messages` instead of `/v1/chat/completions`), different headers (`x-api-key`), and a different SSE event format.

## Decision
1. We will create an `AnthropicProvider` in `packages/providers`.
2. Agents will indicate the provider by sending the `X-Provider-Name: anthropic` header (along with `X-Provider-Key`).
3. If `X-Provider-Name` is not specified but `X-Provider-Key` is, we default to OpenAI.
4. If no keys are provided, we fallback to the `SimulatedProvider`.
5. The Gateway will pass the prompt and model to the selected provider and stream the response back to the agent.

## Consequences
- The Gateway code must be updated to read the `X-Provider-Name` header.
- We need to parse Anthropic's SSE `content_block_delta` events specifically.
