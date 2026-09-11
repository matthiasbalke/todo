## Purpose

Define the user-facing add/edit item form layout and interactions so item details are easier to scan, edit, and use consistently across mobile and desktop list views.

## ADDED Requirements

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
- **AND** required title validation remains available before submission

#### Scenario: Existing workflows are preserved
- **WHEN** the user submits, cancels, changes focus inside the form, or receives a submit failure
- **THEN** the existing submitted item data, draft preservation, focus-out cancellation rules, and error recovery behavior are preserved

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
