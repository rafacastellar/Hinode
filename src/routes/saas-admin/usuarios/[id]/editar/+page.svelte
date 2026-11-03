<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		ArrowLeft,
		ShieldCheck,
		Building2,
		AlertCircle,
		CheckCircle2,
		Save,
		KeyRound,
		User,
		Plus,
		Trash2,
		Ban
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let tipoDocumento = $state<'CPF' | 'ESTRANGEIRO'>(data.usuario.tipo_documento);
	let isSuperAdmin = $state(data.usuario.is_super_admin);
	let ativo = $state(data.usuario.ativo);
	let motivoBloqueio = $state(data.usuario.motivo_bloqueio_global || '');
	let novaSenha = $state('');

	// Estrutura de Vínculos reativa
	interface VinculoLocal {
		idAcademia: number;
		nomeAcademia: string;
		ativo: boolean;
		idsPerfis: number[];
	}

	let vinculos = $state<VinculoLocal[]>(
		data.usuario.vinculos.map((v) => ({
			idAcademia: v.id_academia,
			nomeAcademia: v.nome_academia,
			ativo: v.ativo,
			idsPerfis: [...v.ids_perfis]
		}))
	);

	let novaAcademiaParaAdicionar = $state<number | null>(
		data.academias.length > 0 ? data.academias[0].id_academia : null
	);

	function adicionarVinculo() {
		if (!novaAcademiaParaAdicionar) return;
		const jaExiste = vinculos.some((v) => v.idAcademia === novaAcademiaParaAdicionar);
		if (jaExiste) return;

		const ac = data.academias.find((a) => a.id_academia === novaAcademiaParaAdicionar);
		if (!ac) return;

		vinculos = [
			...vinculos,
			{
				idAcademia: ac.id_academia,
				nomeAcademia: ac.nome_fantasia || ac.nome,
				ativo: true,
				idsPerfis: []
			}
		];
	}

	function removerVinculo(idAcademia: number) {
		vinculos = vinculos.filter((v) => v.idAcademia !== idAcademia);
	}

	function alternarPerfilVinculo(idAcademia: number, idPerfil: number) {
		vinculos = vinculos.map((v) => {
			if (v.idAcademia === idAcademia) {
				const novo = v.idsPerfis.includes(idPerfil)
					? v.idsPerfis.filter((p) => p !== idPerfil)
					: [...v.idsPerfis, idPerfil];
				return { ...v, idsPerfis: novo };
			}
			return v;
		});
	}

	// Serialização para envio do form
	let vinculosJson = $derived(JSON.stringify(vinculos));

	// Máscara de CPF
	function aplicarMascaraCpf(valor: string) {
		const apenasNum = valor.replace(/\D/g, '').slice(0, 11);
		if (apenasNum.length <= 3) return apenasNum;
		if (apenasNum.length <= 6) return `${apenasNum.slice(0, 3)}.${apenasNum.slice(3)}`;
		if (apenasNum.length <= 9)
			return `${apenasNum.slice(0, 3)}.${apenasNum.slice(3, 6)}.${apenasNum.slice(6)}`;
		return `${apenasNum.slice(0, 3)}.${apenasNum.slice(3, 6)}.${apenasNum.slice(6, 9)}-${apenasNum.slice(9)}`;
	}

	function handleInputDoc(e: Event) {
		const target = e.target as HTMLInputElement;
		if (tipoDocumento === 'CPF') {
			target.value = aplicarMascaraCpf(target.value);
		}
	}
</script>

<svelte:head>
	<title>SGT Manager • Editar Usuário #{data.usuario.id_usuario}</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- HEADER E NAVEGAÇÃO -->
	<div class="flex items-center justify-between border-b border-zinc-900 pb-5">
		<div class="flex items-center gap-3">
			<a
				href="/saas-admin/usuarios"
				class="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
				title="Voltar ao Diretório"
			>
				<ArrowLeft class="w-4 h-4" />
			</a>
			<div>
				<div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-[11px] font-mono mb-1">
					<User class="w-3.5 h-3.5" />
					<span>Backoffice SaaS • Ficha Cadastral #{data.usuario.id_usuario}</span>
				</div>
				<h1 class="text-xl font-extrabold text-white tracking-tight font-display">
					Editar: {data.usuario.nome}
				</h1>
			</div>
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

	<form method="POST" action="?/salvar" use:enhance class="space-y-6">
		<input type="hidden" name="vinculosJson" value={vinculosJson} />

		<!-- 1. DADOS CADASTRAIS -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 border-b border-zinc-900 pb-3">
				<User class="w-4 h-4 text-indigo-400" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					1. Identificação Cadastral
				</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
				<div class="sm:col-span-2">
					<label for="nome" class="block font-mono text-zinc-400 mb-1">Nome Completo *</label>
					<input
						type="text"
						id="nome"
						name="nome"
						required
						value={data.usuario.nome}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div>
					<label for="tipoDocumento" class="block font-mono text-zinc-400 mb-1">Tipo de Documento *</label>
					<select
						id="tipoDocumento"
						name="tipoDocumento"
						bind:value={tipoDocumento}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
					>
						<option value="CPF">CPF (Nacional Brasileiro)</option>
						<option value="ESTRANGEIRO">Passaporte / Documento Estrangeiro</option>
					</select>
				</div>

				<div>
					<label for="cpf" class="block font-mono text-zinc-400 mb-1">
						{tipoDocumento === 'CPF' ? 'Número do CPF *' : 'Número do Documento / Passaporte *'}
					</label>
					<input
						type="text"
						id="cpf"
						name="cpf"
						required
						oninput={handleInputDoc}
						value={data.usuario.cpf}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
					/>
				</div>

				{#if tipoDocumento === 'ESTRANGEIRO'}
					<div>
						<label for="paisOrigem" class="block font-mono text-zinc-400 mb-1">País de Origem *</label>
						<input
							type="text"
							id="paisOrigem"
							name="paisOrigem"
							required
							value={data.usuario.pais_origem}
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
						/>
					</div>
				{/if}

				<div>
					<label for="dataNascimento" class="block font-mono text-zinc-400 mb-1">Data de Nascimento *</label>
					<input
						type="date"
						id="dataNascimento"
						name="dataNascimento"
						required
						value={data.usuario.data_nascimento}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div>
					<label for="genero" class="block font-mono text-zinc-400 mb-1">Gênero *</label>
					<select
						id="genero"
						name="genero"
						value={data.usuario.genero}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
					>
						<option value="M">Masculino</option>
						<option value="F">Feminino</option>
					</select>
				</div>
			</div>
		</div>

		<!-- 2. CONTATO E REDEFINIÇÃO DE SENHA -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 border-b border-zinc-900 pb-3">
				<KeyRound class="w-4 h-4 text-emerald-400" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					2. Contato & Redefinição de Senha
				</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
				<div>
					<label for="email" class="block font-mono text-zinc-400 mb-1">E-mail de Login *</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						value={data.usuario.email}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
					/>
				</div>

				<div>
					<label for="telefone" class="block font-mono text-zinc-400 mb-1">Telefone / WhatsApp</label>
					<input
						type="text"
						id="telefone"
						name="telefone"
						value={data.usuario.telefone || ''}
						placeholder="(11) 98765-4321"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
					/>
				</div>

				<div class="sm:col-span-2">
					<label for="novaSenha" class="block font-mono text-zinc-400 mb-1">
						Redefinir Senha (opcional)
					</label>
					<input
						type="password"
						id="novaSenha"
						name="novaSenha"
						bind:value={novaSenha}
						placeholder="Deixe em branco se não desejar alterar a senha atual"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
					/>
					<span class="text-[11px] text-zinc-500 mt-1 block">
						Ao preencher uma nova senha, ela será criptografada e substituirá o hash atual imediatamente.
					</span>
				</div>
			</div>
		</div>

		<!-- 3. STATUS GLOBAL & PRIVILÉGIOS SAAS -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 border-b border-zinc-900 pb-3">
				<ShieldCheck class="w-4 h-4 text-amber-400" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					3. Status Global & Privilégio de Super Admin
				</h2>
			</div>

			<!-- Toggle Super Admin -->
			<div class="p-4 rounded-xl border border-indigo-900/50 bg-indigo-950/20 flex items-start gap-3">
				<input
					type="checkbox"
					id="isSuperAdmin"
					name="isSuperAdmin"
					value="1"
					bind:checked={isSuperAdmin}
					disabled={data.usuario.id_usuario === data.idSuperAdminLogado}
					class="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
				/>
				<div>
					<label for="isSuperAdmin" class="text-xs font-bold text-indigo-300 font-display cursor-pointer">
						Privilégio de Super Admin do SaaS (Control Plane)
					</label>
					<p class="text-[11px] text-zinc-400 mt-0.5">
						{#if data.usuario.id_usuario === data.idSuperAdminLogado}
							(Você está editando sua própria conta; não é possível remover seu privilégio de Super Admin)
						{:else}
							Concede acesso total de operador ao painel SGT Manager.
						{/if}
					</p>
				</div>
			</div>

			<!-- Toggle Ativo / Bloqueado -->
			<div class="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
				<div class="flex items-start gap-3">
					<input
						type="checkbox"
						id="ativo"
						name="ativo"
						value="1"
						bind:checked={ativo}
						disabled={data.usuario.id_usuario === data.idSuperAdminLogado}
						class="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
					/>
					<div>
						<label for="ativo" class="text-xs font-bold text-white cursor-pointer flex items-center gap-2">
							<span>Acesso Ativo Globalmente</span>
							{#if !ativo}
								<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-800/60">
									Bloqueado
								</span>
							{/if}
						</label>
						<p class="text-[11px] text-zinc-400 mt-0.5">
							Se desmarcado, o usuário é suspenso em todas as academias e todas as suas sessões ativas são revogadas.
						</p>
					</div>
				</div>

				{#if !ativo}
					<div class="pt-2">
						<label for="motivoBloqueio" class="block font-mono text-zinc-400 text-xs mb-1">
							Motivo da Suspensão / Bloqueio
						</label>
						<input
							type="text"
							id="motivoBloqueio"
							name="motivoBloqueio"
							bind:value={motivoBloqueio}
							placeholder="Ex: Suspensão financeira, violação das diretrizes..."
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-red-500"
						/>
					</div>
				{/if}
			</div>
		</div>

		<!-- 4. VÍNCULOS COM ACADEMIAS E PAPÉIS -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between border-b border-zinc-900 pb-3">
				<div class="flex items-center gap-2">
					<Building2 class="w-4 h-4 text-amber-400" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						4. Filiais & Papéis Vinculados
					</h2>
				</div>
			</div>

			<!-- Adicionar novo vínculo -->
			<div class="flex flex-col sm:flex-row items-center gap-2 text-xs">
				<select
					bind:value={novaAcademiaParaAdicionar}
					class="w-full sm:flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
				>
					{#each data.academias as ac}
						<option value={ac.id_academia}>
							#{ac.id_academia} - {ac.nome_fantasia || ac.nome}
						</option>
					{/each}
				</select>
				<button
					type="button"
					onclick={adicionarVinculo}
					class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 font-semibold transition-colors cursor-pointer"
				>
					<Plus class="w-4 h-4" />
					<span>Vincular Academia</span>
				</button>
			</div>

			<!-- Lista de vínculos existentes -->
			<div class="space-y-3 pt-2">
				{#if vinculos.length === 0}
					<div class="p-6 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500 font-mono">
						Este usuário não possui nenhuma academia associada no momento.
					</div>
				{:else}
					{#each vinculos as v}
						<div class="p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 space-y-3 text-xs">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Building2 class="w-4 h-4 text-zinc-400" />
									<span class="font-bold text-white font-display">{v.nomeAcademia}</span>
									<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
										#{v.idAcademia}
									</span>
								</div>
								<button
									type="button"
									onclick={() => removerVinculo(v.idAcademia)}
									class="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
									title="Remover vínculo com esta academia"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>

							<!-- Perfis neste Dojo -->
							<div>
								<span class="text-[11px] font-mono text-zinc-400 block mb-1.5">
									Papéis atribuídos nesta filial:
								</span>
								<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
									{#each data.perfis as perfil}
										{@const checked = v.idsPerfis.includes(perfil.id_perfil)}
										<button
											type="button"
											onclick={() => alternarPerfilVinculo(v.idAcademia, perfil.id_perfil)}
											class="p-2 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer {checked ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
										>
											<span class="font-mono text-[11px] font-bold">{perfil.role}</span>
											<div class="w-3 h-3 rounded border flex items-center justify-center text-[9px] {checked ? 'border-amber-500 bg-amber-500 text-black' : 'border-zinc-700'}">
												{checked ? '✓' : ''}
											</div>
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- BOTÕES DE SUBMISSÃO -->
		<div class="flex items-center justify-end gap-3 pt-4">
			<a
				href="/saas-admin/usuarios"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800 transition-colors"
			>
				Voltar
			</a>
			<button
				type="submit"
				class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer"
			>
				<Save class="w-4 h-4" />
				<span>Salvar Alterações</span>
			</button>
		</div>
	</form>
</div>

