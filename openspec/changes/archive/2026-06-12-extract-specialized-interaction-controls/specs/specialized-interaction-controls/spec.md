## ADDED Requirements

### Requirement: Calendar day interactions use a dedicated control
DatePicker SHALL render calendar date cells through a shared specialized control that owns date-state visuals while preserving grid semantics and roving keyboard focus.

#### Scenario: Selected current date
- **WHEN** a calendar date is selected and represents today
- **THEN** the calendar day control receives both semantic states and renders the defined selected/current presentation with correct `aria-selected` and `aria-current` values

#### Scenario: Keyboard navigation
- **WHEN** a user navigates calendar dates with Arrow, Home, End, Page Up, or Page Down keys
- **THEN** DatePicker retains focus orchestration and the calendar day control forwards key events and tabindex correctly

#### Scenario: Disabled date
- **WHEN** a date is outside the allowed range
- **THEN** the calendar day control is disabled, cannot select the date, and exposes the disabled presentation without consumer visual classes

### Requirement: Category colors use a dedicated swatch control
Category color choices SHALL render through a shared ColorSwatch control that accepts color and selection as data and owns all swatch styling.

#### Scenario: Select a category color
- **WHEN** a user activates an unselected color swatch
- **THEN** the parent receives the selected color and the control renders its selected state without consumer border, scale, radius, size, or inline-style configuration

#### Scenario: Deselect a category color
- **WHEN** a user activates the currently selected swatch
- **THEN** the existing toggle behavior is preserved and the control updates its accessible selected state

### Requirement: Item completion and star states use dedicated toggles
Item completion and starred state SHALL render through dedicated shared toggles that own their active and inactive visual presentations.

#### Scenario: Toggle completion
- **WHEN** a user clicks or taps the completion toggle
- **THEN** the existing completion action runs once and the control exposes the resulting done/undone state accessibly

#### Scenario: Toggle starred state
- **WHEN** a user clicks or taps the star toggle
- **THEN** the existing star action runs once and the control exposes the resulting starred/unstarred state accessibly

#### Scenario: Consumer styling boundary
- **WHEN** ItemCard renders either toggle
- **THEN** it supplies domain state and layout only, without active/inactive color, border, radius, hover, icon-size, or transition utilities

### Requirement: Swipe deletion uses a dedicated action
The revealed swipe-delete surface SHALL render through a shared specialized action that owns destructive presentation while preserving gesture behavior.

#### Scenario: Reveal and activate delete
- **WHEN** the item swipe gesture reveals the delete action and the user activates it
- **THEN** the existing delete workflow runs with the same accessible name and destructive visual treatment

#### Scenario: Gesture-owned geometry
- **WHEN** ItemCard controls the revealed action's width or placement as part of swipe orchestration
- **THEN** the specialized action accepts only the narrow geometry contract required by the gesture and retains ownership of colors, typography, and interaction states

### Requirement: Specialized styling exceptions are eliminated
The frontend SHALL contain no semantic styling guard exceptions for the specialized controls covered by this capability.

#### Scenario: Completed specialized migration
- **WHEN** all specialized controls have been implemented and their consumers migrated
- **THEN** the temporary calendar-day, color-swatch, completion-toggle, star-toggle, and swipe-delete exceptions are removed

#### Scenario: Visual styling is reintroduced
- **WHEN** a consumer adds specialized visual utilities or inline styling instead of using the dedicated control API
- **THEN** automated frontend verification fails with an actionable source location
