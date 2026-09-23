## ADDED Requirements

### Requirement: Field control geometry is shared across primitives
The shared visual foundation SHALL define field control geometry so text inputs and field-adjacent button actions can share the same visual height.

#### Scenario: Field controls are placed in one row
- **WHEN** a default text input and a field-adjacent button action are placed in the same row
- **THEN** their visible control boxes align to the same height
- **AND** their typography remains selected independently from their geometry

#### Scenario: Compact controls are used
- **WHEN** a compact or specialized control geometry is selected
- **THEN** the specialized geometry remains distinct from the default field geometry
- **AND** unrelated compact controls do not inherit default field height accidentally
