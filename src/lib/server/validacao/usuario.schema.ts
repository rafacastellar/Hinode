import { z } from 'zod';

const regexData = /^\d{4}-\d{2}-\d{2}$/;

export function apenasDigitos(valor: string | null | undefined): string {
	if (!valor) return '';
	return valor.replace(/\D/g, '');
}

/**
 * Schema Zod para criação de novo operador/usuário do dojo.
 */
export const criarUsuarioSchema = z.object({
	nome: z
		.string()
		.trim()
		.min(3, { message: 'Nome deve conter pelo menos 3 caracteres' })
		.max(255, { message: 'Nome muito longo' }),
	cpf: z
		.string()
		.trim()
		.transform((val) => apenasDigitos(val))
		.refine((val) => val.length === 11, { message: 'CPF deve conter exatamente 11 dígitos' }),
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
		.min(6, { message: 'A senha deve conter no mínimo 6 caracteres' })
		.max(100, { message: 'Senha muito longa' }),
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
		.transform((val) => (val && val.trim() ? val.trim() : null))
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
		.transform((val) => (val && val.trim() ? val.trim() : null))
});

/**
 * Schema Zod para redefinição de senha do usuário.
 */
export const redefinirSenhaSchema = z
	.object({
		novaSenha: z
			.string()
			.min(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
			.max(100, { message: 'Senha muito longa' }),
		confirmacaoSenha: z
			.string()
			.min(6, { message: 'Confirmação deve ter no mínimo 6 caracteres' })
	})
	.refine((dados) => dados.novaSenha === dados.confirmacaoSenha, {
		message: 'As senhas não conferem',
		path: ['confirmacaoSenha']
	});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
