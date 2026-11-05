## What and why

<!-- One purpose per PR. Link the issue or ADR. -->

## Checklist

- [ ] Lint, format, and all tests pass in CI
- [ ] New behavior has tests (money code: unit, property, and concurrency tests)
- [ ] Docs updated (OpenAPI, `docs/`, ADR where relevant)
- [ ] No secrets, keys, or customer data in the change
- [ ] No floating point used for money (integer micro-USD only)
- [ ] No prompt or response content stored or logged by default
- [ ] `CHANGELOG.md` updated for user-visible changes
- [ ] Commits are signed off (`git commit -s`)

## Unverified assumptions

<!-- List anything not verified, or write "None". -->

## Sensitive areas touched

<!-- ledger, policy-engine, keys/auth, contracts, money migrations, CI/release. Human review required. -->
