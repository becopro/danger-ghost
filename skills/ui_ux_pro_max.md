# 🎨 SKILL: UI/UX PRO MAX - STYLE SYSTEM AND INTERACTION PRINCIPLES

Este manual contém as paletas, estilos e regras de interação de alto nível para interfaces ricas no ecossistema Danger Ghost.

---

## 🎨 161 PALETAS E SISTEMAS DE CORES HSL

Priorizar o uso de cores calibradas e harmônicas HSL em vez de cores sólidas e saturadas:
*   **Tema Cyberpunk Gótico (Principal):**
    *   Fundo principal: `hsl(0, 0%, 2%)` (Cinza profundo próximo ao preto)
    *   Painéis de Gaveta: `hsl(0, 0%, 5%)` com bordas em `hsla(0, 0%, 100%, 0.07)`
    *   Acento Ciano (Score/Rank): `hsl(180, 100%, 50%)`
    *   Acento Magenta (Level/Ações): `hsl(300, 100%, 50%)`
    *   Acento Amarelo (Controles/Avisos): `hsl(60, 100%, 50%)`
*   **Paleta de Estado (Feedback):**
    *   Sucesso / Sincronizado: `hsl(120, 100%, 40%)`
    *   Processando / Salvando: `hsl(39, 100%, 50%)` (Laranja)
    *   Erro / Desconectado: `hsl(0, 100%, 50%)` (Vermelho sutil)

---

## 📐 99 REGRAS DE UX PARA INTERFACES PREMIUM

Para garantir que a UI/UX pareça feita por profissionais experientes:

### Interações Móveis e Táteis (Mobile Friendly)
1.  **Tap Targets:** Botões e elementos interativos devem possuir área de clique mínima de `44px x 44px` (ou padding adequado) para evitar erros de toque em dispositivos móveis.
2.  **Touch Delay:** Evitar comportamentos de atraso visual ao tocar em botões do navbar lateral.

### Micro-animações e Transições
3.  **Hover Feedback:** Todo elemento clicável deve reagir instantaneamente (ex: escala de 1.05 e brilho de borda).
4.  **Transitions Coordenadas:** Transições devem durar entre `50ms` e `150ms` para parecerem reativas e não lentas.

### Layout e Responsividade
5.  **Grids Flexíveis:** Utilizar Flexbox e CSS Grid com unidades fluidas (`clamp()`, `rem`, `vw`) para se adaptarem de celulares a monitores ultra-wide.
6.  **Hierarquia Clara:** Títulos sempre em caixa alta com fontes geométricas e espaçamento expandido, e textos de descrição com tamanhos menores e legíveis.
