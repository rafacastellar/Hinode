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
	formatarIdadeLimite
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
	if (idxAtleta > idxFim) {
		const faixaMaxNome = dados.faixaFim || 'Preta';
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
