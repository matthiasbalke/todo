## MODIFIED Requirements

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
