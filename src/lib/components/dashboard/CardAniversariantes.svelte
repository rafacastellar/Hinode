<script lang="ts">
	import type { AniversarianteItem } from '#lib/server/repositorios/dashboard.repo';
	import { Cake, Calendar, Sparkles } from '@lucide/svelte';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';

	let { aniversariantes = [] }: { aniversariantes: AniversarianteItem[] } = $props();
</script>

<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-sm space-y-4">
	<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
		<div class="flex items-center gap-2.5">
			<div
				class="w-8 h-8 rounded-lg bg-pink-950/40 border border-pink-800/60 flex items-center justify-center text-pink-400"
			>
				<Cake class="w-4 h-4 text-pink-400" />
			</div>
			<div>
				<h2 class="text-sm font-bold text-white font-display flex items-center gap-2">
					<span>Aniversariantes da Semana</span>
					{#if aniversariantes.length > 0}
						<span
							class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-950/60 border border-pink-800 text-pink-300"
						>
							{aniversariantes.length}
						</span>
					{/if}
				</h2>
				<p class="text-[11px] text-zinc-500">Próximos 7 dias no dojo</p>
			</div>
		</div>
		<span
			class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400"
		>
			🎂 Equipe
		</span>
	</div>

	{#if aniversariantes.length === 0}
		<div class="py-6 text-center space-y-2">
			<div
				class="w-10 h-10 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600"
			>
				<Calendar class="w-5 h-5" />
			</div>
			<p class="text-xs text-zinc-400 font-medium">Nenhum aniversariante nos próximos 7 dias</p>
			<p class="text-[11px] text-zinc-600">Avisaremos aqui assim que a data de um judoca estiver próxima.</p>
		</div>
	{:else}
		<div class="space-y-2.5">
			{#each aniversariantes as aniv (aniv.id_usuario)}
				<div
					class="p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 {aniv.dias_restantes === 0
						? 'bg-pink-950/30 border-pink-700/70 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
						: 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'}"
				>
					<div class="flex items-center gap-3 min-w-0">
						<div
							class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-xs {aniv.dias_restantes === 0
								? 'bg-pink-600 text-white shadow-md'
								: 'bg-zinc-800 text-zinc-300'}"
						>
							{#if aniv.dias_restantes === 0}
								🎉
							{:else}
								🎂
							{/if}
						</div>
						<div class="min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-xs font-bold text-white truncate max-w-[170px]" title={aniv.nome}>
									{aniv.nome}
								</span>
								{#if aniv.faixa}
									<BadgeFaixa faixa={aniv.faixa} size="sm" />
								{/if}
							</div>
							<div class="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
								<span class="font-mono text-zinc-300">{aniv.dia_mes}</span>
								<span>•</span>
								<span class="text-zinc-500 font-mono">completa {aniv.idade_completando} anos</span>
							</div>
						</div>
					</div>

					<div class="shrink-0 text-right">
						{#if aniv.dias_restantes === 0}
							<span
								class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-pink-500 text-white animate-pulse shadow-md"
							>
								<Sparkles class="w-3 h-3" />
								<span>É Hoje!</span>
							</span>
						{:else if aniv.dias_restantes === 1}
							<span
								class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950/60 border border-amber-800 text-amber-300"
							>
								Amanhã
							</span>
						{:else}
							<span
								class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400"
							>
								Em {aniv.dias_restantes} dias
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
