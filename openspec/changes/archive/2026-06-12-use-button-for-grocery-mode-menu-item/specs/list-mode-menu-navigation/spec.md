## ADDED Requirements

### Requirement: Grocery mode uses the shared menu button
The standard list burger menu SHALL render the "Grocery mode" action through the shared Button component with the same presentation contract as neighboring menu actions.

#### Scenario: Grocery mode action is displayed
- **WHEN** the user opens the standard list burger menu
- **THEN** "Grocery mode" is exposed as a native button
- **AND** it is full width, left aligned, and uses regular menu typography
- **AND** it retains the neutral text and hover treatment of adjacent actions

### Requirement: Grocery mode button preserves navigation
The "Grocery mode" button SHALL use client-side navigation to open the current list's grocery-mode route and SHALL dismiss the menu when activated.

#### Scenario: User activates Grocery mode
- **WHEN** the user activates "Grocery mode" from a list with identifier `list-1`
- **THEN** the menu is dismissed
- **AND** client-side navigation targets `/lists/list-1/grocery`

#### Scenario: User activates Grocery mode with a keyboard
- **WHEN** the focused "Grocery mode" button is activated using native keyboard button interaction
- **THEN** the same grocery-mode navigation behavior is invoked
