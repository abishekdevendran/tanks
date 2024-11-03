// gameclient.svelte.ts
import { PUBLIC_WS_URL } from '$env/static/public';
import { getContext, onDestroy, onMount, setContext } from 'svelte';
import { toast } from 'svelte-sonner';
import { io, Socket } from 'socket.io-client';

type player = {
	id: string;
	userName: string;
	isReady: boolean;
};

type MESSAGE_DATA =
	| {
			type: 'room-populate';
			players: player[];
	  }
	| {
			type: 'message';
			from: string;
			message: string;
	  }
	| {
			type: 'ready';
			user: player;
	  };

export class GameClientState {
	socket = $state<Socket | null>(null);
	isConnected = $state(false);
	messages = $state<
		{
			from: string;
			message: string;
		}[]
	>([]);
	players = $state<player[]>([]);

	constructor(wsToken: string) {
		onMount(() => {
			this.connect(wsToken);
		});

		onDestroy(() => {
			if (this.socket) {
				this.socket.disconnect();
				this.socket = null;
				this.isConnected = false;
			}
		});
	}

	private connect(wsToken: string) {
		// Initialize Socket.IO with auto-reconnection options
		const socket = io(PUBLIC_WS_URL, {
			auth: {
				token: wsToken
			},
			reconnection: true,
			reconnectionDelay: 5000,
			reconnectionAttempts: Infinity
		});

		// Set up connection event handlers
		socket.on('connect', () => {
			this.socket = socket;
			this.isConnected = true;
			toast.success('Connected!', {
				position: 'bottom-right'
			});
		});

		socket.on('connect_error', (error) => {
			this.socket = null;
			this.isConnected = false;
			toast.error('Connection failed!', {
				position: 'bottom-right'
			});
			console.error('Connection error:', error);
		});

		socket.on('disconnect', (reason) => {
			this.socket = null;
			this.isConnected = false;
			if (reason === 'io server disconnect') {
				// Server initiated disconnect, don't automatically reconnect
				socket.disconnect();
			}
			toast.loading('Reconnecting...', {
				position: 'bottom-right'
			});
		});

		socket.on('reconnecting', (attemptNumber) => {
			toast.loading(`Reconnecting... (Attempt ${attemptNumber})`, {
				position: 'bottom-right'
			});
		});

		// Handle incoming messages
		socket.on('message', (data: MESSAGE_DATA) => {
			console.log('Received message', data);
			switch (data.type) {
				case 'room-populate':
					this.players = data.players;
					break;
				case 'ready':
					this.players = this.players.map((p) => (p.id === data.user.id ? data.user : p));
					break;
				case 'message':
					this.messages = [...this.messages, { from: data.from, message: data.message }];
					break;
			}
		});

		// Store socket instance
		this.socket = socket;
	}

	send(event: string, message?: any) {
		if (this.socket?.connected) {
			console.log('Sending message', event, message);
			this.socket.emit(event, message);
			return true;
		} else {
			console.error('Tried to send message while disconnected');
			return false;
		}
	}
}

const GAME_CLIENT_KEY = Symbol('GameClient');

export function setGameClient(wsToken: string) {
	return setContext(GAME_CLIENT_KEY, new GameClientState(wsToken));
}

export function getGameClient() {
	return getContext<GameClientState>(GAME_CLIENT_KEY);
}
