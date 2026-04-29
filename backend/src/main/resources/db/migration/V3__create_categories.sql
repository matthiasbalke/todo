CREATE TABLE categories (
    id         UUID         PRIMARY KEY,
    list_id    UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    color      VARCHAR(7),
    sort_order INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_list_id ON categories(list_id);
