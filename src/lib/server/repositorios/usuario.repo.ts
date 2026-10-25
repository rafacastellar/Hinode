import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getDbPool, executarTransacao } from '../db/pool';
import { verificarSenha, gerarHashSenha } from '../auth/criptografia';
import { obterClassificacaoJudo } from '../../dominio/regras-categoria-peso';

export interface UsuarioAutenticavel {
	id_usuario: number;
	nome: string;
	tipo_documento?: 'CPF' | 'ESTRANGEIRO';
	cpf: string;
	pais_origem?: string;
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
	tipo_documento?: 'CPF' | 'ESTRANGEIRO';
	cpf: string;
	cpf_mascarado: string;
	pais_origem?: string;
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

export interface EnderecoUsuario {
	logradouro: string;
	numero: string | null;
	complemento: string | null;
	bairro: string | null;
	cidade: string;
	uf: string;
	cep: string;
}

export interface UsuarioDetalhadoDojo {
	id_usuario: number;
	nome: string;
	tipo_documento: 'CPF' | 'ESTRANGEIRO';
	cpf: string;
	cpf_mascarado: string;
	pais_origem: string;
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
	dados_aluno: {
		matricula: string | null;
		peso: number | null;
		categoria: string | null;
		n_federacao: string | null;
		status_federacao: string | null;
		data_inicio: string | null;
		data_inicio_br: string | null;
		data_primeira_graduacao: string | null;
		data_primeira_graduacao_br: string | null;
		graduacao_atual: string;
		grupo_especial_aspirante: string | null;
		nome_professor_responsavel: string;
	} | null;
	endereco: EnderecoUsuario | null;
	responsavel_legal: {
		id_responsavel: number;
		nome: string;
		cpf: string;
		cpf_mascarado?: string;
		telefone?: string | null;
		email?: string | null;
		grau_parentesco: string | null;
		financeiro: boolean;
	} | null;
	responsaveis_legais: Array<{
		id_responsavel: number;
		nome: string;
		cpf: string;
		cpf_mascarado: string;
		telefone?: string | null;
		email?: string | null;
		grau_parentesco: string | null;
		financeiro: boolean;
	}>;
	dependentes: Array<{
		id_aluno: number;
		nome: string;
	}>;
}

export interface PerfilCompletoUsuario {
	id_usuario: number;
	nome: string;
	tipo_documento?: 'CPF' | 'ESTRANGEIRO';
	cpf: string;
	cpf_mascarado: string;
	pais_origem?: string;
	email: string;
	data_nascimento: string;
	data_nascimento_br: string;
	genero: 'M' | 'F';
	idade: number;
	telefone: string | null;
	perfis: PerfilItem[];
	endereco: EnderecoUsuario | null;
	dados_aluno: {
		matricula: string | null;
		peso: number | null;
		categoria: string | null;
		n_federacao: string | null;
		status_federacao: string | null;
		data_inicio: string | null;
		data_inicio_br: string | null;
		data_primeira_graduacao: string | null;
		data_primeira_graduacao_br: string | null;
		graduacao_atual: string;
		grupo_especial_aspirante: string | null;
		nome_professor_responsavel: string;
	} | null;
	dados_professor: {
		n_federacao: string | null;
		grau_faixa: string | null;
	} | null;
	dados_responsavel: {
		grau_parentesco: string | null;
		financeiro: boolean;
		dependentes: Array<{ id_aluno: number; nome: string }>;
	} | null;
}

export interface DadosEdicaoProprioPerfil {
	email: string;
	telefone?: string | null;
	peso?: number | null;
	endereco?: {
		cep: string;
		logradouro: string;
		numero?: string | null;
		complemento?: string | null;
		bairro?: string | null;
		cidade: string;
		uf: string;
	} | null;
}

/**
 * Função utilitária para mascaramento de documentos (CPF ou Internacional) no padrão LGPD.
 * Para CPF (11 dígitos): exibe 123.***.***-00.
 * Para estrangeiro: exibe PA****56.
 */
export function mascararCpf(cpfPuro: string, tipo?: 'CPF' | 'ESTRANGEIRO'): string {
	if (!cpfPuro) return '***';
	const limpo = cpfPuro.trim();
	const digitos = limpo.replace(/\D/g, '');
	if (digitos.length === 11 && (tipo === 'CPF' || !tipo)) {
		return `${digitos.slice(0, 3)}.***.***-${digitos.slice(9, 11)}`;
	}
	if (limpo.length <= 4) return '***';
	return `${limpo.slice(0, 2)}${'*'.repeat(Math.max(3, limpo.length - 4))}${limpo.slice(-2)}`;
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
			u.tipo_documento,
			u.cpf,
			u.pais_origem,
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
			tipo_documento: (u.tipo_documento as 'CPF' | 'ESTRANGEIRO') || 'CPF',
			cpf: String(u.cpf),
			cpf_mascarado: mascararCpf(String(u.cpf), u.tipo_documento),
			pais_origem: String(u.pais_origem || 'Brasil'),
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
			u.tipo_documento,
			u.cpf,
			u.pais_origem,
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

	// Busca endereço do usuário
	const [enderecos] = await pool.query<RowDataPacket[]>(
		`SELECT logradouro, numero, complemento, bairro, cidade, uf, cep 
		 FROM Endereco_Usuario 
		 WHERE id_usuario = ? LIMIT 1`,
		[idUsuario]
	);
	const endereco: EnderecoUsuario | null =
		enderecos.length > 0
			? {
					logradouro: String(enderecos[0].logradouro),
					numero: enderecos[0].numero ? String(enderecos[0].numero) : null,
					complemento: enderecos[0].complemento ? String(enderecos[0].complemento) : null,
					bairro: enderecos[0].bairro ? String(enderecos[0].bairro) : null,
					cidade: String(enderecos[0].cidade),
					uf: String(enderecos[0].uf),
					cep: String(enderecos[0].cep)
			  }
			: null;

	// Busca responsáveis legais (caso este usuário seja um aluno/menor com responsáveis vinculados)
	const [responsaveis] = await pool.query<RowDataPacket[]>(
		`SELECT 
			ra.id_responsavel, 
			resp_u.nome, 
			resp_u.cpf, 
			resp_u.telefone, 
			resp_u.email, 
			COALESCE(ra.grau_parentesco, r.grau_parentesco, 'Responsável Legal') AS grau_parentesco, 
			COALESCE(ra.financeiro, r.financeiro, 0) AS financeiro
		 FROM Responsavel_Aluno ra
		 INNER JOIN Usuario resp_u ON ra.id_responsavel = resp_u.id_usuario
		 LEFT JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		 WHERE ra.id_aluno = ?
		 ORDER BY resp_u.nome ASC`,
		[idUsuario]
	);

	const responsaveisLegais = responsaveis.map((row) => ({
		id_responsavel: Number(row.id_responsavel),
		nome: String(row.nome),
		cpf: String(row.cpf),
		cpf_mascarado: mascararCpf(String(row.cpf)),
		telefone: row.telefone ? String(row.telefone) : null,
		email: row.email ? String(row.email) : null,
		grau_parentesco: row.grau_parentesco ? String(row.grau_parentesco) : null,
		financeiro: Boolean(row.financeiro)
	}));
	const responsavelLegal = responsaveisLegais.length > 0 ? responsaveisLegais[0] : null;

	// Busca dependentes vinculados (caso este usuário seja um responsável com menores associados)
	const [dependentesLinhas] = await pool.query<RowDataPacket[]>(
		`SELECT ra.id_aluno, aluno_u.nome
		 FROM Responsavel_Aluno ra
		 INNER JOIN Usuario aluno_u ON ra.id_aluno = aluno_u.id_usuario
		 WHERE ra.id_responsavel = ?
		 ORDER BY aluno_u.nome ASC`,
		[idUsuario]
	);
	const dependentes = dependentesLinhas.map((d) => ({
		id_aluno: Number(d.id_aluno),
		nome: String(d.nome)
	}));

	// Busca dados de aluno (caso este usuário possua ficha de judoca)
	let dadosAluno: PerfilCompletoUsuario['dados_aluno'] = null;
	const [alunosLinhas] = await pool.query<RowDataPacket[]>(
		`SELECT 
			a.matricula,
			a.peso,
			a.categoria,
			a.n_federacao,
			a.status_federacao,
			DATE_FORMAT(a.data_inicio, '%Y-%m-%d') AS data_inicio,
			DATE_FORMAT(a.data_inicio, '%d/%m/%Y') AS data_inicio_br,
			DATE_FORMAT(a.data_primeira_graduacao, '%Y-%m-%d') AS data_primeira_graduacao,
			DATE_FORMAT(a.data_primeira_graduacao, '%d/%m/%Y') AS data_primeira_graduacao_br,
			a.graduacao_atual,
			a.grupo_especial_aspirante,
			COALESCE(
				CASE 
					WHEN p.grau_faixa IS NOT NULL AND p.grau_faixa != '' THEN CONCAT(prof_u.nome, ' (', p.grau_faixa, ')')
					ELSE prof_u.nome
				END, 
				'Não informado'
			) AS nome_professor_responsavel
		FROM Aluno a
		LEFT JOIN Professor p ON a.id_professor_responsavel = p.id_usuario
		LEFT JOIN Usuario prof_u ON p.id_usuario = prof_u.id_usuario
		WHERE a.id_usuario = ?
		LIMIT 1`,
		[idUsuario]
	);
	if (alunosLinhas.length > 0) {
		const al = alunosLinhas[0];
		dadosAluno = {
			matricula: al.matricula ? String(al.matricula) : null,
			peso: al.peso !== null ? Number(al.peso) : null,
			categoria: al.categoria ? String(al.categoria) : null,
			n_federacao: al.n_federacao ? String(al.n_federacao) : null,
			status_federacao: al.status_federacao ? String(al.status_federacao) : null,
			data_inicio: al.data_inicio ? String(al.data_inicio) : null,
			data_inicio_br: al.data_inicio_br ? String(al.data_inicio_br) : null,
			data_primeira_graduacao: al.data_primeira_graduacao ? String(al.data_primeira_graduacao) : null,
			data_primeira_graduacao_br: al.data_primeira_graduacao_br ? String(al.data_primeira_graduacao_br) : null,
			graduacao_atual: String(al.graduacao_atual || 'Branca'),
			grupo_especial_aspirante: al.grupo_especial_aspirante ? String(al.grupo_especial_aspirante) : null,
			nome_professor_responsavel: String(al.nome_professor_responsavel)
		};
	}

	return {
		id_usuario: Number(u.id_usuario),
		nome: String(u.nome),
		tipo_documento: (u.tipo_documento as 'CPF' | 'ESTRANGEIRO') || 'CPF',
		cpf: String(u.cpf),
		cpf_mascarado: mascararCpf(String(u.cpf), u.tipo_documento),
		pais_origem: String(u.pais_origem || 'Brasil'),
		email: String(u.email),
		data_nascimento: String(u.data_nascimento),
		genero: (u.genero || 'M') as 'M' | 'F',
		idade: Number(u.idade),
		telefone: u.telefone ? String(u.telefone) : null,
		ids_perfis: listaPerfis.map((p) => p.id_perfil),
		perfis: listaPerfis,
		dados_professor:
			u.n_federacao || u.grau_faixa
				? {
						n_federacao: u.n_federacao ? String(u.n_federacao) : null,
						grau_faixa: u.grau_faixa ? String(u.grau_faixa) : null
				  }
				: null,
		dados_aluno: dadosAluno,
		endereco,
		responsavel_legal: responsavelLegal,
		responsaveis_legais: responsaveisLegais,
		dependentes
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
		tipoDocumento?: 'CPF' | 'ESTRANGEIRO';
		cpf: string;
		paisOrigem?: string;
		dataNascimento: string;
		genero: 'M' | 'F';
		email: string;
		senhaHash: string;
		telefone: string | null;
	}
): Promise<number> {
	const [res] = await conn.query<ResultSetHeader>(
		`INSERT INTO Usuario (nome, tipo_documento, cpf, pais_origem, data_nascimento, genero, email, senha_hash, telefone)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			dados.nome,
			dados.tipoDocumento || 'CPF',
			dados.cpf,
			dados.paisOrigem || 'Brasil',
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

export async function salvarEnderecoUsuarioTx(
	conn: PoolConnection,
	idUsuario: number,
	endereco: {
		logradouro: string;
		numero?: string | null;
		complemento?: string | null;
		bairro?: string | null;
		cidade: string;
		uf: string;
		cep: string;
	}
): Promise<void> {
	await conn.execute(
		`INSERT INTO Endereco_Usuario (id_usuario, logradouro, numero, complemento, bairro, cidade, uf, cep)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE
		   logradouro = VALUES(logradouro),
		   numero = VALUES(numero),
		   complemento = VALUES(complemento),
		   bairro = VALUES(bairro),
		   cidade = VALUES(cidade),
		   uf = VALUES(uf),
		   cep = VALUES(cep)`,
		[
			idUsuario,
			endereco.logradouro,
			endereco.numero || null,
			endereco.complemento || null,
			endereco.bairro || null,
			endereco.cidade,
			endereco.uf.toUpperCase(),
			endereco.cep
		]
	);
}

export async function vincularResponsavelAoUsuarioTx(
	conn: PoolConnection,
	idAluno: number,
	idResponsavel: number,
	grauParentesco: string = 'Responsável Legal',
	financeiro: boolean = false
): Promise<void> {
	await conn.execute(
		`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE
		   grau_parentesco = COALESCE(VALUES(grau_parentesco), grau_parentesco),
		   financeiro = COALESCE(VALUES(financeiro), financeiro)`,
		[idResponsavel, grauParentesco, financeiro ? 1 : 0]
	);

	await conn.execute(
		`INSERT INTO Responsavel_Aluno (id_responsavel, id_aluno, grau_parentesco, financeiro)
		 VALUES (?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE
		   grau_parentesco = VALUES(grau_parentesco),
		   financeiro = VALUES(financeiro)`,
		[idResponsavel, idAluno, grauParentesco, financeiro ? 1 : 0]
	);
}

export async function sincronizarResponsaveisDoUsuarioTx(
	conn: PoolConnection,
	idAluno: number,
	responsaveis: Array<{
		idResponsavel: number;
		grauParentesco?: string | null;
		financeiro?: boolean;
	}>
): Promise<void> {
	await conn.execute('DELETE FROM Responsavel_Aluno WHERE id_aluno = ?', [idAluno]);

	for (const resp of responsaveis) {
		if (!resp.idResponsavel) continue;
		await conn.execute(
			`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
			 VALUES (?, ?, ?)
			 ON DUPLICATE KEY UPDATE
			   grau_parentesco = COALESCE(VALUES(grau_parentesco), grau_parentesco),
			   financeiro = COALESCE(VALUES(financeiro), financeiro)`,
			[
				resp.idResponsavel,
				resp.grauParentesco || 'Responsável Legal',
				resp.financeiro ? 1 : 0
			]
		);

		await conn.execute(
			`INSERT INTO Responsavel_Aluno (id_responsavel, id_aluno, grau_parentesco, financeiro)
			 VALUES (?, ?, ?, ?)
			 ON DUPLICATE KEY UPDATE
			   grau_parentesco = VALUES(grau_parentesco),
			   financeiro = VALUES(financeiro)`,
			[
				resp.idResponsavel,
				idAluno,
				resp.grauParentesco || 'Responsável Legal',
				resp.financeiro ? 1 : 0
			]
		);
	}
}

export async function desvincularResponsavelDoUsuarioTx(
	conn: PoolConnection,
	idAluno: number
): Promise<void> {
	await conn.execute('DELETE FROM Responsavel_Aluno WHERE id_aluno = ?', [idAluno]);
}

export interface UsuarioParaMatriculaItem {
	id_usuario: number;
	nome: string;
	cpf: string;
	cpf_mascarado: string;
	data_nascimento: string;
	idade: number;
	genero: 'M' | 'F';
	email: string;
	telefone: string | null;
	ja_aluno: boolean;
}

/**
 * Busca usuários existentes no sistema para opção de vinculação na matrícula de judoca.
 * Verifica também se o usuário já possui matrícula ativa como Aluno no dojo.
 */
export async function buscarUsuariosParaMatricula(
	idAcademia: number,
	termo: string
): Promise<UsuarioParaMatriculaItem[]> {
	const pool = getDbPool();
	const termoLimpo = termo.trim();
	if (!termoLimpo) return [];

	const termoLike = `%${termoLimpo}%`;
	const digitos = termoLimpo.replace(/\D/g, '');
	const digitosLike = digitos ? `%${digitos}%` : termoLike;

	const sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) AS idade,
			u.genero,
			u.email,
			u.telefone,
			CASE 
				WHEN EXISTS (
					SELECT 1 FROM Aluno a 
					INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario 
					WHERE a.id_usuario = u.id_usuario AND ua.id_academia = ?
				) THEN 1 
				ELSE 0 
			END AS ja_aluno
		FROM Usuario u
		WHERE (
			u.nome LIKE ? 
			OR u.email LIKE ? 
			OR u.cpf LIKE ? 
			OR REPLACE(REPLACE(u.cpf, '.', ''), '-', '') LIKE ?
		)
		ORDER BY u.nome ASC
		LIMIT 15
	`;

	const [linhas] = await pool.query<RowDataPacket[]>(sql, [
		idAcademia,
		termoLike,
		termoLike,
		termoLike,
		digitosLike
	]);

	return linhas.map((linha) => ({
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		cpf: String(linha.cpf),
		cpf_mascarado: mascararCpf(String(linha.cpf)),
		data_nascimento: String(linha.data_nascimento),
		idade: Number(linha.idade),
		genero: (linha.genero || 'M') as 'M' | 'F',
		email: String(linha.email),
		telefone: linha.telefone ? String(linha.telefone) : null,
		ja_aluno: Boolean(linha.ja_aluno)
	}));
}

/**
 * Busca o perfil completo e detalhado do usuário logado no contexto do Dojo (Tenant).
 */
export async function buscarPerfilCompletoParaUsuario(
	idAcademia: number,
	idUsuario: number
): Promise<PerfilCompletoUsuario | null> {
	const pool = getDbPool();

	// 1. Busca dados base do usuário garantindo vínculo com a academia logada
	const [usuarios] = await pool.query<RowDataPacket[]>(
		`SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			DATE_FORMAT(u.data_nascimento, '%d/%m/%Y') AS data_nascimento_br,
			u.genero,
			TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) AS idade,
			u.telefone
		FROM Usuario u
		INNER JOIN Usuario_Academia ua ON ua.id_usuario = u.id_usuario
		WHERE ua.id_academia = ? AND u.id_usuario = ?
		LIMIT 1`,
		[idAcademia, idUsuario]
	);

	if (usuarios.length === 0) return null;
	const u = usuarios[0];

	// 2. Perfis vinculados a esta academia
	const [perfisLinhas] = await pool.query<RowDataPacket[]>(
		`SELECT p.id_perfil, p.role
		FROM Usuario_Academia_Perfil uap
		INNER JOIN Perfil p ON p.id_perfil = uap.id_perfil
		WHERE uap.id_academia = ? AND uap.id_usuario = ?
		ORDER BY p.id_perfil ASC`,
		[idAcademia, idUsuario]
	);
	const perfis = perfisLinhas.map((p) => ({
		id_perfil: Number(p.id_perfil),
		role: String(p.role)
	}));

	// 3. Endereço residencial do usuário
	const [enderecos] = await pool.query<RowDataPacket[]>(
		`SELECT logradouro, numero, complemento, bairro, cidade, uf, cep
		FROM Endereco_Usuario
		WHERE id_usuario = ?
		LIMIT 1`,
		[idUsuario]
	);
	const endereco: EnderecoUsuario | null =
		enderecos.length > 0
			? {
					logradouro: String(enderecos[0].logradouro),
					numero: enderecos[0].numero ? String(enderecos[0].numero) : null,
					complemento: enderecos[0].complemento ? String(enderecos[0].complemento) : null,
					bairro: enderecos[0].bairro ? String(enderecos[0].bairro) : null,
					cidade: String(enderecos[0].cidade),
					uf: String(enderecos[0].uf),
					cep: String(enderecos[0].cep)
			  }
			: null;

	// 4. Dados de Aluno (se aplicável)
	let dadosAluno: PerfilCompletoUsuario['dados_aluno'] = null;
	const [alunosLinhas] = await pool.query<RowDataPacket[]>(
		`SELECT 
			a.matricula,
			a.peso,
			a.categoria,
			a.n_federacao,
			a.status_federacao,
			DATE_FORMAT(a.data_inicio, '%Y-%m-%d') AS data_inicio,
			DATE_FORMAT(a.data_inicio, '%d/%m/%Y') AS data_inicio_br,
			DATE_FORMAT(a.data_primeira_graduacao, '%Y-%m-%d') AS data_primeira_graduacao,
			DATE_FORMAT(a.data_primeira_graduacao, '%d/%m/%Y') AS data_primeira_graduacao_br,
			a.graduacao_atual,
			a.grupo_especial_aspirante,
			COALESCE(
				CASE 
					WHEN p.grau_faixa IS NOT NULL AND p.grau_faixa != '' THEN CONCAT(prof_u.nome, ' (', p.grau_faixa, ')')
					ELSE prof_u.nome
				END, 
				'Não informado'
			) AS nome_professor_responsavel
		FROM Aluno a
		LEFT JOIN Professor p ON a.id_professor_responsavel = p.id_usuario
		LEFT JOIN Usuario prof_u ON p.id_usuario = prof_u.id_usuario
		WHERE a.id_usuario = ?
		LIMIT 1`,
		[idUsuario]
	);
	if (alunosLinhas.length > 0) {
		const al = alunosLinhas[0];
		dadosAluno = {
			matricula: al.matricula ? String(al.matricula) : null,
			peso: al.peso !== null ? Number(al.peso) : null,
			categoria: al.categoria ? String(al.categoria) : null,
			n_federacao: al.n_federacao ? String(al.n_federacao) : null,
			status_federacao: al.status_federacao ? String(al.status_federacao) : null,
			data_inicio: al.data_inicio ? String(al.data_inicio) : null,
			data_inicio_br: al.data_inicio_br ? String(al.data_inicio_br) : null,
			data_primeira_graduacao: al.data_primeira_graduacao ? String(al.data_primeira_graduacao) : null,
			data_primeira_graduacao_br: al.data_primeira_graduacao_br ? String(al.data_primeira_graduacao_br) : null,
			graduacao_atual: String(al.graduacao_atual || 'Branca'),
			grupo_especial_aspirante: al.grupo_especial_aspirante ? String(al.grupo_especial_aspirante) : null,
			nome_professor_responsavel: String(al.nome_professor_responsavel)
		};
	}

	// 5. Dados de Professor (se aplicável)
	let dadosProfessor: PerfilCompletoUsuario['dados_professor'] = null;
	const [profLinhas] = await pool.query<RowDataPacket[]>(
		`SELECT n_federacao, grau_faixa FROM Professor WHERE id_usuario = ? LIMIT 1`,
		[idUsuario]
	);
	if (profLinhas.length > 0) {
		dadosProfessor = {
			n_federacao: profLinhas[0].n_federacao ? String(profLinhas[0].n_federacao) : null,
			grau_faixa: profLinhas[0].grau_faixa ? String(profLinhas[0].grau_faixa) : null
		};
	}

	// 6. Dados de Responsável (se aplicável)
	let dadosResponsavel: PerfilCompletoUsuario['dados_responsavel'] = null;
	const [respLinhas] = await pool.query<RowDataPacket[]>(
		`SELECT grau_parentesco, financeiro FROM Responsavel WHERE id_usuario = ? LIMIT 1`,
		[idUsuario]
	);
	if (respLinhas.length > 0) {
		const [depsLinhas] = await pool.query<RowDataPacket[]>(
			`SELECT ra.id_aluno, al_u.nome
			FROM Responsavel_Aluno ra
			INNER JOIN Usuario al_u ON ra.id_aluno = al_u.id_usuario
			WHERE ra.id_responsavel = ?
			ORDER BY al_u.nome ASC`,
			[idUsuario]
		);
		dadosResponsavel = {
			grau_parentesco: respLinhas[0].grau_parentesco ? String(respLinhas[0].grau_parentesco) : null,
			financeiro: Boolean(respLinhas[0].financeiro),
			dependentes: depsLinhas.map((d) => ({
				id_aluno: Number(d.id_aluno),
				nome: String(d.nome)
			}))
		};
	}

	return {
		id_usuario: Number(u.id_usuario),
		nome: String(u.nome),
		cpf: String(u.cpf),
		cpf_mascarado: mascararCpf(String(u.cpf)),
		email: String(u.email),
		data_nascimento: String(u.data_nascimento),
		data_nascimento_br: String(u.data_nascimento_br),
		genero: (u.genero || 'M') as 'M' | 'F',
		idade: Number(u.idade),
		telefone: u.telefone ? String(u.telefone) : null,
		perfis,
		endereco,
		dados_aluno: dadosAluno,
		dados_professor: dadosProfessor,
		dados_responsavel: dadosResponsavel
	};
}

/**
 * Atualiza os dados editáveis pelo próprio usuário em transação ACID segura.
 */
export async function atualizarDadosProprioPerfilTx(
	idAcademia: number,
	idUsuario: number,
	dados: DadosEdicaoProprioPerfil
): Promise<{ novaCategoria?: string | null }> {
	return await executarTransacao(async (conn) => {
		// 1. Valida se o usuário pertence à academia logada
		const [vinculo] = await conn.execute<RowDataPacket[]>(
			`SELECT 1 FROM Usuario_Academia WHERE id_usuario = ? AND id_academia = ? LIMIT 1`,
			[idUsuario, idAcademia]
		);
		if (vinculo.length === 0) {
			throw new Error('Usuário não vinculado a esta academia.');
		}

		// 2. Valida unicidade de e-mail (caso tenha sido alterado)
		const emailNormalizado = dados.email.toLowerCase().trim();
		const [emailExistente] = await conn.execute<RowDataPacket[]>(
			`SELECT id_usuario FROM Usuario WHERE email = ? AND id_usuario != ? LIMIT 1`,
			[emailNormalizado, idUsuario]
		);
		if (emailExistente.length > 0) {
			throw new Error('Este e-mail já está sendo utilizado por outro usuário no sistema.');
		}

		// 3. Atualiza dados de contato em Usuario
		await conn.execute(
			`UPDATE Usuario SET email = ?, telefone = ? WHERE id_usuario = ?`,
			[emailNormalizado, dados.telefone?.trim() || null, idUsuario]
		);

		// 4. Salva endereço se informado
		if (dados.endereco) {
			await salvarEnderecoUsuarioTx(conn, idUsuario, dados.endereco);
		}

		// 5. Se o usuário for Aluno, atualiza o peso e recalcula a categoria oficial (CBJ/FPJ)
		let novaCategoriaCalculada: string | null = null;
		if (dados.peso !== undefined) {
			const [alunoRows] = await conn.execute<RowDataPacket[]>(
				`SELECT a.graduacao_atual, a.categoria, a.peso, u.genero, DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento
				 FROM Aluno a
				 INNER JOIN Usuario u ON u.id_usuario = a.id_usuario
				 WHERE a.id_usuario = ? LIMIT 1`,
				[idUsuario]
			);
			if (alunoRows.length > 0) {
				const row = alunoRows[0];
				const pesoAntigo = row.peso !== null ? Number(row.peso) : null;
				const categoriaAntiga = row.categoria ? String(row.categoria) : null;
				let novaDivisao: string | null = null;

				if (row.data_nascimento && dados.peso !== null) {
					const classif = obterClassificacaoJudo({
						dataNascimento: String(row.data_nascimento),
						genero: (row.genero === 'F' ? 'F' : 'M') as 'M' | 'F',
						peso: dados.peso,
						graduacao: String(row.graduacao_atual || 'Branca')
					});
					novaCategoriaCalculada = classif.categoriaCompleta;
					novaDivisao = classif.divisao;
				}

				await conn.execute(
					`UPDATE Aluno 
					 SET peso = ?, 
					     categoria = COALESCE(?, categoria), 
					     grupo_especial_aspirante = COALESCE(?, grupo_especial_aspirante)
					 WHERE id_usuario = ?`,
					[dados.peso, novaCategoriaCalculada, novaDivisao, idUsuario]
				);

				// Registra no Log_Auditoria para o Sensei responsável acompanhar a mudança de peso/categoria
				if (pesoAntigo !== dados.peso || (categoriaAntiga && novaCategoriaCalculada && categoriaAntiga !== novaCategoriaCalculada)) {
					await conn.execute(
						`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_antes, dados_depois)
						 VALUES (?, ?, 'MUDANCA_PESO_CATEGORIA', 'Aluno', ?, ?, ?)`,
						[
							idAcademia,
							idUsuario,
							String(idUsuario),
							JSON.stringify({ peso: pesoAntigo, categoria: categoriaAntiga }),
							JSON.stringify({ peso: dados.peso, categoria: novaCategoriaCalculada })
						]
					);
				}
			}
		}

		return { novaCategoria: novaCategoriaCalculada };
	});
}

/**
 * Altera a senha de acesso do usuário validando previamente a senha antiga.
 */
export async function alterarPropriaSenhaUsuario(
	idUsuario: number,
	senhaAtual: string,
	novaSenha: string
): Promise<void> {
	const pool = getDbPool();

	// 1. Busca hash da senha atual
	const [linhas] = await pool.execute<RowDataPacket[]>(
		`SELECT senha_hash FROM Usuario WHERE id_usuario = ? LIMIT 1`,
		[idUsuario]
	);
	if (linhas.length === 0) {
		throw new Error('Usuário não encontrado.');
	}

	const hashAtual = String(linhas[0].senha_hash);

	// 2. Compara a senha antiga informada
	const senhaCorreta = await verificarSenha(senhaAtual, hashAtual);
	if (!senhaCorreta) {
		throw new Error('A senha atual informada está incorreta.');
	}

	// 3. Gera novo hash seguro com bcrypt (custo 12)
	const novoHash = await gerarHashSenha(novaSenha);

	// 4. Atualiza a credencial no banco
	await pool.execute(
		`UPDATE Usuario SET senha_hash = ? WHERE id_usuario = ?`,
		[novoHash, idUsuario]
	);
}

