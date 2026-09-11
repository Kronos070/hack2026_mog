-- Migration V1.0.1: Add profile fields and role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'USER';

-- Create index on username and email if not exists
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Ensure sequence matches highest existing ID
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
