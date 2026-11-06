# Walawe Roadmap

This document outlines the future direction of Walawe. We believe in transparency, especially regarding security and production readiness.

## Status: v2.0.0-alpha (Completed)
We have successfully completed the v2 Alpha phase, addressing critical security and technical debt from v1:
- [x] **Policy Engine Usage Aggregation:** Real database queries for daily/monthly limits.
- [x] **Smart Contract ECDSA:** Replaced mock signatures with OpenZeppelin's `ECDSA.recover`.
- [x] **Docker Secrets:** Implemented `.env` management for sensitive credentials.
- [x] **Anomaly Detection:** Auto-suspension for spamming agents.
- [x] **Dashboard Charts:** 7-day spending trend visualization with Recharts.
- [x] **Admin JWT Auth:** Protected admin routes and UI.
- [x] **Multi-Provider:** OpenAI and Anthropic support with BYOK.

## v2.0.0-beta - Testnet & Production Prep (Next)
Our immediate focus is deploying the Smart Contract to a live testnet and fixing final production blockers.

### 🛠️ Quick Fixes
- [ ] **Dynamic Dashboard URL:** Replace hardcoded `127.0.0.1` with `NEXT_PUBLIC_API_URL` environment variables in the Next.js app to allow remote server access.

### ⛓️ Base Sepolia Testnet Deployment
- [ ] **Deploy Smart Contract:** Deploy `WalaweAccount.sol` to Base Sepolia using Foundry.
- [ ] **Update Gateway:** Replace the mock `0xYourSmartContractAddress` with the real deployed address.
- [ ] **True UserOperation:** Write a script to submit a real `UserOperation` to the EntryPoint contract on Base Sepolia and verify the on-chain transaction.

### 🛡️ Security & Auditing (From v2 Audit)
- [ ] **Session Key Limits:** Enforce `maxAmountPerTx` and `allowedDestination` by parsing `callData` inside the Solidity `validateUserOp` function.
- [ ] **Accurate Cost Calculation:** Fix the Ledger aggregation to only count settled expenses, not active `reserves` (holds).

## v3.0.0 - Scale, Mainnet & Ecosystem (Future)
Features required before going to Mainnet with real funds.

### 🚀 Infrastructure & Scale
- [ ] **Persistent Anomaly Detection:** Move in-memory request tracking to Redis to survive server restarts and support horizontal scaling.
- [ ] **Secret Management:** Replace `.env` files with a dedicated Secret Manager (e.g., AWS Secrets Manager, HashiCorp Vault) for production deployments.
- [ ] **Advanced Anomaly Detection:** Implement moving averages and behavior analysis to detect complex abuse patterns.

### ⛓️ Web3 Ecosystem
- [ ] **Mainnet Deployment:** Deploy to Base Mainnet after successful Testnet phase and third-party Smart Contract audit.
- [ ] **Multi-Chain Support:** Add Solana support for x402 payments.

### 📊 Product Features
- [ ] **RBAC & SSO:** Role-Based Access Control for organizations with multiple human admins.
- [ ] **Official SDK Releases:** Publish `walawe` Python and TypeScript SDKs to PyPI and npm.
- [ ] **Landing Page:** Create a public-facing marketing page for the project.
