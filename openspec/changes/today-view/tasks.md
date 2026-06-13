## 1. Prerequisite And Persistence

- [x] 1.1 Complete and archive `viewer-read-only-list-ui`, verifying capability-aware item rendering is available for reuse
- [x] 1.2 Add a database migration for `time_zone`, `time_zone_initialized`, and `today_view_enabled` user fields with the specified existing/new-user defaults
- [x] 1.3 Add the user-scoped item-assignment index needed by Today queries
- [x] 1.4 Extend the backend user entity and profile DTO mapping with the persisted preference fields

## 2. TimezonePicker Component

- [x] 2.1 Implement timezone option generation, browser-detected fallback handling, and friendly IANA labels
- [x] 2.2 Implement shared `TimezonePicker` by composing `Select` with bindable selection, disabled state, labeling, and selection callbacks
- [x] 2.3 Add TimezonePicker component tests for IANA values, friendly labels, selection, shared Select behavior, disabled state, and enumeration fallback
- [x] 2.4 Add TimezonePicker examples and API guidance to the development component showcase

## 3. User Preference APIs And Initialization

- [x] 3.1 Add an authenticated preference update endpoint that validates timezones with `ZoneId` and persists timezone initialization and Today visibility
- [x] 3.2 Add backend integration tests for profile preference defaults, valid updates, invalid timezone rejection, and explicit UTC selection
- [x] 3.3 Add frontend user preference API types/store state and initialize uninitialized accounts from the browser timezone or UTC during authenticated app startup
- [x] 3.4 Add account-page TimezonePicker and Today enable/disable controls with save, error, and persisted-state behavior
- [x] 3.5 Add frontend tests proving first-use initialization is one-time and later explicit timezone choices are preserved

## 4. Today Backend

- [x] 4.1 Implement a shared Today qualification query using current-user assignment, readable-list membership, due date, and the user's timezone-derived current date
- [x] 4.2 Implement the enriched Today item response with source-list role/order metadata, source-category metadata, and assigned-user display data
- [x] 4.3 Implement the unfinished Today count endpoint using the same qualification predicate plus incomplete state
- [x] 4.4 Add backend integration tests for due-today, overdue, future, undated, unassigned, other-user, completed, viewer-list, inaccessible-list, and timezone-boundary cases
- [x] 4.5 Add backend tests proving item results and unfinished count remain consistent and removed list access excludes items

## 5. Today Frontend Structure

- [x] 5.1 Add Today API types, store loading, unfinished-count loading, and mapping to capability-aware item models
- [x] 5.2 Add per-user Today preference persistence for non-manual sorting, applicable filters, Hide checked, and source-list/category collapse state
- [x] 5.3 Add the fixed Today overview entry above list groups, including unfinished count, enabled-state gating, and exclusion from drag-and-drop
- [x] 5.4 Add the `/today` route with disabled-user redirect and the specified empty state
- [x] 5.5 Group Today entries by source-list overview order and source-category order, with source-list navigation links and regular checked subsections
- [x] 5.6 Add applicable regular-list sorting/filtering controls while excluding manual ordering and redundant assignment/due-date filters

## 6. Today Interactions And Refresh

- [x] 6.1 Reuse source-list capabilities per item so editable and viewer-only items render correctly together
- [x] 6.2 Support completion, reopening, starring, deletion, and detail navigation without exposing item creation or list/category management
- [x] 6.3 Reconcile completion, reopening, deletion, checked counts, and unfinished overview count immediately, restoring prior state on failure
- [x] 6.4 Re-fetch affected Today data after recurring completion so independently qualifying replacement occurrences appear
- [x] 6.5 Refresh the list-overview count and visible Today data on initial load and visibility regain without opening cross-list SSE connections
- [x] 6.6 Refresh Today data and count after a successful timezone change

## 7. Verification And Documentation

- [x] 7.1 Add frontend component/page tests for grouping, ordering, completed-item retention, preferences, empty/disabled states, mixed permissions, and count updates
- [x] 7.2 Add end-to-end coverage for enabling/disabling Today, timezone selection, overview count, completing/reopening items, viewer-source items, and source-list navigation
- [ ] 7.3 Run backend tests, frontend checks and tests, and the relevant end-to-end suite
- [x] 7.4 Document Today and timezone behavior in project feature documentation and update `MEMORY.md`
