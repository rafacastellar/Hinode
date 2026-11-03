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

export interface SessaoSaasAtiva {
	id_sessao_saas: number;
	id_usuario: number;
	nome_usuario: string;
	email_usuario: string;
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

export interface CriarSessaoSaasDTO {
	idUsuario: number;
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
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = s.id_usuario AND ua.id_academia = s.id_academia
		WHERE s.token_hash = ?
		  AND s.revogada_em IS NULL
		  AND s.expira_em > NOW()
		  AND COALESCE(u.ativo, 1) = 1
		  AND COALESCE(a.ativa, 1) = 1
		  AND COALESCE(ua.ativo, 1) = 1
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
 * Estende o tempo de expiração da sessão ativa no MySQL (Sliding Expiration por inatividade).
 */
export async function renovarSessao(idSessao: number, novaExpiraEm: Date): Promise<void> {
	const pool = getDbPool();
	const sql = `
		UPDATE Sessao
		SET expira_em = ?
		WHERE id_sessao = ? AND revogada_em IS NULL
	`;
	await pool.execute(sql, [novaExpiraEm, idSessao]);
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

// =============================================================================
// FUNÇÕES DE SESSÃO DO CONTROL PLANE SAAS (Sessao_Saas)
// =============================================================================

/**
 * Cria uma sessão dedicada para o Super Admin do SaaS.
 */
export async function criarSessaoSaas(dados: CriarSessaoSaasDTO): Promise<number> {
	const pool = getDbPool();
	const sql = `
		INSERT INTO Sessao_Saas (
			id_usuario,
			token_hash,
			expira_em,
			ip,
			user_agent
		) VALUES (?, ?, ?, ?, ?)
	`;

	const [resultado] = await pool.execute<ResultSetHeader>(sql, [
		dados.idUsuario,
		dados.tokenHash,
		dados.expiraEm,
		dados.ip || null,
		dados.userAgent ? dados.userAgent.substring(0, 255) : null
	]);

	return resultado.insertId;
}

/**
 * Busca uma sessão ativa e não expirada do Super Admin no Control Plane.
 */
export async function buscarSessaoSaasValidaPorHash(tokenHash: string): Promise<SessaoSaasAtiva | null> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			ss.id_sessao_saas,
			ss.id_usuario,
			ss.expira_em,
			u.nome AS nome_usuario,
			u.email AS email_usuario
		FROM Sessao_Saas ss
		INNER JOIN Usuario u ON ss.id_usuario = u.id_usuario
		WHERE ss.token_hash = ?
		  AND ss.revogada_em IS NULL
		  AND ss.expira_em > NOW()
		  AND COALESCE(u.is_super_admin, 0) = 1
		  AND COALESCE(u.ativo, 1) = 1
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [tokenHash]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	return {
		id_sessao_saas: Number(linha.id_sessao_saas),
		id_usuario: Number(linha.id_usuario),
		nome_usuario: String(linha.nome_usuario),
		email_usuario: String(linha.email_usuario),
		expira_em: new Date(linha.expira_em)
	};
}

/**
 * Revoga uma sessão ativa do Super Admin no SaaS (Logout do /saas-admin).
 */
export async function revogarSessaoSaasPorHash(tokenHash: string): Promise<void> {
	const pool = getDbPool();
	const sql = `
		UPDATE Sessao_Saas
		SET revogada_em = NOW()
		WHERE token_hash = ? AND revogada_em IS NULL
	`;
	await pool.execute(sql, [tokenHash]);
}

/**
 * Renova a expiração da sessão do Super Admin (Sliding Expiration).
 */
export async function renovarSessaoSaas(idSessaoSaas: number, novaExpiraEm: Date): Promise<void> {
	const pool = getDbPool();
	const sql = `
		UPDATE Sessao_Saas
		SET expira_em = ?
		WHERE id_sessao_saas = ? AND revogada_em IS NULL
	`;
	await pool.execute(sql, [novaExpiraEm, idSessaoSaas]);
}
