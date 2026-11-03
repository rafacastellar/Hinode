import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loginSchema } from '#lib/server/validacao/auth.schema';
import { autenticarUsuario } from '#lib/server/servicos/auth.servico';
import { buscarAcademiaPorHostOuSlug } from '#lib/server/repositorios/academia.repo';

export const load: PageServerLoad = async ({ url, request }) => {
	const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
	const slugParam = url.searchParams.get('dojo') || url.searchParams.get('academia');

	let academiaPersonalizada = null;
	try {
		academiaPersonalizada = await buscarAcademiaPorHostOuSlug(host, slugParam);
	} catch {
		academiaPersonalizada = null;
	}

	return {
		expirada: url.searchParams.get('expirada') === '1',
		academiaPersonalizada
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const senha = formData.get('senha');
		const idAcademia = formData.get('idAcademia');
		const lembrar = formData.get('lembrar') === 'on' || formData.get('lembrar') === 'true';

		const validacao = loginSchema.safeParse({
			email,
			senha,
			idAcademia: idAcademia ? Number(idAcademia) : undefined,
			lembrar
		});

		if (!validacao.success) {
			const primeiraMensagem =
				validacao.error.issues?.[0]?.message || 'Dados de login inválidos';
			return fail(400, {
				erro: primeiraMensagem,
				email: typeof email === 'string' ? email : ''
			});
		}

		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent');

		try {
			const resultado = await autenticarUsuario(validacao.data, { ip, userAgent });

			if (!resultado.sucesso) {
				if ('precisaSelecionarAcademia' in resultado) {
					return {
						precisaSelecionarAcademia: true,
						academias: resultado.academias,
						email: validacao.data.email
					};
				}

				return fail(400, {
					erro: resultado.erro,
					email: validacao.data.email
				});
			}

			// Sessão autenticada: emite o cookie httpOnly seguro
			const cookieSeguro =
				url.protocol === 'https:' ||
				request.headers.get('x-forwarded-proto') === 'https' ||
				process.env.COOKIE_SECURE === 'true';

			if (resultado.lembrar) {
				cookies.set('hinode_session', resultado.tokenPuro, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: cookieSeguro,
					expires: resultado.expiraEm
				});
			} else {
				cookies.set('hinode_session', resultado.tokenPuro, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: cookieSeguro,
					maxAge: 2 * 60 * 60
				});
			}

			// Retorna os dados da academia autenticada para acionar a transição cinematográfica com o logo da academia!
			return {
				autenticadoComSucesso: true,
				destino: '/dashboard',
				academiaLogada: {
					id: resultado.idAcademia,
					nome: resultado.nomeAcademia,
					logo: resultado.logoAcademia
				},
				nomeUsuario: resultado.usuario.nome
			};
		} catch (erro: any) {
			console.error('Erro de autenticação/banco:', erro?.message || erro);
			return fail(500, {
				erro: 'Falha ao conectar com o banco de dados. Verifique a senha do MySQL no arquivo .env.',
				email: validacao.data.email
			});
		}
	}
};
