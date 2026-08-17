# Architecture and Data Flow

## 1. Topologia do Sistema
O sistema Danger Ghost opera em um modelo estrito de Cliente-Servidor (Client-Server), sem P2P (Peer-to-Peer). O servidor age como a única fonte de verdade ("Source of Truth") para a sincronização multiplayer.

## 2. Estrutura de Diretórios e Fronteiras

### `danger ghost/` (Projeto Web & Backend)
- **`/server`**: Contém o Node.js (`index.js`). Roda na porta 3000 localmente, expondo Socket.io. Toda a comunicação do banco de dados (SQLite3) é feita e restrita a esta camada. Os clientes (sejam web ou mobile) nunca tocam o banco de dados diretamente.
- **`/js/game`**: Engine Core. Arquivos como `engine.js` (Loop Principal, Input, Física) e `network.js` (Conexão e abstração do socket.io).
- **`/js/web2`**: Lógica de interface de usuário focada no navegador (Login form, Registro de Usuário, Parsing de JSON do RPG, Auth).

### `danger_ghost_mobile/` (Projeto Mobile)
- É uma "bifurcação" paralela encapsulada pelo **Capacitor**.
- A pasta `www/` é essencialmente um clone modificado da versão web.
- **Atenção à Fronteira:** Qualquer atualização no `danger ghost/js/game` **não** se propaga automaticamente para o mobile. Você deve transpor o código para `danger_ghost_mobile/www/js/game/` e então compilar o Android através de `npx cap sync android`.

## 3. Fluxo de Autenticação e Entrada no Jogo
1. O usuário acessa o cliente (Web ou Mobile).
2. O usuário preenche as credenciais Web2.
3. O frontend envia os dados criptografados para o backend (Express API POST).
4. O backend consulta o SQLite. Se a senha confere (bcrypt), um JWT ou token de sessão é validado e o progresso do usuário é resgatado.
5. O `network.js` inicializa a conexão `socket.io` e envia o evento `join_game`.
6. A interface Web2 transiciona ("Fade out"), e o script `engine.js` assume o controle via requestAnimationFrame (Início do loop do jogo e renderização do `Canvas`).

## 4. Legado DeSo
Todo e qualquer fluxo que aponta para nós de terceiros ou verificação de chaves públicas na DeSo foi deprecado. A arquitetura atual e futura foca na autossuficiência do backend (atualmente com SQLite, futuramente com blockchain dedicada de propósito específico para o jogo).
