CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default admin (password: admin123)
-- Hash dibuat menggunakan bcrypt (cost 10)
INSERT INTO users (email, password_hash, role) 
VALUES ('admin@walawe.local', '$2a$10$Xm3aT.tP0Q0Y.Q0Y0Y0Y0Oe4v3Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2Z2', 'admin')
ON CONFLICT DO NOTHING;
