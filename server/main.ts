// deps.ts
import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/deno';
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';

// types.ts
interface GameState {
	players: Map<string, Player>;
	rooms: Map<string, GameRoom>;
}

interface Player {
	id: string;
	ws: WebSocket;
	room?: string;
}

interface GameRoom {
	id: string;
	players: Set<string>;
	state: {
		isPlaying: boolean;
		readiedPlayers: Set<string>;
	};
}

interface GameMessage {
	action: string;
	message: any;
}

const app = new Hono();

// In-memory game state
const gameState: GameState = {
	players: new Map(),
	rooms: new Map()
};

// Middleware to verify JWT token
async function verifyToken(token: string | null): Promise<string | null> {
	if (!token) return null;

	try {
		// Your JWT secret key (should match the one used in SvelteKit)
		const JWT_SECRET_KEY = await crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'tanksAreFun'),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		);
		const payload = await verify(token, JWT_SECRET_KEY);
		return payload.sub as string;
	} catch {
		return null;
	}
}

app.use(logger());
app.use(csrf());
// app.use(
// 	'*',
// 	cors({
// 		origin: '*'
// 	})
// );

// health check
app.get('/health', (c) => {
	return c.json({ status: 'ok', connectedPlayers: gameState.players.size });
});

app.get('/debug', (c) => {
	return c.json({
		players: Array.from(gameState.players.keys()),
		rooms: Array.from(gameState.rooms.keys())
	});
});

app.get(
	'/ws',
	upgradeWebSocket(async (c) => {
		const token = c.req.query('token') ?? null;
		// console.log('Token:', token);
		const userId = await verifyToken(token);
		// console.log('User ID:', userId);
		if (!userId) {
			return {};
		}

		return {
			onOpen(_event, ws) {
				if (!ws.raw) return;
				// Store player connection
				const player: Player = {
					id: userId,
					ws: ws.raw
				};

				gameState.players.set(userId, player);
				console.log(`Player ${userId} connected`);
				broadcast({
					type: 'player_joined',
					playerId: userId
				});
			},

			onMessage(message, _ws) {
				console.log(`Received message:`, message.data);
				try {
					const data = JSON.parse(message.data as string) as GameMessage;
					handleGameMessage(userId, data);
				} catch (error) {
					console.error('Error handling game message:', error);
				}
			},

			onClose() {
				console.log(`Player ${userId} disconnected`);
				handlePlayerDisconnect(userId);
			}
		};
	})
);

function handleGameMessage(playerId: string, message: GameMessage) {
	console.log(`Player ${playerId} sent message:`, message);
	const player = gameState.players.get(playerId);
	if (!player) return;

	switch (message.action.trim().toLowerCase()) {
		case 'join-room':
			handleJoinRoom(player, message.message);
			break;
		case 'game-action':
			handleGameAction(player, message.action);
			break;
		default:
			console.log(`Unknown message type: ${message.action}`);
			broadcastToRoom(player.room!, {
				type: 'error',
				message: `Unknown message type: ${message.action}`
			});
	}
}

function handleJoinRoom(player: Player, roomId: string) {
	let room = gameState.rooms.get(roomId);
	// cleanup old room if player is already in a room
	if (player.room) {
		const oldRoom = gameState.rooms.get(player.room);
		if (oldRoom) {
			oldRoom.players.delete(player.id);
			if (oldRoom.players.size === 0) {
				gameState.rooms.delete(player.room);
			} else {
				broadcastToRoom(player.room, {
					type: 'player_left',
					playerId: player.id
				});
			}
		}
	}
	// Create room if it doesn't exist
	if (!room) {
		room = {
			id: roomId,
			players: new Set(),
			state: {
				isPlaying: false,
				readiedPlayers: new Set()
			} // Initialize game state
		};
		gameState.rooms.set(roomId, room);
	}

	room.players.add(player.id);
	player.room = roomId;

	// Notify room players
	broadcastToRoom(roomId, {
		type: 'player_joined_room',
		playerId: player.id
	});
}

function handleGameAction(player: Player, action: any) {
	if (!player.room) return;

	const room = gameState.rooms.get(player.room);
	if (!room) return;

	// Update game state based on action
	// ... your game logic here ...

	// Broadcast updated state to room
	broadcastToRoom(player.room, {
		type: 'game_state_update',
		state: room.state
	});
}

function handlePlayerDisconnect(playerId: string) {
	const player = gameState.players.get(playerId);
	if (!player) return;

	if (player.room) {
		const room = gameState.rooms.get(player.room);
		if (room) {
			room.players.delete(playerId);

			// Clean up empty rooms
			if (room.players.size === 0) {
				gameState.rooms.delete(player.room);
			} else {
				broadcastToRoom(player.room, {
					type: 'player_left',
					playerId
				});
			}
		}
	}

	gameState.players.delete(playerId);
}

function broadcast(message: any) {
	const messageStr = JSON.stringify(message);
	for (const player of gameState.players.values()) {
		if (player.ws.readyState === WebSocket.OPEN) {
			player.ws.send(messageStr);
		}
	}
}

function broadcastToRoom(roomId: string, message: any) {
	const room = gameState.rooms.get(roomId);
	if (!room) return;

	const messageStr = JSON.stringify(message);
	for (const playerId of room.players) {
		const player = gameState.players.get(playerId);
		if (player?.ws.readyState === WebSocket.OPEN) {
			player.ws.send(messageStr);
		}
	}
}

// Start the server
Deno.serve(app.fetch);
