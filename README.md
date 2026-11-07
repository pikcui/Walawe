# Walawe

**Open-source wallet and API gateway infrastructure for autonomous AI agents.**

[![Status](https://img.shields.io/badge/status-v3.0.0--alpha%20(Production)-green.svg)](#roadmap)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

> **Live Demo:** [Dashboard](https://walawe-amber.vercel.app) | **API Gateway:** [SnapDeploy](https://walawe-d164f.containers.snapdeploy.app)

Walawe lets AI agents call models and paid APIs on their own, with hard spending limits set by humans. One API key, many models, per-agent budgets, and a full audit trail.

## Why Walawe

AI agents need to pay for things: model calls, data APIs, tools. Today that means juggling API keys, topping up balances by hand, and hoping a buggy or hijacked agent does not burn through your budget.

Walawe gives each agent its own wallet and rules:
- **One endpoint, many models.** OpenAI and Anthropic compatible.
- **Per-agent budgets.** Limits per request, per day, per month.
- **Deterministic policy engine.** Spending rules enforced by code.
- **Human Approvals.** High-value transactions held for manual review.
- **Anomaly Detection.** Automatically suspends agents that spam requests or burn cash too quickly.
- **x402 Machine Payments.** Ethereum signatures (EIP-191) for crypto payments.
- **BYOK.** Secure routing of user's own API keys.
- **ERC-4337 Smart Accounts.** On-chain validation for session keys (Deployed on Base Sepolia).
- **Webhooks & Audit Logs.** Real-time notifications and tamper-evident security.
- **Self-hostable.** Docker Compose ready.

## Cloud Architecture (Production)

Walawe is currently deployed live using a modern, serverless-friendly stack:
- **Frontend:** Vercel (Next.js)
- **Backend:** SnapDeploy (Docker / Go)
- **Database:** Neon (PostgreSQL)
- **Cache & Rate Limiting:** Upstash (Redis)
- **Smart Contract:** Base Sepolia Testnet

## Roadmap

For a detailed breakdown of our future plans, please see [ROADMAP.md](ROADMAP.md).

- **MVP & v1 Alpha (Completed):** Core Gateway, Ledger, Policies, Human Approvals, x402, BYOK, Webhooks, Docker, ERC-4337 Contracts.
- **v2 Alpha (Completed):** Policy Usage Aggregation, Smart Contract ECDSA, Docker Secrets, Anomaly Detection, Dashboard Charts.
- **v3 Alpha (Completed):** Persistent Redis Anomaly Detection, RBAC (Admin/Viewer), User Management, Cloud Deployment.
- **v4 (Next):** True On-chain Settlement (Bundler), Advanced AI Behavior Analysis, Mainnet preparation.

## License

[Apache License 2.0](LICENSE).
