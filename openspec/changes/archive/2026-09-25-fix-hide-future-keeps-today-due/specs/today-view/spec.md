## ADDED Requirements

### Requirement: Recurring undated completion uses acting user's today
When completing a recurring item without a due date, the generated replacement item SHALL use the acting user's current date as the base date for `today + interval`.

#### Scenario: User timezone determines generated due date
- **WHEN** a user completes a recurring item without a due date near a timezone boundary
- **THEN** the generated item's due date is calculated from the user's current local date
- **AND** the generated due date is not calculated from the server's default timezone when it differs from the user's current local date
