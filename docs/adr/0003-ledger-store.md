# 0003. Ledger store abstraction and stage 1 split

- Status: Accepted (decisions 1 to 8). The open questions below are deferred to stage 1b.
- Date: 2026-11-05

## Context
[... (biarkan isi sebelumnya) ...]

## Open questions (maintainer to decide in 1b)

1. Isolation strategy for `Reserve`: serializable transactions with retry, or `SELECT ... FOR UPDATE` on the credit account row.
   **Decision:** We will use `SELECT ... FOR UPDATE` on the credit account row. It is simpler to reason about and avoids serialization failure retry storms.
2. Default hold TTL (ADR 0002 proposes 300 seconds) versus the maximum streaming duration.
   **Decision:** We will set the default hold TTL to 600 seconds (10 minutes) to safely accommodate long LLM streaming responses.
