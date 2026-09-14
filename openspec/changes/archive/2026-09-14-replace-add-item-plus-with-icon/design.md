## Context

See `proposal.md` for motivation. The regular list page currently renders the collapsed fixed-footer add-item action as a shared `Button` with literal text `+ add item`. The app already has an icon system and uses Lucide icons for nearby creation and navigation controls, including list overview creation actions.

## Goals / Non-Goals

**Goals:**

- Replace the visible literal plus character in the regular list add-item action with an icon that matches the list overview add-list action.
- Preserve the existing button component usage, footer placement, editable-user gating, and form-opening behavior.
- Keep the action accessible by the same user-facing command name, `add item`.
- Update tests that locate or assert the old `+ add item` text.

**Non-Goals:**

- Redesign the fixed action footer or add-item form.
- Change grocery mode, today view, list overview creation actions, or backend authorization.
- Introduce a new icon library or new shared button API.

## Decisions

- Use the existing `Icon` component with the registered plus icon and the same `action` size preset used by the list overview add-list action.
  - Rationale: This follows the project icon system and keeps icon rendering consistent with the matching creation control.
  - Alternative considered: Inline the `+` as text or raw SVG. That would leave this action inconsistent with the rest of the icon-system migration.

- Keep the button's accessible name as `add item`.
  - Rationale: The visible label remains `add item`, while the icon is decorative for assistive technology. Tests and assistive technology should target the command, not the presentational plus mark.
  - Alternative considered: Expose the icon as part of the accessible name. That would preserve old test queries but would make the command name unnecessarily noisy.

- Scope implementation to the regular list collapsed add-item action.
  - Rationale: Issue 257 targets "Add item" specifically, and the regular list spec contains the matching compact footer requirement. Other creation actions already have separate requirements or are outside this issue.
  - Alternative considered: Audit every plus-like creation action. That is better handled as a separate UI consistency change if needed.

## Risks / Trade-offs

- Icon name mismatch or registry coverage → Verify the plus icon is already registered before using it, or add it through the existing icon registry pattern.
- Test selectors still use the old literal label → Update unit tests to query `add item` and assert the literal `+ add item` text is absent.
- Visual spacing changes from icon insertion → Keep the existing large bare button styling and the same action-size plus icon used by the add-list action.
