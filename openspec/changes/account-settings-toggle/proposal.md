## Why

The account page currently presents user preferences as a Today-specific section with a generic button for enabling the feature, which does not communicate boolean state as clearly as a switch. Renaming the page to Settings and adding explanatory timezone text will make the preference surface clearer and more consistent.

## What Changes

- Rename the account page heading from `Account` to `Settings`.
- Add concise supporting text below the timezone selector explaining that the selected timezone determines date-sensitive behavior such as which items appear in Today.
- Replace the current `Today view: Enabled/Disabled` button with a row labeled `Today View` and an iOS-style on/off toggle.
- Add a reusable shared toggle component with bindable checked state, disabled behavior, accessible switch semantics, labels, callbacks, and consistent visual styling.
- Add toggle examples and API guidance to the development component showcase.
- Preserve the existing explicit preference save flow, error feedback, persisted values, and Today refresh behavior.

## Capabilities

### New Capabilities

- `toggle-component`: Reusable shared boolean toggle with accessible switch semantics and iOS-style presentation.
- `account-settings-preferences`: Account Settings naming and presentation for timezone and Today View preferences.

### Modified Capabilities

None.

## Impact

- Adds a shared Svelte toggle component, component tests, exports, documentation, and showcase examples.
- Updates the account page heading and preference section markup.
- Updates account-page tests and relevant end-to-end coverage.
- Does not change backend preference APIs, persistence fields, or timezone validation.
