ALTER TABLE users
    ADD COLUMN time_zone VARCHAR(255) NOT NULL DEFAULT 'UTC',
    ADD COLUMN time_zone_initialized BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN today_view_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_item_assignments_user_id_item_id
    ON item_assignments(user_id, item_id);
