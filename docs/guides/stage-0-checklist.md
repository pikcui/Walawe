# Stage 0 checklist

Stage 0 is done when (AGENTS.md section 6): CI is green and `docker compose up` works.

- [ ] `cp .env.example .env` and set `POSTGRES_PASSWORD`
- [ ] `docker compose up --build` starts postgres, redis, nats, runs migrations, starts gateway
- [ ] `curl http://localhost:8080/healthz` returns `{"status":"ok"}`
- [ ] `make test` and `make lint` pass locally
- [ ] CI is green on `main`
- [ ] Migration `000001_init` reviewed by a human (money tables)
- [ ] ADR 0001 and 0002 accepted (or revised) by the maintainer
- [ ] Branch protection, secret scanning, Dependabot, and private vulnerability reporting enabled
