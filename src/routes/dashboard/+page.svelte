<script lang="ts">
	import type { PageData } from './$types';
	import { LogOut, Building, Shield, User, Award, CheckCircle2 } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Painel do Dojo - Judô Hinodê</title>
</svelte:head>

<div class="min-h-screen bg-black text-zinc-100">
	<!-- Topbar do Dashboard -->
	<header class="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40">
		<div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
					<span class="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
				</div>
				<div>
					<span class="font-display font-bold text-sm tracking-tight text-white block leading-none">
						{data.nomeAcademia || 'Judô Hinodê'}
					</span>
					<span class="text-[10px] font-mono text-zinc-500 uppercase">
						Tenant ID: #{data.idAcademia}
					</span>
				</div>
			</div>

			<div class="flex items-center gap-4">
				<div class="text-right hidden sm:block">
					<span class="text-xs font-semibold text-white block leading-none">
						{data.usuario?.nome}
					</span>
					<span class="text-[11px] text-zinc-500">
						{data.usuario?.email}
					</span>
				</div>

				<form action="/logout" method="POST">
					<button
						type="submit"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-colors"
					>
						<LogOut class="w-3.5 h-3.5" />
						<span>Sair</span>
					</button>
				</form>
			</div>
		</div>
	</header>

	<!-- Conteúdo Principal -->
	<main class="max-w-7xl mx-auto px-6 py-10">
		<!-- Card de Boas-Vindas da Sessão -->
		<div class="p-8 rounded-2xl bg-zinc-950 border border-zinc-900 mb-8">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div>
					<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-900 text-xs font-medium text-emerald-300 mb-3">
						<CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
						<span>Sessão Stateless Autenticada com Sucesso</span>
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">
						Olá, {data.usuario?.nome}
					</h1>
					<p class="text-sm text-zinc-400 mt-1">
						Você está conectado ao dojo <strong class="text-zinc-200">{data.nomeAcademia}</strong>.
					</p>
				</div>

				<!-- Papéis Acumulativos do Usuário no Tenant -->
				<div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 shrink-0">
					<span class="text-xs font-mono uppercase text-zinc-500 block mb-2">
						Perfis Ativos na Academia:
					</span>
					<div class="flex flex-wrap gap-1.5">
						{#if data.perfis && data.perfis.length > 0}
							{#each data.perfis as perfil}
								<span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-950/40 border border-red-800/80 text-red-200">
									{perfil}
								</span>
							{/each}
						{:else}
							<span class="text-xs text-zinc-500 italic">Nenhum perfil específico</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Status dos Módulos das Próximas Fases -->
		<h2 class="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 font-mono">
			Próximas Fases do Roadmap
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="p-5 rounded-xl bg-zinc-950 border border-zinc-900">
				<div class="flex items-center gap-3 mb-2 text-zinc-300">
					<Building class="w-4 h-4 text-red-500" />
					<span class="text-sm font-bold text-white">Fase 3: Layout & RBAC</span>
				</div>
				<p class="text-xs text-zinc-500 leading-relaxed">
					Sidebar responsiva e controle de acesso visual por perfil.
				</p>
			</div>

			<div class="p-5 rounded-xl bg-zinc-950 border border-zinc-900">
				<div class="flex items-center gap-3 mb-2 text-zinc-300">
					<User class="w-4 h-4 text-red-500" />
					<span class="text-sm font-bold text-white">Fase 4: Gestão de Alunos</span>
				</div>
				<p class="text-xs text-zinc-500 leading-relaxed">
					Cadastro, responsáveis legais e professor supervisor.
				</p>
			</div>

			<div class="p-5 rounded-xl bg-zinc-950 border border-zinc-900">
				<div class="flex items-center gap-3 mb-2 text-zinc-300">
					<Award class="w-4 h-4 text-red-500" />
					<span class="text-sm font-bold text-white">Fase 5: Turmas & Treinos</span>
				</div>
				<p class="text-xs text-zinc-500 leading-relaxed">
					Grade semanal, alocação e presenças no tatame.
				</p>
			</div>

			<div class="p-5 rounded-xl bg-zinc-950 border border-zinc-900">
				<div class="flex items-center gap-3 mb-2 text-zinc-300">
					<Shield class="w-4 h-4 text-red-500" />
					<span class="text-sm font-bold text-white">Fase 6: Graduações ACID</span>
				</div>
				<p class="text-xs text-zinc-500 leading-relaxed">
					Troca atômica de faixa e histórico imutável.
				</p>
			</div>
		</div>
	</main>
</div>
