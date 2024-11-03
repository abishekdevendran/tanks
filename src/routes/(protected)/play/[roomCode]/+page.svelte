<script lang="ts">
	import { getGameClient } from '$lib/stores/gameclient.svelte';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import { Users, Swords, Trophy } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let roomCode = $state(data.roomCode); // Capture roomCode when it's available
	// If data changes, update roomCode
	$effect(() => {
		if (data.roomCode) {
			roomCode = data.roomCode;
		}
	});
	const GS = getGameClient();

	const Messages = {
		JOIN_ROOM: 'join-room',
		GAME_ACTION: 'move',
		READY: 'ready',
		UNREADY: 'unready',
		LEAVE_ROOM: 'leave-room'
	} as const;

	const ReturnMessages = {
		START_GAME: 'start-game'
	} as const;

	$effect(() => {
		if (!GS.socket || !GS.isConnected) return;
		console.log('Listening for game start');
		function gameHandler() {
			GS.socket?.off(ReturnMessages.START_GAME, gameHandler);
			goto(`/play/${roomCode}/fun`);
		}
		GS.socket.on(ReturnMessages.START_GAME, gameHandler);
		return () => {
			GS.socket?.off(ReturnMessages.START_GAME, gameHandler);
		};
	});

	function toggleReady() {
		if (currentPlayer?.isReady) {
			GS.send(Messages.UNREADY);
		} else {
			GS.send(Messages.READY);
		}
	}

	let allPlayersReady = $derived(GS.players.length > 1 && GS.players.every((p) => p.isReady));
	let currentPlayer = $derived(GS.players.find((p) => p.id === data.user.id));
</script>

<main>
	<div class="container mx-auto p-4">
		<Card class="mx-auto w-full max-w-3xl">
			<CardHeader>
				<CardTitle class="text-center text-2xl font-bold">Tank Battle Lobby</CardTitle>
			</CardHeader>
			<CardContent>
				{#each GS.messages as message}
					<div>{message}</div>
				{/each}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each GS.players as player (player.id)}
						<div
							class="flex items-center space-x-4 rounded-lg p-2 {player.isReady
								? 'bg-green-100'
								: 'bg-gray-100'}"
						>
							<Avatar>
								<!-- <AvatarImage src="/images/user.png" alt={player.userName} /> -->
								<AvatarFallback>{player.userName[0]}</AvatarFallback>
							</Avatar>
							<div class="flex-1">
								<p class="font-medium">{player.userName}</p>
								<p class="text-sm text-gray-500">{player.isReady ? 'isReady' : 'Not isReady'}</p>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
			<Separator />
			<CardFooter class="mt-4 flex items-center justify-between">
				<div class="flex space-x-2 text-sm text-gray-500">
					<span class="flex items-center"
						><Users class="mr-1 h-4 w-4" /> {GS.players.length} Players</span
					>
					<span class="flex items-center"><Swords class="mr-1 h-4 w-4" /> Battle Mode</span>
					<span class="flex items-center"><Trophy class="mr-1 h-4 w-4" /> Ranked</span>
				</div>
				<Button onclick={toggleReady} variant={currentPlayer?.isReady ? 'destructive' : 'default'}>
					{currentPlayer?.isReady ? 'Unready' : 'Ready'}
				</Button>
			</CardFooter>
		</Card>

		{#if allPlayersReady}
			<div class="mt-4 text-center">
				<Button class="w-full max-w-md">Start Game</Button>
			</div>
		{/if}
	</div>
</main>
