import { error } from '@sveltejs/kit';
import { executarTransacao } from '../db/pool';
import { gerarHashSenha } from '../auth/criptografia';
import {
	calcularIdadeServidor,
	inserirAlunoEmTransacao
} from '../repositorios/aluno.repo';
import { registrarOuVincularResponsavelEmTransacao } from '../repositorios/responsavel.repo';
import { listarProfessoresDoDojo } from '../repositorios/professor.repo';
import type { AlunoInput } from '../validacao/aluno.schema';
import type { RowDataPacket } from 'mysql2';

export interface ResultadoCriacaoAluno {
	sucesso: boolean;
	idAluno: number;
	mensagem: string;
}

/**
 * Serviço de negócio para matrícula e gestão de Judocas no SaaS Hinodê.
 * Orquestra regras de menoridade, validação de professor e transação ACID atômica.
 */
export async function cadastrarAluno(
	idAcademia: number,
	dados: AlunoInput
): Promise<ResultadoCriacaoAluno> {
	// 1. Regra de Negócio: Cálculo de Maioridade estritamente no servidor
	const idade = calcularIdadeServidor(dados.dataNascimento);
	const ehMenorDeIdade = idade < 18;

	// Se for menor de idade, dados do Responsável Legal são OBRIGATÓRIOS
	if (ehMenorDeIdade) {
		if (
			!dados.responsavelNome ||
			dados.responsavelNome.trim().length < 3 ||
			!dados.responsavelCpf ||
			dados.responsavelCpf.length !== 11 ||
			!dados.responsavelTelefone ||
			dados.responsavelTelefone.length < 8
		) {
			throw error(400, {
				message:
					'Judocas menores de 18 anos exigem obrigatoriamente um Responsável Legal com Nome, CPF válido, Telefone e Grau de Parentesco.'
			});
		}
	}

	// 2. Validação: O professor responsável deve pertencer ao mesmo dojo (Tenant)
	const professores = await listarProfessoresDoDojo(idAcademia);
	const professorValido = professores.some(
		(p) => p.id_usuario === dados.idProfessorResponsavel
	);

	if (!professorValido) {
		throw error(400, {
			message: 'O professor responsável selecionado não pertence a esta academia.'
		});
	}

	// 3. Orquestração da Transação ACID no MySQL
	return await executarTransacao(async (conn) => {
		// Checagem de duplicidade de CPF ou E-mail
		const [usuariosConflito] = await conn.execute<RowDataPacket[]>(
			'SELECT id_usuario, email, cpf FROM Usuario WHERE cpf = ? OR email = ? LIMIT 1',
			[dados.cpf, dados.email]
		);

		if (usuariosConflito.length > 0) {
			const conflito = usuariosConflito[0];
			if (conflito.cpf === dados.cpf) {
				throw error(409, { message: 'Já existe um usuário cadastrado com este CPF.' });
			}
			if (conflito.email === dados.email) {
				throw error(409, { message: 'Já existe um usuário cadastrado com este e-mail.' });
			}
		}

		// Gera senha inicial padrão segura (podendo ser redefinida depois)
		const senhaPadrao = `Judo@${dados.cpf.slice(0, 4)}`;
		const senhaHash = await gerarHashSenha(senhaPadrao);

		// Inserção do Judoca (Usuario + Usuario_Academia + Perfil + Aluno)
		const idAluno = await inserirAlunoEmTransacao(conn, idAcademia, {
			nome: dados.nome,
			cpf: dados.cpf,
			dataNascimento: dados.dataNascimento,
			email: dados.email,
			senhaHash,
			telefone: dados.telefone || null,
			matricula: dados.matricula || null,
			peso: dados.peso || null,
			categoria: dados.categoria || null,
			nFederacao: dados.nFederacao || null,
			statusFederacao: dados.statusFederacao || null,
			dataInicio: dados.dataInicio || null,
			graduacaoAtual: dados.graduacaoAtual,
			idProfessorResponsavel: dados.idProfessorResponsavel
		});

		// Se menor de idade (ou se os dados do responsável foram preenchidos), vincula responsável
		const temDadosResponsavel = Boolean(
			dados.responsavelNome && dados.responsavelCpf && dados.responsavelCpf.length === 11
		);

		if (ehMenorDeIdade || temDadosResponsavel) {
			await registrarOuVincularResponsavelEmTransacao(conn, idAcademia, idAluno, {
				nome: dados.responsavelNome!,
				cpf: dados.responsavelCpf!,
				email: dados.responsavelEmail || `responsavel.${dados.responsavelCpf}@hinode.local`,
				telefone: dados.responsavelTelefone || null,
				grauParentesco: dados.responsavelParentesco || 'Responsável Legal',
				financeiro: dados.responsavelFinanceiro || false
			});
		}

		return {
			sucesso: true,
			idAluno,
			mensagem: `Judoca ${dados.nome} cadastrado com sucesso no Dojo.`
		};
	});
}
