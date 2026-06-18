<script lang="ts">
	import TimezonePicker from '../TimezonePicker.svelte';

	let selected = $state<string | null>('UTC');
</script>

<TimezonePicker bind:selected label="Bound timezone" />
<output>{selected}</output>
