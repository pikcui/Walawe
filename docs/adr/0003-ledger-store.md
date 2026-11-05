# 0003. Ledger store abstraction and stage 1 split

- Status: Accepted (decisions 1 to 8). The open questions below are deferred to stage 1b.
- Date: 2026-11-05

## Context

Stage 1 builds the ledger (ADR 0002). It must be testable without a database, and its correctness must not depend on a particular storage engine. Dependencies must be pinned and reviewed (AGENTS.md section 3), and the Go module cache needs network access to resolve them.

## Decision

1. **Split stage 1.**
   - **1a (this ADR):** pure Go, standard library only. Domain logic in `packages/ledger` plus an in-memory `MemStore` used for tests.
   - **1b:** PostgreSQL store (`pgx`) implementing the same `Store` interface, with integration tests against a real PostgreSQL service in CI, run against the migrations in `/migrations`.
2. **`Store` / `Tx` interface.** All ledger operations run inside `Store.Do(ctx, fn)`, an atomic unit of work. `fn` may be retried by the store (for example on a serialization failure), so it must not have side effects outside the `Tx`.
3. **Operations:** `Credit`, `Reserve`, `Settle`, `Release`, `ReleaseExpired`, `Balance`. All are idempotent.
4. **Overdraft rule.** `Reserve` fails with `ErrInsufficientBalance` if the credit account balance is lower than the amount. The check and the entry insert happen in the same `Tx`. Only `external` accounts may go negative.
5. **Settle cannot bill more than was held.** If `Actual` exceeds the held amount, `Settle` returns `ErrActualExceedsHold` and changes nothing. The gateway must size the hold from the maximum possible cost (input tokens plus `max_tokens`). Overage handling is a gateway concern and is out of scope for the ledger.
6. **Expired holds.** `ReleaseExpired` releases open holds whose `ExpiresAt` has passed. A released hold cannot be settled (`ErrHoldNotOpen`). The hold TTL must therefore exceed the longest allowed request duration, and a settle that hits `ErrHoldNotOpen` must be treated as an incident metric by the gateway, not silently ignored.
7. **Invariants tested after every operation** (randomized test over many seeds):
   - the sum of all account balances is zero (debits equal credits);
   - credit, hold and revenue accounts are never negative;
   - the hold account balance equals the sum of all open holds.
8. **Concurrency.** `MemStore` serializes transactions with a mutex. Real concurrency guarantees (serializable isolation, row locking, retry on serialization failure) are verified in stage 1b against PostgreSQL.

## Consequences

- Stage 1a can be reviewed and tested with only the Go standard library.
- The in-memory store proves the logic, not the database behavior. Stage 1b must add concurrency tests on PostgreSQL before the ledger is trusted.
- Callers must handle `ErrActualExceedsHold` and `ErrHoldNotOpen` explicitly.

## Alternatives considered

- **Build directly on PostgreSQL:** closer to production but harder to test and iterate, and needs a dependency before the logic is proven.
- **Advisory locks or `SELECT ... FOR UPDATE` only:** an implementation detail of stage 1b, to be decided there.

## Open questions (maintainer to decide in 1b)

1. Isolation strategy for `Reserve`: serializable transactions with retry, or `SELECT ... FOR UPDATE` on the credit account row.
2. Default hold TTL (ADR 0002 proposes 300 seconds) versus the maximum streaming duration.
