CREATE TABLE IF NOT EXISTS bot_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bot_settings (setting_key, setting_value) VALUES
    ('admin_telegram', '@admin'),
    ('channel_url', 'https://t.me/yourchannel'),
    ('chat_url', 'https://t.me/yourchat'),
    ('investment_percent', '3'),
    ('bot_status', 'running'),
    ('require_subscription', 'true'),
    ('required_channels', '[]'),
    ('required_chats', '[]'),
    ('required_bots', '[]'),
    ('payment_bot', '@CryptoBot'),
    ('withdraw_bot', '@CryptoBot')
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS payment_requests (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES telegram_users(user_id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_payment_requests_user ON payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);