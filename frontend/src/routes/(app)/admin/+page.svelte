<script lang="ts">
  import { untrack } from 'svelte';
  import {
    createRecoveryLink,
    resetEmailSettings,
    setRegistrationEnabled,
    testEmailSettings,
    updatePublicBaseUrl,
    updateEmailSettings,
    updateAdminUser,
    updateUserAdmin,
    updateUserBlocked,
    type EmailEncryption,
    type EmailSettings,
    type PasswordAction,
    type AdminUser,
    type RecoveryLink,
  } from '$lib/api/admin';
  import { ApiError } from '$lib/api/client';
  import Button from '$lib/components/Button.svelte';
  import Select from '$lib/components/Select.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import Toggle from '$lib/components/Toggle.svelte';

  let { data } = $props();

  type EditableUser = AdminUser & {
    editDisplayName: string;
    editEmail: string;
    saving: boolean;
    error: string;
  };

  let registrationEnabled = $state(untrack(() => data.settings.registrationEnabled));
  let settingsMessage = $state('');
  let settingsError = $state('');
  const initialEmailSettings = untrack(() => data.settings.email);
  let emailSettings = $state<EmailSettings>(initialEmailSettings);
  let publicBaseUrl = $state(initialEmailSettings.publicBaseUrl);
  let publicBaseUrlSaving = $state(false);
  let publicBaseUrlMessage = $state('');
  let publicBaseUrlError = $state('');
  let publicBaseUrlSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let emailDraft = $state({
    enabled: initialEmailSettings.enabled,
    authEnabled: initialEmailSettings.authEnabled,
    host: initialEmailSettings.host,
    port: initialEmailSettings.port?.toString() ?? '',
    protocol: initialEmailSettings.protocol,
    encryption: initialEmailSettings.encryption,
    username: initialEmailSettings.username ?? '',
    passwordAction: 'KEEP' as PasswordAction,
    password: '',
    from: initialEmailSettings.from,
    fromName: initialEmailSettings.fromName ?? '',
  });
  let portEdited = $state(initialEmailSettings.port != null);
  let emailSaving = $state(false);
  let emailTesting = $state(false);
  let emailMessage = $state('');
  let emailError = $state('');
  let testRecipient = $state('');
  let testMessage = $state('');
  let testError = $state('');
  let testErrorDetail = $state('');
  let testErrorHint = $state('');
  let users = $state<EditableUser[]>(untrack(() => data.users.map((user: AdminUser) => ({
    ...user,
    editDisplayName: user.displayName,
    editEmail: user.email,
    saving: false,
    error: '',
  }))));
  let recoveryLinks = $state<Record<string, RecoveryLink>>({});
  const encryptionOptions: EmailEncryption[] = ['STARTTLS', 'SSL_TLS'];
  let passwordEdited = $state(false);

  function friendlyError(error: unknown, fallback: string): string {
    if (error instanceof ApiError) return error.message;
    console.error(error);
    return fallback;
  }

  function draftFrom(settings: EmailSettings) {
    return {
      enabled: settings.enabled,
      authEnabled: settings.authEnabled,
      host: settings.host,
      port: settings.port?.toString() ?? '',
      protocol: settings.protocol,
      encryption: settings.encryption,
      username: settings.username ?? '',
      passwordAction: 'KEEP' as PasswordAction,
      password: '',
      from: settings.from,
      fromName: settings.fromName ?? '',
    };
  }

  function draftKey(draft = emailDraft) {
    return JSON.stringify({
      ...draft,
      host: draft.host.trim(),
      username: draft.username.trim(),
      from: draft.from.trim(),
      fromName: draft.fromName.trim(),
    });
  }

  const activeDraftKey = $derived(draftKey(draftFrom(emailSettings)));
  const emailDirty = $derived(draftKey() !== activeDraftKey || passwordEdited);

  function emailValidationErrors(): string[] {
    if (!emailDraft.enabled) return [];
    const errors: string[] = [];
    const port = Number(emailDraft.port);
    const publicUrl = publicBaseUrl.trim();
    if (!emailDraft.host.trim()) errors.push('SMTP host is required.');
    if (!emailDraft.port.trim()) errors.push('SMTP port is required.');
    else if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('SMTP port must be between 1 and 65535.');
    if (!emailDraft.from.trim()) errors.push('Sender address is required.');
    if (!publicUrl) errors.push('Public application base URL is required.');
    else if (!validPublicBaseUrl(publicUrl)) errors.push('Public app URL must look like https://todo.example.com without a trailing slash.');
    if (emailDraft.authEnabled) {
      if (!emailDraft.username.trim()) errors.push('SMTP username is required when authentication is enabled.');
      if ((!emailSettings.passwordConfigured || passwordEdited) && !emailDraft.password.trim()) {
        errors.push('SMTP password is required when authentication is enabled.');
      }
    }
    return errors;
  }

  const emailValidation = $derived(emailValidationErrors());

  function validPublicBaseUrl(value: string): boolean {
    if (value.endsWith('/')) return false;
    try {
      const url = new URL(value);
      return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
    } catch {
      return false;
    }
  }

  function emailPayload() {
    const passwordAction: PasswordAction = passwordEdited
      ? (emailDraft.password.trim() ? 'REPLACE' : 'CLEAR')
      : 'KEEP';
    return {
      enabled: emailDraft.enabled,
      authEnabled: emailDraft.authEnabled,
      host: emailDraft.host.trim(),
      port: emailDraft.port.trim() ? Number(emailDraft.port) : null,
      protocol: emailDraft.protocol.trim() || 'smtp',
      encryption: emailDraft.encryption,
      username: emailDraft.username.trim() || null,
      passwordAction,
      password: emailDraft.password.trim() || null,
      from: emailDraft.from.trim(),
      fromName: emailDraft.fromName.trim() || null,
      publicBaseUrl: publicBaseUrl.trim(),
    };
  }

  function setEmailEncryption(encryption: EmailEncryption) {
    emailDraft.encryption = encryption;
    if (!portEdited && !emailDraft.port.trim()) {
      emailDraft.port = encryption === 'STARTTLS' ? '587' : '465';
    }
  }

  function encryptionLabel(encryption: EmailEncryption): string {
    return encryption === 'STARTTLS' ? 'STARTTLS' : 'SSL/TLS';
  }

  function applyEmailSettings(settings: EmailSettings) {
    emailSettings = settings;
    emailDraft = draftFrom(settings);
    publicBaseUrl = settings.publicBaseUrl;
    portEdited = settings.port != null;
    passwordEdited = false;
  }

  function publicBaseUrlValidation(value = publicBaseUrl.trim()): string {
    if (!value) return 'Public application base URL is required.';
    if (!validPublicBaseUrl(value)) return 'Public app URL must look like https://todo.example.com without a trailing slash.';
    return '';
  }

  function schedulePublicBaseUrlSave() {
    if (publicBaseUrlSaveTimeout) clearTimeout(publicBaseUrlSaveTimeout);
    publicBaseUrlMessage = '';
    const validation = publicBaseUrlValidation();
    if (validation) {
      publicBaseUrlError = validation;
      return;
    }
    publicBaseUrlError = '';
    publicBaseUrlSaveTimeout = setTimeout(() => {
      void savePublicBaseUrl();
    }, 700);
  }

  async function savePublicBaseUrl() {
    const value = publicBaseUrl.trim();
    const validation = publicBaseUrlValidation(value);
    if (validation) {
      publicBaseUrlError = validation;
      return;
    }
    if (value === emailSettings.publicBaseUrl) return;
    publicBaseUrlSaving = true;
    publicBaseUrlMessage = '';
    publicBaseUrlError = '';
    try {
      const updated = await updatePublicBaseUrl(value);
      emailSettings = { ...emailSettings, publicBaseUrl: updated.publicBaseUrl, validationErrors: updated.validationErrors };
      publicBaseUrl = updated.publicBaseUrl;
      publicBaseUrlMessage = 'Public app URL saved.';
    } catch (error) {
      publicBaseUrlError = friendlyError(error, 'Failed to save public app URL');
    } finally {
      publicBaseUrlSaving = false;
    }
  }

  function replaceUser(updated: AdminUser) {
    users = users.map((user) => user.id === updated.id
      ? { ...user, ...updated, editDisplayName: updated.displayName, editEmail: updated.email, saving: false, error: '' }
      : user
    );
  }

  async function saveRegistration(enabled: boolean) {
    registrationEnabled = enabled;
    settingsMessage = '';
    settingsError = '';
    try {
      const updated = await setRegistrationEnabled(enabled);
      registrationEnabled = updated.registrationEnabled;
      settingsMessage = 'Registration setting saved.';
    } catch (error) {
      registrationEnabled = !enabled;
      settingsError = friendlyError(error, 'Failed to save registration setting');
    }
  }

  async function saveEmailSettings() {
    emailMessage = '';
    emailError = '';
    testMessage = '';
    testError = '';
    const errors = emailValidationErrors();
    if (errors.length) {
      emailError = errors.join(' ');
      return;
    }
    emailSaving = true;
    try {
      applyEmailSettings(await updateEmailSettings(emailPayload()));
      emailMessage = 'Email settings saved.';
    } catch (error) {
      emailError = friendlyError(error, 'Failed to save email settings');
    } finally {
      emailSaving = false;
    }
  }

  function discardEmailDraft() {
    emailDraft = draftFrom(emailSettings);
    portEdited = emailSettings.port != null;
    passwordEdited = false;
    emailMessage = '';
    emailError = '';
  }

  async function resetEmailToDeployment() {
    if (!confirm('Reset email settings to deployment configuration? Runtime email settings will be removed.')) return;
    emailMessage = '';
    emailError = '';
    try {
      applyEmailSettings(await resetEmailSettings());
      emailMessage = 'Email settings reset to deployment configuration.';
    } catch (error) {
      emailError = friendlyError(error, 'Failed to reset email settings');
    }
  }

  async function sendTestEmail() {
    testMessage = '';
    testError = '';
    testErrorDetail = '';
    testErrorHint = '';
    const recipient = testRecipient.trim();
    if (!recipient) {
      testError = 'Test recipient is required.';
      return;
    }
    emailTesting = true;
    try {
      const result = await testEmailSettings(recipient);
      if (result.status === 'ACCEPTED') testMessage = 'Test email accepted for delivery.';
      else {
        testError = result.message ?? 'Test email could not be sent.';
        testErrorDetail = result.detail ?? '';
        testErrorHint = result.hint ?? '';
      }
    } catch (error) {
      testError = friendlyError(error, 'Failed to send test email');
    } finally {
      emailTesting = false;
    }
  }

  async function saveProfile(user: EditableUser) {
    user.saving = true;
    user.error = '';
    try {
      replaceUser(await updateAdminUser(user.id, {
        displayName: user.editDisplayName.trim(),
        email: user.editEmail.trim(),
      }));
    } catch (error) {
      user.saving = false;
      user.error = friendlyError(error, 'Failed to update user');
    }
  }

  async function setAdmin(user: EditableUser, admin: boolean) {
    user.error = '';
    try {
      replaceUser(await updateUserAdmin(user.id, admin));
    } catch (error) {
      user.error = friendlyError(error, 'Failed to update admin state');
    }
  }

  async function setBlocked(user: EditableUser, blocked: boolean) {
    user.error = '';
    try {
      replaceUser(await updateUserBlocked(user.id, blocked));
    } catch (error) {
      user.error = friendlyError(error, 'Failed to update blocked state');
    }
  }

  async function createRecovery(user: EditableUser) {
    user.error = '';
    try {
      recoveryLinks = { ...recoveryLinks, [user.id]: await createRecoveryLink(user.id) };
    } catch (error) {
      user.error = friendlyError(error, 'Failed to create recovery link');
    }
  }
</script>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-heading">Admin</h1>
    <p class="text-sm text-muted mt-1">Manage this Todo instance.</p>
  </div>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-heading">Settings</h2>
    <div class="flex items-center justify-between border border-border rounded-lg p-4">
      <div>
        <p class="text-sm font-medium text-heading">Registration</p>
        <p class="text-sm text-muted">Allow new account creation.</p>
      </div>
      <Toggle checked={registrationEnabled} ariaLabel="Registration enabled" onchange={saveRegistration} />
    </div>
    {#if settingsMessage}<p class="text-sm text-success-strong">{settingsMessage}</p>{/if}
    {#if settingsError}<p class="text-sm text-danger-strong">{settingsError}</p>{/if}

    <div class="border border-border rounded-lg p-4 space-y-3">
      <div>
        <p class="text-sm font-medium text-heading">Application links</p>
      </div>
      <TextInput
        bind:value={publicBaseUrl}
        label="Public app URL"
        description="Base URL used when the server creates links to this Todo instance, for example https://todo.example.com without a trailing slash."
        class="w-full"
        oninput={schedulePublicBaseUrlSave}
        onblur={() => { if (!publicBaseUrlError) void savePublicBaseUrl(); }}
      />
      {#if publicBaseUrlSaving}<p class="text-sm text-muted">Saving public app URL…</p>{/if}
      {#if publicBaseUrlMessage}<p class="text-sm text-success-strong">{publicBaseUrlMessage}</p>{/if}
      {#if publicBaseUrlError}<p class="text-sm text-danger-strong">{publicBaseUrlError}</p>{/if}
    </div>

    <div class="border border-border rounded-lg p-4 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-heading">Email</p>
          <p class="text-sm text-muted">Source: {emailSettings.source === 'DEPLOYMENT' ? 'deployment' : 'runtime'}</p>
        </div>
        <Toggle checked={emailDraft.enabled} ariaLabel="Email delivery enabled" onchange={(checked) => { emailDraft.enabled = checked; }} />
      </div>

      <div class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_11rem]">
          <TextInput bind:value={emailDraft.host} label="SMTP host" class="w-full" />
          <TextInput
            value={emailDraft.port}
            label="SMTP port"
            type="number"
            class="w-full"
            oninput={(event) => {
              emailDraft.port = event.currentTarget.value;
              portEdited = true;
            }}
          />
          <Select
            options={encryptionOptions}
            selected={emailDraft.encryption}
            label="Encryption"
            size="compact"
            class="w-full"
            getOptionLabel={encryptionLabel}
            onSelect={setEmailEncryption}
          />
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <TextInput bind:value={emailDraft.fromName} label="Sender name" class="w-full" />
          <TextInput bind:value={emailDraft.from} label="Sender email" type="email" class="w-full" />
        </div>
      </div>

      <div class="space-y-3 border-t border-border pt-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-heading">SMTP authentication</p>
            <p class="text-sm text-muted">Require username and password.</p>
          </div>
          <Toggle checked={emailDraft.authEnabled} ariaLabel="SMTP authentication enabled" onchange={(checked) => { emailDraft.authEnabled = checked; }} />
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <TextInput bind:value={emailDraft.username} label="Username" class="w-full" disabled={!emailDraft.authEnabled} />
          <TextInput
            value={emailDraft.password}
            label="Password"
            type="password"
            class="w-full"
            placeholder={emailSettings.passwordConfigured ? '********' : ''}
            disabled={!emailDraft.authEnabled}
            oninput={(event) => {
              passwordEdited = true;
              emailDraft.password = event.currentTarget.value;
            }}
          />
        </div>
        <p class="text-xs text-muted">
          Password configured: {emailSettings.passwordConfigured ? 'yes' : 'no'}
        </p>
      </div>

      {#if emailValidation.length}
        <div class="text-sm text-danger-strong space-y-1">
          {#each emailValidation as error}
            <p>{error}</p>
          {/each}
        </div>
      {/if}
      {#if emailMessage}<p class="text-sm text-success-strong">{emailMessage}</p>{/if}
      {#if emailError}<p class="text-sm text-danger-strong">{emailError}</p>{/if}

      <div class="flex flex-wrap gap-2">
        <Button tone="primary" appearance="solid" size="small" onclick={saveEmailSettings} disabled={!emailDirty || emailSaving}>
          {emailSaving ? 'Saving…' : 'Save email settings'}
        </Button>
        <Button tone="neutral" appearance="outline" size="small" onclick={discardEmailDraft} disabled={!emailDirty || emailSaving}>
          Discard
        </Button>
        {#if emailSettings.source === 'RUNTIME'}
          <Button tone="danger" appearance="outline" size="small" onclick={resetEmailToDeployment}>
            Reset to deployment settings
          </Button>
        {/if}
      </div>

      <div class="grid sm:grid-cols-[1fr_auto] gap-2 border-t border-border pt-4">
        <TextInput bind:value={testRecipient} label="Test recipient" type="email" class="w-full" />
        <div class="self-end">
          <Button tone="neutral" appearance="outline" size="small" onclick={sendTestEmail} disabled={emailTesting || emailDirty}>
            {emailTesting ? 'Sending…' : 'Test email settings'}
          </Button>
        </div>
      </div>
      {#if testMessage}<p class="text-sm text-success-strong">{testMessage}</p>{/if}
      {#if testError}
        <div class="space-y-1 text-sm text-danger-strong">
          <p>{testError}</p>
          {#if testErrorDetail}<p>{testErrorDetail}</p>{/if}
          {#if testErrorHint}<p>{testErrorHint}</p>{/if}
        </div>
      {/if}
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-heading">Usage</h2>
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Users</p><p class="text-xl font-semibold">{data.stats.users}</p></div>
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Admins</p><p class="text-xl font-semibold">{data.stats.admins}</p></div>
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Blocked</p><p class="text-xl font-semibold">{data.stats.blockedUsers}</p></div>
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Lists</p><p class="text-xl font-semibold">{data.stats.lists}</p></div>
      <div class="border border-border rounded-lg p-3"><p class="text-xs text-muted">Items</p><p class="text-xl font-semibold">{data.stats.todoItems}</p></div>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-heading">Users</h2>
    <div class="space-y-3">
      {#each users as user (user.id)}
        <div class="border border-border rounded-lg p-4 space-y-3">
          <div class="grid sm:grid-cols-2 gap-3">
            <TextInput bind:value={user.editDisplayName} label="Display name" class="w-full" />
            <TextInput bind:value={user.editEmail} label="Email" type="email" class="w-full" />
          </div>
          <div class="flex flex-wrap items-center gap-4 text-sm">
            <label class="flex items-center gap-2">
              <Toggle checked={user.admin} ariaLabel="Admin {user.email}" onchange={(checked) => setAdmin(user, checked)} />
              Admin
            </label>
            <label class="flex items-center gap-2">
              <Toggle checked={user.blocked} ariaLabel="Blocked {user.email}" onchange={(checked) => setBlocked(user, checked)} />
              Blocked
            </label>
            <span class="text-muted">{user.passkeyCount} passkey{user.passkeyCount === 1 ? '' : 's'}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button tone="primary" appearance="solid" size="small" onclick={() => saveProfile(user)} disabled={user.saving}>
              {user.saving ? 'Saving…' : 'Save profile'}
            </Button>
            <Button tone="neutral" appearance="outline" size="small" onclick={() => createRecovery(user)} disabled={user.blocked}>
              Create recovery link
            </Button>
          </div>
          {#if recoveryLinks[user.id]}
            <div class="bg-warning-surface border border-warning-soft rounded p-3 text-sm text-warning-heading break-all">
              <p class="font-medium mb-1">Secret recovery URL, expires {new Date(recoveryLinks[user.id].expiresAt).toLocaleString()}</p>
              <p>{recoveryLinks[user.id].url}</p>
            </div>
          {/if}
          {#if user.error}<p class="text-sm text-danger-strong">{user.error}</p>{/if}
        </div>
      {/each}
    </div>
  </section>
</div>
