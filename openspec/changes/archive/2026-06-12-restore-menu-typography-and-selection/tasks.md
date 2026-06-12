## 1. Shared Button Typography

- [x] 1.1 Add a typed `weight` prop to the shared Button with `normal` and `medium` values, defaulting to `medium`, and replace the unconditional `font-medium` base class.
- [x] 1.2 Extend the shared Button tests to cover the default medium weight, explicit normal weight, and compatibility with existing alignment, variant, size, and custom class behavior.

## 2. Menu Typography And Selection

- [x] 2.1 Apply normal font weight to account menu actions and to primary actions, submenu headers, submenu options, direction actions, hide actions, and delete actions in the standard and grocery list burger menus.
- [x] 2.2 Remove medium font weight from selected sorting, filtering, and related option states while preserving their blue text highlight, neutral unselected text color, and selection indicators.
- [x] 2.3 Update app layout, standard list, and grocery list tests to verify regular menu typography, blue selected entries, neutral unselected entries, and unchanged menu behavior.

## 3. Documentation And Verification

- [x] 3.1 Document the shared Button weight API and the menu selected-state styling convention in the relevant component documentation or showcase.
- [x] 3.2 Run the focused shared Button, app layout, standard list, and grocery list tests.
- [x] 3.3 Run the full frontend test suite, type and static checks, and production build.
- [x] 3.4 Validate the OpenSpec change artifacts.
