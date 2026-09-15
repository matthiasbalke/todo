## MODIFIED Requirements

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

## ADDED Requirements

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

### Requirement: Existing-item editing aligns the active field above the keyboard
The existing-item editor SHALL align the activated title, category, due-date, recurrence, or assignee component's outer row 96 CSS pixels below the visual viewport top, within 2 CSS pixels of rounding tolerance once layout and keyboard transitions settle and subject to the document's top boundary. It SHALL support mouse, touch, and keyboard activation and provide sufficient trailing document space to align lower fields. Fullscreen notes SHALL use their own viewport-aware editing surface.

#### Scenario: User activates an edit field
- **WHEN** the user clicks or taps a supported edit control, or moves keyboard focus into its field
- **THEN** the editor aligns that field after activation and rendering
- **AND** pointer-origin alignment does not move the target while the pointer is still down
- **AND** duplicate pointer and focus events from one activation do not cause competing scroll operations
- **AND** a canceled touch gesture does not trigger alignment

#### Scenario: Keyboard opens after field activation
- **WHEN** the visible viewport resizes or pans during keyboard opening for the active field
- **THEN** the editor adjusts alignment using the updated visible viewport geometry
- **AND** the active row settles at the specified offset
- **AND** queued work for an earlier field does not move the newly active field

#### Scenario: User activates a lower field on a short page
- **WHEN** the document initially lacks enough scroll range to align the activated field
- **THEN** the item detail page supplies sufficient noninteractive trailing space
- **AND** the field reaches the specified offset
- **AND** changing fields, blurring, or dismissing the keyboard does not remove the reservation and cause a document-clamping jump
- **AND** the reservation is removed when leaving the editor

#### Scenario: User deliberately scrolls or zooms
- **WHEN** the user manually scrolls the page or pinch-zooms after activating a field
- **THEN** automatic alignment is suspended for that activation
- **AND** pending corrections do not snap the document back
- **AND** a fresh field activation can request alignment again, including activation of the already focused control

#### Scenario: Visual viewport API is unavailable
- **WHEN** the browser does not expose the visual viewport API
- **THEN** the editor uses window geometry for field alignment without throwing an error
- **AND** ordinary editing remains usable

### Requirement: Nested item controls preserve document alignment
Item edit dropdowns and calendars SHALL keep their contents reachable within available visible viewport height. Revealing an option or moving calendar focus SHALL scroll the relevant internal panel when necessary without displacing the document's aligned field.

#### Scenario: User navigates a long dropdown
- **WHEN** the user filters or navigates category, recurrence, or assignee options beyond the listbox's visible portion
- **THEN** the relevant option is revealed within the listbox
- **AND** option navigation does not change the document scroll position
- **AND** the listbox is constrained to the visible space above the keyboard

#### Scenario: User navigates the calendar
- **WHEN** the user opens the calendar or moves focus between days or months
- **THEN** the focused day remains reachable within the calendar panel
- **AND** internal focus movement or returning focus to the trigger does not restart document alignment

### Requirement: Autosave completion preserves the current editing session
An asynchronous item save SHALL release focus only when its originating editing session still owns that focus. Scrolling SHALL NOT itself blur a field or commit a value.

#### Scenario: Earlier save completes after a field switch
- **WHEN** the user activates another field while a save is pending
- **AND** the earlier save completes
- **THEN** the newer field retains focus
- **AND** the earlier save does not dismiss the newer field's keyboard

#### Scenario: User returns to the originating control before a save completes
- **WHEN** the user leaves and re-enters the originating control during a pending save
- **AND** that save completes
- **THEN** the later editing session retains focus even though it uses the same DOM control

### Requirement: Fullscreen item notes fit the visible viewport
The fullscreen notes editor SHALL adapt to the visual viewport above the keyboard, keep its existing Save and Cancel controls visible, and allow long text to scroll internally with the editing caret reachable. Its document alignment and focus restoration SHALL preserve the underlying item editor's position and existing notes commit semantics.

#### Scenario: User edits long notes with the keyboard open
- **WHEN** the user opens fullscreen notes and types or navigates multiline text with the keyboard visible
- **THEN** the dialog fits the visible viewport
- **AND** Save and Cancel remain visible
- **AND** the textarea scrolls internally to keep the editing caret reachable
- **AND** background field alignment is suspended

#### Scenario: User closes fullscreen notes
- **WHEN** the user saves or cancels fullscreen notes
- **THEN** the existing save or discard behavior is preserved
- **AND** focus returns to the notes trigger without starting a new background alignment
- **AND** the prior document position is restored and temporary background scroll restrictions are removed
