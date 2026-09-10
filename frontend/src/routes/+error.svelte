<script lang="ts">
  import { page } from '$app/state';

  const title = $derived(page.status === 404 ? 'Page not found' : 'Something went wrong');
  const message = $derived(
    page.status === 404
      ? 'The page you requested does not exist.'
      : page.error?.message ?? 'Please try again.'
  );
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-canvas">
  <div class="w-full max-w-sm bg-surface rounded-lg border border-border p-6 space-y-4">
    <div>
      <p class="text-sm font-medium text-muted">{page.status}</p>
      <h1 class="text-2xl font-bold text-heading mt-1">{title}</h1>
      <p class="text-sm text-muted mt-2">{message}</p>
    </div>
    <a href="/" class="block text-center rounded-lg bg-primary text-on-action hover:bg-primary-strong px-4 py-2.5 text-sm font-medium">
      Go home
    </a>
  </div>
</div>
