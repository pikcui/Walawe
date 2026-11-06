# Walawe Roadmap

This document outlines the future direction of Walawe. We believe in transparency, especially regarding security and production readiness.

## Status: v1.0.0-alpha (Current)
We have successfully built the core infrastructure: API Gateway, Double-Entry Ledger, Human Approvals, x402 Payments, Multi-Provider (OpenAI/Anthropic), Docker deployment, and the ERC-4337 Smart Contract foundation.

## v2.0.0 - Production Readiness & True Web3 (Planned)

### 🔒 Security & Hardening (Addressing v1 Technical Debt)
- [ ] **Enforce Production Secrets:** Remove default fallbacks for `JWT_SECRET`, `ADMIN_PASS`. The Gateway must fail to start if these are not provided in production.
- [ ] **Docker Secrets Management:** Move database passwords from `docker-compose.yml` to `.env` files or Docker Secrets.
- [ ] **Policy Engine Usage Aggregation:** Implement SQL queries to calculate real `SpentToday` and `SpentMonth` from the Ledger instead of hardcoding `0`.
- [ ] **Provider Error Handling:** Add retries, circuit breakers, and robust SSE parsing for OpenAI and Anthropic adapters.

### ⛓️ True Web3 Integration (ERC-4337)
- [ ] **Full Cryptography in Solidity:** Replace mock signature verification in `WalaweAccount.sol` with OpenZeppelin's `ECDSA.recover`.
- [ ] **Go-Bundler Integration:** Connect the Go Gateway to an Ethereum RPC (Base Sepolia Testnet) using `go-ethereum`.
- [ ] **On-chain x402 Settlement:** Move x402 payment verification from Off-chain (EIP-191) to On-chain (UserOperation validation via EntryPoint).
- [ ] **Session Key Provisioning:** Allow users to generate and revoke Session Keys directly from the Admin Dashboard.

### 📊 Advanced Features
- [ ] **Anomaly Detection:** Detect if an agent suddenly requests expensive models 100x in a minute.
- [ ] **RBAC & SSO:** Role-Based Access Control for organizations with multiple human admins.
- [ ] **Dashboard Charts:** Add usage charts (spending over time) using Recharts or Chart.js.
- [ ] **Landing Page:** Create a public-facing marketing page for the project.

## v3.0.0 - Scale & Ecosystem (Future)
- [ ] **Multi-Chain Support:** Add Solana support for x402 payments.
- [ ] **Bring-Your-Own-Database:** Allow self-hosters to connect Walawe to their existing PostgreSQL cluster.
- [ ] **Official SDK Releases:** Publish `walawe` Python and TypeScript SDKs to PyPI and npm.
