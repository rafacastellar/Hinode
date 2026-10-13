import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { exigirPermissao } from '#lib/server/auth/rbac';
import {
	buscarUsuarioDetalhadoNoDojo,
	listarPerfisDoSistema
} from '#lib/server/repositorios/usuario.repo';
import { atualizarUsuarioNoDojo } from '#lib/server/servicos/usuario.service';

export const load: PageServerLoad = async ({ params, locals }) => {
	exigirPermissao(locals.perfis, 'USUARIOS_GERENCIAR');

	const idAcademia = locals.idAcademia;
	if (!idAcademia) {
		throw error(401, 'Sessão inválida');
	}

	const idUsuario = Number(params.id);
	if (isNaN(idUsuario)) {
		throw error(404, 'Identificador de usuário inválido.');
	}

	const [usuario, perfis] = await Promise.all([
		buscarUsuarioDetalhadoNoDojo(idAcademia, idUsuario),
		listarPerfisDoSistema()
	]);

	if (!usuario) {
		throw error(404, 'Usuário não encontrado neste dojo.');
	}

	return {
		usuario,
		perfis
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals, getClientAddress }) => {
		exigirPermissao(locals.perfis, 'USUARIOS_GERENCIAR');

		const idAcademia = locals.idAcademia;
		if (!idAcademia || !locals.usuario) {
			throw error(401, 'Sessão inválida');
		}

		const idUsuario = Number(params.id);
		if (isNaN(idUsuario)) {
			throw error(404, 'Usuário não encontrado');
		}

		const formData = await request.formData();
		const idsPerfisRaw = formData.getAll('idsPerfis');

		const dados = {
			nome: String(formData.get('nome') || ''),
			email: String(formData.get('email') || ''),
			dataNascimento: String(formData.get('dataNascimento') || ''),
			genero: (formData.get('genero') || 'M') as 'M' | 'F',
			telefone: formData.get('telefone') ? String(formData.get('telefone')) : null,
			idsPerfis: idsPerfisRaw.map((id) => Number(id)),
			nFederacao: formData.get('nFederacao') ? String(formData.get('nFederacao')) : null,
			grauFaixa: formData.get('grauFaixa') ? String(formData.get('grauFaixa')) : null
		};

		try {
			await atualizarUsuarioNoDojo(
				{
					idAcademia,
					idUsuarioOperador: locals.usuario.id,
					ip: getClientAddress()
				},
				idUsuario,
				dados
			);
		} catch (erro: any) {
			return fail(400, {
				erro: erro?.message || 'Falha ao atualizar dados do usuário.'
			});
		}

		throw redirect(303, '/dashboard/usuarios');
	}
};
