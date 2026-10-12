import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { buscarTurmaPorId } from '#lib/server/repositorios/turma.repo';
import { listarAlunos } from '#lib/server/repositorios/aluno.repo';
import { adicionarAlunoNaTurma, removerAlunoDaTurma } from '#lib/server/servicos/turma.service';

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

	// Busca todos os judocas do dojo para seleção rápida
	const todosAlunos = await listarAlunos(idAcademia);
	const idsJaMatriculados = new Set(turma.alunos_matriculados.map((a) => a.id_usuario));
	const alunosDisponiveis = todosAlunos.filter((a) => !idsJaMatriculados.has(a.id_usuario));

	return {
		turma,
		alunosDisponiveis
	};
};

export const actions: Actions = {
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
	}
};
