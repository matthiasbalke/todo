## Purpose

Define the application's display-language baseline until localization is intentionally introduced.

## Requirements

### Requirement: Application display language is English
The application SHALL use English for user-facing display text until a dedicated localization capability is introduced.

#### Scenario: User-facing text is added or changed
- **WHEN** a product UI label, message, date label, or other user-facing display string is added or changed
- **THEN** the text is written in English
- **AND** the implementation does not introduce another display language unless a localization capability explicitly permits it

#### Scenario: Locale-sensitive formatting is needed
- **WHEN** a UI feature formats locale-sensitive values such as dates or times
- **THEN** display words such as weekday and month names use the app's English display language
- **AND** user preferences such as timezone may still affect the calculated value
