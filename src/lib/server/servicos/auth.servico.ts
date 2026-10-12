import { buscarUsuarioPorEmail, buscarAcademiasDoUsuario, type AcademiaVinculada } from '../repositorios/usuario.repo';
import { criarSessao, revogarSessaoPorHash } from '../repositorios/sessao.repo';
import { verificarSenha, gerarTokenSessao, calcularHashToken } from '../auth/criptografia';
import type { LoginInput } from '../validacao/auth.schema';

export type ResultadoLogin =
	| {
			sucesso: true;
			tokenPuro: string;
			expiraEm: Date;
			idAcademia: number;
			usuario: { id: number; nome: string; email: string };
	  }
	| {
			sucesso: false;
			erro: string;
	  }
	| {
			sucesso: false;
			precisaSelecionarAcademia: true;
			academias: AcademiaVinculada[];
			idUsuario: number;
	  };

/**
 * Orquestra o fluxo de login com regras de segurança estritas:
 * - Mensagens de erro genéricas contra enumeração de e-mails.
 * - Suporte a multi-tenant com seleção de dojo ativo.
 * - Emissão de sessão stateless persistida no MySQL.
 */
export async function autenticarUsuario(
	dados: LoginInput,
	meta: { ip?: string | null; userAgent?: string | null }
): Promise<ResultadoLogin> {
	const usuario = await buscarUsuarioPorEmail(dados.email);

	// Se o usuário não existir, simula validação para mitigar timing attacks e retorna erro genérico
	if (!usuario) {
		await verificarSenha(dados.senha, '$2a$12$e8YpXg.pW1E9sWd9hU23kOD8N9gY.dC2N/wJ9gU1gO3Y8jO6iK2k6');
		return { sucesso: false, erro: 'E-mail ou senha incorretos' };
	}

	const senhaValida = await verificarSenha(dados.senha, usuario.senha_hash);
	if (!senhaValida) {
		return { sucesso: false, erro: 'E-mail ou senha incorretos' };
	}

	const academias = await buscarAcademiasDoUsuario(usuario.id_usuario);
	if (academias.length === 0) {
		return { sucesso: false, erro: 'Este usuário não possui vínculo ativo com nenhum dojo' };
	}

	let academiaSelecionadaId: number;

	if (dados.idAcademia) {
		const pertence = academias.some((a) => a.id_academia === dados.idAcademia);
		if (!pertence) {
			return { sucesso: false, erro: 'Você não tem permissão para acessar o dojo informado' };
		}
		academiaSelecionadaId = dados.idAcademia;
	} else if (academias.length === 1) {
		academiaSelecionadaId = academias[0].id_academia;
	} else {
		// Usuário possui múltiplos dojos: solicita a escolha antes de abrir a sessão
		return {
			sucesso: false,
			precisaSelecionarAcademia: true,
			academias,
			idUsuario: usuario.id_usuario
		};
	}

	// Gera token de sessão (7 dias de validade)
	const { tokenPuro, tokenHash } = gerarTokenSessao();
	const expiraEm = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

	await criarSessao({
		idUsuario: usuario.id_usuario,
		idAcademia: academiaSelecionadaId,
		tokenHash,
		expiraEm,
		ip: meta.ip,
		userAgent: meta.userAgent
	});

	return {
		sucesso: true,
		tokenPuro,
		expiraEm,
		idAcademia: academiaSelecionadaId,
		usuario: {
			id: usuario.id_usuario,
			nome: usuario.nome,
			email: usuario.email
		}
	};
}

/**
 * Encerra a sessão ativa do usuário invalidando-a no banco de dados.
 */
export async function encerrarSessao(tokenPuro: string): Promise<void> {
	if (!tokenPuro) return;
	const tokenHash = calcularHashToken(tokenPuro);
	await revogarSessaoPorHash(tokenHash);
}
