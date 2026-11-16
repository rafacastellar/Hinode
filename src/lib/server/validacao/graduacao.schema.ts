import { z } from 'zod';
import { obterIndiceFaixa } from '#lib/dominio/campeonato';

const regexData = /^\d{4}-\d{2}-\d{2}$/;

function parseNumeroOpcional(val: unknown): number | null {
	if (val === undefined || val === null || val === '') return 0;
	const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
	return isNaN(num) || num < 0 ? 0 : num;
}

function parseDecimalOpcional(val: unknown): number {
	if (val === undefined || val === null || val === '') return 0;
	const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
	return isNaN(num) || num < 0 ? 0 : num;
}

/**
 * Schema Zod para criação e edição de Eventos/Exames de Graduação de Judô
 */
export const eventoGraduacaoSchema = z
	.object({
		nome: z
			.string()
			.trim()
			.min(3, { message: 'Nome da graduação deve ter no mínimo 3 caracteres' })
			.max(255, { message: 'Nome muito longo' }),
		edicao: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || 'Edição 2026'),
		tipoGraduacao: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || 'Troca de Faixa'),
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
			.transform((val) => val || 'Marrom'),
		tempoMinimoJudoMeses: z.any().transform(parseNumeroOpcional),
		tempoMinimoUltimaGraduacaoMeses: z.any().transform(parseNumeroOpcional),
		percentualMinimoPresenca: z.any().transform((val) => {
			if (val === undefined || val === null || val === '') return 0;
			const n = typeof val === 'string' ? parseInt(val, 10) : Number(val);
			return isNaN(n) || n < 0 ? 0 : Math.min(100, n);
		}),
		qtdMinimaAulasPresentes: z.any().transform((val) => {
			if (val === undefined || val === null || val === '') return 0;
			const n = typeof val === 'string' ? parseInt(val, 10) : Number(val);
			return isNaN(n) || n < 0 ? 0 : n;
		}),
		taxaGraduacao: z.any().transform(parseDecimalOpcional),
		requisitos: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || null),
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
			.transform((val) => val || 'Dojo Central'),
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
			if (dados.dataInicioInscricao && dados.dataFimInscricao) {
				return dados.dataInicioInscricao <= dados.dataFimInscricao;
			}
			return true;
		},
		{
			message: 'A data de início das inscrições não pode ser posterior ao prazo final',
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
			message: 'O prazo de inscrições deve encerrar antes ou na data do exame',
			path: ['dataFimInscricao']
		}
	);

export type EventoGraduacaoInput = z.infer<typeof eventoGraduacaoSchema>;

/**
 * Schema para inscrição / convocação de atleta em um evento de graduação
 */
export const inscricaoGraduacaoSchema = z.object({
	idEvento: z.coerce.number().int().positive({ message: 'Evento inválido' }),
	idAluno: z.coerce.number().int().positive({ message: 'Selecione o judoca' }),
	novaFaixa: z.string().trim().nullish().transform((val) => val || null),
	valor: z.any().transform(parseDecimalOpcional)
});

export type InscricaoGraduacaoInput = z.infer<typeof inscricaoGraduacaoSchema>;

/**
 * Schema para homologação do exame de faixa no tatame
 */
export const homologacaoEventoSchema = z.object({
	idEvento: z.coerce.number().int().positive({ message: 'Evento inválido' }),
	idInscricao: z.coerce.number().int().optional(),
	idAluno: z.coerce.number().int().positive({ message: 'Selecione o judoca' }),
	novaFaixa: z.string().trim().min(1, { message: 'Selecione a nova graduação' }),
	idProfessorHomologador: z.coerce
		.number()
		.int()
		.positive({ message: 'Selecione o sensei examinador' }),
	dataGraduacao: z
		.string()
		.trim()
		.regex(regexData, { message: 'Data de homologação inválida (utilize AAAA-MM-DD)' }),
	associacao: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || 'FPJ / Federação Paulista de Judô')
});

export type HomologacaoEventoInput = z.infer<typeof homologacaoEventoSchema>;

/**
 * Schema para registro de graduação avulsa, promoção direta, acervo histórico pré-sistema
 * ou histórico de transferência vindo de outra academia (sem criar eventos fantasmas).
 */
export const graduacaoSchema = z
	.object({
		idAluno: z.coerce
			.number()
			.int()
			.positive({ message: 'Selecione o judoca' }),
		novaFaixa: z
			.string()
			.trim()
			.min(1, { message: 'Selecione a faixa a ser registrada' }),
		origemRegistro: z
			.enum(['EXAME_DOJO', 'PROMOCAO_DIRETA', 'HISTORICO_ANTERIOR', 'TRANSFERENCIA'])
			.nullish()
			.transform((val) => val || 'PROMOCAO_DIRETA'),
		idProfessorHomologador: z
			.any()
			.transform((val) => {
				if (val === undefined || val === null || val === '' || val === '0' || val === 'externo') {
					return null;
				}
				const n = Number(val);
				return isNaN(n) || n <= 0 ? null : n;
			}),
		nomeExaminadorExterno: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val ? val.slice(0, 255) : null)),
		dataGraduacao: z
			.string()
			.trim()
			.regex(regexData, { message: 'Data de graduação inválida (utilize AAAA-MM-DD)' }),
		associacao: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || 'FPJ / Federação Paulista de Judô'),
		nomeEvento: z
			.string()
			.trim()
			.nullish()
			.transform((val) => val || null),
		atualizarFaixaAtual: z
			.any()
			.optional()
			.transform((val) => {
				if (val === undefined || val === null || val === '') return undefined;
				if (val === true || val === 'true' || val === '1' || val === 'on') return true;
				if (val === false || val === 'false' || val === '0') return false;
				return undefined;
			})
	})
	.refine(
		(dados) => {
			if (dados.origemRegistro === 'PROMOCAO_DIRETA' || dados.origemRegistro === 'EXAME_DOJO') {
				return Boolean(dados.idProfessorHomologador);
			}
			return Boolean(dados.idProfessorHomologador || dados.nomeExaminadorExterno);
		},
		{
			message:
				'Selecione um Sensei do dojo ou informe o nome do Sensei / Banca examinadora de origem',
			path: ['idProfessorHomologador']
		}
	);

export type GraduacaoInput = z.infer<typeof graduacaoSchema>;

/**
 * Schema para importação/lançamento em lote de histórico pregresso de faixas de um judoca
 */
export const loteHistoricoAlunoSchema = z.object({
	idAluno: z.coerce.number().int().positive({ message: 'Judoca inválido' }),
	origemRegistro: z
		.enum(['HISTORICO_ANTERIOR', 'TRANSFERENCIA', 'PROMOCAO_DIRETA'])
		.default('HISTORICO_ANTERIOR'),
	idProfessorHomologador: z
		.any()
		.transform((val) => {
			if (val === undefined || val === null || val === '' || val === '0' || val === 'externo') {
				return null;
			}
			const n = Number(val);
			return isNaN(n) || n <= 0 ? null : n;
		}),
	nomeExaminadorExterno: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val ? val.slice(0, 255) : null)),
	associacaoPadrao: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || 'FPJ / CBJ'),
	descricaoOrigemPadrao: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || null),
	etapas: z
		.array(
			z.object({
				faixa: z.string().trim().min(1, { message: 'Informe a faixa da etapa' }),
				dataGraduacao: z
					.string()
					.trim()
					.regex(regexData, { message: 'Informe uma data válida (AAAA-MM-DD) para cada faixa' }),
				associacao: z
					.string()
					.trim()
					.nullish()
					.transform((val) => val || null),
				descricaoOrigem: z
					.string()
					.trim()
					.nullish()
					.transform((val) => val || null),
				nomeExaminadorExterno: z
					.string()
					.trim()
					.nullish()
					.transform((val) => val || null)
			})
		)
		.min(1, { message: 'Adicione pelo menos uma faixa com data para registrar no histórico' })
});

export type LoteHistoricoAlunoInput = z.infer<typeof loteHistoricoAlunoSchema>;
