-- =============================================================================
-- Judô Hinodê - Seed Inicial de Desenvolvimento (seed.sql)
-- Cria uma academia padrão e um usuário Sensei Admin/Professor para testes.
-- Credenciais de acesso:
--   E-mail: admin@hinode.com.br
--   Senha:  Admin@123456
-- =============================================================================

USE hinode_db;

-- 1. Academia Padrão (Tenant 1)
INSERT INTO Academia (id_academia, nome, nome_fantasia, cnpj, inscr_est, telefone)
VALUES (1, 'Associação de Judô Hinodê', 'Judô Hinodê', '12.345.678/0001-90', '123456789', '(11) 98765-4321')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO Endereco_Academia (id_academia, logradouro, numero, complemento, bairro, cidade, uf, cep)
VALUES (1, 'Rua do Tatame', '100', 'Bloco A', 'Liberdade', 'São Paulo', 'SP', '01501-000')
ON DUPLICATE KEY UPDATE logradouro = VALUES(logradouro);

-- 2. Usuário Administrador (Sensei Rafael)
-- Senha: Admin@123456 (hash bcrypt custo 12)
INSERT INTO Usuario (id_usuario, nome, cpf, data_nascimento, email, senha_hash, telefone)
VALUES (
    1,
    'Sensei Rafael Cesar',
    '123.456.789-00',
    '1985-04-15',
    'admin@hinode.com.br',
    '$2b$12$GGRnTn4rYil20vnOcHdVtu55b6vEA9JtVFqDIxEmnGz46Vp6RYfBy',
    '(11) 99999-8888'
)
ON DUPLICATE KEY UPDATE email = VALUES(email), senha_hash = VALUES(senha_hash);

INSERT INTO Endereco_Usuario (id_usuario, logradouro, numero, bairro, cidade, uf, cep)
VALUES (1, 'Avenida Brasil', '500', 'Jardins', 'São Paulo', 'SP', '01430-000')
ON DUPLICATE KEY UPDATE logradouro = VALUES(logradouro);

-- 3. Vínculo Multi-Tenant (Usuário pertence ao Dojo 1)
INSERT IGNORE INTO Usuario_Academia (id_usuario, id_academia)
VALUES (1, 1);

-- 4. Papéis Acumulativos no Tenant 1 (Admin e Professor)
-- id_perfil 1 = Admin, id_perfil 3 = Professor
INSERT IGNORE INTO Usuario_Academia_Perfil (id_usuario, id_academia, id_perfil)
VALUES (1, 1, 1), (1, 1, 3);

-- 5. Registro Técnico de Professor
INSERT INTO Professor (id_usuario, n_federacao, grau_faixa)
VALUES (1, 'FPJ-84920', '2º Dan')
ON DUPLICATE KEY UPDATE grau_faixa = VALUES(grau_faixa);
