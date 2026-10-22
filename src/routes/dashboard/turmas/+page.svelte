<script lang="ts">
	import type { PageData } from './$types';
	import {
		Calendar,
		CalendarPlus,
		Clock,
		Users,
		Award,
		LayoutGrid,
		List,
		ArrowRight
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let modoVisualizacao = $state<'grade' | 'lista'>('grade');

	const diasSemanaCatalogo = [
		'Segunda-feira',
		'Terça-feira',
		'Quarta-feira',
		'Quinta-feira',
		'Sexta-feira',
		'Sábado'
	];

	function turmaOcorreNoDia(diaTurma: string, diaCatalogo: string): boolean {
		const dTurmaNorm = diaTurma.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		const dCatNorm = diaCatalogo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		
		// Verifica se o dia é mencionado (ex: "Segunda", "Segunda e Quarta", etc)
		const termoCurto = dCatNorm.split('-')[0];
		return dTurmaNorm.includes(termoCurto);
	}
</script>

<svelte:head>
	<title>Turmas & Grade de Treinos - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8">
	<!-- ========================================================================= -->
	<!-- HEADER DA PÁGINA -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
					Gestão de Tatame
				</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
				Turmas & Treinos
			</h1>
			<p class="text-xs sm:text-sm text-zinc-400 mt-1">
				Grade semanal de horários, alocação de senseis e distribuição de judocas no tatame.
			</p>
		</div>

		<div class="flex items-center gap-3 shrink-0">
			<!-- Toggle de Visualização (Grade vs Lista) -->
			<div class="p-1 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center">
				<button
					type="button"
					onclick={() => (modoVisualizacao = 'grade')}
					class="p-2 rounded-lg text-xs font-medium transition-colors {modoVisualizacao === 'grade'
						? 'bg-zinc-900 text-white shadow-sm'
						: 'text-zinc-500 hover:text-zinc-300'}"
					title="Visualizar em Grade Semanal"
				>
					<LayoutGrid class="w-4 h-4" />
				</button>
				<button
					type="button"
					onclick={() => (modoVisualizacao = 'lista')}
					class="p-2 rounded-lg text-xs font-medium transition-colors {modoVisualizacao === 'lista'
						? 'bg-zinc-900 text-white shadow-sm'
						: 'text-zinc-500 hover:text-zinc-300'}"
					title="Visualizar em Lista"
				>
					<List class="w-4 h-4" />
				</button>
			</div>

			{#if data.podeGerenciar}
				<a
					href="/dashboard/turmas/nova"
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
				>
					<CalendarPlus class="w-4 h-4" />
					<span>Criar Nova Turma</span>
				</a>
			{/if}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- CONTEÚDO PRINCIPAL (GRADE SEMANAL OU LISTA) -->
	<!-- ========================================================================= -->
	{#if data.turmas.length > 0}
		{#if modoVisualizacao === 'grade'}
			<!-- VISUALIZAÇÃO EM GRADE SEMANAL / CALENDÁRIO -->
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
				{#each diasSemanaCatalogo as dia}
					{@const turmasDoDia = data.turmas.filter((t) => turmaOcorreNoDia(t.dia_semana, dia))}

					<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col">
						<div class="flex items-center justify-between pb-3 mb-4 border-b border-zinc-900">
							<span class="text-xs font-mono uppercase tracking-wider text-white font-bold">
								{dia}
							</span>
							<span class="text-[11px] font-mono text-zinc-500">
								{turmasDoDia.length} {turmasDoDia.length === 1 ? 'treino' : 'treinos'}
							</span>
						</div>

						{#if turmasDoDia.length > 0}
							<div class="space-y-3 flex-1">
								{#each turmasDoDia as turma}
									<a
										href="/dashboard/turmas/{turma.id_treino}"
										class="group block p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all"
									>
										<!-- Horário -->
										<div class="flex items-center justify-between text-xs mb-2">
											<div class="inline-flex items-center gap-1.5 font-mono text-red-400 font-semibold">
												<Clock class="w-3.5 h-3.5" />
												<span>{turma.horario_inicio} - {turma.horario_fim}</span>
											</div>
											<span class="text-[10px] font-mono text-zinc-500">
												#{turma.id_treino}
											</span>
										</div>

										<!-- Descrição da Turma -->
										<h4 class="text-sm font-bold text-white group-hover:text-red-300 transition-colors leading-tight mb-2">
											{turma.descricao}
										</h4>

										<!-- Senseis Alocados -->
										{#if turma.professores.length > 0}
											<div class="text-[11px] text-zinc-400 mb-3 flex items-center gap-1.5">
												<Award class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
												<span class="truncate">
													{turma.professores.map((p) => p.nome).join(', ')}
												</span>
											</div>
										{/if}

										<!-- Rodapé do Card com Ocupação -->
										<div class="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
											<div class="inline-flex items-center gap-1.5 text-zinc-400">
												<Users class="w-3.5 h-3.5 text-zinc-500" />
												<span class="font-mono">{turma.total_alunos} atletas</span>
											</div>
											<span class="text-[11px] text-zinc-500 group-hover:text-white transition-colors flex items-center gap-1">
												<span>Ver chamada</span>
												<ArrowRight class="w-3 h-3" />
											</span>
										</div>
									</a>
								{/each}
							</div>
						{:else}
							<div class="flex-1 flex items-center justify-center p-8 rounded-xl border border-dashed border-zinc-900 text-center">
								<span class="text-xs text-zinc-600 font-mono">Sem treinos programados</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<!-- VISUALIZAÇÃO EM LISTA DETALHADA -->
			<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
						<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
							<tr>
								<th class="px-6 py-4">Turma / Descrição</th>
								<th class="px-6 py-4">Dias da Semana</th>
								<th class="px-6 py-4">Horário de Tatame</th>
								<th class="px-6 py-4">Equipe Técnica (Senseis)</th>
								<th class="px-6 py-4">Judocas Matriculados</th>
								<th class="px-6 py-4 text-right">Ação</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-900">
							{#each data.turmas as turma}
								<tr class="hover:bg-zinc-900/30 transition-colors group">
									<td class="px-6 py-4 font-semibold text-white group-hover:text-red-400 transition-colors">
										{turma.descricao}
									</td>
									<td class="px-6 py-4 text-zinc-300 font-mono text-xs">
										{turma.dia_semana}
									</td>
									<td class="px-6 py-4 font-mono text-red-400 font-medium">
										{turma.horario_inicio} às {turma.horario_fim}
									</td>
									<td class="px-6 py-4 text-zinc-300">
										{#if turma.professores.length > 0}
											{turma.professores.map((p) => p.nome).join(', ')}
										{:else}
											<span class="text-zinc-600 italic">Sem professor alocado</span>
										{/if}
									</td>
									<td class="px-6 py-4 font-mono text-zinc-200">
										<span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs">
											{turma.total_alunos} atletas
										</span>
									</td>
									<td class="px-6 py-4 text-right">
										<a
											href="/dashboard/turmas/{turma.id_treino}"
											class="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white font-medium"
										>
											<span>{data.podeGerenciar ? 'Gerenciar' : 'Ver Detalhes'}</span>
											<ArrowRight class="w-3.5 h-3.5" />
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{:else}
		<div class="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
			<Calendar class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
			<h3 class="text-base font-bold text-white font-display">Nenhuma turma cadastrada</h3>
			<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
				Organize os horários de tatame do seu dojo, defina os dias de treino e distribua os judocas por turmas.
			</p>
			{#if data.podeGerenciar}
				<div class="mt-5">
					<a
						href="/dashboard/turmas/nova"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
					>
						<CalendarPlus class="w-3.5 h-3.5" />
						<span>Cadastrar Primeira Turma</span>
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
