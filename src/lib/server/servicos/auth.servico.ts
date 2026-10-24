import { buscarUsuarioPorEmail, buscarAcademiasDoUsuario, type AcademiaVinculada } from '../repositorios/usuario.repo';
import { criarSessao, revogarSessaoPorHash } from '../repositorios/sessao.repo';
import { verificarSenha, gerarTokenSessao, calcularHashToken } from '../auth/criptografia';
import {
	verificarBloqueioLogin,
	registrarFalhaLogin,
	resetarTentativasLogin
} from '../auth/rate-limiter';
import type { LoginInput } from '../validacao/auth.schema';

export const TEMPO_SESSAO = {
	INATIVIDADE_PADRAO_MS: 2 * 60 * 60 * 1000, // 2 horas de inatividade
	LEMBRAR_DISPOSITIVO_MS: 7 * 24 * 60 * 60 * 1000 // 7 dias de persistência
};

export type ResultadoLogin =
	| {
			sucesso: true;
			tokenPuro: string;
			expiraEm: Date;
			lembrar: boolean;
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
 * - Rate Limiter anti-brute force: 5 tentativas falhas bloqueiam o acesso por 15 minutos.
 * - Mensagens de erro informativas indicando tentativas restantes.
 * - Suporte a multi-tenant com seleção de dojo ativo.
 * - Expiração por inatividade de 2 horas (ou 7 dias com 'Lembrar de mim').
 */
export async function autenticarUsuario(
	dados: LoginInput,
	meta: { ip?: string | null; userAgent?: string | null }
): Promise<ResultadoLogin> {
	// 1. Verificação prévia de Rate Limiting (Bloqueio ativo)
	const statusBloqueio = verificarBloqueioLogin(dados.email, meta.ip);
	if (statusBloqueio.bloqueado) {
		return {
			sucesso: false,
			erro: statusBloqueio.mensagem || 'Muitas tentativas incorretas. Conta bloqueada temporariamente.'
		};
	}

	const usuario = await buscarUsuarioPorEmail(dados.email);

	// Se o usuário não existir, simula validação para mitigar timing attacks e registra falha
	if (!usuario) {
		await verificarSenha(dados.senha, '$2a$12$e8YpXg.pW1E9sWd9hU23kOD8N9gY.dC2N/wJ9gU1gO3Y8jO6iK2k6');
		const falha = await registrarFalhaLogin(dados.email, meta.ip);
		if (falha.bloqueado) {
			return {
				sucesso: false,
				erro: 'Limite de 5 tentativas incorretas excedido. Acesso bloqueado por 15 minutos.'
			};
		}
		return {
			sucesso: false,
			erro: `E-mail ou senha incorretos. Você tem mais ${falha.tentativasRestantes} tentativa(s) antes do bloqueio temporário.`
		};
	}

	const senhaValida = await verificarSenha(dados.senha, usuario.senha_hash);
	if (!senhaValida) {
		const falha = await registrarFalhaLogin(dados.email, meta.ip);
		if (falha.bloqueado) {
			return {
				sucesso: false,
				erro: 'Limite de 5 tentativas incorretas excedido. Acesso bloqueado por 15 minutos.'
			};
		}
		return {
			sucesso: false,
			erro: `E-mail ou senha incorretos. Você tem mais ${falha.tentativasRestantes} tentativa(s) antes do bloqueio temporário.`
		};
	}

	// Credenciais válidas: zera o contador de tentativas incorretas
	resetarTentativasLogin(dados.email, meta.ip);

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

	// Calcula validade da sessão: 2 horas de inatividade padrão (ou 7 dias com 'Lembrar de mim')
	const duracaoMs = dados.lembrar
		? TEMPO_SESSAO.LEMBRAR_DISPOSITIVO_MS
		: TEMPO_SESSAO.INATIVIDADE_PADRAO_MS;
	const expiraEm = new Date(Date.now() + duracaoMs);

	const { tokenPuro, tokenHash } = gerarTokenSessao();

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
		lembrar: !!dados.lembrar,
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
