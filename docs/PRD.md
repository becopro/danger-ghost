# Product Requirements Document (PRD)

*Última revisão: 18 de Agosto de 2026.*

## Propósito do Produto
Proporcionar uma experiência de plataforma 2D com elementos de RPG, rápida e acessível diretamente no navegador ou via aplicativo mobile, conectando todos os jogadores no mesmo mundo em tempo real.

## Requisitos Funcionais

### 1. Sistema de Contas e Progressão
- **Login:** Google OAuth (Firebase) é o caminho principal de cadastro/login. Um caminho alternativo por e-mail/senha ("Cloud Save") existe em paralelo. Ver `ARCHITECTURE.md` §3 para os três fluxos de auth existentes e o alerta de segurança sobre senha em texto puro no fluxo alternativo.
- **Saves na Nuvem:** O progresso do jogador (Xp, Level, Atributos) deve ser salvo persistentemente no servidor, garantindo que o usuário possa jogar de qualquer dispositivo.
- **Auto-Forja (Auto-Forge) — Ghost #001 inicial:** Toda conta nova nasce com exatamente um personagem jogável, o Ghost #001 (**Polterstalk**), para que o jogador possa apertar 'Espaço' e começar a jogar sem atrito de interface.
  - **Implementação (16/09/2026):** feita no **servidor**, em `createPlayer()` (`server/db.js`), não no cliente — o banco é a fonte da verdade, então o personagem inicial é criado junto com a conta e chega ao cliente pelo mesmo caminho de um login normal. O mesmo vale para o ramo "conta criada" de `loadOrCreatePlayer()` (caminho Google OAuth, hoje dormante), para as duas formas de criar conta nascerem idênticas.
  - **Forma do personagem:** `characterId` `"ghost_001"` (formato prefixado canônico), atributos semeados a partir do `stats_base` da espécie no Ghostdex pela mesma conversão `Math.ceil(stat/10)` que `UnlockGhostForPlayer()` já usa na captura em combate — resultando em VIT 5 / AGI 5 / INT 5 / POW 4 / MAG 4 no nível 1.
  - **Ocupa 1 dos 5 slots** de fantasmas do jogador (decisão do usuário — não é um 6º slot grátis). Não exigiu código novo de limite: o teto de 5 é contado sobre a lista que vem do banco, então o ghost concedido já entra na contagem.
  - **Histórico (não reabrir sem decisão explícita):** este requisito existia, foi **removido em 21/08/2026** a pedido do próprio usuário ("o jogador forja o primeiro fantasma de propósito"), e foi **restaurado em 16/09/2026**, também a pedido dele, como reversão intencional — registrada em `docs/AAA_MASTER_PLAN_2026-09-16.md` §5. Entre essas duas datas, uma conta nova nascia com zero personagens; este documento ficou desatualizado durante todo esse período.
- **Ghostdex:** Um registro que desbloqueia e acompanha quais "Ghosts" o usuário já conheceu ou possui.

### 2. Gameplay
- **Motor Gráfico:** O motor em JavaScript Vanilla deve processar gravidade, colisões de cenário e animação de sprites a pelo menos 60 quadros por segundo em PCs modernos.
- **Fases:** O jogo deve suportar múltiplos níveis com progressão lógica. Atualmente estruturado para pelo menos 33 níveis.
- **Sistema de RPG:** Todo personagem deve ter atributos base: HP, VIT, AGI, INT, POW, MAG. O ganho de XP e passagem de nível aumentam os pontos disponíveis que podem ser alocados pelo usuário na interface do jogo.
- **Teto de nível:** 100.000.000.000 (100 bilhões) por personagem, **literal e alcançável** por gameplay real sob a curva de lei de potência definida em `docs/AAA_MASTER_PLAN_2026-09-16.md` §7 — não é um teto simbólico. Consequência de banco de dados (16/09/2026): as colunas de nível e de atributo precisam ser `BIGINT`, porque `INTEGER` estoura em ~2,15 bilhões. As faixas de validação do servidor (`NUMERIC_BOUNDS`, `server/db.js`) já foram ampliadas para acompanhar; a **migração de tipo do banco de produção está escrita mas ainda não executada** (`server/migrate_level_bigint.js`), aguardando decisão do usuário — até ela rodar, o teto real de nível gravável em produção continua sendo ~2,15 bilhões.

### 3. Multiplayer
- **Presença em Tempo Real:** Todo jogador deve ver a posição, nível (Lv. X) e nome de todos os outros jogadores logados no mesmo nível e servidor.
- **Comunicação de Baixa Latência:** Uso exclusivo de WebSockets para enviar estados em milissegundos para minimizar rubber-banding.
- **Chat Integrado:** Um chat global interligado que suporta todos os clientes ativos.

### 4. Cross-Platform
- **Mobile-first paridade:** Tudo que funciona no PC deve funcionar no Celular.
- **Empacotamento:** O aplicativo Android tem seu próprio projeto base (Capacitor), mas compartilha as regras de engine. Modificações da Web devem ser refletidas/adaptadas de forma cirúrgica na versão Android sempre que afetarem renderização ou conexão.

## Requisitos Não Funcionais (NFRs)
- **Web2 Nativo:** O jogo não utiliza blockchain de terceiros (como a DeSo). Toda a arquitetura de banco de dados deve ser gerenciada in-house. *(A criação de uma blockchain proprietária está no roadmap futuro)*.
- **Leveza de Hospedagem:** O backend e os bancos de dados (SQLite local + MySQL na "Deso Hosting", nome do provedor — ver `ARCHITECTURE.md` §4) devem consumir recursos mínimos (CPU/RAM) para viabilizar hospedagem em VPS de baixo custo gerenciada pelo PM2.
- **Segurança de credenciais (pendente):** senhas do fluxo de login local devem ser hasheadas antes de ir para produção real com muitos usuários — atualmente não são (débito técnico confirmado, ver auditoria de segurança).
