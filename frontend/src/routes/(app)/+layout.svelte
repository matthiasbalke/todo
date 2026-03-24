<script lang="ts">
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  let { children } = $props();
  const user = getCurrentUser();
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white border-b border-gray-100 sticky top-0 z-10">
    <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/lists" class="text-lg font-bold text-gray-900">Todo</a>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">{user.name}</span>
        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
          {user.name[0]}
        </div>
      </div>
    </div>
  </header>
  <main class="max-w-2xl mx-auto px-4 py-6">
    {@render children()}
  </main>
</div>
