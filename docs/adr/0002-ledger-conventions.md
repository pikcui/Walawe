# 0002. Ledger conventions

- Status: Accepted
- Date: 2026-11-05

## Context

The ledger is the source of truth for balances. Its conventions must be fixed before any money code or schema is merged (AGENTS.md sections 2 and 5).

## Decision

1. **Units:** all amounts are `bigint` micro-USD (1 USD = 1,000,000). No floating point anywhere.
2. **Entries:** each `ledger_entries` row moves `amount_micro_usd` from `debit_account` to `credit_account`. Debits equal credits by construction.
3. **Balance:** `SUM(credits) - SUM(debits)` for an account (view `ledger_balances`).
4. **Account kinds:** `credit` (agent spendable balance), `hold` (funds reserved), `revenue`, `provider_cost`, `external` (funding source, goes negative by design). `provider_cost` is reserved for later and is **not posted in v0** (see decision 10).
5. **Flows:**
   - Top-up: debit `external`, credit `credit`.
   - Reserve: debit `credit`, credit `hold`. Creates an `open` hold.
   - Settle: debit `hold`, credit `revenue` (actual billed cost); debit `hold`, credit `credit` (unused remainder). Hold becomes `settled`.
   - Release (cancel or timeout): debit `hold`, credit `credit`. Hold becomes `released`.
6. **Idempotency:** every entry has a unique `idempotency_key`. Multi-entry operations derive keys (`<key>#1`, `<key>#2`). One unique key per entry is sufficient; no separate per-operation table in v0.
7. **Immutability:** `ledger_entries` and `audit_logs` are append-only (triggers). Corrections are new adjustment entries.
8. **Hold TTL:** default 300 seconds (`WALAWE_HOLD_TTL_SECONDS`). A worker releases expired open holds.
9. **Fail closed:** no policy row means the agent is denied.
10. **Margin and provider cost (v0):**
    - The ledger records only what is billed to the customer. Margin is **not** posted in the ledger.
    - Provider cost is **not** posted in the ledger in v0. It is stored per request in `usage_events.provider_cost_micro_usd` (migration 000002).
    - Margin is computed in reports as `cost_micro_usd - provider_cost_micro_usd`.
    - Posting `provider_cost` entries is reconsidered once daily reconciliation exists.
11. **Currency:** USD only in v0. Multi-currency is out of scope.

## Consequences

- Fully auditable, simple reconciliation, safe retries.
- The ledger stays small and easy to test in stage 1.
- Precise margin accounting (provider cost as ledger postings) is deferred until reconciliation exists. Until then margin reports rely on `usage_events`, not on the ledger.
- Row-level contention on a hot agent account is possible at high volume (see ARCHITECTURE.md section 9).

## Resolved questions

1. Margins posted at settle time or computed in reports? **Computed in reports.**
2. When is `provider_cost` posted? **Not in v0. Stored in `usage_events`; revisit with reconciliation.**
3. Is one idempotency key per entry enough? **Yes, with derived keys for multi-entry operations.**
4. Currency beyond USD? **No, USD only in v0.**
