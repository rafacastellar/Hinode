<script lang="ts">
	import { Award, ShieldCheck, Users, ClipboardList, HeartHandshake, Eye } from '@lucide/svelte';

	interface Props {
		perfis: string[];
		visaoAtiva: string;
	}

	let { perfis = [], visaoAtiva = 'admin' }: Props = $props();

	const perfisNorm = $derived(perfis.map((p) => p.toLowerCase()));

	// Determina quais visões estão autorizadas para o usuário com base nos seus perfis
	const opcoesVisao = $derived.by(() => {
		const opcoes: Array<{
			id: string;
			label: string;
			sublabel: string;
			icone: typeof Award;
			cor: string;
		}> = [];

		if (perfisNorm.includes('aluno')) {
			opcoes.push({
				id: 'aluno',
				label: 'Meu Judô',
				sublabel: 'Atleta',
				icone: Award,
				cor: 'red'
			});
		}

		if (perfisNorm.includes('professor')) {
			opcoes.push({
				id: 'professor',
				label: 'Meu Tatame',
				sublabel: 'Sensei',
				icone: Award,
				cor: 'amber'
			});
		}

		if (perfisNorm.includes('recepção') || perfisNorm.includes('recepcao')) {
			opcoes.push({
				id: 'recepcao',
				label: 'Secretaria',
				sublabel: 'Recepção',
				icone: ClipboardList,
				cor: 'sky'
			});
		}

		if (perfisNorm.includes('responsável') || perfisNorm.includes('responsavel')) {
			opcoes.push({
				id: 'responsavel',
				label: 'Dependentes',
				sublabel: 'Responsável',
				icone: HeartHandshake,
				cor: 'emerald'
			});
		}

		if (perfisNorm.includes('admin')) {
			opcoes.push({
				id: 'admin',
				label: 'Gestão do Dojo',
				sublabel: 'Admin',
				icone: ShieldCheck,
				cor: 'red'
			});
		}

		return opcoes;
	});
</script>

{#if opcoesVisao.length > 1}
	<div
		class="p-2 sm:p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-900 backdrop-blur-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1"
	>
		<div class="flex items-center gap-2 pl-2">
			<Eye class="w-3.5 h-3.5 text-zinc-500" />
			<span class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
				Perspectiva Ativa:
			</span>
		</div>

		<div class="flex items-center gap-1.5 flex-wrap">
			{#each opcoesVisao as opt (opt.id)}
				{@const selecionada = visaoAtiva === opt.id}
				{@const Icone = opt.icone}
				<a
					href="?visao={opt.id}"
					class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all select-none {selecionada
						? 'bg-zinc-800 text-white border border-zinc-700 shadow-md ring-1 ring-zinc-600'
						: 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'}"
					data-sveltekit-noscroll
				>
					<Icone
						class="w-3.5 h-3.5 {selecionada
							? opt.cor === 'amber'
								? 'text-amber-400'
								: opt.cor === 'sky'
									? 'text-sky-400'
									: opt.cor === 'emerald'
										? 'text-emerald-400'
										: 'text-red-500'
							: 'text-zinc-500'}"
					/>
					<span>{opt.label}</span>
					<span
						class="text-[9px] font-mono px-1.5 py-0.2 rounded {selecionada
							? 'bg-zinc-900 text-zinc-300 font-bold'
							: 'text-zinc-600'}"
					>
						{opt.sublabel}
					</span>
				</a>
			{/each}
		</div>
	</div>
{/if}
