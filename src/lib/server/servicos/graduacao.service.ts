import { error } from '@sveltejs/kit';
import { executarTransacao } from '../db/pool';
import {
	buscarEventoGraduacaoPorId,
	inserirEventoGraduacaoEmTransacao,
	atualizarEventoGraduacaoEmTransacao,
	excluirEventoGraduacao,
	inscreverAlunoNoEventoEmTransacao,
	cancelarInscricaoDoEvento,
	homologarAprovacaoNoEventoEmTransacao,
	obterOuCriarEventoGraduacaoEmTransacao,
	atualizarFaixaAlunoEmTransacao,
	inserirHistoricoGraduacaoEmTransacao,
	registrarLogAuditoriaEmTransacao
} from '../repositorios/graduacao.repo';
import { buscarAlunoPorId } from '../repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '../repositorios/professor.repo';
import {
	validarElegibilidadeGraduacao,
	validarPeriodoInscricaoGraduacao
} from './regras-graduacao';
import type {
	EventoGraduacaoInput,
	InscricaoGraduacaoInput,
	HomologacaoEventoInput,
	GraduacaoInput
} from '../validacao/graduacao.schema';

export interface ResultadoGraduacao {
	sucesso: boolean;
	idHistorico: number;
	faixaAnterior: string;
	novaFaixa: string;
	mensagem: string;
}

/**
 * Criação de evento/exame de graduação no dojo com regras de carência e endereço.
 */
export async function cadastrarEventoGraduacao(
	idAcademia: number,
	dados: EventoGraduacaoInput
): Promise<{ sucesso: boolean; idEvento: number }> {
	return await executarTransacao(async (conn) => {
		const idEvento = await inserirEventoGraduacaoEmTransacao(conn, idAcademia, dados);
		return {
			sucesso: true,
			idEvento
		};
	});
}

/**
 * Edição de evento/exame de graduação pelo professor.
 */
export async function editarEventoGraduacao(
	idAcademia: number,
	idEvento: number,
	dados: EventoGraduacaoInput
): Promise<{ sucesso: boolean }> {
	return await executarTransacao(async (conn) => {
		await atualizarEventoGraduacaoEmTransacao(conn, idAcademia, idEvento, dados);
		return { sucesso: true };
	});
}

/**
 * Exclusão de evento de graduação (protegido contra exclusão de eventos com histórico).
 */
export async function excluirEventoGraduacaoDoDojo(
	idAcademia: number,
	idEvento: number
): Promise<{ sucesso: boolean }> {
	await excluirEventoGraduacao(idAcademia, idEvento);
	return { sucesso: true };
}

/**
 * Inscreve um judoca no exame de graduação após validação rigorosa de período e elegibilidade.
 */
export async function inscreverAlunoNoExame(
	idAcademia: number,
	dados: InscricaoGraduacaoInput
): Promise<{ sucesso: boolean; idInscricao: number }> {
	// 1. Busca dados do evento
	const evento = await buscarEventoGraduacaoPorId(idAcademia, dados.idEvento);
	if (!evento) {
		throw error(404, { message: 'Evento de graduação não encontrado.' });
	}

	// 2. Valida período de inscrições
	const periodo = validarPeriodoInscricaoGraduacao(
		evento.data_inicio_inscricao_iso,
		evento.data_fim_inscricao_iso
	);
	if (!periodo.aberta) {
		throw error(400, {
			message: periodo.motivo || 'Período de inscrições para este exame está fechado.'
		});
	}

	// 3. Busca dados do aluno
	const aluno = await buscarAlunoPorId(idAcademia, dados.idAluno);
	if (!aluno) {
		throw error(404, { message: 'Judoca não encontrado nesta academia.' });
	}

	// 4. Validação de elegibilidade pedagógica
	const checagem = validarElegibilidadeGraduacao({
		faixaAtleta: aluno.graduacao_atual || 'Branca',
		faixaInicioEvento: evento.faixa_inicio,
		faixaFimEvento: evento.faixa_fim,
		dataInicioJudoAtleta: aluno.data_inicio,
		dataUltimaGraduacaoAtleta: null,
		dataPrimeiraGraduacaoAtleta: aluno.data_primeira_graduacao,
		tempoMinimoJudoMeses: evento.tempo_minimo_judo_meses,
		tempoMinimoUltimaGraduacaoMeses: evento.tempo_minimo_ultima_graduacao_meses,
		dataEventoIso: evento.data_inicio_iso
	});

	if (!checagem.elegivel) {
		throw error(400, {
			message: `Judoca não elegível para este exame: ${checagem.motivo}`
		});
	}

	// 5. Efetua a inscrição em transação atômica
	return await executarTransacao(async (conn) => {
		const idInscricao = await inscreverAlunoNoEventoEmTransacao(conn, {
			idEvento: dados.idEvento,
			idAluno: dados.idAluno,
			valor: dados.valor || evento.taxa_graduacao || 0
		});

		return {
			sucesso: true,
			idInscricao
		};
	});
}

/**
 * Remove a inscrição de um judoca no exame de graduação.
 */
export async function cancelarInscricaoAlunoNoExame(
	idAcademia: number,
	idEvento: number,
	idAluno: number
): Promise<{ sucesso: boolean }> {
	await cancelarInscricaoDoEvento(idAcademia, idEvento, idAluno);
	return { sucesso: true };
}

/**
 * Homologa individualmente a graduação de um aluno no tatame da cerimônia oficial.
 */
export async function homologarAprovacaoNoExame(
	idAcademia: number,
	idUsuarioExecutor: number,
	dados: HomologacaoEventoInput
): Promise<{ sucesso: boolean; idHistorico: number }> {
	return await executarTransacao(async (conn) => {
		const res = await homologarAprovacaoNoEventoEmTransacao(
			conn,
			idAcademia,
			idUsuarioExecutor,
			dados
		);

		return {
			sucesso: true,
			idHistorico: res.idHistorico
		};
	});
}

/**
 * Homologa em lote todos os judocas selecionados na banca examinadora do evento.
 */
export async function homologarAprovadosEmLote(
	idAcademia: number,
	idUsuarioExecutor: number,
	idEvento: number,
	aprovados: Array<{
		idAluno: number;
		novaFaixa: string;
		idProfessorHomologador: number;
		dataGraduacao?: string;
		associacao?: string;
	}>
): Promise<{ sucesso: boolean; totalHomologados: number }> {
	if (!aprovados || aprovados.length === 0) {
		throw error(400, { message: 'Nenhum judoca selecionado para homologação em lote.' });
	}

	return await executarTransacao(async (conn) => {
		let total = 0;
		for (const item of aprovados) {
			await homologarAprovacaoNoEventoEmTransacao(conn, idAcademia, idUsuarioExecutor, {
				idEvento,
				idAluno: item.idAluno,
				novaFaixa: item.novaFaixa,
				idProfessorHomologador: item.idProfessorHomologador,
				dataGraduacao: item.dataGraduacao || new Date().toISOString().slice(0, 10),
				associacao: item.associacao || 'FPJ / Federação Paulista de Judô'
			});
			total++;
		}

		return {
			sucesso: true,
			totalHomologados: total
		};
	});
}

/**
 * Homologa atomicamente a troca de faixa de um judoca com histórico imutável (modo legado).
 */
export async function homologarTrocaDeFaixa(
	idAcademia: number,
	idUsuarioExecutor: number,
	dados: GraduacaoInput
): Promise<ResultadoGraduacao> {
	// 1. Valida se o aluno pertence à academia ativa
	const aluno = await buscarAlunoPorId(idAcademia, dados.idAluno);
	if (!aluno) {
		throw error(404, { message: 'Judoca não encontrado nesta academia.' });
	}

	// 2. Valida se o professor homologador pertence à academia ativa
	const professores = await listarProfessoresDoDojo(idAcademia);
	const professorValido = professores.some(
		(p) => p.id_usuario === dados.idProfessorHomologador
	);
	if (!professorValido) {
		throw error(400, {
			message: 'O sensei homologador selecionado não pertence a este dojo.'
		});
	}

	// 3. Validação de mudança real de faixa
	const faixaAnterior = aluno.graduacao_atual || 'Branca';
	if (faixaAnterior.trim().toLowerCase() === dados.novaFaixa.trim().toLowerCase()) {
		throw error(400, {
			message: `O judoca já possui a faixa ${dados.novaFaixa}. Selecione uma graduação diferente.`
		});
	}

	// 4. Execução da Transação ACID
	return await executarTransacao(async (conn) => {
		const idEvento = await obterOuCriarEventoGraduacaoEmTransacao(
			conn,
			idAcademia,
			dados.nomeEvento || 'Cerimônia Oficial de Troca de Faixas',
			dados.dataGraduacao
		);

		await atualizarFaixaAlunoEmTransacao(conn, dados.idAluno, dados.novaFaixa);

		const idHistorico = await inserirHistoricoGraduacaoEmTransacao(conn, {
			idEventoGraduacao: idEvento,
			idAluno: dados.idAluno,
			idProfessorHomologador: dados.idProfessorHomologador,
			dataGraduacao: dados.dataGraduacao,
			associacao: dados.associacao || 'FPJ / Federação Paulista de Judô',
			faixa: dados.novaFaixa
		});

		await registrarLogAuditoriaEmTransacao(conn, {
			idAcademia,
			idUsuario: idUsuarioExecutor,
			acao: 'HOMOLOGAR_GRADUACAO',
			entidade: 'Aluno',
			idEntidade: String(dados.idAluno),
			dadosAntes: {
				faixa_anterior: faixaAnterior
			},
			dadosDepois: {
				nova_faixa: dados.novaFaixa,
				id_professor_homologador: dados.idProfessorHomologador,
				data_graduacao: dados.dataGraduacao,
				id_historico: idHistorico
			}
		});

		return {
			sucesso: true,
			idHistorico,
			faixaAnterior,
			novaFaixa: dados.novaFaixa,
			mensagem: `Graduação de ${aluno.nome} homologada com sucesso para a faixa ${dados.novaFaixa}!`
		};
	});
}
