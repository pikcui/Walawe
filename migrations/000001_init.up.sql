-- Walawe initial schema (stage 0).
-- STATUS: DRAFT. Contains money tables: human review required (AGENTS.md section 5).
-- TODO(verify): run against PostgreSQL 16 and review constraints before merging.
--
-- Conventions (see docs/adr/0002-ledger-conventions.md):
--  * All money is bigint micro-USD (1 USD = 1,000,000). Never floating point.
--  * Each ledger entry moves amount from debit_account to credit_account,
--    so debits equal credits by construction.
--  * Balance of an account = SUM(credits) - SUM(debits).
--  * ledger_entries and audit_logs are append-only (enforced by triggers).
--  * Fail closed: an agent without a policy row is denied by the policy engine.

CREATE TABLE organizations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projects (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     uuid NOT NULL REFERENCES organizations (id),
    name       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, name)
);

CREATE TYPE agent_status AS ENUM ('active', 'suspended');

CREATE TABLE agents (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects (id),
    name       text NOT NULL,
    status     agent_status NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

-- Only a hash of the key is stored. The raw key is shown once at creation.
CREATE TABLE api_keys (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id   uuid NOT NULL REFERENCES agents (id),
    prefix     text NOT NULL,
    key_hash   bytea NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz
);
CREATE INDEX api_keys_agent_idx ON api_keys (agent_id);
CREATE INDEX api_keys_prefix_idx ON api_keys (prefix);

-- NULL limit = no limit of that kind. Empty allowed_models = no model allowed (fail closed).
CREATE TABLE policies (
    agent_id           uuid PRIMARY KEY REFERENCES agents (id),
    max_per_request    bigint CHECK (max_per_request IS NULL OR max_per_request > 0),
    daily_limit        bigint CHECK (daily_limit IS NULL OR daily_limit > 0),
    monthly_limit      bigint CHECK (monthly_limit IS NULL OR monthly_limit > 0),
    allowed_models     text[] NOT NULL DEFAULT '{}',
    approval_threshold bigint CHECK (approval_threshold IS NULL OR approval_threshold > 0),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE ledger_account_kind AS ENUM ('credit', 'hold', 'revenue', 'provider_cost', 'external');

CREATE TABLE ledger_accounts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     uuid NOT NULL REFERENCES organizations (id),
    agent_id   uuid REFERENCES agents (id),
    kind       ledger_account_kind NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE NULLS NOT DISTINCT (org_id, agent_id, kind)
);

CREATE TABLE ledger_entries (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    debit_account     uuid NOT NULL REFERENCES ledger_accounts (id),
    credit_account    uuid NOT NULL REFERENCES ledger_accounts (id),
    amount_micro_usd  bigint NOT NULL CHECK (amount_micro_usd > 0),
    ref_type          text NOT NULL,
    ref_id            text NOT NULL,
    -- One entry per idempotent operation. Multi-entry operations derive keys (e.g. "<key>#1").
    idempotency_key   text NOT NULL UNIQUE,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CHECK (debit_account <> credit_account)
);
CREATE INDEX ledger_entries_debit_idx ON ledger_entries (debit_account);
CREATE INDEX ledger_entries_credit_idx ON ledger_entries (credit_account);

CREATE VIEW ledger_balances AS
SELECT
    a.id AS account_id,
    COALESCE(c.total, 0) - COALESCE(d.total, 0) AS balance_micro_usd
FROM ledger_accounts a
LEFT JOIN (
    SELECT credit_account, SUM(amount_micro_usd) AS total
    FROM ledger_entries GROUP BY credit_account
) c ON c.credit_account = a.id
LEFT JOIN (
    SELECT debit_account, SUM(amount_micro_usd) AS total
    FROM ledger_entries GROUP BY debit_account
) d ON d.debit_account = a.id;

CREATE TYPE hold_status AS ENUM ('open', 'settled', 'released');

CREATE TABLE holds (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id       text NOT NULL UNIQUE,
    agent_id         uuid NOT NULL REFERENCES agents (id),
    amount_micro_usd bigint NOT NULL CHECK (amount_micro_usd > 0),
    status           hold_status NOT NULL DEFAULT 'open',
    expires_at       timestamptz NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    settled_at       timestamptz,
    CHECK ((status = 'open' AND settled_at IS NULL) OR (status <> 'open' AND settled_at IS NOT NULL))
);
CREATE INDEX holds_open_expiry_idx ON holds (expires_at) WHERE status = 'open';

CREATE TABLE usage_events (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id       text NOT NULL UNIQUE,
    agent_id         uuid NOT NULL REFERENCES agents (id),
    provider         text NOT NULL,
    model            text NOT NULL,
    tokens_in        bigint NOT NULL CHECK (tokens_in >= 0),
    tokens_out       bigint NOT NULL CHECK (tokens_out >= 0),
    cost_micro_usd   bigint NOT NULL CHECK (cost_micro_usd >= 0),
    latency_ms       integer NOT NULL CHECK (latency_ms >= 0),
    status           text NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usage_events_agent_time_idx ON usage_events (agent_id, created_at DESC);

-- Hash chaining is computed by the application: hash = H(prev_hash || canonical(row)).
CREATE TABLE audit_logs (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    org_id     uuid REFERENCES organizations (id),
    actor      text NOT NULL,
    action     text NOT NULL,
    target     text NOT NULL,
    details    jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    prev_hash  bytea,
    hash       bytea NOT NULL
);

CREATE FUNCTION forbid_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '% on % is not allowed: table is append-only', TG_OP, TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER ledger_entries_append_only
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER ledger_entries_no_truncate
    BEFORE TRUNCATE ON ledger_entries
    FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();

CREATE TRIGGER audit_logs_append_only
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER audit_logs_no_truncate
    BEFORE TRUNCATE ON audit_logs
    FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();
