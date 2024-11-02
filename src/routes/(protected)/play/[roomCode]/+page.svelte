<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { getGameClient } from '$lib/stores/gameclient.svelte';
	import { onMount } from 'svelte';
	let { data }: { data: PageData } = $props();

	const GS = getGameClient();

	const Messages = {
		JOIN_ROOM: 'join-room',
		GAME_ACTION: 'game-action'
	} as const;

	$effect(() => {
		if (!GS.sock) return;
		GS.send(Messages.JOIN_ROOM, $page.params.roomCode);
	});
</script>

<main>
	{JSON.stringify($page.params.roomCode)}
</main>
