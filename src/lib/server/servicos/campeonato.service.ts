import { error } from '@sveltejs/kit';
import { executarTransacao } from '../db/pool';
import {
	buscarCampeonatoPorId,
	inserirCampeonatoEmTransacao,
	registrarInscricaoEmTransacao,
	atualizarStatusInscricao,
	salvarClassificacaoEmTransacao
} from '../repositorios/campeonato.repo';
import { buscarAlunoPorId } from '../repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '../repositorios/professor.repo';
import type {
	CampeonatoInput,
	InscricaoInput,
	ResultadoInput
} from '../validacao/campeonato.schema';

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

export async function inscreverCompetidor(
	idAcademia: number,
	dados: InscricaoInput
): Promise<{ sucesso: boolean; idInscricao: number }> {
	// 1. Valida se o campeonato pertence à academia ativa
	const campeonato = await buscarCampeonatoPorId(idAcademia, dados.idEvento);
	if (!campeonato) {
		throw error(404, { message: 'Campeonato não encontrado para este dojo.' });
	}

	// 2. Valida participante misto conforme o tipo
	let idAluno: number | null = null;
	let idProfessor: number | null = null;

	if (dados.tipoParticipante === 'aluno') {
		const aluno = await buscarAlunoPorId(idAcademia, dados.idParticipante);
		if (!aluno) {
			throw error(404, { message: 'Judoca não encontrado neste dojo.' });
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

	// 3. Gravação atômica da inscrição
	return await executarTransacao(async (conn) => {
		const idInscricao = await registrarInscricaoEmTransacao(conn, {
			idEvento: dados.idEvento,
			idAluno,
			idProfessor,
			statusInscricao: dados.statusInscricao,
			valor: dados.valor
		});

		return {
			sucesso: true,
			idInscricao
		};
	});
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
	// Validações de posse
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
