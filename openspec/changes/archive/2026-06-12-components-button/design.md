## Context

The frontend uses native `<button>` elements throughout routes and shared components. Common blue primary, neutral secondary, and red destructive styles are repeated with small differences in padding, focus treatment, disabled behavior, and loading text. The component library already centralizes text inputs, selects, and editable labels, but has no button primitive.

The frontend is Svelte 5 with TypeScript and Tailwind CSS. Shared components are colocated with Vitest and Testing Library tests and documented in both the component README and the development-only `/components` route.

## Goals / Non-Goals

**Goals:**

- Provide one accessible Button primitive for common application actions.
- Preserve native button semantics, form behavior, keyboard activation, and standard attributes.
- Standardize primary, secondary, and danger variants.
- Standardize disabled and loading behavior.
- Allow text, icons, or combined content through a child snippet.
- Document and demonstrate the component in the existing showcase.

**Non-Goals:**

- Replace every existing native button in this change.
- Add link-button navigation behavior.
- Add icon assets, icon-only tooltip behavior, or an icon system.
- Create highly specialized compact controls used by cards, menus, or drag handles.

## Decisions

### Wrap a native button and forward native attributes

`Button.svelte` will render a real `<button>` and accept standard button attributes and event handlers through typed rest props. The component will default `type` to `button` so placement inside a form never submits accidentally; consumers must explicitly request `submit` or `reset`.

A custom click event dispatcher was considered, but forwarding the native `onclick` contract preserves event types and expected DOM behavior.

### Use a small variant API

The component will expose `variant: 'primary' | 'secondary' | 'danger'`, defaulting to `primary`.

- `primary`: filled blue for the main action.
- `secondary`: neutral bordered treatment for alternate or cancel actions.
- `danger`: filled red for destructive confirmation.

This covers repeated application patterns without creating variants for text links, icon-only controls, or every current one-off style.

### Support class extension without replacing base behavior

The component will merge a consumer-provided `class` value after its base and variant classes. This supports layout concerns such as `w-full` while retaining consistent focus, disabled, typography, and transition styles.

### Treat loading as non-interactive busy state

The `loading` prop will disable the native button, set `aria-busy="true"`, and replace child content with `loadingLabel`, defaulting to `Loading…`. The explicit disabled prop and loading state will combine so either one prevents activation.

Replacing content produces a clear visual status and avoids requiring each consumer to duplicate loading branches. A spinner is out of scope because the project has no shared icon or motion primitive.

### Add a self-contained showcase section

The `/components` route will render each variant plus disabled, loading, full-width-via-class, and submit-type examples. It will include usage snippets and a complete API reference. Examples will use local click state only and will not call backend services.

## Risks / Trade-offs

- [A small variant set cannot replace every existing button] → Keep specialized controls native until a repeated pattern justifies another variant.
- [Consumer classes can override visual consistency] → Merge classes intentionally for layout and exceptional cases; document variants as the preferred styling mechanism.
- [Replacing content while loading changes button width] → Consumers that need stable width can provide width utilities such as `min-w-*` or `w-full`.
- [Defaulting to `type="button"` differs from raw HTML] → Document the safer default and test explicit submit behavior.
