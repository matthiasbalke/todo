# Category Config: Mobile Visibility & Color Picker Fix

## Overview

Two usability bugs in `CategoryConfigDialog.svelte` made the category configuration unusable on mobile. Edit and delete buttons were hidden behind a CSS hover state that touch devices cannot trigger. Separately, clicking a color swatch while editing a category closed edit mode before the color change was saved, because the input's `onblur` handler fired before the swatch's `onclick`.

## Design Decisions

### Mobile button visibility

**Problem:** `opacity-0 group-hover:opacity-100` is invisible on touch devices because there is no hover state.

**Fix:** Use `sm:opacity-0 sm:group-hover:opacity-100` instead of `opacity-0 group-hover:opacity-100`. This makes the buttons always visible on small screens (mobile) and hover-only on `sm` and above (≥640 px, typically desktop/tablet with mouse).

**Alternative considered:** `@media (hover: none)` via a custom Tailwind variant. Rejected as more complex and less idiomatic — the screen-size breakpoint is a well-understood proxy for touch vs. pointer devices in this app.

### Color picker blur conflict

**Problem:** The edit name input uses `onblur={() => commitEdit(cat)}` to auto-save when focus leaves. When the user clicks a color swatch, the browser fires `blur` on the input before `click` on the swatch. `commitEdit` saves and sets `editingId = null`, ending edit mode. The `onclick` then fires, but `editingColor` is updated after the save has already been dispatched, so the color change is lost.

**Fix:** Add `onmousedown={(e) => e.preventDefault()}` to the color swatch buttons in edit mode. `preventDefault` on `mousedown` stops the browser from moving focus away from the input, so `blur` is never triggered, and the `onclick` can update `editingColor` while edit mode remains open.

This is the standard browser technique for toolbar buttons (like bold/italic in rich-text editors) that must not steal focus from the active input.

## Security Considerations

Pure frontend UI change. No new API calls, no data exposed beyond what the existing dialog already shows. No security impact.

## Implementation Plan

1. In `CategoryConfigDialog.svelte`, change edit/delete button classes from `opacity-0 group-hover:opacity-100` to `sm:opacity-0 sm:group-hover:opacity-100` so buttons are always visible on mobile.
2. Add `onmousedown={(e) => e.preventDefault()}` to each color swatch button in the inline-edit row to prevent the name input from losing focus on click.
3. Run `bun run check` and `bun run test --run` to verify no regressions.
