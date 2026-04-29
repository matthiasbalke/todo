# Left Over Tasks

Task list for tracking incomplete feature implementation tasks.
Tasks are small and independently verifiable (automated or manual). See `docs/requirements.md` for full specifications.

---

## 1. Misc
 * Cursor-based pagination params (cursor, limit) are accepted but unused in the initial implementation — the response always returns all items in one page.


## 1. List Items
 * Way to delete all checked List Items from a list.


## 1. Account Settings
 ### Notifications
  * Users should be able to configure on which events they want push notifications to be send
    * Item was assigned to me
    * Assigned Item is due today
    * Assigned Item is overdue

## 1. Production
 * how do we monitor exceptions and errors in backend and frontend?
 * how to monitor functional metrics like, #registered users, #lists, mean(items per list), max(items per list), min(items per list)