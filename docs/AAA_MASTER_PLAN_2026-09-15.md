# Danger Ghost — Plano Mestre AAA (Auditoria Forense Completa)

**Data:** 15/09/2026
**Origem:** MP (orquestrador) acionou os 32 especialistas do time (`danger ghost/.claude/agents/*.md`, exceto `3d-modeler`, `texture-artist` e `voice-actor` — sem superfície ativa pra auditar hoje) para uma análise forense read-only de todo o jogo — código, arte, áudio, economia, segurança, UX e negócio. Nenhum arquivo de jogo foi alterado nesta auditoria. Este documento é só o plano.
**Método:** cada especialista carregou sua própria persona e investigou seu domínio de forma independente (grep/leitura de código real, testes ao vivo via browser quando aplicável). Os 32 relatórios brutos foram compilados e entregues a `game-director` (síntese/reconciliação) e `producer` (roadmap realista faseado) para produzir este plano — MP não fez a análise, só orquestrou e montou o documento final.

---

## Nota do Diretor Criativo — Reconciliação e Prioridades

### 1. Fatos consolidados (o que era "vários achados" e é, na real, um fato só)

- **Badges: são 320, não 333.** `game-economy-designer` e `live-ops` chegaram ao mesmo número por caminhos diferentes (o segundo explica a causa raiz: 13 badges nunca foram semeados por falta de gancho no jogo). Trato como um fato único e fechado — não como dois achados a resolver separadamente. Ação: corrigir a contagem em toda documentação que cita "333" (README, `docs/*`, telas de UI se houver).
- **Conflito de nome do processo PM2 (`danger-ghost-server` vs `ghost`) entre `deploy.sh` e a skill `crossplatform-deploy`.** Achado por `skills-curator` e `live-ops` de forma independente, sem um citar o outro — dois especialistas de departamentos diferentes (documentação de skills vs. operação de live-ops) bateram no mesmo arquivo pelo mesmo motivo. Isso eleva a confiança: não é um typo isolado, é uma dessincronia real de processo de deploy que provavelmente já causou (ou vai causar) um restart que não reinicia o processo certo.
- **A pasta `danger ghost/skills/` propondo reativar DeSo.** Achada por `narrative-designer` e `skills-curator`, e o próprio compilador dos achados brutos já isolou isso numa "Nota lateral" com a mesma observação que eu faria. Concordo com a leitura: cross-confirmação forte, risco real (uma sessão futura, não necessariamente humana, pode tratar aquele material como válido). Amplio o achado: junto com o texto de tutorial "Transmitting data to DeSo Blockchain node" (`forensic-analyst`, LOW) e o `Founder Bio` do site (`marketing`, HIGH), são **três lugares fisicamente diferentes** onde resíduo de DeSo/Web3 sobrevive apesar da Regra de Ouro dizer "100% removida". Isso não é mais três achados soltos — é um padrão: a remoção de DeSo foi feita no código de produção, mas nunca varreu documentação, copy de marketing e material de skill. Vale uma varredura única e deliberada, não três tickets.
- **Runas Fire/Poison sem efeito real.** `game-designer` (`engine.js:2322-2327`, olhando a aplicação de dano da runa: 2 de 5 são só efeito visual) e `ai-programmer` (olhando o arquétipo `EnemyBoss` do Episódio 1: as 4 runas testadas contra o boss não fazem nada, nem status nem dano) chegaram lá por ângulos diferentes e se reforçam — não são o mesmo bug relatado duas vezes, são duas provas independentes de que **o sistema de runas essencialmente não funciona contra o conteúdo que mais importa (bosses)**. Isso é mais grave do que qualquer um dos dois achados sozinho sugere.
- **Documentação de persona desatualizada sobre `StartCutscene`/`ResetGame` no login.** `gameplay-engineer` e `qa-lead` relataram exatamente o mesmo drift (decisão deliberada de 22/08, `backend-architect.md`/`engine-programmer.md` nunca atualizados). Um fato, uma correção de doc — não dois itens de backlog.
- **Padrão "fix de exploit não generalizado".** Três achados separados são, na prática, o mesmo erro de método se repetindo: (a) o farm de `nextLevel`/`prevLevel` (`game-designer`, CRITICAL, `engine.js:1904,1940-1985,582,1809-1819`) só foi tapado na camada de badge pelo fix "Caçador de Segredos"; (b) a badge "Frequentador da Cave1" é irmã farmável desse mesmo exploit e o fix nunca chegou até ela (`game-economy-designer`); (c) `saveOverworldPosition` não tem fila por conta, o mesmo padrão de race que o projeto já corrigiu uma vez com `saveQueues` em outro sistema, nunca replicado aqui (`forensic-analyst`). Três bugs de superfície, uma causa de processo: os fixes deste projeto corrigem o sintoma no lugar onde foi visto, não a classe do bug. Vale um item de ação que não é "conserte o exploit X", é "quando corrigir qualquer um desses três, procure e feche os irmãos ao mesmo tempo".

### 2. Divergência de severidade que eu resolvo aqui

`backend-architect` classifica a ausência de rate-limit em `save_game_state`, `delete_character`, `increment_stat`, `badge_progress`, `send_friend_request` como MEDIUM ("o próprio código já se autodocumenta admitindo a lacuna"). `game-economy-designer` classifica a mesma lacuna, olhando por `increment_stat`/`badge_progress`, como CRITICAL, porque demonstrou exploração concreta: um único comando no console do navegador desbloqueia badges de kills/vidas sem jogar nada.

Decisão: **CRITICAL prevalece.** Um gap de segurança que já tem exploração demonstrada, não teórica, não é MEDIUM só porque o código "admite" a lacuna — a autodocumentação não é mitigação. `backend-architect` está certo tecnicamente sobre a superfície (rate-limit ausente em vários endpoints), mas a severidade tem que refletir o pior endpoint da lista, não a média. Isso também significa que o escopo do fix é maior do que qualquer um dos dois relatou sozinho: os cinco endpoints citados por `backend-architect` mais `kill_boss`/`player_attack` (`security-engineer`, MEDIUM-HIGH, aceitam broadcast sem autenticação) formam uma única frente de trabalho — rate-limit e autenticação de eventos socket como categoria, não endpoint por endpoint.

### 3. Classificação por prioridade

**Crítico / bloqueia lançamento (bug de jogo, corrigível em código, sem decisão de produto pendente):**
- Farm infinito de score/Fireball e a badge-irmã nunca corrigida (economia).
- Boss HP/redução de dano escalando pelo nível do jogador em vez do tier do boss (`engine.js:1006-1011, 2142-2145`) — progressão funciona ao contrário do pretendido.
- Dano de contato duplicado + zero i-frames — morte mais rápida que reação humana.
- `saveLocalStorage()` vazando campos do personagem ativo pro registro da conta — regressão de uma classe de bug já corrigida para `name`.
- Crash de `TypeError` no F (Ghost Mode) acessível sem login, da tela de título.
- Senha VIP "maximo" jogando personagem nível 1 contra boss de 5994 HP sem gate nenhum.
- Overworld só expõe Episódio 1 — 32 episódios sem porta de entrada no hub.
- Runas Fire/Poison e as 4 runas contra `EnemyBoss` sem efeito real.
- Rate-limit ausente em endpoints de estado (seção 2 acima).
- Chat MQTT sem autenticação nem moderação, com spoofing de "SYSTEM" possível — confirmado por três departamentos independentes (`network-programmer`, `security-engineer`, `community-manager`).
- Pasta `skills/` com material de reativação de DeSo.

Onze itens "críticos" é demais para tratar como uma lista plana — por isso a seção 4 abaixo é o corte real.

**Real, mas não urgente (vale corrigir, não trava nada agora):**
- Dívida de código morto/performance em `graphics-programmer` (nameplate duplicado, pool de projétil, `shadowBlur` sem condição — este último importa mais no Android, alvo mobile real, mas não é ship-blocking hoje).
- `patch.js` não-idempotente, `.gitignore` em UTF-16LE, drifts de documentação (estado `G_GAMEOVER`, `Game_Loop()` morto, contagem de POIs/colunas) — zero impacto de jogador, hygiene de repositório.
- Pasta `www/` decoy com commit novo em 07/09 — precisa só corrigir a data no CLAUDE.md, não é bug funcional.
- Débito de arte (JPEGs disfarçados de PNG a 7,18MB, `assets2/` morta, ausência de atlas/spritesheet) — real e caro em banda/perf, mas é iniciativa de pipeline, não fix pontual.
- Wiring de áudio (`ToggleMute` não cobre o vídeo de abertura, `PlayBGM()` trava em disparo único, mute não persiste) — bugs de código legítimos e baratos de corrigir, independente da decisão maior sobre SFX (ver §3 decisões).

**Decisão de produto, não fix de código:**
- **Founder Bio (NFT/DeSo) no site ao vivo** — o próprio `marketing` já identificou isso como decisão do usuário, e concordo: não é meu papel reescrever a história do fundador sozinho. Mas dado que contradiz a própria Regra de Ouro do projeto publicamente, recomendo tratar a decisão como urgente, não como "quando sobrar tempo".
- **Mistura PT/EN** — `localization` quantificou (78% EN / 22% PT, com uma "zona" de autenticação inteira em PT), mas decidir se o MVP fixa um idioma só ou investe num sistema de i18n de verdade é escopo e orçamento, não bug.
- **Confirmação em APK físico do nível 33** — tecnicamente isso não é uma decisão de produto, é uma tarefa de 30 segundos que só o usuário pode fazer (o `physics-programmer` já fechou a investigação estática). Separo isso das decisões reais para não inflar a lista.
- **O sistema de senha VIP como um todo** — "maximo" pula pro nível 33 sem gate, "P" está anunciado publicamente na tela inicial (`ui-ux-designer`, LOW). Antes de "consertar o gate", alguém precisa decidir se esse é um cheat code de demonstração que deve continuar existindo (só que seguro e logado) ou se deveria ser removido — não presumo a resposta.
- **Escopo de investimento em áudio** — zero SFX em 12 ações-chave é real e dramático, mas resolver isso por completo é produção de conteúdo (composer + sound-designer + audio-programmer), não uma correção de bug. Cabe ao usuário decidir quanto investir agora versus um pacote mínimo (3-4 sons mais críticos: hit, morte, level-up) como primeira fatia.

### 4. As cinco correções de maior alavancagem do mês

Critério: não é "o que tem selo CRITICAL", é "o que, corrigido, muda mais a experiência real por unidade de esforço de um dev solo". Nesta ordem:

1. **Rate-limit/autenticação unificado nos eventos de estado** (`increment_stat`, `badge_progress`, `save_game_state`, `delete_character`, `send_friend_request`, `kill_boss`, `player_attack`). Um único middleware fecha simultaneamente um exploit de economia já demonstrado, um vetor de griefing de boss e reduz de brinde o enumeration de e-mail via `get_diary_entries`/`get_badges`. Maior razão impacto/esforço da lista inteira.
2. **Causa raiz do exploit de farm** (`nextLevel`/`prevLevel` resetando bitmap e respawnando coletáveis) em vez de mais um patch na camada de badge — e, no mesmo esforço, aplicar a mesma lógica de fila que já existe (`saveQueues`) ao `saveOverworldPosition`, fechando o irmão que o `forensic-analyst` encontrou. Duas correções, uma mentalidade: parar de tapar sintoma.
3. **A progressão fim-a-fim está quebrada**: HP/redução de dano do boss escala pelo nível do jogador (fica mais fraco subindo de nível) + overworld só abre Episódio 1 + senha VIP joga um nível 1 direto pra um boss de 5994 HP sem aviso. Juntos, esses três significam que hoje não existe um caminho de progressão que funcione como desenhado — ou o jogador não consegue chegar ao conteúdo tardio, ou chega de um jeito que o mata instantaneamente. É o cluster mais fundamental do lote inteiro.
4. **Zero i-frames + checagem de dano de contato duplicada.** Fix provavelmente pequeno (remover a checagem redundante, adicionar um timer de invencibilidade), pagamento de qualidade percebida enorme — hoje contato contínuo mata mais rápido que a reação humana, o que é o tipo de bug que faz um playtester desistir nos primeiros cinco minutos.
5. **Vazamento de `level`/`xp`/`equippedSkills` pro registro da conta em todo autosave.** É a mesma classe de bug já corrigida uma vez para `name` e reaberta para três campos novos — sinal de que falta uma trava estrutural (algo como "nenhum campo por-personagem escreve na linha da conta"), não só o fix pontual. Corrigir isso e adicionar esse invariante como checagem prevendo recorrência é a única entrada desta lista que evita um sexto item aparecer no próximo audit.

Ficaram de fora do top 5, por pouco: o chat MQTT sem auth/moderação (cross-confirmado por três departamentos, mas mais contido como subsistema isolado do que os cinco acima, que atravessam progressão/economia/save) e a limpeza da pasta `skills/` de DeSo — que não entra na lista não por ser pouco importante, mas porque **custa quase zero** (apagar/quarentenar uma pasta) e deveria simplesmente acontecer hoje, em paralelo, sem competir por prioridade com o resto.

### 5. Conflitos entre recomendações de especialistas

Não encontrei um conflito literal onde implementar a recomendação de um especialista quebra a de outro. O mais próximo de um atrito real é de sequenciamento, não de contradição: `level-designer` recomenda variedade de boss nos níveis 23-32 (hoje dez níveis seguidos repetem boss) e a área de arte já documenta 246 arquivos de sprite sem nenhum sistema de atlas (99 requisições HTTP por carregamento, `technical-artist`/`2d-artist`). Adicionar variedade de boss literalmente como "mais sprites soltos", antes de resolver o atlas, piora exatamente o problema que a arte já sinalizou. Não é bloqueante, é ordem de execução: se o mês incluir os dois, o atlas vem antes dos assets novos, não depois.

Um segundo ponto que não é conflito mas é dependência que vale nomear: qualquer recomendação futura de composer/sound-designer para trocar de faixa em vitória/derrota esbarra no fato de que `PlayBGM()` é fire-once travado (`audio-programmer`, HIGH) — a trava técnica precisa ser resolvida antes que a direção de trilha proposta seja sequer possível de implementar, independente de quem pedir primeiro.

### 6. Veredito

"Impecável, AAA e melhor que o markdown" não é o padrão certo para medir este jogo agora, e dizer isso não é pessimismo — é ler os números certos: progressão que enfraquece o jogador ao subir de nível, i-frames zero em combate, um vazamento de save reaberto depois de já ter sido corrigido uma vez, e um sistema de runas que não funciona contra o próprio conteúdo de boss não são polimento faltando, são o motor central do jogo ainda não fechado; nenhuma quantidade de arte, áudio ou trilha bilíngue consertada muda isso. Ao mesmo tempo, este não é um projeto raso: a auditoria confirma máquina de estados sólida, paridade web/mobile real (68/68 funções), autenticação sem os três achados HIGH antigos regredindo, e uma cobertura de Ghostdex 101/101 em arte — a base é séria, o problema está concentrado, não espalhado. O que rende ganho real neste mês não é perseguir "AAA" como conceito, é fechar os cinco itens da seção 4 mais a limpeza gratuita da pasta `skills/`: isso transforma "um RPG com um motor de progressão e economia quebrados por baixo de uma superfície competente" em "um RPG justo e coerente com débito técnico visível e documentado" — um alvo realista para um dev solo em semanas, não em meses, e uma base muito mais honesta para decidir, depois, quanto investir em áudio, arte e localização.

---

## Nota do Producer — Roadmap Faseado e Realista

Severidade não é a mesma coisa que prioridade. Dois dos achados CRITICAL/HIGH mais graves deste relatório (o chat MQTT público e o "Founder Bio" com NFT) não têm uma correção de código esperando para ser feita; eles têm uma decisão do usuário esperando para ser tomada. Colocá-los na Fase 0 só porque a palavra é "CRITICAL" seria fingir que sei a resposta que só o dono do projeto pode dar. Por isso a Fase 0 aqui é mais enxuta do que o número de CRITICALs sugere, e a Fase 3 carrega peso que a etiqueta de severidade não deixa óbvio.

Segundo recado, específico deste projeto: **qualquer fix em `engine.js`, `js/web2/` ou CSS/HTML do jogo custa o dobro do que parece**, porque `danger_ghost_mobile/www/js/...` é uma cópia isolada que não sincroniza sozinha (`danger ghost/CLAUDE.md` §3) — cada correção "de um lugar só" é editar duas vezes, testar duas vezes, e pedir pro usuário rodar `npx cap sync android` + recompilar o APK. Marco com 🔁 todo item que carrega esse custo duplo. Itens de servidor puro (`server/`) não carregam esse custo.

### Fase 0 — Bloqueadores de segurança/integridade reais

Está ativamente sendo explorado ou corrompendo dado de jogador agora, ou é uma exploração trivial que qualquer jogador curioso vai achar sozinho.

| # | Achado | Localização | Agente(s) | Esforço |
|---|---|---|---|---|
| 0.1 | `saveLocalStorage()` vaza `level`/`xp`/`equippedSkills` do personagem ativo pro registro da CONTA a cada autosave | `engine.js` | `gameplay-engineer`, `backend-architect` 🔁 | Médio |
| 0.2 | Farm infinito: sair/voltar de nível reseta bitmap e respawna coletáveis (+300 score e Fireball de graça, ilimitado) | `engine.js:1904,1940-1985,582,1809-1819` | `gameplay-engineer`, `game-designer` 🔁 | Médio-Grande |
| 0.3 | `increment_stat`/`badge_progress` sem rate-limit nem validação server-side | server-side | `backend-architect` — uma camada reutilizável, não 5 patches avulsos | Médio |
| 0.4 | `kill_boss`/`player_attack` aceitam broadcast sem autenticação — griefing de boss pra todo mundo | server-side | `backend-architect`, `network-programmer` | Pequeno-Médio |
| 0.5 | Senha VIP "maximo" → nível 33 sem gate de level; "P" anunciada publicamente | `engine.js` + tela inicial | `level-designer`, `gameplay-engineer`, `ui-ux-designer` 🔁 | Pequeno |
| 0.6 | Tecla F (Ghost Mode) sem guard de estado — crash acessível sem login | `engine.js` | `gameplay-engineer` 🔁 | Pequeno |
| 0.7 | `saveOverworldPosition` sem fila/trava por conta — mesma classe de race já corrigida em `saveQueues`, nunca replicada aqui | server-side | `backend-architect` — reaplicar padrão existente | Pequeno |
| 0.8 | `ghost_inventory.js` mobile com cache-bust desatualizado há 3 semanas, apesar de 2 fixes reais de save no arquivo | `ghost_inventory.js` | `mobile-platform-engineer` — confirmar os fixes antes de só bumpar a versão | Pequeno, verificar antes |

*Nota: a badge "Frequentador da Cave1" (irmã farmável de 0.2) provavelmente é neutralizada de graça quando 0.2 for corrigido na raiz — não tratar como item separado.*

### Fase 1 — Vitórias rápidas e baratas

| Achado | Agente(s) | Esforço |
|---|---|---|
| Fireball: impacto cai no cyan genérico por `else if` faltando | `graphics-programmer` 🔁 | Pequeno |
| `drawOtherPlayers()` desenha nameplate duplicado por frame | `graphics-programmer` 🔁 | Pequeno |
| `shadowBlur` sem condição no sprite do jogador todo frame (pior no Android) | `graphics-programmer` 🔁 | Pequeno-Médio |
| Overlay estático "sidewalk" redesenhado todo frame | `graphics-programmer` 🔁 | Pequeno |
| Boss Episódio 1 carrega 2 imagens redundantes por spawn | `graphics-programmer` 🔁 | Pequeno |
| Ghostdex não normaliza characterId — mostra "Level 1/0 XP" errado | `gameplay-engineer` 🔁 | Pequeno |
| Wood domina Ice estritamente (mesmo custo, mais dano) | `game-designer`, `gameplay-engineer` 🔁 | Pequeno |
| `worldLevel` fora do hash de integridade; bound server-side frouxo | `backend-architect`, `gameplay-engineer` 🔁 | Pequeno-Médio |
| Sem handler de `reconnect_failed` — trava em "RECONNECTING..." pra sempre | `network-programmer` 🔁 | Pequeno-Médio |
| 11 ícones JPEG-como-PNG a 1024x1024 (7,18MB no boot) | `technical-artist`/`2d-artist` | Pequeno-Médio, alto retorno |
| Pasta `assets2/` (protótipo "Dangerous Dave") ainda carregada | `technical-artist` | Pequeno |
| Labels do navbar cortam no desktop | `ui-ux-designer` 🔁 | Pequeno |
| Sem feedback `:active` nos botões de toque mobile | `mobile-platform-engineer`/`ui-ux-designer` 🔁 | Pequeno |
| Botão START minúsculo/rotacionado no mobile | `ui-ux-designer` 🔁 | Pequeno |
| Ghost #101 sem avatar (404 real) | `2d-artist` | Pequeno-Médio |
| 2 diálogos de confirmação quase idênticos em idiomas diferentes (`ui_manager.js`) | `localization`/`gameplay-engineer` 🔁 | Pequeno |
| `deploy.sh` vs. skill `crossplatform-deploy`: nome do processo PM2 diverge | `skills-curator` + `tools-programmer` | Pequeno |
| `server/.gitignore` em UTF-16LE, não funciona | `tools-programmer` | Trivial |
| `ToggleMute()` não cobre o áudio do vídeo de abertura | `audio-programmer` 🔁 | Pequeno |
| Mute não persiste entre recarregamentos | `audio-programmer` 🔁 | Pequeno |
| Texto de tutorial ainda menciona "DeSo Blockchain node" | `narrative-designer`/`gameplay-engineer` 🔁 | Trivial |
| Pasta `danger ghost/skills/` propondo reativar DeSo | `skills-curator` — confirmar com o usuário antes de apagar | Pequeno |
| Lote de drift de documentação (POIs, estados, Game_Loop morto, contagem de badges, regra de login) | `skills-curator` — um passe único | Pequeno (lote) |

### Fase 2 — Trabalho real de polish/conteúdo

- **Cobertura de áudio (SFX)** — zero de 12 ações-chave tem som dedicado. Maior lacuna isolada do relatório. `sound-designer`, `composer`, `audio-programmer`. Grande — priorizar cast/hit/morte/level-up antes de UI/save. 🔁
- **VFX de boss death + level-up + porta secreta** — hoje mudos. `vfx-artist`, `graphics-programmer`. Médio-Grande. 🔁
- **Consolidação da linguagem de cor** — `#00FFFF` usado pra perigo, recompensa E hit do jogador ao mesmo tempo. `concept-artist`/`vfx-artist`, `graphics-programmer`. Médio-Grande (aproveitar a mesma varredura do item de VFX). 🔁
- **Runas Fire/Poison funcionais de verdade** (jogador e `EnemyBoss`). `ai-programmer`, `game-designer`. Médio-Grande. 🔁
- **Telegraph antes de tiro de boss.** `ai-programmer`, `vfx-artist`. Médio.
- **Fases/enrage de boss** (hoje só escala HP). `ai-programmer`, `game-designer`. Grande — começar com 1-2 arquétipos, não generalizar de uma vez.
- **Interpolação de posição de outros jogadores** na view principal (já existe solução funcionando no overworld — é portar, não inventar). `network-programmer`. Médio.
- **Layout da tela de landing mobile** (D-pad antes do login, espaço morto na barra social). `mobile-platform-engineer`, `ui-ux-designer`. Médio.
- **Terceiro tipo de pasta-decoy dentro do `www/` real do mobile** — limpar com cuidado (arquivo errado quebra o APK de verdade). `mobile-platform-engineer`. Médio.
- **Inconsistência visual** (fundos pintados vs. UI flat-neon, emojis de sistema nos cabeçalhos). `concept-artist`, `ui-ux-designer`. Médio.
- **Confirmação física do pulo no APK real** — evidência estática diz que já foi corrigido, falta só testar no telefone. `physics-programmer`/`qa-tester` conduzem; depende do usuário ter o APK em mãos.
- **80% do lore do Ghostdex compartilhado** (combinador 9x9). Recomendo aumentar a matriz (ex. pra 20x20) e reescrever à mão só as espécies mais visíveis, não as 101. `narrative-designer`. Médio na versão reduzida.
- **10 níveis (23-32) sem variedade de boss** — encaixar na cadência trimestral que `live-ops` já recomenda, não como tarefa isolada. `level-designer`, `ai-programmer`.

### Fase 3 — Decisões do usuário antes de qualquer código

1. **"Founder Bio" com NFT/DeSo no site** — contradiz a Regra de Ouro publicamente. O usuário decide o texto de substituição, não é uma correção técnica que se propõe sozinha.
2. **Estratégia de idioma PT/EN** — três caminhos honestos (tudo EN, tudo PT, ou i18n de verdade), custos de implementação completamente diferentes. `localization` levanta, ninguém implementa até a escolha existir.
3. **Play Store: perseguir ou não** — hoje 0% preparado, compromisso de semanas se sim. **Independente disso**: uma política de privacidade básica é necessária já, o jogo já coleta login/senha reais hoje.
4. **Chat MQTT público — o que fazer** — autenticar o broker atual, migrar pro Socket.io que já existe, ou mitigação mínima (prefixo "não oficial"). Cada opção tem custo bem diferente; sem essa decisão, as diretrizes de comunidade/moderação também ficam em espera.

### Backlog / não prioritário agora

- **Migração pra sprite atlas** (246 arquivos, 99 requisições) — arquitetura correta, mas sem ganho jogável imediato pra um dev solo. Só revisitar se boot lag virar reclamação real.
- **Preparação Play Store** — depende da Fase 3.3; trabalho de semanas.
- **Unificação de nomenclatura de sprite direcional** — cosmético, resolve de graça se o atlas acontecer.
- **Nome "Poltergeist" acidental** — trivial, não compete por atenção.
- **Badges sociais/multiplayer ausentes** — não é bug, encaixa na cadência mensal do `live-ops`.
- **CORS aberto, senha limitada a 12 caracteres, `auth_google_token` sem rate-limit** — sem exploração real hoje; revisitar só se `LoginGoogle` for reativado.
- **`3d-modeler`, `texture-artist`, `voice-actor`** — departamentos deliberadamente dormentes, nada a fazer.

### Resumo do producer

Fase 0: 8 itens, maioria pequena-média, nenhum exige decisão de produto — dá pra começar amanhã. Fase 1: ~23 itens baratos, ~1-2 semanas de trabalho solo incluindo o custo duplo mobile. Fase 2: onde a "sensação AAA" se constrói de verdade, mas é trabalho de meses — áudio e VFX de boss death sozinhos já mudam mais a percepção do jogo que qualquer outro item individual. Fase 3: 4 decisões que só o usuário resolve, e enquanto isso ficam represados os achados de moderação de chat, diretrizes de comunidade e posicionamento do jogo.

---

## Apêndice — Achados brutos por departamento

*(Compilados por MP a partir dos 32 relatórios completos antes da síntese acima — para o detalhe completo de qualquer item, peça pra MP reabrir o relatório do especialista específico.)*

### Design
- **game-designer**: escalonamento de boss pelo nível do jogador (crítico), farm infinito via reload de nível (crítico), runas Fire/Poison cosméticas, Wood domina Ice, worldLevel fora do hash de integridade, build VIT/AGI sem geração de mana.
- **level-designer**: senha VIP sem gate (crítico), overworld só abre Episódio 1 (crítico), colocação de secreto sem fallback, nudge de boss não revalida terreno, 10 níveis sem variedade de boss, overworld com só 3 chunks/POIs.
- **narrative-designer**: 80% do lore duplicado (combinador 9x9), pasta skills/ propondo DeSo, linha de lore de skatista nunca usada no skatepark real, nome "Poltergeist" acidental.
- **ui-ux-designer**: 2/13 achados do audit mobile anterior corrigidos, labels de navbar cortam no desktop, falta scrim atrás do texto inicial, senha VIP anunciada publicamente.

### Programação
- **gameplay-engineer**: vazamento de campos de personagem pra conta (crítico), crash de F sem login (crítico), Ghostdex sem normalizar characterId, login auto-inicia gameplay (doc desatualizada).
- **engine-programmer**: máquina de estados sólida, sem soft-locks, doc lista 6 estados (são 7), Game_Loop() morto.
- **graphics-programmer**: nameplate duplicado, pool de projétil sem checar vivacidade, shadowBlur sem condição, overlay estático redesenhado à toa.
- **ai-programmer**: dano de contato duplicado sem i-frames (crítico), runas sem efeito em EnemyBoss, zero telegraph, comportamento de boss idêntico em qualquer nível.
- **network-programmer**: sem handler de reconnect_failed, chat MQTT sem autenticação, posição de outros jogadores sem interpolação.
- **backend-architect**: COALESCE/normalizeCharacterId/auth por sessão confirmados limpos; rate-limit ausente em vários endpoints; email enumeration possível.
- **mobile-platform-engineer**: paridade de código forte (68/68 funções); cache-bust desatualizado em ghost_inventory.js; pasta www/ decoy com commit novo; terceiro tipo de pasta-decoy.
- **tools-programmer**: patch.js não-idempotente e sem marca de histórico; seed de badges idempotente; .gitignore em UTF-16LE.
- **physics-programmer**: pulo provavelmente já corrigido (27/08), falta confirmação em APK físico; falta feedback :active no touch.
- **security-engineer**: 3 achados HIGH antigos confirmados corrigidos; chat MQTT permite spoofing de SYSTEM; kill_boss/player_attack sem autenticação; CORS aberto (mitigado).

### Arte e Áudio
- **2d-artist/concept-artist/animator/vfx-artist/technical-artist**: asset "Nouns ilha.webp" de terceiros; 11 ícones JPEG-como-PNG (7,18MB); pasta assets2/ morta; boss death sem VFX; level-up/porta secreta mudos; #00FFFF usado pra sinais opostos; Fireball com impacto errado; 99 requisições sem atlas; 404 real no Ghost #101.
- **sound-designer/composer/audio-programmer**: zero SFX em 12 ações-chave; mute não cobre vídeo de abertura; trilha nunca reage a vitória/derrota; PlayBGM() trava em disparo único; retry de autoplay pode ficar permanentemente desativado.

### Produção, QA e Forense
- **qa-tester**: console limpo; espaço morto na barra social mobile; D-pad visível antes do login; 1.mp4 requisitado duas vezes; SPACE não pôde ser testado por limitação da ferramenta (não do jogo).
- **qa-lead**: quase todos os invariantes de save/sync confirmados seguros por leitura estática; 5 itens precisam de teste E2E ao vivo contra Supabase real.
- **forensic-analyst**: race em saveOverworldPosition (achado novo real); nenhum outro sibling dos bugs históricos encontrado.
- **skills-curator**: pasta skills/ com material DeSo (crítico); deploy.sh vs. skill discordam do nome do processo; 4 novas skills recomendadas.

### Negócios
- **marketing**: Founder Bio com NFT/DeSo contradiz a Regra de Ouro (achado mais sério do departamento); sem meta tags/pitch de gênero na landing page.
- **game-economy-designer**: increment_stat/badge_progress sem rate-limit (crítico, exploit demonstrado); badge Cave1 farmável; confirma 320 badges; zero monetização real.
- **publisher-bizdev**: APK é build debug; sem política de privacidade; 0% preparado pra Play Store.
- **localization**: 78% EN / 22% PT, não aleatório — zona de auth em PT colada no resto em EN; mobile tem costura pior.
- **community-manager**: chat sem nenhuma ferramenta de moderação (crítico); sem diretrizes de comunidade visíveis; Telegram é o único canal com moderação real.
- **live-ops**: confirma conflito de nome do PM2; corrige contagem de badges pra 320; cadência realista recomendada (mensal pra badges, trimestral pra POIs).
