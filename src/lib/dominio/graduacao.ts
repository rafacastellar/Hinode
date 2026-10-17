/**
 * Constantes e funções de domínio para Exames de Graduação e Faixas de Judô.
 * Arquivo compartilhado entre cliente (Svelte 5) e servidor.
 */

export const FAIXAS_GRADUACAO_LISTA = [
	'Branca',
	'Cinza',
	'Azul',
	'Amarela',
	'Laranja',
	'Verde',
	'Roxa',
	'Marrom',
	'Preta'
] as const;

export type FaixaGraduacao = (typeof FAIXAS_GRADUACAO_LISTA)[number];

export function obterProximaFaixaCliente(faixaAtual?: string | null): string {
	if (!faixaAtual) return 'Cinza';
	const normalizada = faixaAtual.toLowerCase().trim();

	if (normalizada.includes('branca')) return 'Cinza';
	if (normalizada.includes('cinza')) return 'Azul';
	if (normalizada.includes('azul')) return 'Amarela';
	if (normalizada.includes('amarela')) return 'Laranja';
	if (normalizada.includes('laranja')) return 'Verde';
	if (normalizada.includes('verde')) return 'Roxa';
	if (normalizada.includes('roxa')) return 'Marrom';
	if (normalizada.includes('marrom')) return 'Preta';
	if (normalizada.includes('preta')) return 'Preta (2º Dan)';

	return 'Preta';
}

export function formatarDataBr(dataIso?: string | null): string {
	if (!dataIso) return '';
	if (dataIso.includes('/')) return dataIso;
	const partes = dataIso.split('-');
	if (partes.length !== 3) return dataIso;
	const [ano, mes, dia] = partes;
	return `${dia}/${mes}/${ano}`;
}

export function formatarPeriodoInscricaoExame(
	dataInicioInscricao?: string | null,
	dataFimInscricao?: string | null
): string {
	const inicioBr = formatarDataBr(dataInicioInscricao);
	const fimBr = formatarDataBr(dataFimInscricao);

	if (inicioBr && fimBr) {
		return `${inicioBr} até ${fimBr}`;
	}
	if (fimBr) {
		return `Até ${fimBr}`;
	}
	if (inicioBr) {
		return `A partir de ${inicioBr}`;
	}
	return 'Aberto sem restrição de prazo';
}

export function obterStatusPeriodoInscricao(
	dataInicioInscricaoIso?: string | null,
	dataFimInscricaoIso?: string | null
): { status: 'aberta' | 'encerrada' | 'em_breve' | 'aberta_sem_prazo'; rotulo: string; classeCor: string } {
	const agora = new Date();
	const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;

	if (dataInicioInscricaoIso && hoje < dataInicioInscricaoIso) {
		return {
			status: 'em_breve',
			rotulo: `Inscrições em ${formatarDataBr(dataInicioInscricaoIso)}`,
			classeCor: 'bg-amber-950/40 text-amber-300 border-amber-800/60'
		};
	}

	if (dataFimInscricaoIso && hoje > dataFimInscricaoIso) {
		return {
			status: 'encerrada',
			rotulo: 'Inscrições Encerradas',
			classeCor: 'bg-zinc-900/60 text-zinc-400 border-zinc-800'
		};
	}

	if (dataInicioInscricaoIso || dataFimInscricaoIso) {
		return {
			status: 'aberta',
			rotulo: 'Inscrições Abertas',
			classeCor: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
		};
	}

	return {
		status: 'aberta_sem_prazo',
		rotulo: 'Inscrições Livres',
		classeCor: 'bg-blue-950/40 text-blue-300 border-blue-800/60'
	};
}
