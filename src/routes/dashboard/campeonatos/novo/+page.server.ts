import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { exigirPermissao } from '#lib/server/auth/rbac';
import { cadastrarCampeonato } from '#lib/server/servicos/campeonato.service';
import { campeonatoSchema } from '#lib/server/validacao/campeonato.schema';

export const load: PageServerLoad = async ({ locals }) => {
	const perfis = locals.perfis || [];
	exigirPermissao(perfis, 'CAMPEONATOS_CRIAR');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const perfis = locals.perfis || [];
		exigirPermissao(perfis, 'CAMPEONATOS_CRIAR');

		const idAcademia = locals.idAcademia!;
		const formData = await request.formData();

		const dadosBrutos = {
			nome: formData.get('nome'),
			edicao: formData.get('edicao'),
			tipoCampeonato: formData.get('tipoCampeonato'),
			dataInicio: formData.get('dataInicio'),
			faixaInicio: formData.get('faixaInicio'),
			faixaFim: formData.get('faixaFim'),
			limiteGrupo: formData.get('limiteGrupo'),
			idadeMinima: formData.get('idadeMinima'),
			idadeMaxima: formData.get('idadeMaxima'),
			valorInscricao: formData.get('valorInscricao'),
			cidade: formData.get('cidade'),
			uf: formData.get('uf'),
			logradouro: formData.get('logradouro'),
			cep: formData.get('cep')
		};

		const resultadoValidacao = campeonatoSchema.safeParse(dadosBrutos);
		if (!resultadoValidacao.success) {
			const issue = resultadoValidacao.error.issues?.[0];
			const campo =
				issue?.path?.[0] !== undefined ? `[${String(issue.path[0])}] ` : '';
			const primeiroErro =
				`${campo}${issue?.message || 'Dados inválidos para campeonato'}`;
			return fail(400, {
				erro: primeiroErro,
				valores: dadosBrutos
			});
		}

		try {
			await cadastrarCampeonato(idAcademia, resultadoValidacao.data);
		} catch (erro: any) {
			const mensagem = erro.body?.message || erro.message || 'Falha ao cadastrar campeonato';
			return fail(erro.status || 400, {
				erro: mensagem,
				valores: dadosBrutos
			});
		}

		throw redirect(303, '/dashboard/campeonatos');
	}
};
