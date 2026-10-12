<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import {
		Building2,
		ShieldCheck,
		Cloud,
		Database,
		Server,
		Lock,
		Play,
		CheckCircle2,
		FileText,
		AlertCircle,
		HardDrive,
		Terminal,
		Clock
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let executandoJob = $state(false);
	let logExpandido = $state<number | null>(null);

	function alternarLog(id: number) {
		logExpandido = logExpandido === id ? null : id;
	}
</script>

<svelte:head>
	<title>Configurações & Prontidão Cloud - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8">
	<!-- ========================================================================= -->
	<!-- 1. CABEÇALHO DO MÓDULO & ACIONADOR DE JOB -->
	<!-- ========================================================================= -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-semibold">
					Fase 8 • Governança & Cloud Readiness
				</span>
				<span class="text-zinc-600">•</span>
				<span class="text-xs font-mono text-zinc-400">Tenant #{data.academia.id_academia}</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
				Configurações & Auditoria
			</h1>
			<p class="text-sm text-zinc-400 mt-1">
				Telemetria do dojo, conformidade LGPD, prontidão para AWS e jobs de automação.
			</p>
		</div>

		<!-- Ação Rápida: Testar Job de Lembretes -->
		<form
			method="POST"
			action="?/testarJobLembretes"
			use:enhance={() => {
				executandoJob = true;
				return async ({ update }) => {
					await update();
					executandoJob = false;
				};
			}}
		>
			<button
				type="submit"
				disabled={executandoJob}
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:border-red-600/70 hover:bg-zinc-800/80 transition-all text-xs font-medium cursor-pointer shadow-lg disabled:opacity-50"
			>
				{#if executandoJob}
					<div class="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
					<span>Executando Job CLI...</span>
				{:else}
					<Play class="w-4 h-4 text-red-500" />
					<span>Executar Job de Lembretes</span>
				{/if}
			</button>
		</form>
	</div>

	<!-- Feedback do Job de Lembretes -->
	{#if form?.mensagem}
		<div
			class="p-4 rounded-xl border transition-all {form.sucesso
				? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
				: 'bg-red-950/30 border-red-800/60 text-red-300'}"
		>
			<div class="flex items-start gap-3">
				{#if form.sucesso}
					<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
				{:else}
					<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
				{/if}
				<div class="flex-1 text-xs">
					<p class="font-semibold text-sm">{form.mensagem}</p>
					{#if form.relatorioJob}
						<div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] bg-black/40 p-2.5 rounded-lg border border-zinc-800/60">
							<div>
								<span class="text-zinc-500 block">Dojos Varridos:</span>
								<span class="text-white font-bold">{form.relatorioJob.totalAcademiasProcessadas}</span>
							</div>
							<div>
								<span class="text-zinc-500 block">Pendências:</span>
								<span class="text-white font-bold">{form.relatorioJob.totalInscricoesPendentes}</span>
							</div>
							<div>
								<span class="text-zinc-500 block">Lembretes Enviados:</span>
								<span class="text-emerald-400 font-bold">{form.relatorioJob.totalLembretesEnviados}</span>
							</div>
							<div>
								<span class="text-zinc-500 block">Idempotentes (Ignorados):</span>
								<span class="text-amber-400 font-bold">{form.relatorioJob.totalIgnoradosIdempotencia}</span>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. STATS DE GOVERNANÇA & SEGURANÇA -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			titulo="Identificador Tenant"
			valor={`#${data.academia.id_academia}`}
			descricao={data.academia.nome_fantasia || data.academia.nome}
			icone={Building2}
		/>

		<StatCard
			titulo="Driver de Storage"
			valor={data.cloudReadiness.storageDriver.toUpperCase()}
			descricao={data.cloudReadiness.storageDriver === 's3' ? 'AWS S3 Ativo' : 'Abstração Local Dev'}
			icone={Cloud}
		/>

		<StatCard
			titulo="Sessões Ativas"
			valor={data.estatisticas.totalSessoesAtivas}
			descricao="Persistidas no MySQL"
			icone={Lock}
		/>

		<StatCard
			titulo="Trilhas LGPD"
			valor={data.estatisticas.totalLogsAuditoria}
			descricao="Eventos insert-only"
			icone={FileText}
		/>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. PAINEL DE PRONTIDÃO PARA NUVEM (AWS READY) -->
	<!-- ========================================================================= -->
	<section class="rounded-2xl bg-zinc-950 border border-zinc-900 p-6">
		<div class="flex items-center gap-3 mb-6">
			<div class="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/70 flex items-center justify-center text-red-500">
				<Server class="w-5 h-5" />
			</div>
			<div>
				<h2 class="text-base font-bold text-white tracking-tight">
					Arquitetura Pronta para Nuvem AWS
				</h2>
				<p class="text-xs text-zinc-400">
					Conformidade arquitetural estrita com as seções 4.1 a 4.6 do regulamento técnico.
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<!-- Pilar 1 -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-semibold text-white">Isolamento Multi-Tenant</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Toda query no banco inclui <code class="text-red-400 font-mono text-[11px]">id_academia</code> como primeiro parâmetro obrigatório extraído da sessão segura.
				</p>
			</div>

			<!-- Pilar 2 -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-semibold text-white">Sem ORM • SQL Parametrizado</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					100% dos comandos usam prepared statements (<code class="text-red-400 font-mono text-[11px]">?</code>), prevenindo injeções de SQL por construção.
				</p>
			</div>

			<!-- Pilar 3 -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-semibold text-white">Sessões Stateless em Tabela</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Tokens com hash armazenados no MySQL. Qualquer contêiner Node.js pode atender qualquer requisição sem memória de sessão local.
				</p>
			</div>

			<!-- Pilar 4 -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-semibold text-white">Storage Interface (S3 Ready)</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Upload de arquivos desacoplado via <code class="text-red-400 font-mono text-[11px]">StorageProvider</code>. Troca entre ambiente local e AWS S3 via <code class="text-zinc-300 font-mono text-[11px]">.env</code>.
				</p>
			</div>

			<!-- Pilar 5 -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-semibold text-white">Jobs Desacoplados (CLI Cron)</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Sem <code class="text-zinc-400 font-mono text-[11px]">setInterval</code> no Node. Jobs executados via script independente com encerramento gracioso do pool e idempotência no banco.
				</p>
			</div>

			<!-- Pilar 6 -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-semibold text-white">Tabelas Imutáveis (Triggers)</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Histórico de graduação e logs de auditoria são estritamente <strong class="text-zinc-200">insert-only</strong> com bloqueio de UPDATE/DELETE via triggers MySQL.
				</p>
			</div>
		</div>
	</section>

	<!-- ========================================================================= -->
	<!-- 4. DADOS CADASTRAIS DO DOJO -->
	<!-- ========================================================================= -->
	<section class="rounded-2xl bg-zinc-950 border border-zinc-900 p-6">
		<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono text-zinc-400 mb-4">
			Cadastro do Dojo
		</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
			<div class="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
				<span class="text-zinc-500 block text-[11px] font-mono">Razão Social:</span>
				<span class="text-zinc-200 font-medium text-sm mt-0.5 block">{data.academia.nome}</span>
			</div>

			<div class="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
				<span class="text-zinc-500 block text-[11px] font-mono">Nome Fantasia:</span>
				<span class="text-zinc-200 font-medium text-sm mt-0.5 block">{data.academia.nome_fantasia || 'Não informado'}</span>
			</div>

			<div class="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
				<span class="text-zinc-500 block text-[11px] font-mono">CNPJ:</span>
				<span class="text-zinc-200 font-mono text-sm mt-0.5 block">{data.academia.cnpj}</span>
			</div>

			<div class="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
				<span class="text-zinc-500 block text-[11px] font-mono">Inscrição Estadual:</span>
				<span class="text-zinc-200 font-mono text-sm mt-0.5 block">{data.academia.inscr_est || 'Isento'}</span>
			</div>

			<div class="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
				<span class="text-zinc-500 block text-[11px] font-mono">Telefone de Contato:</span>
				<span class="text-zinc-200 text-sm mt-0.5 block">{data.academia.telefone || 'Não informado'}</span>
			</div>

			<div class="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
				<span class="text-zinc-500 block text-[11px] font-mono">Status de Isolamento:</span>
				<span class="text-emerald-400 font-medium text-sm mt-0.5 block flex items-center gap-1.5">
					<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
					Ativo & Protegido
				</span>
			</div>
		</div>
	</section>

	<!-- ========================================================================= -->
	<!-- 5. TRILHA DE AUDITORIA LGPD (INSERT-ONLY) -->
	<!-- ========================================================================= -->
	<section class="rounded-2xl bg-zinc-950 border border-zinc-900 overflow-hidden">
		<div class="p-6 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-2">
					<FileText class="w-4 h-4 text-red-500" />
					<h2 class="text-base font-bold text-white tracking-tight">
						Trilha de Auditoria LGPD
					</h2>
				</div>
				<p class="text-xs text-zinc-400 mt-1">
					Histórico imutável de ações sensíveis (criação de atletas, graduações e jobs). Dados sensíveis como CPF completo e senhas são estritamente mascarados.
				</p>
			</div>

			<span class="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 self-start sm:self-auto">
				Mostrando últimos {data.logsAuditoria.length} registros
			</span>
		</div>

		{#if data.logsAuditoria.length === 0}
			<div class="p-12 text-center">
				<FileText class="w-8 h-8 text-zinc-700 mx-auto mb-3" />
				<p class="text-sm font-semibold text-zinc-300">Nenhum evento registrado ainda</p>
				<p class="text-xs text-zinc-500 mt-1">
					As operações sensíveis serão catalogadas aqui automaticamente.
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="bg-zinc-900/60 border-b border-zinc-900 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
						<tr>
							<th class="px-5 py-3">Data / Hora</th>
							<th class="px-5 py-3">Ação</th>
							<th class="px-5 py-3">Entidade</th>
							<th class="px-5 py-3">Operador</th>
							<th class="px-5 py-3">IP</th>
							<th class="px-5 py-3 text-right">Detalhes</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-900/80">
						{#each data.logsAuditoria as log}
							<tr class="hover:bg-zinc-900/30 transition-colors">
								<td class="px-5 py-3.5 font-mono text-zinc-400 whitespace-nowrap">
									{log.criado_em_formatado}
								</td>
								<td class="px-5 py-3.5 font-semibold text-zinc-200">
									<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono {log.acao.includes('LEMBRETE') ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' : 'bg-red-950/40 text-red-300 border border-red-800/40'}">
										{log.acao}
									</span>
								</td>
								<td class="px-5 py-3.5 text-zinc-400 font-mono">
									{log.entidade || 'Sistema'} {log.id_entidade ? `#${log.id_entidade}` : ''}
								</td>
								<td class="px-5 py-3.5 text-zinc-300">
									{log.nome_usuario || 'Job / Sistema'}
								</td>
								<td class="px-5 py-3.5 font-mono text-[11px] text-zinc-500">
									{log.ip || '-'}
								</td>
								<td class="px-5 py-3.5 text-right">
									{#if log.dados_depois}
										<button
											type="button"
											onclick={() => alternarLog(log.id_log)}
											class="text-[11px] font-mono text-red-400 hover:text-red-300 underline cursor-pointer"
										>
											{logExpandido === log.id_log ? 'Ocultar' : 'Ver payload'}
										</button>
									{:else}
										<span class="text-zinc-600">-</span>
									{/if}
								</td>
							</tr>

							{#if logExpandido === log.id_log && log.dados_depois}
								<tr class="bg-zinc-900/60">
									<td colspan="6" class="px-5 py-3">
										<pre class="p-3 rounded-lg bg-black/80 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">{typeof log.dados_depois === 'string' ? log.dados_depois : JSON.stringify(log.dados_depois, null, 2)}</pre>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
