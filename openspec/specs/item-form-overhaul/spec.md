# item-form-overhaul Specification

## Purpose
Define the user-facing add/edit item form layout and interactions so item details are easier to scan, edit, and use consistently across mobile and desktop list views.

## Requirements

### Requirement: New-item quick-add composer
The regular list page SHALL create new items from a compact quick-add composer that prioritizes the title entry and exposes optional item details through icon controls.

#### Scenario: Editable user opens quick-add
- **WHEN** an editable user activates the list page add-item action
- **THEN** the fixed footer displays a quick-add composer instead of the full edit-item form
- **AND** the composer contains an accessible item title entry
- **AND** the composer displays accessible icon controls for category, due date, recurrence, assignees, and notes
- **AND** the detail controls appear in the order category, due date, recurrence, assignees, then notes
- **AND** the detail controls use the app's icon system rather than literal emoji examples
- **AND** the item title entry receives focus

#### Scenario: Quick-add fully replaces full add form
- **WHEN** an editable user creates an item from the regular list page
- **THEN** item creation is performed through the quick-add composer
- **AND** the full item form is not offered as an alternate create flow
- **AND** editing a created item remains available through the regular edit-item form

#### Scenario: Viewer cannot open quick-add
- **WHEN** a viewer opens a list page
- **THEN** the add-item action and quick-add composer are not available

### Requirement: Quick-add detail controls are stateful
The quick-add composer SHALL show each optional detail control as an icon-only control when empty and as an icon-and-value chip when a value has been saved.

#### Scenario: Empty detail controls show icons
- **WHEN** the quick-add composer opens with no saved category, due date, recurrence, assignee, or notes value
- **THEN** each optional detail control is displayed as an accessible icon-only control
- **AND** the controls remain ordered as category, due date, recurrence, assignees, then notes

#### Scenario: Saved detail controls show chips
- **WHEN** the user saves a category, due date, recurrence, assignee, or notes value in the quick-add composer
- **THEN** the corresponding detail control is displayed as a removable chip matching the list sort and filter chip styling
- **AND** quick-add detail chips and list sort/filter chips use a shared chip component that enforces consistent height and content spacing
- **AND** the chip contains the detail icon and a concise representation of the saved value
- **AND** activating the chip reopens the editor for that detail
- **AND** activating the chip's remove control clears that saved value without submitting the item
- **AND** clearing a chip does not minimize or close the quick-add composer because the action occurred inside the composer
- **AND** the detail control row remains a single horizontally scrollable row instead of wrapping to additional rows
- **AND** the horizontal scrollbar is visually hidden while preserving horizontal scrolling

#### Scenario: Cleared detail controls return to icons
- **WHEN** the user clears a saved category, due date, recurrence, assignee, or notes value
- **THEN** the corresponding detail control returns to its icon-only empty state

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

### Requirement: Item form title row exposes item state controls
The item form SHALL render the title row with the completion/status control before the title entry and the starred control after the title entry.

#### Scenario: User creates a new item
- **WHEN** an editable user opens a new-item form
- **THEN** the title row starts with an accessible completion/status control in the default incomplete state
- **AND** the title entry appears after the status control
- **AND** an accessible starred control appears to the right of the title entry in the default unstarred state

#### Scenario: User edits an existing item
- **WHEN** an editable user opens an existing item whose completion and starred states are already set
- **THEN** the title row displays those existing completion and starred states
- **AND** changing either state updates the submitted item state without requiring a separate item-card action

#### Scenario: User returns to a new-item draft
- **WHEN** an editable user changes the pending completion or starred state in a new-item form
- **AND** the form emits or restores its draft state
- **THEN** the draft includes the pending completion and starred values
- **AND** reopening the new-item form restores those pending values

### Requirement: Item form detail rows are icon-led and label their empty state
Every item form row after the title row SHALL begin with a meaningful icon and SHALL display placeholder text that identifies the row label when no value is selected.

#### Scenario: Empty optional values are displayed
- **WHEN** an editable user opens an item form with no category, due date, recurrence, assignee, or notes value
- **THEN** each corresponding row begins with an icon that represents the row purpose
- **AND** each row displays placeholder text that names the missing value, such as category, due date, recurrence, assignees, or notes

#### Scenario: Selected optional values are displayed
- **WHEN** the item form has selected category, due date, recurrence, assignee, or notes values
- **THEN** each corresponding row continues to display its leading icon
- **AND** the selected or entered value replaces the empty-state placeholder for that row

### Requirement: Assignee selection uses avatar multi-select
The item form SHALL use a shared multi-select component for assignee selection, and assignee options and selected assignees SHALL show each user's avatar before the user's display name.

#### Scenario: No assignees are selected
- **WHEN** an editable user opens an item form with available list members but no selected assignees
- **THEN** the assignee row displays its leading icon
- **AND** the multi-select displays an empty-state placeholder identifying assignees
- **AND** the multi-select exposes the assignee field by an accessible name

#### Scenario: User selects assignees
- **WHEN** an editable user opens the assignee multi-select
- **THEN** each assignee option displays an avatar before the user's display name
- **AND** selecting more than one assignee keeps all selected assignees represented in the field
- **AND** each selected assignee representation displays an avatar before the user's display name
- **AND** submitting the form includes the selected user IDs in `assignedUserIds`

#### Scenario: User restores assignees from a draft
- **WHEN** a new-item form restores a draft with selected assignee IDs
- **THEN** the assignee multi-select displays those users as selected
- **AND** the restored selected assignees continue to display avatars before names

### Requirement: Item form controls use borderless inline presentation
The item form SHALL present title, category, date, recurrence, assignee, and notes controls with a borderless inline treatment while preserving accessible names and validation affordances.

#### Scenario: Editable form is rendered
- **WHEN** an editable user opens the item form
- **THEN** the editable controls are visually presented as inline rows rather than boxed fields
- **AND** each control remains discoverable by its accessible name
- **AND** required title validation remains available before persistence

#### Scenario: Existing workflows are preserved
- **WHEN** the user changes focus inside the form, receives a persistence failure, or interacts with field-specific editors
- **THEN** the existing item data, draft preservation, focus-out minimization rules, and error recovery behavior are preserved

### Requirement: Item field edits autosave
The item form SHALL persist add-item and edit-item value changes automatically without showing save or cancel buttons for ordinary field editing, while preserving the existing fullscreen notes editor workflow.

#### Scenario: Existing item text edit is committed automatically
- **WHEN** an editable user changes an existing item's title and completes the edit using the implementation-defined commit event
- **THEN** the changed value is persisted for that item
- **AND** the editor does not require or display separate save or cancel controls

#### Scenario: Fullscreen notes editor workflow is preserved
- **WHEN** an editable user opens the fullscreen notes editor from an item form
- **THEN** the notes editor continues to provide its field-specific Save and Cancel controls
- **AND** canceling the notes editor leaves the item notes unchanged
- **AND** saving the notes editor applies the notes value to the item form

#### Scenario: Existing item selection edit is committed automatically
- **WHEN** an editable user changes an existing item's category, due date, recurrence, assignees, completion state, or starred state
- **THEN** the changed value is persisted for that item without requiring a separate save action

#### Scenario: New item is created from entered values
- **WHEN** an editable user enters the required new-item title and completes the add-item creation using an intentional creation event
- **THEN** a new item is created with the current form values
- **AND** the add-item form does not require or display separate save or cancel controls

#### Scenario: Title blur preserves quick-add draft
- **WHEN** an editable user enters a title in the quick-add item form
- **AND** the title input loses focus before an intentional creation event occurs
- **THEN** no new item is created
- **AND** the quick-add draft remains available when the user reopens the quick-add form

#### Scenario: New item optional edits are included
- **WHEN** an editable user changes optional values before the new item is created
- **THEN** the created item includes the current optional values for category, due date, recurrence, assignees, completion state, starred state, and notes

#### Scenario: Invalid item values are not persisted
- **WHEN** an editable user enters invalid item values
- **THEN** the invalid values are not persisted
- **AND** the UI communicates the validation problem without requiring a cancel action to restore the last valid saved value

#### Scenario: Autosave failure keeps user input recoverable
- **WHEN** an automatic item save or creation attempt fails
- **THEN** the user's current input remains available for correction or retry
- **AND** the UI communicates that the value was not persisted

### Requirement: Notes support large preview and fullscreen editing
The item form SHALL display notes with a larger preview area and SHALL open a fullscreen note editor when the user focuses or activates notes editing. The editor header SHALL remain visible and usable within the application's scrolling layout.

#### Scenario: Notes are absent
- **WHEN** an item form has no notes
- **THEN** the notes row displays the notes placeholder in the larger preview area
- **AND** opening the fullscreen editor displays the same `add note` placeholder when the notes value is empty

#### Scenario: Notes are present
- **WHEN** an item form has notes longer than the preview length
- **THEN** the inactive notes row displays only the first 160 characters from the note value
- **AND** the notes preview ends with `...`
- **AND** the notes row displays a right-aligned `open` cue below the preview text
- **AND** the complete notes remain available when fullscreen editing opens
- **AND** the 160-character preview limit is defined as a single component-level constant so it can be changed in one place

#### Scenario: Notes are present but not truncated
- **WHEN** an item form has notes that fit within the preview length
- **THEN** the inactive notes row displays the notes content without appending `...`
- **AND** the notes row displays a right-aligned `open` cue below the preview text

#### Scenario: User edits notes fullscreen
- **WHEN** the user focuses or activates the notes row
- **THEN** a fullscreen editor opens with the current complete notes value
- **AND** the editor chrome displays a visible top-left cancel/back action using Lucide `ChevronLeft` followed by the text `Cancel`
- **AND** the editor chrome displays the title `Notes` centered in the top bar
- **AND** the editor chrome displays a visible right-aligned `Save` action as a button or link that matches the global app action style
- **AND** the fullscreen editor displays the complete notes rather than the truncated preview
- **AND** the editor focuses the multiline notes entry
- **AND** saving the fullscreen editor updates the form notes value
- **AND** canceling, using the editor back control, or pressing Escape returns to the form without changing the notes value
- **AND** focus returns to the notes row trigger

#### Scenario: User interacts outside the fullscreen editor
- **WHEN** the fullscreen note editor is open
- **AND** the user clicks or taps outside the editor surface
- **THEN** the editor remains open
- **AND** the modal draft is not discarded

#### Scenario: User opens notes editor on desktop
- **WHEN** the fullscreen note editor opens in a desktop browser
- **THEN** the editor surface is constrained to no wider than the app's regular list content column
- **AND** the surrounding modal layout does not make the note editing surface wider than list screens

#### Scenario: Fullscreen note editor preserves form lifecycle
- **WHEN** the fullscreen note editor opens, receives focus, saves, or closes
- **THEN** the item form remains open
- **AND** new-item focus-out cancellation is not triggered by interactions inside the fullscreen editor

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
