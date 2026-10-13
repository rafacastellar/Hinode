import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDbPool } from '../db/pool';
import { gerarHashSenha } from '../auth/criptografia';
import { mascararCpf } from './usuario.repo';

export interface ResponsavelAluno {
	id_usuario: number;
	nome: string;
	cpf: string;
	email: string;
	telefone: string | null;
	grau_parentesco: string | null;
	financeiro: boolean;
}

export interface DadosResponsavelInput {
	nome: string;
	cpf: string;
	email: string;
	telefone: string | null;
	grauParentesco: string;
	financeiro: boolean;
}

/**
 * Busca o id_perfil correspondente a uma role no MySQL.
 */
async function obterIdPerfil(conn: PoolConnection, role: string): Promise<number> {
	const [linhas] = await conn.execute<RowDataPacket[]>(
		'SELECT id_perfil FROM Perfil WHERE role = ? LIMIT 1',
		[role]
	);
	if (linhas.length > 0) {
		return Number(linhas[0].id_perfil);
	}
	// Fallback padrão se não encontrar
	return role.toLowerCase() === 'responsável' ? 5 : 4;
}

/**
 * Busca ou cadastra o Responsável Legal e vincula ao aluno dentro de uma transação.
 * MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function registrarOuVincularResponsavelEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idAluno: number,
	dados: DadosResponsavelInput
): Promise<number> {
	// 1. Verifica se já existe um usuário com este CPF
	const [usuariosExistentes] = await conn.execute<RowDataPacket[]>(
		'SELECT id_usuario FROM Usuario WHERE cpf = ? LIMIT 1',
		[dados.cpf]
	);

	let idResponsavel: number;

	if (usuariosExistentes.length > 0) {
		idResponsavel = Number(usuariosExistentes[0].id_usuario);
		// Atualiza dados cadastrais se necessário
		await conn.execute(
			`UPDATE Usuario 
			 SET nome = ?, email = COALESCE(NULLIF(?, ''), email), telefone = COALESCE(?, telefone)
			 WHERE id_usuario = ?`,
			[dados.nome, dados.email, dados.telefone, idResponsavel]
		);
	} else {
		// Gera senha provisória aleatória com hash seguro
		const hashProvisorio = await gerarHashSenha(Math.random().toString(36).slice(-10));
		const dataPadrao = '1980-01-01'; // Data para responsável caso não informada

		const [resInsert] = await conn.execute<ResultSetHeader>(
			`INSERT INTO Usuario (nome, cpf, data_nascimento, email, senha_hash, telefone)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[dados.nome, dados.cpf, dataPadrao, dados.email, hashProvisorio, dados.telefone]
		);
		idResponsavel = resInsert.insertId;
	}

	// 2. Garante vínculo multi-tenant com a academia
	await conn.execute(
		'INSERT IGNORE INTO Usuario_Academia (id_usuario, id_academia) VALUES (?, ?)',
		[idResponsavel, idAcademia]
	);

	// 3. Garante papel de Responsável no tenant
	const idPerfilResponsavel = await obterIdPerfil(conn, 'Responsável');
	await conn.execute(
		'INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)',
		[idResponsavel, idAcademia, idPerfilResponsavel]
	);

	// 4. Cadastra/Atualiza na tabela específica de Responsável
	await conn.execute(
		`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE grau_parentesco = VALUES(grau_parentesco), financeiro = VALUES(financeiro)`,
		[idResponsavel, dados.grauParentesco || 'Outro', dados.financeiro ? 1 : 0]
	);

	// 5. Vincula o Responsável ao Aluno
	await conn.execute(
		'INSERT IGNORE INTO Responsavel_Aluno (id_responsavel, id_aluno) VALUES (?, ?)',
		[idResponsavel, idAluno]
	);

	return idResponsavel;
}

/**
 * Consulta o responsável legal vinculado ao judoca em determinada academia.
 */
export async function buscarResponsavelDoAluno(
	idAcademia: number,
	idAluno: number
): Promise<ResponsavelAluno | null> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			u.telefone,
			r.grau_parentesco,
			r.financeiro
		FROM Responsavel_Aluno ra
		INNER JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		INNER JOIN Usuario u ON r.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		WHERE ra.id_aluno = ? AND ua.id_academia = ?
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAluno, idAcademia]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	return {
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		cpf: String(linha.cpf),
		email: String(linha.email),
		telefone: linha.telefone ? String(linha.telefone) : null,
		grau_parentesco: linha.grau_parentesco ? String(linha.grau_parentesco) : null,
		financeiro: Boolean(linha.financeiro)
	};
}

export interface ResponsavelOpcao {
	id_usuario: number;
	nome: string;
	cpf: string;
	cpf_mascarado: string;
	email: string;
	telefone: string | null;
	grau_parentesco: string | null;
	financeiro: boolean;
	total_menores: number;
	nomes_menores: string | null;
}

/**
 * Lista todos os responsáveis já cadastrados no dojo (tenant), incluindo a contagem
 * e nomes dos menores aos quais já estão vinculados.
 */
export async function listarResponsaveisDoDojo(idAcademia: number): Promise<ResponsavelOpcao[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			u.telefone,
			COALESCE(r.grau_parentesco, 'Responsável Legal') AS grau_parentesco,
			COALESCE(r.financeiro, 0) AS financeiro,
			COUNT(DISTINCT ra.id_aluno) AS total_menores,
			GROUP_CONCAT(DISTINCT menor_u.nome ORDER BY menor_u.nome SEPARATOR ', ') AS nomes_menores
		FROM Usuario u
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		LEFT JOIN Responsavel r ON u.id_usuario = r.id_usuario
		LEFT JOIN Responsavel_Aluno ra ON u.id_usuario = ra.id_responsavel
		LEFT JOIN Usuario menor_u ON ra.id_aluno = menor_u.id_usuario
		WHERE ua.id_academia = ? 
		  AND (
		    r.id_usuario IS NOT NULL
		    OR EXISTS (
		      SELECT 1 FROM Usuario_Academia_Perfil uap
		      INNER JOIN Perfil p ON uap.id_perfil = p.id_perfil
		      WHERE uap.id_usuario = u.id_usuario 
		        AND uap.id_academia = ua.id_academia 
		        AND p.role = 'Responsável'
		    )
		  )
		GROUP BY u.id_usuario, u.nome, u.cpf, u.email, u.telefone, r.grau_parentesco, r.financeiro
		ORDER BY u.nome ASC
	`;

	const [linhas] = await pool.query<RowDataPacket[]>(sql, [idAcademia]);
	return linhas.map((linha) => ({
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		cpf: String(linha.cpf),
		cpf_mascarado: mascararCpf(String(linha.cpf)),
		email: String(linha.email),
		telefone: linha.telefone ? String(linha.telefone) : null,
		grau_parentesco: linha.grau_parentesco ? String(linha.grau_parentesco) : null,
		financeiro: Boolean(linha.financeiro),
		total_menores: Number(linha.total_menores || 0),
		nomes_menores: linha.nomes_menores ? String(linha.nomes_menores) : null
	}));
}

/**
 * Vincula um responsável já existente a um aluno dentro de uma transação.
 * Permite associar o mesmo responsável a múltiplos menores (irmãos/dependentes).
 */
export async function vincularResponsavelExistenteEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idResponsavel: number,
	idAluno: number,
	dados: {
		grauParentesco: string;
		financeiro: boolean;
	}
): Promise<void> {
	// 1. Garante vínculo com a academia
	await conn.execute(
		'INSERT IGNORE INTO Usuario_Academia (id_usuario, id_academia) VALUES (?, ?)',
		[idResponsavel, idAcademia]
	);

	// 2. Garante perfil de Responsável no tenant
	const idPerfilResponsavel = await obterIdPerfil(conn, 'Responsável');
	await conn.execute(
		'INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)',
		[idResponsavel, idAcademia, idPerfilResponsavel]
	);

	// 3. Cadastra/Atualiza registro na tabela Responsavel
	await conn.execute(
		`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE 
		   grau_parentesco = COALESCE(VALUES(grau_parentesco), grau_parentesco),
		   financeiro = COALESCE(VALUES(financeiro), financeiro)`,
		[idResponsavel, dados.grauParentesco || 'Responsável Legal', dados.financeiro ? 1 : 0]
	);

	// 4. Vincula o Responsável ao novo Aluno na tabela associativa Responsavel_Aluno com grau e financeiro específicos
	await conn.execute(
		`INSERT INTO Responsavel_Aluno (id_responsavel, id_aluno, grau_parentesco, financeiro) 
		 VALUES (?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE
		   grau_parentesco = VALUES(grau_parentesco),
		   financeiro = VALUES(financeiro)`,
		[idResponsavel, idAluno, dados.grauParentesco || 'Responsável Legal', dados.financeiro ? 1 : 0]
	);
}
