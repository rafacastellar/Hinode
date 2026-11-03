import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { calcularHashToken } from '#lib/server/auth/criptografia';
import {
	buscarSessaoValidaPorHash,
	renovarSessao,
	buscarSessaoSaasValidaPorHash,
	renovarSessaoSaas
} from '#lib/server/repositorios/sessao.repo';
import { buscarPerfisDoUsuarioNaAcademia } from '#lib/server/repositorios/usuario.repo';
import { sincronizarSchemaBanco } from '#lib/server/db/auto-migration';

const TEMPO_INATIVIDADE_MS = 2 * 60 * 60 * 1000; // 2 horas (7200 segundos)
const INTERVALO_MINIMO_RENOVACAO_MS = 10 * 60 * 1000; // 10 minutos (evita updates desnecessários a cada requisição)

export const handle: Handle = async ({ event, resolve }) => {
	// Garante integridade do banco sem bloquear a requisição
	sincronizarSchemaBanco().catch(() => {});

	const tokenSessao = event.cookies.get('hinode_session');

	// Valores padrão de segurança (não autenticado)
	event.locals.usuario = null;
	event.locals.idAcademia = null;
	event.locals.nomeAcademia = null;
	event.locals.perfis = [];
	event.locals.superAdmin = null;

	const tokenSaas = event.cookies.get('sgt_saas_session');
	if (tokenSaas) {
		const tokenSaasHash = calcularHashToken(tokenSaas);
		const sessaoSaas = await buscarSessaoSaasValidaPorHash(tokenSaasHash);

		if (sessaoSaas) {
			const agora = Date.now();
			const tempoRestanteMs = sessaoSaas.expira_em.getTime() - agora;

			if (tempoRestanteMs > 0 && tempoRestanteMs <= TEMPO_INATIVIDADE_MS) {
				if (tempoRestanteMs < (TEMPO_INATIVIDADE_MS - INTERVALO_MINIMO_RENOVACAO_MS)) {
					const novaExpiraEm = new Date(agora + TEMPO_INATIVIDADE_MS);
					await renovarSessaoSaas(sessaoSaas.id_sessao_saas, novaExpiraEm);

					const cookieSeguro =
						event.url.protocol === 'https:' ||
						event.request.headers.get('x-forwarded-proto') === 'https' ||
						process.env.COOKIE_SECURE === 'true';

					event.cookies.set('sgt_saas_session', tokenSaas, {
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						secure: cookieSeguro,
						maxAge: Math.floor(TEMPO_INATIVIDADE_MS / 1000)
					});
				}
			}

			event.locals.superAdmin = {
				id: sessaoSaas.id_usuario,
				nome: sessaoSaas.nome_usuario,
				email: sessaoSaas.email_usuario
			};
		} else {
			event.cookies.delete('sgt_saas_session', { path: '/' });
		}
	}

	let sessaoExpirou = false;

	if (tokenSessao) {
		const tokenHash = calcularHashToken(tokenSessao);
		const sessao = await buscarSessaoValidaPorHash(tokenHash);

		if (sessao) {
			const agora = Date.now();
			const tempoRestanteMs = sessao.expira_em.getTime() - agora;

			// Sliding Expiration: se for sessão de inatividade (<= 2h) e passaram ao menos 10 min de atividade,
			// renova por mais 2 horas para garantir que o usuário não seja interrompido durante o trabalho ativo
			if (tempoRestanteMs > 0 && tempoRestanteMs <= TEMPO_INATIVIDADE_MS) {
				if (tempoRestanteMs < (TEMPO_INATIVIDADE_MS - INTERVALO_MINIMO_RENOVACAO_MS)) {
					const novaExpiraEm = new Date(agora + TEMPO_INATIVIDADE_MS);
					await renovarSessao(sessao.id_sessao, novaExpiraEm);

					const cookieSeguro =
						event.url.protocol === 'https:' ||
						event.request.headers.get('x-forwarded-proto') === 'https' ||
						process.env.COOKIE_SECURE === 'true';

					event.cookies.set('hinode_session', tokenSessao, {
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						secure: cookieSeguro,
						maxAge: Math.floor(TEMPO_INATIVIDADE_MS / 1000)
					});
				}
			}

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
			// Sessão inválida ou expirada no banco: limpa o cookie obsoleto
			sessaoExpirou = true;
			event.cookies.delete('hinode_session', { path: '/' });
		}
	}

	const rota = event.url.pathname;

	// Proteção de rotas do Control Plane SaaS (/saas-admin)
	if (rota.startsWith('/saas-admin')) {
		if (rota === '/saas-admin/login') {
			if (event.locals.superAdmin) {
				throw redirect(303, '/saas-admin');
			}
		} else {
			if (!event.locals.superAdmin) {
				throw redirect(303, `/saas-admin/login?redirect=${encodeURIComponent(rota)}`);
			}
		}
	}

	// Proteção de rotas do painel administrativo da academia (/dashboard)
	if (rota.startsWith('/dashboard')) {
		if (!event.locals.usuario || !event.locals.idAcademia) {
			const queryExpirada = sessaoExpirou ? '&expirada=1' : '';
			throw redirect(303, `/login?redirect=${encodeURIComponent(rota)}${queryExpirada}`);
		}
	}

	// Redireciona usuários já autenticados que tentarem acessar a tela de login da academia
	if (rota === '/login' && event.locals.usuario) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};

