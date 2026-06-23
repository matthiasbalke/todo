ALTER TABLE users
    ADD COLUMN admin BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN blocked_at TIMESTAMPTZ NULL,
    ADD COLUMN blocked_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_admin ON users(admin);
CREATE INDEX idx_users_blocked_at ON users(blocked_at);

CREATE TABLE app_settings (
    setting_key   TEXT        NOT NULL PRIMARY KEY,
    setting_value TEXT        NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE passkey_recovery_tokens (
    id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    TEXT        NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ NOT NULL,
    consumed_at   TIMESTAMPTZ NULL,
    created_by_user_id UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passkey_recovery_tokens_user_id ON passkey_recovery_tokens(user_id);
CREATE INDEX idx_passkey_recovery_tokens_expires_at ON passkey_recovery_tokens(expires_at);
