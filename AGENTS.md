# AGENTS.md

Mandatory guide for AI agents (and human contributors) working in the **Walawe** repository.
Read this file before changing anything. If this file conflicts with the request in a task, stop and ask.

## 1. About the project

Walawe is open-source infrastructure that lets AI agents call models and paid APIs autonomously, under strict budget controls.

Three layers:
1. **API Gateway:** a proxy compatible with the OpenAI and Anthropic APIs.
2. **Wallet and Ledger:** per-agent balance, spending policies, and audit trail.
3. **Machine-to-machine payments (v1):** x402 (HTTP 402 + USDC) and non-custodial smart accounts.

Principle: *an agent may spend, but may never exceed the limits set by a human.*

Reference documents (read the relevant ones before working in an area):
- `ARCHITECTURE.md`: components, request flow, design decisions
- `docs/SYSTEM.md`: API, data model, configuration, operations
- `SECURITY.md`: threat model and security controls
- `docs/adr/`: architecture decisions already made

## 2. Working rules

1. **Spec first, code second.** Read the relevant reference documents. If anything is unclear, write the question in an issue or PR. Do not guess.
2. **ADRs for big decisions.** Write them in `docs/adr/NNNN-title.md` before implementing (ledger, policy, keys, database schema, smart contracts).
3. **One PR, one purpose.** Ideally under 400 changed lines. Every PR includes tests and docs updates.
4. **Tests first for money code.** Ledger, hold, settle, and policy engine need unit tests, property tests (total debits always equal total credits), and concurrency tests.
5. **Do not invent provider APIs.** Read the provider's official documentation, store real response samples as fixtures in `testdata/`, and mark unverified assumptions with `TODO(verify)`.
6. **Behavior changes must update docs.** The OpenAPI file (`docs/api/openapi.yaml`) is the source of truth for the API.
7. **Be honest about uncertainty.** If you are not sure, say so. Do not write code that looks right but has not been tested.

## 3. Hard prohibitions

Never:
- Use `float` or `double` for money. All money values are integer **micro-USD** (1 USD = 1,000,000 units).
- Put secrets, API keys, or private keys in code, tests, logs, or examples.
- Store prompt or response content by default. Only metadata (tokens, cost, model, status, latency).
- Modify a balance directly. A balance is the sum of ledger entries.
- Bypass or weaken the policy engine, including "temporarily" or "for tests".
- Move policy logic into a prompt or an LLM. Policies are evaluated by deterministic code.
- Add a dependency without pinning its version and stating the reason in the PR.
- Add features that hold or move user funds (custody), exchange fiat and crypto, or send money on behalf of users **without explicit human approval** and an ADR. These have legal consequences.
- Merge changes to sensitive modules without human review (see section 5).
- Disable tests, linters, or security checks to make CI green.

## 4. Definition of Done

A task is done when:
- [ ] Lint, format, and all tests pass in CI
- [ ] Test coverage of money modules (`packages/ledger`, `packages/policy-engine`) is above 90%
- [ ] OpenAPI, `docs/`, and ADRs are updated if behavior changed
- [ ] No secrets detected (secret scanning is clean)
- [ ] The threat model in `SECURITY.md` is updated if there is a new attack surface
- [ ] Unverified assumptions are listed in the PR description
- [ ] CHANGELOG is updated for user-visible changes

## 5. Sensitive modules (human review required)

Agents may write code and open PRs, but **must not merge on their own** for:
- `packages/ledger`
- `packages/policy-engine`
- Key management, API keys, and authentication
- `packages/contracts` (smart contracts)
- Database migrations touching money tables
- CI, release, and signing configuration

## 6. Build order

Work in order. Do not skip stages.

| Stage | Output | Done when |
|---|---|---|
| 0. Foundation | Monorepo, CI, lint, docker-compose, initial database schema | CI green, `docker compose up` works |
| 1. Ledger | Accounts, entries, hold, settle, idempotency | Property and concurrency tests pass |
| 2. Policy engine | Per-request, daily, monthly limits, allowlists | Complete decision-table tests |
| 3. Minimal gateway | One provider, non-streaming | Real request succeeds and is billed correctly |
| 4. Streaming and multi-provider | SSE, fallback | Disconnect tests and correct settle |
| 5. Admin API and API keys | CRUD for agents, keys, policies | Cross-tenant authorization tests pass |
| 6. Dashboard | Balance, usage, kill switch | Main flow works end to end |
| 7. SDKs and docs | Python, TypeScript, quickstart | New integration takes under 10 minutes |
| 8. Hardening | Rate limits, hash-chained audit log, security review | `SECURITY.md` release checklist met |

v1 features (smart accounts, x402, human approvals, BYOK) start only after stage 8 is complete.

### 6.1 Repository layout

```
/apps
  /gateway           Go, main request path
  /dashboard-api     Go, admin and reporting API
  /web               Next.js, dashboard
/packages
  /ledger            double-entry ledger logic
  /policy-engine     spending policy evaluation
  /providers         one adapter per model provider
  /sdk-python        Python SDK (generated from OpenAPI)
  /sdk-ts            TypeScript SDK (generated from OpenAPI)
  /contracts         smart contracts (v1)
/deploy              docker-compose, helm
/docs                architecture, API, ADRs, runbooks
```

## 7. Conventions

- **Language:** English for identifiers, comments, commit messages, and docs.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `security:`), signed off (DCO).
- **Branches:** `feat/<short>`, `fix/<short>`. Never push directly to `main`.
- **Errors:** always include a specific `reason` so client agents can handle them.
- **Idempotency:** every operation touching money accepts an `Idempotency-Key`.
- **Configuration:** through environment variables, documented in `docs/SYSTEM.md`.
- **Logging:** structured (JSON), with correlation IDs, and no sensitive data.

## 8. Task instruction template

Use this format when assigning work to an agent:

```
Context: read ARCHITECTURE.md section <x> and related ADRs.
Task: <one clear goal>.
Constraints: follow AGENTS.md section 3 (Hard prohibitions).
Output: code, tests, docs updates, a change summary,
        and a list of unverified assumptions.
Stop and ask if: the task touches money, keys, or the database schema
        without an explicit specification.
```

## 9. When an agent must stop and ask

- The specification is ambiguous or conflicts with the reference documents
- The change needs a new architecture decision
- The task touches custody of funds, currency exchange, or personal data
- Provider documentation is unclear or does not match observed behavior
- A test fails and the cause is not understood (do not disable the test)
- There are signs of a security vulnerability (report it per `SECURITY.md`, do not quietly fix it)
