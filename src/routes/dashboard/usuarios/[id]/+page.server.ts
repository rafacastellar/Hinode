import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { exigirPermissao } from '#lib/server/auth/rbac';
import {
	buscarUsuarioDetalhadoNoDojo,
	listarPerfisDoSistema
} from '#lib/server/repositorios/usuario.repo';
import { listarResponsaveisDoDojo } from '#lib/server/repositorios/responsavel.repo';
import {
	atualizarUsuarioNoDojo,
	redefinirSenhaUsuarioNoDojo,
	alternarBloqueioUsuarioNoDojo,
	desvincularUsuarioDoDojo
} from '#lib/server/servicos/usuario.service';

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
		responsaveis,
		idOperadorLogado: locals.usuario?.id || null
	};
};

export const actions: Actions = {
	salvarDados: async ({ params, request, locals, getClientAddress }) => {
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
			return {
				sucesso: true,
				mensagem: 'Dados cadastrais, perfis e credenciais técnicas sincronizados com sucesso.'
			};
		} catch (erro: any) {
			return fail(400, {
				erro: erro?.message || 'Falha ao atualizar dados do usuário.'
			});
		}
	},

	redefinirSenha: async ({ params, request, locals, getClientAddress }) => {
		exigirPermissao(locals.perfis, 'USUARIOS_GERENCIAR');

		const idAcademia = locals.idAcademia;
		if (!idAcademia || !locals.usuario) {
			throw error(401, 'Sessão inválida');
		}

		const idUsuario = Number(params.id);
		const formData = await request.formData();
		const novaSenha = String(formData.get('novaSenha') || '');
		const confirmacaoSenha = String(formData.get('confirmacaoSenha') || '');

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
			return {
				sucesso: true,
				abaRetorno: 'seguranca',
				mensagem: 'Senha redefinida com sucesso. Todas as sessões ativas do usuário foram encerradas.'
			};
		} catch (erro: any) {
			return fail(400, {
				abaRetorno: 'seguranca',
				erro: erro?.message || 'Falha ao redefinir senha.'
			});
		}
	},

	alternarBloqueio: async ({ params, request, locals, getClientAddress }) => {
		exigirPermissao(locals.perfis, 'USUARIOS_GERENCIAR');

		const idAcademia = locals.idAcademia;
		if (!idAcademia || !locals.usuario) {
			throw error(401, 'Sessão inválida');
		}

		const idUsuario = Number(params.id);
		const formData = await request.formData();
		const acao = String(formData.get('acao') || '');
		const motivo = String(formData.get('motivo') || '');
		const bloquear = acao === 'bloquear';

		try {
			await alternarBloqueioUsuarioNoDojo(
				{
					idAcademia,
					idUsuarioOperador: locals.usuario.id,
					ip: getClientAddress()
				},
				idUsuario,
				bloquear,
				motivo
			);
			return {
				sucesso: true,
				abaRetorno: 'seguranca',
				mensagem: bloquear
					? 'Acesso do usuário a este dojo foi suspenso e suas sessões ativas foram revogadas.'
					: 'Acesso do usuário a este dojo foi reativado com sucesso.'
			};
		} catch (erro: any) {
			return fail(400, {
				abaRetorno: 'seguranca',
				erro: erro?.message || 'Falha ao alterar status de acesso do usuário.'
			});
		}
	},

	desvincular: async ({ params, locals, getClientAddress }) => {
		exigirPermissao(locals.perfis, 'USUARIOS_GERENCIAR');

		const idAcademia = locals.idAcademia;
		if (!idAcademia || !locals.usuario) {
			throw error(401, 'Sessão inválida');
		}

		const idUsuario = Number(params.id);

		try {
			await desvincularUsuarioDoDojo(
				{
					idAcademia,
					idUsuarioOperador: locals.usuario.id,
					ip: getClientAddress()
				},
				idUsuario
			);
		} catch (erro: any) {
			return fail(400, {
				abaRetorno: 'seguranca',
				erro: erro?.message || 'Falha ao desvincular usuário do dojo.'
			});
		}

		throw redirect(303, '/dashboard/usuarios');
	}
};
