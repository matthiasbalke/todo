## Context

Issue 131 asks for the category Select to show the category color circle in front of category names for both selected and unselected values. The current `ItemForm` passes string category IDs into the shared `Select` and uses `getOptionLabel` to display names. The shared `Select` renders labels as plain text in both the input-backed trigger and the listbox options.

This is a frontend-only display change. Category colors already exist on the category model and are used elsewhere in the UI, so no API or persistence changes are needed. Because category selection now has domain-specific behavior, a dedicated `CategorySelect` adapter keeps ordinary Select usage simple while still reusing shared combobox behavior.

## Goals / Non-Goals

**Goals:**
- Show the configured category color before every real category option in the category Select listbox.
- Show the configured category color before the currently selected real category in the Select trigger.
- Reserve the same leading swatch space for every CategorySelect value, including colorless categories and `Uncategorized`, so all labels align consistently.
- Provide a reusable `CategorySelect` component for category selection instead of placing category rendering details directly in `ItemForm`.
- Demonstrate `CategorySelect` on the development component showcase page.
- Preserve label-based filtering, keyboard navigation, accessible combobox/listbox semantics, and category ID submission.
- Keep `Uncategorized` visually distinct as a value with no visible color circle but the same label indentation.

**Non-Goals:**
- Changing category creation, editing, or color selection behavior.
- Adding a backend category color contract.
- Replacing the shared Select component or changing consumers that do not need custom option visuals.
- Adding viewport collision behavior or other dropdown positioning changes.

## Decisions

1. Extend `Select` with optional render hooks for selected value and option content while retaining `getOptionLabel` as the canonical text label.

   Rationale: `Select` already owns filtering, keyboard behavior, and typed option values. Render hooks let a specialized adapter add color swatches without duplicating combobox logic or replacing the option value type. Use Svelte 5 snippet props for this advanced rendering path so normal `Select` consumers keep the existing simple API.

   Alternative considered: Convert category options from IDs into objects and embed display state directly in labels. That would still need custom rendering for color circles and would increase value-mapping risk around nullable category submission.

2. Keep search and accessible names driven by `getOptionLabel`.

   Rationale: The color indicator is visual context, not the value identity. Existing tests and behavior expect search text and selection callbacks to use labels/values, not rendered DOM content.

   Alternative considered: Derive text from rendered content. That would make filtering dependent on Svelte markup and weaken the typed Select contract.

3. Implement category color rendering in a `CategorySelect` adapter, not as category-specific logic inside `Select` or `ItemForm`.

   Rationale: `Select` is shared by recurrence, timezone, membership, and other consumers. Category color is domain-specific, but `ItemForm` should not become responsible for a reusable selector's display rules. `CategorySelect` should own category lookup, `Uncategorized`, color indicator rendering, null/empty ID mapping, and reserved swatch spacing while composing `Select` for interaction behavior.

   Alternative considered: Add `getOptionColor` to `Select`. That would make the primitive less general and couple it to one visual pattern. Another alternative was passing snippets from `ItemForm`; that would keep `Select` generic but spread category display rules into each consumer.

4. Reserve swatch layout space for every displayed value, even when its color is null or the value is `Uncategorized`.

   Rationale: CategorySelect labels should align as a group so the dropdown and trigger do not visually jump between colored, colorless, and uncategorized values. The empty space communicates absence of a configured color without inventing a fallback color.

   Alternative considered: Render no swatch element for colorless categories or `Uncategorized`. That would satisfy "no dot" but create uneven text indentation.

5. Add `CategorySelect` to the development component showcase.

   Rationale: `CategorySelect` becomes a shared specialized component. The showcase should make its colored, colorless, uncategorized, selected, disabled, usage, and API behavior visible to developers alongside other shared controls.

   Alternative considered: Only test `CategorySelect` through `ItemForm`. That would verify the product path but would leave the reusable component undocumented and harder to discover.

## Risks / Trade-offs

- Custom trigger content with an input-backed combobox can conflict with typing and selection display -> Keep the visible color indicator outside the input text while the input value remains the selected/search label.
- Render hooks can be overused for complex option layouts -> Document the API as a display extension while keeping labels, values, filtering, and validation owned by `Select`.
- Duplicate category names remain possible -> Continue using category IDs as option values and use labels only for display/search.
- Empty reserved swatch space can look accidental if too wide -> Use the same fixed swatch width as colored indicators and no border/fill for colorless categories.
- A new adapter adds another component to maintain -> Keep it thin: domain mapping and snippets only, with all interaction behavior delegated to `Select`.
