-- Migration V1.0.5: Add points to users table and seed initial ADMIN user

ALTER TABLE users ADD COLUMN IF NOT EXISTS points BIGINT NOT NULL DEFAULT 0;

-- Seed Admin user (username: admin, password: admin123, role: ADMIN)
-- Standard BCrypt hash for "admin123": $2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6.yEPJFLZUU9jf56
INSERT INTO users (username, email, password_hash, bonus_balance, role, first_name, last_name, points, current_house_edge)
VALUES (
    'admin',
    'admin@stoloto.ru',
    '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6.yEPJFLZUU9jf56',
    50000,
    'ADMIN',
    'Главный',
    'Администратор',
    5000,
    0.04
)
ON CONFLICT (username) DO UPDATE
SET role = 'ADMIN';
