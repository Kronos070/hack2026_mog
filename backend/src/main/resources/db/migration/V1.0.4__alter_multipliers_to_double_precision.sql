-- Migration V1.0.4: Alter multiplier and house edge column types to DOUBLE PRECISION (float(53))
-- Resolves Hibernate schema-validation mismatch between Java Double and PostgreSQL NUMERIC

ALTER TABLE game_rounds ALTER COLUMN cashout_multiplier SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE game_rounds ALTER COLUMN crash_multiplier SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE game_rounds ALTER COLUMN house_edge SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE users ALTER COLUMN current_house_edge SET DATA TYPE DOUBLE PRECISION;
