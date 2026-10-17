import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { buscarEventoGraduacaoPorId } from '#lib/server/repositorios/graduacao.repo';
import { editarEventoGraduacao } from '#lib/server/servicos/graduacao.service';
import { eventoGraduacaoSchema } from '#lib/server/validacao/graduacao.schema';

export const load: PageServerLoad = async ({ params, locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

	const idAcademia = locals.idAcademia!;
	const idEvento = parseInt(params.id, 10);
	if (isNaN(idEvento) || idEvento <= 0) {
		throw error(404, { message: 'Evento de graduação não encontrado.' });
	}

	const evento = await buscarEventoGraduacaoPorId(idAcademia, idEvento);
	if (!evento) {
		throw error(404, { message: 'Evento de graduação não encontrado nesta academia.' });
	}

	return {
		evento
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
		const idEvento = parseInt(params.id, 10);
		const formData = await request.formData();

		const dadosBrutos = {
			nome: formData.get('nome'),
			edicao: formData.get('edicao'),
			tipoGraduacao: formData.get('tipoGraduacao'),
			dataInicio: formData.get('dataInicio'),
			dataInicioInscricao: formData.get('dataInicioInscricao'),
			dataFimInscricao: formData.get('dataFimInscricao'),
			faixaInicio: formData.get('faixaInicio'),
			faixaFim: formData.get('faixaFim'),
			tempoMinimoJudoMeses: formData.get('tempoMinimoJudoMeses'),
			tempoMinimoUltimaGraduacaoMeses: formData.get('tempoMinimoUltimaGraduacaoMeses'),
			taxaGraduacao: formData.get('taxaGraduacao'),
			requisitos: formData.get('requisitos'),
			cidade: formData.get('cidade'),
			uf: formData.get('uf'),
			logradouro: formData.get('logradouro'),
			numero: formData.get('numero'),
			complemento: formData.get('complemento'),
			bairro: formData.get('bairro'),
			cep: formData.get('cep')
		};

		const resultadoValidacao = eventoGraduacaoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			const campo =
				issue?.path?.[0] !== undefined ? `[${String(issue.path[0])}] ` : '';
			const primeiroErro =
				`${campo}${issue?.message || 'Dados inválidos para o evento de graduação'}`;
			return fail(400, {
				erro: primeiroErro,
				valores: dadosBrutos
			});
		}

		try {
			await editarEventoGraduacao(idAcademia, idEvento, resultadoValidacao.data);
		} catch (erro: any) {
			const mensagem =
				erro.body?.message || erro.message || 'Falha ao atualizar exame de graduação';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}

		throw redirect(303, `/dashboard/graduacoes/${idEvento}`);
	}
};
