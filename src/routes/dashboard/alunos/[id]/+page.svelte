<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
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
		Info
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

			<div class="flex items-center gap-3">
				<BadgeFaixa faixa={aluno.graduacao_atual} size="lg" />
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
	<!-- FORMULÁRIO DE EDIÇÃO TÉCNICA E ESPORTIVA DO JUDOCA -->
	<!-- ========================================================================= -->
	<form method="POST" class="space-y-6">
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
</div>
