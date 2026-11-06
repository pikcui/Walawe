# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Threat Model

Walawe handles monetary value and autonomous AI agents. We assume the following threat model:
1. **Compromised Agents:** An agent's API key or session key is stolen. *Mitigation: Scoped session keys with expiration, on-chain budget limits, and rate limiting.*
2. **Spamming Agents:** An agent tries to DDoS the gateway. *Mitigation: Anomaly detection suspends agents making > 20 requests/minute.*
3. **Provider Abuse:** An agent attempts to use unauthorized models. *Mitigation: Deterministic Policy Engine allowlists.*
4. **Replay Attacks:** An attacker replays a valid x402 payment signature. *Mitigation: Idempotency keys based on the cryptographic signature.*

## Security Controls (v2)

- **Double-Entry Ledger:** All money movement is tracked as balanced debits and credits. Balances are never updated directly.
- **Deterministic Policies:** Spending rules (daily/monthly limits, allowlists) are enforced by Go code, not LLMs.
- **Human Approvals:** High-value transactions require manual approval via the Admin Dashboard.
- **Anomaly Detection:** In-memory tracking of request timestamps to auto-suspend spamming agents.
- **Smart Contract Security:** ERC-4337 `validateUserOp` uses OpenZeppelin's `ECDSA.recover` to verify cryptographic signatures on-chain.
- **Hash-Chained Audit Log:** Every spend is recorded in an append-only log where each entry's hash depends on the previous one.
- **Docker Secrets:** Sensitive credentials (DB password, JWT secret) are passed via `.env` files, never hardcoded in Dockerfiles.
- **Admin JWT Auth:** Dashboard is protected by JSON Web Tokens.

## Reporting a Vulnerability

Please **do not** open a public issue. Use GitHub's private vulnerability reporting.
