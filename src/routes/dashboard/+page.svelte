<script lang="ts">
	import type { PageData } from './$types';
	import StatCard from '#lib/components/ui/StatCard.svelte';
	import BadgePerfil from '#lib/components/ui/BadgePerfil.svelte';
	import {
		Users,
		Calendar,
		Award,
		Trophy,
		UserPlus,
		CalendarPlus,
		ShieldCheck,
		ArrowRight,
		Clock,
		Flame,
		CheckCircle2
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Visão Geral do Dojo - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8">
	<!-- ========================================================================= -->
	<!-- 1. BANNER DE BOAS-VINDAS & CONTEXTO MULTI-TENANT -->
	<!-- ========================================================================= -->
	<section
		class="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-2xl"
	>
		<!-- Brilho vermelho cirúrgico sutil no fundo -->
		<div
			class="absolute -top-24 -right-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div>
				<div class="flex items-center gap-2 mb-3">
					<span
						class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-800/60 text-xs font-mono text-red-300"
					>
						<Flame class="w-3.5 h-3.5 text-red-500" />
						<span>Dojo Ativo: #{data.idAcademia}</span>
					</span>
					<span class="text-xs text-zinc-500 font-mono">•</span>
					<span class="text-xs text-zinc-400 font-mono">{data.nomeAcademia}</span>
				</div>

				<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					Bem-vindo ao Tatame, {data.usuario?.nome}
				</h1>
				<p class="text-sm text-zinc-400 mt-1 max-w-2xl">
					Painel central de controle pedagógico, graduações imutáveis e gestão multi-tenant do
					seu dojo de Judô.
				</p>
			</div>

			<!-- Papéis Ativos no Tenant -->
			<div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shrink-0 self-start md:self-auto">
				<span class="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
					Papéis Ativos Resolvidos:
				</span>
				<div class="flex flex-wrap gap-1.5">
					{#each data.perfis as perfil}
						<BadgePerfil {perfil} tamanho="md" />
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ========================================================================= -->
	<!-- 2. GRID DE MÉTRICAS OPERACIONAIS DO DOJO -->
	<!-- ========================================================================= -->
	<section>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
				Métricas Consolidadas da Academia
			</h2>
			<span class="text-[11px] text-zinc-500 font-mono">Filtro Tenant Ativo</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<StatCard
				titulo="Judocas Cadastrados"
				valor={data.metricas.totalAlunos}
				descricao="Atletas ativos no dojo"
				icone={Users}
				destaque={true}
				tendencia={{ texto: 'Em dia', positivo: true }}
			/>

			<StatCard
				titulo="Turmas & Horários"
				valor={data.metricas.totalTurmas}
				descricao="Grades de treinos semanais"
				icone={Calendar}
			/>

			<StatCard
				titulo="Senseis / Professores"
				valor={data.metricas.totalProfessores}
				descricao="Equipe técnica federada"
				icone={Award}
			/>

			<StatCard
				titulo="Graduações Homologadas"
				valor={data.metricas.totalGraduacoes}
				descricao="Histórico imutável de faixas"
				icone={Trophy}
			/>
		</div>
	</section>

	<!-- ========================================================================= -->
	<!-- 3. AÇÕES RÁPIDAS & ROADMAP PEDAGÓGICO -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Coluna da Esquerda (2 slots): Ações Rápidas de Operação -->
		<div class="lg:col-span-2 space-y-6">
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900">
				<div class="flex items-center justify-between mb-5">
					<div>
						<h3 class="text-base font-bold text-white font-display">Ações Rápidas do Dojo</h3>
						<p class="text-xs text-zinc-400 mt-0.5">
							Atalhos prioritários para a rotina administrativa e pedagógica do dojo
						</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<a
						href="/dashboard/alunos"
						class="group p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start gap-3.5"
					>
						<div
							class="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-red-400 group-hover:border-red-900/60 shrink-0 transition-colors"
						>
							<UserPlus class="w-4 h-4" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-semibold text-white group-hover:text-red-300 transition-colors">
									Matricular Judoca
								</span>
								<span class="text-[9px] font-mono text-zinc-500 uppercase">Fase 4</span>
							</div>
							<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
								Cadastro de alunos, cálculo de maioridade e responsável legal.
							</p>
						</div>
					</a>

					<a
						href="/dashboard/turmas"
						class="group p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start gap-3.5"
					>
						<div
							class="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-red-400 group-hover:border-red-900/60 shrink-0 transition-colors"
						>
							<CalendarPlus class="w-4 h-4" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-semibold text-white group-hover:text-red-300 transition-colors">
									Organizar Turmas
								</span>
								<span class="text-[9px] font-mono text-zinc-500 uppercase">Fase 5</span>
							</div>
							<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
								Horários de tatame, dias da semana e alocação de senseis.
							</p>
						</div>
					</a>

					<a
						href="/dashboard/graduacoes"
						class="group p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start gap-3.5"
					>
						<div
							class="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-red-400 group-hover:border-red-900/60 shrink-0 transition-colors"
						>
							<Award class="w-4 h-4" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-semibold text-white group-hover:text-red-300 transition-colors">
									Exame & Graduação
								</span>
								<span class="text-[9px] font-mono text-zinc-500 uppercase">Fase 6</span>
							</div>
							<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
								Troca de faixa atômica com histórico estritamente insert-only.
							</p>
						</div>
					</a>

					<a
						href="/dashboard/campeonatos"
						class="group p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start gap-3.5"
					>
						<div
							class="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-red-400 group-hover:border-red-900/60 shrink-0 transition-colors"
						>
							<Trophy class="w-4 h-4" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-semibold text-white group-hover:text-red-300 transition-colors">
									Inscrição em Torneios
								</span>
								<span class="text-[9px] font-mono text-zinc-500 uppercase">Fase 7</span>
							</div>
							<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
								Inscrições mistas, validação de lutas e registro de vitórias.
							</p>
						</div>
					</a>
				</div>
			</div>
		</div>

		<!-- Coluna da Direita (1 slot): Próximos Eventos & Filosofia do Judô -->
		<div class="space-y-6">
			<!-- Próximos Eventos -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-sm font-bold text-white font-display">Próximos Eventos</h3>
					<span class="text-[10px] font-mono text-zinc-500 uppercase">Calendário</span>
				</div>

				{#if data.metricas.proximosEventos.length > 0}
					<div class="space-y-3">
						{#each data.metricas.proximosEventos as evento}
							<div class="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold text-white truncate">{evento.nome}</span>
									{#if evento.data_inicio}
										<span class="text-[10px] font-mono text-zinc-400 shrink-0 ml-2">
											{evento.data_inicio}
										</span>
									{/if}
								</div>
								{#if evento.edicao}
									<span class="text-[11px] text-zinc-500 block mt-0.5">{evento.edicao}</span>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="p-6 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center">
						<Clock class="w-6 h-6 text-zinc-600 mx-auto mb-2" />
						<p class="text-xs text-zinc-400 font-medium">Nenhum evento agendado</p>
						<p class="text-[11px] text-zinc-500 mt-0.5">
							Torneios e cerimônias de faixa aparecerão aqui.
						</p>
					</div>
				{/if}
			</div>

			<!-- Princípios Tradicionais do Judô (Jita Kyoei & Seiryoku Zen'yo) -->
			<div class="p-5 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-900">
				<span class="text-[10px] font-mono uppercase tracking-widest text-red-500 block mb-2 font-bold">
					Princípios Fundamentais
				</span>
				<div class="space-y-3">
					<div>
						<div class="text-xs font-bold text-white">精力善用 (Seiryoku Zen'yo)</div>
						<div class="text-[11px] text-zinc-400 leading-snug">
							Máxima eficiência com o mínimo de energia.
						</div>
					</div>
					<div>
						<div class="text-xs font-bold text-white">自他共栄 (Jita Kyoei)</div>
						<div class="text-[11px] text-zinc-400 leading-snug">
							Bem-estar e prosperidade mútua para todos no dojo.
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
