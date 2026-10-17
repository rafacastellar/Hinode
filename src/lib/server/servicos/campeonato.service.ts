import { error } from '@sveltejs/kit';
import { executarTransacao } from '../db/pool';
import {
	buscarCampeonatoPorId,
	listarInscricoesDoCampeonato,
	inserirCampeonatoEmTransacao,
	atualizarCampeonatoEmTransacao,
	excluirCampeonato,
	registrarInscricaoEmTransacao,
	confirmarInscricaoAtleta,
	confirmarInscricaoResponsavel,
	removerInscricaoDoCampeonato,
	atualizarStatusInscricao,
	salvarClassificacaoEmTransacao
} from '../repositorios/campeonato.repo';
import { buscarAlunoPorId } from '../repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '../repositorios/professor.repo';
import {
	validarElegibilidadeCompleta,
	determinarStatusInscricao,
	validarPeriodoInscricao
} from './regras-campeonato';
import type {
	CampeonatoInput,
	InscricaoInput,
	ResultadoInput
} from '../validacao/campeonato.schema';

/**
 * Criação de campeonato com faixa inicial/final, idade mínima/máxima e valor padrão.
 */
export async function cadastrarCampeonato(
	idAcademia: number,
	dados: CampeonatoInput
): Promise<{ sucesso: boolean; idEvento: number }> {
	return await executarTransacao(async (conn) => {
		const idEvento = await inserirCampeonatoEmTransacao(conn, idAcademia, dados);
		return {
			sucesso: true,
			idEvento
		};
	});
}

/**
 * Edição completa dos dados e restrições de um campeonato pelo professor.
 */
export async function editarCampeonato(
	idAcademia: number,
	idEvento: number,
	dados: CampeonatoInput
): Promise<{ sucesso: boolean }> {
	return await executarTransacao(async (conn) => {
		await atualizarCampeonatoEmTransacao(conn, idAcademia, idEvento, dados);
		return { sucesso: true };
	});
}

/**
 * Exclusão definitiva de um campeonato do dojo com cascata segura.
 */
export async function excluirCampeonatoDoDojo(
	idAcademia: number,
	idEvento: number
): Promise<{ sucesso: boolean }> {
	await excluirCampeonato(idAcademia, idEvento);
	return { sucesso: true };
}

/**
 * Abordagem A: Inscrição / Convite ativo realizado pelo Professor.
 * Valida faixa inicial/final, idade mínima/máxima e categoria.
 */
export async function inscreverCompetidor(
	idAcademia: number,
	dados: InscricaoInput
): Promise<{ sucesso: boolean; idInscricao: number }> {
	// 1. Valida se o campeonato pertence à academia ativa
	const campeonato = await buscarCampeonatoPorId(idAcademia, dados.idEvento);
	if (!campeonato) {
		throw error(404, { message: 'Campeonato não encontrado para este dojo.' });
	}

	// 1.1. Validação estrita do período de inscrições do campeonato
	const validacaoPeriodo = validarPeriodoInscricao(
		campeonato.data_inicio_inscricao_iso,
		campeonato.data_fim_inscricao_iso
	);
	if (!validacaoPeriodo.aberta) {
		throw error(400, { message: validacaoPeriodo.motivo || 'Período de inscrições encerrado para este campeonato.' });
	}

	// 2. Valida participante e regras de negócio
	let idAluno: number | null = null;
	let idProfessor: number | null = null;

	if (dados.tipoParticipante === 'aluno') {
		const aluno = await buscarAlunoPorId(idAcademia, dados.idParticipante);
		if (!aluno) {
			throw error(404, { message: 'Judoca não encontrado neste dojo.' });
		}

		// Validação estrita de limites de graduação, idade e categoria
		const elegibilidade = validarElegibilidadeCompleta({
			faixaInicio: campeonato.faixa_inicio,
			faixaFim: campeonato.faixa_fim,
			limiteGrupo: campeonato.limite_grupo,
			idadeMinima: campeonato.idade_minima,
			idadeMaxima: campeonato.idade_maxima,
			faixaAtleta: aluno.graduacao_atual,
			grupoAtleta: aluno.grupo_especial_aspirante,
			idadeAtleta: aluno.idade
		});

		if (!elegibilidade.elegivel) {
			throw error(400, {
				message: elegibilidade.motivo || 'O judoca não cumpre os requisitos deste campeonato.'
			});
		}

		idAluno = dados.idParticipante;
	} else if (dados.tipoParticipante === 'professor') {
		const professores = await listarProfessoresDoDojo(idAcademia);
		const profValido = professores.some((p) => p.id_usuario === dados.idParticipante);
		if (!profValido) {
			throw error(404, { message: 'Professor/Sensei não encontrado neste dojo.' });
		}
		idProfessor = dados.idParticipante;
	} else {
		throw error(400, { message: 'Tipo de participante inválido.' });
	}

	// Usa o valor padrão do torneio caso não seja explicitamente sobrescrito
	const valorCobrado = dados.valor !== null ? dados.valor : campeonato.valor_inscricao;

	// Inscrição pelo professor inicia como 'Pendente' aguardando confirmações
	return await executarTransacao(async (conn) => {
		const idInscricao = await registrarInscricaoEmTransacao(conn, {
			idEvento: dados.idEvento,
			idAluno,
			idProfessor,
			statusInscricao: 'Pendente',
			confirmadoAtleta: false,
			confirmadoResponsavel: false,
			valor: valorCobrado
		});

		return {
			sucesso: true,
			idInscricao
		};
	});
}

/**
 * Abordagem B: Auto-inscrição realizada pelo próprio Judoca ou por seu Responsável Legal.
 */
export async function autoInscreverCompetidor(
	idAcademia: number,
	idEvento: number,
	idAluno: number,
	idUsuarioLogado: number,
	ehResponsavel: boolean
): Promise<{ sucesso: boolean; novoStatus: 'Pendente' | 'Confirmada' }> {
	const campeonato = await buscarCampeonatoPorId(idAcademia, idEvento);
	if (!campeonato) {
		throw error(404, { message: 'Campeonato não encontrado.' });
	}

	// 1.1. Validação estrita do período de inscrições do campeonato
	const validacaoPeriodo = validarPeriodoInscricao(
		campeonato.data_inicio_inscricao_iso,
		campeonato.data_fim_inscricao_iso
	);
	if (!validacaoPeriodo.aberta) {
		throw error(400, { message: validacaoPeriodo.motivo || 'Período de inscrições encerrado para este campeonato.' });
	}

	const aluno = await buscarAlunoPorId(idAcademia, idAluno);
	if (!aluno) {
		throw error(404, { message: 'Judoca não encontrado.' });
	}

	const inscricoesAtuais = await listarInscricoesDoCampeonato(idAcademia, idEvento);
	const jaInscrito = inscricoesAtuais.some(
		(i) => i.tipo_participante === 'aluno' && i.id_participante === idAluno
	);
	if (jaInscrito) {
		throw error(409, { message: 'Este atleta já está inscrito neste campeonato.' });
	}

	// Validação estrita
	const elegibilidade = validarElegibilidadeCompleta({
		faixaInicio: campeonato.faixa_inicio,
		faixaFim: campeonato.faixa_fim,
		limiteGrupo: campeonato.limite_grupo,
		idadeMinima: campeonato.idade_minima,
		idadeMaxima: campeonato.idade_maxima,
		faixaAtleta: aluno.graduacao_atual,
		grupoAtleta: aluno.grupo_especial_aspirante,
		idadeAtleta: aluno.idade
	});

	if (!elegibilidade.elegivel) {
		throw error(400, {
			message: elegibilidade.motivo || 'Você não cumpre os requisitos para este torneio.'
		});
	}

	const menorIdade = aluno.menor_idade;
	let confirmadoAtleta = false;
	let confirmadoResponsavel = false;

	if (ehResponsavel) {
		// Responsável está inscrevendo o menor: autorização do responsável já é concedida
		confirmadoResponsavel = true;
		confirmadoAtleta = !menorIdade;
	} else {
		// O próprio atleta está se inscrevendo: confirmação do atleta concedida
		confirmadoAtleta = true;
		confirmadoResponsavel = !menorIdade; // Se for maior, não precisa do responsável
	}

	const statusFinal = determinarStatusInscricao(confirmadoAtleta, menorIdade, confirmadoResponsavel);

	await executarTransacao(async (conn) => {
		await registrarInscricaoEmTransacao(conn, {
			idEvento,
			idAluno,
			idProfessor: null,
			statusInscricao: statusFinal,
			confirmadoAtleta,
			confirmadoResponsavel,
			valor: campeonato.valor_inscricao
		});
	});

	return {
		sucesso: true,
		novoStatus: statusFinal
	};
}

/**
 * Confirma a inscrição pelo Atleta.
 */
export async function confirmarParticipacaoPeloAtleta(
	idAcademia: number,
	idInscricao: number
): Promise<{ sucesso: boolean; novoStatus: 'Pendente' | 'Confirmada'; menorIdade: boolean }> {
	const res = await confirmarInscricaoAtleta(idAcademia, idInscricao);
	return {
		sucesso: true,
		novoStatus: res.novoStatus,
		menorIdade: res.menorIdade
	};
}

/**
 * Confirma a inscrição pelo Responsável Legal do atleta menor de idade.
 */
export async function confirmarParticipacaoPeloResponsavel(
	idAcademia: number,
	idInscricao: number
): Promise<{ sucesso: boolean; novoStatus: 'Pendente' | 'Confirmada' }> {
	const res = await confirmarInscricaoResponsavel(idAcademia, idInscricao);
	return {
		sucesso: true,
		novoStatus: res.novoStatus
	};
}

/**
 * Remove um atleta da lista de participantes ou inscrições do campeonato.
 */
export async function removerAtletaDoCampeonato(
	idAcademia: number,
	idInscricao: number
): Promise<{ sucesso: boolean }> {
	try {
		await removerInscricaoDoCampeonato(idAcademia, idInscricao);
		return { sucesso: true };
	} catch (erro: any) {
		throw error(400, { message: erro.message || 'Falha ao remover competidor do campeonato.' });
	}
}

export async function mudarStatusInscricao(
	idAcademia: number,
	idInscricao: number,
	novoStatus: 'Pendente' | 'Confirmada' | 'Cancelada'
): Promise<void> {
	if (!['Pendente', 'Confirmada', 'Cancelada'].includes(novoStatus)) {
		throw error(400, { message: 'Status de inscrição inválido.' });
	}

	try {
		await atualizarStatusInscricao(idAcademia, idInscricao, novoStatus);
	} catch (erro: any) {
		throw error(400, { message: erro.message || 'Falha ao atualizar status da inscrição.' });
	}
}

export async function registrarResultadoCampeonato(
	idAcademia: number,
	dados: ResultadoInput
): Promise<{ sucesso: boolean }> {
	const campeonato = await buscarCampeonatoPorId(idAcademia, dados.idCampeonato);
	if (!campeonato) {
		throw error(404, { message: 'Campeonato não encontrado nesta academia.' });
	}

	const aluno = await buscarAlunoPorId(idAcademia, dados.idAluno);
	if (!aluno) {
		throw error(404, { message: 'Judoca não encontrado nesta academia.' });
	}

	if (dados.qtdVitorias > dados.qtdLutas) {
		throw error(400, {
			message: 'A quantidade de vitórias não pode ser maior que o número de lutas.'
		});
	}

	return await executarTransacao(async (conn) => {
		await salvarClassificacaoEmTransacao(conn, dados);
		return { sucesso: true };
	});
}
