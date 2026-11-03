import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import {
	obterUsuarioParaEdicaoSaas,
	listarAcademiasSaas,
	listarPerfisSaas,
	atualizarUsuarioSaas
} from '#lib/server/repositorios/saas-admin.repo';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.superAdmin) {
		throw error(401, 'Não autorizado.');
	}

	const idUsuario = Number(params.id);
	if (!idUsuario) {
		throw error(404, 'Usuário não encontrado.');
	}

	const [usuario, academias, perfis] = await Promise.all([
		obterUsuarioParaEdicaoSaas(idUsuario),
		listarAcademiasSaas(),
		listarPerfisSaas()
	]);

	if (!usuario) {
		throw error(404, 'Usuário não localizado no sistema.');
	}

	return {
		usuario,
		academias,
		perfis,
		idSuperAdminLogado: locals.superAdmin.id
	};
};

export const actions: Actions = {
	salvar: async ({ request, params, locals, getClientAddress }) => {
		if (!locals.superAdmin) {
			return fail(401, { erro: 'Não autorizado.' });
		}

		const idUsuario = Number(params.id);
		if (!idUsuario) {
			return fail(400, { erro: 'ID do usuário inválido.' });
		}

		const formData = await request.formData();
		const nome = String(formData.get('nome') || '').trim();
		const tipoDocumento = (formData.get('tipoDocumento') as 'CPF' | 'ESTRANGEIRO') || 'CPF';
		const cpf = String(formData.get('cpf') || '').trim();
		const paisOrigem = String(formData.get('paisOrigem') || 'Brasil').trim();
		const dataNascimento = String(formData.get('dataNascimento') || '').trim();
		const genero = (formData.get('genero') as 'M' | 'F') || 'M';
		const email = String(formData.get('email') || '').trim().toLowerCase();
		const telefone = formData.get('telefone') ? String(formData.get('telefone')).trim() : null;
		const novaSenha = formData.get('novaSenha') ? String(formData.get('novaSenha')).trim() : null;
		const isSuperAdmin = formData.get('isSuperAdmin') === '1' || formData.get('isSuperAdmin') === 'on';
		const ativo = formData.get('ativo') === '1' || formData.get('ativo') === 'on';
		const motivoBloqueio = formData.get('motivoBloqueio') ? String(formData.get('motivoBloqueio')).trim() : null;

		// Vínculos com Academias enviados via JSON estruturado
		const vinculosJson = formData.get('vinculosJson');
		let vinculosAcademias: Array<{ idAcademia: number; ativo: boolean; idsPerfis: number[] }> = [];

		if (vinculosJson) {
			try {
				vinculosAcademias = JSON.parse(String(vinculosJson));
			} catch (e) {
				// ignora erro de parse
			}
		}

		if (!nome || !cpf || !dataNascimento || !email) {
			return fail(400, { erro: 'Preencha todos os campos obrigatórios.' });
		}

		if (novaSenha && novaSenha.length < 6) {
			return fail(400, { erro: 'A nova senha deve possuir no mínimo 6 caracteres.' });
		}

		try {
			await atualizarUsuarioSaas(
				idUsuario,
				{
					nome,
					tipoDocumento,
					cpf,
					paisOrigem,
					dataNascimento,
					genero,
					email,
					telefone,
					novaSenha,
					isSuperAdmin,
					ativo,
					motivoBloqueio,
					vinculosAcademias
				},
				locals.superAdmin.id,
				getClientAddress()
			);

			return { sucesso: true, mensagem: 'Dados do usuário atualizados com sucesso.' };
		} catch (erro: any) {
			return fail(400, { erro: erro?.message || 'Falha ao atualizar dados do usuário.' });
		}
	}
};

