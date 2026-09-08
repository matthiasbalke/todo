## MODIFIED Requirements

### Requirement: Viewer item cards are non-interactive
Standard item cards rendered for a viewer SHALL present item state without exposing controls that mutate the item.

#### Scenario: Viewer sees an incomplete item
- **WHEN** a viewer opens a standard list containing an incomplete item
- **THEN** the card presents the incomplete state without an actionable completion toggle
- **AND** it exposes no star toggle, delete action, swipe-delete interaction, or drag handle

#### Scenario: Viewer sees a completed or starred item
- **WHEN** a viewer sees an item that is completed or starred
- **THEN** the card presents those states using non-interactive indicators

#### Scenario: Viewer sees an unstarred item
- **WHEN** a viewer sees an item that is not starred
- **THEN** the card presents the unstarred state using a non-interactive star indicator
- **AND** the star indicator remains visible in the same position as the editable star control

#### Scenario: Viewer opens item details
- **WHEN** a viewer activates the item card's detail link
- **THEN** navigation to that item's detail page remains available

#### Scenario: Editor sees an item card
- **WHEN** an owner or editor opens a standard list
- **THEN** the existing completion, starring, deletion, and permitted reorder interactions remain available

### Requirement: Viewer item details are read-only
The item detail route SHALL render item information without mutation controls when the current user cannot edit items, using disabled versions of the normal item-detail form controls and the normal item-detail field order.

#### Scenario: Viewer opens item details
- **WHEN** a viewer opens an item's detail route
- **THEN** the title field and starred indicator are presented as read-only information in a single row, in that order
- **AND** category, due date, recurrence, assignments, and notes are presented after the title row as disabled regular item-detail controls in that order
- **AND** the read-only item detail content uses the same single-column field layout as the editable form after the title row
- **AND** audit metadata is presented below notes in the same placement as the editable form
- **AND** no completion or status indicator is displayed
- **AND** no save or delete action is available

#### Scenario: Editor opens item details
- **WHEN** an owner or editor opens an item's detail route
- **THEN** the existing editable form and delete action remain available
