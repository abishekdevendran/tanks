import { PUBLIC_WS_URL } from '$env/static/public';
import { getContext, onDestroy, onMount, setContext } from 'svelte';
import { toast } from 'svelte-sonner';
export class GameClientState {
	sock = $state<WebSocket | null>(null);
	reconnectingPromise: string | number | undefined = $state();
	messages = $state<
		{
			from: string;
			message: string;
		}[]
	>([]);
	constructor(wsToken: string) {
		onMount(() => {
			this.connect(wsToken);
		});
		onDestroy(() => {
			if (this.sock) {
				this.sock.close();
				this.sock = null;
			}
		});
	}

	private connect(wsToken: string) {
		const wsURLQuery = new URL(PUBLIC_WS_URL);
		wsURLQuery.searchParams.set('token', wsToken);
		const ws = new WebSocket(wsURLQuery.toString());

		const promiseToast = toast.promise(
			new Promise<void>((resolve, reject) => {
				ws.onopen = () => {
					this.sock = ws;
					resolve();
				};
				ws.onerror = (err) => {
					this.sock = null;
					reject(err);
				};
				ws.onclose = () => {
					this.sock = null;
					this.reconnect(wsToken);
				};
			}),
			{
				loading: 'Connecting...',
				success: 'Connected!',
				error: 'Connection failed!',
				position: 'bottom-right'
			}
		);
		this.reconnectingPromise = promiseToast;
	}

	private reconnect(wsToken: string) {
		if (!this.reconnectingPromise) {
			this.reconnectingPromise = toast.promise(
				new Promise<void>((resolve) => {
					setTimeout(() => {
						this.connect(wsToken);
						resolve();
					}, 5000); // Attempt to reconnect after 5 seconds
				}),
				{
					loading: 'Reconnecting...',
					position: 'bottom-right'
				}
			);
		}
	}

	send(action: string, message?: any) {
		if (this.sock) {
			console.log('Sending message', action, message);
			this.sock.send(
				JSON.stringify({
					action,
					message
				})
			);
		} else {
			console.error('Tried to send message to closed socket');
		}
	}
}

const GAME_CLIENT_KEY = Symbol('GameClient');

export function setGameClient(wsToken: string) {
	return setContext(GAME_CLIENT_KEY, new GameClientState(wsToken));
}

export function getGameClient() {
	return getContext<ReturnType<typeof setGameClient>>(GAME_CLIENT_KEY);
}
