# Walawe Roadmap

This document is a comprehensive guide for the development of the Walawe project, covering the foundation built (v1-v4) through to the long-term vision (Mainnet & Web3).

## ✅ Completed (v1 - v4 Alpha)
The core system, backend security, and modern UI have been built and deployed to the Cloud.
*   **v1-v3:** Double-Entry Ledger, Deterministic Policy Engine (Fail-Closed), x402 Mock Payment, Human Approvals, RBAC, JWT Auth.
*   **v4 (Phase 1-2):** Removed hardcoded `agent_id`, enforced BYOK (Bring Your Own Key) for AI.
*   **v4 (Phase 3):** Registration System (Email, Org, Agent, API Key), API Key Management (Rotate/Revoke).
*   **v4 (Phase 4):** 
    *   **Web3 On-Chain Deposit:** Top-up USDC via WalletConnect (Base Sepolia).
    *   **Agent Playground:** Interactive Chat UI for testing AI (Gemini, Groq, OpenAI, Anthropic).
    *   **Modern UI/UX:** Seamless Layout, Area Chart, Mobile Hamburger Menu, Full English Localization.
    *   **Branding:** Bird W Logo, "by Galang" Watermark, GitHub & Telegram Support.

---

## 🚧 In Progress: Technical Debt (v4 Beta)
*Technical debt that must be resolved before moving into the deeper Web3 phases.*

- [ ] **Redis Connection:** Fix `REDIS_URL` on Hostless which is still throwing `connection refused`. The URL format from Upstash must use the `rediss://` (TLS) scheme.
- [ ] **JWT Security:** Remove the hardcoded fallback `JWT_SECRET = "super_secret_dev_key"` in `admin_auth.go`. The application must *crash* (fail to start) if this ENV is not set in production.
- [ ] **CORS Restriction:** Restrict `Access-Control-Allow-Origin` in the backend (currently `*`) to only the `https://walawe-amber.vercel.app` domain.
- [ ] **Recharts UI:** Ensure the `outline: none` CSS on the chart is stable and no focus borders appear when the chart is clicked.

---

## 🛡️ Phase 5: Smart Contract Security & ERC-4337 Hardening
*Before touching Mainnet or handling real money, the `WalaweAccount.sol` Smart Contract must be fixed and tested brutally.*

### 5.1 Fatal Fixes (ERC-4337 Compliance)
- [ ] **Gas Fee Handling (`missingAccountFunds`):** Currently this parameter is ignored. The contract must be modified to pay the *gas fee* to the EntryPoint using the ETH balance inside the contract (or via a Paymaster).
- [ ] **Remove `view` Modifier:** The `validateUserOp` function is currently marked `view`. This modifier must be removed because this function will change the *state* (paying gas), so it cannot be a read-only function.

### 5.2 Security Checks
- [ ] **`address(0)` Check:** Add `require(signer != address(0))` after `ECDSA.recover`. This prevents bypasses if the signature format is invalid and returns an empty address.
- [ ] **`receive()` & `fallback()` Functions:** Add these functions so the contract can directly receive ETH (if needed for *gas* or *refunds*).

### 5.3 Architecture & Audit
- [ ] **Proxy Pattern (UUPS):** Implement the *Proxy* pattern (like UUPS) so the Smart Contract logic can be *upgraded* if a bug is found in the future, without having to move funds.
- [ ] **Fuzzing Testing:** Write Foundry tests using *Fuzzing* (sending thousands of random inputs) to ensure the AI cannot bypass the `maxAmountPerTx` or `allowedDestination` limits.
- [ ] **External Audit:** Perform a third-party audit (CertiK, Hacken, etc.) before deploying to Mainnet.

---

## 🌐 Phase 6: True On-Chain Settlement (Phase 4 Continuation)
*Once the Smart Contract is secure, we will connect the backend to the Base network.*

- [ ] **Bundler Integration (Pimlico/Stackup):** Integrate an ERC-4337 *Bundler* so the AI can send on-chain transactions without needing to hold ETH for gas.
- [ ] **Session Keys UI:** Create a Dashboard page for the Admin to create, view, and revoke *Session Keys* for AI agents.
- [ ] **Paymaster:** Integrate a *Paymaster* so AI transaction gas fees can be paid using USDC or subsidized by the system.
- [ ] **Auto-Settlement:** The backend automatically calls the Smart Contract to settle API payments after the AI finishes responding.

---

## 🚀 Phase 7: Mainnet Deployment & Beyond (v5+)
*Public launch with real money.*

- [ ] **Base Mainnet:** Deploy the `WalaweAccount` Smart Contract to Base Mainnet.
- [ ] **Fiat On-Ramp:** Integrate Stripe or a similar service to top-up balances directly using Credit Cards.
- [ ] **Agent-to-Agent (A2A) Payments:** Allow one AI Agent to pay another AI Agent directly on the Base network.
- [ ] **Advanced Anomaly Detection:** Use Machine Learning to detect unusual AI spending patterns.
