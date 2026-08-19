# Architecture and Data Flow

*Última revisão: 19 de Agosto de 2026 — validado linha a linha contra o código real do repositório (não apenas descrito de memória).*

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

## 3. Fluxo de Autenticação e Entrada no Jogo — 3 caminhos, **1 banco de dados** (desde 19/08/2026)

Existem três caminhos de login/save no cliente, mas **os três primeiros convergem pro mesmo backend** (`server/db.js`) — não são três sistemas de dados diferentes, como uma versão anterior desta doc chegou a supor:

1. **Google OAuth (Firebase) — caminho principal**
   `LoginGoogle()` em `js/web2/game_core.js` usa `firebase.auth().signInWithPopup()` (ou um fallback mock local se o Firebase não estiver configurado). O ID token vai pro servidor, que o verifica de verdade com `google-auth-library` (`server/index.js`, evento `auth_google_token`, `googleClient.verifyIdToken()` — corrigido em 18/08/2026, antes só decodificava sem checar assinatura). O progresso é salvo via `loadOrCreatePlayer()`/`db.js` — **mesma tabela `players` do item 2 abaixo**, não um sistema separado. *(Nota histórica: existia um `server/cloud_api.js` com um sistema MySQL/JWT paralelo pra esse fluxo — nunca foi de fato conectado a `index.js` nem ao frontend, e foi removido em 19/08/2026 durante a migração pro Supabase.)*
2. **"Cloud Save" por e-mail + senha — caminho alternativo**
   Evento socket `cloud_save_login` (ou `auth_google_token` com `isFallback:true`) → `server/db.js` → tabela `players`. Senhas com hash `bcryptjs` desde 18/08/2026 (antes era texto puro — corrigido, ver `docs/SECURITY_AUDIT.md`).
3. **Save local (`TriggerRPGSaveToDeSo()`)**
   Apesar do nome (herdado da era DeSo), essa função em `game_core.js` **não é código morto** — ela só grava o progresso em `localStorage` do navegador/app, sem chamada de rede. É um save 100% local/offline, paralelo aos dois caminhos acima. **Cuidado:** não apagar por causa do nome; é usada ativamente na UI mobile (`www/index.html`).

Após qualquer um dos três caminhos, `network.js` inicializa a conexão `socket.io`, envia `join_game`, a interface Web2 faz fade-out, e `engine.js` assume via `requestAnimationFrame`.

## 4. Camada de Dados — **um banco só, desde 19/08/2026**
- **Postgres (Supabase)**, via `server/db.js`: tabela `players` (e-mail, nome, senha com hash bcrypt, level, xp, mana, max_mana, lives, equipped_skills como JSONB). É o único banco de dados do backend — `loadOrCreatePlayer()` e `savePlayerProgress()` são chamadas tanto pelo login Google quanto pelo login e-mail/senha (ver seção 3).
- Migração feita a partir do **SQLite** anterior (`server/game_data.db`) com `server/migrate_to_supabase.js` (script de uso único, idempotente — roda de novo sem duplicar se precisar). O arquivo SQLite original **não foi apagado**, fica como backup/rollback.
- **Removido nessa migração** (existia mas nunca era usado por nenhum código ativo — confirmado antes de apagar): `server/cloud_api.js` + `js/game/cloud_save_client.js` (sistema MySQL/JWT paralelo, nunca conectado), `server/schema.sql` (schema MySQL do provedor "Deso Hosting" — nome do provedor, não tem relação com a blockchain DeSo), `server/workers/SaveWorker.js` + `server/db/postgresClient.js` + `server/db/redisClient.js` + `server/db/schema.sql` (uma *quarta* tentativa órfã de schema Postgres, tabelas `accounts`/`characters`, também nunca referenciada em código nenhum). Dependências removidas do `package.json`: `mysql2`, `redis`, `firebase-admin` (não estava sendo importado em lugar nenhum), `jsonwebtoken` (só usado pelo `cloud_api.js` removido). `sqlite3` continua no `package.json` até a migração ser confirmada em produção (usado pelo script de migração).

## 5. Legado DeSo — o que era lixo de fato vs. o que só tinha o nome
**Atualizado em 18/08/2026: a limpeza abaixo já foi executada** (20 arquivos deletados + função morta removida de 6 arquivos, em `danger ghost/` e `danger_ghost_mobile/`, raiz e cópias em `www/`), testada com `node -c` em todos os arquivos editados.
- **Removido:** `_archive/deso_api.js.bak`, `scratch/old_deso.js`, os scripts de migração já executados (`patch_deso.js`, `split_deso.js`, `replace_deso.js`), `diablo_saves/deso_connector.ts` (protótipo TypeScript nunca importado), e a função `PostToDeSo()` (stub mock que só exibia alerta "Social posting is disabled") em `js/web2/game_core.js` e `js/web2/auth_mock.js`.
- **Mantido de propósito, apesar do nome "deso"/"DeSo":** `TriggerRPGSaveToDeSo()` (save local ativo). Ver seção 3.
- **Atualização 19/08/2026:** `schema.sql` (o schema MySQL do provedor "Deso Hosting") foi removido — não por causa do nome, mas porque o sistema MySQL inteiro que ele descrevia foi aposentado na migração pro Supabase (ver seção 4). O nome do provedor de hospedagem nunca teve relação com a blockchain DeSo; isso só deixou de ser relevante porque o MySQL em si saiu de uso.
