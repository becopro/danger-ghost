# Plano Mestre — Sistema de Save (Danger Ghost)

**Data:** 23/08/2026
**Origem:** auditoria forense de largo espectro pedida pelo usuário, executada em paralelo por quatro agentes especialistas (site, mobile, servidor/banco, curadoria de skills) contra o Supabase de produção, com contas descartáveis reais — não uma revisão de código isolada.

Este documento é a fonte de verdade sobre o que o sistema de save **comprovadamente** garante hoje, quais invariantes sustentam essas garantias, e o que é risco conhecido e não-corrigido (por decisão consciente, não por omissão).

## 1. Garantias atuais (verificadas, não presumidas)

Cada item abaixo foi reproduzido falhando *antes* da correção e reproduzido funcionando *depois*, contra o Postgres real, não só validado por leitura de código.

1. **Um personagem apagado nunca ressuscita.** `delete_character` e `save_game_state` do mesmo jogador são processados na ordem em que foram emitidos, não na ordem em que suas queries terminam — mesmo sob rajada (testado com 8 saves + 1 delete concorrentes).
2. **Progresso da Ghostdex e favoritos nunca revertem por corrida entre saves.** Mesma fila por socket, testada com 6 saves em rajada.
3. **A sessão autenticada sobrevive a trocar de personagem.** `join_game` (reemitido pelo Ghostdex a cada troca) preserva o e-mail autenticado em vez de recriar o registro do jogador do zero.
4. **Nenhum ponto de entrada de gameplay começa sem login real confirmado nesta visita** — nem no site (F5 num navegador já logado antes não pula mais a exigência) nem no mobile (tela de auth exclusiva sempre aparece primeiro; sete pontos de entrada auditados e corrigidos para depender do mesmo sinal forte).
5. **Todo fantasma que o jogador possui — capturado, forjado, ou restaurado — tem uma entrada correspondente na Ghostdex, no site e no mobile.** (O mobile não tinha isso para fantasmas forjados; corrigido nesta rodada.)
6. **O nome de um personagem nunca vaza para outro ao trocar de personagem ativo.**
7. **O schema real do Postgres bate exatamente com o que o código lê/escreve** (13 colunas de `players`, 25 de `characters`, conferido direto no banco de produção).
8. **Uma query que falha não corrompe a fila nem trava saves seguintes**, e agora o cliente registra o erro no console em vez de silêncio total (achado nesta rodada, corrigido).
9. **Não existe mais nenhum caminho de "login" que não seja validado pelo servidor** — o mock de login Google/Firebase (que gerava sessão falsa sem servidor nenhum verificar) foi removido dos dois lados; no mobile ele ainda estava conectado a três botões reais, não só código morto como no site.

## 2. Invariantes que sustentam essas garantias

Se uma mudança futura violar qualquer um destes, as garantias acima deixam de valer:

- **Toda escrita que afeta a linha de um jogador (`characters`, `players.ghostdex_progress`, `players.favorites`) deve passar pela fila `saveQueues[socket.id]`** em `server/index.js` — um novo evento socket que grave dados de jogador precisa ser encadeado nela, não disparar uma query direta.
- **Identidade de escrita vem sempre de `players[socket.id].email`** (populado só por login verificado), nunca de um campo `email`/`characterId` recebido cru no payload.
- **"Autenticado nesta visita" é estado em memória** (`window.g_hasAuthenticatedThisPageLoad` no site; a tela de auth exclusiva incondicional no mobile) — nunca a mera presença de `dg_cloud_email` no `localStorage`, que sobrevive a reloads e não significa "logou agora".
- **Todo caminho que adiciona um personagem à conta do jogador (captura, forja, restauração) deve chamar `UpdateGhostdex(id, 2)`**, não gravar `ghostdex_progress` diretamente — é essa função que garante o sync com o banco.
- **`GhostRPG.loadBlockchainState()` recebe o nome do personagem como parâmetro**, nunca via uma chamada separada de `setName()` depois — a função salva no banco internamente, e uma chamada separada posterior chega tarde demais.
- **Site e mobile são cópias separadas do mesmo comportamento pretendido, não do mesmo arquivo.** Uma correção em `danger ghost/js/...` não existe no jogo mobile até ser espelhada manualmente em `danger_ghost_mobile/www/js/...` — confirmado repetidas vezes hoje como a origem de divergências reais (não hipotéticas).

## 3. Riscos conhecidos, não corrigidos nesta rodada (decisão consciente, com o porquê)

| Risco | Por que não foi corrigido agora |
|---|---|
| **Duas conexões simultâneas da mesma conta** (dois navegadores, ou site + mobile jogando ao mesmo tempo) não têm nenhum lock compartilhado entre si — cada uma tem sua própria fila. A última escrita a chegar no banco vence, sem ordem definida entre dispositivos diferentes. | Decisão de arquitetura (lock por conta, ou uma estratégia de merge), não um bug pontual — corrigir direito exige redesenho, não um patch cirúrgico. |
| **Pool de conexões Postgres sem timeout** (`max: 10`, sem `connectionTimeoutMillis`). Sob rajada acima do limite, o pedido espera indefinidamente em vez de falhar com erro claro — testado com 15 jogadores simultâneos: funcionou, mas a latência subiu de poucos ms pra ~5s. | Ajuste de operação/infraestrutura, não uma correção de bug — recomendado para quando o jogo tiver mais jogadores simultâneos reais. |
| **Falha de save agora aparece no console do navegador, não numa notificação visível ao jogador.** | Uma notificação visual criteriosa (sem interromper o jogo com um alerta a cada falha isolada, já que a maioria dos saves é automática em segundo plano) é uma decisão de design de UI que não estava no pedido original — registrado aqui para decisão futura. |
| **`www/index.html` (mobile) carrega `ghost_inventory.js`, `ghostdex_data.js` e `ghostdex_ui.js` duas vezes.** Parece inofensivo (nada entre as duas cargas depende do estado da primeira), mas não foi confirmado com certeza total — sinalizado como tarefa separada em vez de arriscar quebrar o jogo por um palpite. | Investigação incompleta reportada honestamente em vez de uma correção não verificada. |

## 4. O que mudou nesta rodada (resumo técnico)

- `server/index.js`: `delete_character` agora entra na mesma fila `saveQueues` que `save_game_state` — elimina a corrida onde apagar um personagem enquanto um save antigo ainda estava em voo o ressuscitava.
- `js/game/network.js` (site) e `www/js/game/network.js` (mobile): novo listener de `save_error`, registrando falhas de save no console em vez de silêncio.
- Mobile (`www/js/web2/game_core.js`, `auth.js`, `js/game/engine.js`, `ghostdex_ui.js`, `js/ui/ui_manager.js`, `index.html`):
  - Removido o mock de login Google/Firebase (ativamente conectado a 3 botões reais, diferente do site onde já era código morto).
  - Adotado `window.g_hasAuthenticatedThisPageLoad` (mesmo padrão do site) em 7 pontos de entrada de gameplay, substituindo a checagem fraca de `dg_cloud_email` persistido.
  - `DisplayCharacterSelectionScreen` agora marca cada personagem possuído como capturado na Ghostdex (mesmo fix que o site já tinha) — fecha o gap onde fantasmas forjados no mobile nunca apareciam na Ghostdex.
- Novo agente especialista permanente `forensic-analyst` (`danger ghost/.claude/agents/forensic-analyst.md`, 40 anos de experiência, investigação de causa raiz) e nova skill `forensic-root-cause-analysis`, ambos disponíveis para auditorias futuras deste tipo.
