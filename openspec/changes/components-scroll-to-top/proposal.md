## Why

On mobile devices, focused controls can be obscured by the virtual keyboard unless the active editing surface is moved to the top of the visible viewport. This is currently handled in `ItemForm`, but shared components and other custom editors need the same behavior without each consumer reimplementing it.

## What Changes

- Add a shared contract for reusable form/editor components to scroll their own editing surface near the top of the visual viewport when touched or focused on mobile.
- Preserve existing `ItemForm` behavior while moving reusable interaction logic into shared component utilities or component-owned behavior where practical.
- Apply the behavior to custom shared components used for text entry and selection workflows, including controls that compose native inputs or open custom option surfaces.
- Avoid scrolling nested listbox options themselves; component activation should position the owning field/editor instead of fighting internal option scrolling.
- Add frontend coverage for the shared behavior and representative component adoption.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `shared-component-adoption`: Shared frontend controls gain a mobile focus/touch viewport-positioning requirement.

## Impact

- Affected code: `frontend/src/lib/components/*` shared input/select/editor components, `frontend/src/lib/utils/focus.ts` or a nearby shared focus/viewport utility, and existing `ItemForm`/custom editor usages that currently own duplicated scroll behavior.
- Tests: focused component unit tests for reusable viewport scrolling behavior plus affected component tests where behavior is adopted.
- APIs: no backend or network API changes; any frontend component API additions should remain opt-in or behavior-preserving for existing consumers.
