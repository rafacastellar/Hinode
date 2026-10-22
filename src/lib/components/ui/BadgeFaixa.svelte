<script lang="ts">
	import {
		obterLegendaOficialFaixa,
		obterRotuloOficialFaixa
	} from '#lib/dominio/graduacao';

	interface Props {
		faixa: string;
		dan?: string | number | null;
		size?: 'sm' | 'md' | 'lg';
		showTip?: boolean;
		showLegend?: boolean;
		uniformWidth?: boolean;
		customWidth?: string;
	}

	let {
		faixa = 'Branca',
		dan = null,
		size = 'md',
		showTip = true,
		showLegend = false,
		uniformWidth = true,
		customWidth = ''
	}: Props = $props();

	// Normaliza para comparação insensível a maiúsculas/minúsculas e acentos
	const faixaNormalizada = $derived(
		faixa
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim()
	);

	// Determina o número do Dan (1 a 10) para exibir os riscos vermelhos oficiais na faixa
	const numeroDan = $derived.by(() => {
		if (dan !== null && dan !== undefined && dan !== '') {
			const n = parseInt(String(dan).replace(/\D/g, ''), 10);
			if (!isNaN(n) && n > 0 && n <= 10) return n;
		}
		const f = faixaNormalizada;
		if (f.includes('shodan') || f.includes('1 dan') || f.includes('1o dan')) return 1;
		if (f.includes('nidan') || f.includes('2 dan') || f.includes('2o dan')) return 2;
		if (f.includes('sandan') || f.includes('3 dan') || f.includes('3o dan')) return 3;
		if (f.includes('yondan') || f.includes('yodan') || f.includes('4 dan') || f.includes('4o dan')) return 4;
		if (f.includes('godan') || f.includes('gondan') || f.includes('5 dan') || f.includes('5o dan')) return 5;
		if (f.includes('rokudan') || f.includes('6 dan') || f.includes('6o dan')) return 6;
		if (f.includes('shichidan') || f.includes('nanadan') || f.includes('7 dan') || f.includes('7o dan')) return 7;
		if (f.includes('hachidan') || f.includes('8 dan') || f.includes('8o dan')) return 8;
		if ((f.includes('kudan') && !f.includes('rokudan')) || f.includes('9 dan') || f.includes('9o dan')) return 9;
		if (f.includes('judan') || f.includes('10 dan') || f.includes('10o dan')) return 10;
		const match = faixa.match(/(\d+)\s*[ºo°]?\s*dan/i);
		if (match) return parseInt(match[1], 10);
		return 0;
	});

	// Rótulo principal exibido dentro da faixa (conforme PDF oficial)
	const rotuloPrincipal = $derived(obterRotuloOficialFaixa(faixa));

	// Legenda detalhada exibida abaixo da faixa nas visualizações expandidas
	const legendaOficial = $derived(obterLegendaOficialFaixa(faixa, dan || numeroDan));

	const estilosPorFaixa = $derived.by(() => {
		switch (true) {
			case faixaNormalizada.includes('branca'):
				return {
					bg: 'bg-[#FFFFFF]',
					text: 'text-[#000000] font-black',
					border: 'border-zinc-300 ring-1 ring-zinc-200/50',
					isPreta: false,
					style: 'background-color: #FFFFFF; color: #000000;'
				};
			case faixaNormalizada.includes('cinza'):
				return {
					bg: 'bg-[#808080]',
					text: 'text-[#000000] font-black',
					border: 'border-[#666666]',
					isPreta: false,
					style: 'background-color: #808080; color: #000000;'
				};
			case faixaNormalizada.includes('azul claro') || faixaNormalizada.includes('azul-claro'):
				return {
					bg: 'bg-[#87CEFA]',
					text: 'text-[#000000] font-black',
					border: 'border-[#60a5fa]',
					isPreta: false,
					style: 'background-color: #87CEFA; color: #000000;'
				};
			case faixaNormalizada.includes('azul'):
				return {
					bg: 'bg-[#00208D]',
					text: 'text-[#000000] font-black',
					border: 'border-[#001769]',
					isPreta: false,
					style: 'background-color: #00208D; color: #000000;'
				};
			case faixaNormalizada.includes('amarel'):
				return {
					bg: 'bg-[#FFD700]',
					text: 'text-[#000000] font-black',
					border: 'border-[#d4af37]',
					isPreta: false,
					style: 'background-color: #FFD700; color: #000000;'
				};
			case faixaNormalizada.includes('laranja'):
				return {
					bg: 'bg-[#F26C25]',
					text: 'text-[#000000] font-black',
					border: 'border-[#c74e10]',
					isPreta: false,
					style: 'background-color: #F26C25; color: #000000;'
				};
			case faixaNormalizada.includes('verde'):
				return {
					bg: 'bg-[#009444]',
					text: 'text-[#000000] font-black',
					border: 'border-[#007033]',
					isPreta: false,
					style: 'background-color: #009444; color: #000000;'
				};
			case faixaNormalizada.includes('roxa'):
				return {
					bg: 'bg-[#662D91]',
					text: 'text-[#000000] font-black',
					border: 'border-[#4c1d6e]',
					isPreta: false,
					style: 'background-color: #662D91; color: #000000;'
				};
			case faixaNormalizada.includes('marrom'):
				return {
					bg: 'bg-[#754C24]',
					text: 'text-[#000000] font-black',
					border: 'border-[#523314]',
					isPreta: false,
					style: 'background-color: #754C24; color: #000000;'
				};
			case (faixaNormalizada.includes('vermelh') && !faixaNormalizada.includes('branca')) ||
				((faixaNormalizada.includes('9') || faixaNormalizada.includes('10')) &&
					faixaNormalizada.includes('dan')) ||
				(faixaNormalizada.includes('kudan') && !faixaNormalizada.includes('rokudan')) ||
				faixaNormalizada.includes('judan'):
				return {
					// 9º e 10º Dan (Kodansha Kudan / Judan): Faixa Vermelha Sólida Oficial (#ED1C24)
					bg: 'bg-[#ED1C24]',
					text: 'text-[#000000] font-black tracking-wide',
					border: 'border-[#b80f15] ring-1 ring-red-500/40 shadow-xs',
					isPreta: false,
					style: 'background-color: #ED1C24; color: #000000;'
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
					// Faixa Kodansha / Coral com blocos sólidos sem degradê: vermelho (#ED1C24) | branco (#FFFFFF) | vermelho (#ED1C24)
					bg: 'bg-[linear-gradient(90deg,#ED1C24_0_33.33%,#FFFFFF_33.33%_66.66%,#ED1C24_66.66%_100%)]',
					text: 'text-[#000000] font-black tracking-wide',
					border: 'border-[#b80f15] shadow-xs',
					isPreta: false,
					style: 'background: linear-gradient(90deg, #ED1C24 0% 33.33%, #FFFFFF 33.33% 66.66%, #ED1C24 66.66% 100%); color: #000000;'
				};
			case faixaNormalizada.includes('pret'):
			default:
				return {
					// Yudansha: Faixa Preta (#000000) com escrita em amarelo (#FFD700) e riscos vermelhos (#ED1C24)
					bg: 'bg-[#000000]',
					text: 'text-[#FFD700] font-black',
					border: 'border-zinc-800 ring-1 ring-zinc-700/60 shadow-xs',
					isPreta: true,
					style: 'background-color: #000000; color: #FFD700;'
				};
		}
	});

	// Largura padronizada para todas as faixas terem rigorosamente o mesmo tamanho
	const larguraContainer = $derived.by(() => {
		if (customWidth) return customWidth;
		if (!uniformWidth) return 'w-auto';
		switch (size) {
			case 'sm':
				return 'w-[155px]';
			case 'lg':
				return 'w-[235px]';
			case 'md':
			default:
				return 'w-[195px]';
		}
	});

	// Dimensões da barra física da faixa
	const dimensoesBarra = $derived.by(() => {
		switch (size) {
			case 'sm':
				return 'h-[26px] text-[10.5px] px-2';
			case 'lg':
				return 'h-[36px] text-sm px-3.5';
			case 'md':
			default:
				return 'h-[30px] text-xs px-2.5';
		}
	});

	// Altura dos riscos vermelhos para os Dans
	const dimensaoRisco = $derived.by(() => {
		switch (size) {
			case 'sm':
				return 'h-3.5';
			case 'lg':
				return 'h-5';
			case 'md':
			default:
				return 'h-4';
		}
	});
</script>

<div class="inline-flex flex-col items-center justify-center shrink-0 {larguraContainer}">
	<!-- Barra da Faixa de Judô (com mesmo tamanho em todas as ocorrências) -->
	<div
		class="w-full relative flex items-center justify-center rounded-md border shadow-xs transition-all duration-150 select-none {estilosPorFaixa.bg} {estilosPorFaixa.text} {estilosPorFaixa.border} {dimensoesBarra}"
		style={estilosPorFaixa.style}
		title={legendaOficial}
	>
		<!-- Texto Principal da Faixa (Centralizado com Alta Legibilidade) -->
		<span class="truncate tracking-wider font-black uppercase text-center block" style="color: inherit;">
			{rotuloPrincipal}
		</span>

		<!-- Riscos Vermelhos Oficiais (#ED1C24) para cada Dan na extremidade direita da faixa preta -->
		{#if numeroDan > 0 && estilosPorFaixa.isPreta}
			<div
				class="absolute right-2 top-0 bottom-0 flex items-center gap-[2.5px]"
				title="{numeroDan}º Dan ({numeroDan} {numeroDan === 1 ? 'risco vermelho' : 'riscos vermelhos'})"
			>
				{#each Array(numeroDan) as _}
					<span
						class="w-[2.5px] {dimensaoRisco} rounded-xs shadow-xs"
						style="background-color: #ED1C24;"
					></span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Legenda Oficial do Quadro (Exibida apenas na versão expandida das listas) -->
	{#if showLegend}
		<span
			class="text-[10px] font-mono font-semibold text-amber-300/95 tracking-tight text-center leading-tight mt-1 max-w-full truncate block"
			title={legendaOficial}
		>
			{legendaOficial}
		</span>
	{/if}
</div>
