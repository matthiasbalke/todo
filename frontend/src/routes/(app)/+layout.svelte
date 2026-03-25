<script lang="ts">
  import { getCurrentUser } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  let { children } = $props();
  const user = getCurrentUser();
  let userMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white border-b border-gray-100 sticky top-0 z-10">
    <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/lists" class="text-lg font-bold text-gray-900">Todo</a>

      {#if userMenuOpen}
        <div
          class="fixed inset-0 z-10"
          role="presentation"
          onclick={() => (userMenuOpen = false)}
        ></div>
      {/if}

      <div class="relative">
        <button
          onclick={() => (userMenuOpen = !userMenuOpen)}
          class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 transition-colors"
          aria-label="User menu"
        >
          <span class="text-sm text-gray-500">{user.name}</span>
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold select-none">
            {user.name[0]}
          </div>
        </button>

        {#if userMenuOpen}
          <div class="absolute right-0 top-10 z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            <button
              onclick={() => { userMenuOpen = false; goto('/auth'); }}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        {/if}
      </div>
    </div>
  </header>
  <main class="max-w-2xl mx-auto px-4 py-6">
    {@render children()}
  </main>
</div>
