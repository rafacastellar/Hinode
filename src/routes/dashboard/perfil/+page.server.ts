import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import {
	buscarPerfilCompletoParaUsuario,
	atualizarDadosProprioPerfilTx,
	alterarPropriaSenhaUsuario
} from '#lib/server/repositorios/usuario.repo';

const perfilEdicaoSchema = z.object({
	email: z.string().email('E-mail em formato inválido').max(255).trim().toLowerCase(),
	telefone: z.string().max(20).nullable().optional(),
	peso: z.preprocess(
		(val) => (val === '' || val === null || val === undefined ? null : Number(val)),
		z.number().min(20, 'O peso mínimo é 20 kg').max(250, 'O peso máximo é 250 kg').nullable().optional()
	),
	endereco: z.object({
		cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve ter 8 dígitos numéricos'),
		logradouro: z.string().min(2, 'Logradouro é obrigatório').max(255).trim(),
		numero: z.string().max(20).nullable().optional(),
		complemento: z.string().max(100).nullable().optional(),
		bairro: z.string().max(100).nullable().optional(),
		cidade: z.string().min(2, 'Cidade é obrigatória').max(100).trim(),
		uf: z.string().length(2, 'UF deve ter 2 caracteres').toUpperCase()
	})
});

import { REGEX_SENHA_FORTE } from '#lib/dominio/validacao';

const alterarPropriaSenhaSchema = z
	.object({
		senhaAtual: z.string().min(1, 'Informe a senha atual'),
		novaSenha: z
			.string()
			.min(8, 'A nova senha deve ter no mínimo 8 caracteres')
			.max(100, 'A nova senha não pode exceder 100 caracteres')
			.regex(
				REGEX_SENHA_FORTE,
				'A nova senha deve conter ao menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial (@$!%*?&#)'
			),
		confirmacaoNovaSenha: z.string().min(1, 'Confirme a nova senha')
	})
	.refine((dados) => dados.novaSenha === dados.confirmacaoNovaSenha, {
		message: 'A confirmação da nova senha não confere.',
		path: ['confirmacaoNovaSenha']
	})
	.refine((dados) => dados.novaSenha !== dados.senhaAtual, {
		message: 'A nova senha deve ser diferente da senha atual.',
		path: ['novaSenha']
	});

export const load: PageServerLoad = async ({ locals }) => {
	const idAcademia = locals.idAcademia;
	const idUsuario = locals.usuario?.id;

	if (!idAcademia || !idUsuario) {
		throw redirect(303, '/auth/login');
	}

	const perfil = await buscarPerfilCompletoParaUsuario(idAcademia, idUsuario);
	if (!perfil) {
		throw error(404, {
			message: 'Perfil de usuário não encontrado no dojo atual.'
		});
	}

	return {
		perfil,
		nomeAcademia: locals.nomeAcademia,
		ehAluno: Boolean(perfil.dados_aluno)
	};
};

export const actions: Actions = {
	salvarDados: async ({ request, locals }) => {
		const idAcademia = locals.idAcademia;
		const idUsuario = locals.usuario?.id;

		if (!idAcademia || !idUsuario) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();

		const strOuNull = (val: FormDataEntryValue | null) => {
			if (typeof val !== 'string') return null;
			const trimmed = val.trim();
			return trimmed === '' ? null : trimmed;
		};

		const dadosBrutos = {
			email: ((formData.get('email') as string) || '').trim(),
			telefone: strOuNull(formData.get('telefone')),
			peso: strOuNull(formData.get('peso')),
			endereco: {
				cep: ((formData.get('cep') as string) || '').trim(),
				logradouro: ((formData.get('logradouro') as string) || '').trim(),
				numero: strOuNull(formData.get('numero')),
				complemento: strOuNull(formData.get('complemento')),
				bairro: strOuNull(formData.get('bairro')),
				cidade: ((formData.get('cidade') as string) || '').trim(),
				uf: ((formData.get('uf') as string) || '').trim().toUpperCase()
			}
		};

		const resultadoValidacao = perfilEdicaoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const primeiroErro = resultadoValidacao.error.issues[0]?.message || 'Dados inválidos';
			return fail(400, {
				erroDados: primeiroErro,
				valores: {
					email: dadosBrutos.email,
					telefone: dadosBrutos.telefone,
					peso: dadosBrutos.peso,
					cep: dadosBrutos.endereco.cep,
					logradouro: dadosBrutos.endereco.logradouro,
					numero: dadosBrutos.endereco.numero,
					complemento: dadosBrutos.endereco.complemento,
					bairro: dadosBrutos.endereco.bairro,
					cidade: dadosBrutos.endereco.cidade,
					uf: dadosBrutos.endereco.uf
				}
			});
		}

		const dadosValidos = resultadoValidacao.data;

		try {
			const resultado = await atualizarDadosProprioPerfilTx(idAcademia, idUsuario, {
				email: dadosValidos.email,
				telefone: dadosValidos.telefone,
				peso: dadosValidos.peso,
				endereco: dadosValidos.endereco
			});

			return {
				sucessoDados: resultado?.novaCategoria
					? `Dados cadastrais e pesagem atualizados com sucesso! Sua categoria oficial no dojo agora é ${resultado.novaCategoria}.`
					: 'Dados cadastrais, contato e endereço atualizados com sucesso!'
			};
		} catch (err: any) {
			return fail(400, {
				erroDados: err.message || 'Falha ao atualizar dados do perfil.',
				valores: dadosBrutos
			});
		}
	},

	alterarSenha: async ({ request, locals }) => {
		const idUsuario = locals.usuario?.id;
		if (!idUsuario) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const dadosBrutos = {
			senhaAtual: formData.get('senhaAtual'),
			novaSenha: formData.get('novaSenha'),
			confirmacaoNovaSenha: formData.get('confirmacaoNovaSenha')
		};

		const resultadoValidacao = alterarPropriaSenhaSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const primeiroErro = resultadoValidacao.error.issues[0]?.message || 'Dados de senha inválidos';
			return fail(400, {
				erroSenha: primeiroErro
			});
		}

		const { senhaAtual, novaSenha } = resultadoValidacao.data;

		try {
			await alterarPropriaSenhaUsuario(idUsuario, senhaAtual, novaSenha);
			return {
				sucessoSenha: 'Sua senha de acesso foi alterada com sucesso!'
			};
		} catch (err: any) {
			return fail(400, {
				erroSenha: err.message || 'Falha ao alterar senha de acesso.'
			});
		}
	}
};
