# State Dump & Handover Document
**Data do Handover:** 18 de Agosto de 2026
**Projeto:** Danger Ghost (Web2 + Mobile)

## 1. O que foi feito recentemente (Últimas Atualizações)
- **Restauração do Mobile (Rollback Cirúrgico):** O código da pasta `danger_ghost_mobile` (que estava quebrando ao ser misturado com as atualizações Web recentes) foi revertido para o estado funcional do dia 13 de Agosto (Commit `9bd4acd`).
- **Fix de Conexão Mobile:** A URL de backend no mobile foi chumbada (hardcoded) para `https://ghostgames.club`, resolvendo o erro onde o Capacitor tentava conectar o socket.io no `localhost:3000` internamente no celular.
- **Remoção de Trava de Personagem (PC):** No arquivo `danger ghost/js/game/engine.js`, foi removido o alerta *"Please select or create your Ghost character..."* que impedia o jogo de iniciar. Agora, pressionar Espaço (Space) pula o overlay e entra direto no jogo assumindo o fantasma Padrão (Lv 1, Ghost #001).
- **Adição do Level na UI (Mobile):** Através de um subagente, foi adicionada a renderização do Level do Fantasma (ex: `Lv. 1`) amarelo e flutuante acima do nome do personagem *exclusivamente* no canvas da versão mobile (`danger_ghost_mobile/www/js/game/engine.js`).
- **Deploy do APK:** A versão mais recente do Android foi compilada com Capacitor v8 e o novo arquivo `DangerGhostMobile.apk` foi disponibilizado na interface web (versão `v=45`).

## 2. Documentação de Governança Criada
Uma fundação robusta de documentação foi estabelecida para balizar desenvolvimentos futuros:
1. **`Gemini.md` (Raiz):** Manual de instruções primordial para Agentes de IA, ditando as leis do projeto.
2. **`docs/PRD.md`:** Requisitos funcionais (Auto-forge, SQLite Cloud Saves, Ghostdex, Cross-play).
3. **`docs/SPEC.md`:** Especificações técnicas (Payloads do Socket.io, Node.js + SQLite3, Canvas Javascript).
4. **`docs/ARCHITECTURE.md`:** Fluxo de dados Cliente-Servidor e isolamento das pastas Mobile/Web.
5. **`docs/BRIEFING.md`:** Lore, Core Gameplay Loop e estética visual (Hacker/Neon/Vaporwave).

## 3. Estado Atual da Arquitetura
- **O Fim da Blockchain DeSo:** A blockchain DeSo foi **oficialmente abandonada**. Qualquer resquício de código referente à DeSo no frontend ou backend deve ser considerado **código morto/legado**. O login é puramente Web2 (bcrypt + Node).
- **O Futuro:** Está planejado no roadmap a criação de uma **blockchain de propósito específico** proprietária, construída do zero apenas para o ecossistema do jogo (salvar progresso e inventário).
- **Cross-play:** Jogadores no navegador e jogadores no celular (`danger_ghost_mobile`) coexistem perfeitamente no mesmo servidor Socket.io. Toda lógica nova de UI no Canvas deve ser transposta manualmente para o mobile quando necessário, pois as pastas `js/` são separadas.

## 4. Próximos Passos Sugeridos
- Desenvolver a Blockchain proprietária para lidar com os saves do SQLite de forma descentralizada.
- Limpar ativamente o código morto referente à API da DeSo (ex: `deso_login.js`, endpoints do `server/index.js` que buscam perfis na antiga rede).
- Refinar a interface mobile (controles touch na tela) já que o build Android está 100% liso na rede de produção.
