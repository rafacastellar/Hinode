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
	obterDataUltimaGraduacaoAlunoIso,
	atualizarFaixaAlunoEmTransacao,
	inserirHistoricoGraduacaoEmTransacao,
	registrarLogAuditoriaEmTransacao
} from '../repositorios/graduacao.repo';
import { buscarAlunoPorId } from '../repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '../repositorios/professor.repo';
import { obterFrequenciaAluno } from '../repositorios/presenca.repo';
import {
	validarElegibilidadeGraduacao,
	validarPeriodoInscricaoGraduacao,
	compararHierarquiaFaixas,
	deveAtualizarFaixaAtualDoAluno
} from './regras-graduacao';
import type {
	EventoGraduacaoInput,
	InscricaoGraduacaoInput,
	HomologacaoEventoInput,
	GraduacaoInput,
	LoteHistoricoAlunoInput
} from '../validacao/graduacao.schema';

export interface ResultadoGraduacao {
	sucesso: boolean;
	idHistorico: number;
	faixaAnterior: string;
	novaFaixa: string;
	atualizouFaixaAtual: boolean;
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

	// 4. Validação de elegibilidade pedagógica e presença
	const [frequencia, dataUltimaGradIso] = await Promise.all([
		obterFrequenciaAluno(idAcademia, dados.idAluno),
		obterDataUltimaGraduacaoAlunoIso(dados.idAluno)
	]);

	const checagem = validarElegibilidadeGraduacao({
		faixaAtleta: aluno.graduacao_atual || 'Branca',
		faixaInicioEvento: evento.faixa_inicio,
		faixaFimEvento: evento.faixa_fim,
		dataInicioJudoAtleta: aluno.data_inicio,
		dataUltimaGraduacaoAtleta: dataUltimaGradIso,
		dataPrimeiraGraduacaoAtleta: aluno.data_primeira_graduacao,
		tempoMinimoJudoMeses: evento.tempo_minimo_judo_meses,
		tempoMinimoUltimaGraduacaoMeses: evento.tempo_minimo_ultima_graduacao_meses,
		percentualMinimoPresenca: evento.percentual_minimo_presenca,
		qtdMinimaAulasPresentes: evento.qtd_minima_aulas_presentes,
		percentualPresencaAtleta: frequencia.percentual_presenca,
		aulasPresentesAtleta: frequencia.total_presentes,
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
 * Registra atomicamente uma graduação avulsa, promoção direta no dojo, acervo histórico pré-sistema
 * ou histórico de transferência de outra academia — SEM criar eventos fantasmas no painel de exames.
 * Respeita a hierarquia de faixas para não rebaixar `Aluno.graduacao_atual` em lançamentos retroativos.
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

	const origemRegistro = dados.origemRegistro || 'PROMOCAO_DIRETA';

	// 2. Valida se o professor homologador (quando selecionado do dojo) pertence à academia ativa
	if (dados.idProfessorHomologador) {
		const professores = await listarProfessoresDoDojo(idAcademia);
		const professorValido = professores.some(
			(p) => p.id_usuario === dados.idProfessorHomologador
		);
		if (!professorValido) {
			throw error(400, {
				message: 'O sensei homologador selecionado não pertence a este dojo.'
			});
		}
	} else if (origemRegistro === 'PROMOCAO_DIRETA' || origemRegistro === 'EXAME_DOJO') {
		throw error(400, {
			message: 'Para promoção direta no dojo, selecione o Sensei homologador responsável.'
		});
	}

	// 3. Verifica se é mudança de faixa atual ou lançamento de histórico retroativo
	const faixaAnterior = aluno.graduacao_atual || 'Branca';
	const ehRegistroHistorico =
		origemRegistro === 'HISTORICO_ANTERIOR' || origemRegistro === 'TRANSFERENCIA';

	if (
		!ehRegistroHistorico &&
		faixaAnterior.trim().toLowerCase() === dados.novaFaixa.trim().toLowerCase()
	) {
		throw error(400, {
			message: `O judoca já possui a faixa ${dados.novaFaixa}. Selecione uma graduação diferente ou escolha o modo "Acervo Histórico / Transferência" para registrar a data de conquista desta faixa.`
		});
	}

	const deveAtualizarAtual = deveAtualizarFaixaAtualDoAluno({
		faixaAtualAluno: faixaAnterior,
		novaFaixaLancada: dados.novaFaixa,
		origemRegistro,
		atualizarFaixaAtual: dados.atualizarFaixaAtual
	});

	// 4. Execução da Transação ACID sem criar Evento fantasma
	return await executarTransacao(async (conn) => {
		if (deveAtualizarAtual) {
			await atualizarFaixaAlunoEmTransacao(conn, dados.idAluno, dados.novaFaixa);
		}

		const descricaoOrigemPadrao =
			dados.nomeEvento ||
			(origemRegistro === 'HISTORICO_ANTERIOR'
				? 'Acervo Histórico (Pré-Sistema)'
				: origemRegistro === 'TRANSFERENCIA'
					? 'Transferência de Academia Anterior'
					: 'Promoção Direta no Dojo');

		const idHistorico = await inserirHistoricoGraduacaoEmTransacao(conn, {
			idEventoGraduacao: null,
			idAluno: dados.idAluno,
			idProfessorHomologador: dados.idProfessorHomologador ?? null,
			dataGraduacao: dados.dataGraduacao,
			associacao: dados.associacao || 'FPJ / Federação Paulista de Judô',
			faixa: dados.novaFaixa,
			origemRegistro,
			descricaoOrigem: descricaoOrigemPadrao,
			nomeExaminadorExterno: dados.nomeExaminadorExterno ?? null,
			idAcademiaFallback: idAcademia
		});

		await registrarLogAuditoriaEmTransacao(conn, {
			idAcademia,
			idUsuario: idUsuarioExecutor,
			acao: ehRegistroHistorico ? 'REGISTRAR_HISTORICO_GRADUACAO' : 'HOMOLOGAR_GRADUACAO',
			entidade: 'Aluno',
			idEntidade: String(dados.idAluno),
			dadosAntes: {
				faixa_anterior: faixaAnterior
			},
			dadosDepois: {
				faixa_registrada: dados.novaFaixa,
				origem_registro: origemRegistro,
				descricao_origem: descricaoOrigemPadrao,
				id_professor_homologador: dados.idProfessorHomologador ?? null,
				nome_examinador_externo: dados.nomeExaminadorExterno ?? null,
				data_graduacao: dados.dataGraduacao,
				atualizou_graduacao_atual: deveAtualizarAtual,
				id_historico: idHistorico
			}
		});

		const mensagem = deveAtualizarAtual
			? `Graduação de ${aluno.nome} homologada com sucesso para a faixa ${dados.novaFaixa}!`
			: `Faixa ${dados.novaFaixa} (${dados.dataGraduacao}) adicionada à linha do tempo de ${aluno.nome} (graduação atual mantida em ${faixaAnterior}).`;

		return {
			sucesso: true,
			idHistorico,
			faixaAnterior,
			novaFaixa: deveAtualizarAtual ? dados.novaFaixa : faixaAnterior,
			atualizouFaixaAtual: deveAtualizarAtual,
			mensagem
		};
	});
}

/**
 * Registra em lote a linha do tempo de faixas anteriores de um judoca
 * (importação pré-sistema ou histórico trazido de outra academia) com datas controladas,
 * sem criar eventos fantasmas e atualizando a faixa atual apenas se alguma etapa superar a atual.
 */
export async function registrarLoteHistoricoAluno(
	idAcademia: number,
	idUsuarioExecutor: number,
	dados: LoteHistoricoAlunoInput
): Promise<{
	sucesso: boolean;
	totalInseridos: number;
	faixaAtualFinal: string;
	mensagem: string;
}> {
	const aluno = await buscarAlunoPorId(idAcademia, dados.idAluno);
	if (!aluno) {
		throw error(404, { message: 'Judoca não encontrado nesta academia.' });
	}

	if (dados.idProfessorHomologador) {
		const professores = await listarProfessoresDoDojo(idAcademia);
		const professorValido = professores.some(
			(p) => p.id_usuario === dados.idProfessorHomologador
		);
		if (!professorValido) {
			throw error(400, {
				message: 'O sensei selecionado não pertence a este dojo.'
			});
		}
	} else if (!dados.nomeExaminadorExterno) {
		throw error(400, {
			message:
				'Selecione um Sensei do dojo ou informe o Sensei / Academia / Banca examinadora de origem.'
		});
	}

	// Ordena as etapas cronologicamente pela data de graduação
	const etapasOrdenadas = [...dados.etapas].sort((a, b) =>
		a.dataGraduacao.localeCompare(b.dataGraduacao)
	);

	return await executarTransacao(async (conn) => {
		let faixaMaisAlta = aluno.graduacao_atual || 'Branca';
		const idsGerados: number[] = [];

		for (const etapa of etapasOrdenadas) {
			const descricaoOrigem =
				etapa.descricaoOrigem ||
				dados.descricaoOrigemPadrao ||
				(dados.origemRegistro === 'TRANSFERENCIA'
					? 'Transferência (Outra Academia)'
					: 'Acervo Histórico (Pré-Sistema)');

			const idHist = await inserirHistoricoGraduacaoEmTransacao(conn, {
				idEventoGraduacao: null,
				idAluno: dados.idAluno,
				idProfessorHomologador: dados.idProfessorHomologador ?? null,
				dataGraduacao: etapa.dataGraduacao,
				associacao: etapa.associacao || dados.associacaoPadrao || 'FPJ / CBJ',
				faixa: etapa.faixa,
				origemRegistro: dados.origemRegistro,
				descricaoOrigem,
				nomeExaminadorExterno:
					etapa.nomeExaminadorExterno || dados.nomeExaminadorExterno || null,
				idAcademiaFallback: idAcademia
			});

			idsGerados.push(idHist);

			if (compararHierarquiaFaixas(etapa.faixa, faixaMaisAlta) > 0) {
				faixaMaisAlta = etapa.faixa;
			}
		}

		const faixaAnterior = aluno.graduacao_atual || 'Branca';
		const atualizouAtual = compararHierarquiaFaixas(faixaMaisAlta, faixaAnterior) > 0;
		if (atualizouAtual) {
			await atualizarFaixaAlunoEmTransacao(conn, dados.idAluno, faixaMaisAlta);
		}

		await registrarLogAuditoriaEmTransacao(conn, {
			idAcademia,
			idUsuario: idUsuarioExecutor,
			acao: 'IMPORTAR_HISTORICO_GRADUACAO_LOTE',
			entidade: 'Aluno',
			idEntidade: String(dados.idAluno),
			dadosAntes: {
				faixa_anterior: faixaAnterior
			},
			dadosDepois: {
				origem_registro: dados.origemRegistro,
				total_etapas: etapasOrdenadas.length,
				ids_historico: idsGerados,
				faixa_atual_final: faixaMaisAlta,
				atualizou_graduacao_atual: atualizouAtual
			}
		});

		return {
			sucesso: true,
			totalInseridos: etapasOrdenadas.length,
			faixaAtualFinal: faixaMaisAlta,
			mensagem: `${etapasOrdenadas.length} ${etapasOrdenadas.length === 1 ? 'graduação histórica registrada' : 'graduações históricas registradas'} com sucesso no prontuário de ${aluno.nome}!`
		};
	});
}
