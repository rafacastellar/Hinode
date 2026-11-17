<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import ModalPesagemRapida from '#lib/components/alunos/ModalPesagemRapida.svelte';
	import {
		Users,
		UserPlus,
		Search,
		Award,
		HeartHandshake,
		Pencil,
		Eye,
		Zap,
		CheckCircle2,
		ArrowUpDown,
		Filter,
		LayoutList,
		LayoutGrid,
		AlignJustify,
		ArrowUp,
		ArrowDown,
		History,
		Scale,
		ArrowRight,
		BarChart3,
		X,
		Swords,
		AlertCircle
	} from '@lucide/svelte';
	import {
		ordenarAtletas,
		type CampoOrdenacaoAtleta,
		type DirecaoOrdenacao
	} from '#lib/dominio/ordenacao-atletas';
	import { obterClassificacaoJudo } from '#lib/dominio/regras-categoria-peso';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// ============================================================================
	// NAVEGAÇÃO DE SUB-MENUS VIA SIDEBAR (?aba=quadro | pesagens | dados)
	// ============================================================================
	const abaUrl = $derived(page.url.searchParams.get('aba'));
	let subMenuAtivo = $state<'quadro' | 'pesagens' | 'dados'>('quadro');

	$effect(() => {
		if (typeof window !== 'undefined' && window.location.hash === '#historico-peso') {
			subMenuAtivo = 'pesagens';
			return;
		}
		if (abaUrl === 'pesagens' || abaUrl === 'dados' || abaUrl === 'quadro') {
			subMenuAtivo = abaUrl;
		} else {
			subMenuAtivo = 'quadro';
		}
	});

	let recalculando = $state(false);
	let alunoParaPesagem = $state<any>(null);

	// ============================================================================
	// ABA 1: QUADRO GERAL DE JUDOCAS (ZERO-LOAD INICIAL + PESQUISA + FILTROS)
	// ============================================================================
	let termoBusca = $state('');
	let mostrarTodos = $state(false);
	let filtroChip = $state<'MENORES' | 'ADULTOS' | 'ASPIRANTES' | 'ESPECIAIS' | null>(null);
	let modoDensidade = $state<'detalhada' | 'compacta' | 'cards'>('compacta');
	let campoOrdenacao = $state<CampoOrdenacaoAtleta>('nome');
	let direcaoOrdenacao = $state<DirecaoOrdenacao>('asc');

	$effect(() => {
		if (data.busca) {
			termoBusca = data.busca;
		}
	});

	function alternarDirecao() {
		direcaoOrdenacao = direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
	}

	function alternarChip(chip: 'MENORES' | 'ADULTOS' | 'ASPIRANTES' | 'ESPECIAIS') {
		if (filtroChip === chip) {
			filtroChip = null;
		} else {
			filtroChip = chip;
		}
	}

	function limparQuadro() {
		termoBusca = '';
		filtroChip = null;
		mostrarTodos = false;
	}

	const totalAlunos = $derived(data.alunos.length);
	const totalMenores = $derived(data.alunos.filter((a) => a.menor_idade).length);
	const totalAdultos = $derived(data.alunos.filter((a) => !a.menor_idade).length);

	// Verifica se o usuário acionou pesquisa, filtro ou "Listar Todos"
	const quadroAtivo = $derived(
		Boolean(termoBusca.trim().length > 0 || filtroChip !== null || mostrarTodos)
	);

	const alunosFiltradosQuadro = $derived.by(() => {
		if (!quadroAtivo) return [];

		const q = termoBusca.trim().toLowerCase();
		const digitos = q.replace(/\D/g, '');

		return data.alunos.filter((aluno) => {
			// 1. Filtro por Chip
			if (filtroChip === 'MENORES' && !aluno.menor_idade) return false;
			if (filtroChip === 'ADULTOS' && aluno.menor_idade) return false;
			if (filtroChip === 'ASPIRANTES') {
				const div = (
					aluno.grupo_especial_aspirante ||
					obterClassificacaoJudo({
						dataNascimento: aluno.data_nascimento,
						genero: aluno.genero,
						peso: aluno.peso,
						graduacao: aluno.graduacao_atual
					}).divisao
				).toLowerCase();
				if (!div.includes('aspirante')) return false;
			}
			if (filtroChip === 'ESPECIAIS') {
				const div = (
					aluno.grupo_especial_aspirante ||
					obterClassificacaoJudo({
						dataNascimento: aluno.data_nascimento,
						genero: aluno.genero,
						peso: aluno.peso,
						graduacao: aluno.graduacao_atual
					}).divisao
				).toLowerCase();
				if (!div.includes('especial')) return false;
			}

			// 2. Filtro por Termo de Pesquisa
			if (!q) return true;
			const bateNome = aluno.nome.toLowerCase().includes(q);
			const bateMatricula = Boolean(aluno.matricula && aluno.matricula.toLowerCase().includes(q));
			const bateCpf = digitos.length >= 3 && aluno.cpf.replace(/\D/g, '').includes(digitos);
			const bateFaixa = aluno.graduacao_atual.toLowerCase().includes(q);
			const bateCategoria = Boolean(aluno.categoria && aluno.categoria.toLowerCase().includes(q));
			const bateSensei = Boolean(
				aluno.nome_professor_responsavel &&
					aluno.nome_professor_responsavel.toLowerCase().includes(q)
			);

			return (
				bateNome || bateMatricula || bateCpf || bateFaixa || bateCategoria || bateSensei
			);
		});
	});

	const alunosOrdenados = $derived(
		ordenarAtletas(alunosFiltradosQuadro, campoOrdenacao, direcaoOrdenacao)
	);

	// ============================================================================
	// ABA 3: HISTÓRICO DE PESAGENS (ÚLTIMAS 10 POR PADRÃO + HISTÓRICO COMPLETO)
	// ============================================================================
	let buscaPesagem = $state('');
	let pesoDataInicio = $state('');
	let pesoDataFim = $state('');
	let mostrarTodoHistoricoPeso = $state(false);
	let buscaRapidaPesar = $state('');

	const temFiltroPesagemAtivo = $derived(
		Boolean(buscaPesagem.trim() || pesoDataInicio || pesoDataFim)
	);

	const historicoPesoFiltrado = $derived.by(() => {
		const termo = buscaPesagem.trim().toLowerCase();

		const filtrados = data.historicoMudancasPeso.filter((item) => {
			if (termo) {
				const bate =
					item.nome_aluno.toLowerCase().includes(termo) ||
					item.graduacao_atual.toLowerCase().includes(termo) ||
					(item.categoria_nova && item.categoria_nova.toLowerCase().includes(termo)) ||
					(item.categoria_anterior && item.categoria_anterior.toLowerCase().includes(termo)) ||
					(item.origem && item.origem.toLowerCase().includes(termo)) ||
					(item.nome_professor_responsavel &&
						item.nome_professor_responsavel.toLowerCase().includes(termo));
				if (!bate) return false;
			}

			if (pesoDataInicio && item.data_iso < pesoDataInicio) return false;
			if (pesoDataFim && item.data_iso > pesoDataFim) return false;

			return true;
		});

		if (!temFiltroPesagemAtivo && !mostrarTodoHistoricoPeso) {
			return filtrados.slice(0, 10);
		}
		return filtrados;
	});

	function limparFiltrosPesagem() {
		buscaPesagem = '';
		pesoDataInicio = '';
		pesoDataFim = '';
		mostrarTodoHistoricoPeso = false;
	}

	const sugestoesPesagemRapida = $derived.by(() => {
		const q = buscaRapidaPesar.trim().toLowerCase();
		if (!q) return [];
		return data.alunos
			.filter(
				(a) =>
					a.nome.toLowerCase().includes(q) ||
					(a.matricula && a.matricula.toLowerCase().includes(q))
			)
			.slice(0, 6);
	});

	// ============================================================================
	// ABA 4: DADOS GERAIS & SCOUT COMPETITIVO CBJ (CLASSES DE IDADE & PESO)
	// ============================================================================
	const ORDEM_CLASSES_IDADE = [
		'Festival',
		'Sub-9',
		'Sub-11',
		'Sub-13',
		'Sub-15',
		'Sub-18',
		'Sub-21',
		'Sênior',
		'Master 1',
		'Master 2',
		'Master 3',
		'Master 4',
		'Master 5',
		'Master 6',
		'Master 7',
		'Master 8+'
	];

	const ORDEM_CATEGORIAS_PESO = [
		'Extra-Ligeiro',
		'Super-Ligeiro',
		'Ligeiro',
		'Meio-Leve',
		'Leve',
		'Meio-Médio',
		'Médio',
		'Meio-Pesado',
		'Pesado',
		'Super-Pesado',
		'Festival / Pré-Judô',
		'Pendente de Pesagem'
	];

	let filtroScoutDivisao = $state<'TODAS' | 'Aspirante' | 'Especial'>('TODAS');
	let filtroScoutGenero = $state<'TODOS' | 'M' | 'F'>('TODOS');
	let classeIdadeSelecionada = $state<string>('TODAS');
	let categoriaPesoExpandida = $state<string | null>(null);

	// Enriquecimento de todos os atletas com o motor CBJ/FPJ
	const atletasClassificados = $derived(
		data.alunos.map((aluno) => {
			const classif = obterClassificacaoJudo({
				dataNascimento: aluno.data_nascimento,
				genero: aluno.genero,
				peso: aluno.peso,
				graduacao: aluno.graduacao_atual
			});
			const divisaoEfetiva: 'Aspirante' | 'Especial' =
				aluno.grupo_especial_aspirante?.toLowerCase().includes('especial')
					? 'Especial'
					: aluno.grupo_especial_aspirante?.toLowerCase().includes('aspirante')
						? 'Aspirante'
						: classif.divisao;

			return {
				...aluno,
				scout: {
					...classif,
					divisaoEfetiva
				}
			};
		})
	);

	const totalAspirantes = $derived(
		atletasClassificados.filter((a) => a.scout.divisaoEfetiva === 'Aspirante').length
	);
	const totalEspeciais = $derived(
		atletasClassificados.filter((a) => a.scout.divisaoEfetiva === 'Especial').length
	);
	const totalComPeso = $derived(
		atletasClassificados.filter((a) => a.peso !== null && a.peso > 0).length
	);
	const totalSemPeso = $derived(totalAlunos - totalComPeso);

	// Atletas filtrados pelos seletores globais do Scout (Divisão e Gênero)
	const atletasScoutBase = $derived(
		atletasClassificados.filter((a) => {
			if (filtroScoutDivisao !== 'TODAS' && a.scout.divisaoEfetiva !== filtroScoutDivisao) {
				return false;
			}
			if (filtroScoutGenero !== 'TODOS' && a.genero !== filtroScoutGenero) {
				return false;
			}
			return true;
		})
	);

	// Agrupamento 1: Por Classe de Idade CBJ
	const scoutPorClasseIdade = $derived.by(() => {
		const mapa = new Map<
			string,
			{
				codigo: string;
				nomeExibicao: string;
				total: number;
				aspirantes: number;
				especiais: number;
				masculino: number;
				feminino: number;
			}
		>();

		for (const a of atletasScoutBase) {
			const cod = a.scout.classeCodigo;
			const atual = mapa.get(cod) || {
				codigo: cod,
				nomeExibicao: a.scout.classeNome,
				total: 0,
				aspirantes: 0,
				especiais: 0,
				masculino: 0,
				feminino: 0
			};
			atual.total += 1;
			if (a.scout.divisaoEfetiva === 'Especial') atual.especiais += 1;
			else atual.aspirantes += 1;

			if (a.genero === 'F') atual.feminino += 1;
			else atual.masculino += 1;

			mapa.set(cod, atual);
		}

		return Array.from(mapa.values()).sort((a, b) => {
			const idxA = ORDEM_CLASSES_IDADE.indexOf(a.codigo);
			const idxB = ORDEM_CLASSES_IDADE.indexOf(b.codigo);
			return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
		});
	});

	// Atletas filtrados também pela Classe de Idade selecionada (para o quadro de Classes de Peso)
	const atletasParaClassesPeso = $derived(
		classeIdadeSelecionada === 'TODAS'
			? atletasScoutBase
			: atletasScoutBase.filter((a) => a.scout.classeCodigo === classeIdadeSelecionada)
	);

	// Agrupamento 2: Por Categoria / Classe de Peso CBJ
	const scoutPorCategoriaPeso = $derived.by(() => {
		const mapa = new Map<
			string,
			{
				categoriaNome: string;
				limitesExemplos: Set<string>;
				total: number;
				aspirantes: number;
				especiais: number;
				atletas: typeof atletasClassificados;
			}
		>();

		for (const a of atletasParaClassesPeso) {
			const catNome = a.scout.categoriaNome;
			const atual = mapa.get(catNome) || {
				categoriaNome: catNome,
				limitesExemplos: new Set<string>(),
				total: 0,
				aspirantes: 0,
				especiais: 0,
				atletas: []
			};
			atual.total += 1;
			if (a.scout.limitePesoRotulo) {
				atual.limitesExemplos.add(`${a.scout.classeCodigo}: ${a.scout.limitePesoRotulo}`);
			}
			if (a.scout.divisaoEfetiva === 'Especial') atual.especiais += 1;
			else atual.aspirantes += 1;
			atual.atletas.push(a);

			mapa.set(catNome, atual);
		}

		return Array.from(mapa.values())
			.map((item) => ({
				...item,
				limitesLista: Array.from(item.limitesExemplos)
			}))
			.sort((a, b) => {
				const idxA = ORDEM_CATEGORIAS_PESO.indexOf(a.categoriaNome);
				const idxB = ORDEM_CATEGORIAS_PESO.indexOf(b.categoriaNome);
				return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
			});
	});
</script>

<svelte:head>
	<title>Alunos & Judocas - Judô Hinodê</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
	<!-- Alerta de Sincronização / Pesagem Bem-Sucedida -->
	{#if form?.sucesso && form?.mensagem}
		<div
			class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-start gap-3 transition-all animate-in fade-in"
		>
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
			<div>
				<span class="font-semibold block text-emerald-100">Operação Concluída</span>
				<span>{form.mensagem}</span>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- CABEÇALHO NO PADRÃO SIDEBAR (SEM MENU HORIZONTAL SUPERIOR)                -->
	<!-- ========================================================================= -->
	<div
		class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-900"
	>
		<div>
			<div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500">
				<Users class="w-3.5 h-3.5" />
				<span>Módulo de Atletas & Categorias CBJ</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight text-white mt-1">
				Alunos & Judocas
			</h2>
			<p class="text-xs text-zinc-400 mt-1">
				Pesquise fichas cadastrais sob demanda, acompanhe o histórico completo de pesagens e analise o scout oficial por classes de idade e peso.
			</p>
		</div>

		<div class="flex items-center gap-2.5 flex-wrap shrink-0">
			{#if data.podeEditarAluno}
				<form
					method="POST"
					action="?/recalcularCategorias"
					use:enhance={() => {
						recalculando = true;
						return async ({ update }) => {
							recalculando = false;
							await update();
						};
					}}
				>
					<button
						type="submit"
						disabled={recalculando}
						class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
						title="Recalcula em lote as categorias de peso e divisões oficiais CBJ para todos os judocas"
					>
						<Zap class="w-4 h-4 text-amber-400" />
						<span>{recalculando ? 'Sincronizando...' : 'Sincronizar CBJ'}</span>
					</button>
				</form>
			{/if}

			{#if data.podeCriarAluno}
				<a
					href="/dashboard/alunos/novo"
					class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-lg shadow-red-950/50 transition-all cursor-pointer"
				>
					<UserPlus class="w-4 h-4" />
					<span>Matricular Judoca</span>
				</a>
			{/if}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- SUB-MENU 1: QUADRO GERAL DE JUDOCAS (PESQUISA SOB DEMANDA / ZERO-LOAD)    -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'quadro'}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-200">
			<!-- Cabeçalho do Card + Botão Listar Todos -->
			<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div
						class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400"
					>
						<Users class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							Quadro Geral de Judocas
						</h3>
						<p class="text-[11px] text-zinc-500">
							Pesquise por nome, matrícula, CPF, faixa ou categoria, acione um filtro rápido ou clique em "Listar Todos"
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					{#if quadroAtivo}
						<button
							type="button"
							onclick={limparQuadro}
							class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
						>
							Limpar / Recolher
						</button>
					{/if}
					<button
						type="button"
						onclick={() => (mostrarTodos = !mostrarTodos)}
						class="px-3 py-1.5 rounded-lg {mostrarTodos
							? 'bg-red-950/50 border-red-800/80 text-red-200'
							: 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'} border text-[11px] font-semibold transition-colors cursor-pointer"
					>
						{mostrarTodos ? 'Recolher Lista' : `Listar Todos (${totalAlunos})`}
					</button>
				</div>
			</div>

			<!-- Campo de Pesquisa Instantânea -->
			<div class="relative">
				<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					bind:value={termoBusca}
					placeholder="Digite o nome do judoca, matrícula, CPF, faixa, categoria ou sensei..."
					class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
				/>
				{#if termoBusca}
					<button
						type="button"
						onclick={() => (termoBusca = '')}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
						title="Limpar pesquisa"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
			</div>

			<!-- Botões de Filtro Rápido + Controles de Ordenação e Densidade -->
			<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
				<!-- Chips de Filtro Atuais -->
				<div class="flex items-center gap-2 flex-wrap text-xs">
					<span
						class="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1 mr-1"
					>
						<Filter class="w-3 h-3" />
						<span>Filtros:</span>
					</span>
					<button
						type="button"
						onclick={() => {
							filtroChip = null;
							mostrarTodos = !mostrarTodos;
						}}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {mostrarTodos &&
						filtroChip === null
							? 'bg-red-950/50 border-red-800/80 text-white font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Todos ({totalAlunos})
					</button>
					<button
						type="button"
						onclick={() => alternarChip('MENORES')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {filtroChip ===
						'MENORES'
							? 'bg-amber-950/50 border-amber-800/80 text-amber-200 font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Menores de 18 ({totalMenores})
					</button>
					<button
						type="button"
						onclick={() => alternarChip('ADULTOS')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {filtroChip ===
						'ADULTOS'
							? 'bg-sky-950/50 border-sky-800/80 text-sky-200 font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Adultos ({totalAdultos})
					</button>
					<button
						type="button"
						onclick={() => alternarChip('ASPIRANTES')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {filtroChip ===
						'ASPIRANTES'
							? 'bg-purple-950/50 border-purple-800/80 text-purple-200 font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Aspirantes ({totalAspirantes})
					</button>
					<button
						type="button"
						onclick={() => alternarChip('ESPECIAIS')}
						class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {filtroChip ===
						'ESPECIAIS'
							? 'bg-purple-950/50 border-purple-800/80 text-purple-200 font-bold'
							: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
					>
						Especiais ({totalEspeciais})
					</button>
				</div>

				<!-- Ordenação e Densidade (Exibidos quando há busca/listagem ativa) -->
				{#if quadroAtivo}
					<div class="flex items-center gap-3 flex-wrap self-end lg:self-auto">
						<div class="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
							<span class="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1 pl-1">
								<ArrowUpDown class="w-3 h-3 text-red-500" />
								<span>Ordenar:</span>
							</span>
							<select
								bind:value={campoOrdenacao}
								class="bg-zinc-950 border border-zinc-800 text-white text-xs font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-red-600"
							>
								<option value="nome">Nome (A-Z)</option>
								<option value="graduacao">Graduação (Faixa)</option>
								<option value="idade">Idade</option>
								<option value="categoria">Categoria CBJ</option>
							</select>

							<button
								type="button"
								onclick={alternarDirecao}
								class="p-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
								title={direcaoOrdenacao === 'asc'
									? 'Ordem Crescente (clique para inverter)'
									: 'Ordem Decrescente (clique para inverter)'}
							>
								{#if direcaoOrdenacao === 'asc'}
									<ArrowUp class="w-3.5 h-3.5 text-red-400" />
								{:else}
									<ArrowDown class="w-3.5 h-3.5 text-amber-400" />
								{/if}
							</button>
						</div>

						<div class="p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center">
							<button
								type="button"
								onclick={() => (modoDensidade = 'detalhada')}
								class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer {modoDensidade ===
								'detalhada'
									? 'bg-zinc-800 text-white font-bold shadow-sm'
									: 'text-zinc-500 hover:text-zinc-300'}"
								title="Visualização Detalhada em Tabela Completa"
							>
								<LayoutList class="w-3.5 h-3.5" />
								<span>Detalhada</span>
							</button>
							<button
								type="button"
								onclick={() => (modoDensidade = 'compacta')}
								class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer {modoDensidade ===
								'compacta'
									? 'bg-zinc-800 text-white font-bold shadow-sm'
									: 'text-zinc-500 hover:text-zinc-300'}"
								title="Visualização Compacta"
							>
								<AlignJustify class="w-3.5 h-3.5" />
								<span>Compacta</span>
							</button>
							<button
								type="button"
								onclick={() => (modoDensidade = 'cards')}
								class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer {modoDensidade ===
								'cards'
									? 'bg-red-950/60 border border-red-800/70 text-red-200 font-bold shadow-sm'
									: 'text-zinc-500 hover:text-zinc-300'}"
								title="Modo Tatame (Cards)"
							>
								<LayoutGrid class="w-3.5 h-3.5 text-red-400" />
								<span>Modo Tatame</span>
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Conteúdo do Quadro Geral: Zero-Load Inicial vs Resultados -->
			{#if !quadroAtivo}
				<div class="p-8 rounded-xl bg-zinc-900/25 border border-dashed border-zinc-800 text-center space-y-2">
					<Search class="w-7 h-7 text-zinc-600 mx-auto" />
					<p class="text-xs sm:text-sm font-semibold text-zinc-300">
						Pronto para consulta rápida
					</p>
					<p class="text-xs text-zinc-500 max-w-md mx-auto">
						Digite no campo de pesquisa acima, selecione um dos <strong class="text-zinc-300">filtros rápidos</strong> (Menores, Adultos, Aspirantes, Especiais) ou clique em <strong class="text-zinc-300">Listar Todos ({totalAlunos})</strong>.
					</p>
				</div>
			{:else if alunosOrdenados.length === 0}
				<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center text-xs text-zinc-500 font-mono">
					Nenhum judoca encontrado para os critérios selecionados.
				</div>
			{:else if modoDensidade === 'cards'}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
					{#each alunosOrdenados as aluno}
						<div
							class="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 shadow-sm"
						>
							<div class="space-y-3">
								<div class="flex items-start justify-between gap-3">
									<div class="flex items-center gap-3 min-w-0">
										<div
											class="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sm font-bold font-mono text-red-400 shrink-0"
										>
											{aluno.nome.charAt(0).toUpperCase()}
										</div>
										<div class="min-w-0">
											{#if aluno.matricula}
												<span class="text-[10px] font-mono text-zinc-400 block">
													#{aluno.matricula}
												</span>
											{/if}
											<a
												href="/dashboard/alunos/{aluno.id_usuario}"
												class="text-sm font-bold text-white hover:text-red-400 transition-colors truncate block"
											>
												{aluno.nome}
											</a>
											<span class="text-[11px] font-mono text-zinc-400">
												{aluno.idade} anos • Sensei {aluno.nome_professor_responsavel}
											</span>
										</div>
									</div>
								</div>

								<div class="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
									<BadgeFaixa faixa={aluno.graduacao_atual} size="sm" />
									<div class="text-right">
										<span class="text-xs font-mono font-bold text-zinc-200 block">
											{aluno.peso ? `${aluno.peso} kg` : 'Sem peso'}
										</span>
										<span class="text-[10px] font-mono text-amber-300/90 truncate block max-w-[150px]">
											{aluno.categoria || 'Sem categoria'}
										</span>
									</div>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60">
								{#if data.podeEditarAluno}
									<button
										type="button"
										onclick={() => (alunoParaPesagem = aluno)}
										class="min-h-[40px] px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
									>
										<Scale class="w-4 h-4 text-amber-400" />
										<span>Aferir Peso</span>
									</button>
								{/if}
								<a
									href="/dashboard/alunos/{aluno.id_usuario}"
									class="min-h-[40px] {data.podeEditarAluno ? '' : 'col-span-2'} px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
								>
									{#if data.podeEditarAluno}
										<Pencil class="w-3.5 h-3.5 text-zinc-300" />
										<span>Ficha Completa</span>
									{:else}
										<Eye class="w-3.5 h-3.5 text-zinc-300" />
										<span>Ver Ficha</span>
									{/if}
								</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="overflow-hidden rounded-2xl border border-zinc-900 {modoDensidade === 'compacta'
						? 'max-h-[540px] overflow-y-auto'
						: ''}"
				>
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
							<thead
								class="bg-zinc-900/80 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-800 sticky top-0 backdrop-blur-sm z-10"
							>
								<tr>
									<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
										Judoca / Atleta
									</th>
									<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
										Graduação (Faixa)
									</th>
									<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
										Idade / Tutela
									</th>
									<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
										Categoria & Divisão (CBJ)
									</th>
									<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'}">
										Sensei
									</th>
									<th class="{modoDensidade === 'compacta' ? 'px-4 py-2.5' : 'px-6 py-4'} text-right">
										Ações
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900">
								{#each alunosOrdenados as aluno}
									<tr class="hover:bg-zinc-900/30 transition-colors group">
										<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
											{#if modoDensidade === 'detalhada'}
												<div class="flex flex-col gap-1 items-start">
													{#if aluno.matricula}
														<span
															class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300"
														>
															{aluno.matricula}
														</span>
													{/if}
													<a
														href="/dashboard/alunos/{aluno.id_usuario}"
														class="font-semibold text-white group-hover:text-red-400 transition-colors block text-sm"
													>
														{aluno.nome}
													</a>
												</div>
											{:else}
												<div class="flex items-center gap-2">
													{#if aluno.matricula}
														<span
															class="font-mono text-[10px] font-semibold text-zinc-400 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0"
														>
															{aluno.matricula}
														</span>
													{/if}
													<a
														href="/dashboard/alunos/{aluno.id_usuario}"
														class="font-semibold text-white group-hover:text-red-400 transition-colors text-xs truncate"
													>
														{aluno.nome}
													</a>
												</div>
											{/if}
										</td>

										<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
											<BadgeFaixa
												faixa={aluno.graduacao_atual}
												size={modoDensidade === 'detalhada' ? 'md' : 'sm'}
												showLegend={modoDensidade === 'detalhada'}
											/>
										</td>

										<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
											<div class="flex items-center gap-1.5">
												<span class="text-zinc-200 font-mono text-xs">{aluno.idade} anos</span>
												{#if aluno.menor_idade}
													<span
														class="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-950/40 border border-amber-800/60 text-amber-300"
														title="Menor de 18 anos"
													>
														Menor
													</span>
												{:else}
													<span
														class="px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800"
													>
														Maior
													</span>
												{/if}
											</div>
											{#if aluno.nome_responsavel && modoDensidade === 'detalhada'}
												<div class="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
													<HeartHandshake class="w-3 h-3 text-amber-400 shrink-0" />
													<span
														class="truncate max-w-[220px]"
														title="{aluno.nome_responsavel}{aluno.parentesco_responsavel
															? ` (${aluno.parentesco_responsavel})`
															: ''}"
													>
														{aluno.nome_responsavel}
														{#if aluno.parentesco_responsavel}
															<span class="text-zinc-500 font-mono">
																({aluno.parentesco_responsavel})
															</span>
														{/if}
													</span>
												</div>
											{/if}
										</td>

										<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'}">
											<div class="flex flex-col gap-1">
												<div class="flex items-center gap-1.5 flex-wrap">
													{#if aluno.categoria}
														<span
															class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-800/50"
														>
															{aluno.categoria}
														</span>
													{/if}
													{#if aluno.grupo_especial_aspirante}
														<span
															class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-950/50 text-purple-300 border border-purple-800/60"
														>
															{aluno.grupo_especial_aspirante}
														</span>
													{/if}
												</div>
												{#if modoDensidade === 'detalhada'}
													<div class="flex items-center gap-1.5 flex-wrap text-[11px] text-zinc-500 font-mono">
														{#if aluno.peso}
															<span>{aluno.peso} kg</span>
														{/if}
														{#if aluno.status_federacao}
															<span>• FPJ: {aluno.status_federacao}</span>
														{/if}
													</div>
												{/if}
												{#if !aluno.categoria && !aluno.grupo_especial_aspirante && !aluno.status_federacao}
													<span class="text-zinc-600 text-xs">-</span>
												{/if}
											</div>
										</td>

										<td class="{modoDensidade === 'compacta' ? 'px-4 py-2 text-xs' : 'px-6 py-4'} text-zinc-300">
											{aluno.nome_professor_responsavel}
										</td>

										<td class="{modoDensidade === 'compacta' ? 'px-4 py-2' : 'px-6 py-4'} text-right">
											<div class="inline-flex items-center justify-end gap-1.5">
												{#if data.podeEditarAluno}
													<button
														type="button"
														onclick={() => (alunoParaPesagem = aluno)}
														class="inline-flex items-center gap-1 {modoDensidade === 'compacta'
															? 'px-2 py-1 text-[11px]'
															: 'px-2.5 py-1.5 text-xs'} rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
														title="Pesagem Rápida no Tatame"
													>
														<Scale class="w-3.5 h-3.5 text-amber-400" />
														<span class="hidden sm:inline">Peso</span>
													</button>
												{/if}
												<a
													href="/dashboard/alunos/{aluno.id_usuario}"
													class="inline-flex items-center gap-1.5 {modoDensidade === 'compacta'
														? 'px-2 py-1 text-[11px]'
														: 'px-3 py-1.5 text-xs'} rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white transition-colors"
												>
													{#if data.podeEditarAluno}
														<Pencil class="w-3.5 h-3.5 text-zinc-400" />
														<span>Editar</span>
													{:else}
														<Eye class="w-3.5 h-3.5 text-zinc-400" />
														<span>Ver</span>
													{/if}
												</a>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- SUB-MENU 3: HISTÓRICO DE PESAGENS (ÚLTIMAS 10 + HISTÓRICO COMPLETO)       -->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'pesagens'}
		<div class="space-y-6 animate-in fade-in duration-200">
			<!-- Atalho de Aferição Rápida na Balança -->
			{#if data.podeEditarAluno}
				<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3 shadow-sm">
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2.5">
							<div
								class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400"
							>
								<Scale class="w-4 h-4" />
							</div>
							<div>
								<h3 class="text-sm font-semibold text-white">
									Nova Aferição Rápida de Peso
								</h3>
								<p class="text-[11px] text-zinc-500">
									Localize um judoca para abrir a balança do tatame e recalcular automaticamente a categoria CBJ
								</p>
							</div>
						</div>
					</div>

					<div class="relative">
						<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							bind:value={buscaRapidaPesar}
							placeholder="Digite o nome ou matrícula do judoca para aferir o peso agora..."
							class="w-full pl-10 pr-10 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
						/>
						{#if buscaRapidaPesar}
							<button
								type="button"
								onclick={() => (buscaRapidaPesar = '')}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
							>
								<X class="w-4 h-4" />
							</button>
						{/if}
					</div>

					{#if sugestoesPesagemRapida.length > 0}
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
							{#each sugestoesPesagemRapida as al}
								<button
									type="button"
									onclick={() => {
										alunoParaPesagem = al;
										buscaRapidaPesar = '';
									}}
									class="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-700/60 text-left flex items-center justify-between gap-2 transition-all cursor-pointer"
								>
									<div class="min-w-0">
										<div class="text-xs font-bold text-white truncate">{al.nome}</div>
										<div class="text-[10px] font-mono text-zinc-400">
											{al.peso ? `${al.peso} kg` : 'Sem peso'} • {al.categoria || 'Sem cat.'}
										</div>
									</div>
									<span
										class="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 text-[10px] font-mono font-bold text-amber-300 shrink-0"
									>
										Pesar
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Card Principal: Histórico de Pesagens & Categorias -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-900/50 flex items-center justify-center text-emerald-400"
						>
							<History class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Histórico de Pesagens & Categorias CBJ
							</h3>
							<p class="text-[11px] text-zinc-500">
								Exibindo as últimas 10 aferições por padrão — filtre por período/judoca ou carregue o histórico completo
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2 flex-wrap">
						<span
							class="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400"
						>
							Exibindo {historicoPesoFiltrado.length} de {data.historicoMudancasPeso.length}
						</span>
						{#if data.historicoMudancasPeso.length > 10 && !temFiltroPesagemAtivo}
							<button
								type="button"
								onclick={() => (mostrarTodoHistoricoPeso = !mostrarTodoHistoricoPeso)}
								class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-emerald-300 transition-colors cursor-pointer"
							>
								{mostrarTodoHistoricoPeso
									? 'Mostrar Últimas 10'
									: `Carregar Histórico Completo (${data.historicoMudancasPeso.length})`}
							</button>
						{/if}
					</div>
				</div>

				<!-- Barra de Pesquisa + Filtro por Período (De / Até) -->
				<div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
					<div class="md:col-span-6 space-y-1">
						<label
							for="busca-historico-pesagens"
							class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500"
						>
							Pesquisar (Judoca, Faixa, Categoria ou Origem)
						</label>
						<div class="relative">
							<Search class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								id="busca-historico-pesagens"
								type="text"
								bind:value={buscaPesagem}
								placeholder="Ex.: Nome do judoca, Sub-18, Leve, Tatame..."
								class="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-600"
							/>
							{#if buscaPesagem}
								<button
									type="button"
									onclick={() => (buscaPesagem = '')}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
								>
									<X class="w-3.5 h-3.5" />
								</button>
							{/if}
						</div>
					</div>

					<div class="md:col-span-3 space-y-1">
						<label
							for="pesagem-inicio"
							class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500"
						>
							Período (De)
						</label>
						<input
							id="pesagem-inicio"
							type="date"
							bind:value={pesoDataInicio}
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-600"
						/>
					</div>

					<div class="md:col-span-3 space-y-1">
						<label
							for="pesagem-fim"
							class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500"
						>
							Período (Até)
						</label>
						<div class="flex items-center gap-2">
							<input
								id="pesagem-fim"
								type="date"
								bind:value={pesoDataFim}
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-600"
							/>
							{#if temFiltroPesagemAtivo || mostrarTodoHistoricoPeso}
								<button
									type="button"
									onclick={limparFiltrosPesagem}
									class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer shrink-0"
									title="Limpar filtros"
								>
									<Filter class="w-3.5 h-3.5" />
								</button>
							{/if}
						</div>
					</div>
				</div>

				{#if historicoPesoFiltrado.length === 0}
					<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center space-y-2">
						<Scale class="w-8 h-8 text-zinc-600 mx-auto" />
						<p class="text-xs sm:text-sm text-zinc-400 font-medium">
							{data.historicoMudancasPeso.length === 0
								? 'Nenhuma pesagem registrada no histórico até o momento.'
								: 'Nenhum registro encontrado para os filtros informados.'}
						</p>
					</div>
				{:else}
					<div class="space-y-2.5">
						{#each historicoPesoFiltrado as item (item.id_log)}
							<div
								class="p-3.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
							>
								<div class="flex items-center gap-2.5 min-w-0 flex-wrap">
									<a
										href="/dashboard/alunos/{item.id_aluno}"
										class="text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate"
									>
										{item.nome_aluno}
									</a>
									<BadgeFaixa faixa={item.graduacao_atual} size="sm" />
									<span
										class="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-400 shrink-0"
									>
										{item.origem}
									</span>
								</div>

								<div
									class="flex items-center gap-3 flex-wrap text-xs font-mono justify-between md:justify-end"
								>
									<!-- Variação do Peso -->
									<div
										class="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800"
									>
										<Scale class="w-3.5 h-3.5 text-zinc-500" />
										<span class="text-zinc-400">
											{item.peso_anterior !== null ? `${item.peso_anterior}kg` : 'Sem peso'}
										</span>
										<ArrowRight class="w-3 h-3 text-zinc-600" />
										<span
											class="font-bold {item.peso_novo &&
											item.peso_anterior &&
											item.peso_novo > item.peso_anterior
												? 'text-amber-400'
												: 'text-emerald-400'}"
										>
											{item.peso_novo !== null ? `${item.peso_novo}kg` : '—'}
										</span>
										{#if item.peso_novo && item.peso_anterior}
											{@const dif = Number((item.peso_novo - item.peso_anterior).toFixed(1))}
											<span
												class="text-[10px] font-bold {dif > 0
													? 'text-amber-400'
													: dif < 0
														? 'text-emerald-400'
														: 'text-zinc-500'}"
											>
												({dif > 0 ? `+${dif}` : dif}kg)
											</span>
										{/if}
									</div>

									<!-- Categoria Anterior -> Nova -->
									<div
										class="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800"
									>
										<span
											class="text-[11px] text-zinc-500 max-w-[110px] truncate"
											title={item.categoria_anterior || ''}
										>
											{item.categoria_anterior || 'Sem cat.'}
										</span>
										<ArrowRight class="w-3 h-3 text-zinc-600" />
										<span
											class="text-[11px] font-bold text-white max-w-[155px] truncate"
											title={item.categoria_nova || ''}
										>
											{item.categoria_nova || '—'}
										</span>
									</div>

									<div class="text-[11px] text-zinc-500 flex items-center gap-1.5 shrink-0">
										<span>{item.data_alteracao}</span>
										{#if item.nome_professor_responsavel}
											<span class="text-zinc-600">•</span>
											<span class="text-zinc-400">Sensei: {item.nome_professor_responsavel}</span>
										{/if}
									</div>

									<a
										href="/dashboard/alunos/{item.id_aluno}"
										class="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
										title="Abrir ficha do judoca"
									>
										<Eye class="w-3.5 h-3.5" />
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- SUB-MENU 4: DADOS GERAIS (SCOUT POR CLASSES DE IDADE E CATEGORIAS DE PESO)-->
	<!-- ========================================================================= -->
	{#if subMenuAtivo === 'dados'}
		<div class="space-y-6 animate-in fade-in duration-200">
			<!-- KPIs de Visão Geral & Divisões CBJ -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center gap-3.5">
					<div
						class="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400 shrink-0"
					>
						<Users class="w-5 h-5" />
					</div>
					<div>
						<span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
							Total de Judocas
						</span>
						<span class="text-xl font-extrabold text-white font-mono">{totalAlunos}</span>
						<span class="text-[11px] text-zinc-500 font-mono block">
							{totalMenores} menores • {totalAdultos} adultos
						</span>
					</div>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center gap-3.5">
					<div
						class="w-10 h-10 rounded-xl bg-sky-950/40 border border-sky-900/50 flex items-center justify-center text-sky-400 shrink-0"
					>
						<Award class="w-5 h-5" />
					</div>
					<div>
						<span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
							Divisão Aspirante
						</span>
						<span class="text-xl font-extrabold text-white font-mono">{totalAspirantes}</span>
						<span class="text-[11px] text-zinc-500 font-mono block">
							Branca até Verde ({totalAlunos > 0
								? Math.round((totalAspirantes / totalAlunos) * 100)
								: 0}%)
						</span>
					</div>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center gap-3.5">
					<div
						class="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-900/50 flex items-center justify-center text-purple-400 shrink-0"
					>
						<Swords class="w-5 h-5" />
					</div>
					<div>
						<span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
							Divisão Especial
						</span>
						<span class="text-xl font-extrabold text-white font-mono">{totalEspeciais}</span>
						<span class="text-[11px] text-zinc-500 font-mono block">
							Roxa até Preta/Dan ({totalAlunos > 0
								? Math.round((totalEspeciais / totalAlunos) * 100)
								: 0}%)
						</span>
					</div>
				</div>

				<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center gap-3.5">
					<div
						class="w-10 h-10 rounded-xl {totalSemPeso > 0
							? 'bg-amber-950/40 border-amber-900/50 text-amber-400'
							: 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'} border flex items-center justify-center shrink-0"
					>
						<Scale class="w-5 h-5" />
					</div>
					<div>
						<span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
							Cobertura de Pesagem
						</span>
						<span class="text-xl font-extrabold text-white font-mono">
							{totalComPeso}/{totalAlunos}
						</span>
						<span
							class="text-[11px] font-mono block {totalSemPeso > 0
								? 'text-amber-400'
								: 'text-emerald-400'}"
						>
							{totalSemPeso > 0 ? `${totalSemPeso} pendente(s) de peso` : '100% com peso aferido'}
						</span>
					</div>
				</div>
			</div>

			<!-- Barra de Filtros Globais do Scout -->
			<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold mr-1">
						Divisão:
					</span>
					{#each ['TODAS', 'Aspirante', 'Especial'] as div}
						<button
							type="button"
							onclick={() => (filtroScoutDivisao = div as 'TODAS' | 'Aspirante' | 'Especial')}
							class="px-3 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer {filtroScoutDivisao ===
							div
								? 'bg-red-950/50 border-red-800/80 text-white font-bold'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
						>
							{div === 'TODAS' ? 'Todas as Divisões' : `Divisão ${div}`}
						</button>
					{/each}
				</div>

				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold mr-1">
						Naipe / Gênero:
					</span>
					{#each [
						{ valor: 'TODOS', rotulo: 'Todos' },
						{ valor: 'M', rotulo: 'Masculino' },
						{ valor: 'F', rotulo: 'Feminino' }
					] as gen}
						<button
							type="button"
							onclick={() => (filtroScoutGenero = gen.valor as 'TODOS' | 'M' | 'F')}
							class="px-3 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer {filtroScoutGenero ===
							gen.valor
								? 'bg-amber-950/50 border-amber-800/80 text-amber-200 font-bold'
								: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
						>
							{gen.rotulo}
						</button>
					{/each}
				</div>
			</div>

			<!-- BLOCO 1: SCOUT POR CLASSES DE IDADE CBJ -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400"
						>
							<BarChart3 class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Classes de Idade CBJ / FPJ (Ano Civil)
							</h3>
							<p class="text-[11px] text-zinc-500">
								Clique em uma classe de idade para filtrar o quadro de Categorias de Peso abaixo
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2">
						{#if classeIdadeSelecionada !== 'TODAS'}
							<button
								type="button"
								onclick={() => (classeIdadeSelecionada = 'TODAS')}
								class="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-amber-300 cursor-pointer"
							>
								Ver Todas as Classes ({atletasScoutBase.length})
							</button>
						{:else}
							<span class="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
								{atletasScoutBase.length} judocas analisados
							</span>
						{/if}
					</div>
				</div>

				{#if scoutPorClasseIdade.length === 0}
					<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center text-xs text-zinc-500">
						Nenhum judoca encontrado para os filtros selecionados.
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
						{#each scoutPorClasseIdade as item}
							{@const percentual =
								atletasScoutBase.length > 0
									? Math.round((item.total / atletasScoutBase.length) * 100)
									: 0}
							{@const selecionada = classeIdadeSelecionada === item.codigo}
							<button
								type="button"
								onclick={() =>
									(classeIdadeSelecionada =
										classeIdadeSelecionada === item.codigo ? 'TODAS' : item.codigo)}
								class="p-4 rounded-xl text-left border transition-all space-y-3 cursor-pointer {selecionada
									? 'bg-amber-950/25 border-amber-600/80 shadow-sm'
									: 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-700'}"
							>
								<div class="flex items-start justify-between gap-2">
									<div>
										<span class="text-sm font-bold text-white block">{item.codigo}</span>
										<span class="text-[10px] font-mono text-zinc-500 block">
											{item.nomeExibicao}
										</span>
									</div>
									<div class="text-right shrink-0">
										<span class="text-lg font-bold font-mono text-white">{item.total}</span>
										<span class="text-[11px] font-mono text-zinc-500 ml-1">({percentual}%)</span>
									</div>
								</div>

								<div class="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
									<div
										class="h-full rounded-full {selecionada ? 'bg-amber-500' : 'bg-red-600'} transition-all"
										style="width: {Math.max(5, percentual)}%"
									></div>
								</div>

								<div class="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
									<span>
										Aspirante: <strong class="text-sky-300">{item.aspirantes}</strong> • Especial: <strong class="text-purple-300">{item.especiais}</strong>
									</span>
									<span>{item.masculino}M / {item.feminino}F</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- BLOCO 2: SCOUT POR CATEGORIAS / CLASSES DE PESO CBJ -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400"
						>
							<Scale class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Distribuição por Classes de Peso CBJ
								{#if classeIdadeSelecionada !== 'TODAS'}
									<span class="text-amber-400 font-mono ml-1">({classeIdadeSelecionada})</span>
								{/if}
							</h3>
							<p class="text-[11px] text-zinc-500">
								Clique em qualquer categoria de peso para ver os judocas enquadrados e aferir peso
							</p>
						</div>
					</div>

					<span class="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
						{atletasParaClassesPeso.length} {atletasParaClassesPeso.length === 1 ? 'atleta' : 'atletas'}
					</span>
				</div>

				{#if scoutPorCategoriaPeso.length === 0}
					<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center text-xs text-zinc-500">
						Nenhuma categoria de peso com atletas para o filtro atual.
					</div>
				{:else}
					<div class="space-y-3">
						{#each scoutPorCategoriaPeso as cat}
							{@const expandida = categoriaPesoExpandida === cat.categoriaNome}
							{@const ehPendente = cat.categoriaNome === 'Pendente de Pesagem'}
							{@const percentualPeso =
								atletasParaClassesPeso.length > 0
									? Math.round((cat.total / atletasParaClassesPeso.length) * 100)
									: 0}
							<div
								class="rounded-xl border transition-all overflow-hidden {ehPendente
									? 'bg-amber-950/15 border-amber-900/50'
									: 'bg-zinc-900/40 border-zinc-900'}"
							>
								<button
									type="button"
									onclick={() =>
										(categoriaPesoExpandida = expandida ? null : cat.categoriaNome)}
									class="w-full p-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/60 transition-colors cursor-pointer"
								>
									<div class="space-y-1">
										<div class="flex items-center gap-2 flex-wrap">
											{#if ehPendente}
												<AlertCircle class="w-4 h-4 text-amber-400" />
											{/if}
											<span class="text-sm font-bold text-white">
												{cat.categoriaNome}
											</span>
											<span
												class="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-300"
											>
												{cat.total} {cat.total === 1 ? 'judoca' : 'judocas'} ({percentualPeso}%)
											</span>
											<span class="text-[10px] font-mono text-sky-300">
												{cat.aspirantes} Asp.
											</span>
											<span class="text-[10px] font-mono text-purple-300">
												{cat.especiais} Esp.
											</span>
										</div>

										{#if cat.limitesLista.length > 0}
											<div class="flex flex-wrap gap-1.5 pt-0.5">
												{#each cat.limitesLista.slice(0, 6) as lim}
													<span class="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800/80">
														{lim}
													</span>
												{/each}
											</div>
										{/if}
									</div>

									<div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
										<span class="text-[11px] font-mono text-zinc-400">
											{expandida ? 'Ocultar Atletas ▲' : 'Ver Atletas ▼'}
										</span>
									</div>
								</button>

								{#if expandida}
									<div class="p-4 border-t border-zinc-800/80 bg-zinc-950/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
										{#each cat.atletas as at}
											<div
												class="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-2"
											>
												<div class="min-w-0">
													<a
														href="/dashboard/alunos/{at.id_usuario}"
														class="text-xs font-bold text-white hover:text-red-400 truncate block"
													>
														{at.nome}
													</a>
													<div class="text-[10px] font-mono text-zinc-400 mt-0.5">
														{at.scout.classeCodigo} • {at.peso ? `${at.peso} kg` : 'Sem peso'} • {at.scout.divisaoEfetiva}
													</div>
												</div>
												<div class="flex items-center gap-1.5 shrink-0">
													<BadgeFaixa faixa={at.graduacao_atual} size="sm" />
													{#if data.podeEditarAluno}
														<button
															type="button"
															onclick={() => (alunoParaPesagem = at)}
															class="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-400 cursor-pointer"
															title="Aferir Peso"
														>
															<Scale class="w-3.5 h-3.5" />
														</button>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Modal de Pesagem Rápida no Tatame -->
	<ModalPesagemRapida aluno={alunoParaPesagem} onFechar={() => (alunoParaPesagem = null)} />
</div>
