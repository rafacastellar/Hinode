<script lang="ts">
	interface Props {
		linhas?: number;
		altura?: string;
		class?: string;
	}

	let { linhas = 1, altura = 'h-12', class: className = '' }: Props = $props();
</script>

<div class="space-y-3 w-full {className}" role="status" aria-label="Carregando conteúdo...">
	{#each Array(linhas) as _}
		<div
			class="w-full {altura} rounded-xl bg-zinc-900/80 border border-zinc-800/60 animate-pulse"
		></div>
	{/each}
</div>

