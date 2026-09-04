ALTER TABLE todo_items
    ADD COLUMN updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
