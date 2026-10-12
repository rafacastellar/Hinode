#!/usr/bin/env node
import 'dotenv/config';
import { fecharPool } from '../src/lib/server/db/pool';
import { executarJobLembretesInscricao } from '../src/lib/server/jobs/lembretes-inscricao.job';

/**
 * Script CLI independente para execução do Job de Lembretes.
 * Pode ser agendado no cron do Linux da VM ou disparado via AWS Lambda/EventBridge.
 * 
 * Uso:
 *   npx tsx scripts/executar-job-lembretes.ts
 * ou
 *   npm run job:lembretes
 */
async function main() {
	console.log('===============================================================');
	console.log('🥋 JUDÔ HINODÊ - JOB INDEPENDENTE DE LEMBRETES DE INSCRIÇÃO');
	console.log('===============================================================');
	console.log(`[INFO] Iniciando varredura às ${new Date().toLocaleString('pt-BR')}...`);

	try {
		const resultado = await executarJobLembretesInscricao();

		console.log('\n📊 RELATÓRIO DE PROCESSAMENTO:');
		console.log(`- Dojos verificados: ${resultado.totalAcademiasProcessadas}`);
		console.log(`- Inscrições pendentes localizadas: ${resultado.totalInscricoesPendentes}`);
		console.log(`- Lembretes despachados: ${resultado.totalLembretesEnviados}`);
		console.log(`- Ignorados por idempotência (já enviados): ${resultado.totalIgnoradosIdempotencia}`);

		if (resultado.detalhes.length > 0) {
			console.log('\n📋 DETALHES DAS OPERAÇÕES:');
			for (const d of resultado.detalhes) {
				const tag = d.status === 'enviado' ? '✅ ENVIADO' : '⏭️ IDEMPOTENTE';
				console.log(
					`  [Dojo #${d.idAcademia}] ${tag} -> Inscrição #${d.idInscricao} (${d.participante}) - ${d.evento} (Faltam ${d.diasRestantes} dias)`
				);
			}
		} else {
			console.log('\nℹ️ Nenhuma pendência para campeonatos nos próximos 7 dias.');
		}

		console.log('\n[SUCESSO] Rotina finalizada com êxito.');
		process.exitCode = 0;
	} catch (erro) {
		console.error('\n❌ [ERRO CRÍTICO] Falha na execução do job:', erro);
		process.exitCode = 1;
	} finally {
		// Encerramento obrigatório do pool de conexões para desocupar o processo
		await fecharPool();
		console.log('[INFO] Pool de conexões MySQL encerrado.');
	}
}

main();
