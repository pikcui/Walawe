# System Architecture

Walawe is designed as a modular monorepo with a clear separation of concerns.

## High-Level Overview

[ AI Agent / Client ]
          |
          | (HTTP POST /v1/chat/completions)
          v
+-----------------------+
|   Walawe API Gateway  | (Go)
|  (Policy Engine,      |
|   Ledger, Auth)       |
+-----------------------+
     |             |
     |             | (BYOK)
     v             v
+---------+   +-------------+
|  Neon   |   |  OpenAI /   |
| (Postgres|   |  Anthropic  |
|  Ledger)|   |  (Providers)|
+---------+   +-------------+

## Key Components

### 1. Ledger (`packages/ledger`)
The source of truth for all financial data. It implements a double-entry accounting system. Balances are never directly updated; they are derived from immutable ledger entries. This ensures data integrity and auditability.

### 2. Policy Engine (`packages/policy-engine`)
A deterministic engine that evaluates every request against a set of rules (max cost per transaction, daily limits, allowed models). It is fail-closed: if a policy is empty, the request is denied.

### 3. API Gateway (`apps/gateway`)
The entry point for all agent requests. It handles authentication (JWT), rate limiting, and orchestrates the flow between the Policy Engine, Ledger, and AI Providers.

### 4. Frontend (`apps/web`)
A Next.js dashboard for humans to manage agents, view spending trends, top up balances (via USDC on Base Sepolia), and approve pending transactions.

### 5. Smart Contracts (`packages/contracts`)
ERC-4337 compliant smart contracts deployed on Base Sepolia. These handle session keys and on-chain settlement for the agent's wallet.
