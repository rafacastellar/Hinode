<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import {
		Building2,
		ShieldCheck,
		Server,
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
		Save,
		Flame,
		Phone,
		Globe,
		Filter,
		ImagePlus,
		Trash2,
		BarChart3,
		Scale,
		KeyRound,
		Sparkles,
		Layers,
		Database,
		X
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// =========================================================================
	// NAVEGAÇÃO DE SUB-MENUS VIA SIDEBAR (?aba=indicadores | institucional | endereco | identidade | auditoria | sistema)
	// =========================================================================
	type AbaConfig =
		| 'indicadores'
		| 'institucional'
		| 'endereco'
		| 'identidade'
		| 'auditoria'
		| 'sistema';

	const abaUrl = $derived(page.url.searchParams.get('aba'));
	let subMenuAtivo = $state<AbaConfig>('indicadores');

	$effect(() => {
		if (
			abaUrl === 'institucional' ||
			abaUrl === 'endereco' ||
			abaUrl === 'identidade' ||
			abaUrl === 'auditoria' ||
			abaUrl === 'sistema' ||
			abaUrl === 'indicadores'
		) {
			subMenuAtivo = abaUrl;
		} else {
			subMenuAtivo = 'indicadores';
		}
	});

	// Estados do formulário de dados da academia
	let salvandoDojo = $state(false);
	let executandoJob = $state(false);

	// Campos reativos do formulário
	let nome = $state('');
	let nomeFantasia = $state('');
	let cnpj = $state('');
	let inscrEst = $state('');
	let telefone = $state('');
	let logoUrl = $state('');
	let slug = $state('');
	let dominioCustomizado = $state('');
	let erroLogo = $state<string | null>(null);

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

	$effect(() => {
		nome = data.academia.nome || '';
		nomeFantasia = data.academia.nome_fantasia || '';
		cnpj = data.academia.cnpj || '';
		inscrEst = data.academia.inscr_est || '';
		telefone = data.academia.telefone || '';
		logoUrl = data.academia.logo_url || '';
		slug = data.academia.slug || '';
		dominioCustomizado = data.academia.dominio_customizado || '';

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

	// Saúde Cadastral da Sede (%)
	const percentualSaudeDojo = $derived.by(() => {
		let pontos = 0;
		const total = 8;
		if (nome.trim().length >= 3) pontos += 1.5;
		if (nomeFantasia.trim().length >= 2) pontos += 1;
		if (cnpj.replace(/\D/g, '').length === 14) pontos += 1.5;
		if (telefone.replace(/\D/g, '').length >= 8) pontos += 1;
		if (
			cep.replace(/\D/g, '').length === 8 &&
			logradouro.trim().length >= 2 &&
			cidade.trim().length >= 2 &&
			uf.trim().length === 2
		) {
			pontos += 1.5;
		}
		if (logoUrl.trim().length > 0) pontos += 1;
		if (slug.trim().length >= 2) pontos += 0.5;
		return Math.min(100, Math.round((pontos / total) * 100));
	});

	const percentualCoberturaPesagem = $derived(
		data.metricasDojo.totalAlunos > 0
			? Math.round((data.metricasDojo.totalComPeso / data.metricasDojo.totalAlunos) * 100)
			: 100
	);

	function processarUploadLogo(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const arquivo = input.files?.[0];
		erroLogo = null;
		if (!arquivo) return;

		if (!arquivo.type.startsWith('image/')) {
			erroLogo = 'Selecione um arquivo de imagem válido (PNG, JPG, WebP ou SVG).';
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				const maxDim = 256;
				let w = img.width;
				let h = img.height;
				if (w > h && w > maxDim) {
					h = Math.round((h * maxDim) / w);
					w = maxDim;
				} else if (h >= w && h > maxDim) {
					w = Math.round((w * maxDim) / h);
					h = maxDim;
				}
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.clearRect(0, 0, w, h);
					ctx.drawImage(img, 0, 0, w, h);
					logoUrl = canvas.toDataURL('image/webp', 0.86);
				}
			};
			img.src = String(e.target?.result || '');
		};
		reader.readAsDataURL(arquivo);
	}

	$effect(() => {
		if (form) {
			salvandoDojo = false;
			executandoJob = false;
		}
	});

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
		} catch {
			erroCep = 'Não foi possível consultar o CEP automaticamente.';
		} finally {
			buscandoCep = false;
		}
	}

	// =========================================================================
	// ABA 5: TRILHA DE AUDITORIA LGPD & COMPLIANCE (10 POR PADRÃO + FILTROS)
	// =========================================================================
	let filtroAcao = $state<
		'TODOS' | 'DOJO' | 'USUARIOS' | 'ALUNOS' | 'GRADUACOES' | 'LEMBRETES'
	>('TODOS');
	let buscaAuditoria = $state('');
	let auditDataInicio = $state('');
	let auditDataFim = $state('');
	let mostrarTodosLogs = $state(false);
	let logExpandido = $state<number | null>(null);

	function alternarLog(id: number) {
		logExpandido = logExpandido === id ? null : id;
	}

	const temFiltroAuditoriaAtivo = $derived(
		Boolean(
			buscaAuditoria.trim() ||
				auditDataInicio ||
				auditDataFim ||
				filtroAcao !== 'TODOS'
		)
	);

	const logsFiltrados = $derived.by(() => {
		const q = buscaAuditoria.trim().toLowerCase();

		const filtrados = data.logsAuditoria.filter((log) => {
			if (filtroAcao === 'DOJO' && !log.acao.includes('ACADEMIA')) return false;
			if (
				filtroAcao === 'USUARIOS' &&
				!log.acao.includes('USUARIO') &&
				!log.acao.includes('SENHA') &&
				log.entidade !== 'Usuario'
			) {
				return false;
			}
			if (
				filtroAcao === 'ALUNOS' &&
				!log.acao.includes('ALUNO') &&
				!log.acao.includes('PESO') &&
				log.entidade !== 'Aluno'
			) {
				return false;
			}
			if (
				filtroAcao === 'GRADUACOES' &&
				!log.acao.includes('GRADUACAO') &&
				log.entidade !== 'Graduacao' &&
				log.entidade !== 'Historico_Graduacao'
			) {
				return false;
			}
			if (filtroAcao === 'LEMBRETES' && !log.acao.includes('LEMBRETE')) return false;

			if (auditDataInicio && log.data_iso < auditDataInicio) return false;
			if (auditDataFim && log.data_iso > auditDataFim) return false;

			if (!q) return true;
			return (
				log.acao.toLowerCase().includes(q) ||
				(log.nome_usuario && log.nome_usuario.toLowerCase().includes(q)) ||
				(log.entidade && log.entidade.toLowerCase().includes(q)) ||
				(log.id_entidade && log.id_entidade.toLowerCase().includes(q)) ||
				(log.ip && log.ip.toLowerCase().includes(q))
			);
		});

		if (!temFiltroAuditoriaAtivo && !mostrarTodosLogs) {
			return filtrados.slice(0, 10);
		}
		return filtrados;
	});

	function limparFiltrosAuditoria() {
		filtroAcao = 'TODOS';
		buscaAuditoria = '';
		auditDataInicio = '';
		auditDataFim = '';
		mostrarTodosLogs = false;
	}
</script>

<svelte:head>
	<title>Configurações do Dojo & Governança - Judô Hinodê</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
	<!-- ========================================================================= -->
	<!-- CABEÇALHO NO PADRÃO SIDEBAR                                               -->
	<!-- ========================================================================= -->
	<div
		class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-900"
	>
		<div>
			<div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500">
				<Flame class="w-3.5 h-3.5" />
				<span>Tenant Ativo #{data.academia.id_academia} • Governança & White-Label</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight text-white mt-1">
				Configurações do Dojo
			</h2>
			<p class="text-xs text-zinc-400 mt-1">
				Indicadores estratégicos do tatame, dados institucionais, endereço da sede, identidade visual, auditoria LGPD e ficha técnica do sistema.
			</p>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/70 text-xs font-mono font-semibold text-emerald-300">
				<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
				<span>Isolamento Multi-Tenant Ativo</span>
			</span>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- ALERTAS DE FEEDBACK DE AÇÃO (DOJO OU JOB)                                  -->
	<!-- ========================================================================= -->
	{#if form?.sucessoDojo}
		<div
			class="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/70 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in fade-in"
		>
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoDojo}</span>
		</div>
	{/if}

	{#if form?.erroDojo}
		<div
			class="p-4 rounded-2xl bg-red-950/40 border border-red-700/70 text-red-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in fade-in"
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
	<!-- SUB-MENU 1: INDICADORES & ESTATÍSTICAS DO TATAME                          -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'indicadores'}
		<div class="space-y-6 animate-in fade-in duration-200">
			<!-- Barra de Saúde Cadastral da Sede -->
			<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400">
							<Building2 class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Índice de Saúde Cadastral do Dojo
							</h3>
							<p class="text-[11px] text-zinc-500">
								Preenchimento de Razão Social, CNPJ, Telefone, Endereço da Sede, Emblema e Slug White-Label
							</p>
						</div>
					</div>
					<span
						class="text-base font-mono font-extrabold {percentualSaudeDojo === 100
							? 'text-emerald-400'
							: 'text-amber-400'}"
					>
						{percentualSaudeDojo}%
					</span>
				</div>

				<div class="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-300 {percentualSaudeDojo === 100
							? 'bg-emerald-500'
							: 'bg-amber-500'}"
						style="width: {Math.max(5, percentualSaudeDojo)}%"
					></div>
				</div>

				<div class="flex flex-wrap items-center gap-2 pt-1">
					<a
						href="/dashboard/configuracoes?aba=institucional"
						class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
					>
						Dados Institucionais →
					</a>
					<a
						href="/dashboard/configuracoes?aba=endereco"
						class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
					>
						Endereço da Sede →
					</a>
					<a
						href="/dashboard/configuracoes?aba=identidade"
						class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
					>
						Identidade Visual & Domínio →
					</a>
				</div>
			</div>

			<!-- 6 KPIs Atuais do Tatame -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400">
							<BarChart3 class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Indicadores & Estatísticas do Tatame
							</h3>
							<p class="text-[11px] text-zinc-500">
								Métricas operacionais, pedagógicas e competitivas consolidadas em tempo real
							</p>
						</div>
					</div>
					<span class="text-[10px] font-mono text-zinc-500 uppercase">Tempo Real</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<!-- KPI 1: Atletas no Tatame -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Judocas Ativos</span>
							<Users class="w-4 h-4 text-red-500" />
						</div>
						<div class="text-2xl font-black font-display text-white">
							{data.metricasDojo.totalAlunos}
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							{data.metricasDojo.totalMenores} menores • {data.metricasDojo.totalAdultos} adultos
						</p>
					</div>

					<!-- KPI 2: Corpo Docente de Senseis -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Senseis Ativos</span>
							<Award class="w-4 h-4 text-amber-500" />
						</div>
						<div class="text-2xl font-black font-display text-white">
							{data.metricasDojo.totalProfessores}
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							Tutela técnica credenciada
						</p>
					</div>

					<!-- KPI 3: Turmas Semanais -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Turmas Semanais</span>
							<Calendar class="w-4 h-4 text-emerald-500" />
						</div>
						<div class="text-2xl font-black font-display text-white">
							{data.metricasDojo.totalTurmas}
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							Horários alocados no dojo
						</p>
					</div>

					<!-- KPI 4: Graduações Homologadas -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Faixas Concedidas</span>
							<Award class="w-4 h-4 text-sky-400" />
						</div>
						<div class="text-2xl font-black font-display text-white">
							{data.metricasDojo.totalGraduacoesHomologadas}
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							Histórico imutável de exames
						</p>
					</div>

					<!-- KPI 5: Quadro de Medalhas -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Medalhas do Dojo</span>
							<Trophy class="w-4 h-4 text-amber-400" />
						</div>
						<div class="text-2xl font-black font-display text-white">
							{data.metricasDojo.totalMedalhas}
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							Em {data.metricasDojo.totalCampeonatos} torneios oficiais
						</p>
					</div>

					<!-- KPI 6: Conformidade de Tutela -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">Tutela de Menores</span>
							<HeartHandshake class="w-4 h-4 text-emerald-400" />
						</div>
						<div
							class="text-2xl font-black font-display {data.metricasDojo.taxaTutelaMenores === 100
								? 'text-emerald-400'
								: 'text-amber-400'}"
						>
							{data.metricasDojo.taxaTutelaMenores}%
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							{data.metricasDojo.taxaTutelaMenores === 100
								? '100% com responsável legal'
								: 'Atenção a pendências'}
						</p>
					</div>

					<!-- KPI 7 (Novo): Cobertura de Pesagem CBJ -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">
								Cobertura de Pesagem CBJ
							</span>
							<Scale class="w-4 h-4 text-amber-400" />
						</div>
						<div
							class="text-2xl font-black font-display {percentualCoberturaPesagem === 100
								? 'text-emerald-400'
								: 'text-amber-400'}"
						>
							{percentualCoberturaPesagem}%
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							{data.metricasDojo.totalComPeso} de {data.metricasDojo.totalAlunos} judocas com peso aferido
						</p>
					</div>

					<!-- KPI 8 (Novo): Contas & Sessões Ativas -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">
								Operadores & Sessões
							</span>
							<KeyRound class="w-4 h-4 text-sky-400" />
						</div>
						<div class="text-2xl font-black font-display text-white">
							{data.estatisticas.totalUsuarios}
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							{data.estatisticas.totalSessoesAtivas} sessão(ões) ativa(s) agora
						</p>
					</div>

					<!-- KPI 9 (Novo): Volume de Auditoria LGPD -->
					<div class="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center justify-between text-zinc-400">
							<span class="text-[10px] font-mono uppercase font-bold text-zinc-500">
								Eventos Auditados (LGPD)
							</span>
							<ShieldCheck class="w-4 h-4 text-emerald-400" />
						</div>
						<div class="text-2xl font-black font-display text-white">
							{data.estatisticas.totalLogsAuditoria}
						</div>
						<p class="text-[11px] text-zinc-400 font-mono">
							Registros imutáveis insert-only
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- SUB-MENUS 2, 3 E 4: FORMULÁRIO ATÔMICO DO DOJO (MANTIDO NO DOM)           -->
	<!-- ========================================================================= -->
	<form
		action="?/salvarDadosDojo"
		method="POST"
		onsubmit={() => (salvandoDojo = true)}
		class:hidden={subMenuAtivo !== 'institucional' &&
			subMenuAtivo !== 'endereco' &&
			subMenuAtivo !== 'identidade'}
		class="space-y-6"
	>
		<!-- ABA 2: DADOS INSTITUCIONAIS DO DOJO -->
		<section
			class:hidden={subMenuAtivo !== 'institucional'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-150"
		>
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400">
						<Building2 class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-white font-display">Dados Institucionais do Dojo</h3>
						<p class="text-[11px] text-zinc-500">Razão social, nome fantasia, CNPJ e contato oficial</p>
					</div>
				</div>
				<span class="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
					Unidade #{data.academia.id_academia}
				</span>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:outline-none text-white text-xs transition-all"
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
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:outline-none text-white text-xs transition-all"
					/>
				</div>

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
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:outline-none text-white text-xs font-mono transition-all"
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
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:outline-none text-white text-xs font-mono transition-all"
					/>
				</div>

				<div class="md:col-span-2 space-y-1.5">
					<label for="telefone" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
						<span>Telefone / WhatsApp da Recepção</span>
						<span class="text-[10px] text-zinc-500 font-mono">Canal oficial da secretaria</span>
					</label>
					<div class="relative">
						<Phone class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
						<input
							id="telefone"
							name="telefone"
							type="tel"
							bind:value={telefone}
							placeholder="(11) 3456-7890"
							class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-red-500 focus:outline-none text-white text-xs transition-all"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- ABA 3: ENDEREÇO DA SEDE DO DOJO -->
		<section
			class:hidden={subMenuAtivo !== 'endereco'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-150"
		>
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-center text-sky-400">
						<MapPin class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-white font-display">Endereço da Sede do Dojo</h3>
						<p class="text-[11px] text-zinc-500">Localização física do tatame e atendimento oficial</p>
					</div>
				</div>
			</div>

			<div class="space-y-4">
				<div class="space-y-1.5 max-w-md">
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
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-sky-500 focus:outline-none text-white text-xs font-mono transition-all"
							/>
							{#if buscandoCep}
								<div class="absolute right-3 top-1/2 -translate-y-1/2">
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
							<span>Buscar CEP</span>
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

				<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-sky-500 focus:outline-none text-white text-xs transition-all"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="numero" class="text-xs font-semibold text-zinc-300">Número</label>
						<input
							id="numero"
							name="numero"
							type="text"
							bind:value={numero}
							placeholder="1000"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-sky-500 focus:outline-none text-white text-xs font-mono transition-all"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="complemento" class="text-xs font-semibold text-zinc-300">Complemento</label>
						<input
							id="complemento"
							name="complemento"
							type="text"
							bind:value={complemento}
							placeholder="Sala 4, Tatame 1"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-sky-500 focus:outline-none text-white text-xs transition-all"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="bairro" class="text-xs font-semibold text-zinc-300">Bairro</label>
						<input
							id="bairro"
							name="bairro"
							type="text"
							bind:value={bairro}
							placeholder="Bela Vista"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-sky-500 focus:outline-none text-white text-xs transition-all"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-sky-500 focus:outline-none text-white text-xs transition-all"
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
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-sky-500 focus:outline-none text-white text-xs uppercase font-mono text-center font-bold transition-all"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- ABA 4: IDENTIDADE VISUAL, EMBLEMA & DOMÍNIO DE ACESSO -->
		<section
			class:hidden={subMenuAtivo !== 'identidade'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-150"
		>
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-center text-amber-400">
						<ImagePlus class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-white font-display">
							Identidade Visual, Emblema & Domínio de Acesso
						</h3>
						<p class="text-[11px] text-zinc-500">
							Logo oficial da academia (usado na barra lateral e na animação de login) e endereço exclusivo
						</p>
					</div>
				</div>
				<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-950/60 border border-amber-800/80 text-amber-400">
					🎨 White-Label SGT
				</span>
			</div>

			<input type="hidden" name="logo_url" value={logoUrl} />

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
				<div class="lg:col-span-5 flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
					<div class="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
						{#if logoUrl}
							<img src={logoUrl} alt="Preview Logo da Academia" class="w-full h-full object-contain rounded-xl" />
						{:else}
							<Building2 class="w-8 h-8 text-zinc-600" />
						{/if}
					</div>
					<div class="space-y-2 flex-1 min-w-0">
						<label class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow">
							<ImagePlus class="w-3.5 h-3.5" />
							<span>Enviar Foto do Logo</span>
							<input type="file" accept="image/*" onchange={processarUploadLogo} class="hidden" />
						</label>
						{#if logoUrl}
							<button
								type="button"
								onclick={() => (logoUrl = '')}
								class="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-mono block cursor-pointer"
							>
								<Trash2 class="w-3 h-3" />
								<span>Remover logo</span>
							</button>
						{/if}
						<p class="text-[10px] text-zinc-500 leading-tight">
							Otimizado automaticamente em WebP de alta definição no navegador.
						</p>
						{#if erroLogo}
							<p class="text-[11px] text-red-400">{erroLogo}</p>
						{/if}
					</div>
				</div>

				<div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="slug" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
							<span>Identificador Curto (Slug)</span>
							<span class="text-[10px] text-amber-400 font-mono">/login?dojo={slug || 'sua-academia'}</span>
						</label>
						<input
							id="slug"
							name="slug"
							type="text"
							bind:value={slug}
							placeholder="ex: hinode, bushido, kodokan"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-xs font-mono lowercase transition-all"
						/>
						<span class="text-[10px] text-zinc-500 block">
							Permite que seus alunos acessem a tela de login já personalizada com o seu logo.
						</span>
					</div>

					<div class="space-y-1.5">
						<label for="dominio_customizado" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
							<span>Domínio Próprio (Opcional)</span>
							<Globe class="w-3.5 h-3.5 text-zinc-500" />
						</label>
						<input
							id="dominio_customizado"
							name="dominio_customizado"
							type="text"
							bind:value={dominioCustomizado}
							placeholder="ex: app.sua-academia.com.br"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white text-xs font-mono lowercase transition-all"
						/>
						<span class="text-[10px] text-zinc-500 block">
							Se apontado por CNAME/Túnel, carrega automaticamente a marca da academia no login.
						</span>
					</div>
				</div>
			</div>
		</section>

		<div class="flex items-center justify-end gap-3 pt-2">
			<button
				type="submit"
				disabled={salvandoDojo}
				class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/50 disabled:opacity-50 cursor-pointer"
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
	<!-- SUB-MENU 5: TRILHA DE AUDITORIA LGPD & COMPLIANCE                         -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'auditoria'}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-200">
			<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400">
						<FileText class="w-4 h-4" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h3 class="text-sm font-semibold text-white">
								Trilha de Auditoria LGPD & Compliance
							</h3>
							<span class="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400">
								Insert-Only (Triggers)
							</span>
						</div>
						<p class="text-[11px] text-zinc-500">
							Exibindo os 10 registros mais recentes por padrão — filtre por período/ação ou carregue o histórico completo
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2 flex-wrap">
					<span class="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
						Exibindo {logsFiltrados.length} de {data.logsAuditoria.length}
					</span>
					{#if data.logsAuditoria.length > 10 && !temFiltroAuditoriaAtivo}
						<button
							type="button"
							onclick={() => (mostrarTodosLogs = !mostrarTodosLogs)}
							class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-200 transition-colors cursor-pointer"
						>
							{mostrarTodosLogs
								? 'Mostrar Últimos 10'
								: `Carregar Histórico (${data.logsAuditoria.length})`}
						</button>
					{/if}
				</div>
			</div>

			<!-- Pesquisa + Filtro por Período -->
			<div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
				<div class="md:col-span-6 space-y-1">
					<label for="busca-auditoria" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
						Pesquisar (Operador, Ação, Entidade ou IP)
					</label>
					<div class="relative">
						<Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							id="busca-auditoria"
							type="text"
							bind:value={buscaAuditoria}
							placeholder="Ex.: CRIAR_USUARIO, MUDANCA_PESO, 127.0.0.1..."
							class="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
						/>
						{#if buscaAuditoria}
							<button
								type="button"
								onclick={() => (buscaAuditoria = '')}
								class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
							>
								<X class="w-3.5 h-3.5" />
							</button>
						{/if}
					</div>
				</div>

				<div class="md:col-span-3 space-y-1">
					<label for="audit-inicio" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
						Período (De)
					</label>
					<input
						id="audit-inicio"
						type="date"
						bind:value={auditDataInicio}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
					/>
				</div>

				<div class="md:col-span-3 space-y-1">
					<label for="audit-fim" class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
						Período (Até)
					</label>
					<div class="flex items-center gap-2">
						<input
							id="audit-fim"
							type="date"
							bind:value={auditDataFim}
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
						/>
						{#if temFiltroAuditoriaAtivo || mostrarTodosLogs}
							<button
								type="button"
								onclick={limparFiltrosAuditoria}
								class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer shrink-0"
								title="Limpar filtros"
							>
								<Filter class="w-3.5 h-3.5" />
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Chips de Categoria de Auditoria -->
			<div class="flex items-center gap-2 flex-wrap text-xs">
				<span class="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1 mr-1">
					<Filter class="w-3 h-3" />
					<span>Módulo:</span>
				</span>
				{#each [
					{ chave: 'TODOS', rotulo: `Todos (${data.logsAuditoria.length})` },
					{ chave: 'DOJO', rotulo: 'Configurações do Dojo' },
					{ chave: 'USUARIOS', rotulo: 'Usuários & Segurança' },
					{ chave: 'ALUNOS', rotulo: 'Atletas & Pesagens' },
					{ chave: 'GRADUACOES', rotulo: 'Graduações' },
					{ chave: 'LEMBRETES', rotulo: 'Jobs & Lembretes' }
				] as ch}
					<button
						type="button"
						onclick={() => (filtroAcao = ch.chave as typeof filtroAcao)}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {filtroAcao ===
						ch.chave
							? 'bg-red-950/50 border-red-800/80 text-white font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						{ch.rotulo}
					</button>
				{/each}
			</div>

			{#if logsFiltrados.length === 0}
				<div class="p-8 text-center text-xs text-zinc-500 rounded-xl bg-zinc-900/30 border border-zinc-900">
					Nenhum registro de auditoria encontrado para os filtros informados.
				</div>
			{:else}
				<div class="rounded-2xl border border-zinc-900 overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs">
							<thead
								class="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider"
							>
								<tr>
									<th class="px-4 py-3">Data / Hora</th>
									<th class="px-4 py-3">Ação</th>
									<th class="px-4 py-3">Entidade</th>
									<th class="px-4 py-3">Operador</th>
									<th class="px-4 py-3">IP</th>
									<th class="px-4 py-3 text-right">Payload</th>
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
													{logExpandido === log.id_log ? 'Ocultar' : 'Ver JSON'}
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
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- SUB-MENU 6: INFORMAÇÕES SOBRE O SISTEMA (PROJETO, PONTOS FORTES & CLOUD)  -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'sistema'}
		<div class="space-y-6 animate-in fade-in duration-200">
			<!-- BLOCO 1: FICHA TÉCNICA DO PROJETO SGT & STACK TECNOLÓGICA -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-900">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/70 flex items-center justify-center text-red-400 shrink-0">
							<Layers class="w-5 h-5" />
						</div>
						<div>
							<div class="flex items-center gap-2 flex-wrap">
								<h3 class="text-base font-bold text-white font-display">
									Plataforma SGT • Sistema de Gestão de Tatame (Judô Hinodê)
								</h3>
								<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-950/60 border border-red-800 text-red-300 font-bold">
									SaaS B2B Multi-Tenant
								</span>
							</div>
							<p class="text-xs text-zinc-400 mt-0.5">
								Arquitetura projetada sob medida para governança técnica, pedagógica e federativa de dojos e associações de Judô.
							</p>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
					<div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
						<span class="text-[10px] font-mono uppercase text-zinc-500 block">Frontend & SSR</span>
						<span class="text-xs font-bold text-white block">SvelteKit 5 (Runes) + TypeScript</span>
						<span class="text-[11px] text-zinc-400 block">Reatividade fina e Progressive Enhancement</span>
					</div>
					<div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
						<span class="text-[10px] font-mono uppercase text-zinc-500 block">Banco de Dados</span>
						<span class="text-xs font-bold text-white block">MySQL 8 Relacional (ACID)</span>
						<span class="text-[11px] text-zinc-400 block">{data.cloudReadiness.bancoDriver}</span>
					</div>
					<div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
						<span class="text-[10px] font-mono uppercase text-zinc-500 block">Segurança & Sessão</span>
						<span class="text-xs font-bold text-white block">Bcrypt + Sessão Stateless</span>
						<span class="text-[11px] text-zinc-400 block">Kill-switch instantâneo e RBAC cumulativo</span>
					</div>
					<div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
						<span class="text-[10px] font-mono uppercase text-zinc-500 block">Storage & Ambiente</span>
						<span class="text-xs font-bold text-white block">
							Driver {data.cloudReadiness.storageDriver.toUpperCase()}
						</span>
						<span class="text-[11px] text-zinc-400 block">
							Modo: {data.cloudReadiness.ambiente}
						</span>
					</div>
				</div>
			</div>

			<!-- BLOCO 2: PONTOS FORTES & DIFERENCIAIS DE NEGÓCIO (DOMÍNIO CBJ/FPJ) -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex items-center gap-2.5 pb-3 border-b border-zinc-900">
					<div class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400">
						<Sparkles class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							Pontos Fortes & Diferenciais Competitivos do Projeto
						</h3>
						<p class="text-[11px] text-zinc-500">
							Regras de negócio reais do Judô oficial (CBJ / FPJ) embarcadas nativamente no núcleo do sistema
						</p>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
						<div class="flex items-center gap-2 text-amber-400 font-bold text-xs">
							<Scale class="w-4 h-4 shrink-0" />
							<span>1. Motor Oficial de Categorias CBJ/FPJ</span>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Enquadramento automático por <strong class="text-zinc-200">Ano Civil</strong> (Festival/Sub-9 até Master 8+), Naipe, Categoria de Peso (Extra-Ligeiro a Super-Pesado) e Divisão (Aspirante vs. Especial).
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
						<div class="flex items-center gap-2 text-red-400 font-bold text-xs">
							<Award class="w-4 h-4 shrink-0" />
							<span>2. Banca de Graduação & Linha do Tempo</span>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Validação pedagógica de elegibilidade (tempo mínimo de judô, interstício na faixa atual e frequência mínima no tatame), com homologação imutável em <code class="text-red-300 font-mono text-[11px]">Historico_Graduacao</code>.
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
						<div class="flex items-center gap-2 text-sky-400 font-bold text-xs">
							<Users class="w-4 h-4 shrink-0" />
							<span>3. RBAC Acumulativo & Sincronia Sensei ↔ Atleta</span>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Um único operador pode acumular os papéis de <strong class="text-zinc-200">Admin, Sensei, Atleta e Responsável</strong>, alternando a perspectiva do painel em 1 clique e mantendo faixa e registro FPJ sincronizados.
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
						<div class="flex items-center gap-2 text-emerald-400 font-bold text-xs">
							<HeartHandshake class="w-4 h-4 shrink-0" />
							<span>4. Tutela Legal de Menores (ECA) & LGPD</span>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Trava transacional que exige responsável legal vinculado para atletas menores de 18 anos, autorização parental em torneios e mascaramento nativo de documentos sensíveis.
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
						<div class="flex items-center gap-2 text-purple-400 font-bold text-xs">
							<Globe class="w-4 h-4 shrink-0" />
							<span>5. Identidade White-Label Multi-Tenant</span>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Cada academia opera em isolamento lógico estrito (<code class="text-purple-300 font-mono text-[11px]">id_academia</code>), com emblema próprio, slug personalizado de login e suporte a domínio exclusivo.
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
						<div class="flex items-center gap-2 text-amber-300 font-bold text-xs">
							<BarChart3 class="w-4 h-4 shrink-0" />
							<span>6. Balança Rápida & Scout Competitivo</span>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Aferição de peso em segundos direto no tatame com trilha histórica de variação corporal e painel analítico de distribuição por classes de idade e peso.
						</p>
					</div>
				</div>
			</div>

			<!-- BLOCO 3: OS 6 PILARES CLOUD / AWS READY + DISPARADOR DE JOBS CLI -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400">
							<Database class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Engenharia de Software & Prontidão para Nuvem (6 Pilares AWS Ready)
							</h3>
							<p class="text-[11px] text-zinc-500">
								Conformidade arquitetural para escalabilidade horizontal, segurança e auditoria
							</p>
						</div>
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
							class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:border-red-600/70 hover:bg-zinc-800 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
						>
							{#if executandoJob}
								<Loader2 class="w-3.5 h-3.5 text-red-500 animate-spin" />
								<span>Executando Job CLI...</span>
							{:else}
								<Play class="w-3.5 h-3.5 text-red-500" />
								<span>Executar Job de Lembretes (CLI)</span>
							{/if}
						</button>
					</form>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<h4 class="text-xs font-bold text-white">1. Isolamento Multi-Tenant</h4>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Toda query no banco inclui <code class="text-red-400 font-mono text-[11px]">id_academia</code> como primeiro parâmetro obrigatório extraído da sessão segura.
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<h4 class="text-xs font-bold text-white">2. Sem ORM • SQL Parametrizado</h4>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							100% dos comandos usam prepared statements (<code class="text-red-400 font-mono text-[11px]">?</code>), prevenindo injeções de SQL por construção.
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<h4 class="text-xs font-bold text-white">3. Sessões Stateless em Tabela</h4>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Tokens armazenados no MySQL. Qualquer contêiner Node.js pode atender qualquer requisição sem afinidade de sessão em memória.
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<h4 class="text-xs font-bold text-white">4. Storage Interface (S3 Ready)</h4>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Upload de arquivos desacoplado via <code class="text-red-400 font-mono text-[11px]">StorageProvider</code> ({data.cloudReadiness.storageDriver.toUpperCase()}).
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<h4 class="text-xs font-bold text-white">5. Jobs Desacoplados (CLI Cron)</h4>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Sem <code class="text-zinc-400 font-mono text-[11px]">setInterval</code> acoplado ao servidor web. Jobs executados via rotina independente e idempotente.
						</p>
					</div>

					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
						<div class="flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<h4 class="text-xs font-bold text-white">6. Tabelas Imutáveis (Triggers)</h4>
						</div>
						<p class="text-xs text-zinc-400 leading-relaxed">
							Histórico de graduação e logs de auditoria são estritamente <strong class="text-zinc-200">insert-only</strong> com bloqueio de UPDATE/DELETE no banco.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
