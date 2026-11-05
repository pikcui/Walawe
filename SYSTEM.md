# Walawe System Documentation

Place this file at `docs/SYSTEM.md`. It describes the API, data model, configuration, observability, testing, and operations. For component design see `ARCHITECTURE.md`. For security see `SECURITY.md`.

> `docs/api/openapi.yaml` is the source of truth for the API. If it differs from this document, the OpenAPI file wins.

## 1. Documentation layout

```
/docs
  SYSTEM.md             this document
  /adr                  Architecture Decision Records (NNNN-title.md)
  /api                  openapi.yaml
  /guides               quickstart.md, self-host.md, contributing.md
  /runbooks             incidents, key rotation, ledger reconciliation
  /security             threat-model.md, key-management.md
```

Rules:
- Behavior changes without docs changes are rejected in review.
- ADRs are written **before** code for big decisions. Format: Context, Decision, Consequences, Alternatives.
- Diagrams are written as code (Mermaid) so they can be reviewed in PRs.

## 2. API

### 2.1 Agent endpoints

| Endpoint | Purpose |
|---|---|
| `POST /v1/chat/completions` | OpenAI-compatible, supports SSE streaming |
| `POST /v1/messages` | Anthropic-compatible, supports SSE streaming |
| `GET /v1/models` | Models, prices, and status |

Authentication: `Authorization: Bearer <api_key>`. Operations that touch money accept an `Idempotency-Key` header.

### 2.2 Admin endpoints

| Endpoint | Purpose |
|---|---|
| `POST /admin/agents` | Create an agent |
| `POST /admin/agents/{id}/keys` | Create or rotate an API key |
| `DELETE /admin/agents/{id}/keys/{key_id}` | Revoke an API key |
| `PUT /admin/agents/{id}/policy` | Set the spending policy |
| `POST /admin/agents/{id}/suspend` | Kill switch |
| `POST /admin/agents/{id}/resume` | Re-enable |
| `GET /admin/usage` | Usage and cost report (filter by agent, project, time range) |
| `POST /admin/topups` | Start a credit top-up |
| `GET /admin/audit` | Read the audit log |
| `POST /admin/approvals/{id}/decision` | Approve or reject (v1) |

### 2.3 Error codes

| HTTP | Example `reason` | Meaning |
|---|---|---|
| 401 | `invalid_api_key`, `revoked_api_key` | Wrong or revoked key |
| 402 | `insufficient_balance` | Not enough balance for the hold |
| 403 | `model_not_allowed`, `agent_suspended`, `policy_denied` | Policy rejected the request |
| 409 | `idempotency_conflict` | Idempotency-Key reused with a different payload |
| 429 | `rate_limited`, `daily_limit_reached`, `monthly_limit_reached` | A limit was reached |
| 502/503 | `provider_unavailable` | Provider failed and fallbacks are exhausted |

Error format:

```json
{
  "error": {
    "type": "policy_denied",
    "reason": "daily_limit_reached",
    "message": "Daily limit reached.",
    "request_id": "req_..."
  }
}
```

Every response carries `X-Walawe-Request-Id`, `X-Walawe-Cost-Micro-USD`, and (when available) `X-Walawe-Remaining-Daily-Micro-USD` headers.

## 3. Data model

| Table | Main contents |
|---|---|
| `organizations`, `projects` | Ownership hierarchy |
| `agents` | `project_id`, `name`, `status` (active/suspended) |
| `api_keys` | `agent_id`, `key_hash`, `prefix`, `created_at`, `revoked_at` |
| `policies` | `agent_id`, `max_per_request`, `daily_limit`, `monthly_limit`, `allowed_models`, `approval_threshold` |
| `ledger_accounts` | `owner`, `kind` (credit, hold, revenue, provider_cost) |
| `ledger_entries` | `debit_account`, `credit_account`, `amount_micro_usd`, `ref_id`, `idempotency_key`, `created_at` |
| `holds` | `request_id`, `amount`, `status` (open/settled/released), `expires_at` |
| `usage_events` | `request_id`, `agent_id`, `model`, `tokens_in`, `tokens_out`, `cost`, `latency_ms`, `status` |
| `approvals` (v1) | `agent_id`, `amount`, `status`, `decided_by` |
| `audit_logs` | `actor`, `action`, `target`, `created_at`, `prev_hash`, `hash` |

Data rules:
- A balance is the sum of ledger entries. No balance column is ever updated directly.
- All money tables use constraints so debits equal credits.
- `ledger_entries` and `audit_logs` are append-only (enforced with database permissions and triggers).
- API keys are stored as hashes. The raw value is shown only once, at creation.
- Prompt and response content is not stored.

## 4. Configuration

Everything through environment variables. Examples (the final list lives in `.env.example`):

| Variable | Purpose |
|---|---|
| `WALAWE_DATABASE_URL` | Postgres connection |
| `WALAWE_REDIS_URL` | Redis connection |
| `WALAWE_NATS_URL` | Event bus connection |
| `WALAWE_KMS_KEY_ID` | Key for envelope encryption of provider secrets |
| `WALAWE_HOLD_TTL_SECONDS` | Hold lifetime before automatic release |
| `WALAWE_DEFAULT_MARGIN_BPS` | Margin over provider price (basis points) |
| `WALAWE_LOG_LEVEL` | Log level |
| `WALAWE_OTEL_ENDPOINT` | Trace and metrics destination |

Secrets are never written to the repo. Use a secret manager or environment variables in the deployment environment.

## 5. Observability

- **Traces:** OpenTelemetry, one trace per request with `request_id` as the correlation ID.
- **Metrics:** gateway latency (p50/p95/p99), overhead excluding the provider, error rate per provider, open hold count, oldest hold age, reconciliation drift.
- **Logs:** structured JSON, with no sensitive data (no prompts, no keys).
- **Minimum alerts:**
  - holds open longer than the TTL
  - reconciliation drift above threshold
  - spike in provider error rate
  - abnormal spending spike per agent
  - audit log write failures

## 6. Testing

| Type | Scope |
|---|---|
| Unit tests | All packages, mandatory for ledger and policy engine |
| Property tests | Total debits = total credits, hold + settle never exceeds limits |
| Concurrency tests | Many parallel requests on one agent never exceed its limits |
| Contract tests | Provider adapters against real recorded responses in `testdata/` |
| Authorization tests | Tenant isolation on every admin endpoint |
| End-to-end tests | Full flow: top-up, request, settle, report |
| Fuzzing | Request parser and policy evaluator |
| Load tests | Gateway p95 overhead under 30 ms |

## 7. Runbooks

### 7.1 Daily ledger reconciliation
1. A worker compares provider-reported usage with ledger entries.
2. Differences above the threshold are flagged and alerted.
3. Review manually. Correct with a **new adjustment entry**, never by editing old entries.
4. Record the cause and action in an issue.

### 7.2 Dangling holds
1. Check the oldest-hold-age metric.
2. Run the hold-release worker manually if needed.
3. Investigate the cause (gateway crash, settle bug) and fix it.

### 7.3 Key rotation
- **Agent API keys:** create a new key, migrate clients, revoke the old key. Revoke immediately if leaked.
- **Provider keys:** rotate at the provider, update the encrypted secret, verify with a test request, revoke the old key.
- **Encryption keys (KMS):** use key version rotation and re-encrypt gradually.

### 7.4 Abnormal spending incident
1. Activate the kill switch on the affected agent or organization.
2. Revoke the involved API keys.
3. Review audit logs and usage to determine scope.
4. Correct balances with adjustment entries if needed.
5. Write a blameless post-mortem and update the threat model.

### 7.5 Model provider outage
1. Confirm fallback is working and the error rate is dropping.
2. Mark the provider as degraded in routing configuration.
3. Communicate to users through a status page if impact is visible.

## 8. Releases

- Semantic versioning (`MAJOR.MINOR.PATCH`) and `CHANGELOG.md`.
- Signed tags and releases (cosign). Multi-arch Docker images.
- An SBOM is attached to every release.
- Database migrations are tested on a copy of data before release.
- Releases that change money schemas require human review and a written rollback plan.

## 9. Legal alignment

Walawe is designed to be non-custodial and to use prepaid credits to reduce regulatory burden, but design alone does not remove it. Before accepting real user funds, consult a fintech lawyer in the jurisdiction of operation. Features that hold or move user funds, exchange currencies, or send money on behalf of users require an ADR and human approval (see `AGENTS.md`).
