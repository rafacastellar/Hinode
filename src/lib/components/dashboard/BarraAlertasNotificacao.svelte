<script lang="ts">
	import type {
		PendenciasTecnicasDojo,
		PendenciaJudoca,
	} from "#lib/server/repositorios/dashboard.repo";
	import BadgeFaixa from "#lib/components/ui/BadgeFaixa.svelte";
	import {
		AlertTriangle,
		Scale,
		Users,
		Award,
		Trophy,
		History,
		CalendarDays,
		RefreshCw,
		ArrowRight,
		CheckCircle2,
		BellRing,
		AlertCircle,
		Calendar,
		X,
		Sparkles,
		ChevronDown,
	} from "@lucide/svelte";

	interface Props {
		pendenciasTecnicas?: PendenciasTecnicasDojo | null;
		pendenciasJudoca?: PendenciaJudoca[] | null;
		nomeJudocaAlvo?: string | null;
		escopo?: "geral" | "tutela" | "responsavel" | "aluno";
		modo?: "topbar" | "barra" | "mobile";
		onSelecionarAluno?: (idAluno: number) => void;
	}

	let {
		pendenciasTecnicas = null,
		pendenciasJudoca = null,
		nomeJudocaAlvo = null,
		escopo = "geral",
		modo = "topbar",
		onSelecionarAluno,
	}: Props = $props();

	let expandidoMobile = $state(false);

	type ChaveAlertaPopup =
		| "virada_temporada"
		| "sem_peso"
		| "sem_turma"
		| "campeonatos_autorizacao"
		| "federacao_pendente"
		| "mudancas_peso"
		| "judoca_campeonatos"
		| "judoca_exames"
		| `judoca_${string}`;

	let popupAtivo = $state<ChaveAlertaPopup | null>(null);

	// Contadores de PendenciasTecnicasDojo (Admin, Recepção, Professor, Responsável)
	const qtdViradaTemporada = $derived(
		pendenciasTecnicas?.viradaTemporada?.totalDesatualizados || 0,
	);
	const qtdSemPeso = $derived(pendenciasTecnicas?.alunosSemPeso?.length || 0);
	const qtdSemTurma = $derived(
		pendenciasTecnicas?.alunosSemTurma?.length || 0,
	);
	const qtdAutorizacoes = $derived(
		pendenciasTecnicas?.campeonatosPendentesAutorizacao?.length || 0,
	);
	const qtdFederacao = $derived(
		pendenciasTecnicas?.alunosFederacaoPendente?.length || 0,
	);
	const qtdMudancasPeso = $derived(
		pendenciasTecnicas?.mudancasRecentesPeso?.length || 0,
	);

	// Lista de pendências individuais do judoca (Aluno ou Dependente selecionado)
	const listaPendenciasJudoca = $derived(pendenciasJudoca || []);

	// Agrupamento de campeonatos do judoca (ações de aceite do atleta e autorizações familiares)
	const pendenciasCampeonatosJudoca = $derived(
		listaPendenciasJudoca.filter((p) => p.tipo === "confirmacao_campeonato"),
	);

	// Agrupamento de exames elegíveis do judoca
	const pendenciasExamesJudoca = $derived(
		listaPendenciasJudoca.filter((p) => p.tipo === "exame_elegivel"),
	);

	// Outras pendências individuais do judoca (sem turma, peso categoria, federação, etc.)
	const outrasPendenciasJudoca = $derived(
		listaPendenciasJudoca.filter(
			(p) => p.tipo !== "confirmacao_campeonato" && p.tipo !== "exame_elegivel",
		),
	);

	const totalAlertasAtivos = $derived(
		qtdViradaTemporada +
			qtdSemPeso +
			qtdSemTurma +
			qtdAutorizacoes +
			qtdFederacao +
			qtdMudancasPeso +
			listaPendenciasJudoca.length,
	);

	function abrirPopup(chave: ChaveAlertaPopup) {
		popupAtivo = popupAtivo === chave ? null : chave;
	}

	function fecharPopup() {
		popupAtivo = null;
	}

	// Pendência individual selecionada quando o popup é de um item `PendenciaJudoca`
	const pendenciaJudocaSelecionada = $derived.by(() => {
		if (!popupAtivo || !popupAtivo.startsWith("judoca_")) return null;
		if (popupAtivo === "judoca_campeonatos" || popupAtivo === "judoca_exames") return null;
		const idAlvo = popupAtivo.replace("judoca_", "");
		return listaPendenciasJudoca.find((p) => p.id === idAlvo) || null;
	});
</script>

<svelte:window
	onkeydown={(e) => e.key === "Escape" && popupAtivo && fecharPopup()}
/>

{#snippet botoesAlertas(compacto: boolean = false)}
	<!-- 1. Virada de Temporada CBJ/FPJ -->
	{#if qtdViradaTemporada > 0 && pendenciasTecnicas?.viradaTemporada}
		<button
			type="button"
			onclick={() => abrirPopup("virada_temporada")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {popupAtivo ===
			'virada_temporada'
				? 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-2 ring-amber-300'
				: 'bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/70 text-amber-200'}"
			title="Clique para abrir detalhes da Virada de Temporada"
		>
			<CalendarDays class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0" />
			<span>Temporada {pendenciasTecnicas.viradaTemporada.anoVigente}</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {popupAtivo ===
				'virada_temporada'
					? 'bg-zinc-950 text-amber-400'
					: 'bg-amber-500 text-zinc-950'}"
			>
				{qtdViradaTemporada}
			</span>
		</button>
	{/if}

	<!-- 2. Autorizações de Campeonato Pendentes -->
	{#if qtdAutorizacoes > 0}
		<button
			type="button"
			onclick={() => abrirPopup("campeonatos_autorizacao")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {popupAtivo ===
			'campeonatos_autorizacao'
				? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-2 ring-purple-300'
				: 'bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/70 text-purple-200'}"
			title="Clique para ver autorizações de campeonato pendentes"
		>
			<Trophy class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0" />
			<span>Autorizações</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {popupAtivo ===
				'campeonatos_autorizacao'
					? 'bg-zinc-950 text-purple-300'
					: 'bg-purple-500 text-white'}"
			>
				{qtdAutorizacoes}
			</span>
		</button>
	{/if}

	<!-- 3. Alunos Sem Peso Cadastrado -->
	{#if qtdSemPeso > 0}
		<button
			type="button"
			onclick={() => abrirPopup("sem_peso")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {popupAtivo ===
			'sem_peso'
				? 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-2 ring-amber-300'
				: 'bg-zinc-900 hover:bg-zinc-800 border border-amber-700/60 text-amber-300'}"
			title="Clique para ver judocas com pesagem pendente"
		>
			<Scale class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0" />
			<span>Sem Peso</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {popupAtivo ===
				'sem_peso'
					? 'bg-zinc-950 text-amber-400'
					: 'bg-amber-500/20 border border-amber-500/40 text-amber-300'}"
			>
				{qtdSemPeso}
			</span>
		</button>
	{/if}

	<!-- 4. Alunos Sem Turma Vinculada -->
	{#if qtdSemTurma > 0}
		<button
			type="button"
			onclick={() => abrirPopup("sem_turma")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {popupAtivo ===
			'sem_turma'
				? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.45)] ring-2 ring-red-300'
				: 'bg-red-950/60 hover:bg-red-900/70 border border-red-800/80 text-red-300'}"
			title="Clique para ver judocas sem turma vinculada"
		>
			<Users class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0" />
			<span>Sem Turma</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {popupAtivo ===
				'sem_turma'
					? 'bg-zinc-950 text-red-400'
					: 'bg-red-600 text-white'}"
			>
				{qtdSemTurma}
			</span>
		</button>
	{/if}

	<!-- 5. Alunos com Federação Pendente -->
	{#if qtdFederacao > 0}
		<button
			type="button"
			onclick={() => abrirPopup("federacao_pendente")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {popupAtivo ===
			'federacao_pendente'
				? 'bg-sky-500 text-zinc-950 shadow-[0_0_15px_rgba(14,165,233,0.4)] ring-2 ring-sky-300'
				: 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300'}"
			title="Clique para ver judocas com federação pendente"
		>
			<Award class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-sky-400 shrink-0" />
			<span>Federação</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {popupAtivo ===
				'federacao_pendente'
					? 'bg-zinc-950 text-sky-400'
					: 'bg-zinc-800 border border-zinc-700 text-zinc-300'}"
			>
				{qtdFederacao}
			</span>
		</button>
	{/if}

	<!-- 6. Mudanças Recentes de Peso (Últimos 30 dias) -->
	{#if qtdMudancasPeso > 0}
		<button
			type="button"
			onclick={() => abrirPopup("mudancas_peso")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {popupAtivo ===
			'mudancas_peso'
				? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-300'
				: 'bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/70 text-emerald-300'}"
			title="Clique para ver histórico recente de alterações de peso"
		>
			<History class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0" />
			<span>Mudanças de Peso</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {popupAtivo ===
				'mudancas_peso'
					? 'bg-zinc-950 text-emerald-400'
					: 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'}"
			>
				{qtdMudancasPeso}
			</span>
		</button>
	{/if}

	<!-- 7. Campeonatos do Judoca (Agrupados com contador se houver múltiplos) -->
	{#if pendenciasCampeonatosJudoca.length > 1}
		{@const ativo = popupAtivo === "judoca_campeonatos"}
		{@const temAcaoAtleta = pendenciasCampeonatosJudoca.some((p) => p.dependeDoAluno)}
		<button
			type="button"
			onclick={() => abrirPopup("judoca_campeonatos")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {ativo
				? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] ring-2 ring-red-300'
				: temAcaoAtleta
					? 'bg-red-950/80 hover:bg-red-900/90 border border-red-600/80 text-red-200 shadow-[0_0_12px_rgba(220,38,38,0.2)]'
					: 'bg-zinc-900 hover:bg-zinc-800 border border-amber-700/60 text-amber-200'}"
			title="Clique para ver {pendenciasCampeonatosJudoca.length} confirmações de campeonato pendentes"
		>
			{#if temAcaoAtleta}
				<span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping shrink-0"></span>
			{/if}
			<Trophy class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0" />
			<span class="truncate max-w-[150px] sm:max-w-[200px]">
				{nomeJudocaAlvo ? `${nomeJudocaAlvo.split(" ")[0]}: ` : ""}Campeonatos
			</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {ativo
					? 'bg-zinc-950 text-red-300'
					: 'bg-red-600 text-white'}"
			>
				{pendenciasCampeonatosJudoca.length}
			</span>
		</button>
	{:else if pendenciasCampeonatosJudoca.length === 1}
		{@const pend = pendenciasCampeonatosJudoca[0]}
		{@const ativo = popupAtivo === "judoca_campeonatos" || popupAtivo === `judoca_${pend.id}`}
		<button
			type="button"
			onclick={() => abrirPopup("judoca_campeonatos")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {ativo
				? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] ring-2 ring-red-300'
				: pend.dependeDoAluno
					? 'bg-red-950/80 hover:bg-red-900/90 border border-red-600/80 text-red-200 shadow-[0_0_12px_rgba(220,38,38,0.2)]'
					: 'bg-zinc-900 hover:bg-zinc-800 border border-amber-700/60 text-amber-200'}"
			title="Clique para abrir detalhes da confirmação do campeonato"
		>
			{#if pend.dependeDoAluno}
				<span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping shrink-0"></span>
			{/if}
			<Trophy class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0" />
			<span class="truncate max-w-[150px] sm:max-w-[200px]">
				{nomeJudocaAlvo ? `${nomeJudocaAlvo.split(" ")[0]}: ` : ""}{pend.badge || "Campeonato"}
			</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {ativo
					? 'bg-zinc-950 text-red-300'
					: 'bg-red-600 text-white'}"
			>
				1
			</span>
		</button>
	{/if}

	<!-- 8. Exames de Graduação do Judoca -->
	{#if pendenciasExamesJudoca.length > 1}
		{@const ativo = popupAtivo === "judoca_exames"}
		<button
			type="button"
			onclick={() => abrirPopup("judoca_exames")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {ativo
				? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-2 ring-purple-300'
				: 'bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/70 text-purple-200'}"
			title="Clique para ver {pendenciasExamesJudoca.length} exames elegíveis"
		>
			<Award class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-purple-400 shrink-0" />
			<span class="truncate max-w-[150px] sm:max-w-[200px]">
				{nomeJudocaAlvo ? `${nomeJudocaAlvo.split(" ")[0]}: ` : ""}Exames
			</span>
			<span
				class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold {ativo
					? 'bg-zinc-950 text-purple-300'
					: 'bg-purple-500 text-white'}"
			>
				{pendenciasExamesJudoca.length}
			</span>
		</button>
	{:else if pendenciasExamesJudoca.length === 1}
		{@const pend = pendenciasExamesJudoca[0]}
		{@const chaveItem: ChaveAlertaPopup = `judoca_${pend.id}`}
		{@const ativo = popupAtivo === chaveItem || popupAtivo === "judoca_exames"}
		<button
			type="button"
			onclick={() => abrirPopup("judoca_exames")}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {ativo
				? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-2 ring-purple-300'
				: 'bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/70 text-purple-200'}"
			title="Clique para abrir detalhes do exame elegível"
		>
			<Award class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-purple-400 shrink-0" />
			<span class="truncate max-w-[150px] sm:max-w-[200px]">
				{nomeJudocaAlvo ? `${nomeJudocaAlvo.split(" ")[0]}: ` : ""}{pend.badge || pend.titulo}
			</span>
			<span class="px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-purple-500 text-white">
				1
			</span>
		</button>
	{/if}

	<!-- 9. Outras Pendências Individuais do Judoca -->
	{#each outrasPendenciasJudoca as pend (pend.id)}
		{@const chaveItem: ChaveAlertaPopup = `judoca_${pend.id}`}
		{@const ativo = popupAtivo === chaveItem}
		<button
			type="button"
			onclick={() => abrirPopup(chaveItem)}
			class="group inline-flex items-center gap-1.5 {compacto
				? 'px-2 py-0.5 rounded-lg text-[10px]'
				: 'px-2.5 py-1 rounded-xl text-[11px]'} font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 {ativo
				? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] ring-2 ring-red-300'
				: pend.dependeDoAluno
					? 'bg-red-950/80 hover:bg-red-900/90 border border-red-600/80 text-red-200 shadow-[0_0_12px_rgba(220,38,38,0.2)]'
					: 'bg-zinc-900 hover:bg-zinc-800 border border-amber-700/60 text-amber-200'}"
			title="Clique para abrir detalhes deste alerta"
		>
			{#if pend.dependeDoAluno}
				<span
					class="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping shrink-0"
				></span>
			{/if}
			{#if pend.tipo === "sem_turma"}
				<Calendar class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-sky-400 shrink-0" />
			{:else if pend.tipo === "peso_categoria"}
				<Scale class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0" />
			{:else}
				<AlertCircle
					class="{compacto ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0"
				/>
			{/if}
			<span class="truncate max-w-[150px] sm:max-w-[200px]">
				{nomeJudocaAlvo
					? `${nomeJudocaAlvo.split(" ")[0]}: `
					: ""}{pend.badge || pend.titulo}
			</span>
		</button>
	{/each}
{/snippet}

<!-- ========================================================================= -->
<!-- BARRA COMPACTA OU MODO TOPBAR INTEGRADO                                   -->
<!-- ========================================================================= -->
{#if modo === "barra"}
	<div
		class="-mt-2 mb-4 py-2 px-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-900/90 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap shadow-md"
		role="region"
		aria-label="Barra de notificações e alertas do perfil"
	>
		<div
			class="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 shrink-0"
		>
			<div
				class="w-6 h-6 rounded-lg flex items-center justify-center border {totalAlertasAtivos > 0
					? 'bg-red-950/60 border-red-800/70 text-red-400'
					: 'bg-emerald-950/50 border-emerald-800/60 text-emerald-400'}"
			>
				{#if totalAlertasAtivos > 0}
					<BellRing class="w-3.5 h-3.5 animate-pulse" />
				{:else}
					<CheckCircle2 class="w-3.5 h-3.5" />
				{/if}
			</div>
		</div>

		{#if totalAlertasAtivos === 0}
			<div
				class="flex items-center gap-2 text-[11px] font-mono text-emerald-400/90"
			>
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
				<span>Nenhum alerta pendente — Tudo em dia no tatame</span>
			</div>
		{:else}
			<div class="flex items-center gap-2 flex-wrap flex-1">
				{@render botoesAlertas(false)}
			</div>
		{/if}
	</div>
{:else if modo === "mobile"}
	<!-- MODO MOBILE CONCATENADO (1 ÚNICA NOTIFICAÇÃO QUE EXPANDE AO TOCAR) -->
	{#if totalAlertasAtivos > 0}
		<div class="w-full flex flex-col min-w-0" role="region" aria-label="Notificações do tatame">
			<button
				type="button"
				onclick={() => (expandidoMobile = !expandidoMobile)}
				class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
				aria-expanded={expandidoMobile}
			>
				<div class="flex items-center gap-2 min-w-0">
					<div
						class="w-5 h-5 rounded-md flex items-center justify-center border bg-red-950/70 border-red-800/80 text-red-400 shrink-0 shadow-sm"
					>
						<BellRing class="w-3 h-3 animate-pulse" />
					</div>
					<span class="font-bold text-white text-[11px] truncate">
						{totalAlertasAtivos} {totalAlertasAtivos === 1 ? "Notificação ativa" : "Notificações ativas no tatame"}
					</span>
				</div>
				<div class="flex items-center gap-1 text-[10px] text-amber-400/90 font-bold shrink-0">
					<span>{expandidoMobile ? "Recolher" : "Ver Todas"}</span>
					<ChevronDown
						class="w-3.5 h-3.5 transition-transform duration-200 {expandidoMobile ? 'rotate-180' : ''}"
					/>
				</div>
			</button>

			{#if expandidoMobile}
				<div
					class="mt-2 pt-2 border-t border-zinc-900/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 animate-in fade-in slide-in-from-top-1 duration-150"
				>
					{@render botoesAlertas(true)}
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<!-- MODO TOPBAR (Integrado diretamente na barra horizontal superior - LINHA ÚNICA, NUNCA EMPILHADO) -->
	{#if totalAlertasAtivos > 0}
		<div
			class="flex items-center gap-1.5 flex-nowrap shrink-0 overflow-x-auto no-scrollbar py-0.5"
			role="region"
			aria-label="Notificações ativas do tatame"
		>
			<div
				class="w-5 h-5 rounded-md flex items-center justify-center border bg-red-950/70 border-red-800/80 text-red-400 shrink-0 shadow-sm"
				title="{totalAlertasAtivos} notificação(ões) ativa(s)"
			>
				<BellRing class="w-3 h-3 animate-pulse" />
			</div>

			{@render botoesAlertas(true)}
		</div>
	{/if}
{/if}

<!-- ========================================================================= -->
<!-- POPUP / MODAL EXPANDIDO DE DETALHES DO ALERTA                             -->
<!-- ========================================================================= -->
{#if popupAtivo}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
		onclick={(e) => {
			if (e.target === e.currentTarget) fecharPopup();
		}}
		onkeydown={(e) => e.key === "Escape" && fecharPopup()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200"
		>
			<!-- 1. POPUP: VIRADA DE TEMPORADA -->
			{#if popupAtivo === "virada_temporada" && pendenciasTecnicas?.viradaTemporada}
				{@const virada = pendenciasTecnicas.viradaTemporada}
				<div
					class="p-5 border-b border-zinc-900 bg-gradient-to-r from-amber-950/50 via-zinc-950 to-zinc-950 flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-amber-950/90 border border-amber-700/80 flex items-center justify-center text-amber-400 shrink-0"
						>
							<CalendarDays class="w-5 h-5" />
						</div>
						<div>
							<div class="flex items-center gap-2">
								<span
									class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-amber-500 text-zinc-950"
								>
									Temporada Oficial {virada.anoVigente}
								</span>
								<span
									class="text-[11px] font-mono text-amber-300 font-bold"
								>
									{virada.totalDesatualizados} judoca(s)
								</span>
							</div>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								Alerta de Virada de Temporada (CBJ / FPJ)
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
					<p class="text-xs text-zinc-300 leading-relaxed">
						Como o Judô calcula as classes etárias pelo <strong
							>ano civil de nascimento</strong
						>
						(1º de Janeiro a 31 de Dezembro), identificamos atletas com
						categoria defasada em relação à temporada {virada.anoVigente}.
					</p>

					<div class="space-y-2">
						{#each virada.alunos as al (al.id_usuario)}
							<a
								href="/dashboard/alunos/{al.id_usuario}"
								onclick={fecharPopup}
								class="p-3 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-700/60 flex items-center justify-between gap-3 transition-all"
							>
								<div class="min-w-0">
									<span
										class="text-xs font-bold text-white block truncate"
										>{al.nome}</span
									>
									<span
										class="text-[10px] font-mono text-zinc-400 block mt-0.5"
									>
										De: <span
											class="line-through text-zinc-500"
											>{al.categoria_atual}</span
										>
										→
										<strong class="text-amber-300"
											>{al.categoria_esperada}</strong
										>
									</span>
								</div>
								<BadgeFaixa
									faixa={al.graduacao_atual}
									size="sm"
								/>
							</a>
						{/each}
					</div>

					<div
						class="pt-3 border-t border-zinc-900 flex items-center justify-end gap-3"
					>
						{#if escopo === "geral"}
							<form
								method="POST"
								action="/dashboard?/recalcularCategorias"
							>
								<button
									type="submit"
									class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg cursor-pointer"
								>
									<RefreshCw class="w-3.5 h-3.5" />
									<span
										>Atualizar Categorias para {virada.anoVigente}</span
									>
								</button>
							</form>
						{/if}
					</div>
				</div>

				<!-- 2. POPUP: AUTORIZAÇÕES EM CAMPEONATOS -->
			{:else if popupAtivo === "campeonatos_autorizacao" && pendenciasTecnicas}
				<div
					class="p-5 border-b border-zinc-900 bg-gradient-to-r from-purple-950/50 via-zinc-950 to-zinc-950 flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-purple-950/90 border border-purple-700/80 flex items-center justify-center text-purple-300 shrink-0"
						>
							<Trophy class="w-5 h-5" />
						</div>
						<div>
							<div class="flex items-center gap-2">
								<span
									class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-purple-600 text-white"
								>
									Validação de Torneio
								</span>
								<span
									class="text-[11px] font-mono text-purple-300 font-bold"
								>
									{qtdAutorizacoes} inscrição(ões)
								</span>
							</div>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								Autorização Pendente em Campeonatos
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
					<p class="text-xs text-zinc-400">
						Inscrições em torneios que aguardam autorização do responsável legal, confirmação do atleta ou validação da comissão técnica.
					</p>

					<div class="space-y-2">
						{#each pendenciasTecnicas.campeonatosPendentesAutorizacao as insc (insc.id_inscricao)}
							<a
								href="/dashboard/campeonatos/{insc.id_evento}"
								onclick={fecharPopup}
								class="p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-700/60 flex items-center justify-between gap-3 transition-all group"
							>
								<div class="min-w-0">
									<span
										class="text-xs font-bold text-white group-hover:text-purple-300 transition-colors block truncate"
									>
										{insc.nome_aluno}
									</span>
									<span
										class="text-[11px] font-mono text-purple-300/90 block truncate mt-0.5"
									>
										Torneio: {insc.nome_campeonato}
									</span>
								</div>
								<div class="flex items-center gap-2 shrink-0">
									<BadgeFaixa
										faixa={insc.graduacao_atual}
										size="sm"
									/>
									<span
										class="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-700/70 text-[10px] font-mono font-bold text-purple-200 flex items-center gap-1"
									>
										<span>Analisar</span>
										<ArrowRight class="w-3 h-3" />
									</span>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<!-- 3. POPUP: ALUNOS SEM PESO -->
			{:else if popupAtivo === "sem_peso" && pendenciasTecnicas}
				<div
					class="p-5 border-b border-zinc-900 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/70 flex items-center justify-center text-amber-400 shrink-0"
						>
							<Scale class="w-5 h-5" />
						</div>
						<div>
							<span
								class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-amber-500/20 border border-amber-500/40 text-amber-300"
							>
								Pesagem Oficial Pendente ({qtdSemPeso})
							</span>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								Atletas Sem Peso ou Categoria Definida
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
					<p class="text-xs text-zinc-400">
						O registro de peso em kg é necessário para o cálculo
						automático da categoria CBJ/FPJ em torneios.
					</p>

					<div class="space-y-2">
						{#each pendenciasTecnicas.alunosSemPeso as aluno (aluno.id_usuario)}
							{#if escopo === "responsavel"}
								<a
									href="/dashboard/responsavel"
									onclick={() => {
										onSelecionarAluno?.(aluno.id_usuario);
										fecharPopup();
									}}
									class="p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-700/60 flex items-center justify-between gap-3 transition-all"
								>
									<div class="min-w-0">
										<span
											class="text-xs font-bold text-white block truncate"
											>{aluno.nome}</span
										>
										<span
											class="text-[10px] font-mono text-amber-400"
											>Informar peso na ficha familiar →</span
										>
									</div>
									<BadgeFaixa
										faixa={aluno.graduacao_atual}
										size="sm"
									/>
								</a>
							{:else}
								<a
									href="/dashboard/alunos/{aluno.id_usuario}"
									onclick={fecharPopup}
									class="p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-700/60 flex items-center justify-between gap-3 transition-all"
								>
									<div class="min-w-0">
										<span
											class="text-xs font-bold text-white block truncate"
											>{aluno.nome}</span
										>
										<span
											class="text-[10px] font-mono text-zinc-400"
										>
											{aluno.nome_professor_responsavel
												? `Sensei: ${aluno.nome_professor_responsavel}`
												: "Sem peso registrado"}
										</span>
									</div>
									<div
										class="flex items-center gap-2 shrink-0"
									>
										<BadgeFaixa
											faixa={aluno.graduacao_atual}
											size="sm"
										/>
										<ArrowRight
											class="w-3.5 h-3.5 text-amber-400"
										/>
									</div>
								</a>
							{/if}
						{/each}
					</div>
				</div>

				<!-- 4. POPUP: ALUNOS SEM TURMA -->
			{:else if popupAtivo === "sem_turma" && pendenciasTecnicas}
				<div
					class="p-5 border-b border-zinc-900 bg-gradient-to-r from-red-950/50 via-zinc-950 to-zinc-950 flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/70 flex items-center justify-center text-red-400 shrink-0"
						>
							<Users class="w-5 h-5" />
						</div>
						<div>
							<span
								class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-red-600 text-white"
							>
								Enturmação Pendente ({qtdSemTurma})
							</span>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								Judocas Sem Turma de Treino Vinculada
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
					<p class="text-xs text-zinc-400">
						Atletas ativos que ainda não estão alocados em nenhuma
						grade de horário semanal do tatame.
					</p>

					<div class="space-y-2">
						{#each pendenciasTecnicas.alunosSemTurma as aluno (aluno.id_usuario)}
							{#if escopo === "responsavel"}
								<div
									class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-3"
								>
									<div class="min-w-0">
										<span
											class="text-xs font-bold text-white block truncate"
											>{aluno.nome}</span
										>
										<span
											class="text-[10px] font-mono text-red-300"
										>
											Solicite à recepção ou ao Sensei a
											inclusão em uma turma
										</span>
									</div>
									<BadgeFaixa
										faixa={aluno.graduacao_atual}
										size="sm"
									/>
								</div>
							{:else}
								<a
									href="/dashboard/turmas"
									onclick={fecharPopup}
									class="p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-red-700/60 flex items-center justify-between gap-3 transition-all"
								>
									<div class="min-w-0">
										<span
											class="text-xs font-bold text-white block truncate"
											>{aluno.nome}</span
										>
										<span
											class="text-[10px] font-mono text-red-400"
											>Vincular a uma turma →</span
										>
									</div>
									<BadgeFaixa
										faixa={aluno.graduacao_atual}
										size="sm"
									/>
								</a>
							{/if}
						{/each}
					</div>
				</div>

				<!-- 5. POPUP: FEDERAÇÃO PENDENTE -->
			{:else if popupAtivo === "federacao_pendente" && pendenciasTecnicas}
				<div
					class="p-5 border-b border-zinc-900 bg-gradient-to-r from-sky-950/40 via-zinc-950 to-zinc-950 flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sky-400 shrink-0"
						>
							<Award class="w-5 h-5" />
						</div>
						<div>
							<span
								class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-zinc-800 border border-zinc-700 text-sky-300"
							>
								Situação Federativa ({qtdFederacao})
							</span>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								Atletas com Federação Pendente ou Não Federados
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
					<div class="space-y-2">
						{#each pendenciasTecnicas.alunosFederacaoPendente as aluno (aluno.id_usuario)}
							{#if escopo === "responsavel"}
								<div
									class="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-3"
								>
									<div class="min-w-0">
										<span
											class="text-xs font-bold text-white block truncate"
											>{aluno.nome}</span
										>
										<span
											class="text-[10px] font-mono text-zinc-400"
										>
											Status: {aluno.status_federacao ||
												"Não federado"} (consulte a secretaria)
										</span>
									</div>
									<BadgeFaixa
										faixa={aluno.graduacao_atual}
										size="sm"
									/>
								</div>
							{:else}
								<a
									href="/dashboard/alunos/{aluno.id_usuario}"
									onclick={fecharPopup}
									class="p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between gap-3 transition-all"
								>
									<div class="min-w-0">
										<span
											class="text-xs font-bold text-white block truncate"
											>{aluno.nome}</span
										>
										<span
											class="text-[10px] font-mono text-zinc-400"
										>
											Status: {aluno.status_federacao ||
												"Não federado"}
										</span>
									</div>
									<BadgeFaixa
										faixa={aluno.graduacao_atual}
										size="sm"
									/>
								</a>
							{/if}
						{/each}
					</div>
				</div>

				<!-- 6. POPUP: MUDANÇAS RECENTES DE PESO -->
			{:else if popupAtivo === "mudancas_peso" && pendenciasTecnicas}
				<div
					class="p-5 border-b border-zinc-900 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/70 flex items-center justify-center text-emerald-400 shrink-0"
						>
							<History class="w-5 h-5" />
						</div>
						<div>
							<span
								class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-emerald-950 border border-emerald-700 text-emerald-300"
							>
								Últimos 30 Dias ({qtdMudancasPeso})
							</span>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								Alterações Recentes de Peso & Categoria
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-2.5 max-h-[65vh] overflow-y-auto">
					{#each pendenciasTecnicas.mudancasRecentesPeso as item (item.id_log)}
						{@const mudouCategoria =
							item.categoria_anterior &&
							item.categoria_nova &&
							item.categoria_anterior !== item.categoria_nova}
						<a
							href="/dashboard/alunos/{item.id_aluno}"
							onclick={fecharPopup}
							class="p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
						>
							<div class="min-w-0 space-y-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="text-xs font-bold text-white"
										>{item.nome_aluno}</span
									>
									<BadgeFaixa
										faixa={item.graduacao_atual}
										size="sm"
									/>
									{#if mudouCategoria}
										<span
											class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-950/80 border border-amber-700/70 text-amber-300"
										>
											Mudou de Categoria
										</span>
									{/if}
								</div>
								<div
									class="text-[11px] font-mono text-zinc-400"
								>
									Peso: {item.peso_anterior !== null
										? `${item.peso_anterior} kg`
										: "Sem peso"} →
									<strong class="text-emerald-400"
										>{item.peso_novo} kg</strong
									>
									{#if item.categoria_nova}
										<span class="text-zinc-500">
											• {item.categoria_nova}</span
										>
									{/if}
								</div>
							</div>
							<span
								class="text-[10px] font-mono text-zinc-500 shrink-0"
								>{item.data_alteracao}</span
							>
						</a>
					{/each}
				</div>

				<!-- 7. POPUP: CAMPEONATOS DO JUDOCA (CONFIRMAÇÕES E AUTORIZAÇÕES) -->
			{:else if popupAtivo === "judoca_campeonatos" && pendenciasCampeonatosJudoca.length > 0}
				{@const temAcaoAtleta = pendenciasCampeonatosJudoca.some((p) => p.dependeDoAluno)}
				<div
					class="p-5 border-b border-zinc-900 {temAcaoAtleta
						? 'bg-gradient-to-r from-red-950/60 via-zinc-950 to-zinc-950'
						: 'bg-gradient-to-r from-purple-950/50 via-zinc-950 to-zinc-950'} flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 {temAcaoAtleta
								? 'bg-red-950 border border-red-600 text-amber-400'
								: 'bg-purple-950 border border-purple-700/80 text-purple-300'}"
						>
							<Trophy class="w-5 h-5" />
						</div>
						<div>
							<div class="flex items-center gap-2 flex-wrap">
								{#if temAcaoAtleta}
									<span
										class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-red-600 text-white"
									>
										Ação Requerida
									</span>
								{/if}
								<span
									class="text-[11px] font-mono text-zinc-300 font-bold"
								>
									{pendenciasCampeonatosJudoca.length} torneio(s) pendente(s)
								</span>
							</div>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								Confirmações & Autorizações de Campeonatos
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
					<p class="text-xs text-zinc-400">
						{pendenciasCampeonatosJudoca.length === 1
							? "Você possui uma inscrição em campeonato aguardando ação para garantir a vaga na chave de lutas:"
							: "Você possui inscrições em campeonatos que aguardam confirmação da sua presença ou autorização familiar:"}
					</p>

					<div class="space-y-2.5">
						{#each pendenciasCampeonatosJudoca as pend (pend.id)}
							<div
								class="p-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-600/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
							>
								<div class="min-w-0 space-y-1.5 flex-1">
									<div class="flex items-center gap-2 flex-wrap">
										<span
											class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase {pend.badge === 'Ação do Atleta'
												? 'bg-amber-500 text-zinc-950'
												: 'bg-purple-600 text-white'}"
										>
											{pend.badge}
										</span>
										{#if pend.prazo}
											<span class="text-[10px] font-mono text-zinc-400">
												• Data: <strong class="text-zinc-200">{pend.prazo}</strong>
											</span>
										{/if}
									</div>
									<h4 class="text-sm font-bold text-white">
										{pend.titulo}
									</h4>
									<p class="text-xs text-zinc-400 leading-relaxed">
										{pend.descricao}
									</p>
								</div>

								<a
									href={pend.href}
									onclick={fecharPopup}
									class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer {pend.badge === 'Ação do Atleta'
										? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md'
										: 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'}"
								>
									<span>{pend.textoBotao}</span>
									<ArrowRight class="w-3.5 h-3.5" />
								</a>
							</div>
						{/each}
					</div>
				</div>

				<!-- 8. POPUP: EXAMES ELEGÍVEIS DO JUDOCA -->
			{:else if popupAtivo === "judoca_exames" && pendenciasExamesJudoca.length > 0}
				<div
					class="p-5 border-b border-zinc-900 bg-gradient-to-r from-purple-950/60 via-zinc-950 to-zinc-950 flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-purple-950 border border-purple-600/80 flex items-center justify-center text-purple-400 shrink-0"
						>
							<Award class="w-5 h-5" />
						</div>
						<div>
							<div class="flex items-center gap-2 flex-wrap">
								<span
									class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-purple-600 text-white"
								>
									Graduação
								</span>
								<span
									class="text-[11px] font-mono text-purple-300 font-bold"
								>
									{pendenciasExamesJudoca.length} exame(s) elegível(is)
								</span>
							</div>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								Exames de Faixa Disponíveis
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
					<p class="text-xs text-zinc-400">
						Você atingiu os critérios de tempo de carência e presença para participar dos seguintes exames de graduação:
					</p>

					<div class="space-y-2.5">
						{#each pendenciasExamesJudoca as pend (pend.id)}
							<div
								class="p-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-600/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
							>
								<div class="min-w-0 space-y-1.5 flex-1">
									<div class="flex items-center gap-2 flex-wrap">
										<span
											class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-purple-600 text-white"
										>
											{pend.badge}
										</span>
										{#if pend.prazo}
											<span class="text-[10px] font-mono text-zinc-400">
												• Data: <strong class="text-zinc-200">{pend.prazo}</strong>
											</span>
										{/if}
									</div>
									<h4 class="text-sm font-bold text-white">
										{pend.titulo}
									</h4>
									<p class="text-xs text-zinc-400 leading-relaxed">
										{pend.descricao}
									</p>
								</div>

								<a
									href={pend.href}
									onclick={fecharPopup}
									class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer bg-purple-600 hover:bg-purple-500 text-white shadow-md"
								>
									<span>{pend.textoBotao}</span>
									<ArrowRight class="w-3.5 h-3.5" />
								</a>
							</div>
						{/each}
					</div>
				</div>

				<!-- 9. POPUP: ALERTA INDIVIDUAL DO JUDOCA / DEPENDENTE -->
			{:else if pendenciaJudocaSelecionada}
				{@const pend = pendenciaJudocaSelecionada}
				<div
					class="p-5 border-b border-zinc-900 {pend.dependeDoAluno
						? 'bg-gradient-to-r from-red-950/60 via-zinc-950 to-zinc-950'
						: 'bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950'} flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 {pend.dependeDoAluno
								? 'bg-red-950 border border-red-600 text-red-400'
								: 'bg-zinc-900 border border-zinc-700 text-amber-400'}"
						>
							{#if pend.tipo === "confirmacao_campeonato"}
								<Trophy class="w-5 h-5 text-amber-400" />
							{:else if pend.tipo === "exame_elegivel"}
								<Award class="w-5 h-5 text-purple-400" />
							{:else if pend.tipo === "sem_turma"}
								<Calendar class="w-5 h-5 text-sky-400" />
							{:else if pend.tipo === "peso_categoria"}
								<Scale class="w-5 h-5 text-amber-400" />
							{:else}
								<AlertCircle class="w-5 h-5 text-amber-400" />
							{/if}
						</div>
						<div>
							<div class="flex items-center gap-2 flex-wrap">
								{#if pend.dependeDoAluno}
									<span
										class="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-red-600 text-white"
									>
										Ação Requerida
									</span>
								{/if}
								<span
									class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-800 border border-zinc-700 text-zinc-300"
								>
									{pend.badge}
								</span>
								{#if pend.prazo}
									<span
										class="text-[10px] font-mono text-zinc-400"
									>
										• Prazo: <strong class="text-white"
											>{pend.prazo}</strong
										>
									</span>
								{/if}
							</div>
							<h3
								class="text-sm sm:text-base font-bold text-white font-display mt-0.5"
							>
								{pend.titulo}
							</h3>
						</div>
					</div>
					<button
						type="button"
						onclick={fecharPopup}
						class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						aria-label="Fechar alerta"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-5 space-y-5">
					<p class="text-xs sm:text-sm text-zinc-300 leading-relaxed">
						{pend.descricao}
					</p>

					<div
						class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900"
					>
						<button
							type="button"
							onclick={fecharPopup}
							class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
						>
							Fechar
						</button>
						<a
							href={pend.href}
							onclick={fecharPopup}
							class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all {pend.dependeDoAluno
								? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.45)]'
								: 'bg-amber-500 hover:bg-amber-400 text-zinc-950'}"
						>
							<span>{pend.textoBotao}</span>
							<ArrowRight class="w-4 h-4" />
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
