# item-form-category-selection Specification

## Purpose
TBD - created by archiving change item-form-category-select. Update Purpose after archive.
## Requirements
### Requirement: Shared category selector
`ItemForm` SHALL render the shared Select component for category entry instead of a browser-native category select.

#### Scenario: User views the item form
- **WHEN** the item form is rendered
- **THEN** it exposes a Select trigger labeled `Category`
- **AND** it does not render a native select for the category field

### Requirement: Category values and labels
The category Select SHALL retain category IDs as option values while displaying user-facing category names.

#### Scenario: User opens the category options
- **WHEN** the user opens the category Select
- **THEN** the first option is labeled `Uncategorized`
- **AND** each available category is displayed by name
- **AND** selecting a category returns that category's ID rather than its name

#### Scenario: Categories have duplicate names
- **WHEN** two available categories have the same name but different IDs
- **THEN** each category remains a distinct selectable option
- **AND** selecting either option retains its corresponding ID

### Requirement: Initial category selection
`ItemForm` SHALL initialize the category Select from the existing item category or the configured new-item default.

#### Scenario: User edits a categorized item
- **WHEN** the form is rendered for an item with a category ID matching an available category
- **THEN** the Select trigger displays that category's name
- **AND** the matching option is marked selected

#### Scenario: User edits an uncategorized item
- **WHEN** the form is rendered for an item whose category ID is `null`
- **THEN** the Select trigger displays `Uncategorized`

#### Scenario: User creates an item with a default category
- **WHEN** a new-item form is rendered with `defaultCategoryId` matching an available category
- **THEN** the Select trigger displays that category's name

### Requirement: Category submission and reset
`ItemForm` SHALL submit and reset category selection using its existing nullable category contract.

#### Scenario: User submits a category
- **WHEN** the user selects a category and submits the form
- **THEN** the submitted item has `categoryId` equal to the selected category's ID

#### Scenario: User submits Uncategorized
- **WHEN** the user selects `Uncategorized` and submits the form
- **THEN** the submitted item has `categoryId` equal to `null`

#### Scenario: New item form resets after submission
- **WHEN** a new categorized item is submitted successfully
- **THEN** the category Select resets to `defaultCategoryId` when one is configured
- **AND** otherwise resets to `Uncategorized`

### Requirement: Category interactions preserve the new-item form
`ItemForm` SHALL treat pointer and keyboard interactions within the category Select as internal form interactions.

#### Scenario: User selects a category with a pointer
- **WHEN** the user opens the category Select and clicks an option
- **THEN** the new-item form remains open
- **AND** `oncancel` is not called

#### Scenario: User selects a category with the keyboard
- **WHEN** the user opens the category Select, navigates its options, and selects one with the keyboard
- **THEN** the selected category is updated
- **AND** the new-item form remains open
- **AND** `oncancel` is not called

#### Scenario: User dismisses the category options
- **WHEN** the user presses Escape while the category Select is open
- **THEN** the options close without changing the selected category
- **AND** the new-item form remains open
- **AND** `oncancel` is not called

### Requirement: Select option display labels
The shared Select SHALL support displaying labels that differ from its underlying option values.

#### Scenario: Consumer provides an option-label resolver
- **WHEN** a Select consumer provides a label resolver for its options
- **THEN** the trigger and listbox display the resolved labels
- **AND** selection callbacks receive the original option values

#### Scenario: Consumer omits an option-label resolver
- **WHEN** a Select consumer uses primitive options without a label resolver
- **THEN** the trigger and listbox retain their existing option rendering behavior

