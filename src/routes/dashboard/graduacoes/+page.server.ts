import type { PageServerLoad } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import {
	listarEventosGraduacaoDoDojo,
	listarGraduacoesDoDojo,
	obterDistribuicaoFaixasDoDojo
} from '#lib/server/repositorios/graduacao.repo';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_VER');

	const idAcademia = locals.idAcademia!;
	const [eventos, graduacoes, distribuicao] = await Promise.all([
		listarEventosGraduacaoDoDojo(idAcademia),
		listarGraduacoesDoDojo(idAcademia),
		obterDistribuicaoFaixasDoDojo(idAcademia)
	]);

	return {
		eventos,
		graduacoes,
		distribuicao,
		podeHomologar: temPermissao(perfis, 'GRADUACOES_HOMOLOGAR')
	};
};
