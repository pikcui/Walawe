-- Adds provider cost to usage_events (ADR 0002, decision 10).
-- STATUS: DRAFT. Money-related: human review required.
-- TODO(verify): run against PostgreSQL 16.
--
-- cost_micro_usd           = amount billed to the customer
-- provider_cost_micro_usd  = cost charged by the provider (for margin reports)
-- Margin = cost_micro_usd - provider_cost_micro_usd.

ALTER TABLE usage_events
    ADD COLUMN provider_cost_micro_usd bigint NOT NULL DEFAULT 0
        CHECK (provider_cost_micro_usd >= 0);

COMMENT ON COLUMN usage_events.cost_micro_usd IS 'Amount billed to the customer, in micro-USD.';
COMMENT ON COLUMN usage_events.provider_cost_micro_usd IS 'Cost charged by the provider, in micro-USD. Used for margin reports.';
