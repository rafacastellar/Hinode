import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { calcularHashToken } from '#lib/server/auth/criptografia';
import { buscarSessaoValidaPorHash } from '#lib/server/repositorios/sessao.repo';
import { buscarPerfisDoUsuarioNaAcademia } from '#lib/server/repositorios/usuario.repo';

export const handle: Handle = async ({ event, resolve }) => {
	const tokenSessao = event.cookies.get('hinode_session');

	// Valores padrão de segurança (não autenticado)
	event.locals.usuario = null;
	event.locals.idAcademia = null;
	event.locals.nomeAcademia = null;
	event.locals.perfis = [];

	if (tokenSessao) {
		const tokenHash = calcularHashToken(tokenSessao);
		const sessao = await buscarSessaoValidaPorHash(tokenHash);

		if (sessao) {
			// Resolve papéis acumulativos estritamente no servidor para o dojo ativo
			const perfis = await buscarPerfisDoUsuarioNaAcademia(
				sessao.id_usuario,
				sessao.id_academia
			);

			event.locals.usuario = {
				id: sessao.id_usuario,
				nome: sessao.nome_usuario,
				email: sessao.email_usuario
			};
			event.locals.idAcademia = sessao.id_academia;
			event.locals.nomeAcademia = sessao.nome_academia;
			event.locals.perfis = perfis;
		} else {
			// Sessão inválida ou expirada: remove o cookie obsoleto
			event.cookies.delete('hinode_session', { path: '/' });
		}
	}

	const rota = event.url.pathname;

	// Proteção de rotas do painel administrativo
	if (rota.startsWith('/dashboard')) {
		if (!event.locals.usuario || !event.locals.idAcademia) {
			throw redirect(303, `/login?redirect=${encodeURIComponent(rota)}`);
		}
	}

	// Redireciona usuários já autenticados que tentarem acessar a tela de login
	if (rota === '/login' && event.locals.usuario) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
