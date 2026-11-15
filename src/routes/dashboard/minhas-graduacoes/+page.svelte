<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import TermometroElegibilidade from '#lib/components/ui/TermometroElegibilidade.svelte';
	import {
		obterRotuloOrigemGraduacao,
		formatarDataBr
	} from '#lib/dominio/graduacao';
	import { obterIndiceFaixa } from '#lib/dominio/campeonato';
	import {
		Award,
		Calendar,
		ArrowRight,
		Sparkles,
		History,
		User,
		Building2
	} from '@lucide/svelte';

	let { data }: PageProps = $props();

	// Navegação controlada exclusivamente pela Sidebar Lateral (?aba=jornada | exames)
	const abaUrl = $derived(page.url.searchParams.get('aba'));
	let subMenuAtivo = $state<'jornada' | 'exames'>('jornada');

	$effect(() => {
		if (abaUrl === 'exames') {
			subMenuAtivo = 'exames';
		} else {
			subMenuAtivo = 'jornada';
		}
	});

	let idProntuarioSelecionado = $state<number | null>(null);

	const prontuarioAtivo = $derived(
		data.meusProntuarios.find((p) => p.id_usuario === idProntuarioSelecionado) ??
			data.meusProntuarios[0] ??
			null
	);

	interface ItemLinhaDoTempoPessoal {
		id_historico: number;
		faixa: string;
		data_graduacao: string;
		data_graduacao_iso?: string | null;
		associacao: string | null;
		nome_professor_homologador: string;
		grau_faixa_professor: string | null;
		nome_evento: string;
		origem_registro?: string;
		descricao_origem?: string | null;
	}

	const linhaDoTempoPessoal = $derived.by((): ItemLinhaDoTempoPessoal[] => {
		if (!prontuarioAtivo) return [];

		const temFaixaBrancaRegistrada = prontuarioAtivo.historico.some(
			(h) => obterIndiceFaixa(h.faixa) === 0
		);

		const marcoBranca: ItemLinhaDoTempoPessoal[] = temFaixaBrancaRegistrada
			? []
			: [
					{
						id_historico: 0,
						faixa: 'Branca',
						data_graduacao: prontuarioAtivo.data_inicio
							? formatarDataBr(prontuarioAtivo.data_inicio)
							: 'Início no Tatame',
						data_graduacao_iso: prontuarioAtivo.data_inicio || null,
						associacao: 'FPJ / CBJ',
						nome_professor_homologador:
							prontuarioAtivo.nome_professor_responsavel || 'Sensei Responsável',
						grau_faixa_professor: null,
						nome_evento: 'Ingresso no Judô (Faixa Inicial - Mukyu)',
						origem_registro: 'MARCO_INICIAL',
						descricao_origem: 'Início no Tatame'
					}
				];

		return [...marcoBranca, ...prontuarioAtivo.historico];
	});

	// Divisão de Exames: Atuais / Ano em Exercício vs Histórico Passado
	const anoAtual = new Date().getFullYear();
	let filtroExames = $state<'atuais' | 'passados'>('atuais');
	let filtroAnoPassado = $state<string>('todos');

	function extrairAnoEvento(ev: { data_inicio_iso?: string | null; data_inicio?: string | null }): number {
		if (ev.data_inicio_iso && ev.data_inicio_iso.length >= 4) {
			const n = parseInt(ev.data_inicio_iso.slice(0, 4), 10);
			if (!isNaN(n)) return n;
		}
		if (ev.data_inicio && ev.data_inicio.length >= 10) {
			const partes = ev.data_inicio.split('/');
			if (partes.length === 3) {
				const n = parseInt(partes[2], 10);
				if (!isNaN(n)) return n;
			}
		}
		return anoAtual;
	}

	const eventosAtuais = $derived(
		data.eventos.filter((ev) => extrairAnoEvento(ev) >= anoAtual)
	);

	const eventosPassados = $derived(
		data.eventos.filter((ev) => extrairAnoEvento(ev) < anoAtual)
	);

	const anosPassadosDisponiveis = $derived(
		Array.from(new Set(eventosPassados.map((ev) => extrairAnoEvento(ev)))).sort((a, b) => b - a)
	);

	const eventosExibidos = $derived.by(() => {
		if (filtroExames === 'atuais') return eventosAtuais;
		if (filtroAnoPassado === 'todos') return eventosPassados;
		const anoAlvo = parseInt(filtroAnoPassado, 10);
		return eventosPassados.filter((ev) => extrairAnoEvento(ev) === anoAlvo);
	});
</script>

<svelte:head>
	<title>Minhas Graduações - Judô Hinodê</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<!-- Cabeçalho no padrão "Meu Perfil" -->
	<div class="pb-5 border-b border-zinc-900">
		<div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500">
			<Award class="w-3.5 h-3.5" />
			<span>Caminho Suave (Judô)</span>
		</div>
		<h2 class="text-2xl font-bold tracking-tight text-white mt-1">
			Minhas Graduações
		</h2>
		<p class="text-xs text-zinc-400 mt-1">
			Consulte sua faixa atual, evolução rumo à próxima graduação, linha do tempo completa desde a Faixa Branca e exames do dojo.
		</p>
	</div>

	{#if subMenuAtivo === 'jornada'}
		{#if data.meusProntuarios.length === 0}
			<div class="p-8 rounded-2xl bg-zinc-950 border border-zinc-900 text-center space-y-2 animate-in fade-in duration-200">
				<Award class="w-8 h-8 text-zinc-600 mx-auto" />
				<p class="text-sm font-semibold text-zinc-300">
					Nenhum prontuário de judoca vinculado à sua conta.
				</p>
				<p class="text-xs text-zinc-500">
					Caso seja aluno ou responsável, solicite à secretaria do dojo a vinculação da sua ficha técnica.
				</p>
			</div>
		{:else if prontuarioAtivo}
			<div class="space-y-6 animate-in fade-in duration-200">
				{#if data.meusProntuarios.length > 1}
					<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2.5">
						<div class="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
							Selecione o Judoca para consultar a Graduação
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
							{#each data.meusProntuarios as prontuario}
								{@const selecionado = prontuario.id_usuario === prontuarioAtivo.id_usuario}
								<button
									type="button"
									onclick={() => (idProntuarioSelecionado = prontuario.id_usuario)}
									class="p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 {selecionado
										? 'bg-red-950/30 border-red-700/70 text-white shadow-sm'
										: 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'}"
								>
									<div class="min-w-0">
										<div class="text-xs font-bold truncate">{prontuario.nome}</div>
										<div class="text-[11px] text-zinc-500 font-mono mt-0.5">
											{prontuario.idade} anos
										</div>
									</div>
									<BadgeFaixa faixa={prontuario.graduacao_atual} size="sm" />
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Card 1: Credencial Técnica & Graduação Atual -->
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
					<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
						<div class="flex items-center gap-2.5">
							<div
								class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400"
							>
								<Award class="w-4 h-4" />
							</div>
							<div>
								<h3 class="text-sm font-semibold text-white">
									Credencial Técnica & Graduação Atual
								</h3>
								<p class="text-[11px] text-zinc-500">
									Prontuário oficial de {prontuarioAtivo.nome} homologado pelo Sensei
								</p>
							</div>
						</div>
						<span
							class="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400"
						>
							Somente Leitura
						</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-900 space-y-1.5">
							<div class="text-[11px] text-zinc-500">Graduação Atual (Obi)</div>
							<div>
								<BadgeFaixa faixa={prontuarioAtivo.graduacao_atual} size="sm" />
							</div>
						</div>

						<div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-900 space-y-1">
							<div class="text-[11px] text-zinc-500">Sensei Responsável</div>
							<div class="text-xs font-semibold text-zinc-200">
								{prontuarioAtivo.nome_professor_responsavel || 'Não atribuído'}
							</div>
						</div>

						<div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-900 space-y-1">
							<div class="text-[11px] text-zinc-500">Início no Tatame (Faixa Branca)</div>
							<div class="text-xs font-mono font-semibold text-zinc-200">
								{formatarDataBr(prontuarioAtivo.data_inicio)}
							</div>
						</div>

						<div class="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-900 space-y-1">
							<div class="text-[11px] text-zinc-500">Matrícula no Dojo</div>
							<div class="text-xs font-mono font-semibold text-zinc-200">
								{prontuarioAtivo.matricula || `#${prontuarioAtivo.id_usuario}`}
							</div>
						</div>
					</div>
				</div>

				<!-- Card 2: Termômetro de Elegibilidade -->
				<TermometroElegibilidade
					faixaAtual={prontuarioAtivo.graduacao_atual}
					idadeAluno={prontuarioAtivo.idade}
					dataInicioOuUltimaGraduacao={prontuarioAtivo.data_ultima_graduacao_iso ||
						prontuarioAtivo.data_primeira_graduacao ||
						prontuarioAtivo.data_inicio}
				/>

				<!-- Card 3: Linha do Tempo Completa (Desde a Faixa Branca) -->
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
					<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-900">
						<div class="flex items-center gap-2.5">
							<div
								class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400"
							>
								<History class="w-4 h-4" />
							</div>
							<div>
								<h3 class="text-sm font-semibold text-white">
									Linha do Tempo de Graduações
								</h3>
								<p class="text-[11px] text-zinc-500">
									Progressão cronológica completa a partir da Faixa Branca
								</p>
							</div>
						</div>
						<span
							class="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400"
						>
							{linhaDoTempoPessoal.length} {linhaDoTempoPessoal.length === 1 ? 'Marco' : 'Marcos'}
						</span>
					</div>

					<div
						class="relative pl-6 border-l-2 border-zinc-800 space-y-5 before:absolute before:top-0 before:bottom-0 before:-left-[1px] before:w-[2px] before:bg-gradient-to-b before:from-zinc-500 before:via-red-600 before:to-amber-500"
					>
						{#each linhaDoTempoPessoal as item, index}
							{@const infoOrigem = obterRotuloOrigemGraduacao(item.origem_registro)}
							{@const ehMarcoInicial = item.origem_registro === 'MARCO_INICIAL'}
							{@const ehMaisRecente = index === linhaDoTempoPessoal.length - 1}
							{@const ehGraduacaoAtualReal =
								ehMaisRecente &&
								(!ehMarcoInicial || obterIndiceFaixa(prontuarioAtivo.graduacao_atual) === 0)}

							<div
								class="relative p-5 rounded-2xl bg-zinc-900/40 border {ehMaisRecente
									? 'border-amber-800/50 shadow-lg shadow-amber-950/10'
									: ehMarcoInicial
										? 'border-zinc-800/80 bg-zinc-950/80'
										: 'border-zinc-800/90'} space-y-3"
							>
								<div
									class="absolute -left-[31px] top-6 w-3.5 h-3.5 rounded-full {ehMaisRecente
										? 'bg-amber-400 ring-4 ring-amber-500/20'
										: ehMarcoInicial
											? 'bg-white ring-4 ring-zinc-700/40'
											: 'bg-red-600 ring-4 ring-zinc-950'}"
								></div>

								<div class="flex flex-wrap items-center justify-between gap-2">
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
											#{index + 1}
										</span>
										<BadgeFaixa faixa={item.faixa} size="md" />
										{#if ehGraduacaoAtualReal}
											<span
												class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/60 text-[10px] font-mono uppercase text-amber-300"
											>
												<Sparkles class="w-3 h-3" /> Graduação Atual
											</span>
										{/if}
										<span
											class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono {infoOrigem.classeBadge}"
										>
											{infoOrigem.rotulo}
										</span>
									</div>

									<div class="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
										<Calendar class="w-3.5 h-3.5 text-zinc-500" />
										<span>{item.data_graduacao}</span>
									</div>
								</div>

								<div
									class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500"
								>
									<div class="flex items-center gap-1.5">
										<User class="w-3.5 h-3.5 text-zinc-600" />
										<span>
											Sensei / Banca:
											<strong class="text-zinc-300 font-medium">{item.nome_professor_homologador}</strong>
										</span>
									</div>

									<div class="flex items-center gap-2">
										{#if item.associacao}
											<span class="inline-flex items-center gap-1 text-zinc-400">
												<Building2 class="w-3 h-3 text-zinc-600" />
												{item.associacao}
											</span>
										{/if}
										{#if item.descricao_origem}
											<span class="font-mono text-sky-400">
												• {item.descricao_origem}
											</span>
										{:else if item.nome_evento}
											<span class="text-zinc-400">
												• {item.nome_evento}
											</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	{/if}

	{#if subMenuAtivo === 'exames'}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm animate-in fade-in duration-200">
			<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div
						class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400"
					>
						<Calendar class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">
							Exames & Cerimônias de Graduação do Dojo
						</h3>
						<p class="text-[11px] text-zinc-500">
							Consulte os exames do ano em exercício ({anoAtual}) ou acesse o histórico de cerimônias passadas
						</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<div class="inline-flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
						<button
							type="button"
							onclick={() => (filtroExames = 'atuais')}
							class="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 {filtroExames ===
							'atuais'
								? 'bg-amber-600 text-white shadow-sm'
								: 'text-zinc-400 hover:text-zinc-200'}"
						>
							<span>Atuais / Exercício {anoAtual}</span>
							<span class="px-1.5 py-0.2 rounded bg-black/25 font-mono text-[10px]">
								{eventosAtuais.length}
							</span>
						</button>
						<button
							type="button"
							onclick={() => (filtroExames = 'passados')}
							class="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 {filtroExames ===
							'passados'
								? 'bg-zinc-800 text-white shadow-sm'
								: 'text-zinc-400 hover:text-zinc-200'}"
						>
							<History class="w-3.5 h-3.5" />
							<span>Histórico Passado</span>
							<span class="px-1.5 py-0.2 rounded bg-black/25 font-mono text-[10px]">
								{eventosPassados.length}
							</span>
						</button>
					</div>

					{#if filtroExames === 'passados' && anosPassadosDisponiveis.length > 0}
						<select
							bind:value={filtroAnoPassado}
							class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-600"
						>
							<option value="todos">Todos os anos</option>
							{#each anosPassadosDisponiveis as ano}
								<option value={String(ano)}>Exercício {ano}</option>
							{/each}
						</select>
					{/if}
				</div>
			</div>

			{#if eventosExibidos.length === 0}
				<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center space-y-3">
					<Calendar class="w-8 h-8 text-zinc-600 mx-auto" />
					<p class="text-sm font-semibold text-zinc-300">
						{filtroExames === 'atuais'
							? `Nenhum exame agendado ou do exercício ${anoAtual}`
							: 'Nenhum exame passado encontrado no histórico'}
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each eventosExibidos as ev}
						<a
							href="/dashboard/graduacoes/{ev.id_evento}"
							class="group p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-700/60 transition-all flex flex-col justify-between gap-4"
						>
							<div class="space-y-2.5">
								<div class="flex items-center justify-between gap-2">
									<span
										class="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border {ev.status ===
										'Realizado'
											? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
											: ev.status === 'Agendado' || ev.status === 'Em Andamento'
												? 'bg-amber-950/60 border-amber-800/60 text-amber-300'
												: 'bg-zinc-900 border-zinc-800 text-zinc-400'}"
									>
										{ev.status || 'Agendado'}
									</span>
									<span class="text-xs font-mono text-zinc-400">
										{ev.data_inicio}
									</span>
								</div>

								<h4
									class="text-sm font-bold text-white group-hover:text-amber-400 transition-colors"
								>
									{ev.nome}
								</h4>

								<div class="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
									<span>
										Faixas: <strong class="text-zinc-200">{ev.faixa_inicio}</strong> a
										<strong class="text-zinc-200">{ev.faixa_fim}</strong>
									</span>
									{#if ev.cidade}
										<span>• {ev.cidade}/{ev.uf}</span>
									{/if}
								</div>
							</div>

							<div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
								<span class="text-zinc-400 text-[11px]">
									Consulte os critérios e sua inscrição neste exame
								</span>
								<span
									class="inline-flex items-center gap-1 font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform"
								>
									<span>Ver Minha Elegibilidade</span>
									<ArrowRight class="w-3.5 h-3.5" />
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
