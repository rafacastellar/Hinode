import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import {
	buscarPerfilCompletoAlunosDoResponsavel,
	atualizarPesoAlunoDoResponsavel,
	atualizarContatoAlunoDoResponsavel
} from '#lib/server/repositorios/responsavel.repo';

const pesoSchema = z.object({
	idAluno: z.coerce.number().positive('ID de aluno inválido'),
	peso: z.preprocess(
		(val) => Number(val),
		z.number().min(20, 'O peso mínimo é 20 kg').max(250, 'O peso máximo é 250 kg')
	)
});

const contatoSchema = z.object({
	idAluno: z.coerce.number().positive('ID de aluno inválido'),
	telefone: z.string().max(20).nullable().optional(),
	email: z.string().email('E-mail em formato inválido').max(255).trim().toLowerCase().nullable().optional().or(z.literal(''))
});

export const load: PageServerLoad = async ({ locals }) => {
	const idAcademia = locals.idAcademia;
	const idUsuario = locals.usuario?.id;

	if (!idAcademia || !idUsuario) {
		throw redirect(303, '/auth/login');
	}

	const alunos = await buscarPerfilCompletoAlunosDoResponsavel(idAcademia, idUsuario);

	// Se não tem alunos sob responsabilidade, redireciona para o perfil pessoal
	if (alunos.length === 0) {
		throw redirect(303, '/dashboard/perfil');
	}

	return {
		alunos,
		totalAlunos: alunos.length,
		nomeAcademia: locals.nomeAcademia,
		usuarioLogado: locals.usuario
	};
};

export const actions: Actions = {
	salvarPeso: async ({ request, locals }) => {
		const idAcademia = locals.idAcademia;
		const idUsuario = locals.usuario?.id;

		if (!idAcademia || !idUsuario) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const dadosBrutos = {
			idAluno: formData.get('idAluno'),
			peso: formData.get('peso')
		};

		const validacao = pesoSchema.safeParse(dadosBrutos);
		if (!validacao.success) {
			const primeiroErro = validacao.error.issues[0]?.message || 'Peso inválido';
			return fail(400, {
				erroPeso: primeiroErro,
				idAlunoErro: Number(dadosBrutos.idAluno)
			});
		}

		try {
			const resultado = await atualizarPesoAlunoDoResponsavel(
				idAcademia,
				idUsuario,
				validacao.data.idAluno,
				validacao.data.peso
			);

			return {
				sucessoPeso: resultado.mensagem,
				idAlunoAtualizado: validacao.data.idAluno,
				novaCategoria: resultado.novaCategoria
			};
		} catch (err: any) {
			return fail(403, {
				erroPeso: err.message || 'Não foi possível atualizar o peso do aluno.',
				idAlunoErro: validacao.data.idAluno
			});
		}
	},

	salvarContato: async ({ request, locals }) => {
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
			idAluno: formData.get('idAluno'),
			telefone: strOuNull(formData.get('telefone')),
			email: strOuNull(formData.get('email'))
		};

		const validacao = contatoSchema.safeParse(dadosBrutos);
		if (!validacao.success) {
			const primeiroErro = validacao.error.issues[0]?.message || 'Dados de contato inválidos';
			return fail(400, {
				erroContato: primeiroErro,
				idAlunoErro: Number(dadosBrutos.idAluno)
			});
		}

		try {
			const resultado = await atualizarContatoAlunoDoResponsavel(
				idAcademia,
				idUsuario,
				validacao.data.idAluno,
				{
					telefone: validacao.data.telefone,
					email: validacao.data.email
				}
			);

			return {
				sucessoContato: resultado.mensagem,
				idAlunoAtualizado: validacao.data.idAluno
			};
		} catch (err: any) {
			return fail(403, {
				erroContato: err.message || 'Não foi possível atualizar os contatos do aluno.',
				idAlunoErro: validacao.data.idAluno
			});
		}
	}
};
