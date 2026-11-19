import type { LayoutServerLoad } from './$types';
import { calcularPermissoes, obterMenuAutorizado, normalizarNomePapel } from '#lib/server/auth/rbac';
import {
	contarPendenciasAcaoAluno,
	obterPendenciasTecnicasDojo,
	obterPainelJudoca,
	type PendenciasTecnicasDojo,
	type PendenciaJudoca
} from '#lib/server/repositorios/dashboard.repo';
import { contarAlunosDoResponsavel } from '#lib/server/repositorios/responsavel.repo';
import { buscarPerfilCompletoParaUsuario } from '#lib/server/repositorios/usuario.repo';

export const load: LayoutServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	const idAcademia = locals.idAcademia;
	const idUsuario = locals.usuario?.id;
	const permissoes = calcularPermissoes(perfis);

	const ehGestorOuProfessor = perfis.some((p) => {
		const norm = normalizarNomePapel(p);
		return norm === 'admin' || norm === 'professor' || norm === 'recepcao';
	});
	const ehAluno = perfis.some((p) => normalizarNomePapel(p) === 'aluno');

	let totalAcoesPendentes = 0;
	if (ehAluno && !ehGestorOuProfessor && idAcademia && idUsuario) {
		try {
			totalAcoesPendentes = await contarPendenciasAcaoAluno(idAcademia, idUsuario);
		} catch (e) {
			console.error('Erro ao verificar pendências do aluno para menu:', e);
		}
	}

	let totalDependentes = 0;
	if (idAcademia && idUsuario) {
		try {
			totalDependentes = await contarAlunosDoResponsavel(idAcademia, idUsuario);
		} catch (e) {
			console.error('Erro ao verificar dependentes do responsável para menu:', e);
		}
	}

	let resumoCredenciais: {
		aluno?: { matricula: string | null; graduacaoAtual: string; nomeSensei: string } | null;
		professor?: { grauFaixa: string | null; nFederacao: string | null } | null;
	} = {};

	if (idAcademia && idUsuario) {
		try {
			const perfilCompleto = await buscarPerfilCompletoParaUsuario(idAcademia, idUsuario);
			if (perfilCompleto) {
				resumoCredenciais = {
					aluno: perfilCompleto.dados_aluno
						? {
								matricula: perfilCompleto.dados_aluno.matricula,
								graduacaoAtual: perfilCompleto.dados_aluno.graduacao_atual,
								nomeSensei: perfilCompleto.dados_aluno.nome_professor_responsavel
							}
						: null,
					professor: perfilCompleto.dados_professor
						? {
								grauFaixa: perfilCompleto.dados_professor.grau_faixa,
								nFederacao: perfilCompleto.dados_professor.n_federacao
							}
						: null
				};
			}
		} catch (e) {
			console.error('Erro ao carregar resumo de credenciais para barra superior:', e);
		}
	}

	const itensMenu = obterMenuAutorizado(perfis, {
		totalDependentes,
		temFichaAluno: Boolean(resumoCredenciais.aluno)
	}).map((item) => {
		if (ehAluno && !ehGestorOuProfessor && item.href === '/dashboard' && totalAcoesPendentes > 0) {
			return {
				...item,
				badge: `${totalAcoesPendentes} pendente${totalAcoesPendentes > 1 ? 's' : ''}`,
				badgeUrgente: true
			};
		}
		if (item.href === '/dashboard/responsavel' && totalDependentes > 0) {
			return {
				...item,
				badge: `${totalDependentes} judoca${totalDependentes > 1 ? 's' : ''}`
			};
		}
		return item;
	});

	// Carregamento de notificações para a barra superior conforme os papéis autorizados
	const perfisNorm = perfis.map((p) => normalizarNomePapel(p));
	const ehAdmin = perfisNorm.includes('admin');
	const ehProfessor = perfisNorm.includes('professor');
	const ehRecepcao = perfisNorm.includes('recepcao');
	const ehGestor = ehAdmin || ehRecepcao;
	const ehResponsavel = perfisNorm.includes('responsavel') || totalDependentes > 0;

	let pendenciasTecnicas: PendenciasTecnicasDojo | null = null;
	if (idAcademia && ehGestor) {
		try {
			pendenciasTecnicas = await obterPendenciasTecnicasDojo(idAcademia);
		} catch (e) {
			console.error('Erro ao carregar pendências técnicas do dojo para topbar:', e);
		}
	} else if (idAcademia && ehProfessor && idUsuario) {
		try {
			pendenciasTecnicas = await obterPendenciasTecnicasDojo(idAcademia, idUsuario);
			// Se o professor também for responsável por dependentes, mesclar pendências de seus tutelados
			if (ehResponsavel) {
				const pendResp = await obterPendenciasTecnicasDojo(idAcademia, undefined, idUsuario);
				if (pendResp && pendenciasTecnicas) {
					const idsCamp = new Set(pendenciasTecnicas.campeonatosPendentesAutorizacao.map((c) => c.id_inscricao));
					for (const c of pendResp.campeonatosPendentesAutorizacao) {
						if (!idsCamp.has(c.id_inscricao)) pendenciasTecnicas.campeonatosPendentesAutorizacao.push(c);
					}
					const idsSemPeso = new Set(pendenciasTecnicas.alunosSemPeso.map((a) => a.id_usuario));
					for (const a of pendResp.alunosSemPeso) {
						if (!idsSemPeso.has(a.id_usuario)) pendenciasTecnicas.alunosSemPeso.push(a);
					}
					const idsSemTurma = new Set(pendenciasTecnicas.alunosSemTurma.map((a) => a.id_usuario));
					for (const a of pendResp.alunosSemTurma) {
						if (!idsSemTurma.has(a.id_usuario)) pendenciasTecnicas.alunosSemTurma.push(a);
					}
				}
			}
		} catch (e) {
			console.error('Erro ao carregar pendências técnicas do professor para topbar:', e);
		}
	} else if (idAcademia && ehResponsavel && idUsuario) {
		try {
			pendenciasTecnicas = await obterPendenciasTecnicasDojo(idAcademia, undefined, idUsuario);
		} catch (e) {
			console.error('Erro ao carregar pendências do responsável para topbar:', e);
		}
	}

	let pendenciasJudoca: PendenciaJudoca[] = [];
	if (idAcademia && idUsuario && ehAluno) {
		try {
			const painelAluno = await obterPainelJudoca(idAcademia, idUsuario);
			if (painelAluno) {
				pendenciasJudoca = painelAluno.pendencias || [];
			}
		} catch (e) {
			console.error('Erro ao carregar pendências do judoca para topbar:', e);
		}
	}

	return {
		usuario: locals.usuario,
		idAcademia,
		nomeAcademia: locals.nomeAcademia,
		logoAcademia: locals.logoAcademia,
		perfis,
		permissoes,
		itensMenu,
		totalAcoesPendentes,
		totalDependentes,
		resumoCredenciais,
		pendenciasTecnicas,
		pendenciasJudoca
	};
};
