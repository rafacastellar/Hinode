<script lang="ts">
	interface Props {
		nomeAcademia?: string;
		titulo: string;
		subtitulo?: string;
		codigoDoc?: string;
	}

	let {
		nomeAcademia = 'Judô Hinodê',
		titulo,
		subtitulo = '',
		codigoDoc = ''
	}: Props = $props();

	const dataEmissao = new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'long',
		timeStyle: 'short'
	}).format(new Date());
</script>

<div class="border-b-2 border-zinc-900 pb-4 mb-6">
	<div class="flex items-start justify-between gap-4">
		<!-- Emblema e Nome do Dojo -->
		<div class="flex items-center gap-3">
			<div class="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-300 shrink-0">
				<span class="w-4 h-4 rounded-full bg-red-600"></span>
			</div>
			<div>
				<div class="flex items-center gap-2">
					<span class="font-extrabold text-base tracking-tight text-zinc-950 font-display">
						{nomeAcademia.toUpperCase()}
					</span>
					<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
						OFICIAL
					</span>
				</div>
				<span class="text-[10px] text-zinc-500 font-mono tracking-wider uppercase block mt-0.5">
					SaaS de Gestão de Dojos • Tradição & Eficiência no Tatame
				</span>
			</div>
		</div>

		<!-- Metadados de Emissão -->
		<div class="text-right text-[10px] text-zinc-500 font-mono shrink-0">
			{#if codigoDoc}
				<div class="font-bold text-zinc-800">DOC: {codigoDoc}</div>
			{/if}
			<div>Emitido em: {dataEmissao}</div>
			<div class="text-[9px] text-zinc-400">Via Sistema Hinodê</div>
		</div>
	</div>

	<!-- Título Principal do Documento -->
	<div class="mt-4 pt-3 border-t border-zinc-200 flex items-end justify-between gap-4">
		<div>
			<h1 class="text-lg font-extrabold text-zinc-950 uppercase tracking-tight font-display">
				{titulo}
			</h1>
			{#if subtitulo}
				<p class="text-xs text-zinc-600 font-medium mt-0.5">
					{subtitulo}
				</p>
			{/if}
		</div>
	</div>
</div>
