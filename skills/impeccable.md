# 🛡️ SKILL: IMPECCABLE - DETECTING AND ELIMINATING AI DESIGN VICES

Este manual define as diretrizes para identificar e eliminar os 24 vícios comuns de design gerados por Inteligência Artificial no front-end do jogo *Danger Ghost*.

---

## 🚫 OS 24 VÍCIOS DE DESIGN DE IA (E COMO CORRIGI-LOS)

### 1. Paletas Genéricas e Eletrizantes
*   **Vício:** Uso excessivo de roxos elétricos saturados com degradês para azul ciano sem contexto.
*   **Correção:** Usar paletas de cores harmônicas e coordenadas (ex: HSL calibrado) adequadas ao tema gótico/cyberpunk de *Lugar Nenhum* (ex: cinzas profundos `#0a0a0a`, rosa néon `#FF3366`, amarelo ouro `#FFA500` e ciano escuro `#00FFFF`).

### 2. Glassmorphism Sem Propósito
*   **Vício:** Adicionar `backdrop-filter: blur` em todos os elementos apenas por estética, comprometendo a performance em navegadores móveis.
*   **Correção:** Limitar o efeito de vidro a elementos sobrepostos que realmente necessitem de profundidade visual, como a Gaveta Lateral (#navbarPanel) ou caixas de modais.

### 3. Fontes Sem Hierarquia ou Pesos Errados
*   **Vício:** Misturar fontes ou usar o peso máximo de fontes geométricas (como o Outfit em bold) em textos longos.
*   **Correção:** Usar monospace estilizado (`Courier New`) para painéis de status e dados, e fontes limpas (`Inter`, `Outfit`) com pesos leves ou normais (400-500) para descrições, mantendo contraste legível.

### 4. Animações de Easing Incorretas (Bounce / Quique)
*   **Vício:** Adicionar efeitos de bounce (quique) irritantes em menus e botões (`cubic-bezier` exagerado).
*   **Correção:** Usar transições suaves lineares ou ease-out curtas (`all 0.15s ease-in-out` ou `all 0.05s ease` para botões do menu).

### 5. Bordas Coloridas Unilaterais (Border-Left Colorido)
*   **Vício:** Destacar cards comuns usando uma borda esquerda grossa e colorida sem propósito de status.
*   **Correção:** Usar bordas inteiras sutis de 1px com transparência (`rgba(255, 255, 255, 0.07)`) e usar glows de borda discretos.

### 6. Ícones Genéricos de Fundo
*   **Vício:** Encher fundos com ícones repetidos ou marcas d'água de emojis flutuantes.
*   **Correção:** Utilizar assets de pixel art nativos ou silhuetas estilizadas reais.

### 7. Espaçamentos Apertados (Falta de Padding)
*   **Vício:** Comprimir textos nas bordas de modais ou tabelas para economizar espaço vertical.
*   **Correção:** Manter padding mínimo de `16px` a `24px` em todos os lados de componentes interativos.

*(Os demais 17 vícios incluem sombras duras de cor preta pura, botões menores que 44px, links em azul padrão sem hover estilizado, degradês de fundo desalinhados com o scroll do viewport, layouts não-responsivos e sem Viewport Culling, e falta de fallback tipográfico.)*

---

## 📋 REQUISITOS DE AUDITORIA DE DESIGN

Sempre que criar ou editar componentes visuais no index.html:
1.  **Garanta a Suavidade:** Transições discretas nos hovers (ex: `transform: scale(1.02)` ou `filter: brightness(1.1)`).
2.  **Performance em Primeiro Lugar:** Sem degradês complexos que forcem redraws a cada renderização do canvas.
3.  **Contraste Acessível:** Nomes de jogadores e valores de atributos devem manter relação de contraste de pelo menos 4.5:1.
