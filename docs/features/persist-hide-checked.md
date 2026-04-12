# Persist "Hide Checked" State per List

## Overview

The "Hide checked" toggle on the standard and grocery list pages controls whether done items are shown. Currently this state lives only in an in-memory Svelte store and resets to `false` on every page reload. This feature persists the setting to `localStorage` per list, consistent with how sort/filter preferences are already stored via `listPrefs.ts`.

## Design Decisions

**Add `hideDone` to `listPrefs.ts`** rather than creating a new file or moving persistence into the store.

- `hideDone` is a per-list UI preference, conceptually identical to `starredOnly`, `hideFuture`, etc. that already live in `ListPrefs`.
- Reuses the existing `loadListPrefs` / `saveListPrefs` path — no new localStorage key, no new abstraction.
- Keeps persistence logic in page components (consistent with sort/filter pattern) rather than the store.
- `hideDone` is added as optional (`boolean | undefined`) so existing saved prefs without the field keep working — default stays `false`.

**Initialize the store from saved prefs at component setup time** (outside any `$effect`) by calling `setHideDone(listId, savedPrefs?.hideDone ?? false)`. The existing `$effect` that saves prefs is extended to include `hideDone: isHideDone(listId)` — because `isHideDone` reads reactive state, the effect automatically re-runs whenever the toggle changes.

## Security Considerations

Pure client-side localStorage state — no server interaction, no authentication surface. Consistent with all other `listPrefs` persistence.

## Implementation Plan

1. Add optional `hideDone?: boolean` field to `ListPrefs` type in `listPrefs.ts`.
2. In `lists/[id]/+page.svelte`, initialise `hideDone` from saved prefs and include it in the save effect.
3. In `lists/[id]/grocery/+page.svelte`, same changes.
4. Add / extend tests in `listPrefs.test.ts` to cover the `hideDone` field.

## Tasks

- [x] Add `hideDone?: boolean` to `ListPrefs` in `listPrefs.ts`
- [x] Standard page: seed `setHideDone` from saved prefs on mount; save `hideDone` in the prefs effect
- [x] Grocery page: seed `setHideDone` from saved prefs on mount; save `hideDone` in the prefs effect
- [x] Tests: round-trip with `hideDone: true`, verify key format unchanged, verify missing field defaults to `false`
