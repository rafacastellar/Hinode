# Hinode - Sistema de Gestão de Dojos - Judô e modalidades relacionadas

Sistema completo de gestão de academias (dojos) de Judô e modalidades relacionadas, com funcionalidades para administração, professores, alunos e eventos.

## 🚀 Funcionalidades

### 🔐 Administração & Usuários
- **Gestão Completa** de academias, usuários e perfis
- **Controle de Acesso** Baseado em perfis (Admin, Professor, Aluno, etc.)

### 🥋 Operação & Treinos
- **Gestão de Turmas** com horários e dias da semana
- **Alocação de Professores** por turma
- **Matrícula de Alunos** em turmas

### 🏆 Eventos & Competições
- **Gestão de Campeonatos** com classificações
- **Gestão de Graduações** com histórico
- **Inscrição** de alunos e professores em eventos
- **Classificação** automática e manual

## 🛠️ Tecnologias

### Backend
- **NestJS** - Framework TypeScript para APIs escaláveis
- **Prisma** - ORM moderno para TypeScript
- **MySQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens

### Frontend (Futuro)
- **Next.js** (a ser implementado)

## 📂 Estrutura do Projeto

Hinode/
├── src/
│   ├── lib/
│   │   └── server/
│   │       └── db.ts           <-- Conexão central do banco (mysql2 ou Prisma)
│   ├── routes/
│   │   ├── +layout.svelte      <-- Layout global do app (Sidebar, Navbar com Tailwind)
│   │   ├── +page.svelte        <-- Landing page / Home pública
│   │   ├── login/
│   │   │   ├── +page.svelte    <-- Formulário de Login visual
│   │   │   └── +page.server.ts <-- Autenticação e criação do Cookie de Sessão
│   │   └── dashboard/
│   │       ├── +layout.server.ts <-- Proteção de Rota (Valida sessão e id_academia)
│   │       ├── +page.svelte    <-- Visão geral do painel administrativo
│   │       ├── turmas/         <-- Módulo de Treinos (Fatia 3)
│   │       │   ├── +page.svelte
│   │       │   └── +page.server.ts <-- SELECT/INSERT com WHERE id_academia = X
│   │       └── alunos/         <-- Módulo de Atletas (Fatia 3)
│   │           ├── +page.svelte
│   │           └── +page.server.ts
│   └── hooks.server.ts         <-- Interceptador global (Lê cookie e injeta usuário na sessão)
├── .env                        <-- Variáveis com IP/Porta da sua VM ou AWS
└── package.json

## 🔌 Configuração do Banco de Dados

### Pré-requisitos
- MySQL instalado e rodando
- Node.js e npm instalados

### Configuração
1. Crie o banco de dados no MySQL:
   ```sql
   CREATE DATABASE hinode_db;
   ```

2. Configure o Prisma:
   - Edite `apps/api/prisma/schema.prisma`:
     ```prisma
     datasource db {
       provider = "mysql"
       url      = env("DATABASE_URL")
     }
     ```
   - Crie um arquivo `.env` na raiz do workspace com:
     ```env
     DATABASE_URL="mysql://usuario:senha@localhost:3306/hinode_db"
     ```

3. Execute as migrações:
   ```bash
   cd apps/api
   npm run migrate
   ```

## 🚀 Como Rodar o Projeto

### Desenvolvimento
1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o backend em modo de desenvolvimento:
   ```bash
   cd apps/api
   npm run dev
   ```

3. O servidor estará disponível em: `http://localhost:3000`

### Produção
1. Compile o backend:
   ```bash
   cd apps/api
   npm run build
   ```

2. Execute a aplicação:
   ```bash
   cd apps/api
   npm run start:prod
   ```

## 📁 Scripts Disponíveis

### apps/api/
- `npm run dev` - Inicia o servidor em modo de desenvolvimento
- `npm run build` - Compila o projeto
- `npm run start:prod` - Inicia o servidor em produção
- `npm run migrate` - Executa migrações do Prisma
- `npm run generate` - Gera o cliente Prisma

### conf/sql/
- `cat conf/sql/HinodeV3.sql | mysql -u root -p hinode_db` - Cria o banco de dados

