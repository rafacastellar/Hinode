<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Users,
		UserPlus,
		Search,
		Award,
		HeartHandshake,
		Pencil,
		Eye,
		Zap,
		CheckCircle2
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let termoBusca = $state('');
	let recalculando = $state(false);

	$effect(() => {
		termoBusca = data.busca || '';
	});

	// Métricas rápidas calculadas da lista
	const totalAlunos = $derived(data.alunos.length);
	const totalMenores = $derived(data.alunos.filter((a) => a.menor_idade).length);
</script>

<svelte:head>
	<title>Judocas & Alunos - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8">
	<!-- Alerta de Sincronização Bem-Sucedida -->
	{#if form?.sucesso && form?.mensagem}
		<div
			class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-start gap-3 transition-all animate-in fade-in"
		>
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
			<div>
				<span class="font-semibold block text-emerald-100">Atualização Concluída</span>
				<span>{form.mensagem}</span>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- HEADER DA PÁGINA -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
					Módulo de Atletas
				</span>
				<span class="text-xs text-zinc-600">•</span>
				<span class="text-xs text-zinc-400 font-mono">Fase 4</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
				Judocas do Dojo
			</h1>
			<p class="text-xs sm:text-sm text-zinc-400 mt-1">
				Controle cadastral, categorias oficiais de peso CBJ/FPJ e acompanhamento de faixas.
			</p>
		</div>

		<div class="flex items-center gap-2.5 flex-wrap">
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
						class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-medium text-xs sm:text-sm transition-all disabled:opacity-50 shrink-0"
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
					class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all shrink-0"
				>
					<UserPlus class="w-4 h-4" />
					<span>Matricular Judoca</span>
				</a>
			{/if}
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- CARDS DE RESUMO OPERACIONAL -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<Users class="w-5 h-5 text-red-500" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Total de Atletas</span>
				<span class="text-xl font-extrabold text-white font-display">{totalAlunos}</span>
			</div>
		</div>

		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<HeartHandshake class="w-5 h-5 text-amber-500" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Menores de 18 Anos</span>
				<span class="text-xl font-extrabold text-white font-display">{totalMenores}</span>
			</div>
		</div>

		<div class="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
			>
				<Award class="w-5 h-5 text-sky-500" />
			</div>
			<div>
				<span class="text-[11px] font-mono uppercase text-zinc-500 block">Responsabilidade Legal</span>
				<span class="text-xs text-emerald-400 font-mono font-medium">100% Auditada</span>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- BARRA DE PESQUISA & FILTRO -->
	<!-- ========================================================================= -->
	<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
		<form method="GET" class="flex items-center gap-3">
			<div class="relative flex-1">
				<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
				<input
					type="text"
					name="busca"
					bind:value={termoBusca}
					placeholder="Buscar judoca por nome, CPF ou número de matrícula..."
					class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
				/>
			</div>

			<button
				type="submit"
				class="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs sm:text-sm font-medium text-zinc-200 border border-zinc-800 transition-colors shrink-0"
			>
				Filtrar
			</button>

			{#if data.busca}
				<a
					href="/dashboard/alunos"
					class="px-3 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
				>
					Limpar
				</a>
			{/if}
		</form>
	</div>

	<!-- ========================================================================= -->
	<!-- LISTAGEM DE ALUNOS -->
	<!-- ========================================================================= -->
	{#if data.alunos.length > 0}
		<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
					<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
						<tr>
							<th class="px-6 py-4">Judoca / Atleta</th>
							<th class="px-6 py-4">Graduação (Faixa)</th>
							<th class="px-6 py-4">Idade / Responsabilidade</th>
							<th class="px-6 py-4">Categoria & Divisão (CBJ)</th>
							<th class="px-6 py-4">Sensei Responsável</th>
							<th class="px-6 py-4">Matrícula</th>
							<th class="px-6 py-4 text-right">Ações</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-900">
						{#each data.alunos as aluno}
							<tr class="hover:bg-zinc-900/30 transition-colors group">
								<!-- Nome & CPF -->
								<td class="px-6 py-4">
									<a
										href="/dashboard/alunos/{aluno.id_usuario}"
										class="font-semibold text-white group-hover:text-red-400 transition-colors block"
									>
										{aluno.nome}
									</a>
									<div class="text-[11px] font-mono text-zinc-500 mt-0.5">
										CPF: {aluno.cpf.slice(0, 3)}.***.***-{aluno.cpf.slice(-2)}
									</div>
								</td>

								<!-- Faixa Atual -->
								<td class="px-6 py-4">
									<BadgeFaixa faixa={aluno.graduacao_atual} size="sm" />
								</td>

								<!-- Idade & Menoridade -->
								<td class="px-6 py-4">
									<div class="flex items-center gap-2">
										<span class="text-zinc-200 font-mono">{aluno.idade} anos</span>
										{#if aluno.menor_idade}
											<span
												class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/40 border border-amber-800/60 text-amber-300"
												title="Menor de 18 anos"
											>
												Menor
											</span>
										{:else}
											<span
												class="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800"
											>
												Maior
											</span>
										{/if}
									</div>
									{#if aluno.nome_responsavel}
										<div class="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
											<HeartHandshake class="w-3 h-3 text-amber-400 shrink-0" />
											<span
												class="truncate max-w-[220px]"
												title="{aluno.nome_responsavel}{aluno.parentesco_responsavel ? ` (${aluno.parentesco_responsavel})` : ''}"
											>
												{aluno.nome_responsavel}
												{#if aluno.parentesco_responsavel}
													<span class="text-zinc-500 font-mono">({aluno.parentesco_responsavel})</span>
												{/if}
											</span>
										</div>
									{/if}
								</td>

								<!-- Categoria & Divisão -->
								<td class="px-6 py-4">
									<div class="flex flex-col gap-1">
										<div class="flex items-center gap-1.5 flex-wrap">
											{#if aluno.categoria}
												<span
													class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-800/50"
													title="Categoria Oficial de Peso / Idade"
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
										<div class="flex items-center gap-1.5 flex-wrap text-[11px] text-zinc-500 font-mono">
											{#if aluno.peso}
												<span>{aluno.peso} kg</span>
											{/if}
											{#if aluno.status_federacao}
												<span>• FPJ: {aluno.status_federacao}</span>
											{/if}
										</div>
										{#if !aluno.categoria && !aluno.grupo_especial_aspirante && !aluno.status_federacao}
											<span class="text-zinc-600 text-xs">-</span>
										{/if}
									</div>
								</td>

								<!-- Sensei Técnico -->
								<td class="px-6 py-4">
									<span class="text-zinc-200 font-medium">
										{aluno.nome_professor_responsavel}
									</span>
								</td>

								<!-- Matrícula -->
								<td class="px-6 py-4 font-mono text-zinc-400">
									{aluno.matricula || '-'}
								</td>

								<!-- Ações -->
								<td class="px-6 py-4 text-right">
									<a
										href="/dashboard/alunos/{aluno.id_usuario}"
										class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 hover:text-white transition-colors"
										title={data.podeEditarAluno ? "Visualizar e editar dados do judoca" : "Visualizar dados do judoca"}
									>
										{#if data.podeEditarAluno}
											<Pencil class="w-3.5 h-3.5 text-zinc-400" />
											<span>Editar</span>
										{:else}
											<Eye class="w-3.5 h-3.5 text-zinc-400" />
											<span>Visualizar</span>
										{/if}
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
			<Users class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
			<h3 class="text-base font-bold text-white font-display">Nenhum judoca encontrado</h3>
			<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
				{#if data.busca}
					Nenhum resultado corresponde aos termos da pesquisa "{data.busca}".
				{:else}
					Comece matriculando o primeiro atleta da academia para dar início aos registros de treinos e graduações.
				{/if}
			</p>
			{#if data.podeCriarAluno}
				<div class="mt-5">
					<a
						href="/dashboard/alunos/novo"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
					>
						<UserPlus class="w-3.5 h-3.5" />
						<span>Cadastrar Primeiro Judoca</span>
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
