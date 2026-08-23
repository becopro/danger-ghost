# Architecture and Data Flow

*Última revisão: 23 de Agosto de 2026 — validado linha a linha contra o código real do repositório (não apenas descrito de memória).*

## 1. Topologia do Sistema
O sistema Danger Ghost opera em um modelo estrito de Cliente-Servidor (Client-Server), sem P2P. O servidor Node.js (`danger ghost/server/index.js`) é a única fonte de verdade ("Source of Truth") para a sincronização multiplayer via Socket.io.

## 2. Estrutura de Diretórios e Fronteiras

### `danger ghost/` (Projeto Web & Backend)
- **`/server`**: Node.js (`index.js`, Express v5 + Socket.io v4.8.3). Roda na porta 3000 localmente; em produção atrás de `ghostgames.club` (ver `setup-https.sh`, `setup-port80.sh`, `deploy_server.sh`, gerenciado via PM2). Os clientes (web ou mobile) nunca tocam o banco de dados diretamente — tudo passa pelo servidor.
- **`/js/game`**: Engine Core. `engine.js` (loop principal, input, física, ~220KB — arquivo grande, cuidado ao editar), `network.js` (abstração do socket.io), `ghost_inventory.js`, `ghostdex_data.js` / `ghostdex_ui.js`. (`cloud_save_client.js` existiu até 19/08/2026 — era o cliente HTTP de um sistema MySQL/JWT nunca conectado, removido na migração pro Supabase, ver seção 4.)
- **`/js/web2`**: Interface Web2 focada no navegador — `auth.js`, `auth_mock.js`, `game_core.js` (login, registro, save local/nuvem, parsing do RPG).
- **`/js/ui`**: `ui_manager.js` — painéis de overlay (stats, inventário, chat etc).
- **`/js/web3`**: **pasta vazia**, remanescente da era DeSo. Não contém código; pode ser removida com segurança quando for feita a limpeza de legado.

### `danger_ghost_mobile/` (Projeto Mobile)
- É uma "bifurcação" paralela encapsulada pelo **Capacitor v8**. A pasta `www/` é um clone modificado da versão web, com os mesmos nomes de arquivo (`js/game/engine.js`, `js/web2/game_core.js` etc.) mas conteúdo que pode ter divergido.
- **Fronteira crítica:** uma atualização em `danger ghost/js/game/engine.js` **não** se propaga automaticamente para `danger_ghost_mobile/www/js/game/engine.js`. É preciso transpor manualmente e depois rodar `npx cap sync android` + recompilar o APK (Android Studio ou `gradlew assembleDebug`).
- O mobile já possui controles touch implementados (`#mobileControlsContainer`, D-pad estilo GameBoy) em `www/index.html`, ligados via `setupTouchButton(id, keyCode)` que simula teclas — não é um sistema de input touch nativo separado, é um adaptador para o mesmo pipeline de teclado do engine.

## 3. Fluxo de Autenticação e Entrada no Jogo — 2 caminhos, **1 banco de dados** (atualizado 23/08/2026)

Existem dois caminhos de login/save no cliente:

1. **"Cloud Save" por e-mail + senha — único caminho de login real do cliente hoje**
   Botões "RESGATAR PROGRESSO"/"CRIAR CONTA NOVA"/LOGIN abrem `OpenLoginModal()` (`js/web2/auth.js`), que emite `cloud_save_login` ou `cloud_save_signup` → `server/db.js` → tabela `players`. Senhas com hash `bcryptjs` desde 18/08/2026 (antes era texto puro — corrigido, ver `docs/SECURITY_AUDIT.md`).
2. **Save local (`TriggerRPGSaveToDeSo()`)**
   Apesar do nome (herdado da era DeSo), essa função em `game_core.js` **não é código morto** — ela só grava o progresso em `localStorage` do navegador/app, sem chamada de rede. É um save 100% local/offline, paralelo ao caminho acima. **Cuidado:** não apagar por causa do nome; é usada ativamente na UI mobile (`www/index.html`).

Após qualquer um dos dois caminhos, `network.js` inicializa a conexão `socket.io`, envia `join_game`, a interface Web2 faz fade-out, e `engine.js` assume via `requestAnimationFrame`.

**Nota histórica — Google OAuth (Firebase) removido em 23/08/2026:** existia um terceiro caminho "principal" documentado aqui, `LoginGoogle()` em `js/web2/game_core.js`, usando `firebase.auth().signInWithPopup()` com fallback para um MOCK LOGIN local (token falso `mock_<nome>`) quando o Firebase não estivesse configurado — o que sempre acontecia, porque `firebaseConfig` só tinha placeholders (`YOUR_API_KEY` etc.) nunca preenchidos. Auditoria de login pedida pelo usuário (23/08/2026) confirmou que essa função era **código morto perigoso, não só redundante**: nenhum botão do `index.html` ao vivo chamava `LoginGoogle()` (todos chamam `OpenLoginModal()`), `window.JoinGameServer` — que o mock chamava pra "completar" o login — não existe em lugar nenhum do código, e o cliente nunca emitia o evento `auth_google_token` (o handler correspondente em `server/index.js`, com `googleClient.verifyIdToken()`, já estava morto do lado do servidor por falta de chamador, mesmo antes desta limpeza). A função foi removida por completo (não só sobrescrita) de `game_core.js`, as tags `<script>` do Firebase SDK saíram de `index.html`, e `window.LoginGoogle` agora é um alias direto para `window.OpenLoginModal` em `auth.js` — rede de segurança caso algum código futuro ainda chame `LoginGoogle()` por hábito (a cópia mobile morta `www/index.html` tem um botão `onclick="LoginGoogle()"`, landmine pra quem copiar dali sem saber que a função original sumiu). O handler `auth_google_token` continua existindo em `server/index.js` (infraestrutura server-side válida, não removida), mas não tem nenhum caminho de chamada no cliente hoje.

## 4. Camada de Dados — **um banco só, desde 19/08/2026**
- **Postgres (Supabase)**, via `server/db.js`: tabela `players` (e-mail, nome, senha com hash bcrypt, level, xp, mana, max_mana, lives, equipped_skills como JSONB). É o único banco de dados do backend — `loadOrCreatePlayer()` e `savePlayerProgress()` são chamadas pelo login e-mail/senha (ver seção 3; o handler de login Google em `server/index.js` também as chama, mas não tem chamador no cliente hoje).
- Migração feita a partir do **SQLite** anterior (`server/game_data.db`) com `server/migrate_to_supabase.js` (script de uso único, idempotente — roda de novo sem duplicar se precisar). O arquivo SQLite original **não foi apagado**, fica como backup/rollback.
- **Removido nessa migração** (existia mas nunca era usado por nenhum código ativo — confirmado antes de apagar): `server/cloud_api.js` + `js/game/cloud_save_client.js` (sistema MySQL/JWT paralelo, nunca conectado), `server/schema.sql` (schema MySQL do provedor "Deso Hosting" — nome do provedor, não tem relação com a blockchain DeSo), `server/workers/SaveWorker.js` + `server/db/postgresClient.js` + `server/db/redisClient.js` + `server/db/schema.sql` (uma *quarta* tentativa órfã de schema Postgres, tabelas `accounts`/`characters`, também nunca referenciada em código nenhum). Dependências removidas do `package.json`: `mysql2`, `redis`, `firebase-admin` (não estava sendo importado em lugar nenhum), `jsonwebtoken` (só usado pelo `cloud_api.js` removido). `sqlite3` continua no `package.json` até a migração ser confirmada em produção (usado pelo script de migração).

## 5. Legado DeSo — o que era lixo de fato vs. o que só tinha o nome
**Atualizado em 18/08/2026: a limpeza abaixo já foi executada** (20 arquivos deletados + função morta removida de 6 arquivos, em `danger ghost/` e `danger_ghost_mobile/`, raiz e cópias em `www/`), testada com `node -c` em todos os arquivos editados.
- **Removido:** `_archive/deso_api.js.bak`, `scratch/old_deso.js`, os scripts de migração já executados (`patch_deso.js`, `split_deso.js`, `replace_deso.js`), `diablo_saves/deso_connector.ts` (protótipo TypeScript nunca importado), e a função `PostToDeSo()` (stub mock que só exibia alerta "Social posting is disabled") em `js/web2/game_core.js` e `js/web2/auth_mock.js`.
- **Mantido de propósito, apesar do nome "deso"/"DeSo":** `TriggerRPGSaveToDeSo()` (save local ativo). Ver seção 3.
- **Atualização 19/08/2026:** `schema.sql` (o schema MySQL do provedor "Deso Hosting") foi removido — não por causa do nome, mas porque o sistema MySQL inteiro que ele descrevia foi aposentado na migração pro Supabase (ver seção 4). O nome do provedor de hospedagem nunca teve relação com a blockchain DeSo; isso só deixou de ser relevante porque o MySQL em si saiu de uso.
