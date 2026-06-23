<script lang="ts">
  import { page } from '$app/state';

  const title = $derived(page.status === 404 ? 'Page not found' : 'Something went wrong');
  const message = $derived(
    page.status === 404
      ? 'The page you requested does not exist.'
      : page.error?.message ?? 'Please try again.'
  );
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
  <div class="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-6 space-y-4">
    <div>
      <p class="text-sm font-medium text-gray-500">{page.status}</p>
      <h1 class="text-2xl font-bold text-gray-900 mt-1">{title}</h1>
      <p class="text-sm text-gray-500 mt-2">{message}</p>
    </div>
    <a href="/" class="block text-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 text-sm font-medium">
      Go home
    </a>
  </div>
</div>
