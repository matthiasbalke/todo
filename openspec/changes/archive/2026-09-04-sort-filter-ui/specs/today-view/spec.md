## MODIFIED Requirements

### Requirement: Today supports applicable list preferences
The Today page SHALL support Today-specific sorting, filtering, collapsed sections, and Hide checked behavior using a dedicated per-user local preference key. The Today page SHALL display a compact summary near the rendered items with item count and active sort order, and SHALL add filter-clearing controls to that summary when filters are active. Today item ordering SHALL be determined by Today-specific sort preferences rather than each source list's individual item sorting.

#### Scenario: User selects sorting
- **WHEN** the user selects an applicable non-manual regular-list sort field and direction
- **THEN** the sort is applied within each source-list category

#### Scenario: Today initial render uses Today sorting
- **WHEN** the user opens Today with saved Today sort preferences
- **THEN** items within each source-list category are displayed using the saved Today sort field and direction
- **AND** source-list item ordering does not override the Today sort preference

#### Scenario: Today default sorting is independent from source lists
- **WHEN** the user opens Today without saved Today sort preferences
- **THEN** items within each source-list category are displayed using the Today default sort
- **AND** different default sort settings on source lists do not change the Today item order

#### Scenario: User filters Today
- **WHEN** the user selects an applicable regular-list filter such as Starred only
- **THEN** it is applied within the fixed Today qualification predicate

#### Scenario: Fixed predicate controls are rendered
- **WHEN** the Today filter menu is opened
- **THEN** controls that would contradict or redundantly restate assignment-to-me and due-on-or-before-today are not offered
- **AND** manual drag-and-drop sorting is not offered

#### Scenario: Hide checked is a Today filter
- **WHEN** the Today filter menu is opened
- **THEN** Hide checked is presented with the other Today filter controls
- **AND** enabling Hide checked contributes to the active filter count and displays a filter chip in the summary

#### Scenario: Today filter can be reset from the summary
- **WHEN** a user activates the clear control for one active Today filter in the summary
- **THEN** only that filter is reset to its default inactive value
- **AND** other active filters, sort field, sort direction, and collapse preferences remain unchanged

#### Scenario: Today sort order can be changed from the summary
- **WHEN** a user opens Today
- **THEN** the Today view displays the active sort field and direction near the rendered items
- **AND** the user can open or invoke Today sort selection directly from that summary control without first opening the Today options menu
- **AND** that selection allows changing both the Today sort field and ascending/descending direction

#### Scenario: Today preferences are revisited
- **WHEN** the same user returns to Today on the same device
- **THEN** their Today sort, filter, Hide checked, and collapse preferences are restored
- **AND** the summary reflects the restored active filters, sort field, and sort direction before the user changes them
