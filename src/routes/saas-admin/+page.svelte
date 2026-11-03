<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Activity,
		Users,
		Building2,
		Database,
		Cpu,
		Clock,
		Radio,
		PowerOff,
		CheckCircle2,
		AlertCircle,
		ChevronDown,
		ChevronRight,
		ShieldCheck
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Controle de Accordions do Radar
	// Usamos um Set reativo (ou Map) com os IDs das academias abertas; 'saas' é a chave para a plataforma SaaS
	let accordionsAbertos = $state<Record<string, boolean>>({
		saas: true // SaaS aberto por padrão se houver sessão ou para destaque
	});

	function alternarAccordion(chave: string) {
		accordionsAbertos[chave] = !accordionsAbertos[chave];
	}

	function expandirTodos() {
		const novo: Record<string, boolean> = { saas: true };
		data.academias.forEach((a) => {
			novo[String(a.id_academia)] = true;
		});
		accordionsAbertos = novo;
	}

	function recolherTodos() {
		accordionsAbertos = {};
	}

	// Agrupamento derivado das sessões ativas
	let sessoesSaas = $derived(data.sessoesAtivas.filter((s) => s.tipo === 'saas'));
	let mapaSessoesPorAcademia = $derived.by(() => {
		const mapa = new Map<number, typeof data.sessoesAtivas>();
		for (const sessao of data.sessoesAtivas) {
			if (sessao.tipo === 'academia' && sessao.id_academia !== null) {
				if (!mapa.has(sessao.id_academia)) {
					mapa.set(sessao.id_academia, []);
				}
				mapa.get(sessao.id_academia)!.push(sessao);
			}
		}
		return mapa;
	});

	function formatarSegundos(segundos: number): string {
		const dias = Math.floor(segundos / 86400);
		const horas = Math.floor((segundos % 86400) / 3600);
		const min = Math.floor((segundos % 3600) / 60);
		if (dias > 0) return `${dias}d ${horas}h ${min}m`;
		if (horas > 0) return `${horas}h ${min}m`;
		return `${min}m ${segundos % 60}s`;
	}
</script>

<svelte:head>
	<title>SGT Manager • Monitoramento & Radar Global</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER DA PÁGINA -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-6">
		<div>
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-xs font-mono mb-2">
				<Radio class="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
				<span>🧠 Shin (Mente / Sistema) • Observabilidade em Tempo Real</span>
			</div>
			<h1 class="text-2xl font-extrabold text-white tracking-tight font-display">
				Monitoramento & Radar da Plataforma
			</h1>
			<p class="text-xs text-zinc-400 mt-1">
				Telemetria do servidor, saúde do banco de dados e controle de sessões ativas de todas as academias
			</p>
		</div>
	</div>

	{#if form?.sucesso}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
			<span>{form.mensagem}</span>
		</div>
	{/if}

	{#if form?.erro}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
			<span>{form.erro}</span>
		</div>
	{/if}

	<!-- CARDS DE TELEMETRIA GERAL -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Academias Totais -->
		<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900">
			<div class="flex items-center justify-between mb-3 text-zinc-400">
				<span class="text-xs font-mono uppercase">Academias</span>
				<Building2 class="w-4 h-4 text-indigo-400" />
			</div>
			<div class="text-2xl font-bold text-white font-display">
				{data.telemetriaBanco.tabelasContagem.academias}
			</div>
			<span class="text-[11px] text-zinc-500 font-mono mt-1 block">
				{data.academias.filter((a) => a.ativa).length} ativas na plataforma
			</span>
		</div>

		<!-- Usuários Globais -->
		<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900">
			<div class="flex items-center justify-between mb-3 text-zinc-400">
				<span class="text-xs font-mono uppercase">Usuários Totais</span>
				<Users class="w-4 h-4 text-amber-400" />
			</div>
			<div class="text-2xl font-bold text-white font-display">
				{data.telemetriaBanco.tabelasContagem.usuarios}
			</div>
			<span class="text-[11px] text-zinc-500 font-mono mt-1 block">
				{data.telemetriaBanco.tabelasContagem.presencasTreino} chamadas registradas
			</span>
		</div>

		<!-- Sessões Online -->
		<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900">
			<div class="flex items-center justify-between mb-3 text-zinc-400">
				<span class="text-xs font-mono uppercase">Sessões Online</span>
				<Activity class="w-4 h-4 text-emerald-400" />
			</div>
			<div class="text-2xl font-bold text-white font-display flex items-center gap-2">
				<span>{data.sessoesAtivas.length}</span>
				{#if data.sessoesAtivas.length > 0}
					<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
				{/if}
			</div>
			<span class="text-[11px] text-zinc-500 font-mono mt-1 block">
				Usuários navegando agora
			</span>
		</div>

		<!-- Saúde do Banco -->
		<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900">
			<div class="flex items-center justify-between mb-3 text-zinc-400">
				<span class="text-xs font-mono uppercase">MySQL Latência</span>
				<Database class="w-4 h-4 text-blue-400" />
			</div>
			<div class="text-2xl font-bold text-white font-display">
				{data.telemetriaBanco.latenciaPingMs} <span class="text-xs text-zinc-500 font-mono">ms</span>
			</div>
			<span class="text-[11px] text-zinc-500 font-mono mt-1 block">
				Tamanho: {data.telemetriaBanco.tamanhoBancoMb} MB
			</span>
		</div>
	</div>

	<!-- PAINEL DE INFRAESTRUTURA & SAÚDE DO SERVIDOR (VM / NODE.JS) -->
	<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
		<div class="flex items-center justify-between border-b border-zinc-900 pb-3">
			<div class="flex items-center gap-2">
				<Cpu class="w-4 h-4 text-indigo-400" />
				<h3 class="text-sm font-bold text-white uppercase font-mono tracking-wider">
					Saúde da Máquina Virtual & Processo Node.js
				</h3>
			</div>
			<span class="text-[11px] font-mono text-zinc-400">
				Node: <strong class="text-white">{data.telemetriaServidor.nodeVersion}</strong> ({data.telemetriaServidor.ambiente})
			</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono">
			<!-- Uptime -->
			<div class="space-y-1">
				<span class="text-zinc-500 flex items-center gap-1.5">
					<Clock class="w-3.5 h-3.5" /> Uptime
				</span>
				<p class="text-zinc-200 font-bold">
					App: {formatarSegundos(data.telemetriaServidor.uptimeNodeSegundos)}
				</p>
				<p class="text-zinc-500 text-[11px]">
					SO/VM: {formatarSegundos(data.telemetriaServidor.uptimeOsSegundos)}
				</p>
			</div>

			<!-- Memória RAM Node.js -->
			<div class="space-y-1">
				<span class="text-zinc-500">Memória RAM (Processo Node)</span>
				<p class="text-zinc-200 font-bold">
					{data.telemetriaServidor.memoriaNodeMb.heapUsed} MB <span class="text-zinc-500">usados de {data.telemetriaServidor.memoriaNodeMb.heapTotal} MB</span>
				</p>
				<p class="text-zinc-500 text-[11px]">
					RSS Total: {data.telemetriaServidor.memoriaNodeMb.rss} MB
				</p>
			</div>

			<!-- Memória RAM da VM -->
			<div class="space-y-1">
				<span class="text-zinc-500">Memória RAM (Sistema Operacional)</span>
				<div class="flex items-center justify-between text-zinc-200 font-bold">
					<span>{data.telemetriaServidor.memoriaOsMb.percentualUso}% em uso</span>
					<span class="text-zinc-400 font-normal">{data.telemetriaServidor.memoriaOsMb.total - data.telemetriaServidor.memoriaOsMb.livre} / {data.telemetriaServidor.memoriaOsMb.total} MB</span>
				</div>
				<div class="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
					<div
						class="h-full bg-indigo-500 transition-all duration-500"
						style={`width: ${data.telemetriaServidor.memoriaOsMb.percentualUso}%`}
					></div>
				</div>
			</div>
		</div>
	</div>

	<!-- RADAR DE SESSÕES ATIVAS COM PASTAS / ACCORDIONS POR ACADEMIA E SAAS -->
	<div class="rounded-2xl bg-zinc-950 border border-zinc-900 overflow-hidden space-y-4 p-5">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-900 pb-4">
			<div class="flex items-center gap-2">
				<Radio class="w-4 h-4 text-emerald-400 animate-pulse" />
				<h3 class="text-sm font-bold text-white font-display">
					Radar de Sessões Ativas (Pastas por Unidade & Plataforma)
				</h3>
			</div>
			<div class="flex items-center gap-3">
				<span class="text-xs font-mono text-zinc-400">
					Total geral: <strong class="text-emerald-400">{data.sessoesAtivas.length}</strong> sessão(ões) ativa(s)
				</span>
				<div class="flex items-center gap-1.5 text-xs font-mono">
					<button
						type="button"
						onclick={expandirTodos}
						class="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
					>
						Expandir Todas
					</button>
					<button
						type="button"
						onclick={recolherTodos}
						class="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
					>
						Recolher
					</button>
				</div>
			</div>
		</div>

		<!-- 1. ACCORDION / PASTA PLATAFORMA SAAS (SUPER ADMINS) -->
		<div class="rounded-xl border border-indigo-900/40 bg-zinc-900/30 overflow-hidden transition-all">
			<button
				type="button"
				onclick={() => alternarAccordion('saas')}
				class="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-indigo-950/20 transition-colors cursor-pointer"
			>
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
						<ShieldCheck class="w-4 h-4" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<span class="text-sm font-bold text-white font-display">Plataforma SaaS (Control Plane)</span>
							<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
								Super Admins
							</span>
						</div>
						<span class="text-[11px] text-zinc-400 font-mono">
							Acessos globais de gestão, infraestrutura e observabilidade
						</span>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<span class="px-2.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 {sessoesSaas.length > 0 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}">
						{#if sessoesSaas.length > 0}
							<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
						{/if}
						{sessoesSaas.length} online
					</span>
					{#if accordionsAbertos['saas']}
						<ChevronDown class="w-4 h-4 text-zinc-400" />
					{:else}
						<ChevronRight class="w-4 h-4 text-zinc-400" />
					{/if}
				</div>
			</button>

			{#if accordionsAbertos['saas']}
				<div class="border-t border-zinc-900 bg-zinc-950/60">
					{#if sessoesSaas.length === 0}
						<div class="p-6 text-center text-zinc-500 text-xs font-mono">
							Nenhum Super Admin conectado no momento no Control Plane.
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full text-left text-xs">
								<thead class="bg-zinc-900/60 border-b border-zinc-900 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
									<tr>
										<th class="px-4 py-2.5">Super Admin</th>
										<th class="px-4 py-2.5">Endereço IP</th>
										<th class="px-4 py-2.5">Navegador / User Agent</th>
										<th class="px-4 py-2.5">Login Em</th>
										<th class="px-4 py-2.5">Expira Em</th>
										<th class="px-4 py-2.5 text-right">Ação</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-900/80">
									{#each sessoesSaas as sessao}
										<tr class="hover:bg-zinc-900/40 transition-colors">
											<td class="px-4 py-2.5">
												<span class="font-bold text-white block">{sessao.nome_usuario}</span>
												<span class="text-[11px] text-zinc-500 font-mono">{sessao.email_usuario}</span>
											</td>
											<td class="px-4 py-2.5 font-mono text-zinc-300">
												{sessao.ip || 'Local / Interno'}
											</td>
											<td class="px-4 py-2.5 text-[11px] text-zinc-400 max-w-xs truncate" title={sessao.user_agent || ''}>
												{sessao.user_agent || 'N/D'}
											</td>
											<td class="px-4 py-2.5 font-mono text-zinc-400">
												{sessao.criado_em}
											</td>
											<td class="px-4 py-2.5 font-mono text-amber-400">
												{sessao.expira_em} ({sessao.minutos_restantes}m)
											</td>
											<td class="px-4 py-2.5 text-right">
												<form method="POST" action="?/encerrarSessao" use:enhance>
													<input type="hidden" name="idSessao" value={sessao.id_sessao} />
													<input type="hidden" name="tipo" value="saas" />
													<button
														type="submit"
														class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 text-[11px] font-medium transition-colors cursor-pointer"
														title="Desconectar Super Admin imediatamente"
													>
														<PowerOff class="w-3 h-3" />
														<span>Kick</span>
													</button>
												</form>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- 2. ACCORDIONS / PASTAS POR ACADEMIA -->
		<div class="space-y-3">
			{#each data.academias as academia}
				{@const sessoesDaAcademia = mapaSessoesPorAcademia.get(academia.id_academia) || []}
				{@const isOpen = accordionsAbertos[String(academia.id_academia)]}

				<div class="rounded-xl border border-zinc-900 bg-zinc-900/20 overflow-hidden transition-all">
					<button
						type="button"
						onclick={() => alternarAccordion(String(academia.id_academia))}
						class="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-zinc-900/40 transition-colors cursor-pointer"
					>
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
								<Building2 class="w-4 h-4" />
							</div>
							<div>
								<div class="flex items-center gap-2">
									<span class="text-sm font-bold text-white font-display">{academia.nome}</span>
									<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
										#{academia.id_academia}
									</span>
									{#if !academia.ativa}
										<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-400 border border-red-800/60">
											Desativada
										</span>
									{/if}
								</div>
								<span class="text-[11px] text-zinc-500 font-mono">
									CNPJ: {academia.cnpj} • Total de alunos: {academia.total_alunos}
								</span>
							</div>
						</div>

						<div class="flex items-center gap-3">
							<span class="px-2.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 {sessoesDaAcademia.length > 0 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-zinc-900/60 text-zinc-500 border border-zinc-800'}">
								{#if sessoesDaAcademia.length > 0}
									<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
								{/if}
								{sessoesDaAcademia.length} online
							</span>
							{#if isOpen}
								<ChevronDown class="w-4 h-4 text-zinc-400" />
							{:else}
								<ChevronRight class="w-4 h-4 text-zinc-400" />
							{/if}
						</div>
					</button>

					{#if isOpen}
						<div class="border-t border-zinc-900 bg-zinc-950/60">
							{#if sessoesDaAcademia.length === 0}
								<div class="p-6 text-center text-zinc-500 text-xs font-mono">
									Nenhum usuário desta academia conectado no momento.
								</div>
							{:else}
								<div class="overflow-x-auto">
									<table class="w-full text-left text-xs">
										<thead class="bg-zinc-900/60 border-b border-zinc-900 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
											<tr>
												<th class="px-4 py-2.5">Usuário</th>
												<th class="px-4 py-2.5">Endereço IP</th>
												<th class="px-4 py-2.5">Dispositivo / User Agent</th>
												<th class="px-4 py-2.5">Login Em</th>
												<th class="px-4 py-2.5">Expira Em</th>
												<th class="px-4 py-2.5 text-right">Ação</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-zinc-900/80">
											{#each sessoesDaAcademia as sessao}
												<tr class="hover:bg-zinc-900/40 transition-colors">
													<td class="px-4 py-2.5">
														<span class="font-bold text-white block">{sessao.nome_usuario}</span>
														<span class="text-[11px] text-zinc-500 font-mono">{sessao.email_usuario}</span>
													</td>
													<td class="px-4 py-2.5 font-mono text-zinc-300">
														{sessao.ip || 'Local / Interno'}
													</td>
													<td class="px-4 py-2.5 text-[11px] text-zinc-400 max-w-xs truncate" title={sessao.user_agent || ''}>
														{sessao.user_agent || 'N/D'}
													</td>
													<td class="px-4 py-2.5 font-mono text-zinc-400">
														{sessao.criado_em}
													</td>
													<td class="px-4 py-2.5 font-mono text-amber-400">
														{sessao.expira_em} ({sessao.minutos_restantes}m)
													</td>
													<td class="px-4 py-2.5 text-right">
														<form method="POST" action="?/encerrarSessao" use:enhance>
															<input type="hidden" name="idSessao" value={sessao.id_sessao} />
															<input type="hidden" name="tipo" value="academia" />
															<button
																type="submit"
																class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 text-[11px] font-medium transition-colors cursor-pointer"
																title="Desconectar usuário imediatamente"
															>
																<PowerOff class="w-3 h-3" />
																<span>Kick</span>
															</button>
														</form>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

