## ADDED Requirements

### Requirement: Button field sizing aligns with input controls
The Button component SHALL provide a `field` size for actions that sit beside default shared text input controls.

#### Scenario: Field button is rendered beside a default text input
- **WHEN** a Button is rendered with the field-adjacent size beside a default shared text input
- **THEN** the Button uses the same visual control height as the text input
- **AND** the Button does not require consumer-provided padding or height utilities to align with the input

#### Scenario: Button is rendered as a non-field action
- **WHEN** a Button is rendered as a compact, icon, menu, header, chip, or row action
- **THEN** the Button keeps the geometry appropriate to that action type
- **AND** it is not forced to match text input height

#### Scenario: Field button enters loading state
- **WHEN** a Button rendered with the field-adjacent size enters loading state
- **THEN** the Button preserves its field-aligned height while displaying the loading label
