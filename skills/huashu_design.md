# 🎨 SKILL: HUASHU-DESIGN - ADVANCED CANVAS & UI CONTROL

Esta skill fornece diretrizes avançadas para manipulação profunda de estilos de renderização do Canvas e customização livre do sistema de design sem restrições.

---

## 🕹️ MANIPULAÇÃO DO CANVAS 2D DO JOGO

*   **Pixel Art Scaling:** Garanta que todas as imagens desenhadas no Canvas usem rendering pixelado. No CSS e nas imagens dinâmicas, aplique:
    ```css
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    ```
*   **Double Buffering Virtual:** Para evitar flickering (cintilação) em renderizações complexas de chefes gigantes ou feitiços múltiplos, desenhe primeiramente em um canvas virtual fora do DOM (`document.createElement('canvas')`) e depois desenhe o resultado final no canvas principal com uma única chamada `drawImage()`.

---

## 💅 DESIGN SYSTEM CUSTOMIZATION

*   **Livre Estilização:** Remova restrições genéricas ao projetar painéis de inventário e menus. Use bordas gradientes reais combinando HSL, glows neon sutis (`box-shadow: 0 0 10px var(--color)`), e fundos de vidro acrílico realistas com `backdrop-filter`.
