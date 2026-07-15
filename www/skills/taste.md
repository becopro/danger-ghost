# 👅 SKILL: TASTE - AESTHETIC JUDGMENT AND VISUAL HARMONY

A habilidade *Taste* fornece os critérios estéticos qualitativos que elevam o front-end do jogo além das regras básicas, focando no julgamento visual de layouts, tipografias, cores e movimentos.

---

## 📐 COMPOSIÇÃO E LAYOUT (JULGAMENTO QUALITATIVO)

*   **Espaço Negativo (Respiro):** Bom design não preenche todas as lacunas da tela. Mantenha áreas vazias ao redor do Canvas e dos modais para direcionar a atenção do jogador para onde realmente importa.
*   **Equilíbrio de Cores:** Siga a regra `60-30-10`:
    *   **60% Dominante:** Fundo escuro (neutro).
    *   **30% Secundária:** Superfícies cinza e texto branco.
    *   **10% Destaque:** Cores vibrantes neon (como ciano ou ouro) reservadas para botões ativos e indicadores chave do HUD.

---

## ✍️ TIPOGRAFIA E HIERARQUIA VISUAL

*   **Contraste Legível:** Nunca use cinza claro em cima de ciano, ou branco em cima de amarelo brilhante. Garanta legibilidade instantânea sob qualquer condição de luz.
*   **Monospace vs. Sans-serif:** 
    *   Use fontes sem serifa (`Outfit`, `Inter`) para menus e painéis de narrativa.
    *   Use fontes monoespaçadas (`Courier New`, `monospace`) para chaves públicas, logs, timers e valores de atributos do RPG, dando um visual técnico/hackish adequado ao DeSo.

---

## 🎬 MOVIMENTO E ANIMAÇÃO CONSCIENTES

*   **Informação vs. Decoração:** Animações devem ajudar a guiar o jogador (ex: mostrar que um item foi adicionado à bolsa com um breve flash), e não ser ornamentos barulhentos que cansam os olhos.
*   **Curvas Naturais:** Sempre use curvas de velocidade baseadas em física real (ex: `ease-out` ou `cubic-bezier(0.16, 1, 0.3, 1)` para painéis deslizantes), evitando bounces robóticos.
