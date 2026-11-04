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
			f.includes("4 dan") ||
			f.includes("4o dan") ||
			f.includes("yo-dan")
		)
			return 4;
		if (f.includes("godan") || f.includes("5 dan") || f.includes("5o dan"))
			return 5;
		if (
			f.includes("rokudan") ||
			f.includes("6 dan") ||
			f.includes("6o dan") ||
			f.includes("roku-dan")
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
		if (f.includes("kudan") || f.includes("9 dan") || f.includes("9o dan"))
			return 9;
		if (
			f.includes("judan") ||
			f.includes("10 dan") ||
			f.includes("10o dan")
		)
			return 10;
		return 0;
	});

	// Rótulo oficial da faixa (ex: "Preta (1º Dan)", "Branca Ponta Cinza")
	const rotuloPrincipal = $derived(obterRotuloOficialFaixa(faixa, numeroDan));

	// Legenda oficial detalhada (ex: "1º Dan (Sho-dan) - Faixa Preta")
	const legendaOficial = $derived(
		obterLegendaOficialFaixa(faixa, numeroDan),
	);

	// Mapeamento visual das cores do Judô conforme FPJ / CBJ
	const estilosPorFaixa = $derived.by(() => {
		const f = faixaNormalizada;

		// 1. Faixas Bicolores (Graduação Infantil / Iniciante)
		if (
			f.includes("ponta cinza") ||
			f.includes("/cinza") ||
			f.includes("-cinza")
		) {
			return {
				bg: "bg-gradient-to-r from-zinc-100 via-zinc-100 to-zinc-400",
				text: "text-zinc-900",
				border: "border-zinc-300 shadow-xs",
				isPreta: false,
			};
		}
		if (
			f.includes("ponta azul") ||
			f.includes("/azul") ||
			f.includes("-azul")
		) {
			return {
				bg: "bg-gradient-to-r from-zinc-400 via-zinc-400 to-blue-600",
				text: "text-white",
				border: "border-blue-700 shadow-xs",
				isPreta: false,
			};
		}
		if (
			f.includes("ponta amarela") ||
			f.includes("/amarela") ||
			f.includes("-amarela")
		) {
			return {
				bg: "bg-gradient-to-r from-blue-600 via-blue-600 to-amber-400",
				text: "text-white",
				border: "border-blue-800 shadow-xs",
				isPreta: false,
			};
		}
		if (
			f.includes("ponta laranja") ||
			f.includes("/laranja") ||
			f.includes("-laranja")
		) {
			return {
				bg: "bg-gradient-to-r from-amber-400 via-amber-400 to-orange-500",
				text: "text-zinc-900",
				border: "border-amber-500 shadow-xs",
				isPreta: false,
			};
		}
		if (
			f.includes("ponta verde") ||
			f.includes("/verde") ||
			f.includes("-verde")
		) {
			return {
				bg: "bg-gradient-to-r from-orange-500 via-orange-500 to-emerald-600",
				text: "text-white",
				border: "border-orange-600 shadow-xs",
				isPreta: false,
			};
		}
		if (
			f.includes("ponta roxa") ||
			f.includes("/roxa") ||
			f.includes("-roxa")
		) {
			return {
				bg: "bg-gradient-to-r from-emerald-600 via-emerald-600 to-purple-600",
				text: "text-white",
				border: "border-emerald-700 shadow-xs",
				isPreta: false,
			};
		}
		if (
			f.includes("ponta marrom") ||
			f.includes("/marrom") ||
			f.includes("-marrom")
		) {
			return {
				bg: "bg-gradient-to-r from-purple-600 via-purple-600 to-amber-800",
				text: "text-white",
				border: "border-purple-700 shadow-xs",
				isPreta: false,
			};
		}

		// 2. Faixas Monocromáticas (Kyus Regulares)
		if (f.includes("cinza")) {
			return {
				bg: "bg-zinc-400",
				text: "text-zinc-950 font-bold",
				border: "border-zinc-500 shadow-xs",
				isPreta: false,
			};
		}
		if (f.includes("azul")) {
			return {
				bg: "bg-blue-600",
				text: "text-white font-bold",
				border: "border-blue-700 shadow-xs",
				isPreta: false,
			};
		}
		if (f.includes("amarela")) {
			return {
				bg: "bg-amber-400",
				text: "text-zinc-950 font-bold",
				border: "border-amber-500 shadow-xs",
				isPreta: false,
			};
		}
		if (f.includes("laranja")) {
			return {
				bg: "bg-orange-500",
				text: "text-zinc-950 font-bold",
				border: "border-orange-600 shadow-xs",
				isPreta: false,
			};
		}
		if (f.includes("verde")) {
			return {
				bg: "bg-emerald-600",
				text: "text-white font-bold",
				border: "border-emerald-700 shadow-xs",
				isPreta: false,
			};
		}
		if (f.includes("roxa")) {
			return {
				bg: "bg-purple-600",
				text: "text-white font-bold",
				border: "border-purple-700 shadow-xs",
				isPreta: false,
			};
		}
		if (f.includes("marrom")) {
			return {
				bg: "bg-[#78350f]",
				text: "text-amber-100 font-bold",
				border: "border-[#92400e] shadow-xs",
				isPreta: false,
			};
		}

		// 3. Faixas de Alto Grau (Dans)
		// Faixa Vermelha e Branca (Coral - 6º a 8º Dan)
		if (
			f.includes("coral") ||
			f.includes("vermelha e branca") ||
			f.includes("vermelha-branca") ||
			f.includes("kohaku") ||
			(numeroDan >= 6 && numeroDan <= 8)
		) {
			return {
				bg: "",
				text: "text-zinc-950 font-extrabold tracking-widest",
				border: "border-red-700 shadow-xs ring-1 ring-red-500/30",
				isPreta: false,
				style: "background: repeating-linear-gradient(90deg, #dc2626 0px, #dc2626 22px, #f4f4f5 22px, #f4f4f5 44px);",
			};
		}

		// Faixa Vermelha (Akabi - 9º e 10º Dan)
		if (f.includes("vermelha") || numeroDan >= 9) {
			return {
				bg: "bg-red-600",
				text: "text-white font-black tracking-wider",
				border: "border-red-700 ring-1 ring-red-400 shadow-xs",
				isPreta: false,
			};
		}

		// Faixa Preta (Kurobi - 1º ao 5º Dan)
		if (f.includes("preta") || numeroDan >= 1) {
			return {
				bg: "bg-zinc-950",
				text: "text-amber-400 font-bold",
				border: "border-zinc-700 ring-1 ring-amber-500/25 shadow-xs",
				isPreta: true,
				style: "background-color: #09090b; color: #FFD700; text-shadow: 0 1px 2px rgba(0,0,0,0.9);",
			};
		}

		// Padrão: Faixa Branca (Mukyu)
		return {
			bg: "bg-zinc-100",
			text: "text-zinc-900 font-bold",
			border: "border-zinc-300 shadow-xs",
			isPreta: false,
		};
	});

	// Largura padronizada para todas as faixas terem rigorosamente o mesmo tamanho
	const larguraContainer = $derived.by(() => {
		if (customWidth) return customWidth;
		if (!uniformWidth) return "w-auto min-w-[70px]";
		switch (size) {
			case "sm":
				return "w-[125px]";
			case "lg":
				return "w-[220px]";
			case "md":
			default:
				return "w-[170px]";
		}
	});

	// Dimensões da barra física da faixa
	const dimensoesBarra = $derived.by(() => {
		switch (size) {
			case "sm":
				return "h-[22px] text-[10px] px-1.5";
			case "lg":
				return "h-[34px] text-xs px-3";
			case "md":
			default:
				return "h-[26px] text-[11px] px-2";
		}
	});

	// Altura dos riscos vermelhos para os Dans
	const dimensaoRisco = $derived.by(() => {
		switch (size) {
			case "sm":
				return "h-3";
			case "lg":
				return "h-4.5";
			case "md":
			default:
				return "h-3.5";
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
			class="relative z-10 truncate tracking-wider font-black uppercase text-center block px-1"
			style="color: inherit;"
		>
			{rotuloPrincipal}
		</span>

		<!-- Riscos Vermelhos Oficiais (#ED1C24) para cada Dan na extremidade direita da faixa preta -->
		{#if numeroDan > 0 && estilosPorFaixa.isPreta}
			<div
				class="absolute right-1.5 top-0 bottom-0 flex items-center gap-[2px] z-10"
				title="{numeroDan}º Dan ({numeroDan} {numeroDan === 1
					? 'risco vermelho'
					: 'riscos vermelhos'})"
			>
				{#each Array(numeroDan) as _}
					<span
						class="w-[2px] {dimensaoRisco} rounded-xs shadow-xs"
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
