<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { getGameClient } from '$lib/stores/gameclient.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	let { data }: { data: PageData } = $props();

	const GS = getGameClient();

	const Messages = {
		JOIN_ROOM: 'join-room',
		GAME_ACTION: 'game-action',
		LEAVE_ROOM: 'leave-room'
	} as const;

	$effect(() => {
		if (!GS.sock) return;
		GS.send(Messages.JOIN_ROOM, $page.params.roomCode);
	});

	onDestroy(() => {
    if (!GS.sock) return;
    GS.send(Messages.LEAVE_ROOM, $page.params.roomCode);
  });
</script>

<main>
	{JSON.stringify($page.params.roomCode)}
</main>
