import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao, temPermissao } from '#lib/server/auth/rbac';
import {
	buscarCampeonatoPorId,
	listarInscricoesDoCampeonato,
	listarResultadosDoCampeonato
} from '#lib/server/repositorios/campeonato.repo';
import { listarAlunos, buscarAlunoPorId } from '#lib/server/repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '#lib/server/repositorios/professor.repo';
import { listarAlunosDoResponsavel } from '#lib/server/repositorios/responsavel.repo';
import {
	inscreverCompetidor,
	autoInscreverCompetidor,
	confirmarParticipacaoPeloAtleta,
	confirmarParticipacaoPeloResponsavel,
	removerAtletaDoCampeonato,
	excluirCampeonatoDoDojo,
	mudarStatusInscricao,
	registrarResultadoCampeonato
} from '#lib/server/servicos/campeonato.service';
import {
	validarElegibilidadeCompleta,
	formatarIntervaloFaixas,
	formatarIdadeLimite,
	validarPeriodoInscricao,
	formatarPeriodoInscricao
} from '#lib/server/servicos/regras-campeonato';
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

	const [inscricoes, resultados, alunosBrutos, professores] = await Promise.all([
		listarInscricoesDoCampeonato(idAcademia, idEvento),
		listarResultadosDoCampeonato(idAcademia, idEvento),
		listarAlunos(idAcademia),
		listarProfessoresDoDojo(idAcademia)
	]);

	// Pré-computa elegibilidade de cada aluno com base no novo validador unificado
	const alunos = alunosBrutos.map((aluno) => {
		const elegibilidade = validarElegibilidadeCompleta({
			faixaInicio: campeonato.faixa_inicio,
			faixaFim: campeonato.faixa_fim,
			limiteGrupo: campeonato.limite_grupo,
			idadeMinima: campeonato.idade_minima,
			idadeMaxima: campeonato.idade_maxima,
			faixaAtleta: aluno.graduacao_atual,
			grupoAtleta: aluno.grupo_especial_aspirante,
			idadeAtleta: aluno.idade
		});
		return {
			...aluno,
			elegivel: elegibilidade.elegivel,
			motivoInelegivel: elegibilidade.motivo || null
		};
	});

	const rotuloFaixas = formatarIntervaloFaixas(campeonato.faixa_inicio, campeonato.faixa_fim);
	const rotuloIdade = formatarIdadeLimite(campeonato.idade_minima, campeonato.idade_maxima);

	const ehProfessorOuAdmin = temPermissao(perfis, 'CAMPEONATOS_GERENCIAR');

	// Contexto para Abordagem B: Auto-inscrição do Judoca ou do Responsável Legal
	let alunoLogadoAuto: {
		id_usuario: number;
		nome: string;
		graduacao_atual: string;
		idade: number;
		menor_idade: boolean;
		elegivel: boolean;
		motivoInelegivel: string | null;
		inscricao: (typeof inscricoes)[number] | null;
	} | null = null;

	let dependentesResponsavel: Array<{
		id_usuario: number;
		nome: string;
		graduacao_atual: string;
		idade: number;
		menor_idade: boolean;
		grau_parentesco: string;
		elegivel: boolean;
		motivoInelegivel: string | null;
		inscricao: (typeof inscricoes)[number] | null;
	}> = [];

	const idUsuarioLogado = locals.usuario?.id;
	if (idUsuarioLogado) {
		const ehAluno = perfis.some((p) => p.toLowerCase().includes('aluno'));
		const ehResponsavel = perfis.some((p) => p.toLowerCase().includes('respons'));

		if (ehAluno) {
			const alunoInfo = await buscarAlunoPorId(idAcademia, idUsuarioLogado);
			if (alunoInfo) {
				const eleg = validarElegibilidadeCompleta({
					faixaInicio: campeonato.faixa_inicio,
					faixaFim: campeonato.faixa_fim,
					limiteGrupo: campeonato.limite_grupo,
					idadeMinima: campeonato.idade_minima,
					idadeMaxima: campeonato.idade_maxima,
					faixaAtleta: alunoInfo.graduacao_atual,
					grupoAtleta: alunoInfo.grupo_especial_aspirante,
					idadeAtleta: alunoInfo.idade
				});
				const inscricaoExistente = inscricoes.find(
					(i) => i.tipo_participante === 'aluno' && i.id_participante === alunoInfo.id_usuario
				) || null;

				alunoLogadoAuto = {
					id_usuario: alunoInfo.id_usuario,
					nome: alunoInfo.nome,
					graduacao_atual: alunoInfo.graduacao_atual,
					idade: alunoInfo.idade,
					menor_idade: alunoInfo.menor_idade,
					elegivel: eleg.elegivel,
					motivoInelegivel: eleg.motivo || null,
					inscricao: inscricaoExistente
				};
			}
		}

		if (ehResponsavel) {
			const listaDeps = await listarAlunosDoResponsavel(idAcademia, idUsuarioLogado);
			dependentesResponsavel = listaDeps.map((dep) => {
				const eleg = validarElegibilidadeCompleta({
					faixaInicio: campeonato.faixa_inicio,
					faixaFim: campeonato.faixa_fim,
					limiteGrupo: campeonato.limite_grupo,
					idadeMinima: campeonato.idade_minima,
					idadeMaxima: campeonato.idade_maxima,
					faixaAtleta: dep.graduacao_atual,
					grupoAtleta: dep.grupo_especial_aspirante,
					idadeAtleta: dep.idade
				});
				const inscricaoExistente = inscricoes.find(
					(i) => i.tipo_participante === 'aluno' && i.id_participante === dep.id_usuario
				) || null;

				return {
					id_usuario: dep.id_usuario,
					nome: dep.nome,
					graduacao_atual: dep.graduacao_atual,
					idade: dep.idade,
					menor_idade: dep.menor_idade,
					grau_parentesco: dep.grau_parentesco,
					elegivel: eleg.elegivel,
					motivoInelegivel: eleg.motivo || null,
					inscricao: inscricaoExistente
				};
			});
		}
	}

	const statusPeriodoInscricao = validarPeriodoInscricao(
		campeonato.data_inicio_inscricao_iso,
		campeonato.data_fim_inscricao_iso
	);
	const rotuloPeriodoInscricao = formatarPeriodoInscricao(
		campeonato.data_inicio_inscricao,
		campeonato.data_fim_inscricao
	);

	return {
		campeonato,
		rotuloFaixas,
		rotuloIdade,
		statusPeriodoInscricao,
		rotuloPeriodoInscricao,
		inscricoes,
		resultados,
		alunos,
		professores,
		alunoLogadoAuto,
		dependentesResponsavel,
		usuarioLogadoId: locals.usuario?.id,
		ehProfessorOuAdmin
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
			statusInscricao: 'Pendente'
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

	autoInscrever: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_INSCREVER');

		const idAcademia = locals.idAcademia!;
		const idEvento = Number(params.id);
		const formData = await request.formData();

		const idAlunoStr = formData.get('idAluno');
		const idAluno = idAlunoStr ? Number(idAlunoStr) : locals.usuario?.id;

		if (!idAluno || isNaN(idAluno) || idAluno <= 0) {
			return fail(400, { erro: 'Atleta não informado para inscrição' });
		}

		const ehResponsavel = perfis.some((p) => p.toLowerCase().includes('respons'));

		try {
			const res = await autoInscreverCompetidor(
				idAcademia,
				idEvento,
				idAluno,
				locals.usuario!.id,
				ehResponsavel
			);

			const mensagem =
				res.novoStatus === 'Confirmada'
					? 'Inscrição confirmada com sucesso! O judoca já consta na lista oficial de participantes.'
					: 'Inscrição realizada! Aguarda confirmação do atleta ou autorização do responsável legal.';

			return { sucessoAutoInscricao: mensagem };
		} catch (err: any) {
			const msg = err.body?.message || err.message || 'Falha ao processar auto-inscrição';
			return fail(400, { erro: msg });
		}
	},

	confirmarAtleta: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_VER');

		const idAcademia = locals.idAcademia!;
		const formData = await request.formData();
		const idInscricao = Number(formData.get('idInscricao'));

		if (isNaN(idInscricao) || idInscricao <= 0) {
			return fail(400, { erro: 'Inscrição inválida para confirmação' });
		}

		try {
			const resultado = await confirmarParticipacaoPeloAtleta(idAcademia, idInscricao);
			return {
				sucessoConfirmacao:
					resultado.novoStatus === 'Confirmada'
						? 'Participação do atleta confirmada! Ele já aparece na lista oficial de participantes.'
						: 'Confirmação do judoca registrada! Como o atleta é menor de idade, aguarda autorização do responsável legal.'
			};
		} catch (err: any) {
			return fail(400, { erro: err.message || 'Falha ao confirmar participação do atleta' });
		}
	},

	confirmarResponsavel: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_VER');

		const idAcademia = locals.idAcademia!;
		const formData = await request.formData();
		const idInscricao = Number(formData.get('idInscricao'));

		if (isNaN(idInscricao) || idInscricao <= 0) {
			return fail(400, { erro: 'Inscrição inválida para autorização' });
		}

		try {
			const resultado = await confirmarParticipacaoPeloResponsavel(idAcademia, idInscricao);
			return {
				sucessoConfirmacao:
					resultado.novoStatus === 'Confirmada'
						? 'Autorização do responsável legal registrada! O judoca agora aparece na lista oficial de participantes.'
						: 'Autorização do responsável registrada! Aguardando confirmação do judoca.'
			};
		} catch (err: any) {
			return fail(400, { erro: err.message || 'Falha ao registrar autorização do responsável' });
		}
	},

	removerAtleta: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const formData = await request.formData();
		const idInscricao = Number(formData.get('idInscricao'));

		if (isNaN(idInscricao) || idInscricao <= 0) {
			return fail(400, { erro: 'Inscrição inválida para remoção' });
		}

		try {
			await removerAtletaDoCampeonato(idAcademia, idInscricao);
			return { sucessoRemocao: 'Atleta removido da lista do campeonato com sucesso.' };
		} catch (err: any) {
			return fail(400, { erro: err.message || 'Falha ao remover competidor do campeonato' });
		}
	},

	excluir: async ({ params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const idEvento = Number(params.id);

		if (isNaN(idEvento) || idEvento <= 0) {
			return fail(400, { erro: 'Campeonato inválido para exclusão' });
		}

		try {
			await excluirCampeonatoDoDojo(idAcademia, idEvento);
		} catch (err: any) {
			const msg = err.body?.message || err.message || 'Falha ao excluir campeonato';
			return fail(400, { erro: msg });
		}

		throw redirect(303, '/dashboard/campeonatos');
	},

	alterarStatus: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_GERENCIAR');

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
