<script lang="ts">
	import { enhance } from '$app/forms';
	import BadgeFaixa from '#lib/components/ui/BadgeFaixa.svelte';
	import { toast } from '#lib/components/ui/toast.svelte';
	import { obterClassificacaoJudo } from '#lib/dominio/regras-categoria-peso';
	import { Scale, X, Check, ArrowRight, Plus, Minus, Loader2 } from '@lucide/svelte';

	interface AlunoPesagem {
		id_usuario: number;
		nome: string;
		graduacao_atual: string;
		peso: number | null;
		categoria: string | null;
		data_nascimento: string;
		genero: 'M' | 'F';
	}

	interface Props {
		aluno: AlunoPesagem | null;
		onFechar: () => void;
	}

	let { aluno, onFechar }: Props = $props();

	let pesoInput = $state('');
	let salvando = $state(false);

	$effect(() => {
		if (aluno) {
			pesoInput = aluno.peso !== null && aluno.peso !== undefined ? String(aluno.peso) : '';
		}
	});

	const pesoNumerico = $derived.by(() => {
		const v = parseFloat(String(pesoInput).replace(',', '.'));
		return Number.isFinite(v) ? v : null;
	});

	const simulacaoCBJ = $derived.by(() => {
		if (!aluno || !pesoNumerico || pesoNumerico < 10) return null;
		return obterClassificacaoJudo({
			dataNascimento: aluno.data_nascimento,
			genero: aluno.genero === 'F' ? 'F' : 'M',
			peso: pesoNumerico,
			graduacao: aluno.graduacao_atual || 'Branca'
		});
	});

	function ajustarPeso(delta: number) {
		const base = pesoNumerico ?? 60;
		const novo = Math.max(15, Math.min(250, Math.round((base + delta) * 10) / 10));
		pesoInput = novo.toFixed(1);
	}
</script>

{#if aluno}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="titulo-modal-pesagem"
	>
		<!-- Backdrop com Blur -->
		<div
			class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
			onclick={onFechar}
			onkeydown={(e) => e.key === 'Escape' && onFechar()}
			role="button"
			tabindex="0"
			aria-label="Fechar modal de pesagem"
		></div>

		<!-- Card do Modal -->
		<div
			class="relative z-10 w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden"
		>
			<div class="flex items-start justify-between gap-4 pb-4 border-b border-zinc-900">
				<div class="flex items-center gap-3">
					<div
						class="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0"
					>
						<Scale class="w-5 h-5" />
					</div>
					<div>
						<span class="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block">
							Aferição Oficial no Tatame
						</span>
						<h3 id="titulo-modal-pesagem" class="text-base font-bold text-white font-display">
							Pesagem Rápida
						</h3>
					</div>
				</div>

				<button
					type="button"
					onclick={onFechar}
					class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
					aria-label="Fechar"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Identificação do Atleta -->
			<div class="my-4 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-sm font-bold text-white truncate">{aluno.nome}</p>
					<p class="text-[11px] font-mono text-zinc-400 mt-0.5">
						Atual: <strong class="text-zinc-200">{aluno.peso ? `${aluno.peso} kg` : 'Sem peso'}</strong>
						• {aluno.categoria || 'Sem categoria'}
					</p>
				</div>
				<BadgeFaixa faixa={aluno.graduacao_atual} size="sm" uniformWidth={false} />
			</div>

			<form
				method="POST"
				action="?/pesagemRapida"
				use:enhance={() => {
					salvando = true;
					return async ({ result, update }) => {
						salvando = false;
						await update();
						if (result.type === 'success') {
							const msg = (result.data as any)?.mensagem || 'Pesagem registrada com sucesso!';
							toast.sucesso('Pesagem Oficial Homologada', msg);
							onFechar();
						} else if (result.type === 'failure') {
							const msgErro = (result.data as any)?.erro || 'Erro ao registrar pesagem.';
							toast.erro('Falha na Pesagem', msgErro);
						}
					};
				}}
				class="space-y-5"
			>
				<input type="hidden" name="id_aluno" value={aluno.id_usuario} />

				<div>
					<label for="input-peso-rapido" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
						Novo Peso na Balança (kg)
					</label>

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => ajustarPeso(-0.5)}
							class="h-12 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-mono text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
							title="Diminuir 0,5 kg"
						>
							<Minus class="w-3.5 h-3.5 text-red-400" />
							<span>0.5</span>
						</button>

						<div class="relative flex-1">
							<input
								id="input-peso-rapido"
								name="peso"
								type="number"
								step="0.1"
								min="10"
								max="300"
								required
								bind:value={pesoInput}
								placeholder="Ex: 66.0"
								class="w-full h-12 bg-black border-2 border-zinc-800 focus:border-red-500 rounded-xl px-4 text-center font-mono text-xl font-extrabold text-white focus:outline-none transition-colors"
							/>
							<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
								kg
							</span>
						</div>

						<button
							type="button"
							onclick={() => ajustarPeso(0.5)}
							class="h-12 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-mono text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
							title="Aumentar 0,5 kg"
						>
							<Plus class="w-3.5 h-3.5 text-emerald-400" />
							<span>0.5</span>
						</button>
					</div>
				</div>

				<!-- Preview Reativo da Categoria CBJ/FPJ -->
				{#if simulacaoCBJ}
					<div class="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-1">
						<span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
							Enquadramento Automático CBJ / FPJ
						</span>
						<div class="flex items-center justify-between gap-2 text-xs">
							<span class="text-zinc-400 truncate">{ aluno.categoria || 'Sem categoria' }</span>
							<ArrowRight class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
							<span class="font-bold text-emerald-200 font-mono">{simulacaoCBJ.categoriaCompleta}</span>
						</div>
					</div>
				{/if}

				<div class="flex items-center justify-end gap-2.5 pt-2">
					<button
						type="button"
						onclick={onFechar}
						class="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 cursor-pointer"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={salvando || !pesoNumerico}
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-xs font-bold text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer transition-all"
					>
						{#if salvando}
							<Loader2 class="w-4 h-4 animate-spin" />
							<span>Homologando...</span>
						{:else}
							<Check class="w-4 h-4" />
							<span>Confirmar Pesagem</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

