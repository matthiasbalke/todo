## Why

The frontend repeats native button markup and Tailwind classes across routes and components, producing inconsistent states and making accessibility or styling changes expensive. A shared Button primitive will establish one tested API for common actions and make the component library showcase complete for this core control.

## What Changes

- Add a reusable `Button` component under `frontend/src/lib/components`.
- Support primary, secondary, and danger visual variants that match existing application patterns.
- Support native button types, disabled state, loading state, accessible labeling, slot content, and click handling.
- Add focused unit tests covering rendering, variants, native behavior, disabled/loading behavior, accessibility, and events.
- Document the component API and usage in the component library README.
- Add interactive Button examples, usage snippets, and an API reference to the development-only `/components` showcase.

## Capabilities

### New Capabilities

- `button-component`: Reusable, accessible Button primitive with consistent variants and interaction states.
- `button-showcase`: Interactive development showcase and API documentation for the Button component.

### Modified Capabilities

None.

## Impact

- Adds `frontend/src/lib/components/Button.svelte` and colocated unit tests.
- Updates `frontend/src/lib/components/README.md` and `frontend/src/routes/components/+page.svelte`.
- Extends the existing component showcase route tests.
- Does not migrate existing native buttons in application screens as part of this change.
- Adds no backend, API, data model, or external dependency changes.
