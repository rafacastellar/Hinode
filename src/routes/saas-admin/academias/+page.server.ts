import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import {
	listarAcademiasSaas,
	alternarAtivacaoAcademia,
	criarNovaAcademiaComAdminTx
} from '#lib/server/repositorios/saas-admin.repo';

const criarAcademiaComAdminSchema = z.object({
	nomeAcademia: z.string().min(2, 'Razão Social obrigatória').max(255).trim(),
	nomeFantasia: z.string().max(255).trim().nullable().optional(),
	cnpj: z
		.string()
		.regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$|^\d{14}$/, 'CNPJ deve conter 14 dígitos numéricos válidos'),
	inscrEst: z.string().max(50).trim().nullable().optional(),
	telefoneAcademia: z.string().max(20).trim().nullable().optional(),
	// Endereço
	cep: z.string().regex(/^\d{5}-?\d{3}$|^\d{8}$/, 'CEP deve ter 8 dígitos numéricos'),
	logradouro: z.string().min(2, 'Logradouro obrigatório').max(255).trim(),
	numero: z.string().max(20).trim().nullable().optional(),
	complemento: z.string().max(100).trim().nullable().optional(),
	bairro: z.string().max(100).trim().nullable().optional(),
	cidade: z.string().min(2, 'Cidade obrigatória').max(100).trim(),
	uf: z.string().length(2, 'UF deve ter 2 caracteres').toUpperCase(),
	// Novo Usuário Admin Obrigatório
	adminNome: z.string().min(3, 'Nome do administrador obrigatório').max(255).trim(),
	adminTipoDocumento: z.enum(['CPF', 'ESTRANGEIRO']),
	adminCpf: z.string().min(5, 'Documento/CPF do administrador obrigatório').max(30).trim(),
	adminDataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida'),
	adminGenero: z.enum(['M', 'F']),
	adminEmail: z.string().email('E-mail do administrador inválido').trim().toLowerCase(),
	adminSenha: z.string().min(6, 'A senha do administrador deve ter no mínimo 6 caracteres'),
	adminTelefone: z.string().max(20).trim().nullable().optional(),
	adminTambemProfessor: z.boolean().optional()
});

export const load: PageServerLoad = async () => {
	const academias = await listarAcademiasSaas();
	return { academias };
};

export const actions: Actions = {
	alternarAtivacao: async ({ request, locals, getClientAddress }) => {
		if (!locals.superAdmin) {
			return fail(401, { erro: 'Não autorizado.' });
		}

		const formData = await request.formData();
		const idAcademia = Number(formData.get('idAcademia'));
		const acao = String(formData.get('acao') || '');
		const motivo = String(formData.get('motivo') || '');

		if (!idAcademia) {
			return fail(400, { erro: 'ID da academia não fornecido.' });
		}

		const ativar = acao === 'ativar';

		try {
			await alternarAtivacaoAcademia(
				idAcademia,
				locals.superAdmin.id,
				ativar,
				motivo,
				getClientAddress()
			);
			return {
				sucesso: true,
				mensagem: ativar
					? 'Academia reativada com sucesso.'
					: 'Academia suspensa e todas as sessões foram revogadas com sucesso.'
			};
		} catch (erro: any) {
			return fail(400, { erro: erro?.message || 'Falha ao alterar status da academia.' });
		}
	},

	criarAcademia: async ({ request, locals, getClientAddress }) => {
		if (!locals.superAdmin) {
			return fail(401, { erro: 'Não autorizado.' });
		}

		const formData = await request.formData();

		const strOuNull = (val: FormDataEntryValue | null) => {
			if (typeof val !== 'string') return null;
			const trimmed = val.trim();
			return trimmed === '' ? null : trimmed;
		};

		const dadosBrutos = {
			nomeAcademia: ((formData.get('nomeAcademia') as string) || '').trim(),
			nomeFantasia: strOuNull(formData.get('nomeFantasia')),
			cnpj: ((formData.get('cnpj') as string) || '').trim(),
			inscrEst: strOuNull(formData.get('inscrEst')),
			telefoneAcademia: strOuNull(formData.get('telefoneAcademia')),
			cep: ((formData.get('cep') as string) || '').trim(),
			logradouro: ((formData.get('logradouro') as string) || '').trim(),
			numero: strOuNull(formData.get('numero')),
			complemento: strOuNull(formData.get('complemento')),
			bairro: strOuNull(formData.get('bairro')),
			cidade: ((formData.get('cidade') as string) || '').trim(),
			uf: ((formData.get('uf') as string) || '').trim().toUpperCase(),
			adminNome: ((formData.get('adminNome') as string) || '').trim(),
			adminTipoDocumento: (formData.get('adminTipoDocumento') as string) || 'CPF',
			adminCpf: ((formData.get('adminCpf') as string) || '').trim(),
			adminDataNascimento: (formData.get('adminDataNascimento') as string) || '',
			adminGenero: (formData.get('adminGenero') as string) || 'M',
			adminEmail: ((formData.get('adminEmail') as string) || '').trim(),
			adminSenha: (formData.get('adminSenha') as string) || '',
			adminTelefone: strOuNull(formData.get('adminTelefone')),
			adminTambemProfessor: formData.get('adminTambemProfessor') === 'on' || formData.get('adminTambemProfessor') === 'true'
		};

		const validacao = criarAcademiaComAdminSchema.safeParse(dadosBrutos);
		if (!validacao.success) {
			const primeiroErro = validacao.error.issues[0]?.message || 'Dados inválidos';
			return fail(400, { erro: primeiroErro, valores: dadosBrutos });
		}

		try {
			const res = await criarNovaAcademiaComAdminTx(
				{
					academia: {
						nome: validacao.data.nomeAcademia,
						nome_fantasia: validacao.data.nomeFantasia,
						cnpj: validacao.data.cnpj,
						inscr_est: validacao.data.inscrEst,
						telefone: validacao.data.telefoneAcademia,
						endereco: {
							cep: validacao.data.cep,
							logradouro: validacao.data.logradouro,
							numero: validacao.data.numero,
							complemento: validacao.data.complemento,
							bairro: validacao.data.bairro,
							cidade: validacao.data.cidade,
							uf: validacao.data.uf
						}
					},
					admin: {
						nome: validacao.data.adminNome,
						tipoDocumento: validacao.data.adminTipoDocumento,
						cpf: validacao.data.adminCpf,
						dataNascimento: validacao.data.adminDataNascimento,
						genero: validacao.data.adminGenero,
						email: validacao.data.adminEmail,
						senha: validacao.data.adminSenha,
						telefone: validacao.data.adminTelefone,
						tambemProfessor: validacao.data.adminTambemProfessor
					}
				},
				locals.superAdmin.id,
				getClientAddress()
			);

			return {
				sucesso: true,
				mensagem: `Academia #${res.idAcademia} e Administrador criados com sucesso na plataforma.`
			};
		} catch (erro: any) {
			return fail(400, { erro: erro?.message || 'Falha ao criar nova academia.', valores: dadosBrutos });
		}
	}
};

