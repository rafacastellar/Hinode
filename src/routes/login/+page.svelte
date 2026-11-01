<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import hinodeEmblema from '#lib/assets/hinode-emblema.svg';
	import { Lock, Mail, Building2, AlertCircle, ArrowRight, ShieldCheck, Clock, Eye, EyeOff } from '@lucide/svelte';

	interface FormState {
		erro?: string;
		email?: string;
		precisaSelecionarAcademia?: boolean;
		academias?: Array<{ id_academia: number; nome: string; nome_fantasia: string | null }>;
	}

	let { data, form }: { data: PageData; form: FormState | null } = $props();

	let carregando = $state(false);
	let emailValor = $state('');
	let senhaValor = $state('');
	let mostrarSenha = $state(false);
	let idAcademiaSelecionada = $state<number | null>(null);

	$effect(() => {
		if (form?.email) {
			emailValor = form.email;
		}
		if (form?.academias && form.academias.length > 0 && !idAcademiaSelecionada) {
			idAcademiaSelecionada = form.academias[0].id_academia;
		}
	});
</script>

<svelte:head>
	<title>Entrar no Dojo - Judô Hinodê</title>
</svelte:head>

<div class="min-h-screen bg-black text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
	<!-- Glow de fundo sutil Hinodê (Sol Nascente) -->
	<div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

	<div class="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
		<!-- Emblema Institucional 3D Metálico & Vetorial -->
		<a href="/" class="inline-flex flex-col items-center gap-3 mb-6 group">
			<div class="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:border-red-600/70 shadow-[0_0_30px_rgba(220,38,38,0.25)]">
				<img
					src="/img/hinode-3d.jpg"
					alt="Emblema 3D Judô Hinodê"
					class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					onerror={(e) => {
						const target = e.currentTarget as HTMLImageElement;
						target.src = hinodeEmblema;
					}}
				/>
			</div>
			<div class="text-center">
				<span class="font-display font-extrabold text-2xl tracking-tight text-white block leading-none">
					JUDÔ HINODÊ
				</span>
				<span class="text-[10px] tracking-widest text-amber-400/90 font-mono uppercase block mt-1.5">
					日の出 • Gestão Oficial de Dojos
				</span>
			</div>
		</a>

		<h2 class="text-2xl font-bold tracking-tight text-white font-display">
			Acesso ao Tatame Digital
		</h2>
		<p class="mt-2 text-sm text-zinc-400">
			Informe suas credenciais para entrar na plataforma do seu dojo
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
					return async ({ update }) => {
						carregando = false;
						await update();
					};
				}}
				class="space-y-6"
			>
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
							placeholder="atleta@hinode.com.br"
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
					<div class="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
						<div class="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
							<Building2 class="w-4 h-4 text-red-500" />
							<span>Selecione a Academia (Tenant)</span>
						</div>
						<p class="text-xs text-zinc-400">
							Você possui vínculo com mais de um dojo. Escolha em qual deseja se conectar:
						</p>

						<div class="space-y-2 pt-1">
							{#each form.academias as ac}
								<label class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors {idAcademiaSelecionada === ac.id_academia ? 'bg-red-950/20 border-red-600 text-white' : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-zinc-700'}">
									<input
										type="radio"
										name="idAcademia"
										value={ac.id_academia}
										bind:group={idAcademiaSelecionada}
										class="text-red-600 focus:ring-red-500 bg-zinc-800 border-zinc-700"
									/>
									<span class="text-sm font-medium">{ac.nome_fantasia || ac.nome}</span>
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
						disabled={carregando}
						class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 active:scale-[0.99] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{#if carregando}
							<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
							<span>Autenticando...</span>
						{:else}
							<span>Entrar no Dojo</span>
							<ArrowRight class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</form>

			<!-- Rodapé de Segurança -->
			<div class="mt-6 pt-6 border-t border-zinc-900 flex items-center justify-center gap-2 text-xs text-zinc-500">
				<ShieldCheck class="w-4 h-4 text-zinc-600" />
				<span>Autenticação Stateless & Multi-Tenant Isolado</span>
			</div>
		</div>

		<div class="text-center mt-6">
			<a href="/" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
				← Voltar para a página inicial
			</a>
		</div>
	</div>
</div>
