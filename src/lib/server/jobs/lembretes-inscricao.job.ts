import type { RowDataPacket } from 'mysql2/promise';
import { getDbPool } from '../db/pool';

export interface ItemInscricaoPendente extends RowDataPacket {
	id_academia: number;
	id_evento: number;
	nome_evento: string;
	data_inicio: string;
	id_inscricao: number;
	status_inscricao: string;
	id_aluno: number | null;
	id_professor: number | null;
	nome_participante: string;
	dias_para_evento: number;
}

export interface DetalheProcessamento {
	idAcademia: number;
	idInscricao: number;
	participante: string;
	evento: string;
	diasRestantes: number;
	status: 'enviado' | 'idempotente_ignorado';
}

export interface RelatorioJobLembretes {
	sucesso: boolean;
	timestamp: string;
	totalAcademiasProcessadas: number;
	totalInscricoesPendentes: number;
	totalLembretesEnviados: number;
	totalIgnoradosIdempotencia: number;
	detalhes: DetalheProcessamento[];
}

/**
 * Job de automação para disparo de lembretes preventivos de campeonatos.
 * 
 * DIRETRIZES DA SEÇÃO 5.3 DO PROMPT.MD:
 * 1. Não usa setInterval/setTimeout no processo Node (Stateless / Cloud-ready).
 * 2. Idempotente: rodar várias vezes no mesmo dia não duplica lembretes.
 * 3. Processamento multi-tenant explícito por id_academia em cada operação.
 * 4. Rastreamento e auditoria em Log_Auditoria sem vazar dados sensíveis.
 */
export async function executarJobLembretesInscricao(): Promise<RelatorioJobLembretes> {
	const pool = getDbPool();
	const agora = new Date().toISOString();

	const relatorio: RelatorioJobLembretes = {
		sucesso: true,
		timestamp: agora,
		totalAcademiasProcessadas: 0,
		totalInscricoesPendentes: 0,
		totalLembretesEnviados: 0,
		totalIgnoradosIdempotencia: 0,
		detalhes: []
	};

	try {
		// 1. Identifica todas as academias cadastradas para processamento isolado
		const [academias] = await pool.query<RowDataPacket[]>(
			'SELECT id_academia, nome FROM Academia ORDER BY id_academia ASC'
		);

		relatorio.totalAcademiasProcessadas = academias.length;

		for (const academia of academias) {
			const idAcademia = Number(academia.id_academia);

			// 2. Busca inscrições pendentes para campeonatos nos próximos 7 dias
			// SEGURANÇA MULTI-TENANT: id_academia explicitamente filtrado
			const [inscricoesPendentes] = await pool.query<ItemInscricaoPendente[]>(
				`SELECT 
					e.id_academia,
					e.id_evento,
					e.nome AS nome_evento,
					DATE_FORMAT(e.data_inicio, '%Y-%m-%d') AS data_inicio,
					i.id_inscricao,
					i.status_inscricao,
					i.id_aluno,
					i.id_professor,
					COALESCE(u_aluno.nome, u_prof.nome, 'Participante') AS nome_participante,
					DATEDIFF(e.data_inicio, CURDATE()) AS dias_para_evento
				FROM Evento e
				INNER JOIN Campeonato c ON c.id_evento = e.id_evento
				INNER JOIN Inscricao_Evento i ON i.id_evento = e.id_evento
				LEFT JOIN Aluno a ON a.id_usuario = i.id_aluno
				LEFT JOIN Usuario u_aluno ON u_aluno.id_usuario = a.id_usuario
				LEFT JOIN Professor p ON p.id_usuario = i.id_professor
				LEFT JOIN Usuario u_prof ON u_prof.id_usuario = p.id_usuario
				WHERE e.id_academia = ?
				  AND i.status_inscricao = 'Pendente'
				  AND e.data_inicio >= CURDATE()
				  AND e.data_inicio <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
				ORDER BY e.data_inicio ASC, i.id_inscricao ASC`,
				[idAcademia]
			);

			relatorio.totalInscricoesPendentes += inscricoesPendentes.length;

			for (const inscricao of inscricoesPendentes) {
				const idInscricaoStr = String(inscricao.id_inscricao);

				// 3. Checagem de Idempotência:
				// Verifica se já existe registro de lembrete enviado para esta inscrição específica
				const [logsExistentes] = await pool.query<RowDataPacket[]>(
					`SELECT id_log 
					FROM Log_Auditoria 
					WHERE id_academia = ?
					  AND acao = 'LEMBRETE_INSCRICAO_ENVIADO'
					  AND entidade = 'Inscricao_Evento'
					  AND id_entidade = ?
					LIMIT 1`,
					[idAcademia, idInscricaoStr]
				);

				if (logsExistentes.length > 0) {
					// Já notificado anteriormente: ignora para garantir idempotência estrita
					relatorio.totalIgnoradosIdempotencia++;
					relatorio.detalhes.push({
						idAcademia,
						idInscricao: inscricao.id_inscricao,
						participante: inscricao.nome_participante,
						evento: inscricao.nome_evento,
						diasRestantes: Number(inscricao.dias_para_evento),
						status: 'idempotente_ignorado'
					});
					continue;
				}

				// 4. Disparo do lembrete (simulação de notificação push/e-mail com registro de auditoria)
				const dadosLog = {
					evento: inscricao.nome_evento,
					participante: inscricao.nome_participante,
					dias_para_evento: Number(inscricao.dias_para_evento),
					mensagem: `Lembrete preventivo: faltam ${inscricao.dias_para_evento} dia(s) para o campeonato. Confirme sua inscrição.`
				};

				// Registra envio no Log_Auditoria (insert-only, sem expor dados confidenciais)
				await pool.query(
					`INSERT INTO Log_Auditoria (
						id_academia,
						id_usuario,
						acao,
						entidade,
						id_entidade,
						dados_depois,
						ip,
						criado_em
					) VALUES (?, NULL, 'LEMBRETE_INSCRICAO_ENVIADO', 'Inscricao_Evento', ?, ?, '127.0.0.1 (CLI Job)', NOW(3))`,
					[idAcademia, idInscricaoStr, JSON.stringify(dadosLog)]
				);

				relatorio.totalLembretesEnviados++;
				relatorio.detalhes.push({
					idAcademia,
					idInscricao: inscricao.id_inscricao,
					participante: inscricao.nome_participante,
					evento: inscricao.nome_evento,
					diasRestantes: Number(inscricao.dias_para_evento),
					status: 'enviado'
				});
			}
		}

		return relatorio;
	} catch (erro) {
		console.error('[JOB LEMBRETES] Falha crítica na execução:', erro);
		relatorio.sucesso = false;
		throw erro;
	}
}
