## MODIFIED Requirements

### Requirement: Shared primitive compatibility
The shared control components SHALL support the native attributes, events, focus access, unique accessibility identifiers, sizing, visual intents, content alignment, and typography required by their production consumers without changing existing default behavior.

#### Scenario: Consumer configures a shared control
- **WHEN** a production consumer passes supported native attributes, event handlers, IDs, classes, disabled state, or focus references to a shared control
- **THEN** the shared control applies or forwards them to its interactive native element
- **AND** multiple instances retain distinct accessibility relationships

#### Scenario: Consumer renders a specialized button
- **WHEN** a production consumer renders a compact, icon, menu, chip, loading, destructive, or visually bare action through Button
- **THEN** the rendered control retains native button semantics
- **AND** its visual intent and size are represented through the shared Button API

#### Scenario: Consumer configures button content alignment
- **WHEN** a production consumer requires centered, left-aligned, or space-between button content
- **THEN** Button applies the requested horizontal flex alignment through its shared API
- **AND** centered alignment remains the default for consumers that do not configure alignment

#### Scenario: Consumer configures button font weight
- **WHEN** a production consumer requires regular or medium button typography
- **THEN** Button applies the requested font weight through its shared API
- **AND** medium weight remains the default for consumers that do not configure weight

#### Scenario: Grocery rows use shared buttons
- **WHEN** grocery category headers and grocery item rows render through Button
- **THEN** category header content spans the available width
- **AND** item controls and labels begin at the left edge rather than being centered

#### Scenario: Menu actions use shared buttons
- **WHEN** a full-width burger-menu action or submenu option renders through Button
- **THEN** its primary label is left aligned
- **AND** any status text or selection indicator remains aligned at the opposite edge
- **AND** ordinary menu actions and options use regular font weight

#### Scenario: Selected menu option is distinguishable
- **WHEN** a filter, due-date, assignment, or sort option is selected
- **THEN** the selected option uses the designated blue text treatment and selection indicator
- **AND** unselected options use neutral text
- **AND** selected and unselected options both retain regular font weight
