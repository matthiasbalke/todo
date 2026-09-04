## ADDED Requirements

### Requirement: CategorySelect component
The frontend SHALL provide a reusable `CategorySelect` component that composes the shared `Select` component for category selection.

#### Scenario: CategorySelect renders category choices
- **WHEN** `CategorySelect` is rendered with available categories
- **THEN** it exposes a Select trigger with the configured label
- **AND** the first option is labeled `Uncategorized`
- **AND** each real category is displayed by name

#### Scenario: CategorySelect preserves category values
- **WHEN** the user selects a real category
- **THEN** `CategorySelect` emits that category's ID
- **AND** selecting `Uncategorized` emits the uncategorized value
- **AND** duplicate category names remain distinct selectable options by ID

### Requirement: CategorySelect color indicators
`CategorySelect` SHALL reserve color indicator space before every selector value wherever that value is shown, and SHALL display a circular indicator only when that value is a category with a configured color.

#### Scenario: CategorySelect displays colored category options
- **WHEN** the user opens `CategorySelect` for categories with configured colors
- **THEN** each colored real category option displays a circular indicator using that category's color before the category name
- **AND** `Uncategorized` reserves the same leading swatch space without displaying a color indicator

#### Scenario: CategorySelect aligns colorless category options
- **WHEN** the user opens `CategorySelect` for a real category with no configured color
- **THEN** that category option does not display a color indicator
- **AND** its category name is aligned with the names of category options that do display color indicators

#### Scenario: CategorySelect aligns Uncategorized option
- **WHEN** the user opens `CategorySelect`
- **THEN** the `Uncategorized` option does not display a color indicator
- **AND** its label is aligned with real category labels

#### Scenario: CategorySelect displays selected category color state
- **WHEN** `CategorySelect` has a selected real category
- **THEN** the Select trigger displays a circular indicator before the category name when that category has a configured color
- **AND** the Select trigger reserves the same leading swatch space without displaying a color indicator when that category has no configured color

#### Scenario: CategorySelect aligns selected Uncategorized state
- **WHEN** `CategorySelect` has `Uncategorized` selected
- **THEN** the Select trigger does not display a color indicator
- **AND** the selected label is aligned as if a color indicator were present

### Requirement: CategorySelect showcase
The development component showcase SHALL demonstrate `CategorySelect` as a specialized shared component.

#### Scenario: Developer reviews CategorySelect examples
- **WHEN** a developer opens the component showcase page
- **THEN** the page displays a `CategorySelect` section using the real component
- **AND** the examples include colored categories, a colorless category with aligned text, and aligned `Uncategorized`
- **AND** the section shows the selected category ID or uncategorized state

#### Scenario: Developer reviews CategorySelect guidance
- **WHEN** a developer opens the `CategorySelect` showcase section
- **THEN** the page documents representative usage and the public component API
- **AND** it states that `CategorySelect` composes the shared `Select` behavior for filtering, keyboard navigation, focus handling, and listbox semantics
