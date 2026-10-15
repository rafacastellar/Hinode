import type { RowDataPacket } from 'mysql2';
import { getDbPool } from '../db/pool';

export interface MetricasDojo {
	totalAlunos: number;
	totalTurmas: number;
	totalProfessores: number;
	totalGraduacoes: number;
	proximosEventos: Array<{
		id_evento: number;
		nome: string;
		edicao: string | null;
		data_inicio: string | null;
		faixa_inicio?: string | null;
		faixa_fim?: string | null;
		limite_graduacao?: string | null;
		limite_grupo?: string | null;
		valor_inscricao?: number | null;
		eh_campeonato: boolean;
	}>;
}

/**
 * Consulta métricas consolidadas da academia para alimentar o painel do dojo.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório e filtra
 * rigorosamente todas as consultas com prepared statements.
 */
export async function obterMetricasDoDojo(idAcademia: number): Promise<MetricasDojo> {
	const pool = getDbPool();

	// 1. Total de Alunos no Tenant
	const sqlAlunos = `
		SELECT COUNT(DISTINCT a.id_usuario) AS total
		FROM Aluno a
		INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ?
	`;
	const [linhasAlunos] = await pool.execute<RowDataPacket[]>(sqlAlunos, [idAcademia]);
	const totalAlunos = Number(linhasAlunos[0]?.total || 0);

	// 2. Total de Turmas no Tenant
	const sqlTurmas = `
		SELECT COUNT(*) AS total
		FROM Treino_Turma
		WHERE id_academia = ?
	`;
	const [linhasTurmas] = await pool.execute<RowDataPacket[]>(sqlTurmas, [idAcademia]);
	const totalTurmas = Number(linhasTurmas[0]?.total || 0);

	// 3. Total de Professores no Tenant
	const sqlProfessores = `
		SELECT COUNT(DISTINCT p.id_usuario) AS total
		FROM Professor p
		INNER JOIN Usuario_Academia ua ON p.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ?
	`;
	const [linhasProfessores] = await pool.execute<RowDataPacket[]>(sqlProfessores, [idAcademia]);
	const totalProfessores = Number(linhasProfessores[0]?.total || 0);

	// 4. Total de Graduações registradas no Tenant
	const sqlGraduacoes = `
		SELECT COUNT(*) AS total
		FROM Historico_Graduacao hg
		INNER JOIN Evento e ON hg.id_evento_graduacao = e.id_evento
		WHERE e.id_academia = ?
	`;
	const [linhasGraduacoes] = await pool.execute<RowDataPacket[]>(sqlGraduacoes, [idAcademia]);
	const totalGraduacoes = Number(linhasGraduacoes[0]?.total || 0);

	// 5. Próximos Eventos cadastrados para o Tenant
	const sqlEventos = `
		SELECT 
			e.id_evento,
			e.nome,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_inicio,
			c.faixa_inicio,
			c.faixa_fim,
			c.limite_graduacao,
			c.limite_grupo,
			c.valor_inscricao,
			(c.id_evento IS NOT NULL) AS eh_campeonato
		FROM Evento e
		LEFT JOIN Campeonato c ON e.id_evento = c.id_evento
		WHERE e.id_academia = ?
		ORDER BY e.data_inicio ASC
		LIMIT 4
	`;
	const [linhasEventos] = await pool.execute<RowDataPacket[]>(sqlEventos, [idAcademia]);
	const proximosEventos = linhasEventos.map((linha) => ({
		id_evento: Number(linha.id_evento),
		nome: String(linha.nome),
		edicao: linha.edicao ? String(linha.edicao) : null,
		data_inicio: linha.data_inicio ? String(linha.data_inicio) : null,
		faixa_inicio: linha.faixa_inicio ? String(linha.faixa_inicio) : null,
		faixa_fim: linha.faixa_fim ? String(linha.faixa_fim) : null,
		limite_graduacao: linha.limite_graduacao ? String(linha.limite_graduacao) : null,
		limite_grupo: linha.limite_grupo ? String(linha.limite_grupo) : null,
		valor_inscricao: linha.valor_inscricao !== null && linha.valor_inscricao !== undefined ? Number(linha.valor_inscricao) : null,
		eh_campeonato: Boolean(linha.eh_campeonato)
	}));

	return {
		totalAlunos,
		totalTurmas,
		totalProfessores,
		totalGraduacoes,
		proximosEventos
	};
}
