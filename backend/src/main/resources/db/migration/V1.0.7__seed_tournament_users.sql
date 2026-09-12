-- Migration V1.0.7: Index on score and seed test users for tournament leaderboard

CREATE INDEX IF NOT EXISTS idx_tournament_entries_score ON tournament_entries (score DESC);

-- Seed 35 test users with varied points and tournament entries
DO $$
DECLARE
    dummy_hash VARCHAR(255) := '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6.yEPJFLZUU9jf56';
    names text[] := ARRAY[
        'alex_pilot', 'sky_queen', 'wind_master', 'aero_star', 'cloud_walker',
        'lucky_ace', 'storm_rider', 'viktor_fly', 'daria_sky', 'zephyr99',
        'max_zenith', 'elena_avia', 'ivan_pilot', 'olga_breeze', 'artem_strato',
        'natalia_wing', 'sergey_air', 'anna_cloud', 'dmitry_falcon', 'mariya_aero',
        'pavel_altitude', 'sofia_soar', 'kirill_jet', 'yulia_glide', 'egor_thermal',
        'tatiana_swift', 'roman_balloon', 'alisa_gust', 'gleb_tailwind', 'polina_drift',
        'denis_horizon', 'ksenia_apex', 'vlad_voyage', 'valeria_ascent', 'mikhail_flight'
    ];
    first_names text[] := ARRAY[
        'Александр', 'Елена', 'Дмитрий', 'Мария', 'Сергей',
        'Анна', 'Максим', 'Виктор', 'Дарья', 'Константин',
        'Михаил', 'Елена', 'Иван', 'Ольга', 'Артем',
        'Наталья', 'Сергей', 'Анна', 'Дмитрий', 'Мария',
        'Павел', 'София', 'Кирилл', 'Юлия', 'Егор',
        'Татьяна', 'Роман', 'Алиса', 'Глеб', 'Полина',
        'Денис', 'Ксения', 'Владислав', 'Валерия', 'Михаил'
    ];
    scores int[] := ARRAY[
        3450, 2890, 2410, 1980, 1650,
        1420, 1280, 1150, 1040, 950,
        880, 810, 750, 690, 640,
        590, 540, 500, 460, 420,
        390, 360, 330, 300, 270,
        240, 210, 190, 170, 150,
        130, 110, 90, 75, 50
    ];
    u_id BIGINT;
    i INT;
BEGIN
    FOR i IN 1..array_length(names, 1) LOOP
        -- Insert user if not exists
        INSERT INTO users (username, email, password_hash, bonus_balance, role, first_name, points, current_house_edge)
        VALUES (
            names[i],
            names[i] || '@stoloto.ru',
            dummy_hash,
            1000 + (scores[i] * 2),
            'USER',
            first_names[i],
            scores[i],
            0.04
        )
        ON CONFLICT (username) DO UPDATE
        SET points = EXCLUDED.points
        RETURNING id INTO u_id;

        -- Insert or update tournament entry
        INSERT INTO tournament_entries (user_id, username, score, updated_at)
        VALUES (u_id, names[i], scores[i], CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE
        SET score = EXCLUDED.score,
            username = EXCLUDED.username,
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;
END $$;
