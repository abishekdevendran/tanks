import { PUBLIC_WS_URL } from '$env/static/public';
import { getContext, onDestroy, onMount, setContext } from 'svelte';

export class GameClientState {
	sock = $state<WebSocket | null>(null);
	constructor(wsToken: string) {
		onMount(() => {
			// construct a new url with queryParam "token" as wsToken
			const wsURLQuery = new URL(PUBLIC_WS_URL);
			wsURLQuery.searchParams.set('token', wsToken);
			const ws = new WebSocket(wsURLQuery.toString());
			ws.onclose = () => {
				this.sock = null;
			};
			ws.onopen = () => {
				this.sock = ws;
			};
			ws.onerror = () => {
				this.sock = null;
			};
		});
		onDestroy(() => {
			if (this.sock) {
				this.sock.close();
				this.sock = null;
			}
		});
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
