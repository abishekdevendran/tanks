<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getGameClient } from '$lib/stores/gameclient.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const GS = getGameClient();

	// Canvas setup
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animationId: number;

	// Game state
	interface Tank {
		id: string;
		x: number;
		y: number;
		angle: number; // Body angle
		turretAngle: number;
		color: string;
		keys: {
			up: boolean;
			down: boolean;
			left: boolean;
			right: boolean;
			rotateLeft: boolean;
			rotateRight: boolean;
		};
	}

	let tanks = $state<Tank[]>([]);
	const TANK_SPEED = 3;
	const ROTATION_SPEED = 3;
	const TANK_SIZE = 30;
	const TURRET_LENGTH = 20;

	// Initialize tanks in corners
	function initializeTanks() {
		const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
		tanks = GS.players.map((player, index) => {
			// Calculate spawn positions in corners
			const cornerX = index % 2 === 0 ? 50 : canvas.width - 50;
			const cornerY = index < 2 ? 50 : canvas.height - 50;

			return {
				id: player.id,
				x: cornerX,
				y: cornerY,
				angle: 0,
				turretAngle: 0,
				color: colors[index],
				keys: {
					up: false,
					down: false,
					left: false,
					right: false,
					rotateLeft: false,
					rotateRight: false
				}
			};
		});
	}

	// Handle keyboard input
	function handleKeyDown(event: KeyboardEvent) {
		event.preventDefault();
		const tank = tanks.find((t) => t.id === data.user.id);
		if (!tank) return;

		switch (event.key.toLowerCase()) {
			case 'w':
				tank.keys.up = true;
				break;
			case 's':
				tank.keys.down = true;
				break;
			case 'a':
				tank.keys.left = true;
				break;
			case 'd':
				tank.keys.right = true;
				break;
			case 'arrowleft':
				tank.keys.rotateLeft = true;
				break;
			case 'arrowright':
				tank.keys.rotateRight = true;
				break;
		}
	}

	function handleKeyUp(event: KeyboardEvent) {
		event.preventDefault();
		const tank = tanks.find((t) => t.id === data.user.id);
		if (!tank) return;

		switch (event.key.toLowerCase()) {
			case 'w':
				tank.keys.up = false;
				break;
			case 's':
				tank.keys.down = false;
				break;
			case 'a':
				tank.keys.left = false;
				break;
			case 'd':
				tank.keys.right = false;
				break;
			case 'arrowleft':
				tank.keys.rotateLeft = false;
				break;
			case 'arrowright':
				tank.keys.rotateRight = false;
				break;
		}
	}

	// Update tank positions and angles
	function updateTank(tank: Tank) {
		if (tank.keys.left) {
			tank.angle -= ROTATION_SPEED;
		}
		if (tank.keys.right) {
			tank.angle += ROTATION_SPEED;
		}

		if (tank.keys.up) {
			tank.x += Math.cos((tank.angle * Math.PI) / 180) * TANK_SPEED;
			tank.y += Math.sin((tank.angle * Math.PI) / 180) * TANK_SPEED;
		}
		if (tank.keys.down) {
			tank.x -= Math.cos((tank.angle * Math.PI) / 180) * TANK_SPEED;
			tank.y -= Math.sin((tank.angle * Math.PI) / 180) * TANK_SPEED;
		}

		// Update turret rotation
		if (tank.keys.rotateLeft) {
			tank.turretAngle -= ROTATION_SPEED;
		}
		if (tank.keys.rotateRight) {
			tank.turretAngle += ROTATION_SPEED;
		}

		// Keep tank within bounds
		tank.x = Math.max(TANK_SIZE, Math.min(canvas.width - TANK_SIZE, tank.x));
		tank.y = Math.max(TANK_SIZE, Math.min(canvas.height - TANK_SIZE, tank.y));
	}

	// Draw a single tank
	function drawTank(tank: Tank) {
		ctx.save();

		// Move to tank position and rotate
		ctx.translate(tank.x, tank.y);
		ctx.rotate((tank.angle * Math.PI) / 180);

		// Draw tank body (square)
		ctx.fillStyle = tank.color;
		ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);

		// Draw turret (rectangle)
		ctx.rotate(((tank.turretAngle - tank.angle) * Math.PI) / 180);
		ctx.fillStyle = '#000';
		ctx.fillRect(0, -2, TURRET_LENGTH, 4);

		ctx.restore();
	}

	// Game loop
	function gameLoop() {
		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Update and draw all tanks
		tanks.forEach((tank) => {
			updateTank(tank);
			drawTank(tank);
		});

		// Continue game loop
		animationId = requestAnimationFrame(gameLoop);
	}

	// Initialize game
	onMount(() => {
		ctx = canvas.getContext('2d')!;

		// Set canvas size
		canvas.width = 800;
		canvas.height = 600;

		// Initialize tanks and start game loop
		initializeTanks();
		gameLoop();

		// Add event listeners
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
	});

	// Cleanup
	onDestroy(() => {
		cancelAnimationFrame(animationId);
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('keyup', handleKeyUp);
	});

	// Sync game state with server (you can implement this based on your needs)
	const Messages = {
		GAME_ACTION: 'move',
		GAME_ACTION_RECV: 'player-move'
	} as const;

	$effect(() => {
		if (!GS.socket || !GS.isConnected) return;

		const currentTank = tanks.find((t) => t.id === data.user.id);
		if (currentTank) {
			GS.send(Messages.GAME_ACTION, {
				x: currentTank.x,
				y: currentTank.y,
				angle: currentTank.angle,
				turretAngle: currentTank.turretAngle
			});
		}
	});

	// Handle incoming game state updates
	$effect(() => {
		if (!GS.socket || !GS.isConnected) return;
		console.log('Listening for game state updates');
		GS.socket.on(Messages.GAME_ACTION_RECV, (data) => {
			console.log('Received game state update:', data);
			const tank = tanks.find((t) => t.id === data.id);
			if (tank) {
				tank.x = data.x;
				tank.y = data.y;
				tank.angle = data.angle;
				tank.turretAngle = data.turretAngle;
			}
		});
	});
</script>

<div class="container mx-auto p-4">
	<canvas bind:this={canvas} class="mx-auto rounded-lg border border-gray-300 shadow-lg"></canvas>
</div>
