## ADDED Requirements

### Requirement: Select options remain anchored to their trigger
The shared Select SHALL render its listbox directly below and at the width of its trigger without relying on a viewport coordinate system that changes under transformed ancestors.

#### Scenario: Select inside a transformed dialog
- **WHEN** a Select is opened inside a dialog or container with a CSS transform
- **THEN** its listbox is positioned directly below the corresponding trigger rather than at an unrelated screen location

#### Scenario: Select in a normal form
- **WHEN** a Select is opened in a page or form without a transformed ancestor
- **THEN** its listbox retains the same directly-below-trigger placement and trigger width

### Requirement: Positioning preserves Select interaction contracts
Changing the listbox positioning SHALL preserve Select accessibility, selection, keyboard, focus, validation, and dismissal behavior.

#### Scenario: Keyboard selection
- **WHEN** a user opens a Select and navigates or selects options with the keyboard
- **THEN** focus navigation, selection callbacks, Escape handling, and trigger focus restoration continue to work

#### Scenario: Pointer selection and outside dismissal
- **WHEN** a user activates an option or clicks outside the Select
- **THEN** option activation remains internal to the control and an outside click closes the listbox

#### Scenario: Multiple Select instances
- **WHEN** multiple Select controls are rendered in the same dialog
- **THEN** each trigger controls and positions only its own uniquely identified listbox

### Requirement: Members dialog role options appear at the correct controls
MembersDialog SHALL use the shared Select positioning contract for existing-member role changes and invitation role selection.

#### Scenario: Change an existing member role
- **WHEN** an owner opens the role Select for an existing member
- **THEN** the OWNER, EDITOR, and VIEWER options appear directly below that member's role trigger

#### Scenario: Choose an invitation role
- **WHEN** an owner opens the invitation role Select
- **THEN** the OWNER, EDITOR, and VIEWER options appear directly below the invitation role trigger
