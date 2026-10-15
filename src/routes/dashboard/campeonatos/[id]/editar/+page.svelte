<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Trophy,
		Calendar,
		MapPin,
		ArrowLeft,
		AlertCircle,
		CheckCircle2,
		DollarSign,
		Sparkles,
		Save
	} from '@lucide/svelte';
	import { FAIXAS_JUDO_LISTA } from '#lib/dominio/campeonato';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let carregando = $state(false);

	let faixaInicio = $state('Branca');
	let faixaFim = $state('Preta');

	$effect(() => {
		faixaInicio = (form?.valores?.faixaInicio as string) || data.campeonato.faixa_inicio || 'Branca';
		faixaFim = (form?.valores?.faixaFim as string) || data.campeonato.faixa_fim || 'Preta';
	});

	const tiposCampeonato = [
		'Regional',
		'Estadual',
		'Nacional',
		'Interestadual',
		'Copa Interna / Amistoso',
		'Internacional'
	];

	function selecionarTodasFaixas() {
		faixaInicio = 'Branca';
		faixaFim = 'Preta';
	}
</script>

<svelte:head>
	<title>Editar Campeonato - {data.campeonato.nome}</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/campeonatos/{data.campeonato.id_evento}"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Detalhes do Campeonato</span>
		</a>

		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
				Edição de Campeonato
			</span>
			<span class="text-xs text-zinc-600">•</span>
			<span class="text-xs text-zinc-400 font-mono">Evento #{data.campeonato.id_evento}</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
			Alterar Dados da Competição
		</h1>
		<p class="text-xs sm:text-sm text-zinc-400 mt-1">
			Atualize as regras de participação, datas, faixas limites, idades, categoria ou endereço do evento.
		</p>
	</div>

	<!-- Alerta de Erro -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Falha ao salvar alterações:</span>
				<p>{form.erro}</p>
			</div>
		</div>
	{/if}

	<!-- FORMULÁRIO DE EDIÇÃO -->
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
					<p class="text-[11px] text-zinc-500">Nome, nível federativo, data e taxa de inscrição</p>
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
						value={(form?.valores?.nome as string) ?? data.campeonato.nome}
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
						value={(form?.valores?.edicao as string) ?? (data.campeonato.edicao || '')}
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
							<option
								value={tipo}
								selected={((form?.valores?.tipoCampeonato as string) ?? data.campeonato.tipo_campeonato) === tipo}
							>
								{tipo}
							</option>
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
						value={(form?.valores?.dataInicio as string) ?? (data.campeonato.data_inicio_iso || data.campeonato.data_inicio)}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<!-- Taxa de Inscrição -->
				<div>
					<label for="valorInscricao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Taxa de Inscrição (R$)
					</label>
					<div class="relative">
						<span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-mono text-zinc-500">
							R$
						</span>
						<input
							type="number"
							id="valorInscricao"
							name="valorInscricao"
							step="0.01"
							min="0"
							value={(form?.valores?.valorInscricao as string) ?? (data.campeonato.valor_inscricao !== null ? Number(data.campeonato.valor_inscricao).toFixed(2) : '0.00')}
							placeholder="0.00"
							class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						/>
					</div>
					<span class="text-[10px] text-zinc-500 mt-1 block">
						Valor padrão cobrado de cada judoca. Deixe 0.00 se for isento/gratuito.
					</span>
				</div>
			</div>
		</div>

		<!-- 2. REGRAS DE PARTICIPAÇÃO (GRADUAÇÃO, IDADE E CATEGORIA) -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center justify-between pb-4 border-b border-zinc-900">
				<div>
					<h2 class="text-sm font-bold text-white font-display">Regras de Elegibilidade dos Judocas</h2>
					<p class="text-[11px] text-zinc-500">Intervalo de faixas, limites de idade e divisão por categoria</p>
				</div>

				<button
					type="button"
					onclick={selecionarTodasFaixas}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
				>
					<Sparkles class="w-3.5 h-3.5 text-amber-400" />
					<span>Todas as Faixas</span>
				</button>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<!-- Faixa Limite Inicial -->
				<div>
					<label for="faixaInicio" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Faixa Limite Inicial (Mínima) *
					</label>
					<select
						id="faixaInicio"
						name="faixaInicio"
						bind:value={faixaInicio}
						required
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						{#each FAIXAS_JUDO_LISTA as f}
							<option value={f}>{f}</option>
						{/each}
					</select>
					<span class="text-[10px] text-zinc-500 mt-1 block">Graduação mínima para disputar o torneio.</span>
				</div>

				<!-- Faixa Limite Final -->
				<div>
					<label for="faixaFim" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Faixa Limite Final (Máxima) *
					</label>
					<select
						id="faixaFim"
						name="faixaFim"
						bind:value={faixaFim}
						required
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						{#each FAIXAS_JUDO_LISTA as f}
							<option value={f}>{f}</option>
						{/each}
					</select>
					<span class="text-[10px] text-zinc-500 mt-1 block">Graduação máxima para disputar o torneio.</span>
				</div>

				<!-- Idade Mínima -->
				<div>
					<label for="idadeMinima" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Idade Mínima (Opcional)
					</label>
					<input
						type="number"
						id="idadeMinima"
						name="idadeMinima"
						min="3"
						max="90"
						value={(form?.valores?.idadeMinima as string) ?? (data.campeonato.idade_minima !== null ? data.campeonato.idade_minima : '')}
						placeholder="Ex: 11"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
					<span class="text-[10px] text-zinc-500 mt-1 block">Deixe em branco se não houver limite mínimo.</span>
				</div>

				<!-- Idade Máxima -->
				<div>
					<label for="idadeMaxima" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Idade Máxima (Opcional)
					</label>
					<input
						type="number"
						id="idadeMaxima"
						name="idadeMaxima"
						min="3"
						max="90"
						value={(form?.valores?.idadeMaxima as string) ?? (data.campeonato.idade_maxima !== null ? data.campeonato.idade_maxima : '')}
						placeholder="Ex: 14 (Sub-15)"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
					<span class="text-[10px] text-zinc-500 mt-1 block">Deixe em branco se não houver limite máximo (adulto/livre).</span>
				</div>

				<!-- Categoria / Grupo -->
				<div class="sm:col-span-2">
					<label for="limiteGrupo" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Divisão de Categoria *
					</label>
					<select
						id="limiteGrupo"
						name="limiteGrupo"
						required
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						<option
							value="Todos"
							selected={((form?.valores?.limiteGrupo as string) ?? data.campeonato.limite_grupo) === 'Todos'}
						>
							Todos os Judocas (Especial e Aspirante)
						</option>
						<option
							value="Especial"
							selected={((form?.valores?.limiteGrupo as string) ?? data.campeonato.limite_grupo) === 'Especial'}
						>
							Apenas Divisão Especial
						</option>
						<option
							value="Aspirante"
							selected={((form?.valores?.limiteGrupo as string) ?? data.campeonato.limite_grupo) === 'Aspirante'}
						>
							Apenas Divisão Aspirante
						</option>
					</select>
					<span class="text-[10px] text-zinc-500 mt-1 block">
						Restringe a inscrição de atletas por grupo de competição da FPJ/CBJ.
					</span>
				</div>
			</div>
		</div>

		<!-- 3. LOCALIZAÇÃO DO GINÁSIO / TATAME -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<MapPin class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Local do Evento</h2>
					<p class="text-[11px] text-zinc-500">Ginásio, endereço e município de realização</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-6 gap-4">
				<div class="sm:col-span-2">
					<label for="cep" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						CEP *
					</label>
					<input
						type="text"
						id="cep"
						name="cep"
						required
						value={(form?.valores?.cep as string) ?? data.campeonato.cep}
						placeholder="00000-000"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div class="sm:col-span-4">
					<label for="logradouro" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Logradouro / Ginásio / Arena *
					</label>
					<input
						type="text"
						id="logradouro"
						name="logradouro"
						required
						value={(form?.valores?.logradouro as string) ?? data.campeonato.logradouro}
						placeholder="Ex: Ginásio do Ibirapuera, Rua Manuel da Nóbrega, 1361"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div class="sm:col-span-4">
					<label for="cidade" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Cidade *
					</label>
					<input
						type="text"
						id="cidade"
						name="cidade"
						required
						value={(form?.valores?.cidade as string) ?? data.campeonato.cidade}
						placeholder="Ex: São Paulo"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div class="sm:col-span-2">
					<label for="uf" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Estado (UF) *
					</label>
					<input
						type="text"
						id="uf"
						name="uf"
						required
						maxlength="2"
						value={(form?.valores?.uf as string) ?? data.campeonato.uf}
						placeholder="SP"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white uppercase font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>
		</div>

		<!-- BOTÕES DE AÇÃO -->
		<div class="flex items-center justify-end gap-3 pt-2">
			<a
				href="/dashboard/campeonatos/{data.campeonato.id_evento}"
				class="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-medium transition-all"
			>
				Cancelar
			</a>
			<button
				type="submit"
				disabled={carregando}
				class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50"
			>
				{#if carregando}
					<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
					<span>Salvando Alterações...</span>
				{:else}
					<Save class="w-4 h-4" />
					<span>Salvar Alterações do Campeonato</span>
				{/if}
			</button>
		</div>
	</form>
</div>
