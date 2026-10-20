<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Building2,
		ShieldCheck,
		Cloud,
		Server,
		Lock,
		Play,
		CheckCircle2,
		FileText,
		AlertCircle,
		Search,
		Loader2,
		MapPin,
		Users,
		Award,
		Calendar,
		Trophy,
		HeartHandshake,
		ChevronDown,
		ChevronUp,
		Save,
		Flame,
		Phone,
		Mail,
		Globe,
		Filter
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Estados do formulário de dados da academia
	let salvandoDojo = $state(false);
	let executandoJob = $state(false);

	// Campos reativos do formulário
	let nome = $state('');
	let nomeFantasia = $state('');
	let cnpj = $state('');
	let inscrEst = $state('');
	let telefone = $state('');

	let cep = $state('');
	let logradouro = $state('');
	let numero = $state('');
	let complemento = $state('');
	let bairro = $state('');
	let cidade = $state('');
	let uf = $state('SP');

	// Estados da consulta ViaCEP
	let buscandoCep = $state(false);
	let erroCep = $state<string | null>(null);
	let sucessoCep = $state(false);

	// Sincroniza dados iniciais carregados do servidor
	$effect(() => {
		nome = data.academia.nome || '';
		nomeFantasia = data.academia.nome_fantasia || '';
		cnpj = data.academia.cnpj || '';
		inscrEst = data.academia.inscr_est || '';
		telefone = data.academia.telefone || '';

		if (data.academia.endereco) {
			cep = data.academia.endereco.cep || '';
			logradouro = data.academia.endereco.logradouro || '';
			numero = data.academia.endereco.numero || '';
			complemento = data.academia.endereco.complemento || '';
			bairro = data.academia.endereco.bairro || '';
			cidade = data.academia.endereco.cidade || '';
			uf = data.academia.endereco.uf || 'SP';
		}
	});

	$effect(() => {
		if (form) {
			salvandoDojo = false;
			executandoJob = false;
		}
	});

	/**
	 * Consulta de endereço automática via ViaCEP
	 */
	async function consultarCep() {
		const cepLimpo = cep.replace(/\D/g, '');
		if (cepLimpo.length !== 8) {
			erroCep = 'Digite um CEP completo com 8 dígitos numéricos.';
			return;
		}

		buscandoCep = true;
		erroCep = null;
		sucessoCep = false;

		try {
			const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
			if (!resposta.ok) throw new Error('Falha na consulta');
			const resultado = await resposta.json();

			if (resultado.erro) {
				erroCep = 'CEP não localizado na base dos Correios.';
				return;
			}

			logradouro = resultado.logradouro || logradouro;
			bairro = resultado.bairro || bairro;
			cidade = resultado.localidade || cidade;
			uf = resultado.uf || uf;
			sucessoCep = true;
		} catch (e) {
			erroCep = 'Não foi possível consultar o CEP automaticamente.';
		} finally {
			buscandoCep = false;
		}
	}

	// =========================================================================
	// CONTROLE DOS LOGS DE AUDITORIA MINIMIZADOS
	// =========================================================================
	let auditoriaExpandida = $state(false);
	let filtroAcao = $state<'TODOS' | 'DOJO' | 'LEMBRETES' | 'ALUNOS' | 'GRADUACOES'>('TODOS');
	let logExpandido = $state<number | null>(null);

	function alternarLog(id: number) {
		logExpandido = logExpandido === id ? null : id;
	}

	const logsFiltrados = $derived(
		data.logsAuditoria.filter((log) => {
			if (filtroAcao === 'TODOS') return true;
			if (filtroAcao === 'DOJO') return log.acao.includes('ACADEMIA');
			if (filtroAcao === 'LEMBRETES') return log.acao.includes('LEMBRETE');
			if (filtroAcao === 'ALUNOS') return log.acao.includes('ALUNO') || log.entidade === 'Aluno';
			if (filtroAcao === 'GRADUACOES') return log.acao.includes('GRADUACAO') || log.entidade === 'Graduacao';
			return true;
		})
	);
</script>

<svelte:head>
	<title>Configurações do Dojo & Governança - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 1. CABEÇALHO DO MÓDULO & ACIONADOR DE JOB                                 -->
	<!-- ========================================================================= -->
	<header
		class="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/25 border border-zinc-800 shadow-2xl"
	>
		<!-- Brilho vermelho cirúrgico de fundo -->
		<div
			class="absolute -top-24 -right-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div>
				<div class="flex items-center gap-2 mb-2 flex-wrap">
					<span
						class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/80 text-xs font-mono font-bold text-red-400"
					>
						<Flame class="w-3.5 h-3.5 text-red-500" />
						<span>Tenant Ativo #{data.academia.id_academia}</span>
					</span>
					<span class="text-xs text-zinc-600 font-mono">•</span>
					<span class="text-xs text-zinc-400 font-mono">
						{data.academia.nome_fantasia || data.academia.nome}
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
						<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
						<span>Isolamento Ativo</span>
					</span>
				</div>

				<h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
					Configurações & Governança do Dojo
				</h1>
				<p class="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
					Gerencie os dados institucionais da academia, endereço da sede, métricas de tatame e telemetria de compliance em um único painel integrado.
				</p>
			</div>

			<!-- Ação Rápida: Testar Job de Lembretes CLI -->
			<form
				method="POST"
				action="?/testarJobLembretes"
				use:enhance={() => {
					executandoJob = true;
					return async ({ update }) => {
						await update();
						executandoJob = false;
					};
				}}
			>
				<button
					type="submit"
					disabled={executandoJob}
					class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:border-red-600/70 hover:bg-zinc-800 transition-all text-xs font-semibold cursor-pointer shadow-lg disabled:opacity-50"
				>
					{#if executandoJob}
						<Loader2 class="w-4 h-4 text-red-500 animate-spin" />
						<span>Executando Job CLI...</span>
					{:else}
						<Play class="w-4 h-4 text-red-500" />
						<span>Executar Job de Lembretes</span>
					{/if}
				</button>
			</form>
		</div>
	</header>

	<!-- ========================================================================= -->
	<!-- ALERTAS DE FEEDBACK DE AÇÃO (DOJO OU JOB)                                  -->
	<!-- ========================================================================= -->
	{#if form?.sucessoDojo}
		<div
			class="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-600/70 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoDojo}</span>
		</div>
	{/if}

	{#if form?.erroDojo}
		<div
			class="p-4 rounded-2xl bg-red-950/40 border-2 border-red-600/70 text-red-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.erroDojo}</span>
		</div>
	{/if}

	{#if form?.mensagemJob}
		<div
			class="p-4 rounded-2xl border transition-all {form.sucessoJob
				? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
				: 'bg-red-950/30 border-red-800/60 text-red-300'}"
		>
			<div class="flex items-start gap-3">
				{#if form.sucessoJob}
					<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
				{:else}
					<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
				{/if}
				<div class="flex-1 text-xs">
					<p class="font-bold text-sm">{form.mensagemJob}</p>
					{#if form.relatorioJob}
						<div
							class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] bg-black/50 p-2.5 rounded-xl border border-zinc-800/60"
						>
							<div>
								<span class="text-zinc-500 block">Dojos Varridos:</span>
								<span class="text-white font-bold">{form.relatorioJob.totalAcademiasProcessadas}</span>
							</div>
							<div>
								<span class="text-zinc-500 block">Pendências:</span>
								<span class="text-white font-bold">{form.relatorioJob.totalInscricoesPendentes}</span>
							</div>
							<div>
								<span class="text-zinc-500 block">Lembretes Enviados:</span>
								<span class="text-emerald-400 font-bold">{form.relatorioJob.totalLembretesEnviados}</span>
							</div>
							<div>
								<span class="text-zinc-500 block">Ignorados (Idempotentes):</span>
								<span class="text-amber-400 font-bold">{form.relatorioJob.totalIgnoradosIdempotencia}</span>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. PAINEL DE MÉTRICAS & INDICADORES ESTRATÉGICOS DO DOJO                   -->
	<!-- ========================================================================= -->
	<section class="space-y-3">
		<div class="flex items-center justify-between px-1">
			<div class="flex items-center gap-2">
				<Building2 class="w-4 h-4 text-red-500" />
				<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
					Indicadores & Estatísticas do Tatame
				</h2>
			</div>
			<span class="text-[10px] font-mono text-zinc-500">Consolidado em tempo real</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
			<!-- KPI 1: Atletas no Tatame -->
			<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1 shadow-sm">
				<div class="flex items-center justify-between text-zinc-400">
					<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Judocas Ativos</span>
					<Users class="w-4 h-4 text-red-500" />
				</div>
				<div class="text-2xl font-black font-display text-white">
					{data.metricasDojo.totalAlunos}
				</div>
				<p class="text-[10px] text-zinc-400 font-mono">
					{data.metricasDojo.totalMenores} menores • {data.metricasDojo.totalAdultos} adultos
				</p>
			</div>

			<!-- KPI 2: Corpo Docente de Senseis -->
			<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1 shadow-sm">
				<div class="flex items-center justify-between text-zinc-400">
					<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Senseis Ativos</span>
					<Award class="w-4 h-4 text-amber-500" />
				</div>
				<div class="text-2xl font-black font-display text-white">
					{data.metricasDojo.totalProfessores}
				</div>
				<p class="text-[10px] text-zinc-400 font-mono">
					Tutela técnica credenciada
				</p>
			</div>

			<!-- KPI 3: Turmas Semanais -->
			<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1 shadow-sm">
				<div class="flex items-center justify-between text-zinc-400">
					<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Turmas Semanais</span>
					<Calendar class="w-4 h-4 text-emerald-500" />
				</div>
				<div class="text-2xl font-black font-display text-white">
					{data.metricasDojo.totalTurmas}
				</div>
				<p class="text-[10px] text-zinc-400 font-mono">
					Horários alocados no dojo
				</p>
			</div>

			<!-- KPI 4: Graduações Homologadas -->
			<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1 shadow-sm">
				<div class="flex items-center justify-between text-zinc-400">
					<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Faixas Concedidas</span>
					<Award class="w-4 h-4 text-sky-400" />
				</div>
				<div class="text-2xl font-black font-display text-white">
					{data.metricasDojo.totalGraduacoesHomologadas}
				</div>
				<p class="text-[10px] text-zinc-400 font-mono">
					Histórico total de exames
				</p>
			</div>

			<!-- KPI 5: Quadro de Medalhas -->
			<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1 shadow-sm">
				<div class="flex items-center justify-between text-zinc-400">
					<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Medalhas do Dojo</span>
					<Trophy class="w-4 h-4 text-amber-400" />
				</div>
				<div class="text-2xl font-black font-display text-white">
					{data.metricasDojo.totalMedalhas}
				</div>
				<p class="text-[10px] text-zinc-400 font-mono">
					Em {data.metricasDojo.totalCampeonatos} torneios oficiais
				</p>
			</div>

			<!-- KPI 6: Conformidade de Tutela -->
			<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1 shadow-sm">
				<div class="flex items-center justify-between text-zinc-400">
					<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Tutela de Menores</span>
					<HeartHandshake class="w-4 h-4 text-emerald-400" />
				</div>
				<div class="text-2xl font-black font-display {data.metricasDojo.taxaTutelaMenores === 100 ? 'text-emerald-400' : 'text-amber-400'}">
					{data.metricasDojo.taxaTutelaMenores}%
				</div>
				<p class="text-[10px] text-zinc-400 font-mono">
					{data.metricasDojo.taxaTutelaMenores === 100 ? '100% com responsável legal' : 'Atenção a pendências'}
				</p>
			</div>
		</div>
	</section>

	<!-- ========================================================================= -->
	<!-- 3. FORMULÁRIO DE EDIÇÃO DO DOJO & ENDEREÇO DA SEDE (COM VIA-CEP)          -->
	<!-- ========================================================================= -->
	<form
		action="?/salvarDadosDojo"
		method="POST"
		onsubmit={() => (salvandoDojo = true)}
		class="space-y-6"
	>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- CARD A: DADOS INSTITUCIONAIS & FISCAIS -->
			<div class="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400">
							<Building2 class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-white font-display">Dados Institucionais do Dojo</h3>
							<p class="text-[11px] text-zinc-500">Razão social, nome fantasia e registros fiscais</p>
						</div>
					</div>
					<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
						✏️ Editável
					</span>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<label for="nome" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
							<span>Razão Social <span class="text-red-500">*</span></span>
							<span class="text-[10px] text-zinc-500 font-mono">Nome oficial no CNPJ</span>
						</label>
						<input
							id="nome"
							name="nome"
							type="text"
							required
							bind:value={nome}
							placeholder="Associação Hinodê de Judô Ltda"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="nome_fantasia" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
							<span>Nome Fantasia / Dojo</span>
							<span class="text-[10px] text-zinc-500 font-mono">Exibido na interface do sistema</span>
						</label>
						<input
							id="nome_fantasia"
							name="nome_fantasia"
							type="text"
							bind:value={nomeFantasia}
							placeholder="Dojo Central Hinodê"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="space-y-1.5">
							<label for="cnpj" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
								<span>CNPJ <span class="text-red-500">*</span></span>
								<span class="text-[10px] text-zinc-500 font-mono">14 dígitos</span>
							</label>
							<input
								id="cnpj"
								name="cnpj"
								type="text"
								required
								bind:value={cnpj}
								placeholder="00.000.000/0001-00"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs font-mono transition-all"
							/>
						</div>

						<div class="space-y-1.5">
							<label for="inscr_est" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
								<span>Inscrição Estadual</span>
								<span class="text-[10px] text-zinc-500 font-mono">Ou 'Isento'</span>
							</label>
							<input
								id="inscr_est"
								name="inscr_est"
								type="text"
								bind:value={inscrEst}
								placeholder="Isento"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs font-mono transition-all"
							/>
						</div>
					</div>

					<div class="space-y-1.5">
						<label for="telefone" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
							<span>Telefone / WhatsApp da Recepção</span>
							<span class="text-[10px] text-zinc-500 font-mono">Canal oficial</span>
						</label>
						<div class="relative">
							<Phone class="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
							<input
								id="telefone"
								name="telefone"
								type="tel"
								bind:value={telefone}
								placeholder="(11) 3456-7890"
								class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- CARD B: ENDEREÇO DA SEDE COM AUTO-CEP VIACEP -->
			<div class="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-center text-sky-400">
							<MapPin class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-white font-display">Endereço da Sede do Dojo</h3>
							<p class="text-[11px] text-zinc-500">Localização física do tatame e atendimento</p>
						</div>
					</div>
					<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
						✏️ Editável
					</span>
				</div>

				<div class="space-y-4">
					<!-- Linha do CEP com busca rápida -->
					<div class="space-y-1.5">
						<label for="cep" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
							<span>CEP da Sede <span class="text-red-500">*</span></span>
							<span class="text-[10px] text-zinc-500 font-mono">Busca automática via Correios</span>
						</label>
						<div class="flex gap-2">
							<div class="relative flex-1">
								<input
									id="cep"
									name="cep"
									type="text"
									required
									bind:value={cep}
									onblur={consultarCep}
									placeholder="01310-100"
									class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white text-xs font-mono transition-all"
								/>
								{#if buscandoCep}
									<div class="absolute right-3 top-3">
										<Loader2 class="w-4 h-4 text-sky-400 animate-spin" />
									</div>
								{/if}
							</div>
							<button
								type="button"
								onclick={consultarCep}
								disabled={buscandoCep}
								class="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-sky-600/70 text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
							>
								<Search class="w-3.5 h-3.5" />
								<span>Buscar</span>
							</button>
						</div>

						{#if erroCep}
							<p class="text-[11px] text-red-400 flex items-center gap-1 mt-1">
								<AlertCircle class="w-3.5 h-3.5 shrink-0" />
								<span>{erroCep}</span>
							</p>
						{/if}
						{#if sucessoCep}
							<p class="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
								<CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
								<span>Endereço preenchido com sucesso pelo CEP!</span>
							</p>
						{/if}
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
						<div class="sm:col-span-3 space-y-1.5">
							<label for="logradouro" class="text-xs font-semibold text-zinc-300">
								Logradouro / Avenida / Rua <span class="text-red-500">*</span>
							</label>
							<input
								id="logradouro"
								name="logradouro"
								type="text"
								required
								bind:value={logradouro}
								placeholder="Av. Paulista"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 text-white text-xs transition-all"
							/>
						</div>

						<div class="space-y-1.5">
							<label for="numero" class="text-xs font-semibold text-zinc-300">
								Número
							</label>
							<input
								id="numero"
								name="numero"
								type="text"
								bind:value={numero}
								placeholder="1000"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 text-white text-xs transition-all font-mono"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<label for="complemento" class="text-xs font-semibold text-zinc-300">
								Complemento
							</label>
							<input
								id="complemento"
								name="complemento"
								type="text"
								bind:value={complemento}
								placeholder="Sala 4, Tatame 1"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 text-white text-xs transition-all"
							/>
						</div>

						<div class="space-y-1.5">
							<label for="bairro" class="text-xs font-semibold text-zinc-300">
								Bairro
							</label>
							<input
								id="bairro"
								name="bairro"
								type="text"
								bind:value={bairro}
								placeholder="Bela Vista"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 text-white text-xs transition-all"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="sm:col-span-2 space-y-1.5">
							<label for="cidade" class="text-xs font-semibold text-zinc-300">
								Cidade <span class="text-red-500">*</span>
							</label>
							<input
								id="cidade"
								name="cidade"
								type="text"
								required
								bind:value={cidade}
								placeholder="São Paulo"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 text-white text-xs transition-all"
							/>
						</div>

						<div class="space-y-1.5">
							<label for="uf" class="text-xs font-semibold text-zinc-300">
								UF <span class="text-red-500">*</span>
							</label>
							<input
								id="uf"
								name="uf"
								type="text"
								maxlength="2"
								required
								bind:value={uf}
								placeholder="SP"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 text-white text-xs uppercase font-mono text-center font-bold transition-all"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Botão de Ação: Salvar Configurações -->
		<div class="flex items-center justify-end gap-3 pt-2">
			<button
				type="submit"
				disabled={salvandoDojo}
				class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 cursor-pointer"
			>
				{#if salvandoDojo}
					<Loader2 class="w-4 h-4 animate-spin" />
					<span>Gravando Configurações...</span>
				{:else}
					<Save class="w-4 h-4" />
					<span>Salvar Configurações do Dojo</span>
				{/if}
			</button>
		</div>
	</form>

	<!-- ========================================================================= -->
	<!-- 4. PAINEL DE PRONTIDÃO PARA NUVEM (AWS READY - 6 PILARES)                 -->
	<!-- ========================================================================= -->
	<section class="rounded-3xl bg-zinc-950 border border-zinc-900 p-6 sm:p-8 space-y-6">
		<div class="flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-2xl bg-red-950/40 border border-red-800/70 flex items-center justify-center text-red-500 shrink-0"
			>
				<Server class="w-5 h-5" />
			</div>
			<div>
				<h2 class="text-base font-bold text-white tracking-tight font-display">
					Arquitetura & Prontidão para Nuvem (AWS Ready)
				</h2>
				<p class="text-xs text-zinc-400">
					Conformidade arquitetural estrita com as seções 4.1 a 4.6 do regulamento técnico.
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<!-- Pilar 1 -->
			<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
				<div class="flex items-center gap-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-bold text-white">Isolamento Multi-Tenant</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Toda query no banco inclui <code class="text-red-400 font-mono text-[11px]">id_academia</code> como primeiro parâmetro obrigatório extraído da sessão segura.
				</p>
			</div>

			<!-- Pilar 2 -->
			<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
				<div class="flex items-center gap-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-bold text-white">Sem ORM • SQL Parametrizado</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					100% dos comandos usam prepared statements (<code class="text-red-400 font-mono text-[11px]">?</code>), prevenindo injeções de SQL por construção.
				</p>
			</div>

			<!-- Pilar 3 -->
			<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
				<div class="flex items-center gap-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-bold text-white">Sessões Stateless em Tabela</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Tokens com hash armazenados no MySQL. Qualquer contêiner Node.js pode atender qualquer requisição sem memória de sessão local.
				</p>
			</div>

			<!-- Pilar 4 -->
			<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
				<div class="flex items-center gap-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-bold text-white">Storage Interface (S3 Ready)</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Upload de arquivos desacoplado via <code class="text-red-400 font-mono text-[11px]">StorageProvider</code> ({data.cloudReadiness.storageDriver.toUpperCase()}).
				</p>
			</div>

			<!-- Pilar 5 -->
			<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
				<div class="flex items-center gap-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-bold text-white">Jobs Desacoplados (CLI Cron)</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Sem <code class="text-zinc-400 font-mono text-[11px]">setInterval</code> no Node. Jobs executados via script independente com encerramento gracioso do pool e idempotência.
				</p>
			</div>

			<!-- Pilar 6 -->
			<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
				<div class="flex items-center gap-2">
					<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
					<h3 class="text-xs font-bold text-white">Tabelas Imutáveis (Triggers)</h3>
				</div>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Histórico de graduação e logs de auditoria são estritamente <strong class="text-zinc-200">insert-only</strong> com bloqueio de UPDATE/DELETE via triggers.
				</p>
			</div>
		</div>
	</section>

	<!-- ========================================================================= -->
	<!-- 5. TRILHA DE AUDITORIA LGPD (MINIMIZADA POR PADRÃO)                       -->
	<!-- ========================================================================= -->
	<section class="rounded-3xl bg-zinc-950 border border-zinc-900 overflow-hidden shadow-sm">
		<!-- Header Colapsável com Resumo -->
		<div
			class="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
			onclick={() => (auditoriaExpandida = !auditoriaExpandida)}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && (auditoriaExpandida = !auditoriaExpandida)}
			aria-expanded={auditoriaExpandida}
		>
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 shrink-0">
					<FileText class="w-4 h-4" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h2 class="text-sm font-bold text-white font-display">
							Trilha de Auditoria LGPD & Compliance
						</h2>
						<span class="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
							Insert-Only
						</span>
					</div>
					<p class="text-[11px] text-zinc-400 mt-0.5">
						Rastreabilidade imutável de operações sensíveis com mascaramento automático de CPF e senhas.
					</p>
				</div>
			</div>

			<div class="flex items-center gap-3 self-end sm:self-auto shrink-0">
				<span class="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
					{data.logsAuditoria.length} registros recentes
				</span>
				<div
					class="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-transform duration-200 {auditoriaExpandida ? 'rotate-180' : ''}"
				>
					<ChevronDown class="w-4 h-4" />
				</div>
			</div>
		</div>

		<!-- Conteúdo Expandido (Quando auditoriaExpandida = true) -->
		{#if auditoriaExpandida}
			<div class="border-t border-zinc-900 p-5 sm:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200 bg-zinc-950/80">
				<!-- Filtros Rápidos em Chips -->
				<div class="flex items-center gap-2 flex-wrap text-xs">
					<span class="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1 mr-1">
						<Filter class="w-3 h-3" />
						<span>Filtrar:</span>
					</span>
					<button
						type="button"
						onclick={() => (filtroAcao = 'TODOS')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroAcao === 'TODOS'
							? 'bg-red-950/50 border-red-800/80 text-white font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Todos ({data.logsAuditoria.length})
					</button>
					<button
						type="button"
						onclick={() => (filtroAcao = 'DOJO')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroAcao === 'DOJO'
							? 'bg-red-950/50 border-red-800/80 text-white font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Configurações do Dojo
					</button>
					<button
						type="button"
						onclick={() => (filtroAcao = 'LEMBRETES')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroAcao === 'LEMBRETES'
							? 'bg-red-950/50 border-red-800/80 text-white font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Jobs & Lembretes
					</button>
					<button
						type="button"
						onclick={() => (filtroAcao = 'ALUNOS')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroAcao === 'ALUNOS'
							? 'bg-red-950/50 border-red-800/80 text-white font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Atletas & Matrículas
					</button>
					<button
						type="button"
						onclick={() => (filtroAcao = 'GRADUACOES')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroAcao === 'GRADUACOES'
							? 'bg-red-950/50 border-red-800/80 text-white font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Graduações
					</button>
				</div>

				<!-- Tabela Compacta com Rolagem Interna -->
				{#if logsFiltrados.length === 0}
					<div class="p-8 text-center text-xs text-zinc-500">
						Nenhum log encontrado para o filtro selecionado.
					</div>
				{:else}
					<div class="max-h-96 overflow-y-auto rounded-2xl border border-zinc-900">
						<table class="w-full text-left text-xs">
							<thead
								class="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-sm z-10"
							>
								<tr>
									<th class="px-4 py-2.5">Data / Hora</th>
									<th class="px-4 py-2.5">Ação</th>
									<th class="px-4 py-2.5">Entidade</th>
									<th class="px-4 py-2.5">Operador</th>
									<th class="px-4 py-2.5">IP</th>
									<th class="px-4 py-2.5 text-right">Detalhes</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900/80">
								{#each logsFiltrados as log}
									<tr class="hover:bg-zinc-900/30 transition-colors">
										<td class="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap text-[11px]">
											{log.criado_em_formatado}
										</td>
										<td class="px-4 py-3 font-semibold text-zinc-200">
											<span
												class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono {log.acao.includes('LEMBRETE')
													? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
													: log.acao.includes('ACADEMIA')
														? 'bg-sky-950/60 text-sky-300 border border-sky-800/40'
														: 'bg-red-950/40 text-red-300 border border-red-800/40'}"
											>
												{log.acao}
											</span>
										</td>
										<td class="px-4 py-3 text-zinc-400 font-mono text-[11px]">
											{log.entidade || 'Sistema'} {log.id_entidade ? `#${log.id_entidade}` : ''}
										</td>
										<td class="px-4 py-3 text-zinc-300 text-[11px]">
											{log.nome_usuario || 'Job / Sistema'}
										</td>
										<td class="px-4 py-3 font-mono text-[10px] text-zinc-500">
											{log.ip || '-'}
										</td>
										<td class="px-4 py-3 text-right">
											{#if log.dados_depois}
												<button
													type="button"
													onclick={() => alternarLog(log.id_log)}
													class="text-[11px] font-mono text-red-400 hover:text-red-300 underline cursor-pointer"
												>
													{logExpandido === log.id_log ? 'Ocultar' : 'Ver payload'}
												</button>
											{:else}
												<span class="text-zinc-600">-</span>
											{/if}
										</td>
									</tr>

									{#if logExpandido === log.id_log && log.dados_depois}
										<tr class="bg-zinc-900/60">
											<td colspan="6" class="px-4 py-3">
												<pre
													class="p-3 rounded-xl bg-black/90 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed"
												>{typeof log.dados_depois === 'string'
													? log.dados_depois
													: JSON.stringify(log.dados_depois, null, 2)}</pre>
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}
	</section>
</div>
