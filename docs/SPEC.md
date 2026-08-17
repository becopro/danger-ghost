# Technical Specifications (SPEC)

## 1. Stack Tecnológico Principal
- **Servidor:** Node.js v18+
- **Comunicação WebSockets:** `socket.io` e `socket.io-client` v4.8.3
- **Banco de Dados (DB):** `sqlite3`
- **Autenticação:** Sessões baseadas em token (se aplicável), senhas hashadas com `bcrypt`.
- **Frontend Engine:** Vanilla JavaScript com renderização em HTML `<canvas>`.
- **Aplicativo Mobile:** Capacitor v8.1 (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`).

## 2. Banco de Dados (SQLite)
- Arquivo principal (se criado via node): Normalmente gerenciado internamente pelo servidor.
- **Entidades Essenciais:**
  - `Users`: armazena hash da senha, nome de usuário.
  - `Characters` (ou progressão RPG): guarda JSON com estado do `GhostRPG`, distribuição de pontos (VIT, AGI, INT, POW, MAG) e Level.
  - *Nota:* Código referente à blockchain DeSo está obsoleto e as chaves públicas (`publicKey`) podem ser substituídas por IDs gerados localmente (UUIDs) pelo Web2.

## 3. Protocolo de Comunicação Multiplayer
O protocolo roda via Socket.io no endereço oficial do backend (ex: `https://ghostgames.club`).

### Fluxo de Conexão:
1. Cliente instancia: `io(BACKEND_URL, { transports: ['websocket'], upgrade: false })`
2. **Eventos Enviados pelo Cliente (`emit`):**
   - `join_game`: Envia um JSON com `{ playerName: "Nome do Jogador" }` e/ou o character ID.
   - `player_move`: Envia estado em alta frequência. Payload: `{ x, y, isFacingRight, state, level, hp, ghostLevel }`.
3. **Eventos Recebidos do Servidor (`on`):**
   - `auth_success`: Validação de login.
   - `sync_state`: Estado mestre do servidor. Payload: `{ tick: int, totalOnline: int, players: object }`. Onde `players` possui as coordenadas (x,y) e níveis (`ghostLevel`) de outros clientes.
   - `player_joined` / `player_left`: Gerencia entrada e saída visual de outros Fantasmas no Canvas.

## 4. Otimização do Engine no Client
- **Draw Calls:** A renderização principal ocorre em um loop `requestAnimationFrame`. Todo texto (ex: Nomes e Levels dos jogadores) e Sprites são iterados array a array e desenhados diretamente no contexto 2D (`g_ctx`).
- **Desacoplamento:** A parte física (gravidade, colisão de mapas em array de bits) opera em sincronia, mas sem travar a thread de rede. O `setInterval` que envia `player_move` dispara somente quando o estado do fantasma altera (ou como fallback de verificação vital de presença a cada X segundos).
