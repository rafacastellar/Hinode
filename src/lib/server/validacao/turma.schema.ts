import { z } from 'zod';

const regexHora = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Schema Zod para criação e edição de Turmas/Treinos de Judô
 */
export const turmaSchema = z
	.object({
		descricao: z
			.string()
			.trim()
			.min(3, { message: 'Descrição da turma deve ter no mínimo 3 caracteres' })
			.max(255, { message: 'Descrição muito longa' }),
		diaSemana: z
			.string()
			.trim()
			.min(2, { message: 'Selecione o(s) dia(s) da semana da turma' }),
		horarioInicio: z
			.string()
			.trim()
			.regex(regexHora, { message: 'Horário de início inválido (utilize HH:MM)' }),
		horarioFim: z
			.string()
			.trim()
			.regex(regexHora, { message: 'Horário de término inválido (utilize HH:MM)' }),
		professoresIds: z.any().transform((val) => {
			if (!val) return [];
			if (Array.isArray(val)) {
				return val.map((v) => Number(v)).filter((n) => !isNaN(n) && n > 0);
			}
			const num = Number(val);
			return !isNaN(num) && num > 0 ? [num] : [];
		})
	})
	.refine(
		(dados) => {
			// Normaliza para comparação simples HH:MM
			const inicio = dados.horarioInicio.slice(0, 5);
			const fim = dados.horarioFim.slice(0, 5);
			return fim > inicio;
		},
		{
			message: 'O horário de término deve ser posterior ao horário de início',
			path: ['horarioFim']
		}
	)
	.refine(
		(dados) => dados.professoresIds.length > 0,
		{
			message: 'Selecione ao menos um sensei/professor responsável pela turma',
			path: ['professoresIds']
		}
	);

export type TurmaInput = z.infer<typeof turmaSchema>;
