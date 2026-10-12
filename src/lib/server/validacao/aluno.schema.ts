import { z } from 'zod';

const regexData = /^\d{4}-\d{2}-\d{2}$/;

export function apenasDigitos(valor: string | null | undefined): string {
	if (!valor) return '';
	return valor.replace(/\D/g, '');
}

/**
 * Schema Zod resiliente para criação e edição de Judocas (Alunos) no SaaS Hinodê.
 * Trata campos opcionais, nullish, formatos vazios e conversões de FormData.
 */
export const alunoSchema = z.object({
	// Dados Pessoais do Judoca
	nome: z
		.string()
		.trim()
		.min(3, { message: 'Nome deve conter no mínimo 3 caracteres' })
		.max(255, { message: 'Nome muito longo' }),
	cpf: z
		.string()
		.trim()
		.transform((val) => apenasDigitos(val))
		.refine((val) => val.length === 11, { message: 'CPF deve conter exatamente 11 dígitos' }),
	dataNascimento: z
		.string()
		.trim()
		.regex(regexData, { message: 'Data de nascimento inválida (utilize o calendário)' }),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email({ message: 'E-mail em formato inválido' }),
	telefone: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val ? apenasDigitos(val) : null)),

	// Dados Técnicos do Judô
	matricula: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || null),
	peso: z.any().transform((val) => {
		if (val === undefined || val === null || val === '') return null;
		const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
		return isNaN(num) ? null : num;
	}),
	categoria: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || null),
	nFederacao: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || null),
	statusFederacao: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || null),
	dataInicio: z
		.string()
		.trim()
		.nullish()
		.refine((val) => !val || regexData.test(val), { message: 'Data de início inválida' })
		.transform((val) => val || null),
	graduacaoAtual: z
		.string()
		.trim()
		.min(1, { message: 'Selecione a faixa atual do judoca' }),
	idProfessorResponsavel: z.coerce
		.number()
		.int()
		.positive({ message: 'Selecione o professor responsável' }),

	// Dados do Responsável Legal (validados condicionalmente no aluno.service.ts)
	responsavelNome: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || ''),
	responsavelCpf: z
		.string()
		.trim()
		.nullish()
		.transform((val) => apenasDigitos(val)),
	responsavelEmail: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val ? val.toLowerCase() : '')),
	responsavelTelefone: z
		.string()
		.trim()
		.nullish()
		.transform((val) => apenasDigitos(val)),
	responsavelParentesco: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || ''),
	responsavelFinanceiro: z.any().transform((val) => val === true || val === 'true' || val === 'on')
});

export type AlunoInput = z.infer<typeof alunoSchema>;
