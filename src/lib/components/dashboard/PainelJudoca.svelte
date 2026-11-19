<script lang="ts">
	import type { PainelJudocaDados } from "#lib/server/repositorios/dashboard.repo";
	import BadgeFaixa from "#lib/components/ui/BadgeFaixa.svelte";
	import PassaporteJudoca from "#lib/components/ui/PassaporteJudoca.svelte";
	import CalendarioTatameMensal from "#lib/components/ui/CalendarioTatameMensal.svelte";
	import BarraAlertasNotificacao from "./BarraAlertasNotificacao.svelte";
	import {
		Award,
		Trophy,
		Medal,
		Calendar,
		Clock,
		Users,
		Sparkles,
		Flame,
		CheckCircle2,
		ArrowRight,
		Scroll,
		Swords,
		ChevronLeft,
		ChevronRight,
		Maximize2,
		X,
		Search,
		Filter,
	} from "@lucide/svelte";

	interface Props {
		painel: PainelJudocaDados;
		nomeAcademia?: string | null;
		mostrarAlertas?: boolean;
	}

	let {
		painel,
		nomeAcademia = "Judô Hinodê",
		mostrarAlertas = true,
	}: Props = $props();
	const nomeDojo = $derived(nomeAcademia || "Judô Hinodê");

	// =========================================================================
	// CONTROLE DE POPUPS (MODAIS DE DETALHAMENTO DOS 4 CARDS COMPACTOS)
	// =========================================================================
	type TipoPopup =
		| "agenda"
		| "metricas_judoca"
		| "metricas_academia"
		| "constancia"
		| "galeria_conquistas"
		| null;

	let popupAtivo = $state<TipoPopup>(null);
	let abaPopupAgenda = $state<"todos" | "treinos" | "eventos" | "calendario">(
		"todos",
	);

	// =========================================================================
	// CONTROLE DOS CARROSSÉIS NOS CARDS COMPACTOS
	// =========================================================================
	let slideJudoca = $state(0);
	const TOTAL_SLIDES_JUDOCA = 3;

	let slideAcademia = $state(0);
	const TOTAL_SLIDES_ACADEMIA = 3;

	let slideConstancia = $state(0);
	const TOTAL_SLIDES_CONSTANCIA = 3;

	let paginaAgendaCard = $state(0);

	// Estados de pausa individual ao passar o mouse sobre cada card
	let pausadoAgenda = $state(false);
	let pausadoConstancia = $state(false);
	let pausadoJudoca = $state(false);
	let pausadoAcademia = $state(false);

	// Rotação automática escalonada dos carrosséis (pausa ao passar o mouse ou com popup aberto)
	$effect(() => {
		const timerConstancia = setInterval(() => {
			if (popupAtivo === null && !pausadoConstancia) {
				slideConstancia =
					(slideConstancia + 1) % TOTAL_SLIDES_CONSTANCIA;
			}
		}, 5000);

		const timerJudoca = setInterval(() => {
			if (popupAtivo === null && !pausadoJudoca) {
				slideJudoca = (slideJudoca + 1) % TOTAL_SLIDES_JUDOCA;
			}
		}, 5700);

		const timerAcademia = setInterval(() => {
			if (popupAtivo === null && !pausadoAcademia) {
				slideAcademia = (slideAcademia + 1) % TOTAL_SLIDES_ACADEMIA;
			}
		}, 6400);

		const timerAgenda = setInterval(() => {
			if (
				popupAtivo === null &&
				!pausadoAgenda &&
				totalPaginasAgenda > 1
			) {
				paginaAgendaCard = (paginaAgendaCard + 1) % totalPaginasAgenda;
			}
		}, 7000);

		return () => {
			clearInterval(timerConstancia);
			clearInterval(timerJudoca);
			clearInterval(timerAcademia);
			clearInterval(timerAgenda);
		};
	});

	function proximoSlide(
		atual: number,
		total: number,
		e?: MouseEvent,
	): number {
		e?.stopPropagation();
		return (atual + 1) % total;
	}

	function anteriorSlide(
		atual: number,
		total: number,
		e?: MouseEvent,
	): number {
		e?.stopPropagation();
		return (atual - 1 + total) % total;
	}

	const taxaAproveitamentoLutas = $derived(
		painel.metricasJudoca.totalLutas > 0
			? Math.round(
					(painel.metricasJudoca.totalVitorias /
						painel.metricasJudoca.totalLutas) *
						100,
				)
			: 0,
	);

	// =========================================================================
	// INTEGRAÇÃO DE COMPROMISSOS (TREINOS INSCRITOS + EVENTOS/DATAS)
	// =========================================================================
	interface CompromissoIntegrado {
		id: string;
		tipo: "treino" | "campeonato" | "graduacao";
		titulo: string;
		subtitulo: string;
		dataOuDia: string;
		destaqueTag: string;
		corTag: "emerald" | "amber" | "purple" | "pink" | "zinc";
		ehHoje: boolean;
		inscrito: boolean;
		href: string;
		ordem: number;
	}

	const mapaIndiceDiaSemana: Record<string, number> = {
		dom: 0,
		seg: 1,
		ter: 2,
		qua: 3,
		qui: 4,
		sex: 5,
		sab: 6,
		sáb: 6,
	};

	function calcularDiasParaProximoTreino(diaSemanaTexto: string): number {
		const hojeIdx = new Date().getDay();
		const txt = (diaSemanaTexto || "").toLowerCase();
		let menorDistancia = 7;
		for (const [token, idx] of Object.entries(mapaIndiceDiaSemana)) {
			if (txt.includes(token)) {
				const diff = (idx - hojeIdx + 7) % 7;
				if (diff < menorDistancia) menorDistancia = diff;
			}
		}
		return menorDistancia === 7 ? 0 : menorDistancia;
	}

	const compromissosIntegrados = $derived.by(() => {
		const itens: CompromissoIntegrado[] = [];

		// 1. Eventos (Campeonatos e Exames de Graduação), priorizando os que o judoca está inscrito
		for (const ev of painel.proximosEventos) {
			const dias =
				ev.dias_restantes !== undefined && ev.dias_restantes !== null
					? ev.dias_restantes
					: null;
			// Ignora eventos passados há mais de 7 dias no resumo rápido
			if (dias !== null && dias < -7) continue;

			const ehHoje = dias === 0;
			const inscrito = Boolean(ev.inscrito);
			let destaqueTag = inscrito
				? "Inscrito ✓"
				: ev.eh_campeonato
					? "Torneio"
					: "Exame";
			let corTag: CompromissoIntegrado["corTag"] = inscrito
				? "emerald"
				: ev.eh_campeonato
					? "amber"
					: "purple";

			if (ehHoje) {
				destaqueTag = "É Hoje!";
				corTag = "pink";
			} else if (dias === 1) {
				destaqueTag = inscrito ? "Amanhã • Inscrito" : "Amanhã";
			} else if (dias !== null && dias > 1 && dias <= 15) {
				destaqueTag = inscrito
					? `Em ${dias}d • Inscrito`
					: `Em ${dias} dias`;
			}

			itens.push({
				id: `ev-${ev.id_evento}`,
				tipo: ev.eh_campeonato ? "campeonato" : "graduacao",
				titulo: ev.nome,
				subtitulo: ev.eh_campeonato
					? "Campeonato Oficial"
					: "Exame de Faixa",
				dataOuDia: ev.data_inicio || "Data a definir",
				destaqueTag,
				corTag,
				ehHoje,
				inscrito,
				href: ev.eh_campeonato
					? `/dashboard/campeonatos/${ev.id_evento}`
					: `/dashboard/graduacoes/${ev.id_evento}`,
				ordem:
					(ehHoje ? 0 : inscrito ? 10 : 30) +
					(dias !== null && dias >= 0 ? Math.min(dias, 60) : 40),
			});
		}

		// 2. Treinos Semanais em que o judoca está matriculado
		for (const tr of painel.treinosInscritos) {
			const diasRestantes = calcularDiasParaProximoTreino(tr.dia_semana);
			const ehHoje = diasRestantes === 0;
			const destaqueTag = ehHoje
				? "Treino Hoje!"
				: diasRestantes === 1
					? "Amanhã"
					: "Matriculado";
			const corTag: CompromissoIntegrado["corTag"] = ehHoje
				? "pink"
				: diasRestantes === 1
					? "amber"
					: "emerald";

			itens.push({
				id: `tr-${tr.id_treino}`,
				tipo: "treino",
				titulo: tr.descricao,
				subtitulo: `Sensei ${tr.professores}`,
				dataOuDia: `${tr.dia_semana} • ${tr.horario_inicio}`,
				destaqueTag,
				corTag,
				ehHoje,
				inscrito: true,
				href: "/dashboard/turmas",
				ordem: (ehHoje ? 1 : 15) + diasRestantes,
			});
		}

		return itens.sort((a, b) => a.ordem - b.ordem);
	});

	const ITENS_POR_PAGINA_AGENDA = 3;
	const totalPaginasAgenda = $derived(
		Math.max(
			1,
			Math.ceil(compromissosIntegrados.length / ITENS_POR_PAGINA_AGENDA),
		),
	);
	const compromissosVisiveisCard = $derived(
		compromissosIntegrados.slice(
			paginaAgendaCard * ITENS_POR_PAGINA_AGENDA,
			(paginaAgendaCard + 1) * ITENS_POR_PAGINA_AGENDA,
		),
	);

	// =========================================================================
	// LINHA DO TEMPO DE GRADUAÇÕES E CONQUISTAS
	// =========================================================================
	let abaTimeline = $state<"graduacoes" | "conquistas">("graduacoes");
	let indiceGradSelecionado = $state<number | null>(null);

	const trilhaGraduacoesCompacta = $derived.by(() => {
		const lista = [...painel.graduacoes];
		const jaTemBranca = lista.some((g) =>
			g.faixa.toLowerCase().includes("branca"),
		);

		if (!jaTemBranca) {
			lista.unshift({
				faixa: "Branca",
				data_graduacao:
					(painel.judoca as Record<string, any>).data_inicio_br ||
					"Início no Tatame",
				nome_evento: "Ingresso no Tatame (Faixa Inicial)",
				nome_professor_homologador:
					painel.judoca.nome_professor_responsavel ||
					"Sensei do Dojo",
				grau_faixa_professor: null,
			} as (typeof painel.graduacoes)[number]);
		}

		return lista;
	});

	const gradSelecionada = $derived.by(() => {
		if (trilhaGraduacoesCompacta.length === 0) return null;
		const idx =
			indiceGradSelecionado !== null &&
			indiceGradSelecionado >= 0 &&
			indiceGradSelecionado < trilhaGraduacoesCompacta.length
				? indiceGradSelecionado
				: trilhaGraduacoesCompacta.length - 1;
		return { item: trilhaGraduacoesCompacta[idx], idx };
	});

	// =========================================================================
	// LINHA DO TEMPO DE CONQUISTAS (ESTEIRA COMPACTA & MODAL HALL DA FAMA)
	// =========================================================================
	let indiceConqSelecionado = $state<number | null>(null);
	let filtroTemporadaTrilha = $state<string>("recente");

	// Filtros do Modal da Galeria Completa (Hall da Fama)
	let filtroModalAno = $state<string>("todos");
	let filtroModalMedalha = $state<string>("todas");
	let buscaModalConquistas = $state<string>("");

	function extrairAnoData(dataStr?: string | null): number | null {
		if (!dataStr) return null;
		const partes = dataStr.split(/[\/\-]/);
		if (partes.length >= 3) {
			const num = parseInt(partes[2], 10);
			if (!isNaN(num)) return num < 100 ? 2000 + num : num;
		}
		const m = dataStr.match(/\b(20\d{2})\b/);
		return m ? parseInt(m[1], 10) : null;
	}

	const anosDisponiveisConquistas = $derived.by(() => {
		const setAnos = new Set<number>();
		for (const c of painel.conquistas) {
			const a = extrairAnoData(c.data_evento);
			if (a) setAnos.add(a);
		}
		return Array.from(setAnos).sort((a, b) => b - a);
	});

	// Conquistas exibidas na esteira horizontal compacta da página (por padrão temporada recente)
	const conquistasTrilha = $derived.by(() => {
		if (painel.conquistas.length === 0) return [];

		if (filtroTemporadaTrilha === "todas") {
			return painel.conquistas;
		}

		if (filtroTemporadaTrilha === "recente") {
			const anoMaisRecente = anosDisponiveisConquistas[0];
			if (anoMaisRecente) {
				const doAno = painel.conquistas.filter(
					(c) => extrairAnoData(c.data_evento) === anoMaisRecente
				);
				if (doAno.length > 0) return doAno.slice(0, 5);
			}
			return painel.conquistas.slice(0, 5);
		}

		const anoNum = parseInt(filtroTemporadaTrilha, 10);
		if (!isNaN(anoNum)) {
			return painel.conquistas.filter(
				(c) => extrairAnoData(c.data_evento) === anoNum
			);
		}

		return painel.conquistas.slice(0, 5);
	});

	const conqSelecionada = $derived.by(() => {
		if (conquistasTrilha.length === 0) return null;
		const idx =
			indiceConqSelecionado !== null &&
			indiceConqSelecionado >= 0 &&
			indiceConqSelecionado < conquistasTrilha.length
				? indiceConqSelecionado
				: 0;
		return { item: conquistasTrilha[idx], idx };
	});

	// Estatísticas da Galeria Completa (Modal)
	const metricasGaleria = $derived.by(() => {
		let ouros = 0;
		let pratas = 0;
		let bronzes = 0;
		let participacoes = 0;
		let totalLutas = 0;
		let totalVitorias = 0;

		for (const c of painel.conquistas) {
			if (c.tipo_medalha === "ouro") ouros++;
			else if (c.tipo_medalha === "prata") pratas++;
			else if (c.tipo_medalha === "bronze") bronzes++;
			else participacoes++;

			totalLutas += c.qtd_lutas || 0;
			totalVitorias += c.qtd_vitorias || 0;
		}

		const totalPodios = ouros + pratas + bronzes;
		const taxaVitoria = totalLutas > 0 ? Math.round((totalVitorias / totalLutas) * 100) : 0;

		return {
			ouros,
			pratas,
			bronzes,
			participacoes,
			totalPodios,
			totalLutas,
			totalVitorias,
			taxaVitoria,
		};
	});

	// Conquistas filtradas dentro do modal da Galeria Completa
	const conquistasModalFiltradas = $derived.by(() => {
		return painel.conquistas.filter((c) => {
			if (filtroModalAno !== "todos") {
				const ano = extrairAnoData(c.data_evento);
				if (ano !== parseInt(filtroModalAno, 10)) return false;
			}
			if (filtroModalMedalha !== "todas") {
				if (c.tipo_medalha !== filtroModalMedalha) return false;
			}
			if (buscaModalConquistas.trim()) {
				const q = buscaModalConquistas.toLowerCase().trim();
				const nome = (c.nome_campeonato || "").toLowerCase();
				const ed = (c.edicao || "").toLowerCase();
				const clas = (c.classificacao || "").toLowerCase();
				if (!nome.includes(q) && !ed.includes(q) && !clas.includes(q)) {
					return false;
				}
			}
			return true;
		});
	});
</script>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 0. BARRA DE ALERTAS COMPACTA (ESTILO NOTIFICAÇÕES MOBILE)                 -->
	<!-- ========================================================================= -->
	{#if mostrarAlertas}
		<BarraAlertasNotificacao
			pendenciasJudoca={painel.pendencias}
			escopo="aluno"
		/>
	{/if}

	<!-- ========================================================================= -->
	<!-- 1. PASSAPORTE DIGITAL DO JUDOCA & TERMÔMETRO DE CARÊNCIA DE FAIXA         -->
	<!-- ========================================================================= -->
	<PassaporteJudoca
		nome={painel.judoca.nome}
		matricula={painel.judoca.matricula}
		faixaAtual={painel.judoca.graduacao_atual}
		categoria={painel.judoca.categoria}
		peso={painel.judoca.peso}
		nomeSensei={painel.judoca.nome_professor_responsavel}
		nomeAcademia={nomeDojo}
		dataReferenciaGraduacao={painel.judoca.data_ultima_graduacao_br}
		tempoJudo={painel.judoca.tempo_judo}
		tempoFaixaAtual={painel.judoca.tempo_faixa_atual}
	/>

	<!-- ========================================================================= -->
	<!-- 2. LAYOUT PRINCIPAL: CALENDÁRIO INTEGRADO À ESQUERDA + CARDS À DIREITA    -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
		<!-- COLUNA LATERAL DIREITA (1/3): 4 CARDS COMPACTOS EMPILHADOS -->
		<div class="lg:col-span-1 lg:order-2 space-y-5">
			<!-- ===================================================================== -->
			<!-- CARD 1: CALENDÁRIO MENSAL DO TATAME & EVENTOS (COMPACTO + POPUP)      -->
			<!-- ===================================================================== -->
			<CalendarioTatameMensal
				compacto={true}
				sessoes={painel.presencas || []}
				turmasMatriculadas={painel.treinosInscritos || []}
				eventosCalendario={painel.proximosEventos || []}
				titulo="Calendário do Tatame"
				onExpandir={() => {
					abaPopupAgenda = "calendario";
					popupAtivo = "agenda";
				}}
			/>

			<!-- ===================================================================== -->
			<!-- CARD 2: MINHA CONSTÂNCIA NO TATAME (ESTILO CARROSSEL + POPUP)         -->
			<!-- ===================================================================== -->
			{#if painel.metricasPresenca}
				{@const mp = painel.metricasPresenca}
				<div
					role="button"
					tabindex="0"
					onmouseenter={() => (pausadoConstancia = true)}
					onmouseleave={() => (pausadoConstancia = false)}
					onclick={() => (popupAtivo = "constancia")}
					onkeydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							popupAtivo = "constancia";
						}
					}}
					class="group p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-amber-700/70 shadow-sm space-y-4 transition-all cursor-pointer flex flex-col justify-between text-left overflow-hidden"
				>
					<div class="space-y-4">
						<!-- Cabeçalho do Card -->
						<div
							class="flex items-center justify-between gap-2 pb-3 border-b border-zinc-900"
						>
							<div class="flex items-center gap-2.5 min-w-0 flex-1">
								<div
									class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0"
								>
									<Flame class="w-4 h-4 text-amber-400" />
								</div>
								<div class="min-w-0 flex-1">
									<h2
										class="text-sm font-bold text-white font-display leading-snug"
									>
										Presença no Tatame
									</h2>
									<p class="text-[11px] text-zinc-400 leading-snug mt-0.5">
										Frequência, sequência e meta
									</p>
								</div>
							</div>

							<!-- Badge & Expandir -->
							<div class="flex items-center gap-1.5 shrink-0">
								<span
									class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-800 text-amber-300 shrink-0"
									title="Sequência atual de treinos"
								>
									🔥 {mp.streak_atual}
								</span>
								<span
									class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-800/60 transition-colors"
									title="Expandir Presença no Tatame"
								>
									<Maximize2 class="w-3.5 h-3.5" />
								</span>
							</div>
						</div>

						<!-- Corpo do Carrossel (3 Slides) -->
						{#if slideConstancia === 0}
							<!-- Slide 1: Taxa de Presença Geral & Aulas Concluídas -->
							<div
								class="space-y-3 animate-in fade-in duration-200"
							>
								<div class="grid grid-cols-2 gap-3">
									<div
										class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
									>
										<span
											class="text-[10px] font-mono uppercase text-zinc-500 block"
											>Presença Geral</span
										>
										<span
											class="text-2xl font-black font-display text-emerald-400 block"
										>
											{mp.percentual_presenca}%
										</span>
										<div
											class="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden"
										>
											<div
												class="h-full rounded-full bg-emerald-500"
												style="width: {Math.min(
													100,
													mp.percentual_presenca,
												)}%"
											></div>
										</div>
									</div>

									<div
										class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
									>
										<span
											class="text-[10px] font-mono uppercase text-zinc-500 block"
											>Aulas Concluídas</span
										>
										<div
											class="flex items-baseline gap-1.5"
										>
											<span
												class="text-2xl font-black font-display text-white"
											>
												{mp.total_presentes}
											</span>
											<span
												class="text-[11px] font-mono text-zinc-500"
											>
												/{mp.total_aulas}
											</span>
										</div>
										<span
											class="text-[10px] font-mono text-zinc-400 block"
										>
											Em {mp.dias_distintos_treinados} dia(s)
											distintos
										</span>
									</div>
								</div>
							</div>
						{:else if slideConstancia === 1}
							<!-- Slide 2: Frequência neste Mês & Justificadas/Faltas -->
							<div
								class="space-y-3 animate-in fade-in duration-200"
							>
								<div class="grid grid-cols-2 gap-3">
									<div
										class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
									>
										<span
											class="text-[10px] font-mono uppercase text-zinc-500 block"
											>Frequência no Mês</span
										>
										<div
											class="flex items-baseline gap-1.5"
										>
											<span
												class="text-2xl font-black font-display text-amber-400"
											>
												{mp.percentual_mes_atual}%
											</span>
											<span
												class="text-[11px] font-mono text-zinc-500"
											>
												({mp.presentes_mes_atual}/{mp.aulas_mes_atual})
											</span>
										</div>
										<span
											class="text-[10px] font-mono text-zinc-400 block"
										>
											Mês vigente no tatame
										</span>
									</div>

									<div
										class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
									>
										<span
											class="text-[10px] font-mono uppercase text-zinc-500 block"
											>Histórico de Ausências</span
										>
										<div
											class="flex items-center gap-3 pt-1 text-xs font-mono"
										>
											<div>
												<span
													class="text-[10px] text-zinc-500 block"
													>Justif.</span
												>
												<strong
													class="text-sky-400 text-base"
													>{mp.total_justificadas}</strong
												>
											</div>
											<div
												class="h-6 w-px bg-zinc-800"
											></div>
											<div>
												<span
													class="text-[10px] text-zinc-500 block"
													>Faltas</span
												>
												<strong
													class="text-red-400 text-base"
													>{mp.total_faltas}</strong
												>
											</div>
										</div>
									</div>
								</div>
							</div>
						{:else}
							<!-- Slide 3: Sequência (Streak) & Meta Próxima Graduação -->
							<div
								class="space-y-3 animate-in fade-in duration-200"
							>
								<div class="grid grid-cols-2 gap-3">
									<div
										class="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-1"
									>
										<span
											class="text-[10px] font-mono uppercase text-amber-400/90 block"
											>Sequência Atual</span
										>
										<div
											class="flex items-baseline gap-1.5"
										>
											<span
												class="text-2xl font-black font-display text-amber-300"
											>
												{mp.streak_atual}
											</span>
											<span
												class="text-[11px] font-mono text-amber-400/80"
											>
												seguidos
											</span>
										</div>
										<span
											class="text-[10px] font-mono text-zinc-400 block"
										>
											Recorde pessoal: <strong
												class="text-white"
												>{mp.maior_streak}</strong
											>
										</span>
									</div>

									<div
										class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
									>
										<span
											class="text-[10px] font-mono uppercase text-zinc-500 block"
											>Meta Próx. Exame</span
										>
										{#if mp.proximo_exame_meta && (mp.proximo_exame_meta.qtd_minima_aulas > 0 || mp.proximo_exame_meta.percentual_minimo > 0)}
											<span
												class="text-sm font-bold {mp
													.proximo_exame_meta
													.apto_frequencia
													? 'text-emerald-400'
													: 'text-amber-300'} block pt-0.5"
											>
												{mp.proximo_exame_meta
													.apto_frequencia
													? "Meta Atingida ✓"
													: "Em Progresso"}
											</span>
											<span
												class="text-[10px] font-mono text-zinc-400 block truncate"
											>
												{mp.total_presentes}/{mp
													.proximo_exame_meta
													.qtd_minima_aulas} aulas
											</span>
										{:else}
											<span
												class="text-sm font-bold text-zinc-200 block pt-0.5"
											>
												Constância Livre
											</span>
											<span
												class="text-[10px] font-mono text-zinc-500 block"
											>
												Meta ideal: &ge; 80%
											</span>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Rodapé do Carrossel com Setas + Bolinhas Indicadoras -->
					<div
						class="pt-2.5 border-t border-zinc-900 flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400"
					>
						<div class="flex items-center gap-1.5 min-w-0">
							<button
								type="button"
								onclick={(e) =>
									(slideConstancia = anteriorSlide(
										slideConstancia,
										TOTAL_SLIDES_CONSTANCIA,
										e,
									))}
								class="p-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
								title="Slide anterior"
							>
								<ChevronLeft class="w-3 h-3" />
							</button>
							{#each [0, 1, 2] as idx}
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										slideConstancia = idx;
									}}
									aria-label="Ir para slide {idx + 1}"
									class="h-1.5 rounded-full transition-all shrink-0 {slideConstancia ===
									idx
										? 'w-4 bg-amber-400'
										: 'w-1.5 bg-zinc-700 hover:bg-zinc-500'}"
								></button>
							{/each}
							<button
								type="button"
								onclick={(e) =>
									(slideConstancia = proximoSlide(
										slideConstancia,
										TOTAL_SLIDES_CONSTANCIA,
										e,
									))}
								class="p-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
								title="Próximo slide"
							>
								<ChevronRight class="w-3 h-3" />
							</button>
							<span class="text-[10px] text-zinc-500 ml-0.5 truncate">
								{slideConstancia === 0
									? "Assiduidade Geral"
									: slideConstancia === 1
										? "Resumo Mensal"
										: "Sequência & Meta"}
							</span>
						</div>
						<span
							class="text-amber-400 group-hover:text-amber-300 font-semibold inline-flex items-center gap-1 shrink-0"
						>
							<span>Detalhes</span>
							<ArrowRight class="w-3 h-3" />
						</span>
					</div>
				</div>
			{/if}

			<!-- ===================================================================== -->
			<!-- CARD 3: SHIAI SEISEKI (ESTILO CARROSSEL + POPUP)                      -->
			<!-- ===================================================================== -->
			<div
				role="button"
				tabindex="0"
				onmouseenter={() => (pausadoJudoca = true)}
				onmouseleave={() => (pausadoJudoca = false)}
				onclick={() => (popupAtivo = "metricas_judoca")}
				onkeydown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						popupAtivo = "metricas_judoca";
					}
				}}
				class="group p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-red-800/70 shadow-sm space-y-4 transition-all cursor-pointer flex flex-col justify-between text-left overflow-hidden"
			>
				<div class="space-y-4">
					<div
						class="flex items-center justify-between gap-2 pb-3 border-b border-zinc-900"
					>
						<div class="flex items-center gap-2.5 min-w-0 flex-1">
							<div
								class="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0"
							>
								<Award class="w-4 h-4 text-red-400" />
							</div>
							<div class="min-w-0 flex-1">
								<h2
									class="text-sm font-bold text-white font-display leading-snug"
								>
									Shiai Seiseki
								</h2>
								<p class="text-[11px] text-zinc-400 leading-snug mt-0.5">
									Desempenho em Competição
								</p>
							</div>
						</div>

						<div class="flex items-center gap-1.5 shrink-0">
							{#if painel.metricasJudoca.totalMedalhas > 0}
								<span
									class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-800 text-amber-300 shrink-0"
									title="Total de medalhas conquistadas"
								>
									🏅 {painel.metricasJudoca.totalMedalhas}
								</span>
							{/if}
							<span
								class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-red-400 group-hover:border-red-800/60 transition-colors"
								title="Expandir Shiai Seiseki"
							>
								<Maximize2 class="w-3.5 h-3.5" />
							</span>
						</div>
					</div>

					{#if slideJudoca === 0}
						<!-- Slide 1: Treinos Inscritos & Torneios Disputados -->
						<div
							class="grid grid-cols-2 gap-3 animate-in fade-in duration-200"
						>
							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 block"
									>Treinos Inscritos</span
								>
								<div class="flex items-baseline gap-1.5">
									<span
										class="text-2xl font-black font-display text-white"
									>
										{painel.metricasJudoca
											.totalTreinosInscritos}
									</span>
									<span
										class="text-[11px] text-zinc-400 font-mono"
										>turma(s)</span
									>
								</div>
								<span
									class="text-[10px] font-mono text-zinc-500 block"
									>Grade semanal ativa</span
								>
							</div>

							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 block"
									>Torneios Disputados</span
								>
								<div class="flex items-baseline gap-1.5">
									<span
										class="text-2xl font-black font-display text-white"
									>
										{painel.metricasJudoca.totalCampeonatos}
									</span>
									<span
										class="text-[11px] text-zinc-400 font-mono"
										>edições</span
									>
								</div>
								<span
									class="text-[10px] font-mono text-zinc-500 block"
									>Competições oficiais</span
								>
							</div>
						</div>
					{:else if slideJudoca === 1}
						<!-- Slide 2: Quadro de Medalhas (Ouro, Prata, Bronze) -->
						<div
							class="grid grid-cols-3 gap-2 text-center animate-in fade-in duration-200"
						>
							<div
								class="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40"
							>
								<span class="text-sm block">🥇</span>
								<span
									class="text-lg font-black font-display text-amber-300 block leading-tight"
								>
									{painel.metricasJudoca.totalOuro}
								</span>
								<span
									class="text-[10px] font-mono text-amber-400/80 uppercase"
									>Ouro</span
								>
							</div>
							<div
								class="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50"
							>
								<span class="text-sm block">🥈</span>
								<span
									class="text-lg font-black font-display text-zinc-200 block leading-tight"
								>
									{painel.metricasJudoca.totalPrata}
								</span>
								<span
									class="text-[10px] font-mono text-zinc-400 uppercase"
									>Prata</span
								>
							</div>
							<div
								class="p-2.5 rounded-xl bg-orange-950/20 border border-orange-900/40"
							>
								<span class="text-sm block">🥉</span>
								<span
									class="text-lg font-black font-display text-orange-300 block leading-tight"
								>
									{painel.metricasJudoca.totalBronze}
								</span>
								<span
									class="text-[10px] font-mono text-orange-400/80 uppercase"
									>Bronze</span
								>
							</div>
						</div>
					{:else}
						<!-- Slide 3: Lutas Realizadas, Vitórias e Aproveitamento -->
						<div
							class="grid grid-cols-2 gap-3 animate-in fade-in duration-200"
						>
							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 block"
									>Combates no Shiai</span
								>
								<div class="flex items-baseline gap-1.5">
									<span
										class="text-2xl font-black font-display text-white"
									>
										{painel.metricasJudoca.totalLutas}
									</span>
									<span
										class="text-[11px] font-mono text-zinc-400"
										>lutas</span
									>
								</div>
								<span
									class="text-[10px] font-mono text-emerald-400 block"
								>
									{painel.metricasJudoca.totalVitorias} vitória(s)
								</span>
							</div>

							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 block"
									>Aproveitamento</span
								>
								<span
									class="text-2xl font-black font-display text-emerald-400 block"
								>
									{taxaAproveitamentoLutas}%
								</span>
								<div
									class="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden"
								>
									<div
										class="h-full rounded-full bg-emerald-500"
										style="width: {taxaAproveitamentoLutas}%"
									></div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div
					class="pt-2.5 border-t border-zinc-900 flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400"
				>
					<div class="flex items-center gap-1.5 min-w-0">
						<button
							type="button"
							onclick={(e) =>
								(slideJudoca = anteriorSlide(
									slideJudoca,
									TOTAL_SLIDES_JUDOCA,
									e,
								))}
							class="p-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
							title="Slide anterior"
						>
							<ChevronLeft class="w-3 h-3" />
						</button>
						{#each [0, 1, 2] as idx}
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									slideJudoca = idx;
								}}
								aria-label="Ir para slide {idx + 1}"
								class="h-1.5 rounded-full transition-all shrink-0 {slideJudoca ===
								idx
									? 'w-4 bg-red-500'
									: 'w-1.5 bg-zinc-700 hover:bg-zinc-500'}"
							></button>
						{/each}
						<button
							type="button"
							onclick={(e) =>
								(slideJudoca = proximoSlide(
									slideJudoca,
									TOTAL_SLIDES_JUDOCA,
									e,
								))}
							class="p-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
							title="Próximo slide"
						>
							<ChevronRight class="w-3 h-3" />
						</button>
						<span class="text-[10px] text-zinc-500 ml-0.5 truncate">
							{slideJudoca === 0
								? "Treinos & Torneios"
								: slideJudoca === 1
									? "Quadro de Medalhas"
									: "Combates & Vitórias"}
						</span>
					</div>
					<span
						class="text-red-400 group-hover:text-red-300 font-semibold inline-flex items-center gap-1 shrink-0"
					>
						<span>Detalhes</span>
						<ArrowRight class="w-3 h-3" />
					</span>
				</div>
			</div>

			<!-- ===================================================================== -->
			<!-- CARD 4: MÉTRICAS DA ACADEMIA (ESTILO CARROSSEL + POPUP)               -->
			<!-- ===================================================================== -->
			<div
				role="button"
				tabindex="0"
				onmouseenter={() => (pausadoAcademia = true)}
				onmouseleave={() => (pausadoAcademia = false)}
				onclick={() => (popupAtivo = "metricas_academia")}
				onkeydown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						popupAtivo = "metricas_academia";
					}
				}}
				class="group p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-amber-700/70 shadow-sm space-y-4 transition-all cursor-pointer flex flex-col justify-between text-left overflow-hidden"
			>
				<div class="space-y-4">
					<div
						class="flex items-center justify-between gap-2 pb-3 border-b border-zinc-900"
					>
						<div class="flex items-center gap-2.5 min-w-0 flex-1">
							<div
								class="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0"
							>
								<Trophy class="w-4 h-4 text-amber-400" />
							</div>
							<div class="min-w-0 flex-1">
								<h2
									class="text-sm font-bold text-white font-display leading-snug"
									title="Métricas do Dojo ({nomeDojo})"
								>
									Métricas do Dojo
								</h2>
								<p class="text-[11px] text-zinc-400 leading-snug mt-0.5 truncate">
									{nomeDojo} • Força coletiva
								</p>
							</div>
						</div>

						<div class="flex items-center gap-1.5 shrink-0">
							<span
								class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-800/60 transition-colors"
								title="Expandir Métricas do Dojo"
							>
								<Maximize2 class="w-3.5 h-3.5" />
							</span>
						</div>
					</div>

					{#if slideAcademia === 0}
						<!-- Slide 1: Judocas Cadastrados & Treinos na Grade -->
						<div
							class="grid grid-cols-2 gap-3 animate-in fade-in duration-200"
						>
							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 block"
									>Judocas no Dojo</span
								>
								<div class="flex items-baseline gap-1.5">
									<span
										class="text-2xl font-black font-display text-white"
									>
										{painel.metricasAcademia.totalAlunos}
									</span>
									<span
										class="text-[11px] text-zinc-400 font-mono"
										>atletas</span
									>
								</div>
								<span
									class="text-[10px] font-mono text-zinc-500 block"
									>Comunidade ativa</span
								>
							</div>

							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 block"
									>Treinos na Grade</span
								>
								<div class="flex items-baseline gap-1.5">
									<span
										class="text-2xl font-black font-display text-white"
									>
										{painel.metricasAcademia
											.totalTreinosDisponiveis}
									</span>
									<span
										class="text-[11px] text-zinc-400 font-mono"
										>horários</span
									>
								</div>
								<span
									class="text-[10px] font-mono text-zinc-500 block"
									>Turmas semanais</span
								>
							</div>
						</div>
					{:else if slideAcademia === 1}
						<!-- Slide 2: Torneios Disputados & Medalhas do Dojo -->
						<div
							class="grid grid-cols-2 gap-3 animate-in fade-in duration-200"
						>
							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 block"
									>Torneios do Dojo</span
								>
								<div class="flex items-baseline gap-1.5">
									<span
										class="text-2xl font-black font-display text-amber-400"
									>
										{painel.metricasAcademia
											.totalTrofeusCampeonatos}
									</span>
									<span
										class="text-[11px] text-zinc-400 font-mono"
										>eventos</span
									>
								</div>
								<span
									class="text-[10px] font-mono text-zinc-500 block"
									>Histórico oficial</span
								>
							</div>

							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 block"
									>Medalhas do Dojo</span
								>
								<div class="flex items-baseline gap-1.5">
									<span
										class="text-2xl font-black font-display text-amber-300"
									>
										{painel.metricasAcademia
											.totalMedalhasAlunos}
									</span>
									<span
										class="text-[11px] text-zinc-400 font-mono"
										>pódios</span
									>
								</div>
								<span
									class="text-[10px] font-mono text-zinc-500 block"
									>Conquistas coletivas</span
								>
							</div>
						</div>
					{:else}
						<!-- Slide 3: Quadro de Senseis & Mestres -->
						<div
							class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2 animate-in fade-in duration-200"
						>
							<div class="flex items-center justify-between">
								<span
									class="text-[10px] font-mono uppercase text-zinc-400 font-bold"
								>
									Quadro Técnico de Senseis
								</span>
								<span
									class="text-xs font-mono font-bold text-amber-400"
								>
									{painel.metricasAcademia.senseis.length} mestre(s)
								</span>
							</div>
							<div class="flex flex-wrap gap-1.5">
								{#each painel.metricasAcademia.senseis.slice(0, 4) as sensei}
									<span
										class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-200"
									>
										<span
											class="w-1.5 h-1.5 rounded-full bg-red-500"
										></span>
										<span class="truncate max-w-[120px]"
											>{sensei.nome}</span
										>
									</span>
								{/each}
								{#if painel.metricasAcademia.senseis.length > 4}
									<span
										class="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400"
									>
										+{painel.metricasAcademia.senseis
											.length - 4}
									</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<div
					class="pt-2.5 border-t border-zinc-900 flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400"
				>
					<div class="flex items-center gap-1.5 min-w-0">
						<button
							type="button"
							onclick={(e) =>
								(slideAcademia = anteriorSlide(
									slideAcademia,
									TOTAL_SLIDES_ACADEMIA,
									e,
								))}
							class="p-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
							title="Slide anterior"
						>
							<ChevronLeft class="w-3 h-3" />
						</button>
						{#each [0, 1, 2] as idx}
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									slideAcademia = idx;
								}}
								aria-label="Ir para slide {idx + 1}"
								class="h-1.5 rounded-full transition-all shrink-0 {slideAcademia ===
								idx
									? 'w-4 bg-amber-400'
									: 'w-1.5 bg-zinc-700 hover:bg-zinc-500'}"
							></button>
						{/each}
						<button
							type="button"
							onclick={(e) =>
								(slideAcademia = proximoSlide(
									slideAcademia,
									TOTAL_SLIDES_ACADEMIA,
									e,
								))}
							class="p-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
							title="Próximo slide"
						>
							<ChevronRight class="w-3 h-3" />
						</button>
						<span class="text-[10px] text-zinc-500 ml-0.5 truncate">
							{slideAcademia === 0
								? "Atletas & Grade"
								: slideAcademia === 1
									? "Troféus & Pódios"
									: "Quadro de Senseis"}
						</span>
					</div>
					<span
						class="text-amber-400 group-hover:text-amber-300 font-semibold inline-flex items-center gap-1 shrink-0"
					>
						<span>Detalhes</span>
						<ArrowRight class="w-3 h-3" />
					</span>
				</div>
			</div>
		</div>
		<!-- FIM DA COLUNA LATERAL DIREITA -->

		<!-- COLUNA PRINCIPAL (2/3 À ESQUERDA): LINHA DO TEMPO & FILOSOFIA -->
		<div class="lg:col-span-2 lg:order-1 space-y-6">
			<!-- ===================================================================== -->
			<!-- 3. DUAS LINHAS DO TEMPO: GRADUAÇÕES (DAN/KYU) vs CONQUISTAS ESPORTIVAS-->
			<!-- ===================================================================== -->
			<div
				class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6"
			>
				<div
					class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900"
				>
					<div>
						<h2
							class="text-base sm:text-lg font-bold text-white font-display"
						>
							Linha do Tempo do Judoca
						</h2>
						<p class="text-xs text-zinc-400 mt-0.5">
							Acompanhe seu progresso de faixas ou a galeria de
							medalhas conquistadas.
						</p>
					</div>

					<!-- Botões de Alternância das Linhas do Tempo -->
					<div
						class="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto"
					>
						<button
							type="button"
							onclick={() => (abaTimeline = "graduacoes")}
							class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 {abaTimeline ===
							'graduacoes'
								? 'bg-red-600 text-white shadow-sm'
								: 'text-zinc-400 hover:text-white'}"
						>
							<Award class="w-3.5 h-3.5" />
							<span>Graduações ({painel.graduacoes.length})</span>
						</button>
						<button
							type="button"
							onclick={() => (abaTimeline = "conquistas")}
							class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 {abaTimeline ===
							'conquistas'
								? 'bg-red-600 text-white shadow-sm'
								: 'text-zinc-400 hover:text-white'}"
						>
							<Trophy class="w-3.5 h-3.5" />
							<span
								>Conquistas & Pódios ({painel.conquistas
									.length})</span
							>
						</button>
					</div>
				</div>

				<!-- ABA 1: TRILHA HORIZONTAL COMPACTA DE GRADUAÇÕES (DAN/KYU) -->
				{#if abaTimeline === "graduacoes"}
					<div class="space-y-4">
						<div class="overflow-x-auto pb-2">
							<div
								class="inline-flex items-start min-w-full px-1 pt-1"
							>
								{#each trilhaGraduacoesCompacta as grad, idx}
									{@const selecionada =
										gradSelecionada?.idx === idx}
									{@const ehUltima =
										idx ===
										trilhaGraduacoesCompacta.length - 1}

									<div class="flex items-center shrink-0">
										<button
											type="button"
											onclick={() =>
												(indiceGradSelecionado = idx)}
											class="group flex flex-col items-center gap-2 px-2.5 py-2 rounded-xl border transition-all cursor-pointer {selecionada
												? 'bg-red-950/30 border-red-700/70 shadow-sm'
												: 'bg-zinc-900/30 border-transparent hover:bg-zinc-900/70 hover:border-zinc-800'}"
										>
											<div
												class="flex items-center gap-1.5"
											>
												<span
													class="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125 {selecionada
														? 'bg-red-500 ring-4 ring-red-500/20'
														: ehUltima
															? 'bg-amber-400'
															: 'bg-zinc-600'}"
												></span>
												<span
													class="text-[10px] font-mono text-zinc-500"
												>
													#{idx + 1}
												</span>
											</div>

											<BadgeFaixa
												faixa={grad.faixa}
												size="sm"
												uniformWidth={false}
											/>

											<span
												class="text-[10px] font-mono text-zinc-400 whitespace-nowrap"
											>
												{grad.data_graduacao}
											</span>
										</button>

										{#if idx < trilhaGraduacoesCompacta.length - 1}
											<div
												class="w-5 sm:w-8 h-[2px] bg-zinc-800 shrink-0 mx-0.5"
											></div>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						{#if gradSelecionada}
							{@const g = gradSelecionada.item}
							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
							>
								<div
									class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
								>
									<div class="flex items-center gap-2">
										<BadgeFaixa
											faixa={g.faixa}
											size="sm"
											uniformWidth={false}
										/>
										<span class="font-bold text-white">
											{g.nome_evento ||
												"Exame Oficial de Graduação"}
										</span>
									</div>
									<span
										class="text-zinc-400 font-mono text-[11px]"
									>
										Data: <strong class="text-zinc-200"
											>{g.data_graduacao}</strong
										>
									</span>
									<span
										class="text-zinc-400 font-mono text-[11px]"
									>
										Sensei: <strong class="text-zinc-200"
											>{g.nome_professor_homologador}</strong
										>
										{#if g.grau_faixa_professor}
											<span class="text-zinc-500"
												>({g.grau_faixa_professor})</span
											>
										{/if}
									</span>
								</div>

								<a
									href="/dashboard/minhas-graduacoes"
									class="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors shrink-0"
								>
									<span>Ver linha completa</span>
									<ArrowRight class="w-3.5 h-3.5" />
								</a>
							</div>
						{/if}
					</div>
				{/if}

				<!-- ABA 2: LINHA DO TEMPO COM AS CONQUISTAS (CAMPEONATOS) -->
				{#if abaTimeline === "conquistas"}
					{#if painel.conquistas.length > 0}
						<div class="space-y-4">
							<!-- Barra de Período e Ação da Galeria Completa -->
							<div
								class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1"
							>
								<!-- Filtro Rápido de Período -->
								<div
									class="flex flex-wrap items-center gap-1.5 text-xs"
								>
									<span
										class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1"
										>Período:</span
									>
									<button
										type="button"
										onclick={() => {
											filtroTemporadaTrilha = "recente";
											indiceConqSelecionado = 0;
										}}
										class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {filtroTemporadaTrilha ===
										'recente'
											? 'bg-amber-950/40 text-amber-300 border border-amber-800/80 shadow-sm'
											: 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'}"
									>
										Temporada Atual
									</button>
									{#each anosDisponiveisConquistas as ano}
										<button
											type="button"
											onclick={() => {
												filtroTemporadaTrilha = String(ano);
												indiceConqSelecionado = 0;
											}}
											class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {filtroTemporadaTrilha ===
											String(ano)
												? 'bg-amber-950/40 text-amber-300 border border-amber-800/80 shadow-sm'
												: 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'}"
										>
											{ano}
										</button>
									{/each}
									{#if painel.conquistas.length > 4}
										<button
											type="button"
											onclick={() => {
												filtroTemporadaTrilha = "todas";
												indiceConqSelecionado = 0;
											}}
											class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {filtroTemporadaTrilha ===
											'todas'
												? 'bg-amber-950/40 text-amber-300 border border-amber-800/80 shadow-sm'
												: 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'}"
										>
											Todas ({painel.conquistas.length})
										</button>
									{/if}
								</div>

								<!-- Ação: Abrir Galeria / Hall da Fama -->
								<button
									type="button"
									onclick={() => (popupAtivo = "galeria_conquistas")}
									class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
								>
									<Trophy class="w-3.5 h-3.5" />
									<span>Ver Galeria Completa ({painel.conquistas.length})</span>
								</button>
							</div>

							<!-- Trilha Horizontal Compacta de Conquistas (Estilo Faixas) -->
							<div class="overflow-x-auto pb-2">
								<div
									class="inline-flex items-start min-w-full px-1 pt-1"
								>
									{#each conquistasTrilha as conq, idx}
										{@const selecionada =
											conqSelecionada?.idx === idx}
										{@const ehUltima =
											idx === conquistasTrilha.length - 1}

										<div class="flex items-center shrink-0">
											<button
												type="button"
												onclick={() =>
													(indiceConqSelecionado = idx)}
												class="group flex flex-col items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer {selecionada
													? 'bg-amber-950/30 border-amber-600/70 shadow-sm'
													: 'bg-zinc-900/30 border-transparent hover:bg-zinc-900/70 hover:border-zinc-800'}"
											>
												<div
													class="flex items-center gap-1.5"
												>
													<span
														class="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125 {conq.tipo_medalha ===
														'ouro'
															? 'bg-amber-400 ring-4 ring-amber-400/20'
															: conq.tipo_medalha ===
																  'prata'
																? 'bg-zinc-300 ring-4 ring-zinc-300/20'
																: conq.tipo_medalha ===
																	  'bronze'
																	? 'bg-orange-400 ring-4 ring-orange-400/20'
																	: 'bg-zinc-500 ring-4 ring-zinc-500/20'}"
													></span>
													<span
														class="text-[10px] font-mono text-zinc-500"
													>
														#{idx + 1}
													</span>
												</div>

												<!-- Badge da Medalha -->
												<span
													class="px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap {conq.tipo_medalha ===
													'ouro'
														? 'bg-amber-950/70 text-amber-300 border border-amber-800'
														: conq.tipo_medalha ===
															  'prata'
															? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
															: conq.tipo_medalha ===
																  'bronze'
																? 'bg-orange-950/70 text-orange-300 border border-orange-800'
																: 'bg-zinc-800 text-zinc-400 border border-zinc-700'}"
												>
													{conq.tipo_medalha === 'ouro'
														? '🥇 Ouro'
														: conq.tipo_medalha === 'prata'
															? '🥈 Prata'
															: conq.tipo_medalha === 'bronze'
																? '🥉 Bronze'
																: '🥋 Part.'}
												</span>

												<span
													class="text-[10px] font-semibold text-white max-w-[110px] truncate text-center"
													title={conq.nome_campeonato}
												>
													{conq.nome_campeonato}
												</span>

												<span
													class="text-[10px] font-mono text-zinc-400 whitespace-nowrap"
												>
													{conq.data_evento}
												</span>
											</button>

											{#if idx < conquistasTrilha.length - 1}
												<div
													class="w-5 sm:w-8 h-[2px] bg-zinc-800 shrink-0 mx-0.5"
												></div>
											{/if}
										</div>
									{/each}

									{#if painel.conquistas.length > conquistasTrilha.length}
										<div class="flex items-center shrink-0">
											<div
												class="w-5 sm:w-8 h-[2px] bg-zinc-800 shrink-0 mx-0.5"
											></div>
											<button
												type="button"
												onclick={() => (popupAtivo = "galeria_conquistas")}
												class="flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/60 hover:border-amber-700/50 text-zinc-400 hover:text-amber-300 transition-all cursor-pointer h-full"
											>
												<Trophy class="w-4 h-4 text-amber-400/80" />
												<span class="text-[10px] font-mono font-bold">
													+{painel.conquistas.length - conquistasTrilha.length} mais
												</span>
												<span class="text-[9px] text-zinc-500 whitespace-nowrap">
													Ver todas
												</span>
											</button>
										</div>
									{/if}
								</div>
							</div>

							<!-- Card Detalhado da Conquista Selecionada -->
							{#if conqSelecionada}
								{@const c = conqSelecionada.item}
								<div
									class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
								>
									<div
										class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs"
									>
										<div class="flex items-center gap-2">
											<span
												class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold {c.tipo_medalha ===
												'ouro'
													? 'bg-amber-950/70 text-amber-300 border border-amber-800'
													: c.tipo_medalha ===
														  'prata'
														? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
														: c.tipo_medalha ===
															  'bronze'
															? 'bg-orange-950/70 text-orange-300 border border-orange-800'
															: 'bg-zinc-800 text-zinc-400 border border-zinc-700'}"
											>
												{c.classificacao}
											</span>
											<span class="font-bold text-white">
												{c.nome_campeonato}
												{c.edicao ? `(${c.edicao})` : ""}
											</span>
										</div>
										<span
											class="text-zinc-400 font-mono text-[11px]"
										>
											Data: <strong class="text-zinc-200"
												>{c.data_evento}</strong
											>
										</span>
										<span
											class="text-zinc-400 font-mono text-[11px]"
										>
											Lutas: <strong class="text-zinc-200"
												>{c.qtd_lutas}</strong
											>
										</span>
										<span
											class="text-zinc-400 font-mono text-[11px]"
										>
											Vitórias: <strong
												class="text-emerald-400"
												>{c.qtd_vitorias}</strong
											>
										</span>
									</div>

									<div class="flex items-center gap-3 shrink-0">
										{#if c.id_campeonato}
											<a
												href="/dashboard/campeonatos/{c.id_campeonato}"
												class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
											>
												<span>Ver torneio</span>
												<ArrowRight class="w-3.5 h-3.5" />
											</a>
										{/if}
										<button
											type="button"
											onclick={() => (popupAtivo = "galeria_conquistas")}
											class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
										>
											<Trophy class="w-3.5 h-3.5" />
											<span>Galeria ({painel.conquistas.length})</span>
										</button>
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<div
							class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-2"
						>
							<Trophy class="w-8 h-8 text-zinc-600 mx-auto" />
							<h3 class="text-sm font-bold text-white">
								Nenhum torneio registrado
							</h3>
							<p class="text-xs text-zinc-400 max-w-sm mx-auto">
								Seus resultados em campeonatos oficiais e
								medalhas recebidas serão computados nesta linha
								do tempo após as competições.
							</p>
						</div>
					{/if}
				{/if}
			</div>

			<!-- ========================================================================= -->
			<!-- 4. PRINCÍPIOS FUNDAMENTAIS DO JUDÔ (DOJO KUN & FILOSOFIA)                 -->
			<!-- ========================================================================= -->
			<div
				class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-red-900/30 relative overflow-hidden space-y-5"
			>
				<div
					class="flex items-center gap-2.5 pb-3 border-b border-zinc-900"
				>
					<Scroll class="w-4 h-4 text-red-500" />
					<h2
						class="text-xs font-mono uppercase tracking-wider text-red-400 font-bold"
					>
						Princípios Fundamentais do Judô • Kodokan
					</h2>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div
						class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2"
					>
						<div class="flex items-center justify-between">
							<span
								class="text-base font-bold text-white font-display"
								>Seiryoku Zen'yo</span
							>
							<span class="text-xs font-mono text-zinc-500"
								>精力善用</span
							>
						</div>
						<p class="text-xs text-zinc-300 font-medium">
							"Máxima Eficiência com o Mínimo Esforço"
						</p>
						<p class="text-[11px] text-zinc-400 leading-relaxed">
							O princípio de utilizar toda a energia mental e
							física de forma inteligente, aproveitando a força e
							o impulso do adversário para superá-lo com técnica,
							calma e precisão.
						</p>
					</div>

					<div
						class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2"
					>
						<div class="flex items-center justify-between">
							<span
								class="text-base font-bold text-white font-display"
								>Jita Kyoei</span
							>
							<span class="text-xs font-mono text-zinc-500"
								>自他共栄</span
							>
						</div>
						<p class="text-xs text-zinc-300 font-medium">
							"Prosperidade e Benefício Mútuo"
						</p>
						<p class="text-[11px] text-zinc-400 leading-relaxed">
							A evolução só acontece através da cooperação. Ao
							ajudar os companheiros de treino a crescerem, o dojo
							inteiro se fortalece, forjando caráter, fraternidade
							e respeito recíproco.
						</p>
					</div>
				</div>

				<div
					class="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400"
				>
					<span class="text-zinc-500 font-bold uppercase"
						>Código Moral:</span
					>
					<span>Cortesia</span>
					<span>•</span>
					<span>Coragem</span>
					<span>•</span>
					<span>Honestidade</span>
					<span>•</span>
					<span>Honra</span>
					<span>•</span>
					<span>Modéstia</span>
					<span>•</span>
					<span>Respeito</span>
					<span>•</span>
					<span>Autocontrole</span>
					<span>•</span>
					<span>Amizade</span>
				</div>
			</div>
		</div>
		<!-- FIM DA COLUNA PRINCIPAL (2/3) -->
	</div>
	<!-- FIM DO LAYOUT 2 COLUNAS -->
</div>

<!-- ============================================================================= -->
<!-- POPUPS / MODAIS EXPANSÍVEIS DOS 4 CARDS DO PAINEL DO ALUNO                    -->
<!-- ============================================================================= -->
{#if popupAtivo !== null}
	<!-- Backdrop -->
	<div
		role="presentation"
		onclick={() => (popupAtivo = null)}
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
	>
		<!-- Container do Modal -->
		<div
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === "Escape") popupAtivo = null;
			}}
			class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 sm:p-7 space-y-6"
		>
			<!-- ================================================================= -->
			<!-- POPUP 1: AGENDA INTEGRADA (CALENDÁRIO MENSAL, TREINOS & EVENTOS)  -->
			<!-- ================================================================= -->
			{#if popupAtivo === "agenda"}
				<div
					class="flex items-start justify-between gap-4 pb-4 border-b border-zinc-900"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0"
						>
							<Calendar class="w-5 h-5" />
						</div>
						<div>
							<h3
								class="text-base sm:text-lg font-extrabold text-white font-display"
							>
								Calendário do Tatame
							</h3>
							<p class="text-xs text-zinc-400">
								Calendário mensal unificado com suas aulas
								matriculadas, exames de faixa e torneios do dojo
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (popupAtivo = null)}
						class="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						title="Fechar"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<!-- Abas Internas do Popup de Agenda -->
				<div
					class="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800"
				>
					<button
						type="button"
						onclick={() => (abaPopupAgenda = "todos")}
						class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer {abaPopupAgenda ===
						'todos'
							? 'bg-red-600 text-white shadow-sm'
							: 'text-zinc-400 hover:text-white'}"
					>
						<Sparkles class="w-3.5 h-3.5" />
						<span
							>Resumo Unificado ({compromissosIntegrados.length})</span
						>
					</button>
					<button
						type="button"
						onclick={() => (abaPopupAgenda = "treinos")}
						class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer {abaPopupAgenda ===
						'treinos'
							? 'bg-red-600 text-white shadow-sm'
							: 'text-zinc-400 hover:text-white'}"
					>
						<Clock class="w-3.5 h-3.5" />
						<span
							>Meus Treinos Inscritos ({painel.treinosInscritos
								.length})</span
						>
					</button>
					<button
						type="button"
						onclick={() => (abaPopupAgenda = "eventos")}
						class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer {abaPopupAgenda ===
						'eventos'
							? 'bg-red-600 text-white shadow-sm'
							: 'text-zinc-400 hover:text-white'}"
					>
						<Swords class="w-3.5 h-3.5" />
						<span
							>Eventos & Torneios ({painel.proximosEventos
								.length})</span
						>
					</button>
					<button
						type="button"
						onclick={() => (abaPopupAgenda = "calendario")}
						class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer {abaPopupAgenda ===
						'calendario'
							? 'bg-red-600 text-white shadow-sm'
							: 'text-zinc-400 hover:text-white'}"
					>
						<Calendar class="w-3.5 h-3.5" />
						<span>Calendário Ampliado</span>
					</button>
				</div>

				{#if abaPopupAgenda === "todos"}
					<div class="space-y-4">
						<p class="text-xs text-zinc-400">
							Todos os seus treinos semanais matriculados e
							eventos/campeonatos ordenados por proximidade:
						</p>
						{#if compromissosIntegrados.length > 0}
							<div
								class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1"
							>
								{#each compromissosIntegrados as item (item.id)}
									<a
										href={item.href}
										class="p-4 rounded-xl border transition-all flex items-center justify-between gap-3 {item.ehHoje
											? 'bg-red-950/25 border-red-700/70'
											: item.inscrito
												? 'bg-emerald-950/15 border-emerald-800/60 hover:border-emerald-700'
												: 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}"
									>
										<div class="space-y-1 min-w-0">
											<div
												class="flex items-center gap-2 flex-wrap"
											>
												<span
													class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase {item.tipo ===
													'treino'
														? 'bg-red-950/60 border border-red-800 text-red-300'
														: item.tipo ===
															  'campeonato'
															? 'bg-amber-950/60 border border-amber-800 text-amber-300'
															: 'bg-purple-950/60 border border-purple-800 text-purple-300'}"
												>
													{item.tipo === "treino"
														? "Treino"
														: item.tipo ===
															  "campeonato"
															? "Campeonato"
															: "Exame"}
												</span>
												<span
													class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700"
												>
													{item.destaqueTag}
												</span>
											</div>
											<h4
												class="text-sm font-bold text-white truncate"
											>
												{item.titulo}
											</h4>
											<p
												class="text-[11px] font-mono text-zinc-400 truncate"
											>
												{item.dataOuDia} • {item.subtitulo}
											</p>
										</div>
										<ArrowRight
											class="w-4 h-4 text-zinc-500 shrink-0"
										/>
									</a>
								{/each}
							</div>
						{:else}
							<div
								class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center"
							>
								<p class="text-xs text-zinc-400">
									Nenhum compromisso encontrado no momento.
								</p>
							</div>
						{/if}
					</div>
				{:else if abaPopupAgenda === "calendario"}
					<CalendarioTatameMensal
						sessoes={painel.presencas || []}
						turmasMatriculadas={painel.treinosInscritos || []}
						eventosCalendario={painel.proximosEventos || []}
						titulo="Calendário do Tatame"
						subtitulo="Acompanhe seus treinos realizados, aulas previstas da semana e eventos/campeonatos agendados"
					/>
				{:else if abaPopupAgenda === "treinos"}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<p class="text-xs text-zinc-400">
								Turmas semanais em que você está oficialmente
								matriculado no tatame:
							</p>
							<a
								href="/dashboard/turmas"
								class="text-xs font-semibold text-red-400 hover:text-red-300 inline-flex items-center gap-1"
							>
								<span>Ir para Grade de Turmas</span>
								<ArrowRight class="w-3.5 h-3.5" />
							</a>
						</div>

						{#if painel.treinosInscritos.length > 0}
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{#each painel.treinosInscritos as treino}
									<div
										class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3"
									>
										<div class="space-y-1">
											<div
												class="flex items-center gap-2 flex-wrap"
											>
												<span
													class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-950/60 border border-red-800 text-red-300"
												>
													{treino.dia_semana}
												</span>
												<span
													class="text-xs font-mono text-zinc-300"
												>
													{treino.horario_inicio} às {treino.horario_fim}
												</span>
											</div>
											<h4
												class="text-sm font-bold text-white"
											>
												{treino.descricao}
											</h4>
											<p
												class="text-[11px] text-zinc-400"
											>
												Sensei: {treino.professores}
											</p>
										</div>

										<span
											class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-400 shrink-0"
										>
											Matriculado ✓
										</span>
									</div>
								{/each}
							</div>
						{:else}
							<div
								class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-2"
							>
								<Calendar
									class="w-7 h-7 text-zinc-600 mx-auto"
								/>
								<p class="text-xs text-zinc-400">
									Você ainda não foi alocado a uma turma
									semanal. Consulte seu Sensei.
								</p>
							</div>
						{/if}
					</div>
				{:else}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<p class="text-xs text-zinc-400">
								Campeonatos e exames de graduação do calendário
								oficial (destacando os que você está inscrito):
							</p>
							<a
								href="/dashboard/campeonatos"
								class="text-xs font-semibold text-red-400 hover:text-red-300 inline-flex items-center gap-1"
							>
								<span>Ver Todos os Eventos</span>
								<ArrowRight class="w-3.5 h-3.5" />
							</a>
						</div>

						{#if painel.proximosEventos.length > 0}
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{#each painel.proximosEventos as evento}
									<div
										class="p-4 rounded-xl border flex items-center justify-between gap-3 {evento.inscrito
											? 'bg-emerald-950/15 border-emerald-800/70'
											: 'bg-zinc-900/60 border-zinc-800'}"
									>
										<div class="space-y-1 min-w-0">
											<div
												class="flex items-center gap-2 flex-wrap"
											>
												<span
													class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase {evento.eh_campeonato
														? 'bg-amber-950/60 border border-amber-800 text-amber-300'
														: 'bg-purple-950/60 border border-purple-800 text-purple-300'}"
												>
													{evento.eh_campeonato
														? "Campeonato"
														: "Exame de Faixa"}
												</span>
												{#if evento.inscrito}
													<span
														class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300"
													>
														Inscrito ✓
													</span>
												{/if}
												<span
													class="text-xs font-mono text-zinc-300"
												>
													{evento.data_inicio ||
														"Data a definir"}
												</span>
											</div>
											<h4
												class="text-sm font-bold text-white truncate"
											>
												{evento.nome}
											</h4>
											{#if evento.valor_inscricao !== null && evento.valor_inscricao !== undefined}
												<p
													class="text-[11px] font-mono text-zinc-400"
												>
													Taxa: {evento.valor_inscricao ===
													0
														? "Gratuito"
														: `R$ ${Number(evento.valor_inscricao).toFixed(2).replace(".", ",")}`}
												</p>
											{/if}
										</div>

										<a
											href={evento.eh_campeonato
												? `/dashboard/campeonatos/${evento.id_evento}`
												: `/dashboard/graduacoes/${evento.id_evento}`}
											class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition-colors shrink-0"
										>
											Detalhes
										</a>
									</div>
								{/each}
							</div>
						{:else}
							<div
								class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center"
							>
								<p class="text-xs text-zinc-400">
									Nenhum exame ou campeonato agendado no
									momento.
								</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- ================================================================= -->
				<!-- POPUP 2: MINHA CONSTÂNCIA NO TATAME (DETALHAMENTO COMPLETO)       -->
				<!-- ================================================================= -->
			{:else if popupAtivo === "constancia" && painel.metricasPresenca}
				{@const mp = painel.metricasPresenca}
				<div
					class="flex items-start justify-between gap-4 pb-4 border-b border-zinc-900"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-600/40 flex items-center justify-center text-amber-400 shrink-0"
						>
							<Flame class="w-5 h-5" />
						</div>
						<div>
							<h3
								class="text-base sm:text-lg font-extrabold text-white font-display"
							>
								Presença no Tatame
							</h3>
							<p class="text-xs text-zinc-400">
								Disciplina diária, assiduidade e requisitos de
								presença para a próxima faixa
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (popupAtivo = null)}
						class="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						title="Fechar"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<!-- Destaques de Sequência (Streak) -->
				<div
					class="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 flex flex-wrap items-center justify-between gap-3"
				>
					<div class="flex items-center gap-2.5">
						<Flame class="w-5 h-5 text-amber-400" />
						<span
							class="text-xs sm:text-sm font-bold text-amber-200"
						>
							Sequência atual: {mp.streak_atual}
							{mp.streak_atual === 1
								? "treino consecutivo"
								: "treinos consecutivos"}
						</span>
					</div>
					<span
						class="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300"
					>
						Recorde pessoal: <strong class="text-amber-400"
							>{mp.maior_streak}</strong
						> treino(s)
					</span>
				</div>

				<!-- Grid de 4 KPIs de Presença -->
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
				>
					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block"
						>
							Aulas Concluídas
						</span>
						<div class="flex items-baseline gap-2">
							<span
								class="text-2xl font-extrabold text-emerald-400 font-display"
							>
								{mp.total_presentes}
							</span>
							<span class="text-xs text-zinc-500"
								>de {mp.total_aulas} chamadas</span
							>
						</div>
						<p class="text-[11px] text-zinc-400">
							Em <strong class="text-white"
								>{mp.dias_distintos_treinados}</strong
							> dia(s) distintos
						</p>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block"
						>
							Taxa de Presença Geral
						</span>
						<span
							class="text-2xl font-extrabold text-white font-display block"
						>
							{mp.percentual_presenca}%
						</span>
						<div
							class="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden"
						>
							<div
								class="h-full rounded-full bg-emerald-500"
								style="width: {Math.min(
									100,
									mp.percentual_presenca,
								)}%"
							></div>
						</div>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block"
						>
							Frequência neste Mês
						</span>
						<div class="flex items-baseline gap-2">
							<span
								class="text-2xl font-extrabold text-amber-400 font-display"
							>
								{mp.percentual_mes_atual}%
							</span>
							<span class="text-xs text-zinc-500">
								({mp.presentes_mes_atual}/{mp.aulas_mes_atual})
							</span>
						</div>
						<p class="text-[11px] text-zinc-400">
							Justificadas: <strong class="text-sky-400"
								>{mp.total_justificadas}</strong
							>
							• Faltas:
							<strong class="text-red-400"
								>{mp.total_faltas}</strong
							>
						</p>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block"
						>
							Meta Próxima Graduação
						</span>
						{#if mp.proximo_exame_meta && (mp.proximo_exame_meta.qtd_minima_aulas > 0 || mp.proximo_exame_meta.percentual_minimo > 0)}
							{@const meta = mp.proximo_exame_meta}
							<span
								class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold {meta.apto_frequencia
									? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
									: 'bg-amber-500/15 border border-amber-500/30 text-amber-300'}"
							>
								{meta.apto_frequencia
									? "Meta Atingida ✓"
									: "Em Progresso"}
							</span>
							<p class="text-[11px] text-zinc-300 truncate">
								{meta.qtd_minima_aulas > 0
									? `${mp.total_presentes}/${meta.qtd_minima_aulas} aulas`
									: ""}
								{meta.percentual_minimo > 0
									? ` • Min. ${meta.percentual_minimo}%`
									: ""}
							</p>
						{:else}
							<span
								class="text-sm font-bold text-zinc-200 block pt-0.5"
							>
								Constância Livre
							</span>
							<p class="text-[11px] text-zinc-500">
								Mantenha acima de 80% de presença
							</p>
						{/if}
					</div>
				</div>

				<!-- Últimas Chamadas Registradas + Atalho para Calendário -->
				<div class="space-y-3 pt-2 border-t border-zinc-900">
					<div class="flex items-center justify-between">
						<h4
							class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold"
						>
							Últimas Chamadas Registradas no Tatame
						</h4>
						<button
							type="button"
							onclick={() => {
								abaPopupAgenda = "calendario";
								popupAtivo = "agenda";
							}}
							class="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
						>
							<span>Abrir Calendário Mensal Completo</span>
							<ArrowRight class="w-3.5 h-3.5" />
						</button>
					</div>

					{#if painel.presencas && painel.presencas.length > 0}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
							{#each painel.presencas.slice(0, 6) as p}
								<div
									class="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between gap-2"
								>
									<div class="min-w-0">
										<p
											class="text-xs font-bold text-white truncate"
										>
											{p.descricao_turma}
										</p>
										<p
											class="text-[11px] font-mono text-zinc-400"
										>
											{p.data_treino
												.slice(0, 10)
												.split("-")
												.reverse()
												.join("/")} • {p.horario_inicio}
										</p>
									</div>
									<span
										class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 {p.status_presenca ===
										'Presente'
											? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
											: p.status_presenca ===
												  'Justificada'
												? 'bg-sky-950/60 border border-sky-800 text-sky-300'
												: 'bg-red-950/60 border border-red-800 text-red-300'}"
									>
										{p.status_presenca}
									</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-zinc-500 py-3">
							Nenhuma chamada registrada até o momento.
						</p>
					{/if}
				</div>

				<!-- ================================================================= -->
				<!-- POPUP 3: MÉTRICAS DO JUDOCA (DETALHAMENTO INDIVIDUAL)             -->
				<!-- ================================================================= -->
			{:else if popupAtivo === "metricas_judoca"}
				<div
					class="flex items-start justify-between gap-4 pb-4 border-b border-zinc-900"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0"
						>
							<Award class="w-5 h-5" />
						</div>
						<div>
							<h3
								class="text-base sm:text-lg font-extrabold text-white font-display"
							>
								Shiai Seiseki
							</h3>
							<p class="text-xs text-zinc-400">
								Desempenho em Competição
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (popupAtivo = null)}
						class="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						title="Fechar"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 block"
							>Treinos Inscritos</span
						>
						<span
							class="text-2xl font-black font-display text-white block"
						>
							{painel.metricasJudoca.totalTreinosInscritos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>turma(s) semanais</span
						>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 block"
							>Torneios Disputados</span
						>
						<span
							class="text-2xl font-black font-display text-white block"
						>
							{painel.metricasJudoca.totalCampeonatos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>edições oficiais</span
						>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 block"
							>Combates Realizados</span
						>
						<span
							class="text-2xl font-black font-display text-white block"
						>
							{painel.metricasJudoca.totalLutas}
						</span>
						<span class="text-[11px] text-emerald-400 font-mono">
							{painel.metricasJudoca.totalVitorias} vitória(s)
						</span>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 block"
							>Aproveitamento</span
						>
						<span
							class="text-2xl font-black font-display text-emerald-400 block"
						>
							{taxaAproveitamentoLutas}%
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>taxa de vitória</span
						>
					</div>
				</div>

				<!-- Quadro Completo de Medalhas -->
				<div
					class="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4"
				>
					<div class="flex items-center justify-between">
						<span
							class="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-2"
						>
							<Medal class="w-4 h-4 text-amber-400" />
							<span>Pódios & Medalhas Conquistadas</span>
						</span>
						<span
							class="text-xs font-bold font-mono text-amber-400"
						>
							{painel.metricasJudoca.totalMedalhas} medalha(s) no total
						</span>
					</div>

					<div class="grid grid-cols-3 gap-3 text-center">
						<div
							class="p-3.5 rounded-xl bg-amber-950/25 border border-amber-800/50"
						>
							<span class="text-xl block">🥇</span>
							<span
								class="text-2xl font-black font-display text-amber-300 block"
							>
								{painel.metricasJudoca.totalOuro}
							</span>
							<span
								class="text-[11px] font-mono text-amber-400/90 uppercase"
								>Ouro (1º Lugar)</span
							>
						</div>
						<div
							class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60"
						>
							<span class="text-xl block">🥈</span>
							<span
								class="text-2xl font-black font-display text-zinc-200 block"
							>
								{painel.metricasJudoca.totalPrata}
							</span>
							<span
								class="text-[11px] font-mono text-zinc-400 uppercase"
								>Prata (2º Lugar)</span
							>
						</div>
						<div
							class="p-3.5 rounded-xl bg-orange-950/25 border border-orange-800/50"
						>
							<span class="text-xl block">🥉</span>
							<span
								class="text-2xl font-black font-display text-orange-300 block"
							>
								{painel.metricasJudoca.totalBronze}
							</span>
							<span
								class="text-[11px] font-mono text-orange-400/90 uppercase"
								>Bronze (3º Lugar)</span
							>
						</div>
					</div>
				</div>

				<!-- Resumo de Resultados em Torneios -->
				{#if painel.conquistas.length > 0}
					<div class="space-y-2.5">
						<h4
							class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold"
						>
							Histórico de Participações em Campeonatos ({painel
								.conquistas.length})
						</h4>
						<div class="space-y-2 max-h-60 overflow-y-auto pr-1">
							{#each painel.conquistas as conq}
								<div
									class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3"
								>
									<div>
										<div class="flex items-center gap-2">
											<span
												class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-amber-300 border border-zinc-700"
											>
												{conq.classificacao}
											</span>
											<span
												class="text-[11px] font-mono text-zinc-400"
												>{conq.data_evento}</span
											>
										</div>
										<p
											class="text-xs font-bold text-white mt-1"
										>
											{conq.nome_campeonato}
										</p>
									</div>
									<div
										class="text-right font-mono text-[11px] text-zinc-400 shrink-0"
									>
										<span>{conq.qtd_lutas} lutas</span> •
										<strong class="text-emerald-400"
											>{conq.qtd_vitorias} vit.</strong
										>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- ================================================================= -->
				<!-- POPUP 4: MÉTRICAS DA ACADEMIA (FORÇA COLETIVA & SENSEIS)          -->
				<!-- ================================================================= -->
			{:else if popupAtivo === "metricas_academia"}
				<div
					class="flex items-start justify-between gap-4 pb-4 border-b border-zinc-900"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0"
						>
							<Trophy class="w-5 h-5" />
						</div>
						<div>
							<h3
								class="text-base sm:text-lg font-extrabold text-white font-display"
							>
								Métricas Coletivas do Dojo ({nomeDojo})
							</h3>
							<p class="text-xs text-zinc-400">
								Comunidade de atletas, tradição em torneios e
								corpo técnico de Senseis
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (popupAtivo = null)}
						class="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						title="Fechar"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 block"
							>Judocas Cadastrados</span
						>
						<span
							class="text-2xl font-black font-display text-white block"
						>
							{painel.metricasAcademia.totalAlunos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>atletas ativos</span
						>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 block"
							>Treinos na Grade</span
						>
						<span
							class="text-2xl font-black font-display text-white block"
						>
							{painel.metricasAcademia.totalTreinosDisponiveis}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>horários semanais</span
						>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 block"
							>Torneios Disputados</span
						>
						<span
							class="text-2xl font-black font-display text-amber-400 block"
						>
							{painel.metricasAcademia.totalTrofeusCampeonatos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>campeonatos</span
						>
					</div>

					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<span
							class="text-[10px] font-mono uppercase text-zinc-500 block"
							>Medalhas do Dojo</span
						>
						<span
							class="text-2xl font-black font-display text-amber-300 block"
						>
							{painel.metricasAcademia.totalMedalhasAlunos}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono"
							>conquistas dos alunos</span
						>
					</div>
				</div>

				<!-- Quadro Completo de Senseis & Mestres -->
				<div class="space-y-3 pt-2 border-t border-zinc-900">
					<div class="flex items-center justify-between">
						<span
							class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-2"
						>
							<Users class="w-4 h-4 text-red-400" />
							<span
								>Quadro de Senseis & Mestres ({painel
									.metricasAcademia.senseis.length})</span
							>
						</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each painel.metricasAcademia.senseis as sensei}
							<div
								class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3"
							>
								<div class="flex items-center gap-2.5 min-w-0">
									<div
										class="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"
									></div>
									<div class="min-w-0">
										<p
											class="text-xs font-bold text-white truncate"
										>
											Sensei {sensei.nome}
										</p>
										<p
											class="text-[11px] font-mono text-zinc-500 truncate"
										>
											{sensei.email}
										</p>
									</div>
								</div>
								{#if sensei.grau_faixa}
									<div class="shrink-0">
										<BadgeFaixa
											faixa={sensei.grau_faixa}
											size="sm"
										/>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

			<!-- ================================================================= -->
			<!-- POPUP 5: GALERIA COMPLETA DE CONQUISTAS & PÓDIOS (HALL DA FAMA)   -->
			<!-- ================================================================= -->
			{:else if popupAtivo === "galeria_conquistas"}
				<div
					class="flex items-start justify-between gap-4 pb-4 border-b border-zinc-900"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0"
						>
							<Trophy class="w-5 h-5" />
						</div>
						<div>
							<h3
								class="text-base sm:text-lg font-extrabold text-white font-display"
							>
								Galeria de Conquistas & Shiai Seiseki
							</h3>
							<p class="text-xs text-zinc-400">
								Histórico completo de competições oficiais, medalhas e estatísticas de combate
							</p>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (popupAtivo = null)}
						class="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						title="Fechar"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<!-- Cards de Estatísticas Agregadas da Carreira -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
					<!-- Ouros -->
					<div
						class="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 space-y-1"
					>
						<div class="flex items-center justify-between text-amber-400">
							<span class="text-[10px] font-mono uppercase font-bold">Ouro / 1º Lugar</span>
							<Medal class="w-4 h-4" />
						</div>
						<span class="text-2xl font-black font-display text-amber-300 block">
							{metricasGaleria.ouros}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">títulos oficiais</span>
					</div>

					<!-- Pratas -->
					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<div class="flex items-center justify-between text-zinc-300">
							<span class="text-[10px] font-mono uppercase font-bold">Prata / Vice</span>
							<Medal class="w-4 h-4" />
						</div>
						<span class="text-2xl font-black font-display text-zinc-100 block">
							{metricasGaleria.pratas}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">vice-campeonatos</span>
					</div>

					<!-- Bronzes -->
					<div
						class="p-4 rounded-xl bg-orange-950/20 border border-orange-900/50 space-y-1"
					>
						<div class="flex items-center justify-between text-orange-400">
							<span class="text-[10px] font-mono uppercase font-bold">Bronze / 3º</span>
							<Medal class="w-4 h-4" />
						</div>
						<span class="text-2xl font-black font-display text-orange-300 block">
							{metricasGaleria.bronzes}
						</span>
						<span class="text-[11px] text-zinc-400 font-mono">pódios conquistados</span>
					</div>

					<!-- Lutas & Vitórias -->
					<div
						class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
					>
						<div class="flex items-center justify-between text-emerald-400">
							<span class="text-[10px] font-mono uppercase font-bold">Aproveitamento</span>
							<Swords class="w-4 h-4" />
						</div>
						<div class="flex items-baseline gap-1.5">
							<span class="text-2xl font-black font-display text-emerald-400">
								{metricasGaleria.taxaVitoria}%
							</span>
							<span class="text-[11px] font-mono text-zinc-500">vitórias</span>
						</div>
						<span class="text-[11px] text-zinc-400 font-mono">
							{metricasGaleria.totalVitorias} vitórias em {metricasGaleria.totalLutas} lutas
						</span>
					</div>
				</div>

				<!-- Barra de Filtros e Busca no Modal -->
				<div class="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<!-- Filtro por Medalha -->
						<div class="flex flex-wrap items-center gap-1.5">
							<span class="text-[11px] font-mono text-zinc-500 uppercase mr-1">Medalha:</span>
							<button
								type="button"
								onclick={() => (filtroModalMedalha = "todas")}
								class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {filtroModalMedalha ===
								'todas'
									? 'bg-amber-600 text-white shadow-sm'
									: 'text-zinc-400 hover:text-white hover:bg-zinc-800'}"
							>
								Todas ({painel.conquistas.length})
							</button>
							<button
								type="button"
								onclick={() => (filtroModalMedalha = "ouro")}
								class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {filtroModalMedalha ===
								'ouro'
									? 'bg-amber-600 text-white shadow-sm'
									: 'text-zinc-400 hover:text-white hover:bg-zinc-800'}"
							>
								🥇 Ouro ({metricasGaleria.ouros})
							</button>
							<button
								type="button"
								onclick={() => (filtroModalMedalha = "prata")}
								class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {filtroModalMedalha ===
								'prata'
									? 'bg-amber-600 text-white shadow-sm'
									: 'text-zinc-400 hover:text-white hover:bg-zinc-800'}"
							>
								🥈 Prata ({metricasGaleria.pratas})
							</button>
							<button
								type="button"
								onclick={() => (filtroModalMedalha = "bronze")}
								class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {filtroModalMedalha ===
								'bronze'
									? 'bg-amber-600 text-white shadow-sm'
									: 'text-zinc-400 hover:text-white hover:bg-zinc-800'}"
							>
								🥉 Bronze ({metricasGaleria.bronzes})
							</button>
						</div>

						<!-- Campo de Busca -->
						<div class="relative w-full sm:w-64">
							<Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								type="text"
								bind:value={buscaModalConquistas}
								placeholder="Buscar campeonato..."
								class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/70"
							/>
						</div>
					</div>

					<!-- Filtro por Ano (se houver mais de 1 ano) -->
					{#if anosDisponiveisConquistas.length > 1}
						<div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60">
							<span class="text-[11px] font-mono text-zinc-500 uppercase mr-1">Temporada:</span>
							<button
								type="button"
								onclick={() => (filtroModalAno = "todos")}
								class="px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer {filtroModalAno ===
								'todos'
									? 'bg-zinc-800 text-amber-300 border border-zinc-700'
									: 'text-zinc-400 hover:text-white'}"
							>
								Todos os Anos
							</button>
							{#each anosDisponiveisConquistas as ano}
								<button
									type="button"
									onclick={() => (filtroModalAno = String(ano))}
									class="px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer {filtroModalAno ===
									String(ano)
										? 'bg-zinc-800 text-amber-300 border border-zinc-700'
										: 'text-zinc-400 hover:text-white'}"
								>
									{ano}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Lista de Conquistas Filtradas no Modal -->
				<div class="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
					{#if conquistasModalFiltradas.length > 0}
						{#each conquistasModalFiltradas as conq (conq.id_classificacao || `${conq.id_campeonato}-${conq.data_evento}`)}
							{@const taxaVitoriaTorneio = conq.qtd_lutas > 0 ? Math.round((conq.qtd_vitorias / conq.qtd_lutas) * 100) : 0}
							<div
								class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
							>
								<div class="space-y-1.5">
									<div class="flex items-center gap-2 flex-wrap">
										<span
											class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold {conq.tipo_medalha ===
											'ouro'
												? 'bg-amber-950/70 text-amber-300 border border-amber-800'
												: conq.tipo_medalha === 'prata'
													? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
													: conq.tipo_medalha === 'bronze'
														? 'bg-orange-950/70 text-orange-300 border border-orange-800'
														: 'bg-zinc-800 text-zinc-400 border border-zinc-700'}"
										>
											{conq.classificacao}
										</span>
										<span class="text-xs text-zinc-400 font-mono">
											{conq.data_evento}
										</span>
									</div>
									<h4 class="text-sm font-bold text-white">
										{conq.nome_campeonato}
										{conq.edicao ? `(${conq.edicao})` : ""}
									</h4>
								</div>

								<div class="flex items-center gap-4 text-xs font-mono">
									<div class="text-right">
										<div class="flex items-center gap-2 justify-end">
											<span class="text-zinc-400">{conq.qtd_lutas} lutas</span>
											<span class="text-zinc-600">•</span>
											<strong class="text-emerald-400">{conq.qtd_vitorias} vitórias</strong>
										</div>
										<span class="text-[10px] text-zinc-500 block">
											{taxaVitoriaTorneio}% de aproveitamento
										</span>
									</div>

									{#if conq.id_campeonato}
										<div class="h-8 w-px bg-zinc-800"></div>
										<a
											href="/dashboard/campeonatos/{conq.id_campeonato}"
											class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors text-xs font-semibold shrink-0"
										>
											<span>Ver Chave</span>
											<ArrowRight class="w-3.5 h-3.5" />
										</a>
									{/if}
								</div>
							</div>
						{/each}
					{:else}
						<div
							class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-2"
						>
							<Trophy class="w-8 h-8 text-zinc-600 mx-auto" />
							<h4 class="text-sm font-bold text-white">
								Nenhuma conquista encontrada
							</h4>
							<p class="text-xs text-zinc-400 max-w-sm mx-auto">
								Tente ajustar os filtros de ano, medalha ou termo de busca acima.
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
