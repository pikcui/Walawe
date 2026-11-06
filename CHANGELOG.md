# Changelog

## [0.4.0-alpha] - 2026-11-06
### Added
- **Dashboard Charts:** Added `/admin/usage` endpoint and Recharts line chart for 7-day spending trends.
- **Anomaly Detection:** In-memory spam detector that auto-suspends agents making > 20 req/min.
- **Policy Usage Aggregation:** Real SQL aggregation for `SpentToday` and `SpentMonth` instead of hardcoded `0`.
- **OpenZeppelin ECDSA:** Replaced mock signature verification in `WalaweAccount.sol` with real `ECDSA.recover`.

### Security
- Implemented Docker Secrets management using `.env` files.
- Fixed agent status reading from DB before Policy Evaluation to enforce suspensions.

## [0.3.0-alpha] - 2026-11-06
### Added
- Webhook delivery for resolved approvals.
- Bring-Your-Own-Key (BYOK) for OpenAI and Anthropic.
- x402 Mock Payment Middleware and EIP-191 signature verification.
- Human Approval mechanism and Admin Dashboard UI.
- JWT Authentication for Admin endpoints.
- ERC-4337 Smart Account implementation.
- Docker and Docker Compose configuration.

## [0.1.0] - 2026-11-05
### Added
- Initial MVP release (Ledger, Policy Engine, Basic Gateway, Next.js UI).
