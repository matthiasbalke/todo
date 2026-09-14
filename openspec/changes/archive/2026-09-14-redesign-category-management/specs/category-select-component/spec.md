## MODIFIED Requirements

### Requirement: CategorySelect color indicators
`CategorySelect` SHALL reserve color indicator space before every selector value wherever that value is shown, SHALL display a solid circular indicator for categories with a configured color, and SHALL display a dashed circular no-color indicator for `Uncategorized` and categories without a configured color.

#### Scenario: CategorySelect displays colored category options
- **WHEN** the user opens `CategorySelect` for categories with configured colors
- **THEN** each colored real category option displays a solid circular indicator using that category's color before the category name
- **AND** the solid circular indicator does not display a surrounding border

#### Scenario: CategorySelect aligns colorless category options
- **WHEN** the user opens `CategorySelect` for a real category with no configured color
- **THEN** that category option displays a dashed circular no-color indicator
- **AND** its category name is aligned with the names of category options that display configured color indicators

#### Scenario: CategorySelect aligns Uncategorized option
- **WHEN** the user opens `CategorySelect`
- **THEN** the `Uncategorized` option displays a dashed circular no-color indicator
- **AND** its label is aligned with real category labels

#### Scenario: CategorySelect displays selected category color state
- **WHEN** `CategorySelect` has a selected real category
- **THEN** the Select trigger displays a solid circular indicator before the category name when that category has a configured color
- **AND** the Select trigger displays a dashed circular no-color indicator when that category has no configured color

#### Scenario: CategorySelect aligns selected Uncategorized state
- **WHEN** `CategorySelect` has `Uncategorized` selected
- **THEN** the Select trigger displays a dashed circular no-color indicator
- **AND** the selected label is aligned as if a configured color indicator were present
