## ADDED Requirements

### Requirement: Editable users can sort categories in the configure dialog
The configure categories dialog SHALL allow users with category management capability to reorder real categories by drag and drop.

#### Scenario: Category order is changed in configure dialog
- **WHEN** an editable user drags a category by its reorder handle to a different position in the configure categories dialog
- **THEN** the dialog category rows are reordered to match the dropped position
- **AND** the category order is persisted for subsequent loads of the list

#### Scenario: Configure dialog uses drag handles instead of arrows
- **WHEN** an editable user opens the configure categories dialog
- **THEN** each category row exposes a drag handle for reordering
- **AND** up and down arrow controls for reordering categories are not displayed

#### Scenario: Dialog category editing remains available
- **WHEN** an editable user reorders categories in the configure categories dialog
- **THEN** category rename, color selection, delete, and add actions remain available
- **AND** the reordered categories keep their names, colors, and item assignments

#### Scenario: Uncategorized is not sortable in the dialog
- **WHEN** an editable user opens the configure categories dialog
- **THEN** only real categories are displayed as sortable rows
- **AND** no uncategorized category row is created or persisted
