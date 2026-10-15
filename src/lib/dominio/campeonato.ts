/**
 * Constantes e funções de domínio de Campeonatos e Faixas do Judô.
 * Este arquivo é compartilhado entre cliente (Svelte) e servidor (SvelteKit / Node.js).
 * SEGREGAÇÃO DE SEGURANÇA: NUNCA coloque imports de banco ou credenciais aqui.
 */

export const FAIXAS_JUDO_LISTA = [
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

export type FaixaJudo = (typeof FAIXAS_JUDO_LISTA)[number];

export const FAIXAS_JUDO_ORDEM: Record<string, number> = {
	branca: 0,
	cinza: 1,
	azul: 2,
	amarela: 3,
	laranja: 4,
	verde: 5,
	roxa: 6,
	marrom: 7,
	preta: 8
};

/**
 * Normaliza e obtém o índice numérico sequencial da graduação (0 a 8).
 */
export function obterIndiceFaixa(faixa: string | null | undefined): number {
	if (!faixa) return 0;
	const normalizada = faixa
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();

	if (
		normalizada.includes('preta') ||
		normalizada.includes('dan') ||
		normalizada.includes('coral') ||
		normalizada.includes('vermelha')
	) {
		return 8;
	}
	if (normalizada.includes('marrom')) return 7;
	if (normalizada.includes('roxa')) return 6;
	if (normalizada.includes('verde')) return 5;
	if (normalizada.includes('laranja')) return 4;
	if (normalizada.includes('amarela')) return 3;
	if (normalizada.includes('azul')) return 2;
	if (normalizada.includes('cinza')) return 1;
	return 0; // Branca
}

/**
 * Formata um rótulo legível e amigável para o intervalo de graduação.
 */
export function formatarIntervaloFaixas(
	faixaInicio: string | null | undefined,
	faixaFim: string | null | undefined
): string {
	const fInicio = faixaInicio || 'Branca';
	const fFim = faixaFim || 'Preta';

	const idxInicio = obterIndiceFaixa(fInicio);
	const idxFim = obterIndiceFaixa(fFim);

	if (idxInicio === 0 && idxFim >= 8) {
		return 'Todas as Faixas';
	}
	if (idxInicio === 0) {
		return `Até Faixa ${fFim}`;
	}
	if (idxFim >= 8) {
		return `De ${fInicio} pra cima`;
	}
	return `De ${fInicio} até ${fFim}`;
}

/**
 * Formata um rótulo amigável para a faixa etária.
 */
export function formatarIdadeLimite(
	idadeMinima: number | null | undefined,
	idadeMaxima: number | null | undefined
): string {
	if (!idadeMinima && !idadeMaxima) {
		return 'Idade Livre';
	}
	if (idadeMinima && !idadeMaxima) {
		return `A partir de ${idadeMinima} anos`;
	}
	if (!idadeMinima && idadeMaxima) {
		return `Até ${idadeMaxima} anos`;
	}
	if (idadeMinima === idadeMaxima) {
		return `${idadeMinima} anos exatos`;
	}
	return `${idadeMinima} a ${idadeMaxima} anos`;
}
