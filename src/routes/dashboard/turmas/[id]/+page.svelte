<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Calendar,
		Clock,
		Users,
		Award,
		ArrowLeft,
		UserPlus,
		Trash2,
		AlertCircle,
		CheckCircle2,
		Settings,
		AlertTriangle,
		X,
		ChevronDown,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		LayoutList,
		AlignJustify,
		Search,
		Filter
	} from '@lucide/svelte';
	import {
		ordenarAtletas,
		type CampoOrdenacaoAtleta,
		type DirecaoOrdenacao
	} from '#lib/dominio/ordenacao-atletas';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Aba ativa: 'alunos' ou 'editar'
	let abaAtiva = $state<'alunos' | 'editar'>('alunos');

	// Estados de formulário e modal
	let carregandoMatricula = $state(false);
	let carregandoEdicao = $state(false);
	let carregandoExclusao = $state(false);
	let modalExcluirAberto = $state(false);
	let alunoSelecionado = $state<number | ''>('');
	let filtroBuscaAluno = $state('');

	// Estados de controle da chamada: minimização (accordion), ordenação e densidade
	let listaChamadaExpandida = $state(true);
	let densidadeChamada = $state<'detalhada' | 'compacta'>('compacta');
	let campoOrdenacaoChamada = $state<CampoOrdenacaoAtleta>('graduacao');
	let direcaoOrdenacaoChamada = $state<DirecaoOrdenacao>('desc');
	let filtroBuscaChamada = $state('');
	let filtroIdadeChamada = $state<'TODOS' | 'MENORES' | 'ADULTOS'>('TODOS');

	function alternarDirecaoChamada() {
		direcaoOrdenacaoChamada = direcaoOrdenacaoChamada === 'asc' ? 'desc' : 'asc';
	}

	const diasSemanaOpcoes = [
		'Segunda-feira',
		'Terça-feira',
		'Quarta-feira',
		'Quinta-feira',
		'Sexta-feira',
		'Sábado',
		'Domingo'
	];

	// Conjunto de professores atualmente alocados na turma
	let professoresSelecionados = $state<number[]>([]);

	// Dias selecionados pré-calculados a partir do texto de dia_semana
	let diasSelecionados = $state<string[]>([]);

	$effect(() => {
		if (!data.podeGerenciar && abaAtiva === 'editar') {
			abaAtiva = 'alunos';
		}
		professoresSelecionados = data.turma.professores.map((p) => p.id_professor);
		diasSelecionados = diasSemanaOpcoes.filter((dia) =>
			data.turma.dia_semana.toLowerCase().includes(dia.toLowerCase().split('-')[0])
		);
	});

	function alternarProfessor(idProfessor: number) {
		if (professoresSelecionados.includes(idProfessor)) {
			professoresSelecionados = professoresSelecionados.filter((id) => id !== idProfessor);
		} else {
			professoresSelecionados = [...professoresSelecionados, idProfessor];
		}
	}

	function alternarDia(dia: string) {
		if (diasSelecionados.includes(dia)) {
			diasSelecionados = diasSelecionados.filter((d) => d !== dia);
		} else {
			diasSelecionados = [...diasSelecionados, dia];
		}
	}

	// Alunos disponíveis filtrados
	let alunosFiltrados = $derived(
		filtroBuscaAluno.trim() === ''
			? data.alunosDisponiveis
			: data.alunosDisponiveis.filter((a) =>
					a.nome.toLowerCase().includes(filtroBuscaAluno.toLowerCase()) ||
					(a.matricula && a.matricula.toLowerCase().includes(filtroBuscaAluno.toLowerCase()))
				)
	);

	// Filtragem e ordenação reativa dos judocas matriculados na turma
	const alunosChamadaFiltrados = $derived(
		data.turma.alunos_matriculados.filter((aluno) => {
			if (filtroIdadeChamada === 'MENORES' && !aluno.menor_idade) return false;
			if (filtroIdadeChamada === 'ADULTOS' && aluno.menor_idade) return false;
			if (filtroBuscaChamada.trim() !== '') {
				const termo = filtroBuscaChamada.toLowerCase();
				const matchNome = aluno.nome.toLowerCase().includes(termo);
				const matchMatricula = aluno.matricula ? aluno.matricula.toLowerCase().includes(termo) : false;
				const matchFaixa = aluno.graduacao_atual.toLowerCase().includes(termo);
				const matchCategoria = aluno.categoria ? aluno.categoria.toLowerCase().includes(termo) : false;
				if (!matchNome && !matchMatricula && !matchFaixa && !matchCategoria) return false;
			}
			return true;
		})
	);

	const alunosChamadaOrdenados = $derived(
		ordenarAtletas(alunosChamadaFiltrados, campoOrdenacaoChamada, direcaoOrdenacaoChamada)
	);
</script>

<svelte:head>
	<title>{data.turma.descricao} - Manutenção da Turma</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/turmas"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Grade de Turmas</span>
		</a>

		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-2 mb-1">
					<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
						Turma #{data.turma.id_treino}
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-zinc-400 font-mono">{data.turma.dia_semana}</span>
				</div>
				<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					{data.turma.descricao}
				</h1>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<div class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
					<Clock class="w-4 h-4 text-red-400" />
					<span class="text-xs font-mono text-zinc-200 font-medium">
						{data.turma.horario_inicio} às {data.turma.horario_fim}
					</span>
				</div>
				<div class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
					<Users class="w-4 h-4 text-emerald-400" />
					<span class="text-xs font-mono text-zinc-200 font-medium">
						{data.turma.alunos_matriculados.length} atletas
					</span>
				</div>
				{#if data.podeGerenciar}
					<button
						type="button"
						onclick={() => (abaAtiva = abaAtiva === 'alunos' ? 'editar' : 'alunos')}
						class="px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 {abaAtiva === 'editar'
							? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
							: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'}"
					>
						<Settings class="w-3.5 h-3.5" />
						<span>{abaAtiva === 'editar' ? 'Ver Chamada' : 'Editar Turma'}</span>
					</button>
				{/if}
			</div>
		</div>

		<!-- Senseis Responsáveis Alocados -->
		{#if data.turma.professores.length > 0}
			<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
				<span class="font-mono uppercase text-zinc-500">Senseis Responsáveis:</span>
				{#each data.turma.professores as prof}
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-200">
						<Award class="w-3.5 h-3.5 text-amber-500" />
						<span class="font-medium text-white">{prof.nome}</span>
						{#if prof.grau_faixa}
							<span class="text-zinc-500 font-mono">({prof.grau_faixa})</span>
						{/if}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- NAVEGAÇÃO POR ABAS -->
	<div class="flex items-center gap-2 border-b border-zinc-900 pb-3">
		<button
			type="button"
			onclick={() => (abaAtiva = 'alunos')}
			class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors {abaAtiva === 'alunos'
				? 'bg-zinc-900 text-white border border-zinc-800'
				: 'text-zinc-400 hover:text-white'}"
		>
			<Users class="w-4 h-4 text-emerald-400" />
			<span>Judocas Matriculados</span>
			<span class="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-mono text-zinc-300">
				{data.turma.alunos_matriculados.length}
			</span>
		</button>

		{#if data.podeGerenciar}
			<button
				type="button"
				onclick={() => (abaAtiva = 'editar')}
				class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors {abaAtiva === 'editar'
					? 'bg-zinc-900 text-white border border-zinc-800'
					: 'text-zinc-400 hover:text-white'}"
			>
				<Settings class="w-4 h-4 text-red-500" />
				<span>Editar Turma, Horários e Senseis</span>
			</button>
		{/if}
	</div>

	<!-- ALERTAS DE FEEDBACK GLOBAIS -->
	{#if form?.sucessoEdicao}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-2">
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
			<span>Informações e horários da turma atualizados com sucesso!</span>
		</div>
	{/if}

	{#if form?.erroEdicao}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-2">
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
			<div>
				<span class="font-bold block">Erro ao atualizar a turma:</span>
				<span>{form.erroEdicao}</span>
			</div>
		</div>
	{/if}

	{#if form?.erroMatricula}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-center gap-2">
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
			<span>{form.erroMatricula}</span>
		</div>
	{/if}

	<!-- CONTEÚDO DA ABA 1: JUDOCAS & MATRÍCULA -->
	{#if abaAtiva === 'alunos'}
		<!-- MATRICULAR NOVO ALUNO NA TURMA -->
		{#if data.podeGerenciar && data.alunosDisponiveis.length > 0}
			<div class="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-2">
							<UserPlus class="w-4 h-4 text-red-500" />
							Adicionar Judoca à Turma
						</h3>
						<p class="text-xs text-zinc-500 mt-0.5">
							Selecione um dos {data.alunosDisponiveis.length} atletas do dojo ainda não matriculados neste horário.
						</p>
					</div>
				</div>

				<form
					action="?/matricular"
					method="POST"
					use:enhance={() => {
						carregandoMatricula = true;
						return async ({ update }) => {
							await update();
							carregandoMatricula = false;
							alunoSelecionado = '';
						};
					}}
					class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
				>
					<div class="flex-1">
						<select
							name="idAluno"
							bind:value={alunoSelecionado}
							required
							class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						>
							<option value="">Selecione um judoca do dojo para incluir na turma...</option>
							{#each data.alunosDisponiveis as aluno}
								<option value={aluno.id_usuario}>
									{aluno.nome} ({aluno.graduacao_atual}) - {aluno.idade} anos {aluno.matricula ? `• Matrícula: ${aluno.matricula}` : ''}
								</option>
							{/each}
						</select>
					</div>

					<button
						type="submit"
						disabled={carregandoMatricula || !alunoSelecionado}
						class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_15px_rgba(220,38,38,0.25)] transition-all disabled:opacity-50 shrink-0"
					>
						{#if carregandoMatricula}
							<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
							<span>Adicionando...</span>
						{:else}
							<UserPlus class="w-4 h-4" />
							<span>Adicionar à Turma</span>
						{/if}
					</button>
				</form>
			</div>
		{/if}

		<!-- ========================================================================= -->
		<!-- LISTA DE CHAMADA COM MINIMIZAÇÃO (ACCORDION), FILTROS E ORDENAÇÃO         -->
		<!-- ========================================================================= -->
		<section class="rounded-3xl bg-zinc-950 border border-zinc-900 overflow-hidden shadow-sm">
			<!-- Header Colapsável com Resumo (Padrão idêntico aos Logs do Dojo) -->
			<div
				class="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
				onclick={() => (listaChamadaExpandida = !listaChamadaExpandida)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && (listaChamadaExpandida = !listaChamadaExpandida)}
				aria-expanded={listaChamadaExpandida}
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
								Lista de Chamada & Judocas Matriculados
							</h2>
							<span
								class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold"
							>
								{alunosChamadaOrdenados.length} {alunosChamadaOrdenados.length === 1 ? 'atleta' : 'atletas'}
							</span>
							{#if data.turma.alunos_matriculados.filter((a) => a.menor_idade).length > 0}
								<span
									class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-300"
								>
									{data.turma.alunos_matriculados.filter((a) => a.menor_idade).length} menores
								</span>
							{/if}
						</div>
						<p class="text-[11px] text-zinc-400 mt-0.5">
							Alocação técnica de tatame, graduações ativas e categorias oficiais para o treino.
						</p>
					</div>
				</div>

				<div class="flex items-center gap-3 self-end sm:self-auto shrink-0">
					<span
						class="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800"
					>
						{listaChamadaExpandida ? 'Recolher Chamada ▲' : 'Expandir Chamada ▼'}
					</span>
					<div
						class="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-transform duration-200 {listaChamadaExpandida
							? 'rotate-180'
							: ''}"
					>
						<ChevronDown class="w-4 h-4" />
					</div>
				</div>
			</div>

			<!-- Conteúdo Expandido (Quando listaChamadaExpandida = true) -->
			{#if listaChamadaExpandida}
				<div class="border-t border-zinc-900 p-5 sm:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200 bg-zinc-950/80">
					{#if data.turma.alunos_matriculados.length > 0}
						<!-- Barra de Ferramentas: Filtros + Busca + Ordenação + Densidade -->
						<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-zinc-900">
							<!-- 1. Chips de Filtro & Busca Inline -->
							<div class="flex items-center gap-2 flex-wrap text-xs flex-1">
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1 mr-1"
								>
									<Filter class="w-3 h-3" />
									<span>Filtro:</span>
								</span>
								<button
									type="button"
									onclick={() => (filtroIdadeChamada = 'TODOS')}
									class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroIdadeChamada ===
									'TODOS'
										? 'bg-red-950/50 border-red-800/80 text-white font-bold'
										: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
								>
									Todos ({data.turma.alunos_matriculados.length})
								</button>
								<button
									type="button"
									onclick={() => (filtroIdadeChamada = 'MENORES')}
									class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroIdadeChamada ===
									'MENORES'
										? 'bg-amber-950/50 border-amber-800/80 text-amber-200 font-bold'
										: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
								>
									Menores de 18
								</button>
								<button
									type="button"
									onclick={() => (filtroIdadeChamada = 'ADULTOS')}
									class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroIdadeChamada ===
									'ADULTOS'
										? 'bg-sky-950/50 border-sky-800/80 text-sky-200 font-bold'
										: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
								>
									Adultos
								</button>

								<!-- Busca Rápida Inline -->
								<div class="relative ml-auto sm:ml-2 min-w-[200px]">
									<Search class="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
									<input
										type="text"
										bind:value={filtroBuscaChamada}
										placeholder="Filtrar judoca nesta turma..."
										class="w-full pl-8 pr-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 font-mono"
									/>
									{#if filtroBuscaChamada}
										<button
											type="button"
											onclick={() => (filtroBuscaChamada = '')}
											class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
										>
											×
										</button>
									{/if}
								</div>
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
										bind:value={campoOrdenacaoChamada}
										class="bg-zinc-950 border border-zinc-800 text-white text-xs font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-red-600"
									>
										<option value="graduacao">Graduação (Faixa)</option>
										<option value="idade">Idade</option>
										<option value="categoria">Categoria CBJ</option>
										<option value="nome">Nome (A-Z)</option>
									</select>

									<!-- Alternador de Direção Asc/Desc -->
									<button
										type="button"
										onclick={alternarDirecaoChamada}
										class="p-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
										title={direcaoOrdenacaoChamada === 'asc' ? 'Ordem Crescente (clique para inverter)' : 'Ordem Decrescente (clique para inverter)'}
									>
										{#if direcaoOrdenacaoChamada === 'asc'}
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
										onclick={() => (densidadeChamada = 'detalhada')}
										class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 {densidadeChamada ===
										'detalhada'
											? 'bg-zinc-800 text-white font-bold shadow-sm'
											: 'text-zinc-500 hover:text-zinc-300'}"
										title="Visualização Detalhada em Tabela"
									>
										<LayoutList class="w-3.5 h-3.5" />
										<span>Detalhada</span>
									</button>
									<button
										type="button"
										onclick={() => (densidadeChamada = 'compacta')}
										class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 {densidadeChamada ===
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

						<!-- Tabela de Chamada (Detalhada ou Compacta) -->
						{#if alunosChamadaOrdenados.length > 0}
							<div
								class="overflow-hidden rounded-2xl border border-zinc-900 {densidadeChamada === 'compacta'
									? 'max-h-96 overflow-y-auto'
									: ''}"
							>
								<div class="overflow-x-auto">
									<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
										<thead
											class="bg-zinc-900/80 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-800 sticky top-0 backdrop-blur-sm z-10"
										>
											<tr>
												<th class="{densidadeChamada === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
													Judoca
												</th>
												<th class="{densidadeChamada === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
													Graduação (Faixa)
												</th>
												<th class="{densidadeChamada === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
													Idade
												</th>
												<th class="{densidadeChamada === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
													Categoria CBJ
												</th>
												{#if densidadeChamada === 'detalhada'}
													<th class="px-6 py-4">Matrícula</th>
												{/if}
												{#if data.podeGerenciar}
													<th class="{densidadeChamada === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'} text-right">
														Ação
													</th>
												{/if}
											</tr>
										</thead>
										<tbody class="divide-y divide-zinc-900">
											{#each alunosChamadaOrdenados as aluno}
												<tr class="hover:bg-zinc-900/30 transition-colors">
													<!-- Judoca -->
													<td class="{densidadeChamada === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'} font-semibold text-white">
														{#if data.podeVerAlunos}
															<a
																href="/dashboard/alunos/{aluno.id_usuario}"
																class="hover:text-red-400 hover:underline transition-colors block {densidadeChamada === 'compacta' ? 'text-xs' : ''}"
															>
																{aluno.nome}
															</a>
														{:else}
															<span class="{densidadeChamada === 'compacta' ? 'text-xs' : ''}">{aluno.nome}</span>
														{/if}
														{#if densidadeChamada === 'compacta' && aluno.matricula}
															<span class="text-[10px] font-mono text-zinc-500">Mat: {aluno.matricula}</span>
														{/if}
													</td>

													<!-- Faixa com mesmo tamanho uniforme e legenda na versão detalhada -->
													<td class="{densidadeChamada === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
														<BadgeFaixa
															faixa={aluno.graduacao_atual}
															size={densidadeChamada === 'detalhada' ? 'md' : 'sm'}
															showLegend={densidadeChamada === 'detalhada'}
														/>
													</td>

													<!-- Idade -->
													<td class="{densidadeChamada === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
														<div class="flex items-center gap-1.5 font-mono text-zinc-300">
															<span class="text-xs">{aluno.idade} anos</span>
															{#if aluno.menor_idade}
																<span
																	class="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-950/40 border border-amber-800/60 text-amber-300"
																>
																	Menor
																</span>
															{/if}
														</div>
													</td>

													<!-- Categoria CBJ -->
													<td class="{densidadeChamada === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
														{#if aluno.categoria}
															<span
																class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-800/50"
															>
																{aluno.categoria}
															</span>
														{:else}
															<span class="text-zinc-600 font-mono text-[11px]">-</span>
														{/if}
													</td>

													<!-- Matrícula -->
													{#if densidadeChamada === 'detalhada'}
														<td class="px-6 py-4 font-mono text-zinc-400">
															{aluno.matricula || '-'}
														</td>
													{/if}

													<!-- Ação de Remover -->
													{#if data.podeGerenciar}
														<td class="{densidadeChamada === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'} text-right">
															<form action="?/desmatricular" method="POST" use:enhance class="inline-block">
																<input type="hidden" name="idAluno" value={aluno.id_usuario} />
																<button
																	type="submit"
																	class="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
																	title="Remover judoca desta turma"
																>
																	<Trash2 class="w-4 h-4" />
																</button>
															</form>
														</td>
													{/if}
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{:else}
							<div class="p-8 text-center text-xs text-zinc-500 font-mono">
								Nenhum judoca encontrado com os filtros aplicados.
							</div>
						{/if}
					{:else}
						<div class="p-8 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
							<Users class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
							<h4 class="text-sm font-bold text-white font-display">Nenhum judoca matriculado nesta turma</h4>
							<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
								Utilize o seletor acima para matricular atletas do dojo neste treino.
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</section>
	{/if}

	<!-- CONTEÚDO DA ABA 2: EDITAR TURMA, HORÁRIOS & SENSEIS -->
	{#if abaAtiva === 'editar'}
		<form
			action="?/atualizar"
			method="POST"
			use:enhance={() => {
				carregandoEdicao = true;
				return async ({ update }) => {
					await update();
					carregandoEdicao = false;
				};
			}}
			class="space-y-6 max-w-4xl"
		>
			<!-- 1. IDENTIFICAÇÃO E DIAS -->
			<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
				<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
						<Calendar class="w-4 h-4 text-red-500" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">Identificação da Turma</h2>
						<p class="text-[11px] text-zinc-500">Altere a descrição e os dias da semana do treino</p>
					</div>
				</div>

				<div>
					<label for="descricao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Descrição da Turma / Categoria *
					</label>
					<input
						type="text"
						id="descricao"
						name="descricao"
						required
						value={data.turma.descricao}
						placeholder="Ex: Judô Infantil Sub-11 / Faixas Iniciais"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<span class="block text-xs font-mono uppercase text-zinc-400 mb-2">
						Dias da Semana em que o Treino Ocorre *
					</span>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
						{#each diasSemanaOpcoes as dia}
							<label
								class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors {diasSelecionados.includes(dia)
									? 'bg-red-950/20 border-red-800/80 text-white'
									: 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 text-zinc-300'}"
							>
								<input
									type="checkbox"
									name="dias"
									value={dia}
									checked={diasSelecionados.includes(dia)}
									onchange={() => alternarDia(dia)}
									class="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-red-600"
								/>
								<span class="text-xs font-medium">{dia}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<!-- 2. ALTERAÇÃO DOS HORÁRIOS -->
			<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
				<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
						<Clock class="w-4 h-4 text-red-500" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">Horários de Tatame</h2>
						<p class="text-[11px] text-zinc-500">Defina o horário exato de início e término das aulas</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="horarioInicio" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
							Horário de Início *
						</label>
						<input
							type="time"
							id="horarioInicio"
							name="horarioInicio"
							required
							value={data.turma.horario_inicio}
							class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						/>
					</div>

					<div>
						<label for="horarioFim" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
							Horário de Término *
						</label>
						<input
							type="time"
							id="horarioFim"
							name="horarioFim"
							required
							value={data.turma.horario_fim}
							class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						/>
					</div>
				</div>
			</div>

			<!-- 3. PROFESSORES VINCULADOS AO TREINO (SUPORTE A MAIS DE UM PROFESSOR) -->
			<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
				<div class="flex items-center justify-between pb-4 border-b border-zinc-900">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
							<Award class="w-4 h-4 text-red-500" />
						</div>
						<div>
							<h2 class="text-sm font-bold text-white font-display">Equipe de Senseis Responsáveis</h2>
							<p class="text-[11px] text-zinc-500">
								Selecione um ou mais professores vinculados a este horário de treino
							</p>
						</div>
					</div>

					<span class="text-xs font-mono text-zinc-400">
						{professoresSelecionados.length} selecionado(s)
					</span>
				</div>

				{#if data.professoresDojo.length > 0}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each data.professoresDojo as prof}
							<label
								class="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all {professoresSelecionados.includes(prof.id_usuario)
									? 'bg-zinc-900 border-red-600/80 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
									: 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800'}"
							>
								<input
									type="checkbox"
									name="professoresIds"
									value={prof.id_usuario}
									checked={professoresSelecionados.includes(prof.id_usuario)}
									onchange={() => alternarProfessor(prof.id_usuario)}
									class="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-red-600"
								/>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="text-xs font-semibold text-white block truncate">
											{prof.nome}
										</span>
										{#if professoresSelecionados.includes(prof.id_usuario)}
											<span class="px-1.5 py-0.5 rounded text-[10px] bg-red-600/20 text-red-400 font-mono">
												Vinculado
											</span>
										{/if}
									</div>
									<span class="text-[11px] font-mono text-zinc-500 block">
										{prof.grau_faixa || 'Sensei'} • Reg: {prof.n_federacao || 'Federado'}
									</span>
								</div>
							</label>
						{/each}
					</div>
				{:else}
					<div class="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 text-xs text-amber-300">
						Nenhum professor cadastrado neste dojo ainda. Cadastre um usuário com o perfil de Professor.
					</div>
				{/if}
			</div>

			<!-- BOTÕES DE SALVAR ALTERAÇÕES -->
			<div class="flex items-center justify-between pt-4 border-t border-zinc-900">
				<button
					type="button"
					onclick={() => (modalExcluirAberto = true)}
					class="px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-950 text-xs font-medium transition-colors flex items-center gap-1.5"
				>
					<Trash2 class="w-3.5 h-3.5" />
					<span>Excluir Turma</span>
				</button>

				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={() => (abaAtiva = 'alunos')}
						class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition-colors"
					>
						Cancelar
					</button>

					<button
						type="submit"
						disabled={carregandoEdicao || professoresSelecionados.length === 0}
						class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50"
					>
						{#if carregandoEdicao}
							<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
							<span>Salvando alterações...</span>
						{:else}
							<CheckCircle2 class="w-4 h-4" />
							<span>Salvar Dados da Turma</span>
						{/if}
					</button>
				</div>
			</div>
		</form>
	{/if}
</div>

<!-- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE TURMA -->
{#if modalExcluirAberto}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-2xl bg-zinc-950 border border-red-900/60 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
			<div class="flex items-start gap-4">
				<div class="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800 flex items-center justify-center text-red-500 shrink-0">
					<AlertTriangle class="w-5 h-5" />
				</div>
				<div class="flex-1">
					<h3 class="text-base font-bold text-white font-display">
						Excluir Turma de Tatame?
					</h3>
					<p class="text-xs text-zinc-400 mt-1 leading-relaxed">
						Tem certeza que deseja excluir a turma <strong class="text-white">{data.turma.descricao}</strong>?
						Todas as matrículas vinculadas a este treino serão removidas. Os judocas continuarão cadastrados normalmente no sistema.
					</p>
				</div>
			</div>

			<div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
				<button
					type="button"
					onclick={() => (modalExcluirAberto = false)}
					class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
				>
					Cancelar
				</button>

				<form
					action="?/excluir"
					method="POST"
					use:enhance={() => {
						carregandoExclusao = true;
						return async ({ update }) => {
							await update();
							carregandoExclusao = false;
						};
					}}
				>
					<button
						type="submit"
						disabled={carregandoExclusao}
						class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all disabled:opacity-50"
					>
						{#if carregandoExclusao}
							<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
							<span>Excluindo...</span>
						{:else}
							<Trash2 class="w-3.5 h-3.5" />
							<span>Confirmar Exclusão</span>
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
