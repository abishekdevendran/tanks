// routes/+page.server.ts
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	if (
		event.params.roomCode === '' ||
		event.params.roomCode === undefined ||
		event.params.roomCode.length !== 6 ||
		isNaN(Number(event.params.roomCode))
	) {
		return redirect(301, '/play?error=Invalid Room Code');
	}
	return {
		roomCode: event.params.roomCode
	};
};
