import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';
import { exigirPermissao } from '#lib/server/auth/rbac';
import {
	buscarDadosAcademia,
	buscarMetricasGestaoDojo,
	buscarEstatisticasSeguranca,
	listarLogsAuditoria,
	atualizarDadosAcademiaTx
} from '#lib/server/repositorios/academia.repo';
import { getStorageProvider } from '#lib/server/storage';
import { executarJobLembretesInscricao } from '#lib/server/jobs/lembretes-inscricao.job';

const academiaEdicaoSchema = z.object({
	nome: z.string().min(2, 'Razão Social deve ter no mínimo 2 caracteres').max(255).trim(),
	nome_fantasia: z.string().max(255).trim().nullable().optional(),
	cnpj: z
		.string()
		.regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$|^\d{14}$/, 'CNPJ deve conter 14 dígitos numéricos válidos'),
	inscr_est: z.string().max(50).trim().nullable().optional(),
	telefone: z.string().max(20).trim().nullable().optional(),
	endereco: z.object({
		cep: z
			.string()
			.regex(/^\d{5}-?\d{3}$|^\d{8}$/, 'CEP deve ter 8 dígitos numéricos'),
		logradouro: z.string().min(2, 'Logradouro é obrigatório').max(255).trim(),
		numero: z.string().max(20).trim().nullable().optional(),
		complemento: z.string().max(100).trim().nullable().optional(),
		bairro: z.string().max(100).trim().nullable().optional(),
		cidade: z.string().min(2, 'Cidade é obrigatória').max(100).trim(),
		uf: z.string().length(2, 'UF deve ter 2 caracteres').toUpperCase()
	})
});

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

	const metricasDojo = await buscarMetricasGestaoDojo(idAcademia);
	const estatisticas = await buscarEstatisticasSeguranca(idAcademia);
	const logsAuditoria = await listarLogsAuditoria(idAcademia, 30);
	const provedorStorage = getStorageProvider();

	return {
		academia,
		metricasDojo,
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
	salvarDadosDojo: async ({ request, locals, getClientAddress }) => {
		exigirPermissao(locals.perfis, 'ACADEMIA_CONFIGURAR');

		const idAcademia = locals.idAcademia;
		const idUsuario = locals.usuario?.id;

		if (!idAcademia || !idUsuario) {
			throw error(401, 'Sessão expirada ou não autenticada.');
		}

		const formData = await request.formData();

		const strOuNull = (val: FormDataEntryValue | null) => {
			if (typeof val !== 'string') return null;
			const trimmed = val.trim();
			return trimmed === '' ? null : trimmed;
		};

		const dadosBrutos = {
			nome: ((formData.get('nome') as string) || '').trim(),
			nome_fantasia: strOuNull(formData.get('nome_fantasia')),
			cnpj: ((formData.get('cnpj') as string) || '').trim(),
			inscr_est: strOuNull(formData.get('inscr_est')),
			telefone: strOuNull(formData.get('telefone')),
			endereco: {
				cep: ((formData.get('cep') as string) || '').trim(),
				logradouro: ((formData.get('logradouro') as string) || '').trim(),
				numero: strOuNull(formData.get('numero')),
				complemento: strOuNull(formData.get('complemento')),
				bairro: strOuNull(formData.get('bairro')),
				cidade: ((formData.get('cidade') as string) || '').trim(),
				uf: ((formData.get('uf') as string) || '').trim().toUpperCase()
			}
		};

		const validacao = academiaEdicaoSchema.safeParse(dadosBrutos);
		if (!validacao.success) {
			const primeiroErro = validacao.error.issues[0]?.message || 'Dados inválidos';
			return fail(400, {
				erroDojo: primeiroErro,
				valores: dadosBrutos
			});
		}

		let ipOperador: string | null = null;
		try {
			ipOperador = getClientAddress();
		} catch {
			ipOperador = null;
		}

		try {
			await atualizarDadosAcademiaTx(idAcademia, idUsuario, validacao.data, ipOperador);

			return {
				sucessoDojo: 'Dados cadastrais e endereço da sede do dojo atualizados com sucesso.'
			};
		} catch (erro: any) {
			return fail(400, {
				erroDojo: erro?.message || 'Falha ao salvar as configurações do dojo.',
				valores: dadosBrutos
			});
		}
	},

	testarJobLembretes: async ({ locals }) => {
		exigirPermissao(locals.perfis, 'ACADEMIA_CONFIGURAR');

		try {
			const resultado = await executarJobLembretesInscricao();
			return {
				sucessoJob: true,
				mensagemJob: 'Job de lembretes executado com sucesso.',
				relatorioJob: resultado
			};
		} catch (erro: any) {
			return {
				sucessoJob: false,
				mensagemJob: erro?.message || 'Falha ao executar rotina de lembretes.'
			};
		}
	}
};
