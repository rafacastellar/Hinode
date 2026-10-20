<script lang="ts">
	import type { PageData } from './$types';
	import {
		Trophy,
		Calendar,
		MapPin,
		Users,
		Award,
		PlusCircle,
		ArrowRight,
		Medal,
		Clock,
		Search,
		Filter,
		X
	} from '@lucide/svelte';
	import {
		correspondeClassificacaoAcademia,
		ehPodioOuCampeao,
		normalizarTexto
	} from '#lib/dominio/campeonato';

	let { data }: { data: PageData } = $props();

	let busca = $state('');
	let filtroRapido = $state<'todos' | 'com_colocacao' | 'podios'>('todos');

	const totalCampeonatos = $derived(data.campeonatos.length);
	const totalInscritos = $derived(
		data.campeonatos.reduce((acc, c) => acc + c.total_inscritos, 0)
	);
	const totalMedalhas = $derived(
		data.campeonatos.reduce((acc, c) => acc + c.total_medalhas, 0)
	);
	const totalComColocacao = $derived(
		data.campeonatos.filter((c) => Boolean(c.classificacao_academia)).length
	);
	const totalPodiosDojo = $derived(
		data.campeonatos.filter((c) => ehPodioOuCampeao(c.classificacao_academia)).length
	);

	const campeonatosFiltrados = $derived(
		data.campeonatos.filter((camp) => {
			// Filtro de aba rápida
			if (filtroRapido === 'com_colocacao' && !camp.classificacao_academia) {
				return false;
			}
			if (filtroRapido === 'podios' && !ehPodioOuCampeao(camp.classificacao_academia)) {
				return false;
			}

			// Filtro textual
			const termo = normalizarTexto(busca);
			if (!termo) return true;

			const matchNome = normalizarTexto(camp.nome).includes(termo);
			const matchEdicao = normalizarTexto(camp.edicao).includes(termo);
			const matchCidade = normalizarTexto(camp.cidade).includes(termo);
			const matchTipo = normalizarTexto(camp.tipo_campeonato).includes(termo);
			const matchClassificacao = correspondeClassificacaoAcademia(
				camp.classificacao_academia,
				termo
			);

			return matchNome || matchEdicao || matchCidade || matchTipo || matchClassificacao;
		})
	);
</script>

<svelte:head>
	<title>Campeonatos & Competições - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER DA PÁGINA -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
					Rendimento & Competição
				</span>
				<span class="text-xs text-zinc-600">•</span>
				<span class="text-xs text-zinc-400 font-mono">Fase 7</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
				Campeonatos & Torneios
			</h1>
			<p class="text-xs sm:text-sm text-zinc-400 mt-1">
				Inscrições de atletas e professores, acompanhamento de status, quadro de medalhas e colocações gerais da academia.
			</p>
		</div>

		{#if data.podeCriarCampeonato}
			<a
				href="/dashboard/campeonatos/novo"
				class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all shrink-0"
			>
				<PlusCircle class="w-4 h-4" />
				<span>Cadastrar Campeonato</span>
			</a>
		{/if}
	</div>

	<!-- CARDS DE MÉTRICAS -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<Trophy class="w-5 h-5 text-red-500" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Torneios no Calendário</span>
				<span class="text-xl font-extrabold text-white font-display">{totalCampeonatos}</span>
			</div>
		</div>

		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<Users class="w-5 h-5 text-sky-400" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Atletas Inscritos</span>
				<span class="text-xl font-extrabold text-white font-display">{totalInscritos}</span>
			</div>
		</div>

		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<Medal class="w-5 h-5 text-amber-400" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Medalhas de Judocas</span>
				<span class="text-xl font-extrabold text-amber-400 font-display">{totalMedalhas}</span>
			</div>
		</div>

		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<Trophy class="w-5 h-5 text-yellow-500" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Colocações da Hinodê</span>
				<span class="text-xl font-extrabold text-yellow-400 font-display">{totalComColocacao}</span>
			</div>
		</div>
	</div>

	<!-- BARRA DE BUSCA E FILTROS -->
	<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
		<div class="relative flex-1">
			<Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
			<input
				type="text"
				bind:value={busca}
				placeholder="Buscar por nome, cidade ou colocação do dojo (ex: campeã, 2º, decima, vigesima, troféu)..."
				class="w-full pl-10 pr-9 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
			/>
			{#if busca}
				<button
					type="button"
					onclick={() => (busca = '')}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
					title="Limpar busca"
				>
					<X class="w-3.5 h-3.5" />
				</button>
			{/if}
		</div>

		<!-- Abas Rápidas de Classificação -->
		<div class="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
			<button
				type="button"
				onclick={() => (filtroRapido = 'todos')}
				class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all {filtroRapido === 'todos'
					? 'bg-zinc-800 text-white font-bold border border-zinc-700'
					: 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800/80'}"
			>
				Todos ({totalCampeonatos})
			</button>

			<button
				type="button"
				onclick={() => (filtroRapido = 'com_colocacao')}
				class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 {filtroRapido === 'com_colocacao'
					? 'bg-amber-950/80 text-amber-200 font-bold border border-amber-800'
					: 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800/80'}"
			>
				<Trophy class="w-3.5 h-3.5 text-amber-400" />
				<span>Com Colocação ({totalComColocacao})</span>
			</button>

			<button
				type="button"
				onclick={() => (filtroRapido = 'podios')}
				class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 {filtroRapido === 'podios'
					? 'bg-yellow-950/80 text-yellow-200 font-bold border border-yellow-800'
					: 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800/80'}"
			>
				<Medal class="w-3.5 h-3.5 text-yellow-400" />
				<span>Top 3 / Campeã ({totalPodiosDojo})</span>
			</button>
		</div>
	</div>

	<!-- LISTA DE CAMPEONATOS -->
	{#if campeonatosFiltrados.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each campeonatosFiltrados as camp}
				<div
					class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col justify-between"
				>
					<div>
						<div class="flex items-center justify-between gap-2 mb-3">
							<div class="flex flex-wrap items-center gap-1.5">
								<span
									class="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-semibold bg-red-950/40 border border-red-800/60 text-red-300"
								>
									{camp.tipo_campeonato || 'Torneio'}
								</span>

								<!-- BADGE DE COLOCAÇÃO GERAL DA ACADEMIA -->
								{#if camp.classificacao_academia}
									<span
										class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-800/80 text-amber-300 shadow-sm"
										title="Colocação geral da equipe Hinodê no torneio"
									>
										<Trophy class="w-3 h-3 text-amber-400" />
										<span>{camp.classificacao_academia}</span>
									</span>
								{/if}
							</div>

							<div class="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 shrink-0">
								<Calendar class="w-3.5 h-3.5 text-zinc-500" />
								<span>{camp.data_inicio}</span>
							</div>
						</div>

						<h3 class="text-lg font-bold text-white font-display leading-snug mb-1">
							{camp.nome}
						</h3>
						{#if camp.edicao}
							<span class="text-xs text-zinc-400 block mb-2">{camp.edicao}</span>
						{/if}

						<div class="flex items-center gap-2 text-xs text-zinc-400 mb-3">
							<MapPin class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
							<span>{camp.cidade} / {camp.uf}</span>
						</div>

						<!-- Limites de Graduação, Categoria, Idade e Taxa -->
						<div class="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-900/80 mb-4">
							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
								<span class="text-red-400 font-bold">Faixas:</span>
								<span>{camp.faixa_inicio && camp.faixa_fim ? `${camp.faixa_inicio} até ${camp.faixa_fim}` : (camp.limite_graduacao || 'Todas as Faixas')}</span>
							</span>
							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
								<span class="text-amber-400 font-bold">Categoria:</span>
								<span>{camp.limite_grupo || 'Todos'}</span>
							</span>
							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-sky-300">
								<span class="text-sky-400 font-bold">Idade:</span>
								<span>{camp.idade_minima !== null && camp.idade_minima !== undefined && camp.idade_maxima !== null && camp.idade_maxima !== undefined ? `${camp.idade_minima} a ${camp.idade_maxima} anos` : camp.idade_minima !== null && camp.idade_minima !== undefined ? `A partir de ${camp.idade_minima} anos` : camp.idade_maxima !== null && camp.idade_maxima !== undefined ? `Até ${camp.idade_maxima} anos` : 'Livre'}</span>
							</span>
							<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-emerald-400">
								<span>{camp.valor_inscricao !== null && camp.valor_inscricao !== undefined && Number(camp.valor_inscricao) > 0 ? `R$ ${Number(camp.valor_inscricao).toFixed(2)}` : 'Gratuito'}</span>
							</span>
							{#if camp.data_inicio_inscricao || camp.data_fim_inscricao}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-purple-300">
									<Clock class="w-3 h-3 text-purple-400" />
									<span>Inscrições: {camp.data_inicio_inscricao && camp.data_fim_inscricao ? `${camp.data_inicio_inscricao} a ${camp.data_fim_inscricao}` : camp.data_fim_inscricao ? `Até ${camp.data_fim_inscricao}` : `A partir de ${camp.data_inicio_inscricao}`}</span>
								</span>
							{/if}
						</div>
					</div>

					<div class="pt-4 border-t border-zinc-900 flex items-center justify-between">
						<div class="flex items-center gap-3 text-xs font-mono">
							<span class="text-zinc-300">
								<strong class="text-white">{camp.total_inscritos}</strong> inscritos
							</span>
							{#if camp.total_medalhas > 0}
								<span class="text-amber-400">
									🏅 {camp.total_medalhas} pódios
								</span>
							{/if}
						</div>

						<a
							href="/dashboard/campeonatos/{camp.id_evento}"
							class="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-red-400 transition-colors"
						>
							<span>{data.podeCriarCampeonato ? 'Gerenciar' : 'Detalhes & Inscrição'}</span>
							<ArrowRight class="w-3.5 h-3.5" />
						</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
			<Trophy class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
			{#if busca || filtroRapido !== 'todos'}
				<h3 class="text-base font-bold text-white font-display">Nenhum campeonato encontrado</h3>
				<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
					Nenhuma competição corresponde aos filtros aplicados
					{#if busca}para o termo "<strong class="text-zinc-200">{busca}</strong>"{/if}.
				</p>
				<div class="mt-4 flex items-center justify-center gap-2">
					<button
						type="button"
						onclick={() => {
							busca = '';
							filtroRapido = 'todos';
						}}
						class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 transition-colors"
					>
						<X class="w-3.5 h-3.5" />
						<span>Limpar Filtros</span>
					</button>
				</div>
			{:else}
				<h3 class="text-base font-bold text-white font-display">Nenhum campeonato cadastrado</h3>
				<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
					Cadastre as competições da federação, inscreva os judocas e professores do dojo e
					registre as medalhas conquistadas.
				</p>
				{#if data.podeCriarCampeonato}
					<div class="mt-5">
						<a
							href="/dashboard/campeonatos/novo"
							class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
						>
							<PlusCircle class="w-3.5 h-3.5" />
							<span>Cadastrar Primeiro Campeonato</span>
						</a>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

