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

	// Grandes Mestres (Faixa Vermelha — 9º e 10º Dan)
	{ valor: 'Vermelha Kudan', rotulo: 'Vermelha Kudan (9º Dan)', grauDan: 9 },
	{ valor: 'Vermelha Judan', rotulo: 'Vermelha Judan (10º Dan)', grauDan: 10 }
] as const;

export const LISTA_TODAS_FAIXAS_VALORES: string[] = OPCOES_FAIXAS_CADASTRO.map((f) => f.valor);

/**
 * Normaliza qualquer graduação legado (ex: "Preta (1º Dan)", "Coral (6º Dan)", "Preta")
 * para os padrões diretos solicitados pelo dojo ("Preta Shodan", "Kodansha Rokudan", etc.).
 */
export function normalizarFaixaParaCadastro(faixa?: string | null): string {
	if (!faixa) return 'Branca';
	const f = faixa.trim().toLowerCase();
	if (f.includes('shodan') || f.includes('1º dan') || f.includes('1 dan')) return 'Preta Shodan';
	if (f.includes('nidan') || f.includes('2º dan') || f.includes('2 dan')) return 'Preta Nidan';
	if (f.includes('sandan') || f.includes('3º dan') || f.includes('3 dan')) return 'Preta Sandan';
	if (f.includes('yondan') || f.includes('4º dan') || f.includes('4 dan')) return 'Preta Yondan';
	if (f.includes('godan') || f.includes('5º dan') || f.includes('5 dan')) return 'Preta Godan';
	if (f.includes('rokudan') || f.includes('6º dan') || f.includes('6 dan')) return 'Kodansha Rokudan';
	if (f.includes('shichidan') || f.includes('nanadan') || f.includes('7º dan') || f.includes('7 dan'))
		return 'Kodansha Shichidan';
	if (f.includes('hachidan') || f.includes('8º dan') || f.includes('8 dan')) return 'Kodansha Hachidan';
	if (f.includes('kudan') || f.includes('9º dan') || f.includes('9 dan')) return 'Vermelha Kudan';
	if (f.includes('judan') || f.includes('10º dan') || f.includes('10 dan')) return 'Vermelha Judan';
	if (f === 'preta') return 'Preta Shodan';
	if (f.includes('marrom')) return 'Marrom';
	if (f.includes('roxa')) return 'Roxa';
	if (f.includes('verde')) return 'Verde';
	if (f.includes('laranja')) return 'Laranja';
	if (f.includes('amarela')) return 'Amarela';
	if (f.includes('azul')) return 'Azul';
	if (f.includes('cinza')) return 'Cinza';
	if (f.includes('branca')) return 'Branca';
	return faixa;
}

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
		return 'Vermelha Kudan';
	if (normalizada.includes('kudan') || normalizada.includes('9º dan') || normalizada.includes('9 dan'))
		return 'Vermelha Judan';
	if (normalizada.includes('judan') || normalizada.includes('10º dan') || normalizada.includes('10 dan'))
		return 'Vermelha Judan';

	if (normalizada.includes('preta')) return 'Preta Nidan';
	if (
		normalizada.includes('kodansha') ||
		normalizada.includes('kodancha') ||
		normalizada.includes('coral')
	)
		return 'Kodansha Shichidan';
	if (normalizada.includes('vermelha')) return 'Vermelha Judan';

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
