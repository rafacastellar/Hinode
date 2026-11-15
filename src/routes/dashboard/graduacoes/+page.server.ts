import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { exigirPermissao, temPermissao, normalizarNomePapel } from '#lib/server/auth/rbac';
import {
	listarEventosGraduacaoDoDojo,
	listarGraduacoesDoDojo,
	obterDistribuicaoFaixasDoDojo
} from '#lib/server/repositorios/graduacao.repo';
import { listarAlunos } from '#lib/server/repositorios/aluno.repo';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_VER');

	const ehGestorOuProfessor = perfis.some((p) => {
		const norm = normalizarNomePapel(p);
		return norm === 'admin' || norm === 'professor' || norm === 'recepcao';
	});

	if (!ehGestorOuProfessor) {
		throw redirect(302, '/dashboard/minhas-graduacoes');
	}

	const idAcademia = locals.idAcademia!;
	const podeHomologar = temPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

	const [eventos, graduacoes, distribuicao, alunosDojo] = await Promise.all([
		listarEventosGraduacaoDoDojo(idAcademia),
		listarGraduacoesDoDojo(idAcademia, 100),
		obterDistribuicaoFaixasDoDojo(idAcademia),
		listarAlunos(idAcademia)
	]);

	return {
		podeHomologar,
		eventos,
		graduacoes,
		distribuicao,
		alunosDojo: alunosDojo.map((a) => ({
			id_usuario: a.id_usuario,
			nome: a.nome,
			idade: a.idade,
			matricula: a.matricula,
			graduacao_atual: a.graduacao_atual,
			nome_professor_responsavel: a.nome_professor_responsavel
		}))
	};
};
