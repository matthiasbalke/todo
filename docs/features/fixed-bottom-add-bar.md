# Fixed Bottom Add Bar

## Overview

The "+ New list" and "+ Add item" buttons are fixed to the bottom of the viewport so they are always visible without scrolling, regardless of how many items are on screen.

## Affected Pages

- `/lists` — "+ New list" button
- `/lists/[id]` — "+ Add item" button

## Design Decisions

- **`fixed bottom-0 left-0 right-0 z-20`** — pins the bar to the viewport bottom; `z-20` is above the header (`z-10`) and dropdown menus (`z-20` + `z-10` backdrop), so the bar stays visible but dialogs (which use `fixed inset-0`) cover it naturally.
- **`max-w-2xl mx-auto` on the inner container** — matches the app layout's content width constraint so the button aligns with the list/item content on wide screens.
- **`pb-20` on the scrollable content** — prevents the last list card or item from being hidden behind the fixed bar.
- **`max-h-[70vh] overflow-y-auto` on the form wrapper** — `ItemForm` has 6+ fields and can be tall on mobile; capping at 70 vh keeps it scrollable within the bar without covering the whole screen.
- **No changes to `ListForm` or `ItemForm`** — only the containing pages changed; the form components are unaffected.

## Security Notes

No security-relevant changes. This is a pure layout/UX change with no new API calls, no new data handling, and no changes to auth or permission logic.
