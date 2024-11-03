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
	}
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

io.on('connection', (socket) => {
	console.log('connected: ', socket.data.user);
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
		console.log('users in room:', usersInRoom);
		// send each of their socket.data.user to the client
		const players = Array.from(usersInRoom).map(
			(socketId) => io.sockets.sockets.get(socketId)?.data.user
		);
		console.log('players:', players);
		socket.emit('message', { type: 'room-populate', players });
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
		const allReady = players.every((player) => player.isReady);
		if (allReady) {
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
});
// setInterval(() => {
// 	io.emit('message', 'Hello World');
// }, 5000);
