# Security Policy

## Supported Versions

| Version | Supported          | Environment |
| ------- | ------------------ | ----------- |
| 3.x.x   | :white_check_mark: | Cloud (Live)|
| 2.x.x   | :x:                | Local/Test  |
| 1.x.x   | :x:                | Local/Test  |

## Threat Model

Walawe handles monetary value and autonomous AI agents. We assume the following threat model:
1. **Compromised Agents:** An agent's API key or session key is stolen. *Mitigation: Scoped session keys, on-chain budget limits, and rate limiting.*
2. **Spamming Agents:** An agent tries to DDoS the gateway or drain funds via tiny requests. *Mitigation: Redis-backed Anomaly Detection suspends agents exceeding request or spending limits.*
3. **Provider Abuse:** An agent attempts to use unauthorized models. *Mitigation: Deterministic Policy Engine allowlists.*
4. **Replay Attacks:** An attacker replays a valid x402 payment signature. *Mitigation: Idempotency keys based on the cryptographic signature.*

## Security Controls (v3)

- **Cloud Infrastructure:** Deployed on Vercel (Frontend), SnapDeploy (Backend), Neon (Postgres), and Upstash (Redis). All connections use TLS/SSL.
- **Environment Variables:** Secrets are managed securely via the cloud provider dashboards (not hardcoded).
- **Double-Entry Ledger:** All money movement is tracked as balanced debits and credits. Balances are never updated directly.
- **Deterministic Policies:** Spending rules (daily/monthly limits, allowlists) are enforced by Go code, not LLMs.
- **RBAC:** Admin-only routes (like `/admin/users` and `/admin/approvals/resolve`) are protected by JWT role validation.
- **Human Approvals:** High-value transactions require manual approval via the Dashboard.
- **Smart Contract Security:** ERC-4337 `validateUserOp` uses OpenZeppelin's `ECDSA.recover` and enforces session key limits (`maxAmountPerTx`, `allowedDestination`).
- **Hash-Chained Audit Log:** Every spend is recorded in an append-only log.

## Reporting a Vulnerability

Please **do not** open a public issue. Use GitHub's private vulnerability reporting.
