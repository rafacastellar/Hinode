<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import hinodeEmblema from '#lib/assets/hinode-emblema.svg';
	import { Lock, Mail, Building2, AlertCircle, ArrowRight, ShieldCheck, Clock, Eye, EyeOff } from '@lucide/svelte';

	interface FormState {
		erro?: string;
		email?: string;
		precisaSelecionarAcademia?: boolean;
		academias?: Array<{ id_academia: number; nome: string; nome_fantasia: string | null; logo_url?: string | null }>;
		autenticadoComSucesso?: boolean;
		destino?: string;
		academiaLogada?: {
			id: number;
			nome: string;
			logo: string | null;
		};
		nomeUsuario?: string;
	}

	let { data, form }: { data: PageData; form: FormState | null } = $props();

	let carregando = $state(false);
	let emailValor = $state('');
	let senhaValor = $state('');
	let mostrarSenha = $state(false);
	let idAcademiaSelecionada = $state<number | null>(null);

	// Estado da Transição Cinematográfica (Splash Screen com o Logo da Academia)
	let transicaoAtiva = $state(false);
	let dadosTransicao = $state<{
		nomeAcademia: string;
		logoAcademia: string | null;
		nomeUsuario: string;
	} | null>(null);

	// Se o acesso foi feito via domínio próprio da academia ou ?dojo=slug, pré-seleciona o idAcademia
	const dojoPersonalizado = $derived(data.academiaPersonalizada);

	$effect(() => {
		if (form?.email) {
			emailValor = form.email;
		}
		if (form?.academias && form.academias.length > 0 && !idAcademiaSelecionada) {
			idAcademiaSelecionada = form.academias[0].id_academia;
		}
		if (dojoPersonalizado && !idAcademiaSelecionada && !form?.precisaSelecionarAcademia) {
			idAcademiaSelecionada = dojoPersonalizado.id_academia;
		}
	});
</script>

<svelte:head>
	<title>
		{dojoPersonalizado
			? `Entrar • ${dojoPersonalizado.nome_fantasia || dojoPersonalizado.nome}`
			: 'Portal de Acesso aos Dojos • SGT'}
	</title>
</svelte:head>

<!-- ========================================================================= -->
<!-- OVERLAY DE TRANSIÇÃO CINEMATOGRÁFICA (COM O LOGO DA ACADEMIA AUTENTICADA) -->
<!-- ========================================================================= -->
{#if transicaoAtiva && dadosTransicao}
	<div class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
		<!-- Brilho radial de fundo -->
		<div class="absolute w-[480px] h-[480px] bg-red-600/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
		<div class="absolute w-[320px] h-[320px] bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

		<div class="relative z-10 flex flex-col items-center text-center max-w-md space-y-6">
			<!-- Moldura com o Logo Oficial da Academia -->
			<div class="relative">
				<div class="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-zinc-950 border-2 border-amber-500/50 p-2 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center justify-center overflow-hidden animate-bounce">
					{#if dadosTransicao.logoAcademia}
						<img
							src={dadosTransicao.logoAcademia}
							alt="Logo {dadosTransicao.nomeAcademia}"
							class="w-full h-full object-contain rounded-2xl"
							onerror={(e) => {
								const target = e.currentTarget as HTMLImageElement;
								target.src = '/img/logo-sgt.jpg';
							}}
						/>
					{:else}
						<Building2 class="w-14 h-14 text-amber-400" />
					{/if}
				</div>
				<span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black shadow-[0_0_12px_rgba(16,185,129,0.9)]"></span>
			</div>

			<div class="space-y-2">
				<span class="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
					Acesso Autorizado • Bem-vindo(a), {dadosTransicao.nomeUsuario.split(' ')[0]}
				</span>
				<h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
					{dadosTransicao.nomeAcademia}
				</h2>
				<p class="text-xs text-zinc-400 font-mono">
					Sincronizando tatame digital e carregando ambiente da academia...
				</p>
			</div>

			<!-- Barra de Progresso Fluida -->
			<div class="w-56 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
				<div class="h-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-400 animate-[pulse_1s_ease-in-out_infinite] w-full"></div>
			</div>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-black text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
	<!-- Glow de fundo sutil -->
	<div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] {dojoPersonalizado ? 'bg-red-600/10' : 'bg-amber-500/10'} rounded-full blur-3xl pointer-events-none"></div>

	<div class="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
		<!-- IDENTIDADE VISUAL: Se houver domínio/slug da academia, mostra o logo e nome da Academia; caso contrário, mostra o Login Neutro com a arte oficial do SaaS SGT -->
		<a href="/" class="inline-flex flex-col items-center gap-3 mb-6 group">
			{#if dojoPersonalizado}
				<div class="w-24 h-24 rounded-3xl bg-zinc-950 border border-zinc-800/90 p-1.5 flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:border-red-600/70 shadow-[0_0_35px_rgba(220,38,38,0.25)]">
					{#if dojoPersonalizado.logo_url}
						<img
							src={dojoPersonalizado.logo_url}
							alt="Logo {dojoPersonalizado.nome_fantasia || dojoPersonalizado.nome}"
							class="w-full h-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105"
							onerror={(e) => {
								const target = e.currentTarget as HTMLImageElement;
								target.src = hinodeEmblema;
							}}
						/>
					{:else}
						<Building2 class="w-11 h-11 text-red-500" />
					{/if}
				</div>
				<div class="text-center">
					<span class="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-white block leading-none uppercase">
						{dojoPersonalizado.nome_fantasia || dojoPersonalizado.nome}
					</span>
					<span class="text-[10px] tracking-widest text-amber-400/90 font-mono uppercase block mt-1.5">
						Portal Oficial do Dojo • Powered by SGT
					</span>
				</div>
			{:else}
				<!-- MODO NEUTRO DO SAAS (Sem identificação prévia de academia) -->
				<div class="w-24 h-24 rounded-3xl bg-zinc-950 border border-amber-500/40 p-2 flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.2)]">
					<img
						src="/img/logo-sgt.jpg"
						alt="Arte Oficial SGT SaaS"
						class="w-full h-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105"
						onerror={(e) => {
							const target = e.currentTarget as HTMLImageElement;
							target.src = hinodeEmblema;
						}}
					/>
				</div>
				<div class="text-center">
					<span class="font-display font-extrabold text-2xl tracking-wider text-white block leading-none">
						SGT • PORTAL DO DOJO
					</span>
					<span class="text-[10px] tracking-widest text-amber-400/90 font-mono uppercase block mt-1.5">
						心・技・体 • Sistema de Gestão de Tatame
					</span>
				</div>
			{/if}
		</a>

		<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
			{dojoPersonalizado ? 'Acesso ao Tatame Digital' : 'Identifique-se para entrar na sua Academia'}
		</h2>
		<p class="mt-1.5 text-xs sm:text-sm text-zinc-400">
			{dojoPersonalizado
				? `Entre com suas credenciais vinculadas a ${dojoPersonalizado.nome_fantasia || dojoPersonalizado.nome}`
				: 'O sistema carregará automaticamente o ambiente e o emblema da sua academia'}
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
		<div class="bg-zinc-950/90 backdrop-blur-md py-8 px-6 sm:px-10 border border-zinc-800/80 rounded-2xl shadow-2xl">
			<!-- Alerta de Sessão Expirada por Inatividade -->
			{#if data?.expirada && !form?.erro}
				<div class="mb-6 p-4 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-sm flex items-start gap-3">
					<Clock class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
					<div class="leading-relaxed">
						<span class="font-semibold block text-amber-100">Sessão Expirada por Inatividade</span>
						Por medidas de segurança, sua sessão foi encerrada após 2 horas sem atividade. Faça login novamente para prosseguir.
					</div>
				</div>
			{/if}

			<!-- Alerta de Erro / Rate Limiting -->
			{#if form?.erro}
				<div class="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-900/60 text-red-200 text-sm flex items-start gap-3">
					<AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
					<div class="leading-relaxed">
						{form.erro}
					</div>
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					carregando = true;
					return async ({ result, update }) => {
						if (result.type === 'success' && result.data?.autenticadoComSucesso) {
							const info = result.data as unknown as FormState;
							dadosTransicao = {
								nomeAcademia: info.academiaLogada?.nome || 'Sua Academia',
								logoAcademia: info.academiaLogada?.logo || null,
								nomeUsuario: info.nomeUsuario || 'Praticante'
							};
							transicaoAtiva = true;

							// Mantém a transição do logo da academia visível enquanto pré-carrega e navega para a página principal
							setTimeout(async () => {
								await goto(info.destino || '/dashboard', { invalidateAll: true });
							}, 850);
							return;
						}

						carregando = false;
						await update();
					};
				}}
				class="space-y-6"
			>
				{#if dojoPersonalizado && !form?.precisaSelecionarAcademia}
					<input type="hidden" name="idAcademia" value={dojoPersonalizado.id_academia} />
				{/if}

				<!-- Campo: E-mail -->
				<div>
					<label for="email" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
						E-mail
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
							<Mail class="w-4 h-4" />
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={emailValor}
							placeholder="seu.email@academia.com.br"
							class="block w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
						/>
					</div>
				</div>

				<!-- Campo: Senha -->
				<div>
					<label for="senha" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
						Senha
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
							<Lock class="w-4 h-4" />
						</div>
						<input
							id="senha"
							name="senha"
							type={mostrarSenha ? 'text' : 'password'}
							autocomplete="current-password"
							required
							bind:value={senhaValor}
							placeholder="••••••••"
							class="block w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
						/>
						<button
							type="button"
							onclick={() => (mostrarSenha = !mostrarSenha)}
							class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer focus:outline-none"
							title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
							aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
						>
							{#if mostrarSenha}
								<EyeOff class="w-4 h-4" />
							{:else}
								<Eye class="w-4 h-4" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Seleção de Dojo (quando o usuário tem múltiplas academias) -->
				{#if form?.precisaSelecionarAcademia && form.academias}
					<div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
						<div class="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
							<Building2 class="w-4 h-4 text-amber-500" />
							<span>Selecione sua Academia</span>
						</div>
						<p class="text-xs text-zinc-400">
							Sua conta está vinculada a mais de uma academia. Escolha qual deseja acessar agora:
						</p>

						<div class="space-y-2 pt-1">
							{#each form.academias as ac}
								<label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors {idAcademiaSelecionada === ac.id_academia ? 'bg-red-950/30 border-red-600 text-white' : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-zinc-700'}">
									<input
										type="radio"
										name="idAcademia"
										value={ac.id_academia}
										bind:group={idAcademiaSelecionada}
										class="text-red-600 focus:ring-red-500 bg-zinc-800 border-zinc-700"
									/>
									<div class="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
										{#if ac.logo_url}
											<img src={ac.logo_url} alt={ac.nome} class="w-full h-full object-contain" />
										{:else}
											<Building2 class="w-4 h-4 text-zinc-500" />
										{/if}
									</div>
									<span class="text-sm font-bold">{ac.nome_fantasia || ac.nome}</span>
								</label>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Opção: Lembrar de mim (Persistência vs. Inatividade de 2h) -->
				<div class="flex items-start gap-3 pt-1">
					<div class="flex items-center h-5">
						<input
							id="lembrar"
							name="lembrar"
							type="checkbox"
							class="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-red-600 focus:ring-red-500 focus:ring-offset-zinc-950 transition-colors cursor-pointer"
						/>
					</div>
					<div class="text-xs">
						<label for="lembrar" class="font-medium text-zinc-300 cursor-pointer select-none">
							Lembrar de mim neste dispositivo (7 dias)
						</label>
						<p class="text-zinc-500 mt-0.5">
							Desmarque se estiver em computador compartilhado ou recepção (expira em 2h de inatividade).
						</p>
					</div>
				</div>

				<!-- Botão de Login -->
				<div>
					<button
						type="submit"
						disabled={carregando || transicaoAtiva}
						class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 active:scale-[0.99] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
					>
						{#if carregando || transicaoAtiva}
							<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
							<span>Carregando Academia...</span>
						{:else}
							<span>Entrar na Academia</span>
							<ArrowRight class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</form>

			<!-- Rodapé de Segurança -->
			<div class="mt-6 pt-6 border-t border-zinc-900 flex items-center justify-center gap-2 text-xs text-zinc-500">
				<ShieldCheck class="w-4 h-4 text-zinc-600" />
				<span>Plataforma Multi-Tenant SGT • Ambiente Isolado</span>
			</div>
		</div>

		<div class="text-center mt-6 flex items-center justify-center gap-4">
			<a href="/" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
				← Voltar para a página inicial
			</a>
			{#if dojoPersonalizado}
				<span class="text-zinc-700">•</span>
				<a href="/login" class="text-xs text-amber-400/80 hover:text-amber-300 transition-colors font-mono">
					Acessar Portal Geral SGT
				</a>
			{/if}
		</div>
	</div>
</div>
