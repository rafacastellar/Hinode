<script lang="ts">
	import type { PageData } from './$types';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Award,
		Calendar,
		Users,
		ShieldCheck,
		ArrowRight,
		Clock,
		MapPin,
		Plus,
		CheckCircle2,
		AlertCircle
	} from '@lucide/svelte';
	import {
		formatarPeriodoInscricaoExame,
		obterStatusPeriodoInscricao
	} from '#lib/dominio/graduacao';

	let { data }: { data: PageData } = $props();

	const totalHomologacoes = $derived(data.graduacoes.length);
	const totalEventos = $derived(data.eventos.length);
</script>

<svelte:head>
	<title>Graduações & Faixas - Judô Hinodê</title>
</svelte:head>

<div class="space-y-10">
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
				Exames oficiais de graduação, controle de carências pedagógicas, inscrições e trilha imutável (Insert-Only).
			</p>
		</div>

		<div class="flex items-center gap-3 shrink-0 flex-wrap">
			{#if data.podeHomologar}
				<a
					href="/dashboard/graduacoes/novo"
					class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
				>
					<Plus class="w-4 h-4" />
					<span>Novo Exame de Graduação</span>
				</a>

				<a
					href="/dashboard/graduacoes/nova"
					class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium text-xs sm:text-sm transition-all"
					title="Homologação avulsa ou extraordinária de aluno"
				>
					<Award class="w-4 h-4 text-zinc-400" />
					<span>Promoção Direta</span>
				</a>
			{/if}
		</div>
	</div>

	<!-- SEÇÃO 1: EVENTOS E EXAMES DE GRADUAÇÃO -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Award class="w-4 h-4 text-red-500" />
				<h2 class="text-sm font-mono uppercase tracking-wider text-zinc-300 font-bold">
					Exames e Cerimônias de Graduação ({totalEventos})
				</h2>
			</div>
			<span class="text-xs text-zinc-500 font-mono">Critérios e Carências Oficiais</span>
		</div>

		{#if data.eventos.length > 0}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{#each data.eventos as evento}
					{@const statusInsc = obterStatusPeriodoInscricao(evento.data_inicio_inscricao, evento.data_fim_inscricao)}
					<div
						class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col justify-between gap-5 group"
					>
						<div class="space-y-3">
							<!-- Topo do Card: Título, Edição e Status de Inscrição -->
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<div class="flex items-center gap-2 flex-wrap">
										<h3 class="text-base sm:text-lg font-bold text-white group-hover:text-red-400 transition-colors">
											{evento.nome}
										</h3>
										{#if evento.edicao}
											<span class="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 text-[11px] font-mono border border-zinc-800">
												{evento.edicao}
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
										<span class="inline-flex items-center gap-1 text-zinc-300">
											<Calendar class="w-3.5 h-3.5 text-red-400" />
											{evento.data_inicio}
										</span>
										<span class="text-zinc-600">•</span>
										<span class="inline-flex items-center gap-1">
											<MapPin class="w-3.5 h-3.5 text-zinc-500" />
											{evento.cidade} / {evento.uf}
										</span>
									</div>
								</div>

								<span
									class="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border shrink-0 {statusInsc.classeCor}"
								>
									{statusInsc.rotulo}
								</span>
							</div>

							<!-- Badges de Regras: Faixas Elegíveis e Carências Temporais -->
							<div class="pt-2 border-t border-zinc-900 flex flex-wrap gap-2 text-xs">
								<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800">
									<span class="text-[11px] text-zinc-400">Faixas:</span>
									<span class="font-medium text-white font-mono">
										{evento.faixa_inicio} até {evento.faixa_fim}
									</span>
								</div>

								{#if evento.tempo_minimo_judo_meses > 0}
									<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800" title="Tempo mínimo de prática no judô">
										<Clock class="w-3 h-3 text-amber-400" />
										<span class="text-[11px] text-zinc-400">Min. Judô:</span>
										<span class="font-bold text-amber-300 font-mono">
											{evento.tempo_minimo_judo_meses} {evento.tempo_minimo_judo_meses === 1 ? 'mês' : 'meses'}
										</span>
									</div>
								{/if}

								{#if evento.tempo_minimo_ultima_graduacao_meses > 0}
									<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800" title="Carência mínima na faixa atual">
										<Clock class="w-3 h-3 text-blue-400" />
										<span class="text-[11px] text-zinc-400">Min. na Faixa:</span>
										<span class="font-bold text-blue-300 font-mono">
											{evento.tempo_minimo_ultima_graduacao_meses} {evento.tempo_minimo_ultima_graduacao_meses === 1 ? 'mês' : 'meses'}
										</span>
									</div>
								{/if}

								<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800">
									<span class="text-[11px] text-zinc-400">Taxa:</span>
									<span class="font-bold text-emerald-400 font-mono">
										{evento.taxa_graduacao > 0 ? `R$ ${evento.taxa_graduacao.toFixed(2).replace('.', ',')}` : 'Isento'}
									</span>
								</div>
							</div>

							{#if evento.data_inicio_inscricao || evento.data_fim_inscricao}
								<div class="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
									<span class="text-zinc-500">Período de Inscrição:</span>
									<span class="text-zinc-300">
										{formatarPeriodoInscricaoExame(evento.data_inicio_inscricao, evento.data_fim_inscricao)}
									</span>
								</div>
							{/if}
						</div>

						<!-- Rodapé do Card: Estatísticas de Inscritos/Homologados e Botão de Ação -->
						<div class="pt-3 border-t border-zinc-900/80 flex items-center justify-between gap-3">
							<div class="flex items-center gap-4 text-xs font-mono">
								<div>
									<span class="text-zinc-500 block text-[10px] uppercase">Inscritos</span>
									<span class="text-white font-bold text-sm">{evento.total_inscritos}</span>
								</div>
								<div class="h-6 w-px bg-zinc-800"></div>
								<div>
									<span class="text-zinc-500 block text-[10px] uppercase">Homologados</span>
									<span class="text-emerald-400 font-bold text-sm">{evento.total_homologados}</span>
								</div>
							</div>

							<a
								href="/dashboard/graduacoes/{evento.id_evento}"
								class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs border border-zinc-800 transition-all group-hover:border-red-900/60 group-hover:bg-red-950/20"
							>
								<span>{data.podeHomologar ? 'Gerenciar Exame' : 'Consultar Exame'}</span>
								<ArrowRight class="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-400 transition-transform group-hover:translate-x-0.5" />
							</a>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-8 rounded-2xl bg-zinc-950 border border-zinc-900 text-center space-y-3">
				<Award class="w-8 h-8 text-zinc-600 mx-auto" />
				<h3 class="text-sm font-bold text-white">Nenhum exame de graduação agendado</h3>
				<p class="text-xs text-zinc-400 max-w-md mx-auto">
					Crie o primeiro exame de graduação do dojo com data, requisitos de carência por meses no judô e na faixa atual para verificar automaticamente a aptidão dos atletas.
				</p>
				{#if data.podeHomologar}
					<a
						href="/dashboard/graduacoes/novo"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs mt-2"
					>
						<Plus class="w-3.5 h-3.5" />
						<span>Criar Exame de Graduação</span>
					</a>
				{/if}
			</div>
		{/if}
	</div>

	<!-- SEÇÃO 2: CENSO DE GRADUAÇÃO DO DOJO -->
	<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Users class="w-4 h-4 text-zinc-400" />
				<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
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

	<!-- SEÇÃO 3: FEED DE HOMOLOGAÇÕES RECENTES -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
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
										<span class="text-zinc-300 block">
											{grad.associacao || 'Federação Paulista de Judô'}
										</span>
										<span class="text-[11px] font-mono text-zinc-500">
											{grad.nome_evento}
										</span>
									</td>

									<td class="px-6 py-4 text-right">
										<a
											href="/dashboard/graduacoes/historico/{grad.id_aluno}"
											class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-mono transition-colors"
										>
											<span>Trilha</span>
											<ArrowRight class="w-3 h-3" />
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 text-center text-xs text-zinc-500 italic">
				Nenhum registro de graduação homologado recentemente no dojo.
			</div>
		{/if}
	</div>
</div>
