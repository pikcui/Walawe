# Walawe

**Open-source wallet and API gateway infrastructure for autonomous AI agents.**

Walawe lets AI agents call models and paid APIs on their own, with hard spending limits set by humans. One API key, many models, per-agent budgets, and a full audit trail.

## Why Walawe

- **One endpoint, many models.** OpenAI-compatible API.
- **Per-agent budgets.** Limits per request, per day, per month. Model allowlists.
- **Deterministic policy engine.** Spending rules enforced by code, not prompts.
- **Accurate metering.** Double-entry ledger (reserve, then settle).
- **Human Approvals.** High-value transactions held until human approves via Dashboard.
- **x402 Machine Payments.** Agents pay using Ethereum signatures (EIP-191).
- **Bring-Your-Own-Key (BYOK).** Agents pass their own OpenAI API keys.
- **Webhooks.** Real-time notifications to agent servers when approvals are resolved.
- **Hash-chained Audit Log.** Tamper-evident security tracking.
- **Self-hostable.** Run it yourself with Docker Compose or Helm.

## Roadmap

- **MVP (Completed):** Gateway, ledger, prepaid credits, spending policies, dashboard, SDKs.
- **v1 (Alpha Completed):**
  - [x] Crypto Signature Verification (EIP-191)
  - [x] x402 Payment Middleware
  - [x] Human Approvals (Backend & UI)
  - [x] Bring-Your-Own-Key (BYOK) - OpenAI
  - [x] Webhooks
  - [ ] Smart Account (ERC-4337)
  - [ ] Anthropic Adapter
- **v2 (Future):** RBAC and SSO, anomaly detection, multi-chain.

## License

[Apache License 2.0](LICENSE).
