import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao, temPermissao, normalizarNomePapel } from '#lib/server/auth/rbac';
import {
	buscarEventoGraduacaoPorId,
	listarCandidatosDoDojoComElegibilidade,
	listarInscricoesDoEventoGraduacao
} from '#lib/server/repositorios/graduacao.repo';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { listarIdsAlunosDoResponsavel } from '#lib/server/repositorios/responsavel.repo';
import {
	inscreverAlunoNoExame,
	cancelarInscricaoAlunoNoExame,
	homologarAprovacaoNoExame,
	homologarAprovadosEmLote,
	excluirEventoGraduacaoDoDojo
} from '#lib/server/servicos/graduacao.service';
import { homologacaoEventoSchema } from '#lib/server/validacao/graduacao.schema';

export const load: PageServerLoad = async ({ params, locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_VER');

	const idAcademia = locals.idAcademia!;
	const idUsuarioLogado = locals.usuario?.id;
	const idEvento = parseInt(params.id, 10);
	if (isNaN(idEvento) || idEvento <= 0) {
		throw error(404, { message: 'Evento de graduação não encontrado.' });
	}

	const ehGestorOuProfessor = perfis.some((p) => {
		const norm = normalizarNomePapel(p);
		return norm === 'admin' || norm === 'professor' || norm === 'recepcao';
	});

	const [evento, todosCandidatos, todasInscricoes, professores] = await Promise.all([
		buscarEventoGraduacaoPorId(idAcademia, idEvento),
		listarCandidatosDoDojoComElegibilidade(idAcademia, idEvento),
		listarInscricoesDoEventoGraduacao(idAcademia, idEvento),
		ehGestorOuProfessor ? listarProfessoresDoDojo(idAcademia) : Promise.resolve([])
	]);

	if (!evento) {
		throw error(404, { message: 'Exame de graduação não encontrado nesta academia.' });
	}

	// Se for Aluno ou Responsável, filtra candidatos e inscrições APENAS para o próprio judoca ou seus tutelados
	let candidatos = todosCandidatos;
	let inscricoes = todasInscricoes;

	if (!ehGestorOuProfessor) {
		const idsPermitidos = new Set<number>();
		if (idUsuarioLogado) {
			idsPermitidos.add(idUsuarioLogado);
			const idsTutelados = await listarIdsAlunosDoResponsavel(idAcademia, idUsuarioLogado);
			for (const idTut of idsTutelados) {
				idsPermitidos.add(idTut);
			}
		}

		candidatos = todosCandidatos.filter((c) => idsPermitidos.has(c.id_aluno));
		inscricoes = todasInscricoes.filter((i) => idsPermitidos.has(i.id_aluno));
	}

	return {
		evento,
		candidatos,
		inscricoes,
		professores,
		ehGestorOuProfessor,
		podeGerenciar: temPermissao(perfis, 'GRADUACOES_HOMOLOGAR')
	};
};

export const actions: Actions = {
	inscrever: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
		const idEvento = parseInt(params.id, 10);
		const formData = await request.formData();

		const idAluno = Number(formData.get('idAluno'));
		const novaFaixa = (formData.get('novaFaixa') as string) || null;
		const valor = Number(formData.get('valor') || 0);

		if (!idAluno || isNaN(idAluno)) {
			return fail(400, { erro: 'Judoca inválido para inscrição.' });
		}

		try {
			await inscreverAlunoNoExame(idAcademia, {
				idEvento,
				idAluno,
				novaFaixa,
				valor
			});
			return { sucesso: true, mensagem: 'Judoca inscrito no exame com sucesso!' };
		} catch (err: any) {
			const mensagem = err.body?.message || err.message || 'Falha ao inscrever judoca no exame.';
			return fail(err.status || 400, { erro: mensagem });
		}
	},

	cancelarInscricao: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
		const idEvento = parseInt(params.id, 10);
		const formData = await request.formData();

		const idAluno = Number(formData.get('idAluno'));
		if (!idAluno || isNaN(idAluno)) {
			return fail(400, { erro: 'Judoca inválido para cancelamento.' });
		}

		try {
			await cancelarInscricaoAlunoNoExame(idAcademia, idEvento, idAluno);
			return { sucesso: true, mensagem: 'Inscrição cancelada com sucesso.' };
		} catch (err: any) {
			const mensagem = err.body?.message || err.message || 'Falha ao cancelar inscrição.';
			return fail(err.status || 400, { erro: mensagem });
		}
	},

	homologarIndividual: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
		const idUsuarioExecutor = locals.usuario?.id || 1;
		const idEvento = parseInt(params.id, 10);
		const formData = await request.formData();

		const dadosBrutos = {
			idEvento,
			idAluno: formData.get('idAluno'),
			novaFaixa: formData.get('novaFaixa'),
			idProfessorHomologador: formData.get('idProfessorHomologador'),
			dataGraduacao: formData.get('dataGraduacao'),
			associacao: formData.get('associacao')
		};

		const resultadoValidacao = homologacaoEventoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			return fail(400, {
				erro: issue?.message || 'Dados inválidos para homologação da graduação'
			});
		}

		try {
			await homologarAprovacaoNoExame(
				idAcademia,
				idUsuarioExecutor,
				resultadoValidacao.data
			);
			return {
				sucesso: true,
				mensagem: 'Graduação homologada com sucesso no histórico oficial do dojo!'
			};
		} catch (err: any) {
			const mensagem =
				err.body?.message || err.message || 'Falha ao homologar graduação do atleta.';
			return fail(err.status || 400, { erro: mensagem });
		}
	},

	homologarLote: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
		const idUsuarioExecutor = locals.usuario?.id || 1;
		const idEvento = parseInt(params.id, 10);
		const formData = await request.formData();

		const idProfessorHomologador = Number(formData.get('idProfessorHomologador'));
		const dataGraduacao = String(formData.get('dataGraduacao') || '');
		const associacao = String(formData.get('associacao') || 'FPJ / Federação Paulista de Judô');
		const aprovadosRaw = String(formData.get('aprovadosJson') || '[]');

		if (!idProfessorHomologador || isNaN(idProfessorHomologador)) {
			return fail(400, { erro: 'Selecione o Sensei examinador para a banca.' });
		}

		let listaAprovados: Array<{ idAluno: number; novaFaixa: string }> = [];
		try {
			listaAprovados = JSON.parse(aprovadosRaw);
		} catch {
			return fail(400, { erro: 'Lista de judocas aprovados em formato inválido.' });
		}

		if (!Array.isArray(listaAprovados) || listaAprovados.length === 0) {
			return fail(400, { erro: 'Nenhum atleta foi selecionado para homologação em lote.' });
		}

		try {
			const res = await homologarAprovadosEmLote(
				idAcademia,
				idUsuarioExecutor,
				idEvento,
				listaAprovados.map((item) => ({
					idAluno: item.idAluno,
					novaFaixa: item.novaFaixa,
					idProfessorHomologador,
					dataGraduacao,
					associacao
				}))
			);

			return {
				sucesso: true,
				mensagem: `${res.totalHomologados} ${res.totalHomologados === 1 ? 'graduação homologada' : 'graduações homologadas'} com sucesso no histórico oficial do dojo!`
			};
		} catch (err: any) {
			const mensagem =
				err.body?.message || err.message || 'Falha na homologação em lote das graduações.';
			return fail(err.status || 400, { erro: mensagem });
		}
	},

	excluirEvento: async ({ params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
		const idEvento = parseInt(params.id, 10);

		try {
			await excluirEventoGraduacaoDoDojo(idAcademia, idEvento);
		} catch (err: any) {
			const mensagem =
				err.body?.message || err.message || 'Falha ao excluir evento de graduação.';
			return fail(err.status || 400, { erro: mensagem });
		}

		throw redirect(303, '/dashboard/graduacoes');
	}
};
