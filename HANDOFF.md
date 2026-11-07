# WALAWE PROJECT HANDOFF DOCUMENT

## 1. PROJECT OVERVIEW
**Walawe** is an open-source wallet and API gateway infrastructure for autonomous AI agents. It allows AI agents to pay for models and APIs on their own, with hard spending limits set by humans.
*   **Repository:** `https://github.com/pikcui/Walawe`
*   **License:** Apache 2.0
*   **Current Environment:** Cloud Production (v4 Alpha)

## 2. MANDATORY RULES (DO NOT IGNORE)
Before writing any code, you MUST read and follow these rules:
1.  **Think Before Coding:** State assumptions, ask questions if unclear, and present tradeoffs. Do not guess.
2.  **Simplicity First:** No over-engineering. Minimum code to solve the problem.
3.  **Surgical Changes:** Only touch files relevant to the task. Do not refactor working code without permission.
4.  **Goal-Driven:** Define success criteria (usually via tests) before implementation.
5.  **Hard Prohibitions (AGENTS.md):**
    *   NEVER use `float` or `double` for money. Use integer **micro-USD** (1 USD = 1,000,000).
    *   NEVER modify a balance directly. Balances are derived from ledger entries.
    *   NEVER bypass the Policy Engine.
    *   NEVER commit secrets (API keys, private keys).
    *   Sensitive modules (`packages/ledger`, `packages/policy-engine`, `packages/contracts`) require extreme care and testing.

## 3. CLOUD ARCHITECTURE & INFRASTRUCTURE
The system is fully deployed in the cloud using free tiers:
*   **Frontend (Next.js):** Hosted on **Vercel**. URL: `https://walawe-amber.vercel.app`
*   **Backend (Go/Gateway):** Hosted on **Hostless** (Docker). URL is dynamic (e.g., `https://walawe.hostless.app`).
*   **Database (PostgreSQL):** Hosted on **Neon**. (Connection string is stored in Hostless & Vercel Env Vars).
*   **Cache/Redis:** Hosted on **Upstash**. (Used for Rate Limiting & Persistent Anomaly Detection).
*   **Smart Contract (ERC-4337):** Deployed on **Base Sepolia Testnet** at `0x8a21C2f8F19123de2bcc5F7932d2351eba1Db6Eb`.

## 4. CURRENT STATUS (ROADMAP)
*   **v1, v2, v3 (COMPLETED):** Ledger, Policy Engine, x402 Mock Payment, Human Approvals, Dashboard Charts, RBAC (Admin/Viewer), JWT Auth, Smart Contract ECDSA, Cloud Deployment.
*   **v4 (IN PROGRESS - "ZERO MOCK"):**
    *   **Fase 1 (DONE):** Removed hardcoded `agent_id`. Dashboard dynamically reads `agent_id` from JWT.
    *   **Fase 2 (DONE):** Removed `SimulatedProvider`. BYOK (Bring Your Own Key) is now **mandatory**. Requests without `X-Provider-Key` return `400 Bad Request`.
    *   **Fase 3 (NEXT):** Build Registration (`/admin/register` API & `/register` UI).
    *   **Fase 4 (FUTURE):** True On-chain Settlement (Bundler), Mainnet prep.

## 5. CRITICAL RECENT FIXES (DO NOT REVERT)
1.  **Go Version:** The entire repo is pinned to **Go 1.23.0** to ensure GitHub Actions (CI) compatibility. Do not upgrade the `go` directive in `go.mod` files.
2.  **Dockerfile (Hostless):** The `Dockerfile` MUST include `RUN apk add --no-cache ca-certificates` and copy the binary to `/app/gateway` to prevent "Crashed On Start" (Exit 128) during SSL connections to Neon/Upstash.
3.  **Port Binding:** `main.go` must read the port via `os.Getenv("PORT")` (fallback to "8080").
4.  **JWT Context:** `admin_auth.go` middlewares (`AdminAuthMiddleware` & `AdminOnlyMiddleware`) MUST inject `claims.AgentID` into the request context using `context.WithValue(r.Context(), agentIDKey, claims.AgentID)`. If this is missing, the Dashboard will get a 401 and kick the user back to Login.
5.  **Redis URL:** The `main.go` strips quotes from `REDIS_URL` because copy-pasting from Upstash often includes trailing quotes which breaks `redis.ParseURL()`.

## 6. IMMEDIATE NEXT TASK (FASE 3: REGISTRATION)
**Goal:** Allow new users to sign up, automatically creating an Organization, an Agent, and a User (Admin).
1.  **Database Schema:** Users table already has `agent_id` referencing `agents(id)`.
2.  **Backend (`admin_auth.go`):** Create `POST /admin/register`.
    *   Input: `email`, `password`, `org_name`.
    *   Logic: Begin SQL Transaction -> Insert Organization -> Insert Agent (with balance $0) -> Insert User (role: admin, agent_id: new agent) -> Commit.
3.  **Frontend:** Create `apps/web/app/register/page.tsx` and add a link to it from the Login page.

## 7. TESTING & DEPLOYMENT
*   **Local Dev (Termux):** Commands are documented in `docs/SYSTEM.md`.
*   **CI/CD:** Push to `main` triggers GitHub Actions (tests) and auto-deploys to Hostless (Backend) & Vercel (Frontend).
*   **Git:** Never push directly to `main`. Create a branch (e.g., `feat/v4-registration`), push, and create a Pull Request. If CI hangs, it can be merged via the GitHub web UI bypass.

---
**INSTRUCTION FOR THE NEW AI:**
You are taking over the Walawe project. Read this document carefully. Acknowledge the mandatory rules. Wait for the user to give the command to start "Fase 3" before writing any code. Do not assume hidden context; ask if something is missing.
