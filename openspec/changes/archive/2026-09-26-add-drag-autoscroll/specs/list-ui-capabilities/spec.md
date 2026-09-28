## ADDED Requirements

### Requirement: Dragging near scroll boundaries auto-scrolls the active surface
The list UI SHALL automatically scroll the active scroll surface while a permitted drag operation is held near the top or bottom scroll boundary.

#### Scenario: App content area is the page-level scroll surface
- **WHEN** a signed-in user opens an app route such as `/lists` or a list detail page
- **THEN** the route content scrolls inside the app shell's main content area
- **AND** the header and bottom action surface remain stable app chrome outside that scroll movement

#### Scenario: Drag near bottom of content area scrolls down
- **WHEN** a signed-in user drags a list group, list card, or list item within an existing drag-enabled list UI and the pointer is held inside the bottom edge trigger area of the app content scroll surface
- **THEN** the app content area scrolls downward while the drag remains active and the content area can scroll further down

#### Scenario: Drag near top of content area scrolls up
- **WHEN** a signed-in user drags a list group, list card, or list item within an existing drag-enabled list UI and the pointer is held inside the top edge trigger area of the app content scroll surface
- **THEN** the app content area scrolls upward while the drag remains active and the content area can scroll further up

#### Scenario: Drag near dialog boundary scrolls the dialog body
- **WHEN** a signed-in user drags a category row in the category configuration dialog and the pointer is held near the top or bottom edge of that dialog's scrollable body
- **THEN** the dialog body scrolls in that direction while the drag remains active and the dialog body can scroll further
- **AND** the app content area does not scroll as the primary response to the dialog drag

#### Scenario: Content boundary starts page-level auto-scroll
- **WHEN** a permitted drag operation is active on a page-level drag surface
- **THEN** auto-scroll starts when the pointer enters the drag library's native top or bottom edge trigger area for the app content scroll surface
- **AND** no page-level auto-scroll starts only because the pointer is near the physical viewport edge outside the content scroll surface

#### Scenario: Cursor position drives edge detection
- **WHEN** a permitted drag operation moves a large draggable card near a scroll boundary
- **THEN** edge detection uses the pointer position rather than requiring the dragged card center to reach the boundary
- **AND** the dragged card remains visually stable instead of being recentered on the pointer solely for detection

#### Scenario: Auto-scroll stops after drag ends or leaves the edge
- **WHEN** the drag operation finalizes, is cancelled, leaves the active edge trigger area, or reaches the end of the scrollable surface in the requested direction
- **THEN** auto-scroll stops without continuing content-area or dialog movement

#### Scenario: Existing drag permissions remain authoritative
- **WHEN** a viewer or any user without the relevant drag capability opens a list UI
- **THEN** auto-scroll does not create a new way to drag, reorder, move, or mutate list data
