CREATE TABLE lists (
    id                     UUID         PRIMARY KEY,
    name                   VARCHAR(255) NOT NULL,
    emoji                  VARCHAR(10),
    description            TEXT,
    default_sort_field     VARCHAR(20)  NOT NULL DEFAULT 'CREATED',
    default_sort_direction VARCHAR(4)   NOT NULL DEFAULT 'ASC',
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE list_memberships (
    list_id    UUID        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (list_id, user_id)
);

CREATE INDEX idx_list_memberships_user_id ON list_memberships(user_id);
CREATE INDEX idx_list_memberships_list_id ON list_memberships(list_id);
