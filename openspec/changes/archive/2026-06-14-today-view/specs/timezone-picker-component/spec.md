## ADDED Requirements

### Requirement: TimezonePicker uses the shared Select
The frontend SHALL provide a reusable `TimezonePicker` component that composes the existing shared `Select` component rather than implementing an independent listbox.

#### Scenario: Timezone picker is rendered
- **WHEN** a consumer renders `TimezonePicker`
- **THEN** its trigger, listbox, focus handling, keyboard navigation, disabled state, and selection behavior are provided by the shared `Select`

### Requirement: TimezonePicker uses IANA identifiers
`TimezonePicker` SHALL expose selected values as valid IANA timezone identifiers and SHALL include `UTC` as an available value.

#### Scenario: User selects a timezone
- **WHEN** the user selects a timezone option
- **THEN** the component emits the corresponding IANA identifier without converting it to a fixed UTC offset

#### Scenario: Daylight-saving rules change
- **WHEN** a selected region observes a daylight-saving transition
- **THEN** the stored timezone identifier remains unchanged and can resolve the applicable offset for the relevant date

### Requirement: TimezonePicker presents friendly labels
`TimezonePicker` SHALL present human-readable labels while preserving the underlying IANA identifier.

#### Scenario: Region timezone is displayed
- **WHEN** the picker contains `Europe/Berlin`
- **THEN** the user sees a readable label derived from that identifier
- **AND** selecting it returns `Europe/Berlin`

#### Scenario: Current value is displayed
- **WHEN** the picker receives a valid selected timezone
- **THEN** the trigger displays that timezone's friendly label

### Requirement: TimezonePicker supports browser timezone data
`TimezonePicker` SHALL use timezone identifiers supported by the browser and SHALL remain usable when comprehensive browser timezone enumeration is unavailable.

#### Scenario: Browser supports timezone enumeration
- **WHEN** the browser provides its supported IANA timezone identifiers
- **THEN** the picker offers those identifiers together with `UTC`

#### Scenario: Browser lacks timezone enumeration
- **WHEN** comprehensive timezone enumeration is unavailable
- **THEN** the picker still offers `UTC`, the current selected value, and the browser-detected timezone when valid

