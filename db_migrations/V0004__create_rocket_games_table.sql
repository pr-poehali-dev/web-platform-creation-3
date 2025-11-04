CREATE TABLE t_p23316503_web_platform_creatio.rocket_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p23316503_web_platform_creatio.users(id),
    bet_amount NUMERIC(10,2) NOT NULL,
    multiplier NUMERIC(10,2) NOT NULL,
    crash_point NUMERIC(10,2) NOT NULL,
    profit NUMERIC(10,2) NOT NULL,
    won BOOLEAN NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rocket_games_user_id ON t_p23316503_web_platform_creatio.rocket_games(user_id);
CREATE INDEX idx_rocket_games_created_at ON t_p23316503_web_platform_creatio.rocket_games(created_at);
