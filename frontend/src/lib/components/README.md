# Frontend Components

A small, reusable component library for SvelteKit UI primitives. Components follow these principles:

- **Simple and focused**: each component has a single responsibility
- **Accessible**: ARIA attributes, keyboard navigation, semantic HTML
- **Composable**: base components can be extended or combined for specialized behavior
- **Styled consistently**: Tailwind utilities + scoped component styles; no inline CSS
- **Testable**: each component includes comprehensive unit tests

## Base Components

### TextInput

A text input field with custom validation support, error display, and accessibility features.

#### Props

- `value` (string): the input value
- `label` (string): label text displayed above the input
- `placeholder` (string): placeholder text
- `type` (string, default: 'text'): HTML input type (text, email, password, search, etc.)
- `disabled` (boolean, default: false): disable the input
- `required` (boolean, default: false): mark the input as required
- `validate` (function, optional): custom validator function that takes a string and returns an error message (string) or null
- `ariaLabel` (string, optional): accessible label for screen readers

#### Events

- `on:input`: fired when the input value changes
- `on:blur`: fired when the input loses focus
- `on:focus`: fired when the input receives focus

#### Usage

```svelte
<script>
  import TextInput from '$lib/components/TextInput.svelte';

  let email = '';
  let password = '';

  function validateEmail(value) {
    if (!value) return 'Email is required';
    if (!value.includes('@')) return 'Email must be valid';
    return null;
  }

  function validatePassword(value) {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  }
</script>

<TextInput
  bind:value={email}
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  validate={validateEmail}
  required
/>

<TextInput
  bind:value={password}
  label="Password"
  type="password"
  validate={validatePassword}
  required
/>
```

#### Styling

- Error state: red border, light red background, red ring on focus
- Normal state: gray border, white background, blue ring on focus
- Disabled state: gray background, gray text, gray border

## Component Extension Pattern

To create a specialized component based on a base component:

```svelte
<!-- PriceInput.svelte: extends TextInput for currency input -->
<script>
  import TextInput from './TextInput.svelte';

  export let value = '';
  
  function validatePrice(val) {
    if (!val) return 'Price is required';
    const num = parseFloat(val);
    if (isNaN(num)) return 'Price must be a number';
    return null;
  }
</script>

<TextInput {value} type="number" step="0.01" validate={validatePrice} ... />
```

## Testing Components

Components are tested with Vitest + @testing-library/svelte. Test files are colocated with components.

Run tests:

```bash
cd frontend && bun run test --run
```

Test coverage includes:
- Rendering (elements, attributes, conditional rendering)
- User interactions (input, blur, focus)
- Validation and error states
- Accessibility attributes (aria-*, role, label associations)
- Styling
- Edge cases (special characters, very long values, etc.)

## Guidelines

1. **Reuse components** when building forms or UI areas. Check if a base component exists before creating a new element.
2. **Compose over copy-paste**: if you need a variant of an existing component, extend it rather than duplicating code.
3. **Keep validators simple**: move complex validation to the parent form if needed.
4. **Use Tailwind for styling**: prefer utility classes over inline styles.
5. **Test as you build**: write tests for any new component or specialized variant.
