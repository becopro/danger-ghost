# Instruções Específicas do Projeto Danger Ghost

Bem-vindo(a) ao projeto **Danger Ghost**! Este documento serve como o principal guia de regras e contexto arquitetural para qualquer agente de IA que trabalhe nesta base de código. 

Por favor, **leia atentamente** as regras abaixo antes de propor ou implementar qualquer alteração neste repositório.

## 1. Regra de Ouro: Nada de Blockchain DeSo
- **Aviso Crítico:** O projeto é estritamente **100% Web2** no estado atual.
- A blockchain DeSo já foi utilizada no passado, mas **foi removida**. 
- Você encontrará arquivos (como `deso_login.js`) e lógicas que mencionam a DeSo (ex: `window.DeSoGhost`). Trate esses artefatos como **código legado morto**.
- **Não** tente utilizar, integrar, consertar ou reativar qualquer recurso da DeSo. Ignore completamente a sua existência em novos desenvolvimentos.

## 2. O Futuro: Nossa Própria Blockchain
- No futuro, iremos criar a nossa própria **blockchain de propósito específico**.
- Essa nova blockchain será responsável única e exclusivamente por salvar o jogo e o progresso de cada jogador. 
- Até que essa arquitetura futura seja implementada, nós dependemos do backend em Node.js com o banco de dados `SQLite` para gerenciar o estado da conta (login via bcrypt) e os saves em nuvem do jogador.

## 3. Arquitetura Dupla (Cross-Play)
O projeto é dividido fisicamente em duas partes principais, mas ambas compartilham o mesmo backend e se enxergam no mesmo mundo multiplayer:

1. **PC / Web (`danger ghost/`)**
   - É o jogo principal, que roda no navegador.
   - O código do backend (servidor Socket.io e Node) vive aqui na pasta `server/`.
   - Lida com as sessões de usuário, interface web2 de login e renderização via Canvas.

2. **Mobile (`danger_ghost_mobile/`)**
   - É o aplicativo para Android envelopado através do **Capacitor**.
   - Possui sua própria pasta `www/js/` com versões isoladas de scripts vitais, como `network.js` e `engine.js`.
   - **Regra:** Se você alterar a interface de usuário (UI) ou o motor (engine) de como as coisas renderizam na tela web, verifique se a mesma alteração não precisa ser feita/adaptada isoladamente dentro da pasta `danger_ghost_mobile`.
   - **Compilação:** Após alterar arquivos em `danger_ghost_mobile/www/`, você **sempre** deve rodar `npx cap sync android` na pasta mobile e solicitar ao usuário que recompile o `.apk` via Android Studio (ou rodar `.\gradlew assembleDebug` via terminal se disponível).

## 4. Stack Tecnológico e Regras de Código
- **Frontend / Engine:** HTML5 Canvas, **Vanilla JS**. Não adicione frameworks reativos como React ou Vue para o gameplay. O motor é customizado e lida com matemática de matrizes para colisões, movimentação em pixel e áudio HTML5.
- **Backend:** Node.js, `socket.io` (v4.8.3) e Express.
- **Banco de Dados:** `sqlite3`.
- **CSS:** Vanilla CSS puro e focado na estética "neon/hacker/vaporwave" e glassmorphism que compõe a marca do jogo.

Lembre-se: O foco é manter o jogo rápido, a conexão fluida e respeitar o isolamento da versão mobile quando solicitado. Trabalhe sempre para preservar o funcionamento do cross-play.
