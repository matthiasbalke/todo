## Why

The component library identifies DatePicker as a core missing primitive, while the app currently relies on browser-native date inputs whose appearance and interaction vary by platform. A custom calendar popover will provide consistent, accessible date selection while preserving the backend's nullable `YYYY-MM-DD` date contract.

## What Changes

- Add a reusable `DatePicker` component under `frontend/src/lib/components`.
- Use a custom single-date calendar popover rather than `input type="date"`.
- Bind a nullable ISO calendar-date value (`YYYY-MM-DD | null`) without introducing timestamp or timezone conversion.
- Support localized display text, month navigation, a Monday-first calendar grid, Today and Clear actions, disabled state, and optional minimum/maximum dates.
- Support mouse, touch, and keyboard operation with focus management, Escape dismissal, and outside-click dismissal.
- Add focused unit tests for rendering, date selection, navigation, constraints, clearing, localization, accessibility, and keyboard behavior.
- Document the component and add interactive examples and API reference material to the development-only `/components` showcase.

## Capabilities

### New Capabilities

- `datepicker-component`: Accessible custom calendar popover for selecting a nullable ISO calendar date.
- `datepicker-showcase`: Interactive development showcase and API documentation for the DatePicker component.

### Modified Capabilities

None.

## Impact

- Adds `frontend/src/lib/components/DatePicker.svelte` and colocated tests.
- Updates the component README, `/components` showcase, and showcase route tests.
- Does not replace the native due-date input in `ItemForm`; that migration is deferred to a later change.
- Uses only existing Svelte, TypeScript, Tailwind, and browser `Intl` APIs; no external dependency is added.
- Adds no backend, API, or database changes.
