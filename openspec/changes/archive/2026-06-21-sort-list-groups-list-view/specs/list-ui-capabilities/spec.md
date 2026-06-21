## ADDED Requirements

### Requirement: Users can sort list groups on the lists overview
The `/lists` overview SHALL allow a signed-in user to reorder their persisted list group wrappers by drag and drop.

#### Scenario: List group order is changed on lists overview
- **WHEN** a signed-in user drags a persisted list group wrapper to a different position on `/lists`
- **THEN** the displayed persisted list groups are reordered to match the dropped position
- **AND** the list group order is persisted for subsequent loads of `/lists`

#### Scenario: Lists remain inside their groups
- **WHEN** a signed-in user reorders list group wrappers on `/lists`
- **THEN** each list remains assigned to its original persisted group or the virtual Ungrouped section
- **AND** each group's list order remains unchanged

#### Scenario: Ungrouped section remains at bottom
- **WHEN** the virtual Ungrouped section is visible and a signed-in user reorders persisted list groups on `/lists`
- **THEN** only persisted list group wrappers are repositioned
- **AND** the virtual Ungrouped section remains displayed after all persisted list groups

#### Scenario: Existing list dragging remains available
- **WHEN** a signed-in user reorders or moves lists within or between list group sections
- **THEN** list-card drag handles and list drop behavior continue to work independently from list group wrapper dragging

#### Scenario: List category order is unchanged
- **WHEN** a signed-in user reorders list group wrappers on `/lists`
- **THEN** no category order within any individual list is changed
- **AND** no category reorder endpoint is invoked
