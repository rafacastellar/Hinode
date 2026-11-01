<script lang="ts">
	import BadgeFaixa from './BadgeFaixa.svelte';
	import TermometroElegibilidade from './TermometroElegibilidade.svelte';
	import hinodeEmblema from '#lib/assets/hinode-emblema.svg';
	import { ShieldCheck, QrCode, Award, Scale, Building2, ChevronDown, ChevronUp } from '@lucide/svelte';

	interface Props {
		nome: string;
		matricula?: string | null;
		faixaAtual: string;
		categoria?: string | null;
		divisao?: string | null;
		peso?: number | null;
		nFederacao?: string | null;
		statusFederacao?: string | null;
		nomeSensei?: string | null;
		nomeAcademia?: string | null;
		dataReferenciaGraduacao?: string | null;
	}

	let {
		nome,
		matricula = null,
		faixaAtual = 'Branca',
		categoria = null,
		divisao = null,
		peso = null,
		nFederacao = null,
		statusFederacao = 'Ativo',
		nomeSensei = null,
		nomeAcademia = 'Judô Hinodê',
		dataReferenciaGraduacao = null
	}: Props = $props();

	let exibirPassaporte = $state(false);
</script>

<div class="rounded-2xl bg-zinc-950 border border-zinc-800/90 overflow-hidden shadow-xl">
	<!-- Barra de Cabeçalho Expansível -->
	<button
		type="button"
		onclick={() => (exibirPassaporte = !exibirPassaporte)}
		class="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors cursor-pointer text-left"
	>
		<div class="flex items-center gap-3.5">
			<div class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
				<img src={hinodeEmblema} alt="Hinodê" class="w-7 h-7 object-contain" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<span class="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
						Identidade Federativa & Progressão
					</span>
				</div>
				<h3 class="text-sm sm:text-base font-bold text-white font-display">
					Passaporte Digital do Judoca & Termômetro de Faixa
				</h3>
			</div>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<span class="text-xs font-mono text-zinc-400 hidden sm:inline">
				{exibirPassaporte ? 'Ocultar Carteirinha' : 'Exibir Carteirinha'}
			</span>
			<div class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
				{#if exibirPassaporte}
					<ChevronUp class="w-4 h-4" />
				{:else}
					<ChevronDown class="w-4 h-4" />
				{/if}
			</div>
		</div>
	</button>

	{#if exibirPassaporte}
		<div class="p-5 sm:p-6 border-t border-zinc-900 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/50">
			<!-- Cartão Físico Digital (Passaporte Hinodê) -->
			<div class="lg:col-span-7">
				<div
					class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-amber-500/30 p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.85)]"
				>
					<!-- Brilho de fundo Sol Nascente -->
					<div class="absolute -top-20 -right-20 w-52 h-52 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

					<!-- Topo do Cartão -->
					<div class="relative z-10 flex items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
						<div class="flex items-center gap-2.5">
							<img src={hinodeEmblema} alt="Emblema Hinodê" class="w-8 h-8 object-contain" />
							<div>
								<span class="font-display font-extrabold text-sm tracking-tight text-white block leading-none">
									{nomeAcademia || 'JUDÔ HINODÊ'}
								</span>
								<span class="text-[9px] font-mono uppercase tracking-widest text-amber-400/90 block mt-0.5">
									日の出 • Passaporte Oficial do Atleta
								</span>
							</div>
						</div>

						<span
							class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/60 border border-emerald-700/60 text-emerald-300"
						>
							<ShieldCheck class="w-3 h-3 text-emerald-400" />
							<span>{statusFederacao || 'Regular'}</span>
						</span>
					</div>

					<!-- Corpo do Cartão -->
					<div class="relative z-10 my-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div class="space-y-2">
							<div>
								<span class="text-[10px] font-mono uppercase text-zinc-500 block">Atleta / Judoca</span>
								<p class="text-lg font-extrabold text-white font-display tracking-tight">{nome}</p>
							</div>

							<div class="flex flex-wrap items-center gap-4 text-xs font-mono">
								<div>
									<span class="text-[10px] text-zinc-500 block uppercase">Matrícula</span>
									<span class="text-zinc-200 font-bold">{matricula ? `#${matricula}` : 'Oficial'}</span>
								</div>
								<div>
									<span class="text-[10px] text-zinc-500 block uppercase">Registro FPJ/CBJ</span>
									<span class="text-amber-300 font-bold">{nFederacao || 'Homologado'}</span>
								</div>
								<div>
									<span class="text-[10px] text-zinc-500 block uppercase">Peso / Classe</span>
									<span class="text-zinc-200 font-bold">
										{peso ? `${peso} kg` : '-'} {categoria ? `(${categoria})` : ''}
									</span>
								</div>
							</div>
						</div>

						<!-- QR Code Estilizado de Validação -->
						<div class="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center shrink-0 self-start sm:self-center">
							<QrCode class="w-12 h-12 text-zinc-200" />
							<span class="text-[8px] font-mono uppercase tracking-widest text-zinc-500 mt-1">
								ID Verificado
							</span>
						</div>
					</div>

					<!-- Rodapé do Cartão: Faixa + Sensei -->
					<div class="relative z-10 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 flex-wrap">
						<BadgeFaixa faixa={faixaAtual} size="sm" />
						{#if nomeSensei}
							<span class="text-[11px] font-mono text-zinc-400">
								Sensei: <strong class="text-zinc-200">{nomeSensei}</strong>
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Termômetro de Elegibilidade para Exame de Faixa -->
			<div class="lg:col-span-5 flex flex-col justify-center">
				<TermometroElegibilidade
					{faixaAtual}
					dataInicioOuUltimaGraduacao={dataReferenciaGraduacao}
				/>
			</div>
		</div>
	{/if}
</div>

