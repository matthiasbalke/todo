# Tasks

## 0. Item versioning and durable batch tracking

- [ ] 0.1 Add additive migrations for item versions and durable batch records with initiator/list/request identity; verify upgrade from existing PostgreSQL data and document retention/recovery policy.
- [ ] 0.2 Advance item versions consistently across all mutation paths, including assignments, completion, reordering, category deletion, and batch edits; backend tests verify concurrency conflicts, no-op behavior, and versioned list/Today/detail/write/SSE payloads.
- [ ] 0.3 Add version-aware client ingestion and deletion tombstones across stores, reads, HTTP responses, and SSE; tests force older responses after newer events, deletion before delayed results, and full-load races.
- [ ] 0.4 Implement durable batch reservation, single execution ownership, atomic success recording, failure recording after rollback, and authorized status lookup; integration tests cover duplicate concurrent IDs, conflicting payloads, access isolation, and pending-operation recovery after interruption.
- [ ] 0.5 Implement client-generated batch IDs and status recovery with bounded backoff and offline pause; tests verify lost response, pending/succeeded/failed/not-found handling, same-ID retry, and no page refresh or duplicate execution.

## 1. Atomic backend batch contract

- [ ] 1.1 Add the dedicated PATCH batch request/response DTOs with explicit set/clear/modify/replace operations; integration-test omission, null/malformed operations, empty/duplicate IDs, and valid no-op requests through ItemIntegrationTest.
- [ ] 1.2 Implement list-scoped target loading, EDITOR authorization, category/list-member validation, date and recurrence validation before mutation; verify viewer/non-member rejection and mixed-list/missing-target atomic rejection with real PostgreSQL integration tests.
- [ ] 1.3 Apply scalar changes and assignment deltas in one transaction with stable target locking and preservation of unrelated fields; integration-test add/remove/replace/clear, existing assignments, all four fields, custom weekdays, audit metadata, and untouched titles/order/completion/occurrence links.
- [ ] 1.4 Publish immutable per-item payloads only after successful batch commit; verify payloads, list isolation, no-op suppression, and absence of events after validation or transaction failure in integration tests.

## 2. Frontend API and item state

- [ ] 2.1 Add typed batch request operations and API client method; test exact serialization of omitted versus set/clear fields and assignment deltas in items.test.ts.
- [ ] 2.2 Add a server-confirmed item-store batch action with no offline enqueue, complete recurrence mapping, and batch-ID status recovery; store tests verify returned-item merging, duplicate SSE upserts, rejection behavior, and preservation of unrelated items.

## 3. Selection in standard list view

- [ ] 3.1 Add canEditItems-gated batch entry point, local selection state, selected count, select-visible, clear, and cancel controls; route tests verify editor/owner access, viewer exclusion, and reset when navigating or losing capability.
- [ ] 3.2 Thread selection controls through CategoryGroup and ItemCard, suspending conflicting row actions and dragging; component tests verify independent selection without completion/navigation and mouse, keyboard, and touch interactions. Document new component props in the component README.
- [ ] 3.3 Preserve explicit selections across filters and collapsed sections, add visible IDs without clearing existing selection, display selected/hidden counts, and remove live-deleted IDs; route tests verify hidden selected items remain batch targets.

## 4. Batch editor and submission

- [ ] 4.1 Build BatchEditItemsDialog using existing date/category/recurrence/member controls with unchanged defaults, explicit set/clear, add/remove/replace/clear assignment controls, and a change summary; component tests cover mixed source values, custom recurrence weekdays, all operations, and invalid/conflicting selections.
- [ ] 4.2 Connect Apply/cancel/error handling to the batch store action; tests verify disabled empty submissions, one in-flight request, retained draft on failure, successful selection exit, and re-grouping after category changes.
- [ ] 4.3 Implement responsive dialog scrolling, accessible labels, focus containment/restoration, and Escape dismissal; verify keyboard behavior in component tests and mobile layout in Playwright. Document the batch editor's usage and operation semantics in the component README.

## 5. System validation

- [ ] 5.1 Add focused Playwright coverage for multi-item set/clear of all four properties, preservation of unselected/unmodified data, filters/collapse selection boundaries, viewer restrictions, cancel/error recovery, replacement assignments, completed-occurrence isolation, lost-confirmation status recovery, and a second browser receiving versioned SSE updates; run against healthy Compose with explicit BASE_URL and Mailpit configuration.
- [ ] 5.2 Run backend tests/build and frontend check, unit tests, and build using the repository validation workflow; resolve failures and record commands/results in implementation-notes.md.
- [ ] 5.3 Recheck issue #197 and every spec scenario against delivered behavior, run strict OpenSpec validation, inspect desktop/mobile behavior, and leave Compose running with its review URL recorded in implementation-notes.md.

## Workflow follow-up

- After implementation succeeds and the user reviews it, sync delta specs and archive the change.
