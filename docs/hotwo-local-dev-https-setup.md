# Local HTTPS with mkcert for iPhone Testing

WebAuthn (passkeys) requires a secure context. `http://localhost` works on the dev machine itself, but testing on an iPhone requires a proper HTTPS setup with a trusted certificate.

## Overview

1. Install mkcert and create a local CA
2. Generate a TLS certificate for your machine's LAN IP
3. Configure Vite to serve over HTTPS
4. Configure the backend for the new origin
5. Install the mkcert CA on other machines (Windows 11 / macOS)
6. Install the mkcert CA on the iPhone
7. Trust the CA in iOS Certificate Trust Settings

---

## 1. Install mkcert

```bash
brew install mkcert nss
mkcert -install   # installs the local CA into macOS/Firefox trust stores
```

Find your LAN IP (the IP your iPhone will connect to):

```bash
ipconfig getifaddr en0   # Wi-Fi — use this value as MY_IP below
```

---

## 2. Generate the Certificate

Run from the repo root (or any convenient location — the paths below assume repo root):

```bash
mkdir -p .certs
mkcert -key-file .certs/key.pem -cert-file .certs/cert.pem localhost 127.0.0.1 <MY_IP>
```

Replace `<MY_IP>` with your actual LAN IP, e.g. `192.168.1.42`.

The `.certs/` directory is already in `.gitignore` (Java/Kotlin/Node preset covers it via `*.pem`). If not, add it:

```
# .gitignore
.certs/
```

---

## 3. Start the HTTPS Dev Server

A dedicated Vite config (`frontend/vite.config.https.ts`) is already committed. It extends the base config with HTTPS and `host: '0.0.0.0'` and reads the certs from `.certs/`.

```bash
cd frontend && bun run dev:https
```

The dev server will now be reachable at `https://<MY_IP>:5173`.

---

## 4. Configure the Backend

Set these environment variables when starting the backend (or add to a local `.env` / run config):

```bash
WEBAUTHN_RP_ID=<MY_IP>
CORS_ALLOWED_ORIGINS=https://<MY_IP>:5173
```

Example for a shell session:

```bash
WEBAUTHN_RP_ID=192.168.1.42 \
CORS_ALLOWED_ORIGINS=https://192.168.1.42:5173 \
./gradlew bootRun
```

> **Note:** `WEBAUTHN_RP_ID` must exactly match the host part of the origin the browser sees. The browser will reject credentials if these don't match (you'll see the "Passkey origin not allowed" error added in the last fix).

---

## 5. Install the mkcert CA on Windows 11 or macOS (other machines on your network)

If you want to test from another computer on the same LAN (not just an iPhone), you need to install the mkcert root CA on that machine.

### Find the CA file

On the machine where you ran `mkcert -install`, locate the root CA:

```bash
mkcert -CAROOT
# Typically:
#   macOS:   /Users/<you>/Library/Application Support/mkcert/
#   Windows: C:\Users\<you>\AppData\Local\mkcert\
```

The file you need is `rootCA.pem` inside that directory.

### macOS (on the target machine)

**Option A — mkcert handles it (easiest, if mkcert is installed on the target too):**

```bash
brew install mkcert
# Copy rootCA.pem from the source machine, then:
CAROOT=/path/to/dir/containing/rootCA mkcert -install
```

**Option B — manually via Keychain Access:**

1. Transfer `rootCA.pem` to the target Mac (AirDrop, file share, USB, etc.)
2. Double-click the file — Keychain Access opens and prompts to add the certificate
3. Select the **System** keychain and click **Add**
4. Open **Keychain Access → System** and find the **mkcert** certificate
5. Double-click it → expand **Trust** → set **When using this certificate** to **Always Trust**
6. Close the dialog and enter your password to confirm

**Option C — command line (no GUI):**

```bash
# Add to System keychain
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /path/to/rootCA.pem
```

Restart your browser after importing.

---

### Windows 11

**Option A — mkcert handles it (easiest, if mkcert is installed on the target too):**

```powershell
# In an elevated PowerShell (Run as Administrator):
# Copy rootCA.pem from the source machine, then set CAROOT to the folder containing it:
$env:CAROOT = "C:\path\to\dir\containing\rootCA"
mkcert -install
```

**Option B — manually via Certificate Manager:**

1. Transfer `rootCA.pem` to the Windows machine and rename it to `rootCA.crt` (Windows needs the `.crt` extension)
2. Double-click the file → click **Install Certificate**
3. Select **Local Machine** → click **Next** (confirm the UAC prompt)
4. Select **Place all certificates in the following store** → click **Browse**
5. Choose **Trusted Root Certification Authorities** → **OK** → **Next** → **Finish**
6. Click **Yes** on the security warning, then **OK**

**Option C — command line (PowerShell, elevated):**

```powershell
# Import into the machine-wide Trusted Root store
Import-Certificate -FilePath "C:\path\to\rootCA.crt" -CertStoreLocation Cert:\LocalMachine\Root
```

Restart your browser after importing (Chrome and Edge on Windows use the Windows certificate store; Firefox uses its own store — see note below).

> **Firefox on Windows/macOS:** Firefox maintains its own certificate store and ignores the OS store by default. To trust the CA in Firefox, navigate to **Settings → Privacy & Security → Certificates → View Certificates → Authorities → Import**, select `rootCA.pem`, and check **Trust this CA to identify websites**.

---

## 6. Install the mkcert CA on the iPhone

The iPhone must trust the same CA that signed the certificate. mkcert's CA root is a single file:

```bash
# Find the CA file location:
mkcert -CAROOT
# Typically: /Users/<you>/Library/Application Support/mkcert/rootCA.pem
```

**Transfer the CA to the iPhone** — pick one method:

- **AirDrop:** `open "$(mkcert -CAROOT)"` → AirDrop `rootCA.pem` to your iPhone
- **Email/Messages:** attach `rootCA.pem` and open it on the iPhone
- **Web server (quickest):**
  ```bash
  cp "$(mkcert -CAROOT)/rootCA.pem" /tmp/rootCA.pem
  cd /tmp && python3 -m http.server 8888
  # On iPhone Safari: http://<MY_IP>:8888/rootCA.pem
  ```

When you open the `.pem` file on the iPhone, iOS will prompt:

> "This website is trying to download a configuration profile. Do you want to allow this?"

Tap **Allow**.

---

## 6. Install the Profile

1. Open **Settings → General → VPN & Device Management**
2. Under **Downloaded Profile**, tap the **mkcert** entry
3. Tap **Install** (top right), enter your passcode, tap **Install** again
4. Tap **Done**

---

## 7. Enable Full Trust (Critical — easy to miss)

Installing the profile is not enough. You must also explicitly enable trust for TLS:

1. **Settings → General → About → Certificate Trust Settings**
2. Under **Enable Full Trust For Root Certificates**, toggle on **mkcert …**
3. Tap **Continue** on the warning dialog

Without this step, Safari will show an "untrusted certificate" error and WebAuthn will not work.

---

## 8. Test

1. Start the backend with the env vars from step 4
2. Start the frontend dev server: `cd frontend && bun run dev`
3. On the iPhone, open Safari and navigate to `https://<MY_IP>:5173`
4. The padlock should be green — if Safari shows a certificate warning, step 6 or 7 was missed
5. Attempt passkey registration or login

---

## Reverting to Normal Dev

Remove the `https` and `host` keys from `vite.config.ts` and restart without the env vars (defaults are `WEBAUTHN_RP_ID=localhost`, `CORS_ALLOWED_ORIGINS=http://localhost:5173`).

The iPhone profile can stay installed — it only affects connections to your dev machine's CA-signed certs and does not interfere with normal HTTPS browsing.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Safari shows "This Connection Is Not Private" | Step 7 (Certificate Trust Settings toggle) was skipped |
| "Passkey origin not allowed — check the server configuration" | `WEBAUTHN_RP_ID` doesn't match the IP in the browser URL |
| CORS error in browser console | `CORS_ALLOWED_ORIGINS` doesn't match the exact origin (`https://<IP>:5173`) |
| Certificate error on Mac too | Re-run `mkcert -install` after `brew install nss` |
| IP changed after router reboot | Assign a static DHCP lease to your Mac, or regenerate the cert for the new IP |
