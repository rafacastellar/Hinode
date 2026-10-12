import type { RowDataPacket } from 'mysql2';
import { getDbPool } from '../db/pool';

export interface ProfessorDojo {
	id_usuario: number;
	nome: string;
	n_federacao: string | null;
	grau_faixa: string | null;
}

/**
 * Lista todos os professores/senseis vinculados formalmente a esta academia.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarProfessoresDoDojo(idAcademia: number): Promise<ProfessorDojo[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			p.n_federacao,
			p.grau_faixa
		FROM Professor p
		INNER JOIN Usuario u ON p.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ?
		ORDER BY u.nome ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia]);
	return linhas.map((linha) => ({
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		n_federacao: linha.n_federacao ? String(linha.n_federacao) : null,
		grau_faixa: linha.grau_faixa ? String(linha.grau_faixa) : null
	}));
}
