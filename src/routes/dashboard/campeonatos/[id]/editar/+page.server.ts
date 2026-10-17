import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { buscarCampeonatoPorId } from '#lib/server/repositorios/campeonato.repo';
import { editarCampeonato } from '#lib/server/servicos/campeonato.service';
import { campeonatoSchema } from '#lib/server/validacao/campeonato.schema';

export const load: PageServerLoad = async ({ params, locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'CAMPEONATOS_GERENCIAR');

	const idAcademia = locals.idAcademia!;
	const idEvento = Number(params.id);

	if (isNaN(idEvento) || idEvento <= 0) {
		throw error(404, 'Campeonato inválido');
	}

	const campeonato = await buscarCampeonatoPorId(idAcademia, idEvento);
	if (!campeonato) {
		throw error(404, 'Campeonato não encontrado nesta academia.');
	}

	return {
		campeonato
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_GERENCIAR');

		const idAcademia = locals.idAcademia!;
		const idEvento = Number(params.id);

		if (isNaN(idEvento) || idEvento <= 0) {
			return fail(400, { erro: 'ID de campeonato inválido' });
		}

		const formData = await request.formData();

		const dadosBrutos = {
			nome: formData.get('nome'),
			edicao: formData.get('edicao'),
			tipoCampeonato: formData.get('tipoCampeonato'),
			dataInicio: formData.get('dataInicio'),
			dataInicioInscricao: formData.get('dataInicioInscricao'),
			dataFimInscricao: formData.get('dataFimInscricao'),
			faixaInicio: formData.get('faixaInicio'),
			faixaFim: formData.get('faixaFim'),
			limiteGrupo: formData.get('limiteGrupo'),
			idadeMinima: formData.get('idadeMinima'),
			idadeMaxima: formData.get('idadeMaxima'),
			valorInscricao: formData.get('valorInscricao'),
			cidade: formData.get('cidade'),
			uf: formData.get('uf'),
			logradouro: formData.get('logradouro'),
			numero: formData.get('numero'),
			complemento: formData.get('complemento'),
			bairro: formData.get('bairro'),
			cep: formData.get('cep')
		};

		const resultadoValidacao = campeonatoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			const campo = issue?.path?.[0] !== undefined ? `[${String(issue.path[0])}] ` : '';
			const primeiroErro = `${campo}${issue?.message || 'Dados inválidos para alteração de campeonato'}`;
			return fail(400, {
				erro: primeiroErro,
				valores: dadosBrutos
			});
		}

		try {
			await editarCampeonato(idAcademia, idEvento, resultadoValidacao.data);
		} catch (erro: any) {
			const mensagem = erro.body?.message || erro.message || 'Falha ao atualizar campeonato';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}

		throw redirect(303, `/dashboard/campeonatos/${idEvento}`);
	}
};
