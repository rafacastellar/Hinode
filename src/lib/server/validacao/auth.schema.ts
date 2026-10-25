import { z } from 'zod';

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, { message: 'E-mail é obrigatório' })
		.trim()
		.email({ message: 'Formato de e-mail inválido' }),
	senha: z
		.string()
		.min(1, { message: 'Senha é obrigatória' })
		.min(6, { message: 'A senha deve conter ao menos 6 caracteres' }),
	idAcademia: z
		.coerce
		.number()
		.int()
		.positive()
		.optional(),
	lembrar: z
		.boolean()
		.optional()
		.default(false)
});

export type LoginInput = z.infer<typeof loginSchema>;
