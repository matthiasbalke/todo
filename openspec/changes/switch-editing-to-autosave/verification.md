# Item editor scrolling verification

Date: 2026-09-15

## Automated browser verification

The configured shared HTTPS deployment returned `status: UP` from `/actuator/health` using the repository certificate. Tests ran against that deployment; no local stack was started.

```zsh
source scripts/load-local-domain.sh
cd e2e
BASE_URL="https://${LOCAL_HTTPS_DOMAIN}" bunx playwright test \
  tests/item-editor-scroll.spec.ts tests/items.spec.ts \
  tests/components.spec.ts tests/lists.spec.ts \
  --grep 'Item editor scrolling|Item detail|Component showcase controls|section navigation|add item form'
```

Result: **17 passed**, including setup, in Chromium.

Coverage includes initial title alignment and lowest-field alignment on a short page; mouse-down stability, touch activation, keyboard field changes, viewport resizing, retained trailing space, and manual page scrolling; long dropdown keyboard and wheel scrolling without document displacement; calendar focus containment; long notes with visible Save/Cancel, internal scrolling, and focus/document restoration; slow-save focus ownership including leaving and returning to the same input; quick-add creation and draft preservation; and shared Select/invitation control consumers.

Browser verification caught and resolved minimum-height layout absorbing spacer growth, stationary-pointer hover changing the keyboard-highlighted option, and popup scroll events triggering unwanted option repositioning. Spacer measurement now accounts for unused minimum-height space, option highlighting follows pointer movement, and panel-internal scrolling does not trigger viewport correction.

Viewport resizing and touch emulation in desktop Chromium do **not** verify native software-keyboard behavior.

## Frontend and specification checks

- `bun run check`: passed, zero errors and warnings.
- `bun run test -- --run`: **723 passed across 78 files**. Includes delayed viewport events, canceled gestures, queued zoom cancellation, minimum-height scroll limits, teardown, slow-save focus sessions, shared controls, and quick-add drafts.
- `openspec validate switch-editing-to-autosave --strict`: passed.
- Backend files and endpoint contracts are unchanged; backend tests were not required.

## Real devices — pending (task 5.8)

No real devices were available in this environment. No device/browser version or native keyboard outcome is claimed.

| Environment | Result |
| --- | --- |
| Real iOS Safari | Not run — device unavailable |
| Installed iOS PWA | Not run — device unavailable |
| Real Android Chrome | Not run — device unavailable |

On each device, record OS/browser versions and check keyboard opening/dismissal, viewport panning, rapid field changes during slow saves, manual scrolling, portrait/landscape changes, and long notes editing with Save/Cancel and position restoration. Task 5.8 remains unchecked until those results are recorded.
