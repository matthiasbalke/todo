## Context

See `proposal.md` for motivation. The frontend already has shared controls for buttons, text input, textarea, select/category/date picking, and domain-specific completion/star toggles. `ItemForm` currently submits the full item object, preserves new-item drafts, auto-focuses the title, cancels new-item entry on external focus loss, and renders audit metadata for existing items.

The change is frontend-only. Existing business behavior for list/group creation, item submission, item draft recovery, date/category/recurrence/assignee selection, and audit metadata must remain intact.

## Goals / Non-Goals

**Goals:**
- Make toolbar/back/menu icon sizing consistent without spreading per-consumer visual overrides.
- Standardize functional UI icons on Lucide SVG components for a coherent visual language.
- Keep list overview creation action and list-group header changes local to the overview UI.
- Rework `ItemForm` into stable, icon-led rows while preserving the current form state model and submission shape.
- Replace `ItemForm`'s bespoke assignee chips with a reusable multi-select component based on existing select/combobox patterns.
- Reuse existing completion/star toggles in `ItemForm` and extend their component API only if needed for row/title layout.
- Provide fullscreen note editing as a form interaction that does not trigger new-item focus-out cancellation.
- Add the multi-select to the components page and make the components page easier to navigate with section anchors and sidebar navigation.
- Cover the updated UI behavior with focused component and route tests.

**Non-Goals:**
- No backend API, persistence, auth, SSE, or Docker changes.
- No change to list/category/item authorization rules.
- No broad redesign of filters, sorting, item cards, account screens, or the component showcase beyond what is needed to support the changed controls.
- No new third-party UI dependency beyond `@lucide/svelte` for the selected icon system.

## Decisions

1. Extend shared components instead of styling individual consumers.

   `Button`, `CompletionToggle`, `StarToggle`, `Textarea`, and existing picker/select components should receive narrowly scoped props or variants when the current API cannot express the desired UI. This keeps the semantic styling guard meaningful and prevents `ItemForm` from accumulating one-off visual utility classes.

   Alternative considered: style `ItemForm` directly with consumer classes. That is faster initially but conflicts with the project’s shared-component adoption direction and makes later consistency checks weaker.

2. Keep item form state as the single source of truth.

   Add local form state for pending `done` and `starred` values initialized from the item, draft, or defaulting to false for new items. Include these values in `ItemFormDraft` so new-item draft preservation does not lose pending state. The completion and star controls update this pending form state, and submission includes those values in the existing item payload.

   Alternative considered: call item mutation endpoints immediately from the edit form. That would make edit-form state harder to reason about, would not work cleanly for new items, and would introduce unnecessary API behavior.

3. Treat fullscreen notes as a modal editor over the same draft value.

   The form keeps `notes` as the canonical saved form value. Opening the fullscreen editor copies `notes` into a modal draft. Saving commits the modal draft back into `notes`; canceling discards the modal draft. The modal should trap focus, return focus to the notes row/editor trigger on close, and be marked as an internal form interaction so focus-out cancellation does not close a new-item form. The editor should not support backdrop dismissal, because accidental loss of note edits would be too easy. The editor chrome should use a top bar with a left `ChevronLeft` icon followed by `Cancel`, centered `Notes` title text, and a right-aligned `Save` action rendered as whichever button/link treatment best matches the global app action style. On desktop, the editor surface should never be wider than the regular list content column; on mobile, it should use the available viewport with safe-area-aware spacing.

   Alternative considered: expand the inline textarea to viewport height in place. That avoids modal focus handling but risks layout jumps inside compact list views and does not provide a true fullscreen editing surface on mobile.

4. Use plain text ellipsis for note previews.

   The inactive notes row should display only the first 160 characters from the note value, with the 160 value defined as a single component-level constant so it can be changed after visual review. Do not normalize whitespace or newlines for the first implementation; show how the raw note preview looks and revisit formatting if it reads poorly. When the note exceeds that length, append `...` so the visible row always communicates that more text exists. When notes have content, show a subtle `open` cue below the preview text, aligned to the right edge of the notes row content area, so users can recognize the row as an entry point to the editor without making the cue look like a separate primary action. The complete notes value should be displayed only in the fullscreen editor opened from the notes row. Keep the full text in accessible editing surfaces and submitted values unchanged so truncation is visual only.

   Alternative considered: rely only on CSS `text-overflow: ellipsis`. That can produce inconsistent truncation across responsive widths and does not guarantee the requested `...` suffix in tests.

5. Use Lucide for functional UI icons.

   Add `@lucide/svelte` and use Lucide SVG components for functional UI icons. Back, menu, close, check/save, cancel, delete, edit, expand/collapse, drag, star, completion, date, recurrence, category, assignee, notes, and list-action icons should come from the same icon system where an equivalent exists. Use Lucide `ChevronLeft` for back navigation, `Menu` for menu controls, `Circle` for unchecked completion/status indicators, `CircleCheck` for checked/completed indicators, `Plus` before the `new list` creation label, `Group` for list group creation and list group labels, `ChevronDown` for expanded group/category sections, and `ChevronUp` for collapsed group/category sections. Prefer outline Lucide icons; active state may use color, stroke weight, or fill only where the icon remains visually coherent, such as a starred state.

   Text glyphs and emoji should not be used as functional control icons when Lucide has an equivalent. Emoji remain valid as user/list content, such as list emoji selected by users. Existing PWA/app image assets remain valid as app assets.

   Add a shared app `Icon` component backed by a curated icon registry. Consumers should use semantic app icon names such as `back`, `menu`, `status`, `done`, `plus`, `group`, `expand`, and `collapse`; the registry maps those names to explicit per-icon Lucide imports such as `@lucide/svelte/icons/chevron-left` so tree-shaking remains predictable. Avoid wildcard or dynamic package-wide Lucide imports. Direct Lucide imports outside the registry should be rare, documented component-owned exceptions.

   Back and menu buttons should use the shared `Button` icon appearance or a small shared toolbar/icon-button wrapper if the existing API cannot express stroke width, icon size, and touch target consistently. Define shared named sizing presets for Lucide visual size, stroke width, and icon-only touch target size so visual tuning can happen in one place. Initial values should be: normal inline/action icons at 18px with default 2px stroke, compact metadata/status icons at 14px or 16px, standard icon-only controls at a 40px square touch target, compact icon-only controls at a 32px square touch target, header/navigation icons at 24px with a 44px square touch target and 2.5px to 3px stroke, and item completion/status icons at 22px or 24px with a stronger 2.5px stroke. Components should consume these presets through the shared `Icon` component and related button/icon-button styling instead of scattering literal Lucide `size` or `strokeWidth` values.

   Alternative considered: update each back/menu instance separately. That is more error-prone and would likely drift as screens change.

   Alternative considered: use icon fonts. SVG components are a better fit here because they avoid font loading failure modes, preserve component-level accessibility, and can be tree-shaken to only imported icons.

   List group headers should visually communicate group meaning by placing the `Group` icon before each group name. Their expand/collapse indicator should move to the right edge of the row, matching category section headers. Category, group, and checked-items section headers should all use `ChevronDown` and `ChevronUp` for open/closed state so the same disclosure language is used throughout the list UI.

6. Build assignee selection on a reusable multi-select.

   Add a `MultiSelect` component that extends the existing `ComboboxPrimitive` interaction foundation for filtering, keyboard navigation, popover behavior, and accessible labeling, while allowing multiple selected values. Keep the primitive responsible for popover mechanics, filtering, focus movement, Escape/focus-out dismissal, and option navigation; keep `MultiSelect` responsible for selected-array state, toggle semantics, selected-value rendering, and emitting the complete selected array. Selecting an option should keep the option list open so users can choose multiple values efficiently. Activating an already-selected option should unselect it. Escape and focus-out/blur should close the option list without changing selected values. `ItemForm` should use it for assignees instead of local chip-only field markup. The assignee usage should render each user with an avatar before the display name in both options and selected values. The avatar can use the app's current fallback pattern: first initial in a small colored circle.

   Alternative considered: keep assignee chips inside `ItemForm`. That keeps the immediate change smaller but leaves a domain-specific field where a reusable component is clearly emerging.

   Alternative considered: build a separate multi-select primitive beside `ComboboxPrimitive`. For now, extending `ComboboxPrimitive` is preferred so the existing select/combobox interaction behavior remains the foundation and the new component only adds the minimum hooks needed for multi-selection, such as keeping the list open after selection and exposing multi-selected option state.

7. Treat components-page navigation as part of this overhaul.

   The components page is already large enough that adding another shared component makes linear scanning weaker. Add a section registry that drives both stable section `id` attributes and the navigation links. On desktop, use a sticky sidebar. On mobile, use a compact top or horizontally scrollable navigation treatment so the page remains usable without a permanent side rail.

   Alternative considered: add only a MultiSelect section. That would document the new component but miss the broader discoverability problem created by the growing component page.

8. Use a shared fixed action footer with display-edge breathing room.

   Add a `FixedActionFooter` component for bottom-pinned action surfaces such as the `/lists` list/group actions and the list-detail add-item footer. The main issue is not only the home-indicator safe area; on rounded mobile displays, action borders can feel too close to the physical left, right, and bottom display edges. The footer should therefore provide base horizontal padding and base bottom padding even when `env(safe-area-inset-bottom)` is zero, plus safe-area bottom padding when present. Its inner content should remain constrained to the regular app content width on larger screens.

   Pages using `FixedActionFooter` should reserve matching bottom scroll space so final list content can scroll above the footer. Expanded footer forms should be bounded and scrollable within the footer area rather than pushing controls into the display edge.

9. Implement in reviewable stages with hard checkpoints.

   This change should be implemented as a multi-step overhaul. Each implementation group should stop after its own focused verification so the result can be inspected and visually tuned before starting the next topic. For example, after the icon system is implemented and verified, do not continue directly into button/toggle implementation until the icon result has been reviewed. The checkpoints are part of the process because visual fit, sizing, and mobile ergonomics may need fine tuning before later work builds on those choices.

## Risks / Trade-offs

- Fullscreen editor focus handling regresses new-item auto-cancel behavior -> Add tests that open, edit, save, cancel, and close notes while asserting `oncancel` is not called for internal interactions.
- Borderless controls reduce visible affordance -> Preserve accessible names, placeholders, focus rings, row icons, and clear selected-value text.
- Larger notes preview can crowd compact forms -> Use stable responsive row sizing and a bounded preview height so actions remain visible on mobile.
- New toggle usage in `ItemForm` can duplicate immediate item-card behavior -> Keep form toggles as pending form state only; existing item cards continue to mutate immediately.
- Icon sizing changes may affect alignment in existing headers -> Prefer shared sizing variants and verify route/component tests for header and menu controls.
- Icon migration can leave mixed visual languages behind -> Add tests or inventory checks that reject functional text/emoji icons in changed UI areas when a Lucide equivalent exists.
- Multi-select can become too user-specific -> Keep the base component generic and expose snippets/render hooks for assignee avatars instead of hard-coding users.
- Components-page sidebar can drift from content -> Generate navigation from a local section list that also supplies section anchors.
- Fixed footer spacing can solve home-indicator overlap but still look cramped on rounded displays -> Include explicit base edge spacing in addition to safe-area insets.

## Migration Plan

Implement as a frontend UI change in one release. No data migration is needed. Rollback is a normal frontend revert because the backend contract and stored data remain unchanged.
