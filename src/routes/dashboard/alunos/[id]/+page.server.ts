import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import { buscarAlunoPorId } from '#lib/server/repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { obterDataUltimaGraduacaoAlunoIso } from '#lib/server/repositorios/graduacao.repo';
import { atualizarDadosAluno } from '#lib/server/servicos/aluno.service';
import {
	listarHistoricoPresencasAluno,
	obterMetricasDetalhadasPresencaAluno,
	listarTurmasMatriculadasDoAluno,
	registrarOuAtualizarPresencaIndividual
} from '#lib/server/repositorios/presenca.repo';
import type { StatusPresenca } from '#lib/server/validacao/turma.schema';

export const load: PageServerLoad = async ({ locals, params }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'ALUNOS_VER');

	const idAcademia = locals.idAcademia!;
	const idAluno = Number(params.id);
	if (isNaN(idAluno) || idAluno <= 0) {
		throw error(404, { message: 'Judoca não encontrado' });
	}

	const [aluno, professores, presencas, metricasPresenca, turmasMatriculadas, dataUltimaGraduacaoIso] = await Promise.all([
		buscarAlunoPorId(idAcademia, idAluno),
		listarProfessoresDoDojo(idAcademia),
		listarHistoricoPresencasAluno(idAcademia, idAluno, 200),
		obterMetricasDetalhadasPresencaAluno(idAcademia, idAluno),
		listarTurmasMatriculadasDoAluno(idAcademia, idAluno),
		obterDataUltimaGraduacaoAlunoIso(idAluno)
	]);

	if (!aluno) {
		throw error(404, { message: 'Judoca não encontrado neste dojo' });
	}

	const podeEditar = temPermissao(perfis, 'ALUNOS_EDITAR');
	const podeGerenciarUsuario = temPermissao(perfis, 'USUARIOS_GERENCIAR');
	const podeGerenciarPresenca = temPermissao(perfis, 'TURMAS_GERENCIAR');

	return {
		aluno,
		professores,
		presencas,
		metricasPresenca,
		turmasMatriculadas,
		dataUltimaGraduacaoIso,
		podeEditar,
		podeGerenciarUsuario,
		podeGerenciarPresenca
	};
};

export const actions: Actions = {
	atualizarDados: async ({ request, locals, params }) => {
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
	},

	lancarPresenca: async ({ request, locals, params }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'TURMAS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const idUsuarioExecutor = locals.usuario?.id || 1;
		const idAluno = Number(params.id);
		if (isNaN(idAluno) || idAluno <= 0) {
			return fail(400, { erroPresenca: 'ID de judoca inválido.' });
		}

		const formData = await request.formData();
		const idTreino = Number(formData.get('idTreino'));
		const dataTreino = String(formData.get('dataTreino') || '').trim();
		const status = String(formData.get('status') || 'Presente') as StatusPresenca;
		const observacao = String(formData.get('observacao') || '').trim() || null;

		if (isNaN(idTreino) || idTreino <= 0) {
			return fail(400, { erroPresenca: 'Selecione uma turma válida.' });
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(dataTreino)) {
			return fail(400, { erroPresenca: 'Informe uma data válida.' });
		}

		if (!['Presente', 'Falta', 'Justificada'].includes(status)) {
			return fail(400, { erroPresenca: 'Status de presença inválido.' });
		}

		try {
			await registrarOuAtualizarPresencaIndividual(
				idAcademia,
				idUsuarioExecutor,
				idAluno,
				idTreino,
				dataTreino,
				status,
				observacao
			);

			return {
				sucessoPresenca: 'Registro de presença salvo com sucesso no histórico do judoca!'
			};
		} catch (err: any) {
			return fail(400, {
				erroPresenca: err.message || 'Não foi possível salvar o registro de presença.'
			});
		}
	}
};
