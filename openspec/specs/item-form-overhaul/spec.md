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

### Requirement: Quick-add detail dialogs
The quick-add composer SHALL open a focused dialog for each optional item detail, SHALL keep the pending quick-add draft while the user edits details, and SHALL apply selection-oriented details without separate Save or Cancel actions.

#### Scenario: User edits an optional detail
- **WHEN** the quick-add composer is open
- **AND** the user activates a category, due date, or recurrence icon control
- **AND** the user selects a value in the dialog
- **THEN** the pending quick-add value is updated immediately without requiring a separate Save action
- **AND** the dialog closes
- **AND** the quick-add composer remains open
- **AND** the current item title remains in the quick-add draft

#### Scenario: User selects multiple assignees
- **WHEN** the quick-add composer is open
- **AND** the user activates the assignees icon control or assignees chip
- **AND** the user selects or removes one or more assignees in the dialog
- **THEN** each complete selected assignee set is reflected in the pending quick-add draft without requiring a separate Save action
- **AND** the assignee dialog remains available for additional selections until the user closes or dismisses it
- **AND** closing or dismissing the assignee dialog does not revert selected assignee changes

#### Scenario: User cancels a detail dialog
- **WHEN** a category, due date, recurrence, or assignees dialog is open with no in-dialog selection changes
- **AND** the user closes or dismisses the dialog
- **THEN** the quick-add composer remains open
- **AND** no quick-add detail values are changed
- **AND** the title and other quick-add detail values remain unchanged

#### Scenario: User dismisses a selection detail dialog by interacting outside it
- **WHEN** a category, due date, recurrence, or assignees dialog is open
- **AND** the user clicks or touches outside the dialog area
- **THEN** the dialog is dismissed
- **AND** no untouched single-selection value is applied
- **AND** any assignee selections already made in the multi-select dialog remain applied

#### Scenario: Dialog controls remain accessible
- **WHEN** a detail dialog opens
- **THEN** it exposes a dialog name matching the edited detail
- **AND** the dialog does not repeat a visible field label when the dialog title already identifies the edited detail
- **AND** it provides a keyboard-accessible title-bar close control
- **AND** notes dialogs provide a keyboard-accessible way to save
- **AND** selection-oriented dialogs do not display a separate Save action
- **AND** detail dialogs do not display a separate Cancel action
- **AND** focus remains within the dialog until the user closes, dismisses, or completes it
- **AND** focus returns to the activating icon control after the dialog closes

#### Scenario: User edits notes
- **WHEN** the quick-add composer is open
- **AND** the user activates the notes icon control or notes chip
- **THEN** a note editor dialog opens with a text area for adding or editing the note
- **AND** saving the note editor updates the pending quick-add note value without submitting the item
- **AND** closing, dismissing, or clicking or touching outside the note editor leaves the previously saved quick-add note value unchanged
- **AND** the note editor does not display a separate Cancel action

### Requirement: Quick-add submission includes dialog details
The quick-add composer SHALL submit the pending title and every applied optional detail as a new item when the user presses Enter in the title entry.

#### Scenario: User submits with title only
- **WHEN** the quick-add composer is open
- **AND** the user enters a title
- **AND** the user presses Enter in the title entry
- **THEN** a new item is created with that title
- **AND** omitted optional details are submitted using the existing empty-value item contracts

#### Scenario: User submits with optional details
- **WHEN** the user enters a title in the quick-add composer
- **AND** the user applies category, due date, recurrence, assignee, or notes values from detail dialogs
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
The item form SHALL display notes with a larger preview area and SHALL open a fullscreen note editor when the user focuses or activates notes editing.

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
- **AND** the editor chrome displays a top-left cancel/back action using Lucide `ChevronLeft` followed by the text `Cancel`
- **AND** the editor chrome displays the title `Notes` centered in the top bar
- **AND** the editor chrome displays a right-aligned `Save` action as a button or link that matches the global app action style
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
