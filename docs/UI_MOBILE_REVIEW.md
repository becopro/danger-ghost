# Revisão de UI/UX — Mobile (Capacitor Android)

**Data:** 18 de Agosto de 2026. **Escopo:** `danger_ghost_mobile/www/` — `index.html`, `css/style.css`, `js/game/engine.js`, comparado pontualmente com a versão web equivalente em `danger ghost/`. Achados extraídos diretamente do código (arquivo:linha), sem itens hipotéticos.

## Crítico

1. **Botão "F" tem visual de botão de pulo mas ativa Ghost Mode — regressão de UX.**
   `index.html:152` usa a classe `jump-btn` (maior, cor roxa, posição central destacada em `style.css:2186-2192`), mas `setupTouchButton('touchSlotFBtn', 70)` (`index.html:376`) mapeia para a tecla **F**, que em `engine.js:3560-3564`/`3642-3643` alterna **Ghost Mode** (atravessar paredes), não pulo. O pulo real é o D-pad ▲ (`touchUpBtn`, keyCode 38). Confirmado como regressão: a versão web tem um `#touchJumpBtn` real (keyCode 38) que **não existe mais** no HTML mobile.
2. **Bindings mortos que confirmam a migração incompleta:** `setupTouchButton('touchJumpBtn', 38)` (`index.html:361`) e `setupTouchButton('touchSlotTBtn', 84)` (`index.html:377`) apontam para elementos que não existem no HTML mobile.
3. **Nenhum feedback visual de toque nos botões do app.** As regras `body.is-mobile-app .gb-btn-dpad/.gb-btn-round/.gb-btn-pill` (`style.css:2103-2192`) usam `!important` no `background` e nunca definem `:active` — os únicos `:active` do arquivo (linhas 442, 1907, 1924, 1936) não alcançam essas classes por especificidade. Pressionar qualquer botão do D-pad, START ou ações não muda de cor nem confirma visualmente o toque.
4. **Botão START abaixo da área mínima de toque e rotacionado.** `index.html:136`, `.gb-btn-pill` (`style.css:2141-2153`): 70×25px, `rotate(-15deg)`. Controla pausa/retomar/reset (`engine.js:3609-3619`) — alvo pequeno para uma ação crítica.

## Importante

5. **Abrir painéis (Stats/Bag/Equip/Spells/Chat) não pausa o cronômetro do nível corretamente.** O caminho "oficial" de pausa via Space compensa `g_levelStartTime` pelo tempo pausado (`engine.js:3610-3614`); o caminho do menu mobile (`ShowMobileMainMenuFromGame()`/`ResumeMobileGame()`, `index.html:1322-1336`) seta `g_gameState` direto e **nunca** faz essa compensação — tempo de jogo/nível fica incorreto sempre que o menu é aberto durante a partida.
6. **Botão de menu in-game e D-pad competem pelo mesmo quadrante da tela** sem coordenação de layout — `#mobileInGameMenuBtn` (`index.html:1261`, fixo em `bottom:20px; left:20px`) e o D-pad (`style.css:2078-2094`) são posicionados independentemente; risco real de sobreposição em telas baixas/compactas.
7. **`#mobileAppNavbar` é DOM morto** (`index.html:108-117`, `display:none !important` fixo, nunca revertido) — 8 botões duplicados carregados à toa. Nota: `TriggerRPGSaveToDeSo()`, chamado por esse menu morto, **funciona normalmente** (save local via `localStorage`, `game_core.js:133-174`) — o nome é herança da era DeSo, não é código quebrado.
8. **`nipplejs` (CDN externo) é carregado e nunca usado.** `index.html:17` e `#joystickZone` (`style.css:1871-1876`) sem nenhum uso real em `js/` — custo de rede à toa em toda carga do app.
9. **D-pad não suporta arrastar o dedo entre direções** — cada botão tem par independente `touchstart`/`touchend` (`index.html:320-359`) sem `touchmove` compartilhado; trocar de direção rápido exige levantar e tocar de novo.
10. **Sem feedback tátil (haptics)** — nenhum uso de `navigator.vibrate`/`@capacitor/haptics` em `www/`.

## Desejável

11. **Contraste baixo nas setas do D-pad:** `#777` sobre `#333` (`style.css:2113-2123`), ~2.7:1 — abaixo do recomendado.
12. **Bloco de CSS "regras para PC/Web" vazou da media query** (`style.css:2199-2262`) — só a primeira regra está condicionada; o resto se aplica globalmente. Não quebra nada hoje porque regras mais específicas de `.is-mobile-app` sobrescrevem, mas é uma armadilha para futuras edições nesse trecho.
13. Elementos ocultos porém ainda ativos no DOM (`#gameScreenModeBtn`, `#muteBtn`) — mesmo padrão do item 7, impacto menor.

*Nota:* o app trava orientação `portrait` no `AndroidManifest.xml`, então a ausência de regras específicas para paisagem não é um problema.

## Prioridade sugerida de correção
Itens 1–2 (rebind do botão de pulo) e 3 (feedback de toque) são os de maior impacto direto na jogabilidade e menor esforço de correção — bons candidatos para o primeiro ciclo de refino mobile.
