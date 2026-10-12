import 'dotenv/config';
import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';

/**
 * Pool de conexões MySQL centralizado do SaaS Judô Hinodê.
 * Utiliza variáveis de ambiente do servidor com fallback seguro para dev local.
 */
let poolInstance: Pool | null = null;

export function getDbPool(): Pool {
	if (!poolInstance) {
		poolInstance = mysql.createPool({
			host: process.env.DB_HOST || 'localhost',
			port: Number(process.env.DB_PORT) || 3306,
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || '',
			database: process.env.DB_NAME || 'hinode_db',
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
			timezone: 'Z',
			decimalNumbers: true
		});
	}
	return poolInstance;
}

/**
 * Helper para execução de transações ACID no MySQL.
 * Garante START TRANSACTION, COMMIT no sucesso, ROLLBACK em qualquer falha
 * e liberação imediata da conexão de volta ao pool no bloco finally.
 */
export async function executarTransacao<T>(
	callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
	const pool = getDbPool();
	const conn = await pool.getConnection();

	try {
		await conn.beginTransaction();
		const resultado = await callback(conn);
		await conn.commit();
		return resultado;
	} catch (erro) {
		await conn.rollback();
		throw erro;
	} finally {
		conn.release();
	}
}
