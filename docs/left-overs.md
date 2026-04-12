# Left Over Tasks

Task list for tracking incomplete feature implementation tasks.
Tasks are small and independently verifiable (automated or manual). See `docs/requirements.md` for full specifications.

---

## 1. Misc

 * Add List should always be displayed fixed at the bottom.
 * Cursor-based pagination params (cursor, limit) are accepted but unused in the initial implementation — the response always returns all items in one page.


## 1. List Items
 * Add Item should always be displayed fixed at the bottom.
 * The ItemForm keeps a single-user dropdown (picks first assignment). Multiple assignments must be possible.
 * Stars are not vertically aligned
 * Way to delete all checked List Items from a list.


## 1. List Categories

 * Edit Category, cannot change color.
 * Remember last uses category per list and select it as default for next item.


## 1. Production
 * how do we monitor exceptions and errors in backend and frontend?
 * how to monitor functional metrics like, #registered users, #lists, mean(items per list), max(items per list), min(items per list)