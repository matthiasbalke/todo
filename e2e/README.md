# E2E Tests

Playwright tests live in this package and are run with Bun.

## Commands

Install dependencies:

```bash
bun install
```

```bash
bunx playwright install
```

On WSL2, install the Playwright Chromium host dependencies if Playwright reports missing browser libraries:

```bash
sudo bunx playwright install-deps chromium
```

Run all e2e tests:

```bash
bun run test
```

When `../.local-domain` exists, Playwright automatically uses `https://<that-domain>` as `baseURL`. If the file is missing, Playwright starts the frontend dev server and uses `http://localhost:5173`.

Override the target explicitly:

```bash
BASE_URL=https://other.example.test bun run test
```

Generate the local Mailpit TLS certificate:

```bash
bun run certs:mailpit
```

This creates `e2e/certs/mailpit.pem` and `e2e/certs/mailpit.key` from the checked-in E2E root CA. The generated certificate includes `mailpit-starttls`, `mailpit-smtps`, `localhost`, `127.0.0.1`, and the hostname from `../.local-domain` when present. The generated files are ignored because each development machine can use a different local domain.

Create the admin storage state from an initialized database:

```bash
bun run auth:admin
```

This uses `BASE_URL` when set, otherwise reads `../.local-domain` and uses `https://<that-domain>`. It inserts a refresh token for an unblocked admin user and writes `.auth/admin.json`.

To select a specific admin:

```bash
E2E_ADMIN_EMAIL=admin@example.com bun run auth:admin
```

To override the target URL:

```bash
BASE_URL=https://other.example.test bun run auth:admin
```

If the app tables live in a non-default PostgreSQL schema:

```bash
E2E_POSTGRES_SCHEMA=e2e bun run auth:admin
```

## Mailpit Tests

Before running the email delivery specs locally:

```bash
bun run certs:mailpit
bun run auth:admin
```

Restart the Mailpit containers after regenerating the certificate so they pick up the new files.

The live backend must trust the E2E root CA:

```bash
JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStore=$(pwd)/../e2e/certs/e2e-truststore.p12 -Djavax.net.ssl.trustStorePassword=changeit -Djavax.net.ssl.trustStoreType=PKCS12"
```

Run only the email delivery specs:

```bash
bunx playwright test tests/email.spec.ts
```
