# Today View

Today is an optional virtual list shown above user-created list groups. It contains items assigned to the current user that are due on or before the current calendar date in the user's persisted IANA timezone.

- Completed qualifying items remain available in checked subsections so they can be reopened.
- Items are grouped by source list and source category. Source-list headings navigate to the regular list.
- Source-list roles still apply: owners and editors can mutate items, while viewer-source items are read-only.
- Today has dedicated per-user local preferences for sorting, Starred only, Hide checked, and collapsed sections. Manual sorting, assignment filters, item creation, and source structure management are unavailable.
- The overview count includes unfinished qualifying items only.
- Today data refreshes on load, visibility regain, and successful local mutations. It does not open cross-list SSE subscriptions.

Account settings provide the shared timezone picker and a Today enable/disable control. An account timezone is initialized once from the browser, with `UTC` as the fallback; later explicit choices are preserved.
