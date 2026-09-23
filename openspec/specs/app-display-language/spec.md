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

### Requirement: Application wording is coherent
The application SHALL use consistent user-facing wording for the same concepts wherever practical.

#### Scenario: Reusing an existing concept
- **WHEN** a UI label, action, message, or navigation term represents a concept already used elsewhere in the app
- **THEN** the wording matches the existing app wording for that concept wherever practical
- **AND** route-specific or feature-specific wording is used only when it clarifies a materially different action or state

#### Scenario: Form draft actions are displayed
- **WHEN** a form or settings surface presents standard draft actions
- **THEN** the primary commit action uses the concise label `Save` wherever the surrounding context already identifies what is being saved
- **AND** the draft-abandoning action uses the label `Cancel` wherever it returns the draft to the current saved state or exits the editing flow
