<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		OPCOES_FAIXAS_CADASTRO,
		LISTA_TODAS_FAIXAS_VALORES,
		normalizarFaixaParaCadastro
	} from '#lib/dominio/graduacao';
	import { analisarForcaSenha } from '#lib/dominio/validacao';
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
		CheckCircle2,
		KeyRound,
		Ban,
		UserX,
		Eye,
		EyeOff,
		Check,
		Sparkles,
		Copy,
		RefreshCw
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let salvando = $state(false);
	let abaAtiva = $state<'identificacao' | 'endereco' | 'perfis' | 'responsaveis' | 'seguranca'>(
		'identificacao'
	);

	const abasEdicao = [
		{ chave: 'identificacao', rotulo: '1. Identificação & Contato', icone: User },
		{ chave: 'endereco', rotulo: '2. Endereço', icone: MapPin },
		{ chave: 'perfis', rotulo: '3. Perfis & Dados Técnicos', icone: ShieldCheck },
		{ chave: 'responsaveis', rotulo: '4. Responsáveis / Dependentes', icone: HeartHandshake },
		{ chave: 'seguranca', rotulo: '5. Segurança & Governança', icone: KeyRound }
	] as const;

	let perfisSelecionados = $state<number[]>([]);
	let nomeValor = $state('');
	let emailValor = $state('');
	let telefoneValor = $state('');
	let dataNasc = $state('');
	let generoSelecionado = $state<'M' | 'F'>('M');
	let grauFaixaSelecionado = $state('Branca');
	let nFederacaoValor = $state('');

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

	// Segurança & Governança (Aba 5)
	let novaSenhaValor = $state('');
	let confirmacaoSenhaValor = $state('');
	let mostrarNovaSenha = $state(false);
	let copiadoFeedback = $state(false);
	let motivoBloqueioValor = $state('');
	let confirmarDesvinculacao = $state(false);

	const analiseNovaSenha = $derived(analisarForcaSenha(novaSenhaValor));
	const senhasConferem = $derived(
		novaSenhaValor.length >= 8 &&
			confirmacaoSenhaValor.length > 0 &&
			novaSenhaValor === confirmacaoSenhaValor
	);

	function sugerirSenhaPadraoDojo() {
		const digitosCpf = (data.usuario.cpf || '').replace(/\D/g, '');
		const prefixoDoc =
			digitosCpf.length >= 4
				? digitosCpf.slice(0, 4)
				: String(Math.floor(1000 + Math.random() * 9000));
		const sufixoAno = dataNasc && dataNasc.length >= 4 ? dataNasc.slice(2, 4) : '26';
		const sugerida = `Hinode@${prefixoDoc}${sufixoAno}`;
		novaSenhaValor = sugerida;
		confirmacaoSenhaValor = sugerida;
		mostrarNovaSenha = true;
	}

	function sortearSenhaForte() {
		const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
		const num = Math.floor(1000 + Math.random() * 9000);
		const l1 = letras.charAt(Math.floor(Math.random() * letras.length));
		const l2 = letras.charAt(Math.floor(Math.random() * letras.length)).toLowerCase();
		const sugerida = `Hinode#${num}${l1}${l2}`;
		novaSenhaValor = sugerida;
		confirmacaoSenhaValor = sugerida;
		mostrarNovaSenha = true;
	}

	async function copiarCredenciaisWhatsApp() {
		if (!novaSenhaValor) {
			sugerirSenhaPadraoDojo();
		}
		const texto = `🥋 *Acesso ao Sistema — Judô Hinodê*\n👤 *Usuário:* ${nomeValor.trim() || data.usuario.nome}\n📧 *Login (E-mail):* ${emailValor.trim() || data.usuario.email}\n🔑 *Nova Senha:* ${novaSenhaValor}`;
		try {
			await navigator.clipboard.writeText(texto);
			copiadoFeedback = true;
			setTimeout(() => (copiadoFeedback = false), 2500);
		} catch {}
	}

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
		nomeValor = data.usuario.nome || '';
		emailValor = data.usuario.email || '';
		telefoneValor = data.usuario.telefone || '';
		dataNasc = data.usuario.data_nascimento;
		generoSelecionado = data.usuario.genero;

		const faixaBase =
			data.usuario.dados_professor?.grau_faixa ||
			data.usuario.dados_aluno?.graduacao_atual ||
			'Branca';
		grauFaixaSelecionado = normalizarFaixaParaCadastro(faixaBase) || faixaBase;

		nFederacaoValor =
			data.usuario.dados_professor?.n_federacao ||
			data.usuario.dados_aluno?.n_federacao ||
			'';

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
		} else {
			responsaveisVinculados = [];
		}

		motivoBloqueioValor =
			data.usuario.motivo_bloqueio_dojo ||
			'Acesso temporariamente suspenso pela administração do dojo';
	});

	$effect(() => {
		if ((form as any)?.abaRetorno === 'seguranca') {
			abaAtiva = 'seguranca';
			if ((form as any)?.sucesso) {
				novaSenhaValor = '';
				confirmacaoSenhaValor = '';
			}
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

	$effect(() => {
		if (idadeCalculada !== null && idadeCalculada >= 18 && responsaveisVinculados.length > 0) {
			responsaveisVinculados = [];
		}
	});

	let perfilProfessorId = $derived(
		data.perfis.find((p: any) => p.role.toLowerCase() === 'professor')?.id_perfil
	);
	let ehProfessorSelecionado = $derived(
		perfilProfessorId ? perfisSelecionados.includes(perfilProfessorId) : false
	);

	let perfilAlunoId = $derived(
		data.perfis.find((p: any) => p.role.toLowerCase() === 'aluno')?.id_perfil
	);
	let ehAlunoSelecionado = $derived(
		perfilAlunoId ? perfisSelecionados.includes(perfilAlunoId) : false
	);

	const responsaveisDisponiveisParaAdicionar = $derived(
		data.responsaveis.filter(
			(r: any) =>
				r.id_usuario !== data.usuario.id_usuario &&
				!responsaveisVinculados.some((item) => item.idResponsavel === r.id_usuario)
		)
	);

	// =========================================================================
	// CÁLCULO DE PROGRESSO / COMPLETUDE DO PERFIL (%)
	// =========================================================================
	const statusAbas = $derived.by(() => {
		const idOk =
			nomeValor.trim().length >= 3 &&
			emailValor.includes('@') &&
			dataNasc.length === 10 &&
			telefoneValor.replace(/\D/g, '').length >= 8;

		const endOk =
			cep.replace(/\D/g, '').length === 8 &&
			logradouro.trim().length > 0 &&
			cidade.trim().length > 0 &&
			uf.trim().length === 2;

		const perfisOk = perfisSelecionados.length > 0;
		const respOk = ehMenor ? responsaveisVinculados.length > 0 : true;

		return {
			identificacao: idOk,
			endereco: endOk,
			perfis: perfisOk,
			responsaveis: respOk,
			seguranca: data.usuario.ativo_no_dojo
		};
	});

	const percentualPreenchimento = $derived.by(() => {
		let pontos = 0;
		const total = 10;
		if (nomeValor.trim().length >= 3) pontos += 1.5;
		if (emailValor.includes('@')) pontos += 1.5;
		if (data.usuario.cpf) pontos += 1.5;
		if (dataNasc.length === 10) pontos += 1;
		if (telefoneValor.replace(/\D/g, '').length >= 8) pontos += 1;
		if (
			cep.replace(/\D/g, '').length === 8 &&
			logradouro.trim().length > 0 &&
			cidade.trim().length > 0 &&
			uf.trim().length === 2
		) {
			pontos += 2;
		} else if (logradouro.trim().length > 0 || cidade.trim().length > 0) {
			pontos += 1;
		}
		if (perfisSelecionados.length > 0) pontos += 1;
		if (ehMenor ? responsaveisVinculados.length > 0 : true) pontos += 0.5;

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
	<title>Gerenciar Usuário • {data.usuario.nome} - Judô Hinodê</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
	<!-- Topo de Navegação -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
		<div class="flex items-center gap-4">
			<a
				href="/dashboard/usuarios"
				class="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
				title="Voltar para Gestão de Usuários"
			>
				<ArrowLeft class="w-4 h-4" />
			</a>
			<div>
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-semibold">
						Ficha & Governança do Usuário
					</span>
					<span class="text-zinc-600">•</span>
					<span class="text-xs font-mono text-zinc-400">ID #{data.usuario.id_usuario}</span>
					{#if data.usuario.ativo_no_dojo}
						<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 border border-emerald-800 text-emerald-300">
							Ativo no Dojo
						</span>
					{:else}
						<span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-950/60 border border-red-800 text-red-300">
							Bloqueado no Dojo
						</span>
					{/if}
				</div>
				<h1 class="text-2xl font-extrabold text-white tracking-tight font-display mt-0.5">
					{data.usuario.nome}
				</h1>
			</div>
		</div>

		{#if grauFaixaSelecionado && (ehProfessorSelecionado || ehAlunoSelecionado || data.usuario.dados_aluno)}
			<div class="flex items-center gap-2">
				<BadgeFaixa faixa={grauFaixaSelecionado} size="md" />
			</div>
		{/if}
	</div>

	<!-- Alertas de Retorno -->
	{#if (form as any)?.sucesso && (form as any)?.mensagem}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<p class="font-medium">{(form as any).mensagem}</p>
		</div>
	{/if}

	{#if form?.erro}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-3 animate-in fade-in">
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

	<!-- Barra de Subdivisão em 5 Abas -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-900">
		{#each abasEdicao as tab}
			{@const Icone = tab.icone}
			{@const ativa = abaAtiva === tab.chave}
			{@const ehSeguranca = tab.chave === 'seguranca'}
			{@const concluida = statusAbas[tab.chave]}
			<button
				type="button"
				onclick={() => (abaAtiva = tab.chave)}
				class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer {ativa
					? ehSeguranca
						? 'bg-amber-950/50 border border-amber-800/80 text-amber-200 font-semibold shadow-sm'
						: 'bg-red-950/50 border border-red-800/80 text-white font-semibold shadow-sm'
					: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'}"
			>
				<Icone
					class="w-3.5 h-3.5 shrink-0 {ativa
						? ehSeguranca
							? 'text-amber-400'
							: 'text-red-400'
						: concluida && !ehSeguranca
							? 'text-emerald-400'
							: 'text-zinc-500'}"
				/>
				<span class="truncate">{tab.rotulo}</span>
				{#if concluida && !ehSeguranca}
					<Check class="w-3.5 h-3.5 ml-auto text-emerald-400 shrink-0" />
				{/if}
			</button>
		{/each}
	</div>

	<!-- ========================================================================= -->
	<!-- FORMULÁRIO PRINCIPAL (ABAS 1 A 4 MANTIDAS NO DOM VIA class:hidden)        -->
	<!-- ========================================================================= -->
	<form
		method="POST"
		action="?/salvarDados"
		class:hidden={abaAtiva === 'seguranca'}
		use:enhance={() => {
			salvando = true;
			return async ({ update }) => {
				await update({ reset: false });
				salvando = false;
			};
		}}
		class="space-y-6"
	>
		<!-- ABA 1: IDENTIFICAÇÃO & CONTATO -->
		<section
			class:hidden={abaAtiva !== 'identificacao'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4 animate-in fade-in duration-150"
		>
			<div class="flex items-center gap-2 pb-3 border-b border-zinc-900">
				<User class="w-4 h-4 text-red-500" />
				<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
					1. Identificação Cadastral & Contato
				</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="cpf" class="text-[11px] font-mono uppercase text-zinc-400 block">
							{data.usuario.tipo_documento === 'ESTRANGEIRO'
								? 'Documento Estrangeiro (Passaporte/RNM)'
								: 'CPF (Imutável / Chave Fiscal)'}
						</label>
						<span class="text-[10px] font-mono text-zinc-500">
							{data.usuario.tipo_documento === 'ESTRANGEIRO'
								? data.usuario.pais_origem || 'Internacional'
								: 'LGPD'}
						</span>
					</div>
					<input
						type="text"
						id="cpf"
						disabled
						value={data.usuario.cpf_mascarado}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60 text-xs text-zinc-400 font-mono cursor-not-allowed"
					/>
				</div>

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
							class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
						/>
					</div>
				</div>

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
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
					/>
				</div>

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
							bind:value={telefoneValor}
							placeholder="(11) 99999-9999"
							class="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- ABA 2: ENDEREÇO COMPLETO -->
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
		</section>

		<!-- ABA 3: PERFIS & DADOS TÉCNICOS UNIFICADOS -->
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

			<!-- Credenciais Técnicas Unificadas (Sensei & Judoca) -->
			<div
				class:hidden={!ehProfessorSelecionado && !ehAlunoSelecionado}
				class="p-5 rounded-2xl bg-amber-950/15 border border-amber-900/40 space-y-5"
			>
				<div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-900/30">
					<div class="flex items-center gap-2">
						<Award class="w-4 h-4 text-amber-500" />
						<h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
							Credenciais Técnicas Unificadas (Professor & Judoca)
						</h3>
					</div>
					<div class="flex items-center gap-2 flex-wrap">
						{#if data.usuario.dados_aluno}
							<a
								href="/dashboard/graduacoes/historico/{data.usuario.id_usuario}"
								class="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-sky-400 transition-colors"
							>
								Linha do Tempo de Faixas →
							</a>
							<a
								href="/dashboard/alunos/{data.usuario.id_usuario}"
								class="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-amber-300 transition-colors"
							>
								Ficha de Atleta →
							</a>
						{/if}
					</div>
				</div>

				<p class="text-xs text-zinc-300">
					Ao atualizar a graduação ou o código federativo abaixo, o sistema sincroniza automaticamente os registros de <strong>Professor</strong>, <strong>Aluno</strong> e <strong>Histórico de Graduações</strong>.
				</p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
					<div class="space-y-2">
						<label for="grauFaixa" class="text-[11px] font-mono uppercase text-zinc-400 block">
							Graduação Oficial (Faixa & Dan)
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
							Número da Federação (FPJ / CBJ)
						</label>
						<input
							type="text"
							id="nFederacao"
							name="nFederacao"
							bind:value={nFederacaoValor}
							placeholder="Ex: FPJ-12345"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
						/>
						{#if data.usuario.dados_aluno}
							<div class="mt-3 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1">
								<div>
									Categoria CBJ: <strong class="text-zinc-200">{data.usuario.dados_aluno.categoria || 'Pendente de peso'}</strong>
								</div>
								<div>
									Sensei Responsável: <strong class="text-zinc-200">{data.usuario.dados_aluno.nome_professor_responsavel}</strong>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- ABA 4: RESPONSÁVEIS LEGAIS & DEPENDENTES -->
		<section
			class:hidden={abaAtiva !== 'responsaveis'}
			class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6 animate-in fade-in duration-150"
		>
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<HeartHandshake class="w-4 h-4 text-amber-400" />
					<h2 class="text-sm font-bold text-white uppercase tracking-wider font-mono">
						4. Responsáveis Legais & Dependentes Vinculados
					</h2>
				</div>
			</div>

			{#if ehMenor}
				<div class="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/70 space-y-4">
					<div class="flex items-center justify-between gap-2 flex-wrap">
						<span class="text-xs font-bold text-amber-300">
							Responsáveis Legais pelo Menor ({idadeCalculada} anos)
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
					{/if}
				</div>
			{:else}
				<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400">
					Usuário maior de 18 anos ({idadeCalculada ?? data.usuario.idade} anos) — não requer vínculo de responsável legal.
				</div>
			{/if}

			<input type="hidden" name="responsaveisJson" value={JSON.stringify(responsaveisVinculados)} />
			{#if responsaveisVinculados.length > 0}
				<input type="hidden" name="idResponsavel" value={responsaveisVinculados[0].idResponsavel} />
				<input type="hidden" name="responsavelParentesco" value={responsaveisVinculados[0].grauParentesco} />
				<input type="hidden" name="responsavelFinanceiro" value={responsaveisVinculados[0].financeiro ? 'on' : ''} />
			{/if}

			{#if data.usuario.dependentes && data.usuario.dependentes.length > 0}
				<div class="space-y-3 pt-2 border-t border-zinc-900">
					<div class="flex items-center gap-2">
						<Users class="w-4 h-4 text-emerald-500" />
						<h3 class="text-xs font-bold text-white uppercase tracking-wider font-mono">
							Dependentes / Menores sob Tutela deste Usuário ({data.usuario.dependentes.length})
						</h3>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
				</div>
			{/if}
		</section>

		<!-- Botão Global de Salvar (Abas 1 a 4) -->
		<div class="flex items-center justify-between gap-3 pt-4 border-t border-zinc-900">
			<a
				href="/dashboard/usuarios"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
			>
				Voltar
			</a>
			<button
				type="submit"
				disabled={salvando || perfisSelecionados.length === 0}
				class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
			>
				{#if salvando}
					<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					<span>Salvando...</span>
				{:else}
					<Pencil class="w-4 h-4" />
					<span>Salvar Alterações Cadastrais</span>
				{/if}
			</button>
		</div>
	</form>

	<!-- ========================================================================= -->
	<!-- ABA 5: SEGURANÇA & GOVERNANÇA (SENHA, BLOQUEIO E DESVINCULAÇÃO)           -->
	<!-- ========================================================================= -->
	{#if abaAtiva === 'seguranca'}
		<div class="space-y-6 animate-in fade-in duration-150">
			<!-- Card 1: Redefinir Senha de Acesso -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
				<div class="flex items-center gap-2.5 pb-3 border-b border-zinc-900">
					<div class="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400">
						<KeyRound class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-white">Redefinir Senha de Acesso</h3>
						<p class="text-[11px] text-zinc-500">
							Define uma nova senha e encerra automaticamente todas as sessões ativas deste usuário no dojo
						</p>
					</div>
				</div>

				<form method="POST" action="?/redefinirSenha" use:enhance class="space-y-4 max-w-2xl">
					<div class="flex flex-wrap items-center gap-2 pb-1">
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

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						<div>
							<div class="flex items-center justify-between mb-1">
								<label for="novaSenha" class="text-[11px] font-mono uppercase text-zinc-400 block">
									Nova Senha *
								</label>
								{#if analiseNovaSenha.forca === 'forte'}
									<span class="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
										<Check class="w-3 h-3" /> Senha Forte
									</span>
								{:else if novaSenhaValor.length > 0}
									<span class="text-[10px] font-mono text-amber-400 font-bold">
										Força: {analiseNovaSenha.forca}
									</span>
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
									placeholder="Mínimo 8 caracteres"
									class="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
								/>
								<button
									type="button"
									onclick={() => (mostrarNovaSenha = !mostrarNovaSenha)}
									class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
								>
									{#if mostrarNovaSenha}
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
									Confirmar Nova Senha *
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
							<input
								type={mostrarNovaSenha ? 'text' : 'password'}
								id="confirmacaoSenha"
								name="confirmacaoSenha"
								required
								minlength="8"
								bind:value={confirmacaoSenhaValor}
								placeholder="Repita a nova senha"
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border {confirmacaoSenhaValor.length > 0
									? senhasConferem
										? 'border-emerald-600/80'
										: 'border-red-600/80'
									: 'border-zinc-800'} text-xs text-white font-mono focus:outline-none focus:border-amber-500"
							/>
						</div>
					</div>

					<button
						type="submit"
						class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition-colors cursor-pointer"
					>
						<KeyRound class="w-3.5 h-3.5" />
						<span>Atualizar Senha do Usuário</span>
					</button>
				</form>
			</div>

			<!-- Card 2: Bloqueio / Suspensão Temporária no Dojo -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
				<div class="flex items-center justify-between gap-2 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
							<Ban class="w-4 h-4 text-amber-400" />
						</div>
						<div>
							<h3 class="text-sm font-semibold text-white">
								Controle de Acesso ao Dojo (Suspensão / Bloqueio)
							</h3>
							<p class="text-[11px] text-zinc-500">
								Suspende ou reativa o login do usuário neste dojo preservando todo o histórico técnico
							</p>
						</div>
					</div>
				</div>

				<form method="POST" action="?/alternarBloqueio" use:enhance class="space-y-4 max-w-xl">
					<input
						type="hidden"
						name="acao"
						value={data.usuario.ativo_no_dojo ? 'bloquear' : 'desbloquear'}
					/>

					{#if data.usuario.ativo_no_dojo}
						<div>
							<label for="motivoBloqueio" class="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
								Motivo da Suspensão (Auditoria)
							</label>
							<input
								type="text"
								id="motivoBloqueio"
								name="motivo"
								bind:value={motivoBloqueioValor}
								class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
							/>
						</div>
					{:else}
						<div class="p-3.5 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-200">
							Este usuário está atualmente <strong>bloqueado</strong> neste dojo. Motivo registrado: <em>{data.usuario.motivo_bloqueio_dojo || 'Não informado'}</em>.
						</div>
					{/if}

					<button
						type="submit"
						disabled={data.idOperadorLogado === data.usuario.id_usuario && data.usuario.ativo_no_dojo}
						class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-40 {data.usuario.ativo_no_dojo
							? 'bg-zinc-900 hover:bg-amber-950/60 border border-amber-800/70 text-amber-300'
							: 'bg-emerald-600 hover:bg-emerald-500'}"
					>
						<Ban class="w-3.5 h-3.5" />
						<span>
							{data.usuario.ativo_no_dojo
								? 'Suspender / Bloquear Acesso no Dojo'
								: 'Reativar Acesso do Usuário no Dojo'}
						</span>
					</button>
				</form>
			</div>

			<!-- Card 3: Zona de Perigo — Desvincular Usuário do Dojo -->
			<div class="p-6 rounded-2xl bg-red-950/10 border border-red-900/40 space-y-4">
				<div class="flex items-center gap-2.5 pb-3 border-b border-red-900/30">
					<div class="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400">
						<UserX class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-semibold text-red-300">
							Zona de Risco: Desvincular Usuário do Dojo
						</h3>
						<p class="text-[11px] text-zinc-400">
							Remove os perfis e o vínculo deste usuário com a unidade atual
						</p>
					</div>
				</div>

				{#if !confirmarDesvinculacao}
					<button
						type="button"
						disabled={data.idOperadorLogado === data.usuario.id_usuario}
						onclick={() => (confirmarDesvinculacao = true)}
						class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800 text-xs font-semibold text-red-200 transition-colors cursor-pointer disabled:opacity-40"
					>
						<UserX class="w-3.5 h-3.5" />
						<span>Solicitar Desvinculação do Dojo...</span>
					</button>
				{:else}
					<div class="p-4 rounded-xl bg-red-950/40 border border-red-800 space-y-3 max-w-xl">
						<p class="text-xs text-red-200">
							Tem certeza que deseja remover o vínculo de <strong>{data.usuario.nome}</strong> com este dojo?
						</p>
						<form method="POST" action="?/desvincular" class="flex items-center gap-2.5">
							<button
								type="button"
								onclick={() => (confirmarDesvinculacao = false)}
								class="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="submit"
								class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
							>
								Confirmar Desvinculação Definitiva
							</button>
						</form>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
