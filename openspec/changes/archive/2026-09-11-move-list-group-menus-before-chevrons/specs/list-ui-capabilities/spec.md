## MODIFIED Requirements

### Requirement: List group header controls use consistent menu and collapse ordering
The `/lists` overview SHALL render list group header action menus before the collapse/expand chevron when both controls are present, and persisted group action menus SHALL use the `ellipsis` icon.

#### Scenario: Persisted group shows menu before collapse control
- **WHEN** a signed-in user views a persisted list group on `/lists`
- **THEN** the group options menu control appears to the left of the collapse/expand chevron
- **AND** activating the group options menu does not toggle the group's collapsed state
- **AND** the group options menu control uses the `ellipsis` icon

#### Scenario: Collapse control remains available after menu repositioning
- **WHEN** a signed-in user activates the collapse/expand control for a list group on `/lists`
- **THEN** the group expands or collapses as before
- **AND** its action menu behavior remains unchanged

#### Scenario: Ungrouped section keeps compatible header alignment
- **WHEN** the virtual Ungrouped section is visible on `/lists`
- **THEN** its header aligns with the same collapse/expand control position used by persisted list groups
- **AND** no group options menu is shown for the virtual Ungrouped section

## ADDED Requirements

### Requirement: List overview primary creation action is left aligned
The `/lists` overview SHALL left-align the `new list` action content and render it without a visible border in the fixed action footer when the footer shows the compact creation actions.

#### Scenario: Compact footer shows left-aligned new list action
- **WHEN** a signed-in user opens `/lists` and the fixed footer is showing compact creation actions
- **THEN** the `new list` action aligns its icon and label to the left within the primary action button
- **AND** the `new list` action has no visible border
- **AND** the group creation icon action remains beside it

#### Scenario: New list action remains primary and usable
- **WHEN** a signed-in user activates the left-aligned `new list` action
- **THEN** the list creation form opens as before
- **AND** the action remains fully visible and tappable across supported viewport widths

### Requirement: List option overlays use consistent trigger spacing
List option menu overlays and the sort summary pill menu SHALL use the same `top-full` plus small margin trigger-to-menu spacing pattern.

#### Scenario: Standard list options menu spacing
- **WHEN** a signed-in user opens a standard list's `List options` menu
- **THEN** the menu overlay is positioned below the list options icon using the same `top-full` plus small margin pattern as the sort summary pill menu
- **AND** the existing list menu actions remain available

#### Scenario: Grocery list options menu spacing
- **WHEN** a signed-in user opens a grocery list's `List options` menu
- **THEN** the menu overlay is positioned below the list options icon using the same `top-full` plus small margin pattern as the sort summary pill menu
- **AND** the existing grocery list menu actions remain available

### Requirement: Regular list add item action matches compact creation styling
The regular list view SHALL render its compact fixed-footer add-item action as a borderless, left-aligned `+ add item` action.

#### Scenario: Editable user sees compact add item action
- **WHEN** an editable user opens a regular list and the add-item form is not expanded
- **THEN** the fixed footer displays a `+ add item` action with lowercase `add`
- **AND** the action content is left-aligned
- **AND** the action has no visible border

#### Scenario: Add item action opens form
- **WHEN** an editable user activates the compact `+ add item` action
- **THEN** the add-item form opens as before
