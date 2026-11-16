import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	listarEventosGraduacaoDoDojo,
	buscarHistoricoDoAluno,
	obterDataUltimaGraduacaoAlunoIso,
	type HistoricoAlunoItem
} from '#lib/server/repositorios/graduacao.repo';
import { buscarAlunoPorId } from '#lib/server/repositorios/aluno.repo';
import { listarIdsAlunosDoResponsavel } from '#lib/server/repositorios/responsavel.repo';

export interface ProntuarioPessoalGraduacao {
	id_usuario: number;
	nome: string;
	idade: number;
	matricula: string | null;
	graduacao_atual: string;
	data_inicio: string | null;
	data_primeira_graduacao: string | null;
	data_ultima_graduacao_iso: string | null;
	nome_professor_responsavel: string;
	historico: HistoricoAlunoItem[];
}

export const load: PageServerLoad = async ({ locals }) => {
	const idAcademia = locals.idAcademia;
	const idUsuarioLogado = locals.usuario?.id;

	if (!idAcademia || !idUsuarioLogado) {
		throw redirect(302, '/login');
	}

	const idsAlvo = new Set<number>([idUsuarioLogado]);
	const idsTutelados = await listarIdsAlunosDoResponsavel(idAcademia, idUsuarioLogado);
	for (const idTut of idsTutelados) {
		idsAlvo.add(idTut);
	}

	const meusProntuarios: ProntuarioPessoalGraduacao[] = [];
	for (const idAlvo of idsAlvo) {
		const [aluno, historico, dataUltimaGraduacaoIso] = await Promise.all([
			buscarAlunoPorId(idAcademia, idAlvo),
			buscarHistoricoDoAluno(idAcademia, idAlvo),
			obterDataUltimaGraduacaoAlunoIso(idAlvo)
		]);

		if (aluno) {
			meusProntuarios.push({
				id_usuario: aluno.id_usuario,
				nome: aluno.nome,
				idade: aluno.idade,
				matricula: aluno.matricula,
				graduacao_atual: aluno.graduacao_atual,
				data_inicio: aluno.data_inicio,
				data_primeira_graduacao: aluno.data_primeira_graduacao,
				data_ultima_graduacao_iso: dataUltimaGraduacaoIso,
				nome_professor_responsavel: aluno.nome_professor_responsavel,
				historico
			});
		}
	}

	const ehAlunoPerfil = (locals.perfis || []).some(
		(p) =>
			p
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.trim() === 'aluno'
	);

	if (!ehAlunoPerfil && meusProntuarios.length === 0) {
		throw error(403, 'Esta página é exclusiva para usuários vinculados como aluno ou responsável.');
	}

	const eventos = await listarEventosGraduacaoDoDojo(idAcademia);

	return {
		meusProntuarios,
		eventos
	};
};
