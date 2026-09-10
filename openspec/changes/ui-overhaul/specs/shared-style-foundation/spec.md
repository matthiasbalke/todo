## ADDED Requirements

### Requirement: Semantic colors support future theme palettes
The foundation SHALL expose theme-owned colors as overridable semantic CSS custom properties. Components SHALL reference the same roles across palettes, with theme scope at the app root and no required per-component theme props. Typography and geometry SHALL remain shared by default.

#### Scenario: A palette is applied at the app root
- **WHEN** a different palette supplies the semantic color values
- **THEN** controls and surrounding page, card, menu, dialog, and fixed-footer surfaces consume those values
- **AND** overlays outside their originating component receive the same palette
- **AND** component behavior and semantic presentation APIs remain unchanged

#### Scenario: Theme roles cover foregrounds and states
- **WHEN** foundation color roles are defined
- **THEN** they include paired foreground/background roles for readable text, placeholders, actions, selected states, and errors
- **AND** borders, hover, focus, disabled treatments, shadows, and overlays use appropriate semantic roles where applicable
- **AND** user-authored colors remain domain data whose readability is inspected against theme surfaces

### Requirement: A distinguishable diagnostic palette verifies theme readiness
Implementation SHALL provide a temporary development/test-only alternate palette that is clearly distinguishable from the default across text, surfaces, borders, accents, and interaction states while retaining readable foreground/background combinations. Browser verification SHALL use this palette to detect hardcoded theme-owned colors.

#### Scenario: Reviewer activates the diagnostic palette
- **WHEN** a reviewer uses the documented development/test activation mechanism
- **THEN** the alternate palette is applied at the app root to the showcase and representative app screens
- **AND** its appearance is unmistakably different from the default rather than a subtle shade adjustment
- **AND** it requires no edits to individual components

#### Scenario: Browser verification exercises both palettes
- **WHEN** the default and diagnostic palettes are inspected on desktop and mobile
- **THEN** visual inspection and computed-style assertions verify representative text, native and rendered placeholders, surfaces, borders, accents, and hover/focus/selected/invalid/disabled states
- **AND** verification includes menus, fullscreen notes, and fixed footers
- **AND** unexpected retained default colors are corrected or documented as intentional domain values

#### Scenario: Diagnostic verification ends
- **WHEN** the alternate palette is deactivated
- **THEN** the default palette is restored without changing component content or behavior
- **AND** the diagnostic palette and its activation control are excluded from production delivery
- **AND** a production dark palette, theme preference UI, system preference handling, and persistence remain outside this change

### Requirement: Shared components consume a central visual foundation
All shared frontend components SHALL obtain theme-owned visual values from a shared style foundation, directly or through shared primitives. The foundation SHALL define typography, semantic colors, spacing, corner radii, control geometry, and interaction treatments, and SHALL reuse the existing icon sizing and stroke presets.

#### Scenario: A shared visual value changes
- **WHEN** a developer changes a foundation value for a semantic role
- **THEN** all components using that role reflect the change without editing individual component visual values
- **AND** components using other roles retain their own intended presentation

#### Scenario: A component needs specialized presentation
- **WHEN** a component requires a distinct visual treatment
- **THEN** it selects a named recipe composed from foundation values
- **AND** intentional domain data such as user-selected category colors remains data rather than being replaced with a fixed theme color

### Requirement: Typography and text roles are consistent
The foundation SHALL define font family, size, weight, line height, and letter spacing through named typography roles for body/value, title, label, supporting text, and placeholder. Font size and text size SHALL use one definition, and typography SHALL be independently selectable from control geometry.

#### Scenario: Empty values appear in different controls
- **WHEN** a native input placeholder and a rendered empty-state preview use the placeholder role
- **THEN** they use the same foundation typography and text-color treatment
- **AND** the empty notes preview and fullscreen notes textarea both display `add note`

#### Scenario: Control geometry is compact
- **WHEN** a component uses compact padding or height
- **THEN** its text size is selected through a typography role rather than implicitly reduced by geometry
- **AND** mobile text entry retains the app's input-size protection

### Requirement: Components preserve semantic presentation and behavior
Shared components SHALL retain native semantics and existing interaction behavior while consuming foundation presets. Consumers SHALL select presentation through semantic props and SHALL continue to supply only approved parent-layout classes.

#### Scenario: A shared control adopts the foundation
- **WHEN** a button, input, textarea, picker, or composite control is migrated
- **THEN** its accessible name, keyboard operation, focus behavior, value binding, validation, and submission behavior remain unchanged
- **AND** no common wrapper element is required solely to obtain foundation styles

#### Scenario: A control displays interaction state
- **WHEN** a control is hovered, focused, selected, invalid, or disabled
- **THEN** the component uses the foundation treatment appropriate to that state and semantic role
- **AND** existing semantic props remain the consumer-facing presentation API

### Requirement: Foundation adoption is reviewable across the app
Foundation adoption SHALL cover all shared frontend components in staged work, initially preserving the current appearance and documenting intentional role differences. Global visual tuning SHALL follow a review of the consolidated foundation.

#### Scenario: Adoption inventory is reviewed
- **WHEN** implementation begins
- **THEN** an inventory identifies shared components, their existing visual definitions, and their intended foundation roles
- **AND** visible inconsistencies requiring alignment are identified explicitly

#### Scenario: Foundation is demonstrated
- **WHEN** a developer opens the components showcase
- **THEN** a navigable foundation section demonstrates typography roles, semantic colors, and representative real controls with default, placeholder, selected, invalid, and disabled states
- **AND** interactive examples allow hover and keyboard-focus inspection
- **AND** desktop and mobile review can compare consistent roles across different controls

#### Scenario: A foundation value is verified
- **WHEN** representative components are rendered with a changed foundation value in browser verification
- **THEN** their computed styles reflect the shared value for the selected role
- **AND** the verification checks rendered behavior rather than only matching class strings
