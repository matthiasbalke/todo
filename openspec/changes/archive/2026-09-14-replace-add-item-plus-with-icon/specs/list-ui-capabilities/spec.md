## MODIFIED Requirements

### Requirement: Regular list add item action matches compact creation styling
The regular list view SHALL render its compact fixed-footer add-item action as a borderless, left-aligned icon-plus-label action whose plus icon and label use the same styling as the list overview's add-list plus icon and label.

#### Scenario: Editable user sees compact add item action
- **WHEN** an editable user opens a regular list and the add-item form is not expanded
- **THEN** the fixed footer displays an add-item action with a plus icon followed by the visible text `add item`
- **AND** the plus icon and text use the same styling as the list overview's add-list plus icon and text
- **AND** the old literal `+ add item` text is not displayed
- **AND** the action content is left-aligned
- **AND** the action has no visible border

#### Scenario: Add item action opens form
- **WHEN** an editable user activates the compact add-item action
- **THEN** the add-item form opens as before
