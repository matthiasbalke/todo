CREATE TABLE list_group_assignments (
    id         UUID         PRIMARY KEY,
    list_id    UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id   UUID REFERENCES list_groups(id) ON DELETE SET NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_list_user UNIQUE (list_id, user_id)
);

CREATE INDEX idx_list_group_assignments_list_id ON list_group_assignments(list_id);
CREATE INDEX idx_list_group_assignments_user_id ON list_group_assignments(user_id);
CREATE INDEX idx_list_group_assignments_group_id ON list_group_assignments(group_id);

-- Migrate existing data from lists table
INSERT INTO list_group_assignments (id, list_id, user_id, group_id, sort_order)
SELECT 
    gen_random_uuid(),
    l.id,
    lm.user_id,
    l.group_id,
    l.sort_order_in_group
FROM lists l
JOIN list_memberships lm ON l.id = lm.list_id
WHERE l.group_id IS NOT NULL;

-- Also create entries for lists without groups to track sort_order_in_group
INSERT INTO list_group_assignments (id, list_id, user_id, group_id, sort_order)
SELECT 
    gen_random_uuid(),
    l.id,
    lm.user_id,
    NULL,
    l.sort_order_in_group
FROM lists l
JOIN list_memberships lm ON l.id = lm.list_id
WHERE l.group_id IS NULL;

-- Remove columns from lists table
ALTER TABLE lists DROP COLUMN group_id;
ALTER TABLE lists DROP COLUMN sort_order_in_group;
