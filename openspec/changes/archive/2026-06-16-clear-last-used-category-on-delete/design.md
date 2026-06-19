## Context

The regular list page remembers the category used for newly created items in `localStorage` via `listItemDefaults`. That remembered value is passed to `ItemForm` as `defaultCategoryId`, and `ItemForm` initializes and resets its category Select from that value.

Category deletion already removes the backend category and causes existing items to become uncategorized. However, if the locally remembered `lastCategoryId` points to the deleted category, the frontend can still pass that stale ID into the new-item form. `ItemForm` currently displays unknown category IDs as raw values, so the user sees a UUID-like category label and can submit a create request that the backend rejects.

## Goals / Non-Goals

**Goals:**

- Prevent stale locally remembered category IDs from appearing in the new-item category Select.
- Ensure new item creation submits `null` when the remembered default category no longer exists.
- Keep remembered defaults working for valid categories.
- Cover both direct form behavior and list-page persistence behavior with frontend tests.

**Non-Goals:**

- Changing backend category deletion semantics.
- Changing item category foreign key behavior or migrations.
- Clearing all list preferences when one category is deleted.
- Altering edit-item behavior for historic items whose category ID is missing for reasons outside normal category deletion.

## Decisions

1. Validate new-item defaults against the current category list before use.

   The list page should derive an effective default category from `lastCategoryId` only when that ID is present in the current `categories` collection. If the ID is missing, it should treat the default as `undefined`/uncategorized and persistently clear the stale local default.

   Alternative considered: let `ItemForm` alone normalize missing defaults. That avoids page logic, but leaves stale data in `localStorage` and can reappear when the form is remounted.

2. Make `ItemForm` resilient to stale `defaultCategoryId`.

   `ItemForm` should initialize and reset new-item category state to `''` when `defaultCategoryId` does not match an available category. This keeps the component safe when used by any caller and prevents raw missing IDs from being displayed for new items.

   Alternative considered: keep displaying unknown IDs so users can notice stale data. That preserves current behavior, but it is the reported bug and leads to backend validation failure.

3. Preserve edit-item missing-category handling unless implementation can safely improve it without broadening scope.

   The issue concerns the locally remembered new-item default after category deletion. Existing item records should normally be uncategorized by the backend. Tests should focus on new-item defaults so the change does not accidentally redefine unrelated edit behavior.

## Risks / Trade-offs

- Stale defaults may be cleared before categories finish loading → only clear after the category list has been loaded for the current list, or ensure the current store state is authoritative for that render.
- SSE category deletion and explicit category deletion can update state through different paths → centralize stale-default cleanup around the derived category collection rather than only one delete action.
- A valid category could be temporarily absent during refresh → fallback to uncategorized is acceptable because it avoids invalid submissions and the user can select the category again after it is available.
