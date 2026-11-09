<script lang="ts">
	import type { PainelJudocaDados } from "#lib/server/repositorios/dashboard.repo";
	import BadgeFaixa from "#lib/components/ui/BadgeFaixa.svelte";
	import PassaporteJudoca from "#lib/components/ui/PassaporteJudoca.svelte";
	import CalendarioTatameMensal from "#lib/components/ui/CalendarioTatameMensal.svelte";
	import BarraAlertasNotificacao from "./BarraAlertasNotificacao.svelte";
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
		Scale,
	} from "@lucide/svelte";

	interface Props {
		painel: PainelJudocaDados;
		nomeAcademia?: string | null;
	}

	let { painel, nomeAcademia = "Judô Hinodê" }: Props = $props();
	const nomeDojo = $derived(nomeAcademia || "Judô Hinodê");

	// Aba ativa para alternar entre Linha do Tempo de Graduações e Linha do Tempo de Conquistas
	let abaTimeline = $state<"graduacoes" | "conquistas">("graduacoes");

	// Classificação inteligente de pendências
	const pendenciasAcaoAluno = $derived(
		painel.pendencias?.filter((p) => p.dependeDoAluno) || [],
	);
	const pendenciasInformativas = $derived(
		painel.pendencias?.filter((p) => !p.dependeDoAluno) || [],
	);
	const temAcaoPendente = $derived(pendenciasAcaoAluno.length > 0);
	const primeiraAcao = $derived(pendenciasAcaoAluno[0] || null);
</script>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 0. BARRA DE ALERTAS COMPACTA (ESTILO NOTIFICAÇÕES MOBILE)                 -->
	<!-- ========================================================================= -->
	<BarraAlertasNotificacao
		pendenciasJudoca={painel.pendencias}
		escopo="aluno"
	/>

	<!-- ========================================================================= -->
	<!-- 1. PASSAPORTE DIGITAL DO JUDOCA & TERMÔMETRO DE CARÊNCIA DE FAIXA         -->
	<!-- ========================================================================= -->
	<PassaporteJudoca
		nome={painel.judoca.nome}
		matricula={painel.judoca.matricula}
		faixaAtual={painel.judoca.graduacao_atual}
		categoria={painel.judoca.categoria}
		peso={painel.judoca.peso}
		nomeSensei={painel.judoca.nome_professor_responsavel}
		nomeAcademia={nomeDojo}
		dataReferenciaGraduacao={painel.judoca.data_ultima_graduacao_br}
		tempoJudo={painel.judoca.tempo_judo}
		tempoFaixaAtual={painel.judoca.tempo_faixa_atual}
	/>

	<!-- ========================================================================= -->
	<!-- 2. GRID DE CARDS: MÉTRICAS DO JUDOCA & MÉTRICAS DA ACADEMIA               -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- CARD ESQUERDA: MÉTRICAS DO JUDOCA (INDIVIDUAL) -->
		<div
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5"
		>
			<div
				class="flex items-center justify-between pb-3 border-b border-zinc-900"
			>
				<div class="flex items-center gap-2">
					<Award class="w-4 h-4 text-red-500" />
					<h2
						class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold"
					>
						Métricas do Judoca
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500"
					>Desempenho Individual</span
				>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<!-- Treinos Inscritos -->
				<div
					class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1"
				>
					<span
						class="text-[10px] font-mono uppercase text-zinc-500 block"
						>Treinos Inscritos</span
					>
					<div class="flex items-baseline gap-2">
						<span
							class="text-2xl font-black font-display text-white"
						>
							{painel.metricasJudoca.totalTreinosInscritos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>turma(s)</span
						>
					</div>
				</div>

				<!-- Campeonatos Participados -->
				<div
					class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1"
				>
					<span
						class="text-[10px] font-mono uppercase text-zinc-500 block"
						>Torneios Disputados</span
					>
					<div class="flex items-baseline gap-2">
						<span
							class="text-2xl font-black font-display text-white"
						>
							{painel.metricasJudoca.totalCampeonatos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>edições</span
						>
					</div>
				</div>
			</div>

			<!-- Medalhas Individuais do Judoca -->
			<div
				class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3"
			>
				<div class="flex items-center justify-between">
					<span
						class="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5"
					>
						<Medal class="w-3.5 h-3.5 text-amber-400" />
						<span>Pódios & Medalhas Recebidas</span>
					</span>
					<span class="text-xs font-bold font-mono text-amber-400">
						{painel.metricasJudoca.totalMedalhas} total
					</span>
				</div>

				<div class="grid grid-cols-3 gap-2 text-center">
					<div
						class="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40"
					>
						<span class="text-base block">🥇</span>
						<span
							class="text-lg font-black font-display text-amber-300 block leading-tight"
						>
							{painel.metricasJudoca.totalOuro}
						</span>
						<span
							class="text-[10px] font-mono text-amber-400/80 uppercase"
							>Ouro</span
						>
					</div>
					<div
						class="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50"
					>
						<span class="text-base block">🥈</span>
						<span
							class="text-lg font-black font-display text-zinc-200 block leading-tight"
						>
							{painel.metricasJudoca.totalPrata}
						</span>
						<span
							class="text-[10px] font-mono text-zinc-400 uppercase"
							>Prata</span
						>
					</div>
					<div
						class="p-2.5 rounded-lg bg-orange-950/20 border border-orange-900/40"
					>
						<span class="text-base block">🥉</span>
						<span
							class="text-lg font-black font-display text-orange-300 block leading-tight"
						>
							{painel.metricasJudoca.totalBronze}
						</span>
						<span
							class="text-[10px] font-mono text-orange-400/80 uppercase"
							>Bronze</span
						>
					</div>
				</div>

				{#if painel.metricasJudoca.totalLutas > 0}
					<div
						class="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-zinc-800"
					>
						<span
							>Lutas realizadas: <strong class="text-white"
								>{painel.metricasJudoca.totalLutas}</strong
							></span
						>
						<span
							>Vitórias: <strong class="text-emerald-400"
								>{painel.metricasJudoca.totalVitorias}</strong
							></span
						>
					</div>
				{/if}
			</div>
		</div>

		<!-- CARD DIREITA: MÉTRICAS RESUMO ACADEMIA (COLETIVO DO DOJO) -->
		<div
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5"
		>
			<div
				class="flex items-center justify-between pb-3 border-b border-zinc-900"
			>
				<div class="flex items-center gap-2">
					<Trophy class="w-4 h-4 text-amber-500" />
					<h2
						class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold"
					>
						Métricas do Dojo ({nomeDojo})
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500"
					>Força Coletiva</span
				>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<!-- Judocas Cadastrados -->
				<div
					class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1"
				>
					<span
						class="text-[10px] font-mono uppercase text-zinc-500 block"
						>Judocas Cadastrados</span
					>
					<div class="flex items-baseline gap-2">
						<span
							class="text-2xl font-black font-display text-white"
						>
							{painel.metricasAcademia.totalAlunos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>atletas</span
						>
					</div>
				</div>

				<!-- Treinos Disponíveis -->
				<div
					class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1"
				>
					<span
						class="text-[10px] font-mono uppercase text-zinc-500 block"
						>Treinos na Grade</span
					>
					<div class="flex items-baseline gap-2">
						<span
							class="text-2xl font-black font-display text-white"
						>
							{painel.metricasAcademia.totalTreinosDisponiveis}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>horários</span
						>
					</div>
				</div>

				<!-- Troféus de Campeonatos -->
				<div
					class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1"
				>
					<span
						class="text-[10px] font-mono uppercase text-zinc-500 block"
						>Torneios Disputados</span
					>
					<div class="flex items-baseline gap-2">
						<span
							class="text-2xl font-black font-display text-amber-400"
						>
							{painel.metricasAcademia.totalTrofeusCampeonatos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>campeonatos</span
						>
					</div>
				</div>

				<!-- Medalhas dos Alunos -->
				<div
					class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1"
				>
					<span
						class="text-[10px] font-mono uppercase text-zinc-500 block"
						>Medalhas do Dojo</span
					>
					<div class="flex items-baseline gap-2">
						<span
							class="text-2xl font-black font-display text-amber-300"
						>
							{painel.metricasAcademia.totalMedalhasAlunos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>conquistas</span
						>
					</div>
				</div>
			</div>

			<!-- Lista de Senseis / Professores -->
			<div class="pt-2 border-t border-zinc-900 space-y-2">
				<span
					class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-bold"
				>
					Quadro de Senseis & Mestres ({painel.metricasAcademia
						.senseis.length})
				</span>
				<div class="flex flex-wrap gap-2">
					{#each painel.metricasAcademia.senseis as sensei}
						<div
							class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs"
						>
							<div class="w-2 h-2 rounded-full bg-red-500"></div>
							<span class="text-zinc-200 font-medium"
								>{sensei.nome}</span
							>
							{#if sensei.grau_faixa}
								<span
									class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700"
								>
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
	<div
		class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6"
	>
		<div
			class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900"
		>
			<div>
				<h2
					class="text-base sm:text-lg font-bold text-white font-display"
				>
					Linha do Tempo do Judoca
				</h2>
				<p class="text-xs text-zinc-400 mt-0.5">
					Acompanhe seu progresso de faixas ou a galeria de medalhas
					conquistadas.
				</p>
			</div>

			<!-- Botões de Alternância das Linhas do Tempo -->
			<div
				class="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto"
			>
				<button
					type="button"
					onclick={() => (abaTimeline = "graduacoes")}
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
					onclick={() => (abaTimeline = "conquistas")}
					class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 {abaTimeline ===
					'conquistas'
						? 'bg-red-600 text-white shadow-sm'
						: 'text-zinc-400 hover:text-white'}"
				>
					<Trophy class="w-3.5 h-3.5" />
					<span>Conquistas & Pódios ({painel.conquistas.length})</span
					>
				</button>
			</div>
		</div>

		<!-- ABA 1: LINHA DO TEMPO COM AS GRADUAÇÕES (DAN/KYU) -->
		{#if abaTimeline === "graduacoes"}
			{#if painel.graduacoes.length > 0}
				<div
					class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800"
				>
					{#each painel.graduacoes as grad}
						<div class="relative group">
							<!-- Ponto da linha do tempo -->
							<div
								class="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-zinc-950 border-2 border-red-600 flex items-center justify-center transition-transform group-hover:scale-125"
							>
								<div
									class="w-1.5 h-1.5 rounded-full bg-red-500"
								></div>
							</div>

							<div
								class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
							>
								<div class="flex items-center gap-3">
									<BadgeFaixa faixa={grad.faixa} size="md" />
									<div>
										<span
											class="text-xs text-zinc-400 font-mono block"
										>
											Homologado em {grad.data_graduacao}
										</span>
										<span
											class="text-sm font-bold text-white"
										>
											{grad.nome_evento ||
												"Exame Oficial de Graduação"}
										</span>
									</div>
								</div>

								<div
									class="text-xs font-mono text-zinc-400 sm:text-right"
								>
									<span
										class="text-[10px] uppercase text-zinc-500 block"
										>Sensei Examinador</span
									>
									<span class="text-zinc-200 font-medium"
										>{grad.nome_professor_homologador}</span
									>
									{#if grad.grau_faixa_professor}
										<span class="text-[10px] text-zinc-500"
											>({grad.grau_faixa_professor})</span
										>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-2"
				>
					<Award class="w-8 h-8 text-zinc-600 mx-auto" />
					<h3 class="text-sm font-bold text-white">
						Graduação Inicial ({painel.judoca.graduacao_atual})
					</h3>
					<p class="text-xs text-zinc-400 max-w-sm mx-auto">
						Você está iniciando sua caminhada no tatame. Conforme
						prestar os exames de graduação do dojo, suas promoções
						de Dan/Kyu aparecerão aqui nesta linha do tempo.
					</p>
				</div>
			{/if}
		{/if}

		<!-- ABA 2: LINHA DO TEMPO COM AS CONQUISTAS (CAMPEONATOS) -->
		{#if abaTimeline === "conquistas"}
			{#if painel.conquistas.length > 0}
				<div
					class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800"
				>
					{#each painel.conquistas as conq}
						<div class="relative group">
							<!-- Ponto da linha do tempo -->
							<div
								class="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-zinc-950 border-2 {conq.tipo_medalha ===
								'ouro'
									? 'border-amber-400'
									: conq.tipo_medalha === 'prata'
										? 'border-zinc-300'
										: conq.tipo_medalha === 'bronze'
											? 'border-orange-400'
											: 'border-zinc-600'} flex items-center justify-center transition-transform group-hover:scale-125"
							>
								<div
									class="w-1.5 h-1.5 rounded-full {conq.tipo_medalha ===
									'ouro'
										? 'bg-amber-400'
										: conq.tipo_medalha === 'prata'
											? 'bg-zinc-300'
											: conq.tipo_medalha === 'bronze'
												? 'bg-orange-400'
												: 'bg-zinc-500'}"
								></div>
							</div>

							<div
								class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
							>
								<div class="space-y-1">
									<div
										class="flex items-center gap-2 flex-wrap"
									>
										<span
											class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold {conq.tipo_medalha ===
											'ouro'
												? 'bg-amber-950/70 text-amber-300 border border-amber-800'
												: conq.tipo_medalha === 'prata'
													? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
													: conq.tipo_medalha ===
														  'bronze'
														? 'bg-orange-950/70 text-orange-300 border border-orange-800'
														: 'bg-zinc-800 text-zinc-400 border border-zinc-700'}"
										>
											{conq.classificacao}
										</span>
										<span
											class="text-xs text-zinc-400 font-mono"
											>{conq.data_evento}</span
										>
									</div>
									<h4 class="text-sm font-bold text-white">
										{conq.nome_campeonato}
										{conq.edicao ? `(${conq.edicao})` : ""}
									</h4>
								</div>

								<div
									class="flex items-center gap-4 text-xs font-mono text-zinc-400"
								>
									<div>
										<span
											class="text-[10px] text-zinc-500 block uppercase"
											>Lutas</span
										>
										<strong class="text-white text-sm"
											>{conq.qtd_lutas}</strong
										>
									</div>
									<div class="h-6 w-px bg-zinc-800"></div>
									<div>
										<span
											class="text-[10px] text-zinc-500 block uppercase"
											>Vitórias</span
										>
										<strong class="text-emerald-400 text-sm"
											>{conq.qtd_vitorias}</strong
										>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-2"
				>
					<Trophy class="w-8 h-8 text-zinc-600 mx-auto" />
					<h3 class="text-sm font-bold text-white">
						Nenhum torneio registrado
					</h3>
					<p class="text-xs text-zinc-400 max-w-sm mx-auto">
						Seus resultados em campeonatos oficiais e medalhas
						recebidas serão computados nesta linha do tempo após as
						competições.
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
		<div
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4"
		>
			<div
				class="flex items-center justify-between pb-3 border-b border-zinc-900"
			>
				<div class="flex items-center gap-2">
					<Calendar class="w-4 h-4 text-red-500" />
					<h2
						class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold"
					>
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
						<div
							class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3"
						>
							<div class="space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span
										class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-950/60 border border-red-800 text-red-300"
									>
										{treino.dia_semana}
									</span>
									<span
										class="text-xs font-mono text-zinc-400"
									>
										{treino.horario_inicio} às {treino.horario_fim}
									</span>
								</div>
								<h4 class="text-sm font-bold text-white">
									{treino.descricao}
								</h4>
								<p class="text-[11px] text-zinc-400">
									Sensei: {treino.professores}
								</p>
							</div>

							<div class="shrink-0">
								<span
									class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-400"
								>
									Matriculado
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="p-6 rounded-xl bg-zinc-900/20 border border-dashed border-zinc-800 text-center space-y-2"
				>
					<Calendar class="w-7 h-7 text-zinc-600 mx-auto" />
					<p class="text-xs text-zinc-400">
						Você ainda não foi alocado a uma turma específica.
						Consulte seu Sensei para definir seus horários de
						treino.
					</p>
				</div>
			{/if}
		</div>

		<!-- PRÓXIMOS EVENTOS E CAMPEONATOS DA ACADEMIA -->
		<div
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4"
		>
			<div
				class="flex items-center justify-between pb-3 border-b border-zinc-900"
			>
				<div class="flex items-center gap-2">
					<Swords class="w-4 h-4 text-amber-500" />
					<h2
						class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold"
					>
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
						<div
							class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3"
						>
							<div class="space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span
										class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase {evento.eh_campeonato
											? 'bg-amber-950/60 border border-amber-800 text-amber-300'
											: 'bg-purple-950/60 border border-purple-800 text-purple-300'}"
									>
										{evento.eh_campeonato
											? "Campeonato"
											: "Exame de Graduação"}
									</span>
									<span
										class="text-xs font-mono text-zinc-400"
									>
										{evento.data_inicio || "Data a definir"}
									</span>
								</div>
								<h4 class="text-sm font-bold text-white">
									{evento.nome}
								</h4>
								{#if evento.valor_inscricao !== null && evento.valor_inscricao !== undefined}
									<p
										class="text-[11px] font-mono text-zinc-400"
									>
										Taxa de inscrição: {evento.valor_inscricao ===
										0
											? "Gratuito"
											: `R$ ${Number(evento.valor_inscricao).toFixed(2).replace(".", ",")}`}
									</p>
								{/if}
							</div>

							<a
								href={evento.eh_campeonato
									? `/dashboard/campeonatos/${evento.id_evento}`
									: `/dashboard/graduacoes/${evento.id_evento}`}
								class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition-colors shrink-0"
							>
								Detalhes
							</a>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="p-6 rounded-xl bg-zinc-900/20 border border-dashed border-zinc-800 text-center space-y-2"
				>
					<p class="text-xs text-zinc-400">
						Nenhum exame ou campeonato agendado no calendário no
						momento.
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 4.5. MINHA JORNADA DE PRESENÇA NO TATAME & CALENDÁRIO MENSAL              -->
	<!-- ========================================================================= -->
	{#if painel.metricasPresenca}
		{@const mp = painel.metricasPresenca}
		<section class="space-y-5">
			<div
				class="p-5 sm:p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5"
			>
				<div
					class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-600/40 flex items-center justify-center text-amber-400 shrink-0"
						>
							<Flame class="w-5 h-5" />
						</div>
						<div>
							<h2
								class="text-base sm:text-lg font-extrabold text-white font-display"
							>
								Minha Constância no Tatame
							</h2>
							<p class="text-xs text-zinc-400">
								Sua disciplina diária rumo à próxima graduação
								(suporta múltiplos treinos realizados no mesmo
								dia)
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2 flex-wrap">
						<span
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300"
						>
							<Flame class="w-4 h-4 text-amber-400" />
							<span
								>{mp.streak_atual}
								{mp.streak_atual === 1
									? "treino consecutivo"
									: "treinos consecutivos"}</span
							>
						</span>
						{#if mp.maior_streak > 0}
							<span
								class="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400"
							>
								Recorde: <strong class="text-white"
									>{mp.maior_streak}</strong
								>
							</span>
						{/if}
					</div>
				</div>

				<!-- KPIs de Presença do Judoca -->
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
					<div
						class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block"
						>
							Aulas Concluídas
						</span>
						<div class="flex items-baseline gap-2">
							<span
								class="text-2xl font-extrabold text-emerald-400 font-display"
							>
								{mp.total_presentes}
							</span>
							<span class="text-xs text-zinc-500"
								>de {mp.total_aulas} chamadas</span
							>
						</div>
						<p class="text-[11px] text-zinc-400">
							Em <strong class="text-white"
								>{mp.dias_distintos_treinados}</strong
							> dia(s) distintos
						</p>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block"
						>
							Taxa de Presença Geral
						</span>
						<div class="flex items-baseline gap-2">
							<span
								class="text-2xl font-extrabold text-white font-display"
							>
								{mp.percentual_presenca}%
							</span>
						</div>
						<div
							class="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden"
						>
							<div
								class="h-full rounded-full bg-emerald-500"
								style="width: {Math.min(
									100,
									mp.percentual_presenca,
								)}%"
							></div>
						</div>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block"
						>
							Frequência neste Mês
						</span>
						<div class="flex items-baseline gap-2">
							<span
								class="text-2xl font-extrabold text-amber-400 font-display"
							>
								{mp.percentual_mes_atual}%
							</span>
							<span class="text-xs text-zinc-500">
								({mp.presentes_mes_atual}/{mp.aulas_mes_atual})
							</span>
						</div>
						<p class="text-[11px] text-zinc-400">
							Justificadas: <strong class="text-sky-400"
								>{mp.total_justificadas}</strong
							>
							• Faltas:
							<strong class="text-red-400"
								>{mp.total_faltas}</strong
							>
						</p>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block"
						>
							Meta Próxima Graduação
						</span>
						{#if mp.proximo_exame_meta && (mp.proximo_exame_meta.qtd_minima_aulas > 0 || mp.proximo_exame_meta.percentual_minimo > 0)}
							{@const meta = mp.proximo_exame_meta}
							<div class="flex items-center gap-1.5">
								{#if meta.apto_frequencia}
									<span
										class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300"
									>
										Meta Atingida ✓
									</span>
								{:else}
									<span
										class="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300"
									>
										Em Progresso
									</span>
								{/if}
							</div>
							<p
								class="text-[11px] text-zinc-300 truncate"
								title={meta.nome_evento}
							>
								{meta.qtd_minima_aulas > 0
									? `${mp.total_presentes}/${meta.qtd_minima_aulas} aulas`
									: ""}
								{meta.percentual_minimo > 0
									? ` • Min. ${meta.percentual_minimo}%`
									: ""}
							</p>
						{:else}
							<span
								class="text-sm font-bold text-zinc-200 block pt-0.5"
							>
								Constância Livre
							</span>
							<p class="text-[11px] text-zinc-500">
								Mantenha acima de 80% de presença
							</p>
						{/if}
					</div>
				</div>

				<!-- Calendário Mensal Tradicional do Judoca -->
				<CalendarioTatameMensal
					sessoes={painel.presencas || []}
					turmasMatriculadas={painel.treinosInscritos || []}
					titulo="Meu Calendário Mensal de Treinos"
					subtitulo="Visualize todos os treinos realizados em cada dia do mês, seus horários e as observações do Sensei"
				/>
			</div>
		</section>
	{/if}

	<!-- ========================================================================= -->
	<!-- 5. PRINCÍPIOS FUNDAMENTAIS DO JUDÔ (DOJO KUN & FILOSOFIA)                 -->
	<!-- ========================================================================= -->
	<div
		class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-red-900/30 relative overflow-hidden space-y-5"
	>
		<div class="flex items-center gap-2.5 pb-3 border-b border-zinc-900">
			<Scroll class="w-4 h-4 text-red-500" />
			<h2
				class="text-xs font-mono uppercase tracking-wider text-red-400 font-bold"
			>
				Princípios Fundamentais do Judô • Kodokan
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Princípio 1: Seiryoku Zen'yo -->
			<div
				class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2"
			>
				<div class="flex items-center justify-between">
					<span class="text-base font-bold text-white font-display"
						>Seiryoku Zen'yo</span
					>
					<span class="text-xs font-mono text-zinc-500">精力善用</span
					>
				</div>
				<p class="text-xs text-zinc-300 font-medium">
					"Máxima Eficiência com o Mínimo Esforço"
				</p>
				<p class="text-[11px] text-zinc-400 leading-relaxed">
					O princípio de utilizar toda a energia mental e física de
					forma inteligente, aproveitando a força e o impulso do
					adversário para superá-lo com técnica, calma e precisão.
				</p>
			</div>

			<!-- Princípio 2: Jita Kyoei -->
			<div
				class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2"
			>
				<div class="flex items-center justify-between">
					<span class="text-base font-bold text-white font-display"
						>Jita Kyoei</span
					>
					<span class="text-xs font-mono text-zinc-500">自他共栄</span
					>
				</div>
				<p class="text-xs text-zinc-300 font-medium">
					"Prosperidade e Benefício Mútuo"
				</p>
				<p class="text-[11px] text-zinc-400 leading-relaxed">
					A evolução só acontece através da cooperação. Ao ajudar os
					companheiros de treino a crescerem, o dojo inteiro se
					fortalece, forjando caráter, fraternidade e respeito
					recíproco.
				</p>
			</div>
		</div>

		<!-- Código Moral do Judoca -->
		<div
			class="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400"
		>
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
