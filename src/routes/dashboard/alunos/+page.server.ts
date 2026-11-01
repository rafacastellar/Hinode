import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import { listarAlunos, obterHistoricoMudancasPeso } from '#lib/server/repositorios/aluno.repo';
import {
	recalcularCategoriasDojo,
	registrarPesagemRapidaAluno
} from '#lib/server/servicos/aluno.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'ALUNOS_VER');

	const idAcademia = locals.idAcademia!;
	const busca = url.searchParams.get('busca') || '';

	const [alunos, historicoMudancasPeso] = await Promise.all([
		listarAlunos(idAcademia, busca),
		obterHistoricoMudancasPeso(idAcademia, 30)
	]);

	return {
		alunos,
		busca,
		historicoMudancasPeso,
		podeCriarAluno: temPermissao(perfis, 'ALUNOS_CRIAR'),
		podeEditarAluno: temPermissao(perfis, 'ALUNOS_EDITAR')
	};
};

export const actions: Actions = {
	recalcularCategorias: async ({ locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'ALUNOS_EDITAR');

		const idAcademia = locals.idAcademia!;
		const resultado = await recalcularCategoriasDojo(idAcademia);

		return {
			sucesso: true,
			mensagem: `${resultado.totalAtualizados} de ${resultado.totalAlunos} judocas tiveram suas categorias e divisões atualizadas com sucesso pelo regulamento oficial CBJ/FPJ.`
		};
	},

	pesagemRapida: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'ALUNOS_EDITAR');

		const idAcademia = locals.idAcademia!;
		const idUsuarioExecutor = locals.usuario!.id;

		const formData = await request.formData();
		const idAluno = Number(formData.get('id_aluno'));
		const pesoBruto = String(formData.get('peso') || '').replace(',', '.');
		const novoPeso = parseFloat(pesoBruto);

		if (!idAluno || !Number.isFinite(novoPeso)) {
			return fail(400, {
				erro: 'Informe um peso numérico válido para registrar a pesagem.'
			});
		}

		try {
			const res = await registrarPesagemRapidaAluno(
				idAcademia,
				idUsuarioExecutor,
				idAluno,
				novoPeso
			);
			return {
				sucesso: true,
				mensagem: res.mensagem
			};
		} catch (err: any) {
			return fail(400, {
				erro: err?.body?.message || 'Não foi possível salvar a pesagem do judoca.'
			});
		}
	}
};
