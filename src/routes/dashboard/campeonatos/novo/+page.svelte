<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Trophy,
		Calendar,
		MapPin,
		ArrowLeft,
		AlertCircle,
		CheckCircle2
	} from '@lucide/svelte';

	let { form }: { form: ActionData } = $props();

	let carregando = $state(false);

	const tiposCampeonato = [
		'Regional',
		'Estadual',
		'Nacional',
		'Interestadual',
		'Copa Interna / Amistoso',
		'Internacional'
	];
</script>

<svelte:head>
	<title>Cadastrar Campeonato - Judô Hinodê</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/campeonatos"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Campeonatos</span>
		</a>

		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
				Calendário Esportivo
			</span>
			<span class="text-xs text-zinc-600">•</span>
			<span class="text-xs text-zinc-400 font-mono">Fase 7</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
			Novo Campeonato
		</h1>
		<p class="text-xs sm:text-sm text-zinc-400 mt-1">
			Agende uma competição oficial, configure limites de graduação e prepare as inscrições dos
			judocas do dojo.
		</p>
	</div>

	<!-- Alerta de Erro -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Falha ao salvar campeonato:</span>
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
		<!-- 1. IDENTIFICAÇÃO DO TORNEIO -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Trophy class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Dados da Competição</h2>
					<p class="text-[11px] text-zinc-500">Nome, chancela federativa e tipo de torneio</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label for="nome" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Nome Oficial da Competição *
					</label>
					<input
						type="text"
						id="nome"
						name="nome"
						required
						value={(form?.valores?.nome as string) || ''}
						placeholder="Ex: Copa São Paulo de Judô / Campeonato Paulista"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="edicao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Edição / Ano
					</label>
					<input
						type="text"
						id="edicao"
						name="edicao"
						value={(form?.valores?.edicao as string) || 'Edição 2026'}
						placeholder="Ex: 24ª Edição / 2026"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="tipoCampeonato" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Nível do Campeonato *
					</label>
					<select
						id="tipoCampeonato"
						name="tipoCampeonato"
						required
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						{#each tiposCampeonato as tipo}
							<option value={tipo}>{tipo}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="dataInicio" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Data do Torneio (Lutas) *
					</label>
					<input
						type="date"
						id="dataInicio"
						name="dataInicio"
						required
						value={(form?.valores?.dataInicio as string) || ''}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="limiteGraduacao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Limites de Faixa / Categorias
					</label>
					<input
						type="text"
						id="limiteGraduacao"
						name="limiteGraduacao"
						value={(form?.valores?.limiteGraduacao as string) || ''}
						placeholder="Ex: Sub-18 / Adulto (Faixas Amarela a Preta)"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>
		</div>

		<!-- 2. LOCAL E ENDEREÇO DA COMPETIÇÃO -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<MapPin class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Local de Realização</h2>
					<p class="text-[11px] text-zinc-500">Ginásio, cidade e estado do evento</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label for="logradouro" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Ginásio / Complexo Esportivo
					</label>
					<input
						type="text"
						id="logradouro"
						name="logradouro"
						value={(form?.valores?.logradouro as string) || ''}
						placeholder="Ex: Ginásio Poliesportivo do Ibirapuera"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="cidade" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Cidade *
					</label>
					<input
						type="text"
						id="cidade"
						name="cidade"
						required
						value={(form?.valores?.cidade as string) || 'São Paulo'}
						placeholder="Ex: São Paulo"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="uf" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Estado (UF) *
					</label>
					<input
						type="text"
						id="uf"
						name="uf"
						required
						maxlength="2"
						value={(form?.valores?.uf as string) || 'SP'}
						placeholder="SP"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono uppercase placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>
		</div>

		<!-- AÇÕES -->
		<div class="flex items-center justify-end gap-4 pt-4 border-t border-zinc-900">
			<a
				href="/dashboard/campeonatos"
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
					<span>Agendando Torneio...</span>
				{:else}
					<CheckCircle2 class="w-4 h-4" />
					<span>Confirmar Campeonato</span>
				{/if}
			</button>
		</div>
	</form>
</div>
