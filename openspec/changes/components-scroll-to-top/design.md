## Context

See `proposal.md` for motivation. The existing mobile viewport behavior lives inside `ItemForm.svelte` as component-local pointer and focus listeners that use `window.visualViewport` and adjust the document scroller. `ListGroupSection.svelte` has a similar local rename-container helper. Shared components such as `TextInput`, `Textarea`, `Select`, `MultiSelect`, `CategorySelect`, `DatePicker`, and `EditableLabel` already own their focus and option-surface behavior, making them the right layer for reusable viewport positioning.

## Goals / Non-Goals

**Goals:**

- Centralize the scroll-to-visible-viewport behavior in a small frontend utility or Svelte action that shared components can reuse.
- Let shared components opt into the behavior by identifying the owning field/editor element to position, not by exposing duplicated consumer code.
- Preserve existing `ItemForm` behavior while replacing its local helper with the shared implementation where feasible.
- Keep nested option scrolling, focus return, autosave, and focus-out cancellation semantics unchanged.

**Non-Goals:**

- No backend, persistence, API, or data-model changes.
- No redesign of component presentation, validation, or dropdown positioning.
- No attempt to perfectly detect every virtual keyboard implementation; the behavior should use the existing visual-viewport approach with graceful fallback.

## Decisions

### Use a reusable Svelte action/utility for viewport positioning

Create a reusable helper in the frontend focus/viewport utilities that attaches `pointerdown` and `focusin` listeners to an owning element and scrolls that element near the top of the visible viewport. This matches the proven `ItemForm` approach while avoiding copy/paste across components.

Alternative considered: keep behavior in each component. That would satisfy the issue in the short term but would make later shared-component adoption brittle and inconsistent.

### Gate page repositioning to mobile-sized viewports

The helper should avoid unexpected page movement on desktop. A simple mobile viewport guard, combined with `visualViewport` support when available, keeps the behavior targeted at virtual-keyboard scenarios while falling back safely when `visualViewport` is absent.

Alternative considered: always reposition on focus. That risks surprising desktop users, especially when tabbing through forms.

### Scroll the owner surface, not nested options

Components with option surfaces should designate the field/editor container as the scroll target and ignore interactions inside nested listboxes or equivalent option panels for page-level repositioning. Internal option scrolling, such as active-option `scrollIntoView`, remains owned by the component.

Alternative considered: allow every focused nested element to trigger page repositioning. That can cause jitter while navigating options and can interfere with dropdown usability.

### Adopt behavior in shared controls first, consumers second

Add the shared action to primitive and composite controls that own editable or selectable focus: text inputs, textareas, shared select/combobox primitives, multi-select/category-select through their lower-level composed controls where possible, date picker trigger/editor surfaces, and editable labels. Then remove local duplicated helpers from consumers only when behavior remains identical.

Alternative considered: wrap large consumer sections such as forms. That would keep duplication out of individual fields but would not satisfy the issue's goal that custom components carry the behavior themselves where possible.

## Risks / Trade-offs

- Viewport detection differs across mobile browsers -> keep the helper defensive, use `visualViewport.offsetTop` when present, and retain a document-scroller fallback.
- Programmatic focus can trigger unwanted scrolling -> support opt-out or disabled behavior for components/workflows that focus controls without user interaction.
- Existing focus-out cancellation can be sensitive to pointer timing -> preserve capture-phase behavior and add regression tests around `ItemForm` and editable-label workflows.
- Dropdowns and calendars can jitter if the page scrolls during option navigation -> ignore nested option-surface interactions for page-level repositioning and keep internal option scrolling separate.

## Migration Plan

1. Add the shared mobile viewport positioning helper and focused unit coverage.
2. Adopt it in shared input/editor/select components, preferring lower-level primitives so composed components inherit the behavior.
3. Replace local `ItemForm` and similar duplicated helpers where behavior remains equivalent.
4. Run frontend type-check and targeted component tests, then expand to the affected frontend test suite if needed.
5. Rollback is limited to reverting the helper adoption; there are no persisted data or API migrations.
