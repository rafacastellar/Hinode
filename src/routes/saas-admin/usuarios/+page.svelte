<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Users,
		Search,
		ShieldCheck,
		Building2,
		Ban,
		CheckCircle,
		UserCheck,
		X,
		CheckCircle2,
		AlertCircle
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let termoBusca = $state('');

	// Modal Bloqueio Global
	let modalBloqueioAberto = $state(false);
	let usuarioBloqueio = $state<{ id: number; nome: string; bloquear: boolean } | null>(null);
	let motivoBloqueio = $state('');

	// Modal Designar Admin
	let modalDesignarAberto = $state(false);
	let usuarioDesignar = $state<{ id: number; nome: string } | null>(null);
	let idAcademiaSelecionada = $state<number | null>(null);

	$effect(() => {
		termoBusca = data.busca || '';
	});

	function abrirModalBloqueio(id: number, nome: string, bloquear: boolean) {
		usuarioBloqueio = { id, nome, bloquear };
		motivoBloqueio = bloquear ? 'Suspensão global pela administração da plataforma SaaS' : '';
		modalBloqueioAberto = true;
	}

	function fecharModalBloqueio() {
		modalBloqueioAberto = false;
		usuarioBloqueio = null;
		motivoBloqueio = '';
	}

	function abrirModalDesignar(id: number, nome: string) {
		usuarioDesignar = { id, nome };
		idAcademiaSelecionada = data.academias.length > 0 ? data.academias[0].id_academia : null;
		modalDesignarAberto = true;
	}

	function fecharModalDesignar() {
		modalDesignarAberto = false;
		usuarioDesignar = null;
		idAcademiaSelecionada = null;
	}
</script>

<svelte:head>
	<title>SGT Manager • Gestão Global de Usuários</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER DA PÁGINA -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-6">
		<div>
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-xs font-mono mb-2">
				<Users class="w-3.5 h-3.5" />
				<span>Diretório Global de Usuários</span>
			</div>
			<h1 class="text-2xl font-extrabold text-white tracking-tight font-display">
				Controle Global de Usuários & Admins
			</h1>
			<p class="text-xs text-zinc-400 mt-1">
				Bloqueio em toda a plataforma, vinculação de administradores e visão de filiais por praticante
			</p>
		</div>
	</div>

	{#if form?.sucesso}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
			<span>{form.mensagem}</span>
		</div>
	{/if}

	{#if form?.erro}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
			<span>{form.erro}</span>
		</div>
	{/if}

	<!-- BARRA DE PESQUISA -->
	<form method="GET" class="flex gap-2 max-w-md">
		<div class="relative flex-1">
			<Search class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
			<input
				type="text"
				name="busca"
				bind:value={termoBusca}
				placeholder="Buscar por nome, e-mail ou documento..."
				class="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
			/>
		</div>
		<button
			type="submit"
			class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-800 transition-colors"
		>
			Filtrar
		</button>
	</form>

	<!-- TABELA GLOBAL DE USUÁRIOS -->
	<div class="rounded-2xl bg-zinc-950 border border-zinc-900 overflow-hidden">
		{#if data.usuarios.length === 0}
			<div class="p-12 text-center text-zinc-500 text-xs">
				Nenhum usuário localizado.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="bg-zinc-900/60 border-b border-zinc-900 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
						<tr>
							<th class="px-5 py-3">Usuário</th>
							<th class="px-5 py-3">Documento</th>
							<th class="px-5 py-3">Status Global</th>
							<th class="px-5 py-3">Academias Vinculadas</th>
							<th class="px-5 py-3 text-right">Ações do SaaS</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-900/80">
						{#each data.usuarios as u}
							<tr class="hover:bg-zinc-900/30 transition-colors">
								<td class="px-5 py-3">
									<div class="flex items-center gap-2.5">
										<div class="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-zinc-300">
											{u.nome.charAt(0).toUpperCase()}
										</div>
										<div>
											<span class="font-bold text-white block">{u.nome}</span>
											<span class="text-[11px] text-zinc-500 font-mono">{u.email}</span>
										</div>
									</div>
								</td>

								<td class="px-5 py-3 font-mono text-zinc-400 whitespace-nowrap">
									{u.cpf_mascarado}
								</td>

								<td class="px-5 py-3 whitespace-nowrap">
									{#if u.ativo}
										<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
											<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
											Ativo no SaaS
										</span>
									{:else}
										<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-950/60 border border-red-800/80 text-red-300" title={u.motivo_bloqueio_global || 'Bloqueado'}>
											<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
											Bloqueado Global
										</span>
									{/if}

									{#if u.is_super_admin}
										<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
											SUPER ADMIN
										</span>
									{/if}
								</td>

								<td class="px-5 py-3">
									<div class="flex flex-wrap gap-1 max-w-sm">
										{#if u.academias.length === 0}
											<span class="text-zinc-600 text-[11px]">- Sem dojo -</span>
										{:else}
											{#each u.academias as ac}
												<span class="px-2 py-0.5 rounded text-[10px] font-mono border {ac.ativo_no_dojo ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-red-950/40 border-red-800 text-red-300'}" title={`Perfis: ${ac.perfis.join(', ') || 'Nenhum'}`}>
													{ac.nome} {ac.perfis.length > 0 ? `(${ac.perfis.join('/')})` : ''}
												</span>
											{/each}
										{/if}
									</div>
								</td>

								<td class="px-5 py-3 text-right whitespace-nowrap">
									<div class="flex items-center justify-end gap-1.5">
										<!-- Designar como Admin -->
										<button
											type="button"
											onclick={() => abrirModalDesignar(u.id_usuario, u.nome)}
											class="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer"
											title="Designar como Administrador de uma Academia"
										>
											<Building2 class="w-3.5 h-3.5" />
										</button>

										<!-- Bloquear / Reativar Globalmente -->
										{#if !u.is_super_admin}
											<button
												type="button"
												onclick={() => abrirModalBloqueio(u.id_usuario, u.nome, u.ativo)}
												class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer {u.ativo ? 'hover:bg-red-950/60 text-zinc-400 hover:text-red-400' : 'hover:bg-emerald-950/60 text-zinc-400 hover:text-emerald-400'}"
												title={u.ativo ? 'Bloquear acesso global à plataforma' : 'Reativar acesso global à plataforma'}
											>
												{#if u.ativo}
													<Ban class="w-3.5 h-3.5" />
												{:else}
													<CheckCircle class="w-3.5 h-3.5" />
												{/if}
											</button>
										{/if}
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

<!-- MODAL: DESIGNAR ADMIN DE ACADEMIA -->
{#if modalDesignarAberto && usuarioDesignar}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2 text-white font-bold text-sm">
					<UserCheck class="w-4 h-4 text-amber-500" />
					<span>Designar Administrador de Academia</span>
				</div>
				<button
					type="button"
					onclick={fecharModalDesignar}
					class="text-zinc-500 hover:text-zinc-200 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<p class="text-xs text-zinc-400 leading-relaxed">
				Selecione qual academia o usuário <strong class="text-white">{usuarioDesignar.nome}</strong> passará a administrar:
			</p>

			<form
				method="POST"
				action="?/designarAdminAcademia"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						fecharModalDesignar();
					};
				}}
				class="space-y-4 pt-1 text-xs"
			>
				<input type="hidden" name="idUsuario" value={usuarioDesignar.id} />

				<div>
					<label for="idAcademia" class="text-zinc-400 font-mono block mb-1">Academia de Destino</label>
					<select
						id="idAcademia"
						name="idAcademia"
						bind:value={idAcademiaSelecionada}
						required
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
					>
						{#each data.academias as ac}
							<option value={ac.id_academia}>
								#{ac.id_academia} - {ac.nome_fantasia || ac.nome}
							</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={fecharModalDesignar}
						class="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider shadow-lg transition-all"
					>
						Vincular como Admin
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL: BLOQUEIO GLOBAL DO USUÁRIO -->
{#if modalBloqueioAberto && usuarioBloqueio}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2 text-white font-bold text-sm">
					{#if usuarioBloqueio.bloquear}
						<Ban class="w-4 h-4 text-red-500" />
						<span>Bloqueio Global de Usuário</span>
					{:else}
						<CheckCircle class="w-4 h-4 text-emerald-500" />
						<span>Reativação Global de Usuário</span>
					{/if}
				</div>
				<button
					type="button"
					onclick={fecharModalBloqueio}
					class="text-zinc-500 hover:text-zinc-200 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<p class="text-xs text-zinc-400 leading-relaxed">
				{#if usuarioBloqueio.bloquear}
					Deseja bloquear globalmente o usuário <strong class="text-white">{usuarioBloqueio.nome}</strong>? Ele será impedido de acessar qualquer academia e todas as suas sessões em aberto serão encerradas na hora.
				{:else}
					Deseja reativar o acesso global do usuário <strong class="text-white">{usuarioBloqueio.nome}</strong>?
				{/if}
			</p>

			<form
				method="POST"
				action="?/alternarBloqueioGlobal"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						fecharModalBloqueio();
					};
				}}
				class="space-y-4 pt-1 text-xs"
			>
				<input type="hidden" name="idUsuario" value={usuarioBloqueio.id} />
				<input type="hidden" name="acao" value={usuarioBloqueio.bloquear ? 'bloquear' : 'reativar'} />

				{#if usuarioBloqueio.bloquear}
					<div>
						<label for="motivo" class="text-zinc-400 font-mono block mb-1">Motivo do Bloqueio Global</label>
						<input
							id="motivo"
							name="motivo"
							bind:value={motivoBloqueio}
							placeholder="Violação de termos de uso, suspensão cadastral, etc."
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-red-500"
						/>
					</div>
				{/if}

				<div class="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={fecharModalBloqueio}
						class="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-white shadow-lg transition-all {usuarioBloqueio.bloquear ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}"
					>
						{usuarioBloqueio.bloquear ? 'Confirmar Bloqueio' : 'Confirmar Reativação'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

