<script lang="ts">
	import {
		obterLegendaOficialFaixa,
		obterRotuloOficialFaixa,
	} from "#lib/dominio/graduacao";

	interface Props {
		faixa: string;
		dan?: string | number | null;
		size?: "sm" | "md" | "lg";
		showTip?: boolean;
		showLegend?: boolean;
		uniformWidth?: boolean;
		customWidth?: string;
	}

	let {
		faixa = "Branca",
		dan = null,
		size = "md",
		showTip = true,
		showLegend = false,
		uniformWidth = true,
		customWidth = "",
	}: Props = $props();

	// Normaliza para comparação insensível a maiúsculas/minúsculas e acentos
	const faixaNormalizada = $derived(
		faixa
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.trim(),
	);

	// Determina o número do Dan (1 a 10) para exibir os riscos vermelhos oficiais na faixa
	const numeroDan = $derived.by(() => {
		if (dan !== null && dan !== undefined && dan !== "") {
			const n = parseInt(String(dan).replace(/\D/g, ""), 10);
			if (!isNaN(n) && n > 0 && n <= 10) return n;
		}
		const f = faixaNormalizada;
		if (f.includes("shodan") || f.includes("1 dan") || f.includes("1o dan"))
			return 1;
		if (f.includes("nidan") || f.includes("2 dan") || f.includes("2o dan"))
			return 2;
		if (f.includes("sandan") || f.includes("3 dan") || f.includes("3o dan"))
			return 3;
		if (
			f.includes("yondan") ||
			f.includes("yodan") ||
			f.includes("4 dan") ||
			f.includes("4o dan")
		)
			return 4;
		if (
			f.includes("godan") ||
			f.includes("gondan") ||
			f.includes("5 dan") ||
			f.includes("5o dan")
		)
			return 5;
		if (
			f.includes("rokudan") ||
			f.includes("6 dan") ||
			f.includes("6o dan")
		)
			return 6;
		if (
			f.includes("shichidan") ||
			f.includes("nanadan") ||
			f.includes("7 dan") ||
			f.includes("7o dan")
		)
			return 7;
		if (
			f.includes("hachidan") ||
			f.includes("8 dan") ||
			f.includes("8o dan")
		)
			return 8;
		if (
			(f.includes("kudan") && !f.includes("rokudan")) ||
			f.includes("9 dan") ||
			f.includes("9o dan")
		)
			return 9;
		if (
			f.includes("judan") ||
			f.includes("10 dan") ||
			f.includes("10o dan")
		)
			return 10;
		const match = faixa.match(/(\d+)\s*[ºo°]?\s*dan/i);
		if (match) return parseInt(match[1], 10);
		return 0;
	});

	// Rótulo principal exibido dentro da faixa (conforme PDF oficial)
	const rotuloPrincipal = $derived(obterRotuloOficialFaixa(faixa));

	// Legenda detalhada exibida abaixo da faixa nas visualizações expandidas
	const legendaOficial = $derived(
		obterLegendaOficialFaixa(faixa, dan || numeroDan),
	);

	const estilosPorFaixa = $derived.by(() => {
		switch (true) {
			case faixaNormalizada.includes("branca"):
				return {
					bg: "bg-[#FFFFFF]",
					text: "text-[#09090b] font-black",
					border: "border-zinc-300 ring-1 ring-zinc-200/60",
					isPreta: false,
					style: "background-color: #FFFFFF; color: #09090b;",
				};
			case faixaNormalizada.includes("cinza"):
				return {
					bg: "bg-[#9CA3AF]",
					text: "text-[#09090b] font-black",
					border: "border-zinc-500",
					isPreta: false,
					style: "background-color: #9CA3AF; color: #09090b;",
				};
			case faixaNormalizada.includes("azul claro") ||
				faixaNormalizada.includes("azul-claro") ||
				faixaNormalizada.includes("celeste"):
				return {
					bg: "bg-[#7DD3FC]",
					text: "text-[#09090b] font-black",
					border: "border-[#38BDF8]",
					isPreta: false,
					style: "background-color: #7DD3FC; color: #09090b;",
				};
			case faixaNormalizada.includes("azul"):
				return {
					bg: "bg-[#1E3A8A]",
					text: "text-[#FFFFFF] font-black",
					border: "border-[#3B82F6]/60 ring-1 ring-blue-500/20",
					isPreta: false,
					style: "background-color: #1E3A8A; color: #FFFFFF; text-shadow: 0 1px 2px rgba(0,0,0,0.6);",
				};
			case faixaNormalizada.includes("amarel"):
				return {
					bg: "bg-[#FACC15]",
					text: "text-[#09090b] font-black",
					border: "border-[#CA8A04]",
					isPreta: false,
					style: "background-color: #FACC15; color: #09090b;",
				};
			case faixaNormalizada.includes("laranja"):
				return {
					bg: "bg-[#F97316]",
					text: "text-[#09090b] font-black",
					border: "border-[#C2410C]",
					isPreta: false,
					style: "background-color: #F97316; color: #09090b;",
				};
			case faixaNormalizada.includes("verde"):
				return {
					bg: "bg-[#15803D]",
					text: "text-[#FFFFFF] font-black",
					border: "border-[#22C55E]/50 ring-1 ring-emerald-500/20",
					isPreta: false,
					style: "background-color: #15803D; color: #FFFFFF; text-shadow: 0 1px 2px rgba(0,0,0,0.6);",
				};
			case faixaNormalizada.includes("roxa"):
				return {
					bg: "bg-[#6B21A8]",
					text: "text-[#FFFFFF] font-black",
					border: "border-[#A855F7]/50 ring-1 ring-purple-500/20",
					isPreta: false,
					style: "background-color: #6B21A8; color: #FFFFFF; text-shadow: 0 1px 2px rgba(0,0,0,0.6);",
				};
			case faixaNormalizada.includes("marrom"):
				return {
					bg: "bg-[#78350F]",
					text: "text-[#FFFFFF] font-black",
					border: "border-[#B45309]/70 ring-1 ring-amber-700/30",
					isPreta: false,
					style: "background-color: #78350F; color: #FFFFFF; text-shadow: 0 1px 2px rgba(0,0,0,0.65);",
				};
			case (faixaNormalizada.includes("vermelh") &&
				!faixaNormalizada.includes("branca")) ||
				((faixaNormalizada.includes("9") ||
					faixaNormalizada.includes("10")) &&
					faixaNormalizada.includes("dan")) ||
				(faixaNormalizada.includes("kudan") &&
					!faixaNormalizada.includes("rokudan")) ||
				faixaNormalizada.includes("judan"):
				return {
					// 9º e 10º Dan (Kodansha Kudan / Judan): Faixa Vermelha Sólida Oficial com Bordado Dourado
					bg: "bg-[#DC2626]",
					text: "text-[#FDE047] font-black tracking-wide",
					border: "border-[#EF4444] ring-1 ring-amber-400/40 shadow-xs",
					isPreta: false,
					style: "background-color: #DC2626; color: #FDE047; text-shadow: 0 1px 2px rgba(0,0,0,0.8);",
				};
			case faixaNormalizada.includes("coral") ||
				faixaNormalizada.includes("kodansha") ||
				faixaNormalizada.includes("kodancha") ||
				faixaNormalizada.includes("vermelha e branca") ||
				((faixaNormalizada.includes("6") ||
					faixaNormalizada.includes("7") ||
					faixaNormalizada.includes("8")) &&
					faixaNormalizada.includes("dan")) ||
				faixaNormalizada.includes("rokudan") ||
				faixaNormalizada.includes("nanadan") ||
				faixaNormalizada.includes("shichidan") ||
				faixaNormalizada.includes("hachidan"):
				return {
					// Faixa Kodansha / Coral com blocos sólidos: vermelho (#DC2626) | branco (#FFFFFF) | vermelho (#DC2626)
					bg: "bg-[linear-gradient(90deg,#DC2626_0_33.33%,#FFFFFF_33.33%_66.66%,#DC2626_66.66%_100%)]",
					text: "text-[#09090b] font-black tracking-wide",
					border: "border-[#b80f15] shadow-xs",
					isPreta: false,
					style: "background: linear-gradient(90deg, #DC2626 0% 33.33%, #FFFFFF 33.33% 66.66%, #DC2626 66.66% 100%); color: #09090b; text-shadow: 0 0 4px rgba(255,255,255,0.9);",
				};
			case faixaNormalizada.includes("pret"):
			default:
				return {
					// Yudansha: Faixa Preta (#09090b) com escrita bordada em ouro (#FFD700) e riscos vermelhos (#ED1C24)
					bg: "bg-[#09090b]",
					text: "text-[#FFD700] font-black",
					border: "border-zinc-700 ring-1 ring-amber-500/25 shadow-xs",
					isPreta: true,
					style: "background-color: #09090b; color: #FFD700; text-shadow: 0 1px 2px rgba(0,0,0,0.9);",
				};
		}
	});

	// Largura padronizada para todas as faixas terem rigorosamente o mesmo tamanho
	const larguraContainer = $derived.by(() => {
		if (customWidth) return customWidth;
		if (!uniformWidth) return "w-auto";
		switch (size) {
			case "sm":
				return "w-[155px]";
			case "lg":
				return "w-[235px]";
			case "md":
			default:
				return "w-[195px]";
		}
	});

	// Dimensões da barra física da faixa
	const dimensoesBarra = $derived.by(() => {
		switch (size) {
			case "sm":
				return "h-[26px] text-[10.5px] px-2";
			case "lg":
				return "h-[36px] text-sm px-3.5";
			case "md":
			default:
				return "h-[30px] text-xs px-2.5";
		}
	});

	// Altura dos riscos vermelhos para os Dans
	const dimensaoRisco = $derived.by(() => {
		switch (size) {
			case "sm":
				return "h-3.5";
			case "lg":
				return "h-5";
			case "md":
			default:
				return "h-4";
		}
	});
</script>

<div
	class="inline-flex flex-col items-center justify-center shrink-0 {larguraContainer}"
>
	<!-- Barra da Faixa de Judô (Obi com acabamento de pesponto) -->
	<div
		class="w-full relative overflow-hidden flex items-center justify-center rounded-md border shadow-xs transition-all duration-150 select-none {estilosPorFaixa.bg} {estilosPorFaixa.text} {estilosPorFaixa.border} {dimensoesBarra}"
		style={estilosPorFaixa.style}
		title={legendaOficial}
	>
		<!-- Linhas sutis de pesponto (costura do Obi) superior e inferior -->
		<div
			class="absolute inset-x-1 top-[2px] border-t border-dashed border-current opacity-20 pointer-events-none"
		></div>
		<div
			class="absolute inset-x-1 bottom-[2px] border-b border-dashed border-current opacity-20 pointer-events-none"
		></div>

		<!-- Texto Principal da Faixa (Centralizado com Alta Legibilidade) -->
		<span
			class="relative z-10 truncate tracking-wider font-black uppercase text-center block"
			style="color: inherit;"
		>
			{rotuloPrincipal}
		</span>

		<!-- Riscos Vermelhos Oficiais (#ED1C24) para cada Dan na extremidade direita da faixa preta -->
		{#if numeroDan > 0 && estilosPorFaixa.isPreta}
			<div
				class="absolute right-2 top-0 bottom-0 flex items-center gap-[2.5px] z-10"
				title="{numeroDan}º Dan ({numeroDan} {numeroDan === 1
					? 'risco vermelho'
					: 'riscos vermelhos'})"
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
