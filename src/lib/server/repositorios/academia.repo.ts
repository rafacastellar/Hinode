import type { RowDataPacket } from 'mysql2/promise';
import { getDbPool, executarTransacao } from '../db/pool';

export interface EnderecoAcademia {
	logradouro: string;
	numero: string | null;
	complemento: string | null;
	bairro: string | null;
	cidade: string;
	uf: string;
	cep: string;
}

export interface DadosAcademia {
	id_academia: number;
	nome: string;
	nome_fantasia: string | null;
	cnpj: string;
	inscr_est: string | null;
	telefone: string | null;
	endereco: EnderecoAcademia | null;
}

export interface MetricasGestaoDojo {
	totalAlunos: number;
	totalMenores: number;
	totalAdultos: number;
	totalComPeso: number;
	totalProfessores: number;
	totalTurmas: number;
	totalGraduacoesHomologadas: number;
	totalCampeonatos: number;
	totalMedalhas: number;
	taxaTutelaMenores: number;
	totalSessoesAtivas: number;
	totalLogsAuditoria: number;
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

export interface AtualizarDadosAcademiaInput {
	nome: string;
	nome_fantasia?: string | null;
	cnpj: string;
	inscr_est?: string | null;
	telefone?: string | null;
	endereco: {
		cep: string;
		logradouro: string;
		numero?: string | null;
		complemento?: string | null;
		bairro?: string | null;
		cidade: string;
		uf: string;
	};
}

/**
 * Busca os dados cadastrais e endereço da sede da academia do tenant atual.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function buscarDadosAcademia(
	idAcademia: number
): Promise<DadosAcademia | null> {
	const pool = getDbPool();
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT 
			a.id_academia,
			a.nome,
			a.nome_fantasia,
			a.cnpj,
			a.inscr_est,
			a.telefone,
			ea.logradouro,
			ea.numero,
			ea.complemento,
			ea.bairro,
			ea.cidade,
			ea.uf,
			ea.cep
		FROM Academia a
		LEFT JOIN Endereco_Academia ea ON a.id_academia = ea.id_academia
		WHERE a.id_academia = ?
		LIMIT 1`,
		[idAcademia]
	);

	if (rows.length === 0) return null;

	const r = rows[0];
	const endereco: EnderecoAcademia | null = r.logradouro
		? {
				logradouro: String(r.logradouro),
				numero: r.numero ? String(r.numero) : null,
				complemento: r.complemento ? String(r.complemento) : null,
				bairro: r.bairro ? String(r.bairro) : null,
				cidade: String(r.cidade),
				uf: String(r.uf),
				cep: String(r.cep)
		  }
		: null;

	return {
		id_academia: Number(r.id_academia),
		nome: String(r.nome),
		nome_fantasia: r.nome_fantasia ? String(r.nome_fantasia) : null,
		cnpj: String(r.cnpj),
		inscr_est: r.inscr_est ? String(r.inscr_est) : null,
		telefone: r.telefone ? String(r.telefone) : null,
		endereco
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

/**
 * Agrega métricas estratégicas, operacionais e de governança do Dojo para o painel de configurações.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function buscarMetricasGestaoDojo(
	idAcademia: number
): Promise<MetricasGestaoDojo> {
	const pool = getDbPool();

	// 1. Alunos no tenant e particionamento (menores vs adultos, pesados)
	const [resAlunos] = await pool.query<RowDataPacket[]>(
		`SELECT 
			COUNT(DISTINCT a.id_usuario) AS total_alunos,
			COUNT(DISTINCT CASE WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) < 18 THEN a.id_usuario END) AS total_menores,
			COUNT(DISTINCT CASE WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) >= 18 THEN a.id_usuario END) AS total_adultos,
			COUNT(DISTINCT CASE WHEN a.peso IS NOT NULL THEN a.id_usuario END) AS total_com_peso
		 FROM Aluno a
		 INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		 INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		 WHERE ua.id_academia = ?`,
		[idAcademia]
	);
	const rAlunos = resAlunos[0];
	const totalAlunos = Number(rAlunos?.total_alunos || 0);
	const totalMenores = Number(rAlunos?.total_menores || 0);
	const totalAdultos = Number(rAlunos?.total_adultos || 0);
	const totalComPeso = Number(rAlunos?.total_com_peso || 0);

	// 2. Professores credenciados no dojo
	const [resProf] = await pool.query<RowDataPacket[]>(
		`SELECT COUNT(DISTINCT p.id_usuario) AS total
		 FROM Professor p
		 INNER JOIN Usuario_Academia ua ON p.id_usuario = ua.id_usuario
		 WHERE ua.id_academia = ?`,
		[idAcademia]
	);
	const totalProfessores = Number(resProf[0]?.total || 0);

	// 3. Turmas ativas
	const [resTurmas] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) AS total FROM Treino_Turma WHERE id_academia = ?',
		[idAcademia]
	);
	const totalTurmas = Number(resTurmas[0]?.total || 0);

	// 4. Graduações homologadas
	const [resGrad] = await pool.query<RowDataPacket[]>(
		`SELECT COUNT(*) AS total
		 FROM Historico_Graduacao hg
		 INNER JOIN Evento e ON hg.id_evento_graduacao = e.id_evento
		 WHERE e.id_academia = ?`,
		[idAcademia]
	);
	const totalGraduacoesHomologadas = Number(resGrad[0]?.total || 0);

	// 5. Campeonatos e Medalhas
	const [resCamp] = await pool.query<RowDataPacket[]>(
		`SELECT COUNT(DISTINCT c.id_evento) AS total
		 FROM Campeonato c
		 INNER JOIN Evento e ON c.id_evento = e.id_evento
		 WHERE e.id_academia = ?`,
		[idAcademia]
	);
	const totalCampeonatos = Number(resCamp[0]?.total || 0);

	const [resMedalhas] = await pool.query<RowDataPacket[]>(
		`SELECT COUNT(*) AS total
		 FROM Classificacao cl
		 INNER JOIN Evento e ON cl.id_campeonato = e.id_evento
		 WHERE e.id_academia = ? AND (
			cl.classificacao_aluno LIKE '%Ouro%' OR 
			cl.classificacao_aluno LIKE '%Prata%' OR 
			cl.classificacao_aluno LIKE '%Bronze%' OR 
			cl.classificacao_aluno LIKE '%1º%' OR 
			cl.classificacao_aluno LIKE '%2º%' OR 
			cl.classificacao_aluno LIKE '%3º%'
		 )`,
		[idAcademia]
	);
	const totalMedalhas = Number(resMedalhas[0]?.total || 0);

	// 6. Taxa de Tutela dos Menores (% de menores com responsável em Responsavel_Aluno)
	let taxaTutelaMenores = 100;
	if (totalMenores > 0) {
		const [resTutela] = await pool.query<RowDataPacket[]>(
			`SELECT COUNT(DISTINCT a.id_usuario) AS com_tutela
			 FROM Aluno a
			 INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
			 INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
			 INNER JOIN Responsavel_Aluno ra ON a.id_usuario = ra.id_aluno
			 WHERE ua.id_academia = ? AND TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) < 18`,
			[idAcademia]
		);
		const comTutela = Number(resTutela[0]?.com_tutela || 0);
		taxaTutelaMenores = Math.round((comTutela / totalMenores) * 100);
	}

	// 7. Sessões ativas e logs de compliance
	const [resSessoes] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) AS total FROM Sessao WHERE id_academia = ? AND expira_em > NOW()',
		[idAcademia]
	);
	const totalSessoesAtivas = Number(resSessoes[0]?.total || 0);

	const [resLogs] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) AS total FROM Log_Auditoria WHERE id_academia = ?',
		[idAcademia]
	);
	const totalLogsAuditoria = Number(resLogs[0]?.total || 0);

	return {
		totalAlunos,
		totalMenores,
		totalAdultos,
		totalComPeso,
		totalProfessores,
		totalTurmas,
		totalGraduacoesHomologadas,
		totalCampeonatos,
		totalMedalhas,
		taxaTutelaMenores,
		totalSessoesAtivas,
		totalLogsAuditoria
	};
}

/**
 * Atualiza os dados cadastrais da academia e seu endereço de sede de forma atômica (ACID),
 * gravando evento na trilha de auditoria para compliance.
 */
export async function atualizarDadosAcademiaTx(
	idAcademia: number,
	idUsuarioOperador: number,
	dados: AtualizarDadosAcademiaInput,
	ipOperador?: string | null
): Promise<void> {
	await executarTransacao(async (conn) => {
		const cnpjLimpo = dados.cnpj.replace(/\D/g, '');

		// 1. Verifica se CNPJ não colide com outra academia
		const [duplicados] = await conn.execute<RowDataPacket[]>(
			'SELECT id_academia FROM Academia WHERE cnpj = ? AND id_academia != ? LIMIT 1',
			[cnpjLimpo, idAcademia]
		);
		if (duplicados.length > 0) {
			throw new Error('O CNPJ informado já está cadastrado para outra academia no sistema.');
		}

		// 2. Busca estado anterior para o Log de Auditoria
		const [linhasAntes] = await conn.execute<RowDataPacket[]>(
			`SELECT 
				a.nome, a.nome_fantasia, a.cnpj, a.inscr_est, a.telefone,
				ea.logradouro, ea.numero, ea.complemento, ea.bairro, ea.cidade, ea.uf, ea.cep
			 FROM Academia a
			 LEFT JOIN Endereco_Academia ea ON a.id_academia = ea.id_academia
			 WHERE a.id_academia = ?`,
			[idAcademia]
		);
		const dadosAntes = linhasAntes.length > 0 ? linhasAntes[0] : null;

		// 3. Atualiza tabela Academia
		await conn.execute(
			`UPDATE Academia 
			 SET nome = ?, nome_fantasia = ?, cnpj = ?, inscr_est = ?, telefone = ?
			 WHERE id_academia = ?`,
			[
				dados.nome,
				dados.nome_fantasia || null,
				cnpjLimpo,
				dados.inscr_est || null,
				dados.telefone || null,
				idAcademia
			]
		);

		// 4. Upsert em Endereco_Academia
		const cepLimpo = dados.endereco.cep.replace(/\D/g, '');
		await conn.execute(
			`INSERT INTO Endereco_Academia (id_academia, logradouro, numero, complemento, bairro, cidade, uf, cep)
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
				idAcademia,
				dados.endereco.logradouro,
				dados.endereco.numero || null,
				dados.endereco.complemento || null,
				dados.endereco.bairro || null,
				dados.endereco.cidade,
				dados.endereco.uf.toUpperCase(),
				cepLimpo
			]
		);

		// 5. Registra evento imutável em Log_Auditoria
		const dadosDepois = {
			nome: dados.nome,
			nome_fantasia: dados.nome_fantasia || null,
			cnpj: cnpjLimpo,
			inscr_est: dados.inscr_est || null,
			telefone: dados.telefone || null,
			endereco: {
				logradouro: dados.endereco.logradouro,
				numero: dados.endereco.numero || null,
				complemento: dados.endereco.complemento || null,
				bairro: dados.endereco.bairro || null,
				cidade: dados.endereco.cidade,
				uf: dados.endereco.uf.toUpperCase(),
				cep: cepLimpo
			}
		};

		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_antes, dados_depois, ip)
			 VALUES (?, ?, 'ACADEMIA_ATUALIZAR', 'Academia', ?, ?, ?, ?)`,
			[
				idAcademia,
				idUsuarioOperador,
				String(idAcademia),
				dadosAntes ? JSON.stringify(dadosAntes) : null,
				JSON.stringify(dadosDepois),
				ipOperador || null
			]
		);
	});
}

