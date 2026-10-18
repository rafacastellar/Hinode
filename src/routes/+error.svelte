<script lang="ts">
	import { page } from '$app/state';
	import { ShieldAlert, AlertTriangle, ArrowLeft, Home } from '@lucide/svelte';

	const status = $derived(page.status);
	const mensagem = $derived(page.error?.message || 'Ocorreu um erro inesperado.');

	const titulo = $derived(
		status === 403
			? 'Acesso Restrito'
			: status === 404
				? 'Página Não Encontrada'
				: status === 500
					? 'Erro Interno no Servidor'
					: 'Atenção'
	);

	const descricao = $derived(
		status === 403
			? 'Seu perfil de usuário não possui as permissões necessárias para acessar este recurso ou executar esta ação.'
			: status === 404
				? 'O endereço solicitado não foi encontrado ou não existe nesta academia.'
				: 'Não foi possível concluir sua solicitação no momento. Caso o problema persista, contate o administrador.'
	);
</script>

<svelte:head>
	<title>{status} - {titulo} - Judô Hinodê</title>
</svelte:head>

<div class="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
	<!-- Background glow effect -->
	<div class="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

	<div class="max-w-md w-full text-center space-y-6 relative z-10">
		<div class="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center {status === 403 ? 'bg-red-950/60 border border-red-800 text-red-500' : 'bg-amber-950/60 border border-amber-800 text-amber-500'} shadow-[0_0_30px_rgba(220,38,38,0.2)]">
			{#if status === 403}
				<ShieldAlert class="w-8 h-8" />
			{:else}
				<AlertTriangle class="w-8 h-8" />
			{/if}
		</div>

		<div class="space-y-2">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono">
				<span class="w-2 h-2 rounded-full {status === 403 ? 'bg-red-500' : 'bg-amber-500'}"></span>
				<span class="text-zinc-400">HTTP {status}</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
				{titulo}
			</h1>
			<p class="text-sm text-zinc-400">
				{descricao}
			</p>
		</div>

		{#if mensagem && mensagem !== titulo}
			<div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs font-mono text-zinc-300 text-left">
				<span class="text-zinc-500 block text-[10px] uppercase font-bold mb-1">Detalhes do Erro</span>
				{mensagem}
			</div>
		{/if}

		<div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
			<button
				type="button"
				onclick={() => history.back()}
				class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors"
			>
				<ArrowLeft class="w-3.5 h-3.5" />
				<span>Voltar à Página Anterior</span>
			</button>
			<a
				href="/dashboard"
				class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-colors"
			>
				<Home class="w-3.5 h-3.5" />
				<span>Ir para o Dashboard</span>
			</a>
		</div>
	</div>
</div>
