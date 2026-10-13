import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDbPool } from '../db/pool';

export interface AlunoListaItem {
	id_usuario: number;
	nome: string;
	cpf: string;
	email: string;
	data_nascimento: string;
	idade: number;
	menor_idade: boolean;
	matricula: string | null;
	graduacao_atual: string;
	peso: number | null;
	categoria: string | null;
	status_federacao?: string | null;
	grupo_especial_aspirante?: string | null;
	id_professor_responsavel: number;
	nome_professor_responsavel: string;
	nome_responsavel: string | null;
	parentesco_responsavel: string | null;
}

export interface AlunoDetalhado extends AlunoListaItem {
	telefone: string | null;
	n_federacao: string | null;
	status_federacao: string | null;
	data_inicio: string | null;
	data_primeira_graduacao: string | null;
	grupo_especial_aspirante: string | null;
}

export interface InserirAlunoDados {
	nome: string;
	cpf: string;
	dataNascimento: string;
	email: string;
	senhaHash: string;
	telefone: string | null;
	matricula: string | null;
	peso: number | null;
	categoria: string | null;
	nFederacao: string | null;
	statusFederacao: string | null;
	dataInicio: string | null;
	dataPrimeiraGraduacao: string | null;
	graduacaoAtual: string;
	grupoEspecialAspirante: string | null;
	idProfessorResponsavel: number;
}

/**
 * Calcula dinamicamente a idade a partir da data de nascimento ISO (AAAA-MM-DD).
 */
export function calcularIdadeServidor(dataNascimentoIso: string): number {
	const hoje = new Date();
	const nascimento = new Date(dataNascimentoIso);
	let idade = hoje.getFullYear() - nascimento.getFullYear();
	const diferencaMes = hoje.getMonth() - nascimento.getMonth();

	if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < nascimento.getDate())) {
		idade--;
	}
	return Math.max(0, idade);
}

/**
 * Lista todos os alunos do dojo com suporte a busca textual por nome, CPF ou matrícula.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarAlunos(
	idAcademia: number,
	termoBusca?: string
): Promise<AlunoListaItem[]> {
	const pool = getDbPool();

	let sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			a.matricula,
			COALESCE(a.graduacao_atual, 'Branca') AS graduacao_atual,
			a.peso,
			a.categoria,
			a.status_federacao,
			a.grupo_especial_aspirante,
			a.id_professor_responsavel,
			prof_u.nome AS nome_professor_responsavel,
			resp_u.nome AS nome_responsavel,
			r.grau_parentesco AS parentesco_responsavel
		FROM Aluno a
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		INNER JOIN Professor p ON a.id_professor_responsavel = p.id_usuario
		INNER JOIN Usuario prof_u ON p.id_usuario = prof_u.id_usuario
		LEFT JOIN Responsavel_Aluno ra ON a.id_usuario = ra.id_aluno
		LEFT JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		LEFT JOIN Usuario resp_u ON r.id_usuario = resp_u.id_usuario
		WHERE ua.id_academia = ?
	`;

	const params: any[] = [idAcademia];

	if (termoBusca && termoBusca.trim() !== '') {
		const buscaLike = `%${termoBusca.trim()}%`;
		sql += ` AND (u.nome LIKE ? OR u.cpf LIKE ? OR a.matricula LIKE ?)`;
		params.push(buscaLike, buscaLike, buscaLike);
	}

	sql += ` ORDER BY u.nome ASC`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, params);

	return linhas.map((linha) => {
		const dataNasc = String(linha.data_nascimento);
		const idade = calcularIdadeServidor(dataNasc);
		return {
			id_usuario: Number(linha.id_usuario),
			nome: String(linha.nome),
			cpf: String(linha.cpf),
			email: String(linha.email),
			data_nascimento: dataNasc,
			idade,
			menor_idade: idade < 18,
			matricula: linha.matricula ? String(linha.matricula) : null,
			graduacao_atual: String(linha.graduacao_atual),
			peso: linha.peso !== null ? Number(linha.peso) : null,
			categoria: linha.categoria ? String(linha.categoria) : null,
			status_federacao: linha.status_federacao ? String(linha.status_federacao) : null,
			grupo_especial_aspirante: linha.grupo_especial_aspirante
				? String(linha.grupo_especial_aspirante)
				: null,
			id_professor_responsavel: Number(linha.id_professor_responsavel),
			nome_professor_responsavel: String(linha.nome_professor_responsavel),
			nome_responsavel: linha.nome_responsavel ? String(linha.nome_responsavel) : null,
			parentesco_responsavel: linha.parentesco_responsavel
				? String(linha.parentesco_responsavel)
				: null
		};
	});
}

/**
 * Busca os dados completos de um aluno específico, garantindo o tenant ativo.
 */
export async function buscarAlunoPorId(
	idAcademia: number,
	idAluno: number
): Promise<AlunoDetalhado | null> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			u.id_usuario,
			u.nome,
			u.cpf,
			u.email,
			u.telefone,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			a.matricula,
			COALESCE(a.graduacao_atual, 'Branca') AS graduacao_atual,
			a.peso,
			a.categoria,
			a.n_federacao,
			a.status_federacao,
			DATE_FORMAT(a.data_inicio, '%Y-%m-%d') AS data_inicio,
			DATE_FORMAT(a.data_primeira_graduacao, '%Y-%m-%d') AS data_primeira_graduacao,
			a.grupo_especial_aspirante,
			a.id_professor_responsavel,
			prof_u.nome AS nome_professor_responsavel,
			resp_u.nome AS nome_responsavel,
			r.grau_parentesco AS parentesco_responsavel
		FROM Aluno a
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		INNER JOIN Professor p ON a.id_professor_responsavel = p.id_usuario
		INNER JOIN Usuario prof_u ON p.id_usuario = prof_u.id_usuario
		LEFT JOIN Responsavel_Aluno ra ON a.id_usuario = ra.id_aluno
		LEFT JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		LEFT JOIN Usuario resp_u ON r.id_usuario = resp_u.id_usuario
		WHERE a.id_usuario = ? AND ua.id_academia = ?
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAluno, idAcademia]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	const dataNasc = String(linha.data_nascimento);
	const idade = calcularIdadeServidor(dataNasc);

	return {
		id_usuario: Number(linha.id_usuario),
		nome: String(linha.nome),
		cpf: String(linha.cpf),
		email: String(linha.email),
		telefone: linha.telefone ? String(linha.telefone) : null,
		data_nascimento: dataNasc,
		idade,
		menor_idade: idade < 18,
		matricula: linha.matricula ? String(linha.matricula) : null,
		graduacao_atual: String(linha.graduacao_atual),
		peso: linha.peso !== null ? Number(linha.peso) : null,
		categoria: linha.categoria ? String(linha.categoria) : null,
		n_federacao: linha.n_federacao ? String(linha.n_federacao) : null,
		status_federacao: linha.status_federacao ? String(linha.status_federacao) : null,
		data_inicio: linha.data_inicio ? String(linha.data_inicio) : null,
		data_primeira_graduacao: linha.data_primeira_graduacao
			? String(linha.data_primeira_graduacao)
			: null,
		grupo_especial_aspirante: linha.grupo_especial_aspirante
			? String(linha.grupo_especial_aspirante)
			: null,
		id_professor_responsavel: Number(linha.id_professor_responsavel),
		nome_professor_responsavel: String(linha.nome_professor_responsavel),
		nome_responsavel: linha.nome_responsavel ? String(linha.nome_responsavel) : null,
		parentesco_responsavel: linha.parentesco_responsavel
			? String(linha.parentesco_responsavel)
			: null
	};
}

/**
 * Insere as entidades de Aluno dentro de uma transação aberta no MySQL.
 */
export async function inserirAlunoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	dados: InserirAlunoDados
): Promise<number> {
	// 1. Inserir em Usuario
	const [resUsuario] = await conn.execute<ResultSetHeader>(
		`INSERT INTO Usuario (nome, cpf, data_nascimento, email, senha_hash, telefone)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		[
			dados.nome,
			dados.cpf,
			dados.dataNascimento,
			dados.email,
			dados.senhaHash,
			dados.telefone
		]
	);
	const idUsuario = resUsuario.insertId;

	// 2. Vincular à academia (Tenant)
	await conn.execute(
		'INSERT INTO Usuario_Academia (id_usuario, id_academia) VALUES (?, ?)',
		[idUsuario, idAcademia]
	);

	// 3. Vincular papel de Aluno no tenant
	// Obtém o id_perfil para 'Aluno'
	const [perfis] = await conn.execute<RowDataPacket[]>(
		"SELECT id_perfil FROM Perfil WHERE role = 'Aluno' LIMIT 1"
	);
	const idPerfilAluno = perfis.length > 0 ? Number(perfis[0].id_perfil) : 4;

	await conn.execute(
		'INSERT INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)',
		[idUsuario, idAcademia, idPerfilAluno]
	);

	// 4. Inserir em Aluno (vinculado ao professor responsável)
	await conn.execute(
		`INSERT INTO Aluno (
			id_usuario,
			matricula,
			peso,
			categoria,
			n_federacao,
			status_federacao,
			data_inicio,
			data_primeira_graduacao,
			graduacao_atual,
			grupo_especial_aspirante,
			id_professor_responsavel
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			idUsuario,
			dados.matricula,
			dados.peso,
			dados.categoria,
			dados.nFederacao,
			dados.statusFederacao,
			dados.dataInicio || null,
			dados.dataPrimeiraGraduacao || null,
			dados.graduacaoAtual,
			dados.grupoEspecialAspirante || null,
			dados.idProfessorResponsavel
		]
	);

	return idUsuario;
}

/**
 * Atualiza os dados esportivos e técnicos de um Aluno dentro de uma transação.
 * Garante isolamento multi-tenant validando que o aluno pertence ao dojo.
 */
export async function atualizarAlunoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idAluno: number,
	dados: {
		matricula: string | null;
		peso: number | null;
		categoria: string | null;
		nFederacao: string | null;
		statusFederacao: string | null;
		dataInicio: string | null;
		dataPrimeiraGraduacao: string | null;
		graduacaoAtual: string;
		grupoEspecialAspirante: string | null;
		idProfessorResponsavel: number;
	}
): Promise<void> {
	// Garante que o aluno pertence ao dojo (tenant)
	const [alunoTenant] = await conn.execute<RowDataPacket[]>(
		`SELECT a.id_usuario 
		 FROM Aluno a 
		 INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario 
		 WHERE a.id_usuario = ? AND ua.id_academia = ? LIMIT 1`,
		[idAluno, idAcademia]
	);
	if (alunoTenant.length === 0) {
		throw new Error('Judoca não encontrado ou não pertence a esta academia.');
	}

	await conn.execute(
		`UPDATE Aluno
		 SET 
		 	matricula = ?,
		 	peso = ?,
		 	categoria = ?,
		 	n_federacao = ?,
		 	status_federacao = ?,
		 	data_inicio = ?,
		 	data_primeira_graduacao = ?,
		 	graduacao_atual = ?,
		 	grupo_especial_aspirante = ?,
		 	id_professor_responsavel = ?
		 WHERE id_usuario = ?`,
		[
			dados.matricula,
			dados.peso,
			dados.categoria,
			dados.nFederacao,
			dados.statusFederacao,
			dados.dataInicio || null,
			dados.dataPrimeiraGraduacao || null,
			dados.graduacaoAtual,
			dados.grupoEspecialAspirante || null,
			dados.idProfessorResponsavel,
			idAluno
		]
	);
}

