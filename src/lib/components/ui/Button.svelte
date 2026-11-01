<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Loader2 } from '@lucide/svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		loading?: boolean;
		disabled?: boolean;
		fullWidth?: boolean;
		title?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		href,
		loading = false,
		disabled = false,
		fullWidth = false,
		title,
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const classesVariante = $derived.by(() => {
		switch (variant) {
			case 'primary':
				return 'bg-red-600 hover:bg-red-700 text-white border border-red-500/40 shadow-[0_0_20px_rgba(220,38,38,0.25)] focus:ring-2 focus:ring-red-500';
			case 'secondary':
				return 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 hover:border-zinc-700 focus:ring-2 focus:ring-zinc-600';
			case 'danger':
				return 'bg-red-950/60 hover:bg-red-900/70 text-red-200 border border-red-800/80 focus:ring-2 focus:ring-red-500';
			case 'ghost':
			default:
				return 'bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white border border-transparent';
		}
	});

	const classesTamanho = $derived.by(() => {
		switch (size) {
			case 'sm':
				return 'px-3 py-1.5 text-xs rounded-lg gap-1.5 min-h-[34px]';
			case 'lg':
				return 'px-6 py-3 text-sm rounded-xl gap-2.5 min-h-[46px]';
			case 'md':
			default:
				return 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2 min-h-[40px]';
		}
	});
</script>

{#if href}
	<a
		{href}
		{title}
		class="inline-flex items-center justify-center font-semibold transition-all active:scale-95 focus:outline-none select-none {classesVariante} {classesTamanho} {fullWidth ? 'w-full' : ''} {disabled ? 'opacity-50 pointer-events-none' : ''} {className}"
	>
		{@render children()}
	</a>
{:else}
	<button
		{type}
		{title}
		disabled={disabled || loading}
		{onclick}
		class="inline-flex items-center justify-center font-semibold transition-all active:scale-95 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none {classesVariante} {classesTamanho} {fullWidth ? 'w-full' : ''} {className}"
	>
		{#if loading}
			<Loader2 class="w-4 h-4 animate-spin shrink-0" />
		{/if}
		{@render children()}
	</button>
{/if}

