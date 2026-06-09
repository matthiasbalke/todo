## Context

The development-only `/components` route is the repository's interactive catalog for shared Svelte components. It currently documents other form primitives, while `EditableLabel` is implemented, tested, and documented only in Markdown. The showcase page is a single Svelte component with local example state, validators, rendered examples, code snippets, and prop tables.

## Goals / Non-Goals

**Goals:**

- Make `EditableLabel` discoverable and manually testable from `/components`.
- Demonstrate its primary interaction states and public contract using the real component.
- Match the organization and styling of the existing showcase sections.
- Keep examples deterministic and independent of backend services.

**Non-Goals:**

- Change the `EditableLabel` implementation or public API.
- Connect showcase examples to authentication or persistence APIs.
- Expose `/components` in production.
- Redesign or split up the full component showcase page.

## Decisions

### Add one self-contained showcase section

The route will import `EditableLabel` and add a section alongside the existing input component sections. The section will contain rendered examples, explanatory copy, code snippets, keyboard guidance, and API reference material.

Keeping the change in the existing route follows the established catalog structure. Creating a separate route or generic documentation framework would add navigation and abstraction work that is not justified by one missing component.

### Use local state and synchronous handlers

Examples will use route-local values, validators, disabled/saving flags, and a `change` event handler that records the latest saved value. This demonstrates the actual component contract without introducing network timing, authentication requirements, or failure modes unrelated to the component.

A simulated asynchronous save was considered, but a static saving-state example is more predictable and sufficient to show the disabled presentation.

### Cover distinct behavior through focused examples

The rendered examples will cover:

- basic inline editing and saved-value feedback;
- custom validation;
- disabled display behavior;
- saving-state display behavior.

This set covers the component's meaningful visual and behavioral states without duplicating every prop combination.

### Document behavior next to the live examples

The section will include usage code, Enter/Escape/blur interaction guidance, the `change` event payload, and all public props. Keeping this material beside the examples makes the showcase useful for both manual verification and implementation reference.

## Risks / Trade-offs

- [The route component becomes longer] → Keep the new section self-contained and follow the current page structure; broader showcase refactoring remains out of scope.
- [Showcase documentation can drift from the component API] → Derive the prop and event reference directly from the current `EditableLabel.svelte` exports and tests during implementation.
- [Interactive examples may interfere through shared state] → Give each behavioral example independent local state and flags.
- [Route-level automated testing may be disproportionate for static documentation] → Run existing component tests and frontend checks; add focused route tests only if the existing test setup supports them without substantial harness work.
