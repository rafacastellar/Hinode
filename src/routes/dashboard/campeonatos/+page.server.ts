import type { PageServerLoad } from './$types';
import { exigirPermissao, temPermissao, normalizarNomePapel } from '#lib/server/auth/rbac';
import {
	listarCampeonatosDoDojo,
	listarDesempenhoPessoalCampeonatos,
	type DesempenhoPessoalCampeonatoItem
} from '#lib/server/repositorios/campeonato.repo';
import { listarIdsAlunosDoResponsavel } from '#lib/server/repositorios/responsavel.repo';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'CAMPEONATOS_VER');

	const idAcademia = locals.idAcademia!;
	const idUsuarioLogado = locals.usuario?.id;

	const ehGestorOuProfessor = perfis.some((p) => {
		const norm = normalizarNomePapel(p);
		return norm === 'admin' || norm === 'professor' || norm === 'recepcao';
	});
	const podeCriarCampeonato = temPermissao(perfis, 'CAMPEONATOS_CRIAR');

	const campeonatos = await listarCampeonatosDoDojo(idAcademia);

	let desempenhoPessoal: DesempenhoPessoalCampeonatoItem[] = [];
	if (!ehGestorOuProfessor && idUsuarioLogado) {
		const idsAlvo = new Set<number>([idUsuarioLogado]);
		const idsTutelados = await listarIdsAlunosDoResponsavel(idAcademia, idUsuarioLogado);
		for (const idTut of idsTutelados) {
			idsAlvo.add(idTut);
		}
		desempenhoPessoal = await listarDesempenhoPessoalCampeonatos(
			idAcademia,
			Array.from(idsAlvo)
		);
	}

	return {
		ehGestorOuProfessor,
		podeCriarCampeonato,
		campeonatos,
		desempenhoPessoal
	};
};
