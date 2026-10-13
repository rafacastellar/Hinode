import type { RowDataPacket } from 'mysql2/promise';
import { getDbPool } from '../db/pool';
import { mascararCpf } from './usuario.repo';

export interface ResponsavelVinculadoResumo {
	id_responsavel: number;
	nome: string;
	cpf_mascarado: string;
	telefone: string | null;
	email: string | null;
	grau_parentesco: string;
	financeiro: boolean;
}

export interface CandidatoMatricula {
	id_usuario: number;
	nome: string;
	cpf: string;
	cpf_mascarado: string;
	email: string;
	telefone: string | null;
	data_nascimento: string;
	idade: number;
	genero: 'M' | 'F';
	ja_matriculado: boolean;
	responsaveis: ResponsavelVinculadoResumo[];
}

/**
 * Lista todos os usuários do dojo (tenant) que possuem o perfil 'Aluno',
 * indicando se já possuem matrícula técnica (tabela Aluno) e trazendo
 * os responsáveis legais vinculados em Responsavel_Aluno.
 * MULTI-TENANT: filtrado por idAcademia.
 */
export async function listarCandidatosMatriculaDoDojo(
	idAcademia: number
): Promise<CandidatoMatricula[]> {
	const pool = getDbPool();

	const [usuarios] = await pool.query<RowDataPacket[]>(
		`SELECT DISTINCT
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			u.telefone,
			u.genero,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) AS idade,
			(a.id_usuario IS NOT NULL) AS ja_matriculado
		 FROM Usuario u
		 INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		 INNER JOIN Usuario_Academia_Perfil uap
			ON uap.id_usuario = u.id_usuario AND uap.id_academia = ua.id_academia
		 INNER JOIN Perfil p ON p.id_perfil = uap.id_perfil
		 LEFT JOIN Aluno a ON a.id_usuario = u.id_usuario
		 WHERE ua.id_academia = ? AND p.role = 'Aluno'
		 ORDER BY u.nome ASC`,
		[idAcademia]
	);

	if (usuarios.length === 0) return [];

	const ids = usuarios.map((u) => Number(u.id_usuario));

	// Responsáveis vinculados (restritos a responsáveis que também pertencem ao dojo)
	const [vinculos] = await pool.query<RowDataPacket[]>(
		`SELECT
			ra.id_aluno,
			ra.id_responsavel,
			ru.nome,
			ru.cpf,
			ru.telefone,
			ru.email,
			COALESCE(ra.grau_parentesco, r.grau_parentesco, 'Responsável Legal') AS grau_parentesco,
			COALESCE(ra.financeiro, r.financeiro, 0) AS financeiro
		 FROM Responsavel_Aluno ra
		 INNER JOIN Usuario ru ON ru.id_usuario = ra.id_responsavel
		 INNER JOIN Usuario_Academia rua ON rua.id_usuario = ru.id_usuario AND rua.id_academia = ?
		 LEFT JOIN Responsavel r ON r.id_usuario = ra.id_responsavel
		 WHERE ra.id_aluno IN (?)
		 ORDER BY ru.nome ASC`,
		[idAcademia, ids]
	);

	const mapa = new Map<number, ResponsavelVinculadoResumo[]>();
	for (const v of vinculos) {
		const idAluno = Number(v.id_aluno);
		const lista = mapa.get(idAluno) ?? [];
		lista.push({
			id_responsavel: Number(v.id_responsavel),
			nome: String(v.nome),
			cpf_mascarado: mascararCpf(String(v.cpf)),
			telefone: v.telefone ? String(v.telefone) : null,
			email: v.email ? String(v.email) : null,
			grau_parentesco: String(v.grau_parentesco),
			financeiro: Boolean(v.financeiro)
		});
		mapa.set(idAluno, lista);
	}

	return usuarios.map((u) => ({
		id_usuario: Number(u.id_usuario),
		nome: String(u.nome),
		cpf: String(u.cpf),
		cpf_mascarado: mascararCpf(String(u.cpf)),
		email: String(u.email),
		telefone: u.telefone ? String(u.telefone) : null,
		data_nascimento: String(u.data_nascimento),
		idade: Number(u.idade),
		genero: (u.genero || 'M') as 'M' | 'F',
		ja_matriculado: Boolean(Number(u.ja_matriculado)),
		responsaveis: mapa.get(Number(u.id_usuario)) ?? []
	}));
}
