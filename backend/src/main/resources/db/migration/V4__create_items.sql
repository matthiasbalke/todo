CREATE TABLE todo_items (
    id                UUID         PRIMARY KEY,
    list_id           UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    category_id       UUID         REFERENCES categories(id) ON DELETE SET NULL,
    title             VARCHAR(500) NOT NULL,
    notes             TEXT,
    done              BOOLEAN      NOT NULL DEFAULT FALSE,
    starred           BOOLEAN      NOT NULL DEFAULT FALSE,
    due_date          DATE,
    recurrence_rule   JSONB,
    parent_item_id    UUID         REFERENCES todo_items(id) ON DELETE SET NULL,
    created_by_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
    sort_order        INT          NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_todo_items_list_id           ON todo_items(list_id);
CREATE INDEX idx_todo_items_list_id_done      ON todo_items(list_id, done);
CREATE INDEX idx_todo_items_list_id_category  ON todo_items(list_id, category_id);
CREATE INDEX idx_todo_items_list_id_due_date  ON todo_items(list_id, due_date);

CREATE TABLE item_assignments (
    item_id UUID NOT NULL REFERENCES todo_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    PRIMARY KEY (item_id, user_id)
);

CREATE INDEX idx_item_assignments_item_id ON item_assignments(item_id);
