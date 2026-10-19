<script lang="ts">
	import type { PainelJudocaDados } from '#lib/server/repositorios/dashboard.repo';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Award,
		Trophy,
		Medal,
		Calendar,
		Clock,
		Users,
		Sparkles,
		Flame,
		CheckCircle2,
		ArrowRight,
		Scroll,
		ShieldCheck,
		Swords,
		HeartHandshake,
		AlertCircle,
		BellRing,
		AlertTriangle,
		Scale
	} from '@lucide/svelte';

	interface Props {
		painel: PainelJudocaDados;
		nomeAcademia?: string | null;
	}

	let { painel, nomeAcademia = 'Judô Hinodê' }: Props = $props();
	const nomeDojo = $derived(nomeAcademia || 'Judô Hinodê');

	// Aba ativa para alternar entre Linha do Tempo de Graduações e Linha do Tempo de Conquistas
	let abaTimeline = $state<'graduacoes' | 'conquistas'>('graduacoes');

	// Classificação inteligente de pendências
	const pendenciasAcaoAluno = $derived(painel.pendencias?.filter((p) => p.dependeDoAluno) || []);
	const pendenciasInformativas = $derived(painel.pendencias?.filter((p) => !p.dependeDoAluno) || []);
	const temAcaoPendente = $derived(pendenciasAcaoAluno.length > 0);
	const primeiraAcao = $derived(pendenciasAcaoAluno[0] || null);
</script>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 0. ALERTA DE DESTAQUE MÁXIMO: AÇÃO PENDENTE DO PRÓPRIO JUDOCA            -->
	<!-- ========================================================================= -->
	{#if temAcaoPendente && primeiraAcao}
		<aside
			class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-zinc-950 to-amber-950/70 border-2 border-red-500/80 p-5 sm:p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-in slide-in-from-top-4 duration-300"
			aria-label="Alerta de ação pendente prioritária"
		>
			<!-- Glow pulsante decorativo de fundo -->
			<div
				class="absolute -top-16 -right-16 w-56 h-56 bg-red-600/20 rounded-full blur-3xl pointer-events-none"
			></div>

			<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
				<div class="flex items-start gap-4">
					<!-- Ícone pulsante com anel de atenção -->
					<div
						class="w-12 h-12 rounded-2xl bg-red-600/20 border-2 border-red-500/90 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse"
					>
						<BellRing class="w-6 h-6 text-red-400" />
					</div>

					<div class="space-y-1.5">
						<div class="flex items-center gap-2 flex-wrap">
							<span
								class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-red-600 text-white shadow-sm tracking-wider"
							>
								<span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
								<span>Ação Requerida de Você</span>
							</span>
							{#if pendenciasAcaoAluno.length > 1}
								<span
									class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300"
								>
									+{pendenciasAcaoAluno.length - 1} outra{pendenciasAcaoAluno.length - 1 > 1 ? 's' : ''}
								</span>
							{/if}
							{#if primeiraAcao.prazo}
								<span class="text-xs text-zinc-400 font-mono">
									• Data: <strong class="text-white">{primeiraAcao.prazo}</strong>
								</span>
							{/if}
						</div>

						<h2 class="text-base sm:text-lg font-bold text-white font-display tracking-tight flex items-center gap-2">
							{primeiraAcao.titulo}
						</h2>
						<p class="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
							{primeiraAcao.descricao}
						</p>
					</div>
				</div>

				<!-- Botões de Ação Imediata -->
				<div class="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap">
					{#if painel.pendencias && painel.pendencias.length > 1}
						<a
							href="#pendencias-judoca"
							class="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
						>
							Ver Todas ({painel.pendencias.length})
						</a>
					{/if}
					<a
						href={primeiraAcao.href}
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(220,38,38,0.55)] transition-all hover:scale-105 active:scale-95"
					>
						<span>{primeiraAcao.textoBotao}</span>
						<ArrowRight class="w-4 h-4" />
					</a>
				</div>
			</div>
		</aside>
	{/if}

	<!-- ========================================================================= -->
	<!-- 1. HEADER HERO: APRESENTAÇÃO DO JUDOCA & GRADUAÇÃO ATUAL                  -->
	<!-- ========================================================================= -->
	<div
		class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/30 border border-zinc-800 p-6 sm:p-8 shadow-[0_0_35px_rgba(220,38,38,0.08)]"
	>
		<!-- Glow sutil de fundo -->
		<div
			class="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
			<!-- Identificação e Saudação -->
			<div class="space-y-3">
				<div class="flex items-center gap-2 flex-wrap">
					<span
						class="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-[11px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5"
					>
						<Flame class="w-3.5 h-3.5 text-red-500" />
						<span>Portal do Judoca</span>
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-zinc-400 font-mono">
						Matrícula: {painel.judoca.matricula || `#${painel.judoca.id_usuario}`}
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-zinc-400 font-mono">
						{nomeDojo}
					</span>
					<span class="text-xs text-zinc-600">•</span>
					{#if temAcaoPendente}
						<a
							href="#pendencias-judoca"
							class="px-3 py-1 rounded-full bg-red-600/25 border border-red-500/80 text-[11px] font-mono font-bold uppercase tracking-wider text-red-300 flex items-center gap-1.5 hover:bg-red-600/40 transition-all animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]"
						>
							<span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
							<span>⚠️ {pendenciasAcaoAluno.length} {pendenciasAcaoAluno.length === 1 ? 'Ação Pendente de Você' : 'Ações Pendentes de Você'}</span>
							<ArrowRight class="w-3 h-3" />
						</a>
					{:else}
						<span
							class="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1.5"
						>
							<CheckCircle2 class="w-3.5 h-3.5" />
							<span>Situação Regular</span>
						</span>
					{/if}
				</div>

				<div>
					<h1 class="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
						Olá, {painel.judoca.nome}!
					</h1>
					<p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
						Bem-vindo ao seu painel individual de treinos, evolução técnica e conquistas esportivas no tatame.
					</p>
				</div>

				<!-- Metadados do Atleta -->
				<div class="flex items-center gap-3 pt-2 text-xs text-zinc-300 flex-wrap">
					<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
						<Clock class="w-3.5 h-3.5 text-red-400" />
						<span>No Judô há <strong>{painel.judoca.tempo_judo}</strong></span>
					</div>
					<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
						<Sparkles class="w-3.5 h-3.5 text-amber-400" />
						<span>Na faixa atual há <strong>{painel.judoca.tempo_faixa_atual}</strong></span>
					</div>
					{#if painel.judoca.nome_professor_responsavel}
						<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
							<Users class="w-3.5 h-3.5 text-sky-400" />
							<span>Sensei Técnico: <strong>{painel.judoca.nome_professor_responsavel}</strong></span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Card Faixa Atual em Destaque -->
			<div
				class="shrink-0 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col items-center justify-center min-w-[200px] text-center space-y-2 shadow-lg"
			>
				<span class="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
					Graduação Ativa
				</span>
				<div class="scale-110 my-1">
					<BadgeFaixa faixa={painel.judoca.graduacao_atual} size="lg" />
				</div>
				<span class="text-[11px] font-mono text-zinc-400">
					{#if painel.judoca.data_ultima_graduacao_br}
						Desde {painel.judoca.data_ultima_graduacao_br}
					{:else}
						Faixa de Entrada
					{/if}
				</span>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- CENTRAL DE AÇÕES PENDENTES DO JUDOCA (EM POSIÇÃO DE DESTAQUE)             -->
	<!-- ========================================================================= -->
	{#if painel.pendencias && painel.pendencias.length > 0}
		<section
			id="pendencias-judoca"
			class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-950 to-red-950/25 border-2 {temAcaoPendente
				? 'border-red-600/70 shadow-[0_0_35px_rgba(239,68,68,0.2)]'
				: 'border-amber-600/60 shadow-[0_0_35px_rgba(217,119,6,0.18)]'} p-5 sm:p-6 space-y-4 scroll-mt-6"
		>
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
				<div class="flex items-center gap-3">
					<div
						class="w-10 h-10 rounded-xl {temAcaoPendente
							? 'bg-red-950/90 border border-red-600/80 text-red-400 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.4)]'
							: 'bg-amber-950/80 border border-amber-600/70 text-amber-400'} flex items-center justify-center shrink-0"
					>
						<BellRing class="w-5 h-5" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="text-sm sm:text-base font-bold text-white font-display">
								Central de Ações & Pendências do Atleta
							</h2>
							<span
								class="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase {temAcaoPendente
									? 'bg-red-600 text-white'
									: 'bg-amber-500 text-zinc-950'} shadow-sm"
							>
								{painel.pendencias.length} {painel.pendencias.length === 1 ? 'item' : 'itens'}
							</span>
						</div>
						<p class="text-xs text-zinc-300 mt-0.5">
							{temAcaoPendente
								? 'Ações de confirmação direta do atleta que garantem sua participação em torneios e evolução no dojo.'
								: 'Itens de acompanhamento cadastral e alinhamento junto ao corpo técnico.'}
						</p>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3.5">
				{#each painel.pendencias as pend}
					<div
						class="p-4 sm:p-5 rounded-xl transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 {pend.dependeDoAluno
							? 'bg-gradient-to-r from-red-950/40 via-zinc-900/90 to-zinc-900/90 border-2 border-red-600/60 shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:border-red-500'
							: 'bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700'}"
					>
						<div class="flex items-start gap-3.5">
							<div
								class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 {pend.dependeDoAluno
									? 'bg-red-950/90 text-red-400 border border-red-600 shadow-sm animate-pulse'
									: 'bg-zinc-800 text-zinc-400 border border-zinc-700'}"
							>
								{#if pend.tipo === 'confirmacao_campeonato'}
									<Trophy class="w-5 h-5 text-amber-400" />
								{:else if pend.tipo === 'exame_elegivel'}
									<Award class="w-5 h-5 text-purple-400" />
								{:else if pend.tipo === 'sem_turma'}
									<Calendar class="w-5 h-5 text-sky-400" />
								{:else if pend.tipo === 'peso_categoria'}
									<Scale class="w-5 h-5 text-amber-400" />
								{:else}
									<AlertCircle class="w-5 h-5 text-amber-400" />
								{/if}
							</div>
							<div class="space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<h3 class="text-sm font-bold text-white font-display">
										{pend.titulo}
									</h3>
									{#if pend.dependeDoAluno}
										<span
											class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-red-600 text-white shadow-sm tracking-wider"
										>
											Sua Ação é Necessária
										</span>
									{/if}
									<span
										class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase {pend.gravidade ===
										'alta'
											? 'bg-red-950/80 border border-red-700 text-red-300'
											: 'bg-zinc-800 border border-zinc-700 text-zinc-300'}"
									>
										{pend.badge}
									</span>
									{#if pend.prazo}
										<span class="text-[11px] text-zinc-400 font-mono">
											• Data: <strong class="text-zinc-200">{pend.prazo}</strong>
										</span>
									{/if}
								</div>
								<p class="text-xs text-zinc-300 leading-relaxed max-w-2xl">
									{pend.descricao}
								</p>
								{#if pend.dependeDoAluno}
									<p class="text-[11px] text-red-300/90 font-medium flex items-center gap-1.5 pt-0.5">
										<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
										<span>Esta validação depende diretamente de você para confirmação no tatame.</span>
									</p>
								{/if}
							</div>
						</div>

						<a
							href={pend.href}
							class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all self-end sm:self-auto shrink-0 {pend.dependeDoAluno
								? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.45)] hover:scale-105 active:scale-95'
								: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'}"
						>
							<span>{pend.textoBotao}</span>
							<ArrowRight class="w-3.5 h-3.5" />
						</a>
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<!-- Status Regular / Sem Pendências -->
		<div
			class="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/50 flex items-center justify-between gap-3 text-xs text-emerald-300 shadow-sm"
		>
			<div class="flex items-center gap-2.5">
				<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
				<span>
					<strong>Situação 100% Regular:</strong> Nenhuma pendência cadastral ou de eventos aguardando sua ação.
				</span>
			</div>
			<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-300 uppercase shrink-0">
				Tudo em dia
			</span>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. GRID DE CARDS: MÉTRICAS DO JUDOCA & MÉTRICAS DA ACADEMIA               -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- CARD ESQUERDA: MÉTRICAS DO JUDOCA (INDIVIDUAL) -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<Award class="w-4 h-4 text-red-500" />
					<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
						Métricas do Judoca
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">Desempenho Individual</span>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<!-- Treinos Inscritos -->
				<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Treinos Inscritos</span>
					<div class="flex items-baseline gap-2">
						<span class="text-2xl font-black font-display text-white">
							{painel.metricasJudoca.totalTreinosInscritos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">turma(s)</span>
					</div>
				</div>

				<!-- Campeonatos Participados -->
				<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Torneios Disputados</span>
					<div class="flex items-baseline gap-2">
						<span class="text-2xl font-black font-display text-white">
							{painel.metricasJudoca.totalCampeonatos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">edições</span>
					</div>
				</div>
			</div>

			<!-- Medalhas Individuais do Judoca -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
						<Medal class="w-3.5 h-3.5 text-amber-400" />
						<span>Pódios & Medalhas Recebidas</span>
					</span>
					<span class="text-xs font-bold font-mono text-amber-400">
						{painel.metricasJudoca.totalMedalhas} total
					</span>
				</div>

				<div class="grid grid-cols-3 gap-2 text-center">
					<div class="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40">
						<span class="text-base block">🥇</span>
						<span class="text-lg font-black font-display text-amber-300 block leading-tight">
							{painel.metricasJudoca.totalOuro}
						</span>
						<span class="text-[10px] font-mono text-amber-400/80 uppercase">Ouro</span>
					</div>
					<div class="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50">
						<span class="text-base block">🥈</span>
						<span class="text-lg font-black font-display text-zinc-200 block leading-tight">
							{painel.metricasJudoca.totalPrata}
						</span>
						<span class="text-[10px] font-mono text-zinc-400 uppercase">Prata</span>
					</div>
					<div class="p-2.5 rounded-lg bg-orange-950/20 border border-orange-900/40">
						<span class="text-base block">🥉</span>
						<span class="text-lg font-black font-display text-orange-300 block leading-tight">
							{painel.metricasJudoca.totalBronze}
						</span>
						<span class="text-[10px] font-mono text-orange-400/80 uppercase">Bronze</span>
					</div>
				</div>

				{#if painel.metricasJudoca.totalLutas > 0}
					<div class="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-zinc-800">
						<span>Lutas realizadas: <strong class="text-white">{painel.metricasJudoca.totalLutas}</strong></span>
						<span>Vitórias: <strong class="text-emerald-400">{painel.metricasJudoca.totalVitorias}</strong></span>
					</div>
				{/if}
			</div>
		</div>

		<!-- CARD DIREITA: MÉTRICAS RESUMO ACADEMIA (COLETIVO DO DOJO) -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<Trophy class="w-4 h-4 text-amber-500" />
					<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
						Métricas do Dojo ({nomeDojo})
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">Força Coletiva</span>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<!-- Judocas Cadastrados -->
				<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Judocas Cadastrados</span>
					<div class="flex items-baseline gap-2">
						<span class="text-2xl font-black font-display text-white">
							{painel.metricasAcademia.totalAlunos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">atletas</span>
					</div>
				</div>

				<!-- Treinos Disponíveis -->
				<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Treinos na Grade</span>
					<div class="flex items-baseline gap-2">
						<span class="text-2xl font-black font-display text-white">
							{painel.metricasAcademia.totalTreinosDisponiveis}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">horários</span>
					</div>
				</div>

				<!-- Troféus de Campeonatos -->
				<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Torneios Disputados</span>
					<div class="flex items-baseline gap-2">
						<span class="text-2xl font-black font-display text-amber-400">
							{painel.metricasAcademia.totalTrofeusCampeonatos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">campeonatos</span>
					</div>
				</div>

				<!-- Medalhas dos Alunos -->
				<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Medalhas do Dojo</span>
					<div class="flex items-baseline gap-2">
						<span class="text-2xl font-black font-display text-amber-300">
							{painel.metricasAcademia.totalMedalhasAlunos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">conquistas</span>
					</div>
				</div>
			</div>

			<!-- Lista de Senseis / Professores -->
			<div class="pt-2 border-t border-zinc-900 space-y-2">
				<span class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
					Quadro de Senseis & Mestres ({painel.metricasAcademia.senseis.length})
				</span>
				<div class="flex flex-wrap gap-2">
					{#each painel.metricasAcademia.senseis as sensei}
						<div
							class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs"
						>
							<div class="w-2 h-2 rounded-full bg-red-500"></div>
							<span class="text-zinc-200 font-medium">{sensei.nome}</span>
							{#if sensei.grau_faixa}
								<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
									{sensei.grau_faixa}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. DUAS LINHAS DO TEMPO: GRADUAÇÕES (DAN/KYU) vs CONQUISTAS ESPORTIVAS    -->
	<!-- ========================================================================= -->
	<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
			<div>
				<h2 class="text-base sm:text-lg font-bold text-white font-display">
					Linha do Tempo do Judoca
				</h2>
				<p class="text-xs text-zinc-400 mt-0.5">
					Acompanhe seu progresso de faixas ou a galeria de medalhas conquistadas.
				</p>
			</div>

			<!-- Botões de Alternância das Linhas do Tempo -->
			<div class="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
				<button
					type="button"
					onclick={() => (abaTimeline = 'graduacoes')}
					class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 {abaTimeline ===
					'graduacoes'
						? 'bg-red-600 text-white shadow-sm'
						: 'text-zinc-400 hover:text-white'}"
				>
					<Award class="w-3.5 h-3.5" />
					<span>Graduações ({painel.graduacoes.length})</span>
				</button>
				<button
					type="button"
					onclick={() => (abaTimeline = 'conquistas')}
					class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 {abaTimeline ===
					'conquistas'
						? 'bg-red-600 text-white shadow-sm'
						: 'text-zinc-400 hover:text-white'}"
				>
					<Trophy class="w-3.5 h-3.5" />
					<span>Conquistas & Pódios ({painel.conquistas.length})</span>
				</button>
			</div>
		</div>

		<!-- ABA 1: LINHA DO TEMPO COM AS GRADUAÇÕES (DAN/KYU) -->
		{#if abaTimeline === 'graduacoes'}
			{#if painel.graduacoes.length > 0}
				<div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
					{#each painel.graduacoes as grad}
						<div class="relative group">
							<!-- Ponto da linha do tempo -->
							<div
								class="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-zinc-950 border-2 border-red-600 flex items-center justify-center transition-transform group-hover:scale-125"
							>
								<div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
							</div>

							<div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div class="flex items-center gap-3">
									<BadgeFaixa faixa={grad.faixa} size="md" />
									<div>
										<span class="text-xs text-zinc-400 font-mono block">
											Homologado em {grad.data_graduacao}
										</span>
										<span class="text-sm font-bold text-white">
											{grad.nome_evento || 'Exame Oficial de Graduação'}
										</span>
									</div>
								</div>

								<div class="text-xs font-mono text-zinc-400 sm:text-right">
									<span class="text-[10px] uppercase text-zinc-500 block">Sensei Examinador</span>
									<span class="text-zinc-200 font-medium">{grad.nome_professor_homologador}</span>
									{#if grad.grau_faixa_professor}
										<span class="text-[10px] text-zinc-500">({grad.grau_faixa_professor})</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-2">
					<Award class="w-8 h-8 text-zinc-600 mx-auto" />
					<h3 class="text-sm font-bold text-white">Graduação Inicial ({painel.judoca.graduacao_atual})</h3>
					<p class="text-xs text-zinc-400 max-w-sm mx-auto">
						Você está iniciando sua caminhada no tatame. Conforme prestar os exames de graduação do dojo, suas promoções de Dan/Kyu aparecerão aqui nesta linha do tempo.
					</p>
				</div>
			{/if}
		{/if}

		<!-- ABA 2: LINHA DO TEMPO COM AS CONQUISTAS (CAMPEONATOS) -->
		{#if abaTimeline === 'conquistas'}
			{#if painel.conquistas.length > 0}
				<div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
					{#each painel.conquistas as conq}
						<div class="relative group">
							<!-- Ponto da linha do tempo -->
							<div
								class="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-zinc-950 border-2 {conq.tipo_medalha === 'ouro' ? 'border-amber-400' : conq.tipo_medalha === 'prata' ? 'border-zinc-300' : conq.tipo_medalha === 'bronze' ? 'border-orange-400' : 'border-zinc-600'} flex items-center justify-center transition-transform group-hover:scale-125"
							>
								<div class="w-1.5 h-1.5 rounded-full {conq.tipo_medalha === 'ouro' ? 'bg-amber-400' : conq.tipo_medalha === 'prata' ? 'bg-zinc-300' : conq.tipo_medalha === 'bronze' ? 'bg-orange-400' : 'bg-zinc-500'}"></div>
							</div>

							<div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div class="space-y-1">
									<div class="flex items-center gap-2 flex-wrap">
										<span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold {conq.tipo_medalha === 'ouro' ? 'bg-amber-950/70 text-amber-300 border border-amber-800' : conq.tipo_medalha === 'prata' ? 'bg-zinc-800 text-zinc-200 border border-zinc-700' : conq.tipo_medalha === 'bronze' ? 'bg-orange-950/70 text-orange-300 border border-orange-800' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}">
											{conq.classificacao}
										</span>
										<span class="text-xs text-zinc-400 font-mono">{conq.data_evento}</span>
									</div>
									<h4 class="text-sm font-bold text-white">
										{conq.nome_campeonato} {conq.edicao ? `(${conq.edicao})` : ''}
									</h4>
								</div>

								<div class="flex items-center gap-4 text-xs font-mono text-zinc-400">
									<div>
										<span class="text-[10px] text-zinc-500 block uppercase">Lutas</span>
										<strong class="text-white text-sm">{conq.qtd_lutas}</strong>
									</div>
									<div class="h-6 w-px bg-zinc-800"></div>
									<div>
										<span class="text-[10px] text-zinc-500 block uppercase">Vitórias</span>
										<strong class="text-emerald-400 text-sm">{conq.qtd_vitorias}</strong>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-2">
					<Trophy class="w-8 h-8 text-zinc-600 mx-auto" />
					<h3 class="text-sm font-bold text-white">Nenhum torneio registrado</h3>
					<p class="text-xs text-zinc-400 max-w-sm mx-auto">
						Seus resultados em campeonatos oficiais e medalhas recebidas serão computados nesta linha do tempo após as competições.
					</p>
				</div>
			{/if}
		{/if}
	</div>

	<!-- ========================================================================= -->
	<!-- 4. TREINOS INSCRITOS & PRÓXIMOS EVENTOS DO DOJO                           -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- TREINOS EM QUE O ALUNO ESTÁ MATRICULADO -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<Calendar class="w-4 h-4 text-red-500" />
					<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
						Meus Treinos Semanais
					</h2>
				</div>
				<a
					href="/dashboard/turmas"
					class="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
				>
					<span>Ver grade completa</span>
					<ArrowRight class="w-3 h-3" />
				</a>
			</div>

			{#if painel.treinosInscritos.length > 0}
				<div class="space-y-3">
					{#each painel.treinosInscritos as treino}
						<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3">
							<div class="space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-950/60 border border-red-800 text-red-300">
										{treino.dia_semana}
									</span>
									<span class="text-xs font-mono text-zinc-400">
										{treino.horario_inicio} às {treino.horario_fim}
									</span>
								</div>
								<h4 class="text-sm font-bold text-white">{treino.descricao}</h4>
								<p class="text-[11px] text-zinc-400">Sensei: {treino.professores}</p>
							</div>

							<div class="shrink-0">
								<span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-400">
									Matriculado
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-6 rounded-xl bg-zinc-900/20 border border-dashed border-zinc-800 text-center space-y-2">
					<Calendar class="w-7 h-7 text-zinc-600 mx-auto" />
					<p class="text-xs text-zinc-400">
						Você ainda não foi alocado a uma turma específica. Consulte seu Sensei para definir seus horários de treino.
					</p>
				</div>
			{/if}
		</div>

		<!-- PRÓXIMOS EVENTOS E CAMPEONATOS DA ACADEMIA -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<Swords class="w-4 h-4 text-amber-500" />
					<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
						Próximos Eventos & Torneios
					</h2>
				</div>
				<a
					href="/dashboard/campeonatos"
					class="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
				>
					<span>Ver todos</span>
					<ArrowRight class="w-3 h-3" />
				</a>
			</div>

			{#if painel.proximosEventos.length > 0}
				<div class="space-y-3">
					{#each painel.proximosEventos as evento}
						<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3">
							<div class="space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase {evento.eh_campeonato ? 'bg-amber-950/60 border border-amber-800 text-amber-300' : 'bg-purple-950/60 border border-purple-800 text-purple-300'}">
										{evento.eh_campeonato ? 'Campeonato' : 'Exame de Graduação'}
									</span>
									<span class="text-xs font-mono text-zinc-400">
										{evento.data_inicio || 'Data a definir'}
									</span>
								</div>
								<h4 class="text-sm font-bold text-white">{evento.nome}</h4>
								{#if evento.valor_inscricao !== null && evento.valor_inscricao !== undefined}
									<p class="text-[11px] font-mono text-zinc-400">
										Taxa de inscrição: {evento.valor_inscricao === 0 ? 'Gratuito' : `R$ ${Number(evento.valor_inscricao).toFixed(2).replace('.', ',')}`}
									</p>
								{/if}
							</div>

							<a
								href={evento.eh_campeonato ? `/dashboard/campeonatos/${evento.id_evento}` : `/dashboard/graduacoes/${evento.id_evento}`}
								class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition-colors shrink-0"
							>
								Detalhes
							</a>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-6 rounded-xl bg-zinc-900/20 border border-dashed border-zinc-800 text-center space-y-2">
					<p class="text-xs text-zinc-400">
						Nenhum exame ou campeonato agendado no calendário no momento.
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 5. PRINCÍPIOS FUNDAMENTAIS DO JUDÔ (DOJO KUN & FILOSOFIA)                 -->
	<!-- ========================================================================= -->
	<div
		class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-red-900/30 relative overflow-hidden space-y-5"
	>
		<div class="flex items-center gap-2.5 pb-3 border-b border-zinc-900">
			<Scroll class="w-4 h-4 text-red-500" />
			<h2 class="text-xs font-mono uppercase tracking-wider text-red-400 font-bold">
				Princípios Fundamentais do Judô • Kodokan
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Princípio 1: Seiryoku Zen'yo -->
			<div class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-base font-bold text-white font-display">Seiryoku Zen'yo</span>
					<span class="text-xs font-mono text-zinc-500">精力善用</span>
				</div>
				<p class="text-xs text-zinc-300 font-medium">
					"Máxima Eficiência com o Mínimo Esforço"
				</p>
				<p class="text-[11px] text-zinc-400 leading-relaxed">
					O princípio de utilizar toda a energia mental e física de forma inteligente, aproveitando a força e o impulso do adversário para superá-lo com técnica, calma e precisão.
				</p>
			</div>

			<!-- Princípio 2: Jita Kyoei -->
			<div class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-base font-bold text-white font-display">Jita Kyoei</span>
					<span class="text-xs font-mono text-zinc-500">自他共栄</span>
				</div>
				<p class="text-xs text-zinc-300 font-medium">
					"Prosperidade e Benefício Mútuo"
				</p>
				<p class="text-[11px] text-zinc-400 leading-relaxed">
					A evolução só acontece através da cooperação. Ao ajudar os companheiros de treino a crescerem, o dojo inteiro se fortalece, forjando caráter, fraternidade e respeito recíproco.
				</p>
			</div>
		</div>

		<!-- Código Moral do Judoca -->
		<div class="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400">
			<span class="text-zinc-500 font-bold uppercase">Código Moral:</span>
			<span>Cortesia</span>
			<span>•</span>
			<span>Coragem</span>
			<span>•</span>
			<span>Honestidade</span>
			<span>•</span>
			<span>Honra</span>
			<span>•</span>
			<span>Modéstia</span>
			<span>•</span>
			<span>Respeito</span>
			<span>•</span>
			<span>Autocontrole</span>
			<span>•</span>
			<span>Amizade</span>
		</div>
	</div>
</div>
