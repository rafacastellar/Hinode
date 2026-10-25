<script lang="ts">
	import CabecalhoDocumentoOficial from './CabecalhoDocumentoOficial.svelte';
	import type { UsuarioResumoDojo, PerfilItem } from '#lib/server/repositorios/usuario.repo';

	interface Props {
		nomeAcademia?: string;
		usuarios: UsuarioResumoDojo[];
		perfisDisponiveis?: PerfilItem[];
		filtroPerfil?: string;
		criterioOrdenacao?: 'nome' | 'perfil' | 'idade';
	}

	let {
		nomeAcademia = 'Judô Hinodê',
		usuarios,
		perfisDisponiveis = [],
		filtroPerfil = 'todos',
		criterioOrdenacao = 'nome'
	}: Props = $props();

	// Lista filtrada e ordenada
	const usuariosFiltrados = $derived.by(() => {
		let lista = [...usuarios];

		// Filtro por perfil
		if (filtroPerfil !== 'todos') {
			const perfilAlvo = filtroPerfil.toLowerCase();
			lista = lista.filter((u) =>
				u.perfis.some(
					(p) =>
						p.role.toLowerCase() === perfilAlvo ||
						p.role.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === perfilAlvo
				)
			);
		}

		// Ordenação
		lista.sort((a, b) => {
			if (criterioOrdenacao === 'idade') {
				if (a.idade !== b.idade) return a.idade - b.idade;
			} else if (criterioOrdenacao === 'perfil') {
				const perfilA = a.perfis.map((p) => p.role).join(', ');
				const perfilB = b.perfis.map((p) => p.role).join(', ');
				const cmpPerfil = perfilA.localeCompare(perfilB, 'pt-BR');
				if (cmpPerfil !== 0) return cmpPerfil;
			}

			// Desempate ou ordenação primária por nome (A-Z)
			return a.nome.localeCompare(b.nome, 'pt-BR');
		});

		return lista;
	});

	function rotuloFiltroPerfil(filtro: string): string {
		if (filtro === 'todos') return 'Todos os Perfis (Geral)';
		return `Apenas Perfil: ${filtro.toUpperCase()}`;
	}

	function rotuloOrdenacao(criterio: string): string {
		if (criterio === 'perfil') return 'Função / Perfil Principal';
		if (criterio === 'idade') return 'Idade';
		return 'Nome do Usuário (A-Z)';
	}
</script>

<div class="documento-usuarios-container">
	<CabecalhoDocumentoOficial
		{nomeAcademia}
		titulo="Relatório Geral de Membros & Usuários"
		subtitulo="Relação cadastral oficial de operadores do sistema, senseis, judocas e responsáveis"
		codigoDoc="REL-USR-01"
	/>

	<!-- Bloco de Informações & Filtros -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 mb-5 rounded-lg border border-zinc-300 bg-zinc-50 text-[11px]">
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Entidade / Dojo</span>
			<span class="font-bold text-zinc-900 text-xs">{nomeAcademia}</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Filtro de Perfil</span>
			<span class="font-bold text-zinc-900">{rotuloFiltroPerfil(filtroPerfil)}</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Ordenação da Lista</span>
			<span class="font-bold text-zinc-900">{rotuloOrdenacao(criterioOrdenacao)}</span>
		</div>
		<div>
			<span class="text-zinc-500 font-mono uppercase block text-[9px]">Total de Registros</span>
			<span class="font-bold text-zinc-900 font-mono">{usuariosFiltrados.length} cadastrados</span>
		</div>
	</div>

	<!-- Tabela de Usuários -->
	<div class="mb-6 overflow-x-auto">
		<table class="w-full border-collapse text-left border border-zinc-300 text-[10px]">
			<thead>
				<tr class="bg-zinc-100 text-zinc-800 border-b border-zinc-300 font-semibold uppercase text-[9px] tracking-wider">
					<th class="py-2 px-1.5 w-7 text-center border-r border-zinc-300">#</th>
					<th class="py-2 px-2.5 border-r border-zinc-300">Nome do Membro</th>
					<th class="py-2 px-2 w-24 border-r border-zinc-300 font-mono">Documento</th>
					<th class="py-2 px-2 w-14 border-r border-zinc-300 text-center">Idade</th>
					<th class="py-2 px-2.5 w-32 border-r border-zinc-300">Papéis / Perfis</th>
					<th class="py-2 px-2.5 border-r border-zinc-300">Contato (E-mail / Tel)</th>
					<th class="py-2 px-2 w-28 text-center">Registro / Sensei</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-zinc-200">
				{#each usuariosFiltrados as usr, index}
					<tr class="hover:bg-zinc-50 transition-colors">
						<td class="py-2 px-1 text-center border-r border-zinc-200 font-mono text-[9px] text-zinc-500">
							{String(index + 1).padStart(2, '0')}
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 font-medium text-zinc-900">
							<span class="font-semibold block">{usr.nome}</span>
							<span class="text-[8px] font-mono text-zinc-400">ID #{usr.id_usuario}</span>
						</td>
						<td class="py-2 px-2 border-r border-zinc-200 font-mono text-zinc-700 text-[9px]">
							{usr.cpf_mascarado || '—'}
						</td>
						<td class="py-2 px-2 border-r border-zinc-200 text-center font-mono text-zinc-600">
							{usr.idade} anos
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200">
							<div class="flex flex-wrap gap-1">
								{#each usr.perfis as perfil}
									<span class="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-zinc-100 text-zinc-800 border border-zinc-300">
										{perfil.role}
									</span>
								{/each}
							</div>
						</td>
						<td class="py-2 px-2.5 border-r border-zinc-200 text-zinc-700">
							<span class="block truncate max-w-[180px] font-mono text-[9px]">{usr.email}</span>
							{#if usr.telefone}
								<span class="text-[8px] font-mono text-zinc-500 block">{usr.telefone}</span>
							{/if}
						</td>
						<td class="py-2 px-2 text-center text-zinc-700">
							{#if usr.dados_professor}
								<span class="font-bold text-[9px] text-zinc-900 block">
									{usr.dados_professor.grau_faixa || 'Sensei'}
								</span>
								{#if usr.dados_professor.n_federacao}
									<span class="text-[8px] font-mono text-zinc-500 block">
										Fed: {usr.dados_professor.n_federacao}
									</span>
								{/if}
							{:else}
								<span class="text-zinc-400 font-mono text-[9px]">—</span>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="py-6 text-center text-zinc-500 italic">
							Nenhum usuário cadastrado encontrado com os filtros selecionados.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Rodapé: Resumo e Assinatura -->
	<div class="evitar-quebra mt-8 pt-4 border-t-2 border-zinc-300">
		<div class="flex items-start justify-between gap-8">
			<!-- Resumo por Perfis -->
			<div class="text-[10px] text-zinc-600 space-y-1">
				<div><strong>Total Geral Listado:</strong> {usuariosFiltrados.length} membros</div>
				<div class="text-zinc-500 text-[9px] mt-2">
					* Documento restrito à administração do dojo em conformidade com as diretrizes da LGPD (dados anonimizados/mascarados para exibição).
				</div>
			</div>

			<!-- Assinatura da Diretoria Administrativa -->
			<div class="w-64 text-center shrink-0">
				<div class="h-10 border-b border-zinc-800 mb-1.5"></div>
				<span class="font-bold text-[11px] text-zinc-900 block leading-tight">
					Diretoria Administrativa
				</span>
				<span class="text-[9px] text-zinc-500 block">
					{nomeAcademia}
				</span>
			</div>
		</div>
	</div>
</div>
