-- Migration V1.0.13: Ensure test user is seeded
-- Username: test_user
-- Password: test1234
-- Bonus Balance: 10 000 bonuses

DO $$
DECLARE
    u_id BIGINT;
    pwd_hash VARCHAR(255) := '$2a$10$imM/E72VAdY11xAYK5PO5.zuQQtCmE30snbhiZa5J.O0PE93BfY.q';
BEGIN
    -- 1. Insert or update user 'test_user'
    INSERT INTO users (
        username,
        email,
        password_hash,
        bonus_balance,
        role,
        first_name,
        last_name,
        points,
        current_house_edge,
        puzzle_pity
    )
    VALUES (
        'test_user',
        'test_user@stoloto.ru',
        pwd_hash,
        10000,
        'USER',
        'Тестовый',
        'Пользователь',
        500,
        0.04,
        0
    )
    ON CONFLICT (username) DO UPDATE
    SET email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        bonus_balance = EXCLUDED.bonus_balance,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        points = EXCLUDED.points,
        role = EXCLUDED.role,
        current_house_edge = EXCLUDED.current_house_edge
    RETURNING id INTO u_id;

    -- 2. Ensure NO achievements for test_user
    DELETE FROM user_achievements WHERE user_id = u_id;

    -- 3. Ensure NO puzzle pieces for test_user
    DELETE FROM user_puzzle_pieces WHERE user_id = u_id;

    -- 4. Tournament entry with score = 500
    INSERT INTO tournament_entries (user_id, username, score, updated_at)
    VALUES (u_id, 'test_user', 500, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE
    SET score = EXCLUDED.score,
        username = EXCLUDED.username,
        updated_at = CURRENT_TIMESTAMP;

    -- 5. Seed game rounds for average Meta-Game rank
    DELETE FROM game_rounds WHERE user_id = u_id;

    INSERT INTO game_rounds (
        id, user_id, theme, bet_amount, booster_multiplier, crash_multiplier, cashout_multiplier,
        win_amount, points_earned, is_win, status, booster_activated, created_at
    )
    VALUES
        ('d0000000-0000-0000-0000-000000000001'::uuid, u_id, 'classic', 200, 1, 4.80, 4.50, 900, 50, TRUE, 'FINISHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '14 hours'),
        ('d0000000-0000-0000-0000-000000000002'::uuid, u_id, 'classic', 200, 1, 1.25, NULL, 0, 0, FALSE, 'CRASHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '13 hours'),
        ('d0000000-0000-0000-0000-000000000003'::uuid, u_id, 'classic', 200, 1, 4.80, 4.50, 900, 50, TRUE, 'FINISHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
        ('d0000000-0000-0000-0000-000000000004'::uuid, u_id, 'classic', 200, 1, 1.40, NULL, 0, 0, FALSE, 'CRASHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '11 hours'),
        ('d0000000-0000-0000-0000-000000000005'::uuid, u_id, 'classic', 200, 1, 4.60, 4.50, 900, 50, TRUE, 'FINISHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
        ('d0000000-0000-0000-0000-000000000006'::uuid, u_id, 'classic', 200, 1, 1.15, NULL, 0, 0, FALSE, 'CRASHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '9 hours'),
        ('d0000000-0000-0000-0000-000000000007'::uuid, u_id, 'classic', 200, 1, 4.70, 4.50, 900, 50, TRUE, 'FINISHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '8 hours'),
        ('d0000000-0000-0000-0000-000000000008'::uuid, u_id, 'classic', 200, 1, 1.30, NULL, 0, 0, FALSE, 'CRASHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '7 hours'),
        ('d0000000-0000-0000-0000-000000000009'::uuid, u_id, 'classic', 200, 1, 4.80, 4.50, 900, 50, TRUE, 'FINISHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
        ('d0000000-0000-0000-0000-000000000010'::uuid, u_id, 'classic', 200, 1, 1.35, NULL, 0, 0, FALSE, 'CRASHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
        ('d0000000-0000-0000-0000-000000000011'::uuid, u_id, 'classic', 200, 1, 4.50, 4.50, 900, 50, TRUE, 'FINISHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
        ('d0000000-0000-0000-0000-000000000012'::uuid, u_id, 'classic', 200, 1, 1.20, NULL, 0, 0, FALSE, 'CRASHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
        ('d0000000-0000-0000-0000-000000000013'::uuid, u_id, 'classic', 200, 1, 4.90, 4.50, 900, 50, TRUE, 'FINISHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
        ('d0000000-0000-0000-0000-000000000014'::uuid, u_id, 'classic', 200, 1, 1.50, NULL, 0, 0, FALSE, 'CRASHED', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 hour');

    -- 6. Seed balanced average Radar Stats
    INSERT INTO user_stat_radars (
        user_id, patience, boosters, collector, generosity, win_rate, risk,
        games_analyzed, total_games, next_recalc_in, updated_at
    )
    VALUES (
        u_id, 50.0, 30.0, 20.0, 40.0, 50.0, 45.0,
        14, 14, 10, CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO UPDATE
    SET patience = EXCLUDED.patience,
        boosters = EXCLUDED.boosters,
        collector = EXCLUDED.collector,
        generosity = EXCLUDED.generosity,
        win_rate = EXCLUDED.win_rate,
        risk = EXCLUDED.risk,
        games_analyzed = EXCLUDED.games_analyzed,
        total_games = EXCLUDED.total_games,
        next_recalc_in = EXCLUDED.next_recalc_in,
        updated_at = CURRENT_TIMESTAMP;

END $$;
