<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import BadgePerfil from '#lib/components/ui/BadgePerfil.svelte';
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
		Sparkles,
		Flame,
		Building2,
		ChevronRight,
		Users,
		Save,
		TrendingUp,
		GraduationCap
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

	// Sincroniza formulários quando o aluno selecionado muda
	$effect(() => {
		if (alunoAtivo) {
			pesoInput = alunoAtivo.peso !== null && alunoAtivo.peso !== undefined ? String(alunoAtivo.peso) : '';
			telefoneInput = alunoAtivo.telefone || '';
			emailInput = alunoAtivo.email || '';
		}
	});

	$effect(() => {
		if (form) {
			salvandoPeso = false;
			salvandoContato = false;
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
		</section>
	{/if}
</div>
