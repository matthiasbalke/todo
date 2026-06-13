## 1. Prerequisite And Persistence

- [ ] 1.1 Complete and archive `viewer-read-only-list-ui`, verifying capability-aware item rendering is available for reuse
- [ ] 1.2 Add a database migration for `time_zone`, `time_zone_initialized`, and `today_view_enabled` user fields with the specified existing/new-user defaults
- [ ] 1.3 Add the user-scoped item-assignment index needed by Today queries
- [ ] 1.4 Extend the backend user entity and profile DTO mapping with the persisted preference fields

## 2. TimezonePicker Component

- [ ] 2.1 Implement timezone option generation, browser-detected fallback handling, and friendly IANA labels
- [ ] 2.2 Implement shared `TimezonePicker` by composing `Select` with bindable selection, disabled state, labeling, and selection callbacks
- [ ] 2.3 Add TimezonePicker component tests for IANA values, friendly labels, selection, shared Select behavior, disabled state, and enumeration fallback
- [ ] 2.4 Add TimezonePicker examples and API guidance to the development component showcase

## 3. User Preference APIs And Initialization

- [ ] 3.1 Add an authenticated preference update endpoint that validates timezones with `ZoneId` and persists timezone initialization and Today visibility
- [ ] 3.2 Add backend integration tests for profile preference defaults, valid updates, invalid timezone rejection, and explicit UTC selection
- [ ] 3.3 Add frontend user preference API types/store state and initialize uninitialized accounts from the browser timezone or UTC during authenticated app startup
- [ ] 3.4 Add account-page TimezonePicker and Today enable/disable controls with save, error, and persisted-state behavior
- [ ] 3.5 Add frontend tests proving first-use initialization is one-time and later explicit timezone choices are preserved

## 4. Today Backend

- [ ] 4.1 Implement a shared Today qualification query using current-user assignment, readable-list membership, due date, and the user's timezone-derived current date
- [ ] 4.2 Implement the enriched Today item response with source-list role/order metadata, source-category metadata, and assigned-user display data
- [ ] 4.3 Implement the unfinished Today count endpoint using the same qualification predicate plus incomplete state
- [ ] 4.4 Add backend integration tests for due-today, overdue, future, undated, unassigned, other-user, completed, viewer-list, inaccessible-list, and timezone-boundary cases
- [ ] 4.5 Add backend tests proving item results and unfinished count remain consistent and removed list access excludes items

## 5. Today Frontend Structure

- [ ] 5.1 Add Today API types, store loading, unfinished-count loading, and mapping to capability-aware item models
- [ ] 5.2 Add per-user Today preference persistence for non-manual sorting, applicable filters, Hide checked, and source-list/category collapse state
- [ ] 5.3 Add the fixed Today overview entry above list groups, including unfinished count, enabled-state gating, and exclusion from drag-and-drop
- [ ] 5.4 Add the `/today` route with disabled-user redirect and the specified empty state
- [ ] 5.5 Group Today entries by source-list overview order and source-category order, with source-list navigation links and regular checked subsections
- [ ] 5.6 Add applicable regular-list sorting/filtering controls while excluding manual ordering and redundant assignment/due-date filters

## 6. Today Interactions And Refresh

- [ ] 6.1 Reuse source-list capabilities per item so editable and viewer-only items render correctly together
- [ ] 6.2 Support completion, reopening, starring, deletion, and detail navigation without exposing item creation or list/category management
- [ ] 6.3 Reconcile completion, reopening, deletion, checked counts, and unfinished overview count immediately, restoring prior state on failure
- [ ] 6.4 Re-fetch affected Today data after recurring completion so independently qualifying replacement occurrences appear
- [ ] 6.5 Refresh the list-overview count and visible Today data on initial load and visibility regain without opening cross-list SSE connections
- [ ] 6.6 Refresh Today data and count after a successful timezone change

## 7. Verification And Documentation

- [ ] 7.1 Add frontend component/page tests for grouping, ordering, completed-item retention, preferences, empty/disabled states, mixed permissions, and count updates
- [ ] 7.2 Add end-to-end coverage for enabling/disabling Today, timezone selection, overview count, completing/reopening items, viewer-source items, and source-list navigation
- [ ] 7.3 Run backend tests, frontend checks and tests, and the relevant end-to-end suite
- [ ] 7.4 Document Today and timezone behavior in project feature documentation and update `MEMORY.md`
