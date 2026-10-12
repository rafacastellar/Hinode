# Diretrizes de UI/UX e Frontend: SaaS Judô Hinodê

## Stack Tecnológica de Frontend
* **Framework Reativo:** Svelte.
* **Estilização:** Tailwind CSS (utilização estrita de classes utilitárias no HTML).
* **Ícones:** [Defina aqui se vai usar algum pacote, ex: Lucide Svelte, Phosphor Icons ou FontAwesome].

## 1. Filosofia de Design e Identidade Visual
O design da aplicação deve refletir o alto nível, a disciplina e a seriedade do Judô. O sistema abandona estéticas caóticas ou poluídas em favor de um visual **limpo, imponente e moderno**.

* **Tema Principal:** A interface opera estritamente no padrão **"All Black"** (Dark Mode nativo). O fundo deve ser escuro para criar um ambiente imersivo de alto contraste.

* **Tradição nas Entrelinhas:** Evite elementos gráficos óbvios ou clichês (como desenhos de pagodes ou templos). A tradição deve vir de forma sofisticada: uso de espaço negativo, minimalismo e, se necessário, texturas sutis (como a trama do judogi) aplicadas via opacidade em fundos de cards.

* **Logotipo:** Destaque o logotipo da Judô Hinodê (incluindo renderizações em 3D metálico, quando aplicável nas telas de login ou splash screens), garantindo que ele tenha respiro e não concorra com outros elementos.

## 2. Paleta de Cores (Tailwind CSS)
Utilize as classes utilitárias do Tailwind respeitando o contraste direcionado. O vermelho do logo da academia não deve dominar a tela, mas atuar como ponto de atenção cirúrgico.
* **Backgrounds (Fundo da Tela):** Tons escuros absolutos (`bg-black`, `bg-zinc-950`).
* **Superfícies (Cards, Modais, Tabelas):** Contraste leve para criar hierarquia, utilizando `bg-zinc-900` ou `bg-zinc-800` com bordas super sutis (`border-zinc-800`).
* **Ação Primária (Accent):** Utilize vermelho vivo ou branco puro estritamente para botões de ação principal (ex: `bg-red-600 hover:bg-red-700` para "Inscrever Atleta" ou ações críticas).
* **Textos:** 
  * Primário (Títulos): `text-white`.
  * Secundário (Leitura): `text-zinc-300` ou `text-zinc-400`.
  * Desativado/Placeholder: `text-zinc-600`.

## 3. Tipografia Institucional
Abandone fontes texturizadas, "rasgadas" ou inclinadas. A tipografia deve transparecer o peso de uma federação esportiva moderna de alto rendimento.
* **Títulos e Numerais (Dan, Placares, Headers):** Utilize fontes geométricas, limpas e robustas em negrito (ex: *Inter*, *Montserrat* ou *Roboto* via `font-sans font-bold tracking-tight`).
* **Corpo do Texto (Tabelas, Formulários):** Foco total em legibilidade (`font-sans font-normal`). Não utilize itálicos excessivos.

## 4. Imagens e Uso de Espaço (Respiro)
* **Espaço Negativo (White Space):** A interface precisa "respirar". Nunca aglomere informações. Utilize espaçamentos generosos nos componentes (ex: `p-6`, `gap-6`, `mb-8`). Deixe áreas vazias propositais para que o olhar do usuário descanse.
* **Abordagem "Herói" para Atletas:** Ao criar cards de perfil ou banners internos, se for utilizar imagens, foque em UM único sujeito com iluminação dramática. Evite agrupamentos poluidos de várias fotos no mesmo componente.

## 5. Padrões de Desenvolvimento Svelte + Tailwind
Ao codificar as telas, o agente de IA deve seguir estas regras:
* **Zero CSS Customizado:** Toda a estilização deve ser feita utilizando as classes utilitárias do Tailwind no próprio HTML. Não crie tags `<style>` nos componentes Svelte, a menos que seja estritamente necessário para uma animação complexa.
* **Componentização Inteligente:** Isole elementos repetitivos para manter os arquivos `+page.svelte` limpos. 
  * Exemplo: Crie um `BadgeFaixa.svelte` que recebe a cor da faixa como prop e renderiza um chip elegante.
  * Exemplo: Crie um `AtletaCard.svelte` para a listagem de turmas.
* **Interatividade e Estados:** Todo botão ou input deve possuir feedback visual nítido para as ações de `:hover`, `:focus` e `:disabled` (ex: `focus:ring-2 focus:ring-red-500 focus:outline-none`).

## 6. Layout, Responsividade e Feedback Visual
* **Mobile-First Estruturado:** Utilize CSS Grid e Flexbox nativos do Tailwind. O layout administrativo deve empilhar em telas pequenas (`flex-col`) e expandir para sidebar + conteúdo em telas grandes (`lg:flex-row`).
* **Carregamento Elegante:** Como o sistema acessa o MySQL, transições de dados devem exibir Skeleton Loaders sutis (ex: `animate-pulse bg-zinc-800`) em vez de travar a tela branca.
* **Toasts/Notificações:** O feedback de sucesso ("Inscrição Salva") ou erro deve aparecer em pequenos modais flutuantes minimalistas nos cantos da tela, sem interromper o fluxo do usuário.