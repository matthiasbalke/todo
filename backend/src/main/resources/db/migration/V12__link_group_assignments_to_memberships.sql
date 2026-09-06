DELETE FROM list_group_assignments lga
WHERE NOT EXISTS (
    SELECT 1
    FROM list_memberships lm
    WHERE lm.list_id = lga.list_id
      AND lm.user_id = lga.user_id
);

ALTER TABLE list_group_assignments
    ADD CONSTRAINT fk_list_group_assignments_membership
        FOREIGN KEY (list_id, user_id)
        REFERENCES list_memberships (list_id, user_id)
        ON DELETE CASCADE;
