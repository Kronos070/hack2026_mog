-- Migration V1.0.3: Add booster_level to game_rounds table
ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS booster_level INT;
