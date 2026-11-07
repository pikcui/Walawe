-- 000006: add users.agent_id (Fase 3 - Registrasi)
-- Idempotent: aman dijalankan meski kolom sudah pernah ditambahkan.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_agent_id ON users(agent_id);
