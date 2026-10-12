import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { exigirPermissao } from '#lib/server/auth/rbac';
import {
	listarUsuariosDoDojo,
	listarPerfisDoSistema
} from '#lib/server/repositorios/usuario.repo';
import {
	desvincularUsuarioDoDojo,
	redefinirSenhaUsuarioNoDojo
} from '#lib/server/servicos/usuario.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	exigirPermissao(locals.perfis, 'USUARIOS_VER');

	const idAcademia = locals.idAcademia;
	if (!idAcademia) {
		throw error(401, 'Sessão inválida');
	}

	const busca = url.searchParams.get('busca') || '';
	const perfilParam = url.searchParams.get('perfil');
	const idPerfilFiltro = perfilParam ? Number(perfilParam) : undefined;

	const [usuarios, perfis] = await Promise.all([
		listarUsuariosDoDojo(idAcademia, busca, idPerfilFiltro),
		listarPerfisDoSistema()
	]);

	return {
		usuarios,
		perfis,
		busca,
		perfilSelecionado: idPerfilFiltro || null
	};
};

export const actions: Actions = {
	desvincular: async ({ request, locals, getClientAddress }) => {
		exigirPermissao(locals.perfis, 'USUARIOS_GERENCIAR');

		const idAcademia = locals.idAcademia;
		if (!idAcademia || !locals.usuario) {
			throw error(401, 'Sessão inválida');
		}

		const formData = await request.formData();
		const idUsuario = Number(formData.get('idUsuario'));

		if (!idUsuario) {
			return fail(400, { erro: 'ID do usuário não fornecido.' });
		}

		try {
			await desvincularUsuarioDoDojo(
				{
					idAcademia,
					idUsuarioOperador: locals.usuario.id,
					ip: getClientAddress()
				},
				idUsuario
			);
			return { sucesso: true, mensagem: 'Vínculo do usuário com o dojo removido com sucesso.' };
		} catch (erro: any) {
			return fail(400, { erro: erro?.message || 'Falha ao desvincular usuário.' });
		}
	},

	redefinirSenha: async ({ request, locals, getClientAddress }) => {
		exigirPermissao(locals.perfis, 'USUARIOS_GERENCIAR');

		const idAcademia = locals.idAcademia;
		if (!idAcademia || !locals.usuario) {
			throw error(401, 'Sessão inválida');
		}

		const formData = await request.formData();
		const idUsuario = Number(formData.get('idUsuario'));
		const novaSenha = String(formData.get('novaSenha') || '');
		const confirmacaoSenha = String(formData.get('confirmacaoSenha') || '');

		if (!idUsuario) {
			return fail(400, { erro: 'ID do usuário não fornecido.' });
		}

		try {
			await redefinirSenhaUsuarioNoDojo(
				{
					idAcademia,
					idUsuarioOperador: locals.usuario.id,
					ip: getClientAddress()
				},
				idUsuario,
				{ novaSenha, confirmacaoSenha }
			);
			return { sucesso: true, mensagem: 'Senha redefinida com sucesso. Sessões ativas foram encerradas.' };
		} catch (erro: any) {
			return fail(400, { erro: erro?.message || 'Falha ao redefinir senha.' });
		}
	}
};
