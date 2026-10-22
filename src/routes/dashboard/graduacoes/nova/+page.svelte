<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import { OPCOES_FAIXAS_CADASTRO, LISTA_TODAS_FAIXAS_VALORES } from '#lib/dominio/graduacao';
	import {
		Award,
		Calendar,
		User,
		ArrowLeft,
		ArrowRight,
		AlertCircle,
		CheckCircle2,
		ShieldCheck
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let carregando = $state(false);
	let alunoIdSelecionado = $state<number | ''>('');
	let novaFaixaSelecionada = $state('Cinza');

	const faixasDisponiveis = LISTA_TODAS_FAIXAS_VALORES;

	// Localiza o judoca selecionado para exibir sua faixa atual
	const judocaSelecionado = $derived(
		data.alunos.find((a) => a.id_usuario === Number(alunoIdSelecionado))
	);

	const hojeData = new Date().toISOString().slice(0, 10);
</script>

<svelte:head>
	<title>Homologar Exame de Faixa - Judô Hinodê</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/graduacoes"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Graduações</span>
		</a>

		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
				Exame de Graduação
			</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
			Homologar Troca de Faixa
		</h1>
		<p class="text-xs sm:text-sm text-zinc-400 mt-1">
			Registro oficial de promoção técnica com inserção atômica e trilha imutável protegida no
			MySQL.
		</p>
	</div>

	<!-- Alerta de Erro -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Falha na homologação:</span>
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
		<!-- 1. SELEÇÃO DO JUDOCA E COMPARATIVO DE FAIXA -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<User class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Judoca Promovido</h2>
					<p class="text-[11px] text-zinc-500">Selecione o atleta que realizou o exame técnico</p>
				</div>
			</div>

			<div>
				<label for="idAluno" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
					Selecione o Atleta *
				</label>
				<select
					id="idAluno"
					name="idAluno"
					bind:value={alunoIdSelecionado}
					required
					class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
				>
					<option value="">Selecione um judoca do dojo...</option>
					{#each data.alunos as aluno}
						<option value={aluno.id_usuario}>
							{aluno.nome} ({aluno.graduacao_atual}) - {aluno.idade} anos
						</option>
					{/each}
				</select>
			</div>

			<!-- PAINEL COMPARATIVO DE PROMOÇÃO (FAIXA ATUAL -> NOVA FAIXA) -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
				<div class="text-[11px] font-mono uppercase text-zinc-500 mb-3 block">
					Progressão Técnica de Faixa:
				</div>

				<div class="flex flex-col sm:flex-row items-center justify-around gap-4">
					<!-- Faixa Atual -->
					<div class="flex flex-col items-center gap-1.5">
						<span class="text-[11px] font-mono text-zinc-400">Graduação Atual</span>
						{#if judocaSelecionado}
							<BadgeFaixa faixa={judocaSelecionado.graduacao_atual} size="md" />
						{:else}
							<span class="text-xs text-zinc-600 italic">Nenhum atleta selecionado</span>
						{/if}
					</div>

					<!-- Seta Indicativa -->
					<div class="text-red-500 rotate-90 sm:rotate-0">
						<ArrowRight class="w-5 h-5" />
					</div>

					<!-- Nova Faixa -->
					<div class="flex flex-col items-center gap-1.5">
						<span class="text-[11px] font-mono text-emerald-400 font-semibold">Nova Graduação</span>
						<BadgeFaixa faixa={novaFaixaSelecionada} size="md" />
					</div>
				</div>
			</div>

			<div>
				<label for="novaFaixa" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
					Selecione a Nova Faixa Homologada *
				</label>
				<select
					id="novaFaixa"
					name="novaFaixa"
					bind:value={novaFaixaSelecionada}
					required
					class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
				>
					{#each OPCOES_FAIXAS_CADASTRO as opt}
						<option value={opt.valor}>{opt.rotulo}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- 2. SENSEI EXAMINADOR & DADOS DO EXAME -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Award class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Dados da Homologação</h2>
					<p class="text-[11px] text-zinc-500">
						Sensei responsável pela avaliação e parâmetros da cerimônia
					</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label
						for="idProfessorHomologador"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Sensei Homologador *
					</label>
					<select
						id="idProfessorHomologador"
						name="idProfessorHomologador"
						required
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						<option value="">Selecione o Sensei avaliador...</option>
						{#each data.professores as prof}
							<option value={prof.id_usuario}>
								{prof.nome} ({prof.grau_faixa || 'Sensei'})
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="dataGraduacao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Data do Exame / Cerimônia *
					</label>
					<input
						type="date"
						id="dataGraduacao"
						name="dataGraduacao"
						required
						value={hojeData}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="associacao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Federação / Associação
					</label>
					<input
						type="text"
						id="associacao"
						name="associacao"
						value="FPJ / CBJ"
						placeholder="Ex: FPJ / Federação Paulista de Judô"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="nomeEvento" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Cerimônia / Evento de Exame
					</label>
					<input
						type="text"
						id="nomeEvento"
						name="nomeEvento"
						value="Cerimônia Oficial de Graduação"
						placeholder="Ex: Exame Semestral de Faixas"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>
		</div>

		<!-- AÇÕES -->
		<div class="flex items-center justify-end gap-4 pt-4 border-t border-zinc-900">
			<a
				href="/dashboard/graduacoes"
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
					<span>Gravando no Histórico...</span>
				{:else}
					<CheckCircle2 class="w-4 h-4" />
					<span>Homologar Graduação</span>
				{/if}
			</button>
		</div>
	</form>
</div>
