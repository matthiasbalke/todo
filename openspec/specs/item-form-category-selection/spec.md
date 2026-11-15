# item-form-category-selection Specification

## Purpose
Define category selection and inline creation in item forms while preserving assignments, permissions, and draft state.
## Requirements
### Requirement: Shared category selector
`ItemForm` SHALL render the shared `CategorySelect` component for category entry instead of a browser-native category select.

#### Scenario: User views the item form
- **WHEN** the item form is rendered
- **THEN** it exposes a Select trigger labeled `Category`
- **AND** it does not render a native select for the category field

#### Scenario: User views the item form category entry
- **WHEN** the item form is rendered
- **THEN** category entry is provided by `CategorySelect`
- **AND** the category selector keeps the existing `Category` label
- **AND** submitting the form preserves the existing nullable `categoryId` contract

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

### Requirement: Category color indicators
The item form category Select SHALL reserve color indicator space before every selector value wherever that value is shown, and SHALL display a circular indicator only when that value is a category with a configured color.

#### Scenario: User opens category options with colored categories
- **WHEN** the user opens the category Select for a list that has categories with configured colors
- **THEN** each real category option displays a circular indicator using that category's color before the category name
- **AND** the `Uncategorized` option reserves the same leading swatch space without displaying a color indicator

#### Scenario: User opens category options with colorless categories
- **WHEN** the user opens the category Select for a list that has a real category with no configured color
- **THEN** that category option does not display a color indicator
- **AND** its category name is aligned with the names of category options that do display color indicators

#### Scenario: User opens category options with Uncategorized
- **WHEN** the user opens the category Select
- **THEN** the `Uncategorized` option does not display a color indicator
- **AND** its label is aligned with real category labels

#### Scenario: User views a selected colored category
- **WHEN** the category Select has a selected real category with a configured color
- **THEN** the Select trigger displays a circular indicator using that category's color before the category name

#### Scenario: User views a selected colorless category
- **WHEN** the category Select has a selected real category with no configured color
- **THEN** the Select trigger does not display a color indicator
- **AND** the selected category name is aligned as if a color indicator were present

#### Scenario: User views selected Uncategorized
- **WHEN** the category Select has `Uncategorized` selected
- **THEN** the Select trigger does not display a color indicator
- **AND** the selected label is aligned as if a color indicator were present

#### Scenario: Category values remain unchanged
- **WHEN** the user selects a category option that displays a color indicator
- **THEN** the submitted item uses that category's ID as `categoryId`
- **AND** label filtering and keyboard selection continue to use the category name


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
