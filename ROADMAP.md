# Walawe Roadmap

This document outlines the future direction of Walawe. We believe in transparency, especially regarding security and production readiness.

## Status: v2.0.0-beta (Completed)
We have successfully completed the v2 Beta phase, bringing Walawe to the real Blockchain.
- [x] **Policy Engine Usage Aggregation:** Real database queries for daily/monthly limits.
- [x] **Smart Contract ECDSA:** Replaced mock signatures with OpenZeppelin's `ECDSA.recover`.
- [x] **Docker Secrets:** Implemented `.env` management for sensitive credentials.
- [x] **Anomaly Detection:** Auto-suspension for spamming agents.
- [x] **Dashboard Charts:** 7-day spending trend visualization.
- [x] **Admin JWT Auth:** Protected admin routes and UI.
- [x] **Multi-Provider:** OpenAI and Anthropic support with BYOK.
- [x] **Dynamic Dashboard URL:** Environment variables for API URL.
- [x] **Base Sepolia Deployment:** Deployed `WalaweAccount.sol` to Base Sepolia Testnet.
- [x] **True On-Chain Interaction:** Successfully executed `addSessionKey` via Foundry `cast send` on the live testnet.

## v3.0.0 - Scale, Mainnet & Ecosystem (Future)
Features required before going to Mainnet with real funds.

### 🚀 Infrastructure & Scale
- [ ] **Persistent Anomaly Detection:** Move in-memory request tracking to Redis to survive server restarts and support horizontal scaling.
- [ ] **Secret Management:** Replace `.env` files with a dedicated Secret Manager (e.g., AWS Secrets Manager, HashiCorp Vault).
- [ ] **Advanced Anomaly Detection:** Implement moving averages and behavior analysis.

### 🛡️ Security & Auditing
- [ ] **Session Key Limits Enforcement:** Parse `callData` inside the Solidity `validateUserOp` to strictly enforce `maxAmountPerTx` and `allowedDestination`.
- [ ] **Accurate Cost Calculation:** Fix the Ledger aggregation to only count settled expenses, not active `reserves` (holds).
- [ ] **Third-Party Smart Contract Audit.**

### ⛓️ Web3 Ecosystem
- [ ] **Mainnet Deployment:** Deploy to Base Mainnet after successful Testnet phase and audit.
- [ ] **Multi-Chain Support:** Add Solana support for x402 payments.

### 📊 Product Features
- [ ] **RBAC & SSO:** Role-Based Access Control for organizations.
- [ ] **Official SDK Releases:** Publish Python and TypeScript SDKs to PyPI and npm.
- [ ] **Landing Page:** Create a public-facing marketing page.
