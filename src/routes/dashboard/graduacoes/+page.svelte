<script lang="ts">
	import type { PageData } from './$types';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Award,
		Calendar,
		Users,
		ShieldCheck,
		ArrowRight,
		FileText
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const totalHomologacoes = $derived(data.graduacoes.length);
</script>

<svelte:head>
	<title>Graduações & Faixas - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER DA PÁGINA -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
					Pedagogia & Tradição
				</span>
				<span class="text-xs text-zinc-600">•</span>
				<span class="text-xs text-zinc-400 font-mono">Fase 6</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
				Graduações & Faixas
			</h1>
			<p class="text-xs sm:text-sm text-zinc-400 mt-1">
				Histórico cronológico imutável (Insert-Only), homologação de exames de Kyu/Dan e
				evolução dos atletas.
			</p>
		</div>

		<a
			href="/dashboard/graduacoes/nova"
			class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all shrink-0"
		>
			<Award class="w-4 h-4" />
			<span>Homologar Nova Faixa</span>
		</a>
	</div>

	<!-- DISTRIBUIÇÃO DE FAIXAS NO DOJO -->
	<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
					Censo de Graduação do Dojo
				</h2>
			</div>
			<div class="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
				<ShieldCheck class="w-3.5 h-3.5" />
				<span>Trilha Imutável ACID</span>
			</div>
		</div>

		{#if data.distribuicao.length > 0}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
				{#each data.distribuicao as item}
					<div
						class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between gap-2"
					>
						<BadgeFaixa faixa={item.faixa} size="sm" />
						<div class="text-right">
							<span class="text-base font-extrabold text-white font-mono block leading-none">
								{item.total}
							</span>
							<span class="text-[10px] text-zinc-500 font-mono">
								{item.total === 1 ? 'judoca' : 'judocas'}
							</span>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-4 rounded-xl bg-zinc-900/20 text-xs text-zinc-500 italic">
				Nenhum judoca cadastrado para cálculo de distribuição.
			</div>
		{/if}
	</div>

	<!-- FEED DE HOMOLOGAÇÕES RECENTES -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
				Registro Cronológico de Promoções ({totalHomologacoes})
			</h2>
			<span class="text-[11px] font-mono text-zinc-500">Insert-Only</span>
		</div>

		{#if data.graduacoes.length > 0}
			<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
						<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
							<tr>
								<th class="px-6 py-4">Judoca Promovido</th>
								<th class="px-6 py-4">Nova Faixa</th>
								<th class="px-6 py-4">Data do Exame</th>
								<th class="px-6 py-4">Sensei Homologador</th>
								<th class="px-6 py-4">Associação / Cerimônia</th>
								<th class="px-6 py-4 text-right">Histórico</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-900">
							{#each data.graduacoes as grad}
								<tr class="hover:bg-zinc-900/30 transition-colors group">
									<td class="px-6 py-4">
										<div class="font-semibold text-white group-hover:text-red-400 transition-colors">
											{grad.nome_aluno}
										</div>
										{#if grad.matricula_aluno}
											<div class="text-[11px] font-mono text-zinc-500 mt-0.5">
												Matrícula: {grad.matricula_aluno}
											</div>
										{/if}
									</td>

									<td class="px-6 py-4">
										<BadgeFaixa faixa={grad.faixa} size="sm" />
									</td>

									<td class="px-6 py-4 font-mono text-zinc-300">
										{grad.data_graduacao}
									</td>

									<td class="px-6 py-4">
										<span class="text-white font-medium block leading-tight">
											{grad.nome_professor_homologador}
										</span>
										{#if grad.grau_faixa_professor}
											<span class="text-[11px] font-mono text-zinc-500">
												{grad.grau_faixa_professor}
											</span>
										{/if}
									</td>

									<td class="px-6 py-4">
										<span class="text-zinc-300 block">{grad.associacao || 'FPJ/CBJ'}</span>
										<span class="text-[11px] text-zinc-500 truncate max-w-[180px] block">
											{grad.nome_evento}
										</span>
									</td>

									<td class="px-6 py-4 text-right">
										<a
											href="/dashboard/graduacoes/historico/{grad.id_aluno}"
											class="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white font-medium"
										>
											<FileText class="w-3.5 h-3.5" />
											<span>Prontuário</span>
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="p-12 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
				<Award class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
				<h3 class="text-base font-bold text-white font-display">
					Nenhuma homologação registrada ainda
				</h3>
				<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
					Assim que os judocas realizarem exames de Kyu ou Dan, homologue suas graduações para
					registrar o histórico imutável.
				</p>
				<div class="mt-5">
					<a
						href="/dashboard/graduacoes/nova"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
					>
						<Award class="w-3.5 h-3.5" />
						<span>Homologar Primeiro Exame</span>
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
