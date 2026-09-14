## MODIFIED Requirements

### Requirement: List overview creation actions use plus list action, group icon action, and safe mobile spacing
The `/lists` overview SHALL display a Lucide plus icon with a list creation label, a Lucide group creation icon action, and keep its fixed footer actions visually inset from physical display edges and safe-area insets.

#### Scenario: User views list creation actions
- **WHEN** a signed-in user opens the `/lists` overview
- **THEN** the list creation action displays a Lucide `Plus` icon followed by the text `new list`
- **AND** the list creation action is left-aligned and has no visible border
- **AND** the group creation action is rendered as a right-aligned Lucide `Group` icon action with an accessible name for creating a group
- **AND** the old labels `+ New list` and `+ New group` are not displayed for those actions

#### Scenario: New list action remains primary and usable
- **WHEN** a signed-in user activates the left-aligned `new list` action
- **THEN** a new list named `unnamed list` is created with the default emoji
- **AND** the new list is opened after creation succeeds
- **AND** the list title editor receives focus with the complete placeholder title selected
- **AND** the action remains fully visible and tappable across supported viewport widths

#### Scenario: New group action creates an editable placeholder group
- **WHEN** a signed-in user activates the group creation action
- **THEN** a new list group named `unnamed group` is created
- **AND** the group name editor receives focus with the complete placeholder name selected

#### Scenario: User views footer actions on a rounded mobile display
- **WHEN** fixed footer actions are displayed on a mobile viewport
- **THEN** the footer action container includes base horizontal spacing from the left and right display edges
- **AND** the footer action container includes base bottom spacing from the bottom display edge
- **AND** action borders do not sit flush against rounded display edges
- **AND** the actions remain fully visible and tappable

#### Scenario: User views footer actions on a safe-area device
- **WHEN** fixed footer actions are displayed on a mobile viewport with a bottom safe-area inset
- **THEN** the footer action container includes bottom spacing that combines the base visual spacing with the bottom safe-area inset
- **AND** the actions remain fully visible and tappable without overlapping system UI

#### Scenario: User scrolls content behind a fixed action footer
- **WHEN** a page uses a fixed action footer
- **THEN** the page content reserves enough bottom space for final content to scroll above the footer
- **AND** expanded footer form content remains bounded and scrollable without pushing action controls into display edges

## ADDED Requirements

### Requirement: List and group text edits autosave
The `/lists` overview SHALL persist editable list and list group text value changes automatically without showing save or cancel buttons for ordinary name/title editing.

#### Scenario: List title edit is committed automatically
- **WHEN** a signed-in user changes an editable list title and completes the edit using the implementation-defined commit event
- **THEN** the changed title is persisted for that list
- **AND** the list title editor does not require or display separate save or cancel controls

#### Scenario: Group name edit is committed automatically
- **WHEN** a signed-in user changes an editable list group name and completes the edit using the implementation-defined commit event
- **THEN** the changed name is persisted for that list group
- **AND** the group name editor does not require or display separate save or cancel controls

#### Scenario: Invalid text is not persisted
- **WHEN** a signed-in user enters an invalid list title or group name
- **THEN** the invalid value is not persisted
- **AND** the UI communicates the validation problem without requiring a cancel action to restore a valid saved value

#### Scenario: Unauthorized writes remain rejected
- **WHEN** a user without permission directly invokes a list or group write endpoint
- **THEN** the backend rejects the request according to its existing authorization rules
