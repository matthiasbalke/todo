# Button Component

## Purpose

Define the shared native button component and its supported behavior, variants, and states.

## Requirements

### Requirement: Native button semantics
The Button component SHALL render a native button element, SHALL default its type to `button`, and SHALL allow consumers to provide standard button attributes and event handlers.

#### Scenario: Button is rendered without a type
- **WHEN** a consumer renders Button without specifying `type`
- **THEN** the rendered native button has `type="button"`

#### Scenario: Submit type is requested
- **WHEN** a consumer renders Button with `type="submit"` inside a form
- **THEN** activating the Button participates in native form submission

#### Scenario: Consumer handles a click
- **WHEN** an enabled Button is activated
- **THEN** the consumer-provided native click handler receives the click event

### Requirement: Button content
The Button component SHALL render consumer-provided child content and SHALL support text, icons, or combined markup without altering its semantics.

#### Scenario: Consumer provides mixed content
- **WHEN** a consumer provides an icon and text as Button children
- **THEN** both are rendered inside the native button

### Requirement: Visual variants
The Button component SHALL provide `primary`, `secondary`, and `danger` variants and SHALL use `primary` when no variant is specified.

#### Scenario: Default variant is rendered
- **WHEN** a consumer omits the variant
- **THEN** the Button uses the primary visual treatment

#### Scenario: Named variant is rendered
- **WHEN** a consumer selects the secondary or danger variant
- **THEN** the Button uses the corresponding neutral or destructive visual treatment

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

### Requirement: Disabled behavior
The Button component SHALL honor the disabled state through native button behavior and SHALL expose a visibly unavailable style.

#### Scenario: Disabled button is activated
- **WHEN** a user attempts to activate a disabled Button
- **THEN** the consumer click handler is not invoked

### Requirement: Loading behavior
The Button component SHALL support a loading state that prevents activation, communicates busy status, and displays a loading label.

#### Scenario: Button is loading
- **WHEN** `loading` is true
- **THEN** the native button is disabled
- **AND** it exposes `aria-busy="true"`
- **AND** it displays the configured loading label or `Loading…` by default

#### Scenario: Loading button is activated
- **WHEN** a user attempts to activate a loading Button
- **THEN** the consumer click handler is not invoked

### Requirement: Class extension
The Button component SHALL allow consumer classes to be added while retaining its base and variant styles.

#### Scenario: Consumer adds a layout class
- **WHEN** a consumer supplies a class such as `w-full`
- **THEN** the rendered button contains that class together with the component's standard classes
