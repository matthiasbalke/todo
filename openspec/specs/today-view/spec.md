# today-view Specification

## Purpose
TBD - created by archiving change today-view. Update Purpose after archive.
## Requirements
### Requirement: Today includes assigned due and overdue items
The Today query SHALL include an item when the current user is assigned to it, the current user has at least viewer membership in its source list, and its due date is on or before the current calendar date in the user's persisted timezone.

#### Scenario: Assigned item is due today
- **WHEN** an item is assigned to the current user and its due date equals the user's current calendar date
- **THEN** the item is included in Today

#### Scenario: Assigned item is overdue
- **WHEN** an item is assigned to the current user and its due date is before the user's current calendar date
- **THEN** the item is included in Today

#### Scenario: Item does not qualify
- **WHEN** an item is unassigned, assigned only to another user, undated, due in the future, or belongs to a list the current user cannot read
- **THEN** the item is excluded from Today

#### Scenario: Users are in different timezones
- **WHEN** the same instant falls on different calendar dates in two users' persisted timezones
- **THEN** each user's Today qualification uses that user's local calendar date

### Requirement: Completed qualifying items remain in Today
Today SHALL include both incomplete and completed items that satisfy the qualification predicate.

#### Scenario: User completes an item in Today
- **WHEN** an editable incomplete item is completed from Today
- **THEN** it remains in Today
- **AND** it moves to the checked subsection of its source-list category
- **AND** it can be reopened from the same view

#### Scenario: Completed item is initially loaded
- **WHEN** a completed item still satisfies the assignment, access, and due-date predicate
- **THEN** it is returned and displayed in Today

#### Scenario: Checked items are hidden
- **WHEN** the user enables Hide checked
- **THEN** completed qualifying items are hidden without being removed from the Today result

### Requirement: Today is the first overview entry
When enabled, Today SHALL appear above all user-defined list groups on the list overview and SHALL not participate in list or group drag-and-drop.

#### Scenario: Today is enabled
- **WHEN** the user opens the list overview with Today enabled
- **THEN** Today is displayed before the first list group
- **AND** it cannot be reordered or assigned to a group

#### Scenario: Today is disabled
- **WHEN** the user opens the list overview with Today disabled
- **THEN** no Today entry is displayed

### Requirement: Overview count represents unfinished work
The Today overview entry SHALL show the number of incomplete items that currently satisfy the Today predicate.

#### Scenario: Qualifying items include completed items
- **WHEN** Today contains three incomplete and two completed qualifying items
- **THEN** the overview count is three

#### Scenario: No unfinished items qualify
- **WHEN** all qualifying Today items are completed or no items qualify
- **THEN** the overview count is zero

### Requirement: Today groups by source list and category
The Today page SHALL group items first by source list and then by the item's source-list category.

#### Scenario: Items originate from multiple lists
- **WHEN** qualifying items originate from more than one source list
- **THEN** each source list has a distinct labeled group
- **AND** the source-list label links to its regular list view

#### Scenario: Source list contains multiple categories
- **WHEN** qualifying items in a source list belong to different categories
- **THEN** they are separated using their source category names, colors, and category order
- **AND** uncategorized items use an Uncategorized section

#### Scenario: Source-list groups are ordered
- **WHEN** the Today page displays multiple source lists
- **THEN** their order matches the user's list overview group and list ordering
- **AND** ungrouped source lists follow grouped source lists

#### Scenario: Category contains completed items
- **WHEN** a source-list category contains incomplete and completed qualifying items
- **THEN** incomplete items appear first
- **AND** completed items appear in the category's checked subsection using regular-list behavior

### Requirement: Today supports applicable list preferences
The Today page SHALL support Today-specific sorting, filtering, collapsed sections, and Hide checked behavior using a dedicated per-user local preference key.

#### Scenario: User selects sorting
- **WHEN** the user selects an applicable non-manual regular-list sort field and direction
- **THEN** the sort is applied within each source-list category

#### Scenario: User filters Today
- **WHEN** the user selects an applicable regular-list filter such as Starred only
- **THEN** it is applied within the fixed Today qualification predicate

#### Scenario: Fixed predicate controls are rendered
- **WHEN** the Today filter menu is opened
- **THEN** controls that would contradict or redundantly restate assignment-to-me and due-on-or-before-today are not offered
- **AND** manual drag-and-drop sorting is not offered

#### Scenario: Today preferences are revisited
- **WHEN** the same user returns to Today on the same device
- **THEN** their Today sort, filter, Hide checked, and collapse preferences are restored

### Requirement: Today item actions respect source-list capabilities
Today SHALL use each item's source-list capabilities to determine which item actions are available.

#### Scenario: Item originates from an editable list
- **WHEN** an item belongs to a source list where the user can edit items
- **THEN** completion, reopening, starring, deletion, and item-detail editing remain available

#### Scenario: Item originates from a viewer list
- **WHEN** an item belongs to a source list where the user has viewer access
- **THEN** item state is presented read-only according to `viewer-read-only-list-ui`

#### Scenario: Mixed permissions are displayed
- **WHEN** one Today page contains items from editable and viewer-only source lists
- **THEN** each item independently uses its source-list capability

### Requirement: Today does not create or manage source structures
The Today page SHALL NOT expose item creation or source-list and source-category mutation controls.

#### Scenario: User opens Today
- **WHEN** Today is displayed
- **THEN** no add-item action is available
- **AND** no list or category rename, configuration, deletion, or reorder action is available

#### Scenario: User wants to manage a source list
- **WHEN** the user follows a source-list link
- **THEN** management actions are available only from the regular list view and according to source-list capabilities

### Requirement: Today refreshes without cross-list live events
Today data and its overview count SHALL refresh on initial load and when the application returns to visible state, without requiring cross-list SSE subscriptions.

#### Scenario: List overview loads
- **WHEN** the user opens the list overview
- **THEN** the unfinished Today count is fetched

#### Scenario: Today page loads
- **WHEN** the user opens Today
- **THEN** qualifying items and their current completion states are fetched

#### Scenario: Application regains visibility
- **WHEN** the application becomes visible after being hidden
- **THEN** the visible Today page or list-overview count is refreshed

#### Scenario: External item change occurs while visible
- **WHEN** another user changes a qualifying item and no local refresh trigger occurs
- **THEN** Today is not required to update immediately through SSE

### Requirement: Local item actions update Today counts
Successful item actions performed from Today SHALL immediately update the visible item state and relevant unfinished and checked counts, with backend reconciliation.

#### Scenario: User completes an item
- **WHEN** an editable incomplete Today item is successfully completed
- **THEN** the unfinished count decreases
- **AND** the checked count increases
- **AND** the item remains visible unless Hide checked is enabled

#### Scenario: User reopens an item
- **WHEN** an editable completed Today item is successfully reopened
- **THEN** the unfinished count increases
- **AND** the checked count decreases
- **AND** the item returns to its unfinished position

#### Scenario: Completion fails
- **WHEN** an optimistic completion or reopening request fails
- **THEN** the previous item state and counts are restored

#### Scenario: User deletes an item
- **WHEN** an editable Today item is successfully deleted
- **THEN** it is removed
- **AND** the corresponding unfinished or checked count is updated

### Requirement: Recurring items qualify independently
Completing a recurring item from Today SHALL retain the completed occurrence and SHALL display any generated occurrence only when the generated item independently satisfies the Today predicate.

#### Scenario: Generated occurrence is in the future
- **WHEN** completion creates a replacement whose due date is after the user's current date
- **THEN** the completed occurrence remains in Today
- **AND** the replacement is not displayed

#### Scenario: Generated occurrence is still due or overdue
- **WHEN** completion creates a replacement whose due date is on or before the user's current date
- **THEN** both the completed occurrence and qualifying replacement are displayed
- **AND** counts reflect both occurrences

### Requirement: Disabled and empty states are explicit
Today SHALL provide deterministic behavior when disabled or when no items qualify.

#### Scenario: Disabled user opens Today directly
- **WHEN** a user with Today disabled navigates directly to `/today`
- **THEN** the application redirects to `/lists`

#### Scenario: No items qualify
- **WHEN** Today is enabled but no items satisfy the predicate
- **THEN** the page displays `No items due today or overdue.`

#### Scenario: Source-list access is removed
- **WHEN** the current user loses access to a source list
- **THEN** items from that list are absent after the next Today fetch

