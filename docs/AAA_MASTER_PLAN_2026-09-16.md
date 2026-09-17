# Danger Ghost — Plano Mestre AAA v2 (16/09/2026)

**Este documento substitui e incorpora [`AAA_MASTER_PLAN_2026-09-15.md`](AAA_MASTER_PLAN_2026-09-15.md)**, que continua válido para o Apêndice de achados brutos por departamento e o roadmap faseado (Fase 0-3) — não repetido aqui na íntegra, só referenciado onde este documento o altera.

**Origem desta revisão:** o usuário revisou o plano de 15/09 e pediu ajustes concretos, delegados a 8 especialistas em paralelo (planejamento apenas — nenhum arquivo de jogo foi editado). Cada um foi instruído a propor, não decidir sozinho quando houvesse uma bifurcação real de design, e trazer essas bifurcações de volta como perguntas explícitas.

---

## Decisões já confirmadas pelo usuário nesta sessão

1. **Nível máximo de 100.000.000.000 (100 bilhões) por ghost é literal e deve ser alcançável de verdade** através de gameplay real — curvas exponenciais reais, não um teto simbólico. Ver seção 7.
2. **O jogo deve ficar 100% em inglês.** Ver seção 6 (lista de execução completa).
3. **Todo jogador novo começa com o Ghost #001.** Isso reverte uma decisão anterior do próprio usuário (commit de 21/08/2026, "sem Ghost #001 automático, o jogador forja o primeiro fantasma de propósito") — confirmado como reversão intencional, não erro. Ver seção 5.
4. **Purgar toda referência à blockchain DeSo** — mas preservar corretamente o plano real (já documentado em `CLAUDE.md` §2) de uma blockchain própria, de propósito específico, pós-Episódio 2, para guardar ghosts criados e saves. As duas coisas não devem ser confundidas. Ver seção 3.

---

## 1. Achados que mudam a leitura do plano de 15/09

Nenhum dos achados de 15/09 foi invalidado — mas três descobertas desta rodada dão contexto novo a itens que já estavam lá:

- O vazamento de campos do personagem pro registro da conta (Fase 0.1 do plano anterior) tem uma explicação estrutural mais profunda: `rpg_system.js` reconcilia "pontos de atributo devidos" em **quatro lugares separados** usando a fórmula `esperado = (level-1)*5`. Qualquer mudança na fórmula de pontos-por-nível (necessária pela seção 7 abaixo) precisa atualizar os quatro lugares de forma consistente, ou a lógica anti-cheat vai confiscar ou conceder pontos errados no próximo login.
- O sistema de badges (333→320, já corrigido no plano anterior) já tem uma escada de 100 tiers indo até nível 100.000.000.000 ("Entidade Máxima") — construída em 31/08-01/09, mas para um teto que na época foi desenhado como **simbólico/inalcançável de propósito**. A curva de XP nunca foi atualizada pra acompanhar. Isso significa que grande parte da infraestrutura de banco de dados pro nível 100B **já existe** — o trabalho real é a curva matemática e a migração de coluna (seção 7).
- `NUMERIC_BOUNDS.score` no servidor já está obsoleto mesmo sem nenhuma mudança desta rodada — o teto atual (2 bilhões) já é insuficiente pra fórmula de score já existente em níveis altos.

---

## 2. Achado incidental (correção ao plano de 15/09)

O especialista que investigou a pasta `danger ghost/skills/` nesta rodada leu os 12 arquivos por completo e corrigiu a contagem do audit anterior: **`impeccable.md` não tem nenhum conteúdo de DeSo** (foi classificado errado antes) e **`taste.md` tem só uma menção incidental**, não uma proposta de mecânica. São 7 arquivos com conteúdo real de DeSo pra remover, não 8. Detalhe na seção 3.

---

## 3. Purga de DeSo + roadmap da blockchain futura

### Pasta `danger ghost/skills/` (12 arquivos, distinta de `.claude/skills/`)

| Arquivo | Ação recomendada |
|---|---|
| `web3_sec.md` | Apagar inteiro — nada aproveitável |
| `onboarding_tutorial.md` | Apagar só as seções de wallet-connect DeSo (§2.3, §4); salvar o resto (arquitetura de tutorial por zona-gatilho) |
| `lore_mastery.md` | Apagar §5 (NFTs) e trechos de "NFT na DeSo" em §1/§3; **salvar §2 e §4 — lore real de Cactus, Crow e do segredo do Nível 26 que não existe em nenhum outro lugar do jogo** |
| `taste.md` | Editar 1 linha (trocar "adequado ao DeSo" por "do HUD") — resto fica |
| `impeccable.md` | Nenhuma ação — não tem DeSo |
| `qa_automation.md` | Apagar mocks de DeSo; encaminhar a seção de sanitização XSS (`Sanitizer`/`escapeHTML`) pra `security-engineer` conferir se já existe equivalente no código real |
| `clean_arch.md` | Reescrever `Web3SaveAdapter`/`DeSoBlockchain.ts` pra `ProprietaryChainAdapter` (nome da blockchain futura, pós-Episódio 2) |
| `playwright.md` | Editar 1 linha (mock de auth real em vez de DeSo Identity) |
| `physics_dt.md`, `opt_blueprints.md`, `ui_ux_pro_max.md`, `huashu_design.md` | Nenhuma ação — confirmado sem DeSo |

*Nota lateral: `danger ghost/www/skills/` tem cópias dos mesmos 7 arquivos problemáticos — mas `www/` já é pasta morta documentada (CLAUDE.md §3), então isso é irrelevante pro site real, só não confundir limpeza de uma com a outra.*

### Founder Bio (`index.html`, precisa do seu aval — é texto pessoal)

Rascunho proposto:
> "He joined Web3 in 2020 and has built several NFT projects — including an early experiment called DeSoGhost on the DeSo blockchain, which is no longer active. He is currently developing Danger Ghost, a Web2 multiplayer RPG. Once Episode 2 ships, the plan is to build a new, purpose-built blockchain — not a revival of DeSo — to store created ghosts and save data."

Duas perguntas abertas nisso: manter o botão de link pro perfil pessoal DeSo do fundador (é a identidade dele, separado do que o jogo é hoje)? E o texto de Klara Kopi ("Web3 builder... metaverse creatress") pode ficar quase como está, já que se refere ao projeto Hyperfy real e separado — só trocar "Ghost Games gaming ecosystem" por "Ghost Games team".

### Texto de tutorial (`engine.js`, `RunTutorialSaveSimulation`)

Trocar a simulação de "Transmitting data to DeSo Blockchain node... SYNCHRONIZED ON BLOCKCHAIN PERMANENTLY" por uma versão honesta do save local real (rascunho completo no relatório do especialista). Não precisa de aval especial, é texto funcional.

### Parágrafo de roadmap futuro (pra incluir na documentação do projeto)

> "Após o lançamento do Episódio 2, o roadmap prevê a construção de uma blockchain proprietária, de propósito específico — não uma reativação da DeSo — para armazenar de forma descentralizada os fantasmas criados pelos jogadores e os dados de progresso/inventário. O trabalho ainda não foi iniciado; até lá, o Postgres via Supabase continua como banco de dados único do jogo."

### Código morto adicional confirmado (sem necessidade de aval)

`CreateDeSoNFTForRPG()`/`ExecuteDeSoRPGSaveWithImage()` (stubs mock, não chamados por nenhum botão real), o bloco de restauração de sessão `dg_deso_public_key`/`#desoBtn` (botão não existe no HTML real), `CheckVIPStatus()` override morto, 5 globais não-lidos no bloco "DESO WEB3 INTEGRATION", e `js/web3/` (pasta vazia).

### Roadmap da blockchain futura — o que fica preservado

Após o lançamento do Episódio 2, o roadmap prevê a construção de uma blockchain proprietária, de propósito específico — não uma reativação da DeSo — para armazenar de forma descentralizada os fantasmas criados pelos jogadores e os dados de progresso/inventário. O trabalho ainda não foi iniciado; até lá, o Postgres via Supabase continua como banco de dados único do jogo.

Esta é a **única** menção a blockchain que sobrevive à purga, e ela fala de um sistema futuro e diferente. Nada no código, na UI ou na documentação deve sugerir que a DeSo volta, nem que o save de hoje é descentralizado — ele é local (`localStorage`) e, quando sincronizado, vai pro Supabase. Ver também `CLAUDE.md` §2.

---

## 4. Ghostdex — reconciliação dos dois painéis de atributos

**Confirmado: o problema é real, e pior do que parecia.** Existe uma ponte pela metade já no código (`getGhostBaseStats()` em `rpg_system.js`) que converte os stats base da espécie em atributos iniciais — mas só dispara uma vez, no nível 1, e o stat de Defesa (DEF) é descartado sem virar nada. Depois do nível 1, o crescimento é idêntico pra qualquer espécie (5 pontos livres por nível), então a identidade da espécie desaparece rápido. Além disso, `SpawnEpisode1Ghost()` (o spawner de boss pra capturar espécies do Ghostdex) **não lê os stats base de espécie nenhuma** — todo boss da mesma fase tem o mesmo HP, virando puro reskin visual.

**Recomendação do especialista (Opção A — completar a integração já começada):** manter a semente do nível 1 como está, e adicionar uma taxa de crescimento passivo por nível, proporcional ao stat base da espécie, empilhada em cima dos pontos que o jogador aloca — o híbrido "Pokémon base stats + Diablo point-buy". Fórmula sugerida no relatório completo. Também corrigir `SpawnEpisode1Ghost` pra ler `stats_base.total` da espécie e escalar o HP do boss proporcionalmente.

**Perguntas abertas:**
- **DEF continua sem função** — vira um mecanismo real de redução de dano (trabalho de balanceamento novo) ou fica documentado como "só decorativo tipo altura/peso de Pokédex"?
- **Migração retroativa** — personagens já criados tiveram seu crescimento calculado pela regra antiga (linear, sem bônus de espécie). Recalcular todo mundo agora (pode buffar ou nerfar silenciosamente quem já jogou) ou só aplicar a partir de agora (duas curvas coexistindo por um tempo)? Isso precisa de `backend-architect` antes de qualquer implementação, porque mexe na forma do `save_game_state`.

---

## 5. Sistema de resistência e fraqueza elemental + Ghost #001 + barras de vida/mana

### Resistência/fraqueza

**Achado central: `categoria`/`tipos` do Ghostdex são puramente estéticos** (9 categorias temáticas tipo "Urban Haunt", 14 "tipos" tipo "Neon"/"Scrap"/"Crystal") — não existe uma tabela elemental por trás disso, e forçar uma mistura ruim (por que um ghost "Neon" seria fraco contra Fogo?).

**Proposta:** criar um campo novo, `elemento`, reaproveitando os 5 elementos que as runas já usam (fire/ice/lightning/poison/arcane) — sem inventar vocabulário novo. Roda fechada de vantagens (Fogo→Gelo→Raio→Veneno→Fogo), Arcano fica sempre neutro (consistente com o próprio design já existente de "magia pura, sem status"). Isso também corrige, na mesma proposta, o bug já rastreado de Fogo e Veneno serem cosméticos — e um achado novo: **no boss do Episódio 1 (captura de espécies), as 5 runas são inertes, não só Fogo/Veneno.** O tutorial promete efeitos (queimadura, -30% defesa) que não existem em lugar nenhum do código — isso é uma promessa falsa ativa pro jogador, não só um buraco de sistema.

**Perguntas abertas:**
- `elemento` substitui `categoria`, ou fica um campo novo ao lado? (recomendação: campo novo, `categoria` continua servindo de flavor text)
- "Boss" no seu pedido significa só os 5 bosses fixos das dungeons (crow/skull/cactus/demon_fly/slime), as 101 espécies do Ghostdex, ou os dois? Muda o tamanho do trabalho de autoria (101 linhas de planilha vs. 5).
- Roda fechada (recomendada, mais profundidade estratégica) ou pares opostos simples (mais fácil de explicar em uma linha de tooltip)?
- A promessa de "-30% de defesa" do veneno: implementar de verdade ou tirar do texto do tutorial?

### Ghost #001 como starter

Confirmado: hoje uma conta nova começa com **zero personagens** — o jogador tem que forjar o primeiro manualmente (decisão de 21/08, a pedido seu na época). Ghost #001 é **Polterstalk**, o 3º mais fraco dos 101 (apropriado pra starter), com arte completa já pronta. Existe um mecanismo já testado (`UnlockGhostForPlayer()`) que dá pra reaproveitar pra isso.

**Pergunta aberta:** um Ghost #001 concedido automaticamente conta como um dos 5 slots do limite de ghosts, ou é um 6º slot de graça? E confirmar que quer reverter formalmente a decisão de 21/08 (os documentos `docs/PRD.md`/`docs/HANDOVER.md` ainda descrevem o auto-Ghost#001 antigo — atualizar junto).

### Barras de vida e mana escalando com atributos

- **Mana já funciona exatamente como você descreveu** — só que com **MAG**, não INT (`maxMana = 100 + mag*20`, recalculado a cada frame, barra já é dinâmica). Recomendação: manter em MAG (já funciona), só ajustar o texto/tooltip se a expectativa era INT.
- **VIDA está quebrada** — a barra "VITALITY" está travada em `3`, hardcoded, nunca lê VIT. Existe até um comentário no código explicando a decisão consciente de não usar VIT ali, pra não "comprar dois bônus com o mesmo ponto" (VIT já aumenta o teto de vidas extras separadamente). Correção proposta: nova função `getMaxVitality() = 3 + vit`, recalculada a cada frame igual à mana.

**Pergunta aberta:** aceitar que VIT agora compra dois bônus ao mesmo tempo (barra de vida maior + mais vidas extras), ou mover um dos dois efeitos pra outro atributo pra não duplicar?

---

## 6. Tradução completa para inglês — lista de execução

Auditoria completa (não só o resumo do plano anterior) encontrou uma superfície maior: o **Enciclopédia de Lore inteira** (index.html, ~30 blocos de texto), o **modal do baú/Egregora** em `ui_manager.js` (~20 strings), **6 erros lançados em português no `server/db.js`** que vazam pro jogador via `error.message`, e um **bug funcional**: o leitor de texto (TTS) da lore está travado em `pt-BR` — vai ler o texto novo em inglês com sotaque errado se não mudar junto.

**Achado bom, trabalho de graça:** 4 lugares onde o texto em inglês certo **já existe em outro arquivo do próprio jogo** — só copiar, não traduzir:
- `RESGATAR PROGRESSO`/`CRIAR CONTA NOVA` → o mobile já diz "Restore Progress"/"Create New Account" na tela de gate
- `Fechar [X]` → já existe "Close [X]" com a mesma classe CSS em dois outros modais
- `CANCELAR` → já existe "CANCEL" em dois lugares
- O diálogo de descarte do baú → já existe a frase exata em inglês no diálogo de descarte da mochila

**Duas correções técnicas escondidas na tradução:**
- `server/index.js:394-400` tem DUAS constantes de rate-limit paralelas (uma PT, uma EN) — só 3 dos 8 pontos de uso ainda apontam pra versão em português. Trocar os 3 e apagar a constante PT é 100% de graça, zero tradução nova.
- `formatEgregoraTimestamp()` usa `toLocaleString('pt-BR', ...)` — precisa virar `'en-US'`.

**Fora de escopo, recomendado explicitamente:** os nomes de campo do JSON do Ghostdex (`nome`, `categoria`, `tipos` etc.) — são internos, nenhum jogador vê, e mudar toca pelo menos 13 pontos de leitura/escrita em duas cópias (web+mobile) pra zero ganho visível. Deixar pra um refactor separado se algum dia importar.

*Tabela completa linha-por-linha (arquivo:linha, texto atual, tradução proposta) está no relatório original do especialista — pronta pra qualquer agente executar diretamente, sem precisar rederivar nada.*

---

## 7. Nível máximo 100.000.000.000 — redesenho matemático completo

### Contexto crítico

Esse sistema já foi mexido uma vez (31/08–01/09/2026) — mas com a intenção explícita de ser **simbólico, praticamente inalcançável por gameplay legítimo** (comentário no próprio código confirma isso). Sua decisão nesta sessão inverte essa intenção: agora precisa ser alcançável de verdade. A infraestrutura de banco de dados (limites, badges) já foi preparada pra esse número na época — só a curva matemática de XP nunca foi atualizada, e continua pequena demais (exigiria ~10^19 XP num único level-up perto do teto — inatingível).

### A curva proposta

Em vez de exponencial ingênua (`base^level`, que estoura o limite numérico do JavaScript muito antes de chegar em 100 bilhões), a proposta usa **lei de potência** (`nível^expoente`) — mesma família de fórmula que já existe no jogo hoje, só re-calibrada:

- **XP necessário**: `100 * nível^1.45`
- **HP de inimigo**: `hp_base * nível^1.90 * fator_de_fase` (o fator de fase das 32 episódios atuais fica bem mais suave que hoje, já que o expoente do nível assume a maior parte do trabalho de escala; níveis 33 e CAVE1 continuam com seus valores fixos especiais, sem mudança)
- **Dano de arma**: `10 * nível^1.85 * 1.12^tier_de_upgrade` (ligeiramente abaixo do expoente de HP — nível sozinho quase alcança, mas equipamento/build continuam importando, como em qualquer ARPG de verdade)
- **Score por level-up**: `200 * nível^0.5` (desacoplado do resto — moeda não precisa acompanhar poder de combate 1:1)

**Simulado (não estimado de cabeça) — pontos de referência:**

| Nível | Kills acumulados pra chegar lá | Tempo aproximado |
|---|---|---|
| 33 (final atual) | ~53 | menos de 1 hora |
| 10.000 | ~1.400 | um fim de semana |
| 1.000.000 | ~18.000 | um mês dedicado |
| 100.000.000.000 | **~10 milhões** | **anos, pra quem for hardcore** |

O número de ~10 milhões de kills no teto bate, sem ter sido forçado, com o topo da escada de badges de kills que já existe no jogo (10.000.000 kills) — sinal de que a curva está coerente com o resto do sistema, não um número solto.

### Bloqueador técnico real — precisa de confirmação e planejamento antes de qualquer código

**A coluna de nível no Postgres é `INTEGER`, que estoura em ~2,15 bilhões — 47x menor que o teto de 100 bilhões.** Qualquer personagem que passe desse ponto (alcançável de verdade sob a nova curva, não só teórico) vai falhar ao salvar ou ter o valor corrompido silenciosamente. **Isso é uma migração de schema obrigatória** (`level` → `BIGINT` em `players` e `characters`, idem `points_to_distribute`), não só uma mudança de fórmula no cliente. Por tocar diretamente o banco de save de jogadores reais, isso precisa de `backend-architect` e do seu alinhamento explícito antes de qualquer execução (regra já existente no CLAUDE.md §7 do projeto).

Confirmado sem problema: `xp`/`score` já são `DOUBLE PRECISION` no banco, cabem nos novos números sem mudança de tipo. `worldLevel` (contador de episódio, 1-33) é uma coisa **diferente** do nível do personagem — não precisa mudar, seu teto atual (999) já é muito maior que os episódios reais que existem.

### Perguntas abertas

1. **Mecânica de prestígio/reset ao final** — a matemática não exige isso pra tornar o nível alcançável (a lei de potência já resolve sozinha), mas é comum em jogos desse estilo dar um "e agora?" depois de um platô. Quer um sistema de prestígio, ou progressão puramente aditiva pra sempre?
2. **Pontos de atributo por level-up** — hoje é fixo em 5. Pra acompanhar a nova escala precisa virar uma fórmula, mas isso também é uma pergunta de UI (como alocar potencialmente bilhões de pontos de uma vez?), não só de balanceamento.
3. **Constantes exatas do fator de fase** (episódios 1-32) — item de playtesting, não decisão de arquitetura.

### Formatação de números na UI

Não existe sistema de abreviação hoje (tudo usa `toLocaleString()`, número por extenso). Proposta: sufixos padrão (1K/1M/1B/1T/1Qa/1Qi), aplicado em HP de inimigo (hoje só tem barra, sem número — precisa virar elemento novo de UI), contador de nível, XP, score e custo de upgrade de arma. Descrição de badge fica de fora (números por extenso lá são parte do impacto do texto, e são exibidos raramente).

---

## 8. Atributos e equipamento — coerência AAA

**O que já funciona bem (não vou inventar problema aqui):** raridade já escala poder de verdade (mais atributos, valores maiores, Common→Rare→Epic), requisitos mínimos de stat pra equipar já funcionam, anéis já desbloqueiam feitiços reais.

**Achados novos de incoerência:**
- **AGI tem teto matemático** (~10 pontos) enquanto os outros 4 atributos escalam sem limite — funcionalmente morto depois de 2 level-ups.
- **Não existe sistema de defesa/mitigação de dano.** Peito, offhand e amuleto — 3 dos 7 slots — não têm nenhum efeito mecânico fixo. `takeDamage()` é subtração bruta, sem nenhuma redução.
- **Existe um sistema de prefixos/sufixos de item inteiro já escrito** (`PREFIX_POOL`/`SUFFIX_POOL` — dano de fogo/gelo, velocidade de ataque, roubo de vida, etc.) **mas nunca referenciado em lugar nenhum do código.** Itemização morta na fábrica.
- `specialEffect` de itens Epic/Rare é só texto decorativo ("Epic Power of Nowhere!") — nunca checado em nenhuma condição de gameplay.
- **Dois sistemas de "arma" desconectados**: o dano real de projétil vem de uma arma comprada com score (`state.weapon`), não do item equipado no slot mainhand — um jogador pode lootar uma espada rara achando que melhorou o dano e não melhorou nada.
- **Anéis são amarrados à posição do slot, não ao item** — qualquer anel (comum ou épico) no slot 1 sempre lança o mesmo feitiço Ice com o mesmo dano-base; a raridade do anel só importa pelos atributos genéricos que ele carrega.
- Só 3 tiers de raridade (Common/Rare/Epic), sem Legendary/Unique/Set.

**Correções pontuais recomendadas (baixo risco):** mostrar os atributos reais do item equipado na tela de equipamento (hoje mostra Dmg/Def decorativos, a Bag já mostra certo, é só igualar); conectar ou remover a função órfã de duração de Ghost Mode; resolver o teto de AGI (remover ou dar um segundo efeito pós-teto).

**Perguntas abertas (decisões de escopo maior, não corrijo sozinho):**
- Construir sistema de defesa/mitigação do zero? (muda a curva de dificuldade dos 32 níveis inteiros — merece sessão própria de balanceamento)
- Reativar `PREFIX_POOL`/`SUFFIX_POOL`? (implica decidir se dano elemental, velocidade de ataque variável e chance de acerto vão existir de verdade no combate)
- Adicionar tiers acima de Epic (Legendary/Unique/Set), já que você citou Diablo 3 como referência?
- Dar identidade mecânica distinta por slot (ex: peito = defesa pura, amuleto = utilidade)?

---

## 9. UI estilo Diablo 3 — spec de redesenho pra Bag/Spell/Equip/Status

**Bloqueador estrutural encontrado primeiro:** o painel hoje é travado em **300×300px** (`!important` no CSS) — pequeno demais pra qualquer coisa parecida com Diablo 3. Duas opções: (a) criar uma variante maior da classe compartilhada de painel, tocando outros painéis que usam a mesma classe (chat, controles, Ghostdex), ou (b) reaproveitar o padrão de modal do baú (`OpenChestModal`, já resolve o problema de tela cheia neste mesmo projeto). **Recomendação: opção B**, é reaproveitar algo que já funciona aqui, não inventar de novo.

**Convenções do Diablo 3 propostas pra adaptar (com a identidade neon do jogo, não um reskin literal):**
- Cor de raridade na **borda do ícone com brilho**, não só no texto do nome — visível à distância, não só ao clicar
- **Tooltip ao passar o mouse** (não só ao clicar) mostrando comparação de stats contra o que já está equipado (+3 POW verde / -1 VIT vermelho)
- **Layout de "boneco de papel"** pro equipamento — silhueta do personagem com os 7 slots posicionados ao redor, em vez da lista vertical atual de texto
- **Ícones de feitiço clicáveis** em vez dos dropdowns nativos de HTML que existem hoje
- Interação de equipar em duas direções: clicar num slot vazio deveria abrir a Bag filtrada, hoje só dá pra equipar a partir da Bag

**Achado técnico direto (resolve outro item do plano anterior):** os 11 ícones de equip/feitiço mal-rotulados como PNG (são JPEG de verdade, 1024px) precisam virar WebP com transparência, 256px — não só "menor", porque o brilho de raridade atrás do ícone precisa de fundo transparente pra funcionar. **Os 333 badges têm exatamente o mesmo problema de origem** — vale um único script de conversão pros dois casos, não dois consertos separados.

**Perguntas abertas:**
- Tier Legendary é escopo novo pra esta rodada, ou o redesenho visual sai só com os 3 tiers já existentes?
- Confirma a opção B (modal tipo baú) pro tamanho do painel?
- Clicar no slot de equipamento pra equipar direto é pra entrar já nesta rodada, ou fica pra depois (é mudança de interação/dado, não só visual)?
- Arte nova de silhueta do personagem pro boneco de papel — um contorno simples flat é aceitável, ou precisa de algo mais elaborado?

---

## 10. Consolidação — todas as perguntas abertas num só lugar

Pra facilitar sua revisão, aqui está a lista completa. Onde um especialista deu uma recomendação clara, ela já está marcada como padrão — você só precisa responder onde quiser um caminho diferente.

| # | Pergunta | Recomendação do especialista |
|---|---|---|
| 1 | Manter o link pro perfil DeSo pessoal do fundador? | Manter (é identidade pessoal, separado do que o jogo é) |
| 2 | Salvar a lore de Cactus/Crow/Nível 26 do `lore_mastery.md` agora ou depois? | Salvar como tarefa separada de conteúdo |
| 3 | DEF do Ghostdex vira mecânica real ou fica só decorativo? | Sem recomendação — decisão de escopo |
| 4 | Recalcular retroativamente os personagens já criados na nova fórmula de stats de espécie? | Sem recomendação — decisão de produto |
| 5 | Campo `elemento` substitui `categoria` ou fica ao lado? | Fica ao lado (campo novo) |
| 6 | Sistema elemental cobre só os 5 bosses fixos, as 101 espécies, ou os dois? | Sem recomendação — muda o tamanho do trabalho |
| 7 | Roda fechada de elementos ou pares opostos simples? | Roda fechada (mais profundidade) |
| 8 | Efeito de -30% defesa do veneno: implementar ou tirar do tutorial? | Sem recomendação |
| 9 | Ghost #001 automático conta como 1 dos 5 slots ou é slot extra? | Sem recomendação |
| 10 | VIT comprando dois bônus (vida + vidas extras) tudo bem, ou separar? | Sem recomendação — decisão de balance |
| 11 | Sistema de defesa/mitigação de dano do zero? | Sem recomendação — grande escopo |
| 12 | Reativar sistema de prefixos/sufixos de item (dano elemental, attack speed, life leech)? | Sem recomendação — grande escopo |
| 13 | Tiers acima de Epic (Legendary/Unique/Set)? | Sem recomendação — ligado à referência Diablo 3 que você deu |
| 14 | Identidade mecânica distinta por slot de equipamento? | Sem recomendação — grande escopo |
| 15 | Mecânica de prestígio/reset no nível máximo? | Sem recomendação — não é obrigatório matematicamente |
| 16 | Fórmula de pontos de atributo por nível (hoje fixo em 5)? | Precisa virar fórmula, exata não definida |
| 17 | Tier Legendary junto com o redesenho de UI desta rodada? | Sem recomendação |
| 18 | Painel de inventário vira modal (padrão do baú) ou cresce a classe compartilhada? | Modal tipo baú (reaproveita algo que já funciona) |
| 19 | Clicar no slot de equipamento pra equipar direto — nesta rodada ou depois? | Sem recomendação |
| 20 | Arte de silhueta simples pro boneco de papel é suficiente? | Sim, contorno flat simples |

---

## Próximo passo

Este documento é só o plano revisado — nada foi implementado. Quando você confirmar as decisões da seção 10 (pode responder só as que quiser mudar do padrão recomendado), o próximo passo natural é priorizar essas mudanças dentro do roadmap faseado já existente (Fase 0-3 do documento de 15/09) e delegar a implementação real aos especialistas certos.
