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

Criada em 30/08/2026, a pedido do usuário: um time de subagentes com escopo de responsabilidade claro, cada um carregando o histórico real de bugs/decisões deste projeto (não conhecimento genérico) em `danger ghost/.claude/agents/*.md`. Invoque via `Agent` com `subagent_type` = o nome do arquivo:

| Agente | Escopo |
|---|---|
| `game-director` | Escopo de feature, decisões de design, revisão do resultado final contra o pedido original. Não escreve código. |
| `gameplay-engineer` | Mecânicas, sistema de RPG, `engine.js`/`rpg_system.js`, Ghostdex (jogabilidade). |
| `backend-architect` | `server/db.js`, `server/index.js`, schema Postgres/Supabase, eventos Socket.io, auth. |
| `mobile-platform-engineer` | Paridade site↔mobile, build Capacitor/Android, as duas pastas-armadilha já documentadas na §3. |
| `security-engineer` | Revisão de auth/validação/integridade — não implementa, revisa e aponta cenário concreto de abuso. |
| `qa-lead` | Verificação ponta a ponta antes de qualquer deploy que toque save/auth/sync — método real, não "parece que funciona". |
| `forensic-analyst` | Investigação forense de largo espectro (40 anos) — assume que nada está de fato corrigido até rastrear a cadeia causal completa; usado quando um sistema (ex: save/sync) já foi remendado várias vezes e pode ter irmãos do mesmo bug em outro lugar. Não é substituto do `qa-lead` (verificação de UMA mudança antes do deploy) nem do `backend-architect` (implementação) — é auditoria adversarial ampla. |
| `ui-ux-designer` | HUD, modais, responsividade mobile, identidade visual neon/vaporwave. |
| `narrative-designer` | Lore da Ghostdex, nomenclatura de espécies, tom do texto voltado ao jogador. |
| `skills-curator` | Pesquisa e mantém as Skills compartilhadas em `danger ghost/.claude/skills/` — não escreve código de jogo. |

Skills já criadas (carregadas pelos agentes acima quando relevante): `e2e-db-verification` (metodologia de teste contra o Supabase real, com conta descartável, simulando "outro aparelho"), `crossplatform-deploy` (checklist de espelhar pro mobile, recompilar o APK, cache-busting, e o deploy na VPS com as pegadinhas do teclado remoto) e `forensic-root-cause-analysis` (mapeamento de cadeia causal, causa raiz vs. gatilho, diagnóstico de race condition a partir do estado bruto, caça a "irmãos" do mesmo tipo de bug — carregada pelo `forensic-analyst` antes de `e2e-db-verification`). Peça ao `skills-curator` pra criar novas conforme o time encontrar mais processos repetíveis.
