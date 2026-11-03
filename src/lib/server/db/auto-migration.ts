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

		// 5. Migration 007 & 008: Backoffice Global SaaS (SGT Manager), Bloqueios, Logos e Domínios
		// Academia (ativa, motivo_desativacao, desativada_em, criado_em, logo_url, slug, dominio_customizado)
		const colunasAcademia = [
			`ALTER TABLE Academia ADD COLUMN ativa TINYINT(1) NOT NULL DEFAULT 1`,
			`ALTER TABLE Academia ADD COLUMN motivo_desativacao VARCHAR(255) NULL`,
			`ALTER TABLE Academia ADD COLUMN desativada_em DATETIME NULL`,
			`ALTER TABLE Academia ADD COLUMN criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`,
			`ALTER TABLE Academia ADD COLUMN logo_url MEDIUMTEXT NULL`,
			`ALTER TABLE Academia ADD COLUMN slug VARCHAR(100) NULL`,
			`ALTER TABLE Academia ADD COLUMN dominio_customizado VARCHAR(255) NULL`
		];
		for (const sql of colunasAcademia) {
			try {
				await pool.execute(sql);
			} catch (err: any) {
				if (err.code !== 'ER_DUP_FIELDNAME') {
					// Ignora se já existir
				}
			}
		}

		// Garante logo e slug padrão para a Academia #1 (Judô Hinodê) caso ainda não tenham sido preenchidos
		try {
			await pool.execute(`
				UPDATE Academia
				SET 
					logo_url = COALESCE(logo_url, '/img/hinode-3d.jpg'),
					slug = COALESCE(slug, 'hinode')
				WHERE id_academia = 1
			`);
		} catch (err: any) {
			// Ignora se falhar
		}

		// Usuario (is_super_admin, ativo, motivo_bloqueio_global, bloqueado_global_em)
		const colunasUsuario = [
			`ALTER TABLE Usuario ADD COLUMN is_super_admin TINYINT(1) NOT NULL DEFAULT 0`,
			`ALTER TABLE Usuario ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1`,
			`ALTER TABLE Usuario ADD COLUMN motivo_bloqueio_global VARCHAR(255) NULL`,
			`ALTER TABLE Usuario ADD COLUMN bloqueado_global_em DATETIME NULL`
		];
		for (const sql of colunasUsuario) {
			try {
				await pool.execute(sql);
			} catch (err: any) {
				if (err.code !== 'ER_DUP_FIELDNAME') {
					// Ignora se já existir
				}
			}
		}

		// Usuario_Academia (ativo, motivo_bloqueio, bloqueado_em, vinculado_em)
		const colunasUsuarioAcademia = [
			`ALTER TABLE Usuario_Academia ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1`,
			`ALTER TABLE Usuario_Academia ADD COLUMN motivo_bloqueio VARCHAR(255) NULL`,
			`ALTER TABLE Usuario_Academia ADD COLUMN bloqueado_em DATETIME NULL`,
			`ALTER TABLE Usuario_Academia ADD COLUMN vinculado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
		];
		for (const sql of colunasUsuarioAcademia) {
			try {
				await pool.execute(sql);
			} catch (err: any) {
				if (err.code !== 'ER_DUP_FIELDNAME') {
					// Ignora se já existir
				}
			}
		}

		// Sessao_Saas (Tabela de Sessões Independentes do SGT Manager)
		try {
			await pool.execute(`
				CREATE TABLE IF NOT EXISTS Sessao_Saas (
					id_sessao_saas BIGINT AUTO_INCREMENT PRIMARY KEY,
					id_usuario INT NOT NULL,
					token_hash CHAR(64) NOT NULL,
					criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					expira_em DATETIME NOT NULL,
					revogada_em DATETIME NULL,
					ip VARCHAR(45) NULL,
					user_agent VARCHAR(255) NULL,
					UNIQUE KEY uq_sessao_saas_token_hash (token_hash),
					KEY idx_sessao_saas_usuario (id_usuario),
					KEY idx_sessao_saas_expira_em (expira_em),
					CONSTRAINT fk_sessao_saas_usuario
						FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario) ON DELETE CASCADE
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
			`);
		} catch (err: any) {
			// Ignora se já existir
		}

		// Seed / Garantia do Super Admin do SGT Manager
		try {
			await pool.execute(`
				INSERT INTO Usuario (nome, tipo_documento, cpf, pais_origem, data_nascimento, genero, email, senha_hash, telefone, is_super_admin, ativo)
				VALUES (
					'Super Admin • SGT Manager',
					'CPF',
					'000.000.000-00',
					'Brasil',
					'1990-01-01',
					'M',
					'saas@hinode.com.br',
					'$2b$12$GGRnTn4rYil20vnOcHdVtu55b6vEA9JtVFqDIxEmnGz46Vp6RYfBy',
					'(11) 90000-0000',
					1,
					1
				)
				ON DUPLICATE KEY UPDATE is_super_admin = 1, ativo = 1
			`);
		} catch (err: any) {
			// Ignora se falhar seed
		}

		sincronizadoComSucesso = true;
	} catch (err) {
		console.error('[AUTO-MIGRATION] Não foi possível verificar/aplicar migração automática:', err);
	} finally {
		tentandoExecutar = false;
	}
}

