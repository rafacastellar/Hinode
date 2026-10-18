import type { PageServerLoad } from './$types';
import { obterMetricasDoDojo } from '#lib/server/repositorios/dashboard.repo';
import { temPermissao } from '#lib/server/auth/rbac';

export const load: PageServerLoad = async ({ locals }) => {
	const idAcademia = locals.idAcademia!;
	const metricas = await obterMetricasDoDojo(idAcademia);
	const perfis = locals.perfis || [];

	return {
		usuario: locals.usuario,
		idAcademia,
		nomeAcademia: locals.nomeAcademia,
		perfis,
		metricas,
		podeVerAlunos: temPermissao(perfis, 'ALUNOS_VER'),
		podeCriarAlunos: temPermissao(perfis, 'ALUNOS_CRIAR'),
		podeGerenciarTurmas: temPermissao(perfis, 'TURMAS_GERENCIAR'),
		podeHomologarGraduacoes: temPermissao(perfis, 'GRADUACOES_HOMOLOGAR'),
		podeGerenciarCampeonatos:
			temPermissao(perfis, 'CAMPEONATOS_CRIAR') || temPermissao(perfis, 'CAMPEONATOS_GERENCIAR'),
		podeVerUsuarios: temPermissao(perfis, 'USUARIOS_VER'),
		podeConfigurarAcademia: temPermissao(perfis, 'ACADEMIA_CONFIGURAR')
	};
};
