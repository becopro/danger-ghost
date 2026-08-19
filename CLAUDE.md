# CLAUDE.md — Memória e Regras do Projeto Danger Ghost

Este é o documento de referência principal para o Claude Code (e qualquer agente compatível) trabalhando neste repositório. Ele consolida e substitui, em termos de precisão, o `Gemini.md` deste mesmo diretório — os dois devem contar a mesma história; se divergirem, este arquivo é a fonte da verdade porque é o mais recentemente auditado contra o código real (18/08/2026).

Antes de propor ou implementar qualquer mudança, leia também `docs/PRD.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/BRIEFING.md` e `docs/HANDOVER.md` — não redescubra a arquitetura do zero a cada sessão.

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

## 4. Autenticação — 3 caminhos de login, 1 banco de dados só (atualizado 19/08/2026)
Existem três fluxos de entrada no jogo, detalhados em `docs/ARCHITECTURE.md` §3, mas **os dois primeiros gravam na mesma tabela Postgres** (`players`, via `server/db.js`) — não são sistemas de dados separados:
1. Google OAuth via Firebase (principal), token verificado de verdade com `googleClient.verifyIdToken()`.
2. E-mail + senha local. **Senha com hash bcrypt** desde 18/08/2026 (antes era texto puro — corrigido; contas antigas migram o hash automaticamente no próximo login).
3. Save local via `TriggerRPGSaveToDeSo()` → `localStorage`, sem rede — continua paralelo aos outros dois, não afetado pela migração de banco.

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
