import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import { buscarTurmaPorId } from '#lib/server/repositorios/turma.repo';
import { listarAlunos } from '#lib/server/repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import {
	adicionarAlunoNaTurma,
	removerAlunoDaTurma,
	atualizarTurma,
	removerTurma
} from '#lib/server/servicos/turma.service';
import { turmaSchema } from '#lib/server/validacao/turma.schema';

export const load: PageServerLoad = async ({ params, locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'TURMAS_VER');

	const idAcademia = locals.idAcademia!;
	const idTreino = Number(params.id);

	if (isNaN(idTreino) || idTreino <= 0) {
		throw error(404, 'Turma inválida');
	}

	const turma = await buscarTurmaPorId(idAcademia, idTreino);
	if (!turma) {
		throw error(404, 'Turma não encontrada no dojo');
	}

	const podeGerenciar = temPermissao(perfis, 'TURMAS_GERENCIAR');
	const podeVerAlunos = temPermissao(perfis, 'ALUNOS_VER');

	// Busca judocas para matrícula apenas se tiver privilégio de gestão
	let alunosDisponiveis: typeof turma.alunos_matriculados = [];
	let professoresDojo: Awaited<ReturnType<typeof listarProfessoresDoDojo>> = [];

	if (podeGerenciar) {
		const todosAlunos = await listarAlunos(idAcademia);
		const idsJaMatriculados = new Set(turma.alunos_matriculados.map((a) => a.id_usuario));
		alunosDisponiveis = todosAlunos.filter((a) => !idsJaMatriculados.has(a.id_usuario));
		professoresDojo = await listarProfessoresDoDojo(idAcademia);
	}

	return {
		turma,
		alunosDisponiveis,
		professoresDojo,
		podeGerenciar,
		podeVerAlunos
	};
};

export const actions: Actions = {
	atualizar: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'TURMAS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const idTreino = Number(params.id);
		const formData = await request.formData();

		// Trata múltiplos dias selecionados
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
				erroEdicao: primeiroErro
			});
		}

		try {
			await atualizarTurma(idAcademia, idTreino, resultadoValidacao.data);
		} catch (erro: any) {
			const mensagem = erro.body?.message || erro.message || 'Falha ao atualizar turma';
			return fail(erro.status || 400, {
				erroEdicao: mensagem
			});
		}

		return { sucessoEdicao: true };
	},

	matricular: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'TURMAS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const idTreino = Number(params.id);
		const formData = await request.formData();
		const idAluno = Number(formData.get('idAluno'));

		if (isNaN(idAluno) || idAluno <= 0) {
			return fail(400, { erroMatricula: 'Selecione um judoca válido para matricular.' });
		}

		try {
			await adicionarAlunoNaTurma(idAcademia, idTreino, idAluno);
		} catch (err: any) {
			return fail(400, { erroMatricula: err.message || 'Falha ao matricular judoca na turma.' });
		}

		return { sucessoMatricula: true };
	},

	desmatricular: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'TURMAS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const idTreino = Number(params.id);
		const formData = await request.formData();
		const idAluno = Number(formData.get('idAluno'));

		if (isNaN(idAluno) || idAluno <= 0) {
			return fail(400, { erro: 'ID de judoca inválido.' });
		}

		try {
			await removerAlunoDaTurma(idAcademia, idTreino, idAluno);
		} catch (err: any) {
			return fail(400, { erro: err.message || 'Falha ao remover judoca da turma.' });
		}

		return { sucessoRemocao: true };
	},

	excluir: async ({ params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'TURMAS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const idTreino = Number(params.id);

		try {
			await removerTurma(idAcademia, idTreino);
		} catch (err: any) {
			return fail(400, { erro: err.message || 'Falha ao excluir turma.' });
		}

		throw redirect(303, '/dashboard/turmas');
	}
};
