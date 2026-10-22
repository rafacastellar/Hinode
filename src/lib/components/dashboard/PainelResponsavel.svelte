<script lang="ts">
	import type { PainelResponsavelDados } from '#lib/server/repositorios/dashboard.repo';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import CardConformidadeAlunos from './CardConformidadeAlunos.svelte';
	import {
		HeartHandshake,
		Users,
		Award,
		Trophy,
		Medal,
		Calendar,
		Clock,
		Sparkles,
		Flame,
		CheckCircle2,
		ArrowRight,
		ShieldCheck,
		Swords,
		AlertCircle,
		BellRing,
		Scale,
		UserCheck
	} from '@lucide/svelte';

	interface Props {
		painel: PainelResponsavelDados;
		nomeAcademia?: string | null;
	}

	let { painel, nomeAcademia = 'Judô Hinodê' }: Props = $props();
	const nomeDojo = $derived(nomeAcademia || 'Judô Hinodê');

	// Índice do dependente atualmente selecionado na interface
	let indiceSelecionado = $state(0);

	const dependenteAtivo = $derived(
		painel.dependentes.length > 0
			? painel.dependentes[Math.min(indiceSelecionado, painel.dependentes.length - 1)]
			: null
	);

	// Aba ativa de linha do tempo do dependente selecionado
	let abaTimeline = $state<'graduacoes' | 'conquistas'>('graduacoes');

	// Pendências do dependente ativo
	const pendenciasAtivas = $derived(dependenteAtivo?.painelJudoca.pendencias || []);
	const pendenciasAcao = $derived(pendenciasAtivas.filter((p) => p.dependeDoAluno));
	const temAcaoPendente = $derived(pendenciasAcao.length > 0);
	const primeiraAcao = $derived(pendenciasAcao[0] || null);
</script>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 1. BANNER PRINCIPAL DO RESPONSÁVEL / ESPAÇO DA FAMÍLIA                    -->
	<!-- ========================================================================= -->
	<section
		class="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/20 border border-zinc-800 shadow-2xl"
	>
		<!-- Brilho esmeralda sutil de fundo representando tutela e acolhimento familiar -->
		<div
			class="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div>
				<div class="flex items-center gap-2 mb-3">
					<span
						class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-xs font-mono font-bold text-emerald-400"
					>
						<HeartHandshake class="w-3.5 h-3.5 text-emerald-400" />
						<span>Espaço da Família</span>
					</span>
					<span class="text-xs text-zinc-600 font-mono">•</span>
					<span class="text-xs text-zinc-400 font-mono">{nomeDojo}</span>
				</div>

				<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					Olá, {painel.responsavel.nome}!
				</h1>
				<p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
					Acompanhe de perto a evolução técnica, pontualidade nos treinos e conquistas esportivas dos judocas sob sua responsabilidade legal no dojo.
				</p>
			</div>

			<!-- Resumo Rápido da Família -->
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
				<div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Tutelados</span>
					<span class="text-lg font-black text-white font-display">
						{painel.totalDependentes}
					</span>
					<span class="text-[10px] text-zinc-400 block font-mono">atleta(s)</span>
				</div>

				<div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Aulas Semanais</span>
					<span class="text-lg font-black text-emerald-400 font-display">
						{painel.totalTurmasAtivas}
					</span>
					<span class="text-[10px] text-zinc-400 block font-mono">horário(s)</span>
				</div>

				<div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center col-span-2 sm:col-span-1">
					<span class="text-[10px] font-mono uppercase text-zinc-500 block">Pódios Família</span>
					<span class="text-lg font-black text-amber-400 font-display">
						{painel.totalMedalhasFamilia}
					</span>
					<span class="text-[10px] text-zinc-400 block font-mono">medalha(s)</span>
				</div>
			</div>
		</div>
	</section>

	{#if painel.dependentes.length === 0}
		<!-- ESTADO VAZIO: NENHUM DEPENDENTE VINCULADO -->
		<div class="p-12 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-4">
			<div class="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto">
				<Users class="w-8 h-8 text-zinc-500" />
			</div>
			<div class="max-w-md mx-auto space-y-1">
				<h3 class="text-base font-bold text-white font-display">
					Nenhum judoca vinculado ao seu perfil
				</h3>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Não encontramos atletas cadastrados sob sua responsabilidade legal no momento. Solicite à secretaria ou ao Sensei da academia a vinculação da matrícula do seu dependente.
				</p>
			</div>
		</div>
	{:else}
		<!-- ========================================================================= -->
		<!-- CONFORMIDADE & PENDÊNCIAS TÉCNICAS DOS TUTELADOS                          -->
		<!-- ========================================================================= -->
		{#if painel.pendenciasTecnicas}
			<CardConformidadeAlunos
				pendencias={painel.pendenciasTecnicas}
				escopo="responsavel"
				onSelecionarAluno={(idAluno) => {
					const idx = painel.dependentes.findIndex((d) => d.aluno.id_usuario === idAluno);
					if (idx !== -1) {
						indiceSelecionado = idx;
					}
				}}
			/>
		{/if}

		<!-- ========================================================================= -->
		<!-- 2. SELETOR DE ATLETA TUTELADO (TABS MULTI-FILHOS)                         -->
		<!-- ========================================================================= -->
		{#if painel.dependentes.length > 1}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Users class="w-4 h-4 text-emerald-500" />
						<span class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
							Selecione o Atleta para Visualizar:
						</span>
					</div>
					<span class="text-xs text-zinc-500 font-mono">
						{painel.dependentes.length} judocas cadastrados
					</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
					{#each painel.dependentes as dep, idx}
						{@const isSelected = idx === indiceSelecionado}
						{@const hasAction = dep.painelJudoca.pendencias.some((p) => p.dependeDoAluno)}
						<button
							type="button"
							onclick={() => (indiceSelecionado = idx)}
							class="p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 {isSelected
								? 'bg-zinc-900 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
								: 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}"
						>
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-sm font-bold text-white truncate block">
										{dep.aluno.nome}
									</span>
									{#if hasAction}
										<span class="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" title="Ação requerida"></span>
									{/if}
								</div>
								<div class="flex items-center gap-2 text-xs text-zinc-400 font-mono">
									<span>{dep.aluno.idade} anos</span>
									<span>•</span>
									<span class="text-emerald-400 font-semibold">{dep.aluno.grau_parentesco}</span>
								</div>
							</div>

							<div class="shrink-0">
								<BadgeFaixa faixa={dep.aluno.graduacao_atual} size="sm" />
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if dependenteAtivo}
			{@const judoca = dependenteAtivo.painelJudoca.judoca}
			{@const metricas = dependenteAtivo.painelJudoca.metricasJudoca}
			{@const treinos = dependenteAtivo.painelJudoca.treinosInscritos}
			{@const graduacoes = dependenteAtivo.painelJudoca.graduacoes}
			{@const conquistas = dependenteAtivo.painelJudoca.conquistas}
			{@const proximosEventos = dependenteAtivo.painelJudoca.proximosEventos}

			<!-- ===================================================================== -->
			<!-- 3. ALERTA DE AÇÃO PRIORITÁRIA PARA O DEPENDENTE SELECIONADO           -->
			<!-- ===================================================================== -->
			{#if temAcaoPendente && primeiraAcao}
				<aside
					class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-zinc-950 to-amber-950/70 border-2 border-red-500/80 p-5 sm:p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-in slide-in-from-top-4 duration-300"
					aria-label="Alerta de ação pendente prioritária para o atleta"
				>
					<div
						class="absolute -top-16 -right-16 w-56 h-56 bg-red-600/20 rounded-full blur-3xl pointer-events-none"
					></div>

					<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
						<div class="flex items-start gap-4">
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
										<span>Ação Requerida para {dependenteAtivo.aluno.nome}</span>
									</span>
									{#if pendenciasAcao.length > 1}
										<span
											class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300"
										>
											+{pendenciasAcao.length - 1} outra{pendenciasAcao.length - 1 > 1 ? 's' : ''}
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

						<div class="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap">
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

			<!-- ===================================================================== -->
			<!-- 4. HEADER HERO DO ATLETA: APRESENTAÇÃO & GRADUAÇÃO ATUAL               -->
			<!-- ===================================================================== -->
			<div
				class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/30 border border-zinc-800 p-6 sm:p-8 shadow-[0_0_35px_rgba(220,38,38,0.08)]"
			>
				<div
					class="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
				></div>

				<div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
					<div class="space-y-3">
						<div class="flex items-center gap-2 flex-wrap">
							<span
								class="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"
							>
								<UserCheck class="w-3.5 h-3.5 text-emerald-400" />
								<span>{dependenteAtivo.aluno.grau_parentesco}</span>
							</span>
							<span class="text-xs text-zinc-600">•</span>
							<span class="text-xs text-zinc-400 font-mono">
								Matrícula: {judoca.matricula || `#${judoca.id_usuario}`}
							</span>
							<span class="text-xs text-zinc-600">•</span>
							<span class="text-xs text-zinc-400 font-mono">
								{dependenteAtivo.aluno.idade} anos ({dependenteAtivo.aluno.data_nascimento_br})
							</span>
							<span class="text-xs text-zinc-600">•</span>
							{#if temAcaoPendente}
								<span
									class="px-2.5 py-0.5 rounded-full bg-red-950 border border-red-800 text-[11px] font-mono font-bold text-red-400 flex items-center gap-1.5"
								>
									<span>⚠️ {pendenciasAcao.length} Pendência(s)</span>
								</span>
							{:else}
								<span
									class="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1.5"
								>
									<CheckCircle2 class="w-3.5 h-3.5" />
									<span>Situação Regular</span>
								</span>
							{/if}
						</div>

						<div>
							<h2 class="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
								{judoca.nome}
							</h2>
							<p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
								Registro técnico oficial no tatame, acompanhamento pedagógico de graduações e rotina de treinos.
							</p>
						</div>

						<!-- Metadados do Atleta -->
						<div class="flex items-center gap-3 pt-2 text-xs text-zinc-300 flex-wrap">
							<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
								<Clock class="w-3.5 h-3.5 text-red-400" />
								<span>No Judô há <strong>{judoca.tempo_judo}</strong></span>
							</div>
							<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
								<Sparkles class="w-3.5 h-3.5 text-amber-400" />
								<span>Na faixa atual há <strong>{judoca.tempo_faixa_atual}</strong></span>
							</div>
							{#if judoca.nome_professor_responsavel}
								<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
									<Users class="w-3.5 h-3.5 text-sky-400" />
									<span>Sensei Responsável: <strong>{judoca.nome_professor_responsavel}</strong></span>
								</div>
							{/if}
							<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
								<Scale class="w-3.5 h-3.5 text-amber-400" />
								<span>Peso: <strong>{judoca.peso ? `${judoca.peso} kg` : 'Pendente de pesagem'}</strong></span>
								{#if judoca.categoria}
									<span class="text-zinc-500">({judoca.categoria})</span>
								{/if}
							</div>
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
							<BadgeFaixa faixa={judoca.graduacao_atual} size="lg" />
						</div>
						<span class="text-[11px] font-mono text-zinc-400">
							{#if judoca.data_ultima_graduacao_br}
								Desde {judoca.data_ultima_graduacao_br}
							{:else}
								Faixa Inicial
							{/if}
						</span>
					</div>
				</div>
			</div>

			<!-- ===================================================================== -->
			<!-- 5. GRID DE MÉTRICAS INDIVIDUAIS DO JUDOCA                             -->
			<!-- ===================================================================== -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- CARD: DESEMPENHO NO TATAME -->
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5">
					<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
						<div class="flex items-center gap-2">
							<Award class="w-4 h-4 text-red-500" />
							<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
								Métricas do Atleta ({judoca.nome})
							</h3>
						</div>
						<span class="text-[10px] font-mono text-zinc-500">Desempenho</span>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
							<span class="text-[10px] font-mono uppercase text-zinc-500 block">Treinos Semanais</span>
							<div class="flex items-baseline gap-2">
								<span class="text-2xl font-black font-display text-white">
									{metricas.totalTreinosInscritos}
								</span>
								<span class="text-[11px] text-zinc-400 font-mono">turma(s)</span>
							</div>
						</div>

						<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
							<span class="text-[10px] font-mono uppercase text-zinc-500 block">Torneios Disputados</span>
							<div class="flex items-baseline gap-2">
								<span class="text-2xl font-black font-display text-white">
									{metricas.totalCampeonatos}
								</span>
								<span class="text-[11px] text-zinc-400 font-mono">edições</span>
							</div>
						</div>
					</div>

					<!-- Medalhas Individuais -->
					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
								<Medal class="w-3.5 h-3.5 text-amber-400" />
								<span>Pódios & Medalhas Conquistadas</span>
							</span>
							<span class="text-xs font-bold font-mono text-amber-400">
								{metricas.totalMedalhas} total
							</span>
						</div>

						<div class="grid grid-cols-3 gap-2 text-center">
							<div class="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40">
								<span class="text-base block">🥇</span>
								<span class="text-lg font-black font-display text-amber-300 block leading-tight">
									{metricas.totalOuro}
								</span>
								<span class="text-[10px] font-mono text-amber-400/80 uppercase">Ouro</span>
							</div>
							<div class="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50">
								<span class="text-base block">🥈</span>
								<span class="text-lg font-black font-display text-zinc-200 block leading-tight">
									{metricas.totalPrata}
								</span>
								<span class="text-[10px] font-mono text-zinc-400 uppercase">Prata</span>
							</div>
							<div class="p-2.5 rounded-lg bg-orange-950/20 border border-orange-900/40">
								<span class="text-base block">🥉</span>
								<span class="text-lg font-black font-display text-orange-300 block leading-tight">
									{metricas.totalBronze}
								</span>
								<span class="text-[10px] font-mono text-orange-400/80 uppercase">Bronze</span>
							</div>
						</div>

						{#if metricas.totalLutas > 0}
							<div class="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-zinc-800">
								<span>Lutas oficiais: <strong class="text-white">{metricas.totalLutas}</strong></span>
								<span>Vitórias: <strong class="text-emerald-400">{metricas.totalVitorias}</strong></span>
							</div>
						{/if}
					</div>
				</div>

				<!-- CARD: FORÇA DO DOJO & SENSEIS -->
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5">
					<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
						<div class="flex items-center gap-2">
							<Trophy class="w-4 h-4 text-amber-500" />
							<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
								Estrutura do Dojo ({nomeDojo})
							</h3>
						</div>
						<span class="text-[10px] font-mono text-zinc-500">Coletivo</span>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
							<span class="text-[10px] font-mono uppercase text-zinc-500 block">Judocas no Dojo</span>
							<div class="flex items-baseline gap-2">
								<span class="text-2xl font-black font-display text-white">
									{dependenteAtivo.painelJudoca.metricasAcademia.totalAlunos}
								</span>
								<span class="text-[11px] text-zinc-400 font-mono">atletas</span>
							</div>
						</div>

						<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
							<span class="text-[10px] font-mono uppercase text-zinc-500 block">Treinos na Grade</span>
							<div class="flex items-baseline gap-2">
								<span class="text-2xl font-black font-display text-white">
									{dependenteAtivo.painelJudoca.metricasAcademia.totalTreinosDisponiveis}
								</span>
								<span class="text-[11px] text-zinc-400 font-mono">horários</span>
							</div>
						</div>

						<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
							<span class="text-[10px] font-mono uppercase text-zinc-500 block">Torneios Disputados</span>
							<div class="flex items-baseline gap-2">
								<span class="text-2xl font-black font-display text-amber-400">
									{dependenteAtivo.painelJudoca.metricasAcademia.totalTrofeusCampeonatos}
								</span>
								<span class="text-[11px] text-zinc-400 font-mono">campeonatos</span>
							</div>
						</div>

						<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
							<span class="text-[10px] font-mono uppercase text-zinc-500 block">Medalhas do Dojo</span>
							<div class="flex items-baseline gap-2">
								<span class="text-2xl font-black font-display text-amber-300">
									{dependenteAtivo.painelJudoca.metricasAcademia.totalMedalhasAlunos}
								</span>
								<span class="text-[11px] text-zinc-400 font-mono">conquistas</span>
							</div>
						</div>
					</div>

					<div class="pt-2 border-t border-zinc-900 space-y-2">
						<span class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
							Senseis & Professores Responsáveis ({dependenteAtivo.painelJudoca.metricasAcademia.senseis.length})
						</span>
						<div class="flex flex-wrap gap-2">
							{#each dependenteAtivo.painelJudoca.metricasAcademia.senseis as sensei}
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

			<!-- ===================================================================== -->
			<!-- 6. DUAS LINHAS DO TEMPO: GRADUAÇÕES (DAN/KYU) vs CONQUISTAS ESPORTIVAS -->
			<!-- ===================================================================== -->
			<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
					<div>
						<h3 class="text-base sm:text-lg font-bold text-white font-display">
							Linha do Tempo de {judoca.nome}
						</h3>
						<p class="text-xs text-zinc-400 mt-0.5">
							Histórico auditado de promoções de faixa outorgadas e medalhas conquistadas em campeonatos.
						</p>
					</div>

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
							<span>Graduações ({graduacoes.length})</span>
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
							<span>Pódios & Torneios ({conquistas.length})</span>
						</button>
					</div>
				</div>

				<!-- ABA 1: GRADUAÇÕES -->
				{#if abaTimeline === 'graduacoes'}
					{#if graduacoes.length > 0}
						<div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
							{#each graduacoes as grad}
								<div class="relative group">
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
							<h4 class="text-sm font-bold text-white">Graduação Inicial ({judoca.graduacao_atual})</h4>
							<p class="text-xs text-zinc-400 max-w-sm mx-auto">
								{judoca.nome} está no início de sua trajetória no tatame. Conforme prestar exames com os Senseis do dojo, as homologações serão registradas aqui.
							</p>
						</div>
					{/if}
				{/if}

				<!-- ABA 2: CONQUISTAS -->
				{#if abaTimeline === 'conquistas'}
					{#if conquistas.length > 0}
						<div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
							{#each conquistas as conq}
								<div class="relative group">
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
							<h4 class="text-sm font-bold text-white">Nenhum torneio oficial registrado</h4>
							<p class="text-xs text-zinc-400 max-w-sm mx-auto">
								Os resultados e medalhas recebidas por {judoca.nome} aparecerão nesta galeria após a participação em torneios.
							</p>
						</div>
					{/if}
				{/if}
			</div>

			<!-- ===================================================================== -->
			<!-- 7. HORÁRIOS SEMANAIS & PRÓXIMOS EVENTOS DO DOJO                       -->
			<!-- ===================================================================== -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- TREINOS SEMANAIS DO DEPENDENTE -->
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
					<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
						<div class="flex items-center gap-2">
							<Calendar class="w-4 h-4 text-emerald-500" />
							<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
								Agenda Semanal de Treinos ({judoca.nome})
							</h3>
						</div>
						<span class="text-[10px] font-mono text-zinc-500">
							{treinos.length} turma(s)
						</span>
					</div>

					{#if treinos.length > 0}
						<div class="space-y-3">
							{#each treinos as treino}
								<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3">
									<div class="space-y-1">
										<div class="flex items-center gap-2 flex-wrap">
											<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-800 text-emerald-300">
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
								{judoca.nome} ainda não está matriculado(a) em nenhum horário de treino. Converse com o Sensei para definir as turmas semanais.
							</p>
						</div>
					{/if}
				</div>

				<!-- PRÓXIMOS EVENTOS E CAMPEONATOS DA ACADEMIA -->
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
					<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
						<div class="flex items-center gap-2">
							<Swords class="w-4 h-4 text-amber-500" />
							<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
								Calendário & Campeonatos do Dojo
							</h3>
						</div>
						<a
							href="/dashboard/campeonatos"
							class="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
						>
							<span>Ver todos</span>
							<ArrowRight class="w-3 h-3" />
						</a>
					</div>

					{#if proximosEventos.length > 0}
						<div class="space-y-3">
							{#each proximosEventos as evento}
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

			<!-- ===================================================================== -->
			<!-- 8. FILOSOFIA & PRINCÍPIOS FUNDAMENTAIS DO JUDÔ                        -->
			<!-- ===================================================================== -->
			<div
				class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-emerald-900/30 relative overflow-hidden space-y-5"
			>
				<div class="flex items-center gap-2 pb-3 border-b border-zinc-900">
					<Sparkles class="w-4 h-4 text-emerald-400" />
					<h3 class="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
						Valores e Formação Moral do Tatame
					</h3>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
								自他共栄
							</span>
							<h4 class="text-sm font-bold text-white">Jita Kyoei — Prosperidade e Benefício Mútuo</h4>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							O progresso individual só é legítimo quando contribui para o bem-estar coletivo. Na formação das crianças e jovens, o Judô cultiva o respeito aos parceiros de treino, aos Senseis e à comunidade.
						</p>
					</div>

					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 border border-amber-800 text-amber-300">
								精力善用
							</span>
							<h4 class="text-sm font-bold text-white">Seiryoku Zen'yo — Máxima Eficiência com Mínimo Esforço</h4>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Empregar da melhor forma a energia mental e física em prol de causas nobres. Disciplina nos estudos, foco nas metas e autocontrole diante dos desafios da vida.
						</p>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
