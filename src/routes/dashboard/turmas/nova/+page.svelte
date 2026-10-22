<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Calendar,
		Clock,
		Award,
		ArrowLeft,
		AlertCircle,
		CheckCircle2
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let carregando = $state(false);

	const diasSemana = [
		'Segunda-feira',
		'Terça-feira',
		'Quarta-feira',
		'Quinta-feira',
		'Sexta-feira',
		'Sábado'
	];
</script>

<svelte:head>
	<title>Criar Nova Turma - Judô Hinodê</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/turmas"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Turmas & Treinos</span>
		</a>

		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
				Horários de Tatame
			</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
			Nova Turma de Judô
		</h1>
		<p class="text-xs sm:text-sm text-zinc-400 mt-1">
			Configure a descrição, os dias de treino, o horário de início/término e aloque a equipe de
			senseis responsáveis.
		</p>
	</div>

	<!-- Alerta de Erro -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Não foi possível criar a turma:</span>
				<p>{form.erro}</p>
			</div>
		</div>
	{/if}

	<!-- FORMULÁRIO -->
	<form
		method="POST"
		use:enhance={() => {
			carregando = true;
			return async ({ update }) => {
				await update();
				carregando = false;
			};
		}}
		class="space-y-6"
	>
		<!-- 1. IDENTIFICAÇÃO DA TURMA -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Calendar class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Identificação & Categoria</h2>
					<p class="text-[11px] text-zinc-500">Nome do treino e dias de aula</p>
				</div>
			</div>

			<div>
				<label for="descricao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
					Descrição da Turma / Faixa Etária *
				</label>
				<input
					type="text"
					id="descricao"
					name="descricao"
					required
					value={(form?.valores?.descricao as string) || ''}
					placeholder="Ex: Judô Infantil Sub-11 / Faixas Iniciais"
					class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
				/>
			</div>

			<div>
				<span class="block text-xs font-mono uppercase text-zinc-400 mb-2">
					Dias da Semana em que o Treino Ocorre *
				</span>
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
					{#each diasSemana as dia}
						<label
							class="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 cursor-pointer transition-colors"
						>
							<input
								type="checkbox"
								name="dias"
								value={dia}
								class="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-red-600"
							/>
							<span class="text-xs text-zinc-300 font-medium">{dia}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>

		<!-- 2. HORÁRIOS DE TATAME -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Clock class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Horários de Tatame</h2>
					<p class="text-[11px] text-zinc-500">Duração do treino na grade semanal</p>
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
						value={(form?.valores?.horarioInicio as string) || '18:30'}
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
						value={(form?.valores?.horarioFim as string) || '19:30'}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>
		</div>

		<!-- 3. EQUIPE TÉCNICA (SENSEIS RESPONSÁVEIS) -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Award class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Alocação de Professores</h2>
					<p class="text-[11px] text-zinc-500">
						Selecione ao menos um sensei federado para ministrar a aula
					</p>
				</div>
			</div>

			{#if data.professores.length > 0}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each data.professores as prof}
						<label
							class="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 cursor-pointer transition-colors"
						>
							<input
								type="checkbox"
								name="professoresIds"
								value={prof.id_usuario}
								class="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-red-600"
							/>
							<div class="min-w-0 flex-1">
								<span class="text-xs font-semibold text-white block leading-tight truncate">
									{prof.nome}
								</span>
								<span class="text-[11px] font-mono text-zinc-500 block">
									{prof.grau_faixa || 'Sensei'} • {prof.n_federacao || 'Federado'}
								</span>
							</div>
						</label>
					{/each}
				</div>
			{:else}
				<div class="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 text-xs text-amber-300">
					Nenhum professor federado cadastrado neste dojo ainda.
				</div>
			{/if}
		</div>

		<!-- AÇÕES -->
		<div class="flex items-center justify-end gap-4 pt-4 border-t border-zinc-900">
			<a
				href="/dashboard/turmas"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition-colors"
			>
				Cancelar
			</a>

			<button
				type="submit"
				disabled={carregando}
				class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50"
			>
				{#if carregando}
					<span
						class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
					></span>
					<span>Criando Turma...</span>
				{:else}
					<CheckCircle2 class="w-4 h-4" />
					<span>Criar Turma de Tatame</span>
				{/if}
			</button>
		</div>
	</form>
</div>
