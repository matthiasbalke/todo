## Context

The current frontend HTTPS launcher elevates the entire Vite process with `sudo` so it can bind port `443`. That solves the port-binding problem but makes Vite and its child workspaces root-owned, which breaks local development after the first run because generated files such as `.svelte-kit` are no longer writable by the normal user.

The desired behavior is unchanged from the browser's perspective: the frontend should still be reachable at `https://<local-domain>:443` by default. The implementation needs to move the privilege boundary away from Vite itself.

## Goals / Non-Goals

**Goals:**
- Keep the Vite dev server running as the invoking user.
- Continue exposing the frontend on a privileged public port, defaulting to `443`.
- Preserve HTTPS and HMR behavior without changing the browser-facing URL.
- Prefer an existing relay binary available through common package managers instead of maintaining a custom proxy implementation.

**Non-Goals:**
- Do not change the production frontend deployment model.
- Do not change backend startup behavior.
- Do not redesign local HTTPS certificate generation or local-domain handling.

## Decisions

- Use a TCP forwarding proxy rather than an HTTP reverse proxy.
  - Rationale: Vite already terminates HTTPS and serves the correct TLS certificate from its existing HTTPS config. A TCP forwarder preserves that behavior and avoids duplicating TLS or HTTP configuration in a second server.
  - Alternatives considered:
    - `nginx`/`caddy`: more configuration and a heavier operational footprint for a dev-only path.
    - `setcap` on Node: solves Linux only and does not address macOS.
    - Port redirection with firewall rules: harder to make portable and harder to reason about in a repo-local script.

- Keep Vite on a fixed high port and forward `443` to it.
  - Rationale: a stable internal port keeps the launcher simple and avoids extra coordination between the proxy and the dev server.
  - Alternatives considered:
    - Dynamic internal port selection: reduces the chance of collisions but complicates HMR and documentation.
    - Running Vite directly on the requested public port when available: still requires privileged fallback handling and does not eliminate the root-owned artifact problem if `sudo` is used.

- Use an existing relay binary such as `socat` and launch it under `sudo` only for the forwarding step.
  - Rationale: this keeps the workflow self-contained without adding a new repo-maintained helper. `socat` is available on both Linux package managers and Homebrew, and it can relay raw TCP bytes with a single command.
  - Alternatives considered:
    - A custom in-repo proxy script: rejected because it adds maintenance burden for something standard tools already do.
    - Node-based proxy launched under `sudo`: feasible, but it still adds a repo-owned helper and does not improve portability over `socat`.

- Make the launcher supervise both processes.
  - Rationale: the frontend script should own the lifecycle so stopping the script stops both the proxy and the Vite server, and so failures in either process are visible immediately.

## Risks / Trade-offs

- [Port collision on the high internal port] -> Keep the internal port fixed and document that the chosen port must be free; if necessary, the launcher can later grow a configurable internal port without changing the public interface.
- [Proxy process outlives Vite on abnormal exit] -> Trap signals in the launcher and ensure the proxy and dev server are both terminated on shutdown.
- [Extra moving part in the dev workflow] -> Keep the workflow to one launcher script plus one existing relay binary and document the process split clearly so developers know the root process is only the forwarding layer.
- [TCP relay adds one more hop] -> Accept the negligible overhead because this is a local development path and the simplicity gain outweighs the cost.

## Migration Plan

1. Update `frontend/start-https-frontend.sh` to start Vite on the high port and invoke an existing relay binary on the exposed port.
2. Update local HTTPS documentation to explain that `sudo` is now only used for the forwarding layer, not for Vite, and that `socat` or the equivalent relay binary must be installed via apt/brew.
3. Update startup-script tests so they verify the frontend child process runs unprivileged, generated artifacts remain user-owned, and the relay binary is used separately.
4. Validate the new flow on Linux and macOS with the existing HTTPS setup.

Rollback is straightforward: revert the launcher to the direct-bind path if the proxy flow causes regressions. No data migration is involved.

## Open Questions

- Should the internal Vite port be fixed at `5173` or made configurable behind an environment variable for power users?
