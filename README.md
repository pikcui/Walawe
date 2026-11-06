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

- **MVP (Completed):** Gateway, ledger, policies, dashboard, SDKs.
- **v1 Alpha (Completed):**
  - [x] Crypto Signature Verification (EIP-191)
  - [x] x402 Payment Middleware
  - [x] Human Approvals (Backend & UI)
  - [x] Bring-Your-Own-Key (BYOK) - OpenAI & Anthropic
  - [x] Webhooks
  - [x] Admin JWT Authentication
  - [x] Docker Deployment
  - [x] ERC-4337 Smart Account Implementation
- **v2 (Future):** RBAC, anomaly detection, multi-chain support, DeFi integrations.

## License

[Apache License 2.0](LICENSE).
