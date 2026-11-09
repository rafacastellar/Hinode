import type { LayoutServerLoad } from './$types';
import { calcularPermissoes, obterMenuAutorizado, normalizarNomePapel } from '#lib/server/auth/rbac';
import { contarPendenciasAcaoAluno } from '#lib/server/repositorios/dashboard.repo';
import { contarAlunosDoResponsavel } from '#lib/server/repositorios/responsavel.repo';
import { buscarPerfilCompletoParaUsuario } from '#lib/server/repositorios/usuario.repo';

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

	let totalDependentes = 0;
	if (idAcademia && idUsuario) {
		try {
			totalDependentes = await contarAlunosDoResponsavel(idAcademia, idUsuario);
		} catch (e) {
			console.error('Erro ao verificar dependentes do responsável para menu:', e);
		}
	}

	let resumoCredenciais: {
		aluno?: { matricula: string | null; graduacaoAtual: string; nomeSensei: string } | null;
		professor?: { grauFaixa: string | null; nFederacao: string | null } | null;
	} = {};

	if (idAcademia && idUsuario) {
		try {
			const perfilCompleto = await buscarPerfilCompletoParaUsuario(idAcademia, idUsuario);
			if (perfilCompleto) {
				resumoCredenciais = {
					aluno: perfilCompleto.dados_aluno
						? {
								matricula: perfilCompleto.dados_aluno.matricula,
								graduacaoAtual: perfilCompleto.dados_aluno.graduacao_atual,
								nomeSensei: perfilCompleto.dados_aluno.nome_professor_responsavel
							}
						: null,
					professor: perfilCompleto.dados_professor
						? {
								grauFaixa: perfilCompleto.dados_professor.grau_faixa,
								nFederacao: perfilCompleto.dados_professor.n_federacao
							}
						: null
				};
			}
		} catch (e) {
			console.error('Erro ao carregar resumo de credenciais para barra superior:', e);
		}
	}

	const itensMenu = obterMenuAutorizado(perfis, { totalDependentes }).map((item) => {
		if (ehAluno && !ehGestorOuProfessor && item.href === '/dashboard' && totalAcoesPendentes > 0) {
			return {
				...item,
				badge: `${totalAcoesPendentes} pendente${totalAcoesPendentes > 1 ? 's' : ''}`,
				badgeUrgente: true
			};
		}
		if (item.href === '/dashboard/responsavel' && totalDependentes > 0) {
			return {
				...item,
				badge: `${totalDependentes} judoca${totalDependentes > 1 ? 's' : ''}`
			};
		}
		return item;
	});

	return {
		usuario: locals.usuario,
		idAcademia,
		nomeAcademia: locals.nomeAcademia,
		logoAcademia: locals.logoAcademia,
		perfis,
		permissoes,
		itensMenu,
		totalAcoesPendentes,
		totalDependentes,
		resumoCredenciais
	};
};
