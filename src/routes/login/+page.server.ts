import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loginSchema } from '#lib/server/validacao/auth.schema';
import { autenticarUsuario } from '#lib/server/servicos/auth.servico';

export const load: PageServerLoad = async ({ url }) => {
	return {
		expirada: url.searchParams.get('expirada') === '1'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
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
			if (resultado.lembrar) {
				// Persistência longa (7 dias) solicitada explicitamente pelo usuário
				cookies.set('hinode_session', resultado.tokenPuro, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: process.env.NODE_ENV === 'production',
					expires: resultado.expiraEm
				});
			} else {
				// Sessão padrão por inatividade de 2 horas (7200 segundos)
				cookies.set('hinode_session', resultado.tokenPuro, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 2 * 60 * 60
				});
			}
		} catch (erro: any) {
			console.error('Erro de autenticação/banco:', erro?.message || erro);
			return fail(500, {
				erro: 'Falha ao conectar com o banco de dados. Verifique a senha do MySQL no arquivo .env.',
				email: validacao.data.email
			});
		}

		throw redirect(303, '/dashboard');
	}
};
