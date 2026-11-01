<script lang="ts">
	import BadgeFaixa from './BadgeFaixa.svelte';
	import { CheckCircle2, Clock, Sparkles, ArrowRight } from '@lucide/svelte';

	interface Props {
		faixaAtual: string;
		dataInicioOuUltimaGraduacao?: string | null;
		proximaFaixaSugerida?: string | null;
	}

	let {
		faixaAtual = 'Branca',
		dataInicioOuUltimaGraduacao = null,
		proximaFaixaSugerida = null
	}: Props = $props();

	const ORDEM_PROGRESSAO = [
		'Branca',
		'Cinza',
		'Azul',
		'Amarela',
		'Laranja',
		'Verde',
		'Roxa',
		'Marrom',
		'Preta (1º Dan)'
	];

	function obterCarenciaMesesOficial(faixa: string): number {
		const f = faixa.toLowerCase();
		if (f.includes('branca') || f.includes('cinza')) return 6;
		if (f.includes('azul') || f.includes('amarel')) return 6;
		if (f.includes('laranja') || f.includes('verde')) return 12;
		if (f.includes('roxa')) return 12;
		if (f.includes('marrom')) return 24;
		return 36;
	}

	function obterProximaFaixa(faixa: string): string {
		if (proximaFaixaSugerida) return proximaFaixaSugerida;
		const f = faixa.toLowerCase();
		if (f.includes('branca')) return 'Cinza / Azul';
		if (f.includes('cinza')) return 'Azul';
		if (f.includes('azul')) return 'Amarela';
		if (f.includes('amarel')) return 'Laranja';
		if (f.includes('laranja')) return 'Verde';
		if (f.includes('verde')) return 'Roxa';
		if (f.includes('roxa')) return 'Marrom';
		if (f.includes('marrom')) return 'Preta (1º Dan)';
		return 'Próximo Dan';
	}

	const mesesCarencia = $derived(obterCarenciaMesesOficial(faixaAtual));
	const proximaFaixa = $derived(obterProximaFaixa(faixaAtual));

	const mesesCumpridos = $derived.by(() => {
		if (!dataInicioOuUltimaGraduacao) return Math.round(mesesCarencia * 0.75);
		const partes = String(dataInicioOuUltimaGraduacao).split(/[-/]/);
		let dt: Date;
		if (partes.length === 3 && partes[0].length === 4) {
			dt = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
		} else if (partes.length === 3 && partes[2].length === 4) {
			dt = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
		} else {
			dt = new Date(dataInicioOuUltimaGraduacao);
		}
		if (isNaN(dt.getTime())) return Math.round(mesesCarencia * 0.75);
		const hoje = new Date();
		const diffMeses =
			(hoje.getFullYear() - dt.getFullYear()) * 12 + (hoje.getMonth() - dt.getMonth());
		return Math.max(1, diffMeses);
	});

	const percentual = $derived(
		Math.min(100, Math.round((mesesCumpridos / Math.max(1, mesesCarencia)) * 100))
	);
	const aptoParaExame = $derived(percentual >= 100);
</script>

<div class="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-4">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<div>
			<div class="flex items-center gap-2">
				<Sparkles class="w-3.5 h-3.5 text-red-500" />
				<span class="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
					Termômetro de Elegibilidade Pedagógica (CBJ/FPJ)
				</span>
			</div>
			<h4 class="text-sm font-bold text-white font-display mt-0.5">
				Progresso de Carência para Próximo Exame
			</h4>
		</div>

		{#if aptoParaExame}
			<span
				class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/70 text-emerald-300 text-xs font-mono font-bold self-start sm:self-auto"
			>
				<CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
				<span>Apto para Exame</span>
			</span>
		{:else}
			<span
				class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/70 text-amber-300 text-xs font-mono font-bold self-start sm:self-auto"
			>
				<Clock class="w-3.5 h-3.5 text-amber-400" />
				<span>Em Carência ({percentual}%)</span>
			</span>
		{/if}
	</div>

	<!-- Visualização Faixa Atual -> Próxima Faixa -->
	<div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 flex-wrap">
		<div class="flex items-center gap-2">
			<span class="text-[10px] font-mono uppercase text-zinc-400">Atual:</span>
			<BadgeFaixa faixa={faixaAtual} size="sm" uniformWidth={false} />
		</div>
		<ArrowRight class="w-4 h-4 text-zinc-500 hidden sm:block" />
		<div class="flex items-center gap-2">
			<span class="text-[10px] font-mono uppercase text-zinc-400">Alvo:</span>
			<BadgeFaixa faixa={proximaFaixa} size="sm" uniformWidth={false} />
		</div>
	</div>

	<!-- Barra de Progresso -->
	<div class="space-y-1.5">
		<div class="flex items-center justify-between text-xs font-mono">
			<span class="text-zinc-300 font-semibold">
				Tempo cumprido: <strong class="text-white">{mesesCumpridos}</strong> de <strong class="text-white">{mesesCarencia} meses</strong>
			</span>
			<span class="{aptoParaExame ? 'text-emerald-400' : 'text-amber-400'} font-bold">
				{percentual}%
			</span>
		</div>

		<div class="w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
			<div
				class="h-full rounded-full transition-all duration-500 {aptoParaExame
					? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
					: 'bg-gradient-to-r from-red-600 to-amber-500'}"
				style="width: {percentual}%"
			></div>
		</div>
	</div>
</div>

