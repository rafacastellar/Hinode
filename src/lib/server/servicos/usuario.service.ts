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
	mascararCpf
} from '../repositorios/usuario.repo';
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
 * Cria ou vincula um usuário na academia com seus papéis acumulativos.
 * SEGURANÇA: ACID Transaction com ROLLBACK em qualquer falha.
 */
export async function cadastrarUsuarioNoDojo(
	ctx: ContextoOperador,
	dadosBrutos: unknown
): Promise<number> {
	const dados: CriarUsuarioInput = criarUsuarioSchema.parse(dadosBrutos);

	return await executarTransacao(async (conn) => {
		// 1. Verifica se usuário já existe pelo CPF ou E-mail
		const usuarioExistenteCpf = await buscarUsuarioPorCpfTx(conn, dados.cpf);
		const usuarioExistenteEmail = await buscarUsuarioPorEmailTx(conn, dados.email);

		let idUsuarioFinal: number;

		if (usuarioExistenteCpf) {
			idUsuarioFinal = usuarioExistenteCpf.id_usuario;

			// Verifica se já está vinculado a esta academia
			const detalheDojo = await buscarUsuarioDetalhadoNoDojo(ctx.idAcademia, idUsuarioFinal);
			if (detalheDojo) {
				throw new Error('Este usuário (CPF já cadastrado) já está vinculado a este dojo.');
			}
			// Se o e-mail for diferente do e-mail cadastrado
			if (usuarioExistenteCpf.email.toLowerCase() !== dados.email.toLowerCase()) {
				throw new Error('O CPF informado já pertence a uma conta com outro e-mail.');
			}
		} else if (usuarioExistenteEmail) {
			throw new Error('O e-mail informado já está em uso por outro usuário.');
		} else {
			// Criação de novo usuário global
			const senhaHash = await bcrypt.hash(dados.senha, 12);
			idUsuarioFinal = await inserirUsuarioTx(conn, {
				nome: dados.nome,
				cpf: dados.cpf,
				dataNascimento: dados.dataNascimento,
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

		// 4. Se perfil de Professor atribuído, sincroniza tabela técnica Professor
		const todosPerfis = await listarPerfisDoSistema();
		const perfilProfessor = todosPerfis.find((p) => p.role.toLowerCase() === 'professor');
		const ehProfessor = perfilProfessor && dados.idsPerfis.includes(perfilProfessor.id_perfil);

		if (ehProfessor) {
			await sincronizarDadosProfessorTx(
				conn,
				idUsuarioFinal,
				dados.nFederacao,
				dados.grauFaixa
			);
		}

		// 5. Trilha de Auditoria LGPD (sem senhas nem CPF completo)
		const logPayload = {
			nome: dados.nome,
			email: dados.email,
			cpf_mascarado: mascararCpf(dados.cpf),
			perfis_ids: dados.idsPerfis,
			eh_professor: !!ehProfessor
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

		// 5. Se perfil Professor selecionado, atualiza dados do Sensei
		const perfilProfessor = todosPerfis.find((p) => p.role.toLowerCase() === 'professor');
		const ehProfessor = perfilProfessor && dados.idsPerfis.includes(perfilProfessor.id_perfil);

		if (ehProfessor) {
			await sincronizarDadosProfessorTx(
				conn,
				idUsuario,
				dados.nFederacao,
				dados.grauFaixa
			);
		}

		// 6. Registro de Auditoria LGPD
		const logPayload = {
			nome: dados.nome,
			email: dados.email,
			perfis_ids: dados.idsPerfis,
			eh_professor: !!ehProfessor
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
