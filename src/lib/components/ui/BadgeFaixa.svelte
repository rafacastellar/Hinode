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

	// Determina o número do Dan (1 a 10) para exibir os riscos (graus) na faixa
	const numeroDan = $derived.by(() => {
		if (dan !== null && dan !== undefined && dan !== '') {
			const n = parseInt(String(dan).replace(/\D/g, ''), 10);
			if (!isNaN(n) && n > 0 && n <= 10) return n;
		}
		const f = faixaNormalizada;
		if (f.includes('shodan') || f.includes('1 dan') || f.includes('1o dan')) return 1;
		if (f.includes('nidan') || f.includes('2 dan') || f.includes('2o dan')) return 2;
		if (f.includes('sandan') || f.includes('3 dan') || f.includes('3o dan')) return 3;
		if (f.includes('yondan') || f.includes('4 dan') || f.includes('4o dan')) return 4;
		if (f.includes('godan') || f.includes('5 dan') || f.includes('5o dan')) return 5;
		if (f.includes('rokudan') || f.includes('6 dan') || f.includes('6o dan')) return 6;
		if (f.includes('shichidan') || f.includes('nanadan') || f.includes('7 dan') || f.includes('7o dan')) return 7;
		if (f.includes('hachidan') || f.includes('8 dan') || f.includes('8o dan')) return 8;
		if (f.includes('kudan') || f.includes('9 dan') || f.includes('9o dan')) return 9;
		if (f.includes('judan') || f.includes('10 dan') || f.includes('10o dan')) return 10;
		const match = faixa.match(/(\d+)\s*[ºo°]?\s*dan/i);
		if (match) return parseInt(match[1], 10);
		return 0;
	});

	const estilosPorFaixa = $derived.by(() => {
		switch (true) {
			case faixaNormalizada.includes('branca'):
				return {
					bg: 'bg-white',
					text: 'text-zinc-950 font-semibold',
					border: 'border-zinc-300',
					tipColor: 'bg-zinc-800',
					tipDanBg: 'bg-zinc-800 border border-zinc-700',
					riscoCor: 'bg-white',
					label: 'Branca'
				};
			case faixaNormalizada.includes('cinza'):
				return {
					bg: 'bg-zinc-400',
					text: 'text-zinc-950 font-semibold',
					border: 'border-zinc-500',
					tipColor: 'bg-zinc-800',
					tipDanBg: 'bg-zinc-800 border border-zinc-700',
					riscoCor: 'bg-white',
					label: 'Cinza'
				};
			case faixaNormalizada.includes('azul'):
				return {
					bg: 'bg-sky-600',
					text: 'text-white font-semibold',
					border: 'border-sky-400/40',
					tipColor: 'bg-zinc-900',
					tipDanBg: 'bg-zinc-900 border border-zinc-800',
					riscoCor: 'bg-white',
					label: 'Azul'
				};
			case faixaNormalizada.includes('amarel'):
				return {
					bg: 'bg-amber-400',
					text: 'text-zinc-950 font-semibold',
					border: 'border-amber-500',
					tipColor: 'bg-zinc-900',
					tipDanBg: 'bg-zinc-900 border border-zinc-800',
					riscoCor: 'bg-white',
					label: 'Amarela'
				};
			case faixaNormalizada.includes('laranja'):
				return {
					bg: 'bg-orange-500',
					text: 'text-white font-semibold',
					border: 'border-orange-600',
					tipColor: 'bg-zinc-900',
					tipDanBg: 'bg-zinc-900 border border-zinc-800',
					riscoCor: 'bg-white',
					label: 'Laranja'
				};
			case faixaNormalizada.includes('verde'):
				return {
					bg: 'bg-emerald-600',
					text: 'text-white font-semibold',
					border: 'border-emerald-500',
					tipColor: 'bg-zinc-900',
					tipDanBg: 'bg-zinc-900 border border-zinc-800',
					riscoCor: 'bg-white',
					label: 'Verde'
				};
			case faixaNormalizada.includes('roxa'):
				return {
					bg: 'bg-purple-600',
					text: 'text-white font-semibold',
					border: 'border-purple-500',
					tipColor: 'bg-zinc-900',
					tipDanBg: 'bg-zinc-900 border border-zinc-800',
					riscoCor: 'bg-white',
					label: 'Roxa'
				};
			case faixaNormalizada.includes('marrom'):
				return {
					bg: 'bg-amber-950',
					text: 'text-amber-100 font-semibold',
					border: 'border-amber-800',
					tipColor: 'bg-zinc-950',
					tipDanBg: 'bg-zinc-950 border border-zinc-800',
					riscoCor: 'bg-white',
					label: 'Marrom'
				};
			case faixaNormalizada.includes('coral') ||
				faixaNormalizada.includes('kodansha') ||
				faixaNormalizada.includes('kodancha') ||
				faixaNormalizada.includes('vermelha e branca') ||
				((faixaNormalizada.includes('6') ||
					faixaNormalizada.includes('7') ||
					faixaNormalizada.includes('8')) &&
					faixaNormalizada.includes('dan')) ||
				faixaNormalizada.includes('rokudan') ||
				faixaNormalizada.includes('nanadan') ||
				faixaNormalizada.includes('shichidan') ||
				faixaNormalizada.includes('hachidan'):
				return {
					// Faixa Kodansha / Coral com blocos sólidos sem degradê: vermelho | branco | vermelho
					bg: 'bg-[linear-gradient(90deg,#dc2626_0_33.33%,#ffffff_33.33%_66.66%,#dc2626_66.66%_100%)]',
					text: 'text-zinc-950 font-black tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]',
					border: 'border-red-700 shadow-sm',
					tipColor: 'bg-zinc-950',
					tipDanBg: 'bg-zinc-950 border border-zinc-800',
					riscoCor: 'bg-white',
					label: 'Kodansha'
				};
			case (faixaNormalizada.includes('vermelh') && !faixaNormalizada.includes('branca')) ||
				((faixaNormalizada.includes('9') || faixaNormalizada.includes('10')) &&
					faixaNormalizada.includes('dan')) ||
				faixaNormalizada.includes('kudan') ||
				faixaNormalizada.includes('judan'):
				return {
					bg: 'bg-red-600',
					text: 'text-white font-black tracking-wide',
					border: 'border-red-500 ring-1 ring-red-400/50 shadow-sm',
					tipColor: 'bg-zinc-950',
					tipDanBg: 'bg-zinc-950 border border-zinc-800',
					riscoCor: 'bg-white',
					label: 'Vermelha'
				};
			case faixaNormalizada.includes('pret'):
			default:
				return {
					bg: 'bg-zinc-950',
					text: 'text-zinc-100 font-semibold',
					border: 'border-zinc-800 ring-1 ring-red-600/60',
					tipColor: 'bg-red-600',
					tipDanBg: 'bg-red-600 border border-red-700',
					riscoCor: 'bg-white',
					label: 'Preta'
				};
		}
	});

	const tamanhoClasses = $derived.by(() => {
		switch (size) {
			case 'sm':
				return 'text-xs px-2 py-0.5 gap-1.5 font-medium';
			case 'lg':
				return 'text-sm px-4 py-2 gap-2.5 font-bold';
			case 'md':
			default:
				return 'text-xs sm:text-[13px] px-3 py-1.5 gap-2 font-bold shadow-xs';
		}
	});
</script>

<span
	class="inline-flex items-center rounded-md border shadow-sm transition-all duration-150 select-none {estilosPorFaixa.bg} {estilosPorFaixa.text} {estilosPorFaixa.border} {tamanhoClasses}"
>
	{#if numeroDan > 0}
		<!-- Tarja com riscos oficiais para cada Dan -->
		<span
			class="inline-flex items-center gap-[2px] px-1.5 py-0.5 rounded-xs shrink-0 {estilosPorFaixa.tipDanBg}"
			title="{numeroDan}º Dan ({numeroDan} {numeroDan === 1 ? 'risco' : 'riscos'})"
		>
			{#each Array(numeroDan) as _}
				<span
					class="w-[2px] {size === 'lg' ? 'h-4' : size === 'md' ? 'h-3.5' : 'h-2.5'} {estilosPorFaixa.riscoCor} rounded-xs shrink-0 shadow-xs"
				></span>
			{/each}
		</span>
	{:else if showTip}
		<!-- Ponta técnica com a tarja da faixa -->
		<span
			class="{size === 'lg' ? 'h-3.5 w-1.5' : size === 'md' ? 'h-3.5 w-1.5' : 'h-2.5 w-1'} rounded-xs shrink-0 {estilosPorFaixa.tipColor}"
			title="Ponta técnica"
		></span>
	{/if}
	<span>{faixa}</span>
</span>
