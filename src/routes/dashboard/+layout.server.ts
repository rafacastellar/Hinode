import type { LayoutServerLoad } from './$types';
import { calcularPermissoes, obterMenuAutorizado, normalizarNomePapel } from '#lib/server/auth/rbac';
import { contarPendenciasAcaoAluno } from '#lib/server/repositorios/dashboard.repo';

export const load: LayoutServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	const idAcademia = locals.idAcademia;
	const idUsuario = locals.usuario?.id;
	const permissoes = calcularPermissoes(perfis);

	const ehGestorOuProfessor = perfis.some((p) => {
		const norm = normalizarNomePapel(p);
		return norm === 'admin' || norm === 'professor' || norm === 'recepcao';
	});
	const ehAluno = perfis.some((p) => normalizarNomePapel(p) === 'aluno');

	let totalAcoesPendentes = 0;
	if (ehAluno && !ehGestorOuProfessor && idAcademia && idUsuario) {
		try {
			totalAcoesPendentes = await contarPendenciasAcaoAluno(idAcademia, idUsuario);
		} catch (e) {
			console.error('Erro ao verificar pendências do aluno para menu:', e);
		}
	}

	const itensMenu = obterMenuAutorizado(perfis).map((item) => {
		if (ehAluno && !ehGestorOuProfessor && item.href === '/dashboard' && totalAcoesPendentes > 0) {
			return {
				...item,
				badge: `${totalAcoesPendentes} pendente${totalAcoesPendentes > 1 ? 's' : ''}`,
				badgeUrgente: true
			};
		}
		return item;
	});

	return {
		usuario: locals.usuario,
		idAcademia,
		nomeAcademia: locals.nomeAcademia,
		perfis,
		permissoes,
		itensMenu,
		totalAcoesPendentes
	};
};
