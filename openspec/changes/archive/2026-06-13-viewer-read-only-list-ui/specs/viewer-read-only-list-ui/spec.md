## ADDED Requirements

### Requirement: Viewer item cards are non-interactive
Standard item cards rendered for a viewer SHALL present item state without exposing controls that mutate the item.

#### Scenario: Viewer sees an incomplete item
- **WHEN** a viewer opens a standard list containing an incomplete item
- **THEN** the card presents the incomplete state without an actionable completion toggle
- **AND** it exposes no star toggle, delete action, swipe-delete interaction, or drag handle

#### Scenario: Viewer sees a completed or starred item
- **WHEN** a viewer sees an item that is completed or starred
- **THEN** the card presents those states using non-interactive indicators

#### Scenario: Viewer opens item details
- **WHEN** a viewer activates the item card's detail link
- **THEN** navigation to that item's detail page remains available

#### Scenario: Editor sees an item card
- **WHEN** an owner or editor opens a standard list
- **THEN** the existing completion, starring, deletion, and permitted reorder interactions remain available

### Requirement: Viewer grocery mode is non-interactive
Grocery mode SHALL present item completion state without allowing viewers to change it.

#### Scenario: Viewer opens grocery mode
- **WHEN** a viewer opens a list in grocery mode
- **THEN** checked and unchecked rows remain visible according to the current display preferences
- **AND** activating an item row does not toggle completion

#### Scenario: Editor opens grocery mode
- **WHEN** an owner or editor opens a list in grocery mode
- **THEN** activating an item row retains the existing completion behavior

### Requirement: Viewer item details are read-only
The item detail route SHALL render item information without mutation controls when the current user cannot edit items.

#### Scenario: Viewer opens item details
- **WHEN** a viewer opens an item's detail route
- **THEN** the title, notes, category, due date, recurrence, assignments, starred state, and completion state are presented as read-only information
- **AND** no save or delete action is available

#### Scenario: Editor opens item details
- **WHEN** an owner or editor opens an item's detail route
- **THEN** the existing editable form and delete action remain available

### Requirement: Item creation follows edit capability
List pages SHALL expose item creation only when the current user can edit items.

#### Scenario: Viewer opens a standard list
- **WHEN** a viewer opens the standard list page
- **THEN** the add-item action and new-item form are not available

#### Scenario: Editor opens a standard list
- **WHEN** an owner or editor opens the standard list page
- **THEN** the existing add-item action remains available

### Requirement: Category management follows category capability
Category mutation controls SHALL be available only when the current user can manage categories.

#### Scenario: Viewer opens list options
- **WHEN** a viewer opens list options in standard or grocery mode
- **THEN** the category configuration action is not available

#### Scenario: Editor manages categories
- **WHEN** an owner or editor opens category configuration
- **THEN** the existing add, rename, recolor, reorder, and delete interactions remain available

### Requirement: List management follows owner capability
List mutation controls SHALL be available only to owners.

#### Scenario: Viewer or editor opens a standard list
- **WHEN** a viewer or editor views the standard list title and options
- **THEN** the list title is not editable
- **AND** the delete-list action is not available

#### Scenario: Viewer or editor opens grocery mode
- **WHEN** a viewer or editor opens grocery mode options
- **THEN** the edit-list action is not available

#### Scenario: Owner opens list controls
- **WHEN** an owner opens the standard or grocery list controls
- **THEN** the existing list edit actions remain available
- **AND** the standard list retains its delete-list action

### Requirement: Membership viewing remains available
All list members SHALL be able to inspect list membership while only owners can change membership.

#### Scenario: Viewer or editor opens members
- **WHEN** a viewer or editor opens the Members dialog
- **THEN** the member names, emails, and roles are visible
- **AND** role selectors, remove actions, and invitation controls are not available

#### Scenario: Owner opens members
- **WHEN** an owner opens the Members dialog
- **THEN** the existing role-change, remove-member, and invitation interactions remain available

### Requirement: Read-only users retain non-mutating list controls
Viewer mode SHALL preserve controls that change only presentation, navigation, or the current user's personal list organization.

#### Scenario: Viewer adjusts list presentation
- **WHEN** a viewer uses filters, sorting, category collapse controls, or hide-checked preferences
- **THEN** those controls remain available and update the local presentation

#### Scenario: Viewer changes list mode
- **WHEN** a viewer navigates between standard and grocery modes
- **THEN** navigation remains available

#### Scenario: Viewer organizes accessible lists
- **WHEN** a viewer assigns an accessible list to one of their personal groups or reorders it within their group
- **THEN** the existing personal organization behavior remains available

