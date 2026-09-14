## ADDED Requirements

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
- **AND** the chip contains the detail icon and a concise representation of the saved value
- **AND** activating the chip reopens the editor for that detail
- **AND** activating the chip's remove control clears that saved value without submitting the item
- **AND** clearing a chip does not minimize or close the quick-add composer because the action occurred inside the composer
- **AND** the detail control row remains a single horizontally scrollable row instead of wrapping to additional rows

#### Scenario: Cleared detail controls return to icons
- **WHEN** the user clears a saved category, due date, recurrence, assignee, or notes value
- **THEN** the corresponding detail control returns to its icon-only empty state

### Requirement: Quick-add detail dialogs
The quick-add composer SHALL open a focused dialog for each optional item detail and SHALL keep the pending quick-add draft while the user edits details.

#### Scenario: User edits an optional detail
- **WHEN** the quick-add composer is open
- **AND** the user activates a category, due date, recurrence, assignee, or notes icon control
- **THEN** a dialog opens for editing only that detail
- **AND** the current item title remains in the quick-add draft
- **AND** saving the dialog updates the pending quick-add value without submitting the item

#### Scenario: User cancels a detail dialog
- **WHEN** a detail dialog is open with unsaved changes
- **AND** the user cancels or dismisses the dialog
- **THEN** the quick-add composer remains open
- **AND** the canceled dialog changes are not applied to the pending quick-add draft
- **AND** the title and other previously saved quick-add detail values remain unchanged

#### Scenario: Dialog controls remain accessible
- **WHEN** a detail dialog opens
- **THEN** it exposes a dialog name matching the edited detail
- **AND** it provides a keyboard-accessible way to save or cancel
- **AND** focus remains within the dialog until the user saves or cancels
- **AND** focus returns to the activating icon control after the dialog closes

#### Scenario: User edits notes
- **WHEN** the quick-add composer is open
- **AND** the user activates the notes icon control or notes chip
- **THEN** a note editor dialog opens with a text area for adding or editing the note
- **AND** saving the note editor updates the pending quick-add note value without submitting the item
- **AND** canceling the note editor leaves the previously saved quick-add note value unchanged

### Requirement: Quick-add submission includes dialog details
The quick-add composer SHALL submit the pending title and every saved optional detail as a new item when the user presses Enter in the title entry.

#### Scenario: User submits with title only
- **WHEN** the quick-add composer is open
- **AND** the user enters a title
- **AND** the user presses Enter in the title entry
- **THEN** a new item is created with that title
- **AND** omitted optional details are submitted using the existing empty-value item contracts

#### Scenario: User submits with optional details
- **WHEN** the user enters a title in the quick-add composer
- **AND** the user saves category, due date, recurrence, assignee, or notes values from detail dialogs
- **AND** the user presses Enter in the title entry
- **THEN** a new item is created with the title and all saved quick-add detail values

#### Scenario: Successful submit resets quick-add
- **WHEN** the quick-add composer submits successfully
- **THEN** the pending quick-add draft is cleared
- **AND** the composer returns to the default new-item state for the next item

#### Scenario: Failed submit preserves quick-add
- **WHEN** the quick-add composer submits and the add operation fails
- **THEN** the composer remains available with the user's title and saved optional detail values intact
