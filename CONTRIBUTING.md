# Contributing to Walawe

Thanks for helping build Walawe. This project handles money, so we hold changes to a higher bar than usual. The rules below exist to keep users and their funds safe.

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- Report bugs and unclear docs
- Improve documentation and examples
- Add or improve provider adapters
- Write tests, especially property and concurrency tests
- Fix issues labeled `good first issue` or `help wanted`
- Review pull requests

**Security issues:** do not open a public issue. See [SECURITY.md](SECURITY.md).

## Before you start

1. Read [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [AGENTS.md](AGENTS.md).
2. Search existing issues and pull requests to avoid duplicates.
3. For anything larger than a small fix, **open an issue first** and agree on the approach.
4. For architecture-level changes (ledger, policy, keys, schema, contracts), propose an ADR in `docs/adr/` before writing code.

## Development setup

Prerequisites (final versions are pinned in the repo):
- Go
- Node.js and a package manager (for dashboard and TypeScript SDK)
- Docker and Docker Compose
- Make

```bash
git clone https://github.com/pikcui/Walawe.git
cd Walawe
cp .env.example .env
docker compose up -d        # Postgres, Redis, NATS
make test                   # run the test suite
make lint                   # lint and format check
```

Exact commands are kept current in the `Makefile`.

## Workflow

1. Fork the repo and create a branch from `main`: `feat/<short-name>` or `fix/<short-name>`.
2. Make focused changes. One pull request, one purpose. Aim for under 400 changed lines.
3. Add or update tests and docs.
4. Run lint and tests locally.
5. Sign off your commits (see below) and open a pull request.
6. Respond to review. Maintainers may ask for changes before merging.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(ledger): add idempotent settle
fix(gateway): release hold on client disconnect
docs: clarify policy evaluation order
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `security`.

### Developer Certificate of Origin

We use the [DCO](https://developercertificate.org/) instead of a CLA. Sign every commit:

```bash
git commit -s -m "feat(ledger): add idempotent settle"
```

This adds a `Signed-off-by:` line and certifies you have the right to submit the work under the project license.

## Pull request checklist

- [ ] Lint, format, and all tests pass in CI
- [ ] New behavior has tests (money-related code needs unit, property, and concurrency tests)
- [ ] Docs updated: OpenAPI, `docs/`, ADR where relevant
- [ ] No secrets, keys, or customer data anywhere in the change
- [ ] No floating point used for money (all amounts are integer micro-USD)
- [ ] No prompt or response content is stored or logged by default
- [ ] Unverified assumptions are listed in the PR description
- [ ] `CHANGELOG.md` updated for user-visible changes
- [ ] Commits are signed off

## Sensitive areas

Changes to these areas require review by a maintainer listed in `CODEOWNERS`, and will not be merged without it:

- `packages/ledger`
- `packages/policy-engine`
- Authentication, API keys, and key management
- `packages/contracts`
- Database migrations touching money tables
- CI, release, and signing configuration

## Testing expectations

| Area | Expectation |
|---|---|
| Ledger and policy engine | Coverage above 90%, property tests (debits equal credits), concurrency tests |
| Provider adapters | Contract tests against real recorded responses in `testdata/` |
| Admin API | Cross-tenant authorization tests for every endpoint |
| Parsers and evaluators | Fuzz tests |

Do not disable or skip tests to make CI pass.

## Provider adapters

- Base behavior on the provider's official documentation.
- Record real responses as fixtures. Do not invent response formats.
- Mark anything unverified with `TODO(verify)`.
- Never commit real API keys, even in tests.

## AI-assisted contributions

AI tools are welcome, with conditions:

- You are responsible for everything you submit. Read and understand it.
- Follow [AGENTS.md](AGENTS.md). Agents may open pull requests but must not merge changes to sensitive areas on their own.
- Disclose substantial AI assistance in the pull request description.
- Low-effort, unreviewed, or untested generated code will be closed.

## Scope and legal boundaries

Walawe is designed to be non-custodial and to avoid holding or moving user funds. Contributions that add custody of user funds, currency exchange, or sending money on behalf of users will not be accepted without an approved ADR and maintainer sign-off, because of their legal implications.

Contributions to the `enterprise/` directory (if present) are governed by separate terms.

## Documentation contributions

Docs are first-class. Fix typos directly with a pull request. For larger rewrites, open an issue first. Diagrams should be written as code (Mermaid) so they can be reviewed in diffs.

## Getting help

- Questions and ideas: GitHub Discussions
- Bugs and feature requests: GitHub Issues, using the templates
- Security: see [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](LICENSE), the same license as the project.
