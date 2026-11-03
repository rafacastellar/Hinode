<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import {
		Building2,
		Plus,
		Ban,
		CheckCircle,
		Users,
		Activity,
		Calendar,
		X,
		Search,
		CheckCircle2,
		AlertCircle,
		ShieldCheck
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let modalNovaAcademiaAberto = $state(false);
	let modalSuspenderAberto = $state(false);
	let academiaSuspender = $state<{ id: number; nome: string; ativa: boolean } | null>(null);
	let motivoSuspensao = $state('');

	// Auto-CEP no cadastro da academia
	let cepValor = $state('');
	let logradouroValor = $state('');
	let bairroValor = $state('');
	let cidadeValor = $state('');
	let ufValor = $state('');
	let buscandoCep = $state(false);

	async function consultarCep() {
		const cepLimpo = cepValor.replace(/\D/g, '');
		if (cepLimpo.length !== 8) return;

		buscandoCep = true;
		try {
			const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
			const dados = await res.json();
			if (!dados.erro) {
				logradouroValor = dados.logradouro || '';
				bairroValor = dados.bairro || '';
				cidadeValor = dados.localidade || '';
				ufValor = dados.uf || '';
			}
		} catch {
			// Silencia falha no auto-cep
		} finally {
			buscandoCep = false;
		}
	}

	function abrirModalSuspender(id: number, nome: string, ativa: boolean) {
		academiaSuspender = { id, nome, ativa };
		motivoSuspensao = ativa ? 'Suspensão administrativa pela plataforma SaaS' : '';
		modalSuspenderAberto = true;
	}

	function fecharModalSuspender() {
		modalSuspenderAberto = false;
		academiaSuspender = null;
		motivoSuspensao = '';
	}
</script>

<svelte:head>
	<title>SGT Manager • Gestão de Academias (Tenants)</title>
</svelte:head>

<div class="space-y-8">
	<!-- HEADER DA PÁGINA -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-6">
		<div>
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-xs font-mono mb-2">
				<Building2 class="w-3.5 h-3.5" />
				<span>Governança Multi-Tenant</span>
			</div>
			<h1 class="text-2xl font-extrabold text-white tracking-tight font-display">
				Academias & Dojos Homologados
			</h1>
			<p class="text-xs text-zinc-400 mt-1">
				Provisionamento de novas filiais, status operacional e controle de suspensão de contratos
			</p>
		</div>

		<button
			type="button"
			onclick={() => (modalNovaAcademiaAberto = true)}
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer shrink-0"
		>
			<Plus class="w-4 h-4" />
			<span>Criar Nova Academia</span>
		</button>
	</div>

	{#if form?.sucesso}
		<div class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
			<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
			<span>{form.mensagem}</span>
		</div>
	{/if}

	{#if form?.erro}
		<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
			<AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
			<span>{form.erro}</span>
		</div>
	{/if}

	<!-- GRID DE ACADEMIAS -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each data.academias as ac}
			<div class="p-6 rounded-2xl bg-zinc-950 border transition-all {ac.ativa ? 'border-zinc-900 hover:border-zinc-800' : 'border-red-950/80 bg-red-950/10'} space-y-4">
				<div class="flex items-start justify-between gap-3">
					<div>
						<div class="flex items-center gap-2">
							<span class="text-xs font-mono font-bold text-zinc-500">#{ac.id_academia}</span>
							<h3 class="text-base font-bold text-white leading-tight">
								{ac.nome_fantasia || ac.nome}
							</h3>
						</div>
						<span class="text-[11px] text-zinc-400 font-mono block mt-1">
							CNPJ: {ac.cnpj}
						</span>
					</div>

					{#if ac.ativa}
						<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 shrink-0">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
							Ativa
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-950/60 border border-red-800/80 text-red-300 shrink-0" title={ac.motivo_desativacao || 'Suspensa'}>
							<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
							Suspensa
						</span>
					{/if}
				</div>

				<!-- Métricas Rápidas do Tenant -->
				<div class="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-900/60 text-center text-xs font-mono">
					<div>
						<span class="text-zinc-500 text-[10px] block">Alunos</span>
						<strong class="text-zinc-200">{ac.total_alunos}</strong>
					</div>
					<div>
						<span class="text-zinc-500 text-[10px] block">Senseis</span>
						<strong class="text-zinc-200">{ac.total_professores}</strong>
					</div>
					<div>
						<span class="text-zinc-500 text-[10px] block">Turmas</span>
						<strong class="text-zinc-200">{ac.total_turmas}</strong>
					</div>
				</div>

				<!-- Rodapé do Card com Ação de Suspensão -->
				<div class="flex items-center justify-between pt-2 border-t border-zinc-900/80 text-xs">
					<span class="text-[11px] font-mono text-zinc-500">
						Online: <strong class="text-amber-400">{ac.sessoes_ativas}</strong>
					</span>

					<button
						type="button"
						onclick={() => abrirModalSuspender(ac.id_academia, ac.nome_fantasia || ac.nome, ac.ativa)}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer {ac.ativa ? 'bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400' : 'bg-zinc-900 hover:bg-emerald-950/60 border border-zinc-800 hover:border-emerald-800 text-zinc-400 hover:text-emerald-400'}"
					>
						{#if ac.ativa}
							<Ban class="w-3.5 h-3.5" />
							<span>Suspender</span>
						{:else}
							<CheckCircle class="w-3.5 h-3.5" />
							<span>Reativar</span>
						{/if}
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- ========================================================================= -->
<!-- MODAL: CRIAR NOVA ACADEMIA + NOVO ADMIN OBRIGATÓRIO (Transação ACID)      -->
<!-- ========================================================================= -->
{#if modalNovaAcademiaAberto}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
		<div class="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative space-y-6 my-8">
			<div class="flex items-center justify-between pb-4 border-b border-zinc-900">
				<div>
					<h3 class="text-base font-bold text-white font-display">
						Provisionar Nova Academia (Tenant)
					</h3>
					<p class="text-xs text-zinc-400 font-mono mt-0.5">
						Cadastro atômico dos dados do dojo + Primeiro Administrador
					</p>
				</div>
				<button
					type="button"
					onclick={() => (modalNovaAcademiaAberto = false)}
					class="p-2 text-zinc-500 hover:text-zinc-200 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/criarAcademia"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						modalNovaAcademiaAberto = false;
					};
				}}
				class="space-y-6 text-xs"
			>
				<!-- SEÇÃO 1: DADOS DA ACADEMIA -->
				<div class="space-y-3">
					<div class="flex items-center gap-2 font-mono font-bold text-amber-400 uppercase tracking-wider text-[11px]">
						<Building2 class="w-3.5 h-3.5" />
						<span>1. Dados Institucionais do Dojo</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="nomeAcademia" class="text-zinc-400 font-mono block mb-1">Razão Social *</label>
							<input
								id="nomeAcademia"
								name="nomeAcademia"
								required
								placeholder="Associação de Judô Tatame Central"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
							/>
						</div>
						<div>
							<label for="nomeFantasia" class="text-zinc-400 font-mono block mb-1">Nome Fantasia</label>
							<input
								id="nomeFantasia"
								name="nomeFantasia"
								placeholder="Dojo Tatame Central"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
							/>
						</div>
						<div>
							<label for="cnpj" class="text-zinc-400 font-mono block mb-1">CNPJ (14 dígitos) *</label>
							<input
								id="cnpj"
								name="cnpj"
								required
								placeholder="00.000.000/0001-00"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-mono"
							/>
						</div>
						<div>
							<label for="telefoneAcademia" class="text-zinc-400 font-mono block mb-1">Telefone da Recepção</label>
							<input
								id="telefoneAcademia"
								name="telefoneAcademia"
								placeholder="(11) 98888-0000"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-mono"
							/>
						</div>
					</div>
				</div>

				<!-- SEÇÃO 2: ENDEREÇO DA SEDE (COM AUTO-CEP) -->
				<div class="space-y-3 pt-3 border-t border-zinc-900">
					<div class="flex items-center gap-2 font-mono font-bold text-indigo-400 uppercase tracking-wider text-[11px]">
						<span>2. Endereço da Sede</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label for="cep" class="text-zinc-400 font-mono block mb-1">CEP (8 dígitos) *</label>
							<div class="relative">
								<input
									id="cep"
									name="cep"
									required
									bind:value={cepValor}
									onblur={consultarCep}
									placeholder="01501-000"
									class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
								/>
								<button
									type="button"
									onclick={consultarCep}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
									title="Buscar no ViaCEP"
								>
									<Search class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
						<div class="sm:col-span-2">
							<label for="logradouro" class="text-zinc-400 font-mono block mb-1">Logradouro *</label>
							<input
								id="logradouro"
								name="logradouro"
								required
								bind:value={logradouroValor}
								placeholder="Rua / Avenida"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
							/>
						</div>
						<div>
							<label for="numero" class="text-zinc-400 font-mono block mb-1">Número</label>
							<input
								id="numero"
								name="numero"
								placeholder="100"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
							/>
						</div>
						<div>
							<label for="bairro" class="text-zinc-400 font-mono block mb-1">Bairro</label>
							<input
								id="bairro"
								name="bairro"
								bind:value={bairroValor}
								placeholder="Bairro"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
							/>
						</div>
						<div class="grid grid-cols-2 gap-2">
							<div>
								<label for="cidade" class="text-zinc-400 font-mono block mb-1">Cidade *</label>
								<input
									id="cidade"
									name="cidade"
									required
									bind:value={cidadeValor}
									placeholder="São Paulo"
									class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
								/>
							</div>
							<div>
								<label for="uf" class="text-zinc-400 font-mono block mb-1">UF *</label>
								<input
									id="uf"
									name="uf"
									required
									maxlength="2"
									bind:value={ufValor}
									placeholder="SP"
									class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white uppercase focus:outline-none focus:border-indigo-500 font-mono"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- SEÇÃO 3: ADMINISTRADOR INICIAL DA ACADEMIA -->
				<div class="space-y-3 pt-3 border-t border-zinc-900">
					<div class="flex items-center gap-2 font-mono font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
						<ShieldCheck class="w-3.5 h-3.5" />
						<span>3. Administrador Inicial do Dojo (Obrigatório)</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="sm:col-span-2">
							<label for="adminNome" class="text-zinc-400 font-mono block mb-1">Nome Completo do Admin *</label>
							<input
								id="adminNome"
								name="adminNome"
								required
								placeholder="Sensei Marcos Silva"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
							/>
						</div>
						<div>
							<label for="adminTipoDocumento" class="text-zinc-400 font-mono block mb-1">Tipo de Documento</label>
							<select
								id="adminTipoDocumento"
								name="adminTipoDocumento"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
							>
								<option value="CPF">CPF (Brasileiro)</option>
								<option value="ESTRANGEIRO">Passaporte / Estrangeiro</option>
							</select>
						</div>
						<div>
							<label for="adminCpf" class="text-zinc-400 font-mono block mb-1">Documento / CPF *</label>
							<input
								id="adminCpf"
								name="adminCpf"
								required
								placeholder="000.000.000-00"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
							/>
						</div>
						<div>
							<label for="adminDataNascimento" class="text-zinc-400 font-mono block mb-1">Data de Nascimento *</label>
							<input
								id="adminDataNascimento"
								name="adminDataNascimento"
								type="date"
								required
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
							/>
						</div>
						<div>
							<label for="adminGenero" class="text-zinc-400 font-mono block mb-1">Gênero</label>
							<select
								id="adminGenero"
								name="adminGenero"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500"
							>
								<option value="M">Masculino</option>
								<option value="F">Feminino</option>
							</select>
						</div>
						<div>
							<label for="adminEmail" class="text-zinc-400 font-mono block mb-1">E-mail de Login *</label>
							<input
								id="adminEmail"
								name="adminEmail"
								type="email"
								required
								placeholder="marcos@tatamecentral.com.br"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
							/>
						</div>
						<div>
							<label for="adminSenha" class="text-zinc-400 font-mono block mb-1">Senha Inicial *</label>
							<input
								id="adminSenha"
								name="adminSenha"
								type="password"
								required
								minlength="6"
								placeholder="••••••••"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
							/>
						</div>
						<div class="sm:col-span-2 pt-1">
							<label class="flex items-center gap-2 cursor-pointer text-zinc-300">
								<input
									type="checkbox"
									name="adminTambemProfessor"
									class="rounded bg-zinc-900 border-zinc-800 text-amber-500 focus:ring-amber-400"
								/>
								<span>Atribuir também o perfil de <strong>Professor / Sensei</strong> a este administrador</span>
							</label>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
					<button
						type="button"
						onclick={() => (modalNovaAcademiaAberto = false)}
						class="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold uppercase tracking-wider transition-all shadow-lg"
					>
						Provisionar Academia
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL SUSPENDER/REATIVAR ACADEMIA -->
{#if modalSuspenderAberto && academiaSuspender}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2 text-white font-bold text-sm">
					{#if academiaSuspender.ativa}
						<Ban class="w-4 h-4 text-red-500" />
						<span>Suspender Academia</span>
					{:else}
						<CheckCircle class="w-4 h-4 text-emerald-500" />
						<span>Reativar Academia</span>
					{/if}
				</div>
				<button
					type="button"
					onclick={fecharModalSuspender}
					class="text-zinc-500 hover:text-zinc-200 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<p class="text-xs text-zinc-400 leading-relaxed">
				{#if academiaSuspender.ativa}
					Deseja suspender a academia <strong class="text-white">{academiaSuspender.nome}</strong>? Todas as sessões ativas deste dojo serão canceladas na hora e nenhum aluno ou professor conseguirá entrar até a reativação.
				{:else}
					Deseja reativar o acesso da academia <strong class="text-white">{academiaSuspender.nome}</strong>?
				{/if}
			</p>

			<form
				method="POST"
				action="?/alternarAtivacao"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						fecharModalSuspender();
					};
				}}
				class="space-y-4 pt-1 text-xs"
			>
				<input type="hidden" name="idAcademia" value={academiaSuspender.id} />
				<input type="hidden" name="acao" value={academiaSuspender.ativa ? 'desativar' : 'ativar'} />

				{#if academiaSuspender.ativa}
					<div>
						<label for="motivo" class="text-zinc-400 font-mono block mb-1">Motivo da Suspensão</label>
						<input
							id="motivo"
							name="motivo"
							bind:value={motivoSuspensao}
							placeholder="Inadimplência, manutenção, etc."
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-red-500"
						/>
					</div>
				{/if}

				<div class="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={fecharModalSuspender}
						class="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-white shadow-lg transition-all {academiaSuspender.ativa ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}"
					>
						{academiaSuspender.ativa ? 'Confirmar Suspensão' : 'Confirmar Reativação'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

