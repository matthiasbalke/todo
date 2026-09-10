## ADDED Requirements

### Requirement: List group header controls use consistent menu and collapse ordering
The `/lists` overview SHALL render list group header action menus before the collapse/expand chevron when both controls are present.

#### Scenario: Persisted group shows menu before collapse control
- **WHEN** a signed-in user views a persisted list group on `/lists`
- **THEN** the group options menu control appears to the left of the collapse/expand chevron
- **AND** activating the group options menu does not toggle the group's collapsed state

#### Scenario: Collapse control remains available after menu repositioning
- **WHEN** a signed-in user activates the collapse/expand control for a list group on `/lists`
- **THEN** the group expands or collapses as before
- **AND** its action menu behavior remains unchanged

#### Scenario: Ungrouped section keeps compatible header alignment
- **WHEN** the virtual Ungrouped section is visible on `/lists`
- **THEN** its header aligns with the same collapse/expand control position used by persisted list groups
- **AND** no group options menu is shown for the virtual Ungrouped section

### Requirement: List overview primary creation action is left aligned
The `/lists` overview SHALL left-align the `new list` action content in the fixed action footer when the footer shows the compact creation actions.

#### Scenario: Compact footer shows left-aligned new list action
- **WHEN** a signed-in user opens `/lists` and the fixed footer is showing compact creation actions
- **THEN** the `new list` action aligns its icon and label to the left within the primary action button
- **AND** the group creation icon action remains beside it

#### Scenario: New list action remains primary and usable
- **WHEN** a signed-in user activates the left-aligned `new list` action
- **THEN** the list creation form opens as before
- **AND** the action remains fully visible and tappable across supported viewport widths
