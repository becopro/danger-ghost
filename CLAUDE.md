# CLAUDE.md — Memória e Regras do Projeto Danger Ghost

Este é o documento de referência principal para o Claude Code (e qualquer agente compatível) trabalhando neste repositório. Ele consolida e substitui, em termos de precisão, o `Gemini.md` deste mesmo diretório — os dois devem contar a mesma história; se divergirem, este arquivo é a fonte da verdade porque é o mais recentemente auditado contra o código real (23/08/2026).

Antes de propor ou implementar qualquer mudança, leia também `docs/PRD.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/BRIEFING.md` e `docs/HANDOVER.md` — não redescubra a arquitetura do zero a cada sessão. Para qualquer mudança em save/sync/auth especificamente, leia também `docs/SAVE_SYSTEM_MASTER_PLAN.md` (23/08/2026) — lista as garantias já verificadas, os invariantes que as sustentam, e os riscos conhecidos e conscientemente não corrigidos; uma mudança que viole um desses invariantes reintroduz um bug já corrigido hoje.

## 1. Regra de Ouro: Nada de Blockchain DeSo (mas cuidado com o nome)
- O projeto é **100% Web2**. A blockchain DeSo foi usada no passado e **foi removida**. Não tente reativá-la.
- **Atenção:** nem tudo com "deso" no nome é lixo:
  - `TriggerRPGSaveToDeSo()` (`js/web2/game_core.js`) é uma função **ativa** de save local — só o nome é legado.
  - `schema.sql` menciona "Deso Hosting" — é o **nome do provedor de hospedagem MySQL**, não a blockchain.
  - Lixo de fato: `PostToDeSo()` (stub mock), `_archive/deso_api.js.bak`, `scratch/old_deso.js`, scripts de migração one-shot já executados (`patch_deso.js`, `split_deso.js`, `replace_deso.js`).
- Veja `docs/ARCHITECTURE.md` §3 e §5 para o mapa completo antes de decidir o que apagar.

## 2. O Futuro: Blockchain Proprietária
No roadmap, uma blockchain de propósito específico (não DeSo) para salvar progresso/inventário de forma descentralizada. Ainda não iniciada. Até lá, o backend usa Postgres (Supabase) como banco único — ver seção 4.

## 3. Arquitetura Dupla (Cross-Play) — isolamento Web/Mobile
1. **PC / Web (`danger ghost/`)** — jogo principal no navegador. Backend (`server/`) vive aqui.
2. **Mobile (`danger_ghost_mobile/`)** — app Android via Capacitor v8, pasta `www/js/` própria e isolada.
3. **Regra inegociável:** ao alterar UI/engine em `danger ghost/js/game/` ou `js/web2/`, verifique se `danger_ghost_mobile/www/js/...` precisa da mesma mudança. As pastas **não** sincronizam sozinhas.
4. **Compilação mobile:** depois de editar `danger_ghost_mobile/www/`, rode `npx cap sync android` e peça ao usuário para recompilar o `.apk` (Android Studio ou `gradlew assembleDebug`). Nunca assuma que o APK já reflete a mudança.
5. **Armadilha: cada repositório tem uma segunda cópia de si mesmo, abandonada.** Descoberta em 20/08/2026 ao investigar por que um bug corrigido em `www/js/game/rpg_system.js` parecia continuar existindo em outro arquivo de mesmo nome:
   - **`danger_ghost_mobile/` tem arquivos soltos na raiz** (`rpg_system.js`, `index.html`, `js/`, etc., **fora** de `www/`) que são um protótipo *single-player* muito mais antigo ("DeSoGhost: The 33-Level Saga", ver `README.md` da raiz) — nada a ver com o RPG multiplayer atual. Aponta pra uma URL `trycloudflare.com` (túnel temporário, expira em horas) — não está e não pode estar no ar. `capacitor.config.json` (`webDir: "www"`) confirma que só `www/` vira APK de verdade. **Edite sempre dentro de `www/js/...`, nunca os arquivos da raiz.**
   - **`danger ghost/` também tem seu próprio `www/` + `android/`** (Capacitor, mesmo `appId: danger.ghost.mobile`) — sobra de quando o app mobile ainda não tinha virado o repositório `danger_ghost_mobile/` separado. Sem commit desde ~04/08/2026 (`android/` desde 15/07/2026), enquanto todo o trabalho mobile real deste projeto acontece em `danger_ghost_mobile/`. **O site real carrega os arquivos da raiz de `danger ghost/` (`js/web2/`, `js/game/`, `rpg_system.js`) — o `www/` daqui é morto, não confunda os dois ao editar.**
   - Nenhuma das duas cópias foi apagada ainda (não tinha sido pedido) — só documentado aqui pra não perder tempo de novo tentando descobrir "por que meu fix não pegou".

## 4. Autenticação — 2 caminhos de login, 1 banco de dados só (atualizado 23/08/2026)
Existem dois fluxos de entrada no jogo, detalhados em `docs/ARCHITECTURE.md` §3:
1. E-mail + senha local (`OpenLoginModal()`, `js/web2/auth.js`), **único login real do cliente hoje**. **Senha com hash bcrypt** desde 18/08/2026 (antes era texto puro — corrigido; contas antigas migram o hash automaticamente no próximo login).
2. Save local via `TriggerRPGSaveToDeSo()` → `localStorage`, sem rede — paralelo ao login, não afetado pela migração de banco.

**Google OAuth via Firebase foi removido em 23/08/2026** (auditoria de login pedida pelo usuário): a função `LoginGoogle()` em `game_core.js` nunca teve o Firebase configurado de verdade (config só com placeholders) e caía sempre num fallback de MOCK LOGIN — token falso, sem nenhum servidor validando — que só existia porque nenhum botão do site ao vivo chamava essa função (todos chamam `OpenLoginModal()`), tornando-a código morto perigoso em vez de um caminho de auth de fato. Removida por completo; `window.LoginGoogle` agora é um alias de segurança pra `OpenLoginModal()`. O handler server-side `auth_google_token`/`googleClient.verifyIdToken()` (`server/index.js`) **continua existindo** (infra válida, verificação real de token), mas hoje não tem nenhum chamador no cliente. Detalhes completos em `docs/ARCHITECTURE.md` §3.

## 5. Stack Tecnológico e Regras de Código
- **Frontend/Engine:** HTML5 Canvas, **Vanilla JS**. Sem frameworks reativos (React/Vue) no gameplay.
- **Backend:** Node.js, Express v5, `socket.io` v4.8.3, `google-auth-library`.
- **Banco de dados: Postgres via Supabase**, um só (migrado de SQLite em 19/08/2026 — a migração também aposentou um MySQL e um Postgres/Redis que existiam no repo mas nunca chegaram a ser usados por nenhum código ativo; não presuma que voltaram, confira `server/db.js` e `docs/ARCHITECTURE.md` §4 antes de assumir qualquer coisa sobre banco de dados neste projeto).
- **CSS:** Vanilla CSS, estética neon/hacker/vaporwave + glassmorphism.
- **Mobile:** Capacitor v8. Controles touch **já existem** (D-pad estilo GameBoy em `www/index.html`, `#mobileControlsContainer`) — trabalho pendente é refino, não criação do zero.

## 6. Boas Práticas de Otimização de Tokens, Modelos e Skills

Este projeto tem repositórios grandes (`engine.js` sozinho tem ~220KB, duplicado entre web e mobile). Ler arquivos inteiros sem necessidade estoura contexto rápido e encarece cada sessão. Regras:

### Leitura e busca
- **Nunca leia `engine.js`, `index.html` ou `style.css` inteiros "para entender o projeto".** Use `Grep`/busca por padrão para localizar a seção relevante (nome de função, id de elemento, evento) e leia só o trecho com `offset`/`limit`.
- Prefira uma tarefa de exploração ampla ("como funciona o sistema de X") a um agente `Explore` em vez de ler dezenas de arquivos manualmente no fio principal — ele devolve um resumo, não o conteúdo bruto inteiro.
- Antes de reescrever um arquivo, confirme se um `Edit` pontual resolve — evita reenviar o arquivo inteiro no diff.
- Ao investigar um bug ou revisar algo grande e paralelizável (ex.: auditoria de UI mobile, varredura de código morto), delegue a um subagente em background com escopo bem definido, e só incorpore o relatório final — não duplique a mesma exploração no contexto principal.

### Escolha de modelo (Claude Code — Sonnet 5 / Opus 5 / Haiku 4.5)
- **Sonnet 5 (padrão):** use para a maior parte do trabalho neste repo — edição de `engine.js`, ajustes de CSS/HTML, lógica de servidor, revisão de docs. É o modelo padrão desta sessão; não troque sem motivo.
- **Opus 5 / Fast mode:** reserve para problemas realmente difíceis — bugs de física/colisão sutis, decisões de arquitetura com trade-offs não óbvios (ex.: desenhar a futura blockchain proprietária), ou quando Sonnet já tentou e não resolveu.
- **Haiku 4.5:** tarefas mecânicas e bem definidas (renomear, aplicar um padrão repetitivo já decidido, gerar boilerplate) — não usar para decisões de arquitetura ou segurança.
- Não troque de modelo no meio de uma tarefa sem necessidade — cada troca reprocessa contexto.

### Skills e efforts
- Ative skills apenas quando a tarefa bater com a descrição delas — não ative "por garantia". Cada skill carregada consome tokens de contexto mesmo se não for usada.
- Para revisão de código (`code-review`) ou segurança (`security-review`), use o nível de esforço proporcional ao risco real: mudanças pequenas e isoladas → `low`/`medium`; mudanças em autenticação, pagamento, ou banco de dados → `high` no mínimo, considere `ultra` antes de subir para produção.
- Para a auditoria de segurança deste projeto especificamente (texto-plano de senha, CORS aberto, validação de payloads socket.io), use no mínimo esforço `high` — é uma superfície de autenticação real com achado confirmado, não um chute.
- Não peça um subagente para "explorar tudo" quando uma busca `Grep` de 30 segundos responde a pergunta. Escale a ferramenta ao tamanho real do problema.

## 7. Fluxo de Trabalho
- Toda implementação técnica relevante deve ser precedida por alinhamento com o usuário (Plan Mode) — especialmente mudanças de autenticação, banco de dados, ou qualquer coisa que toque as duas plataformas (web + mobile) ao mesmo tempo.
- Documentação (`docs/*.md`, este `CLAUDE.md`, `Gemini.md`) deve ser atualizada **no mesmo commit/sessão** que muda a arquitetura que ela descreve — docs desatualizados neste projeto já causaram confusão real (ex.: a suposição incorreta de "bcrypt" chegou a 4 documentos antes de ser corrigida em 18/08/2026).
- O foco é manter o jogo rápido, a conexão fluida, respeitar o isolamento web/mobile e preservar o cross-play.

## 8. Equipe de Agentes Especialistas

Criada em 30/08/2026 (10 agentes iniciais) e expandida em 15/09/2026, a pedido do usuário, a partir do time de departamentos descrito em `docs/orquestrador-ghost-games.md` (o "MP" — documento original de referência, cópia trazida de fora do projeto) — agora **39 arquivos** em `danger ghost/.claude/agents/*.md`, cada um com 40+ anos de experiência de persona e carregando o histórico real de bugs/decisões deste projeto (não conhecimento genérico). Invoque via `Agent` com `subagent_type` = o nome do arquivo. Para um pedido amplo/multi-departamento onde não está óbvio quem acionar, invoque `mp-orchestrator` primeiro — ele só faz a triagem (quem, em que ordem, por quê) e devolve o plano; ele não implementa nem substitui os especialistas.

**Alguns papéis do MD original existem hoje sem pipeline ativo neste projeto** (jogo é 2D Canvas vanilla JS, sem 3D/dublagem/engine comercial) — `3d-modeler` e `texture-artist` ficam restritos à presença separada no metaverso Hyperfy (`hyperfy.io/desoghostmansion`), e `voice-actor` fica dormante até o jogo realmente ter um sistema de VO. Isso é intencional (o usuário pediu o time completo como visão de longo prazo), não um erro — cada um desses três arquivos já deixa essa limitação explícita e redireciona pro agente certo quando o pedido é, na real, sobre outra coisa.

### Design
| Agente | Escopo |
|---|---|
| `game-director` | **("Diretor Criativo" do MP)** Escopo de feature, decisões de design, revisão/reconciliação final do resultado contra o pedido original. Não escreve código. |
| `game-designer` | Curvas de progressão, fórmulas de dano/stat, balanceamento de runas e mana — no papel, antes da implementação. |
| `level-designer` | Layout de dungeon, ritmo de dificuldade dos 33 episódios, posicionamento de segredos/boss, mapa isométrico overworld (Niterói). |
| `narrative-designer` | Lore da Ghostdex, nomenclatura de espécies, tom do texto voltado ao jogador. |
| `ui-ux-designer` | HUD, modais, responsividade mobile, identidade visual neon/vaporwave. |

### Programação
| Agente | Escopo |
|---|---|
| `gameplay-engineer` | Mecânicas, sistema de RPG, `engine.js`/`rpg_system.js`, Ghostdex (jogabilidade). |
| `engine-programmer` | Loop principal (`Game_Loop`/`Game_Step`), máquina de estados (`SetGameState`), ciclo de vida do canvas. |
| `graphics-programmer` | Desenho Canvas 2D — draw order, sprites, efeitos visuais, "binary background". Sem shaders (não há WebGL no stack). |
| `ai-programmer` | Comportamento de boss/inimigo (`c_Boss`), padrões de ataque — não os números de HP/dano (isso é `game-designer`). |
| `network-programmer` | Sync multiplayer do lado **cliente** (interpolação, reconexão, chat global). Servidor/Socket.io é `backend-architect`. |
| `backend-architect` | `server/db.js`, `server/index.js`, schema Postgres/Supabase, eventos Socket.io, auth. |
| `mobile-platform-engineer` | Paridade site↔mobile, build Capacitor/Android, as duas pastas-armadilha já documentadas na §3. |
| `tools-programmer` | Scripts internos — seed/migração (`seed_badges.js`, `migratetosupabase.js`), build-time da conversão OSM. |
| `physics-programmer` | Colisão (bitmap de tiles), física de pulo/gravidade, movimento de projétil. |
| `security-engineer` | Revisão de auth/validação/integridade — não implementa, revisa e aponta cenário concreto de abuso. |

### Arte e Visual
| Agente | Escopo |
|---|---|
| `concept-artist` | Direção visual antes do asset final — silhueta, paleta, mood de uma nova espécie/tela. |
| `2d-artist` | Especificação de sprite/ícone final (`.webp`/`.png`) — não gera arquivo binário, escreve spec executável. |
| `animator` | Animação de sprite e o sistema de cutscene via GIF (`StartCutscene`/`EndCutscene`, `cutsceneGif`). |
| `vfx-artist` | Direção visual de efeitos (cor, partículas, duração) — implementação real é `graphics-programmer`. |
| `technical-artist` | Ponte arte↔código, pipeline de asset, performance de carregamento (hoje sem spritesheet/atlas). |
| `3d-modeler` | **Só** o espaço Hyperfy (`desoghostmansion`) — não há pipeline 3D no jogo em si. |
| `texture-artist` | **Só** ao lado de `3d-modeler` no Hyperfy — não há malha 3D no jogo em si pra texturizar. |

### Áudio
| Agente | Escopo |
|---|---|
| `sound-designer` | Direção de efeitos sonoros (SFX) — spec, não gera áudio. |
| `composer` | Direção de trilha sonora — hoje um track confirmado (`Ghostly Quest 8-Bit.mp3`). |
| `audio-programmer` | Código de playback (`PlayBGM`/`ToggleMute`), autoplay policy, wiring de novo som/track. |
| `voice-actor` | **Dormante** — não existe sistema de dublagem/VO no jogo hoje; redireciona pra `narrative-designer` se o pedido for sobre texto. |

### Produção, Gestão e Qualidade
| Agente | Escopo |
|---|---|
| `producer` | Priorização macro — o que entra no mês, o que é cortado/adiado, escopo realista de dev solo. |
| `project-manager` | Sequenciamento de um trabalho já escopado entre os especialistas certos, na ordem certa. |
| `qa-tester` | Playtesting geral e feedback de balanceamento — bugs do dia a dia, fora do escopo save/auth/sync. |
| `qa-lead` | Verificação ponta a ponta antes de qualquer deploy que toque save/auth/sync — método real, não "parece que funciona". |
| `forensic-analyst` | Investigação forense de largo espectro (40 anos) — assume que nada está de fato corrigido até rastrear a cadeia causal completa; usado quando um sistema (ex: save/sync) já foi remendado várias vezes e pode ter irmãos do mesmo bug em outro lugar. Não é substituto do `qa-lead` (verificação de UMA mudança antes do deploy) nem do `backend-architect` (implementação) — é auditoria adversarial ampla. |

### Publicação, Negócios e Pós-Lançamento
| Agente | Escopo |
|---|---|
| `marketing` | Divulgação nos canais reais já existentes (Twitter `@GhostGamesnit`, Telegram, YouTube). |
| `game-economy-designer` | Economia de score/badges (333 badges) — hoje **sem** monetização real em dinheiro no código. |
| `publisher-bizdev` | Realidade de distribuição hoje: APK direto pelo site, **sem** loja/publisher confirmado — não presumir Play Store. |
| `localization` | **Achado real confirmado**: a tela inicial mistura PT (`RESGATAR PROGRESSO`) e EN (`PRESS SPACE TO START`) hoje — precisa de decisão do usuário sobre estratégia de idioma antes de "corrigir". |
| `community-manager` | Chat global in-game (`InitGlobalChat`), canais externos — interação do dia a dia com jogadores. |
| `live-ops` | Cadência de conteúdo pós-lançamento reaproveitando sistemas existentes (badges, overworld). |
| `skills-curator` | Pesquisa e mantém as Skills compartilhadas em `danger ghost/.claude/skills/` — não escreve código de jogo. |

### Orquestrador
| Agente | Escopo |
|---|---|
| `mp-orchestrator` | Triagem de um pedido amplo/multi-departamento — lê o roster completo acima, decide quem aciona e em que ordem, sinaliza risco de escopo. Não implementa e não invoca outros agentes sozinho; devolve o plano pro fio principal executar via `Agent`. Fecha sempre delegando a síntese final pro `game-director` (o "Diretor Criativo"). |

Skills já criadas (carregadas pelos agentes acima quando relevante): `e2e-db-verification` (metodologia de teste contra o Supabase real, com conta descartável, simulando "outro aparelho"), `crossplatform-deploy` (checklist de espelhar pro mobile, recompilar o APK, cache-busting, e o deploy na VPS com as pegadinhas do teclado remoto), `forensic-root-cause-analysis` (mapeamento de cadeia causal, causa raiz vs. gatilho, diagnóstico de race condition a partir do estado bruto, caça a "irmãos" do mesmo tipo de bug — carregada pelo `forensic-analyst` antes de `e2e-db-verification`), `isometric-canvas-rendering` (projeção grid↔tela do overworld, draw-order, e a regra de nunca rodar o loop do overworld concorrente com o de `engine.js` no mesmo canvas) e `osm-to-game-grid` (conversão de dados OpenStreetMap reais em grid do overworld, build-time only). Peça ao `skills-curator` pra criar novas conforme o time encontrar mais processos repetíveis.
