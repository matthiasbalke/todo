## Context

See `proposal.md` for motivation. The frontend already has shared controls for buttons, text input, textarea, select/category/date picking, and domain-specific completion/star toggles. `ItemForm` currently submits the full item object, preserves new-item drafts, auto-focuses the title, cancels new-item entry on external focus loss, and renders audit metadata for existing items.

The change is frontend-only. Existing business behavior for list/group creation, item submission, item draft recovery, date/category/recurrence/assignee selection, and audit metadata must remain intact.

## Goals / Non-Goals

**Goals:**
- Give all shared components one visual foundation so typography, colors, geometry, and interaction treatments can be tuned centrally.
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

- Central style changes affect many screens -> Inventory current roles and computed styles, migrate in stages, and review representative desktop and mobile states before tuning values.
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

### Shared style foundation

Extend the existing `controlStyles.ts` foundation into a layered system: shared theme values, named semantic style presets, shared components, and composed screens. Keep globally applicable values in the app theme and have component presets reference those values. Define font family, font size, font weight, line height, letter spacing, semantic text and surface colors, borders, spacing, corner radii, control heights, and interaction treatments centrally. Font size and text size are the same setting. Reuse the existing icon size, stroke, and touch-target registry as part of this foundation rather than introducing a second source of icon values.

Provide typography roles for body/value, title, label, supporting text, and placeholder. Separate typography choices from control geometry so reduced padding does not implicitly reduce readable text size. Define semantic colors for main and muted text, primary actions, danger, success, surfaces, and borders, with shared hover, focus, selected, invalid, and disabled treatments. Component-specific recipes may select appropriate combinations; coherence does not require every component or state to look identical.

Components consume these values and presets directly or through composed primitives. A mandatory `BaseComponent.svelte` wrapper or component inheritance hierarchy is not required: a wrapper alone cannot keep child visual overrides consistent and would add structure around native controls. Preserve native elements, accessible names, bindings, validation, keyboard behavior, focus handling, and semantic props such as `tone`, `size`, and `appearance`. Continue the existing semantic styling boundary: callers own parent layout while components own presentation.

Inventory all shared components before adoption, starting with `Button`, `TextInput`, `Textarea`, `ComboboxPrimitive`, `Select`, `MultiSelect`, and `EditableLabel`, then migrate composite and specialized components. Reuse presets for labels, helper text, and errors as well as primary control content. In particular, native placeholders and rendered empty-state placeholders such as the notes preview use the same placeholder role. Record intentional domain-specific values, such as user-selected category colors, separately from theme-owned UI colors.

First consolidate the current appearance without choosing a new production font or palette. Record existing inconsistencies and propose their shared role mapping explicitly; review any necessary visible alignment rather than silently treating it as preservation. Check actual rendered text sizes on mobile against the existing input-size protection in `app.css`. Use the components page to compare real controls, typography roles, and interaction states. Stop for review after adoption and focused verification, before global visual tuning. Production theme selection and a broad screen layout redesign are outside this extension.

### Future light and dark themes

Define theme-owned colors as overridable CSS custom properties named for semantic purpose. Component presets reference these roles rather than embedding fixed palette values. Themes supply values for the same roles; typography and geometry remain shared by default. Define foreground/background pairs for main and muted text, placeholders, primary and destructive actions, selected and invalid states, as well as borders, focus rings, hover treatments, disabled states, shadows, and overlays where applicable. Review readability of each pair rather than assuming a palette can be inverted.

Theme scope belongs at the app root so controls, page backgrounds, cards, menus, dialogs, and fixed footers receive the same values, including overlays rendered outside their originating component. Components do not need individual light/dark props or theme-specific behavior branches. Include surrounding app surface colors in the adoption inventory without redesigning screen layouts. Preserve user-authored colors as domain data and inspect their readability against theme surfaces.

Require a temporary alternate palette for development/browser verification. It must be unmistakably different from the default palette across text, surfaces, borders, accents, and state roles, for example a readable purple/cream/teal combination rather than a subtle shade adjustment. This is a diagnostic palette, not the future dark-theme design. Provide a documented, reversible development/test-only activation at the app root so the showcase and representative app screens can be inspected with the same override. Keep the production default unchanged and exclude the diagnostic palette and activation control from production delivery.

Verify both palettes in desktop and mobile browsers using visual inspection and representative computed-style assertions. Check native and rendered placeholders, hover/focus/selected/invalid/disabled states, page and overlay surfaces, and restoration of the default palette. Unexpected default colors expose missed semantic-role adoption and must be resolved or identified as intentional domain values. A production dark palette, system/light/dark selection, preference persistence, initial-render handling to avoid a theme flash, and native browser color-scheme integration remain future work.

### Foundation adoption inventory (2026-09-10)

The inventory below covers every shared Svelte component before migration. Existing utility geometry already consumes Tailwind theme spacing/radius values; these values will be explicitly owned by the foundation. Color utilities will move to semantic roles with the same initial palette values.

| Component | Existing color families | Adoption |
|---|---|---|
| Button | blue, gray, green, red, white | Shared semantic colors and typography; retain native behavior |
| CalendarDayButton | blue, gray, white | Shared semantic colors and typography; retain native behavior |
| CategoryConfigDialog | black, gray, red, white | Shared semantic colors and typography; retain native behavior |
| CategoryGroup | Composed primitives / inherited | Consume foundation through composed primitives |
| CategorySelect | Composed primitives / inherited | Consume foundation through composed primitives |
| ColorSwatchButton | blue, gray | Shared semantic colors and typography; retain native behavior |
| ComboboxPrimitive | blue, gray, red, white | Shared semantic colors and typography; retain native behavior |
| CompletionToggle | gray, green | Shared semantic colors and typography; retain native behavior |
| DatePicker | gray, red, white | Shared semantic colors and typography; retain native behavior |
| DeleteCheckedItemsDialog | black, gray, red, white | Shared semantic colors and typography; retain native behavior |
| DueDateChip | gray, orange, red | Shared semantic colors and typography; retain native behavior |
| EditableLabel | Composed primitives / inherited | Consume foundation through composed primitives |
| EmailInput | Composed primitives / inherited | Consume foundation through composed primitives |
| FilterBar | Composed primitives / inherited | Consume foundation through composed primitives |
| FixedActionFooter | gray, white | Shared semantic colors and typography; retain native behavior |
| GroceryCategorySection | gray, green, white | Shared semantic colors and typography; retain native behavior |
| Icon | gray | Shared semantic colors and typography; retain native behavior |
| ItemAuditMetadata | gray | Shared semantic colors and typography; retain native behavior |
| ItemCard | blue, gray, green, white, yellow | Shared semantic colors and typography; retain native behavior |
| ItemDetails | gray, white, yellow | Shared semantic colors and typography; retain native behavior |
| ItemForm | blue, gray, white | Shared semantic colors and typography; retain native behavior |
| ListForm | gray, white | Shared semantic colors and typography; retain native behavior |
| ListGroupSection | gray, red, white | Shared semantic colors and typography; retain native behavior |
| ListStateSummary | blue, gray, white | Shared semantic colors and typography; retain native behavior |
| MemberInviteEmailInput | gray | Shared semantic colors and typography; retain native behavior |
| MembersDialog | black, blue, gray, purple, red, white | Shared semantic colors and typography; retain native behavior |
| MultiSelect | blue | Shared semantic colors and typography; retain native behavior |
| RecurrenceIndicator | gray | Shared semantic colors and typography; retain native behavior |
| Select | Composed primitives / inherited | Consume foundation through composed primitives |
| SortSelector | Composed primitives / inherited | Consume foundation through composed primitives |
| StarToggle | gray, yellow | Shared semantic colors and typography; retain native behavior |
| SwipeDeleteAction | white | Shared semantic colors and typography; retain native behavior |
| TextInput | blue, gray, red, white | Shared semantic colors and typography; retain native behavior |
| Textarea | blue, gray, red, white | Shared semantic colors and typography; retain native behavior |
| TimezonePicker | Composed primitives / inherited | Consume foundation through composed primitives |
| Toggle | blue, gray, white | Shared semantic colors and typography; retain native behavior |

Role mapping: neutral foregrounds become heading, value, label, supporting, muted, faint, and inactive text; neutral backgrounds become canvas, surface, subtle, hover, disabled track, and inverse surface. Blue becomes primary action/link, selected surface, and focus roles; red becomes danger; green success; yellow warning/star; orange due-today; purple informational badges. Borders retain subtle/default/strong levels. Foregrounds on filled actions and inverse surfaces have separate roles. Each interaction state retains its current value as a semantic recipe. Page roots, route-local cards, navigation, and modal backgrounds adopt the same roles.

Intentional differences: title and metadata typography retain their size hierarchy; compact control geometry remains independent of text size. Native TextInput/Textarea placeholders currently differ from preview/combobox placeholders in color and italic treatment; align them to the shared placeholder role. Editable input text is protected at a minimum of 1rem; rendered control-value/placeholder typography will also use at least 1rem so notes previews and editors match. This is an explicit readability alignment from the existing 14px control preset, while supporting labels and metadata retain their current sizes.

Exceptions: category swatch hex values and user-selected category backgrounds are domain data; swipe translation and drag animation are interaction geometry; icon size/stroke values stay in iconRegistry. Transparent surfaces and currentColor remain intentional compositional values. Showcase code samples and syntax presentation may demonstrate domain data, but their enclosing surfaces adopt theme roles. Font, spacing, radius, weight, line-height, tracking, and shadow scales are owned centrally; component recipes choose those tokens instead of duplicating new numeric values.

Implementation verification: `e2e/tests/foundation.spec.ts` exercises default and diagnostic palettes at 1280px and 390px, including computed placeholder typography, root token propagation, focus, hover, menu surfaces, disabled/invalid states, fullscreen notes, and fixed footers. Browser testing exposed a focus-return race when removing the notes editor's focused Save button; ItemForm now protects the return-focus transition from new-item cancellation. The development palette is documented in `docs/style-foundation.md`. The dynamic import is guarded by Vite’s build-time `import.meta.env.DEV` so production output excludes the module entirely without a custom plugin; emitted client/server and adapter output were checked for the module, palette values, and activation-control strings.
