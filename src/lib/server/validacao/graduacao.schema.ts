import { z } from 'zod';

const regexData = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema Zod para homologação de exame e troca de faixa de Judô
 */
export const graduacaoSchema = z.object({
	idAluno: z.coerce
		.number()
		.int()
		.positive({ message: 'Selecione o judoca a ser promovido' }),
	novaFaixa: z
		.string()
		.trim()
		.min(1, { message: 'Selecione a nova faixa do judoca' }),
	idProfessorHomologador: z.coerce
		.number()
		.int()
		.positive({ message: 'Selecione o sensei responsável pela homologação' }),
	dataGraduacao: z
		.string()
		.trim()
		.regex(regexData, { message: 'Data de exame inválida (utilize AAAA-MM-DD)' }),
	associacao: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || 'FPJ / Federação Paulista de Judô'),
	nomeEvento: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || 'Cerimônia Oficial de Troca de Faixas')
});

export type GraduacaoInput = z.infer<typeof graduacaoSchema>;
