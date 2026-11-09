# Walawe: The Financial Layer for Autonomous AI Agents

[![Go Version](https://img.shields.io/badge/Go-1.23.0-00ADD8?style=flat&logo=go)](https://go.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> **Zero Mock. Real Money. Hard Limits.**

Walawe is an open-source **API Gateway and Immutable Ledger** that allows autonomous AI agents to pay for models and APIs on their own, with **hard spending limits** enforced by a deterministic **Policy Engine**.

## 🔗 Live Demo & Links

- **Frontend Dashboard (Live Demo):** [https://walawe-amber.vercel.app](https://walawe-amber.vercel.app)
- **Backend API (Hostless):** [https://walawe.hostless.app/healthz](https://walawe.hostless.app/healthz)
- **Smart Contract (Base Sepolia):** `0x8a21C2f8F19123de2bcc5F7932d2351eba1Db6Eb`
- **GitHub Repository:** [https://github.com/pikcui/Walawe.git](https://github.com/pikcui/Walawe.git)

## ✨ Why Walawe?

AI agents are becoming increasingly autonomous, but giving them direct access to your credit card or API keys is a massive security risk. Walawe acts as a **financial firewall** between your AI agents and your money.

*   **Hard Limits:** Set daily, monthly, or per-transaction limits. Never wake up to a drained bank account.
*   **Deterministic Policy Engine:** Define exactly which models (e.g., `gpt-4o-mini`) an agent is allowed to use. If a policy is empty, it **fails closed** (denies all requests).
*   **Immutable Ledger:** Every transaction is recorded in a double-entry ledger. Balances are strictly *derived* from entries, never directly modified.
*   **Bring Your Own Key (BYOK):** Agents use your API keys, but Walawe intercepts and secures the payment flow.
*   **On-Chain Deposits:** Top up your agent's wallet using USDC on the Base Sepolia testnet via WalletConnect.

---

## 🏗️ Architecture & Tech Stack

Walawe is built as a robust monorepo, designed for high concurrency, financial precision, and Web3 integration.

### **Frontend (Web App)**
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS (Monochrome, Seamless UI, No AI Slop)
- **Web3 Integration:** Wagmi & Viem (WalletConnect, Base Sepolia USDC transfers)
- **Deployment:** Vercel

### **Backend (API Gateway)**
- **Language:** Go 1.23.0 (Strictly pinned for stability)
- **Database Driver:** `pgx/v5` (PostgreSQL)
- **Cache:** `go-redis/v9` (Upstash Redis for Rate Limiting & Anomaly Detection)
- **Web3 SDK:** `go-ethereum` (Transaction receipt verification)
- **Deployment:** Hostless.app (Dockerized)

### **Monorepo Structure**
~~~text
Walawe/
├── apps/
│   ├── gateway/      # Go-based API Gateway (Core backend)
│   └── web/          # Next.js Dashboard (Frontend)
├── packages/
│   ├── contracts/    # Solidity Smart Contracts (ERC-4337)
│   ├── ledger/       # Immutable Double-Entry Ledger logic
│   ├── policy-engine/# Deterministic Policy Evaluation
│   └── providers/    # AI Integrations (OpenAI, Gemini, Anthropic, Groq)
├── migrations/       # SQL Database Migrations
└── docs/             # Documentation & ADRs
~~~

---

## 🚀 Key Features Breakdown

### 1. Zero Mock & BYOK (Bring Your Own Key)
Walawe does not simulate AI responses. It requires you to provide your own API key (`X-Provider-Key`). The Gateway intercepts the request, validates it against the Policy Engine, holds the estimated cost in the Ledger, forwards the request to the AI provider, streams the response, and finally settles the actual cost.

### 2. The Immutable Ledger
Money is never represented as `float` or `double`. It uses `int64` (Micro-USD: 1 USD = 1,000,000). Balances are calculated by summing the `entries` table. If an agent runs out of money, the `Hold` fails, and the request is rejected (HTTP 402).

### 3. Web3 Deposits
Users can top up their agent's balance using USDC on the Base Sepolia network. The frontend uses WalletConnect to initiate the transfer, and the backend verifies the transaction hash directly from the blockchain before recording it in the Ledger.

---

## 🛠️ Getting Started
- **Go** 1.23.0+
- **Node.js** 20+
- **PostgreSQL** (Neon) & **Redis** (Upstash)

Please refer to our detailed [INSTALL.md](INSTALL.md) guide for local setup and environment variable configurations.

---

## 🗺️ Roadmap & Security
Walawe is currently in **v4 Alpha**. We have a strict technical roadmap.

- **Phase 5 (Next):** Smart Contract Hardening (ERC-4337 Compliance, Fuzzing).
- **Phase 6:** True On-Chain Settlement (Bundler, Paymaster, Session Keys).
- **Phase 7:** Mainnet Deployment (Base Mainnet) & Fiat On-Ramp.

For detailed, security-first engineering notes, please read our [ROADMAP.md](ROADMAP.md).

**⚠️ Security Note:** The current Smart Contracts on Base Sepolia are for testing purposes only. An external audit will be conducted before Mainnet deployment. See [SECURITY.md](SECURITY.md).

---

## 🤝 Contributing
We welcome contributions! Please check out [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License
This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

## 💡 Creator & Branding
Designed and engineered by **[Galang](https://github.com/pikcui)**. 
If you find this project useful, please consider giving it a ⭐ on GitHub!
