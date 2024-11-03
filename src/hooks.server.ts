import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';
import { JWT_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';

const JWT_SECRET_VAR = JWT_SECRET || 'your-secret-key';

// Generate WebSocket token after successful authentication
const generateWsToken = (userId: string, userName: string) => {
	return jwt.sign({ id: userId, userName }, JWT_SECRET_VAR, { expiresIn: '24h' });
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);
	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		// Generate WebSocket token and attach to locals
		event.locals.wsToken = generateWsToken(user.id, user.username);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

export const handle: Handle = handleAuth;
