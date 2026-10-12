import type { PageServerLoad } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import {
	listarGraduacoesDoDojo,
	obterDistribuicaoFaixasDoDojo
} from '#lib/server/repositorios/graduacao.repo';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_VER');

	const idAcademia = locals.idAcademia!;
	const [graduacoes, distribuicao] = await Promise.all([
		listarGraduacoesDoDojo(idAcademia),
		obterDistribuicaoFaixasDoDojo(idAcademia)
	]);

	return {
		graduacoes,
		distribuicao
	};
};
