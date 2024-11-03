<script lang="ts">
	import { getGameClient } from '$lib/stores/gameclient.svelte';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import { Users, Swords, Trophy } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const GS = getGameClient();

	const Messages = {
		JOIN_ROOM: 'join-room',
		GAME_ACTION: 'game-action',
		LEAVE_ROOM: 'leave-room'
	} as const;

	$effect(() => {
		if (!GS.sock) return;
		GS.send(Messages.JOIN_ROOM, data.roomCode);
	});

	onDestroy(() => {
		if (!GS.sock) return;
		GS.send(Messages.LEAVE_ROOM, data.roomCode);
	});

	let players = $state([
		{ id: 1, name: 'Player 1', ready: false },
		{ id: 2, name: 'Player 2', ready: false },
		{ id: 3, name: 'Player 3', ready: false },
		{ id: 4, name: 'Player 4', ready: false }
	]);

	let currentPlayer = $state({ id: 1, name: 'Player 1', ready: false });

	function toggleReady() {
		currentPlayer.ready = !currentPlayer.ready;
		players = players.map((p) => (p.id === currentPlayer.id ? currentPlayer : p));
	}

	let allPlayersReady = $derived(players.every((p) => p.ready));
</script>

<main>
	<div class="container mx-auto p-4">
		<Card class="mx-auto w-full max-w-3xl">
			<CardHeader>
				<CardTitle class="text-center text-2xl font-bold">Tank Battle Lobby</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid sm:grid-cols-2 gap-4">
					{#each players as player (player.id)}
						<div
							class="flex items-center space-x-4 rounded-lg p-2 {player.ready
								? 'bg-green-100'
								: 'bg-gray-100'}"
						>
							<Avatar>
								<AvatarImage src="/images/user.png" alt={player.name} />
								<AvatarFallback>{player.name[0]}</AvatarFallback>
							</Avatar>
							<div class="flex-1">
								<p class="font-medium">{player.name}</p>
								<p class="text-sm text-gray-500">{player.ready ? 'Ready' : 'Not Ready'}</p>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
			<Separator />
			<CardFooter class="mt-4 flex items-center justify-between">
				<div class="flex space-x-2 text-sm text-gray-500">
					<span class="flex items-center"
						><Users class="mr-1 h-4 w-4" /> {players.length} Players</span
					>
					<span class="flex items-center"><Swords class="mr-1 h-4 w-4" /> Battle Mode</span>
					<span class="flex items-center"><Trophy class="mr-1 h-4 w-4" /> Ranked</span>
				</div>
				<Button onclick={toggleReady} variant={currentPlayer.ready ? 'destructive' : 'default'}>
					{currentPlayer.ready ? 'Unready' : 'Ready'}
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
