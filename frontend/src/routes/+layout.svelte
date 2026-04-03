<script lang="ts">
  import '../app.css';
  import { appVersion } from '$lib/version';

  let { children, data } = $props();
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <div class="flex-1 flex flex-col">
    {@render children()}
  </div>
  <footer class="py-4 text-center text-xs text-gray-400">
    v{appVersion}{data.buildNumber !== '0' ? `.${data.buildNumber}` : ''}
  </footer>
</div>
