import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import {
	listarUsuariosGlobalSaas,
	alternarBloqueioGlobalUsuario,
	listarAcademiasSaas
} from '#lib/server/repositorios/saas-admin.repo';

export const load: PageServerLoad = async ({ url }) => {
	const busca = url.searchParams.get('busca') || '';
	const [usuarios, academias] = await Promise.all([
		listarUsuariosGlobalSaas(busca),
		listarAcademiasSaas()
	]);

	return {
		usuarios,
		academias,
		busca
	};
};

export const actions: Actions = {
	alternarBloqueioGlobal: async ({ request, locals, getClientAddress }) => {
		if (!locals.superAdmin) {
			return fail(401, { erro: 'Não autorizado.' });
		}

		const formData = await request.formData();
		const idUsuario = Number(formData.get('idUsuario'));
		const acao = String(formData.get('acao') || '');
		const motivo = String(formData.get('motivo') || '');

		if (!idUsuario) {
			return fail(400, { erro: 'ID do usuário não fornecido.' });
		}

		const bloquear = acao === 'bloquear';

		try {
			await alternarBloqueioGlobalUsuario(
				idUsuario,
				locals.superAdmin.id,
				bloquear,
				motivo,
				getClientAddress()
			);
			return {
				sucesso: true,
				mensagem: bloquear
					? 'Usuário bloqueado globalmente em toda a plataforma SaaS.'
					: 'Acesso global do usuário reativado com sucesso.'
			};
		} catch (erro: any) {
			return fail(400, { erro: erro?.message || 'Falha ao alterar status global do usuário.' });
		}
	}
};
