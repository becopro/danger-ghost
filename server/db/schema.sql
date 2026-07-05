-- server/db/schema.sql

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    google_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    game_state JSONB NOT NULL DEFAULT '{}',
    playtime_minutes INTEGER DEFAULT 0,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by google_uid
CREATE INDEX IF NOT EXISTS idx_accounts_google_uid ON accounts(google_uid);

-- Index to fetch characters by account quickly
CREATE INDEX IF NOT EXISTS idx_characters_account_id ON characters(account_id);
