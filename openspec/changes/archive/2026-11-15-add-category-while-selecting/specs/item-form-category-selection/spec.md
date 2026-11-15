## ADDED Requirements

### Requirement: Permission-aware creation during category assignment
Quick-add and existing-item category assignment SHALL offer inline category creation only to users with category management capability for the current list. Server authorization SHALL remain authoritative.

#### Scenario: Owner or editor assigns a category
- **WHEN** an owner or editor opens the category picker in quick-add or item editing
- **THEN** entering a new category name offers category creation in that list

#### Scenario: Category management is unavailable
- **WHEN** the user lacks category management capability
- **THEN** category creation is unavailable in category assignment
- **AND** read-only item details remain read-only

### Requirement: Persisted new category assignment
Creating a category during item assignment SHALL persist the trimmed name in the current list with no color and an order after existing real categories, add the returned category to the available choices, and use its persisted ID for item assignment.

#### Scenario: Quick-add selects a newly created category
- **WHEN** category creation succeeds from quick-add
- **THEN** the category is selected in the draft and available in the list without reload
- **AND** the item is created only when the user submits it
- **AND** subsequent item submission uses the returned category ID

#### Scenario: Existing item selects a newly created category
- **WHEN** category creation succeeds while editing an existing item
- **THEN** the item category changes through the existing autosave flow using the returned category ID
- **AND** a category creation failure does not change the item assignment

#### Scenario: Creation response and live update arrive separately
- **WHEN** the creation response and the category-created live update both arrive
- **THEN** the category appears once in the list by its persisted ID
- **AND** the picker can display its name without waiting for the live update

### Requirement: Inline creation preserves item editing state
Category creation interactions SHALL preserve unrelated draft fields, prevent accidental form submission or cancellation, and retain draft values and the attempted name after failure. A successfully created category SHALL remain in the list if the item draft is later discarded.

#### Scenario: Creation keeps the draft intact
- **WHEN** a user creates a category with Enter, mouse, or touch while drafting an item
- **THEN** the title, notes, due date, recurrence, assignees, and other item values are preserved
- **AND** creation does not trigger item submission or form cancellation

#### Scenario: Failed creation can be retried
- **WHEN** category creation fails
- **THEN** the prior category assignment and unrelated draft fields are retained
- **AND** the attempted name and an accessible error remain available for retry

#### Scenario: User discards an item after creating a category
- **WHEN** the user discards the item draft after successful category creation
- **THEN** the newly created category remains available to the list
