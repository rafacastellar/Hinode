import type { PageServerLoad } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import { listarTurmasDoDojo } from '#lib/server/repositorios/turma.repo';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'TURMAS_VER');

	const idAcademia = locals.idAcademia!;
	const turmas = await listarTurmasDoDojo(idAcademia);

	return {
		turmas,
		podeGerenciar: temPermissao(perfis, 'TURMAS_GERENCIAR')
	};
};
