import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import os from 'node:os';
import process from 'node:process';
import bcrypt from 'bcryptjs';
import { getDbPool, executarTransacao } from '../db/pool';
import { mascararCpf } from './usuario.repo';

export interface TelemetriaServidor {
	uptimeNodeSegundos: number;
	uptimeOsSegundos: number;
	memoriaNodeMb: {
		rss: number;
		heapUsed: number;
		heapTotal: number;
	};
	memoriaOsMb: {
		livre: number;
		total: number;
		percentualUso: number;
	};
	cpuLoadAvg: number[];
	cpusCount: number;
	nodeVersion: string;
	ambiente: string;
}

export interface TelemetriaBanco {
	latenciaPingMs: number;
	tamanhoBancoMb: number;
	tabelasContagem: {
		usuarios: number;
		academias: number;
		sessoesAtivas: number;
		presencasTreino: number;
		logsAuditoria: number;
	};
}

export interface SessaoMonitoradaItem {
	id_sessao: number;
	tipo: 'academia' | 'saas';
	id_usuario: number;
	nome_usuario: string;
	email_usuario: string;
	id_academia: number | null;
	nome_academia: string;
	ip: string | null;
	user_agent: string | null;
	criado_em: string;
	expira_em: string;
	minutos_restantes: number;
}

export interface AcademiaResumoSaas {
	id_academia: number;
	nome: string;
	nome_fantasia: string | null;
	cnpj: string;
	telefone: string | null;
	logo_url: string | null;
	slug: string | null;
	dominio_customizado: string | null;
	ativa: boolean;
	motivo_desativacao: string | null;
	desativada_em: string | null;
	criado_em: string;
	total_usuarios: number;
	total_alunos: number;
	total_professores: number;
	total_turmas: number;
	sessoes_ativas: number;
}

export interface UsuarioGlobalSaas {
	id_usuario: number;
	nome: string;
	tipo_documento: 'CPF' | 'ESTRANGEIRO';
	cpf: string;
	cpf_mascarado: string;
	email: string;
	telefone: string | null;
	is_super_admin: boolean;
	ativo: boolean;
	motivo_bloqueio_global: string | null;
	academias: Array<{
		id_academia: number;
		nome: string;
		ativo_no_dojo: boolean;
		perfis: string[];
	}>;
}

/**
 * Coleta a telemetria do sistema operacional e processo Node.js
 */
export function obterTelemetriaServidor(): TelemetriaServidor {
	const memNode = process.memoryUsage();
	const totalMemOs = os.totalmem();
	const freeMemOs = os.freemem();
	const usedMemOs = totalMemOs - freeMemOs;

	return {
		uptimeNodeSegundos: Math.floor(process.uptime()),
		uptimeOsSegundos: Math.floor(os.uptime()),
		memoriaNodeMb: {
			rss: Math.round(memNode.rss / 1024 / 1024),
			heapUsed: Math.round(memNode.heapUsed / 1024 / 1024),
			heapTotal: Math.round(memNode.heapTotal / 1024 / 1024)
		},
		memoriaOsMb: {
			livre: Math.round(freeMemOs / 1024 / 1024),
			total: Math.round(totalMemOs / 1024 / 1024),
			percentualUso: Math.round((usedMemOs / totalMemOs) * 100)
		},
		cpuLoadAvg: os.loadavg().map((v) => Number(v.toFixed(2))),
		cpusCount: os.cpus().length,
		nodeVersion: process.version,
		ambiente: process.env.NODE_ENV || 'development'
	};
}

/**
 * Coleta telemetria e integridade do banco MySQL
 */
export async function obterTelemetriaBanco(): Promise<TelemetriaBanco> {
	const pool = getDbPool();
	const inicioPing = Date.now();
	await pool.query('SELECT 1');
	const latenciaPingMs = Date.now() - inicioPing;

	const [resTamanho] = await pool.query<RowDataPacket[]>(`
		SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS tamanho_mb
		FROM information_schema.TABLES
		WHERE table_schema = DATABASE()
	`);
	const tamanhoBancoMb = Number(resTamanho[0]?.tamanho_mb || 0);

	const [resContagens] = await pool.query<RowDataPacket[]>(`
		SELECT
			(SELECT COUNT(*) FROM Usuario) AS usuarios,
			(SELECT COUNT(*) FROM Academia) AS academias,
			(SELECT COUNT(*) FROM Sessao WHERE expira_em > NOW() AND revogada_em IS NULL) AS sessoes_ativas,
			(SELECT COUNT(*) FROM Presenca_Treino) AS presencas,
			(SELECT COUNT(*) FROM Log_Auditoria) AS logs
	`);
	const row = resContagens[0] || {};

	return {
		latenciaPingMs,
		tamanhoBancoMb,
		tabelasContagem: {
			usuarios: Number(row.usuarios || 0),
			academias: Number(row.academias || 0),
			sessoesAtivas: Number(row.sessoes_ativas || 0),
			presencasTreino: Number(row.presencas || 0),
			logsAuditoria: Number(row.logs || 0)
		}
	};
}

/**
 * Lista todas as sessões ativas no momento em toda a plataforma (Radar ao Vivo - Academias e SaaS)
 */
export async function listarSessoesAtivasPlataforma(): Promise<SessaoMonitoradaItem[]> {
	const pool = getDbPool();
	
	// 1. Sessões de Academias (Tenant Plane)
	const sqlAcademias = `
		SELECT 
			s.id_sessao,
			'academia' AS tipo,
			s.id_usuario,
			u.nome AS nome_usuario,
			u.email AS email_usuario,
			s.id_academia,
			a.nome AS nome_academia,
			s.ip,
			s.user_agent,
			DATE_FORMAT(s.criado_em, '%d/%m/%Y %H:%i') AS criado_em,
			DATE_FORMAT(s.expira_em, '%d/%m/%Y %H:%i') AS expira_em,
			TIMESTAMPDIFF(MINUTE, NOW(), s.expira_em) AS minutos_restantes
		FROM Sessao s
		INNER JOIN Usuario u ON s.id_usuario = u.id_usuario
		INNER JOIN Academia a ON s.id_academia = a.id_academia
		WHERE s.expira_em > NOW()
		  AND s.revogada_em IS NULL
		ORDER BY s.expira_em ASC
	`;

	// 2. Sessões da Plataforma SaaS (Control Plane - Super Admins)
	const sqlSaas = `
		SELECT 
			ss.id_sessao_saas AS id_sessao,
			'saas' AS tipo,
			ss.id_usuario,
			u.nome AS nome_usuario,
			u.email AS email_usuario,
			NULL AS id_academia,
			'Plataforma SaaS (Control Plane)' AS nome_academia,
			ss.ip,
			ss.user_agent,
			DATE_FORMAT(ss.criado_em, '%d/%m/%Y %H:%i') AS criado_em,
			DATE_FORMAT(ss.expira_em, '%d/%m/%Y %H:%i') AS expira_em,
			TIMESTAMPDIFF(MINUTE, NOW(), ss.expira_em) AS minutos_restantes
		FROM Sessao_Saas ss
		INNER JOIN Usuario u ON ss.id_usuario = u.id_usuario
		WHERE ss.expira_em > NOW()
		  AND ss.revogada_em IS NULL
		ORDER BY ss.expira_em ASC
	`;

	const [[linhasAcademias], [linhasSaas]] = await Promise.all([
		pool.query<RowDataPacket[]>(sqlAcademias),
		pool.query<RowDataPacket[]>(sqlSaas)
	]);

	const mapear = (l: RowDataPacket): SessaoMonitoradaItem => ({
		id_sessao: Number(l.id_sessao),
		tipo: l.tipo === 'saas' ? 'saas' : 'academia',
		id_usuario: Number(l.id_usuario),
		nome_usuario: String(l.nome_usuario),
		email_usuario: String(l.email_usuario),
		id_academia: l.id_academia !== null ? Number(l.id_academia) : null,
		nome_academia: String(l.nome_academia),
		ip: l.ip ? String(l.ip) : null,
		user_agent: l.user_agent ? String(l.user_agent) : null,
		criado_em: String(l.criado_em),
		expira_em: String(l.expira_em),
		minutos_restantes: Math.max(0, Number(l.minutos_restantes || 0))
	});

	return [...linhasSaas.map(mapear), ...linhasAcademias.map(mapear)];
}

/**
 * Encerra imediatamente uma sessão específica do radar (Kick) quer seja de academia ou do SaaS
 */
export async function encerrarSessaoPeloAdminSaas(idSessao: number, tipo: 'academia' | 'saas' = 'academia'): Promise<void> {
	const pool = getDbPool();
	if (tipo === 'saas') {
		await pool.execute(
			`UPDATE Sessao_Saas SET revogada_em = NOW() WHERE id_sessao_saas = ? AND revogada_em IS NULL`,
			[idSessao]
		);
	} else {
		await pool.execute(
			`UPDATE Sessao SET revogada_em = NOW() WHERE id_sessao = ? AND revogada_em IS NULL`,
			[idSessao]
		);
	}
}

/**
 * Lista todas as academias cadastradas com métricas consolidadas
 */
export async function listarAcademiasSaas(): Promise<AcademiaResumoSaas[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			a.id_academia,
			a.nome,
			a.nome_fantasia,
			a.cnpj,
			a.telefone,
			a.logo_url,
			a.slug,
			a.dominio_customizado,
			COALESCE(a.ativa, 1) AS ativa,
			a.motivo_desativacao,
			DATE_FORMAT(a.desativada_em, '%d/%m/%Y %H:%i') AS desativada_em,
			DATE_FORMAT(a.criado_em, '%d/%m/%Y') AS criado_em,
			(SELECT COUNT(*) FROM Usuario_Academia ua WHERE ua.id_academia = a.id_academia) AS total_usuarios,
			(SELECT COUNT(DISTINCT al.id_usuario) FROM Aluno al INNER JOIN Usuario_Academia ua ON al.id_usuario = ua.id_usuario WHERE ua.id_academia = a.id_academia) AS total_alunos,
			(SELECT COUNT(DISTINCT prof.id_usuario) FROM Professor prof INNER JOIN Usuario_Academia ua ON prof.id_usuario = ua.id_usuario WHERE ua.id_academia = a.id_academia) AS total_professores,
			(SELECT COUNT(*) FROM Treino_Turma tt WHERE tt.id_academia = a.id_academia) AS total_turmas,
			(SELECT COUNT(*) FROM Sessao s WHERE s.id_academia = a.id_academia AND s.expira_em > NOW() AND s.revogada_em IS NULL) AS sessoes_ativas
		FROM Academia a
		ORDER BY a.id_academia ASC
	`;

	const [linhas] = await pool.query<RowDataPacket[]>(sql);
	return linhas.map((l) => ({
		id_academia: Number(l.id_academia),
		nome: String(l.nome),
		nome_fantasia: l.nome_fantasia ? String(l.nome_fantasia) : null,
		cnpj: String(l.cnpj),
		telefone: l.telefone ? String(l.telefone) : null,
		logo_url: l.logo_url ? String(l.logo_url) : null,
		slug: l.slug ? String(l.slug) : null,
		dominio_customizado: l.dominio_customizado ? String(l.dominio_customizado) : null,
		ativa: Boolean(l.ativa),
		motivo_desativacao: l.motivo_desativacao ? String(l.motivo_desativacao) : null,
		desativada_em: l.desativada_em ? String(l.desativada_em) : null,
		criado_em: String(l.criado_em),
		total_usuarios: Number(l.total_usuarios || 0),
		total_alunos: Number(l.total_alunos || 0),
		total_professores: Number(l.total_professores || 0),
		total_turmas: Number(l.total_turmas || 0),
		sessoes_ativas: Number(l.sessoes_ativas || 0)
	}));
}

/**
 * Alterna a ativação de uma academia (Tenant Suspension / Reactivation)
 */
export async function alternarAtivacaoAcademia(
	idAcademia: number,
	idSuperAdminOperador: number,
	ativar: boolean,
	motivo?: string | null,
	ipOperador?: string | null
): Promise<void> {
	await executarTransacao(async (conn) => {
		if (ativar) {
			await conn.execute(
				`UPDATE Academia SET ativa = 1, motivo_desativacao = NULL, desativada_em = NULL WHERE id_academia = ?`,
				[idAcademia]
			);
		} else {
			await conn.execute(
				`UPDATE Academia SET ativa = 0, motivo_desativacao = ?, desativada_em = NOW() WHERE id_academia = ?`,
				[motivo?.trim() || 'Academia suspensa pela administração global do SaaS', idAcademia]
			);

			// Kill Switch: Revoga instantaneamente todas as sessões ativas da academia suspensa
			await conn.execute(
				`UPDATE Sessao SET revogada_em = NOW() WHERE id_academia = ? AND revogada_em IS NULL`,
				[idAcademia]
			);
		}

		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois, ip)
			 VALUES (?, ?, ?, 'Academia', ?, ?, ?)`,
			[
				idAcademia,
				idSuperAdminOperador,
				ativar ? 'SAAS_REATIVAR_ACADEMIA' : 'SAAS_SUSPENDER_ACADEMIA',
				String(idAcademia),
				JSON.stringify({ ativa: ativar, motivo: motivo || null }),
				ipOperador || null
			]
		);
	});
}

/**
 * Cria uma nova academia com endereço ViaCEP e seu Administrador inicial em uma única transação ACID
 */
export interface CriarAcademiaComAdminInput {
	academia: {
		nome: string;
		nome_fantasia?: string | null;
		cnpj: string;
		inscr_est?: string | null;
		telefone?: string | null;
		logo_url?: string | null;
		slug?: string | null;
		dominio_customizado?: string | null;
		endereco?: {
			cep: string;
			logradouro: string;
			numero?: string | null;
			complemento?: string | null;
			bairro?: string | null;
			cidade: string;
			uf: string;
		} | null;
	};
	admin: {
		nome: string;
		tipoDocumento: 'CPF' | 'ESTRANGEIRO';
		cpf: string;
		paisOrigem?: string;
		dataNascimento: string;
		genero: 'M' | 'F';
		email: string;
		senha: string;
		telefone?: string | null;
		tambemProfessor?: boolean;
	};
}

export async function atualizarBrandingAcademiaSaas(
	idAcademia: number,
	dados: {
		nome_fantasia?: string | null;
		logo_url?: string | null;
		slug?: string | null;
		dominio_customizado?: string | null;
	},
	idSuperAdminOperador: number,
	ipOperador?: string | null
): Promise<void> {
	await executarTransacao(async (conn) => {
		const slugLimpo = dados.slug
			? dados.slug
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9-]/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '')
			: null;
		const dominioLimpo = dados.dominio_customizado
			? dados.dominio_customizado.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
			: null;

		if (slugLimpo) {
			const [dupSlug] = await conn.execute<RowDataPacket[]>(
				'SELECT id_academia FROM Academia WHERE LOWER(slug) = ? AND id_academia != ? LIMIT 1',
				[slugLimpo, idAcademia]
			);
			if (dupSlug.length > 0) {
				throw new Error('O identificador (slug) informado já está em uso por outra academia.');
			}
		}

		await conn.execute(
			`UPDATE Academia 
			 SET nome_fantasia = COALESCE(?, nome_fantasia),
			     logo_url = ?,
			     slug = ?,
			     dominio_customizado = ?
			 WHERE id_academia = ?`,
			[
				dados.nome_fantasia !== undefined ? (dados.nome_fantasia?.trim() || null) : null,
				dados.logo_url || null,
				slugLimpo,
				dominioLimpo,
				idAcademia
			]
		);

		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois, ip)
			 VALUES (?, ?, 'SAAS_ATUALIZAR_BRANDING_ACADEMIA', 'Academia', ?, ?, ?)`,
			[
				idAcademia,
				idSuperAdminOperador,
				String(idAcademia),
				JSON.stringify({
					slug: slugLimpo,
					dominio_customizado: dominioLimpo,
					possui_logo: Boolean(dados.logo_url)
				}),
				ipOperador || null
			]
		);
	});
}

export async function criarNovaAcademiaComAdminTx(
	dados: CriarAcademiaComAdminInput,
	idSuperAdminOperador: number,
	ipOperador?: string | null
): Promise<{ idAcademia: number; idUsuarioAdmin: number }> {
	const bcrypt = (await import('bcryptjs')).default;

	return await executarTransacao(async (conn) => {
		const cnpjLimpo = dados.academia.cnpj.replace(/\D/g, '');

		// 1. Valida CNPJ único
		const [duplicadosCnpj] = await conn.execute<RowDataPacket[]>(
			'SELECT id_academia FROM Academia WHERE cnpj = ? LIMIT 1',
			[cnpjLimpo]
		);
		if (duplicadosCnpj.length > 0) {
			throw new Error('Já existe uma academia cadastrada com este CNPJ na plataforma.');
		}

		// 2. Insere a Academia
		const slugLimpo = dados.academia.slug
			? dados.academia.slug
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9-]/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '')
			: null;
		const dominioLimpo = dados.academia.dominio_customizado
			? dados.academia.dominio_customizado.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
			: null;

		const [resAcademia] = await conn.execute<ResultSetHeader>(
			`INSERT INTO Academia (nome, nome_fantasia, cnpj, inscr_est, telefone, logo_url, slug, dominio_customizado, ativa)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
			[
				dados.academia.nome.trim(),
				dados.academia.nome_fantasia?.trim() || null,
				cnpjLimpo,
				dados.academia.inscr_est?.trim() || null,
				dados.academia.telefone?.trim() || null,
				dados.academia.logo_url || null,
				slugLimpo,
				dominioLimpo
			]
		);
		const idAcademia = resAcademia.insertId;

		// 3. Insere Endereço da Academia se fornecido
		if (dados.academia.endereco) {
			const end = dados.academia.endereco;
			const cepLimpo = end.cep.replace(/\D/g, '');
			await conn.execute(
				`INSERT INTO Endereco_Academia (id_academia, logradouro, numero, complemento, bairro, cidade, uf, cep)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					idAcademia,
					end.logradouro.trim(),
					end.numero?.trim() || null,
					end.complemento?.trim() || null,
					end.bairro?.trim() || null,
					end.cidade.trim(),
					end.uf.trim().toUpperCase(),
					cepLimpo
				]
			);
		}

		// 4. Cria ou localiza o Usuário Administrador
		const docIdentificador =
			dados.admin.tipoDocumento === 'CPF'
				? dados.admin.cpf.replace(/\D/g, '')
				: dados.admin.cpf.trim().toUpperCase();

		const [userCpf] = await conn.execute<RowDataPacket[]>(
			'SELECT id_usuario, email FROM Usuario WHERE cpf = ? LIMIT 1',
			[docIdentificador]
		);
		const [userEmail] = await conn.execute<RowDataPacket[]>(
			'SELECT id_usuario, cpf FROM Usuario WHERE email = ? LIMIT 1',
			[dados.admin.email.toLowerCase().trim()]
		);

		let idUsuarioAdmin: number;

		if (userCpf.length > 0) {
			if (userCpf[0].email.toLowerCase() !== dados.admin.email.toLowerCase()) {
				throw new Error('O documento informado para o administrador já pertence a outra conta com e-mail diferente.');
			}
			idUsuarioAdmin = Number(userCpf[0].id_usuario);
		} else if (userEmail.length > 0) {
			throw new Error('O e-mail informado para o administrador já está cadastrado na plataforma.');
		} else {
			const senhaHash = await bcrypt.hash(dados.admin.senha, 12);
			const [resUser] = await conn.execute<ResultSetHeader>(
				`INSERT INTO Usuario (nome, tipo_documento, cpf, pais_origem, data_nascimento, genero, email, senha_hash, telefone, ativo)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
				[
					dados.admin.nome.trim(),
					dados.admin.tipoDocumento,
					docIdentificador,
					dados.admin.paisOrigem?.trim() || 'Brasil',
					dados.admin.dataNascimento,
					dados.admin.genero,
					dados.admin.email.toLowerCase().trim(),
					senhaHash,
					dados.admin.telefone?.trim() || null
				]
			);
			idUsuarioAdmin = resUser.insertId;
		}

		// 5. Vincula o Usuário à nova Academia
		await conn.execute(
			`INSERT IGNORE INTO Usuario_Academia (id_usuario, id_academia, ativo) VALUES (?, ?, 1)`,
			[idUsuarioAdmin, idAcademia]
		);

		// 6. Atribui o perfil Admin (e Professor opcional)
		const [perfisBd] = await conn.query<RowDataPacket[]>('SELECT id_perfil, role FROM Perfil');
		const idPerfilAdmin = perfisBd.find((p) => p.role.toLowerCase() === 'admin')?.id_perfil;
		const idPerfilProfessor = perfisBd.find((p) => p.role.toLowerCase() === 'professor')?.id_perfil;

		if (idPerfilAdmin) {
			await conn.execute(
				`INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)`,
				[idUsuarioAdmin, idAcademia, idPerfilAdmin]
			);
		}

		if (dados.admin.tambemProfessor && idPerfilProfessor) {
			await conn.execute(
				`INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)`,
				[idUsuarioAdmin, idAcademia, idPerfilProfessor]
			);
			await conn.execute(
				`INSERT INTO Professor (id_usuario, grau_faixa) VALUES (?, 'Sensei')
				 ON DUPLICATE KEY UPDATE id_usuario = VALUES(id_usuario)`,
				[idUsuarioAdmin]
			);
		}

		// 7. Auditoria Global
		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois, ip)
			 VALUES (?, ?, 'SAAS_CRIAR_ACADEMIA', 'Academia', ?, ?, ?)`,
			[
				idAcademia,
				idSuperAdminOperador,
				String(idAcademia),
				JSON.stringify({
					nome_academia: dados.academia.nome,
					cnpj: cnpjLimpo,
					id_admin: idUsuarioAdmin,
					email_admin: dados.admin.email
				}),
				ipOperador || null
			]
		);

		return { idAcademia, idUsuarioAdmin };
	});
}

/**
 * Lista todos os usuários globalmente para a tela /saas-admin/usuarios
 */
export async function listarUsuariosGlobalSaas(busca?: string): Promise<UsuarioGlobalSaas[]> {
	const pool = getDbPool();
	let sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.tipo_documento,
			u.cpf,
			u.email,
			u.telefone,
			COALESCE(u.is_super_admin, 0) AS is_super_admin,
			COALESCE(u.ativo, 1) AS ativo,
			u.motivo_bloqueio_global
		FROM Usuario u
	`;

	const params: any[] = [];
	if (busca && busca.trim()) {
		const like = `%${busca.trim()}%`;
		sql += ` WHERE (u.nome LIKE ? OR u.email LIKE ? OR u.cpf LIKE ?)`;
		params.push(like, like, like);
	}
	sql += ` ORDER BY u.nome ASC LIMIT 100`;

	const [usuarios] = await pool.query<RowDataPacket[]>(sql, params);
	if (usuarios.length === 0) return [];

	// Busca vínculos de academias e perfis para todos os usuários retornados
	const [vinculos] = await pool.query<RowDataPacket[]>(`
		SELECT 
			ua.id_usuario,
			ua.id_academia,
			a.nome AS nome_academia,
			COALESCE(ua.ativo, 1) AS ativo_no_dojo,
			GROUP_CONCAT(p.role SEPARATOR ', ') AS perfis
		FROM Usuario_Academia ua
		INNER JOIN Academia a ON ua.id_academia = a.id_academia
		LEFT JOIN Usuario_Academia_Perfil uap ON uap.id_usuario = ua.id_usuario AND uap.id_academia = ua.id_academia
		LEFT JOIN Perfil p ON p.id_perfil = uap.id_perfil
		GROUP BY ua.id_usuario, ua.id_academia, a.nome, ua.ativo
		ORDER BY a.nome ASC
	`);

	const mapaVinculos = new Map<number, Array<{ id_academia: number; nome: string; ativo_no_dojo: boolean; perfis: string[] }>>();
	for (const v of vinculos) {
		const idUser = Number(v.id_usuario);
		if (!mapaVinculos.has(idUser)) {
			mapaVinculos.set(idUser, []);
		}
		mapaVinculos.get(idUser)!.push({
			id_academia: Number(v.id_academia),
			nome: String(v.nome_academia),
			ativo_no_dojo: Boolean(v.ativo_no_dojo),
			perfis: v.perfis ? String(v.perfis).split(', ') : []
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
			email: String(u.email),
			telefone: u.telefone ? String(u.telefone) : null,
			is_super_admin: Boolean(u.is_super_admin),
			ativo: Boolean(u.ativo),
			motivo_bloqueio_global: u.motivo_bloqueio_global ? String(u.motivo_bloqueio_global) : null,
			academias: mapaVinculos.get(idUser) || []
		};
	});
}

/**
 * Alterna o bloqueio global de um usuário na plataforma SaaS
 */
export async function alternarBloqueioGlobalUsuario(
	idUsuario: number,
	idSuperAdminOperador: number,
	bloquear: boolean,
	motivo?: string | null,
	ipOperador?: string | null
): Promise<void> {
	if (idUsuario === idSuperAdminOperador && bloquear) {
		throw new Error('Operação bloqueada: Você não pode desativar seu próprio acesso de Super Admin.');
	}

	await executarTransacao(async (conn) => {
		if (bloquear) {
			await conn.execute(
				`UPDATE Usuario 
				 SET ativo = 0, motivo_bloqueio_global = ?, bloqueado_global_em = NOW() 
				 WHERE id_usuario = ?`,
				[motivo?.trim() || 'Acesso suspenso globalmente pelo administrador do SaaS', idUsuario]
			);

			// Revoga todas as sessões em todas as academias e no SaaS
			await conn.execute(
				`UPDATE Sessao SET revogada_em = NOW() WHERE id_usuario = ? AND revogada_em IS NULL`,
				[idUsuario]
			);
			await conn.execute(
				`UPDATE Sessao_Saas SET revogada_em = NOW() WHERE id_usuario = ? AND revogada_em IS NULL`,
				[idUsuario]
			);
		} else {
			await conn.execute(
				`UPDATE Usuario 
				 SET ativo = 1, motivo_bloqueio_global = NULL, bloqueado_global_em = NULL 
				 WHERE id_usuario = ?`,
				[idUsuario]
			);
		}

		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois, ip)
			 VALUES (NULL, ?, ?, 'Usuario', ?, ?, ?)`,
			[
				idSuperAdminOperador,
				bloquear ? 'SAAS_BLOQUEAR_USUARIO_GLOBAL' : 'SAAS_REATIVAR_USUARIO_GLOBAL',
				String(idUsuario),
				JSON.stringify({ ativo: !bloquear, motivo: motivo || null }),
				ipOperador || null
			]
		);
	});
}

export interface PerfilOpcao {
	id_perfil: number;
	role: string;
}

export interface UsuarioDetalheSaas {
	id_usuario: number;
	nome: string;
	tipo_documento: 'CPF' | 'ESTRANGEIRO';
	cpf: string;
	pais_origem: string;
	data_nascimento: string;
	genero: 'M' | 'F';
	email: string;
	telefone: string | null;
	is_super_admin: boolean;
	ativo: boolean;
	motivo_bloqueio_global: string | null;
	bloqueado_global_em: string | null;
	vinculos: Array<{
		id_academia: number;
		nome_academia: string;
		ativo: boolean;
		ids_perfis: number[];
		perfis: string[];
	}>;
}

/**
 * Retorna todos os perfis cadastrados no sistema
 */
export async function listarPerfisSaas(): Promise<PerfilOpcao[]> {
	const pool = getDbPool();
	const [perfis] = await pool.query<RowDataPacket[]>('SELECT id_perfil, role FROM Perfil ORDER BY id_perfil ASC');
	return perfis.map((p) => ({
		id_perfil: Number(p.id_perfil),
		role: String(p.role)
	}));
}

/**
 * Busca detalhes completos de um usuário para a página de edição do SaaS Admin
 */
export async function obterUsuarioParaEdicaoSaas(idUsuario: number): Promise<UsuarioDetalheSaas | null> {
	const pool = getDbPool();
	const [linhasUser] = await pool.execute<RowDataPacket[]>(
		`SELECT 
			id_usuario, nome, tipo_documento, cpf, pais_origem, 
			DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
			genero, email, telefone, is_super_admin, ativo,
			motivo_bloqueio_global,
			DATE_FORMAT(bloqueado_global_em, '%d/%m/%Y %H:%i') AS bloqueado_global_em
		 FROM Usuario
		 WHERE id_usuario = ? LIMIT 1`,
		[idUsuario]
	);

	if (linhasUser.length === 0) return null;
	const u = linhasUser[0];

	// Busca vínculos de academias e perfis associados
	const [linhasVinculos] = await pool.execute<RowDataPacket[]>(
		`SELECT 
			ua.id_academia,
			a.nome AS nome_academia,
			COALESCE(ua.ativo, 1) AS ativo,
			GROUP_CONCAT(p.id_perfil) AS ids_perfis,
			GROUP_CONCAT(p.role SEPARATOR ', ') AS perfis
		 FROM Usuario_Academia ua
		 INNER JOIN Academia a ON ua.id_academia = a.id_academia
		 LEFT JOIN Usuario_Academia_Perfil uap ON uap.id_usuario = ua.id_usuario AND uap.id_academia = ua.id_academia
		 LEFT JOIN Perfil p ON p.id_perfil = uap.id_perfil
		 WHERE ua.id_usuario = ?
		 GROUP BY ua.id_academia, a.nome, ua.ativo
		 ORDER BY a.nome ASC`,
		[idUsuario]
	);

	const vinculos = linhasVinculos.map((v) => ({
		id_academia: Number(v.id_academia),
		nome_academia: String(v.nome_academia),
		ativo: Boolean(v.ativo),
		ids_perfis: v.ids_perfis ? String(v.ids_perfis).split(',').map((id) => Number(id)) : [],
		perfis: v.perfis ? String(v.perfis).split(', ') : []
	}));

	return {
		id_usuario: Number(u.id_usuario),
		nome: String(u.nome),
		tipo_documento: (u.tipo_documento as 'CPF' | 'ESTRANGEIRO') || 'CPF',
		cpf: String(u.cpf),
		pais_origem: String(u.pais_origem || 'Brasil'),
		data_nascimento: String(u.data_nascimento),
		genero: (u.genero as 'M' | 'F') || 'M',
		email: String(u.email),
		telefone: u.telefone ? String(u.telefone) : null,
		is_super_admin: Boolean(u.is_super_admin),
		ativo: Boolean(u.ativo),
		motivo_bloqueio_global: u.motivo_bloqueio_global ? String(u.motivo_bloqueio_global) : null,
		bloqueado_global_em: u.bloqueado_global_em ? String(u.bloqueado_global_em) : null,
		vinculos
	};
}

export interface CriarUsuarioSaasDTO {
	nome: string;
	tipoDocumento: 'CPF' | 'ESTRANGEIRO';
	cpf: string;
	paisOrigem?: string;
	dataNascimento: string;
	genero: 'M' | 'F';
	email: string;
	senha: string;
	telefone?: string | null;
	isSuperAdmin: boolean;
	idAcademia?: number | null;
	idsPerfis?: number[];
}

/**
 * Cria um novo usuário pelo Backoffice SaaS com opção de Super Admin e/ou vinculação à academia
 */
export async function criarUsuarioSaas(
	dados: CriarUsuarioSaasDTO,
	idSuperAdminOperador: number,
	ipOperador?: string | null
): Promise<number> {
	return await executarTransacao(async (conn) => {
		const docIdentificador =
			dados.tipoDocumento === 'CPF'
				? dados.cpf.replace(/\D/g, '')
				: dados.cpf.trim().toUpperCase();

		// Valida unicidade
		const [userDoc] = await conn.execute<RowDataPacket[]>(
			'SELECT id_usuario FROM Usuario WHERE cpf = ? LIMIT 1',
			[docIdentificador]
		);
		if (userDoc.length > 0) {
			throw new Error('Já existe um usuário cadastrado com este Documento / CPF.');
		}

		const [userEmail] = await conn.execute<RowDataPacket[]>(
			'SELECT id_usuario FROM Usuario WHERE email = ? LIMIT 1',
			[dados.email.toLowerCase().trim()]
		);
		if (userEmail.length > 0) {
			throw new Error('Já existe um usuário cadastrado com este E-mail.');
		}

		const senhaHash = await bcrypt.hash(dados.senha, 12);

		const [resUser] = await conn.execute<ResultSetHeader>(
			`INSERT INTO Usuario (
				nome, tipo_documento, cpf, pais_origem, data_nascimento,
				genero, email, senha_hash, telefone, is_super_admin, ativo
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
			[
				dados.nome.trim(),
				dados.tipoDocumento,
				docIdentificador,
				dados.paisOrigem?.trim() || 'Brasil',
				dados.dataNascimento,
				dados.genero,
				dados.email.toLowerCase().trim(),
				senhaHash,
				dados.telefone?.trim() || null,
				dados.isSuperAdmin ? 1 : 0
			]
		);

		const idNovoUsuario = resUser.insertId;

		// Vinculação com academia inicial se fornecida
		if (dados.idAcademia) {
			await conn.execute(
				`INSERT INTO Usuario_Academia (id_usuario, id_academia, ativo) VALUES (?, ?, 1)`,
				[idNovoUsuario, dados.idAcademia]
			);

			const [perfisBd] = await conn.query<RowDataPacket[]>('SELECT id_perfil, role FROM Perfil');
			const idPerfilAluno = perfisBd.find((p) => p.role.toLowerCase() === 'aluno')?.id_perfil;
			const idPerfilProfessor = perfisBd.find((p) => p.role.toLowerCase() === 'professor')?.id_perfil;
			const idPerfilResponsavel = perfisBd.find((p) => p.role.toLowerCase() === 'responsável' || p.role.toLowerCase() === 'responsavel')?.id_perfil;

			const perfisEfetivos =
				dados.idsPerfis && dados.idsPerfis.length > 0
					? dados.idsPerfis
					: idPerfilAluno
					  ? [Number(idPerfilAluno)]
					  : [];

			for (const idPerfil of perfisEfetivos) {
				await conn.execute(
					`INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)`,
					[idNovoUsuario, dados.idAcademia, idPerfil]
				);
			}

			if (idPerfilProfessor && perfisEfetivos.includes(Number(idPerfilProfessor))) {
				await conn.execute(
					`INSERT INTO Professor (id_usuario, grau_faixa) VALUES (?, 'Sensei')
					 ON DUPLICATE KEY UPDATE id_usuario = VALUES(id_usuario)`,
					[idNovoUsuario]
				);
			}

			if (idPerfilResponsavel && perfisEfetivos.includes(Number(idPerfilResponsavel))) {
				await conn.execute(
					`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
					 VALUES (?, 'Responsável Legal', 0)
					 ON DUPLICATE KEY UPDATE id_usuario = VALUES(id_usuario)`,
					[idNovoUsuario]
				);
			}
		}

		// Auditoria
		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois, ip)
			 VALUES (?, ?, 'SAAS_CRIAR_USUARIO', 'Usuario', ?, ?, ?)`,
			[
				dados.idAcademia || null,
				idSuperAdminOperador,
				String(idNovoUsuario),
				JSON.stringify({
					nome: dados.nome,
					email: dados.email,
					is_super_admin: dados.isSuperAdmin,
					id_academia: dados.idAcademia || null,
					ids_perfis: dados.idsPerfis || []
				}),
				ipOperador || null
			]
		);

		return idNovoUsuario;
	});
}

export interface AtualizarUsuarioSaasDTO {
	nome: string;
	tipoDocumento: 'CPF' | 'ESTRANGEIRO';
	cpf: string;
	paisOrigem?: string;
	dataNascimento: string;
	genero: 'M' | 'F';
	email: string;
	telefone?: string | null;
	novaSenha?: string | null;
	isSuperAdmin: boolean;
	ativo: boolean;
	motivoBloqueio?: string | null;
	vinculosAcademias?: Array<{
		idAcademia: number;
		ativo: boolean;
		idsPerfis: number[];
	}>;
}

/**
 * Atualiza todos os dados de um usuário pelo Backoffice SaaS
 */
export async function atualizarUsuarioSaas(
	idUsuario: number,
	dados: AtualizarUsuarioSaasDTO,
	idSuperAdminOperador: number,
	ipOperador?: string | null
): Promise<void> {
	await executarTransacao(async (conn) => {
		// Proteção contra auto-desativação ou remoção do próprio status de Super Admin
		if (idUsuario === idSuperAdminOperador) {
			if (!dados.isSuperAdmin) {
				throw new Error('Você não pode remover seu próprio privilégio de Super Admin.');
			}
			if (!dados.ativo) {
				throw new Error('Você não pode desativar seu próprio usuário.');
			}
		}

		const docIdentificador =
			dados.tipoDocumento === 'CPF'
				? dados.cpf.replace(/\D/g, '')
				: dados.cpf.trim().toUpperCase();

		// Valida se o documento ou email já estão sendo usados por outro usuário
		const [userDoc] = await conn.execute<RowDataPacket[]>(
			'SELECT id_usuario FROM Usuario WHERE cpf = ? AND id_usuario != ? LIMIT 1',
			[docIdentificador, idUsuario]
		);
		if (userDoc.length > 0) {
			throw new Error('Outro usuário já utiliza este Documento / CPF.');
		}

		const [userEmail] = await conn.execute<RowDataPacket[]>(
			'SELECT id_usuario FROM Usuario WHERE email = ? AND id_usuario != ? LIMIT 1',
			[dados.email.toLowerCase().trim(), idUsuario]
		);
		if (userEmail.length > 0) {
			throw new Error('Outro usuário já utiliza este E-mail.');
		}

		// Atualiza dados cadastrais
		await conn.execute(
			`UPDATE Usuario SET
				nome = ?,
				tipo_documento = ?,
				cpf = ?,
				pais_origem = ?,
				data_nascimento = ?,
				genero = ?,
				email = ?,
				telefone = ?,
				is_super_admin = ?,
				ativo = ?,
				motivo_bloqueio_global = ?,
				bloqueado_global_em = CASE WHEN ? = 0 THEN COALESCE(bloqueado_global_em, NOW()) ELSE NULL END
			 WHERE id_usuario = ?`,
			[
				dados.nome.trim(),
				dados.tipoDocumento,
				docIdentificador,
				dados.paisOrigem?.trim() || 'Brasil',
				dados.dataNascimento,
				dados.genero,
				dados.email.toLowerCase().trim(),
				dados.telefone?.trim() || null,
				dados.isSuperAdmin ? 1 : 0,
				dados.ativo ? 1 : 0,
				dados.ativo ? null : (dados.motivoBloqueio?.trim() || 'Suspenso pelo Super Admin'),
				dados.ativo ? 1 : 0,
				idUsuario
			]
		);

		// Se fornecida nova senha, atualiza o hash
		if (dados.novaSenha && dados.novaSenha.trim()) {
			const novaSenhaHash = await bcrypt.hash(dados.novaSenha.trim(), 12);
			await conn.execute('UPDATE Usuario SET senha_hash = ? WHERE id_usuario = ?', [
				novaSenhaHash,
				idUsuario
			]);
		}

		// Se o usuário foi inativado, derruba todas as sessões
		if (!dados.ativo) {
			await conn.execute(
				`UPDATE Sessao SET revogada_em = NOW() WHERE id_usuario = ? AND revogada_em IS NULL`,
				[idUsuario]
			);
			await conn.execute(
				`UPDATE Sessao_Saas SET revogada_em = NOW() WHERE id_usuario = ? AND revogada_em IS NULL`,
				[idUsuario]
			);
		}

		// Atualiza vínculos de academias se especificado
		if (dados.vinculosAcademias) {
			for (const v of dados.vinculosAcademias) {
				await conn.execute(
					`INSERT INTO Usuario_Academia (id_usuario, id_academia, ativo) VALUES (?, ?, ?)
					 ON DUPLICATE KEY UPDATE ativo = ?`,
					[idUsuario, v.idAcademia, v.ativo ? 1 : 0, v.ativo ? 1 : 0]
				);

				// Limpa perfis antigos e reinsere os selecionados
				await conn.execute(
					`DELETE FROM Usuario_Academia_Perfil WHERE id_usuario = ? AND id_academia = ?`,
					[idUsuario, v.idAcademia]
				);

				for (const idPerfil of v.idsPerfis) {
					await conn.execute(
						`INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)`,
						[idUsuario, v.idAcademia, idPerfil]
					);
				}
			}
		}

		// Log de auditoria
		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois, ip)
			 VALUES (NULL, ?, 'SAAS_ATUALIZAR_USUARIO', 'Usuario', ?, ?, ?)`,
			[
				idSuperAdminOperador,
				String(idUsuario),
				JSON.stringify({
					nome: dados.nome,
					email: dados.email,
					is_super_admin: dados.isSuperAdmin,
					ativo: dados.ativo,
					senha_alterada: Boolean(dados.novaSenha && dados.novaSenha.trim())
				}),
				ipOperador || null
			]
		);
	});
}

/**
 * Designa um usuário existente como Administrador de uma academia específica
 */
export async function designarAdminAcademiaSaas(
	idUsuario: number,
	idAcademia: number,
	idSuperAdminOperador: number,
	ipOperador?: string | null
): Promise<void> {
	await executarTransacao(async (conn) => {
		const [perfisBd] = await conn.query<RowDataPacket[]>('SELECT id_perfil, role FROM Perfil');
		const idPerfilAdmin = perfisBd.find((p) => p.role.toLowerCase() === 'admin')?.id_perfil;

		if (!idPerfilAdmin) {
			throw new Error('Perfil Admin não localizado no sistema.');
		}

		await conn.execute(
			`INSERT INTO Usuario_Academia (id_usuario, id_academia, ativo) VALUES (?, ?, 1)
			 ON DUPLICATE KEY UPDATE ativo = 1, motivo_bloqueio = NULL, bloqueado_em = NULL`,
			[idUsuario, idAcademia]
		);

		await conn.execute(
			`INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)`,
			[idUsuario, idAcademia, idPerfilAdmin]
		);

		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois, ip)
			 VALUES (?, ?, 'SAAS_DESIGNAR_ADMIN_ACADEMIA', 'Usuario', ?, ?, ?)`,
			[
				idAcademia,
				idSuperAdminOperador,
				String(idUsuario),
				JSON.stringify({ id_usuario: idUsuario, id_academia: idAcademia, perfil: 'Admin' }),
				ipOperador || null
			]
		);
	});
}


