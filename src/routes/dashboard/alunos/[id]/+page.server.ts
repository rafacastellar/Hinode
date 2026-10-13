import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { buscarAlunoPorId } from '#lib/server/repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { atualizarDadosAluno } from '#lib/server/servicos/aluno.service';

export const load: PageServerLoad = async ({ locals, params }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'ALUNOS_VER');

	const idAcademia = locals.idAcademia!;
	const idAluno = Number(params.id);
	if (isNaN(idAluno) || idAluno <= 0) {
		throw error(404, { message: 'Judoca não encontrado' });
	}

	const [aluno, professores] = await Promise.all([
		buscarAlunoPorId(idAcademia, idAluno),
		listarProfessoresDoDojo(idAcademia)
	]);

	if (!aluno) {
		throw error(404, { message: 'Judoca não encontrado neste dojo' });
	}

	return {
		aluno,
		professores
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'ALUNOS_EDITAR');

		const idAcademia = locals.idAcademia!;
		const idAluno = Number(params.id);
		if (isNaN(idAluno) || idAluno <= 0) {
			throw error(400, { message: 'ID de judoca inválido' });
		}

		const formData = await request.formData();
		const dadosBrutos = {
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

		try {
			const res = await atualizarDadosAluno(idAcademia, idAluno, dadosBrutos);
			return {
				sucesso: true,
				mensagem: res.mensagem
			};
		} catch (erro: any) {
			const mensagem = erro.body?.message || erro.message || 'Falha ao atualizar dados do judoca';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}
	}
};
