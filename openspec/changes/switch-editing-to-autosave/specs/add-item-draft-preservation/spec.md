## MODIFIED Requirements

### Requirement: Add-item draft reset remains intentional
The list detail page SHALL clear the preserved add-item draft only after a successful add-item creation or an explicit draft-discard action outside the ordinary save/cancel editing flow.

#### Scenario: Successful add clears draft
- **WHEN** the user completes add-item creation successfully
- **AND** the user opens the add-item form again
- **THEN** the form starts from the default new-item state

#### Scenario: Explicit cancel clears draft
- **WHEN** the user enters values in the add-item form
- **AND** the user activates an explicit draft-discard affordance outside the ordinary save/cancel editing flow
- **AND** the user opens the add-item form again
- **THEN** the form starts from the default new-item state

#### Scenario: Failed add keeps draft
- **WHEN** the user completes add-item creation and the add operation fails
- **THEN** the form keeps the user's draft values available for correction or retry
