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
	'Preta',
	'Coral (Kodansha)',
	'Vermelha'
] as const;

export type FaixaGraduacao = (typeof FAIXAS_GRADUACAO_LISTA)[number];

export interface OpcaoFaixaCadastro {
	valor: string;
	rotulo: string;
	grauDan?: number;
}

export const OPCOES_FAIXAS_CADASTRO: readonly OpcaoFaixaCadastro[] = [
	// Kyu (Iniciação e Aprendizado Técnico)
	{ valor: 'Branca', rotulo: 'Branca' },
	{ valor: 'Cinza', rotulo: 'Cinza' },
	{ valor: 'Azul Claro', rotulo: 'Azul Claro' },
	{ valor: 'Azul', rotulo: 'Azul' },
	{ valor: 'Amarela', rotulo: 'Amarela' },
	{ valor: 'Laranja', rotulo: 'Laranja' },
	{ valor: 'Verde', rotulo: 'Verde' },
	{ valor: 'Roxa', rotulo: 'Roxa' },
	{ valor: 'Marrom', rotulo: 'Marrom' },

	// Yudansha (Faixa Preta - 1º ao 5º Dan)
	{ valor: 'Preta Shodan', rotulo: 'Preta Shodan (1º Dan)', grauDan: 1 },
	{ valor: 'Preta Nidan', rotulo: 'Preta Nidan (2º Dan)', grauDan: 2 },
	{ valor: 'Preta Sandan', rotulo: 'Preta Sandan (3º Dan)', grauDan: 3 },
	{ valor: 'Preta Yondan', rotulo: 'Preta Yondan (4º Dan)', grauDan: 4 },
	{ valor: 'Preta Godan', rotulo: 'Preta Godan (5º Dan)', grauDan: 5 },

	// Kodansha (Faixa Coral / Vermelha e Branca — 6º ao 8º Dan)
	{ valor: 'Kodansha Rokudan', rotulo: 'Kodansha Rokudan (6º Dan)', grauDan: 6 },
	{ valor: 'Kodansha Shichidan', rotulo: 'Kodansha Shichidan (7º Dan)', grauDan: 7 },
	{ valor: 'Kodansha Hachidan', rotulo: 'Kodansha Hachidan (8º Dan)', grauDan: 8 },

	// Grandes Mestres (9º e 10º Dan — Kodansha Superior / Vermelha)
	{ valor: 'Kodansha Kudan', rotulo: 'Kodansha Kudan (9º Dan)', grauDan: 9 },
	{ valor: 'Kodansha Judan', rotulo: 'Kodansha Judan (10º Dan)', grauDan: 10 }
] as const;

export const LISTA_TODAS_FAIXAS_VALORES: string[] = OPCOES_FAIXAS_CADASTRO.map((f) => f.valor);

/**
 * Normaliza qualquer graduação legado (ex: "Preta (1º Dan)", "Coral (6º Dan)", "Preta")
 * para os padrões diretos solicitados pelo dojo ("Preta Shodan", "Kodansha Rokudan", etc.).
 */
export function normalizarFaixaParaCadastro(faixa?: string | null): string {
	if (!faixa) return 'Branca';
	const f = faixa.trim().toLowerCase();
	if (f.includes('shodan') || f.includes('1º dan') || f.includes('1o dan') || f.includes('1 dan')) return 'Preta Shodan';
	if (f.includes('nidan') || f.includes('2º dan') || f.includes('2o dan') || f.includes('2 dan')) return 'Preta Nidan';
	if (f.includes('sandan') || f.includes('3º dan') || f.includes('3o dan') || f.includes('3 dan')) return 'Preta Sandan';
	if (f.includes('yondan') || f.includes('yodan') || f.includes('4º dan') || f.includes('4o dan') || f.includes('4 dan')) return 'Preta Yondan';
	if (f.includes('godan') || f.includes('gondan') || f.includes('5º dan') || f.includes('5o dan') || f.includes('5 dan')) return 'Preta Godan';
	if (f.includes('rokudan') || f.includes('6º dan') || f.includes('6o dan') || f.includes('6 dan')) return 'Kodansha Rokudan';
	if (f.includes('shichidan') || f.includes('nanadan') || f.includes('7º dan') || f.includes('7o dan') || f.includes('7 dan'))
		return 'Kodansha Shichidan';
	if (f.includes('hachidan') || f.includes('8º dan') || f.includes('8o dan') || f.includes('8 dan')) return 'Kodansha Hachidan';
	if ((f.includes('kudan') && !f.includes('rokudan')) || f.includes('9º dan') || f.includes('9o dan') || f.includes('9 dan')) return 'Kodansha Kudan';
	if (f.includes('judan') || f.includes('10º dan') || f.includes('10o dan') || f.includes('10 dan')) return 'Kodansha Judan';
	if (f.includes('azul claro') || f.includes('azul-claro')) return 'Azul Claro';
	if (f.includes('marrom')) return 'Marrom';
	if (f.includes('roxa')) return 'Roxa';
	if (f.includes('verde')) return 'Verde';
	if (f.includes('laranja')) return 'Laranja';
	if (f.includes('amarel')) return 'Amarela';
	if (f.includes('azul')) return 'Azul';
	if (f.includes('cinza')) return 'Cinza';
	if (f.includes('branca')) return 'Branca';
	if (f.includes('coral') || f.includes('kodansha') || f.includes('kodancha')) return 'Kodansha Rokudan';
	if (f.includes('vermelha')) return 'Kodansha Kudan';
	if (f.includes('preta')) return 'Preta Shodan';
	return faixa;
}

/**
 * Retorna a legenda oficial com o Kyu ou Dan correspondente, conforme quadro oficial do dojo.
 */
export function obterLegendaOficialFaixa(faixa: string | null | undefined, dan?: number | string | null): string {
	if (!faixa) return 'FAIXA BRANCA (Mukyu - Sem grau)';
	const f = faixa
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();

	// 10º Dan
	if (f.includes('judan') || (f.includes('10') && f.includes('dan')) || dan === 10 || dan === '10') {
		return 'KODANSHA JUDAN ( PRETA 10º DAN)';
	}
	// 9º Dan (garantindo que não seja rokudan)
	if (((f.includes('kudan') && !f.includes('rokudan')) || (f.includes('9') && f.includes('dan'))) || dan === 9 || dan === '9') {
		return 'KODANSHA KUDAN ( PRETA 9º DAN)';
	}
	// 8º Dan
	if (f.includes('hachidan') || (f.includes('8') && f.includes('dan')) || dan === 8 || dan === '8') {
		return 'KODANSHA HACHIDAN ( PRETA 8º DAN)';
	}
	// 7º Dan
	if (f.includes('shichidan') || f.includes('nanadan') || (f.includes('7') && f.includes('dan')) || dan === 7 || dan === '7') {
		return 'KODANSHA SHICHIDAN ( PRETA 7º DAN)';
	}
	// 6º Dan
	if (
		f.includes('rokudan') ||
		(f.includes('6') && f.includes('dan')) ||
		f.includes('coral') ||
		f.includes('kodansha') ||
		f.includes('kodancha') ||
		dan === 6 ||
		dan === '6'
	) {
		return 'KODANSHA ROKUDAN ( PRETA 6º DAN)';
	}
	// 5º Dan
	if (f.includes('godan') || f.includes('gondan') || (f.includes('5') && f.includes('dan')) || dan === 5 || dan === '5') {
		return 'PRETA GODAN ( 5º DAN)';
	}
	// 4º Dan
	if (f.includes('yondan') || f.includes('yodan') || (f.includes('4') && f.includes('dan')) || dan === 4 || dan === '4') {
		return 'PRETA YODAN ( 4º DAN)';
	}
	// 3º Dan
	if (f.includes('sandan') || (f.includes('3') && f.includes('dan')) || dan === 3 || dan === '3') {
		return 'PRETA SANDAN ( 3º DAN)';
	}
	// 2º Dan
	if (f.includes('nidan') || (f.includes('2') && f.includes('dan')) || dan === 2 || dan === '2') {
		return 'PRETA NIDAN ( 2º DAN)';
	}
	// 1º Dan
	if (f.includes('shodan') || (f.includes('1') && f.includes('dan')) || f.includes('preta') || dan === 1 || dan === '1') {
		return 'PRETA SHODAN ( 1º DAN)';
	}

	// Kyu
	if (f.includes('marrom')) return 'FAIXA MARROM ( 1º Kyu)';
	if (f.includes('roxa')) return 'FAIXA ROXA ( 2º Kyu)';
	if (f.includes('verde')) return 'FAIXA VERDE ( 3º Kyu)';
	if (f.includes('laranja')) return 'FAIXA LARANJA ( 4º Kyu)';
	if (f.includes('amarel')) return 'FAIXA AMARELA ( 6º Kyu)';
	if (f.includes('azul claro') || f.includes('azul-claro')) return 'FAIXA AZUL CLARO ( 9º Kyu)';
	if (f.includes('azul')) return 'FAIXA AZUL ( 8º Kyu)';
	if (f.includes('cinza')) return 'FAIXA CINZA ( 10º Kyu)';
	if (f.includes('branca')) return 'FAIXA BRANCA (Mukyu - Sem grau)';

	return `FAIXA ${faixa.toUpperCase()}`;
}

/**
 * Retorna o rótulo principal limpo e em caixa alta para a faixa de judô.
 */
export function obterRotuloOficialFaixa(faixa: string | null | undefined): string {
	if (!faixa) return 'BRANCA';
	const f = faixa
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();

	if (f.includes('judan') || (f.includes('10') && f.includes('dan'))) return 'KODANSHA JUDAN';
	if ((f.includes('kudan') && !f.includes('rokudan')) || (f.includes('9') && f.includes('dan'))) return 'KODANSHA KUDAN';
	if (f.includes('hachidan') || (f.includes('8') && f.includes('dan'))) return 'KODANSHA HACHIDAN';
	if (f.includes('shichidan') || f.includes('nanadan') || (f.includes('7') && f.includes('dan'))) return 'KODANSHA SHICHIDAN';
	if (f.includes('rokudan') || (f.includes('6') && f.includes('dan')) || f.includes('coral') || f.includes('kodansha') || f.includes('kodancha'))
		return 'KODANSHA ROKUDAN';
	if (f.includes('godan') || f.includes('gondan') || (f.includes('5') && f.includes('dan'))) return 'PRETA GODAN';
	if (f.includes('yondan') || f.includes('yodan') || (f.includes('4') && f.includes('dan'))) return 'PRETA YONDAN';
	if (f.includes('sandan') || (f.includes('3') && f.includes('dan'))) return 'PRETA SANDAN';
	if (f.includes('nidan') || (f.includes('2') && f.includes('dan'))) return 'PRETA NIDAN';
	if (f.includes('shodan') || (f.includes('1') && f.includes('dan')) || f.includes('preta')) return 'PRETA SHODAN';

	if (f.includes('marrom')) return 'MARROM';
	if (f.includes('roxa')) return 'ROXA';
	if (f.includes('verde')) return 'VERDE';
	if (f.includes('laranja')) return 'LARANJA';
	if (f.includes('amarel')) return 'AMARELA';
	if (f.includes('azul claro') || f.includes('azul-claro')) return 'AZUL CLARO';
	if (f.includes('azul')) return 'AZUL';
	if (f.includes('cinza')) return 'CINZA';
	if (f.includes('branca')) return 'BRANCA';

	return faixa.toUpperCase();
}

export function obterProximaFaixaCliente(faixaAtual?: string | null): string {
	if (!faixaAtual) return 'Cinza';
	const normalizada = faixaAtual.toLowerCase().trim();

	if (normalizada.includes('branca')) return 'Cinza';
	if (normalizada.includes('cinza')) return 'Azul Claro';
	if (normalizada.includes('azul claro') || normalizada.includes('azul-claro')) return 'Azul';
	if (normalizada.includes('azul')) return 'Amarela';
	if (normalizada.includes('amarela')) return 'Laranja';
	if (normalizada.includes('laranja')) return 'Verde';
	if (normalizada.includes('verde')) return 'Roxa';
	if (normalizada.includes('roxa')) return 'Marrom';
	if (normalizada.includes('marrom')) return 'Preta Shodan';

	// Progressão de Dan
	if (normalizada.includes('shodan') || normalizada.includes('1º dan') || normalizada.includes('1 dan'))
		return 'Preta Nidan';
	if (normalizada.includes('nidan') || normalizada.includes('2º dan') || normalizada.includes('2 dan'))
		return 'Preta Sandan';
	if (normalizada.includes('sandan') || normalizada.includes('3º dan') || normalizada.includes('3 dan'))
		return 'Preta Yondan';
	if (normalizada.includes('yondan') || normalizada.includes('4º dan') || normalizada.includes('4 dan'))
		return 'Preta Godan';
	if (normalizada.includes('godan') || normalizada.includes('5º dan') || normalizada.includes('5 dan'))
		return 'Kodansha Rokudan';
	if (normalizada.includes('rokudan') || normalizada.includes('6º dan') || normalizada.includes('6 dan'))
		return 'Kodansha Shichidan';
	if (
		normalizada.includes('shichidan') ||
		normalizada.includes('nanadan') ||
		normalizada.includes('7º dan') ||
		normalizada.includes('7 dan')
	)
		return 'Kodansha Hachidan';
	if (normalizada.includes('hachidan') || normalizada.includes('8º dan') || normalizada.includes('8 dan'))
		return 'Kodansha Kudan';
	if (normalizada.includes('kudan') || normalizada.includes('9º dan') || normalizada.includes('9 dan'))
		return 'Kodansha Judan';
	if (normalizada.includes('judan') || normalizada.includes('10º dan') || normalizada.includes('10 dan'))
		return 'Kodansha Judan';

	if (normalizada.includes('preta')) return 'Preta Nidan';
	if (
		normalizada.includes('kodansha') ||
		normalizada.includes('kodancha') ||
		normalizada.includes('coral')
	)
		return 'Kodansha Shichidan';
	if (normalizada.includes('vermelha')) return 'Kodansha Judan';

	return 'Preta Shodan';
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
