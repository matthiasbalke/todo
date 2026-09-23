## 1. Route Structure

- [x] 1.1 Add a shared `/admin` layout with Settings and Users navigation, and verify both destinations render within the authenticated app shell
- [x] 1.2 Add the `/admin` entry route redirecting to `/admin/settings`, and verify the existing Admin menu link still lands on the Settings section
- [x] 1.3 Add `/admin/settings` page and loader for admin settings only, and verify registration, public app URL, and email settings render without user-management controls
- [x] 1.4 Add `/admin/users` page and loader for admin stats and users only, and verify usage stats and user-management controls render without settings controls

## 2. Workflow Migration

- [x] 2.1 Move registration, public app URL, and email settings state/actions into the Settings page, and verify existing settings tests pass without backend API changes
- [x] 2.2 Move user editing, admin/block toggles, recovery link creation, and related state/actions into the Users page, and verify existing user-management tests pass without backend API changes
- [x] 2.3 Preserve admin authorization behavior for `/admin`, `/admin/settings`, and `/admin/users`, and verify unauthenticated and non-admin access is rejected

## 3. Navigation Behavior

- [x] 3.1 Implement desktop sidebar active-state styling, and verify Settings and Users links show the active section on wide viewports
- [x] 3.2 Implement compact small-screen admin navigation, and verify Settings and Users remain reachable without a permanent sidebar
- [x] 3.3 Update frontend navigation tests for the `/admin` redirect, section links, active states, and small-screen navigation

## 4. E2E and Verification

- [x] 4.1 Update Playwright admin and email tests to navigate to `/admin/settings` or rely on the `/admin` redirect where appropriate, and verify the affected specs pass
- [x] 4.2 Update Playwright user-management tests to navigate to `/admin/users`, and verify the affected specs pass
- [x] 4.3 Run `cd frontend && bun run check` and verify Svelte type checking passes
- [x] 4.4 Run `cd frontend && bun run test -- --run` and verify frontend unit tests pass
- [x] 4.5 Run relevant admin/settings/user E2E tests against the local HTTPS deployment, or ask the user to run them if Docker/Testcontainers are required
- [x] 4.6 Run `openspec validate split-admin-area-navigation --strict` and verify the change is valid

## 5. Follow-up Layout Refinement

- [x] 5.1 Consider widening the authenticated app main content container for `/admin` routes only on desktop, while keeping the header width stable and preserving the existing narrow width for todo routes and current small-screen behavior
