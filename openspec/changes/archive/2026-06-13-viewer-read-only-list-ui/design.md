## Context

The backend already enforces a three-role authorization model:

- `OWNER` can mutate items and categories, edit or delete the list, and manage membership.
- `EDITOR` can mutate items and categories but cannot edit the list or manage membership.
- `VIEWER` can read list data only.

The frontend does not receive the current user's role in list summary or detail responses. Individual routes compensate by loading all members or omit permission handling entirely, leaving viewers with controls that produce rejected write requests. This affects standard lists, grocery mode, item details, category configuration, and item cards. It also prevents safe reuse of item components in a future cross-list Today view where adjacent items can have different permissions.

## Goals / Non-Goals

**Goals:**

- Make list permissions available at the normal list API and store boundary.
- Define one frontend mapping from roles to semantic UI capabilities.
- Ensure all write affordances visible from list routes match backend authorization.
- Give viewers useful read-only item and membership presentations.
- Preserve existing owner and editor behavior.
- Prepare item components to receive per-list or per-item capabilities in future aggregate views.

**Non-Goals:**

- Changing backend role definitions or endpoint authorization.
- Adding a Today view or any cross-list item endpoint.
- Adding new roles, per-item permissions, or category-specific permissions.
- Preventing viewers from changing local display preferences or personal list grouping.
- Redesigning the overall list or item visual language beyond what read-only presentation requires.

## Decisions

### Include the current user's role in list DTOs

`ListSummaryDto` and `ListDto` will include `role: ListRole`. The controller will obtain the authenticated user's membership when mapping each response.

This keeps permission data attached to the resource whose controls it governs and removes the need to load the complete member roster merely to identify the current user's role. Returning only the current user's role also avoids coupling authorization-aware rendering to member-list availability.

Alternative considered: add a separate permissions endpoint. This would add requests and synchronization concerns without providing information not already known while authorizing the list response.

### Derive semantic capabilities in one frontend helper

The frontend will map a `ListRole` to a capability object such as:

```ts
interface ListCapabilities {
  canEditItems: boolean;
  canManageCategories: boolean;
  canEditList: boolean;
  canManageMembers: boolean;
}
```

Routes will obtain capabilities from the stored list and pass only the relevant booleans to child components. Components such as `ItemCard` and `GroceryCategorySection` will accept `editable` rather than importing or interpreting `ListRole`.

This separates authorization vocabulary from presentation and supports future aggregate views where capabilities are supplied per item.

Alternative considered: compare role names in each component. That is simpler locally but creates duplicated policy and makes later role changes error-prone.

### Use non-interactive indicators for viewer item state

Viewer item cards and grocery rows will render completion and starred state as visual information, not as disabled buttons. Swipe-delete listeners and delete backgrounds will not be installed for read-only cards. Drag handles and drag zones remain governed by edit capability.

Disabled write controls were rejected because they continue to advertise unavailable actions and require explanations for permissions that are already inherent to the viewer role.

### Provide a dedicated read-only detail presentation

The item detail route will branch on `canEditItems`. Editors and owners retain `ItemForm` and deletion. Viewers receive a read-only detail component or equivalent semantic markup covering all item fields.

Reusing `ItemForm` with every input disabled was rejected because a disabled form still presents editing language and save-oriented structure. A read-only detail presentation is clearer and can later be reused by aggregate views.

### Gate route actions at their required capability

- `canEditItems`: item completion, starring, deletion, creation, editing, and reorder.
- `canManageCategories`: category creation, editing, deletion, and reorder.
- `canEditList`: list title/edit form and list deletion.
- `canManageMembers`: invitations, role changes, and removals.

The Members dialog remains openable to every member because membership listing is a read operation. Category configuration is hidden when category management is unavailable because the existing dialog contains no separate read-only value beyond categories already visible on the list.

### Keep personal and presentation controls independent

Filters, sorting, hide-checked state, collapsible sections, mode navigation, and personal list-group organization remain available to viewers. List-group assignments are per-user records and do not mutate the shared list.

## Risks / Trade-offs

- [Role information becomes stale after a membership event] -> Existing navigation or reload behavior will refresh list data; role-changing real-time synchronization is outside this change. Backend authorization still prevents stale write access.
- [A write affordance is missed on an uncommon route] -> Add page-level viewer tests for standard, grocery, and item-detail routes plus component-level read-only tests.
- [Capability props spread through several component layers] -> Pass the smallest semantic boolean needed by each component and keep role conversion at the route/store boundary.
- [Owner and editor behavior regresses while adding conditional rendering] -> Retain existing tests and add explicit role-matrix tests for owner/editor/viewer behavior.
- [List detail responses are not currently merged into the list store consistently] -> Preserve the role already held from summaries when handling mutation responses, and include role on detail responses for direct route loading.

## Migration Plan

1. Extend list API DTOs and frontend types with the current user's role.
2. Update list store mapping and test fixtures so every accessible list has a role.
3. Add the shared capability derivation helper.
4. Apply capability gates from leaf components outward to standard, grocery, item-detail, category, and membership surfaces.
5. Run backend integration, frontend unit/component, and end-to-end tests.

The change requires no database migration. Rollback consists of reverting the DTO field and conditional frontend rendering together.

## Open Questions

None.
