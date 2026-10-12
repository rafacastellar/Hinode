<script lang="ts">
	interface Props {
		faixa: string;
		dan?: string | number | null;
		size?: 'sm' | 'md' | 'lg';
		showTip?: boolean;
	}

	let { faixa = 'Branca', dan = null, size = 'md', showTip = true }: Props = $props();

	// Normaliza para comparação insensível a maiúsculas/minúsculas e acentos
	const faixaNormalizada = $derived(
		faixa
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim()
	);

	const estilosPorFaixa = $derived.by(() => {
		switch (true) {
			case faixaNormalizada.includes('branca'):
				return {
					bg: 'bg-white',
					text: 'text-zinc-950 font-semibold',
					border: 'border-zinc-300',
					tipColor: 'bg-zinc-800',
					label: 'Branca'
				};
			case faixaNormalizada.includes('cinza'):
				return {
					bg: 'bg-zinc-400',
					text: 'text-zinc-950 font-semibold',
					border: 'border-zinc-500',
					tipColor: 'bg-zinc-800',
					label: 'Cinza'
				};
			case faixaNormalizada.includes('azul'):
				return {
					bg: 'bg-sky-600',
					text: 'text-white font-semibold',
					border: 'border-sky-400/40',
					tipColor: 'bg-zinc-900',
					label: 'Azul'
				};
			case faixaNormalizada.includes('amarel'):
				return {
					bg: 'bg-amber-400',
					text: 'text-zinc-950 font-semibold',
					border: 'border-amber-500',
					tipColor: 'bg-zinc-900',
					label: 'Amarela'
				};
			case faixaNormalizada.includes('laranja'):
				return {
					bg: 'bg-orange-500',
					text: 'text-white font-semibold',
					border: 'border-orange-600',
					tipColor: 'bg-zinc-900',
					label: 'Laranja'
				};
			case faixaNormalizada.includes('verde'):
				return {
					bg: 'bg-emerald-600',
					text: 'text-white font-semibold',
					border: 'border-emerald-500',
					tipColor: 'bg-zinc-900',
					label: 'Verde'
				};
			case faixaNormalizada.includes('roxa'):
				return {
					bg: 'bg-purple-600',
					text: 'text-white font-semibold',
					border: 'border-purple-500',
					tipColor: 'bg-zinc-900',
					label: 'Roxa'
				};
			case faixaNormalizada.includes('marrom'):
				return {
					bg: 'bg-amber-950',
					text: 'text-amber-100 font-semibold',
					border: 'border-amber-800',
					tipColor: 'bg-zinc-950',
					label: 'Marrom'
				};
			case faixaNormalizada.includes('coral') || faixaNormalizada.includes('vermelha e branca'):
				return {
					bg: 'bg-gradient-to-r from-red-600 via-white to-red-600',
					text: 'text-zinc-950 font-bold',
					border: 'border-red-700',
					tipColor: 'bg-red-700',
					label: 'Coral'
				};
			case faixaNormalizada.includes('vermelh'):
				return {
					bg: 'bg-red-600',
					text: 'text-white font-bold',
					border: 'border-red-500',
					tipColor: 'bg-zinc-950',
					label: 'Vermelha'
				};
			case faixaNormalizada.includes('pret'):
			default:
				return {
					bg: 'bg-zinc-950',
					text: 'text-zinc-100 font-semibold',
					border: 'border-zinc-800 ring-1 ring-red-600/60',
					tipColor: 'bg-red-600',
					label: 'Preta'
				};
		}
	});

	const tamanhoClasses = $derived.by(() => {
		switch (size) {
			case 'sm':
				return 'text-xs px-2 py-0.5 gap-1.5';
			case 'lg':
				return 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold';
			case 'md':
			default:
				return 'text-xs px-2.5 py-1 gap-2 font-medium';
		}
	});
</script>

<span
	class="inline-flex items-center rounded-md border shadow-sm transition-all duration-150 select-none {estilosPorFaixa.bg} {estilosPorFaixa.text} {estilosPorFaixa.border} {tamanhoClasses}"
>
	{#if showTip}
		<!-- Ponta técnica com a tarja da faixa -->
		<span
			class="h-2.5 w-1 rounded-xs shrink-0 {estilosPorFaixa.tipColor}"
			title="Ponta técnica"
		></span>
	{/if}
	<span>{faixa}</span>
	{#if dan}
		<span class="text-[10px] font-bold uppercase tracking-wider opacity-90">
			({dan})
		</span>
	{/if}
</span>
