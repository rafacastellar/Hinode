import type { PageServerLoad } from './$types';
import { obterMetricasDoDojo } from '#lib/server/repositorios/dashboard.repo';

export const load: PageServerLoad = async ({ locals }) => {
	const idAcademia = locals.idAcademia!;
	const metricas = await obterMetricasDoDojo(idAcademia);

	return {
		usuario: locals.usuario,
		idAcademia,
		nomeAcademia: locals.nomeAcademia,
		perfis: locals.perfis || [],
		metricas
	};
};
