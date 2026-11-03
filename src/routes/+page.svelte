<script lang="ts">
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import hinodeEmblema from '#lib/assets/hinode-emblema.svg';
	import {
		Shield,
		Users,
		Award,
		Database,
		CheckCircle2,
		ArrowRight,
		Building2,
		Sparkles,
		Globe
	} from '@lucide/svelte';

	const faixasExemplo = [
		{ faixa: 'Branca', dan: null },
		{ faixa: 'Azul', dan: null },
		{ faixa: 'Amarela', dan: null },
		{ faixa: 'Verde', dan: null },
		{ faixa: 'Roxa', dan: null },
		{ faixa: 'Marrom', dan: null },
		{ faixa: 'Preta', dan: '1º Dan' },
		{ faixa: 'Coral', dan: '6º Dan' }
	];
</script>

<svelte:head>
	<title>SGT Manager • Sistema de Gestão de Tatame</title>
</svelte:head>

<main class="min-h-screen bg-black text-zinc-100 flex flex-col justify-between">
	<!-- Navbar Minimalista com Identidade SGT -->
	<header class="border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
			<div class="flex items-center gap-3.5">
				<!-- Emblema Oficial SGT Manager -->
				<div class="w-12 h-12 rounded-2xl bg-zinc-950 border border-amber-500/30 p-1 flex items-center justify-center relative overflow-hidden group shadow-[0_0_25px_rgba(245,158,11,0.2)]">
					<img
						src="/img/logo-sgt.jpg"
						alt="SGT Manager - Sistema de Gestão de Tatame"
						class="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-110"
						onerror={(e) => {
							const target = e.currentTarget as HTMLImageElement;
							target.src = hinodeEmblema;
						}}
					/>
				</div>
				<div>
					<div class="flex items-center gap-2">
						<span class="font-display font-extrabold text-xl tracking-wider text-white block leading-none">
							SGT <span class="text-amber-400">MANAGER</span>
						</span>
						<span class="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-semibold text-amber-300 uppercase">
							Multi-Dojo SaaS
						</span>
					</div>
					<span class="text-[10px] tracking-widest text-zinc-400 font-mono uppercase block mt-1">
						Sistema de Gestão de Tatame • Judô & Artes Marciais
					</span>
				</div>
			</div>

			<nav class="flex items-center gap-3">
				<a
					href="/login"
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all shadow-[0_0_25px_rgba(245,158,11,0.3)] focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
				>
					<span>Entrar no Dojo</span>
					<ArrowRight class="w-4 h-4" />
				</a>
			</nav>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="max-w-7xl mx-auto px-6 py-14 lg:py-20 flex-1 flex flex-col justify-center relative">
		<!-- Glows de ambientação -->
		<div class="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
		<div class="absolute top-1/2 right-1/4 -translate-y-1/2 w-[450px] h-[450px] bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16 relative z-10">
			<div class="lg:col-span-7">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-300 mb-6">
					<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
					<span>Plataforma SaaS Multi-Tenant para Academias & Federações</span>
				</div>

				<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6 font-display">
					A excelência do tatame na gestão da sua <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-500 to-amber-500">academia</span>.
				</h1>

				<p class="text-lg sm:text-xl text-zinc-400 font-normal leading-relaxed max-w-2xl mb-8">
					O <strong>SGT Manager</strong> conecta atletas, mestres e gestores em um ecossistema seguro.
					Graduações imutáveis, turmas, campeonatos e identidade visual personalizada para cada dojo com isolamento estrito de dados.
				</p>

				<!-- Botões de Ação Rápida -->
				<div class="flex flex-wrap items-center gap-4">
					<a
						href="/login"
						class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all shadow-[0_0_30px_rgba(245,158,11,0.35)]"
					>
						<span>Acessar Portal dos Dojos</span>
						<ArrowRight class="w-4 h-4" />
					</a>
					<a
						href="/login?dojo=hinode"
						class="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-zinc-300 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 hover:text-white transition-all"
					>
						<Building2 class="w-4 h-4 text-red-500" />
						<span>Entrar como Judô Hinodê</span>
					</a>
				</div>
			</div>

			<!-- Showcase 3D com Logo Oficial do SaaS SGT -->
			<div class="lg:col-span-5 flex justify-center lg:justify-end">
				<div class="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-zinc-950 border border-zinc-800 p-3 shadow-[0_0_60px_rgba(245,158,11,0.25)] group overflow-hidden">
					<img
						src="/img/logo-sgt.jpg"
						alt="SGT Manager - Emblema Oficial Faixa Coral e Tatame"
						class="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
						onerror={(e) => {
							const target = e.currentTarget as HTMLImageElement;
							target.src = hinodeEmblema;
						}}
					/>
					<div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-center">
						<span class="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold block">
							SGT MANAGER • TATAME PRO
						</span>
						<span class="text-[10px] text-zinc-400 font-mono">
							Identidade Própria • Multi-Tenant • Alta Performance
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Grid de Pilares do SaaS SGT -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-16 relative z-10">
			<!-- Card 1: Identidade Visual e Domínio -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 transition-colors">
				<div class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 mb-4">
					<Globe class="w-5 h-5" />
				</div>
				<h3 class="text-base font-bold text-white mb-2">Identidade Visual Própria</h3>
				<p class="text-xs text-zinc-400 mb-3 leading-relaxed">
					Cada academia personaliza seu logotipo, cores, transição de login e domínio customizado ou slug próprio.
				</p>
				<div class="text-[11px] font-mono text-amber-400/90 pt-2 border-t border-zinc-900 flex items-center gap-1.5">
					<Sparkles class="w-3.5 h-3.5" />
					<span>Upload WebP & Splash Logo</span>
				</div>
			</div>

			<!-- Card 2: Graduações Imutáveis -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-red-500/40 transition-colors">
				<div class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 mb-4">
					<Award class="w-5 h-5" />
				</div>
				<h3 class="text-base font-bold text-white mb-2">Graduações Imutáveis</h3>
				<p class="text-xs text-zinc-400 mb-3 leading-relaxed">
					Trilha histórica protegida no banco de dados contra alterações ou deleções acidentais com registro de outorga.
				</p>
				<!-- Demonstração de Badges -->
				<div class="flex flex-wrap gap-1 pt-2 border-t border-zinc-900">
					{#each faixasExemplo.slice(0, 5) as item}
						<BadgeFaixa faixa={item.faixa} dan={item.dan} size="sm" />
					{/each}
				</div>
			</div>

			<!-- Card 3: Isolamento Multi-Tenant & Radar -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-colors">
				<div class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 mb-4">
					<Shield class="w-5 h-5" />
				</div>
				<h3 class="text-base font-bold text-white mb-2">Segurança & Radar Ativo</h3>
				<p class="text-xs text-zinc-400 mb-3 leading-relaxed">
					Isolamento estrito por <code class="text-amber-400 font-mono text-[11px]">id_academia</code>, radar de sessões ativas e painel Super Admin unificado.
				</p>
				<div class="space-y-1.5 pt-2 border-t border-zinc-900 text-[11px] text-zinc-400">
					<div class="flex items-center gap-1.5">
						<CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
						<span>RBAC Acumulativo</span>
					</div>
					<div class="flex items-center gap-1.5">
						<CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
						<span>Encerramento Remoto de Sessão</span>
					</div>
				</div>
			</div>

			<!-- Card 4: Campeonatos & Atletas -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-colors">
				<div class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 mb-4">
					<Users class="w-5 h-5" />
				</div>
				<h3 class="text-base font-bold text-white mb-2">Atletas & Campeonatos</h3>
				<p class="text-xs text-zinc-400 mb-3 leading-relaxed">
					Gestão pedagógica de turmas, controle de presenças, súmulas de campeonatos e cálculo de menoridade automático.
				</p>
				<div class="space-y-1.5 pt-2 border-t border-zinc-900 text-[11px] text-zinc-400">
					<div class="flex items-center gap-1.5">
						<CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
						<span>Chaves & Pódios Oficiais</span>
					</div>
					<div class="flex items-center gap-1.5">
						<CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
						<span>Proteção LGPD Nativa</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Status Técnico da Stack do SaaS -->
		<div class="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-900 relative z-10">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
						<Database class="w-4 h-4" />
					</div>
					<div>
						<span class="text-[11px] font-mono uppercase text-zinc-500">Arquitetura da Plataforma SaaS</span>
						<p class="text-sm font-semibold text-white">SGT Manager Engine • MySQL 8 Multi-Tenant & Stateless Sessions</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2 text-xs font-mono">
					<span class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">SvelteKit 3</span>
					<span class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">TypeScript</span>
					<span class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">Tailwind CSS v4</span>
					<span class="px-2.5 py-1 rounded-lg bg-zinc-900 border border-amber-500/30 text-amber-400 font-bold">SGT Tatame Pro</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-zinc-900 py-8 text-center text-xs text-zinc-500">
		<div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<span class="font-extrabold text-white">SGT MANAGER</span>
				<span>•</span>
				<span>Sistema de Gestão de Tatame</span>
			</div>
			<p>© 2026 Plataforma SGT. Projeto Acadêmico SaaS — Centro Universitário Impacta.</p>
		</div>
	</footer>
</main>