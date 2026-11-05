# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Stage 0 foundation: monorepo skeleton, Go workspace, gateway health endpoint,
  docker-compose (Postgres, Redis, NATS), initial database migration (draft),
  CI (gofmt, vet, tests, compose validation, secret scan), ADR 0001 and 0002 (proposed).

### Added (stage 1a)
- `packages/ledger`: double-entry ledger domain logic (Credit, Reserve, Settle, Release,
  ReleaseExpired, Balance) with an in-memory store, unit tests, a concurrency test,
  and a randomized invariant test. Standard library only.
- ADR 0003: ledger store abstraction and stage 1 split (proposed).
