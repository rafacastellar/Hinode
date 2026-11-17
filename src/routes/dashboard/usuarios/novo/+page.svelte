<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		OPCOES_FAIXAS_CADASTRO,
		LISTA_TODAS_FAIXAS_VALORES
	} from '#lib/dominio/graduacao';
	import {
		UserPlus,
		ArrowLeft,
		ArrowRight,
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
		Plus,
		Trash2,
		Eye,
		EyeOff,
		Globe,
		Check,
		Sparkles,
		Copy,
		RefreshCw
	} from '@lucide/svelte';
	import {
		validarCpfOficial,
		validarDocumentoEstrangeiro,
		formatarCpf,
		analisarForcaSenha
	} from '#lib/dominio/validacao';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let salvando = $state(false);
	let abaAtiva = $state<'identificacao' | 'endereco' | 'perfis' | 'responsaveis'>('identificacao');

	const abasCadastro = [
		{ chave: 'identificacao', rotulo: '1. Identificação & Contato', icone: User },
		{ chave: 'endereco', rotulo: '2. Endereço', icone: MapPin },
		{ chave: 'perfis', rotulo: '3. Perfis & Dados Técnicos', icone: ShieldCheck },
		{ chave: 'responsaveis', rotulo: '4. Responsáveis / Dependentes', icone: HeartHandshake }
	] as const;

	let perfisSelecionados = $state<number[]>([]);
	let nomeValor = $state('');
	let emailValor = $state('');
	let telefoneValor = $state('');
	let dataNasc = $state('');
	let generoSelecionado = $state<'M' | 'F'>('M');
	let grauFaixaSelecionado = $state('Preta 1º Dan');
	let nFederacaoValor = $state('');

	// Documento e Nacionalidade
	let tipoDocumento = $state<'CPF' | 'ESTRANGEIRO'>('CPF');
	let cpfValor = $state('');
	let paisOrigem = $state('Brasil');

	// Senha com Segurança, Confirmação e Sugestão Automática
	let senhaValor = $state('');
	let confirmacaoSenhaValor = $state('');
	let mostrarSenha = $state(false);
	let copiadoFeedback = $state(false);
	const analiseSenha = $derived(analisarForcaSenha(senhaValor));
	const senhasConferem = $derived(
		senhaValor.length >= 8 && confirmacaoSenhaValor.length > 0 && senhaValor === confirmacaoSenhaValor
	);

	function sugerirSenhaPadraoDojo() {
		const digitosCpf = cpfValor.replace(/\D/g, '');
		const prefixoDoc =
			digitosCpf.length >= 4
				? digitosCpf.slice(0, 4)
				: String(Math.floor(1000 + Math.random() * 9000));
		const sufixoAno = dataNasc && dataNasc.length >= 4 ? dataNasc.slice(2, 4) : '26';
		const sugerida = `Hinode@${prefixoDoc}${sufixoAno}`;
		senhaValor = sugerida;
		confirmacaoSenhaValor = sugerida;
		mostrarSenha = true;
	}

	function sortearSenhaForte() {
		const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
		const num = Math.floor(1000 + Math.random() * 9000);
		const l1 = letras.charAt(Math.floor(Math.random() * letras.length));
		const l2 = letras.charAt(Math.floor(Math.random() * letras.length)).toLowerCase();
		const sugerida = `Hinode#${num}${l1}${l2}`;
		senhaValor = sugerida;
		confirmacaoSenhaValor = sugerida;
		mostrarSenha = true;
	}

	async function copiarCredenciaisWhatsApp() {
		if (!senhaValor) {
			sugerirSenhaPadraoDojo();
		}
		const texto = `🥋 *Acesso ao Sistema — Judô Hinodê*\n👤 *Usuário:* ${nomeValor.trim() || 'Novo Membro'}\n📧 *Login (E-mail):* ${emailValor.trim() || '(informe o e-mail)'}\n🔑 *Senha Inicial:* ${senhaValor}`;
		try {
			await navigator.clipboard.writeText(texto);
			copiadoFeedback = true;
			setTimeout(() => (copiadoFeedback = false), 2500);
		} catch {}
	}

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
		if (form?.valores?.nome) nomeValor = form.valores.nome;
		if (form?.valores?.email) emailValor = form.valores.email;
		if (form?.valores?.telefone) telefoneValor = form.valores.telefone;
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
		if (form?.valores?.grauFaixa) {
			grauFaixaSelecionado = form.valores.grauFaixa;
		}
		if (form?.valores?.nFederacao) {
			nFederacaoValor = form.valores.nFederacao;
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

	let perfilProfessorId = $derived(
		data.perfis.find((p: any) => p.role.toLowerCase() === 'professor')?.id_perfil
	);
	let perfilAlunoId = $derived(
		data.perfis.find((p: any) => p.role.toLowerCase() === 'aluno')?.id_perfil
	);

	let ehProfessorSelecionado = $derived(
		perfilProfessorId ? perfisSelecionados.includes(perfilProfessorId) : false
	);
	let ehAlunoSelecionado = $derived(
		perfilAlunoId ? perfisSelecionados.includes(perfilAlunoId) : false
	);

	// Quando o usuário seleciona apenas Aluno (e não Professor), ajusta o default da faixa para Branca se ainda estava em Preta 1º Dan
	$effect(() => {
		if (ehAlunoSelecionado && !ehProfessorSelecionado && grauFaixaSelecionado === 'Preta 1º Dan') {
			grauFaixaSelecionado = 'Branca';
		} else if (ehProfessorSelecionado && grauFaixaSelecionado === 'Branca') {
			grauFaixaSelecionado = 'Preta 1º Dan';
		}
	});

	const responsaveisDisponiveisParaAdicionar = $derived(
		data.responsaveis.filter(
			(r: any) => !responsaveisVinculados.some((item) => item.idResponsavel === r.id_usuario)
		)
	);

	// =========================================================================
	// CÁLCULO DE PROGRESSO / COMPLETUDE DO PERFIL (%)
	// =========================================================================
	const statusAbas = $derived.by(() => {
		const idOk =
			nomeValor.trim().length >= 3 &&
			emailValor.includes('@') &&
			statusCpf === 'valido' &&
			dataNasc.length === 10 &&
			senhasConferem;

		const endOk =
			cep.replace(/\D/g, '').length === 8 &&
			logradouro.trim().length > 0 &&
			cidade.trim().length > 0 &&
			uf.trim().length === 2;

		const perfisOk = perfisSelecionados.length > 0;
		const respOk = ehMenor ? responsaveisVinculados.length > 0 : dataNasc.length === 10;

		return {
			identificacao: idOk,
			endereco: endOk,
			perfis: perfisOk,
			responsaveis: respOk
		};
	});

	const percentualPreenchimento = $derived.by(() => {
		let pontos = 0;
		const total = 10;
		if (nomeValor.trim().length >= 3) pontos += 1.5;
		if (emailValor.includes('@')) pontos += 1.5;
		if (statusCpf === 'valido') pontos += 1.5;
		if (dataNasc.length === 10) pontos += 1;
		if (telefoneValor.replace(/\D/g, '').length >= 8) pontos += 0.5;
		if (senhasConferem) pontos += 1;
		if (
			cep.replace(/\D/g, '').length === 8 &&
			logradouro.trim().length > 0 &&
			cidade.trim().length > 0 &&
			uf.trim().length === 2
		) {
			pontos += 1.5;
		} else if (logradouro.trim().length > 0 || cidade.trim().length > 0) {
			pontos += 0.75;
		}
		if (perfisSelecionados.length > 0) pontos += 1;
		if (ehMenor ? responsaveisVinculados.length > 0 : dataNasc.length === 10) pontos += 0.5;

		return Math.min(100, Math.round((pontos / total) * 100));
	});

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
	<div class="flex items-center justify-between gap-4 pb-4 border-b border-zinc-900">
		<div class="flex items-center gap-4">
			<a
				href="/dashboard/usuarios"
				class="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
				title="Voltar para Gestão de Usuários"
			>
				<ArrowLeft class="w-4 h-4" />
			</a>
			<div>
				<div class="flex items-center gap-2">
					<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-semibold">
						Equipe & Usuários
					</span>
					<span class="text-zinc-600">•</span>
					<span class="text-xs font-mono text-zinc-400">Cadastro Estruturado em Abas</span>
				</div>
				<h1 class="text-2xl font-extrabold text-white tracking-tight font-display">
					Cadastrar Usuário & Atribuir Perfis
				</h1>
			</div>
		</div>
	</div>

	<!-- Erro do Servidor -->
	{#if form?.erro}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-3">
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<p class="font-medium">{form.erro}</p>
		</div>
	{/if}

	<!-- Barra de Progresso de Preenchimento do Perfil -->
	<div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2.5">
		<div class="flex items-center justify-between gap-2 text-xs">
			<div class="flex items-center gap-2">
				<span class="font-mono uppercase tracking-wider text-[10px] text-zinc-400 font-bold">
					Completude do Perfil Cadastral
				</span>
				{#if percentualPreenchimento === 100}
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold">
						Completo ✓
					</span>
				{/if}
			</div>
			<span class="font-mono font-bold text-sm {percentualPreenchimento === 100 ? 'text-emerald-400' : 'text-red-400'}">
				{percentualPreenchimento}%
			</span>
		</div>
		<div class="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
			<div
				class="h-full rounded-full transition-all duration-300 {percentualPreenchimento === 100
					? 'bg-emerald-500'
					: percentualPreenchimento >= 60
						? 'bg-amber-500'
						: 'bg-red-600'}"
				style="width: {Math.max(4, percentualPreenchimento)}%"
			></div>
		</div>
	</div>

	<!-- Barra de Abas Passo a Passo -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-900">
		{#each abasCadastro as tab}
			{@const Icone = tab.icone}
			{@const ativa = abaAtiva === tab.chave}
			{@const concluida = statusAbas[tab.chave]}
			<button
				type="button"
				onclick={() => (abaAtiva = tab.chave)}
				class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer {ativa
					? 'bg-red-950/50 border border-red-800/80 text-white font-semibold shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'}"
			>
				<Icone class="w-3.5 h-3.5 shrink-0 {ativa ? 'text-red-400' : concluida ? 'text-emerald-400' : 'text-zinc-500'}" />
				<span class="truncate">{tab.rotulo}</span>
				{#if concluida}
					<Check class="w-3.5 h-3.5 ml-auto text-emerald-400 shrink-0" />
				{:else if tab.chave === 'perfis' && perfisSelecionados.length > 0}
					<span class="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-red-600 text-white font-bold">
						{perfisSelecionados.length}
					</span>
				{:else if tab.chave === 'responsaveis' && ehMenor}
					<span
						class="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-950 border border-amber-700 text-amber-300"
					>
						!
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Formulário Único (todas as abas permanecem no DOM via class:hidden para envio atômico) -->
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
		<!-- ABA 1: IDENTIFICAÇÃO & CONTATO                                            -->
		<!-- ========================================================================= -->
		<section
			class:hidden={abaAtiva !== 'identificacao'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4 animate-in fade-in duration-150"
		>
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<User class="w-4 h-4 text-red-500" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						1. Identificação Pessoal & Credencial de Acesso
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">Etapa 1 de 4</span>
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
						bind:value={nomeValor}
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
							bind:value={emailValor}
							placeholder="operador@dojohinode.com.br"
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
							bind:value={telefoneValor}
							placeholder="(11) 99999-9999"
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
							onclick={() => {
								tipoDocumento = 'CPF';
								paisOrigem = 'Brasil';
							}}
							class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all {tipoDocumento ===
							'CPF'
								? 'bg-red-950/40 border-red-700 text-white shadow-sm'
								: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
						>
							<span>🇧🇷</span>
							<span>Brasileiro (CPF)</span>
						</button>
						<button
							type="button"
							onclick={() => {
								tipoDocumento = 'ESTRANGEIRO';
								if (paisOrigem === 'Brasil') paisOrigem = '';
							}}
							class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all {tipoDocumento ===
							'ESTRANGEIRO'
								? 'bg-blue-950/40 border-blue-700 text-white shadow-sm'
								: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
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
								{tipoDocumento === 'CPF'
									? 'CPF Inválido (Dígitos Incorretos)'
									: 'Mínimo 3 caracteres'}
							</span>
						{:else if statusCpf === 'incompleto'}
							<span class="text-[10px] font-mono text-zinc-500">Digite os 11 dígitos</span>
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
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border text-xs text-white font-mono focus:outline-none transition-colors {statusCpf ===
						'valido'
							? 'border-emerald-600/70 focus:border-emerald-500'
							: statusCpf === 'invalido'
								? 'border-red-600/70 focus:border-red-500'
								: 'border-zinc-800 focus:border-red-600'}"
					/>
				</div>

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
						<label
							class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-colors {generoSelecionado ===
							'M'
								? 'bg-red-950/30 border-red-800 text-white font-semibold'
								: 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
						>
							<input
								type="radio"
								name="genero"
								value="M"
								bind:group={generoSelecionado}
								class="sr-only"
							/>
							<span class="text-xs">Masculino</span>
						</label>
						<label
							class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-colors {generoSelecionado ===
							'F'
								? 'bg-red-950/30 border-red-800 text-white font-semibold'
								: 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
						>
							<input
								type="radio"
								name="genero"
								value="F"
								bind:group={generoSelecionado}
								class="sr-only"
							/>
							<span class="text-xs">Feminino</span>
						</label>
					</div>
				</div>

				<!-- Senha de Acesso, Sugestão Automática e Confirmação -->
				<div class="md:col-span-2 p-4 rounded-2xl bg-zinc-900/35 border border-zinc-800/80 space-y-3.5">
					<div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/70">
						<div>
							<span class="text-xs font-bold text-white block">
								Credencial de Senha Inicial & Sugestão Automática
							</span>
							<span class="text-[11px] text-zinc-500">
								Gere uma senha padronizada com 1 clique ou digite manualmente nos dois campos
							</span>
						</div>

						<div class="flex items-center gap-2 flex-wrap">
							<button
								type="button"
								onclick={sugerirSenhaPadraoDojo}
								class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/70 text-[11px] font-mono font-semibold text-amber-300 transition-colors cursor-pointer"
								title="Gera Hinode@ + 4 primeiros dígitos do CPF + 2 dígitos do ano de nascimento"
							>
								<Sparkles class="w-3.5 h-3.5 text-amber-400" />
								<span>Padrão CPF (Hinode@CPF)</span>
							</button>
							<button
								type="button"
								onclick={sortearSenhaForte}
								class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer"
								title="Sorteia uma senha forte aleatória"
							>
								<RefreshCw class="w-3 h-3" />
								<span>Sortear Senha</span>
							</button>
							<button
								type="button"
								onclick={copiarCredenciaisWhatsApp}
								class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/70 text-[11px] font-mono font-semibold text-emerald-300 transition-colors cursor-pointer"
								title="Copia o cartão de acesso pronto para enviar no WhatsApp do usuário"
							>
								{#if copiadoFeedback}
									<Check class="w-3.5 h-3.5 text-emerald-400" />
									<span>Copiado p/ WhatsApp!</span>
								{:else}
									<Copy class="w-3.5 h-3.5 text-emerald-400" />
									<span>Copiar Acesso p/ WhatsApp</span>
								{/if}
							</button>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
						<div>
							<div class="flex items-center justify-between mb-1">
								<label for="senha" class="text-[11px] font-mono uppercase text-zinc-400 block">
									Senha de Acesso Inicial *
								</label>
								{#if analiseSenha.forca === 'forte'}
									<span class="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
										<ShieldCheck class="w-3 h-3" /> Senha Forte
									</span>
								{:else if analiseSenha.forca === 'boa'}
									<span class="text-[10px] font-mono text-blue-400 font-bold">Senha Boa</span>
								{:else if analiseSenha.forca === 'media'}
									<span class="text-[10px] font-mono text-amber-400 font-bold">Senha Média</span>
								{:else if senhaValor.length > 0}
									<span class="text-[10px] font-mono text-red-400 font-bold">Senha Fraca</span>
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
									class="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors font-mono"
								/>
								<button
									type="button"
									onclick={() => (mostrarSenha = !mostrarSenha)}
									class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
								>
									{#if mostrarSenha}
										<EyeOff class="w-4 h-4" />
									{:else}
										<Eye class="w-4 h-4" />
									{/if}
								</button>
							</div>
						</div>

						<div>
							<div class="flex items-center justify-between mb-1">
								<label for="confirmacaoSenha" class="text-[11px] font-mono uppercase text-zinc-400 block">
									Confirmar Senha Inicial *
								</label>
								{#if confirmacaoSenhaValor.length > 0}
									{#if senhasConferem}
										<span class="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
											<Check class="w-3 h-3" /> Senhas conferem
										</span>
									{:else}
										<span class="text-[10px] font-mono text-red-400 font-bold">
											Não conferem
										</span>
									{/if}
								{/if}
							</div>

							<div class="relative">
								<Lock class="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
								<input
									type={mostrarSenha ? 'text' : 'password'}
									id="confirmacaoSenha"
									name="confirmacaoSenha"
									required
									minlength="8"
									bind:value={confirmacaoSenhaValor}
									placeholder="Repita a senha inicial"
									class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900/90 border {confirmacaoSenhaValor.length > 0
										? senhasConferem
											? 'border-emerald-600/80'
											: 'border-red-600/80'
										: 'border-zinc-800'} text-xs text-white focus:outline-none focus:border-red-600 transition-colors font-mono"
								/>
							</div>
						</div>
					</div>

					{#if senhaValor.length > 0}
						<div class="space-y-1.5 pt-1">
							<div class="grid grid-cols-4 gap-1.5 h-1.5">
								<div class="rounded-full transition-all duration-300 {analiseSenha.pontuacao >= 1 ? (analiseSenha.forca === 'fraca' ? 'bg-red-500' : analiseSenha.forca === 'media' ? 'bg-amber-500' : analiseSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseSenha.pontuacao >= 2 ? (analiseSenha.forca === 'media' ? 'bg-amber-500' : analiseSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseSenha.pontuacao >= 3 ? (analiseSenha.forca === 'boa' ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}"></div>
								<div class="rounded-full transition-all duration-300 {analiseSenha.pontuacao >= 4 ? 'bg-emerald-500' : 'bg-zinc-800'}"></div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="pt-4 border-t border-zinc-900 flex justify-end">
				<button
					type="button"
					onclick={() => (abaAtiva = 'endereco')}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white transition-colors cursor-pointer"
				>
					<span>Próxima Aba: Endereço</span>
					<ArrowRight class="w-3.5 h-3.5" />
				</button>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- ABA 2: ENDEREÇO COMPLETO DO USUÁRIO                                       -->
		<!-- ========================================================================= -->
		<section
			class:hidden={abaAtiva !== 'endereco'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4 animate-in fade-in duration-150"
		>
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<MapPin class="w-4 h-4 text-red-500" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						2. Endereço Completo & Residência
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">Etapa 2 de 4</span>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
							class="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
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

			<div class="pt-4 border-t border-zinc-900 flex items-center justify-between">
				<button
					type="button"
					onclick={() => (abaAtiva = 'identificacao')}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
				>
					<ArrowLeft class="w-3.5 h-3.5" />
					<span>Anterior</span>
				</button>
				<button
					type="button"
					onclick={() => (abaAtiva = 'perfis')}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white transition-colors cursor-pointer"
				>
					<span>Próxima Aba: Perfis & Dados Técnicos</span>
					<ArrowRight class="w-3.5 h-3.5" />
				</button>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- ABA 3: PERFIS ACUMULATIVOS & DADOS TÉCNICOS UNIFICADOS (PROFESSOR/ALUNO)  -->
		<!-- ========================================================================= -->
		<section
			class:hidden={abaAtiva !== 'perfis'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6 animate-in fade-in duration-150"
		>
			<div class="space-y-4">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2">
						<ShieldCheck class="w-4 h-4 text-red-500" />
						<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
							3. Perfis Acumulativos no Dojo
						</h2>
					</div>
					<span class="text-[10px] font-mono text-zinc-500">Etapa 3 de 4</span>
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
			</div>

			<!-- Bloco Unificado de Graduação & Federação (Ativo quando Professor ou Aluno está marcado) -->
			<div
				class:hidden={!ehProfessorSelecionado && !ehAlunoSelecionado}
				class="p-5 rounded-2xl bg-amber-950/15 border border-amber-900/40 space-y-4"
			>
				<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-900/30">
					<div class="flex items-center gap-2">
						<Award class="w-4 h-4 text-amber-500" />
						<h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
							Credenciais Técnicas Sincronizadas (Graduação & Código FPJ/CBJ)
						</h3>
					</div>
					<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 border border-amber-800/60 text-amber-300">
						Sincronia Automática Professor ↔ Aluno ↔ Histórico
					</span>
				</div>

				<p class="text-xs text-zinc-300">
					A faixa e o código federativo informados abaixo são sincronizados automaticamente entre a ficha de <strong>Sensei / Professor</strong>, a ficha técnica de <strong>Judoca (Aluno)</strong> e a linha do tempo de <strong>Histórico de Graduações</strong>.
				</p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
					<div class="space-y-2">
						<label for="grauFaixa" class="text-[11px] font-mono uppercase text-zinc-400 block">
							Graduação Atual (Faixa & Dan)
						</label>
						<select
							id="grauFaixa"
							name="grauFaixa"
							bind:value={grauFaixaSelecionado}
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
						>
							{#each OPCOES_FAIXAS_CADASTRO as opt}
								<option value={opt.valor}>{opt.rotulo}</option>
							{/each}
							{#if grauFaixaSelecionado && !LISTA_TODAS_FAIXAS_VALORES.includes(grauFaixaSelecionado)}
								<option value={grauFaixaSelecionado}>{grauFaixaSelecionado}</option>
							{/if}
						</select>
						<div class="pt-1">
							<BadgeFaixa faixa={grauFaixaSelecionado} size="md" showLegend={true} />
						</div>
					</div>

					<div>
						<label for="nFederacao" class="text-[11px] font-mono uppercase text-zinc-400 block mb-2">
							Código / Registro na Federação (FPJ / CBJ)
						</label>
						<input
							type="text"
							id="nFederacao"
							name="nFederacao"
							bind:value={nFederacaoValor}
							placeholder="Ex: FPJ-12345"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
						/>
						<p class="text-[11px] text-zinc-500 mt-1.5">
							Utilizado tanto nas homologações de exames como Sensei quanto nas inscrições oficiais.
						</p>
					</div>
				</div>
			</div>

			<div class="pt-4 border-t border-zinc-900 flex items-center justify-between">
				<button
					type="button"
					onclick={() => (abaAtiva = 'endereco')}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
				>
					<ArrowLeft class="w-3.5 h-3.5" />
					<span>Anterior</span>
				</button>
				<button
					type="button"
					onclick={() => (abaAtiva = 'responsaveis')}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-white transition-colors cursor-pointer"
				>
					<span>Próxima Aba: Responsáveis Legais</span>
					<ArrowRight class="w-3.5 h-3.5" />
				</button>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- ABA 4: VÍNCULO DE RESPONSÁVEIS LEGAIS                                     -->
		<!-- ========================================================================= -->
		<section
			class:hidden={abaAtiva !== 'responsaveis'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 animate-in fade-in duration-150"
		>
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<HeartHandshake class="w-4 h-4 text-amber-400" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						4. Vínculo de Responsáveis Legais
					</h2>
				</div>
				<span class="text-[10px] font-mono text-zinc-500">Etapa 4 de 4</span>
			</div>

			{#if idadeCalculada !== null && idadeCalculada >= 18}
				<div class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center gap-3">
					<div class="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
						<Lock class="w-4 h-4" />
					</div>
					<div>
						<span class="text-xs font-bold text-zinc-200 block">
							Usuário Maior de 18 Anos ({idadeCalculada} anos)
						</span>
						<p class="text-xs text-zinc-500 mt-0.5">
							O vínculo de responsável legal aplica-se exclusivamente a menores de 18 anos. Você já pode concluir o cadastro abaixo.
						</p>
					</div>
				</div>
			{:else if ehMenor}
				<div class="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/70 space-y-4">
					<div class="flex items-center justify-between gap-2 flex-wrap">
						<span class="text-xs font-bold text-amber-300">
							Exigência Legal para Menor de Idade ({idadeCalculada} anos)
						</span>
						<span class="text-[10px] font-mono text-amber-400">
							Vincule ao menos 1 responsável cadastrado
						</span>
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
										{r.nome} (CPF: {r.cpf_mascarado})
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
								class="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer"
							>
								<Plus class="w-3.5 h-3.5" />
								<span>Vincular</span>
							</button>
						</div>
					</div>

					{#if responsaveisVinculados.length > 0}
						<div class="grid grid-cols-1 gap-2 pt-2">
							{#each responsaveisVinculados as resp (resp.idResponsavel)}
								<div class="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3">
									<div class="flex items-center gap-2 flex-wrap">
										<span class="text-xs font-bold text-white">{resp.nome}</span>
										{#if resp.cpf_mascarado}
											<span class="text-[10px] font-mono text-zinc-500">CPF: {resp.cpf_mascarado}</span>
										{/if}
										<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
											{resp.grauParentesco}
										</span>
										{#if resp.financeiro}
											<span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-800 text-emerald-400">
												Financeiro
											</span>
										{/if}
									</div>

									<div class="flex items-center gap-2 shrink-0">
										<button
											type="button"
											onclick={() => alternarFinanceiroResponsavel(resp.idResponsavel)}
											class="text-[10px] px-2 py-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
										>
											{resp.financeiro ? 'Desmarcar Financeiro' : 'Tornar Financeiro'}
										</button>
										<button
											type="button"
											onclick={() => removerResponsavel(resp.idResponsavel)}
											class="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
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
								Nenhum responsável vinculado ainda. Selecione acima e clique em "Vincular".
							</p>
						</div>
					{/if}
				</div>
			{:else}
				<div class="p-5 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-xs text-zinc-400">
					Informe a <strong>Data de Nascimento</strong> na Aba 1 para verificar se o usuário é menor de 18 anos.
				</div>
			{/if}

			<input type="hidden" name="responsaveisJson" value={JSON.stringify(responsaveisVinculados)} />
			{#if responsaveisVinculados.length > 0}
				<input type="hidden" name="idResponsavel" value={responsaveisVinculados[0].idResponsavel} />
				<input type="hidden" name="responsavelParentesco" value={responsaveisVinculados[0].grauParentesco} />
				<input type="hidden" name="responsavelFinanceiro" value={responsaveisVinculados[0].financeiro ? 'on' : ''} />
			{/if}

			<div class="pt-4 border-t border-zinc-900 flex items-center justify-between">
				<button
					type="button"
					onclick={() => (abaAtiva = 'perfis')}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
				>
					<ArrowLeft class="w-3.5 h-3.5" />
					<span>Anterior</span>
				</button>
			</div>
		</section>

		<!-- ========================================================================= -->
		<!-- BARRA FIXA DE CONCLUSÃO DO CADASTRO                                       -->
		<!-- ========================================================================= -->
		<div class="flex items-center justify-between gap-3 pt-4 border-t border-zinc-900">
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
