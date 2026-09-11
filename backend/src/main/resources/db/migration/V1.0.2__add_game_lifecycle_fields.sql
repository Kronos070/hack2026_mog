-- Migration V1.0.2: Add player house edge and game lifecycle fields

-- Add house edge and last bet tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_house_edge NUMERIC(6, 4) NOT NULL DEFAULT 0.04;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_bet_amount BIGINT;

-- Add lifecycle, timing and provably fair fields to game_rounds table
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'FINISHED';
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS server_seed VARCHAR(64);
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS client_seed VARCHAR(64);
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS combined_hash VARCHAR(64);
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS nonce BIGINT DEFAULT 0;
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS house_edge NUMERIC(6, 4) DEFAULT 0.04;

-- Index for active games per user
CREATE INDEX IF NOT EXISTS idx_game_rounds_user_status ON game_rounds(user_id, status);
