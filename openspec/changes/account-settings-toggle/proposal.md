## Why

The account page currently presents user preferences as a Today-specific section with a generic button for enabling the feature, which does not communicate boolean state as clearly as a switch. Renaming the section to Settings, saving changes immediately, and adding explanatory timezone text will make the preference surface clearer and more consistent with the rest of the account page.

## What Changes

- Keep the account page heading and route unchanged, and rename the preference section from `Today` to `Settings`.
- Add concise supporting text below the timezone selector explaining that the selected timezone determines date-sensitive behavior such as which items appear in Today.
- Replace the current `Today view: Enabled/Disabled` button with a row labeled `Today View` and an iOS-style on/off toggle.
- Add a reusable shared toggle component with bindable checked state, disabled behavior, accessible switch semantics, labels, callbacks, and consistent visual styling.
- Add toggle examples and API guidance to the development component showcase.
- Save timezone and Today View changes immediately without a separate save button.
- Preserve error feedback, persisted values, and Today refresh behavior, and clear prior success feedback whenever either setting is modified.
- Prevent StarToggle pointer activation from displaying a border around the control while retaining an accessible keyboard focus indicator.
- Make the Today end-to-end test use unambiguous locators when a user-created list name also contains `Today`.

## Capabilities

### New Capabilities

- `toggle-component`: Reusable shared boolean toggle with accessible switch semantics and iOS-style presentation.
- `account-settings-preferences`: Settings section naming, presentation, and immediate persistence for timezone and Today View preferences.

### Modified Capabilities

None.

## Impact

- Adds a shared Svelte toggle component, component tests, shared-control inventory registration, documentation, and showcase examples.
- Updates the account preference section markup and save behavior.
- Adjusts StarToggle focus presentation and its component coverage.
- Updates account-page tests and relevant end-to-end coverage.
- Does not change backend preference APIs, persistence fields, or timezone validation.
