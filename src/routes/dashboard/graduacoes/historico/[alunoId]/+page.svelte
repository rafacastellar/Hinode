<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import {
		OPCOES_FAIXAS_CADASTRO,
		obterRotuloOrigemGraduacao,
		normalizarFaixaParaCadastro,
		formatarDataBr
	} from '#lib/dominio/graduacao';
	import { obterIndiceFaixa } from '#lib/dominio/campeonato';
	import { extrairNumeroDan } from '#lib/dominio/ordenacao-atletas';
	import {
		Award,
		Calendar,
		ArrowLeft,
		ShieldCheck,
		CheckCircle2,
		Sparkles,
		Plus,
		Trash2,
		History,
		Building2,
		AlertCircle,
		Wand2,
		X
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mostrarPainelImportacao = $state(false);
	let carregandoSalvamento = $state(false);

	let origemSelecionada = $state<'HISTORICO_ANTERIOR' | 'TRANSFERENCIA'>('HISTORICO_ANTERIOR');
	let idProfessorSelecionado = $state<string>('');
	let nomeExaminadorExterno = $state<string>('');
	let associacaoPadrao = $state<string>('FPJ / CBJ');
	let descricaoOrigemPadrao = $state<string>('Acervo Histórico (Pré-Sistema)');

	interface EtapaHistoricoForm {
		idTemp: string;
		faixa: string;
		dataGraduacao: string;
		associacao: string;
		descricaoOrigem: string;
	}

	let etapas = $state<EtapaHistoricoForm[]>([
		{
			idTemp: 'etapa-1',
			faixa: 'Branca',
			dataGraduacao: '',
			associacao: '',
			descricaoOrigem: ''
		}
	]);

	$effect(() => {
		if (data.professores.length > 0 && !idProfessorSelecionado && origemSelecionada === 'HISTORICO_ANTERIOR') {
			idProfessorSelecionado = String(data.professores[0].id_usuario);
		}
		if (etapas.length === 1 && etapas[0].faixa === 'Branca' && !etapas[0].dataGraduacao && data.aluno.data_inicio) {
			etapas[0].dataGraduacao = data.aluno.data_inicio;
		}
	});

	$effect(() => {
		if (form?.sucesso) {
			mostrarPainelImportacao = false;
			etapas = [
				{
					idTemp: `etapa-${Date.now()}`,
					faixa: 'Branca',
					dataGraduacao: data.aluno.data_inicio || '',
					associacao: '',
					descricaoOrigem: ''
				}
			];
		}
	});

	function alterarOrigemLote(novaOrigem: 'HISTORICO_ANTERIOR' | 'TRANSFERENCIA') {
		origemSelecionada = novaOrigem;
		if (novaOrigem === 'TRANSFERENCIA') {
			idProfessorSelecionado = 'externo';
			descricaoOrigemPadrao = 'Transferência de Academia Anterior';
		} else {
			descricaoOrigemPadrao = 'Acervo Histórico (Pré-Sistema)';
			if (data.professores.length > 0) {
				idProfessorSelecionado = String(data.professores[0].id_usuario);
			}
		}
	}

	function adicionarLinhaEtapa() {
		const ultimaFaixa = etapas.length > 0 ? etapas[etapas.length - 1].faixa : 'Branca';
		const idxUltima = OPCOES_FAIXAS_CADASTRO.findIndex((o) => o.valor === ultimaFaixa);
		const proximaSugerida =
			idxUltima >= 0 && idxUltima + 1 < OPCOES_FAIXAS_CADASTRO.length
				? OPCOES_FAIXAS_CADASTRO[idxUltima + 1].valor
				: 'Cinza';

		etapas = [
			...etapas,
			{
				idTemp: `etapa-${Date.now()}-${etapas.length}`,
				faixa: proximaSugerida,
				dataGraduacao: '',
				associacao: '',
				descricaoOrigem: ''
			}
		];
	}

	function removerLinhaEtapa(idTemp: string) {
		if (etapas.length <= 1) return;
		etapas = etapas.filter((e) => e.idTemp !== idTemp);
	}

	/**
	 * Preenche automaticamente todas as faixas desde a Faixa Branca até a graduação atual do atleta,
	 * pulando apenas as faixas que já constam registradas no banco.
	 */
	function preencherEscadaAteFaixaAtual() {
		const faixaAtualNorm = normalizarFaixaParaCadastro(data.aluno.graduacao_atual);
		const idxAlvo = obterIndiceFaixa(faixaAtualNorm);
		const danAlvo = extrairNumeroDan(faixaAtualNorm);

		const sequenciaCompleta = [
			'Branca',
			'Cinza',
			'Azul',
			'Amarela',
			'Laranja',
			'Verde',
			'Roxa',
			'Marrom',
			'Preta Shodan',
			'Preta Nidan',
			'Preta Sandan',
			'Preta Yondan',
			'Preta Godan',
			'Kodansha Rokudan',
			'Kodansha Shichidan',
			'Kodansha Hachidan',
			'Kodansha Kudan',
			'Kodansha Judan'
		];

		const faixasJaRegistradas = new Set(
			data.historico.map((h) => normalizarFaixaParaCadastro(h.faixa).toLowerCase())
		);

		const sugeridas = sequenciaCompleta.filter((f) => {
			if (faixasJaRegistradas.has(f.toLowerCase())) return false;
			const idx = obterIndiceFaixa(f);
			if (idx < idxAlvo) return true;
			if (idx > idxAlvo) return false;
			const dan = extrairNumeroDan(f);
			return dan <= danAlvo;
		});

		if (sugeridas.length === 0) {
			adicionarLinhaEtapa();
			return;
		}

		const anoAtual = new Date().getFullYear();
		etapas = sugeridas.map((faixa, idx) => {
			const anoSugerido = Math.max(2010, anoAtual - (sugeridas.length - 1 - idx));
			const dataSugerida =
				faixa === 'Branca' && data.aluno.data_inicio
					? data.aluno.data_inicio
					: `${anoSugerido}-06-15`;
			return {
				idTemp: `auto-${idx}-${Date.now()}`,
				faixa,
				dataGraduacao: dataSugerida,
				associacao: '',
				descricaoOrigem: ''
			};
		});
	}

	/**
	 * Linha do tempo unificada: garante que a Faixa Branca (Início no Tatame) sempre apareça
	 * como o marco #0 caso ainda não tenha sido lançada explicitamente em Historico_Graduacao.
	 */
	const linhaDoTempoCompleta = $derived.by(() => {
		const temFaixaBrancaRegistrada = data.historico.some(
			(h) => obterIndiceFaixa(h.faixa) === 0
		);

		const marcoBranca = temFaixaBrancaRegistrada
			? []
			: [
					{
						id_historico: 0,
						faixa: 'Branca',
						data_graduacao: data.aluno.data_inicio
							? formatarDataBr(data.aluno.data_inicio)
							: 'Início no Tatame',
						data_graduacao_iso: data.aluno.data_inicio || null,
						associacao: 'FPJ / CBJ',
						nome_professor_homologador:
							data.aluno.nome_professor_responsavel || 'Sensei Responsável',
						grau_faixa_professor: null,
						nome_evento: 'Ingresso no Judô (Faixa Inicial - Mukyu)',
						origem_registro: 'MARCO_INICIAL' as const,
						descricao_origem: 'Início no Tatame'
					}
				];

		return [...marcoBranca, ...data.historico];
	});

	const payloadEtapasJson = $derived(
		JSON.stringify(
			etapas.map((e) => ({
				faixa: e.faixa,
				dataGraduacao: e.dataGraduacao,
				associacao: e.associacao || null,
				descricaoOrigem: e.descricaoOrigem || null
			}))
		)
	);
</script>

<svelte:head>
	<title>{data.aluno.nome} - Prontuário de Graduações</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<!-- HEADER E NAVEGAÇÃO -->
	<div>
		<div class="flex items-center justify-between gap-4 mb-4 flex-wrap">
			<a
				href="/dashboard/graduacoes"
				class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors group"
			>
				<ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
				<span>Voltar para Painel de Graduações</span>
			</a>

			<a
				href="/dashboard/alunos/{data.aluno.id_usuario}"
				class="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
			>
				<span>Ir para Ficha Técnica do Judoca</span>
			</a>
		</div>

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

	<!-- FEEDBACK DE SUCESSO OU ERRO -->
	{#if form?.sucesso}
		<div
			class="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Histórico atualizado:</span>
				<p>{form.mensagem}</p>
			</div>
		</div>
	{/if}

	{#if form?.erro}
		<div
			class="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3"
		>
			<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
			<div class="min-w-0 flex-1">
				<span class="font-bold block mb-0.5">Não foi possível registrar:</span>
				<p>{form.erro}</p>
			</div>
		</div>
	{/if}

	<!-- PAINEL DE LANÇAMENTO EM LOTE DE HISTÓRICO ANTERIOR / TRANSFERÊNCIA -->
	{#if data.podeHomologar && mostrarPainelImportacao}
		<form
			method="POST"
			action="?/registrarLoteHistorico"
			use:enhance={() => {
				carregandoSalvamento = true;
				return async ({ update }) => {
					await update();
					carregandoSalvamento = false;
				};
			}}
			class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border-2 border-red-900/60 shadow-2xl space-y-6"
		>
			<input type="hidden" name="origemRegistro" value={origemSelecionada} />
			<input type="hidden" name="etapasJson" value={payloadEtapasJson} />

			<div class="flex items-start justify-between gap-4 pb-4 border-b border-zinc-900">
				<div class="flex items-center gap-3">
					<div
						class="w-9 h-9 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-400"
					>
						<History class="w-4 h-4" />
					</div>
					<div>
						<h2 class="text-base font-bold text-white font-display">
							Registrar Histórico de Faixas (Datas Controladas)
						</h2>
						<p class="text-xs text-zinc-400">
							Lance uma ou várias faixas anteriores (pré-sistema ou vindas de outra academia) sem criar eventos no painel de exames.
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => (mostrarPainelImportacao = false)}
					class="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
					title="Fechar painel"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Seletor de Origem: Acervo Pré-Sistema vs Transferência -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<button
					type="button"
					onclick={() => alterarOrigemLote('HISTORICO_ANTERIOR')}
					class="p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer {origemSelecionada ===
					'HISTORICO_ANTERIOR'
						? 'bg-amber-950/30 border-amber-600/80 text-white'
						: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
				>
					<History class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
					<div>
						<div class="text-xs font-bold text-white">Acervo Histórico (Pré-Sistema)</div>
						<p class="text-[11px] text-zinc-400 mt-0.5">
							Faixas que o judoca conquistou no próprio dojo antes da implantação do sistema.
						</p>
					</div>
				</button>

				<button
					type="button"
					onclick={() => alterarOrigemLote('TRANSFERENCIA')}
					class="p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer {origemSelecionada ===
					'TRANSFERENCIA'
						? 'bg-purple-950/30 border-purple-600/80 text-white'
						: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'}"
				>
					<Building2 class="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
					<div>
						<div class="text-xs font-bold text-white">Transferência (Outra Academia)</div>
						<p class="text-[11px] text-zinc-400 mt-0.5">
							Faixas trazidas de outro dojo/federação com registro detalhado das datas.
						</p>
					</div>
				</button>
			</div>

			<!-- Dados Padrão de Sensei/Banca e Academia/Associação -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
				<div>
					<label
						for="idProfessorHomologador"
						class="block text-[11px] font-mono uppercase text-zinc-400 mb-1"
					>
						Sensei / Avaliador *
					</label>
					<select
						id="idProfessorHomologador"
						name="idProfessorHomologador"
						bind:value={idProfessorSelecionado}
						class="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
					>
						{#each data.professores as prof}
							<option value={String(prof.id_usuario)}>
								{prof.nome} ({prof.grau_faixa || 'Sensei'})
							</option>
						{/each}
						<option value="externo">Sensei de Outra Academia / Banca Externa</option>
					</select>
				</div>

				{#if idProfessorSelecionado === 'externo' || !idProfessorSelecionado}
					<div>
						<label
							for="nomeExaminadorExterno"
							class="block text-[11px] font-mono uppercase text-amber-300 mb-1"
						>
							Nome do Sensei / Banca de Origem *
						</label>
						<input
							type="text"
							id="nomeExaminadorExterno"
							name="nomeExaminadorExterno"
							bind:value={nomeExaminadorExterno}
							required
							placeholder="Ex: Sensei Takeda / Banca FPJ"
							class="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-amber-800/70 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
						/>
					</div>
				{/if}

				<div>
					<label
						for="descricaoOrigemPadrao"
						class="block text-[11px] font-mono uppercase text-zinc-400 mb-1"
					>
						{origemSelecionada === 'TRANSFERENCIA' ? 'Academia Anterior' : 'Identificação da Origem'}
					</label>
					<input
						type="text"
						id="descricaoOrigemPadrao"
						name="descricaoOrigemPadrao"
						bind:value={descricaoOrigemPadrao}
						placeholder="Ex: Dojo Kodokan / Acervo Hinodê"
						class="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
					/>
				</div>

				<div>
					<label
						for="associacaoPadrao"
						class="block text-[11px] font-mono uppercase text-zinc-400 mb-1"
					>
						Federação / Associação Padrão
					</label>
					<input
						type="text"
						id="associacaoPadrao"
						name="associacaoPadrao"
						bind:value={associacaoPadrao}
						placeholder="Ex: FPJ / CBJ"
						class="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
					/>
				</div>
			</div>

			<!-- Lista de Etapas (Faixas + Datas Controladas) -->
			<div class="space-y-3">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<span class="text-xs font-mono uppercase text-zinc-300 font-bold">
						Faixas e Datas de Graduação ({etapas.length})
					</span>

					<div class="flex items-center gap-2 flex-wrap">
						<button
							type="button"
							onclick={preencherEscadaAteFaixaAtual}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/50 text-xs font-mono transition-colors cursor-pointer"
							title="Gera automaticamente as linhas de Cinza até a faixa atual do aluno"
						>
							<Wand2 class="w-3.5 h-3.5" />
							<span>Sugerir Escada até {data.aluno.graduacao_atual}</span>
						</button>

						<button
							type="button"
							onclick={adicionarLinhaEtapa}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-mono transition-colors cursor-pointer"
						>
							<Plus class="w-3.5 h-3.5 text-red-400" />
							<span>Adicionar Faixa</span>
						</button>
					</div>
				</div>

				<div class="space-y-2.5">
					{#each etapas as etapa, idx (etapa.idTemp)}
						<div
							class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
						>
							<div class="sm:col-span-4">
								<label
									for="faixa-{etapa.idTemp}"
									class="block text-[10px] font-mono uppercase text-zinc-400 mb-1"
								>
									#{idx + 1} Faixa Conquistada *
								</label>
								<select
									id="faixa-{etapa.idTemp}"
									bind:value={etapa.faixa}
									required
									class="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
								>
									{#each OPCOES_FAIXAS_CADASTRO as opt}
										<option value={opt.valor}>{opt.rotulo}</option>
									{/each}
								</select>
							</div>

							<div class="sm:col-span-3">
								<label
									for="data-{etapa.idTemp}"
									class="block text-[10px] font-mono uppercase text-zinc-400 mb-1"
								>
									Data da Graduação *
								</label>
								<input
									id="data-{etapa.idTemp}"
									type="date"
									bind:value={etapa.dataGraduacao}
									required
									class="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-red-600"
								/>
							</div>

							<div class="sm:col-span-4">
								<label
									for="origem-{etapa.idTemp}"
									class="block text-[10px] font-mono uppercase text-zinc-400 mb-1"
								>
									Dojo / Observação (Opcional)
								</label>
								<input
									id="origem-{etapa.idTemp}"
									type="text"
									bind:value={etapa.descricaoOrigem}
									placeholder={descricaoOrigemPadrao || 'Mesma origem padrão'}
									class="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
								/>
							</div>

							<div class="sm:col-span-1 flex justify-end">
								<button
									type="button"
									onclick={() => removerLinhaEtapa(etapa.idTemp)}
									disabled={etapas.length <= 1}
									class="p-2 rounded-lg bg-zinc-950 hover:bg-red-950/50 text-zinc-500 hover:text-red-400 border border-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
									title="Remover esta faixa"
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex items-center justify-between gap-4 pt-4 border-t border-zinc-900 flex-wrap">
				<span class="text-[11px] text-zinc-400">
					A faixa atual (<strong class="text-white">{data.aluno.graduacao_atual}</strong>) será preservada caso as faixas lançadas sejam anteriores.
				</span>

				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={() => (mostrarPainelImportacao = false)}
						class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={carregandoSalvamento}
						class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 cursor-pointer"
					>
						<CheckCircle2 class="w-4 h-4" />
						<span>
							{carregandoSalvamento
								? 'Salvando Histórico...'
								: `Salvar ${etapas.length} ${etapas.length === 1 ? 'Faixa' : 'Faixas'} no Prontuário`}
						</span>
					</button>
				</div>
			</div>
		</form>
	{/if}

	<!-- TIMELINE VERTICAL DE EVOLUÇÃO -->
	<div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
			<div class="flex items-center gap-3">
				<div
					class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300"
				>
					<Award class="w-4 h-4 text-red-500" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white font-display">
						Linha do Tempo de Faixas ({linhaDoTempoCompleta.length})
					</h2>
					<p class="text-[11px] text-zinc-500">
						Da Faixa Branca inicial até as graduações homologadas (Insert-Only)
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2.5 flex-wrap">
				{#if data.podeHomologar}
					<button
						type="button"
						onclick={() => (mostrarPainelImportacao = !mostrarPainelImportacao)}
						class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/60 text-xs font-medium transition-colors cursor-pointer"
					>
						<History class="w-3.5 h-3.5" />
						<span>Registrar Histórico / Transferência</span>
					</button>

					<a
						href="/dashboard/graduacoes/nova?alunoId={data.aluno.id_usuario}&modo=PROMOCAO_DIRETA"
						class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
					>
						<Plus class="w-3.5 h-3.5" />
						<span>Promover Faixa</span>
					</a>
				{/if}

				<div class="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
					<ShieldCheck class="w-4 h-4" />
					<span>Trilha Auditada</span>
				</div>
			</div>
		</div>

		<div class="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
			{#each linhaDoTempoCompleta as exame}
				{@const infoOrigem = obterRotuloOrigemGraduacao(exame.origem_registro)}
				<div class="relative group">
					<!-- Marcador da Linha do Tempo -->
					<div
						class="absolute -left-[27px] sm:-left-[35px] top-1.5 w-4 h-4 rounded-full bg-zinc-950 border-2 {exame.id_historico === 0
							? 'border-zinc-400 group-hover:bg-zinc-200'
							: 'border-red-500 group-hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]'} group-hover:scale-110 transition-all"
					></div>

					<!-- Card da Etapa -->
					<div class="p-5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 transition-all">
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
							<div class="flex items-center gap-2.5 flex-wrap">
								<BadgeFaixa faixa={exame.faixa} size="md" />
								<span
									class="px-2 py-0.5 rounded-full text-[10px] font-mono border {infoOrigem.classeBadge}"
								>
									{infoOrigem.rotulo}
								</span>
								{#if exame.id_historico > 0}
									<span class="text-xs font-mono text-zinc-500">
										#{exame.id_historico}
									</span>
								{:else}
									<span class="text-[11px] font-mono text-zinc-500">
										Marco Inicial (Mukyu)
									</span>
								{/if}
							</div>

							<div class="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-200 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800">
								<Calendar class="w-3.5 h-3.5 text-red-400" />
								<span>{exame.data_graduacao}</span>
							</div>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-800/60 text-xs">
							<div>
								<span class="text-zinc-500 block text-[11px] font-mono uppercase">
									Sensei / Banca Homologadora:
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
									Origem & Associação:
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

		{#if data.historico.length === 0 && data.podeHomologar}
			<div class="p-4 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div class="text-xs text-zinc-400">
					<strong class="text-white">Dica:</strong> A Faixa Branca inicial já aparece na linha do tempo. Caso o judoca possua outras faixas conquistadas antes do sistema ou em outra academia, registre todas com suas datas controladas.
				</div>
				<button
					type="button"
					onclick={() => (mostrarPainelImportacao = true)}
					class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/60 font-medium text-xs transition-colors shrink-0 cursor-pointer"
				>
					<History class="w-3.5 h-3.5" />
					<span>Importar Faixas Anteriores</span>
				</button>
			</div>
		{/if}
	</div>
</div>
