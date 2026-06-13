## 1. Backend Role Contract

- [ ] 1.1 Add the authenticated user's `ListRole` to backend list summary and detail DTOs and mapping paths
- [ ] 1.2 Extend backend list integration tests to verify `OWNER`, `EDITOR`, and `VIEWER` roles in list responses

## 2. Frontend Capability Model

- [ ] 2.1 Add the role field to frontend list API DTOs and the stored list model, preserving it across list loads and updates
- [ ] 2.2 Add a shared typed role-to-capability mapping for item editing, category management, list management, and membership management
- [ ] 2.3 Add unit tests covering the complete owner, editor, and viewer capability matrix

## 3. Standard List Read-Only Behavior

- [ ] 3.1 Update `ItemCard` and its category-group callers to accept item edit capability and render non-interactive completion/star indicators without swipe-delete or drag controls for viewers
- [ ] 3.2 Gate standard-list item creation and category configuration using the derived capabilities
- [ ] 3.3 Gate standard-list title editing and list deletion to owners while preserving navigation, filtering, sorting, collapse, and hide-checked controls
- [ ] 3.4 Add component and standard-list page tests proving viewer controls are absent and owner/editor interactions remain available

## 4. Grocery And Detail Read-Only Behavior

- [ ] 4.1 Update grocery category rows to present completion state without toggle behavior for viewers
- [ ] 4.2 Gate grocery-mode category configuration to owners and editors and list editing to owners
- [ ] 4.3 Add a read-only item detail presentation and select it for viewers while retaining the editable form and delete action for owners and editors
- [ ] 4.4 Add grocery and item-detail tests covering viewer, editor, and owner behavior

## 5. Membership And Route Integration

- [ ] 5.1 Use the shared capabilities in the Members dialog so every member can inspect membership while only owners receive mutation controls
- [ ] 5.2 Remove route-level current-role inference through full member-list lookups where the new list role contract makes it unnecessary
- [ ] 5.3 Verify viewers retain standard/grocery navigation and personal list-group assignment and ordering

## 6. End-To-End Verification

- [ ] 6.1 Add an end-to-end viewer scenario covering standard list, grocery mode, item detail, categories, list management, and membership controls
- [ ] 6.2 Run backend tests, frontend checks and tests, and the relevant end-to-end suite
- [ ] 6.3 Update project feature documentation and `MEMORY.md` with the capability model and viewer read-only behavior
