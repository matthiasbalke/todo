## ADDED Requirements

### Requirement: CategorySelect usage
`ItemForm` SHALL render the shared `CategorySelect` component for category entry.

#### Scenario: User views the item form category entry
- **WHEN** the item form is rendered
- **THEN** category entry is provided by `CategorySelect`
- **AND** the category selector keeps the existing `Category` label
- **AND** submitting the form preserves the existing nullable `categoryId` contract

### Requirement: Category color indicators
The item form category Select SHALL reserve color indicator space before every selector value wherever that value is shown, and SHALL display a circular indicator only when that value is a category with a configured color.

#### Scenario: User opens category options with colored categories
- **WHEN** the user opens the category Select for a list that has categories with configured colors
- **THEN** each real category option displays a circular indicator using that category's color before the category name
- **AND** the `Uncategorized` option reserves the same leading swatch space without displaying a color indicator

#### Scenario: User opens category options with colorless categories
- **WHEN** the user opens the category Select for a list that has a real category with no configured color
- **THEN** that category option does not display a color indicator
- **AND** its category name is aligned with the names of category options that do display color indicators

#### Scenario: User opens category options with Uncategorized
- **WHEN** the user opens the category Select
- **THEN** the `Uncategorized` option does not display a color indicator
- **AND** its label is aligned with real category labels

#### Scenario: User views a selected colored category
- **WHEN** the category Select has a selected real category with a configured color
- **THEN** the Select trigger displays a circular indicator using that category's color before the category name

#### Scenario: User views a selected colorless category
- **WHEN** the category Select has a selected real category with no configured color
- **THEN** the Select trigger does not display a color indicator
- **AND** the selected category name is aligned as if a color indicator were present

#### Scenario: User views selected Uncategorized
- **WHEN** the category Select has `Uncategorized` selected
- **THEN** the Select trigger does not display a color indicator
- **AND** the selected label is aligned as if a color indicator were present

#### Scenario: Category values remain unchanged
- **WHEN** the user selects a category option that displays a color indicator
- **THEN** the submitted item uses that category's ID as `categoryId`
- **AND** label filtering and keyboard selection continue to use the category name
