# 0001. Use Go for the gateway and ledger

- Status: Proposed (needs maintainer acceptance)
- Date: 2026-11-05

## Context

The gateway sits on every request and must add very little latency (target p95 overhead under 30 ms), handle many concurrent streaming connections, and be easy to self-host as a single binary.

## Decision

Use Go (1.23+) for `apps/gateway`, `apps/dashboard-api`, and the Go packages (`ledger`, `policy-engine`, `providers`).

## Consequences

- Simple concurrency for streaming proxies, small static binaries, fast builds, large contributor pool.
- Garbage collection pauses are acceptable for this latency target.
- Less compile-time safety around money types than Rust; mitigated by a dedicated integer money type, property tests, and linting.

## Alternatives considered

- **Rust:** stronger safety guarantees and no GC, but slower onboarding for contributors and slower iteration for an early-stage project. Can be revisited for isolated hot paths.
- **TypeScript (Node):** fast to write, but higher per-connection overhead and weaker fit for the ledger.
