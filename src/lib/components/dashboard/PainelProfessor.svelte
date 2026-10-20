<script lang="ts">
	import type { PainelProfessorDados } from '#lib/server/repositorios/dashboard.repo';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import CardAniversariantes from './CardAniversariantes.svelte';
	import CardConformidadeAlunos from './CardConformidadeAlunos.svelte';
	import {
		Award,
		Users,
		Calendar,
		Clock,
		ArrowRight,
		CheckCircle2,
		AlertTriangle,
		Sparkles,
		Flame,
		UserPlus,
		CalendarPlus,
		Trophy
	} from '@lucide/svelte';

	interface Props {
		painel: PainelProfessorDados;
		nomeAcademia?: string | null;
	}

	let { painel, nomeAcademia = 'Judô Hinodê' }: Props = $props();
	const nomeDojo = $derived(nomeAcademia || 'Judô Hinodê');

	const totalPendencias = $derived(
		painel.pendenciasTecnicas.alunosSemPeso.length +
			painel.pendenciasTecnicas.alunosSemTurma.length +
			painel.pendenciasTecnicas.alunosFederacaoPendente.length +
			(painel.pendenciasTecnicas.campeonatosPendentesAutorizacao?.length || 0)
	);
</script>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 1. BANNER DO SENSEI / CREDENCIAMENTO TÉCNICO                              -->
	<!-- ========================================================================= -->
	<section
		class="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-2xl"
	>
		<!-- Brilho âmbar sutil no fundo representando a autoridade do Sensei -->
		<div
			class="absolute -top-24 -right-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div>
				<div class="flex items-center gap-2 mb-3 flex-wrap">
					<span
						class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/60 text-xs font-mono text-amber-300"
					>
						<Award class="w-3.5 h-3.5 text-amber-500" />
						<span>Sensei Técnico: {painel.professor.grau_faixa || 'Faixa Preta'}</span>
					</span>
					{#if painel.professor.n_federacao}
						<span class="text-xs text-zinc-600 font-mono">•</span>
						<span class="text-xs text-zinc-400 font-mono">
							Reg.: {painel.professor.n_federacao}
						</span>
					{/if}
					<span class="text-xs text-zinc-600 font-mono">•</span>
					<span class="text-xs text-zinc-400 font-mono">{nomeAcademia}</span>
				</div>

				<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					Tatame do Sensei, {painel.professor.nome}
				</h1>
				<p class="text-sm text-zinc-400 mt-1 max-w-2xl">
					Painel de gestão técnica das suas turmas, judocas sob sua tutela e conformidade marcial.
				</p>
			</div>

			<!-- Resumo da Tutela -->
			<div
				class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shrink-0 self-start md:self-auto space-y-1.5"
			>
				<span class="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
					Status Técnico no Dojo:
				</span>
				<div class="flex items-center gap-2">
					<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
					<span class="text-xs font-bold text-white">Professor Ativo no Tatame</span>
				</div>
				<span class="text-[11px] font-mono text-zinc-400 block">
					{painel.totalAlunosSobTutela} judoca(s) sob sua responsabilidade
				</span>
			</div>
		</div>
	</section>

	<!-- ========================================================================= -->
	<!-- 2. GRID DE KPIS OPERACIONAIS DO SENSEI                                    -->
	<!-- ========================================================================= -->
	<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard
			titulo="Minhas Turmas"
			valor={painel.totalTurmas}
			descricao="Turmas que você ministra"
			icone={Calendar}
			destaque={false}
		/>

		<StatCard
			titulo="Alunos nas Turmas"
			valor={painel.totalAlunosTurmas}
			descricao="Atletas matriculados nas suas aulas"
			icone={Users}
			destaque={true}
		/>

		<StatCard
			titulo="Tutela Técnica"
			valor={painel.totalAlunosSobTutela}
			descricao="Judocas sob sua mentoria direta"
			icone={Award}
			destaque={false}
		/>

		<StatCard
			titulo="Pendências Técnicas"
			valor={totalPendencias}
			descricao={totalPendencias === 0 ? 'Tudo em ordem' : 'Requerem sua atenção'}
			icone={totalPendencias === 0 ? CheckCircle2 : AlertTriangle}
			tendencia={{
				texto: totalPendencias === 0 ? 'Conforme' : `${totalPendencias} pendente(s)`,
				positivo: totalPendencias === 0
			}}
		/>
	</section>

	<!-- ========================================================================= -->
	<!-- 3. LAYOUT PRINCIPAL: TURMAS + PENDÊNCIAS + SIDEBAR                        -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- COLUNA PRINCIPAL (2/3) -->
		<div class="lg:col-span-2 space-y-8">
			<!-- ===================================================================== -->
			<!-- MINHAS TURMAS MINISTRADAS                                             -->
			<!-- ===================================================================== -->
			<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-sm space-y-4">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center justify-center text-amber-400"
						>
							<Calendar class="w-4 h-4 text-amber-400" />
						</div>
						<div>
							<h2 class="text-sm font-bold text-white font-display">
								Minhas Turmas Ministradas
							</h2>
							<p class="text-[11px] text-zinc-500">Horários e dias em que você está escalado</p>
						</div>
					</div>
					<a
						href="/dashboard/turmas"
						class="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
					>
						<span>Ver Todas</span>
						<ArrowRight class="w-3.5 h-3.5" />
					</a>
				</div>

				{#if painel.turmas.length === 0}
					<div class="py-8 text-center space-y-2">
						<Calendar class="w-8 h-8 mx-auto text-zinc-600" />
						<p class="text-xs text-zinc-400 font-medium">
							Você ainda não está vinculado como professor de nenhuma turma.
						</p>
						<p class="text-[11px] text-zinc-600">
							Solicite à secretaria ou à administração para vincular você às turmas do dojo.
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						{#each painel.turmas as turma (turma.id_treino)}
							<div
								class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
							>
								<div class="flex items-start justify-between gap-2">
									<div>
										<span class="text-xs font-bold text-white block">
											{turma.descricao}
										</span>
										<span class="text-[11px] text-amber-400 font-mono font-semibold">
											{turma.dia_semana}
										</span>
									</div>
									<span
										class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-zinc-300"
									>
										{turma.total_alunos} judoca(s)
									</span>
								</div>

								<div class="flex items-center justify-between pt-2 border-t border-zinc-800/80">
									<div class="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
										<Clock class="w-3.5 h-3.5 text-zinc-500" />
										<span>{turma.horario_inicio} - {turma.horario_fim}</span>
									</div>

									<a
										href="/dashboard/turmas/{turma.id_treino}"
										class="text-[11px] font-mono font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
									>
										<span>Ver Turma</span>
										<ArrowRight class="w-3 h-3" />
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- ===================================================================== -->
			<!-- ALERTAS & PENDÊNCIAS TÉCNICAS DA TUTELA                               -->
			<!-- ===================================================================== -->
			<CardConformidadeAlunos pendencias={painel.pendenciasTecnicas} escopo="tutela" />

			<!-- ===================================================================== -->
			<!-- PRÓXIMOS EVENTOS DO DOJO                                              -->
			<!-- ===================================================================== -->
			<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-sm space-y-4">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400"
						>
							<Trophy class="w-4 h-4 text-zinc-400" />
						</div>
						<div>
							<h2 class="text-sm font-bold text-white font-display">
								Próximos Eventos & Campeonatos
							</h2>
							<p class="text-[11px] text-zinc-500">Calendário de atividades e competições da academia</p>
						</div>
					</div>
					<a
						href="/dashboard/campeonatos"
						class="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
					>
						<span>Ver Calendário</span>
						<ArrowRight class="w-3.5 h-3.5" />
					</a>
				</div>

				{#if painel.proximosEventos.length === 0}
					<p class="text-xs text-zinc-500 italic py-4 text-center">
						Nenhum evento agendado para os próximos meses.
					</p>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each painel.proximosEventos.slice(0, 4) as ev}
							<div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
								<div class="flex items-start justify-between gap-2">
									<span class="text-xs font-bold text-white line-clamp-1">{ev.nome}</span>
									<span
										class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase {ev.eh_campeonato
											? 'bg-red-950/60 border border-red-800 text-red-300'
											: 'bg-amber-950/60 border border-amber-800 text-amber-300'}"
									>
										{ev.eh_campeonato ? 'Torneio' : 'Graduação'}
									</span>
								</div>
								<div class="text-[11px] text-zinc-400 font-mono">
									Data: {ev.data_inicio || 'A definir'}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>

		<!-- COLUNA LATERAL (1/3) -->
		<div class="space-y-8">
			<!-- ===================================================================== -->
			<!-- WIDGET DE ANIVERSARIANTES DA SEMANA                                   -->
			<!-- ===================================================================== -->
			<CardAniversariantes aniversariantes={painel.aniversariantes} />

			<!-- ===================================================================== -->
			<!-- ALUNOS SOB MINHA TUTELA TÉCNICA                                       -->
			<!-- ===================================================================== -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-sm space-y-4">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2">
						<Users class="w-4 h-4 text-amber-500" />
						<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
							Alunos Sob Minha Tutela ({painel.alunosSobTutela.length})
						</h2>
					</div>
					<a
						href="/dashboard/alunos"
						class="text-[11px] font-mono text-amber-400 hover:text-amber-300 transition-colors"
					>
						Ver Todos →
					</a>
				</div>

				{#if painel.alunosSobTutela.length === 0}
					<p class="text-xs text-zinc-500 italic py-4 text-center">
						Nenhum judoca vinculado diretamente como aluno sob sua responsabilidade técnica.
					</p>
				{:else}
					<div class="space-y-2">
						{#each painel.alunosSobTutela.slice(0, 6) as aluno (aluno.id_usuario)}
							<div
								class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3"
							>
								<div class="min-w-0">
									<a
										href="/dashboard/alunos/{aluno.id_usuario}"
										class="text-xs font-bold text-white hover:text-amber-400 transition-colors block truncate"
									>
										{aluno.nome}
									</a>
									<span class="text-[10px] font-mono text-zinc-500">
										{aluno.matricula ? `Matrícula: ${aluno.matricula}` : 'Sem matrícula'}
									</span>
								</div>

								<div class="shrink-0">
									<BadgeFaixa faixa={aluno.graduacao_atual} size="sm" />
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- ===================================================================== -->
			<!-- ATALHOS RÁPIDOS DO PROFESSOR                                          -->
			<!-- ===================================================================== -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-sm space-y-4">
				<div class="flex items-center gap-2 pb-2 border-b border-zinc-900">
					<Sparkles class="w-4 h-4 text-zinc-400" />
					<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
						Atalhos do Tatame
					</h2>
				</div>

				<div class="grid grid-cols-1 gap-2">
					<a
						href="/dashboard/alunos/novo"
						class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex items-center gap-3 text-xs font-semibold text-zinc-200 transition-all hover:translate-x-1"
					>
						<UserPlus class="w-4 h-4 text-red-500" />
						<span>Cadastrar Novo Judoca</span>
					</a>

					<a
						href="/dashboard/turmas/nova"
						class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex items-center gap-3 text-xs font-semibold text-zinc-200 transition-all hover:translate-x-1"
					>
						<CalendarPlus class="w-4 h-4 text-amber-500" />
						<span>Criar Nova Turma</span>
					</a>

					<a
						href="/dashboard/alunos"
						class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex items-center gap-3 text-xs font-semibold text-zinc-200 transition-all hover:translate-x-1"
					>
						<Award class="w-4 h-4 text-emerald-500" />
						<span>Lista de Alunos & Faixas</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
