<script lang="ts">
	import type { PainelResponsavelDados } from "#lib/server/repositorios/dashboard.repo";
	import BadgeFaixa from "#lib/components/ui/BadgeFaixa.svelte";
	import BarraAlertasNotificacao from "./BarraAlertasNotificacao.svelte";
	import PainelJudoca from "./PainelJudoca.svelte";
	import {
		Users,
		Calendar,
		Medal,
		UserCheck,
	} from "@lucide/svelte";

	interface Props {
		painel: PainelResponsavelDados;
		nomeAcademia?: string | null;
	}

	let { painel, nomeAcademia = "Judô Hinodê" }: Props = $props();
	const nomeDojo = $derived(nomeAcademia || "Judô Hinodê");

	// Índice do dependente atualmente selecionado na interface
	let indiceSelecionado = $state(0);

	const dependenteAtivo = $derived(
		painel.dependentes.length > 0
			? painel.dependentes[
					Math.min(indiceSelecionado, painel.dependentes.length - 1)
				]
			: null,
	);

	// Pendências do dependente ativo para a barra de alertas
	const pendenciasAtivas = $derived(
		dependenteAtivo?.painelJudoca.pendencias || [],
	);
</script>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 0. BARRA DE ALERTAS COMPACTA (ESTILO NOTIFICAÇÕES MOBILE)                 -->
	<!-- ========================================================================= -->
	<BarraAlertasNotificacao
		pendenciasTecnicas={painel.pendenciasTecnicas}
		pendenciasJudoca={pendenciasAtivas}
		nomeJudocaAlvo={dependenteAtivo?.aluno.nome}
		escopo="responsavel"
		onSelecionarAluno={(idAluno) => {
			const idx = painel.dependentes.findIndex(
				(d) => d.aluno.id_usuario === idAluno,
			);
			if (idx !== -1) {
				indiceSelecionado = idx;
			}
		}}
	/>

	<!-- ========================================================================= -->
	<!-- 1. KPIs RÁPIDOS DA FAMÍLIA / TUTELA                                       -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div
			class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-3"
		>
			<div>
				<span
					class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block"
					>Atletas Sob Tutela</span
				>
				<div class="flex items-baseline gap-1.5 mt-0.5">
					<span class="text-2xl font-black text-white font-display"
						>{painel.totalDependentes}</span
					>
					<span class="text-xs text-zinc-400 font-mono"
						>judoca(s)</span
					>
				</div>
			</div>
			<div
				class="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0"
			>
				<Users class="w-5 h-5" />
			</div>
		</div>

		<div
			class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-3"
		>
			<div>
				<span
					class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block"
					>Aulas Semanais</span
				>
				<div class="flex items-baseline gap-1.5 mt-0.5">
					<span
						class="text-2xl font-black text-emerald-400 font-display"
						>{painel.totalTurmasAtivas}</span
					>
					<span class="text-xs text-zinc-400 font-mono"
						>horário(s)</span
					>
				</div>
			</div>
			<div
				class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0"
			>
				<Calendar class="w-5 h-5" />
			</div>
		</div>

		<div
			class="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-3"
		>
			<div>
				<span
					class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block"
					>Pódios da Família</span
				>
				<div class="flex items-baseline gap-1.5 mt-0.5">
					<span
						class="text-2xl font-black text-amber-400 font-display"
						>{painel.totalMedalhasFamilia}</span
					>
					<span class="text-xs text-zinc-400 font-mono"
						>medalha(s)</span
					>
				</div>
			</div>
			<div
				class="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0"
			>
				<Medal class="w-5 h-5" />
			</div>
		</div>
	</div>

	{#if painel.dependentes.length === 0}
		<!-- ESTADO VAZIO: NENHUM DEPENDENTE VINCULADO -->
		<div
			class="p-12 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-4"
		>
			<div
				class="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto"
			>
				<Users class="w-8 h-8 text-zinc-500" />
			</div>
			<div class="max-w-md mx-auto space-y-1">
				<h3 class="text-base font-bold text-white font-display">
					Nenhum judoca vinculado ao seu perfil
				</h3>
				<p class="text-xs text-zinc-400 leading-relaxed">
					Não encontramos atletas cadastrados sob sua responsabilidade
					legal no momento. Solicite à secretaria ou ao Sensei da
					academia a vinculação da matrícula do seu dependente.
				</p>
			</div>
		</div>
	{:else}
		<!-- ========================================================================= -->
		<!-- 2. SELETOR DE ATLETA TUTELADO (TABS MULTI-FILHOS)                         -->
		<!-- ========================================================================= -->
		{#if painel.dependentes.length > 1}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Users class="w-4 h-4 text-emerald-500" />
						<span
							class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold"
						>
							Selecione o Atleta para Visualizar:
						</span>
					</div>
					<span class="text-xs text-zinc-500 font-mono">
						{painel.dependentes.length} judocas cadastrados
					</span>
				</div>

				<div
					class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
				>
					{#each painel.dependentes as dep, idx}
						{@const isSelected = idx === indiceSelecionado}
						{@const hasAction = dep.painelJudoca.pendencias.some(
							(p) => p.dependeDoAluno,
						)}
						<button
							type="button"
							onclick={() => (indiceSelecionado = idx)}
							class="p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 {isSelected
								? 'bg-zinc-900 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
								: 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}"
						>
							<div class="space-y-1 min-w-0">
								<div class="flex items-center gap-2">
									<span
										class="text-sm font-bold text-white truncate block"
									>
										{dep.aluno.nome}
									</span>
									{#if hasAction}
										<span
											class="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"
											title="Ação requerida"
										></span>
									{/if}
								</div>
								<div
									class="flex items-center gap-2 text-xs text-zinc-400 font-mono"
								>
									<span>{dep.aluno.idade} anos</span>
									<span>•</span>
									<span class="text-emerald-400 font-semibold"
										>{dep.aluno.grau_parentesco}</span
									>
								</div>
							</div>

							<div class="shrink-0">
								<BadgeFaixa
									faixa={dep.aluno.graduacao_atual}
									size="sm"
								/>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if dependenteAtivo}
			<!-- ========================================================================= -->
			<!-- 3. CONTEXTO DO ATLETA SELECIONADO                                         -->
			<!-- ========================================================================= -->
			<div
				class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-sm"
			>
				<div class="flex items-center gap-3 flex-wrap text-xs">
					<span
						class="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"
					>
						<UserCheck class="w-3.5 h-3.5 text-emerald-400" />
						<span>{dependenteAtivo.aluno.grau_parentesco}</span>
					</span>
					<div class="flex items-baseline gap-2">
						<span class="font-extrabold text-white text-base font-display">
							{dependenteAtivo.aluno.nome}
						</span>
						<span class="text-xs text-zinc-400 font-mono">
							({dependenteAtivo.aluno.idade} anos • Nasc. {dependenteAtivo.aluno.data_nascimento_br})
						</span>
					</div>
					{#if dependenteAtivo.aluno.financeiro}
						<span class="text-zinc-600 hidden sm:inline">•</span>
						<span class="text-[11px] font-mono text-emerald-400 font-medium">
							Responsável Financeiro ✓
						</span>
					{/if}
				</div>

				<div class="flex items-center gap-2 self-start sm:self-auto">
					<span class="text-xs font-mono text-zinc-500">Graduação Atual:</span>
					<BadgeFaixa
						faixa={dependenteAtivo.aluno.graduacao_atual}
						size="sm"
					/>
				</div>
			</div>

			<!-- ========================================================================= -->
			<!-- 4. PAINEL DO ALUNO COMPLETO (SINCRONIZADO E 100% IDÊNTICO)                -->
			<!-- ========================================================================= -->
			{#key dependenteAtivo.aluno.id_usuario}
				<PainelJudoca
					painel={dependenteAtivo.painelJudoca}
					nomeAcademia={nomeDojo}
					mostrarAlertas={false}
				/>
			{/key}
		{/if}
	{/if}
</div>
