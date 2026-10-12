<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		User,
		Calendar,
		ShieldAlert,
		HeartHandshake,
		ArrowLeft,
		AlertCircle,
		Award,
		Scale,
		Hash,
		Phone,
		Mail,
		CheckCircle2
	} from '@lucide/svelte';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let carregando = $state(false);
	let dataNascimento = $state('');
	let graduacaoSelecionada = $state('Branca');

	$effect(() => {
		if (form?.valores?.dataNascimento) {
			dataNascimento = form.valores.dataNascimento as string;
		}
		if (form?.valores?.graduacaoAtual) {
			graduacaoSelecionada = form.valores.graduacaoAtual as string;
		}
	});

	const faixasDisponiveis = [
		'Branca',
		'Cinza',
		'Azul',
		'Amarela',
		'Laranja',
		'Verde',
		'Roxa',
		'Marrom',
		'Preta'
	];

	// Cálculo reativo de idade na interface para guiar o preenchimento
	const idadeCalculada = $derived.by(() => {
		if (!dataNascimento || dataNascimento.length < 10) return null;
		const hoje = new Date();
		const nasc = new Date(dataNascimento);
		if (isNaN(nasc.getTime())) return null;

		let anos = hoje.getFullYear() - nasc.getFullYear();
		const mes = hoje.getMonth() - nasc.getMonth();
		if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
			anos--;
		}
		return anos >= 0 ? anos : null;
	});

	const ehMenor = $derived(idadeCalculada !== null && idadeCalculada < 18);
</script>

<svelte:head>
	<title>Matricular Judoca - Judô Hinodê</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<!-- ========================================================================= -->
	<!-- HEADER E NAVEGAÇÃO -->
	<!-- ========================================================================= -->
	<div>
		<a
			href="/dashboard/alunos"
			class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-4 group"
		>
			<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span>Voltar para Lista de Judocas</span>
		</a>

		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-mono uppercase tracking-wider text-red-500 font-bold">
				Formulário de Matrícula
			</span>
			<span class="text-xs text-zinc-600">•</span>
			<span class="text-xs text-zinc-400 font-mono">Fase 4</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
			Novo Judoca
		</h1>
		<p class="text-xs sm:text-sm text-zinc-400 mt-1">
			Preencha os dados do atleta. Para menores de 18 anos, os dados do responsável legal serão
			exigidos obrigatoriamente.
		</p>
	</div>

	<!-- Alerta de Erro do Servidor -->
	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Não foi possível salvar a matrícula:</span>
				<p>{form.erro}</p>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- FORMULÁRIO PRINCIPAL -->
	<!-- ========================================================================= -->
	<form
		method="POST"
		use:enhance={() => {
			carregando = true;
			return async ({ update }) => {
				await update();
				carregando = false;
			};
		}}
		class="space-y-8"
	>
		<!-- 1. DADOS PESSOAIS DO ATLETA -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<User class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Identificação do Judoca</h2>
					<p class="text-[11px] text-zinc-500">Dados civis e de contato do atleta</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label for="nome" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Nome Completo *
					</label>
					<input
						type="text"
						id="nome"
						name="nome"
						required
						value={(form?.valores?.nome as string) || ''}
						placeholder="Ex: Pedro Henrique da Silva"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="cpf" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						CPF (somente números) *
					</label>
					<input
						type="text"
						id="cpf"
						name="cpf"
						required
						maxlength="14"
						value={(form?.valores?.cpf as string) || ''}
						placeholder="000.000.000-00"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="dataNascimento" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Data de Nascimento *
					</label>
					<input
						type="date"
						id="dataNascimento"
						name="dataNascimento"
						required
						bind:value={dataNascimento}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
					{#if idadeCalculada !== null}
						<div class="mt-2 text-xs flex items-center gap-2">
							<span class="text-zinc-400 font-mono">Idade calculada:</span>
							<strong class="text-white font-mono">{idadeCalculada} anos</strong>
							{#if ehMenor}
								<span
									class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 border border-amber-800/80 text-amber-300"
								>
									Menor de Idade (Responsável Obrigatório)
								</span>
							{:else}
								<span
									class="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800"
								>
									Maior de Idade
								</span>
							{/if}
						</div>
					{/if}
				</div>

				<div>
					<label for="email" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						E-mail de Acesso *
					</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						value={(form?.valores?.email as string) || ''}
						placeholder="atleta@exemplo.com"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="telefone" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Telefone / WhatsApp
					</label>
					<input
						type="text"
						id="telefone"
						name="telefone"
						value={(form?.valores?.telefone as string) || ''}
						placeholder="(11) 99999-9999"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>
		</div>

		<!-- 2. DADOS TÉCNICOS DE JUDÔ & TATAME -->
		<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
			<div class="flex items-center gap-3 pb-4 border-b border-zinc-900">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Award class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">Dados Técnicos do Judô</h2>
					<p class="text-[11px] text-zinc-500">Graduação, professor responsável e categoria</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="graduacaoAtual" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Graduação Atual (Faixa) *
					</label>
					<div class="flex items-center gap-3">
						<select
							id="graduacaoAtual"
							name="graduacaoAtual"
							bind:value={graduacaoSelecionada}
							required
							class="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
						>
							{#each faixasDisponiveis as faixa}
								<option value={faixa}>{faixa}</option>
							{/each}
						</select>
						<BadgeFaixa faixa={graduacaoSelecionada} size="md" />
					</div>
				</div>

				<div>
					<label
						for="idProfessorResponsavel"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Professor Técnico Responsável *
					</label>
					<select
						id="idProfessorResponsavel"
						name="idProfessorResponsavel"
						required
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						<option value="">Selecione o Sensei...</option>
						{#each data.professores as prof}
							<option
								value={prof.id_usuario}
								selected={Number(form?.valores?.idProfessorResponsavel) === prof.id_usuario}
							>
								{prof.nome} ({prof.grau_faixa || 'Sensei'})
							</option>
						{/each}
					</select>
					<span class="text-[10px] text-zinc-500 mt-1 block">
						Cada judoca responde a apenas 1 professor responsável no dojo.
					</span>
				</div>

				<div>
					<label for="matricula" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Matrícula no Dojo
					</label>
					<input
						type="text"
						id="matricula"
						name="matricula"
						value={(form?.valores?.matricula as string) || ''}
						placeholder="Ex: HIN-2026-0042"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="peso" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Peso Atual (kg)
					</label>
					<input
						type="number"
						step="0.1"
						id="peso"
						name="peso"
						value={(form?.valores?.peso as string) || ''}
						placeholder="Ex: 73.5"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="categoria" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Categoria de Peso / Idade
					</label>
					<input
						type="text"
						id="categoria"
						name="categoria"
						value={(form?.valores?.categoria as string) || ''}
						placeholder="Ex: Meio-Médio (-81kg) / Sub-21"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="nFederacao" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Nº de Registro Federativo (FPJ/CBJ)
					</label>
					<input
						type="text"
						id="nFederacao"
						name="nFederacao"
						value={(form?.valores?.nFederacao as string) || ''}
						placeholder="Ex: FPJ-94821"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>
			</div>
		</div>

		<!-- 3. DADOS DO RESPONSÁVEL LEGAL (DINÂMICO & OBRIGATÓRIO PARA MENORES) -->
		<div
			class="p-6 sm:p-8 rounded-2xl transition-all duration-300 {ehMenor
				? 'bg-zinc-950 border-2 border-amber-800/80 shadow-[0_0_25px_rgba(217,119,6,0.1)]'
				: 'bg-zinc-950 border border-zinc-900'}"
		>
			<div class="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
				<div class="flex items-center gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
					>
						<HeartHandshake class="w-4 h-4 {ehMenor ? 'text-amber-400' : 'text-zinc-400'}" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-white font-display">
							Responsável Legal {ehMenor ? '(Obrigatório)' : '(Opcional)'}
						</h2>
						<p class="text-[11px] text-zinc-500">
							{#if ehMenor}
								Atleta menor de 18 anos exige representação civil auditada pela LGPD.
							{:else}
								Vínculo opcional para atletas maiores de idade.
							{/if}
						</p>
					</div>
				</div>

				{#if ehMenor}
					<span
						class="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold bg-amber-950/60 border border-amber-700/80 text-amber-300"
					>
						Exigência Legal
					</span>
				{/if}
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label for="responsavelNome" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						Nome Completo do Responsável {ehMenor ? '*' : ''}
					</label>
					<input
						type="text"
						id="responsavelNome"
						name="responsavelNome"
						required={ehMenor}
						value={(form?.valores?.responsavelNome as string) || ''}
						placeholder="Ex: Maria das Dores da Silva"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label for="responsavelCpf" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						CPF do Responsável {ehMenor ? '*' : ''}
					</label>
					<input
						type="text"
						id="responsavelCpf"
						name="responsavelCpf"
						required={ehMenor}
						maxlength="14"
						value={(form?.valores?.responsavelCpf as string) || ''}
						placeholder="000.000.000-00"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label
						for="responsavelTelefone"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Telefone do Responsável {ehMenor ? '*' : ''}
					</label>
					<input
						type="text"
						id="responsavelTelefone"
						name="responsavelTelefone"
						required={ehMenor}
						value={(form?.valores?.responsavelTelefone as string) || ''}
						placeholder="(11) 98888-8888"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div>
					<label
						for="responsavelParentesco"
						class="block text-xs font-mono uppercase text-zinc-400 mb-1.5"
					>
						Grau de Parentesco {ehMenor ? '*' : ''}
					</label>
					<select
						id="responsavelParentesco"
						name="responsavelParentesco"
						required={ehMenor}
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					>
						<option value="Mãe">Mãe</option>
						<option value="Pai">Pai</option>
						<option value="Avô / Avó">Avô / Avó</option>
						<option value="Tio / Tia">Tio / Tia</option>
						<option value="Tutor Legal">Tutor Legal</option>
						<option value="Outro">Outro</option>
					</select>
				</div>

				<div>
					<label for="responsavelEmail" class="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
						E-mail do Responsável (Opcional)
					</label>
					<input
						type="email"
						id="responsavelEmail"
						name="responsavelEmail"
						value={(form?.valores?.responsavelEmail as string) || ''}
						placeholder="responsavel@exemplo.com"
						class="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
					/>
				</div>

				<div class="sm:col-span-2 pt-2">
					<label class="flex items-center gap-2.5 cursor-pointer">
						<input
							type="checkbox"
							name="responsavelFinanceiro"
							checked={form?.valores?.responsavelFinanceiro === true}
							class="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-red-600 focus:ring-red-600"
						/>
						<span class="text-xs text-zinc-300">
							Responsável também pelo financeiro / mensalidades do judoca
						</span>
					</label>
				</div>
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- AÇÕES DE SUBMISSÃO -->
		<!-- ========================================================================= -->
		<div class="flex items-center justify-end gap-4 pt-4 border-t border-zinc-900">
			<a
				href="/dashboard/alunos"
				class="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition-colors"
			>
				Cancelar
			</a>

			<button
				type="submit"
				disabled={carregando}
				class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if carregando}
					<span
						class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
					></span>
					<span>Gravando Matrícula...</span>
				{:else}
					<CheckCircle2 class="w-4 h-4" />
					<span>Confirmar Matrícula</span>
				{/if}
			</button>
		</div>
	</form>
</div>
