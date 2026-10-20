<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		Trophy,
		Calendar,
		MapPin,
		Users,
		Award,
		ArrowLeft,
		UserPlus,
		CheckCircle2,
		XCircle,
		Clock,
		AlertCircle,
		Medal,
		Trash2,
		ShieldCheck,
		UserCheck,
		AlertTriangle,
		Filter,
		Edit3,
		DollarSign,
		Sparkles,
		Save,
		X
	} from '@lucide/svelte';
	import { SUGESTOES_CLASSIFICACAO_ACADEMIA } from '#lib/dominio/campeonato';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let abaAtiva = $state<'inscricoes' | 'resultados'>('inscricoes');
	let tipoParticipante = $state<'aluno' | 'professor'>('aluno');
	let participanteSelecionado = $state<number | ''>('');
	let carregandoInscricao = $state(false);
	let carregandoAcao = $state(false);
	let carregandoResultado = $state(false);
	let carregandoClassificacaoDojo = $state(false);
	let carregandoAutoInscricao = $state(false);
	let carregandoExclusao = $state(false);
	let modalExclusaoAberto = $state(false);

	// Modais de Edição e Exclusão de Resultado do Atleta
	let modalEditarResultadoAberto = $state(false);
	let modalExcluirResultadoAberto = $state(false);
	let carregandoEdicaoResultado = $state(false);
	let carregandoExclusaoResultado = $state(false);
	let resultadoEmEdicao = $state<{
		id_classificacao: number;
		id_aluno: number;
		nome_aluno: string;
		faixa_aluno: string;
		classificacao_aluno: string;
		qtd_lutas: number;
		qtd_vitorias: number;
	} | null>(null);
	let resultadoEmExclusao = $state<{
		id_classificacao: number;
		nome_aluno: string;
		classificacao_aluno: string;
	} | null>(null);

	function abrirEdicaoResultado(res: (typeof data.resultados)[number]) {
		resultadoEmEdicao = { ...res };
		modalEditarResultadoAberto = true;
	}

	function abrirExclusaoResultado(res: (typeof data.resultados)[number]) {
		resultadoEmExclusao = {
			id_classificacao: res.id_classificacao,
			nome_aluno: res.nome_aluno,
			classificacao_aluno: res.classificacao_aluno
		};
		modalExcluirResultadoAberto = true;
	}

	// Filtro de alunos já inscritos no campeonato
	const idsAlunosInscritos = $derived(
		new Set(
			data.inscricoes
				.filter((i) => i.tipo_participante === 'aluno')
				.map((i) => i.id_participante)
		)
	);

	// Separa participantes confirmados da lista oficial vs inscrições com confirmação pendente
	const participantesConfirmados = $derived(
		data.inscricoes.filter((i) => i.status_inscricao === 'Confirmada')
	);

	const inscricoesPendentes = $derived(
		data.inscricoes.filter((i) => i.status_inscricao === 'Pendente')
	);

	// Alunos disponíveis para inscrição (ainda não inscritos neste torneio)
	const alunosDisponiveis = $derived(
		data.alunos.filter((a) => !idsAlunosInscritos.has(a.id_usuario))
	);

	const taxaFormatada = $derived(
		data.campeonato.valor_inscricao !== null && Number(data.campeonato.valor_inscricao) > 0
			? `R$ ${Number(data.campeonato.valor_inscricao).toFixed(2)}`
			: 'Isento / Gratuito'
	);
</script>

<svelte:head>
	<title>{data.campeonato.nome} - Gestão de Participantes e Campeonato</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<a
			href="/dashboard/campeonatos"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Campeonatos</span>
		</a>

		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-2xl relative overflow-hidden">
			<!-- Brilho sutil vermelho de fundo -->
			<div class="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

			<div class="relative z-10 flex-1">
				<div class="flex flex-wrap items-center gap-2 mb-2">
					<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
						{data.campeonato.tipo_campeonato || 'Competição Oficial'}
					</span>
					<span class="text-xs text-zinc-600">•</span>
					<span class="text-xs text-zinc-400 font-mono">Evento #{data.campeonato.id_evento}</span>
				</div>

				<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
					{data.campeonato.nome}
				</h1>
				<p class="text-xs sm:text-sm text-zinc-400 mt-1">
					{data.campeonato.edicao ? `${data.campeonato.edicao} • ` : ''}
					{data.campeonato.logradouro}{data.campeonato.numero && data.campeonato.numero !== 'S/N' ? `, nº ${data.campeonato.numero}` : ''}{data.campeonato.complemento ? ` (${data.campeonato.complemento})` : ''}{data.campeonato.bairro ? ` - ${data.campeonato.bairro}` : ''}, {data.campeonato.cidade} - {data.campeonato.uf}
				</p>

				<!-- Restrições do Campeonato: Graduação, Categoria, Idade e Taxa -->
				<div class="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-900">
					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-300">
						<span class="text-red-400 font-bold uppercase text-[10px]">Faixas:</span>
						<span class="font-semibold text-white">{data.rotuloFaixas}</span>
					</div>

					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-300">
						<span class="text-amber-400 font-bold uppercase text-[10px]">Categoria:</span>
						<span class="font-semibold text-white">{data.campeonato.limite_grupo || 'Todos'}</span>
					</div>

					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-300">
						<span class="text-sky-400 font-bold uppercase text-[10px]">Idade:</span>
						<span class="font-semibold text-white">{data.rotuloIdade}</span>
					</div>

					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-300">
						<span class="text-emerald-400 font-bold uppercase text-[10px]">Taxa:</span>
						<span class="font-semibold text-emerald-300 font-mono">{taxaFormatada}</span>
					</div>

					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-300">
						<span class="text-purple-400 font-bold uppercase text-[10px]">Período de Inscrição:</span>
						<span class="font-semibold text-white">{data.rotuloPeriodoInscricao}</span>
					</div>

					{#if data.campeonato.classificacao_academia}
						<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-amber-950/60 border border-amber-800/80 text-amber-300 shadow-sm">
							<Trophy class="w-3.5 h-3.5 text-amber-400 shrink-0" />
							<span class="text-amber-400/80 uppercase text-[10px] font-bold">Colocação Hinodê:</span>
							<span class="font-extrabold text-amber-200">{data.campeonato.classificacao_academia}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- CONTADORES E AÇÕES DO PROFESSOR -->
			<div class="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 relative z-10 shrink-0">
				<div class="flex flex-wrap items-center gap-2">
					<div class="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
						<span class="text-[10px] font-mono uppercase text-zinc-500 block">Data de Disputa</span>
						<span class="text-xs font-mono font-bold text-white">{data.campeonato.data_inicio}</span>
					</div>
					<div class="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
						<span class="text-[10px] font-mono uppercase text-zinc-500 block">Inscrições</span>
						{#if data.statusPeriodoInscricao.aberta}
							<span class="text-xs font-mono font-bold text-emerald-400">Abertas</span>
						{:else}
							<span class="text-xs font-mono font-bold text-red-400">Encerradas</span>
						{/if}
					</div>
					<div class="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
						<span class="text-[10px] font-mono uppercase text-zinc-500 block">Lista Oficial</span>
						<span class="text-xs font-mono font-bold text-emerald-400">
							{participantesConfirmados.length} judocas
						</span>
					</div>
					{#if inscricoesPendentes.length > 0}
						<div class="px-3.5 py-2 rounded-xl bg-amber-950/30 border border-amber-900/50 text-center">
							<span class="text-[10px] font-mono uppercase text-amber-500 block">Pendentes</span>
							<span class="text-xs font-mono font-bold text-amber-400">
								{inscricoesPendentes.length}
							</span>
						</div>
					{/if}
				</div>

				<!-- Botões de Ação do Professor/Admin -->
				{#if data.ehProfessorOuAdmin}
					<div class="flex items-center gap-2 pt-2 lg:pt-0">
						<a
							href="/dashboard/campeonatos/{data.campeonato.id_evento}/editar"
							class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition-all shadow-sm"
						>
							<Edit3 class="w-3.5 h-3.5 text-zinc-400" />
							<span>Editar Campeonato</span>
						</a>

						<button
							type="button"
							onclick={() => (modalExclusaoAberto = true)}
							class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-xs font-medium text-red-300 hover:text-red-200 transition-all shadow-sm"
						>
							<Trash2 class="w-3.5 h-3.5" />
							<span>Excluir</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- MENSAGENS DE FEEDBACK -->
	{#if form?.sucessoAutoInscricao}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-3">
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoAutoInscricao}</span>
		</div>
	{/if}

	{#if form?.sucessoConfirmacao}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-3">
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoConfirmacao}</span>
		</div>
	{/if}

	{#if form?.sucessoRemocao}
		<div class="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs sm:text-sm flex items-center gap-3">
			<CheckCircle2 class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.sucessoRemocao}</span>
		</div>
	{/if}

	{#if form?.sucessoClassificacaoDojo}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-3">
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoClassificacaoDojo}</span>
		</div>
	{/if}

	{#if form?.sucessoEdicaoResultado}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-3">
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoEdicaoResultado}</span>
		</div>
	{/if}

	{#if form?.sucessoExclusaoResultado}
		<div class="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs sm:text-sm flex items-center gap-3">
			<CheckCircle2 class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.sucessoExclusaoResultado}</span>
		</div>
	{/if}

	{#if form?.erroClassificacaoDojo}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-center gap-3">
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.erroClassificacaoDojo}</span>
		</div>
	{/if}

	{#if form?.sucessoInscricao}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-3">
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>Judoca adicionado com sucesso! A confirmação do atleta (e do responsável, se menor) foi solicitada.</span>
		</div>
	{/if}

	{#if form?.erroInscricao || form?.erro}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-center gap-3">
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.erroInscricao || form.erro}</span>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- ABORDAGEM B: AUTO-INSCRIÇÃO DO JUDOCA OU DO RESPONSÁVEL LEGAL -->
	<!-- ========================================================================= -->
	{#if data.alunoLogadoAuto}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<UserCheck class="w-4 h-4 text-red-500" />
					<h3 class="text-sm font-bold text-white font-display">
						Sua Inscrição no Campeonato (Judoca)
					</h3>
				</div>
				<BadgeFaixa faixa={data.alunoLogadoAuto.graduacao_atual} size="sm" />
			</div>

			{#if data.alunoLogadoAuto.inscricao}
				<!-- Judoca já possui inscrição no campeonato -->
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl {data.alunoLogadoAuto.inscricao.status_inscricao === 'Confirmada' ? 'bg-emerald-950/30 border border-emerald-800/60' : 'bg-amber-950/30 border border-amber-800/60'}">
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							{#if data.alunoLogadoAuto.inscricao.status_inscricao === 'Confirmada'}
								<CheckCircle2 class="w-4 h-4 text-emerald-400" />
								<span class="text-xs font-bold text-emerald-300">Você está na Lista Oficial de Participantes!</span>
							{:else}
								<Clock class="w-4 h-4 text-amber-400" />
								<span class="text-xs font-bold text-amber-300">Inscrição em processamento (Pendente)</span>
							{/if}
						</div>
						<p class="text-xs text-zinc-400">
							{#if data.alunoLogadoAuto.inscricao.status_inscricao === 'Confirmada'}
								Sua participação foi validada e seu tatame de disputa está garantido. Boa luta!
							{:else if !data.alunoLogadoAuto.inscricao.confirmado_atleta}
								Você precisa confirmar sua participação abaixo para validar sua vaga.
							{:else}
								Sua confirmação foi registrada. Como você é menor de idade, aguarda autorização do responsável legal.
							{/if}
						</p>
					</div>

					{#if data.alunoLogadoAuto.inscricao.status_inscricao === 'Pendente' && !data.alunoLogadoAuto.inscricao.confirmado_atleta}
						<form action="?/confirmarAtleta" method="POST" use:enhance>
							<input type="hidden" name="idInscricao" value={data.alunoLogadoAuto.inscricao.id_inscricao} />
							<button
								type="submit"
								class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all"
							>
								<UserCheck class="w-4 h-4" />
								<span>Confirmar Minha Vaga</span>
							</button>
						</form>
					{/if}
				</div>
			{:else}
				<!-- Judoca ainda não inscrito -->
				{#if !data.statusPeriodoInscricao.aberta}
					<div class="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-start gap-3">
						<Clock class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
						<div>
							<span class="text-xs font-bold text-amber-300 block">Inscrições Não Disponíveis</span>
							<p class="text-xs text-amber-200/80 mt-0.5">
								{data.statusPeriodoInscricao.motivo}
							</p>
						</div>
					</div>
				{:else if data.alunoLogadoAuto.elegivel}
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<Sparkles class="w-4 h-4 text-emerald-400" />
								<span class="text-xs font-bold text-white">Você está elegível para disputar este torneio!</span>
							</div>
							<p class="text-xs text-zinc-400">
								Sua graduação ({data.alunoLogadoAuto.graduacao_atual}) e idade ({data.alunoLogadoAuto.idade} anos) estão dentro das exigências.
								Taxa de inscrição: <span class="font-bold text-emerald-400">{taxaFormatada}</span>.
							</p>
						</div>

						<form
							action="?/autoInscrever"
							method="POST"
							use:enhance={() => {
								carregandoAutoInscricao = true;
								return async ({ update }) => {
									await update();
									carregandoAutoInscricao = false;
								};
							}}
						>
							<input type="hidden" name="idAluno" value={data.alunoLogadoAuto.id_usuario} />
							<button
								type="submit"
								disabled={carregandoAutoInscricao}
								class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-[0_0_15px_rgba(220,38,38,0.25)] transition-all disabled:opacity-50"
							>
								{#if carregandoAutoInscricao}
									<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
									<span>Inscrevendo...</span>
								{:else}
									<UserPlus class="w-4 h-4" />
									<span>Inscrever-se no Campeonato</span>
								{/if}
							</button>
						</form>
					</div>
				{:else}
					<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-3">
						<AlertTriangle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
						<div>
							<span class="text-xs font-bold text-zinc-300 block">Inscrição indisponível para seu perfil</span>
							<p class="text-xs text-zinc-500 mt-0.5">
								Motivo: {data.alunoLogadoAuto.motivoInelegivel || 'Graduação ou categoria fora dos limites do campeonato.'}
							</p>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	<!-- AUTO-INSCRIÇÃO DE DEPENDENTES PELO RESPONSÁVEL LEGAL -->
	{#if data.dependentesResponsavel && data.dependentesResponsavel.length > 0}
		<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2">
					<ShieldCheck class="w-4 h-4 text-sky-400" />
					<h3 class="text-sm font-bold text-white font-display">
						Inscrição de Dependentes (Responsável Legal)
					</h3>
				</div>
				<span class="text-xs font-mono text-zinc-400">
					{data.dependentesResponsavel.length} judoca(s) sob sua tutela
				</span>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each data.dependentesResponsavel as dep}
					<div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between space-y-3">
						<div>
							<div class="flex items-start justify-between gap-2">
								<div>
									<h4 class="text-xs font-bold text-white">{dep.nome}</h4>
									<span class="text-[10px] font-mono text-zinc-500">{dep.grau_parentesco} • {dep.idade} anos</span>
								</div>
								<BadgeFaixa faixa={dep.graduacao_atual} size="sm" />
							</div>

							<!-- Status ou Elegibilidade -->
							<div class="mt-2 text-xs">
								{#if dep.inscricao}
									{#if dep.inscricao.status_inscricao === 'Confirmada'}
										<span class="inline-flex items-center gap-1 text-emerald-400 font-medium">
											<CheckCircle2 class="w-3.5 h-3.5" />
											<span>Confirmado na Lista Oficial</span>
										</span>
									{:else}
										<div class="space-y-1">
											<span class="inline-flex items-center gap-1 text-amber-400 font-medium">
												<Clock class="w-3.5 h-3.5" />
												<span>Inscrição Pendente</span>
											</span>
											{#if !dep.inscricao.confirmado_responsavel}
												<p class="text-[11px] text-zinc-400">Aguardando sua autorização como responsável.</p>
											{/if}
										</div>
									{/if}
								{:else if dep.elegivel}
									<span class="text-emerald-400 text-[11px]">✓ Elegível para este torneio</span>
								{:else}
									<span class="text-amber-400 text-[11px]">🚫 Inelegível: {dep.motivoInelegivel}</span>
								{/if}
							</div>
						</div>

						<!-- Botão de Inscrição ou Autorização -->
						<div class="pt-2 border-t border-zinc-900">
							{#if dep.inscricao}
								{#if dep.inscricao.status_inscricao === 'Pendente' && !dep.inscricao.confirmado_responsavel}
									<form action="?/confirmarResponsavel" method="POST" use:enhance>
										<input type="hidden" name="idInscricao" value={dep.inscricao.id_inscricao} />
										<button
											type="submit"
											class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs transition-colors"
										>
											<ShieldCheck class="w-3.5 h-3.5" />
											<span>Autorizar Participação</span>
										</button>
									</form>
								{/if}
							{:else if dep.elegivel}
								{#if !data.statusPeriodoInscricao.aberta}
									<div class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-center gap-1.5 text-center">
										<Clock class="w-3.5 h-3.5 text-amber-400 shrink-0" />
										<span>{data.statusPeriodoInscricao.motivo || 'Inscrições encerradas'}</span>
									</div>
								{:else}
									<form action="?/autoInscrever" method="POST" use:enhance>
										<input type="hidden" name="idAluno" value={dep.id_usuario} />
										<button
											type="submit"
											class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
										>
											<UserPlus class="w-3.5 h-3.5" />
											<span>Inscrever Judoca ({taxaFormatada})</span>
										</button>
									</form>
								{/if}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- NAVEGAÇÃO DE ABAS -->
	<div class="flex items-center gap-2 border-b border-zinc-900 pb-2">
		<button
			type="button"
			onclick={() => (abaAtiva = 'inscricoes')}
			class="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all {abaAtiva === 'inscricoes'
				? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
				: 'text-zinc-500 hover:text-zinc-300'}"
		>
			Participantes & Inscrições ({data.inscricoes.length})
		</button>

		<button
			type="button"
			onclick={() => (abaAtiva = 'resultados')}
			class="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all {abaAtiva === 'resultados'
				? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm'
				: 'text-zinc-500 hover:text-zinc-300'}"
		>
			Desempenho & Medalhas ({data.resultados.length})
		</button>
	</div>

	<!-- ========================================================================= -->
	<!-- ABA 1: GESTÃO DE PARTICIPANTES, CONFIRMAÇÕES E LISTA DO CAMPEONATO -->
	<!-- ========================================================================= -->
	{#if abaAtiva === 'inscricoes'}
		<div class="space-y-8">
			<!-- 1. PROFESSOR ADICIONA ATLETAS AO CAMPEONATO -->
			{#if data.ehProfessorOuAdmin}
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-900">
						<div>
							<div class="flex items-center gap-2">
								<UserPlus class="w-4 h-4 text-red-500" />
								<h3 class="text-sm font-bold text-white font-display">
									Adicionar Judoca ao Campeonato (Sensei)
								</h3>
							</div>
							<p class="text-[11px] text-zinc-500 mt-0.5">
								O atleta será convidado. Ele confirma sua vaga e, se for menor de idade, o responsável legal também confirma.
							</p>
						</div>

						<div class="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
							<span class="text-zinc-500">Regras:</span>
							<span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-red-300 font-semibold">
								{data.rotuloFaixas}
							</span>
							<span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-sky-300 font-semibold">
								{data.rotuloIdade}
							</span>
						</div>
					</div>

					{#if !data.statusPeriodoInscricao.aberta}
						<div class="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-2.5">
							<Clock class="w-4 h-4 text-amber-400 shrink-0" />
							<div>
								<span class="font-bold block">{data.statusPeriodoInscricao.motivo}</span>
								<span class="text-[11px] text-amber-300/70">Novas inscrições estão bloqueadas para este campeonato.</span>
							</div>
						</div>
					{/if}

					<form
						action="?/inscrever"
						method="POST"
						use:enhance={() => {
							carregandoInscricao = true;
							return async ({ update }) => {
								await update();
								carregandoInscricao = false;
								participanteSelecionado = '';
							};
						}}
						class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
					>
						<!-- Tipo de Competidor -->
						<div>
							<label for="tipoParticipante" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
								Tipo
							</label>
							<select
								id="tipoParticipante"
								name="tipoParticipante"
								bind:value={tipoParticipante}
								class="w-full px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
							>
								<option value="aluno">Judoca / Aluno</option>
								<option value="professor">Sensei Competidor</option>
							</select>
						</div>

						<!-- Seleção do Competidor filtrando elegibilidade -->
						<div class="sm:col-span-2">
							<label for="idParticipante" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
								Selecione o Competidor *
							</label>
							<select
								id="idParticipante"
								name="idParticipante"
								bind:value={participanteSelecionado}
								required
								class="w-full px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
							>
								<option value="">Selecione quem irá disputar...</option>
								{#if tipoParticipante === 'aluno'}
									{#each alunosDisponiveis as aluno}
										<option
											value={aluno.id_usuario}
											disabled={!aluno.elegivel}
										>
											{#if aluno.elegivel}
												🥋 {aluno.nome} ({aluno.graduacao_atual}) • {aluno.grupo_especial_aspirante || 'Geral'} • {aluno.idade} anos {aluno.menor_idade ? '[Menor]' : '[Maior]'}
											{:else}
												🚫 {aluno.nome} ({aluno.graduacao_atual}) • Inelegível: {aluno.motivoInelegivel}
											{/if}
										</option>
									{/each}
								{:else}
									{#each data.professores as prof}
										<option value={prof.id_usuario}>
											🥋 Sensei {prof.nome} ({prof.grau_faixa || 'Faixa Preta'})
										</option>
									{/each}
								{/if}
							</select>
						</div>

						<!-- Botão de Inscrição -->
						<div>
							<button
								type="submit"
								disabled={!data.statusPeriodoInscricao.aberta || carregandoInscricao || !participanteSelecionado}
								class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all disabled:opacity-50"
							>
								{#if carregandoInscricao}
									<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
									<span>Adicionando...</span>
								{:else}
									<UserPlus class="w-4 h-4" />
									<span>Adicionar Atleta</span>
								{/if}
							</button>
						</div>
					</form>
				</div>
			{/if}

			<!-- 2. LISTA OFICIAL DE PARTICIPANTES DO CAMPEONATO (CONFIRMADOS) -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<ShieldCheck class="w-4 h-4 text-emerald-400" />
						<h2 class="text-sm font-bold text-white font-display">
							Lista Oficial de Participantes do Campeonato
						</h2>
						<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-300">
							{participantesConfirmados.length} confirmados
						</span>
					</div>
					<span class="text-[11px] text-zinc-500 font-mono">
						Atletas com confirmação validada
					</span>
				</div>

				{#if participantesConfirmados.length > 0}
					<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
						<div class="overflow-x-auto">
							<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
								<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
									<tr>
										<th class="px-6 py-4">Judoca Competidor</th>
										<th class="px-6 py-4">Graduação / Faixa</th>
										<th class="px-6 py-4">Categoria / Idade</th>
										<th class="px-6 py-4">Taxa</th>
										<th class="px-6 py-4">Confirmações Validadas</th>
										{#if data.ehProfessorOuAdmin}
											<th class="px-6 py-4 text-right">Ação do Professor</th>
										{/if}
									</tr>
								</thead>
								<tbody class="divide-y divide-zinc-900">
									{#each participantesConfirmados as inscr}
										<tr class="hover:bg-zinc-900/30 transition-colors">
											<td class="px-6 py-4">
												<div class="font-semibold text-white">
													{inscr.nome_participante}
												</div>
												<span class="text-[10px] font-mono text-zinc-500 uppercase">
													{inscr.tipo_participante === 'aluno' ? 'Judoca Oficial' : 'Professor Competidor'}
												</span>
											</td>

											<td class="px-6 py-4">
												<BadgeFaixa faixa={inscr.faixa_participante} size="sm" />
											</td>

											<td class="px-6 py-4">
												<div class="text-xs text-zinc-300 font-medium">
													{inscr.grupo_participante || 'Aspirante'}
												</div>
												<span class="text-[11px] font-mono text-zinc-500">
													{inscr.idade} anos • {inscr.menor_idade ? 'Menor' : 'Maior'}
												</span>
											</td>

											<td class="px-6 py-4 font-mono text-xs text-emerald-400">
												{inscr.valor !== null && Number(inscr.valor) > 0 ? `R$ ${Number(inscr.valor).toFixed(2)}` : 'Isento'}
											</td>

											<td class="px-6 py-4">
												<div class="space-y-1">
													<div class="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
														<CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
														<span>Atleta confirmou {inscr.data_confirmacao_atleta ? `(${inscr.data_confirmacao_atleta})` : ''}</span>
													</div>
													{#if inscr.menor_idade}
														<div class="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 block">
															<CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
															<span>Responsável ({inscr.nome_responsavel || 'Legal'}) autorizou</span>
														</div>
													{:else}
														<div class="text-[10px] font-mono text-zinc-500">
															Dispensado: Maior de 18 anos
														</div>
													{/if}
												</div>
											</td>

											{#if data.ehProfessorOuAdmin}
												<td class="px-6 py-4 text-right">
													<form
														action="?/removerAtleta"
														method="POST"
														use:enhance={() => {
															carregandoAcao = true;
															return async ({ update }) => {
																await update();
																carregandoAcao = false;
															};
														}}
														class="inline-block"
													>
														<input type="hidden" name="idInscricao" value={inscr.id_inscricao} />
														<button
															type="submit"
															disabled={carregandoAcao}
															title="Remover atleta da lista do campeonato"
															class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-800 text-[11px] text-zinc-400 hover:text-red-300 transition-colors"
														>
															<Trash2 class="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
															<span>Remover da Lista</span>
														</button>
													</form>
												</td>
											{/if}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{:else}
					<div class="p-8 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center">
						<Users class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
						<h4 class="text-sm font-bold text-white font-display">Nenhum competidor confirmado ainda</h4>
						<p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
							Atletas adicionados pelo professor ou auto-inscritos aparecerão aqui assim que confirmarem (e o responsável autorizar, caso seja menor).
						</p>
					</div>
				{/if}
			</div>

			<!-- 3. INSCRIÇÕES PENDENTES DE CONFIRMAÇÃO (AGUARDANDO ATLETA / RESPONSÁVEL) -->
			{#if inscricoesPendentes.length > 0}
				<div class="space-y-3 pt-4 border-t border-zinc-900">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4 text-amber-400" />
							<h2 class="text-sm font-bold text-white font-display">
								Inscrições Pendentes de Confirmação
							</h2>
							<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-800 text-amber-300">
								{inscricoesPendentes.length} aguardando
							</span>
						</div>
						<span class="text-[11px] text-zinc-500 font-mono">
							Ingressam na lista oficial após as confirmações
						</span>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each inscricoesPendentes as pend}
							{@const souOAtleta = Boolean(data.usuarioLogadoId && data.usuarioLogadoId === pend.id_participante)}
							{@const souOResponsavel = Boolean(data.usuarioLogadoId && (pend.ids_responsaveis?.includes(data.usuarioLogadoId) || data.usuarioLogadoId === pend.id_responsavel))}

							<div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4">
								<div>
									<!-- Topo do Card -->
									<div class="flex items-start justify-between gap-3 mb-2">
										<div>
											<h4 class="text-sm font-bold text-white font-display">
												{pend.nome_participante}
											</h4>
											<div class="flex items-center gap-2 mt-1">
												<BadgeFaixa faixa={pend.faixa_participante} size="sm" />
												<span class="text-[11px] font-mono text-zinc-400">
													{pend.grupo_participante || 'Aspirante'} • {pend.idade} anos
												</span>
											</div>
										</div>

										{#if pend.menor_idade}
											<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950/60 border border-amber-800/80 text-amber-300 shrink-0">
												Menor de Idade
											</span>
										{:else}
											<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
												Maior de Idade
											</span>
										{/if}
									</div>

									<!-- Status de Cada Confirmação Exigida -->
									<div class="space-y-2 mt-3 pt-3 border-t border-zinc-900/80 text-xs font-mono">
										<!-- 1. Atleta -->
										<div class="flex items-center justify-between gap-2">
											<span class="text-zinc-500 text-[11px]">1. Confirmação do Atleta:</span>
											{#if pend.confirmado_atleta}
												<span class="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
													<CheckCircle2 class="w-3 h-3" />
													<span>Confirmado</span>
												</span>
											{:else}
												<span class="inline-flex items-center gap-1 text-amber-400 text-[11px]">
													<Clock class="w-3 h-3" />
													<span>Pendente</span>
												</span>
											{/if}
										</div>

										<!-- 2. Responsável -->
										<div class="flex items-center justify-between gap-2">
											<span class="text-zinc-500 text-[11px]">2. Autorização do Responsável:</span>
											{#if !pend.menor_idade}
												<span class="text-zinc-500 text-[11px]">Dispensado (18+ anos)</span>
											{:else if pend.confirmado_responsavel}
												<span class="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
													<CheckCircle2 class="w-3 h-3" />
													<span>Autorizado ({pend.nome_responsavel || 'Legal'})</span>
												</span>
											{:else}
												<span class="inline-flex items-center gap-1 text-amber-400 text-[11px]">
													<Clock class="w-3 h-3" />
													<span>Aguardando {pend.nome_responsavel ? `(${pend.nome_responsavel})` : 'autorização'}</span>
												</span>
											{/if}
										</div>
									</div>
								</div>

								<!-- Ações de Confirmação & Remoção -->
								<div class="pt-3 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2">
									<div class="flex flex-wrap items-center gap-2">
										<!-- Botão de Confirmação pelo Atleta -->
										{#if !pend.confirmado_atleta && (souOAtleta || data.ehProfessorOuAdmin)}
											<form action="?/confirmarAtleta" method="POST" use:enhance class="inline-block">
												<input type="hidden" name="idInscricao" value={pend.id_inscricao} />
												<button
													type="submit"
													class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-xs font-semibold text-emerald-300 transition-colors"
												>
													<UserCheck class="w-3.5 h-3.5" />
													<span>{souOAtleta ? 'Confirmar Minha Vaga' : 'Confirmar pelo Atleta'}</span>
												</button>
											</form>
										{/if}

										<!-- Botão de Autorização pelo Responsável (se menor) -->
										{#if pend.menor_idade && !pend.confirmado_responsavel && (souOResponsavel || data.ehProfessorOuAdmin)}
											<form action="?/confirmarResponsavel" method="POST" use:enhance class="inline-block">
												<input type="hidden" name="idInscricao" value={pend.id_inscricao} />
												<button
													type="submit"
													class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800 text-xs font-semibold text-sky-300 transition-colors"
												>
													<ShieldCheck class="w-3.5 h-3.5" />
													<span>{souOResponsavel ? 'Autorizar como Responsável' : 'Autorizar pelo Responsável'}</span>
												</button>
											</form>
										{/if}
									</div>

									<!-- Professor pode remover atletas da lista -->
									{#if data.ehProfessorOuAdmin}
										<form action="?/removerAtleta" method="POST" use:enhance class="inline-block">
											<input type="hidden" name="idInscricao" value={pend.id_inscricao} />
											<button
												type="submit"
												title="Remover atleta da lista do campeonato"
												class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-800 text-[11px] text-zinc-400 hover:text-red-300 transition-colors"
											>
												<Trash2 class="w-3 h-3" />
												<span>Remover</span>
											</button>
										</form>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- ABA 2: DESEMPENHO & MEDALHAS (PÓS-CAMPEONATO) -->
	<!-- ========================================================================= -->
	{#if abaAtiva === 'resultados'}
		<div class="space-y-6">
			<!-- CARD DE COLOCAÇÃO GERAL DA ACADEMIA NO CAMPEONATO -->
			<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
							<Trophy class="w-4 h-4" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-white font-display">
								Colocação Geral da Hinodê no Campeonato
							</h3>
							<p class="text-[11px] text-zinc-500">
								Classificação geral da equipe/dojo no quadro oficial da federação ou torneio
							</p>
						</div>
					</div>

					{#if data.campeonato.classificacao_academia}
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/60 border border-amber-800/80 text-amber-300">
							<Trophy class="w-3.5 h-3.5 text-amber-400" />
							<span>{data.campeonato.classificacao_academia}</span>
						</span>
					{:else}
						<span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800">
							Ainda não lançada
						</span>
					{/if}
				</div>

				{#if data.ehProfessorOuAdmin}
					<form
						action="?/salvarClassificacaoDojo"
						method="POST"
						use:enhance={() => {
							carregandoClassificacaoDojo = true;
							return async ({ update }) => {
								await update();
								carregandoClassificacaoDojo = false;
							};
						}}
						class="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
					>
						<div class="flex-1">
							<label for="classificacaoAcademia" class="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
								Colocação da Academia (Texto Livre - ex: Campeã, 2º Lugar, Décima, Vigésima...)
							</label>
							<div class="relative">
								<input
									type="text"
									id="classificacaoAcademia"
									name="classificacaoAcademia"
									list="sugestoesClassificacaoDojo"
									value={data.campeonato.classificacao_academia || ''}
									placeholder="Ex: Campeã Geral, Vice-campeã, 3º Lugar Geral, 10ª Colocada, Vigésima..."
									class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-medium"
								/>
								<datalist id="sugestoesClassificacaoDojo">
									{#each SUGESTOES_CLASSIFICACAO_ACADEMIA as sugestao}
										<option value={sugestao}></option>
									{/each}
								</datalist>
							</div>
							<span class="text-[10px] text-zinc-500 mt-1 block">
								Campo livre: registre qualquer colocação ou troféu do dojo. Deixe em branco para remover.
							</span>
						</div>

						<button
							type="submit"
							disabled={carregandoClassificacaoDojo}
							class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-colors shrink-0 disabled:opacity-50"
						>
							{#if carregandoClassificacaoDojo}
								<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								<span>Gravando...</span>
							{:else}
								<Save class="w-4 h-4" />
								<span>Salvar Colocação</span>
							{/if}
						</button>
					</form>
				{:else if data.campeonato.classificacao_academia}
					<div class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-300 flex items-center gap-2.5">
						<Trophy class="w-4 h-4 text-amber-400 shrink-0" />
						<span>Colocação oficial do dojo Hinodê: <strong class="text-amber-300">{data.campeonato.classificacao_academia}</strong></span>
					</div>
				{/if}
			</div>

			<!-- Alerta de erro de resultado individual -->
			{#if form?.erroResultado}
				<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
					<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
					<span>{form.erroResultado}</span>
				</div>
			{/if}

			<!-- Formulário de Lançamento de Resultado Pós-Campeonato -->
			{#if data.ehProfessorOuAdmin}
				<div class="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
					<div class="flex items-center gap-2">
						<Medal class="w-4 h-4 text-amber-500" />
						<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
							Lançar Desempenho do Judoca (Pós-Torneio)
						</h3>
					</div>

					<form
						action="?/lancarResultado"
						method="POST"
						use:enhance={() => {
							carregandoResultado = true;
							return async ({ update }) => {
								await update();
								carregandoResultado = false;
							};
						}}
						class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
					>
						<div>
							<label for="idAlunoResultado" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
								Judoca Competidor *
							</label>
							<select
								id="idAlunoResultado"
								name="idAluno"
								required
								class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
							>
								<option value="">Selecione o atleta confirmado...</option>
								{#each participantesConfirmados as inscr}
									{#if inscr.tipo_participante === 'aluno'}
										<option value={inscr.id_participante}>
											{inscr.nome_participante} ({inscr.faixa_participante})
										</option>
									{/if}
								{/each}
							</select>
						</div>

						<div>
							<label for="classificacaoAluno" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
								Classificação / Pódio *
							</label>
							<select
								id="classificacaoAluno"
								name="classificacaoAluno"
								required
								class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
							>
								<option value="Ouro / Campeão">🥇 Ouro / Campeão</option>
								<option value="Prata / Vice-Campeão">🥈 Prata / Vice-Campeão</option>
								<option value="Bronze (3º Lugar)">🥉 Bronze (3º Lugar)</option>
								<option value="5º Lugar">5º Lugar</option>
								<option value="Participação">Participação</option>
							</select>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<div>
								<label for="qtdLutas" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
									Lutas *
								</label>
								<input
									type="number"
									id="qtdLutas"
									name="qtdLutas"
									required
									min="0"
									value="3"
									class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-red-600"
								/>
							</div>
							<div>
								<label for="qtdVitorias" class="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
									Vitórias *
								</label>
								<input
									type="number"
									id="qtdVitorias"
									name="qtdVitorias"
									required
									min="0"
									value="3"
									class="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-red-600"
								/>
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={carregandoResultado}
								class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition-colors disabled:opacity-50"
							>
								<Medal class="w-4 h-4 text-amber-500" />
								<span>{carregandoResultado ? 'Gravando...' : 'Lançar Pódio'}</span>
							</button>
						</div>
					</form>
				</div>
			{/if}

			<!-- Tabela de Resultados -->
			<div class="overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900">
				<div class="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
					<h3 class="text-xs font-mono uppercase tracking-wider text-zinc-400">
						Quadro Oficial de Medalhas do Dojo
					</h3>
					<span class="text-xs font-mono text-zinc-500">
						{data.resultados.length} resultado(s)
					</span>
				</div>

				{#if data.resultados.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs sm:text-sm text-zinc-300">
							<thead class="bg-zinc-900/60 text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-900">
								<tr>
									<th class="px-6 py-3.5">Judoca</th>
									<th class="px-6 py-3.5">Faixa</th>
									<th class="px-6 py-3.5">Classificação / Pódio</th>
									<th class="px-6 py-3.5">Combates</th>
									<th class="px-6 py-3.5">Vitórias</th>
									{#if data.ehProfessorOuAdmin}
										<th class="px-6 py-3.5 text-right">Ações</th>
									{/if}
								</tr>
							</thead>
							<tbody class="divide-y divide-zinc-900">
								{#each data.resultados as res}
									<tr class="hover:bg-zinc-900/30 transition-colors">
										<td class="px-6 py-3.5 font-medium text-white">{res.nome_aluno}</td>
										<td class="px-6 py-3.5">
											<BadgeFaixa faixa={res.faixa_aluno} size="sm" />
										</td>
										<td class="px-6 py-3.5">
											{#if res.classificacao_aluno.includes('Ouro')}
												<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 border border-amber-800 text-amber-300">
													🥇 {res.classificacao_aluno}
												</span>
											{:else if res.classificacao_aluno.includes('Prata')}
												<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-800/80 border border-zinc-700 text-zinc-200">
													🥈 {res.classificacao_aluno}
												</span>
											{:else if res.classificacao_aluno.includes('Bronze')}
												<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/30 border border-amber-900 text-amber-500">
													🥉 {res.classificacao_aluno}
												</span>
											{:else}
												<span class="px-2 py-0.5 rounded text-xs text-zinc-400 font-mono">
													{res.classificacao_aluno}
												</span>
											{/if}
										</td>
										<td class="px-6 py-3.5 font-mono">{res.qtd_lutas}</td>
										<td class="px-6 py-3.5 font-mono text-emerald-400 font-bold">{res.qtd_vitorias}</td>
										{#if data.ehProfessorOuAdmin}
											<td class="px-6 py-3.5 text-right">
												<div class="flex items-center justify-end gap-1.5">
													<button
														type="button"
														onclick={() => abrirEdicaoResultado(res)}
														class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors"
														title="Alterar resultado do atleta"
													>
														<Edit3 class="w-3.5 h-3.5 text-zinc-400" />
														<span>Alterar</span>
													</button>

													<button
														type="button"
														onclick={() => abrirExclusaoResultado(res)}
														class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-xs text-red-400 hover:text-red-300 transition-colors"
														title="Apagar lançamento equivocado"
													>
														<Trash2 class="w-3.5 h-3.5" />
														<span>Apagar</span>
													</button>
												</div>
											</td>
										{/if}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="p-8 text-center text-xs text-zinc-500">
						Nenhum resultado computado ainda para este campeonato.
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- ========================================================================= -->
<!-- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DO CAMPEONATO -->
<!-- ========================================================================= -->
{#if modalExclusaoAberto}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-red-950/80 shadow-2xl space-y-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 shrink-0">
					<Trash2 class="w-5 h-5" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-white font-display">Excluir Campeonato</h3>
					<p class="text-xs text-zinc-400">Esta ação não poderá ser desfeita.</p>
				</div>
			</div>

			<div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-300 space-y-1">
				<p>
					Você está prestes a excluir o campeonato:
					<strong class="text-white block mt-0.5">{data.campeonato.nome}</strong>
				</p>
				<p class="text-[11px] text-zinc-400 pt-1">
					Todas as inscrições e registros vinculados a este evento serão permanentemente removidos.
				</p>
			</div>

			<div class="flex items-center justify-end gap-2.5 pt-2">
				<button
					type="button"
					onclick={() => (modalExclusaoAberto = false)}
					disabled={carregandoExclusao}
					class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
				>
					Cancelar
				</button>

				<form
					action="?/excluir"
					method="POST"
					use:enhance={() => {
						carregandoExclusao = true;
						return async ({ update }) => {
							await update();
							carregandoExclusao = false;
						};
					}}
				>
					<button
						type="submit"
						disabled={carregandoExclusao}
						class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
					>
						{#if carregandoExclusao}
							<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
							<span>Excluindo...</span>
						{:else}
							<Trash2 class="w-3.5 h-3.5" />
							<span>Sim, Excluir Campeonato</span>
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL DE EDIÇÃO DE RESULTADO DO ATLETA -->
<!-- ========================================================================= -->
{#if modalEditarResultadoAberto && resultadoEmEdicao}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-lg p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
						<Medal class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-white font-display">
							Alterar Resultado do Judoca
						</h3>
						<p class="text-[11px] text-zinc-400">
							{resultadoEmEdicao.nome_aluno} • Faixa {resultadoEmEdicao.faixa_aluno}
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => (modalEditarResultadoAberto = false)}
					class="text-zinc-500 hover:text-white transition-colors"
					title="Fechar"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				action="?/editarResultado"
				method="POST"
				use:enhance={() => {
					carregandoEdicaoResultado = true;
					return async ({ update }) => {
						await update();
						carregandoEdicaoResultado = false;
						modalEditarResultadoAberto = false;
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="idClassificacao" value={resultadoEmEdicao.id_classificacao} />

				<div>
					<label for="modalClassificacaoAluno" class="block text-xs font-mono uppercase text-zinc-400 mb-1">
						Classificação / Pódio *
					</label>
					<select
						id="modalClassificacaoAluno"
						name="classificacaoAluno"
						bind:value={resultadoEmEdicao.classificacao_aluno}
						required
						class="w-full px-3 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600"
					>
						<option value="Ouro / Campeão">🥇 Ouro / Campeão</option>
						<option value="Prata / Vice-Campeão">🥈 Prata / Vice-Campeão</option>
						<option value="Bronze (3º Lugar)">🥉 Bronze (3º Lugar)</option>
						<option value="5º Lugar">5º Lugar</option>
						<option value="Participação">Participação</option>
					</select>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="modalQtdLutas" class="block text-xs font-mono uppercase text-zinc-400 mb-1">
							Total de Lutas *
						</label>
						<input
							type="number"
							id="modalQtdLutas"
							name="qtdLutas"
							bind:value={resultadoEmEdicao.qtd_lutas}
							required
							min="0"
							class="w-full px-3 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600"
						/>
					</div>
					<div>
						<label for="modalQtdVitorias" class="block text-xs font-mono uppercase text-zinc-400 mb-1">
							Vitórias *
						</label>
						<input
							type="number"
							id="modalQtdVitorias"
							name="qtdVitorias"
							bind:value={resultadoEmEdicao.qtd_vitorias}
							required
							min="0"
							class="w-full px-3 py-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600"
						/>
					</div>
				</div>

				{#if resultadoEmEdicao.qtd_vitorias > resultadoEmEdicao.qtd_lutas}
					<p class="text-xs text-red-400">
						O número de vitórias não pode ser maior do que o total de lutas disputadas.
					</p>
				{/if}

				<div class="pt-3 border-t border-zinc-900 flex items-center justify-end gap-2">
					<button
						type="button"
						onclick={() => (modalEditarResultadoAberto = false)}
						class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={carregandoEdicaoResultado || resultadoEmEdicao.qtd_vitorias > resultadoEmEdicao.qtd_lutas}
						class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
					>
						{#if carregandoEdicaoResultado}
							<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
							<span>Salvando...</span>
						{:else}
							<Save class="w-3.5 h-3.5" />
							<span>Salvar Alterações</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL DE EXCLUSÃO DE RESULTADO DO ATLETA -->
<!-- ========================================================================= -->
{#if modalExcluirResultadoAberto && resultadoEmExclusao}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-red-950/80 shadow-2xl space-y-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 shrink-0">
					<Trash2 class="w-5 h-5" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-white font-display">Apagar Lançamento de Resultado</h3>
					<p class="text-xs text-zinc-400">Correção de lançamento equivocado</p>
				</div>
			</div>

			<div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-300 space-y-1">
				<p>
					Deseja realmente apagar o resultado de <strong class="text-white">{resultadoEmExclusao.nome_aluno}</strong> ({resultadoEmExclusao.classificacao_aluno})?
				</p>
				<p class="text-zinc-500 text-[11px] pt-1">
					O pódio e as vitórias serão removidos do quadro de medalhas. O atleta continuará inscrito no campeonato normalmente.
				</p>
			</div>

			<form
				action="?/excluirResultado"
				method="POST"
				use:enhance={() => {
					carregandoExclusaoResultado = true;
					return async ({ update }) => {
						await update();
						carregandoExclusaoResultado = false;
						modalExcluirResultadoAberto = false;
					};
				}}
				class="flex items-center justify-end gap-2 pt-2"
			>
				<input type="hidden" name="idClassificacao" value={resultadoEmExclusao.id_classificacao} />

				<button
					type="button"
					onclick={() => (modalExcluirResultadoAberto = false)}
					class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
				>
					Cancelar
				</button>

				<button
					type="submit"
					disabled={carregandoExclusaoResultado}
					class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
				>
					{#if carregandoExclusaoResultado}
						<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
						<span>Removendo...</span>
					{:else}
						<Trash2 class="w-3.5 h-3.5" />
						<span>Confirmar Exclusão</span>
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}
