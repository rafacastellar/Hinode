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
		CheckCircle2
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let carregandoMatricula = $state(false);
	let alunoSelecionado = $state<number | ''>('');
</script>

<svelte:head>
	<title>{data.turma.descricao} - Detalhes da Turma</title>
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

		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-2 mb-1">
					<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
						Turma de Tatame #{data.turma.id_treino}
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-zinc-400 font-mono">{data.turma.dia_semana}</span>
				</div>
				<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					{data.turma.descricao}
				</h1>
			</div>

			<div class="flex items-center gap-2">
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
			</div>
		</div>

		<!-- Senseis Responsáveis -->
		{#if data.turma.professores.length > 0}
			<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
				<span class="font-mono uppercase text-zinc-500">Senseis:</span>
				{#each data.turma.professores as prof}
					<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-200">
						<Award class="w-3.5 h-3.5 text-amber-500" />
						<span>{prof.nome}</span>
						{#if prof.grau_faixa}
							<span class="text-zinc-500 font-mono">({prof.grau_faixa})</span>
						{/if}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- ALERTA DE ERRO -->
	{#if form?.erroMatricula}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
			<span>{form.erroMatricula}</span>
		</div>
	{/if}

	<!-- MATRICULAR NOVO ALUNO NA TURMA -->
	{#if data.alunosDisponiveis.length > 0}
		<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900">
			<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
				Matricular Judoca nesta Turma
			</h3>

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
				<select
					name="idAluno"
					bind:value={alunoSelecionado}
					required
					class="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
				>
					<option value="">Selecione um judoca do dojo para incluir na turma...</option>
					{#each data.alunosDisponiveis as aluno}
						<option value={aluno.id_usuario}>
							{aluno.nome} ({aluno.graduacao_atual}) - {aluno.idade} anos
						</option>
					{/each}
				</select>

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

	<!-- LISTA DE CHAMADA / ATLETAS MATRICULADOS -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
				Lista de Judocas Matriculados ({data.turma.alunos_matriculados.length})
			</h2>
		</div>

		{#if data.turma.alunos_matriculados.length > 0}
			<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
						<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
							<tr>
								<th class="px-6 py-4">Judoca</th>
								<th class="px-6 py-4">Graduação (Faixa)</th>
								<th class="px-6 py-4">Idade</th>
								<th class="px-6 py-4">Matrícula</th>
								<th class="px-6 py-4 text-right">Ação</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-900">
							{#each data.turma.alunos_matriculados as aluno}
								<tr class="hover:bg-zinc-900/30 transition-colors">
									<td class="px-6 py-4 font-semibold text-white">
										{aluno.nome}
									</td>
									<td class="px-6 py-4">
										<BadgeFaixa faixa={aluno.graduacao_atual} size="sm" />
									</td>
									<td class="px-6 py-4 font-mono text-zinc-300">
										{aluno.idade} anos
									</td>
									<td class="px-6 py-4 font-mono text-zinc-400">
										{aluno.matricula || '-'}
									</td>
									<td class="px-6 py-4 text-right">
										<form action="?/desmatricular" method="POST" use:enhance class="inline-block">
											<input type="hidden" name="idAluno" value={aluno.id_usuario} />
											<button
												type="submit"
												class="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
												title="Remover judoca desta turma"
											>
												<Trash2 class="w-4 h-4" />
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="p-10 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
				<Users class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
				<h4 class="text-sm font-bold text-white font-display">Nenhum judoca nesta turma</h4>
				<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
					Utilize o seletor acima para adicionar alunos matriculados no dojo a este horário de treino.
				</p>
			</div>
		{/if}
	</div>
</div>
