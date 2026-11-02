<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import BadgePerfil from '#lib/components/ui/BadgePerfil.svelte';
	import CalendarioTatameMensal from '#lib/components/ui/CalendarioTatameMensal.svelte';
	import {
		HeartHandshake,
		User,
		Lock,
		Award,
		Calendar,
		Scale,
		Phone,
		Mail,
		MapPin,
		Clock,
		ShieldCheck,
		AlertCircle,
		CheckCircle2,
		XCircle,
		Sparkles,
		Flame,
		Building2,
		ChevronRight,
		Users,
		Save,
		TrendingUp,
		GraduationCap,
		BellPlus,
		Send
	} from '@lucide/svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Índice do judoca selecionado (caso o responsável tenha mais de 1 tutelado)
	let indiceAtivo = $state(0);

	const alunoAtivo = $derived(
		data.alunos && data.alunos.length > 0
			? data.alunos[Math.min(indiceAtivo, data.alunos.length - 1)]
			: null
	);

	// Estados dos formulários de edição do aluno ativo
	let pesoInput = $state('');
	let telefoneInput = $state('');
	let emailInput = $state('');

	let salvandoPeso = $state(false);
	let salvandoContato = $state(false);

	// Estados para o Aviso Prévio de Ausência pelo Responsável (suporta múltiplos treinos no dia)
	const hojeIso = new Date().toISOString().slice(0, 10);
	let mostrarFormAusencia = $state(false);
	let dataAusencia = $state(hojeIso);
	let motivoAusencia = $state('');
	let treinosAusenciaSelecionados = $state<number[]>([]);
	let salvandoAusencia = $state(false);

	const motivosSugeridos = [
		'Consulta médica / odontológica',
		'Prova ou compromisso escolar',
		'Indisposição / repouso em casa',
		'Viagem ou compromisso familiar'
	];

	function alternarTreinoAusencia(idTreino: number) {
		if (treinosAusenciaSelecionados.includes(idTreino)) {
			treinosAusenciaSelecionados = treinosAusenciaSelecionados.filter((id) => id !== idTreino);
		} else {
			treinosAusenciaSelecionados = [...treinosAusenciaSelecionados, idTreino];
		}
	}

	function selecionarTodosTreinosDoAluno() {
		if (!alunoAtivo) return;
		treinosAusenciaSelecionados = alunoAtivo.treinosInscritos.map((t) => t.id_treino);
	}

	// Sessões de hoje ou do último dia com treino registrado para o card em tempo real
	const resumoUltimoDiaTreino = $derived.by(() => {
		if (!alunoAtivo || !alunoAtivo.presencas || alunoAtivo.presencas.length === 0) {
			return null;
		}
		const deHoje = alunoAtivo.presencas.filter((p) => p.data_treino === hojeIso);
		if (deHoje.length > 0) {
			return {
				ehHoje: true,
				data: hojeIso,
				sessoes: deHoje
			};
		}
		const ultimaData = alunoAtivo.presencas[0].data_treino;
		return {
			ehHoje: false,
			data: ultimaData,
			sessoes: alunoAtivo.presencas.filter((p) => p.data_treino === ultimaData)
		};
	});

	// Sincroniza formulários quando o aluno selecionado muda
	$effect(() => {
		if (alunoAtivo) {
			pesoInput = alunoAtivo.peso !== null && alunoAtivo.peso !== undefined ? String(alunoAtivo.peso) : '';
			telefoneInput = alunoAtivo.telefone || '';
			emailInput = alunoAtivo.email || '';
			treinosAusenciaSelecionados = alunoAtivo.treinosInscritos.map((t) => t.id_treino);
		}
	});

	$effect(() => {
		if (form) {
			salvandoPeso = false;
			salvandoContato = false;
			salvandoAusencia = false;
			if ((form as any).sucessoAusencia) {
				motivoAusencia = '';
				mostrarFormAusencia = false;
			}
		}
	});
</script>

<svelte:head>
	<title>Perfil do Responsável - Judô Hinodê</title>
</svelte:head>

<div class="space-y-8 animate-in fade-in duration-300">
	<!-- ========================================================================= -->
	<!-- 1. HEADER DO PERFIL DO RESPONSÁVEL                                        -->
	<!-- ========================================================================= -->
	<header
		class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/30 border border-zinc-800 p-6 sm:p-8 shadow-[0_0_35px_rgba(16,185,129,0.08)]"
	>
		<!-- Glow esmeralda suave de fundo -->
		<div
			class="absolute -top-24 -right-24 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div class="flex items-start sm:items-center gap-5">
				<div
					class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border-2 border-emerald-600/60 flex items-center justify-center text-2xl sm:text-3xl font-display font-extrabold text-white shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
				>
					<HeartHandshake class="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
				</div>

				<div class="space-y-1.5">
					<div class="flex items-center gap-2 flex-wrap">
						<span
							class="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"
						>
							<HeartHandshake class="w-3 h-3 text-emerald-400" />
							<span>Área de Tutela Legal</span>
						</span>
						<span class="text-xs text-zinc-600">•</span>
						<span class="text-xs text-zinc-400 font-mono">
							{data.nomeAcademia || 'Judô Hinodê'}
						</span>
						<span class="text-xs text-zinc-600">•</span>
						<span class="text-xs text-zinc-400 font-mono">
							Responsável: {data.usuarioLogado?.nome}
						</span>
					</div>

					<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
						Perfil do Responsável
					</h1>
					<p class="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
						Visualize a ficha cadastral completa, graduações, pesagens e horários de treino de todos os judocas sob sua tutela legal, sem sobrecarregar sua conta pessoal.
					</p>
				</div>
			</div>

			<!-- Estatística rápida de tutelados -->
			<div
				class="shrink-0 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col items-center justify-center min-w-[170px] text-center shadow-lg"
			>
				<span class="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
					Judocas Sob Tutela
				</span>
				<div class="text-2xl sm:text-3xl font-black font-display text-emerald-400 my-0.5">
					{data.totalAlunos}
				</div>
				<span class="text-[10px] font-mono text-zinc-500">
					{data.totalAlunos === 1 ? '1 aluno vinculado' : `${data.totalAlunos} alunos vinculados`}
				</span>
			</div>
		</div>
	</header>

	<!-- ========================================================================= -->
	<!-- ALERTAS DE FEEDBACK DE AÇÃO (PESO OU CONTATOS)                            -->
	<!-- ========================================================================= -->
	{#if form?.sucessoPeso}
		<div
			class="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-600/70 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoPeso}</span>
		</div>
	{/if}

	{#if form?.erroPeso}
		<div
			class="p-4 rounded-2xl bg-red-950/40 border-2 border-red-600/70 text-red-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.erroPeso}</span>
		</div>
	{/if}

	{#if form?.sucessoContato}
		<div
			class="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-600/70 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
			<span>{form.sucessoContato}</span>
		</div>
	{/if}

	{#if form?.erroContato}
		<div
			class="p-4 rounded-2xl bg-red-950/40 border-2 border-red-600/70 text-red-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0" />
			<span>{form.erroContato}</span>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- 2. SELETOR DE ALUNOS (CASO HAJA MAIS DE UM DEPENDENTE)                    -->
	<!-- ========================================================================= -->
	{#if data.alunos && data.alunos.length > 1}
		<div class="p-2 rounded-2xl bg-zinc-950 border border-zinc-900 shadow-sm">
			<div class="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
				Selecione o Judoca para Visualizar a Ficha:
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
				{#each data.alunos as aluno, idx}
					{@const ativo = idx === indiceAtivo}
					<button
						type="button"
						onclick={() => (indiceAtivo = idx)}
						class="flex items-center justify-between p-3 rounded-xl border text-left transition-all {ativo
							? 'bg-emerald-950/40 border-emerald-600/70 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
							: 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700'}"
					>
						<div class="flex items-center gap-3 min-w-0">
							<div
								class="w-10 h-10 rounded-xl bg-zinc-900 border flex items-center justify-center font-bold text-sm font-mono shrink-0 {ativo
									? 'border-emerald-500 text-emerald-300'
									: 'border-zinc-800 text-zinc-400'}"
							>
								{aluno.nome.charAt(0).toUpperCase()}
							</div>
							<div class="min-w-0">
								<span class="text-xs font-bold text-white block truncate leading-tight">
									{aluno.nome}
								</span>
								<div class="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
									<span>{aluno.idade} anos</span>
									<span>•</span>
									<span class="text-zinc-400">{aluno.meu_grau_parentesco}</span>
								</div>
							</div>
						</div>

						<div class="shrink-0 pl-2">
							<BadgeFaixa faixa={aluno.graduacao_atual} size="sm" />
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if alunoAtivo}
		<!-- ========================================================================= -->
		<!-- 3. CARTÃO DE IDENTIFICAÇÃO DO JUDOCA ATIVO                                -->
		<!-- ========================================================================= -->
		<section
			class="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-md relative overflow-hidden"
		>
			<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-900">
				<div class="flex items-start sm:items-center gap-4">
					<div
						class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border-2 border-emerald-600/70 flex items-center justify-center text-xl sm:text-2xl font-bold font-mono text-white shrink-0 shadow-lg"
					>
						{alunoAtivo.nome.charAt(0).toUpperCase()}
					</div>

					<div class="space-y-1">
						<div class="flex items-center gap-2 flex-wrap">
							<span
								class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider {alunoAtivo.menor_idade
									? 'bg-amber-950/80 border border-amber-800/80 text-amber-300'
									: 'bg-zinc-900 border border-zinc-800 text-zinc-400'}"
							>
								{alunoAtivo.menor_idade ? '👶 Menor de Idade (Sob Tutela)' : 'Adulto'}
							</span>
							<span class="text-xs text-zinc-600">•</span>
							<span class="text-xs text-zinc-400 font-mono">
								Matrícula: {alunoAtivo.matricula || 'Pendente'}
							</span>
							<span class="text-xs text-zinc-600">•</span>
							<span class="text-xs text-zinc-400 font-mono">
								ID Aluno #{alunoAtivo.id_usuario}
							</span>
						</div>

						<h2 class="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
							{alunoAtivo.nome}
						</h2>

						<div class="flex items-center gap-2 flex-wrap text-xs text-zinc-400 pt-0.5">
							<span class="inline-flex items-center gap-1 text-emerald-400 font-medium">
								<HeartHandshake class="w-3.5 h-3.5" />
								<span>Vínculo: {alunoAtivo.meu_grau_parentesco}</span>
							</span>
							{#if alunoAtivo.sou_financeiro}
								<span class="text-zinc-600">•</span>
								<span class="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/80 text-[10px] font-mono font-bold text-emerald-300">
									💵 Titular Financeiro
								</span>
							{/if}
							<span class="text-zinc-600">•</span>
							<span>Sensei: {alunoAtivo.nome_professor_responsavel}</span>
						</div>
					</div>
				</div>

				<!-- Faixa Atual e Próxima Faixa -->
				<div class="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
					<div class="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center min-w-[130px]">
						<span class="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
							Graduação Atual
						</span>
						<BadgeFaixa faixa={alunoAtivo.graduacao_atual} size="md" />
					</div>

					<div class="hidden sm:flex text-zinc-600">
						<ChevronRight class="w-5 h-5" />
					</div>

					<div class="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center min-w-[130px]">
						<span class="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
							Próximo Objetivo
						</span>
						<BadgeFaixa faixa={alunoAtivo.proxima_faixa} size="md" />
					</div>
				</div>
			</div>

			<!-- Grade de Cards Detalhados -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
				<!-- ================================================================= -->
				<!-- CARD 1: IDENTIFICAÇÃO CIVIL (LGPD & SOMENTE LEITURA)               -->
				<!-- ================================================================= -->
				<div class="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
					<div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
								<Lock class="w-3.5 h-3.5" />
							</div>
							<div>
								<h3 class="text-xs font-bold text-white font-display">Identificação Civil do Aluno</h3>
								<p class="text-[10px] text-zinc-500">Documentação oficial registrada no dojo</p>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
							Somente Leitura
						</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
						<div class="sm:col-span-2 space-y-1">
							<span class="text-zinc-500 block text-[11px]">Nome Civil Completo</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-200 font-medium select-all">
								{alunoAtivo.nome}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">CPF (LGPD Mascarado)</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono">
								{alunoAtivo.cpf_mascarado}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Gênero</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
								{alunoAtivo.genero === 'M' ? 'Masculino' : 'Feminino'}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Data de Nascimento</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono">
								{alunoAtivo.data_nascimento_br}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Idade Atual</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono">
								{alunoAtivo.idade} anos
							</div>
						</div>
					</div>

					{#if alunoAtivo.endereco}
						<div class="pt-3 border-t border-zinc-800/80 space-y-1.5">
							<span class="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
								<MapPin class="w-3.5 h-3.5 text-sky-400" />
								<span>Endereço Residencial Cadastrado:</span>
							</span>
							<p class="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60">
								{alunoAtivo.endereco.logradouro}{alunoAtivo.endereco.numero ? `, ${alunoAtivo.endereco.numero}` : ''}
								{alunoAtivo.endereco.complemento ? ` (${alunoAtivo.endereco.complemento})` : ''} - 
								{alunoAtivo.endereco.bairro || ''}, {alunoAtivo.endereco.cidade}/{alunoAtivo.endereco.uf}
								<span class="text-zinc-500 block text-[10px] font-mono mt-0.5">CEP: {alunoAtivo.endereco.cep}</span>
							</p>
						</div>
					{/if}

					<p class="text-[10px] text-zinc-500 italic pt-1">
						* A retificação de certidões, nome civil ou data de nascimento exige solicitação presencial junto à secretaria do dojo.
					</p>
				</div>

				<!-- ================================================================= -->
				<!-- CARD 2: FICHA TÉCNICA DO TATAME (JUDÔ OFICIAL CBJ/FPJ)            -->
				<!-- ================================================================= -->
				<div class="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
					<div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400">
								<Award class="w-3.5 h-3.5" />
							</div>
							<div>
								<h3 class="text-xs font-bold text-white font-display">Ficha Técnica & Esportiva</h3>
								<p class="text-[10px] text-zinc-500">Histórico no dojo e homologação federativa</p>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-red-950/60 border border-red-800/80 text-red-400">
							Oficial CBJ / FPJ
						</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Sensei Responsável</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-200 font-medium truncate select-all">
								{alunoAtivo.nome_professor_responsavel}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Matrícula no Dojo</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono select-all">
								{alunoAtivo.matricula || 'Pendente'}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Categoria Oficial</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-200 font-medium">
								{alunoAtivo.categoria || 'Não classificada'}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Divisão Competitiva</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
								{alunoAtivo.divisao || 'Tradicional'}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Registro Federativo (FPJ/CBJ)</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono">
								{alunoAtivo.n_federacao || 'Pendente na Secretaria'}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Status na Federação</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
								{alunoAtivo.status_federacao || 'Ativo'}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">Início no Tatame</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono">
								{alunoAtivo.data_inicio_br || 'Não informada'}
							</div>
						</div>

						<div class="space-y-1">
							<span class="text-zinc-500 block text-[11px]">1ª Graduação Homologada</span>
							<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono">
								{alunoAtivo.data_primeira_graduacao_br || 'Não informada'}
							</div>
						</div>
					</div>

					<p class="text-[10px] text-zinc-500 italic pt-1">
						* Promoções de faixa e alterações de graduação exigem homologação técnica do Sensei após exame oficial.
					</p>
				</div>
			</div>

			<!-- ================================================================= -->
			<!-- CARD 3 & 4: PESAGEM EDITÁVEL & CONTATOS / TUTELA                  -->
			<!-- ================================================================= -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
				<!-- PESAGEM OFICIAL (EDITÁVEL PELO RESPONSÁVEL) -->
				<div class="p-5 rounded-2xl bg-amber-950/20 border border-amber-600/40 space-y-4">
					<div class="flex items-center justify-between pb-2 border-b border-amber-600/30">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-lg bg-amber-900/40 border border-amber-600/60 flex items-center justify-center text-amber-300">
								<Scale class="w-3.5 h-3.5" />
							</div>
							<div>
								<h3 class="text-xs font-bold text-amber-200 font-display">Pesagem Oficial do Judoca</h3>
								<p class="text-[10px] text-amber-300/70">Mantenha o peso do atleta atualizado</p>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-900/50 text-amber-300">
							✏️ Editável por Você
						</span>
					</div>

					<p class="text-xs text-amber-100/90 leading-relaxed">
						Como responsável legal, você pode atualizar o peso medido em balança oficial. O motor do dojo recalculará a categoria e divisão oficial automaticamente para os próximos torneios.
					</p>

					<form
						action="?/salvarPeso"
						method="POST"
						onsubmit={() => (salvandoPeso = true)}
						class="space-y-3"
					>
						<input type="hidden" name="idAluno" value={alunoAtivo.id_usuario} />

						<div class="flex items-center gap-3">
							<div class="relative flex-1">
								<input
									id="peso-input"
									name="peso"
									type="number"
									step="0.01"
									min="20"
									max="250"
									required
									bind:value={pesoInput}
									placeholder="Ex.: 42.50"
									class="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-zinc-900 border border-amber-600/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-xs font-mono font-bold transition-all"
								/>
								<span class="absolute right-3.5 top-2.5 text-xs text-zinc-400 font-mono font-bold">
									kg
								</span>
							</div>

							<button
								type="submit"
								disabled={salvandoPeso}
								class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-all shrink-0 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
							>
								<Save class="w-3.5 h-3.5" />
								<span>{salvandoPeso ? 'Salvando...' : 'Salvar Peso'}</span>
							</button>
						</div>

						<div class="flex items-center justify-between text-[11px] text-amber-300/80 font-mono pt-1">
							<span>Peso Atual Registrado:</span>
							<span class="font-bold text-white">
								{alunoAtivo.peso !== null ? `${alunoAtivo.peso} kg` : 'Pendente de pesagem'}
							</span>
						</div>
					</form>
				</div>

				<!-- CONTATOS DO ALUNO & RESPONSÁVEIS VINCULADOS -->
				<div class="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
					<div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-lg bg-sky-950/40 border border-sky-800/60 flex items-center justify-center text-sky-400">
								<Phone class="w-3.5 h-3.5" />
							</div>
							<div>
								<h3 class="text-xs font-bold text-white font-display">Canais de Contato & Responsáveis</h3>
								<p class="text-[10px] text-zinc-500">Comunicação e contatos de emergência</p>
							</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
							✏️ Editável
						</span>
					</div>

					<form
						action="?/salvarContato"
						method="POST"
						onsubmit={() => (salvandoContato = true)}
						class="space-y-3"
					>
						<input type="hidden" name="idAluno" value={alunoAtivo.id_usuario} />

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
							<div class="space-y-1">
								<label for="tel-aluno" class="text-zinc-400 text-[11px] font-medium block">
									Telefone / WhatsApp do Aluno
								</label>
								<div class="relative">
									<Phone class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
									<input
										id="tel-aluno"
										name="telefone"
										type="tel"
										bind:value={telefoneInput}
										placeholder="(11) 98765-4321"
										class="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 text-white text-xs"
									/>
								</div>
							</div>

							<div class="space-y-1">
								<label for="email-aluno" class="text-zinc-400 text-[11px] font-medium block">
									E-mail do Aluno (Opcional)
								</label>
								<div class="relative">
									<Mail class="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
									<input
										id="email-aluno"
										name="email"
										type="email"
										bind:value={emailInput}
										placeholder="aluno@email.com"
										class="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-sky-500 text-white text-xs"
									/>
								</div>
							</div>
						</div>

						<div class="flex justify-end pt-1">
							<button
								type="submit"
								disabled={salvandoContato}
								class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
							>
								<Save class="w-3 h-3" />
								<span>{salvandoContato ? 'Salvando...' : 'Salvar Contatos'}</span>
							</button>
						</div>
					</form>

					<!-- Lista de Responsáveis Legais Cadastrados para este Aluno -->
					<div class="pt-3 border-t border-zinc-800/80 space-y-2">
						<span class="text-[11px] font-semibold text-zinc-400 block">
							Responsáveis Legais Vinculados a este Aluno:
						</span>
						<div class="space-y-1.5">
							{#each alunoAtivo.responsaveis as resp}
								<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
									<div class="flex items-center gap-2">
										<HeartHandshake class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
										<span class="font-medium text-white">{resp.nome}</span>
										<span class="text-[10px] font-mono text-zinc-500">({resp.grau_parentesco})</span>
									</div>
									{#if resp.financeiro}
										<span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
											Titular Financeiro
										</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- ================================================================= -->
			<!-- TURMAS & HISTÓRICO DE GRADUAÇÕES                                  -->
			<!-- ================================================================= -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
				<!-- TURMAS INSCRITAS -->
				<div class="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
					<div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
								<Calendar class="w-3.5 h-3.5 text-red-500" />
							</div>
							<div>
								<h3 class="text-xs font-bold text-white font-display">Turmas & Grade Semanal</h3>
								<p class="text-[10px] text-zinc-500">Horários de treino alocados no tatame</p>
							</div>
						</div>
						<span class="text-[10px] font-mono text-zinc-500">
							{alunoAtivo.treinosInscritos.length} turma(s)
						</span>
					</div>

					{#if alunoAtivo.treinosInscritos.length === 0}
						<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center space-y-2">
							<Clock class="w-6 h-6 text-zinc-600 mx-auto" />
							<p class="text-xs text-zinc-400">
								Este aluno ainda não foi alocado em uma turma semanal pelo Sensei.
							</p>
							<a
								href="/dashboard/turmas"
								class="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
							>
								<span>Ver Grade de Turmas do Dojo</span>
								<span>→</span>
							</a>
						</div>
					{:else}
						<div class="space-y-2">
							{#each alunoAtivo.treinosInscritos as treino}
								<div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3">
									<div class="space-y-0.5 min-w-0">
										<span class="text-xs font-bold text-white block truncate">
											{treino.descricao}
										</span>
										<div class="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
											<span class="text-emerald-400 font-semibold">{treino.dia_semana}</span>
											<span>•</span>
											<span>{treino.horario_inicio} às {treino.horario_fim}</span>
										</div>
									</div>
									<div class="text-[10px] text-zinc-500 font-mono text-right shrink-0">
										<span>Sensei: {treino.professores}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- HISTÓRICO DE GRADUAÇÕES HOMOLOGADAS -->
				<div class="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
					<div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
								<GraduationCap class="w-3.5 h-3.5 text-amber-500" />
							</div>
							<div>
								<h3 class="text-xs font-bold text-white font-display">Histórico de Graduações</h3>
								<p class="text-[10px] text-zinc-500">Exames e promoções de faixa homologadas</p>
							</div>
						</div>
						<span class="text-[10px] font-mono text-zinc-500">
							{alunoAtivo.graduacoes.length} exame(s)
						</span>
					</div>

					{#if alunoAtivo.graduacoes.length === 0}
						<div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center space-y-1.5">
							<p class="text-xs text-zinc-400">
								Nenhum exame adicional homologado no histórico. Faixa de ingresso atual:
							</p>
							<div class="pt-1">
								<BadgeFaixa faixa={alunoAtivo.graduacao_atual} size="md" />
							</div>
						</div>
					{:else}
						<div class="space-y-2">
							{#each alunoAtivo.graduacoes as grad}
								<div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3">
									<div class="flex items-center gap-3">
										<BadgeFaixa faixa={grad.faixa} size="sm" />
										<div>
											<span class="text-xs font-bold text-white block">
												{grad.nome_evento}
											</span>
											<span class="text-[10px] text-zinc-400 font-mono">
												Homologado por: {grad.nome_professor_homologador}
											</span>
										</div>
									</div>
									<div class="text-[11px] font-mono text-zinc-400 shrink-0">
										{grad.data_graduacao}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- ================================================================= -->
			<!-- PRESENÇA NO TATAME, AVISO PRÉVIO DE AUSÊNCIA & CALENDÁRIO MENSAL  -->
			<!-- ================================================================= -->
			<div class="mt-6 space-y-6">
				<div class="p-5 sm:p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-5">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
								<ShieldCheck class="w-5 h-5" />
							</div>
							<div>
								<h3 class="text-sm sm:text-base font-extrabold text-white font-display">
									Acompanhamento Familiar de Presença — {alunoAtivo.nome}
								</h3>
								<p class="text-xs text-zinc-400">
									Visualize todos os treinos realizados no dia, observações do Sensei e avise ausências antecipadamente
								</p>
							</div>
						</div>

						{#if alunoAtivo.treinosInscritos.length > 0}
							<button
								type="button"
								onclick={() => (mostrarFormAusencia = !mostrarFormAusencia)}
								class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer {mostrarFormAusencia
									? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
									: 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-950/50'}"
							>
								<BellPlus class="w-4 h-4" />
								<span>{mostrarFormAusencia ? 'Fechar Aviso de Ausência' : 'Avisar Ausência / Justificar Falta'}</span>
							</button>
						{/if}
					</div>

					<!-- Feedback de Aviso Prévio -->
					{#if (form as any)?.sucessoAusencia && (form as any)?.idAlunoAtualizado === alunoAtivo.id_usuario}
						<div class="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/80 flex items-center gap-2.5 text-xs text-emerald-300">
							<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
							<span>{(form as any).sucessoAusencia}</span>
						</div>
					{/if}

					{#if (form as any)?.erroAusencia && (form as any)?.idAlunoErro === alunoAtivo.id_usuario}
						<div class="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 flex items-center gap-2.5 text-xs text-red-300">
							<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
							<span>{(form as any).erroAusencia}</span>
						</div>
					{/if}

					<!-- Formulário de Aviso Prévio de Ausência pelo Responsável (Suporta 1 ou mais treinos no dia) -->
					{#if mostrarFormAusencia}
						<form
							method="POST"
							action="?/avisarAusencia"
							onsubmit={() => (salvandoAusencia = true)}
							class="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-sky-500/30 space-y-4 animate-in fade-in duration-200"
						>
							<input type="hidden" name="idAluno" value={alunoAtivo.id_usuario} />

							<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
								<div>
									<h4 class="text-xs sm:text-sm font-bold text-sky-400 flex items-center gap-2">
										<BellPlus class="w-4 h-4" />
										<span>Registrar Aviso Prévio de Ausência para {alunoAtivo.nome}</span>
									</h4>
									<p class="text-[11px] text-zinc-400 mt-0.5">
										O Sensei verá automaticamente a justificativa na chamada da(s) turma(s) selecionada(s).
									</p>
								</div>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label for="data-ausencia-{alunoAtivo.id_usuario}" class="block text-[11px] font-semibold text-zinc-300 mb-1.5">
										Data da Ausência
									</label>
									<input
										id="data-ausencia-{alunoAtivo.id_usuario}"
										type="date"
										name="dataTreino"
										bind:value={dataAusencia}
										required
										class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-sky-500"
									/>
								</div>

								<div class="md:col-span-2">
									<div class="flex items-center justify-between mb-1.5">
										<span class="block text-[11px] font-semibold text-zinc-300">
											Treino(s) do Dia (você pode marcar 1 ou mais treinos)
										</span>
										<button
											type="button"
											onclick={selecionarTodosTreinosDoAluno}
											class="text-[10px] font-semibold text-sky-400 hover:text-sky-300"
										>
											Marcar todas as turmas
										</button>
									</div>
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
										{#each alunoAtivo.treinosInscritos as treino}
											{@const marcado = treinosAusenciaSelecionados.includes(treino.id_treino)}
											<label
												class="flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all {marcado
													? 'bg-sky-950/40 border-sky-500/60 text-white'
													: 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'}"
											>
												<input
													type="checkbox"
													name="idTreino"
													value={treino.id_treino}
													checked={marcado}
													onchange={() => alternarTreinoAusencia(treino.id_treino)}
													class="rounded border-zinc-700 text-sky-500 focus:ring-sky-500"
												/>
												<div class="min-w-0">
													<span class="font-bold block truncate">{treino.descricao}</span>
													<span class="text-[10px] text-zinc-400 font-mono">
														{treino.dia_semana} • {treino.horario_inicio} às {treino.horario_fim}
													</span>
												</div>
											</label>
										{/each}
									</div>
								</div>
							</div>

							<div class="space-y-2">
								<label for="motivo-ausencia-{alunoAtivo.id_usuario}" class="block text-[11px] font-semibold text-zinc-300">
									Motivo da Ausência / Justificativa para o Sensei
								</label>
								<div class="flex flex-wrap gap-1.5">
									{#each motivosSugeridos as sugestao}
										<button
											type="button"
											onclick={() => (motivoAusencia = sugestao)}
											class="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 transition"
										>
											+ {sugestao}
										</button>
									{/each}
								</div>
								<input
									id="motivo-ausencia-{alunoAtivo.id_usuario}"
									type="text"
									name="motivo"
									bind:value={motivoAusencia}
									required
									maxlength="200"
									placeholder="Ex: Consulta médica às 18h30 / Prova na escola..."
									class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
								/>
							</div>

							<div class="flex items-center justify-end gap-2 pt-2">
								<button
									type="button"
									onclick={() => (mostrarFormAusencia = false)}
									class="px-3.5 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={salvandoAusencia || treinosAusenciaSelecionados.length === 0}
									class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
								>
									<Send class="w-3.5 h-3.5" />
									<span>{salvandoAusencia ? 'Registrando...' : 'Confirmar Aviso de Ausência'}</span>
								</button>
							</div>
						</form>
					{/if}

					<!-- Cards de Resumo de Frequência e Último Dia de Treino -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<!-- 1. Status do Último Dia de Treino / Hoje (suporta múltiplos treinos no dia) -->
						<div class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-2.5">
							<div class="flex items-center justify-between">
								<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
									{resumoUltimoDiaTreino?.ehHoje ? 'Treino(s) de Hoje' : 'Último Dia Registrado'}
								</span>
								{#if resumoUltimoDiaTreino}
									<span class="text-[11px] font-mono text-amber-400">
										{resumoUltimoDiaTreino.data.split('-').reverse().join('/')}
									</span>
								{/if}
							</div>

							{#if !resumoUltimoDiaTreino}
								<p class="text-xs text-zinc-500 py-2">
									Nenhuma chamada registrada ainda para {alunoAtivo.nome}.
								</p>
							{:else}
								<div class="space-y-1.5">
									{#each resumoUltimoDiaTreino.sessoes as sessao}
										<div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs">
											<div class="min-w-0">
												<span class="font-bold text-zinc-200 block truncate">
													{sessao.horario_inicio} • {sessao.descricao_turma}
												</span>
												{#if sessao.observacao}
													<span class="text-[10px] text-zinc-400 block truncate" title={sessao.observacao}>
														{sessao.observacao}
													</span>
												{/if}
											</div>
											{#if sessao.status_presenca === 'Presente'}
												<span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 shrink-0">
													Presente
												</span>
											{:else if sessao.status_presenca === 'Falta'}
												<span class="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[10px] font-bold text-red-300 shrink-0">
													Falta
												</span>
											{:else}
												<span class="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-300 shrink-0">
													Justificada
												</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- 2. Termômetro de Assiduidade Mensal -->
						<div class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-2.5">
							<div class="flex items-center justify-between">
								<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
									Assiduidade no Mês Atual
								</span>
								<span class="text-sm font-extrabold font-mono text-emerald-400">
									{alunoAtivo.metricasPresenca.percentual_mes_atual}%
								</span>
							</div>
							<div class="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
								<div
									class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
									style="width: {Math.min(100, alunoAtivo.metricasPresenca.percentual_mes_atual)}%"
								></div>
							</div>
							<div class="flex items-center justify-between text-[11px] text-zinc-400">
								<span>
									<strong class="text-white">{alunoAtivo.metricasPresenca.presentes_mes_atual}</strong> de
									<strong class="text-white">{alunoAtivo.metricasPresenca.aulas_mes_atual}</strong> treinos no mês
								</span>
								<span>
									Total geral: <strong class="text-zinc-200">{alunoAtivo.metricasPresenca.total_presentes}</strong> aulas
								</span>
							</div>
						</div>

						<!-- 3. Constância & Meta da Próxima Faixa -->
						<div class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-2.5">
							<div class="flex items-center justify-between">
								<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
									Constância & Graduação
								</span>
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300">
									<Flame class="w-3.5 h-3.5 text-amber-400" />
									{alunoAtivo.metricasPresenca.streak_atual} seguida(s)
								</span>
							</div>

							{#if alunoAtivo.metricasPresenca.proximo_exame_meta && (alunoAtivo.metricasPresenca.proximo_exame_meta.qtd_minima_aulas > 0 || alunoAtivo.metricasPresenca.proximo_exame_meta.percentual_minimo > 0)}
								{@const meta = alunoAtivo.metricasPresenca.proximo_exame_meta}
								<p class="text-xs text-zinc-300">
									Exame: <strong class="text-white">{meta.nome_evento}</strong>
								</p>
								<div class="flex flex-wrap items-center gap-2 text-[11px]">
									{#if meta.qtd_minima_aulas > 0}
										<span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
											Aulas: <strong>{alunoAtivo.metricasPresenca.total_presentes}/{meta.qtd_minima_aulas}</strong>
										</span>
									{/if}
									{#if meta.percentual_minimo > 0}
										<span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
											Frequência: <strong>{alunoAtivo.metricasPresenca.percentual_presenca}%/{meta.percentual_minimo}%</strong>
										</span>
									{/if}
								</div>
							{:else}
								<p class="text-xs text-zinc-400">
									<strong class="text-white">{alunoAtivo.metricasPresenca.dias_distintos_treinados}</strong> dias distintos treinados no tatame • Taxa global de <strong class="text-emerald-400">{alunoAtivo.metricasPresenca.percentual_presenca}%</strong>.
								</p>
							{/if}
						</div>
					</div>

					<!-- Calendário Mensal Tradicional do Dependente -->
					<CalendarioTatameMensal
						sessoes={alunoAtivo.presencas}
						turmasMatriculadas={alunoAtivo.treinosInscritos}
						titulo="Calendário Mensal de Presenças — {alunoAtivo.nome}"
						subtitulo="Clique em qualquer dia do mês para ver todos os treinos realizados, horários e anotações do Sensei"
					/>
				</div>
			</div>
		</section>
	{/if}
</div>
