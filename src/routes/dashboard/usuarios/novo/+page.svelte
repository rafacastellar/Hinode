<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		UserPlus,
		ArrowLeft,
		ShieldCheck,
		Lock,
		Award,
		AlertCircle,
		Mail,
		User,
		Phone,
		Calendar,
		MapPin,
		Search,
		Loader2,
		HeartHandshake,
		Users,
		Plus,
		Trash2,
		CheckCircle2,
		Eye,
		EyeOff,
		Globe,
		Check,
		X
	} from '@lucide/svelte';
	import {
		validarCpfOficial,
		validarDocumentoEstrangeiro,
		formatarCpf,
		analisarForcaSenha
	} from '#lib/dominio/validacao';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let salvando = $state(false);

	let perfisSelecionados = $state<number[]>([]);
	let dataNasc = $state('');
	let generoSelecionado = $state<'M' | 'F'>('M');

	// Documento e Nacionalidade
	let tipoDocumento = $state<'CPF' | 'ESTRANGEIRO'>('CPF');
	let cpfValor = $state('');
	let paisOrigem = $state('Brasil');

	// Senha com Segurança e Força
	let senhaValor = $state('');
	let mostrarSenha = $state(false);
	const analiseSenha = $derived(analisarForcaSenha(senhaValor));

	const statusCpf = $derived.by(() => {
		if (tipoDocumento === 'CPF') {
			const digitos = cpfValor.replace(/\D/g, '');
			if (!digitos) return 'vazio';
			if (digitos.length < 11) return 'incompleto';
			return validarCpfOficial(digitos) ? 'valido' : 'invalido';
		} else {
			if (!cpfValor.trim()) return 'vazio';
			return validarDocumentoEstrangeiro(cpfValor) ? 'valido' : 'invalido';
		}
	});

	function tratarInputCpf(e: Event) {
		const target = e.target as HTMLInputElement;
		if (tipoDocumento === 'CPF') {
			cpfValor = formatarCpf(target.value);
		} else {
			cpfValor = target.value.toUpperCase();
		}
	}

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
		if (form?.valores?.idsPerfis) {
			perfisSelecionados = form.valores.idsPerfis;
		}
		if (form?.valores?.dataNascimento) {
			dataNasc = form.valores.dataNascimento;
		}
		if (form?.valores?.genero) {
			generoSelecionado = form.valores.genero;
		}
		if (form?.valores?.tipoDocumento) {
			tipoDocumento = form.valores.tipoDocumento as 'CPF' | 'ESTRANGEIRO';
		}
		if (form?.valores?.cpf) {
			cpfValor = form.valores.cpf;
		}
		if (form?.valores?.paisOrigem) {
			paisOrigem = form.valores.paisOrigem;
		}
		if (form?.valores?.cep) cep = form.valores.cep;
		if (form?.valores?.logradouro) logradouro = form.valores.logradouro;
		if (form?.valores?.numero) numero = form.valores.numero;
		if (form?.valores?.complemento) complemento = form.valores.complemento;
		if (form?.valores?.bairro) bairro = form.valores.bairro;
		if (form?.valores?.cidade) cidade = form.valores.cidade;
		if (form?.valores?.uf) uf = form.valores.uf;

		if (form?.valores?.responsaveisJson) {
			try {
				const parsed =
					typeof form.valores.responsaveisJson === 'string'
						? JSON.parse(form.valores.responsaveisJson)
						: form.valores.responsaveisJson;
				if (Array.isArray(parsed)) {
					responsaveisVinculados = parsed.map((item: any) => {
						const rObj = data.responsaveis.find(
							(r: any) => r.id_usuario === Number(item.idResponsavel)
						);
						return {
							idResponsavel: Number(item.idResponsavel),
							nome: rObj ? rObj.nome : `Responsável #${item.idResponsavel}`,
							cpf_mascarado: rObj?.cpf_mascarado,
							grauParentesco: item.grauParentesco || 'Responsável Legal',
							financeiro: Boolean(item.financeiro)
						};
					});
				}
			} catch {}
		} else if (form?.valores?.idResponsavel) {
			const rObj = data.responsaveis.find(
				(r: any) => r.id_usuario === Number(form.valores.idResponsavel)
			);
			if (rObj) {
				responsaveisVinculados = [
					{
						idResponsavel: rObj.id_usuario,
						nome: rObj.nome,
						cpf_mascarado: rObj.cpf_mascarado,
						grauParentesco: (form.valores.responsavelParentesco as string) || 'Responsável Legal',
						financeiro: Boolean(form.valores.responsavelFinanceiro)
					}
				];
			}
		}
	});

	// Calcula idade reativamente para feedback instantâneo
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

	// Identifica se o perfil Professor está selecionado
	let perfilProfessorId = $derived(
		data.perfis.find((p: any) => p.role.toLowerCase() === 'professor')?.id_perfil
	);

	let ehProfessorSelecionado = $derived(
		perfilProfessorId ? perfisSelecionados.includes(perfilProfessorId) : false
	);

	// Filtra responsáveis disponíveis que ainda não foram adicionados à lista
	const responsaveisDisponiveisParaAdicionar = $derived(
		data.responsaveis.filter(
			(r: any) => !responsaveisVinculados.some((item) => item.idResponsavel === r.id_usuario)
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
	<title>Novo Usuário do Sistema - Judô Hinodê</title>
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
					Controle de Acessos
				</span>
				<span class="text-zinc-600">•</span>
				<span class="text-xs font-mono text-zinc-400">Novo Registro</span>
			</div>
			<h1 class="text-2xl font-extrabold text-white tracking-tight font-display">
				Cadastrar Usuário & Atribuir Perfis
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
		<!-- 1. DADOS DE IDENTIFICAÇÃO E ACESSO -->
		<!-- ========================================================================= -->
		<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center gap-2 pb-3 border-b border-zinc-900">
				<User class="w-4 h-4 text-red-500" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					1. Identificação Pessoal & Acesso
				</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
						value={form?.valores?.nome || ''}
						placeholder="Ex: Carlos Eduardo Silva"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>

				<!-- E-mail Corporativo -->
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
							value={form?.valores?.email || ''}
							placeholder="operador@dojohinode.com.br"
							class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
						/>
					</div>
				</div>

				<!-- Seleção de Tipo de Documento -->
				<div class="md:col-span-2 space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-mono uppercase text-zinc-400 block">
							Documento de Identificação *
						</span>
						<span class="text-[10px] font-mono text-zinc-500">
							Suporte Nacional & Internacional
						</span>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<button
							type="button"
							onclick={() => { tipoDocumento = 'CPF'; paisOrigem = 'Brasil'; }}
							class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all {tipoDocumento === 'CPF' ? 'bg-red-950/40 border-red-700 text-white shadow-sm' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
						>
							<span>🇧🇷</span>
							<span>Brasileiro (CPF)</span>
						</button>
						<button
							type="button"
							onclick={() => { tipoDocumento = 'ESTRANGEIRO'; if (paisOrigem === 'Brasil') paisOrigem = ''; }}
							class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all {tipoDocumento === 'ESTRANGEIRO' ? 'bg-blue-950/40 border-blue-700 text-white shadow-sm' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
						>
							<Globe class="w-3.5 h-3.5 text-blue-400" />
							<span>Estrangeiro (Passaporte / RNM)</span>
						</button>
					</div>
					<input type="hidden" name="tipoDocumento" value={tipoDocumento} />
				</div>

				<!-- Campo do Documento -->
				<div class={tipoDocumento === 'ESTRANGEIRO' ? 'md:col-span-1' : 'md:col-span-2'}>
					<div class="flex items-center justify-between mb-1">
						<label for="cpf" class="text-[11px] font-mono uppercase text-zinc-400 block">
							{tipoDocumento === 'CPF' ? 'CPF do Titular *' : 'Nº do Passaporte / RNM / ID *'}
						</label>
						{#if statusCpf === 'valido'}
							<span class="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
								<Check class="w-3 h-3" />
								{tipoDocumento === 'CPF' ? 'CPF Oficial Válido' : 'Documento Válido'}
							</span>
						{:else if statusCpf === 'invalido'}
							<span class="text-[10px] font-mono text-red-400 font-bold flex items-center gap-1">
								<AlertCircle class="w-3 h-3" />
								{tipoDocumento === 'CPF' ? 'CPF Inválido (Dígitos Incorretos)' : 'Mínimo 3 caracteres'}
							</span>
						{:else if statusCpf === 'incompleto'}
							<span class="text-[10px] font-mono text-zinc-500">
								Digite os 11 dígitos
							</span>
						{/if}
					</div>
					<input
						type="text"
						id="cpf"
						name="cpf"
						required
						maxlength={tipoDocumento === 'CPF' ? 14 : 30}
						value={cpfValor}
						oninput={tratarInputCpf}
						placeholder={tipoDocumento === 'CPF' ? '000.000.000-00' : 'Ex: PA12345678 ou RNM'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border text-xs text-white font-mono focus:outline-none transition-colors {statusCpf === 'valido' ? 'border-emerald-600/70 focus:border-emerald-500' : statusCpf === 'invalido' ? 'border-red-600/70 focus:border-red-500' : 'border-zinc-800 focus:border-red-600'}"
					/>
				</div>

				<!-- País de Origem (Somente se Estrangeiro) -->
				{#if tipoDocumento === 'ESTRANGEIRO'}
					<div>
						<label for="paisOrigem" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
							País de Origem *
						</label>
						<input
							type="text"
							id="paisOrigem"
							name="paisOrigem"
							required
							bind:value={paisOrigem}
							placeholder="Ex: Japão, Estados Unidos, França..."
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-600 transition-colors"
						/>
					</div>
				{:else}
					<input type="hidden" name="paisOrigem" value="Brasil" />
				{/if}

				<!-- Senha de Acesso e Força -->
				<div class="md:col-span-2 space-y-2">
					<div class="flex items-center justify-between">
						<label for="senha" class="text-[11px] font-mono uppercase text-zinc-400 block">
							Senha de Acesso Inicial *
						</label>
						{#if analiseSenha.forca === 'forte'}
							<span class="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
								<ShieldCheck class="w-3 h-3" /> Senha Forte
							</span>
						{:else if analiseSenha.forca === 'boa'}
							<span class="text-[10px] font-mono text-blue-400 font-bold">
								Senha Boa
							</span>
						{:else if analiseSenha.forca === 'media'}
							<span class="text-[10px] font-mono text-amber-400 font-bold">
								Senha Média
							</span>
						{:else if senhaValor.length > 0}
							<span class="text-[10px] font-mono text-red-400 font-bold">
								Senha Fraca
							</span>
						{/if}
					</div>

					<div class="relative">
						<Lock class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type={mostrarSenha ? 'text' : 'password'}
							id="senha"
							name="senha"
							required
							minlength="8"
							bind:value={senhaValor}
							placeholder="Crie uma senha forte (mín. 8 caracteres)"
							class="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors font-mono"
						/>
						<button
							type="button"
							onclick={() => (mostrarSenha = !mostrarSenha)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
							title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
						>
							{#if mostrarSenha}
								<EyeOff class="w-4 h-4" />
							{:else}
								<Eye class="w-4 h-4" />
							{/if}
						</button>
					</div>

					<!-- Barra de Força da Senha -->
					{#if senhaValor.length > 0}
						<div class="space-y-1.5 pt-1">
							<div class="grid grid-cols-4 gap-1.5 h-1.5">
								<div class="rounded-full transition-all duration-300 {analiseSenha.pontuacao >= 1 ? (analiseSenha.forca === 'fraca' ? 'bg-red-500' : analiseSenha.forca === 'media' ? 'bg-amber-500' : analiseSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseSenha.pontuacao >= 2 ? (analiseSenha.forca === 'media' ? 'bg-amber-500' : analiseSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseSenha.pontuacao >= 3 ? (analiseSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseSenha.pontuacao >= 4 ? 'bg-emerald-500' : 'bg-zinc-800'}"></div>
							</div>

							<!-- Critérios de Segurança -->
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] font-mono">
								<span class="flex items-center gap-1 {analiseSenha.criterios.comprimentoMinimo ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
									{#if analiseSenha.criterios.comprimentoMinimo}
										<Check class="w-3 h-3 shrink-0" />
									{:else}
										<span class="w-3 h-3 text-center inline-block">•</span>
									{/if}
									8+ caracteres
								</span>
								<span class="flex items-center gap-1 {analiseSenha.criterios.maiuscula && analiseSenha.criterios.minuscula ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
									{#if analiseSenha.criterios.maiuscula && analiseSenha.criterios.minuscula}
										<Check class="w-3 h-3 shrink-0" />
									{:else}
										<span class="w-3 h-3 text-center inline-block">•</span>
									{/if}
									Maiúsculas & minúsculas
								</span>
								<span class="flex items-center gap-1 {analiseSenha.criterios.numero ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
									{#if analiseSenha.criterios.numero}
										<Check class="w-3 h-3 shrink-0" />
									{:else}
										<span class="w-3 h-3 text-center inline-block">•</span>
									{/if}
									Ao menos 1 número
								</span>
								<span class="flex items-center gap-1 {analiseSenha.criterios.especial ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}">
									{#if analiseSenha.criterios.especial}
										<Check class="w-3 h-3 shrink-0" />
									{:else}
										<span class="w-3 h-3 text-center inline-block">•</span>
									{/if}
									Símbolo (@$!%*?&#)
								</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Data de Nascimento -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="dataNascimento" class="text-[11px] font-mono uppercase text-zinc-400 block">
							Data de Nascimento *
						</label>
						{#if idadeCalculada !== null}
							<span class="text-[10px] font-mono text-emerald-400 font-bold">
								{idadeCalculada} anos {idadeCalculada >= 18 ? '(Maior de Idade)' : '(Menor de Idade)'}
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
							value={form?.valores?.telefone || ''}
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

				<!-- Logradouro (Rua / Av) -->
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
						3. Perfis Acumulativos no Dojo
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">
					Selecione todos que se aplicam
				</span>
			</div>

			<p class="text-xs text-zinc-400">
				O usuário receberá a <strong>união cumulativa</strong> de todas as permissões dos papéis selecionados abaixo.
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
							Preencha a data de nascimento no início do formulário para verificar a necessidade de responsável legal (exigência para menores de 18 anos).
						</p>
					</div>
				</div>
			</section>
		{/if}

		<!-- ========================================================================= -->
		<!-- 5. CAMPOS TÉCNICOS DE SENSEI (CONDICIONAL) -->
		<!-- ========================================================================= -->
		{#if ehProfessorSelecionado}
			<section class="p-6 rounded-2xl bg-amber-950/15 border border-amber-900/40 space-y-4 transition-all">
				<div class="flex items-center gap-2 pb-3 border-b border-amber-900/30">
					<Award class="w-4 h-4 text-amber-500" />
					<h2 class="text-sm font-bold text-amber-400 uppercase tracking-wider font-mono">
						5. Dados Técnicos de Sensei / Professor
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
							value={form?.valores?.nFederacao || ''}
							placeholder="Ex: FPJ-12345"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
						/>
					</div>

					<div>
						<label for="grauFaixa" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
							Graduação / Dan (Preta, Kodansha ou Vermelha)
						</label>
						<input
							type="text"
							id="grauFaixa"
							name="grauFaixa"
							value={form?.valores?.grauFaixa || ''}
							placeholder="Ex: 1º a 5º Dan (Preta), 6º a 8º Dan (Kodansha), 9º ou 10º Dan (Vermelha)"
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
					<span>Gravando...</span>
				{:else}
					<UserPlus class="w-4 h-4" />
					<span>Cadastrar Usuário</span>
				{/if}
			</button>
		</div>
	</form>
</div>
