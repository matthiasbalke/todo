-- credential_id stored as base64url TEXT for reliable equality comparison.
-- BYTEA comparison via Hibernate derived queries is unreliable across versions.
ALTER TABLE webauthn_credentials ALTER COLUMN credential_id TYPE TEXT;
