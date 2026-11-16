<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		OPCOES_FAIXAS_CADASTRO,
		OPCOES_ORIGEM_REGISTRO_GRADUACAO,
		obterProximaFaixaCliente,
		type OrigemRegistroGraduacao
	} from '#lib/dominio/graduacao';
	import { obterIndiceFaixa } from '#lib/dominio/campeonato';
	import { extrairNumeroDan } from '#lib/dominio/ordenacao-atletas';
	import {
		Award,
		Calendar,
		User,
		ArrowLeft,
		ArrowRight,
		AlertCircle,
		CheckCircle2,
		ShieldCheck,
		History,
		Building2,
		Info
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let carregando = $state(false);
	let alunoIdSelecionado = $state<number | ''>('');
	let novaFaixaSelecionada = $state('Cinza');
	let origemRegistro = $state<OrigemRegistroGraduacao>('PROMOCAO_DIRETA');
	let idProfessorSelecionado = $state<string>('');
	let nomeExaminadorExterno = $state<string>('');
	let nomeEventoOrigem = $state<string>('Promoção Direta no Dojo');
	let associacaoTexto = $state<string>('FPJ / CBJ');

	const hojeData = new Date().toISOString().slice(0, 10);
	let dataGraduacao = $state<string>(hojeData);

	$effect(() => {
		if (data.alunoPreSelecionado && alunoIdSelecionado === '') {
			alunoIdSelecionado = data.alunoPreSelecionado;
		}
		if (
			data.modoPreSelecionado === 'HISTORICO_ANTERIOR' ||
			data.modoPreSelecionado === 'TRANSFERENCIA' ||
			data.modoPreSelecionado === 'PROMOCAO_DIRETA'
		) {
			origemRegistro = data.modoPreSelecionado;
		}
	});

	// Localiza o judoca selecionado para exibir sua faixa atual
	const judocaSelecionado = $derived(
		data.alunos.find((a) => a.id_usuario === Number(alunoIdSelecionado))
	);

	// Quando seleciona um judoca no modo Promoção Direta, sugere a próxima faixa automaticamente
	$effect(() => {
		if (judocaSelecionado && origemRegistro === 'PROMOCAO_DIRETA') {
			novaFaixaSelecionada = obterProximaFaixaCliente(judocaSelecionado.graduacao_atual);
		}
	});

	function selecionarOrigem(novaOrigem: OrigemRegistroGraduacao) {
		origemRegistro = novaOrigem;
		if (novaOrigem === 'PROMOCAO_DIRETA') {
			nomeEventoOrigem = 'Promoção Direta no Dojo';
			if (judocaSelecionado) {
				novaFaixaSelecionada = obterProximaFaixaCliente(judocaSelecionado.graduacao_atual);
			}
		} else if (novaOrigem === 'HISTORICO_ANTERIOR') {
			nomeEventoOrigem = 'Acervo Histórico (Pré-Sistema)';
			novaFaixaSelecionada = 'Branca';
		} else if (novaOrigem === 'TRANSFERENCIA') {
			nomeEventoOrigem = 'Transferência de Academia Anterior';
			idProfessorSelecionado = 'externo';
			novaFaixaSelecionada = 'Branca';
		}
	}

	// Verifica se a faixa que está sendo registrada é superior à faixa atual do judoca
	const vaiAtualizarFaixaAtual = $derived.by(() => {
		if (!judocaSelecionado) return true;
		if (origemRegistro === 'PROMOCAO_DIRETA') return true;
		const idxNova = obterIndiceFaixa(novaFaixaSelecionada);
		const idxAtual = obterIndiceFaixa(judocaSelecionado.graduacao_atual);
		if (idxNova !== idxAtual) return idxNova > idxAtual;
		return (
			extrairNumeroDan(novaFaixaSelecionada) >
			extrairNumeroDan(judocaSelecionado.graduacao_atual)
		);
	});
</script>

<svelte:head>
	<title>Promoção Direta & Registro Histórico - Judô Hinodê</title>
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
				Trilha de Graduações (Insert-Only)
			</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
			Promoção Direta ou Registro Histórico
		</h1>
		<p class="text-xs sm:text-sm text-zinc-400 mt-1">
			Registre promoções avulsas, histórico pré-sistema ou faixas trazidas de outras academias com
			datas controladas, <strong>sem criar eventos fantasmas</strong> no painel de exames.
		</p>
	</div>

	<!-- Alerta de Erro -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Falha no registro:</span>
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
		<input type="hidden" name="origemRegistro" value={origemRegistro} />

		<!-- 1. TIPO DE REGISTRO (PROMOÇÃO DIRETA vs HISTÓRICO PRÉ-SISTEMA vs TRANSFERÊNCIA) -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<History class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">1. Finalidade do Registro</h2>
					<p class="text-[11px] text-zinc-500">
						Escolha se é uma promoção atual no dojo ou lançamento de faixa anterior/transferência
					</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<button
					type="button"
					onclick={() => selecionarOrigem('PROMOCAO_DIRETA')}
					class="p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer {origemRegistro ===
					'PROMOCAO_DIRETA'
						? 'bg-red-950/30 border-red-600/80 text-white shadow-[0_0_15px_rgba(220,38,38,0.15)]'
						: 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}"
				>
					<div class="flex items-center justify-between">
						<Award
							class="w-4 h-4 {origemRegistro === 'PROMOCAO_DIRETA'
								? 'text-red-400'
								: 'text-zinc-500'}"
						/>
						{#if origemRegistro === 'PROMOCAO_DIRETA'}
							<span class="text-[10px] font-mono uppercase text-red-400 font-bold">Ativo</span>
						{/if}
					</div>
					<div>
						<div class="text-xs font-bold text-white">Promoção Direta</div>
						<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
							Promove o judoca hoje para uma nova faixa sem exigir evento agendado.
						</p>
					</div>
				</button>

				<button
					type="button"
					onclick={() => selecionarOrigem('HISTORICO_ANTERIOR')}
					class="p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer {origemRegistro ===
					'HISTORICO_ANTERIOR'
						? 'bg-amber-950/30 border-amber-600/80 text-white shadow-[0_0_15px_rgba(217,119,6,0.15)]'
						: 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}"
				>
					<div class="flex items-center justify-between">
						<History
							class="w-4 h-4 {origemRegistro === 'HISTORICO_ANTERIOR'
								? 'text-amber-400'
								: 'text-zinc-500'}"
						/>
						{#if origemRegistro === 'HISTORICO_ANTERIOR'}
							<span class="text-[10px] font-mono uppercase text-amber-400 font-bold">Ativo</span>
						{/if}
					</div>
					<div>
						<div class="text-xs font-bold text-white">Acervo Pré-Sistema</div>
						<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
							Importa faixas antigas conquistadas no dojo antes da criação do sistema.
						</p>
					</div>
				</button>

				<button
					type="button"
					onclick={() => selecionarOrigem('TRANSFERENCIA')}
					class="p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer {origemRegistro ===
					'TRANSFERENCIA'
						? 'bg-purple-950/30 border-purple-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.15)]'
						: 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}"
				>
					<div class="flex items-center justify-between">
						<Building2
							class="w-4 h-4 {origemRegistro === 'TRANSFERENCIA'
								? 'text-purple-400'
								: 'text-zinc-500'}"
						/>
						{#if origemRegistro === 'TRANSFERENCIA'}
							<span class="text-[10px] font-mono uppercase text-purple-400 font-bold">Ativo</span>
						{/if}
					</div>
					<div>
						<div class="text-xs font-bold text-white">Outra Academia</div>
						<p class="text-[11px] text-zinc-400 mt-0.5 leading-snug">
							Registra faixas anteriores de um judoca transferido de outro dojo.
						</p>
					</div>
				</button>
			</div>
		</div>

		<!-- 2. SELEÇÃO DO JUDOCA E COMPARATIVO DE FAIXA -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center justify-between gap-3 pb-4 border-b border-zinc-900 flex-wrap">
				<div class="flex items-center gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
					>
						<User class="w-4 h-4 text-red-500" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">2. Judoca & Graduação</h2>
						<p class="text-[11px] text-zinc-500">
							Selecione o atleta e a faixa que será registrada na linha do tempo
						</p>
					</div>
				</div>

				{#if judocaSelecionado}
					<a
						href="/dashboard/graduacoes/historico/{judocaSelecionado.id_usuario}"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
					>
						<History class="w-3.5 h-3.5 text-red-400" />
						<span>Ver Linha do Tempo Completa (Lote)</span>
					</a>
				{/if}
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
							{aluno.nome} (Atual: {aluno.graduacao_atual}) - {aluno.idade} anos
						</option>
					{/each}
				</select>
			</div>

			<!-- PAINEL COMPARATIVO DE PROMOÇÃO / REGISTRO -->
			<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
				<div class="flex items-center justify-between flex-wrap gap-2">
					<span class="text-[11px] font-mono uppercase text-zinc-500">
						{origemRegistro === 'PROMOCAO_DIRETA'
							? 'Progressão Técnica de Faixa:'
							: 'Impacto na Graduação Atual do Judoca:'}
					</span>

					{#if judocaSelecionado}
						{#if vaiAtualizarFaixaAtual}
							<span
								class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 border border-emerald-800/70 text-emerald-300"
							>
								Atualizará a faixa atual para {novaFaixaSelecionada}
							</span>
						{:else}
							<span
								class="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 border border-amber-800/70 text-amber-300"
							>
								Apenas histórico (mantém faixa atual {judocaSelecionado.graduacao_atual})
							</span>
						{/if}
					{/if}
				</div>

				<div class="flex flex-col sm:flex-row items-center justify-around gap-4">
					<!-- Faixa Atual -->
					<div class="flex flex-col items-center gap-1.5">
						<span class="text-[11px] font-mono text-zinc-400">Graduação Atual no Dojo</span>
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

					<!-- Faixa Registrada -->
					<div class="flex flex-col items-center gap-1.5">
						<span class="text-[11px] font-mono text-emerald-400 font-semibold">
							{origemRegistro === 'PROMOCAO_DIRETA' ? 'Nova Graduação' : 'Faixa a Registrar'}
						</span>
						<BadgeFaixa faixa={novaFaixaSelecionada} size="md" />
					</div>
				</div>
			</div>

			<div>
				<label for="novaFaixa" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
					Selecione a Faixa *
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

		<!-- 3. SENSEI EXAMINADOR & DATA CONTROLADA -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Calendar class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">
						3. Data Controlada & Origem da Homologação
					</h2>
					<p class="text-[11px] text-zinc-500">
						Informe a data exata em que a faixa foi conquistada para cálculo fiel de carências
					</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label
						for="idProfessorHomologador"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Sensei Avaliador *
					</label>
					<select
						id="idProfessorHomologador"
						name="idProfessorHomologador"
						bind:value={idProfessorSelecionado}
						required={origemRegistro === 'PROMOCAO_DIRETA'}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						<option value="">Selecione o Sensei do dojo...</option>
						{#each data.professores as prof}
							<option value={String(prof.id_usuario)}>
								{prof.nome} ({prof.grau_faixa || 'Sensei'})
							</option>
						{/each}
						{#if origemRegistro !== 'PROMOCAO_DIRETA'}
							<option value="externo">
								Sensei Externo / Outra Academia / Banca da Federação
							</option>
						{/if}
					</select>
				</div>

				<div>
					<label for="dataGraduacao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Data da Conquista da Faixa *
					</label>
					<input
						type="date"
						id="dataGraduacao"
						name="dataGraduacao"
						required
						bind:value={dataGraduacao}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				{#if idProfessorSelecionado === 'externo' || (origemRegistro !== 'PROMOCAO_DIRETA' && !idProfessorSelecionado)}
					<div class="sm:col-span-2">
						<label
							for="nomeExaminadorExterno"
							class="block text-xs font-mono uppercase text-amber-300 mb-1.5"
						>
							Nome do Sensei / Examinador de Origem *
						</label>
						<input
							type="text"
							id="nomeExaminadorExterno"
							name="nomeExaminadorExterno"
							bind:value={nomeExaminadorExterno}
							required={!idProfessorSelecionado || idProfessorSelecionado === 'externo'}
							placeholder="Ex: Sensei Yamamoto (Academia Kodokan SP) ou Banca Oficial FPJ"
							class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-amber-800/60 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
						/>
					</div>
				{/if}

				<div>
					<label for="associacao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Federação / Associação
					</label>
					<input
						type="text"
						id="associacao"
						name="associacao"
						bind:value={associacaoTexto}
						placeholder="Ex: FPJ / Federação Paulista de Judô"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="nomeEvento" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						{origemRegistro === 'TRANSFERENCIA'
							? 'Academia de Origem / Referência'
							: 'Descrição / Origem do Registro'}
					</label>
					<input
						type="text"
						id="nomeEvento"
						name="nomeEvento"
						bind:value={nomeEventoOrigem}
						placeholder={origemRegistro === 'TRANSFERENCIA'
							? 'Ex: Associação Bushido de Judô'
							: 'Ex: Acervo Histórico Hinodê'}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>

			<div
				class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 flex items-start gap-2.5"
			>
				<Info class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
				<p>
					Este lançamento grava diretamente na <strong>Linha do Tempo Imutável</strong> do judoca sem
					poluir a lista de Exames Agendados do Dojo. Para lançar várias faixas antigas de uma só vez,
					acesse o botão <strong>"Ver Linha do Tempo Completa (Lote)"</strong> acima.
				</p>
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
				class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50 cursor-pointer"
			>
				{#if carregando}
					<span
						class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
					></span>
					<span>Gravando no Histórico...</span>
				{:else}
					<CheckCircle2 class="w-4 h-4" />
					<span>
						{origemRegistro === 'PROMOCAO_DIRETA'
							? 'Homologar Promoção Direta'
							: 'Registrar no Histórico do Judoca'}
					</span>
				{/if}
			</button>
		</div>
	</form>
</div>
