<script lang="ts">
	import type { PageData, ActionData } from './$types';
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
		CheckCircle2,
		UserCog,
		Settings
	} from '@lucide/svelte';
	import PainelJudoca from '#lib/components/dashboard/PainelJudoca.svelte';
	import PainelProfessor from '#lib/components/dashboard/PainelProfessor.svelte';
	import PainelResponsavel from '#lib/components/dashboard/PainelResponsavel.svelte';
	import SeletorPerspectiva from '#lib/components/dashboard/SeletorPerspectiva.svelte';
	import CardAniversariantes from '#lib/components/dashboard/CardAniversariantes.svelte';
	import CardConformidadeAlunos from '#lib/components/dashboard/CardConformidadeAlunos.svelte';

	let { data, form }: { data: PageData; form?: ActionData } = $props();
</script>

<svelte:head>
	<title>
		{data.visaoAtiva === 'aluno'
			? 'Meu Painel - Judô Hinodê'
			: data.visaoAtiva === 'professor'
				? 'Tatame do Sensei - Judô Hinodê'
				: data.visaoAtiva === 'responsavel'
					? 'Painel da Família - Judô Hinodê'
					: data.visaoAtiva === 'recepcao'
						? 'Secretaria & Recepção - Judô Hinodê'
						: 'Gestão do Dojo - Judô Hinodê'}
	</title>
</svelte:head>

<div class="space-y-6">
	<!-- FEEDBACK DE AÇÕES GLOBAIS DO DASHBOARD -->
	{#if form?.sucesso && form?.mensagem}
		<div
			class="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in duration-300"
		>
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
			<span class="font-medium">{form.mensagem}</span>
		</div>
	{/if}

	<!-- 0. SELETOR DE PERSPECTIVA (APENAS PARA USUÁRIOS COM MÚLTIPLOS PAPÉIS) -->
	<SeletorPerspectiva perfis={data.perfis} visaoAtiva={data.visaoAtiva} />

	{#if data.visaoAtiva === 'aluno' && data.painelJudoca}
		<PainelJudoca painel={data.painelJudoca} nomeAcademia={data.nomeAcademia} />
	{:else if data.visaoAtiva === 'professor' && data.painelProfessor}
		<PainelProfessor painel={data.painelProfessor} nomeAcademia={data.nomeAcademia} />
	{:else if data.visaoAtiva === 'responsavel' && data.painelResponsavel}
		<PainelResponsavel painel={data.painelResponsavel} nomeAcademia={data.nomeAcademia} />
	{:else}
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
					{data.visaoAtiva === 'recepcao'
						? 'Painel de atendimento, matrículas e conformidade de judocas do dojo.'
						: 'Painel central de controle pedagógico, graduações imutáveis e gestão multi-tenant do seu dojo de Judô.'}
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
			<!-- Conformidade & Pendências dos Alunos (Admin & Recepção) -->
			{#if data.pendenciasTecnicas}
				<CardConformidadeAlunos pendencias={data.pendenciasTecnicas} escopo="geral" />
			{/if}

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
					{#if data.podeVerAlunos}
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
										{data.podeCriarAlunos ? 'Matricular Judoca' : 'Alunos & Judocas'}
									</span>
								</div>
								<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
									{data.podeCriarAlunos
										? 'Cadastro de alunos, cálculo de maioridade e responsável legal.'
										: 'Consulta ao prontuário e ficha técnica dos judocas.'}
								</p>
							</div>
						</a>
					{/if}

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
									{data.podeGerenciarTurmas ? 'Organizar Turmas' : 'Turmas & Treinos'}
								</span>
							</div>
							<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
								{data.podeGerenciarTurmas
									? 'Horários de tatame, dias da semana e alocação de senseis.'
									: 'Consulte a grade semanal de treinos e senseis responsáveis.'}
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
									{data.podeHomologarGraduacoes ? 'Exame & Graduação' : 'Graduações & Faixas'}
								</span>
							</div>
							<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
								{data.podeHomologarGraduacoes
									? 'Troca de faixa atômica com histórico estritamente insert-only.'
									: 'Histórico cronológico de promoções de faixa e carências.'}
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
									{data.podeGerenciarCampeonatos ? 'Gestão de Campeonatos' : 'Campeonatos & Inscrições'}
								</span>
							</div>
							<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
								{data.podeGerenciarCampeonatos
									? 'Inscrições mistas, validação de lutas e registro de vitórias.'
									: 'Consulte os torneios oficiais e confirme sua participação.'}
							</p>
						</div>
					</a>

					{#if data.podeVerUsuarios}
						<a
							href="/dashboard/usuarios"
							class="group p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start gap-3.5"
						>
							<div
								class="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-red-400 group-hover:border-red-900/60 shrink-0 transition-colors"
							>
								<UserCog class="w-4 h-4" />
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold text-white group-hover:text-red-300 transition-colors">
										Equipe & Usuários
									</span>
								</div>
								<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
									Gestão de operadores e atribuição de perfis acumulativos.
								</p>
							</div>
						</a>
					{/if}

					{#if data.podeConfigurarAcademia}
						<a
							href="/dashboard/configuracoes"
							class="group p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start gap-3.5"
						>
							<div
								class="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-red-400 group-hover:border-red-900/60 shrink-0 transition-colors"
							>
								<Settings class="w-4 h-4" />
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold text-white group-hover:text-red-300 transition-colors">
										Configurações do Dojo
									</span>
								</div>
								<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
									Dados da academia, telemetria e conformidade LGPD.
								</p>
							</div>
						</a>
					{/if}
				</div>
			</div>
		</div>

		<!-- Coluna da Direita (1 slot): Aniversariantes, Próximos Eventos & Filosofia do Judô -->
		<div class="space-y-6">
			<!-- Aniversariantes da Semana (Equipe do Dojo) -->
			{#if data.aniversariantes}
				<CardAniversariantes aniversariantes={data.aniversariantes} />
			{/if}

			<!-- Próximos Eventos -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-sm font-bold text-white font-display">Próximos Eventos</h3>
					<span class="text-[10px] font-mono text-zinc-500 uppercase">Calendário</span>
				</div>

				{#if data.metricas.proximosEventos.length > 0}
					<div class="space-y-3">
						{#each data.metricas.proximosEventos as evento}
							{#if evento.eh_campeonato}
								<a
									href="/dashboard/campeonatos/{evento.id_evento}"
									class="block p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-red-900/60 transition-all group"
								>
									<div class="flex items-center justify-between gap-2">
										<div class="flex items-center gap-2 min-w-0">
											<Trophy class="w-3.5 h-3.5 text-red-500 shrink-0 group-hover:scale-110 transition-transform" />
											<span class="text-xs font-semibold text-white group-hover:text-red-300 transition-colors truncate">
												{evento.nome}
											</span>
										</div>
										{#if evento.data_inicio}
											<span class="text-[10px] font-mono text-zinc-400 shrink-0">
												{evento.data_inicio}
											</span>
										{/if}
									</div>

									<div class="flex flex-wrap items-center gap-1.5 mt-2">
										<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-300">
											🥋 {evento.faixa_inicio && evento.faixa_fim ? `${evento.faixa_inicio} - ${evento.faixa_fim}` : (evento.limite_graduacao || 'Todas')}
										</span>
										<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-800 text-emerald-400">
											{evento.valor_inscricao !== null && Number(evento.valor_inscricao) > 0 ? `R$ ${Number(evento.valor_inscricao).toFixed(2)}` : 'Gratuito'}
										</span>
										<span class="text-[10px] text-red-400 font-medium ml-auto group-hover:underline">
											Inscrever-se &rarr;
										</span>
									</div>
								</a>
							{:else}
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
							{/if}
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
{/if}
</div>
