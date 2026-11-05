# ARCHITECTURE.md

System architecture of **Walawe**. This is the primary reference for design decisions. Significant changes must be recorded as an ADR in `docs/adr/`.

## 1. Overview

Walawe sits between AI agents and model/API providers. An agent calls Walawe with a single API key. Walawe checks policy, places a hold on funds, forwards the request to the provider, meters usage, and charges the actual cost.

```
Agent / SDK
    |  HTTPS (API key)
    v
+-------------------------------+
| Gateway (stateless)           |
| auth > policy > reserve >     |
| route > stream > settle       |
+---+-----------+----------+----+
    |           |          |
    v           v          v
 Policy      Ledger     Provider
 Engine      Service    Adapters ---> OpenAI / Anthropic / ...
    |           |
    +-----+-----+
          v
   Postgres (ledger, accounts)   Redis (rate limit, cache)
          |
          v
   Event bus ---> Metering worker ---> Dashboard API ---> Web UI
          |
          +--> Webhook dispatcher, Audit log writer

(v1) Wallet Service ---> Smart Account (Base/Solana) + x402 facilitator
```

## 2. Design principles

1. **Deterministic policy.** The policy engine is plain code, not an LLM. A hijacked agent cannot talk its way past the rules.
2. **Money is never a float.** All values are integer micro-USD.
3. **Append-only ledger.** Balances are derived from entries. There is no `UPDATE balance`.
4. **Reserve, then settle.** Funds are held before the request and adjusted once actual usage is known.
5. **Idempotent money operations.** A retry must never cause a double charge.
6. **Stateless gateway.** Easy to scale horizontally. State lives in Postgres and Redis.
7. **Non-custodial for crypto funds.** The platform never holds a user's master key.
8. **Privacy by default.** Prompt and response content is not stored.

## 3. Components

### 3.1 Gateway (`apps/gateway`)
The main request path. Responsibilities: API key authentication, rate limiting, policy evaluation, hold creation, routing to providers, SSE streaming, settlement, and event emission. It must stay thin and fast. Target p95 overhead is under 30 ms excluding provider time.

### 3.2 Policy engine (`packages/policy-engine`)
A pure function: `Evaluate(request, agent, policy, usage) -> Decision`. Supported rules:
- per-request limit
- daily and monthly limits
- model and destination allowlists
- human approval threshold (v1)
- kill switch status

Result: `allow`, `deny(reason)`, or `require_approval`. Every decision is written to the audit log.

### 3.3 Ledger service (`packages/ledger`)
The source of truth for balances. Double-entry: every transaction has balanced debits and credits. Core operations:
- `CreateHold(agent, amount, request_id)`
- `Settle(hold_id, actual_amount)`: charge the actual cost, release the remainder
- `ReleaseHold(hold_id)`: cancel or time out
- `Credit(account, amount, ref)`: top-up

Database constraints guarantee that total debits equal total credits. Stale holds are released automatically by a worker after a timeout.

### 3.4 Provider adapters (`packages/providers`)
One adapter per provider with a uniform interface:
- `Send(request) -> stream`
- `Usage(response) -> tokens`
- `Price(model) -> price per token`

Adapters translate between the Walawe format and the provider format. Real response fixtures are stored in `testdata/`.

### 3.5 Metering worker
Consumes events, reconciles provider-reported usage against holds in the ledger, and flags discrepancies for review.

### 3.6 Dashboard API and web UI
Administration of organizations, agents, policies, usage reports, top-ups, and the kill switch.

### 3.7 Wallet service (v1)
Manages ERC-4337 smart accounts and session keys. The master key stays with the owner. Session keys have limited permissions: spending cap, destination allowlist, and expiry. x402 payments are executed with session keys.

## 4. Request flow

1. **Authenticate.** Match the API key hash. Resolve agent, project, and organization.
2. **Policy.** The policy engine evaluates. On `deny`, respond 403 or 429 with a `reason`.
3. **Reserve.** Compute the maximum cost (input tokens + `max_tokens` output). Create a hold. If the balance is insufficient, respond 402.
4. **Route.** Choose a provider and send the request. Fall back only if it fails before the first token.
5. **Stream.** Forward the response to the client while counting tokens. No full buffering.
6. **Settle.** Read final usage from the provider, charge the actual cost, release the rest of the hold.
7. **Events.** Publish events to the bus (metering, audit, webhooks). Further processing is asynchronous.
8. **Disconnect.** Settle based on tokens already produced. A hold must never be left dangling.

## 5. Failure modes

| Failure | Expected behavior |
|---|---|
| Provider fails before first token | Fall back to another provider, keep the hold, settle once |
| Provider fails mid-stream | Settle for tokens already sent, return an error to the client |
| Gateway crashes after hold | Hold expires and is released by the worker |
| Postgres unavailable | Gateway rejects new requests (fail closed), never forwards without a hold |
| Redis unavailable | Rate limiting falls back to conservative local limits, policy still read from Postgres |
| Event bus lagging | Requests continue, metering catches up after recovery, daily reconciliation |
| Usage vs ledger mismatch | Flagged by the reconciliation worker for human review |

General rule: **fail closed**. If it is unclear whether spending is allowed, do not spend.

## 6. Machine-to-machine payment flow (v1)

An agent pays a third-party service through x402:

1. The agent calls the service. The service replies `402` with payment requirements (amount, asset, destination).
2. Walawe evaluates the agent's policy (limits, destination allowlist, approval).
3. If allowed, a session key signs the payment authorization.
4. The agent retries the request with the payment header. A facilitator verifies and settles the transaction.
5. The spend is recorded in the ledger and audit log.

The owner's master key is never on Walawe servers.

## 7. Technology stack

| Layer | Choice |
|---|---|
| Gateway and ledger | Go (alternative: Rust) |
| Database | PostgreSQL, Redis |
| Large-scale analytics (v1) | ClickHouse |
| Event bus | NATS JetStream (alternative: Redis Streams) |
| Dashboard | Next.js + TypeScript |
| SDKs | Python and TypeScript, generated from OpenAPI |
| Smart contracts (v1) | Solidity + Foundry, ERC-4337, Base |
| Observability | OpenTelemetry, Prometheus, Grafana |
| Deployment | Docker, Docker Compose, Helm |
| CI | GitHub Actions |

## 8. Deployment

- **Local and simple self-hosting:** `docker compose up` (gateway, dashboard-api, web, Postgres, Redis, NATS).
- **Production:** Kubernetes via Helm. Gateway and workers scale horizontally. Managed Postgres with read replicas and point-in-time backups.
- **Configuration:** environment variables, with secrets from a secret manager.
- **Database migrations:** ordered versions, reversible where possible, run before the application release.

## 9. Scalability

- The gateway is stateless: add replicas as traffic grows.
- Hold and settle use serializable transactions on the agent's account row. If a single account becomes a hotspot, split the balance into sub-accounts or use Redis quota-based holds reconciled into the ledger (requires an ADR).
- Move metering and analytics to ClickHouse when volume exceeds Postgres capacity.

## 10. Open decisions

Record each as an ADR before implementing:
1. Go or Rust for the gateway.
2. Sub-account or quota strategy for high-traffic accounts.
3. First chain for v1 (Base or Solana).
4. Payment provider for fiat top-ups.
5. Final core license confirmation (Apache-2.0 recommended).
