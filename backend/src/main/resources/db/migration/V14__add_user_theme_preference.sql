ALTER TABLE users
    ADD COLUMN theme_preference VARCHAR(16) NOT NULL DEFAULT 'SYSTEM';

ALTER TABLE users
    ADD CONSTRAINT chk_users_theme_preference
        CHECK (theme_preference IN ('SYSTEM', 'LIGHT', 'DARK'));
