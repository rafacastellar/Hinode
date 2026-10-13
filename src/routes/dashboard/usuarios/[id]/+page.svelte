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
		Lock,
		MapPin,
		Search,
		Loader2,
		HeartHandshake,
		Users,
		Plus,
		Trash2,
		CheckCircle2
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let salvando = $state(false);

	let perfisSelecionados = $state<number[]>([]);
	let dataNasc = $state('');
	let generoSelecionado = $state<'M' | 'F'>('M');

	// Endereço Completo
	let cep = $state('');
	let logradouro = $state('');
	let numero = $state('');
	let complemento = $state('');
	let bairro = $state('');
	let cidade = $state('');
	let uf = $state('');
	let buscandoCep = $state(false);
	let cepMensagem = $state('');

	// Responsáveis Legais (Múltiplos Vínculos para Menor)
	interface ItemResponsavelVinculado {
		idResponsavel: number;
		nome: string;
		cpf_mascarado?: string;
		grauParentesco: string;
		financeiro: boolean;
	}

	let responsaveisVinculados = $state<ItemResponsavelVinculado[]>([]);
	let idResponsavelParaAdicionar = $state<number | ''>('');
	let novoParentesco = $state('Mãe');
	let novoFinanceiro = $state(false);

	$effect(() => {
		perfisSelecionados = [...data.usuario.ids_perfis];
		dataNasc = data.usuario.data_nascimento;
		generoSelecionado = data.usuario.genero;

		if (data.usuario.endereco) {
			cep = data.usuario.endereco.cep || '';
			logradouro = data.usuario.endereco.logradouro || '';
			numero = data.usuario.endereco.numero || '';
			complemento = data.usuario.endereco.complemento || '';
			bairro = data.usuario.endereco.bairro || '';
			cidade = data.usuario.endereco.cidade || '';
			uf = data.usuario.endereco.uf || '';
		}

		if (data.usuario.responsaveis_legais && data.usuario.responsaveis_legais.length > 0) {
			responsaveisVinculados = data.usuario.responsaveis_legais.map((r) => ({
				idResponsavel: r.id_responsavel,
				nome: r.nome,
				cpf_mascarado: r.cpf_mascarado,
				grauParentesco: r.grau_parentesco || 'Responsável Legal',
				financeiro: r.financeiro
			}));
		} else if (data.usuario.responsavel_legal) {
			responsaveisVinculados = [
				{
					idResponsavel: data.usuario.responsavel_legal.id_responsavel,
					nome: data.usuario.responsavel_legal.nome,
					cpf_mascarado: data.usuario.responsavel_legal.cpf_mascarado,
					grauParentesco: data.usuario.responsavel_legal.grau_parentesco || 'Responsável Legal',
					financeiro: data.usuario.responsavel_legal.financeiro
				}
			];
		}
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

	const ehMenor = $derived(idadeCalculada !== null && idadeCalculada < 18);

	// Se usuário for maior de idade, limpa automaticamente a lista de responsáveis
	$effect(() => {
		if (idadeCalculada !== null && idadeCalculada >= 18 && responsaveisVinculados.length > 0) {
			responsaveisVinculados = [];
		}
	});

	// Perfil Professor
	let perfilProfessorId = $derived(
		data.perfis.find((p: any) => p.role.toLowerCase() === 'professor')?.id_perfil
	);

	let ehProfessorSelecionado = $derived(
		perfilProfessorId ? perfisSelecionados.includes(perfilProfessorId) : false
	);

	// Filtra responsáveis disponíveis que não sejam o próprio usuário e que não estejam já vinculados
	const responsaveisDisponiveisParaAdicionar = $derived(
		data.responsaveis.filter(
			(r: any) =>
				r.id_usuario !== data.usuario.id_usuario &&
				!responsaveisVinculados.some((item) => item.idResponsavel === r.id_usuario)
		)
	);

	function adicionarResponsavel() {
		if (!idResponsavelParaAdicionar) return;
		const rObj = data.responsaveis.find(
			(r: any) => r.id_usuario === Number(idResponsavelParaAdicionar)
		);
		if (!rObj) return;

		if (responsaveisVinculados.some((item) => item.idResponsavel === rObj.id_usuario)) return;

		responsaveisVinculados = [
			...responsaveisVinculados,
			{
				idResponsavel: rObj.id_usuario,
				nome: rObj.nome,
				cpf_mascarado: rObj.cpf_mascarado,
				grauParentesco: novoParentesco,
				financeiro: novoFinanceiro
			}
		];

		idResponsavelParaAdicionar = '';
		novoParentesco = 'Pai';
		novoFinanceiro = false;
	}

	function removerResponsavel(id: number) {
		responsaveisVinculados = responsaveisVinculados.filter((r) => r.idResponsavel !== id);
	}

	function alternarFinanceiroResponsavel(id: number) {
		responsaveisVinculados = responsaveisVinculados.map((r) =>
			r.idResponsavel === id ? { ...r, financeiro: !r.financeiro } : r
		);
	}

	function alternarPerfil(id: number) {
		if (perfisSelecionados.includes(id)) {
			perfisSelecionados = perfisSelecionados.filter((p) => p !== id);
		} else {
			perfisSelecionados = [...perfisSelecionados, id];
		}
	}

	async function consultarCep() {
		const cepLimpo = cep.replace(/\D/g, '');
		if (cepLimpo.length !== 8) {
			cepMensagem = 'Informe um CEP válido com 8 dígitos';
			return;
		}
		buscandoCep = true;
		cepMensagem = '';
		try {
			const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
			const dados = await res.json();
			if (dados.erro) {
				cepMensagem = 'CEP não encontrado';
			} else {
				logradouro = dados.logradouro || '';
				bairro = dados.bairro || '';
				cidade = dados.localidade || '';
				uf = dados.uf || '';
			}
		} catch {
			cepMensagem = 'Falha ao buscar CEP. Preencha manualmente.';
		} finally {
			buscandoCep = false;
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

				<!-- Gênero -->
				<div>
					<span class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Gênero *
					</span>
					<div class="grid grid-cols-2 gap-2">
						<label class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-colors {generoSelecionado === 'M' ? 'bg-red-950/30 border-red-800 text-white font-semibold' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'}">
							<input type="radio" name="genero" value="M" bind:group={generoSelecionado} class="sr-only" />
							<span class="text-xs">Masculino</span>
						</label>
						<label class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-colors {generoSelecionado === 'F' ? 'bg-red-950/30 border-red-800 text-white font-semibold' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'}">
							<input type="radio" name="genero" value="F" bind:group={generoSelecionado} class="sr-only" />
							<span class="text-xs">Feminino</span>
						</label>
					</div>
				</div>

				<!-- Telefone -->
				<div class="md:col-span-2">
					<label for="telefone" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Telefone de Contato
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
		<!-- 2. ENDEREÇO COMPLETO DO USUÁRIO -->
		<!-- ========================================================================= -->
		<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<MapPin class="w-4 h-4 text-red-500" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						2. Endereço Completo & Residência
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">
					Tabela Endereco_Usuario
				</span>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- CEP com busca rápida -->
				<div>
					<label for="cep" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						CEP (8 dígitos)
					</label>
					<div class="flex items-center gap-2">
						<input
							type="text"
							id="cep"
							name="cep"
							maxlength="9"
							bind:value={cep}
							placeholder="00000-000"
							onblur={consultarCep}
							class="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-red-600 transition-colors"
						/>
						<button
							type="button"
							onclick={consultarCep}
							disabled={buscandoCep || cep.replace(/\D/g, '').length !== 8}
							class="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-colors disabled:opacity-40"
							title="Consultar endereço via CEP"
						>
							{#if buscandoCep}
								<Loader2 class="w-4 h-4 animate-spin" />
							{:else}
								<Search class="w-4 h-4" />
							{/if}
						</button>
					</div>
					{#if cepMensagem}
						<span class="text-[10px] text-amber-400 mt-1 block font-mono">{cepMensagem}</span>
					{/if}
				</div>

				<!-- Logradouro -->
				<div class="md:col-span-2">
					<label for="logradouro" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Logradouro (Rua, Avenida, Alameda)
					</label>
					<input
						type="text"
						id="logradouro"
						name="logradouro"
						bind:value={logradouro}
						placeholder="Ex: Rua das Flores"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>

				<!-- Número -->
				<div>
					<label for="numero" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Número
					</label>
					<input
						type="text"
						id="numero"
						name="numero"
						bind:value={numero}
						placeholder="Ex: 123"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>

				<!-- Complemento -->
				<div>
					<label for="complemento" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Complemento
					</label>
					<input
						type="text"
						id="complemento"
						name="complemento"
						bind:value={complemento}
						placeholder="Ex: Apto 42, Bloco B"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>

				<!-- Bairro -->
				<div>
					<label for="bairro" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Bairro
					</label>
					<input
						type="text"
						id="bairro"
						name="bairro"
						bind:value={bairro}
						placeholder="Ex: Centro"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>

				<!-- Cidade -->
				<div class="md:col-span-2">
					<label for="cidade" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						Cidade
					</label>
					<input
						type="text"
						id="cidade"
						name="cidade"
						bind:value={cidade}
						placeholder="Ex: São Paulo"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>

				<!-- UF -->
				<div>
					<label for="uf" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
						UF (Estado)
					</label>
					<input
						type="text"
						id="uf"
						name="uf"
						maxlength="2"
						bind:value={uf}
						placeholder="SP"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white uppercase font-mono focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- 3. GESTÃO DE PERFIS ACUMULATIVOS (RBAC) -->
		<!-- ========================================================================= -->
		<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<ShieldCheck class="w-4 h-4 text-red-500" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						3. Papéis de Acesso no Dojo
					</h2>
				</div>
			</div>

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
									Acesso irrestrito a configurações e operadores.
								{:else if perfil.role === 'Professor'}
									Tatame, faixas e turmas técnicas.
								{:else if perfil.role === 'Recepção'}
									Matrículas e inscrições de atletas.
								{:else if perfil.role === 'Aluno'}
									Perfil habilitado para judoca / atleta.
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
		<!-- 4. VÍNCULO DE RESPONSÁVEIS LEGAIS (EXCLUSIVO PARA MENORES DE 18 ANOS) -->
		<!-- ========================================================================= -->
		{#if idadeCalculada !== null && idadeCalculada >= 18}
			<section class="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-900 space-y-2 opacity-80">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
						<Lock class="w-4 h-4 text-zinc-400" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="text-sm font-bold text-zinc-300 uppercase tracking-wider font-mono">
								4. Responsável Legal
							</h2>
							<span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold">
								Desabilitado ({idadeCalculada} anos)
							</span>
						</div>
						<p class="text-xs text-zinc-500 mt-0.5">
							Usuário maior de 18 anos. O vínculo de responsáveis é aplicável exclusivamente a dependentes e atletas menores de idade.
						</p>
					</div>
				</div>
			</section>
		{:else if ehMenor}
			<section class="p-6 rounded-2xl bg-amber-950/20 border-2 border-amber-800/80 shadow-[0_0_25px_rgba(217,119,6,0.08)] space-y-5">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-900/40 gap-2">
					<div class="flex items-center gap-2.5">
						<HeartHandshake class="w-4 h-4 text-amber-400" />
						<h2 class="text-sm font-bold text-amber-300 uppercase tracking-wider font-mono">
							4. Responsáveis Legais pelo Menor
						</h2>
					</div>
					<span class="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-950/80 border border-amber-700 text-amber-300 w-fit">
						Exigência Legal • Menor ({idadeCalculada} anos)
					</span>
				</div>

				<p class="text-xs text-zinc-300">
					Vincule um ou mais responsáveis legais (ex: Pai e Mãe) cadastrados no dojo. Menores de 18 anos exigem obrigatoriamente ao menos 1 responsável.
				</p>

				<!-- Widget de Inclusão de Responsável -->
				<div class="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-4">
					<div class="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
						Adicionar Responsável à Lista
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
						<div class="sm:col-span-5">
							<label for="idResponsavelSelect" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
								Selecione o Responsável
							</label>
							<select
								id="idResponsavelSelect"
								bind:value={idResponsavelParaAdicionar}
								class="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
							>
								<option value="">Selecione o responsável cadastrado...</option>
								{#each responsaveisDisponiveisParaAdicionar as r}
									<option value={r.id_usuario}>
										{r.nome} (CPF: {r.cpf_mascarado}){r.total_menores > 0 ? ` • ${r.total_menores} menor(es)` : ''}
									</option>
								{/each}
							</select>
						</div>

						<div class="sm:col-span-3">
							<label for="novoParentesco" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
								Parentesco
							</label>
							<select
								id="novoParentesco"
								bind:value={novoParentesco}
								class="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
							>
								<option value="Mãe">Mãe</option>
								<option value="Pai">Pai</option>
								<option value="Avô / Avó">Avô / Avó</option>
								<option value="Tio / Tia">Tio / Tia</option>
								<option value="Tutor Legal">Tutor Legal</option>
								<option value="Outro">Outro</option>
							</select>
						</div>

						<div class="sm:col-span-2 flex items-center h-9">
							<label class="flex items-center gap-2 cursor-pointer select-none">
								<input
									type="checkbox"
									bind:checked={novoFinanceiro}
									class="rounded border-zinc-700 text-amber-500 focus:ring-0 bg-zinc-900"
								/>
								<span class="text-xs text-zinc-300">Financeiro</span>
							</label>
						</div>

						<div class="sm:col-span-2">
							<button
								type="button"
								onclick={adicionarResponsavel}
								disabled={!idResponsavelParaAdicionar}
								class="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
							>
								<Plus class="w-3.5 h-3.5" />
								<span>Vincular</span>
							</button>
						</div>
					</div>
				</div>

				<!-- Lista de Responsáveis Vinculados -->
				<div class="space-y-2">
					<div class="text-[11px] font-mono uppercase text-zinc-400 font-semibold flex items-center justify-between">
						<span>Responsáveis Vinculados ao Menor ({responsaveisVinculados.length})</span>
						{#if responsaveisVinculados.length === 0}
							<span class="text-red-400 text-[10px]">* Pelo menos 1 obrigatório</span>
						{/if}
					</div>

					{#if responsaveisVinculados.length > 0}
						<div class="grid grid-cols-1 gap-2">
							{#each responsaveisVinculados as resp (resp.idResponsavel)}
								<div class="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3">
									<div class="flex items-center gap-3">
										<div class="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
											<HeartHandshake class="w-4 h-4 text-amber-400" />
										</div>
										<div>
											<div class="flex items-center gap-2 flex-wrap">
												<span class="text-xs font-bold text-white">{resp.nome}</span>
												{#if resp.cpf_mascarado}
													<span class="text-[10px] font-mono text-zinc-500">CPF: {resp.cpf_mascarado}</span>
												{/if}
												<span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
													{resp.grauParentesco}
												</span>
												{#if resp.financeiro}
													<span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-800 text-emerald-400">
														Financeiro
													</span>
												{/if}
											</div>
										</div>
									</div>

									<div class="flex items-center gap-2 shrink-0">
										<button
											type="button"
											onclick={() => alternarFinanceiroResponsavel(resp.idResponsavel)}
											class="text-[10px] px-2 py-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
											title="Alternar se é o responsável financeiro"
										>
											{resp.financeiro ? 'Desmarcar Financeiro' : 'Tornar Financeiro'}
										</button>
										<button
											type="button"
											onclick={() => removerResponsavel(resp.idResponsavel)}
											class="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
											title="Remover este responsável"
										>
											<Trash2 class="w-4 h-4" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="p-4 rounded-xl bg-amber-950/30 border border-dashed border-amber-900/60 text-center">
							<p class="text-xs text-amber-300 font-medium">
								Nenhum responsável vinculado ainda. Selecione e clique em "+ Vincular" acima para adicionar.
							</p>
						</div>
					{/if}
				</div>

				<!-- Campo oculto para transmissão atômica de múltiplos responsáveis -->
				<input type="hidden" name="responsaveisJson" value={JSON.stringify(responsaveisVinculados)} />
				{#if responsaveisVinculados.length > 0}
					<input type="hidden" name="idResponsavel" value={responsaveisVinculados[0].idResponsavel} />
					<input type="hidden" name="responsavelParentesco" value={responsaveisVinculados[0].grauParentesco} />
					<input type="hidden" name="responsavelFinanceiro" value={responsaveisVinculados[0].financeiro ? 'on' : ''} />
				{/if}
			</section>
		{:else}
			<section class="p-5 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-900 space-y-2">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
						<Calendar class="w-4 h-4 text-zinc-500" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">
							4. Vínculo de Responsável Legal
						</h2>
						<p class="text-xs text-zinc-500 mt-0.5">
							Preencha a data de nascimento para verificar a necessidade de responsável legal (exigência para menores de 18 anos).
						</p>
					</div>
				</div>
			</section>
		{/if}

		<!-- ========================================================================= -->
		<!-- 5. DEPENDENTES VINCULADOS (SE O USUÁRIO FOR RESPONSÁVEL) -->
		<!-- ========================================================================= -->
		{#if data.usuario.dependentes && data.usuario.dependentes.length > 0}
			<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
				<div class="flex items-center gap-2 pb-2 border-b border-zinc-900">
					<Users class="w-4 h-4 text-emerald-500" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						Dependentes / Menores Vinculados ({data.usuario.dependentes.length})
					</h2>
				</div>
				<p class="text-xs text-zinc-400">
					Este usuário atua formalmente como Responsável Legal dos seguintes judocas:
				</p>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
					{#each data.usuario.dependentes as dep}
						<div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
							<span class="text-xs font-semibold text-white">{dep.nome}</span>
							<a
								href="/dashboard/alunos/{dep.id_aluno}"
								class="text-[11px] text-red-400 hover:text-red-300 font-mono transition-colors"
							>
								Ver Judoca →
							</a>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- ========================================================================= -->
		<!-- 6. CAMPOS TÉCNICOS DE PROFESSOR (CONDICIONAL) -->
		<!-- ========================================================================= -->
		{#if ehProfessorSelecionado}
			<section class="p-6 rounded-2xl bg-amber-950/15 border border-amber-900/40 space-y-4 transition-all">
				<div class="flex items-center gap-2 pb-3 border-b border-amber-900/30">
					<Award class="w-4 h-4 text-amber-500" />
					<h2 class="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
						6. Dados Técnicos de Sensei / Professor
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
							placeholder="Ex: 1º Dan (Shodan)"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
						/>
					</div>
				</div>
			</section>
		{/if}

		<!-- Ações -->
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
