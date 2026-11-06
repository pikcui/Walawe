# Walawe

**Open-source wallet and API gateway infrastructure for autonomous AI agents.**

[![Status](https://img.shields.io/badge/status-v1.0.0--alpha-blue.svg)](#roadmap)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)

Walawe lets AI agents call models and paid APIs on their own, with hard spending limits set by humans. One API key, many models, per-agent budgets, and a full audit trail.

## Why Walawe

AI agents need to pay for things: model calls, data APIs, tools. Today that means juggling API keys, topping up balances by hand, and hoping a buggy or hijacked agent does not burn through your budget.

Walawe gives each agent its own wallet and rules:
- **One endpoint, many models.** OpenAI and Anthropic compatible.
- **Per-agent budgets.** Limits per request, per day, per month.
- **Deterministic policy engine.** Spending rules enforced by code.
- **Human Approvals.** High-value transactions held for manual review.
- **x402 Machine Payments.** Ethereum signatures (EIP-191) for crypto payments.
- **BYOK.** Secure routing of user's own API keys.
- **ERC-4337 Smart Accounts.** On-chain validation for session keys.
- **Webhooks & Audit Logs.** Real-time notifications and tamper-evident security.
- **Self-hostable.** Docker Compose ready.

## Roadmap

For a detailed breakdown of our future plans (including Security Hardening and True Web3 Integration), please see [ROADMAP.md](ROADMAP.md).

- **MVP & v1 Alpha (Completed):** Core Gateway, Ledger, Policies, Human Approvals, x402, BYOK, Webhooks, Docker, ERC-4337 Contracts.
- **v2 (In Progress):** Production Readiness, True On-chain Settlement, Policy Usage Aggregation.

## License

[Apache License 2.0](LICENSE).
