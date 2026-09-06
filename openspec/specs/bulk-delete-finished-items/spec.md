# bulk-delete-finished-items Specification

## Purpose

Define list-scoped cleanup behavior for deleting checked todo items from real list views.

## Requirements

### Requirement: Editable users can delete all checked items in a real list
The system SHALL allow users with item mutation capability to delete all checked todo items from a single real source list in one action.

#### Scenario: Editor deletes checked list items
- **WHEN** an editor or owner confirms deleting checked items for a real list that contains checked and unchecked items
- **THEN** all checked items in that list are deleted
- **AND** unchecked items in that list remain unchanged

#### Scenario: Viewer cannot delete checked list items
- **WHEN** a viewer opens a regular list
- **THEN** the delete-checked-items action is not available

#### Scenario: Server rejects unauthorized bulk deletion
- **WHEN** a viewer or non-member requests the list-scoped checked-item deletion endpoint
- **THEN** the request is rejected without deleting any items

#### Scenario: Today does not expose cleanup
- **WHEN** a user opens Today
- **THEN** no delete-checked-items action is available

#### Scenario: Grocery view exposes cleanup
- **WHEN** an editor or owner opens grocery view for a real list that has checked items
- **THEN** the list options menu exposes the delete-checked-items action

### Requirement: Checked-item cleanup ignores active filters
The checked-item cleanup SHALL delete all checked items in the current real list regardless of active list filters or Hide checked state.

#### Scenario: Checked items are hidden by filters
- **WHEN** an editor or owner confirms deleting checked items while active filters hide some checked items in the current list
- **THEN** checked items hidden by those filters are deleted
- **AND** unchecked items that match or do not match those filters remain unchanged

#### Scenario: Hide checked is active
- **WHEN** an editor or owner confirms deleting checked items while Hide checked is active
- **THEN** checked items hidden by Hide checked are deleted
- **AND** unchecked visible items remain unchanged

### Requirement: Checked-item cleanup requires confirmation modal
The frontend SHALL require explicit user confirmation in a modal before deleting all checked items from a real list.

#### Scenario: User confirms cleanup
- **WHEN** an editable user activates the delete-checked-items action and confirms the modal
- **THEN** the frontend sends the bulk deletion request for the current list

#### Scenario: User cancels cleanup
- **WHEN** an editable user activates the delete-checked-items action and cancels the modal
- **THEN** no bulk deletion request is sent
- **AND** no items are removed locally

#### Scenario: Confirmation includes deletion count
- **WHEN** an editable user activates the delete-checked-items action
- **THEN** the confirmation modal identifies the number of currently loaded checked items in the full current-list item set that may be deleted
- **AND** the count includes checked items hidden by active filters or Hide checked

### Requirement: Bulk deletion updates visible list state
After successful checked-item deletion, the frontend SHALL remove deleted checked items from the current list state and preserve the remaining list items.

#### Scenario: Cleanup succeeds
- **WHEN** a bulk checked-item deletion request succeeds
- **THEN** checked items from the target list are no longer displayed
- **AND** unchecked items from the target list remain displayed according to the active filters and sort order

#### Scenario: Cleanup fails
- **WHEN** a bulk checked-item deletion request fails
- **THEN** the frontend keeps the previously loaded item state
- **AND** the user is shown an error for the failed cleanup

#### Scenario: No checked items exist
- **WHEN** an editable user opens a real list with no checked items
- **THEN** the delete-checked-items action is displayed
- **AND** the delete-checked-items action is disabled

### Requirement: Bulk deletion notifies list subscribers
The backend SHALL notify subscribers to the affected list when items are removed by the checked-item cleanup.

#### Scenario: Connected client receives deletion events
- **WHEN** checked items are deleted from a list
- **THEN** connected clients subscribed to that list receive deletion notifications for the removed items

#### Scenario: Other lists are not notified
- **WHEN** checked items are deleted from one list
- **THEN** subscribers to other lists do not receive deletion notifications for that cleanup

### Requirement: Recurring cleanup deletes only checked occurrences
The checked-item cleanup SHALL delete checked recurring occurrences without deleting unchecked recurring follow-up items.

#### Scenario: Checked recurring occurrence has generated follow-up
- **WHEN** a checked recurring item and its unchecked generated follow-up both exist in the same list
- **THEN** the checked occurrence is deleted by checked-item cleanup
- **AND** the unchecked generated follow-up remains in the list
