import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { cadastrarAluno } from '#lib/server/servicos/aluno.service';
import { alunoSchema } from '#lib/server/validacao/aluno.schema';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'ALUNOS_CRIAR');

	const idAcademia = locals.idAcademia!;
	const professores = await listarProfessoresDoDojo(idAcademia);

	return {
		professores
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'ALUNOS_CRIAR');

		const idAcademia = locals.idAcademia!;
		const formData = await request.formData();

		const dadosBrutos = {
			nome: formData.get('nome'),
			cpf: formData.get('cpf'),
			dataNascimento: formData.get('dataNascimento'),
			email: formData.get('email'),
			telefone: formData.get('telefone'),
			matricula: formData.get('matricula'),
			peso: formData.get('peso'),
			categoria: formData.get('categoria'),
			nFederacao: formData.get('nFederacao'),
			statusFederacao: formData.get('statusFederacao'),
			dataInicio: formData.get('dataInicio'),
			graduacaoAtual: formData.get('graduacaoAtual'),
			idProfessorResponsavel: formData.get('idProfessorResponsavel'),
			responsavelNome: formData.get('responsavelNome'),
			responsavelCpf: formData.get('responsavelCpf'),
			responsavelEmail: formData.get('responsavelEmail'),
			responsavelTelefone: formData.get('responsavelTelefone'),
			responsavelParentesco: formData.get('responsavelParentesco'),
			responsavelFinanceiro: formData.get('responsavelFinanceiro') === 'on'
		};

		// 1. Validação estrutural via Zod
		const resultadoValidacao = alunoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			const campo =
				issue?.path?.[0] !== undefined ? `[${String(issue.path[0])}] ` : '';
			const primeiroErro = `${campo}${issue?.message || 'Dados inválidos para matrícula'}`;
			return fail(400, {
				erro: primeiroErro,
				valores: dadosBrutos
			});
		}

		// 2. Execução da regra de negócio com transação ACID
		try {
			await cadastrarAluno(idAcademia, resultadoValidacao.data);
		} catch (erro: any) {
			// Erros com status do SvelteKit (400, 409)
			const mensagem = erro.body?.message || erro.message || 'Falha ao cadastrar judoca';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}

		throw redirect(303, '/dashboard/alunos');
	}
};
