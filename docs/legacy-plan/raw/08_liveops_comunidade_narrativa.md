# 08 — Live-ops, Comunidade e Narrativa do Jogo Legado

**Agente:** `live-ops` + `community-manager` + `narrative-designer` (papéis acumulados) · **Data:** 2026-09-20 · **Modo:** PLANO (nenhuma linha do jogo foi tocada; nada foi postado em canal nenhum)

**Li antes de escrever:** as três personas; `00_BRIEF.md` (integral); `CLAUDE.md` (integral); `SALVAGED_LORE_2026-09-16.md` (integral); o lore real do jogo (`js/lore_data.js` volumes I e II em inglês, `lore_books.md` enciclopédia + livro); e o código que sustenta comunidade hoje (`js/ui/ui_manager.js` chat global e Egregora, `server/index.js` e `server/db.js` do mural Egregora, `data/overworld/pois.json`, `js/web2/badges.js`, `server/seed_badges.js`). Alinhei vocabulário e regras com `raw/01_filosofia.md`, `raw/03_sucessao_cronica.md`, `raw/04_durabilidade.md`, `raw/05_integridade_antiabuso.md` e `raw/09_arquitetura_migracao.md`. O relatório `02` (calibração, número de Eras) ainda não existia quando fechei; onde dependo dele, digo.

---

## Como ler este documento

Etiquetas (as do brief): **[VERIFICADO]** = conferi no código/arquivo/web hoje · **[CÁLCULO]** = conta feita aqui · **[HIPÓTESE]** = proposta ou interpretação minha. Duas etiquetas extras, porque este relatório mexe com o **lore do dono**:

| Etiqueta | Significa |
|---|---|
| **[CANON]** | Está escrito no lore que o dono já escreveu (cito o capítulo). |
| **[EXTENSÃO [En]]** | É coisa **nova** que eu proponho e que **não está** no lore. Só entra com o "sim" do dono (o dono já pediu, ao escrever os livros: *"os agentes não devem inventar nada, se tiver dúvida me pergunte"* — `lore_books.md`, topo). Cada extensão tem um código (E1, E2...) e vira uma decisão na seção (e). |

**Vocabulário oficial usado aqui** (é o da `01_filosofia.md`, B.3, não invento outro): **Keeper** (Guardião) · **Heir** (Herdeiro; **Successor** = quem assume vindo do Commons) · **the Chronicle** (a Crônica; cada registro = **an Entry**) · **the Legacy Ghost** · **the Handover** (a Passagem) · **the Investiture** (a Investidura) · **Accept / Decline the Charge** · **the Sealed Letter** · **the Renewal** · **Dormant** · **Retire the Line** · **the Line** (a linhagem) · **Era** · **the Keystone** / **Keystone Bearer** (zerar / quem zerou) · **the Roll Call** (o dia da chamada dos nomes) · **Era Zero** / **the First Keepers** (as contas de hoje) · **the Commons** (linhas órfãs adotáveis). Da `03_sucessao_cronica.md` herdo: **Vigil** (a espera de 14 dias antes da Investidura), **Curator** (contato de confiança do Keeper), **Apprentice Ghost**, **Hall of Keepers**, **Vestibule** e a metáfora da **Lantern** ("a conta é uma casa com uma lanterna").

> **Alerta de coordenação nº 1 (vocabulário):** o relatório `04_durabilidade.md` escreve o texto público em inglês com a palavra **"Guardian"**. No lore do dono, "Guardian" já é **outra coisa**: Gato é "the Feline Guardian" / "the Metamorphosis of the Guardian" (`lore_data.js`, Vol. I cap. 3 e Vol. II cap. 2) e a RX são "the Guardians of Ink" (Vol. I cap. 1). Em inglês, **Keeper** evita a colisão. Sugiro que o texto do `04` troque "Guardian" por "Keeper" antes de ir para os Termos.
> **Alerta de coordenação nº 2:** a `01_filosofia.md` chama o protocolo de encerramento de "Last Rites". *Last Rites* é o nome de um sacramento cristão; a própria D5 dela proíbe palavra sagrada de tradição viva. Proponho **"the Closing"** (ver §5.5).

---

## (a) Resumo em 10 linhas

1. **A moldura narrativa já está quase pronta no lore do dono.** Três peças **[CANON]** bastam: Danger Ghost foi **projetado em 3147 e enviado ao passado** como jogo clandestino; a economia de 3147 é o **Capital Temporal** (a IA Suprema *rouba* tempo de vida); e a **Rua Beltrão é o ponto cego** onde a resistência "pirateia" blocos de tempo. Daí sai a frase-mãe: *"O jogo foi feito em 3147. Cada hora jogada o leva um pouco mais perto de casa."*
2. **A hora diária do jogador é, em termos de lore, um "bloco de tempo pirata"** (canon). A Máquina *toma* tempo; o Legado é tempo **dado**. Isso vira também **regra de ética de design**: se o jogo cobrar a hora com culpa, ele vira a IA Suprema.
3. **"Zerar" (Keystone)** = o jogo **chega em casa**, no ano em que foi escrito. Duas extensões opcionais (E2 "a dívida do céu", E4 "uma estrela por Linha") dão o final emocional; sem elas, o final funciona do mesmo jeito, só mais seco.
4. **O Keeper não é "o Guardião" do lore** (esse é o Gato). É a **pessoa do lado de fora da tela**, alguém do "Ponto Cego" que carrega a lanterna e escreve a Crônica.
5. **Textos-chave em inglês prontos** (com PT-BR): tela "The Long Road", carta ao Heir com roteiro, epitáfio da Crônica, texto do Keystone, avisos de Dormant/Vigil/Roll Call, FAQ e carta às ~48 contas atuais.
6. **Cadência realista para dev solo:** rituais **de calendário fixo** (Legacy Day, Roll Call, Renovação por Linha), **eventos que dão memória e nunca poder** (regra: "eventos dão memória, não poder"), e **nenhum prêmio perdível** (sem FOMO punitivo). Carga estimada do ano 1: **~85 h (até ~125 h no pior caso)** **[HIPÓTESE]**.
7. **Comunidade entre gerações não nasce sozinha.** Ela se sustenta em **lugares** (Egregora, Hall of Keepers, Mapa do Céu), **rituais** e **poucos papéis** (Lookout, Scribe). Achado real: o **chat global hoje é um broker MQTT público de terceiros, sem conta, sem moderação, sem banimento possível** — não serve de base para comunidade de décadas.
8. **Comunicação honesta:** nunca "1.121 anos garantidos"; sim "o ritmo do jogo foi calibrado para isso; a régua é uma **medida, não uma agenda**". Contador público "Dia N de 409.538" e página "Saúde do Legado" (ideia do `04`) no lugar de adjetivos.
9. **Manutenção da chama:** o que faz um Heir ficar (relações, sentido, autonomia, retorno sem culpa) e o que o faz sair (fardo herdado, e-mail morto, comunidade vazia). Lembretes **opt-in, sem culpa, com teto** — e separar **aviso de custódia** (obrigatório, factual) de **convite** (opcional).
10. **Sunset digno ("the Closing")** alinhado aos níveis N1–N4 do `04`, com aviso ≥ 180/365 dias e uma "Última Entrada" já escrita. **MVP do ano 1:** Carta às contas atuais + página da régua/FAQ + Founders + Legacy Day + Roll Call + 2 Lookouts + Pilot Handovers + compromisso público de encerramento digno.

---

## (b) Proposta detalhada

# PARTE 1 — Moldura narrativa do Legado

## 1.1 O que o lore do dono já diz (e eu vou usar como alicerce)

Tudo abaixo eu **li nos arquivos** e cito de onde vem. Isto é a base; nada aqui é invenção minha.

| # | Fato do lore | Onde está | Uso na moldura |
|---|---|---|---|
| L1 | **O ano 3147 já é o "presente" de Neo Nit**, a metrópole distópica onde Quixeira e a IA Suprema governam. | Vol. I, Prólogo; enciclopédia §1 | A data da régua **não é arbitrária**: é o ano do mundo de origem do jogo. |
| L2 | **Danger Ghost foi "projetado no futuro por Beco Pro"**, disfarçado de videogame clandestino no ponto cego da Rua Beltrão. | Vol. I cap. 4; enciclopédia §6 | O jogo é um **objeto que vem do futuro**. Ele "só está voltando". |
| L3 | **Capital Temporal:** tempo de vida, dinheiro e poder são controlados; a IA Suprema "drena os dias de vida" de quem desvia do labor. | enciclopédia §1 e §3; Vol. I Prólogo | O inimigo **cobra tempo**. O Legado precisa ser o contrário. |
| L4 | **Ponto Cego (Rua Beltrão):** anomalia sem monitoramento onde os rebeldes forçam **"blocos de tempo" piratas** para fazer pausas ativas e treinar **sem perder dias de vida**. | enciclopédia §5 | **A hora diária = um bloco de tempo pirata.** É canon. |
| L5 | **Ftasma tem o nome apagado** e por isso a IA não o controla: *"The void cannot be governed, nor taxed by cycles of time."* | Vol. I cap. 17 | Quem joga por vontade própria **não pode ser taxado** pelo tempo. |
| L6 | Os construtos da IA são feitos de **tempo de vida roubado**; derrotá-los "devolve os fragmentos de tempo roubados ao vazio de Nowhere". | Vol. I cap. 9 | Jogar **devolve** tempo. |
| L7 | **"Os mil ciclos":** Vol. I cap. 20 chama-se *"The Eternity of the Specter and the Thousand Cycles"* e diz que o calabouço ainda tem *"a thousand more episodes of trials"*; a enciclopédia fala da *"jornada milenar do fantasma"*. | Vol. I cap. 20; `lore_books.md` Parte 2 | Uma régua de **~1.121 anos** cai ao lado de "milenar". **[HIPÓTESE]** que seja coincidência feliz e não plano; se o dono planejou isso, melhor ainda. |
| L8 | O céu foi roubado: *"the world had long forgotten the shape of the stars."* | Vol. I Prólogo | Imagem para o **final** (as estrelas voltam). |
| L9 | *"...the asphalt will collect the sky's debt."* | Vol. II cap. 3 (fala do Sage Cat) | Uma **dívida do céu** já existe como frase de canon (base de E2). |
| L10 | **Âncora:** se Draga morrer, "the anchor will be broken. The Trail of Ink will dry". Ftasma se mantém por tinta nas paredes e pelo Gato. | Vol. II cap. 1 e 3 | Base de E1 (um ghost só "fica" enquanto alguém o mantém). |
| L11 | Em **2026** Ftasma acorda em Lugar Nenhum e encontra o Danger Ghost. | Vol. I cap. 4 | O jogo "acorda" no ano do lançamento; a estrada começa aí. |
| L12 | Ghostdex #001 (Polterstalk): *"A mass of blockchain data that escaped the DeSo network."* | `ghostdex_data.js` | Ghosts são **dados escapados**, não pessoas. **Ver nota abaixo.** |

> **Nota sobre L12 (fora do meu escopo, mas real):** o texto visível ao jogador do ghost #001 ainda cita **"DeSo"**. A persona do `narrative-designer` diz que a linha de lore ("dados que escaparam de uma rede") é intencional e mantida; mas quem ler isso hoje e for a `ghostgames.club` pode achar que o jogo ainda tem ligação com blockchain. Como o Legado vai atrair gente cética justamente com o tema "isso é cripto?", **sugiro ao dono decidir se troca "DeSo network" por "a dead network"** (é 1 palavra, mas é uma decisão de canon dele). **[HIPÓTESE]**

## 1.2 A moldura em duas camadas (recomendação: usar a Camada 1 agora, a Camada 2 só se o dono quiser)

### Camada 1 — "O jogo está voltando para casa" (**só [CANON], zero fatos novos**)

**A ideia em 5 frases (o que o jogador lê):**
1. *Danger Ghost foi escrito em 3147, por gente que precisava de uma saída, e enviado ao passado disfarçado de jogo pirata.* **[CANON L2]**
2. *Lá, o tempo é dinheiro e a Máquina cobra cada hora de você.* **[CANON L1, L3]**
3. *Mas existe um ponto cego, onde uma hora pode ser roubada de volta.* **[CANON L4]**
4. *Cada hora jogada é uma dessas horas — e cada mão que passa o jogo adiante o leva um pouco mais perto do ano em que foi escrito.* **[interpretação do canon; não cria fato novo]**
5. *Quando ele chega, a dívida está paga.* **[a palavra "dívida" é canon L9; "está paga" é o fecho — ver E2]**

**Por que os ghosts?** Porque ghosts, no mundo do jogo, são **dados sem dono** (L12) e não têm relógio próprio: só existem no tempo que alguém lhes dá. O ghost do legado é **o jogo inteiro, em forma de criatura**: quem o carrega carrega o próprio jogo rumo a casa. (Sem tocar em Ftasma: o Legacy Ghost é um ghost da Ghostdex — Polterstalk por padrão — **não é Ftasma**. Ftasma continua sendo o herói da campanha, "the Run".)

**Quem é o Keeper no lore?** Não é o Gato (esse é "the Guardian"). O Keeper é **quem está do lado de cá da tela**: alguém do **Ponto Cego**, a pessoa que rouba uma hora de volta e a entrega ao jogo. O papel dele dentro do mundo é **carregar a lanterna** (metáfora da `03`) e **escrever a Crônica** (a "tinta", ecoando *"The Trail of Ink"*, o rastro da RX). **[Interpretação sobre canon; sem fato novo.]**

**Por que a conta passa adiante?** Porque **um jogo pirata sempre foi passado de mão em mão** (fita emprestada, cartucho no recreio) — e porque a régua é maior que uma vida. No lore: *o jogo clandestino só sobrevive se alguém o passar.* Isso conversa direto com "se assim quiser": **quem recebe pode recusar**, como qualquer pessoa pode recusar um jogo emprestado.

**O que significa "zerar" (the Keystone)?** O jogo **chega em casa**: alcança 3147, o ano em que foi escrito. Quem estiver segurando a lanterna nesse dia é o **Keystone Bearer** — mas a chegada é da **Linha inteira** (a `03` já desenhou a cerimônia: os créditos rolam todos os Keepers). **Zerar não acaba o mundo** (D9 da `01`: o fim é da Linha, não do jogo).

### Camada 2 — extensões opcionais (**precisam do "sim" do dono**)

| Código | O que acrescenta | Por que valeria | Risco |
|---|---|---|---|
| **E1 — "A âncora"** | Todo Legacy Ghost é uma *âncora*: só mantém a forma enquanto alguém o mantém (generaliza L10 de Ftasma para os ghosts). Quando o Line fica **Dormant**, o ghost "repousa", nunca morre. | Dá **stakes emocionais sem culpa** ("repousa" e não "morre"). | Mexe na física do mundo: hoje só Ftasma é âncora. |
| **E2 — "A Dívida do Céu"** | Nível 1e11 = a **dívida do céu** (L9) paga. O número vira o *placar da dívida*. Em português "zerar" ganha sentido duplo: **zerar o jogo = zerar a dívida** (trocadilho natural do PT-BR). | Dá **peso simbólico ao número gigante** (o insight §8 do brief: o nível vira contador). | Cria um fato: a dívida tem tamanho exato. Evite mostrar "dívida restante" como contagem regressiva (seria um segundo número; o que o jogador sente deve ser a **Era**). |
| **E3 — "A Fenda aberta"** | A estrada 2026→3147 é o tempo que a **Fenda** (Vol. II, "the currents of the Rift") precisa ficar aberta. | Explica *por que* 1.121 anos. | **Perigoso**: soa a "a Fenda fecha se você não jogar" = cobrança. **Recomendo NÃO adotar.** |
| **E4 — "Uma estrela por Linha"** | Cada Line que faz o Keystone **devolve uma estrela** ao céu roubado (L8). O **Mapa do Céu** (§3.4) mostra as Lines como estrelas. Não é corrida: **toda** Linha coroada acende a sua. | Resolve a **coroação conjunta** (a `03` §5.5 mostrou que na coorte fundadora o empate é o caso esperado) e dá **imagem final**. | Cria um fato: as estrelas somem do céu de Neo Nit até alguém as devolver. É coerente com L8, mas é fato novo. |
| **E5 — "O ronronar do Gato" (cameo)** | O Gato ("calma o caos") aparece como presença tranquilizadora na **Investidura** (o Heir novato). | Cria conforto visual para quem nunca jogou. | Gato é personagem-chave; cameo precisa do "sim". |

> **Minha recomendação (Decisão D-N1):** publicar com a **Camada 1** (zero fatos novos) e **E2 + E4** só se o dono aprovar por escrito — o texto do Keystone (§1.6) já vem marcado com [E2] e [E4] nas linhas que dependem deles; se o dono disser "não", basta apagar essas linhas e o texto continua inteiro. **E3 eu desaconselho** e **E1/E5** ficam como "pedido de lore ao dono" para quando ele quiser escrever um Vol. III.

## 1.3 Como a moldura conversa com o que já existe (checagem de contradição)

| Elemento existente | Como o Legado trata | Contradiz o lore? |
|---|---|---|
| **Ftasma e "The Run"** (Vol. I e II; os 33 episódios) | A campanha de 33 episódios continua sendo **a fuga de Ftasma** (a história). O Legado é uma **camada por cima**, com outra unidade (a Linha). O Legacy Ghost **não é** Ftasma. | **Não.** Vol. I cap. 20 até *promete* "a thousand more episodes" (L7). |
| **Os 33 episódios** | Ficam como **a campanha** ("the Run"), jogável a qualquer momento, sem virar pré-requisito do Legado (decisão de escopo é do `game-designer`/dono). **Não** chamo os 33 episódios de "Era Zero": Era Zero, nos relatórios `01` e `09`, é a **fundação** (as contas de hoje). | Não. |
| **Cactus** (*"a Sentinela Corrompida da Memória Secundária"*, `SALVAGED_LORE` §4.1) | **Cameo opcional** como "sentinela do apodrecimento": uma partição corrompida é a imagem perfeita de **bit-rot**, o inimigo real de um arquivo de 1.000 anos (`04`). Pode guardar a porta entre Eras. | Não — mas o `SALVAGED_LORE` diz que é **matéria-prima, não canon publicado**. Decisão D-N4. |
| **Crow** (*"Net Watcher"*, caça vazamentos de dados, §4.2) | **Cameo opcional** como o "guarda dos vazamentos": diegese perfeita para o **consentimento por campo** da Crônica (`03` §3.4): *"o Corvo só deixa passar o que o Keeper permitiu"*. | Não; mesma ressalva. |
| **Level 26 (BecoPro Staging Area)** (§4.3) | **Reservado**, não usado no MVP. Uma "área de encenação" onde o ghost "toma consciência das regras de criptografia" seria o palco perfeito de uma **Investidura lendária** — mas o `SALVAGED_LORE` §5 avisa que a ligação Level 26 ↔ exposição "Lugar Nenhum" cruza outro projeto e precisa de confirmação do dono. A `03` já pôs a Investidura na **Torre do overworld**. | **Risco de contradição:** só se eu tratasse a ligação com a exposição como canon. **Não trato.** |
| **Niterói / overworld** (`pois.json`: Torre da Rua Beltrão, Cemitério da Rua Beltrão, Egregora) | A **Torre está na Rua Beltrão = o ponto cego** (L4): é o lugar **canônico** dos rituais de Handover. **Cemitério** (hoje abre um baú) = candidato a **Memorial/Hall of Keepers** (novo `interaction.kind`, o dispatcher de POI aceita kinds novos por dados + um handler). **Egregora** (mural social) = a **praça** dos tributos. | Não. É a mesma rua do lore. **[VERIFICADO em `pois.json` e `overworld.js`]** |
| **"Ftasma" (plural "Ftasmas") no `SALVAGED_LORE` §5** | Nos textos do Legado eu **não uso "Ftasmas" como classe**: Ftasma é o nome do herói no lore do dono. Uso "ghosts". | Evita uma contradição real entre as duas fontes. |
| **Ghostdex (101 espécies)** | A **espécie do Legacy Ghost é o brasão da Line** ("a Line dos Polterstalk"): 101 brasões possíveis, identidade de comunidade grátis. | Não. |

## 1.4 Tom e voz (o que evita erro de registro)

- O lore do jogo é **épico-pulp, neon-noir, prosa longa** (Vol. I). O texto **funcional** (login, save) é **seco** — diferença deliberada (persona `narrative-designer`, `SALVAGED_LORE` §2). **O Legado tem uma terceira voz:** a **voz da Crônica** — sóbria, curta, em segunda pessoa, com imagens concretas do lore (tinta, asfalto, lanterna, estrelas), **sem prosa roxa e sem culpa**.
- **Regras de tom (valem para todo texto do Legado):** (1) frases curtas; (2) descreva, nunca cobre ("*If a Keeper plays about an hour a day...*", nunca "*You should play every day*" — Princípio 10 da `01`); (3) nunca "your ghost misses you / you'll lose"; (4) recusar tem o mesmo peso visual que aceitar; (5) nunca "abandoned" — "Dormant"; (6) palavra de tradição viva, nunca (`01` D5); (7) o jogo é **100% inglês** (decisão já tomada); **as cartas dos Keepers podem estar em qualquer idioma** (a Crônica guarda o que a pessoa escreveu, na língua dela).
- **Canon x Crônica:** o que os Keepers escrevem é **história de jogadores, não canon do dono**. A tela deve dizer isso ("*Written by Keepers. Not official lore.*") — evita que a comunidade "invente lore" por acidente e que o dono perca o controle do mundo dele.

## 1.5 Nomes das Eras (gramática, não número)

O **número** de Eras e seus limiares é do `progression-actuary` (relatório `02`, ainda não disponível). O que eu ofereço é a **gramática de nomes**, derivada do lore, para que qualquer número caiba: **a subida pela cidade vertical de Neo Nit** (a sociedade é "dividida verticalmente" — enciclopédia §1; a escada magnética e as ilhas aparecem no Vol. I caps. 11–19).

Sequência sugerida **[HIPÓTESE, precisa do número do `02`]**: *Asphalt → Alleys → Rooftops → Cloudline → Magnetic Stair → Floating Isles → Silicon Gardens → Mirror Halls → False Sky → Stars.* São **10 nomes**; se o `02` propuser 12 ou 20 Eras, intercalamos com "Late/Deep/High" (*Late Asphalt, Deep Alleys...*) ou usamos as "Camadas do céu". Vantagem: **cada Era já tem imagem e cor** (`concept-artist`), e **a última é "Stars"** — coerente com L8 e com E4.

## 1.6 Textos-chave (inglês para o jogo + PT-BR para o dono)

Convenções: linhas marcadas com [E2], [E4] ou [E5] só existem se o dono aprovar aquela extensão. `{N}`, `{H}`, `{Y}`, `{D}` são variáveis que o servidor preenche. Todos os textos precisam de **revisão por falante nativo de inglês** (a `01` faz o mesmo alerta) e, os que forem cláusula, de **advogado**.

### 1.6.1 Tela "The Long Road" (a tela do Legado; o "porquê" da régua)

```
THE LONG ROAD

This game was written in the year 3147 and sent back in time,
disguised as a pirate game, to a street the Machine could not see.
It is still walking home.

If a Keeper plays about an hour a day, it arrives in 3147.
That is a measuring stick, not a schedule.

WHAT THE ROAD ASKS
Nothing. Play a little, play a lot. Skip a month. Skip a year.
When you are away, the Line is Dormant. Nothing is lost.

WHAT THE ROAD GIVES
A Chronicle: every Keeper of this Line, in their own words.
A Sealed Letter, if the Keeper before you left one.
A place among the stars, if you want one.

THE HONEST PART
Nobody can promise that a server, a website or a company will still exist
in 3147. We don't. We promise the pace is built for it, the record
is written to outlive us, and that if the road ends early, it ends with notice,
an export of your Chronicle, and a public archive.

Day {D} of 409,538.   Walk with us as far as it goes.
```

**PT-BR (para o dono):** *A LONGA ESTRADA — Este jogo foi escrito no ano 3147 e enviado de volta no tempo, disfarçado de jogo pirata, para uma rua que a Máquina não conseguia ver. Ele ainda está voltando para casa. Se um Keeper joga cerca de uma hora por dia, ele chega em 3147. Isso é uma régua de medida, não uma agenda. O QUE A ESTRADA PEDE: nada. Jogue pouco, jogue muito, pule um mês, pule um ano. Quando você está fora, a Linha fica Dormant; nada se perde. O QUE A ESTRADA DÁ: uma Crônica com todos os Keepers da Linha, nas palavras deles; uma Carta Selada, se o Keeper anterior deixou; um lugar entre as estrelas, se você quiser. A PARTE HONESTA: ninguém pode prometer que um servidor, um site ou uma empresa existirá em 3147, e nós não prometemos. Prometemos que o ritmo foi construído para isso, que o registro foi escrito para sobreviver a nós e que, se a estrada acabar antes, ela acaba com aviso, exportação da sua Crônica e um arquivo público. Dia {D} de 409.538.*

> **Dependências deste texto:** (1) "about an hour a day" depende do teto/rendimento decrescente que o `progression-actuary` (D4 da `01`) decidir; se o teto for duro, o texto vira "*Time beyond an hour a day counts for less*". (2) O contador "Day {D} of 409,538" tem que ser recalculado a partir da **data real de lançamento** (Day One), não de hoje: de 2026-09-20 até 3147-12-31 são **409.538 dias [CÁLCULO, refeito em Node]**. (3) O parágrafo "The Honest Part" é a versão curta do texto do `04` §7 (fonte única de verdade jurídica; este aqui não pode prometer mais que aquele).

### 1.6.2 A Carta ao Heir (roteiro guiado; a `03` §2.5 pede "roteiro para quem odeia página em branco")

Tela de escrita (o Keeper vê estas perguntas; pode ignorar todas):

```
A LETTER FOR WHOEVER HOLDS THE LANTERN NEXT
(You can write in any language. Only your Heir will read it, unless you choose otherwise.)

Dear Heir,
  What I loved about this ghost:
  What I got wrong, so you don't have to:
  A place in the game that is mine:
  What I would do on your first day:
  One thing I hope you'll try (you don't have to):
  Something I want you to know about me:
  A joke, if you have one:

If you decide not to keep the Line, that is a fine ending.
```

**Exemplo (semente para o `narrative-designer` do futuro; ~80 palavras):**

> *Dear Heir — I kept this ghost for eleven years, mostly on the train. The best hour of my week was the rooftop level at dawn, when the whole map goes orange; go there once. I never beat the mirror boss without the ice rune, which took me two years to figure out. I don't need you to finish anything. If you only ever play on Sundays, you're still carrying it. If you'd rather stop, close the Line and read my entry once; that's enough. — M.*

**PT-BR:** *Querido Heir — guardei este ghost por onze anos, quase sempre no trem. A melhor hora da minha semana era o nível dos telhados ao amanhecer, quando o mapa inteiro fica laranja; vá lá uma vez. Nunca venci o chefe dos espelhos sem a runa de gelo, e levei dois anos para descobrir isso. Não preciso que você termine nada. Se você só jogar aos domingos, ainda está carregando. Se preferir parar, encerre a Linha e leia minha entrada uma vez; basta. — M.*

**Regras da carta:** é **Sealed Letter** (só o Heir lê) por padrão; a `03` §3.4 já exige consentimento **por campo** para tornar algo público; **nunca** vira condição: a UI **não oferece** campo de "promessa obrigatória" (Princípio 3 da `01`); idioma livre; ajuda de IA na escrita é permitida, mas o campo mostra "written with help" se o Keeper marcar (coerência com D7 da `01`: IA nunca é o Keeper).

### 1.6.3 O epitáfio da Crônica (uma Entry por mandato)

A `03` §2.5 fixa: apelido + epitáfio (até 140 caracteres) + 3 marcos automáticos. Formato de exibição:

```
KEEPER 007 - "Maya"
2071-2094  |  3,412 hours  |  Eras crossed: Alleys, Rooftops
"Kept the lantern lit through the flood years."
Received from Keeper 006 (Handover: family).  Passed to Keeper 008.
```

- **Epitáfio em branco:** o sistema escreve só o **fato**, sem adjetivo: *"Kept the Line from 2071 to 2094."* (nunca um elogio gerado que a pessoa não escreveu).
- **Keeper que já não pode escrever** (falecido/inalcançável): só o **fato**, na opção **mais privada** que preserve a camada de fatos (regra da `03` §3.4). Um Heir pode escrever depois um **Adendo** ("*In memory: ...*"), nunca alterar a Entry (`03` §3.5).
- **Keeper que retirou o consentimento** aparece como *"Keeper #7"*, com horas e datas (camada de fato) e a linha "*A letter was withdrawn.*", sem drama.
- **Line que só teve um Keeper** não é fracasso: *"A Line of one. It was kept."*

**PT-BR:** *KEEPER 007 — "Maya" · 2071–2094 · 3.412 horas · Eras cruzadas: Alleys, Rooftops · "Manteve a lanterna acesa durante os anos da enchente." · Recebido do Keeper 006 (Handover: família). Passado ao Keeper 008.*

### 1.6.4 O texto do Keystone (o "zerar")

Toca **uma vez por Line** (a `03` §5.3 define a sequência de telas: créditos com todos os Keepers, a Pedra de Fecho, o ghost virando estátua no Hall). Este é o texto das telas de créditos e fecho:

```
THE KEYSTONE IS SET

Level 100,000,000,000.
The game has reached the year it was written.

[E2] The Machine kept its books in stolen hours.
[E2] You paid the sky's debt back one hour at a time,
[E2] across {Y} years and {N} hands.

[ ROLL CALL - every Keeper of this Line, in order, slowly ]

The ghost never had a name.
Its Chronicle has {N}.
You were holding the lantern when the road ran out.
You did not build this alone. Nobody could have.

[E4] Look up. The world had forgotten the shape of the stars.
[E4] One of them is yours now.

- The Chronicle stays open. There is always more asphalt. -   (variante "open")
- The Chronicle is sealed. It will be read. -                  (variante "monument")
```

**PT-BR:** *A PEDRA ANGULAR ESTÁ ASSENTADA — Nível 100.000.000.000. O jogo chegou ao ano em que foi escrito. [E2] A Máquina guardava suas contas em horas roubadas. Você pagou a dívida do céu de volta, uma hora de cada vez, ao longo de {Y} anos e {N} mãos. [CHAMADA — todos os Keepers da Linha, em ordem, devagar] O ghost nunca teve nome. A Crônica dele tem {N}. Você estava segurando a lanterna quando a estrada acabou. Você não construiu isso sozinho. Ninguém poderia. [E4] Olhe para cima. O mundo tinha esquecido o formato das estrelas. Uma delas é sua agora. — A Crônica continua aberta. Sempre há mais asfalto. — (ou) — A Crônica está selada. Ela será lida. —*

**Notas de cuidado (para o dono):**
- "*There is always more asphalt*" parafraseia uma frase **sua** (Vol. I cap. 20: *"There is still much asphalt to stain"*); troque se preferir citar literalmente.
- **O texto NÃO revela o Nome Verdadeiro de Ftasma** (o segredo continua seu): "*The ghost never had a name*" vale para o Legacy Ghost.
- A variante "open/sealed" depende da decisão D9 da `01` e da opção escolhida na `03` §5.4 (Monumento + Novo Ciclo como Line separada é a recomendada por ela; nesse caso use "sealed").
- "*Level 100,000,000,000*" vem em **Detalhes**, não como número gigante na tela principal (princípio de UX da `03` §4.1).

### 1.6.5 Textos curtos de operação (aviso, convite, cerimônia)

| Momento | Inglês (in-game) | PT-BR (dono) |
|---|---|---|
| **Handover, tela do Keeper que sai** (`03` §2.5-A) | *"You are about to pass the lantern. Your Entry and your letter stay. You won't play this Line after the Investiture. You can cancel until then."* | *"Você vai passar a lanterna. Sua Entry e sua carta ficam. Você não joga mais esta Linha depois da Investidura. Pode cancelar até lá."* |
| **Convite ao Heir** | *"Someone chose you to hold a ghost's Line. You don't have to. You can read everything first, ask questions, or say no. Nobody will be told why."* | *"Alguém escolheu você para segurar a Linha de um ghost. Você não precisa aceitar. Pode ler tudo antes, perguntar, ou dizer não. Ninguém será avisado do motivo."* |
| **Investiture** (`03` §2.5-B, cena na Torre) [E5] | *"The lantern is yours now. [E5] Somewhere in the static, a cat purrs. Take your time."* | *"A lanterna agora é sua. [E5] Em algum lugar na estática, um gato ronrona. Sem pressa."* |
| **Decline the Charge** | *"Thank you for reading. The Line will find another way, or it will rest. Nothing is owed."* | *"Obrigado por ler. A Linha achará outro caminho, ou vai repousar. Você não deve nada."* |
| **Line Dormant** (aviso ao Keeper e ao Heir) | *"The lantern is still lit. Nothing is lost. Come back whenever you like."* | *"A lanterna continua acesa. Nada foi perdido. Volte quando quiser."* |
| **Roll Call, abertura** | *"Tonight we read the names. Every Keeper who ever held a lantern, in the order they held it."* | *"Esta noite lemos os nomes. Cada Keeper que já segurou uma lanterna, na ordem em que a segurou."* |
| **Legacy Day, banner** | *"Day {D} of 409,538. Thank you for being here for this one."* | *"Dia {D} de 409.538. Obrigado por estar aqui neste."* |

> **Observação de coordenação com a `03`:** o aviso de 180 dias sem login na `03` §1.9 é *"sua lanterna espera"*. Isso **personifica** ("estão te esperando") e fica no limite do que a `01` (Princípio 10) e eu aceitamos. Proponho o texto acima ("*still lit / nothing is lost*"), que **informa** em vez de **puxar**.

# PARTE 2 — Cadência de conteúdo e operação por séculos

## 2.1 O que já existe para reaproveitar (e os limites reais de cada peça)

Persona do `live-ops`: conteúdo sustentável para dev solo **reusa sistemas que já existem**. Conferi no código o que existe hoje:

| Sistema existente | O que é, de fato **[VERIFICADO]** | Serve para | Limite que muda o calendário |
|---|---|---|---|
| **Badges (333)** | Catálogo vindo do servidor (`getBadgeCatalog`, `getUnlockedBadgeIds` em `server/index.js`), 6 categorias (`evolucao_assombrada`, `combate_espiritual`, `exploracao`, `acumulador_do_alem`, `acrobacias`, `segredos`), tipos de requisito reais em `server/seed_badges.js` (`level`, `kills`, `lives`, `episode_items_complete`, `boss_basic_attack_only`...), data de desbloqueio por conta. `assets/` tem só 6 ícones de badge. | Marcas de evento, "Founding Keeper", "Pioneer Seal" (a `09` planeja um `relics.pioneer_seal`, tabela própria), Roll Call. | Um badge novo é **dado no servidor**, sem recompilar APK. Mas um **tipo de requisito novo** (ex.: "escreveu uma Sealed Letter") exige código de servidor. |
| **Overworld / POIs** | `data/overworld/pois.json` tem 3 POIs: `tower_rua_beltrao` (`episode_entry`), `cemetery_beltrao` (`chest_entry`), `egregora` (`egregora_entry`). O dispatcher em `overworld.js` aceita `interaction.kind` novo por dado + um handler (kind sem handler = aviso no console, sem quebrar). | Hall of Keepers (no lugar/ao lado do cemitério), Mapa do Céu, Torre como palco do Handover. | POI novo é **dado**, mas o **handler** é código de cliente = web + mobile + **APK manual** (`CLAUDE.md` §3). |
| **Egregora** (mural social) | Tabela `egregora_messages`; só jogador autenticado escreve; **limite de 300 caracteres**, **30 posts/min por IP**, leitura paginada (50 por página); autor gravado como *snapshot* do nome. **Não existe** denúncia, remoção nem banimento. `email` é FK com `ON DELETE CASCADE` (apagar a conta apaga as mensagens). | Tributos entre Lines, "Legacy Day wall". | Sem moderação e sem noção de "qual Keeper escreveu" (só o nome da conta). Ver §3.2. |
| **Diário** | `diary_entries`: texto de até **5.000 caracteres**, por conta, persistido no servidor. | Rascunho da Sealed Letter e da Entry (a `03` desenha as próprias tabelas, mas o diário é o protótipo barato). | Sem noção de "selar" nem de consentimento por campo. |
| **Perfil público + amigos** | Perfil de outro jogador com nome, avatar, galeria e data de criação (`getPlayerProfile`); sistema de amizades (`friends.js`). | Página pública da Line; convite ao Heir. | Sem página de "Line". |
| **Chat global** | `InitGlobalChat()` conecta em `wss://broker.emqx.io:8084/mqtt`, tópico `danger-ghost/global-chat-room-v1`; **nick escolhido no cliente**, sem login; histórico só em `sessionStorage`. | Nada de oficial (ver §3.2). | **Broker público de terceiros:** qualquer pessoa que saiba o tópico publica; o operador não consegue banir, apagar nem provar quem escreveu. |
| **Deploy** | `server/deploy.sh` + skill `crossplatform-deploy`; mobile exige recompilar e redistribuir o APK à mão. | — | Evento que dependa de **código de cliente** só sai junto com uma release de APK (poucas por ano). |

> **Regra de bolso nascida daí:** *evento bom = dado no servidor + página estática.* Evento que precise de código novo de cliente entra numa **release trimestral ou semestral**, nunca "esta semana".

## 2.2 Sete princípios de cadência

1. **Eventos dão memória, não poder.** Recompensa de evento é **badge, moldura de Entry, cor de estrela, linha na Crônica**. **Nunca XP, nível ou item de combate** — a régua não pode ser acelerada por calendário (`05`: o nível do legado vem do tempo creditado pelo servidor) e uma recompensa com poder cria preço de conta (RMT).
2. **Nada é perdível para sempre.** Todo badge de evento tem **rota alternativa** ou **volta no ano seguinte**. Exceção honesta: marcas de *testemunho* ("estava presente no Roll Call de 2027") são **honorárias e sem poder**, e sempre há a versão "li a Chamada" para quem não estava.
3. **Camada lenta e camada rápida** (Long Now / *pace layers*, Princípio 6 da `01`). *Lenta:* as 3 datas rituais (não mudam sem aviso público de ≥ 12 meses). *Rápida:* micro-eventos, quadros de aviso (podem mudar todo ano).
4. **Nada diário.** Sem login-reward, sem missão diária, sem sequência (Princípio 10 da `01`; `03` §4.1). O jogo tem **rituais anuais**, não obrigações diárias.
5. **Ritual que só o dev sabe rodar morre com o dev.** Todo ritual tem **runbook de uma página** e, a partir do ano 3, uma **segunda pessoa** que já o rodou uma vez (liga com o documento "Como reconstruir o jogo" do `04` §3.4).
6. **Canal próprio primeiro, rede social depois.** O aviso oficial nasce no jogo, no site e no arquivo; X/Telegram/YouTube **replicam** (mesma regra do `04` §2.2, invariante 3). Redes são **megafones, não cofres**.
7. **Cadência honesta:** o jogo tem ~48 contas hoje. Um calendário de "evento toda semana" seria teatro. **Menos, e sempre cumprido**, vale mais que muito e falhando.

## 2.3 O calendário de rituais e eventos

Datas são **propostas [HIPÓTESE]**; a decisão é do dono (D-L1).

| Ritual | Quando | O que acontece | Reaproveita | Carga do dev por vez |
|---|---|---|---|---|
| **Day One / Legacy Day** | Aniversário do **Dia da Fundação** (o dia em que a Era Zero começa; a `03` §1.9 já usa essa data para reiniciar o relógio de silêncio das contas atuais) | Banner "Day {D} of 409,538"; **Renovação do jogo** (o "check-up" anual: saúde do Legado, cópias, domínio, ver `04` §6.3); post "o ano em números" (horas somadas, Lines vivas, Handovers) a partir de consultas SQL; **1 badge** ("was here for Legacy Day N", com versão "read the report") | Badges, banner, página estática | ~8 h |
| **Roll Call** (a chamada dos nomes) | **21 de junho** (noite mais longa do ano no hemisfério sul, onde fica Niterói; data fixa evita depender de astronomia no código) **[HIPÓTESE]** | O jogo lê, em ordem, os nomes **autorizados** de todos os Keepers (passados e presentes; no ano 1 são os *First Keepers*); Cemitério/Hall com banner; página estática com a lista; **sem prêmio de poder** | Hall/POI, badge honorário, página | ~4 h |
| **Renovação da Line** (a `03` §2.5-C) | No **aniversário de cada Line** | Check-up de 2 min ("seu e-mail ainda existe? seu Heir ainda é o mesmo? quer baixar seu Livro?"); é também a verificação de integridade do `04` | Sistema do `03`; **automático** | 0 h (após implementado) |
| **Handover público (opcional)** | Quando acontecer | Se **ambos** consentirem, a Chronicle anuncia "*Keeper 007 passed the lantern to Keeper 008*"; a comunidade pode deixar um **tributo** curto (§3.5). **Nunca** obrigatório; nunca com nome sem consentimento. | Egregora, Hall | ~0,5 h por ocorrência (post manual) |
| **Quarter Note** (resumo trimestral) | 4×/ano | Texto curto no site: Lines ativas/Dormant, Entries novas, o que mudou. Reproduzido no Telegram/X. | SQL + template | ~1,5 h |
| **Micro-evento** | 2×/ano no ano 1 (4×/ano depois) | Um **tema de 7–10 dias**, 3–5 badges, sem poder (ex.: *Secrets Week* reaproveitando a categoria `segredos`; *Letters Week* incentivando escrever uma Sealed Letter ou uma "Letter to 3147"; *Long Night Walk* no Roll Call). Todos **voltam no ano seguinte**. | Badges | ~8 h |
| **Cerimônia de Era** | Quando a Line cruza uma Era | Tela pessoal (a `03`/`02` desenham); **anúncio público só se o Keeper optou** | Sistema | 0 h |
| **Marcos de Século** | 2126, 2226, ... (a cada 100 anos) | Cápsula do tempo: "Letters to 3147" lacradas pelo servidor; edição especial do Livro do Ano | Selos (`03` §3.3) | (fora do horizonte do ano 1) |
| **Dia da Primeira Lanterna** | Na primeira Coroação (a `03` §5.3) | Evento de mundo único | Cerimônia da `03` | (futuro distante) |

**Regra de falha (o que acontece se o dev sumir na data):** cada ritual tem um **modo mínimo automático** = banner por flag no servidor + a página estática já pronta. Se o dev não aparece, o banner sobe sozinho e a página existe. **Não** depende de post em rede social (essas são "bônus").

## 2.4 Temporadas sem FOMO punitivo

*FOMO* = medo de ficar de fora. Temporada comum pune quem não estava: recompensa some ao fim. Isso **contradiz** "se assim quiser" (Princípio 3). Proposta:

- **Ano 1–2: sem temporadas.** Só os 3 rituais fixos + 2 micro-eventos.
- **A partir do ano 3 (se houver comunidade):** **"Long Seasons"**, 2 por ano, cada uma um **tema de leitura** (não de corrida): "a Era em que estamos", "os lugares do mapa". O conteúdo dela (badges, texto) **fica disponível para sempre** em "Archive"; a temporada é um **destaque**, não uma porta que fecha.
- **Se o dono quiser exclusividade:** só de **testemunho** ("estava lá"), sem poder, e com alternativa.
- **Anti-metrica:** **não** medir sucesso por *daily active users*, sequência ou tempo de sessão. São métricas de cobrança e o conceito é o oposto.

## 2.5 Carga real para um dev solo (ano 1)

**[HIPÓTESE — não tenho histórico de horas do dono; ajuste depois do primeiro trimestre.]**

| Item do ano 1 | Horas |
|---|---:|
| Charter, páginas (Long Road, régua, FAQ) e compromisso de encerramento (§1.6, §4) | 10 |
| Carta pessoal às contas atuais + registro dos Fundadores (§4.4; a parte técnica é da `09`) | 10 |
| Acompanhar 2–3 Pilot Handovers (§6.2) | 4 |
| Legacy Day (1 vez) | 8 |
| Roll Call (1 vez) | 4 |
| Micro-eventos (2 × 8 h) | 16 |
| Quarter Notes (4 × 1,5 h) | 6 |
| Recrutar e treinar 2 Lookouts + manual (§3.3) | 6 |
| Moderação (~15 min/semana, ~48 contas) | 13 |
| Relatório mensal de saúde (12 × 0,5 h) | 6 |
| **Total** | **≈ 83 h/ano (~7 h/mês)** — teto com folga ×1,5 ≈ **125 h** |

Para comparar: a `09` estima **27 a 41 dias** só de desenvolvimento técnico do Legado. Os ~83 h de operação são **em cima disso** e só começam depois que a Crônica existir. **Se o dono só tiver 4 h/mês, cortem os micro-eventos primeiro** (16 h) e mantenham os 3 rituais.

**Trajetória alvo:** ano 1 dev faz tudo (~83 h) → ano 3 dev ≤ 50 h (2 Lookouts + 1–2 Scribes rodando o resto) → ano 5+ dev/fundação ≤ 30 h com **teste de ausência de 90 dias** aprovado (§2.6).

## 2.6 Automação em degraus e o "Livro dos Rituais"

| Degrau | Quem roda | Sinal de que subiu de degrau |
|---|---|---|
| 0 | Dev, à mão | Ano 1 |
| 1 | Dev com **script** (SQL → texto pronto do Quarter Note; flag de banner) | 2º ano |
| 2 | **Voluntário** com o runbook, dev só aprova | Quando existirem ≥ 2 Scribes ativos |
| 3 | Sistema **automático** (banner, página) + voluntário só para o texto | ≥ ano 5 |

**Livro dos Rituais** (1 página por ritual): data, para quê existe, quem roda e quem é o reserva, entradas (consultas), saídas (texto/página/badge), modo mínimo automático, "como saber que deu certo", tempo estimado. Fica **dentro do arquivo do Legado** (`04` §2.3) e do "Como reconstruir o jogo".

**Teste de ausência de 90 dias (do ano 3 em diante):** o dev fica 90 dias sem tocar em nada; critério de aceite = **todos os rituais do período saíram no modo mínimo e nenhum aviso de custódia (escada da `03` §1.9) deixou de sair**. É o análogo, para a comunidade, do "simulacro anual de restauração" do `04` §6.3.

# PARTE 3 — Comunidade entre gerações

## 3.1 Como uma comunidade de 2026 convive com a dos netos

**Honestidade primeiro.** A `01` (busca negativa, B.1.3) não achou nenhum jogo com uma conta única passando de pessoa em pessoa por séculos; o MMO mais antigo em atividade tem ~30 anos. **Não existe precedente de comunidade assim.** O que existe são precedentes parciais: comunidades de jogo longas (mundos persistentes), instituições que sobrevivem a seus fundadores por **regras escritas e papéis substituíveis**, e o caso de governança mais estudado dos mundos virtuais, o do **LambdaMOO**: em 1993, quatro meses antes de um incidente grave, o arquimago Haakon anunciou que os *wizards* seriam "puros técnicos" que só executariam decisões da comunidade; depois do incidente um usuário-programador, **por conta própria** e sem decisão conclusiva de uma reunião de quase três horas, apagou a conta do infrator, e o mundo acabou criando um sistema de arbitragem **[VERIFICADO: Wikipedia "A Rape in Cyberspace"; cópia do artigo de Dibbell 1993 no MIT — URLs no Anexo]**. **A lição que tiro (interpretação [HIPÓTESE]):** decisão tomada por uma pessoa, no calor, sem regra escrita, gera crise de legitimidade que dura anos. Para uma comunidade de décadas, a regra vem **antes** do problema.

**A tese deste capítulo:** comunidade entre gerações **não se forma por afinidade espontânea** (o vizinho de 2076 não vai gostar das mesmas piadas de 2026). Ela se sustenta em **três coisas concretas**:

| Camada | O que é | Como se materializa |
|---|---|---|
| **Lugares** | Sítios onde gerações se encontram *sem estarem ao mesmo tempo* | Hall of Keepers, Mapa do Céu, a Egregora, a Crônica |
| **Rituais** | Datas fixas em que "todos leem o mesmo texto" | Legacy Day, Roll Call (§2.3) |
| **Papéis substituíveis + carta curta** | Poucas funções que mudam de mãos sem drama e regras que quase nunca mudam | Lookout, Scribe, Charter (§3.3 e §3.8) |

O nome da comunidade dentro do lore: **"the Blind Spot"** (o Ponto Cego, **[CANON]** L4: o lugar da Rua Beltrão que a Máquina não vê). *Keepers, Heirs e Successors somos todos o Ponto Cego.* Nome proposto; decisão D-L4.

## 3.2 O que existe hoje e o que **não serve** de base

**Achados verificados que mudam o desenho:**

1. **O chat global não é do jogo.** É um broker MQTT público e gratuito de terceiros (`broker.emqx.io`), com **apelido escolhido no navegador** (`GUEST_1234` por padrão) e **sem autenticação**. Consequências concretas: (a) o operador **não consegue banir, silenciar nem apagar** uma mensagem; (b) quem descobrir o tópico publica de fora do jogo (spam, ódio); (c) **não há prova de quem escreveu**; (d) o histórico só existe na aba do jogador; (e) se o provedor mudar ou cair, o chat some sem aviso. É a "bomba-relógio de chat sem moderação" que a persona do `community-manager` já avisa. **Recomendação:** rotular hoje como **"public, unmoderated"**; **não** hospedar nenhum ritual do Legado nele; antes de qualquer evento ligado à Crônica, mover para canal **autenticado no servidor do jogo** (`network-programmer` + `backend-architect` + `security-engineer`). Onde há **menor** (Heir menor de idade, `01` F6/D11), o chat público **não deve estar acessível**, o que é decisão do `digital-succession-counsel`.
2. **A Egregora é o embrião certo**, mas com 4 lacunas: sem denúncia/ocultação/remoção; **sem noção de qual Keeper escreveu** (guarda o nome da conta, e o nome pode ser o mesmo em 3 Keepers seguidos); `ON DELETE CASCADE` no `email` (apagar a conta apaga tudo que ela escreveu; conflita com a Crônica em duas camadas da `03` §3.2); e a conta **é** o e-mail (chave primária), que a `05` e a `03` já marcam como o elo que mais cedo apodrece. **Para o `backend-architect`:** ao migrar para UUID, gravar `keeper_index` e `line_id` em cada mensagem e substituir o cascade por anonimização.
3. **Comunidade real, hoje:** ~48 contas. **Não conferi** quantos seguidores/mensagens há em X, Telegram e YouTube (**[NÃO VERIFICADO]**, ver (f)). Tudo aqui é desenhado para "poucas dezenas hoje, talvez centenas depois".

**Canais reais (do `index.html`) e o papel de cada um no Legado:**

| Canal | Endereço (real) | Papel proposto | Cuidado |
|---|---|---|---|
| **Site do jogo** | ghostgames.club | **Casa da Crônica e dos avisos oficiais.** O canal de verdade. | O **domínio** é a peça mais barata e mais perigosa de perder (`04`, achado 4). |
| **Telegram** | t.me/ghostgamesss | **Sala de estar:** perguntas, acolhida de Heirs, Lookouts | Sem controle nosso: exporte periodicamente. |
| **X/Twitter** | @GhostGamesnit | **Megafone:** Legacy Day, Roll Call, Quarter Note | Rede pode mudar de dono/regras; nada vive só lá. |
| **YouTube** | @ghostgames-nit | **Devlog** e o vídeo anual do Legacy Day | Idem. |
| **E-mail** | ghostgamesniteroi@gmail.com | **Contato de apelação** e pedidos de retirada (LGPD) | Caixa de uma pessoa só: um ponto único de falha; precisa de suplente (`04`). |
| **Hyperfy** | hyperfy.io/desoghostmansion | **Opcional/experimental** (encontro virtual num Handover público) | Plataforma de terceiros; **não** depender. Nome "deso" é só da URL/espaço (ver `CLAUDE.md` §1). |

> **Regra do `community-manager` que mantenho:** o agente **rascunha e recomenda**, **nunca posta** em canal real sem o "sim" do dono, a cada vez.

## 3.3 Papéis de comunidade (poucos, substituíveis, sem poder de jogo)

| Papel | Quem | Faz | **Nunca** faz | Termo / rodízio |
|---|---|---|---|---|
| **Keeper**, **Heir/Successor**, **Curator** (contato de confiança), **Apprentice** (ex-Keeper) | vêm da `03` §1.2 | (ver `03`) | (ver `03`) | — |
| **Lookout** *(vigia; do vocabulário de crew de rua: quem fica de olho enquanto os outros pintam)* | Voluntário **adulto** (18+) | Acolhe Heirs e novatos no Telegram/Egregora; responde FAQ; sinaliza abuso ao Operador; ajuda a recrutar o próximo Lookout | Banir, apagar Entry, ler Sealed Letter, **falar em privado com menor** (só via Custodiante), pedir dado pessoal | 2 anos, **mínimo 2 pessoas** ativas; sai por inatividade de 12 meses, **sem vergonha** |
| **Scribe** *(cronista)* | Voluntário adulto, convidado pelo Operador nos 2 primeiros anos e depois pelos Scribes (com veto do Operador) | Cuida da **higiene do texto**: erros de digitação, formatação, **notas de contexto** ("editor's note") em Entries antigas; propõe **Adendos**; escreve o Livro do Ano | **Editar ou apagar** a Entry de outro Keeper (a `03` §3.5: só Adendo/retirada); ler Sealed Letter; editar a **própria** Line (recusa: outro Scribe cuida) | 2 anos, mínimo 2 |
| **Operator / Foundation** | O dev hoje; entidade depois (`04`) | Última palavra em moderação; cumpre ordem legal; publica errata assinada | Acelerar Vigil por pedido pessoal (`03` §1.2); reescrever a Crônica | — |

**Regras dos papéis:** (1) **nenhum papel dá poder no jogo** (nível, item, ranking); (2) **impedimento por conflito** (Scribe não mexe na Line de que faz parte, Lookout não modera conflito que envolva parente); (3) **manual de 2 páginas** por papel (entra no "Livro dos Rituais"); (4) voluntário **não paga nem recebe** dinheiro atrelado ao papel no ano 1 (evita virar renda e conflito de interesse; se um dia houver fundação, decide-se com contador/advogado); (5) **lista pública** dos papéis e de quem os ocupa (com apelido).

*Nota de nomes:* "Lookout" e "Scribe" são **propostas**; a cultura de rua (RX, xarpi, crew) é do dono, então ele decide se o vocabulário de crew combina. **Evitei** "toy" (gíria de grafite para novato; costuma ser ofensiva) e "Warden" (no lore são os **Temporal Wardens**, golens **inimigos**: Vol. II cap. 5).

## 3.4 Mural de linhagens: o **Mapa do Céu** e o **Hall of Keepers**

Duas telas, uma para o **passado** e uma para o **presente**, ambas **sem ordem de "melhor"**:

**Hall of Keepers** (a `03` §5.3–5.4b já define: Lines **Coroadas**, em **ordem cronológica**, sem 1º/2º/3º). Fica num POI novo (proposta: reaproveitar o **Cemitério da Rua Beltrão**, hoje um baú) ou em uma página do site. **O que mostra:** Lines coroadas; Lines aposentadas com honra; **"Lines retomadas"** (uma Line Dormant que voltou), porque a `01` (F4) alerta que um mural só de interrompidas vira "cemitério digital" que **desanima** quem chega.

**Mapa do Céu** (ideia própria; funciona **com ou sem E4**). Um céu escuro (Canvas 2D simples, sem shader; o projeto não tem WebGL) com **um ponto por Line**:
- **Posição:** calculada por *hash* do id da Line (nunca por nível), para não vazar nem premiar nada.
- **Cor:** o **brasão da espécie** do Legacy Ghost (101 espécies = 101 cores/brasões possíveis).
- **Brilho:** anos de **Crônica ininterrupta** (calendário, não horas; difícil de fabricar).
- **Linhas entre pontos:** **tributos** trocados entre Lines (§3.6).
- **Dormant:** ponto **apagado, nunca removido**; volta a brilhar quando a Line acorda.
- **Privacidade:** por padrão o ponto é **anônimo**; nome só com consentimento (`03` §3.4).
- Com **E4**, uma Line **Coroada** ganha uma estrela **fixa**, mais forte. Sem E4, ganha um ponto dourado.
- **Custo:** dados são poucos (uma linha por Line); é **fase 2** (ano 2), depois de existirem Handovers de verdade.

## 3.5 Ranking por Line/geração sem incentivar trapaça nem compra de conta

**Ponto de partida (do que os outros relatórios já fixaram):** a régua é **por Line** (`03` §4.2); o nível do legado vem do **tempo creditado pelo servidor** (`05`); "**nenhum ranking pessoal sobrevive a uma troca de Keeper**" (`03` §5.4b); o teto diário deixa um bot de 24 h ganhar o mesmo que 1 h (`05`).

O que eu acrescento é o **lado da comunidade**: *o que mostrar e o que não mostrar.*

| Placar | Mostra | **Não** mostra | Por quê é seguro |
|---|---|---|---|
| **Hall of Keepers** (Coroadas) | Data de coroação, Keepers creditados | Ordem 1º/2º/3º além da nota de *Primazia* (`03` §5.5) | O prêmio é da Line e não é vendável |
| **Lines em curso** | **Era** atual, nº de Keepers, "mais antiga em atividade", "maior tempo sem lacuna" | **Nível cru** e horas exatas | Era grossa esconde anomalia pequena e não dá alvo para trapaça fina; até o `05` ser provado em produção, **nada de nível exato público** (recomendação para os primeiros 3–5 anos) |
| **Coortes** ("Class of 2026" = Lines dos *First Keepers*) | **Quantas ainda caminham** (número absoluto, faixa) | Lista ordenada | Coorte é identidade, não corrida |
| **Brasões** | Quantas Lines por espécie | Quem é "o melhor Polterstalk" | Cria pertencimento (101 casas) sem rivalidade individual |
| **Tributos recebidos** | Só como "conexões" no Mapa do Céu | Contagem pública | Sem número, não há o que inflar |

**Regras anti-RMT do lado comunitário** (o mecanismo técnico é da `03` §2.4/§2.5 e da `05`):
1. **Handover de estranho é público e lento** (designação envelhece 30 dias + Vigil de 14 + guarda mínima de 180; tudo da `03`). Uma Line "comprada" **nasce com a etiqueta "Short Guard"** na Crônica.
2. **Uma "geração" só conta** para qualquer placar se o Keeper ficou **≥ 180 dias** (a mesma guarda mínima da `03`). Evita a fábrica de "gerações" (o mesmo grupo passando a conta de mão em mão para inflar o número de Keepers).
3. **Nada que um placar dê é vendável:** sem item, sem XP, sem título transferível. O que sobra é **história**, que fica na Line, não na pessoa.
4. **Denúncia de venda:** botão "*report a sale*" (para os Lookouts/Operador); o texto público do jogo diz, sem rodeio, que **conta não se vende** (`digital-succession-counsel` valida a redação e a consequência).
5. **"Stress Testers"** (opcional, D-L9): jogadores que **acham falhas** (exploit) e reportam de boa-fé recebem **crédito na Crônica do jogo** (nunca poder). Vira o "hardcore que quer quebrar" em **testador**. Exige regra de divulgação responsável e **redação jurídica** (porto seguro): `security-engineer` + `digital-succession-counsel`.

## 3.6 Tributos entre Lines

Um **tributo** é uma mensagem curta de um Keeper para outra **Line** (nunca para uma pessoa). Exemplos: *"I read Keeper 006's letter from 2051. It made my week."*

| Regra | Valor proposto **[HIPÓTESE]** |
|---|---|
| Tamanho | até 140 caracteres, só texto (sem link, sem imagem) |
| Limite | 1 tributo por remetente por Line-alvo por ano; máx. 3 por Keeper por mês |
| Quem pode enviar | Keeper autenticado, conta com ≥ 90 dias (frustra contas-fantasma) |
| Onde aparece | Página da Line; **o Keeper atual pode ocultar** (não apagar) |
| Moderação | **Pré-moderado** por Lookout/Scribe enquanto o volume for baixo (~48 contas tornam isso viável); botão "denunciar" desde o dia 1 |
| Recompensa | **Nenhuma** (nem badge de poder): um ícone de "vela" na página. Sem recompensa, não há o que fazer *farm* |
| **Vela silenciosa** | Acender uma vela na Line sem escrever nada; conta **visitantes distintos**; para quem não quer escrever |
| **Sem mensagem privada** | O Legado **não cria DM em lugar nenhum** (segurança por desenho, principalmente com menores) |

## 3.7 Recepcionar Heirs novatos (o lado comunitário do Vestibule e do Apprentice Ghost da `03`)

O Heir pode nunca ter jogado (cônjuge, criança, amigo, estranho do Commons; os 6 fluxos de `03` §4.5). A tecnologia (Vestibule, Apprentice Ghost, Sealed Letter) é da `03`. O **acolhimento** é nosso:

1. **A carta do Keeper anterior** é o primeiro contato (não um tutorial genérico): "a Crônica é o tutorial" (`03` §4.1).
2. **"Your first week"** (1 página no tom da Crônica): onde clicar, o que ignorar, **o que você não deve nada**.
3. **Lookout opcional:** o Heir pode **aceitar ou recusar** um guia. Resposta combinada em até **72 h** (voluntário; **[HIPÓTESE]**).
4. **Nada compara** o Heir com o antecessor (`03` §4.1, princípio 1).
5. **Heir menor:** **todo contato vai ao Custodiante** (`03` F1); Lookout **nunca** fala com o menor.
6. **Estranho pelo Commons (Successor):** vê a lista de "Lanternas apagadas" (fatos), lê o Livro público, e a página da Crônica registra o **"Silêncio"** do intervalo em vez de escondê-lo (`03` F4). O acolhimento inclui um texto honesto: *"You are not replacing anyone. You are picking up a lantern."*
7. **Perguntas sem vergonha:** uma seção "*Questions people were afraid to ask*" no FAQ (o dono e os Lookouts alimentam).

## 3.8 Política de moderação e conduta por décadas

**Oito princípios (a "Charter of the Blind Spot", 1 página, quase imutável):**

1. **Sancionar a voz, nunca a memória.** Um Keeper que quebra a conduta pode perder **a capacidade de postar**; **a Line e a Crônica dela continuam**. Em caso grave, o Keeper é convidado a fazer um Handover (a Line tem herdeiros).
2. **Regra escrita antes do problema** (lição do LambdaMOO, §3.1). Cada sanção cita a regra.
3. **Escada de sanções:** aviso → silêncio temporário (dias) → suspensão (semanas) → banimento. **Permanente só para o grave** (ameaça, doxxing, risco a menor, golpe de venda de conta).
4. **Duas pessoas para decisão permanente** (Operator + um Lookout/Scribe sênior); nunca uma pessoa sozinha no calor.
5. **Sanções expiram** (temporárias) e as permanentes são **revistas a cada 5 anos** — pessoas mudam em décadas.
6. **Contexto, não apagamento:** Entry antiga que hoje ofende (a língua muda) ganha **nota de contexto** (como legenda de museu), não edição silenciosa (`03` §3.5: Adendo/errata). **Remoção** só por motivo legal/segurança, com marcador "*[Entry withheld]*".
7. **Cláusula do luto:** ninguém zomba, em lugar nenhum, de um Keeper falecido ou de uma Entry "In memory". É a regra mais curta e a primeira a valer.
8. **Transparência:** **relatório anual só com números** (casos abertos, sanções por tipo) no site.

**Apelação:** por e-mail (o do `index.html`) a um segundo revisor; resposta em até 14 dias **[HIPÓTESE]**.
**Idiomas:** o jogo é em inglês; os canais podem ser PT/EN; cada canal declara **um** idioma principal.
**Anti-perseguição:** proibido caçar um Keeper por ter vendido/passado a Line **sem** denúncia formal (evita linchamento; o caminho é reportar).
**Menores:** nenhum canal do Legado permite mensagem privada; adultos voluntários **só** falam com menores via Custodiante (`03` F1).
**Nada disso é aconselhamento jurídico:** a Charter e a política de sanções precisam de revisão do `digital-succession-counsel` e de advogado habilitado (LGPD, ECA Digital).

# PARTE 4 — Comunicar o conceito ao público, com honestidade

## 4.1 A regra-mãe: **prometer o ritmo, não o futuro**

| Podemos dizer (e provar) | **Não** podemos dizer |
|---|---|
| "O ritmo do jogo foi calibrado para que **1 h/dia de tempo ativo** leve ao nível 1e11 em 3147." (**[CÁLCULO]**: 409.538 dias de 2026-09-20 a 3147-12-31; a `03` §5.6 mostra que **perder dias atrasa**: com 95% de dias jogados a chegada vai para 3207.) | "O jogo vai durar 1.121 anos." / "eterno" / "para sempre" / "garantido" |
| "A Crônica é escrita para **sobreviver ao jogo**: formatos abertos, cópias independentes." (`04` §2.3 e §2.5) | "Seus servidores estarão aqui em 3147." |
| "Se o jogo tiver que encolher, ele desce em **etapas, com aviso e exportação**." (`04` §2.2) | "Nada de ruim vai acontecer." |
| "Conta **não se vende**; a passagem é gratuita, cerimonial e registrada." (`03` §2.4) | "Sua conta vai valer muito." (nunca falar em valor/investimento) |
| "Recusar uma herança **não custa nada**." (`01` Princípio 3, D8) | "Seu filho vai continuar de onde você parou." (promete o que a pessoa não escolheu) |

**Palavras proibidas no material público:** *forever, eternal, guaranteed, invest, own, wealth, legacy of value, NFT, token.* **Palavras de escolha:** *designed for, measuring stick, if a Keeper plays..., as far as it goes, notice, export.*

> **Aviso jurídico [HIPÓTESE, validar com `digital-succession-counsel`]:** publicidade que prometa duração ou valor que não se pode cumprir pode ser tratada como **publicidade enganosa** pelo Código de Defesa do Consumidor (é a razão de eu recomendar o vocabulário acima, mas **não sou advogado** e não conferi a norma hoje).

## 4.2 A mensagem (para o `marketing` usar; eu só defino o conteúdo)

**Quatro pilares (cada um cabe numa frase; todos são verdade verificável):**
1. **A game you can leave to someone.** (Legado por escolha, "se assim quiser".)
2. **One hour is enough.** (Descritivo, não prescritivo; sem streak.)
3. **Every Keeper is written down.** (A Crônica.)
4. **Honest about the odds.** (O contador e a página de Saúde do Legado.)

**Tagline candidatas (EN, com PT):**

| # | Inglês | PT-BR | Nota |
|---|---|---|---|
| 1 | *A game you can leave to someone.* | *Um jogo que você pode deixar para alguém.* | **Recomendada.** Curta, honesta, é o "se assim quiser" do dono. |
| 2 | *One hour a day. Any lifetime. Then the next.* | *Uma hora por dia. Qualquer vida. Depois a próxima.* | Boa para texto longo; a palavra "then" pode soar promessa de continuidade. |
| 3 | *Play a little. Leave the rest to whoever comes next.* | *Jogue um pouco. Deixe o resto para quem vier.* | Calorosa; ótima para a Carta ao Heir. |
| 4 | *Day 1 of 409,538.* | *Dia 1 de 409.538.* | Ótima como **assinatura**, ao lado da tagline 1. Honesta e memeável. |
| 5 | *See you in 3147.* | *Nos vemos em 3147.* | **Tag oficial de meme** (§4.7). |

**Elevador (EN, 3 frases):** *"Danger Ghost is a 2D RPG in a Niterói that never existed, and it's built to be handed down. It's paced so that a Keeper playing about an hour a day reaches the end in the year 3147. Nobody can promise it will last that long, so we publish how it works, keep the record in open formats, and tell you exactly what happens if it ends."* **PT-BR:** *"Danger Ghost é um RPG 2D numa Niterói que nunca existiu, feito para ser passado adiante. O ritmo foi calibrado para que um Keeper jogando cerca de uma hora por dia chegue ao fim no ano 3147. Ninguém pode prometer que dure tanto; por isso publicamos como funciona, guardamos o registro em formatos abertos e dizemos exatamente o que acontece se acabar."*

**Contador público "Day {D} of 409,538"** *[HIPÓTESE, recomendada]*: transforma a promessa impossível numa **medida honesta e um meme** ("*we made it to day 2*"). **Risco:** se o projeto morrer, o contador congelado vira ironia cruel; **mitigação:** no Closing (§5.5), o contador **para** com um texto próprio. A `04` §7 recomenda a página **"Saúde do Legado"** (último simulacro, nº de cópias, vencimento do domínio, nível N1–N4 atual): **números verificáveis em vez de adjetivos**. Recomendo **as duas**.

## 4.3 Ordem de revelação (não anuncie antes de poder cumprir)

| Fase | Quando | O que sai | Condição para sair |
|---|---|---|---|
| **0** | Agora | Nada (o dono aprova o plano) | Aprovação escrita |
| **1** | Antes de qualquer coisa pública | **Carta pessoal às ~48 contas** (§4.4) | A migração escolhida (a `09` recomenda **Era Zero aditiva**) está decidida e testada em simulação |
| **2** | Depois da Fase 1 | Página "The Long Road" + FAQ + **compromisso de encerramento digno** + Charter no site; post no Telegram | **Integridade do tempo pronta** (`05`): hoje **um único pacote `save_game_state` adulterado zera o jogo** **[VERIFICADO no `05`]**. Anunciar uma régua que qualquer cliente adulterado quebra é **armadilha de credibilidade** |
| **3** | +1 a 2 meses | Devlog no YouTube ("Como se projeta um jogo de 1.121 anos?") e X | Fase 2 ao vivo sem incidente |
| **4** | Só se houver Handovers reais | Imprensa/comunidades nichadas; ver quem procurar (**[HIPÓTESE, sem dado de público]**: fãs de jogos incrementais/lentos, genealogia/arquivo familiar, cultura de skate e grafite de Niterói) | Existir ao menos 1 Handover piloto documentado |

## 4.4 A carta às contas atuais (o momento de confiança mais delicado)

A `09` recomenda **Era Zero**: todos começam do nível 1 no eixo novo, na mesma data; o nível antigo **não é apagado** (vira registro "Era −1" na Crônica) e cada conta ganha o **Selo de Pioneiro**. **Jogador vê "seu nível voltou a 1".** Se a comunicação falhar, é o momento de revolta. Por isso a carta é **pessoal** (a persona do `community-manager`: "resposta genérica é pior que nenhuma nesta escala"), enviada **antes** de qualquer post público, e **oferece exportação** do estado antigo.

**Rascunho (EN; [colchetes] dependem da migração que o dono aprovar):**

```
Subject: Your ghost is becoming the first of its Line

Hi {name},

You are one of the first people to play Danger Ghost, so you hear this first.

We are changing how levels work. The game is now paced for a very long road:
one hour a day, over generations. Levels move slowly on purpose.

What that means for you:
- [Your old level is kept forever in your Chronicle as "Era -1: reached level {L} before the Founding."]
- [You get the Pioneer Seal. It can never be earned again.]
- Your badges and your Ghostdex stay exactly as they are.
- You are a First Keeper. Nothing is owed by that. You can play as much or as little as you like.

You can download your full old save before {date}: {link}.
Questions, complaints, ideas: reply to this email. A person reads it.

- {dev name}
```

**PT-BR (para o dono):** *Assunto: Seu ghost vai ser o primeiro da sua Linha. Oi {nome}, você é uma das primeiras pessoas a jogar Danger Ghost, então ouve isto primeiro. Estamos mudando como os níveis funcionam. O jogo agora tem ritmo para uma estrada longa: uma hora por dia, ao longo de gerações. Os níveis andam devagar de propósito. O que isso significa para você: [seu nível antigo fica para sempre na sua Crônica como "Era −1: chegou ao nível {L} antes da Fundação"]; [você ganha o Selo de Pioneiro, que nunca mais poderá ser conquistado]; seus badges e sua Ghostdex ficam exatamente como estão; você é um First Keeper e isso não obriga a nada: jogue o quanto quiser. Você pode baixar o save antigo completo até {data}: {link}. Dúvidas, reclamações, ideias: responda este e-mail; uma pessoa lê. — {nome do dev}*

**Regras da carta:** enviada só depois da **decisão do dono** sobre a migração (`09`); **nunca** dizer "você não perde nada" se o nível voltar a 1 (**verdade na cara**: perde o número, guarda o registro); e depois das ~48 cartas, **responder cada resposta pessoalmente** (rascunho do `community-manager`, envio do dono).

## 4.5 A página que explica a régua ("How the ruler works")

Curta, com um **diagrama de uma linha do tempo** e três números (todos **[CÁLCULO]**):

```
HOW THE RULER WORKS

The ruler is 409,538 days long: from the Founding to the last day of 3147.
One hour a day is the measuring stick. It is not a rule.

Hitting level 100,000,000,000 in that time means about 244,000 levels an hour.
That is why the level is a counter and not the thing you feel.
What you feel is your Era: Asphalt, Alleys, Rooftops... up to the Stars.

If a Keeper misses days, the road gets longer. Miss 5% of all days and the
finish moves to about 3207. So 3147 is an ideal, not a forecast.
The game rests you for time away, and never punishes you for it.

Two Lines can arrive in the same year. Nobody wins. Every Line that arrives is Crowned.
```

**PT-BR:** *A régua tem 409.538 dias: da Fundação ao último dia de 3147. Uma hora por dia é a medida. Não é regra. Chegar ao nível 100.000.000.000 nesse tempo significa cerca de 244.000 níveis por hora. Por isso o nível é um contador e não o que você sente. O que você sente é a Era: Asphalt, Alleys, Rooftops... até as Stars. Se um Keeper perde dias, a estrada fica mais longa: perder 5% dos dias empurra a chegada para cerca de 3207. Então 3147 é um ideal, não uma previsão. O jogo "descansa" você pelo tempo fora e nunca pune. Duas Lines podem chegar no mesmo ano. Ninguém vence: toda Line que chega é Coroada.*

**Dependências:** "The game rests you" só existe se o `progression-actuary` adotar o "descanso acumulado" sugerido na `03` §5.6; senão apague essa frase. "244,000 níveis/hora" é a média do brief §8 (**409.538 h → 1e11/409.538 = 244.178 níveis/hora [CÁLCULO, refeito]**); vale só como média, não como ritmo real (a curva do `02` decide).

## 4.6 FAQ (EN + PT-BR)

| # | Pergunta (EN) | Resposta (EN) | PT-BR |
|---|---|---|---|
| 1 | Do I have to play every day? | No. One hour a day is a measuring stick, not a schedule. There are no streaks. | Não. Uma hora por dia é uma régua, não uma agenda. Não há sequência. |
| 2 | What if I miss days, weeks, years? | Your Line goes Dormant. Nothing is lost. Come back whenever you like. | Sua Linha fica Dormant. Nada se perde. Volte quando quiser. |
| 3 | Can I play more than an hour? | Yes. [Time past about an hour counts for less, so nobody can finish inside one lifetime.] | Sim. [O tempo além de cerca de uma hora conta menos, para que ninguém termine dentro de uma vida.] *(depende da D4 da `01`)* |
| 4 | Will this really last until 3147? | Nobody can promise that, and we don't. The pace is built for it. If the road ends early, it ends with notice, an export of your Chronicle and a public archive. | Ninguém pode prometer isso, e não prometemos. O ritmo foi construído para isso. Se a estrada acabar antes, acaba com aviso, exportação da sua Crônica e arquivo público. |
| 5 | Who owns my account? | You keep the Line for as long as you hold it. It can't be sold. It can be handed over, for free, in a ceremony that is written down. | Você guarda a Linha enquanto a segura. Não pode ser vendida. Pode ser passada, de graça, numa cerimônia registrada. |
| 6 | Can I buy levels or speed things up? | No. Nothing in the game is for sale that changes your level. | Não. Nada que mude seu nível está à venda. |
| 7 | What if my Heir doesn't want it? | They can Decline the Charge. Nothing is owed, nobody is told why, and the Line can rest or find another Keeper. | Podem recusar o encargo. Nada é devido, ninguém é avisado do motivo, e a Linha pode repousar ou achar outro Keeper. |
| 8 | Do I need a family? | No. A friend, or a stranger from the Commons, can hold the lantern next. | Não. Um amigo, ou um estranho do Commons, pode segurar a lanterna depois. |
| 9 | What if I die? | You can name an Heir and a Curator in advance. If you don't, the Line rests safely and can be claimed later. *(Not legal advice.)* | Você pode nomear um Heir e um Curator antes. Se não, a Linha repousa em segurança e pode ser reivindicada depois. *(Não é aconselhamento jurídico.)* |
| 10 | Is my real name in the Chronicle? | No. Your nickname is anonymous by default, and every detail is a separate choice you can take back. | Não. Seu apelido é anônimo por padrão, e cada detalhe é uma escolha separada que você pode retirar. |
| 11 | Is this crypto? Are there tokens or NFTs? | No. There is nothing to buy, no token, and no currency. *(Any future change to this answer will be announced first.)* | Não. Não há nada a comprar, nem token, nem moeda. *(Qualquer mudança futura nesta resposta será anunciada antes.)* |
| 12 | Is it a kids' game? Can a child inherit? | A child can be named, but the Line waits until they, or an adult responsible for them, accepts. Nobody contacts a child directly. *(Age rules being reviewed with a lawyer.)* | Uma criança pode ser nomeada, mas a Linha espera até ela, ou um adulto responsável, aceitar. Ninguém contata a criança diretamente. *(Regras de idade em revisão com advogado.)* |
| 13 | Can a bot play my Line? | No. The Keeper of record is always a person. AI tools may help but must be visible as AI. | Não. O Keeper de registro é sempre uma pessoa. Ferramentas de IA podem ajudar, mas aparecem marcadas como IA. |

> **Sobre a #11:** só publique "no tokens" se o dono **quiser se comprometer** com isso (ver D-L7); há uma blockchain **própria** futura no roadmap (`CLAUDE.md` §2), que o `04` §5 limita a "uma testemunha de hash", nunca o armazém. Sem token não há conflito.

## 4.7 Reações esperadas e como responder (o `community-manager` **rascunha**; o dono **envia**)

| Reação | O que está por trás | Resposta (tom) | **Não** dizer |
|---|---|---|---|
| **"1.100 anos? Golpe / vaporware"** | Ceticismo saudável; jogos morrem | Concordar com o risco; **mostrar o plano**, não a promessa: "Ninguém garante. Aqui está o que acontece se acabar" + link Saúde do Legado e Closing | "Vai durar, confie." |
| **"É cripto/NFT?"** | Medo de esquema | Resposta curta e literal da FAQ #11; lembrar que a DeSo foi **removida** (`CLAUDE.md` §1) | "Blockchain vai garantir." |
| **Memes ("see you in 3147", "meu tataraneto vai farmar")** | Humor: sinal de que entenderam | **Abraçar**: tag oficial *See you in 3147*; campanha **"Letter to 3147"** (Letters Week), que vira conteúdo da Crônica | Corrigir a piada com seriedade |
| **Hardcore "quero zerar rápido"** | Competitividade; querem corrida | Dizer a verdade sem sermão: "a régua **não** acelera; o jogo foi feito para isso". Dar **saída de profundidade**: badges de desafio (já existe `boss_basic_attack_only`, categoria `segredos`), **speedrun da campanha "the Run"** (finita, sem tocar a régua), **Stress Testers** (§3.5) | "Você entendeu errado o jogo" |
| **"Meu nível voltou a 1!"** (contas atuais) | Perda; sensação de traição | Carta pessoal (§4.4); reconhecer a perda **do número**; mostrar o Pioneer Seal e a Entry "Era −1"; oferecer o export | "Você não perdeu nada." |
| **"É chantagem emocional / trabalho infantil"** | Crítica válida ao conceito | Apontar as **travas de projeto** (recusar é grátis, sem streak, menor só via Custodiante); **agradecer**: é a crítica que mais melhora o jogo | Defensividade |
| **"E se o dev morrer / sumir?"** | O ponto único de falha real | Mostrar o plano de sucessão do operador (`04` §3) e o teste de ausência (§2.6); ser honesto sobre o que **ainda** não existe | "Não vai acontecer." |
| **"É só mais um idle game"** | Rótulo | Mostrar as 5 condições (`01` B.1.2): idle tem *prestige* (reset); aqui **nada reinicia**, e o fim é além de uma vida | Menosprezar o gênero |
| **Trolls/bots** | Provocação | Regra de moderação (§3.8); **não alimentar**; a defesa real é técnica (`05`) | Retrucar |

**Macros (rascunhos EN → PT):** *"You're right to be skeptical. Nobody can promise 1,121 years. Here's exactly what we do promise, and what happens if it ends: {link}."* → *"Você tem razão em desconfiar. Ninguém pode prometer 1.121 anos. Aqui está exatamente o que prometemos, e o que acontece se acabar: {link}."*

# PARTE 5 — Manutenção da chama

## 5.1 O que faz um Heir querer continuar

Base teórica (a `01` B.4 já verificou Camus, Erikson e Scheffler; **eu conferi hoje** a Teoria da Autodeterminação: Deci & Ryan, *Psychological Inquiry* 11(4), 2000, pp. 227–268 — três necessidades inatas, **autonomia, competência e pertencimento** **[VERIFICADO]**; aplicar isso a **1.121 anos é extrapolação nossa [HIPÓTESE]**: não existe estudo nessa escala).

| Motor | O que o jogo/comunidade oferece (já desenhado) | O que estragaria |
|---|---|---|
| **Pertencimento** | A **carta do Keeper anterior**; a Crônica; tributos e velas; Lookouts; brasão de espécie | Comparar o Heir com o antecessor; comunidade vazia |
| **Competência** | A **Era** como unidade sentida (não o contador); maestria de combate/segredos (badges de desafio) | Progresso invisível por semanas; "atrasado" |
| **Autonomia** | **Recusar/pausar/retirar a Line** sem custo; Heir pode renomear o Legacy Ghost (D3 da `01`) | Streak, cobrança, "você prometeu" |
| **Sentido** | A Estrada ("o jogo voltando para casa"); o Mapa do Céu; Roll Call | Culpa herdada; "horas investidas" como argumento (`01` F5) |
| **Cerimônia** | Handover, Investiture, Roll Call, Renovação | Cerimônia obrigatória ou longa demais |
| **Novidade** | 2 micro-eventos/ano; cameo de Cactus/Crow (se aprovado) | Evento com poder ou prazo que pune |
| **Custo baixo de voltar** | Line Dormant sem multa; "Apprentice Ghost" no primeiro dia (`03`) | Precisar refazer tudo, ou não conseguir entrar |

## 5.2 O que faz um Heir desistir (e o sinal mais cedo de cada causa)

| Causa | Como aparece | Mitigação (dono do item) |
|---|---|---|
| **Fardo herdado** ("preciso manter a Line do meu pai") | Heir aceita e some em semanas; ou nunca responde | Texto de recusa confortável (§1.6.5); nunca lembrete ao Heir depois do Decline (`03` F5); `digital-succession-counsel` |
| **E-mail morto** | Sem login por anos; e-mail devolve (*bounce*) | A **conta é o e-mail** (`03`, `05`); provedores apagam contas inativas: o Google anunciou em maio de 2023 que pode **deletar contas sem uso por 2 anos** **[VERIFICADO: blog.google, Google Account Help]**. Logo, a escada de dormência da `03` (365/455/545/730 dias) **corre mais devagar que o e-mail do Keeper pode morrer**: precisa de **Curator** e de **outro contato** na Renovação anual |
| **Comunidade vazia** | Heir entra, olha, não vê ninguém | Rituais em data fixa; Lookouts; Mapa do Céu; "Lines retomadas" |
| **Tédio do grind** (1 h/dia, mesmo ghost) | Sessões mais curtas; queda de frequência | É do `game-designer`/`progression-actuary`; aqui: Eras e cerimônias cortam a monotonia |
| **Deriva de plataforma** | O jogo não abre mais no aparelho do Heir | `04` §4 (Android muda regras de instalação fora de loja; **conforme o `04`, a partir de 30/09/2026 no Brasil — não conferi por conta própria**) |
| **Perda de identidade** ("não é meu ghost") | Heir cria outro ghost e larga o Legacy Ghost | Apprentice Ghost, renomear, escrever a **própria Entry** livremente |
| **Conflito/toxicidade** | Silêncio depois de discussão | Charter (§3.8); Lookouts |
| **Luto** | Heir recebe a Line logo após uma perda | **Nunca** automatizar nada aqui (`03` F2: o operador marca manualmente) |

## 5.3 Sinais de conta em risco de abandono (e o que **não** fazer com eles)

**Regra de ouro:** sinal serve para **oferecer ajuda**, nunca para **cobrar** ninguém. E usa o **mínimo** de dado (LGPD: `digital-succession-counsel` valida; **não coletamos idade**).

| Sinal | De onde vem | Ação (ética) |
|---|---|---|
| Dias sem login (30/90/180) | Já existe na escada da `03` §1.9 | Nada até 180; aos 180 só o texto de "still lit" **se o Keeper aceitou convites** (§5.4) |
| Queda de frequência nos últimos 90 dias | `playtime_daily` (`09`) | **Só agregado**, para o relatório de saúde; nenhuma mensagem individual |
| **Sem Heir e sem Sealed Letter** após 1 ano | Crônica/Line | Uma **sugestão anual** na Renovação (a `03` §4.4 já limita a 1×/ano), sempre dispensável |
| Heir convidado que **não responde** em 30 dias | Fluxo do Handover | **Um** lembrete ao **Keeper**, nunca ao Heir; depois, silêncio (`03` F5) |
| Vigil parada | Estado da Line | Aviso ao Keeper; nunca pressão |
| **Bounce** (e-mail devolvido) | Servidor de e-mail (não existe hoje: a `03` diz que **o jogo nem envia e-mail**) | Encurtar a escada e avisar o **Curator** (`03` T13) |
| Line "solitária": zero visitas/tributos em 2 anos | Mapa do Céu/tributos | Só entra num **relatório de saúde**; Lookouts *podem* deixar um tributo (sem número, sem cobrança) |

**Painel mensal de saúde (5 números, à mão no ano 1):** Lines ativas em 30/90 dias · Lines Dormant · % de Keepers com Heir **ou** Sealed Letter · funil de Handover (convidados/aceitos/**recusados**/parados; "recusado" é **normal**, não fracasso) · casos de moderação abertos. **Antimétricas (não medir):** usuários ativos diários, sequência, tempo de sessão, "retenção D1/D7". São métricas de cobrança.

## 5.4 Convites e lembretes éticos

**Duas coisas diferentes que não se misturam:**

| | **A. Avisos de custódia** | **B. Convites** |
|---|---|---|
| O que é | Aviso **factual** sobre o estado da conta (escada da `03`: 365/455/545/730 dias) | Mensagem opcional de retorno ("veja o que há de novo") |
| Precisa de consentimento? | **[HIPÓTESE]** Provavelmente cabe como aviso necessário do serviço; **`digital-succession-counsel` decide** (LGPD: legítimo interesse × consentimento) | **Sim, opt-in, padrão desligado** |
| Tom | Neutro: "Sua Line está Dormant. Nada se perdeu. Como voltar / como passar / como fechar." | Informativo: novidades, nunca perdas |
| Limite | Só a escada; termina quando ela termina | **1 por 90 dias; para de vez após 2 sem resposta** |

**Dez regras que todo aviso/convite tem que passar (checklist anti-*dark pattern*; `game-economy-designer` e `digital-succession-counsel` revisam antes de qualquer envio):**
1. **Opt-in por padrão desligado** (convites). 2. **Cancelar com 1 clique**, definitivo ("never remind me"). 3. **Nada de culpa nem personificação** ("your ghost misses you", "your lantern is waiting"). 4. **Nada de perda** ("you'll lose", "your Line will end"). 5. **Nada de urgência falsa** (prazos que não existem). 6. **Nunca mencionar horas investidas** (sunk cost, `01` F5). 7. **Frequência com teto** e parada automática. 8. **Nunca ao Heir sem consentimento do Keeper** e **nunca depois de um Decline**. 9. **Nunca em luto** (`03` F2). 10. **Nada de notificação push de engajamento** *(não verifiquei se o app tem push hoje; recomendo não criar)*.

**Modelos (EN, com PT-BR):**

| Situação | EN | PT-BR |
|---|---|---|
| **Convite (opt-in) — Line Dormant** | *"Your Line has been quiet for a while. That's fine. Here's what's new since you were here: {2 lines}. No need to reply."* | *"Sua Linha está quieta há um tempo. Tudo bem. Aqui está o que mudou desde que você esteve: {2 linhas}. Não precisa responder."* |
| **Aviso de custódia (365 dias)** | *"Your Line is Dormant. Nothing is lost. If you want to hand it on, close it, or keep it as is, here's how: {link}. If you do nothing, we'll keep it safe."* | *"Sua Linha está Dormant. Nada se perdeu. Se quiser passá-la, encerrá-la ou mantê-la assim, veja como: {link}. Se não fizer nada, vamos guardá-la com segurança."* |
| **Nota de aniversário da Line (Renovação)** | *"Your Line turns {N} today. Two minutes: is your email still yours? Is your Heir still your Heir?"* | *"Sua Linha faz {N} anos hoje. Dois minutos: seu e-mail ainda é seu? Seu Heir ainda é o mesmo?"* |

**Convite como presente, não dívida:** o Keeper pode gerar um **link de leitura** da Crônica pública (sem conta) para mostrar a um parente ou amigo, **sem** nomear ninguém e **sem** obrigação. É a forma mais barata e menos invasiva de "chamar alguém".

## 5.5 O sunset digno: **"the Closing"**

Objetivo: se a comunidade ou o jogo acabar antes do fim, **acabar bem**: com aviso, com o registro salvo, com cerimônia, sem monetização de última hora e sem apagar nada. É o "protocolo escrito **agora**, publicado desde o dia 1" que a `01` D6 pede (e que ela chama de "Last Rites"; ver Alerta nº 2).

### 5.5.1 Duas escadas, não uma

**Escada da comunidade (o que eu desenho):** pode acabar **antes** do servidor.

| Estado | Gatilho **[HIPÓTESE]** | O que muda |
|---|---|---|
| **C0 — Ativa** | Normal | — |
| **C1 — Quieta** | < 2 Lookouts por 6 meses, **ou** < 5 Lines ativas em 90 dias | Rituais entram no **modo mínimo automático**; Telegram vira "somente aviso"; nenhum papel obrigatório |
| **C2 — Recolhida** | Nenhuma Line ativa por 12 meses | **Commons aberto** (qualquer Successor pode pegar uma Line, sem espera extra); rituais só como páginas estáticas |
| **C3 — Arquivo** | Fim do jogo ao vivo (a escada abaixo) | Segue o `04` |

**Escada do jogo (é do `04`, eu só acrescento a cerimônia):** **N1** vivo → **N1-R** reduzido → **N2** somente leitura → **N3** arquivo estático → **N4** registro em texto puro. Avisos mínimos do `04` §2.2: N1→N1-R **30 dias** (se planejado); →N2 **≥ 180 dias**; →N3 **≥ 365 dias**. Invariantes: **descer nunca apaga**, **nada silencioso** (heartbeat externo), **aviso primeiro em canal nosso** (jogo, site, repositório, Crônica, e-mail) e só depois em rede social, e **o domínio nunca é abandonado**.

### 5.5.2 A cerimônia (o que acrescento)

1. **Dia do aviso:** banner no jogo, página no site, e-mail à última caixa conhecida, Entry na Crônica, **depois** X/Telegram/YouTube. **O contador "Day {D} of 409,538" congela** com texto próprio.
2. **Exportação individual liberada desde o primeiro dia do aviso** (`04` §2.2): cada Keeper baixa **a sua** Entry, as **suas** cartas e o **Livro da Line** (formato do `04` §2.3; **sem e-mail e sem hash de senha** dentro do arquivo).
3. **A última Chamada (Last Roll Call):** uma leitura final de todos os nomes autorizados, com as Lines **Dormant** incluídas ("*every lantern that was ever lit*"). É o "funeral" do jogo sem usar palavra de luto religioso.
4. **A Última Entrada** (Final Entry, texto abaixo).
5. **Convite a um sucessor:** anunciar que **quem quiser continuar** pode receber o arquivo, as regras e o "Como reconstruir o jogo" (`04` §3.4). **Precedentes reais [VERIFICADO hoje]:** quando o MMO *Glitch* fechou (dez/2012) a Tiny Speck liberou **mais de 10.000** artes, animações e código sob **CC0** cerca de um ano depois; o *City of Heroes* fechou em nov/2012 (a NCSoft), reapareceu como servidor de fãs (Homecoming) e, em jan/2024, ganhou **licença oficial** para continuar. **Lição (interpretação):** se o registro e as regras estão abertos, alguém pode continuar; **mas a decisão de licença (código aberto ou fechado) é do dono**, com o `digital-succession-counsel` (o `04` §3.5 já discute).
6. **Nada de última hora:** proibido monetizar o encerramento, proibido apagar dados antes do aviso, proibido "evento de despedida" com recompensa que gere pressão.
7. **Menores:** avisos ao Custodiante (`03` F1).
8. **Custo do piso:** o `04` recomenda financiar **primeiro o piso (N3/N4)**; o compromisso público é **"o arquivo fica de pé enquanto isso for razoavelmente possível"**, **nunca** "para sempre".

### 5.5.3 Textos (EN, com PT-BR)

**Aviso de encerramento (Closing notice):**
```
THE ROAD IS ENDING EARLY

We will not reach 3147 together. On {date}, Danger Ghost will {stop / go read-only}.
Here is what will happen, and what won't:

- Your Chronicle and your letters are yours. Download them now: {link}.
- The record of every Line stays public, in an archive, in open formats.
- Nothing will be deleted. Nothing will be sold.
- If someone wants to carry the game further, we will give them everything they need.

Thank you for every hour. They were not stolen. They were given.
```
**PT-BR:** *A ESTRADA VAI ACABAR ANTES. Não chegaremos juntos a 3147. Em {data}, Danger Ghost vai {parar / ficar somente leitura}. Isto vai acontecer, e isto não: sua Crônica e suas cartas são suas, baixe-as agora: {link}; o registro de cada Line fica público, num arquivo, em formatos abertos; nada será apagado, nada será vendido; se alguém quiser levar o jogo adiante, daremos tudo que precisar. Obrigado por cada hora. Elas não foram roubadas. Foram dadas.*

**A Última Entrada (Final Entry da Crônica):**
```
FINAL ENTRY

This Chronicle recorded {N} Keepers, {L} Lines, and {H} hours.
It did not reach the year it was written. It got as far as {date}.
Every name is here. Every hour was given.
The lantern is not out. It is set down, where someone can find it.
```
**PT-BR:** *ENTRADA FINAL. Esta Crônica registrou {N} Keepers, {L} Lines e {H} horas. Não chegou ao ano em que foi escrita. Chegou até {data}. Todos os nomes estão aqui. Todas as horas foram dadas. A lanterna não se apagou. Foi deixada no chão, onde alguém possa encontrá-la.*

# PARTE 6 — Riscos de comunidade/operação e o MVP do primeiro ano

## 6.1 Riscos (comunidade e operação)

Probabilidade (P) e impacto (I): A = alta, M = média, B = baixa. **[HIPÓTESE]** em todas as notas (não há histórico de operação).

| # | Risco | P | I | Mitigação | Dono |
|---|---|---|---|---|---|
| R1 | **Esgotamento do dev solo** (o risco nº 1 da persona `live-ops`) | A | A | Calendário mínimo (3 rituais); modo mínimo automático; corte dos micro-eventos primeiro; Livro dos Rituais; teste de ausência de 90 dias | dono, `producer` |
| R2 | **Nenhum Handover real por décadas**: as mecânicas da `03` ficam **sem teste em campo** | A | A | **Pilot Handovers** no ano 1 entre voluntários (irmãos, amigos), marcados "Pilot"; simulação da `03`; nenhum ritual de *Handover* vende-se como "testado" antes disso | `legacy-systems-designer`, `qa-lead` |
| R3 | **Chat/mural sem moderação** (chat = MQTT público; Egregora sem denúncia/remoção; **[VERIFICADO]**) | A | A | Rotular; não hospedar rituais; canal autenticado com silenciar/denunciar antes de eventos da Crônica | `backend-architect`, `network-programmer`, `security-engineer` |
| R4 | **Conteúdo ofensivo permanente na Crônica** (texto de jogador que não some) | M | A | Crônica **privada até existirem Scribes**; depois **pré-moderada**; Entry com campo por campo de consentimento (`03` §3.4); nota de contexto, não edição; remoção só legal (`03` §3.5) | Scribes, `digital-succession-counsel` |
| R5 | **Backlash das ~48 contas** ("meu nível voltou a 1") | A | M | Carta pessoal antes do público (§4.4), Pioneer Seal, exportação do estado antigo, resposta individual | dono, `community-manager` |
| R6 | **Anunciar antes da integridade** (um pacote adulterado zera a régua: `05`) | M | A | **Fase 2 só com tempo autoritativo no ar** (§4.3) | `security-engineer`, dono |
| R7 | **Dependência de plataformas** (X, Telegram, YouTube; domínio) | M | M | Casa da Crônica em `ghostgames.club`; redes replicam; exportar Telegram; **renovar o domínio com vários anos e um suplente** (`04`) | dono, `deep-time-archivist` |
| R8 | **Fadiga de ritual / vira obrigação disfarçada** | M | M | Sem streak/diário; rituais anuais; recompensa = memória; checklist anti-dark-pattern (§5.4); antimétricas | `game-economy-designer` |
| R9 | **FOMO se infiltra** (evento com prazo e recompensa vendável) | M | M | Regras 1–2 dos princípios (§2.2); revisão de cada evento | `game-economy-designer` |
| R10 | **Voluntário abusa/quebra/some** (captura, vazamento, conflito) | M | M | 2 por papel; rodízio de 2 anos; impedimento por conflito; sem acesso a Sealed Letter; adulto apenas; saída sem vergonha | Operator |
| R11 | **Menores expostos** (Heir criança; chat público; Lookout curioso) | M | A | Sem DM; contato só via Custodiante; chat público inacessível a conta de menor (decisão jurídica); apelido anônimo padrão (`03`) | `digital-succession-counsel` |
| R12 | **Deriva de canon:** a comunidade escreve "lore" que contradiz o do dono | M | M | Rótulo "*Written by Keepers. Not official lore.*" (§1.4); pedido de lore ao dono para E1/E3/E5 | `narrative-designer`, dono |
| R13 | **Promessa lida como garantia** ("1.121 anos") → sensação de fraude | M | A | Vocabulário controlado (§4.1); Saúde do Legado; contador honesto; revisão jurídica da redação | `marketing`, `digital-succession-counsel` |
| R14 | **Comunidade morre antes do jogo** | A | M | Escada C0–C3 (§5.5.1); Commons; rituais automáticos | dono |
| R15 | **Chave única de contato** (uma caixa de e-mail, uma pessoa) | M | A | Suplente (`04`); segundo revisor de apelação; e-mail do Legado separado do pessoal do dono | dono |
| R16 | **Rivalidade entre Lines / assédio de Keeper "que vendeu"** | B | M | Placares sem ordinal; Charter (§3.8); denúncia formal no lugar de linchamento | Lookouts |

## 6.2 O MVP do primeiro ano (o mínimo que faz o conceito existir)

**Princípio:** MVP = *o menor conjunto de rituais, textos e papéis que faz o Legado ser real e honesto*, **sem** depender de código de cliente novo além do que a `09` já planejou.

**O que entra (10 itens):**

| # | Item | Depende de | Horas (dono) |
|---|---|---|---:|
| 1 | **Charter of the Blind Spot** (1 página) + política de sanções | revisão jurídica | 3 |
| 2 | Página **"The Long Road"** + **"How the ruler works"** + **FAQ** + contador "Day N" (§1.6.1, §4.5, §4.6) | `02` (números), `05` (integridade) | 5 |
| 3 | **Carta pessoal às ~48 contas** + registro dos **Founders** (First Keepers) e Pioneer Seal (§4.4) | migração `09` decidida | 10 (+ tempo de resposta) |
| 4 | **Compromisso público de encerramento digno** ("the Closing", curto) + página **Saúde do Legado** | `04` | 2 |
| 5 | **Legacy Day** (1 vez, no 1º aniversário do Day One) | — | 8 |
| 6 | **Roll Call** (1 vez, 21 de junho) com **página estática**; nomes só dos autorizados | Crônica v0 (`03`) | 4 |
| 7 | **2 Lookouts** (Telegram) + manual de 2 páginas | — | 6 |
| 8 | **2–3 Pilot Handovers** entre voluntários (amigos/irmãos) | `03` P0 implementados | 4 |
| 9 | **2 micro-eventos** (ex.: *Letters Week*/"Letter to 3147" no 1º semestre; *Secrets Week* no 2º) | badges | 16 |
| 10 | **Relatório mensal de saúde** (5 números) + 4 Quarter Notes | SQL | 12 |

Total dos itens ≈ **70 h**, mais ~13 h de moderação corrente = **≈ 83 h no ano** (o mesmo total do §2.5).

**O que fica FORA do MVP (de propósito):** Mapa do Céu (ano 2), Tributos e velas (ano 2, com moderação pronta), Scribes/Curators do Livro (ano 2 ou quando houver ≥ 100 Lines ativas), temporadas (ano 3), Stress Testers (depois da `05`), Marcos de Século, Hall como POI novo (usa uma **página do site** primeiro; o POI exige handler em `overworld.js` e APK).

**Cronograma sugerido (depende das entregas técnicas; se elas atrasarem, os itens 3–6 atrasam junto):**

| Mês | Marco |
|---|---|
| M0 | Aprovação do dono + decisões (e) |
| M1–M2 | Charter, textos, Carta às contas atuais **depois** da migração; Founders |
| M3 | Fase 2 pública (Long Road + FAQ + Closing pledge) **só com `05` no ar** |
| M4–M5 | Lookouts + Pilot Handovers; micro-evento 1 (*Letters Week*) |
| M6 | Quarter Note 2 + revisão do que cansou |
| M9 | Micro-evento 2 |
| M12 | **Legacy Day 1**; primeiro **Roll Call** no 21/06 mais próximo; revisão anual do plano |

**Critérios de sucesso do ano 1 (nenhum é "usuário ativo diário"):** (1) **≥ 2 Handovers piloto concluídos** sem incidente; (2) **≥ 60% das contas atuais** responderam à carta ou abriram a página (nenhum número é meta rígida: [HIPÓTESE]); (3) **zero** rituais atrasados sem aviso; (4) **zero** reclamações de "culpa/cobrança" sem resposta; (5) **2 voluntários** ativos e um **teste de ausência de 30 dias** superado (o de 90 dias fica para o ano 3).

---

## (c) Lacunas que eu fechei (brief §6)

1. **Item 6 (motivação e conteúdo por ~409.000 horas), a parte de operação:** calendário de rituais e eventos com carga real; regra "eventos dão memória, não poder"; temporadas sem FOMO; modo mínimo automático; Livro dos Rituais; teste de ausência.
2. **Item 1 (vocabulário/definição), a parte narrativa:** moldura in-universe **construída só com canon** (Camada 1), com extensões isoladas e codificadas (E1–E5); quem é o Keeper no lore; o que significa "zerar"; **textos-chave em inglês** com PT-BR (Long Road, Carta, epitáfio, Keystone, avisos, Closing).
3. **Item 10 (interação com sistemas existentes), a parte de comunidade:** ranking por Line/geração sem incentivar trapaça nem compra de conta (placares, o que **não** mostrar); coortes e brasões; tributos.
4. **Item 8 (ética), a parte de conduta:** política de moderação por décadas (Charter, escada de sanções, sanção que expira, cláusula do luto, nota de contexto).
5. **Item 12 (roadmap), a parte de comunicação e MVP:** ordem de revelação; carta às 48 contas; FAQ; reações e respostas; MVP do ano 1 com horas e critérios de sucesso.
6. **Achados de campo (não estavam em nenhum outro relatório):** o **chat global é um broker MQTT público sem moderação possível**; a **Egregora** tem 4 lacunas para virar mural de Lines; a **Torre e o Cemitério estão na Rua Beltrão** (= o ponto cego do lore); a **frase "Guardian" no texto do `04` colide com o lore**; o lore já contém **"a dívida do céu"**, **"o jogo foi feito em 3147"** e **"blocos de tempo piratas"**.
7. **Item 7, parte de honestidade:** protocolo de encerramento com **duas escadas** (comunidade C0–C3 e jogo N1–N4) e cerimônia; precedentes reais verificados (Glitch, City of Heroes).

## (d) Lacunas que dependem de outros departamentos

| Lacuna | Por que não é minha | Quem resolve |
|---|---|---|
| **Teto/rendimento diário** e a redação exata de "about an hour a day" nos textos | Calibração | `progression-actuary` (`02`) |
| **Número e limiares de Eras** (eu só dou a gramática de nomes) | Progressão | `progression-actuary` + `game-designer` |
| **Migração** (Era Zero; o que a carta às 48 contas promete) | Decide o dono com base na `09` | dono + `backend-architect`/`tools-programmer` |
| **Integridade do tempo** antes do anúncio público | Segurança | `security-engineer` (`05`) |
| **Chat autenticado e moderável**; Egregora com denúncia/`keeper_index`/sem cascade | Backend/rede | `backend-architect`, `network-programmer`, `security-engineer` |
| **Handover, Vestibule, Apprentice Ghost, Crônica em camadas, Selos** | Mecânica | `legacy-systems-designer` (`03`) |
| **LGPD, menores, Termos, "conta não se vende", redação de FAQ/cartas/cláusulas, porto seguro para Stress Testers, e-mails de custódia** | Direito (nada aqui é aconselhamento jurídico) | `digital-succession-counsel` + advogado |
| **Domínio, entidade, "Como reconstruir", níveis N1–N4, texto "What we can and cannot promise"** | Durabilidade | `deep-time-archivist` (`04`) |
| **Revisão de mecânicas diárias e do checklist anti-dark-pattern** | Economia/ética | `game-economy-designer` |
| **Arte do Hall/Mapa do Céu/Eras** (cor por Era, brasões, estrelas) | Direção visual | `concept-artist`, `ui-ux-designer`, `2d-artist` |
| **Revisão do inglês por nativo** (vocabulário e todos os textos) | Localização | `localization` |
| **Execução dos posts** nos canais | Só o dono envia | `marketing`/`community-manager` rascunham |
| **Escopo final e ordem** | Direção | `game-director`, `producer` |

## (e) DECISÕES PARA O DONO

Nenhuma fica "a definir". Ao aprovar, responda só com o código e a letra (ex.: "D-N1: b").

**D-N1 — Moldura narrativa: quanto lore novo?**
(a) **Só canon** (Camada 1: "o jogo está voltando para casa"; zero fatos novos). (b) **Camada 1 + E2 ("a dívida do céu") + E4 ("uma estrela por Line")**. (c) Tudo, inclusive E1 (âncora), E3 (Fenda aberta) e E5 (cameo do Gato).
Prós/contras: (a) é 100% seguro com o que você já escreveu, mas o final fica mais seco. (b) dá o final emocional e o Mapa do Céu; cria 2 fatos novos coerentes com falas suas (L8, L9). (c) mexe na física do mundo; **E3 soa a cobrança** ("a Fenda fecha se você não jogar").
➜ **Recomendo (b)**, sujeito ao seu "sim" em E2 e E4; se não vier resposta, **publique (a)**. **Desaconselho E3.** E1/E5 ficam como pedidos de lore para um eventual Vol. III escrito por você.

**D-N2 — Vocabulário de crew para os papéis (Lookout, Scribe, "the Blind Spot")?**
(a) Sim. (b) Neutro (Greeter, Editor, "the Community"). (c) Você propõe outros.
➜ **Recomendo (a)**: combina com RX/crew e com o Ponto Cego do canon; troque se soar estranho para você. Evitei "toy" e "Warden".

**D-N3 — A linha "A mass of blockchain data that escaped the DeSo network" (Ghostdex #001, visível ao jogador)**
(a) Manter. (b) Trocar por "a dead network". (c) Remover a referência.
➜ **Recomendo (b)**: mantém a imagem de "dados que escaparam" (é lore seu) e tira o nome DeSo de um jogo que vai atrair gente perguntando "é cripto?". **É mudança de texto do jogo: só se você quiser, e depois deste plano.**

**D-N4 — Cactus, Crow e Level 26 no Legado**
(a) Nenhum no MVP. (b) Cameo de Cactus (bit-rot) e Crow (privacidade) depois que você confirmar que são canon. (c) Também usar o Level 26 como palco do Handover.
➜ **Recomendo (a) agora e (b) depois**. **(c) não:** o `SALVAGED_LORE` §5 diz que a ligação Level 26 ↔ exposição "Lugar Nenhum" cruza outro projeto e precisa da sua confirmação.

**D-N5 — Idioma do que os Keepers escrevem**
(a) Livre (qualquer idioma). (b) Só inglês.
➜ **Recomendo (a)**: o jogo é em inglês, mas a carta de um avô brasileiro **tem que ser em português**. A UI fica em inglês.

**D-L1 — Datas dos rituais**
(a) **Legacy Day = aniversário do Day One; Roll Call = 21 de junho** (noite mais longa no hemisfério sul, fixa no calendário). (b) Ambos no mesmo dia. (c) Você escolhe datas com significado pessoal (o lore só dá anos: 2012, 2020, 2026).
➜ **Recomendo (a)**: duas datas, duas emoções (comemoração e memória); data fixa evita astronomia no código. Confirmar contra a `03` (que chama o Roll Call de "Dia dos Guardiões" e deixa a data para mim).

**D-L2 — Política de recompensa de eventos**
(a) **Só memória** (badge, moldura, cor de estrela; nunca XP/nível/item). (b) Permitir pequeno bônus de XP. (c) Itens cosméticos vendáveis.
➜ **Recomendo (a)**: protege a régua (`05`) e não cria preço de conta. (b) fere a régua; (c) abre RMT.

**D-L3 — Temporadas**
(a) **Nenhuma até o ano 3**; depois "Long Seasons" 2/ano, sem exclusividade. (b) Trimestrais desde o ano 1. (c) Nunca.
➜ **Recomendo (a)**: com ~48 contas e um dev, temporada trimestral é teatro.

**D-L4 — Voluntários e papéis**
(a) **2 Lookouts no ano 1, Scribes no ano 2**, adultos, não remunerados, rodízio de 2 anos. (b) Só o dev até o ano 2. (c) Moderadores pagos.
➜ **Recomendo (a)**: (b) concentra tudo no ponto único de falha; (c) não há orçamento e cria conflito de interesse.

**D-L5 — Placares públicos**
(a) **Só Era/continuidade/coortes/brasões; sem nível nem horas exatas por 3–5 anos.** (b) Ranking de nível exato. (c) Nenhum placar.
➜ **Recomendo (a)**: dá pertencimento sem alvo de trapaça; (b) só depois de a integridade do `05` estar provada; (c) mata o senso de comunidade e o Hall.

**D-L6 — Chat global (MQTT público)**
(a) **Rotular "public, unmoderated", não hospedar rituais nele, e mover para canal autenticado antes dos eventos da Crônica.** (b) Deixar como está. (c) Desligar durante o Legado.
➜ **Recomendo (a)**. (b) deixa a única superfície social **sem** botão de banir. (c) tira o único lugar em tempo real.

**D-L7 — Compromissos públicos**
(a) **"Sem tokens/NFT" + "conta não se vende" + "Closing" com aviso (≥ 180 dias antes de somente leitura, ≥ 365 antes de arquivo estático, alinhado ao `04`)**. (b) Só o "Closing". (c) Nenhum compromisso.
➜ **Recomendo (a)**. São promessas **de processo**, não de futuro, e são o que torna o resto crível. **Cuidado:** só prometa "sem tokens" se você quiser se comprometer com isso; a blockchain própria do roadmap, se vier, é só "testemunha de hash" (`04` §5).

**D-L8 — Estratégia de anúncio**
(a) **Faseada e honesta** (§4.3: carta às 48 → páginas → devlog → imprensa). (b) Lançamento grande de uma vez. (c) Só boca a boca.
➜ **Recomendo (a)**. (b) tem o risco R6 (anunciar régua que se quebra com um pacote). (c) desperdiça o conceito.

**D-L9 — "Stress Testers" (quem acha falha e reporta de boa-fé ganha crédito na Crônica)**
(a) **Sim, depois da `05` no ar.** (b) Não. (c) Programa pago.
➜ **Recomendo (a)**: converte o "hardcore que quer quebrar" em testador; exige regra jurídica de divulgação responsável.

**D-L10 — Fundadores**
(a) **Pioneer Seal + entrada "First Keepers"; corte = data da Fase 1** (carta às contas atuais). (b) Selo para quem entrar até o lançamento público. (c) Nada.
➜ **Recomendo (a)**: registro histórico fechado no dia certo, não escassez de marketing.

**D-L11 — Texto da Crônica no ano 1**
(a) **Privado (só Heir) até existirem Scribes; depois público pré-moderado.** (b) Público desde o dia 1, moderação por denúncia. (c) Sempre privado.
➜ **Recomendo (a)**: a Crônica é permanente; abrir sem moderação é o risco R4.

**D-L12 — Contador "Day N of 409,538" e página "Saúde do Legado"**
(a) **As duas.** (b) Só a página. (c) Nenhuma.
➜ **Recomendo (a)**: o contador é o meme honesto; a página é a prova. O contador **congela** no Closing.

**D-L13 — Voz pública do jogo nos canais**
(a) **Voz do dev, simples** (fora do jogo); a voz do lore só dentro do jogo e nos rituais. (b) Voz do lore (Ftasma/Beco Pro) sempre. (c) Mista.
➜ **Recomendo (a)**: nas redes, a pessoa; no jogo, o mundo. Misturar faz o "1.121 anos" parecer promessa do personagem.

**D-L14 — Correções de vocabulário entre relatórios**
(a) **`04` troca "Guardian" por "Keeper" no texto público; o protocolo de fim se chama "the Closing" (não "Last Rites").** (b) Manter como estão.
➜ **Recomendo (a)**: "Guardian" já é o Gato e a RX no seu lore; "Last Rites" é sacramento cristão.

## (f) Riscos e o que eu NÃO consegui verificar

**Não verificado (não cite como se fosse):**
1. **Tamanho e atividade reais dos canais** (seguidores do X, membros do Telegram, visualizações do YouTube): não acessei redes. Tudo aqui vale para "dezenas de jogadores".
2. **Se o chat MQTT é hoje moderado por algum processo externo** que eu não veja no repositório; li só o código do cliente (`ui_manager.js`). O que afirmo é o que o código permite: nenhum banimento server-side.
3. **Se há push notification no app** (não procurei); minha regra "não criar push de engajamento" vale de qualquer modo.
4. **A data 30/09/2026 (Android)**: vem do `04`; não a conferi.
5. **Regras legais** (publicidade enganosa, LGPD, ECA Digital, comunicação de custódia por e-mail): só apontei o ponto; **não sou advogado** e não consultei as normas hoje.
6. **Horas estimadas** (§2.5): **[HIPÓTESE]**, sem histórico do dono. Ajuste no primeiro trimestre.
7. **"Lookout" e a cultura de crew de rua**: é uma escolha de vocabulário inspirada em prática de grafite; **não pesquisei** o termo em fonte; por isso a D-N2 é sua.
8. **A ideia "o jogo foi enviado do futuro" como leitura de L2 e L4**: é **interpretação** do canon (o texto diz "designed by Beco Pro in the future" e "blocos de tempo piratas"), não uma citação; você é quem sabe se combina com o que planeja para o Vol. III.
9. **Vocabulário inglês**: recomendo revisão por falante nativo (a `01` também pede).
10. **O relatório `02`** (calibração e Eras) não estava pronto quando fechei. Textos que dependem dele têm a dependência escrita ao lado.

**Riscos que o conceito impõe à comunidade (honestos):** um jogo que pede a estranhos e a crianças que herdem um dever é o de **maior risco de dark pattern** (`01` (f), 2); a única defesa é **execução**: recusa fácil, zero cobrança, aviso factual, moderação com regra escrita. Além disso, **o primeiro Handover de verdade pode demorar décadas**; até lá, **tudo isto é uma hipótese não testada**, por isso os Pilot Handovers do MVP.

---

## Anexo A — Fontes verificadas hoje (2026-09-20)

**Web (busca feita hoje):**
- Glitch: fechou em 9/dez/2012; cerca de um ano depois a Tiny Speck liberou mais de 10.000 artes, animações e código sob CC0 — [PCWorld](https://www.pcworld.com/article/448688/afterlife-of-an-mmo-glitchs-offbeat-art-enters-public-domain.html), [Game Developer](https://www.gamedeveloper.com/art/-i-glitch-i-lives-on-as-mmo-s-assets-enter-the-public-domain), [OpenGameArt](https://opengameart.org/content/huge-cc0-asset-release-from-glitch).
- City of Heroes: fechou em 30/nov/2012; servidor de fãs (Homecoming) desde 2019; licença oficial da NCSoft anunciada em 4/jan/2024 — [Wikipedia](https://en.wikipedia.org/wiki/City_of_Heroes), [Neowin](https://www.neowin.net/news/city-of-heroes-is-officially-back-thanks-to-a-license-from-ncsoft-to-a-fan-run-mmo-server/).
- LambdaMOO 1993 (governança): [Wikipedia, "A Rape in Cyberspace"](https://en.wikipedia.org/wiki/A_Rape_in_Cyberspace) e o artigo de Dibbell (cópia do MIT: https://smg.media.mit.edu/library/dibbell1993.html). **Só usei o que ambas dizem** sobre a decisão de Haakon, a reunião de ~2h45, a exclusão da conta por um programador e o sistema de arbitragem posterior.
- Política de contas inativas do Google (maio/2023, "pode deletar contas sem uso por pelo menos 2 anos"; primeiras exclusões em dez/2023): [Google Blog](https://blog.google/innovation-and-ai/technology/safety-security/updating-our-inactive-account-policies/), [Google Account Help](https://support.google.com/accounts/answer/12418290?hl=en).
- Teoria da Autodeterminação: Deci, E. L. & Ryan, R. M. (2000), *The "What" and "Why" of Goal Pursuits*, Psychological Inquiry 11(4), 227–268 — [Taylor & Francis](https://www.tandfonline.com/doi/abs/10.1207/S15327965PLI1104_01).

**Arquivos do projeto lidos (fatos [VERIFICADO] neste relatório):** `js/lore_data.js` (Vol. I e II EN); `lore_books.md`; `docs/SALVAGED_LORE_2026-09-16.md`; `js/ui/ui_manager.js` (l. 1056–1115, chat MQTT; Egregora); `server/index.js` (l. 347, 365, 1003–1051, rate limit e handlers da Egregora); `server/db.js` (tabelas `egregora_messages`, `diary_entries`; limites 300/5000 caracteres); `data/overworld/pois.json`; `js/game/overworld.js`; `js/web2/badges.js`; `server/seed_badges.js`; `index.html` (links dos canais); `js/game/ghostdex_data.js` (#001). **Cálculo refeito em Node:** 2026-09-20 → 3147-12-31 = **409.538 dias**; 1e11 / 409.538 = **244.178 níveis/hora**.

**Relatórios dos colegas usados:** `raw/01_filosofia.md`, `raw/03_sucessao_cronica.md`, `raw/04_durabilidade.md`, `raw/05_integridade_antiabuso.md`, `raw/09_arquitetura_migracao.md`.
