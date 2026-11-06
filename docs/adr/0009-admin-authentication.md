# 0009. Admin Authentication and JWT

- Status: Accepted
- Date: 2026-11-06

## Context
The Admin Dashboard and its endpoints (`/admin/*`) are currently unprotected. Anyone with network access to the Gateway can view balances and approve high-value transactions. We must implement authentication to restrict access to authorized personnel only.

## Decision
1. We will implement a simple login endpoint (`/admin/login`) in the Gateway.
2. Credentials will be checked against environment variables (`ADMIN_USER`, `ADMIN_PASS`) for now (a full User table can come in v2).
3. Upon successful login, the Gateway will issue a **JWT** (JSON Web Token) signed with a secret (`JWT_SECRET`).
4. We will create a new `AdminAuthMiddleware` to validate the JWT for all `/admin/*` routes (except login).
5. The Next.js frontend will have a `/login` page, store the JWT in `localStorage`, and attach it as a `Bearer` token in the `Authorization` header for Admin API requests.

## Consequences
- The frontend must handle redirection to `/login` if the token is missing or expired.
- Secrets (`ADMIN_PASS`, `JWT_SECRET`) must be securely managed in production.
