import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { listarCandidatosMatriculaDoDojo } from '#lib/server/repositorios/matricula.repo';
import { matricularUsuarioExistente } from '#lib/server/servicos/aluno.service';
import { matricularAlunoSchema } from '#lib/server/validacao/aluno.schema';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'ALUNOS_CRIAR');

	const idAcademia = locals.idAcademia!;
	const [professores, candidatos] = await Promise.all([
		listarProfessoresDoDojo(idAcademia),
		listarCandidatosMatriculaDoDojo(idAcademia)
	]);

	const podeGerenciarUsuario = temPermissao(perfis, 'USUARIOS_GERENCIAR');

	return {
		professores,
		candidatos,
		podeGerenciarUsuario
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'ALUNOS_CRIAR');

		const idAcademia = locals.idAcademia!;
		const formData = await request.formData();

		const dadosBrutos = {
			idUsuario: formData.get('idUsuario'),
			matricula: formData.get('matricula'),
			peso: formData.get('peso'),
			categoria: formData.get('categoria'),
			nFederacao: formData.get('nFederacao'),
			statusFederacao: formData.get('statusFederacao'),
			dataInicio: formData.get('dataInicio'),
			dataPrimeiraGraduacao: formData.get('dataPrimeiraGraduacao'),
			graduacaoAtual: formData.get('graduacaoAtual'),
			grupoEspecialAspirante: formData.get('grupoEspecialAspirante'),
			idProfessorResponsavel: formData.get('idProfessorResponsavel')
		};

		// 1. Validação estrutural via Zod
		const resultado = matricularAlunoSchema.safeParse(dadosBrutos);
		if (!resultado.success) {
			const issue = resultado.error.issues?.[0];
			return fail(400, {
				erro: issue?.message || 'Dados inválidos para matrícula',
				valores: dadosBrutos
			});
		}

		// 2. Regra de negócio + transação ACID
		try {
			await matricularUsuarioExistente(idAcademia, resultado.data);
		} catch (erro: any) {
			const mensagem = erro.body?.message || erro.message || 'Falha ao matricular judoca';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}

		throw redirect(303, '/dashboard/alunos');
	}
};
