import type { LayoutServerLoad } from './$types';
import { calcularPermissoes, obterMenuAutorizado } from '#lib/server/auth/rbac';

export const load: LayoutServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	const permissoes = calcularPermissoes(perfis);
	const itensMenu = obterMenuAutorizado(perfis);

	return {
		usuario: locals.usuario,
		idAcademia: locals.idAcademia,
		nomeAcademia: locals.nomeAcademia,
		perfis,
		permissoes,
		itensMenu
	};
};
