// deps.ts
import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
const SECRET = process.env.JWT_SECRET || 'tanksAreFun';
const app = new Hono();

app.use(logger());
app.use(csrf());

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

// health check
app.get('/health', (c) => {
	return c.json({ status: 'ok' });
});

const httpServer = serve({
	fetch: app.fetch,
	port: 8000
});

const io = new Server(httpServer as HTTPServer, {
	serveClient: false,
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	},
	connectionStateRecovery: {}
});

// auth middleware
io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	if (!token) {
		return next(new Error('Authentication error'));
	}
	// Verify token
	try {
		const payload = verify(token, SECRET);
		// attach user to socket
		const userPayload = payload as { id: string; userName: string };
		socket.data.user = { id: userPayload.id, userName: userPayload.userName, isReady: false };
		next();
	} catch (error) {
		next(new Error('Token verification failed: ' + error));
	}
});

const roomsInSession = new Set<string>();
const gameStates = new Map();

io.on('connection', (socket) => {
	console.log('connected: ', socket.data.user);
	socket.on('disconnecting', (reason) => {
		// find every room the user is in and notify the other users
		const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
		rooms.forEach((room) => {
			socket.to(room).emit('message', { type: 'room-leave', player: socket.data.user });
		});
	});
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
	socket.on('join-room', (room) => {
		// remove from other rooms if any
		const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
		rooms.forEach((r) => {
			socket.leave(r);
		});
		console.log('joining room:', room);
		socket.join(room);
		// get a list of users in the room
		const usersInRoom = io.sockets.adapter.rooms.get(room);
		if (!usersInRoom) return;
		// send each of their socket.data.user to the client
		const players = Array.from(usersInRoom).map(
			(socketId) => io.sockets.sockets.get(socketId)?.data.user
		);
		console.log('players:', players);
		socket.emit('message', { type: 'room-populate', players });
		// send everyone else the new user
		socket.to(room).emit('message', { type: 'room-join', player: socket.data.user });
	});
	socket.on('leave-room', (room) => {
		console.log('leaving room:', room);
		socket.leave(room);
		if (gameStates.has(room)) {
			const gameState = gameStates.get(room);
			delete gameState[socket.data.user.id];
			if (Object.keys(gameState).length === 0) {
				gameStates.delete(room);
				roomsInSession.delete(room);
			}
		}
		// send everyone else the user that left
		socket.to(room).emit('message', { type: 'room-leave', player: socket.data.user });
	});
	socket.on('ready', () => {
		socket.data.user.isReady = true;
		const room = Array.from(socket.rooms).find((room) => room !== socket.id);
		if (!room) return;
		const usersInRoom = io.sockets.adapter.rooms.get(room);
		if (!usersInRoom) return;
		// broadcast ready update to all users in the room
		io.to(room).emit('message', { type: 'ready', user: socket.data.user });
		const players = Array.from(usersInRoom).map(
			(socketId) => io.sockets.sockets.get(socketId)?.data.user
		);
		const allReady = players.every((player) => player.isReady) && players.length > 1;
		if (allReady) {
			const gameState: {
				[key: string]: {
					health: number;
					score: number;
				};
			} = {};
			players.forEach((player) => {
				gameState[player.id] = {
					health: 100,
					score: 0
				};
			});
			gameStates.set(room, gameState);
			roomsInSession.add(room);
			io.to(room).emit('start-game');
		}
	});
	socket.on('unready', () => {
		socket.data.user.isReady = false;
		const room = Array.from(socket.rooms).find((room) => room !== socket.id);
		if (!room) return;
		const usersInRoom = io.sockets.adapter.rooms.get(room);
		if (!usersInRoom) return;
		// broadcast ready update to all users in the room
		io.to(room).emit('message', { type: 'ready', user: socket.data.user });
	});
	socket.on('move', (data) => {
		const room = Array.from(socket.rooms).find((room) => room !== socket.id);
		if (!room || !roomsInSession.has(room)) return;

		// Update player position and broadcast to other players
		const gameState = gameStates.get(room) || {};
		gameState[socket.data.user.id] = {
			...gameState[socket.data.user.id],
			...data,
			lastUpdate: Date.now()
		};
		gameStates.set(room, gameState);

		socket.to(room).emit('player-move', {
			id: socket.data.user.id,
			...data
		});
	});

	socket.on('shoot', (data) => {
		const room = Array.from(socket.rooms).find((room) => room !== socket.id);
		if (!room || !roomsInSession.has(room)) return;

		// Broadcast shot to all players in room
		socket.to(room).emit('player-shoot', {
			id: socket.data.user.id,
			...data
		});
	});

	socket.on('hit', (data) => {
		const room = Array.from(socket.rooms).find((room) => room !== socket.id);
		if (!room || !roomsInSession.has(room)) return;

		const gameState = gameStates.get(room) || {};
		const targetPlayer = gameState[data.targetId];

		if (targetPlayer) {
			targetPlayer.health = (targetPlayer.health || 100) - 10; // 10 damage per hit

			// Broadcast hit to all players
			io.to(room).emit('player-hit', {
				targetId: data.targetId,
				shooterId: socket.data.user.id,
				health: targetPlayer.health
			});

			// Check for player elimination
			if (targetPlayer.health <= 0) {
				io.to(room).emit('player-eliminated', {
					targetId: data.targetId,
					shooterId: socket.data.user.id
				});
			}
		}
	});
});
// setInterval(() => {
// 	io.emit('message', 'Hello World');
// }, 5000);
