# Walawe Roadmap

This document outlines the future direction of Walawe. We believe in transparency, especially regarding security and production readiness.

## Status: v3.0.0-alpha (Production Live)
We have successfully deployed Walawe to the Cloud. The system is now live and handling real requests.
- [x] **Base Sepolia Deployment:** Deployed `WalaweAccount.sol`.
- [x] **True On-Chain Interaction:** Executed `addSessionKey` on the live testnet.
- [x] **Persistent Anomaly Detection:** Redis-backed spam and spending rate detection.
- [x] **RBAC:** Admin/Viewer roles with JWT and DB-backed login.
- [x] **User Management:** Admin can create new users from the Dashboard.
- [x] **Cloud Deployment:** Frontend on Vercel, Backend on SnapDeploy, DB on Neon, Cache on Upstash.
- [x] **Accurate Cost Calculation:** Excluding active holds from usage limits.
- [x] **Provider Error Handling:** Robust SSE parsing for OpenAI and Anthropic.

## v4.0.0 - Mainnet & Advanced Autonomy (Next)
Our focus shifts to true on-chain settlement and advanced AI safety.

### ⛓️ True Web3 Integration
- [ ] **Bundler Integration:** Connect the Go Gateway to an ERC-4337 Bundler (e.g., Pimlico, Stackup) to submit real `UserOperations`.
- [ ] **On-chain x402 Settlement:** Move x402 payments from off-chain signatures to fully on-chain USDC transfers via smart accounts.
- [ ] **Mainnet Deployment:** Deploy to Base Mainnet after a successful audit.

### 🧠 Advanced AI Safety & Scale
- [ ] **Behavioral Anomaly Detection:** Detect complex patterns (e.g., sudden switch to expensive models at 3 AM).
- [ ] **Secret Management:** Move from environment variables to a dedicated Vault/KMS.
- [ ] **Multi-Chain Support:** Add Solana support for x402 payments.

### 📊 Product Features
- [ ] **Official SDK Releases:** Publish Python and TypeScript SDKs to PyPI and npm.
- [ ] **Advanced Analytics:** ClickHouse integration for large-scale usage reporting.
