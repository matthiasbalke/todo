## 1. Icon System Checkpoint

- [x] 1.1 Add `@lucide/svelte` and establish a shared `Icon` component backed by an explicit per-icon Lucide registry as the single functional UI icon system, including semantic app names mapped to `ChevronLeft` for back navigation, `Menu` for menu controls, `Circle` for unchecked completion/status indicators, `CircleCheck` for checked/completed indicators, `Plus` for new-list creation, `Group` for list groups, `ChevronDown` for expanded sections, and `ChevronUp` for collapsed sections, while preserving existing app/PWA assets and user/list emoji content.
- [x] 1.2 Add shared named icon sizing presets for Lucide visual sizes and stroke widths, and verify focused icon tests pass with `cd frontend && bun run test -- --run`.
- [x] 1.3 Stop for review: inspect the icon registry, semantic names, rendered default sizes, and tree-shakable imports before starting button, toggle, or route adoption work.

## 2. Button and Toggle Checkpoint

- [x] 2.1 Wire shared `Button` icon sizes or a toolbar/icon-button wrapper to consume icon-only touch target presets, and verify existing `Button` tests plus any new icon-button tests pass with `cd frontend && bun run test -- --run src/lib/components/Button.test.ts`.
- [x] 2.2 Extend `CompletionToggle` and `StarToggle` only as needed for item-form usage while preserving component-owned Lucide visuals, and verify `ItemStateToggles` and `ItemCard` tests pass with `cd frontend && bun run test -- --run src/lib/components/ItemStateToggles.test.ts src/lib/components/ItemCard.test.ts`.
- [x] 2.3 Stop for review: inspect button/toggle sizing, stroke weight, focus rings, and touch target behavior before starting footer, route, or item-form adoption work.

## 3. MultiSelect Checkpoint

- [x] 3.1 Extend `ComboboxPrimitive` only as needed to support multi-select behavior while preserving existing `Select` behavior, including support for keeping the option list open after selection and representing multi-selected option state.
- [x] 3.2 Add a shared `MultiSelect` component based on the extended `ComboboxPrimitive` interaction patterns, including multi-value selection that keeps the option list open after selection, toggles selected options off when activated again, closes on Escape or focus-out/blur, custom option/selected rendering snippets, accessible labels, keyboard operation, and focused tests with `cd frontend && bun run test -- --run src/lib/components/MultiSelect.test.ts src/lib/components/ComboboxPrimitive.test.ts src/lib/components/Select.test.ts`.
- [x] 3.3 Stop for review: inspect MultiSelect filtering, keyboard behavior, selected-value rendering, and primitive API shape before adopting it in `ItemForm` or the components page.

## 4. Fixed Footer Checkpoint

- [x] 4.1 Add and adopt a shared `FixedActionFooter` for existing bottom action footers, with base horizontal and bottom display-edge spacing plus `env(safe-area-inset-bottom)` support, bounded scrollable expanded form content, and matching page-bottom reserve space; verify route/component tests or Playwright assertions confirm action borders remain visually inset, visible, and tappable on mobile viewports.
- [x] 4.2 Stop for review: inspect compact and expanded footer states on mobile-width viewports before changing list creation labels or item-form layout inside those footers.

## 5. List Overview and Navigation UI Checkpoint

- [x] 5.1 Replace the `/lists` footer list creation action with a Lucide `Plus` icon followed by the text `new list`, replace the group creation text action with a right-aligned Lucide `Group` icon action, and verify list overview tests assert the new list label/icon, group icon action accessible name, and absence of the old labels.
- [x] 5.2 Apply the shared stronger Lucide icon treatment to back-navigation controls on all app screens and to menu controls, and verify tests cover accessible names plus unchanged navigation/menu behavior.
- [x] 5.3 Update list group headers to show a Lucide `Group` icon before each group name and move the expand/collapse indicator to the right edge using `ChevronDown` for expanded and `ChevronUp` for collapsed state.
- [x] 5.4 Update list category headers and checked-items group controls to use the same `ChevronDown`/`ChevronUp` expanded/collapsed icons as list groups, preserving the right-aligned disclosure layout.
- [x] 5.5 Stop for review: inspect list overview creation actions, back/menu controls, and group/category disclosure rows before starting the item form overhaul.

## 6. Item Form Overhaul Checkpoint

- [x] 6.1 Add pending `done` and `starred` form state initialized from the item, draft, or new-item defaults; include both values in `ItemFormDraft`; render the completion control before the title and star control after the title; and verify `ItemForm` tests cover initial states, draft preservation, toggling, and submitted payload values.
- [x] 6.2 Rework non-title item form fields into stable icon-led rows with placeholders for empty category, due date, recurrence, assignees, and notes values, and verify `ItemForm` tests cover empty and selected-value rendering.
- [x] 6.3 Replace the assignee chip field with the shared `MultiSelect`, render user avatars before names in assignee options and selected values, preserve submitted `assignedUserIds`, and verify `ItemForm` tests cover empty selected state, selected assignees, avatars, and draft preservation.
- [x] 6.4 Convert `ItemForm` fields to the borderless inline presentation while preserving accessible names, required title validation, focus behavior, and current form submission shape, and verify `ItemForm` tests cover accessibility queries and existing submit/cancel/draft scenarios.
- [x] 6.5 Add fullscreen-capable notes editing support using shared textarea semantics and verify textarea-focused tests cover save, cancel, accessible naming, and multiline value preservation with `cd frontend && bun run test -- --run src/lib/components/Textarea.test.ts`.
- [x] 6.6 Implement the larger inactive notes preview with a component-level 160-character preview limit constant, no whitespace/newline normalization for the first implementation, `...` truncation for long notes, and a subtle right-aligned `open` cue below non-empty previews; verify tests cover absent notes, short notes, long truncated previews, the open cue placement, and display of the complete notes only inside fullscreen editing.
- [x] 6.7 Implement fullscreen notes editing with top chrome containing left Lucide `ChevronLeft` plus `Cancel`, centered `Notes`, and right-aligned `Save`, plus Escape dismissal, autofocus, focus return, no backdrop dismissal, desktop width constrained to the regular list content width, and internal-focus handling; verify `ItemForm` tests assert the header controls and that the new-item form does not call `oncancel` while the fullscreen editor is used.
- [x] 6.8 Stop for review: inspect new and existing item forms on mobile and desktop, including empty rows, selected values, assignee multi-select, notes preview, fullscreen notes, submit/cancel, and draft behavior before starting components-page documentation.

- [x] 6.9 Match the empty fullscreen notes textarea placeholder to the preview's `add note` placeholder.

## 7. Components Page Checkpoint

- [x] 7.1 Add a `MultiSelect` section to the components page near the existing `Select` section, including examples for empty state, multiple selected values, custom avatar option rendering, custom selected rendering, and callback/bound value feedback.
- [ ] 7.2 Add components-page section anchors and responsive sidebar/top navigation generated from a local section registry, and verify tests cover navigation links, target section ids, and presence of all documented component sections.
- [ ] 7.3 Stop for review: inspect desktop sidebar navigation, mobile navigation, and the MultiSelect showcase examples before final verification.

## 8. Final Verification

- [ ] 8.1 Run the frontend type check and unit test suite with `cd frontend && bun run check && bun run test -- --run`, and fix any regressions.
- [ ] 8.2 Run targeted Playwright coverage for mobile list overview, components-page navigation, and item form behavior, using the project e2e workflow, and verify the UI is usable on a mobile viewport.
- [ ] 8.3 Verify changed UI areas do not use text glyph or emoji functional icons where Lucide equivalents exist.
- [ ] 8.4 Run `openspec validate ui-overhaul --strict` and verify the change artifacts pass validation.
