import type { PageServerLoad } from './$types';
import { obterMetricasDoDojo, obterPainelJudoca } from '#lib/server/repositorios/dashboard.repo';
import { temPermissao } from '#lib/server/auth/rbac';

export const load: PageServerLoad = async ({ locals }) => {
	const idAcademia = locals.idAcademia!;
	const perfis = locals.perfis || [];
	const idUsuario = locals.usuario?.id;

	const ehGestorOuProfessor = perfis.some((p) => {
		const norm = p.toLowerCase();
		return norm === 'admin' || norm === 'professor' || norm === 'recepcao';
	});
	const ehPerfilAluno = perfis.some((p) => p.toLowerCase() === 'aluno');

	let painelJudoca = null;
	// Carrega painel do judoca caso seja aluno (e não exclusivamente um administrador executivo)
	if (ehPerfilAluno && idUsuario) {
		painelJudoca = await obterPainelJudoca(idAcademia, idUsuario);
	}

	const metricas = await obterMetricasDoDojo(idAcademia);

	return {
		usuario: locals.usuario,
		idAcademia,
		nomeAcademia: locals.nomeAcademia,
		perfis,
		metricas,
		ehAluno: Boolean(painelJudoca && !ehGestorOuProfessor),
		painelJudoca,
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
