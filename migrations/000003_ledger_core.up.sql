CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    balance BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE entries (
    id BIGSERIAL PRIMARY KEY,
    debit TEXT NOT NULL REFERENCES accounts(id),
    credit TEXT NOT NULL REFERENCES accounts(id),
    amount BIGINT NOT NULL CHECK (amount > 0),
    ref_type TEXT NOT NULL,
    ref_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE holds (
    request_id TEXT PRIMARY KEY,
    credit_account TEXT NOT NULL,
    hold_account TEXT NOT NULL,
    amount BIGINT NOT NULL,
    billed_amount BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    settled_at TIMESTAMPTZ
);
