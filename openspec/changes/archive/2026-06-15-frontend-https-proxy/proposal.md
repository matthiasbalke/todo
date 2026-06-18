## Why

The current HTTPS frontend launcher uses `sudo` for the whole Vite process so it can bind port `443`. That makes generated development files like `.svelte-kit` root-owned and breaks normal-user workflows after the first launch.

## What Changes

- Start the frontend dev server on a regular high port instead of binding `443` directly.
- Use an existing privileged TCP forwarder binary on `443` that passes traffic to the unprivileged frontend server.
- Keep Vite and its generated artifacts owned by the invoking user.
- Preserve the existing HTTPS launch experience at `https://<domain>:443`.

## Capabilities

### New Capabilities
- `frontend-https-proxy`: Launch the frontend dev server on a non-privileged port and expose it through a separate privileged port-forwarding process on `443`.

### Modified Capabilities
- 

## Impact

- `frontend/start-https-frontend.sh`
- Documentation for local HTTPS development and agent/e2e startup instructions
- Startup-script tests that verify the frontend process is not run as root and the relay binary is used separately
- No API or production runtime changes
