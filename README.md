# Walawe: The Financial Layer for Autonomous AI Agents

Walawe is an open-source API Gateway and Ledger that allows autonomous AI agents to pay for models and APIs on their own, with hard spending limits enforced by a Deterministic Policy Engine.

## ✨ Why Walawe?
*   **Hard Limits:** Set daily, monthly, or per-transaction limits.
*   **Policy Engine:** Define exactly which models an agent is allowed to use.
*   **Immutable Ledger:** Every transaction is recorded in a double-entry ledger.
*   **Bring Your Own Key (BYOK):** Agents use your API keys, but Walawe secures the payment flow.
*   **On-Chain Deposits:** Top up your agent's wallet using USDC on Base Sepolia.

## 🏗️ Architecture
Walawe is a monorepo consisting of:
*   `apps/gateway`: Go-based API Gateway.
*   `apps/web`: Next.js frontend dashboard.
*   `packages/ledger`: Immutable double-entry ledger logic.
*   `packages/policy-engine`: Deterministic policy evaluation engine.
*   `packages/providers`: Integrations for OpenAI, Anthropic, etc.
*   `packages/contracts`: Solidity smart contracts (ERC-4337).

## 🚀 Quick Start
See [INSTALL.md](INSTALL.md) for detailed installation instructions.

## 🤝 Contributing
We welcome contributions! Please see [AGENTS.md](AGENTS.md) for guidelines.

## 📄 License
This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
