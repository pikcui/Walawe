# Changelog

## [1.0.0-alpha] - 2026-11-06
### Added
- **ERC-4337 Smart Account:** `validateUserOp` implementation for Account Abstraction.
- **Admin Authentication:** JWT-based login for the Dashboard.
- **Anthropic Adapter:** Multi-provider support (OpenAI & Claude) via `X-Provider-Name`.
- **Dockerization:** `Dockerfile` and `docker-compose.yml` for easy self-hosting.
- **Webhooks:** Asynchronous notifications on approval resolution.
- **BYOK (Bring Your Own Key):** Agents can pass their own provider keys.
- **x402 Payments:** EIP-191 signature verification and ledger settlement.
- **Human Approvals:** Policy engine integration for high-value thresholds.

### Changed
- Redesigned Dashboard UI to a premium Monochrome theme.
- Optimized Gateway for dynamic provider selection.

## [0.1.0] - 2026-11-05
### Added
- Initial MVP release (Ledger, Policy Engine, Basic Gateway, Next.js UI).
