# State Dump & Handover Document
**Data do Handover:** 18 de Agosto de 2026 (revisão 2 — documentação auditada contra o código real)
**Projeto:** Danger Ghost (Web2 + Mobile)

## 1. O que foi feito recentemente (Últimas Atualizações)
- **Restauração do Mobile (Rollback Cirúrgico):** O código da pasta `danger_ghost_mobile` (que estava quebrando ao ser misturado com as atualizações Web recentes) foi revertido para o estado funcional do dia 13 de Agosto (Commit `9bd4acd`).
- **Fix de Conexão Mobile:** A URL de backend no mobile foi chumbada (hardcoded) para `https://ghostgames.club`, resolvendo o erro onde o Capacitor tentava conectar o socket.io no `localhost:3000` internamente no celular.
- **Remoção de Trava de Personagem (PC):** No arquivo `danger ghost/js/game/engine.js`, foi removido o alerta *"Please select or create your Ghost character..."* que impedia o jogo de iniciar. Agora, pressionar Espaço (Space) pula o overlay e entra direto no jogo assumindo o fantasma Padrão (Lv 1, Ghost #001).
- **Adição do Level na UI (Mobile):** Foi adicionada a renderização do Level do Fantasma (ex: `Lv. 1`) amarelo e flutuante acima do nome do personagem *exclusivamente* no canvas da versão mobile (`danger_ghost_mobile/www/js/game/engine.js`).
- **Deploy do APK:** A versão mais recente do Android foi compilada com Capacitor v8 e o novo arquivo `DangerGhostMobile.apk` foi disponibilizado na interface web (versão `v=45`).

## 2. Documentação de Governança — auditada e corrigida em 18/08
A primeira versão desta documentação (criada mais cedo no mesmo dia) continha imprecisões que foram corrigidas após leitura linha a linha do código real do servidor e do cliente:
1. **`Gemini.md`** (raiz do repo do jogo) — instruções para agentes de IA.
2. **`CLAUDE.md`** (raiz do repo do jogo) — memória/instruções equivalentes para Claude Code, incorporando as mesmas regras + boas práticas de uso de tokens/modelos/skills.
3. **`docs/PRD.md`** — requisitos funcionais. Corrigido: login não é só e-mail/senha, Google OAuth é o caminho principal.
4. **`docs/SPEC.md`** — specs técnicas. Corrigido: lista real de eventos Socket.io, stack de banco de dados real (SQLite + MySQL + Postgres/Redis órfão), e a inexistência de `bcrypt` no backend.
5. **`docs/ARCHITECTURE.md`** — fluxo de dados. Corrigido: são 3 fluxos de autenticação distintos (Google/Firebase, e-mail+senha local, save local via `localStorage`), não um só.
6. **`docs/BRIEFING.md`** — lore e visão de produto (sem alterações materiais, apenas revalidado).

### Achados importantes durante a auditoria (não eram óbvios pela documentação anterior)
- **🔴 Segurança — senha em texto puro:** `server/db.js` armazena e compara a senha do login local (SQLite) sem qualquer hash. `bcrypt` não está nem instalado (`server/package.json`). A documentação antiga afirmava "bcrypt" — estava errada. Tratado como item prioritário para a auditoria de segurança formal.
- **Nomenclatura enganosa "DeSo":** nem tudo que tem "deso" no nome é lixo de blockchain.
  - `TriggerRPGSaveToDeSo()` (`js/web2/game_core.js`) é **função ativa** — salva progresso em `localStorage`. Não apagar.
  - `schema.sql` menciona "Deso Hosting" — é o **nome do provedor de hospedagem MySQL/cPanel**, sem relação com a blockchain DeSo. Não apagar.
  - `PostToDeSo()` e os arquivos em `_archive/`, `scratch/old_deso.js` **são**, de fato, lixo/mock morto.
- **Infra órfã:** `server/workers/SaveWorker.js` (usa Postgres + Redis) existe e tem dependências instaladas, mas não é importado por `server/index.js` — não está rodando em produção. Provável migração inacabada.
- **Mobile já tem controles touch:** ao contrário do que um handover anterior (mais antigo, de 15/07) sugeria, `danger_ghost_mobile/www/index.html` já implementa um D-pad estilo GameBoy (`#mobileControlsContainer`) mapeado para teclas via `setupTouchButton()`. O trabalho pendente é de **refino**, não de criação do zero — ver análise de UI mobile.

## 3. Estado Atual da Arquitetura
- **O Fim da Blockchain DeSo:** oficialmente abandonada. Login é Web2 (Google OAuth como principal + e-mail/senha local como alternativo — ver ressalva de segurança acima).
- **O Futuro:** blockchain de propósito específico proprietária no roadmap, para saves/inventário — ainda não iniciada.
- **Cross-play:** web e mobile coexistem no mesmo servidor Socket.io. UI nova no Canvas precisa ser transposta manualmente para o mobile (pastas `js/` são isoladas).

## 4. Auditorias e correções concluídas em 18/08 — ver documentos dedicados
- **`docs/SECURITY_AUDIT.md`**: 3 achados de alta severidade, **todos corrigidos e testados no mesmo dia**:
  1. ~~Bypass de autenticação~~ — corrigido: `server/index.js` agora chama `googleClient.verifyIdToken()` de verdade em vez de confiar num payload decodificado manualmente.
  2. ~~Segredo JWT hardcoded~~ — corrigido: `server/cloud_api.js` gera um segredo aleatório em runtime se `JWT_SECRET` não estiver no ambiente (usuário ainda precisa definir um valor fixo em produção para persistir sessões entre restarts).
  3. ~~Senha em texto puro~~ — corrigido: `server/db.js` agora usa `bcryptjs`, com migração automática das contas legadas no próximo login. Bônus: corrigido também um vazamento do hash da senha para o cliente, e adicionada a dependência `sqlite3` que faltava no `package.json` (um `npm install` limpo quebraria o servidor sem ela).
- **`docs/UI_MOBILE_REVIEW.md`**: 13 problemas concretos de UI/UX mobile, priorizados (crítico/importante/desejável) — **ainda não corrigidos**, só relatados. Destaque: o botão visualmente destacado como "pulo" (`touchSlotFBtn`) na verdade ativa Ghost Mode — o pulo real ficou só no D-pad ▲, uma regressão em relação à versão web. Nenhum botão touch tem feedback visual de `:active`.

## 4a. Responsividade mobile da "vitrine" do site — feito em 18/08
Implementado (ainda **não commitado/enviado ao GitHub** — só local, aguardando revisão): `css/style.css` e `lore_reader.html` ganharam regras responsivas novas para lore, founder/team, regras & atributos, bestiário (já estava OK), vitrine de equipamentos (já estava OK) e os modais de tutorial/lore. Nada do canvas/HUD/D-pad foi tocado. Testado de verdade no navegador (375px e 768px, servidor local), não só "no olho": achei e corrigi 2 bugs reais durante o teste que não estavam no plano original —
1. Tabela de controles (`.controls-table`) não encolhia e vazava a tela em 375px **e** em 768px — corrigido com `table-layout: fixed` + `min-width: 0` na coluna (viraram regras globais, não só do breakpoint mobile).
2. Na página `lore_reader.html`, a lista de capítulos (TOC) ficava espremida a quase zero de altura dentro da barra lateral empilhada — corrigido dando altura mínima garantida com scroll próprio.

## 5. Próximos Passos Sugeridos
1. Definir `JWT_SECRET` real no `.env` de produção (ação do usuário — o código já suporta, só falta o valor).
2. Corrigir os itens críticos de `docs/UI_MOBILE_REVIEW.md` (rebind do botão de pulo é o de maior impacto/menor esforço) — ainda pendente.
3. Desenvolver a blockchain proprietária para os saves (roadmap de longo prazo).
4. Limpar o lixo de DeSo **confirmado** (ver seção 2) sem tocar no que só tem o nome parecido.
5. Decidir o que fazer com `server/workers/SaveWorker.js` (Postgres/Redis): finalizar a integração ou remover se foi abandonada.
