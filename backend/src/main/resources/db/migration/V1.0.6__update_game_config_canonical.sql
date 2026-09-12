-- Migration V1.0.6: Update game_configs to canonical JSON format matching frontend contract
-- Primary gameId: 'air-balloon'

INSERT INTO game_configs (id, config_data, updated_at)
VALUES (
    'air-balloon',
    '{
        "gameId": "air-balloon",
        "gameName": "Воздушный Шар",
        "isActive": true,
        "alpha": 1.30,
        "maxMultiplier": 100.0,
        "minCrashMultiplier": 1.01,
        "multiplierGrowthRate": 0.22,
        "growthAcceleration": 1.5,
        "pointsPerLine": 10,
        "pointsCashoutBonus": 25,
        "pointsBoosterBonus": 50,
        "boosterTierValues": [1.0, 2.0, 3.0, 4.0],
        "lootProbabilities": {
            "green": [0.0, 0.25, 0.20, 0.18, 0.15, 0.10, 0.07, 0.04, 0.01],
            "red": [0.0, 0.20, 0.18, 0.15, 0.13, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02, 0.01]
        },
        "minWinAmount": 50,
        "popupTimeout": 10
    }'::jsonb,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE
SET config_data = EXCLUDED.config_data,
    updated_at = CURRENT_TIMESTAMP;

-- Also update default record for backward compatibility
UPDATE game_configs
SET config_data = '{
    "gameId": "air-balloon",
    "gameName": "Воздушный Шар",
    "isActive": true,
    "alpha": 1.30,
    "maxMultiplier": 100.0,
    "minCrashMultiplier": 1.01,
    "multiplierGrowthRate": 0.22,
    "growthAcceleration": 1.5,
    "pointsPerLine": 10,
    "pointsCashoutBonus": 25,
    "pointsBoosterBonus": 50,
    "boosterTierValues": [1.0, 2.0, 3.0, 4.0],
    "lootProbabilities": {
        "green": [0.0, 0.25, 0.20, 0.18, 0.15, 0.10, 0.07, 0.04, 0.01],
        "red": [0.0, 0.20, 0.18, 0.15, 0.13, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02, 0.01]
    },
    "minWinAmount": 50,
    "popupTimeout": 10
}'::jsonb,
updated_at = CURRENT_TIMESTAMP
WHERE id = 'default';
