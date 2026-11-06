# Walawe

**Open-source wallet and API gateway infrastructure for autonomous AI agents.**

Walawe lets AI agents call models and paid APIs on their own, with hard spending limits set by humans. One API key, many models, per-agent budgets, and a full audit trail.

## Why Walawe

AI agents need to pay for things: model calls, data APIs, tools. Today that means juggling API keys, topping up balances by hand, and hoping a buggy or hijacked agent does not burn through your budget.

Walawe gives each agent its own wallet and rules:

- **One endpoint, many models.** OpenAI- and Anthropic-compatible API. Change the base URL, keep your code.
- **Per-agent budgets.** Limits per request, per day, per month. Model and destination allowlists.
- **Deterministic policy engine.** Spending rules are enforced by code, not by prompts. A hijacked agent cannot talk its way past them.
- **Accurate metering.** Every token is metered and charged through a double-entry ledger (reserve, then settle).
- **Human Approvals.** High-value transactions are held until a human approves them via the Dashboard.
- **x402 Machine Payments.** Agents can pay for premium data/APIs using Ethereum signatures (EIP-191) without exposing their master key.
- **Hash-chained Audit Log.** Tamper-evident security tracking for every spend.
- **Self-hostable.** Run it yourself with Docker Compose or Helm.

## Architecture

Agent / SDK
    |  HTTPS (API key) + X-PAYMENT (Crypto signature)
    v
Gateway (Go)  -->  Policy Engine (Limits, Allowlist, Human Approvals)
    |          -->  Auth (SHA-256 API Keys, Rate Limiting)
    |          -->  x402 Middleware (EIP-191 Signature Verification)
    v
Provider Adapters (Mocked for now) ---> OpenAI / Anthropic / ...
    |
    v
PostgreSQL (Double-entry Ledger, Approval Requests) 
    |
    v
Next.js Dashboard (Monochrome UI, Approval Controls)

## Quickstart

See [Quickstart Guide](docs/guides/quickstart.md) to get started in under 10 minutes.

## Tech Stack & Modules

- **Gateway & Core:** Go (Golang)
- **Database:** PostgreSQL (via `pgx`)
- **Smart Contracts:** Solidity (Foundry)
- **Dashboard:** Next.js, Tailwind CSS, TypeScript
- **SDKs:** Python & TypeScript (In progress)

## Roadmap

- **MVP (Completed):** Gateway, ledger, prepaid credits, spending policies, dashboard, SDKs, self-hosting.
- **v1 (In Progress):**
  - [x] Crypto Signature Verification (EIP-191)
  - [x] x402 Payment Middleware
  - [x] Human Approvals (Backend & UI)
  - [ ] Smart Account (ERC-4337) Implementation
  - [ ] Webhooks
  - [ ] Bring-Your-Own-Key (BYOK)
- **v2 (Future):** RBAC and SSO, anomaly detection, multi-chain.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) first.

## License

[Apache License 2.0](LICENSE).
