import { obterIndiceFaixa, formatarIntervaloFaixas } from '#lib/dominio/campeonato';

export const FAIXAS_SEQUENCIA_OFICIAL = [
	'Branca',
	'Cinza',
	'Azul',
	'Amarela',
	'Laranja',
	'Verde',
	'Roxa',
	'Marrom',
	'Preta (1º Dan)',
	'Preta (2º Dan)',
	'Preta (3º Dan)',
	'Preta (4º Dan)',
	'Preta (5º Dan)'
] as const;

/**
 * Retorna a próxima faixa sugerida conforme a tradição e progressão do judô.
 */
export function obterProximaFaixa(faixaAtual?: string | null): string {
	if (!faixaAtual) return 'Cinza';
	const normalizada = faixaAtual.toLowerCase().trim();

	if (normalizada.includes('branca')) return 'Cinza';
	if (normalizada.includes('cinza')) return 'Azul';
	if (normalizada.includes('azul')) return 'Amarela';
	if (normalizada.includes('amarela')) return 'Laranja';
	if (normalizada.includes('laranja')) return 'Verde';
	if (normalizada.includes('verde')) return 'Roxa';
	if (normalizada.includes('roxa')) return 'Marrom';
	if (normalizada.includes('marrom')) return 'Preta (1º Dan)';
	if (normalizada.includes('1º dan') || normalizada.includes('1o dan')) return 'Preta (2º Dan)';
	if (normalizada.includes('2º dan') || normalizada.includes('2o dan')) return 'Preta (3º Dan)';
	if (normalizada.includes('3º dan') || normalizada.includes('3o dan')) return 'Preta (4º Dan)';
	if (normalizada.includes('4º dan') || normalizada.includes('4o dan')) return 'Preta (5º Dan)';

	return 'Preta (1º Dan)';
}

/**
 * Calcula a quantidade de meses completos decorridos entre duas datas no formato ISO (AAAA-MM-DD).
 */
export function calcularMesesDecorridos(dataInicioIso: string, dataFimIso: string): number {
	if (!dataInicioIso || !dataFimIso) return 0;

	const dInicio = new Date(dataInicioIso + 'T00:00:00');
	const dFim = new Date(dataFimIso + 'T00:00:00');

	if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime()) || dFim < dInicio) {
		return 0;
	}

	const anos = dFim.getFullYear() - dInicio.getFullYear();
	const meses = dFim.getMonth() - dInicio.getMonth();
	const dias = dFim.getDate() - dInicio.getDate();

	let totalMeses = anos * 12 + meses;
	if (dias < 0) {
		totalMeses -= 1;
	}

	return Math.max(0, totalMeses);
}

function obterDataHojeIso(): string {
	const agora = new Date();
	const ano = agora.getFullYear();
	const mes = String(agora.getMonth() + 1).padStart(2, '0');
	const dia = String(agora.getDate()).padStart(2, '0');
	return `${ano}-${mes}-${dia}`;
}

export function formatarDataIsoParaBr(dataIso?: string | null): string {
	if (!dataIso) return '';
	if (dataIso.includes('/')) return dataIso;
	const partes = dataIso.split('-');
	if (partes.length !== 3) return dataIso;
	const [ano, mes, dia] = partes;
	return `${dia}/${mes}/${ano}`;
}

export interface ValidacaoElegibilidadeGraduacaoInput {
	faixaAtleta: string;
	faixaInicioEvento: string;
	faixaFimEvento: string;
	dataInicioJudoAtleta?: string | null;
	dataUltimaGraduacaoAtleta?: string | null;
	dataPrimeiraGraduacaoAtleta?: string | null;
	tempoMinimoJudoMeses?: number | null;
	tempoMinimoUltimaGraduacaoMeses?: number | null;
	dataEventoIso: string;
}

export interface ResultadoElegibilidadeGraduacao {
	elegivel: boolean;
	motivo?: string;
	proximaFaixa: string;
	mesesJudo: number;
	mesesUltimaGraduacao: number;
}

/**
 * Valida a elegibilidade pedagógica e técnica do judoca para o Exame de Graduação.
 */
export function validarElegibilidadeGraduacao(
	dados: ValidacaoElegibilidadeGraduacaoInput
): ResultadoElegibilidadeGraduacao {
	const proximaFaixa = obterProximaFaixa(dados.faixaAtleta);
	const dataReferencia = dados.dataEventoIso || obterDataHojeIso();

	// 1. Validação de Intervalo de Faixas
	const idxAtleta = obterIndiceFaixa(dados.faixaAtleta);
	const idxInicio = obterIndiceFaixa(dados.faixaInicioEvento);
	const idxFim = obterIndiceFaixa(dados.faixaFimEvento);

	if (idxAtleta < idxInicio || idxAtleta > idxFim) {
		return {
			elegivel: false,
			motivo: `Graduação atual (${dados.faixaAtleta}) fora do intervalo permitido para este exame (${formatarIntervaloFaixas(dados.faixaInicioEvento, dados.faixaFimEvento)}).`,
			proximaFaixa,
			mesesJudo: 0,
			mesesUltimaGraduacao: 0
		};
	}

	// 2. Tempo de Início no Judô (Carência no esporte)
	const dataInicioJudo = dados.dataInicioJudoAtleta || dados.dataPrimeiraGraduacaoAtleta || dados.dataUltimaGraduacaoAtleta;
	let mesesJudo = 0;
	if (dataInicioJudo) {
		mesesJudo = calcularMesesDecorridos(dataInicioJudo, dataReferencia);
	}

	const tempoMinimoJudo = Number(dados.tempoMinimoJudoMeses || 0);
	if (tempoMinimoJudo > 0 && mesesJudo < tempoMinimoJudo) {
		return {
			elegivel: false,
			motivo: `Tempo mínimo no judô não atingido: exige ${tempoMinimoJudo} meses de prática (atleta possui ${mesesJudo} ${mesesJudo === 1 ? 'mês' : 'meses'}).`,
			proximaFaixa,
			mesesJudo,
			mesesUltimaGraduacao: 0
		};
	}

	// 3. Tempo desde a Última Graduação (Carência na faixa atual)
	const dataUltimaGrad = dados.dataUltimaGraduacaoAtleta || dados.dataPrimeiraGraduacaoAtleta || dados.dataInicioJudoAtleta;
	let mesesUltimaGrad = 0;
	if (dataUltimaGrad) {
		mesesUltimaGrad = calcularMesesDecorridos(dataUltimaGrad, dataReferencia);
	}

	const tempoMinimoUltima = Number(dados.tempoMinimoUltimaGraduacaoMeses || 0);
	if (tempoMinimoUltima > 0 && mesesUltimaGrad < tempoMinimoUltima) {
		return {
			elegivel: false,
			motivo: `Carência na graduação atual não atingida: exige ${tempoMinimoUltima} meses nesta faixa (atleta possui ${mesesUltimaGrad} ${mesesUltimaGrad === 1 ? 'mês' : 'meses'}).`,
			proximaFaixa,
			mesesJudo,
			mesesUltimaGraduacao: mesesUltimaGrad
		};
	}

	return {
		elegivel: true,
		proximaFaixa,
		mesesJudo,
		mesesUltimaGraduacao: mesesUltimaGrad
	};
}

/**
 * Validação do período oficial de inscrições do evento de graduação.
 */
export function validarPeriodoInscricaoGraduacao(
	dataInicioInscricaoIso?: string | null,
	dataFimInscricaoIso?: string | null
): { aberta: boolean; motivo?: string } {
	const hoje = obterDataHojeIso();

	if (dataInicioInscricaoIso) {
		const inicio = dataInicioInscricaoIso.includes('/')
			? dataInicioInscricaoIso.split('/').reverse().join('-')
			: dataInicioInscricaoIso;
		if (hoje < inicio) {
			return {
				aberta: false,
				motivo: `As inscrições para este exame de graduação abrem em ${formatarDataIsoParaBr(inicio)}.`
			};
		}
	}

	if (dataFimInscricaoIso) {
		const fim = dataFimInscricaoIso.includes('/')
			? dataFimInscricaoIso.split('/').reverse().join('-')
			: dataFimInscricaoIso;
		if (hoje > fim) {
			return {
				aberta: false,
				motivo: `O período de inscrições para este exame encerrou em ${formatarDataIsoParaBr(fim)}. Inscrições tardias não são aceitas.`
			};
		}
	}

	return { aberta: true };
}

/**
 * Rótulo amigável para exibição do período de inscrições nos cards e detalhes.
 */
export function formatarPeriodoInscricaoGraduacao(
	dataInicioInscricao?: string | null,
	dataFimInscricao?: string | null
): string {
	const inicioBr = formatarDataIsoParaBr(dataInicioInscricao);
	const fimBr = formatarDataIsoParaBr(dataFimInscricao);

	if (inicioBr && fimBr) {
		return `${inicioBr} até ${fimBr}`;
	}
	if (fimBr) {
		return `Até ${fimBr}`;
	}
	if (inicioBr) {
		return `A partir de ${inicioBr}`;
	}
	return 'Aberto sem prazo limite';
}
