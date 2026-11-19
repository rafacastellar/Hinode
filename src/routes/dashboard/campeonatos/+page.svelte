<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import {
		Trophy,
		Calendar,
		MapPin,
		Users,
		Award,
		PlusCircle,
		ArrowRight,
		Medal,
		Search,
		Filter,
		History,
		BarChart3,
		Swords,
		X
	} from '@lucide/svelte';
	import {
		correspondeClassificacaoAcademia,
		ehPodioOuCampeao,
		normalizarTexto
	} from '#lib/dominio/campeonato';
	import { obterStatusPeriodoInscricao } from '#lib/dominio/graduacao';

	let { data }: { data: PageData } = $props();

	// Navegação controlada exclusivamente pela Sidebar Lateral (?aba=proximos | historico | desempenho)
	const abaUrl = $derived(page.url.searchParams.get('aba'));
	let subMenuAtivo = $state<'proximos' | 'historico' | 'desempenho'>('proximos');

	$effect(() => {
		if (abaUrl === 'historico' || abaUrl === 'desempenho' || abaUrl === 'proximos') {
			subMenuAtivo = abaUrl;
		} else {
			subMenuAtivo = 'proximos';
		}
	});

	const hojeObj = new Date();
	const hojeIso = `${hojeObj.getFullYear()}-${String(hojeObj.getMonth() + 1).padStart(2, '0')}-${String(hojeObj.getDate()).padStart(2, '0')}`;
	const anoAtual = hojeObj.getFullYear();

	// ============================================================================
	// ABA 1: CAMPEONATOS (QUE VÃO ACONTECER / EM ABERTO)
	// ============================================================================
	const campeonatosProximos = $derived(
		[...data.campeonatos]
			.filter((c) => c.data_inicio_iso >= hojeIso)
			.sort((a, b) => a.data_inicio_iso.localeCompare(b.data_inicio_iso))
	);

	// ============================================================================
	// ABA 2: HISTÓRICO DE CAMPEONATOS (PASSADOS + PESQUISA + PERÍODO)
	// ============================================================================
	const campeonatosPassados = $derived(
		data.campeonatos.filter((c) => c.data_inicio_iso < hojeIso)
	);

	let buscaHistorico = $state('');
	let histDataInicio = $state('');
	let histDataFim = $state('');
	let histTipo = $state('todos');
	let mostrarTodosHistorico = $state(false);

	const tiposDisponiveis = $derived(
		Array.from(
			new Set(
				data.campeonatos
					.map((c) => c.tipo_campeonato)
					.filter((t): t is string => Boolean(t && t.trim()))
			)
		).sort()
	);

	const temFiltroHistoricoAtivo = $derived(
		Boolean(buscaHistorico.trim() || histDataInicio || histDataFim || histTipo !== 'todos')
	);

	const historicoFiltrado = $derived.by(() => {
		const termo = normalizarTexto(buscaHistorico);

		const filtrados = campeonatosPassados.filter((camp) => {
			if (histTipo !== 'todos' && camp.tipo_campeonato !== histTipo) return false;
			if (histDataInicio && camp.data_inicio_iso < histDataInicio) return false;
			if (histDataFim && camp.data_inicio_iso > histDataFim) return false;

			if (!termo) return true;
			return (
				normalizarTexto(camp.nome).includes(termo) ||
				normalizarTexto(camp.edicao).includes(termo) ||
				normalizarTexto(camp.cidade).includes(termo) ||
				normalizarTexto(camp.tipo_campeonato).includes(termo) ||
				correspondeClassificacaoAcademia(camp.classificacao_academia, termo)
			);
		});

		if (!temFiltroHistoricoAtivo && !mostrarTodosHistorico) {
			return filtrados.slice(0, 5);
		}
		return filtrados;
	});

	function limparFiltrosHistorico() {
		buscaHistorico = '';
		histDataInicio = '';
		histDataFim = '';
		histTipo = 'todos';
		mostrarTodosHistorico = false;
	}

	// ============================================================================
	// ABA 3: DESEMPENHO (SOMA TOTAL POR PADRÃO + FILTROS POR PERÍODO / TIPO)
	// ============================================================================
	let desempBusca = $state('');
	let desempDataInicio = $state('');
	let desempDataFim = $state('');
	let desempTipo = $state('todos');
	let desempApenasComMedalha = $state(false);

	function aplicarPresetPeriodo(preset: 'tudo' | 'ano_atual' | 'ano_passado' | '6_meses') {
		if (preset === 'tudo') {
			desempDataInicio = '';
			desempDataFim = '';
			return;
		}
		if (preset === 'ano_atual') {
			desempDataInicio = `${anoAtual}-01-01`;
			desempDataFim = `${anoAtual}-12-31`;
			return;
		}
		if (preset === 'ano_passado') {
			desempDataInicio = `${anoAtual - 1}-01-01`;
			desempDataFim = `${anoAtual - 1}-12-31`;
			return;
		}
		const seisMeses = new Date(hojeObj);
		seisMeses.setMonth(seisMeses.getMonth() - 6);
		desempDataInicio = `${seisMeses.getFullYear()}-${String(seisMeses.getMonth() + 1).padStart(2, '0')}-${String(seisMeses.getDate()).padStart(2, '0')}`;
		desempDataFim = hojeIso;
	}

	function limparFiltrosDesempenho() {
		desempBusca = '';
		desempDataInicio = '';
		desempDataFim = '';
		desempTipo = 'todos';
		desempApenasComMedalha = false;
	}

	function classificarMedalha(texto: string): 'ouro' | 'prata' | 'bronze' | null {
		const norm = normalizarTexto(texto);
		if (norm.includes('prata') || norm.includes('vice') || norm.includes('2o') || norm.includes('2º') || norm.includes('2°')) {
			return 'prata';
		}
		if (norm.includes('bronze') || norm.includes('3o') || norm.includes('3º') || norm.includes('3°')) {
			return 'bronze';
		}
		if (norm.includes('ouro') || norm.includes('campeao') || norm.includes('1o') || norm.includes('1º') || norm.includes('1°')) {
			return 'ouro';
		}
		return null;
	}

	// Visão Gestão (Dojo inteiro)
	const desempenhoDojoFiltrado = $derived.by(() => {
		const termo = normalizarTexto(desempBusca);
		return data.campeonatos.filter((camp) => {
			if (desempTipo !== 'todos' && camp.tipo_campeonato !== desempTipo) return false;
			if (desempDataInicio && camp.data_inicio_iso < desempDataInicio) return false;
			if (desempDataFim && camp.data_inicio_iso > desempDataFim) return false;
			if (desempApenasComMedalha && camp.total_medalhas === 0 && !ehPodioOuCampeao(camp.classificacao_academia)) {
				return false;
			}
			if (!termo) return true;
			return (
				normalizarTexto(camp.nome).includes(termo) ||
				normalizarTexto(camp.cidade).includes(termo) ||
				normalizarTexto(camp.tipo_campeonato).includes(termo) ||
				correspondeClassificacaoAcademia(camp.classificacao_academia, termo)
			);
		});
	});

	// Visão Pessoal (Aluno / Responsável)
	const desempenhoPessoalFiltrado = $derived.by(() => {
		const termo = normalizarTexto(desempBusca);
		return data.desempenhoPessoal.filter((item) => {
			if (desempTipo !== 'todos' && item.tipo_campeonato !== desempTipo) return false;
			if (desempDataInicio && item.data_inicio_iso < desempDataInicio) return false;
			if (desempDataFim && item.data_inicio_iso > desempDataFim) return false;
			if (desempApenasComMedalha && !classificarMedalha(item.classificacao_aluno)) return false;
			if (!termo) return true;
			return (
				normalizarTexto(item.nome_campeonato).includes(termo) ||
				normalizarTexto(item.nome_aluno).includes(termo) ||
				normalizarTexto(item.cidade).includes(termo) ||
				normalizarTexto(item.tipo_campeonato).includes(termo) ||
				normalizarTexto(item.classificacao_aluno).includes(termo)
			);
		});
	});

	const metricasDesempenho = $derived.by(() => {
		if (data.ehGestorOuProfessor) {
			const lista = desempenhoDojoFiltrado;
			const eventos = lista.length;
			const ouro = lista.reduce((a, c) => a + c.total_ouro, 0);
			const prata = lista.reduce((a, c) => a + c.total_prata, 0);
			const bronze = lista.reduce((a, c) => a + c.total_bronze, 0);
			const medalhas = lista.reduce((a, c) => a + c.total_medalhas, 0);
			const lutas = lista.reduce((a, c) => a + c.total_lutas, 0);
			const vitorias = lista.reduce((a, c) => a + c.total_vitorias, 0);
			const podiosAcademia = lista.filter((c) => ehPodioOuCampeao(c.classificacao_academia)).length;
			const aproveitamento = lutas > 0 ? Math.round((vitorias / lutas) * 100) : 0;

			return {
				eventos,
				ouro,
				prata,
				bronze,
				medalhas,
				lutas,
				vitorias,
				aproveitamento,
				podiosAcademia
			};
		}

		const lista = desempenhoPessoalFiltrado;
		const eventos = new Set(lista.map((i) => i.id_evento)).size;
		let ouro = 0;
		let prata = 0;
		let bronze = 0;
		let lutas = 0;
		let vitorias = 0;
		for (const item of lista) {
			const m = classificarMedalha(item.classificacao_aluno);
			if (m === 'ouro') ouro++;
			else if (m === 'prata') prata++;
			else if (m === 'bronze') bronze++;
			lutas += item.qtd_lutas;
			vitorias += item.qtd_vitorias;
		}
		const medalhas = ouro + prata + bronze;
		const aproveitamento = lutas > 0 ? Math.round((vitorias / lutas) * 100) : 0;

		return {
			eventos,
			ouro,
			prata,
			bronze,
			medalhas,
			lutas,
			vitorias,
			aproveitamento,
			podiosAcademia: 0
		};
	});

	const resumoPosicoesAcademia = $derived.by(() => {
		if (!data.ehGestorOuProfessor) {
			return {
				comClassificacao: 0,
				podios: 0,
				colocacoes: [] as { posicao: string; quantidade: number; ehPodio: boolean }[]
			};
		}

		const mapa = new Map<string, number>();
		let comClassificacao = 0;
		let podios = 0;

		for (const camp of desempenhoDojoFiltrado) {
			const pos = (camp.classificacao_academia ?? '').trim();
			if (!pos) continue;
			comClassificacao++;
			if (ehPodioOuCampeao(pos)) podios++;
			mapa.set(pos, (mapa.get(pos) ?? 0) + 1);
		}

		const colocacoes = Array.from(mapa.entries())
			.map(([posicao, quantidade]) => ({
				posicao,
				quantidade,
				ehPodio: ehPodioOuCampeao(posicao)
			}))
			.sort((a, b) => a.posicao.localeCompare(b.posicao, 'pt-BR', { numeric: true }));

		return { comClassificacao, podios, colocacoes };
	});

	const resumoPorTipo = $derived.by(() => {
		const mapa = new Map<
			string,
			{ tipo: string; eventos: number; ouro: number; prata: number; bronze: number; medalhas: number }
		>();

		if (data.ehGestorOuProfessor) {
			for (const c of desempenhoDojoFiltrado) {
				const tipo = c.tipo_campeonato || 'Não informado';
				const atual = mapa.get(tipo) ?? {
					tipo,
					eventos: 0,
					ouro: 0,
					prata: 0,
					bronze: 0,
					medalhas: 0
				};
				atual.eventos += 1;
				atual.ouro += c.total_ouro;
				atual.prata += c.total_prata;
				atual.bronze += c.total_bronze;
				atual.medalhas += c.total_medalhas;
				mapa.set(tipo, atual);
			}
		} else {
			const eventosPorTipo = new Map<string, Set<number>>();
			for (const item of desempenhoPessoalFiltrado) {
				const tipo = item.tipo_campeonato || 'Não informado';
				if (!eventosPorTipo.has(tipo)) eventosPorTipo.set(tipo, new Set());
				eventosPorTipo.get(tipo)!.add(item.id_evento);

				const atual = mapa.get(tipo) ?? {
					tipo,
					eventos: 0,
					ouro: 0,
					prata: 0,
					bronze: 0,
					medalhas: 0
				};
				const m = classificarMedalha(item.classificacao_aluno);
				if (m === 'ouro') {
					atual.ouro++;
					atual.medalhas++;
				} else if (m === 'prata') {
					atual.prata++;
					atual.medalhas++;
				} else if (m === 'bronze') {
					atual.bronze++;
					atual.medalhas++;
				}
				atual.eventos = eventosPorTipo.get(tipo)!.size;
				mapa.set(tipo, atual);
			}
		}

		return Array.from(mapa.values()).sort((a, b) => b.medalhas - a.medalhas || b.eventos - a.eventos);
	});
</script>

<svelte:head>
	<title>Campeonatos & Competições - Judô Hinodê</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<!-- Cabeçalho no padrão "Meu Perfil" (sem menu horizontal superior; navegação via Sidebar) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-900">
		<div>
			<div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500">
				<Trophy class="w-3.5 h-3.5" />
				<span>Rendimento & Competição</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight text-white mt-1">
				{#if subMenuAtivo === 'historico'}
					Histórico de Campeonatos
				{:else if subMenuAtivo === 'desempenho'}
					Desempenho em Campeonatos
				{:else}
					Campeonatos & Torneios
				{/if}
			</h2>
			<p class="text-xs text-zinc-400 mt-1">
				{#if subMenuAtivo === 'historico'}
					Pesquise torneios já realizados por nome, período ou tipo e abra a visualização completa do evento.
				{:else if subMenuAtivo === 'desempenho'}
					{data.ehGestorOuProfessor
						? 'Soma consolidada de medalhas, lutas e pódios do dojo com filtros por período e tipo de campeonato.'
						: 'Seu desempenho consolidado em campeonatos com filtros por período e tipo de torneio.'}
				{:else}
					Acompanhe os próximos campeonatos no calendário, prazos de inscrição e categorias permitidas.
				{/if}
			</p>
		</div>

		{#if data.podeCriarCampeonato}
			<a
				href="/dashboard/campeonatos/novo"
				class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-lg shadow-red-950/40 transition-all shrink-0"
			>
				<PlusCircle class="w-4 h-4" />
				<span>Cadastrar Campeonato</span>
			</a>
		{/if}
	</div>

	<!-- ========================================================================= -->
	<!-- SUB-MENU 1: CAMPEONATOS (PRÓXIMOS / QUE VÃO ACONTECER)                    -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'proximos'}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-200">
			<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400">
						<Trophy class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">Próximos Campeonatos</h3>
						<p class="text-[11px] text-zinc-500">
							Competições agendadas a partir de hoje ({hojeObj.toLocaleDateString('pt-BR')})
						</p>
					</div>
				</div>
				<span class="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
					{campeonatosProximos.length} {campeonatosProximos.length === 1 ? 'Campeonato' : 'Campeonatos'}
				</span>
			</div>

			{#if campeonatosProximos.length === 0}
				<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center space-y-3">
					<Trophy class="w-8 h-8 text-zinc-600 mx-auto" />
					<div class="space-y-1">
						<p class="text-sm font-semibold text-zinc-300">
							Nenhum campeonato futuro agendado no momento
						</p>
						<p class="text-xs text-zinc-500 max-w-md mx-auto">
							{#if data.podeCriarCampeonato}
								Cadastre um novo torneio no botão acima ou consulte eventos anteriores na aba Histórico de Campeonatos.
							{:else}
								Quando o Sensei publicar um novo torneio no calendário do dojo, ele aparecerá aqui para inscrição.
							{/if}
						</p>
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each campeonatosProximos as camp}
						{@const statusInscricao = obterStatusPeriodoInscricao(
							camp.data_inicio_inscricao_iso,
							camp.data_fim_inscricao_iso
						)}
						<a
							href="/dashboard/campeonatos/{camp.id_evento}"
							class="group p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-red-700/60 transition-all flex flex-col justify-between gap-4"
						>
							<div class="space-y-3">
								<div class="flex items-center justify-between gap-2 flex-wrap">
									<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border {statusInscricao.classeCor}">
										{statusInscricao.rotulo}
									</span>
									{#if camp.tipo_campeonato}
										<span class="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono uppercase text-zinc-300">
											{camp.tipo_campeonato}
										</span>
									{/if}
								</div>

								<div>
									<h4 class="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
										{camp.nome}
										{#if camp.edicao}
											<span class="text-zinc-500 font-mono text-xs font-normal ml-1">({camp.edicao})</span>
										{/if}
									</h4>
								</div>

								<div class="grid grid-cols-2 gap-2 text-xs text-zinc-400">
									<div class="flex items-center gap-1.5">
										<Calendar class="w-3.5 h-3.5 text-red-500 shrink-0" />
										<span class="font-mono text-zinc-200">{camp.data_inicio}</span>
									</div>
									<div class="flex items-center gap-1.5">
										<MapPin class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
										<span class="truncate">{camp.cidade}/{camp.uf}</span>
									</div>
								</div>

								<div class="text-[11px] text-zinc-400 flex flex-wrap items-center gap-2">
									<span>
										Faixas: <strong class="text-zinc-200">{camp.faixa_inicio}</strong> a
										<strong class="text-zinc-200">{camp.faixa_fim}</strong>
									</span>
									{#if camp.idade_minima !== null || camp.idade_maxima !== null}
										<span>
											• Idade: {camp.idade_minima ?? 'Livre'} a {camp.idade_maxima ?? 'Livre'} anos
										</span>
									{/if}
								</div>
							</div>

							<div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
								<div class="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
									<span><strong class="text-white">{camp.total_inscritos}</strong> inscritos</span>
									<span>
										{camp.valor_inscricao > 0
											? `R$ ${camp.valor_inscricao.toFixed(2).replace('.', ',')}`
											: 'Gratuito'}
									</span>
								</div>
								<span class="inline-flex items-center gap-1 font-semibold text-red-400 group-hover:translate-x-0.5 transition-transform">
									<span>Ver Evento</span>
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
	<!-- SUB-MENU 2: HISTÓRICO DE CAMPEONATOS (PASSADOS + VISUALIZAÇÃO COMPLETA)   -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'historico'}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-200">
			<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400">
						<History class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">Arquivo de Campeonatos Passados</h3>
						<p class="text-[11px] text-zinc-500">
							Pesquise e selecione qualquer evento passado para abrir a ficha completa de inscritos e resultados
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
						Exibindo {historicoFiltrado.length} de {campeonatosPassados.length}
					</span>
					{#if campeonatosPassados.length > 5 && !temFiltroHistoricoAtivo}
						<button
							type="button"
							onclick={() => (mostrarTodosHistorico = !mostrarTodosHistorico)}
							class="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 transition-colors cursor-pointer"
						>
							{mostrarTodosHistorico ? 'Mostrar Apenas 5' : 'Carregar Todos'}
						</button>
					{/if}
				</div>
			</div>

			<!-- Filtros de Busca, Tipo e Período -->
			<div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
				<div class="md:col-span-5 space-y-1">
					<label for="busca-hist-camp" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
						Pesquisar (Nome, Cidade, Edição ou Colocação)
					</label>
					<div class="relative">
						<Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							id="busca-hist-camp"
							type="text"
							bind:value={buscaHistorico}
							placeholder="Ex.: Paulista, 1º Lugar, São Paulo..."
							class="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
						/>
						{#if buscaHistorico}
							<button
								type="button"
								onclick={() => (buscaHistorico = '')}
								class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
							>
								<X class="w-3.5 h-3.5" />
							</button>
						{/if}
					</div>
				</div>

				<div class="md:col-span-3 space-y-1">
					<label for="hist-tipo-camp" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
						Tipo de Campeonato
					</label>
					<select
						id="hist-tipo-camp"
						bind:value={histTipo}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
					>
						<option value="todos">Todos os tipos</option>
						{#each tiposDisponiveis as tipo}
							<option value={tipo}>{tipo}</option>
						{/each}
					</select>
				</div>

				<div class="md:col-span-2 space-y-1">
					<label for="hist-de" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
						De
					</label>
					<input
						id="hist-de"
						type="date"
						bind:value={histDataInicio}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
					/>
				</div>

				<div class="md:col-span-2 space-y-1">
					<label for="hist-ate" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
						Até
					</label>
					<div class="flex items-center gap-1.5">
						<input
							id="hist-ate"
							type="date"
							bind:value={histDataFim}
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						/>
						{#if temFiltroHistoricoAtivo || mostrarTodosHistorico}
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

			{#if historicoFiltrado.length === 0}
				<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center text-xs text-zinc-500">
					{campeonatosPassados.length === 0
						? 'Ainda não há campeonatos encerrados no histórico.'
						: 'Nenhum campeonato passado encontrado com os filtros aplicados.'}
				</div>
			{:else}
				<div class="space-y-3">
					{#each historicoFiltrado as camp}
						<a
							href="/dashboard/campeonatos/{camp.id_evento}"
							class="group p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
						>
							<div class="space-y-1.5 min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-xs font-mono text-zinc-400">{camp.data_inicio}</span>
									{#if camp.tipo_campeonato}
										<span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono uppercase text-zinc-300">
											{camp.tipo_campeonato}
										</span>
									{/if}
									{#if camp.classificacao_academia}
										<span class="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/60 text-[10px] font-mono text-amber-300">
											Academia: {camp.classificacao_academia}
										</span>
									{/if}
								</div>

								<h4 class="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
									{camp.nome}
									{#if camp.edicao}
										<span class="text-zinc-500 font-mono text-xs font-normal ml-1">({camp.edicao})</span>
									{/if}
								</h4>

								<div class="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
									<span class="inline-flex items-center gap-1">
										<MapPin class="w-3 h-3 text-zinc-500" />
										{camp.cidade}/{camp.uf}
									</span>
									<span>• <strong class="text-zinc-200">{camp.total_confirmados}</strong> participantes</span>
									<span>• <strong class="text-amber-400">{camp.total_medalhas}</strong> medalhas</span>
								</div>
							</div>

							<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0">
								<span>Visualizar Evento Completo</span>
								<ArrowRight class="w-3.5 h-3.5" />
							</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- SUB-MENU 3: DESEMPENHO (SOMA TOTAL POR PADRÃO + FILTROS DINÂMICOS)        -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'desempenho'}
		<div class="space-y-6 animate-in fade-in duration-200">
			<!-- Barra de Filtros do Desempenho -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400">
							<BarChart3 class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">Filtros de Análise de Desempenho</h3>
							<p class="text-[11px] text-zinc-500">
								Sem filtros, exibe a soma completa de todo o histórico; combine período e tipo para recortar
							</p>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-1.5">
						<button
							type="button"
							onclick={() => aplicarPresetPeriodo('tudo')}
							class="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer {!desempDataInicio && !desempDataFim
								? 'bg-red-950/50 border-red-800/70 text-white'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
						>
							Todo o Período
						</button>
						<button
							type="button"
							onclick={() => aplicarPresetPeriodo('ano_atual')}
							class="px-2.5 py-1 rounded-lg text-[11px] font-medium border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
						>
							Ano {anoAtual}
						</button>
						<button
							type="button"
							onclick={() => aplicarPresetPeriodo('ano_passado')}
							class="px-2.5 py-1 rounded-lg text-[11px] font-medium border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
						>
							Ano {anoAtual - 1}
						</button>
						<button
							type="button"
							onclick={() => aplicarPresetPeriodo('6_meses')}
							class="px-2.5 py-1 rounded-lg text-[11px] font-medium border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
						>
							Últimos 6 meses
						</button>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
					<div class="md:col-span-4 space-y-1">
						<label for="desemp-busca" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
							Pesquisar (Evento, Cidade{data.ehGestorOuProfessor ? '' : ', Atleta'})
						</label>
						<div class="relative">
							<Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								id="desemp-busca"
								type="text"
								bind:value={desempBusca}
								placeholder="Filtrar por nome..."
								class="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
							/>
						</div>
					</div>

					<div class="md:col-span-3 space-y-1">
						<label for="desemp-tipo" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
							Tipo de Campeonato
						</label>
						<select
							id="desemp-tipo"
							bind:value={desempTipo}
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						>
							<option value="todos">Todos os tipos</option>
							{#each tiposDisponiveis as tipo}
								<option value={tipo}>{tipo}</option>
							{/each}
						</select>
					</div>

					<div class="md:col-span-2 space-y-1">
						<label for="desemp-de" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
							De
						</label>
						<input
							id="desemp-de"
							type="date"
							bind:value={desempDataInicio}
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						/>
					</div>

					<div class="md:col-span-3 space-y-1">
						<label for="desemp-ate" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
							Até
						</label>
						<div class="flex items-center gap-2">
							<input
								id="desemp-ate"
								type="date"
								bind:value={desempDataFim}
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
							/>
							{#if desempBusca || desempDataInicio || desempDataFim || desempTipo !== 'todos' || desempApenasComMedalha}
								<button
									type="button"
									onclick={limparFiltrosDesempenho}
									class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer shrink-0"
									title="Restaurar soma total"
								>
									<X class="w-3.5 h-3.5" />
								</button>
							{/if}
						</div>
					</div>
				</div>

				<label class="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer pt-1">
					<input
						type="checkbox"
						bind:checked={desempApenasComMedalha}
						class="rounded bg-zinc-900 border-zinc-700 text-red-600 focus:ring-red-600"
					/>
					<span>Mostrar apenas eventos com medalha ou pódio</span>
				</label>
			</div>

			<!-- Cards Consolidados de Desempenho -->
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Campeonatos</span>
					<span class="text-2xl font-extrabold text-white font-mono">{metricasDesempenho.eventos}</span>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-amber-900/40 space-y-1">
					<span class="text-[10px] font-mono uppercase text-amber-400 block">Ouro (1º)</span>
					<span class="text-2xl font-extrabold text-amber-300 font-mono">{metricasDesempenho.ouro}</span>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-400 block">Prata (2º)</span>
					<span class="text-2xl font-extrabold text-zinc-200 font-mono">{metricasDesempenho.prata}</span>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-orange-900/40 space-y-1">
					<span class="text-[10px] font-mono uppercase text-orange-400 block">Bronze (3º)</span>
					<span class="text-2xl font-extrabold text-orange-300 font-mono">{metricasDesempenho.bronze}</span>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Total Medalhas</span>
					<span class="text-2xl font-extrabold text-emerald-400 font-mono">{metricasDesempenho.medalhas}</span>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Aproveitamento</span>
					<span class="text-2xl font-extrabold text-sky-400 font-mono">{metricasDesempenho.aproveitamento}%</span>
					<span class="text-[10px] font-mono text-zinc-500 block">
						{metricasDesempenho.vitorias}/{metricasDesempenho.lutas} lutas
					</span>
				</div>
			</div>

			{#if data.ehGestorOuProfessor}
				<!-- Posição Geral da Academia (Classificação por Equipe) -->
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4 shadow-sm">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-900">
						<div class="flex items-center gap-2">
							<Trophy class="w-4 h-4 text-amber-400" />
							<h3 class="text-sm font-semibold text-white">Posição Geral da Academia</h3>
						</div>
						<div class="flex items-center gap-3 text-[11px] font-mono">
							<span class="text-amber-300">
								<strong>{resumoPosicoesAcademia.podios}</strong> {resumoPosicoesAcademia.podios === 1 ? 'pódio geral' : 'pódios gerais'}
							</span>
							<span class="text-zinc-600">•</span>
							<span class="text-zinc-400">
								{resumoPosicoesAcademia.comClassificacao} de {metricasDesempenho.eventos} eventos com colocação registrada
							</span>
						</div>
					</div>

					{#if resumoPosicoesAcademia.colocacoes.length === 0}
						<p class="text-xs text-zinc-500">
							Nenhuma classificação geral da academia registrada para os campeonatos deste recorte.
						</p>
					{:else}
						<div class="flex flex-wrap gap-2.5">
							{#each resumoPosicoesAcademia.colocacoes as item}
								<div
									class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium {item.ehPodio
										? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
										: 'bg-zinc-900/60 border-zinc-800 text-zinc-300'}"
								>
									<span class="font-mono font-bold text-white">{item.quantidade}x</span>
									<span>{item.posicao}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Quebra por Tipo de Campeonato -->
			{#if resumoPorTipo.length > 0}
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4 shadow-sm">
					<div class="flex items-center justify-between gap-2 pb-3 border-b border-zinc-900">
						<div class="flex items-center gap-2">
							<Medal class="w-4 h-4 text-amber-400" />
							<h3 class="text-sm font-semibold text-white">Desempenho por Tipo de Campeonato</h3>
						</div>
						{#if data.ehGestorOuProfessor && metricasDesempenho.podiosAcademia > 0}
							<span class="text-[11px] font-mono text-amber-300">
								{metricasDesempenho.podiosAcademia} pódios gerais de equipe
							</span>
						{/if}
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each resumoPorTipo as grp}
							<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-900 space-y-2">
								<div class="flex items-center justify-between gap-2">
									<span class="text-xs font-bold text-white">{grp.tipo}</span>
									<span class="text-[11px] font-mono text-zinc-400">{grp.eventos} eventos</span>
								</div>
								<div class="flex items-center gap-3 text-xs font-mono">
									<span class="text-amber-300">Ouro: <strong>{grp.ouro}</strong></span>
									<span class="text-zinc-300">Prata: <strong>{grp.prata}</strong></span>
									<span class="text-orange-300">Bronze: <strong>{grp.bronze}</strong></span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Tabela Detalhada dos Eventos Filtrados -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4 shadow-sm">
				<div class="flex items-center justify-between gap-2 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2">
						<Swords class="w-4 h-4 text-red-400" />
						<h3 class="text-sm font-semibold text-white">
							{data.ehGestorOuProfessor ? 'Eventos Computados no Recorte' : 'Minhas Participações & Pódios'}
						</h3>
					</div>
				</div>

				{#if (data.ehGestorOuProfessor ? desempenhoDojoFiltrado.length : desempenhoPessoalFiltrado.length) === 0}
					<div class="p-6 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center text-xs text-zinc-500">
						Nenhum resultado encontrado para os filtros selecionados.
					</div>
				{:else if data.ehGestorOuProfessor}
					<div class="rounded-xl border border-zinc-900 overflow-x-auto">
						<table class="w-full text-left border-collapse">
							<thead>
								<tr class="border-b border-zinc-900 bg-zinc-900/40 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
									<th class="py-3 px-4">Data</th>
									<th class="py-3 px-4">Campeonato</th>
									<th class="py-3 px-4 hidden sm:table-cell">Tipo</th>
									<th class="py-3 px-4">Posição Geral</th>
									<th class="py-3 px-4">Medalhas (O/P/B)</th>
									<th class="py-3 px-4 hidden md:table-cell">Lutas</th>
									<th class="py-3 px-4 text-right">Evento</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900 text-xs">
								{#each desempenhoDojoFiltrado as camp}
									<tr class="hover:bg-zinc-900/30 transition-colors">
										<td class="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">{camp.data_inicio}</td>
										<td class="py-3 px-4 font-semibold text-white">{camp.nome}</td>
										<td class="py-3 px-4 text-zinc-400 hidden sm:table-cell">{camp.tipo_campeonato || '—'}</td>
										<td class="py-3 px-4">
											{#if camp.classificacao_academia}
												<span
													class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono border {ehPodioOuCampeao(camp.classificacao_academia)
														? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
														: 'bg-zinc-900 border-zinc-800 text-zinc-300'}"
												>
													{camp.classificacao_academia}
												</span>
											{:else}
												<span class="text-zinc-600">—</span>
											{/if}
										</td>
										<td class="py-3 px-4 font-mono">
											<span class="text-amber-300">{camp.total_ouro}</span> /
											<span class="text-zinc-200">{camp.total_prata}</span> /
											<span class="text-orange-300">{camp.total_bronze}</span>
										</td>
										<td class="py-3 px-4 font-mono text-zinc-400 hidden md:table-cell">
											{camp.total_vitorias}/{camp.total_lutas}
										</td>
										<td class="py-3 px-4 text-right">
											<a
												href="/dashboard/campeonatos/{camp.id_evento}"
												class="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold"
											>
												<span>Abrir</span>
												<ArrowRight class="w-3 h-3" />
											</a>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="rounded-xl border border-zinc-900 overflow-x-auto">
						<table class="w-full text-left border-collapse">
							<thead>
								<tr class="border-b border-zinc-900 bg-zinc-900/40 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
									<th class="py-3 px-4">Data</th>
									<th class="py-3 px-4">Campeonato</th>
									<th class="py-3 px-4">Judoca</th>
									<th class="py-3 px-4">Colocação</th>
									<th class="py-3 px-4 hidden sm:table-cell">Lutas</th>
									<th class="py-3 px-4 text-right">Evento</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900 text-xs">
								{#each desempenhoPessoalFiltrado as item}
									<tr class="hover:bg-zinc-900/30 transition-colors">
										<td class="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">{item.data_inicio}</td>
										<td class="py-3 px-4 font-semibold text-white">{item.nome_campeonato}</td>
										<td class="py-3 px-4 text-zinc-300">{item.nome_aluno}</td>
										<td class="py-3 px-4 font-semibold text-amber-300">{item.classificacao_aluno}</td>
										<td class="py-3 px-4 font-mono text-zinc-400 hidden sm:table-cell">
											{item.qtd_vitorias}/{item.qtd_lutas}
										</td>
										<td class="py-3 px-4 text-right">
											<a
												href="/dashboard/campeonatos/{item.id_evento}"
												class="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold"
											>
												<span>Abrir</span>
												<ArrowRight class="w-3 h-3" />
											</a>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
