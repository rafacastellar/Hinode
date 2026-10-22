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
	'Preta',
	'Coral (Kodansha)',
	'Vermelha'
] as const;

export type FaixaJudo = (typeof FAIXAS_JUDO_LISTA)[number];

export const FAIXAS_JUDO_ORDEM: Record<string, number> = {
	branca: 0,
	cinza: 1,
	'azul claro': 1.5,
	azul: 2,
	amarela: 3,
	laranja: 4,
	verde: 5,
	roxa: 6,
	marrom: 7,
	preta: 8,
	coral: 9,
	kodansha: 9,
	vermelha: 10
};

/**
 * Normaliza e obtém o índice numérico sequencial da graduação (0 a 10).
 * 0: Branca, 1: Cinza, 2: Azul, 3: Amarela, 4: Laranja, 5: Verde, 6: Roxa, 7: Marrom,
 * 8: Preta (1º a 5º Dan), 9: Kodansha / Coral (6º a 8º Dan), 10: Vermelha (9º e 10º Dan).
 */
export function obterIndiceFaixa(faixa: string | null | undefined): number {
	if (!faixa) return 0;
	const normalizada = faixa
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();

	// 9º e 10º Dan: Faixa Vermelha (Grandes Mestres)
	if (
		(normalizada.includes('vermelha') && !normalizada.includes('branca')) ||
		((normalizada.includes('9') || normalizada.includes('10')) && normalizada.includes('dan')) ||
		(normalizada.includes('kudan') && !normalizada.includes('rokudan')) ||
		normalizada.includes('judan')
	) {
		return 10;
	}

	// 6º, 7º e 8º Dan: Faixa Kodansha / Coral (Vermelha e Branca)
	if (
		normalizada.includes('coral') ||
		normalizada.includes('kodansha') ||
		normalizada.includes('kodancha') ||
		normalizada.includes('vermelha e branca') ||
		((normalizada.includes('6') || normalizada.includes('7') || normalizada.includes('8')) &&
			normalizada.includes('dan')) ||
		normalizada.includes('rokudan') ||
		normalizada.includes('nanadan') ||
		normalizada.includes('shichidan') ||
		normalizada.includes('hachidan')
	) {
		return 9;
	}

	// 1º ao 5º Dan: Faixa Preta (Yudansha)
	if (
		normalizada.includes('preta') ||
		normalizada.includes('dan') ||
		normalizada.includes('shodan') ||
		normalizada.includes('nidan') ||
		normalizada.includes('sandan') ||
		normalizada.includes('yondan') ||
		normalizada.includes('godan')
	) {
		return 8;
	}

	if (normalizada.includes('marrom')) return 7;
	if (normalizada.includes('roxa')) return 6;
	if (normalizada.includes('verde')) return 5;
	if (normalizada.includes('laranja')) return 4;
	if (normalizada.includes('amarela')) return 3;
	if (normalizada.includes('azul claro') || normalizada.includes('azul-claro')) return 1.5;
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

/**
 * Sugestões comuns de colocação geral da academia em campeonatos.
 * O campo é livre (texto aberto), mas estas sugestões facilitam o preenchimento.
 */
export const SUGESTOES_CLASSIFICACAO_ACADEMIA = [
	'1º Lugar Geral / Campeã Geral',
	'2º Lugar Geral / Vice-Campeã Geral',
	'3º Lugar Geral',
	'4º Lugar Geral',
	'5º Lugar Geral',
	'Top 10 Geral',
	'10ª Colocada Geral',
	'20ª Colocada Geral',
	'Troféu Eficiência',
	'Melhor Equipe de Base',
	'Participação'
] as const;

/**
 * Agrupamentos ordinais semânticos para lidar com volatilidade de preenchimento (ex: 'decima' <-> '10', 'campeã' <-> '1').
 */
const CLUSTERS_ORDINAIS: Array<{ numero: number; termos: string[] }> = [
	{ numero: 1, termos: ['1', 'primeir', 'campe', 'ouro', 'titulo', 'vencedor'] },
	{ numero: 2, termos: ['2', 'segund', 'vice', 'prata'] },
	{ numero: 3, termos: ['3', 'terceir', 'bronze'] },
	{ numero: 4, termos: ['4', 'quart'] },
	{ numero: 5, termos: ['5', 'quint'] },
	{ numero: 6, termos: ['6', 'sext'] },
	{ numero: 7, termos: ['7', 'setim'] },
	{ numero: 8, termos: ['8', 'oitav'] },
	{ numero: 9, termos: ['9', 'non'] },
	{ numero: 10, termos: ['10', 'decim'] },
	{ numero: 11, termos: ['11', 'decim primeir'] },
	{ numero: 12, termos: ['12', 'decim segund'] },
	{ numero: 13, termos: ['13', 'decim terceir'] },
	{ numero: 14, termos: ['14', 'decim quart'] },
	{ numero: 15, termos: ['15', 'decim quint'] },
	{ numero: 20, termos: ['20', 'vigesim'] },
	{ numero: 30, termos: ['30', 'trigesim'] },
	{ numero: 40, termos: ['40', 'quadragesim'] },
	{ numero: 50, termos: ['50', 'quinquagesim'] }
];

/**
 * Normaliza qualquer texto para comparação insensível a caixa, acentos e caracteres ordinais.
 */
export function normalizarTexto(txt: string | null | undefined): string {
	if (!txt) return '';
	return txt
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[ºª°]/g, '')
		.trim();
}

/**
 * Avalia se uma classificação livre gravada pelo sensei (ex: 'Campeã Geral', '2º Lugar', '10ª Colocada', 'Vigésima')
 * corresponde a um termo de busca digitado pelo usuário (ex: 'decima', '10', 'campeã', 'segundo', 'vigesima').
 */
export function correspondeClassificacaoAcademia(
	classificacao: string | null | undefined,
	termoBusca: string
): boolean {
	if (!classificacao || !termoBusca) return false;

	const normClassif = normalizarTexto(classificacao);
	const normBusca = normalizarTexto(termoBusca);

	if (!normClassif || !normBusca) return false;

	// 1. Busca textual direta (substring)
	if (normClassif.includes(normBusca)) return true;

	// 2. Busca por palavras individuais
	const palavrasBusca = normBusca.split(/\s+/).filter(Boolean);
	if (palavrasBusca.length > 1 && palavrasBusca.every((p) => normClassif.includes(p))) {
		return true;
	}

	// 3. Busca semântica por números e ordinais equivalentes
	for (const cluster of CLUSTERS_ORDINAIS) {
		const buscaBateComCluster = cluster.termos.some((t) => normBusca.includes(t) || normBusca === t);
		if (buscaBateComCluster) {
			const classifBateComCluster = cluster.termos.some(
				(t) => normClassif.includes(t) || normClassif.split(/\s+/).includes(t)
			);
			if (classifBateComCluster) return true;
		}
	}

	return false;
}

/**
 * Identifica se a colocação da academia é de pódio geral ou campeã (1º, 2º ou 3º lugar geral).
 */
export function ehPodioOuCampeao(classificacao: string | null | undefined): boolean {
	if (!classificacao) return false;
	const norm = normalizarTexto(classificacao);
	return (
		norm.includes('campe') ||
		norm.includes('1') ||
		norm.includes('ouro') ||
		norm.includes('vice') ||
		norm.includes('2') ||
		norm.includes('prata') ||
		norm.includes('3') ||
		norm.includes('bronze')
	);
}

