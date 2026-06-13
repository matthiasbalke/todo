<script lang="ts">
	import Toggle from '../Toggle.svelte';

	let checked = $state(false);
	let element = $state<HTMLButtonElement | null>(null);
</script>

<Toggle bind:checked bind:element ariaLabel="Bound setting" />
<output>{checked ? 'on' : 'off'}</output>
<output>{element?.tagName ?? 'unbound'}</output>
