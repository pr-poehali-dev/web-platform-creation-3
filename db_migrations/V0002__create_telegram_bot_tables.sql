CREATE TABLE IF NOT EXISTS telegram_users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    balance DECIMAL(10, 2) DEFAULT 0,
    withdraw_balance DECIMAL(10, 2) DEFAULT 0,
    partners_count INTEGER DEFAULT 0,
    referrer_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES telegram_users(user_id),
    amount DECIMAL(10, 2) NOT NULL,
    accumulated DECIMAL(10, 2) DEFAULT 0,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_collect TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES telegram_users(user_id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telegram_users_referrer ON telegram_users(referrer_id);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);