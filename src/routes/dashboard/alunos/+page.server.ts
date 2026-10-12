import type { PageServerLoad } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { listarAlunos } from '#lib/server/repositorios/aluno.repo';

export const load: PageServerLoad = async ({ locals, url }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'ALUNOS_VER');

	const idAcademia = locals.idAcademia!;
	const busca = url.searchParams.get('busca') || '';

	const alunos = await listarAlunos(idAcademia, busca);

	return {
		alunos,
		busca
	};
};
