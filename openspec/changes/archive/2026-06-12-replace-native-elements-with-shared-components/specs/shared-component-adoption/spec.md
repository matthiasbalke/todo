## ADDED Requirements

### Requirement: Shared primitive compatibility
The shared control components SHALL support the native attributes, events, focus access, unique accessibility identifiers, sizing, and visual intents required by their production consumers without changing existing default behavior.

#### Scenario: Consumer configures a shared control
- **WHEN** a production consumer passes supported native attributes, event handlers, IDs, classes, disabled state, or focus references to a shared control
- **THEN** the shared control applies or forwards them to its interactive native element
- **AND** multiple instances retain distinct accessibility relationships

#### Scenario: Consumer renders a specialized button
- **WHEN** a production consumer renders a compact, icon, menu, chip, loading, destructive, or visually bare action through Button
- **THEN** the rendered control retains native button semantics
- **AND** its visual intent and size are represented through the shared Button API

### Requirement: Shared select adoption
Production consumers SHALL use the shared Select component for the audited filter, sort, and member-role controls instead of native select elements.

#### Scenario: User changes a filter or sort field
- **WHEN** the user selects a filter or sort option with a pointer or keyboard
- **THEN** the existing typed value is passed to the current change handler
- **AND** the visible option uses its existing label

#### Scenario: Owner changes or assigns a member role
- **WHEN** the owner selects a role for an existing or invited member
- **THEN** the existing role value is retained
- **AND** the current role-change or invitation workflow is invoked

### Requirement: Shared input adoption
Production consumers SHALL use TextInput or EmailInput for audited form text and email entry, and EditableLabel for audited display-to-edit fields whose interaction matches that component.

#### Scenario: User enters form text or email
- **WHEN** the user types, focuses, blurs, validates, or submits an adopted input
- **THEN** its existing value binding, validation, required state, keyboard behavior, and form submission are preserved

#### Scenario: User edits an inline value
- **WHEN** the user starts, saves, cancels, blurs, or presses Escape in an adopted inline editor
- **THEN** the existing save and cancellation contract is preserved
- **AND** focus remains consistent with the current workflow

#### Scenario: Composite editor uses TextInput
- **WHEN** text editing is coordinated with adjacent state such as category color or menu state
- **THEN** the editor uses TextInput rather than forcing the workflow into EditableLabel
- **AND** the composite save behavior remains atomic

### Requirement: Shared button adoption
Production consumers SHALL use the shared Button component for the audited native button actions.

#### Scenario: User activates an adopted action
- **WHEN** the user activates a primary, secondary, destructive, icon, menu, disclosure, chip, toolbar, submit, or cancel action
- **THEN** the same handler and native button type are used
- **AND** accessible name, disabled state, keyboard activation, and visual intent are preserved

#### Scenario: User activates a loading action
- **WHEN** an adopted action is waiting for asynchronous completion
- **THEN** Button exposes the loading state
- **AND** duplicate activation is prevented
- **AND** the existing loading label remains visible

### Requirement: Feature behavior preservation
Replacing native controls with shared components SHALL NOT change authentication, account, list, group, category, member, item, filter, sort, grocery, navigation, or dialog business behavior.

#### Scenario: Existing workflow is exercised after migration
- **WHEN** an existing focused component or route workflow is performed
- **THEN** its submitted data, API calls, state transitions, cancellation behavior, and error handling remain unchanged

### Requirement: Native-control adoption guard
The frontend SHALL automatically detect newly introduced consumer-level native controls when a matching shared component exists.

#### Scenario: Replaceable native control is added
- **WHEN** a production Svelte consumer adds a native button, select, textarea, or replaceable text/email input outside an approved location
- **THEN** the inventory check fails
- **AND** it reports the source location of the violation

#### Scenario: Shared primitive uses its native implementation
- **WHEN** Button, Select, TextInput, EmailInput, EditableLabel, Textarea, or DatePicker renders the native element it encapsulates
- **THEN** the inventory check permits that implementation

#### Scenario: Native control has no shared equivalent
- **WHEN** production code uses a native control type without a matching shared component
- **THEN** the inventory check permits it when it is an approved unmatched element
- **AND** approved unmatched elements include links, forms, fieldset/legend groups, labels, semantic content/layout elements, lists, tables, SVG markup, and unsupported input types
- **AND** any additional exception records a documented reason
