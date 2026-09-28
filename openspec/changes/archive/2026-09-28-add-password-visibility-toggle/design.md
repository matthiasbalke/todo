## Context

See `proposal.md` for motivation. `TextInput` is the shared frontend primitive for text-like fields and currently forwards `type="password"` directly to its native input. The SMTP settings route and the initial setup secret field are production password consumers, and the component showcase includes a password example. The project requires functional controls to use its shared Button and Icon primitives, with Lucide icons supplied through the icon registry.

## Goals / Non-Goals

**Goals:**
- Give every password-mode `TextInput` a local, keyboard-accessible show/hide control.
- Preserve the existing value binding, validation callbacks, native attributes, and layout contracts for all input modes.
- Keep the control aligned inside the field without covering entered text.

**Non-Goals:**
- Persisting the revealed state, automatically masking after a timeout, or changing browser password-manager behavior.
- Changing SMTP password storage, transport, validation, or backend APIs.
- Changing how setup secrets or SMTP passwords are stored, submitted, or validated.

## Decisions

### Make visibility automatic for password-mode TextInput

`TextInput` will derive an internal visibility state only when its consumer supplies `type="password"`. This gives the SMTP field and future password-mode consumers the same safe default without a consumer-specific prop or duplicated controls. Other input types retain their current native rendering path.

Alternative considered: add a `showPasswordToggle` prop. This would make adoption opt-in and risks future password fields omitting the expected behavior, so it is unnecessary for the issue's component-level requirement.

### Keep the value and external type separate from the displayed type

The component will preserve the consumer-provided value and password type as its source contract, while deriving the native input type from the transient visibility state. Toggling changes only presentation, not the bound value or input-event path.

Alternative considered: replace the input or copy its value during toggling. Replacing the element risks focus loss and duplicate input behavior; a derived native type avoids both.

### Use shared button and icon primitives in an input wrapper

The input and visibility button will sit in a positioned wrapper. The input receives trailing padding and the button is absolutely aligned to the right, using shared Button sizing and semantic registry entries for eye and eye-off icons. The icon remains decorative because the button supplies the accessible name and pressed state.

Password-mode inputs fill that wrapper so the overlay is anchored to the visible field boundary even when a consumer does not supply an explicit width utility, as in the component showcase.

The masked state exposes `Show password` with `aria-pressed="false"`; the revealed state exposes `Hide password` with `aria-pressed="true"`. This follows the existing pressed-button pattern while making the action and current state unambiguous to assistive technology.

Alternative considered: use a text link or inline SVG. Those would diverge from the app's functional-icon system and make a compact control harder to keep consistent.

### Keep disabled behavior synchronized

The visibility button will inherit the input's disabled state. This prevents a disabled sensitive field from exposing a separate interactive control and maintains the current disabled-field interaction contract.

## Risks / Trade-offs

- [Changing the native input type can affect focus or cursor position in some browsers] -> Verify pointer and keyboard toggles retain the entered value and usable focus in component tests and the SMTP settings consumer.
- [An overlay control could obscure trailing characters in narrow layouts] -> Reserve trailing input space and use the existing compact icon-control dimensions.
- [Accessible state can become ambiguous] -> Couple the button's name, pressed state, and eye/eye-off icon to one visibility state.

## Migration Plan

1. Add the shared behavior and registry entries, then update the component showcase password example.
2. Run focused frontend component and admin settings tests, followed by the frontend check and full unit suite.
3. Deploy as a frontend-only change. Roll back by reverting the shared input and icon-registry changes; stored values and APIs are unaffected.
