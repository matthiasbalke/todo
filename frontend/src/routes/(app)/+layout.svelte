<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { logout } from '$lib/api/auth';
  import { clearSession, getAccessToken, getCurrentUser, refreshIfExpired } from '$lib/stores/auth.svelte';
  import { flushOfflineQueue, hasPending } from '$lib/stores/offlineQueue.svelte';
  import { loadItemsForList } from '$lib/stores/items.svelte';
  import Button from '$lib/components/Button.svelte';

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
  }

  let { children } = $props();
  let user = $derived(getCurrentUser());
  let userMenuOpen = $state(false);
  let offline = $state(false);
  let syncing = $state(false);
  let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);

  onMount(() => {
    offline = !navigator.onLine;
    const setOffline = () => { offline = true; };
    const setOnline  = async () => {
      offline = false;
      if (hasPending()) {
        syncing = true;
        const affected = await flushOfflineQueue();
        await Promise.all([...affected].map((id) => loadItemsForList(id)));
        syncing = false;
      }
    };
    window.addEventListener('offline', setOffline);
    window.addEventListener('online',  setOnline);

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    async function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const valid = await refreshIfExpired();
        if (!valid) await goto('/auth');
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('offline', setOffline);
      window.removeEventListener('online',  setOnline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });

  async function installApp() {
    await deferredPrompt?.prompt();
    deferredPrompt = null;
  }

  async function handleLogout() {
    userMenuOpen = false;
    const token = getAccessToken();
    if (token) {
      await logout(token);
    }
    clearSession();
    await goto('/auth');
  }
</script>

<div>
  <header class="bg-surface border-b border-border-subtle sticky top-0 z-10">
    <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/lists" class="text-lg font-bold text-heading">Todo</a>

      {#if userMenuOpen}
        <div
          class="fixed inset-0 z-10"
          role="presentation"
          onclick={() => (userMenuOpen = false)}
        ></div>
      {/if}

      <div class="flex items-center gap-2">
        {#if deferredPrompt}
          <Button tone="primary" appearance="solid"
            onclick={installApp}
            size="compact"
          >
            Install app
          </Button>
        {/if}
      </div>

      <div class="relative">
        <Button tone="neutral" appearance="ghost"
          size="small"
          onclick={() => (userMenuOpen = !userMenuOpen)}
          aria-label="User menu"
        >
          <span class="text-sm text-muted">{user?.displayName ?? ''}</span>
          <div class="w-8 h-8 rounded-full bg-primary-subtle text-primary-strong flex items-center justify-center text-sm font-semibold select-none">
            {(user?.displayName ?? '?')[0]}
          </div>
        </Button>

        {#if userMenuOpen}
          <div class="absolute right-0 top-10 z-20 w-44 bg-surface border border-border rounded-lg shadow-lg py-1">
            <a
              href="/account"
              onclick={() => (userMenuOpen = false)}
              class="block w-full text-left px-4 py-2 text-sm font-normal text-label hover:bg-canvas"
            >
              Account
            </a>
            {#if user?.admin}
              <a
                href="/admin"
                onclick={() => (userMenuOpen = false)}
                class="block w-full text-left px-4 py-2 text-sm font-normal text-danger-strong hover:bg-danger-surface"
              >
                Admin
              </a>
            {/if}
            <div class="border-t border-border-subtle my-1"></div>
            <Button tone="neutral" appearance="bare"
              size="menu"
              align="start"
              weight="normal"
              onclick={handleLogout}
            >
              Log out
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </header>
  {#if syncing}
    <div class="bg-primary-surface border-b border-primary-soft text-primary-emphasis text-sm text-center py-2 px-4">
      Syncing…
    </div>
  {:else if offline}
    <div class="bg-warning-surface border-b border-warning-soft text-warning-emphasis text-sm text-center py-2 px-4">
      You're offline — changes won't be saved until you reconnect.
    </div>
  {/if}
  <main class="max-w-2xl mx-auto px-4 py-6">
    {@render children()}
  </main>
</div>
