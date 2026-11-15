## ADDED Requirements

### Requirement: Category creation option
The category picker SHALL offer `+ Create "<name>"` for a trimmed nonempty search when creation is enabled and no existing category name matches it case-insensitively. Creation SHALL be optional and unavailable in disabled pickers.

#### Scenario: User searches for a new category
- **WHEN** creation is enabled and the user types `  Garden  ` with no exact matching category
- **THEN** the options include `+ Create "Garden"`
- **AND** existing matching categories remain selectable

#### Scenario: Empty or existing name
- **WHEN** the search is whitespace-only or matches an existing category name after trimming and case-insensitive comparison
- **THEN** no creation option is offered
- **AND** existing categories with duplicate names remain distinct by ID

#### Scenario: Creation is unavailable
- **WHEN** creation is not enabled or the picker is disabled
- **THEN** the picker cannot initiate category creation

### Requirement: Accessible category creation activation
The creation option SHALL participate in the picker listbox and keyboard navigation and SHALL support Enter, mouse, and touch activation without submitting the enclosing item form. Existing matches SHALL precede the creation option.

#### Scenario: Enter creates a new unmatched category
- **WHEN** the user types a name with no matching category options and presses Enter
- **THEN** the picker activates creation with the trimmed name
- **AND** the enclosing item form is not submitted

#### Scenario: Partial matches remain selectable
- **WHEN** a search matches existing category names but is not an exact name match
- **THEN** the picker lists existing matches before the creation option
- **AND** keyboard navigation can focus and activate either an existing match or the creation option

#### Scenario: Pointer activates creation
- **WHEN** the user clicks or taps the creation option
- **THEN** the picker activates the same creation operation as keyboard selection

#### Scenario: Escape dismisses without creation
- **WHEN** the user presses Escape before activating the creation option
- **THEN** the picker closes without creating a category or changing the assignment

### Requirement: Category creation request lifecycle
The picker SHALL select and emit the persisted category ID only after creation succeeds, prevent repeated activation while pending, and preserve the prior selection on failure with an accessible error and a way to retry.

#### Scenario: Creation succeeds
- **WHEN** category creation succeeds
- **THEN** the picker displays the returned category name as selected and emits its persisted ID
- **AND** no temporary creation action value is emitted as a category ID

#### Scenario: Creation is pending
- **WHEN** creation is in progress and the user repeats Enter or pointer activation
- **THEN** only one creation request is sent
- **AND** the picker indicates pending work accessibly

#### Scenario: Creation fails
- **WHEN** creation fails, including an authorization rejection
- **THEN** the previous category assignment remains unchanged
- **AND** an accessible error is displayed and the attempted name remains available for retry

### Requirement: Category creation showcase
The category selector showcase and component guidance SHALL demonstrate optional creation and its selection result alongside selection-only examples.

#### Scenario: Developer reviews creation example
- **WHEN** a developer opens the category selector showcase
- **THEN** an interactive example permits creating and selecting a category without requiring a live list
- **AND** the guidance describes the optional creation callback, pending state, error behavior, and emitted persisted ID
