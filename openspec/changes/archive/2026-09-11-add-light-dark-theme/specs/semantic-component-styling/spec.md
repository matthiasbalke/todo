## ADDED Requirements

### Requirement: Semantic styling supports light and dark themes
Shared controls and app surfaces SHALL resolve semantic color tokens to accessible visual treatments in both light and dark themes.

#### Scenario: Light theme semantic tokens
- **WHEN** the active theme is light
- **THEN** shared controls, menus, dialogs, form fields, cards, footers, and page backgrounds use the light theme semantic color tokens

#### Scenario: Dark theme semantic tokens
- **WHEN** the active theme is dark
- **THEN** shared controls, menus, dialogs, form fields, cards, footers, and page backgrounds use the dark theme semantic color tokens

#### Scenario: Theme changes while viewing app
- **WHEN** the active theme changes while a user is viewing an app page
- **THEN** existing visible shared controls and app surfaces update without requiring a page reload

#### Scenario: Diagnostic palette remains available
- **WHEN** diagnostic palette mode is enabled
- **THEN** it remains visually distinct from both production themes
- **AND** existing diagnostic palette verification can still detect missing semantic token usage
