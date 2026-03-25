CREATE TABLE users (
    id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email        TEXT        NOT NULL UNIQUE,
    display_name TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webauthn_credentials (
    id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id BYTEA       NOT NULL UNIQUE,
    public_key    BYTEA       NOT NULL,
    sign_count    BIGINT      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE oauth_identities (
    id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         TEXT        NOT NULL,
    provider_user_id TEXT        NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_user_id)
);
