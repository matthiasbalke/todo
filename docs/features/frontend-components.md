# Frontend Components

## Overview

A small, consistent component library for the SvelteKit frontend that standardizes common UI primitives (inputs, buttons, selects, date pickers, item cards) and encourages reuse. The library promotes composition/extension of simple base components to create specialized variants, keeps styling scoped to components, and reduces duplicated UI logic across the app.

## Design decisions

- Base components: implement minimal, well-documented base components (e.g. TextInput, Select, Button, DatePicker) that encapsulate accessibility, focus management, and validation hooks.
- Composition over duplication: specialized components should compose or extend base components rather than reimplementing behavior.
- Location: place components under frontend/src/lib/components to match project structure and make imports predictable.
- Styling: prefer Tailwind utility classes and Svelte component-scoped styles; avoid inline CSS to keep templates declarative and testable.
- API consistency: components expose predictable props/events (value, on:input/on:change, disabled, class overrides) and support slot-based composition where appropriate.
- Boolean settings: use the shared `Toggle` with switch semantics, an accessible name, bindable
  checked state, and component-owned iOS-style presentation.

## Security considerations

- Avoid embedding unsafe HTML or user-provided markup in components. If rich text is needed, sanitize on the backend and render with strict content policies.
- Keep components stateless where possible; store sensitive data (tokens, secrets) only in secure stores (backend or SvelteKit load functions), not in component props or attributes.
- Ensure form components participate in CSRF protections and follow same-origin rules for API calls (handled by the overall frontend/backend auth design).

## Implementation plan

1. Add guidance to docs/requirements.md describing component conventions and styling rules (done).
2. Create docs/features/frontend-components.md describing design decisions and the implementation plan (this file).
3. Implement a small set of base components: TextInput, Button, Select, DatePicker, ItemCard under frontend/src/lib/components.
4. Write unit tests (Vitest + @testing-library/svelte) for each base component covering positive/negative paths and accessibility.
5. Migrate existing UI code to reuse base components where practical; prefer composition over copy-paste.
6. Add a components README and usage examples in frontend/src/lib/components/README.md.
7. Run frontend type-check and unit tests; fix any issues.

## Tasks

Tasks are tracked in docs/tasks.md under the "Frontend UI components" group. That file contains concrete, testable tasks and task ownership.
