## Context

The semantic styling change intentionally keeps domain-specific interaction states out of the general Button API. The remaining exceptions are controls whose visuals depend on business state rather than generic action intent:

- DatePicker calendar cells combine selected, today, adjacent-month, disabled, focused, and roving-tabindex states with `gridcell` semantics.
- Category color swatches combine an arbitrary category color with selected/unselected borders and scale.
- Item completion toggles combine done/undone state with a circular check presentation and touch handling.
- Item star toggles combine starred/unstarred state with icon color and touch handling.
- ItemCard's swipe-delete action fills a revealed destructive surface with fixed gesture-owned geometry.

These controls currently use Button or native button markup plus visual classes at their consumers. They are too specialized for general tone/appearance combinations, but leaving them as permanent exceptions would make the styling policy incomplete.

This change follows `standardize-semantic-component-styling` and assumes its semantic Button API and source guard exist.

## Goals / Non-Goals

**Goals:**

- Give each specialized interaction a typed shared component that owns its state-dependent visuals.
- Reuse Button internally for native button behavior, focus treatment, disabled behavior, and event forwarding where compatible.
- Preserve domain-specific ARIA roles, labels, keyboard behavior, pointer/touch behavior, focus management, and geometry.
- Remove all specialized visual-style exceptions from the semantic styling guard.
- Keep arbitrary domain values, such as category colors, expressed as data rather than consumer CSS.

**Non-Goals:**

- Add calendar, category, or item domain states to the general Button API.
- Redesign icons, gestures, colors, or workflows.
- Build a general-purpose design-token or headless-component framework.
- Consolidate unrelated content components or layout containers.
- Change DatePicker's date calculations, item store behavior, or category persistence.

## Decisions

### Create focused domain controls

Add the following shared controls, with final names adjusted to repository conventions during implementation:

- `CalendarDayButton`: accepts the date label/value and boolean selected, current, adjacent, disabled, and focused states; forwards gridcell semantics, tabindex, click, keydown, and element binding required by DatePicker.
- `ColorSwatchButton`: accepts a color value and selected state; owns swatch size, shape, border, scale, focus, and accessible labeling.
- `CompletionToggle`: accepts checked/done state and owns circular completion presentation, accessible checked state or action label, click, and touch behavior.
- `StarToggle`: accepts starred state and owns active/inactive icon presentation, accessible pressed state or action label, click, and touch behavior.
- `SwipeDeleteAction`: accepts activation, accessible labeling, and gesture-owned dimensions; owns the destructive revealed-surface presentation.

Separate components are preferred over one generic `SpecialButton` because their state models, accessibility semantics, and geometry are materially different. Adding these states to Button was rejected because it would couple the base primitive to todo, category, and calendar domains.

### Compose Button without leaking visual classes

Each control will use Button internally when Button can forward the required role, ARIA attributes, tabindex, event handlers, and element binding. The specialized component owns any additional classes and dynamic styling inside its implementation.

If Button cannot preserve a required semantic, such as DatePicker's bound element map or a gesture event contract, its forwarding surface will be minimally extended. A specialized control may render a native button only when a documented technical constraint makes Button composition incorrect; such a decision requires a focused test and design note.

CalendarDayButton, ColorSwatchButton, CompletionToggle, and StarToggle render native buttons because their required geometry and state-dependent border, color, scale, and icon presentation cannot be expressed through Button without adding calendar, category, or todo domain states to the generic primitive. Focus, disabled, ARIA, keyboard, pointer, touch, and element-binding behavior are covered by focused tests. SwipeDeleteAction composes Button because its destructive tone and backdrop geometry fit the semantic primitive directly.

### Express arbitrary colors as typed data

ColorSwatchButton receives the category color as a value prop and applies it internally, preferably through a component-owned CSS custom property or style binding. Consumers do not construct `style` attributes or color utilities. The component validates or safely applies the same color format already accepted by category data.

### Keep orchestration in parent components

DatePicker continues to own calendar calculations, roving focus decisions, month changes, and date selection. ItemCard continues to own store mutations, swipe distance, and gesture orchestration. CategoryConfigDialog continues to own editing state and persistence.

The specialized controls own rendering and local interaction semantics, not business orchestration. This avoids moving store or date-domain logic into visual primitives.

### Remove exceptions as each control lands

Each migration removes its exact semantic styling exception in the same task. The change is complete only when the specialized exception list is empty and the guard rejects reintroduction of consumer visual styling for these interactions.

## Risks / Trade-offs

- [Too many tiny components increase indirection] → Extract only audited controls with meaningful state/accessibility contracts and keep their APIs focused.
- [Button composition interferes with grid or touch behavior] → Verify role forwarding, tabindex, bound elements, pointer/touch cancellation, and event propagation before replacing existing markup.
- [Dynamic category colors bypass the style guard] → Permit dynamic styling only inside ColorSwatchButton and pass the color as typed data from consumers.
- [Completion and star semantics become inconsistent] → Define and test `aria-pressed`, checked state, or action labels consistently with existing screen-reader behavior.
- [Swipe geometry becomes detached from gesture logic] → Keep dimensions explicit through a narrow geometry prop or parent layout contract while the component owns destructive visuals.
- [A temporary exception remains unnoticed] → Add a zero-exception assertion to verification and documentation tasks.

## Migration Plan

1. Confirm the exception inventory produced by `standardize-semantic-component-styling`.
2. Implement and test CalendarDayButton, then migrate DatePicker and remove its exception.
3. Implement and test ColorSwatchButton, then migrate category edit/add swatches and remove their exceptions.
4. Implement and test CompletionToggle and StarToggle, then migrate ItemCard and remove their exceptions.
5. Implement and test SwipeDeleteAction, then migrate the revealed delete surface and remove its exception.
6. Run the semantic styling guard and assert the specialized exception list is empty.
7. Update component documentation/showcase and run full frontend verification.

Rollback is component-local: restore the previous specialized markup and its exact documented exception. No data or deployment migration is required.

## Open Questions

None. The initial control set is limited to the exceptions explicitly identified by the semantic styling audit.
