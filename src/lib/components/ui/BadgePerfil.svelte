<script lang="ts">
	import { Shield, Award, Users, User, HeartHandshake } from '@lucide/svelte';

	interface Props {
		perfil: string;
		tamanho?: 'sm' | 'md';
	}

	let { perfil, tamanho = 'sm' }: Props = $props();

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
					classes: 'bg-red-950/50 border-red-800/80 text-red-200 shadow-[0_0_12px_rgba(220,38,38,0.15)]',
					icone: Shield,
					label: 'Administrador'
				};
			case 'professor':
				return {
					classes: 'bg-amber-950/40 border-amber-800/70 text-amber-200',
					icone: Award,
					label: 'Sensei / Professor'
				};
			case 'recepcao':
				return {
					classes: 'bg-blue-950/40 border-blue-800/70 text-blue-200',
					icone: Users,
					label: 'Recepção'
				};
			case 'aluno':
				return {
					classes: 'bg-zinc-900 border-zinc-700 text-zinc-300',
					icone: User,
					label: 'Judoca / Atleta'
				};
			case 'responsavel':
				return {
					classes: 'bg-purple-950/40 border-purple-800/70 text-purple-200',
					icone: HeartHandshake,
					label: 'Responsável Legal'
				};
			default:
				return {
					classes: 'bg-zinc-900 border-zinc-800 text-zinc-400',
					icone: User,
					label: perfil
				};
		}
	});

	const Icone = $derived(estiloConfig.icone);
</script>

<span
	class="inline-flex items-center gap-1.5 font-medium border rounded-md transition-colors {estiloConfig.classes} {tamanho === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}"
	title="Papel de acesso: {estiloConfig.label}"
>
	<Icone class="{tamanho === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0" />
	<span>{perfil}</span>
</span>
