import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDbPool } from '../db/pool';

export interface GraduacaoFeedItem {
	id_historico: number;
	id_aluno: number;
	nome_aluno: string;
	matricula_aluno: string | null;
	faixa: string;
	data_graduacao: string;
	associacao: string | null;
	nome_professor_homologador: string;
	grau_faixa_professor: string | null;
	nome_evento: string;
}

export interface DistribuicaoFaixaItem {
	faixa: string;
	total: number;
}

export interface HistoricoAlunoItem {
	id_historico: number;
	faixa: string;
	data_graduacao: string;
	associacao: string | null;
	nome_professor_homologador: string;
	grau_faixa_professor: string | null;
	nome_evento: string;
}

/**
 * Lista as últimas homologações de troca de faixa realizadas na academia.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarGraduacoesDoDojo(
	idAcademia: number,
	limite = 20
): Promise<GraduacaoFeedItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			hg.id_historico,
			hg.id_aluno,
			u_aluno.nome AS nome_aluno,
			a.matricula AS matricula_aluno,
			hg.faixa,
			DATE_FORMAT(hg.data_graduacao, '%d/%m/%Y') AS data_graduacao,
			hg.associacao,
			u_prof.nome AS nome_professor_homologador,
			p.grau_faixa AS grau_faixa_professor,
			e.nome AS nome_evento
		FROM Historico_Graduacao hg
		INNER JOIN Aluno a ON hg.id_aluno = a.id_usuario
		INNER JOIN Usuario u_aluno ON a.id_usuario = u_aluno.id_usuario
		INNER JOIN Usuario_Academia ua ON u_aluno.id_usuario = ua.id_usuario
		INNER JOIN Professor p ON hg.id_professor_homologador = p.id_usuario
		INNER JOIN Usuario u_prof ON p.id_usuario = u_prof.id_usuario
		INNER JOIN Graduacao_Evento ge ON hg.id_evento_graduacao = ge.id_evento
		INNER JOIN Evento e ON ge.id_evento = e.id_evento
		WHERE ua.id_academia = ? AND e.id_academia = ?
		ORDER BY hg.data_graduacao DESC, hg.id_historico DESC
		LIMIT ?
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia, idAcademia, limite]);

	return linhas.map((linha) => ({
		id_historico: Number(linha.id_historico),
		id_aluno: Number(linha.id_aluno),
		nome_aluno: String(linha.nome_aluno),
		matricula_aluno: linha.matricula_aluno ? String(linha.matricula_aluno) : null,
		faixa: String(linha.faixa),
		data_graduacao: String(linha.data_graduacao),
		associacao: linha.associacao ? String(linha.associacao) : null,
		nome_professor_homologador: String(linha.nome_professor_homologador),
		grau_faixa_professor: linha.grau_faixa_professor ? String(linha.grau_faixa_professor) : null,
		nome_evento: String(linha.nome_evento)
	}));
}

/**
 * Consulta a distribuição quantitativa de judocas por faixa no dojo.
 */
export async function obterDistribuicaoFaixasDoDojo(
	idAcademia: number
): Promise<DistribuicaoFaixaItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			COALESCE(NULLIF(a.graduacao_atual, ''), 'Branca') AS faixa,
			COUNT(DISTINCT a.id_usuario) AS total
		FROM Aluno a
		INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ?
		GROUP BY COALESCE(NULLIF(a.graduacao_atual, ''), 'Branca')
		ORDER BY total DESC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia]);

	return linhas.map((linha) => ({
		faixa: String(linha.faixa),
		total: Number(linha.total)
	}));
}

/**
 * Busca a trilha cronológica imutável completa de graduações de um aluno específico.
 */
export async function buscarHistoricoDoAluno(
	idAcademia: number,
	idAluno: number
): Promise<HistoricoAlunoItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			hg.id_historico,
			hg.faixa,
			DATE_FORMAT(hg.data_graduacao, '%d/%m/%Y') AS data_graduacao,
			hg.associacao,
			u_prof.nome AS nome_professor_homologador,
			p.grau_faixa AS grau_faixa_professor,
			e.nome AS nome_evento
		FROM Historico_Graduacao hg
		INNER JOIN Usuario_Academia ua ON hg.id_aluno = ua.id_usuario
		INNER JOIN Professor p ON hg.id_professor_homologador = p.id_usuario
		INNER JOIN Usuario u_prof ON p.id_usuario = u_prof.id_usuario
		INNER JOIN Graduacao_Evento ge ON hg.id_evento_graduacao = ge.id_evento
		INNER JOIN Evento e ON ge.id_evento = e.id_evento
		WHERE hg.id_aluno = ? AND ua.id_academia = ?
		ORDER BY hg.data_graduacao ASC, hg.id_historico ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAluno, idAcademia]);

	return linhas.map((linha) => ({
		id_historico: Number(linha.id_historico),
		faixa: String(linha.faixa),
		data_graduacao: String(linha.data_graduacao),
		associacao: linha.associacao ? String(linha.associacao) : null,
		nome_professor_homologador: String(linha.nome_professor_homologador),
		grau_faixa_professor: linha.grau_faixa_professor ? String(linha.grau_faixa_professor) : null,
		nome_evento: String(linha.nome_evento)
	}));
}

/**
 * Obtém ou cria o evento de graduação para a cerimônia informada dentro de uma transação.
 */
export async function obterOuCriarEventoGraduacaoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	nomeEvento: string,
	dataEvento: string
): Promise<number> {
	// Verifica se já existe um evento com este nome na mesma data para o dojo
	const sqlBusca = `
		SELECT e.id_evento 
		FROM Evento e
		INNER JOIN Graduacao_Evento ge ON e.id_evento = ge.id_evento
		WHERE e.id_academia = ? AND e.nome = ? AND e.data_inicio = ?
		LIMIT 1
	`;
	const [existente] = await conn.execute<RowDataPacket[]>(sqlBusca, [
		idAcademia,
		nomeEvento,
		dataEvento
	]);

	if (existente.length > 0) {
		return Number(existente[0].id_evento);
	}

	// 1. Cria em Evento
	const [resEvento] = await conn.execute<ResultSetHeader>(
		`INSERT INTO Evento (id_academia, nome, edicao, data_inicio)
		 VALUES (?, ?, 'Oficial', ?)`,
		[idAcademia, nomeEvento, dataEvento]
	);
	const idEvento = resEvento.insertId;

	// 2. Cria subtipo em Graduacao_Evento
	await conn.execute(
		`INSERT INTO Graduacao_Evento (id_evento, tipo_graduacao, status, requisitos)
		 VALUES (?, 'Troca de Faixa', 'Concluído', 'Avaliação técnica e pedagógica no dojo')`,
		[idEvento]
	);

	return idEvento;
}

/**
 * Atualiza atomicamente a faixa atual do aluno em Aluno.
 */
export async function atualizarFaixaAlunoEmTransacao(
	conn: PoolConnection,
	idAluno: number,
	novaFaixa: string
): Promise<void> {
	await conn.execute(
		'UPDATE Aluno SET graduacao_atual = ? WHERE id_usuario = ?',
		[novaFaixa, idAluno]
	);
}

/**
 * Insere um novo registro no histórico imutável (Insert-Only).
 */
export async function inserirHistoricoGraduacaoEmTransacao(
	conn: PoolConnection,
	dados: {
		idEventoGraduacao: number;
		idAluno: number;
		idProfessorHomologador: number;
		dataGraduacao: string;
		associacao: string;
		faixa: string;
	}
): Promise<number> {
	const sql = `
		INSERT INTO Historico_Graduacao (
			id_evento_graduacao,
			id_aluno,
			id_professor_homologador,
			data_graduacao,
			associacao,
			faixa
		) VALUES (?, ?, ?, ?, ?, ?)
	`;

	const [res] = await conn.execute<ResultSetHeader>(sql, [
		dados.idEventoGraduacao,
		dados.idAluno,
		dados.idProfessorHomologador,
		dados.dataGraduacao,
		dados.associacao,
		dados.faixa
	]);

	return res.insertId;
}

/**
 * Registra a ação sensível de homologação na tabela de auditoria LGPD.
 */
export async function registrarLogAuditoriaEmTransacao(
	conn: PoolConnection,
	dados: {
		idAcademia: number;
		idUsuario: number;
		acao: string;
		entidade: string;
		idEntidade: string;
		dadosAntes: Record<string, any>;
		dadosDepois: Record<string, any>;
	}
): Promise<void> {
	const sql = `
		INSERT INTO Log_Auditoria (
			id_academia,
			id_usuario,
			acao,
			entidade,
			id_entidade,
			dados_antes,
			dados_depois
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`;

	await conn.execute(sql, [
		dados.idAcademia,
		dados.idUsuario,
		dados.acao,
		dados.entidade,
		dados.idEntidade,
		JSON.stringify(dados.dadosAntes),
		JSON.stringify(dados.dadosDepois)
	]);
}
