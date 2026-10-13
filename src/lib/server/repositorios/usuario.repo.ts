import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getDbPool } from '../db/pool';

export interface UsuarioAutenticavel {
	id_usuario: number;
	nome: string;
	cpf: string;
	data_nascimento: string;
	genero: 'M' | 'F';
	email: string;
	senha_hash: string;
	telefone: string | null;
}

export interface AcademiaVinculada {
	id_academia: number;
	nome: string;
	nome_fantasia: string | null;
}

export interface PerfilItem {
	id_perfil: number;
	role: string;
}

export interface UsuarioResumoDojo {
	id_usuario: number;
	nome: string;
	cpf_mascarado: string;
	email: string;
	data_nascimento: string;
	genero: 'M' | 'F';
	idade: number;
	telefone: string | null;
	perfis: PerfilItem[];
	dados_professor: {
		n_federacao: string | null;
		grau_faixa: string | null;
	} | null;
}

export interface UsuarioDetalhadoDojo {
	id_usuario: number;
	nome: string;
	cpf: string;
	cpf_mascarado: string;
	email: string;
	data_nascimento: string;
	genero: 'M' | 'F';
	idade: number;
	telefone: string | null;
	ids_perfis: number[];
	perfis: PerfilItem[];
	dados_professor: {
		n_federacao: string | null;
		grau_faixa: string | null;
	} | null;
}

/**
 * Função utilitária para mascaramento de CPF no padrão LGPD (ex: 123.***.***-00).
 */
export function mascararCpf(cpfPuro: string): string {
	const limpo = cpfPuro.replace(/\D/g, '');
	if (limpo.length !== 11) return '***.***.***-**';
	return `${limpo.slice(0, 3)}.***.***-${limpo.slice(9, 11)}`;
}

/**
 * Busca os dados de autenticação do usuário a partir do e-mail.
 */
export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioAutenticavel | null> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			id_usuario,
			nome,
			cpf,
			DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
			genero,
			email,
			senha_hash,
			telefone
		FROM Usuario
		WHERE email = ?
		LIMIT 1
	`;

	const [linhas] = await pool.query<RowDataPacket[]>(sql, [email.toLowerCase().trim()]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	return {
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		cpf: String(linha.cpf),
		data_nascimento: String(linha.data_nascimento),
		genero: (linha.genero || 'M') as 'M' | 'F',
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

	const [linhas] = await pool.query<RowDataPacket[]>(sql, [idUsuario]);
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

	const [linhas] = await pool.query<RowDataPacket[]>(sql, [idUsuario, idAcademia]);
	return linhas.map((linha) => String(linha.role));
}

/**
 * Lista todos os perfis configurados no banco de dados.
 */
export async function listarPerfisDoSistema(): Promise<PerfilItem[]> {
	const pool = getDbPool();
	const [linhas] = await pool.query<RowDataPacket[]>(
		'SELECT id_perfil, role FROM Perfil ORDER BY id_perfil ASC'
	);
	return linhas.map((l) => ({
		id_perfil: Number(l.id_perfil),
		role: String(l.role)
	}));
}

/**
 * Lista todos os usuários vinculados à academia logada (Multi-tenant).
 * SEGURANÇA: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarUsuariosDoDojo(
	idAcademia: number,
	termoBusca?: string,
	idPerfilFiltro?: number
): Promise<UsuarioResumoDojo[]> {
	const pool = getDbPool();

	let sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			u.genero,
			TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) AS idade,
			u.telefone,
			prof.n_federacao,
			prof.grau_faixa
		FROM Usuario u
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		LEFT JOIN Professor prof ON prof.id_usuario = u.id_usuario
		WHERE ua.id_academia = ?
	`;

	const params: any[] = [idAcademia];

	if (termoBusca && termoBusca.trim()) {
		const buscaLike = `%${termoBusca.trim()}%`;
		sql += ` AND (u.nome LIKE ? OR u.email LIKE ? OR u.cpf LIKE ?)`;
		params.push(buscaLike, buscaLike, buscaLike);
	}

	if (idPerfilFiltro) {
		sql += ` AND u.id_usuario IN (
			SELECT id_usuario FROM Usuario_Academia_Perfil 
			WHERE id_academia = ? AND id_perfil = ?
		)`;
		params.push(idAcademia, idPerfilFiltro);
	}

	sql += ` ORDER BY u.nome ASC`;

	const [usuarios] = await pool.query<RowDataPacket[]>(sql, params);
	if (usuarios.length === 0) return [];

	// Busca todos os perfis associados a esses usuários nesta academia
	const [perfisAssociados] = await pool.query<RowDataPacket[]>(
		`SELECT 
			uap.id_usuario,
			p.id_perfil,
			p.role
		FROM Usuario_Academia_Perfil uap
		INNER JOIN Perfil p ON p.id_perfil = uap.id_perfil
		WHERE uap.id_academia = ?`,
		[idAcademia]
	);

	const mapaPerfis = new Map<number, PerfilItem[]>();
	for (const p of perfisAssociados) {
		const idUser = Number(p.id_usuario);
		if (!mapaPerfis.has(idUser)) {
			mapaPerfis.set(idUser, []);
		}
		mapaPerfis.get(idUser)!.push({
			id_perfil: Number(p.id_perfil),
			role: String(p.role)
		});
	}

	return usuarios.map((u) => {
		const idUser = Number(u.id_usuario);
		return {
			id_usuario: idUser,
			nome: String(u.nome),
			cpf_mascarado: mascararCpf(String(u.cpf)),
			email: String(u.email),
			data_nascimento: String(u.data_nascimento),
			genero: (u.genero || 'M') as 'M' | 'F',
			idade: Number(u.idade),
			telefone: u.telefone ? String(u.telefone) : null,
			perfis: mapaPerfis.get(idUser) || [],
			dados_professor: u.n_federacao || u.grau_faixa
				? {
						n_federacao: u.n_federacao ? String(u.n_federacao) : null,
						grau_faixa: u.grau_faixa ? String(u.grau_faixa) : null
				  }
				: null
		};
	});
}

/**
 * Busca detalhes de um usuário específico garantindo que pertença à academia atual.
 * SEGURANÇA: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function buscarUsuarioDetalhadoNoDojo(
	idAcademia: number,
	idUsuario: number
): Promise<UsuarioDetalhadoDojo | null> {
	const pool = getDbPool();

	const [linhas] = await pool.query<RowDataPacket[]>(
		`SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			u.genero,
			TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) AS idade,
			u.telefone,
			prof.n_federacao,
			prof.grau_faixa
		FROM Usuario u
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		LEFT JOIN Professor prof ON prof.id_usuario = u.id_usuario
		WHERE ua.id_academia = ? AND u.id_usuario = ?
		LIMIT 1`,
		[idAcademia, idUsuario]
	);

	if (linhas.length === 0) return null;
	const u = linhas[0];

	// Busca perfis atribuídos
	const [perfis] = await pool.query<RowDataPacket[]>(
		`SELECT 
			p.id_perfil,
			p.role
		FROM Usuario_Academia_Perfil uap
		INNER JOIN Perfil p ON p.id_perfil = uap.id_perfil
		WHERE uap.id_academia = ? AND uap.id_usuario = ?
		ORDER BY p.id_perfil ASC`,
		[idAcademia, idUsuario]
	);

	const listaPerfis = perfis.map((p) => ({
		id_perfil: Number(p.id_perfil),
		role: String(p.role)
	}));

	return {
		id_usuario: Number(u.id_usuario),
		nome: String(u.nome),
		cpf: String(u.cpf),
		cpf_mascarado: mascararCpf(String(u.cpf)),
		email: String(u.email),
		data_nascimento: String(u.data_nascimento),
		genero: (u.genero || 'M') as 'M' | 'F',
		idade: Number(u.idade),
		telefone: u.telefone ? String(u.telefone) : null,
		ids_perfis: listaPerfis.map((p) => p.id_perfil),
		perfis: listaPerfis,
		dados_professor: u.n_federacao || u.grau_faixa
			? {
					n_federacao: u.n_federacao ? String(u.n_federacao) : null,
					grau_faixa: u.grau_faixa ? String(u.grau_faixa) : null
			  }
			: null
	};
}

/**
 * Conta quantos administradores ativos existem na academia atual.
 * Garante que o dojo nunca fique sem um administrador.
 */
export async function contarAdminsAtivosNoDojo(idAcademia: number): Promise<number> {
	const pool = getDbPool();
	const [linhas] = await pool.query<RowDataPacket[]>(
		`SELECT COUNT(DISTINCT uap.id_usuario) AS total
		FROM Usuario_Academia_Perfil uap
		INNER JOIN Perfil p ON p.id_perfil = uap.id_perfil
		WHERE uap.id_academia = ? AND p.role = 'Admin'`,
		[idAcademia]
	);
	return Number(linhas[0]?.total || 0);
}

// =============================================================================
// FUNÇÕES TRANSACIONAIS (Usadas dentro de executarTransacao no service)
// =============================================================================

export async function buscarUsuarioPorCpfTx(
	conn: PoolConnection,
	cpf: string
): Promise<{ id_usuario: number; email: string } | null> {
	const [linhas] = await conn.query<RowDataPacket[]>(
		'SELECT id_usuario, email FROM Usuario WHERE cpf = ? LIMIT 1',
		[cpf]
	);
	if (linhas.length === 0) return null;
	return {
		id_usuario: Number(linhas[0].id_usuario),
		email: String(linhas[0].email)
	};
}

export async function buscarUsuarioPorEmailTx(
	conn: PoolConnection,
	email: string
): Promise<{ id_usuario: number; cpf: string } | null> {
	const [linhas] = await conn.query<RowDataPacket[]>(
		'SELECT id_usuario, cpf FROM Usuario WHERE email = ? LIMIT 1',
		[email.toLowerCase().trim()]
	);
	if (linhas.length === 0) return null;
	return {
		id_usuario: Number(linhas[0].id_usuario),
		cpf: String(linhas[0].cpf)
	};
}

export async function inserirUsuarioTx(
	conn: PoolConnection,
	dados: {
		nome: string;
		cpf: string;
		dataNascimento: string;
		genero: 'M' | 'F';
		email: string;
		senhaHash: string;
		telefone: string | null;
	}
): Promise<number> {
	const [res] = await conn.query<ResultSetHeader>(
		`INSERT INTO Usuario (nome, cpf, data_nascimento, genero, email, senha_hash, telefone)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			dados.nome,
			dados.cpf,
			dados.dataNascimento,
			dados.genero,
			dados.email.toLowerCase().trim(),
			dados.senhaHash,
			dados.telefone
		]
	);
	return res.insertId;
}

export async function atualizarUsuarioTx(
	conn: PoolConnection,
	idUsuario: number,
	dados: {
		nome: string;
		dataNascimento: string;
		genero: 'M' | 'F';
		email: string;
		telefone: string | null;
	}
): Promise<void> {
	await conn.query(
		`UPDATE Usuario 
		SET nome = ?, data_nascimento = ?, genero = ?, email = ?, telefone = ?
		WHERE id_usuario = ?`,
		[dados.nome, dados.dataNascimento, dados.genero, dados.email.toLowerCase().trim(), dados.telefone, idUsuario]
	);
}

export async function atualizarSenhaUsuarioTx(
	conn: PoolConnection,
	idUsuario: number,
	senhaHash: string
): Promise<void> {
	await conn.query(
		'UPDATE Usuario SET senha_hash = ? WHERE id_usuario = ?',
		[senhaHash, idUsuario]
	);
}

export async function vincularUsuarioAcademiaTx(
	conn: PoolConnection,
	idUsuario: number,
	idAcademia: number
): Promise<void> {
	await conn.query(
		'INSERT IGNORE INTO Usuario_Academia (id_usuario, id_academia) VALUES (?, ?)',
		[idUsuario, idAcademia]
	);
}

export async function sincronizarPerfisUsuarioAcademiaTx(
	conn: PoolConnection,
	idUsuario: number,
	idAcademia: number,
	idsPerfis: number[]
): Promise<void> {
	// Remove os perfis atuais deste usuário nesta academia
	await conn.query(
		'DELETE FROM Usuario_Academia_Perfil WHERE id_usuario = ? AND id_academia = ?',
		[idUsuario, idAcademia]
	);

	// Insere os novos perfis selecionados
	for (const idPerfil of idsPerfis) {
		await conn.query(
			'INSERT INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)',
			[idUsuario, idAcademia, idPerfil]
		);
	}
}

export async function sincronizarDadosProfessorTx(
	conn: PoolConnection,
	idUsuario: number,
	nFederacao: string | null,
	grauFaixa: string | null
): Promise<void> {
	await conn.query(
		`INSERT INTO Professor (id_usuario, n_federacao, grau_faixa)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			n_federacao = VALUES(n_federacao),
			grau_faixa = VALUES(grau_faixa)`,
		[idUsuario, nFederacao, grauFaixa]
	);
}

export async function removerVinculoUsuarioAcademiaTx(
	conn: PoolConnection,
	idUsuario: number,
	idAcademia: number
): Promise<void> {
	// Remove as permissões específicas do usuário na academia
	await conn.query(
		'DELETE FROM Usuario_Academia_Perfil WHERE id_usuario = ? AND id_academia = ?',
		[idUsuario, idAcademia]
	);

	// Remove as sessões ativas do usuário na academia
	await conn.query(
		'DELETE FROM Sessao WHERE id_usuario = ? AND id_academia = ?',
		[idUsuario, idAcademia]
	);

	// Remove o vínculo na tabela Usuario_Academia
	await conn.query(
		'DELETE FROM Usuario_Academia WHERE id_usuario = ? AND id_academia = ?',
		[idUsuario, idAcademia]
	);
}
