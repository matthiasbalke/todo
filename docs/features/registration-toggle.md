# Registration Toggle

Controls whether new user accounts can be created. Once a household is fully set up, registration can be locked down so only existing users can sign in.

## Configuration

| Env var               | Default | Description                              |
|-----------------------|---------|------------------------------------------|
| `REGISTRATION_ENABLED` | `true`  | Set to `false` to disable new sign-ups   |

`application.yml` property: `app.registration.enabled`

## Behaviour when disabled

- `GET /api/auth/config` → `{ "registrationEnabled": false }`
- `POST /api/auth/webauthn/register-options` → `403 REGISTRATION_DISABLED`
- `POST /api/auth/webauthn/register` → `403 REGISTRATION_DISABLED`
- Frontend auth page hides the **Create account** button entirely (fetched on page load via `/api/auth/config`).
- Existing users can still sign in normally with their passkeys.

## Config endpoint

`GET /api/auth/config` is public (no JWT required) and returns:

```json
{ "registrationEnabled": true }
```

The frontend polls this once on auth page load to decide whether to show the registration flow.
