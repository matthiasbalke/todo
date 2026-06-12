## 1. Shared Color Foundation

- [x] 1.1 Define the semantic selected-menu blue in `frontend/src/app.css` and expose it as a Tailwind text-color utility.
- [x] 1.2 Remove the conflicting `text-inherit` utility from the shared Button bare variant while preserving normal inherited-color behavior.
- [x] 1.3 Extend Button tests to verify bare buttons accept an explicit semantic text color without retaining a conflicting text utility.

## 2. Burger Menu Selected States

- [x] 2.1 Replace hard-coded selected filter and sort-field colors in the standard list menu with the semantic selected-menu utility.
- [x] 2.2 Apply the semantic selected-menu utility to enabled "Hide checked" in the standard list menu and retain neutral styling when disabled.
- [x] 2.3 Apply the same selected filter, sort-field, and hide-checked styling to the grocery list menu.
- [x] 2.4 Keep selection check-mark spans free of independent color utilities so they inherit the blue selected-row color.

## 3. Regression Coverage

- [x] 3.1 Extend standard list route tests to verify blue selected labels and check marks, neutral unselected rows, and hide-checked state transitions.
- [x] 3.2 Extend grocery list route tests to verify blue selected labels and check marks, neutral unselected rows, and hide-checked state transitions.
- [x] 3.3 Run focused Button and route tests, the full frontend test suite, `svelte-check`, and the production frontend build.
