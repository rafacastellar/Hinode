<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Users,
		UserPlus,
		Search,
		Award,
		HeartHandshake,
		Pencil,
		Eye,
		Zap,
		CheckCircle2,
		ChevronDown,
		ArrowUpDown,
		Filter,
		LayoutList,
		AlignJustify,
		ArrowUp,
		ArrowDown,
		SlidersHorizontal,
		History,
		Scale,
		ArrowRight
	} from '@lucide/svelte';
	import {
		ordenarAtletas,
		type CampoOrdenacaoAtleta,
		type DirecaoOrdenacao
	} from '#lib/dominio/ordenacao-atletas';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let termoBusca = $state('');
	let recalculando = $state(false);

	// Estados de controle: minimização (accordion), ordenação e densidade
	let listaExpandida = $state(true);
	let historicoExpandido = $state(false);
	let modoDensidade = $state<'detalhada' | 'compacta'>('compacta');
	let campoOrdenacao = $state<CampoOrdenacaoAtleta>('nome');
	let direcaoOrdenacao = $state<DirecaoOrdenacao>('asc');
	let filtroChip = $state<'TODOS' | 'MENORES' | 'ADULTOS' | 'ASPIRANTES' | 'ESPECIAIS'>('TODOS');

	$effect(() => {
		termoBusca = data.busca || '';
	});

	$effect(() => {
		if (typeof window !== 'undefined' && window.location.hash === '#historico-peso') {
			historicoExpandido = true;
			const el = document.getElementById('historico-peso');
			el?.scrollIntoView({ behavior: 'smooth' });
		}
	});

	function alternarDirecao() {
		direcaoOrdenacao = direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
	}

	// Métricas rápidas calculadas da lista
	const totalAlunos = $derived(data.alunos.length);
	const totalMenores = $derived(data.alunos.filter((a) => a.menor_idade).length);
	const totalAdultos = $derived(data.alunos.filter((a) => !a.menor_idade).length);

	// Filtragem por chips rápidos
	const alunosFiltradosPorChip = $derived(
		data.alunos.filter((aluno) => {
			if (filtroChip === 'MENORES') return aluno.menor_idade;
			if (filtroChip === 'ADULTOS') return !aluno.menor_idade;
			if (filtroChip === 'ASPIRANTES')
				return (aluno.grupo_especial_aspirante || '').toLowerCase().includes('aspirante');
			if (filtroChip === 'ESPECIAIS')
				return (aluno.grupo_especial_aspirante || '').toLowerCase().includes('especial');
			return true;
		})
	);

	// Lista final ordenada
	const alunosOrdenados = $derived(
		ordenarAtletas(alunosFiltradosPorChip, campoOrdenacao, direcaoOrdenacao)
	);
</script>

<svelte:head>
	<title>Judocas & Alunos - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8">
	<!-- Alerta de Sincronização Bem-Sucedida -->
	{#if form?.sucesso && form?.mensagem}
		<div
			class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-start gap-3 transition-all animate-in fade-in"
		>
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
			<div>
				<span class="font-semibold block text-emerald-100">Atualização Concluída</span>
				<span>{form.mensagem}</span>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- HEADER DA PÁGINA -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
					Módulo de Atletas
				</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
				Judocas do Dojo
			</h1>
			<p class="text-xs sm:text-sm text-zinc-400 mt-1">
				Controle cadastral, categorias oficiais de peso CBJ/FPJ e acompanhamento de faixas.
			</p>
		</div>

		<div class="flex items-center gap-2.5 flex-wrap">
			{#if data.podeEditarAluno}
				<form
					method="POST"
					action="?/recalcularCategorias"
					use:enhance={() => {
						recalculando = true;
						return async ({ update }) => {
							recalculando = false;
							await update();
						};
					}}
				>
					<button
						type="submit"
						disabled={recalculando}
						class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-medium text-xs sm:text-sm transition-all disabled:opacity-50 shrink-0"
						title="Recalcula em lote as categorias de peso e divisões oficiais CBJ para todos os judocas"
					>
						<Zap class="w-4 h-4 text-amber-400" />
						<span>{recalculando ? 'Sincronizando...' : 'Sincronizar CBJ'}</span>
					</button>
				</form>
			{/if}

			{#if data.podeCriarAluno}
				<a
					href="/dashboard/alunos/novo"
					class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all shrink-0"
				>
					<UserPlus class="w-4 h-4" />
					<span>Matricular Judoca</span>
				</a>
			{/if}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- CARDS DE RESUMO OPERACIONAL -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<Users class="w-5 h-5 text-red-500" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Total de Atletas</span>
				<span class="text-xl font-extrabold text-white font-display">{totalAlunos}</span>
			</div>
		</div>

		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<HeartHandshake class="w-5 h-5 text-amber-500" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Menores de 18 Anos</span>
				<span class="text-xl font-extrabold text-white font-display">{totalMenores}</span>
			</div>
		</div>

		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<Award class="w-5 h-5 text-sky-500" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Responsabilidade Legal</span>
				<span class="text-xs text-emerald-400 font-mono font-medium">100% Auditada</span>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- BARRA DE PESQUISA & FILTRO -->
	<!-- ========================================================================= -->
	<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
		<form method="GET" class="flex items-center gap-3">
			<div class="relative flex-1">
				<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					name="busca"
					bind:value={termoBusca}
					placeholder="Buscar judoca por nome, CPF ou número de matrícula..."
					class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
				/>
			</div>

			<button
				type="submit"
				class="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs sm:text-sm font-medium text-zinc-200 border border-zinc-800 transition-colors shrink-0"
			>
				Filtrar
			</button>

			{#if data.busca}
				<a
					href="/dashboard/alunos"
					class="px-3 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
				>
					Limpar
				</a>
			{/if}
		</form>
	</div>

	<!-- ========================================================================= -->
	<!-- LISTAGEM DE ALUNOS COM MINIMIZAÇÃO (ACCORDION) E ORDENAÇÃO               -->
	<!-- ========================================================================= -->
	{#if data.alunos.length > 0}
		<section class="rounded-3xl bg-zinc-950 border border-zinc-900 overflow-hidden shadow-sm">
		<!-- Header Colapsável com Resumo (Padrão idêntico aos Logs do Dojo) -->
		<div
			class="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
			onclick={() => (listaExpandida = !listaExpandida)}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && (listaExpandida = !listaExpandida)}
			aria-expanded={listaExpandida}
		>
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 shrink-0"
				>
					<Users class="w-5 h-5" />
				</div>
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<h2 class="text-base font-bold text-white font-display">
							Quadro Geral de Judocas
						</h2>
						<span
							class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold"
						>
							{alunosOrdenados.length} {alunosOrdenados.length === 1 ? 'atleta' : 'atletas'}
						</span>
						{#if totalMenores > 0}
							<span
								class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-300"
							>
								{totalMenores} menores
							</span>
						{/if}
					</div>
					<p class="text-[11px] text-zinc-400 mt-0.5">
						Matrículas ativas, histórico de graduação, faixas e categorias competitivas CBJ/FPJ.
					</p>
				</div>
			</div>

			<div class="flex items-center gap-3 self-end sm:self-auto shrink-0">
				<span
					class="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800"
				>
					{listaExpandida ? 'Recolher Lista ▲' : 'Expandir Lista ▼'}
				</span>
				<div
					class="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-transform duration-200 {listaExpandida
						? 'rotate-180'
						: ''}"
				>
					<ChevronDown class="w-4 h-4" />
				</div>
			</div>
		</div>

		<!-- Conteúdo Expandido (Quando listaExpandida = true) -->
		{#if listaExpandida}
			<div class="border-t border-zinc-900 p-5 sm:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200 bg-zinc-950/80">
				<!-- Barra de Ferramentas: Filtros em Chips + Ordenação + Alternador de Densidade -->
				<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-zinc-900">
					<!-- 1. Chips de Filtro Rápido -->
					<div class="flex items-center gap-2 flex-wrap text-xs">
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1 mr-1"
						>
							<Filter class="w-3 h-3" />
							<span>Filtro:</span>
						</span>
						<button
							type="button"
							onclick={() => (filtroChip = 'TODOS')}
							class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroChip ===
							'TODOS'
								? 'bg-red-950/50 border-red-800/80 text-white font-bold'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
						>
							Todos ({data.alunos.length})
						</button>
						<button
							type="button"
							onclick={() => (filtroChip = 'MENORES')}
							class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroChip ===
							'MENORES'
								? 'bg-amber-950/50 border-amber-800/80 text-amber-200 font-bold'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
						>
							Menores de 18 ({totalMenores})
						</button>
						<button
							type="button"
							onclick={() => (filtroChip = 'ADULTOS')}
							class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroChip ===
							'ADULTOS'
								? 'bg-sky-950/50 border-sky-800/80 text-sky-200 font-bold'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
						>
							Adultos ({totalAdultos})
						</button>
						<button
							type="button"
							onclick={() => (filtroChip = 'ASPIRANTES')}
							class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroChip ===
							'ASPIRANTES'
								? 'bg-purple-950/50 border-purple-800/80 text-purple-200 font-bold'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
						>
							Aspirantes
						</button>
						<button
							type="button"
							onclick={() => (filtroChip = 'ESPECIAIS')}
							class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroChip ===
							'ESPECIAIS'
								? 'bg-purple-950/50 border-purple-800/80 text-purple-200 font-bold'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
						>
							Especiais
						</button>
					</div>

					<!-- 2. Controles de Ordenação e Densidade -->
					<div class="flex items-center gap-3 flex-wrap self-end lg:self-auto">
						<!-- Seletor de Ordenação -->
						<div class="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
							<span class="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1 pl-1">
								<ArrowUpDown class="w-3 h-3 text-red-500" />
								<span>Ordenar:</span>
							</span>
							<select
								bind:value={campoOrdenacao}
								class="bg-zinc-950 border border-zinc-800 text-white text-xs font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-red-600"
							>
								<option value="nome">Nome (A-Z)</option>
								<option value="graduacao">Graduação (Faixa)</option>
								<option value="idade">Idade</option>
								<option value="categoria">Categoria CBJ</option>
							</select>

							<!-- Alternador de Direção Asc/Desc -->
							<button
								type="button"
								onclick={alternarDirecao}
								class="p-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
								title={direcaoOrdenacao === 'asc' ? 'Ordem Crescente (clique para inverter)' : 'Ordem Decrescente (clique para inverter)'}
							>
								{#if direcaoOrdenacao === 'asc'}
									<ArrowUp class="w-3.5 h-3.5 text-red-400" />
								{:else}
									<ArrowDown class="w-3.5 h-3.5 text-amber-400" />
								{/if}
							</button>
						</div>

						<!-- Alternador de Densidade (Detalhada vs Compacta) -->
						<div class="p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center">
							<button
								type="button"
								onclick={() => (modoDensidade = 'detalhada')}
								class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 {modoDensidade ===
								'detalhada'
									? 'bg-zinc-800 text-white font-bold shadow-sm'
									: 'text-zinc-500 hover:text-zinc-300'}"
								title="Visualização Detalhada em Tabela Completa"
							>
								<LayoutList class="w-3.5 h-3.5" />
								<span>Detalhada</span>
							</button>
							<button
								type="button"
								onclick={() => (modoDensidade = 'compacta')}
								class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 {modoDensidade ===
								'compacta'
									? 'bg-zinc-800 text-white font-bold shadow-sm'
									: 'text-zinc-500 hover:text-zinc-300'}"
								title="Visualização Compacta / Minimizada com Rolagem Interna"
							>
								<AlignJustify class="w-3.5 h-3.5" />
								<span>Compacta</span>
							</button>
						</div>
					</div>
				</div>

				<!-- Tabela de Alunos (Detalhada ou Compacta) -->
				{#if alunosOrdenados.length > 0}
					<div
						class="overflow-hidden rounded-2xl border border-zinc-900 {modoDensidade === 'compacta'
							? 'max-h-[520px] overflow-y-auto'
							: ''}"
					>
						<div class="overflow-x-auto">
							<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
								<thead
									class="bg-zinc-900/80 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-800 sticky top-0 backdrop-blur-sm z-10"
								>
									<tr>
										<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
											Judoca / Atleta
										</th>
										<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
											Graduação (Faixa)
										</th>
										<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
											Idade / Tutela
										</th>
										<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
											Categoria & Divisão (CBJ)
										</th>
										<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
											Sensei
										</th>
										<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'} text-right">
											Ações
										</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-900">
									{#each alunosOrdenados as aluno}
										<tr class="hover:bg-zinc-900/30 transition-colors group">
											<!-- Judoca (Matrícula antes do Nome, sem exibição de CPF) -->
											<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
												{#if modoDensidade === 'detalhada'}
													<div class="flex flex-col gap-1 items-start">
														{#if aluno.matricula}
															<span
																class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300"
															>
																{aluno.matricula}
															</span>
														{/if}
														<a
															href="/dashboard/alunos/{aluno.id_usuario}"
															class="font-semibold text-white group-hover:text-red-400 transition-colors block text-sm"
														>
															{aluno.nome}
														</a>
													</div>
												{:else}
													<div class="flex items-center gap-2">
														{#if aluno.matricula}
															<span
																class="font-mono text-[10px] font-semibold text-zinc-400 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0"
															>
																{aluno.matricula}
															</span>
														{/if}
														<a
															href="/dashboard/alunos/{aluno.id_usuario}"
															class="font-semibold text-white group-hover:text-red-400 transition-colors text-xs truncate"
														>
															{aluno.nome}
														</a>
													</div>
												{/if}
											</td>

											<!-- Faixa Atual com legenda na versão detalhada e mesmo tamanho uniforme -->
											<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
												<BadgeFaixa
													faixa={aluno.graduacao_atual}
													size={modoDensidade === 'detalhada' ? 'md' : 'sm'}
													showLegend={modoDensidade === 'detalhada'}
												/>
											</td>

											<!-- Idade & Menoridade -->
											<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
												<div class="flex items-center gap-1.5">
													<span class="text-zinc-200 font-mono text-xs">{aluno.idade} anos</span>
													{#if aluno.menor_idade}
														<span
															class="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-950/40 border border-amber-800/60 text-amber-300"
															title="Menor de 18 anos"
														>
															Menor
														</span>
													{:else}
														<span
															class="px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800"
														>
															Maior
														</span>
													{/if}
												</div>
												{#if aluno.nome_responsavel && modoDensidade === 'detalhada'}
													<div class="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
														<HeartHandshake class="w-3 h-3 text-amber-400 shrink-0" />
														<span
															class="truncate max-w-[220px]"
															title="{aluno.nome_responsavel}{aluno.parentesco_responsavel ? ` (${aluno.parentesco_responsavel})` : ''}"
														>
															{aluno.nome_responsavel}
															{#if aluno.parentesco_responsavel}
																<span class="text-zinc-500 font-mono">({aluno.parentesco_responsavel})</span>
															{/if}
														</span>
													</div>
												{/if}
											</td>

											<!-- Categoria & Divisão -->
											<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
												<div class="flex flex-col gap-1">
													<div class="flex items-center gap-1.5 flex-wrap">
														{#if aluno.categoria}
															<span
																class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-800/50"
																title="Categoria Oficial de Peso / Idade"
															>
																{aluno.categoria}
															</span>
														{/if}
														{#if aluno.grupo_especial_aspirante}
															<span
																class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-950/50 text-purple-300 border border-purple-800/60"
															>
																{aluno.grupo_especial_aspirante}
															</span>
														{/if}
													</div>
													{#if modoDensidade === 'detalhada'}
														<div class="flex items-center gap-1.5 flex-wrap text-[11px] text-zinc-500 font-mono">
															{#if aluno.peso}
																<span>{aluno.peso} kg</span>
															{/if}
															{#if aluno.status_federacao}
																<span>• FPJ: {aluno.status_federacao}</span>
															{/if}
														</div>
													{/if}
													{#if !aluno.categoria && !aluno.grupo_especial_aspirante && !aluno.status_federacao}
														<span class="text-zinc-600 text-xs">-</span>
													{/if}
												</div>
											</td>

											<!-- Sensei Técnico -->
											<td class="{modoDensidade === 'compacta' ? 'px-4 py-2 text-xs' : 'px-6 py-4'} text-zinc-300">
												{aluno.nome_professor_responsavel}
											</td>

											<!-- Ações -->
											<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'} text-right">
												<a
													href="/dashboard/alunos/{aluno.id_usuario}"
													class="inline-flex items-center gap-1.5 {modoDensidade === 'compacta' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white transition-colors"
													title={data.podeEditarAluno
														? 'Visualizar e editar dados do judoca'
														: 'Visualizar dados do judoca'}
												>
													{#if data.podeEditarAluno}
														<Pencil class="w-3.5 h-3.5 text-zinc-400" />
														<span>Editar</span>
													{:else}
														<Eye class="w-3.5 h-3.5 text-zinc-400" />
														<span>Ver</span>
													{/if}
												</a>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{:else}
					<div class="p-8 text-center text-xs text-zinc-500 font-mono">
						Nenhum atleta encontrado para o filtro selecionado.
					</div>
				{/if}
			</div>
		{/if}
	</section>
	{:else}
		<div class="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
			<Users class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
			<h3 class="text-base font-bold text-white font-display">Nenhum judoca cadastrado</h3>
			<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
				{#if data.busca}
					Nenhum resultado corresponde aos termos da pesquisa "{data.busca}".
				{:else}
					Comece matriculando o primeiro atleta da academia para dar início aos registros de treinos e graduações.
				{/if}
			</p>
			{#if data.podeCriarAluno}
				<div class="mt-5">
					<a
						href="/dashboard/alunos/novo"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
					>
						<UserPlus class="w-3.5 h-3.5" />
						<span>Cadastrar Primeiro Judoca</span>
					</a>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- HISTÓRICO DE ALTERAÇÕES DE PESO & CATEGORIAS (MINIMIZÁVEL / 30 DIAS)       -->
	<!-- ========================================================================= -->
	<section
		id="historico-peso"
		class="rounded-2xl sm:rounded-3xl bg-zinc-950 border border-zinc-900 overflow-hidden shadow-sm transition-all"
	>
		<!-- Header Colapsável (Accordion) -->
		<div
			class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-zinc-900/40 transition-colors"
			onclick={() => (historicoExpandido = !historicoExpandido)}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && (historicoExpandido = !historicoExpandido)}
			aria-expanded={historicoExpandido}
		>
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0"
				>
					<History class="w-5 h-5 text-emerald-400" />
				</div>
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<h2 class="text-sm sm:text-base font-bold text-white font-display">
							Histórico de Pesagens & Categorias
						</h2>
						<span
							class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase {data.historicoMudancasPeso.length > 0
								? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
								: 'bg-zinc-900 border border-zinc-800 text-zinc-500'}"
						>
							{data.historicoMudancasPeso.length} alteração(ões) nos últimos 30 dias
						</span>
					</div>
					<p class="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
						Auditoria de aferições na balança e recálculos automáticos de categoria oficial (CBJ/FPJ).
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2 self-end sm:self-auto">
				<span class="text-xs text-zinc-500 font-mono hidden sm:inline">
					{historicoExpandido ? 'Recolher' : 'Expandir'}
				</span>
				<div
					class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-transform duration-200 {historicoExpandido
						? 'rotate-180'
						: ''}"
				>
					<ChevronDown class="w-4 h-4" />
				</div>
			</div>
		</div>

		<!-- Conteúdo Expandido -->
		{#if historicoExpandido}
			<div class="p-4 sm:p-6 border-t border-zinc-900 bg-zinc-950/60 space-y-3 animate-in fade-in duration-200">
				{#if data.historicoMudancasPeso.length === 0}
					<div class="py-8 text-center space-y-2">
						<Scale class="w-8 h-8 text-zinc-600 mx-auto" />
						<p class="text-xs sm:text-sm text-zinc-400 font-medium">
							Nenhuma alteração de peso registrada nos últimos 30 dias.
						</p>
						<p class="text-[11px] text-zinc-600">
							Quando um judoca ou responsável atualizar o peso corporal na balança, o histórico e a nova categoria oficial calculada aparecerão aqui.
						</p>
					</div>
				{:else}
					<div class="space-y-2.5">
						{#each data.historicoMudancasPeso as item (item.id_log)}
							<div
								class="p-3 sm:p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
							>
								<!-- Identificação do Judoca -->
								<div class="flex items-center gap-2.5 min-w-0">
									<a
										href="/dashboard/alunos/{item.id_aluno}"
										class="text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate"
										title="Ver ficha completa do judoca"
									>
										{item.nome_aluno}
									</a>
									<BadgeFaixa faixa={item.graduacao_atual} size="sm" />
									<span
										class="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-400 shrink-0"
									>
										{item.origem}
									</span>
								</div>

								<!-- Detalhes da Mudança: Peso, Categoria e Data -->
								<div
									class="flex items-center gap-3 sm:gap-4 flex-wrap text-xs font-mono justify-between md:justify-end"
								>
									<!-- Variação do Peso -->
									<div
										class="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800"
										title="Peso anterior &rarr; Novo peso medido"
									>
										<Scale class="w-3.5 h-3.5 text-zinc-500" />
										<span class="text-zinc-400">
											{item.peso_anterior !== null ? `${item.peso_anterior}kg` : 'Sem peso'}
										</span>
										<ArrowRight class="w-3 h-3 text-zinc-600" />
										<span
											class="font-bold {item.peso_novo && item.peso_anterior && item.peso_novo > item.peso_anterior
												? 'text-amber-400'
												: 'text-emerald-400'}"
										>
											{item.peso_novo !== null ? `${item.peso_novo}kg` : '—'}
										</span>
										{#if item.peso_novo && item.peso_anterior}
											{@const dif = Number((item.peso_novo - item.peso_anterior).toFixed(1))}
											<span
												class="text-[10px] font-bold {dif > 0
													? 'text-amber-400'
													: dif < 0
														? 'text-emerald-400'
														: 'text-zinc-500'}"
											>
												({dif > 0 ? `+${dif}` : dif}kg)
											</span>
										{/if}
									</div>

									<!-- Categoria Anterior -> Nova -->
									<div
										class="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800"
										title="Categoria anterior &rarr; Nova categoria oficial CBJ"
									>
										<span
											class="text-[11px] text-zinc-500 max-w-[100px] truncate"
											title={item.categoria_anterior || ''}
										>
											{item.categoria_anterior || 'Sem cat.'}
										</span>
										<ArrowRight class="w-3 h-3 text-zinc-600" />
										<span
											class="text-[11px] font-bold text-white max-w-[150px] truncate"
											title={item.categoria_nova || ''}
										>
											{item.categoria_nova || '—'}
										</span>
									</div>

									<!-- Data da Alteração & Sensei -->
									<div class="text-[11px] text-zinc-500 flex items-center gap-1.5 shrink-0">
										<span>{item.data_alteracao}</span>
										{#if item.nome_professor_responsavel}
											<span class="text-zinc-600">•</span>
											<span class="text-zinc-400">Sensei: {item.nome_professor_responsavel}</span>
										{/if}
									</div>

									<a
										href="/dashboard/alunos/{item.id_aluno}"
										class="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
										title="Abrir judoca"
									>
										<Eye class="w-3.5 h-3.5" />
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</section>
</div>
