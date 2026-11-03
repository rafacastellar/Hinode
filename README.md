# 🥋 SGT Manager • Sistema de Gestão de Tatame

Plataforma **SaaS Multi-Tenant** desenvolvida para federações e academias (dojos) de Judô e modalidades de artes marciais. Oferece controle completo de atletas, graduações imutáveis, turmas, campeonatos e identidade visual independente por academia, com isolamento rigoroso de dados e painel unificado de controle SaaS.

> Projeto desenvolvido como trabalho de curso universitário no **Centro Universitário Impacta** (Disciplina: *Innovation Lab: SaaS Infrastructure*).

---

## 📌 Status do Projeto

| Legenda | Significado |
|---|---|
| ✅ | Concluído e em Produção |
| 🚧 | Em refinamento contínuo |
| 📋 | Planejado no Roadmap |

---

## 🚀 Funcionalidades

### 🌐 Painel Super Admin (SaaS Control Plane - `/saas-admin`)
- ✅ **Radar de Sessões Ativas em Tempo Real:** Visualização consolidada em cards retráteis (Accordions/Pastas) por academia e do próprio SaaS, com encerramento forçado remoto de sessões de usuários ou operadores da plataforma.
- ✅ **Gestão Global de Usuários:** Diretório segmentado por academia e equipe interna SaaS, com criação (`/saas-admin/usuarios/novo`) e edição completa (`/saas-admin/usuarios/[id]/editar`) de usuários, senhas e perfis.
- ✅ **Provisionamento e Suspensão de Tenants:** Criação de academias com admin mestre automático, suspensão/reativação imediata (derrubando sessões ativas do dojo na hora).
- ✅ **Gestão de Identidade Visual & Domínio:** Configuração de fotos de logotipo (`logo_url` WebP), slug personalizado (`/login?dojo=slug`) e suporte a domínio próprio (`dominio_customizado`).

### 🔐 Autenticação & Identidade Visual
- ✅ **Login Neutro SaaS vs. Personalizado:** Acesso genérico via `/login` com arte oficial do SGT Manager, ou acesso customizado com a logo e nome do dojo via subdomínio, domínio próprio ou parâmetro `?dojo=slug`.
- ✅ **Transição Cinematográfica de Login:** Splash screen em tela cheia com logotipo da academia, nome em destaque e barra de carregamento antes de redirecionar ao Dashboard.
- ✅ **Sessões Stateless Seguras:** Cookies `httpOnly` com hash SHA-256 e validação de tenant no servidor (`hooks.server.ts`).
- ✅ **Multi-Tenant RBAC Acumulativo:** Perfis combinados por academia (Admin, Recepção, Professor, Aluno) e suporte a múltiplos vínculos por CPF/E-mail.

### 🏢 Painel da Academia (`/dashboard`)
- ✅ **White-label Adaptativo:** Sidebar e Topbar enfatizam o logotipo e o nome fantasia do dojo logado, acompanhados do selo *SGT • Gestão Oficial de Tatame*.
- ✅ **Upload de Logotipo pelo Dojo Admin:** Compressão automática no navegador (HTML5 Canvas para WebP 256×256) em `/dashboard/configuracoes`, persistindo sem perda em redeploys.
- ✅ **Gestão de Alunos & Responsáveis Legais:** Cadastro com verificação automática de menoridade no servidor, exigindo responsável legal obrigatório para menores de 18 anos.
- ✅ **Gestão de Turmas & Horários:** Alocação de professores, limites de vagas, dias da semana e matrículas.
- ✅ **Histórico Imutável de Graduações:** Tabela *insert-only* que registra histórico completo de promoções de faixa, data do exame e mestre homologador.
- ✅ **Gestão de Campeonatos:** Inscrições de atletas, súmulas de lutas, controle de vitórias e pódios oficiais.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | Svelte 5 (Runes `$state`, `$derived`, `$effect`), Tailwind CSS v4, Lucide Icons |
| **Backend / Fullstack** | SvelteKit + TypeScript (Node.js), Server Actions (`+page.server.ts`) |
| **Banco de Dados** | MySQL 8.0.16+ (`mysql2/promise`), sem ORM (SQL manual otimizado e seguro) |
| **Autenticação** | Sessões em banco com SHA-256, cookies de segurança máxima (`httpOnly`, `SameSite=Lax`) |
| **Migrações Automáticas** | Sistema próprio `auto-migration.ts` executado no startup + scripts em `/migrations` |
| **Infraestrutura** | VM Linux / Ubuntu com Nginx, túnel de exposição segura e pronto para AWS RDS / EC2 |

---

## 🏛️ Arquitetura e Segurança Multi-Tenant

1. **Isolamento Manual Estrito de Tenant:** Toda e qualquer consulta SQL a dados de dojos inclui explicitamente o filtro `id_academia = ?`. O `id_academia` é injetado diretamente pelo middleware de sessão no servidor (`event.locals`), impossibilitando falsificação por clientes.
2. **Camada de Repositórios & Transações ACID:** Rotas não executam SQL cru. A lógica é centralizada em repositórios (`src/lib/server/repositorios/`) e transações completas (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) garantem atomicidade.
3. **Imutabilidade de Graduações e Auditoria:** Registros de exames de faixas e logs de auditoria são estruturados em modo *insert-only*, prevenindo manipulação histórica de rankings.
4. **Proteção LGPD:** Tratamento estrito de dados sensíveis de menores, cálculo de idade no servidor e minimização de dados expostos em endpoints.

---

## 📂 Estrutura do Projeto

```text
Hinode/
├── migrations/                     # Scripts versionados de evolução do banco (001 a 008)
├── conf/sql/
│   └── HinodeV4.sql                # DDL consolidado de criação do schema (hinode_db)
├── static/
│   ├── img/                        # Ativos visuais estáticos (logo-sgt.jpg, hinode-3d.jpg)
│   └── favicon.svg
├── src/
│   ├── app.d.ts                    # Definições de tipagem global e Sessão (locals)
│   ├── hooks.server.ts             # Middleware de interceptação de sessão, auth e tenant
│   ├── lib/
│   │   ├── components/ui/          # Componentes visuais (BadgeFaixa, modais, etc.)
│   │   └── server/
│   │       ├── db/                 # Conexão central mysql2 e auto-migration no startup
│   │       ├── repositorios/       # Repositórios (saas-admin, academia, usuario, turma, etc.)
│   │       └── servicos/           # Regras de negócio e autenticação (auth.servico.ts)
│   └── routes/
│       ├── +page.svelte            # Landing page pública institucional do SGT Manager
│       ├── login/                  # Portal de acesso (Modo Neutro SGT e Customizado por Dojo)
│       ├── saas-admin/             # Painel Super Admin (Radar de Sessões, Academias, Usuários)
│       │   ├── +page.svelte        # Radar de Sessões Ativas por tenant
│       │   ├── academias/          # Provisionamento, Suspensão e Identidade Visual
│       │   └── usuarios/           # Diretório, Criação (/novo) e Edição (/[id]/editar)
│       └── dashboard/              # Painel do Dojo autenticado
│           ├── +layout.svelte      # Sidebar e Topbar com branding e logo do dojo
│           ├── configuracoes/      # Configuração de logo, slug e domínio pelo Dojo Admin
│           ├── alunos/             # Gestão de alunos e responsáveis
│           ├── turmas/             # Gestão de turmas e presenças
│           ├── graduacoes/         # Registro de exames de faixa
│           └── campeonatos/        # Gestão de torneios e lutas
├── .env.example                    # Modelo seguro de variáveis de ambiente
└── package.json
```

---

## ⚙️ Configuração e Execução

### 1. Clonar e Instalar Dependências

```bash
cd Hinode
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha com as credenciais do seu MySQL:

```bash
cp .env.example .env
```

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=hinode_db
```

### 3. Banco de Dados & Migração Automática

O projeto possui **migração automática no startup** (`auto-migration.ts`). Para inicializar a base a partir do zero:

```bash
mysql -u root -p < conf/sql/HinodeV4.sql
```

A aplicação ficará disponível em `http://localhost:5173`.

### Produção

```bash
# Modo de Desenvolvimento
npm run dev

# Build de Produção
npm run build
npm run preview
```

A aplicação ficará disponível em `http://localhost:5173`.

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Pré-visualiza o build de produção |
| `npm run check` | Verifica tipos TypeScript e Svelte |

## 🗺️ Histórico de Entregas & Roadmap

- [x] Autenticação multi-tenant com cookies criptografados e sessões seguras no MySQL.
- [x] Painel de Controle SaaS (`/saas-admin`) com Radar de Sessões Ativas e encerramento remoto.
- [x] Gestão Global de Usuários com pastas sanfonadas por academia e telas dedicadas de criação/edição.
- [x] Suporte a Identidade Visual por academia com upload de logotipo WebP (Canvas).
- [x] Suporte a rotas com slug (`/login?dojo=hinode`) e domínio personalizado.
- [x] Transição cinematográfica animada com logo do dojo no login.
- [x] Rebranding completo do SaaS para **SGT Manager** mantendo a identidade dos dojos clientes.
- [ ] Exportação de relatórios em PDF/CSV para federações.
- [ ] Integração com gateway de pagamentos para mensalidades de alunos.
- [ ] Deploy automatizado em cluster AWS com RDS Multi-AZ e bucket S3.

---

## 👤 Autoria

Projeto desenvolvido por **Rafael César Gonçalves e Rafael Marques Castellar** como trabalho do curso **Innovation Lab: SaaS Infrastructure** do **Centro Universitário Impacta**.

---

## 📄 Licença

© 2026 **Rafael César Gonçalves e Rafael Marques Castellar**. Todos os direitos reservados.

Este código é disponibilizado publicamente apenas para fins de avaliação acadêmica e consulta. É proibida a cópia, modificação, distribuição, hospedagem como serviço ou qualquer uso comercial sem autorização prévia e por escrito do autor.
