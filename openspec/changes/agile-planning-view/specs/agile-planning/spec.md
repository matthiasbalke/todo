# Spec Delta

## Purpose

Let users select accessible items into a personal Agile backlog and manually plan their execution sequence across source lists without changing shared item properties.

## ADDED Requirements

### Requirement: Selection belongs to the current user
Users SHALL be able to add or remove an existing accessible item from their personal Agile selection through item details and standard item cards. Selection SHALL be independent of assignments, stars, dates, and other users' selections and SHALL persist across sessions and devices.

#### Scenario: User selects an item
- **WHEN** a user selects an accessible item for Agile planning
- **THEN** an unfinished item appears at the end of that user's unfinished section, above checked items
- **AND** selecting it again does not duplicate or reposition it
- **AND** another user's selection and order remain unchanged

#### Scenario: Selection is removed and restored
- **WHEN** a user removes and later reselects an item
- **THEN** it is appended as a new selection
- **AND** removal does not delete the source item

#### Scenario: Existing items have no selection
- **WHEN** a user first uses Agile planning
- **THEN** their backlog is empty until they select items

### Requirement: Agile is a flat cross-list view
The authenticated `/agile` page SHALL display all personally selected accessible items in one manual sequence, regardless of source list, category, assignment, or due date. Each entry SHALL identify and link to its source list and item details. The page SHALL expose no item creation or source-list management controls.

#### Scenario: Items span lists and categories
- **WHEN** a user opens Agile with selections from different lists and categories
- **THEN** entries appear in their saved personal sequence without category or source-list grouping
- **AND** an undated item and an item assigned to someone else are included when selected

#### Scenario: No selections are available
- **WHEN** no selected accessible items exist
- **THEN** Agile displays an empty state explaining how to select items from source lists

#### Scenario: User inspects an item
- **WHEN** a user follows an Agile entry to item details and uses its return navigation
- **THEN** the user returns to Agile

### Requirement: Overview provides Agile navigation
When Agile is enabled, the list overview SHALL show a fixed Agile entry after Today when Today is enabled, and before user-defined groups otherwise. It SHALL show the count of selected accessible incomplete items and SHALL not participate in list or group reordering.

#### Scenario: Completed selections exist
- **WHEN** a user has Agile enabled with three incomplete and two completed accessible selections
- **THEN** the Agile overview count is three
- **AND** disabling Today does not hide Agile

### Requirement: Manual ordering is personal and persistent
Users SHALL be able to reorder their Agile backlog across source lists using mouse, touch, and keyboard. Saving SHALL preserve the exact resulting sequence across reloads and devices. Adding, removing, and reordering selections SHALL leave source-item fields, audit metadata, category order, and source-list manual order unchanged.

#### Scenario: User moves an entry across source boundaries
- **WHEN** a user moves an entry from the bottom above an entry from a different category or list
- **THEN** that personal sequence persists after reload
- **AND** both source items and other users' plans remain unchanged

#### Scenario: Unfinished entries are reordered
- **WHEN** a user reorders unfinished entries with or without Hide checked enabled
- **THEN** only slots occupied by unfinished entries are filled in the new order
- **AND** completed entries retain their saved planning slots
- **AND** toggling Hide checked does not change the saved sequence

#### Scenario: Item is reopened after unfinished entries are reordered
- **WHEN** the saved sequence is A, B, C, the user completes B, reorders unfinished entries to C, A, and reopens B
- **THEN** the unfinished sequence is C, B, A

### Requirement: Source permissions and personal planning are separate
Any current list member, including a viewer, SHALL be able to select, remove, and personally reorder items they can read. Completion, reopening, starring, editing, and deletion SHALL continue to require the source list's edit capability. APIs SHALL derive the planning owner from the authenticated session and reject inaccessible item references without partial writes.

#### Scenario: Viewer plans work
- **WHEN** a viewer selects and reorders an accessible item
- **THEN** the personal changes succeed
- **AND** source-item mutation controls remain unavailable
- **AND** the source-item mutation APIs continue to reject viewer writes

#### Scenario: Another user's data is targeted
- **WHEN** a user submits an inaccessible item or attempts to operate on another user's plan
- **THEN** the operation is rejected without changing any plan or revealing inaccessible item details

### Requirement: Completion preserves selection and sequence
Completing or reopening a selected item SHALL retain its personal selection and position. Agile SHALL display unfinished items first and checked items below them, preserving saved order within each section, and offer a per-user Hide checked preference. Duplicated items SHALL start unselected for all users.

#### Scenario: Item is completed
- **WHEN** an editable selected item is completed from Agile
- **THEN** it appears in the checked section while retaining its saved planning slot
- **AND** its unfinished count decreases
- **AND** Hide checked hides it without removing its selection

#### Scenario: Duplication creates an item
- **WHEN** a selected source item is duplicated
- **THEN** the duplicate starts unselected for all users
- **AND** the source occurrence retains its selection

### Requirement: Recurring occurrences inherit personal Agile selection
A new recurring occurrence SHALL inherit each user's Agile flag from its immediate parent at completion, regardless of the acting user or whether Agile is enabled. Inherited selections SHALL append after existing unfinished items and above checked items. The completed parent SHALL retain its selection and planning slot. Explicit removal SHALL affect only the acting user's selection of the targeted occurrence.

#### Scenario: Multiple users selected the recurring item
- **WHEN** a recurring occurrence selected by two users is completed by either user or another authorized member
- **THEN** the next occurrence is selected for both users and appended to each personal backlog
- **AND** users who did not select the completed occurrence receive no selection

#### Scenario: User removes the inherited selection
- **WHEN** a user explicitly removes the Agile flag from the newly created occurrence
- **THEN** that occurrence leaves only their personal backlog
- **AND** the completed occurrence and other users' selections remain unchanged
- **AND** completing the new occurrence does not pass a removed selection to its successor

#### Scenario: Immediate parent is unflagged before completion
- **WHEN** a user removes their Agile flag from a recurring occurrence before completing it
- **THEN** its next occurrence is not selected for that user, even if earlier ancestors were selected
- **AND** other users whose flag remains on the immediate parent still inherit their personal selections

#### Scenario: Inherited item is appended above checked work
- **WHEN** completing a selected recurring item generates its next occurrence and other unfinished selections exist
- **THEN** the new occurrence appears after all existing unfinished selections and above the checked section
- **AND** the completed parent appears in the checked section

#### Scenario: Agile is disabled when recurrence advances
- **WHEN** the next occurrence is created while a selecting user has Agile disabled
- **THEN** their selection is inherited and available when they re-enable Agile

### Requirement: Deleted and inaccessible items are excluded
Agile queries and counts SHALL enforce current membership. Deleted items SHALL lose their personal selections. Access loss SHALL hide selections immediately on the next fetch; selections retained during access loss SHALL return in their saved relative order if access is restored.

#### Scenario: Membership is removed and restored
- **WHEN** a user loses source-list membership and refreshes Agile
- **THEN** that list's items and counts are absent
- **AND** restoring membership makes retained selections available again

#### Scenario: Selected source item is deleted
- **WHEN** a selected item or its source list is deleted
- **THEN** subsequent Agile queries omit it for all affected users

### Requirement: Saves are atomic and failures are recoverable
Selection and reorder operations SHALL save atomically. Reorder requests containing duplicates, inaccessible entries, or a stale selection set SHALL be rejected. Concurrent valid changes SHALL serialize per user; the last successful reorder of the same selection set SHALL determine order. Failed optimistic changes SHALL restore confirmed state and offer an actionable error.

#### Scenario: Backlog changes in another session
- **WHEN** an older session submits a reorder after the selected accessible item set has changed
- **THEN** the request is rejected as stale without partial writes
- **AND** the client refreshes the backlog before another reorder

#### Scenario: A write fails
- **WHEN** a selection, reorder, or completion request fails
- **THEN** the UI restores the last confirmed selection, sequence, item state, and count as applicable
- **AND** it displays an error and permits retry

### Requirement: Refresh and account isolation are explicit
Agile data and overview counts SHALL refresh on initial load, when the application regains visibility, and after relevant successful local actions. Cross-list live events SHALL not be required. Personal frontend state SHALL be cleared when accounts change.

#### Scenario: Another device changes the plan
- **WHEN** the application becomes visible again
- **THEN** the visible Agile page or overview count reloads from the server

#### Scenario: User changes accounts
- **WHEN** one user signs out and another signs in
- **THEN** the previous user's Agile selections, counts, and cached item details are not displayed

### Requirement: Agile can be enabled per account
Agile SHALL be disabled by default for existing and new accounts. Account settings SHALL provide a persisted enable/disable toggle independent of other view preferences. Disabling SHALL preserve selections, order, and display preferences while hiding Agile navigation and selection controls and skipping automatic Agile data/count fetches. Direct navigation while disabled SHALL redirect to `/lists`.

#### Scenario: Default disabled
- **WHEN** an existing account receives the feature or a new account is created
- **THEN** Agile is disabled and its overview entry and selection controls are absent
- **AND** opening `/agile` redirects to `/lists`

#### Scenario: Enable and revisit
- **WHEN** a user enables Agile in account settings and later signs in on another device
- **THEN** Agile remains enabled and its navigation and selection controls are available
- **AND** other view preferences retain their values

#### Scenario: Disable and restore a plan
- **WHEN** a user disables Agile and later re-enables it
- **THEN** their saved selections, sequence, and display preferences are restored
- **AND** disabling does not alter source items or another user's preferences

#### Scenario: Preference save fails
- **WHEN** saving the Agile enable/disable preference fails
- **THEN** the toggle and feature visibility return to their last confirmed state
- **AND** the user receives an error and can retry
