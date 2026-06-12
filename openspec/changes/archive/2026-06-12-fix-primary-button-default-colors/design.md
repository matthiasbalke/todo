## Context

The shared `Button` component already defines complete primary and danger presentations. The affected auth and account actions instead select `variant="bare"` and add filled-color Tailwind utilities through the consumer `class` prop. The resulting element contains competing background utilities such as `bg-transparent` and `bg-blue-600` or `bg-red-600`; generated CSS order can make the transparent presentation win even though the hover utility still appears to work.

The fix spans two frontend routes but does not require a new component API. Existing route-specific sizing and width remain useful, while semantic colors belong to the shared component variant.

## Goals / Non-Goals

**Goals:**

- Restore visible default and darker hover colors for passkey sign-in, passkey registration, and account deletion.
- Make each action select the semantic shared Button variant matching its intent.
- Prevent regression with focused route-level class assertions.

**Non-Goals:**

- Redesign the shared Button palette or change its public variant API.
- Restyle secondary, bare, menu, confirmation, or unrelated account actions.
- Change authentication or account deletion behavior.

## Decisions

### Use semantic variants instead of merging conflicting color utilities

Passkey sign-in and registration will use `primary`; account deletion will use `danger`. Consumer classes will retain only necessary geometry or route-specific layout. This uses the component's existing contract and avoids depending on Tailwind utility generation order.

Changing class concatenation order was considered, but utility order in markup does not reliably determine generated CSS precedence. Adding important modifiers was also rejected because it would preserve duplicate ownership of semantic colors and make later theme changes harder.

### Test rendered route actions

Authentication route tests will assert that sign-in and registration actions include primary default, text, and hover classes. Account route coverage will assert the equivalent danger classes for Delete my account. These checks target the regression at the integration point where an otherwise-correct Button variant was overridden by consumer configuration.

Shared Button tests already verify each variant's basic mapping, so duplicating the full component test matrix is unnecessary.

## Risks / Trade-offs

- [Risk] Removing custom presentation classes could alter padding or width → Retain only the route-specific geometry classes required by the existing layouts.
- [Risk] Class assertions verify configuration rather than browser-computed CSS → Assert both the semantic variant classes and the absence of the conflicting bare background at the affected route level.
- [Risk] The account route may require substantial API mocking for a focused render test → Reuse existing test setup patterns and keep coverage limited to the initial danger-zone action.
