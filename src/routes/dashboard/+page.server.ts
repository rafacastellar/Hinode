import type { PageServerLoad } from './$types';
import {
	obterMetricasDoDojo,
	obterPainelJudoca,
	obterPainelProfessor,
	obterPainelResponsavel,
	obterAniversariantesDaSemana,
	obterPendenciasTecnicasDojo
} from '#lib/server/repositorios/dashboard.repo';
import { temPermissao } from '#lib/server/auth/rbac';

export const load: PageServerLoad = async ({ locals, url }) => {
	const idAcademia = locals.idAcademia!;
	const perfis = locals.perfis || [];
	const idUsuario = locals.usuario?.id;

	const perfisNorm = perfis.map((p) => p.toLowerCase());
	const temAluno = perfisNorm.includes('aluno');
	const temProfessor = perfisNorm.includes('professor');
	const temAdmin = perfisNorm.includes('admin');
	const temRecepcao = perfisNorm.includes('recepção') || perfisNorm.includes('recepcao');
	const temResponsavel = perfisNorm.includes('responsável') || perfisNorm.includes('responsavel');

	// 1. Resolução da perspectiva ativa (URL param ?visao=... ou preferência padrão)
	const visaoParam = url.searchParams.get('visao')?.toLowerCase();
	let visaoAtiva = 'admin';

	if (visaoParam === 'aluno' && temAluno) {
		visaoAtiva = 'aluno';
	} else if (visaoParam === 'professor' && temProfessor) {
		visaoAtiva = 'professor';
	} else if (visaoParam === 'admin' && temAdmin) {
		visaoAtiva = 'admin';
	} else if (visaoParam === 'recepcao' && temRecepcao) {
		visaoAtiva = 'recepcao';
	} else if (visaoParam === 'responsavel' && temResponsavel) {
		visaoAtiva = 'responsavel';
	} else {
		// Padrão por autoridade quando não informado na URL
		if (temAdmin) {
			visaoAtiva = 'admin';
		} else if (temProfessor) {
			visaoAtiva = 'professor';
		} else if (temRecepcao) {
			visaoAtiva = 'recepcao';
		} else if (temAluno) {
			visaoAtiva = 'aluno';
		} else if (temResponsavel) {
			visaoAtiva = 'responsavel';
		}
	}

	// 2. Carregamento condicional de dados conforme a perspectiva ativa
	let painelJudoca = null;
	let painelProfessor = null;
	let painelResponsavel = null;
	let aniversariantes = null;
	let pendenciasTecnicas = null;

	if (visaoAtiva === 'aluno' && idUsuario) {
		painelJudoca = await obterPainelJudoca(idAcademia, idUsuario);
		// Se o usuário não possui matrícula ativa de atleta no tatame mas é responsável, ativa a visão da família
		if (!painelJudoca && temResponsavel) {
			visaoAtiva = 'responsavel';
			painelResponsavel = await obterPainelResponsavel(idAcademia, idUsuario);
		}
	} else if (visaoAtiva === 'professor' && idUsuario) {
		painelProfessor = await obterPainelProfessor(idAcademia, idUsuario);
	} else if (visaoAtiva === 'responsavel' && idUsuario) {
		painelResponsavel = await obterPainelResponsavel(idAcademia, idUsuario);
	}

	// Aniversariantes são exibidos para toda a equipe do dojo (Admin, Professor, Recepção), mas nunca para Alunos/Responsáveis
	const ehEquipeDojo = temAdmin || temProfessor || temRecepcao;
	if (ehEquipeDojo) {
		aniversariantes = await obterAniversariantesDaSemana(idAcademia);
	}

	// Pendências técnicas de conformidade de alunos para a equipe administrativa e recepção do dojo
	if (
		visaoAtiva === 'admin' ||
		visaoAtiva === 'recepcao' ||
		(!painelJudoca && !painelProfessor && !painelResponsavel && (temAdmin || temRecepcao))
	) {
		pendenciasTecnicas = await obterPendenciasTecnicasDojo(idAcademia);
	}

	const metricas = await obterMetricasDoDojo(idAcademia);

	return {
		usuario: locals.usuario,
		idAcademia,
		nomeAcademia: locals.nomeAcademia,
		perfis,
		visaoAtiva,
		ehAluno: visaoAtiva === 'aluno',
		painelJudoca,
		painelProfessor,
		painelResponsavel,
		aniversariantes,
		pendenciasTecnicas,
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
