# Item Form Field Order

## Overview

Reorders the fields in `ItemForm.svelte` so the most commonly filled fields appear first, reducing scrolling and cognitive load. The new order is: title → category → due date → recurrence → assignee → notes.

## Design decisions

- Notes moved to the bottom: it's optional and less frequently used than category/due date.
- Category promoted above due date: users typically categorize before scheduling.
- No structural or logic changes — purely a template reorder.

## Security considerations

No security impact. This is a pure UI change.

## Implementation plan

1. Reorder the form fields in `ItemForm.svelte` to: title, category, due date, recurrence, assignee, notes.

## Tasks

- [x] Reorder form fields in `frontend/src/lib/components/ItemForm.svelte`
