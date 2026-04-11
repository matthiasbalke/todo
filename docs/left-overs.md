# Left Over Tasks

Checkbox-based task list for tracking incomplete feature implementation tasks. Tasks are small and independently verifiable (automated or manual). See `docs/requirements.md` for full specifications.


---

## 1. Misc

### Backend

 * [ ] When registration using a passkey fails, the user is created anyway in the db, but without passkey. So a new registration attempt fails, because the email address is already registered. The account cannot be recovered by the user. Thats why, the user should only be persisted to the db, when the passkey registration was successull. 

### Frontend

 * [ ] The ItemForm keeps a single-user dropdown (picks first assignment). Multiple assignments must be possible.
 * [ ] Cursor-based pagination params (cursor, limit) are accepted but unused in the initial implementation — the response always returns all items in one page.


## 1. List Items

### Backend

### Frontend

* [ ] Way to delete all checked List Items from a list.
* [ ] Sort List items by dragging them.

## Next Features

