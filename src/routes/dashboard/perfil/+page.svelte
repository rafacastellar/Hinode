<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import BadgePerfil from '#lib/components/ui/BadgePerfil.svelte';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		User,
		Mail,
		Phone,
		MapPin,
		Lock,
		KeyRound,
		Eye,
		EyeOff,
		CheckCircle2,
		AlertCircle,
		Search,
		Loader2,
		ShieldCheck,
		Save,
		Scale,
		Award,
		Calendar,
		Building2,
		Flame,
		Sparkles
	} from '@lucide/svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Estados reativos para busca de CEP e alternância de senha
	let buscandoCep = $state(false);
	let erroCep = $state<string | null>(null);
	let sucessoCep = $state(false);

	let mostrarSenhaAtual = $state(false);
	let mostrarNovaSenha = $state(false);
	let mostrarConfirmacao = $state(false);

	let salvandoDados = $state(false);
	let salvandoSenha = $state(false);

	// Campos do formulário com fallback nos dados carregados
	let email = $state('');
	let telefone = $state('');
	let peso = $state('');

	let cep = $state('');
	let logradouro = $state('');
	let numero = $state('');
	let complemento = $state('');
	let bairro = $state('');
	let cidade = $state('');
	let uf = $state('SP');

	$effect(() => {
		email = data.perfil.email;
		telefone = data.perfil.telefone || '';
		peso =
			data.perfil.dados_aluno?.peso !== null && data.perfil.dados_aluno?.peso !== undefined
				? String(data.perfil.dados_aluno.peso)
				: '';

		cep = data.perfil.endereco?.cep || '';
		logradouro = data.perfil.endereco?.logradouro || '';
		numero = data.perfil.endereco?.numero || '';
		complemento = data.perfil.endereco?.complemento || '';
		bairro = data.perfil.endereco?.bairro || '';
		cidade = data.perfil.endereco?.cidade || '';
		uf = data.perfil.endereco?.uf || 'SP';
	});

	$effect(() => {
		if (form) {
			salvandoDados = false;
			salvandoSenha = false;
		}
	});

	/**
	 * Consulta automática de endereço via API ViaCEP
	 */
	async function consultarCep() {
		const cepLimpo = cep.replace(/\D/g, '');
		if (cepLimpo.length !== 8) {
			erroCep = 'Digite um CEP completo com 8 dígitos numéricos.';
			return;
		}

		buscandoCep = true;
		erroCep = null;
		sucessoCep = false;

		try {
			const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
			if (!resposta.ok) throw new Error('Falha na consulta');
			const resultado = await resposta.json();

			if (resultado.erro) {
				erroCep = 'CEP não localizado na base dos Correios.';
				return;
			}

			logradouro = resultado.logradouro || logradouro;
			bairro = resultado.bairro || bairro;
			cidade = resultado.localidade || cidade;
			uf = resultado.uf || uf;
			sucessoCep = true;
		} catch (e) {
			erroCep = 'Não foi possível consultar o CEP automaticamente.';
		} finally {
			buscandoCep = false;
		}
	}
</script>

<svelte:head>
	<title>Meu Perfil - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 1. HEADER DO PERFIL & IDENTIFICAÇÃO RÁPIDA                                 -->
	<!-- ========================================================================= -->
	<header
		class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/25 border border-zinc-800 p-6 sm:p-8 shadow-[0_0_35px_rgba(220,38,38,0.08)]"
	>
		<!-- Glow sutil de fundo -->
		<div
			class="absolute -top-24 -right-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div class="flex items-start sm:items-center gap-5">
				<!-- Avatar com Inicial do Nome -->
				<div
					class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border-2 border-red-600/60 flex items-center justify-center text-2xl sm:text-3xl font-display font-extrabold text-white shrink-0 shadow-[0_0_20px_rgba(220,38,38,0.25)]"
				>
					{data.perfil.nome.charAt(0).toUpperCase()}
				</div>

				<div class="space-y-2">
					<div class="flex items-center gap-2 flex-wrap">
						<span
							class="px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-800/80 text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5"
						>
							<User class="w-3 h-3 text-red-500" />
							<span>Minha Conta</span>
						</span>
						<span class="text-xs text-zinc-600">•</span>
						<span class="text-xs text-zinc-400 font-mono">
							ID #{data.perfil.id_usuario}
						</span>
						{#if data.perfil.dados_aluno?.matricula}
							<span class="text-xs text-zinc-600">•</span>
							<span class="text-xs text-zinc-400 font-mono">
								Matrícula: {data.perfil.dados_aluno.matricula}
							</span>
						{/if}
						<span class="text-xs text-zinc-600">•</span>
						<span class="text-xs text-zinc-400 font-mono">
							{data.nomeAcademia || 'Judô Hinodê'}
						</span>
					</div>

					<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
						{data.perfil.nome}
					</h1>

					<div class="flex items-center gap-2 flex-wrap pt-0.5">
						{#each data.perfil.perfis as perfil}
							<BadgePerfil perfil={perfil.role} tamanho="sm" />
						{/each}
					</div>
				</div>
			</div>

			{#if data.perfil.dados_aluno}
				<!-- Badge de Graduação do Aluno -->
				<div
					class="shrink-0 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col items-center justify-center min-w-[180px] text-center space-y-1.5 shadow-lg"
				>
					<span class="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
						Graduação Atual
					</span>
					<div class="my-0.5">
						<BadgeFaixa faixa={data.perfil.dados_aluno.graduacao_atual} size="md" />
					</div>
					<span class="text-[10px] font-mono text-zinc-500">
						Sensei: {data.perfil.dados_aluno.nome_professor_responsavel}
					</span>
				</div>
			{/if}
		</div>
	</header>

	<!-- ========================================================================= -->
	<!-- ALERTAS DE FEEDBACK DE AÇÃO (DADOS OU SENHA)                              -->
	<!-- ========================================================================= -->
	{#if form?.sucessoDados}
		<div
			class="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-600/70 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoDados}</span>
		</div>
	{/if}

	{#if form?.erroDados}
		<div
			class="p-4 rounded-2xl bg-red-950/40 border-2 border-red-600/70 text-red-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.erroDados}</span>
		</div>
	{/if}

	{#if form?.sucessoSenha}
		<div
			class="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-600/70 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<ShieldCheck class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoSenha}</span>
		</div>
	{/if}

	{#if form?.erroSenha}
		<div
			class="p-4 rounded-2xl bg-red-950/40 border-2 border-red-600/70 text-red-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.erroSenha}</span>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. FORMULÁRIO PRINCIPAL: DADOS CADASTRAIS, CONTATO E ENDEREÇO             -->
	<!-- ========================================================================= -->
	<form
		action="?/salvarDados"
		method="POST"
		onsubmit={() => (salvandoDados = true)}
		class="space-y-8"
	>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- ===================================================================== -->
			<!-- CARD 1: DADOS DE IDENTIFICAÇÃO CIVIL (SOMENTE LEITURA / LGPD)         -->
			<!-- ===================================================================== -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
							<Lock class="w-4 h-4 text-zinc-400" />
						</div>
						<div>
							<h2 class="text-sm font-bold text-white font-display">Identificação Civil</h2>
							<p class="text-[11px] text-zinc-500">Dados oficiais registrados no dojo</p>
						</div>
					</div>
					<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
						Somente Leitura
					</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="sm:col-span-2 space-y-1">
						<label for="nome-civil" class="text-xs font-semibold text-zinc-400">Nome Completo</label>
						<input
							id="nome-civil"
							type="text"
							readonly
							value={data.perfil.nome}
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-medium cursor-not-allowed select-all"
						/>
					</div>

					<div class="space-y-1">
						<label for="cpf-civil" class="text-xs font-semibold text-zinc-400">CPF (LGPD Mascarado)</label>
						<input
							id="cpf-civil"
							type="text"
							readonly
							value={data.perfil.cpf_mascarado}
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs font-mono cursor-not-allowed"
						/>
					</div>

					<div class="space-y-1">
						<label for="genero-civil" class="text-xs font-semibold text-zinc-400">Gênero</label>
						<input
							id="genero-civil"
							type="text"
							readonly
							value={data.perfil.genero === 'M' ? 'Masculino' : 'Feminino'}
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs cursor-not-allowed"
						/>
					</div>

					<div class="space-y-1">
						<label for="nasc-civil" class="text-xs font-semibold text-zinc-400">Data de Nascimento</label>
						<input
							id="nasc-civil"
							type="text"
							readonly
							value={data.perfil.data_nascimento_br}
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs font-mono cursor-not-allowed"
						/>
					</div>

					<div class="space-y-1">
						<label for="idade-civil" class="text-xs font-semibold text-zinc-400">Idade Atual</label>
						<input
							id="idade-civil"
							type="text"
							readonly
							value="{data.perfil.idade} anos"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs cursor-not-allowed"
						/>
					</div>
				</div>

				<p class="text-[11px] text-zinc-500 italic pt-1 border-t border-zinc-900">
					* A alteração de documentos civis, idade e nome exige validação presencial junto ao Sensei ou secretaria do dojo.
				</p>
			</div>

			<!-- ===================================================================== -->
			<!-- CARD 2: CANAIS DE CONTATO E ACESSO (EDITÁVEIS PELO USUÁRIO)           -->
			<!-- ===================================================================== -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
				<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400">
							<Mail class="w-4 h-4 text-red-400" />
						</div>
						<div>
							<h2 class="text-sm font-bold text-white font-display">Canais de Contato & Acesso</h2>
							<p class="text-[11px] text-zinc-500">Utilizados para login, avisos e notificações</p>
						</div>
					</div>
					<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
						✏️ Você pode editar
					</span>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<label for="email" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
							<span>E-mail de Acesso e Login <span class="text-red-500">*</span></span>
							<span class="text-[10px] text-zinc-500 font-mono">Chave de autenticação</span>
						</label>
						<div class="relative">
							<Mail class="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
							<input
								id="email"
								name="email"
								type="email"
								required
								bind:value={email}
								placeholder="seu.email@exemplo.com"
								class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
							/>
						</div>
					</div>

					<div class="space-y-1.5">
						<label for="telefone" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
							<span>Telefone / WhatsApp</span>
							<span class="text-[10px] text-zinc-500 font-mono">Contato para emergências</span>
						</label>
						<div class="relative">
							<Phone class="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
							<input
								id="telefone"
								name="telefone"
								type="tel"
								bind:value={telefone}
								placeholder="(11) 98765-4321"
								class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
							/>
						</div>
					</div>

					{#if data.ehAluno}
						<!-- Destaque: Campo de Peso Corporal do Judoca -->
						<div class="p-4 rounded-xl bg-amber-950/20 border border-amber-600/40 space-y-2 mt-2">
							<div class="flex items-center justify-between">
								<label for="peso" class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
									<Scale class="w-4 h-4 text-amber-400" />
									<span>Peso Atual do Judoca (kg)</span>
								</label>
								<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-900/50 text-amber-300">
									✏️ Editável por você
								</span>
							</div>

							<div class="relative">
								<input
									id="peso"
									name="peso"
									type="number"
									step="0.01"
									min="20"
									max="250"
									bind:value={peso}
									placeholder="Ex.: 78.50"
									class="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-zinc-900 border border-amber-600/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs font-mono font-bold transition-all"
								/>
								<span class="absolute right-3.5 top-2.5 text-xs text-zinc-400 font-mono font-bold">
									kg
								</span>
							</div>
							<p class="text-[11px] text-amber-200/80 leading-relaxed">
								Mantenha seu peso atualizado para agilizar sua categoria em campeonatos e ranqueamento interno do dojo.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- CARD 3: ENDEREÇO RESIDENCIAL COMPLETO COM AUTO-CEP (EDITÁVEL)             -->
		<!-- ========================================================================= -->
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-sky-950/40 border border-sky-800/60 flex items-center justify-center text-sky-400">
						<MapPin class="w-4 h-4 text-sky-400" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">Endereço Residencial Completo</h2>
						<p class="text-[11px] text-zinc-500">Dados de localização do titular cadastrado</p>
					</div>
				</div>
				<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 self-start sm:self-auto">
					✏️ Você pode editar
				</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-6 gap-4">
				<!-- Campo CEP com busca automática -->
				<div class="sm:col-span-2 space-y-1.5">
					<label for="cep" class="text-xs font-semibold text-zinc-300 flex items-center justify-between">
						<span>CEP <span class="text-red-500">*</span></span>
						<span class="text-[10px] text-zinc-500 font-mono">8 dígitos</span>
					</label>
					<div class="flex gap-2">
						<input
							id="cep"
							name="cep"
							type="text"
							required
							bind:value={cep}
							onblur={consultarCep}
							placeholder="00000-000"
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs font-mono transition-all"
						/>
						<button
							type="button"
							onclick={consultarCep}
							disabled={buscandoCep}
							title="Buscar endereço pelo CEP"
							class="px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 flex items-center justify-center transition-all shrink-0"
						>
							{#if buscandoCep}
								<Loader2 class="w-4 h-4 animate-spin text-red-500" />
							{:else}
								<Search class="w-4 h-4 text-zinc-400 hover:text-white" />
							{/if}
						</button>
					</div>
					{#if erroCep}
						<span class="text-[10px] text-red-400 font-medium block">{erroCep}</span>
					{/if}
					{#if sucessoCep}
						<span class="text-[10px] text-emerald-400 font-medium block">Endereço localizado!</span>
					{/if}
				</div>

				<div class="sm:col-span-4 space-y-1.5">
					<label for="logradouro" class="text-xs font-semibold text-zinc-300">
						Logradouro (Rua, Avenida, Praça) <span class="text-red-500">*</span>
					</label>
					<input
						id="logradouro"
						name="logradouro"
						type="text"
						required
						bind:value={logradouro}
						placeholder="Ex.: Rua das Amoreiras"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
					/>
				</div>

				<div class="sm:col-span-2 space-y-1.5">
					<label for="numero" class="text-xs font-semibold text-zinc-300">Número</label>
					<input
						id="numero"
						name="numero"
						type="text"
						bind:value={numero}
						placeholder="Ex.: 123 ou S/N"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
					/>
				</div>

				<div class="sm:col-span-2 space-y-1.5">
					<label for="complemento" class="text-xs font-semibold text-zinc-300">Complemento</label>
					<input
						id="complemento"
						name="complemento"
						type="text"
						bind:value={complemento}
						placeholder="Apto 42, Bloco B"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
					/>
				</div>

				<div class="sm:col-span-2 space-y-1.5">
					<label for="bairro" class="text-xs font-semibold text-zinc-300">Bairro</label>
					<input
						id="bairro"
						name="bairro"
						type="text"
						bind:value={bairro}
						placeholder="Bairro"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
					/>
				</div>

				<div class="sm:col-span-4 space-y-1.5">
					<label for="cidade" class="text-xs font-semibold text-zinc-300">
						Cidade <span class="text-red-500">*</span>
					</label>
					<input
						id="cidade"
						name="cidade"
						type="text"
						required
						bind:value={cidade}
						placeholder="São Paulo"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
					/>
				</div>

				<div class="sm:col-span-2 space-y-1.5">
					<label for="uf" class="text-xs font-semibold text-zinc-300">
						Estado (UF) <span class="text-red-500">*</span>
					</label>
					<input
						id="uf"
						name="uf"
						type="text"
						required
						maxlength="2"
						bind:value={uf}
						placeholder="SP"
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs font-mono uppercase transition-all"
					/>
				</div>
			</div>

			<!-- Botão de Salvar Dados do Perfil -->
			<div class="pt-4 border-t border-zinc-900 flex justify-end">
				<button
					type="submit"
					disabled={salvandoDados}
					class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(220,38,38,0.35)] transition-all disabled:opacity-50"
				>
					{#if salvandoDados}
						<Loader2 class="w-4 h-4 animate-spin" />
						<span>Gravando Alterações...</span>
					{:else}
						<Save class="w-4 h-4" />
						<span>Salvar Dados Cadastrais</span>
					{/if}
				</button>
			</div>
		</div>
	</form>

	<!-- ========================================================================= -->
	<!-- 3. DADOS TÉCNICOS DO JUDÔ (SE FOR ALUNO - SOMENTE LEITURA DO SENSEI)      -->
	<!-- ========================================================================= -->
	{#if data.perfil.dados_aluno}
		<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
						<Award class="w-4 h-4 text-zinc-400" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">Dados Técnicos do Judô</h2>
						<p class="text-[11px] text-zinc-500">Faixa atual, Sensei técnico e dados de competição/federação</p>
					</div>
				</div>
				<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
					Somente Leitura
				</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<!-- 1. Graduação Atual (Faixa) -->
				<div class="space-y-1">
					<label for="tecnico-faixa" class="text-xs font-semibold text-zinc-400">Graduação Atual (Faixa)</label>
					<div class="relative flex items-center">
						<input
							id="tecnico-faixa"
							type="text"
							readonly
							value={data.perfil.dados_aluno.graduacao_atual}
							class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-medium cursor-not-allowed pr-28 select-all"
						/>
						<div class="absolute right-2.5 pointer-events-none">
							<BadgeFaixa faixa={data.perfil.dados_aluno.graduacao_atual} size="sm" />
						</div>
					</div>
				</div>

				<!-- 2. Sensei Técnico Responsável -->
				<div class="space-y-1">
					<label for="tecnico-sensei" class="text-xs font-semibold text-zinc-400">Sensei Técnico Responsável</label>
					<input
						id="tecnico-sensei"
						type="text"
						readonly
						value={data.perfil.dados_aluno.nome_professor_responsavel}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-medium cursor-not-allowed select-all"
					/>
				</div>

				<!-- 3. Matrícula no Dojo -->
				<div class="space-y-1">
					<label for="tecnico-matricula" class="text-xs font-semibold text-zinc-400">Matrícula no Dojo</label>
					<input
						id="tecnico-matricula"
						type="text"
						readonly
						value={data.perfil.dados_aluno.matricula || 'Pendente de atribuição'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-mono cursor-not-allowed select-all"
					/>
				</div>

				<!-- 4. Peso Atual (kg) -->
				<div class="space-y-1">
					<label for="tecnico-peso" class="text-xs font-semibold text-zinc-400">Peso Atual (kg)</label>
					<input
						id="tecnico-peso"
						type="text"
						readonly
						value={data.perfil.dados_aluno.peso !== null && data.perfil.dados_aluno.peso !== undefined
							? `${data.perfil.dados_aluno.peso} kg`
							: 'Pendente de pesagem'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-mono cursor-not-allowed select-all"
					/>
				</div>

				<!-- 5. Categoria de Peso / Idade -->
				<div class="space-y-1">
					<label for="tecnico-categoria" class="text-xs font-semibold text-zinc-400">Categoria de Peso / Idade</label>
					<input
						id="tecnico-categoria"
						type="text"
						readonly
						value={data.perfil.dados_aluno.categoria || 'Não classificada'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs cursor-not-allowed select-all"
					/>
				</div>

				<!-- 6. Nº de Registro Federativo (FPJ/CBJ) -->
				<div class="space-y-1">
					<label for="tecnico-federacao" class="text-xs font-semibold text-zinc-400">Nº de Registro Federativo (FPJ/CBJ)</label>
					<input
						id="tecnico-federacao"
						type="text"
						readonly
						value={data.perfil.dados_aluno.n_federacao || 'Pendente na Secretaria'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-mono cursor-not-allowed select-all"
					/>
				</div>

				<!-- 7. Status na Federação -->
				<div class="space-y-1">
					<label for="tecnico-status-fed" class="text-xs font-semibold text-zinc-400">Status na Federação</label>
					<input
						id="tecnico-status-fed"
						type="text"
						readonly
						value={data.perfil.dados_aluno.status_federacao || 'Pendente'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs cursor-not-allowed select-all"
					/>
				</div>

				<!-- 8. Grupo Competitivo -->
				<div class="space-y-1">
					<label for="tecnico-grupo" class="text-xs font-semibold text-zinc-400">Grupo Competitivo</label>
					<input
						id="tecnico-grupo"
						type="text"
						readonly
						value={data.perfil.dados_aluno.grupo_especial_aspirante || 'Não classificado / Tradicional'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs cursor-not-allowed select-all"
					/>
				</div>

				<!-- 9. Data de Início no Tatame -->
				<div class="space-y-1">
					<label for="tecnico-data-inicio" class="text-xs font-semibold text-zinc-400">Data de Início no Tatame</label>
					<input
						id="tecnico-data-inicio"
						type="text"
						readonly
						value={data.perfil.dados_aluno.data_inicio_br || 'Não informada'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-mono cursor-not-allowed select-all"
					/>
				</div>

				<!-- 10. Data da 1ª Graduação (Faixa) -->
				<div class="space-y-1">
					<label for="tecnico-data-grad" class="text-xs font-semibold text-zinc-400">Data da 1ª Graduação (Faixa)</label>
					<input
						id="tecnico-data-grad"
						type="text"
						readonly
						value={data.perfil.dados_aluno.data_primeira_graduacao_br || 'Não informada'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-mono cursor-not-allowed select-all"
					/>
				</div>
			</div>

			<p class="text-[11px] text-zinc-500 italic pt-1 border-t border-zinc-900">
				* A alteração de graduações, faixas, categorias e registros federativos do judoca exige validação do Sensei Técnico ou secretaria do dojo (Homologado pelo Sensei).
			</p>
		</section>
	{/if}

	<!-- ========================================================================= -->
	<!-- 4. DADOS DE PROFESSOR OU RESPONSÁVEL (SE APLICÁVEL)                       -->
	<!-- ========================================================================= -->
	{#if data.perfil.dados_professor}
		<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
						<Sparkles class="w-4 h-4 text-zinc-400" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">Credenciamento Técnico de Sensei</h2>
						<p class="text-[11px] text-zinc-500">Credenciais federativas e titulação no tatame</p>
					</div>
				</div>
				<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
					Somente Leitura
				</span>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-1">
					<label for="sensei-grau" class="text-xs font-semibold text-zinc-400">Grau / Faixa (Dan)</label>
					<input
						id="sensei-grau"
						type="text"
						readonly
						value={data.perfil.dados_professor.grau_faixa || 'Sensei'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-medium cursor-not-allowed select-all"
					/>
				</div>
				<div class="space-y-1">
					<label for="sensei-federacao" class="text-xs font-semibold text-zinc-400">Nº Registro Federativo</label>
					<input
						id="sensei-federacao"
						type="text"
						readonly
						value={data.perfil.dados_professor.n_federacao || 'Não informado'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-mono cursor-not-allowed select-all"
					/>
				</div>
			</div>
		</section>
	{/if}

	{#if data.perfil.dados_responsavel}
		<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
						<Building2 class="w-4 h-4 text-zinc-400" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">Dados de Responsável Legal</h2>
						<p class="text-[11px] text-zinc-500">Vínculo formal e responsabilidade financeira</p>
					</div>
				</div>
				<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
					Somente Leitura
				</span>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-1">
					<label for="resp-parentesco" class="text-xs font-semibold text-zinc-400">Grau de Parentesco</label>
					<input
						id="resp-parentesco"
						type="text"
						readonly
						value={data.perfil.dados_responsavel.grau_parentesco || 'Responsável Legal'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs font-medium cursor-not-allowed select-all"
					/>
				</div>
				<div class="space-y-1">
					<label for="resp-financeiro" class="text-xs font-semibold text-zinc-400">Responsável Financeiro</label>
					<input
						id="resp-financeiro"
						type="text"
						readonly
						value={data.perfil.dados_responsavel.financeiro ? 'Sim (Titular Financeiro)' : 'Não'}
						class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 {data.perfil.dados_responsavel.financeiro ? 'text-emerald-400 font-semibold' : 'text-zinc-300'} text-xs cursor-not-allowed select-all"
					/>
				</div>
				{#if data.perfil.dados_responsavel.dependentes && data.perfil.dados_responsavel.dependentes.length > 0}
					<div class="sm:col-span-2 space-y-1">
						<span class="text-xs font-semibold text-zinc-400 block">Alunos Dependentes Vinculados</span>
						<div class="flex items-center gap-2 flex-wrap pt-1">
							{#each data.perfil.dados_responsavel.dependentes as dep}
								<span class="px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white font-medium">
									🥋 {dep.nome}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<!-- ========================================================================= -->
	<!-- 5. PAINEL DE SEGURANÇA: TROCA DE SENHA DE ACESSO                          -->
	<!-- ========================================================================= -->
	<section class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-5 shadow-sm">
		<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
			<div class="flex items-center gap-2.5">
				<div class="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400">
					<KeyRound class="w-4 h-4 text-red-400" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Segurança & Troca de Senha</h2>
					<p class="text-[11px] text-zinc-500">Altere sua credencial de acesso informando a senha antiga</p>
				</div>
			</div>
			<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
				Credencial
			</span>
		</div>

		<form
			action="?/alterarSenha"
			method="POST"
			onsubmit={() => (salvandoSenha = true)}
			class="space-y-4 max-w-xl"
		>
			<div class="space-y-1.5">
				<label for="senhaAtual" class="text-xs font-semibold text-zinc-300">
					Senha Atual de Acesso <span class="text-red-500">*</span>
				</label>
				<div class="relative">
					<input
						id="senhaAtual"
						name="senhaAtual"
						type={mostrarSenhaAtual ? 'text' : 'password'}
						required
						placeholder="Digite sua senha atual"
						class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
					/>
					<button
						type="button"
						onclick={() => (mostrarSenhaAtual = !mostrarSenhaAtual)}
						class="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
						title={mostrarSenhaAtual ? 'Ocultar senha' : 'Ver senha'}
					>
						{#if mostrarSenhaAtual}
							<EyeOff class="w-4 h-4" />
						{:else}
							<Eye class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="novaSenha" class="text-xs font-semibold text-zinc-300">
						Nova Senha <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<input
							id="novaSenha"
							name="novaSenha"
							type={mostrarNovaSenha ? 'text' : 'password'}
							required
							minlength="6"
							placeholder="Mínimo 6 caracteres"
							class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
						/>
						<button
							type="button"
							onclick={() => (mostrarNovaSenha = !mostrarNovaSenha)}
							class="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
							title={mostrarNovaSenha ? 'Ocultar senha' : 'Ver senha'}
						>
							{#if mostrarNovaSenha}
								<EyeOff class="w-4 h-4" />
							{:else}
								<Eye class="w-4 h-4" />
							{/if}
						</button>
					</div>
				</div>

				<div class="space-y-1.5">
					<label for="confirmacaoNovaSenha" class="text-xs font-semibold text-zinc-300">
						Confirmar Nova Senha <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<input
							id="confirmacaoNovaSenha"
							name="confirmacaoNovaSenha"
							type={mostrarConfirmacao ? 'text' : 'password'}
							required
							minlength="6"
							placeholder="Repita a nova senha"
							class="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-xs transition-all"
						/>
						<button
							type="button"
							onclick={() => (mostrarConfirmacao = !mostrarConfirmacao)}
							class="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
							title={mostrarConfirmacao ? 'Ocultar senha' : 'Ver senha'}
						>
							{#if mostrarConfirmacao}
								<EyeOff class="w-4 h-4" />
							{:else}
								<Eye class="w-4 h-4" />
							{/if}
						</button>
					</div>
				</div>
			</div>

			<div class="pt-2">
				<button
					type="submit"
					disabled={salvandoSenha}
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-white text-xs font-bold transition-all disabled:opacity-50"
				>
					{#if salvandoSenha}
						<Loader2 class="w-4 h-4 animate-spin text-red-500" />
						<span>Atualizando Senha...</span>
					{:else}
						<KeyRound class="w-4 h-4 text-red-400" />
						<span>Atualizar Senha de Acesso</span>
					{/if}
				</button>
			</div>
		</form>
	</section>
</div>
