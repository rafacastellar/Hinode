<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		User,
		HeartHandshake,
		ArrowLeft,
		AlertCircle,
		Award,
		CheckCircle2,
		Search,
		List,
		X,
		Check,
		Info,
		Pencil,
		ShieldAlert,
		UserPlus,
		Phone,
		Mail,
		Calendar
	} from '@lucide/svelte';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import { obterClassificacaoJudo } from '#lib/dominio/regras-categoria-peso';
	import { OPCOES_FAIXAS_CADASTRO, LISTA_TODAS_FAIXAS_VALORES, normalizarFaixaParaCadastro } from '#lib/dominio/graduacao';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Candidato = PageData['candidatos'][number];

	let carregando = $state(false);

	// =========================================================================
	// ESTADO: LOCALIZAÇÃO DO USUÁRIO (PERFIL ALUNO)
	// =========================================================================
	let termoBusca = $state('');
	let listarTodos = $state(false);
	let idSelecionado = $state<number | null>(null);

	const selecionado = $derived<Candidato | null>(
		idSelecionado ? (data.candidatos.find((c) => c.id_usuario === idSelecionado) ?? null) : null
	);

	const totalDisponiveis = $derived(data.candidatos.filter((c) => !c.ja_matriculado).length);

	// Filtro local por nome, CPF (dígitos), e-mail ou telefone
	const resultados = $derived.by<Candidato[]>(() => {
		const q = termoBusca.trim().toLowerCase();
		if (q.length < 2) return listarTodos ? data.candidatos : [];
		const digitos = q.replace(/\D/g, '');
		return data.candidatos.filter(
			(c) =>
				c.nome.toLowerCase().includes(q) ||
				c.email.toLowerCase().includes(q) ||
				(digitos.length >= 3 &&
					(c.cpf.includes(digitos) || (c.telefone ?? '').replace(/\D/g, '').includes(digitos)))
		);
	});

	const exibindoResultados = $derived(termoBusca.trim().length >= 2 || listarTodos);

	const ehMenor = $derived(selecionado ? selecionado.idade < 18 : false);
	const menorSemResponsavel = $derived(
		!!selecionado && ehMenor && selecionado.responsaveis.length === 0
	);

	// Campos técnicos do Judoca
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
		if (!selecionado) return null;
		return obterClassificacaoJudo({
			dataNascimento: selecionado.data_nascimento,
			genero: selecionado.genero,
			peso: peso,
			graduacao: graduacaoSelecionada
		});
	});

	// Auto-preenchimento inteligente caso o usuário ainda não tenha customizado manualmente
	$effect(() => {
		if (classificacaoOficial && !categoriaEditadaManualmente) {
			if (
				classificacaoOficial.categoriaCompleta &&
				!classificacaoOficial.categoriaCompleta.includes('Informe o peso')
			) {
				categoria = classificacaoOficial.categoriaCompleta;
			}
			if (classificacaoOficial.divisao) {
				grupoEspecialAspirante = classificacaoOficial.divisao;
			}
		}
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

	// Restaura valores se o formulário retornar com erro
	$effect(() => {
		const v = form?.valores;
		if (!v) return;
		if (v.idUsuario) idSelecionado = Number(v.idUsuario);
		if (v.matricula) matricula = String(v.matricula);
		if (v.peso) peso = String(v.peso);
		if (v.categoria) {
			categoria = String(v.categoria);
			categoriaEditadaManualmente = true;
		}
		if (v.nFederacao) nFederacao = String(v.nFederacao);
		if (v.statusFederacao) statusFederacao = String(v.statusFederacao);
		if (v.dataInicio) dataInicio = String(v.dataInicio);
		if (v.dataPrimeiraGraduacao) dataPrimeiraGraduacao = String(v.dataPrimeiraGraduacao);
		if (v.graduacaoAtual) graduacaoSelecionada = normalizarFaixaParaCadastro(String(v.graduacaoAtual));
		if (v.grupoEspecialAspirante) grupoEspecialAspirante = String(v.grupoEspecialAspirante);
		if (v.idProfessorResponsavel) idProfessorResponsavel = Number(v.idProfessorResponsavel);
	});

	const faixasDisponiveis = LISTA_TODAS_FAIXAS_VALORES;

	function selecionar(c: Candidato) {
		if (c.ja_matriculado) return;
		idSelecionado = c.id_usuario;
	}

	function trocarUsuario() {
		idSelecionado = null;
	}

	function formatarData(iso: string) {
		const [a, m, d] = iso.split('-');
		return a && m && d ? `${d}/${m}/${a}` : iso;
	}
</script>

<svelte:head>
	<title>Matricular Judoca - Judô Hinodê</title>
	<meta
		name="description"
		content="Matricule como judoca um usuário já cadastrado no dojo com o perfil Aluno."
	/>
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
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Lista de Judocas</span>
		</a>

		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
				Formulário de Matrícula
			</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
			Novo Judoca
		</h1>
		<p class="text-xs sm:text-sm text-zinc-400 mt-1">
			Selecione um usuário já cadastrado com o perfil <strong class="text-zinc-200">Aluno</strong> e
			informe os dados técnicos. Dados pessoais e responsáveis legais são gerenciados no cadastro de
			usuários.
		</p>
	</div>

	<!-- Alerta de Erro do Servidor -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Não foi possível salvar a matrícula:</span>
				<p>{form.erro}</p>
			</div>
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			carregando = true;
			return async ({ update }) => {
				await update();
				carregando = false;
			};
		}}
		class="space-y-8"
	>
		{#if selecionado}
			<input type="hidden" name="idUsuario" value={selecionado.id_usuario} />
		{/if}

		<!-- ===================================================================== -->
		<!-- 1. LOCALIZAR USUÁRIO COM PERFIL ALUNO -->
		<!-- ===================================================================== -->
		<section class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center"
				>
					<User class="w-4 h-4 text-red-500" />
				</div>
				<div class="flex-1">
					<h2 class="text-sm font-bold text-white font-display">1. Identificação do Judoca</h2>
					<p class="text-[11px] text-zinc-500">
						{totalDisponiveis} usuário(s) com perfil Aluno aguardando matrícula
					</p>
				</div>
			</div>

			{#if selecionado}
				<!-- CARD DO USUÁRIO SELECIONADO (SOMENTE LEITURA) -->
				<div
					class="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/70 space-y-4"
				>
					<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
						<div class="flex items-start gap-3">
							<div
								class="w-10 h-10 rounded-xl bg-emerald-900/50 border border-emerald-700/60 flex items-center justify-center shrink-0"
							>
								<CheckCircle2 class="w-5 h-5 text-emerald-400" />
							</div>
							<div>
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-bold text-white text-base">{selecionado.nome}</span>
									{#if ehMenor}
										<span
											class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-950/70 border border-amber-700 text-amber-300"
										>
											Menor • {selecionado.idade} anos
										</span>
									{:else}
										<span
											class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400"
										>
											{selecionado.idade} anos
										</span>
									{/if}
								</div>
								<div
									class="text-[11px] text-zinc-400 font-mono mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1"
								>
									<span>CPF: {selecionado.cpf_mascarado}</span>
									<span class="flex items-center gap-1">
										<Calendar class="w-3 h-3" />
										{formatarData(selecionado.data_nascimento)}
									</span>
									<span class="flex items-center gap-1">
										<Mail class="w-3 h-3" />
										{selecionado.email}
									</span>
									{#if selecionado.telefone}
										<span class="flex items-center gap-1">
											<Phone class="w-3 h-3" />
											{selecionado.telefone}
										</span>
									{/if}
								</div>
							</div>
						</div>

						<div class="flex items-center gap-2 self-end sm:self-auto">
							{#if data.podeGerenciarUsuario}
								<a
									href="/dashboard/usuarios/{selecionado.id_usuario}"
									class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs flex items-center gap-1.5 transition-colors"
								>
									<Pencil class="w-3.5 h-3.5" />
									<span>Editar cadastro</span>
								</a>
							{/if}
							<button
								type="button"
								id="btn-trocar-usuario"
								onclick={trocarUsuario}
								class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs flex items-center gap-1.5 transition-colors"
							>
								<X class="w-3.5 h-3.5" />
								<span>Trocar</span>
							</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- BUSCA / LISTAGEM -->
				<div class="space-y-4">
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
						<div class="relative flex-1">
							<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
							<input
								type="search"
								id="busca-aluno"
								bind:value={termoBusca}
								onkeydown={(e) => e.key === 'Enter' && e.preventDefault()}
								placeholder="Buscar por nome, CPF, e-mail ou telefone..."
								autocomplete="off"
								class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
							/>
						</div>
						<button
							type="button"
							id="btn-listar-todos"
							onclick={() => (listarTodos = !listarTodos)}
							class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors border {listarTodos
								? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
								: 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'}"
						>
							<List class="w-4 h-4" />
							<span>{listarTodos ? 'Ocultar lista' : `Listar todos (${data.candidatos.length})`}</span>
						</button>
					</div>

					{#if exibindoResultados}
						{#if resultados.length === 0}
							<div
								class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5"
							>
								<Info class="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
								<div>
									<p>Nenhum usuário com perfil Aluno encontrado.</p>
									{#if data.podeGerenciarUsuario}
										<a
											href="/dashboard/usuarios/novo"
											class="inline-flex items-center gap-1 mt-1.5 text-red-400 hover:text-red-300 font-medium"
										>
											<UserPlus class="w-3.5 h-3.5" />
											Cadastrar usuário com perfil Aluno
										</a>
									{:else}
										<p class="mt-1 text-[11px] text-zinc-500">
											Solicite à administração o cadastro prévio do usuário no sistema.
										</p>
									{/if}
								</div>
							</div>
						{:else}
							<div
								class="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40 max-h-96 overflow-y-auto"
							>
								{#each resultados as c (c.id_usuario)}
									<div
										class="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors {c.ja_matriculado
											? 'opacity-50'
											: 'hover:bg-zinc-800/40'}"
									>
										<div class="min-w-0 flex-1 space-y-1">
											<div class="flex items-center gap-2 flex-wrap">
												<strong class="text-white text-xs sm:text-sm truncate">{c.nome}</strong>
												{#if c.idade < 18}
													<span
														class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 border border-amber-800/70 text-amber-300"
													>
														Menor
													</span>
												{/if}
												{#if c.ja_matriculado}
													<span
														class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400"
													>
														Já matriculado
													</span>
												{/if}
											</div>
											<div
												class="text-[11px] text-zinc-400 font-mono flex flex-wrap gap-x-3 gap-y-0.5"
											>
												<span>CPF: {c.cpf_mascarado}</span>
												<span>{c.idade} anos</span>
												<span>{c.email}</span>
											</div>
											{#if c.responsaveis.length > 0}
												<div class="flex items-center gap-1.5 flex-wrap text-[10px]">
													<HeartHandshake class="w-3 h-3 text-amber-400" />
													{#each c.responsaveis as r (r.id_responsavel)}
														<span
															class="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-zinc-300"
														>
															{r.nome} ({r.grau_parentesco})
														</span>
													{/each}
												</div>
											{:else if c.idade < 18}
												<div class="flex items-center gap-1 text-[10px] text-red-400">
													<ShieldAlert class="w-3 h-3" />
													Sem responsável vinculado
												</div>
											{/if}
										</div>

										{#if !c.ja_matriculado}
											<button
												type="button"
												onclick={() => selecionar(c)}
												class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm self-end sm:self-auto"
											>
												<Check class="w-3.5 h-3.5" />
												<span>Selecionar</span>
											</button>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					{:else}
						<p class="text-[11px] text-zinc-500">
							Digite ao menos 2 caracteres para buscar ou clique em <strong>Listar todos</strong>.
						</p>
					{/if}
				</div>
			{/if}
		</section>

		{#if selecionado}
			<!-- ===================================================================== -->
			<!-- 2. RESPONSÁVEIS LEGAIS VINCULADOS (SOMENTE LEITURA) -->
			<!-- ===================================================================== -->
			{#if !ehMenor && selecionado.responsaveis.length === 0}
				<section
					class="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-900 flex items-center gap-3 opacity-80"
				>
					<div
						class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center"
					>
						<HeartHandshake class="w-4 h-4 text-zinc-500" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-zinc-300 font-display">2. Responsáveis Legais</h2>
						<p class="text-xs text-zinc-500 mt-0.5">
							Judoca maior de idade — responsável legal não se aplica.
						</p>
					</div>
				</section>
			{:else}
				<section
					class="p-6 sm:p-8 rounded-2xl space-y-5 {menorSemResponsavel
						? 'bg-red-950/10 border-2 border-red-800/70'
						: 'bg-amber-950/10 border-2 border-amber-800/60 shadow-[0_0_25px_rgba(217,119,6,0.08)]'}"
				>
					<div
						class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/30"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center"
							>
								<HeartHandshake class="w-4 h-4 text-amber-400" />
							</div>
							<div>
								<h2 class="text-sm font-bold text-amber-300 font-display">
									2. Responsáveis Legais Vinculados ({selecionado.responsaveis.length})
								</h2>
								<p class="text-[11px] text-zinc-500">
									Gerenciados no cadastro do usuário
								</p>
							</div>
						</div>
						{#if data.podeGerenciarUsuario}
							<a
								href="/dashboard/usuarios/{selecionado.id_usuario}"
								class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs flex items-center gap-1.5 transition-colors w-fit"
							>
								<Pencil class="w-3.5 h-3.5" />
								<span>Gerenciar responsáveis</span>
							</a>
						{/if}
					</div>

					{#if menorSemResponsavel}
						<div
							class="p-4 rounded-xl bg-red-950/40 border border-red-800/70 text-red-200 text-xs flex items-start gap-2.5"
						>
							<ShieldAlert class="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
							<p>
								<strong>{selecionado.nome}</strong> é menor de idade e não possui responsável legal
								vinculado. Vincule ao menos um responsável no cadastro do usuário para liberar a matrícula.
							</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 gap-2">
							{#each selecionado.responsaveis as r (r.id_responsavel)}
								<div
									class="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3"
								>
									<div
										class="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0"
									>
										<HeartHandshake class="w-4 h-4 text-amber-400" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2 flex-wrap">
											<span class="text-xs font-bold text-white">{r.nome}</span>
											<span class="text-[10px] font-mono text-zinc-500">CPF: {r.cpf_mascarado}</span>
											<span
												class="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300"
											>
												{r.grau_parentesco}
											</span>
											{#if r.financeiro}
												<span
													class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-800 text-emerald-400"
												>
													Financeiro
												</span>
											{/if}
										</div>
										<div
											class="text-[11px] text-zinc-400 font-mono mt-0.5 flex flex-wrap gap-x-3"
										>
											{#if r.telefone}<span>Tel: {r.telefone}</span>{/if}
											{#if r.email}<span>{r.email}</span>{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/if}

			<!-- ===================================================================== -->
			<!-- 3. DADOS TÉCNICOS DE JUDÔ & TATAME -->
			<!-- ===================================================================== -->
			<section class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
				<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
					<div
						class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center"
					>
						<Award class="w-4 h-4 text-red-500" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">3. Dados Técnicos do Judô</h2>
						<p class="text-[11px] text-zinc-500">Graduação, professor responsável e categoria</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="graduacaoAtual" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
							Graduação Atual (Faixa) *
						</label>
						<div class="flex items-center gap-3">
							<select
								id="graduacaoAtual"
								name="graduacaoAtual"
								bind:value={graduacaoSelecionada}
								required
								class="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
							>
								{#each OPCOES_FAIXAS_CADASTRO as opt}
									<option value={opt.valor}>{opt.rotulo}</option>
								{/each}
								{#if graduacaoSelecionada && !LISTA_TODAS_FAIXAS_VALORES.includes(graduacaoSelecionada)}
									<option value={graduacaoSelecionada}>{graduacaoSelecionada} (Atual)</option>
								{/if}
							</select>
							<BadgeFaixa faixa={graduacaoSelecionada} size="md" />
						</div>
					</div>

					<div>
						<label
							for="idProfessorResponsavel"
							class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
						>
							Professor Técnico Responsável *
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
					{#if classificacaoOficial && selecionado}
						<div class="col-span-1 sm:col-span-2 p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all animate-in fade-in duration-200">
							<div class="space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/30">
										Classificação Oficial CBJ
									</span>
									<span class="text-xs font-semibold text-white">
										{classificacaoOficial.classeNome} ({selecionado.genero === 'F' ? 'Feminino' : 'Masculino'})
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
								title="Preencher automaticamente campos com a categoria e divisão oficial da CBJ"
							>
								<Check class="w-3.5 h-3.5 text-red-400" />
								<span>Aplicar Regra Oficial</span>
							</button>
						</div>
					{/if}

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

					<div>
						<label for="statusFederacao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
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
			</section>
		{/if}

		<!-- ========================================================================= -->
		<!-- AÇÕES DE SUBMISSÃO -->
		<!-- ========================================================================= -->
		<div class="flex items-center justify-end gap-4 pt-4 border-t border-zinc-900">
			<a
				href="/dashboard/alunos"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition-colors"
			>
				Cancelar
			</a>

			<button
				type="submit"
				id="btn-confirmar-matricula"
				disabled={carregando || !selecionado || menorSemResponsavel}
				class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
			>
				{#if carregando}
					<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
					></span>
					<span>Gravando Matrícula...</span>
				{:else}
					<CheckCircle2 class="w-4 h-4" />
					<span>Confirmar Matrícula</span>
				{/if}
			</button>
		</div>
	</form>
</div>
