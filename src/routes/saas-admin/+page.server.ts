import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import {
	obterTelemetriaServidor,
	obterTelemetriaBanco,
	listarSessoesAtivasPlataforma,
	encerrarSessaoPeloAdminSaas,
	listarAcademiasSaas
} from '#lib/server/repositorios/saas-admin.repo';

export const load: PageServerLoad = async () => {
	const telemetriaServidor = obterTelemetriaServidor();
	const telemetriaBanco = await obterTelemetriaBanco();
	const sessoesAtivas = await listarSessoesAtivasPlataforma();
	const academias = await listarAcademiasSaas();

	return {
		telemetriaServidor,
		telemetriaBanco,
		sessoesAtivas,
		academias
	};
};

export const actions: Actions = {
	encerrarSessao: async ({ request }) => {
		const formData = await request.formData();
		const idSessao = Number(formData.get('idSessao'));

		if (!idSessao) {
			return fail(400, { erro: 'ID da sessão não fornecido.' });
		}

		try {
			await encerrarSessaoPeloAdminSaas(idSessao);
			return { sucesso: true, mensagem: 'Sessão revogada imediatamente pelo Super Admin.' };
		} catch (erro: any) {
			return fail(400, { erro: erro?.message || 'Falha ao encerrar sessão.' });
		}
	}
};

