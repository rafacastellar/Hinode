<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import TermometroElegibilidade from '#lib/components/ui/TermometroElegibilidade.svelte';
	import CalendarioTatameMensal from '#lib/components/ui/CalendarioTatameMensal.svelte';
	import {
		Award,
		User,
		ArrowLeft,
		Save,
		HeartHandshake,
		Calendar,
		Phone,
		Mail,
		CheckCircle2,
		AlertTriangle,
		ExternalLink,
		FileText,
		Check,
		Info,
		Flame,
		Clock,
		XCircle,
		AlertCircle,
		PenLine,
		Filter
	} from '@lucide/svelte';
	import { obterClassificacaoJudo } from '#lib/dominio/regras-categoria-peso';
	import {
		OPCOES_FAIXAS_CADASTRO,
		LISTA_TODAS_FAIXAS_VALORES,
		normalizarFaixaParaCadastro
	} from '#lib/dominio/graduacao';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const aluno = $derived(data.aluno);

	// Campos editáveis de Judô / Tatame
	let matricula = $state('');
	let peso = $state('');
	let categoria = $state('');
	let nFederacao = $state('');
	let statusFederacao = $state('Ativo');
	let dataInicio = $state('');
	let dataPrimeiraGraduacao = $state('');
	let graduacaoSelecionada = $state('Branca');
	let grupoEspecialAspirante = $state('');
	let idProfessorResponsavel = $state<number | ''>('');
	let categoriaEditadaManualmente = $state(false);

	// Motor de Regras Oficiais CBJ/FPJ (Reativo)
	const classificacaoOficial = $derived.by(() => {
		return obterClassificacaoJudo({
			dataNascimento: aluno.data_nascimento,
			genero: aluno.genero,
			peso: peso,
			graduacao: graduacaoSelecionada
		});
	});

	function aplicarClassificacaoOficial() {
		if (!classificacaoOficial) return;
		categoriaEditadaManualmente = false;
		if (
			classificacaoOficial.categoriaCompleta &&
			!classificacaoOficial.categoriaCompleta.includes('Informe o peso')
		) {
			categoria = classificacaoOficial.categoriaCompleta;
		}
		grupoEspecialAspirante = classificacaoOficial.divisao;
	}

	$effect(() => {
		matricula = data.aluno.matricula || '';
		peso = data.aluno.peso !== null ? String(data.aluno.peso) : '';
		categoria = data.aluno.categoria || '';
		nFederacao = data.aluno.n_federacao || '';
		statusFederacao = data.aluno.status_federacao || 'Ativo';
		dataInicio = data.aluno.data_inicio || '';
		dataPrimeiraGraduacao = data.aluno.data_primeira_graduacao || '';
		graduacaoSelecionada = normalizarFaixaParaCadastro(data.aluno.graduacao_atual) || 'Branca';
		grupoEspecialAspirante = data.aluno.grupo_especial_aspirante || '';
		idProfessorResponsavel = data.aluno.id_professor_responsavel || '';
	});

	// Restauração de valores caso action retorne erro
	$effect(() => {
		if (form?.valores) {
			if (form.valores.matricula !== undefined) matricula = form.valores.matricula as string;
			if (form.valores.peso !== undefined) peso = String(form.valores.peso || '');
			if (form.valores.categoria !== undefined) categoria = form.valores.categoria as string;
			if (form.valores.nFederacao !== undefined) nFederacao = form.valores.nFederacao as string;
			if (form.valores.statusFederacao !== undefined)
				statusFederacao = form.valores.statusFederacao as string;
			if (form.valores.dataInicio !== undefined) dataInicio = form.valores.dataInicio as string;
			if (form.valores.dataPrimeiraGraduacao !== undefined)
				dataPrimeiraGraduacao = form.valores.dataPrimeiraGraduacao as string;
			if (form.valores.graduacaoAtual !== undefined)
				graduacaoSelecionada = form.valores.graduacaoAtual as string;
			if (form.valores.grupoEspecialAspirante !== undefined)
				grupoEspecialAspirante = form.valores.grupoEspecialAspirante as string;
			if (form.valores.idProfessorResponsavel !== undefined)
				idProfessorResponsavel = Number(form.valores.idProfessorResponsavel);
		}
	});

	const faixasDisponiveis = LISTA_TODAS_FAIXAS_VALORES;

	// Aba ativa: 'ficha' (Ficha Técnica) ou 'presenca' (Tatame & Presença)
	let abaAtiva = $state<'ficha' | 'presenca'>('ficha');

	// Estados para filtro e lançamento/retificação de presença pelo Sensei/Gestor
	const hojeIso = new Date().toISOString().slice(0, 10);
	let filtroStatusPresenca = $state<'Todos' | 'Presente' | 'Falta' | 'Justificada'>('Todos');
	let filtroIdTreino = $state<number | 'Todos'>('Todos');
	let buscaPresenca = $state('');

	let mostrarFormLancamento = $state(false);
	let formDataTreino = $state(hojeIso);
	let formIdTreino = $state<number | ''>('');
	let formStatusPresenca = $state<'Presente' | 'Falta' | 'Justificada'>('Presente');
	let formObservacaoPresenca = $state('');

	$effect(() => {
		if (data.turmasMatriculadas && data.turmasMatriculadas.length > 0 && formIdTreino === '') {
			formIdTreino = data.turmasMatriculadas[0].id_treino;
		}
	});

	$effect(() => {
		if ((form as any)?.sucessoPresenca || (form as any)?.erroPresenca) {
			abaAtiva = 'presenca';
			if ((form as any)?.sucessoPresenca) {
				mostrarFormLancamento = false;
				formObservacaoPresenca = '';
			}
		}
	});

	function abrirEdicaoPresenca(reg: {
		id_treino: number;
		data_treino: string;
		status_presenca: 'Presente' | 'Falta' | 'Justificada';
		observacao: string | null;
	}) {
		formIdTreino = reg.id_treino;
		formDataTreino = reg.data_treino;
		formStatusPresenca = reg.status_presenca;
		formObservacaoPresenca = reg.observacao || '';
		mostrarFormLancamento = true;
	}

	const presencasFiltradas = $derived.by(() => {
		const lista = data.presencas || [];
		return lista.filter((p) => {
			if (filtroStatusPresenca !== 'Todos' && p.status_presenca !== filtroStatusPresenca) {
				return false;
			}
			if (filtroIdTreino !== 'Todos' && p.id_treino !== filtroIdTreino) {
				return false;
			}
			if (buscaPresenca.trim() !== '') {
				const q = buscaPresenca.toLowerCase();
				const bateTurma = p.descricao_turma.toLowerCase().includes(q);
				const bateData = p.data_treino.includes(q);
				const bateObs = (p.observacao || '').toLowerCase().includes(q);
				if (!bateTurma && !bateData && !bateObs) return false;
			}
			return true;
		});
	});
</script>

<svelte:head>
	<title>{aluno.nome} - Ficha do Judoca - Judô Hinodê</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<!-- ========================================================================= -->
	<!-- HEADER E NAVEGAÇÃO -->
	<!-- ========================================================================= -->
	<div>
		<a
			href="/dashboard/alunos"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
			<span>Voltar para Lista de Judocas</span>
		</a>

		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<div class="flex items-center gap-2 mb-1 flex-wrap">
					<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
						Ficha Técnica do Judoca
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-zinc-400 font-mono">ID #{aluno.id_usuario}</span>
					{#if aluno.status_federacao}
						<span
							class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase {aluno.status_federacao ===
							'Ativo'
								? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400'
								: 'bg-zinc-800 text-zinc-400'}"
						>
							Federação: {aluno.status_federacao}
						</span>
					{/if}
					{#if aluno.grupo_especial_aspirante}
						<span
							class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-950/60 border border-purple-800 text-purple-300"
						>
							{aluno.grupo_especial_aspirante}
						</span>
					{/if}
					{#if !data.podeEditar}
						<span
							class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950/60 border border-amber-800 text-amber-300"
						>
							Modo Consulta
						</span>
					{/if}
				</div>
				<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					{aluno.nome}
				</h1>
				<p class="text-xs sm:text-sm text-zinc-400 mt-1">
					Gerenciamento de graduação esportiva, registros federativos e professor responsável.
				</p>
			</div>

			<div class="flex items-center gap-3 flex-wrap">
				<BadgeFaixa faixa={aluno.graduacao_atual} size="lg" />
				<a
					href="/dashboard/graduacoes/historico/{aluno.id_usuario}"
					class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-amber-300 transition-colors"
					title="Consultar e registrar linha do tempo de graduações (inclusive histórico anterior ou de outra academia)"
				>
					<Award class="w-3.5 h-3.5 text-amber-400" />
					<span>Histórico de Faixas</span>
				</a>
				{#if data.podeGerenciarUsuario}
					<a
						href="/dashboard/usuarios/{aluno.id_usuario}"
						class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors"
						title="Editar perfil pessoal, endereço e dados de responsável"
					>
						<ExternalLink class="w-3.5 h-3.5 text-zinc-400" />
						<span>Perfil de Usuário</span>
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Termômetro de Elegibilidade Pedagógica para Próxima Faixa -->
	<TermometroElegibilidade
		faixaAtual={aluno.graduacao_atual}
		dataInicioOuUltimaGraduacao={data.dataUltimaGraduacaoIso || aluno.data_primeira_graduacao || aluno.data_inicio}
	/>

	<!-- ========================================================================= -->
	<!-- NOTIFICAÇÕES DE FEEDBACK -->
	<!-- ========================================================================= -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-start gap-3 text-red-300 text-xs sm:text-sm animate-in fade-in"
		>
			<AlertTriangle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
			<div>
				<span class="font-bold block text-red-200">Não foi possível salvar as alterações</span>
				{form.erro}
			</div>
		</div>
	{/if}

	{#if form?.sucesso}
		<div
			class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start gap-3 text-emerald-300 text-xs sm:text-sm animate-in fade-in"
		>
			<CheckCircle2 class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
			<div>
				<span class="font-bold block text-emerald-200">Dados atualizados com sucesso!</span>
				{form.mensagem}
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- RESUMO CADASTRAL DO ATLETA (VINCULADO AO USUÁRIO) -->
	<!-- ========================================================================= -->
	<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
		<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
			<div class="flex items-center gap-2.5">
				<User class="w-4 h-4 text-red-500" />
				<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
					Dados Cadastrais & Responsabilidade
				</h2>
			</div>
			{#if data.podeGerenciarUsuario}
				<a
					href="/dashboard/usuarios/{aluno.id_usuario}"
					class="text-[11px] text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1 transition-colors"
				>
					<span>Editar cadastro completo / Endereço</span>
					<ExternalLink class="w-3 h-3" />
				</a>
			{/if}
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
			<div>
				<span class="text-zinc-500 font-mono uppercase text-[10px] block">CPF</span>
				<span class="text-zinc-200 font-mono font-medium">{aluno.cpf}</span>
			</div>
			<div>
				<span class="text-zinc-500 font-mono uppercase text-[10px] block">Nascimento & Idade</span>
				<div class="flex items-center gap-1.5 mt-0.5">
					<span class="text-zinc-200 font-mono">{aluno.data_nascimento}</span>
					<span class="text-zinc-400 font-mono">({aluno.idade} anos)</span>
					{#if aluno.menor_idade}
						<span
							class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950/60 border border-amber-800 text-amber-300"
						>
							Menor
						</span>
					{/if}
				</div>
			</div>
			<div>
				<span class="text-zinc-500 font-mono uppercase text-[10px] block">E-mail</span>
				<span class="text-zinc-200 truncate block">{aluno.email}</span>
			</div>
			<div>
				<span class="text-zinc-500 font-mono uppercase text-[10px] block">Telefone</span>
				<span class="text-zinc-200 font-mono">{aluno.telefone || 'Não informado'}</span>
			</div>
		</div>

		{#if aluno.responsaveis && aluno.responsaveis.length > 0}
			<div class="pt-3 border-t border-zinc-900 space-y-2">
				<span class="text-zinc-500 font-mono text-[11px] block">
					Responsáveis Legais Vinculados ({aluno.responsaveis.length}):
				</span>
				<div class="flex flex-wrap gap-2">
					{#each aluno.responsaveis as r}
						<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
							<HeartHandshake class="w-3.5 h-3.5 text-amber-400 shrink-0" />
							<span class="text-zinc-200 font-medium">{r.nome}</span>
							<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
								{r.grau_parentesco}
							</span>
							{#if r.financeiro}
								<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-800 text-emerald-400">
									Financeiro
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else if aluno.nome_responsavel}
			<div class="pt-3 border-t border-zinc-900 flex items-center gap-3 text-xs">
				<HeartHandshake class="w-4 h-4 text-amber-400 shrink-0" />
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-zinc-500 font-mono text-[11px]">Responsável Legal Vinculado:</span>
					<span class="text-zinc-200 font-medium">{aluno.nome_responsavel}</span>
					{#if aluno.parentesco_responsavel}
						<span class="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400">
							{aluno.parentesco_responsavel}
						</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- ========================================================================= -->
	<!-- NAVEGAÇÃO DE ABAS: FICHA TÉCNICA vs TATAME & PRESENÇA                     -->
	<!-- ========================================================================= -->
	<div class="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
		<button
			type="button"
			onclick={() => (abaAtiva = 'ficha')}
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer {abaAtiva === 'ficha'
				? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
				: 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}"
		>
			<Award class="w-4 h-4" />
			<span>Ficha Técnica & Cadastro</span>
		</button>

		<button
			type="button"
			onclick={() => (abaAtiva = 'presenca')}
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer {abaAtiva === 'presenca'
				? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
				: 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}"
		>
			<Calendar class="w-4 h-4" />
			<span>Tatame & Presença</span>
			{#if data.metricasPresenca}
				<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-950/60 text-emerald-400 border border-emerald-500/30">
					{data.metricasPresenca.percentual_presenca}% ({data.metricasPresenca.total_presentes} aulas)
				</span>
			{/if}
		</button>
	</div>

	{#if abaAtiva === 'ficha'}
	<!-- ========================================================================= -->
	<!-- FORMULÁRIO DE EDIÇÃO TÉCNICA E ESPORTIVA DO JUDOCA -->
	<!-- ========================================================================= -->
	<form method="POST" action="?/atualizarDados" class="space-y-6">
		<fieldset disabled={!data.podeEditar} class="space-y-6 border-0 p-0 m-0 min-w-0 disabled:opacity-85">
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Award class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Dados Técnicos do Judô</h2>
					<p class="text-[11px] text-zinc-500">
						Faixa atual, Sensei técnico e dados de competição/federação
					</p>
				</div>
			</div>

			<!-- 1ª Linha: Sensei Técnico Responsável -->
			<div>
				<label
					for="idProfessorResponsavel"
					class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
				>
					Sensei Técnico Responsável *
				</label>
				<select
					id="idProfessorResponsavel"
					name="idProfessorResponsavel"
					bind:value={idProfessorResponsavel}
					required
					class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
				>
					<option value="">Selecione o Sensei...</option>
					{#each data.professores as prof}
						<option value={prof.id_usuario}>
							{prof.nome} ({prof.grau_faixa || 'Sensei'})
						</option>
					{/each}
				</select>
			</div>

			<!-- 2ª Linha: Seletor de Faixa & Visualização com Legenda Oficial -->
			<div>
				<label for="graduacaoAtual" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
					Graduação Atual (Faixa & Dan) *
				</label>
				<div class="flex flex-col sm:flex-row sm:items-center gap-3.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
					<select
						id="graduacaoAtual"
						name="graduacaoAtual"
						bind:value={graduacaoSelecionada}
						required
						class="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						{#each OPCOES_FAIXAS_CADASTRO as opt}
							<option value={opt.valor}>{opt.rotulo}</option>
						{/each}
						{#if graduacaoSelecionada && !LISTA_TODAS_FAIXAS_VALORES.includes(graduacaoSelecionada)}
							<option value={graduacaoSelecionada}>{graduacaoSelecionada} (Atual)</option>
						{/if}
					</select>
					<div class="shrink-0 flex justify-center sm:justify-start">
						<BadgeFaixa faixa={graduacaoSelecionada} size="md" showLegend={true} />
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

				<!-- Matrícula -->
				<div>
					<label for="matricula" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Matrícula no Dojo
					</label>
					<input
						type="text"
						id="matricula"
						name="matricula"
						bind:value={matricula}
						placeholder="Ex: HIN-2026-0042"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<!-- Peso -->
				<div>
					<label for="peso" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Peso Atual (kg)
					</label>
					<input
						type="number"
						step="0.1"
						id="peso"
						name="peso"
						bind:value={peso}
						placeholder="Ex: 73.5"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<!-- Categoria -->
				<div>
					<div class="flex items-center justify-between mb-1.5">
						<label for="categoria" class="block text-xs font-mono uppercase text-zinc-400">
							Categoria de Peso / Idade
						</label>
						{#if classificacaoOficial && !categoriaEditadaManualmente && categoria}
							<span class="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
								<Check class="w-3 h-3" /> CBJ Oficial
							</span>
						{:else if categoriaEditadaManualmente}
							<span class="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
								Customizado
							</span>
						{/if}
					</div>
					<input
						type="text"
						id="categoria"
						name="categoria"
						bind:value={categoria}
						oninput={() => {
							categoriaEditadaManualmente = true;
						}}
						placeholder="Ex: Meio-Médio (-81kg) / Sub-21"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<!-- Card Dinâmico de Classificação CBJ / FPJ -->
				{#if classificacaoOficial}
					<div class="col-span-1 sm:col-span-2 p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
						<div class="space-y-1">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/30">
									Classificação Oficial CBJ
								</span>
								<span class="text-xs font-semibold text-white">
									{classificacaoOficial.classeNome} ({aluno.genero === 'F' ? 'Feminino' : 'Masculino'})
								</span>
							</div>
							<div class="text-xs text-zinc-300 flex items-center gap-2 flex-wrap">
								<span>Categoria: <strong class="text-amber-300">{classificacaoOficial.categoriaCompleta}</strong></span>
								<span class="text-zinc-600">•</span>
								<span>Divisão Regulamentar: <strong class="text-emerald-400">{classificacaoOficial.divisao}</strong></span>
							</div>
							{#if classificacaoOficial.mensagensAviso.length > 0}
								<p class="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
									<Info class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
									<span>{classificacaoOficial.mensagensAviso[0]}</span>
								</p>
							{/if}
						</div>
						<button
							type="button"
							onclick={aplicarClassificacaoOficial}
							class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-xs font-medium text-red-300 hover:text-white transition-colors self-start sm:self-center flex items-center gap-1.5 shrink-0"
							title="Preencher automaticamente com a categoria e divisão oficial da CBJ"
						>
							<Check class="w-3.5 h-3.5 text-red-400" />
							<span>Aplicar Regra Oficial</span>
						</button>
					</div>
				{/if}

				<!-- Nº Federação -->
				<div>
					<label for="nFederacao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Nº de Registro Federativo (FPJ/CBJ)
					</label>
					<input
						type="text"
						id="nFederacao"
						name="nFederacao"
						bind:value={nFederacao}
						placeholder="Ex: FPJ-94821"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<!-- Status Federação -->
				<div>
					<label
						for="statusFederacao"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Status na Federação
					</label>
					<select
						id="statusFederacao"
						name="statusFederacao"
						bind:value={statusFederacao}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						<option value="Ativo">Ativo</option>
						<option value="Inativo">Inativo</option>
						<option value="Pendente">Pendente</option>
					</select>
				</div>

				<!-- Grupo Competitivo -->
				<div>
					<label
						for="grupoEspecialAspirante"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Grupo Competitivo
					</label>
					<select
						id="grupoEspecialAspirante"
						name="grupoEspecialAspirante"
						bind:value={grupoEspecialAspirante}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						<option value="">Não classificado / Tradicional</option>
						<option value="Aspirante">Aspirante</option>
						<option value="Especial">Especial</option>
					</select>
				</div>

				<!-- Data de Início no Tatame -->
				<div>
					<label for="dataInicio" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Data de Início no Tatame
					</label>
					<input
						type="date"
						id="dataInicio"
						name="dataInicio"
						bind:value={dataInicio}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<!-- Data da 1ª Graduação -->
				<div>
					<label
						for="dataPrimeiraGraduacao"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Data da 1ª Graduação (Faixa)
					</label>
					<input
						type="date"
						id="dataPrimeiraGraduacao"
						name="dataPrimeiraGraduacao"
						bind:value={dataPrimeiraGraduacao}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>
		</div>
		</fieldset>

		<!-- ===================================================================== -->
		<!-- BOTÕES DE AÇÃO -->
		<!-- ===================================================================== -->
		<div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
			<a
				href="/dashboard/alunos"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs sm:text-sm font-medium text-zinc-300 transition-colors"
			>
				{data.podeEditar ? 'Cancelar' : 'Voltar'}
			</a>
			{#if data.podeEditar}
				<button
					type="submit"
					class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
				>
					<Save class="w-4 h-4" />
					<span>Salvar Alterações do Judoca</span>
				</button>
			{/if}
		</div>
	</form>
	{:else}
		<!-- ===================================================================== -->
		<!-- ABA: TATAME & PRESENÇA (VISÃO PROFESSOR / ADMIN / RECEPÇÃO)           -->
		<!-- ===================================================================== -->
		{@const mp = data.metricasPresenca}
		<div class="space-y-6 animate-in fade-in duration-200">
			<!-- 1. KPIs Analíticos de Assiduidade do Judoca -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
					<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
						Taxa Global de Frequência
					</span>
					<div class="flex items-baseline justify-between">
						<span class="text-2xl font-extrabold font-display {mp.percentual_presenca >= 80 ? 'text-emerald-400' : mp.percentual_presenca >= 60 ? 'text-amber-400' : 'text-red-400'}">
							{mp.percentual_presenca}%
						</span>
						<span class="text-xs font-mono text-zinc-400">
							Mês atual: <strong class="text-white">{mp.percentual_mes_atual}%</strong>
						</span>
					</div>
					<div class="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
						<div
							class="h-full rounded-full {mp.percentual_presenca >= 80 ? 'bg-emerald-500' : mp.percentual_presenca >= 60 ? 'bg-amber-500' : 'bg-red-500'}"
							style="width: {Math.min(100, mp.percentual_presenca)}%"
						></div>
					</div>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
					<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
						Volume de Treinos & Dias
					</span>
					<div class="flex items-baseline gap-2">
						<span class="text-2xl font-extrabold text-white font-display">
							{mp.total_presentes}
						</span>
						<span class="text-xs text-zinc-400">aulas presentes (de {mp.total_aulas})</span>
					</div>
					<p class="text-[11px] text-zinc-400">
						Distribuídas em <strong class="text-amber-300">{mp.dias_distintos_treinados}</strong> dia(s) distintos
					</p>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
					<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
						Constância & Faltas
					</span>
					<div class="flex items-center gap-2">
						<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300">
							<Flame class="w-3.5 h-3.5 text-amber-400" />
							{mp.streak_atual} seguida(s)
						</span>
						<span class="text-[11px] font-mono text-zinc-500">
							Máx: {mp.maior_streak}
						</span>
					</div>
					<p class="text-[11px] text-zinc-400">
						Faltas: <strong class="text-red-400">{mp.total_faltas}</strong> • Justificadas: <strong class="text-sky-400">{mp.total_justificadas}</strong>
					</p>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
					<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
						Elegibilidade p/ Graduação
					</span>
					{#if mp.proximo_exame_meta && (mp.proximo_exame_meta.qtd_minima_aulas > 0 || mp.proximo_exame_meta.percentual_minimo > 0)}
						{@const meta = mp.proximo_exame_meta}
						<div class="flex items-center gap-1.5">
							{#if meta.apto_frequencia}
								<span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300">
									Apto em Frequência ✓
								</span>
							{:else}
								<span class="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-xs font-bold text-red-300">
									Frequência Insuficiente
								</span>
							{/if}
						</div>
						<p class="text-[11px] text-zinc-400 truncate" title={meta.nome_evento}>
							{meta.qtd_minima_aulas > 0 ? `Aulas: ${mp.total_presentes}/${meta.qtd_minima_aulas}` : ''}
							{meta.percentual_minimo > 0 ? ` • Freq: ${mp.percentual_presenca}%/${meta.percentual_minimo}%` : ''}
						</p>
					{:else}
						<span class="text-xs font-bold text-emerald-400 block pt-1">
							Sem bloqueio de chamada
						</span>
						<p class="text-[11px] text-zinc-500">
							{data.turmasMatriculadas.length} turma(s) matriculada(s)
						</p>
					{/if}
				</div>
			</div>

			<!-- 2. Barra de Gestão Individual de Presença (Professor / Admin / Recepção) -->
			{#if data.podeGerenciarPresenca}
				<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<h3 class="text-sm font-bold text-white font-display flex items-center gap-2">
								<PenLine class="w-4 h-4 text-red-500" />
								<span>Lançamento ou Retificação Individual de Presença</span>
							</h3>
							<p class="text-xs text-zinc-400">
								Registre presença extra, justifique falta mediante atestado ou edite anotações de qualquer treino do dia
							</p>
						</div>

						{#if data.turmasMatriculadas.length > 0}
							<button
								type="button"
								onclick={() => (mostrarFormLancamento = !mostrarFormLancamento)}
								class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer {mostrarFormLancamento
									? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
									: 'bg-red-600 hover:bg-red-500 text-white'}"
							>
								{mostrarFormLancamento ? 'Fechar Formulário' : '+ Lançar / Retificar Presença'}
							</button>
						{/if}
					</div>

					{#if (form as any)?.sucessoPresenca}
						<div class="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
							<span>{(form as any).sucessoPresenca}</span>
						</div>
					{/if}

					{#if (form as any)?.erroPresenca}
						<div class="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center gap-2">
							<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
							<span>{(form as any).erroPresenca}</span>
						</div>
					{/if}

					{#if mostrarFormLancamento && data.turmasMatriculadas.length > 0}
						<form method="POST" action="?/lancarPresenca" class="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-4">
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<label for="formIdTreino" class="block text-[11px] font-semibold text-zinc-300 mb-1">
										Turma / Horário do Treino
									</label>
									<select
										id="formIdTreino"
										name="idTreino"
										bind:value={formIdTreino}
										required
										class="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
									>
										{#each data.turmasMatriculadas as tm}
											<option value={tm.id_treino}>
												{tm.descricao} ({tm.dia_semana} • {tm.horario_inicio})
											</option>
										{/each}
									</select>
								</div>

								<div>
									<label for="formDataTreino" class="block text-[11px] font-semibold text-zinc-300 mb-1">
										Data do Treino
									</label>
									<input
										id="formDataTreino"
										type="date"
										name="dataTreino"
										bind:value={formDataTreino}
										required
										class="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
									/>
								</div>

								<div>
									<label for="formStatusPresenca" class="block text-[11px] font-semibold text-zinc-300 mb-1">
										Status de Presença
									</label>
									<select
										id="formStatusPresenca"
										name="status"
										bind:value={formStatusPresenca}
										class="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
									>
										<option value="Presente">Presente</option>
										<option value="Falta">Falta</option>
										<option value="Justificada">Justificada</option>
									</select>
								</div>
							</div>

							<div>
								<label for="formObservacaoPresenca" class="block text-[11px] font-semibold text-zinc-300 mb-1">
									Observação Técnica / Justificativa (Opcional)
								</label>
								<input
									id="formObservacaoPresenca"
									type="text"
									name="observacao"
									bind:value={formObservacaoPresenca}
									maxlength="255"
									placeholder="Ex: Atestado médico entregue na secretaria / Treino forte de competição..."
									class="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500"
								/>
							</div>

							<div class="flex justify-end gap-2">
								<button
									type="button"
									onclick={() => (mostrarFormLancamento = false)}
									class="px-3.5 py-2 rounded-xl border border-zinc-700 text-xs text-zinc-300 hover:text-white"
								>
									Cancelar
								</button>
								<button
									type="submit"
									class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white cursor-pointer"
								>
									Salvar Registro de Presença
								</button>
							</div>
						</form>
					{/if}
				</div>
			{/if}

			<!-- 3. Calendário Mensal Tradicional do Judoca -->
			<CalendarioTatameMensal
				sessoes={data.presencas || []}
				turmasMatriculadas={data.turmasMatriculadas || []}
				titulo="Calendário Mensal de Presenças — {aluno.nome}"
				subtitulo="Inspecione os dias treinados no mês (incluindo dias com 2 ou mais treinos realizados)"
			/>

			<!-- 4. Tabela Histórica Detalhada com Filtros para Sensei/Admin/Recepção -->
			<div class="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
					<div>
						<h3 class="text-sm sm:text-base font-bold text-white font-display flex items-center gap-2">
							<Filter class="w-4 h-4 text-amber-400" />
							<span>Histórico Cronológico de Chamadas ({presencasFiltradas.length})</span>
						</h3>
						<p class="text-xs text-zinc-400">
							Registro auditável de todas as sessões lançadas para o judoca no dojo
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<select
							bind:value={filtroStatusPresenca}
							class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
						>
							<option value="Todos">Todos os Status</option>
							<option value="Presente">Apenas Presentes</option>
							<option value="Falta">Apenas Faltas</option>
							<option value="Justificada">Apenas Justificadas</option>
						</select>

						<select
							bind:value={filtroIdTreino}
							class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
						>
							<option value="Todos">Todas as Turmas</option>
							{#each data.turmasMatriculadas as tm}
								<option value={tm.id_treino}>{tm.descricao} ({tm.horario_inicio})</option>
							{/each}
						</select>

						<input
							type="text"
							bind:value={buscaPresenca}
							placeholder="Buscar data ou observação..."
							class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500"
						/>
					</div>
				</div>

				{#if presencasFiltradas.length === 0}
					<div class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center">
						<p class="text-xs text-zinc-400">
							Nenhum registro de presença encontrado para os filtros selecionados.
						</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-left border-collapse text-xs">
							<thead>
								<tr class="border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-400">
									<th class="py-2.5 px-3">Data</th>
									<th class="py-2.5 px-3">Horário & Turma</th>
									<th class="py-2.5 px-3">Status</th>
									<th class="py-2.5 px-3">Observação / Justificativa</th>
									<th class="py-2.5 px-3">Registrado por</th>
									{#if data.podeGerenciarPresenca}
										<th class="py-2.5 px-3 text-right">Ação</th>
									{/if}
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900">
								{#each presencasFiltradas as item}
									<tr class="hover:bg-zinc-900/50 transition-colors">
										<td class="py-2.5 px-3 font-mono font-semibold text-zinc-200 whitespace-nowrap">
											{item.data_treino.split('-').reverse().join('/')}
										</td>
										<td class="py-2.5 px-3">
											<span class="font-bold text-white block">{item.descricao_turma}</span>
											<span class="text-[10px] font-mono text-zinc-400">
												{item.horario_inicio} às {item.horario_fim}
											</span>
										</td>
										<td class="py-2.5 px-3 whitespace-nowrap">
											{#if item.status_presenca === 'Presente'}
												<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
													<CheckCircle2 class="w-3 h-3" /> Presente
												</span>
											{:else if item.status_presenca === 'Falta'}
												<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[11px] font-bold text-red-300">
													<XCircle class="w-3 h-3" /> Falta
												</span>
											{:else}
												<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[11px] font-bold text-sky-300">
													<AlertCircle class="w-3 h-3" /> Justificada
												</span>
											{/if}
										</td>
										<td class="py-2.5 px-3 text-zinc-300 max-w-xs">
											{#if item.observacao}
												<span class="block truncate" title={item.observacao}>{item.observacao}</span>
											{:else}
												<span class="text-zinc-600">—</span>
											{/if}
										</td>
										<td class="py-2.5 px-3 text-[11px] text-zinc-400 whitespace-nowrap">
											{item.nome_registrador || 'Sistema'}
										</td>
										{#if data.podeGerenciarPresenca}
											<td class="py-2.5 px-3 text-right whitespace-nowrap">
												<button
													type="button"
													onclick={() => abrirEdicaoPresenca(item)}
													class="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
												>
													Retificar
												</button>
											</td>
										{/if}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
