import { z } from 'zod';
import { validarCpfOficial } from '#lib/dominio/validacao';

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
	// Vínculos com cadastros existentes (Opcionais)
	idUsuarioExistente: z.any().transform((val) => {
		if (val === undefined || val === null || val === '') return null;
		const num = Number(val);
		return isNaN(num) || num <= 0 ? null : num;
	}),
	idResponsavelExistente: z.any().transform((val) => {
		if (val === undefined || val === null || val === '') return null;
		const num = Number(val);
		return isNaN(num) || num <= 0 ? null : num;
	}),

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
		.refine((val) => val.length === 11, { message: 'CPF deve conter exatamente 11 dígitos' })
		.refine(validarCpfOficial, { message: 'CPF inválido. Verifique os dígitos informados.' }),
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
		.transform((val) => val || 'Ativo'),
	dataInicio: z
		.string()
		.trim()
		.nullish()
		.refine((val) => !val || regexData.test(val), { message: 'Data de início inválida' })
		.transform((val) => val || null),
	dataPrimeiraGraduacao: z
		.string()
		.trim()
		.nullish()
		.refine((val) => !val || regexData.test(val), { message: 'Data da 1ª graduação inválida' })
		.transform((val) => val || null),
	graduacaoAtual: z
		.string()
		.trim()
		.min(1, { message: 'Selecione a faixa atual do judoca' }),
	grupoEspecialAspirante: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || null),
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
		.transform((val) => (val ? apenasDigitos(val) : ''))
		.refine((val) => !val || (val.length === 11 && validarCpfOficial(val)), {
			message: 'CPF do responsável legal inválido. Verifique os dígitos informados.'
		}),
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

/**
 * Schema Zod para atualização/edição de dados esportivos e técnicos do judoca.
 */
export const editarAlunoSchema = z.object({
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
		.transform((val) => val || 'Ativo'),
	dataInicio: z
		.string()
		.trim()
		.nullish()
		.refine((val) => !val || regexData.test(val), { message: 'Data de início inválida' })
		.transform((val) => val || null),
	dataPrimeiraGraduacao: z
		.string()
		.trim()
		.nullish()
		.refine((val) => !val || regexData.test(val), { message: 'Data da 1ª graduação inválida' })
		.transform((val) => val || null),
	graduacaoAtual: z
		.string()
		.trim()
		.min(1, { message: 'Selecione a faixa atual do judoca' }),
	grupoEspecialAspirante: z
		.string()
		.trim()
		.nullish()
		.transform((val) => val || null),
	idProfessorResponsavel: z.coerce
		.number()
		.int()
		.positive({ message: 'Selecione o professor responsável' })
});

export type EditarAlunoInput = z.infer<typeof editarAlunoSchema>;

/**
 * Schema Zod para matrícula de judoca a partir de um usuário já cadastrado
 * (perfil 'Aluno'). Dados pessoais e responsáveis são geridos no módulo de usuários.
 */
export const matricularAlunoSchema = editarAlunoSchema.extend({
	idUsuario: z.coerce
		.number()
		.int()
		.positive({ message: 'Selecione um usuário com perfil Aluno para matricular' })
});

export type MatricularAlunoInput = z.infer<typeof matricularAlunoSchema>;
