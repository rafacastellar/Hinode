<script lang="ts">
	import type { LayoutProps } from "./$types";
	import BadgePerfil from "#lib/components/ui/BadgePerfil.svelte";
	import BadgeFaixa from "#lib/components/ui/BadgeFaixa.svelte";
	import ToastContainer from "#lib/components/ui/ToastContainer.svelte";
	import hinodeEmblema from "#lib/assets/hinode-emblema.svg";
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
		PanelLeftOpen,
		MapPin,
		KeyRound,
		ChevronDown,
	} from "@lucide/svelte";
	import { page } from "$app/state";

	let { data, children }: LayoutProps = $props();

	let menuAberto = $state(false);
	let sidebarMinimizada = $state(false);

	$effect(() => {
		if (typeof window !== "undefined") {
			const salvo = localStorage.getItem("hinode_sidebar_minimizada");
			if (salvo !== null) {
				sidebarMinimizada = salvo === "true";
			}
		}
	});

	function alternarSidebar() {
		sidebarMinimizada = !sidebarMinimizada;
		if (typeof window !== "undefined") {
			localStorage.setItem(
				"hinode_sidebar_minimizada",
				String(sidebarMinimizada),
			);
		}
	}

	function normalizarPapel(texto: string): string {
		return texto
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.trim();
	}

	const mapaIcones: Record<string, any> = {
		dashboard: LayoutDashboard,
		users: Users,
		calendar: Calendar,
		award: Award,
		trophy: Trophy,
		settings: Settings,
		"users-cog": UserCog,
		user: User,
		"heart-handshake": HeartHandshake,
	};

	// Visão ativa atualmente resolvida na página ou pelo perfil padrão de maior autoridade
	const visaoAtivaAtual = $derived.by(() => {
		const daPagina = (page.data as Record<string, any>)?.visaoAtiva as
			| string
			| undefined;
		if (daPagina) return daPagina;

		const visaoUrl = page.url.searchParams.get("visao");
		if (visaoUrl) return normalizarPapel(visaoUrl);

		const perfisNorm = data.perfis.map(normalizarPapel);
		if (perfisNorm.includes("admin")) return "admin";
		if (perfisNorm.includes("professor")) return "professor";
		if (perfisNorm.includes("recepcao")) return "recepcao";
		if (perfisNorm.includes("aluno")) return "aluno";
		if (perfisNorm.includes("responsavel")) return "responsavel";
		return "admin";
	});

	const configContextoRota = $derived.by(() => {
		const caminho = page.url.pathname;

		if (caminho === "/dashboard") {
			switch (visaoAtivaAtual) {
				case "aluno":
					return {
						titulo: "Portal do Judoca",
						corTexto: "text-red-400",
					};
				case "professor":
					return {
						titulo: "Tatame do Sensei",
						corTexto: "text-amber-400",
					};
				case "recepcao":
					return {
						titulo: "Secretaria & Recepção",
						corTexto: "text-sky-400",
					};
				case "responsavel":
					return {
						titulo: "Espaço da Família",
						corTexto: "text-emerald-400",
					};
				default:
					return {
						titulo: "Painel Administrativo",
						corTexto: "text-red-400",
					};
			}
		}

		if (caminho.startsWith("/dashboard/alunos")) {
			return { titulo: "Alunos & Judocas", corTexto: "text-red-400" };
		}
		if (caminho.startsWith("/dashboard/turmas")) {
			return { titulo: "Turmas & Treinos", corTexto: "text-amber-400" };
		}
		if (caminho.startsWith("/dashboard/graduacoes")) {
			return { titulo: "Graduações & Faixas", corTexto: "text-red-400" };
		}
		if (caminho.startsWith("/dashboard/campeonatos")) {
			return {
				titulo: "Campeonatos & Torneios",
				corTexto: "text-amber-400",
			};
		}
		if (caminho.startsWith("/dashboard/perfil")) {
			return { titulo: "Meu Perfil", corTexto: "text-red-400" };
		}
		if (caminho.startsWith("/dashboard/responsavel")) {
			return {
				titulo: "Perfil do Responsável",
				corTexto: "text-emerald-400",
			};
		}
		if (caminho.startsWith("/dashboard/usuarios")) {
			return { titulo: "Equipe & Usuários", corTexto: "text-sky-400" };
		}
		if (caminho.startsWith("/dashboard/configuracoes")) {
			return {
				titulo: "Configurações do Dojo",
				corTexto: "text-zinc-300",
			};
		}

		const itemMenuAtivo = data.itensMenu.find((item) =>
			rotaAtiva(item.href),
		);
		return {
			titulo: itemMenuAtivo?.titulo || "Painel Administrativo",
			corTexto: "text-red-400",
		};
	});

	// Faixa unificada (Obi oficial) exibida com destaque na barra superior para Aluno e/ou Professor,
	// mantendo a mesma faixa em todos os perfis e páginas acessadas
	const faixaUnificadaUsuario = $derived(
		data.resumoCredenciais?.aluno?.graduacaoAtual ||
			data.resumoCredenciais?.professor?.grauFaixa ||
			null,
	);

	const senseiDoUsuario = $derived(
		data.resumoCredenciais?.aluno?.nomeSensei || null,
	);

	// Sub-menus dinâmicos do item "Meu Perfil" na Sidebar Lateral
	const subMenusPerfil = $derived.by(() => {
		const perfisNorm = data.perfis.map(normalizarPapel);
		const temAluno = perfisNorm.includes("aluno") || Boolean(data.resumoCredenciais?.aluno);
		const temFichaOuVinculo =
			temAluno ||
			perfisNorm.includes("professor") ||
			perfisNorm.includes("responsavel") ||
			Boolean(data.resumoCredenciais?.professor) ||
			Boolean(data.totalDependentes && data.totalDependentes > 0);

		const lista: Array<{ chave: string; titulo: string; icone: any }> = [
			{ chave: "dados", titulo: "Dados & Contato", icone: User },
			{ chave: "endereco", titulo: "Endereço", icone: MapPin },
		];

		if (temFichaOuVinculo) {
			lista.push({
				chave: "tecnico",
				titulo: "Ficha Técnica & Vínculos",
				icone: Award,
			});
		}

		if (temAluno) {
			lista.push({
				chave: "frequencia",
				titulo: "Frequência no Tatame",
				icone: Calendar,
			});
		}

		lista.push({
			chave: "seguranca",
			titulo: "Segurança & Senha",
			icone: KeyRound,
		});

		return lista;
	});

	const abaPerfilAtiva = $derived(
		page.url.searchParams.get("aba") || "dados",
	);

	function rotaAtiva(href: string): boolean {
		const caminhoAtual = page.url.pathname;
		if (href === "/dashboard") {
			return caminhoAtual === "/dashboard";
		}
		return caminhoAtual.startsWith(href);
	}
</script>

<svelte:head>
	<title>{data.nomeAcademia || "Judô Hinodê"} - Gestão do Dojo</title>
</svelte:head>

<div class="min-h-screen bg-black text-zinc-100 flex flex-col lg:flex-row">
	<!-- ========================================================================= -->
	<!-- SIDEBAR DESKTOP (Fixa à esquerda com suporte a Minimização)               -->
	<!-- ========================================================================= -->
	<aside
		class="hidden lg:flex lg:flex-col {sidebarMinimizada
			? 'lg:w-20'
			: 'lg:w-72'} bg-zinc-950 border-r border-zinc-900 shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out z-20"
	>
		<!-- Header da Sidebar: Logo da Academia & Identidade Visual SGT -->
		<div
			class="{sidebarMinimizada
				? 'p-3.5'
				: 'p-5'} border-b border-zinc-900/80 transition-all"
		>
			{#if !sidebarMinimizada}
				<div class="flex items-center justify-between gap-2.5">
					<a
						href="/dashboard"
						class="flex items-center gap-3 group min-w-0 flex-1"
						title={data.nomeAcademia || "Dojo Principal"}
					>
						<div
							class="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center relative overflow-hidden transition-all group-hover:border-red-600/60 shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
						>
							{#if data.logoAcademia}
								<img
									src={data.logoAcademia}
									alt="Logo {data.nomeAcademia || 'Academia'}"
									class="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
									onerror={(e) => {
										const target =
											e.currentTarget as HTMLImageElement;
										target.src = hinodeEmblema;
									}}
								/>
							{:else}
								<Building2 class="w-5 h-5 text-red-500" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<span
								class="font-display font-extrabold text-sm sm:text-base tracking-tight text-white block leading-snug line-clamp-2 uppercase group-hover:text-amber-400 transition-colors"
								title={data.nomeAcademia || "Dojo Principal"}
							>
								{data.nomeAcademia || "Dojo Principal"}
							</span>
							<span
								class="text-[9px] font-mono tracking-wider text-amber-400/90 uppercase block mt-0.5 truncate"
							>
								SGT • Gestão de Tatame
							</span>
						</div>
					</a>

					<button
						type="button"
						onclick={alternarSidebar}
						class="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
						title="Minimizar menu lateral"
						aria-label="Minimizar menu lateral"
					>
						<PanelLeftClose class="w-4 h-4" />
					</button>
				</div>

				<!-- Card Informativo da Plataforma SaaS & Tenant Ativo -->
				<div
					class="mt-3.5 px-3 py-1.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400"
				>
					<span class="flex items-center gap-1.5">
						<span
							class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
						></span>
						<span class="text-zinc-300">Plataforma SGT</span>
					</span>
					<span class="text-zinc-500"
						>Unidade <strong class="text-amber-400 font-bold"
							>#{data.idAcademia}</strong
						></span
					>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3">
					<a
						href="/dashboard"
						class="group flex flex-col items-center"
						title="{data.nomeAcademia || 'Academia'} - Início"
					>
						<div
							class="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center relative overflow-hidden transition-all group-hover:border-red-600/60 shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
						>
							{#if data.logoAcademia}
								<img
									src={data.logoAcademia}
									alt="Logo {data.nomeAcademia || 'Academia'}"
									class="w-full h-full object-contain rounded-xl"
									onerror={(e) => {
										const target =
											e.currentTarget as HTMLImageElement;
										target.src = hinodeEmblema;
									}}
								/>
							{:else}
								<Building2 class="w-5 h-5 text-red-500" />
							{/if}
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
		<nav
			class="flex-1 {sidebarMinimizada
				? 'px-2'
				: 'px-4'} py-6 space-y-1.5 overflow-y-auto"
			aria-label="Navegação Principal"
		>
			{#if !sidebarMinimizada}
				<div
					class="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500"
				>
					Módulos do Sistema
				</div>
			{/if}

			{#each data.itensMenu as item}
				{@const Icone = mapaIcones[item.icone] || LayoutDashboard}
				{@const ativo = rotaAtiva(item.href)}
				{@const ehItemPerfil = item.href === "/dashboard/perfil"}

				<div class="space-y-1">
					<a
						href={item.href}
						title={sidebarMinimizada ? item.titulo : undefined}
						class="flex items-center {sidebarMinimizada
							? 'justify-center p-2.5'
							: 'justify-between gap-3 px-3 py-2.5'} rounded-xl text-xs font-medium transition-all group relative {ativo
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

						{#if ehItemPerfil && !sidebarMinimizada}
							<ChevronDown
								class="w-3.5 h-3.5 shrink-0 transition-transform duration-200 {ativo
									? 'rotate-0 text-red-400'
									: '-rotate-90 text-zinc-600 group-hover:text-zinc-400'}"
							/>
						{:else if item.badge}
							{#if sidebarMinimizada}
								<span
									class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full {item.badgeUrgente
										? 'bg-red-500 ring-2 ring-red-400 animate-pulse'
										: 'bg-red-500'}"
									title="{item.titulo}: {item.badge}"
								></span>
							{:else}
								{#if item.badgeUrgente}
									<span
										class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white shrink-0 shadow-[0_0_12px_rgba(220,38,38,0.7)] animate-pulse flex items-center gap-1.5"
									>
										<span
											class="w-1.5 h-1.5 rounded-full bg-white"
										></span>
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

					<!-- Sub-menus de Meu Perfil na Sidebar (Exibidos quando a rota /dashboard/perfil está ativa) -->
					{#if ehItemPerfil && ativo && !sidebarMinimizada}
						<div
							class="ml-4 pl-3 border-l border-zinc-800/90 space-y-1 py-1 animate-in slide-in-from-top-1 duration-200"
						>
							{#each subMenusPerfil as sub}
								{@const SubIcone = sub.icone}
								{@const subAtivo = abaPerfilAtiva === sub.chave}
								<a
									href="/dashboard/perfil?aba={sub.chave}"
									class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all {subAtivo
										? 'bg-zinc-900 border border-red-800/60 text-red-300 font-semibold shadow-sm'
										: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'}"
								>
									<SubIcone
										class="w-3.5 h-3.5 shrink-0 {subAtivo
											? 'text-red-400'
											: 'text-zinc-500'}"
									/>
									<span class="truncate">{sub.titulo}</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</nav>
	</aside>

	<!-- ========================================================================= -->
	<!-- TOPBAR MOBILE & DRAWER RESPONSIVO COM OTIMIZAÇÕES MOBILE                  -->
	<!-- ========================================================================= -->
	<header
		class="lg:hidden border-b border-zinc-900 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-3.5 h-16 flex items-center justify-between gap-2.5"
	>
		<div class="flex items-center gap-2.5 min-w-0 flex-1">
			<!-- Botão Hamburger -->
			<button
				type="button"
				onclick={() => (menuAberto = !menuAberto)}
				class="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white shrink-0 active:scale-95 transition-all"
				aria-label="Abrir menu de navegação"
			>
				{#if menuAberto}
					<X class="w-5 h-5" />
				{:else}
					<Menu class="w-5 h-5" />
				{/if}
			</button>

			<!-- Identidade da Academia no Topo Mobile (Sem cortar) -->
			<a
				href="/dashboard"
				class="flex items-center gap-3 min-w-0 flex-1 group"
				title={data.nomeAcademia || "Academia"}
			>
				<div
					class="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_12px_rgba(220,38,38,0.18)] group-hover:border-amber-500/50 transition-colors"
				>
					{#if data.logoAcademia}
						<img
							src={data.logoAcademia}
							alt={data.nomeAcademia || "Academia"}
							class="w-full h-full object-contain rounded-lg"
						/>
					{:else}
						<Building2 class="w-5 h-5 text-red-500" />
					{/if}
				</div>
				<div class="min-w-0 flex-1">
					<span
						class="font-display font-extrabold text-xs sm:text-sm tracking-tight text-white block leading-snug line-clamp-1 uppercase group-hover:text-amber-400 transition-colors"
					>
						{data.nomeAcademia || "Academia"}
					</span>
					<div
						class="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400"
					>
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"
						></span>
						<span class="text-amber-400/90 font-semibold truncate"
							>SGT</span
						>
						<span class="text-zinc-600">•</span>
						<span class="text-zinc-500">#{data.idAcademia}</span>
					</div>
				</div>
			</a>
		</div>

		<!-- Ações Rápidas Mobile: Avatar do Usuário e Botão Logout -->
		<div class="flex items-center gap-1.5 shrink-0">
			{#if data.totalAcoesPendentes && data.totalAcoesPendentes > 0}
				<span
					class="w-6 h-6 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse shadow-sm"
					title="{data.totalAcoesPendentes} Ação Pendente"
				>
					{data.totalAcoesPendentes}
				</span>
			{/if}

			<a
				href="/dashboard/perfil"
				class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold font-mono text-zinc-200"
				title="Perfil ({data.usuario?.nome})"
			>
				{data.usuario?.nome?.charAt(0).toUpperCase()}
			</a>

			<form action="/logout" method="POST">
				<button
					type="submit"
					class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 active:scale-95 transition-all cursor-pointer"
					title="Encerrar Sessão"
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
				onkeydown={(e) => e.key === "Escape" && (menuAberto = false)}
				role="button"
				tabindex="0"
				aria-label="Fechar menu"
			></div>

			<!-- Painel Lateral Deslizante -->
			<div
				class="relative w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-900 h-full flex flex-col z-10"
			>
				<!-- Cabeçalho do Drawer com Logo e Nome Completo da Academia -->
				<div
					class="p-5 border-b border-zinc-900 flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-3 min-w-0 flex-1">
						<div
							class="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
						>
							{#if data.logoAcademia}
								<img
									src={data.logoAcademia}
									alt={data.nomeAcademia || "Academia"}
									class="w-full h-full object-contain rounded-xl"
								/>
							{:else}
								<Building2 class="w-5 h-5 text-red-500" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<span
								class="font-display font-extrabold text-sm text-white block leading-snug line-clamp-2 uppercase"
							>
								{data.nomeAcademia || "Academia"}
							</span>
							<span
								class="text-[9px] font-mono text-amber-400/90 uppercase block mt-0.5"
							>
								SGT • Gestão de Tatame
							</span>
						</div>
					</div>
					<button
						type="button"
						onclick={() => (menuAberto = false)}
						class="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white shrink-0 active:scale-95 transition-all"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<!-- Badge de Status do Dojo no Drawer -->
				<div
					class="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-900 flex items-center justify-between text-[11px] font-mono"
				>
					<span class="text-zinc-400 flex items-center gap-1.5">
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"
						></span>
						<span>Tenant Ativo</span>
					</span>
					<span class="text-amber-400 font-bold"
						>Unidade #{data.idAcademia}</span
					>
				</div>

				<!-- Links Mobile -->
				<nav class="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
					<div
						class="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500"
					>
						Navegação
					</div>
					{#each data.itensMenu as item}
						{@const Icone =
							mapaIcones[item.icone] || LayoutDashboard}
						{@const ativo = rotaAtiva(item.href)}
						{@const ehItemPerfil = item.href === "/dashboard/perfil"}

						<div class="space-y-1">
							<a
								href={item.href}
								onclick={() => !ehItemPerfil && (menuAberto = false)}
								class="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-xs font-medium {ativo
									? 'bg-red-950/40 border border-red-800/70 text-white font-semibold'
									: 'text-zinc-400 hover:text-white hover:bg-zinc-900'}"
							>
								<div class="flex items-center gap-3">
									<Icone
										class="w-4 h-4 {ativo
											? 'text-red-500'
											: 'text-zinc-500'}"
									/>
									<span>{item.titulo}</span>
								</div>
								{#if ehItemPerfil}
									<ChevronDown
										class="w-3.5 h-3.5 transition-transform duration-200 {ativo
											? 'rotate-0 text-red-400'
											: '-rotate-90 text-zinc-600'}"
									/>
								{:else if item.badge}
									{#if item.badgeUrgente}
										<span
											class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.7)] animate-pulse flex items-center gap-1.5"
										>
											<span
												class="w-1.5 h-1.5 rounded-full bg-white"
											></span>
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

							{#if ehItemPerfil && ativo}
								<div class="ml-4 pl-3 border-l border-zinc-800/90 space-y-1 py-1">
									{#each subMenusPerfil as sub}
										{@const SubIcone = sub.icone}
										{@const subAtivo = abaPerfilAtiva === sub.chave}
										<a
											href="/dashboard/perfil?aba={sub.chave}"
											onclick={() => (menuAberto = false)}
											class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all {subAtivo
												? 'bg-zinc-900 border border-red-800/60 text-red-300 font-semibold'
												: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'}"
										>
											<SubIcone
												class="w-3.5 h-3.5 shrink-0 {subAtivo
													? 'text-red-400'
													: 'text-zinc-500'}"
											/>
											<span class="truncate">{sub.titulo}</span>
										</a>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</nav>

				<!-- Rodapé Mobile com Usuário & Logout -->
				<div
					class="p-4 border-t border-zinc-900 bg-zinc-950/95 space-y-3"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-3 min-w-0 flex-1">
							<div
								class="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold font-mono text-zinc-200 shrink-0"
							>
								{data.usuario?.nome?.charAt(0).toUpperCase()}
							</div>
							<div class="min-w-0 flex-1">
								<div
									class="text-xs text-white font-bold truncate leading-tight"
								>
									{data.usuario?.nome}
								</div>
								<div
									class="text-[10px] text-zinc-500 font-mono truncate"
								>
									{data.usuario?.email}
								</div>
							</div>
						</div>
						{#if faixaUnificadaUsuario}
							<BadgeFaixa
								faixa={faixaUnificadaUsuario}
								size="sm"
							/>
						{/if}
					</div>

					<div class="flex flex-wrap gap-1.5">
						{#each data.perfis as perfil}
							{@const chavePerfil = normalizarPapel(perfil)}
							<BadgePerfil
								{perfil}
								tamanho="sm"
								href="/dashboard?visao={chavePerfil}"
								ativo={page.url.pathname === "/dashboard" &&
									visaoAtivaAtual === chavePerfil}
								onclick={() => (menuAberto = false)}
							/>
						{/each}
					</div>

					<form action="/logout" method="POST">
						<button
							type="submit"
							class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 active:scale-95 transition-all"
						>
							<LogOut class="w-3.5 h-3.5" />
							<span>Encerrar Sessão</span>
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
		<!-- Topbar Desktop Minimalista com Identidade, Faixa em Destaque & Controle de Visualização -->
		<div
			class="hidden lg:flex min-h-20 lg:h-24 border-b border-zinc-900/80 bg-zinc-950/40 backdrop-blur-md px-6 sm:px-8 items-center justify-between gap-4 sticky top-0 z-30"
		>
			<!-- Lado Esquerdo: Destaque da Academia + Rota Acessada + Sensei -->
			<div class="flex items-center gap-4 min-w-0 flex-1">
				<!-- Destaque Especial da Academia na Topbar Superior -->
				<div class="flex items-center gap-4 min-w-0">
					<!-- Logo Ampliado da Academia na barra superior -->
					<a
						href="/dashboard"
						class="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_18px_rgba(220,38,38,0.22)] hover:border-red-600/60 transition-all group"
						title={data.nomeAcademia || "Academia"}
					>
						{#if data.logoAcademia}
							<img
								src={data.logoAcademia}
								alt={data.nomeAcademia || "Academia"}
								class="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
								onerror={(e) => {
									const target =
										e.currentTarget as HTMLImageElement;
									target.src = hinodeEmblema;
								}}
							/>
						{:else}
							<Building2 class="w-6 h-6 text-red-500" />
						{/if}
					</a>

					<!-- Breadcrumb, Rota Atual & Sensei -->
					<div class="flex flex-col min-w-0">
						<div
							class="flex items-center gap-2 text-xs text-zinc-400 font-mono flex-wrap"
						>
							<span
								class="text-white font-extrabold tracking-tight text-sm uppercase truncate max-w-[240px] xl:max-w-[340px]"
								title={data.nomeAcademia || "Dojo"}
							>
								{data.nomeAcademia || "Dojo"}
							</span>
							<span class="text-zinc-600">/</span>
							<span
								class="{configContextoRota.corTexto} font-semibold uppercase tracking-wider text-[11px]"
							>
								{configContextoRota.titulo}
							</span>

							{#if data.totalAcoesPendentes && data.totalAcoesPendentes > 0}
								<span class="text-zinc-600">•</span>
								<span
									class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-600/20 border border-red-500/60 text-red-300 flex items-center gap-1.5 animate-pulse"
								>
									<span
										class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"
									></span>
									<span
										>{data.totalAcoesPendentes} Pendente</span
									>
								</span>
							{/if}
						</div>

						<!-- Subtítulo enxuto sem quebrar a barra -->
						{#if senseiDoUsuario || (data.totalDependentes && data.totalDependentes > 0)}
							<div
								class="flex items-center gap-2 text-[10px] font-mono text-zinc-400 tracking-wider uppercase mt-0.5 truncate"
							>
								{#if senseiDoUsuario}
									<span
										>Sensei: <strong class="text-zinc-200"
											>{senseiDoUsuario}</strong
										></span
									>
								{/if}
								{#if senseiDoUsuario && data.totalDependentes && data.totalDependentes > 0}
									<span class="text-zinc-700">•</span>
								{/if}
								{#if data.totalDependentes && data.totalDependentes > 0}
									<span class="text-emerald-400/90"
										>{data.totalDependentes}
										{data.totalDependentes === 1
											? "Tutelado"
											: "Tutelados"}</span
									>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Painel do Usuário Logado, Faixa Unificada em Destaque & Controle de Visualização (Topo Direito) -->
			<div class="flex items-center gap-3.5 sm:gap-4 shrink-0">
				<!-- Destaque da Faixa Oficial do Judoca / Sensei (Mantida em todos os perfis) -->
				{#if faixaUnificadaUsuario}
					<a
						href="/dashboard/perfil"
						class="flex items-center p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-amber-500/40 transition-all shadow-sm"
						title="Graduação oficial no tatame ({faixaUnificadaUsuario})"
					>
						<BadgeFaixa faixa={faixaUnificadaUsuario} size="md" />
					</a>

					<div class="w-px h-8 bg-zinc-800/80"></div>
				{/if}

				<!-- Identificação do Usuário (Avatar + Nome + Email + Botões de Controle de Visualização) -->
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
							<span
								class="text-[10px] text-zinc-500 font-mono hidden xl:inline truncate max-w-[180px]"
							>
								({data.usuario?.email})
							</span>
						</div>

						<!-- Botões de Controle de Visualização do Painel por Perfil -->
						<div
							class="flex items-center gap-1.5 mt-1 flex-wrap"
							role="group"
							aria-label="Alternar visualização do painel por perfil"
						>
							{#each data.perfis as perfil}
								{@const chavePerfil = normalizarPapel(perfil)}
								<BadgePerfil
									{perfil}
									tamanho="sm"
									href="/dashboard?visao={chavePerfil}"
									ativo={page.url.pathname === "/dashboard" &&
										visaoAtivaAtual === chavePerfil}
								/>
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
						<LogOut
							class="w-3.5 h-3.5 text-zinc-500 hover:text-red-400"
						/>
						<span class="hidden sm:inline font-medium"
							>Encerrar Sessão</span
						>
					</button>
				</form>
			</div>
		</div>

		<!-- Conteúdo Específico da Rota -->
		<div class="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
			{@render children()}
		</div>
	</main>

	<!-- Notificações Flutuantes Globais (Toasts) -->
	<ToastContainer />
</div>
