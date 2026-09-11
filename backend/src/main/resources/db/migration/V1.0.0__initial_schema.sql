-- Initial schema for MOG backend

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    bonus_balance BIGINT NOT NULL DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game settings / configuration (hot-reloadable)
CREATE TABLE IF NOT EXISTS game_configs (
    id VARCHAR(64) PRIMARY KEY,
    config_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game rounds history
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    theme VARCHAR(32) NOT NULL,
    bet_amount BIGINT NOT NULL,
    booster_multiplier INT NOT NULL DEFAULT 1,
    crash_multiplier NUMERIC(8, 2) NOT NULL,
    cashout_multiplier NUMERIC(8, 2),
    win_amount BIGINT NOT NULL DEFAULT 0,
    points_earned INT NOT NULL DEFAULT 0,
    is_win BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tournament Leaderboard
CREATE TABLE IF NOT EXISTS tournament_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(64) NOT NULL,
    score BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_tournament UNIQUE (user_id)
);

-- Default Demo Seed Data
INSERT INTO users (id, username, email, password_hash, bonus_balance)
VALUES (1, 'demo_player', 'player@stoloto.ru', '$2a$10$wN3d4R3gGz6vLpC...dummy', 2500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_configs (id, config_data)
VALUES (
    'default',
    '{
        "min_crash_multiplier": 1.01,
        "max_multiplier": 100.0,
        "multiplier_growth_rate": 1.05,
        "fps": 60,
        "points_per_line": 10,
        "points_cashout_bonus": 50,
        "min_win_amount_for_upsale": 50,
        "popup_timeout_seconds": 10
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
