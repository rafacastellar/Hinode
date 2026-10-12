import type { PageServerLoad } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { listarCampeonatosDoDojo } from '#lib/server/repositorios/campeonato.repo';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'CAMPEONATOS_VER');

	const idAcademia = locals.idAcademia!;
	const campeonatos = await listarCampeonatosDoDojo(idAcademia);

	return {
		campeonatos
	};
};
