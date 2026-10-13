-- =============================================================================
-- Hinode - Sistema de Gestão de Dojos
-- Script de CRIAÇÃO COMPLETA do banco de dados (V4)
--
-- Já inclui todos os ajustes de segurança e regras de negócio da migration 001.
-- Use este arquivo para instalações NOVAS. Quem já tem o banco criado com a V3
-- deve usar a migration 001_ajustes_seguranca_regras.sql.
--
-- Requisitos: MySQL 8.0.16 ou superior (CHECK só é aplicado a partir desta versão).
--
-- Como executar (cria o banco e todas as tabelas):
--   mysql -u root -p < conf/sql/HinodeV4.sql
--
-- ATENÇÃO: este script NÃO apaga nada. Se o banco hinode_db já existir com tabelas,
-- ele falhará ao recriá-las. Faça backup antes de qualquer teste sobre um banco existente.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS hinode_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE hinode_db;

-- =======================================================
-- 1. ENTIDADES BASE (SEM ENDEREÇO DIRETO NA TABELA)
-- =======================================================

CREATE TABLE Academia (
    id_academia INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    inscr_est VARCHAR(50),
    telefone VARCHAR(20)
);

CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    -- Maioridade é SEMPRE calculada no servidor a partir desta data (nunca por campo booleano)
    data_nascimento DATE NOT NULL,
    genero ENUM('M', 'F') NOT NULL DEFAULT 'M',
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL, -- apenas hash (argon2id/bcrypt), nunca senha pura
    telefone VARCHAR(20)
);

CREATE TABLE Perfil (
    id_perfil INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL UNIQUE -- Admin, Recepção, Professor, Aluno, Responsável
);

-- Perfis padrão do sistema
INSERT INTO Perfil (role) VALUES
    ('Admin'),
    ('Recepção'),
    ('Professor'),
    ('Aluno'),
    ('Responsável');

-- =======================================================
-- 2. TABELAS ESPECÍFICAS DE ENDEREÇO (RELAÇÃO 1:1)
-- =======================================================

CREATE TABLE Endereco_Academia (
    id_academia INT PRIMARY KEY,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    cep VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_academia) REFERENCES Academia(id_academia) ON DELETE CASCADE
);

CREATE TABLE Endereco_Usuario (
    id_usuario INT PRIMARY KEY,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    cep VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- =======================================================
-- 3. RELACIONAMENTOS GERAIS DE USUÁRIO
-- =======================================================

-- M:N - Usuários contêm Academias (Tenants)
CREATE TABLE Usuario_Academia (
    id_usuario INT,
    id_academia INT,
    PRIMARY KEY (id_usuario, id_academia),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_academia) REFERENCES Academia(id_academia) ON DELETE CASCADE
);

-- M:N - Usuário possui Perfil
CREATE TABLE Usuario_Perfil (
    id_usuario INT,
    id_perfil INT,
    PRIMARY KEY (id_usuario, id_perfil),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_perfil) REFERENCES Perfil(id_perfil) ON DELETE CASCADE
);

-- Sessões de login (aplicação stateless: qualquer instância atende qualquer requisição)
--  - Apenas o HASH (SHA-256 em hexadecimal) do token fica aqui; o token puro vive só no cookie.
--  - A FK composta garante que a sessão só existe para uma academia
--    à qual o usuário realmente está vinculado.
CREATE TABLE Sessao (
    id_sessao BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_academia INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    revogada_em DATETIME NULL,
    ip VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    UNIQUE KEY uq_sessao_token_hash (token_hash),
    KEY idx_sessao_usuario_academia (id_usuario, id_academia),
    KEY idx_sessao_expira_em (expira_em),
    CONSTRAINT fk_sessao_usuario_academia
        FOREIGN KEY (id_usuario, id_academia)
        REFERENCES Usuario_Academia (id_usuario, id_academia)
        ON DELETE CASCADE
);

-- =======================================================
-- 4. HERANÇA DE USUÁRIO (O / Overlapping)
-- =======================================================

CREATE TABLE Responsavel (
    id_usuario INT PRIMARY KEY,
    grau_parentesco VARCHAR(50),
    financeiro BOOLEAN,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE Professor (
    id_usuario INT PRIMARY KEY,
    n_federacao VARCHAR(50),
    grau_faixa VARCHAR(50),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE Aluno (
    id_usuario INT PRIMARY KEY,
    matricula VARCHAR(50),
    peso DECIMAL(5,2),
    categoria VARCHAR(50),
    n_federacao VARCHAR(50),
    status_federacao VARCHAR(50),
    data_primeira_graduacao DATE,
    data_inicio DATE,
    graduacao_atual VARCHAR(50),
    grupo_especial_aspirante VARCHAR(50),
    -- Um aluno responde tecnicamente a UM único professor responsável.
    -- RESTRICT: não é possível apagar um professor que ainda tem alunos vinculados.
    id_professor_responsavel INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_aluno_professor_responsavel
        FOREIGN KEY (id_professor_responsavel) REFERENCES Professor(id_usuario) ON DELETE RESTRICT
);

-- N:M - Responsável representa Aluno
CREATE TABLE Responsavel_Aluno (
    id_responsavel INT,
    id_aluno INT,
    grau_parentesco VARCHAR(50) DEFAULT 'Responsável Legal',
    financeiro BOOLEAN DEFAULT 0,
    PRIMARY KEY (id_responsavel, id_aluno),
    FOREIGN KEY (id_responsavel) REFERENCES Responsavel(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_aluno) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- =======================================================
-- 5. TREINOS E TURMAS
-- =======================================================

CREATE TABLE Treino_Turma (
    id_treino INT AUTO_INCREMENT PRIMARY KEY,
    id_academia INT NOT NULL,
    descricao VARCHAR(255),
    horario_inicio TIME,
    horario_fim TIME,
    dia_semana VARCHAR(50),
    FOREIGN KEY (id_academia) REFERENCES Academia(id_academia) ON DELETE CASCADE
);

-- M:N - Professor treina Turma
CREATE TABLE Professor_Treino (
    id_professor INT,
    id_treino INT,
    PRIMARY KEY (id_professor, id_treino),
    FOREIGN KEY (id_professor) REFERENCES Professor(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_treino) REFERENCES Treino_Turma(id_treino) ON DELETE CASCADE
);

-- N:M - Aluno participa em Treino/Turma
CREATE TABLE Aluno_Treino (
    id_aluno INT,
    id_treino INT,
    PRIMARY KEY (id_aluno, id_treino),
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_treino) REFERENCES Treino_Turma(id_treino) ON DELETE CASCADE
);

-- =======================================================
-- 6. EVENTOS (Herança D / Disjoint) E SEU ENDEREÇO
-- =======================================================

CREATE TABLE Evento (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_academia INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    edicao VARCHAR(50),
    data_inicio DATE,
    FOREIGN KEY (id_academia) REFERENCES Academia(id_academia) ON DELETE CASCADE
);

CREATE TABLE Endereco_Evento (
    id_evento INT PRIMARY KEY,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(20),
    complemento VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    cep VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_evento) REFERENCES Evento(id_evento) ON DELETE CASCADE
);

-- N:M:N - Participação (Inscrição) de Alunos e Professores em Eventos
--  - Status restrito a Pendente / Confirmada / Cancelada.
--  - Inscrição de ALUNO ou de PROFESSOR: exatamente um dos dois, nunca ambos nem nenhum.
--  - Sem inscrição duplicada do mesmo atleta no mesmo evento.
CREATE TABLE Inscricao_Evento (
    id_inscricao INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT,
    id_professor INT,
    id_evento INT NOT NULL,
    data_inicio_inscricao DATE,
    data_fim_inscricao DATE,
    status_inscricao VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    valor DECIMAL(10,2),
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_professor) REFERENCES Professor(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_evento) REFERENCES Evento(id_evento) ON DELETE CASCADE,
    CONSTRAINT chk_inscricao_status
        CHECK (status_inscricao IN ('Pendente', 'Confirmada', 'Cancelada')),
    CONSTRAINT chk_inscricao_aluno_xor_professor
        CHECK ((id_aluno IS NULL) <> (id_professor IS NULL)),
    UNIQUE KEY uq_inscricao_evento_aluno (id_evento, id_aluno),
    UNIQUE KEY uq_inscricao_evento_professor (id_evento, id_professor)
);

-- Subtipo de Evento
CREATE TABLE Campeonato (
    id_evento INT PRIMARY KEY,
    tipo_campeonato VARCHAR(100),
    classificacao_academia VARCHAR(100),
    limite_graduacao VARCHAR(100),
    limite_grupo VARCHAR(100),
    FOREIGN KEY (id_evento) REFERENCES Evento(id_evento) ON DELETE CASCADE
);

-- 1:N - Campeonato tem Classificação
--  - Um resultado por aluno em cada campeonato.
--  - Vitórias não podem exceder lutas; valores não negativos.
CREATE TABLE Classificacao (
    id_classificacao INT AUTO_INCREMENT PRIMARY KEY,
    id_campeonato INT NOT NULL,
    id_aluno INT NOT NULL,
    classificacao_aluno VARCHAR(50),
    qtd_lutas INT NOT NULL DEFAULT 0,
    qtd_vitorias INT NOT NULL DEFAULT 0,
    FOREIGN KEY (id_campeonato) REFERENCES Campeonato(id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY uq_classificacao_campeonato_aluno (id_campeonato, id_aluno),
    CONSTRAINT chk_classificacao_lutas_vitorias
        CHECK (qtd_lutas >= 0 AND qtd_vitorias >= 0 AND qtd_vitorias <= qtd_lutas)
);

-- Subtipo de Evento
CREATE TABLE Graduacao_Evento (
    id_evento INT PRIMARY KEY,
    tipo_graduacao VARCHAR(100),
    status VARCHAR(50),
    requisitos TEXT,
    FOREIGN KEY (id_evento) REFERENCES Evento(id_evento) ON DELETE CASCADE
);

-- =======================================================
-- 7. HISTÓRICO DE GRADUAÇÃO (IMUTÁVEL / INSERT-ONLY)
-- =======================================================

-- 1:N - Histórico Registrado na Graduação
--  - Registra a faixa, a data e o professor que homologou o exame.
--  - FKs com RESTRICT: apagar aluno ou evento de graduação NÃO apaga o histórico
--    (exclusões em cascata não disparam triggers, por isso o RESTRICT é a proteção real).
--  - Triggers abaixo bloqueiam UPDATE e DELETE. Correção = inserir novo registro.
CREATE TABLE Historico_Graduacao (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    id_evento_graduacao INT NOT NULL,
    id_aluno INT NOT NULL,
    id_professor_homologador INT NOT NULL,
    data_graduacao DATE,
    associacao VARCHAR(100),
    faixa VARCHAR(50),
    CONSTRAINT fk_hist_grad_evento
        FOREIGN KEY (id_evento_graduacao) REFERENCES Graduacao_Evento(id_evento) ON DELETE RESTRICT,
    CONSTRAINT fk_hist_grad_aluno
        FOREIGN KEY (id_aluno) REFERENCES Aluno(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_hist_grad_professor
        FOREIGN KEY (id_professor_homologador) REFERENCES Professor(id_usuario) ON DELETE RESTRICT
);

CREATE TRIGGER trg_hist_grad_bloqueia_update
BEFORE UPDATE ON Historico_Graduacao
FOR EACH ROW
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Historico_Graduacao e insert-only: UPDATE nao permitido.';

CREATE TRIGGER trg_hist_grad_bloqueia_delete
BEFORE DELETE ON Historico_Graduacao
FOR EACH ROW
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Historico_Graduacao e insert-only: DELETE nao permitido.';

-- =======================================================
-- 8. LOG DE AUDITORIA (LGPD / INSERT-ONLY)
-- =======================================================

--  - Sem chaves estrangeiras de propósito: excluir usuário/academia não pode apagar o rastro.
--  - id_academia e id_usuario podem ser NULL (ex.: tentativa de login falha, antes de haver sessão).
--  - dados_antes / dados_depois: JSON SEM senha, token ou CPF completo.
CREATE TABLE Log_Auditoria (
    id_log BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_academia INT NULL,
    id_usuario INT NULL,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NULL,
    id_entidade VARCHAR(64) NULL,
    dados_antes JSON NULL,
    dados_depois JSON NULL,
    ip VARCHAR(45) NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_log_academia_data (id_academia, criado_em),
    KEY idx_log_usuario_data (id_usuario, criado_em),
    KEY idx_log_entidade (entidade, id_entidade)
);

CREATE TRIGGER trg_log_auditoria_bloqueia_update
BEFORE UPDATE ON Log_Auditoria
FOR EACH ROW
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Log_Auditoria e insert-only: UPDATE nao permitido.';

CREATE TRIGGER trg_log_auditoria_bloqueia_delete
BEFORE DELETE ON Log_Auditoria
FOR EACH ROW
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Log_Auditoria e insert-only: DELETE nao permitido.';

-- =============================================================================
-- RECOMENDAÇÃO (aplicar manualmente, conforme o usuário da aplicação):
-- o usuário MySQL usado pelo SvelteKit NÃO deve ter UPDATE/DELETE nas tabelas
-- insert-only, nem permissões administrativas (DROP, ALTER, CREATE).
-- Conceda permissões POR TABELA (um REVOKE parcial não funciona sobre um GRANT
-- dado no banco inteiro). Exemplo:
--   CREATE USER 'hinode_app'@'%' IDENTIFIED BY '<senha-forte-vinda-do-.env>';
--   -- Tabelas comuns (repita para cada uma):
--   GRANT SELECT, INSERT, UPDATE, DELETE ON hinode_db.Aluno TO 'hinode_app'@'%';
--   -- Tabelas insert-only:
--   GRANT SELECT, INSERT ON hinode_db.Historico_Graduacao TO 'hinode_app'@'%';
--   GRANT SELECT, INSERT ON hinode_db.Log_Auditoria       TO 'hinode_app'@'%';
-- Triggers não protegem contra TRUNCATE/DROP; só as permissões protegem.
-- =============================================================================
