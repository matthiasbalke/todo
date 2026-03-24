# Frontend

SvelteKit + TailwindCSS PWA for the todo app.

## Setup

```sh
bun install
```

## Commands

```sh
bun run dev      # dev server with Vite HMR
bun run build    # production build
bun run preview  # preview production build locally
bun run check    # Svelte type-check
bun run test     # Vitest unit tests
```

## Structure

```
src/
├── lib/
│   ├── api/          # API client (backend integration)
│   ├── components/   # Reusable Svelte components
│   ├── stores/       # Svelte state stores
│   └── utils.ts      # Shared utilities (filters, sorting, grouping)
└── routes/
    ├── (app)/        # Authenticated app routes
    │   └── lists/    # List and item views
    └── auth/         # Auth page (passkey / Google OAuth2)
```

## Notes

- Uses `bun` as the package manager and runtime — do not use `npm`/`yarn`/`pnpm`
- Mock data in `src/lib/mock-data.ts` stands in for the real backend during the prototype phase
- PWA support via `@vite-pwa/sveltekit`
