-- Migration V1.0.10: Add user_stat_radars table and booster_activated flag in game_rounds

-- 1. Add booster_activated flag to game_rounds for exact booster analytics
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS booster_activated BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create user_stat_radars table
CREATE TABLE IF NOT EXISTS user_stat_radars (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patience DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    boosters DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    collector DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    generosity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    win_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    risk DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    games_analyzed INT NOT NULL DEFAULT 0,
    total_games BIGINT NOT NULL DEFAULT 0,
    next_recalc_in INT NOT NULL DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_stat_radar UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_stat_radars_user_id ON user_stat_radars (user_id);
