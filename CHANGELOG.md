# Changelog

## [0.5.0-beta] - 2026-11-06
### Added
- **Base Sepolia Deployment:** Successfully deployed `WalaweAccount.sol` to Base Sepolia Testnet.
- **True On-Chain Interaction:** Added Session Key directly to the deployed smart contract using Foundry `cast`.
- **Dynamic API URL:** Frontend now uses `NEXT_PUBLIC_API_URL` for better deployment flexibility.

### Security
- Enforced agent suspension status by reading from DB before Policy Evaluation.

## [0.4.0-alpha] - 2026-11-06
### Added
- Dashboard Charts (Recharts).
- Anomaly Detection (in-memory).
- Policy Usage Aggregation.
- OpenZeppelin ECDSA for Smart Contract signatures.

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
