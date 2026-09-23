ALTER TABLE users
    ADD COLUMN validated_at TIMESTAMPTZ NULL,
    ADD COLUMN validation_token TEXT NULL,
    ADD COLUMN validation_started TIMESTAMPTZ NULL,
    ADD COLUMN pending_email TEXT NULL,
    ADD COLUMN pending_email_token TEXT NULL,
    ADD COLUMN pending_email_started TIMESTAMPTZ NULL;

UPDATE users
SET validated_at = now()
WHERE validated_at IS NULL;

CREATE UNIQUE INDEX users_pending_email_identity_unique_idx
    ON users (lower(btrim(pending_email)))
    WHERE pending_email IS NOT NULL;

INSERT INTO app_settings (setting_key, setting_value)
VALUES ('app.emailValidationTimeoutMinutes', '30')
ON CONFLICT (setting_key) DO NOTHING;
