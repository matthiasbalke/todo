# Spec Delta

## Purpose

Define how item recurrence rules are validated, retained across application surfaces, and used to generate the next scheduled instance.

## ADDED Requirements

### Requirement: Compatible recurrence rule contract
The system SHALL support a nullable recurrence rule with `intervalUnit` (DAYS, WEEKS, MONTHS, YEARS), positive integer `intervalValue`, and optional `weekdays` containing unique ISO weekday names MONDAY through SUNDAY. Absent or null weekdays SHALL mean an interval-only rule. Nonempty weekdays SHALL be supported only with WEEKS.

#### Scenario: Existing rule remains valid
- **WHEN** a stored or submitted rule contains WEEKS and intervalValue 2 without weekdays
- **THEN** it retains its every-two-weeks behavior without a data rewrite

#### Scenario: Selected weekdays are saved
- **WHEN** an editable user submits WEEKS, intervalValue 2, and weekdays MONDAY and THURSDAY
- **THEN** the saved rule retains that interval and weekday set
- **AND** weekday ordering does not change the rule's meaning

### Requirement: Invalid recurrence is rejected
The item write API SHALL reject invalid recurrence with HTTP 400 before changing an item or publishing an event. Invalid rules include nonpositive, fractional, or out-of-range integer amounts, unknown units or weekdays, duplicate or empty weekday arrays, and weekdays on nonweekly units.

#### Scenario: Invalid amount
- **WHEN** a create or update request contains intervalValue 0, -1, 1.5, or a value outside the supported integer range
- **THEN** it returns HTTP 400 and leaves stored data unchanged

#### Scenario: Invalid weekday configuration
- **WHEN** a create or update request contains an empty or duplicate weekday array, an unknown weekday, or weekdays with MONTHS
- **THEN** it returns HTTP 400 and publishes no item change event

### Requirement: Interval recurrence uses the original due date
Completing an interval-only recurring item SHALL create one next instance by adding its interval to its original due date, using the completing user's current calendar date in their persisted timezone when no due date exists. Month and year addition SHALL clamp to the target month's final day when necessary. Late completion SHALL NOT skip scheduled occurrences.

#### Scenario: Late completion
- **WHEN** an item due 2026-11-02 with a two-week interval is completed on 2026-11-20
- **THEN** the next instance is due 2026-11-16

#### Scenario: Month end and leap year
- **WHEN** a monthly item due 2027-01-31 or yearly item due 2024-02-29 is completed
- **THEN** its next due date is respectively 2027-02-28 or 2025-02-28

#### Scenario: Undated recurrence
- **WHEN** an undated daily item is completed on 2026-11-13 in the completing user's timezone
- **THEN** the next instance is due 2026-11-14

### Requirement: Selected weekdays define active weekly occurrences
For a weekly rule with weekdays, the next due date SHALL be strictly after the base date. The system SHALL choose the earliest selected day remaining in the base date's Monday–Sunday week; if none remains, it SHALL choose the earliest selected day in the week starting intervalValue weeks after that week's Monday. The base SHALL be the original due date or the completing user's current local date when undated.

#### Scenario: Next selected day within the same week
- **WHEN** an item due Monday 2026-11-02 has intervalValue 2 and weekdays MONDAY and THURSDAY and is completed
- **THEN** its next instance is due Thursday 2026-11-05

#### Scenario: Advance to the next active week
- **WHEN** an item due Thursday 2026-11-05 has intervalValue 2 and weekdays MONDAY and THURSDAY and is completed
- **THEN** its next instance is due Monday 2026-11-16

#### Scenario: Single selected weekday and year boundary
- **WHEN** an item due Thursday 2026-12-31 has intervalValue 1 and only THURSDAY selected and is completed
- **THEN** its next instance is due Thursday 2027-01-07

#### Scenario: Original due day is outside the selection
- **WHEN** an item due Tuesday 2026-11-03 selects MONDAY and THURSDAY with intervalValue 1 and is completed late on 2026-11-13
- **THEN** its next instance is due Thursday 2026-11-05

#### Scenario: Undated weekday rule
- **WHEN** an undated rule selects MONDAY and THURSDAY every week and is completed on Tuesday 2026-11-03 in the user's timezone
- **THEN** its next instance is due Thursday 2026-11-05

### Requirement: Generated instances preserve recurrence and item details
A generated instance SHALL retain the recurrence rule, list, category, title, notes, assignees, creator, and sort order, start incomplete, and link to the completed item through parentItemId. The completed item SHALL remain in history, and the next instance SHALL use existing list visibility and SSE behavior.

#### Scenario: Complete a weekday item
- **WHEN** an editable user completes a weekday-based recurring item
- **THEN** the completed instance remains stored
- **AND** one incomplete successor contains the same rule and preserved item details with parentItemId referencing the completed instance
- **AND** an item-created event carries the successor

### Requirement: Weekday recurrence advances one occurrence at a time
A weekday schedule SHALL start with one incomplete occurrence and generate only its next occurrence when checked. It SHALL NOT pre-create separate incomplete items for each selected weekday. Each completion SHALL retain the completed occurrence in history and leave one incomplete successor in the ordinary completion sequence.

#### Scenario: Monday and Friday completion sequence
- **WHEN** a user creates one item due Monday 2026-11-02 recurring every week on MONDAY and FRIDAY
- **THEN** only the Monday occurrence exists as an incomplete item
- **AND** checking it completes that occurrence and immediately creates one incomplete occurrence due Friday 2026-11-06 with the same recurrence rule
- **AND** checking the Friday occurrence immediately creates one incomplete occurrence due Monday 2026-11-09
- **AND** subsequent completions continue Friday then Monday in sequence
- **AND** completed occurrences remain in history and can be hidden with Hide checked

### Requirement: Recurrence survives all item data paths
List reads, Today reads, create/update responses, SSE item payloads, and list duplication SHALL preserve complete recurrence rules, including selected weekdays. Updating unrelated fields SHALL NOT erase custom intervals or weekdays.

#### Scenario: Read and update from Today
- **WHEN** a user loads a qualifying weekday item in Today and changes only its title
- **THEN** Today returns the full recurrence rule and the title update preserves it

#### Scenario: Live update and duplication
- **WHEN** a weekday recurring item is created or updated and its list is later duplicated
- **THEN** SSE consumers receive the full rule and the duplicated item retains the same rule

### Requirement: Recurrence summaries include schedule details
User-visible recurrence summaries SHALL describe the interval amount and unit and, when present, selected weekdays in Monday–Sunday order. Equivalent weekday sets SHALL produce equivalent summaries.

#### Scenario: Custom interval summary
- **WHEN** a user views an item recurring every 3 months
- **THEN** the recurrence summary communicates every 3 months

#### Scenario: Weekday summary
- **WHEN** a user views a rule selecting THURSDAY and MONDAY every 2 weeks
- **THEN** its summary communicates every 2 weeks on Monday and Thursday

### Requirement: Unrepresentable next dates fail atomically
If recurrence calculation exceeds supported calendar dates, completing the item SHALL return HTTP 400 without changing completion state, creating a successor, or publishing item events.

#### Scenario: Extreme yearly interval
- **WHEN** completing an item would add 2147483647 years to its due date
- **THEN** completion returns HTTP 400 and the item and its successors remain unchanged
