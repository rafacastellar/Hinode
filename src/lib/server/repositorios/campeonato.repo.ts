import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDbPool } from '../db/pool';
import { calcularIdadeServidor } from './aluno.repo';
import type {
	CampeonatoInput,
	ResultadoInput,
	EditarResultadoInput
} from '../validacao/campeonato.schema';

export interface CampeonatoResumo {
	id_evento: number;
	nome: string;
	edicao: string | null;
	data_inicio: string;
	data_inicio_inscricao: string | null;
	data_fim_inscricao: string | null;
	tipo_campeonato: string | null;
	classificacao_academia: string | null;
	limite_graduacao: string | null;
	faixa_inicio: string;
	faixa_fim: string;
	limite_grupo: string | null;
	idade_minima: number | null;
	idade_maxima: number | null;
	valor_inscricao: number;
	cidade: string;
	uf: string;
	total_inscritos: number;
	total_confirmados: number;
	total_medalhas: number;
}

export interface CampeonatoDetalhado {
	id_evento: number;
	nome: string;
	edicao: string | null;
	data_inicio: string;
	data_inicio_iso: string;
	data_inicio_inscricao: string | null;
	data_inicio_inscricao_iso: string | null;
	data_fim_inscricao: string | null;
	data_fim_inscricao_iso: string | null;
	tipo_campeonato: string | null;
	classificacao_academia: string | null;
	limite_graduacao: string | null;
	faixa_inicio: string;
	faixa_fim: string;
	limite_grupo: string | null;
	idade_minima: number | null;
	idade_maxima: number | null;
	valor_inscricao: number;
	logradouro: string;
	numero: string;
	complemento: string | null;
	bairro: string | null;
	cidade: string;
	uf: string;
	cep: string;
}

export interface InscricaoItem {
	id_inscricao: number;
	tipo_participante: 'aluno' | 'professor';
	id_participante: number;
	nome_participante: string;
	faixa_participante: string;
	grupo_participante: string | null;
	data_nascimento: string | null;
	idade: number;
	menor_idade: boolean;
	id_responsavel: number | null;
	ids_responsaveis?: number[];
	nome_responsavel: string | null;
	parentesco_responsavel: string | null;
	confirmado_atleta: boolean;
	confirmado_responsavel: boolean;
	data_confirmacao_atleta: string | null;
	data_confirmacao_responsavel: string | null;
	status_inscricao: 'Pendente' | 'Confirmada' | 'Cancelada';
	valor: number | null;
}

export interface ClassificacaoItem {
	id_classificacao: number;
	id_aluno: number;
	nome_aluno: string;
	faixa_aluno: string;
	classificacao_aluno: string;
	qtd_lutas: number;
	qtd_vitorias: number;
}

/**
 * Lista todos os campeonatos vinculados a esta academia.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarCampeonatosDoDojo(
	idAcademia: number
): Promise<CampeonatoResumo[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			e.id_evento,
			e.nome,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_inicio,
			DATE_FORMAT(c.data_inicio_inscricao, '%d/%m/%Y') AS data_inicio_inscricao,
			DATE_FORMAT(c.data_fim_inscricao, '%d/%m/%Y') AS data_fim_inscricao,
			c.tipo_campeonato,
			c.classificacao_academia,
			c.limite_graduacao,
			COALESCE(c.faixa_inicio, 'Branca') AS faixa_inicio,
			COALESCE(c.faixa_fim, 'Preta') AS faixa_fim,
			c.limite_grupo,
			c.idade_minima,
			c.idade_maxima,
			COALESCE(c.valor_inscricao, 0.00) AS valor_inscricao,
			COALESCE(ee.cidade, 'São Paulo') AS cidade,
			COALESCE(ee.uf, 'SP') AS uf,
			(
				SELECT COUNT(*) 
				FROM Inscricao_Evento ie 
				WHERE ie.id_evento = e.id_evento
			) AS total_inscritos,
			(
				SELECT COUNT(*) 
				FROM Inscricao_Evento ie 
				WHERE ie.id_evento = e.id_evento AND ie.status_inscricao = 'Confirmada'
			) AS total_confirmados,
			(
				SELECT COUNT(*) 
				FROM Classificacao cl 
				WHERE cl.id_campeonato = e.id_evento AND (cl.classificacao_aluno LIKE '%Ouro%' OR cl.classificacao_aluno LIKE '%Prata%' OR cl.classificacao_aluno LIKE '%Bronze%' OR cl.classificacao_aluno LIKE '%Campeão%')
			) AS total_medalhas
		FROM Evento e
		INNER JOIN Campeonato c ON e.id_evento = c.id_evento
		LEFT JOIN Endereco_Evento ee ON e.id_evento = ee.id_evento
		WHERE e.id_academia = ?
		ORDER BY e.data_inicio DESC, e.id_evento DESC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia]);

	return linhas.map((linha) => ({
		id_evento: Number(linha.id_evento),
		nome: String(linha.nome),
		edicao: linha.edicao ? String(linha.edicao) : null,
		data_inicio: String(linha.data_inicio),
		data_inicio_inscricao: linha.data_inicio_inscricao ? String(linha.data_inicio_inscricao) : null,
		data_fim_inscricao: linha.data_fim_inscricao ? String(linha.data_fim_inscricao) : null,
		tipo_campeonato: linha.tipo_campeonato ? String(linha.tipo_campeonato) : null,
		classificacao_academia: linha.classificacao_academia ? String(linha.classificacao_academia) : null,
		limite_graduacao: linha.limite_graduacao ? String(linha.limite_graduacao) : null,
		faixa_inicio: String(linha.faixa_inicio),
		faixa_fim: String(linha.faixa_fim),
		limite_grupo: linha.limite_grupo ? String(linha.limite_grupo) : null,
		idade_minima: linha.idade_minima !== null ? Number(linha.idade_minima) : null,
		idade_maxima: linha.idade_maxima !== null ? Number(linha.idade_maxima) : null,
		valor_inscricao: Number(linha.valor_inscricao || 0),
		cidade: String(linha.cidade),
		uf: String(linha.uf),
		total_inscritos: Number(linha.total_inscritos || 0),
		total_confirmados: Number(linha.total_confirmados || 0),
		total_medalhas: Number(linha.total_medalhas || 0)
	}));
}

/**
 * Busca detalhes completos de um campeonato pertencente à academia.
 */
export async function buscarCampeonatoPorId(
	idAcademia: number,
	idEvento: number
): Promise<CampeonatoDetalhado | null> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			e.id_evento,
			e.nome,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_inicio,
			DATE_FORMAT(e.data_inicio, '%Y-%m-%d') AS data_inicio_iso,
			DATE_FORMAT(c.data_inicio_inscricao, '%d/%m/%Y') AS data_inicio_inscricao,
			DATE_FORMAT(c.data_inicio_inscricao, '%Y-%m-%d') AS data_inicio_inscricao_iso,
			DATE_FORMAT(c.data_fim_inscricao, '%d/%m/%Y') AS data_fim_inscricao,
			DATE_FORMAT(c.data_fim_inscricao, '%Y-%m-%d') AS data_fim_inscricao_iso,
			c.tipo_campeonato,
			c.classificacao_academia,
			c.limite_graduacao,
			COALESCE(c.faixa_inicio, 'Branca') AS faixa_inicio,
			COALESCE(c.faixa_fim, 'Preta') AS faixa_fim,
			c.limite_grupo,
			c.idade_minima,
			c.idade_maxima,
			COALESCE(c.valor_inscricao, 0.00) AS valor_inscricao,
			COALESCE(ee.logradouro, 'Local Principal') AS logradouro,
			COALESCE(ee.numero, 'S/N') AS numero,
			ee.complemento,
			ee.bairro,
			COALESCE(ee.cidade, 'São Paulo') AS cidade,
			COALESCE(ee.uf, 'SP') AS uf,
			COALESCE(ee.cep, '01000-000') AS cep
		FROM Evento e
		INNER JOIN Campeonato c ON e.id_evento = c.id_evento
		LEFT JOIN Endereco_Evento ee ON e.id_evento = ee.id_evento
		WHERE e.id_evento = ? AND e.id_academia = ?
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idEvento, idAcademia]);
	if (linhas.length === 0) return null;

	const linha = linhas[0];
	return {
		id_evento: Number(linha.id_evento),
		nome: String(linha.nome),
		edicao: linha.edicao ? String(linha.edicao) : null,
		data_inicio: String(linha.data_inicio),
		data_inicio_iso: String(linha.data_inicio_iso),
		data_inicio_inscricao: linha.data_inicio_inscricao ? String(linha.data_inicio_inscricao) : null,
		data_inicio_inscricao_iso: linha.data_inicio_inscricao_iso ? String(linha.data_inicio_inscricao_iso) : null,
		data_fim_inscricao: linha.data_fim_inscricao ? String(linha.data_fim_inscricao) : null,
		data_fim_inscricao_iso: linha.data_fim_inscricao_iso ? String(linha.data_fim_inscricao_iso) : null,
		tipo_campeonato: linha.tipo_campeonato ? String(linha.tipo_campeonato) : null,
		classificacao_academia: linha.classificacao_academia ? String(linha.classificacao_academia) : null,
		limite_graduacao: linha.limite_graduacao ? String(linha.limite_graduacao) : null,
		faixa_inicio: String(linha.faixa_inicio),
		faixa_fim: String(linha.faixa_fim),
		limite_grupo: linha.limite_grupo ? String(linha.limite_grupo) : null,
		idade_minima: linha.idade_minima !== null ? Number(linha.idade_minima) : null,
		idade_maxima: linha.idade_maxima !== null ? Number(linha.idade_maxima) : null,
		valor_inscricao: Number(linha.valor_inscricao || 0),
		logradouro: String(linha.logradouro),
		numero: linha.numero ? String(linha.numero) : 'S/N',
		complemento: linha.complemento ? String(linha.complemento) : null,
		bairro: linha.bairro ? String(linha.bairro) : null,
		cidade: String(linha.cidade),
		uf: String(linha.uf),
		cep: String(linha.cep)
	};
}

/**
 * Cria um novo campeonato no banco em transação atômica (Evento + Endereco_Evento + Campeonato).
 */
export async function inserirCampeonatoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	dados: CampeonatoInput
): Promise<number> {
	// 1. Inserir em Evento
	const [resEvento] = await conn.execute<ResultSetHeader>(
		`INSERT INTO Evento (id_academia, nome, edicao, data_inicio)
		 VALUES (?, ?, ?, ?)`,
		[idAcademia, dados.nome, dados.edicao, dados.dataInicio]
	);
	const idEvento = resEvento.insertId;

	// 2. Inserir endereço do evento
	await conn.execute(
		`INSERT INTO Endereco_Evento (id_evento, logradouro, numero, complemento, bairro, cidade, uf, cep)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			idEvento,
			dados.logradouro,
			dados.numero || 'S/N',
			dados.complemento || null,
			dados.bairro || null,
			dados.cidade,
			dados.uf,
			dados.cep
		]
	);

	// 3. Inserir subtipo Campeonato com limites e taxas
	await conn.execute(
		`INSERT INTO Campeonato (
			id_evento,
			tipo_campeonato,
			classificacao_academia,
			limite_graduacao,
			faixa_inicio,
			faixa_fim,
			limite_grupo,
			idade_minima,
			idade_maxima,
			valor_inscricao,
			data_inicio_inscricao,
			data_fim_inscricao
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			idEvento,
			dados.tipoCampeonato,
			dados.classificacaoAcademia || null,
			dados.limiteGraduacao,
			dados.faixaInicio || 'Branca',
			dados.faixaFim || 'Preta',
			dados.limiteGrupo || 'Todos',
			dados.idadeMinima || null,
			dados.idadeMaxima || null,
			dados.valorInscricao || 0,
			dados.dataInicioInscricao || null,
			dados.dataFimInscricao || null
		]
	);

	return idEvento;
}

/**
 * Atualiza um campeonato existente no banco em transação atômica.
 */
export async function atualizarCampeonatoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idEvento: number,
	dados: CampeonatoInput
): Promise<void> {
	// 1. Valida existência no tenant
	const [check] = await conn.execute<RowDataPacket[]>(
		'SELECT id_evento FROM Evento WHERE id_evento = ? AND id_academia = ? LIMIT 1',
		[idEvento, idAcademia]
	);
	if (check.length === 0) {
		throw new Error('Campeonato não encontrado ou não pertence a esta academia.');
	}

	// 2. Atualizar Evento
	await conn.execute(
		`UPDATE Evento 
		 SET nome = ?, edicao = ?, data_inicio = ?
		 WHERE id_evento = ? AND id_academia = ?`,
		[dados.nome, dados.edicao, dados.dataInicio, idEvento, idAcademia]
	);

	// 3. Atualizar Endereco_Evento
	await conn.execute(
		`INSERT INTO Endereco_Evento (id_evento, logradouro, numero, complemento, bairro, cidade, uf, cep)
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
			idEvento,
			dados.logradouro,
			dados.numero || 'S/N',
			dados.complemento || null,
			dados.bairro || null,
			dados.cidade,
			dados.uf,
			dados.cep
		]
	);

	// 4. Atualizar Campeonato
	await conn.execute(
		`UPDATE Campeonato
		 SET tipo_campeonato = ?,
		     classificacao_academia = ?,
		     limite_graduacao = ?,
		     faixa_inicio = ?,
		     faixa_fim = ?,
		     limite_grupo = ?,
		     idade_minima = ?,
		     idade_maxima = ?,
		     valor_inscricao = ?,
		     data_inicio_inscricao = ?,
		     data_fim_inscricao = ?
		 WHERE id_evento = ?`,
		[
			dados.tipoCampeonato,
			dados.classificacaoAcademia || null,
			dados.limiteGraduacao,
			dados.faixaInicio || 'Branca',
			dados.faixaFim || 'Preta',
			dados.limiteGrupo || 'Todos',
			dados.idadeMinima || null,
			dados.idadeMaxima || null,
			dados.valorInscricao || 0,
			dados.dataInicioInscricao || null,
			dados.dataFimInscricao || null,
			idEvento
		]
	);
}

/**
 * Atualiza exclusivamente a classificação geral da academia no campeonato.
 * Garante segurança multi-tenant vinculando Evento.id_academia.
 */
export async function atualizarClassificacaoAcademia(
	idAcademia: number,
	idEvento: number,
	classificacaoAcademia: string | null
): Promise<void> {
	const pool = getDbPool();

	const [res] = await pool.execute<ResultSetHeader>(
		`UPDATE Campeonato c
		 INNER JOIN Evento e ON c.id_evento = e.id_evento
		 SET c.classificacao_academia = ?
		 WHERE c.id_evento = ? AND e.id_academia = ?`,
		[classificacaoAcademia, idEvento, idAcademia]
	);

	if (res.affectedRows === 0) {
		throw new Error('Campeonato não encontrado ou não pertence a esta academia.');
	}
}

/**
 * Exclui um campeonato criado no dojo com remoção em cascata segura.
 */
export async function excluirCampeonato(
	idAcademia: number,
	idEvento: number
): Promise<void> {
	const pool = getDbPool();

	const [check] = await pool.execute<RowDataPacket[]>(
		'SELECT id_evento FROM Evento WHERE id_evento = ? AND id_academia = ? LIMIT 1',
		[idEvento, idAcademia]
	);
	if (check.length === 0) {
		throw new Error('Campeonato não encontrado ou você não tem permissão para excluí-lo.');
	}

	// A FK com ON DELETE CASCADE em Campeonato, Inscricao_Evento, etc. limpa as tabelas filhas
	await pool.execute('DELETE FROM Evento WHERE id_evento = ? AND id_academia = ?', [
		idEvento,
		idAcademia
	]);
}

/**
 * Lista as inscrições detalhadas de um campeonato (atletas e professores),
 * incluindo status de confirmação do atleta e do responsável legal.
 */
export async function listarInscricoesDoCampeonato(
	idAcademia: number,
	idEvento: number
): Promise<InscricaoItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			ie.id_inscricao,
			CASE WHEN ie.id_aluno IS NOT NULL THEN 'aluno' ELSE 'professor' END AS tipo_participante,
			COALESCE(ie.id_aluno, ie.id_professor) AS id_participante,
			u.nome AS nome_participante,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			COALESCE(a.graduacao_atual, p.grau_faixa, 'Faixa Preta') AS faixa_participante,
			a.grupo_especial_aspirante AS grupo_participante,
			COALESCE(ie.confirmado_atleta, 0) AS confirmado_atleta,
			COALESCE(ie.confirmado_responsavel, 0) AS confirmado_responsavel,
			DATE_FORMAT(ie.data_confirmacao_atleta, '%d/%m/%Y %H:%i') AS data_confirmacao_atleta,
			DATE_FORMAT(ie.data_confirmacao_responsavel, '%d/%m/%Y %H:%i') AS data_confirmacao_responsavel,
			ie.status_inscricao,
			ie.valor,
			GROUP_CONCAT(DISTINCT ra.id_responsavel SEPARATOR ',') AS ids_responsaveis,
			GROUP_CONCAT(DISTINCT resp_u.nome ORDER BY resp_u.nome SEPARATOR ', ') AS nomes_responsaveis,
			GROUP_CONCAT(DISTINCT CONCAT(resp_u.nome, ' (', COALESCE(ra.grau_parentesco, r.grau_parentesco, 'Responsável Legal'), ')') ORDER BY resp_u.nome SEPARATOR ', ') AS responsaveis_completos
		FROM Inscricao_Evento ie
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		LEFT JOIN Aluno a ON ie.id_aluno = a.id_usuario
		LEFT JOIN Professor p ON ie.id_professor = p.id_usuario
		INNER JOIN Usuario u ON u.id_usuario = COALESCE(ie.id_aluno, ie.id_professor)
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		LEFT JOIN Responsavel_Aluno ra ON a.id_usuario = ra.id_aluno
		LEFT JOIN Responsavel r ON ra.id_responsavel = r.id_usuario
		LEFT JOIN Usuario resp_u ON ra.id_responsavel = resp_u.id_usuario
		WHERE ie.id_evento = ? AND e.id_academia = ? AND ua.id_academia = ?
		GROUP BY 
			ie.id_inscricao,
			ie.id_aluno,
			ie.id_professor,
			u.nome,
			u.data_nascimento,
			a.graduacao_atual,
			p.grau_faixa,
			a.grupo_especial_aspirante,
			ie.confirmado_atleta,
			ie.confirmado_responsavel,
			ie.data_confirmacao_atleta,
			ie.data_confirmacao_responsavel,
			ie.status_inscricao,
			ie.valor
		ORDER BY 
			CASE WHEN ie.status_inscricao = 'Confirmada' THEN 0 ELSE 1 END,
			u.nome ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idEvento, idAcademia, idAcademia]);

	return linhas.map((linha) => {
		const dataNasc = linha.data_nascimento ? String(linha.data_nascimento) : '2000-01-01';
		const idade = calcularIdadeServidor(dataNasc);
		const menorIdade = linha.tipo_participante === 'aluno' ? idade < 18 : false;

		const idsResponsaveisStr = linha.ids_responsaveis ? String(linha.ids_responsaveis) : '';
		const idsResponsaveis = idsResponsaveisStr
			? idsResponsaveisStr
				.split(',')
				.map((id) => Number(id.trim()))
				.filter((id) => !isNaN(id) && id > 0)
			: [];

		return {
			id_inscricao: Number(linha.id_inscricao),
			tipo_participante: linha.tipo_participante as 'aluno' | 'professor',
			id_participante: Number(linha.id_participante),
			nome_participante: String(linha.nome_participante),
			faixa_participante: String(linha.faixa_participante),
			grupo_participante: linha.grupo_participante ? String(linha.grupo_participante) : null,
			data_nascimento: linha.data_nascimento ? String(linha.data_nascimento) : null,
			idade,
			menor_idade: menorIdade,
			id_responsavel: idsResponsaveis[0] ?? null,
			ids_responsaveis: idsResponsaveis,
			nome_responsavel: linha.responsaveis_completos
				? String(linha.responsaveis_completos)
				: linha.nomes_responsaveis
					? String(linha.nomes_responsaveis)
					: null,
			parentesco_responsavel: null,
			confirmado_atleta: Boolean(linha.confirmado_atleta),
			confirmado_responsavel: Boolean(linha.confirmado_responsavel),
			data_confirmacao_atleta: linha.data_confirmacao_atleta ? String(linha.data_confirmacao_atleta) : null,
			data_confirmacao_responsavel: linha.data_confirmacao_responsavel ? String(linha.data_confirmacao_responsavel) : null,
			status_inscricao: linha.status_inscricao as 'Pendente' | 'Confirmada' | 'Cancelada',
			valor: linha.valor !== null ? Number(linha.valor) : null
		};
	});
}

/**
 * Insere ou atualiza uma inscrição com restrição XOR no banco.
 */
export async function registrarInscricaoEmTransacao(
	conn: PoolConnection,
	dados: {
		idEvento: number;
		idAluno?: number | null;
		idProfessor?: number | null;
		statusInscricao: 'Pendente' | 'Confirmada' | 'Cancelada';
		confirmadoAtleta?: boolean;
		confirmadoResponsavel?: boolean;
		valor: number | null;
	}
): Promise<number> {
	const sql = `
		INSERT INTO Inscricao_Evento (
			id_evento,
			id_aluno,
			id_professor,
			status_inscricao,
			confirmado_atleta,
			confirmado_responsavel,
			valor
		) VALUES (?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			status_inscricao = VALUES(status_inscricao),
			confirmado_atleta = VALUES(confirmado_atleta),
			confirmado_responsavel = VALUES(confirmado_responsavel),
			valor = VALUES(valor)
	`;

	const [res] = await conn.execute<ResultSetHeader>(sql, [
		dados.idEvento,
		dados.idAluno || null,
		dados.idProfessor || null,
		dados.statusInscricao,
		dados.confirmadoAtleta ? 1 : 0,
		dados.confirmadoResponsavel ? 1 : 0,
		dados.valor
	]);

	return res.insertId;
}

/**
 * Confirmação da inscrição pelo Atleta.
 */
export async function confirmarInscricaoAtleta(
	idAcademia: number,
	idInscricao: number
): Promise<{ novoStatus: 'Pendente' | 'Confirmada'; menorIdade: boolean }> {
	const pool = getDbPool();

	const sqlValida = `
		SELECT 
			ie.id_inscricao,
			ie.confirmado_responsavel,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			CASE WHEN ie.id_aluno IS NOT NULL THEN 'aluno' ELSE 'professor' END AS tipo_participante
		FROM Inscricao_Evento ie
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		INNER JOIN Usuario u ON u.id_usuario = COALESCE(ie.id_aluno, ie.id_professor)
		WHERE ie.id_inscricao = ? AND e.id_academia = ?
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sqlValida, [idInscricao, idAcademia]);
	if (linhas.length === 0) {
		throw new Error('Inscrição não encontrada ou não pertence a esta academia.');
	}

	const item = linhas[0];
	const idade = calcularIdadeServidor(String(item.data_nascimento));
	const menorIdade = item.tipo_participante === 'aluno' ? idade < 18 : false;
	const respJaConfirmou = Boolean(item.confirmado_responsavel);

	const novoStatus = (!menorIdade || respJaConfirmou) ? 'Confirmada' : 'Pendente';

	await pool.execute(
		`UPDATE Inscricao_Evento 
		 SET confirmado_atleta = 1,
		     data_confirmacao_atleta = NOW(),
		     status_inscricao = ?
		 WHERE id_inscricao = ?`,
		[novoStatus, idInscricao]
	);

	return { novoStatus, menorIdade };
}

/**
 * Confirmação da inscrição pelo Responsável Legal do Judoca Menor.
 */
export async function confirmarInscricaoResponsavel(
	idAcademia: number,
	idInscricao: number
): Promise<{ novoStatus: 'Pendente' | 'Confirmada' }> {
	const pool = getDbPool();

	const sqlValida = `
		SELECT 
			ie.id_inscricao,
			ie.confirmado_atleta
		FROM Inscricao_Evento ie
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		WHERE ie.id_inscricao = ? AND e.id_academia = ?
		LIMIT 1
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sqlValida, [idInscricao, idAcademia]);
	if (linhas.length === 0) {
		throw new Error('Inscrição não encontrada ou não pertence a esta academia.');
	}

	const item = linhas[0];
	const atletaJaConfirmou = Boolean(item.confirmado_atleta);

	const novoStatus = atletaJaConfirmou ? 'Confirmada' : 'Pendente';

	await pool.execute(
		`UPDATE Inscricao_Evento 
		 SET confirmado_responsavel = 1,
		     data_confirmacao_responsavel = NOW(),
		     status_inscricao = ?
		 WHERE id_inscricao = ?`,
		[novoStatus, idInscricao]
	);

	return { novoStatus };
}

/**
 * Permite ao Professor remover um atleta da lista de participantes ou inscrições do campeonato.
 */
export async function removerInscricaoDoCampeonato(
	idAcademia: number,
	idInscricao: number
): Promise<void> {
	const pool = getDbPool();

	const sqlValida = `
		SELECT ie.id_inscricao 
		FROM Inscricao_Evento ie
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		WHERE ie.id_inscricao = ? AND e.id_academia = ?
		LIMIT 1
	`;

	const [valido] = await pool.execute<RowDataPacket[]>(sqlValida, [idInscricao, idAcademia]);
	if (valido.length === 0) {
		throw new Error('Inscrição não encontrada ou não pertence a esta academia.');
	}

	await pool.execute('DELETE FROM Inscricao_Evento WHERE id_inscricao = ?', [idInscricao]);
}

/**
 * Atualiza o status da inscrição com validação de posse do tenant.
 */
export async function atualizarStatusInscricao(
	idAcademia: number,
	idInscricao: number,
	novoStatus: 'Pendente' | 'Confirmada' | 'Cancelada'
): Promise<void> {
	const pool = getDbPool();

	const sqlValida = `
		SELECT ie.id_inscricao 
		FROM Inscricao_Evento ie
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		WHERE ie.id_inscricao = ? AND e.id_academia = ?
		LIMIT 1
	`;

	const [valido] = await pool.execute<RowDataPacket[]>(sqlValida, [idInscricao, idAcademia]);
	if (valido.length === 0) {
		throw new Error('Inscrição não encontrada ou não pertence a esta academia.');
	}

	await pool.execute(
		'UPDATE Inscricao_Evento SET status_inscricao = ? WHERE id_inscricao = ?',
		[novoStatus, idInscricao]
	);
}

/**
 * Lista a classificação e medalhas obtidas no pós-campeonato.
 */
export async function listarResultadosDoCampeonato(
	idAcademia: number,
	idCampeonato: number
): Promise<ClassificacaoItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			cl.id_classificacao,
			cl.id_aluno,
			u.nome AS nome_aluno,
			COALESCE(a.graduacao_atual, 'Branca') AS faixa_aluno,
			cl.classificacao_aluno,
			cl.qtd_lutas,
			cl.qtd_vitorias
		FROM Classificacao cl
		INNER JOIN Campeonato c ON cl.id_campeonato = c.id_evento
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		INNER JOIN Aluno a ON cl.id_aluno = a.id_usuario
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		WHERE cl.id_campeonato = ? AND e.id_academia = ?
		ORDER BY 
			CASE 
				WHEN cl.classificacao_aluno LIKE '%Ouro%' OR cl.classificacao_aluno LIKE '%1%' THEN 1
				WHEN cl.classificacao_aluno LIKE '%Prata%' OR cl.classificacao_aluno LIKE '%2%' THEN 2
				WHEN cl.classificacao_aluno LIKE '%Bronze%' OR cl.classificacao_aluno LIKE '%3%' THEN 3
				ELSE 4
			END ASC,
			cl.qtd_vitorias DESC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idCampeonato, idAcademia]);

	return linhas.map((linha) => ({
		id_classificacao: Number(linha.id_classificacao),
		id_aluno: Number(linha.id_aluno),
		nome_aluno: String(linha.nome_aluno),
		faixa_aluno: String(linha.faixa_aluno),
		classificacao_aluno: String(linha.classificacao_aluno),
		qtd_lutas: Number(linha.qtd_lutas),
		qtd_vitorias: Number(linha.qtd_vitorias)
	}));
}

/**
 * Registra o desempenho e pódio do atleta em pós-campeonato.
 */
export async function salvarClassificacaoEmTransacao(
	conn: PoolConnection,
	dados: ResultadoInput
): Promise<number> {
	const sql = `
		INSERT INTO Classificacao (
			id_campeonato,
			id_aluno,
			classificacao_aluno,
			qtd_lutas,
			qtd_vitorias
		) VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			classificacao_aluno = VALUES(classificacao_aluno),
			qtd_lutas = VALUES(qtd_lutas),
			qtd_vitorias = VALUES(qtd_vitorias)
	`;

	const [res] = await conn.execute<ResultSetHeader>(sql, [
		dados.idCampeonato,
		dados.idAluno,
		dados.classificacaoAluno,
		dados.qtdLutas,
		dados.qtdVitorias
	]);

	return res.insertId;
}

/**
 * Atualiza o resultado / desempenho de um atleta em um campeonato.
 * Valida a academia através do JOIN com Evento (multi-tenant).
 */
export async function atualizarClassificacao(
	idAcademia: number,
	dados: EditarResultadoInput
): Promise<void> {
	const pool = getDbPool();

	const sql = `
		UPDATE Classificacao cl
		INNER JOIN Campeonato c ON cl.id_campeonato = c.id_evento
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		SET cl.classificacao_aluno = ?,
		    cl.qtd_lutas = ?,
		    cl.qtd_vitorias = ?
		WHERE cl.id_classificacao = ? AND e.id_academia = ?
	`;

	const [res] = await pool.execute<ResultSetHeader>(sql, [
		dados.classificacaoAluno,
		dados.qtdLutas,
		dados.qtdVitorias,
		dados.idClassificacao,
		idAcademia
	]);

	if (res.affectedRows === 0) {
		throw new Error('Resultado não encontrado ou não pertence a esta academia.');
	}
}

/**
 * Remove o resultado / classificação de um atleta em caso de lançamento equivocado.
 * Valida a academia através do JOIN com Evento (multi-tenant).
 */
export async function excluirClassificacao(
	idAcademia: number,
	idClassificacao: number
): Promise<void> {
	const pool = getDbPool();

	const sql = `
		DELETE cl FROM Classificacao cl
		INNER JOIN Campeonato c ON cl.id_campeonato = c.id_evento
		INNER JOIN Evento e ON c.id_evento = e.id_evento
		WHERE cl.id_classificacao = ? AND e.id_academia = ?
	`;

	const [res] = await pool.execute<ResultSetHeader>(sql, [idClassificacao, idAcademia]);

	if (res.affectedRows === 0) {
		throw new Error('Resultado não encontrado ou não pertence a esta academia.');
	}
}
