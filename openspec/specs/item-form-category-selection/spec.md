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
`ItemForm` SHALL initialize the category Select from the existing item category or the configured new-item default, and SHALL treat a configured new-item default that does not match an available category as uncategorized.

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

#### Scenario: User creates an item with a stale default category
- **WHEN** a new-item form is rendered with `defaultCategoryId` that does not match an available category
- **THEN** the Select trigger displays `Uncategorized`
- **AND** submitting the form without choosing another category submits `categoryId` equal to `null`

### Requirement: Category submission and reset
`ItemForm` SHALL submit and reset category selection using its existing nullable category contract, and SHALL reset stale new-item defaults to uncategorized.

#### Scenario: User submits a category
- **WHEN** the user selects a category and submits the form
- **THEN** the submitted item has `categoryId` equal to the selected category's ID

#### Scenario: User submits Uncategorized
- **WHEN** the user selects `Uncategorized` and submits the form
- **THEN** the submitted item has `categoryId` equal to `null`

#### Scenario: New item form resets after submission
- **WHEN** a new categorized item is submitted successfully
- **THEN** the category Select resets to `defaultCategoryId` when one is configured and matches an available category
- **AND** otherwise resets to `Uncategorized`

### Requirement: Deleted category defaults are cleared
The regular list page SHALL clear the locally remembered new-item category default when it references a category that no longer exists in the list.

#### Scenario: Remembered category is deleted
- **WHEN** the locally remembered new-item category default matches a category that is removed from the current list
- **THEN** the remembered default is cleared for that list
- **AND** opening the new-item form defaults the category Select to `Uncategorized`

#### Scenario: Category deletion arrives through real-time update
- **WHEN** a category deletion update removes the remembered new-item default category from the current list
- **THEN** the remembered default is cleared for that list
- **AND** creating a new item without selecting another category submits `categoryId` equal to `null`

### Requirement: Deleted category item assignments are cleared locally
The frontend item store SHALL clear deleted category assignments from loaded items when a category is removed from the local category store.

#### Scenario: Loaded item used deleted category
- **WHEN** a loaded item has `categoryId` equal to a category that is removed from the current list
- **THEN** the loaded item is updated to have `categoryId` equal to `null`
- **AND** opening the item form displays `Uncategorized` for that item without requiring a page refresh

#### Scenario: Category deletion arrives through real-time update for existing items
- **WHEN** a category deletion update removes a category used by loaded items
- **THEN** matching loaded items are updated to have `categoryId` equal to `null`
- **AND** items assigned to other categories keep their existing category IDs

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
