<script lang="ts">
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Shield,
		Users,
		Award,
		Calendar,
		Database,
		CheckCircle2,
		ArrowRight,
		Dumbbell
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
	<title>Hinodê - Sistema de Gestão de Dojos</title>
</svelte:head>

<main class="min-h-screen bg-black text-zinc-100 flex flex-col justify-between">
	<!-- Navbar Minimalista -->
	<header class="border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<!-- Emblema do Judô Hinodê -->
				<div class="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
					<div class="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
					<span class="w-3.5 h-3.5 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.7)]"></span>
				</div>
				<div>
					<span class="font-display font-extrabold text-xl tracking-tight text-white block leading-none">
						HINODÊ
					</span>
					<span class="text-[10px] tracking-widest text-zinc-400 font-mono uppercase block mt-1">
						SaaS de Gestão de Dojos
					</span>
				</div>
			</div>

			<nav class="flex items-center gap-4">
				<a
					href="/login"
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
				>
					<span>Acessar Dojo</span>
					<ArrowRight class="w-4 h-4" />
				</a>
			</nav>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="max-w-7xl mx-auto px-6 py-16 lg:py-24 flex-1 flex flex-col justify-center">
		<div class="max-w-3xl mb-12">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-300 mb-6">
				<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
				<span>Sistema Oficial de Gestão para Dojos de Judô</span>
			</div>

			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6 font-display">
				A disciplina do tatame refletida na gestão da sua <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">academia</span>.
			</h1>

			<p class="text-lg sm:text-xl text-zinc-400 font-normal leading-relaxed">
				Plataforma SaaS multi-tenant desenvolvida para federações e academias de Judô de alto rendimento.
				Controle de atletas, graduações imutáveis, turmas e competições esportivas com isolamento total de dados.
			</p>
		</div>

		<!-- Grid de Módulos e Demonstração do Design System -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
			<!-- Card 1: Graduações -->
			<div class="p-6 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors">
				<div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 mb-4">
					<Award class="w-5 h-5" />
				</div>
				<h3 class="text-lg font-bold text-white mb-2">Graduações Imutáveis</h3>
				<p class="text-sm text-zinc-400 mb-4 leading-relaxed">
					Trilha histórica protegida no MySQL contra alterações ou deleções acidentais.
				</p>
				<!-- Demonstração de Badges -->
				<div class="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-900">
					{#each faixasExemplo as item}
						<BadgeFaixa faixa={item.faixa} dan={item.dan} size="sm" />
					{/each}
				</div>
			</div>

			<!-- Card 2: Isolamento Multi-Tenant -->
			<div class="p-6 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors">
				<div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 mb-4">
					<Shield class="w-5 h-5" />
				</div>
				<h3 class="text-lg font-bold text-white mb-2">Segurança & Multi-Tenant</h3>
				<p class="text-sm text-zinc-400 mb-4 leading-relaxed">
					Isolamento manual estrito por <code class="text-red-400 font-mono text-xs">id_academia</code> em todas as queries e sessões stateless protegidas por hash.
				</p>
				<div class="space-y-2 pt-2 border-t border-zinc-900 text-xs text-zinc-400">
					<div class="flex items-center gap-2">
						<CheckCircle2 class="w-4 h-4 text-emerald-500" />
						<span>RBAC Acumulativo por Tenant</span>
					</div>
					<div class="flex items-center gap-2">
						<CheckCircle2 class="w-4 h-4 text-emerald-500" />
						<span>Proteção LGPD & Logs Insert-Only</span>
					</div>
				</div>
			</div>

			<!-- Card 3: Campeonatos & Atletas -->
			<div class="p-6 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors">
				<div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 mb-4">
					<Users class="w-5 h-5" />
				</div>
				<h3 class="text-lg font-bold text-white mb-2">Atletas & Campeonatos</h3>
				<p class="text-sm text-zinc-400 mb-4 leading-relaxed">
					Gestão pedagógica com vínculo a professor responsável e inscrições técnicas ou competitivas com registro de vitórias.
				</p>
				<div class="space-y-2 pt-2 border-t border-zinc-900 text-xs text-zinc-400">
					<div class="flex items-center gap-2">
						<CheckCircle2 class="w-4 h-4 text-emerald-500" />
						<span>Cálculo de Menoridade no Servidor</span>
					</div>
					<div class="flex items-center gap-2">
						<CheckCircle2 class="w-4 h-4 text-emerald-500" />
						<span>Controle de Lutas e Pódios</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Status Técnico da Stack -->
		<div class="p-6 rounded-xl bg-zinc-950/60 border border-zinc-900">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
						<Database class="w-4 h-4" />
					</div>
					<div>
						<span class="text-xs font-mono uppercase text-zinc-500">Esquema Ativo</span>
						<p class="text-sm font-semibold text-white">hinode_db (MySQL 8.0.16+ / V4)</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2 text-xs font-mono">
					<span class="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">SvelteKit 3</span>
					<span class="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">TypeScript</span>
					<span class="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">Tailwind CSS v4</span>
					<span class="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">mysql2/promise</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-zinc-900 py-8 text-center text-xs text-zinc-600">
		<div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
			<p>© 2026 Judô Hinodê. Todos os direitos reservados.</p>
			<p>Projeto Acadêmico SaaS — Centro Universitário Impacta</p>
		</div>
	</footer>
</main>
