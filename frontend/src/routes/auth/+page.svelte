<script lang="ts">
  import { goto } from '$app/navigation';

  let email = $state('');

  function handlePasskey(e: Event) {
    e.preventDefault();
    goto('/lists');
  }

  function handleGoogle(e: Event) {
    e.preventDefault();
    goto('/lists');
  }
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
    <p class="text-gray-500 text-sm mb-6">Sign in to your Todo app</p>

    <form class="space-y-4">
      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block" for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="you@example.com"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="button"
        onclick={handlePasskey}
        class="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <span>🔑</span>
        <span>Continue with Passkey</span>
      </button>
    </form>

    <div class="relative my-4">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200"></div>
      </div>
      <div class="relative flex justify-center text-xs text-gray-400">
        <span class="bg-white px-2">or</span>
      </div>
    </div>

    <button
      type="button"
      onclick={handleGoogle}
      class="w-full border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
    >
      <span>G</span>
      <span>Continue with Google</span>
    </button>
  </div>
</div>
