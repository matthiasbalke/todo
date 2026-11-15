# Batch item editing

## Purpose

Allow editable list members to change selected properties of multiple items in one list safely, with explicit selection and synchronized results.

## ADDED Requirements

### Requirement: Explicit selection in a real list
The standard list view SHALL offer owners and editors a batch selection mode with individually labeled selection controls, selected count, select-visible, clear-selection, and cancel actions. Selection SHALL be distinct from completion and support mouse, touch, and keyboard.

#### Scenario: Select several items
- **WHEN** an editor enters selection mode and selects two items
- **THEN** both items are selected and the count is two
- **AND** neither item's completion state changes
- **AND** drag, completion, star, delete, and detail navigation interactions on selectable rows are suspended until selection mode ends

#### Scenario: Viewer opens list
- **WHEN** a viewer opens a standard list
- **THEN** no batch edit entry point is available

### Requirement: Selection respects current visibility
Select-visible SHALL select only currently rendered items, including expanded checked sections. Filter changes or collapsed sections SHALL preserve explicitly selected items. The UI SHALL show total selected and hidden counts; select-visible SHALL add to existing selection. Navigation to another list, leaving selection mode, or loss of edit capability SHALL clear selection.

#### Scenario: Hidden items are excluded
- **WHEN** an editor selects visible items with filters and collapsed groups active
- **THEN** hidden or collapsed items are not selected
- **AND** a selected item removed by a live deletion is removed from selection

#### Scenario: Change filters or collapse a group
- **WHEN** an editor hides a selected item through filtering or collapsing its group
- **THEN** the item stays selected and batch changes still apply to it
- **AND** the UI indicates how many selected items are hidden

#### Scenario: Add visible items to selection
- **WHEN** an editor uses select-visible with earlier selections hidden
- **THEN** visible items are added and earlier selections remain selected

### Requirement: Independent scalar field operations
The batch editor SHALL provide unchanged, set, and clear operations independently for due date, category, and recurrence. All fields SHALL initially be unchanged even when selected items have differing values. Dates SHALL use calendar-date semantics and recurrence SHALL use existing validation and weekday rules.

#### Scenario: Set and clear properties
- **WHEN** an editor sets a due date and clears category for selected items while leaving recurrence unchanged
- **THEN** every selected item receives that calendar date and no category
- **AND** each item's original recurrence is preserved
- **AND** unselected items and unrelated properties remain unchanged

#### Scenario: Clear recurrence
- **WHEN** an editor clears recurrence on selected items
- **THEN** their recurrence rules become null without creating or deleting occurrences

#### Scenario: Set custom recurrence
- **WHEN** an editor applies every two weeks on Monday and Thursday to selected items
- **THEN** all selected items retain the full rule without changing completion or existing successor items

### Requirement: Assignment changes preserve other users
The batch editor SHALL support unchanged assignments, adding selected current list members, removing selected current list members, replacing all assignees with a chosen nonempty member set, and clearing all assignments. Adding SHALL be idempotent and removing SHALL preserve other assignments. The same user SHALL NOT be both added and removed in one request.

#### Scenario: Assign and unassign a member
- **WHEN** an editor adds member A and removes member B from items with different assignees
- **THEN** all selected items contain A and do not contain B
- **AND** other assignees are preserved

#### Scenario: Clear assignments
- **WHEN** an editor chooses clear all assignments
- **THEN** every selected item has no assignees

### Requirement: Batch requests are authorized and atomic
The batch write API SHALL require editor or owner membership and a nonempty set of distinct item IDs belonging to the requested list. It SHALL validate all IDs, categories, assignees, and values before mutation. Unauthorized, missing, cross-list, malformed, empty-operation, or conflicting-operation requests SHALL leave every item unchanged and publish no events.

#### Scenario: Mixed valid and invalid targets
- **WHEN** a batch contains a valid item and a missing or other-list item
- **THEN** the entire request fails without item mutations or events

#### Scenario: Invalid changes
- **WHEN** a batch supplies an invalid date or recurrence, another list's category, a non-member assignee, duplicate item IDs, no changes, or conflicting assignment operations
- **THEN** it fails with HTTP 400 without applying any changes

#### Scenario: Unauthorized caller
- **WHEN** a viewer or non-member submits a batch
- **THEN** it is rejected before any items are changed

### Requirement: Submission and failure retain useful state
The editor SHALL show selected count and intended changes, disable Apply without selected items or valid operations, and prevent duplicate submission while pending. Cancel SHALL make no writes. Success SHALL update item state and exit selection mode. Failure SHALL retain the draft and surviving selection, show an actionable error, and avoid claiming success or queuing partial offline writes.

#### Scenario: Apply fails
- **WHEN** a batch request fails or connectivity is unavailable
- **THEN** the editor remains open with its draft and surviving selection
- **AND** no local success state is applied

#### Scenario: Apply succeeds
- **WHEN** the server confirms a batch
- **THEN** returned item values are merged into the list and selection mode ends
- **AND** active grouping, filtering, and sorting are reapplied

### Requirement: Committed changes synchronize list subscribers
Successful batches SHALL return updated items with complete recurrence and assignee values, update audit metadata for changed items, and notify subscribers of the affected list only after commit. Other lists SHALL receive no batch notifications.

#### Scenario: Another client observes batch
- **WHEN** a batch commits changes in a shared list
- **THEN** connected list clients receive the changed items through existing item-updated events
- **AND** rollback produces no item-updated events

### Requirement: Replacement sets exactly the chosen assignees
The batch editor SHALL offer Replace assignees with a member picker and explain that existing assignees will be removed. Replacement SHALL assign exactly the chosen nonempty member set to every selected item.

#### Scenario: Replace everyone with Alex
- **WHEN** an editor replaces assignees with Alex on selected items
- **THEN** Alex is their only assignee regardless of prior assignments
- **AND** unselected items retain their assignments

### Requirement: Recurrence edits affect selected occurrences only
Batch edits SHALL change only selected occurrences, including completed occurrences. Existing successor and historical items SHALL remain unchanged unless selected explicitly.

#### Scenario: Edit completed occurrence
- **WHEN** an editor changes recurrence on a selected completed item with an existing open successor
- **THEN** only the selected completed item changes and the successor retains its schedule

### Requirement: Batch identity prevents duplicate execution
Each batch SHALL have a client-generated ID bound to its initiator, list, and request. Repeating the same request and ID SHALL apply at most once and return its existing state or result. Reusing an ID with different content SHALL be rejected.

#### Scenario: Retry after response loss
- **WHEN** a client retries a committed batch with its original ID and payload
- **THEN** the server returns the recorded outcome without applying changes again

### Requirement: Batch outcome can be queried
The initiating user with current list authorization SHALL be able to query a batch ID for pending, succeeded, or failed status. Success SHALL be recorded atomically with changes. Unknown IDs SHALL NOT be presented as failure. Pending operations SHALL recover after server interruption without duplicate execution.

#### Scenario: Lost confirmation
- **WHEN** a batch response is lost
- **THEN** the client retains its ID and queries status without a page refresh
- **AND** it shows checking or pending until a definitive outcome is available

#### Scenario: Restricted status access
- **WHEN** another user or a caller without current list authorization queries a batch
- **THEN** its outcome and item data are not disclosed

### Requirement: Item versions prevent stale state
Every actual item mutation, including assignment changes, SHALL advance its version atomically. All item reads, write responses, batch results, and live updates SHALL carry the version. Clients SHALL ignore older versions and treat equal versions idempotently.

#### Scenario: Older batch result arrives last
- **WHEN** an older batch response arrives after a newer SSE item update
- **THEN** the client retains the newer item data

#### Scenario: Assignments change
- **WHEN** only an item's assignees change
- **THEN** its version advances and every item response path retains the version

### Requirement: Deleted items cannot reappear from delayed data
Item deletion SHALL provide a terminal version and clients SHALL retain deletion knowledge when merging delayed responses or live events.

#### Scenario: Delayed result for deleted item
- **WHEN** a batch result or earlier list response arrives after the item's deletion event
- **THEN** the client does not recreate the deleted item
