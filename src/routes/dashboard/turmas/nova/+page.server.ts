import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { cadastrarTurma } from '#lib/server/servicos/turma.service';
import { turmaSchema } from '#lib/server/validacao/turma.schema';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'TURMAS_GERENCIAR');

	const idAcademia = locals.idAcademia!;
	const professores = await listarProfessoresDoDojo(idAcademia);

	return {
		professores
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'TURMAS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const formData = await request.formData();

		// Trata múltiplos dias selecionados (ex: checkboxes)
		const diasSelecionados = formData.getAll('dias');
		const diaSemanaTexto =
			diasSelecionados.length > 0
				? diasSelecionados.join(' e ')
				: (formData.get('diaSemana') as string) || '';

		const dadosBrutos = {
			descricao: formData.get('descricao'),
			diaSemana: diaSemanaTexto,
			horarioInicio: formData.get('horarioInicio'),
			horarioFim: formData.get('horarioFim'),
			professoresIds: formData.getAll('professoresIds')
		};

		const resultadoValidacao = turmaSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			const campo =
				issue?.path?.[0] !== undefined ? `[${String(issue.path[0])}] ` : '';
			const primeiroErro = `${campo}${issue?.message || 'Dados inválidos para turma'}`;
			return fail(400, {
				erro: primeiroErro,
				valores: dadosBrutos
			});
		}

		try {
			await cadastrarTurma(idAcademia, resultadoValidacao.data);
		} catch (erro: any) {
			const mensagem = erro.body?.message || erro.message || 'Falha ao cadastrar turma';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}

		throw redirect(303, '/dashboard/turmas');
	}
};
