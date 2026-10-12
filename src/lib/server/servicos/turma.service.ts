import { error } from '@sveltejs/kit';
import { executarTransacao } from '../db/pool';
import {
	inserirTurmaEmTransacao,
	matricularAlunoEmTurma,
	desmatricularAlunoDeTurma
} from '../repositorios/turma.repo';
import { listarProfessoresDoDojo } from '../repositorios/professor.repo';
import type { TurmaInput } from '../validacao/turma.schema';

export async function cadastrarTurma(
	idAcademia: number,
	dados: TurmaInput
): Promise<{ sucesso: boolean; idTreino: number }> {
	// Validação de professores pertencentes ao dojo
	const professoresDojo = await listarProfessoresDoDojo(idAcademia);
	const idsValidos = new Set(professoresDojo.map((p) => p.id_usuario));

	for (const idProf of dados.professoresIds) {
		if (!idsValidos.has(idProf)) {
			throw error(400, {
				message: 'Um ou mais professores selecionados não pertencem a esta academia.'
			});
		}
	}

	return await executarTransacao(async (conn) => {
		const idTreino = await inserirTurmaEmTransacao(conn, idAcademia, dados);
		return {
			sucesso: true,
			idTreino
		};
	});
}

export async function adicionarAlunoNaTurma(
	idAcademia: number,
	idTreino: number,
	idAluno: number
): Promise<void> {
	try {
		await matricularAlunoEmTurma(idAcademia, idTreino, idAluno);
	} catch (erro: any) {
		throw error(400, { message: erro.message || 'Falha ao matricular aluno na turma' });
	}
}

export async function removerAlunoDaTurma(
	idAcademia: number,
	idTreino: number,
	idAluno: number
): Promise<void> {
	try {
		await desmatricularAlunoDeTurma(idAcademia, idTreino, idAluno);
	} catch (erro: any) {
		throw error(400, { message: erro.message || 'Falha ao remover aluno da turma' });
	}
}
