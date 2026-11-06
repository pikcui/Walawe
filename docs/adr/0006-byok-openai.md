# 0006. Bring-Your-Own-Key (BYOK) and OpenAI Adapter

- Status: Accepted
- Date: 2026-11-06

## Context
The Gateway currently uses a simulated provider. To be useful, it must connect to real AI models (like OpenAI) while still enforcing Walawe's budgets. Users must be able to use their own API keys so Walawe never pays for the inference.

## Decision
1. Agents will pass their provider key via the `X-Provider-Key` HTTP header.
2. We will implement a real `OpenAIProvider` in `packages/providers` using the standard `net/http` library to stream responses from `api.openai.com`.
3. The Gateway will read the `X-Provider-Key` header. If present, it uses the `OpenAIProvider`. If absent, it falls back to the `SimulatedProvider` for testing.
4. The provider key is never stored in the database or logs (Privacy by default, AGENTS.md §3).

## Consequences
- Agents must now securely inject the `X-Provider-Key` header.
- We need to parse OpenAI's specific SSE (Server-Sent Events) format.
