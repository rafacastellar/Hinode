-- Criação da Base de Dados
CREATE DATABASE IF NOT EXISTS hinode_db;
USE hinode_db;

-- =======================================================
-- 1. ENTIDADES BASE (SEM ENDEREÇO DICTO NA TABELA)
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
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20)
);

CREATE TABLE Perfil (
    id_perfil INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL -- Admin, Recepção, Professor, Aluno, Responsável
);

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
    peso DECIMAL(5,2),
    categoria VARCHAR(50),
    n_federacao VARCHAR(50),
    status_federacao VARCHAR(50),
    data_primeira_graduacao DATE,
    data_inicio DATE,
    graduacao_atual VARCHAR(50),
    grupo_especial_aspirante VARCHAR(50),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- N:M - Responsável representa Aluno
CREATE TABLE Responsavel_Aluno (
    id_responsavel INT,
    id_aluno INT,
    PRIMARY KEY (id_responsavel, id_aluno),
    FOREIGN KEY (id_responsavel) REFERENCES Responsavel(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_usuario) ON DELETE CASCADE
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
CREATE TABLE Inscricao_Evento (
    id_inscricao INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT, 
    id_professor INT, 
    id_evento INT NOT NULL,
    data_inicio_inscricao DATE,
    data_fim_inscricao DATE,
    status_inscricao VARCHAR(50),
    valor DECIMAL(10,2),
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_professor) REFERENCES Professor(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_evento) REFERENCES Evento(id_evento) ON DELETE CASCADE,
    CHECK (id_aluno IS NOT NULL OR id_professor IS NOT NULL)
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
CREATE TABLE Classificacao (
    id_classificacao INT AUTO_INCREMENT PRIMARY KEY,
    id_campeonato INT NOT NULL,
    id_aluno INT NOT NULL,
    classificacao_aluno VARCHAR(50),
    qtd_lutas INT DEFAULT 0,
    qtd_vitorias INT DEFAULT 0,
    FOREIGN KEY (id_campeonato) REFERENCES Campeonato(id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_usuario) ON DELETE CASCADE
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
-- 7. HISTÓRICO DE GRADUAÇÃO
-- =======================================================

-- 1:N - Histórico Registado na Graduação
CREATE TABLE Historico_Graduacao (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    id_evento_graduacao INT NOT NULL,
    id_aluno INT NOT NULL,
    data_graduacao DATE,
    associacao VARCHAR(100),
    faixa VARCHAR(50),
    FOREIGN KEY (id_evento_graduacao) REFERENCES Graduacao_Evento(id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_usuario) ON DELETE CASCADE
);