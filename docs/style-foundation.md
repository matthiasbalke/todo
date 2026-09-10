# Shared style foundation

The app's visual values live in `frontend/src/lib/styles/foundation.css`, imported by `app.css`. Shared controls select semantic roles through Tailwind utilities and `controlStyles.ts`; callers retain semantic props such as `tone`, `appearance`, and `size`.

- `--ui-*` color variables name purposes: canvas, surface, text, border, primary, danger, success, focus, and interaction states. `@theme inline` connects the utilities to these runtime values.
- Typography, spacing, radii, weights, tracking, and shadows are defined centrally. Control typography and geometry are independent. Editable control text has a 1rem minimum, including compact inputs; supporting text and metadata retain smaller roles.
- Native and rendered placeholders share color, font style, and control typography. Changing `--ui-placeholder` updates both; changing `--ui-control-size` updates control values and previews together.
- `iconRegistry.ts` remains the source for icon sizes, strokes, and icon touch targets.
- User-selected category colors are data and remain independent of UI theme colors. Transparent backgrounds and `currentColor` intentionally inherit their surroundings.

## Browser review

Open `/components#foundation` on the development deployment. The foundation section compares typography roles, paired colors, native placeholders, disabled controls, validation, selected actions, and a menu. Inspect controls with mouse hover and keyboard Tab navigation at desktop and mobile widths.

Use **Use diagnostic palette** at the bottom-right of any development page. The purple canvas, cream surfaces, and teal actions make missed color mappings conspicuous. **Restore default palette** restores the initial appearance. The choice applies at the HTML root, including menus, dialogs, and fixed footers, and remains active during client-side navigation. Reloading resets to the default; adding `?palette=diagnostic` to the URL activates it on initial load.

This palette is temporary diagnostic tooling, not a proposed dark theme. It deliberately stays out of production: the root layout places its dynamic import behind `import.meta.env.DEV`, which Vite replaces at build time so the production bundle omits the import and module entirely. No custom exclusion plugin is needed. Production builds must contain neither its color values nor its activation control.

Browser coverage is in `e2e/tests/foundation.spec.ts`. It checks shared computed styles, both palettes, keyboard focus and hover, menus, disabled and invalid states, notes editing, fixed footers, and restoration of defaults. Screenshots from each run support visual review. The app's production theme selector, system preference, preference persistence, initial theme rendering, and native browser color-scheme handling remain future work.
