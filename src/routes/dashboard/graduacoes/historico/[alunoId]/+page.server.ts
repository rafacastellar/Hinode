import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import { buscarAlunoPorId } from '#lib/server/repositorios/aluno.repo';
import { buscarHistoricoDoAluno } from '#lib/server/repositorios/graduacao.repo';

export const load: PageServerLoad = async ({ params, locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_VER');

	const idAcademia = locals.idAcademia!;
	const idAluno = Number(params.alunoId);

	if (isNaN(idAluno) || idAluno <= 0) {
		throw error(404, 'Judoca inválido');
	}

	const aluno = await buscarAlunoPorId(idAcademia, idAluno);
	if (!aluno) {
		throw error(404, 'Judoca não encontrado no dojo');
	}

	const historico = await buscarHistoricoDoAluno(idAcademia, idAluno);

	return {
		aluno,
		historico,
		podeHomologar: temPermissao(perfis, 'GRADUACOES_HOMOLOGAR')
	};
};
