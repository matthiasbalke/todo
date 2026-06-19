# toggle-component Specification

## Purpose

Define the reusable shared Toggle control, including its state, integration API, accessibility, presentation, and documentation.

## Requirements

### Requirement: Toggle represents boolean state
The frontend SHALL provide a reusable shared `Toggle` component that exposes a bindable boolean `checked` value, defaults it to false, and renders distinct on and off states.

#### Scenario: Toggle is off
- **WHEN** a consumer renders `Toggle` with checked set to false
- **THEN** the control presents the off state
- **AND** its accessible checked state is false

#### Scenario: Toggle is on
- **WHEN** a consumer renders `Toggle` with checked set to true
- **THEN** the control presents the on state
- **AND** its accessible checked state is true

#### Scenario: Consumer binds state
- **WHEN** the user activates the toggle
- **THEN** the bound checked value changes to the opposite boolean value
- **AND** the component invokes its optional `onchange` callback with the updated value

### Requirement: Toggle exposes shared control integration props
`Toggle` SHALL support `disabled`, `ariaLabel`, `id`, layout-only `class`, a bindable native `element`, and applicable forwarded native button attributes.

#### Scenario: Consumer integrates the toggle
- **WHEN** a consumer supplies an ID, layout class, native element binding, or applicable native button attribute
- **THEN** the value is applied to the underlying button
- **AND** visual track, thumb, state, and focus styling remain owned by Toggle

### Requirement: Toggle uses accessible switch semantics
`Toggle` SHALL expose switch semantics and SHALL support native button keyboard and focus behavior.

#### Scenario: Assistive technology inspects the toggle
- **WHEN** the toggle is rendered
- **THEN** it has role `switch`
- **AND** `aria-checked` reflects the current checked value
- **AND** it has an accessible name supplied through `ariaLabel` or `aria-labelledby`

#### Scenario: Keyboard user activates the toggle
- **WHEN** the focused toggle receives Enter or Space
- **THEN** the checked value changes exactly once

### Requirement: Toggle supports disabled state
`Toggle` SHALL prevent state changes and present shared disabled feedback when disabled.

#### Scenario: Disabled toggle is activated
- **WHEN** a disabled toggle receives pointer or keyboard activation
- **THEN** its checked value does not change
- **AND** its change callback is not invoked

### Requirement: Toggle owns iOS-style presentation
`Toggle` SHALL own its rounded track, movable thumb, state colors, transitions, focus treatment, and disabled presentation rather than requiring consumer styling.

#### Scenario: Toggle state changes visually
- **WHEN** the checked value changes
- **THEN** the thumb moves to the corresponding side of the track
- **AND** the track uses the shared on or off state styling

#### Scenario: Consumer renders Toggle
- **WHEN** a consumer uses the shared toggle
- **THEN** the consumer does not need to provide track, thumb, state-color, or focus-ring classes

### Requirement: Toggle is documented and showcased
The shared component documentation and development component showcase SHALL describe and demonstrate the Toggle API and states.

#### Scenario: Developer reviews Toggle guidance
- **WHEN** a developer opens the shared component documentation or showcase
- **THEN** examples cover on, off, disabled, binding, accessible labeling, and change callbacks
