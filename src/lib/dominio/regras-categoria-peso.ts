/**
 * Motor de Classificação e Regras Oficiais de Judô (CBJ / FPJ)
 * 
 * Determina automaticamente:
 * 1. Classe de Idade oficial pelo Ano Civil (Sub-9 a Master 8)
 * 2. Categoria de Peso padronizada (Extra-Ligeiro a Super-Pesado)
 * 3. Divisão competitiva (Aspirante vs Especial) com base na graduação
 */

export type GeneroJudo = 'M' | 'F';
export type DivisaoJudo = 'Aspirante' | 'Especial';

export interface FaixaPesoDef {
	nome: string;
	pesoMax: number | null; // null = sem limite superior (Acima de X kg)
	rotuloPeso: string;     // Ex: "-66kg", "+100kg"
}

export interface ClasseIdadeDef {
	codigo: string;       // Ex: "Sub-15", "Master 2"
	nomeExibicao: string; // Ex: "Sub-15 (13-14 anos)", "Master 2 (35-39 anos)"
	idadeMin: number;
	idadeMax: number;
	isMaster?: boolean;
	tabelaMasculino: FaixaPesoDef[];
	tabelaFeminino: FaixaPesoDef[];
}

export interface ClassificacaoJudoResultado {
	idadeCivil: number;
	classeCodigo: string;
	classeNome: string;
	categoriaNome: string;
	limitePesoRotulo: string;
	categoriaCompleta: string; // Ex: "Sub-18 Leve (-66kg)"
	divisao: DivisaoJudo;
	divisaoSugerida: DivisaoJudo;
	mensagensAviso: string[];
}

// =============================================================================
// TABELAS OFICIAIS DE PESO POR CLASSE
// =============================================================================

const TABELA_PESOS_SUB9_M: FaixaPesoDef[] = [
	{ nome: 'Extra-Ligeiro', pesoMax: 23.0, rotuloPeso: '-23kg' },
	{ nome: 'Super-Ligeiro', pesoMax: 26.0, rotuloPeso: '-26kg' },
	{ nome: 'Ligeiro', pesoMax: 29.0, rotuloPeso: '-29kg' },
	{ nome: 'Meio-Leve', pesoMax: 32.0, rotuloPeso: '-32kg' },
	{ nome: 'Leve', pesoMax: 36.0, rotuloPeso: '-36kg' },
	{ nome: 'Meio-Médio', pesoMax: 40.0, rotuloPeso: '-40kg' },
	{ nome: 'Médio', pesoMax: 45.0, rotuloPeso: '-45kg' },
	{ nome: 'Meio-Pesado', pesoMax: 50.0, rotuloPeso: '-50kg' },
	{ nome: 'Pesado', pesoMax: null, rotuloPeso: '+50kg' }
];

const TABELA_PESOS_SUB9_F: FaixaPesoDef[] = [
	{ nome: 'Extra-Ligeiro', pesoMax: 22.0, rotuloPeso: '-22kg' },
	{ nome: 'Super-Ligeiro', pesoMax: 24.0, rotuloPeso: '-24kg' },
	{ nome: 'Ligeiro', pesoMax: 26.0, rotuloPeso: '-26kg' },
	{ nome: 'Meio-Leve', pesoMax: 29.0, rotuloPeso: '-29kg' },
	{ nome: 'Leve', pesoMax: 32.0, rotuloPeso: '-32kg' },
	{ nome: 'Meio-Médio', pesoMax: 36.0, rotuloPeso: '-36kg' },
	{ nome: 'Médio', pesoMax: 40.0, rotuloPeso: '-40kg' },
	{ nome: 'Meio-Pesado', pesoMax: 45.0, rotuloPeso: '-45kg' },
	{ nome: 'Pesado', pesoMax: null, rotuloPeso: '+45kg' }
];

const TABELA_PESOS_SUB11_M: FaixaPesoDef[] = [
	{ nome: 'Extra-Ligeiro', pesoMax: 26.0, rotuloPeso: '-26kg' },
	{ nome: 'Super-Ligeiro', pesoMax: 29.0, rotuloPeso: '-29kg' },
	{ nome: 'Ligeiro', pesoMax: 32.0, rotuloPeso: '-32kg' },
	{ nome: 'Meio-Leve', pesoMax: 35.0, rotuloPeso: '-35kg' },
	{ nome: 'Leve', pesoMax: 40.0, rotuloPeso: '-40kg' },
	{ nome: 'Meio-Médio', pesoMax: 45.0, rotuloPeso: '-45kg' },
	{ nome: 'Médio', pesoMax: 50.0, rotuloPeso: '-50kg' },
	{ nome: 'Meio-Pesado', pesoMax: 55.0, rotuloPeso: '-55kg' },
	{ nome: 'Pesado', pesoMax: null, rotuloPeso: '+55kg' }
];

const TABELA_PESOS_SUB11_F: FaixaPesoDef[] = [
	{ nome: 'Extra-Ligeiro', pesoMax: 25.0, rotuloPeso: '-25kg' },
	{ nome: 'Super-Ligeiro', pesoMax: 28.0, rotuloPeso: '-28kg' },
	{ nome: 'Ligeiro', pesoMax: 31.0, rotuloPeso: '-31kg' },
	{ nome: 'Meio-Leve', pesoMax: 34.0, rotuloPeso: '-34kg' },
	{ nome: 'Leve', pesoMax: 38.0, rotuloPeso: '-38kg' },
	{ nome: 'Meio-Médio', pesoMax: 42.0, rotuloPeso: '-42kg' },
	{ nome: 'Médio', pesoMax: 47.0, rotuloPeso: '-47kg' },
	{ nome: 'Meio-Pesado', pesoMax: 52.0, rotuloPeso: '-52kg' },
	{ nome: 'Pesado', pesoMax: null, rotuloPeso: '+52kg' }
];

const TABELA_PESOS_SUB13_M: FaixaPesoDef[] = [
	{ nome: 'Extra-Ligeiro', pesoMax: 28.0, rotuloPeso: '-28kg' },
	{ nome: 'Super-Ligeiro', pesoMax: 31.0, rotuloPeso: '-31kg' },
	{ nome: 'Ligeiro', pesoMax: 34.0, rotuloPeso: '-34kg' },
	{ nome: 'Meio-Leve', pesoMax: 38.0, rotuloPeso: '-38kg' },
	{ nome: 'Leve', pesoMax: 42.0, rotuloPeso: '-42kg' },
	{ nome: 'Meio-Médio', pesoMax: 47.0, rotuloPeso: '-47kg' },
	{ nome: 'Médio', pesoMax: 52.0, rotuloPeso: '-52kg' },
	{ nome: 'Meio-Pesado', pesoMax: 60.0, rotuloPeso: '-60kg' },
	{ nome: 'Pesado', pesoMax: 67.0, rotuloPeso: '-67kg' },
	{ nome: 'Super-Pesado', pesoMax: null, rotuloPeso: '+67kg' }
];

const TABELA_PESOS_SUB13_F: FaixaPesoDef[] = [
	{ nome: 'Extra-Ligeiro', pesoMax: 26.0, rotuloPeso: '-26kg' },
	{ nome: 'Super-Ligeiro', pesoMax: 28.0, rotuloPeso: '-28kg' },
	{ nome: 'Ligeiro', pesoMax: 31.0, rotuloPeso: '-31kg' },
	{ nome: 'Meio-Leve', pesoMax: 34.0, rotuloPeso: '-34kg' },
	{ nome: 'Leve', pesoMax: 38.0, rotuloPeso: '-38kg' },
	{ nome: 'Meio-Médio', pesoMax: 42.0, rotuloPeso: '-42kg' },
	{ nome: 'Médio', pesoMax: 47.0, rotuloPeso: '-47kg' },
	{ nome: 'Meio-Pesado', pesoMax: 52.0, rotuloPeso: '-52kg' },
	{ nome: 'Pesado', pesoMax: 60.0, rotuloPeso: '-60kg' },
	{ nome: 'Super-Pesado', pesoMax: null, rotuloPeso: '+60kg' }
];

const TABELA_PESOS_SUB15_M: FaixaPesoDef[] = [
	{ nome: 'Super-Ligeiro', pesoMax: 36.0, rotuloPeso: '-36kg' },
	{ nome: 'Ligeiro', pesoMax: 40.0, rotuloPeso: '-40kg' },
	{ nome: 'Meio-Leve', pesoMax: 44.0, rotuloPeso: '-44kg' },
	{ nome: 'Leve', pesoMax: 48.0, rotuloPeso: '-48kg' },
	{ nome: 'Meio-Médio', pesoMax: 53.0, rotuloPeso: '-53kg' },
	{ nome: 'Médio', pesoMax: 58.0, rotuloPeso: '-58kg' },
	{ nome: 'Meio-Pesado', pesoMax: 64.0, rotuloPeso: '-64kg' },
	{ nome: 'Pesado', pesoMax: 73.0, rotuloPeso: '-73kg' },
	{ nome: 'Super-Pesado', pesoMax: null, rotuloPeso: '+73kg' }
];

const TABELA_PESOS_SUB15_F: FaixaPesoDef[] = [
	{ nome: 'Super-Ligeiro', pesoMax: 32.0, rotuloPeso: '-32kg' },
	{ nome: 'Ligeiro', pesoMax: 36.0, rotuloPeso: '-36kg' },
	{ nome: 'Meio-Leve', pesoMax: 40.0, rotuloPeso: '-40kg' },
	{ nome: 'Leve', pesoMax: 44.0, rotuloPeso: '-44kg' },
	{ nome: 'Meio-Médio', pesoMax: 48.0, rotuloPeso: '-48kg' },
	{ nome: 'Médio', pesoMax: 53.0, rotuloPeso: '-53kg' },
	{ nome: 'Meio-Pesado', pesoMax: 58.0, rotuloPeso: '-58kg' },
	{ nome: 'Pesado', pesoMax: 64.0, rotuloPeso: '-64kg' },
	{ nome: 'Super-Pesado', pesoMax: null, rotuloPeso: '+64kg' }
];

const TABELA_PESOS_SUB18_M: FaixaPesoDef[] = [
	{ nome: 'Super-Ligeiro', pesoMax: 50.0, rotuloPeso: '-50kg' },
	{ nome: 'Ligeiro', pesoMax: 55.0, rotuloPeso: '-55kg' },
	{ nome: 'Meio-Leve', pesoMax: 60.0, rotuloPeso: '-60kg' },
	{ nome: 'Leve', pesoMax: 66.0, rotuloPeso: '-66kg' },
	{ nome: 'Meio-Médio', pesoMax: 73.0, rotuloPeso: '-73kg' },
	{ nome: 'Médio', pesoMax: 81.0, rotuloPeso: '-81kg' },
	{ nome: 'Meio-Pesado', pesoMax: 90.0, rotuloPeso: '-90kg' },
	{ nome: 'Pesado', pesoMax: null, rotuloPeso: '+90kg' }
];

const TABELA_PESOS_SUB18_F: FaixaPesoDef[] = [
	{ nome: 'Super-Ligeiro', pesoMax: 40.0, rotuloPeso: '-40kg' },
	{ nome: 'Ligeiro', pesoMax: 44.0, rotuloPeso: '-44kg' },
	{ nome: 'Meio-Leve', pesoMax: 48.0, rotuloPeso: '-48kg' },
	{ nome: 'Leve', pesoMax: 52.0, rotuloPeso: '-52kg' },
	{ nome: 'Meio-Médio', pesoMax: 57.0, rotuloPeso: '-57kg' },
	{ nome: 'Médio', pesoMax: 63.0, rotuloPeso: '-63kg' },
	{ nome: 'Meio-Pesado', pesoMax: 70.0, rotuloPeso: '-70kg' },
	{ nome: 'Pesado', pesoMax: null, rotuloPeso: '+70kg' }
];

const TABELA_PESOS_SENIOR_M: FaixaPesoDef[] = [
	{ nome: 'Super-Ligeiro', pesoMax: 55.0, rotuloPeso: '-55kg' },
	{ nome: 'Ligeiro', pesoMax: 60.0, rotuloPeso: '-60kg' },
	{ nome: 'Meio-Leve', pesoMax: 66.0, rotuloPeso: '-66kg' },
	{ nome: 'Leve', pesoMax: 73.0, rotuloPeso: '-73kg' },
	{ nome: 'Meio-Médio', pesoMax: 81.0, rotuloPeso: '-81kg' },
	{ nome: 'Médio', pesoMax: 90.0, rotuloPeso: '-90kg' },
	{ nome: 'Meio-Pesado', pesoMax: 100.0, rotuloPeso: '-100kg' },
	{ nome: 'Pesado', pesoMax: null, rotuloPeso: '+100kg' }
];

const TABELA_PESOS_SENIOR_F: FaixaPesoDef[] = [
	{ nome: 'Super-Ligeiro', pesoMax: 44.0, rotuloPeso: '-44kg' },
	{ nome: 'Ligeiro', pesoMax: 48.0, rotuloPeso: '-48kg' },
	{ nome: 'Meio-Leve', pesoMax: 52.0, rotuloPeso: '-52kg' },
	{ nome: 'Leve', pesoMax: 57.0, rotuloPeso: '-57kg' },
	{ nome: 'Meio-Médio', pesoMax: 63.0, rotuloPeso: '-63kg' },
	{ nome: 'Médio', pesoMax: 70.0, rotuloPeso: '-70kg' },
	{ nome: 'Meio-Pesado', pesoMax: 78.0, rotuloPeso: '-78kg' },
	{ nome: 'Pesado', pesoMax: null, rotuloPeso: '+78kg' }
];

// =============================================================================
// FUNÇÕES DE CÁLCULO
// =============================================================================

/**
 * Calcula a idade competitiva oficial pelo Ano Civil (Ano Vigente - Ano de Nascimento).
 */
export function calcularIdadeCivil(dataNascimento: string | Date, anoVigente?: number): number {
	const anoAtual = anoVigente ?? new Date().getFullYear();
	let anoNasc: number;

	if (typeof dataNascimento === 'string') {
		const match = dataNascimento.match(/^(\d{4})/);
		anoNasc = match ? parseInt(match[1], 10) : new Date(dataNascimento).getFullYear();
	} else {
		anoNasc = dataNascimento.getFullYear();
	}

	if (isNaN(anoNasc) || anoNasc <= 1900) {
		return 0;
	}

	return Math.max(0, anoAtual - anoNasc);
}

/**
 * Identifica a Classe de Idade correspondente à idade civil.
 */
export function obterDefinicaoClasseIdade(idadeCivil: number): ClasseIdadeDef {
	if (idadeCivil < 7) {
		return {
			codigo: 'Festival',
			nomeExibicao: 'Festival / Pré-Judô (menores de 7 anos)',
			idadeMin: 0,
			idadeMax: 6,
			tabelaMasculino: [],
			tabelaFeminino: []
		};
	}
	if (idadeCivil <= 8) {
		return {
			codigo: 'Sub-9',
			nomeExibicao: 'Sub-9 (7-8 anos)',
			idadeMin: 7,
			idadeMax: 8,
			tabelaMasculino: TABELA_PESOS_SUB9_M,
			tabelaFeminino: TABELA_PESOS_SUB9_F
		};
	}
	if (idadeCivil <= 10) {
		return {
			codigo: 'Sub-11',
			nomeExibicao: 'Sub-11 (9-10 anos)',
			idadeMin: 9,
			idadeMax: 10,
			tabelaMasculino: TABELA_PESOS_SUB11_M,
			tabelaFeminino: TABELA_PESOS_SUB11_F
		};
	}
	if (idadeCivil <= 12) {
		return {
			codigo: 'Sub-13',
			nomeExibicao: 'Sub-13 (11-12 anos)',
			idadeMin: 11,
			idadeMax: 12,
			tabelaMasculino: TABELA_PESOS_SUB13_M,
			tabelaFeminino: TABELA_PESOS_SUB13_F
		};
	}
	if (idadeCivil <= 14) {
		return {
			codigo: 'Sub-15',
			nomeExibicao: 'Sub-15 (13-14 anos)',
			idadeMin: 13,
			idadeMax: 14,
			tabelaMasculino: TABELA_PESOS_SUB15_M,
			tabelaFeminino: TABELA_PESOS_SUB15_F
		};
	}
	if (idadeCivil <= 17) {
		return {
			codigo: 'Sub-18',
			nomeExibicao: 'Sub-18 (15-17 anos)',
			idadeMin: 15,
			idadeMax: 17,
			tabelaMasculino: TABELA_PESOS_SUB18_M,
			tabelaFeminino: TABELA_PESOS_SUB18_F
		};
	}
	if (idadeCivil <= 20) {
		return {
			codigo: 'Sub-21',
			nomeExibicao: 'Sub-21 (18-20 anos)',
			idadeMin: 18,
			idadeMax: 20,
			tabelaMasculino: TABELA_PESOS_SENIOR_M,
			tabelaFeminino: TABELA_PESOS_SENIOR_F
		};
	}
	if (idadeCivil <= 29) {
		return {
			codigo: 'Sênior',
			nomeExibicao: 'Sênior (21-29 anos)',
			idadeMin: 21,
			idadeMax: 29,
			tabelaMasculino: TABELA_PESOS_SENIOR_M,
			tabelaFeminino: TABELA_PESOS_SENIOR_F
		};
	}

	// Masters de 5 em 5 anos a partir dos 30 anos
	const faixasMaster = [
		{ cod: 'Master 1', rotulo: 'Master 1 (30-34 anos)', min: 30, max: 34 },
		{ cod: 'Master 2', rotulo: 'Master 2 (35-39 anos)', min: 35, max: 39 },
		{ cod: 'Master 3', rotulo: 'Master 3 (40-44 anos)', min: 40, max: 44 },
		{ cod: 'Master 4', rotulo: 'Master 4 (45-49 anos)', min: 45, max: 49 },
		{ cod: 'Master 5', rotulo: 'Master 5 (50-54 anos)', min: 50, max: 54 },
		{ cod: 'Master 6', rotulo: 'Master 6 (55-59 anos)', min: 55, max: 59 },
		{ cod: 'Master 7', rotulo: 'Master 7 (60-64 anos)', min: 60, max: 64 },
		{ cod: 'Master 8+', rotulo: 'Master 8+ (65+ anos)', min: 65, max: 120 }
	];

	for (const m of faixasMaster) {
		if (idadeCivil >= m.min && idadeCivil <= m.max) {
			return {
				codigo: m.cod,
				nomeExibicao: m.rotulo,
				idadeMin: m.min,
				idadeMax: m.max,
				isMaster: true,
				tabelaMasculino: TABELA_PESOS_SENIOR_M,
				tabelaFeminino: TABELA_PESOS_SENIOR_F
			};
		}
	}

	return {
		codigo: 'Master 8+',
		nomeExibicao: 'Master 8+ (65+ anos)',
		idadeMin: 65,
		idadeMax: 120,
		isMaster: true,
		tabelaMasculino: TABELA_PESOS_SENIOR_M,
		tabelaFeminino: TABELA_PESOS_SENIOR_F
	};
}

/**
 * Determina a Divisão com base na graduação (Faixa).
 * Aspirante: Branca até Verde (até 3º Kyu).
 * Especial: Roxa até Preta/Dan (2º Kyu em diante).
 */
export function calcularDivisao(graduacao: string | null | undefined): DivisaoJudo {
	if (!graduacao) return 'Aspirante';

	const g = graduacao.trim().toLowerCase();

	// Faixas de Alto Rendimento / Divisão Especial
	if (
		g.includes('roxa') ||
		g.includes('marrom') ||
		g.includes('preta') ||
		g.includes('dan') ||
		g.includes('coral') ||
		g.includes('vermelha')
	) {
		return 'Especial';
	}

	// Branca, Cinza, Azul, Amarela, Laranja, Verde -> Aspirante
	return 'Aspirante';
}

/**
 * Encontra a faixa de peso de acordo com o peso do atleta e o gênero.
 */
export function encontrarFaixaPeso(
	tabela: FaixaPesoDef[],
	pesoNum: number
): { nome: string; rotuloPeso: string } {
	if (!tabela || tabela.length === 0) {
		return { nome: 'Geral', rotuloPeso: '' };
	}

	// Compara em ordem crescente de peso máximo
	for (const faixa of tabela) {
		if (faixa.pesoMax === null) {
			return { nome: faixa.nome, rotuloPeso: faixa.rotuloPeso };
		}
		if (pesoNum <= faixa.pesoMax) {
			return { nome: faixa.nome, rotuloPeso: faixa.rotuloPeso };
		}
	}

	// Se ultrapassar todos os pesos limite, é a última faixa
	const ultima = tabela[tabela.length - 1];
	return { nome: ultima.nome, rotuloPeso: ultima.rotuloPeso };
}

/**
 * Orquestrador principal: calcula a classificação completa do atleta.
 */
export function obterClassificacaoJudo(params: {
	dataNascimento: string | Date;
	genero?: string | null;
	peso?: number | string | null;
	graduacao?: string | null;
	anoVigente?: number;
}): ClassificacaoJudoResultado {
	const idadeCivil = calcularIdadeCivil(params.dataNascimento, params.anoVigente);
	const classeDef = obterDefinicaoClasseIdade(idadeCivil);

	const generoNorm: GeneroJudo = params.genero === 'F' ? 'F' : 'M';
	const divisao = calcularDivisao(params.graduacao);
	const avisos: string[] = [];

	// Menores de 7 anos -> Festival
	if (classeDef.codigo === 'Festival') {
		return {
			idadeCivil,
			classeCodigo: 'Festival',
			classeNome: classeDef.nomeExibicao,
			categoriaNome: 'Festival / Pré-Judô',
			limitePesoRotulo: '',
			categoriaCompleta: 'Festival / Pré-Judô',
			divisao: 'Aspirante',
			divisaoSugerida: 'Aspirante',
			mensagensAviso: ['Atleta com menos de 7 anos enquadrado em Festival / Apresentação sem pesagem competitiva rígida.']
		};
	}

	const pesoNum =
		typeof params.peso === 'number'
			? params.peso
			: typeof params.peso === 'string' && params.peso.trim() !== ''
				? parseFloat(params.peso.replace(',', '.'))
				: null;

	if (pesoNum === null || isNaN(pesoNum) || pesoNum <= 0) {
		return {
			idadeCivil,
			classeCodigo: classeDef.codigo,
			classeNome: classeDef.nomeExibicao,
			categoriaNome: 'Pendente de Pesagem',
			limitePesoRotulo: '',
			categoriaCompleta: `${classeDef.codigo} (Informe o peso)`,
			divisao,
			divisaoSugerida: divisao,
			mensagensAviso: ['Informe o peso do judoca para definir a categoria exata.']
		};
	}

	const tabela = generoNorm === 'F' ? classeDef.tabelaFeminino : classeDef.tabelaMasculino;
	const { nome: categoriaNome, rotuloPeso } = encontrarFaixaPeso(tabela, pesoNum);

	const categoriaCompleta = `${classeDef.codigo} ${categoriaNome} (${rotuloPeso})`;

	// Validação de regras especiais
	if (idadeCivil < 18) {
		// Tolerância oficial de pesagem para menores
		avisos.push('Atleta menor de 18 anos possui tolerância regulamentar de 200g em pesagens oficiais da CBJ.');
	}

	return {
		idadeCivil,
		classeCodigo: classeDef.codigo,
		classeNome: classeDef.nomeExibicao,
		categoriaNome,
		limitePesoRotulo: rotuloPeso,
		categoriaCompleta,
		divisao,
		divisaoSugerida: divisao,
		mensagensAviso: avisos
	};
}
