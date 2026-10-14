import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDbPool } from '../db/pool';
import { calcularIdadeServidor } from './aluno.repo';
import type { TurmaInput } from '../validacao/turma.schema';

export interface ProfessorTurma {
	id_professor: number;
	nome: string;
	grau_faixa: string | null;
}

export interface AlunoMatriculadoTurma {
	id_usuario: number;
	nome: string;
	matricula: string | null;
	graduacao_atual: string;
	idade: number;
}

export interface TurmaResumo {
	id_treino: number;
	descricao: string;
	dia_semana: string;
	horario_inicio: string;
	horario_fim: string;
	professores: ProfessorTurma[];
	total_alunos: number;
}

export interface TurmaDetalhada {
	id_treino: number;
	descricao: string;
	dia_semana: string;
	horario_inicio: string;
	horario_fim: string;
	professores: ProfessorTurma[];
	alunos_matriculados: AlunoMatriculadoTurma[];
}

/**
 * Lista todas as turmas de um dojo com a equipe de professores e total de judocas matriculados.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarTurmasDoDojo(idAcademia: number): Promise<TurmaResumo[]> {
	const pool = getDbPool();

	// 1. Busca as turmas da academia
	const sqlTurmas = `
		SELECT 
			id_treino,
			descricao,
			dia_semana,
			TIME_FORMAT(horario_inicio, '%H:%i') AS horario_inicio,
			TIME_FORMAT(horario_fim, '%H:%i') AS horario_fim
		FROM Treino_Turma
		WHERE id_academia = ?
		ORDER BY horario_inicio ASC, id_treino ASC
	`;

	const [linhasTurmas] = await pool.execute<RowDataPacket[]>(sqlTurmas, [idAcademia]);
	if (linhasTurmas.length === 0) return [];

	const idsTreino = linhasTurmas.map((t) => Number(t.id_treino));

	// 2. Busca professores alocados nessas turmas
	const placeholders = idsTreino.map(() => '?').join(',');
	const sqlProfs = `
		SELECT 
			pt.id_treino,
			pt.id_professor,
			u.nome,
			p.grau_faixa
		FROM Professor_Treino pt
		INNER JOIN Professor p ON pt.id_professor = p.id_usuario
		INNER JOIN Usuario u ON p.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		WHERE pt.id_treino IN (${placeholders}) AND ua.id_academia = ?
		ORDER BY u.nome ASC
	`;
	const [linhasProfs] = await pool.execute<RowDataPacket[]>(sqlProfs, [...idsTreino, idAcademia]);

	// Mapeia professores por id_treino
	const mapaProfs = new Map<number, ProfessorTurma[]>();
	for (const lp of linhasProfs) {
		const idTreino = Number(lp.id_treino);
		if (!mapaProfs.has(idTreino)) mapaProfs.set(idTreino, []);
		mapaProfs.get(idTreino)!.push({
			id_professor: Number(lp.id_professor),
			nome: String(lp.nome),
			grau_faixa: lp.grau_faixa ? String(lp.grau_faixa) : null
		});
	}

	// 3. Contagem de alunos matriculados em cada turma
	const sqlContagem = `
		SELECT 
			at.id_treino,
			COUNT(DISTINCT at.id_aluno) AS total
		FROM Aluno_Treino at
		INNER JOIN Usuario_Academia ua ON at.id_aluno = ua.id_usuario
		WHERE at.id_treino IN (${placeholders}) AND ua.id_academia = ?
		GROUP BY at.id_treino
	`;
	const [linhasContagem] = await pool.execute<RowDataPacket[]>(sqlContagem, [
		...idsTreino,
		idAcademia
	]);

	const mapaContagem = new Map<number, number>();
	for (const lc of linhasContagem) {
		mapaContagem.set(Number(lc.id_treino), Number(lc.total));
	}

	return linhasTurmas.map((lt) => {
		const id = Number(lt.id_treino);
		return {
			id_treino: id,
			descricao: String(lt.descricao),
			dia_semana: String(lt.dia_semana),
			horario_inicio: String(lt.horario_inicio),
			horario_fim: String(lt.horario_fim),
			professores: mapaProfs.get(id) || [],
			total_alunos: mapaContagem.get(id) || 0
		};
	});
}

/**
 * Busca uma turma específica com sua lista de chamada de alunos matriculados.
 */
export async function buscarTurmaPorId(
	idAcademia: number,
	idTreino: number
): Promise<TurmaDetalhada | null> {
	const pool = getDbPool();

	// 1. Dados da turma garantindo a posse do tenant
	const sqlTurma = `
		SELECT 
			id_treino,
			descricao,
			dia_semana,
			TIME_FORMAT(horario_inicio, '%H:%i') AS horario_inicio,
			TIME_FORMAT(horario_fim, '%H:%i') AS horario_fim
		FROM Treino_Turma
		WHERE id_treino = ? AND id_academia = ?
		LIMIT 1
	`;

	const [linhasTurma] = await pool.execute<RowDataPacket[]>(sqlTurma, [idTreino, idAcademia]);
	if (linhasTurma.length === 0) return null;

	const turma = linhasTurma[0];

	// 2. Professores da turma
	const sqlProfs = `
		SELECT 
			pt.id_professor,
			u.nome,
			p.grau_faixa
		FROM Professor_Treino pt
		INNER JOIN Professor p ON pt.id_professor = p.id_usuario
		INNER JOIN Usuario u ON p.id_usuario = u.id_usuario
		WHERE pt.id_treino = ?
		ORDER BY u.nome ASC
	`;
	const [linhasProfs] = await pool.execute<RowDataPacket[]>(sqlProfs, [idTreino]);

	// 3. Alunos matriculados na turma
	const sqlAlunos = `
		SELECT 
			a.id_usuario,
			u.nome,
			a.matricula,
			COALESCE(a.graduacao_atual, 'Branca') AS graduacao_atual,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento
		FROM Aluno_Treino at
		INNER JOIN Aluno a ON at.id_aluno = a.id_usuario
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		WHERE at.id_treino = ? AND ua.id_academia = ?
		ORDER BY u.nome ASC
	`;
	const [linhasAlunos] = await pool.execute<RowDataPacket[]>(sqlAlunos, [idTreino, idAcademia]);

	const alunosMatriculados: AlunoMatriculadoTurma[] = linhasAlunos.map((la) => ({
		id_usuario: Number(la.id_usuario),
		nome: String(la.nome),
		matricula: la.matricula ? String(la.matricula) : null,
		graduacao_atual: String(la.graduacao_atual),
		idade: calcularIdadeServidor(String(la.data_nascimento))
	}));

	return {
		id_treino: Number(turma.id_treino),
		descricao: String(turma.descricao),
		dia_semana: String(turma.dia_semana),
		horario_inicio: String(turma.horario_inicio),
		horario_fim: String(turma.horario_fim),
		professores: linhasProfs.map((lp) => ({
			id_professor: Number(lp.id_professor),
			nome: String(lp.nome),
			grau_faixa: lp.grau_faixa ? String(lp.grau_faixa) : null
		})),
		alunos_matriculados: alunosMatriculados
	};
}

/**
 * Cria uma nova turma e aloca os professores em transação aberta.
 */
export async function inserirTurmaEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	dados: TurmaInput
): Promise<number> {
	const sqlInsert = `
		INSERT INTO Treino_Turma (id_academia, descricao, horario_inicio, horario_fim, dia_semana)
		VALUES (?, ?, ?, ?, ?)
	`;

	const [res] = await conn.execute<ResultSetHeader>(sqlInsert, [
		idAcademia,
		dados.descricao,
		dados.horarioInicio.length === 5 ? `${dados.horarioInicio}:00` : dados.horarioInicio,
		dados.horarioFim.length === 5 ? `${dados.horarioFim}:00` : dados.horarioFim,
		dados.diaSemana
	]);

	const idTreino = res.insertId;

	// Aloca os professores na turma
	for (const idProfessor of dados.professoresIds) {
		await conn.execute(
			'INSERT INTO Professor_Treino (id_professor, id_treino) VALUES (?, ?)',
			[idProfessor, idTreino]
		);
	}

	return idTreino;
}

/**
 * Matricula um aluno na turma garantindo isolamento multi-tenant.
 */
export async function matricularAlunoEmTurma(
	idAcademia: number,
	idTreino: number,
	idAluno: number
): Promise<void> {
	const pool = getDbPool();

	// Verifica se a turma e o aluno pertencem à mesma academia
	const sqlValida = `
		SELECT 1 
		FROM Treino_Turma t
		INNER JOIN Usuario_Academia ua ON ua.id_academia = t.id_academia
		WHERE t.id_treino = ? AND t.id_academia = ? AND ua.id_usuario = ?
		LIMIT 1
	`;
	const [valido] = await pool.execute<RowDataPacket[]>(sqlValida, [
		idTreino,
		idAcademia,
		idAluno
	]);

	if (valido.length === 0) {
		throw new Error('Aluno ou turma não pertencem a esta academia.');
	}

	await pool.execute(
		'INSERT IGNORE INTO Aluno_Treino (id_aluno, id_treino) VALUES (?, ?)',
		[idAluno, idTreino]
	);
}

/**
 * Remove um aluno da turma garantindo que a turma pertença à academia.
 */
export async function desmatricularAlunoDeTurma(
	idAcademia: number,
	idTreino: number,
	idAluno: number
): Promise<void> {
	const pool = getDbPool();

	// Valida tenant da turma
	const [turma] = await pool.execute<RowDataPacket[]>(
		'SELECT id_treino FROM Treino_Turma WHERE id_treino = ? AND id_academia = ? LIMIT 1',
		[idTreino, idAcademia]
	);

	if (turma.length === 0) {
		throw new Error('Turma não encontrada para esta academia.');
	}

	await pool.execute(
		'DELETE FROM Aluno_Treino WHERE id_aluno = ? AND id_treino = ?',
		[idAluno, idTreino]
	);
}

/**
 * Atualiza os dados de uma turma e sincroniza os múltiplos professores alocados.
 * MULTI-TENANT: garante que a turma pertença ao idAcademia.
 */
export async function atualizarTurmaEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idTreino: number,
	dados: TurmaInput
): Promise<void> {
	const sqlUpdate = `
		UPDATE Treino_Turma
		SET descricao = ?,
		    horario_inicio = ?,
		    horario_fim = ?,
		    dia_semana = ?
		WHERE id_treino = ? AND id_academia = ?
	`;

	const [res] = await conn.execute<ResultSetHeader>(sqlUpdate, [
		dados.descricao,
		dados.horarioInicio.length === 5 ? `${dados.horarioInicio}:00` : dados.horarioInicio,
		dados.horarioFim.length === 5 ? `${dados.horarioFim}:00` : dados.horarioFim,
		dados.diaSemana,
		idTreino,
		idAcademia
	]);

	if (res.affectedRows === 0) {
		throw new Error('Turma não encontrada para esta academia.');
	}

	// Sincroniza equipe de professores (remove anteriores e insere novos)
	await conn.execute('DELETE FROM Professor_Treino WHERE id_treino = ?', [idTreino]);

	for (const idProfessor of dados.professoresIds) {
		await conn.execute(
			'INSERT INTO Professor_Treino (id_professor, id_treino) VALUES (?, ?)',
			[idProfessor, idTreino]
		);
	}
}

/**
 * Exclui a turma do dojo (as relações em Professor_Treino e Aluno_Treino caem por CASCADE).
 */
export async function excluirTurma(idAcademia: number, idTreino: number): Promise<void> {
	const pool = getDbPool();
	const [res] = await pool.execute<ResultSetHeader>(
		'DELETE FROM Treino_Turma WHERE id_treino = ? AND id_academia = ?',
		[idTreino, idAcademia]
	);

	if (res.affectedRows === 0) {
		throw new Error('Turma não encontrada para esta academia.');
	}
}

