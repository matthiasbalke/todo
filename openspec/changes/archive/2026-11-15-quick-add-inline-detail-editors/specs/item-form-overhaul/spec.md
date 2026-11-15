# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Quick-add detail dialogs`
- TO: `### Requirement: Quick-add inline detail views`
- FROM: `### Requirement: Quick-add submission includes dialog details`
- TO: `### Requirement: Quick-add submission includes detail values`

## MODIFIED Requirements

### Requirement: Quick-add inline detail views
The quick-add composer SHALL replace its compact content with a named optional-detail editor in the same fixed bottom area, without a detail modal or backdrop except for the custom due-date calendar. It SHALL preserve the pending item draft through transitions and provide a keyboard-accessible Back action (Cancel/back for notes). Selection details SHALL apply without separate Save or Cancel actions; notes SHALL require Save.

#### Scenario: User edits an optional detail
- **WHEN** the user activates a category, due date, recurrence, assignees, or notes icon or chip
- **THEN** the corresponding editor replaces the compact composer in the fixed footer
- **AND** the title and all pending detail values remain intact
- **AND** the view exposes an accessible name matching the detail and a Back action (Cancel/back for notes)
- **AND** focus moves into the editor without a modal focus trap

#### Scenario: User chooses a category
- **WHEN** the category editor opens
- **THEN** its selector input is already focused and supports filtering and keyboard selection
- **AND** selecting a category or Uncategorized immediately updates the draft and returns to the compact composer with title focus
- **AND** category names, colors, and nullable category IDs retain their existing behavior

#### Scenario: User chooses a due-date preset
- **WHEN** the due-date editor opens
- **THEN** a focused Select offers Today, Tomorrow, Next week, and Custom with keyboard navigation
- **AND** selecting a preset applies today, tomorrow, or the next Monday strictly after today respectively (seven days ahead when today is Monday) using the user's configured timezone
- **AND** a complete selection returns to the compact composer with title focus

#### Scenario: User chooses a custom date
- **WHEN** the user selects Custom in the due-date editor
- **THEN** the bottom date editor closes and the date picker opens in a dialog centered on the screen, initialized from the pending due date
- **AND** selecting or clearing a date updates the nullable date-only draft value and returns to the composer
- **AND** dismissing the calendar without selecting leaves the prior value intact and returns to the compact composer with title focus

#### Scenario: User selects a recurrence preset
- **WHEN** the recurrence editor opens
- **THEN** Daily, Weekly, Monthly, and Custom are available alongside No recurrence, Yearly, and Weekdays
- **AND** a complete basic preset selection applies immediately and returns to the compact composer with title focus

#### Scenario: User configures multi-field recurrence
- **WHEN** the user selects Custom or Weekdays in the inline recurrence view
- **THEN** the view remains available for amount, unit, and weekday changes
- **AND** weekday edits stay local until Back, Escape, or outside dismissal applies the complete valid configuration once
- **AND** incomplete input remains preserved without replacing the last valid applied rule
- **AND** intentional creation remains blocked until invalid recurrence input is corrected or cleared
- **AND** returning to the composer focuses the item title input

#### Scenario: User selects multiple assignees
- **WHEN** the user opens the assignee editor
- **THEN** its selector input is already focused
- **AND** selecting or removing assignees updates the draft immediately without leaving the editor
- **AND** additional selections remain available with existing avatar and display-name presentation
- **AND** Back or Escape returns to the composer with focus on the item title input and retains the selected set

#### Scenario: User cancels a detail dialog
- **WHEN** the user activates Back or presses Escape in an unchanged detail editor with no nested popup open
- **THEN** the compact composer returns with all draft values unchanged
- **AND** focus returns to the item title input

#### Scenario: Nested popup handles Escape first
- **WHEN** the user presses Escape in an open selector popup or calendar within a detail view
- **THEN** only that popup closes and focus returns to its control
- **AND** the detail view remains available without minimizing the composer

#### Scenario: User edits notes
- **WHEN** the user opens the inline notes editor
- **THEN** a focused multiline textarea contains the previously saved note
- **AND** Save applies the edited note and returns to the composer without creating an item
- **AND** a Cancel/back action and centered Notes title appear alongside Save, matching the item-details note editor
- **AND** Cancel/back or Escape discards unsaved note changes and retains the previously saved note
- **AND** clicking or tapping outside leaves the notes editor open and preserves its unsaved text
- **AND** closing through Save or Cancel/back restores focus to the item title input
- **AND** Enter in the textarea inserts a newline without creating an item

#### Scenario: Dialog controls remain accessible
- **WHEN** the user interacts with detail inputs, selection popups, or the custom date calendar
- **THEN** those interactions are treated as internal and do not minimize quick-add
- **AND** the editor remains usable on narrow screens and with the software keyboard visible

#### Scenario: User dismisses a selection detail dialog by interacting outside it
- **WHEN** a category, due-date, recurrence, or assignee inline view is open and the user clicks or touches outside quick-add and its popups
- **THEN** the detail view closes; a draft with entered values stays visible in the compact composer, while an empty draft minimizes
- **AND** untouched category and date values remain unchanged
- **AND** assignee selections already applied remain in the draft
- **AND** staged recurrence changes apply only as one complete valid configuration

#### Scenario: User minimizes while editing a detail
- **WHEN** a selection detail view is active and the user moves focus or interacts outside the quick-add area and its popups
- **THEN** quick-add returns to its compact composer when a draft has entered values and minimizes only when the draft is empty
- **AND** the title, applied values, and all recurrence configuration input remain available without reopening quick-add
- **AND** outside interaction does not move focus back from the outside target
- **AND** notes editing instead remains open on outside interaction until Save or Cancel/back is used

### Requirement: Quick-add submission includes detail values
The quick-add composer SHALL submit the pending title and every applied optional detail as a new item when the user presses Enter in the title entry.

#### Scenario: User submits with title only
- **WHEN** the quick-add composer is open
- **AND** the user enters a title
- **AND** the user presses Enter in the title entry
- **THEN** a new item is created with that title
- **AND** omitted optional details are submitted using the existing empty-value item contracts

#### Scenario: User submits with optional details
- **WHEN** the user enters a title in the quick-add composer
- **AND** the user applies category, due date, recurrence, assignee, or notes values from the inline detail views
- **AND** the user presses Enter in the title entry
- **THEN** a new item is created with the title and all applied quick-add detail values

#### Scenario: Successful submit resets quick-add
- **WHEN** the quick-add composer submits successfully
- **THEN** the pending quick-add draft is cleared
- **AND** the composer returns to the default new-item state for the next item

#### Scenario: Failed submit preserves quick-add
- **WHEN** the quick-add composer submits and the add operation fails
- **THEN** the composer remains available with the user's title and applied optional detail values intact


## ADDED Requirements

### Requirement: Active quick-add drafts remain visible
Quick-add SHALL remain visible after outside pointer or focus interaction when its draft contains a nonblank title or entered optional detail, including incomplete recurrence input. Outside interaction SHALL NOT create an item or steal focus from the outside target. An untouched draft with only default values SHALL still minimize.

#### Scenario: User leaves a typed draft
- **WHEN** the user enters an item title and clicks or focuses outside quick-add
- **THEN** the compact composer remains visible with the entered title
- **AND** the add-item launcher does not replace it
- **AND** no item is created

#### Scenario: User leaves an empty draft
- **WHEN** the user opens quick-add without entering any values and interacts outside it
- **THEN** the composer minimizes to the add-item launcher
