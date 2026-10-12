<script lang="ts">
	import type { Component } from 'svelte';
	import { TrendingUp, TrendingDown } from '@lucide/svelte';

	interface Props {
		titulo: string;
		valor: string | number;
		descricao?: string;
		icone?: Component<any>;
		destaque?: boolean;
		tendencia?: {
			texto: string;
			positivo?: boolean;
		};
		href?: string;
	}

	let {
		titulo,
		valor,
		descricao,
		icone: Icone,
		destaque = false,
		tendencia,
		href
	}: Props = $props();
</script>

<svelte:element
	this={href ? 'a' : 'div'}
	href={href}
	class="group relative block p-5 rounded-xl transition-all duration-200 {destaque
		? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/20 border border-red-900/50 hover:border-red-700/80 shadow-[0_0_20px_rgba(220,38,38,0.08)]'
		: 'bg-zinc-950 border border-zinc-900 hover:border-zinc-800'}"
>
	<div class="flex items-start justify-between gap-3">
		<div class="space-y-1">
			<span class="text-xs font-medium font-mono uppercase tracking-wider text-zinc-400 block">
				{titulo}
			</span>
			<div class="flex items-baseline gap-2">
				<span class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					{valor}
				</span>
			</div>
		</div>

		{#if Icone}
			<div
				class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors {destaque
					? 'bg-red-950/60 border border-red-800/80 text-red-400 group-hover:bg-red-900/80 group-hover:text-red-200'
					: 'bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200'}"
			>
				<Icone class="w-5 h-5" />
			</div>
		{/if}
	</div>

	{#if descricao || tendencia}
		<div class="mt-3 pt-3 border-t border-zinc-900/80 flex items-center justify-between text-xs text-zinc-500">
			{#if descricao}
				<span>{descricao}</span>
			{/if}

			{#if tendencia}
				<span
					class="inline-flex items-center gap-1 font-mono font-medium ml-auto {tendencia.positivo
						? 'text-emerald-400'
						: 'text-zinc-400'}"
				>
					{#if tendencia.positivo}
						<TrendingUp class="w-3.5 h-3.5" />
					{:else}
						<TrendingDown class="w-3.5 h-3.5" />
					{/if}
					{tendencia.texto}
				</span>
			{/if}
		</div>
	{/if}
</svelte:element>
