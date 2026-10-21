/**
 * Regras de Negócio e Elegibilidade para Campeonatos de Judô
 * Judô Hinodê SaaS
 */

export {
	FAIXAS_JUDO_LISTA,
	type FaixaJudo,
	FAIXAS_JUDO_ORDEM,
	obterIndiceFaixa,
	formatarIntervaloFaixas,
	formatarIdadeLimite,
	SUGESTOES_CLASSIFICACAO_ACADEMIA,
	correspondeClassificacaoAcademia,
	ehPodioOuCampeao,
	normalizarTexto
} from '../../dominio/campeonato';
import {
	obterIndiceFaixa,
	formatarIntervaloFaixas,
	formatarIdadeLimite
} from '../../dominio/campeonato';

export const OPCOES_LIMITE_GRUPO = [
	{ valor: 'Todos', rotulo: 'Todos / Livre', descricao: 'Aberto para atletas do grupo Especial e Aspirante' },
	{ valor: 'Especial', rotulo: 'Apenas Especial', descricao: 'Exclusivo para judocas federados de alto rendimento' },
	{ valor: 'Aspirante', rotulo: 'Apenas Aspirante', descricao: 'Exclusivo para atletas do circuito escolar / aspirante' }
] as const;

export interface ResultadoElegibilidade {
	elegivel: boolean;
	motivo?: string;
}

/**
 * Validação completa de elegibilidade considerando:
 * 1. Intervalo de Faixa (Faixa Inicial <= Faixa Atleta <= Faixa Final)
 * 2. Idade Mínima e Máxima (se definidas)
 * 3. Categoria de Grupo (Especial, Aspirante ou Todos)
 */
export function validarElegibilidadeCompleta(dados: {
	faixaInicio?: string | null;
	faixaFim?: string | null;
	limiteGrupo?: string | null;
	idadeMinima?: number | null;
	idadeMaxima?: number | null;
	faixaAtleta?: string | null;
	grupoAtleta?: string | null;
	idadeAtleta?: number | null;
}): ResultadoElegibilidade {
	const idxInicio = obterIndiceFaixa(dados.faixaInicio || 'Branca');
	const idxFim = obterIndiceFaixa(dados.faixaFim || 'Preta');
	const idxAtleta = obterIndiceFaixa(dados.faixaAtleta);
	const faixaNome = dados.faixaAtleta || 'Faixa Branca';

	// 1. Validação de Intervalo de Faixa
	if (idxAtleta < idxInicio) {
		const faixaMinNome = dados.faixaInicio || 'Branca';
		return {
			elegivel: false,
			motivo: `Faixa ${faixaNome} está abaixo da faixa mínima permitida (${faixaMinNome}).`
		};
	}
	const tetoEfetivo = idxFim === 8 ? 10 : idxFim;
	if (idxAtleta > tetoEfetivo) {
		const faixaMaxNome = dados.faixaFim || 'Vermelha';
		return {
			elegivel: false,
			motivo: `Faixa ${faixaNome} está acima da faixa máxima permitida (${faixaMaxNome}).`
		};
	}

	// 2. Validação de Idade (se definida)
	if (dados.idadeAtleta !== undefined && dados.idadeAtleta !== null) {
		const idade = dados.idadeAtleta;
		if (dados.idadeMinima && idade < dados.idadeMinima) {
			return {
				elegivel: false,
				motivo: `Idade (${idade} anos) está abaixo da idade mínima exigida (${dados.idadeMinima} anos).`
			};
		}
		if (dados.idadeMaxima && idade > dados.idadeMaxima) {
			return {
				elegivel: false,
				motivo: `Idade (${idade} anos) excede a idade máxima permitida (${dados.idadeMaxima} anos).`
			};
		}
	}

	// 3. Validação de Categoria (Grupo Especial / Aspirante)
	const grupoRegra = (dados.limiteGrupo || 'Todos').trim();
	if (grupoRegra.toLowerCase() !== 'todos') {
		const grupoAtletaNorm = (dados.grupoAtleta || '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim();

		if (grupoRegra.toLowerCase() === 'especial' && !grupoAtletaNorm.includes('especial')) {
			return {
				elegivel: false,
				motivo: `Campeonato exclusivo para a categoria Especial (Atleta registrado como: ${dados.grupoAtleta || 'Sem categoria'}).`
			};
		}

		if (grupoRegra.toLowerCase() === 'aspirante' && !grupoAtletaNorm.includes('aspirante')) {
			return {
				elegivel: false,
				motivo: `Campeonato exclusivo para a categoria Aspirante (Atleta registrado como: ${dados.grupoAtleta || 'Sem categoria'}).`
			};
		}
	}

	return { elegivel: true };
}

/**
 * Determina se a inscrição atinge o status de 'Confirmada' conforme a regra:
 * O atleta confirma sua participação e, se menor de idade (< 18 anos), o responsável legal também deve confirmar.
 */
export function determinarStatusInscricao(
	confirmadoAtleta: boolean,
	menorIdade: boolean,
	confirmadoResponsavel: boolean
): 'Pendente' | 'Confirmada' {
	if (!confirmadoAtleta) {
		return 'Pendente';
	}
	if (menorIdade && !confirmadoResponsavel) {
		return 'Pendente';
	}
	return 'Confirmada';
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

/**
 * Validação do período oficial de inscrições do campeonato:
 * Retorna se as inscrições estão abertas ou bloqueadas por data anterior à abertura ou após o prazo limite.
 */
export function validarPeriodoInscricao(
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
				motivo: `As inscrições para este campeonato ainda não foram abertas (abertura em ${formatarDataIsoParaBr(inicio)}).`
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
				motivo: `O período de inscrições para este campeonato encerrou em ${formatarDataIsoParaBr(fim)}. Inscrições tardias não são aceitas.`
			};
		}
	}

	return { aberta: true };
}

/**
 * Rótulo amigável do período de inscrições para visualização no dashboard e lista.
 */
export function formatarPeriodoInscricao(
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
