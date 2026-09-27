# 12 — XP DOS INIMIGOS E CALIBRAÇÃO COM O NÍVEL VINDO DO XP

Agente: `progression-actuary` · Data: 2026-09-21 · Modo: **PLANO** (nada do jogo foi alterado)
Pedido do dono (Parte 1, verbatim): *"Subir de nível deve sempre vir pelo XP, faça o cálculo de quanto XP os inimigos dão!"* → requisito **R13** do `chain/00_BRIEF_BLOCKCHAIN.md`.
Este relatório **revisa a decisão A4** do plano mestre v1 ("nível = função do tempo creditado pelo servidor").

Scripts que produziram cada número (no *scratchpad* da sessão, fora do repo):
`12a_censo_xp.js`, `12b_ritmo_e_redesenho.js`, `12c_saturacao_arquetipos.js`.

Marcações: **[VERIFICADO]** = li no código e cito arquivo:linha · **[CÁLCULO]** = rodei em Node · **[HIPÓTESE]** = suposição sobre comportamento humano, declarada como tal.

**Glossário rápido** (o dono está aprendendo; cada termo aparece explicado na primeira vez):
- **XP** = pontos de experiência. **Escada de XP** = quanto custa cada nível. **Soma acumulada** = somar todos os degraus da escada de 1 até L (é isso que define "quanto XP até o nível L", porque o jogo *consome* o XP a cada subida).
- **Orçamento diário de XP** = um teto de quanto XP a conta pode ganhar por dia, aplicado pelo servidor.
- **float64** = o tipo de número do JavaScript; é exato só até 9.007.199.254.740.991 (≈9,007e15), acima disso ele arredonda em silêncio.

---

## (a) RESUMO EM 10 LINHAS

1. Só existem **duas** fontes de XP no jogo inteiro, ambas por kill, ambas **100% no cliente**: `engine.js:1105` (`c_Boss`) e `engine.js:3311` (`EnemyBoss`). Não há XP de baú, quest, badge ou episódio. O servidor **nunca concede XP** — só valida e guarda **[VERIFICADO]**.
2. A fórmula é a mesma nas duas: `XP = floor(maxHp × 5)`.
3. Para `c_Boss`: `maxHp = floor(baseHp × L^1,90 × multFase)`, com `L` = **nível do jogador** e `baseHp` = 4 (crow/demon_fly/slime), 9 (cactus), 33 (skull) **[VERIFICADO: `engine.js:996-998`]**.
4. **O achado que muda tudo:** `multFase` **não é 1 a 2,55**. Ela vale **666 na fase 33** e **500 na CAVE1** **[VERIFICADO: `engine.js:969-978`]**. O relatório `raw/02` §1.1 leu só o ramo suave e por isso subestimou o problema.
5. Consequência: um jogador que farma a fase 33 chega ao nível 1e11 em **~77 horas de jogo (0,2 ano a 1 h/dia)**, e na CAVE1 em **~41 horas [CÁLCULO]**. Não são 11 a 1.396 anos — são **0,1 ano a 1.396 anos**, dispersão de **~12.375×**, não de 126×.
6. A segunda fonte (`EnemyBoss`, o fantasma de captura da Ghostdex) dá XP **constante em L** (`1000 × 1,15^fase × fator_espécie × 5`) — some de importância já no nível ~100 **[VERIFICADO: `engine.js:3239`]**.
7. **Sim, dá para o nível vir sempre do XP e ainda assim fechar em 3147** — e provei: definindo o **orçamento cumulativo** `XP*(H) = C(L*(H))`, o nível `L = C⁻¹(XP)` fecha em **1e11 exato**, é monotônico nos 409.538 passos e o round-trip não erra **nenhum nível** **[CÁLCULO]**.
8. A forma fechada que já está em produção (`cumulativeXpToLevel`/`levelFromCumulativeXp`) **aguenta 3,64e28** de XP: o erro de float64 no topo vale 8,1e12 XP, e um nível no topo vale 8,9e17 XP — **perda de nível = zero** **[CÁLCULO]**.
9. **Mas** o teto de validação do servidor é `xp: [0, 1e19]` e 3,64e28 passa dele: se o XP acumulado for gravado, o campo é **apagado em silêncio** e o `COALESCE` preserva o valor antigo — o jogador congela sem mensagem de erro **[VERIFICADO: `db.js:468, 425-429`]**.
10. Recomendo o **Desenho C (híbrido)**: XP dos inimigos é o mecanismo real e visível, tabelado **por Era e pelo servidor**, com orçamento diário; o **tempo creditado é o piso e o teto**, não a fonte do número. Isso atende o pedido do dono sem perder a régua nem a defesa contra cliente adulterado.

---

## (b) ANÁLISE E PROPOSTA

### §1 — CENSO DE XP: TODAS AS FONTES, VERIFICADAS NO CÓDIGO

#### 1.0 Onde procurei (e o que descartei)

Varri `js/game/*`, `js/web2/*`, `js/ui/*`, `rpg_system.js` e `server/*` por `addXp`, `addXP`, `gainXp`, `xpReward`, `\bxp\b`, `experience`, `affix`.

**Resultado: há exatamente 2 chamadas de `addXp()` no jogo ao vivo**, mais uma de recuperação de save. Nada mais concede XP.

| Local | É código vivo? | Por quê |
|---|---|---|
| `js/game/engine.js:1104-1105` | **SIM** | carregado por `index.html` (`js/game/engine.js?v=84`) **[VERIFICADO]** |
| `js/game/engine.js:3311` | **SIM** | idem |
| `patch.js:92-93` (`addXp(stats.xp − atual)`) | **NÃO** | não aparece em nenhum `<script src>` de `index.html` **[VERIFICADO]** |
| `apply_ghostdex_architecture.js:62` (`inv[id].xp += ...`) | **NÃO** | script de migração one-shot; e é XP **do verbete da Ghostdex**, não do personagem |
| `danger ghost/www/js/...` | **NÃO** | cópia morta (CLAUDE.md §3) |
| `tests/rpg-drops.spec.js:312` | teste | não é jogo |
| `server/*` | **não concede** | grep por `xp` em `server/`: só `DOUBLE PRECISION`, `NUMERIC_BOUNDS`, `COALESCE`, `SELECT`. **Nenhuma linha que some XP** **[VERIFICADO]** |

> **Fato central de segurança, confirmado:** hoje **todo o XP e todo o nível nascem no navegador do jogador**. O servidor é um arquivo, não um juiz. O evento `kill_boss` do servidor apenas retransmite para os outros jogadores.

**Paridade mobile [VERIFICADO]:** `danger_ghost_mobile/www/js/game/engine.js:960, 1067, 3180, 3252` e `www/js/game/rpg_system.js:7, 476, 533` trazem **exatamente as mesmas fórmulas**. Qualquer mudança de XP é mudança nas duas plataformas.

#### 1.1 Fonte 1 — `c_Boss` (crow, demon_fly, slime, cactus, skull)

```
this.level  = GhostRPG.getStats().level          // engine.js:987  -> NÍVEL DO JOGADOR
baseHp      = 9 se cactus, 33 se skull, senão 4  // engine.js:996
phaseMult   = getPhaseMultiplier(g_currentLevel) // engine.js:997
this.maxHp  = max(1, floor(baseHp * this.level^1.90 * phaseMult))   // engine.js:998
...
GhostRPG.addXp( floor(this.maxHp * 5) )          // engine.js:1105 (na morte)
```

`getPhaseMultiplier` **[VERIFICADO: `engine.js:969-978`]**:

| Fase | Multiplicador |
|---|---|
| `"cave1"` | **500** |
| 33 | **666** |
| 1 a 32 | `1 + (fase−1)×0,05` → 1,00 … 2,55 |
| qualquer outra | 1 |

**Onde cada tipo aparece [VERIFICADO: `engine.js:544, 728-743, 1818-1840, 330-351`]:**

| Tipo | Onde nasce | Fase em que vive |
|---|---|---|
| crow | chefe das fases 4, 16, 20 **e** a cada 4 diamantes azuis em qualquer fase | 1–32 (e 33/cave1 se o jogador estiver lá) |
| demon_fly | chefe das fases 5, 10, 17, 21 **e** a cada 3 diamantes azuis | idem |
| slime | chefe das fases 6, 11, 18, 22 **e** a cada 3.000 de score | idem |
| **cactus** | **só** o chefe da **fase 33** | fase 33 → `multFase = 666` |
| **skull** | **só** o chefe da **CAVE1** | cave1 → `multFase = 500` |

> **Correção importante ao `raw/02` §1.1 e §1.3.** Aquele relatório tratou `baseHp` e fase como independentes ("cactus, fase 1,50", "skull, fase 2,55"). **Não são:** cactus só existe onde a fase multiplica por 666 e skull só onde multiplica por 500. E, pior, o multiplicador da fase vale para **qualquer** inimigo ali — um crow comum morto na fase 33 rende ×666. O cenário "otimista" real é muito mais extremo do que o publicado.

**Tabela de XP por kill [CÁLCULO: `12a_censo_xp.js`]** — `XP = floor(maxHp × 5)`:

| Fonte (tipo · fase) | multFase | L=1 | L=10 | L=100 | L=1e3 | L=1e6 | L=1e9 | L=1e11 |
|---|---|---|---|---|---|---|---|---|
| crow/demon_fly · fase 1 | 1,00 | 20 | 1.585 | 126.190 | 1,00e7 | 5,02e12 | 2,52e18 | **1,59e22** |
| crow · fase 4 | 1,15 | 20 | 1.825 | 145.120 | 1,15e7 | 5,78e12 | 2,90e18 | 1,83e22 |
| demon_fly · fase 5 | 1,20 | 20 | 1.905 | 151.425 | 1,20e7 | 6,03e12 | 3,02e18 | 1,91e22 |
| slime · fase 6 | 1,25 | 25 | 1.985 | 157.735 | 1,25e7 | 6,28e12 | 3,15e18 | 1,99e22 |
| qualquer comum · fase 32 | 2,55 | 50 | 4.050 | 321.785 | 2,56e7 | 1,28e13 | 6,42e18 | 4,05e22 |
| **cactus · fase 33** | **666** | **29.970** | 2,38e6 | 1,89e8 | 1,50e10 | 7,53e15 | 3,77e21 | **2,38e25** |
| **skull · CAVE1** | **500** | **82.500** | 6,55e6 | 5,21e8 | 4,14e10 | 2,07e16 | 1,04e22 | **6,55e25** |

**Níveis ganhos por kill** = `0,05 × baseHp × multFase × L^0,45` **[CÁLCULO]**. O expoente **+0,45** é o coração do problema: **cada kill vale mais níveis conforme o jogador sobe** — a renda cresce mais rápido que o custo.

| Fonte | L=1 | L=100 | L=1e6 | L=1e11 |
|---|---|---|---|---|
| crow · fase 1 | 0,20 | 1,59 | 100 | 1,78e4 |
| **cactus · fase 33** | **300** | 2.380 | 1,50e5 | 2,67e7 |
| **skull · CAVE1** | **825** | 6.550 | 4,13e5 | 7,35e7 |

Leia a última linha: **uma única kill de skull na CAVE1 sobe 825 níveis já no nível 1.**

#### 1.2 Fonte 2 — `EnemyBoss` (fantasma de captura da Ghostdex)

```
boss.maxHp = floor(100 * 10 * 1.15^fase * speciesFactor)   // engine.js:3239
speciesFactor = stats_base.total / 390                     // engine.js:3234-3237
GhostRPG.addXp( floor(this.maxHp * 5) )                    // engine.js:3311
```

**Não depende do nível do jogador.** `stats_base.total` vai de **250 a 605** (média 390,4; n=101) **[VERIFICADO: `js/game/ghostdex_data.js`]**.

| Fase | XP mín (total 250) | XP mediano (390) | XP máx (605) |
|---|---|---|---|
| 1 | 3.685 | 5.750 | 8.915 |
| 10 | 12.965 | 20.225 | 31.375 |
| 20 | 52.455 | 81.830 | 126.945 |
| 32 | 280.655 | 437.825 | 679.190 |
| 33 | 322.755 | **503.495** | 781.065 |

**Consequência de desenho:** como é constante em L e a fonte 1 cresce com `L^1,90`, a captura de fantasma vira **irrelevante para XP** a partir do nível ~100–1.000. Um dos sistemas mais bonitos do jogo (a Ghostdex) **não participa da progressão** depois da primeira hora. Isso é uma oportunidade, não só um defeito — ver §3.

#### 1.3 Fontes que **NÃO** existem hoje [VERIFICADO]

| Candidato | Existe? |
|---|---|
| XP de baú / `chest_items` | **não** |
| XP de quest / missão | **não há sistema de quest** |
| XP de badge (333 badges) | **não** — badges só desbloqueiam, não concedem XP |
| XP por concluir episódio/fase | **não** — concluir fase dá **score** (`AddScore`), não XP |
| XP por item/afixo (**bônus de XP**) | **não existe** — os afixos são `fireDamageBonus`, `coldDamageBonus`, `defenseBonus`, `accuracyRating`, `attackSpeedBonus`, `manaRecoveryBonus`, `lifeLeechPercent`, `vitalityBonus` **[VERIFICADO: `rpg_system.js:117-129`]** |
| XP por elemento / runa | **não** — o elemento multiplica **dano**, não XP |
| XP por ghost secundário | não há regra distinta: o XP vai para o personagem ativo |

> **Isso é uma boa notícia:** a superfície é pequena. Mudar o XP do jogo hoje é mudar **duas linhas de concessão** e uma tabela — não um sistema espalhado.

#### 1.4 O que é decidido pelo cliente e o que é decidido pelo servidor, **hoje**

| Decisão | Quem decide hoje |
|---|---|
| Quanto HP o inimigo tem | **cliente** (`engine.js:998`) |
| Quanto XP a kill dá | **cliente** (`engine.js:1105`, `:3311`) |
| Se a kill aconteceu | **cliente** (`this.lives <= 0`) |
| Quantos níveis o XP vira | **cliente** (`rpg_system.js:983-1070`) |
| Quantos pontos de atributo | **cliente** (5/nível) |
| Se o número gravado é plausível | **servidor** (`NUMERIC_BOUNDS`, `db.js:466-480`) — mas o teto de `level` é **exatamente 1e11**, o objetivo final do jogo |
| Se o nível pode **cair** ou **saltar** | **ninguém** — não há checagem de variação nem de monotonicidade |

**Resumo em uma frase:** hoje o servidor aceita `level: 100000000000` de qualquer sessão logada. O XP dos inimigos, na prática, é decoração — o número que vale é o que o navegador manda.

---

### §2 — RITMO REAL DE KILLS E XP POR HORA

#### 2.1 O que consegui medir no código (não é hipótese)

Tentei medir **rodando o jogo localmente** (há `.claude/launch.json` com `http-server` na porta 8080 e `playwright` instalado). **Não medi, e explico por quê, sem maquiar:** entrar em gameplay exige login **[VERIFICADO: comentário em `js/game/ghost_inventory.js:60` — "entrada de gameplay hoje exige login antes de começar"]**, e o login real bate no Postgres/Supabase de **produção**, que o brief proíbe. Medir de verdade exige o dono autorizar **uma conta descartável num banco de teste** — está listado em (f) como pedido formal, com o procedimento pronto.

O que **deu** para extrair do código, e que é melhor que um chute, são os **limitadores estruturais do ritmo**:

| Limitador | Valor | Onde **[VERIFICADO]** |
|---|---|---|
| Diamantes azuis no jogo inteiro (33 fases) | **358** | `engine.js:1810-1812` (comentário conta direto do array `g_levels`) |
| Spawn por diamante | a cada **4** → 1 fantasma de captura + 1 crow; a cada **3** → 1 demon_fly | `engine.js:1818-1840` |
| Spawn por score | a cada **2.222** → 1 fantasma de captura; a cada **3.000** → 1 slime | `engine.js:330-351` |
| **Teto de inimigos vivos** | **5** (spawn além disso é descartado) | `engine.js:3205, 3428-3430` |
| Tempo por fase | **240 s** no relógio | `engine.js:508` |
| Chefes fixos | 12 fases têm chefe (4,5,6,10,11,16,17,18,20,21,22,33) | `engine.js:728-743` |
| Cadência de tiro do jogador | Spectral Spark, **15 frames ≈ 0,5 s**, sem custo de mana | `engine.js:2072-2073` |
| Golpes para matar | `0,1 × baseHp × multFase × L^0,05 / 1,12^tier` | derivado de `engine.js:998` e `rpg_system.js:12-14` |

**[CÁLCULO] — uma conclusão forte que nenhum relatório tinha:** o número de golpes para matar é praticamente **independente do nível** (`L^0,05`): um crow na fase 1 custa **0,4 golpe no nível 1 e 1,42 golpe no nível 1e11**. Ou seja, **a velocidade de matar não cai com o nível — mas o XP por kill cresce com `L^1,90`.** É exatamente por isso que o jogo acelera sem freio.

Um *clear* completo das 33 fases gera, pelos gatilhos acima: ~89 crows + ~119 demon_flies + ~89 fantasmas de captura (+~16 por score) + ~11 slimes + 12 chefes ≈ **335 kills potenciais**, menos o que o teto de 5 vivos descarta.

#### 2.2 Kills por hora — faixas declaradas

**[HIPÓTESE, ancorada nos limitadores acima]** — o ritmo humano é a única variável que o código não me dá:

| Tipo de conteúdo | kills/h pessimista | típico | otimista |
|---|---|---|---|
| Episódios iniciais (fases 1–10), jogador novo | 20 | 45 | 80 |
| Clear normal de fases 1–22 | 40 | 90 | 150 |
| Clear completo das 33 fases, jogador experiente | 120 | 220 | 330 |
| **Farm de loop na fase 33** (recarregar a fase) | 60 | 200 | 350 |
| **Farm de CAVE1** (skull + fantasmas #051–080) | 30 | 90 | 180 |

#### 2.3 XP por hora HOJE, por nível

**[CÁLCULO: `12b`]** — perfil típico (90 kills/h, inimigo comum, fase 11):

| Nível | XP por kill | **XP por hora** | Níveis ganhos por hora |
|---|---|---|---|
| 1 | 30 | 2,70e3 | 27 |
| 10 | 2.380 | 2,14e5 | 76 |
| 100 | 1,89e5 | 1,70e7 | 215 |
| 1.000 | 1,50e7 | 1,35e9 | 605 |
| 1e6 | 7,54e12 | 6,78e14 | 1,35e4 |
| 1e9 | 3,78e18 | 3,40e20 | 3,03e5 |
| 1e11 | 2,38e22 | 2,14e24 | 2,41e6 |

#### 2.4 Quanto tempo o jogo atual leva até 1e11, com o XP dos inimigos

Integrando `dL/dt = k × 0,05 × baseHp × multFase × L^0,45` (validada contra simulação kill-a-kill em `raw/02` §1.2, erro < 0,2%) **[CÁLCULO: `12b`]**:

| Perfil | kills/h | baseHp | fase | multFase | Horas ativas até 1e11 | **Anos a 1 h/dia** | vs. régua (1.121,3 a) |
|---|---|---|---|---|---|---|---|
| Lento, fase inicial, só crow | 20 | 4 | 1 | 1,00 | 5,10e5 | **1.396,4** | 0,8× (mais lento) |
| Típico, mix de fases 1–22 | 90 | 4 | 11 | 1,50 | 7,56e4 | **206,9** | 5,4× mais rápido |
| Rápido, clear completo | 300 | 4 | 16 | 1,75 | 1,94e4 | **53,2** | 21,1× |
| **Farm fase 33** (comuns lá) | 200 | 4 | 33 | **666** | **76,6** | **0,21** | **5.348×** |
| Farm fase 33, só o cactus | 30 | 9 | 33 | **666** | 226,9 | **0,62** | 1.805× |
| **Farm CAVE1** (skull) | 60 | 33 | cave1 | **500** | **41,2** | **0,11** | **9.937×** |
| Farm CAVE1, fantasmas nativos | 120 | 4 | cave1 | **500** | 170,0 | 0,47 | 2.409× |

> **Dispersão entre o mais lento e o mais rápido: ~12.375× [CÁLCULO].** O `raw/02` publicou 126× porque não viu os multiplicadores 666 e 500.
>
> **Traduzindo para o dono:** hoje, um jogador que descobre a fase 33 ou a CAVE1 **zera o jogo de 1.121 anos em menos de um fim de semana de jogo acumulado (41 a 77 horas)**. Não é "está muito fácil subir de level" — é que existe um atalho de três ordens de grandeza dentro do próprio conteúdo que já está no ar, e ele não exige trapaça nenhuma: é só escolher a fase.
>
> **Isto é um achado de calibração, não de segurança** (não há exploit envolvido), mas se soma ao achado de segurança do `raw/05`: o cliente também pode simplesmente mandar o nível pronto.

#### 2.5 A escada de XP, e o que ela exige

**[CÁLCULO, validado contra força bruta em `12a`]** — `XPRequired(L) = floor(100·L^1,45)`; `C(L)` = soma acumulada:

| Nível | `XPRequired(L)` (o degrau) | `C(L)` (o total até ali) |
|---|---|---|
| 1 | 100 | 0 |
| 10 | 2.818 | 1,01e4 |
| 100 | 7,94e4 | 3,20e6 |
| 1.000 | 2,24e6 | 9,13e8 |
| 1e6 | 5,01e10 | 2,05e16 |
| 1e9 | 1,12e15 | 4,58e23 |
| **1e11** | **8,91e17** | **3,64e28** |

Erro da aproximação de Euler-Maclaurin usada em produção, contra a soma exata: **5,5e-7** em n=1.000, **6,9e-10** em n=1e5, **2,5e-11** em n=1e6 — cai conforme n cresce **[CÁLCULO]**.

---

### §3 — REDESENHO: O NÍVEL VEM SEMPRE DO XP, E A RÉGUA CONTINUA DE PÉ

#### 3.0 A ideia-guia, testada e **APROVADA**

A tarefa me deu uma hipótese para validar ou refutar. **Validei. Ela funciona.** Em português:

> O servidor define **quanto XP a conta pode ter acumulado** depois de `H` horas creditadas. Esse orçamento é exatamente o XP que corresponde ao nível que a curva do plano v1 pediria naquele momento. O nível continua sendo **calculado a partir do XP**, como o dono quer — só que o XP tem um teto que sobe com o tempo.

Formalmente:

```
L*(H) = 20·H + (1e11 − 20·T)·(H/T)³           T = 409.538 horas creditadas
XP*(H) = C(L*(H))                              (orçamento cumulativo de XP)
Orçamento do dia d = XP*(d) − XP*(d−1)         (janela deslizante de 24 h)
Nível do jogador   = C⁻¹(XP acumulado)         ← o nível SEMPRE vem do XP
```

`C` é a soma acumulada da escada e `C⁻¹` é a busca binária — **as duas já existem em produção** (`cumulativeXpToLevel` e `levelFromCumulativeXp`, `rpg_system.js:501-526`). Não é código novo; é o mesmo código, alimentado por um XP que o servidor controla.

**Resultados da validação [CÁLCULO: `12b`, `12c`]:**

| Propriedade testada | Resultado |
|---|---|
| Fecha em 1e11 no tempo T? | **Sim, exato**: `C⁻¹(XP*(T)) = 100.000.000.000` |
| O orçamento diário é sempre positivo (nunca "desce")? | **Sim**, testado nos 409.538 passos inteiros. Menor orçamento diário = **59.054 XP**, na hora 1 |
| `C⁻¹(C(L)) = L` em toda a faixa? | **Sim**: desvio **0 nível** em 24 pontos log-espaçados e nas bordas 1, 2, 1024, 1025, 1e11−1, 1e11 |
| Somar 409.538 parcelas diárias em float64 acumula erro? | **Erro relativo 0,00e+0; erro em níveis: 0** |

#### 3.1 A tabela mestra do orçamento

**[CÁLCULO: `12b`]**

| Marco | Horas creditadas | Nível `L*(H)` | **XP acumulado permitido** | XP do dia (1 h) |
|---|---|---|---|---|
| Dia 1 | 1 | 20 | 5,91e4 | **59.054** |
| 1 semana | 7 | 140 | 7,33e6 | 2,31e6 |
| 1 mês | 30 | 600 | 2,61e8 | 2,08e7 |
| **1 ano** | 365 | **7.370** | 1,22e11 | 8,09e8 |
| 10 anos | 3.652 | 143.944 | 1,77e14 | 2,35e11 |
| 100 anos | 36.524 | 7,17e7 | 7,18e20 | 1,44e17 |
| 500 anos | 182.621 | 8,87e9 | 9,62e25 | 3,87e21 |
| 1.000 anos | 365.243 | 7,09e10 | 1,57e28 | 3,16e23 |
| **3147** | **409.538** | **1e11 exato** | **3,64e28** | 6,53e23 |

O orçamento diário cresce **1,1e19×** do primeiro ao último dia. **É por isso que a tabela de XP por inimigo tem que ser por Era, e não um número fixo.**

#### 3.2 O que muda no XP dos inimigos, concretamente

**Antes (hoje):** `XP = floor(maxHp × 5)`, com `maxHp` derivado do **nível do jogador** e da **fase**. O cliente calcula, o cliente concede.

**Depois:** `XP = tabelaDoServidor[Era][tipoDeInimigo] × modificadores limitados`, concedida pelo servidor, e o total do dia é cortado pelo orçamento.

Três mudanças de princípio:

1. **O XP por kill deixa de ser função do nível do jogador.** Isso mata o expoente `+0,45` (a renda crescendo mais rápido que o custo), que é a causa matemática do descontrole de hoje. O XP por kill passa a ser função da **Era** (tempo creditado) e do **tipo de inimigo**.
2. **O multiplicador de fase sai da conta de XP.** `multFase` continua existindo para **HP/dificuldade** (fase 33 e CAVE1 continuam sendo os lugares mais difíceis do jogo), mas **não multiplica mais o XP** — senão os 666× voltam. O prestígio da fase 33 passa a ser expresso em loot, badge e relíquia, não em XP.
3. **O servidor concede.** O cliente pode até mostrar uma previsão ("+3,4e9 XP"), mas o número que conta é o que o servidor credita.

#### 3.3 Tabela final — XP por kill, por Era e por tipo

Pesos relativos fixos (a "identidade" de cada inimigo, igual em todas as Eras): comum = **1**, elite = **4**, chefe de fase = **12**, chefe de Era = **60**, captura da Ghostdex = **8**. Alvo de desenho: **90 kills/hora** saturam o orçamento **[CÁLCULO: `12b` §B3]**.

| Era (horas creditadas) | Comum | Elite (cactus) | Chefe de fase | Chefe de Era | Captura Ghostdex |
|---|---|---|---|---|---|
| **I** The Wake (0–33) | 6,53e3 | 2,61e4 | 7,83e4 | 3,92e5 | 5,22e4 |
| **II** The First Ring (33–365) | 2,39e5 | 9,57e5 | 2,87e6 | 1,44e7 | 1,91e6 |
| **III** Apprentice Years (365–1.825) | 4,63e6 | 1,85e7 | 5,55e7 | 2,78e8 | 3,70e7 |
| **IV** Founder's Age (1.825–9.125) | 3,41e9 | 1,36e10 | 4,09e10 | 2,04e11 | 2,73e10 |
| **V** The Inheritors (9.125–27.375) | 3,15e12 | 1,26e13 | 3,78e13 | 1,89e14 | 2,52e13 |
| **VI** Cartographers (27.375–63.899) | 7,69e14 | 3,08e15 | 9,23e15 | 4,62e16 | 6,16e15 |
| **VII** Deep Archive (63.899–136.899) | 1,03e17 | 4,13e17 | 1,24e18 | 6,20e18 | 8,26e17 |
| **VIII** Quiet Centuries (136.899–246.399) | 5,12e18 | 2,05e19 | 6,14e19 | 3,07e20 | 4,10e19 |
| **IX** The Great Work (246.399–365.243) | 8,15e19 | 3,26e20 | 9,78e20 | 4,89e21 | 6,52e20 |
| **X** Keystone Stretch (365.243–409.538) | 3,05e20 | 1,22e21 | 3,66e21 | 1,83e22 | 2,44e21 |

Os intervalos de horas vêm das 10 Eras do plano v1 §3.2 (`raw/07`). Dentro de uma Era, o XP por kill deve **interpolar** suavemente entre o valor de início e o de fim (senão o jogador sente um degrau no dia da virada de Era).

**Repare no que isso resolve de graça:** a **captura da Ghostdex volta a valer a pena** (peso 8, oito vezes um comum), em vez de virar irrelevante no nível 100 como é hoje. O Ghostdex deixa de ser um colecionável fora da progressão.

#### 3.4 Kills por hora exigidos, e como tratar o jogador lento e o rápido

**Aqui está o ponto mais delicado do desenho, e onde a hipótese da tarefa precisa de um acréscimo.**

Se o XP por kill for um valor fixo por Era, o jogador que faz 40 kills/h ganha **metade** do que o de 80 kills/h — e volta a dispersão, só que menor. A correção é dar ao orçamento diário uma **curva de saturação** em vez de um corte seco:

```
XP concedido depois de n kills no dia = B × (1 − e^(−n / n₀))
```

`B` é o orçamento do dia e `n₀` é resolvido para que o jogador **lento** já chegue perto do teto. Com **n₀ = 13,35** (calibrado para 40 kills = 95%) **[CÁLCULO: `12c`]**:

| Kills no dia | Fração do orçamento recebida |
|---|---|
| 5 | 31,2% |
| 10 | 52,7% |
| 20 | 77,6% |
| **40 (lento)** | **95,0%** |
| **90 (mediano)** | **99,9%** |
| 144 (rápido/AoE) | 100,0% |
| 400 | 100,0% |
| 5.000 (bot) | 100,0% |

> **O número que importa:** a dispersão de **250×** em kills (20 vs. 5.000) vira **1,29×** em XP. A diferença de 12.375× de hoje colapsa para **menos de 30%**.
>
> **Em português para o dono:** quem joga devagar chega **1,29 vez depois**, não 250 vezes antes. E o XP dos inimigos continua sendo, para o jogador, a coisa que faz o nível subir — ele mata, vê o XP entrar, sobe de nível. O teto só aparece quando ele passa muito do ritmo normal, e ele aparece como "rendimento decrescente", não como uma porta batendo na cara.

**Resultado por arquétipo [CÁLCULO: `12c` §C3]** (orçamento por **Linha**, janela deslizante de 24 h, τ = 0):

| Arquétipo | kills/h | Fração do orçamento do dia | **Anos até 1e11** |
|---|---|---|---|
| **A régua (1 h/dia, ritmo mediano)** | 90 | 99,9% | **1.121,5** |
| 1 h/dia, jogador lento | 40 | 95,0% | **1.129,1** |
| 1 h/dia, jogador rápido/AoE | 250 | 100,0% | 1.121,3 |
| 4 h/dia (teto τ=0) | 250 | 100,0% | 1.121,3 |
| 16 h/dia (teto τ=0) | 600 | 100,0% | 1.121,3 |
| **Bot 24 h/dia** | 5.000 | 100,0% | **1.121,3** |
| Família revezando 3×8 h (mesma Linha) | 600 | 100,0% | 1.121,3 |
| 95% dos dias, ritmo mediano | 90 | 99,9% | 1.180,5 |

**Razão entre o mais dedicado e o mais devagar: 1,007×.** O bot e a família em turnos ganham exatamente o que a régua ganha — **sem precisar detectar bot nenhum**.

#### 3.5 Os seis casos que a tarefa mandou tratar

**(a) Jogador lento vs. rápido (a dispersão de 126× — na verdade 12.375×).**
Resolvida pela curva de saturação de 3.4: 1,29× de dispersão residual. O parâmetro `n₀` é **configurável no servidor** e é a alavanca de ajuste: `n₀` menor = mais perdoado com quem joga pouco; `n₀` maior = mais recompensa por eficiência.

**(b) Multi-kill / AoE / dano elemental.**
Não precisam de regra especial: eles aumentam `n` (kills por dia), e `n` está na curva saturante. Um AoE que triplica as kills leva o jogador de 99,88% para 100,00% do orçamento — **ganho real de 0,12%**. O AoE continua valendo a pena pela *velocidade* (termina a hora em menos tempo real) e pelo loot, não pelo XP. **Isso é um recurso, não uma limitação:** significa que o time de design pode balancear magia e AoE pela diversão, sem medo de furar a régua.

**(c) Inimigos de história vs. farm.**
Duas listas separadas, e a diferença tem que ser de **natureza**, não só de número:
- **Inimigos de história** (chefes das fases 4–33, chefe de Era, captura da Ghostdex): XP **por primeira vez**, fora da curva saturante, creditado inteiro. É o que faz "avançar na história" render de verdade.
- **Inimigos de farm** (spawns por diamante/score, repetições): entram na curva saturante.
- **Repetição de um chefe de história** cai para o valor de farm da Era (ex.: 10% do valor da primeira vez). Rejogar a fase 33 continua sendo divertido e dá loot — só não é mais um atalho de 5.348×.

**(d) O que o servidor precisa saber para validar um kill, sem reescrever o combate.**
Este é o item que decide se a proposta é implementável por um dev solo. **Não é preciso simular o combate no servidor.** Basta um "recibo de kill" com:

| Campo | Para quê |
|---|---|
| `sessionId` + `beatSeq` | idempotência: reenvio não credita duas vezes |
| `spawnId` (gerado pelo **servidor** quando o inimigo nasce) | um kill sem spawn correspondente é rejeitado; um `spawnId` já usado é rejeitado |
| `enemyType`, `phase` | escolhe a linha da tabela de XP |
| `spawnTs` (relógio do servidor) | `tempoDeLuta = agora − spawnTs` |
| `tempo mínimo plausível de luta` (por tipo e Era) | derivado de `golpes × cadência de tiro` = `(0,1·baseHp·multFase·L^0,05 / 1,12^tier) × 0,5 s`. Matar antes disso é fisicamente impossível → rejeita e registra |
| contador de kills da janela de 24 h | aplica a curva saturante e o orçamento |

O servidor passa a ser o dono de **três números**: quantos inimigos nasceram, quantos morreram, e quanto XP isso vale. O cálculo de dano, colisão, física e loot **continua no cliente**, exatamente como hoje.

> **Custo honesto:** isso não é grátis. Exige que o **spawn** deixe de ser decidido pelo cliente (hoje é: `SpawnBossAtRandomLocation` roda no navegador). É a maior peça de trabalho da proposta, e é a mesma peça que o plano v1 já previa para o *heartbeat* de tempo — dá para construir as duas juntas.

**(e) Exploits de XP.** **[CÁLCULO: `12c` §C5]**

| Exploit | Hoje | Sob o desenho |
|---|---|---|
| Farm em loop (recarregar a fase 33) | 2,66e6 XP/h no nível 1 → zera em 77 h | teto do dia 1 = **59.054 XP**. Ganho além do teto: **zero** |
| Farm na CAVE1 (skull) | zera em 41 h | idem |
| Morrer/renascer para respawnar chefe | ganho ilimitado | o `spawnId` só credita uma vez |
| Grupo / vários jogadores no mesmo inimigo | cada um ganha o XP cheio | XP do kill dividido ou creditado por `spawnId` uma vez por Linha |
| Multi-aba, web + celular | XP dobrado | orçamento por **Linha**, janela de 24 h |
| Cliente adulterado mandando XP alto | **passa** (teto 1e19) | servidor não aceita XP do cliente; o orçamento é o teto absoluto |
| Relógio do cliente adulterado | irrelevante hoje (não há relógio) | só vale o relógio do servidor |

**(f) Bônus de XP de itens/afixos.**
**Hoje não existe nenhum** **[VERIFICADO: `rpg_system.js:117-129`]** — então esta é uma decisão de futuro, não uma correção.

**[CÁLCULO: `12c` §C4]** Sem orçamento diário, 7 slots com +25% de XP cada = **4,77× de XP** → divide a data de chegada por 4,77 (de 1.121 para 235 anos). **Com** o orçamento diário e a curva saturante, um bônus de +100% rende **0,12% a mais** — o teto absorve.

**Regra recomendada:** bônus de XP em item é permitido **só** como "chegar ao teto do dia mais rápido" (ou seja, reduz `n₀` efetivo), **nunca** como "aumentar o teto do dia". Assim o item é útil para quem tem pouco tempo — que é o jogador que o conceito quer proteger — e inofensivo para a régua. E o teto do dia **nunca** deve ser multiplicável por item, evento, badge ou ritual: é a **regra de ferro** já escrita no plano v1 §3.6 ("eventos dão memória, nunca poder").

#### 3.6 Auditoria numérica do desenho

| Grandeza | Valor final | Cabe em float64 exato (2^53 ≈ 9,007e15)? | Cabe no teto do servidor hoje? | Recomendação |
|---|---|---|---|---|
| Nível | 1e11 | **sim** | `level: [1, 1e11]` — **no fio da navalha** | teto de *validação* > teto de *jogo* (ex.: 1,01e11) |
| **XP acumulado** | **3,64e28** | **NÃO** | `xp: [0, 1e19]` → **ESTOURA** | ver abaixo |
| `xpRequired` (degrau) | 8,91e17 | não | `xpRequired: [0, 1e19]` — cabe | float64 basta (é exibição) |
| XP residual (o que sobra) | < 8,91e17 | não | cabe | float64 basta |
| Segundos creditados | 1,47e9 | **sim, com folga** | `time: [0, 1e8]` → **ESTOURA em 3,17 anos** | subir para 1e10 |
| Contador de kills (vida toda) | ~1e8–1e9 | sim | `total_kills` é **INTEGER** (2,15e9) | migrar para BIGINT |

> **O achado mais perigoso desta seção [VERIFICADO: `db.js:468` + `db.js:425-429`]:** se o desenho gravar o **XP acumulado** (3,64e28), ele passa do teto `xp: [0, 1e19]`. E o modo de falha não é um erro visível: `sanitizeCharacterPayload` **apaga o campo**, e o `COALESCE` de `saveCharacters` **preserva o valor antigo do banco**. O jogador continua jogando, o XP para de subir, e **nada aparece na tela**. É a mesma classe de bug de save silencioso que este projeto já pagou caro para corrigir uma vez.
>
> **Duas saídas, e recomendo a primeira:**
> 1. **Não gravar o acumulado.** Guardar `(nível, XP residual)` como hoje — os dois cabem — e derivar o acumulado por `C(nível) + residual` quando precisar. Custo: zero migração. É o esquema que já está em produção.
> 2. Gravar o acumulado em `NUMERIC` do Postgres (exato, sem limite prático) com o teto subido para ~1e29, lido como **string decimal** ou **BigInt** no Node — nunca como `Number`. Atenção: `server/db.js` registra `types.setTypeParser(20, Number)`, que devolve BIGINT como Number do JS; uma coluna que passe de 2^53 precisa de parser próprio.

**A forma fechada de hoje aguenta 3,64e28? [CÁLCULO: `12c` §C1] — SIM.**
- `C⁻¹(C(L)) = L` com desvio **0 nível** em 24 pontos log-espaçados e em todas as bordas (1, 2, 1024, 1025, 1e11−1, 1e11).
- O erro de 1 ULP (a menor diferença representável) em 3,64e28 vale **8,08e12 XP**; um nível no topo vale **8,91e17 XP**. O erro é **9,1e-6 de um nível** — ou seja, **nunca** custa um nível.
- Somar as 409.538 parcelas diárias em float64 deu **erro de 0 nível** contra a forma fechada.

**Conclusão numérica:** a matemática do `addXp` atual não precisa ser reescrita. O que precisa mudar é **quem** chama e **com que número** — e os tetos de validação do servidor.

---

### §4 — TRÊS DESENHOS PARA A "FONTE DA VERDADE" DO NÍVEL

#### 4.1 Os três, em uma frase cada

| | Desenho | Como o nível nasce |
|---|---|---|
| **A** | Plano v1 (decisão A4) | `nível = L*(segundos creditados)`. O XP é cosmético — uma previsão do cliente, corrigida pelo servidor |
| **B** | **O que o dono pediu** | `nível = C⁻¹(XP acumulado)`. O XP vem dos inimigos, com tabela por Era **definida pelo servidor** e **orçamento diário** |
| **C** | **Híbrido (minha recomendação)** | Igual ao B, **mais** um piso: se a conta creditou a hora do dia e ganhou menos XP que o mínimo da Era (ex.: 80% do orçamento), o servidor **completa** até o piso |

#### 4.2 Onde cada um falha

| Ameaça / situação | **A** (tempo) | **B** (XP com orçamento) | **C** (híbrido) |
|---|---|---|---|
| **Cliente adulterado** manda nível/XP alto | imune — o nível não vem do cliente | imune **se e só se** o servidor conceder o XP. Se o cliente ainda conceder, é o buraco de hoje intacto | imune (mesma condição do B) |
| **Bot** rodando 24 h | ganha o mesmo que 1 h de humano | ganha o mesmo (o teto corta) — **1.121,3 anos** | ganha o mesmo |
| **Bot que só fica parado** (AFK, sem matar nada) | **ganha tudo** se o *heartbeat* aceitar — é a fraqueza do A | **ganha zero** — sem kill não há XP. **O B é mais forte que o A aqui** | ganha o piso (ver risco abaixo) |
| **Dispersão** entre lento e rápido | **zero** (todos idênticos) | **1,29×** com a curva saturante; ~2,3× sem ela | **1,00×** acima do piso, 1,29× abaixo |
| Jogador que joga a hora inteira mas **joga mal** | chega junto com todo mundo | chega **1,29× depois** — pode ser sentido como injusto | chega junto (o piso protege) |
| **Exploit futuro** que conceda XP infinito | não afeta a régua | **o orçamento é o teto absoluto** — o exploit não passa dele | idem |
| Criança / iniciante / herdeiro que nunca jogou | protegido | penalizado nos primeiros meses | **protegido** — o piso é exatamente para isso |
| Esforço de implementação | **menor** (heartbeat + curva) | **maior** (spawn autoritativo + recibo de kill + tabela) | maior (B + piso) |
| **O pedido do dono ("nível sempre pelo XP")** | **não atende** | **atende** | **atende** |
| Defesa jurídica ("passou de 1 h, o ganho é zero") | válida | válida (τ=0) | válida (τ=0) |

#### 4.3 O efeito no jogador, em linguagem simples

- **No A**, o jogador mata um inimigo, vê "+XP" na tela, e o número do nível sobe porque o **relógio** andou. Se ele parar de matar e ficar andando pelo mapa, o nível sobe igual. É o desenho mais seguro contra cliente adulterado e o **mais estranho de explicar**: *"por que eu subi de nível sem matar nada?"*
- **No B**, o jogador mata, vê o XP entrar, e o nível sobe **por causa disso**. É o que o dono descreveu e o que qualquer jogador de RPG espera. O preço: quem joga devagar demora 1,29× mais, e quem fica parado não sobe.
- **No C**, vale o B — com uma rede de segurança: quem cumpriu a hora não fica para trás por ser iniciante, criança, ou por estar num celular fraco.

#### 4.4 Recomendação: **Desenho C**

Recomendo o **C**, com o piso em **80% do orçamento da Era** **[HIPÓTESE — o número exato sai do harness da Fase 1]**, e por quatro razões:

1. **Atende o pedido do dono literalmente.** O nível vem do XP, e o XP vem dos inimigos. O jogador vê a barra encher matando coisa.
2. **É mais forte que o A contra o farmador de AFK**, que é a ameaça que o A tem de mais difícil (o A precisa que o *heartbeat* saiba distinguir "jogando" de "parado com a aba aberta"; o B/C não precisam — sem kill, não há XP).
3. **Preserva a régua com folga**: 1.121,3 anos para todos os arquétipos, do bot à família em turnos **[CÁLCULO]**.
4. **O piso paga a única fraqueza real do B** (punir o jogador devagar), sem reabrir a porta do AFK — porque o piso **só existe se houver hora creditada E pelo menos um mínimo de kills** (ex.: 10 kills no dia). Um AFK puro continua ganhando zero.

**A honestidade que devo ao dono:** o C é o desenho **mais caro de construir** dos três. Ele exige spawn autoritativo no servidor, que hoje não existe. Se o orçamento de trabalho não couber, o caminho de recuo é: **começar pelo A** (mais barato, entrega a régua) e **migrar para o C** quando o spawn autoritativo existir — o nível é o mesmo número nos dois, porque `L*(H)` e `C⁻¹(XP*(H))` **são a mesma curva por construção**. Essa compatibilidade é deliberada e é a melhor propriedade deste desenho: **dá para trocar a fonte da verdade sem mexer em um único nível de ninguém.**

#### 4.5 O que muda nas decisões A1, A3, A4 e A5 do plano v1

| Decisão v1 | Texto original | **Novo status** |
|---|---|---|
| **A1** — Formato da curva | Suave (Família B), `L*(H) = 20H + (1e11−20T)(H/T)³`, Eras ancoradas em tempo | **INALTERADA.** A curva continua sendo a mesma; ela só passa a ser expressa como *orçamento de XP* `C(L*(H))` em vez de nível direto. Nenhum marco muda |
| **A3** — Quanto rende a hora extra (τ) | `τ = 0` no lançamento | **INALTERADA, e reforçada.** O τ agora se aplica ao **orçamento de XP** do dia. A tabela de arquétipos de §3.4 mostra que τ=0 continua fazendo bot, 16 h/dia e família em turnos chegarem em 1.121,3 anos |
| **A4** — Nível vem do XP ou do tempo | "Do **tempo** medido no servidor" | **REVISADA.** Passa a ser: *"do **XP**, com o XP concedido pelo servidor dentro de um orçamento diário derivado do tempo creditado"*. O tempo continua sendo a régua — mas vira o **teto** do XP, não a fonte do nível |
| **A5** — A régua é da pessoa ou da Linha | Da **Linha** | **INALTERADA, e mais necessária ainda.** Com o XP vindo de kills, uma família revezando faria 3× mais kills. É o orçamento **por Linha** que neutraliza isso — sem ele, o B/C reabrem exatamente o furo que o A5 fechou |

**Duas decisões novas que o desenho B/C cria e que não existiam no v1:**

- **A12 — O parâmetro `n₀` da curva de saturação** (quanto o ritmo de kills importa). `n₀ = 13,35` é a minha recomendação, calibrada para o jogador lento (40 kills/h) já pegar 95%.
- **A13 — O piso do desenho C** (existe? quanto?). Recomendo **80% do orçamento da Era, condicionado a ≥10 kills no dia**.

---

### §5 — IMPACTO NA BLOCKCHAIN FUTURA (R13 × R3/R9)

Esta seção diz **só o requisito matemático**. A solução é do `game-platform-architect` e do `security-engineer` — eu não desenho a chain.

**O problema, em uma frase:** hoje o XP é verificado por *um* servidor confiável. Num futuro sem servidor (R9), o XP tem que ser verificável por **nós que não confiam uns nos outros** e que nunca viram a partida.

**As cinco condições matemáticas que o desenho B/C precisa satisfazer para isso ser possível:**

1. **A tabela de XP tem que ser parte das regras de consenso.** `XP(Era, tipoDeInimigo)` não pode ser um número num banco de dados: tem que ser uma função determinística e versionada, embutida nas regras do jogo na chain. Dois nós honestos, com os mesmos dados de entrada, têm que chegar ao **mesmo XP, bit a bit**.
2. **A aritmética tem que ser exata e reprodutível.** Isto **reprova o float64**. `Math.pow(L, 1.45)` pode diferir na última casa entre versões de motor JavaScript, arquiteturas e compiladores. Para consenso, a escada de XP precisa ser **inteira** (BigInt / aritmética de ponto fixo) e a soma acumulada precisa ser uma fórmula fechada em inteiros, ou uma tabela de pontos de ancoragem por Era. **Este é o requisito mais subestimado dos cinco**, e ele afeta o desenho *agora*: se o XP vai um dia para a chain, a escada tem que virar inteira antes, não depois.
3. **O orçamento diário tem que ser função de um relógio que a chain conheça.** "24 horas" não existe sem relógio confiável. A versão verificável é **por altura de bloco** (ex.: o orçamento de um "dia" = N blocos), não por hora civil. Isso muda a definição de "dia" do plano v1 e precisa ser decidido **antes** de a chain existir, porque muda a régua.
4. **O kill tem que virar um evento verificável.** Três opções, em ordem crescente de custo: (i) o servidor/uma federação **assina** o recibo de kill e a chain só guarda a assinatura (é o que dá para fazer primeiro — mas não é "sem servidor"); (ii) a partida é **rejogável**: o cliente publica a semente aleatória e as entradas do jogador, e qualquer nó reexecuta o jogo e confere o resultado — exige um motor de jogo **100% determinístico**, o que o `engine.js` de hoje **não é** (usa `Math.random()` sem semente e passo de tempo variável); (iii) prova de conhecimento zero da partida (caro, na fronteira da tecnologia).
5. **O teto tem que ser verificável sem revelar a partida inteira.** Um nó precisa poder dizer "esta conta não passou do orçamento do dia" olhando só o histórico de XP na chain — o que o desenho B/C já dá de graça, porque o **orçamento cumulativo `XP*(H)` é uma função fechada de H**: basta comparar `XP_declarado ≤ C(L*(H))`.

> **A boa notícia, e ela é grande:** a propriedade 5 é **uma consequência direta de escolher o desenho B/C em vez do A**. Um nó verifica um XP sem simular nada — só checa uma desigualdade contra uma função fechada. **O desenho que o dono pediu é, por acaso, o mais amigável à blockchain dos três.** O desenho A (nível = f(tempo)) exigiria que a chain acreditasse num relógio, que é justamente o que blockchain tem mais dificuldade de fazer.
>
> **A má notícia, dita sem suavizar:** o ponto 2 (aritmética inteira) e o ponto 4(ii) (motor determinístico) são reescritas profundas do jogo, não ajustes. Se a chain é um objetivo real, a escada de XP deve nascer **inteira** já nesta calibração — mudar depois significa recalibrar contas vivas.

---

### §6 — TABELAS FINAIS PARA O DONO

#### 6.1 XP por inimigo — antes e depois (nível 1, para dar escala)

| Inimigo | Onde | **HOJE** (L=1) | **HOJE** (L=1e6) | **DEPOIS** (Era I) | **DEPOIS** (Era V) |
|---|---|---|---|---|---|
| crow / demon_fly / slime, fase 1 | qualquer fase | 20 | 5,02e12 | 6,53e3 | 3,15e12 |
| comum, fase 32 | fase 32 | 50 | 1,28e13 | 6,53e3 | 3,15e12 |
| **cactus (fase 33)** | fase 33 | **29.970** | 7,53e15 | 2,61e4 | 1,26e13 |
| **skull (CAVE1)** | cave1 | **82.500** | 2,07e16 | 2,61e4 | 1,26e13 |
| captura Ghostdex, fase 1 | qualquer | 5.750 | 5.750 *(não cresce)* | 5,22e4 | 2,52e13 |
| chefe de fase | 12 fases | = comum | = comum | 7,83e4 | 3,78e13 |
| chefe de Era | novo | — | — | 3,92e5 | 1,89e14 |

**Repare em duas coisas:** (1) o abismo de 666×/500× entre fases **desaparece** — o cactus continua valendo 4× um comum, e isso é *identidade*, não atalho; (2) a captura da Ghostdex deixa de ser um número congelado e passa a acompanhar a Era.

#### 6.2 XP por hora, kills exigidos e tempo por marco

| Era | Horas creditadas | Nível no fim | **XP/hora (orçamento)** | Kills/h para 95% | Kills/h para 100% |
|---|---|---|---|---|---|
| I The Wake | 0–33 | 660 | 9,99e6 | 40 | ~144 |
| II The First Ring | 33–365 | 7.370 | 3,66e8 | 40 | ~144 |
| III Apprentice Years | 365–1.825 | 4,54e4 | 7,08e9 | 40 | ~144 |
| IV Founder's Age | 1.825–9.125 | 1,29e6 | 5,21e12 | 40 | ~144 |
| V The Inheritors | 9.125–27.375 | 3,04e7 | 4,82e15 | 40 | ~144 |
| VI Cartographers | 27.375–63.899 | 3,81e8 | 1,18e18 | 40 | ~144 |
| VII Deep Archive | 63.899–136.899 | 3,74e9 | 1,58e20 | 40 | ~144 |
| VIII Quiet Centuries | 136.899–246.399 | 2,18e10 | 7,83e21 | 40 | ~144 |
| IX The Great Work | 246.399–365.243 | 7,09e10 | 1,25e23 | 40 | ~144 |
| X Keystone Stretch | 365.243–409.538 | **1e11** | 4,67e23 | 40 | ~144 |

**O número de kills é o mesmo em todas as Eras — de propósito.** O que muda é quanto cada kill vale. Para o jogador, a hora do dia 1 e a hora do ano 1.000 têm **o mesmo ritmo**: ~40 a 90 inimigos, quatro Movimentos de 15 minutos, o Selo do Dia no fim. É o número que cresce, não o esforço.

#### 6.3 Comparativo antes/depois, em uma tabela só

| | **HOJE** | **DEPOIS (Desenho C)** |
|---|---|---|
| Quem concede o XP | cliente (navegador) | **servidor** |
| XP por kill depende de | nível do jogador × fase (até ×666) | **Era × tipo de inimigo** |
| Fonte do nível | XP do cliente | **XP creditado pelo servidor** (o nível sempre vem do XP) |
| Tempo até 1e11, jogador lento | 1.396 anos | **1.129 anos** |
| Tempo até 1e11, jogador típico | **207 anos** | **1.121,5 anos** |
| Tempo até 1e11, farm da fase 33 | **0,21 ano (77 horas)** | **1.121,3 anos** |
| Tempo até 1e11, bot 24 h/dia | horas | **1.121,3 anos** |
| **Dispersão entre estilos de jogo** | **~12.375×** | **1,29× (1,007× acima do piso)** |
| XP acumulado no fim | 3,64e28 (não é guardado) | 3,64e28 — **passa do teto `xp: 1e19`** se for guardado |
| Precisa detectar bot? | sim, e não detecta | **não** — o orçamento neutraliza |
| Precisa reescrever o combate no servidor? | — | **não** — só spawn + recibo de kill |
| A Ghostdex participa da progressão? | só no começo (XP congelado) | **sim, em todas as Eras** (peso 8) |

---

## (c) COMO ATENDO CADA REQUISITO (R1–R14)

| R | Como este relatório atende |
|---|---|
| **R13 — Nível sempre vem do XP** | **Atendido integralmente.** §3 mostra o nível como `C⁻¹(XP acumulado)`, com o XP vindo dos inimigos, e prova que a régua de 3147 continua exata. §4 recomenda o Desenho C |
| **R12 — Longevidade até 3147** | §3.1 fecha em 1e11 no passo T=409.538 com erro zero; §3.6 mostra que float64 não perde nenhum nível em 1.121 anos |
| **R3 / R9 — Progresso na chain, sem servidor** | §5 lista as 5 condições matemáticas. A principal descoberta: **o desenho B/C é mais verificável sem servidor do que o desenho A**, porque o teto é uma desigualdade contra uma função fechada |
| **R10 — Segurança máxima** | §3.5(d) e (e) dão o recibo de kill e a tabela de exploits quantificada. Não prometo "100% seguro": prometo que **o ganho de todo exploit de XP conhecido fica limitado pelo orçamento do dia** |
| **R5 — Infinitos jogos na mesma chain** | Só toco de raspão: a tabela de XP tem que ser **por jogo**, versionada, dentro das regras de consenso (§5, item 1). O desenho da camada de aplicação é do `game-platform-architect` |
| **R14 — Sequenciamento (chain depois do Episódio 2)** | Compatível: tudo em §3 e §4 é Web2 e roda no Postgres/Supabase atual. §5 é só requisito, não construção |

---

## (d) LACUNAS QUE EU FECHEI

1. **O censo completo de XP** — as duas únicas fontes, com arquivo:linha, fórmula e valores em 7 níveis. A lacuna 2 do `00_BRIEF.md` estava aberta nesta parte.
2. **A correção do `raw/02` §1.1/§1.3** — `multFase` vale 666 e 500, não 1–2,55. A dispersão real é 12.375×, não 126×; o cenário rápido real é **0,11 ano**, não 11 anos.
3. **A prova de que "nível pelo XP" e "chegar em 3147" são compatíveis** — com fecho exato, monotonicidade e round-trip testados.
4. **A auditoria da forma fechada em produção contra 3,64e28** — ela aguenta; perda de nível = zero.
5. **O achado do teto `xp: 1e19`** — guardar o XP acumulado congela o save em silêncio. Nenhum relatório anterior tinha ligado esse teto ao desenho "nível pelo XP".
6. **A curva de saturação diária** (`n₀ = 13,35`) — o mecanismo que comprime 250× de dispersão de ritmo para 1,29×.
7. **A tabela de XP por Era e por tipo de inimigo**, pronta para virar configuração de servidor.
8. **O requisito matemático para verificar XP sem servidor** (§5) — a lacuna T5 do brief v2.
9. **A revisão explícita de A4 e as duas decisões novas (A12, A13)**.

---

## (e) DEPENDÊNCIAS DE OUTROS DEPARTAMENTOS

| Assunto | De quem depende |
|---|---|
| Spawn autoritativo no servidor + recibo de kill (protocolo, idempotência, `spawnId`) | `backend-architect` (implementação) e `security-engineer` (modelo de ameaças) |
| Definição da "hora de referência" e do *heartbeat* (o `H` que alimenta meu orçamento) | `security-engineer` + plano v1 §2.1 — **meu orçamento inteiro é multiplicado pelo erro dessa definição** |
| Se o XP por kill deve ser "sentido" pelo jogador como número grande ou como fração de barra | `game-designer` e `ui-ux-designer` |
| Pesos relativos por inimigo (comum 1 / elite 4 / chefe 12 / chefe de Era 60 / captura 8) | `game-designer` — eu escolhi por coerência matemática, não por *feel* |
| Ancoragem das 10 Eras em horas creditadas | `game-economy-designer` / `raw/07` — eu **usei** os intervalos deles |
| A escada de XP virar inteira (BigInt) para consenso | `game-platform-architect` — é pré-requisito da chain, e afeta a calibração **agora** |
| Migração das ~48 contas / ~139 personagens sob o XP novo | `backend-architect` + `raw/09`; e a decisão A7 (Era Zero) do v1 |
| Ghost secundário e baú compartilhado (`players.chest_items`) | `raw/10` R-10 — um ghost secundário farmando não pode alimentar o Legacy Ghost |

---

## (f) RISCOS E O QUE NÃO CONSEGUI VERIFICAR

1. **Não medi o jogo rodando.** Os kills/hora de §2.2 são **[HIPÓTESE]**, ancorados em limitadores verificados (358 diamantes, teto de 5 vivos, 240 s por fase, 0,5 s por tiro) mas não cronometrados. **Dado que preciso que o dono autorize:** uma **conta descartável num banco de teste** (nunca produção) para rodar `http-server -p 8080` + Playwright e cronometrar (i) kills por minuto nas fases 1, 11, 22 e 33, (ii) tempo até o primeiro level-up, (iii) quantos spawns o teto de 5 vivos descarta. Sem isso, a calibração de `n₀` é uma estimativa razoável, não um número medido.
2. **Não varri os 220 KB de `engine.js` linha a linha.** Afirmo "duas fontes de XP" com base em grep por `addXp`, `gainXp`, `xpReward`, `\bxp\b` e `experience` em todos os arquivos carregados por `index.html`. Se existir um caminho que escreva `state.xp` direto sem passar por `addXp`, eu não o encontrei — e a varredura exaustiva é pré-requisito da Fase 2, como o `raw/05` já registrou.
3. **Não consultei o banco de produção.** A distribuição real de níveis das ~48 contas / ~139 personagens continua sendo um dado que só o dono pode autorizar. A consulta que eu rodaria: `SELECT level, xp, world_level FROM characters ORDER BY level DESC;` — para saber quantos personagens já passaram do ponto em que o farm de fase 33/CAVE1 os levou longe demais, e quanto custaria a Era Zero.
4. **A curva de saturação é minha proposta, não um padrão consagrado.** Ela é matematicamente sólida, mas o *feel* dela ("por que o 50º inimigo dá menos que o 5º?") é território do `game-designer`. Um jogador pode achar punitivo. A alternativa é um corte seco no teto, que é mais legível e mais frustrante.
5. **`n₀ = 13,35` é frágil ao ritmo real.** Se o jogador típico fizer 200 kills/h em vez de 90, o `n₀` certo é outro. Por isso **ele tem que ser constante configurável no servidor**, junto com o piso do Desenho C — e a recalibração precisa valer **daqui para frente**, nunca retroativamente (a regra do critério 11 do harness, `raw/10` R-09).
6. **O desenho C é o mais caro dos três** e depende de spawn autoritativo, que não existe hoje. Se o trabalho não couber, o recuo é começar pelo A — e a compatibilidade entre A e C é exata por construção.
7. **Os pesos por inimigo (1/4/12/60/8) são meus**, escolhidos para dar hierarquia clara. Não são resultado de cálculo — são **[HIPÓTESE]** de design, e o `game-designer` deve confirmá-los ou trocá-los (a matemática não muda: só renormaliza).
8. **Não validei o §5 contra o código do Bitcoin.** As cinco condições são requisitos matemáticos gerais de consenso; quem confere contra o `bitcoin/bitcoin` é o curador de chain.

---

## (g) PERGUNTAS AO DONO

**1. A fase 33 e a CAVE1 devem continuar dando muito mais XP que as outras?**
*Por que importa:* hoje elas multiplicam o XP por 666 e 500, e é isso que faz o jogo ser zerado em 41–77 horas. Se o multiplicador sair do XP, elas continuam sendo os lugares mais difíceis e mais lucrativos em loot — só deixam de ser um atalho de três ordens de grandeza.
*Opções:* (a) tirar o multiplicador do XP e manter no HP/dificuldade; (b) reduzir para ×3 ou ×4; (c) manter como está.
**Recomendo (a).** É a mudança isolada de maior impacto do relatório inteiro: sozinha, ela já leva o jogo de 0,21 ano para dezenas de anos.

**2. Quem joga mais rápido deve subir mais rápido? Quanto?**
*Por que importa:* é a única variável que decide entre "todos iguais" e "quem é bom é recompensado". A matemática não decide isso — é seu.
*Opções:* (a) todos iguais (Desenho A); (b) até **1,29×** de diferença (Desenho B com `n₀=13,35`); (c) mais que isso (ex.: 3×), aceitando que a data de chegada varie séculos entre jogadores.
**Recomendo (b).** 1,29× é sentido como "meu esforço conta" e custa só ~8 anos de diferença num horizonte de 1.121.

**3. Um jogador iniciante (ou uma criança, ou o herdeiro que nunca jogou) que cumpre a hora mas mata pouco deve ficar para trás?**
*Por que importa:* é a diferença entre o Desenho B e o C, e toca a "trava ética do se assim quiser" do plano v1 §1.4.
*Opções:* (a) sim, o XP é o XP (B puro); (b) não, existe um piso de 80% do orçamento se ele cumpriu a hora e fez ao menos 10 kills (C); (c) piso de 100% (na prática vira o Desenho A).
**Recomendo (b).**

**4. Itens e equipamentos poderão dar bônus de XP no futuro?**
*Por que importa:* hoje não existe nenhum. Sem orçamento diário, 7 peças com +25% dividem a data de chegada por 4,77 (de 1.121 para 235 anos).
*Opções:* (a) nunca; (b) sim, mas só como "chegar ao teto do dia mais rápido" — nunca aumentar o teto; (c) sim, livre.
**Recomendo (b).** Beneficia exatamente quem tem pouco tempo e não fura a régua.

**5. O XP acumulado (3,64e28) deve ser guardado no banco?**
*Por que importa:* o teto de validação é `xp: [0, 1e19]` e o modo de falha é **silencioso** — o campo é apagado e o valor antigo é preservado; o jogador congela sem ver erro.
*Opções:* (a) não guardar o acumulado — guardar `(nível, XP residual)` como hoje e derivar (**zero migração**); (b) guardar em `NUMERIC` do Postgres com teto ~1e29 e parser próprio (nunca `Number`).
**Recomendo (a)**, e subir o teto de `time` (hoje 1e8 = 3,17 anos, estoura em décadas) de qualquer forma.

**6. A escada de XP deve virar aritmética inteira (BigInt) já agora, pensando na blockchain?**
*Por que importa:* consenso entre nós exige o mesmo resultado bit a bit; `Math.pow` em float64 não garante isso. Mudar depois obriga a recalibrar contas vivas.
*Opções:* (a) sim, já nesta calibração; (b) depois, quando a chain começar (Episódio 2+); (c) decidir junto com o curador de chain.
**Recomendo (c)**, com um aviso: se a resposta acabar sendo "depois", registre por escrito que isso custará uma recalibração de todas as contas existentes.

**7. Confirma a revisão da decisão A4?**
*Por que importa:* o plano mestre v1 está escrito com "nível = função do tempo". Este relatório propõe "nível = função do XP, com o XP limitado pelo tempo".
*Opções:* (a) sim, revisar A4 para o Desenho C; (b) sim, mas para o Desenho B puro (sem piso); (c) manter A4 como está (o XP fica cosmético).
**Recomendo (a).**

