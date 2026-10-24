<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PendenciasTecnicasDojo } from '#lib/server/repositorios/dashboard.repo';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		AlertTriangle,
		CheckCircle2,
		Scale,
		Users,
		Award,
		Trophy,
		ArrowRight,
		CalendarDays,
		Sparkles,
		History,
		RefreshCw
	} from '@lucide/svelte';

	interface Props {
		pendencias: PendenciasTecnicasDojo;
		escopo?: 'tutela' | 'geral' | 'responsavel';
		subtitulo?: string;
		onSelecionarAluno?: (idAluno: number) => void;
	}

	let { pendencias, escopo = 'geral', subtitulo, onSelecionarAluno }: Props = $props();

	let atualizandoCategorias = $state(false);

	const alunosSemPeso = $derived(pendencias?.alunosSemPeso || []);
	const alunosSemTurma = $derived(pendencias?.alunosSemTurma || []);
	const alunosFederacaoPendente = $derived(
		(pendencias?.alunosFederacaoPendente || []).filter(
			(a) => a.status_federacao && a.status_federacao.trim().toLowerCase() === 'pendente'
		)
	);
	const campeonatosPendentesAutorizacao = $derived(
		pendencias?.campeonatosPendentesAutorizacao || []
	);
	const mudancasRecentesPeso = $derived(pendencias?.mudancasRecentesPeso || []);
	const mudancasExibidas = $derived(mudancasRecentesPeso.slice(0, 3));
	const viradaTemporada = $derived(pendencias?.viradaTemporada || null);

	const totalPendencias = $derived(
		alunosSemPeso.length +
			alunosSemTurma.length +
			alunosFederacaoPendente.length +
			campeonatosPendentesAutorizacao.length +
			(viradaTemporada?.totalDesatualizados || 0)
	);

	const subtituloCalculado = $derived(
		subtitulo ||
			(escopo === 'responsavel'
				? 'Atletas sob sua responsabilidade que necessitam de intervenção ou regularização'
				: escopo === 'tutela'
					? 'Atletas sob sua tutela que necessitam de intervenção ou regularização'
					: 'Atletas do dojo que necessitam de intervenção ou regularização')
	);

	const descricaoSemTurma = $derived(
		escopo === 'responsavel'
			? 'Seus dependentes que respondem ao seu cadastro mas ainda não estão matriculados em nenhum horário semanal:'
			: escopo === 'tutela'
				? 'Judocas que respondem a você mas não estão matriculados em nenhum horário semanal:'
				: 'Judocas que respondem à academia mas não estão matriculados em nenhum horário semanal:'
	);

	const descricaoCampeonatos = $derived(
		escopo === 'responsavel'
			? 'Os seguintes judocas menores de idade possuem inscrições aguardando sua autorização expressa para participar da chave de lutas:'
			: 'Atletas menores de idade inscritos em competições que aguardam autorização do responsável legal:'
	);

	const descricaoEmDia = $derived(
		escopo === 'responsavel'
			? 'Todos os seus dependentes estão devidamente pesados, matriculados em turmas e sem pendências de campeonatos.'
			: escopo === 'tutela'
				? 'Todos os judocas sob sua responsabilidade estão devidamente pesados e matriculados em turmas.'
				: 'Todos os judocas do dojo estão devidamente pesados e matriculados em turmas.'
	);
</script>

<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-sm space-y-4">
	<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
		<div class="flex items-center gap-2.5">
			<div
				class="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400"
			>
				<AlertTriangle class="w-4 h-4 text-red-400" />
			</div>
			<div>
				<h2 class="text-sm font-bold text-white font-display">
					Conformidade & Pendências dos Alunos
				</h2>
				<p class="text-[11px] text-zinc-500">
					{subtituloCalculado}
				</p>
			</div>
		</div>
		{#if totalPendencias === 0}
			<span
				class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-800 text-emerald-400"
			>
				✓ 100% Em Dia
			</span>
		{:else}
			<span
				class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-950/60 border border-red-800 text-red-400"
			>
				{totalPendencias} pendência{totalPendencias > 1 ? 's' : ''}
			</span>
		{/if}
	</div>

	<!-- ========================================================================= -->
	<!-- 0. ALERTA DE VIRADA DE TEMPORADA / MUDANÇA DE FAIXA ETÁRIA (CBJ / FPJ)   -->
	<!-- ========================================================================= -->
	{#if viradaTemporada && viradaTemporada.totalDesatualizados > 0}
		<div
			class="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-zinc-950 border border-amber-500/50 shadow-lg space-y-3"
		>
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div class="flex items-start gap-2.5">
					<div
						class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5"
					>
						<CalendarDays class="w-4 h-4 text-amber-400" />
					</div>
					<div>
						<div class="flex items-center gap-2 flex-wrap">
							<span class="text-xs font-bold text-amber-300">
								Alerta de Virada de Temporada — Ano Calendário {viradaTemporada.anoVigente}
							</span>
							<span
								class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/90 border border-amber-700 text-amber-300"
							>
								{viradaTemporada.totalDesatualizados} atleta{viradaTemporada.totalDesatualizados > 1 ? 's' : ''} com classe defasada
							</span>
						</div>
						<p class="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
							Pelo regulamento oficial da CBJ/FPJ, a classe etária (Sub-11, Sub-15, Sub-18, etc.) é calculada pelo ano civil de nascimento ({viradaTemporada.anoVigente} - ano). Com a virada do calendário, as categorias dos atletas abaixo precisam de sincronização.
						</p>
					</div>
				</div>

				<form
					method="POST"
					action="/dashboard?/recalcularCategorias"
					use:enhance={() => {
						atualizandoCategorias = true;
						return async ({ update }) => {
							await update();
							atualizandoCategorias = false;
						};
					}}
					class="shrink-0"
				>
					<button
						type="submit"
						disabled={atualizandoCategorias}
						class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
					>
						{#if atualizandoCategorias}
							<RefreshCw class="w-3.5 h-3.5 animate-spin" />
							<span>Atualizando...</span>
						{:else}
							<Sparkles class="w-3.5 h-3.5 text-zinc-950" />
							<span>Atualizar Temporada {viradaTemporada.anoVigente}</span>
						{/if}
					</button>
				</form>
			</div>

			<!-- Lista detalhada dos judocas com categoria defasada pela virada do ano -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
				{#each viradaTemporada.alunos as aluno (aluno.id_usuario)}
					<div
						class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-900/90 border border-amber-900/40 text-xs"
					>
						<div class="flex items-center gap-2 min-w-0">
							{#if onSelecionarAluno}
								<button
									type="button"
									onclick={() => onSelecionarAluno(aluno.id_usuario)}
									class="text-left font-semibold text-white truncate hover:text-amber-400 cursor-pointer"
								>
									{aluno.nome}
								</button>
							{:else}
								<a
									href="/dashboard/alunos/{aluno.id_usuario}"
									class="font-semibold text-white truncate hover:text-amber-400"
								>
									{aluno.nome}
								</a>
							{/if}
							<BadgeFaixa faixa={aluno.graduacao_atual} size="sm" />
							<span class="text-[10px] font-mono text-zinc-400">({aluno.classe_esperada})</span>
						</div>
						<div class="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
							<span class="text-zinc-500 line-through truncate max-w-[85px]" title={aluno.categoria_atual || ''}>
								{aluno.categoria_atual || 'Sem cat.'}
							</span>
							<ArrowRight class="w-3 h-3 text-amber-400 shrink-0" />
							<span class="text-amber-300 font-bold truncate max-w-[110px]" title={aluno.categoria_esperada || ''}>
								{aluno.categoria_esperada || 'A calcular'}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if totalPendencias === 0}
		<div class="py-6 text-center space-y-1.5">
			<CheckCircle2 class="w-8 h-8 mx-auto text-emerald-500" />
			<p class="text-xs text-zinc-300 font-semibold">Nenhuma pendência técnica encontrada!</p>
			<p class="text-[11px] text-zinc-500">
				{descricaoEmDia}
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			<!-- 1. Alunos sem peso -->
			{#if alunosSemPeso.length > 0}
				<div class="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-2">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-xs font-bold text-amber-300">
							<Scale class="w-4 h-4 text-amber-400" />
							<span>Pesagem Pendente ({alunosSemPeso.length} aluno(s))</span>
						</div>
						<span class="text-[10px] font-mono text-amber-400/80">Necessário para competições</span>
					</div>
					<p class="text-[11px] text-zinc-400">
						Os seguintes judocas ainda não tiveram seu peso corporal registrado no dojo:
					</p>
					<div class="flex items-center gap-2 flex-wrap pt-1">
						{#each alunosSemPeso as a (a.id_usuario)}
							{#if onSelecionarAluno}
								<button
									type="button"
									onclick={() => onSelecionarAluno(a.id_usuario)}
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white hover:border-amber-500 hover:bg-zinc-800 transition-colors cursor-pointer text-left"
									title={a.nome_professor_responsavel ? `Sensei: ${a.nome_professor_responsavel}` : undefined}
								>
									<span>{a.nome}</span>
									<BadgeFaixa faixa={a.graduacao_atual} size="sm" />
								</button>
							{:else}
								<a
									href="/dashboard/alunos/{a.id_usuario}"
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white hover:border-amber-500 transition-colors"
									title={a.nome_professor_responsavel ? `Sensei: ${a.nome_professor_responsavel}` : undefined}
								>
									<span>{a.nome}</span>
									<BadgeFaixa faixa={a.graduacao_atual} size="sm" />
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- 2. Alunos sem turma vinculada -->
			{#if alunosSemTurma.length > 0}
				<div class="p-4 rounded-xl bg-red-950/20 border border-red-800/50 space-y-2">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-xs font-bold text-red-300">
							<Users class="w-4 h-4 text-red-400" />
							<span>Sem Turma Vinculada ({alunosSemTurma.length} aluno(s))</span>
						</div>
						<span class="text-[10px] font-mono text-red-400/80">Alocação no tatame</span>
					</div>
					<p class="text-[11px] text-zinc-400">
						{descricaoSemTurma}
					</p>
					<div class="flex items-center gap-2 flex-wrap pt-1">
						{#each alunosSemTurma as a (a.id_usuario)}
							{#if onSelecionarAluno}
								<button
									type="button"
									onclick={() => onSelecionarAluno(a.id_usuario)}
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white hover:border-red-500 hover:bg-zinc-800 transition-colors cursor-pointer text-left"
									title={a.nome_professor_responsavel ? `Sensei: ${a.nome_professor_responsavel}` : undefined}
								>
									<span>{a.nome}</span>
									<BadgeFaixa faixa={a.graduacao_atual} size="sm" />
								</button>
							{:else}
								<a
									href="/dashboard/alunos/{a.id_usuario}"
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white hover:border-red-500 transition-colors"
									title={a.nome_professor_responsavel ? `Sensei: ${a.nome_professor_responsavel}` : undefined}
								>
									<span>{a.nome}</span>
									<BadgeFaixa faixa={a.graduacao_atual} size="sm" />
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- 3. Alunos com federação pendente -->
			{#if alunosFederacaoPendente.length > 0}
				<div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-xs font-bold text-zinc-300">
							<Award class="w-4 h-4 text-zinc-400" />
							<span>Federação Pendente ({alunosFederacaoPendente.length} aluno(s))</span>
						</div>
						<span class="text-[10px] font-mono text-zinc-500">FPJ / CBJ</span>
					</div>
					<div class="flex items-center gap-2 flex-wrap pt-1">
						{#each alunosFederacaoPendente as a (a.id_usuario)}
							{#if onSelecionarAluno}
								<button
									type="button"
									onclick={() => onSelecionarAluno(a.id_usuario)}
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 transition-colors cursor-pointer text-left"
									title={a.nome_professor_responsavel ? `Sensei: ${a.nome_professor_responsavel}` : undefined}
								>
									<span>{a.nome}</span>
									<span class="text-[10px] text-amber-400 font-mono">({a.status_federacao || 'Pendente'})</span>
								</button>
							{:else}
								<a
									href="/dashboard/alunos/{a.id_usuario}"
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-600 transition-colors"
									title={a.nome_professor_responsavel ? `Sensei: ${a.nome_professor_responsavel}` : undefined}
								>
									<span>{a.nome}</span>
									<span class="text-[10px] text-amber-400 font-mono">({a.status_federacao || 'Pendente'})</span>
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- 4. Autorizações Pendentes em Campeonatos -->
			{#if campeonatosPendentesAutorizacao.length > 0}
				<div class="p-4 rounded-xl bg-purple-950/20 border border-purple-800/50 space-y-2.5">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-xs font-bold text-purple-300">
							<Trophy class="w-4 h-4 text-purple-400" />
							<span>Autorização em Campeonatos ({campeonatosPendentesAutorizacao.length} pendente(s))</span>
						</div>
						<span class="text-[10px] font-mono text-purple-400/80">Requer Responsável Legal</span>
					</div>
					<p class="text-[11px] text-zinc-400">
						{descricaoCampeonatos}
					</p>
					<div class="space-y-2 pt-1">
						{#each campeonatosPendentesAutorizacao as c (c.id_inscricao)}
							<div
								class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-purple-600/60 transition-colors"
							>
								<div class="flex items-center gap-2 flex-wrap min-w-0">
									{#if onSelecionarAluno}
										<button
											type="button"
											onclick={() => onSelecionarAluno(c.id_aluno)}
											class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white hover:border-purple-500 hover:bg-zinc-900 transition-colors cursor-pointer text-left"
											title="Clique para selecionar este dependente no painel"
										>
											<span>{c.nome_aluno}</span>
											<BadgeFaixa faixa={c.graduacao_atual} size="sm" />
										</button>
									{:else}
										<a
											href="/dashboard/alunos/{c.id_aluno}"
											class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white hover:border-purple-500 transition-colors"
											title={c.nome_professor_responsavel ? `Sensei: ${c.nome_professor_responsavel}` : undefined}
										>
											<span>{c.nome_aluno}</span>
											<BadgeFaixa faixa={c.graduacao_atual} size="sm" />
										</a>
									{/if}

									<span class="text-xs text-zinc-300 font-medium truncate">
										{c.nome_campeonato}
									</span>

									{#if c.data_campeonato}
										<span class="text-[10px] font-mono text-zinc-500">
											• {c.data_campeonato}
										</span>
									{/if}
								</div>

								<a
									href="/dashboard/campeonatos/{c.id_evento}"
									class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/60 text-xs font-semibold text-purple-200 transition-all shrink-0 hover:scale-105 active:scale-95"
								>
									<span>Autorizar Campeonato</span>
									<ArrowRight class="w-3.5 h-3.5" />
								</a>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 5. AVISO TÉCNICO: ALTERAÇÕES RECENTES DE PESO E CATEGORIA (SENSEI/ADMIN) -->
	<!-- ========================================================================= -->
	{#if mudancasRecentesPeso.length > 0}
		<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3 pt-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<History class="w-4 h-4 text-emerald-400" />
					<span class="text-xs font-bold text-white">
						Alterações Recentes de Peso & Categoria ({mudancasRecentesPeso.length})
					</span>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">Últimos 30 dias</span>
			</div>
			<p class="text-[11px] text-zinc-400 leading-relaxed">
				{escopo === 'tutela'
					? 'Judocas sob sua responsabilidade técnica que atualizaram a pesagem corporal e tiveram categoria recalculada:'
					: 'Atletas do dojo que atualizaram a pesagem corporal na balança e tiveram categoria recalculada:'}
			</p>

			<div class="space-y-2">
				{#each mudancasExibidas as m (m.id_log)}
					<div
						class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/70 hover:border-zinc-700 transition-colors"
					>
						<div class="flex items-center gap-2 flex-wrap min-w-0">
							{#if onSelecionarAluno}
								<button
									type="button"
									onclick={() => onSelecionarAluno(m.id_aluno)}
									class="text-left font-semibold text-xs text-white hover:text-emerald-400 cursor-pointer truncate"
								>
									{m.nome_aluno}
								</button>
							{:else}
								<a
									href="/dashboard/alunos/{m.id_aluno}"
									class="font-semibold text-xs text-white hover:text-emerald-400 truncate"
								>
									{m.nome_aluno}
								</a>
							{/if}
							<BadgeFaixa faixa={m.graduacao_atual} size="sm" />
							<span class="text-[10px] font-mono text-zinc-500">
								{#if m.origem}
									• {m.origem}
								{/if}
								{#if m.nome_professor_responsavel}
									• Sensei: {m.nome_professor_responsavel}
								{/if}
								• {m.data_alteracao}
							</span>
						</div>

						<div class="flex items-center gap-2.5 shrink-0 text-xs font-mono">
							<!-- Variação de Peso -->
							<div
								class="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
								title="Peso anterior &rarr; Peso novo"
							>
								<Scale class="w-3 h-3 text-zinc-500" />
								<span class="text-zinc-400">
									{m.peso_anterior !== null ? `${m.peso_anterior}kg` : '—'}
								</span>
								<ArrowRight class="w-2.5 h-2.5 text-zinc-600" />
								<span
									class="font-bold {m.peso_novo && m.peso_anterior && m.peso_novo > m.peso_anterior
										? 'text-amber-400'
										: 'text-emerald-400'}"
								>
									{m.peso_novo !== null ? `${m.peso_novo}kg` : '—'}
								</span>
							</div>

							<!-- Categoria Calculada -->
							<div
								class="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
								title="Categoria anterior &rarr; Categoria nova"
							>
								<span class="text-[10px] text-zinc-500 max-w-[85px] truncate">
									{m.categoria_anterior || '—'}
								</span>
								<ArrowRight class="w-2.5 h-2.5 text-zinc-600" />
								<span
									class="text-[10px] font-bold text-white max-w-[120px] truncate"
									title={m.categoria_nova || ''}
								>
									{m.categoria_nova || '—'}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Rodapé de Ação: Ver histórico completo na aba Alunos -->
			<div class="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-zinc-800/80">
				<span class="text-[11px] text-zinc-500 font-mono">
					{#if mudancasRecentesPeso.length > 3}
						Exibindo os 3 mais recentes de {mudancasRecentesPeso.length} registros
					{:else}
						Exibindo {mudancasRecentesPeso.length} alteração(ões) nos últimos 30 dias
					{/if}
				</span>
				<a
					href="/dashboard/alunos#historico-peso"
					class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
				>
					<span>Ver histórico completo dos últimos 30 dias</span>
					<ArrowRight class="w-3.5 h-3.5" />
				</a>
			</div>
		</div>
	{/if}
</section>
