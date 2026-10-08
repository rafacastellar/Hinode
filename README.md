# 🥋 Hinode - Sistema de Gestão de Dojos

SaaS **multi-tenant** para gestão de academias (dojos) de Judô e modalidades relacionadas, com módulos de administração, turmas, alunos, graduações e campeonatos. Cada academia enxerga apenas os seus próprios dados.

> Projeto desenvolvido como trabalho de curso universitário.

## 📌 Status do Projeto

| Legenda | Significado |
|---|---|
| ✅ | Pronto |
| 🚧 | Em desenvolvimento |
| 📋 | Planejado |

## 🚀 Funcionalidades

### 🔐 Administração & Usuários
- 🚧 **Autenticação** com cookie de sessão seguro
- 🚧 **Gestão de academias, usuários e perfis**
- 🚧 **Controle de acesso (RBAC)** com perfis acumulativos: Admin, Recepção, Professor e Aluno. Um mesmo usuário pode ter vários perfis na mesma academia
- 📋 **Responsável legal** obrigatório para alunos menores de idade (CPF, nome e telefone), com um responsável podendo gerenciar vários dependentes

### 🥋 Operação & Treinos
- 🚧 **Gestão de turmas** com horários e dias da semana
- 🚧 **Alocação de professores** por turma
- 🚧 **Matrícula de alunos** em turmas
- 📋 **Vínculo professor-aluno**: um aluno responde tecnicamente a um único professor responsável
- 📋 **Dados do professor**: número de federação e grau/faixa (Dan)

### 🏅 Graduações
- 📋 **Histórico imutável** de evolução do aluno: nova faixa, data do exame e professor homologador (tabela *insert-only*)

### 🏆 Eventos & Competições
- 📋 **Gestão de campeonatos** com resultados e classificação
- 📋 **Inscrição** de alunos e professores, com status *Pendente*, *Confirmada* ou *Cancelada*
- 📋 **Resultado do atleta**: classificação final, quantidade de lutas e de vitórias
- 📋 **Lembretes automáticos** de confirmação de inscrição, baseados nas datas dos campeonatos

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Svelte, HTML5, CSS3, Tailwind CSS |
| Backend | SvelteKit + TypeScript (Node.js), com rotas em `+page.server.ts` e `+server.ts` |
| Banco de dados | MySQL, acessado com `mysql2` (SQL manual, sem ORM) |
| Autenticação | Cookie de sessão (`httpOnly`), com sessões armazenadas no banco |
| Ambiente | Variáveis de ambiente via `.env` |
| Infraestrutura | VM local para testes; migração planejada para AWS (RDS/EC2 e S3) |

## 🏛️ Arquitetura e Segurança

O projeto foi pensado para ser seguro e escalável desde o início:

- **Isolamento multi-tenant manual:** o MySQL não tem Row Level Security nativo, então **toda** query (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) filtra pelo `id_academia` do usuário logado. Esse ID vem sempre da sessão no servidor, nunca de parâmetros enviados pelo cliente.
- **Camada de repositórios:** as rotas não acessam o banco diretamente. Todo acesso passa por funções que recebem `idAcademia` como primeiro parâmetro.
- **Queries parametrizadas:** nenhum valor externo é concatenado em SQL (proteção contra SQL Injection).
- **Regras no servidor:** validações, RBAC e regras de negócio rodam exclusivamente no servidor.
- **Transações ACID:** operações que afetam várias tabelas (ex: graduar um aluno e registrar no histórico) usam `START TRANSACTION`, `COMMIT` e `ROLLBACK`.
- **Cloud-ready (stateless):** nenhum arquivo é salvo no disco local (fotos irão para o S3) e nenhum estado de usuário fica na memória do processo.
- **Senhas e sessões:** senhas armazenadas apenas como hash, cookies com `httpOnly`, `Secure` e `SameSite`, com expiração definida.
- **LGPD:** minimização de dados, atenção especial aos dados de menores e log de auditoria para ações sensíveis.

## 📂 Estrutura do Projeto

```text
Hinode/
├── conf/
│   └── sql/
│       └── HinodeV3.sql            # Script de criação do banco de dados
├── src/
│   ├── hooks.server.ts             # Interceptador global: lê o cookie e injeta o usuário na sessão
│   ├── lib/
│   │   └── server/
│   │       └── db.ts               # Conexão central com o MySQL (pool mysql2)
│   └── routes/
│       ├── +layout.svelte          # Layout global (Sidebar e Navbar com Tailwind)
│       ├── +page.svelte            # Landing page / Home pública
│       ├── login/
│       │   ├── +page.svelte        # Formulário de login
│       │   └── +page.server.ts     # Autenticação e criação do cookie de sessão
│       └── dashboard/
│           ├── +layout.server.ts   # Proteção de rota (valida sessão e id_academia)
│           ├── +page.svelte        # Visão geral do painel administrativo
│           ├── turmas/             # Módulo de treinos
│           │   ├── +page.svelte
│           │   └── +page.server.ts # Consultas sempre filtradas por id_academia
│           └── alunos/             # Módulo de atletas
│               ├── +page.svelte
│               └── +page.server.ts
├── .env                            # Variáveis de ambiente (não versionar)
├── .env.example                    # Modelo das variáveis, sem valores reais
└── package.json
```

> A estrutura evolui com o projeto. Novas regras de negócio e acesso a dados devem ser organizadas em arquivos separados (repositórios, serviços e validações), evitando código monolítico nas rotas.

## ⚙️ Pré-requisitos

- **Node.js** 20 LTS ou superior e **npm**
- **MySQL** 8 ou superior, instalado e em execução (local, VM ou AWS RDS)

## 🔌 Configuração

### 1. Clonar e instalar as dependências

```bash
git clone <url-do-repositorio>
cd Hinode
npm install
```

### 2. Criar o banco de dados

```sql
CREATE DATABASE hinode_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Em seguida, importe o esquema:

```bash
mysql -u root -p hinode_db < conf/sql/HinodeV3.sql
```

### 3. Configurar as variáveis de ambiente

Copie o modelo e preencha com os dados do seu ambiente (IP/porta da VM ou do RDS):

```bash
cp .env.example .env
```

Exemplo de conteúdo:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario
DB_PASSWORD=senha
DB_NAME=hinode_db
```

> ⚠️ **Nunca** envie o arquivo `.env` ao repositório. Confirme que ele está no `.gitignore`.

## ▶️ Como Rodar

### Desenvolvimento

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

### Produção

```bash
npm run build
npm run preview   # pré-visualiza o build localmente
```

## 📁 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Pré-visualiza o build de produção |
| `npm run check` | Verifica tipos TypeScript e Svelte |

## 🗺️ Roadmap

1. Autenticação e sessão com `id_academia`
2. Proteção de rotas e RBAC com perfis acumulativos
3. Módulos de turmas e alunos
4. Responsável legal e vínculo professor-aluno
5. Histórico de graduações
6. Campeonatos, inscrições e resultados
7. Rotina agendada de lembretes de inscrição
8. Migração para AWS (RDS/EC2) e armazenamento de fotos no S3

## 👤 Autoria

Projeto desenvolvido por **Rafael César Gonçalves e Rafael Marques Castellar** como trabalho do curso **Innovation Lab: SaaS Infrastructure** do **Centro Universitário Impacta**.

## 📄 Licença

© 2026 **Rafael César Gonçalves e Rafael Marques Castellar**. Todos os direitos reservados.

Este código é disponibilizado publicamente apenas para fins de avaliação acadêmica e consulta. É proibida a cópia, modificação, distribuição, hospedagem como serviço ou qualquer uso comercial sem autorização prévia e por escrito do autor.
