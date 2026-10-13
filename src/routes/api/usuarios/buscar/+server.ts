import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { buscarUsuariosParaMatricula } from '#lib/server/repositorios/usuario.repo';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.usuario || !locals.idAcademia) {
		throw error(401, 'Sessão expirada ou usuário não autenticado');
	}

	exigirPermissao(locals.perfis || [], 'ALUNOS_CRIAR');

	const termo = url.searchParams.get('q') || url.searchParams.get('termo') || '';
	if (termo.trim().length < 2) {
		return json({ usuarios: [] });
	}

	const usuarios = await buscarUsuariosParaMatricula(locals.idAcademia, termo);
	return json({ usuarios });
};
