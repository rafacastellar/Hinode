Estamos desenvolvendo um projeto acadêmico de uma plataforma SaaS Multi-Tenant para gestão de Judô utilizando SvelteKit (TypeScript) e Prisma ORM conectado a um banco MySQL autogerenciado (rodando em ambiente local/AWS).

Já possuímos o arquivo 'schema.prisma' mapeando tabelas de herança para Usuários (Aluno, Professor, Responsável) e isolamento lógico utilizando o campo 'id_academia' em Treinos e Eventos.

### Objetivo Atual (Fatia 1: Inicialização do Prisma e Segurança):
1. Crie o arquivo de inicialização do cliente do Prisma em 'src/lib/server/db.ts' usando o padrão Singleton para evitar estouro de conexões com o MySQL durante o desenvolvimento (hot-reloads do SvelteKit).
2. Forneça o arquivo '.env' de exemplo contendo a string de conexão correta do Prisma para acessar nosso MySQL informando IP da Máquina Virtual, Porta, Usuário, Senha e Nome do Banco de Dados.
3. Desenvolva o backend da tela de Login ('src/routes/login/+page.server.ts'). Na Action de login, você deve:
   - Receber o e-mail e a senha do usuário.
   - Usar o Prisma para buscar o usuário e incluir suas relações com 'Usuario_Academia' e 'Usuario_Perfil' para sabermos qual o Tenant e o Perfil de acesso dele.
   - (Apenas simule a checagem do hash da senha por enquanto usando uma comparação simples ou bcrypt).
   - Se for válido, crie um Cookie de sessão criptografado ou seguro contendo as informações críticas do usuário logado.

Escreva códigos limpos, tipados nativamente pelo Prisma Client gerado e prontos para o ambiente SvelteKit.
