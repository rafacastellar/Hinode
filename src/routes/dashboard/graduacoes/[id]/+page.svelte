<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Award,
		Calendar,
		MapPin,
		ArrowLeft,
		CheckCircle2,
		AlertCircle,
		Clock,
		Users,
		Search,
		ShieldCheck,
		Edit3,
		Trash2,
		Check,
		X,
		FileText,
		CheckSquare,
		Square,
		Loader2,
		DollarSign,
		Sparkles,
		Printer
	} from '@lucide/svelte';
	import ModalImpressaoDocumento from '#lib/components/documentos/ModalImpressaoDocumento.svelte';
	import DocumentoGraduacaoImpressao from '#lib/components/documentos/DocumentoGraduacaoImpressao.svelte';
	import {
		formatarPeriodoInscricaoExame,
		obterStatusPeriodoInscricao,
		obterProximaFaixaCliente,
		formatarDataBr,
		FAIXAS_GRADUACAO_LISTA
	} from '#lib/dominio/graduacao';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let abaAtiva = $state<'candidatos' | 'tatame' | 'homologados'>('tatame');
	let termoBusca = $state('');
	let filtroElegibilidade = $state<'todos' | 'aptos' | 'inscritos' | 'inaptos'>('todos');
	let carregandoAcao = $state(false);

	// Estado para Impressão da Ficha da Banca
	let modalImpressaoAberto = $state(false);
	let filtroImpressaoStatus = $state<'todos' | 'confirmadas' | 'homologadas'>('todos');
	let ordenacaoImpressao = $state<'nome' | 'faixa'>('nome');

	// Estado para Homologação em Lote
	let senseiSelecionadoLote = $state<number>(0);
	let dataHomologacaoLote = $state<string>('');
	let associacaoLote = $state<string>('FPJ / Federação Paulista de Judô');
	let selecionadosLote = $state<Record<number, boolean>>({});
	let faixasPersonalizadas = $state<Record<number, string>>({});

	$effect(() => {
		if (!senseiSelecionadoLote && data.professores.length > 0) {
			senseiSelecionadoLote = data.professores[0].id_usuario;
		}
		if (!dataHomologacaoLote && data.evento?.data_inicio_iso) {
			dataHomologacaoLote = data.evento.data_inicio_iso;
		}
	});

	// Modal de exclusão do evento
	let modalExcluirAberto = $state(false);

	// Filtros de candidatos
	const candidatosFiltrados = $derived(
		data.candidatos.filter((cand) => {
			const busca = termoBusca.toLowerCase().trim();
			const bateNome =
				!busca ||
				cand.nome_aluno.toLowerCase().includes(busca) ||
				(cand.matricula_aluno && cand.matricula_aluno.toLowerCase().includes(busca)) ||
				cand.faixa_atual.toLowerCase().includes(busca);

			if (!bateNome) return false;

			if (filtroElegibilidade === 'aptos') return cand.elegivel;
			if (filtroElegibilidade === 'inaptos') return !cand.elegivel;
			if (filtroElegibilidade === 'inscritos') return cand.inscrito;

			return true;
		})
	);

	// Inscritos pendentes de homologação
	const inscritosPendentes = $derived(
		data.inscricoes.filter((insc) => !insc.homologado)
	);

	// Inscritos já homologados
	const inscritosHomologados = $derived(
		data.inscricoes.filter((insc) => insc.homologado)
	);

	// Total selecionados para homologação em lote
	const totalSelecionadosLote = $derived(
		Object.values(selecionadosLote).filter(Boolean).length
	);

	function alternarSelecaoTodosLote() {
		const todosMarcados =
			inscritosPendentes.length > 0 &&
			inscritosPendentes.every((item) => selecionadosLote[item.id_aluno]);

		const novoEstado: Record<number, boolean> = {};
		if (!todosMarcados) {
			inscritosPendentes.forEach((item) => {
				novoEstado[item.id_aluno] = true;
			});
		}
		selecionadosLote = novoEstado;
	}

	function alternarItemLote(idAluno: number) {
		selecionadosLote[idAluno] = !selecionadosLote[idAluno];
	}

	function obterNovaFaixaParaAluno(idAluno: number, faixaAtual: string): string {
		return faixasPersonalizadas[idAluno] || obterProximaFaixaCliente(faixaAtual);
	}

	function montarPayloadLote(): string {
		const lista = inscritosPendentes
			.filter((item) => selecionadosLote[item.id_aluno])
			.map((item) => ({
				idAluno: item.id_aluno,
				novaFaixa: obterNovaFaixaParaAluno(item.id_aluno, item.faixa_atual)
			}));
		return JSON.stringify(lista);
	}

	const statusInscricao = $derived(
		obterStatusPeriodoInscricao(
			data.evento.data_inicio_inscricao_iso,
			data.evento.data_fim_inscricao_iso
		)
	);
</script>

<svelte:head>
	<title>{data.evento.nome} - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<a
				href="/dashboard/graduacoes"
				class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-3 group"
			>
				<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
				<span>Voltar para Graduações</span>
			</a>

			<div class="flex items-center gap-2 mb-1 flex-wrap">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
					Exame de Graduação
				</span>
				<span class="text-xs text-zinc-600">•</span>
				<span class="text-xs font-mono text-zinc-400">{data.evento.edicao || 'Edição 2026'}</span>
				<span class="text-xs text-zinc-600">•</span>
				<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border {statusInscricao.classeCor}">
					{statusInscricao.rotulo}
				</span>
			</div>

			<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
				{data.evento.nome}
			</h1>

			<div class="flex items-center gap-4 text-xs text-zinc-400 mt-1.5 flex-wrap">
				<span class="inline-flex items-center gap-1.5 text-zinc-200">
					<Calendar class="w-4 h-4 text-red-500" />
					<strong class="font-mono">{data.evento.data_inicio}</strong>
				</span>
				<span class="text-zinc-600">•</span>
				<span class="inline-flex items-center gap-1.5">
					<MapPin class="w-4 h-4 text-zinc-500" />
					<span>
						{data.evento.logradouro}, {data.evento.numero}
						{#if data.evento.complemento} - {data.evento.complemento}{/if}
						• {data.evento.cidade} / {data.evento.uf}
					</span>
				</span>
			</div>
		</div>

		<div class="flex items-center gap-2.5 shrink-0 flex-wrap">
			<button
				type="button"
				onclick={() => (modalImpressaoAberto = true)}
				class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-semibold text-xs sm:text-sm shadow-sm hover:border-zinc-500 cursor-pointer active:scale-95 transition-all"
				title="Imprimir ficha de avaliação da banca examinadora"
			>
				<Printer class="w-4 h-4 text-red-500" />
				<span>Imprimir Ficha da Banca</span>
			</button>

			{#if data.podeGerenciar}
				<a
					href="/dashboard/graduacoes/{data.evento.id_evento}/editar"
					class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium text-xs sm:text-sm transition-colors"
				>
					<Edit3 class="w-4 h-4 text-zinc-400" />
					<span>Editar Exame</span>
				</a>

				<button
					type="button"
					onclick={() => (modalExcluirAberto = true)}
					class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/50 font-medium text-xs sm:text-sm transition-colors"
					title="Excluir evento"
				>
					<Trash2 class="w-4 h-4" />
				</button>
			{/if}
		</div>
	</div>

	<!-- ALERTAS DE MENSAGEM / FEEDBACK -->
	{#if form?.sucesso && form?.mensagem}
		<div
			class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs sm:text-sm flex items-start gap-3"
		>
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Operação realizada com sucesso!</span>
				<p>{form.mensagem}</p>
			</div>
		</div>
	{/if}

	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Não foi possível concluir a ação:</span>
				<p>{form.erro}</p>
			</div>
		</div>
	{/if}

	<!-- CARDS DE REGRAS E ESTATÍSTICAS DO EXAME -->
	<div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
		<!-- Intervalo de Faixas -->
		<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1">
			<span class="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
				Intervalo de Faixas
			</span>
			<span class="text-sm sm:text-base font-extrabold text-white font-mono block">
				{data.evento.faixa_inicio} ➔ {data.evento.faixa_fim}
			</span>
			<span class="text-[11px] text-zinc-400 block font-mono">
				Público do exame
			</span>
		</div>

		<!-- Carência no Judô -->
		<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1">
			<span class="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
				Carência no Judô
			</span>
			<span class="text-sm sm:text-base font-extrabold text-amber-400 font-mono block">
				{data.evento.tempo_minimo_judo_meses > 0 ? `${data.evento.tempo_minimo_judo_meses} meses` : 'Livre'}
			</span>
			<span class="text-[11px] text-zinc-400 block font-mono">
				Tempo desde o início
			</span>
		</div>

		<!-- Carência na Faixa Atual -->
		<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1">
			<span class="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
				Permanência na Faixa
			</span>
			<span class="text-sm sm:text-base font-extrabold text-blue-400 font-mono block">
				{data.evento.tempo_minimo_ultima_graduacao_meses > 0 ? `${data.evento.tempo_minimo_ultima_graduacao_meses} meses` : 'Livre'}
			</span>
			<span class="text-[11px] text-zinc-400 block font-mono">
				Última graduação
			</span>
		</div>

		<!-- Taxa -->
		<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1">
			<span class="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
				Taxa do Exame
			</span>
			<span class="text-sm sm:text-base font-extrabold text-emerald-400 font-mono block">
				{data.evento.taxa_graduacao > 0 ? `R$ ${data.evento.taxa_graduacao.toFixed(2).replace('.', ',')}` : 'Isento'}
			</span>
			<span class="text-[11px] text-zinc-400 block font-mono">
				Certificado & Faixa
			</span>
		</div>

		<!-- Inscritos e Homologados -->
		<div class="col-span-2 sm:col-span-2 lg:col-span-1 p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1">
			<span class="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
				Inscrições & Homologação
			</span>
			<div class="flex items-center gap-2">
				<span class="text-sm sm:text-base font-extrabold text-white font-mono">
					{data.inscricoes.length} inscritos
				</span>
				<span class="text-zinc-600">•</span>
				<span class="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
					{inscritosHomologados.length} aprovados
				</span>
			</div>
			<span class="text-[11px] text-zinc-400 block font-mono">
				{inscritosPendentes.length} no tatame
			</span>
		</div>
	</div>

	<!-- TAB NAVIGATION -->
	<div class="border-b border-zinc-900 flex items-center gap-2 sm:gap-6 overflow-x-auto">
		<button
			type="button"
			onclick={() => (abaAtiva = 'tatame')}
			class="pb-3 px-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 {abaAtiva === 'tatame' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
		>
			<Award class="w-4 h-4 text-red-500" />
			<span>Tatame & Banca Examinadora</span>
			<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-900/60">
				{inscritosPendentes.length}
			</span>
		</button>

		<button
			type="button"
			onclick={() => (abaAtiva = 'candidatos')}
			class="pb-3 px-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 {abaAtiva === 'candidatos' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
		>
			<Users class="w-4 h-4 text-zinc-400" />
			<span>Candidatos & Aptidão do Dojo</span>
			<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
				{data.candidatos.length}
			</span>
		</button>

		<button
			type="button"
			onclick={() => (abaAtiva = 'homologados')}
			class="pb-3 px-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 {abaAtiva === 'homologados' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'}"
		>
			<ShieldCheck class="w-4 h-4 text-emerald-400" />
			<span>Graduados Oficiais na Cerimônia</span>
			<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-900/60">
				{inscritosHomologados.length}
			</span>
		</button>
	</div>

	<!-- CONTEÚDO DAS ABAS -->

	<!-- ============================================================== -->
	<!-- ABA 1: TATAME & BANCA EXAMINADORA (HOMOLOGAÇÃO OFICIAL)        -->
	<!-- ============================================================== -->
	{#if abaAtiva === 'tatame'}
		<div class="space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
						<span>Banca Examinadora do Tatame</span>
					</h2>
					<p class="text-xs text-zinc-400 mt-0.5">
						Avalie o desempenho técnico dos judocas inscritos e homologue a nova graduação de forma individual ou em lote.
					</p>
				</div>
			</div>

			<!-- PAINEL DE HOMOLOGAÇÃO EM LOTE -->
			{#if data.podeGerenciar && inscritosPendentes.length > 0}
				<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
						<div class="flex items-center gap-2">
							<Sparkles class="w-4 h-4 text-amber-400" />
							<h3 class="text-xs uppercase font-mono font-bold tracking-wider text-white">
								Homologação em Lote de Aprovados
							</h3>
						</div>
						<div class="text-xs text-zinc-400 font-mono">
							<strong class="text-white">{totalSelecionadosLote}</strong> de {inscritosPendentes.length} candidatos selecionados
						</div>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="space-y-1">
							<label for="senseiLote" class="block text-xs font-medium text-zinc-300">
								Sensei Examinador <span class="text-red-500">*</span>
							</label>
							<select
								id="senseiLote"
								bind:value={senseiSelecionadoLote}
								class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
							>
								{#each data.professores as prof}
									<option value={prof.id_usuario}>
										{prof.nome} {prof.grau_faixa ? `(${prof.grau_faixa})` : ''}
									</option>
								{/each}
							</select>
						</div>

						<div class="space-y-1">
							<label for="dataLote" class="block text-xs font-medium text-zinc-300">
								Data do Exame <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="dataLote"
								bind:value={dataHomologacaoLote}
								class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
							/>
						</div>

						<div class="space-y-1">
							<label for="assocLote" class="block text-xs font-medium text-zinc-300">
								Federação / Associação
							</label>
							<input
								type="text"
								id="assocLote"
								bind:value={associacaoLote}
								placeholder="FPJ / Federação Paulista de Judô"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
							/>
						</div>
					</div>

					<div class="flex items-center justify-between pt-2 flex-wrap gap-3">
						<button
							type="button"
							onclick={alternarSelecaoTodosLote}
							class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
						>
							{#if inscritosPendentes.every((item) => selecionadosLote[item.id_aluno])}
								<CheckSquare class="w-4 h-4 text-red-500" />
								<span>Desmarcar todos</span>
							{:else}
								<Square class="w-4 h-4 text-zinc-500" />
								<span>Selecionar todos os pendentes</span>
							{/if}
						</button>

						<form
							method="POST"
							action="?/homologarLote"
							use:enhance={() => {
								carregandoAcao = true;
								return async ({ update }) => {
									await update();
									carregandoAcao = false;
									selecionadosLote = {};
								};
							}}
						>
							<input type="hidden" name="idProfessorHomologador" value={senseiSelecionadoLote} />
							<input type="hidden" name="dataGraduacao" value={dataHomologacaoLote} />
							<input type="hidden" name="associacao" value={associacaoLote} />
							<input type="hidden" name="aprovadosJson" value={montarPayloadLote()} />

							<button
								type="submit"
								disabled={totalSelecionadosLote === 0 || carregandoAcao}
								class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{#if carregandoAcao}
									<Loader2 class="w-4 h-4 animate-spin" />
									<span>Gravando Histórico Imutável...</span>
								{:else}
									<Award class="w-4 h-4" />
									<span>Homologar {totalSelecionadosLote} {totalSelecionadosLote === 1 ? 'Aprovado' : 'Aprovados'}</span>
								{/if}
							</button>
						</form>
					</div>
				</div>
			{/if}

			<!-- LISTA DE INSCRITOS NO TATAME -->
			{#if inscritosPendentes.length > 0}
				<div class="space-y-3">
					{#each inscritosPendentes as cand}
						{@const novaFaixa = obterNovaFaixaParaAluno(cand.id_aluno, cand.faixa_atual)}
						<div
							class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
						>
							<div class="flex items-center gap-3 min-w-0">
								{#if data.podeGerenciar}
									<button
										type="button"
										onclick={() => alternarItemLote(cand.id_aluno)}
										class="p-1 rounded text-zinc-500 hover:text-white transition-colors shrink-0"
									>
										{#if selecionadosLote[cand.id_aluno]}
											<CheckSquare class="w-5 h-5 text-red-500" />
										{:else}
											<Square class="w-5 h-5" />
										{/if}
									</button>
								{/if}

								<div class="min-w-0">
									<div class="flex items-center gap-2 flex-wrap">
										<span class="font-bold text-white text-sm sm:text-base">
											{cand.nome_aluno}
										</span>
										{#if cand.matricula_aluno}
											<span class="text-[11px] font-mono text-zinc-500">
												#{cand.matricula_aluno}
											</span>
										{/if}
									</div>

									<div class="flex items-center gap-3 text-xs mt-1 flex-wrap">
										<div class="flex items-center gap-1.5">
											<span class="text-zinc-500 text-[11px]">Atual:</span>
											<BadgeFaixa faixa={cand.faixa_atual} size="sm" />
										</div>
										<span class="text-zinc-600">➔</span>
										<div class="flex items-center gap-1.5">
											<span class="text-zinc-500 text-[11px]">Nova:</span>
											{#if data.podeGerenciar}
												<select
													bind:value={faixasPersonalizadas[cand.id_aluno]}
													class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-red-500"
												>
													{#each FAIXAS_GRADUACAO_LISTA as f}
														<option value={f} selected={f === novaFaixa}>{f}</option>
													{/each}
												</select>
											{:else}
												<BadgeFaixa faixa={novaFaixa} size="sm" />
											{/if}
										</div>
									</div>
								</div>
							</div>

							<!-- Ação Individual -->
							{#if data.podeGerenciar}
								<div class="flex items-center gap-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-zinc-900">
									<!-- Cancelar Inscrição -->
									<form
										method="POST"
										action="?/cancelarInscricao"
										use:enhance={() => {
											carregandoAcao = true;
											return async ({ update }) => {
												await update();
												carregandoAcao = false;
											};
										}}
									>
										<input type="hidden" name="idAluno" value={cand.id_aluno} />
										<button
											type="submit"
											class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 text-xs border border-zinc-800 transition-colors"
											title="Remover atleta do exame"
										>
											Remover
										</button>
									</form>

									<!-- Homologar Individualmente -->
									<form
										method="POST"
										action="?/homologarIndividual"
										use:enhance={() => {
											carregandoAcao = true;
											return async ({ update }) => {
												await update();
												carregandoAcao = false;
											};
										}}
									>
										<input type="hidden" name="idAluno" value={cand.id_aluno} />
										<input type="hidden" name="novaFaixa" value={novaFaixa} />
										<input type="hidden" name="idProfessorHomologador" value={senseiSelecionadoLote} />
										<input type="hidden" name="dataGraduacao" value={dataHomologacaoLote} />
										<input type="hidden" name="associacao" value={associacaoLote} />

										<button
											type="submit"
											class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
										>
											<Check class="w-3.5 h-3.5" />
											<span>Aprovar & Homologar</span>
										</button>
									</form>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-8 rounded-2xl bg-zinc-950 border border-zinc-900 text-center space-y-3">
					<Award class="w-8 h-8 text-zinc-600 mx-auto" />
					<h3 class="text-sm font-bold text-white">Nenhum judoca aguardando avaliação no tatame</h3>
					<p class="text-xs text-zinc-400 max-w-md mx-auto">
						{#if data.inscricoes.length > 0}
							Todos os judocas inscritos neste exame já foram avaliados e homologados com sucesso!
						{:else}
							Acesse a aba <strong>Candidatos & Aptidão do Dojo</strong> para inscrever atletas aptos neste exame.
						{/if}
					</p>
					{#if data.inscricoes.length === 0}
						<button
							type="button"
							onclick={() => (abaAtiva = 'candidatos')}
							class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs border border-zinc-800 transition-colors mt-2"
						>
							<Users class="w-3.5 h-3.5" />
							<span>Ver Candidatos Aptos</span>
						</button>
					{/if}
				</div>
			{/if}
		</div>

	<!-- ============================================================== -->
	<!-- ABA 2: CANDIDATOS & APTIDÃO DO DOJO                            -->
	<!-- ============================================================== -->
	{:else if abaAtiva === 'candidatos'}
		<div class="space-y-4">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 class="text-base sm:text-lg font-bold text-white">Candidatos e Elegibilidade no Dojo</h2>
					<p class="text-xs text-zinc-400 mt-0.5">
						O sistema calcula automaticamente a carência no esporte e na faixa atual de todos os judocas do dojo.
					</p>
				</div>
			</div>

			<!-- Barra de Busca e Filtros de Aptidão -->
			<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
				<div class="relative flex-1">
					<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						bind:value={termoBusca}
						placeholder="Buscar judoca por nome, matrícula ou graduação..."
						class="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
					/>
				</div>

				<div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
					<button
						type="button"
						onclick={() => (filtroElegibilidade = 'todos')}
						class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {filtroElegibilidade === 'todos' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}"
					>
						Todos ({data.candidatos.length})
					</button>

					<button
						type="button"
						onclick={() => (filtroElegibilidade = 'aptos')}
						class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {filtroElegibilidade === 'aptos' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60' : 'text-zinc-400 hover:text-white'}"
					>
						Aptos ({data.candidatos.filter((c) => c.elegivel).length})
					</button>

					<button
						type="button"
						onclick={() => (filtroElegibilidade = 'inscritos')}
						class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {filtroElegibilidade === 'inscritos' ? 'bg-blue-950/60 text-blue-300 border border-blue-900/60' : 'text-zinc-400 hover:text-white'}"
					>
						Inscritos ({data.candidatos.filter((c) => c.inscrito).length})
					</button>

					<button
						type="button"
						onclick={() => (filtroElegibilidade = 'inaptos')}
						class="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors {filtroElegibilidade === 'inaptos' ? 'bg-red-950/60 text-red-300 border border-red-900/60' : 'text-zinc-400 hover:text-white'}"
					>
						Inaptos ({data.candidatos.filter((c) => !c.elegivel).length})
					</button>
				</div>
			</div>

			<!-- Tabela de Candidatos -->
			<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
						<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
							<tr>
								<th class="px-5 py-3.5">Judoca</th>
								<th class="px-5 py-3.5">Faixa Atual</th>
								<th class="px-5 py-3.5">Próxima Sugerida</th>
								<th class="px-5 py-3.5">Carência no Judô</th>
								<th class="px-5 py-3.5">Tempo na Faixa</th>
								<th class="px-5 py-3.5">Status / Elegibilidade</th>
								<th class="px-5 py-3.5 text-right">Inscrição</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-900">
							{#each candidatosFiltrados as cand}
								<tr class="hover:bg-zinc-900/30 transition-colors">
									<td class="px-5 py-3.5">
										<div class="font-semibold text-white">
											{cand.nome_aluno}
										</div>
										{#if cand.matricula_aluno}
											<div class="text-[11px] font-mono text-zinc-500">
												Matrícula: {cand.matricula_aluno}
											</div>
										{/if}
									</td>

									<td class="px-5 py-3.5">
										<BadgeFaixa faixa={cand.faixa_atual} size="sm" />
									</td>

									<td class="px-5 py-3.5">
										<BadgeFaixa faixa={cand.proxima_faixa_sugerida} size="sm" />
									</td>

									<td class="px-5 py-3.5 font-mono text-zinc-300">
										<span class="block">{cand.meses_judo} {cand.meses_judo === 1 ? 'mês' : 'meses'}</span>
										{#if cand.data_inicio_judo_br}
											<span class="text-[10px] text-zinc-500 block">Desde {cand.data_inicio_judo_br}</span>
										{/if}
									</td>

									<td class="px-5 py-3.5 font-mono text-zinc-300">
										<span class="block">{cand.meses_ultima_graduacao} {cand.meses_ultima_graduacao === 1 ? 'mês' : 'meses'}</span>
										{#if cand.data_ultima_graduacao_br}
											<span class="text-[10px] text-zinc-500 block">Graduado em {cand.data_ultima_graduacao_br}</span>
										{/if}
									</td>

									<td class="px-5 py-3.5">
										{#if cand.homologado}
											<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
												<CheckCircle2 class="w-3 h-3" />
												<span>Homologado ({cand.faixa_graduacao_evento})</span>
											</span>
										{:else if cand.inscrito}
											<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-blue-950/60 text-blue-300 border border-blue-800/60">
												<Award class="w-3 h-3" />
												<span>Inscrito no Tatame</span>
											</span>
										{:else if cand.elegivel}
											<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
												<Check class="w-3 h-3" />
												<span>Apto para Exame</span>
											</span>
										{:else}
											<div class="space-y-0.5">
												<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-950/40 text-red-400 border border-red-800/50">
													<X class="w-2.5 h-2.5" />
													<span>Inapto</span>
												</span>
												{#if cand.motivo_inaptidao}
													<p class="text-[10px] text-zinc-500 max-w-xs leading-tight">
														{cand.motivo_inaptidao}
													</p>
												{/if}
											</div>
										{/if}
									</td>

									<td class="px-5 py-3.5 text-right">
										{#if cand.homologado}
											<span class="text-xs font-mono text-zinc-500">Concluído</span>
										{:else if cand.inscrito}
											{#if data.podeGerenciar}
												<form
													method="POST"
													action="?/cancelarInscricao"
													use:enhance={() => {
														carregandoAcao = true;
														return async ({ update }) => {
															await update();
															carregandoAcao = false;
														};
													}}
												>
													<input type="hidden" name="idAluno" value={cand.id_aluno} />
													<button
														type="submit"
														class="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 text-xs border border-zinc-800 transition-colors"
													>
														Cancelar
													</button>
												</form>
											{:else}
												<span class="text-xs text-blue-400 font-mono">Inscrito</span>
											{/if}
										{:else if cand.elegivel}
											{#if data.podeGerenciar}
												<form
													method="POST"
													action="?/inscrever"
													use:enhance={() => {
														carregandoAcao = true;
														return async ({ update }) => {
															await update();
															carregandoAcao = false;
														};
													}}
												>
													<input type="hidden" name="idAluno" value={cand.id_aluno} />
													<input type="hidden" name="valor" value={data.evento.taxa_graduacao} />
													<button
														type="submit"
														class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-all"
													>
														Inscrever
													</button>
												</form>
											{:else}
												<span class="text-xs text-emerald-400 font-mono">Apto</span>
											{/if}
										{:else}
											<span class="text-xs text-zinc-600 font-mono">—</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

	<!-- ============================================================== -->
	<!-- ABA 3: GRADUADOS OFICIAIS NA CERIMÔNIA                         -->
	<!-- ============================================================== -->
	{:else if abaAtiva === 'homologados'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
						<ShieldCheck class="w-5 h-5 text-emerald-400" />
						<span>Graduações Homologadas nesta Cerimônia ({inscritosHomologados.length})</span>
					</h2>
					<p class="text-xs text-zinc-400 mt-0.5">
						Registros imutáveis (Insert-Only) protegidos por trigger no banco de dados com auditoria LGPD.
					</p>
				</div>
			</div>

			{#if inscritosHomologados.length > 0}
				<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
							<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
								<tr>
									<th class="px-6 py-4">Judoca Promovido</th>
									<th class="px-6 py-4">Nova Graduação</th>
									<th class="px-6 py-4">Data da Homologação</th>
									<th class="px-6 py-4">Sensei Examinador</th>
									<th class="px-6 py-4">Status</th>
									<th class="px-6 py-4 text-right">Trilha Oficial</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900">
								{#each inscritosHomologados as item}
									<tr class="hover:bg-zinc-900/30 transition-colors">
										<td class="px-6 py-4">
											<div class="font-semibold text-white">
												{item.nome_aluno}
											</div>
											{#if item.matricula_aluno}
												<div class="text-[11px] font-mono text-zinc-500">
													Matrícula: {item.matricula_aluno}
												</div>
											{/if}
										</td>

										<td class="px-6 py-4">
											<BadgeFaixa faixa={item.nova_faixa_homologada || item.faixa_atual} size="sm" />
										</td>

										<td class="px-6 py-4 font-mono text-zinc-300">
											{item.data_graduacao || data.evento.data_inicio}
										</td>

										<td class="px-6 py-4 text-zinc-300">
											{item.nome_professor_homologador || 'Sensei Responsável'}
										</td>

										<td class="px-6 py-4">
											<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
												<ShieldCheck class="w-3 h-3" />
												<span>Homologado Oficial</span>
											</span>
										</td>

										<td class="px-6 py-4 text-right">
											<a
												href="/dashboard/graduacoes/historico/{item.id_aluno}"
												class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-mono transition-colors"
											>
												<FileText class="w-3.5 h-3.5" />
												<span>Ver Trilha</span>
											</a>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else}
				<div class="p-8 rounded-2xl bg-zinc-950 border border-zinc-900 text-center space-y-3">
					<ShieldCheck class="w-8 h-8 text-zinc-600 mx-auto" />
					<h3 class="text-sm font-bold text-white">Nenhum judoca homologado ainda nesta cerimônia</h3>
					<p class="text-xs text-zinc-400 max-w-md mx-auto">
						No dia do exame, acesse a aba <strong>Tatame & Banca Examinadora</strong> para aprovar e homologar os judocas que realizaram a avaliação com sucesso.
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- MODAL DE EXCLUSÃO DE CERIMÔNIA -->
{#if modalExcluirAberto}
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
			<div class="flex items-center gap-3 text-red-500">
				<AlertCircle class="w-6 h-6 shrink-0" />
				<h3 class="text-base font-bold text-white">Excluir Evento de Graduação</h3>
			</div>

			<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
				Tem certeza de que deseja excluir permanentemente o exame <strong>{data.evento.nome}</strong>?
				Caso existam graduações já homologadas nesta cerimônia, a exclusão será bloqueada para preservar o histórico imutável.
			</p>

			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					onclick={() => (modalExcluirAberto = false)}
					class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
				>
					Voltar
				</button>

				<form method="POST" action="?/excluirEvento">
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
					>
						Confirmar Exclusão
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL DE IMPRESSÃO DA FICHA DA BANCA -->
{#snippet controlesGraduacao()}
	<div class="flex items-center gap-2">
		<select
			bind:value={filtroImpressaoStatus}
			class="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
			title="Filtrar candidatos por status"
		>
			<option value="todos">Todos os Inscritos</option>
			<option value="confirmadas">Apenas Confirmados</option>
			<option value="homologadas">Apenas Promovidos</option>
		</select>

		<select
			bind:value={ordenacaoImpressao}
			class="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
			title="Critério de ordenação da folha"
		>
			<option value="nome">Ordem: Nome (A-Z)</option>
			<option value="faixa">Ordem: Faixa Atual</option>
		</select>
	</div>
{/snippet}

<ModalImpressaoDocumento
	aberto={modalImpressaoAberto}
	titulo="Ficha da Banca - {data.evento.nome}"
	subtitulo="Documento oficial para avaliação e anotações técnicas do exame"
	onfechar={() => (modalImpressaoAberto = false)}
	controles={controlesGraduacao}
>
	<DocumentoGraduacaoImpressao
		evento={data.evento}
		inscricoes={data.inscricoes}
		professores={data.professores}
		filtroStatus={filtroImpressaoStatus}
		criterioOrdenacao={ordenacaoImpressao}
	/>
</ModalImpressaoDocumento>
