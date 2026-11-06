# Walawe

**Open-source wallet and API gateway infrastructure for AI agents.**

Walawe lets AI agents call models and paid APIs on their own, with hard spending limits set by humans. One API key, many models, per-agent budgets, and a full audit trail.

> **Status: MVP (v0.1.0) completed.** The core infrastructure (Gateway, Ledger, Policy Engine, Dashboard, SDKs) is fully functional and tested. Ready for v1 features (x402, smart accounts).

## Why Walawe

AI agents need to pay for things: model calls, data APIs, tools. Today that means juggling API keys, topping up balances by hand, and hoping a buggy or hijacked agent does not burn through your budget.

Walawe gives each agent its own wallet and rules:

- **One endpoint, many models.** OpenAI- and Anthropic-compatible API. Change the base URL, keep your code.
- **Per-agent budgets.** Limits per request, per day, per month. Model and destination allowlists.
- **Deterministic policy engine.** Spending rules are enforced by code, not by prompts. A hijacked agent cannot talk its way past them.
- **Accurate metering.** Every token is metered and charged through a double-entry ledger (reserve, then settle).
- **Kill switch.** Suspend an agent or an entire organization instantly.
- **Audit trail.** Every spend and every policy change is recorded.
- **Self-hostable.** Run it yourself with Docker Compose or Helm.
- **Non-custodial by design (v1).** Machine-to-machine payments (x402 / USDC) through smart accounts and scoped session keys. Your master key never touches our servers.

## Architecture Completed (MVP)

- **Gateway (Go):** Handles API keys, rate limiting, policy checks, SSE streaming, and CORS.
- **Ledger (PostgreSQL):** Double-entry accounting with `reserve` and `settle` holds. Guaranteed no negative balances (unless external).
- **Policy Engine (Go):** Deterministic rules for daily/monthly limits, model allowlists, and kill switches.
- **Dashboard (Next.js):** Real-time view of agent balances.
- **SDKs:** Python and TypeScript SDKs with streaming support.
- **Security:** SHA-256 API key hashing, Hash-chained audit logs, and Rate Limiting.

## Quickstart

See [Quickstart Guide](docs/guides/quickstart.md) to get started in under 10 minutes.

## License

[Apache License 2.0](LICENSE).
