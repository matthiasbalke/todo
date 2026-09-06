CREATE UNIQUE INDEX users_email_identity_unique_idx
    ON users (lower(btrim(email)));
