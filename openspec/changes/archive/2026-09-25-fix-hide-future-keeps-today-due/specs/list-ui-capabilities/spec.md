## ADDED Requirements

### Requirement: Hide future preserves due-today items
The standard list view and grocery list view SHALL evaluate date-only due dates against the user's current local date and hide only items whose due date is strictly after that date when Hide future is active.

#### Scenario: Due today remains visible
- **WHEN** a user enables Hide future on a standard list view or grocery list view containing items due yesterday, due today, due tomorrow, and without a due date
- **THEN** items due yesterday remain visible
- **AND** items due today remain visible
- **AND** items without a due date remain visible
- **AND** items due tomorrow are hidden

#### Scenario: Date-only due dates do not shift across timezones
- **WHEN** a user enables Hide future while their browser timezone would interpret a `YYYY-MM-DD` due date as a different UTC instant
- **THEN** an item whose date-only due date equals the user's current local date remains visible
- **AND** only date-only due dates after the user's current local date are hidden

### Requirement: Due-date presentation uses date-only semantics
The standard list view, grocery list view, and Today view SHALL sort, format, and classify due dates as calendar dates rather than instants.

#### Scenario: Due-date chip matches local today
- **WHEN** an item has a date-only due date equal to the user's current local date
- **THEN** the due-date chip labels the item as due today
- **AND** the item is not shown as overdue
- **AND** the result does not depend on interpreting the due date as a UTC instant

#### Scenario: Due-date sorting preserves calendar order
- **WHEN** a list or Today view is sorted by due date
- **THEN** dated items are ordered by their `YYYY-MM-DD` calendar value
- **AND** undated items keep the existing undated placement behavior
- **AND** timezone conversion does not alter the relative order of dated items
