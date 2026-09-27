# 07 — Conteúdo, Eras, Escala dos Sistemas e Economia do Jogo Legado

**Papéis acumulados:** `game-designer` + `level-designer` + `game-economy-designer` · **Data:** 2026-09-20 · **Modo:** PLANO (nenhum arquivo do jogo foi alterado; scripts de cálculo ficaram só no scratchpad da sessão).
**Escopo (gaps do brief):** 6 (conteúdo e motivação por ~409.000 h, eras/marcos, fim do jogo), 10 (escala dos sistemas existentes), e a parte de conteúdo do 12 (MVP).
**Dependência aberta:** `raw/02_calibracao.md` (progression-actuary) **ainda não existia** quando escrevi. Por isso as Eras estão **ancoradas em tempo** (que é o que o brief fixa) e as faixas de nível aparecem como **três curvas candidatas**, sinalizadas. Se o 02 trouxer outra curva, só a coluna de nível muda — o resto do desenho não.

---

## Como ler (leia esta caixa antes do resto)

**Marcações** (as do brief): **[VERIFICADO]** = conferi no código/docs (arquivo citado). **[CÁLCULO]** = rodei em Node (script citado no Anexo A). **[HIPÓTESE]** = suposição minha sobre comportamento humano ou sobre um número que ainda não existe.

**Três curvas candidatas para o "odômetro" (o número do nível).** Uso as três como *lentes*, porque a curva definitiva é do actuary. Todas cumprem a régua do dono (1e11 em 409.538 h de tempo creditado, 1 h/dia):
- **CR — Potência pura.** `L(t) = 33 · t^1,689` (t em horas creditadas; nível 33 na 1ª hora, 1e11 no fim). É a "família" da curva atual do jogo.
- **CE — Abertura + cauda exponencial.** Abertura por âncoras até 1e6 no ano 25; depois **tempo constante por década** (219 anos por ordem de grandeza).
- **CP — Curva por Eras (meu pedido de design).** Cada Era recebe uma fatia de "décadas" do nível (1e3, 1e4, 1e5, 1e6, 6,3e6, 4e7, 2,5e8, 1,6e9, 1,3e10, 1e11 ao fim de cada Era), de modo que **toda Era muda a ordem de grandeza do odômetro**.

**Vocabulário alinhado com os relatórios já escritos** (01 filosofia, 03 sucessão, 05 integridade, 09 arquitetura): *Keeper* (Guardião), *Heir* (Herdeiro), *the Chronicle* (a Crônica), *the Legacy Ghost* (o ghost do legado), *the Handover* (a Passagem), *the Investiture* (a Investidura), *the Keystone* (zerar), *the Line* (a Linhagem), *the Commons* (as linhas abertas), *Roll Call* (a Chamada), *Renewal*, *Era Zero / First Keepers* (as ~48 contas de hoje). **Nada de streak** (Princípio 10 do 01).

**Vocabulário novo que eu proponho** (nomes in-game em inglês; PT para você):

| In-game (EN) | PT-BR | O que é, em uma linha |
|---|---|---|
| **Ring** | Anel | 365 horas creditadas da Linhagem (≈ 1 ano de régua). O Anel é contado em **tempo creditado**, não em calendário — assim um dia perdido não desalinha a história. |
| **Day Seal** | Selo do Dia | O fecho de uma sessão de 60 min creditados. **Contador acumulado** ("Days Kept"), nunca sequência. |
| **Movement** | Movimento | Cada 15 min de uma "hora completa" (4 por hora): Arrive, Descend, Tend, Seal. |
| **Odometer** | Odômetro | O número do nível, tratado como contador gigante (pedido do §8 do brief). |
| **Digit Milestone** | Marco de Dígito | Cada troca do dígito líder do odômetro (1e5, 2e5, 3e5 … 9e5, 1e6 …). 100 no total. |
| **Omen** | Presságio | Modificador do dia, sorteado no servidor pela data, igual para todo mundo. |
| **Vow** | Voto | Meta de mandato escolhida por cada Keeper; deixa uma marca permanente no mundo da Linhagem. |
| **Echo** | Eco | Retrato jogável de um Keeper anterior, gerado da Crônica. |
| **Mark** | Marca | Camada visual que cada Keeper acrescenta ao Legacy Ghost (anéis de árvore). |
| **Aspect** | Aspecto | Variação de Era de uma espécie (paleta + aura), colecionável. |
| **Lantern Oil** | Óleo da Lanterna | Segunda moeda: nasce do tempo (1 por Selo), não do nível; não infla. |
| **Reforge** | Refundir | Trazer uma peça herdada para a Era atual mantendo nome e inscrição. |
| **Era Pack** | Pacote de Era | Conteúdo de uma Era como **dados** (espécies, layouts, regras de Presságio, textos). |
| **Great Work** | Grande Obra | Projeto coletivo multigeracional da Era IX (a "catedral"). |

---

## (a) Resumo em 10 linhas

1. **O nível não pode ser a unidade de progresso que o jogador sente.** Sob qualquer curva que cumpra a régua, o crescimento relativo por sessão cai como `k/t`: sob CR é +0,46 % por sessão no fim do 1º ano e +0,0009 % no ano 500; e o dígito líder do odômetro fica parado por até **146 anos** (1e10→2e10) **[CÁLCULO]**. O odômetro vira rodapé/vaidade.
2. **A unidade sentida é uma escada de cinco degraus:** Selo (dia) → Anel (ano de tempo creditado) → Marco de Dígito → **Era** (a unidade macro) → Capítulo de Keeper (~25 anos). O nível é o odômetro; as Eras é que são vividas. As Eras são **ancoradas em tempo creditado**, então não dependem da curva.
3. **10 Eras** (The Wake, First Ring, Apprentice Years, Founder's Age, Inheritors, Cartographers, Deep Archive, Quiet Centuries, Great Work, Keystone Stretch), de 33 horas até 325 anos; **cada Era traz um verbo novo** (não só número maior), uma região, uma paleta, um chefe de Era e uma relíquia honorífica.
4. **Achado forte:** as 33 fases atuais cabem exatamente na **Era I = 33 horas creditadas** (1 episódio por hora), e as 4 faixas de espécies do Ghostdex (`ghost_inventory.js`) casam com as Eras I–IV **[VERIFICADO]**.
5. **A "hora completa"** são 4 Movimentos de 15 min (Arrive/Descend/Tend/Seal), fracionáveis, sem penalidade por faltar. A hora do dia 1 e a hora do ano 500 usam os mesmos quatro movimentos, mas com **verbos e sistemas diferentes**.
6. **Escala dos sistemas:** hoje os atributos, o gear plano e o Ghostdex quebram cedo (cap de AGI, `4+vit` vidas, `1+0,10·int` de duração; itens indexados por episódio 1–34, não por nível). Regra proposta: **"razão, não valor"** — todo efeito vira função da *fração* do orçamento de pontos, e o HP inimigo é derivado de um **tempo-para-matar (TTK) alvo**, não de `L^1,90` cru.
7. **Economia:** o único sumidouro (upgrade de arma, `100·1,15^tier`) **fossiliza**: ~100 compras na 1ª hora/dia, depois 1 compra a cada ~0,8 ano no ano 10, ~7,5 anos no ano 100 e ~36 anos no ano 500 **[CÁLCULO, K=1000 kills/h]**. Proponho **duas moedas** (Score que escala + Óleo da Lanterna que nasce do tempo) e sumidouros novos indexados à renda.
8. **Herança:** o que passa é a conta inteira (é o conceito); o **poder herdado é limitado por desenho** (tetos de %: elemental ×3,0, leech 25 %, CDR 40 %, mitigação 75 %), relíquias são **honoríficas** (alinhado com D12 do 03) e nada é transferível entre Linhagens.
9. **Fim de jogo em jogo:** Era X vira uma aproximação da Keystone (Limiar, Última Ronda, **o Coro** como chefe final feito de Ecos de todos os Keepers), e cada Linhagem coroada deixa um **Monumento jogável** (uma fase gerada da sua Crônica) — o fim vira conteúdo novo para os outros.
10. **Dev solo:** ~**333 h** de conteúdo autoral (**[HIPÓTESE]**) precisam render 409.538 h (esticamento de **~1.230×**), via seis mecanismos (Presságio, Estações, Aspectos, Ecos, Monumentos, Era Packs). O **Horizonte de Conteúdo** dá prazos reais: Era II em ~17–33 dias, Era III em 6–12 meses, Era IV em 2,5–5 anos. **MVP:** Era I completa + fatia da Era II + Odômetro/Selo/Anel/Crônica + Presságio v1 + as 8 Eras seguintes como "estrada visível" trancada.

---

## (b) Proposta detalhada

### B.0 — O que existe hoje (fatos que li no código, não presumo)

| Sistema | Como é hoje | Fonte | Consequência em escala astronômica |
|---|---|---|---|
| Curvas | `XPRequired = 100·L^1,45`; HP inimigo `baseHp·L^1,90·fase`; dano de arma `10·L^1,85·1,12^tier`; custo do tier `100·1,15^tier`; score por level-up `200·√L` | `rpg_system.js` (topo, `triggerLevelUpEffect`), `engine.js` `c_Boss`/`getPhaseMultiplier` **[VERIFICADO]** | Em L=1e11: HP 3,2e21, arma 2,2e21, **XP por kill 1,6e22 vs. degrau 8,9e17** ⇒ **1 kill ≈ 17.800 níveis** **[CÁLCULO]**. O "level-up" já não é um evento. |
| Pontos | 5 por nível, fixo; `points_to_distribute` em BIGINT; crescimento passivo por espécie `floor(B/65·(L−1)·0,6)` | `rpg_system.js` **[VERIFICADO]** | Em 1e11: 5e11 pontos livres; passivo do #001 ≈ 4,1e10 em vit. Cabe em 2^53 (9,0e15). |
| Efeito dos atributos | Vidas `4+vit`; barras de vitalidade `3+vit`; mana `100+20·mag`; duração do Ghost Mode `1+0,10·int`; dano de pulo `1+⌊pow/3⌋`; AGI: velocidade `min(agi·0,04; 0,40)`, pulo `min(agi·0,015; 0,15)` | `rpg_system.js` (`getMaxLivesCap`, `getMaxVitality`, `getMaxMana`, `getGhostDurationMultiplier`, `getBossJumpDamage`, `getModifiedSpeed`) **[VERIFICADO]** | Em 1e11: vidas 1e11, mana 2e12, duração ×1e10, dano de pulo 3,3e10 (10⁻¹¹ do HP do chefe) e AGI morto após 10 pontos. **Os 5 atributos perdem sentido.** |
| Dano ao jogador | **Discreto**: 1 hit = 1 de Vitalidade, mitigado por defesa (`def/(def+200)`, teto 75 %) | `engine.js` `takeDamage` **[VERIFICADO]** | **Boa notícia:** a habilidade de esquivar é a mesma no dia 1 e no ano 500. Só o lado numérico (DPS vs. HP do inimigo) escala. |
| Itens | 4 raridades (Common/Rare/Epic/Legendary), affixes ativos; **`iLvl` = número do episódio (1–34), não o nível do jogador** | `rpg_system.js` `LootGenerator.rollEnemyDrop` **[VERIFICADO]** | Item Legendary iLvl 34: baseDamage ≈ 65, defesa ≈ 43, atributos 27–54. Contra 5e11 pontos, o **valor plano vale ~10⁻¹⁰**. Já são escala-livres os bônus em %: aura elemental (teto ×3,0), leech (25 %), CDR (40 %), precisão (≤25 % da curva). |
| Elementos/categorias | 5 elementos (fogo/gelo/raio/veneno/arcano), matchup 1,5/1,0/0,5; 9 categorias em ciclo para o futuro PvP | `engine.js` `ELEMENT_MATCHUP`, `ghostdex_hierarchy.js` **[VERIFICADO]** | São **razões**: já são escala-livres. |
| Score | Por personagem (`characters.score`, `DOUBLE`, faixa [0, 1e16]); só sumidouro: upgrade de arma; **acoplado a spawns** (a cada 2.222 → ghost nativo; a cada 3.000 → slime) | `server/db.js` `NUMERIC_BOUNDS`; `engine.js` `AddScore` **[VERIFICADO]** | Os spawns saturam no teto de 5 chefes vivos (`SpawnNativeGhosts`, `SpawnBossAtRandomLocation`), então o acoplamento vira "sempre 5 alvos". Não trava, mas perde o sentido de marco. |
| Fases | 33 episódios + CAVE1; dificuldade **acompanha o nível do jogador**; fase 33 (666) e CAVE1 (500) fixas; segredos só nas fases 3, 6, 9, 13, 32; 10 fases (23–32) sem variedade de chefe | `engine.js`; `AAA_MASTER_PLAN_2026-09-15.md` **[VERIFICADO]** | As fases já são **biomas rejogáveis em qualquer nível** — ótimo para o legado. Falta variedade. |
| Overworld | Grid isométrico OSM real (Niterói): 3 chunks 85×85 de 10 m (Santa Rosa, Viradouro, São Francisco), 3 POIs (Torre/episódio 1, Cemitério/baú, Egregora/mural social) | `data/overworld/manifest.json`, `pois.json` **[VERIFICADO]** | Semente de "o mapa cresce com as Eras". |
| Ghostdex | 101 espécies; 5 elementos (arcano 21, os outros 20); 9 categorias (a "DeSo Primordial Entity" tem 3: #099–#101, totais 583–605, as mais fortes); **14 habitats = lugares reais de Niterói**; stats totais 250–605 | `ghostdex_data.js` **[VERIFICADO+CÁLCULO]** | Habitats = hubs de dungeon prontos. |
| Pools de captura | #001–030 em qualquer fase; #031–050 nas fases 20–30; #051–080 nas fases 31, 32 e CAVE1; #081–101 só na fase 33 | `ghost_inventory.js` `SpawnNativeGhosts` **[VERIFICADO]** | **Casa com Eras I–IV** (B.3.6). |
| Badges | O seed que li tem **320** (`exploracao` 50, `acrobacias` 40, `segredos` 33, `evolucao_assombrada` 100 [nível 5→1e11], `combate_espiritual` 47 [kills 100→1e7], `acumulador_do_alem` 50 [vidas 1.000→1e6 + 1 de itens]) | `server/seed_badges.js` **[VERIFICADO]** | O brief e o `CLAUDE.md` dizem **333**. **Diferença de 13 não explicada** (não consultei produção). |
| Mural e diário | Tabelas `egregora_messages` e `diary_entries`; baú de conta `chest_items` | `server/db.js` **[VERIFICADO]** | Bases prontas para Crônica e herança. |
| Monetização | **Nenhuma** no código | persona `game-economy-designer` **[VERIFICADO]** | Sem mercado → sem inflação entre jogadores; só "cadência de compra". |

> Nota de escopo: `LORE.md` ainda descreve a DeSo como mecânica. Não usei nada dele. Usei `SALVAGED_LORE_2026-09-16.md` (sem DeSo). O reino "Lugar Nenhum" é o cenário do jogo; **não confundir** com o projeto da exposição de mesmo nome (regra do `CLAUDE.md` do workspace).

---

### B.1 — A unidade de progresso que o jogador SENTE (resposta ao §8 do brief)

#### B.1.1 Diagnóstico, com números

O brief mostrou que a média é ~244.000 níveis por hora (0,0147 s por nível) **[CÁLCULO, eras_calc.js]**. O que eu acrescento é *como isso se sente ao longo do tempo*. Para uma curva suave, o ganho relativo por sessão de 1 h é `k/t` (t em horas). Tabela **[CÁLCULO]**, três curvas:

| Métrica | CR (potência) | CE (abertura+exponencial) | CP (por Eras) |
|---|---|---|---|
| Nível na 1ª hora / 33 h / 1 ano | 33 / 1,2e4 / 7,0e5 | 33 / 1e3 / 1e4 | 33 / 1e3 / 1e4 |
| Nível no ano 25 / 100 / 500 / 1000 | 1,6e8 / 1,7e9 / 2,6e10 / 8,2e10 | 1e6 / 2,2e6 / 1,5e8 / 2,8e10 | 1e6 / 1,0e7 / 5,4e8 / 1,3e10 |
| Crescimento por **Anel** no ano 25 / 100 / 500 / 1000 | 6,9 % / 1,7 % / 0,34 % / 0,17 % | ≥ 1,05 % constante na cauda | 3,8 % / 1,9 % / 0,6 % / 1,7 % |
| Crescimento por **sessão** no ano 1 | +0,46 % | (abertura) | (abertura) |
| Última "década" do nível ocupa | **74 %** do tempo total (a 1e10→1e11 leva 835 anos) | 19,6 % (219 anos) | 14,1 % (158 anos) |
| Maior intervalo entre Marcos de Dígito | **146 anos** (1e10→2e10) | 66 anos | 111 anos (1e9→2e9) |
| Marcos de Dígito por Era (I…X) | 37·15·12·9·9·3·6·3·4·2 | (concentra na cauda) | 28·9·9·9·5·6·8·8·9·9 |
| Badges de nível atuais (100) já abertas em 33 h / no Anel 1 | **67 / 75** | 45 / 67 | 46 / 67 |
| Badges de nível que só abrem depois do ano 100 / 500 | 11 / 5 | 23 / 15 | 20 / 13 |

**Leitura honesta.** Nenhuma forma escapa disso: como o tempo total é fixo (1.122 Anéis) e as primeiras casas decimais precisam andar rápido (dia 1 tem que parecer um RPG), as últimas casas têm de andar devagar. O **dígito líder do odômetro vai ficar parado por décadas**; só os dígitos da direita giram (a taxa absoluta chega a 4e5 níveis/hora no fim). Um humano percebe o dígito líder, não os últimos. Logo: **o odômetro sozinho não sustenta 1.100 anos.** Isso é uma conclusão de design, não de cálculo, e vale para qualquer curva.

**Segundo achado incômodo.** A escada atual de 100 badges de nível foi desenhada para a curva antiga: sob CR, **67 das 100 abrem nas primeiras 33 horas** e só 5 abrem depois do ano 500. Como conquista de longo prazo ela é inútil; precisa ser re-espaçada (B.3.5).

#### B.1.2 A resposta: cinco escalas, cada uma responde a uma pergunta

| Escala | Pergunta que responde | Unidade | Quando muda (1 h/dia, referência) | Onde aparece |
|---|---|---|---|---|
| **Selo** | "Como foi hoje?" | Day Seal (60 min = 4 Movimentos) | todo dia | Fecho da sessão; entrada automática na Crônica |
| **Anel** | "Estou avançando este ano?" | Ring (365 h creditadas) | a cada ~1 ano | Retrato do Ano; 1 relíquia menor; capítulo do ano |
| **Marco de Dígito** | "O odômetro andou?" | 1e5, 2e5 … 1e11 (100 no total) | de dias (início) a décadas (fim) | Toast + linha na Crônica |
| **Era** | "Onde estamos na história?" | 10 Eras | de 33 dias a 325 anos | Muda a região, o verbo, a paleta, o chefe |
| **Capítulo** | "Qual foi o meu papel?" | Mandato do Keeper (~25 anos) | a cada Passagem | Capítulo na Crônica (03 §C) |

O **Odômetro** continua na tela, sempre formatado (K/M/B/T/Qa/Qi já existe em `formatBigNumber`), mas é um **instrumento**, não a meta.

#### B.1.3 As regras que ligam (a), (b) e (c) do §8

- **(a) Unidade sentida = Era (macro) + Anel (micro).** A tela do Keeper (a "Visão do Guardião" do 03 §4.3) fala em *Era* e *fração do caminho*, não em "Nível 3.412.887.104".
- **(b) Como o nível se liga a ela:** o **nível é derivado** do tempo creditado (05 §3: "o nível do legado vem do tempo ativo creditado pelo servidor"), e **as Eras são definidas em tempo creditado**, não em nível. Assim a curva pode ser recalibrada (03/09 já prevê `curve_version`) sem redesenhar Era nenhuma. Consequência prática: **o conteúdo nunca depende de qual curva o actuary escolher.**
- **(c) Curva sem primeiros dias voando nem séculos parados:** ver B.1.4-R.

**B.1.4-R — Requisitos que o design faz à curva (pedido ao `progression-actuary`):**

| # | Requisito | Por quê |
|---|---|---|
| R1 | Nível ≈ **33 na 1ª hora** e nível ≥ 1e3 ao fim da Era I (33 h) | O dia 1 precisa parecer um RPG; 33 é o teto da antiga Saga |
| R2 | **Toda Era a partir da V cruza ≥ 0,8 década** do odômetro | Cada Era troca a ordem de grandeza (sufixo K/M/B/T); cada Era ganha ≥ 5 Marcos de Dígito |
| R3 | Nenhum intervalo entre Marcos de Dígito > ~120 anos | Evita "séculos parados" no dígito líder; CP dá 111, CE 66, CR 146 |
| R4 | Fronteiras de Era em **tempo creditado** (Anel), não em nível | Independência da curva |
| R5 | Teto de crédito diário ≤ ~1,25 h sustentadas (05 §3.6 opção iii: 1 h/dia + banco de 7 dias) | Sem isso a Era X chega antes do conteúdo (Horizonte, B.6) |
| R6 | Limite numérico: `score` (faixa [0, 1e16]) e 2^53 | Custo de tier > 2^53 já no tier **230** **[CÁLCULO]** |

**Meu voto:** CP como *alvo*, CE como *plano B*, CR só se o actuary provar que os outros violam algo mais importante. A escolha final é do 02.

#### B.1.4 As 10 Eras — tabela temporal

Fronteiras em **anos de régua** (= Anéis de 365 h). Duração em horas creditadas. Gerações = 25 anos (9.125 h). O total é **409.538 h = 1.122 Anéis** (o brief usa 1.121,28 anos de calendário, por causa dos anos bissextos; a diferença é de 0,06 %). **[CÁLCULO, eras_calc.js]**

| Era | Nome (EN / PT) | Anéis (início→fim) | Horas (dur.) | Anos | Gerações | % do total | Keeper nº | Nível ao fim: CR / CE / **CP-alvo** |
|---|---|---|---|---|---|---|---|---|
| I | **The Wake** / O Despertar | 0 → 0,09 | 33 | 0,09 | — | 0,01 % | #1 | 1,2e4 / 1e3 / **1e3** |
| II | **The First Ring** / O Primeiro Anel | 0,09 → 1 | 332 | 0,9 | 0,04 | 0,08 % | #1 | 7,0e5 / 1e4 / **1e4** |
| III | **The Apprentice Years** / Os Anos de Aprendiz | 1 → 5 | 1.460 | 4 | 0,16 | 0,36 % | #1 | 1,1e7 / 1e5 / **1e5** |
| IV | **The Founder's Age** / A Era do Fundador | 5 → 25 | 7.300 | 20 | 0,8 | 1,8 % | #1–2 | 1,6e8 / 1e6 / **1e6** |
| V | **The Inheritors** / Os Herdeiros | 25 → 75 | 18.250 | 50 | 2 | 4,5 % | #2–4 | 1,0e9 / 1,7e6 / **6,3e6** |
| VI | **The Cartographers** / Os Cartógrafos | 75 → 175 | 36.500 | 100 | 4 | 8,9 % | #4–8 | 4,3e9 / 4,8e6 / **4e7** |
| VII | **The Deep Archive** / O Arquivo Profundo | 175 → 375 | 73.000 | 200 | 8 | 17,8 % | #8–16 | 1,6e10 / 3,9e7 / **2,5e8** |
| VIII | **The Quiet Centuries** / Os Séculos Quietos | 375 → 675 | 109.500 | 300 | 12 | 26,7 % | #16–28 | 4,2e10 / 9,2e8 / **1,6e9** |
| IX | **The Great Work** / A Grande Obra | 675 → 1.000 | 118.625 | 325 | 13 | 29,0 % | #28–41 | 8,2e10 / 2,8e10 / **1,3e10** |
| X | **The Keystone Stretch** / O Trecho da Pedra Angular | 1.000 → 1.122 | 44.538 | 122 | 4,9 | 10,9 % | #41–45 | 1e11 / 1e11 / **1e11** |

Por que estas fronteiras: I = **um mês** (33 dias, o hábito); II = **o primeiro ano** (1 Anel); III = **cinco anos** (aprendizado); IV = **a primeira geração** (25 anos: a vida do Fundador); depois as Eras alargam por múltiplos de gerações (2, 4, 8, 12, 13, 5). Um Keeper de ~25 anos vive **1 a 2 fronteiras de Era** no início e **menos de uma** a partir da Era VI (cada Era passa a durar 4+ mandatos). É por isso que Anel e Capítulo existem: entre Eras, o Keeper precisa de marcos próprios.

**A coluna de nível é ilustrativa.** Note o contraste: sob CR as Eras VIII–X cruzam só 0,43/0,29/0,08 década (odômetro quase parado); sob CE as Eras V–VI cruzam 0,23/0,46; a CP é o meu pedido para nenhuma Era ficar abaixo de ~0,8 década a partir da V.

#### B.1.5 As 10 Eras — o conteúdo (verbo, região, estética, relíquia, chefe, marco emocional)

Cada Era acrescenta **um verbo novo** (uma coisa nova que o jogador *faz*), não só número maior. É o principal antídoto contra a monotonia (B.2.4). **Chefes de Era usam o que já existe** onde possível (5 tipos de chefe: crow, skull, cactus, demon_fly, slime; e a lore de `SALVAGED_LORE_2026-09-16.md` §4). Toda relíquia de Era é **honorífica** (`relic_type = 'era_marker'`, tabela `relics` do 09 §1.6): sem poder, sem valor de mercado.

| Era | **Verbo novo** | Região / mapa | Estética (paleta de Era) | Chefe de Era | Relíquia honorífica | Marco emocional |
|---|---|---|---|---|---|---|
| I | **Mover, pular, atirar, capturar** (o que existe hoje) | As 33 fases + CAVE1; Torre da Rua Dr. Beltrão | Neon-noir 8-bit atual (magenta/ciano) | **The Thirty-Third** (chefe da fase 33, valores fixos 666, já existe) | *Lantern of the Wake* | "Eu consigo. Eu pertenço a isso." |
| II | **Runas, elementos, forja** | Overworld atual: Santa Rosa, Viradouro, São Francisco + Cemitério + Egregora | + laranja de sódio (poste de rua ao entardecer) | **The Colossal Skull** (CAVE1, já existe) com fases | *First Ring Band* | "O jogo tem profundidade." Fecha o 1º Anel |
| III | **Coletar e nomear** (Ghostdex em capítulos, Acervo) | Niterói inteira via pipeline OSM + os 14 habitats reais como hubs | + verde de neon de farmácia | **Cactus, the Corrupted Sentinel** (lore resgatada) com telégrafo de ataque | *Ledger of Names* | "Eu tenho um mundo inteiro para conhecer." |
| IV | **Legar** (Carta Selada, Vestíbulo, Renovação, 1ª Passagem) | Travessia Niterói–Rio (barcas); a "Sala do Fundador" | + âmbar de papel velho | **The Primordial Trio** (#099 Vultowraith, #100 Aerovoid, #101 Becoshade: as três espécies mais fortes) | *Founder's Key* | "Isto vai continuar sem mim." |
| V | **Encontrar Ecos** (jogar com/contra retratos dos antepassados) | A **Galeria dos Guardiões** (03 §5.2) cresce sala a sala; a Casa da Linha | + azul-noite de arquivo | **The First Echo** (Eco do Keeper #1, gerado da Crônica) | *Generation Token* (1 por Passagem) | "Eu sou um elo, não o começo." |
| VI | **Mapear** (adotar cidades; Expedições do Acervo) | Rio de Janeiro e cidades escolhidas por cada Keeper (dados OSM); dungeons geradas da malha viária | + vermelho de semáforo, mapa quente | **The Uncharted** (chefe gerado de um bairro real) | *Map Plate* | "Meu nome está no mapa." |
| VII | **Escavar** (arqueologia da Crônica, espécies "apagadas" a restaurar) | Camadas subterrâneas (MAC "Deep Underground" e afins) | Sépia + ciano de tela CRT | **The Archivist** (chefe-enigma narrativo) | *Lost Page* | "O passado está vivo e tem segredos." |
| VIII | **Cuidar de ciclos** (Estações, Deriva das espécies, Projetos de Voto lentos) | Costa Quieta: biomas por estação | Tons frios, pouca saturação | **The Long Tide** (chefe sazonal de vários dias) | *Tide Chart* | Paz. "Não preciso correr." |
| IX | **Construir juntos** (Grande Obra coletiva das Linhas) | O canteiro da Grande Obra (Commons) | Dourado de obra, andaimes de neon | **The Unfinished** (chefe que só cai com contribuições de várias Linhas) | *Mason's Mark* | "Estou construindo algo que não verei pronto." |
| X | **Encerrar** (reacender lâmpadas, Limiar, Última Ronda) | Galeria dos Guardiões completa; o Limiar | Ouro pálido, quase monocromático | **The Chorus** (o Coro: Ecos de todos os Keepers; ver B.5) | *Keystone Stone* (a pedra de fecho, 03 §5.3) | Gratidão e fecho. |

Notas de desenho, em uma linha cada:
- **Era I é a Saga de 33** e é *quase toda conteúdo que já existe*. O trabalho novo é esticar cada fase para ~1 h de jogo rico (B.2.5).
- **A paleta de Era** é um filtro de cor por Era (custo de arte baixíssimo) e dá "sensação de lugar" sem assets novos.
- **Camadas de ritmo (Brand, 01 Princípio 6):** o *bedrock* (regras de combate, 5 elementos, 9 categorias, defesa) **não muda entre Eras**; a *superfície* (Presságios, Aspectos, regiões, textos) muda. Nunca introduzir um 6º elemento no meio da história: quem aprendeu o ciclo em 2026 precisa poder jogar em 2500.
- **Ghost do Legado fixo** (#001 Polterstalk no MVP, D17 do 03).

---

### B.2 — O que se FAZ em 1 hora (dia 1, ano 500) e como evitar monotonia por séculos

#### B.2.1 A "hora completa": 4 Movimentos de 15 minutos

Alinhado com 05 (tempo ativo creditado pelo servidor, teto diário) e 01 (Princípio 10: o dia basta por si, sem streak). Uma hora completa **é** 60 min creditados, **fracionável** (4 × 15 min em blocos separados no dia, útil para pai/mãe trabalhando, criança, idoso).

| Movimento | Min | O que é | Por que existe |
|---|---|---|---|
| **1. Arrive** (Chegar) | 15 | Vigia da Torre: resumo da Crônica em 60 s (03 §C), Presságio do dia, Estação do mundo, situação do Voto. Depois já cai na Descida. | Orientação e sentido ("onde eu estou na história?"). Trabalha a Perna 3 (pertencer). |
| **2. Descend** (Descer) | 15 | O laço central de combate: uma **Descida** (fase reaproveitada + Presságio + Aspecto da Era). | Competência sentida hoje (Perna 1). Onde o odômetro gira. |
| **3. Tend** (Cuidar) | 15 | A "decisão": distribuir pontos, equipar, forjar, capturar/nomear, contribuir para um Voto/Grande Obra, despachar Expedição do Acervo. **Muda de verbo por Era.** | Autonomia e generatividade (Perna 2). É onde o jogo deixa de ser só reflexo. |
| **4. Seal** (Selar) | 15 | Um **evento de fecho**: chefe/Provação do dia ou da Estação; depois o jogo redige uma linha da Crônica e o Keeper pode reescrever (140 caracteres). | Fecho diário ("o dia bastou") e memória. |

Regras: (i) **sem streak, sem cobrança**, só o contador acumulado de Selos ("Days Kept") e a mensagem "Você não precisa jogar hoje" (03); (ii) meia hora também vale (crédito proporcional, 05); (iii) o odômetro sobe no Movimento 2 e 4, mas **o Selo mostra Era/Anel**, não o nível.

#### B.2.2 Dia 1, hora 1 (Era I, Episódio 1) **[HIPÓTESE de desenho]**

| Min | Movimento | O que acontece |
|---|---|---|
| 0–5 | Arrive | Login; a conta nasce com o **Ghost #001 Polterstalk** (já existe, `createPlayer`); página 1 da Crônica: *"Você é o primeiro Guardião desta Linhagem. Algum dia alguém pode continuar."* (03 §4.4). Tutorial de movimento/pulo/tiro (já existe). |
| 5–15 | Arrive→Descend | 1ª Descida: Episódio 1. Kills, level-ups em rajada (o odômetro gira de 1 a ~10). |
| 15–35 | Descend | Episódio 1 completo; **chefe Crow** (existe); 1º drop de item; 1º Aspecto/captura garantida da faixa #001–#030 (o "Visitante do Dia"). |
| 35–50 | Tend | Botão de alocação em massa (já existe `allocateAttributeBulk`); equipar o 1º item; 1ª compra de arma (custo 100). |
| 50–60 | Seal | Selo do Dia 1 de 33; a Crônica escreve a 1ª linha; o Episódio 2 abre amanhã; **nível ≈ 33** (R1) e ~6 badges de nível abertas **[CÁLCULO CR]**. |

Meta de sensação: *"em uma hora eu joguei um jogo inteiro e já sei o que fazer amanhã."*

#### B.2.3 Ano 500, uma hora (Era VIII, Anel 500, Keeper nº 21, Estação de Águas Baixas) **[HIPÓTESE de desenho]**

| Min | Movimento | O que acontece |
|---|---|---|
| 0–15 | Arrive | Vigia: resumo de 60 s da Crônica; *Dia 212 do Anel 500*; Presságio "Gelo × Eco do Passado × Maré Lenta"; o Voto herdado do Keeper #19 ("Restaurar a Estação Charitas") está em 41 %. |
| 15–30 | Descend | Uma Descida com **Aspecto da Era VIII** e **Deriva**: os traços das espécies mudaram ao longo das gerações (efeito das capturas dos antepassados). O odômetro gira, mas o dígito líder não muda há décadas — e tudo bem, ele é rodapé. |
| 30–45 | Tend | Trabalho lento e visível: pagar Score/Óleo para a obra do Voto; despachar uma Expedição de 2 Acervos; **Refundir** uma arma herdada para a Era atual (mantendo a inscrição do Keeper #7). |
| 45–60 | Seal | Provação da Estação (a *Long Tide*, chefe de várias sessões); linha da Crônica: o jogo escreve *"Dia 212: a maré recuou 3 %."* e o Keeper pode acrescentar a sua. |

O mesmo esqueleto de 4 Movimentos, mas **a mecânica do Movimento 3 mudou de verbo** (de "distribuir pontos" na Era I para "cuidar de ciclos e obras" na Era VIII), e a Descida **já não é a mesma Descida** (Deriva, Aspecto, Presságio).

#### B.2.4 A hora de um **Herdeiro** que nunca jogou (Era V, ~L 1e9 sob CR)

Fecha o ponto que o 03 §4.3 deixou aberto para o `game-designer` ("dificuldade e conteúdo do nível 4e9"). **Rampa do Herdeiro** (**[HIPÓTESE]**): (i) o combate é **normalizado por TTK** (B.3.2), então a dificuldade *sentida* de uma Descida no nível 1e9 é a mesma de uma Descida no nível 33 — o novato não é esmagado; (ii) ele joga primeiro com o **Ghost Aprendiz** (nível 1, sem crédito de horas, 03) e faz a **Reciclagem** (uma Descida-tutorial de 15 min que reapresenta controles, runas e Presságio); (iii) a "configuração recomendada" de um botão reorganiza mochila e pontos; (iv) só então "acende a lanterna". O primeiro Selo de um Herdeiro pode ser de 15 min, sem culpa.

#### B.2.5 Esticar a Era I: de 33 minutos para 33 horas **[HIPÓTESE]**

Hoje as 33 fases levam < 1 h no total (AAA 16/09: fase 33 em "menos de uma hora"). Para cada episódio render **~1 h creditada**, sem enrolar:
1. **Três atos por episódio:** Descida (o mapa), Chefe (com fases, telégrafo, item do episódio), **Caça** (segredos + os 5 segredos nas fases 3/6/9/13/32 + coleta).
2. **TTK alvo** (B.3.2) em vez de barras de HP que esvaziam sozinhas.
3. **Desbloqueio de fase por hora creditada**, não por vitória: Episódio *k* abre com a hora *k−1* (k = 1…33). Quem quiser jogar mais, **rejoga** as fases abertas (sem crédito extra).
4. **Variedade de chefe** nas fases 23–32 (achado aberto desde 15/09): entram os chefes com fases e o ciclo de elementos.

#### B.2.6 Como evitar monotonia por séculos (profundidade vs. repetição)

Princípio: **escrever regras, não conteúdo**. O desenho tem sete alavancas, cada uma em uma escala de tempo diferente:

| Alavanca | Escala | Como varia | Capacidade **[CÁLCULO]** |
|---|---|---|---|
| **Presságio diário** | dia | Elemento (5) × categoria (9) × modificador (12) × habitat (14) = **7.560** combinações, × 10 Aspectos de Era = 75.600 | Cada combinação se repete ~5,4× ao longo do jogo; dentro de uma Era longa (VIII) ~14× — mas nunca em dias seguidos |
| **Estações (relógio do mundo)** | trimestre | 4 por ano; cada Estação tem um conjunto de regras e uma Provação sazonal | 4.484 Estações no total; **calendário é o único conteúdo que bot e speedrun não compram** (skill `legacy-pacing-calibration`) |
| **Anel** | ano | Retrato do Ano, relíquia menor, capítulo | 1.122 Anéis |
| **Voto do Keeper** | mandato | 3 Votos oferecidos na Investidura, escolhidos da história da Linha (Restaurar / Explorar / Lembrar) | ~45 Votos; cada um deixa **estado no mundo** (região restaurada/selada) que os sucessores herdam ou revertem |
| **Marcas e Ecos** | geração | Cada Keeper acrescenta uma **Marca** ao Legacy Ghost e gera um **Eco** jogável | 45 Marcas visíveis (anéis de árvore: o ghost *é* o livro) |
| **Espécie da Geração** | geração | Cada Passagem cria **1 espécie nova** (composição procedural de partes + paleta a partir do estilo do Keeper) e a adiciona ao Ghostdex de todos | 101 → **146** espécies |
| **Era Pack** | Era | Verbo novo + região + paleta + chefe | 10 pacotes; formato aberto (B.6) |

**Profundidade** (o que dá habilidade e escolha) mora em: ciclo elemental de 5 + matchups de 9 categorias, gerenciamento de Mana/CDR, o ritmo de esquiva, o Voto e a build (razão entre atributos, não números). **Repetição** (o que se aceita) mora na Descida, que é o "instrumento" e não precisa ser inédita todo dia.

---

### B.3 — Escala dos sistemas existentes quando o nível é astronômico

#### B.3.1 Princípio geral: "razão, não valor"

Dois números não podem coabitar: 54 (atributo de item) e 5e11 (pontos livres). Regra: **todo efeito tem que ser função de uma razão** (fração do orçamento, fração do HP esperado, %) e todo valor plano que hoje existe vira fração:

- O **orçamento de pontos** de um personagem é `5·(L−1)` (+ passivo da espécie). Um item que hoje dá "+10 POW" num personagem de orçamento ~165 passa a dar **+6 % do orçamento** (10/165), com piso igual ao valor atual para L ≤ 33. Item continua valendo "o mesmo *para o personagem*" em qualquer Era.
- **Poder de gear já é limitado por teto**: elemental ×3,0, leech 25 %, CDR 40 %, mitigação 75 %, precisão ≤ 25 % da curva **[VERIFICADO]**. Isso é a defesa natural contra "herança que vira vantagem injusta" (B.4.5): o gear herdado **não pode passar do teto**, por mais gerações que acumule.

#### B.3.2 HP, dano e tempo-para-matar (TTK)

**Problema.** Com as fórmulas de hoje o jogador fica cada vez mais forte *relativamente* ao inimigo: o dano cresce `L^1,85 · 1,12^tier` e o HP `L^1,90`. Simulando a compra de tiers **[CÁLCULO, econ_sim.js, K=1000 kills/h, curva CR]**, o "excesso de dano sobre HP" relativo ao dia 1 é **3,5e4 ao fim da Era I e 2,0e10 ao fim da Era X**. Em linguagem simples: o chefe que leva 20 s no dia 1 leva **10⁻⁹ s** no ano 1100. Sem TTK controlado o combate acaba antes de começar.

**Regra proposta.** `HP_inimigo(L, Era, classe) = DPS_ref(L, T_ref(Era)) × TTK_alvo(classe, episódio)`, onde `DPS_ref` usa o tier **esperado** da Era (não o real) e o TTK alvo é fixo por classe:

| Classe | TTK alvo (jogador na curva) | Observação |
|---|---|---|
| Inimigo comum | 1–3 s | Constante em todas as Eras |
| Mini-chefe | 20–40 s | Fator de fase `1 + (n−1)·0,05` (fase 32 ≈ 2,55×) vira **multiplicador de TTK**, não de HP |
| Chefe de Era | 3–5 min, com fases | Fase 33 e CAVE1 seguem valores fixos especiais (não tocar) |
| Provação sazonal | várias sessões | Barra de progresso coletiva |

`T_ref(Era)` (exemplo, **[CÁLCULO]**, K=1000, CR): tier esperado ao fim das Eras I…X = 95, 126, 148, 169, 183, 194, 205, 212, 217, 219. **Números e constantes finais são do `game-designer` de implementação + actuary**; o que fixo aqui é a *regra*: o combate é balanceado por tempo, o número é consequência.

Bônus honesto: como o dano recebido é **discreto** (1 hit = 1 de Vitalidade), a habilidade de esquiva não precisa ser rebalanceada. Só o "lado ofensivo" precisa da regra de TTK.

#### B.3.3 Atributos e pontos (`points_to_distribute` enorme)

| Atributo | Sintoma em 1e11 **[CÁLCULO]** | Proposta (fórmula que preserva o valor atual para o início) |
|---|---|---|
| **VIT** | `4+vit` vidas e `3+vit` barras = 1e11 (imortal, HUD impossível) | Barras `3 + soft(vit, 10)`; vidas `4 + soft(vit, 20)`, com `soft(a, s) = a se a ≤ s; senão s + s·ln(a/s)`; **teto duro de 30 barras visíveis** e o excedente vira **mitigação em %** (dentro do teto de 75 %) |
| **AGI** | Teto matemático em 10 pontos (já morto hoje) | Depois do teto, cada ponto extra reduz **CDR** de skills (dentro do teto de 40 %) ou concede **mais uma esquiva/dash** por marco (segundo efeito, já sugerido em AAA 16/09 §8) |
| **INT** | Duração de Ghost Mode `1+0,10·int` ⇒ ×1e10 | `1 + 0,10·soft(int, 30)`; o resto vira regeneração de mana em **fração** |
| **POW** | Dano de pulo `1+⌊pow/3⌋` = 3,3e10 vs. HP 3,2e21 | Dano de pulo vira **% do dano de arma**: `weapon.damage × (0,05 + 0,25·R_pow)`, onde `R = pontos_no_atributo / orçamento_de_pontos` |
| **MAG** | Mana `100+20·mag` = 2e12 ⇒ casts infinitos | Mana medida em **"casts"** (número de feitiços disponíveis), `6 + soft(mag/…, …)`; o custo do feitiço fica constante em casts |

A ideia-mãe: **razão de investimento** `R_a = a / (5L)` (fração do orçamento livre posta no atributo, ~0 a ~1). O jogador continua fazendo *escolhas de build* (o vetor `[R_vit, R_agi, R_int, R_pow, R_mag]`), e esse vetor é **independente de escala** (também serve de base para o PvP, B.3.7). **Alocação em massa** já existe; a UI deve virar **presets de build** (5 sliders somando 100 %) — trabalho de `ui-ux-designer`.

*Numericamente:* 5e11 pontos e passivos de ~4e10 cabem folgadamente em 2^53 (9,0e15) **[CÁLCULO]**. O problema não é de tipo, é de **sentido**.

#### B.3.4 Itens: raridades, affixes e novos "tiers por Era"

1. **Manter** as 4 raridades e os affixes atuais como *bedrock*.
2. **`iLvl` deixa de ser o número do episódio** (hoje 1–34) e passa a ser derivado da **Era da Descida** (1–10); os valores planos viram razões (B.3.1).
3. **Selo de Era (Era Stamp):** cada item guarda a Era em que foi forjado. Isso **não dá poder**: dá *história* e habilita **Refundir** (B.4.4) — o item antigo continua útil (mantém nome e inscrição) mas volta a valer o mesmo que um novo. Isso evita power creep por Era (que exigiria conteúdo novo eternamente) e transforma "o avô deixou a espada" em algo vivo.
4. **Novos tiers por Era?** Recomendo **não** criar cores novas a cada Era. Em vez disso, cada Era ganha **1 família de affixes temática** (ex.: Era VI "Cartographer's": +X % de alcance de Expedição; Era VIII "Tide": efeito sazonal) e **1 item-assinatura** de Era (a relíquia honorífica). Poder fica dentro dos tetos.

#### B.3.5 Badges (320 no seed; 333 citadas): como continuam relevantes

| Família | Estado hoje | Proposta |
|---|---|---|
| `evolucao_assombrada` (100, nível 5→1e11) | 67/100 abrem em 33 h (CR) | **Trocar os valores** por **Marcos de Dígito** (1..9 × 10^n, n = 0…10, + 1e11 = **exatamente 100** valores). Mesma quantidade e mesmas colunas; só muda `requirement_value`. Sob CP: 28·9·9·9·5·6·8·8·9·9 por Era |
| `combate_espiritual` (47, kills 100→1e7) | Termina cedo: com K=1.000 kills/h, 1e7 kills = 10.000 h ≈ ano 27 | **Estender a escada** (1e8, 1e9, …) ou, mais durável, **kills por Era** (10 badges). **[HIPÓTESE dependente de K]** |
| `acumulador_do_alem` (50, vidas 1.000→1e6) | Idem: tende a acabar cedo | Mesmo tratamento; alinhar com o teto de vidas (B.3.3) |
| `exploracao`/`acrobacias`/`segredos` (123, habilidade) | Perenes (`level_time_*` "quanto menor melhor") | **Manter**: são habilidade, não tempo. Com TTK constante ficam comparáveis entre Eras |
| **Novas** | — | **Era Marker** (10), **Ring** (1 a cada 10 Anéis: ~112), **Keeper** (feitos de mandato: Passagens, Votos), **Eco/Provação** (Echo Trials), **Aspecto** (por espécie × Era), **Estação** (sazonais) |

Badge pertence à **conta/Linhagem** (chave `email` hoje; `account_id` no 09), então passa com a herança. O crédito *pessoal* de cada Keeper vive na **Crônica**, não em badge (evita "ranking pessoal sobrevive à troca de Guardião", regra de ouro do 03 §5.4b). *Migração:* contas com badges já ganhas as mantêm (Selo de Pioneiro, 09).

#### B.3.6 Os 33 episódios/dungeons e o Ghostdex (101 espécies)

**Episódios.** Reaproveitados de três formas: (1) **Era I** (a Saga de 33 h); (2) depois, como **biomas de Descida** no Movimento 2, recombinados com Presságio + Aspecto de Era; (3) cada Era acrescenta *tipos* novos de dungeon (Era III: dungeons dos 14 habitats reais; Era VI: dungeons geradas da malha viária OSM; Era VII: camadas subterrâneas).

**Ghostdex — quanto tempo leva hoje.** Por *coupon collector* **[CÁLCULO, misc_calc.js]** sobre os pools do código: ~120 + 180 + 240 + 186 = **~725 spawns** para ver as 101; a 100 kills/h são **7 h**, a 1.000 kills/h **0,7 h**. Ou seja, o Ghostdex inteiro acaba na **Era I**. Ruim para 409.000 h.

**Proposta: capítulos por Era.** Os 4 pools que já existem viram **os 4 primeiros capítulos**, sem mudar a lógica de ids:

| Capítulo | Espécies | Era | Regra de descoberta |
|---|---|---|---|
| 1 | #001–#030 (30) | I (33 dias) | **1 por dia, determinístico**, o "Visitante do Dia" (sem sorteio, hábito) |
| 2 | #031–#050 (20) | II (1º Anel) | Visitante do Dia + captura em fases 20–30 |
| 3 | #051–#080 (30) | III (Anos de Aprendiz) | Visitante sorteado (~1,4 Anel para o conjunto completo, 525 dias) |
| 4 | #081–#101 (21, incluindo o **Trio Primordial**) | IV (Era do Fundador) | Raridade por `stats_base.total` + "pity timer" |

Resultado: **Ghostdex de 101 completo no fim da primeira geração** (~ano 25): um marco do Fundador. Depois o Ghostdex não acaba; ele **cresce por três eixos**:
- **Aspecto de Era:** 101 espécies × 10 Eras = **1.010 Aspectos** (paleta + aura; custo de arte ~zero).
- **Espécie da Geração:** +1 por Passagem (~45) — o Keeper escolhe nome e paleta a partir do próprio estilo de jogo, vira canon.
- **Deriva e Restauração:** (Eras VII–VIII) espécies **esmaecem** se não forem encontradas por gerações e podem ser restauradas; os traços derivam com as capturas dos antepassados.

**Nota de acoplamento a eliminar:** o `SpawnNativeGhosts` liga *score* a spawn; com score em ~1e8+ por level-up isso satura em "sempre 5 alvos". Trocar por "1 spawn a cada N segundos de jogo" (pacing por tempo).

#### B.3.7 Ghosts secundários e batalhas ghost-vs-ghost

**Quem é a régua.** Só o **Ghost do Legado** (fixo #001 no MVP, D17 do 03); o resto é **Acervo** (03 §4.4, D10 do 01). Trocar de ghost no dia a dia é livre e **nunca perde a régua**, porque a régua é *tempo creditado no Legacy Ghost*, não XP de outro ghost. Jogar o Acervo é **Jogo Livre**: não credita nível.

**O que o Acervo faz** (para não ser lixo): (1) **amplitude** (cobrir elementos/categorias para o PvP futuro); (2) **Expedições** (o Movimento 3 despacha 2 Acervos; retorno **limitado por dia**, em Óleo/Essências pequenas, nunca em nível); (3) **coleta de Aspectos**; (4) **Ghost Aprendiz** para novatos/Herdeiros; (5) **Rank de Companheiro 1–100**, escala humana, com XP próprio de Jogo Livre.

**Podem ganhar nível?** Sim, em **Rank** (1–100), não em nível astronômico. Migração das ~139 personagens atuais: o nível antigo de personagem não-régua vira **histórico** (linha na Crônica + Selo de Pioneiro) e o Rank inicial é `min(100, ⌈log10(nível)·10⌉)` **[HIPÓTESE, para o 09/03]**.

**Batalhas ghost-vs-ghost (futuras).** Um nível 1e9 contra um 1e5 é inviável de comparar. Proposta:
1. **Normalização:** todas as batalhas usam **Nível de Batalha fixo (100)**; os atributos vêm de `stats_base` da espécie + **vetor de razões** de build (B.3.3) + Aspecto/Marcas cosméticas. Poder herdado **não entra**.
2. **Chaves por Era** (I–III / IV–VI / VII–X) apenas para *matchmaking social*; sem vantagem numérica.
3. **Elementos e categorias** já são razões (1,5/1,0/0,5; ciclo de 9) — entram como estão.
4. O prestígio da Linhagem é **visual/narrativo**, nunca numérico. Isso mantém o PvP justo entre a Linhagem de 2026 e a de 2100.

---

### B.4 — Economia: score, moedas, sumidouros, herança e o jogador que nasce em 2100

#### B.4.1 O estado atual em uma tabela (fontes e sumidouros)

| Fonte (faucet) | Valor | Sumidouro (sink) | Valor |
|---|---|---|---|
| Score por level-up | `200·√L` **por level-up, isto é, por kill** (o `triggerLevelUpEffect` roda 1× por `addXp`) **[VERIFICADO]** | Upgrade de arma | `100·1,15^tier` |
| Score de coletáveis (moedas, diamantes CAVE1) | 50–300 fixos | — | **nenhum outro** |
| Drops de item | iLvl 1–34 | Descartar item | grátis |

Observação de precisão que **corrige uma leitura possível do brief**: o score não é "por nível ganho", é **por evento de level-up**; como cada kill acima de L≈36 já vale muitos níveis (XP/kill ≫ degrau), score ≈ `kills · 200·√L`.

#### B.4.2 O sumidouro fossiliza (simulação)

Simulei a renda de score sob CR e CE, com **K ∈ {100; 1.000; 10.000} kills/h** (**[HIPÓTESE]**: não há telemetria de kills/hora), comprando tiers ao custo `100·1,15^tier` assim que possível **[CÁLCULO, econ_sim.js]**:

| K = 1.000, CR | Fim Era I | II | III | IV | V | VI | VII | VIII | IX | X |
|---|---|---|---|---|---|---|---|---|---|---|
| Tier acumulado | 95 | 126 | 148 | 169 | 183 | 194 | 205 | 212 | 217 | 219 |

| Ano | Intervalo entre duas compras de tier (em Anéis), K=1.000, CR |
|---|---|
| 10 | **0,8** (~1 por ano) |
| 100 | **7,5** |
| 500 | **36** |
| 1.000 | **71** |

Conclusões:
- **~100 compras acontecem em horas/dias** (tier 100 aos ~0,1 ano); depois o sumidouro **fossiliza**: a cadência cai de ~1 compra por Anel (ano 10) para 1 a cada 7,5 Anéis (ano 100) e 1 a cada 36 Anéis (ano 500). Na prática o Score deixa de ser um jogo entre as Eras IV e V.
- **O resultado é robusto a K:** ×10 na renda só acrescenta ~16 tiers (porque o custo é exponencial). Ou seja, esta análise **não depende de acertar K**.
- **Limite numérico:** custo do tier passa de 2^53 no tier **230** e de 1e16 no 231 **[CÁLCULO]**; com K=10.000 sob CR o tier final (235) já estoura a faixa `[0, 1e16]` de `NUMERIC_BOUNDS.score`. **Trocar o custo linear-exponencial por uma escada segmentada por Era** (abaixo) ou guardar Score como inteiro escalado/`BigInt` (09).
- **Inflação nominal não é o risco.** Sem mercado entre jogadores, um score de 1e16 é só um número. **Os riscos reais são (i) fossilização do sumidouro, (ii) acúmulo que estoura tipo numérico, (iii) o desequilíbrio dano/HP (B.3.2).**

#### B.4.3 Duas moedas (proposta)

| | **Score** (existe) | **Lantern Oil / Óleo da Lanterna** (novo) |
|---|---|---|
| Nasce de | kills (escala com o nível) | **1 por Selo do Dia** (e 1 bônus por Anel): **calendário, não nível** |
| Ordem de grandeza | 1e2 → 1e16 | **0 a ~400.000 na vida inteira da Linha** (número legível) |
| Inflaciona? | Por desenho (preço acompanha a renda) | **Não** (renda humana e fixa; bot é limitado pelo teto diário do 05) |
| Serve para | Upgrade de arma, consumíveis, Expedições, custeio de Voto (fase inicial) | **Refundir**, Grande Obra, Votos longos, oferendas de Estação, "desselar" um Voto |
| Pertence a | O personagem (coluna `score`) | **À Linha** (tabela própria, 09); intransferível; sem valor fora dela |

Efeito de design: as **coisas que dão significado** (obra, memória, restauração) custam **Óleo**, uma moeda cuja escala o dono consegue *contar*. As **coisas mecânicas** custam Score, que pode inflar sem drama.

#### B.4.4 Sumidouros novos e como precificar

**Regra de ouro de precificação:** *o preço é um múltiplo da renda de 1 Anel daquela Era*, não um número fixo. Assim a cadência de compra fica estável por séculos (ex.: "um projeto médio custa ~10 % da renda de Score de um Anel").

| Sumidouro | Moeda | Cadência-alvo | Modelo de preço |
|---|---|---|---|
| **Escada de arma segmentada** | Score | 1 compra por Anel até o ano ~100, depois 1 por ~2 Anéis | Tiers 1–100 como hoje (1,15/1,12); a partir daí **fatores por Era** (custo ×1,01–1,05, dano ×1,005–1,03) para caber em 2^53 e manter compra viva. **[HIPÓTESE: constantes são do actuary]** |
| **Refundir** (Reforge) | Óleo | 1–3 por Keeper | Custo fixo em Óleo (~1 Anel de Óleo = 365) pela peça |
| **Projeto de Voto** | Score + Óleo | 1 por mandato, 2–10 Anéis | % da renda do Anel × duração |
| **Grande Obra (Era IX)** | Óleo (coletivo) | Trimestral | "Pedras" de tamanho fixo em Óleo; progresso visível a todas as Linhas |
| **Oferenda de Estação** | Score (pequeno) | 4 por ano | ~1 % da renda de um Anel; recompensa cosmética/honorífica |
| **Expedição do Acervo** | Score (suprimentos) | diária | Custo pequeno; retorno limitado por dia |

**Não** criar sumidouros que dêem *poder* ao Score (senão a escada de arma volta a ser a única coisa que importa).

#### B.4.5 Relíquias e herança: o que o Keeper pode legar (e o limite contra "pay-to-inherit")

**O que passa por definição:** a conta inteira — Legacy Ghost, nível/tempo, Acervo, baú, badges, Óleo da Linha, Crônica — porque *legado é progresso contínuo e único* (Condição 1 do 01). Não faz sentido limitar o que o conceito existe para transferir.

**O que eu recomendo tornar inegociável:**
1. **Nenhuma transferência entre Linhagens.** Itens, moedas e relíquias são **vinculados à Linha** (alinha com 03 §4/D12 e com o anti-RMT do 05 §4.8).
2. **Relíquias honoríficas (sem poder)**, exatamente como o 03 D12 recomenda: Marca no ghost, *Era Marker*, *Generation Token*, **inscrição na arma** (a "palavra ao herdeiro"), Carta Selada. Nada disso soma número ao combate.
3. **O poder que passa é limitado pelos tetos do B.3.1** (elemental ×3,0, leech 25 %, CDR 40 %, mitigação 75 %). Não há "bônus de linhagem" acumulativo. **[HIPÓTESE e decisão DC-10:]** não criar bônus de linhagem numérico; se o dono quiser um, que seja **aditivo, ≤ +10 % no total** e nunca multiplicativo.
4. **O nível não se herda "extra": é tempo creditado.** Um Herdeiro não pode "comprar" nada que acelere o odômetro. Isso, mais o teto diário (05), é o que elimina o pay-to-inherit *no eixo do poder*.
5. **Óleo da Linha** é da Linha, não da pessoa: se o Keeper sair sem herdeiro, vai para o Commons (03), nunca para o mercado.

#### B.4.6 Quem começa hoje vs. quem começa em 2100 (Relógio da Linha × Relógio do Mundo)

Dois relógios independentes, para que um jogador novo em 2100 **não fique fora** do mundo:

- **Relógio da Linha** (tempo creditado): define Era, odômetro, conteúdo desbloqueado. **Cada Linha percorre I→X na sua velocidade.** Uma Linha fundada em 2100 joga o **mesmo Era I** de 2026 (com Presságios sorteados por data).
- **Relógio do Mundo** (calendário): Estações, Chamada (Roll Call), eventos globais, Provações sazonais. **Todas as Linhas participam**, cada uma na profundidade da sua Era (a Provação escala por TTK, B.3.2), com recompensas cosméticas/honoríficas.

**Contra a desigualdade:** (i) ninguém compra nada (não há monetização [VERIFICADO]); (ii) ranking é por **Era e fração do caminho**, não por data de fundação (03 §5.4b); (iii) **Guias**: uma Linha mais adiante pode "apadrinhar" uma nova por Carta e Eco compartilhado, **sem dar poder**.

Um fato que o dono precisa ver: a coorte fundadora (as 48 contas de 2026) **não é mais rápida que a de 2100**: cada Linha precisa das 409.538 h dela. Quem nasce em 2100 termina em ~3221; quem joga 95 % dos dias, ~60 anos depois (03 achou 3207 para a coorte de 2026). A régua é **por horas**, não por data (03 D2).

---

### B.5 — Fim de jogo: o que é "zerar" em gameplay e o que vem depois

Alinho com o **03 §5** (Última Ronda, Portão de calendário `F`, Cerimônia de Coroação, Monumento, Novo Ciclo, Coroação conjunta) e acrescento a **camada de gameplay**, que ficou em aberto:

**B.5.1 O caminho até a Keystone (Era X, 122 Anéis)**
1. **Reacender lâmpadas:** um objetivo por Era (10) + a lâmpada final. Cada Keeper da Era X acende algumas por meio de **Provações de Era** (rejogar o chefe de cada Era no formato normalizado).
2. **Limiar (The Threshold):** ao chegar a 1e11 antes da data-piso `F`, o jogador entra em `crown_pending` (03). Em vez de "esperar", o Limiar tem **tarefas de cuidado**: escrever a Chamada, apadrinhar Linhas novas, tender a Grande Obra concluída, curar o Monumento em preparação. Espera com sentido, sem pressão.
3. **Última Ronda (~2 h, 03):** a caminhada pela Galeria acendendo a lâmpada de cada antecessor.
4. **O Coro (The Chorus): chefe final.** Não é "o maior número". É **um chefe feito de Ecos**: 10 fases, uma por Era, cada uma com padrões de ataque derivados dos Keepers daquela Era (elemento mais usado, Voto, ritmo). TTK alvo total ~10 min. Ele **não exige matar tudo**: várias fases se vencem "respondendo" ao Eco (uma esquiva perfeita, um elemento certo). O clímax é ver a própria Linha jogar de volta.
5. **A Escolha da Pedra (Keystone Choice):** três desfechos, todos legítimos, nenhum altera poder — *Carve* (inscrever a última linha no Hall), *Light* (o ghost vira lanterna/estátua, "Guardião Eterno" do 03), *Road* (**a Linha deixa um Monumento jogável**, ver abaixo).

**B.5.2 O Monumento jogável (a ideia de sustentabilidade do fim).** Toda Linha coroada gera **uma fase procedural a partir da própria Crônica** (as regiões restauradas, os Votos, os Ecos, os chefes de Era como paredes/salas), guardada como Era Pack aberto. Resultado: **cada "fim" produz conteúdo novo para as Linhas que ainda jogam**. É o antídoto mais elegante contra o problema do conteúdo (B.6), e uma forma concreta do "cada Keeper como pedreiro".

**B.5.3 Pós-fim** (alinhado com 03 §5.4, opção 3 recomendada):
- **Monumento (terminal):** a Linha coroada fica só-leitura; o Keeper final vira **Curador**: joga o Acervo, escreve Adendos, guia visitantes.
- **Novo Ciclo:** o Keeper final pode **fundar uma Linhagem nova e limpa** ("Ciclo 2"), herdando só **marcas cosméticas** do Hall (nunca poder). *Nunca* reinicia a linha antiga (mutilaria o registro; viola o Navio de Teseu, 01 Princípio 8).
- **Modo Museu:** qualquer jogador pode "visitar" as Eras que já viu (rejogar Provações e Ecos, sem crédito).

**B.5.4 Duas Linhas chegam juntas** (03 §5.5: na coorte fundadora o **empate é o caso esperado**): Coroação conjunta no mesmo ano civil. Do lado do conteúdo: o Coro é um **chefe cooperativo opcional** para as duas Linhas na mesma Cerimônia (servidor autoritativo; a ordem é só honraria). Se uma Linha terminar sozinha, o Coro é solo.

**B.5.5 E se acabar antes de 3147?** O **protocolo de encerramento** (D6 do 01: publicar desde o dia 1) tem um análogo em conteúdo: cada Era Pack fica **exportável** como dados + o Coro pode ser jogado offline no arquivo final (deep-time-archivist). Não posso prometer 1.121 anos; posso prometer que **o registro e as regras são legíveis sem o servidor**.

---

### B.6 — Riscos de design e como um dev solo sustenta 1.100 anos

#### B.6.1 Tabela de riscos

| Risco | Como se manifesta | Mitigação (mecânica concreta) |
|---|---|---|
| **Burnout** | 1 h por dia, por anos; o jogo vira tarefa | Sem streak e sem cobrança (01 P10); Movimentos fracionáveis; "Você não precisa jogar hoje"; **Estações** dão pausas naturais; **Anel** dá fecho anual |
| **Futilidade** ("nunca vou ver o fim") | O dígito líder está parado; o fim é em 3147 | O fim é da **Linha**, não do Keeper: o Keeper tem **Eras, Anéis, Capítulo** como fechos *dentro da sua vida*; a Era X e o Monumento tornam o fim **conteúdo** |
| **FOMO/dever de herdeiro** | Herdar vira obrigação; "não posso parar" | Recusa sem custo (03 D8); nada de placar contra antecessores; **Rampa do Herdeiro**; Vestíbulo e "Ghost Aprendiz"; nada expira |
| **Desigualdade entre Linhagens** | Coortes de datas diferentes; sorte de ter herdeiros | Ranking por **Era/fração**, não por data; Guias sem poder; Commons; poder herdado com **tetos duros** (B.3.1) |
| **Odômetro sem significado** | Números de 12 dígitos ilegíveis | Odômetro rebaixado a rodapé; abreviação K/M/B/T/Qa/Qi; **Marcos de Dígito** como eventos |
| **Escada de score/arma morta** | Sumidouro fossiliza (B.4.2) | Duas moedas; escada segmentada; sumidouros indexados à renda |
| **Dano/HP fora de controle** | Combate acaba antes de começar (10⁻⁹ s) | **TTK alvo** (B.3.2) |
| **Conteúdo não chega a tempo** | Linha atinge a fronteira antes do Era Pack | **Horizonte de Conteúdo** (abaixo) + **Interlude** (a Linha nunca trava) |
| **Dependência do dev** | O dev some; nada novo é criado | **Era Packs abertos**, geração procedural, comunidade curada, Monumentos (abaixo) |

#### B.6.2 O Horizonte de Conteúdo (prazos reais)

Como o teto diário limita a velocidade da fronteira (05: opção iii ⇒ f ≈ 1,0 sustentadas; opção ii ⇒ ~1,25), o dev **sabe quando cada Era será exigida**. `f` = horas creditadas por dia sustentadas do jogador mais rápido **legítimo** **[CÁLCULO, misc_calc.js]**; datas medidas a partir da adoção do conceito (D0):

| Era | Início (h) | f = 1,0 | f = 1,25 | f = 2,0 (pior caso) |
|---|---|---|---|---|
| I | 0 | D0 | D0 | D0 |
| II | 33 | 33 d | 26 d | 17 d |
| III | 365 | 1 ano | 292 d | 183 d |
| IV | 1.825 | 5 anos | 4 anos | 2,5 anos |
| V | 9.125 | 25 anos | 20 anos | 12,5 anos |
| VI | 27.375 | 75 anos | 60 anos | 37,5 anos |
| VII | 63.875 | 175 anos | 140 anos | 87,5 anos |
| VIII | 136.875 | 375 anos | 300 anos | 187,5 anos |
| IX | 246.375 | 675 anos | 540 anos | 337,5 anos |
| X | 365.000 | 1.000 anos | 800 anos | 500 anos |

**Leitura:** no **lançamento** só é obrigatório **Era I + fatia da Era II**. Era III é exigida em 6–12 meses; Era IV em 2,5–5 anos; **todo o resto é uma dívida de séculos**, não de meses. Por isso o **teto diário é um instrumento de design tanto quanto de anti-abuso**: sem ele, um jogador de 16 h/dia chega à Era IV em ~3 meses (o dev perde o controle da agenda).

**Interlude (regra de nunca travar).** Se uma Linha atingir a fronteira de uma Era sem o Pack publicado, ela entra num **Interlude**: continua avançando (odômetro e Selos seguem), joga com o **laço genérico** (Presságio + Aspecto da última Era publicada), e a Crônica registra "Interlude". Quando o Pack sai, a Linha entra na Era retroativamente. **Progresso nunca depende de o dev ter escrito algo.**

#### B.6.3 Orçamento de novidade: ~333 h autorais para 409.538 h de jogo **[HIPÓTESE]**

| Era | h autorais (novidade) | Duração (h) | Esticamento (h jogadas ÷ h autorais) |
|---|---|---|---|
| I | 33 | 33 | 1× |
| II | 40 | 332 | 8× |
| III | 60 | 1.460 | 24× |
| IV | 40 | 7.300 | 183× |
| V | 30 | 18.250 | 608× |
| VI | 30 | 36.500 | 1.217× |
| VII | 30 | 73.000 | 2.433× |
| VIII | 20 | 109.500 | 5.475× |
| IX | 20 | 118.625 | 5.931× |
| X | 30 | 44.538 | 1.485× |
| **Total** | **333** | **409.538** | **~1.230×** |

O esticamento sobe muito nas Eras longas porque **elas são "estradas"**, e a sensação de progresso vem de Anel, Voto, Estação e Aspecto, não de fases inéditas. As **Eras I–IV (~133 h autorais)** são as únicas que o dev precisa entregar em **até 5 anos** (Horizonte).

#### B.6.4 Seis mecanismos de esticamento (o que faz 333 h virarem 409.538 h)

1. **Geração procedural offline (build-time)** dos layouts (recombinar as 33 fases) e dos Presságios. Rodar no build, não no servidor: LLM ou API externa em runtime **não** dura 50 anos (deep-time-archivist).
2. **Estações e Anéis** (calendário produz variedade sem autoria).
3. **Aspectos de Era** (recolor + aura) → 1.010 colecionáveis.
4. **Ecos e Marcas** (o conteúdo dos Keepers vira conteúdo do jogo).
5. **Monumentos jogáveis** (cada Linha coroada gera uma fase; 03 §5.3).
6. **Era Packs abertos** (a comunidade autora Eras futuras).

#### B.6.5 Era Pack: formato e governança (resumo)

- **Formato:** um diretório versionado, tudo declarativo (JSON + imagens): espécies e Aspectos, layouts/tilemaps, regras de Presságio, chefe (padrões como dados), textos (EN), relíquias, `manifest.json` com `era`, `requires`, `curve_version`. **Sem código executável** (segurança e longevidade).
- **Curadoria:** só entra com revisão (Curador); a licença e a autoria entram no Pack e na Crônica; **não** pode alterar regras de bedrock, tetos de poder nem a curva.
- **Dados OSM:** o pipeline `osm-to-game-grid` usa OpenStreetMap; pelo que sei a licença é a ODbL (exige atribuição). **[HIPÓTESE, não verifiquei por busca — validar com `digital-succession-counsel`]**.

---

### B.7 — MVP: o menor conjunto que já entrega a fantasia do legado

**Critério:** o jogador deve sentir, na primeira versão, três coisas: (1) *"meu dia tem fecho"* (Selo/Movimentos), (2) *"estou numa história longa e vejo a estrada"* (Eras, Anel), (3) *"isto pode passar para alguém"* (Crônica).

| # | Entrega | Reaproveita | Custo (T-shirt) |
|---|---|---|---|
| 1 | **Era I completa** = 33 h (1 fase por hora creditada, 3 atos/fase, TTK alvo) | 33 fases, chefes, Ghostdex pool 1, segredos existentes | **G** (o grosso do trabalho de conteúdo) |
| 2 | **Fatia da Era II**: runas/elementos, gear, forja, overworld com 3 POIs | Tudo já existe | **P** (empacotar) |
| 3 | **Odômetro rebaixado**, **Selo do Dia**, **Anel**, **Marcos de Dígito** (trocar valores da escada de 100), **Visão do Keeper** (Era/fração) | `formatBigNumber`, `evolucao_assombrada` | **M** |
| 4 | **4 Movimentos** como *fluxo/UI* (sem conteúdo novo), com o fecho de Selo | Diário/Egregora | **M** |
| 5 | **Crônica**: entradas automáticas de Selo/Anel/Era + o Keeper acrescenta 140 caracteres | `diary_entries`, `egregora_messages`, 09 (`chronicle_events`) | **M** |
| 6 | **Presságio v1** (server-seeded, 12 modificadores × 5 elementos) | Sistema elemental | **P–M** |
| 7 | **Estrada visível**: Eras II–X aparecem como capítulos **trancados** na Crônica (nome, silhueta, chefe) | Só arte/texto | **P** |
| 8 | **Interlude** (regra de não travar) + normalização TTK mínima para a Era I | — | **M** |
| 9 | **Inscrição na arma** ao comprar cada tier (o "nome do Keeper que forjou") | `upgradeWeapon` | **P** |

**Fica para depois (com prazo do Horizonte):** Era II completa (**≤ 6 meses**), **Era III** (Ghostdex em capítulos + Niterói inteira via OSM; **≤ 12 meses**), **Era IV** (Legar: Carta, Vestíbulo, Trio Primordial, Espécie da Geração; **≤ 2,5 anos**), o **Reforge** e o **Óleo da Lanterna** (com a primeira Passagem), o **Rank de Companheiro**, o **PvP normalizado**, e **Eras V–X** (séculos). Estimativas de dias são do `producer`; **não** as inventei.

---

## (c) Lacunas que eu fechei

1. **A unidade de progresso sentida** (§8 do brief): Selo → Anel → Marco de Dígito → **Era** → Capítulo, com o odômetro rebaixado; quantificada por 3 curvas (B.1.1).
2. **A relação nível-contador × unidade sentida**: nível derivado de tempo creditado; Eras ancoradas em tempo; requisitos R1–R6 ao actuary.
3. **10 Eras** com duração (h/anos/gerações), verbo novo, região, paleta, chefe, relíquia e marco emocional (B.1.4–B.1.5).
4. **A hora de 60 min** em 4 Movimentos; a hora do dia 1, do ano 500 e do Herdeiro (B.2).
5. **Anti-monotonia**: sete alavancas em escalas de tempo diferentes; capacidade calculada.
6. **Escala de todos os sistemas**: atributos/pontos, HP/dano (TTK), itens (razão + Selo de Era), elementos/categorias (já escala-livres), badges (escada de Marcos de Dígito = **100 exatos**), 33 episódios, Ghostdex (capítulos = 4 pools existentes; Aspectos; Espécie da Geração), Acervo, PvP normalizado.
7. **Economia**: simulação (o sumidouro fossiliza; robusto a K), limites numéricos (2^53 no tier 230), duas moedas, precificação por renda, herança com tetos, Relógio da Linha × Relógio do Mundo.
8. **Fim de jogo em gameplay**: Limiar, Coro, Escolha da Pedra, Monumento jogável, pós-fim, empate.
9. **Dev solo**: Horizonte de Conteúdo com datas, orçamento de novidade (~1.230× de esticamento), Interlude, Era Pack.
10. **MVP** com custos relativos e o que fica para depois.
11. **Dois achados de código** para outros times: (i) `iLvl` do loot é o número do episódio (1–34), então itens não escalam; (ii) Ghostdex inteiro acaba em ~7 h hoje.

## (d) Lacunas que dependem de outros departamentos

| Lacuna | Quem resolve |
|---|---|
| **Curva final do odômetro** e teto diário (R1–R6); constantes da escada de arma segmentada; K (kills/h) e telemetria | `progression-actuary` (`raw/02_calibracao.md`, **ainda não lido**) |
| Constantes finais de TTK, fórmulas de atributo (soft caps), rebalance de chefes, telégrafos e fases dos chefes | `game-designer` de implementação + `gameplay-engineer` + `ai-programmer` |
| Nomes finais das Eras, lore, tom, texto da Crônica, Coro/Escolha da Pedra | `narrative-designer` + `localization` |
| UI: Visão do Keeper, 4 Movimentos, presets de build, Odômetro | `ui-ux-designer` |
| Trocar valores da escada de 100 badges; badges novas; `account_id`; score em `BIGINT`/escalado; Óleo por Linha; `relics` | `backend-architect` (09), `tools-programmer` |
| Estações, calendário, eventos globais, Provação sazonal | `live-ops` |
| Presságio server-seeded e anti-manipulação | `security-engineer` |
| Formato do Era Pack, geração offline, legibilidade sem servidor, dados OSM | `deep-time-archivist`, `tools-programmer` |
| Licença de conteúdo da comunidade, ODbL/OSM, marca | `digital-succession-counsel` |
| Escopo final e cortes | `game-director`, `producer` |
| Arte de Aspecto/Marca e paleta de Era | `concept-artist`, `2d-artist`, `technical-artist` |
| Teste de aceitação por simulação (Monte Carlo do combate/TTK) | `qa-lead`, `progression-actuary` |

## (e) DECISÕES PARA O DONO

Todas com recomendação. O "DC" é de "decisão de conteúdo".

**DC-1 — Qual é a unidade de progresso que o jogador sente?**
(a) O nível numérico (o dígito líder, tal como é hoje). Prós: zero trabalho. Contras: o dígito fica parado até 146 anos; futilidade certa. (b) **Era + Anel + Selo + Marcos, com o nível como odômetro.** Prós: cada escala de tempo tem um fecho. Contras: mais UI e conteúdo. (c) Só patentes por nível. Prós: familiar. Contras: patentes ainda seriam derivadas do mesmo contador que trava.
➜ **Recomendo (b).**

**DC-2 — As Eras são ancoradas em tempo creditado (Anéis) ou em nível?**
(a) **Tempo creditado.** Prós: independe da curva; alinha com 05/09. Contras: o dono precisa pensar em "anéis". (b) Nível. Prós: intuitivo. Contras: qualquer recalibração da curva reescreve todas as Eras.
➜ **Recomendo (a).**

**DC-3 — Que forma dar à curva do odômetro (pedido ao actuary)?**
(a) CR (potência pura). Prós: simples, parente da curva atual. Contras: Eras VIII–X cruzam só 0,43/0,29/0,08 década; 5 Marcos de Dígito para os 500 últimos anos. (b) CE. Prós: intervalos de dígito ≤ 66 anos. Contras: Eras V–VI quase não mexem no odômetro (0,23/0,46 década). (c) **CP: cada Era ≥ 0,8 década a partir da V.** Prós: cada Era muda a ordem de grandeza; ≥ 5 marcos por Era. Contras: mais parâmetros (é uma curva por partes).
➜ **Recomendo (c) como alvo, (b) como plano B.** A decisão final é do 02.

**DC-4 — Quantas Eras?**
(a) 7. Prós: menos conteúdo. Contras: Eras de 400+ anos. (b) **10.** Prós: fronteiras a cada 1, 5, 25, 75 … anos, casadas com gerações; cabe no Horizonte. Contras: mais Packs. (c) 14. Prós: mais fechos. Contras: dilui o marco.
➜ **Recomendo (b).**

**DC-5 — Era I: 1 fase por hora creditada, ou fases livres?**
(a) **Desbloqueio por hora creditada, com rejogo livre.** Prós: a Saga vira o "primeiro mês" e protege o ritmo do jogo contra o teto de 05. Contras: quem quer "correr" para a fase 20 não pode. (b) Fases livres desde o início. Prós: sem restrição. Contras: o hábito de 33 dias some; a Era I acaba em 1 dia.
➜ **Recomendo (a).**

**DC-6 — Troca dos valores da escada de badges de nível?**
(a) Manter (5, 10, 15 …). Prós: nenhuma migração. Contras: 67 das 100 abrem em 33 h. (b) **Trocar por Marcos de Dígito (1..9×10^n)**. Prós: 100 valores exatos, mesma tabela e colunas; ritmo por Era. Contras: precisa migrar `requirement_value` e conferir o que contas atuais já desbloquearam. (c) Adicionar uma segunda escada. Prós: preserva a antiga. Contras: 200 badges de nível.
➜ **Recomendo (b)**, mantendo o que já foi ganho (Selo de Pioneiro).

**DC-7 — Ghosts secundários (Acervo): podem subir de nível?**
(a) Níveis astronômicos livres, como hoje. Prós: nenhum trabalho. Contras: reintroduz o problema do §8 em cada ghost. (b) **Rank 1–100 no Jogo Livre, sem crédito de horas.** Prós: escala humana, dá uso ao Acervo. Contras: precisa converter os ~139 personagens atuais. (c) Sem nível algum. Prós: simples. Contras: Acervo fica sem progressão.
➜ **Recomendo (b).** Trocar de ghost sempre é livre e nunca perde a régua.

**DC-8 — Existe power creep por Era no equipamento?**
(a) Sim (Era N ⇒ item mais forte). Prós: sensação de progresso. Contras: exige conteúdo novo eternamente; herança fica obsoleta. (b) **Não: itens relativos (razão), com Selo de Era e Refundir.** Prós: herança continua viva; sem tratamento de "meta". Contras: menos "sensação de upgrade" no gear.
➜ **Recomendo (b).**

**DC-9 — Uma moeda ou duas?**
(a) Só Score. Prós: simples. Contras: o sumidouro fossiliza (1 compra a cada 7,5 Anéis no ano 100). (b) **Score + Óleo da Lanterna (1 por Selo).** Prós: uma moeda legível para o que dá sentido. Contras: nova tabela e UI.
➜ **Recomendo (b)** (o Óleo pode entrar junto da 1ª Passagem, não no lançamento).

**DC-10 — Bônus numérico de linhagem?**
(a) Nenhum (relíquias só honoríficas; 03 D12). (b) Aditivo pequeno (≤ +10 % total). (c) Multiplicativo. Prós de (b)/(c): "sensação de herança". Contras: desigualdade e RMT.
➜ **Recomendo (a).**

**DC-11 — PvP futuro: normalizado ou por nível cru?**
(a) **Nível de Batalha fixo (100), atributos por razão, chaves por Era só social.** Prós: justo entre 2026 e 2100. Contras: prestígio só visual. (b) Nível cru. Contras: 1e9 vs 1e5 é inviável.
➜ **Recomendo (a).**

**DC-12 — O fim de jogo tem Coro e Monumento jogável?**
(a) Só cerimônia (03). Prós: barato. Contras: fim = anticlímax de jogo. (b) **Coro (chefe de Ecos) + Monumento jogável.** Prós: clímax jogável; o fim gera conteúdo. Contras: só é necessário daqui a ~1.000 anos (não é MVP).
➜ **Recomendo (b), com implementação adiada até a Era VIII** (o desenho já fica escrito).

**DC-13 — Regra de "nunca travar" (Interlude) e Era Packs abertos?**
(a) **Sim aos dois.** Prós: o jogo sobrevive à ausência do dev. Contras: exige curadoria e formato aberto. (b) Só conteúdo próprio. Contras: risco máximo de dependência.
➜ **Recomendo (a).**

**DC-14 — Aceita o orçamento de ~333 h autorais e o Horizonte de Conteúdo como calendário?**
(a) **Sim, com ajuste na Era III–IV.** (b) Reduzir para ~200 h. Prós: mais viável. Contras: Eras I–IV ficam magras. (c) Sem orçamento formal.
➜ **Recomendo (a)** e tratar 333 h como teto de planejamento, não meta.

**DC-15 — Escopo do MVP.**
(a) **Os 9 itens do B.7.** (b) Só Era I + Selo. (c) Tudo até a Era IV.
➜ **Recomendo (a).**

## (f) Riscos e o que eu NÃO consegui verificar

**O que não verifiquei:**
- **K (kills por hora)** não existe em telemetria; usei 100/1.000/10.000 como hipótese. As conclusões do B.4.2 são robustas a K (custo exponencial), mas a extensão da escada de kills (B.3.5) **não** é.
- **`02_calibracao.md` não existia** quando escrevi. As três curvas (CR, CE, CP) são **minhas** e servem de lente; a curva oficial é do actuary. Se ela divergir de R1–R3, reveja a coluna de nível e a lista de Marcos por Era.
- **"Cada episódio rende ~1 h"** é hipótese de desenho, não medição. A estimativa de esticamento da Era I (de < 1 h para 33 h) depende de playtest.
- **Comportamento de captura** (`UnlockGhostForPlayer` vs. limite de 5 slots): li o código, mas não testei se a captura respeita o teto de 5 personagens; o cálculo de "7 h para completar o Ghostdex" assume que cada spawn vira captura.
- **Diferença 320 × 333 badges**: o seed lido tem 320; não consultei produção para achar os 13 restantes.
- **ODbL/OSM** e o número de bairros de Niterói: não conferi por busca; marquei como hipótese.
- **Cadência da Renovação:** o 01 propõe a cada 20 anos e o 03 a chama de anual. Usei "Anel" como fecho anual leve e deixo a Renovação técnica para o `game-director` reconciliar.
- **Numéricos de banco:** limites de `score` ([0, 1e16]) e o custo do tier > 2^53 foram lidos/calculados, **não** testados em banco real.
- **Engine e nomes de função** foram lidos por grep pontual; não abri `engine.js` inteiro.

**Riscos que eu vejo:**
1. **Excesso de sistemas** (Voto, Eco, Marca, Aspecto, Óleo, Reforge, Grande Obra) para um dev solo. Mitigação: só 4 entram no MVP; o resto tem prazo do Horizonte.
2. **Normalização por TTK** pode retirar a sensação de "estou ficando mais forte". Precisa de playtest e de feedback visual (o "excesso de dano" vira dano visual/partícula, não TTK).
3. **Prazo da Era IV** (2,5 anos no pior caso): é a primeira que exige a Passagem e o Trio Primordial. É o marco que mais pressiona o dev.
4. **A escada de badges de dígito** muda `requirement_value` de dados vivos: risco de "perder conquista" para contas atuais. Precisa da regra do Selo de Pioneiro (09).
5. **Aspectos e paletas** podem parecer "só recolor". Mitigar com uma marca visual clara de Era.

---

## Anexo A — Como reproduzir os números (scripts no scratchpad, fora do repo do jogo)

Diretório: `C:\Users\Klara\AppData\Local\Temp\claude\C--Users-Klara-Desktop-dragaMP\d5f5cb56-590d-41fa-841a-363e2373195d\scratchpad\`

| Script | O que calcula |
|---|---|
| `eras_calc.js` | 409.538 dias / 1.121,25 anos; 244.178 níveis/h; tabela de Eras; curva CR (k = 1,6894); crescimento relativo por sessão/Anel; tempo para cruzar 10^n; gaps de Marco de Dígito; badges de nível por marco de tempo |
| `ce_calc.js` | Curva CE; níveis ao fim de cada Era; gaps; décadas por Era |
| `cp_calc.js` | Curva CP (Eras com décadas alocadas); gaps; Marcos de Dígito por Era |
| `econ_sim.js` | Simulação de renda de score e tiers de arma (CR/CE × K=100/1.000/10.000); intervalos de compra; overkill dano/HP; pontos/efeitos de atributo em 1e11 |
| `misc_calc.js` | Horizonte de Conteúdo; coupon-collector do Ghostdex; combinações de Presságio; orçamento de novidade |
| `ladder.json` | Os 100 valores atuais da escada de badges de nível (extraídos de `server/seed_badges.js`) |

Números-chave **[CÁLCULO]**: 409.538 dias; 1.122 Anéis; k(CR)=1,6894; última década (CR) = 74,4 % do tempo; maior gap de dígito CR/CE/CP = 146/66/111 anos; escada de dígitos = 100 valores; tier 230 estoura 2^53; Ghostdex hoje ≈ 725 spawns; esticamento global ≈ 1.230×.

## Anexo B — Referências cruzadas

- `raw/01_filosofia.md`: vocabulário (§B.3), Princípios 3, 6, 7, 9, 10; D6, D9, D10, D17.
- `raw/03_sucessao_cronica.md`: Vestíbulo, Ghost Aprendiz, Última Ronda, Portão `F`, Coroação conjunta, Monumento, Novo Ciclo, D12 (relíquias honoríficas), D17 (#001 fixo).
- `raw/05_integridade_antiabuso.md`: tempo ativo autoritativo, teto diário (§3.6, opção iii), anti-RMT (§4.8).
- `raw/09_arquitetura_migracao.md`: `relics`, `chronicle_events`, `sealDay`, Era Zero aditiva, `curve_version`.
- Código lido: `rpg_system.js`, `js/game/ghostdex_data.js`, `ghostdex_hierarchy.js`, `ghost_inventory.js`, `engine.js` (por grep), `server/seed_badges.js`, `server/db.js` (`NUMERIC_BOUNDS`, `createPlayer`), `data/overworld/manifest.json`, `pois.json`.
