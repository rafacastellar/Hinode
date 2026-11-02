import { getDbPool } from './pool';

let sincronizadoComSucesso = false;
let tentandoExecutar = false;

/**
 * Garante que colunas adicionadas em migrações recentes existam na base de dados conectada,
 * prevenindo falhas de 'Unknown column' mesmo se a migração manual ainda não tiver sido rodada.
 */
export async function sincronizarSchemaBanco(): Promise<void> {
	if (sincronizadoComSucesso || tentandoExecutar) return;
	tentandoExecutar = true;

	try {
		const pool = getDbPool();

		// 1. Treino_Turma.capacidade_maxima
		try {
			await pool.execute(
				`ALTER TABLE Treino_Turma ADD COLUMN capacidade_maxima INT NOT NULL DEFAULT 25`
			);
			console.log('[AUTO-MIGRATION] Coluna Treino_Turma.capacidade_maxima criada com sucesso.');
		} catch (err: any) {
			if (err.code !== 'ER_DUP_FIELDNAME') {
				// Ignora caso a coluna já exista
			}
		}

		// 2. Graduacao_Evento.percentual_minimo_presenca
		try {
			await pool.execute(
				`ALTER TABLE Graduacao_Evento ADD COLUMN percentual_minimo_presenca INT NULL DEFAULT 0`
			);
			console.log('[AUTO-MIGRATION] Coluna Graduacao_Evento.percentual_minimo_presenca criada.');
		} catch (err: any) {
			if (err.code !== 'ER_DUP_FIELDNAME') {
				// Ignora se já existir
			}
		}

		// 3. Graduacao_Evento.qtd_minima_aulas_presentes
		try {
			await pool.execute(
				`ALTER TABLE Graduacao_Evento ADD COLUMN qtd_minima_aulas_presentes INT NULL DEFAULT 0`
			);
			console.log('[AUTO-MIGRATION] Coluna Graduacao_Evento.qtd_minima_aulas_presentes criada.');
		} catch (err: any) {
			if (err.code !== 'ER_DUP_FIELDNAME') {
				// Ignora se já existir
			}
		}

		// 4. Presenca_Treino
		try {
			await pool.execute(`
				CREATE TABLE IF NOT EXISTS Presenca_Treino (
					id_presenca BIGINT AUTO_INCREMENT PRIMARY KEY,
					id_academia INT NOT NULL,
					id_treino INT NOT NULL,
					id_aluno INT NOT NULL,
					data_treino DATE NOT NULL,
					status_presenca ENUM('Presente', 'Falta', 'Justificada') NOT NULL DEFAULT 'Presente',
					observacao VARCHAR(255) NULL,
					id_usuario_registro INT NOT NULL,
					atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					UNIQUE KEY uq_presenca_treino_aluno_data (id_treino, id_aluno, data_treino),
					KEY idx_presenca_academia_data (id_academia, data_treino),
					KEY idx_presenca_aluno_academia (id_aluno, id_academia)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
			`);
			console.log('[AUTO-MIGRATION] Tabela Presenca_Treino sincronizada.');
		} catch (err: any) {
			// Ignora caso já exista
		}

		sincronizadoComSucesso = true;
	} catch (err) {
		console.error('[AUTO-MIGRATION] Não foi possível verificar/aplicar migração automática:', err);
	} finally {
		tentandoExecutar = false;
	}
}

