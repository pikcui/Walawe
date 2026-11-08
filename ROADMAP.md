# Walawe Roadmap

This document outlines the past, present, and future of Walawe.

## ✅ Completed (v4 Alpha)

*   **v1-v3:** Ledger, Policy Engine, x402 Mock Payment, Human Approvals, Dashboard Charts, RBAC, JWT Auth, Smart Contract ECDSA, Cloud Deployment.
*   **v4 (Fase 1 & 2):** Removed hardcoded `agent_id`, enforced BYOK (Bring Your Own Key).
*   **v4 (Fase 3):** Registration System (`POST /admin/register`), UI `/register`, API Key Management.
*   **v4 (Fase 4):**
    *   **Policy Engine UI:** Admins can now set spending limits and allowed models directly from the dashboard.
    *   **On-Chain Deposits:** Top up your agent's wallet using USDC on Base Sepolia via WalletConnect.
    *   **Agent Playground:** A built-in chat UI to test your agent using your OpenAI or Anthropic API key.
    *   **Bilingual Support:** Full English and Indonesian localization.

## 🚧 In Progress (v4 Beta)

*   **True On-Chain Settlement:** Moving from manual top-ups to a fully automated ERC-4337 bundler.
*   **Session Keys:** Allow agents to transact on-chain using time-limited session keys.

## 🔮 Future (v5+)

*   **Mainnet Deployment:** Deploy Walawe contracts to Base Mainnet.
*   **Fiat On-Ramp:** Integrate Stripe or similar for credit card top-ups.
*   **Agent-to-Agent Payments:** Allow one AI agent to pay another AI agent directly.
*   **Advanced Anomaly Detection:** Use machine learning to detect unusual spending patterns.
