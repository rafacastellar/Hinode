import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao, temPermissao, normalizarNomePapel } from '#lib/server/auth/rbac';
import { buscarAlunoPorId } from '#lib/server/repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { buscarHistoricoDoAluno } from '#lib/server/repositorios/graduacao.repo';
import { listarIdsAlunosDoResponsavel } from '#lib/server/repositorios/responsavel.repo';
import { registrarLoteHistoricoAluno } from '#lib/server/servicos/graduacao.service';
import { loteHistoricoAlunoSchema } from '#lib/server/validacao/graduacao.schema';

export const load: PageServerLoad = async ({ params, locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_VER');

	const idAcademia = locals.idAcademia!;
	const idUsuarioLogado = locals.usuario?.id;
	const idAluno = Number(params.alunoId);

	if (isNaN(idAluno) || idAluno <= 0) {
		throw error(404, 'Judoca inválido');
	}

	const ehGestorOuProfessor = perfis.some((p) => {
		const norm = normalizarNomePapel(p);
		return norm === 'admin' || norm === 'professor' || norm === 'recepcao';
	});

	// Trava de segurança (LGPD): Aluno e Responsável só podem visualizar seu próprio prontuário
	// ou o prontuário de seus dependentes tutelados.
	if (!ehGestorOuProfessor) {
		const idsPermitidos = new Set<number>();
		if (idUsuarioLogado) {
			idsPermitidos.add(idUsuarioLogado);
			const idsTutelados = await listarIdsAlunosDoResponsavel(idAcademia, idUsuarioLogado);
			for (const idTut of idsTutelados) {
				idsPermitidos.add(idTut);
			}
		}

		if (!idsPermitidos.has(idAluno)) {
			throw error(403, 'Acesso restrito: você só pode consultar o seu próprio prontuário de faixas ou o dos judocas sob sua tutela.');
		}
	}

	const [aluno, historico, professores] = await Promise.all([
		buscarAlunoPorId(idAcademia, idAluno),
		buscarHistoricoDoAluno(idAcademia, idAluno),
		ehGestorOuProfessor ? listarProfessoresDoDojo(idAcademia) : Promise.resolve([])
	]);

	if (!aluno) {
		throw error(404, 'Judoca não encontrado no dojo');
	}

	return {
		aluno,
		historico,
		professores,
		podeHomologar: temPermissao(perfis, 'GRADUACOES_HOMOLOGAR')
	};
};

export const actions: Actions = {
	registrarLoteHistorico: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
		const idUsuarioExecutor = locals.usuario?.id || 1;
		const idAluno = Number(params.alunoId);

		if (isNaN(idAluno) || idAluno <= 0) {
			return fail(400, { erro: 'Judoca inválido.' });
		}

		const formData = await request.formData();
		const origemRegistro = String(formData.get('origemRegistro') || 'HISTORICO_ANTERIOR');
		const idProfessorHomologador = formData.get('idProfessorHomologador');
		const nomeExaminadorExterno = String(formData.get('nomeExaminadorExterno') || '');
		const associacaoPadrao = String(formData.get('associacaoPadrao') || 'FPJ / CBJ');
		const descricaoOrigemPadrao = String(formData.get('descricaoOrigemPadrao') || '');
		const etapasJsonRaw = String(formData.get('etapasJson') || '[]');

		let etapasBrutas: any[] = [];
		try {
			etapasBrutas = JSON.parse(etapasJsonRaw);
		} catch {
			return fail(400, { erro: 'Formato inválido das faixas informadas.' });
		}

		const validacao = loteHistoricoAlunoSchema.safeParse({
			idAluno,
			origemRegistro,
			idProfessorHomologador,
			nomeExaminadorExterno,
			associacaoPadrao,
			descricaoOrigemPadrao,
			etapas: etapasBrutas
		});

		if (!validacao.success) {
			const issue = validacao.error.issues?.[0];
			return fail(400, {
				erro: issue?.message || 'Verifique os dados das faixas e datas informadas.'
			});
		}

		try {
			const res = await registrarLoteHistoricoAluno(
				idAcademia,
				idUsuarioExecutor,
				validacao.data
			);

			return {
				sucesso: true,
				mensagem: res.mensagem
			};
		} catch (err: any) {
			const mensagem =
				err.body?.message || err.message || 'Falha ao registrar histórico de faixas do judoca.';
			return fail(err.status || 400, { erro: mensagem });
		}
	}
};
