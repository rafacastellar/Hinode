import { getDbPool, executarTransacao } from '../db/pool';
import type { RowDataPacket } from 'mysql2/promise';
import type { StatusPresenca } from '../validacao/turma.schema';

export interface AlunoChamada {
	id_aluno: number;
	nome: string;
	grau_faixa: string | null;
	status_presenca: StatusPresenca;
	observacao: string | null;
	registrado: boolean;
	atualizado_em: string | null;
}

export interface FrequenciaAluno {
	id_aluno: number;
	total_aulas: number;
	total_presentes: number;
	total_faltas: number;
	total_justificadas: number;
	percentual_presenca: number;
}

export interface SessaoTreinoDia {
	id_presenca: number | null;
	id_treino: number;
	data_treino: string; // YYYY-MM-DD
	descricao_turma: string;
	horario_inicio: string;
	horario_fim: string;
	dia_semana_turma: string;
	status_presenca: StatusPresenca;
	observacao: string | null;
	nome_registrador: string | null;
	atualizado_em: string | null;
}

export interface TurmaMatriculadaResumo {
	id_treino: number;
	descricao: string;
	dia_semana: string;
	horario_inicio: string;
	horario_fim: string;
}

export interface MetricasDetalhadasPresencaAluno {
	id_aluno: number;
	total_aulas: number;
	total_presentes: number;
	total_faltas: number;
	total_justificadas: number;
	percentual_presenca: number;
	dias_distintos_treinados: number;
	streak_atual: number;
	maior_streak: number;
	aulas_mes_atual: number;
	presentes_mes_atual: number;
	percentual_mes_atual: number;
	proximo_exame_meta: {
		id_evento: number;
		nome_evento: string;
		data_exame: string | null;
		percentual_minimo: number;
		qtd_minima_aulas: number;
		apto_frequencia: boolean;
	} | null;
}

/**
 * Busca os alunos matriculados na turma e seus respectivos status de presença
 * para a data selecionada. Se ainda não houver chamada salva, indica registrado = false.
 */
export async function buscarChamadaTurmaPorData(
	idAcademia: number,
	idTreino: number,
	dataTreino: string
): Promise<{ chamada: AlunoChamada[]; jaRegistrada: boolean }> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			u.id_usuario AS id_aluno,
			u.nome,
			COALESCE(a.graduacao_atual, 'Branca') AS grau_faixa,
			COALESCE(pt.status_presenca, 'Presente') AS status_presenca,
			pt.observacao,
			CASE WHEN pt.id_presenca IS NOT NULL THEN 1 ELSE 0 END AS registrado,
			pt.atualizado_em
		FROM Aluno_Treino at
		INNER JOIN Aluno a 
			ON a.id_usuario = at.id_aluno
		INNER JOIN Usuario u 
			ON u.id_usuario = a.id_usuario 
		INNER JOIN Usuario_Academia ua 
			ON ua.id_usuario = u.id_usuario
		LEFT JOIN Presenca_Treino pt 
			ON pt.id_treino = at.id_treino 
			AND pt.id_aluno = at.id_aluno 
			AND pt.id_academia = ua.id_academia
			AND pt.data_treino = ?
		WHERE ua.id_academia = ? 
		  AND at.id_treino = ?
		ORDER BY u.nome ASC
	`;

	try {
		const [linhas] = await pool.execute<RowDataPacket[]>(sql, [
			dataTreino,
			idAcademia,
			idTreino
		]);

		const chamada: AlunoChamada[] = linhas.map((linha: RowDataPacket) => ({
			id_aluno: Number(linha.id_aluno),
			nome: String(linha.nome),
			grau_faixa: linha.grau_faixa ? String(linha.grau_faixa) : null,
			status_presenca: (linha.status_presenca || 'Presente') as StatusPresenca,
			observacao: linha.observacao ? String(linha.observacao) : null,
			registrado: Boolean(linha.registrado),
			atualizado_em: linha.atualizado_em ? String(linha.atualizado_em) : null
		}));

		const jaRegistrada = chamada.some((c) => c.registrado);

		return { chamada, jaRegistrada };
	} catch (err: any) {
		// Fallback amigável caso a tabela Presenca_Treino ainda não exista no ambiente
		if (err.code === 'ER_NO_SUCH_TABLE') {
			const sqlFallback = `
				SELECT 
					u.id_usuario AS id_aluno,
					u.nome,
					COALESCE(a.graduacao_atual, 'Branca') AS grau_faixa
				FROM Aluno_Treino at
				INNER JOIN Aluno a 
					ON a.id_usuario = at.id_aluno
				INNER JOIN Usuario u 
					ON u.id_usuario = a.id_usuario 
				INNER JOIN Usuario_Academia ua 
					ON ua.id_usuario = u.id_usuario
				WHERE ua.id_academia = ? 
				  AND at.id_treino = ?
				ORDER BY u.nome ASC
			`;
			const [linhasFallback] = await pool.execute<RowDataPacket[]>(sqlFallback, [
				idAcademia,
				idTreino
			]);

			return {
				chamada: linhasFallback.map((l: RowDataPacket) => ({
					id_aluno: Number(l.id_aluno),
					nome: String(l.nome),
					grau_faixa: l.grau_faixa ? String(l.grau_faixa) : null,
					status_presenca: 'Presente',
					observacao: null,
					registrado: false,
					atualizado_em: null
				})),
				jaRegistrada: false
			};
		}
		throw err;
	}
}

/**
 * Salva a chamada da turma em lote com transação ACID e registro em Auditoria_Log.
 */
export async function salvarChamadaTurmaEmLote(
	idAcademia: number,
	idTreino: number,
	dataTreino: string,
	idUsuarioRegistro: number,
	itens: Array<{ idAluno: number; status: StatusPresenca; observacao?: string | null }>
): Promise<void> {
	await executarTransacao(async (conn) => {
		const sqlUpsert = `
			INSERT INTO Presenca_Treino 
				(id_academia, id_treino, id_aluno, data_treino, status_presenca, observacao, id_usuario_registro)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE 
				status_presenca = VALUES(status_presenca),
				observacao = VALUES(observacao),
				id_usuario_registro = VALUES(id_usuario_registro),
				atualizado_em = CURRENT_TIMESTAMP
		`;

		for (const item of itens) {
			await conn.execute(sqlUpsert, [
				idAcademia,
				idTreino,
				item.idAluno,
				dataTreino,
				item.status,
				item.observacao || null,
				idUsuarioRegistro
			]);
		}

		// Log de auditoria institucional (insert-only)
		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois)
			 VALUES (?, ?, 'CHAMADA_TATAME_REGISTRADA', 'Presenca_Treino', ?, ?)`,
			[
				idAcademia,
				idUsuarioRegistro,
				String(idTreino),
				JSON.stringify({
					idTreino,
					dataTreino,
					totalAtletas: itens.length,
					presentes: itens.filter((i) => i.status === 'Presente').length,
					faltas: itens.filter((i) => i.status === 'Falta').length,
					justificadas: itens.filter((i) => i.status === 'Justificada').length
				})
			]
		);
	});
}

/**
 * Retorna as estatísticas consolidadas de frequência de um ou mais alunos no Dojo.
 */
export async function obterFrequenciasAlunos(
	idAcademia: number,
	idsAlunos?: number[]
): Promise<Map<number, FrequenciaAluno>> {
	const mapa = new Map<number, FrequenciaAluno>();

	let sql = `
		SELECT 
			id_aluno,
			COUNT(*) AS total_aulas,
			SUM(CASE WHEN status_presenca = 'Presente' THEN 1 ELSE 0 END) AS total_presentes,
			SUM(CASE WHEN status_presenca = 'Falta' THEN 1 ELSE 0 END) AS total_faltas,
			SUM(CASE WHEN status_presenca = 'Justificada' THEN 1 ELSE 0 END) AS total_justificadas
		FROM Presenca_Treino
		WHERE id_academia = ?
	`;

	const params: (number | string)[] = [idAcademia];

	if (idsAlunos && idsAlunos.length > 0) {
		const placeholders = idsAlunos.map(() => '?').join(', ');
		sql += ` AND id_aluno IN (${placeholders})`;
		params.push(...idsAlunos);
	}

	sql += ` GROUP BY id_aluno`;

	try {
		const pool = getDbPool();
		const [linhas] = await pool.execute<RowDataPacket[]>(sql, params);

		for (const l of linhas) {
			const totalAulas = Number(l.total_aulas) || 0;
			const totalPresentes = Number(l.total_presentes) || 0;
			const totalFaltas = Number(l.total_faltas) || 0;
			const totalJustificadas = Number(l.total_justificadas) || 0;
			const pct = totalAulas > 0 ? Math.round((totalPresentes / totalAulas) * 100) : 0;

			mapa.set(Number(l.id_aluno), {
				id_aluno: Number(l.id_aluno),
				total_aulas: totalAulas,
				total_presentes: totalPresentes,
				total_faltas: totalFaltas,
				total_justificadas: totalJustificadas,
				percentual_presenca: pct
			});
		}
	} catch (err: any) {
		// Se tabela não existir ainda, retorna mapa vazio
		if (err.code !== 'ER_NO_SUCH_TABLE') {
			console.error('Erro ao buscar frequências dos alunos:', err);
		}
	}

	return mapa;
}

/**
 * Retorna as estatísticas consolidadas de frequência de um único judoca.
 */
export async function obterFrequenciaAluno(
	idAcademia: number,
	idAluno: number
): Promise<FrequenciaAluno> {
	const mapa = await obterFrequenciasAlunos(idAcademia, [idAluno]);
	return (
		mapa.get(idAluno) || {
			id_aluno: idAluno,
			total_aulas: 0,
			total_presentes: 0,
			total_faltas: 0,
			total_justificadas: 0,
			percentual_presenca: 0
		}
	);
}

/**
 * Lista todas as turmas em que um judoca está matriculado no dojo (suporta N turmas/dia).
 */
export async function listarTurmasMatriculadasDoAluno(
	idAcademia: number,
	idAluno: number
): Promise<TurmaMatriculadaResumo[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			tt.id_treino,
			tt.descricao,
			tt.dia_semana,
			TIME_FORMAT(tt.horario_inicio, '%H:%i') AS horario_inicio,
			TIME_FORMAT(tt.horario_fim, '%H:%i') AS horario_fim
		FROM Aluno_Treino at
		INNER JOIN Treino_Turma tt 
			ON tt.id_treino = at.id_treino
		INNER JOIN Usuario_Academia ua 
			ON ua.id_usuario = at.id_aluno 
			AND ua.id_academia = tt.id_academia
		WHERE tt.id_academia = ? 
		  AND at.id_aluno = ?
		ORDER BY tt.horario_inicio ASC, tt.descricao ASC
	`;

	const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia, idAluno]);
	return linhas.map((l: RowDataPacket) => ({
		id_treino: Number(l.id_treino),
		descricao: String(l.descricao || 'Turma de Judô'),
		dia_semana: String(l.dia_semana || ''),
		horario_inicio: String(l.horario_inicio || '00:00'),
		horario_fim: String(l.horario_fim || '00:00')
	}));
}

/**
 * Lista todas as sessões de presença registradas para o judoca, suportando
 * múltiplos treinos na mesma data (ordenado por data DESC e horário DESC).
 */
export async function listarHistoricoPresencasAluno(
	idAcademia: number,
	idAluno: number,
	limite = 180
): Promise<SessaoTreinoDia[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			pt.id_presenca,
			pt.id_treino,
			DATE_FORMAT(pt.data_treino, '%Y-%m-%d') AS data_treino,
			COALESCE(tt.descricao, 'Treino no Dojo') AS descricao_turma,
			COALESCE(TIME_FORMAT(tt.horario_inicio, '%H:%i'), '00:00') AS horario_inicio,
			COALESCE(TIME_FORMAT(tt.horario_fim, '%H:%i'), '00:00') AS horario_fim,
			COALESCE(tt.dia_semana, '') AS dia_semana_turma,
			pt.status_presenca,
			pt.observacao,
			ur.nome AS nome_registrador,
			DATE_FORMAT(pt.atualizado_em, '%Y-%m-%d %H:%i') AS atualizado_em
		FROM Presenca_Treino pt
		INNER JOIN Treino_Turma tt 
			ON tt.id_treino = pt.id_treino 
			AND tt.id_academia = pt.id_academia
		LEFT JOIN Usuario ur 
			ON ur.id_usuario = pt.id_usuario_registro
		WHERE pt.id_academia = ? 
		  AND pt.id_aluno = ?
		ORDER BY pt.data_treino DESC, tt.horario_inicio DESC
		LIMIT ${Number(limite) || 180}
	`;

	try {
		const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia, idAluno]);
		return linhas.map((l: RowDataPacket) => ({
			id_presenca: Number(l.id_presenca),
			id_treino: Number(l.id_treino),
			data_treino: String(l.data_treino),
			descricao_turma: String(l.descricao_turma),
			horario_inicio: String(l.horario_inicio),
			horario_fim: String(l.horario_fim),
			dia_semana_turma: String(l.dia_semana_turma),
			status_presenca: (l.status_presenca || 'Presente') as StatusPresenca,
			observacao: l.observacao ? String(l.observacao) : null,
			nome_registrador: l.nome_registrador ? String(l.nome_registrador) : null,
			atualizado_em: l.atualizado_em ? String(l.atualizado_em) : null
		}));
	} catch (err: any) {
		if (err.code === 'ER_NO_SUCH_TABLE') {
			return [];
		}
		console.error('Erro ao listar histórico de presenças do aluno:', err);
		return [];
	}
}

/**
 * Calcula métricas completas de presença do judoca, incluindo:
 * - Taxa geral e do mês atual
 * - Contagem de aulas e dias distintos treinados (considerando múltiplos treinos/dia)
 * - Streak de constância (aulas consecutivas sem falta)
 * - Meta do próximo exame de graduação ativo no dojo
 */
export async function obterMetricasDetalhadasPresencaAluno(
	idAcademia: number,
	idAluno: number
): Promise<MetricasDetalhadasPresencaAluno> {
	const historico = await listarHistoricoPresencasAluno(idAcademia, idAluno, 500);

	const totalAulas = historico.length;
	const totalPresentes = historico.filter((h) => h.status_presenca === 'Presente').length;
	const totalFaltas = historico.filter((h) => h.status_presenca === 'Falta').length;
	const totalJustificadas = historico.filter((h) => h.status_presenca === 'Justificada').length;
	const percentualPresenca =
		totalAulas > 0 ? Math.round((totalPresentes / totalAulas) * 100) : 0;

	const diasPresentesSet = new Set(
		historico.filter((h) => h.status_presenca === 'Presente').map((h) => h.data_treino)
	);
	const diasDistintosTreinados = diasPresentesSet.size;

	// Cálculo de Streak (do mais antigo para o mais recente)
	const cronologico = [...historico].reverse();
	let streakTemp = 0;
	let maiorStreak = 0;
	for (const reg of cronologico) {
		if (reg.status_presenca === 'Presente') {
			streakTemp++;
			if (streakTemp > maiorStreak) {
				maiorStreak = streakTemp;
			}
		} else if (reg.status_presenca === 'Falta') {
			streakTemp = 0;
		}
		// 'Justificada' não quebra o streak nem incrementa
	}
	const streakAtual = streakTemp;

	// Métricas do mês corrente (YYYY-MM)
	const mesAtualPrefixo = new Date().toISOString().slice(0, 7);
	const doMesAtual = historico.filter((h) => h.data_treino.startsWith(mesAtualPrefixo));
	const aulasMesAtual = doMesAtual.length;
	const presentesMesAtual = doMesAtual.filter((h) => h.status_presenca === 'Presente').length;
	const percentualMesAtual =
		aulasMesAtual > 0 ? Math.round((presentesMesAtual / aulasMesAtual) * 100) : 0;

	// Busca próximo evento de graduação agendado no dojo para compor o termômetro da faixa
	let proximoExameMeta: MetricasDetalhadasPresencaAluno['proximo_exame_meta'] = null;
	try {
		const pool = getDbPool();
		const [exames] = await pool.execute<RowDataPacket[]>(
			`SELECT 
				e.id_evento,
				e.nome,
				DATE_FORMAT(e.data_inicio, '%Y-%m-%d') AS data_inicio,
				COALESCE(ge.percentual_minimo_presenca, 0) AS percentual_minimo_presenca,
				COALESCE(ge.qtd_minima_aulas_presentes, 0) AS qtd_minima_aulas_presentes
			 FROM Graduacao_Evento ge
			 INNER JOIN Evento e ON e.id_evento = ge.id_evento
			 WHERE e.id_academia = ?
			   AND (ge.status = 'Agendado' OR e.data_inicio >= CURDATE())
			 ORDER BY e.data_inicio ASC
			 LIMIT 1`,
			[idAcademia]
		);

		if (exames.length > 0) {
			const ex = exames[0];
			const pctMin = Number(ex.percentual_minimo_presenca) || 0;
			const qtdMin = Number(ex.qtd_minima_aulas_presentes) || 0;
			const cumprePct = pctMin <= 0 || percentualPresenca >= pctMin;
			const cumpreQtd = qtdMin <= 0 || totalPresentes >= qtdMin;

			proximoExameMeta = {
				id_evento: Number(ex.id_evento),
				nome_evento: String(ex.nome),
				data_exame: ex.data_inicio ? String(ex.data_inicio) : null,
				percentual_minimo: pctMin,
				qtd_minima_aulas: qtdMin,
				apto_frequencia: cumprePct && cumpreQtd
			};
		}
	} catch {
		// Se colunas ainda não existirem ou sem evento, ignora silenciosamente
	}

	return {
		id_aluno: idAluno,
		total_aulas: totalAulas,
		total_presentes: totalPresentes,
		total_faltas: totalFaltas,
		total_justificadas: totalJustificadas,
		percentual_presenca: percentualPresenca,
		dias_distintos_treinados: diasDistintosTreinados,
		streak_atual: streakAtual,
		maior_streak: maiorStreak,
		aulas_mes_atual: aulasMesAtual,
		presentes_mes_atual: presentesMesAtual,
		percentual_mes_atual: percentualMesAtual,
		proximo_exame_meta: proximoExameMeta
	};
}

/**
 * Permite ao Responsável Legal registrar antecipadamente (ou justificar) a ausência
 * de um judoca sob sua responsabilidade em 1 ou mais treinos de uma determinada data.
 */
export async function registrarAvisoAusenciaPeloResponsavel(
	idAcademia: number,
	idResponsavel: number,
	idAluno: number,
	idsTreinos: number[],
	dataTreino: string,
	motivo: string
): Promise<void> {
	if (!idsTreinos || idsTreinos.length === 0) {
		throw new Error('Selecione ao menos um treino do dia para justificar a ausência.');
	}

	const pool = getDbPool();

	// 1. Verifica vínculo estrito Responsavel_Aluno e pertencimento à academia
	const [vinculo] = await pool.execute<RowDataPacket[]>(
		`SELECT 1
		 FROM Responsavel_Aluno ra
		 INNER JOIN Usuario_Academia ua ON ua.id_usuario = ra.id_aluno
		 WHERE ua.id_academia = ?
		   AND ra.id_responsavel = ?
		   AND ra.id_aluno = ?
		 LIMIT 1`,
		[idAcademia, idResponsavel, idAluno]
	);

	if (vinculo.length === 0) {
		throw new Error('Acesso negado: este judoca não está vinculado à sua responsabilidade.');
	}

	// 2. Verifica se os treinos informados pertencem ao dojo e se o aluno está matriculado neles
	const placeholders = idsTreinos.map(() => '?').join(', ');
	const [treinosValidos] = await pool.execute<RowDataPacket[]>(
		`SELECT tt.id_treino
		 FROM Treino_Turma tt
		 INNER JOIN Aluno_Treino at ON at.id_treino = tt.id_treino
		 WHERE tt.id_academia = ?
		   AND at.id_aluno = ?
		   AND tt.id_treino IN (${placeholders})`,
		[idAcademia, idAluno, ...idsTreinos]
	);

	if (treinosValidos.length === 0) {
		throw new Error('Nenhuma turma válida encontrada para o judoca informado.');
	}

	const observacaoFormatada = `[Aviso do Responsável] ${motivo.trim()}`.slice(0, 255);

	await executarTransacao(async (conn) => {
		const sqlUpsert = `
			INSERT INTO Presenca_Treino
				(id_academia, id_treino, id_aluno, data_treino, status_presenca, observacao, id_usuario_registro)
			VALUES (?, ?, ?, ?, 'Justificada', ?, ?)
			ON DUPLICATE KEY UPDATE
				status_presenca = 'Justificada',
				observacao = VALUES(observacao),
				id_usuario_registro = VALUES(id_usuario_registro),
				atualizado_em = CURRENT_TIMESTAMP
		`;

		for (const row of treinosValidos) {
			await conn.execute(sqlUpsert, [
				idAcademia,
				Number(row.id_treino),
				idAluno,
				dataTreino,
				observacaoFormatada,
				idResponsavel
			]);
		}

		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois)
			 VALUES (?, ?, 'AVISO_AUSENCIA_RESPONSAVEL', 'Presenca_Treino', ?, ?)`,
			[
				idAcademia,
				idResponsavel,
				String(idAluno),
				JSON.stringify({
					idAluno,
					dataTreino,
					idsTreinos: treinosValidos.map((r) => Number(r.id_treino)),
					motivo: observacaoFormatada
				})
			]
		);
	});
}

/**
 * Permite ao Professor, Admin ou Recepção atualizar ou lançar manualmente
 * um registro individual de presença diretamente pela ficha do judoca.
 */
export async function registrarOuAtualizarPresencaIndividual(
	idAcademia: number,
	idUsuarioExecutor: number,
	idAluno: number,
	idTreino: number,
	dataTreino: string,
	status: StatusPresenca,
	observacao: string | null
): Promise<void> {
	const pool = getDbPool();

	// Valida pertencimento da turma e do aluno ao dojo
	const [valido] = await pool.execute<RowDataPacket[]>(
		`SELECT 1
		 FROM Treino_Turma tt
		 INNER JOIN Usuario_Academia ua ON ua.id_academia = tt.id_academia
		 WHERE tt.id_academia = ? AND tt.id_treino = ? AND ua.id_usuario = ?
		 LIMIT 1`,
		[idAcademia, idTreino, idAluno]
	);

	if (valido.length === 0) {
		throw new Error('Turma ou judoca não pertencem a esta academia.');
	}

	await executarTransacao(async (conn) => {
		await conn.execute(
			`INSERT INTO Presenca_Treino
				(id_academia, id_treino, id_aluno, data_treino, status_presenca, observacao, id_usuario_registro)
			 VALUES (?, ?, ?, ?, ?, ?, ?)
			 ON DUPLICATE KEY UPDATE
				status_presenca = VALUES(status_presenca),
				observacao = VALUES(observacao),
				id_usuario_registro = VALUES(id_usuario_registro),
				atualizado_em = CURRENT_TIMESTAMP`,
			[
				idAcademia,
				idTreino,
				idAluno,
				dataTreino,
				status,
				observacao ? observacao.trim().slice(0, 255) : null,
				idUsuarioExecutor
			]
		);

		await conn.execute(
			`INSERT INTO Log_Auditoria (id_academia, id_usuario, acao, entidade, id_entidade, dados_depois)
			 VALUES (?, ?, 'ATUALIZACAO_PRESENCA_INDIVIDUAL', 'Presenca_Treino', ?, ?)`,
			[
				idAcademia,
				idUsuarioExecutor,
				String(idAluno),
				JSON.stringify({
					idAluno,
					idTreino,
					dataTreino,
					status,
					observacao
				})
			]
		);
	});
}

export interface RegistroAlunoDiaTurma {
	id_aluno: number;
	nome: string;
	grau_faixa: string | null;
	status_presenca: StatusPresenca;
	observacao: string | null;
	nome_registrador: string | null;
	atualizado_em: string | null;
}

export interface DiaHistoricoTurma {
	data_treino: string; // YYYY-MM-DD
	total_registros: number;
	total_presentes: number;
	total_faltas: number;
	total_justificadas: number;
	percentual_presenca: number;
	ultima_atualizacao: string | null;
	nome_registrador: string | null;
	registros: RegistroAlunoDiaTurma[];
}

/**
 * Lista o histórico agrupado por dia de todas as chamadas registradas para uma turma específica,
 * permitindo ao Sensei visualizar no calendário mensal e editar a relação de qualquer dia via popup.
 */
export async function listarHistoricoChamadasDaTurma(
	idAcademia: number,
	idTreino: number
): Promise<DiaHistoricoTurma[]> {
	const pool = getDbPool();
	const sql = `
		SELECT 
			DATE_FORMAT(pt.data_treino, '%Y-%m-%d') AS data_treino,
			pt.id_aluno,
			u.nome,
			COALESCE(a.graduacao_atual, 'Branca') AS grau_faixa,
			pt.status_presenca,
			pt.observacao,
			ur.nome AS nome_registrador,
			DATE_FORMAT(pt.atualizado_em, '%d/%m/%Y %H:%i') AS atualizado_em
		FROM Presenca_Treino pt
		INNER JOIN Usuario u 
			ON u.id_usuario = pt.id_aluno
		LEFT JOIN Aluno a 
			ON a.id_usuario = pt.id_aluno
		LEFT JOIN Usuario ur 
			ON ur.id_usuario = pt.id_usuario_registro
		WHERE pt.id_academia = ? 
		  AND pt.id_treino = ?
		ORDER BY pt.data_treino DESC, u.nome ASC
	`;

	try {
		const [linhas] = await pool.execute<RowDataPacket[]>(sql, [idAcademia, idTreino]);
		const mapaDias = new Map<string, DiaHistoricoTurma>();

		for (const l of linhas) {
			const dataIso = String(l.data_treino);
			let dia = mapaDias.get(dataIso);
			if (!dia) {
				dia = {
					data_treino: dataIso,
					total_registros: 0,
					total_presentes: 0,
					total_faltas: 0,
					total_justificadas: 0,
					percentual_presenca: 0,
					ultima_atualizacao: l.atualizado_em ? String(l.atualizado_em) : null,
					nome_registrador: l.nome_registrador ? String(l.nome_registrador) : null,
					registros: []
				};
				mapaDias.set(dataIso, dia);
			}

			const status = (l.status_presenca || 'Presente') as StatusPresenca;
			dia.total_registros += 1;
			if (status === 'Presente') dia.total_presentes += 1;
			else if (status === 'Falta') dia.total_faltas += 1;
			else if (status === 'Justificada') dia.total_justificadas += 1;

			dia.registros.push({
				id_aluno: Number(l.id_aluno),
				nome: String(l.nome),
				grau_faixa: l.grau_faixa ? String(l.grau_faixa) : null,
				status_presenca: status,
				observacao: l.observacao ? String(l.observacao) : null,
				nome_registrador: l.nome_registrador ? String(l.nome_registrador) : null,
				atualizado_em: l.atualizado_em ? String(l.atualizado_em) : null
			});
		}

		const resultado = Array.from(mapaDias.values());
		for (const d of resultado) {
			d.percentual_presenca =
				d.total_registros > 0 ? Math.round((d.total_presentes / d.total_registros) * 100) : 0;
		}

		return resultado;
	} catch (err: any) {
		if (err.code === 'ER_NO_SUCH_TABLE') {
			return [];
		}
		console.error('Erro ao listar histórico de chamadas da turma:', err);
		return [];
	}
}
