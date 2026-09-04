## ADDED Requirements

### Requirement: List views expose active filter and sort state
The standard list view and grocery list view SHALL display a compact summary near the rendered items with item count and active sort order, and SHALL add filter-clearing controls to that summary when filters are active.

#### Scenario: Active filters are visible outside the menu
- **WHEN** a user opens a standard list view or grocery list view with one or more active filters
- **THEN** the view displays each active filter in a compact summary near the rendered list items
- **AND** the user can identify that the visible item set is filtered without opening the list options menu

#### Scenario: Individual filters can be reset from the summary
- **WHEN** a user activates the clear control for one active filter in the summary
- **THEN** only that filter is reset to its default inactive value
- **AND** other active filters, sort field, and sort direction remain unchanged

#### Scenario: Hide checked is a filter
- **WHEN** a user opens the filter submenu
- **THEN** Hide checked is presented with the other filter controls
- **AND** enabling Hide checked contributes to the active filter count and displays a filter chip in the summary

#### Scenario: Sort order can be changed from the summary
- **WHEN** a user opens a standard list view or grocery list view
- **THEN** the view displays the active sort field and direction near the rendered list items
- **AND** the user can open or invoke sort selection directly from that summary control without first opening the list options menu
- **AND** that selection allows changing both the sort field and ascending/descending direction

#### Scenario: No filter clutter when defaults are active
- **WHEN** all filters are at their default inactive values
- **THEN** the summary does not display any filter-clearing controls
- **AND** the summary still displays the item count and active sort order without an empty or misleading filter indicator

#### Scenario: Summary matches persisted local preferences
- **WHEN** list filter or sort preferences are restored from local storage
- **THEN** the summary reflects the restored active filters, sort field, and sort direction before the user changes them
