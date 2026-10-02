# Spec Delta

## MODIFIED Requirements

### Requirement: Notes support large preview and fullscreen editing
The item form SHALL display notes with a larger preview area and SHALL open a fullscreen note editor when the user focuses or activates notes editing. The editor header SHALL remain visible and usable within the application's scrolling layout.

#### Scenario: Notes are absent
- **WHEN** an item form has no notes
- **THEN** the notes row displays the notes placeholder in the larger preview area
- **AND** opening the fullscreen editor displays the same `add note` placeholder when the notes value is empty

#### Scenario: Notes are present
- **WHEN** the item form has notes longer than the preview length
- **THEN** the inactive notes row displays only the first 160 characters from the note value
- **AND** the notes preview ends with `...`
- **AND** the notes row displays a right-aligned `open` cue below the preview text
- **AND** the complete notes remain available when fullscreen editing opens
- **AND** the 160-character preview limit is defined as a single component-level constant so it can be changed in one place

#### Scenario: Notes are present but not truncated
- **WHEN** the item form has notes that fit within the preview length
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
