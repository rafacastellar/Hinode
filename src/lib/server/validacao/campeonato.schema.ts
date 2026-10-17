import { z } from 'zod';
import { formatarIntervaloFaixas, obterIndiceFaixa } from '../servicos/regras-campeonato';

const regexData = /^\d{4}-\d{2}-\d{2}$/;

function parseNumeroOpcional(val: unknown): number | null {
	if (val === undefined || val === null || val === '') return null;
	const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
	return isNaN(num) ? null : num;
}

function parseDecimalOpcional(val: unknown): number {
	if (val === undefined || val === null || val === '') return 0;
	const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
	return isNaN(num) || num < 0 ? 0 : num;
}

/**
 * Schema Zod para criação e edição de Campeonatos e Torneios de Judô
 */
export const campeonatoSchema = z
	.object({
		nome: z
			.string()
			.trim()
			.min(3, { message: 'Nome do campeonato deve ter no mínimo 3 caracteres' })
			.max(255, { message: 'Nome muito longo' }),
		edicao: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || '1ª Edição'),
		tipoCampeonato: z
			.string()
			.trim()
			.min(1, { message: 'Selecione o tipo de campeonato' }),
		dataInicio: z
			.string()
			.trim()
			.regex(regexData, { message: 'Data do evento inválida (utilize AAAA-MM-DD)' }),
		dataInicioInscricao: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || null)
			.refine((val) => !val || regexData.test(val), {
				message: 'Data de início das inscrições inválida (utilize AAAA-MM-DD)'
			}),
		dataFimInscricao: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || null)
			.refine((val) => !val || regexData.test(val), {
				message: 'Data final das inscrições inválida (utilize AAAA-MM-DD)'
			}),
		faixaInicio: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || 'Branca'),
		faixaFim: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || 'Preta'),
		limiteGraduacao: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || null),
		limiteGrupo: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || 'Todos'),
		idadeMinima: z.any().transform(parseNumeroOpcional),
		idadeMaxima: z.any().transform(parseNumeroOpcional),
		valorInscricao: z.any().transform(parseDecimalOpcional),
		cidade: z
			.string()
			.trim()
			.min(2, { message: 'Informe a cidade de realização' }),
		uf: z
			.string()
			.trim()
			.length(2, { message: 'UF deve ter exatamente 2 letras' })
			.toUpperCase(),
		logradouro: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || 'Ginásio Principal'),
		numero: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || 'S/N'),
		complemento: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || null),
		bairro: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || null),
		cep: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || '01000-000')
	})
	.refine(
		(dados) => {
			const idxInicio = obterIndiceFaixa(dados.faixaInicio);
			const idxFim = obterIndiceFaixa(dados.faixaFim);
			return idxInicio <= idxFim;
		},
		{
			message: 'A faixa inicial não pode ser superior à faixa final',
			path: ['faixaInicio']
		}
	)
	.refine(
		(dados) => {
			if (dados.idadeMinima && dados.idadeMaxima) {
				return dados.idadeMinima <= dados.idadeMaxima;
			}
			return true;
		},
		{
			message: 'A idade mínima não pode ser maior do que a idade máxima',
			path: ['idadeMinima']
		}
	)
	.refine(
		(dados) => {
			if (dados.dataInicioInscricao && dados.dataFimInscricao) {
				return dados.dataInicioInscricao <= dados.dataFimInscricao;
			}
			return true;
		},
		{
			message: 'A data de início das inscrições não pode ser posterior à data de término',
			path: ['dataInicioInscricao']
		}
	)
	.refine(
		(dados) => {
			if (dados.dataFimInscricao && dados.dataInicio) {
				return dados.dataFimInscricao <= dados.dataInicio;
			}
			return true;
		},
		{
			message: 'A data limite de inscrição não pode ser posterior à data de início do campeonato',
			path: ['dataFimInscricao']
		}
	)
	.transform((dados) => {
		// Gera automaticamente o rótulo textual de limiteGraduacao se não fornecido
		const limiteGraduacao =
			dados.limiteGraduacao || formatarIntervaloFaixas(dados.faixaInicio, dados.faixaFim);
		return {
			...dados,
			limiteGraduacao
		};
	});

export type CampeonatoInput = z.infer<typeof campeonatoSchema>;

/**
 * Schema Zod para inscrição mista (Atleta ou Professor competidor)
 */
export const inscricaoSchema = z.object({
	idEvento: z.coerce.number().int().positive({ message: 'Evento inválido' }),
	tipoParticipante: z.enum(['aluno', 'professor'], {
		error: 'Tipo de participante deve ser aluno ou professor'
	}),
	idParticipante: z.coerce.number().int().positive({ message: 'Selecione o participante' }),
	valor: z.any().transform((val) => {
		if (val === undefined || val === null || val === '') return null;
		const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
		return isNaN(num) ? null : num;
	}),
	statusInscricao: z.enum(['Pendente', 'Confirmada', 'Cancelada']).default('Pendente')
});

export type InscricaoInput = z.infer<typeof inscricaoSchema>;

/**
 * Schema Zod para registro de desempenho e classificação pós-campeonato
 */
export const resultadoSchema = z
	.object({
		idCampeonato: z.coerce.number().int().positive({ message: 'Campeonato inválido' }),
		idAluno: z.coerce.number().int().positive({ message: 'Selecione o atleta' }),
		classificacaoAluno: z
			.string()
			.trim()
			.min(1, { message: 'Informe a classificação final do atleta' }),
		qtdLutas: z.coerce
			.number()
			.int()
			.min(0, { message: 'Quantidade de lutas não pode ser negativa' }),
		qtdVitorias: z.coerce
			.number()
			.int()
			.min(0, { message: 'Quantidade de vitórias não pode ser negativa' })
	})
	.refine((dados) => dados.qtdVitorias <= dados.qtdLutas, {
		message: 'O número de vitórias não pode exceder o número total de lutas disputadas',
		path: ['qtdVitorias']
	});

export type ResultadoInput = z.infer<typeof resultadoSchema>;
