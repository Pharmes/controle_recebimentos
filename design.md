## Identidade Visual Premium
- Estética sofisticada de farmácia de manipulação premium
- Layout limpo, espaçoso e elegante

## Paleta de Cores (OBRIGATÓRIO usar variáveis CSS)
- Preto Pharmes: #1D1D1B (backgrounds, textos principais)
- Dourado Pharmes: #D4A84B (destaques, CTAs, elementos premium)
- Verde Escuro Pharmes: #1C4A3E (elementos secundários, sucesso)
- Creme Pharmes: #F7F4ED (backgrounds claros)

## Tipografia (OBRIGATÓRIO)
- Títulos: Cormorant Garamond (serif, elegante) - classe: font-heading
- Corpo: Montserrat (sans-serif, moderna) - classe: font-body

## CSS Variables Semânticas (usar sempre ao invés de cores diretas)
- --primary: dourado (hsl 40 60% 56%)
- --secondary: verde escuro (hsl 165 46% 20%)
- --background, --foreground, --card, --muted, --border

## Componentes
- Use componentes shadcn/ui customizados
- Botões: primary (dourado), secondary (verde), outline, ghost
- Cards com sombras suaves e bordas arredondadas (0.5rem)
- Inputs com bordas sutis e foco dourado

## Responsividade
- Mobile-first com breakpoints Tailwind
- Layouts flexíveis com grid/flexbox

## Dark Mode
- Suporte automático via classe .dark
- Manter legibilidade e contraste

## Padrões de UI
- Sidebar escura (#1D1D1B) com itens dourados ao ativar
- Headers com logo e navegação clara
- Feedback visual com toasts para ações
- Loading states elegantes
- Tabelas com hover sutil e paginação

NÃO use cores hardcoded. Use sempre as variáveis do design system.