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
		ShieldCheck,
		ImagePlus,
		Globe,
		Pencil,
		Trash2
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let modalNovaAcademiaAberto = $state(false);
	let modalSuspenderAberto = $state(false);
	let academiaSuspender = $state<{ id: number; nome: string; ativa: boolean } | null>(null);
	let motivoSuspensao = $state('');

	// Logo e Domínio na criação de nova academia
	let novaLogoUrl = $state('');
	let novoSlug = $state('');
	let novoDominio = $state('');

	// Modal de Edição de Logo / Domínio pelo Super Admin
	let modalBrandingAberto = $state(false);
	let academiaBranding = $state<{
		id: number;
		nome: string;
		nomeFantasia: string;
		logoUrl: string;
		slug: string;
		dominioCustomizado: string;
	} | null>(null);

	function abrirModalBranding(ac: (typeof data.academias)[0]) {
		academiaBranding = {
			id: ac.id_academia,
			nome: ac.nome,
			nomeFantasia: ac.nome_fantasia || ac.nome,
			logoUrl: ac.logo_url || '',
			slug: ac.slug || '',
			dominioCustomizado: ac.dominio_customizado || ''
		};
		modalBrandingAberto = true;
	}

	function fecharModalBranding() {
		modalBrandingAberto = false;
		academiaBranding = null;
	}

	function comprimirLogoArquivo(event: Event, destino: 'novo' | 'edicao') {
		const input = event.currentTarget as HTMLInputElement;
		const arquivo = input.files?.[0];
		if (!arquivo || !arquivo.type.startsWith('image/')) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				const maxDim = 256;
				let w = img.width;
				let h = img.height;
				if (w > h && w > maxDim) {
					h = Math.round((h * maxDim) / w);
					w = maxDim;
				} else if (h >= w && h > maxDim) {
					w = Math.round((w * maxDim) / h);
					h = maxDim;
				}
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.clearRect(0, 0, w, h);
					ctx.drawImage(img, 0, 0, w, h);
					const base64 = canvas.toDataURL('image/webp', 0.86);
					if (destino === 'novo') {
						novaLogoUrl = base64;
					} else if (academiaBranding) {
						academiaBranding.logoUrl = base64;
					}
				}
			};
			img.src = String(e.target?.result || '');
		};
		reader.readAsDataURL(arquivo);
	}

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
					<div class="flex items-center gap-3 min-w-0">
						<div class="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
							{#if ac.logo_url}
								<img src={ac.logo_url} alt={ac.nome} class="w-full h-full object-contain rounded-xl" />
							{:else}
								<Building2 class="w-6 h-6 text-zinc-500" />
							{/if}
						</div>
						<div class="min-w-0">
							<div class="flex items-center gap-1.5">
								<span class="text-xs font-mono font-bold text-zinc-500">#{ac.id_academia}</span>
								<h3 class="text-base font-bold text-white leading-tight truncate">
									{ac.nome_fantasia || ac.nome}
								</h3>
							</div>
							<span class="text-[11px] text-zinc-400 font-mono block mt-0.5">
								CNPJ: {ac.cnpj}
							</span>
							{#if ac.slug || ac.dominio_customizado}
								<span class="text-[10px] text-amber-400/90 font-mono block mt-0.5 truncate">
									🔗 {ac.dominio_customizado || `/login?dojo=${ac.slug}`}
								</span>
							{/if}
						</div>
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

				<!-- Rodapé do Card com Ações de Logo/Domínio e Suspensão -->
				<div class="flex items-center justify-between pt-2 border-t border-zinc-900/80 text-xs gap-2">
					<span class="text-[11px] font-mono text-zinc-500">
						Online: <strong class="text-amber-400">{ac.sessoes_ativas}</strong>
					</span>

					<div class="flex items-center gap-1.5">
						<button
							type="button"
							onclick={() => abrirModalBranding(ac)}
							class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 transition-colors cursor-pointer"
							title="Configurar Logo da Academia e Domínio Próprio"
						>
							<ImagePlus class="w-3.5 h-3.5" />
							<span>Logo & Domínio</span>
						</button>

						<button
							type="button"
							onclick={() => abrirModalSuspender(ac.id_academia, ac.nome_fantasia || ac.nome, ac.ativa)}
							class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer {ac.ativa ? 'bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400' : 'bg-zinc-900 hover:bg-emerald-950/60 border border-zinc-800 hover:border-emerald-800 text-zinc-400 hover:text-emerald-400'}"
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
						<div>
							<label for="slug" class="text-zinc-400 font-mono block mb-1">Slug do Login (/login?dojo=slug)</label>
							<input
								id="slug"
								name="slug"
								bind:value={novoSlug}
								placeholder="ex: bushido"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-mono lowercase"
							/>
						</div>
						<div>
							<label for="dominioCustomizado" class="text-zinc-400 font-mono block mb-1">Domínio Próprio (Opcional)</label>
							<input
								id="dominioCustomizado"
								name="dominioCustomizado"
								bind:value={novoDominio}
								placeholder="ex: app.bushido.com.br"
								class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-mono lowercase"
							/>
						</div>
						<div class="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
							<input type="hidden" name="logoUrl" value={novaLogoUrl} />
							<div class="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
								{#if novaLogoUrl}
									<img src={novaLogoUrl} alt="Logo" class="w-full h-full object-contain rounded-lg" />
								{:else}
									<Building2 class="w-5 h-5 text-zinc-600" />
								{/if}
							</div>
							<div class="flex-1">
								<label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold cursor-pointer transition-colors">
									<ImagePlus class="w-3.5 h-3.5" />
									<span>Selecionar Foto do Logo da Academia</span>
									<input type="file" accept="image/*" onchange={(e) => comprimirLogoArquivo(e, 'novo')} class="hidden" />
								</label>
								<span class="text-[10px] text-zinc-500 block mt-1">
									Usado na transição de login e no painel principal da academia.
								</span>
							</div>
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

<!-- MODAL: EDITAR LOGO, NOME FANTASIA E DOMÍNIO PRÓPRIO DA ACADEMIA (SUPER ADMIN) -->
{#if modalBrandingAberto && academiaBranding}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
		<div class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
			<div class="flex items-center justify-between pb-3 border-b border-zinc-900">
				<div class="flex items-center gap-2 text-white font-bold text-sm">
					<ImagePlus class="w-4 h-4 text-amber-400" />
					<span>Identidade Visual & Domínio (#{academiaBranding.id})</span>
				</div>
				<button
					type="button"
					onclick={fecharModalBranding}
					class="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/editarBrandingAcademia"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						fecharModalBranding();
					};
				}}
				class="space-y-4 text-xs"
			>
				<input type="hidden" name="idAcademia" value={academiaBranding.id} />
				<input type="hidden" name="logoUrl" value={academiaBranding.logoUrl} />

				<!-- Upload e Preview do Logo -->
				<div class="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
					<div class="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
						{#if academiaBranding.logoUrl}
							<img src={academiaBranding.logoUrl} alt="Preview Logo" class="w-full h-full object-contain rounded-xl" />
						{:else}
							<Building2 class="w-8 h-8 text-zinc-600" />
						{/if}
					</div>
					<div class="space-y-2 flex-1">
						<label class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider cursor-pointer transition-all">
							<ImagePlus class="w-3.5 h-3.5" />
							<span>Trocar Foto do Logo</span>
							<input type="file" accept="image/*" onchange={(e) => comprimirLogoArquivo(e, 'edicao')} class="hidden" />
						</label>
						{#if academiaBranding.logoUrl}
							<button
								type="button"
								onclick={() => {
									if (academiaBranding) academiaBranding.logoUrl = '';
								}}
								class="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-mono block cursor-pointer"
							>
								<Trash2 class="w-3 h-3" />
								<span>Remover logo</span>
							</button>
						{/if}
						<p class="text-[10px] text-zinc-500">
							Exibido na transição de login e no topo do painel da academia.
						</p>
					</div>
				</div>

				<div>
					<label for="editNomeFantasia" class="text-zinc-400 font-mono block mb-1">Nome em Destaque na Academia</label>
					<input
						id="editNomeFantasia"
						name="nomeFantasia"
						bind:value={academiaBranding.nomeFantasia}
						class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500"
					/>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="editSlug" class="text-zinc-400 font-mono block mb-1">Slug (/login?dojo=slug)</label>
						<input
							id="editSlug"
							name="slug"
							bind:value={academiaBranding.slug}
							placeholder="ex: hinode"
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-mono lowercase"
						/>
					</div>
					<div>
						<label for="editDominio" class="text-zinc-400 font-mono block mb-1">Domínio Próprio</label>
						<input
							id="editDominio"
							name="dominioCustomizado"
							bind:value={academiaBranding.dominioCustomizado}
							placeholder="ex: app.academia.com.br"
							class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-500 font-mono lowercase"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-900">
					<button
						type="button"
						onclick={fecharModalBranding}
						class="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer"
					>
						Salvar Identidade
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

