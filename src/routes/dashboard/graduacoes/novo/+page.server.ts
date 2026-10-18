import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { cadastrarEventoGraduacao } from '#lib/server/servicos/graduacao.service';
import { eventoGraduacaoSchema } from '#lib/server/validacao/graduacao.schema';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'GRADUACOES_HOMOLOGAR');

		const idAcademia = locals.idAcademia!;
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

		let idNovoEvento = 0;
		try {
			const res = await cadastrarEventoGraduacao(idAcademia, resultadoValidacao.data);
			idNovoEvento = res.idEvento;
		} catch (erro: any) {
			const mensagem =
				erro.body?.message || erro.message || 'Falha ao agendar exame de graduação';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}

		throw redirect(303, `/dashboard/graduacoes/${idNovoEvento}`);
	}
};
