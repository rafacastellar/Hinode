<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		ArrowLeft,
		ShieldCheck,
		Building2,
		AlertCircle,
		CheckCircle2,
		UserPlus,
		Eye,
		EyeOff,
		KeyRound,
		User
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let tipoDocumento = $state<'CPF' | 'ESTRANGEIRO'>('CPF');
	let isSuperAdmin = $state(false);
	let vincularDojo = $state(true);
	let idAcademiaSelecionada = $state<number | null>(null);
	let idsPerfisSelecionados = $state<number[]>([]);

	$effect(() => {
		if (data.academias && data.academias.length > 0 && idAcademiaSelecionada === null) {
			idAcademiaSelecionada = data.academias[0].id_academia;
		}
	});

	// Máscara simples para CPF
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

	function alternarPerfil(id: number) {
		if (idsPerfisSelecionados.includes(id)) {
			idsPerfisSelecionados = idsPerfisSelecionados.filter((p) => p !== id);
		} else {
			idsPerfisSelecionados = [...idsPerfisSelecionados, id];
		}
	}
</script>

<svelte:head>
	<title>SGT Manager • Novo Usuário na Plataforma</title>
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
				<div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] font-mono mb-1">
					<UserPlus class="w-3.5 h-3.5" />
					<span>Backoffice Global SaaS</span>
				</div>
				<h1 class="text-xl font-extrabold text-white tracking-tight font-display">
					Cadastrar Novo Usuário
				</h1>
			</div>
		</div>
	</div>

	{#if form?.erro}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
			<span>{form.erro}</span>
		</div>
	{/if}

	<form method="POST" action="?/criar" use:enhance class="space-y-6">
		<!-- 1. IDENTIFICAÇÃO E DOCUMENTO -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 border-b border-zinc-900 pb-3">
				<User class="w-4 h-4 text-amber-400" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					1. Identificação Básica
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
						placeholder="Ex: João da Silva"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
					/>
				</div>

				<div>
					<label for="tipoDocumento" class="block font-mono text-zinc-400 mb-1">Tipo de Documento *</label>
					<select
						id="tipoDocumento"
						name="tipoDocumento"
						bind:value={tipoDocumento}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
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
						placeholder={tipoDocumento === 'CPF' ? '000.000.000-00' : 'Passaporte internacional'}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-mono"
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
							placeholder="Ex: Japão, Portugal, etc."
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
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
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
					/>
				</div>

				<div>
					<label for="genero" class="block font-mono text-zinc-400 mb-1">Gênero *</label>
					<select
						id="genero"
						name="genero"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
					>
						<option value="M">Masculino</option>
						<option value="F">Feminino</option>
					</select>
				</div>
			</div>
		</div>

		<!-- 2. CONTATO E CREDENCIAIS DE ACESSO -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 border-b border-zinc-900 pb-3">
				<KeyRound class="w-4 h-4 text-emerald-400" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					2. Contato & Credenciais de Acesso
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
						placeholder="usuario@dominio.com"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
					/>
				</div>

				<div>
					<label for="telefone" class="block font-mono text-zinc-400 mb-1">Telefone / WhatsApp</label>
					<input
						type="text"
						id="telefone"
						name="telefone"
						placeholder="(11) 98765-4321"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
					/>
				</div>

				<div class="sm:col-span-2">
					<label for="senha" class="block font-mono text-zinc-400 mb-1">Senha Provisória * (Mín. 8 caracteres)</label>
					<input
						type="password"
						id="senha"
						name="senha"
						required
						minlength="8"
						placeholder="Senha segura com letras, números e símbolos"
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
					/>
				</div>
			</div>
		</div>

		<!-- 3. PRIVILÉGIOS DE SUPER ADMIN (SAAS CONTROL PLANE) -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 border-b border-zinc-900 pb-3">
				<ShieldCheck class="w-4 h-4 text-indigo-400" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					3. Privilégios Globais da Plataforma
				</h2>
			</div>

			<div class="p-4 rounded-xl border border-indigo-900/50 bg-indigo-950/20 flex items-start gap-3">
				<input
					type="checkbox"
					id="isSuperAdmin"
					name="isSuperAdmin"
					value="1"
					bind:checked={isSuperAdmin}
					class="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
				/>
				<div>
					<label for="isSuperAdmin" class="text-xs font-bold text-indigo-300 font-display cursor-pointer">
						Privilégio de Super Administrador do SaaS (SGT Manager)
					</label>
					<p class="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
						Concede acesso ao painel <code>/saas-admin</code> com poder para suspender academias, gerenciar operadores, encerrar sessões ativas globalmente e visualizar telemetria.
					</p>
				</div>
			</div>
		</div>

		<!-- 4. VÍNCULO OPCIONAL COM UMA ACADEMIA INICIAL -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between border-b border-zinc-900 pb-3">
				<div class="flex items-center gap-2">
					<Building2 class="w-4 h-4 text-amber-400" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						4. Vínculo Inicial com Academia (Opcional)
					</h2>
				</div>

				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={vincularDojo}
						class="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400"
					/>
					<span class="text-xs text-zinc-300 font-mono">Vincular a um Dojo agora</span>
				</label>
			</div>

			{#if vincularDojo}
				{#if data.academias.length === 0}
					<div class="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400 text-center font-mono">
						Nenhuma academia cadastrada no sistema para vinculação.
					</div>
				{:else}
					<div class="space-y-4 text-xs">
						<div>
							<label for="idAcademia" class="block font-mono text-zinc-400 mb-1">
								Selecione a Academia (Tenant)
							</label>
							<select
								id="idAcademia"
								name="idAcademia"
								bind:value={idAcademiaSelecionada}
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
							>
								{#each data.academias as ac}
									<option value={ac.id_academia}>
										#{ac.id_academia} - {ac.nome_fantasia || ac.nome} (CNPJ: {ac.cnpj})
									</option>
								{/each}
							</select>
						</div>

						<div>
							<span class="block font-mono text-zinc-400 mb-2">
								Papéis / Perfis no Dojo
							</span>
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
								{#each data.perfis as perfil}
									{@const checked = idsPerfisSelecionados.includes(perfil.id_perfil)}
									<button
										type="button"
										onclick={() => alternarPerfil(perfil.id_perfil)}
										class="p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer {checked ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
									>
										<span class="font-mono text-[11px] font-bold">{perfil.role}</span>
										<div class="w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] {checked ? 'border-amber-500 bg-amber-500 text-black' : 'border-zinc-700'}">
											{checked ? '✓' : ''}
										</div>
									</button>
								{/each}
							</div>
							<input
								type="hidden"
								name="idsPerfisJson"
								value={JSON.stringify(idsPerfisSelecionados)}
							/>
							<span class="text-[11px] text-zinc-500 mt-1.5 block">
								Pode acumular papéis (Ex: Professor + Admin). Se nenhum for marcado, o padrão será Aluno.
							</span>
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- BOTÕES DE SUBMISSÃO -->
		<div class="flex items-center justify-end gap-3 pt-4">
			<a
				href="/saas-admin/usuarios"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800 transition-colors"
			>
				Cancelar
			</a>
			<button
				type="submit"
				class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer"
			>
				<UserPlus class="w-4 h-4" />
				<span>Cadastrar Usuário</span>
			</button>
		</div>
	</form>
</div>
