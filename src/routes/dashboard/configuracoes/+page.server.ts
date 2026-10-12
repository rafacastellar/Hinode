import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { exigirPermissao } from '#lib/server/auth/rbac';
import {
	buscarDadosAcademia,
	buscarEstatisticasSeguranca,
	listarLogsAuditoria
} from '#lib/server/repositorios/academia.repo';
import { getStorageProvider } from '#lib/server/storage';
import { executarJobLembretesInscricao } from '#lib/server/jobs/lembretes-inscricao.job';

export const load: PageServerLoad = async ({ locals }) => {
	// SEGURANÇA RBAC: Apenas perfil com privilégio administrativo pode acessar
	exigirPermissao(locals.perfis, 'ACADEMIA_CONFIGURAR');

	const idAcademia = locals.idAcademia;
	if (!idAcademia) {
		throw error(401, 'Sessão expirada ou não autenticada.');
	}

	const academia = await buscarDadosAcademia(idAcademia);

	if (!academia) {
		throw error(404, 'Dados cadastrais da academia não encontrados.');
	}

	const estatisticas = await buscarEstatisticasSeguranca(idAcademia);
	const logsAuditoria = await listarLogsAuditoria(idAcademia, 30);
	const provedorStorage = getStorageProvider();

	return {
		academia,
		estatisticas,
		logsAuditoria,
		cloudReadiness: {
			storageDriver: provedorStorage.obterNomeProvedor(),
			sessaoStateless: true,
			bancoDriver: 'mysql2/promise (Prepared Statements)',
			ambiente: process.env.NODE_ENV || 'development'
		}
	};
};

export const actions: Actions = {
	testarJobLembretes: async ({ locals }) => {
		exigirPermissao(locals.perfis, 'ACADEMIA_CONFIGURAR');

		try {
			const resultado = await executarJobLembretesInscricao();
			return {
				sucesso: true,
				mensagem: 'Job de lembretes executado com sucesso.',
				relatorioJob: resultado
			};
		} catch (erro: any) {
			return {
				sucesso: false,
				mensagem: erro?.message || 'Falha ao executar rotina de lembretes.'
			};
		}
	}
};
