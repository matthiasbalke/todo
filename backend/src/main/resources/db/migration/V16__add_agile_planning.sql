ALTER TABLE users ADD COLUMN agile_view_enabled BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE agile_item_selections (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES todo_items(id) ON DELETE CASCADE,
    position BIGINT NOT NULL,
    PRIMARY KEY (user_id, item_id)
);
CREATE INDEX idx_agile_user_position ON agile_item_selections(user_id, position, item_id);
