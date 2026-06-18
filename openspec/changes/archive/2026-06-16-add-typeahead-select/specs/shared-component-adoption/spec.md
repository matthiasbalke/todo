## ADDED Requirements

### Requirement: Shared Select supports type-to-find selection
The shared `Select` component SHALL provide a searchable editable selected-value area that filters predefined options without allowing arbitrary values to become the selected value.

#### Scenario: User types to filter options
- **WHEN** a user focuses an enabled shared `Select` and types search text
- **THEN** the option list opens and only predefined options whose display labels match the typed text are shown
- **AND** matching uses the label returned by the select's option-label resolver

#### Scenario: User selects a filtered option
- **WHEN** a user chooses an option from the filtered list with pointer or keyboard
- **THEN** the shared `Select` updates the selected value to the original predefined option value
- **AND** the current `onSelect` callback receives that same original option value
- **AND** the visible selected-value area displays the chosen option label

#### Scenario: User abandons typed search
- **WHEN** a user types search text and dismisses the option list without choosing an option
- **THEN** the selected value remains unchanged
- **AND** the visible selected-value area returns to the selected option label or placeholder

#### Scenario: No matching options
- **WHEN** a user's typed search text matches no predefined option labels
- **THEN** the shared `Select` shows an empty-result state
- **AND** pressing Enter does not change the selected value or call the selection callback

#### Scenario: Disabled searchable select
- **WHEN** a shared `Select` is disabled
- **THEN** typing, pointer activation, and keyboard activation do not open the option list or change the selected value
