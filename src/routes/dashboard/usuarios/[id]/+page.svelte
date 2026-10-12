<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Pencil,
		ArrowLeft,
		ShieldCheck,
		Award,
		AlertCircle,
		Mail,
		User,
		Phone,
		Calendar,
		Lock
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let salvando = $state(false);

	let perfisSelecionados = $state<number[]>([]);
	let dataNasc = $state('');

	$effect(() => {
		perfisSelecionados = [...data.usuario.ids_perfis];
		dataNasc = data.usuario.data_nascimento;
	});

	// Calcula idade reativamente
	let idadeCalculada = $derived.by(() => {
		if (!dataNasc || dataNasc.length < 10) return null;
		const nasc = new Date(dataNasc);
		if (isNaN(nasc.getTime())) return null;
		const hoje = new Date();
		let anos = hoje.getFullYear() - nasc.getFullYear();
		const m = hoje.getMonth() - nasc.getMonth();
		if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
			anos--;
		}
		return anos >= 0 ? anos : null;
	});

	// Perfil Professor
	let perfilProfessorId = $derived(
		data.perfis.find((p) => p.role.toLowerCase() === 'professor')?.id_perfil
	);

	let ehProfessorSelecionado = $derived(
		perfilProfessorId ? perfisSelecionados.includes(perfilProfessorId) : false
	);

	function alternarPerfil(id: number) {
		if (perfisSelecionados.includes(id)) {
			perfisSelecionados = perfisSelecionados.filter((p) => p !== id);
		} else {
			perfisSelecionados = [...perfisSelecionados, id];
		}
	}
</script>

<svelte:head>
	<title>Editar Usuário • {data.usuario.nome} - Judô Hinodê</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Topo de Navegação -->
	<div class="flex items-center gap-4">
		<a
			href="/dashboard/usuarios"
			class="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
			title="Voltar para a lista"
		>
			<ArrowLeft class="w-4 h-4" />
		</a>
		<div>
			<div class="flex items-center gap-2">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-semibold">
					Edição de Operador
				</span>
				<span class="text-zinc-600">•</span>
				<span class="text-xs font-mono text-zinc-400">ID #{data.usuario.id_usuario}</span>
			</div>
			<h1 class="text-2xl font-extrabold text-white tracking-tight font-display">
				{data.usuario.nome}
			</h1>
		</div>
	</div>

	<!-- Erro do Servidor -->
	{#if form?.erro}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-3">
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<p class="font-medium">{form.erro}</p>
		</div>
	{/if}

	<!-- Formulário -->
	<form
		method="POST"
		use:enhance={() => {
			salvando = true;
			return async ({ update }) => {
				await update();
				salvando = false;
			};
		}}
		class="space-y-6"
	>
		<!-- ========================================================================= -->
		<!-- 1. DADOS DE IDENTIFICAÇÃO E CONTATO -->
		<!-- ========================================================================= -->
		<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 pb-3 border-b border-zinc-900">
				<User class="w-4 h-4 text-red-500" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					1. Identificação Cadastral
				</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- CPF (Read-only) -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="cpf" class="text-[11px] font-mono uppercase text-zinc-400 block">
							CPF (Imutável / Chave Fiscal)
						</label>
						<span class="text-[10px] font-mono text-zinc-500">LGPD</span>
					</div>
					<input
						type="text"
						id="cpf"
						disabled
						value={data.usuario.cpf_mascarado}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60 text-xs text-zinc-400 font-mono cursor-not-allowed"
					/>
				</div>

				<!-- E-mail de Acesso -->
				<div>
					<label for="email" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						E-mail de Acesso *
					</label>
					<div class="relative">
						<Mail class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="email"
							id="email"
							name="email"
							required
							defaultValue={data.usuario.email}
							class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
						/>
					</div>
				</div>

				<!-- Nome Completo -->
				<div class="md:col-span-2">
					<label for="nome" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Nome Completo *
					</label>
					<input
						type="text"
						id="nome"
						name="nome"
						required
						minlength="3"
						defaultValue={data.usuario.nome}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>

				<!-- Data de Nascimento -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="dataNascimento" class="text-[11px] font-mono uppercase text-zinc-400 block">
							Data de Nascimento *
						</label>
						{#if idadeCalculada !== null}
							<span class="text-[10px] font-mono text-emerald-400 font-bold">
								{idadeCalculada} anos {idadeCalculada >= 18 ? '(Maior)' : '(Menor)'}
							</span>
						{/if}
					</div>
					<div class="relative">
						<Calendar class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="date"
							id="dataNascimento"
							name="dataNascimento"
							required
							bind:value={dataNasc}
							class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
						/>
					</div>
				</div>

				<!-- Telefone -->
				<div>
					<label for="telefone" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Telefone de Contato (Opcional)
					</label>
					<div class="relative">
						<Phone class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="tel"
							id="telefone"
							name="telefone"
							defaultValue={data.usuario.telefone || ''}
							placeholder="(11) 99999-9999"
							class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- 2. GESTÃO DE PERFIS ACUMULATIVOS (RBAC) -->
		<!-- ========================================================================= -->
		<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<ShieldCheck class="w-4 h-4 text-red-500" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						2. Perfis Acumulativos no Dojo
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">
					Selecione os papéis ativos
				</span>
			</div>

			<p class="text-xs text-zinc-400">
				Adicione ou remova papéis para este usuário nesta academia. O usuário usufrui da união das permissões.
			</p>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each data.perfis as perfil}
					{@const marcado = perfisSelecionados.includes(perfil.id_perfil)}
					<label
						class="p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none {marcado
							? 'bg-red-950/30 border-red-800 text-white shadow-[0_0_12px_rgba(220,38,38,0.15)]'
							: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'}"
					>
						<input
							type="checkbox"
							name="idsPerfis"
							value={perfil.id_perfil}
							checked={marcado}
							onchange={() => alternarPerfil(perfil.id_perfil)}
							class="mt-0.5 rounded border-zinc-700 text-red-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
						/>
						<div>
							<span class="text-xs font-bold block {marcado ? 'text-red-400' : 'text-zinc-200'}">
								{perfil.role}
							</span>
							<span class="text-[11px] text-zinc-500 block mt-0.5">
								{#if perfil.role === 'Admin'}
									Acesso total às configurações e equipe.
								{:else if perfil.role === 'Professor'}
									Tatame, faixas e turmas técnicas.
								{:else if perfil.role === 'Recepção'}
									Matrículas e inscrições de atletas.
								{:else if perfil.role === 'Aluno'}
									Visão de treinos e graduações próprias.
								{:else if perfil.role === 'Responsável'}
									Acompanhamento de dependentes menores.
								{/if}
							</span>
						</div>
					</label>
				{/each}
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- 3. CAMPOS TÉCNICOS DE SENSEI (CONDICIONAL) -->
		<!-- ========================================================================= -->
		{#if ehProfessorSelecionado}
			<section class="p-6 rounded-2xl bg-amber-950/15 border border-amber-900/40 space-y-4 transition-all">
				<div class="flex items-center gap-2 pb-3 border-b border-amber-900/30">
					<Award class="w-4 h-4 text-amber-500" />
					<h2 class="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
						3. Dados Técnicos de Sensei / Professor
					</h2>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="nFederacao" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
							Número da Federação (FPJ / CBJ)
						</label>
						<input
							type="text"
							id="nFederacao"
							name="nFederacao"
							defaultValue={data.usuario.dados_professor?.n_federacao || ''}
							placeholder="Ex: FPJ-12345"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
						/>
					</div>

					<div>
						<label for="grauFaixa" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
							Grau / Dan de Faixa Preta
						</label>
						<input
							type="text"
							id="grauFaixa"
							name="grauFaixa"
							defaultValue={data.usuario.dados_professor?.grau_faixa || ''}
							placeholder="Ex: 1º Dan (Shodan), 2º Dan (Nidan)"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
						/>
					</div>
				</div>
			</section>
		{/if}

		<!-- Botões de Ação -->
		<div class="flex items-center justify-end gap-3 pt-4">
			<a
				href="/dashboard/usuarios"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
			>
				Cancelar
			</a>
			<button
				type="submit"
				disabled={salvando || perfisSelecionados.length === 0}
				class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
			>
				{#if salvando}
					<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					<span>Atualizando...</span>
				{:else}
					<Pencil class="w-4 h-4" />
					<span>Salvar Alterações</span>
				{/if}
			</button>
		</div>
	</form>
</div>
