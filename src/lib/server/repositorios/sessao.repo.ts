import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDbPool } from '../db/pool';

export interface SessaoAtiva {
	id_sessao: number;
	id_usuario: number;
	id_academia: number;
	nome_usuario: string;
	email_usuario: string;
	nome_academia: string;
	expira_em: Date;
}

export interface CriarSessaoDTO {
	idUsuario: number;
	idAcademia: number;
	tokenHash: string;
	expiraEm: Date;
	ip?: string | null;
	userAgent?: string | null;
}

/**
 * Registra uma nova sessão no banco de dados.
 * Persiste apenas o hash do token e garante a vinculação composta (id_usuario, id_academia).
 */
export async function criarSessao(dados: CriarSessaoDTO): Promise<number> {
	const pool = getDbPool();
	const sql = `
		INSERT INTO Sessao (
			id_usuario,
			id_academia,
			token_hash,
			expira_em,
			ip,
			user_agent
		) VALUES (?, ?, ?, ?, ?, ?)
	`;

	const [resultado] = await pool.execute<ResultSetHeader>(sql, [
		dados.idUsuario,
		dados.idAcademia,
		dados.tokenHash,
		dados.expiraEm,
		dados.ip || null,
		dados.userAgent ? dados.userAgent.substring(0, 255) : null
	]);

	return resultado.insertId;
}

/**
 * Busca uma sessão ativa e não expirada pelo hash do token.
 * Retorna os dados essenciais do usuário e do dojo (tenant) ativo.
 */
export async function buscarSessaoValidaPorHash(tokenHash: string): Promise<SessaoAtiva | null> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			s.id_sessao,
			s.id_usuario,
			s.id_academia,
			s.expira_em,
			u.nome AS nome_usuario,
			u.email AS email_usuario,
			a.nome AS nome_academia
		FROM Sessao s
		INNER JOIN Usuario u ON s.id_usuario = u.id_usuario
		INNER JOIN Academia a ON s.id_academia = a.id_academia
		WHERE s.token_hash = ?
		  AND s.revogada_em IS NULL
		  AND s.expira_em > NOW()
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [tokenHash]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	return {
		id_sessao: Number(linha.id_sessao),
		id_usuario: Number(linha.id_usuario),
		id_academia: Number(linha.id_academia),
		nome_usuario: String(linha.nome_usuario),
		email_usuario: String(linha.email_usuario),
		nome_academia: String(linha.nome_academia),
		expira_em: new Date(linha.expira_em)
	};
}

/**
 * Revoga uma sessão ativa (logout).
 */
export async function revogarSessaoPorHash(tokenHash: string): Promise<void> {
	const pool = getDbPool();
	const sql = `
		UPDATE Sessao
		SET revogada_em = NOW()
		WHERE token_hash = ? AND revogada_em IS NULL
	`;

	await pool.execute(sql, [tokenHash]);
}

/**
 * Remove sessões antigas que já expiraram há mais de 7 dias (limpeza periódica).
 */
export async function limparSessoesExpiradas(): Promise<number> {
	const pool = getDbPool();
	const sql = `
		DELETE FROM Sessao
		WHERE expira_em < DATE_SUB(NOW(), INTERVAL 7 DAY)
	`;

	const [resultado] = await pool.execute<ResultSetHeader>(sql);
	return resultado.affectedRows;
}
