<script lang="ts">
	import { Printer, X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		aberto: boolean;
		titulo?: string;
		subtitulo?: string;
		onfechar: () => void;
		controles?: Snippet;
		children: Snippet;
	}

	let {
		aberto = false,
		titulo = 'Documento Oficial',
		subtitulo = 'Visualização de impressão em formato A4',
		onfechar,
		controles,
		children
	}: Props = $props();

	function dispararImpressao() {
		if (typeof window !== 'undefined') {
			window.print();
		}
	}

	function tratarTeclado(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onfechar();
		}
	}
</script>

<svelte:window onkeydown={tratarTeclado} />

{#if aberto}
	<!-- Modal de Visualização de Impressão -->
	<div
		class="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 backdrop-blur-md overflow-hidden impressao-modal-root"
		role="dialog"
		aria-modal="true"
	>
		<!-- Barra de Ações Superior (Oculta na impressão física) -->
		<div
			class="no-print bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-lg"
		>
			<div class="min-w-0">
				<h2 class="text-sm sm:text-base font-bold text-white font-display truncate">
					{titulo}
				</h2>
				{#if subtitulo}
					<p class="text-xs text-zinc-400 truncate mt-0.5">
						{subtitulo}
					</p>
				{/if}
			</div>

			<div class="flex items-center gap-2.5 sm:gap-3 shrink-0">
				<!-- Controles específicos do documento (ex: filtros de ordenação) -->
				{#if controles}
					{@render controles()}
				{/if}

				<!-- Botão de Disparo de Impressão -->
				<button
					type="button"
					onclick={dispararImpressao}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
					title="Imprimir ou Salvar em PDF"
				>
					<Printer class="w-4 h-4" />
					<span>Imprimir / Salvar PDF</span>
				</button>

				<!-- Botão Fechar -->
				<button
					type="button"
					onclick={onfechar}
					class="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
					title="Fechar visualização (Esc)"
					aria-label="Fechar"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Área Rolável de Visualização da Folha A4 -->
		<div class="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-950/70 area-rolavel-folha">
			<div
				class="folha-a4-documento bg-white text-zinc-950 p-6 sm:p-10 shadow-2xl rounded-sm max-w-[210mm] mx-auto min-h-[297mm] font-sans text-xs selection:bg-red-100"
			>
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	@media print {
		/* Oculta tudo que estiver fora do documento impresso */
		:global(body > *:not(.impressao-modal-root)) {
			display: none !important;
		}

		:global(aside),
		:global(header),
		:global(nav),
		:global(.no-print) {
			display: none !important;
		}

		/* Transforma o modal em visualização plana de página inteira */
		.impressao-modal-root {
			position: static !important;
			inset: auto !important;
			background: white !important;
			backdrop-filter: none !important;
			width: 100% !important;
			height: auto !important;
			overflow: visible !important;
		}

		.area-rolavel-folha {
			padding: 0 !important;
			background: white !important;
			overflow: visible !important;
		}

		.folha-a4-documento {
			box-shadow: none !important;
			border-radius: 0 !important;
			padding: 0 !important;
			max-width: 100% !important;
			min-height: auto !important;
			background: white !important;
			color: #000000 !important;
		}

		@page {
			size: A4 portrait;
			margin: 12mm 14mm 12mm 14mm;
		}

		:global(tr),
		:global(.evitar-quebra) {
			page-break-inside: avoid !important;
			break-inside: avoid !important;
		}
	}
</style>
