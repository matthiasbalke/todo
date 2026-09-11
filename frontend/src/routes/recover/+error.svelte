<script lang="ts">
  import { page } from '$app/state';

  const message = $derived(page.error?.message ?? 'Recovery link cannot be used.');
  const blocked = $derived(/account .*blocked|blocked .*account/i.test(message));
  const title = $derived(blocked ? 'Account blocked' : 'Recovery link unavailable');
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-canvas">
  <div class="w-full max-w-sm bg-surface rounded-lg border border-border p-6 space-y-4">
    <div>
      <h1 class="text-2xl font-bold text-heading">{title}</h1>
      <p class="text-sm text-muted mt-2">{message}</p>
    </div>
    <a href="/auth" class="block text-center rounded-lg bg-primary text-on-action hover:bg-primary-strong px-4 py-2.5 text-sm font-medium">
      Go to login
    </a>
  </div>
</div>
