# Technical Specifications (SPEC)

*Última revisão: 19 de Agosto de 2026 — validado contra `server/index.js`, `server/db.js`, `server/package.json` (após a migração do banco de dados pro Supabase/Postgres, que removeu `cloud_api.js`, `schema.sql` e o Postgres/Redis órfão anteriores).*

## 1. Stack Tecnológico Principal
- **Servidor:** Node.js, Express **v5.2.1**.
- **Comunicação WebSockets:** `socket.io` v4.8.3 (server) / `socket.io-client` v4.8.3 (client).
- **Banco de Dados: um só, Postgres via Supabase** (`server/db.js`, driver `pg`), conectado por `DATABASE_URL` no `.env` (connection string do "Session pooler" do Supabase — recomendado pra um processo Node persistente como o nosso, ver `docs/ARCHITECTURE.md` §4). Antes de 19/08/2026 existiam três integrações de banco em paralelo (SQLite ativo + MySQL nunca conectado + Postgres/Redis órfão) — foram consolidadas nessa migração.
- **Autenticação:**
  - `google-auth-library` no servidor, Firebase Auth (Google Sign-In) no cliente — caminho principal. Token verificado de verdade com `googleClient.verifyIdToken()` (corrigido em 18/08/2026).
  - **Senhas do login local (e-mail/senha) são hasheadas com `bcryptjs`** desde 18/08/2026 (antes eram texto puro — corrigido, ver `docs/SECURITY_AUDIT.md`). Contas antigas migram o hash automaticamente no próximo login com sucesso.
- **Frontend Engine:** Vanilla JavaScript, renderização em HTML `<canvas>`.
- **Aplicativo Mobile:** Capacitor v8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`).

## 2. Banco de Dados

### Postgres/Supabase (via `server/db.js`)
Tabela `players`: `email` (PK), `name`, `password` (hash bcrypt), `level`, `xp` (double precision), `mana`, `max_mana`, `lives`, `equipped_skills` (**JSONB nativo** — o driver `pg` já devolve como array JS, sem precisar de `JSON.parse` manual), `created_at`, `updated_at`. Usada tanto pelo login Google quanto pelo login e-mail/senha — é o único armazenamento persistente do backend hoje.

### Legado
Referências a `publicKey` da DeSo estão obsoletas; o identificador de jogador é sempre `email`. Existiu no passado um schema MySQL separado (`players_cloud_save`, chaveado por `google_id`) para um sistema de cloud save via REST/JWT que nunca chegou a ser conectado ao `index.js` nem ao frontend — removido em 19/08/2026 junto com o resto do código órfão de banco de dados (ver `docs/ARCHITECTURE.md` §4).

## 3. Protocolo de Comunicação Multiplayer (Socket.io)
Endereço oficial do backend em produção: `https://ghostgames.club`. Conexão do cliente: `io(BACKEND_URL, { transports: ['websocket'], upgrade: false })`.

### Eventos emitidos pelo cliente (`socket.emit`)
| Evento | Payload | Descrição |
|---|---|---|
| `join_game` | `{ playerName }` | Entra no mundo, servidor cria o registro do jogador em memória |
| `player_move` | `{ x, y, isFacingRight, state, level, hp, ghostLevel }` | Estado de posição/animação, alta frequência |
| `player_attack` | — | Ação de ataque |
| `kill_boss` | — | Notifica abate de chefe |
| `auth_google_token` | `{ idToken, ... }` | Login via Google/Firebase |
| `cloud_save_login` | `{ email, password }` | Login local (Postgres/Supabase, senha com hash bcrypt) |
| `save_game_state` | `{ ...gameData }` | Salva progresso via `savePlayerProgress()` (mesma tabela `players`) |

### Eventos recebidos do servidor (`socket.on`)
| Evento | Descrição |
|---|---|
| `auth_success` | Confirmação de `join_game` |
| `player_joined` / `player_left` | Entrada/saída de outros jogadores no Canvas |
| `sync_state` | Estado mestre: `{ tick, totalOnline, players }`, onde `players` traz `x`, `y`, `ghostLevel` etc. de todos os clientes |
| `boss_killed` | Broadcast de abate de chefe |
| `auth_google_success` / `auth_google_error` | Resultado do login Google |
| `cloud_save_success` / `cloud_save_error` | Resultado do login local |
| `save_success` / `save_error` | Resultado do save |

*Nota: a lista de eventos acima foi extraída diretamente dos `socket.on(...)` em `server/index.js` — se novos eventos forem adicionados, atualize esta tabela.*

## 4. Otimização do Engine no Client
- **Draw Calls:** loop `requestAnimationFrame`. Nomes e níveis dos jogadores e sprites são desenhados diretamente no `g_ctx` (contexto 2D).
- **Desacoplamento:** física (gravidade, colisão em array de bits) roda em sincronia com o render, mas não trava a thread de rede. O envio de `player_move` é disparado por mudança de estado, com fallback periódico de keep-alive.
- **Tamanho de arquivo:** `js/game/engine.js` tem ~220KB em ambas as versões (web e mobile) — monolito único. Ao propor refino de performance, considerar que profiling precisa isolar seções dentro desse arquivo, não há módulos separados por sistema.
