import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDbPool } from '../db/pool';
import type { EventoGraduacaoInput, HomologacaoEventoInput } from '../validacao/graduacao.schema';
import { validarElegibilidadeGraduacao } from '../servicos/regras-graduacao';

export interface GraduacaoFeedItem {
	id_historico: number;
	id_aluno: number;
	nome_aluno: string;
	matricula_aluno: string | null;
	faixa: string;
	data_graduacao: string;
	associacao: string | null;
	nome_professor_homologador: string;
	grau_faixa_professor: string | null;
	nome_evento: string;
}

export interface DistribuicaoFaixaItem {
	faixa: string;
	total: number;
}

export interface HistoricoAlunoItem {
	id_historico: number;
	faixa: string;
	data_graduacao: string;
	associacao: string | null;
	nome_professor_homologador: string;
	grau_faixa_professor: string | null;
	nome_evento: string;
}

export interface EventoGraduacaoResumo {
	id_evento: number;
	nome: string;
	edicao: string | null;
	data_inicio: string;
	data_inicio_iso: string;
	data_inicio_inscricao: string | null;
	data_fim_inscricao: string | null;
	tipo_graduacao: string | null;
	status: string | null;
	faixa_inicio: string;
	faixa_fim: string;
	tempo_minimo_judo_meses: number;
	tempo_minimo_ultima_graduacao_meses: number;
	taxa_graduacao: number;
	requisitos: string | null;
	cidade: string;
	uf: string;
	total_inscritos: number;
	total_homologados: number;
}

export interface EventoGraduacaoDetalhado {
	id_evento: number;
	nome: string;
	edicao: string | null;
	data_inicio: string;
	data_inicio_iso: string;
	data_inicio_inscricao: string | null;
	data_inicio_inscricao_iso: string | null;
	data_fim_inscricao: string | null;
	data_fim_inscricao_iso: string | null;
	tipo_graduacao: string | null;
	status: string | null;
	faixa_inicio: string;
	faixa_fim: string;
	tempo_minimo_judo_meses: number;
	tempo_minimo_ultima_graduacao_meses: number;
	taxa_graduacao: number;
	requisitos: string | null;
	logradouro: string;
	numero: string;
	complemento: string | null;
	bairro: string | null;
	cidade: string;
	uf: string;
	cep: string;
}

export interface CandidatoGraduacaoItem {
	id_aluno: number;
	nome_aluno: string;
	matricula_aluno: string | null;
	faixa_atual: string;
	data_inicio_judo: string | null;
	data_inicio_judo_br: string | null;
	data_ultima_graduacao: string | null;
	data_ultima_graduacao_br: string | null;
	meses_judo: number;
	meses_ultima_graduacao: number;
	elegivel: boolean;
	motivo_inaptidao: string | null;
	proxima_faixa_sugerida: string;
	inscrito: boolean;
	id_inscricao: number | null;
	status_inscricao: string | null;
	homologado: boolean;
	data_graduacao_evento: string | null;
	faixa_graduacao_evento: string | null;
}

export interface InscritoGraduacaoItem {
	id_inscricao: number;
	id_aluno: number;
	nome_aluno: string;
	matricula_aluno: string | null;
	faixa_atual: string;
	status_inscricao: 'Pendente' | 'Confirmada' | 'Cancelada';
	valor: number;
	homologado: boolean;
	id_historico: number | null;
	nova_faixa_homologada: string | null;
	data_graduacao: string | null;
	nome_professor_homologador: string | null;
}

/**
 * Lista todos os eventos de graduação agendados ou realizados para o dojo.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarEventosGraduacaoDoDojo(
	idAcademia: number
): Promise<EventoGraduacaoResumo[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			e.id_evento,
			e.nome,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_inicio,
			DATE_FORMAT(e.data_inicio, '%Y-%m-%d') AS data_inicio_iso,
			DATE_FORMAT(ge.data_inicio_inscricao, '%d/%m/%Y') AS data_inicio_inscricao,
			DATE_FORMAT(ge.data_fim_inscricao, '%d/%m/%Y') AS data_fim_inscricao,
			ge.tipo_graduacao,
			ge.status,
			COALESCE(ge.faixa_inicio, 'Branca') AS faixa_inicio,
			COALESCE(ge.faixa_fim, 'Marrom') AS faixa_fim,
			COALESCE(ge.tempo_minimo_judo_meses, 0) AS tempo_minimo_judo_meses,
			COALESCE(ge.tempo_minimo_ultima_graduacao_meses, 0) AS tempo_minimo_ultima_graduacao_meses,
			COALESCE(ge.taxa_graduacao, 0.00) AS taxa_graduacao,
			ge.requisitos,
			COALESCE(ee.cidade, 'São Paulo') AS cidade,
			COALESCE(ee.uf, 'SP') AS uf,
			(
				SELECT COUNT(*) 
				FROM Inscricao_Evento ie 
				WHERE ie.id_evento = e.id_evento
			) AS total_inscritos,
			(
				SELECT COUNT(*) 
				FROM Historico_Graduacao hg 
				WHERE hg.id_evento_graduacao = e.id_evento
			) AS total_homologados
		FROM Evento e
		INNER JOIN Graduacao_Evento ge ON e.id_evento = ge.id_evento
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
		data_inicio_iso: String(linha.data_inicio_iso),
		data_inicio_inscricao: linha.data_inicio_inscricao ? String(linha.data_inicio_inscricao) : null,
		data_fim_inscricao: linha.data_fim_inscricao ? String(linha.data_fim_inscricao) : null,
		tipo_graduacao: linha.tipo_graduacao ? String(linha.tipo_graduacao) : null,
		status: linha.status ? String(linha.status) : 'Agendado',
		faixa_inicio: String(linha.faixa_inicio),
		faixa_fim: String(linha.faixa_fim),
		tempo_minimo_judo_meses: Number(linha.tempo_minimo_judo_meses || 0),
		tempo_minimo_ultima_graduacao_meses: Number(linha.tempo_minimo_ultima_graduacao_meses || 0),
		taxa_graduacao: Number(linha.taxa_graduacao || 0),
		requisitos: linha.requisitos ? String(linha.requisitos) : null,
		cidade: String(linha.cidade),
		uf: String(linha.uf),
		total_inscritos: Number(linha.total_inscritos || 0),
		total_homologados: Number(linha.total_homologados || 0)
	}));
}

/**
 * Busca os detalhes completos de um evento de graduação por ID e valida tenant.
 */
export async function buscarEventoGraduacaoPorId(
	idAcademia: number,
	idEvento: number
): Promise<EventoGraduacaoDetalhado | null> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			e.id_evento,
			e.nome,
			e.edicao,
			DATE_FORMAT(e.data_inicio, '%d/%m/%Y') AS data_inicio,
			DATE_FORMAT(e.data_inicio, '%Y-%m-%d') AS data_inicio_iso,
			DATE_FORMAT(ge.data_inicio_inscricao, '%d/%m/%Y') AS data_inicio_inscricao,
			DATE_FORMAT(ge.data_inicio_inscricao, '%Y-%m-%d') AS data_inicio_inscricao_iso,
			DATE_FORMAT(ge.data_fim_inscricao, '%d/%m/%Y') AS data_fim_inscricao,
			DATE_FORMAT(ge.data_fim_inscricao, '%Y-%m-%d') AS data_fim_inscricao_iso,
			ge.tipo_graduacao,
			ge.status,
			COALESCE(ge.faixa_inicio, 'Branca') AS faixa_inicio,
			COALESCE(ge.faixa_fim, 'Marrom') AS faixa_fim,
			COALESCE(ge.tempo_minimo_judo_meses, 0) AS tempo_minimo_judo_meses,
			COALESCE(ge.tempo_minimo_ultima_graduacao_meses, 0) AS tempo_minimo_ultima_graduacao_meses,
			COALESCE(ge.taxa_graduacao, 0.00) AS taxa_graduacao,
			ge.requisitos,
			COALESCE(ee.logradouro, 'Dojo Central') AS logradouro,
			COALESCE(ee.numero, 'S/N') AS numero,
			ee.complemento,
			ee.bairro,
			COALESCE(ee.cidade, 'São Paulo') AS cidade,
			COALESCE(ee.uf, 'SP') AS uf,
			COALESCE(ee.cep, '01000-000') AS cep
		FROM Evento e
		INNER JOIN Graduacao_Evento ge ON e.id_evento = ge.id_evento
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
		tipo_graduacao: linha.tipo_graduacao ? String(linha.tipo_graduacao) : null,
		status: linha.status ? String(linha.status) : 'Agendado',
		faixa_inicio: String(linha.faixa_inicio),
		faixa_fim: String(linha.faixa_fim),
		tempo_minimo_judo_meses: Number(linha.tempo_minimo_judo_meses || 0),
		tempo_minimo_ultima_graduacao_meses: Number(linha.tempo_minimo_ultima_graduacao_meses || 0),
		taxa_graduacao: Number(linha.taxa_graduacao || 0),
		requisitos: linha.requisitos ? String(linha.requisitos) : null,
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
 * Cria um novo evento de graduação em transação atômica (Evento + Endereco_Evento + Graduacao_Evento).
 */
export async function inserirEventoGraduacaoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	dados: EventoGraduacaoInput
): Promise<number> {
	// 1. Inserir em Evento
	const [resEvento] = await conn.execute<ResultSetHeader>(
		`INSERT INTO Evento (id_academia, nome, edicao, data_inicio)
		 VALUES (?, ?, ?, ?)`,
		[idAcademia, dados.nome, dados.edicao || 'Edição 2026', dados.dataInicio]
	);
	const idEvento = resEvento.insertId;

	// 2. Inserir endereço do evento
	await conn.execute(
		`INSERT INTO Endereco_Evento (id_evento, logradouro, numero, complemento, bairro, cidade, uf, cep)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			idEvento,
			dados.logradouro || 'Dojo Central',
			dados.numero || 'S/N',
			dados.complemento || null,
			dados.bairro || null,
			dados.cidade,
			dados.uf,
			dados.cep || '01000-000'
		]
	);

	// 3. Inserir subtipo Graduacao_Evento
	await conn.execute(
		`INSERT INTO Graduacao_Evento (
			id_evento,
			tipo_graduacao,
			status,
			faixa_inicio,
			faixa_fim,
			tempo_minimo_judo_meses,
			tempo_minimo_ultima_graduacao_meses,
			taxa_graduacao,
			data_inicio_inscricao,
			data_fim_inscricao,
			requisitos
		) VALUES (?, ?, 'Agendado', ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			idEvento,
			dados.tipoGraduacao || 'Troca de Faixa',
			dados.faixaInicio || 'Branca',
			dados.faixaFim || 'Marrom',
			dados.tempoMinimoJudoMeses || 0,
			dados.tempoMinimoUltimaGraduacaoMeses || 0,
			dados.taxaGraduacao || 0,
			dados.dataInicioInscricao || null,
			dados.dataFimInscricao || null,
			dados.requisitos || null
		]
	);

	return idEvento;
}

/**
 * Atualiza um evento de graduação existente no banco em transação atômica.
 */
export async function atualizarEventoGraduacaoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idEvento: number,
	dados: EventoGraduacaoInput
): Promise<void> {
	// 1. Valida existência no tenant
	const [check] = await conn.execute<RowDataPacket[]>(
		'SELECT id_evento FROM Evento WHERE id_evento = ? AND id_academia = ? LIMIT 1',
		[idEvento, idAcademia]
	);
	if (check.length === 0) {
		throw new Error('Evento de graduação não encontrado ou não pertence a esta academia.');
	}

	// 2. Atualizar Evento
	await conn.execute(
		`UPDATE Evento 
		 SET nome = ?, edicao = ?, data_inicio = ?
		 WHERE id_evento = ? AND id_academia = ?`,
		[dados.nome, dados.edicao || 'Edição 2026', dados.dataInicio, idEvento, idAcademia]
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
			dados.logradouro || 'Dojo Central',
			dados.numero || 'S/N',
			dados.complemento || null,
			dados.bairro || null,
			dados.cidade,
			dados.uf,
			dados.cep || '01000-000'
		]
	);

	// 4. Atualizar Graduacao_Evento
	await conn.execute(
		`UPDATE Graduacao_Evento
		 SET tipo_graduacao = ?,
		     faixa_inicio = ?,
		     faixa_fim = ?,
		     tempo_minimo_judo_meses = ?,
		     tempo_minimo_ultima_graduacao_meses = ?,
		     taxa_graduacao = ?,
		     data_inicio_inscricao = ?,
		     data_fim_inscricao = ?,
		     requisitos = ?
		 WHERE id_evento = ?`,
		[
			dados.tipoGraduacao || 'Troca de Faixa',
			dados.faixaInicio || 'Branca',
			dados.faixaFim || 'Marrom',
			dados.tempoMinimoJudoMeses || 0,
			dados.tempoMinimoUltimaGraduacaoMeses || 0,
			dados.taxaGraduacao || 0,
			dados.dataInicioInscricao || null,
			dados.dataFimInscricao || null,
			dados.requisitos || null,
			idEvento
		]
	);
}

/**
 * Exclusão definitiva de um evento de graduação com integridade referencial.
 */
export async function excluirEventoGraduacao(
	idAcademia: number,
	idEvento: number
): Promise<void> {
	const pool = getDbPool();

	// 1. Valida existência no tenant
	const [check] = await pool.execute<RowDataPacket[]>(
		'SELECT id_evento FROM Evento WHERE id_evento = ? AND id_academia = ? LIMIT 1',
		[idEvento, idAcademia]
	);
	if (check.length === 0) {
		throw new Error('Evento de graduação não encontrado.');
	}

	// 2. Verifica se já existem registros imutáveis em Historico_Graduacao vinculados a este evento
	const [histCheck] = await pool.execute<RowDataPacket[]>(
		'SELECT id_historico FROM Historico_Graduacao WHERE id_evento_graduacao = ? LIMIT 1',
		[idEvento]
	);
	if (histCheck.length > 0) {
		throw new Error(
			'Não é permitido excluir uma cerimônia que já possui graduações homologadas no histórico oficial.'
		);
	}

	// 3. Exclui em Evento (cascata apagará Endereco_Evento, Graduacao_Evento e Inscricao_Evento)
	await pool.execute('DELETE FROM Evento WHERE id_evento = ? AND id_academia = ?', [
		idEvento,
		idAcademia
	]);
}

/**
 * Consulta todos os judocas do dojo e avalia a elegibilidade pedagógica para o evento especificado.
 */
export async function listarCandidatosDoDojoComElegibilidade(
	idAcademia: number,
	idEvento: number
): Promise<CandidatoGraduacaoItem[]> {
	const pool = getDbPool();

	const evento = await buscarEventoGraduacaoPorId(idAcademia, idEvento);
	if (!evento) {
		throw new Error('Evento de graduação não encontrado nesta academia.');
	}

	const sql = `
		SELECT 
			a.id_usuario AS id_aluno,
			u.nome AS nome_aluno,
			a.matricula AS matricula_aluno,
			COALESCE(NULLIF(a.graduacao_atual, ''), 'Branca') AS faixa_atual,
			DATE_FORMAT(a.data_inicio, '%Y-%m-%d') AS data_inicio_judo_iso,
			DATE_FORMAT(a.data_inicio, '%d/%m/%Y') AS data_inicio_judo_br,
			DATE_FORMAT(a.data_primeira_graduacao, '%Y-%m-%d') AS data_primeira_graduacao_iso,
			(
				SELECT DATE_FORMAT(MAX(hg.data_graduacao), '%Y-%m-%d')
				FROM Historico_Graduacao hg
				WHERE hg.id_aluno = a.id_usuario
			) AS data_ultima_graduacao_iso,
			(
				SELECT DATE_FORMAT(MAX(hg.data_graduacao), '%d/%m/%Y')
				FROM Historico_Graduacao hg
				WHERE hg.id_aluno = a.id_usuario
			) AS data_ultima_graduacao_br,
			ie.id_inscricao,
			ie.status_inscricao,
			(
				SELECT hg2.id_historico
				FROM Historico_Graduacao hg2
				WHERE hg2.id_evento_graduacao = ? AND hg2.id_aluno = a.id_usuario
				LIMIT 1
			) AS id_historico_evento,
			(
				SELECT hg2.faixa
				FROM Historico_Graduacao hg2
				WHERE hg2.id_evento_graduacao = ? AND hg2.id_aluno = a.id_usuario
				LIMIT 1
			) AS faixa_homologada_evento,
			(
				SELECT DATE_FORMAT(hg2.data_graduacao, '%d/%m/%Y')
				FROM Historico_Graduacao hg2
				WHERE hg2.id_evento_graduacao = ? AND hg2.id_aluno = a.id_usuario
				LIMIT 1
			) AS data_homologacao_evento
		FROM Aluno a
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		LEFT JOIN Inscricao_Evento ie ON ie.id_evento = ? AND ie.id_aluno = a.id_usuario
		WHERE ua.id_academia = ?
		ORDER BY u.nome ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [
		idEvento,
		idEvento,
		idEvento,
		idEvento,
		idAcademia
	]);

	return linhas.map((linha) => {
		const faixaAtual = String(linha.faixa_atual);
		const dataInicioIso = linha.data_inicio_judo_iso ? String(linha.data_inicio_judo_iso) : null;
		const dataUltimaGradIso = linha.data_ultima_graduacao_iso ? String(linha.data_ultima_graduacao_iso) : null;
		const dataPrimeiraGradIso = linha.data_primeira_graduacao_iso ? String(linha.data_primeira_graduacao_iso) : null;

		const resElegibilidade = validarElegibilidadeGraduacao({
			faixaAtleta: faixaAtual,
			faixaInicioEvento: evento.faixa_inicio,
			faixaFimEvento: evento.faixa_fim,
			dataInicioJudoAtleta: dataInicioIso,
			dataUltimaGraduacaoAtleta: dataUltimaGradIso,
			dataPrimeiraGraduacaoAtleta: dataPrimeiraGradIso,
			tempoMinimoJudoMeses: evento.tempo_minimo_judo_meses,
			tempoMinimoUltimaGraduacaoMeses: evento.tempo_minimo_ultima_graduacao_meses,
			dataEventoIso: evento.data_inicio_iso
		});

		return {
			id_aluno: Number(linha.id_aluno),
			nome_aluno: String(linha.nome_aluno),
			matricula_aluno: linha.matricula_aluno ? String(linha.matricula_aluno) : null,
			faixa_atual: faixaAtual,
			data_inicio_judo: dataInicioIso,
			data_inicio_judo_br: linha.data_inicio_judo_br ? String(linha.data_inicio_judo_br) : null,
			data_ultima_graduacao: dataUltimaGradIso,
			data_ultima_graduacao_br: linha.data_ultima_graduacao_br ? String(linha.data_ultima_graduacao_br) : null,
			meses_judo: resElegibilidade.mesesJudo,
			meses_ultima_graduacao: resElegibilidade.mesesUltimaGraduacao,
			elegivel: resElegibilidade.elegivel,
			motivo_inaptidao: resElegibilidade.motivo || null,
			proxima_faixa_sugerida: resElegibilidade.proximaFaixa,
			inscrito: Boolean(linha.id_inscricao),
			id_inscricao: linha.id_inscricao ? Number(linha.id_inscricao) : null,
			status_inscricao: linha.status_inscricao ? String(linha.status_inscricao) : null,
			homologado: Boolean(linha.id_historico_evento),
			data_graduacao_evento: linha.data_homologacao_evento ? String(linha.data_homologacao_evento) : null,
			faixa_graduacao_evento: linha.faixa_homologada_evento ? String(linha.faixa_homologada_evento) : null
		};
	});
}

/**
 * Lista todos os judocas inscritos no exame de graduação com status de homologação.
 */
export async function listarInscricoesDoEventoGraduacao(
	idAcademia: number,
	idEvento: number
): Promise<InscritoGraduacaoItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			ie.id_inscricao,
			ie.id_aluno,
			u.nome AS nome_aluno,
			a.matricula AS matricula_aluno,
			COALESCE(NULLIF(a.graduacao_atual, ''), 'Branca') AS faixa_atual,
			ie.status_inscricao,
			COALESCE(ie.valor, 0.00) AS valor,
			hg.id_historico,
			hg.faixa AS nova_faixa_homologada,
			DATE_FORMAT(hg.data_graduacao, '%d/%m/%Y') AS data_graduacao,
			u_prof.nome AS nome_professor_homologador
		FROM Inscricao_Evento ie
		INNER JOIN Aluno a ON ie.id_aluno = a.id_usuario
		INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		INNER JOIN Evento e ON ie.id_evento = e.id_evento
		LEFT JOIN Historico_Graduacao hg ON hg.id_evento_graduacao = ie.id_evento AND hg.id_aluno = ie.id_aluno
		LEFT JOIN Professor p ON hg.id_professor_homologador = p.id_usuario
		LEFT JOIN Usuario u_prof ON p.id_usuario = u_prof.id_usuario
		WHERE ie.id_evento = ? AND e.id_academia = ? AND ua.id_academia = ?
		ORDER BY hg.id_historico IS NOT NULL, u.nome ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idEvento, idAcademia, idAcademia]);

	return linhas.map((linha) => ({
		id_inscricao: Number(linha.id_inscricao),
		id_aluno: Number(linha.id_aluno),
		nome_aluno: String(linha.nome_aluno),
		matricula_aluno: linha.matricula_aluno ? String(linha.matricula_aluno) : null,
		faixa_atual: String(linha.faixa_atual),
		status_inscricao: (linha.status_inscricao || 'Pendente') as 'Pendente' | 'Confirmada' | 'Cancelada',
		valor: Number(linha.valor || 0),
		homologado: Boolean(linha.id_historico),
		id_historico: linha.id_historico ? Number(linha.id_historico) : null,
		nova_faixa_homologada: linha.nova_faixa_homologada ? String(linha.nova_faixa_homologada) : null,
		data_graduacao: linha.data_graduacao ? String(linha.data_graduacao) : null,
		nome_professor_homologador: linha.nome_professor_homologador ? String(linha.nome_professor_homologador) : null
	}));
}

/**
 * Inscreve um atleta no evento de graduação em transação atômica.
 */
export async function inscreverAlunoNoEventoEmTransacao(
	conn: PoolConnection,
	dados: { idEvento: number; idAluno: number; valor: number }
): Promise<number> {
	const [existente] = await conn.execute<RowDataPacket[]>(
		'SELECT id_inscricao FROM Inscricao_Evento WHERE id_evento = ? AND id_aluno = ? LIMIT 1',
		[dados.idEvento, dados.idAluno]
	);

	if (existente.length > 0) {
		return Number(existente[0].id_inscricao);
	}

	const [res] = await conn.execute<ResultSetHeader>(
		`INSERT INTO Inscricao_Evento (id_evento, id_aluno, status_inscricao, confirmado_atleta, valor)
		 VALUES (?, ?, 'Pendente', 1, ?)`,
		[dados.idEvento, dados.idAluno, dados.valor || 0.00]
	);

	return res.insertId;
}

/**
 * Cancela a inscrição de um judoca no evento de graduação se o exame ainda não tiver sido homologado.
 */
export async function cancelarInscricaoDoEvento(
	idAcademia: number,
	idEvento: number,
	idAluno: number
): Promise<void> {
	const pool = getDbPool();

	// Verifica se já foi homologado
	const [homologado] = await pool.execute<RowDataPacket[]>(
		'SELECT id_historico FROM Historico_Graduacao WHERE id_evento_graduacao = ? AND id_aluno = ? LIMIT 1',
		[idEvento, idAluno]
	);

	if (homologado.length > 0) {
		throw new Error('Não é possível cancelar inscrição de judoca com exame já homologado.');
	}

	await pool.execute(
		'DELETE FROM Inscricao_Evento WHERE id_evento = ? AND id_aluno = ?',
		[idEvento, idAluno]
	);
}

/**
 * Homologa atomicamente a promoção de faixa de um candidato dentro de um evento de graduação.
 */
export async function homologarAprovacaoNoEventoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	idUsuarioExecutor: number,
	dados: HomologacaoEventoInput
): Promise<{ idHistorico: number }> {
	// 1. Valida se o aluno pertence à academia
	const [alunoRows] = await conn.execute<RowDataPacket[]>(
		`SELECT a.id_usuario, a.graduacao_atual 
		 FROM Aluno a
		 INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		 WHERE a.id_usuario = ? AND ua.id_academia = ? LIMIT 1`,
		[dados.idAluno, idAcademia]
	);
	if (alunoRows.length === 0) {
		throw new Error('Judoca não encontrado nesta academia.');
	}
	const faixaAnterior = alunoRows[0].graduacao_atual || 'Branca';

	// 2. Valida se o evento pertence à academia
	const [eventoRows] = await conn.execute<RowDataPacket[]>(
		`SELECT e.id_evento, e.nome, DATE_FORMAT(e.data_inicio, '%Y-%m-%d') as data_inicio 
		 FROM Evento e
		 INNER JOIN Graduacao_Evento ge ON e.id_evento = ge.id_evento
		 WHERE e.id_evento = ? AND e.id_academia = ? LIMIT 1`,
		[dados.idEvento, idAcademia]
	);
	if (eventoRows.length === 0) {
		throw new Error('Evento de graduação não encontrado nesta academia.');
	}

	// 3. Valida se o professor pertence à academia
	const [profRows] = await conn.execute<RowDataPacket[]>(
		`SELECT p.id_usuario 
		 FROM Professor p
		 INNER JOIN Usuario_Academia ua ON p.id_usuario = ua.id_usuario
		 WHERE p.id_usuario = ? AND ua.id_academia = ? LIMIT 1`,
		[dados.idProfessorHomologador, idAcademia]
	);
	if (profRows.length === 0) {
		throw new Error('Sensei homologador não pertence a este dojo.');
	}

	// 4. Verificar se já foi homologado neste mesmo evento
	const [jaHomologado] = await conn.execute<RowDataPacket[]>(
		`SELECT id_historico FROM Historico_Graduacao 
		 WHERE id_evento_graduacao = ? AND id_aluno = ? LIMIT 1`,
		[dados.idEvento, dados.idAluno]
	);
	if (jaHomologado.length > 0) {
		throw new Error('Este judoca já possui graduação homologada nesta cerimônia.');
	}

	// 5. Inserir em Historico_Graduacao (insert-only)
	const idHistorico = await inserirHistoricoGraduacaoEmTransacao(conn, {
		idEventoGraduacao: dados.idEvento,
		idAluno: dados.idAluno,
		idProfessorHomologador: dados.idProfessorHomologador,
		dataGraduacao: dados.dataGraduacao || eventoRows[0].data_inicio,
		associacao: dados.associacao || 'FPJ / Federação Paulista de Judô',
		faixa: dados.novaFaixa
	});

	// 6. Atualizar Aluno.graduacao_atual
	await atualizarFaixaAlunoEmTransacao(conn, dados.idAluno, dados.novaFaixa);

	// 7. Se existe inscrição, atualizar status_inscricao = 'Confirmada'
	// Se não existe inscrição, criar registro de inscrição confirmado
	const [inscricaoExistente] = await conn.execute<RowDataPacket[]>(
		'SELECT id_inscricao FROM Inscricao_Evento WHERE id_evento = ? AND id_aluno = ? LIMIT 1',
		[dados.idEvento, dados.idAluno]
	);
	if (inscricaoExistente.length > 0) {
		await conn.execute(
			`UPDATE Inscricao_Evento 
			 SET status_inscricao = 'Confirmada', confirmado_atleta = 1 
			 WHERE id_inscricao = ?`,
			[inscricaoExistente[0].id_inscricao]
		);
	} else {
		await conn.execute(
			`INSERT INTO Inscricao_Evento (id_evento, id_aluno, status_inscricao, confirmado_atleta, valor)
			 VALUES (?, ?, 'Confirmada', 1, 0.00)`,
			[dados.idEvento, dados.idAluno]
		);
	}

	// 8. Trilha de auditoria LGPD
	await registrarLogAuditoriaEmTransacao(conn, {
		idAcademia,
		idUsuario: idUsuarioExecutor,
		acao: 'HOMOLOGAR_GRADUACAO_EVENTO',
		entidade: 'Historico_Graduacao',
		idEntidade: String(idHistorico),
		dadosAntes: {
			faixa_anterior: faixaAnterior
		},
		dadosDepois: {
			id_evento: dados.idEvento,
			id_aluno: dados.idAluno,
			nova_faixa: dados.novaFaixa,
			id_professor_homologador: dados.idProfessorHomologador,
			data_graduacao: dados.dataGraduacao,
			id_historico: idHistorico
		}
	});

	return { idHistorico };
}

/**
 * Lista as últimas homologações de troca de faixa realizadas na academia.
 * SEGURANÇA MULTI-TENANT: idAcademia é o primeiro parâmetro obrigatório.
 */
export async function listarGraduacoesDoDojo(
	idAcademia: number,
	limite = 20
): Promise<GraduacaoFeedItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			hg.id_historico,
			hg.id_aluno,
			u_aluno.nome AS nome_aluno,
			a.matricula AS matricula_aluno,
			hg.faixa,
			DATE_FORMAT(hg.data_graduacao, '%d/%m/%Y') AS data_graduacao,
			hg.associacao,
			u_prof.nome AS nome_professor_homologador,
			p.grau_faixa AS grau_faixa_professor,
			e.nome AS nome_evento
		FROM Historico_Graduacao hg
		INNER JOIN Aluno a ON hg.id_aluno = a.id_usuario
		INNER JOIN Usuario u_aluno ON a.id_usuario = u_aluno.id_usuario
		INNER JOIN Usuario_Academia ua ON u_aluno.id_usuario = ua.id_usuario
		INNER JOIN Professor p ON hg.id_professor_homologador = p.id_usuario
		INNER JOIN Usuario u_prof ON p.id_usuario = u_prof.id_usuario
		INNER JOIN Graduacao_Evento ge ON hg.id_evento_graduacao = ge.id_evento
		INNER JOIN Evento e ON ge.id_evento = e.id_evento
		WHERE ua.id_academia = ? AND e.id_academia = ?
		ORDER BY hg.data_graduacao DESC, hg.id_historico DESC
		LIMIT ?
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia, idAcademia, limite]);

	return linhas.map((linha) => ({
		id_historico: Number(linha.id_historico),
		id_aluno: Number(linha.id_aluno),
		nome_aluno: String(linha.nome_aluno),
		matricula_aluno: linha.matricula_aluno ? String(linha.matricula_aluno) : null,
		faixa: String(linha.faixa),
		data_graduacao: String(linha.data_graduacao),
		associacao: linha.associacao ? String(linha.associacao) : null,
		nome_professor_homologador: String(linha.nome_professor_homologador),
		grau_faixa_professor: linha.grau_faixa_professor ? String(linha.grau_faixa_professor) : null,
		nome_evento: String(linha.nome_evento)
	}));
}

/**
 * Consulta a distribuição quantitativa de judocas por faixa no dojo.
 */
export async function obterDistribuicaoFaixasDoDojo(
	idAcademia: number
): Promise<DistribuicaoFaixaItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			COALESCE(NULLIF(a.graduacao_atual, ''), 'Branca') AS faixa,
			COUNT(DISTINCT a.id_usuario) AS total
		FROM Aluno a
		INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario
		WHERE ua.id_academia = ?
		GROUP BY COALESCE(NULLIF(a.graduacao_atual, ''), 'Branca')
		ORDER BY total DESC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia]);

	return linhas.map((linha) => ({
		faixa: String(linha.faixa),
		total: Number(linha.total)
	}));
}

/**
 * Busca a trilha cronológica imutável completa de graduações de um aluno específico.
 */
export async function buscarHistoricoDoAluno(
	idAcademia: number,
	idAluno: number
): Promise<HistoricoAlunoItem[]> {
	const pool = getDbPool();

	const sql = `
		SELECT 
			hg.id_historico,
			hg.faixa,
			DATE_FORMAT(hg.data_graduacao, '%d/%m/%Y') AS data_graduacao,
			hg.associacao,
			u_prof.nome AS nome_professor_homologador,
			p.grau_faixa AS grau_faixa_professor,
			e.nome AS nome_evento
		FROM Historico_Graduacao hg
		INNER JOIN Usuario_Academia ua ON hg.id_aluno = ua.id_usuario
		INNER JOIN Professor p ON hg.id_professor_homologador = p.id_usuario
		INNER JOIN Usuario u_prof ON p.id_usuario = u_prof.id_usuario
		INNER JOIN Graduacao_Evento ge ON hg.id_evento_graduacao = ge.id_evento
		INNER JOIN Evento e ON ge.id_evento = e.id_evento
		WHERE hg.id_aluno = ? AND ua.id_academia = ?
		ORDER BY hg.data_graduacao ASC, hg.id_historico ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAluno, idAcademia]);

	return linhas.map((linha) => ({
		id_historico: Number(linha.id_historico),
		faixa: String(linha.faixa),
		data_graduacao: String(linha.data_graduacao),
		associacao: linha.associacao ? String(linha.associacao) : null,
		nome_professor_homologador: String(linha.nome_professor_homologador),
		grau_faixa_professor: linha.grau_faixa_professor ? String(linha.grau_faixa_professor) : null,
		nome_evento: String(linha.nome_evento)
	}));
}

/**
 * Obtém ou cria o evento de graduação para a cerimônia informada dentro de uma transação.
 */
export async function obterOuCriarEventoGraduacaoEmTransacao(
	conn: PoolConnection,
	idAcademia: number,
	nomeEvento: string,
	dataEvento: string
): Promise<number> {
	const sqlBusca = `
		SELECT e.id_evento 
		FROM Evento e
		INNER JOIN Graduacao_Evento ge ON e.id_evento = ge.id_evento
		WHERE e.id_academia = ? AND e.nome = ? AND e.data_inicio = ?
		LIMIT 1
	`;
	const [existente] = await conn.execute<RowDataPacket[]>(sqlBusca, [
		idAcademia,
		nomeEvento,
		dataEvento
	]);

	if (existente.length > 0) {
		return Number(existente[0].id_evento);
	}

	const [resEvento] = await conn.execute<ResultSetHeader>(
		`INSERT INTO Evento (id_academia, nome, edicao, data_inicio)
		 VALUES (?, ?, 'Oficial', ?)`,
		[idAcademia, nomeEvento, dataEvento]
	);
	const idEvento = resEvento.insertId;

	await conn.execute(
		`INSERT INTO Graduacao_Evento (id_evento, tipo_graduacao, status, requisitos)
		 VALUES (?, 'Troca de Faixa', 'Concluído', 'Avaliação técnica e pedagógica no dojo')`,
		[idEvento]
	);

	return idEvento;
}

/**
 * Atualiza atomicamente a faixa atual do aluno em Aluno.
 */
export async function atualizarFaixaAlunoEmTransacao(
	conn: PoolConnection,
	idAluno: number,
	novaFaixa: string
): Promise<void> {
	await conn.execute(
		'UPDATE Aluno SET graduacao_atual = ? WHERE id_usuario = ?',
		[novaFaixa, idAluno]
	);
}

/**
 * Insere um novo registro no histórico imutável (Insert-Only).
 */
export async function inserirHistoricoGraduacaoEmTransacao(
	conn: PoolConnection,
	dados: {
		idEventoGraduacao: number;
		idAluno: number;
		idProfessorHomologador: number;
		dataGraduacao: string;
		associacao: string;
		faixa: string;
	}
): Promise<number> {
	const sql = `
		INSERT INTO Historico_Graduacao (
			id_evento_graduacao,
			id_aluno,
			id_professor_homologador,
			data_graduacao,
			associacao,
			faixa
		) VALUES (?, ?, ?, ?, ?, ?)
	`;

	const [res] = await conn.execute<ResultSetHeader>(sql, [
		dados.idEventoGraduacao,
		dados.idAluno,
		dados.idProfessorHomologador,
		dados.dataGraduacao,
		dados.associacao,
		dados.faixa
	]);

	return res.insertId;
}

/**
 * Registra a ação sensível de homologação na tabela de auditoria LGPD.
 */
export async function registrarLogAuditoriaEmTransacao(
	conn: PoolConnection,
	dados: {
		idAcademia: number;
		idUsuario: number;
		acao: string;
		entidade: string;
		idEntidade: string;
		dadosAntes: Record<string, any>;
		dadosDepois: Record<string, any>;
	}
): Promise<void> {
	const sql = `
		INSERT INTO Log_Auditoria (
			id_academia,
			id_usuario,
			acao,
			entidade,
			id_entidade,
			dados_antes,
			dados_depois
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`;

	await conn.execute(sql, [
		dados.idAcademia,
		dados.idUsuario,
		dados.acao,
		dados.entidade,
		dados.idEntidade,
		JSON.stringify(dados.dadosAntes),
		JSON.stringify(dados.dadosDepois)
	]);
}
