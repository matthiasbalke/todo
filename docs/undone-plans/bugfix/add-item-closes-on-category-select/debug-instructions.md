When # Debug Instructions for iOS Picker Bug

## What to do:

1. **Deploy/run the frontend with the debug logging added** (you'll see console.log statements)

2. **On your iPhone, open the app in Safari**

3. **Open Safari Developer Console** (on same Mac connected to iPhone):
   - Plug in iPhone via USB
   - Open Safari on Mac
   - Menu: Develop → [Your iPhone Name] → [Your App Tab]
   - Click "Console" tab

4. **Reproduce the bug:**
   - Click "+ Add item"
   - Look at console - you should see: `[ItemForm focusout]`
   - Tap the Category dropdown
   - **Look for these logs:**
     - `[handlePickerBlur] Redirecting focus to title input` ← Should happen when picker closes
     - OR `[ItemForm] Calling oncancel due to focus loss` ← Shows dialog is closing

5. **Share what you see** in the console logs

## What the logs mean:

- If you see `[handlePickerBlur]` → The onblur handler IS being called ✓
- If you see `[ItemForm] Calling oncancel` → The dialog is closing via focusout
- If you see neither → Something else is closing the dialog

This will tell us exactly what's happening!
