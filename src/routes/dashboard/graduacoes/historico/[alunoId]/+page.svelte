<script lang="ts">
	import type { PageData } from './$types';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Award,
		Calendar,
		User,
		ArrowLeft,
		ShieldCheck,
		FileText,
		CheckCircle2,
		Sparkles
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.aluno.nome} - Prontuário de Graduações</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/graduacoes"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Painel de Graduações</span>
		</a>

		<!-- CARTÃO PRINCIPAL DO ATLETA -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-2xl relative overflow-hidden">
			<div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
				<div>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
							Prontuário Pedagógico
						</span>
						<span class="text-xs text-zinc-600">•</span>
						<span class="text-xs text-zinc-400 font-mono">Judoca #{data.aluno.id_usuario}</span>
					</div>

					<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
						{data.aluno.nome}
					</h1>
					<p class="text-xs sm:text-sm text-zinc-400 mt-1">
						{data.aluno.idade} anos • Sensei Técnico: <strong class="text-zinc-200">{data.aluno.nome_professor_responsavel}</strong>
						{#if data.aluno.matricula}
							• Matrícula: <span class="font-mono text-zinc-300">{data.aluno.matricula}</span>
						{/if}
					</p>
				</div>

				<!-- Faixa Atual em Destaque -->
				<div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center shrink-0">
					<span class="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
						Graduação Atual
					</span>
					<BadgeFaixa faixa={data.aluno.graduacao_atual} size="lg" />
				</div>
			</div>
		</div>
	</div>

	<!-- TIMELINE VERTICAL DE EVOLUÇÃO -->
	<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
		<div class="flex items-center justify-between pb-4 border-b border-zinc-900">
			<div class="flex items-center gap-3">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Award class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Linha do Tempo de Faixas</h2>
					<p class="text-[11px] text-zinc-500">Histórico cronológico imutável (Insert-Only)</p>
				</div>
			</div>

			<div class="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
				<ShieldCheck class="w-4 h-4" />
				<span>Trilha Auditada</span>
			</div>
		</div>

		{#if data.historico.length > 0}
			<div class="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
				{#each data.historico as exame, i}
					<div class="relative group">
						<!-- Marcador da Linha do Tempo -->
						<div
							class="absolute -left-[27px] sm:-left-[35px] top-1.5 w-4 h-4 rounded-full bg-zinc-950 border-2 border-red-500 group-hover:bg-red-500 group-hover:scale-110 transition-all shadow-[0_0_10px_rgba(220,38,38,0.5)]"
						></div>

						<!-- Card da Etapa -->
						<div class="p-5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 transition-all">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
								<div class="flex items-center gap-3">
									<BadgeFaixa faixa={exame.faixa} size="md" />
									<span class="text-xs font-mono text-zinc-400">
										Exame #{exame.id_historico}
									</span>
								</div>

								<div class="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-300">
									<Calendar class="w-3.5 h-3.5 text-zinc-500" />
									<span>{exame.data_graduacao}</span>
								</div>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-800/60 text-xs">
								<div>
									<span class="text-zinc-500 block text-[11px] font-mono uppercase">
										Sensei Homologador:
									</span>
									<span class="text-white font-semibold">
										{exame.nome_professor_homologador}
									</span>
									{#if exame.grau_faixa_professor}
										<span class="text-zinc-400 font-mono text-[11px]">
											({exame.grau_faixa_professor})
										</span>
									{/if}
								</div>

								<div>
									<span class="text-zinc-500 block text-[11px] font-mono uppercase">
										Cerimônia & Associação:
									</span>
									<span class="text-zinc-300 block">{exame.nome_evento}</span>
									<span class="text-zinc-500 font-mono text-[11px]">
										{exame.associacao || 'FPJ/CBJ'}
									</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center">
				<Sparkles class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
				<h4 class="text-sm font-bold text-white font-display">Sem exames de promoção registrados</h4>
				<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
					O atleta encontra-se atualmente na faixa inicial ({data.aluno.graduacao_atual}). As próximas
					homologações aparecerão aqui nesta linha do tempo.
				</p>
				<div class="mt-4">
					<a
						href="/dashboard/graduacoes/nova"
						class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
					>
						<Award class="w-3.5 h-3.5" />
						<span>Homologar Exame para este Judoca</span>
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
