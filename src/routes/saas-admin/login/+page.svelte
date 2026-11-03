<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff } from '@lucide/svelte';

	let { form }: { form: ActionData } = $props();

	let carregando = $state(false);
	let emailValor = $state('');
	let senhaValor = $state('');
	let mostrarSenha = $state(false);

	$effect(() => {
		if (form?.email) {
			emailValor = form.email;
		}
	});
</script>

<svelte:head>
	<title>SGT Manager • Acesso Control Plane SaaS</title>
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
	<!-- Glow de fundo sutil temático SGT (Ouro / Âmbar / Indigo) -->
	<div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

	<div class="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
		<!-- Logotipo Oficial SGT Manager -->
		<div class="inline-flex flex-col items-center gap-3 mb-6">
			<div class="w-24 h-24 rounded-3xl bg-zinc-900 border border-amber-500/40 p-2 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex items-center justify-center overflow-hidden">
				<img
					src="/img/logo-sgt.jpg"
					alt="Logo SGT Manager"
					class="w-full h-full object-contain rounded-2xl"
				/>
			</div>
			<div>
				<span class="font-display font-extrabold text-2xl tracking-wider text-white block leading-none">
					SGT MANAGER
				</span>
				<span class="text-[11px] tracking-widest text-amber-400 font-mono uppercase block mt-1.5 font-bold">
					心・技・体 • CONTROL PLANE SAAS
				</span>
			</div>
		</div>

		<h2 class="text-xl font-bold tracking-tight text-white font-display">
			Administração Geral da Plataforma
		</h2>
		<p class="mt-1 text-xs text-zinc-400 font-mono">
			Acesso restrito exclusivamente aos Super Administradores
		</p>
	</div>

	<div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
		<div class="bg-zinc-900/90 backdrop-blur-md py-8 px-6 sm:px-10 border border-zinc-800 rounded-2xl shadow-2xl">
			{#if form?.erro}
				<div class="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-start gap-3">
					<ShieldAlert class="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
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
				class="space-y-5"
			>
				<div>
					<label for="email" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono">
						E-mail do Super Admin
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
							placeholder="saas@hinode.com.br"
							class="block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors font-mono"
						/>
					</div>
				</div>

				<div>
					<label for="senha" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono">
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
							class="block w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors font-mono"
						/>
						<button
							type="button"
							onclick={() => (mostrarSenha = !mostrarSenha)}
							class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
							title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
						>
							{#if mostrarSenha}
								<EyeOff class="w-4 h-4" />
							{:else}
								<Eye class="w-4 h-4" />
							{/if}
						</button>
					</div>
				</div>

				<div class="pt-2">
					<button
						type="submit"
						disabled={carregando}
						class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-amber-500 active:scale-[0.99] transition-all shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{#if carregando}
							<span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
							<span>Autenticando...</span>
						{:else}
							<span>Entrar no Control Plane</span>
							<ArrowRight class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</form>

			<div class="mt-6 pt-5 border-t border-zinc-800/80 text-center">
				<a href="/login" class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono">
					← Ir para o Login dos Dojos (/login)
				</a>
			</div>
		</div>
	</div>
</div>

