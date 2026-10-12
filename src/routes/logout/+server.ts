import { redirect, type RequestHandler } from '@sveltejs/kit';
import { encerrarSessao } from '#lib/server/servicos/auth.servico';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('hinode_session');
	if (token) {
		await encerrarSessao(token);
		cookies.delete('hinode_session', { path: '/' });
	}
	throw redirect(303, '/login');
};

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('hinode_session');
	if (token) {
		await encerrarSessao(token);
		cookies.delete('hinode_session', { path: '/' });
	}
	throw redirect(303, '/login');
};
