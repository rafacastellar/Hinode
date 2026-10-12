import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import {
	buscarCampeonatoPorId,
	listarInscricoesDoCampeonato,
	listarResultadosDoCampeonato
} from '#lib/server/repositorios/campeonato.repo';
import { listarAlunos } from '#lib/server/repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import {
	inscreverCompetidor,
	mudarStatusInscricao,
	registrarResultadoCampeonato
} from '#lib/server/servicos/campeonato.service';
import { inscricaoSchema, resultadoSchema } from '#lib/server/validacao/campeonato.schema';

export const load: PageServerLoad = async ({ params, locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'CAMPEONATOS_VER');

	const idAcademia = locals.idAcademia!;
	const idEvento = Number(params.id);

	if (isNaN(idEvento) || idEvento <= 0) {
		throw error(404, 'Campeonato inválido');
	}

	const campeonato = await buscarCampeonatoPorId(idAcademia, idEvento);
	if (!campeonato) {
		throw error(404, 'Campeonato não encontrado nesta academia.');
	}

	const [inscricoes, resultados, alunos, professores] = await Promise.all([
		listarInscricoesDoCampeonato(idAcademia, idEvento),
		listarResultadosDoCampeonato(idAcademia, idEvento),
		listarAlunos(idAcademia),
		listarProfessoresDoDojo(idAcademia)
	]);

	return {
		campeonato,
		inscricoes,
		resultados,
		alunos,
		professores
	};
};

export const actions: Actions = {
	inscrever: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_INSCREVER');

		const idAcademia = locals.idAcademia!;
		const idEvento = Number(params.id);
		const formData = await request.formData();

		const dadosBrutos = {
			idEvento,
			tipoParticipante: formData.get('tipoParticipante'),
			idParticipante: formData.get('idParticipante'),
			valor: formData.get('valor'),
			statusInscricao: formData.get('statusInscricao') || 'Pendente'
		};

		const resultadoValidacao = inscricaoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			const primeiroErro = issue?.message || 'Dados de inscrição inválidos';
			return fail(400, { erroInscricao: primeiroErro });
		}

		try {
			await inscreverCompetidor(idAcademia, resultadoValidacao.data);
		} catch (err: any) {
			const msg = err.body?.message || err.message || 'Falha ao inscrever competidor';
			return fail(400, { erroInscricao: msg });
		}

		return { sucessoInscricao: true };
	},

	alterarStatus: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_INSCREVER');

		const idAcademia = locals.idAcademia!;
		const formData = await request.formData();
		const idInscricao = Number(formData.get('idInscricao'));
		const novoStatus = formData.get('novoStatus') as 'Pendente' | 'Confirmada' | 'Cancelada';

		if (isNaN(idInscricao) || !novoStatus) {
			return fail(400, { erro: 'Parâmetros de status inválidos' });
		}

		try {
			await mudarStatusInscricao(idAcademia, idInscricao, novoStatus);
		} catch (err: any) {
			return fail(400, { erro: err.message || 'Falha ao alterar status' });
		}

		return { sucessoStatus: true };
	},

	lancarResultado: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_RESULTADOS');

		const idAcademia = locals.idAcademia!;
		const idCampeonato = Number(params.id);
		const formData = await request.formData();

		const dadosBrutos = {
			idCampeonato,
			idAluno: formData.get('idAluno'),
			classificacaoAluno: formData.get('classificacaoAluno'),
			qtdLutas: formData.get('qtdLutas'),
			qtdVitorias: formData.get('qtdVitorias')
		};

		const resultadoValidacao = resultadoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			const primeiroErro = issue?.message || 'Dados de resultado inválidos';
			return fail(400, { erroResultado: primeiroErro });
		}

		try {
			await registrarResultadoCampeonato(idAcademia, resultadoValidacao.data);
		} catch (err: any) {
			const msg = err.body?.message || err.message || 'Falha ao gravar resultado do atleta';
			return fail(400, { erroResultado: msg });
		}

		return { sucessoResultado: true };
	}
};
