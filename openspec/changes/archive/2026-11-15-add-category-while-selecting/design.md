# Design

## Context

See proposal.md for motivation and the two delta specs for behavior. CategorySelect composes Select, which filters options and delegates keyboard, pointer, focus, and listbox behavior to ComboboxPrimitive. ItemForm binds a nullable category ID and autosaves existing items; QuickAddItemForm selects categories within an inline picker inside a detail dialog.

The existing POST category endpoint returns the persisted category DTO and requires at least EDITOR. CategoryService already publishes CategoryCreated. The category store supports ID-based upserts, but saveCategory currently returns void and uses a caller-supplied temporary ID only to choose its create branch. That temporary ID cannot be used for assignment.

## Goals / Non-Goals

**Goals:** Keep creation optional in the reusable picker; integrate with the existing capability, store, SSE, and item save flows; make asynchronous creation safe for focus and draft handling.

**Non-Goals:** Backend API changes, global category-name uniqueness, category color editing in the picker, automatic deletion of unused categories, or changing item submission rules.

## Decisions

### Optional callback with a returned category

Give CategorySelect an optional async creation callback that receives the trimmed name and returns a persisted Category. Its presence enables the action; callers supply it only when canManageCategories permits creation. Keep network calls and list permissions outside the presentation component, allowing isolated showcase examples and tests. Prefer explicit capability wiring from route consumers over inferring permissions from category data.

Add a category-store creation operation returning the server DTO mapped to Category and upserting it by ID. Reuse the existing API request; send color null and sortOrder one greater than the current maximum, using the existing category-management convention. Recheck capability when initiating the request; backend checks handle stale client permissions. Returning the server entity avoids guessing the new ID or waiting for SSE. Changing saveCategory's existing return contract is unnecessary.

### Creation participates in shared navigation

Extend Select with a narrow optional creation-action facility, keeping the action distinct from ordinary option values. CategorySelect supplies eligibility based on trimmed, case-insensitive exact name comparison and the label `+ Create "<name>"`. Existing filtered options precede creation. If no options match, creation is the first keyboard target and Enter activates it. If partial matches exist, Enter selects the first match unless the user navigates to creation. Preserve ordinary Select behavior for all consumers without creation enabled.

Do not fork keyboard handling in CategorySelect or replace the shared primitive. A separate button outside the listbox would make Enter and touch behavior inconsistent. A fake category ID emitted through normal selection would corrupt autosave and validation.

### Separate request state from selection

CategorySelect tracks attempted name, pending work, and error. Begin a single request on action activation, expose pending state, and prevent conflicting category changes and repeated creation while it runs. Keep the prior selected ID until success; then make the returned category available for label resolution and emit its real ID once through ordinary selection. Synchronize with the caller/store options by ID.

On failure preserve the previous selection and attempted name, display an accessible error, and allow retry. Preserve focus inside the form or detail dialog during creation; ordinary Select closure must not clear the name needed for retry. Quick-add closes its detail only after successful selection, while ItemForm follows its existing category autosave. Do not submit the item as a side effect of Enter on creation. If the picker is dismissed or unmounted during a request, the category may still be persisted; avoid late callbacks mutating a discarded draft or taking focus back.

### Name matching and duplicate policy

Suppress creation for whitespace-only input and exact names after trimming and case-insensitive comparison; retain existing duplicate-name choices by ID. This is a picker affordance, not a new database constraint. Concurrent users may create matching names; preserve existing backend behavior.

### Validation

Cover shared navigation and optional behavior, picker success/failure/pending state, store response/SSE deduplication, capability gating, and quick-add/item-edit integration. Add targeted Playwright flows for keyboard creation and pointer/touch activation with draft preservation and persisted assignment. Run frontend check, focused tests, and relevant existing tests. Before browser validation, derive the HTTPS origin and ports from .env.dev and check HTTPS health using .certs/cert.pem. Manage the Compose development stack directly, following AGENTS.md. Run frontend checks inside its container and backend integration tests directly with Java 21 and Docker/Testcontainers. No host watcher is required.

## Risks / Trade-offs

- Closing the primitive clears its query immediately → retain the attempted name separately and verify retry after rejection.
- Inline quick-add closes on selection and item forms handle focusout → defer selection until persistence succeeds and test both keyboard and pointer focus paths.
- SSE may arrive before or after the POST response → upsert by server ID and display the response category immediately.
- An item autosave can fail after category creation succeeds → keep the category and report the item save error through the existing flow; do not roll back shared list data.
- Dismissal during creation can leave a persisted unassigned category → allow that category to remain; guard late UI selection and focus changes.
- Matching names or sort positions can be created concurrently → retain existing semantics; server-side uniqueness and ordering serialization are outside this feature.

## Migration Plan

Ship as a frontend change using the existing backend contract. No schema or data migration is required. Reverting the frontend change removes the creation affordance; categories already created remain ordinary list categories.
