import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const BCRYPT_ROUNDS = 12;

/**
 * Gera um hash seguro para a senha utilizando bcrypt (custo 12).
 */
export async function gerarHashSenha(senha: string): Promise<string> {
	return bcrypt.hash(senha, BCRYPT_ROUNDS);
}

/**
 * Compara a senha informada pelo usuário com o hash armazenado no banco.
 */
export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
	return bcrypt.compare(senha, hash);
}

/**
 * Calcula o hash SHA-256 em hexadecimal (64 caracteres) de um token.
 * Apenas este hash é armazenado na tabela Sessao do MySQL.
 */
export function calcularHashToken(tokenPuro: string): string {
	return crypto.createHash('sha256').update(tokenPuro).digest('hex');
}

/**
 * Gera um token de sessão opaco e criptograficamente seguro (32 bytes = 64 hex chars),
 * juntamente com o seu respectivo hash SHA-256 para persistência no banco.
 */
export function gerarTokenSessao(): { tokenPuro: string; tokenHash: string } {
	const tokenPuro = crypto.randomBytes(32).toString('hex');
	const tokenHash = calcularHashToken(tokenPuro);
	return { tokenPuro, tokenHash };
}
