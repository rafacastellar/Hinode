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
		capacidadeMaxima: z.any().transform((val) => {
			if (val === undefined || val === null || val === '') return 25;
			const n = typeof val === 'string' ? parseInt(val, 10) : Number(val);
			return isNaN(n) || n < 1 ? 25 : Math.min(500, n);
		}),
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

export const statusPresencaEnum = z.enum(['Presente', 'Falta', 'Justificada']);
export type StatusPresenca = z.infer<typeof statusPresencaEnum>;

export const itemChamadaSchema = z.object({
	idAluno: z.number().int().positive(),
	status: statusPresencaEnum,
	observacao: z.string().trim().max(255).nullish().transform((v) => v || null)
});

export const registrarChamadaSchema = z.object({
	idTreino: z.number().int().positive(),
	dataTreino: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida (utilize AAAA-MM-DD)' }),
	presencas: z.array(itemChamadaSchema)
});

export type RegistrarChamadaInput = z.infer<typeof registrarChamadaSchema>;
