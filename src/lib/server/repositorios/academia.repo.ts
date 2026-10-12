import type { RowDataPacket } from 'mysql2/promise';
import { getDbPool } from '../db/pool';

export interface DadosAcademia {
	id_academia: number;
	nome: string;
	nome_fantasia: string | null;
	cnpj: string;
	inscr_est: string | null;
	telefone: string | null;
}

export interface EstatisticasSeguranca {
	totalUsuarios: number;
	totalSessoesAtivas: number;
	totalLogsAuditoria: number;
}

export interface ItemLogAuditoria {
	id_log: number;
	id_academia: number;
	id_usuario: number | null;
	nome_usuario: string | null;
	acao: string;
	entidade: string | null;
	id_entidade: string | null;
	dados_antes: any;
	dados_depois: any;
	ip: string | null;
	criado_em_formatado: string;
}

/**
 * Busca os dados cadastrais da academia do tenant atual.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function buscarDadosAcademia(
	idAcademia: number
): Promise<DadosAcademia | null> {
	const pool = getDbPool();
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT 
			id_academia,
			nome,
			nome_fantasia,
			cnpj,
			inscr_est,
			telefone
		FROM Academia
		WHERE id_academia = ?
		LIMIT 1`,
		[idAcademia]
	);

	if (rows.length === 0) return null;

	const r = rows[0];
	return {
		id_academia: Number(r.id_academia),
		nome: String(r.nome),
		nome_fantasia: r.nome_fantasia ? String(r.nome_fantasia) : null,
		cnpj: String(r.cnpj),
		inscr_est: r.inscr_est ? String(r.inscr_est) : null,
		telefone: r.telefone ? String(r.telefone) : null
	};
}

/**
 * Obtém telemetria de segurança e conformidade do tenant.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function buscarEstatisticasSeguranca(
	idAcademia: number
): Promise<EstatisticasSeguranca> {
	const pool = getDbPool();

	const [resUsuarios] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) AS total FROM Usuario_Academia WHERE id_academia = ?',
		[idAcademia]
	);

	const [resSessoes] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) AS total FROM Sessao WHERE id_academia = ? AND expira_em > NOW()',
		[idAcademia]
	);

	const [resLogs] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) AS total FROM Log_Auditoria WHERE id_academia = ?',
		[idAcademia]
	);

	return {
		totalUsuarios: Number(resUsuarios[0]?.total || 0),
		totalSessoesAtivas: Number(resSessoes[0]?.total || 0),
		totalLogsAuditoria: Number(resLogs[0]?.total || 0)
	};
}

/**
 * Lista as trilhas de auditoria mais recentes da academia para compliance LGPD.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarLogsAuditoria(
	idAcademia: number,
	limite: number = 25
): Promise<ItemLogAuditoria[]> {
	const pool = getDbPool();
	const limiteSeguro = Math.min(Math.max(limite, 5), 100);

	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT 
			l.id_log,
			l.id_academia,
			l.id_usuario,
			u.nome AS nome_usuario,
			l.acao,
			l.entidade,
			l.id_entidade,
			l.dados_antes,
			l.dados_depois,
			l.ip,
			DATE_FORMAT(l.criado_em, '%d/%m/%Y %H:%i:%s') AS criado_em_formatado
		FROM Log_Auditoria l
		LEFT JOIN Usuario u ON u.id_usuario = l.id_usuario
		WHERE l.id_academia = ?
		ORDER BY l.criado_em DESC
		LIMIT ?`,
		[idAcademia, limiteSeguro]
	);

	return rows.map((r) => ({
		id_log: Number(r.id_log),
		id_academia: Number(r.id_academia),
		id_usuario: r.id_usuario ? Number(r.id_usuario) : null,
		nome_usuario: r.nome_usuario ? String(r.nome_usuario) : null,
		acao: String(r.acao),
		entidade: r.entidade ? String(r.entidade) : null,
		id_entidade: r.id_entidade ? String(r.id_entidade) : null,
		dados_antes: r.dados_antes,
		dados_depois: r.dados_depois,
		ip: r.ip ? String(r.ip) : null,
		criado_em_formatado: String(r.criado_em_formatado)
	}));
}
