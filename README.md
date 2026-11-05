# Walawe

**Open-source wallet and API gateway infrastructure for AI agents.**

Walawe lets AI agents call models and paid APIs on their own, with hard spending limits set by humans. One API key, many models, per-agent budgets, and a full audit trail.

> **Status: early development (pre-alpha).** The design is documented, the code is being built. Interfaces below describe the target behavior and may change. Do not use it with real funds yet.

## Why Walawe

AI agents need to pay for things: model calls, data APIs, tools. Today that means juggling API keys, topping up balances by hand, and hoping a buggy or hijacked agent does not burn through your budget.

Walawe gives each agent its own wallet and rules:

- **One endpoint, many models.** OpenAI- and Anthropic-compatible API. Change the base URL, keep your code.
- **Per-agent budgets.** Limits per request, per day, per month. Model and destination allowlists.
- **Deterministic policy engine.** Spending rules are enforced by code, not by prompts. A hijacked agent cannot talk its way past them.
- **Accurate metering.** Every token is metered and charged through a double-entry ledger (reserve, then settle).
- **Kill switch.** Suspend an agent or an entire organization instantly.
- **Audit trail.** Every spend and every policy change is recorded.
- **Self-hostable.** Run it yourself with Docker Compose or Helm.
- **Non-custodial by design (v1).** Machine-to-machine payments (x402 / USDC) through smart accounts and scoped session keys. Your master key never touches our servers.

## How it works

```
Agent / SDK
    |  HTTPS (API key)
    v
Gateway:  auth > policy > reserve > route > stream > settle
    |
    +--> Policy Engine     (deterministic rules)
    +--> Ledger            (double-entry, append-only)
    +--> Provider Adapters (OpenAI, Anthropic, ...)
```

1. The agent sends a request to Walawe with its API key.
2. The policy engine checks the rules. Denied requests stop here with a clear reason.
3. Walawe places a hold on the maximum possible cost.
4. The request is routed to a provider and streamed back.
5. Walawe settles the real cost and releases the rest of the hold.

Details: [ARCHITECTURE.md](ARCHITECTURE.md).

## Quickstart (target experience)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",   # your Walawe gateway
    api_key="wlw_...",                      # per-agent Walawe key
)

resp = client.chat.completions.create(
    model="<model-name>",
    messages=[{"role": "user", "content": "Hello"}],
)
```

Run locally (available once stage 0 of the roadmap lands):

```bash
git clone https://github.com/<your-org>/walawe.git
cd walawe
cp .env.example .env
docker compose up
```

Full guides will live in [`docs/guides`](docs/guides).

## Repository layout

```
/apps
  /gateway          Go, main request path
  /dashboard-api    Go, admin and reporting API
  /web              Next.js dashboard
/packages
  /ledger           double-entry ledger
  /policy-engine    spending policy evaluation
  /providers        model provider adapters
  /sdk-python       Python SDK (generated from OpenAPI)
  /sdk-ts           TypeScript SDK (generated from OpenAPI)
  /contracts        smart contracts (v1)
/deploy             docker-compose, helm
/docs               system docs, API spec, ADRs, runbooks
```

## Documentation

| Document | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, request flow, design decisions, failure modes |
| [docs/SYSTEM.md](docs/SYSTEM.md) | API, data model, configuration, observability, runbooks |
| [SECURITY.md](SECURITY.md) | Threat model, security controls, how to report vulnerabilities |
| [AGENTS.md](AGENTS.md) | Rules for AI agents and contributors building this repo |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

## Roadmap

- **MVP:** gateway, ledger, prepaid credits, spending policies, basic dashboard, Python and TypeScript SDKs, self-hosting.
- **v1:** non-custodial smart accounts with session keys, x402 payments, human approvals, webhooks, bring-your-own-key.
- **v2:** RBAC and SSO, anomaly detection, multi-chain.

## Security

Found a vulnerability? Please **do not** open a public issue. Use GitHub's private vulnerability reporting. See [SECURITY.md](SECURITY.md).

## Legal notice

Walawe handles monetary value. Operators are responsible for complying with the laws that apply where they run it, including rules on payments, stored value, and crypto-assets. The software is provided as is, without warranty, under the license below.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) first.

## License

[Apache License 2.0](LICENSE).
