import { getDbPool } from '../db/pool';

/**
 * Configurações de Segurança do Rate Limiter de Login (Anti-Brute Force).
 * Alinhado às recomendações da OWASP:
 * - 5 tentativas falhas permitidas por e-mail ou IP em janela de 15 minutos.
 * - Bloqueio temporário estrito de 15 minutos ao atingir a 5ª falha.
 * - Registro de incidentes no Log_Auditoria do banco para rastreabilidade imutável.
 */
export const LIMITE_CONFIG = {
	MAX_TENTATIVAS_FALHAS: 5,
	JANELA_TENTATIVAS_MS: 15 * 60 * 1000, // 15 minutos
	DURACAO_BLOQUEIO_MS: 15 * 60 * 1000 // 15 minutos
};

interface RegistroTentativa {
	tentativas: number;
	primeiraTentativaEm: number;
	ultimaTentativaEm: number;
	bloqueadoAte?: number;
}

// Armazenamento em memória (alta velocidade, zero impacto de performance no MySQL sob ataque)
const tentativasPorChave = new Map<string, RegistroTentativa>();

/**
 * Normaliza e-mail e IP para geração das chaves de controle.
 */
function normalizarEmail(email: string): string {
	return email.trim().toLowerCase();
}

function normalizarIp(ip?: string | null): string {
	if (!ip) return 'desconhecido';
	return ip.trim().replace(/^::ffff:/, ''); // normaliza IPv4 mapeado em IPv6
}

/**
 * Remove registros antigos (mais de 30 minutos sem atividade) para evitar vazamento de memória.
 */
function limparRegistrosObsoletos() {
	const limite = Date.now() - 30 * 60 * 1000;
	for (const [chave, reg] of tentativasPorChave.entries()) {
		if (reg.ultimaTentativaEm < limite && (!reg.bloqueadoAte || reg.bloqueadoAte < Date.now())) {
			tentativasPorChave.delete(chave);
		}
	}
}

// Limpeza periódica a cada 10 minutos
setInterval(limparRegistrosObsoletos, 10 * 60 * 1000).unref?.();

/**
 * Registra um evento de auditoria no MySQL quando ocorre tentativa de invasão ou bloqueio.
 */
async function registrarAuditoriaSeguranca(
	acao: 'LOGIN_BLOQUEIO_FORCA_BRUTA' | 'LOGIN_FALHA',
	email: string,
	ip?: string | null,
	detalhes?: Record<string, unknown>
): Promise<void> {
	try {
		const pool = getDbPool();
		await pool.execute(
			`INSERT INTO Log_Auditoria (
				id_academia,
				id_usuario,
				acao,
				entidade,
				id_entidade,
				dados_depois,
				ip,
				criado_em
			) VALUES (NULL, NULL, ?, 'Usuario', ?, ?, ?, NOW(3))`,
			[
				acao,
				email.substring(0, 64),
				JSON.stringify(detalhes || { email }),
				ip ? ip.substring(0, 45) : null
			]
		);
	} catch (erro) {
		console.error('[RateLimiter] Falha ao registrar log de auditoria:', erro);
	}
}

export interface StatusBloqueio {
	bloqueado: boolean;
	minutosRestantes?: number;
	mensagem?: string;
}

/**
 * Verifica se o e-mail ou o IP informado estão sob bloqueio temporário ativo.
 */
export function verificarBloqueioLogin(email: string, ip?: string | null): StatusBloqueio {
	const agora = Date.now();
	const chaveEmail = `email:${normalizarEmail(email)}`;
	const chaveIp = `ip:${normalizarIp(ip)}`;

	const regEmail = tentativasPorChave.get(chaveEmail);
	const regIp = ip ? tentativasPorChave.get(chaveIp) : null;

	// Verifica se a conta (e-mail) está bloqueada
	if (regEmail?.bloqueadoAte && regEmail.bloqueadoAte > agora) {
		const minutosRestantes = Math.max(1, Math.ceil((regEmail.bloqueadoAte - agora) / (60 * 1000)));
		return {
			bloqueado: true,
			minutosRestantes,
			mensagem: `Muitas tentativas incorretas. Conta bloqueada temporariamente. Tente novamente em ${minutosRestantes} minuto(s).`
		};
	}

	// Verifica se o IP está bloqueado
	if (regIp?.bloqueadoAte && regIp.bloqueadoAte > agora) {
		const minutosRestantes = Math.max(1, Math.ceil((regIp.bloqueadoAte - agora) / (60 * 1000)));
		return {
			bloqueado: true,
			minutosRestantes,
			mensagem: `Muitas tentativas incorretas a partir deste IP. Bloqueio temporário ativo. Tente novamente em ${minutosRestantes} minuto(s).`
		};
	}

	return { bloqueado: false };
}

export interface ResultadoRegistroFalha {
	bloqueado: boolean;
	tentativasRestantes: number;
	minutosBloqueio?: number;
}

/**
 * Computa uma falha de credenciais (e-mail ou senha inválidos).
 * Se o limite de 5 falhas for atingido, bloqueia por 15 minutos e grava no Log_Auditoria.
 */
export async function registrarFalhaLogin(
	email: string,
	ip?: string | null
): Promise<ResultadoRegistroFalha> {
	const agora = Date.now();
	const emailNorm = normalizarEmail(email);
	const chaveEmail = `email:${emailNorm}`;
	const chaveIp = `ip:${normalizarIp(ip)}`;

	let regEmail = tentativasPorChave.get(chaveEmail);

	// Se passou da janela de 15 minutos desde o primeiro erro, reinicia a contagem
	if (!regEmail || agora - regEmail.primeiraTentativaEm > LIMITE_CONFIG.JANELA_TENTATIVAS_MS) {
		regEmail = {
			tentativas: 1,
			primeiraTentativaEm: agora,
			ultimaTentativaEm: agora
		};
	} else {
		regEmail.tentativas += 1;
		regEmail.ultimaTentativaEm = agora;
	}

	// Também contabiliza por IP para mitigar ataques em lote
	let regIp = tentativasPorChave.get(chaveIp);
	if (!regIp || agora - regIp.primeiraTentativaEm > LIMITE_CONFIG.JANELA_TENTATIVAS_MS) {
		regIp = {
			tentativas: 1,
			primeiraTentativaEm: agora,
			ultimaTentativaEm: agora
		};
	} else {
		regIp.tentativas += 1;
		regIp.ultimaTentativaEm = agora;
	}

	const limiteAtingido = regEmail.tentativas >= LIMITE_CONFIG.MAX_TENTATIVAS_FALHAS;

	if (limiteAtingido) {
		regEmail.bloqueadoAte = agora + LIMITE_CONFIG.DURACAO_BLOQUEIO_MS;
		regIp.bloqueadoAte = agora + LIMITE_CONFIG.DURACAO_BLOQUEIO_MS;
		tentativasPorChave.set(chaveEmail, regEmail);
		tentativasPorChave.set(chaveIp, regIp);

		// Auditoria do bloqueio
		await registrarAuditoriaSeguranca('LOGIN_BLOQUEIO_FORCA_BRUTA', emailNorm, ip, {
			email: emailNorm,
			tentativasFalhas: regEmail.tentativas,
			duracaoBloqueioMinutos: 15,
			ip: ip || 'desconhecido'
		});

		return {
			bloqueado: true,
			tentativasRestantes: 0,
			minutosBloqueio: 15
		};
	}

	tentativasPorChave.set(chaveEmail, regEmail);
	tentativasPorChave.set(chaveIp, regIp);

	const restantes = Math.max(0, LIMITE_CONFIG.MAX_TENTATIVAS_FALHAS - regEmail.tentativas);

	// Registra log individual de falha
	await registrarAuditoriaSeguranca('LOGIN_FALHA', emailNorm, ip, {
		email: emailNorm,
		tentativaNumero: regEmail.tentativas,
		tentativasRestantes: restantes
	});

	return {
		bloqueado: false,
		tentativasRestantes: restantes
	};
}

/**
 * Zera o contador de tentativas e cancela eventuais bloqueios após um login bem-sucedido.
 */
export function resetarTentativasLogin(email: string, ip?: string | null): void {
	const chaveEmail = `email:${normalizarEmail(email)}`;
	tentativasPorChave.delete(chaveEmail);

	if (ip) {
		const chaveIp = `ip:${normalizarIp(ip)}`;
		tentativasPorChave.delete(chaveIp);
	}
}
