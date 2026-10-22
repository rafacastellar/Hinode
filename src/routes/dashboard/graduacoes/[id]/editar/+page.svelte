<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Award,
		Calendar,
		MapPin,
		ArrowLeft,
		AlertCircle,
		CheckCircle2,
		Search,
		Loader2,
		Clock
	} from '@lucide/svelte';
	import { FAIXAS_GRADUACAO_LISTA } from '#lib/dominio/graduacao';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let carregando = $state(false);

	let faixaInicio = $state('Branca');
	let faixaFim = $state('Marrom');

	let cep = $state('');
	let logradouro = $state('');
	let numero = $state('');
	let complemento = $state('');
	let bairro = $state('');
	let cidade = $state('São Paulo');
	let uf = $state('SP');
	let buscandoCep = $state(false);
	let cepMensagem = $state('');

	$effect(() => {
		faixaInicio = (form?.valores?.faixaInicio as string) ?? data.evento.faixa_inicio ?? 'Branca';
		faixaFim = (form?.valores?.faixaFim as string) ?? data.evento.faixa_fim ?? 'Marrom';
		cep = String(form?.valores?.cep ?? data.evento.cep ?? '');
		logradouro = String(form?.valores?.logradouro ?? data.evento.logradouro ?? '');
		numero = String(form?.valores?.numero ?? data.evento.numero ?? '');
		complemento = String(form?.valores?.complemento ?? data.evento.complemento ?? '');
		bairro = String(form?.valores?.bairro ?? data.evento.bairro ?? '');
		cidade = String(form?.valores?.cidade ?? data.evento.cidade ?? 'São Paulo');
		uf = String(form?.valores?.uf ?? data.evento.uf ?? 'SP');
	});

	async function consultarCep() {
		const cepLimpo = cep.replace(/\D/g, '');
		if (cepLimpo.length !== 8) {
			cepMensagem = 'Informe um CEP válido com 8 dígitos';
			return;
		}
		buscandoCep = true;
		cepMensagem = '';
		try {
			const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
			const dados = await res.json();
			if (dados.erro) {
				cepMensagem = 'CEP não encontrado';
			} else {
				logradouro = dados.logradouro || '';
				bairro = dados.bairro || '';
				cidade = dados.localidade || '';
				uf = dados.uf || '';
			}
		} catch {
			cepMensagem = 'Falha ao buscar CEP. Preencha manualmente.';
		} finally {
			buscandoCep = false;
		}
	}

	function selecionarTodasFaixas() {
		faixaInicio = 'Branca';
		faixaFim = 'Preta';
	}

	function selecionarApenasKyu() {
		faixaInicio = 'Branca';
		faixaFim = 'Marrom';
	}
</script>

<svelte:head>
	<title>Editar Exame de Graduação - Judô Hinodê</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/graduacoes/{data.evento.id_evento}"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para o Exame</span>
		</a>

		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
				Gestão do Exame
			</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
			Editar Exame de Graduação
		</h1>
		<p class="text-xs sm:text-sm text-zinc-400 mt-1">
			Atualize os prazos de inscrição, data do exame, carências pedagógicas e local do tatame.
		</p>
	</div>

	<!-- ALERTA DE ERRO -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Falha ao atualizar evento de graduação:</span>
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
		<!-- 1. IDENTIFICAÇÃO DO EXAME -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 border-b border-zinc-900 pb-3">
				<Award class="w-4 h-4 text-red-500" />
				<h2 class="text-sm font-semibold text-white">Identificação da Cerimônia</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2 space-y-1.5">
					<label for="nome" class="block text-xs font-medium text-zinc-300">
						Nome do Exame / Cerimônia <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="nome"
						name="nome"
						required
						value={form?.valores?.nome ?? data.evento.nome}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="edicao" class="block text-xs font-medium text-zinc-300">
						Edição / Semestre
					</label>
					<input
						type="text"
						id="edicao"
						name="edicao"
						value={form?.valores?.edicao ?? data.evento.edicao ?? 'Edição 2026'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="tipoGraduacao" class="block text-xs font-medium text-zinc-300">
						Tipo de Cerimônia
					</label>
					<input
						type="text"
						id="tipoGraduacao"
						name="tipoGraduacao"
						value={form?.valores?.tipoGraduacao ?? data.evento.tipo_graduacao ?? 'Troca de Faixa Kyu/Dan'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
					/>
				</div>

				<div class="sm:col-span-2 space-y-1.5">
					<label for="dataInicio" class="block text-xs font-medium text-zinc-300">
						Data de Realização do Exame <span class="text-red-500">*</span>
					</label>
					<input
						type="date"
						id="dataInicio"
						name="dataInicio"
						required
						value={form?.valores?.dataInicio ?? data.evento.data_inicio_iso}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
					/>
				</div>
			</div>
		</div>

		<!-- 2. PERÍODO OFICIAL DE INSCRIÇÕES -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between border-b border-zinc-900 pb-3">
				<div class="flex items-center gap-2">
					<Calendar class="w-4 h-4 text-amber-500" />
					<h2 class="text-sm font-semibold text-white">Prazo de Inscrições dos Candidatos</h2>
				</div>
				<span class="text-[11px] font-mono text-amber-400">Bloqueio Automático</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="dataInicioInscricao" class="block text-xs font-medium text-zinc-300">
						Início das Inscrições
					</label>
					<input
						type="date"
						id="dataInicioInscricao"
						name="dataInicioInscricao"
						value={form?.valores?.dataInicioInscricao ?? data.evento.data_inicio_inscricao_iso ?? ''}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="dataFimInscricao" class="block text-xs font-medium text-zinc-300">
						Término das Inscrições
					</label>
					<input
						type="date"
						id="dataFimInscricao"
						name="dataFimInscricao"
						value={form?.valores?.dataFimInscricao ?? data.evento.data_fim_inscricao_iso ?? ''}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
					/>
				</div>
			</div>
		</div>

		<!-- 3. REGRAS PEDAGÓGICAS E CARÊNCIAS TEMPORAIS -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between border-b border-zinc-900 pb-3">
				<div class="flex items-center gap-2">
					<Clock class="w-4 h-4 text-blue-500" />
					<h2 class="text-sm font-semibold text-white">Critérios de Elegibilidade & Carências</h2>
				</div>
				<div class="flex items-center gap-1.5">
					<button
						type="button"
						onclick={selecionarApenasKyu}
						class="px-2 py-1 rounded text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
					>
						Apenas Kyu (Branca a Marrom)
					</button>
					<button
						type="button"
						onclick={selecionarTodasFaixas}
						class="px-2 py-1 rounded text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
					>
						Todas as Faixas
					</button>
				</div>
			</div>

			<!-- Intervalo de Faixas -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="faixaInicio" class="block text-xs font-medium text-zinc-300">
						Faixa Mínima Permitida
					</label>
					<select
						id="faixaInicio"
						name="faixaInicio"
						bind:value={faixaInicio}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
					>
						{#each FAIXAS_GRADUACAO_LISTA as faixa}
							<option value={faixa}>{faixa}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-1.5">
					<label for="faixaFim" class="block text-xs font-medium text-zinc-300">
						Faixa Máxima Permitida
					</label>
					<select
						id="faixaFim"
						name="faixaFim"
						bind:value={faixaFim}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
					>
						{#each FAIXAS_GRADUACAO_LISTA as faixa}
							<option value={faixa}>{faixa}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Carências em Meses -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
				<div class="space-y-1.5">
					<label for="tempoMinimoJudoMeses" class="block text-xs font-medium text-zinc-300">
						Carência no Judô (meses)
					</label>
					<input
						type="number"
						id="tempoMinimoJudoMeses"
						name="tempoMinimoJudoMeses"
						min="0"
						value={form?.valores?.tempoMinimoJudoMeses ?? data.evento.tempo_minimo_judo_meses}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
					/>
					<p class="text-[10px] text-zinc-500">Meses desde o início no esporte</p>
				</div>

				<div class="space-y-1.5">
					<label for="tempoMinimoUltimaGraduacaoMeses" class="block text-xs font-medium text-zinc-300">
						Tempo na Faixa Atual (meses)
					</label>
					<input
						type="number"
						id="tempoMinimoUltimaGraduacaoMeses"
						name="tempoMinimoUltimaGraduacaoMeses"
						min="0"
						value={form?.valores?.tempoMinimoUltimaGraduacaoMeses ?? data.evento.tempo_minimo_ultima_graduacao_meses}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
					/>
					<p class="text-[10px] text-zinc-500">Meses desde o último exame</p>
				</div>

				<div class="space-y-1.5">
					<label for="taxaGraduacao" class="block text-xs font-medium text-zinc-300">
						Taxa do Exame (R$)
					</label>
					<input
						type="number"
						step="0.01"
						id="taxaGraduacao"
						name="taxaGraduacao"
						min="0"
						value={form?.valores?.taxaGraduacao ?? data.evento.taxa_graduacao}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
					/>
					<p class="text-[10px] text-zinc-500">Certificado e faixa nova</p>
				</div>
			</div>
		</div>

		<!-- 4. ENDEREÇO DO EXAME (COM VIACEP AUTOMÁTICO) -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between border-b border-zinc-900 pb-3">
				<div class="flex items-center gap-2">
					<MapPin class="w-4 h-4 text-red-500" />
					<h2 class="text-sm font-semibold text-white">Local do Tatame e Endereço</h2>
				</div>
				<span class="text-[11px] font-mono text-zinc-500">Busca Automática por CEP</span>
			</div>

			<!-- Campo CEP com busca automática -->
			<div class="space-y-1.5">
				<label for="cep" class="block text-xs font-medium text-zinc-300">
					CEP
				</label>
				<div class="flex gap-2">
					<div class="relative flex-1">
						<input
							type="text"
							id="cep"
							name="cep"
							bind:value={cep}
							onblur={consultarCep}
							maxlength="9"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
						/>
					</div>
					<button
						type="button"
						onclick={consultarCep}
						disabled={buscandoCep}
						class="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
					>
						{#if buscandoCep}
							<Loader2 class="w-3.5 h-3.5 animate-spin" />
							<span>Buscando...</span>
						{:else}
							<Search class="w-3.5 h-3.5" />
							<span>Buscar CEP</span>
						{/if}
					</button>
				</div>
				{#if cepMensagem}
					<p class="text-[11px] {cepMensagem.includes('não') || cepMensagem.includes('Falha') ? 'text-red-400' : 'text-emerald-400'} font-mono">
						{cepMensagem}
					</p>
				{/if}
			</div>

			<!-- Logradouro e Número -->
			<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
				<div class="sm:col-span-3 space-y-1.5">
					<label for="logradouro" class="block text-xs font-medium text-zinc-300">
						Logradouro
					</label>
					<input
						type="text"
						id="logradouro"
						name="logradouro"
						bind:value={logradouro}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="numero" class="block text-xs font-medium text-zinc-300">
						Número
					</label>
					<input
						type="text"
						id="numero"
						name="numero"
						bind:value={numero}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
					/>
				</div>
			</div>

			<!-- Complemento e Bairro -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="complemento" class="block text-xs font-medium text-zinc-300">
						Complemento
					</label>
					<input
						type="text"
						id="complemento"
						name="complemento"
						bind:value={complemento}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="bairro" class="block text-xs font-medium text-zinc-300">
						Bairro
					</label>
					<input
						type="text"
						id="bairro"
						name="bairro"
						bind:value={bairro}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
					/>
				</div>
			</div>

			<!-- Cidade e UF -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div class="sm:col-span-2 space-y-1.5">
					<label for="cidade" class="block text-xs font-medium text-zinc-300">
						Cidade <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="cidade"
						name="cidade"
						required
						bind:value={cidade}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
					/>
				</div>

				<div class="space-y-1.5">
					<label for="uf" class="block text-xs font-medium text-zinc-300">
						UF <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="uf"
						name="uf"
						required
						maxlength="2"
						bind:value={uf}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors uppercase font-mono"
					/>
				</div>
			</div>
		</div>

		<!-- 5. REQUISITOS ADICIONAIS -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
			<label for="requisitos" class="block text-xs font-medium text-zinc-300">
				Requisitos Pedagógicos e Observações Técnicas
			</label>
			<textarea
				id="requisitos"
				name="requisitos"
				rows="3"
				class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
			>{form?.valores?.requisitos ?? data.evento.requisitos ?? ''}</textarea>
		</div>

		<!-- BOTÕES DE SUBMISSÃO -->
		<div class="flex items-center justify-end gap-3 pt-2">
			<a
				href="/dashboard/graduacoes/{data.evento.id_evento}"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm border border-zinc-800 transition-colors"
			>
				Cancelar
			</a>

			<button
				type="submit"
				disabled={carregando}
				class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50"
			>
				{#if carregando}
					<Loader2 class="w-4 h-4 animate-spin" />
					<span>Salvando Alterações...</span>
				{:else}
					<CheckCircle2 class="w-4 h-4" />
					<span>Salvar Alterações</span>
				{/if}
			</button>
		</div>
	</form>
</div>
