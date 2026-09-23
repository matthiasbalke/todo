## 1. Shared Control Geometry

- [x] 1.1 Verify the existing Button `field` size matches default shared text input geometry and verify `Button.test.ts` covers the field size classes
- [x] 1.2 Preserve compact, icon, menu, header, chip, row, and display Button sizing and verify existing Button size tests continue to pass

## 2. SMTP Settings Consumer

- [x] 2.1 Update the admin SMTP test-email action to use `size="field"` and verify the admin page test covers the `Test recipient` input next to the `Test` action
- [x] 2.2 Verify the SMTP settings markup does not add ad hoc Button padding or height utility classes for field alignment

## 3. Showcase Documentation

- [x] 3.1 Add a Button showcase example with a default text input and `size="field"` Button rendered next to each other, and verify the showcase test covers the example
- [x] 3.2 Verify the showcase example does not use custom Button padding or height utilities for field alignment

## 4. Verification

- [x] 4.1 Run `cd frontend && bun run check` and verify Svelte type checking passes
- [x] 4.2 Run `cd frontend && bun run test -- --run src/lib/components/Button.test.ts src/routes/(app)/admin/admin-page.test.ts src/routes/components/components-page.test.ts` and verify focused unit tests pass
- [x] 4.3 Run `openspec validate align-button-field-heights --strict` and verify the change is valid
