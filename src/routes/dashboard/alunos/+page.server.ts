import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import { listarAlunos, obterHistoricoMudancasPeso } from '#lib/server/repositorios/aluno.repo';
import { recalcularCategoriasDojo } from '#lib/server/servicos/aluno.service';

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
	}
};
