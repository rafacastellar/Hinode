import { redirect, type RequestHandler } from '@sveltejs/kit';
import { calcularHashToken } from '#lib/server/auth/criptografia';
import { revogarSessaoSaasPorHash } from '#lib/server/repositorios/sessao.repo';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('sgt_saas_session');
	if (token) {
		const hash = calcularHashToken(token);
		await revogarSessaoSaasPorHash(hash);
		cookies.delete('sgt_saas_session', { path: '/' });
	}

	throw redirect(303, '/saas-admin/login');
};

