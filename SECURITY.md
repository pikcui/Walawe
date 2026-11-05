# Walawe Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Use GitHub's **Private Vulnerability Reporting**: go to the *Security* tab of this repository and choose *Report a vulnerability*.

Please include: a description, reproduction steps, estimated impact, and affected versions.

Response commitments:
- Acknowledgement within 3 business days
- Initial assessment within 7 days
- Fix and coordinated disclosure, generally within 90 days, faster for critical issues

We appreciate responsible disclosure and will credit reporters in the release notes if they wish.

## Supported versions

| Version | Status |
|---|---|
| `main` and the latest minor release | Receives security fixes |
| Older releases | Not supported |

## Threat model

| Threat | Mitigation |
|---|---|
| Agent hijacked (prompt injection) and drains the balance | Deterministic policy engine outside the LLM, per-request and daily limits, human approval above a threshold, kill switch |
| API key leak | Only the hash is stored, visible prefix, secret scanning in CI, instant rotation and revocation, per-key limits |
| Provider key theft | Envelope encryption with KMS, never in logs, least-privilege access |
| Double charge or race condition | Idempotency keys, serializable transactions on hold and settle, property tests |
| SSRF through payment destinations or tools | Egress allowlist, block internal addresses and cloud metadata endpoints |
| Prompt content leakage | Not stored by default, log redaction, TLS in transit, encryption at rest |
| Cross-tenant access | Tenant filter on every query, automated authorization tests |
| Supply chain attack | Pinned dependencies, SBOM, signed releases, Dependabot |
| Audit log tampering | Append-only, hash chaining, periodic export to separate storage |
| DoS and abuse | Rate limits per key and per IP, per-organization quotas |
| Crypto fund theft (v1) | Non-custodial, scoped session keys, independent smart contract audit |

## Required controls

### Application
- TLS for all external communication. mTLS between internal services.
- Fail closed: if the ledger or policy cannot be checked, the request is rejected.
- All money values are integer micro-USD. Linters and tests prevent floats for money.
- Strict input validation on every endpoint and request size limits.
- No prompt or response content in logs or the database by default.

### Keys and secrets
- Secrets come only from a secret manager or environment, never from the repo.
- Provider secrets are encrypted (envelope encryption) with KMS.
- API keys: shown once, stored as a hash, revocable instantly.
- The owner's master key and private keys for crypto funds **never** touch Walawe servers.
- Session keys have limited permissions: spending cap, destination allowlist, short expiry.

### Access and operations
- 2FA is mandatory for organization admins and repository maintainers.
- Least privilege for database, cloud, and CI access.
- Audit log for all admin actions, policy changes, and key creation or revocation.
- Encrypted backups and regular restore tests.

### Repository and supply chain
- Branch protection on `main`: required reviews, required green CI, no direct pushes.
- `CODEOWNERS` for sensitive modules (ledger, policy-engine, keys, contracts).
- Secret scanning and push protection enabled.
- Pinned dependencies. Dependabot or Renovate enabled.
- Signed releases (cosign) with an SBOM.
- Static analysis (for example CodeQL) and fuzzing of the request parser and policy evaluator.

### Smart contracts (v1)
- Independent audit before use with real funds.
- Conservative value caps at initial launch.
- Emergency pause mechanism with clear governance.
- Contract source verified on a block explorer.

## Pre-release checklist

- [ ] Threat model reviewed and updated
- [ ] Independent pentest or security review of the money path
- [ ] Secret scanning clean, no credentials in git history
- [ ] Cross-tenant authorization tests pass on all endpoints
- [ ] Ledger property and concurrency tests pass
- [ ] Rate limits and quotas active
- [ ] Kill switch tested end to end
- [ ] Backup and restore procedure tested
- [ ] Private vulnerability reporting enabled on the repository
- [ ] Legal review of how funds are handled is complete

## Important notice

This software handles monetary value. Users and operators are responsible for legal compliance in their own jurisdictions. The project is provided as is, under its license, without warranty.

## Release Checklist
- [x] Rate limiting implemented (5 req/sec per IP)
- [x] Hash-chained audit logging enabled
