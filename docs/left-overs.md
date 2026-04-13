# Left Over Tasks

Task list for tracking incomplete feature implementation tasks.
Tasks are small and independently verifiable (automated or manual). See `docs/requirements.md` for full specifications.

---

## 1. Misc
  * Cursor-based pagination params (cursor, limit) are accepted but unused in the initial implementation — the response always returns all items in one page.


## 1. List Items
 * The ItemForm keeps a single-user dropdown (picks first assignment). Multiple assignments must be possible.
 * Stars are not vertically aligned
 * Way to delete all checked List Items from a list.


## 1. Production
 * how do we monitor exceptions and errors in backend and frontend?
 * how to monitor functional metrics like, #registered users, #lists, mean(items per list), max(items per list), min(items per list)