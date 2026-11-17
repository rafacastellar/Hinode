import bcrypt from 'bcryptjs';
import { executarTransacao } from '../db/pool';
import {
	buscarUsuarioPorCpfTx,
	buscarUsuarioPorEmailTx,
	inserirUsuarioTx,
	atualizarUsuarioTx,
	atualizarSenhaUsuarioTx,
	vincularUsuarioAcademiaTx,
	sincronizarPerfisUsuarioAcademiaTx,
	sincronizarDadosProfessorTx,
	removerVinculoUsuarioAcademiaTx,
	contarAdminsAtivosNoDojo,
	buscarUsuarioDetalhadoNoDojo,
	listarPerfisDoSistema,
	mascararCpf,
	salvarEnderecoUsuarioTx,
	vincularResponsavelAoUsuarioTx,
	sincronizarResponsaveisDoUsuarioTx,
	desvincularResponsavelDoUsuarioTx
} from '../repositorios/usuario.repo';
import { calcularIdadeServidor } from '../repositorios/aluno.repo';
import { inserirHistoricoGraduacaoEmTransacao } from '../repositorios/graduacao.repo';
import { obterClassificacaoJudo } from '../../dominio/regras-categoria-peso';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import {
	criarUsuarioSchema,
	editarUsuarioSchema,
	redefinirSenhaSchema,
	type CriarUsuarioInput,
	type EditarUsuarioInput,
	type RedefinirSenhaInput
} from '../validacao/usuario.schema';

export interface ContextoOperador {
	idAcademia: number;
	idUsuarioOperador: number;
	ip?: string;
}

/**
 * Sincroniza unificadamente as credenciais técnicas (Graduação/Faixa e Nº Federação FPJ/CBJ)
 * entre as tabelas `Professor`, `Aluno` e `Historico_Graduacao`.
 * Quando um Professor é cadastrado ou editado, garante também seu registro técnico em `Aluno`
 * e `Historico_Graduacao` para que possa ter linha do tempo e promoções de Dan homologadas.
 */
async function sincronizarCredenciaisTecnicasProfessorAlunoTx(
	conn: PoolConnection,
	params: {
		idAcademia: number;
		idUsuario: number;
		ehProfessor: boolean;
		ehAluno: boolean;
		dataNascimento: string;
		genero: 'M' | 'F';
		nFederacao: string | null;
		grauFaixa: string | null;
	}
): Promise<void> {
	const faixaPadrao = params.ehProfessor ? 'Preta 1º Dan' : 'Branca';
	const faixaFinal = (params.grauFaixa && params.grauFaixa.trim()) || faixaPadrao;
	const nFedFinal = params.nFederacao && params.nFederacao.trim() ? params.nFederacao.trim() : null;

	// 1. Se for Professor, sincroniza tabela Professor
	if (params.ehProfessor) {
		await sincronizarDadosProfessorTx(conn, params.idUsuario, nFedFinal, faixaFinal);
	}

	// 2. Se for Professor ou se for Aluno (com faixa/federação informadas ou já matriculado), sincroniza Aluno + Historico_Graduacao
	const [alunoExistente] = await conn.execute<RowDataPacket[]>(
		'SELECT id_usuario, peso, id_professor_responsavel FROM Aluno WHERE id_usuario = ? LIMIT 1',
		[params.idUsuario]
	);

	const deveSincronizarAluno =
		params.ehProfessor ||
		alunoExistente.length > 0 ||
		(params.ehAluno && Boolean(params.grauFaixa || params.nFederacao));

	if (!deveSincronizarAluno) return;

	// Determina o id_professor_responsavel (se o próprio usuário é Professor, pode ser ele mesmo; senão busca um professor do dojo)
	let idProfResponsavel: number | null =
		alunoExistente.length > 0 && alunoExistente[0].id_professor_responsavel
			? Number(alunoExistente[0].id_professor_responsavel)
			: params.ehProfessor
				? params.idUsuario
				: null;

	if (!idProfResponsavel) {
		const [profsDojo] = await conn.execute<RowDataPacket[]>(
			`SELECT p.id_usuario
			 FROM Professor p
			 INNER JOIN Usuario_Academia ua ON ua.id_usuario = p.id_usuario
			 WHERE ua.id_academia = ?
			 ORDER BY p.id_usuario ASC LIMIT 1`,
			[params.idAcademia]
		);
		if (profsDojo.length > 0) {
			idProfResponsavel = Number(profsDojo[0].id_usuario);
		}
	}

	if (!idProfResponsavel) return;

	const pesoAtual =
		alunoExistente.length > 0 && alunoExistente[0].peso !== null
			? Number(alunoExistente[0].peso)
			: null;

	const classif = obterClassificacaoJudo({
		dataNascimento: params.dataNascimento,
		genero: params.genero,
		peso: pesoAtual,
		graduacao: faixaFinal
	});

	const hojeIso = new Date().toISOString().slice(0, 10);

	if (alunoExistente.length === 0) {
		await conn.execute(
			`INSERT INTO Aluno (
				id_usuario,
				n_federacao,
				status_federacao,
				data_inicio,
				data_primeira_graduacao,
				graduacao_atual,
				categoria,
				grupo_especial_aspirante,
				id_professor_responsavel
			) VALUES (?, ?, 'Ativo', ?, ?, ?, ?, ?, ?)`,
			[
				params.idUsuario,
				nFedFinal,
				hojeIso,
				hojeIso,
				faixaFinal,
				classif.categoriaCompleta || null,
				classif.divisao || null,
				idProfResponsavel
			]
		);
	} else {
		await conn.execute(
			`UPDATE Aluno
			 SET graduacao_atual = COALESCE(?, graduacao_atual),
			     n_federacao = COALESCE(?, n_federacao),
			     categoria = COALESCE(?, categoria),
			     grupo_especial_aspirante = COALESCE(?, grupo_especial_aspirante)
			 WHERE id_usuario = ?`,
			[
				params.grauFaixa ? faixaFinal : null,
				nFedFinal,
				classif.categoriaCompleta || null,
				classif.divisao || null,
				params.idUsuario
			]
		);
	}

	// 3. Garante que a faixa conste em Historico_Graduacao
	if (params.ehProfessor || params.grauFaixa) {
		const [jaNoHistorico] = await conn.execute<RowDataPacket[]>(
			`SELECT id_historico FROM Historico_Graduacao
			 WHERE id_aluno = ? AND LOWER(TRIM(faixa)) = LOWER(TRIM(?))
			 LIMIT 1`,
			[params.idUsuario, faixaFinal]
		);

		if (jaNoHistorico.length === 0) {
			await inserirHistoricoGraduacaoEmTransacao(conn, {
				idEventoGraduacao: null,
				idAluno: params.idUsuario,
				idProfessorHomologador: idProfResponsavel,
				dataGraduacao: hojeIso,
				associacao: 'CBJ / FPJ',
				faixa: faixaFinal,
				origemRegistro: 'HISTORICO_ANTERIOR',
				descricaoOrigem: params.ehProfessor
					? 'Graduação Oficial de Sensei / Professor (Sincronizada)'
					: 'Graduação Inicial Registrada no Cadastro de Usuário',
				idAcademiaFallback: params.idAcademia
			});
		}
	}
}

/**
 * Cria ou vincula um usuário na academia com seus papéis acumulativos.
 * SEGURANÇA: ACID Transaction com ROLLBACK em qualquer falha.
 */
export async function cadastrarUsuarioNoDojo(
	ctx: ContextoOperador,
	dadosBrutos: unknown
): Promise<number> {
	const dados: CriarUsuarioInput = criarUsuarioSchema.parse(dadosBrutos);

	return await executarTransacao(async (conn) => {
		const docIdentificador =
			dados.tipoDocumento === 'CPF'
				? dados.cpf.replace(/\D/g, '')
				: dados.cpf.trim().toUpperCase();

		// 1. Verifica se usuário já existe pelo CPF/Documento ou E-mail
		const usuarioExistenteCpf = await buscarUsuarioPorCpfTx(conn, docIdentificador);
		const usuarioExistenteEmail = await buscarUsuarioPorEmailTx(conn, dados.email);

		let idUsuarioFinal: number;

		const rotuloDoc = dados.tipoDocumento === 'CPF' ? 'CPF' : 'Documento';

		if (usuarioExistenteCpf) {
			idUsuarioFinal = usuarioExistenteCpf.id_usuario;

			// Verifica se já está vinculado a esta academia
			const detalheDojo = await buscarUsuarioDetalhadoNoDojo(ctx.idAcademia, idUsuarioFinal);
			if (detalheDojo) {
				throw new Error(`Este usuário (${rotuloDoc} já cadastrado) já está vinculado a este dojo.`);
			}
			// Se o e-mail for diferente do e-mail cadastrado
			if (usuarioExistenteCpf.email.toLowerCase() !== dados.email.toLowerCase()) {
				throw new Error(`O ${rotuloDoc} informado já pertence a uma conta com outro e-mail.`);
			}
		} else if (usuarioExistenteEmail) {
			throw new Error('O e-mail informado já está em uso por outro usuário.');
		} else {
			// Criação de novo usuário global
			const senhaHash = await bcrypt.hash(dados.senha, 12);
			idUsuarioFinal = await inserirUsuarioTx(conn, {
				nome: dados.nome,
				tipoDocumento: dados.tipoDocumento,
				cpf: docIdentificador,
				paisOrigem: dados.paisOrigem,
				dataNascimento: dados.dataNascimento,
				genero: dados.genero,
				email: dados.email,
				senhaHash,
				telefone: dados.telefone
			});
		}

		// 2. Vínculo Multi-Tenant com o Dojo
		await vincularUsuarioAcademiaTx(conn, idUsuarioFinal, ctx.idAcademia);

		// 3. Atribuição de Perfis Acumulativos
		await sincronizarPerfisUsuarioAcademiaTx(
			conn,
			idUsuarioFinal,
			ctx.idAcademia,
			dados.idsPerfis
		);

		// 4. Sincronização unificada de credenciais técnicas (Professor + Aluno + Histórico de Graduação)
		const todosPerfis = await listarPerfisDoSistema();
		const perfilProfessor = todosPerfis.find((p) => p.role.toLowerCase() === 'professor');
		const perfilAluno = todosPerfis.find((p) => p.role.toLowerCase() === 'aluno');
		const ehProfessor = Boolean(perfilProfessor && dados.idsPerfis.includes(perfilProfessor.id_perfil));
		const ehAluno = Boolean(perfilAluno && dados.idsPerfis.includes(perfilAluno.id_perfil));

		if (ehProfessor || ehAluno) {
			await sincronizarCredenciaisTecnicasProfessorAlunoTx(conn, {
				idAcademia: ctx.idAcademia,
				idUsuario: idUsuarioFinal,
				ehProfessor,
				ehAluno,
				dataNascimento: dados.dataNascimento,
				genero: dados.genero,
				nFederacao: dados.nFederacao || null,
				grauFaixa: dados.grauFaixa || null
			});
		}

		// 4.1. Se perfil de Responsável atribuído, garante registro na tabela Responsavel
		const perfilResponsavel = todosPerfis.find((p) => p.role.toLowerCase() === 'responsável');
		const ehResponsavel =
			perfilResponsavel && dados.idsPerfis.includes(perfilResponsavel.id_perfil);
		if (ehResponsavel) {
			await conn.execute(
				`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
				 VALUES (?, 'Responsável Legal', 0)
				 ON DUPLICATE KEY UPDATE grau_parentesco = VALUES(grau_parentesco)`,
				[idUsuarioFinal]
			);
		}

		// 5. Se endereço informado, salva na tabela Endereco_Usuario
		if (dados.logradouro && dados.cidade && dados.uf && dados.cep) {
			await salvarEnderecoUsuarioTx(conn, idUsuarioFinal, {
				logradouro: dados.logradouro,
				numero: dados.numero,
				complemento: dados.complemento,
				bairro: dados.bairro,
				cidade: dados.cidade,
				uf: dados.uf,
				cep: dados.cep
			});
		}

		// 6. Se menor de idade, vincula responsáveis legais em Responsavel_Aluno
		const idade = calcularIdadeServidor(dados.dataNascimento);
		const ehMenor = idade < 18;
		const responsaveisParaVincular =
			dados.responsaveisJson && dados.responsaveisJson.length > 0
				? dados.responsaveisJson
				: dados.idResponsavel
				  ? [
							{
								idResponsavel: dados.idResponsavel,
								grauParentesco: dados.responsavelParentesco || 'Responsável Legal',
								financeiro: dados.responsavelFinanceiro || false
							}
				    ]
				  : [];

		if (ehMenor && responsaveisParaVincular.length > 0) {
			await sincronizarResponsaveisDoUsuarioTx(
				conn,
				idUsuarioFinal,
				responsaveisParaVincular
			);
		}

		// 7. Trilha de Auditoria LGPD (sem senhas nem CPF completo)
		const logPayload = {
			nome: dados.nome,
			email: dados.email,
			genero: dados.genero,
			cpf_mascarado: mascararCpf(dados.cpf),
			perfis_ids: dados.idsPerfis,
			eh_professor: !!ehProfessor,
			possui_endereco: !!(dados.logradouro && dados.cep),
			possui_responsavel: !!dados.idResponsavel
		};

		await conn.query(
			`INSERT INTO Log_Auditoria (
				id_academia,
				id_usuario,
				acao,
				entidade,
				id_entidade,
				dados_depois,
				ip,
				criado_em
			) VALUES (?, ?, 'CRIAR_USUARIO', 'Usuario', ?, ?, ?, NOW(3))`,
			[
				ctx.idAcademia,
				ctx.idUsuarioOperador,
				String(idUsuarioFinal),
				JSON.stringify(logPayload),
				ctx.ip || '127.0.0.1'
			]
		);

		return idUsuarioFinal;
	});
}

/**
 * Atualiza dados cadastrais e sincroniza papéis acumulativos de um usuário.
 */
export async function atualizarUsuarioNoDojo(
	ctx: ContextoOperador,
	idUsuario: number,
	dadosBrutos: unknown
): Promise<void> {
	const dados: EditarUsuarioInput = editarUsuarioSchema.parse(dadosBrutos);

	return await executarTransacao(async (conn) => {
		// 1. Verifica se usuário pertence a este dojo
		const usuarioAtual = await buscarUsuarioDetalhadoNoDojo(ctx.idAcademia, idUsuario);
		if (!usuarioAtual) {
			throw new Error('Usuário não encontrado neste dojo.');
		}

		// 2. Proteção do Último Admin:
		const todosPerfis = await listarPerfisDoSistema();
		const perfilAdmin = todosPerfis.find((p) => p.role.toLowerCase() === 'admin');
		const eraAdmin = perfilAdmin && usuarioAtual.ids_perfis.includes(perfilAdmin.id_perfil);
		const continuaraAdmin = perfilAdmin && dados.idsPerfis.includes(perfilAdmin.id_perfil);

		if (eraAdmin && !continuaraAdmin) {
			const totalAdmins = await contarAdminsAtivosNoDojo(ctx.idAcademia);
			if (totalAdmins <= 1) {
				throw new Error(
					'Operação bloqueada: Este é o único Administrador ativo do dojo. O dojo não pode ficar sem nenhum Admin.'
				);
			}
		}

		// 3. Atualiza dados em Usuario
		await atualizarUsuarioTx(conn, idUsuario, {
			nome: dados.nome,
			dataNascimento: dados.dataNascimento,
			genero: dados.genero,
			email: dados.email,
			telefone: dados.telefone
		});

		// 4. Sincroniza papéis acumulativos
		await sincronizarPerfisUsuarioAcademiaTx(
			conn,
			idUsuario,
			ctx.idAcademia,
			dados.idsPerfis
		);

		// 5. Sincronização unificada de credenciais técnicas (Professor + Aluno + Histórico de Graduação)
		const perfilProfessor = todosPerfis.find((p) => p.role.toLowerCase() === 'professor');
		const perfilAluno = todosPerfis.find((p) => p.role.toLowerCase() === 'aluno');
		const ehProfessor = Boolean(perfilProfessor && dados.idsPerfis.includes(perfilProfessor.id_perfil));
		const ehAluno = Boolean(perfilAluno && dados.idsPerfis.includes(perfilAluno.id_perfil));

		if (ehProfessor || ehAluno) {
			await sincronizarCredenciaisTecnicasProfessorAlunoTx(conn, {
				idAcademia: ctx.idAcademia,
				idUsuario,
				ehProfessor,
				ehAluno,
				dataNascimento: dados.dataNascimento,
				genero: dados.genero,
				nFederacao: dados.nFederacao || null,
				grauFaixa: dados.grauFaixa || null
			});
		}

		// 5.1. Se perfil Responsável selecionado, garante registro na tabela Responsavel
		const perfilResponsavel = todosPerfis.find((p) => p.role.toLowerCase() === 'responsável');
		const ehResponsavel =
			perfilResponsavel && dados.idsPerfis.includes(perfilResponsavel.id_perfil);
		if (ehResponsavel) {
			await conn.execute(
				`INSERT INTO Responsavel (id_usuario, grau_parentesco, financeiro)
				 VALUES (?, 'Responsável Legal', 0)
				 ON DUPLICATE KEY UPDATE grau_parentesco = VALUES(grau_parentesco)`,
				[idUsuario]
			);
		}

		// 6. Atualiza Endereço Completo se informado
		if (dados.logradouro && dados.cidade && dados.uf && dados.cep) {
			await salvarEnderecoUsuarioTx(conn, idUsuario, {
				logradouro: dados.logradouro,
				numero: dados.numero,
				complemento: dados.complemento,
				bairro: dados.bairro,
				cidade: dados.cidade,
				uf: dados.uf,
				cep: dados.cep
			});
		}

		// 7. Atualiza Vínculos de Responsáveis Legais (Apenas se menor de idade)
		const idade = calcularIdadeServidor(dados.dataNascimento);
		const ehMenor = idade < 18;

		if (ehMenor) {
			const responsaveisParaVincular =
				dados.responsaveisJson && dados.responsaveisJson.length > 0
					? dados.responsaveisJson
					: dados.idResponsavel
					  ? [
								{
									idResponsavel: dados.idResponsavel,
									grauParentesco: dados.responsavelParentesco || 'Responsável Legal',
									financeiro: dados.responsavelFinanceiro || false
								}
					    ]
					  : [];

			await sincronizarResponsaveisDoUsuarioTx(conn, idUsuario, responsaveisParaVincular);
		} else {
			// Se o usuário for maior de idade (18+ anos), desvincula qualquer responsável legal
			await desvincularResponsavelDoUsuarioTx(conn, idUsuario);
		}

		// 8. Registro de Auditoria LGPD
		const logPayload = {
			nome: dados.nome,
			email: dados.email,
			genero: dados.genero,
			perfis_ids: dados.idsPerfis,
			eh_professor: !!ehProfessor,
			possui_endereco: !!(dados.logradouro && dados.cep),
			possui_responsavel: !!dados.idResponsavel
		};

		await conn.query(
			`INSERT INTO Log_Auditoria (
				id_academia,
				id_usuario,
				acao,
				entidade,
				id_entidade,
				dados_depois,
				ip,
				criado_em
			) VALUES (?, ?, 'EDITAR_USUARIO', 'Usuario', ?, ?, ?, NOW(3))`,
			[
				ctx.idAcademia,
				ctx.idUsuarioOperador,
				String(idUsuario),
				JSON.stringify(logPayload),
				ctx.ip || '127.0.0.1'
			]
		);
	});
}

/**
 * Redefine a senha do usuário com hash bcrypt e expira sessões ativas do usuário no dojo.
 */
export async function redefinirSenhaUsuarioNoDojo(
	ctx: ContextoOperador,
	idUsuario: number,
	dadosBrutos: unknown
): Promise<void> {
	const dados: RedefinirSenhaInput = redefinirSenhaSchema.parse(dadosBrutos);

	return await executarTransacao(async (conn) => {
		const usuarioAtual = await buscarUsuarioDetalhadoNoDojo(ctx.idAcademia, idUsuario);
		if (!usuarioAtual) {
			throw new Error('Usuário não encontrado neste dojo.');
		}

		const novaSenhaHash = await bcrypt.hash(dados.novaSenha, 12);

		// Atualiza hash da senha
		await atualizarSenhaUsuarioTx(conn, idUsuario, novaSenhaHash);

		// Invalida sessões ativas do usuário no tenant atual
		await conn.query(
			'DELETE FROM Sessao WHERE id_usuario = ? AND id_academia = ?',
			[idUsuario, ctx.idAcademia]
		);

		// Registro de Auditoria
		await conn.query(
			`INSERT INTO Log_Auditoria (
				id_academia,
				id_usuario,
				acao,
				entidade,
				id_entidade,
				dados_depois,
				ip,
				criado_em
			) VALUES (?, ?, 'REDEFINIR_SENHA_USUARIO', 'Usuario', ?, ?, ?, NOW(3))`,
			[
				ctx.idAcademia,
				ctx.idUsuarioOperador,
				String(idUsuario),
				JSON.stringify({ mensagem: 'Senha redefinida com sucesso; sessoes ativas expiradas.' }),
				ctx.ip || '127.0.0.1'
			]
		);
	});
}

/**
 * Remove o vínculo de um usuário com o dojo atual.
 * Impede a remoção se for o próprio operador ou o último Administrador do dojo.
 */
export async function desvincularUsuarioDoDojo(
	ctx: ContextoOperador,
	idUsuario: number
): Promise<void> {
	if (idUsuario === ctx.idUsuarioOperador) {
		throw new Error('Operação bloqueada: Você não pode remover sua própria conta do dojo.');
	}

	return await executarTransacao(async (conn) => {
		const usuarioAtual = await buscarUsuarioDetalhadoNoDojo(ctx.idAcademia, idUsuario);
		if (!usuarioAtual) {
			throw new Error('Usuário não encontrado neste dojo.');
		}

		const todosPerfis = await listarPerfisDoSistema();
		const perfilAdmin = todosPerfis.find((p) => p.role.toLowerCase() === 'admin');
		const eraAdmin = perfilAdmin && usuarioAtual.ids_perfis.includes(perfilAdmin.id_perfil);

		if (eraAdmin) {
			const totalAdmins = await contarAdminsAtivosNoDojo(ctx.idAcademia);
			if (totalAdmins <= 1) {
				throw new Error('Operação bloqueada: Este usuário é o único Administrador ativo do dojo.');
			}
		}

		// Remove vínculos e sessões
		await removerVinculoUsuarioAcademiaTx(conn, idUsuario, ctx.idAcademia);

		// Registro de Auditoria
		await conn.query(
			`INSERT INTO Log_Auditoria (
				id_academia,
				id_usuario,
				acao,
				entidade,
				id_entidade,
				dados_depois,
				ip,
				criado_em
			) VALUES (?, ?, 'DESVINCULAR_USUARIO', 'Usuario', ?, ?, ?, NOW(3))`,
			[
				ctx.idAcademia,
				ctx.idUsuarioOperador,
				String(idUsuario),
				JSON.stringify({ nome: usuarioAtual.nome, email: usuarioAtual.email }),
				ctx.ip || '127.0.0.1'
			]
		);
	});
}

/**
 * Alterna o status de bloqueio de um usuário especificamente dentro da academia atual (Dojo).
 * Não apaga histórico de graduações, presenças ou vínculos; apenas suspende/reativa o acesso.
 */
export async function alternarBloqueioUsuarioNoDojo(
	ctx: ContextoOperador,
	idUsuario: number,
	bloquear: boolean,
	motivo?: string | null
): Promise<void> {
	if (idUsuario === ctx.idUsuarioOperador && bloquear) {
		throw new Error('Operação bloqueada: Você não pode bloquear sua própria conta de acesso.');
	}

	return await executarTransacao(async (conn) => {
		const usuarioAtual = await buscarUsuarioDetalhadoNoDojo(ctx.idAcademia, idUsuario);
		if (!usuarioAtual) {
			throw new Error('Usuário não encontrado neste dojo.');
		}

		if (bloquear) {
			const todosPerfis = await listarPerfisDoSistema();
			const perfilAdmin = todosPerfis.find((p) => p.role.toLowerCase() === 'admin');
			const eraAdmin = perfilAdmin && usuarioAtual.ids_perfis.includes(perfilAdmin.id_perfil);

			if (eraAdmin) {
				const totalAdmins = await contarAdminsAtivosNoDojo(ctx.idAcademia);
				if (totalAdmins <= 1) {
					throw new Error('Operação bloqueada: Este usuário é o único Administrador ativo do dojo.');
				}
			}

			// Atualiza status para inativo no dojo
			await conn.query(
				`UPDATE Usuario_Academia 
				 SET ativo = 0, motivo_bloqueio = ?, bloqueado_em = NOW() 
				 WHERE id_usuario = ? AND id_academia = ?`,
				[motivo?.trim() || 'Acesso suspenso pela administração do dojo', idUsuario, ctx.idAcademia]
			);

			// Revoga instantaneamente as sessões ativas deste usuário no dojo (Kill Switch)
			await conn.query(
				`UPDATE Sessao 
				 SET revogada_em = NOW() 
				 WHERE id_usuario = ? AND id_academia = ? AND revogada_em IS NULL`,
				[idUsuario, ctx.idAcademia]
			);
		} else {
			// Reativa o acesso do usuário no dojo
			await conn.query(
				`UPDATE Usuario_Academia 
				 SET ativo = 1, motivo_bloqueio = NULL, bloqueado_em = NULL 
				 WHERE id_usuario = ? AND id_academia = ?`,
				[idUsuario, ctx.idAcademia]
			);
		}

		const acao = bloquear ? 'BLOQUEAR_USUARIO_DOJO' : 'ATIVAR_USUARIO_DOJO';
		await conn.query(
			`INSERT INTO Log_Auditoria (
				id_academia,
				id_usuario,
				acao,
				entidade,
				id_entidade,
				dados_depois,
				ip,
				criado_em
			) VALUES (?, ?, ?, 'Usuario', ?, ?, ?, NOW(3))`,
			[
				ctx.idAcademia,
				ctx.idUsuarioOperador,
				acao,
				String(idUsuario),
				JSON.stringify({
					bloqueado: bloquear,
					motivo: motivo || null,
					nome: usuarioAtual.nome,
					email: usuarioAtual.email
				}),
				ctx.ip || '127.0.0.1'
			]
		);
	});
}
