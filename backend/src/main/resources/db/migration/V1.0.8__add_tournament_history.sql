-- Migration V1.0.8: Add tournament history and tournament metadata for reward settlements

CREATE TABLE IF NOT EXISTS tournament_metadata (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    last_settled_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Default daily tournament metadata
INSERT INTO tournament_metadata (id, title, period_start, period_end, last_settled_at)
VALUES (
    'daily_current',
    'Гран-при Воздухоплавателей Столото',
    DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow') AT TIME ZONE 'Europe/Moscow',
    (DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow') + INTERVAL '1 day' - INTERVAL '1 second') AT TIME ZONE 'Europe/Moscow',
    NULL
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS tournament_history (
    id BIGSERIAL PRIMARY KEY,
    tournament_title VARCHAR(128) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(64) NOT NULL,
    place INT NOT NULL,
    score BIGINT NOT NULL,
    prize_awarded BIGINT NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tournament_history_user_id ON tournament_history (user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_history_awarded_at ON tournament_history (awarded_at DESC);
