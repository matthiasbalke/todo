ALTER TABLE webauthn_credentials
    ADD COLUMN attestation_object BYTEA NOT NULL;
