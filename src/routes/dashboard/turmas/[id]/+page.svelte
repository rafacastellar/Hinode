<script lang="ts">
	import type { PageData, ActionData } from "./$types";
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { toast } from "#lib/components/ui/toast.svelte";
	import BadgeFaixa from "#lib/components/ui/BadgeFaixa.svelte";
	import {
		Calendar,
		Clock,
		Users,
		Award,
		ArrowLeft,
		UserPlus,
		Trash2,
		AlertCircle,
		CheckCircle2,
		Settings,
		AlertTriangle,
		X,
		ChevronDown,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		LayoutList,
		AlignJustify,
		Search,
		Filter,
		Printer,
		ClipboardCheck,
		Check,
		CalendarCheck,
		ChevronLeft,
		ChevronRight,
		PenLine,
		Eye,
	} from "@lucide/svelte";
	import ModalImpressaoDocumento from "#lib/components/documentos/ModalImpressaoDocumento.svelte";
	import DocumentoTreinoImpressao from "#lib/components/documentos/DocumentoTreinoImpressao.svelte";
	import {
		ordenarAtletas,
		type CampoOrdenacaoAtleta,
		type DirecaoOrdenacao,
	} from "#lib/dominio/ordenacao-atletas";

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Aba ativa: 'alunos' | 'chamada' | 'historico' | 'editar'
	let abaAtiva = $state<"alunos" | "chamada" | "historico" | "editar">(
		data.podeGerenciar ? "chamada" : "alunos",
	);

	// Estados de formulário e modal
	let carregandoMatricula = $state(false);
	let carregandoEdicao = $state(false);
	let carregandoExclusao = $state(false);
	let modalExcluirAberto = $state(false);
	let modalImpressaoAberto = $state(false);
	let alunoSelecionado = $state<number | "">("");
	let filtroBuscaAluno = $state("");

	// Estados da Chamada no Tatame
	interface ItemPresencaLocal {
		idAluno: number;
		nome: string;
		grauFaixa: string | null;
		status: "Presente" | "Falta" | "Justificada";
		observacao: string;
	}

	let itensPresenca = $state<ItemPresencaLocal[]>([]);
	let carregandoChamada = $state(false);
	let dataChamadaSelecionada = $state("");

	$effect(() => {
		itensPresenca = data.chamadaInfo.lista.map((item) => ({
			idAluno: item.id_aluno,
			nome: item.nome,
			grauFaixa: item.grau_faixa,
			status: item.status_presenca,
			observacao: item.observacao || "",
		}));
		dataChamadaSelecionada = data.chamadaInfo.dataChamada;
	});

	function marcarTodos(status: "Presente" | "Falta") {
		itensPresenca = itensPresenca.map((item) =>
			item.status === "Justificada" &&
			item.observacao.includes("[Aviso do Responsável]")
				? item
				: { ...item, status },
		);
		toast.info(`Atletas marcados como ${status}`);
	}

	function alterarStatus(
		idAluno: number,
		status: "Presente" | "Falta" | "Justificada",
	) {
		itensPresenca = itensPresenca.map((item) =>
			item.idAluno === idAluno ? { ...item, status } : item,
		);
	}

	function navegarDataChamada(novaData: string) {
		if (novaData && novaData !== data.chamadaInfo.dataChamada) {
			goto(`?dataChamada=${novaData}`);
		}
	}

	let totalPresentes = $derived(
		itensPresenca.filter((i) => i.status === "Presente").length,
	);
	let totalFaltas = $derived(
		itensPresenca.filter((i) => i.status === "Falta").length,
	);
	let totalJustificadas = $derived(
		itensPresenca.filter((i) => i.status === "Justificada").length,
	);
	let percentualPresentes = $derived(
		itensPresenca.length > 0
			? Math.round((totalPresentes / itensPresenca.length) * 100)
			: 0,
	);

	// =========================================================================
	// ESTADOS DO CALENDÁRIO DE HISTÓRICO DE CHAMADAS & POPUP DE RELAÇÃO DO DIA
	// =========================================================================
	const hojeIso = new Date().toISOString().slice(0, 10);
	const agoraRef = new Date();
	let anoHistorico = $state(agoraRef.getFullYear());
	let mesHistorico = $state(agoraRef.getMonth()); // 0 a 11

	let modalRelacaoDiaAberto = $state(false);
	let dataPopupSelecionada = $state("");
	let itensPopupPresenca = $state<ItemPresencaLocal[]>([]);
	let salvandoPopupChamada = $state(false);
	let buscaAlunoPopup = $state("");
	let infoMetaPopup = $state<{
		jaRegistrada: boolean;
		ultimaAtualizacao: string | null;
		nomeRegistrador: string | null;
	}>({ jaRegistrada: false, ultimaAtualizacao: null, nomeRegistrador: null });

	const nomesMesesHistorico = [
		"Janeiro",
		"Fevereiro",
		"Março",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro",
	];

	const diasCabecalhoHistorico = [
		"Dom",
		"Seg",
		"Ter",
		"Qua",
		"Qui",
		"Sex",
		"Sáb",
	];

	const tokensDiaSemanaTurma: Record<number, string[]> = {
		0: ["dom"],
		1: ["seg"],
		2: ["ter"],
		3: ["qua"],
		4: ["qui"],
		5: ["sex"],
		6: ["sab", "sáb"],
	};

	function turmaAconteceNoDiaSemana(diaSemanaIdx: number): boolean {
		const texto = (data.turma.dia_semana || "").toLowerCase();
		const tokens = tokensDiaSemanaTurma[diaSemanaIdx] || [];
		return tokens.some((t) => texto.includes(t));
	}

	function mesAnteriorHistorico() {
		if (mesHistorico === 0) {
			mesHistorico = 11;
			anoHistorico -= 1;
		} else {
			mesHistorico -= 1;
		}
	}

	function proximoMesHistorico() {
		if (mesHistorico === 11) {
			mesHistorico = 0;
			anoHistorico += 1;
		} else {
			mesHistorico += 1;
		}
	}

	function irParaHojeHistorico() {
		const d = new Date();
		anoHistorico = d.getFullYear();
		mesHistorico = d.getMonth();
	}

	const mapaHistoricoPorData = $derived.by(() => {
		const m = new Map<
			string,
			NonNullable<typeof data.historicoChamadas>[number]
		>();
		for (const item of data.historicoChamadas || []) {
			m.set(item.data_treino, item);
		}
		return m;
	});

	const celulasCalendarioHistorico = $derived.by(() => {
		const primeiroDia = new Date(anoHistorico, mesHistorico, 1).getDay();
		const totalDias = new Date(anoHistorico, mesHistorico + 1, 0).getDate();

		const celulas: Array<{
			vazia: boolean;
			diaNumero: number;
			dataIso: string;
			ehHoje: boolean;
			ehDiaDaTurma: boolean;
			registroDia:
				| NonNullable<typeof data.historicoChamadas>[number]
				| null;
		}> = [];

		for (let i = 0; i < primeiroDia; i++) {
			celulas.push({
				vazia: true,
				diaNumero: 0,
				dataIso: "",
				ehHoje: false,
				ehDiaDaTurma: false,
				registroDia: null,
			});
		}

		for (let d = 1; d <= totalDias; d++) {
			const mStr = String(mesHistorico + 1).padStart(2, "0");
			const dStr = String(d).padStart(2, "0");
			const dataIso = `${anoHistorico}-${mStr}-${dStr}`;
			const idxSemana = new Date(anoHistorico, mesHistorico, d).getDay();

			celulas.push({
				vazia: false,
				diaNumero: d,
				dataIso,
				ehHoje: dataIso === hojeIso,
				ehDiaDaTurma: turmaAconteceNoDiaSemana(idxSemana),
				registroDia: mapaHistoricoPorData.get(dataIso) || null,
			});
		}

		return celulas;
	});

	const resumoMesHistorico = $derived.by(() => {
		let diasRegistrados = 0;
		let totalPresencas = 0;
		let totalFaltasMes = 0;
		let totalJustificadasMes = 0;

		for (const cel of celulasCalendarioHistorico) {
			if (!cel.vazia && cel.registroDia) {
				diasRegistrados += 1;
				totalPresencas += cel.registroDia.total_presentes;
				totalFaltasMes += cel.registroDia.total_faltas;
				totalJustificadasMes += cel.registroDia.total_justificadas;
			}
		}

		return {
			diasRegistrados,
			totalPresencas,
			totalFaltasMes,
			totalJustificadasMes,
		};
	});

	function abrirPopupRelacaoDia(dataIso: string) {
		dataPopupSelecionada = dataIso;
		buscaAlunoPopup = "";
		const registroExistente = mapaHistoricoPorData.get(dataIso);

		// Mescla alunos matriculados na turma com os registros salvos daquele dia
		const mapaSalvos = new Map<
			number,
			{
				nome: string;
				grau_faixa: string | null;
				status_presenca: "Presente" | "Falta" | "Justificada";
				observacao: string | null;
			}
		>();

		if (registroExistente) {
			for (const r of registroExistente.registros) {
				mapaSalvos.set(r.id_aluno, r);
			}
		}

		const listaCombinada: ItemPresencaLocal[] = [];
		const idsProcessados = new Set<number>();

		for (const alunoMat of data.turma.alunos_matriculados) {
			const salvo = mapaSalvos.get(alunoMat.id_usuario);
			idsProcessados.add(alunoMat.id_usuario);
			listaCombinada.push({
				idAluno: alunoMat.id_usuario,
				nome: alunoMat.nome,
				grauFaixa: alunoMat.graduacao_atual,
				status: salvo ? salvo.status_presenca : "Presente",
				observacao: salvo?.observacao || "",
			});
		}

		// Inclui também eventuais alunos que tinham presença salva nesse dia e saíram da turma depois
		if (registroExistente) {
			for (const r of registroExistente.registros) {
				if (!idsProcessados.has(r.id_aluno)) {
					listaCombinada.push({
						idAluno: r.id_aluno,
						nome: r.nome,
						grauFaixa: r.grau_faixa,
						status: r.status_presenca,
						observacao: r.observacao || "",
					});
				}
			}
		}

		listaCombinada.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
		itensPopupPresenca = listaCombinada;
		infoMetaPopup = {
			jaRegistrada: Boolean(registroExistente),
			ultimaAtualizacao: registroExistente?.ultima_atualizacao || null,
			nomeRegistrador: registroExistente?.nome_registrador || null,
		};
		modalRelacaoDiaAberto = true;
	}

	function alterarStatusPopup(
		idAluno: number,
		status: "Presente" | "Falta" | "Justificada",
	) {
		itensPopupPresenca = itensPopupPresenca.map((item) =>
			item.idAluno === idAluno ? { ...item, status } : item,
		);
	}

	function marcarTodosPopup(status: "Presente" | "Falta") {
		itensPopupPresenca = itensPopupPresenca.map((item) =>
			item.status === "Justificada" &&
			item.observacao.includes("[Aviso do Responsável]")
				? item
				: { ...item, status },
		);
	}

	const itensPopupFiltrados = $derived(
		buscaAlunoPopup.trim() === ""
			? itensPopupPresenca
			: itensPopupPresenca.filter((i) =>
					i.nome
						.toLowerCase()
						.includes(buscaAlunoPopup.toLowerCase()),
				),
	);

	const metricasPopup = $derived.by(() => {
		const pres = itensPopupPresenca.filter(
			(i) => i.status === "Presente",
		).length;
		const falt = itensPopupPresenca.filter(
			(i) => i.status === "Falta",
		).length;
		const just = itensPopupPresenca.filter(
			(i) => i.status === "Justificada",
		).length;
		const pct =
			itensPopupPresenca.length > 0
				? Math.round((pres / itensPopupPresenca.length) * 100)
				: 0;
		return { pres, falt, just, pct };
	});

	function formatarDataBr(iso: string): string {
		if (!iso) return "";
		const [a, m, d] = iso.split("-");
		return `${d}/${m}/${a}`;
	}

	function formatarDataExtensoPopup(iso: string): string {
		if (!iso) return "";
		const [a, m, d] = iso.split("-").map(Number);
		const dt = new Date(a, m - 1, d);
		return dt.toLocaleDateString("pt-BR", {
			weekday: "long",
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	}

	// Estados de controle da chamada: minimização (accordion), ordenação e densidade
	let listaChamadaExpandida = $state(true);
	let densidadeChamada = $state<"detalhada" | "compacta">("compacta");
	let campoOrdenacaoChamada = $state<CampoOrdenacaoAtleta>("graduacao");
	let direcaoOrdenacaoChamada = $state<DirecaoOrdenacao>("desc");
	let filtroBuscaChamada = $state("");
	let filtroIdadeChamada = $state<"TODOS" | "MENORES" | "ADULTOS">("TODOS");

	function alternarDirecaoChamada() {
		direcaoOrdenacaoChamada =
			direcaoOrdenacaoChamada === "asc" ? "desc" : "asc";
	}

	const diasSemanaOpcoes = [
		"Segunda-feira",
		"Terça-feira",
		"Quarta-feira",
		"Quinta-feira",
		"Sexta-feira",
		"Sábado",
		"Domingo",
	];

	// Conjunto de professores atualmente alocados na turma
	let professoresSelecionados = $state<number[]>([]);

	// Dias selecionados pré-calculados a partir do texto de dia_semana
	let diasSelecionados = $state<string[]>([]);

	$effect(() => {
		if (!data.podeGerenciar && abaAtiva !== "alunos") {
			abaAtiva = "alunos";
		}
		professoresSelecionados = data.turma.professores.map(
			(p) => p.id_professor,
		);
		diasSelecionados = diasSemanaOpcoes.filter((dia) =>
			data.turma.dia_semana
				.toLowerCase()
				.includes(dia.toLowerCase().split("-")[0]),
		);
	});

	function alternarProfessor(idProfessor: number) {
		if (professoresSelecionados.includes(idProfessor)) {
			professoresSelecionados = professoresSelecionados.filter(
				(id) => id !== idProfessor,
			);
		} else {
			professoresSelecionados = [...professoresSelecionados, idProfessor];
		}
	}

	function alternarDia(dia: string) {
		if (diasSelecionados.includes(dia)) {
			diasSelecionados = diasSelecionados.filter((d) => d !== dia);
		} else {
			diasSelecionados = [...diasSelecionados, dia];
		}
	}

	// Alunos disponíveis filtrados
	let alunosFiltrados = $derived(
		filtroBuscaAluno.trim() === ""
			? data.alunosDisponiveis
			: data.alunosDisponiveis.filter(
					(a) =>
						a.nome
							.toLowerCase()
							.includes(filtroBuscaAluno.toLowerCase()) ||
						(a.matricula &&
							a.matricula
								.toLowerCase()
								.includes(filtroBuscaAluno.toLowerCase())),
				),
	);

	// Filtragem e ordenação reativa dos judocas matriculados na turma
	const alunosChamadaFiltrados = $derived(
		data.turma.alunos_matriculados.filter((aluno) => {
			if (filtroIdadeChamada === "MENORES" && !aluno.menor_idade)
				return false;
			if (filtroIdadeChamada === "ADULTOS" && aluno.menor_idade)
				return false;
			if (filtroBuscaChamada.trim() !== "") {
				const termo = filtroBuscaChamada.toLowerCase();
				const matchNome = aluno.nome.toLowerCase().includes(termo);
				const matchMatricula = aluno.matricula
					? aluno.matricula.toLowerCase().includes(termo)
					: false;
				const matchFaixa = aluno.graduacao_atual
					.toLowerCase()
					.includes(termo);
				const matchCategoria = aluno.categoria
					? aluno.categoria.toLowerCase().includes(termo)
					: false;
				if (
					!matchNome &&
					!matchMatricula &&
					!matchFaixa &&
					!matchCategoria
				)
					return false;
			}
			return true;
		}),
	);

	const alunosChamadaOrdenados = $derived(
		ordenarAtletas(
			alunosChamadaFiltrados,
			campoOrdenacaoChamada,
			direcaoOrdenacaoChamada,
		),
	);
</script>

<svelte:head>
	<title>{data.turma.descricao} - Manutenção da Turma</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/turmas"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft
				class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
			/>
			<span>Voltar para Grade de Turmas</span>
		</a>

		<div
			class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
		>
			<div>
				<div class="flex items-center gap-2 mb-1">
					<span
						class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold"
					>
						Turma #{data.turma.id_treino}
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-zinc-400 font-mono"
						>{data.turma.dia_semana}</span
					>
				</div>
				<h1
					class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight"
				>
					{data.turma.descricao}
				</h1>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<div
					class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2"
				>
					<Clock class="w-4 h-4 text-red-400" />
					<span class="text-xs font-mono text-zinc-200 font-medium">
						{data.turma.horario_inicio} às {data.turma.horario_fim}
					</span>
				</div>
				<div
					class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2"
				>
					<Users class="w-4 h-4 text-emerald-400" />
					<span class="text-xs font-mono text-zinc-200 font-medium">
						{data.turma.alunos_matriculados.length}/{data.turma
							.capacidade_maxima || 25} atletas
					</span>
				</div>
				{#if data.podeGerenciar}
					<button
						type="button"
						onclick={() =>
							(abaAtiva =
								abaAtiva === "editar" ? "chamada" : "editar")}
						class="px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 {abaAtiva ===
						'editar'
							? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
							: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'}"
					>
						<Settings class="w-3.5 h-3.5" />
						<span
							>{abaAtiva === "editar"
								? "Ver Treino"
								: "Editar Turma"}</span
						>
					</button>
				{/if}

				<button
					type="button"
					onclick={() => (modalImpressaoAberto = true)}
					class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700 shadow-sm hover:border-zinc-500 cursor-pointer active:scale-95"
					title="Imprimir lista de chamada e controle do treino"
				>
					<Printer class="w-3.5 h-3.5 text-red-500" />
					<span>Imprimir Chamada</span>
				</button>
			</div>
		</div>

		<!-- Senseis Responsáveis Alocados -->
		{#if data.turma.professores.length > 0}
			<div
				class="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400"
			>
				<span class="font-mono uppercase text-zinc-500"
					>Senseis Responsáveis:</span
				>
				{#each data.turma.professores as prof}
					<span
						class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-200"
					>
						<Award class="w-3.5 h-3.5 text-amber-500" />
						<span class="font-medium text-white">{prof.nome}</span>
						{#if prof.grau_faixa}
							<span class="text-zinc-500 font-mono"
								>({prof.grau_faixa})</span
							>
						{/if}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- NAVEGAÇÃO POR ABAS (Exclusiva para Admin, Professor e Recepção) -->
	{#if data.podeGerenciar}
		<div
			class="flex items-center gap-2 border-b border-zinc-900 pb-3 overflow-x-auto"
		>
			<button
				type="button"
				onclick={() => (abaAtiva = "chamada")}
				class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 {abaAtiva ===
				'chamada'
					? 'bg-zinc-900 text-white border border-zinc-800'
					: 'text-zinc-400 hover:text-white'}"
			>
				<ClipboardCheck class="w-4 h-4 text-red-500" />
				<span>Chamada no Tatame</span>
				{#if data.chamadaInfo.jaRegistrada}
					<span
						class="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-[10px] font-mono text-emerald-300 font-bold"
					>
						Salva
					</span>
				{:else}
					<span
						class="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/80 text-[10px] font-mono text-amber-300 font-bold"
					>
						Pendente
					</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => (abaAtiva = "historico")}
				class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 {abaAtiva ===
				'historico'
					? 'bg-zinc-900 text-white border border-zinc-800'
					: 'text-zinc-400 hover:text-white'}"
			>
				<Calendar class="w-4 h-4 text-amber-400" />
				<span>Histórico de Chamadas (Calendário)</span>
				<span
					class="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-mono text-amber-300"
				>
					{data.historicoChamadas?.length || 0} dia(s)
				</span>
			</button>

			<button
				type="button"
				onclick={() => (abaAtiva = "alunos")}
				class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 {abaAtiva ===
				'alunos'
					? 'bg-zinc-900 text-white border border-zinc-800'
					: 'text-zinc-400 hover:text-white'}"
			>
				<Users class="w-4 h-4 text-emerald-400" />
				<span>Judocas Matriculados</span>
				<span
					class="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-mono text-zinc-300"
				>
					{data.turma.alunos_matriculados.length}
				</span>
			</button>

			<button
				type="button"
				onclick={() => (abaAtiva = "editar")}
				class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 {abaAtiva ===
				'editar'
					? 'bg-zinc-900 text-white border border-zinc-800'
					: 'text-zinc-400 hover:text-white'}"
			>
				<Settings class="w-4 h-4 text-red-500" />
				<span>Editar Turma, Vagas e Senseis</span>
			</button>
		</div>
	{/if}

	<!-- ALERTAS DE FEEDBACK GLOBAIS -->
	{#if form?.sucessoChamada}
		<div
			class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-2"
		>
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
			<span
				>Chamada registrada com sucesso para o treino de {form.dataTreino}!</span
			>
		</div>
	{/if}

	{#if form?.erroChamada}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-center gap-2"
		>
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
			<span>{form.erroChamada}</span>
		</div>
	{/if}

	{#if form?.sucessoEdicao}
		<div
			class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-2"
		>
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
			<span>Informações e horários da turma atualizados com sucesso!</span
			>
		</div>
	{/if}

	{#if form?.erroEdicao}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-2"
		>
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
			<div>
				<span class="font-bold block">Erro ao atualizar a turma:</span>
				<span>{form.erroEdicao}</span>
			</div>
		</div>
	{/if}

	{#if form?.erroMatricula}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-center gap-2"
		>
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
			<span>{form.erroMatricula}</span>
		</div>
	{/if}

	<!-- CONTEÚDO DA ABA 1: JUDOCAS & MATRÍCULA -->
	{#if !data.podeGerenciar || abaAtiva === "alunos"}
		<!-- MATRICULAR NOVO ALUNO NA TURMA -->
		{#if data.podeGerenciar && data.alunosDisponiveis.length > 0}
			<div
				class="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4"
			>
				<div class="flex items-center justify-between">
					<div>
						<h3
							class="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-2"
						>
							<UserPlus class="w-4 h-4 text-red-500" />
							Adicionar Judoca à Turma
						</h3>
						<p class="text-xs text-zinc-500 mt-0.5">
							Selecione um dos {data.alunosDisponiveis.length} atletas
							do dojo ainda não matriculados neste horário.
						</p>
					</div>
				</div>

				<form
					action="?/matricular"
					method="POST"
					use:enhance={() => {
						carregandoMatricula = true;
						return async ({ update }) => {
							await update();
							carregandoMatricula = false;
							alunoSelecionado = "";
						};
					}}
					class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
				>
					<div class="flex-1">
						<select
							name="idAluno"
							bind:value={alunoSelecionado}
							required
							class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						>
							<option value=""
								>Selecione um judoca do dojo para incluir na
								turma...</option
							>
							{#each data.alunosDisponiveis as aluno}
								<option value={aluno.id_usuario}>
									{aluno.nome} ({aluno.graduacao_atual}) - {aluno.idade}
									anos {aluno.matricula
										? `• Matrícula: ${aluno.matricula}`
										: ""}
								</option>
							{/each}
						</select>
					</div>

					<button
						type="submit"
						disabled={carregandoMatricula || !alunoSelecionado}
						class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_15px_rgba(220,38,38,0.25)] transition-all disabled:opacity-50 shrink-0"
					>
						{#if carregandoMatricula}
							<span
								class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
							></span>
							<span>Adicionando...</span>
						{:else}
							<UserPlus class="w-4 h-4" />
							<span>Adicionar à Turma</span>
						{/if}
					</button>
				</form>
			</div>
		{/if}

		<!-- ========================================================================= -->
		<!-- LISTA DE CHAMADA COM MINIMIZAÇÃO (ACCORDION), FILTROS E ORDENAÇÃO         -->
		<!-- ========================================================================= -->
		<section
			class="rounded-3xl bg-zinc-950 border border-zinc-900 overflow-hidden shadow-sm"
		>
			<!-- Header Colapsável com Resumo (Padrão idêntico aos Logs do Dojo) -->
			<div
				class="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
				onclick={() => (listaChamadaExpandida = !listaChamadaExpandida)}
				role="button"
				tabindex="0"
				onkeydown={(e) =>
					e.key === "Enter" &&
					(listaChamadaExpandida = !listaChamadaExpandida)}
				aria-expanded={listaChamadaExpandida}
			>
				<div class="flex items-center gap-3">
					<div
						class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 shrink-0"
					>
						<Users class="w-5 h-5" />
					</div>
					<div>
						<div class="flex items-center gap-2 flex-wrap">
							<h2
								class="text-base font-bold text-white font-display"
							>
								Lista de Chamada & Judocas Matriculados
							</h2>
							<span
								class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold"
							>
								{alunosChamadaOrdenados.length}
								{alunosChamadaOrdenados.length === 1
									? "atleta"
									: "atletas"}
							</span>
							{#if data.turma.alunos_matriculados.filter((a) => a.menor_idade).length > 0}
								<span
									class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-300"
								>
									{data.turma.alunos_matriculados.filter(
										(a) => a.menor_idade,
									).length} menores
								</span>
							{/if}
						</div>
						<p class="text-[11px] text-zinc-400 mt-0.5">
							Alocação técnica de tatame, graduações ativas e
							categorias oficiais para o treino.
						</p>
					</div>
				</div>

				<div
					class="flex items-center gap-3 self-end sm:self-auto shrink-0"
				>
					<span
						class="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800"
					>
						{listaChamadaExpandida
							? "Recolher Chamada ▲"
							: "Expandir Chamada ▼"}
					</span>
					<div
						class="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-transform duration-200 {listaChamadaExpandida
							? 'rotate-180'
							: ''}"
					>
						<ChevronDown class="w-4 h-4" />
					</div>
				</div>
			</div>

			<!-- Conteúdo Expandido (Quando listaChamadaExpandida = true) -->
			{#if listaChamadaExpandida}
				<div
					class="border-t border-zinc-900 p-5 sm:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200 bg-zinc-950/80"
				>
					{#if data.turma.alunos_matriculados.length > 0}
						<!-- Barra de Ferramentas: Filtros + Busca + Ordenação + Densidade -->
						<div
							class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-zinc-900"
						>
							<!-- 1. Chips de Filtro & Busca Inline -->
							<div
								class="flex items-center gap-2 flex-wrap text-xs flex-1"
							>
								<span
									class="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1 mr-1"
								>
									<Filter class="w-3 h-3" />
									<span>Filtro:</span>
								</span>
								<button
									type="button"
									onclick={() =>
										(filtroIdadeChamada = "TODOS")}
									class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroIdadeChamada ===
									'TODOS'
										? 'bg-red-950/50 border-red-800/80 text-white font-bold'
										: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
								>
									Todos ({data.turma.alunos_matriculados
										.length})
								</button>
								<button
									type="button"
									onclick={() =>
										(filtroIdadeChamada = "MENORES")}
									class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroIdadeChamada ===
									'MENORES'
										? 'bg-amber-950/50 border-amber-800/80 text-amber-200 font-bold'
										: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
								>
									Menores de 18
								</button>
								<button
									type="button"
									onclick={() =>
										(filtroIdadeChamada = "ADULTOS")}
									class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all {filtroIdadeChamada ===
									'ADULTOS'
										? 'bg-sky-950/50 border-sky-800/80 text-sky-200 font-bold'
										: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
								>
									Adultos
								</button>

								<!-- Busca Rápida Inline -->
								<div
									class="relative ml-auto sm:ml-2 min-w-[200px]"
								>
									<Search
										class="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2"
									/>
									<input
										type="text"
										bind:value={filtroBuscaChamada}
										placeholder="Filtrar judoca nesta turma..."
										class="w-full pl-8 pr-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 font-mono"
									/>
									{#if filtroBuscaChamada}
										<button
											type="button"
											onclick={() =>
												(filtroBuscaChamada = "")}
											class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
										>
											×
										</button>
									{/if}
								</div>
							</div>

							<!-- 2. Controles de Ordenação e Densidade -->
							<div
								class="flex items-center gap-3 flex-wrap self-end lg:self-auto"
							>
								<!-- Seletor de Ordenação -->
								<div
									class="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800"
								>
									<span
										class="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1 pl-1"
									>
										<ArrowUpDown
											class="w-3 h-3 text-red-500"
										/>
										<span>Ordenar:</span>
									</span>
									<select
										bind:value={campoOrdenacaoChamada}
										class="bg-zinc-950 border border-zinc-800 text-white text-xs font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-red-600"
									>
										<option value="graduacao"
											>Graduação (Faixa)</option
										>
										<option value="idade">Idade</option>
										<option value="categoria"
											>Categoria CBJ</option
										>
										<option value="nome">Nome (A-Z)</option>
									</select>

									<!-- Alternador de Direção Asc/Desc -->
									<button
										type="button"
										onclick={alternarDirecaoChamada}
										class="p-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
										title={direcaoOrdenacaoChamada === "asc"
											? "Ordem Crescente (clique para inverter)"
											: "Ordem Decrescente (clique para inverter)"}
									>
										{#if direcaoOrdenacaoChamada === "asc"}
											<ArrowUp
												class="w-3.5 h-3.5 text-red-400"
											/>
										{:else}
											<ArrowDown
												class="w-3.5 h-3.5 text-amber-400"
											/>
										{/if}
									</button>
								</div>

								<!-- Alternador de Densidade (Detalhada vs Compacta) -->
								<div
									class="p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center"
								>
									<button
										type="button"
										onclick={() =>
											(densidadeChamada = "detalhada")}
										class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 {densidadeChamada ===
										'detalhada'
											? 'bg-zinc-800 text-white font-bold shadow-sm'
											: 'text-zinc-500 hover:text-zinc-300'}"
										title="Visualização Detalhada em Tabela"
									>
										<LayoutList class="w-3.5 h-3.5" />
										<span>Detalhada</span>
									</button>
									<button
										type="button"
										onclick={() =>
											(densidadeChamada = "compacta")}
										class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 {densidadeChamada ===
										'compacta'
											? 'bg-zinc-800 text-white font-bold shadow-sm'
											: 'text-zinc-500 hover:text-zinc-300'}"
										title="Visualização Compacta / Minimizada com Rolagem Interna"
									>
										<AlignJustify class="w-3.5 h-3.5" />
										<span>Compacta</span>
									</button>
								</div>
							</div>
						</div>

						<!-- Tabela de Chamada (Detalhada ou Compacta) -->
						{#if alunosChamadaOrdenados.length > 0}
							<div
								class="overflow-hidden rounded-2xl border border-zinc-900 {densidadeChamada ===
								'compacta'
									? 'max-h-96 overflow-y-auto'
									: ''}"
							>
								<div class="overflow-x-auto">
									<table
										class="w-full text-left text-xs sm:text-sm text-zinc-300"
									>
										<thead
											class="bg-zinc-900/80 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-800 sticky top-0 backdrop-blur-sm z-10"
										>
											<tr>
												<th
													class={densidadeChamada ===
													"compacta"
														? "px-4 py-2.5"
														: "px-6 py-4"}
												>
													Judoca
												</th>
												<th
													class={densidadeChamada ===
													"compacta"
														? "px-4 py-2.5"
														: "px-6 py-4"}
												>
													Graduação (Faixa)
												</th>
												<th
													class={densidadeChamada ===
													"compacta"
														? "px-4 py-2.5"
														: "px-6 py-4"}
												>
													Idade
												</th>
												<th
													class={densidadeChamada ===
													"compacta"
														? "px-4 py-2.5"
														: "px-6 py-4"}
												>
													Categoria CBJ
												</th>
												{#if densidadeChamada === "detalhada"}
													<th class="px-6 py-4"
														>Matrícula</th
													>
												{/if}
												{#if data.podeGerenciar}
													<th
														class="{densidadeChamada ===
														'compacta'
															? 'px-4 py-2.5'
															: 'px-6 py-4'} text-right"
													>
														Ação
													</th>
												{/if}
											</tr>
										</thead>
										<tbody class="divide-y divide-zinc-900">
											{#each alunosChamadaOrdenados as aluno}
												<tr
													class="hover:bg-zinc-900/30 transition-colors"
												>
													<!-- Judoca -->
													<td
														class="{densidadeChamada ===
														'compacta'
															? 'px-4 py-2'
															: 'px-6 py-4'} font-semibold text-white"
													>
														{#if data.podeVerAlunos}
															<a
																href="/dashboard/alunos/{aluno.id_usuario}"
																class="hover:text-red-400 hover:underline transition-colors block {densidadeChamada ===
																'compacta'
																	? 'text-xs'
																	: ''}"
															>
																{aluno.nome}
															</a>
														{:else}
															<span
																class={densidadeChamada ===
																"compacta"
																	? "text-xs"
																	: ""}
																>{aluno.nome}</span
															>
														{/if}
														{#if densidadeChamada === "compacta" && aluno.matricula}
															<span
																class="text-[10px] font-mono text-zinc-500"
																>Mat: {aluno.matricula}</span
															>
														{/if}
													</td>

													<!-- Faixa com mesmo tamanho uniforme e legenda na versão detalhada -->
													<td
														class={densidadeChamada ===
														"compacta"
															? "px-4 py-2"
															: "px-6 py-4"}
													>
														<BadgeFaixa
															faixa={aluno.graduacao_atual}
															size={densidadeChamada ===
															"detalhada"
																? "md"
																: "sm"}
															showLegend={densidadeChamada ===
																"detalhada"}
														/>
													</td>

													<!-- Idade -->
													<td
														class={densidadeChamada ===
														"compacta"
															? "px-4 py-2"
															: "px-6 py-4"}
													>
														<div
															class="flex items-center gap-1.5 font-mono text-zinc-300"
														>
															<span
																class="text-xs"
																>{aluno.idade} anos</span
															>
															{#if aluno.menor_idade}
																<span
																	class="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-950/40 border border-amber-800/60 text-amber-300"
																>
																	Menor
																</span>
															{/if}
														</div>
													</td>

													<!-- Categoria CBJ -->
													<td
														class={densidadeChamada ===
														"compacta"
															? "px-4 py-2"
															: "px-6 py-4"}
													>
														{#if aluno.categoria}
															<span
																class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-800/50"
															>
																{aluno.categoria}
															</span>
														{:else}
															<span
																class="text-zinc-600 font-mono text-[11px]"
																>-</span
															>
														{/if}
													</td>

													<!-- Matrícula -->
													{#if densidadeChamada === "detalhada"}
														<td
															class="px-6 py-4 font-mono text-zinc-400"
														>
															{aluno.matricula ||
																"-"}
														</td>
													{/if}

													<!-- Ação de Remover -->
													{#if data.podeGerenciar}
														<td
															class="{densidadeChamada ===
															'compacta'
																? 'px-4 py-2'
																: 'px-6 py-4'} text-right"
														>
															<form
																action="?/desmatricular"
																method="POST"
																use:enhance
																class="inline-block"
															>
																<input
																	type="hidden"
																	name="idAluno"
																	value={aluno.id_usuario}
																/>
																<button
																	type="submit"
																	class="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
																	title="Remover judoca desta turma"
																>
																	<Trash2
																		class="w-4 h-4"
																	/>
																</button>
															</form>
														</td>
													{/if}
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{:else}
							<div
								class="p-8 text-center text-xs text-zinc-500 font-mono"
							>
								Nenhum judoca encontrado com os filtros
								aplicados.
							</div>
						{/if}
					{:else}
						<div
							class="p-8 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center"
						>
							<Users class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
							<h4
								class="text-sm font-bold text-white font-display"
							>
								Nenhum judoca matriculado nesta turma
							</h4>
							<p
								class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto"
							>
								Utilize o seletor acima para matricular atletas
								do dojo neste treino.
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</section>
	{/if}

	<!-- CONTEÚDO DA ABA 2: CHAMADA NO TATAME -->
	{#if data.podeGerenciar && abaAtiva === "chamada"}
		<div class="space-y-6">
			<!-- BARRA DE CONTROLE DA DATA & AÇÕES RÁPIDAS -->
			<div
				class="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4"
			>
				<div
					class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-900"
				>
					<div>
						<div class="flex items-center gap-2">
							<ClipboardCheck class="w-5 h-5 text-red-500" />
							<h2
								class="text-base font-bold text-white font-display"
							>
								Chamada de Tatame
							</h2>
							{#if data.chamadaInfo.jaRegistrada}
								<span
									class="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1"
								>
									<Check class="w-3 h-3" />
									Registrada no Sistema
								</span>
							{:else}
								<span
									class="px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-800 text-[11px] font-mono font-semibold text-amber-400"
								>
									Não registrada ainda
								</span>
							{/if}
						</div>
						<p class="text-xs text-zinc-400 mt-0.5">
							Controle de frequência e presença dos atletas
							matriculados no horário de treino.
						</p>
					</div>

					<!-- SELETOR DE DATA DO TREINO -->
					<div class="flex items-center gap-3">
						<label
							for="seletorDataChamada"
							class="text-xs font-mono uppercase text-zinc-400 shrink-0"
						>
							Data do Treino:
						</label>
						<input
							type="date"
							id="seletorDataChamada"
							bind:value={dataChamadaSelecionada}
							onchange={(e) =>
								navegarDataChamada(e.currentTarget.value)}
							class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						/>
					</div>
				</div>

				<!-- RESUMO RÁPIDO DE FREQUÊNCIA DO DIA -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div
						class="p-3 rounded-xl bg-zinc-900/50 border border-zinc-900 flex items-center justify-between"
					>
						<div>
							<span
								class="text-[10px] font-mono uppercase text-zinc-500 block"
								>Total Atletas</span
							>
							<span class="text-lg font-bold font-mono text-white"
								>{itensPresenca.length}</span
							>
						</div>
						<Users class="w-5 h-5 text-zinc-600" />
					</div>
					<div
						class="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between"
					>
						<div>
							<span
								class="text-[10px] font-mono uppercase text-emerald-400 block"
								>Presentes</span
							>
							<span
								class="text-lg font-bold font-mono text-emerald-300"
								>{totalPresentes} ({percentualPresentes}%)</span
							>
						</div>
						<CheckCircle2 class="w-5 h-5 text-emerald-500" />
					</div>
					<div
						class="p-3 rounded-xl bg-red-950/20 border border-red-900/40 flex items-center justify-between"
					>
						<div>
							<span
								class="text-[10px] font-mono uppercase text-red-400 block"
								>Faltas</span
							>
							<span
								class="text-lg font-bold font-mono text-red-300"
								>{totalFaltas}</span
							>
						</div>
						<X class="w-5 h-5 text-red-500" />
					</div>
					<div
						class="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between"
					>
						<div>
							<span
								class="text-[10px] font-mono uppercase text-amber-400 block"
								>Justificadas</span
							>
							<span
								class="text-lg font-bold font-mono text-amber-300"
								>{totalJustificadas}</span
							>
						</div>
						<AlertTriangle class="w-5 h-5 text-amber-500" />
					</div>
				</div>

				<!-- AÇÕES RÁPIDAS EM LOTE (Apenas perfis autorizados: admin, professor, recepção) -->
				{#if data.podeGerenciar && itensPresenca.length > 0}
					<div
						class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-900"
					>
						<div class="flex items-center gap-2">
							<span class="text-xs text-zinc-500 font-mono"
								>Ações rápidas:</span
							>
							<button
								type="button"
								onclick={() => marcarTodos("Presente")}
								class="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-emerald-300 transition-colors"
							>
								Marcar Todos Presentes
							</button>
							<button
								type="button"
								onclick={() => marcarTodos("Falta")}
								class="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 transition-colors"
							>
								Marcar Todos Falta
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- TABELA / LISTA DE JUDOCAS NA CHAMADA -->
			{#if itensPresenca.length > 0}
				<form
					action="?/salvarChamada"
					method="POST"
					use:enhance={() => {
						carregandoChamada = true;
						return async ({ update }) => {
							await update();
							carregandoChamada = false;
							toast.sucesso(
								"Chamada no tatame salva com sucesso!",
							);
						};
					}}
					class="space-y-4"
				>
					<input
						type="hidden"
						name="dataTreino"
						value={dataChamadaSelecionada}
					/>
					<input
						type="hidden"
						name="itens"
						value={JSON.stringify(
							itensPresenca.map((i) => ({
								idAluno: i.idAluno,
								status: i.status,
								observacao: i.observacao.trim() || null,
							})),
						)}
					/>

					<div
						class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900"
					>
						<div class="overflow-x-auto">
							<table
								class="w-full text-left text-xs sm:text-sm text-zinc-300"
							>
								<thead
									class="bg-zinc-900/80 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-800"
								>
									<tr>
										<th class="px-5 py-3.5">Judoca</th>
										<th class="px-5 py-3.5">Graduação</th>
										<th class="px-5 py-3.5"
											>Status da Presença</th
										>
										<th class="px-5 py-3.5"
											>Observação (Opcional)</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-900">
									{#each itensPresenca as item}
										<tr
											class="hover:bg-zinc-900/30 transition-colors"
										>
											<td
												class="px-5 py-3 font-semibold text-white"
											>
												<div
													class="flex flex-col gap-1"
												>
													<span>{item.nome}</span>
													{#if item.observacao && item.observacao.includes("[Aviso do Responsável]")}
														<span
															class="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-300"
														>
															Pré-Justificada pela
															Família
														</span>
													{/if}
												</div>
											</td>
											<td class="px-5 py-3">
												{#if item.grauFaixa}
													<BadgeFaixa
														faixa={item.grauFaixa}
														size="sm"
													/>
												{:else}
													<span
														class="text-zinc-600 italic text-xs"
														>Sem faixa</span
													>
												{/if}
											</td>
											<td class="px-5 py-3">
												{#if data.podeGerenciar}
													<div
														class="inline-flex rounded-xl p-1 bg-zinc-900 border border-zinc-800 gap-1"
													>
														<button
															type="button"
															onclick={() =>
																alterarStatus(
																	item.idAluno,
																	"Presente",
																)}
															class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all {item.status ===
															'Presente'
																? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
																: 'text-zinc-400 hover:text-white'}"
														>
															Presente
														</button>
														<button
															type="button"
															onclick={() =>
																alterarStatus(
																	item.idAluno,
																	"Falta",
																)}
															class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all {item.status ===
															'Falta'
																? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
																: 'text-zinc-400 hover:text-white'}"
														>
															Falta
														</button>
														<button
															type="button"
															onclick={() =>
																alterarStatus(
																	item.idAluno,
																	"Justificada",
																)}
															class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all {item.status ===
															'Justificada'
																? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]'
																: 'text-zinc-400 hover:text-white'}"
														>
															Justificada
														</button>
													</div>
												{:else}
													<span
														class="px-2.5 py-1 rounded-lg text-xs font-semibold {item.status ===
														'Presente'
															? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
															: item.status ===
																  'Falta'
																? 'bg-red-950/60 border border-red-800 text-red-300'
																: 'bg-amber-950/60 border border-amber-800 text-amber-300'}"
													>
														{item.status}
													</span>
												{/if}
											</td>
											<td class="px-5 py-3">
												{#if data.podeGerenciar}
													<input
														type="text"
														bind:value={
															item.observacao
														}
														placeholder="Ex: Atestado, atraso..."
														maxlength="255"
														class="w-full max-w-xs px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
													/>
												{:else}
													<span
														class="text-xs text-zinc-500 italic"
													>
														{item.observacao || "—"}
													</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					{#if data.podeGerenciar}
						<div class="flex items-center justify-end gap-3 pt-2">
							<button
								type="submit"
								disabled={carregandoChamada}
								class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50"
							>
								{#if carregandoChamada}
									<span
										class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
									></span>
									<span>Salvando Chamada...</span>
								{:else}
									<CheckCircle2 class="w-4 h-4" />
									<span>Salvar Presenças no Tatame</span>
								{/if}
							</button>
						</div>
					{/if}
				</form>
			{:else}
				<div
					class="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center"
				>
					<Users class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
					<h3 class="text-base font-bold text-white font-display">
						Nenhum judoca matriculado nesta turma
					</h3>
					<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
						Adicione atletas à turma na aba "Judocas Matriculados"
						para poder realizar a chamada de presença.
					</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- CONTEÚDO DA ABA: HISTÓRICO DE CHAMADAS (CALENDÁRIO MENSAL COM POPUP) -->
	{#if data.podeGerenciar && abaAtiva === "historico"}
		<div class="space-y-6 animate-in fade-in duration-200">
			<div
				class="rounded-2xl border border-zinc-800/90 bg-zinc-950 p-5 sm:p-6 shadow-xl space-y-5"
			>
				<!-- Cabeçalho do Calendário de Histórico da Turma -->
				<div
					class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-4"
				>
					<div>
						<div class="flex items-center gap-2">
							<Calendar class="w-5 h-5 text-amber-400" />
							<h2
								class="text-base sm:text-lg font-bold text-white font-display"
							>
								Histórico Mensal de Chamadas — {data.turma
									.descricao}
							</h2>
						</div>
						<p class="text-xs text-zinc-400 mt-0.5">
							Clique em qualquer dia registrado no calendário para
							abrir o popup com a relação completa de judocas e
							alterar presenças se necessário
						</p>
					</div>

					<div
						class="flex items-center gap-2 self-start sm:self-auto"
					>
						<button
							type="button"
							onclick={mesAnteriorHistorico}
							class="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
							title="Mês anterior"
						>
							<ChevronLeft class="w-4 h-4" />
						</button>

						<div class="min-w-[155px] text-center">
							<span class="text-sm font-bold text-white">
								{nomesMesesHistorico[mesHistorico]}
								<span class="text-amber-400"
									>{anoHistorico}</span
								>
							</span>
						</div>

						<button
							type="button"
							onclick={proximoMesHistorico}
							class="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
							title="Próximo mês"
						>
							<ChevronRight class="w-4 h-4" />
						</button>

						<button
							type="button"
							onclick={irParaHojeHistorico}
							class="ml-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-amber-500/40 hover:text-amber-300 transition cursor-pointer"
						>
							Mês Atual
						</button>
					</div>
				</div>

				<!-- Resumo do Mês Selecionado -->
				<div class="flex flex-wrap items-center gap-2.5 text-xs">
					<div
						class="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300"
					>
						<CalendarCheck class="w-3.5 h-3.5 text-amber-400" />
						<span
							>Dias com chamada salva no mês: <strong
								>{resumoMesHistorico.diasRegistrados}</strong
							></span
						>
					</div>
					<div
						class="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300"
					>
						<span class="h-2 w-2 rounded-full bg-emerald-400"
						></span>
						<span
							>Presenças acumuladas: <strong
								>{resumoMesHistorico.totalPresencas}</strong
							></span
						>
					</div>
					<div
						class="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-red-300"
					>
						<span class="h-2 w-2 rounded-full bg-red-400"></span>
						<span
							>Faltas: <strong
								>{resumoMesHistorico.totalFaltasMes}</strong
							></span
						>
					</div>
					<div
						class="flex items-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-sky-300"
					>
						<span class="h-2 w-2 rounded-full bg-sky-400"></span>
						<span
							>Justificadas: <strong
								>{resumoMesHistorico.totalJustificadasMes}</strong
							></span
						>
					</div>
				</div>

				<!-- Cabeçalho dos Dias da Semana -->
				<div class="grid grid-cols-7 gap-1.5 sm:gap-2 text-center pt-1">
					{#each diasCabecalhoHistorico as nomeDia}
						<div
							class="py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500"
						>
							{nomeDia}
						</div>
					{/each}
				</div>

				<!-- Grade do Calendário Mensal da Turma -->
				<div class="grid grid-cols-7 gap-1.5 sm:gap-2">
					{#each celulasCalendarioHistorico as cel}
						{#if cel.vazia}
							<div
								class="min-h-[82px] sm:min-h-[104px] rounded-xl bg-zinc-900/15 border border-transparent"
							></div>
						{:else}
							{@const reg = cel.registroDia}
							<button
								type="button"
								onclick={() =>
									abrirPopupRelacaoDia(cel.dataIso)}
								class="group relative flex min-h-[82px] sm:min-h-[104px] flex-col justify-between rounded-xl border p-2 text-left transition-all cursor-pointer {reg
									? 'border-emerald-500/50 bg-emerald-950/15 hover:border-amber-400 hover:bg-zinc-900/90 shadow-sm'
									: cel.ehDiaDaTurma
										? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900'
										: 'border-zinc-900/80 bg-zinc-950/60 hover:border-zinc-800'}"
							>
								<div
									class="flex items-center justify-between w-full"
								>
									<span
										class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold {cel.ehHoje
											? 'bg-amber-500 text-zinc-950'
											: reg
												? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
												: cel.ehDiaDaTurma
													? 'text-zinc-200'
													: 'text-zinc-500'}"
									>
										{cel.diaNumero}
									</span>

									{#if reg}
										<span
											class="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300"
										>
											{reg.percentual_presenca}%
										</span>
									{:else if cel.ehDiaDaTurma}
										<span
											class="hidden sm:inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400"
										>
											Dia da turma
										</span>
									{/if}
								</div>

								{#if reg}
									<div class="mt-1.5 space-y-1 w-full">
										<div
											class="flex items-center justify-between rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300"
										>
											<span>Presentes</span>
											<span class="font-mono font-bold"
												>{reg.total_presentes}</span
											>
										</div>
										{#if reg.total_faltas > 0 || reg.total_justificadas > 0}
											<div
												class="flex items-center gap-1 text-[9px] font-mono"
											>
												{#if reg.total_faltas > 0}
													<span
														class="rounded bg-red-500/15 border border-red-500/30 px-1 py-0.5 text-red-300"
													>
														{reg.total_faltas} F
													</span>
												{/if}
												{#if reg.total_justificadas > 0}
													<span
														class="rounded bg-sky-500/15 border border-sky-500/30 px-1 py-0.5 text-sky-300"
													>
														{reg.total_justificadas}
														J
													</span>
												{/if}
											</div>
										{/if}
									</div>
								{:else if cel.ehDiaDaTurma}
									<div
										class="mt-2 text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors"
									>
										Sem chamada salva
									</div>
								{/if}
							</button>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Lista Rápida de Todos os Dias com Chamada Salva -->
			<div
				class="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4"
			>
				<div
					class="flex items-center justify-between border-b border-zinc-900 pb-3"
				>
					<div>
						<h3 class="text-sm font-bold text-white font-display">
							Todos os Dias com Chamada Registrada ({data
								.historicoChamadas?.length || 0})
						</h3>
						<p class="text-xs text-zinc-400">
							Selecione qualquer data abaixo para abrir o popup
							com a relação de presença e editar se necessário
						</p>
					</div>
				</div>

				{#if !data.historicoChamadas || data.historicoChamadas.length === 0}
					<div
						class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center"
					>
						<p class="text-xs text-zinc-400">
							Nenhuma chamada foi salva ainda para esta turma.
						</p>
					</div>
				{:else}
					<div
						class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
					>
						{#each data.historicoChamadas as itemDia}
							<button
								type="button"
								onclick={() =>
									abrirPopupRelacaoDia(itemDia.data_treino)}
								class="flex flex-col justify-between p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
							>
								<div
									class="flex items-center justify-between w-full mb-2"
								>
									<span
										class="text-sm font-bold font-mono text-white group-hover:text-amber-300 transition-colors"
									>
										{formatarDataBr(itemDia.data_treino)}
									</span>
									<span
										class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-300"
									>
										{itemDia.percentual_presenca}% presença
									</span>
								</div>

								<div class="flex items-center gap-2 text-xs">
									<span class="text-emerald-400 font-semibold"
										>{itemDia.total_presentes} Pres.</span
									>
									<span>•</span>
									<span class="text-red-400"
										>{itemDia.total_faltas} Falta(s)</span
									>
									<span>•</span>
									<span class="text-sky-400"
										>{itemDia.total_justificadas} Just.</span
									>
								</div>

								<div
									class="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 w-full"
								>
									<span class="truncate">
										Por: {itemDia.nome_registrador ||
											"Sensei"}
									</span>
									<span
										class="text-amber-400 font-semibold inline-flex items-center gap-1 shrink-0"
									>
										<Eye class="w-3 h-3" /> Abrir Relação
									</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- POPUP / MODAL: RELAÇÃO DE PRESENÇA DO DIA SELECIONADO                     -->
	<!-- ========================================================================= -->
	{#if data.podeGerenciar && modalRelacaoDiaAberto}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-150"
			role="dialog"
			aria-modal="true"
			aria-labelledby="titulo-modal-relacao-dia"
		>
			<div
				class="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
			>
				<!-- Cabeçalho do Popup -->
				<div
					class="flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-900/70 p-4 sm:p-6"
				>
					<div class="space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-300"
							>
								<Calendar class="w-3.5 h-3.5" />
								{formatarDataBr(dataPopupSelecionada)}
							</span>
							{#if infoMetaPopup.jaRegistrada}
								<span
									class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300"
								>
									<CheckCircle2 class="w-3.5 h-3.5" /> Chamada
									Registrada
								</span>
							{:else}
								<span
									class="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300"
								>
									Chamada ainda não lançada neste dia
								</span>
							{/if}
						</div>

						<h3
							id="titulo-modal-relacao-dia"
							class="text-base sm:text-lg font-extrabold text-white font-display capitalize"
						>
							{formatarDataExtensoPopup(dataPopupSelecionada)}
						</h3>

						<p class="text-xs text-zinc-400">
							{data.turma.descricao} • {data.turma.horario_inicio}
							às {data.turma.horario_fim}
							{#if infoMetaPopup.nomeRegistrador}
								• Último registro por <strong
									class="text-zinc-200"
									>{infoMetaPopup.nomeRegistrador}</strong
								>
								{#if infoMetaPopup.ultimaAtualizacao}
									em {infoMetaPopup.ultimaAtualizacao}
								{/if}
							{/if}
						</p>
					</div>

					<button
						type="button"
						onclick={() => (modalRelacaoDiaAberto = false)}
						class="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:border-zinc-700 hover:text-white transition cursor-pointer"
						title="Fechar popup"
					>
						<X class="w-5 h-5" />
					</button>
				</div>

				<!-- Barra de Contadores e Filtro Rápido no Popup -->
				<div
					class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-900/30 px-4 sm:px-6 py-3"
				>
					<div class="flex flex-wrap items-center gap-2 text-xs">
						<span
							class="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300"
						>
							Presentes: {metricasPopup.pres} ({metricasPopup.pct}%)
						</span>
						<span
							class="rounded-lg bg-red-500/15 border border-red-500/30 px-2.5 py-1 font-bold text-red-300"
						>
							Faltas: {metricasPopup.falt}
						</span>
						<span
							class="rounded-lg bg-sky-500/15 border border-sky-500/30 px-2.5 py-1 font-bold text-sky-300"
						>
							Justificadas: {metricasPopup.just}
						</span>

						{#if data.podeGerenciar && itensPopupPresenca.length > 0}
							<button
								type="button"
								onclick={() => marcarTodosPopup("Presente")}
								class="ml-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition cursor-pointer"
							>
								Todos Presentes
							</button>
							<button
								type="button"
								onclick={() => marcarTodosPopup("Falta")}
								class="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition cursor-pointer"
							>
								Todos Falta
							</button>
						{/if}
					</div>

					<div class="relative min-w-[200px]">
						<Search
							class="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2"
						/>
						<input
							type="text"
							bind:value={buscaAlunoPopup}
							placeholder="Buscar judoca na relação..."
							class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
						/>
					</div>
				</div>

				<!-- Formulário com a Lista de Judocas do Dia -->
				<form
					action="?/salvarChamada"
					method="POST"
					use:enhance={() => {
						salvandoPopupChamada = true;
						return async ({ update }) => {
							await update();
							salvandoPopupChamada = false;
							modalRelacaoDiaAberto = false;
							toast.sucesso(
								`Relação de presença de ${formatarDataBr(dataPopupSelecionada)} atualizada com sucesso!`,
							);
						};
					}}
					class="flex flex-1 flex-col overflow-hidden"
				>
					<input
						type="hidden"
						name="dataTreino"
						value={dataPopupSelecionada}
					/>
					<input
						type="hidden"
						name="itens"
						value={JSON.stringify(
							itensPopupPresenca.map((i) => ({
								idAluno: i.idAluno,
								status: i.status,
								observacao: i.observacao.trim() || null,
							})),
						)}
					/>

					<div class="flex-1 overflow-y-auto p-4 sm:p-6">
						{#if itensPopupFiltrados.length === 0}
							<div class="p-8 text-center text-xs text-zinc-500">
								Nenhum judoca encontrado para esta relação.
							</div>
						{:else}
							<div
								class="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20"
							>
								<table
									class="w-full text-left text-xs sm:text-sm text-zinc-300"
								>
									<thead
										class="bg-zinc-900/90 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-800"
									>
										<tr>
											<th class="px-4 py-3">Judoca</th>
											<th class="px-4 py-3">Faixa</th>
											<th class="px-4 py-3"
												>Status no Dia</th
											>
											<th class="px-4 py-3"
												>Observação / Justificativa</th
											>
										</tr>
									</thead>
									<tbody class="divide-y divide-zinc-800/70">
										{#each itensPopupFiltrados as item}
											<tr
												class="hover:bg-zinc-900/40 transition-colors"
											>
												<td
													class="px-4 py-2.5 font-semibold text-white"
												>
													<div
														class="flex flex-col gap-0.5"
													>
														<span>{item.nome}</span>
														{#if item.observacao && item.observacao.includes("[Aviso do Responsável]")}
															<span
																class="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-300"
															>
																Pré-Justificada
																pela Família
															</span>
														{/if}
													</div>
												</td>
												<td class="px-4 py-2.5">
													{#if item.grauFaixa}
														<BadgeFaixa
															faixa={item.grauFaixa}
															size="sm"
														/>
													{:else}
														<span
															class="text-xs text-zinc-600"
															>—</span
														>
													{/if}
												</td>
												<td class="px-4 py-2.5">
													{#if data.podeGerenciar}
														<div
															class="inline-flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 gap-1"
														>
															<button
																type="button"
																onclick={() =>
																	alterarStatusPopup(
																		item.idAluno,
																		"Presente",
																	)}
																class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {item.status ===
																'Presente'
																	? 'bg-emerald-600 text-white shadow'
																	: 'text-zinc-400 hover:text-white'}"
															>
																Presente
															</button>
															<button
																type="button"
																onclick={() =>
																	alterarStatusPopup(
																		item.idAluno,
																		"Falta",
																	)}
																class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {item.status ===
																'Falta'
																	? 'bg-red-600 text-white shadow'
																	: 'text-zinc-400 hover:text-white'}"
															>
																Falta
															</button>
															<button
																type="button"
																onclick={() =>
																	alterarStatusPopup(
																		item.idAluno,
																		"Justificada",
																	)}
																class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer {item.status ===
																'Justificada'
																	? 'bg-amber-600 text-white shadow'
																	: 'text-zinc-400 hover:text-white'}"
															>
																Justificada
															</button>
														</div>
													{:else}
														<span
															class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border {item.status ===
															'Presente'
																? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
																: item.status ===
																	  'Falta'
																	? 'bg-red-950/50 border-red-800 text-red-300'
																	: 'bg-amber-950/50 border-amber-800 text-amber-300'}"
														>
															{item.status}
														</span>
													{/if}
												</td>
												<td class="px-4 py-2.5">
													{#if data.podeGerenciar}
														<input
															type="text"
															bind:value={
																item.observacao
															}
															placeholder="Ex: Atestado, atraso..."
															maxlength="255"
															class="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
														/>
													{:else}
														<span
															class="text-xs text-zinc-400"
															>{item.observacao ||
																"—"}</span
														>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>

					<!-- Rodapé de Ações do Popup -->
					<div
						class="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/70 px-4 sm:px-6 py-4"
					>
						<button
							type="button"
							onclick={() => {
								modalRelacaoDiaAberto = false;
								abaAtiva = "chamada";
								navegarDataChamada(dataPopupSelecionada);
							}}
							class="text-xs font-semibold text-zinc-400 hover:text-amber-300 transition cursor-pointer"
						>
							Abrir este dia na Aba Chamada Completa →
						</button>

						<div class="flex items-center gap-2.5 ml-auto">
							<button
								type="button"
								onclick={() => (modalRelacaoDiaAberto = false)}
								class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition cursor-pointer"
							>
								Fechar
							</button>

							{#if data.podeGerenciar && itensPopupPresenca.length > 0}
								<button
									type="submit"
									disabled={salvandoPopupChamada}
									class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-red-950/50 transition cursor-pointer"
								>
									{#if salvandoPopupChamada}
										<span
											class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
										></span>
										<span>Salvando...</span>
									{:else}
										<CheckCircle2 class="w-4 h-4" />
										<span>Salvar Alterações deste Dia</span>
									{/if}
								</button>
							{/if}
						</div>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- CONTEÚDO DA ABA 3: EDITAR TURMA, HORÁRIOS & SENSEIS -->
	{#if data.podeGerenciar && abaAtiva === "editar"}
		<form
			action="?/atualizar"
			method="POST"
			use:enhance={() => {
				carregandoEdicao = true;
				return async ({ update }) => {
					await update();
					carregandoEdicao = false;
				};
			}}
			class="space-y-6 max-w-4xl"
		>
			<!-- 1. IDENTIFICAÇÃO E DIAS -->
			<div
				class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6"
			>
				<div
					class="flex items-center gap-3 pb-4 border-b border-zinc-900"
				>
					<div
						class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
					>
						<Calendar class="w-4 h-4 text-red-500" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">
							Identificação da Turma
						</h2>
						<p class="text-[11px] text-zinc-500">
							Altere a descrição e os dias da semana do treino
						</p>
					</div>
				</div>

				<div>
					<label
						for="descricao"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Descrição da Turma / Categoria *
					</label>
					<input
						type="text"
						id="descricao"
						name="descricao"
						required
						value={data.turma.descricao}
						placeholder="Ex: Judô Infantil Sub-11 / Faixas Iniciais"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<span
						class="block text-xs font-mono uppercase text-zinc-400 mb-2"
					>
						Dias da Semana em que o Treino Ocorre *
					</span>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
						{#each diasSemanaOpcoes as dia}
							<label
								class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors {diasSelecionados.includes(
									dia,
								)
									? 'bg-red-950/20 border-red-800/80 text-white'
									: 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 text-zinc-300'}"
							>
								<input
									type="checkbox"
									name="dias"
									value={dia}
									checked={diasSelecionados.includes(dia)}
									onchange={() => alternarDia(dia)}
									class="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-red-600"
								/>
								<span class="text-xs font-medium">{dia}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<!-- 2. ALTERAÇÃO DOS HORÁRIOS -->
			<div
				class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6"
			>
				<div
					class="flex items-center gap-3 pb-4 border-b border-zinc-900"
				>
					<div
						class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
					>
						<Clock class="w-4 h-4 text-red-500" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">
							Horários de Tatame
						</h2>
						<p class="text-[11px] text-zinc-500">
							Defina o horário exato de início e término das aulas
						</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<label
							for="horarioInicio"
							class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
						>
							Horário de Início *
						</label>
						<input
							type="time"
							id="horarioInicio"
							name="horarioInicio"
							required
							value={data.turma.horario_inicio}
							class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						/>
					</div>

					<div>
						<label
							for="horarioFim"
							class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
						>
							Horário de Término *
						</label>
						<input
							type="time"
							id="horarioFim"
							name="horarioFim"
							required
							value={data.turma.horario_fim}
							class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						/>
					</div>

					<div>
						<label
							for="capacidadeMaxima"
							class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
						>
							Capacidade Máxima *
						</label>
						<div class="relative">
							<input
								type="number"
								id="capacidadeMaxima"
								name="capacidadeMaxima"
								min="1"
								max="500"
								required
								value={data.turma.capacidade_maxima || 25}
								class="w-full px-4 py-2.5 pr-14 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
							/>
							<span
								class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-zinc-500"
							>
								vagas
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- 3. PROFESSORES VINCULADOS AO TREINO (SUPORTE A MAIS DE UM PROFESSOR) -->
			<div
				class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6"
			>
				<div
					class="flex items-center justify-between pb-4 border-b border-zinc-900"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
						>
							<Award class="w-4 h-4 text-red-500" />
						</div>
						<div>
							<h2
								class="text-sm font-bold text-white font-display"
							>
								Equipe de Senseis Responsáveis
							</h2>
							<p class="text-[11px] text-zinc-500">
								Selecione um ou mais professores vinculados a
								este horário de treino
							</p>
						</div>
					</div>

					<span class="text-xs font-mono text-zinc-400">
						{professoresSelecionados.length} selecionado(s)
					</span>
				</div>

				{#if data.professoresDojo.length > 0}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each data.professoresDojo as prof}
							<label
								class="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all {professoresSelecionados.includes(
									prof.id_usuario,
								)
									? 'bg-zinc-900 border-red-600/80 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
									: 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800'}"
							>
								<input
									type="checkbox"
									name="professoresIds"
									value={prof.id_usuario}
									checked={professoresSelecionados.includes(
										prof.id_usuario,
									)}
									onchange={() =>
										alternarProfessor(prof.id_usuario)}
									class="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-red-600 focus:ring-red-600"
								/>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span
											class="text-xs font-semibold text-white block truncate"
										>
											{prof.nome}
										</span>
										{#if professoresSelecionados.includes(prof.id_usuario)}
											<span
												class="px-1.5 py-0.5 rounded text-[10px] bg-red-600/20 text-red-400 font-mono"
											>
												Vinculado
											</span>
										{/if}
									</div>
									<span
										class="text-[11px] font-mono text-zinc-500 block"
									>
										{prof.grau_faixa || "Sensei"} • Reg: {prof.n_federacao ||
											"Federado"}
									</span>
								</div>
							</label>
						{/each}
					</div>
				{:else}
					<div
						class="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 text-xs text-amber-300"
					>
						Nenhum professor cadastrado neste dojo ainda. Cadastre
						um usuário com o perfil de Professor.
					</div>
				{/if}
			</div>

			<!-- BOTÕES DE SALVAR ALTERAÇÕES -->
			<div
				class="flex items-center justify-between pt-4 border-t border-zinc-900"
			>
				<button
					type="button"
					onclick={() => (modalExcluirAberto = true)}
					class="px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-950 text-xs font-medium transition-colors flex items-center gap-1.5"
				>
					<Trash2 class="w-3.5 h-3.5" />
					<span>Excluir Turma</span>
				</button>

				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={() => (abaAtiva = "alunos")}
						class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition-colors"
					>
						Cancelar
					</button>

					<button
						type="submit"
						disabled={carregandoEdicao ||
							professoresSelecionados.length === 0}
						class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50"
					>
						{#if carregandoEdicao}
							<span
								class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
							></span>
							<span>Salvando alterações...</span>
						{:else}
							<CheckCircle2 class="w-4 h-4" />
							<span>Salvar Dados da Turma</span>
						{/if}
					</button>
				</div>
			</div>
		</form>
	{/if}
</div>

<!-- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE TURMA -->
{#if modalExcluirAberto}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
	>
		<div
			class="w-full max-w-md rounded-2xl bg-zinc-950 border border-red-900/60 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
		>
			<div class="flex items-start gap-4">
				<div
					class="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800 flex items-center justify-center text-red-500 shrink-0"
				>
					<AlertTriangle class="w-5 h-5" />
				</div>
				<div class="flex-1">
					<h3 class="text-base font-bold text-white font-display">
						Excluir Turma de Tatame?
					</h3>
					<p class="text-xs text-zinc-400 mt-1 leading-relaxed">
						Tem certeza que deseja excluir a turma <strong
							class="text-white">{data.turma.descricao}</strong
						>? Todas as matrículas vinculadas a este treino serão
						removidas. Os judocas continuarão cadastrados
						normalmente no sistema.
					</p>
				</div>
			</div>

			<div
				class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900"
			>
				<button
					type="button"
					onclick={() => (modalExcluirAberto = false)}
					class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
				>
					Cancelar
				</button>

				<form
					action="?/excluir"
					method="POST"
					use:enhance={() => {
						carregandoExclusao = true;
						return async ({ update }) => {
							await update();
							carregandoExclusao = false;
						};
					}}
				>
					<button
						type="submit"
						disabled={carregandoExclusao}
						class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all disabled:opacity-50"
					>
						{#if carregandoExclusao}
							<span
								class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
							></span>
							<span>Excluindo...</span>
						{:else}
							<Trash2 class="w-3.5 h-3.5" />
							<span>Confirmar Exclusão</span>
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL DE IMPRESSÃO DO TREINO / CHAMADA -->
<ModalImpressaoDocumento
	aberto={modalImpressaoAberto}
	titulo="Documento de Treino - {data.turma.descricao}"
	subtitulo="Lista oficial de chamada para o tatame"
	onfechar={() => (modalImpressaoAberto = false)}
>
	<DocumentoTreinoImpressao turma={data.turma} />
</ModalImpressaoDocumento>
