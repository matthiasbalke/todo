## Context

The frontend has shared Button, TextInput, EmailInput, Select, Textarea, DatePicker, and EditableLabel components. Native-control adoption is complete, but presentation ownership is not: 66 of 84 production Button usages select `bare`, while many reconstruct colors, borders, padding, typography, hover behavior, or complete primary/danger treatments through `class`. `ghost` is unused outside the showcase, and obvious filled primary and danger actions still use `bare` plus visual utilities.

Other primitives expose the same escape hatch through `triggerClass`, `inputClass`, `displayClass`, and related props. Composite primitives also duplicate native button and input styling internally. Tailwind utility order has already caused transparent backgrounds to override intended filled actions, demonstrating that class concatenation is not a reliable component API.

Some controls have genuinely specialized dynamic visuals: calendar day cells, category color swatches, item completion and star toggles, and swipe-delete surfaces. They require dedicated abstractions and are covered by the separate `extract-specialized-interaction-controls` change.

## Goals / Non-Goals

**Goals:**

- Make semantic intent, appearance, geometry, and state explicit through typed shared-component props.
- Keep colors, borders, radius, focus, hover, typography, and internal spacing owned by shared components.
- Allow consumers to provide layout-only classes such as width, margin, positioning, and flex sizing.
- Make composite shared components reuse Button, TextInput, and other existing primitives when semantics and interaction behavior remain correct.
- Migrate all standard production usages and enforce the boundary automatically.
- Record temporary specialized-control exceptions with paths and reasons until the follow-up change removes them.

**Non-Goals:**

- Redesign the visual language, palette, or application workflows.
- Add a third-party component library, CSS-in-JS system, or theme framework.
- Force domain-specific states such as calendar dates or item completion into the general Button API.
- Extract specialized controls in this change.
- Replace semantic links, forms, fieldsets, labels, or unsupported native input types.

## Decisions

### Separate semantic tone from visual appearance

Button will replace the overloaded `variant` prop with independent axes:

- `tone`: `primary`, `neutral`, `danger`, or `success`.
- `appearance`: `solid`, `outline`, `ghost`, or `bare`.
- Existing `size`, `align`, and `weight` concepts remain, but their values will be reviewed and renamed where they encode a use case rather than stable geometry.
- Explicit state props such as `selected` will control state-dependent presentation for menu and option rows.

Representative mappings are:

- Existing `primary` → `tone="primary" appearance="solid"`.
- Existing `secondary` → `tone="neutral" appearance="outline"`.
- Existing `danger` → `tone="danger" appearance="solid"`.
- Existing `ghost` → `tone="neutral" appearance="ghost"`.
- Neutral menu row → `tone="neutral" appearance="bare"` with menu geometry.
- Destructive menu row → `tone="danger" appearance="ghost"` with menu geometry.
- Selected option → semantic tone plus `selected`, not a consumer text-color class.

This matrix avoids named combinations such as `dangerGhost` and keeps domain-specific visuals out of the primitive. Unsupported combinations will either have defined behavior or be rejected through TypeScript rather than producing accidental styling.

### Restrict consumer classes to layout

Shared controls will retain a `class` hook only for external layout concerns. Allowed utilities include dimensions required by the parent layout, margins, positioning, flex/grid participation, responsive visibility, and parent-owned opacity when it represents the whole control's placement.

Consumers may not provide foreground/background colors, borders, radius, shadows, hover/focus/active/disabled presentation, typography, transitions, or internal padding/gap. Current visual hooks such as `triggerClass`, `inputClass`, `displayClass`, and `labelClass` will be replaced with named props such as size, density, emphasis, label visibility, or display appearance. Container layout hooks remain only where the parent owns layout.

Allowing arbitrary classes with documentation alone was rejected because conflicting classes are already common. Removing every class hook was rejected because parent layouts still need width, margin, positioning, and flex participation.

### Reuse primitives inside composite shared components

- EditableLabel will render TextInput for editing and Button for explicit save, cancel, and display activation where a native button preserves the current semantics.
- DatePicker will render Button for its trigger, month navigation, Today, and Clear actions.
- Select will render Button for its trigger and standard option actions while preserving listbox roles, keyboard navigation, focus management, and positioning.
- EmailInput continues to compose TextInput.
- Native elements remain inside their owning lowest-level primitive, such as the native input in TextInput and native button in Button.

Specialized calendar day cells remain a documented exception until the follow-up change because roving tabindex, gridcell semantics, selected/current date states, and adjacent-month styling form a dedicated interaction contract.

### Add a source-level semantic styling guard

A frontend test will inspect production Svelte source and report file, line, component, prop, and forbidden utility. It will:

- Detect shared-component usages and classify tokens supplied through `class` and legacy visual class props.
- Reject visual utility families, state-prefixed visual utilities, arbitrary visual values, and inline `style` on standard shared controls.
- Permit a small explicit allowlist of layout utility families.
- Reject use of removed visual override props.
- Maintain a temporary exception list containing exact path, component/control identity, and reason for specialized controls.
- Exclude the primitive implementation being tested and permit the development showcase to demonstrate APIs without becoming an application exception.

The guard will build on the existing native-control inventory pattern but use a dedicated utility classifier and source locations. Exceptions must be narrow and cannot allow an entire file.

### Migrate in layers and remove compatibility APIs

Implementation will first add the semantic APIs and tests, then migrate composite primitives and production consumers, then enable the guard. The old Button `variant` prop and visual class hooks may exist as a short-lived compatibility layer during implementation but will be removed before the change is complete. This prevents the codebase from carrying two supported presentation models.

## Risks / Trade-offs

- [The tone/appearance matrix permits combinations with no current design] → Define and test every supported combination or encode supported pairs in TypeScript.
- [A layout utility is misclassified as visual or vice versa] → Use explicit utility-family rules, actionable diagnostics, and focused guard fixtures for allowed and rejected examples.
- [Primitive composition changes event or focus behavior] → Preserve native attribute forwarding and add interaction tests for keyboard, blur, Escape, roving focus, form submission, and loading states.
- [Removing class hooks makes a real use case impossible] → Add a named prop only after identifying a repeated semantic or geometry requirement; do not reopen unrestricted visual styling.
- [Temporary exceptions become permanent] → Link each exception to the specialized-controls follow-up and require the follow-up verification to reduce the exception list to zero.
- [The migration touches many consumers] → Migrate by feature area and retain focused route/component regression tests.

## Migration Plan

1. Record the current semantic misuse and visual-hook inventory as test fixtures.
2. Add Button tone, appearance, selected-state, and reviewed geometry APIs with exhaustive unit coverage.
3. Add named presentation APIs to other primitives and compose existing primitives inside EditableLabel, DatePicker, and Select.
4. Migrate standard form actions, confirmations, icon actions, menus, selectable rows, and control consumers in feature batches.
5. Add the semantic styling guard with temporary specialized-control exceptions.
6. Remove the old Button variant API and unrestricted visual class props.
7. Update README/showcase documentation and run the full frontend verification suite.

Rollback is source-local: revert a consumer batch while the temporary compatibility layer exists. The compatibility layer must not be removed until all production consumers and tests have migrated.

## Open Questions

None. Specialized controls are intentionally delegated to the separate `extract-specialized-interaction-controls` change.
