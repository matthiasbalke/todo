## Context

The frontend component library provides typed Svelte controls for buttons and dates, plus older shared controls for single-line text and selection. Multiline content is still entered through a raw `<textarea>` in `ItemForm`, so labeling, validation, styling, and native attribute support are not defined by a reusable contract.

The frontend uses Svelte 5, TypeScript, Tailwind CSS, Vitest, and Testing Library. New primitives are colocated with tests, documented in the component README, and demonstrated on the development-only `/components` route.

## Goals / Non-Goals

**Goals:**

- Provide a reusable native-textarea wrapper with a bindable string value.
- Match the component library's label, required, disabled, validation, error, and focus styling.
- Preserve standard textarea attributes and native event handlers.
- Support multiline-specific row sizing and resize behavior.
- Give every instance unique label, description, and error identifiers.
- Demonstrate and document the component, then adopt it for `ItemForm` notes.

**Non-Goals:**

- Add rich-text editing, Markdown preview, syntax highlighting, or content sanitization.
- Add automatic height growth or character-count enforcement beyond native attributes.
- Replace every textarea outside `ItemForm` in this change.
- Redesign the existing TextInput component or create a shared field abstraction.

## Decisions

### Wrap a native textarea and forward typed native attributes

`Textarea.svelte` will render a real `<textarea>` and extend Svelte's `HTMLTextareaAttributes`, excluding properties the component controls directly. Standard attributes such as `name`, `maxlength`, `autocomplete`, `spellcheck`, `data-*`, and ARIA attributes will be forwarded.

The component will intercept native input and blur handlers only to update its bindable value and validation state, then invoke consumer-provided handlers with the original native event. A custom component event was rejected because native handler forwarding is more predictable and matches the newer library primitives.

### Use a bindable string value and explicit multiline props

The public value will be a bindable string defaulting to `''`. `rows` will default to `3`, while consumers can override it through the native prop. A `resize` prop with `none`, `vertical`, `horizontal`, and `both` values will map to fixed Tailwind resize classes and default to `vertical`.

Using nullable values was rejected because native textareas and existing form state use strings; consumers can translate empty strings at their data boundary. Automatic growth was rejected because it adds measurement and layout behavior beyond a base primitive.

### Generate unique accessible relationships per instance

Each component instance will generate stable IDs for the textarea, visible label, optional description, and validation error. A visible label will use native `for` association, while `ariaLabel` will support label-less usage. `aria-describedby` will include both description and error IDs when both are present, and `aria-invalid` will reflect validation state.

Fixed IDs like the existing TextInput's `text-input` and `error-message` were rejected because multiple instances would create invalid duplicate IDs and ambiguous accessible relationships.

### Keep validation synchronous and aligned with TextInput behavior

An optional validator will receive the current string and return an error message or `null`. Validation will run on input and blur, display the returned message, and apply error styling. Validator exceptions will be caught and logged without breaking text entry.

Asynchronous validation and externally controlled errors are out of scope; those can be added later if a concrete form requires them.

### Merge consumer classes after base and state classes

The component will retain standard typography, border, focus, disabled, and error styles while appending a consumer-provided `class`. This supports layout needs such as `w-full` or `min-h-*` without requiring separate wrapper props.

### Adopt the component in ItemForm without changing its data contract

`ItemForm` will replace its raw notes textarea with Textarea, bind the existing string state, retain the `Notes (optional)` placeholder and two-row presentation, and use `resize="none"` to preserve the current layout. Submission will continue converting an empty notes string to `null`, and form-level focus/cancel behavior will remain unchanged.

### Add a self-contained development showcase

The `/components` route will demonstrate basic binding, validation, disabled/required states, row and resize configuration, and native constraints. It will include usage snippets and an API/native-forwarding reference while preserving the route's existing production redirect.

## Risks / Trade-offs

- [Consumer classes can override the visual contract] → Append classes intentionally for layout extension and document the standard states as the default.
- [Validation on every input may be noisy for some forms] → Keep validation optional; consumers that need delayed validation can omit it and validate at form submission.
- [Forwarded `aria-describedby` could conflict with generated description or error IDs] → Define deterministic merging behavior and cover it with accessibility tests.
- [Migrating ItemForm could affect focus-loss cancellation] → Add integration coverage proving notes interaction remains internal to the form and submitted values are unchanged.
- [A fixed row default does not fit every form] → Expose native `rows` and additive classes so consumers can choose their presentation.
