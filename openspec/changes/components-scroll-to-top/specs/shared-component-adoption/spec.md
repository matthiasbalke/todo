## ADDED Requirements

### Requirement: Shared edit controls position themselves above mobile keyboards
Shared frontend controls that receive text entry, selection input, or custom editor focus SHALL position their owning control surface near the top of the visible viewport when the user touches or focuses them on a mobile-sized viewport.

#### Scenario: User focuses a shared edit control on mobile
- **WHEN** a user touches or focuses an enabled shared text-entry, textarea, select, multi-select, category-select, date-picker, editable-label, or similar custom editor control on a mobile-sized viewport
- **THEN** the owning field or editor surface is scrolled near the top of the visible viewport
- **AND** the focused control remains usable above the virtual keyboard

#### Scenario: User focuses a shared edit control on desktop
- **WHEN** a user focuses a shared edit control on a desktop-sized viewport
- **THEN** the control remains usable without unexpected page repositioning
- **AND** existing keyboard and pointer interaction behavior is preserved

#### Scenario: User interacts with a nested option surface
- **WHEN** a shared edit control displays a nested option surface such as a listbox or calendar grid
- **AND** the user moves through options inside that surface
- **THEN** option navigation keeps its existing internal scrolling behavior
- **AND** the page-level repositioning targets the owning field or editor surface rather than each nested option

#### Scenario: Existing item form behavior is preserved
- **WHEN** a user edits item title, category, due date, recurrence, assignees, starred state, completion state, or notes from the item form on mobile
- **THEN** the active edit surface is scrolled near the top of the visible viewport as before
- **AND** autosave, focus-out cancellation, dialog focus return, and draft preservation behavior are unchanged
