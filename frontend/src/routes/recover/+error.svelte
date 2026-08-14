<script lang="ts">
  import { page } from '$app/state';

  const message = $derived(page.error?.message ?? 'Recovery link cannot be used.');
  const blocked = $derived(/account .*blocked|blocked .*account/i.test(message));
  const title = $derived(blocked ? 'Account blocked' : 'Recovery link unavailable');
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
  <div class="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-6 space-y-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{title}</h1>
      <p class="text-sm text-gray-500 mt-2">{message}</p>
    </div>
    <a href="/auth" class="block text-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 text-sm font-medium">
      Go to login
    </a>
  </div>
</div>
