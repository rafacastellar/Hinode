import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
	listarAcademiasSaas,
	listarPerfisSaas,
	criarUsuarioSaas
} from '#lib/server/repositorios/saas-admin.repo';

export const load: PageServerLoad = async () => {
	const [academias, perfis] = await Promise.all([
		listarAcademiasSaas(),
		listarPerfisSaas()
	]);

	return {
		academias,
		perfis
	};
};

export const actions: Actions = {
	default: async ({ request, locals, getClientAddress }) => {
		if (!locals.superAdmin) {
			return fail(401, { erro: 'Acesso restrito ao Super Admin.' });
		}

		const formData = await request.formData();
		const nome = String(formData.get('nome') || '').trim();
		const tipoDocumento = (formData.get('tipoDocumento') as 'CPF' | 'ESTRANGEIRO') || 'CPF';
		const cpf = String(formData.get('cpf') || '').trim();
		const paisOrigem = String(formData.get('paisOrigem') || 'Brasil').trim();
		const dataNascimento = String(formData.get('dataNascimento') || '').trim();
		const genero = (formData.get('genero') as 'M' | 'F') || 'M';
		const email = String(formData.get('email') || '').trim().toLowerCase();
		const telefone = formData.get('telefone') ? String(formData.get('telefone')).trim() : null;
		const senha = String(formData.get('senha') || '').trim();
		const isSuperAdmin = formData.get('isSuperAdmin') === '1' || formData.get('isSuperAdmin') === 'on';

		const idAcademiaRaw = formData.get('idAcademia');
		const idAcademia = idAcademiaRaw && Number(idAcademiaRaw) > 0 ? Number(idAcademiaRaw) : null;
		const idsPerfisRaw = formData.getAll('idsPerfis');
		const idsPerfis = idsPerfisRaw.map((id) => Number(id)).filter((id) => id > 0);

		if (!nome || !cpf || !dataNascimento || !email || !senha) {
			return fail(400, {
				erro: 'Por favor preencha todos os campos obrigatórios (Nome, Documento, Data de Nascimento, E-mail e Senha).',
				valores: {
					nome,
					tipoDocumento,
					cpf,
					paisOrigem,
					dataNascimento,
					genero,
					email,
					telefone,
					isSuperAdmin,
					idAcademia
				}
			});
		}

		if (senha.length < 6) {
			return fail(400, {
				erro: 'A senha provisória deve conter pelo menos 6 caracteres.',
				valores: {
					nome,
					tipoDocumento,
					cpf,
					paisOrigem,
					dataNascimento,
					genero,
					email,
					telefone,
					isSuperAdmin,
					idAcademia
				}
			});
		}

		try {
			await criarUsuarioSaas(
				{
					nome,
					tipoDocumento,
					cpf,
					paisOrigem,
					dataNascimento,
					genero,
					email,
					senha,
					telefone,
					isSuperAdmin,
					idAcademia,
					idsPerfis
				},
				locals.superAdmin.id,
				getClientAddress()
			);
		} catch (erro: any) {
			return fail(400, {
				erro: erro?.message || 'Falha ao cadastrar usuário na plataforma.',
				valores: {
					nome,
					tipoDocumento,
					cpf,
					paisOrigem,
					dataNascimento,
					genero,
					email,
					telefone,
					isSuperAdmin,
					idAcademia
				}
			});
		}

		throw redirect(303, '/saas-admin/usuarios');
	}
};

