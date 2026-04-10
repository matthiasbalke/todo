# Left Over Tasks

Checkbox-based task list for tracking incomplete feature implementation tasks. Tasks are small and independently verifiable (automated or manual). See `docs/requirements.md` for full specifications.


---

## 1. Misc

### Backend

### Frontend
  
 * [ ] /bugifx skill. write unit tests / integration tests to prevent regressions in the future and verify the wanted behavior. fix the code. run all test suites avalable. tests should be green.
 * [ ] /feature skill. when implementing features, always check for warnings and errors and fix them right away. 
 * [ ] The ItemForm keeps a single-user dropdown (picks first assignment). Multiple assignments must be possible.
 * [ ] Cursor-based pagination params (cursor, limit) are accepted but unused in the initial implementation — the response always returns all items in one page.


## 1. List Items

### Backend

### Frontend

* [ ] Way to delete all checked List Items from a list.
* [ ] Sort List items by dragging them.

## Next Features

* docs/account-management.md: /feature lets implement the account management. ask me anything you need to know to create a plan. Display name should be editable inline. email editing, should be possible. passkey management: list of registered keys, device names/date. ability to remove registered passkey, if its not the last login    
method. add a new passkey for a new device. no oauth yet. after deleting the account show a your account has been deleted page. account management should be accessible via the already existing user menu (top/right), above logout.
  * can we check if the user tries to delete the passkey he is logged in with on this device? should we even check that?