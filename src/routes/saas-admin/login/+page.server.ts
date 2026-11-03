import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { z } from 'zod';
import { autenticarSuperAdminSaas } from '#lib/server/servicos/auth.servico';

const loginSaasSchema = z.object({
	email: z.string().email('E-mail inválido').trim().toLowerCase(),
	senha: z.string().min(1, 'A senha é obrigatória')
});

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.superAdmin) {
		throw redirect(303, '/saas-admin');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const senha = formData.get('senha');

		const validacao = loginSaasSchema.safeParse({ email, senha });
		if (!validacao.success) {
			return fail(400, {
				erro: validacao.error.issues[0]?.message || 'Credenciais inválidas',
				email: typeof email === 'string' ? email : ''
			});
		}

		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent');

		try {
			const resultado = await autenticarSuperAdminSaas(validacao.data, { ip, userAgent });
			if (!resultado.sucesso) {
				return fail(401, {
					erro: resultado.erro,
					email: validacao.data.email
				});
			}

			const cookieSeguro =
				url.protocol === 'https:' ||
				request.headers.get('x-forwarded-proto') === 'https' ||
				process.env.COOKIE_SECURE === 'true';

			cookies.set('sgt_saas_session', resultado.tokenPuro, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: cookieSeguro,
				maxAge: 2 * 60 * 60 // 2 horas
			});
		} catch (erro: any) {
			console.error('Erro de login no /saas-admin:', erro);
			return fail(500, {
				erro: 'Falha interna ao autenticar no painel do SaaS.',
				email: validacao.data.email
			});
		}

		throw redirect(303, '/saas-admin');
	}
};

