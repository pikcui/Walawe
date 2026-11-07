# System Architecture & Operations

This document outlines the live production deployment of Walawe.

## Cloud Architecture

- **Frontend (Next.js):** Hosted on **Vercel**. Handles the Landing Page, Login, and Admin Dashboard. Communicates with the Gateway via `NEXT_PUBLIC_API_URL`.
- **Backend (Go):** Hosted on **SnapDeploy** (Docker container). Handles API routing, Policy Engine, Ledger operations, x402 verification, and Webhook dispatching.
- **Database (PostgreSQL):** Hosted on **Neon**. Stores users, agents, ledger accounts, double-entry entries, holds, and approval requests.
- **Cache (Redis):** Hosted on **Upstash**. Used for Rate Limiting and Persistent Anomaly Detection (Spam & Spending Rate).

## API Endpoints

### Agent Endpoints (Requires API Key)
- `POST /v1/chat/completions`: OpenAI-compatible chat endpoint (supports streaming).
- `GET /v1/premium-data`: Mock x402-protected endpoint.

### Admin Endpoints (Requires JWT)
- `POST /admin/login`: Authenticates user and returns JWT + Role.
- `GET /admin/balance`: Retrieves agent balance.
- `GET /admin/usage`: Retrieves 7-day spending trend for charts.
- `GET /admin/approvals`: Lists pending human approvals.
- `POST /admin/approvals/resolve`: Approves/rejects a request (Admin only).
- `POST /admin/users`: Creates a new user (Admin only).

## Observability & Troubleshooting

- **Backend Logs:** Available in the SnapDeploy Dashboard.
- **Frontend Logs:** Available in the Vercel Dashboard (Functions/Deployments).
- **Database:** Available in the Neon SQL Editor.
- **Redis:** Available in the Upstash Console.
