<script lang="ts">
	import { toast } from './toast.svelte';
	import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from '@lucide/svelte';

	function estilosToast(tipo: string) {
		switch (tipo) {
			case 'sucesso':
				return {
					container: 'bg-zinc-950/95 border-emerald-700/70 shadow-[0_8px_30px_rgba(16,185,129,0.2)]',
					iconeWrapper: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400',
					barra: 'bg-emerald-500'
				};
			case 'erro':
				return {
					container: 'bg-zinc-950/95 border-red-700/70 shadow-[0_8px_30px_rgba(220,38,38,0.25)]',
					iconeWrapper: 'bg-red-950/80 border-red-700/60 text-red-400',
					barra: 'bg-red-500'
				};
			case 'aviso':
				return {
					container: 'bg-zinc-950/95 border-amber-700/70 shadow-[0_8px_30px_rgba(245,158,11,0.2)]',
					iconeWrapper: 'bg-amber-950/80 border-amber-700/60 text-amber-400',
					barra: 'bg-amber-500'
				};
			default:
				return {
					container: 'bg-zinc-950/95 border-zinc-700/80 shadow-2xl',
					iconeWrapper: 'bg-zinc-900 border-zinc-700 text-zinc-300',
					barra: 'bg-zinc-500'
				};
		}
	}
</script>

{#if toast.itens.length > 0}
	<div
		class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
		aria-live="polite"
		aria-label="Notificações do sistema"
	>
		{#each toast.itens as item (item.id)}
			{@const estilo = estilosToast(item.tipo)}
			<div
				class="pointer-events-auto relative overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all duration-300 flex items-start gap-3 {estilo.container}"
				role="status"
			>
				<!-- Indicador lateral colorido -->
				<div class="absolute left-0 top-0 bottom-0 w-1 {estilo.barra}"></div>

				<div class="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 {estilo.iconeWrapper}">
					{#if item.tipo === 'sucesso'}
						<CheckCircle2 class="w-4 h-4" />
					{:else if item.tipo === 'erro'}
						<AlertCircle class="w-4 h-4" />
					{:else if item.tipo === 'aviso'}
						<AlertTriangle class="w-4 h-4" />
					{:else}
						<Info class="w-4 h-4" />
					{/if}
				</div>

				<div class="flex-1 min-w-0 pr-2">
					<p class="text-xs font-bold text-white leading-snug">{item.titulo}</p>
					{#if item.mensagem}
						<p class="text-xs text-zinc-300 mt-0.5 leading-relaxed">{item.mensagem}</p>
					{/if}
				</div>

				<button
					type="button"
					onclick={() => toast.remover(item.id)}
					class="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
					aria-label="Fechar notificação"
				>
					<X class="w-3.5 h-3.5" />
				</button>
			</div>
		{/each}
	</div>
{/if}

