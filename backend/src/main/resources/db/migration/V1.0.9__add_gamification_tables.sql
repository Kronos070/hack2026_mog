-- Migration V1.0.9: Add gamification tables for puzzles and achievements, and user puzzle pity counter

-- 1. Add puzzle pity counter to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS puzzle_pity INT NOT NULL DEFAULT 0;

-- 2. User puzzle pieces collection
CREATE TABLE IF NOT EXISTS user_puzzle_pieces (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    piece_id VARCHAR(32) NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_puzzle_piece UNIQUE (user_id, piece_id)
);

CREATE INDEX IF NOT EXISTS idx_user_puzzle_pieces_user_id ON user_puzzle_pieces (user_id);

-- 3. User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(64) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements (user_id);

-- 4. Optimization index for aggregating user game stats
CREATE INDEX IF NOT EXISTS idx_game_rounds_user_stats ON game_rounds (user_id, is_win, cashout_multiplier, bet_amount, win_amount);
