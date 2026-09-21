## Context

The admin frontend currently uses one `/admin` route that loads settings, usage statistics, and user lists together, then renders registration controls, application link settings, email settings, usage stats, and user management in one page. The app shell already exposes `/admin` from the authenticated user menu when the current user is an admin.

The backend admin APIs are already separated by concern (`/api/admin/settings`, `/api/admin/stats`, `/api/admin/users`, etc.), so the split can be frontend-focused without changing backend contracts.

## Goals / Non-Goals

**Goals:**

- Introduce a shared admin shell with section navigation.
- Split admin settings and user management into dedicated frontend routes.
- Avoid fetching user lists when an admin only needs settings.
- Keep `/admin` as a valid entry point from the user menu.
- Preserve all existing admin authorization behavior.
- Use a responsive navigation pattern: sidebar on wider screens, compact section navigation on small screens.

**Non-Goals:**

- Change backend admin API routes or response shapes.
- Add a new overview/dashboard section.
- Redesign individual settings or user-management controls beyond moving them.
- Add audit logging or new admin capabilities.

## Decisions

### Use nested admin routes with a shared layout

Create a nested admin route structure:

```text
frontend/src/routes/(app)/admin/
├─ +layout.svelte
├─ +page.ts
├─ settings/
│  ├─ +page.ts
│  └─ +page.svelte
└─ users/
   ├─ +page.ts
   └─ +page.svelte
```

The admin layout owns the admin title, short description, and navigation. The leaf pages own their data loading and workflow state.

Alternative considered: keep a single `/admin` page with in-page tabs. That would be a smaller visual change, but it would keep the heavy combined data load and make deep-linking to user management or settings less explicit.

### Redirect `/admin` to `/admin/settings`

Keep `/admin` as the stable admin entry point, but route it to `/admin/settings`. This preserves the existing user-menu link and gives admins a predictable default section.

Alternative considered: render settings directly at `/admin` and users at `/admin/users`. That saves one redirect but makes route semantics less uniform as more admin sections are added.

### Load data per section

`/admin/settings` should load only admin settings. `/admin/users` should load usage stats and users. This keeps settings work independent from potentially large user lists and makes test setup more focused.

Alternative considered: load all admin data in the shared layout and pass it down. That centralizes fetching but reintroduces the current page's coupling and wastes work on settings-only visits.

### Put usage stats on Users for now

Usage stats should move with user management because most current stats are account/list totals and the Users page is the only non-settings admin section. Avoid adding an Overview page until there is enough independent dashboard content.

Alternative considered: add `/admin/overview`. That could become useful later, but it would initially be a sparse page and add navigation weight without a clear workflow.

### Use responsive navigation, not two separate experiences

On wider screens, show a persistent sidebar within the admin content area. On small screens, show compact section navigation at the top of the admin area. Both should expose the same Settings and Users destinations and active state.

Alternative considered: use a drawer menu on mobile. That is heavier than needed for two sections and would make common switching slower.

## Risks / Trade-offs

- [Route refactor breaks existing tests] -> Update unit and E2E tests to navigate to explicit admin subsections and keep `/admin` redirect coverage.
- [Duplicated state between old and new page components] -> Move settings and user-management logic wholesale into the new pages rather than temporarily rendering both structures.
- [Admin UI becomes too wide for the app shell] -> Keep the existing app max-width initially; if the sidebar feels cramped, adjust only the admin shell content width as part of the implementation.
- [Future sections outgrow simple navigation] -> The nested route shape supports adding Overview, Audit, or Email-specific sections later without changing the entry-point behavior.

## Migration Plan

1. Add the admin layout and redirect entry route.
2. Move settings controls and settings data loading to `/admin/settings`.
3. Move usage stats and user management with their data loading to `/admin/users`.
4. Update user-menu/admin tests and E2E routes to use the new section URLs where needed.
5. Keep backend APIs unchanged so rollback is limited to frontend route structure.
