<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Users,
		UserPlus,
		Search,
		Shield,
		KeyRound,
		UserX,
		Pencil,
		AlertCircle,
		CheckCircle2,
		X,
		Award,
		Lock,
		Eye,
		EyeOff,
		Check,
		Globe,
		ShieldCheck
	} from '@lucide/svelte';
	import { analisarForcaSenha } from '#lib/dominio/validacao';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let termoBusca = $state('');
	let perfilFiltro = $state('');

	$effect(() => {
		termoBusca = data.busca || '';
		perfilFiltro = data.perfilSelecionado ? String(data.perfilSelecionado) : '';
	});

	// Modais
	let modalSenhaAberto = $state(false);
	let usuarioSenhaModal = $state<{ id: number; nome: string } | null>(null);
	let novaSenhaValor = $state('');
	let mostrarNovaSenha = $state(false);
	const analiseNovaSenha = $derived(analisarForcaSenha(novaSenhaValor));

	let modalExcluirAberto = $state(false);
	let usuarioExcluirModal = $state<{ id: number; nome: string } | null>(null);

	function abrirModalSenha(id: number, nome: string) {
		usuarioSenhaModal = { id, nome };
		novaSenhaValor = '';
		mostrarNovaSenha = false;
		modalSenhaAberto = true;
	}

	function fecharModalSenha() {
		modalSenhaAberto = false;
		usuarioSenhaModal = null;
		novaSenhaValor = '';
		mostrarNovaSenha = false;
	}

	function abrirModalExcluir(id: number, nome: string) {
		usuarioExcluirModal = { id, nome };
		modalExcluirAberto = true;
	}

	function fecharModalExcluir() {
		modalExcluirAberto = false;
		usuarioExcluirModal = null;
	}

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

<div class="space-y-6">
	<!-- ========================================================================= -->
	<!-- 1. CABEÇALHO DA PÁGINA -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-semibold">
					Governança de Equipe
				</span>
				<span class="text-zinc-600">•</span>
				<span class="text-xs font-mono text-zinc-400">RBAC Acumulativo</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
				Gestão de Usuários
			</h1>
			<p class="text-sm text-zinc-400 mt-1">
				Controle de operadores do sistema, senseis e atribuição de perfis acumulativos.
			</p>
		</div>

		<a
			href="/dashboard/usuarios/novo"
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(220,38,38,0.35)] transition-all shrink-0"
		>
			<UserPlus class="w-4 h-4" />
			<span>Novo Usuário</span>
		</a>
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
	<!-- 2. BARRA DE BUSCA E FILTRO POR PAPEL -->
	<!-- ========================================================================= -->
	<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col md:flex-row gap-3">
		<!-- Campo de Busca -->
		<form method="GET" class="flex-1 relative">
			{#if perfilFiltro}
				<input type="hidden" name="perfil" value={perfilFiltro} />
			{/if}
			<Search class="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
			<input
				type="text"
				name="busca"
				bind:value={termoBusca}
				placeholder="Buscar por nome, e-mail ou CPF..."
				class="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
			/>
		</form>

		<!-- Filtro por Perfil -->
		<form method="GET" class="flex items-center gap-2">
			{#if termoBusca}
				<input type="hidden" name="busca" value={termoBusca} />
			{/if}
			<div class="relative shrink-0">
				<select
					name="perfil"
					bind:value={perfilFiltro}
					onchange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
					class="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
				>
					<option value="">Todos os Perfis ({data.perfis.length})</option>
					{#each data.perfis as perfil}
						<option value={perfil.id_perfil}>Perfil: {perfil.role}</option>
					{/each}
				</select>
			</div>
		</form>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. TABELA DE USUÁRIOS E PERFIS -->
	<!-- ========================================================================= -->
	<div class="rounded-2xl bg-zinc-950 border border-zinc-900 overflow-hidden">
		{#if data.usuarios.length === 0}
			<div class="p-16 text-center">
				<Users class="w-10 h-10 text-zinc-700 mx-auto mb-3" />
				<h3 class="text-sm font-bold text-zinc-300">Nenhum usuário encontrado</h3>
				<p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
					Não há operadores cadastrados que correspondam aos filtros de busca atuais.
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="bg-zinc-900/60 border-b border-zinc-900 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
						<tr>
							<th class="px-5 py-3">Operador / Usuário</th>
							<th class="px-5 py-3">CPF (LGPD)</th>
							<th class="px-5 py-3">Idade / Nasc.</th>
							<th class="px-5 py-3">Perfis Acumulativos</th>
							<th class="px-5 py-3">Dados de Sensei</th>
							<th class="px-5 py-3 text-right">Ações</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-900/80">
						{#each data.usuarios as usuario}
							<tr class="hover:bg-zinc-900/30 transition-colors group">
								<!-- Nome & E-mail -->
								<td class="px-5 py-4">
									<div class="flex items-center gap-3">
										<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-300 text-xs shrink-0">
											{usuario.nome.charAt(0).toUpperCase()}
										</div>
										<div class="min-w-0">
											<span class="text-zinc-100 font-semibold block truncate">
												{usuario.nome}
											</span>
											<span class="text-zinc-500 text-[11px] block truncate">
												{usuario.email}
											</span>
										</div>
									</div>
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

								<!-- Dados de Sensei -->
								<td class="px-5 py-4 whitespace-nowrap">
									{#if usuario.dados_professor}
										<div class="flex items-center gap-1.5 text-amber-400 text-[11px]">
											<Award class="w-3.5 h-3.5 shrink-0" />
											<span class="font-medium">{usuario.dados_professor.grau_faixa || 'Sensei'}</span>
											<span class="text-zinc-500 font-mono text-[10px]">
												({usuario.dados_professor.n_federacao || 'S/ Fed.'})
											</span>
										</div>
									{:else}
										<span class="text-zinc-600">-</span>
									{/if}
								</td>

								<!-- Ações -->
								<td class="px-5 py-4 text-right whitespace-nowrap">
									<div class="flex items-center justify-end gap-1">
										<!-- Editar -->
										<a
											href={`/dashboard/usuarios/${usuario.id_usuario}`}
											class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800/80"
											title="Editar dados e perfis"
										>
											<Pencil class="w-3.5 h-3.5" />
										</a>

										<!-- Redefinir Senha -->
										<button
											type="button"
											onclick={() => abrirModalSenha(usuario.id_usuario, usuario.nome)}
											class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors border border-zinc-800/80 cursor-pointer"
											title="Redefinir senha"
										>
											<KeyRound class="w-3.5 h-3.5" />
										</button>

										<!-- Desvincular -->
										<button
											type="button"
											onclick={() => abrirModalExcluir(usuario.id_usuario, usuario.nome)}
											class="p-2 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors border border-zinc-800/80 cursor-pointer"
											title="Remover dojo"
										>
											<UserX class="w-3.5 h-3.5" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- ========================================================================= -->
<!-- MODAL: REDEFINIR SENHA -->
<!-- ========================================================================= -->
{#if modalSenhaAberto && usuarioSenhaModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2 text-white font-bold text-sm">
					<Lock class="w-4 h-4 text-amber-500" />
					<span>Redefinir Senha de Acesso</span>
				</div>
				<button
					type="button"
					onclick={fecharModalSenha}
					class="text-zinc-500 hover:text-zinc-200 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<p class="text-xs text-zinc-400">
				Definir nova credencial para <strong class="text-white">{usuarioSenhaModal.nome}</strong>. Todas as sessões ativas desta conta serão invalidadas.
			</p>

			<form
				method="POST"
				action="?/redefinirSenha"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						fecharModalSenha();
					};
				}}
				class="space-y-3"
			>
				<input type="hidden" name="idUsuario" value={usuarioSenhaModal.id} />

				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<label for="novaSenha" class="text-[11px] font-mono uppercase text-zinc-400 block">
							Nova Senha (Mín. 8 caracteres)
						</label>
						{#if analiseNovaSenha.forca === 'forte'}
							<span class="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
								<ShieldCheck class="w-3 h-3" /> Senha Forte
							</span>
						{:else if analiseNovaSenha.forca === 'boa'}
							<span class="text-[10px] font-mono text-blue-400 font-bold">Senha Boa</span>
						{:else if analiseNovaSenha.forca === 'media'}
							<span class="text-[10px] font-mono text-amber-400 font-bold">Senha Média</span>
						{:else if novaSenhaValor.length > 0}
							<span class="text-[10px] font-mono text-red-400 font-bold">Senha Fraca</span>
						{/if}
					</div>

					<div class="relative">
						<input
							type={mostrarNovaSenha ? 'text' : 'password'}
							id="novaSenha"
							name="novaSenha"
							required
							minlength="8"
							bind:value={novaSenhaValor}
							placeholder="Crie uma nova senha forte"
							class="w-full pl-3.5 pr-10 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors font-mono"
						/>
						<button
							type="button"
							onclick={() => (mostrarNovaSenha = !mostrarNovaSenha)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
							title={mostrarNovaSenha ? 'Ocultar senha' : 'Exibir senha'}
						>
							{#if mostrarNovaSenha}
								<EyeOff class="w-3.5 h-3.5" />
							{:else}
								<Eye class="w-3.5 h-3.5" />
							{/if}
						</button>
					</div>

					<!-- Barra de Força -->
					{#if novaSenhaValor.length > 0}
						<div class="space-y-1 pt-1">
							<div class="grid grid-cols-4 gap-1 h-1.5">
								<div class="rounded-full transition-all duration-300 {analiseNovaSenha.pontuacao >= 1 ? (analiseNovaSenha.forca === 'fraca' ? 'bg-red-500' : analiseNovaSenha.forca === 'media' ? 'bg-amber-500' : analiseNovaSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseNovaSenha.pontuacao >= 2 ? (analiseNovaSenha.forca === 'media' ? 'bg-amber-500' : analiseNovaSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseNovaSenha.pontuacao >= 3 ? (analiseNovaSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseNovaSenha.pontuacao >= 4 ? 'bg-emerald-500' : 'bg-zinc-800'}"></div>
							</div>
							<div class="grid grid-cols-2 gap-1 pt-1 text-[10px] font-mono">
								<span class="flex items-center gap-1 {analiseNovaSenha.criterios.comprimentoMinimo ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
									{#if analiseNovaSenha.criterios.comprimentoMinimo}<Check class="w-3 h-3" />{:else}•{/if} 8+ chars
								</span>
								<span class="flex items-center gap-1 {analiseNovaSenha.criterios.maiuscula && analiseNovaSenha.criterios.minuscula ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
									{#if analiseNovaSenha.criterios.maiuscula && analiseNovaSenha.criterios.minuscula}<Check class="w-3 h-3" />{:else}•{/if} Maiúsc./Minúsc.
								</span>
								<span class="flex items-center gap-1 {analiseNovaSenha.criterios.numero ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
									{#if analiseNovaSenha.criterios.numero}<Check class="w-3 h-3" />{:else}•{/if} Ao menos 1 número
								</span>
								<span class="flex items-center gap-1 {analiseNovaSenha.criterios.especial ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
									{#if analiseNovaSenha.criterios.especial}<Check class="w-3 h-3" />{:else}•{/if} Símbolo (@$!%*?&#)
								</span>
							</div>
						</div>
					{/if}
				</div>

				<div>
					<label for="confirmacaoSenha" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Confirmar Nova Senha
					</label>
					<input
						type="password"
						id="confirmacaoSenha"
						name="confirmacaoSenha"
						required
						minlength="8"
						placeholder="Repita a nova senha"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors font-mono"
					/>
				</div>

				<div class="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={fecharModalSenha}
						class="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-lg"
					>
						Salvar Nova Senha
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: CONFIRMAR DESVINCULAÇÃO -->
<!-- ========================================================================= -->
{#if modalExcluirAberto && usuarioExcluirModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2 text-white font-bold text-sm">
					<UserX class="w-4 h-4 text-red-500" />
					<span>Confirmar Desvinculação</span>
				</div>
				<button
					type="button"
					onclick={fecharModalExcluir}
					class="text-zinc-500 hover:text-zinc-200 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<p class="text-xs text-zinc-400 leading-relaxed">
				Deseja realmente remover o vínculo de <strong class="text-white">{usuarioExcluirModal.nome}</strong> com esta academia? O usuário perderá todos os acessos e papéis acumulados neste dojo.
			</p>

			<form
				method="POST"
				action="?/desvincular"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						fecharModalExcluir();
					};
				}}
				class="flex items-center justify-end gap-2 pt-2"
			>
				<input type="hidden" name="idUsuario" value={usuarioExcluirModal.id} />
				<button
					type="button"
					onclick={fecharModalExcluir}
					class="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
				>
					Cancelar
				</button>
				<button
					type="submit"
					class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-lg"
				>
					Confirmar Remoção
				</button>
			</form>
		</div>
	</div>
{/if}
