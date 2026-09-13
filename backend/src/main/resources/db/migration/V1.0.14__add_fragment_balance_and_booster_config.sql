-- V1.0.14: Add fragment_balance to users with initial balance 6, and support booster fragment pricing
ALTER TABLE users ADD COLUMN IF NOT EXISTS fragment_balance INTEGER NOT NULL DEFAULT 6;

-- Initialize existing users with 6 fragments
UPDATE users SET fragment_balance = 6 WHERE fragment_balance IS NULL;
