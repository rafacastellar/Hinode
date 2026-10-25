<script lang="ts">
	import type { LayoutProps } from './$types';
	import BadgePerfil from '#lib/components/ui/BadgePerfil.svelte';
	import {
		LayoutDashboard,
		Users,
		Calendar,
		Award,
		Trophy,
		Settings,
		UserCog,
		User,
		LogOut,
		Menu,
		X,
		Building2,
		ChevronRight,
		HeartHandshake,
		PanelLeftClose,
		PanelLeftOpen
	} from '@lucide/svelte';
	import { page } from '$app/state';

	let { data, children }: LayoutProps = $props();

	let menuAberto = $state(false);
	let sidebarMinimizada = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const salvo = localStorage.getItem('hinode_sidebar_minimizada');
			if (salvo !== null) {
				sidebarMinimizada = salvo === 'true';
			}
		}
	});

	function alternarSidebar() {
		sidebarMinimizada = !sidebarMinimizada;
		if (typeof window !== 'undefined') {
			localStorage.setItem('hinode_sidebar_minimizada', String(sidebarMinimizada));
		}
	}

	const mapaIcones: Record<string, any> = {
		dashboard: LayoutDashboard,
		users: Users,
		calendar: Calendar,
		award: Award,
		trophy: Trophy,
		settings: Settings,
		'users-cog': UserCog,
		user: User,
		'heart-handshake': HeartHandshake
	};

	const ehApenasAluno = $derived(
		data.perfis.some((p) => p.toLowerCase() === 'aluno') &&
			!data.perfis.some((p) => ['admin', 'professor', 'recepcao'].includes(p.toLowerCase()))
	);

	function rotaAtiva(href: string): boolean {
		const caminhoAtual = page.url.pathname;
		if (href === '/dashboard') {
			return caminhoAtual === '/dashboard';
		}
		return caminhoAtual.startsWith(href);
	}
</script>

<svelte:head>
	<title>{data.nomeAcademia || 'Judô Hinodê'} - Gestão do Dojo</title>
</svelte:head>

<div class="min-h-screen bg-black text-zinc-100 flex flex-col lg:flex-row">
	<!-- ========================================================================= -->
	<!-- SIDEBAR DESKTOP (Fixa à esquerda com suporte a Minimização)               -->
	<!-- ========================================================================= -->
	<aside
		class="hidden lg:flex lg:flex-col {sidebarMinimizada ? 'lg:w-20' : 'lg:w-72'} bg-zinc-950 border-r border-zinc-900 shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out z-20"
	>
		<!-- Header da Sidebar: Logo & Informações do Tenant -->
		<div class="{sidebarMinimizada ? 'p-3.5' : 'p-6'} border-b border-zinc-900/80 transition-all">
			{#if !sidebarMinimizada}
				<div class="flex items-center justify-between gap-3">
					<a href="/dashboard" class="flex items-center gap-3 group min-w-0">
						<div
							class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden transition-all group-hover:border-zinc-700 shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
						>
							<span
								class="w-3.5 h-3.5 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.9)]"
							></span>
						</div>
						<div class="min-w-0 flex-1">
							<span
								class="font-display font-extrabold text-lg tracking-tight text-white block leading-none truncate"
							>
								HINODÊ
							</span>
							<span class="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block mt-1">
								SaaS de Dojos
							</span>
						</div>
					</a>

					<button
						type="button"
						onclick={alternarSidebar}
						class="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
						title="Minimizar menu lateral"
						aria-label="Minimizar menu lateral"
					>
						<PanelLeftClose class="w-4 h-4" />
					</button>
				</div>

				<!-- Card Informativo do Dojo (Tenant Ativo) -->
				<div class="mt-5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
					<div class="flex items-center gap-2 mb-1">
						<Building2 class="w-3.5 h-3.5 text-red-500 shrink-0" />
						<span class="text-xs font-semibold text-zinc-200 truncate block">
							{data.nomeAcademia || 'Dojo Principal'}
						</span>
					</div>
					<div class="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
						<span>Isolamento Tenant</span>
						<span class="text-zinc-400 font-bold">#{data.idAcademia}</span>
					</div>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3">
					<a href="/dashboard" class="group flex flex-col items-center" title="{data.nomeAcademia || 'Judô Hinodê'} - Início">
						<div
							class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden transition-all group-hover:border-zinc-700 shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
						>
							<span
								class="w-3.5 h-3.5 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.9)]"
							></span>
						</div>
					</a>

					<button
						type="button"
						onclick={alternarSidebar}
						class="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
						title="Expandir menu lateral"
						aria-label="Expandir menu lateral"
					>
						<PanelLeftOpen class="w-4 h-4 text-zinc-300" />
					</button>
				</div>
			{/if}
		</div>

		<!-- Links de Navegação (Filtrados por RBAC) -->
		<nav class="flex-1 {sidebarMinimizada ? 'px-2' : 'px-4'} py-6 space-y-1.5 overflow-y-auto" aria-label="Navegação Principal">
			{#if !sidebarMinimizada}
				<div class="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
					Módulos do Sistema
				</div>
			{/if}

			{#each data.itensMenu as item}
				{@const Icone = mapaIcones[item.icone] || LayoutDashboard}
				{@const ativo = rotaAtiva(item.href)}

				<a
					href={item.href}
					title={sidebarMinimizada ? item.titulo : undefined}
					class="flex items-center {sidebarMinimizada ? 'justify-center p-2.5' : 'justify-between gap-3 px-3 py-2.5'} rounded-xl text-xs font-medium transition-all group relative {ativo
						? 'bg-red-950/40 border border-red-800/70 text-white font-semibold shadow-[0_0_16px_rgba(220,38,38,0.15)]'
						: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/70 border border-transparent'}"
				>
					<div class="flex items-center gap-3 min-w-0">
						<Icone
							class="w-4 h-4 shrink-0 transition-colors {ativo
								? 'text-red-500'
								: 'text-zinc-500 group-hover:text-zinc-300'}"
						/>
						{#if !sidebarMinimizada}
							<span class="truncate">{item.titulo}</span>
						{/if}
					</div>

					{#if item.badge}
						{#if sidebarMinimizada}
							<span
								class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full {item.badgeUrgente ? 'bg-red-500 ring-2 ring-red-400 animate-pulse' : 'bg-red-500'}"
								title="{item.titulo}: {item.badge}"
							></span>
						{:else}
							{#if item.badgeUrgente}
								<span
									class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0 shadow-[0_0_12px_rgba(220,38,38,0.7)] animate-pulse flex items-center gap-1.5"
								>
									<span class="w-1.5 h-1.5 rounded-full bg-white"></span>
									<span>{item.badge}</span>
								</span>
							{:else}
								<span
									class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 shrink-0"
								>
									{item.badge}
								</span>
							{/if}
						{/if}
					{/if}
				</a>
			{/each}
		</nav>
	</aside>

	<!-- ========================================================================= -->
	<!-- TOPBAR MOBILE & DRAWER -->
	<!-- ========================================================================= -->
	<header
		class="lg:hidden border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 h-16 flex items-center justify-between"
	>
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => (menuAberto = !menuAberto)}
				class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
				aria-label="Abrir menu de navegação"
			>
				{#if menuAberto}
					<X class="w-5 h-5" />
				{:else}
					<Menu class="w-5 h-5" />
				{/if}
			</button>

			<div class="flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"
				></span>
				<span class="font-display font-bold text-sm tracking-tight text-white truncate max-w-[180px]">
					{data.nomeAcademia || 'Judô Hinodê'}
				</span>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<form action="/logout" method="POST">
				<button
					type="submit"
					class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
					title="Sair"
				>
					<LogOut class="w-4 h-4" />
				</button>
			</form>
		</div>
	</header>

	<!-- Drawer Mobile (Aberto quando menuAberto = true) -->
	{#if menuAberto}
		<div class="lg:hidden fixed inset-0 z-50 flex">
			<!-- Backdrop com Blur -->
			<div
				class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
				onclick={() => (menuAberto = false)}
				onkeydown={(e) => e.key === 'Escape' && (menuAberto = false)}
				role="button"
				tabindex="0"
				aria-label="Fechar menu"
			></div>

			<!-- Painel Lateral Deslizante -->
			<div
				class="relative w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-900 h-full flex flex-col z-10"
			>
				<div class="p-5 border-b border-zinc-900 flex items-center justify-between">
					<div class="flex items-center gap-2.5">
						<span
							class="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
						></span>
						<span class="font-display font-extrabold text-base text-white">HINODÊ</span>
					</div>
					<button
						type="button"
						onclick={() => (menuAberto = false)}
						class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<!-- Links Mobile -->
				<nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
					{#each data.itensMenu as item}
						{@const Icone = mapaIcones[item.icone] || LayoutDashboard}
						{@const ativo = rotaAtiva(item.href)}

						<a
							href={item.href}
							onclick={() => (menuAberto = false)}
							class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium {ativo
								? 'bg-red-950/40 border border-red-800/70 text-white font-semibold'
								: 'text-zinc-400 hover:text-white hover:bg-zinc-900'}"
						>
							<div class="flex items-center gap-3">
								<Icone class="w-4 h-4 {ativo ? 'text-red-500' : 'text-zinc-500'}" />
								<span>{item.titulo}</span>
							</div>
							{#if item.badge}
								{#if item.badgeUrgente}
									<span
										class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.7)] animate-pulse flex items-center gap-1.5"
									>
										<span class="w-1.5 h-1.5 rounded-full bg-white"></span>
										<span>{item.badge}</span>
									</span>
								{:else}
									<span
										class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500"
									>
										{item.badge}
									</span>
								{/if}
							{/if}
						</a>
					{/each}
				</nav>

				<!-- Rodapé Mobile -->
				<div class="p-4 border-t border-zinc-900 bg-zinc-950/90">
					<div class="text-xs text-white font-medium mb-1 truncate">{data.usuario?.nome}</div>
					<div class="flex flex-wrap gap-1 mb-3">
						{#each data.perfis as perfil}
							<BadgePerfil {perfil} tamanho="sm" />
						{/each}
					</div>
					<form action="/logout" method="POST">
						<button
							type="submit"
							class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
						>
							<LogOut class="w-3.5 h-3.5" />
							<span>Sair</span>
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- CONTEÚDO PRINCIPAL (Slot das rotas filhas) -->
	<!-- ========================================================================= -->
	<main class="flex-1 min-w-0 bg-black flex flex-col">
		<!-- Topbar Desktop Minimalista -->
		<div
			class="hidden lg:flex min-h-16 lg:h-20 border-b border-zinc-900/80 bg-zinc-950/40 backdrop-blur-md px-6 sm:px-8 items-center justify-between sticky top-0 z-30"
		>
			<div class="flex items-center gap-3 min-w-0">
				<button
					type="button"
					onclick={alternarSidebar}
					class="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
					title={sidebarMinimizada ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
					aria-label={sidebarMinimizada ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
				>
					{#if sidebarMinimizada}
						<PanelLeftOpen class="w-4 h-4 text-zinc-300" />
					{:else}
						<PanelLeftClose class="w-4 h-4 text-zinc-400" />
					{/if}
				</button>

				<div class="flex items-center gap-2 text-xs text-zinc-400 font-mono flex-wrap">
					<span>Dojo</span>
					<ChevronRight class="w-3.5 h-3.5 text-zinc-600" />
					<span class="text-zinc-200 font-medium">{data.nomeAcademia}</span>
					<span class="text-zinc-600">/</span>
					<span class="text-red-400 font-semibold uppercase tracking-wider">
						{ehApenasAluno ? 'Portal do Judoca' : 'Painel Administrativo'}
					</span>
					{#if data.totalAcoesPendentes && data.totalAcoesPendentes > 0}
						<span class="text-zinc-600">•</span>
						<span
							class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-600/20 border border-red-500/60 text-red-300 flex items-center gap-1.5 animate-pulse"
						>
							<span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
							<span>{data.totalAcoesPendentes} Ação Pendente</span>
						</span>
					{/if}
				</div>
			</div>

			<!-- Painel do Usuário Logado & Logout (Topo Direito) -->
			<div class="flex items-center gap-3.5 sm:gap-4 shrink-0">
				<!-- Identificação do Usuário (Avatar + Nome + Email + Badges) -->
				<div class="flex items-center gap-3">
					<a
						href="/dashboard/perfil"
						class="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-xs font-bold font-mono text-zinc-200 transition-colors shrink-0 shadow-sm"
						title="Acessar meu perfil ({data.usuario?.email})"
					>
						{data.usuario?.nome.charAt(0).toUpperCase()}
					</a>

					<div class="text-left min-w-0">
						<div class="flex items-center gap-1.5 flex-wrap">
							<a
								href="/dashboard/perfil"
								class="text-xs font-bold text-white hover:text-red-400 transition-colors leading-tight truncate max-w-[150px] sm:max-w-[200px]"
							>
								{data.usuario?.nome}
							</a>
							<span class="text-[10px] text-zinc-500 font-mono hidden xl:inline truncate max-w-[180px]">
								({data.usuario?.email})
							</span>
						</div>

						<!-- Badges de Perfis do Usuário -->
						<div class="flex items-center gap-1 mt-1 flex-wrap">
							{#each data.perfis as perfil}
								<BadgePerfil {perfil} tamanho="sm" />
							{/each}
						</div>
					</div>
				</div>

				<div class="w-px h-8 bg-zinc-800/80 hidden sm:block"></div>

				<!-- Botão Encerrar Sessão -->
				<form action="/logout" method="POST" class="shrink-0">
					<button
						type="submit"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/60 text-xs font-medium text-zinc-400 hover:text-red-300 transition-all cursor-pointer shadow-sm active:scale-95"
						title="Encerrar Sessão"
					>
						<LogOut class="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
						<span class="hidden sm:inline font-medium">Encerrar Sessão</span>
					</button>
				</form>
			</div>
		</div>

		<!-- Conteúdo Específico da Rota -->
		<div class="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
			{@render children()}
		</div>
	</main>
</div>
