import { error } from '@sveltejs/kit';
import { executarTransacao, getDbPool } from '../db/pool';
import { gerarHashSenha } from '../auth/criptografia';
import { obterClassificacaoJudo } from '../../dominio/regras-categoria-peso';
import {
	calcularIdadeServidor,
	inserirAlunoEmTransacao,
	atualizarAlunoEmTransacao
} from '../repositorios/aluno.repo';
import {
	registrarOuVincularResponsavelEmTransacao,
	vincularResponsavelExistenteEmTransacao
} from '../repositorios/responsavel.repo';
import { listarProfessoresDoDojo } from '../repositorios/professor.repo';
import {
	type AlunoInput,
	type MatricularAlunoInput,
	editarAlunoSchema
} from '../validacao/aluno.schema';
import type { RowDataPacket } from 'mysql2';

export interface ResultadoCriacaoAluno {
	sucesso: boolean;
	idAluno: number;
	mensagem: string;
}

/**
 * Serviço de negócio para matrícula e gestão de Judocas no SaaS Hinodê.
 * Orquestra regras de menoridade, validação de professor, seleção de usuário/responsável existentes
 * e transação ACID atômica.
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
		const temResponsavelExistente = Boolean(dados.idResponsavelExistente);
		const temResponsavelManual = Boolean(
			dados.responsavelNome &&
				dados.responsavelNome.trim().length >= 3 &&
				dados.responsavelCpf &&
				dados.responsavelCpf.length === 11 &&
				dados.responsavelTelefone &&
				dados.responsavelTelefone.length >= 8
		);

		if (!temResponsavelExistente && !temResponsavelManual) {
			throw error(400, {
				message:
					'Judocas menores de 18 anos exigem obrigatoriamente um Responsável Legal selecionado ou com Nome, CPF válido, Telefone e Grau de Parentesco preenchidos.'
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
		let idAluno: number;

		if (dados.idUsuarioExistente) {
			// Cenário A: Judoca vinculado a um usuário já cadastrado
			idAluno = dados.idUsuarioExistente;

			const [userExiste] = await conn.execute<RowDataPacket[]>(
				'SELECT id_usuario, nome, cpf, email FROM Usuario WHERE id_usuario = ? LIMIT 1',
				[idAluno]
			);
			if (userExiste.length === 0) {
				throw error(404, { message: 'O usuário selecionado não foi encontrado no sistema.' });
			}

			// Verifica se já está matriculado como aluno nesta academia
			const [alunoJaCadastrado] = await conn.execute<RowDataPacket[]>(
				`SELECT a.id_usuario 
				 FROM Aluno a 
				 INNER JOIN Usuario_Academia ua ON a.id_usuario = ua.id_usuario 
				 WHERE a.id_usuario = ? AND ua.id_academia = ? LIMIT 1`,
				[idAluno, idAcademia]
			);
			if (alunoJaCadastrado.length > 0) {
				throw error(409, {
					message: 'Este usuário já está cadastrado e matriculado como judoca neste dojo.'
				});
			}

			// Atualiza telefone/nome caso tenham sido ajustados
			await conn.execute(
				`UPDATE Usuario 
				 SET nome = ?, telefone = COALESCE(?, telefone) 
				 WHERE id_usuario = ?`,
				[dados.nome, dados.telefone || null, idAluno]
			);

			// Garante vínculo de academia (tenant)
			await conn.execute(
				'INSERT IGNORE INTO Usuario_Academia (id_usuario, id_academia) VALUES (?, ?)',
				[idAluno, idAcademia]
			);

			// Garante papel de Aluno no tenant
			const [perfis] = await conn.execute<RowDataPacket[]>(
				"SELECT id_perfil FROM Perfil WHERE role = 'Aluno' LIMIT 1"
			);
			const idPerfilAluno = perfis.length > 0 ? Number(perfis[0].id_perfil) : 4;
			await conn.execute(
				'INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil) VALUES (?, ?, ?)',
				[idAluno, idAcademia, idPerfilAluno]
			);

			// Insere registro na tabela Aluno
			await conn.execute(
				`INSERT INTO Aluno (
					id_usuario,
					matricula,
					peso,
					categoria,
					n_federacao,
					status_federacao,
					data_inicio,
					data_primeira_graduacao,
					graduacao_atual,
					grupo_especial_aspirante,
					id_professor_responsavel
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				ON DUPLICATE KEY UPDATE
					matricula = VALUES(matricula),
					peso = VALUES(peso),
					categoria = VALUES(categoria),
					n_federacao = VALUES(n_federacao),
					status_federacao = VALUES(status_federacao),
					data_inicio = VALUES(data_inicio),
					data_primeira_graduacao = VALUES(data_primeira_graduacao),
					graduacao_atual = VALUES(graduacao_atual),
					grupo_especial_aspirante = VALUES(grupo_especial_aspirante),
					id_professor_responsavel = VALUES(id_professor_responsavel)`,
				[
					idAluno,
					dados.matricula || null,
					dados.peso || null,
					dados.categoria || null,
					dados.nFederacao || null,
					dados.statusFederacao || null,
					dados.dataInicio || null,
					dados.dataPrimeiraGraduacao || null,
					dados.graduacaoAtual,
					dados.grupoEspecialAspirante || null,
					dados.idProfessorResponsavel
				]
			);
		} else {
			// Cenário B: Criação de novo usuário
			const [usuariosConflito] = await conn.execute<RowDataPacket[]>(
				'SELECT id_usuario, nome, email, cpf FROM Usuario WHERE cpf = ? OR email = ? LIMIT 1',
				[dados.cpf, dados.email]
			);

			if (usuariosConflito.length > 0) {
				const conflito = usuariosConflito[0];
				if (conflito.cpf === dados.cpf) {
					throw error(409, {
						message: `Já existe um usuário cadastrado com este CPF (${conflito.nome}). Utilize a opção "Buscar Usuário Já Cadastrado" para vincular a matrícula ao cadastro existente.`
					});
				}
				if (conflito.email === dados.email) {
					throw error(409, {
						message: `Já existe um usuário cadastrado com este e-mail (${conflito.nome}). Utilize a opção "Buscar Usuário Já Cadastrado" para vincular a matrícula ao cadastro existente.`
					});
				}
			}

			// Gera senha inicial padrão segura (podendo ser redefinida depois)
			const senhaPadrao = `Judo@${dados.cpf.slice(0, 4)}`;
			const senhaHash = await gerarHashSenha(senhaPadrao);

			// Inserção do Judoca (Usuario + Usuario_Academia + Perfil + Aluno)
			idAluno = await inserirAlunoEmTransacao(conn, idAcademia, {
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
				dataPrimeiraGraduacao: dados.dataPrimeiraGraduacao || null,
				graduacaoAtual: dados.graduacaoAtual,
				grupoEspecialAspirante: dados.grupoEspecialAspirante || null,
				idProfessorResponsavel: dados.idProfessorResponsavel
			});
		}

		// 4. Vínculo do Responsável Legal (Existente ou Novo)
		if (dados.idResponsavelExistente) {
			// Vincula o responsável selecionado ao novo aluno (permite vincular o mesmo responsável a múltiplos menores)
			await vincularResponsavelExistenteEmTransacao(
				conn,
				idAcademia,
				dados.idResponsavelExistente,
				idAluno,
				{
					grauParentesco: dados.responsavelParentesco || 'Responsável Legal',
					financeiro: dados.responsavelFinanceiro || false
				}
			);
		} else {
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
		}

		return {
			sucesso: true,
			idAluno,
			mensagem: `Judoca ${dados.nome} cadastrado com sucesso no Dojo.`
		};
	});
}

/**
 * Matricula como Judoca um usuário JÁ CADASTRADO no dojo com o perfil 'Aluno'.
 * Dados pessoais e responsáveis legais são mantidos no módulo de Usuários;
 * aqui apenas os dados técnicos/esportivos são gravados na tabela Aluno.
 * MULTI-TENANT: valida pertencimento do usuário e do professor ao idAcademia.
 */
export async function matricularUsuarioExistente(
	idAcademia: number,
	dados: MatricularAlunoInput
): Promise<ResultadoCriacaoAluno> {
	const professores = await listarProfessoresDoDojo(idAcademia);
	if (!professores.some((p) => p.id_usuario === dados.idProfessorResponsavel)) {
		throw error(400, {
			message: 'O professor responsável selecionado não pertence a esta academia.'
		});
	}

	return await executarTransacao(async (conn) => {
		// 1. Usuário deve pertencer ao dojo com o perfil 'Aluno'
		const [usuarios] = await conn.execute<RowDataPacket[]>(
			`SELECT u.id_usuario, u.nome, u.genero, DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento
			 FROM Usuario u
			 INNER JOIN Usuario_Academia_Perfil uap ON uap.id_usuario = u.id_usuario
			 INNER JOIN Perfil p ON p.id_perfil = uap.id_perfil
			 WHERE u.id_usuario = ? AND uap.id_academia = ? AND p.role = 'Aluno'
			 LIMIT 1`,
			[dados.idUsuario, idAcademia]
		);
		if (usuarios.length === 0) {
			throw error(404, {
				message:
					'Usuário não encontrado neste dojo com o perfil Aluno. Cadastre-o primeiro em Usuários.'
			});
		}
		const usuario = usuarios[0];

		// 2. Não pode já estar matriculado
		const [jaAluno] = await conn.execute<RowDataPacket[]>(
			'SELECT id_usuario FROM Aluno WHERE id_usuario = ? LIMIT 1',
			[dados.idUsuario]
		);
		if (jaAluno.length > 0) {
			throw error(409, { message: 'Este usuário já está matriculado como judoca.' });
		}

		// 3. Menor de idade exige ao menos 1 responsável vinculado no cadastro de usuário
		const idade = calcularIdadeServidor(String(usuario.data_nascimento));
		if (idade < 18) {
			const [resp] = await conn.execute<RowDataPacket[]>(
				'SELECT COUNT(*) AS total FROM Responsavel_Aluno WHERE id_aluno = ?',
				[dados.idUsuario]
			);
			if (Number(resp[0]?.total ?? 0) === 0) {
				throw error(400, {
					message: `${usuario.nome} é menor de idade e não possui responsável legal vinculado. Vincule o responsável no cadastro do usuário antes de matricular.`
				});
			}
		}

		// 4. Se a categoria ou divisão não tiverem sido fornecidas, calcula com o motor oficial de Judô CBJ/FPJ
		let categoriaFinal = dados.categoria;
		let grupoFinal = dados.grupoEspecialAspirante;

		if (!categoriaFinal || !grupoFinal) {
			const classif = obterClassificacaoJudo({
				dataNascimento: String(usuario.data_nascimento),
				genero: (usuario.genero === 'F' ? 'F' : 'M') as 'M' | 'F',
				peso: dados.peso,
				graduacao: dados.graduacaoAtual
			});
			if (!categoriaFinal && classif.categoriaCompleta) {
				categoriaFinal = classif.categoriaCompleta;
			}
			if (!grupoFinal && classif.divisao) {
				grupoFinal = classif.divisao;
			}
		}

		// 5. Grava dados técnicos
		await conn.execute(
			`INSERT INTO Aluno (
				id_usuario, matricula, peso, categoria, n_federacao, status_federacao,
				data_inicio, data_primeira_graduacao, graduacao_atual,
				grupo_especial_aspirante, id_professor_responsavel
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				dados.idUsuario,
				dados.matricula || null,
				dados.peso || null,
				categoriaFinal || null,
				dados.nFederacao || null,
				dados.statusFederacao || null,
				dados.dataInicio || null,
				dados.dataPrimeiraGraduacao || null,
				dados.graduacaoAtual,
				grupoFinal || null,
				dados.idProfessorResponsavel
			]
		);

		return {
			sucesso: true,
			idAluno: dados.idUsuario,
			mensagem: `Judoca ${usuario.nome} matriculado com sucesso.`
		};
	});
}

/**
 * Atualiza os dados esportivos e técnicos de um Judoca (Aluno).
 */
export async function atualizarDadosAluno(
	idAcademia: number,
	idAluno: number,
	dadosBrutos: unknown
): Promise<{ sucesso: boolean; mensagem: string }> {
	const validacao = editarAlunoSchema.safeParse(dadosBrutos);
	if (!validacao.success) {
		const primeiraFalha = validacao.error.issues[0]?.message || 'Dados inválidos';
		throw error(400, { message: primeiraFalha });
	}

	const dados = validacao.data;

	// Validação: Professor responsável deve pertencer ao mesmo dojo
	const professores = await listarProfessoresDoDojo(idAcademia);
	const professorValido = professores.some(
		(p) => p.id_usuario === dados.idProfessorResponsavel
	);
	if (!professorValido) {
		throw error(400, {
			message: 'O professor responsável selecionado não pertence a esta academia.'
		});
	}

	// Se a categoria ou grupo competitivo não foi informada ou veio vazia, calcula com base no motor
	if (!dados.categoria || !dados.grupoEspecialAspirante) {
		const pool = getDbPool();
		const [u] = await pool.execute<RowDataPacket[]>(
			`SELECT genero, DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento FROM Usuario WHERE id_usuario = ? LIMIT 1`,
			[idAluno]
		);
		if (u.length > 0 && u[0].data_nascimento) {
			const classif = obterClassificacaoJudo({
				dataNascimento: String(u[0].data_nascimento),
				genero: (u[0].genero === 'F' ? 'F' : 'M') as 'M' | 'F',
				peso: dados.peso,
				graduacao: dados.graduacaoAtual
			});
			if (!dados.categoria) dados.categoria = classif.categoriaCompleta;
			if (!dados.grupoEspecialAspirante) dados.grupoEspecialAspirante = classif.divisao;
		}
	}

	return await executarTransacao(async (conn) => {
		await atualizarAlunoEmTransacao(conn, idAcademia, idAluno, dados);
		return {
			sucesso: true,
			mensagem: 'Dados técnicos e esportivos do judoca atualizados com sucesso.'
		};
	});
}

/**
 * Recalcula e atualiza em lote as categorias de peso e divisões oficiais de todos os alunos do dojo
 * com base na data de nascimento, gênero, peso atual e graduação (Regulamento CBJ/FPJ).
 */
export async function recalcularCategoriasDojo(
	idAcademia: number
): Promise<{ totalAtualizados: number; totalAlunos: number }> {
	const pool = getDbPool();
	const [alunos] = await pool.query<RowDataPacket[]>(
		`SELECT 
			a.id_usuario,
			u.nome,
			u.genero,
			DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
			a.peso,
			a.graduacao_atual,
			a.categoria,
			a.grupo_especial_aspirante
		 FROM Aluno a
		 INNER JOIN Usuario u ON a.id_usuario = u.id_usuario
		 INNER JOIN Usuario_Academia ua ON u.id_usuario = ua.id_usuario
		 WHERE ua.id_academia = ?`,
		[idAcademia]
	);

	let totalAtualizados = 0;

	for (const aluno of alunos) {
		if (!aluno.data_nascimento) continue;
		const classif = obterClassificacaoJudo({
			dataNascimento: String(aluno.data_nascimento),
			genero: aluno.genero === 'F' ? 'F' : 'M',
			peso: aluno.peso !== null ? Number(aluno.peso) : null,
			graduacao: aluno.graduacao_atual
		});

		// Atualiza se mudou ou se não estava preenchido
		if (aluno.categoria !== classif.categoriaCompleta || aluno.grupo_especial_aspirante !== classif.divisao) {
			await pool.execute(
				`UPDATE Aluno 
				 SET categoria = ?, grupo_especial_aspirante = ? 
				 WHERE id_usuario = ?`,
				[classif.categoriaCompleta, classif.divisao, aluno.id_usuario]
			);
			totalAtualizados++;
		}
	}

	return {
		totalAtualizados,
		totalAlunos: alunos.length
	};
}
