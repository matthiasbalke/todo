CREATE TABLE list_groups (
    id         UUID         PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_list_groups_user_id ON list_groups(user_id);

ALTER TABLE lists
    ADD COLUMN group_id            UUID REFERENCES list_groups(id) ON DELETE SET NULL,
    ADD COLUMN sort_order_in_group INT  NOT NULL DEFAULT 0;
