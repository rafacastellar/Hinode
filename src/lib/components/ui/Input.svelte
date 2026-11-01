<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		id: string;
		name?: string;
		label?: string;
		type?: string;
		value?: string | number;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		erro?: string | null;
		dica?: string;
		icone?: Component<any>;
		step?: string;
		min?: string | number;
		max?: string | number;
		class?: string;
		oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
	}

	let {
		id,
		name,
		label,
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		required = false,
		disabled = false,
		readonly = false,
		erro = null,
		dica,
		icone: Icone,
		step,
		min,
		max,
		class: className = '',
		oninput
	}: Props = $props();
</script>

<div class="space-y-1.5 {className}">
	{#if label}
		<label for={id} class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
			{label}
			{#if required}
				<span class="text-red-500 ml-0.5">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		{#if Icone}
			<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
				<Icone class="w-4 h-4" />
			</div>
		{/if}

		<input
			{id}
			name={name || id}
			{type}
			bind:value
			{placeholder}
			{required}
			{disabled}
			{readonly}
			{step}
			{min}
			{max}
			{oninput}
			aria-invalid={erro ? 'true' : undefined}
			aria-describedby={erro ? `${id}-erro` : dica ? `${id}-dica` : undefined}
			class="w-full bg-zinc-900/90 border {erro
				? 'border-red-600 focus:border-red-500 focus:ring-red-500/40'
				: 'border-zinc-800 focus:border-red-500 focus:ring-red-500/40'} rounded-xl {Icone
				? 'pl-10 pr-3.5'
				: 'px-3.5'} py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
		/>
	</div>

	{#if erro}
		<p id="{id}-erro" class="text-xs text-red-400 font-medium">{erro}</p>
	{:else if dica}
		<p id="{id}-dica" class="text-[11px] text-zinc-500">{dica}</p>
	{/if}
</div>

