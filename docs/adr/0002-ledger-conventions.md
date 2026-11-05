# 0002. Ledger conventions

- Status: Proposed (money design: human review required before stage 1)
- Date: 2026-11-05

## Context

The ledger is the source of truth for balances. Its conventions must be fixed before any money code or schema is merged (AGENTS.md sections 2 and 5).

## Decision

1. **Units:** all amounts are `bigint` micro-USD (1 USD = 1,000,000). No floating point anywhere.
2. **Entries:** each `ledger_entries` row moves `amount_micro_usd` from `debit_account` to `credit_account`. Debits equal credits by construction.
3. **Balance:** `SUM(credits) - SUM(debits)` for an account (view `ledger_balances`).
4. **Account kinds:** `credit` (agent spendable balance), `hold` (funds reserved), `revenue`, `provider_cost`, `external` (funding source, goes negative by design).
5. **Flows:**
   - Top-up: debit `external`, credit `credit`.
   - Reserve: debit `credit`, credit `hold`. Creates an `open` hold.
   - Settle: debit `hold`, credit `revenue` (actual cost); debit `hold`, credit `credit` (unused remainder). Hold becomes `settled`.
   - Release (cancel or timeout): debit `hold`, credit `credit`. Hold becomes `released`.
6. **Idempotency:** every entry has a unique `idempotency_key`. Multi-entry operations derive keys (`<key>#1`, `<key>#2`).
7. **Immutability:** `ledger_entries` and `audit_logs` are append-only (triggers). Corrections are new adjustment entries.
8. **Hold TTL:** default 300 seconds (`WALAWE_HOLD_TTL_SECONDS`). A worker releases expired open holds.
9. **Fail closed:** no policy row means the agent is denied.

## Consequences

- Fully auditable, simple reconciliation, safe retries.
- Provider cost accounting (`provider_cost` postings) is not defined yet.
- Row-level contention on a hot agent account is possible at high volume (see ARCHITECTURE.md section 9).

## Open questions (maintainer to decide)

1. Are margins posted at settle time or computed in reports?
2. When and how is `provider_cost` posted (at settle, or after reconciliation)?
3. Is one idempotency key per entry enough, or do we need a per-operation table?
4. Per-organization currency beyond USD? (Out of scope for v0.)
