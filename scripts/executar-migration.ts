import 'dotenv/config';
import { getDbPool, fecharPool } from '../src/lib/server/db/pool';

async function aplicarMigration() {
	const pool = getDbPool();
	console.log('[MIGRATION] Aplicando alteração na tabela Usuario...');

	try {
		await pool.query(
			"ALTER TABLE Usuario ADD COLUMN genero ENUM('M', 'F') NOT NULL DEFAULT 'M' AFTER data_nascimento"
		);
		console.log('[MIGRATION] ✅ Coluna genero ENUM(\'M\', \'F\') adicionada com sucesso à tabela Usuario.');
	} catch (erro: any) {
		if (erro.code === 'ER_DUP_FIELDNAME') {
			console.log('[MIGRATION] ℹ️ A coluna genero já existe na tabela Usuario.');
		} else {
			console.error('[MIGRATION] ❌ Erro ao aplicar migration:', erro);
			throw erro;
		}
	} finally {
		await fecharPool();
	}
}

aplicarMigration();
