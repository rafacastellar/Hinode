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
		Medal
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const totalCampeonatos = $derived(data.campeonatos.length);
	const totalInscritos = $derived(
		data.campeonatos.reduce((acc, c) => acc + c.total_inscritos, 0)
	);
	const totalMedalhas = $derived(
		data.campeonatos.reduce((acc, c) => acc + c.total_medalhas, 0)
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
				Inscrições de atletas e professores, acompanhamento de status e quadro de medalhas do
				dojo.
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
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Medalhas & Pódios</span>
				<span class="text-xl font-extrabold text-amber-400 font-display">{totalMedalhas}</span>
			</div>
		</div>
	</div>

	<!-- LISTA DE CAMPEONATOS -->
	{#if data.campeonatos.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each data.campeonatos as camp}
				<div
					class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col justify-between"
				>
					<div>
						<div class="flex items-center justify-between gap-2 mb-3">
							<span
								class="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-semibold bg-red-950/40 border border-red-800/60 text-red-300"
							>
								{camp.tipo_campeonato || 'Torneio'}
							</span>
							<div class="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400">
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
							<span>Gerenciar</span>
							<ArrowRight class="w-3.5 h-3.5" />
						</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
			<Trophy class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
			<h3 class="text-base font-bold text-white font-display">Nenhum campeonato cadastrado</h3>
			<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
				Cadastre as competições da federação, inscreva os judocas e professores do dojo e
				registre as medalhas conquistadas.
			</p>
			<div class="mt-5">
				<a
					href="/dashboard/campeonatos/novo"
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
				>
					<PlusCircle class="w-3.5 h-3.5" />
					<span>Cadastrar Primeiro Campeonato</span>
				</a>
			</div>
		</div>
	{/if}
</div>
