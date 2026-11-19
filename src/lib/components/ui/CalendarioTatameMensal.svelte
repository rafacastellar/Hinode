<script lang="ts">
	import {
		Calendar,
		ChevronLeft,
		ChevronRight,
		CheckCircle2,
		XCircle,
		AlertCircle,
		Clock,
		Layers,
		Info,
		Trophy,
		Award,
		Maximize2,
		ArrowRight
	} from '@lucide/svelte';

	export interface SessaoCalendario {
		id_presenca?: number | null;
		id_treino: number;
		data_treino: string; // YYYY-MM-DD
		descricao_turma: string;
		horario_inicio: string;
		horario_fim?: string;
		status_presenca: 'Presente' | 'Falta' | 'Justificada';
		observacao?: string | null;
		nome_registrador?: string | null;
	}

	export interface TurmaMatriculadaCalendario {
		id_treino: number;
		descricao: string;
		dia_semana: string;
		horario_inicio: string;
		horario_fim?: string;
	}

	export interface EventoCalendarioItem {
		id_evento: number;
		nome: string;
		data_inicio?: string | null;
		data_inicio_iso?: string | null;
		eh_campeonato: boolean;
		inscrito?: boolean;
		valor_inscricao?: number | null;
	}

	interface SessaoRenderizada {
		id_treino: number;
		descricao_turma: string;
		horario_inicio: string;
		horario_fim: string;
		status: 'Presente' | 'Falta' | 'Justificada' | 'Previsto';
		observacao: string | null;
		nome_registrador: string | null;
	}

	interface Props {
		sessoes: SessaoCalendario[];
		turmasMatriculadas?: TurmaMatriculadaCalendario[];
		eventosCalendario?: EventoCalendarioItem[];
		titulo?: string;
		subtitulo?: string;
		compacto?: boolean;
		onExpandir?: () => void;
	}

	let {
		sessoes = [],
		turmasMatriculadas = [],
		eventosCalendario = [],
		titulo = 'Calendário Mensal de Tatame',
		subtitulo = 'Acompanhe todos os treinos realizados no dia (suporta múltiplos treinos diários)',
		compacto = false,
		onExpandir
	}: Props = $props();

	const hojeIso = new Date().toISOString().slice(0, 10);
	const dataInicial = new Date();

	let anoAtual = $state(dataInicial.getFullYear());
	let mesAtual = $state(dataInicial.getMonth()); // 0 a 11
	let diaSelecionado = $state<string | null>(hojeIso);

	const nomesMeses = [
		'Janeiro',
		'Fevereiro',
		'Março',
		'Abril',
		'Maio',
		'Junho',
		'Julho',
		'Agosto',
		'Setembro',
		'Outubro',
		'Novembro',
		'Dezembro'
	];

	const diasSemanaCabecalho = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

	// Mapeia índice do dia da semana (0=Dom..6=Sáb) para tokens no campo dia_semana da turma
	const tokensDiaSemana: Record<number, string[]> = {
		0: ['dom'],
		1: ['seg'],
		2: ['ter'],
		3: ['qua'],
		4: ['qui'],
		5: ['sex'],
		6: ['sab', 'sáb']
	};

	function turmaOcorreNoDiaSemana(diaSemanaTurma: string, diaSemanaIndex: number): boolean {
		const texto = (diaSemanaTurma || '').toLowerCase();
		const tokens = tokensDiaSemana[diaSemanaIndex] || [];
		return tokens.some((t) => texto.includes(t));
	}

	function formatarIsoData(ano: number, mesZeroBased: number, dia: number): string {
		const m = String(mesZeroBased + 1).padStart(2, '0');
		const d = String(dia).padStart(2, '0');
		return `${ano}-${m}-${d}`;
	}

	function mesAnterior() {
		if (mesAtual === 0) {
			mesAtual = 11;
			anoAtual -= 1;
		} else {
			mesAtual -= 1;
		}
		diaSelecionado = null;
	}

	function proximoMes() {
		if (mesAtual === 11) {
			mesAtual = 0;
			anoAtual += 1;
		} else {
			mesAtual += 1;
		}
		diaSelecionado = null;
	}

	function irParaHoje() {
		const agora = new Date();
		anoAtual = agora.getFullYear();
		mesAtual = agora.getMonth();
		diaSelecionado = hojeIso;
	}

	// Agrupa sessões por data YYYY-MM-DD (suporta N sessões no mesmo dia)
	const mapaSessoesRegistradas = $derived.by(() => {
		const mapa = new Map<string, SessaoRenderizada[]>();
		for (const s of sessoes) {
			const chave = s.data_treino.slice(0, 10);
			const lista = mapa.get(chave) || [];
			lista.push({
				id_treino: s.id_treino,
				descricao_turma: s.descricao_turma,
				horario_inicio: s.horario_inicio,
				horario_fim: s.horario_fim || '',
				status: s.status_presenca,
				observacao: s.observacao || null,
				nome_registrador: s.nome_registrador || null
			});
			mapa.set(chave, lista);
		}
		// Ordena cada dia por horário de início
		for (const [k, lista] of mapa.entries()) {
			lista.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));
			mapa.set(k, lista);
		}
		return mapa;
	});

	// Agrupa eventos do dojo (campeonatos e exames) por data YYYY-MM-DD
	const mapaEventosCalendario = $derived.by(() => {
		const mapa = new Map<string, EventoCalendarioItem[]>();
		for (const ev of eventosCalendario) {
			let iso = ev.data_inicio_iso || '';
			if (!iso && ev.data_inicio && ev.data_inicio.includes('/')) {
				const [d, m, a] = ev.data_inicio.split('/');
				if (d && m && a) iso = `${a}-${m}-${d}`;
			}
			if (!iso) continue;
			const chave = iso.slice(0, 10);
			const lista = mapa.get(chave) || [];
			lista.push(ev);
			mapa.set(chave, lista);
		}
		return mapa;
	});

	// Constrói células do mês corrente (incluindo espaços vazios do início da semana)
	const celulasCalendario = $derived.by(() => {
		const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
		const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

		const celulas: Array<{
			vazia: boolean;
			diaNumero: number;
			dataIso: string;
			ehHoje: boolean;
			sessoesDia: SessaoRenderizada[];
			eventosDia: EventoCalendarioItem[];
		}> = [];

		for (let i = 0; i < primeiroDiaSemana; i++) {
			celulas.push({
				vazia: true,
				diaNumero: 0,
				dataIso: '',
				ehHoje: false,
				sessoesDia: [],
				eventosDia: []
			});
		}

		for (let dia = 1; dia <= totalDiasNoMes; dia++) {
			const dataIso = formatarIsoData(anoAtual, mesAtual, dia);
			const diaSemanaIdx = new Date(anoAtual, mesAtual, dia).getDay();
			const registradas = [...(mapaSessoesRegistradas.get(dataIso) || [])];
			const eventosDia = mapaEventosCalendario.get(dataIso) || [];

			// Para datas de hoje ou futuras, adiciona treinos previstos ainda sem chamada lançada
			if (dataIso >= hojeIso && turmasMatriculadas.length > 0) {
				const idsJaRegistrados = new Set(registradas.map((r) => r.id_treino));
				for (const tm of turmasMatriculadas) {
					if (
						!idsJaRegistrados.has(tm.id_treino) &&
						turmaOcorreNoDiaSemana(tm.dia_semana, diaSemanaIdx)
					) {
						registradas.push({
							id_treino: tm.id_treino,
							descricao_turma: tm.descricao,
							horario_inicio: tm.horario_inicio,
							horario_fim: tm.horario_fim || '',
							status: 'Previsto',
							observacao: null,
							nome_registrador: null
						});
					}
				}
				registradas.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));
			}

			celulas.push({
				vazia: false,
				diaNumero: dia,
				dataIso,
				ehHoje: dataIso === hojeIso,
				sessoesDia: registradas,
				eventosDia
			});
		}

		return celulas;
	});

	// Resumo estatístico do mês exibido
	const resumoMes = $derived.by(() => {
		let presentes = 0;
		let faltas = 0;
		let justificadas = 0;
		let previstos = 0;
		let eventos = 0;
		let diasMultiTreino = 0;

		for (const cel of celulasCalendario) {
			if (cel.vazia) continue;
			const reais = cel.sessoesDia.filter((s) => s.status !== 'Previsto');
			if (reais.length >= 2) {
				diasMultiTreino += 1;
			}
			for (const s of cel.sessoesDia) {
				if (s.status === 'Presente') presentes++;
				else if (s.status === 'Falta') faltas++;
				else if (s.status === 'Justificada') justificadas++;
				else if (s.status === 'Previsto') previstos++;
			}
			eventos += cel.eventosDia.length;
		}

		return { presentes, faltas, justificadas, previstos, eventos, diasMultiTreino };
	});

	// Sessões do dia selecionado para exibição detalhada abaixo do calendário
	const detalheDiaSelecionado = $derived.by(() => {
		if (!diaSelecionado) return null;
		const celula = celulasCalendario.find((c) => !c.vazia && c.dataIso === diaSelecionado);
		if (!celula) return null;
		return celula;
	});

	function formatarDataCompleta(iso: string): string {
		if (!iso) return '';
		const [a, m, d] = iso.split('-').map(Number);
		const dt = new Date(a, m - 1, d);
		return dt.toLocaleDateString('pt-BR', {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

{#if compacto}
	<div
		role="button"
		tabindex="0"
		onclick={() => onExpandir?.()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onExpandir?.();
			}
		}}
		class="group p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-red-800/70 shadow-sm space-y-3.5 transition-all cursor-pointer flex flex-col justify-between text-left overflow-hidden"
	>
		<div class="space-y-3">
			<!-- Cabeçalho Compacto (Idêntico aos demais cards da coluna direita) -->
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900 gap-2">
				<div class="flex items-center gap-2.5 min-w-0 flex-1">
					<div class="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
						<Calendar class="w-4 h-4 text-red-400" />
					</div>
					<div class="min-w-0 flex-1">
						<h2 class="text-sm font-bold text-white font-display truncate" title={titulo}>
							{titulo}
						</h2>
						<p class="text-[11px] text-zinc-400 font-mono">
							{nomesMeses[mesAtual]} <span class="text-amber-400 font-bold">{anoAtual}</span>
						</p>
					</div>
				</div>

				<div class="flex items-center gap-1.5 shrink-0">
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							mesAnterior();
						}}
						class="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
						title="Mês anterior"
					>
						<ChevronLeft class="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							proximoMes();
						}}
						class="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
						title="Próximo mês"
					>
						<ChevronRight class="w-3.5 h-3.5" />
					</button>
					{#if onExpandir}
						<span
							class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-red-400 group-hover:border-red-800/60 transition-colors"
							title="Expandir Calendário Mensal & Eventos"
						>
							<Maximize2 class="w-3.5 h-3.5" />
						</span>
					{/if}
				</div>
			</div>

			<!-- Cabeçalho dos Dias da Semana Compacto -->
			<div class="grid grid-cols-7 gap-1 text-center">
				{#each diasSemanaCabecalho as diaNome}
					<div class="text-[9px] font-mono font-bold uppercase text-zinc-500">
						{diaNome.slice(0, 3)}
					</div>
				{/each}
			</div>

			<!-- Grade Mensal Compacta com Treinos e Eventos Marcados nas Datas -->
			<div class="grid grid-cols-7 gap-1">
				{#each celulasCalendario as cel}
					{#if cel.vazia}
						<div class="h-8 rounded-lg bg-zinc-900/15"></div>
					{:else}
						{@const qtdSessoes = cel.sessoesDia.length}
						{@const qtdEventos = cel.eventosDia.length}
						{@const temAtividade = qtdSessoes > 0 || qtdEventos > 0}
						{@const resumoTooltip = [
							...cel.eventosDia.map(
								(ev) => `${ev.eh_campeonato ? '🏆 Torneio' : '🥋 Exame'}: ${ev.nome}${ev.inscrito ? ' (Inscrito)' : ''}`
							),
							...cel.sessoesDia.map(
								(s) => `${s.horario_inicio} - ${s.descricao_turma} (${s.status})`
							)
						].join(' | ')}
						<div
							title={resumoTooltip || `${cel.diaNumero}/${mesAtual + 1}/${anoAtual}`}
							class="relative h-8 rounded-lg border flex flex-col items-center justify-center transition-all {cel.ehHoje
								? 'border-amber-500 bg-amber-500/15 text-amber-300'
								: qtdEventos > 0
									? 'border-amber-700/60 bg-amber-950/30 text-amber-200'
									: qtdSessoes > 0
										? 'border-zinc-800 bg-zinc-900/70 text-zinc-200'
										: 'border-zinc-900/80 bg-zinc-950/60 text-zinc-500'}"
						>
							<span class="text-[11px] font-bold leading-none">{cel.diaNumero}</span>
							{#if temAtividade}
								<div class="flex items-center justify-center gap-0.5 mt-0.5">
									{#each cel.eventosDia.slice(0, 2) as ev}
										<span
											class="w-1.5 h-1.5 rounded-full {ev.eh_campeonato
												? 'bg-amber-400 ring-1 ring-amber-300/60'
												: 'bg-purple-400 ring-1 ring-purple-300/60'}"
										></span>
									{/each}
									{#each cel.sessoesDia.slice(0, 3) as s}
										<span
											class="w-1.5 h-1.5 rounded-full {s.status === 'Presente'
												? 'bg-emerald-400'
												: s.status === 'Falta'
													? 'bg-red-400'
													: s.status === 'Justificada'
														? 'bg-sky-400'
														: 'bg-zinc-400'}"
										></span>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				{/each}
			</div>

			<!-- Legenda Rápida das Marcações nas Datas -->
			<div class="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[10px] font-mono text-zinc-400">
				<span class="inline-flex items-center gap-1">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
					Presente ({resumoMes.presentes})
				</span>
				<span class="inline-flex items-center gap-1">
					<span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
					Treino ({resumoMes.previstos})
				</span>
				<span class="inline-flex items-center gap-1">
					<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
					Eventos ({resumoMes.eventos})
				</span>
			</div>
		</div>

		<!-- Rodapé do Card Compacto -->
		<div class="pt-2.5 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-400">
			<span>
				{turmasMatriculadas.length} turma(s) • {eventosCalendario.filter((e) => e.inscrito).length} inscrito(s)
			</span>
			<span class="text-red-400 group-hover:text-red-300 font-semibold inline-flex items-center gap-1">
				<span>Expandir</span>
				<ArrowRight class="w-3 h-3" />
			</span>
		</div>
	</div>
{:else}
<div class="rounded-2xl border border-zinc-800/90 bg-zinc-950/90 p-4 sm:p-6 shadow-xl">
	<!-- Cabeçalho e Navegação de Mês -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-4">
		<div>
			<div class="flex items-center gap-2">
				<Calendar class="h-5 w-5 text-amber-400" />
				<h3 class="text-base sm:text-lg font-bold text-zinc-100">{titulo}</h3>
			</div>
			{#if subtitulo}
				<p class="mt-0.5 text-xs text-zinc-400">{subtitulo}</p>
			{/if}
		</div>

		<div class="flex items-center gap-2 self-start sm:self-auto">
			<button
				type="button"
				onclick={mesAnterior}
				class="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition"
				title="Mês anterior"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>

			<div class="min-w-[150px] text-center">
				<span class="text-sm font-bold text-zinc-100">
					{nomesMeses[mesAtual]}
					<span class="text-amber-400">{anoAtual}</span>
				</span>
			</div>

			<button
				type="button"
				onclick={proximoMes}
				class="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition"
				title="Próximo mês"
			>
				<ChevronRight class="h-4 w-4" />
			</button>

			<button
				type="button"
				onclick={irParaHoje}
				class="ml-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-amber-500/40 hover:text-amber-300 transition"
			>
				Hoje
			</button>
		</div>
	</div>

	<!-- Barra de Resumo do Mês -->
	<div class="mt-4 flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
		<div class="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
			<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
			<span>Presentes: <strong>{resumoMes.presentes}</strong></span>
		</div>
		<div class="flex items-center gap-1.5 rounded-lg border border-zinc-700/70 bg-zinc-800/60 px-2.5 py-1 text-zinc-300">
			<span class="h-2 w-2 rounded-full bg-zinc-400"></span>
			<span>Previstos: <strong>{resumoMes.previstos}</strong></span>
		</div>
		<div class="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-red-300">
			<span class="h-2 w-2 rounded-full bg-red-400"></span>
			<span>Faltas: <strong>{resumoMes.faltas}</strong></span>
		</div>
		<div class="flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-sky-300">
			<span class="h-2 w-2 rounded-full bg-sky-400"></span>
			<span>Justificadas: <strong>{resumoMes.justificadas}</strong></span>
		</div>
		{#if eventosCalendario.length > 0 || resumoMes.eventos > 0}
			<div class="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300">
				<Trophy class="h-3.5 w-3.5 text-amber-400" />
				<span>Eventos no mês: <strong>{resumoMes.eventos}</strong></span>
			</div>
		{/if}
		{#if resumoMes.diasMultiTreino > 0}
			<div class="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300">
				<Layers class="h-3.5 w-3.5 text-amber-400" />
				<span>2+ treinos/dia: <strong>{resumoMes.diasMultiTreino}</strong></span>
			</div>
		{/if}
	</div>

	<!-- Cabeçalho dos Dias da Semana -->
	<div class="mt-4 grid grid-cols-7 gap-1 sm:gap-2 text-center">
		{#each diasSemanaCabecalho as diaNome}
			<div class="py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
				{diaNome}
			</div>
		{/each}
	</div>

	<!-- Grade Mensal Tradicional -->
	<div class="grid grid-cols-7 gap-1 sm:gap-2">
		{#each celulasCalendario as cel}
			{#if cel.vazia}
				<div class="min-h-[68px] sm:min-h-[88px] rounded-xl border border-transparent bg-zinc-900/20"></div>
			{:else}
				{@const selecionada = diaSelecionado === cel.dataIso}
				{@const qtdSessoes = cel.sessoesDia.length}
				{@const qtdEventos = cel.eventosDia.length}
				{@const temAtividade = qtdSessoes > 0 || qtdEventos > 0}
				<button
					type="button"
					onclick={() => (diaSelecionado = cel.dataIso)}
					class="group relative flex min-h-[76px] sm:min-h-[96px] flex-col items-stretch justify-between rounded-xl border p-1.5 sm:p-2 text-left transition-all cursor-pointer {selecionada
						? 'border-amber-500/80 bg-zinc-900 ring-1 ring-amber-500/40'
						: cel.ehHoje
							? 'border-zinc-700 bg-zinc-900/80'
							: qtdEventos > 0
								? 'border-amber-700/50 bg-amber-950/15 hover:border-amber-500/60 hover:bg-zinc-900'
								: qtdSessoes > 0
									? 'border-zinc-800/90 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
									: 'border-zinc-900 bg-zinc-950/60 hover:border-zinc-800'}"
				>
					<!-- Topo da Célula: Número do Dia + Indicador de Eventos / Múltiplos Treinos -->
					<div class="flex items-center justify-between gap-1">
						<span
							class="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-bold {cel.ehHoje
								? 'bg-amber-500 text-zinc-950'
								: selecionada
									? 'text-amber-300'
									: temAtividade
										? 'text-zinc-200'
										: 'text-zinc-500'}"
						>
							{cel.diaNumero}
						</span>

						<div class="flex items-center gap-1">
							{#if qtdEventos > 0}
								<span
									class="rounded-full bg-amber-500/20 border border-amber-500/40 px-1 py-0.2 text-[9px] font-bold text-amber-300"
									title="{qtdEventos} evento(s) nesta data"
								>
									★{qtdEventos > 1 ? qtdEventos : ''}
								</span>
							{/if}
							{#if qtdSessoes > 1}
								<span
									class="rounded-full bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 text-[9px] font-bold text-zinc-300"
									title="{qtdSessoes} treinos neste dia"
								>
									{qtdSessoes}x
								</span>
							{/if}
						</div>
					</div>

					<!-- Lista de Sessões e Eventos do Dia -->
					<div class="mt-1 flex flex-col gap-1 overflow-hidden">
						{#each cel.eventosDia.slice(0, 2) as ev}
							<div
								class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-bold {ev.inscrito
									? 'bg-amber-500/20 text-amber-200 border border-amber-500/50'
									: 'bg-purple-500/20 text-purple-200 border border-purple-500/40'}"
								title="{ev.eh_campeonato ? 'Torneio' : 'Exame'}: {ev.nome}{ev.inscrito ? ' (Inscrito)' : ''}"
							>
								{#if ev.eh_campeonato}
									<Trophy class="h-2.5 w-2.5 shrink-0 text-amber-400" />
								{:else}
									<Award class="h-2.5 w-2.5 shrink-0 text-purple-400" />
								{/if}
								<span class="truncate">{ev.nome}</span>
							</div>
						{/each}
						{#each cel.sessoesDia.slice(0, 3) as s}
							{#if s.status === 'Presente'}
								<div
									class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
									title="{s.horario_inicio} - {s.descricao_turma}: Presente"
								>
									<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"></span>
									<span class="truncate">{s.horario_inicio}</span>
								</div>
							{:else if s.status === 'Falta'}
								<div
									class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-red-500/15 text-red-300 border border-red-500/30"
									title="{s.horario_inicio} - {s.descricao_turma}: Falta"
								>
									<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"></span>
									<span class="truncate">{s.horario_inicio}</span>
								</div>
							{:else if s.status === 'Justificada'}
								<div
									class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30"
									title="{s.horario_inicio} - {s.descricao_turma}: Justificada"
								>
									<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400"></span>
									<span class="truncate">{s.horario_inicio}</span>
								</div>
							{:else}
								<div
									class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-zinc-800/70 text-zinc-400 border border-zinc-700/60"
									title="{s.horario_inicio} - {s.descricao_turma}: Previsto"
								>
									<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500"></span>
									<span class="truncate">{s.horario_inicio}</span>
								</div>
							{/if}
						{/each}

						{#if cel.sessoesDia.length > 3}
							<span class="text-[9px] font-semibold text-zinc-400 text-center">
								+{cel.sessoesDia.length - 3} treino(s)
							</span>
						{/if}
					</div>
				</button>
			{/if}
		{/each}
	</div>

	<!-- Painel de Detalhes do Dia Selecionado -->
	{#if detalheDiaSelecionado}
		<div class="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
			<div class="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
				<span class="text-xs font-bold uppercase tracking-wider text-amber-400 capitalize">
					{formatarDataCompleta(detalheDiaSelecionado.dataIso)}
				</span>
				<span class="text-xs text-zinc-400">
					{detalheDiaSelecionado.sessoesDia.length} treino(s)
					{#if detalheDiaSelecionado.eventosDia.length > 0}
						• {detalheDiaSelecionado.eventosDia.length} evento(s)
					{/if}
				</span>
			</div>

			{#if detalheDiaSelecionado.eventosDia.length > 0}
				<div class="mt-3 space-y-2">
					{#each detalheDiaSelecionado.eventosDia as ev}
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-amber-800/60 bg-amber-950/20 p-3">
							<div class="space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase {ev.eh_campeonato ? 'bg-amber-950/80 border border-amber-700 text-amber-300' : 'bg-purple-950/80 border border-purple-700 text-purple-300'}">
										{ev.eh_campeonato ? 'Campeonato' : 'Exame de Graduação'}
									</span>
									{#if ev.inscrito}
										<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
											Inscrito ✓
										</span>
									{/if}
								</div>
								<p class="text-xs font-bold text-white">{ev.nome}</p>
							</div>
							<a
								href={ev.eh_campeonato ? `/dashboard/campeonatos/${ev.id_evento}` : `/dashboard/graduacoes/${ev.id_evento}`}
								class="self-start sm:self-center shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
							>
								Ver Evento →
							</a>
						</div>
					{/each}
				</div>
			{/if}

			{#if detalheDiaSelecionado.sessoesDia.length === 0 && detalheDiaSelecionado.eventosDia.length === 0}
				<p class="py-3 text-xs text-zinc-500">
					Nenhum treino ou evento registrado para esta data.
				</p>
			{:else if detalheDiaSelecionado.sessoesDia.length > 0}
				<div class="mt-3 space-y-2.5">
					{#each detalheDiaSelecionado.sessoesDia as sessao}
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-zinc-800/90 bg-zinc-950/80 p-3">
							<div class="space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="inline-flex items-center gap-1 text-xs font-bold text-zinc-200">
										<Clock class="h-3.5 w-3.5 text-amber-400" />
										{sessao.horario_inicio}{sessao.horario_fim ? ` às ${sessao.horario_fim}` : ''}
									</span>
									<span class="text-xs font-semibold text-zinc-100">
										• {sessao.descricao_turma}
									</span>
								</div>

								{#if sessao.observacao}
									<p class="flex items-start gap-1.5 text-xs text-zinc-300 bg-zinc-900/90 rounded-md px-2.5 py-1.5 border border-zinc-800">
										<Info class="h-3.5 w-3.5 shrink-0 text-sky-400 mt-0.5" />
										<span>{sessao.observacao}</span>
									</p>
								{/if}

								{#if sessao.nome_registrador}
									<p class="text-[11px] text-zinc-500">
										Registrado por: {sessao.nome_registrador}
									</p>
								{/if}
							</div>

							<div class="self-start sm:self-center shrink-0">
								{#if sessao.status === 'Presente'}
									<span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
										<CheckCircle2 class="h-3.5 w-3.5" />
										Presente
									</span>
								{:else if sessao.status === 'Falta'}
									<span class="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
										<XCircle class="h-3.5 w-3.5" />
										Falta
									</span>
								{:else if sessao.status === 'Justificada'}
									<span class="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">
										<AlertCircle class="h-3.5 w-3.5" />
										Justificada
									</span>
								{:else}
									<span class="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
										<Clock class="h-3.5 w-3.5" />
										Treino Previsto
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
{/if}
