import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDbPool } from '../db/pool';
import type { CampeonatoInput, ResultadoInput } from '../validacao/campeonato.schema';

export interface CampeonatoResumo {
	id_evento: number;
	nome: string;
	edicao: string | null;
	data_inicio: string;
	tipo_campeonato: string | null;
	limite_graduacao: string | null;
	cidade: string;
	uf: string;
	total_inscritos: number;
	total_confirmados: number;
	total_medalhas: number;
}

export interface CampeonatoDetalhado {
	id_evento: number;
	nome: string;
	edicao: string | null;
	data_inicio: string;
	tipo_campeonato: string | null;
	limite_graduacao: string | null;
	logradouro: string;
	cidade: string;
	uf: string;
	cep: string;
}

export interface InscricaoItem {
	id_inscricao: number;
	tipo_participante: 'aluno' | 'professor';
	id_participante: number;
	nome_participante: string;
	faixa_participante: string;
	status_inscricao: 'Pendente' | 'Confirmada' | 'Cancelada';
	valor: number | null;
}

export interface ClassificacaoItem {
	id_classificacao: number;
	id_aluno: number;
	nome_aluno: string;
	faixa_aluno: string;
	classificacao_aluno: string;
	qtd_lutas: number;
	qtd_vitorias: number;
}

/**
 * Lista todos os campeonatos vinculados a esta academia.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarCampeonatosDoDojo(
	idAcademia: number
): Promise<CampeonatoResumo[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			e.id_evento,
			e.nome,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_inicio,
			c.tipo_campeonato,
			c.limite_graduacao,
			COALESCE(ee.cidade, 'São Paulo') AS cidade,
			COALESCE(ee.uf, 'SP') AS uf,
			(
				SELECT COUNT(*) 
				FROM Inscricao_Evento ie 
				WHERE ie.id_evento = e.id_evento
			) AS total_inscritos,
			(
				SELECT COUNT(*) 
				FROM Inscricao_Evento ie 
				WHERE ie.id_evento = e.id_evento AND ie.status_inscricao = 'Confirmada'
			) AS total_confirmados,
			(
				SELECT COUNT(*) 
				FROM Classificacao cl 
				WHERE cl.id_campeonato = e.id_evento AND (cl.classificacao_aluno LIKE '%Ouro%' OR cl.classificacao_aluno LIKE '%Prata%' OR cl.classificacao_aluno LIKE '%Bronze%' OR cl.classificacao_aluno LIKE '%Campeão%')
			) AS total_medalhas
		FROM Evento e
		INNER JOIN Campeonato c ON e.id_evento = c.id_evento
		LEFT JOIN Endereco_Evento ee ON e.id_evento = ee.id_evento
		WHERE e.id_academia = ?
		ORDER BY e.data_inicio DESC, e.id_evento DESC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia]);

	return linhas.map((linha) => ({
		id_evento: Number(linha.id_evento),
		nome: String(linha.nome),
		edicao: linha.edicao ? String(linha.edicao) : null,
		data_inicio: String(linha.data_inicio),
		tipo_campeonato: linha.tipo_campeonato ? String(linha.tipo_campeonato) : null,
		limite_graduacao: linha.limite_graduacao ? String(linha.limite_graduacao) : null,
		cidade: String(linha.cidade),
		uf: String(linha.uf),
		total_inscritos: Number(linha.total_inscritos || 0),
		total_confirmados: Number(linha.total_confirmados || 0),
		total_medalhas: Number(linha.total_medalhas || 0)
	}));
}

/**
 * Busca detalhes completos de um campeonato pertencente à academia.
 */
export async function buscarCampeonatoPorId(
	idAcademia: number,
	idEvento: number
): Promise<CampeonatoDetalhado | null> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			e.id_evento,
			e.nome,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_inicio,
			c.tipo_campeonato,
			c.limite_graduacao,
			COALESCE(ee.logradouro, 'Local Principal') AS logradouro,
			COALESCE(ee.cidade, 'São Paulo') AS cidade,
			COALESCE(ee.uf, 'SP') AS uf,
			COALESCE(ee.cep, '01000-000') AS cep
		FROM Evento e
		INNER JOIN Campeonato c ON e.id_evento = c.id_evento
		LEFT JOIN Endereco_Evento ee ON e.id_evento = ee.id_evento
		WHERE e.id_evento = ? AND e.id_academia = ?
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idEvento, idAcademia]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	return {
		id_evento: Number(linha.id_evento),
		nome: String(linha.nome),
		edicao: linha.edicao ? String(linha.edicao) : null,
		data_inicio: String(linha.data_inicio),
		tipo_campeonato: linha.tipo_campeonato ? String(linha.tipo_campeonato) : null,
		limite_graduacao: linha.limite_graduacao ? String(linha.limite_graduacao) : null,
		logradouro: String(linha.logradouro),
		cidade: String(linha.cidade),
		uf: String(linha.uf),
		cep: String(linha.cep)
	};
}

/**
 * Cria um novo campeonato no banco em transação atômica (Evento + Endereco_Evento + Campeonato).
 */
export async function inserirCampeonatoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	dados: CampeonatoInput
): Promise<number> {
	// 1. Inserir em Evento
	const [resEvento] = await conn.execute<ResultSetHeader>(
		`INSERT INTO Evento (id_academia, nome, edicao, data_inicio)
		 VALUES (?, ?, ?, ?)`,
		[idAcademia, dados.nome, dados.edicao, dados.dataInicio]
	);
	const idEvento = resEvento.insertId;

	// 2. Inserir endereço do evento
	await conn.execute(
		`INSERT INTO Endereco_Evento (id_evento, logradouro, numero, complemento, cidade, uf, cep)
		 VALUES (?, ?, 'S/N', NULL, ?, ?, ?)`,
		[idEvento, dados.logradouro, dados.cidade, dados.uf, dados.cep]
	);

	// 3. Inserir subtipo Campeonato
	await conn.execute(
		`INSERT INTO Campeonato (id_evento, tipo_campeonato, limite_graduacao)
		 VALUES (?, ?, ?)`,
		[idEvento, dados.tipoCampeonato, dados.limiteGraduacao]
	);

	return idEvento;
}

/**
 * Lista as inscrições mistas (atletas e professores) de um evento.
 */
export async function listarInscricoesDoCampeonato(
	idAcademia: number,
	idEvento: number
): Promise<InscricaoItem[]> {
	const pool = getDbPool();

	// Garante que o evento pertence ao tenant
	const sql = `
		SELECT 
			ie.id_inscricao,
			CASE WHEN ie.id_aluno IS NOT NULL THEN 'aluno' ELSE 'professor' END AS tipo_participante,
			COALESCE(ie.id_aluno, ie.id_professor) AS id_participante,
			u.nome AS nome_participante,
			COALESCE(a.graduacao_atual, p.grau_faixa, 'Faixa Preta') AS faixa_participante,
			ie.status_inscricao,
			ie.valor
		FROM Inscricao_Evento ie
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		LEFT JOIN Aluno a ON ie.id_aluno = a.id_usuario
		LEFT JOIN Professor p ON ie.id_professor = p.id_usuario
		INNER JOIN Usuario u ON u.id_usuario = COALESCE(ie.id_aluno, ie.id_professor)
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		WHERE ie.id_evento = ? AND e.id_academia = ? AND ua.id_academia = ?
		ORDER BY ie.status_inscricao ASC, u.nome ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idEvento, idAcademia, idAcademia]);

	return linhas.map((linha) => ({
		id_inscricao: Number(linha.id_inscricao),
		tipo_participante: linha.tipo_participante as 'aluno' | 'professor',
		id_participante: Number(linha.id_participante),
		nome_participante: String(linha.nome_participante),
		faixa_participante: String(linha.faixa_participante),
		status_inscricao: linha.status_inscricao as 'Pendente' | 'Confirmada' | 'Cancelada',
		valor: linha.valor !== null ? Number(linha.valor) : null
	}));
}

/**
 * Insere ou atualiza uma inscrição com restrição XOR no banco.
 */
export async function registrarInscricaoEmTransacao(
	conn: PoolConnection,
	dados: {
		idEvento: number;
		idAluno?: number | null;
		idProfessor?: number | null;
		statusInscricao: 'Pendente' | 'Confirmada' | 'Cancelada';
		valor: number | null;
	}
): Promise<number> {
	const sql = `
		INSERT INTO Inscricao_Evento (
			id_evento,
			id_aluno,
			id_professor,
			status_inscricao,
			valor,
			data_inicio_inscricao
		) VALUES (?, ?, ?, ?, ?, CURDATE())
		ON DUPLICATE KEY UPDATE 
			status_inscricao = VALUES(status_inscricao),
			valor = VALUES(valor)
	`;

	const [res] = await conn.execute<ResultSetHeader>(sql, [
		dados.idEvento,
		dados.idAluno || null,
		dados.idProfessor || null,
		dados.statusInscricao,
		dados.valor
	]);

	return res.insertId;
}

/**
 * Atualiza o status da inscrição com validação de posse do tenant.
 */
export async function atualizarStatusInscricao(
	idAcademia: number,
	idInscricao: number,
	novoStatus: 'Pendente' | 'Confirmada' | 'Cancelada'
): Promise<void> {
	const pool = getDbPool();

	const sqlValida = `
		SELECT ie.id_inscricao 
		FROM Inscricao_Evento ie
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		WHERE ie.id_inscricao = ? AND e.id_academia = ?
		LIMIT 1
	`;

	const [valido] = await pool.execute<RowDataPacket[]>(sqlValida, [idInscricao, idAcademia]);
	if (valido.length === 0) {
		throw new Error('Inscrição não encontrada ou não pertence a esta academia.');
	}

	await pool.execute(
		'UPDATE Inscricao_Evento SET status_inscricao = ? WHERE id_inscricao = ?',
		[novoStatus, idInscricao]
	);
}

/**
 * Lista a classificação e medalhas obtidas no pós-campeonato.
 */
export async function listarResultadosDoCampeonato(
	idAcademia: number,
	idCampeonato: number
): Promise<ClassificacaoItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			cl.id_classificacao,
			cl.id_aluno,
			u.nome AS nome_aluno,
			COALESCE(a.graduacao_atual, 'Branca') AS faixa_aluno,
			cl.classificacao_aluno,
			cl.qtd_lutas,
			cl.qtd_vitorias
		FROM Classificacao cl
		INNER JOIN Campeonato c ON cl.id_campeonato = c.id_evento
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		INNER JOIN Aluno a ON cl.id_aluno = a.id_usuario
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		WHERE cl.id_campeonato = ? AND e.id_academia = ?
		ORDER BY 
			CASE 
				WHEN cl.classificacao_aluno LIKE '%Ouro%' OR cl.classificacao_aluno LIKE '%1%' THEN 1
				WHEN cl.classificacao_aluno LIKE '%Prata%' OR cl.classificacao_aluno LIKE '%2%' THEN 2
				WHEN cl.classificacao_aluno LIKE '%Bronze%' OR cl.classificacao_aluno LIKE '%3%' THEN 3
				ELSE 4
			END ASC,
			cl.qtd_vitorias DESC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idCampeonato, idAcademia]);

	return linhas.map((linha) => ({
		id_classificacao: Number(linha.id_classificacao),
		id_aluno: Number(linha.id_aluno),
		nome_aluno: String(linha.nome_aluno),
		faixa_aluno: String(linha.faixa_aluno),
		classificacao_aluno: String(linha.classificacao_aluno),
		qtd_lutas: Number(linha.qtd_lutas),
		qtd_vitorias: Number(linha.qtd_vitorias)
	}));
}

/**
 * Registra o desempenho e pódio do atleta em pós-campeonato.
 */
export async function salvarClassificacaoEmTransacao(
	conn: PoolConnection,
	dados: ResultadoInput
): Promise<number> {
	const sql = `
		INSERT INTO Classificacao (
			id_campeonato,
			id_aluno,
			classificacao_aluno,
			qtd_lutas,
			qtd_vitorias
		) VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			classificacao_aluno = VALUES(classificacao_aluno),
			qtd_lutas = VALUES(qtd_lutas),
			qtd_vitorias = VALUES(qtd_vitorias)
	`;

	const [res] = await conn.execute<ResultSetHeader>(sql, [
		dados.idCampeonato,
		dados.idAluno,
		dados.classificacaoAluno,
		dados.qtdLutas,
		dados.qtdVitorias
	]);

	return res.insertId;
}
