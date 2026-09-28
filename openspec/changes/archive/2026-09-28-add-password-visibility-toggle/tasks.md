## 1. Shared password input behavior

- [x] 1.1 Add eye and eye-off semantic entries to the shared icon registry using tree-shakable Lucide imports, and verify the frontend type check passes.
- [x] 1.2 Update password-mode `TextInput` rendering with a right-aligned shared icon button, trailing text clearance, and disabled-state synchronization; verify non-password inputs retain their existing rendering through component tests.
- [x] 1.3 Implement the accessible show/hide state transition so toggling changes only the displayed input type while preserving value binding, validation, input events, and usable focus; verify focused `TextInput` tests cover `Show password`/`Hide password`, pressed state, both directions, and disabled behavior.

## 2. Consumer coverage

- [x] 2.1 Update the component showcase password example to display the real visibility-toggle behavior, and verify the showcase route renders it.
- [x] 2.2 Extend the SMTP settings route tests to verify its Password input exposes the shared visibility control without changing the existing password-edit submission contract.

## 3. Verification

- [x] 3.1 Run `bun run check` from `frontend/` and `bun run test -- --run` from `frontend/`, and resolve any failures.

## 4. Follow-up corrections

- [x] 4.1 Render the initial setup secret with password-mode `TextInput` and verify its value remains masked until the shared visibility control is activated.
- [x] 4.2 Make password-mode inputs fill their positioned wrapper so the visibility control stays inside the visible field without an explicit consumer width class; verify the component showcase case.
- [x] 4.3 Run focused setup, component showcase, and shared input tests plus `bun run check` from `frontend/`, and resolve any failures.
