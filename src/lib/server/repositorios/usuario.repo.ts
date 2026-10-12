import type { RowDataPacket } from 'mysql2';
import { getDbPool } from '../db/pool';

export interface UsuarioAutenticavel {
	id_usuario: number;
	nome: string;
	cpf: string;
	data_nascimento: string;
	email: string;
	senha_hash: string;
	telefone: string | null;
}

export interface AcademiaVinculada {
	id_academia: number;
	nome: string;
	nome_fantasia: string | null;
}

/**
 * Busca os dados de autenticação do usuário a partir do e-mail.
 * Utiliza consulta estritamente parametrizada (prepared statement).
 */
export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioAutenticavel | null> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			id_usuario,
			nome,
			cpf,
			DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
			email,
			senha_hash,
			telefone
		FROM Usuario
		WHERE email = ?
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [email.toLowerCase().trim()]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	return {
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		cpf: String(linha.cpf),
		data_nascimento: String(linha.data_nascimento),
		email: String(linha.email),
		senha_hash: String(linha.senha_hash),
		telefone: linha.telefone ? String(linha.telefone) : null
	};
}

/**
 * Retorna todas as academias (tenants) às quais o usuário está formalmente associado.
 */
export async function buscarAcademiasDoUsuario(idUsuario: number): Promise<AcademiaVinculada[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			a.id_academia,
			a.nome,
			a.nome_fantasia
		FROM Academia a
		INNER JOIN Usuario_Academia ua ON a.id_academia = ua.id_academia
		WHERE ua.id_usuario = ?
		ORDER BY a.nome ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idUsuario]);
	return linhas.map((linha) => ({
		id_academia: Number(linha.id_academia),
		nome: String(linha.nome),
		nome_fantasia: linha.nome_fantasia ? String(linha.nome_fantasia) : null
	}));
}

/**
 * Retorna todos os papéis (roles) acumulativos do usuário especificamente para uma academia.
 */
export async function buscarPerfisDoUsuarioNaAcademia(
	idUsuario: number,
	idAcademia: number
): Promise<string[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			p.role
		FROM Perfil p
		INNER JOIN Usuario_Academia_Perfil uap ON p.id_perfil = uap.id_perfil
		WHERE uap.id_usuario = ? AND uap.id_academia = ?
		ORDER BY p.role ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idUsuario, idAcademia]);
	return linhas.map((linha) => String(linha.role));
}
