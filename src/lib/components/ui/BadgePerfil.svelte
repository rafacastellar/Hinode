<script lang="ts">
	import { Shield, Award, Users, User, HeartHandshake } from '@lucide/svelte';

	interface Props {
		perfil: string;
		tamanho?: 'sm' | 'md';
		href?: string;
		ativo?: boolean;
		interativo?: boolean;
		onclick?: () => void;
	}

	let {
		perfil,
		tamanho = 'sm',
		href = undefined,
		ativo = false,
		interativo = false,
		onclick = undefined
	}: Props = $props();

	function normalizar(texto: string): string {
		return texto
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim();
	}

	const estiloConfig = $derived.by(() => {
		const chave = normalizar(perfil);
		switch (chave) {
			case 'admin':
				return {
					classesBase: 'bg-red-950/50 border-red-800/80 text-red-200',
					classesAtivo:
						'bg-red-600/25 border-red-500 text-white ring-1 ring-red-500/60 shadow-[0_0_14px_rgba(239,68,68,0.35)]',
					classesInativoInterativo:
						'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-red-950/40 hover:border-red-800/70 hover:text-red-200',
					pontoAtivo: 'bg-red-400',
					icone: Shield,
					label: 'Visão Gestão do Dojo (Admin)'
				};
			case 'professor':
				return {
					classesBase: 'bg-amber-950/40 border-amber-800/70 text-amber-200',
					classesAtivo:
						'bg-amber-500/25 border-amber-400 text-white ring-1 ring-amber-400/60 shadow-[0_0_14px_rgba(245,158,11,0.35)]',
					classesInativoInterativo:
						'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-amber-950/40 hover:border-amber-800/70 hover:text-amber-200',
					pontoAtivo: 'bg-amber-400',
					icone: Award,
					label: 'Visão Meu Tatame (Sensei / Professor)'
				};
			case 'recepcao':
				return {
					classesBase: 'bg-sky-950/40 border-sky-800/70 text-sky-200',
					classesAtivo:
						'bg-sky-500/25 border-sky-400 text-white ring-1 ring-sky-400/60 shadow-[0_0_14px_rgba(56,189,248,0.35)]',
					classesInativoInterativo:
						'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-sky-950/40 hover:border-sky-800/70 hover:text-sky-200',
					pontoAtivo: 'bg-sky-400',
					icone: Users,
					label: 'Visão Secretaria & Recepção'
				};
			case 'aluno':
				return {
					classesBase: 'bg-zinc-900 border-zinc-700 text-zinc-300',
					classesAtivo:
						'bg-zinc-800 border-zinc-400 text-white ring-1 ring-zinc-400/60 shadow-[0_0_14px_rgba(255,255,255,0.18)]',
					classesInativoInterativo:
						'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600 hover:text-zinc-200',
					pontoAtivo: 'bg-white',
					icone: User,
					label: 'Visão Meu Judô (Atleta)'
				};
			case 'responsavel':
				return {
					classesBase: 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200',
					classesAtivo:
						'bg-emerald-500/25 border-emerald-400 text-white ring-1 ring-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]',
					classesInativoInterativo:
						'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-emerald-950/40 hover:border-emerald-800/70 hover:text-emerald-200',
					pontoAtivo: 'bg-emerald-400',
					icone: HeartHandshake,
					label: 'Visão Espaço da Família (Responsável Legal)'
				};
			default:
				return {
					classesBase: 'bg-zinc-900 border-zinc-800 text-zinc-400',
					classesAtivo: 'bg-zinc-800 border-zinc-600 text-white ring-1 ring-zinc-500',
					classesInativoInterativo:
						'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
					pontoAtivo: 'bg-zinc-300',
					icone: User,
					label: perfil
				};
		}
	});

	const Icone = $derived(estiloConfig.icone);
	const ehInterativo = $derived(Boolean(href) || interativo);

	const classesFinais = $derived(
		ehInterativo
			? ativo
				? `${estiloConfig.classesAtivo} font-bold`
				: `${estiloConfig.classesInativoInterativo} font-medium`
			: `${estiloConfig.classesBase} font-medium`
	);
</script>

{#if href}
	<a
		{href}
		{onclick}
		data-sveltekit-noscroll
		class="inline-flex items-center gap-1.5 border rounded-lg transition-all cursor-pointer select-none active:scale-95 {classesFinais} {tamanho === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}"
		title={ativo ? `${estiloConfig.label} (Visualização Ativa)` : `Alternar painel para: ${estiloConfig.label}`}
		aria-current={ativo ? 'page' : undefined}
	>
		<Icone class="{tamanho === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0" />
		<span>{perfil}</span>
		{#if ativo}
			<span class="w-1.5 h-1.5 rounded-full {estiloConfig.pontoAtivo} shrink-0 animate-pulse"></span>
		{/if}
	</a>
{:else}
	<span
		class="inline-flex items-center gap-1.5 border rounded-md transition-colors {classesFinais} {tamanho === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}"
		title="Papel de acesso: {estiloConfig.label}"
	>
		<Icone class="{tamanho === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0" />
		<span>{perfil}</span>
	</span>
{/if}
