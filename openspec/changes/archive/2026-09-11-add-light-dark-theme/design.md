## Context

See proposal.md for motivation. The app already stores user-level preferences on the `User` entity for timezone initialization and Today visibility, exposes them through `/api/users/me`, and updates them through `/api/users/me/preferences`. The frontend loads preferences during authenticated app layout startup and the account page already saves preference changes immediately.

Styling currently depends on Tailwind utilities plus a growing set of semantic shared-control conventions. Theme support should strengthen the semantic token model instead of introducing page-by-page color forks.

## Goals / Non-Goals

**Goals:**
- Persist one theme preference per user and return it anywhere the frontend receives user preferences.
- Keep the existing immediate-save account settings behavior for timezone and Today while adding theme selection.
- Apply the effective light or dark theme before authenticated page content becomes interactive.
- Centralize production theme colors behind semantic tokens used by shared controls and app surfaces.
- Keep diagnostic palette behavior useful for detecting hard-coded styling.

**Non-Goals:**
- Anonymous pre-login theme persistence beyond a sensible default/system theme.
- Per-device theme preferences separate from the account preference.
- A full visual redesign of every screen.
- Theme customization beyond the supported system, light, and dark options.

## Decisions

1. Store theme preference as an enum-like backend value on the user record.

   Add a nullable-safe migration with default `SYSTEM` for new and existing users, map it into user profile responses, and accept it in the existing preferences update request. This keeps account preferences cohesive and avoids a separate endpoint for one field.

   Alternative considered: store theme only in browser local storage. That would avoid a migration, but it would not satisfy cross-device persistence and would make account settings less predictable.

2. Extend the existing preference update operation to submit all current preference values.

   The account page should continue treating settings as one immediate-save group. The frontend will include timezone, Today visibility, and theme in each save request, then replace local state with the returned profile values.

   Alternative considered: patch only the changed preference field. That would reduce request payload size, but it adds partial-update semantics and more backend branching for little practical benefit.

3. Represent the stored preference separately from the effective rendered theme.

   `SYSTEM` remains the stored preference. The frontend computes an effective `light` or `dark` theme from `prefers-color-scheme`, updates it when the media query changes, and ignores system changes while `LIGHT` or `DARK` is selected.

   Alternative considered: resolve `SYSTEM` on the backend. The browser is the source of the system color-scheme signal, so backend resolution would either be stale or require extra client hints.

4. Apply theme through a root document attribute and semantic CSS variables.

   Use a root attribute such as `data-theme="light|dark"` for the effective theme and define semantic variables for app backgrounds, surfaces, text, borders, muted text, focus, success, danger, selected state, and form controls. Components should consume those semantic tokens directly or through Tailwind theme mappings.

   Alternative considered: Tailwind `dark:` variants throughout production pages. That is quick locally but spreads theme decisions across many files and conflicts with the existing semantic-component-styling direction.

5. Update PWA/browser chrome metadata from the effective theme.

   The frontend should update the document `theme-color` meta tag when the effective theme changes. The static manifest can keep a safe default, while runtime metadata reflects the current session.

   Alternative considered: generate separate manifests per theme. Runtime metadata is simpler and enough for browser chrome behavior.

6. Keep component showcase theme inspection local to the development route.

   The `/components` showcase should expose a selector for `System`, `Light`, `Dark`, and `Diagnostic`. `System`, `Light`, and `Dark` reuse the same effective-theme rules as the app, while `Diagnostic` remains a showcase-only inspection mode for semantic token coverage. The selector must not call the account preferences API, expand the persisted user preference enum, or rely on a floating diagnostic control installed by the root layout.

   Alternative considered: add `DIAGNOSTIC` as a persisted user preference. That would leak a development/debugging aid into production account behavior and complicate the backend contract without user value.

## Risks / Trade-offs

- [Risk] Early startup can briefly show the wrong theme before authenticated preferences load -> Mitigation: default to system theme immediately, then apply the persisted user preference as soon as profile data is available.
- [Risk] Existing hard-coded Tailwind colors can remain invisible in one theme -> Mitigation: extend foundation/component tests and keep diagnostic palette checks around semantic token usage.
- [Risk] The existing preferences endpoint becomes a broader contract -> Mitigation: cover request validation and response shape with backend integration tests and frontend API tests.
- [Risk] Dark theme contrast regressions can be subtle -> Mitigation: add Playwright coverage for representative app surfaces in both themes and include shared controls, dialogs, menus, and forms.
- [Risk] Diagnostic palette could be confused with a user-selectable theme -> Mitigation: keep diagnostic mode local to `/components` and test that persisted account values remain `SYSTEM`, `LIGHT`, and `DARK`.

## Migration Plan

1. Add a database migration for the theme preference with default `SYSTEM`.
2. Deploy backend support before or with frontend support so older users receive a default theme value.
3. Update frontend preference loading to tolerate missing theme values only as a temporary compatibility fallback to `SYSTEM`.
4. Roll back safely by leaving the unused database column in place if frontend changes are reverted.
