<script lang="ts">
	import { getGameClient } from '$lib/stores/gameclient.svelte';
	import { onDestroy, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const Messages = {
		JOIN_ROOM: 'join-room',
		GAME_ACTION: 'move',
		READY: 'ready',
		UNREADY: 'unready',
		LEAVE_ROOM: 'leave-room'
	} as const;

	let roomCode = $state(data.roomCode); // Capture roomCode when it's available
	// If data changes, update roomCode
	$effect(() => {
		if (data.roomCode) {
			roomCode = data.roomCode;
		}
	});
	const GS = getGameClient();

	//Use $effect.once for initialization
	$effect(() => {
		if (!GS.isConnected) return;
		GS.send(Messages.JOIN_ROOM, roomCode);
	});

	onDestroy(() => {
		GS.clearRoomData(roomCode);
	});
</script>

{@render children()}
