# Bug: Item Add Dialog Closes on iOS Native Picker Selection

## Status
**CRITICAL DEBUG INFO FOUND** - Root cause identified, solution ready to implement

## Problem
When selecting a value from a native iOS picker (category, due date, recurrence), the "Add Item" dialog closes immediately after selection completes.

## Root Cause (CONFIRMED via console logs)
The issue is in the focus redirect logic. When we call `titleInput.focus()` after the picker closes:

1. Picker closes → `handlePickerBlur()` is called
2. `titleInput.focus()` redirects focus to title input
3. **Browser fires focusout event on the form element** with `relatedTarget: undefined`
4. At this point, `ignoreNextFocusOut: false` (it was only set on mousedown)
5. Form's focusout handler sees `relatedTarget: undefined, isContained: false`
6. Dialog closes via `oncancel()`

## Console Evidence
```
[handlePickerBlur] Redirecting focus to title input
[ItemForm focusout] – {submitting: false, ignoreNextFocusOut: false, isNew: true, relatedTarget: undefined, isContained: false}
[ItemForm] Calling oncancel due to focus loss
```

Key observation: `ignoreNextFocusOut` is `false` when the focusout fires after the focus redirect.

## Solution
Set `ignoreNextFocusOut = true` in `handlePickerBlur()` before redirecting focus:

```svelte
function handlePickerBlur() {
  ignoreNextFocusOut = true;
  setTimeout(() => { ignoreNextFocusOut = false; }, 0);
  titleInput?.focus();
}
```

This way, when the focus redirect causes a focusout event on the form, the flag is already set to prevent `oncancel()` from firing.

## Implementation Steps
1. Update `handlePickerBlur()` to set `ignoreNextFocusOut` before calling `titleInput.focus()`
2. Remove debug console.log statements
3. Test on iPhone to verify dialog stays open
4. Run full test suite
5. Clean up any test cases that tested the timeout logic (no longer needed)

## Files to Modify
- `frontend/src/lib/components/ItemForm.svelte` - Update handlePickerBlur function and remove debug logs
- `frontend/src/lib/components/ItemForm.test.ts` - Update/remove tests related to timeout behavior

## Context
- Bug reported: Dialog closes 500ms-1s after selecting from iOS picker
- Initial attempts: Added timeout flags, focus event handlers, etc. - none worked
- Root cause discovery: Console logging revealed `ignoreNextFocusOut` was not set when the problematic focusout fired
- This is a simple one-line fix!
