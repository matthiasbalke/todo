ALTER TABLE item_assignments
    DROP CONSTRAINT IF EXISTS item_assignments_item_id_fkey;

DROP INDEX IF EXISTS idx_todo_items_list_id;
DROP INDEX IF EXISTS idx_todo_items_list_id_done;
DROP INDEX IF EXISTS idx_todo_items_list_id_category;
DROP INDEX IF EXISTS idx_todo_items_list_id_due_date;

ALTER TABLE todo_items RENAME TO todo_items_reorder_source;

CREATE TABLE todo_items (
    id                 UUID         PRIMARY KEY,
    list_id            UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    category_id        UUID         REFERENCES categories(id) ON DELETE SET NULL,
    title              VARCHAR(500) NOT NULL,
    notes              TEXT,
    done               BOOLEAN      NOT NULL DEFAULT FALSE,
    starred            BOOLEAN      NOT NULL DEFAULT FALSE,
    due_date           DATE,
    recurrence_rule    JSONB,
    parent_item_id     UUID,
    sort_order         INT          NOT NULL DEFAULT 0,
    created_by_user_id UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID         REFERENCES users(id) ON DELETE SET NULL,
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO todo_items (
    id,
    list_id,
    category_id,
    title,
    notes,
    done,
    starred,
    due_date,
    recurrence_rule,
    parent_item_id,
    sort_order,
    created_by_user_id,
    created_at,
    updated_by_user_id,
    updated_at
)
SELECT
    id,
    list_id,
    category_id,
    title,
    notes,
    done,
    starred,
    due_date,
    recurrence_rule,
    parent_item_id,
    sort_order,
    created_by_user_id,
    created_at,
    updated_by_user_id,
    updated_at
FROM todo_items_reorder_source;

DROP TABLE todo_items_reorder_source;

CREATE INDEX idx_todo_items_list_id           ON todo_items(list_id);
CREATE INDEX idx_todo_items_list_id_done      ON todo_items(list_id, done);
CREATE INDEX idx_todo_items_list_id_category  ON todo_items(list_id, category_id);
CREATE INDEX idx_todo_items_list_id_due_date  ON todo_items(list_id, due_date);

ALTER TABLE item_assignments
    ADD CONSTRAINT item_assignments_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES todo_items(id) ON DELETE CASCADE;

ALTER TABLE todo_items
    ADD CONSTRAINT todo_items_parent_item_id_fkey
    FOREIGN KEY (parent_item_id) REFERENCES todo_items(id) ON DELETE SET NULL;
