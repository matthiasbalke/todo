# burger-menu-selection-styling Specification

## Purpose
TBD - created by archiving change highlight-selected-burger-menu-options. Update Purpose after archive.
## Requirements
### Requirement: Selected burger-menu options use blue text and check marks
The frontend SHALL render selected filter, sort-field, and hide-checked options with the centrally defined blue selected-menu color for both their label text and check marks.

#### Scenario: Selected filter option is blue
- **WHEN** a filter submenu is open in a standard or grocery list burger menu
- **THEN** each option matching the current filter state has blue label text
- **AND** its check mark has the same blue color
- **AND** unselected filter options retain neutral text

#### Scenario: Selected sort field is blue
- **WHEN** the sorting submenu is open in a standard or grocery list burger menu
- **THEN** the option matching the current sort field has blue label text
- **AND** its check mark has the same blue color
- **AND** unselected sort-field options retain neutral text

#### Scenario: Enabled hide-checked is blue
- **WHEN** hide-checked is enabled in a standard or grocery list
- **THEN** the "Hide checked" menu label is blue
- **AND** its check mark has the same blue color

#### Scenario: Disabled hide-checked is neutral
- **WHEN** hide-checked is disabled in a standard or grocery list
- **THEN** the "Hide checked" menu label retains neutral text
- **AND** no check mark is displayed

### Requirement: Selected-menu color is reliable and themeable
The frontend MUST define the selected-menu blue as a central semantic theme color, and shared bare buttons SHALL allow consumers to apply that explicit color without it being overridden by inherited-color styling.

#### Scenario: Selected color is applied through a bare button
- **WHEN** a burger-menu consumer applies the semantic selected-menu color to a bare Button
- **THEN** the rendered button uses that color for its text and unstyled descendants

#### Scenario: Selected-menu theme color changes
- **WHEN** the central selected-menu color definition is replaced by a theme
- **THEN** selected labels and check marks in both list menu variants use the replacement color without route-specific palette changes

