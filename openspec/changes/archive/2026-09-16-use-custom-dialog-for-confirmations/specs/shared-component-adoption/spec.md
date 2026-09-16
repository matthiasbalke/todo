## ADDED Requirements

### Requirement: Shared dialog adoption
Production consumer dialogs SHALL use the shared Dialog component for modal shells when the dialog needs app-level overlay, heading, close affordance, focus containment, or dismissal behavior.

#### Scenario: Reusable confirmation component is showcased
- **WHEN** the app provides a reusable destructive confirmation dialog component
- **THEN** the `/components` development showcase includes an interactive example of that component
- **AND** the example demonstrates cancellation, destructive confirmation, and loading or disabled pending behavior

#### Scenario: Consumer opens a modal dialog
- **WHEN** a production workflow opens a modal dialog for confirmation, configuration, editing, or member/category management
- **THEN** the dialog is rendered with the app's shared modal shell behavior
- **AND** its accessible name, modal semantics, close affordance, keyboard dismissal, and backdrop dismissal are preserved

#### Scenario: Destructive action asks for confirmation
- **WHEN** a user initiates a destructive list, item, category, or checked-item deletion that requires confirmation
- **THEN** the confirmation appears as an in-app reusable confirmation dialog instead of a browser-native confirmation prompt
- **AND** the dialog presents Cancel and destructive confirmation actions
- **AND** cancellation leaves the target data unchanged

#### Scenario: Full-screen editor remains outside modal shell adoption
- **WHEN** a workflow opens a full-screen focused editor rather than a classic modal confirmation or management dialog
- **THEN** it is not required to use the shared modal shell
- **AND** its existing full-screen editing behavior remains unchanged

#### Scenario: Confirmed delete operation fails
- **WHEN** a user confirms a destructive deletion and the delete operation fails
- **THEN** the dialog remains available or reports the failure in the current workflow without silently dismissing the error
- **AND** duplicate destructive submissions are prevented while the operation is pending
