# Spec Delta

## MODIFIED Requirements

### Requirement: Recurrence preset values and labels
The recurrence Select SHALL offer No recurrence, Daily, Weekly, Monthly, Yearly, Weekdays, and Custom with stable option values. Daily, Weekly, Monthly, and Yearly SHALL represent intervalValue 1 with their corresponding unit. Two-week and three-month intervals SHALL be available through Custom rather than separate presets.

#### Scenario: User opens recurrence options
- **WHEN** the user opens the recurrence Select
- **THEN** the first option is No recurrence
- **AND** the other options are Daily, Weekly, Monthly, Yearly, Weekdays, and Custom
- **AND** selecting a basic preset produces its corresponding interval rule

### Requirement: Initial recurrence selection
The recurrence editor SHALL initialize faithfully from an existing item's complete rule. Unit intervals without weekdays SHALL select their basic preset; weekly weekday sets with intervalValue 1 SHALL select Weekdays; all other valid rules SHALL select Custom with all values populated. No valid custom rule SHALL fall back to no recurrence.

#### Scenario: User edits an item with a supported recurrence rule
- **WHEN** the form opens for an item matching a basic preset
- **THEN** the recurrence trigger displays its matching summary and the preset is selected

#### Scenario: User edits an item without recurrence
- **WHEN** the form opens for an item whose recurrence rule is null
- **THEN** the editor selects No recurrence and retains the form's empty recurrence placeholder

#### Scenario: User edits an item with an unsupported recurrence rule
- **WHEN** the form opens for an item recurring every 4 weeks or every 3 months
- **THEN** Custom is selected with the original amount and unit
- **AND** changing only the title preserves that recurrence

#### Scenario: User edits selected weekdays
- **WHEN** the form opens for an item recurring every 2 weeks on Monday and Thursday
- **THEN** Custom is selected with amount 2, unit weeks, and Monday and Thursday checked

### Requirement: Recurrence submission and reset
The item forms SHALL submit null for No recurrence or a complete validated rule for a preset, custom interval, or weekday schedule. Successful new-item creation SHALL reset all recurrence controls; failure SHALL preserve input for retry.

#### Scenario: User submits a recurrence preset
- **WHEN** the user selects Daily, Weekly, Monthly, or Yearly and completes item creation
- **THEN** the submitted rule has intervalValue 1 and the matching intervalUnit

#### Scenario: User submits no recurrence
- **WHEN** the user selects No recurrence and completes item creation or an existing-item selection change
- **THEN** recurrenceRule is null

#### Scenario: New item form resets after submission
- **WHEN** a new recurring item is created successfully
- **THEN** the recurrence mode returns to No recurrence and custom amount, unit, and weekday input reset to defaults

#### Scenario: Failed creation keeps custom recurrence
- **WHEN** creation fails for an item with a custom weekday rule
- **THEN** its amount, unit, selected weekdays, and other draft fields remain available for retry

### Requirement: Recurrence interactions preserve the new-item form
The item forms SHALL treat pointer and keyboard interaction within recurrence options and custom controls as internal form interaction. Entering multi-field recurrence SHALL NOT close the editor or minimize the composer before configuration is complete.

#### Scenario: User selects recurrence with a pointer
- **WHEN** the user opens recurrence options and clicks a basic preset
- **THEN** the recurrence updates and the new-item composer remains open without calling oncancel

#### Scenario: User selects recurrence with the keyboard
- **WHEN** the user opens recurrence options, navigates, and selects a basic preset by keyboard
- **THEN** the recurrence updates and the new-item composer remains open without calling oncancel

#### Scenario: User dismisses recurrence options
- **WHEN** the user presses Escape while recurrence options are open without changes
- **THEN** the options close without changing the rule
- **AND** focus returns to the recurrence trigger and the new-item composer remains open without calling oncancel

#### Scenario: User enters a multi-field recurrence
- **WHEN** the user selects Custom or Weekdays and interacts with amount, unit, or weekday controls
- **THEN** the editor remains available for further changes
- **AND** focus is not forcibly released after each weekday selection
- **AND** closing the editor returns focus to the recurrence trigger

## ADDED Requirements

### Requirement: Custom recurrence configuration
Both quick-add and existing-item editing SHALL expose a labeled positive whole-number amount and days, weeks, months, or years unit selector for Custom. Weekly custom rules SHALL additionally offer optional selected weekdays. Selecting a nonweekly unit SHALL clear weekday constraints before producing a rule.

#### Scenario: Create a custom interval
- **WHEN** the user selects Custom, enters amount 3, and chooses months
- **THEN** the valid pending rule has intervalValue 3 and intervalUnit MONTHS without weekdays

#### Scenario: Custom weekly schedule
- **WHEN** the user selects Custom, enters amount 2, chooses weeks, checks Monday and Thursday, and closes the editor
- **THEN** the valid pending rule has intervalValue 2, intervalUnit WEEKS, and those selected weekdays

#### Scenario: Switch away from weekly schedule
- **WHEN** the user changes a custom weekly rule with weekdays to months
- **THEN** the pending monthly rule has no weekday constraint

### Requirement: Weekdays configuration
Selecting Weekdays SHALL expose seven individually named, keyboard-accessible day controls in Monday–Sunday order and require at least one selection. This mode SHALL represent a weekly rule with intervalValue 1. Weekdays SHALL mean the user's selected days, including weekends when chosen.

#### Scenario: Select weekday preset
- **WHEN** the user selects Weekdays, checks Monday and Thursday, and closes the editor
- **THEN** the resulting rule repeats every week on Monday and Thursday

#### Scenario: Select weekend day
- **WHEN** the user selects Sunday as the only weekday and closes the editor
- **THEN** the resulting rule repeats every Sunday

### Requirement: Invalid recurrence stays editable
Incomplete or invalid recurrence input SHALL remain editable with an accessible validation message and SHALL NOT be submitted or automatically persisted. Opening a configuration mode SHALL NOT itself change a saved rule. Valid interval-only changes SHALL apply automatically. Weekday edits SHALL remain local until close and then apply as one complete valid rule without separate Save or Cancel buttons.

#### Scenario: Incomplete amount
- **WHEN** the custom amount is empty, fractional, zero, negative, or exceeds the supported integer range
- **THEN** the editor identifies the invalid amount and sends no item write containing that state
- **AND** a previously saved recurrence remains intact

#### Scenario: Missing selected weekday
- **WHEN** Weekdays is active with no selected day, including after the final selected day is removed
- **THEN** the editor requires at least one day and does not save an empty weekday rule

#### Scenario: Complete automatic selection update
- **WHEN** an existing item's interval-only custom configuration becomes valid through an input commit
- **THEN** the complete rule is automatically persisted
- **AND** weekday ordering alone does not cause another save

### Requirement: Complete recurrence draft preservation
Minimizing and reopening quick-add SHALL restore its recurrence mode, raw amount input, unit, and weekday selections, including incomplete input. Clearing the recurrence chip SHALL clear its whole configuration. Explicit draft discard and successful creation SHALL reset recurrence with the remaining draft fields.

#### Scenario: Reopen custom draft
- **WHEN** a user enters a custom rule or incomplete custom amount, minimizes quick-add, and reopens it
- **THEN** the full recurrence editor state is restored without creating an item

#### Scenario: Clear recurrence chip
- **WHEN** a user removes the quick-add recurrence chip
- **THEN** recurrence becomes null and reopening its editor reveals no stale weekday selections

### Requirement: Weekday changes apply on editor close
The recurrence editor SHALL stage weekday edits and apply the complete valid configuration once on close, Escape, or outside dismissal. It SHALL NOT apply intermediate weekday sets while open or issue a write for an unchanged rule. Invalid dismissal SHALL retain the last applied rule and preserve incomplete input for correction.

#### Scenario: Replace a weekday selection
- **WHEN** a user replaces Monday with Thursday and closes the editor
- **THEN** only the final Thursday configuration is applied to the quick-add draft or persisted for an existing item
- **AND** no intermediate weekday set is applied while the editor is open

#### Scenario: Close an invalid weekday draft
- **WHEN** a user closes the editor with no selected day in Weekdays mode
- **THEN** the editor closes without changing the last applied recurrence
- **AND** reopening restores incomplete input and its validation message
- **AND** new-item creation remains blocked until the recurrence is corrected or cleared

#### Scenario: Close without changing the rule
- **WHEN** a user closes the editor with an unchanged weekday set
- **THEN** no persistence request is sent
