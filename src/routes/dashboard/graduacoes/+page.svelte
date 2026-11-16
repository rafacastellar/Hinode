<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import { obterRotuloOrigemGraduacao } from '#lib/dominio/graduacao';
	import { obterIndiceFaixa } from '#lib/dominio/campeonato';
	import { extrairNumeroDan } from '#lib/dominio/ordenacao-atletas';
	import {
		Award,
		Plus,
		Calendar,
		Users,
		ArrowRight,
		History,
		CheckCircle2,
		Search,
		FileSpreadsheet,
		Filter,
		X
	} from '@lucide/svelte';

	let { data }: PageProps = $props();

	// Navegação controlada exclusivamente pela Sidebar Lateral (?aba=exames | exames-historico | historico | censo)
	const abaUrl = $derived(page.url.searchParams.get('aba'));
	let subMenuAtivo = $state<'exames' | 'exames-historico' | 'historico' | 'censo'>('exames');

	$effect(() => {
		if (
			abaUrl === 'exames-historico' ||
			abaUrl === 'historico' ||
			abaUrl === 'censo' ||
			abaUrl === 'exames'
		) {
			subMenuAtivo = abaUrl;
		} else {
			subMenuAtivo = 'exames';
		}
	});

	// ============================================================================
	// EXAMES & CERIMÔNIAS (ATUAIS / EXERCÍCIO VS HISTÓRICO PASSADO)
	// ============================================================================
	const anoAtual = new Date().getFullYear();
	let filtroAnoPassado = $state<string>('todos');

	function extrairAnoEvento(ev: { data_inicio_iso?: string | null; data_inicio?: string | null }): number {
		if (ev.data_inicio_iso && ev.data_inicio_iso.length >= 4) {
			const n = parseInt(ev.data_inicio_iso.slice(0, 4), 10);
			if (!isNaN(n)) return n;
		}
		if (ev.data_inicio && ev.data_inicio.length >= 10) {
			const partes = ev.data_inicio.split('/');
			if (partes.length === 3) {
				const n = parseInt(partes[2], 10);
				if (!isNaN(n)) return n;
			}
		}
		return anoAtual;
	}

	const eventosAtuais = $derived(
		data.eventos.filter((ev) => extrairAnoEvento(ev) >= anoAtual)
	);

	const eventosPassados = $derived(
		data.eventos.filter((ev) => extrairAnoEvento(ev) < anoAtual)
	);

	const anosPassadosDisponiveis = $derived(
		Array.from(new Set(eventosPassados.map((ev) => extrairAnoEvento(ev)))).sort((a, b) => b - a)
	);

	const eventosExibidos = $derived.by(() => {
		if (subMenuAtivo === 'exames') return eventosAtuais;
		if (filtroAnoPassado === 'todos') return eventosPassados;
		const anoAlvo = parseInt(filtroAnoPassado, 10);
		return eventosPassados.filter((ev) => extrairAnoEvento(ev) === anoAlvo);
	});

	// ============================================================================
	// HOMOLOGAÇÕES & PRONTUÁRIOS (LIMPO + PESQUISA / PERÍODO)
	// ============================================================================
	let buscaAluno = $state('');
	let mostrarTodosAlunos = $state(false);

	const alunosFiltrados = $derived.by(() => {
		const termo = buscaAluno.trim().toLowerCase();
		if (!termo && !mostrarTodosAlunos) return [];
		if (!termo && mostrarTodosAlunos) return data.alunosDojo;
		return data.alunosDojo.filter(
			(a) =>
				a.nome.toLowerCase().includes(termo) ||
				(a.matricula && a.matricula.toLowerCase().includes(termo)) ||
				a.graduacao_atual.toLowerCase().includes(termo)
		);
	});

	let buscaHistorico = $state('');
	let dataPeriodoInicio = $state('');
	let dataPeriodoFim = $state('');
	let mostrarTodasGraduacoes = $state(false);

	function brParaIso(dataBr: string | null | undefined): string {
		if (!dataBr) return '';
		const partes = dataBr.trim().split('/');
		if (partes.length === 3) {
			return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
		}
		return dataBr.slice(0, 10);
	}

	const temFiltroHistoricoAtivo = $derived(
		Boolean(buscaHistorico.trim() || dataPeriodoInicio || dataPeriodoFim)
	);

	const graduacoesFiltradas = $derived.by(() => {
		const termo = buscaHistorico.trim().toLowerCase();

		const filtradas = data.graduacoes.filter((item) => {
			if (termo) {
				const bateTexto =
					item.nome_aluno.toLowerCase().includes(termo) ||
					item.faixa.toLowerCase().includes(termo) ||
					item.nome_professor_homologador.toLowerCase().includes(termo) ||
					(item.nome_evento && item.nome_evento.toLowerCase().includes(termo)) ||
					(item.descricao_origem && item.descricao_origem.toLowerCase().includes(termo));
				if (!bateTexto) return false;
			}

			if (dataPeriodoInicio || dataPeriodoFim) {
				const iso = brParaIso(item.data_graduacao);
				if (dataPeriodoInicio && iso < dataPeriodoInicio) return false;
				if (dataPeriodoFim && iso > dataPeriodoFim) return false;
			}

			return true;
		});

		if (!temFiltroHistoricoAtivo && !mostrarTodasGraduacoes) {
			return filtradas.slice(0, 5);
		}
		return filtradas;
	});

	function limparFiltrosHistorico() {
		buscaHistorico = '';
		dataPeriodoInicio = '';
		dataPeriodoFim = '';
		mostrarTodasGraduacoes = false;
	}

	// ============================================================================
	// CENSO DE FAIXAS
	// ============================================================================
	const distribuicaoOrdenada = $derived(
		[...data.distribuicao].sort((a, b) => {
			const diffFaixa = obterIndiceFaixa(a.faixa) - obterIndiceFaixa(b.faixa);
			if (diffFaixa !== 0) return diffFaixa;
			return extrairNumeroDan(a.faixa) - extrairNumeroDan(b.faixa);
		})
	);

	const totalAlunosGraduados = $derived(
		distribuicaoOrdenada.reduce((acc, item) => acc + item.total, 0)
	);
</script>

<svelte:head>
	<title>Graduações & Faixas - Judô Hinodê</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<!-- Cabeçalho no padrão "Meu Perfil" (sem menu horizontal superior; navegação via Sidebar) -->
	<div
		class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-900"
	>
		<div>
			<div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500">
				<Award class="w-3.5 h-3.5" />
				<span>Banca Técnica & Prontuários</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight text-white mt-1">
				Graduações & Exames de Faixa
			</h2>
			<p class="text-xs text-zinc-400 mt-1">
				Gerencie cerimônias de troca de faixa, consulte prontuários por pesquisa ou período e acompanhe o censo oficial CBJ/FPJ.
			</p>
		</div>

		{#if data.podeHomologar}
			<div class="flex flex-wrap items-center gap-2.5 shrink-0">
				<a
					href="/dashboard/graduacoes/novo"
					class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-amber-950/50 cursor-pointer"
				>
					<Calendar class="w-4 h-4" />
					<span>Novo Exame de Graduação</span>
				</a>
				<a
					href="/dashboard/graduacoes/nova"
					class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
				>
					<Plus class="w-4 h-4 text-red-400" />
					<span>Promoção Direta / Histórico</span>
				</a>
			</div>
		{/if}
	</div>

	<!-- ========================================================================= -->
	<!-- SUB-MENUS "EXAMES & CERIMÔNIAS" E "HISTÓRICO DE EXAMES"                   -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'exames' || subMenuAtivo === 'exames-historico'}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-200">
			<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div
						class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400"
					>
						{#if subMenuAtivo === 'exames'}
							<Calendar class="w-4 h-4" />
						{:else}
							<History class="w-4 h-4" />
						{/if}
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							{subMenuAtivo === 'exames'
								? `Exames & Cerimônias — Exercício ${anoAtual}`
								: 'Histórico de Exames de Graduação'}
						</h3>
						<p class="text-[11px] text-zinc-500">
							{subMenuAtivo === 'exames'
								? `Exames agendados e realizados no exercício atual (${anoAtual})`
								: 'Arquivo histórico de exames encerrados de anos anteriores'}
						</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<span class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
						{eventosExibidos.length} {eventosExibidos.length === 1 ? 'exame' : 'exames'}
					</span>

					{#if subMenuAtivo === 'exames-historico' && anosPassadosDisponiveis.length > 0}
						<select
							bind:value={filtroAnoPassado}
							class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-600"
						>
							<option value="todos">Todos os anos</option>
							{#each anosPassadosDisponiveis as ano}
								<option value={String(ano)}>Exercício {ano}</option>
							{/each}
						</select>
					{/if}
				</div>
			</div>

			{#if eventosExibidos.length === 0}
				<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center space-y-3">
					{#if subMenuAtivo === 'exames'}
						<Calendar class="w-8 h-8 text-zinc-600 mx-auto" />
					{:else}
						<History class="w-8 h-8 text-zinc-600 mx-auto" />
					{/if}
					<div class="space-y-1">
						<p class="text-sm font-semibold text-zinc-300">
							{subMenuAtivo === 'exames'
								? `Nenhum exame agendado ou do exercício ${anoAtual}`
								: 'Nenhum exame passado encontrado no histórico'}
						</p>
						<p class="text-xs text-zinc-500 max-w-md mx-auto">
							{#if subMenuAtivo === 'exames' && data.podeHomologar}
								Crie um novo evento de exame para convocar candidatos elegíveis, registrar notas da banca e homologar faixas em lote.
							{:else}
								Os exames já encerrados de anos anteriores ficam arquivados nesta guia para consulta de auditoria.
							{/if}
						</p>
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each eventosExibidos as ev}
						<a
							href="/dashboard/graduacoes/{ev.id_evento}"
							class="group p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-700/60 transition-all flex flex-col justify-between gap-4"
						>
							<div class="space-y-2.5">
								<div class="flex items-center justify-between gap-2">
									<span
										class="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border {ev.status ===
										'Realizado'
											? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
											: ev.status === 'Agendado' || ev.status === 'Em Andamento'
												? 'bg-amber-950/60 border-amber-800/60 text-amber-300'
												: 'bg-zinc-900 border-zinc-800 text-zinc-400'}"
									>
										{ev.status || 'Agendado'}
									</span>
									<span class="text-xs font-mono text-zinc-400">
										{ev.data_inicio}
									</span>
								</div>

								<h4
									class="text-sm font-bold text-white group-hover:text-amber-400 transition-colors"
								>
									{ev.nome}
								</h4>

								<div class="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
									<span>
										Faixas: <strong class="text-zinc-200">{ev.faixa_inicio}</strong> a
										<strong class="text-zinc-200">{ev.faixa_fim}</strong>
									</span>
									{#if ev.cidade}
										<span>• {ev.cidade}/{ev.uf}</span>
									{/if}
								</div>
							</div>

							<div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
								<div class="flex items-center gap-3 text-zinc-400">
									<span>
										<strong class="text-white font-mono">{ev.total_inscritos}</strong> inscritos
									</span>
									{#if ev.total_homologados > 0}
										<span class="text-emerald-400 flex items-center gap-1">
											<CheckCircle2 class="w-3.5 h-3.5" />
											{ev.total_homologados} homologados
										</span>
									{/if}
								</div>
								<span
									class="inline-flex items-center gap-1 font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform"
								>
									<span>Gerenciar Banca</span>
									<ArrowRight class="w-3.5 h-3.5" />
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- SUB-MENU "HOMOLOGAÇÕES & PRONTUÁRIOS"                                     -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'historico'}
		<div class="space-y-6 animate-in fade-in duration-200">
			<!-- Card 1: Busca Limpa de Prontuários Individuais -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-lg bg-sky-950/50 border border-sky-900/50 flex items-center justify-center text-sky-400"
						>
							<FileSpreadsheet class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Prontuários Individuais & Importação de Histórico
							</h3>
							<p class="text-[11px] text-zinc-500">
								Pesquise um judoca por nome, matrícula ou faixa, ou clique em "Listar Todos"
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (mostrarTodosAlunos = !mostrarTodosAlunos)}
						class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 transition-colors cursor-pointer"
					>
						{mostrarTodosAlunos
							? 'Recolher Lista'
							: `Listar Todos (${data.alunosDojo.length})`}
					</button>
				</div>

				<div class="relative">
					<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						bind:value={buscaAluno}
						placeholder="Digite o nome do judoca, matrícula ou faixa para localizar o prontuário..."
						class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
					/>
					{#if buscaAluno}
						<button
							type="button"
							onclick={() => (buscaAluno = '')}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
							title="Limpar pesquisa"
						>
							<X class="w-4 h-4" />
						</button>
					{/if}
				</div>

				{#if !buscaAluno.trim() && !mostrarTodosAlunos}
					<div class="p-5 rounded-xl bg-zinc-900/25 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
						Use o campo de pesquisa acima para abrir rapidamente a linha do tempo de um judoca, ou clique em <strong class="text-zinc-300">Listar Todos</strong>.
					</div>
				{:else if alunosFiltrados.length === 0}
					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-900 text-center text-xs text-zinc-500">
						Nenhum judoca encontrado para "{buscaAluno}".
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each alunosFiltrados as aluno}
							<div
								class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between gap-3"
							>
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<div class="text-xs font-bold text-white truncate">{aluno.nome}</div>
										<div class="text-[11px] text-zinc-500 font-mono mt-0.5">
											{aluno.idade} anos
											{#if aluno.matricula}
												• Mat. {aluno.matricula}
											{/if}
										</div>
									</div>
									<BadgeFaixa faixa={aluno.graduacao_atual} size="sm" />
								</div>

								<div class="pt-2.5 border-t border-zinc-800/70 flex items-center justify-between gap-2">
									<a
										href="/dashboard/graduacoes/historico/{aluno.id_usuario}"
										class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
									>
										<History class="w-3.5 h-3.5" />
										<span>Linha do Tempo / Importar</span>
									</a>
									{#if data.podeHomologar}
										<a
											href="/dashboard/graduacoes/nova?alunoId={aluno.id_usuario}"
											class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-semibold text-zinc-300"
										>
											<Plus class="w-3 h-3 text-red-400" />
											<span>Promover</span>
										</a>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Card 2: Registro Cronológico de Promoções do Dojo -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400"
						>
							<History class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Registro Cronológico de Promoções do Dojo
							</h3>
							<p class="text-[11px] text-zinc-500">
								Exibição enxuta por padrão — pesquise por nome/faixa, filtre por período ou carregue todos
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span
							class="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400"
						>
							Exibindo {graduacoesFiltradas.length} de {data.graduacoes.length}
						</span>
						{#if data.graduacoes.length > 5 && !temFiltroHistoricoAtivo}
							<button
								type="button"
								onclick={() => (mostrarTodasGraduacoes = !mostrarTodasGraduacoes)}
								class="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 transition-colors cursor-pointer"
							>
								{mostrarTodasGraduacoes ? 'Mostrar Apenas 5' : 'Carregar Todos'}
							</button>
						{/if}
					</div>
				</div>

				<!-- Barra de Pesquisa + Filtro por Período -->
				<div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
					<div class="md:col-span-6 space-y-1">
						<label
							for="busca-historico-promocoes"
							class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500"
						>
							Pesquisar (Judoca, Faixa, Examinador ou Origem)
						</label>
						<div class="relative">
							<Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								id="busca-historico-promocoes"
								type="text"
								bind:value={buscaHistorico}
								placeholder="Ex.: Rafael, Faixa Azul, Exame..."
								class="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
							/>
						</div>
					</div>

					<div class="md:col-span-3 space-y-1">
						<label
							for="periodo-inicio"
							class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500"
						>
							Período (De)
						</label>
						<input
							id="periodo-inicio"
							type="date"
							bind:value={dataPeriodoInicio}
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						/>
					</div>

					<div class="md:col-span-3 space-y-1">
						<label
							for="periodo-fim"
							class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500"
						>
							Período (Até)
						</label>
						<div class="flex items-center gap-2">
							<input
								id="periodo-fim"
								type="date"
								bind:value={dataPeriodoFim}
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
							/>
							{#if temFiltroHistoricoAtivo || mostrarTodasGraduacoes}
								<button
									type="button"
									onclick={limparFiltrosHistorico}
									class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer shrink-0"
									title="Limpar filtros"
								>
									<Filter class="w-3.5 h-3.5" />
								</button>
							{/if}
						</div>
					</div>
				</div>

				{#if graduacoesFiltradas.length === 0}
					<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center text-xs text-zinc-500">
						{data.graduacoes.length === 0
							? 'Nenhuma promoção de faixa registrada no histórico até o momento.'
							: 'Nenhum registro encontrado para os filtros informados.'}
					</div>
				{:else}
					<div class="rounded-xl border border-zinc-900 overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full text-left border-collapse">
								<thead>
									<tr
										class="border-b border-zinc-900 bg-zinc-900/40 text-[11px] font-mono uppercase tracking-wider text-zinc-500"
									>
										<th class="py-3 px-4">Data</th>
										<th class="py-3 px-4">Judoca</th>
										<th class="py-3 px-4">Graduação Outorgada</th>
										<th class="py-3 px-4 hidden md:table-cell">Origem / Cerimônia</th>
										<th class="py-3 px-4 hidden sm:table-cell">Sensei / Examinador</th>
										<th class="py-3 px-4 text-right">Prontuário</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-900 text-sm">
									{#each graduacoesFiltradas as item}
										{@const infoOrigem = obterRotuloOrigemGraduacao(item.origem_registro)}
										<tr class="hover:bg-zinc-900/30 transition-colors">
											<td class="py-3.5 px-4 text-xs font-mono text-zinc-400 whitespace-nowrap">
												{item.data_graduacao}
											</td>
											<td class="py-3.5 px-4 font-semibold text-white">
												{item.nome_aluno}
											</td>
											<td class="py-3.5 px-4">
												<BadgeFaixa faixa={item.faixa} size="sm" />
											</td>
											<td class="py-3.5 px-4 text-xs text-zinc-400 hidden md:table-cell">
												<div class="flex flex-wrap items-center gap-1.5">
													<span class="px-2 py-0.5 rounded border text-[10px] font-mono {infoOrigem.classeBadge}">
														{infoOrigem.rotulo}
													</span>
													{#if item.descricao_origem}
														<span class="text-zinc-400 text-[11px]">{item.descricao_origem}</span>
													{:else if item.nome_evento}
														<span class="text-zinc-400 text-[11px]">{item.nome_evento}</span>
													{/if}
												</div>
											</td>
											<td class="py-3.5 px-4 text-xs text-zinc-400 hidden sm:table-cell">
												{item.nome_professor_homologador}
											</td>
											<td class="py-3.5 px-4 text-right">
												<a
													href="/dashboard/graduacoes/historico/{item.id_aluno}"
													class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 transition-colors"
												>
													<span>Linha do Tempo</span>
													<ArrowRight class="w-3 h-3" />
												</a>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- SUB-MENU "CENSO DE FAIXAS"                                                -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'censo'}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-200">
			<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div
						class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400"
					>
						<Users class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							Censo de Graduação do Dojo
						</h3>
						<p class="text-[11px] text-zinc-500">
							Distribuição oficial de judocas ativos por faixa (Ordem Hierárquica CBJ / FPJ)
						</p>
					</div>
				</div>
				<span
					class="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400"
				>
					{totalAlunosGraduados} Judocas no Censo
				</span>
			</div>

			{#if distribuicaoOrdenada.length === 0}
				<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center text-xs text-zinc-500">
					Nenhum judoca cadastrado no censo de faixas.
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
					{#each distribuicaoOrdenada as item}
						{@const percentual =
							totalAlunosGraduados > 0
								? Math.round((item.total / totalAlunosGraduados) * 100)
								: 0}
						<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-900 space-y-3">
							<div class="flex items-center justify-between gap-2">
								<BadgeFaixa faixa={item.faixa} size="sm" />
								<div class="text-right">
									<span class="text-lg font-bold font-mono text-white">{item.total}</span>
									<span class="text-[11px] font-mono text-zinc-500 ml-1">({percentual}%)</span>
								</div>
							</div>
							<div class="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
								<div
									class="h-full rounded-full bg-red-600 transition-all"
									style="width: {Math.max(4, percentual)}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
