## Why

Users currently have no explicit control over the app color theme. Adding light and dark theme selection makes the app more comfortable across lighting conditions and device preferences while preserving the existing calm, household-focused UI.

## What Changes

- Add a per-user theme preference with supported values for light, dark, and system/default behavior.
- Expose theme selection in the existing Account `Settings` section alongside timezone and Today View preferences.
- Apply the selected theme consistently across authenticated app pages, auth/setup/recovery surfaces, shared components, dialogs, menus, and PWA shell chrome.
- Persist theme selection so it follows the user across sessions and devices.
- Initialize and apply theme early enough to avoid an obvious flash of the wrong theme during app startup.
- Add a local theme selector to the development component showcase so shared components can be inspected in system, light, dark, and diagnostic modes.

## Capabilities

### New Capabilities
- `user-theme-preference`: Persisting, exposing, updating, and applying a user's selected light/dark/system theme.

### Modified Capabilities
- `account-settings-preferences`: Account settings include immediate-save theme selection with the same feedback and disabled-state behavior as existing preferences.
- `component-showcase-navigation`: The development component showcase includes a local theme selector for system, light, dark, and diagnostic inspection.
- `semantic-component-styling`: Shared controls and app surfaces resolve semantic color tokens correctly in both light and dark themes.

## Impact

- Backend user preference model, migration, DTOs, and authenticated preference update API.
- Frontend auth/user preference store, app startup theme initialization, account settings UI, and semantic color token definitions.
- PWA metadata such as `theme-color` so installed/mobile browser chrome matches the active theme.
- Development component showcase controls for manually inspecting production and diagnostic palettes.
- Unit, integration, and Playwright coverage for preference persistence, immediate save behavior, startup application, and themed visual surfaces.
