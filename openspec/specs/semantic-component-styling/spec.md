# semantic-component-styling Specification

## Purpose
TBD - created by archiving change standardize-semantic-component-styling. Update Purpose after archive.
## Requirements
### Requirement: Shared controls expose semantic presentation
The frontend SHALL configure shared controls through typed semantic intent, appearance, geometry, and state props rather than consumer-provided visual CSS utilities.

#### Scenario: Filled primary action
- **WHEN** a consumer renders the main action for a workflow
- **THEN** it uses the shared control's primary semantic tone and solid appearance without supplying color, border, hover, focus, typography, radius, or padding utilities

#### Scenario: Destructive secondary action
- **WHEN** a consumer renders a destructive menu or text action that is not a filled confirmation
- **THEN** it uses a danger tone with an appropriate non-solid appearance instead of custom red text or background utilities

#### Scenario: Selected menu option
- **WHEN** a menu or option row represents the selected value
- **THEN** the consumer passes an explicit selected state and the shared control owns the selected visual treatment

### Requirement: Layout classes remain consumer-owned
Shared controls SHALL accept only parent-layout styling from consumers and SHALL own their internal visual presentation.

#### Scenario: Allowed full-width layout
- **WHEN** a consumer needs a shared control to fill its parent
- **THEN** it may pass an approved width or flex-participation utility without changing the control's internal appearance

#### Scenario: Rejected visual override
- **WHEN** a consumer supplies a color, background, border, radius, shadow, interaction-state, typography, transition, or internal-spacing utility to a shared control
- **THEN** automated frontend verification fails with the file, line, component, prop, and forbidden utility

#### Scenario: Removed visual hook
- **WHEN** a consumer uses a deprecated visual hook such as a trigger, input, display, or label class prop
- **THEN** type checking or the styling guard rejects the usage and directs the consumer to a named semantic prop

### Requirement: Composite controls reuse shared primitives
Composite shared controls SHALL compose existing lower-level shared primitives whenever doing so preserves native semantics, accessibility, and interaction behavior.

#### Scenario: Editable label actions
- **WHEN** EditableLabel renders its editing field and explicit save or cancel actions
- **THEN** it composes TextInput and Button while preserving validation, focus, cancellation, loading, and keyboard behavior

#### Scenario: Date picker standard actions
- **WHEN** DatePicker renders its trigger, month navigation, Today action, or Clear action
- **THEN** it composes Button and preserves dialog labeling, focus return, disabled behavior, and keyboard operation

#### Scenario: Select trigger and options
- **WHEN** Select renders its trigger and standard option actions
- **THEN** it composes Button while preserving listbox roles, selection, keyboard navigation, focus management, and dropdown positioning

### Requirement: Specialized controls use temporary explicit exceptions
The semantic styling guard SHALL permit specialized dynamic interaction visuals only through exact, documented exceptions until dedicated shared controls replace them.

#### Scenario: Approved specialized exception
- **WHEN** a calendar day, color swatch, completion toggle, star toggle, or swipe-delete surface cannot be represented by the standard primitive API
- **THEN** the exception records its exact source location, control identity, rationale, and follow-up change

#### Scenario: Broad exception is rejected
- **WHEN** an exception omits a reason, covers an entire file, or does not identify a specialized control
- **THEN** automated frontend verification fails

### Requirement: Legacy presentation APIs are removed after migration
The frontend SHALL expose one supported semantic presentation model after all production consumers have migrated.

#### Scenario: Completed migration
- **WHEN** the semantic component styling change is complete
- **THEN** the old combined Button variant API and unrestricted visual class hooks are absent from production shared-component APIs and consumers

#### Scenario: Preserved behavior
- **WHEN** a production consumer is migrated to semantic props
- **THEN** its click, form, loading, disabled, focus, keyboard, responsive, and accessible-name behavior remains unchanged

