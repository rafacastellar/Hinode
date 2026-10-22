import { obterIndiceFaixa } from './campeonato';

export type CampoOrdenacaoAtleta = 'graduacao' | 'idade' | 'categoria' | 'nome';
export type DirecaoOrdenacao = 'asc' | 'desc';

export interface AtletaBaseOrdenavel {
	nome?: string;
	nome_participante?: string;
	graduacao_atual?: string;
	faixa_participante?: string;
	idade: number;
	categoria?: string | null;
	categoria_participante?: string | null;
}

/**
 * Mapeia o peso hierárquico da classe de idade oficial CBJ / FPJ.
 * Permite ordenar do Sub-9 ao Master de forma intuitiva.
 */
export function obterIndiceClasseIdade(categoriaTexto: string | null | undefined): number {
	if (!categoriaTexto) return 999;
	const c = categoriaTexto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

	if (c.includes('sub-9') || c.includes('sub 9')) return 9;
	if (c.includes('sub-11') || c.includes('sub 11')) return 11;
	if (c.includes('sub-13') || c.includes('sub 13')) return 13;
	if (c.includes('sub-15') || c.includes('sub 15')) return 15;
	if (c.includes('sub-18') || c.includes('sub 18')) return 18;
	if (c.includes('sub-21') || c.includes('sub 21')) return 21;
	if (c.includes('senior')) return 30;
	if (c.includes('master 1')) return 35;
	if (c.includes('master 2')) return 40;
	if (c.includes('master 3')) return 45;
	if (c.includes('master 4')) return 50;
	if (c.includes('master 5')) return 55;
	if (c.includes('master 6')) return 60;
	if (c.includes('master 7')) return 65;
	if (c.includes('master 8')) return 70;
	if (c.includes('master')) return 35;
	return 100;
}

/**
 * Extrai o número do grau Dan (1 a 10) de uma faixa se presente.
 */
export function extrairNumeroDan(faixa: string | null | undefined): number {
	if (!faixa) return 0;
	const match = faixa.match(/(\d+)\s*[ºo°]?\s*dan/i);
	if (match) return parseInt(match[1], 10);
	const f = faixa.toLowerCase();
	if (f.includes('shodan')) return 1;
	if (f.includes('nidan')) return 2;
	if (f.includes('sandan')) return 3;
	if (f.includes('yondan')) return 4;
	if (f.includes('godan')) return 5;
	if (f.includes('rokudan')) return 6;
	if (f.includes('nanadan') || f.includes('shichidan')) return 7;
	if (f.includes('hachidan')) return 8;
	if (f.includes('kudan')) return 9;
	if (f.includes('judan')) return 10;
	return 0;
}

/**
 * Função utilitária pura para ordenar listas de atletas judocas.
 */
export function ordenarAtletas<T extends AtletaBaseOrdenavel>(
	lista: T[],
	campo: CampoOrdenacaoAtleta,
	direcao: DirecaoOrdenacao = 'asc'
): T[] {
	return [...lista].sort((a, b) => {
		let cmp = 0;

		if (campo === 'graduacao') {
			const faixaA = a.graduacao_atual || a.faixa_participante || '';
			const faixaB = b.graduacao_atual || b.faixa_participante || '';
			const idxA = obterIndiceFaixa(faixaA);
			const idxB = obterIndiceFaixa(faixaB);
			cmp = idxA - idxB;

			// Desempate específico por grau Dan (ex: 1º Dan vs 3º Dan ou 6º Dan vs 8º Dan)
			if (cmp === 0) {
				const danA = extrairNumeroDan(faixaA);
				const danB = extrairNumeroDan(faixaB);
				cmp = danA - danB;
			}

			// Desempate por idade e depois nome
			if (cmp === 0) {
				cmp = (a.idade || 0) - (b.idade || 0);
			}
			if (cmp === 0) {
				const nomeA = a.nome || a.nome_participante || '';
				const nomeB = b.nome || b.nome_participante || '';
				cmp = nomeA.localeCompare(nomeB, 'pt-BR');
			}
		} else if (campo === 'idade') {
			cmp = (a.idade || 0) - (b.idade || 0);
			if (cmp === 0) {
				const nomeA = a.nome || a.nome_participante || '';
				const nomeB = b.nome || b.nome_participante || '';
				cmp = nomeA.localeCompare(nomeB, 'pt-BR');
			}
		} else if (campo === 'categoria') {
			const catA = a.categoria || a.categoria_participante || '';
			const catB = b.categoria || b.categoria_participante || '';
			const rankA = obterIndiceClasseIdade(catA);
			const rankB = obterIndiceClasseIdade(catB);

			if (rankA !== rankB) {
				cmp = rankA - rankB;
			} else {
				cmp = catA.localeCompare(catB, 'pt-BR');
			}

			if (cmp === 0) {
				const nomeA = a.nome || a.nome_participante || '';
				const nomeB = b.nome || b.nome_participante || '';
				cmp = nomeA.localeCompare(nomeB, 'pt-BR');
			}
		} else {
			// Nome
			const nomeA = a.nome || a.nome_participante || '';
			const nomeB = b.nome || b.nome_participante || '';
			cmp = nomeA.localeCompare(nomeB, 'pt-BR');
		}

		return direcao === 'asc' ? cmp : -cmp;
	});
}
