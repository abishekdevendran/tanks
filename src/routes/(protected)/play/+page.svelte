<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';
	import { CircleAlert } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let roomCode = $state('');

	// onMount, if error=invalid_room_code in params, show toast and redirect to /play
	$effect(() => {
		const err = $page.url.searchParams.get('error');
		if (err !== null) {
			toast.error(err);
			goto('/play');
		}
	});

	function joinRoom() {
		console.log(roomCode);
		if (roomCode.trim() === '') {
			toast.error('Please enter a room code');
			return;
		}
		if (roomCode.length !== 6) {
			toast.error('Invalid room code');
			return;
		}
		goto(`/play/${roomCode}`);
		// Add logic to join the room
	}

	function createRoom() {
		// generate a random 6-digit room code
		const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
		goto(`/play/${roomCode}`);
	}
</script>

<!-- <main>
	{JSON.stringify(data)}
</main> -->
<div class="container mx-auto flex min-h-svh w-full max-w-md items-center p-4">
	<Card class="w-full">
		<CardHeader>
			<CardTitle class="flex items-center justify-center text-center text-2xl font-bold">
				<CircleAlert class="mr-2" /> Tank Battle
			</CardTitle>
			<CardDescription class="text-center">Join or create a multiplayer game</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				class="space-y-4"
				onsubmit={(e) => {
					e.preventDefault();
					joinRoom();
				}}
			>
				<div class="space-y-2">
					<InputOTP.Root
						maxlength={6}
						class="flex items-center justify-center"
						onValueChange={(e) => (roomCode = e)}
					>
						{#snippet children({ cells })}
							<InputOTP.Group>
								{#each cells.slice(0, 2) as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator />
							<InputOTP.Group>
								{#each cells.slice(2, 4) as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator />
							<InputOTP.Group>
								{#each cells.slice(4, 6) as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
				</div>
				<Button class="w-full" type="submit" disabled={roomCode.length !== 6}>Join Room</Button>
				<div class="relative flex w-full items-center justify-center">
					<Separator class="w-full" />
					<p class="absolute left-1/2 -translate-x-1/2 bg-white px-2 text-center text-xs">OR</p>
				</div>
			</form>
		</CardContent>
		<CardFooter>
			<Button variant="outline" class="w-full" onclick={createRoom} type="button"
				>Create New Room</Button
			>
		</CardFooter>
	</Card>
</div>
