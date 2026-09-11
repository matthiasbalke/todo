## ADDED Requirements

### Requirement: List overview creation actions use plus list action, group icon action, and safe mobile spacing
The `/lists` overview SHALL display a Lucide plus icon with a list creation label, a Lucide group creation icon action, and keep its fixed footer actions visually inset from physical display edges and safe-area insets.

#### Scenario: User views list creation actions
- **WHEN** a signed-in user opens the `/lists` overview
- **THEN** the list creation action displays a Lucide `Plus` icon followed by the text `new list`
- **AND** the group creation action is rendered as a right-aligned Lucide `Group` icon action with an accessible name for creating a group
- **AND** the old labels `+ New list` and `+ New group` are not displayed for those actions

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

### Requirement: Navigation and menu icon buttons have consistent usable presentation
Back-navigation and menu icon buttons SHALL use Lucide SVG icons with a visually stronger icon treatment and maintain usable tap targets across supported viewports.

#### Scenario: Back control is displayed
- **WHEN** any app screen displays a back-navigation control
- **THEN** the control uses the Lucide `ChevronLeft` icon with sufficient stroke weight and size to match the selected icon system
- **AND** the control retains its accessible back-navigation name

#### Scenario: Menu control is displayed
- **WHEN** a view displays a menu control
- **THEN** the menu icon uses the Lucide `Menu` icon with sufficient stroke weight and size to be visually comparable with other primary toolbar icons
- **AND** the control retains its accessible menu name

#### Scenario: User taps icon controls
- **WHEN** a user interacts with back-navigation or menu icon buttons on a touch viewport
- **THEN** each control exposes a stable tap target suitable for touch input
- **AND** the existing navigation or menu behavior runs once

### Requirement: List group, category, and checked-items section headers use consistent disclosure icons
List group, category, and checked-items section headers SHALL use the same Lucide disclosure icons and right-aligned disclosure layout.

#### Scenario: User views a list group header
- **WHEN** the `/lists` overview displays a list group header
- **THEN** the Lucide `Group` icon appears before the group name
- **AND** the expand/collapse indicator appears at the right edge of the header row
- **AND** the header uses Lucide `ChevronDown` when expanded
- **AND** the header uses Lucide `ChevronUp` when collapsed

#### Scenario: User views a category header
- **WHEN** a list view displays a category header
- **THEN** the expand/collapse indicator appears at the right edge of the header row
- **AND** the header uses Lucide `ChevronDown` when expanded
- **AND** the header uses Lucide `ChevronUp` when collapsed

#### Scenario: User views a checked-items group control
- **WHEN** a category displays a checked-items group control below its unchecked items
- **THEN** the expand/collapse indicator appears at the right edge of the control row
- **AND** the control uses Lucide `ChevronDown` when expanded
- **AND** the control uses Lucide `ChevronUp` when collapsed

#### Scenario: User toggles section visibility
- **WHEN** a user activates a list group, category section, or checked-items group control
- **THEN** the existing expanded/collapsed behavior is preserved
- **AND** the updated icon state reflects the resulting section state
