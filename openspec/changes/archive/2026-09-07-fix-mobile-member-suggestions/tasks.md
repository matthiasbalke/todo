## 1. Shared Combobox Primitive

- [x] 1.1 Extract a lower-level combobox/listbox primitive from `Select` that owns popup layout, query input, active option state, keyboard navigation, focus/outside closing, scrolling, and pointer/touch-safe option activation, and verify primitive-focused tests cover those mechanics.
- [x] 1.2 Rebuild `Select` on top of the primitive while preserving its closed-option public API and selected-option value semantics, and verify existing `Select`, `CategorySelect`, role select, and component showcase tests still pass.
- [x] 1.3 Ensure the primitive keeps mobile-safe listbox behavior that does not depend on native datalist UI, and verify option activation works through pointer/touch-style events.

## 2. Shared Invite Control

- [x] 2.1 Replace `MemberInviteEmailInput` native datalist rendering with a free-text suggestion wrapper around the combobox primitive while keeping the existing email binding, validation props, labels, and typed email behavior, and verify matching suggestions appear while typing.
- [x] 2.2 Keep member suggestion matching wrapper-owned by filtering on typed email/display-name text without moving current-member exclusion out of `MembersDialog`, and verify filtering/display-name tests pass.
- [x] 2.3 Add touch-safe suggestion activation that fills the bound email value before blur closes the popup, and verify with a component test that pointer/touch-style activation selects a suggested contact.
- [x] 2.4 Add or update component coverage for typed unsuggested email entry, suggestion visibility while typing, suggestion filtering/display names, and closing the suggestion list after selection, and verify the targeted component tests pass.

## 3. Members Dialog Integration

- [x] 3.1 Ensure `MembersDialog` continues passing owner-loaded, current-member-filtered suggestions into `MemberInviteEmailInput` without changing backend API calls, and verify existing suggestion-loading tests still pass.
- [x] 3.2 Add dialog-level regression coverage that types a matching fragment, selects a suggested contact through the mobile-operable suggestion control, and submits the invite, and verify `addMember` receives the selected email and current role.
- [x] 3.3 Preserve arbitrary typed invite submission and existing invite error handling, and verify `MembersDialog` tests for unsuggested emails, duplicate members, missing accounts, and rate limits still pass.

## 4. Component Showcase And Validation

- [x] 4.1 Update the components showcase if needed so `Select` still demonstrates closed-option selection and `MemberInviteEmailInput` demonstrates suggestions appearing while typing, explicit suggestion selection, and arbitrary typed email entry, and verify the showcase tests still pass.
- [x] 4.2 Run targeted frontend tests for the combobox primitive, `Select`, `CategorySelect`, `MemberInviteEmailInput`, `MembersDialog`, and the component showcase with `cd frontend && bun run test -- --run <targeted tests>` and verify they pass.
- [x] 4.3 Run frontend type validation with `cd frontend && bun run check` and verify it passes.
- [x] 4.4 Run `openspec validate fix-mobile-member-suggestions --strict` and verify the change artifacts are valid.
