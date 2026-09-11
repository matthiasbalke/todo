## ADDED Requirements

### Requirement: Textarea can participate in fullscreen editing workflows
The shared Textarea capability SHALL support consumers that need a fullscreen editing surface while preserving multiline value binding, accessible labeling, and native text entry semantics.

#### Scenario: Consumer opens fullscreen text editing
- **WHEN** a consumer presents a fullscreen editor for a textarea-backed value
- **THEN** the editor exposes a multiline text entry with the same accessible name or a context-specific equivalent
- **AND** the editor initializes with the complete current value
- **AND** the editor can focus the multiline text entry when opened
- **AND** the editor can provide explicit cancel/back, title, and save chrome around the multiline text entry

#### Scenario: Consumer saves fullscreen text editing
- **WHEN** the user saves changes from the fullscreen editor
- **THEN** the bound textarea-backed value is updated with the complete multiline text
- **AND** downstream form submission receives the saved value

#### Scenario: Consumer cancels fullscreen text editing
- **WHEN** the user cancels or dismisses the fullscreen editor without saving
- **THEN** the original textarea-backed value remains unchanged
- **AND** focus returns to a logical notes control in the originating form

#### Scenario: Consumer prevents accidental fullscreen dismissal
- **WHEN** a consumer requires explicit save or cancel behavior
- **THEN** the fullscreen editing workflow supports keeping the editor open when the user clicks or taps outside the editing surface
