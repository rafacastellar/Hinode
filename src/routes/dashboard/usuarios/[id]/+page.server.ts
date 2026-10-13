import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { exigirPermissao } from '#lib/server/auth/rbac';
import {
	buscarUsuarioDetalhadoNoDojo,
	listarPerfisDoSistema
} from '#lib/server/repositorios/usuario.repo';
import { listarResponsaveisDoDojo } from '#lib/server/repositorios/responsavel.repo';
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

	const [usuario, perfis, responsaveis] = await Promise.all([
		buscarUsuarioDetalhadoNoDojo(idAcademia, idUsuario),
		listarPerfisDoSistema(),
		listarResponsaveisDoDojo(idAcademia)
	]);

	if (!usuario) {
		throw error(404, 'Usuário não encontrado neste dojo.');
	}

	return {
		usuario,
		perfis,
		responsaveis
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
			grauFaixa: formData.get('grauFaixa') ? String(formData.get('grauFaixa')) : null,
			// Endereço Completo
			cep: formData.get('cep') ? String(formData.get('cep')) : null,
			logradouro: formData.get('logradouro') ? String(formData.get('logradouro')) : null,
			numero: formData.get('numero') ? String(formData.get('numero')) : null,
			complemento: formData.get('complemento') ? String(formData.get('complemento')) : null,
			bairro: formData.get('bairro') ? String(formData.get('bairro')) : null,
			cidade: formData.get('cidade') ? String(formData.get('cidade')) : null,
			uf: formData.get('uf') ? String(formData.get('uf')) : null,
			// Responsável Legal
			idResponsavel: formData.get('idResponsavel') ? Number(formData.get('idResponsavel')) : null,
			responsavelParentesco: formData.get('responsavelParentesco')
				? String(formData.get('responsavelParentesco'))
				: 'Responsável Legal',
			responsavelFinanceiro: formData.get('responsavelFinanceiro') === 'on',
			responsaveisJson: formData.get('responsaveisJson')
				? String(formData.get('responsaveisJson'))
				: null
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
