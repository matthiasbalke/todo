## 1. Textarea Component

- [x] 1.1 Create `Textarea.svelte` with a bindable string value, typed native textarea attributes and handlers, unique instance IDs, and additive consumer classes.
- [x] 1.2 Implement visible and accessible labels, optional descriptions, required and disabled states, default and configurable rows, and supported resize modes.
- [x] 1.3 Implement synchronous validation on input and blur with error styling, `aria-invalid`, merged `aria-describedby`, error recovery, and consumer handler forwarding.

## 2. Component Tests and Documentation

- [x] 2.1 Add unit tests for initial and multiline value binding, default and configured rows/resize behavior, disabled and required states, placeholders, native attributes, native handlers, and class extension.
- [x] 2.2 Add unit tests for visible and screen-reader labels, descriptions, unique IDs across multiple instances, and combined accessible description/error relationships.
- [x] 2.3 Add unit tests for validation on input and blur, error clearing, validator exceptions, and accessible error state.
- [x] 2.4 Document Textarea props, validation, resize behavior, native forwarding, and usage examples in the component README.

## 3. ItemForm Adoption

- [x] 3.1 Replace ItemForm's raw notes textarea with the shared Textarea while preserving its placeholder, two-row non-resizable presentation, string state, and nullable submission contract.
- [x] 3.2 Update ItemForm tests to cover multiline notes, empty-note submission, and internal focus movement without new-item cancellation.

## 4. Component Showcase

- [x] 4.1 Add Textarea imports, bound example state, validation, and representative usage snippets to the `/components` route.
- [x] 4.2 Render basic, validated, required, disabled, row-configured, and resize-configured Textarea examples with bound-value feedback.
- [x] 4.3 Add Textarea usage guidance and a complete props/native-forwarding reference to the showcase.
- [x] 4.4 Extend component showcase tests for interactive binding, validation, states, configuration, and API documentation.

## 5. Verification

- [x] 5.1 Run the focused Textarea, ItemForm, and component showcase test suites.
- [x] 5.2 Run frontend type checking and resolve any Svelte or TypeScript diagnostics introduced by the component.
- [x] 5.3 Validate the `components-textarea` OpenSpec change and verify the existing production redirect for `/components` remains unchanged.
