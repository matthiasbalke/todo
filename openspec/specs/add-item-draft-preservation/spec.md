# add-item-draft-preservation Specification

## Purpose
Define how the list detail add-item form preserves and clears in-progress new-item drafts.

## Requirements
### Requirement: Add-item draft persists when minimized
The list detail page SHALL preserve the in-progress add-item draft when the new-item form is minimized because focus leaves the form.

#### Scenario: User reopens after focus leaves title
- **WHEN** the user enters a title in the add-item form
- **AND** focus moves outside the form so the form is minimized
- **AND** the user opens the add-item form again
- **THEN** the title field contains the previously entered title

#### Scenario: User reopens after focus leaves optional fields
- **WHEN** the user enters notes, selects a due date, selects a category, selects assignees, or selects a recurrence in the add-item form
- **AND** focus moves outside the form so the form is minimized
- **AND** the user opens the add-item form again
- **THEN** each previously entered field value is restored

### Requirement: Add-item draft reset remains intentional
The list detail page SHALL clear the preserved add-item draft only after a successful add submission or an explicit user cancellation.

#### Scenario: Successful add clears draft
- **WHEN** the user submits the add-item form successfully
- **AND** the user opens the add-item form again
- **THEN** the form starts from the default new-item state

#### Scenario: Explicit cancel clears draft
- **WHEN** the user enters values in the add-item form
- **AND** the user activates the form's Cancel control
- **AND** the user opens the add-item form again
- **THEN** the form starts from the default new-item state

#### Scenario: Failed add keeps draft
- **WHEN** the user submits the add-item form and the add operation fails
- **THEN** the form keeps the user's draft values available for correction or retry
