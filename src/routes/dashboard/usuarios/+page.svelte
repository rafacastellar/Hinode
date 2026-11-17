<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Users,
		UserPlus,
		Search,
		Pencil,
		AlertCircle,
		CheckCircle2,
		X,
		Printer,
		Filter
	} from '@lucide/svelte';
	import ModalImpressaoDocumento from '#lib/components/documentos/ModalImpressaoDocumento.svelte';
	import DocumentoUsuariosImpressao from '#lib/components/documentos/DocumentoUsuariosImpressao.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let termoBusca = $state('');
	let mostrarTodos = $state(false);
	let perfilChip = $state<string | null>(null);

	// Estado de Impressão da Lista de Usuários
	let modalImpressaoAberto = $state(false);
	let filtroImpressaoPerfil = $state('todos');
	let ordenacaoImpressao = $state<'nome' | 'perfil' | 'idade'>('nome');

	$effect(() => {
		if (data.busca) {
			termoBusca = data.busca;
		}
		if (data.perfilSelecionado) {
			const p = data.perfis.find((item) => item.id_perfil === data.perfilSelecionado);
			if (p) perfilChip = p.role;
		}
	});

	function alternarPerfilChip(role: string) {
		if (perfilChip === role) {
			perfilChip = null;
		} else {
			perfilChip = role;
		}
	}

	function limparQuadro() {
		termoBusca = '';
		perfilChip = null;
		mostrarTodos = false;
	}

	const totalUsuarios = $derived(data.usuarios.length);
	const totalBloqueados = $derived(data.usuarios.filter((u) => !u.ativo_no_dojo).length);

	const quadroAtivo = $derived(
		Boolean(termoBusca.trim().length > 0 || perfilChip !== null || mostrarTodos)
	);

	const usuariosFiltrados = $derived.by(() => {
		if (!quadroAtivo) return [];

		const q = termoBusca.trim().toLowerCase();
		const digitos = q.replace(/\D/g, '');

		return data.usuarios.filter((usuario) => {
			if (perfilChip === 'BLOQUEADOS') {
				if (usuario.ativo_no_dojo) return false;
			} else if (perfilChip) {
				const temRole = usuario.perfis.some(
					(p) => p.role.toLowerCase() === perfilChip!.toLowerCase()
				);
				if (!temRole) return false;
			}

			if (!q) return true;
			const bateNome = usuario.nome.toLowerCase().includes(q);
			const bateEmail = usuario.email.toLowerCase().includes(q);
			const bateCpf = digitos.length >= 3 && usuario.cpf.replace(/\D/g, '').includes(digitos);
			const bateFaixa = Boolean(
				usuario.graduacao_unificada && usuario.graduacao_unificada.toLowerCase().includes(q)
			);
			const bateFed = Boolean(
				usuario.n_federacao_unificado && usuario.n_federacao_unificado.toLowerCase().includes(q)
			);

			return bateNome || bateEmail || bateCpf || bateFaixa || bateFed;
		});
	});

	function corDoPerfil(role: string): string {
		switch (role.toLowerCase()) {
			case 'admin':
				return 'bg-red-950/60 border-red-800/80 text-red-300';
			case 'professor':
				return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
			case 'recepção':
			case 'recepcao':
				return 'bg-purple-950/60 border-purple-800/80 text-purple-300';
			case 'aluno':
				return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
			case 'responsável':
			case 'responsavel':
				return 'bg-blue-950/60 border-blue-800/80 text-blue-300';
			default:
				return 'bg-zinc-900 border-zinc-800 text-zinc-300';
		}
	}
</script>

<svelte:head>
	<title>Equipe & Usuários - Judô Hinodê</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6">
	<!-- ========================================================================= -->
	<!-- 1. CABEÇALHO DA PÁGINA -->
	<!-- ========================================================================= -->
	<div
		class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-900"
	>
		<div>
			<div class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500">
				<Users class="w-3.5 h-3.5" />
				<span>Governança de Equipe • RBAC Acumulativo</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight text-white mt-1">
				Gestão de Usuários
			</h2>
			<p class="text-xs text-zinc-400 mt-1">
				Pesquise operadores, senseis, judocas e responsáveis sob demanda. As ações sensíveis de senha, bloqueio e exclusão ficam protegidas dentro da ficha de cada usuário.
			</p>
		</div>

		<div class="flex items-center gap-2.5 shrink-0 flex-wrap">
			<button
				type="button"
				onclick={() => (modalImpressaoAberto = true)}
				class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 text-xs font-semibold shadow-sm cursor-pointer transition-all"
				title="Imprimir relatório e relação cadastral de usuários"
			>
				<Printer class="w-4 h-4 text-red-500" />
				<span>Imprimir Relação</span>
			</button>

			<a
				href="/dashboard/usuarios/novo"
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 transition-all shrink-0"
			>
				<UserPlus class="w-4 h-4" />
				<span>Cadastrar Usuário</span>
			</a>
		</div>
	</div>

	<!-- Feedback de Operações -->
	{#if form?.mensagem}
		<div class="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-3">
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<p class="font-medium">{form.mensagem}</p>
		</div>
	{/if}

	{#if form?.erro}
		<div class="p-4 rounded-xl bg-red-950/30 border border-red-800/60 text-red-300 text-xs flex items-center gap-3">
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<p class="font-medium">{form.erro}</p>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. QUADRO DE CONSULTA DE USUÁRIOS (ZERO-LOAD INICIAL + FILTROS RÁPIDOS)   -->
	<!-- ========================================================================= -->
	<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-900">
			<div class="flex items-center gap-2.5">
				<div
					class="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400"
				>
					<Users class="w-4 h-4" />
				</div>
				<div>
					<h3 class="text-sm font-semibold text-white">
						Diretório de Operadores & Membros do Dojo
					</h3>
					<p class="text-[11px] text-zinc-500">
						Pesquise por nome, e-mail, CPF, faixa ou código FPJ, selecione um perfil abaixo ou clique em "Listar Todos"
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
					{mostrarTodos ? 'Recolher Lista' : `Listar Todos (${totalUsuarios})`}
				</button>
			</div>
		</div>

		<!-- Campo de Busca Instantânea -->
		<div class="relative">
			<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
			<input
				type="text"
				bind:value={termoBusca}
				placeholder="Digite o nome, e-mail, CPF, faixa ou código FPJ/CBJ para localizar..."
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

		<!-- Chips de Filtro por Perfil -->
		<div class="flex items-center gap-2 flex-wrap text-xs">
			<span
				class="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1 mr-1"
			>
				<Filter class="w-3 h-3" />
				<span>Perfis:</span>
			</span>
			<button
				type="button"
				onclick={() => {
					perfilChip = null;
					mostrarTodos = !mostrarTodos;
				}}
				class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {mostrarTodos &&
				perfilChip === null
					? 'bg-red-950/50 border-red-800/80 text-white font-bold'
					: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
			>
				Todos ({totalUsuarios})
			</button>
			{#each data.perfis as p}
				{@const qtd = data.usuarios.filter((u) =>
					u.perfis.some((up) => up.id_perfil === p.id_perfil)
				).length}
				<button
					type="button"
					onclick={() => alternarPerfilChip(p.role)}
					class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {perfilChip ===
					p.role
						? corDoPerfil(p.role) + ' font-bold'
						: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
				>
					{p.role} ({qtd})
				</button>
			{/each}
			{#if totalBloqueados > 0}
				<button
					type="button"
					onclick={() => alternarPerfilChip('BLOQUEADOS')}
					class="px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer {perfilChip ===
					'BLOQUEADOS'
						? 'bg-red-950/60 border-red-700 text-red-200 font-bold'
						: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}"
				>
					Bloqueados ({totalBloqueados})
				</button>
			{/if}
		</div>

		<!-- Conteúdo da Listagem -->
		{#if !quadroAtivo}
			<div class="p-8 rounded-xl bg-zinc-900/25 border border-dashed border-zinc-800 text-center space-y-2">
				<Search class="w-7 h-7 text-zinc-600 mx-auto" />
				<p class="text-xs sm:text-sm font-semibold text-zinc-300">
					Pronto para pesquisa de usuários
				</p>
				<p class="text-xs text-zinc-500 max-w-md mx-auto">
					Digite no campo de busca acima, selecione um <strong class="text-zinc-300">Perfil</strong> nos filtros rápidos ou clique em <strong class="text-zinc-300">Listar Todos ({totalUsuarios})</strong>.
				</p>
			</div>
		{:else if usuariosFiltrados.length === 0}
			<div class="p-8 rounded-xl bg-zinc-900/30 border border-zinc-900 text-center text-xs text-zinc-500 font-mono">
				Nenhum usuário encontrado para os filtros informados.
			</div>
		{:else}
			<div class="rounded-2xl border border-zinc-900 overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead class="bg-zinc-900/60 border-b border-zinc-900 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
							<tr>
								<th class="px-5 py-3">Operador / Usuário</th>
								<th class="px-5 py-3">Status</th>
								<th class="px-5 py-3">CPF / Doc (LGPD)</th>
								<th class="px-5 py-3">Idade / Nasc.</th>
								<th class="px-5 py-3">Perfis Acumulativos</th>
								<th class="px-5 py-3 text-right">Ficha</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-900/80">
							{#each usuariosFiltrados as usuario}
								<tr class="hover:bg-zinc-900/30 transition-colors group">
									<!-- Nome & E-mail -->
									<td class="px-5 py-4">
										<div class="flex items-center gap-3">
											<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-300 text-xs shrink-0">
												{usuario.nome.charAt(0).toUpperCase()}
											</div>
											<div class="min-w-0">
												<a
													href={`/dashboard/usuarios/${usuario.id_usuario}`}
													class="text-zinc-100 hover:text-red-400 font-semibold block truncate transition-colors"
												>
													{usuario.nome}
												</a>
												<span class="text-zinc-500 text-[11px] block truncate">
													{usuario.email}
												</span>
											</div>
										</div>
									</td>

									<!-- Status no Dojo -->
									<td class="px-5 py-4 whitespace-nowrap">
										{#if usuario.ativo_no_dojo}
											<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
												Ativo
											</span>
										{:else}
											<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-950/60 border border-red-800/80 text-red-300" title={usuario.motivo_bloqueio_dojo || 'Acesso bloqueado'}>
												<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
												Bloqueado
											</span>
										{/if}
									</td>

									<!-- CPF Mascarado -->
									<td class="px-5 py-4 font-mono text-zinc-400 whitespace-nowrap">
										<div class="flex items-center gap-1.5">
											{#if usuario.tipo_documento === 'ESTRANGEIRO'}
												<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/80 text-blue-300 font-sans" title={usuario.pais_origem || 'Internacional'}>
													🌐 {usuario.pais_origem || 'EXT'}
												</span>
											{/if}
											<span>{usuario.cpf_mascarado}</span>
										</div>
									</td>

									<!-- Idade & Gênero -->
									<td class="px-5 py-4 whitespace-nowrap text-zinc-300">
										<div class="flex items-center gap-1.5">
											<span>{usuario.idade} anos</span>
											<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
												{usuario.genero === 'F' ? 'Fem' : 'Masc'}
											</span>
										</div>
										<span class="text-[11px] text-zinc-500 block font-mono mt-0.5">
											{usuario.data_nascimento}
										</span>
									</td>

									<!-- Perfis Acumulativos -->
									<td class="px-5 py-4">
										<div class="flex flex-wrap gap-1.5 max-w-xs">
											{#each usuario.perfis as p}
												<span class="px-2 py-0.5 rounded text-[10px] font-mono border {corDoPerfil(p.role)}">
													{p.role}
												</span>
											{/each}
										</div>
									</td>

									<!-- Ação Única e Limpa (Sem botões destrutivos expostos na tabela) -->
									<td class="px-5 py-4 text-right whitespace-nowrap">
										<a
											href={`/dashboard/usuarios/${usuario.id_usuario}`}
											class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors border border-zinc-800 text-xs font-medium"
											title="Abrir ficha, abas de dados e governança de segurança"
										>
											<Pencil class="w-3.5 h-3.5 text-zinc-400" />
											<span>Gerenciar</span>
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- MODAL DE IMPRESSÃO DA RELAÇÃO DE USUÁRIOS -->
{#snippet controlesUsuarios()}
	<div class="flex items-center gap-2">
		<select
			bind:value={filtroImpressaoPerfil}
			class="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
			title="Filtrar por perfil"
		>
			<option value="todos">Todos os Perfis</option>
			{#each data.perfis as p}
				<option value={p.role}>{p.role}</option>
			{/each}
		</select>

		<select
			bind:value={ordenacaoImpressao}
			class="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
			title="Critério de ordenação da relação"
		>
			<option value="nome">Ordem: Nome (A-Z)</option>
			<option value="perfil">Ordem: Função / Perfil</option>
			<option value="idade">Ordem: Idade</option>
		</select>
	</div>
{/snippet}

<ModalImpressaoDocumento
	aberto={modalImpressaoAberto}
	titulo="Relação Cadastral de Membros do Dojo"
	subtitulo="Documento oficial para governança, conferência e arquivo físico"
	onfechar={() => (modalImpressaoAberto = false)}
	controles={controlesUsuarios}
>
	<DocumentoUsuariosImpressao
		usuarios={data.usuarios}
		perfisDisponiveis={data.perfis}
		filtroPerfil={filtroImpressaoPerfil}
		criterioOrdenacao={ordenacaoImpressao}
	/>
</ModalImpressaoDocumento>
