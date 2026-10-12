import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { listarAlunos } from '#lib/server/repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { homologarTrocaDeFaixa } from '#lib/server/servicos/graduacao.service';
import { graduacaoSchema } from '#lib/server/validacao/graduacao.schema';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

	const idAcademia = locals.idAcademia!;
	const [alunos, professores] = await Promise.all([
		listarAlunos(idAcademia),
		listarProfessoresDoDojo(idAcademia)
	]);

	return {
		alunos,
		professores
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
		const idUsuarioExecutor = locals.usuario?.id || 1;
		const formData = await request.formData();

		const dadosBrutos = {
			idAluno: formData.get('idAluno'),
			novaFaixa: formData.get('novaFaixa'),
			idProfessorHomologador: formData.get('idProfessorHomologador'),
			dataGraduacao: formData.get('dataGraduacao'),
			associacao: formData.get('associacao'),
			nomeEvento: formData.get('nomeEvento')
		};

		const resultadoValidacao = graduacaoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			const campo =
				issue?.path?.[0] !== undefined ? `[${String(issue.path[0])}] ` : '';
			const primeiroErro =
				`${campo}${issue?.message || 'Dados inválidos para homologação'}`;
			return fail(400, {
				erro: primeiroErro,
				valores: dadosBrutos
			});
		}

		try {
			await homologarTrocaDeFaixa(idAcademia, idUsuarioExecutor, resultadoValidacao.data);
		} catch (erro: any) {
			const mensagem =
				erro.body?.message || erro.message || 'Falha ao homologar graduação do judoca';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}

		throw redirect(303, '/dashboard/graduacoes');
	}
};
