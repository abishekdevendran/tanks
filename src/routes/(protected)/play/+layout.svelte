<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { getGameClient, setGameClient } from '$lib/stores/gameclient.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	setGameClient(data.wsToken);
</script>

{@render children()}
