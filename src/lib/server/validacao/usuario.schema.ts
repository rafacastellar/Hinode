import { z } from 'zod';
import {
	validarCpfOficial,
	validarDocumentoEstrangeiro,
	REGEX_SENHA_FORTE
} from '#lib/dominio/validacao';

const regexData = /^\d{4}-\d{2}-\d{2}$/;

export function apenasDigitos(valor: string | null | undefined): string {
	if (!valor) return '';
	return valor.replace(/\D/g, '');
}

/**
 * Schema Zod para criação de novo operador/usuário do dojo.
 * Suporta identificação Nacional (CPF com validação oficial Módulo 11) ou Internacional (Passaporte/RNM).
 * Exige política de senha forte (mín. 8 caracteres, maiúscula, minúscula, número e símbolo especial).
 */
export const criarUsuarioSchema = z
	.object({
		nome: z
			.string()
			.trim()
			.min(3, { message: 'Nome deve conter pelo menos 3 caracteres' })
			.max(255, { message: 'Nome muito longo' }),
		tipoDocumento: z.enum(['CPF', 'ESTRANGEIRO']).default('CPF'),
		cpf: z
			.string()
			.trim()
			.min(4, { message: 'Documento deve conter no mínimo 4 caracteres' })
			.max(30, { message: 'Documento muito longo (máx. 30 caracteres)' }),
		paisOrigem: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : 'Brasil')),
		dataNascimento: z
			.string()
			.trim()
			.regex(regexData, { message: 'Data de nascimento inválida (use o formato AAAA-MM-DD)' }),
		genero: z.enum(['M', 'F'], { message: 'Selecione o gênero (M ou F)' }).default('M'),
		email: z
			.string()
			.trim()
			.toLowerCase()
			.email({ message: 'E-mail corporativo inválido' }),
		senha: z
			.string()
			.min(8, { message: 'A senha deve conter no mínimo 8 caracteres' })
			.max(100, { message: 'Senha muito longa' })
			.regex(REGEX_SENHA_FORTE, {
				message:
					'A senha deve conter ao menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial (@$!%*?&#)'
			}),
		telefone: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? apenasDigitos(val) : null)),
		idsPerfis: z
			.array(z.coerce.number().int().positive())
			.min(1, { message: 'Selecione pelo menos um perfil para o usuário' }),
		// Campos técnicos de Sensei/Professor (se perfil Professor for atribuído)
		nFederacao: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : null)),
		grauFaixa: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : null)),

		// Endereço Completo (Opcional / Recomendado)
		cep: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? apenasDigitos(val) : null)),
		logradouro: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : null)),
		numero: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : null)),
		complemento: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : null)),
		bairro: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : null)),
		cidade: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : null)),
		uf: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim().toUpperCase() : null)),

		// Vínculo Familiar / Responsável Legal
		idResponsavel: z.coerce
			.number()
			.int()
			.positive()
			.nullish()
			.transform((val) => val || null),
		responsavelParentesco: z
			.string()
			.trim()
			.nullish()
			.transform((val) => (val && val.trim() ? val.trim() : 'Responsável Legal')),
		responsavelFinanceiro: z
			.any()
			.transform((val) => val === true || val === 'true' || val === 'on'),
		responsaveisJson: z.any().transform((val) => {
			if (!val || typeof val !== 'string') return [];
			try {
				const parsed = JSON.parse(val);
				if (Array.isArray(parsed)) {
					return parsed
						.filter((item) => item && typeof item === 'object' && item.idResponsavel)
						.map((item) => ({
							idResponsavel: Number(item.idResponsavel),
							grauParentesco:
								typeof item.grauParentesco === 'string' && item.grauParentesco.trim()
									? item.grauParentesco.trim()
									: 'Responsável Legal',
							financeiro: Boolean(item.financeiro)
						}));
				}
				return [];
			} catch {
				return [];
			}
		})
	})
	.superRefine((dados, ctx) => {
		if (dados.tipoDocumento === 'CPF') {
			const digitos = apenasDigitos(dados.cpf);
			if (digitos.length !== 11) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'CPF deve conter exatamente 11 dígitos numéricos',
					path: ['cpf']
				});
			} else if (!validarCpfOficial(digitos)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'CPF inválido. Verifique os dígitos informados.',
					path: ['cpf']
				});
			}
		} else {
			// ESTRANGEIRO
			if (!validarDocumentoEstrangeiro(dados.cpf)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Documento internacional inválido (utilize apenas letras, números e hífens)',
					path: ['cpf']
				});
			}
			if (!dados.paisOrigem || dados.paisOrigem.toLowerCase() === 'brasil') {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Informe o país de origem para documento internacional',
					path: ['paisOrigem']
				});
			}
		}
	});

/**
 * Schema Zod para edição de dados de usuário e papéis acumulativos.
 */
export const editarUsuarioSchema = z.object({
	nome: z
		.string()
		.trim()
		.min(3, { message: 'Nome deve conter pelo menos 3 caracteres' })
		.max(255, { message: 'Nome muito longo' }),
	dataNascimento: z
		.string()
		.trim()
		.regex(regexData, { message: 'Data de nascimento inválida (use o formato AAAA-MM-DD)' }),
	genero: z.enum(['M', 'F'], { message: 'Selecione o gênero (M ou F)' }).default('M'),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email({ message: 'E-mail corporativo inválido' }),
	telefone: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? apenasDigitos(val) : null)),
	idsPerfis: z
		.array(z.coerce.number().int().positive())
		.min(1, { message: 'Selecione pelo menos um perfil para o usuário' }),
	nFederacao: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim() : null)),
	grauFaixa: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim() : null)),

	// Endereço Completo
	cep: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? apenasDigitos(val) : null)),
	logradouro: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim() : null)),
	numero: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim() : null)),
	complemento: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim() : null)),
	bairro: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim() : null)),
	cidade: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim() : null)),
	uf: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim().toUpperCase() : null)),

	// Vínculo Familiar / Responsável Legal
	idResponsavel: z.coerce
		.number()
		.int()
		.positive()
		.nullish()
		.transform((val) => val || null),
	responsavelParentesco: z
		.string()
		.trim()
		.nullish()
		.transform((val) => (val && val.trim() ? val.trim() : 'Responsável Legal')),
	responsavelFinanceiro: z
		.any()
		.transform((val) => val === true || val === 'true' || val === 'on'),
	responsaveisJson: z.any().transform((val) => {
		if (!val || typeof val !== 'string') return [];
		try {
			const parsed = JSON.parse(val);
			if (Array.isArray(parsed)) {
				return parsed
					.filter((item) => item && typeof item === 'object' && item.idResponsavel)
					.map((item) => ({
						idResponsavel: Number(item.idResponsavel),
						grauParentesco: typeof item.grauParentesco === 'string' && item.grauParentesco.trim() ? item.grauParentesco.trim() : 'Responsável Legal',
						financeiro: Boolean(item.financeiro)
					}));
			}
			return [];
		} catch {
			return [];
		}
	})
});

/**
 * Schema Zod para redefinição de senha do usuário.
 */
export const redefinirSenhaSchema = z
	.object({
		novaSenha: z
			.string()
			.min(8, { message: 'Nova senha deve ter no mínimo 8 caracteres' })
			.max(100, { message: 'Senha muito longa' })
			.regex(REGEX_SENHA_FORTE, {
				message:
					'A senha deve conter ao menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (@$!%*?&#)'
			}),
		confirmacaoSenha: z
			.string()
			.min(1, { message: 'Confirmação de senha é obrigatória' })
	})
	.refine((dados) => dados.novaSenha === dados.confirmacaoSenha, {
		message: 'As senhas não conferem',
		path: ['confirmacaoSenha']
	});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
