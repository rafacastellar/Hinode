import { error } from '@sveltejs/kit';
import { executarTransacao } from '../db/pool';
import {
	obterOuCriarEventoGraduacaoEmTransacao,
	atualizarFaixaAlunoEmTransacao,
	inserirHistoricoGraduacaoEmTransacao,
	registrarLogAuditoriaEmTransacao
} from '../repositorios/graduacao.repo';
import { buscarAlunoPorId } from '../repositorios/aluno.repo';
import { listarProfessoresDoDojo } from '../repositorios/professor.repo';
import type { GraduacaoInput } from '../validacao/graduacao.schema';

export interface ResultadoGraduacao {
	sucesso: boolean;
	idHistorico: number;
	faixaAnterior: string;
	novaFaixa: string;
	mensagem: string;
}

/**
 * Homologa atomicamente a troca de faixa de um judoca com histórico imutável (Insert-Only).
 * SEGURANÇA: ACID com rollback total em qualquer falha e auditoria LGPD.
 */
export async function homologarTrocaDeFaixa(
	idAcademia: number,
	idUsuarioExecutor: number,
	dados: GraduacaoInput
): Promise<ResultadoGraduacao> {
	// 1. Valida se o aluno pertence à academia ativa
	const aluno = await buscarAlunoPorId(idAcademia, dados.idAluno);
	if (!aluno) {
		throw error(404, { message: 'Judoca não encontrado nesta academia.' });
	}

	// 2. Valida se o professor homologador pertence à academia ativa
	const professores = await listarProfessoresDoDojo(idAcademia);
	const professorValido = professores.some(
		(p) => p.id_usuario === dados.idProfessorHomologador
	);
	if (!professorValido) {
		throw error(400, {
			message: 'O sensei homologador selecionado não pertence a este dojo.'
		});
	}

	// 3. Validação de mudança real de faixa
	const faixaAnterior = aluno.graduacao_atual || 'Branca';
	if (faixaAnterior.trim().toLowerCase() === dados.novaFaixa.trim().toLowerCase()) {
		throw error(400, {
			message: `O judoca já possui a faixa ${dados.novaFaixa}. Selecione uma graduação diferente.`
		});
	}

	// 4. Execução da Transação ACID
	return await executarTransacao(async (conn) => {
		// A. Obtém ou cria o evento de graduação
		const idEvento = await obterOuCriarEventoGraduacaoEmTransacao(
			conn,
			idAcademia,
			dados.nomeEvento,
			dados.dataGraduacao
		);

		// B. Atualiza a faixa atual em Aluno
		await atualizarFaixaAlunoEmTransacao(conn, dados.idAluno, dados.novaFaixa);

		// C. Insere na tabela imutável Historico_Graduacao (insert-only)
		const idHistorico = await inserirHistoricoGraduacaoEmTransacao(conn, {
			idEventoGraduacao: idEvento,
			idAluno: dados.idAluno,
			idProfessorHomologador: dados.idProfessorHomologador,
			dataGraduacao: dados.dataGraduacao,
			associacao: dados.associacao,
			faixa: dados.novaFaixa
		});

		// D. Trilha de auditoria LGPD
		await registrarLogAuditoriaEmTransacao(conn, {
			idAcademia,
			idUsuario: idUsuarioExecutor,
			acao: 'HOMOLOGAR_GRADUACAO',
			entidade: 'Aluno',
			idEntidade: String(dados.idAluno),
			dadosAntes: {
				faixa_anterior: faixaAnterior
			},
			dadosDepois: {
				nova_faixa: dados.novaFaixa,
				id_professor_homologador: dados.idProfessorHomologador,
				data_graduacao: dados.dataGraduacao,
				id_historico: idHistorico
			}
		});

		return {
			sucesso: true,
			idHistorico,
			faixaAnterior,
			novaFaixa: dados.novaFaixa,
			mensagem: `Graduação do atleta ${aluno.nome} homologada com sucesso para a ${dados.novaFaixa}!`
		};
	});
}
