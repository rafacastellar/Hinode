<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import {
		Activity,
		Building2,
		Users,
		LogOut,
		ExternalLink,
		Server,
		ShieldCheck
	} from '@lucide/svelte';

	let { data, children }: LayoutProps = $props();

	function rotaAtiva(href: string): boolean {
		const caminhoAtual = page.url.pathname;
		if (href === '/saas-admin') {
			return caminhoAtual === '/saas-admin';
		}
		return caminhoAtual.startsWith(href);
	}
</script>

{#if page.url.pathname === '/saas-admin/login'}
	{@render children()}
{:else}
	<div class="min-h-screen bg-black text-zinc-100 flex flex-col lg:flex-row">
		<!-- SIDEBAR CONTROL PLANE SAAS (Tema Indigo/Violeta/Dourado Minimalista) -->
		<aside class="w-full lg:w-72 bg-zinc-950 border-r border-zinc-900 shrink-0 flex flex-col z-20">
			<!-- Header com Logo SGT Manager -->
			<div class="p-6 border-b border-zinc-900">
				<a href="/saas-admin" class="flex items-center gap-3.5 group">
					<div class="w-11 h-11 rounded-2xl bg-zinc-900 border border-amber-500/40 p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center overflow-hidden shrink-0">
						<img
							src="/img/logo-sgt.jpg"
							alt="Logo SGT Manager"
							class="w-full h-full object-contain rounded-xl"
						/>
					</div>
					<div class="min-w-0 flex-1">
						<span class="font-display font-extrabold text-base tracking-wide text-white block leading-tight">
							SGT MANAGER
						</span>
						<span class="text-[9px] font-mono tracking-widest text-amber-400 font-bold uppercase block mt-1">
							心・技・体 • CONTROL PLANE
						</span>
					</div>
				</a>

				<div class="mt-4 p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-[11px] font-mono flex items-center justify-between text-indigo-300">
					<div class="flex items-center gap-2">
						<Server class="w-3.5 h-3.5 text-indigo-400" />
						<span>Plataforma SaaS</span>
					</div>
					<span class="px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-200 text-[10px] font-bold">
						PRODUÇÃO
					</span>
				</div>
			</div>

			<!-- Links de Navegação Global -->
			<nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
				<div class="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
					Gestão Geral do SaaS
				</div>

				<a
					href="/saas-admin"
					class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {rotaAtiva('/saas-admin') && page.url.pathname === '/saas-admin'
						? 'bg-indigo-950/50 border border-indigo-700/80 text-white font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]'
						: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent'}"
				>
					<Activity class="w-4 h-4 {rotaAtiva('/saas-admin') && page.url.pathname === '/saas-admin' ? 'text-indigo-400' : 'text-zinc-500'}" />
					<span>Monitoramento & Radar</span>
				</a>

				<a
					href="/saas-admin/academias"
					class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {rotaAtiva('/saas-admin/academias')
						? 'bg-indigo-950/50 border border-indigo-700/80 text-white font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]'
						: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent'}"
				>
					<Building2 class="w-4 h-4 {rotaAtiva('/saas-admin/academias') ? 'text-indigo-400' : 'text-zinc-500'}" />
					<span>Academias & Dojos</span>
				</a>

				<a
					href="/saas-admin/usuarios"
					class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all {rotaAtiva('/saas-admin/usuarios')
						? 'bg-indigo-950/50 border border-indigo-700/80 text-white font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)]'
						: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent'}"
				>
					<Users class="w-4 h-4 {rotaAtiva('/saas-admin/usuarios') ? 'text-indigo-400' : 'text-zinc-500'}" />
					<span>Usuários & Admins</span>
				</a>

				<div class="pt-6 px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
					Acesso Externo
				</div>

				<a
					href="/dashboard"
					target="_blank"
					class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors border border-transparent"
				>
					<div class="flex items-center gap-3">
						<ShieldCheck class="w-4 h-4 text-zinc-500" />
						<span>Abrir Dojo Hinodê</span>
					</div>
					<ExternalLink class="w-3.5 h-3.5 text-zinc-600" />
				</a>
			</nav>

			<!-- Rodapé do Super Admin -->
			<div class="p-4 border-t border-zinc-900 bg-zinc-950/60">
				<div class="flex items-center justify-between gap-3">
					<div class="min-w-0">
						<span class="text-xs font-bold text-white block truncate">
							{data.superAdmin?.nome || 'Super Admin'}
						</span>
						<span class="text-[10px] text-zinc-500 font-mono block truncate">
							{data.superAdmin?.email || 'saas@hinode.com.br'}
						</span>
					</div>

					<form action="/saas-admin/logout" method="POST">
						<button
							type="submit"
							class="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
							title="Encerrar Sessão SaaS"
						>
							<LogOut class="w-4 h-4" />
						</button>
					</form>
				</div>
			</div>
		</aside>

		<!-- CONTEÚDO PRINCIPAL DO CONTROL PLANE -->
		<main class="flex-1 min-w-0 bg-black flex flex-col">
			<div class="p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
				{@render children()}
			</div>
		</main>
	</div>
{/if}

