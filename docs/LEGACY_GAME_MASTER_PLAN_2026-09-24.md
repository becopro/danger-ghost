# Plano Mestre do Jogo Legado — Danger Ghost (v2)

> ### ⚠️ Este é o plano do JOGO
> A **blockchain própria é um documento separado** (`BLOCKCHAIN_MASTER_PLAN_2026-09-24.md`), **congelado até o Episódio 2 terminar**.
> Aqui não se decide nada de blockchain. Onde os dois se tocam, este documento diz em uma linha e aponta para o outro — nunca desenvolve o mecanismo.
> **Este plano é autocontido:** você pode aprová-lo, recusá-lo ou construí-lo inteiro sem abrir o outro documento, e nada aqui depende de a blockchain existir algum dia.

**Para:** o dono do jogo (decisão de aprovar ou não)
**De:** `game-director` (Diretor Criativo)
**Data:** 2026-09-24 · **Substitui:** `LEGACY_GAME_MASTER_PLAN_2026-09-20.md` (v1), que continua válido como histórico
**Modo:** PLANO — nenhuma linha do jogo foi alterada, nenhuma migração rodou, **nenhuma consulta ao banco de produção foi feita**, nenhuma credencial foi lida.

**Base deste v2:** o plano v1 inteiro (que você já leu), mais quatro documentos que o corrigem:

| Fonte | O que ela muda no v1 |
|---|---|
| `docs/legacy-plan/raw/12_xp_inimigos_e_calibracao_por_xp.md` | **O nível passa a vir sempre do XP** (seu pedido). Revisa a decisão **A4**. Reescreve a Seção 2 inteira |
| `docs/legacy-plan/chain/24_selo_og.md` | **O selo OG** — elegibilidade, corte, snapshot, UI, postura honorífica. Nova Seção 10. **A data de corte que ele propôs foi substituída** pela sua decisão de 24/09/2026 (ver a nota abaixo); todo o resto do relatório continua valendo |
| `docs/legacy-plan/chain/25_auditoria_adversarial_chain.md` | O achado jurídico sobre a **própria régua**; senha em texto puro × selo OG; qual regra de hash é a canônica; a sobrevivência da Linha caiu de ~34% para **~11% como teto**. *(O "prazo vencido do snapshot" que este relatório levantou **deixou de existir** — ver a nota abaixo)* |
| `docs/legacy-plan/chain/26_roadmap_v2_produtor.md` | O roadmap recalculado com o XP autoritativo e o selo OG dentro |

> ### 🔄 Nota de revisão — 24/09/2026, decisão do dono
>
> **O seu pedido, verbatim:** *"O selo OG é para todas as contas criadas até dia 26 mês 08 e ano 2027, depois desta data as contas criadas vêm sem o selo OG!"*
>
> Isso **substitui** a regra que os relatórios `chain/24` e `chain/25` tinham desenhado (corte retroativo em `2026-09-22T03:00:00Z`, uma foto do passado tirada às pressas). O selo deixa de ser *"quem já estava aqui em setembro de 2026"* e passa a ser **uma janela de fundação aberta, que fecha em 26/08/2027**.
>
> **O que isso muda, em três linhas:** (1) **acabou a urgência** — não existe mais prazo vencido neste plano; (2) o mecanismo deixa de ser *"foto única do passado"* e vira **"regra corrente anunciada + prova final no futuro"**; (3) o argumento de *"não anuncie antes do snapshot"* **se inverte**: agora anunciar cedo é o que torna a regra justa.
>
> **O que NÃO muda:** a regra de hash `DGOG1`, a separação folha pública/vínculo privado, o carimbo OpenTimestamps, a postura honorífica, a UI das 16 superfícies, a análise de LGPD e os pré-requisitos de senha e de vazamento de e-mail. Onde o texto abaixo foi ajustado, foi só onde ele dependia **da data** ou **do mecanismo de corte**.
>
> **Os relatórios em `chain/` NÃO foram alterados** — eles são o registro histórico do que se pensou em 21/09. Onde este plano e eles divergirem sobre o corte, **vale este plano**.

> ### 🔄 Nota de revisão — 25/09/2026, segunda decisão do dono: **XP flat no Episódio 1**
>
> **O seu pedido, verbatim:** *"Os inimigos devem dar o mesmo XP que dá na fase 1 em todas as 33 fases do episódio 1. Agregue isso ao plano para eu ver e se gostar eu aprovo para os agentes fazerem o trabalho!"*
>
> **Agregado, medido e recomendado.** O trabalho está na **Seção 2.14** (os 3 cenários que você pediu, com números), na nova decisão **A15** (Seções 0.9 e 14.2), e em notas curtas em 0.3, 0.4, 2.3 e 2.5. **Veredito: sua regra está certa e é a mudança isolada de maior impacto deste plano** — ela não só apaga o atalho da fase 33, **inverte o sinal dele** (farmar lá passa de "o melhor lugar do jogo" a "o pior"). Duas ressalvas, as duas dentro de A15: **(1)** ela **não substitui** o teto diário — teto diário impede farm de *tempo*, a sua regra impede farm de *lugar*, e o jogo precisa das duas (2.14.6); **(2)** *"as 33 fases"* **não inclui a CAVE1** (`multFase = 500`, a 34ª sala secreta), e deixá-la de fora preservaria um atalho residual de **732×** — **e você fechou essa ponta no mesmo dia; leia a nota seguinte.**
>
> **E ela corrige dois números publicados neste próprio documento** (Seções 2.3 e 15.4): o farm da fase 33 vale **~5,2 anos, não 0,21 ano**, e a dispersão de hoje é **~272×, não 12.375×** — porque o `raw/12` *supôs* o ritmo de kills em vez de derivá-lo do HP. **O desastre é o mesmo; o número honesto é este.**
>
> **Modo PLANO continua valendo:** nada do jogo foi alterado por esta revisão.

> ### ✅ Nota de revisão — 25/09/2026, **as duas pontas que faltavam foram fechadas pelo dono**
>
> **O seu pedido, verbatim** (`00_BRIEF.md` §10): *"Inclua a fase CAVE1 [na regra de XP flat] e todos os ghosts devem dar o mesmo XP que os inimigos dão! Inclua isso no plano 1."*
>
> Você fechou **exatamente** as duas ressalvas que a Seção 2.14 tinha levantado, e o resultado é o melhor possível: **não sobra atalho nenhum.** Depois de fechar as duas pontas, **todo** lugar de farm do jogo fica **mais lento** que o jogador mais devagar e mais desavisado da fase 1 — razões de **0,37× a 0,54×**, todas abaixo de 1 **[CÁLCULO, Seção 2.14.8]**. O melhor XP/hora do jogo passa a ser **a própria fase 1**, e nada consegue superá-la em mais de **+1,3%**. A dispersão por *lugar* deixou de existir; o que sobra é só "quão rápido você joga", que é precisamente o que a curva `n₀` foi feita para comprimir.
>
> **E a investigação de código que o seu pedido obrigou trouxe a melhor notícia da rodada: não existe risco de XP duplo.** *Capturar* e *matar* **não são dois eventos** — são o **mesmo** evento. `UnlockGhostForPlayer()` roda **dentro** do bloco de morte, depois do único `addXp()`, e ela **não concede XP nenhum** ao jogador **[VERIFICADO: `engine.js:3307-3321`, `js/game/ghost_inventory.js:8-43`]**. Detalhe completo em **2.14.8**.
>
> **Modo PLANO:** nada do jogo foi alterado.

**Etiqueta de confiança em cada número** (mantida do v1):

| Etiqueta | Significa |
|---|---|
| **[VERIFICADO]** | Alguém leu no código real deste projeto (com arquivo e linha) ou conferiu em fonte externa datada |
| **[CÁLCULO]** | Conta refeita em Node, num script descartável fora do repositório. Os números centrais deste v2 foram **recalculados pela terceira vez** ao escrever este documento |
| **[HIPÓTESE]** | Julgamento, estimativa ou proposta. Não é fato. Você pode discordar sem estar errado |

**Uma regra que vale para o documento inteiro:** nada aqui é aconselhamento jurídico. A Seção 7 lista o que precisa de um advogado de verdade.

---

## Como ler este documento

| Se você tem… | Leia |
|---|---|
| **2 minutos** | **Seção 0.1** — a regra do selo OG e a única coisa que ainda tem relógio correndo |
| 5 minutos | **Seção 0** inteira |
| 15 minutos | Seção 0 + **Seção 14** (o checklist que você responde) |
| 1 hora | 0, 2, 10, 11, 12, 14 |
| tudo | o documento inteiro; as Seções 1 e 3 a 9 são o detalhe de cada departamento |

**As Seções 0 e 14 são autossuficientes.** Se você só ler essas duas, consegue aprovar ou recusar com consciência.

**O que mudou do v1, em cinco linhas:**

1. **O nível agora vem do XP dos inimigos** (era do tempo). Seu pedido da Parte 1 — e, por um motivo jurídico que ninguém tinha visto, ele **melhora** a posição legal do projeto (Seção 7.1).
1-b. 🆕 **E, dentro do Episódio 1, esse XP é flat** — todo inimigo paga o valor da fase 1, nas 33 fases (sua decisão de 25/09). É o que mata o atalho do 666/500 **sem policiar ninguém**: a fase difícil deixa de pagar mais e passa a pagar o mesmo, e como matar lá demora mais, farmar ali vira o pior negócio do jogo. **Seção 2.14 + decisão A15.**
2. **Entrou o selo OG**, agora como **janela de fundação que fecha em 26/08/2027** (Seção 0.1 e Seção 10). Não há mais prazo vencido — o que ficou no lugar é uma **promessa pública que você vai poder anunciar já**, e que não se recua depois de anunciada.
3. **A conta de sobrevivência ficou pior e mais honesta:** a chance de alguma das ~48 Linhas de hoje chegar a 3147 caiu de "~34%" para **até ~11%, e provavelmente 3–5%**.
4. **Duas coisas passaram a ser bloqueio formal, não recomendação:** corrigir o vazamento de e-mail antes de o selo aparecer na tela, e uma única regra de hash para a raiz do selo.

---

## 0. Resumo para decidir em 5 minutos

### 0.1 A regra do selo OG — a janela de fundação, e o que mudou hoje

**O que eu preciso de você:** **uma frase fixando o instante exato do corte** (não uma autorização de banco). Depois disso, o selo vira uma regra pública que roda sozinha por onze meses.

**A sua decisão de hoje, e o que ela desfez.** O desenho anterior (`chain/24`, de 21/09) fotografava as contas que existiam em `2026-09-22T03:00:00Z` e corria contra o relógio, porque foto do passado não se tira depois. Você trocou isso por outra coisa: **uma janela de fundação que continua aberta e fecha em 26/08/2027**. Toda conta criada antes desse instante ganha o selo; nenhuma criada a partir dele ganha, nunca.

> **🟢 Consequência imediata: este plano não tem mais nenhum prazo vencido.** O item que estava em vermelho saiu do vermelho. Onde o texto antigo dizia "irrecuperável", "não existe segundo prazo" ou "esta semana", leia a versão corrigida — fizemos essa limpeza no documento inteiro.

**O instante que eu recomendo, por extenso:**

> **`CUTOFF = 2027-08-26T03:00:00Z`, exclusivo** — a meia-noite de Brasília que separa **25 de agosto de 2027** de **26 de agosto de 2027**.
> Em português simples: **o dia 25/08/2027 conta inteiro; o dia 26/08/2027 já não conta.**

**Três razões para escrever o corte assim, e não de outro jeito:**

1. **Em UTC, porque o banco pensa em UTC.** É o mesmo cuidado da regra antiga (Seção 10.4): "criada em 25/08/2027" é uma frase ambígua — uma conta criada às 22:00 de Brasília do dia 25 tem `created_at = 2027-08-26T01:00:00Z`, que é "hoje" para você e "amanhã" para o servidor. Um instante em UTC não tem essa dupla leitura.
2. **Exclusivo (`<`, não `<=`), para não existir "o segundo do meio".** Toda conta cai de um lado ou do outro, e ninguém precisa decidir o que fazer com quem se cadastrou exatamente na virada.
3. **O instante em UTC é o contrato — não o relógio de parede.** O Brasil aboliu o horário de verão em 2019, então hoje Brasília é UTC−3 o ano inteiro, e agosto nunca esteve dentro do antigo período de verão de qualquer forma. Mas se o horário de verão voltar antes de 2027, **a constante em UTC não muda** — muda só a hora local que ela representa. Fixar o instante absoluto é o que impede que uma decisão de política pública de 2027 mexa, sem querer, em quem é OG.

> ⚠️ **Uma ambiguidade que só você resolve, e ela precisa ser resolvida ANTES do anúncio.** A sua frase foi *"para todas as contas criadas até dia 26 mês 08 e ano 2027"*. Em português, **"até dia 26"** tanto pode incluir quanto excluir o próprio dia 26. Eu adotei a leitura **exclusiva** (o 26 já não conta), porque a segunda metade da sua frase — *"depois desta data as contas criadas vêm sem o selo"* — trata o dia 26 como o começo do "depois". **Se você quis dizer que o dia 26 conta inteiro**, a única mudança é a constante: `2027-08-27T03:00:00Z`. É uma linha de código e uma linha de anúncio — mas **depois de anunciada, não se mexe mais nela**.

**O que ficou mais fácil, e é a melhor notícia desta revisão:** provar que ninguém entrou depois ficou **mais simples**, não mais difícil. No desenho antigo o corte era escolhido dias depois de a lista existir, e a suspeita natural era *"escolheram a data depois de ver quem estava dentro"*. Agora o corte é **público, redondo e anunciado com onze meses de antecedência**: qualquer conta tem o próprio `created_at` conferível contra uma constante que o mundo inteiro já conhecia antes. A acusação de data escolhida a posteriori simplesmente não se sustenta.

**E o argumento de "não anuncie antes" se inverteu.** O desenho antigo mandava **não** anunciar, porque "toda conta existente hoje ganha OG" provocaria uma corrida de cadastros naquela mesma noite. Com um corte a onze meses e público, **esse medo perde o objeto**: não há data secreta para correr na frente. **Anuncie desde já** — e o anúncio é o que dá à regra a propriedade de ter vindo antes dos fatos. A Seção 10.2 trata do incentivo residual que sobra (colecionar contas ao longo da janela) e propõe uma mitigação de uma linha de SQL.

**O que eu ainda recomendo fazer agora, e agora é opcional:** uma leitura **somente leitura** do banco, como **marco interino** — não define quem é OG (a regra é que define), serve para (i) documentar o estado de hoje, (ii) ensaiar o script de verdade quase um ano antes do dia em que ele vai valer, e (iii) fechar a janela de retrodatação das ~48 contas atuais. O detalhe e o raciocínio estão em **10.2**; o custo é **~0,5 dia seu e R$ 0**, e adiar já **não** é irrecuperável.

**O que continua com relógio correndo, e agora é o primeiro da fila:** o **vazamento de e-mail** (Seção 0.7, Bloqueio 1). Ele é real hoje, atinge dados pessoais provavelmente de menores, independe do selo e do conceito — e, com o selo virando uma campanha de onze meses, ele é exatamente o problema que você **não** quer ter enquanto divulga o jogo.

### 0.2 O conceito, em linguagem simples

Um **jogo legado** é um jogo cuja linha de chegada foi colocada de propósito **longe demais para uma pessoa só**, e que só continua avançando se alguém **entregar a conta a outra pessoa, que aceita de livre vontade**. Cada entrega fica registrada, e esse registro vira parte do jogo.

No Danger Ghost: uma conta, um ghost (o *Legacy Ghost*), um número que sobe devagar, e uma corrente de pessoas — você, depois quem você escolher, depois quem essa pessoa escolher — até que alguém chegue ao nível **100.000.000.000** (1e11) e coloque a última pedra, **a Keystone**.

A sua frase original — *"se assim quiser"* — é **a cláusula constitucional do conceito**. Ninguém é obrigado a continuar, ninguém é obrigado a aceitar, e o jogo é proibido de usar culpa para cobrar presença.

### 0.3 A régua, e o que o jogo de hoje faz com ela

**A régua:** 1 hora por dia, com o mesmo ghost, chega ao nível 1e11 no ano de 3147.

- De 20/09/2026 a 31/12/3147 são **409.538 dias ≈ 1.122 anos** **[CÁLCULO, reconferido três vezes]**. (De hoje, 24/09/2026, são 409.534 dias — quatro dias de diferença, que desaparecem dentro da margem de presença da Seção 2.5.)
- Isso dá, em média, **244.177 níveis por hora de jogo** — 0,0147 segundo por nível. O número do nível **não é uma barrinha de XP; é um odômetro**. A sensação de progresso tem que morar em outro lugar (Seção 3).
- **O jogo de hoje é rápido demais por dois motivos independentes, e o segundo é novo neste v2:**
  1. **Todo o XP e todo o nível são calculados no navegador do jogador.** O teto de validação do nível no servidor é exatamente `1e11` — o objetivo final do jogo. Na prática, **um jogador já logado zera o jogo de 1.122 anos em um único pacote de rede** **[VERIFICADO: `server/db.js:466-467`, `js/game/engine.js:1104-1105`]**.
  2. **E nem precisa trapacear.** O multiplicador de fase do XP vale **666 na fase 33** e **500 na CAVE1** **[VERIFICADO: `js/game/engine.js:969-978`]**. Farmando ali, um jogador honesto chega ao nível 1e11 em **~1.900 horas de jogo ≈ 5,2 anos a 1 h/dia**, contra os 1.121 anos da régua — uma dispersão de **~272×** entre o estilo mais lento e o mais rápido **[CÁLCULO, Seção 2.14.3; o `raw/12` publicou "41 a 77 horas" e "12.375×" supondo um ritmo de kills que o HP da fase 33 torna impossível — a correção está em 2.3 e o desastre é o mesmo]**. O v1 publicou "126×" porque o relatório de calibração não tinha visto os multiplicadores 666 e 500.

**Traduzindo:** o problema nunca foi "está fácil subir de level". O problema é que existe um **atalho de três ordens de grandeza dentro do conteúdo que já está no ar**, e ele não exige nenhuma trapaça: é só escolher a fase.

> 🆕 **E a sua decisão de 25/09 conserta exatamente este segundo motivo.** Você disse: *"os inimigos devem dar o mesmo XP que dá na fase 1 em todas as 33 fases do episódio 1"*. **É a correção direta do 666/500:** a raiz do problema é que hoje **a fase difícil paga MAIS**; a sua regra faz a fase difícil pagar **O MESMO** — e como matar lá demora mais, farmar a fase 33 deixa de ser o melhor lugar do jogo e passa a ser **o pior** (de **5,2 anos** até 1e11 para **3.498 anos**, contra 1.400 anos de quem joga devagar na fase 1) **[CÁLCULO, Seção 2.14]**. O atalho não precisa ser policiado: ele desaparece por aritmética. **Ela não substitui o teto diário** — as duas regras bloqueiam farms diferentes (Seção 2.14). ✅ **E em 25/09 você fechou as duas pontas que faltavam** (a CAVE1 e a escada própria da captura de ghost): com elas fechadas, **não sobra atalho nenhum** — todo lugar de farm fica **mais lento** que a fase 1 (razões de 0,37× a 0,54×), e o melhor XP/hora do jogo passa a ser a própria fase 1 **[CÁLCULO, Seção 2.14.8]**.

### 0.4 As 6 ideias que fazem o conceito funcionar

1. **O nível vem do XP dos inimigos — e o XP vem do servidor.** `nível = C⁻¹(XP acumulado)`, com o XP de cada kill definido por uma **tabela do servidor por Era** e um **orçamento diário**. É o seu pedido da Parte 1, atendido literalmente: o jogador mata, vê o XP entrar, e o nível sobe por causa disso.
   > 🆕 **A regra que você acrescentou em 25/09, e que agora é parte do desenho:** a tabela é indexada por **Era** (tempo) e **tipo de inimigo** — **nunca pela fase**. Dentro do Episódio 1, portanto, **o XP é flat: todo inimigo paga o valor que um inimigo equivalente paga na fase 1**, nas 33 fases, **na CAVE1** e **na captura de ghost da Ghostdex** (que passa a valer o mesmo que matar um inimigo comum). A fase continua mudando o HP (a dificuldade), nunca o prêmio. **Com as três pontas fechadas não sobra atalho:** o melhor XP/hora do jogo é a fase 1, e nada a supera em mais de +1,3% **[CÁLCULO, Seção 2.14.8]**. *(A única pergunta que continua sua é se isso vincula os Episódios futuros — decisão **A15-b**.)*
2. **Uma curva única e suave, agora expressa como orçamento de XP:** `L*(H) = 20·H + (1e11 − 20·T)·(H/T)³`, com `T = 409.538 h`, e `XP*(H) = C(L*(H))`. Dia 1 = nível **20**; ano 1 = **7.371**; em 3147 = **1e11 exato, erro zero** **[CÁLCULO]**. A curva do v1 **não mudou** — mudou o que ela governa.
3. **Teto diário de 1 hora creditável (`τ = 0`), por Linha.** A hora extra não rende. É o que impede um jogador de 16 h/dia de terminar dentro da própria vida.
4. **Rendimento decrescente dentro do dia**, em vez de uma porta batendo na cara: `XP recebido = orçamento × (1 − e^(−n/n₀))`, com `n₀ = 13,35`. Quem faz 40 kills na hora já pega **95%** do orçamento; quem faz 5.000 pega 100%. A dispersão de **250× em ritmo de kills vira 1,29× em XP** **[CÁLCULO, reconferido]**.
5. **A régua é da Linha, não da pessoa.** Uma família revezando a conta joga como **uma** pessoa, com um teto só. Com o XP vindo de kills, isso deixou de ser elegante e virou **obrigatório**: sem o orçamento por Linha, três pessoas em turnos fariam 3× as kills.
6. **A sensação de progresso mora em cinco degraus**, não no número: **Day Seal** (o dia fecha) → **Ring** (365 h creditadas) → **Digit Milestone** → **Era** (10 delas) → **Capítulo do Keeper** (~25 anos). O odômetro é rodapé; a Era é o que se vive.

**O efeito, numa tabela só** **[CÁLCULO, `raw/12` §3.4, reconferido]**:

| Arquétipo | Hoje | Sob este plano |
|---|---|---|
| 1 h/dia, ritmo mediano (**a régua**) | 207 anos | **1.121,5 anos** |
| 1 h/dia, jogador lento | 1.396 anos | 1.129,1 anos |
| 16 h/dia | dias | 1.121,3 anos |
| Família revezando 3×8 h (mesma Linha) | dias | 1.121,3 anos |
| **Bot 24 h/dia** | horas | **1.121,3 anos** |
| **Farm da fase 33 / CAVE1** | **~1.900 h ≈ 5,2 anos** | **1.121,3 anos** — e, com o XP flat, ali é o **pior** lugar do jogo |

**Leia a última linha e a do bot.** Não é preciso **detectar** bot nenhum — é preciso ter **teto**. O bot ganha exatamente o que um humano de uma hora ganhou.

### 0.5 O selo OG, em seis linhas

- **Toda conta criada antes do corte** (`2027-08-26T03:00:00Z` — meia-noite de Brasília entrando em 26/08/2027) ganha um selo **`OG`** desenhado **acima do level do ghost**, em web e no celular. Nenhuma conta criada a partir desse instante pode obtê-lo, nunca, por nenhum caminho.
- **A janela está aberta e dura ~336 dias ≈ 11,0 meses a contar de hoje [CÁLCULO]**. Enquanto ela estiver aberta, **a regra é o que concede o selo** — quem se cadastrar amanhã é OG tanto quanto quem se cadastrou ano passado. Quando ela fechar, a lista fecha junto e **nunca mais aumenta**.
- A prova de que ninguém entrou depois é uma **raiz Merkle** da lista fechada em 26/08/2027, **carimbada de graça no Bitcoin** via OpenTimestamps e publicada. Cada jogador OG recebe um **certificado** que ele mesmo confere — *"guarde este arquivo; ele prova que você estava aqui na fundação, mesmo que este servidor deixe de existir."*
- **É honorífico e nada mais:** sem token, sem XP, sem bônus, sem vantagem. Essa é a decisão que mantém o risco jurídico, econômico e de desigualdade entre Linhas perto de zero (Seção 10.7) — **e agora ela faz um segundo trabalho:** é o que impede que uma janela de onze meses vire corrida por contas de valor.
- **É uma vitória barata** e é **Web2 puro**, independente da blockchain e independente de você aprovar o resto do conceito: o núcleo visível é **~9–13 dias de trabalho**. A parte irreversível deixou de ser um snapshot às pressas e passou a ser **o anúncio público da data** — que custa zero e não se retira.
- **Mas tem dois bloqueios antes da tela** (Seção 0.7). **E uma observação honesta sobre o significado do selo**, que eu registro sem decidir por você: em onze meses entra muito mais gente do que as ~48 de hoje — a conta está em **10.13**.

### 0.6 O que este plano NÃO promete

- **Não promete que alguém vai jogar 1.122 anos.** Não promete nem que o servidor estará no ar.
- **Não promete "1 hora todo santo dia".** Faltar um dia a cada vinte custa **60 anos**; um a cada dez, **125 anos** **[CÁLCULO]**. A promessa pública tem que ser *"cerca de 365 horas por ano, quando der"*, nunca *"todo dia"*.
- **Não promete que a sua Linha chega.** A conta honesta está em 0.8, item 1 — e ela **piorou** desde o v1.
- **Não é aconselhamento jurídico**, não é instrumento de herança, e não transfere bens.
- **Não existe precedente.** Ninguém nunca fez uma conta única projetada para 1.100 anos passando de pessoa em pessoa. O MMO mais longevo em atividade tem ~30 anos **[VERIFICADO]**. Nenhum número deste plano se apoia em "já deu certo antes".
- **Não promete nada sobre a blockchain.** Ela é outro documento, congelado.

### 0.7 Os dois bloqueios formais — e por que subi de "recomendação" para "bloqueio"

**Bloqueio 1 — o vazamento de e-mail.** Hoje o servidor transmite o objeto `players` **inteiro** a todos os clientes conectados via `sync_state`, e o login grava o `.email` de cada jogador **nesse mesmo objeto**; o payload do overworld manda `email` **de propósito**, porque o cliente usa o e-mail como chave para se filtrar **[VERIFICADO: `server/index.js:1305-1309`, `:709/737/765/802`, `:1375`; `js/game/network.js:212`]**. Ou seja: **o e-mail de quem está logado pode estar chegando aos outros jogadores hoje**, sem nenhuma relação com o Legado.

> **Nenhum campo novo — inclusive o `og` do selo — entra nesses payloads antes de o vazamento ser corrigido.** O motivo é de sequência, e é desconfortável: **o selo OG é exatamente o que vai te fazer divulgar o jogo.** Acrescentar o selo primeiro significa **aumentar o público de um vazamento de dado pessoal — provavelmente de menores** — em vez de reduzi-lo.
>
> **E com a janela de onze meses esse argumento ficou mais forte, não mais fraco.** O desenho antigo divulgava uma vez, para ~48 pessoas que já estavam aqui. O novo desenho é **uma campanha de onze meses convidando gente nova a se cadastrar antes de 26/08/2027** — ou seja, você vai ativamente empurrar jogadores para dentro de um jogo que hoje espalha o e-mail de quem está logado. Este bloqueio deixou de ser o segundo item da lista e virou **o único item deste plano com relógio de verdade correndo**.
>
> *(Este achado já tem uma tarefa separada em andamento nesta sessão. Este plano o trata como **dependência**, não como trabalho novo: a causa raiz é que o servidor não manda um `socket.id` público, então o cliente não tem outra chave — trocar por um **id opaco** conserta os dois payloads, e só isso conserta o overworld. Estimativa: ~0,5 a 1,5 dia, nas duas plataformas, mais recompilar o APK.)*

**Bloqueio 2 — uma regra de hash só para a raiz do selo.** Dois relatórios especificaram **duas regras diferentes** para a **mesma** raiz Merkle, cada um com o próprio vetor de teste, cada um se dizendo canônico. Se um for implementado e o outro publicado, existirão **duas raízes carimbadas no Bitcoin** chamadas "a lista OG" — e qualquer disputa futura sobre quem é OG passa a ter **duas respostas**. Uma raiz carimbada não se apaga.

> **Veredito, e ele é meu como diretor:** vale a regra **`DGOG1`** do `chain/24` §2.4, **integralmente e sem alteração** (folha com rótulo de domínio + `og_id` de 32 bytes + dia; árvore RFC 6962). **A mudança de 24/09 não toca nesta regra:** `DGOG1` descreve **como** uma lista vira uma raiz, e isso independe de **quais** contas entram na lista e de **quando** ela fecha. **Critério de aceite obrigatório antes de qualquer carimbo:** duas implementações **em linguagens diferentes** produzindo a mesma raiz sobre o mesmo arquivo de folhas. Hoje existem duas, ambas em Node — **falta uma em Python**, e ela é barata.
>
> *(O que mudou foi só o prazo para cumprir esse critério: em vez de "esta semana, antes do carimbo às pressas", você tem **onze meses** até o carimbo que vale. Isso transforma um item apertado num item confortável — e é mais um motivo para o marco interino de 10.2, que exercita as duas implementações com quase um ano de antecedência.)*

### 0.8 Os cinco riscos que mais pesam

1. **A corrente arrebenta muito antes de 3147 — e a conta ficou pior.** Uma Linha precisa atravessar ~**45 trocas de Guardião**. Se cada troca tem 90% de chance de dar certo, a Linha chega em **0,87%** dos casos. O v1 dizia que a chance de **alguma** das 48 contas de hoje chegar era de ~34%; a auditoria mostrou que essa fórmula **supõe que as 48 Linhas falham por motivos independentes — e elas não falham**: uma especificação com defeito, um desastre comum, ou simplesmente as 48 contas pertencerem a pessoas da mesma cidade e da mesma rede social são **causa comum**. **Número honesto: até ~11% como TETO, e da ordem de 3–5% com correlação realista** **[CÁLCULO, `chain/25`]**. **Consequência direta:** o *Commons* (uma Linha sem herdeiro poder ser adotada por um estranho que se ofereça) não é enfeite — é **requisito de viabilidade**. E volume também: é por isso que a comunicação importa.
2. **Hoje qualquer jogador zera a régua em um pacote de rede — e o farm da fase 33 zera sem trapacear.** Enquanto o XP não vier do servidor, a régua é uma sugestão (0.3).
3. **O jogo depende de uma pessoa só.** Se você sumir amanhã, somem com você a chave de assinatura do app, o domínio, o acesso ao banco e o segredo de sessão. Não há backup verificado hoje **[VERIFICADO]**. **Nenhuma promessa de séculos é honesta antes de existir uma segunda pessoa com acesso.**
4. **A lei brasileira, lida ao pé da letra, chama a régua de "recompensa pelo tempo de uso"** — e agora eu tenho o **texto integral** do dispositivo, não só uma leitura secundária (Seção 7.1). A notícia boa: **a sua decisão de que o nível vem do XP melhorou a posição legal do projeto**, e ninguém tinha notado isso.
5. **As contas mais antigas do projeto são exatamente as que tiveram senha em texto puro — e a janela nova melhorou isso pela metade.** As senhas só passaram a bcrypt em **18/08/2026**; a migração para o Supabase foi em **19/08/2026**, um dia depois. Qualquer backup, dump ou log anterior a 18/08 contém senhas legíveis. **O que a decisão de 24/09 mudou:** antes, *toda* a coorte OG era anterior a essa correção; agora a coorte OG é majoritariamente formada por contas que **já nascem com bcrypt**, porque a janela vai até agosto de 2027. **O risco não sumiu — ele encolheu e ficou localizado:** continua inteiro para as **~48 contas anteriores a 18/08/2026**, e essas ainda precisam de **troca de senha + confirmação por e-mail** antes de reivindicar o selo. Para quem se cadastrar de hoje em diante, esse pré-requisito específico **não se aplica** (Seção 10.6).

### 0.9 O que você precisa decidir agora

São **19 decisões bloqueantes** (eram 17; **a A15 e a A15-b entraram em 25/09**, com as suas decisões de XP flat — Seção 2.14; e a A15 já está **respondida por você**, faltando só o registro), todas detalhadas com recomendação na **Seção 14**. Em uma linha cada, na ordem de urgência. *(As quatro do selo OG continuam no topo, mas por outro motivo: elas não são mais as que "vencem" — são as mais **baratas de responder** e as que destravam um anúncio público que só faz bem quanto mais cedo sair. O item que realmente não espera é o **vazamento de e-mail**, que não é uma decisão e sim uma correção — Seção 0.7.)*

| # | Pergunta | Recomendação |
|---|---|---|
| **OG1** | **Confirma o instante exato do corte da janela OG?** | **`2027-08-26T03:00:00Z`** (exclusivo) — o dia 25/08/2027 conta, o 26 não |
| **OG1-b** | Autoriza a leitura somente-leitura do banco? *(agora **opcional**)* | **Sim, como marco interino** — e, de qualquer forma, os dois levantamentos (níveis + senhas não migradas) travam outras fases |
| **OG2** | Quem é elegível (teste, vazia, duplicata, bot, equipe)? | Regra pública + você revisa a lista de exceções · **+ "sinal de vida" para contas criadas depois do anúncio** |
| **OG3** | Quando anunciar? | **Agora** — o motivo para esperar deixou de existir |
| **OG4** | O selo dá algum benefício? | **Nenhum — honorífico puro** (e isso ficou **mais** importante com a janela aberta) |
| A4′ | **O nível vem do XP ou do tempo?** | **Do XP**, com o XP concedido pelo servidor dentro de um orçamento diário derivado do tempo |
| A12 | Quanto o ritmo de kills importa (`n₀`)? | `n₀ = 13,35` (dispersão residual 1,29×) |
| A13 | Existe um piso para quem cumpre a hora e mata pouco? | **Sim**, 80% do orçamento, com ≥10 kills no dia |
| **A15** ✅ | **XP flat: a CAVE1 entra, e a captura de ghost passa a valer o mesmo que um inimigo?** | **JÁ DECIDIDO POR VOCÊ em 25/09 — sim para as duas.** Com as três pontas fechadas **não sobra atalho**: todo lugar de farm fica 0,37×–0,54× a velocidade da fase 1 **[CÁLCULO, 2.14.8]**. Só falta confirmar o registro |
| **A15-b** 🆕 | **O princípio vincula os Episódios futuros** (2, 3, …) ou cada um se decide na hora? | **Vincula.** O XP codifica *quando* (Era) e *o quê* (tipo), **nunca onde**. Custa zero a mais e impede o problema de voltar por distração |
| A1 | Formato da curva | Suave (a mesma do v1), Eras ancoradas em tempo |
| A2 | O que "3147" promete | "365 h/ano, quando der" + cada Linha tem a própria estrada |
| A3 | Quanto rende a hora extra | Nada (`τ = 0`) no lançamento |
| A5 | A régua é da pessoa ou da Linha | **Da Linha** |
| A6 | Regra de hash da Crônica e da raiz OG *(sem volta)* | RFC 8785 para a Crônica; **`DGOG1`** para a raiz OG |
| A7 | O que acontece com os 139 personagens | Era Zero + selo OG |
| A8 | Menores entram na régua | Sim com salvaguardas; até o parecer, "Aprendiz" |
| A10 | Android: registrar-se + chave de release | Sim, até 31/12/2026 |
| A11 | Backup verificado + segunda pessoa | Sim, antes de qualquer migração |

**As três últimas (A8 parcialmente, A10 e A11) valem mesmo que você rejeite o conceito inteiro. As quatro do selo OG também** — elas são o seu pedido, são Web2 puro e não dependem de nenhuma outra linha deste documento. **Mas repare na inversão que a janela produziu:** antes, OG1 era a decisão que precisava sair *na frente de todas*, sob pena de não ter mais conserto. Agora a decisão que precisa sair na frente é **corrigir o vazamento de e-mail**, e OG1 é só a primeira que você consegue responder sem trabalho nenhum.

### 0.10 O tamanho real do compromisso

- **MVP do Legado v2 (Fases F-1 a 3′): 103–173 dias de trabalho** ≈ **410–690 horas suas** dirigindo os agentes **[CÁLCULO sobre HIPÓTESES, `chain/26`]**. É mais que o v1 (77–130 dias) porque agrega o **spawn autoritativo** (o preço do XP vir do servidor) e o **núcleo do selo OG**. A 3 dias por semana: **~8 a 14 meses**. A 5 dias por semana: **~5 a 8 meses**. **É um segundo emprego.**
- **Datas [CÁLCULO]:** no Ritmo A (3 dias/semana), o lançamento cai entre **~jul/2027 e ~nov/2027**; no Ritmo B (5 dias/semana), entre **~mar/2027 e ~jun/2027**.
- **Dinheiro no 1º ano: US$ 1.600–4.600 (≈ R$ 9.000–25.000)** **[HIPÓTESE]**, dominado por advogado/DPO — não por servidor.
- **O MVP do Legado termina inteiramente antes de o Episódio 2 sequer começar** — o que confirma que a sua própria ordem (Legado primeiro, blockchain depois) é fisicamente compatível com o calendário, não só logicamente.

**A saída honrosa existe e está desenhada:** você pode aprovar **só a F-1 (o vazamento de e-mail + o anúncio da janela OG) e a Fase 0** — o que vale de qualquer jeito —, ver a Fase 1 (papel e simulação) e decidir no portão G1 se continua. Nada do que é feito até ali é irreversível, com **uma** exceção declarada — e ela mudou de natureza nesta revisão: não é mais o carimbo da raiz (que agora só acontece em agosto de 2027), é **o anúncio público da data de corte**. Uma promessa de "quem entrar até 26/08/2027 é OG" não se retira depois de dita, e é justamente por isso que ela tem que sair com a constante já certa (Seção 0.1).

---

## 1. O que é um Jogo Legado

*(fonte principal: `raw/01_filosofia.md` — esta seção é a do v1, com uma única mudança de vocabulário, marcada no fim)*

### 1.1 Definição formal

Uma definição clássica diz a que **família** a coisa pertence e o que a **separa** das outras da família.

> **Um jogo legado é um jogo de progressão persistente cujo objeto de progresso é único, contínuo e transferível entre pessoas; cuja condição de término foi posta, de propósito, além do alcance de uma vida humana; e cuja continuidade depende de uma cadeia de detentores voluntários, em que cada entrega é um ato consentido nas duas pontas e registrado de forma permanente — de modo que o registro das entregas é, ele próprio, conteúdo jogável do jogo.**

São **cinco condições necessárias** (se faltar uma, deixa de ser jogo legado) que, juntas, bastam:

| # | Condição | Se faltar, vira… |
|---|---|---|
| **C1** | **Progresso único e contínuo** — um objeto de progresso que nunca é resetado | jogo incremental com *prestige* |
| **C2** | **Fim real, além de uma vida** — alcançável em princípio, inalcançável por um só | "forever game" ou jogo longo comum |
| **C3** | **Cadeia de pessoas** — passa entre seres humanos distintos | herança de item / conta compartilhada |
| **C4** | **Consentimento nas duas pontas** — entregar e aceitar são escolhas, sem punição por recusar | obrigação hereditária (*dark pattern*) |
| **C5** | **Registro ininterrupto** — toda entrega e todo detentor ficam registrados de forma legível | uma conta velha que trocou de dono |

**O achado mais importante desta seção:** a condição **C2 não é poesia, é requisito matemático**. Se 16 h/dia permitir zerar em ~70 anos, o jogo deixa **formalmente** de ser legado. É por isso que o teto diário (decisão A3) não é gosto — é definição. **E é por isso que o farm da fase 33, que zera em ~1.900 horas ≈ 5,2 anos a 1 h/dia (Seção 2.3), não é um problema de balanceamento: é a prova de que hoje o Danger Ghost não é um jogo legado.**

### 1.2 Os 10 princípios, e de onde eles vêm

Cada princípio nasce de uma estrutura real, verificada. A tabela separa **o fato** (aconteceu, tem data), **a regra de jogo** que sai dele e **o cuidado ético** — porque é exatamente aí que projeto "filosófico" vira enganação.

| # | Estrutura (verificada) | Regra de jogo que sai dela | Cuidado |
|---|---|---|---|
| **1** | **Mordomia / usufruto** — direito romano; Jefferson usa a palavra na carta a Madison de 06/09/1789 **[VERIFICADO]** | O Keeper **detém, não possui**. Pode jogar, evoluir, nomear herdeiro, recusar entregar, encerrar a linha. **Não pode** vender, apagar a Crônica, resetar o Legacy Ghost. Dois campos separados no banco: quem é titular × quem detém a Linha agora | "steward" tem carga religiosa em inglês; custódia sem direito de saída vira servidão |
| **2** | **Burke, *Reflections*, 1790** — a sociedade como parceria "entre os vivos, os mortos e os que ainda vão nascer" **[VERIFICADO]** | A Crônica tem três painéis: **The Dead** (só leitura), **The Living** (o Keeper atual), **The Unborn** (a Carta Selada para um herdeiro que ainda não tem nome) | Burke é conservador e escreveu isso *contra* a reforma; pegue a imagem, não a política |
| **3** | **Jefferson (1789) e Paine (1791)** — "governar além do túmulo é a mais ridícula das tiranias"; e a *rule against perpetuities* do direito inglês, criada para limitar a "mão morta" **[VERIFICADO]** | **O contraponto obrigatório.** Recusa sempre possível, sem penalidade; **nenhuma condição herdável**; zero linguagem de culpa | Quanto mais bonita a Crônica, mais pesada a recusa. A recusa precisa ser **projetada para ser fácil**, não só permitida |
| **4** | **Hans Jonas, 1979** — poder ampliado cria dever proporcional; origem do princípio da precaução **[VERIFICADO]** | **Esta regra é sobre você, não sobre o jogador:** nenhuma operação irreversível sobre a Linha de alguém sem caminho de volta testado antes. Um **Amendment Log** público numera toda mudança de regra lenta | Não infle a ética de um jogo até a escala da sobrevivência da humanidade |
| **5** | **Parfit, 1984** (problema da não-identidade) + o **horizonte de sete gerações**, princípio articulado por lideranças Haudenosaunee **[CONTESTADO quanto à formulação literal]** | Nenhuma regra pode depender de **quem** é o herdeiro. Toda regra funciona com o slot vazio, com um estranho, com um menor e com quem nunca jogou. Teste obrigatório: *"o que o sétimo Keeper herda se lançarmos isso?"* | **Nunca** use nome, símbolo ou grafismo Haudenosaunee como tema. Descreva a ideia |
| **6** | **Long Now / Stewart Brand, 1999** — *pace layers*: "o rápido aprende, o lento lembra" **[VERIFICADO]** | Três velocidades declaradas: **Bedrock** (curva, teto 1e11, regras de Passagem, formato da Crônica, **a tabela de XP por Era** — só muda por emenda), **Works** (episódios, ghosts, itens — patch normal), **Weather** (eventos, cosméticos, chat — livre, e **proibido** de tocar no tempo ou no XP do legado) | Use as ideias, não a estética nem o nome |
| **7** | **Ise Jingu / shikinen sengu** — reconstrução a cada 20 anos; 62ª em 2013, 63ª marcada para 2033 **[VERIFICADO]** | A **Renewal** é obrigatória a cada Passagem e a cada 20 anos de custódia. Na tela é cerimônia; por baixo é reemissão de credenciais, verificação de integridade, exportação do arquivo e checagem de formato | Santuário xintoísta **vivo**. Jamais usar nome, rito ou iconografia como skin |
| **8** | **Navio de Teseu** (Plutarco) **[VERIFICADO]** | O jogo **dá uma resposta explícita**: uma Linha continua sendo o mesmo legado se (i) o progresso é contínuo, (ii) a Crônica é ininterrupta, (iii) toda troca de custódia foi registrada. Isso vira um **teste automatizado** que roda antes e depois de qualquer migração | É problema aberto há 2.000 anos; o jogo escolhe uma resposta, não "prova" nada |
| **9** | **Catedrais + shinise** — Sagrada Família: obras externas da torre central concluídas em 20/02/2026, 144 anos depois do início **[VERIFICADO]**; Kongō Gumi, ~1.400 anos, **absorvida em 2006** **[VERIFICADO]** | (i) **Cada Keeper tem que terminar alguma coisa** — daí as Eras. (ii) O herdeiro **não precisa ser sangue**: daí o Commons. O nome de "zerar" vem daqui: **the Keystone**, a última pedra que quem começou jamais colocaria | **Não esconda o final da Kongō Gumi.** É a parte honesta: 1.400 anos não garantem o 1.401º |
| **10** | **Camus, 1942** ("é preciso imaginar Sísifo feliz") + a literatura de *dark pattern* sobre streaks **[VERIFICADO]** | **O jogo conta o que você fez, não os dias que você faltou.** Sem contador de sequência, sem punição por falta, sem "sentimos sua falta", e a régua é **descritiva** ("*if a Keeper plays about an hour a day…*"), nunca prescritiva | **O cuidado mais grave do plano.** Culpa familiar + aversão à perda + horizonte infinito é a combinação mais potente de chantagem que um jogo pode ter. A diferença entre legado e corrente é inteiramente de execução, texto por texto |

**Motivação, com honestidade:** não existe estudo sobre motivação em escala de séculos (procurou-se; não há). O que existe são três pernas verificadas: **o dia vale por si** (Camus + competência, Deci & Ryan), **contribuir para algo que te sobrevive** (Erikson, generatividade — mas isso é dos 40+; a criança de 12 que herda precisa que o jogo seja divertido hoje) e **pertencer a uma linha que continua** (Scheffler). A quarta perna é a trava: **autonomia**. O conceito de legado, por natureza, ataca a autonomia — e o seu "se assim quiser" é a proteção dela.

### 1.3 O que Danger Ghost é e o que não é

**É:** um jogo legado **opcional** (a camada de legado é escolha, não modo obrigatório); um jogo cujo objeto herdado é a tripla **conta + Legacy Ghost + Chronicle**, não o número; um jogo com fim declarado (1e11) e régua pública verificável; um jogo em que **ler quem veio antes é parte de jogar**.

**Não é** (e o texto público precisa dizer isso com todas as letras): obrigação familiar; instrumento jurídico; culto ancestral ou religião; promessa de que o servidor viverá até 3147; jogo idle/AFK; ativo financeiro. **E não é, hoje, um jogo legado** — hoje é um RPG que se zera num fim de semana. Ele *passa a ser* quando C1–C5 existirem e a curva respeitar C2.

### 1.4 A trava ética do "se assim quiser"

Três mecânicas concretas, e todas as três são obrigatórias:

1. **Decline the Charge** — o botão de recusar tem **o mesmo peso visual** do de aceitar. A Crônica registra apenas *"declined"*, em tom neutro; nunca "abandonou" ou "falhou".
2. **Nenhuma condição herdável** — o sistema tecnicamente não aceita cláusulas do Keeper anterior sobre o comportamento do próximo.
3. **Retire the Line** — o Keeper pode encerrar a própria linha com dignidade, e a Crônica fecha com texto honroso.

A tela de Passagem mostra, com o mesmo destaque, as duas frases: *"You may accept this."* e *"You may decline this, and nothing is lost."*

### 1.5 Vocabulário final (in-game em inglês, PT-BR para você)

O jogo é 100% em inglês, então os termos oficiais são em inglês. **Regra-mãe: nenhum termo oficial pode ser palavra sagrada, rito ou nome de povo de tradição viva.**

| In-game (EN) | PT-BR | O que é | Armadilha evitada |
|---|---|---|---|
| **Keeper** | Guardião | Quem detém a Linha agora | **Nunca "Guardian"** — no seu lore, Guardian já é o Gato e a RX. `Custodian` = *zelador*; `Warden` = carcereiro. **Um papel, dois nomes:** `Keeper` em inglês, `Guardião` em português, nunca os dois em inglês |
| **Heir** / **Successor** | Herdeiro / Sucessor | Nomeado / quem assume vindo do Commons | Assim ninguém precisa ser "herdeiro" de um estranho |
| **the Line** (*House* opcional) | a Linha / a Casa | A linhagem inteira — **a unidade do conceito** | — |
| **the Chronicle** / **an Entry** | a Crônica / uma entrada | O registro | `Ledger` puxa contabilidade e cripto |
| **the Legacy Ghost** | o ghost do legado | O ghost que é a régua | `Heirloom` já significa outra coisa em MMO |
| **the Handover** | a Passagem | O ato de entregar | **Nunca `the Passing`** = falecimento |
| **the Investiture** | a Investidura | A cerimônia de quem recebe | Evitar `Oath` — juramento cria obrigação |
| **Accept / Decline the Charge** | aceitar / recusar o encargo | Os dois botões, mesmo peso | — |
| **the Legacy Key** | **a Chave do Legado** | O segredo em papel que resgata a Linha. **Em Web2: 24 palavras geradas e reemissíveis pelo servidor** (Seção 4.4) | **Nunca "Keystone"** — ver a linha seguinte. E não use "seed": é jargão, e a seed é outro objeto, do documento da blockchain |
| **the Keystone** / **Keystone Bearer** | a Pedra Angular / quem a coloca | **Só** o fim do jogo ("zerar") | **Nunca** o nome da chave. O brief de setembro chamava a chave de "Keystone" e isso criou uma colisão real |
| **the Sealed Letter** | a Carta Selada | Carta para quem vier | Evitar `Testament`/`Will` |
| **the Vigil** | a Vigília | Os 30 dias de espera antes da Investidura | — |
| **the Renewal** | a Renovação | Ritual a cada Passagem e a cada 20 anos | `Rebuilding` seria apropriação de Ise |
| **Keeper's Signal** | Sinal do Guardião | A prova de vida aos 180 dias | — |
| **the Roll Call** | a Chamada | Leitura anual dos nomes | **Evitar `Remembrance Day`** = feriado militar real |
| **Dormant** | Dormente | 365 d sem login | **Nunca `Abandoned`** |
| **Safekeeping** | Resguardo | Linha órfã guardada pelo operador | — |
| **Retire the Line** | aposentar a linha | Encerrar por escolha | `End` soa a falha |
| **the Commons** | o Comum / linhas abertas | Linhas órfãs adotáveis | — |
| **the Closing** | o Fechamento | O protocolo de sunset digno | **Nunca "Last Rites"** = sacramento cristão vivo |
| **the OG Seal** · **an OG Line** · **the founding window** | **o Selo OG** · uma Linha OG · a **janela de fundação** | O selo das contas criadas antes de `2027-08-26T03:00:00Z` (Seção 10) | **Aposenta o "Selo de Pioneiro"** do v1. E o termo é **"OG Line", nunca "OG player"**: o Keeper nº 3 não é um dos primeiros — **a Linha é**. 🆕 **E, desde 24/09, o texto público fala em "founding window", não em "first"** — com centenas de contas ao longo de onze meses, "first" é exagero e exagero envelhece mal (10.9) |
| **Era Zero** / **the First Keepers** | Era Zero / os Primeiros Guardiões | As ~48 contas de hoje | Fundadores, não "contas legadas retroativas" |
| **Day Seal** · **Ring** · **Digit Milestone** · **Odometer** | Selo do Dia · Anel · Marco de Dígito · Odômetro | Os degraus sentidos + o número | — |
| **Movement** · **Omen** · **Vow** · **Echo** · **Mark** · **Aspect** | Movimento · Presságio · Voto · Eco · Marca · Aspecto | Vocabulário de conteúdo (Seção 3) | — |
| **Lantern Oil** · **Reforge** · **Era Pack** · **Great Work** | Óleo da Lanterna · Refundir · Pacote de Era · Grande Obra | Economia e conteúdo | — |

> **A mudança deste v2 (e ela é minha, como diretor):** três nomes ficam fechados agora, porque vocabulário indefinido é dívida que cresce — **Legacy Key** (a chave, nunca "Keystone"), **Keystone** (só o fim do jogo) e **OG Seal / OG Line** (aposentando "Selo de Pioneiro"). O resto do vocabulário continua com a mesma **pendência barata e honesta do v1: ele ainda não foi revisado por falante nativo de inglês.** Nome errado em camada lenta é caro de desfazer — isso entra na Fase 1, antes de qualquer texto de jogador.

---

## 2. A régua e a matemática — agora pelo XP

*(fontes: `raw/12_xp_inimigos_e_calibracao_por_xp.md` — que **revisa a decisão A4 do v1** —, `raw/02_calibracao.md` e as correções de `raw/10`)*

> **A frase que resume esta seção inteira:** a curva do v1 **não mudou**. O que mudou é **quem a alimenta**. Antes, o nível era uma função do relógio do servidor. Agora, o nível é uma função do **XP que o jogador ganha matando inimigos** — e o relógio do servidor passa a ser o **teto** desse XP, não a fonte do nível.

### 2.1 O que "1 hora" quer dizer, exatamente

A hora continua sendo a unidade da régua, porque é ela que define o **orçamento de XP do dia**.

> **Hora de referência:** 3.600 segundos de **tempo ativo creditado pelo servidor** a uma **Linha**.

Um segundo só é creditado quando **todas** estas condições valem:

1. existe sessão autenticada aberta, com identificador gerado pelo servidor;
2. o servidor recebeu, dentro da janela de *heartbeat* (um "sinal de vida" que o jogo manda periodicamente), **evidência de jogo de verdade** — não basta a aba estar aberta;
3. o segundo é medido pelo **relógio do servidor**, nunca pelo do cliente;
4. o segundo é atribuído ao **Legacy Ghost** daquela Linha.

**Uma Linha = um relógio.** Web e celular abertos ao mesmo tempo creditam **um** segundo por segundo de parede, nunca dois.

| Situação | Conta? |
|---|---|
| Jogando fase/dungeon, ou andando no overworld | sim |
| Ghostdex / inventário / paperdoll **com interação** | sim, até 15 min/dia |
| Cutscene rodando | sim |
| Chat sem entrada de jogo · menu parado · app minimizado | não |
| Sem entrada por mais de 120 s | não (o relógio pausa) |
| Ghost secundário | não, para a régua (conta para score, badges e itens) |

**Por que a definição precisa desse rigor:** a data de chegada é multiplicada pelo erro de medição. Se "1 hora de referência" valesse 45 minutos, a chegada iria para **841 anos**; se valesse 75 minutos, para **1.402 anos** **[CÁLCULO]**. Mudar a definição em 15 minutos move a chegada em 280 anos.

> **Duas correções de `raw/10` que continuam de pé:**
> - o crédito **não** pode depender do `visibilitychange` do navegador (o evento que avisa que a aba saiu de foco): ele nunca foi testado no WebView do app Android, e há estados (tela dividida, *picture-in-picture*, overlay) em que se comporta diferente. A fonte de verdade é **evento de jogo qualificado no servidor**, e só;
> - o "dia" tem que ser uma **janela deslizante de 24 h**, não o dia-calendário UTC. Uma sessão das 20h às 22h de Brasília atravessa a virada das 00:00 UTC e valeria **dois dias-legado** — 2 h de graça, todo dia, sem má-fé nenhuma. E a interface mostra o horário de corte **em hora local**.
>
> **Uma coisa boa que o XP trouxe de graça:** com o nível vindo do XP, o *heartbeat* não precisa mais distinguir "jogando" de "parado com a aba aberta" com precisão cirúrgica — porque **sem kill não há XP**. Um jogador parado com a aba aberta pode até acumular segundos; ele não ganha nível nenhum. Essa era a fraqueza mais difícil do desenho do v1, e ela desapareceu.

### 2.2 O censo de XP — todas as fontes, verificadas no código

Você pediu: *"faça o cálculo de quanto XP os inimigos dão"*. Aqui está, e a resposta tem uma surpresa.

**Existem exatamente DUAS fontes de XP no jogo inteiro, ambas por kill, ambas 100% no cliente** **[VERIFICADO]**:

| Fonte | Onde | Fórmula |
|---|---|---|
| **1 — `c_Boss`** (crow, demon_fly, slime, cactus, skull) | `js/game/engine.js:1105` | `XP = floor(maxHp × 5)`, com `maxHp = floor(baseHp × L^1,90 × multFase)` e **`L` = nível do jogador** |
| **2 — `EnemyBoss`** (o fantasma de captura da Ghostdex) | `js/game/engine.js:3311` | `XP = floor(maxHp × 5)`, com `maxHp = floor(100 × 10 × 1,15^fase × fatorEspécie)` — **não depende do nível** |

**E o que NÃO dá XP hoje** **[VERIFICADO]**: baú, quest (não há sistema de quest), badge (as 333 só desbloqueiam), concluir fase (dá **score**, não XP), item/afixo (não existe afixo de bônus de XP), elemento/runa (multiplicam **dano**), ghost secundário (o XP vai para o personagem ativo). **O servidor nunca concede XP** — o evento `kill_boss` dele **só retransmite** para os outros jogadores.

> **Isso é uma boa notícia grande:** a superfície é minúscula. Mudar o XP do jogo hoje é mudar **duas linhas de concessão** e uma tabela — não um sistema espalhado por 220 KB de engine. E a paridade mobile é exata: `danger_ghost_mobile/www/js/game/engine.js:1067` e `:3252` trazem as **mesmas fórmulas** **[VERIFICADO]** — qualquer mudança de XP é mudança nas duas plataformas.

**O achado que muda tudo — o multiplicador de fase** **[VERIFICADO: `engine.js:969-978`]**:

| Fase | Multiplicador de XP |
|---|---|
| `"cave1"` | **500** |
| 33 | **666** |
| 1 a 32 | `1 + (fase−1)×0,05` → 1,00 … 2,55 |
| qualquer outra | 1 |

E o multiplicador vale para **qualquer** inimigo que estiver ali: um crow comum morto na fase 33 rende **×666**. O `raw/02` do v1 tratou `baseHp` e fase como independentes e só viu o ramo suave (1,00 a 2,55) — por isso **subestimou o multiplicador em duas ordens de grandeza** (2,55 contra 666, um fator de 261×).

**XP por kill** **[CÁLCULO]**:

| Fonte (tipo · fase) | multFase | L=1 | L=100 | L=1e6 | L=1e11 |
|---|---|---|---|---|---|
| crow/demon_fly · fase 1 | 1,00 | 20 | 126.190 | 5,02e12 | 1,59e22 |
| qualquer comum · fase 32 | 2,55 | 50 | 321.785 | 1,28e13 | 4,05e22 |
| **cactus · fase 33** | **666** | **29.970** | 1,89e8 | 7,53e15 | 2,38e25 |
| **skull · CAVE1** | **500** | **82.500** | 5,21e8 | 2,07e16 | 6,55e25 |
| captura Ghostdex · fase 1 | — | 5.750 | 5.750 | 5.750 *(não cresce)* | 5.750 |

**Níveis ganhos por kill** = `0,05 × baseHp × multFase × L^0,45` **[CÁLCULO]**. O expoente **+0,45** é o coração do problema: **cada kill vale mais níveis conforme o jogador sobe** — a renda cresce mais rápido que o custo.

| Fonte | L=1 | L=100 | L=1e6 | L=1e11 |
|---|---|---|---|---|
| crow · fase 1 | 0,20 | 1,59 | 100 | 1,78e4 |
| **skull · CAVE1** | **825** | 6.550 | 4,13e5 | 7,35e7 |

**Leia a primeira célula da última linha: uma única kill de skull na CAVE1 sobe 825 níveis já no nível 1.**

**E há um agravante estrutural** **[CÁLCULO]**: o número de golpes para matar é praticamente **independente do nível** (`L^0,05`) — um crow na fase 1 custa 0,4 golpe no nível 1 e 1,42 golpe no nível 1e11. Ou seja: **a velocidade de matar não cai com o nível, mas o XP por kill cresce com `L^1,90`.** É exatamente por isso que o jogo acelera sem freio.

### 2.3 Quanto tempo o jogo de HOJE leva até 1e11

**[CÁLCULO, `raw/12` §2.4 — integração validada contra simulação kill-a-kill, erro < 0,2%]**

| Perfil | kills/h | fase | multFase | Horas ativas até 1e11 | **Anos a 1 h/dia** |
|---|---|---|---|---|---|
| Lento, fase inicial, só crow | 20 | 1 | 1,00 | 5,10e5 | **1.396,4** |
| Típico, mix de fases 1–22 | 90 | 11 | 1,50 | 7,56e4 | **206,9** |
| Rápido, clear completo | 300 | 16 | 1,75 | 1,94e4 | **53,2** |
| **Farm da fase 33** | 200 ⚠️ | 33 | **666** | 76,6 ⚠️ → **~1.900** | 0,21 ⚠️ → **~5,2** |
| **Farm da CAVE1** (skull) | 60 ⚠️ | cave1 | **500** | 41,2 ⚠️ → **~1.900** | 0,11 ⚠️ → **~5,2** |

> **Dispersão entre o mais lento e o mais rápido: o `raw/12` publicou ~12.375×; o número corrigido é ~272×** (veja o aviso abaixo). O v1 publicou 126×, e estava errado pelo motivo oposto: não tinha visto os multiplicadores.
>
> **Em português:** hoje, um jogador que descobre a fase 33 ou a CAVE1 **zera o jogo de 1.122 anos em menos de um fim de semana de jogo acumulado**, sem trapacear. Este é um achado de **calibração**, não de segurança — mas ele se soma ao achado de segurança (o cliente pode simplesmente mandar o nível pronto), e **os dois juntos significam que a régua de hoje não existe.**
>
> ⚠️ **Correção de rigor, 25/09 — leia a Seção 2.14.3 junto com esta tabela.** As duas últimas linhas **supõem** 200 e 60 kills/h, e essa suposição é fisicamente impossível: com `multFase = 666`, um crow comum na fase 33 precisa de **267 a 946 golpes** (133 a 473 s **só de tiro**) **[CÁLCULO]**, o que limita o farm a ~27 kills/h. Recalculando com o tempo-para-matar **derivado** da fórmula de HP em vez de suposto, o atalho de hoje vale **~5,2 anos (≈1.900 h), não 0,21 ano**, e a dispersão de hoje é **~272×, não 12.375×**. **A conclusão não muda em nada** — 5,2 anos contra 1.121 é o mesmo desastre —, mas o número honesto é este, e ele fica registrado aqui e em 2.14.3.

### 2.4 A curva, e o orçamento de XP

A curva do v1, inalterada:

> `L*(H) = 20·H + (1e11 − 20·T)·(H/T)³`, com `T = 409.538` horas creditadas.

Em português: o jogador ganha **20 níveis por hora garantidos desde o primeiro dia**, e por cima disso vem uma parcela que cresce com o cubo da fração do caminho já percorrido. A parte cúbica é quase nada no começo e domina no fim.

**A ponte para o XP** — e é ela que atende o seu pedido sem perder a régua:

```
L*(H)  = 20·H + (1e11 − 20·T)·(H/T)³        ← a curva (inalterada)
XP*(H) = C(L*(H))                            ← o ORÇAMENTO cumulativo de XP
Orçamento do dia = XP*(hoje) − XP*(ontem)    ← janela deslizante de 24 h, por Linha
Nível do jogador = C⁻¹(XP acumulado)         ← o nível SEMPRE vem do XP
```

`C(L)` é a soma acumulada da escada de XP (`XPRequired(L) = 100·L^1,45`) e `C⁻¹` é a busca binária. **As duas funções já existem em produção** (`cumulativeXpToLevel` e `levelFromCumulativeXp`, `rpg_system.js:501-526`) **[VERIFICADO]**. Não é código novo: é o mesmo código, alimentado por um XP que o servidor controla.

**O que foi provado, não afirmado** **[CÁLCULO — reconferido pela terceira vez ao escrever este documento]**:

| Propriedade | Resultado |
|---|---|
| Fecha em 1e11 no tempo `T`? | **Sim, exato**: `C⁻¹(XP*(T)) = 100.000.000.000` |
| O orçamento diário é sempre positivo (nunca "desce")? | **Sim**, nos 409.538 passos inteiros. Menor orçamento diário = **≈59.000 XP**, na hora 1 |
| `C⁻¹(C(L)) = L` em toda a faixa? | **Sim**: desvio **0 nível** em 24 pontos log-espaçados e nas bordas 1, 2, 1024, 1025, 1e11−1, 1e11 |
| Somar 409.538 parcelas diárias em float64 acumula erro? | **Erro relativo 0; erro em níveis: 0** |
| Monotonicidade da curva | **Sim**, por força bruta nos 409.539 passos. A menor taxa é 20 níveis/hora, no instante zero, e nunca cai |

**A tabela mestra** **[CÁLCULO]**:

| Marco | Horas creditadas | Nível `L*(H)` | **XP acumulado permitido** | XP do dia (1 h) |
|---|---|---|---|---|
| Dia 1 | 1 | **20** | 5,90e4 | **≈59.000** |
| 1 semana | 7 | 140 | 7,33e6 | 2,31e6 |
| 1 mês | 30 | 600 | 2,61e8 | 2,08e7 |
| **1 ano** | 365 | **7.371** | 1,22e11 | 8,09e8 |
| 10 anos | 3.652 | 1,44e5 | 1,77e14 | 2,35e11 |
| 100 anos | 36.524 | 7,17e7 | 7,18e20 | 1,44e17 |
| 500 anos | 182.621 | 8,87e9 | 9,62e25 | 3,87e21 |
| 1.000 anos | 365.243 | 7,09e10 | 1,57e28 | 3,16e23 |
| **3147** | **409.538** | **1e11 exato** | **3,64e28** | 6,53e23 |

*(Nota de precisão, no padrão de rigor deste projeto: minha recomputação pela forma fechada dá **59.044 XP** no dia 1; o `raw/12` publicou **59.054**. A diferença de 10 XP vem da convenção de arredondamento — `floor` por degrau contra forma fechada — e não muda nada. Cito "≈59.000" no texto e registro as duas.)*

**O orçamento diário cresce 1,1e19× do primeiro ao último dia.** É por isso que a tabela de XP por inimigo **tem que ser por Era**, e não um número fixo.

**A leitura dura, que o relatório original suavizou:** na **década 50** — depois de 500 anos e de umas 15 gerações de Keepers — o contador está em **8,9% do caminho**. Mais de 91% do número acontece depois disso. **Isso é consequência matemática de qualquer curva que faça o dia 1 ser humano**, não um defeito desta. Mas significa que o plano precisa de uma resposta narrativa pronta para *"eu e meus netos somos 0,0x% do total"* — e essa resposta são as **Eras** (Seção 3), não o número.

### 2.5 O que muda no XP dos inimigos, concretamente

**Antes (hoje):** `XP = floor(maxHp × 5)`, com `maxHp` derivado do **nível do jogador** e da **fase**. O cliente calcula, o cliente concede.

**Depois:** `XP = tabelaDoServidor[Era][tipoDeInimigo] × modificadores limitados`, concedida pelo servidor, com o total do dia cortado pelo orçamento.

Três mudanças de princípio:

1. **O XP por kill deixa de ser função do nível do jogador.** Isso mata o expoente `+0,45` — a renda crescendo mais rápido que o custo, que é a causa matemática do descontrole. O XP por kill passa a ser função da **Era** (tempo creditado) e do **tipo de inimigo**.
2. **O multiplicador de fase sai da conta de XP.** `multFase` continua existindo para **HP e dificuldade** (a fase 33 e a CAVE1 continuam sendo os lugares mais difíceis do jogo), mas **não multiplica mais o XP** — senão os 666× voltam. O prestígio da fase 33 passa a ser expresso em **loot, badge e relíquia**, não em XP. 🆕 **Este item deixou de ser recomendação minha e passou a ser a sua decisão de 25/09** — você chegou nele por outro caminho, e a Seção **2.14** mede o efeito com números.
3. **O servidor concede.** O cliente pode mostrar uma previsão ("+3,4e9 XP"), mas o número que conta é o que o servidor credita.

**A tabela final — XP por kill, por Era e por tipo** **[CÁLCULO, `raw/12` §3.3]**. Pesos relativos fixos (a "identidade" de cada inimigo, igual em todas as Eras): comum **1**, elite **4**, chefe de fase **12**, chefe de Era **60**, captura da Ghostdex **8**. Alvo de desenho: **90 kills/hora saturam o orçamento**.

| Era (horas creditadas) | Comum | Elite (cactus) | Chefe de fase | Chefe de Era | Captura Ghostdex |
|---|---|---|---|---|---|
| **I** The Wake (0–33) | 6,53e3 | 2,61e4 | 7,83e4 | 3,92e5 | 5,22e4 ⚠️ |
| **II** The First Ring (33–365) | 2,39e5 | 9,57e5 | 2,87e6 | 1,44e7 | 1,91e6 |
| **III** Apprentice Years (365–1.825) | 4,63e6 | 1,85e7 | 5,55e7 | 2,78e8 | 3,70e7 |
| **IV** Founder's Age (1.825–9.125) | 3,41e9 | 1,36e10 | 4,09e10 | 2,04e11 | 2,73e10 |
| **V** The Inheritors (9.125–27.375) | 3,15e12 | 1,26e13 | 3,78e13 | 1,89e14 | 2,52e13 |
| **VI** Cartographers (27.375–63.899) | 7,69e14 | 3,08e15 | 9,23e15 | 4,62e16 | 6,16e15 |
| **VII** Deep Archive (63.899–136.899) | 1,03e17 | 4,13e17 | 1,24e18 | 6,20e18 | 8,26e17 |
| **VIII** Quiet Centuries (136.899–246.399) | 5,12e18 | 2,05e19 | 6,14e19 | 3,07e20 | 4,10e19 |
| **IX** The Great Work (246.399–365.243) | 8,15e19 | 3,26e20 | 9,78e20 | 4,89e21 | 6,52e20 |
| **X** Keystone Stretch (365.243–409.538) | 3,05e20 | 1,22e21 | 3,66e21 | 1,83e22 | 2,44e21 |

Dentro de uma Era, o XP por kill **interpola** suavemente entre o valor de início e o de fim — senão o jogador sente um degrau no dia da virada.

> ⚠️ **A coluna "Captura Ghostdex" desta tabela está SUPERADA pela sua decisão de 25/09.** Ela foi calculada com peso **8**; passa a ser **peso 1** (igual ao comum), ou seja, **os valores da coluna "Comum"**. Toda a tabela renormaliza sem mudar o orçamento diário — só muda como ele se divide entre os tipos. Ver 2.14.8-B.

**Duas coisas que isso resolve de graça:**

- **O abismo de 666×/500× entre fases desaparece.** O cactus continua valendo 4× um comum, e isso é **identidade**, não atalho. *(O `baseHp` do código daria 2,25× em vez de 4× — a divergência é escolha de design, não de matemática, e está registrada em 2.14.5.)*
- **A Ghostdex volta a participar da progressão.** Hoje a captura de fantasma dá XP **constante em L** e vira irrelevante já no nível ~100 — um dos sistemas mais bonitos do jogo está **fora da progressão** depois da primeira hora. ✅ **Resolvido pela sua decisão de 25/09, e de um jeito mais simples do que o peso 8 que eu havia proposto aqui:** a captura passa a valer **o mesmo que um inimigo comum (peso 1)**, e portanto cresce com `L^1,90` — de 5.750 XP congelados para **1,59e22** no fim do jogo. **O peso 8 desta tabela está superado; renormalizar para 1 na implementação** (Seção 2.14.8-B).

**E o esforço do jogador não muda ao longo dos séculos** **[CÁLCULO]**:

| Era | Nível no fim | XP/hora (orçamento) | Kills/h para 95% | Kills/h para 100% |
|---|---|---|---|---|
| I | 660 | 9,99e6 | 40 | ~144 |
| V | 3,04e7 | 4,82e15 | 40 | ~144 |
| X | **1e11** | 4,67e23 | 40 | ~144 |

**O número de kills é o mesmo em todas as Eras — de propósito.** O que muda é quanto cada kill vale. Para o jogador, a hora do dia 1 e a hora do ano 1.000 têm **o mesmo ritmo**: ~40 a 90 inimigos, quatro Movimentos de 15 minutos, o Selo do Dia no fim. **É o número que cresce, não o esforço.**

### 2.6 O rendimento decrescente dentro do dia — e por que ele é o coração do desenho

Aqui está o ponto mais delicado. Se o XP por kill fosse um valor fixo por Era e o teto fosse um corte seco, quem faz 40 kills/h ganharia **metade** do que ganha quem faz 80 — e a dispersão voltaria, menor mas viva. A correção é uma **curva de saturação**:

```
XP concedido depois de n kills no dia = B × (1 − e^(−n / n₀))
```

`B` é o orçamento do dia; `n₀ = 13,35` é calibrado para o jogador **lento** já chegar perto do teto **[CÁLCULO, reconferido]**:

| Kills no dia | Fração do orçamento recebida |
|---|---|
| 5 | 31,2% |
| 10 | 52,7% |
| 20 | 77,7% |
| **40 (lento)** | **95,0%** |
| **90 (mediano)** | **99,9%** |
| 144 (rápido/AoE) | 100,0% |
| 400 | 100,0% |
| **5.000 (bot)** | **100,0%** |

> **O número que importa: a dispersão de 250× em kills (20 contra 5.000) vira 1,29× em XP.** Os ~272× de hoje (Seções 2.3 e 2.14.3) colapsam para menos de 30% de diferença.
>
> **Em português:** quem joga devagar chega **1,29 vez depois**, não 250 vezes antes. E o XP dos inimigos continua sendo, para o jogador, **a coisa que faz o nível subir** — ele mata, vê o XP entrar, sobe de nível. O teto só aparece quando ele passa muito do ritmo normal, e aparece como **rendimento decrescente**, não como uma porta batendo na cara.

**Quatro casos que isso resolve sem regra especial:**

- **Multi-kill / AoE / dano elemental:** eles aumentam `n`, e `n` está na curva. Um AoE que **triplica** as kills leva o jogador de 99,88% para 100,00% do orçamento — ganho real de **0,12%**. O AoE continua valendo pela **velocidade** (termina a hora em menos tempo real) e pelo loot. **Isso é um recurso, não uma limitação:** o design pode balancear magia e AoE pela diversão, sem medo de furar a régua.
- **Bônus de XP em item** (que **hoje não existe** — nenhum afixo dá XP **[VERIFICADO: `rpg_system.js:117-129`]**): sem orçamento diário, 7 peças com +25% dividiriam a data de chegada por **4,77** (de 1.122 para 235 anos). **Com** o orçamento, um bônus de +100% rende **0,12% a mais**. **Regra recomendada:** bônus de XP é permitido só como *"chegar ao teto do dia mais rápido"* (reduz o `n₀` efetivo), **nunca** como *"aumentar o teto do dia"*. Assim o item beneficia exatamente quem tem pouco tempo — o jogador que este conceito quer proteger.
- **Inimigos de história × inimigos de farm:** os chefes das fases, o chefe de Era e a captura da Ghostdex dão XP **por primeira vez**, fora da curva saturante, creditado inteiro. A **repetição** cai para o valor de farm (ex.: 10% do valor da primeira vez). Rejogar a fase 33 continua divertido e dá loot — só não é mais um atalho de duas ordens de grandeza (**~215× a régua**, Seção 2.14.3). 🆕 **E com o XP flat aprovado (A15), este item passa a ser o que mantém o chefe final valendo a pena**: a primeira vitória é paga inteira, fora da curva de saturação — ver 2.14.4.
- **A regra de ferro, que vem do v1 e fica mais forte aqui:** o teto do dia **nunca** é multiplicável por item, evento, badge ou ritual. *Eventos dão memória, nunca poder.*

### 2.7 Os três desenhos possíveis, e por que recomendo o C

| | Desenho | Como o nível nasce |
|---|---|---|
| **A** | Plano v1 (decisão A4 original) | `nível = L*(segundos creditados)`. O XP é cosmético |
| **B** | **O que você pediu** | `nível = C⁻¹(XP acumulado)`, com tabela por Era **do servidor** e orçamento diário |
| **C** | **Híbrido (minha recomendação)** | Igual ao B, **mais um piso**: se a Linha creditou a hora do dia **e** fez ao menos 10 kills, mas ganhou menos que **80% do orçamento**, o servidor **completa** até o piso |

| Ameaça / situação | **A** (tempo) | **B** (XP) | **C** (híbrido) |
|---|---|---|---|
| Cliente adulterado manda nível/XP alto | imune | imune **se** o servidor conceder o XP | imune |
| Bot rodando 24 h | ganha o mesmo que 1 h de humano | ganha o mesmo | ganha o mesmo |
| **Bot que só fica parado (AFK, sem matar nada)** | **ganha tudo** se o heartbeat aceitar — **a fraqueza do A** | **ganha zero** | ganha zero (o piso exige ≥10 kills) |
| Dispersão entre lento e rápido | zero | 1,29× | **1,00×** acima do piso |
| Jogador que cumpre a hora mas **joga mal** | chega junto | chega 1,29× depois | **chega junto** |
| Exploit futuro que conceda XP infinito | não afeta a régua | **o orçamento é o teto absoluto** | idem |
| Criança / iniciante / herdeiro que nunca jogou | protegido | penalizado nos primeiros meses | **protegido** |
| **O seu pedido ("nível sempre pelo XP")** | **não atende** | atende | **atende** |
| Defesa jurídica (Seção 7) | **a pior das três** | boa | boa |
| Esforço de implementação | menor | maior | maior |

**Recomendo o C**, com o piso em **80% do orçamento da Era** **[HIPÓTESE — o número exato sai do harness da Fase 1]**, por quatro razões:

1. **Atende o seu pedido literalmente.** O nível vem do XP, e o XP vem dos inimigos. O jogador vê a barra encher matando coisa.
2. **É mais forte que o A contra o AFK**, que era a ameaça mais difícil do v1.
3. **Preserva a régua com folga:** 1.121,3 anos para todos os arquétipos, do bot à família em turnos.
4. **O piso paga a única fraqueza real do B** (punir quem joga devagar) sem reabrir a porta do AFK — porque o piso **só existe se houver hora creditada E ao menos 10 kills**.

> **A honestidade que eu te devo:** o C é o **mais caro de construir** dos três. Ele exige **spawn autoritativo no servidor**, que hoje não existe (hoje `SpawnBossAtRandomLocation` roda no navegador). Se o orçamento de trabalho não couber, **o caminho de recuo é começar pelo A e migrar para o C depois** — e essa migração é **exata por construção**, porque `L*(H)` e `C⁻¹(XP*(H))` **são a mesma curva**. Ou seja: **dá para trocar a fonte da verdade sem mexer em um único nível de ninguém.** Essa compatibilidade é deliberada e é a melhor propriedade do desenho.
>
> **Mas repare numa coisa antes de escolher o recuo:** o desenho A é justamente o que a Seção 7.1 mostra ser **juridicamente pior**. Se o recuo for necessário, ele tem um custo que não é só técnico.

### 2.8 O que o servidor precisa saber para validar um kill — sem reescrever o combate

Este é o item que decide se a proposta é implementável por um dev solo. **Não é preciso simular o combate no servidor.** Basta um **"recibo de kill"**:

| Campo | Para quê |
|---|---|
| `sessionId` + `beatSeq` | idempotência: reenvio não credita duas vezes |
| **`spawnId`** (gerado pelo **servidor** quando o inimigo nasce) | um kill sem spawn correspondente é **rejeitado**; um `spawnId` já usado é **rejeitado** |
| `enemyType`, `phase` | escolhe a linha da tabela de XP |
| `spawnTs` (relógio do servidor) | `tempoDeLuta = agora − spawnTs` |
| tempo mínimo plausível de luta (por tipo e Era) | derivado de `golpes × cadência de tiro`. Matar antes disso é **fisicamente impossível** → rejeita e registra |
| contador de kills da janela de 24 h | aplica a curva saturante e o orçamento |

O servidor passa a ser o dono de **três números**: quantos inimigos nasceram, quantos morreram, e quanto XP isso vale. **Dano, colisão, física e loot continuam no cliente, exatamente como hoje.**

**A tabela de exploits, quantificada** **[CÁLCULO]**:

| Exploit | Hoje | Sob este desenho |
|---|---|---|
| Farm em loop da fase 33 | zera em **~1.900 h ≈ 5,2 anos** (Seção 2.3) | teto do dia 1 = ≈59.000 XP. Ganho além do teto: **zero** — e, com o XP flat (A15), ali passa a render **7,9% a 23%** do XP/hora da fase 1 |
| Farm da CAVE1 (skull) | zera em ~1.900 h | idem — ✅ **a CAVE1 entrou na regra em 25/09**: passa a render **10% a 29%** do XP/hora da fase 1 |
| Farm de captura de ghost em fase alta | 87,6× o XP da fase 1 (escada `1,15^fase`) | ✅ **fechado em 25/09**: a captura passa a valer o mesmo que um inimigo comum, em qualquer fase |
| Morrer/renascer para respawnar chefe | ganho ilimitado | o `spawnId` só credita **uma vez** |
| Vários jogadores no mesmo inimigo | cada um ganha o XP cheio | creditado por `spawnId`, uma vez por Linha |
| Multi-aba, web + celular | XP dobrado | orçamento **por Linha**, janela de 24 h |
| Cliente adulterado mandando XP alto | **passa** (teto de validação 1e19) | o servidor não aceita XP do cliente |
| Relógio do cliente adulterado | irrelevante hoje | só vale o relógio do servidor |

> **Custo honesto:** o spawn autoritativo é **a maior peça de trabalho deste plano** e o item mais subestimado do v2. A boa notícia é que é **a mesma peça** que o *heartbeat* de tempo já exigia — dá para construir as duas juntas, e é por isso que a Fase 2 passa a ser "tempo **e** XP autoritativos em sombra".

### 2.9 Sensibilidade: o que acontece quando a vida acontece

**[CÁLCULO]** Porcentagem de dias jogados × ano de chegada:

| Dias jogados | Dias corridos necessários | Chegada |
|---|---|---|
| 100% | 409.538 | **3147** |
| **95%** | 431.093 | **3207** |
| 90% | 455.042 | 3272 (sem repor) · **3234** (repondo pelo Banco de Vigília) |
| 80% | 511.923 | 3428 |

> **Este é o número mais importante do plano inteiro para uma conversa honesta:** *faltar um dia a cada vinte custa 60 anos. Faltar um a cada dez custa 125.*
>
> A promessa pública **não pode ser "1 hora todo santo dia"** — nenhum ser humano faz isso por décadas. Ela tem que ser **"cerca de 365 horas por ano, quando der"**, com uma margem de presença `m ≈ 0,90` embutida na calibração.

**O Banco de Vigília** é o mecanismo do teto com memória: enche 1 hora por dia (até um acúmulo de ~30 h **[HIPÓTESE — parâmetro fixado no harness]**) e é gasto a 1×. Com `τ = 0`, quem faltou ontem **pode repor hoje**, mas a hora extra acima do banco **não rende nada**.

**A trava de calendário, corrigida:** o contador **nunca trava**. O que tem portão de calendário é a **Keystone** — o evento de colocar a última pedra. Ninguém a coloca antes de **3147-01-01**. Se o contador travasse em 1e11 antes disso, um jogador impecável chegaria em ~3035 e **quatro a cinco gerações inteiras de Keepers** receberiam uma conta congelada no máximo — o pior resultado possível para um conceito cujo ponto é "a sua hora conta".

E o texto público passa a ser: ***"3147 é a data de quem começa agora. A sua Linha tem a sua própria estrada."*** Uma Linha fundada em 2100 chega ao 1e11 por volta de 3221, e isso é correto e honesto.

> **Efeito colateral valioso:** a trava da Keystone é **a melhor defesa que o plano tem contra um bug futuro que conceda 1e11 de graça**. Com ela, nenhum exploit *termina* o jogo — no máximo adianta um contador, que depois é corrigido por errata. Recomendo declará-la **invariante de segurança**, não só de calibração.

### 2.10 Precisão numérica e limites técnicos — e uma armadilha nova

O JavaScript representa inteiros com exatidão só até **9.007.199.254.740.991** (≈9,007e15); acima disso ele **arredonda em silêncio**.

| Grandeza | Valor em L = 1e11 | Cabe em float64 exato? | Teto de validação hoje | Veredito |
|---|---|---|---|---|
| `level` | 1e11 | **sim** | `[1, 1e11]` | **no fio da navalha** |
| segundos creditados | 1,47e9 | **sim, com folga** | `time: [0, 1e8]` = 3,17 anos | **estoura em décadas** |
| `score` acumulado | ~4,2e18 | não | `[0, 1e16]` | **estoura** |
| `xpRequired` (o degrau) | 8,91e17 | não (é exibição) | `[0, 1e19]` | cabe |
| **XP acumulado** | **3,64e28** | **não** | **`xp: [0, 1e19]`** | 🔴 **ESTOURA — ver abaixo** |
| pontos de atributo | 5e11 | sim | — | ok |

> ### 🔴 A armadilha nova deste v2, e ela é da classe de bug que este projeto já pagou caro uma vez
>
> Se o desenho gravar o **XP acumulado** (3,64e28), ele passa do teto `xp: [0, 1e19]`. **E o modo de falha não é um erro visível:** `sanitizeCharacterPayload` **apaga o campo** do pacote, e o `COALESCE` de `saveCharacters` **preserva o valor antigo do banco** **[VERIFICADO: `server/db.js:468`, `:425-429`]**. O jogador continua jogando, o XP para de subir, e **nada aparece na tela**.
>
> **Duas saídas, e recomendo a primeira:**
> 1. **Não gravar o acumulado.** Guardar `(nível, XP residual)` como hoje — os dois cabem — e derivar o acumulado por `C(nível) + residual` quando precisar. **Custo: zero migração.** É o esquema que já está em produção.
> 2. Gravar em `NUMERIC` do Postgres com o teto subido para ~1e29, lido como **string decimal** ou **BigInt** no Node, **nunca** como `Number`. Atenção: `server/db.js` registra `types.setTypeParser(20, Number)`, que devolve BIGINT como `Number` do JS — uma coluna que passe de 2^53 precisa de parser próprio.

**A forma fechada de hoje aguenta 3,64e28?** **SIM** **[CÁLCULO]**. O erro de 1 ULP (a menor diferença representável) em 3,64e28 vale 8,08e12 XP; um nível no topo vale 8,91e17 XP. O erro é **9,1e-6 de um nível** — ou seja, **nunca** custa um nível. **A matemática do `addXp` atual não precisa ser reescrita.** O que muda é **quem** chama e **com que número** — e os tetos de validação do servidor.

**Mais três achados que continuam de pé** (todos de `raw/10`):

1. **`level: [1, 1e11]` é um teto exclusivo de fato.** O 1e11 exato passa — mas qualquer cálculo que produza `1e11 + 1` (arredondamento, bônus de cerimônia, um `Math.ceil` mal colocado no último dia) é rejeitado em silêncio e **congela o jogador em 99,999…% no dia mais importante do conceito inteiro**. **Regra:** o teto de *validação* tem que ser **maior** que o teto de *jogo* (ex.: 1,01e11); a trava do 1e11 vive na lógica, que erra alto e corrige, nunca na validação, que erra apagando.
2. **Três colunas antigas ainda são `INTEGER`** (`total_kills`, `total_items_collected`, `total_lives_collected`) e o modo de falha delas é o **oposto**: por serem somadas no servidor, elas não passam pela validação — quando passarem de 2.147.483.647, o Postgres **quebra com erro**. A 60 kills/h e 1 h/dia isso leva 98.000 anos; a 120 kills/h e 16 h/dia, **3.065 anos** **[CÁLCULO]**. **Não é bloqueante; é dívida declarada** — e agora ela é mais relevante, porque o contador de kills passa a ser um dado de progressão, não um enfeite.
3. **`level` já é BIGINT em produção.** A migração `migrate_level_bigint.js` **foi executada e verificada por checksum** (48 players, 139 characters) **[VERIFICADO]**. O que sobrou foram **quatro comentários desatualizados em `server/db.js`** (linhas ~57-63, 68-70, 136-139, 442-444) dizendo o contrário — e **três agentes independentes leram esses comentários como fato e propagaram um bloqueante falso para o plano inteiro**. Custa ~10 linhas corrigir, e enquanto não for corrigido **todo agente futuro vai reencontrar o mesmo erro**.

**Outros limites, resolvidos:** o **ano 2038** não afeta o `Date` do JavaScript nem o `timestamptz` do Postgres, e não há nenhuma coluna inteira de 4 bytes usada como data **[VERIFICADO]**. O **ano 10000** quebra a serialização ISO de datas (longe, mas registrado). **Segundo intercalar** é irrelevante, e a razão é boa: o plano guarda **contadores**, não datas civis.

### 2.11 O que a simulação provou e o que reprovou

O harness (banco de testes automatizado) de Monte Carlo do `raw/02` tinha **10 critérios de aceite**; o `raw/10` acrescentou o 11º; **este v2 acrescenta o 12º e o 13º**.

**Provado:** a fórmula fecha em 1e11 exato e é monotônica nos 409.539 passos; "95% dos dias ⇒ 3207" confere; preservar o nível dos 139 personagens atuais custaria no máximo **0,74%** do horizonte; e agora também: o round-trip `C⁻¹(C(L)) = L` não erra nenhum nível, e a curva de saturação comprime 250× de dispersão de ritmo para 1,29×.

**Reprovado — e isso importa:** **os critérios 1 e 2 REPROVAM na calibração sem margem** (com `m = 1,00`, a mediana de chegada foi 3234 e **0%** dos casos chegaram em 3147) **[VERIFICADO em `raw/02` §9.3]**. É exatamente por isso que a promessa precisa da margem de presença `m ≈ 0,90`. **O harness passando 13/13 é portão obrigatório da Fase 1** — se nenhuma calibração humanamente possível passar, o plano não avança e a promessa é reformulada.

| # | Critério | De onde vem |
|---|---|---|
| 1–10 | os originais da calibração | `raw/02` |
| **11** | **toda nova versão de curva é recalibrada para o que FALTA** (`T_restante = T − horas creditadas`, `teto_restante = 1e11 − nível ganho`), testado trocando a curva nos anos 10, 100, 500 e 1000 | `raw/10` R-09 — o mecanismo original **destruía a garantia que vendia**, porque a soma dos ganhos das duas curvas não fechava mais em 1e11 |
| **12 — novo** | **a tabela de XP por Era interpola sem degrau**: no dia da virada de Era, o XP por kill não pode saltar mais que X% (X a fixar no harness) | este v2 |
| **13 — novo** | **o piso do Desenho C nunca paga sem kill**: uma Linha com 0 kills e 1 h creditada recebe **zero**; com 10 kills recebe o piso; e o piso nunca ultrapassa o orçamento do dia | este v2 |

### 2.12 A tabela por arquétipo — e por que ela mede Linhas, não pessoas

**[CÁLCULO, `raw/12` §3.4]** — orçamento por **Linha**, janela deslizante de 24 h, `τ = 0`:

| Arquétipo | kills/h | Fração do orçamento do dia | **Anos até 1e11** |
|---|---|---|---|
| **A régua (1 h/dia, ritmo mediano)** | 90 | 99,9% | **1.121,5** |
| 1 h/dia, jogador lento | 40 | 95,0% | **1.129,1** |
| 1 h/dia, rápido/AoE | 250 | 100,0% | 1.121,3 |
| 4 h/dia (teto `τ=0`) | 250 | 100,0% | 1.121,3 |
| 16 h/dia | 600 | 100,0% | 1.121,3 |
| **Bot 24 h/dia** | 5.000 | 100,0% | **1.121,3** |
| **Família revezando 3×8 h (mesma Linha)** | 600 | 100,0% | **1.121,3** |
| 95% dos dias, ritmo mediano | 90 | 99,9% | 1.180,5 |

**Razão entre o mais dedicado e o mais devagar: 1,007×.**

**A correção conceitual mais importante do plano, e ela ficou mais necessária neste v2:** o conceito **não é atacado por um bot solitário** — é atacado por **uma Linha que automatiza** ou por **uma família revezando em turnos** (pai 8 h, mãe 8 h, filho 8 h, na mesma conta). E note: **o revezamento familiar é exatamente o caso de uso que você descreveu no pedido.** Com o XP vindo de kills, três pessoas em turnos fariam **3× as kills** — então **é o orçamento por Linha que neutraliza isso**. Sem ele, o desenho pelo XP **reabriria exatamente o furo que a decisão A5 fechou**.

Por isso: **a régua é da Linha, não da pessoa.** O teto é da Linha, os Termos dizem isso, e a tabela de arquétipos é medida nessa unidade. É a única versão implementável — a alternativa exigiria distinguir uma família de uma fazenda de bots, o que é impossível.

### 2.13 O que muda nas decisões do v1

| Decisão v1 | Texto original | **Status neste v2** |
|---|---|---|
| **A1** — Formato da curva | Suave, `L*(H) = 20H + (1e11−20T)(H/T)³`, Eras ancoradas em tempo | **INALTERADA.** A curva é a mesma; ela só passa a ser expressa como *orçamento de XP* `C(L*(H))`. Nenhum marco muda |
| **A3** — Quanto rende a hora extra (`τ`) | `τ = 0` no lançamento | **INALTERADA, e reforçada.** O `τ` agora se aplica ao **orçamento de XP** do dia. A tabela 2.12 mostra bot, 16 h/dia e família em turnos todos em 1.121,3 anos |
| **A4** — Nível pelo XP ou pelo tempo | "Do **tempo** medido no servidor" | 🔄 **REVISADA.** Passa a ser: *"do **XP**, com o XP concedido pelo servidor dentro de um orçamento diário derivado do tempo creditado"*. O tempo continua sendo a régua — mas vira o **teto** do XP, não a fonte do nível |
| **A5** — A régua é da pessoa ou da Linha | Da **Linha** | **INALTERADA, e agora obrigatória** (2.12) |
| **A6** — Regra de hash | RFC 8785 + prefixo de versão, para a Crônica | **INALTERADA para a Crônica**, e **estendida**: a raiz do selo OG usa a regra `DGOG1` do `chain/24` (Seção 10.4). São duas árvores com regras declaradas, não duas regras para a mesma árvore |

**E duas decisões novas, que só existem porque o nível passou a vir do XP:**

- **A12 — o parâmetro `n₀` da curva de saturação** (quanto o ritmo de kills importa). Recomendo **`n₀ = 13,35`**, calibrado para o jogador lento (40 kills/h) já pegar 95%. **Tem que ser constante configurável no servidor**, e toda recalibração vale **daqui para frente**, nunca retroativamente (critério 11).
- **A13 — o piso do Desenho C.** Recomendo **80% do orçamento da Era, condicionado a ≥10 kills no dia**.
- ✅ **A15 — a extensão da regra de XP flat** (a CAVE1 entra? a captura de ghost passa a valer o mesmo que um inimigo?). **Você respondeu SIM às duas em 25/09**, e com isso **não sobra atalho nenhum** no jogo. Ver **2.14.8**.
- 🆕 **A15-b — o princípio vincula os Episódios futuros?** Recomendo **sim**: o XP codifica *quando* (Era) e *o quê* (tipo), nunca *onde*. Ver **2.14.7**.

> **Uma fragilidade declarada:** `n₀ = 13,35` é calibrado contra um ritmo de kills que **ninguém mediu**. Os limitadores estruturais são verificados (358 diamantes azuis no jogo inteiro, teto de **5 inimigos vivos**, 240 s por fase, tiro a cada ~0,5 s **[VERIFICADO]**), mas o ritmo humano real não foi cronometrado — porque medir exige entrar em gameplay, e gameplay exige login, e o login bate no banco de **produção**, que o modo PLANO proíbe. **É um pedido formal seu:** uma **conta descartável num banco de teste** para cronometrar kills por minuto nas fases 1, 11, 22 e 33. Sem isso, `n₀` é uma estimativa razoável, não um número medido.

### 2.14 🆕 XP flat no Episódio 1 — a sua decisão de 25/09

*(Script: `13_xp_flat_ep1.js` e `13b_ancoras.js`, no scratchpad da sessão. Toda tabela desta subseção é **[CÁLCULO]** desses dois scripts, salvo onde marcado.)*

**A sua frase, verbatim:** *"Os inimigos devem dar o mesmo XP que dá na fase 1 em todas as 33 fases do episódio 1."*

**O veredito, antes das contas:** está certa, e é a **mudança isolada de maior impacto** deste plano inteiro. Ela ataca a raiz do problema da Seção 0.3 pelo lado certo. Duas ressalvas apareceram na medição — ela **não** faz o trabalho do teto diário, e a frase original deixava de fora a **CAVE1** e a escada própria da **captura de ghost**. ✅ **Você fechou as duas pontas no mesmo dia** (`00_BRIEF.md` §10): **2.14.8** mostra que, fechadas, **não sobra atalho nenhum**.

#### 2.14.1 Primeiro: o que "a mesma coisa em todas as fases" significa no código de hoje

O Episódio 1 tem **33 fases numeradas + a CAVE1**, que é uma área secreta destrancada pela *Blue Key* escondida na fase 6 **[VERIFICADO: `engine.js:762-764`, `:1779`, `:1875`]**. Ela **não é uma das 33** — e é por isso que a sua primeira frase, lida ao pé da letra, não a cobria. ✅ **Em 25/09 você a incluiu explicitamente** (`00_BRIEF.md` §10), e esta subseção já está escrita com ela dentro. Ver **2.14.8** para o efeito final.

E o elenco de inimigos é bem mais simples do que parece — isto é **boa notícia**, porque torna a sua regra trivial de escrever **[VERIFICADO: `engine.js:996`, `:728-743`]**:

| Tipo | `baseHp` | Onde aparece | Tem "equivalente na fase 1"? |
|---|---|---|---|
| crow | 4 | chefe das fases 4, 16, 20 **e** spawn por diamante em **qualquer** fase | **sim** — é literalmente o mesmo inimigo |
| demon_fly | 4 | chefe das fases 5, 10, 17, 21 **e** spawn por diamante | **sim** |
| slime | 4 | chefe das fases 6, 11, 18, 22 **e** spawn a cada 3.000 de score | **sim** |
| cactus | 9 | **só** o chefe da fase 33 | **não** — nunca nasce na fase 1 |
| skull | 33 | **só** o chefe da CAVE1 | **não** |
| **fantasma de captura** (`EnemyBoss`) | — *escada própria:* `100 × 10 × 1,15^fase × fatorEspécie` | spawn por diamante/score em **qualquer** fase; é o inimigo que, ao morrer, entra na Ghostdex | **sim** — e você mandou igualá-lo ao inimigo comum (25/09) |

> **Ou seja: o jogo não tem 33 elencos, tem UM elenco de três monstros comuns reusados nas 33 fases**, mais dois exclusivos. A única coisa que muda de fase para fase é o multiplicador `multFase`, que multiplica o **HP** — e hoje, por acidente de fórmula, também o XP. **Sua regra é, no código, "usar `multFase = 1` na conta do XP e só nela".** Para os três comuns isso é exato: o "equivalente na fase 1" é o próprio monstro. Para o cactus e o skull não existe versão de fase 1, então o valor-âncora tem que ser **o `baseHp` deles com `multFase = 1`**, o que dá, de graça, uma hierarquia limpa: **comum = 1×, cactus = 2,25×, skull = 8,25×** **[CÁLCULO]** — identidade de inimigo, não prêmio por localização.

**Duas verificações no código que mudam a conversa**, e nenhum relatório anterior tinha feito:

1. **O dano que o inimigo faz no jogador NÃO escala com a fase.** Todo chamador de `takeDamage()` passa `amount = 1` — um ponto de Vitalidade — em contato, projétil, fogo e água **[VERIFICADO: `engine.js:1328-1336`]**. Logo, **"fase mais difícil" hoje significa exatamente uma coisa: o inimigo tem mais HP, então demora mais para morrer.** Não é mais perigoso; é mais demorado. Isso simplifica enormemente a pergunta "precisa de compensação?".
2. **O cronômetro de 240 s por fase não limita nada.** `G_PLAY` reatribui `g_timeRemaining = 240` **em todo frame**, com o comentário *"mantém valor positivo constante para evitar efeitos colaterais"* **[VERIFICADO: `engine.js:3635`]**. É um relógio decorativo. Registro porque o `raw/12` o listou como um limitador real de ritmo de farm — **ele não é**.

O modelo de tempo, então, é honesto e curto:

```
golpes para matar  = teto( maxHp / danoDaArma ) = teto( 0,1 × baseHp × multFase × L^0,05 / 1,12^tier )
tempo de combate   = golpes × 0,5 s                    [VERIFICADO: cooldown de 15 frames, engine.js:2073]
tempo por kill     = t_overhead + tempo de combate
```

`t_overhead` é o tempo **não-combate** de cada kill (esperar o spawn, atravessar a fase, o teto de 5 inimigos vivos). É a única peça **[HIPÓTESE]**: calibrei em **39,5 s**, o valor que reproduz os "90 kills/h típicos" do `raw/12` na fase 11. A sensibilidade está em 2.14.3 e ela **não muda nenhuma conclusão**.

#### 2.14.2 Cenário (b): o XP/hora cai conforme o jogador avança? Quanto?

Este era o medo legítimo: se o inimigo demora mais para morrer e paga o mesmo, o XP/hora desaba. **Medi. Dentro das fases 1 a 32, o medo não se materializa** — e o motivo é o achado nº 1 acima.

**XP/hora por fase, sob a sua regra, como % do XP/hora da fase 1** (inimigo comum, arma tier 0) **[CÁLCULO]**:

| Nível do jogador | fase 1 | fase 16 | fase 22 | fase 32 | **fase 33** | **CAVE1** |
|---|---|---|---|---|---|---|
| L = 1 | 100% | 100% | 100% | **100,0%** | **23,1%** | 28,7% |
| L = 100 | 100% | 100% | 98,8% | **98,8%** | **19,3%** | 24,2% |
| L = 1e6 | 100% | 98,8% | 98,8% | **97,6%** | **13,1%** | 16,7% |
| L = 1e11 | 100% | 98,8% | 98,8% | **97,6%** | **7,9%** | 10,3% |

**Leia a coluna da fase 32: a queda máxima em 32 fases é de 2,4%.** A razão é aritmética simples: a fase 32 multiplica o HP por 2,55, o que custa **1 a 2 golpes extras** — 0,5 a 1 segundo — num ciclo de ~40 segundos por kill dominado por spawn e travessia. **O tempo-para-matar não é o gargalo do jogo; o ritmo de spawn é.**

**Resposta ao cenário (b): não precisa de compensação nenhuma nas fases 1 a 32.** A "compensação" que a hipótese procurava já existe e é estrutural: as fases fáceis não matam muito mais rápido, porque nenhuma fase mata rápido — todas esperam o mesmo spawn.

**Onde a queda é real é na fase 33 e na CAVE1** (×666 e ×500): lá o XP/hora cai para **7,9% e 10,3%** do da fase 1 no fim do jogo. Isso é o cenário (c), e é a próxima subseção.

#### 2.14.3 Cenário (a): o efeito na régua, no atalho e no "tempo até completar o Episódio 1"

**Anos até 1e11, por estilo de jogo, SEM o orçamento diário** (só a sua regra, aplicada por cima do jogo de hoje) **[CÁLCULO]**:

| Estilo de jogo | **Hoje** | **Sob a sua regra** | O que aconteceu |
|---|---|---|---|
| Lento, fase 1, só crow | 1.400 anos | **1.400 anos** | nada — a fase 1 é a referência |
| Típico, fases 1–22 | 211 anos | **316 anos** | 1,5× mais lento |
| Rápido, clear completo | 57 anos | **100 anos** | 1,75× mais lento |
| **Farm da fase 33 (comuns lá)** | **5,3 anos** | **3.498 anos** | **660× mais lento — virou o PIOR lugar do jogo** |
| Farm da fase 33 (o cactus) | 5,7 anos | 3.774 anos | idem |
| **Farm da CAVE1 (skull)** | **5,2 anos** | **2.578 anos** | 500× mais lento |
| **Dispersão entre estilos** | **272×** | **37,6×** | **7,2× melhor** |

> **O ponto central, e é ele que responde ao cenário (a):** a sua regra não só apaga o atalho — **ela inverte o sinal dele**. Hoje, escolher a fase 33 é a decisão mais lucrativa possível. Sob a sua regra, é a mais **custosa**: o jogador que farma ali chega **2,5× mais devagar do que o jogador mais devagar e mais desavisado do jogo**. Ninguém precisa detectar, policiar ou proibir nada. **O incentivo perverso deixou de existir.**

**Uma honestidade que eu devo, e ela corrige um número deste próprio documento.** A Seção 2.3 publica "farm da fase 33 zera em 76,6 horas (0,21 ano)", herdado do `raw/12`. Aquele número **supôs** 200 kills/h na fase 33. Com o multiplicador de 666, um crow comum ali precisa de **267 a 946 golpes** — **133 a 473 segundos só de tiro** **[CÁLCULO]** — então 200 kills/h é fisicamente impossível: o teto real é ~27 kills/h. Recalculando com o tempo-para-matar **derivado** em vez de suposto, o atalho de hoje vale **~5,2 anos, não 0,21 ano**, e a dispersão de hoje é **272×, não 12.375×**. **Isso não ameniza nada:** 5,2 anos contra uma régua de 1.121 é o mesmo desastre, e a conclusão de 0.3 (*"existe um atalho de ordens de grandeza que não exige trapaça"*) fica de pé inteira. Registro a diferença porque um número sem o seu modelo ao lado não é um achado — e porque os dois modelos concordam no que importa: **o farm de fase quebra a régua, e a sua regra o resolve.**

**Sensibilidade ao único parâmetro que chutei** (`t_overhead`), razão XP/hora fase 32 ÷ fase 1 e fase 33 ÷ fase 1, em L = 1e6 **[CÁLCULO]**:

| `t_overhead` | 5 s | 10 s | 20 s | **39,5 s** | 60 s | 120 s |
|---|---|---|---|---|---|---|
| fase 32 / fase 1 | 0,846 | 0,913 | 0,953 | **0,976** | 0,984 | 0,992 |
| fase 33 / fase 1 | 0,020 | 0,038 | 0,072 | **0,131** | 0,186 | 0,312 |

**Em nenhum cenário a fase 32 perde mais de 16% do XP/hora, e em nenhum a fase 33 chega perto de empatar com a fase 1.** As duas conclusões são robustas ao chute. *(E este é o número que a conta descartável de teste mediria — é o mesmo pedido de 2.13, e vale para as duas coisas.)*

**"Tempo até completar o Episódio 1": a sua regra não mexe nele, e isso é de propósito.** Um clear das 33 fases leva **~245 minutos em L=1 e ~313 minutos em L=1e11** — **exatamente o mesmo** antes e depois, porque o HP dos inimigos não foi tocado **[CÁLCULO]**. O que muda é só o prêmio: o clear paga **~24× menos XP** do que paga hoje (`1,57e5` → `6.620` em L=1), porque hoje as fases altas inflam o pagamento. **Consequência de design, e ela é a favor do seu conceito:** o que empurra o jogador pelas 33 fases passa a ser a **história, o loot, as badges e as portas secretas** — nunca "esta fase rende mais". É o que a Seção 3 já pede ao dizer que a sensação de progresso mora nas Eras e nos marcos, não no odômetro.

#### 2.14.4 Cenário (c): se ninguém tem motivo de XP para matar na fase 33, isso é ruim?

**Não — desde que o piso da decisão A13 exista.** E aqui as duas coisas se encaixam melhor do que eu esperava.

A fase 33 e a CAVE1 são, por natureza, **os piores lugares do jogo para farmar**, e não por causa do XP: são **um boss único por visita**, pouquíssimos monstros por minuto, e um chefe que leva **5 a 17,7 minutos de tiro contínuo** para cair **[CÁLCULO: 600 golpes em L=1, 2.127 em L=1e11]**. Sob a sua regra, o chefe da fase 33 paga 2,25 comuns por **~1.000× o tempo** — **0,2% a 0,4% do XP por minuto de um comum da fase 1** **[CÁLCULO]**.

**Isso seria cruel — se o XP fosse a única moeda.** Sob o desenho deste plano, não é, por dois mecanismos que **já estão escritos** e que agora ganham um segundo uso:

1. **Chefes de história pagam "por primeira vez", fora da curva de saturação, creditado inteiro** (Seção 2.6, quarto item, herdado de `raw/12` §3.5c). Derrotar o chefe da fase 33 **pela primeira vez** é um evento de história, não um kill de farm — e o pagamento reconhece isso. **Repetir** cai para o valor de farm. Ou seja: a sua regra tira o incentivo de *moer* a fase 33, e o bônus de primeira vez mantém intacto o incentivo de *vencê-la*.
2. **O piso da decisão A13** (80% do orçamento do dia, se cumpriu a hora **e** fez ≥10 kills) é exatamente a rede para o jogador que passou a hora encarando o chefe final. Veja o efeito no orçamento diário **[CÁLCULO]**:

| Nível do jogador | fase 1 | fase 16 | fase 32 | **fase 33** | **CAVE1** |
|---|---|---|---|---|---|
| L = 1 | 99,88% | 99,88% | 99,88% | **78,96%** | 85,53% |
| L = 1e6 | 99,88% | 99,87% | 99,86% | **58,63%** | 67,57% |
| L = 1e11 | 99,87% | 99,86% | 99,85% | **40,91%** | 49,52% |

*(Fração do orçamento do dia que o jogador recebe jogando a hora inteira naquela fase, com a curva `1 − e^(−n/n₀)` e `n₀ = 13,35`.)*

**Leia a linha de baixo com o piso de A13 ao lado:** sem o piso, quem passa a hora final na fase 33 recebe **41%** do dia. Com o piso, recebe **80%**. **A13 deixou de ser só "protege a criança e o herdeiro" e passou a ser também "protege quem enfrenta o boss em vez de farmar o corredor".** Isso é uma razão nova e independente para aprovar A13 — e ela nasceu da sua decisão de 25/09, não estava no documento ontem.

> **Resposta ao cenário (c), em uma linha:** é **bom** para o conceito de Jogo Legado. Um jogo de 1.121 anos não pode ter um "lugar ótimo" onde o jogador fica preso moendo o mesmo corredor por séculos. Sob a sua regra, **todo lugar paga igual, então o jogador vai onde a história está** — e o único jeito de ganhar mais é **aparecer amanhã**, que é literalmente a tese do conceito.

#### 2.14.5 A tabela de XP por fase que resulta — e por que ela é tão curta

**[CÁLCULO]** Esta é a tabela inteira, para todas as 33 fases:

| Fases | `multFase` no **HP** (inalterado) | `multFase` no **XP** | XP por kill (comum, L=1) |
|---|---|---|---|
| **1 a 32** | 1,00 … 2,55 | **1,00** | **20** |
| **33** | 666 | **1,00** | **20** |
| **CAVE1** ✅ *(incluída por você em 25/09)* | 500 | **1,00** | **20** |
| **captura de ghost** ✅ *(incluída em 25/09)* | `1,15^fase` *(só no HP)* | **— (paga como o comum)** | **20** |

Por tipo de inimigo, com `multFase = 1` **[CÁLCULO]**:

| Inimigo | `baseHp` | XP flat em L=1 | XP flat em L=1e6 | Peso relativo |
|---|---|---|---|---|
| crow / demon_fly / slime | 4 | **20** | 5,02e12 | 1,00× |
| cactus (chefe da fase 33) | 9 | **45** | 1,13e13 | 2,25× |
| skull (chefe da CAVE1) | 33 | **165** | 4,15e13 | 8,25× |
| **fantasma de captura (Ghostdex)** | — (escada própria `1,15^fase`, só no HP) | **20** *(= o comum)* | 5,02e12 *(= o comum)* | **1,00× — sua decisão de 25/09** |

**A tabela por fase é de uma linha de propósito.** O que continua variando é o **tipo** de inimigo e a **Era** — nunca o lugar. *(Nota de coerência: a tabela por Era da Seção 2.5 usa os pesos **1 / 4 / 12 / 60 / 8**, que são escolha de design minha, enquanto o `baseHp` do código dá **1 / 2,25 / 8,25**. Os dois conjuntos são compatíveis — só renormalizam a tabela — e a escolha é do `game-designer`, não da matemática. Registro a divergência em vez de escondê-la.)*

#### 2.14.6 Como isso convive com o orçamento diário e com o `n₀` — as duas regras não se substituem

Esta é a parte mais importante desta subseção, e ela merece ser dita sem rodeio, porque é fácil achar que uma das duas regras virou desnecessária. **Não virou.** São dois farms diferentes, e cada regra mata um:

| | **Teto diário** (`τ = 0` + saturação `n₀`) | **XP flat no Episódio** (a sua regra de 25/09) |
|---|---|---|
| **Que farm ele impede** | farm de **TEMPO** — jogar 16 h não rende mais que 1 h | farm de **LUGAR** — matar na fase "certa" não rende mais |
| **A pergunta que ele responde** | *"quanto a conta pode ganhar hoje?"* | *"quanto vale este inimigo?"* |
| **Sem ele, o que volta** | bot 24 h/dia, família em 3 turnos, 16 h/dia zerando em ~70 anos | os 666×/500×: o atalho de 5,2 anos da fase 33 |
| **Dispersão residual** | 1,29× entre lento e rápido | 37,6× entre estilos — **ainda alta sozinho** |

**E a prova de que nenhuma das duas basta sozinha [CÁLCULO]:**

- **Só a sua regra, sem o teto diário:** a dispersão cai de 272× para 37,6×, mas o jogador típico chega em **316 anos** e o rápido em **100 anos** — a régua de 1.121 anos **continua furada**, porque o acoplamento `XP ∝ L^1,90` (a renda crescendo com o expoente `+0,45`, Seção 2.2) **sobrevive intacto à sua regra**. Sua regra tira a fase da conta; ela não tira o nível do jogador da conta.
- **Só o teto diário, sem a sua regra:** a régua fecha em 1.121,3 anos, mas o jogo continua **dizendo ao jogador** que a fase 33 vale 666× — e ele passa a vida farmando um lugar onde o número grande na tela é imediatamente cortado pelo teto. Funciona na matemática e **mente na experiência**. A sua regra é o que faz o número que o jogador vê **contar a verdade**.

> **Em português, para guardar:** **o teto diário responde "quanto você pode ganhar hoje"; a sua regra responde "quanto isto aqui vale".** Uma é um limite, a outra é um preço. Um jogo precisa das duas.

**E há um ganho prático grande, que é o melhor argumento a favor de aprovar isto já:** a sua regra é a **única** peça deste plano inteiro que pode ser construída **hoje, sem spawn autoritativo, sem servidor de XP, sem migração**. No código de hoje ela é *"calcular o XP com o multiplicador de fase fixado em 1, deixando a fórmula do HP intacta"* — **um ponto por fonte de XP, nas duas plataformas** **[VERIFICADO: `engine.js:998`→`:1105` e `:3239`→`:3311`, com os pares em `danger_ghost_mobile/www/js/game/engine.js:960`→`:1067` e `:3180`→`:3252`]**, mais recompilar o APK. É candidata natural à **Fase 0**, ao lado dos outros consertos que valem mesmo que você recuse o conceito inteiro — porque o atalho de 5,2 anos existe **agora**, no jogo que está no ar, e não depende do Legado para ser um problema.

> ✅ **A segunda escada de fase, que ninguém tinha ligado à sua regra — e que você fechou em 25/09.** A fonte 2 de XP (o **fantasma de captura da Ghostdex**, `EnemyBoss`) **não** usa `getPhaseMultiplier` — ela tem a própria escada, `maxHp = 100 × 10 × 1,15^fase × fatorEspécie` **[VERIFICADO: `engine.js:3239`]**. E `1,15^32 = 87,6×`: capturar na fase 33 dava **87,6 vezes** o XP de capturar na fase 1 (5.750 → 503.495 de XP mediano) **[CÁLCULO]** — o atalho de fase voltando pela porta da Ghostdex, menor que os 666× mas vivo. **Sua decisão (*"todos os ghosts devem dar o mesmo XP que os inimigos dão"*) fecha isso pela raiz**, e de um jeito mais simples do que eu ia recomendar: em vez de congelar a escada em `1,15^1`, o XP da captura passa a ser **o valor do inimigo comum**, e a escada própria desaparece da conta de XP (continua no HP, definindo quanto tempo leva para capturar). **O que isso faz com a Ghostdex está em 2.14.8** — e é uma virada grande: ela sai de "irrelevante depois do nível 100" para "relevante para sempre".

#### 2.14.7 Escopo: só o Episódio 1, ou princípio de design para sempre?

Você falou do Episódio 1, que é tudo que existe hoje. Eu recomendo **elevar a princípio geral**, e a razão é de causa, não de gosto:

> **O XP deve codificar QUANDO (a Era) e O QUÊ (o tipo de inimigo) — nunca ONDE.** "Fase" é lugar. Todo prêmio que depende de lugar cria um lugar ótimo, e um lugar ótimo num jogo de 1.121 anos é um jogador preso num corredor por séculos.

Em termos concretos: **todo Episódio futuro começa a própria régua de XP flat, igual ao padrão do Episódio 1** — um inimigo do Episódio 2 se distingue de um do Episódio 1 pela **Era** em que é morto e pelo seu **tipo** (comum / elite / chefe), jamais pelo número da fase. Isso é, aliás, o que a tabela por Era da Seção 2.5 **já faz por construção**: ela é indexada por Era e tipo, e não tem coluna de fase. Adotar seu princípio para sempre **não custa uma linha de trabalho a mais** — só fecha a porta para que alguém reabra o problema no Episódio 2 por distração. *(Se um Episódio futuro precisar ser "mais lucrativo", o lugar certo disso é o **loot**, as **badges** e a **relíquia** — nunca o XP, que é a única grandeza travada pela régua.)*

✅ **E a lacuna de uma palavra na sua frase — você já fechou.** *"As 33 fases"* não incluía a CAVE1, a 34ª sala, com `multFase = 500`: deixada de fora, ela seria **o último atalho do jogo**, valendo **5,2 anos até 1e11 contra os 1.400 do jogador honesto** **[CÁLCULO]**. **Em 25/09 você a incluiu**, e ela virou **0,543× a velocidade do jogador mais lento** — 84% mais devagar, sem atalho nenhum (2.14.8). Ela segue sendo o lugar mais difícil e mais rico em **loot** do jogo, que é o que ela sempre deveria ter sido.

**O que continua sendo pergunta sua é só o alcance no futuro: a decisão A15-b** (Seções 0.9 e 14.2) — se o princípio vincula os Episódios 2, 3, … ou se cada um se decide na hora.

#### 2.14.8 ✅ As duas pontas fechadas (25/09) — CAVE1, captura de ghost, e por que não sobra atalho

*(Scripts: `13c_fechado.js` e `13d_fix.js`, no scratchpad. Sua decisão verbatim está em `00_BRIEF.md` §10.)*

Você leu as duas ressalvas de 2.14.7 e fechou as duas: **a CAVE1 entra na regra**, e **todo ghost passa a dar o mesmo XP que um inimigo dá**. Esta subseção mede o resultado e responde a pergunta que a sua segunda frase levantou sem que você a fizesse: *"isso não vai pagar duas vezes — uma por matar, outra por capturar?"*

##### A) A resposta curta sobre o XP duplo: **não existe, e não pode existir, porque capturar é o mesmo evento que matar**

Eu fui ao código antes de recomendar qualquer coisa. O fluxo inteiro é este **[VERIFICADO: `js/game/engine.js:3307-3321`]**:

```
if (this.lives <= 0) {                                  // o fantasma morreu
    this.alive = false;
    emitKillBoss(this.id);                              // avisa os outros jogadores
    GhostRPG.addXp( Math.floor(this.maxHp * 5) );        // <- O ÚNICO addXp, uma vez só
    RollEnemyDrop(g_currentLevel);                       // loot
    UnlockGhostForPlayer(this.ghostId);                  // <- "CAPTURE THE GHOST!"
    PushChatMessage("Ghost #N captured and sent to Ghostdex!");
}
```

Três fatos que fecham a questão:

1. **A captura vive *dentro* do bloco de morte.** Não há como capturar sem matar, e não há como matar sem capturar (a não ser que `UnlockGhostForPlayer` não exista, o que não é o caso). **São um evento só, com dois efeitos.**
2. **`UnlockGhostForPlayer()` não concede XP ao jogador.** Ela cria o verbete na Ghostdex com `xp: 0` **[VERIFICADO: `js/game/ghost_inventory.js:8` e `:43`]** — e esse `xp` é o **do verbete** (o XP daquela espécie como ghost jogável), não o do personagem. Nenhuma linha dela chama `addXp`.
3. **Portanto o "duplo-XP" que você quis evitar nunca existiu, e a sua regra não o cria.** Só existe **um** `addXp` por fantasma morto, e a sua decisão muda **apenas o valor** desse único crédito. O eventinho de captura (a mensagem verde no chat, o verbete novo) continua exatamente como é — é mecânica, não pagamento.

**Paridade mobile conferida:** `danger_ghost_mobile/www/js/game/engine.js:3180` (a escada `1,15^fase`) e `:3252-3257` (o mesmo `addXp` único seguido da captura) são **idênticos** **[VERIFICADO]**. Qualquer mudança aqui é mudança nas duas plataformas + recompilar o APK.

> **O desenho recomendado, em uma linha:** **mantenha a captura como evento de mecânica (sem XP próprio) e faça o único crédito de morte valer o mesmo que um inimigo comum.** É a leitura fiel da sua frase e é a que o código já favorece — não precisa separar, condicionar nem desduplicar nada.
>
> **Uma nota honesta de risco de implementação:** *se* algum dia alguém acrescentar um `addXp` no caminho da captura (por exemplo para dar "bônus de primeira espécie"), aí sim nasce o duplo-XP. **Recomendo registrar isto como invariante de código:** *"o fantasma de captura concede XP em exatamente um ponto — o bloco de morte — e a captura nunca concede XP por si"*. É uma linha de comentário e um teste; custa quase nada e protege um desenho que hoje está certo por construção.

##### B) O que muda para a Ghostdex — a virada que a sua decisão produziu

Hoje o fantasma de captura dá **XP constante no nível** (5.750 medianos na fase 1, 503.495 na fase 33 — e **nunca cresce** com o nível do jogador). O inimigo comum dá `20 × L^1,90`. **Resultado de hoje:** a captura é um jackpot no começo e lixo depois.

Com a sua regra (**captura = inimigo comum**) **[CÁLCULO]**:

| Nível do jogador | Captura **hoje** (fase 1, mediano) | Captura **fechada** (= comum) | Golpes para capturar *(fase 1)* |
|---|---|---|---|
| 1 | 5.750 | **20** | 115 |
| 3 | 5.750 | 160 | 16 |
| 5 | 5.750 | 425 | 6 |
| **≈ 20** | 5.750 | **5.925 — o ponto de virada** | **1** |
| 100 | 5.750 | 1,26e5 | 1 |
| 1e6 | 5.750 | 5,02e12 | 1 |
| 1e11 | 5.750 | **1,59e22** | 1 |

**Leia as duas pontas da tabela.** Abaixo do nível ~20 a captura passa a valer **menos** que hoje (no nível 1, 20 XP em vez de 5.750 — ela hoje vale **287 inimigos comuns**, o que é justamente o tipo de desequilíbrio que a sua regra existe para apagar). Acima do nível ~20 ela vale **mais**, e sem teto: no fim do jogo, 1,59e22 em vez de 5.750 congelados. **A Ghostdex sai de "fora da progressão depois da primeira hora" para "dentro da progressão para sempre"** — que é exatamente o que a Seção 2.5 pedia, e agora sai de graça, pela sua regra, em vez de por um peso arbitrário que eu tinha escolhido.

> **Um ajuste que eu devo apontar, porque é o único ponto em que a sua decisão conflita com o que eu havia escrito:** a tabela por Era da Seção 2.5 dava peso **8** à captura da Ghostdex (8× um comum). **Sua regra diz 1×.** As duas são defensáveis e a matemática não decide — mas **eu passo a recomendar a sua (1×)**, por um motivo que só ficou claro com a tabela acima: com peso 1 a captura já cresce com `L^1,90` e já fica relevante para sempre; o peso 8 seria um prêmio por *lugar-disfarçado-de-tipo*, porque o fantasma de captura aparece nas mesmas fases que os comuns. **O valor de capturar um ghost deve ser o ghost** — um verbete novo, uma espécie jogável, uma badge — **não um multiplicador de XP.** A tabela da Seção 2.5 precisa ser renormalizada com captura = 1 quando for para implementação.
>
> **E um cuidado de sensação de jogo, não de régua:** nos níveis 1 a 4 uma captura custa **6 a 115 golpes** (o HP do fantasma é constante no nível, enquanto o dano da arma cresce com `L^1,85` — a partir do nível ~5 vira 1 golpe). Ou seja: a **primeira** captura da vida de um jogador novo fica lenta *e* paga como um crow. **Recomendo cobri-la com o mecanismo que já está aprovado em 2.6:** *primeira vez de cada espécie = evento de história, creditado inteiro e fora da curva de saturação*; repetir uma espécie já capturada paga o valor de farm. Isso preserva o "uau" do dia 1 sem reabrir nenhum atalho, porque só existem **101 espécies** — o bônus de primeira vez é um conjunto finito e pequeno, não uma fonte renovável.

##### C) O atalho residual: **não sobrou nenhum** — e o número é melhor que "fechado"

Com as três pontas fechadas (fases 1–33, CAVE1, captura), recalculei **todos** os lugares de farm do jogo contra o **jogador mais lento e mais desavisado que existe** (fase 1, só crow, 20 kills/h, 1.400 anos até 1e11) **[CÁLCULO: `13d_fix.js`]**:

| Lugar de farm | Anos até 1e11 **hoje** | Anos até 1e11 **fechado** | Razão vs. o jogador lento | Ainda é atalho? |
|---|---|---|---|---|
| Fase 1, só crow (**a referência**) | 1.400 | **1.400** | 1,000× | — |
| Farm da CAVE1 (skull) | 5,2 | **2.578** | **0,543×** | **não** — 84% mais lento |
| Farm da CAVE1 (crows nativos) | 5,2 | **2.754** | **0,508×** | **não** |
| Farm da fase 33 (comuns) | 5,3 | **3.498** | **0,400×** | **não** — 2,5× mais lento |
| Farm da fase 33 (o cactus) | 5,7 | **3.774** | **0,371×** | **não** |

> **Todas as razões estão abaixo de 1.** Antes de fechar a CAVE1 ela sozinha valia um atalho de **271×** sobre o jogador lento (e de **732×** sobre o horizonte da régua, o número que eu havia publicado em 2.14.7); **depois de fechada, ela é 0,543× — ou seja, 84% mais lenta.** Não existe mais nenhum lugar no jogo onde se ganhe XP mais rápido do que na fase 1.

**E a dispersão por *lugar*, que é o que a sua regra ataca, virou unilateral para baixo [CÁLCULO]:**

| Nível do jogador | Melhor lugar do jogo | Pior lugar do jogo |
|---|---|---|
| 1 | comum fase 1 = **100** | captura fase 33 = 0,8 |
| 20 | comum fase 1 = **100** | comum fase 33 = 20,6 |
| 100 | comum fase 1 = **100** | comum fase 33 = 19,3 |
| 1e6 | comum fase 1 = **100** | comum fase 33 = 13,1 |
| 1e11 | captura fase 1 = **101,3** | comum fase 33 = 7,9 |

**A propriedade que importa não é o número, é o sinal: nada supera a fase 1 em mais de 1,3%** *(e esse 1,3% é artefato do piso de "1 golpe mínimo", não uma vantagem real)*. **Escolher a fase deixou de ser uma decisão de otimização.** O jogador não pode mais ganhar mais indo a algum lugar — só pode ganhar **menos**. É exatamente o oposto do jogo de hoje, e é um desenho que **não precisa de vigilância nenhuma**: um farmador que procurar o "lugar ótimo" vai encontrar a fase 1, que é onde a história começa e onde a régua foi calibrada.

##### D) O que continua sendo verdade, e não deve ser esquecido

1. **Isto não substitui o teto diário.** A dispersão que sobra (37,6× entre o jogador de 20 kills/h e o de 300 kills/h) é **100% "quão rápido você joga"** e **0% "onde você joga"**. Comprimir a primeira é o trabalho do orçamento diário e da curva `n₀` (1,29× residual) — ver 2.14.6. **As duas regras continuam sendo necessárias, e agora cada uma tem um escopo perfeitamente limpo.**
2. **O custo de implementação continua baixo e continua sendo de Fase 0.** São **duas** fórmulas de XP, cada uma em **um** ponto por plataforma: fixar o multiplicador de fase em 1 no XP do `c_Boss` (`engine.js:998`→`:1105`) e trocar o XP do `EnemyBoss` pelo valor do inimigo comum (`:3239`→`:3311`), com os pares mobile em `:960`→`:1067` e `:3180`→`:3252`. **O HP não se toca em nenhum dos dois** — a dificuldade e o tempo-de-captura ficam idênticos. Mais recompilar o APK.
3. **A migração dos ~139 personagens não muda por causa disto.** Quem já farmou a fase 33 ou a CAVE1 está coberto pela decisão **A7** (Era Zero: o nível antigo vira `pre_era_level` e o contador começa em 1). Esta regra é sobre o ganho **daqui para frente**, e o critério 11 do harness já proíbe recalibração retroativa.

---

## 3. Como o jogador vive isso

*(fonte principal: `raw/07_conteudo_eras_economia.md`, ajustado para o nível vindo do XP)*

### 3.1 O problema, e a resposta

Sob **qualquer** curva que cumpra a régua, o crescimento relativo por sessão desaba: +0,46% por sessão no fim do 1º ano, +0,0009% no ano 500; e o dígito da frente do odômetro pode ficar parado por até **146 anos** (de 1e10 para 2e10) **[CÁLCULO]**. **O número do nível não pode ser a unidade que o jogador sente.**

A resposta é uma escada de cinco degraus, e só o primeiro é diário:

| Degrau | O que é | Cadência |
|---|---|---|
| **Day Seal** (Selo do Dia) | O fecho de uma hora creditada, **com o orçamento de XP do dia consumido**. Contador acumulado ("Days Kept"), **nunca** sequência | todo dia |
| **Ring** (Anel) | 365 horas creditadas da Linha (≈ 1 ano de régua). Contado em **tempo**, não em calendário — assim um dia perdido não desalinha a história | ~1 ano |
| **Digit Milestone** (Marco de Dígito) | Cada troca do dígito da frente do odômetro (1e5 → 2e5 → …). 100 no total | irregular |
| **Era** | A unidade macro. 10 delas, **ancoradas em tempo creditado** | anos a séculos |
| **Capítulo do Keeper** | O mandato de uma pessoa | ~25 anos |

**As Eras são ancoradas em tempo creditado, não em nível** — e agora isso tem uma segunda razão, além da do v1: **a Era é o que determina a tabela de XP dos inimigos** (Seção 2.5). Se a Era dependesse do nível, e o nível do XP, e o XP da Era, teríamos uma definição circular. Ancorando a Era no tempo, a cadeia fica reta: `tempo creditado → Era → XP por kill → XP acumulado → nível`.

### 3.2 As 10 Eras

| # | Era (EN / PT) | Anos de régua | Horas creditadas | Keepers | Verbo novo |
|---|---|---|---|---|---|
| I | **The Wake** / O Despertar | 0 → 0,09 | 33 | #1 | mover, pular, atirar, capturar (o que já existe) |
| II | **The First Ring** / O Primeiro Anel | 0,09 → 1 | 332 | #1 | runas, elementos, forja |
| III | **The Apprentice Years** / Os Anos de Aprendiz | 1 → 5 | 1.460 | #1 | — |
| IV | **The Founder's Age** / A Era do Fundador | 5 → 25 | 7.300 | #1–2 | — |
| V | **The Inheritors** / Os Herdeiros | 25 → 75 | 18.250 | #2–4 | a primeira Passagem real |
| VI | **The Cartographers** / Os Cartógrafos | 75 → 175 | 36.500 | #4–8 | — |
| VII | **The Deep Archive** / O Arquivo Profundo | 175 → 375 | 73.000 | #8–16 | — |
| VIII | **The Quiet Centuries** / Os Séculos Quietos | 375 → 675 | 109.500 | #16–28 | — |
| IX | **The Great Work** / A Grande Obra | 675 → 1.000 | 118.625 | #28–41 | projeto coletivo multigeracional |
| X | **The Keystone Stretch** / O Trecho da Pedra Angular | 1.000 → 1.122 | 44.538 | #41–45 | a chegada |

Cada Era traz **um verbo novo** (não só um número maior), uma região, uma paleta, um chefe e uma relíquia honorífica — **e uma linha da tabela de XP** (Seção 2.5).

**Achado forte e barato [VERIFICADO]:** as **33 fases que o jogo já tem cabem exatamente na Era I = 33 horas creditadas** (um episódio por hora creditada), e as quatro faixas de espécies do Ghostdex casam com as Eras I–IV. **O conteúdo do primeiro mês já existe.**

### 3.3 A "hora completa" — e por que não há streak

A hora é composta de **4 Movimentos de 15 minutos**: **Arrive** (chegar), **Descend** (descer), **Tend** (cuidar) e **Seal** (selar). Fracionáveis, sem penalidade por não completar. A hora do dia 1 e a hora do ano 500 usam os mesmos quatro movimentos, com verbos e sistemas diferentes — e, como a Seção 2.5 mostrou, com **o mesmo número de inimigos**.

O quarto movimento é o **"Fecho do dia"**: uma tela que diz, em substância, *"O legado de hoje está escrito. Pode continuar explorando, ou voltar amanhã, sem nada a perder."* Ela é, ao mesmo tempo, um bom fecho de sessão e a salvaguarda jurídica S2 (Seção 7) — um **ponto natural de parada visível**, o oposto do que o Decreto 12.880 chama de incentivo ao uso excessivo.

**Proibidos por desenho:** contador de sequência, bônus de login, missão diária, multiplicador por sessão longa, evento com recompensa perdível, e qualquer mensagem de cobrança.

> **Uma regra de interface que nasce da Seção 7 e que eu elevo a invariante de produto:** a tela **nunca** diz "faltam X minutos para o seu teto". Ela diz, quando muito, que **o legado de hoje está escrito**. A diferença entre as duas frases é a diferença entre "recompensa por tempo de uso" e "ponto natural de parada".

### 3.4 O dia 1, o ano 500 e o herdeiro que nunca jogou

- **Dia 1.** Você entra, joga o primeiro episódio, mata ~40 a 90 inimigos, sobe do nível 0 ao 20, fecha o Selo do Dia e vê a estrada: as Eras II–X aparecem **trancadas**, com nome e silhueta, e o texto diz quanto tempo cada uma leva. Nada é escondido.
- **Ano 500.** O Keeper de 2526 não vê "um número maior": está na Era VIII, num território com verbos que não existiam na Era I, matando a mesma quantidade de inimigos que o fundador matava (só que cada um vale 5,12e18 de XP), lendo os capítulos das ~15 pessoas que seguraram a lanterna antes dele, e escrevendo o seu. O odômetro está em 8,9% — e o jogo **nunca** apresenta isso como atraso.
- **O herdeiro novato.** Entra pelo **Vestíbulo**: leitura, sem poder, com um **Resumo de 60 segundos** da Linha (barras proporcionais de tempo por Keeper, a Era atual) antes de qualquer capítulo. Pode recusar ali mesmo. Se aceitar, o primeiro dia dele é com um **Ghost Aprendiz** — o sistema de múltiplos personagens que já existe — enquanto o Legacy Ghost "repousa". **E o piso do Desenho C existe exatamente para ele:** um herdeiro que cumpriu a hora e matou pouco porque nunca jogou **não fica para trás**.

### 3.5 Escala dos sistemas que já existem

O problema é real: com o nível na casa dos bilhões, **o dano de arma chegaria a ~1,4e8 no ano 1** se as fórmulas atuais continuassem valendo **[CÁLCULO]**.

| Sistema | Como fica |
|---|---|
| **Combate** | Entra um **"Nível de Combate" logarítmico**: `100·log₁₀(1+L)`. Todas as fórmulas atuais continuam valendo, nada passa de ~3,8e9, e a dificuldade para de derivar. É **item obrigatório do MVP**, não melhoria |
| **HP de inimigo** | Derivado de um **tempo-para-matar alvo**, não de `L^1,90` cru. **Isto passou a ser mais importante neste v2:** o recibo de kill (Seção 2.8) usa o *tempo mínimo plausível de luta* como validação, e esse número só faz sentido se o HP do inimigo for desenhado, não derivado de uma potência que explode |
| **XP** | **Não é mais função do nível.** Tabela por Era e tipo, do servidor (Seção 2.5) |
| **Atributos** | Regra **"razão, não valor"**: todo efeito vira função da *fração* do orçamento de pontos, não do número absoluto (hoje AGI tem teto, vidas são `4+vit`, duração é `1+0,10·int` — tudo quebra cedo) |
| **Itens** | Por **razão**, com Selo de Era e **Reforge** (trazer uma peça herdada para a Era atual mantendo nome e inscrição). Isso elimina o *power creep* por Era e neutraliza de graça o problema do baú (abaixo) |
| **Ghostdex** | As 101 espécies ganham **Aspectos** por Era (paleta + aura). E, com a captura pagando **o mesmo que um inimigo comum** (sua decisão de 25/09 — antes eu propunha peso 8), **a captura volta a ser progressão**: hoje ela é XP congelado em 5.750 que vira irrelevante no nível ~100; fechada, ela cresce com o nível até 1,59e22 **[CÁLCULO, 2.14.8-B]** |
| **Badges (333)** | A escada de requisitos migra para **Marcos de Dígito**, preservando o que já foi ganho. **É uma migração de produção** que nenhum roteiro previa — fica para a Fase 5, com checksum |
| **Ghosts secundários** | Continuam no **Jogo Livre**, com Rank 1–100 e **sem crédito de horas nem de XP de legado**. Também é migração dos 139 personagens — Fase 5 |
| **33 episódios** | Viram a Era I. Rejogáveis livremente — e a repetição de um chefe de história cai para o valor de farm da Era (Seção 2.6) |

**Achado que ninguém tinha visto (`raw/10` R-10):** o baú da conta (`players.chest_items`) é **compartilhado por todos os ghosts** **[VERIFICADO: `db.js:116-130`]**. Um ghost secundário farmando 16 h/dia enche o baú de lendários e **equipa o Legacy Ghost** — ou seja, o teto limitaria o *contador*, mas não o *poder*. A regra "itens por razão" resolve isso sem proibir nada. **E, sob o desenho pelo XP, há um segundo caminho a fechar:** as kills de um ghost secundário **não podem** contar para o `n` da curva de saturação do Legacy Ghost. É uma linha de código, e é um caso de teste obrigatório.

### 3.6 Economia

Duas moedas, com papéis separados:

- **Score** — o que já existe. Precisa de uma decisão: hoje ele é concedido **por chamada de `addXp()`, por acidente de otimização** **[VERIFICADO]** — o que, sob o desenho novo, o amarraria ao orçamento de XP sem querer. Passa a ser por **Marco** ou por **feito**, nunca por hora e nunca por XP.
- **Lantern Oil** (Óleo da Lanterna) — nasce do **tempo** (1 por Selo do Dia), não do nível nem do XP. Não infla ao longo dos séculos, porque a fonte é limitada pelo teto diário. Entra junto com a primeira Passagem.

**Regra de ferro da economia:** eventos e rituais **dão memória, nunca poder**. Nada de XP, nível ou item exclusivo por participar de um evento. Isso protege a régua e, de quebra, impede que uma conta ganhe preço de mercado.

**Relíquias** — incluindo o **selo OG** — são **honoríficas e não transferíveis** (`transferable = false`). Uma relíquia com poder vira item negociável: o oposto exato do anti-RMT (Seção 7.5) e do que mantém o selo OG fora do radar regulatório (Seção 10.7).

### 3.7 O fim de jogo, e o "pós-fim"

**Zerar não acaba o mundo.** A Linha que chega a 1e11, depois da Última Ronda e do portão de calendário de 3147, entra no estado **Concluída**: a **Keystone** é colocada, os créditos rolam **todos os Keepers da cadeia**, e a Linha se aposenta com honra num **Monumento** imutável. O mundo e as outras Linhas continuam.

- **Empate é o caso esperado**, não a exceção: na coorte fundadora, várias Linhas chegam no mesmo ano civil. A regra é **Keystone conjunta**.
- Quem quiser continuar começa uma **Linha nova** ("Novo Ciclo"), que é outra Linha — não um "New Game+" que reseta a antiga.
- **O que se faz enquanto se espera o calendário:** a **Última Ronda** vira obrigatória, não opcional — uma Era X com conteúdo próprio. Com a trava sobre a Keystone (e não sobre o contador), a espera deixa de ser "um contador congelado" e passa a ser tempo jogável normal.
- **Nada disso vira código agora.** A Keystone é um **invariante do banco** ("nenhuma Keystone antes de 3147-01-01"), não uma feature a construir. O Coro e o Monumento jogável só se desenham na Era VIII.

---

## 4. Sucessão e Crônica

*(fonte principal: `raw/03_sucessao_cronica.md`, com os vereditos de `raw/10` §4 aplicados)*

> ### A fronteira, dita antes de tudo
> **Esta seção é 100% Web2.** A Chave do Legado é **gerada e gerenciável pelo servidor**, o `token_epoch` revoga sessões, e a identidade é **e-mail + senha**. Isso é uma **escolha**, não uma limitação: num sistema com servidor, **perder a chave não é fatal** — o Keeper vivo pede outra. É a propriedade mais valiosa da fase Web2, e é exatamente o que se perde do outro lado.
>
> **Quando (e se) migrarmos para a blockchain, a Chave do Legado vira a seed** — e aí perder a chave passa a matar a Linha. Isso está desenhado no outro documento, que está congelado. **Não desenvolva nem implemente nada de seed aqui.**

### 4.1 A explicação de um minuto

> "A conta é uma **casa** com uma lanterna. Sempre existe **um** Guardião cuidando dela. Ele escolhe quem vem depois e guarda uma **Chave** em papel. Na hora de passar, os dois esperam um mês, o novo escolhe a própria senha, e a casa continua com todas as cartas de quem veio antes. Se o Guardião some, a casa fica guardada; se ninguém a pede, vira museu. Quem chega ao fim de tudo não ganha a casa: **a casa inteira** recebe a pedra final, com o nome de todos que cuidaram dela. E ninguém é obrigado a nada: dá para recusar sem perder nada."

### 4.2 Os papéis

| Papel | Quem | Pode | **Nunca** pode |
|---|---|---|---|
| **Keeper** | **Uma pessoa** por Linha. **Sempre humana** — uma IA só assiste e aparece **marcada `[IA]`**, a mesma regra do `Agent G [IA]` | jogar o Legacy Ghost; escrever o **próprio** capítulo; designar Heir e suplente; abrir a porta da Passagem; escolher apelido e privacidade; exportar o Livro; deixar a Linha ao Commons; **Retire the Line** | vender, alugar ou emprestar; **apagar a Crônica**; apagar o Legacy Ghost; resetar a Linha; **impor condição ao herdeiro**; ter 2 Guardiões; passar de novo antes de 180 dias |
| **Heir** | Pessoa nomeada que **reconheceu** a nomeação | Vestíbulo (leitura, sem poder); **Accept / Decline the Charge** com o mesmo destaque; resgatar com a Chave | **nenhum poder** antes da Investidura; não joga, não salva, não lê a Carta Selada |
| **Heir suplente** | 2º na ordem (máximo 1) | o mesmo, se o 1º recusar, expirar ou falecer | nunca dois ativos ao mesmo tempo |
| **Successor** | Quem assume pelo **Commons** | igual a um Heir depois da Vigília | ler carta selada de outro |
| **Ex-Keeper** | Quem já foi Guardião | capítulo preservado; **Adendo** datado; retirar o próprio consentimento | jogar; editar capítulo encerrado; vetar Passagens seguintes |
| **Curador** | Contato de confiança, opcional | receber avisos de silêncio; informar "Guardião vivo mas impedido"; **abrir a porta só para o Heir já designado** | escolher ou trocar Heir; ler carta selada; jogar; mudar credenciais |
| **Adulto Responsável** | Responsável legal de titular menor | confirmar Passagem, trocar e-mail/MFA, apagar identidade | usar a conta no lugar do menor; publicar nome ou mensagem do menor |
| **Operador** | Você hoje; a entidade depois | rodar o varredor; manter o Resguardo; cumprir ordem judicial; corrigir por **errata**; **reemitir a Chave do Legado** a pedido do Keeper autenticado | ver senha; **acelerar a Vigília a pedido pessoal — nem você**; reescrever a Crônica; abrir um 4º caminho |

> **Compromisso do Operador, que vai nos Termos:** *existem exatamente três caminhos para uma Linha mudar de Guardião — Ritual, Cofre (a Chave do Legado) e ordem judicial. Não existe um quarto, e o operador não avalia laços familiares por e-mail.*
>
> Isso não é burocracia: **a superfície de engenharia social de um dev solo é o próprio dev solo.** A resposta a qualquer pedido de exceção é "não", por escrito, e registrada.

### 4.3 Os 7 estados da Linha

```
 Fundação --> [ATIVA] --365 d sem login--> [DORMENTE] --730 d--> [RESGUARDO] --30 anos sem opt-in--> [ARQUIVADA]
                 |  ^                          |                     |   ^                              |
   Heir resgata  |  | Investidura /            | Heir resgata        |   | deixar ao Commons            | reativação
   com a Chave   v  | cancelamento / recusa    v                     v   |                              v (só com opt-in)
              [VIGÍLIA] <--------------------- + ------------------- + --+------------------------------+
                 |--contestação--> [DISPUTA] --acordo--> ATIVA ;  --180 d sem acordo--> RESGUARDO
 [ATIVA] --1e11 + Última Ronda + portão de calendário--> [CONCLUÍDA] (a Keystone)
```

| Estado | Significado operacional |
|---|---|
| **Ativa** | tem Keeper, o relógio corre, o orçamento de XP é emitido |
| **Dormente** | 365 dias sem login autenticado. **Ainda é dele.** Qualquer login o traz de volta, **sem culpa nem multa**. O Heir com a Chave já pode resgatar |
| **Vigília** | os 30 dias de espera antes da Investidura |
| **Resguardo** | escada esgotada (730 d) sem resgate: **nenhum Keeper ativo**. Linha congelada e guardada pelo operador, dados pessoais minimizados. **Não é confisco.** Com `commons_optin`, abre ao Commons depois de 5 anos |
| **Disputa** | contestação, ordem judicial ou fraude |
| **Concluída** | a Keystone foi colocada |
| **Arquivada** | encerrada por escolha (*Retire the Line*) ou 30 anos em Resguardo sem pedido |

**"Conta reclamada" não é estado, é resultado:** alguém completou um resgate, uma adoção ou uma ordem judicial.

### 4.4 A Passagem, passo a passo

1. **Designação.** O Keeper nomeia um Heir (e, se quiser, um suplente). Na mesma tela responde à pergunta **obrigatória** do `commons_optin` (as duas respostas com o mesmo peso). O Heir precisa **reconhecer** a nomeação — designar alguém que nunca respondeu não vale.
2. **A Chave do Legado.** 24 palavras, **geradas pelo servidor**, **mostradas uma única vez**, impressas em papel, em duas cópias, em lugares diferentes. O sistema guarda só o `SHA-256` delas. **É reemissível** enquanto o Keeper estiver vivo e autenticado (4.5).
3. **O resgate.** O Heir apresenta a Chave, autenticado na **própria** conta.
4. **A Vigília: 30 dias, ANTES da troca de controle.** Durante ela o Keeper de saída **continua no comando** e qualquer um dos dois cancela com um clique.
5. **A Investidura.** Na **mesma transação** do banco: encerra o mandato anterior, abre o novo, troca a senha (o novo Keeper escolhe a dele), sobe o `token_epoch` e **derruba todas as sessões**, web e celular.
6. **30 dias de experiência.** O novo Keeper pode devolver a Linha ao Resguardo, sem custo.

**Nenhuma senha viaja.** Três fatores: a Chave em papel + o Heir autenticado + a Vigília.

> **Dois defeitos de desenho corrigidos aqui (`raw/10` C-05 e C-06), que eram bugs e não opiniões:**
> - o `raw/09` inseria o Guardião novo **antes** de encerrar o anterior — e isso **viola o índice único que o próprio `raw/09` cria** ("um Keeper ativo por Linha"). A transação falharia em produção. **Vira caso de teste obrigatório:** *"tentar abrir dois Guardiões na mesma Linha tem que falhar no banco, não no código."*
> - o `raw/09` punha a Vigília **depois** da troca de controle, prometendo ao Keeper de saída um direito de cancelar — mas o `token_epoch++` do resgate **derruba a sessão dele**, então ele não consegue exercer o direito prometido. **A Vigília vem antes. Fim.**

**A escada de silêncio** (todos os prazos param se o serviço estiver pausado):

| Prazo | O que acontece |
|---|---|
| 180 d sem login | **Keeper's Signal** — um "está tudo bem?" factual, sem culpa |
| 270 d | aviso ao Heir de que a Linha está em silêncio |
| **365 d** | **Dormente**; e-mails em 365 / 455 / 545 dias |
| **730 d** | **Resguardo** |
| Vigília | 30 dias · período de experiência: 30 dias |
| Resguardo + 5 anos | abre ao Commons (só com opt-in) |
| Resguardo + 30 anos | Arquivada |

> **Ressalva dura, e ela ficou mais grave neste v2:** **toda essa escada depende de e-mail transacional, que hoje não existe.** Não há envio, não há verificação de endereço, não há "esqueci minha senha" **[VERIFICADO]**. Sem isso, a escada inteira é letra morta — **e a janela de contestação do selo OG também** (Seção 10.6). Por isso o e-mail transacional entra na Fase 0-B, antes do conceito e antes do selo aparecer na tela.

### 4.5 Recusa, dormência, adoção e ritual

- **Recusar é um direito, e é fácil.** A Crônica registra *"declined"*, em tom neutro. Nada é perdido, ninguém é notificado com julgamento.
- **Dormência não é morte.** É "pode acordar" — e a palavra "abandoned" é proibida no produto inteiro.
- **Adoção (Commons) só com opt-in prévio do Keeper.** Isso é **definicional**: sem consentimento nas duas pontas, a condição C4 cai e o objeto deixa de ser legado, vira conta reciclada. A costura com a preocupação legítima do relatório jurídico (Linhas ricas morrendo por falta de herdeiro) é fazer do `commons_optin` **uma pergunta obrigatória na Investidura**, com as duas respostas igualmente fáceis.
- **A Renewal**, a cada Passagem e a cada 20 anos de custódia contínua, é cerimônia na tela e **checklist técnico** por baixo: reemitir a Chave do Legado e destruir a anterior, reconfirmar o Heir, reconfirmar o canal de contato, verificar a integridade da Crônica e exportar uma cópia arquivável. O jogador acha que está limpando o santuário do ghost; na prática acabou de rodar o próprio backup e a rotação de senha.
- **Reemissão obrigatória da Chave (`raw/10` R-06):** um Keeper vivo que perdeu o papel *pode* gerar outra — o problema é que **ninguém o lembra**, e a descoberta só acontece quando ele morre. Por isso a reemissão entra na Renewal e em toda Investidura, como item obrigatório.

### 4.6 A Crônica

Quatro camadas, com regras diferentes de privacidade e de permanência:

| Camada | Conteúdo | Pública? | Alterável? | Apagável? |
|---|---|---|---|---|
| **1. Fato** | período (ano-mês), horas, faixa de níveis, Eras, marcos, tipo de Passagem, lacunas de custódia | sim | **nunca** (correção = **Selo de Contestação**, com o original preservado) | não — **não é dado pessoal** |
| **2. Identidade** | apelido, nome real (opt-in), epitáfio, avatar | só o consentido | só o titular durante o mandato; depois, só Adendo ou retirada | sim → "Guardião anônimo #N" |
| **3. Cartas** | Selada (só o próximo Keeper) · da Casa · pública | conforme o autor | congela na Investidura | sim, retirando o consentimento |
| **4. Cadeia** | instantes exatos, tipos de evento, hashes | **não** (só a "cabeça" é publicada) | nunca (só acrescenta) | sem dado pessoal desde a origem |

**Regra única de imutabilidade:** *vivo e no mandato*, edita o próprio capítulo; *mandato encerrado*, congela; *falecido*, ninguém reescreve — a família pode pedir retirada ou anonimização; *erro do sistema ou fraude*, **Selo de Contestação** (nada apagado, correção registrada, os dois lados visíveis). Em uma frase: **reescrever é impossível; remover é possível.**

**O hash da Crônica — uma das duas decisões deste plano que não têm conserto depois.** Cada entrada carrega o hash da anterior, formando uma corrente: mudar qualquer entrada antiga quebra tudo daí para frente. Três relatórios propuseram três fórmulas diferentes, e a do `raw/09` **colide**: foi demonstrado em Node que concatenar campos sem separador faz `"P"+1+"2x"` e `"P"+12+"x"` darem o mesmo SHA-256.

> **Regra canônica para a CRÔNICA (`raw/10` C-01 — a única que foi testada em vez de proposta):**
> `entry_hash = SHA-256("dgc1:" ‖ JCS({v, lineage_id, seq, kind, occurred_at, payload, prev_hash}))`
> com `JCS` = serialização canônica RFC 8785, data em ISO-8601 UTC com milissegundos, a **string canônica gravada junto** (nunca recomputada a partir do JSON relido — o `JSONB` do Postgres reordena chaves), hashes em `BYTEA`, e o `payload` **sem nenhum dado pessoal**.
>
> **Critério de aceite:** vetores de teste publicados e **duas implementações independentes** (JavaScript e Python) dando o mesmo resultado **antes do primeiro evento ser gravado**.
>
> ⚠️ **Não confunda com a raiz do selo OG.** São **duas árvores diferentes, com regras diferentes e declaradas**: a Crônica usa `dgc1:` + RFC 8785; a raiz OG usa **`DGOG1` + RFC 6962** (Seção 10.4). Duas regras para **árvores diferentes** é correto. Duas regras para a **mesma** árvore é o bug que a Seção 0.7 bloqueia.

**Por que o texto livre nunca entra na corrente (`raw/10` R-24):** se um texto ilegal for gravado dentro da cadeia de hash, o sistema **se recusa a removê-lo** — o append-only vira um passivo. A solução: **só o hash do texto entra na cadeia, com um sal por texto**. Remover o texto apaga o sal e **não quebra a corrente**.

### 4.7 UX para quem nunca jogou

O Livro tem três tempos (Burke): **The Dead** (capítulos anteriores, agrupados por Era, paginados a partir de ~100), **The Living** (o mandato atual, ao vivo) e **The Unborn** (escrever uma Carta Selada). A ordem de leitura começa pelo **Resumo de 60 segundos** — uma faixa de tempo com barras proporcionais e a Era atual — e só depois vêm os capítulos. Para uma criança ou para alguém que nunca jogou, esse resumo é a diferença entre "isto é meu" e "isto é grande demais".

### 4.8 Os casos de estresse que mais importam

| Caso | Resposta do sistema |
|---|---|
| Dois herdeiros disputam | **Só uma** Linha continua (C1). O segundo recebe uma **cópia da Crônica** (leitura), nunca do progresso |
| Herdeiro menor de idade | **Adulto Responsável** + a escada de dormência **pausada** (Reserva) até ele poder aceitar por conta própria. **Nunca** atribuído automaticamente |
| Chave perdida com o Keeper vivo | **reemissão** (4.5). Com o Keeper morto e sem Chave: a Linha segue a escada até o Resguardo. **Esta é a vantagem estrutural da fase Web2** — ver o quadro da abertura da Seção 4 |
| Keeper vivo mas impedido (doença) | **Modo Ausência**; o Curador informa e os relógios param |
| Alguém pede a conta por e-mail dizendo ser filho | **nada acontece.** A resposta é genérica e idêntica, exista ou não a Linha |
| Fraude de XP descoberta 200 anos depois | **ajuste datado** (`credit_adjustment`, delta negativo, com Selo de Contestação), **nunca** reescrita do total — porque o nível é função do XP acumulado da Linha, e subtrair XP de 2150 mudaria o nível de quem estiver jogando em 2400 (`raw/10` R-08) |
| Auto-sucessão (passar a Linha para si mesmo) | não é detectável com certeza, mas é **encarecível**: guarda mínima de 180 dias entre Passagens, exigência de histórico independente do Heir, e os Termos declaram que gerações auto-sucedidas **não contam para o ranking de gerações** |
| Pedido de exclusão pela LGPD | executa um **procedimento** (anonimizar perfil, apagar contatos, substituir identidade por número de geração), **nunca** um `DELETE` direto — ver Seção 7.4 |

---

## 5. Integridade e anti-abuso

*(fonte principal: `raw/05_integridade_antiabuso.md`, reescrito para o XP autoritativo)*

### 5.1 O que está frágil hoje — e isso não é culpa do conceito

Cinco fatos verificados no código, que existem **independentemente** do Jogo Legado:

| # | Achado | Evidência |
|---|---|---|
| 1 | **Todo o XP e todo o nível são calculados no navegador.** Os dois únicos pontos de concessão de XP rodam no cliente; o servidor tem um evento `kill_boss` que **só retransmite**, não credita nada | `js/game/engine.js:1104-1105` e `:3311`; `server/index.js:658-660` **[VERIFICADO]** |
| 2 | **O teto de validação do nível é o objetivo final do jogo.** `NUMERIC_BOUNDS.level = [1, 1e11]`, e a checagem é literalmente `n >= 1 && n <= 1e11`. Um pacote com `level: 1e11` **passa** | `server/db.js:466-467, 496-499` **[VERIFICADO]** |
| 3 | **Não existe checagem de variação nem de monotonicidade.** O `UPSERT` preserva campo **ausente**, mas **nunca compara** o valor novo com o gravado. O nível pode ir de 3 para 1e11, ou voltar de 1e11 para 1, sem nada acontecer | `server/db.js:711+` **[VERIFICADO]** |
| 4 | **JWT de 30 dias sem revogação.** O token carrega **só o e-mail** — sem época, sem identificador. Busca por `token_epoch` ou `revok` em `server/index.js`: **zero ocorrências**. Não há lista de revogação, não há troca de senha, não há "esqueci minha senha" | `server/index.js:121-125, 788-800` **[VERIFICADO]** |
| 5 | **O e-mail de quem está logado é transmitido a todos os clientes** (Seção 0.7) | `server/index.js:1305-1309`, `:709/737/765/802`, `:1375`; `js/game/network.js:212` **[VERIFICADO]** |

E um sexto, que é o mais direto: **tempo de jogo não é medido em lugar nenhum.** A coluna `"time"` existe, mas o cliente grava `0` e nunca incrementa **[VERIFICADO]**.

> **As cinco primeiras, em uma frase:** hoje uma pessoa logada legitimamente **zera o jogo de 1.122 anos em um pacote de rede**, o servidor não tem como saber nem como desfazer a sessão dela, e o e-mail dela está saindo para os outros jogadores.
>
> **Duas honestidades sobre este achado, e elas continuam valendo:** (i) a varredura por outros caminhos que escrevam o nível ou o XP direto em `engine.js` (220 KB) **não foi feita de forma exaustiva** — a afirmação correta é "nos dois pontos conhecidos", e a varredura completa é **pré-requisito da Fase 2**; (ii) **nada disso foi reproduzido contra o banco real**, porque o modo PLANO proíbe. Reproduzir o cenário numa conta descartável, em ambiente de teste, é o **primeiro item da Fase 1**.

### 5.2 O que também já está certo (e não deve ser "consertado")

Para ser justo com o código que existe: a identidade de quem escreve vem **sempre** da sessão autenticada, nunca do payload; os contadores de kills e itens são somados **no servidor**, por delta pequeno; as senhas usam bcrypt (desde 18/08/2026); o JWT é verificado de verdade; o login tem limite de tentativas; as queries são parametrizadas **[VERIFICADO]**. O problema é específico: **o número do progresso vem do cliente**.

### 5.3 A proposta: o XP é do servidor, e o orçamento é o teto

**Nível do legado = `C⁻¹` do XP creditado pelo servidor, dentro do orçamento diário derivado do tempo creditado.**

O que isso resolve de uma vez:

- o cliente adulterado vira **irrelevante para a régua** (ele pode mentir o XP na tela; o XP que conta é o que o servidor creditou);
- **não é preciso reescrever combate, dano, loot e colisão no servidor** — que seria a alternativa, e é um projeto de anos. O servidor só precisa de **três números**: quantos nasceram, quantos morreram, e quanto isso vale;
- **o exploit futuro desconhecido fica limitado por construção**: seja qual for o buraco, ele não passa do orçamento do dia;
- o XP mostrado pelo cliente vira **previsão de interface**, corrigida pelo servidor.

**As peças, na prática:**

| Peça | Regra |
|---|---|
| Protocolo de tempo | `legacy_session_start` → `legacy_heartbeat` (periódico) → `legacy_session_end` |
| Protocolo de XP | **spawn autoritativo** (`spawnId` gerado pelo servidor) → **recibo de kill** → crédito |
| Idempotência | por `(sessionId, beatSeq)` e por `spawnId` — reenvio não credita duas vezes |
| Crédito de tempo | só com **evento de jogo qualificado** dentro da janela |
| Crédito de XP | `tabela[Era][tipo]`, aplicada à curva de saturação `n₀`, cortada pelo orçamento do dia |
| Plausibilidade | kill antes do **tempo mínimo de luta** do tipo → rejeita e registra |
| Quedas | `MAX_BEAT_GAP` + retomada após reinício do servidor, sem dobrar e sem perder mais que uma janela |
| Web + celular juntos | **bastão de crédito**: uma sessão credita, a outra vira espectador **com aviso** — nunca derrubada em silêncio |
| Relógio do cliente adulterado | ignorado. Só vale o relógio do servidor |
| Relógio do servidor andando para trás (NTP) | delta negativo é descartado, com alerta |
| Teto | `τ = 0` por **janela deslizante de 24 h**, por **Linha** |
| Fechamento | job noturno `sealDay` sela o dia, grava `credited_seconds`, `xp_granted`, `curve_version`, `xp_table_version` e um hash do dia |

### 5.4 Modelo de ameaças, resumido

| Ameaça | Resposta |
|---|---|
| Cliente adulterado mandando nível ou XP alto | o XP do legado não vem do cliente. O save "normal" continua existindo, mas não move a régua |
| **Farm da fase 33 / CAVE1** (sem trapaça nenhuma) | o multiplicador sai do XP — **na fase 33 e também na CAVE1** (25/09); o orçamento do dia é o teto absoluto |
| **Farm de captura de ghost em fase alta** (escada `1,15^fase`, valia 87,6×) | a captura passa a pagar **o mesmo que um inimigo comum** em qualquer fase (25/09). **Não há XP duplo a fechar:** capturar já é o mesmo evento que matar **[VERIFICADO, 2.14.8-A]** |
| Bot / macro 24 h | **o teto resolve sem detectar nada.** Um bot ganha o mesmo que um humano de 1 hora |
| **AFK puro** (aba aberta, sem matar) | **ganha zero.** Sem kill, não há XP — a fraqueza do desenho antigo desapareceu |
| Multi-aba, web + celular | uma Linha = um relógio e um orçamento (bastão de crédito) |
| Manipulação de relógio | só o relógio do servidor conta |
| Família revezando em turnos | com `τ = 0` e o orçamento **da Linha**, o revezamento não rende nada a mais — e não é preciso proibir nem acusar ninguém |
| Multi-conta | não ajuda: cada Linha tem a própria régua, e o XP não se soma entre Linhas |
| Ghost secundário alimentando o Legacy Ghost | kills de ghost secundário **não contam** para o `n` do legado; itens por razão neutralizam o baú compartilhado |
| Respawn de chefe por morrer/renascer | `spawnId` credita uma vez |
| Venda de conta (RMT) | fricções (Seção 7.5). A alavanca real: **o comprador leva o save, não a Linha** — a compra nunca aparece na Crônica |
| Sessão do Keeper anterior após a Passagem | `token_epoch` na Investidura derruba todas as sessões |
| **Reivindicação de selo OG por quem tem senha antiga** | troca de senha + confirmação por e-mail + fator extra (Seção 10.6) |
| Exploit futuro que conceda 1e11 | a **trava da Keystone** garante que nenhum exploit *termina* o jogo; some-se o alerta "XP impossível para o orçamento do dia" |

**Três coisas explicitamente NÃO recomendadas, em nenhuma fase:** ofuscação de cliente, *attestation* de dispositivo e CAPTCHA no meio do jogo. Custam caro, afastam jogador legítimo e não resolvem nada que o teto já não resolva.

### 5.5 O que vem antes de anunciar

Sem discussão, e nesta ordem:

1. **corrigir o vazamento de e-mail** (bloqueio formal, Seção 0.7);
2. **tempo autoritativo** → **sessão única** → **teto diário**;
3. **spawn autoritativo + recibo de kill** → **XP creditado pelo servidor** → **nível derivado do XP**;
4. limite de frequência nos saves; `token_epoch`; tetos numéricos corrigidos;
5. depois disso vêm MFA, Crônica encadeada e âncora pública.

**O anúncio público vem por último** — porque anunciar a régua antes da integridade é exatamente o cenário em que um pacote adulterado zera o jogo na frente de todo mundo. **A única exceção é o selo OG**, que tem a sua própria ordem (Seção 10.2): desde 24/09, **o anúncio da regra e da data pode sair já** — ele não depende de snapshot nenhum, porque a elegibilidade vem da regra e não da foto. **O que continua dependendo da correção do vazamento é o selo aparecer na TELA**, e o que depende do vazamento *e* do item de menores é **fazer campanha larga de aquisição** (Seção 7.3). **Anunciar a regra, mostrar o selo e fazer campanha são três coisas diferentes, com três gatilhos diferentes** — e confundi-las é o erro fácil deste desenho.

---

## 6. Durabilidade por 1.122 anos

*(fonte principal: `raw/04_durabilidade.md`)*

### 6.1 A promessa honesta

**Ninguém garante 1.122 anos.** O plano promete três coisas menores e verdadeiras:

1. **sobreviver** às falhas previsíveis;
2. **degradar com dignidade** — nunca perder nada em silêncio;
3. **poder ser recriado** por um estranho, a partir do arquivo e de um documento.

### 6.2 Os quatro níveis de continuidade

A ideia é que o serviço **desça de degrau** em vez de morrer. Cada degrau custa uma ordem de grandeza menos e é uma promessa mais longa.

| Nível | O que é | O que perde | Custo anual **[HIPÓTESE]** |
|---|---|---|---|
| **N1 — Jogo vivo** | login, multiplayer, save, Passagem, ranking, chat | nada | **US$ 1.500** (VPS + banco + domínio + backups) a **US$ 8.000** (com contador, advogado e seguro de uma entidade) |
| **N1-R — Reduzido** | um jogador / offline; Passagem manual assistida; sem chat e sem multiplayer | tempo real entre jogadores | ~metade de N1 |
| **N2 — Congelado** | servidor mínimo: ver perfil, Keepers, Crônica, **o selo OG**; nada de novo save | jogar | **US$ 300–600** |
| **N3 — Arquivo consultável** | **sem servidor de aplicação**: site estático (HTML + JSON/SQLite) em duas hospedagens; exportações baixáveis; **o manifesto da lista OG e as folhas** | jogar, entrar com senha, dados pessoais | **≈ US$ 250** |
| **N4 — Registro histórico** | conjunto de dados documentado + Crônica em texto puro + **manifesto OG + `.ots`** + documento "Como reconstruir" + índice em papel | qualquer interface | **US$ 0–100** |

**Quatro invariantes não negociáveis:**

1. **Descer nunca apaga.** Toda descida gera um instantâneo com manifesto de hash e uma entrada na Crônica.
2. **Nada silencioso.** O servidor publica um arquivo de "pulso" que um verificador **externo** confere; se ficar velho mais de 3 dias, dois humanos são alertados.
3. **Aviso em canais que controlamos primeiro** (banner no jogo, site, README do repositório, Crônica, e-mail) e **depois** redes sociais. Uma conta de rede social nunca pode ser o único lugar de um aviso.
4. **O domínio nunca é abandonado**, nem em N3/N4 — ele serve, no mínimo, uma página estática dizendo onde está o arquivo.

**Prazos de aviso:** N1→N2 pede **≥ 180 dias**; N2→N3 pede **≥ 365 dias**. E as descidas **congelam todos os relógios de dormência** — ninguém cai em Resguardo por causa de um relógio que o serviço não estava em condições de atender.

**Isso é "the Closing"** — o protocolo de encerramento digno, escrito desde o dia 1 e publicado, não improvisado no fim.

> **O selo OG tem uma propriedade que nenhuma outra parte do jogo tem:** ele **sobrevive ao N4**. O manifesto, a lista de folhas e o carimbo OpenTimestamps são ~1,5 KB de texto que qualquer pessoa confere sem servidor nenhum, para sempre. E cada jogador OG tem a própria cópia (o certificado). **É a parte mais durável do projeto inteiro, e é a mais barata.**

### 6.3 A sucessão do OPERADOR — o item mais crítico e o mais ignorado

Hoje o *bus factor* é **1**: se você sumir, somem com você a keystore do Android, o domínio, o acesso ao Supabase, o `.jwtsecret`, o repositório e o gerenciador de senhas **[VERIFICADO]**. Não há backup automático visível no repositório, não há licença, não há segunda pessoa com acesso.

| Degrau | O que é | Quando |
|---|---|---|
| **Adjunto nomeado** | uma pessoa técnica de confiança, com aceite formal, que consegue **fazer deploy, restaurar do arquivo e renovar o domínio** — e não altera regras. Regra escrita: *"se o operador não responde a 3 check-ins seguidos (~90 dias), o adjunto pode renovar o domínio, pagar a hospedagem, subir o serviço em N1-R/N2 e publicar aviso"* | **semana 1** |
| Segredos em partes | compartilhamento 3-de-5, para que nenhuma pessoa sozinha tenha tudo e três juntas consigam reconstruir | primeiros meses |
| Documento "Como reconstruir o jogo" | testado por **alguém que não o escreveu** | primeiros 6 meses |
| **Associação sem fins lucrativos** | antes da primeira Passagem a não-familiar | ano 1–2 |
| Fundação / fundo patrimonial | só quando houver capital de verdade | anos |

> **Regra dura (`raw/10` R-05):** **nomear o adjunto é pré-requisito de ANUNCIAR o conceito**, não de construí-lo. Você não pode prometer 1.122 anos enquanto o projeto inteiro depende de uma pessoa sem substituto.
>
> **E há um item novo neste v2:** o **arquivo privado do snapshot OG** (o que liga cada folha a uma conta) precisa de uma segunda pessoa guardando uma **cópia cifrada sem a senha**, com a senha em papel noutro lugar. Se esse arquivo se perder por inteiro, a raiz continua válida — mas **ninguém consegue mais provar qual folha é de quem**, e o selo vira um número sem donos.

### 6.4 Custódia, formatos e o Arquivo do Legado

**O que precisa ser guardado** (e em que faixa de tempo): estado das contas (séculos), identidade (no máximo décadas, e **nunca** no arquivo público), a **Crônica** (o bem mais precioso e o mais barato — é texto), **o manifesto e as folhas do selo OG mais o carimbo `.ots`**, as **regras de cálculo** (como texto versionado + implementação de referência, não só como código — **e isso agora inclui a tabela de XP por Era, que é Bedrock**), o código, os assets, o domínio, os segredos e a documentação.

**O Arquivo do Legado:** JSON + SQLite + CSV + Markdown/PDF-A, tudo UTF-8, com `format_version`, dicionário de campos, fórmulas escritas por extenso, **números grandes como string decimal** (para não perder precisão — e o XP acumulado de 3,64e28 é exatamente esse caso), manifesto SHA-256, README em PT e EN. **Sem e-mail e sem hash de senha dentro.** Distribuição: **três cópias em duas hospedagens, mais uma offline e uma em instituição.**

**Itens de custódia que `raw/04` não tinha listado:** a **keystore de release do Android** e as credenciais do Android Developer Console. Perder a keystore depois do registro significa **não conseguir mais publicar atualização do mesmo app**. É irreversível.

**Tamanho dos dados — a conta certa (`raw/10` C-12):** ~**91 MB** (com hashes em formato binário) a ~**117 MB** por Linha em 1.122 anos, e ~117 GB para mil Linhas. O `raw/09` dizia 33 MB; o valor certo é 3,5× maior. **A conclusão de viabilidade não muda** ("o Postgres nem sente"), mas a faixa de preço do plano contratado muda. Ninguém mediu tabela real — medir numa cópia é tarefa do `backend-architect`.

### 6.5 O teste dos 50 anos

Pergunta: *"se o dev sumir por 50 anos, o que acontece no dia X?"*

**Resultado hoje: 0 "sim", 3 "parcial", 7 "não"** em 10 itens **[VERIFICADO em `raw/04` §6]**. O cenário base é conhecido: no **ano 2 a 3**, o cartão expira, a VPS é suspensa, a cobrança do banco falha e o jogo sai do ar; o GitHub sobrevive (se público), mas **ninguém tem os segredos**; e o APK instalado continua apontando para um domínio que pode ter caído em mãos de terceiros.

**O achado de segurança que nasce da durabilidade:** o APK tem `https://ghostgames.club` gravado dentro dele. **Se o domínio expirar e um estranho o registrar, todo APK instalado passa a enviar e-mail e senha para o estranho.** O domínio é a camada mais barata (~US$ 16/ano) e a mais perigosa de perder. **Ação:** pré-pagar até 10 anos, travar transferência, 2FA físico e monitor externo.

**Simulacro anual de restauração:** uma vez por ano, alguém restaura o arquivo do zero, com critérios de aceite numéricos, e o resultado é registrado na própria Crônica. **E a partir deste v2 o simulacro inclui um passo novo, trimestral:** recomputar a raiz OG a partir da cópia guardada e conferir que bate com o manifesto público.

### 6.6 O papel honesto da blockchain própria (uma nota curta, e só)

Primeiro, a distinção que o `CLAUDE.md` exige: a **DeSo foi removida e não volta**; "DeSoHosting" é só o nome do provedor de VPS; e a **blockchain proprietária futura** é um item de roadmap separado e real, **cujo plano é outro documento, congelado até o Episódio 2 terminar**.

**Para este plano, ela não é necessária em nada.** As duas coisas que alguém poderia imaginar que ela resolveria já estão resolvidas por meios mais baratos e disponíveis hoje:

- **carimbar a "cabeça" da Crônica**: resolvido por testemunhas baratas — repositório público, Internet Archive, Software Heritage, e-mail aos mantenedores. Regra: publicação **semanal, em ≥ 3 testemunhas, das quais ≥ 2 independentes de qualquer conta sua**;
- **carimbar a raiz do selo OG**: resolvido por **OpenTimestamps**, que é gratuito e ancora no Bitcoin **existente** — não na chain futura (Seção 10.5).

**A única frase de futuro que este documento assina:** *quando (e se) a blockchain própria existir, a raiz OG já carimbada pode ser embutida no bloco de gênese como constante, e a Chave do Legado passa a ser a seed.* **Como isso funciona é assunto do outro documento.** Nada neste plano depende disso, e nada neste plano deve ser adiado por causa disso.

### 6.7 Financiamento, e o texto honesto para os jogadores

**Financie primeiro o piso.** Manter N3/N4 (arquivo consultável + registro histórico) para sempre pede da ordem de **US$ 8–12 mil de principal**; manter o jogo vivo é bônus, não base. O fundo de `raw/04` foi dimensionado para o **fracasso** (o piso) e **nunca para o sucesso** — se o conceito funcionar e houver mil Linhas ativas, a conta muda. Rever depois do lançamento.

**O texto que vai para os jogadores, em substância:**

> *"Ninguém pode garantir mil anos. O que a gente garante é o seguinte: o seu progresso e a sua Crônica são exportáveis desde o primeiro dia; se o jogo tiver que encolher, ele encolhe com aviso de meses, nunca de um dia para o outro; e se ele acabar, acaba virando um arquivo público que qualquer pessoa consegue ler sem precisar de nós."*

Mais dois compromissos concretos que sustentam isso: o contador público **"Dia N de 409.538"** e uma página **"Saúde do Legado"**, com fatos em vez de adjetivos.

---

## 7. Jurídico, ética e menores

*(fonte principal: `raw/06_juridico_privacidade.md`, com o texto integral do Decreto agora verificado)*

> **Isto não é aconselhamento jurídico.** Nada aqui substitui um advogado inscrito na OAB. A subseção 7.6 lista o que exige profissional, por urgência.

### 7.1 🔴 O achado central — e ele atinge a régua, não só o token

**Decreto nº 12.880, de 18/03/2026**, que regulamenta a **Lei nº 15.211/2025 (ECA Digital)**. O v1 registrou este achado a partir de fontes secundárias, porque o site do Planalto recusou conexão a dois agentes. **Neste v2 o texto integral foi lido na publicação oficial** (Câmara dos Deputados, base LEGIN, publicação original, consultada em **2026-09-24**) **[VERIFICADO, texto integral]**:

> ***Art. 9º*** *Os fornecedores de produtos ou serviços de tecnologia da informação direcionados a crianças e adolescentes **ou de acesso provável por eles** deverão implementar mecanismos para evitar o seu uso excessivo, problemático ou compulsivo (…)*
>
> ***Parágrafo único.** Para fins do disposto neste Decreto, consideram-se mecanismos de incentivo ao uso excessivo, problemático ou compulsivo:*
> *I - a ocultação de pontos naturais de parada;*
> *II - o acionamento de novos conteúdos sem solicitação;*
> ***III - a oferta de recompensas pelo tempo de uso;** e*
> *IV - o aparecimento de notificações excessivas.*

**A citação correta, para qualquer documento público, é "art. 9º, parágrafo único, inciso III"** — o *caput* do art. 9º não tem incisos, e as versões abreviadas que circulam nos relatórios estão imprecisas.

**O problema, dito sem rodeios:** a régua do legado é uma recompensa concedida em função do tempo de uso. E jogos eletrônicos têm **presunção de "acesso provável"** por menores — **um aviso "18+" não afasta isso**. Um jogo 2D de fantasmas, gratuito, em navegador, é o exemplo de manual de "acesso provável".

> ### 🟢 E aqui está a melhor notícia deste plano inteiro, que ninguém tinha visto
>
> **A decisão A4 do v1 — *"nível = função do tempo creditado pelo servidor"* — é, literalmente, a descrição do inciso III.** O seu pedido da Parte 1 (*"subir de nível deve sempre vir pelo XP"*) **substituiu a versão juridicamente pior pela melhor, sem que ninguém percebesse na hora.**
>
> Dois relatórios defenderam o **token** contra esse inciso. **Nenhum relatório defendeu a régua** — e a régua é o coração do Jogo Legado, com ou sem blockchain, com ou sem token.
>
> **A mitigação, que não custa nada:** o XP vem de **derrotar inimigos**; a régua de 1 h/dia é **calibração interna** — como o jogo dimensiona a curva — **e nunca aparece ao jogador como "fique conectado e ganhe"**. Nenhum multiplicador de XP por tempo conectado, nenhum "descanso acumulado", nenhum bônus de login diário, nenhuma tela dizendo "faltam X minutos".
>
> **Isto é uma decisão bloqueante (A14, Seção 14), e o custo de escolher certo é zero.**

**Cronograma que corre sozinho:** período de adaptação até nov/2026; fiscalização a partir de jan/2027 (uma fonte fala em nov/2026 — **use o prazo mais rigoroso**). De hoje, são **38 a 129 dias**.

### 7.2 A defesa, e a condição que a sustenta

A defesa tem **quatro** pernas agora — a quarta é nova:

1. o alvo do art. 9º é estimular uso **maior**, e **um teto diário faz o oposto**;
2. o jogo mostra explicitamente quando parar (o "Fecho do dia", que ataca o inciso I);
3. não há nenhuma recompensa por presença;
4. **a recompensa é por um ato de jogo (derrotar um inimigo), não por tempo conectado** — e quem fica conectado sem jogar **ganha exatamente zero**.

> **A descoberta do v1 que continua sendo a contradição mais importante a levar ao advogado (`raw/10` C-16):** a defesa se apoia na frase *"passou de 1 hora, o ganho é zero"*. Essa frase é **verdadeira com `τ = 0`** e **falsa com `τ = 0,10`**. O relatório jurídico escreveu a defesa antes do de calibração existir; o de calibração escolheu `τ` sem saber que estava mexendo na defesa jurídica.

**A pergunta exata para o advogado, atualizada para este v2:**

> *"Um jogo cujo progresso principal vem de derrotar inimigos, mas cujo ganho diário é limitado por um orçamento calculado a partir do tempo de sessão — e que mostra explicitamente ao jogador quando parar — viola o art. 9º, parágrafo único, inciso III do Decreto 12.880/2026, ou cumpre a finalidade do caput? A resposta muda se o limite diário nunca for exibido como meta? E muda se o jogo adotar verificação de idade e não for direcionado a menores?"*

### 7.3 As 12 salvaguardas

| # | Salvaguarda | Como se desenha |
|---|---|---|
| **S1** | **Teto, não meta** | 1 h/dia é **limite de crédito**. O jogo nunca diz "jogue mais"; **nenhuma tela mostra "faltam X min para a meta"** |
| **S2** | **Ponto natural de parada visível** | O "Fecho do dia". Sem pop-up de "só mais uma", sem conteúdo novo empurrado |
| **S3** | **Zero recompensa por presença** | Sem bônus de login, sem "dia 7 de sequência", sem missão diária, sem multiplicador por sessão longa. Recompensas ligadas a **feitos**. As 333 badges são auditadas para garantir que nenhuma exija "X horas jogadas" (hoje nenhuma exige) |
| **S4** | **Sem streak, sem perda** | Faltar não tira nada: sem decaimento, sem "sua linhagem morre". O Banco de Vigília perdoa ausência |
| **S5** | **Sem notificação de cobrança** | E-mails só de conta, segurança e sucessão |
| **S6** | **Sem culpa no texto** | Proibido "você quebrou a linha", "seu pai ficaria decepcionado". Todo texto voltado a menor passa por revisão |
| **S7** | **Sem "atraso" exibido a criança** | A régua aparece **descritiva** ("se um Guardião joga cerca de 1 h por dia…"), nunca "você está 12 dias atrás" |
| **S8** | **Conta de menor mais conservadora** | Teto ≤ 1 h/dia, **sem reposição do banco acima de 1 h**; o responsável pode **baixar** o teto, nunca subir; chat, mural, amigos e galeria **desligados por padrão** |
| **S9** | **Sem eventos "perdeu, perdeu"** | Nenhuma recompensa exclusiva com prazo |
| **S10** | **Controles parentais reais** | Vínculo obrigatório a responsável para menores de 16; painel com limite de tempo (só para baixo), contatos, exportar/apagar, ver o que o filho vê |
| **S11** | **Registro de revisão ética + RIPD** | Documento datado explicando por que cada mecânica diária não é recompensa por tempo, com avaliação do melhor interesse da criança. É prova de boa-fé se houver fiscalização |
| **S12** | **Kill-switch** | Um interruptor que desliga o crédito e a visibilidade da régua **para menores** sem quebrar a Linha. Permite obedecer a uma orientação futura da ANPD em dias, não em meses |

**O plano B, já pronto:** o **"Modo Aprendiz"** — o menor joga o mundo inteiro, mas **sem crédito de legado** e sem ver a régua; aos 18 vira Keeper e o crédito começa. **Recomendação: até o parecer chegar, quem se declarar menor no cadastro entra em Aprendiz por padrão.**

> **Nota sobre o selo OG e menores:** o selo é **elegível para conta de menor** e **nada sobre idade entra na lista** — a folha não guarda dado pessoal (Seção 10.4). Mas isso só é verdade **depois** que o vazamento de e-mail for corrigido: hoje, o payload que carregaria o selo é o mesmo que expõe e-mails, provavelmente de menores. É o motivo pelo qual o Bloqueio 1 é formal.
>
> ⚠️ **E a decisão de 24/09 criou aqui uma sobreposição de calendário que ninguém tinha visto — ela é nova e é séria.** A janela de fundação é, na prática, **uma campanha de onze meses convidando gente nova a criar conta**, e boa parte desse público é menor de idade. **Essa campanha atravessa exatamente o período de fiscalização do ECA Digital (nov/2026 a jan/2027)** — que a Seção 11.7 já lista como relógio externo, com 38 a 129 dias restantes. No desenho antigo isso não se cruzava: o selo era para quem já estava aqui, não havia recrutamento, e o ECA Digital era um problema separado. **Agora os dois são o mesmo problema.**
>
> **Consequência prática, e eu a coloco como recomendação forte:** o anúncio público da janela **não deve ser uma campanha larga de aquisição** antes de (i) o vazamento de e-mail estar corrigido e (ii) o item de menores da Fase 0-B ter uma resposta — nem que seja o "Modo Aprendiz" por padrão. **Anunciar a regra nos canais que já existem é uma coisa; fazer campanha para atrair menores para um jogo que hoje vaza e-mails é outra.** A primeira pode ser feita já; a segunda espera.

### 7.4 LGPD e a Crônica

**O conflito:** "continuidade do jogo" **não** está entre as exceções de conservação de dados do art. 16 da LGPD **[VERIFICADO]**. Logo, a Crônica precisa ser **desenhada para não conter dado pessoal permanente** — é o que a estrutura em camadas da Seção 4.6 faz. **A mesma regra vale para a lista OG**, e por isso a folha carrega um identificador aleatório e o **dia**, nunca o e-mail (Seção 10.4).

**Quatro correções concretas:**

1. **Padrão global: zero dado pessoal na Crônica.** O relatório jurídico recomendava isso só para menores e falecidos. Adotar para **todos** resolve LGPD e GDPR de uma vez — e o GDPR entra em cena assim que um herdeiro morar na União Europeia.
2. **Um SHA-256 de e-mail não é anonimização** (`raw/10` C-10). Um hash sem chave é reidentificável por dicionário — continua sendo dado pessoal. Se o vínculo for necessário, use **HMAC com chave guardada na camada privada**, nunca publicado nem exportado. *(É exatamente por isso que o `og_id` da lista OG é **32 bytes aleatórios**, e não um hash do e-mail.)*
3. **O pedido de exclusão executa um procedimento, não um `DELETE`** (`raw/10` R-11). O desenho do `raw/09` usa `ON DELETE RESTRICT` para impedir que apagar a conta apague a Crônica em cascata — mas o efeito real é **o `DELETE` falhar com erro de chave estrangeira** na cara do jogador. O procedimento correto: anonimizar o perfil, apagar contatos, substituir identidade por número de geração, **e só então** marcar como apagada. **Tem que estar escrito como procedimento operacional antes do primeiro pedido real.**
4. **Convites de retorno: permitidos, com trava** (`raw/10` C-14): opt-in, no máximo 1 a cada 90 dias, parando de vez após 2 sem resposta; **nunca** para conta de menor nem vinculada a responsável; e o "aviso de aniversário da Linha" ("seu e-mail ainda é seu? seu herdeiro ainda é o mesmo?") é **aviso de segurança**, não convite — fica sempre ligado.

**E uma quinta, específica do selo:** um pedido de exclusão de uma conta OG apaga o **vínculo** (quem é a folha), nunca o **fato** (a folha existe na raiz carimbada). A cadeira fica **vazia para sempre** e ninguém a ocupa — senão a exclusão viraria um jeito de "abrir vaga" (Seção 10.8).

### 7.5 Herança digital, natureza da conta e anti-RMT

- **Herança digital no Brasil:** não há lei específica. O **PL 4/2025** tramita no Senado; o **STJ** (REsp 2.124.424, 26/09/2025) criou a figura do "inventariante digital"; e a **ANPD** entende que a LGPD **não protege dados de pessoas falecidas** — a proteção vem dos direitos da personalidade do Código Civil **[VERIFICADO]**.
- **A conta é licença, não propriedade** — como Steam, PlayStation e Nintendo tratam **[VERIFICADO]**. A recomendação é **licença + Passagem oficial designada em vida**. Chamar de "propriedade" cria valor econômico e abre a porta para venda de contas.
- **Anti-RMT:** proibir a venda por contrato é prática universal e lícita; o difícil é distinguir Passagem legítima de venda disfarçada. A resposta é **fricção, não vigilância**: designação com ≥ 30 dias de antecedência, guarda mínima de 180 dias entre Passagens, atestado de gratuidade, e sanção proporcional **com direito de apelação**. **A alavanca real é estrutural:** quem compra uma conta leva o save, **não a Linha** — a compra nunca aparece na Crônica.
- **O selo OG é uma exceção a vigiar:** ele é **intransferível por função** (nenhuma rota de código move um selo de uma conta para outra), **mas não é inalienável** — quem entrega as credenciais da conta entrega o selo com ela, e não existe meio técnico de evitar isso. **A postura honesta é dizer exatamente isso**, e é por isso que o selo ser **honorífico** importa tanto: o que se compraria é reputação, não vantagem.
  - 🆕 **A janela de fundação (Seção 10) desarma este risco por onze meses e depois o rearma.** Enquanto o corte não chegar, **ninguém tem por que comprar uma conta OG: basta criar uma de graça**. A escassez — e portanto qualquer preço de mercado paralelo — **só começa a existir em 26/08/2027**. Duas consequências: (i) você tem quase um ano de folga neste risco específico, e (ii) **é justamente a partir do fechamento que vale a pena observar** se aparece gente vendendo "conta OG" — o que, se acontecer, é o sinal de que alguém está atribuindo valor a um enfeite e a comunicação precisa corrigir isso rápido.
- **A entidade em duas etapas:** **Associação** sem fins lucrativos primeiro (antes da primeira Passagem a não-familiar), **Fundação** de direito privado (Código Civil arts. 62–69) só quando houver capital. "Trust" de verdade não existe no Brasil ainda. Junto: cessão de marca, código e domínio à entidade, **licença aberta** (proposta: AGPL-3.0 para o código + CC BY-SA 4.0 para os assets, depois de auditoria de titularidade — e **nunca fechado sem escrow**) e um **compromisso público de encerramento (sunset) de 180 dias**.

### 7.6 O que exige um profissional de verdade

| Urgência | Item |
|---|---|
| **Agora (bloco 1)** | Termos de Uso · Política de Privacidade · canal do titular · procedimento de exclusão · aceite versionado · **parecer escrito sobre o art. 9º, parágrafo único, III** · campo de idade e vínculo com responsável · **o texto público do selo OG** |
| **Antes da 1ª Passagem** | cláusula de sucessão da conta nos Termos · menores como herdeiros · atestado de gratuidade e sanções de RMT · consentimento por campo da Crônica |
| **Ano 1–2** | constituição da associação · cessão de marca/código/domínio · licença · RIPD · GDPR para herdeiros fora do Brasil · testamento do operador com *break-glass* |

**Duas honestidades sobre esta seção:** (i) o texto do art. 9º **foi lido na publicação oficial** neste v2 — o que fecha a pendência nº 4 do v1 —, mas **a lei está em movimento**: refaça a consulta antes de qualquer decisão; (ii) o cronograma de fiscalização da ANPD (nov/2026 × jan/2027) continua vindo de fontes secundárias **[V-secundário]** e não foi reconferido.

---

## 8. Comunidade, narrativa e comunicação

*(fonte principal: `raw/08_liveops_comunidade_narrativa.md`)*

### 8.1 A moldura narrativa já está quase pronta no seu lore

Três peças **que já são canon no seu próprio lore** bastam, sem inventar nada:

1. Danger Ghost foi **projetado em 3147 e enviado ao passado** como jogo clandestino;
2. a economia de 3147 é o **Capital Temporal** — a IA Suprema *rouba* tempo de vida;
3. a **Rua Beltrão é o ponto cego** onde a resistência "pirateia" blocos de tempo.

Daí sai a frase-mãe do conceito inteiro:

> ***"O jogo foi feito em 3147. Cada hora jogada o leva um pouco mais perto de casa."***

E daí saem três encaixes limpos:

- **A hora diária é, em termos de lore, um bloco de tempo pirata.** A Máquina *toma* tempo; o Legado é tempo **dado**. Isso vira também regra de ética de design: **se o jogo cobrar a hora com culpa, ele vira a IA Suprema.**
- **O Keeper não é "o Guardião" do lore** — esse é o Gato. O Keeper é a pessoa **do lado de cá da tela**, alguém do Ponto Cego que carrega a lanterna e escreve a Crônica.
- **"Zerar" é o jogo chegar em casa**, no ano em que foi escrito. Quem segura a lanterna nesse dia é o *Keystone Bearer*, mas a chegada é **da Linha inteira**.

### 8.2 As extensões de lore que dependem do seu "sim"

Nada abaixo está escrito no seu lore. Cada uma é um fato novo, e você pediu que os agentes não inventassem.

| # | O que acrescenta | Recomendação |
|---|---|---|
| **E1 — "A âncora"** | todo Legacy Ghost só mantém a forma enquanto alguém o mantém; quando a Linha fica Dormente, o ghost "repousa", nunca morre | **pedido de lore a você**. Mexe na física do mundo |
| **E2 — "A Dívida do Céu"** | o nível 1e11 é a dívida do céu paga; "zerar o jogo" = "zerar a dívida" | **aprovar, se você gostar**. Mas **nunca** exibir "dívida restante" como contagem regressiva |
| **E3 — "A Fenda aberta"** | a estrada 2026→3147 é o tempo que a Fenda precisa ficar aberta | **desaconselhado.** Soa a "a Fenda fecha se você não jogar" — é cobrança disfarçada |
| **E4 — "Uma estrela por Linha"** | cada Linha que coloca a Keystone devolve uma estrela ao céu roubado | **aprovar, se você gostar** — resolve a coroação conjunta com elegância |
| **E5 — "O ronronar do Gato"** | o Gato aparece como presença tranquilizadora na Investidura do herdeiro novato | **pedido de lore a você** |

**Recomendação consolidada:** publicar com **zero fatos novos** (só o canon), e adotar **E2 + E4 apenas se você aprovar por escrito**.

### 8.3 Rituais e Commons

**Calendário fixo, e pouco** (a carga do ano 1 é estimada em **~85 h**, podendo chegar a ~125 h no pior caso **[HIPÓTESE]**):

- **Legacy Day** — aniversário do Dia da Fundação de cada Linha;
- **the Roll Call** — leitura anual dos nomes, em 21 de junho;
- **the Renewal** — por Linha, a cada Passagem e a cada 20 anos.

**Regra de ferro:** **eventos dão memória, nunca poder.** Nenhum XP, nível ou item por participar. E nenhum prêmio perdível — sem FOMO punitivo.

> **O Commons deixa de ser enfeite — e neste v2 isso ficou mais grave.** Com a chance de alguma Linha chegar a 3147 revisada para **até ~11% (e 3–5% com correlação realista)**, o Commons é **o único mecanismo que aumenta essa probabilidade de verdade**, porque converte "não tinha herdeiro" de fim de linha em troca de Guardião. Na comunicação ele passa a ser apresentado como o que é: **a razão pela qual o conceito é viável**, não um recurso bonito.

**Papéis de comunidade, poucos e com rodízio:** 2 **Lookouts** no ano 1, **Scribes** a partir do ano 2, sempre adultos, com rodízio de 2 anos.

**Achado real que muda planos [VERIFICADO]:** o chat global de hoje é um **broker MQTT público de terceiros — sem conta, sem moderação e sem possibilidade de banimento**. Ele não serve de base para uma comunidade de décadas. **Ação imediata e barata:** rotulá-lo como *"public, unmoderated"*. **Ação de médio prazo:** não hospedar ritual nenhum nele e mover para um canal autenticado antes dos eventos da Crônica. **E uma consequência direta para o selo:** **o chat NÃO recebe selo OG** — qualquer cliente publica qualquer JSON naquele tópico, então um selo ali seria forjável por qualquer um (Seção 10.9).

**Ranking por geração:** `lineage_standings` é o **dado** (uma linha por Linha, job noturno), o Mapa do Céu / Hall of Keepers é a **apresentação**, e o `raw/03` é a **regra**. Nada disso é MVP: fica para o ano 2, com pelo menos 100 Linhas ativas.

### 8.4 Comunicação sem prometer o futuro

**A regra de escrita:** *prometer o ritmo, não o futuro.*

| Nunca diga | Diga |
|---|---|
| "1.122 anos garantidos" | "o ritmo do jogo foi calibrado para isso; a régua é uma **medida, não uma agenda**" |
| "jogue 1 hora todo dia" | "se um Guardião joga cerca de uma hora por dia…" (descritivo, sempre) |
| "a sucessão está testada" | "testada em N Passagens piloto" — com N verdadeiro |
| "você está atrasado" | nada. Esse número não existe na interface |
| "faltam X minutos para o seu teto" | nada. **Proibido pela Seção 7.1** |
| "o selo OG vai valer alguma coisa" | "é reconhecimento por ter estado aqui cedo, e nada mais" |

**Duas peças públicas concretas:** o contador **"Dia N de 409.538"** (que congela no Fechamento) e a página **"Saúde do Legado"** — quantas Linhas ativas, quando foi o último teste de restauração, qual o nível de serviço atual.

**Comunicação em degraus, na ordem** *(revista em 24/09 — o primeiro degrau trocou)*: (i) **o anúncio da regra e da data do selo OG, carimbado** — não mais o snapshot, que agora só acontece em ago/2027; (ii) a carta pessoal às ~48 contas atuais (Seção 8.5), que é sobre a **Era Zero**, não sobre exclusividade do selo; (iii) 48 h de observação; (iv) a página pública, o FAQ e o compromisso de encerramento digno; (v) campanha larga **só depois** dos pilotos de Passagem — **e, agora, só depois do vazamento de e-mail e do item de menores** (Seção 7.3).

> **Por que o primeiro degrau pôde subir na fila.** No desenho antigo, comunicar qualquer coisa sobre o selo antes do carimbo era proibido, porque provocaria uma corrida. Com a data pública e a onze meses, **o anúncio virou o degrau mais barato e mais cedo de todos** — ele custa zero, não pode ser retirado, e é exatamente o que dá à regra a propriedade de ter vindo antes dos fatos (Seção 10.5).

### 8.5 A carta às ~48 contas

É a peça que faz a Era Zero dar certo ou errado. Ela precisa dizer, em substância: *o seu nível atual não é apagado — ele vira história, marcado como `pre_era_level`; você recebe o **selo OG**, e a janela em que ele pode ser obtido fecha em 26/08/2027, para sempre; a partir de agora o contador do legado começa em 1, e ele mede outra coisa: XP concedido pelo servidor dentro de um orçamento; você é um dos **Primeiros Guardiões**.*

> ⚠️ **Um cuidado de redação que a decisão de 24/09 tornou obrigatório, e é fácil errar.** A versão antiga desta carta dizia *"o selo, que nenhuma conta criada depois de hoje poderá ter"*. **Isso agora seria falso** — contas criadas depois de hoje vão poder, sim, até 26/08/2027. **Não escreva essa frase.** Se ela sair, você terá prometido exclusividade a ~48 pessoas e depois entregue o mesmo selo a centenas: é o tipo de erro que a comunidade não esquece, e ele seria inteiramente seu, não do desenho.
>
> **O que é verdadeiro e serve igualmente bem:** as ~48 contas de hoje são as destinatárias da **Era Zero** — elas têm um `pre_era_level`, uma história anterior ao contador, e são as únicas que existiram antes de o Legado ser concebido. **Essa é a distinção real delas, e ela não depende do selo.** A carta deve se apoiar nela. *(Ver também 10.13, item 1: contar as contas anteriores a 22/09/2026 à parte na estatística pública — sem criar um segundo selo nem hierarquia visual.)*

**Regras de envio:** 7 dias antes, 24 h antes e 1 h antes. **Você envia** — os agentes só rascunham. Se mais de um terço das respostas for negativa, **a etapa pública é pausada** e você responde individualmente **[HIPÓTESE do limiar]**. E como e-mail de domínio novo cai em spam com facilidade, use também o chat global e o mural.

### 8.6 O "sunset" digno

É **the Closing** (Seção 6.2), e ele é escrito e publicado **desde o dia 1**, não improvisado no fim: gatilhos objetivos para descer de nível, aviso de 180 a 365 dias, exportação individual liberada desde sempre, instantâneo com hash a cada descida, e uma **"Última Entrada"** na Crônica já escrita e guardada.

---

## 9. Arquitetura técnica e migração

*(fonte principal: `raw/09_arquitetura_migracao.md`, com as correções de `raw/10` §7)*

### 9.1 O modelo de dados

**Nada é apagado ou reescrito.** As tabelas `players` e `characters` continuam sendo a verdade do save; as tabelas novas guardam *quem é dono da história*, *quanto foi investido* e *o que aconteceu*.

| Tabela nova | O que guarda | Colunas-chave |
|---|---|---|
| **`lineages`** | a Linha — o legado em si | `lineage_id`, `account_id` (único), estado, `founded_at`, `commons_optin` |
| **`keepers`** | Guardião atual e todo o histórico | `lineage_id`, `generation`, `started_at`, `ended_at`, `handoff_in_type`, `handoff_out_type`, + **índice único parcial: um Keeper ativo por Linha** |
| **`successions`** | o estado de uma Passagem em andamento | designação, convite, aceite/recusa, Vigília, Investidura |
| **`succession_vault`** | o Cofre — só o `SHA-256` da Chave do Legado | nunca a Chave em claro |
| **`chronicle_events`** | a Crônica: append-only, com hash encadeado | `seq`, `kind`, `occurred_at`, `payload` (sem dado pessoal), `prev_hash`, `entry_hash` (`BYTEA`), **string canônica gravada** |
| **`playtime_sessions`** | camada quente, descartável | sessões abertas, heartbeats, idempotência |
| **`playtime_daily`** | camada selada, permanente | `credited_seconds BIGINT`, **`xp_granted`**, `curve_version`, **`xp_table_version`**, `day_hash` |
| **`playtime_yearly`** | agregado anual | leitura rápida de séculos |
| **`relics`** | relíquias honoríficas | **`transferable = false`** |
| **`credit_adjustment`** | ajustes datados (de tempo **e de XP**), positivos ou negativos | barata agora, cara depois |
| **🆕 `enemy_spawns`** | o spawn autoritativo: `spawnId`, tipo, fase, `spawnTs`, Linha, consumido? | **é o que torna o Desenho C possível** |
| **🆕 `og_snapshots` · `og_snapshot_leaves` · `og_seals` · `og_links` · `og_events`** | o selo OG (Seção 10.4) | fato público e vínculo privado, **separados** |

**Mais quatro colunas aditivas** em `players`/`characters`: `account_id` (identificador **opaco** da conta — e ele **nunca** é o e-mail), `login_handle` (apelido de login pseudônimo), `token_epoch` (revogar sessões) e `pre_era_level` (o nível antigo, preservado como história).

**Volume [CÁLCULO]:** um agregado diário por Linha em 1.122 anos são **409.538 linhas ≈ 91–117 MB**. Com mil Linhas, ~117 GB no total. **O Postgres nem sente** — mas isso muda a faixa de preço do plano contratado. O que **não** cabe: guardar heartbeat cru para sempre (24,5 milhões de linhas e ~3 GB por Linha) — por isso o livro-razão tem duas camadas. **E o mesmo vale para os spawns:** `enemy_spawns` é camada **quente e descartável** (janela de horas), nunca histórico permanente.

### 9.2 O fluxo autoritativo — a maior mudança do plano

**Hoje:** o cliente calcula XP e nível, e o servidor valida faixa.
**No legado:** o **servidor concede o XP** e o cliente apresenta.

```
cliente: legacy_session_start
   -> servidor abre sessão, gera sessionId
servidor: ao nascer um inimigo, gera spawnId e registra (tipo, fase, spawnTs)
cliente: legacy_heartbeat (periódico, com evidência de jogo qualificado)
   -> servidor credita segundos (idempotente), só do próprio relógio
cliente: kill_receipt { sessionId, beatSeq, spawnId }
   -> servidor: valida spawnId nao-consumido + tempo minimo de luta
   -> calcula XP = tabela[Era][tipo], aplica saturacao (n0) e o orcamento do dia
   -> credita, marca o spawnId como consumido
cliente: legacy_session_end  (ou timeout)
job noturno sealDay:
   -> sela o dia: credited_seconds + xp_granted + versoes + day_hash
   -> aplica o piso do Desenho C, se a Linha cumpriu hora e >= 10 kills
   -> recalcula  legacy_level = C^-1(XP acumulado da Linha)
   -> grava evento na Cronica quando cruza Selo / Anel / Marco / Era
```

`addXp()` do Legacy Ghost passa a **aplicar o que o servidor manda**; o cálculo local vira previsão de interface. Ghosts secundários continuam como hoje, **fora do orçamento**.

**Ordem noturna recomendada:** `sealDay` → verificação da corrente → dump → exportação → âncora externa. Nessa ordem, e não em outra.

**Detalhe de infraestrutura que é pré-requisito:** o pool de conexões do Postgres precisa de `connectionTimeoutMillis` configurado **antes** de qualquer escrita periódica — hoje, 15 jogadores simultâneos já levaram a latência de poucos milissegundos a ~5 segundos **[medido em `raw/09` §6]**. **Com heartbeat isso piora; com recibo de kill piora mais** — é o item de desempenho a medir no portão G2, e a mitigação óbvia é **agregar os recibos na janela do heartbeat**, em vez de um round-trip por kill.

### 9.3 Sucessão técnica

- **Login:** o modelo final separa **a pessoa** (que tem a própria conta e senha) da **Linha** (o objeto herdado) — assim nenhuma credencial troca de mãos. Mas renomear a chave primária de `players` com chaves estrangeiras em cascata, sem ambiente de teste, é arriscado demais para o MVP. **A ponte:** agora, `account_id` + `login_handle` pseudônimo; o modelo definitivo vem **antes da primeira Passagem a não-familiar**. O `raw/09` dizia "o e-mail do fundador fica como login para sempre" — isso está **errado como estado final**: e-mails morrem, e há precedente real de domínio de e-mail recomprado por estranho.
- **Quantas tabelas dependem de `players(email)`:** **6 tabelas / 7 colunas** (`characters`, `diary_entries`, `egregora_messages`, `friendships` ×2, `player_badges`, `player_stat_progress`). A recontagem correta é 6/7 (o `raw/09` dizia 8 e o `raw/05` dizia 5).
- **Revogação de sessão:** `token_epoch` sobe na Investidura e em toda troca de senha, derrubando todas as sessões. **Isso conserta hoje um problema que existe independentemente do legado** — e é pré-requisito da troca de senha forçada da Seção 10.6.

### 9.4 A migração das ~48 contas / ~139 personagens

**"Era Zero" aditiva.** Três relatórios convergiram de forma independente — é o item mais sólido do plano.

- `pre_era_level := level` (o número antigo vira história, preservado);
- `legacy_level := 1` (o contador do legado começa do zero, porque ele mede **outra coisa**);
- `legacy_xp := 0` (idem);
- cria a Linha, o Keeper nº 1 (*First Keeper*) e o evento de fundação;
- **concede o selo OG** às contas elegíveis, a partir do snapshot já carimbado (Seção 10).

**Por que não preservar o nível?** Matematicamente seria inofensivo (custaria no máximo **0,74%** do horizonte). O argumento decisivo é outro, e **ficou muito mais forte neste v2**: existem contas que farmaram a fase 33 ou a CAVE1 e podem estar com **níveis astronômicos ganhos em horas** — não por trapaça, mas porque o conteúdo permitia. Preservar isso faria **a régua nascer mentindo**, e faria algumas Linhas largarem séculos à frente das outras. **A compensação emocional é o selo OG + horas simbólicas no Banco de Vigília + a carta pessoal.**

> **Um dado que só você pode autorizar levantar, e que muda a conversa da Era Zero:** a distribuição real de níveis das 48 contas e 139 personagens. A consulta é `SELECT level, xp, world_level FROM characters ORDER BY level DESC;` — somente leitura, e **pode ir junto com a leitura do snapshot OG**, na mesma autorização e na mesma sessão. Sem ela, ninguém sabe quantos personagens já foram longe demais.

**O roteiro do script segue o padrão que este projeto já usa** (`migrate_level_bigint.js`): **simulação por padrão** (escreve zero bytes), `--confirm` para valer, transação única, idempotente, **checksum `md5`** das colunas que não podem mudar, e `exit 1` se algo divergir. **Antes de tudo:** export JSON por conta das 48, guardado **fora do Supabase**.

**O evento de fundação grava o hash da configuração do harness** (curva, margem, `τ`, **`n₀`, o piso e a tabela de XP por Era**) — assim a promessa fica auditável por qualquer pessoa, para sempre.

**Duas migrações escondidas (`raw/10` R-15):** trocar os valores de requisito das 333 badges e converter os 139 personagens para Rank 1–100 são migrações de produção que **nenhum roteiro previa**. Entram como passos do mesmo script, na Fase 5, com o mesmo padrão de checksum.

### 9.5 Paridade web + mobile

Este é o ponto onde o projeto **já se machucou**. As regras (`CLAUDE.md` §3, skill `crossplatform-deploy`):

- toda mudança em `js/game/` ou `js/web2/` é espelhada em `danger_ghost_mobile/www/js/...`, **lendo o arquivo do mobile antes** — eles não são idênticos, e copiar diff às cegas já causou bug. *(Prova concreta e atual: os pontos onde o level é desenhado divergem em número de linha entre as duas cópias — `engine.js` 1282 contra 1247, `overworld.js` 2754 contra 2780, `ui_manager.js` 2320 contra 2353 **[VERIFICADO]**.)*
- **nunca** editar os arquivos soltos na raiz de `danger_ghost_mobile/` nem o `www/` morto dentro de `danger ghost/` — são as duas pastas-armadilha;
- APK novo: `npx cap sync android` → build → copiar para **os dois lugares** → subir o `?v=NN` de cada arquivo alterado, **inclusive o link do APK**;
- **servidor primeiro** (aditivo e retrocompatível), clientes depois. Um cliente antigo que receba um campo desconhecido (como o `og`) **ignora sem erro**;
- **`MIN_CLIENT_VERSION`**: cliente antigo cai em **modo leitura** (joga, não credita, não ganha XP de legado) com link para atualizar — **nunca** derruba a conexão. E nunca ativar antes de o APK novo estar publicado e o link funcionando.

**Pendências de mobile que precisam de resposta antes da Fase 2:** o que exatamente se perde ao desinstalar/reinstalar com assinatura nova; como o WebView se comporta com o heartbeat **e com o recibo de kill**; se o jogo é instalável como PWA; e **se a regressão do botão de pulo ainda está aberta** — um jogador que não consegue pular não mata inimigo, não gera recibo de kill e **não ganha XP nenhum**; sob o desenho novo, essa regressão deixa de ser um incômodo de UX e passa a ser um bloqueio de progressão.

### 9.6 Backup, exportação e restauração

- **Backup:** `pg_dump` diário para **dois destinos** em locais diferentes, com **teste de restauração** num Postgres vazio. Regra dura: **nenhuma migração roda sem um dump restaurado nas últimas 24 h.**
- **Réplica não é backup.** Uma réplica copia o erro junto.
- **Um cuidado novo, e ele é da Seção 0.8:** **nenhum backup anterior a 18/08/2026 pode existir fora de armazenamento cifrado** — esses dumps contêm senhas em texto puro da coorte OG.
- **Exportação por conta:** o jogador leva o legado dele embora — JSON com a Crônica, os fatos, os hashes **e o certificado OG**, reimportável num Postgres limpo. No MVP entra a **exportação por script** das 48 contas; o endpoint público fica para a Fase 5.
- **Verificação:** `verify_chronicle.js` recomputa a corrente de hashes de todas as Linhas; `verify_og_snapshot` recomputa a raiz OG; um teste de restauração trimestral é registrado **na própria Crônica**.

### 9.7 Custos de escala

| Item | Faixa **[HIPÓTESE]** |
|---|---|
| Supabase pago (piso recomendado) | US$ 300/ano — o plano gratuito **pausa após ~7 dias sem atividade** e não tem backup diário |
| Backup em 2 armazenamentos + monitor | ≈ US$ 250/ano |
| Domínio (pré-pagando 10 anos) | US$ 160 uma vez, contra US$ 16/ano |
| VPS | **você informa** — provavelmente já é custo fixo |
| E-mail transacional | US$ 0–240/ano (a faixa gratuita deve bastar para 48 contas) |
| **Carimbo OpenTimestamps** | **US$ 0** |

**Recomendação de infraestrutura:** Supabase pago **+ réplica na VPS + exportação semanal para fora**, com o Supabase pago sozinho como piso aceitável.

---

## 10. O selo OG

*(fonte principal: `chain/24_selo_og.md`, com os vereditos de `chain/25`, **e revista em 24/09/2026 pela decisão do dono que trocou o corte retroativo por uma janela de fundação**. **Tudo nesta seção é Web2 e pode ser construído hoje** — a blockchain aparece só numa nota de futuro, em 10.12)*

> **O seu pedido original (21/09):** *"todas as contas existentes hoje devem ter, acima do level no ghost, um selo de OG! Somente as contas já criadas e existentes hoje."*
>
> **O seu pedido revisado, e é ele que manda (24/09):** *"O selo OG é para todas as contas criadas até dia 26 mês 08 e ano 2027, depois desta data as contas criadas vêm sem o selo OG!"*

**A diferença entre os dois, numa tabela só** — porque é ela que explica cada mudança desta seção:

| | Desenho antigo (21/09) | **Desenho vigente (24/09)** |
|---|---|---|
| O que define quem é OG | **uma foto** tirada em `2026-09-22T03:00:00Z` | **uma regra corrente** anunciada, que fecha em `2027-08-26T03:00:00Z` |
| Quando a lista fecha | já deveria ter fechado | **26/08/2027** — daqui a ~336 dias |
| Quando se lê o banco | **às pressas, esta semana** | **no dia do corte**; e, opcionalmente, um marco interino agora (10.2) |
| De quem é a pressa | do dono, e vencida | de ninguém. Nada aqui vence |
| Como se prova a data | "confie no arquivo datado de 21/09" | **a constante era pública 11 meses antes** de qualquer conta poder disputá-la |
| Quando anunciar | **nunca antes** do carimbo | **quanto antes melhor** |
| Tamanho provável | ~48 contas | **~92 a ~490** (10.13) |

### 10.1 O que é, em uma página

- **O selo é, na prática, uma lista que fecha numa data conhecida.** A única coisa que precisa ser imutável e verificável é **quais contas foram criadas antes do instante de corte**. O desenho visual, os textos e até o modelo de dados podem mudar depois; **a lista, depois de fechada, não**.
- **A elegibilidade é da REGRA, não da foto.** Esta é a inversão de 24/09 e vale a pena reler: no desenho antigo, uma conta era OG porque **aparecia numa foto**; no desenho novo, uma conta é OG porque **o `created_at` dela é menor que uma constante pública**. A foto virou o que ela deveria ter sido desde sempre — **uma prova**, não a fonte da verdade. A consequência prática é grande: se a leitura final falhar, for repetida ou precisar de correção, **ninguém perde o selo**, porque o direito não estava na foto.
- **"Congelar primeiro, classificar depois" continua valendo — só mudou o quando.** O que se congela, em 26/08/2027, é a lista de *todas* as linhas da tabela de contas criadas antes do corte (a raiz `raiz_todas`). **Quem merece o selo** (tirando conta de teste, bot, lixo) é um subconjunto decidido depois, com regras publicadas — **sem precisar tocar de novo no banco de produção**.
- **O cliente nunca decide.** O servidor coloca um bit `og` no login e nos dados de vizinhos; a fonte é uma tabela append-only cujo conteúdo está amarrado à raiz carimbada. Um cliente que envie `og: true` **não aparece com selo para ninguém**.
- **O selo é da CONTA (da Linha), não do ghost e não da pessoa.** Aparece em **todos os ghosts da conta**, inclusive nos criados depois do corte — porque o ghost é o que o jogador troca o tempo todo, e a conta é o objeto durável.
- **É honorífico e nada mais.** Sem token, sem XP, sem bônus, sem vantagem.

### 10.2 A ordem das operações — e o erro clássico, que virou outro

```
--- AGORA (set/2026) ---------------------------------------------------------
Passo 0  Voce fixa a constante do corte (OG1).                       [30 segundos]
Passo 1  ANUNCIO PUBLICO da regra e da data.                         [quanto antes, melhor]
Passo 2  Correcao do vazamento de e-mail.                            [o unico item com relogio]
Passo 3  (OPCIONAL) Marco interino: ensaio local -> leitura somente
         leitura -> raiz interina -> carimbo OTS -> publicacao.      [~0,5 dia seu, R$ 0]

--- A JANELA ABERTA (out/2026 a ago/2027) ------------------------------------
Passo 4  Nada a fazer. A regra trabalha sozinha. Quem se cadastra, entra.
         Em paralelo, e sem pressa: servidor, UI web, espelho mobile,
         verificador em Python, tabelas og_*.

--- O DIA DO CORTE (26/08/2027) ----------------------------------------------
Passo 5  LEITURA FINAL em producao (somente leitura), com WHERE created_at
         < 2027-08-26T03:00:00Z -> manifesto -> raiz -> carimbo OTS.
Passo 6  Publicacao do manifesto + lista de folhas + hash em >= 3 testemunhas.
Passo 7  Classificacao (voce revisa as excecoes) -> ata assinada e carimbada.
Passo 8  Concessao dos selos -> frozen_at. Depois disso, nenhum selo novo, nunca.
```

**Repare no que aconteceu com o Passo do anúncio:** ele **subiu do meio da lista para o topo**. No desenho antigo ele era o quarto e vinha com um aviso em negrito de "só agora". Agora é o primeiro, e adiar é que sai caro.

> **O erro clássico do desenho antigo — e por que ele morreu.** A regra era *"toda conta existente **hoje** ganha o selo"*, com um "hoje" que só o dono conhecia. Anunciar antes da foto convidava todo mundo a criar conta naquela noite, e a lista ficaria poluída por uma corrida provocada pelo próprio anúncio. **Com um corte a onze meses e público, não existe corrida para uma data secreta, porque a data não é secreta.** Quem se cadastrar por causa do anúncio está fazendo exatamente o que a regra convida a fazer: entrar antes de 26/08/2027. Isso não é poluição da lista — **é a lista funcionando.**

**O incentivo residual que sobra, e ele é pequeno.** Com a janela aberta, ainda existe uma jogada teórica: **criar várias contas ao longo dos onze meses para "colecionar" selos**. Três observações antes de propor qualquer remédio:

1. **O selo não vale nada, de propósito.** Colecionar dez selos honoríficos rende dez enfeites. Enquanto a resposta ao OG4 for "(a) nenhum benefício", a jogada não tem prêmio — **a postura honorífica é, sozinha, quase toda a mitigação**. É a mesma razão pela qual a Seção 10.7 recomenda não dar benefício algum, só que agora com um motivo a mais.
2. **A regra antiga já dizia que o selo é da conta, não da pessoa** (caso duro nº 5), e continua sendo a resposta honesta: não existe jeito de provar "mesma pessoa" sem coletar mais dados do que este projeto coleta — e coletar mais dados para proteger um enfeite seria trocar um problema pequeno por um problema de LGPD.
3. **O que mudou de verdade foi outra coisa:** a justificativa do caso duro nº 4 ("conta vazia é elegível porque o corte é fixo e incluir vazias não abre nenhuma porta") **deixou de ser verdadeira**. Com a janela aberta, conta vazia criada no futuro é exatamente o que um colecionador produz.

> **Mitigação proposta, e é uma linha de SQL — não um processo novo:** para contas criadas **a partir do anúncio público**, exigir um **sinal de vida mínimo** antes do corte — **pelo menos um personagem criado** (a coluna `n_characters` que a leitura já conta, sem nenhum dado novo). Contas anteriores ao anúncio ficam isentas, porque ninguém pode ter burlado uma regra que ainda não existia.
>
> **Por que isso e não outra coisa:** não pede documento, não pede telefone, não pede CAPTCHA, não cria formulário, não guarda nada que já não se guarde, e derruba a jogada do colecionador em massa — que quer contas, não personagens. **E se você achar que é burocracia demais, a alternativa honesta é não fazer nada**: com selo honorífico, o pior cenário é alguém ter três enfeites em vez de um. Eu registro a opção; a decisão é sua (OG2).

---

#### 10.2.1 A decisão sobre o marco interino — ainda vale tirar uma foto hoje?

Esta é a pergunta que a mudança de regra abriu, e ela merece resposta explícita em vez de silêncio. **A leitura de hoje deixou de definir elegibilidade.** Então: ela ainda serve para alguma coisa, ou virou trabalho perdido?

**Minha recomendação: sim, faça — mas rebaixada de 🔴 bloqueante para 🟢 opcional e barata, e depois do vazamento de e-mail.** Três motivos, em ordem de peso:

1. **Ensaio geral com um ano de antecedência, e este é o motivo mais forte.** Em 26/08/2027 o script somente-leitura vai rodar **uma vez**, contra produção, num dia que importa, operado por um desenvolvedor que está aprendendo. Rodar o mesmo script de verdade agora — com as credenciais reais, o Postgres real e as surpresas reais — transforma o dia do corte num **segundo** uso, não no primeiro. O desenho antigo previa um "Passo 1: ensaio num Postgres local com dados falsos"; um ensaio com dados **verdadeiros** vale mais, e agora há tempo para ele.
2. **Fecha a janela de retrodatação das ~48 contas atuais.** A Seção 10.5 é honesta sobre o limite do carimbo: ele prova que ninguém foi acrescentado **depois**, e não prova que o `created_at` não foi mexido **antes**. Com o corte em agosto de 2027, essa janela de "confie em mim" passou de dois dias para **onze meses**. Um carimbo hoje a divide em dois pedaços menores e verificáveis: o que existia em set/2026 fica provado agora, e só o que for criado depois depende do carimbo final. É barato e reduz a única desconfiança que este desenho não consegue eliminar sozinho.
3. **Documenta a coorte fundadora, que é um objeto diferente da coorte OG.** As ~48 contas de hoje continuam sendo as destinatárias da **Era Zero** e da carta da Seção 8.5. Esse grupo existe, importa e **não é mais o mesmo grupo que o selo OG** — convém ter dele um registro datado.

**O que o marco interino explicitamente NÃO é** — e isto precisa estar escrito no próprio manifesto, senão daqui a dois anos alguém confunde:

> **`snapshot_type: "interim"`.** Este carimbo **não concede selo a ninguém e não nega selo a ninguém**. Ele é um registro informativo do estado do banco em setembro de 2026. **A lista OG é a que for lida em `2027-08-26T03:00:00Z`**, e só ela.

**Se você preferir pular:** nada quebra. Você perde o ensaio e o encurtamento da janela de confiança, e ganha meio dia. **É uma escolha legítima** — só não é a que eu faria, porque meio dia agora compra tranquilidade num dia que não vai poder dar errado.

*(E uma coisa que eu **não** recomendo: carimbar todo mês. Doze carimbos não provam nada que dois não provem, e criam um ritual que alguém vai esquecer de cumprir — o que é pior do que nunca ter prometido. **Dois carimbos: um agora, um no corte.**)*

### 10.3 A leitura somente-leitura — o que ela vê, e o texto da sua autorização

**O mesmo script roda duas vezes**, com um parâmetro diferente: uma vez agora (o marco interino de 10.2.1, opcional) e uma vez em 26/08/2027 (a leitura que vale). **Rodar duas vezes o mesmo código é a razão principal para fazer o interino** — o dia do corte deixa de ser a estreia.

**Uma única transação, somente leitura, sobre 2 tabelas.** O que ela faz, em linguagem de banco:

```sql
-- :CUTOFF e o UNICO parametro. Valores:
--   marco interino (hoje) : o instante em que o script rodar, lido do BANCO (db_now)
--   leitura final         : TIMESTAMPTZ '2027-08-26T03:00:00Z'   <-- a que vale
BEGIN TRANSACTION READ ONLY ISOLATION LEVEL REPEATABLE READ;  -- o Postgres RECUSA escrita aqui dentro
SET LOCAL statement_timeout = '30s';
SELECT now() AS db_now, current_setting('server_version');    -- a hora do BANCO, nao do seu PC
SELECT count(*) AS total_players FROM players;                -- contagem total, para conferir
SELECT p.email, p.name, p.created_at, p.updated_at,
       COALESCE(p.total_kills, 0)                                  AS total_kills,
       (SELECT count(*) FROM characters c WHERE c.email = p.email) AS n_characters
  FROM players p
 WHERE p.created_at IS NULL OR p.created_at < TIMESTAMPTZ :CUTOFF
 ORDER BY p.created_at, p.email;
COMMIT;
```

> **Uma sutileza que mudou de dono.** No desenho antigo, usar "o instante em que o script rodar" como corte era **proibido**, porque um corte escolhido depois de a lista existir pode ser acusado de ter sido escolhido *para* aquela lista. Isso continua verdadeiro — **e é exatamente por isso que o marco interino não concede selo nenhum**. Ele pode usar `db_now` sem culpa, porque não decide nada. **A leitura que decide usa a constante `2027-08-26T03:00:00Z`, que foi publicada onze meses antes** — e essa, sim, tem a propriedade de ter vindo antes dos fatos. A regra velha não foi abandonada; ela foi colocada no lugar certo.

| Coluna lida | Para quê | Sai do seu computador? |
|---|---|---|
| `email` | gerar o identificador opaco e permitir ligar a conta ao selo depois | **Não.** Vai só para o arquivo **privado e criptografado** |
| `name` | detectar `Agent G [IA]` e nomes de teste | Não |
| `created_at` | a regra de elegibilidade; entra na folha só como **dia** | só o dia, dentro do hash |
| `updated_at`, `total_kills`, `n_characters` | classificar "conta vazia" | Não |

**O que a consulta NÃO lê:** `password` (nem o hash bcrypt, nem sequer um "tem senha?"), qualquer token/JWT, `ghostdex_progress`, `favorites`, `chest_items`, `avatar_url`, `gallery_urls`, posição no overworld, nem qualquer coluna de `characters` além de contar linhas.

**Por que isto é seguro** (cada item é verificável lendo o script antes de rodar):

1. **`READ ONLY`:** o próprio Postgres rejeita `INSERT/UPDATE/DELETE/DDL` dentro da transação. **Não depende de ninguém "se comportar".**
2. **Trava só de leitura:** não bloqueia ninguém que esteja jogando ou salvando.
3. **~48 linhas hoje, talvez algumas centenas em 2027** (10.13): dura milissegundos nos dois casos; o `statement_timeout` impede uma consulta pendurada.
4. **`REPEATABLE READ`:** as duas leituras enxergam a **mesma foto**.
5. **`created_at IS NULL OR …`:** uma linha sem data **não some em silêncio** (em SQL, `NULL < x` é "desconhecido" e a linha seria descartada sem aviso). **Mas o sentido disso mudou com a janela aberta, e é importante:** hoje, um `created_at` vazio é quase certamente uma conta antiga, e incluí-la é o justo. Em agosto de 2027, um `created_at` vazio é um **sinal de alerta** — o aplicativo nunca grava essa coluna à mão, então uma linha sem data só pode ter vindo de escrita direta no banco. **Regra para a leitura final: linhas com `created_at` nulo entram no snapshot marcadas, mas vão para a sua revisão manual (caso duro nº 14), não para o selo automático.** E se o marco interino de 10.2.1 for feito, ele resolve isso de graça: qualquer linha sem data que apareça **nele** está provadamente entre as antigas.
6. **Conferência de contagem embutida:** total = (linhas devolvidas) + (linhas criadas depois do corte). Se não fechar, o script **aborta** e mostra a diferença.
7. **O script não contém nenhum caminho de escrita** — revisão por `grep` de `INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE` = **zero ocorrências**, conferida pelo `security-engineer` antes de rodar.
8. **Roda no seu computador**, com o `server/.env` que já existe. **Nenhuma credencial entra em conversa com agente nenhum.**

**Uma observação antes do texto, e ela sobreviveu à mudança de regra:** mesmo que você **pule** o marco interino do selo, **esta sessão de leitura continua sendo necessária por dois outros motivos que nada têm a ver com o corte** — (i) a **distribuição de níveis**, para dimensionar a Era Zero (Seção 9.4, trava a Fase 1′), e (ii) a **contagem de linhas com senha não migrada** (Seção 10.6, trava o item 3 da Fase 0-A′). Os dois já estavam no plano e os dois continuam de pé. **Ou seja: a autorização não perdeu a razão de existir; ela perdeu a pressa e ganhou outra justificativa.**

**O texto que eu preciso que você responda (pode editar) — agora sem urgência:**

> **Autorizo UMA leitura SOMENTE LEITURA no banco de produção do Danger Ghost, com estes limites:**
> 1. Tabelas: `players` (linhas com `created_at` anterior ao instante de corte informado ao script, ou vazio) e **uma contagem** de linhas em `characters` por conta.
> 2. Colunas: `email`, `name`, `created_at`, `updated_at`, `total_kills` e a contagem. **Não** ler senha, hash, token, ghostdex, baú, avatar nem posições.
> 3. Transação `READ ONLY`; nenhum `INSERT/UPDATE/DELETE/ALTER`; script revisado antes; executado **por mim, no meu computador**.
> 4. O resultado fica **só num arquivo criptografado meu**; publica-se apenas um manifesto com hashes (sem e-mail, sem nome) e a lista de impressões digitais.
> 5. **Autorizo, na mesma sessão, a leitura da distribuição de níveis** (`SELECT level, xp, world_level FROM characters ORDER BY level DESC`) para dimensionar a Era Zero.
> 6. **Esta execução é o MARCO INTERINO** (`snapshot_type: "interim"`): ela **não concede e não nega selo a ninguém**. A leitura que define a lista OG é a de `2027-08-26T03:00:00Z`, e eu a autorizarei de novo, com este mesmo texto, quando a data chegar.

> **E o texto guardado para agosto de 2027** — é o mesmo, trocando o item 6 por:
> 6. **Esta execução é a LEITURA FINAL** (`snapshot_type: "final"`), com `CUTOFF = TIMESTAMPTZ '2027-08-26T03:00:00Z'` (exclusivo), a constante anunciada publicamente em setembro de 2026. **A lista resultante é a lista OG definitiva.**

### 10.4 A regra de elegibilidade, e os casos duros

> **R-OG-1** *(revista em 24/09/2026)*. Uma conta é **OG** se, e somente se, **todas** estas condições forem verdadeiras:
> 1. existe uma linha em `players` com `created_at < CUTOFF`, onde **`CUTOFF = 2027-08-26T03:00:00Z`** (**exclusivo**) — equivalente a **meia-noite de Brasília entrando em 26 de agosto de 2027**, ou seja: **o dia 25/08/2027 conta inteiro, o dia 26 já não conta**;
> 2. a linha **não** está numa classe excluída, ou foi admitida por uma decisão registrada e assinada;
> 3. para contas criadas **a partir do anúncio público da regra**, há pelo menos **um personagem criado** antes do `CUTOFF` (o "sinal de vida" de 10.2 — **sujeito à sua decisão em OG2**; contas anteriores ao anúncio são isentas);
> 4. o selo é concedido **uma vez**, antes do `frozen_at`; depois dele **nenhuma conta nova pode recebê-lo por nenhum caminho**.
>
> **E uma condição que saiu da lista de propósito.** A versão antiga exigia, como item 2, que *"essa linha conste no snapshot cuja raiz Merkle foi publicada e carimbada"*. **Isso agora está errado, e a correção é conceitual, não cosmética:** o snapshot virou **prova**, não **fonte**. Se a leitura de 26/08/2027 falhar, for repetida, tiver um bug ou precisar ser refeita no dia seguinte, **ninguém perde o selo por causa disso** — o direito nasce do `created_at` contra uma constante que o mundo conhecia desde 2026. A raiz carimbada é o que torna esse direito **verificável por estranhos**; ela não é o que o cria.

**Por que o instante é escrito em UTC, e por extenso** *(o mesmo cuidado de sempre, aplicado à data nova)*: o "26 de agosto" do seu pedido é um dia de Brasília. Uma conta criada às 22:00 de Brasília do dia 25/08/2027 tem `created_at = 2027-08-26T01:00:00Z` — **"dia 25" para você, "dia 26" para o UTC**. Se a regra dissesse só "criada até 25/08/2027", essa mesma conta seria OG ou não conforme quem lesse. Escrever o instante absoluto elimina a dúvida.

**E três coisas a mais, que a data nova trouxe e a antiga não tinha:**

1. **O horário de verão.** O Brasil aboliu o horário de verão em 2019, então Brasília é UTC−3 o ano inteiro; e agosto nunca esteve dentro do antigo período de verão brasileiro, de todo modo. **Ainda assim, a constante que vale é a em UTC.** Se o horário de verão voltar antes de agosto de 2027, `2027-08-26T03:00:00Z` continua sendo exatamente o mesmo instante do universo — o que muda é só qual hora o relógio da parede vai estar marcando. **Uma decisão de política pública de 2027 não pode mexer em quem é OG**, e é assim que se garante isso.
2. **"Até dia 26" é ambíguo em português, e a ambiguidade é sua para resolver.** Adotei a leitura **exclusiva** porque a sua própria frase trata o dia 26 como o início do "depois". Se você quis o contrário, a constante vira `2027-08-27T03:00:00Z`. **Decida antes do anúncio** — depois dele, não se mexe (Seção 0.1).
3. **O relógio que vale é o do banco, não o do seu computador.** A consulta já lê `now()` do Postgres de propósito. Em 26/08/2027 isso deixa de ser detalhe: se a máquina de quem roda o script estiver com o fuso errado, a leitura ainda fica certa, porque a comparação acontece **dentro** do banco, contra um `TIMESTAMPTZ` literal.

**Os casos duros, com recomendação:**

| # | Caso | Recomendação | Motivo |
|---|---|---|---|
| 1 | Conta normal, e-mail de aparência real, com personagem | **Elegível** | é exatamente o que você descreveu |
| 2 | Conta de teste (`qa_*`, `test_*`, `@example.com`) | **Não elegível** | o selo é honra de pioneiro; conta de teste não é pessoa |
| 3 | Domínios descartáveis ou nomes óbvios de teste | **Você revisa, uma a uma**, com a lista em tela | regra automática erra; você conhece as contas |
| 4 | **Conta vazia**, nunca jogou, e-mail de aparência real | **Elegível se criada ANTES do anúncio.** Criada **depois** do anúncio: precisa de **1 personagem** (o "sinal de vida" de 10.2) | ⚠️ **Este caso mudou, e é o mais afetado pela janela.** A justificativa antiga era *"o corte é fixo, então incluir vazias não abre nenhuma porta"* — **e ela deixou de ser verdadeira**: com a janela aberta, conta vazia criada no futuro é exatamente o que um colecionador de selos produz. Para quem já estava aqui, nada muda: excluir magoaria um pioneiro real que só criou a conta e nunca voltou |
| 5 | Várias contas da mesma pessoa | **Todas elegíveis** — o selo é da **conta** | não existe jeito honesto de provar "mesma pessoa" (e tentar exigiria coletar mais dados). Como é honorífico, duplicar não rende nada |
| 6 | Duplicata por caixa (`Beco@…` e `beco@…`) | **Um selo só**, na linha alcançável pelo login | é a mesma caixa postal |
| 7 | Linha malformada (e-mails concatenados) | **Fora por padrão**, mas **entra no snapshot** marcada | não é uma conta utilizável; mas deixá-la fora da raiz seria **esconder um fato** |
| 8 | Conta criada dentro da janela e **apagada antes de 26/08/2027** | **Não entra** (não está na tabela no dia da leitura). Admissão tardia **só com evidência independente datada antes do corte** | a leitura final enxerga quem **está lá** naquele instante. ⚠️ **A janela de onze meses deixou este caso mais provável do que era**, porque agora há quase um ano para alguém se cadastrar, pedir exclusão de conta e depois voltar. **Diga isso no anúncio, em uma linha:** *"apagar a conta encerra a elegibilidade"* — é a única forma honesta de não ter essa conversa em 2027 |
| 9 | **`Agent G [IA]`** | **Sem selo**, e o rótulo `[IA]` continua obrigatório e visível | regra inegociável do workspace. E um selo de "pioneiro" **competiria com o `[IA]` no mesmo espaço visual acima do level** |
| 10 | Contas suas e da equipe, reais | **Elegíveis**, mas **contadas à parte** na estatística pública | eram pioneiros de verdade; esconder seria pior. A contagem separada corta a suspeita de favorecimento antes que ela apareça |
| 11 | Conta migrada do SQLite | **Elegível, sem numeração** | **[VERIFICADO]** a migração de 19/08/2026 **não preservou a data original** (`migratetosupabase.js:80-83` não passa `created_at`): para essas contas, `created_at` = dia da migração. **Numerar ("OG #17") seria inventar uma ordem que não existe** |
| 12 | Conta de menor de idade | **Elegível**; nada sobre idade entra na lista | a folha não guarda dado pessoal |
| 13 | Conta criada **a partir de `2027-08-26T03:00:00Z`** | **Nunca.** Depois do `frozen_at`, o gatilho do banco recusa o `INSERT` na tabela de concessões | é a regra, e é a metade do seu pedido que diz *"depois desta data as contas criadas vêm sem o selo OG"* |
| 14 | 🆕 **Linha com `created_at` nulo** encontrada na leitura final | **Não vira selo automático** — entra no snapshot marcada e vai para a sua revisão | o aplicativo nunca grava essa coluna à mão **[VERIFICADO]**, então uma linha sem data só pode ter vindo de escrita direta no banco. Hoje seria inofensivo; **em 2027, é o formato exato que uma retrodatação teria**. Se o marco interino (10.2.1) for feito, ele resolve o caso de graça |
| 15 | 🆕 Conta criada **dentro da janela**, joga normalmente, e passa para um Herdeiro **antes** de 26/08/2027 | **Elegível, e o selo acompanha a Linha** | é o desenho de 10.10 funcionando: o selo é da Linha. A Passagem não cria nem destrói elegibilidade |
| 16 | 🆕 **Muitas contas criadas em bloco** pela mesma pessoa durante a janela | **Vão para a sua revisão** (é o caso nº 3 aplicado a um padrão novo), **sem regra automática** | ⚠️ a jogada só existe porque a janela existe. **Mas o remédio principal não está aqui e sim no OG4:** sem benefício, colecionar selos rende colecionar enfeites. Não invente verificação de identidade para proteger um enfeite |

**Um achado tranquilizador [VERIFICADO], e ele ficou MAIS importante com a janela aberta:** o aplicativo **nunca** grava `created_at` à mão (é sempre `DEFAULT now()`), em nenhum caminho de criação de conta. **Só quem escreve direto no banco conseguiria retrodatar uma conta.** No desenho antigo isso protegia uma janela de dois dias; agora protege **onze meses**, porque é essa propriedade — e não o carimbo — que sustenta a confiança no `created_at` de tudo o que for criado daqui até agosto de 2027. **Consequência prática:** esse comportamento do código virou um invariante a proteger. Se alguém, em algum momento dos próximos onze meses, acrescentar um caminho que grave `created_at` explicitamente (uma importação, um script de migração, uma ferramenta de suporte), **isso enfraquece o selo inteiro** — e precisa ser tratado como mudança de consenso, não como refatoração.

### 10.5 Como se prova que ninguém entrou depois

**A boa notícia primeiro: esta parte ficou MAIS forte com a mudança de 24/09, e o motivo é simples.** No desenho antigo, a data de corte era escolhida e anunciada **depois** de a lista já existir — e a objeção natural de um cético era *"vocês olharam quem estava dentro e só então escolheram a data"*. O plano se defendia apontando para um arquivo datado de 21/09, o que é uma defesa razoável mas circular: era o próprio projeto atestando o próprio projeto.

**Agora essa objeção não tem onde se apoiar.** A constante `2027-08-26T03:00:00Z` é **pública, redonda e anunciada onze meses antes** de a maior parte das contas elegíveis sequer existir. Qualquer pessoa — inclusive um cético hostil, inclusive daqui a cinquenta anos — pode pegar o `created_at` de uma conta e comparar com um número que estava publicado, em várias testemunhas independentes, antes do fato. **Ninguém escolhe uma data para favorecer uma lista que ainda não existe.**

**O que o snapshot prova e o que ele NÃO prova** — e esta continua sendo a frase mais importante desta seção:

| Prova | Não prova |
|---|---|
| Que esta lista de N identificadores **existia inteira** antes do instante do carimbo | Que cada linha é **uma pessoa real distinta**. Quem controlava o banco **antes** do carimbo poderia ter inserido linhas fantasma |
| Que **depois** do carimbo ninguém acrescenta, tira ou troca uma linha sem mudar a raiz — e mudar a raiz é detectável por qualquer um | Que `created_at` não foi mexido **antes** do carimbo |
| 🆕 Que a **regra** (a constante do corte) veio antes dos fatos — porque ela própria foi publicada e carimbada em set/2026 | 🆕 Nada sobre **quantas** pessoas distintas entraram durante a janela. Onze meses de janela é tempo de sobra para alguém criar várias contas legítimas (caso duro nº 16) |

**Por que isso basta para um selo honorífico:** o pior que um operador desonesto conseguiria, antes do carimbo, seria dar um selo *honorário* a um amigo — dano de reputação, sem token, sem XP, sem vantagem. Depois do carimbo, nem isso.

> **Uma honestidade que a janela obriga, e eu prefiro escrevê-la do que deixá-la implícita.** A frase do desenho antigo era *"quanto mais cedo o carimbo, menor a janela em que essa desconfiança pode existir"* — e ela era um argumento para carimbar naquela semana. **Essa janela agora dura onze meses, e não tem como encurtá-la sem desobedecer à sua decisão**, porque é a própria regra que a mantém aberta. O que resta é o seguinte, e é suficiente para um enfeite: (i) o aplicativo nunca escreve `created_at` à mão, então retrodatar exige escrita direta no banco; (ii) o marco interino de 10.2.1, se feito, corta essa janela em dois pedaços menores; (iii) o selo não vale nada, então a recompensa por trapacear é zero. **Três defesas fracas que, somadas, bastam — e eu não vou fingir que são mais do que isso.**

**Duas coisas a carimbar, não uma.** O manifesto final de 2027 é o carimbo óbvio. Mas o que precisa de carimbo **hoje** é **o anúncio da regra**: o texto que diz "o corte é `2027-08-26T03:00:00Z`". Custa zero (é o mesmo OpenTimestamps sobre um arquivo de texto de duas linhas), e é o que transforma "eles dizem que anunciaram em 2026" em algo conferível. **Faça isso no dia do anúncio** — é literalmente cinco minutos e fecha o único flanco que o desenho novo tinha em relação ao antigo.

**A regra de hash — `DGOG1`, canônica** (o veredito da Seção 0.7):

```
leaf_hash = SHA-256( 0x00 || "DGOG1|leaf|" || og_id (32 bytes) || created_day (uint32 big-endian) )
no_interno = SHA-256( 0x01 || filho_esquerdo || filho_direito )
folhas ordenadas por leaf_hash  ->  a ORDEM DE CRIACAO NAO VAZA
divisao dos nos: RFC 6962 (Certificate Transparency)
```

- **`og_id`** = 32 bytes aleatórios do gerador do sistema, **um por conta**, guardados só no arquivo privado. **Nunca derivados do e-mail** — um e-mail tem espaço de busca minúsculo, e um hash dele seria quebrado por dicionário em minutos (é o mesmo erro que a Seção 7.4 item 2 proíbe).
- **Só o dia**, nunca o instante: menos dado, menos reidentificação. **Honestidade:** com ~48 pessoas, o dia **ainda** pode reidentificar uma folha para quem conhece bem o grupo. A folha é **pseudônima, não anônima** — e isso tem que constar do registro de tratamento de dados. *(Com a janela de onze meses e algumas centenas de contas, a reidentificação fica mais difícil na média — mas **não para as ~48 contas antigas**, que continuam concentradas em poucos dias de 2026. A frase acima permanece verdadeira exatamente para quem ela sempre protegeu menos.)*
- **Por que RFC 6962 e não o Merkle "cru" do Bitcoin:** o do Bitcoin duplica o último elemento quando o número de folhas é ímpar e não separa folha de nó — o que causou uma classe de bug real de mutabilidade. O RFC 6962 evita isso, é padrão publicado, tem implementações auditadas em várias linguagens, e dá **prova de inclusão pequena**: com 48 folhas, 6 irmãos = **192 bytes**. **E a janela maior não estraga isso** — a prova cresce com o *logaritmo* do número de contas: mesmo com 500 folhas são 9 irmãos = **288 bytes**; com 5.000, 13 irmãos = **416 bytes** **[CÁLCULO]**. É a propriedade que faz o desenho aguentar a lista crescer dez vezes sem mudar nada.

**O carimbo — OpenTimestamps, gratuito:** você calcula a impressão digital do manifesto; servidores públicos ("calendários") juntam milhares de impressões numa árvore e gravam **a raiz** numa transação do Bitcoin; você recebe um arquivinho `.ots` com o caminho até aquele bloco. No começo ele diz "pendente"; depois de algumas horas, o `upgrade` completa o caminho até o cabeçalho do bloco — **e a partir daí o carimbo não depende mais de calendário nenhum** **[VERIFICADO em opentimestamps.org e no README oficial, 2026-09-21]**.

| Ponto | Fato |
|---|---|
| Custo | **Gratuito**, sem cadastro e sem chave |
| Tempo até valer | "algumas horas" até a atestação no Bitcoin |
| O que o calendário vê | **só a impressão digital**, opaca — nunca o arquivo |
| Para um iniciante no Windows | **o site faz o hash no próprio navegador** e devolve o `.ots`, sem instalar nada. No dia seguinte você volta e baixa a versão "melhorada" |
| O que a prova diz | *"esta impressão existia antes do bloco N"*. É um **limite superior** de data |

**Limites honestos:** depende de o Bitcoin existir e ser verificável por décadas — **ninguém garante isso para 3147**. Por isso a política é **re-carimbar o manifesto periodicamente** e manter **testemunhas múltiplas** (repositório público com commit assinado, Internet Archive/Software Heritage, hash postado nos canais oficiais). Um `.ots` "pendente" **não vale** como prova final; o procedimento tem um passo de calendário ("voltar em 1 dia e fazer o upgrade") para ninguém esquecer.

**Três artefatos:**

| Arquivo | Conteúdo | Onde vive |
|---|---|---|
| **privado, criptografado** | por linha: `og_id`, `email`, `name`, `created_at`, dia, contadores, classe automática | **só com você**, 3 cópias em 2 mídias, 1 fora de casa; **nunca** no repositório, nunca em chat |
| **manifesto** (público) | corte, hora do banco, versão do Postgres, total de contas, número de folhas, **raiz**, algoritmo, formato da folha, hash do script, hash do arquivo privado já cifrado | repositório + testemunhas |
| **lista de folhas** (público) | **todas** as impressões, ordenadas, uma por linha (~1,5 KB com 48 contas; ~16 KB com 500) | idem |

**Publicar as impressões não vaza nada** — cada folha contém um `og_id` aleatório que ninguém além de você conhece —, e **permite que qualquer pessoa recompute a raiz sozinha** e confira a contagem. Auditoria total, privacidade intacta.

> **Um efeito colateral bom da janela maior, sobre privacidade.** A Seção 10.5 admite que, **com ~48 pessoas**, o dia de criação ainda pode reidentificar uma folha para quem conhece bem o grupo — a folha é pseudônima, não anônima. **Com algumas centenas de contas espalhadas por onze meses, essa reidentificação fica bem mais difícil**, simplesmente porque cada dia passa a ter mais de uma conta. Não é razão para mudar nada no desenho, e não vira uma promessa de anonimato — mas é a única coisa nesta seção que a mudança de regra melhorou de graça, e vale registrar.

**Como verificar depois:** (V1) recomputar a raiz a partir da lista pública; (V2) recomputar numa **segunda implementação, em outra linguagem** — é o critério de aceite da Seção 0.7; (V3) conferir o carimbo no site do OpenTimestamps; (V4) conferir a contagem contra o marco interino carimbado em set/2026 e contra os documentos datados; (V5) conferir a assinatura do commit; (V6) cada jogador OG valida o próprio certificado; (V7) 🆕 **conferir que a constante do corte publicada no anúncio de set/2026 é a mesma que aparece no manifesto de ago/2027** — se as duas divergirem, a lista inteira é suspeita, e essa é a verificação mais barata e mais importante das sete.

### 10.6 🔴 Os dois pré-requisitos — e a armadilha da senha antiga

**Pré-requisito 1 — o vazamento de e-mail** (Bloqueio 1, Seção 0.7). O campo `og` **não entra** no `sync_state` nem no payload do overworld antes de: (i) `players: players` virar **lista branca de campos**; (ii) o `email` sair do payload do overworld; (iii) o cliente passar a filtrar por **id público opaco**; (iv) o espelho do mobile receber a **mesma** mudança; (v) o `qa-lead` verificar com duas contas descartáveis em dois aparelhos.

**Pré-requisito 2 — a senha em texto puro. Era o achado mais desconfortável do v2, e a decisão de 24/09 desarmou metade dele:**

> As senhas eram **texto puro até 18/08/2026**, quando passaram a bcrypt, com migração automática do hash **no próximo login**. A migração do SQLite para o Supabase foi em **19/08/2026 — um dia depois**.
>
> **O problema original, como o v2 o descreveu:** as contas de maior valor simbólico do projeto (a coorte OG, fechada e para sempre inexpansível) eram **exatamente** aquelas cujas senhas podem ter circulado em claro — em backups antigos, dumps, logs, ou reutilizadas pelos jogadores em outros serviços que vazaram. A sobreposição entre "coorte OG" e "coorte de senha fraca" era de praticamente 100%.

> **🟢 O que a janela de 2027 mudou, e é a melhor notícia colateral desta revisão.** A coorte OG deixou de ser um sinônimo da coorte pré-bcrypt. **Toda conta criada de 18/08/2026 em diante já nasce com bcrypt** — e, como a janela vai até agosto de 2027, essas contas devem ser **a grande maioria** da lista final (a conta está em 10.13: entre ~50% e ~90% do total, conforme o cenário de crescimento **[CÁLCULO sobre HIPÓTESE]**).
>
> **A sobreposição caiu de ~100% para uma minoria identificável.** O risco **não sumiu** e **não encolheu para quem ele já atingia** — ele apenas parou de definir o grupo inteiro.

**Quem ainda está exposto, exatamente:** as **~48 contas anteriores a 18/08/2026** — e, dentro delas, principalmente as de quem **nunca mais logou**, porque o hash só migra no próximo login. Para essas, a correção de 18/08 **não resolve** três coisas: backups antigos; senhas reutilizadas fora daqui; e a linha que pode ainda ter texto puro.

**Quem NÃO está exposto:** todo mundo que se cadastrar de hoje até 26/08/2027. **Para esses, os itens 2 e 3 abaixo não se aplicam** — exigir troca de senha de quem nunca teve senha fraca seria atrito sem ganho, e é o tipo de regra que, aplicada a uma lista de centenas de pessoas, transforma uma comemoração num aborrecimento.

**O que fazer, e isto é bloqueante para a reivindicação do selo — mas só para a coorte anterior a 18/08/2026:**

1. **Verificar quantas linhas ainda têm senha em formato não-bcrypt** — uma linha de SQL somente-leitura, que **não expõe valor nenhum** (só conta). Pode ir na mesma autorização da Seção 10.3.
2. **Forçar troca de senha** nessas contas (usando o `token_epoch` da Seção 9.3, que derruba todas as sessões).
3. **Exigir confirmação por e-mail** antes de conceder/reivindicar o selo de qualquer conta nessa situação. *(E isso depende do e-mail transacional da Fase 0-B — sem ele, qualquer janela de contestação é letra morta.)*
4. **Nenhum backup anterior a 18/08/2026 pode existir fora de armazenamento cifrado.**

*(Honestidade: este é um cenário **fundamentado**, não medido — o banco de produção não foi consultado, então ninguém sabe quantas linhas ainda têm senha não migrada. A consulta do item 1 é justamente o que transforma a hipótese em número.)*

### 10.7 Por que honorífico — e o que cada benefício custaria

**A recomendação é: sem token, sem XP, sem vantagem.** Seis razões que se somam:

1. **Quase nada a regular.** Um selo sem valor de troca, sem direito a token e sem vantagem não é um "ativo" que alguém compre, venda ou receba como contraprestação.
2. **Não fura a régua.** Num jogo de 1.122 anos, **um bônus pequeno hoje vira um abismo intransponível daqui a séculos**.
3. **Não cria casta entre Linhas.** Todas começam a curva do mesmo ponto (Era Zero). O selo é **reconhecimento**, não vantagem de partida.
4. **Tira o incentivo à venda e ao farm — e esta razão SUBIU de importância em 24/09.** Sem benefício, uma conta OG vale pouco no mercado paralelo. **A justificativa antiga era que "não havia por que criar contas em massa antes do corte", porque o corte já tinha passado. Isso deixou de valer:** agora existem onze meses em que qualquer pessoa pode criar quantas contas quiser, todas legitimamente elegíveis. **A postura honorífica passou a ser a defesa principal contra isso** — e ela é uma defesa de desenho, que não precisa de detecção, de verificação de identidade nem de vigilância. Se o selo não vale nada, criar cem contas rende cem nadas. *(Ver também o caso duro nº 16 e a mitigação do "sinal de vida" em 10.2.)*
5. **Nada de "pré-mineração".** Reservar qualquer alocação futura a uma lista fechada de ~48 pessoas seria, na prática, **uma alocação a um grupo fechado de insiders** — exatamente o tipo de coisa que um regulador olha primeiro.
6. **Simplifica a LGPD.** Selo honorífico é dado de baixo risco; selo que vale dinheiro é dado de valor, com obrigações maiores.

| Benefício que alguém pode sugerir | Risco legal | Risco de jogo | Recomendação |
|---|---|---|---|
| Token / airdrop para as contas OG | **alto** | pressão de venda, quebra "lançamento justo" | **Não** |
| Bônus de XP / nível / multiplicador | médio | **fura a régua**, e o efeito **cresce** por séculos | **Não** |
| Item exclusivo negociável | alto | mercado paralelo instantâneo | **Não** |
| Desconto de taxa em marketplace futuro | médio | incentiva comprar conta OG | **Não** |
| Voto na governança | médio | concentra poder nos primeiros, por séculos | **Não** (no máximo voz **consultiva**) |
| **Cosmético não negociável** (moldura, cor, título "First Keeper") | **baixo** | nenhum, se intransferível e sem efeito de combate | **Único aceitável**, se você quiser algo além |
| **Uma "Sala dos Primeiros Guardiões" na Crônica** (com consentimento para exibir o nome) | baixo | nenhum | **Recomendado** — é honra, não vantagem |

> **Regra de teste para qualquer benefício futuro:** *"se este benefício pudesse ser vendido por dinheiro, seria um problema?"* Se sim, não faça. **E note a consequência, que ficou bem mais pesada com a janela aberta:** se você decidir dar um benefício, as decisões de elegibilidade (contas de teste, vazias, duplicadas) **deixam de ser detalhe e viram decisões de alto risco**, e o anúncio passa a precisar de revisão jurídica antes.
>
> **A diferença de escala, dita sem rodeios.** No desenho antigo, dar um benefício ao selo significava distribuir algo de valor a **~48 contas já existentes e fechadas** — um erro caro, mas limitado e estático. No desenho novo, significaria **publicar, por onze meses, um convite aberto para criar contas que valem dinheiro**. Isso não é um selo com um bônus: é um programa de distribuição com inscrições abertas, e ele atrairia exatamente o público que um projeto de um desenvolvedor solo não tem como filtrar. **A recomendação "(a) nenhum benefício" já era forte; com a janela, ela virou estrutural.**

### 10.8 LGPD — a cadeira vazia

| Situação | O que acontece | O que fica |
|---|---|---|
| Keeper pede exclusão de dados | apaga-se o **vínculo** (`og_links`) e registra-se o evento. O selo **deixa de ser exibido** | a folha continua na raiz como **cadeira vazia**: sem nome, sem e-mail, sem `og_id` |
| A Crônica preserva? | sim, **anonimizado**: o **número** de pioneiros e o fato "uma Linha fundadora se encerrou" | texto sugerido: *"One First Keeper asked to be forgotten. Their seat remains empty."* |
| Você pode reatribuir esse selo? | **Nunca.** Depois do `frozen_at`, a contagem de OG **nunca aumenta e nenhuma cadeira é reocupada** | senão a exclusão viraria um jeito de "abrir vaga". *(Durante a janela — até 26/08/2027 — a contagem naturalmente cresce, porque a lista ainda está aberta. **"Nunca aumenta" vale a partir do congelamento**, não a partir de hoje: é a única frase desta tabela que a janela obrigou a datar.)* |
| A pessoa guardou o certificado e volta depois | pode **religar voluntariamente**, apresentando o `og_id`. Você não guardou nada — **quem carrega o segredo é ela** | reversível só por iniciativa dela |

**Limite honesto declarado:** numa lista pequena, uma folha pseudônima é reidentificável por quem conhece o grupo — e isso vale em cheio para as **~48 contas de 2026**, que ficam amontoadas em poucos dias. **Não afirmo que a folha é anônima**; afirmo que o operador **não guarda o vínculo** depois da exclusão. É uma posição defensável, não uma garantia legal — e precisa de parecer. *(A janela até 2027 dilui o problema para as contas novas, mas **não** o resolve para as antigas, e é sobre as antigas que a pergunta tende a aparecer.)*

### 10.9 A interface — onde o selo aparece, e onde ele NÃO aparece

**O mapa real do cliente**, com arquivo e linha conferidos em 2026-09-21 **[VERIFICADO]** — *e reconfirme a linha antes de editar, porque o cliente muda*:

| Superfície | Onde o selo entra | Prioridade |
|---|---|---|
| **Episódio 1 — jogador local** (`engine.js:1273-1282`) | **imediatamente acima do `Lv.`** | **P0** — é literalmente o seu pedido |
| **Episódio 1 — outros jogadores** (`engine.js:3785-3789` **e** `:3802-3806`) | idem, **nos DOIS ramos** (sprite customizado e padrão) | **P0** — esquecer um é o erro provável |
| **Overworld — outros jogadores e local** (`overworld.js:3333`, `:3341`, `:3365`) | **entre o nome e o `Lv.N`**: nome / selo / `Lv.N` / sprite | **P0** |
| **Overworld — marcador genérico** (imagem não carregou) | mesma ordem, para manter paridade | **P0** |
| **HUD do topo** (`engine.js:2727`) | **à direita** do `LV n` — **não dá para pôr acima**, porque a faixa de cima já é o `LEVEL : <episódio>` | **P0**, exceção documentada |
| **Seleção de personagem** (cartões, `game_core.js:386-397`) | uma linha **acima** de `Level:` em cada cartão + um selo no cabeçalho | **P0** |
| Painel HERO STATUS, modal EQUIP/STATUS, painel lateral RPG, Ghostdex | acima da linha `LEVEL:` | P1 |
| Tela de vitória | à direita (não há espaço acima) | P2 |
| **Ranking** | **NÃO agora** — o "ranking" de hoje é **só `localStorage` do próprio jogador**, não um ranking global | NÃO |
| **Chat global** | **NÃO, e isto é de segurança:** o chat roda num **broker MQTT público de terceiros**, onde qualquer cliente publica qualquer JSON. Um selo ali seria **forjável por qualquer um** e daria falsa autoridade. Nem "OG" no apelido deve ser tratado como selo | **NÃO** |
| Modal de perfil (`index.html:1186`) | **NÃO** — procurei e **não existe código que preencha esse id**; é uma tela não ligada | NÃO |

**O desenho:** uma **plaquinha de HUD neon** — retângulo de cantos chanfrados com as letras **`OG`**, contorno em gradiente ciano→magenta (as duas cores de identidade do jogo), fundo escuro quase opaco, letras brancas desenhadas na grade de pixels. **Não usa amarelo** (é a cor do próprio `Lv.`), nem verde (HP), nem vermelho (perigo).

**Três detalhes que decidem se fica bom ou ruim:**

1. **Tamanho no celular.** O canvas do mobile é 640×480 e é **reduzido por CSS**: num celular de 375 px em pé, o fator é ~0,55 — então um selo de 12 px lógicos vira **~6,5 px na tela, ilegível**. **Regra fixada: altura mínima de 10 px CSS na tela**, o que dá ~18 px lógicos no mobile contra 12 no site.
2. **Custo zero por frame.** O sprite é **pré-renderizado uma vez** (em 1× e 2×) e desenhado com um único `drawImage` em coordenadas inteiras. **Nunca** chamar `GhostRPG.getStats()` para saber se há selo — o rótulo do jogador local já faz isso todo frame e o próprio HUD comenta que essa função **faz deep-copy do estado**. O selo lê uma **bandeira em cache**.
3. **Falha fechada.** Se o servidor não confirmou (banco fora do ar no boot, resposta perdida), **nada é desenhado** — nunca "desenhar por via das dúvidas", nunca um esqueleto "provisório".

**Os textos (o jogo é 100% em inglês):**

| Contexto | Inglês (o que o jogador vê) |
|---|---|
| Tooltip padrão | *"OG — First Keeper. This account was created on or before Aug 25, 2027 (Brasília time), during the founding window. Honorary only: no bonus, no advantage."* |
| Tooltip de Linha já passada | *"OG Line — founded by a First Keeper during the founding window, on or before Aug 25, 2027. Now kept by Generation {N}."* |
| Certificado | *"Keep this file. It proves you were here at the founding — even if this server is gone."* |
| Opção de privacidade | *"Show my OG seal to other players"* |
| 🆕 Enquanto a janela está aberta (site, tela de cadastro) | *"The founding window closes on Aug 26, 2027. Accounts created before it carry the OG seal. Honorary only: no bonus, no advantage, nothing to buy."* |
| 🆕 Depois do fechamento | *"The founding window is closed. The OG list was sealed on Aug 26, 2027 and will never grow again."* |

> **Duas observações de redação que a janela obrigou.** (1) O certificado dizia *"you were here **first**"*; com centenas de pessoas ao longo de onze meses, "first" vira exagero e exagero envelhece mal — trocado por *"at the founding"*, que é verdadeiro para todo mundo da lista. (2) **O texto da janela aberta tem que dizer "nothing to buy" desde a primeira versão.** Um aviso de contagem regressiva é, por natureza, um gatilho de urgência; sem a frase que desarma a expectativa de valor, ele lê como pré-venda. As palavras proibidas abaixo continuam proibidas, e agora aparecem num texto que vai ficar no ar por onze meses — revise-o com mais cuidado do que revisaria um tooltip.

**Palavras proibidas no texto público:** "investment", "early adopter reward", "exclusive asset", "airdrop", "will be valuable". **Palavras corretas:** "recognition", "honor", "seal".

*(A sigla "OG" fica **sem expansão oficial** — não inventei "Original Ghost" nem nada parecido, porque você não disse. O tooltip explica o significado por extenso: "First Keeper". Se você quiser uma expansão, é uma decisão sua.)*

**Critérios de aceite visuais** (cada um é uma captura de tela, antes e depois): o selo fica imediatamente acima do `Lv.` com 2 px de folga e sem borrão; funciona nos **dois ramos** do desenho de outros jogadores; a ordem no overworld é nome/selo/`Lv.`/sprite em três níveis de zoom; no celular em pé e deitado as letras "O" e "G" são distinguíveis a olho nu; **um cliente que emite `og:true` não aparece com selo para os outros**; com o registro fora do ar, **nenhum selo é desenhado**; um APK antigo recebendo o campo **não dá erro no console**; e com `Lv. 100000000000` o selo não colide nem sai do canvas.

### 10.10 O selo na sucessão: "OG Line", não "OG player"

O selo **acompanha a Linha**. Quando a conta passa para o Herdeiro, **nada muda no registro** — muda só a frase: de *"OG"* para *"OG Line … Generation 3"*.

**Por quê:** o plano inteiro trata a conta como **o artefato herdado**. Um selo que sumisse na Passagem tornaria o primeiro Keeper o único OG possível e transformaria a Passagem numa **perda de ativo** — um desincentivo a passar a conta, contra o coração do conceito. O selo que *acompanha* dá ao Herdeiro um motivo de orgulho, não de inveja.

**E a observação mais fina do conjunto, que vale como regra de escrita:** *o termo é "OG Line", não "OG player" — o Keeper nº 3 não é um dos primeiros; **a Linha é**.*

### 10.11 Esforço e fase

| Bloco | O que entra | Esforço **[HIPÓTESE]** | Fase |
|---|---|---|---|
| **A0. Anúncio da regra** 🆕 | fixar a constante + texto público + carimbo OTS do próprio anúncio + publicação em ≥ 3 testemunhas | **~0,3 dia** (quase tudo seu) | **agora** — e é o que substitui a antiga "parte urgente" |
| **A1. Marco interino** (opcional, 10.2.1) | script somente-leitura + verificador em 2 linguagens + ensaio local + leitura interina + carimbo + publicação | **1,5–2,5 dias** (o **seu** tempo é ~0,5 dia) | quando der, depois do vazamento de e-mail |
| **A2. Leitura final + classificação** | rodar o **mesmo** script com o `CUTOFF` final + raiz + carimbo + publicação + você revisa as exceções + ata | **0,5–1 dia** (porque A1 já resolveu o script) | **26–31/08/2027** |
| **B. Registro + servidor** | tabelas `og_*`, gatilhos, concessão, conjunto em memória, campo `og` no login e na vizinhança, **lista branca do `sync_state`** | **2,5–4 dias** | 0-A′ / 3′ |
| **C. UI web** | fábrica do sprite, os pontos P0/P1, CSS, tooltips, acessibilidade | **3–4 dias** | 3′ |
| **D. Espelho mobile + APK** | mesmas mudanças em `www/`, `cap sync`, APK novo, `?v=` | **1,5–2,5 dias** | 3′ |
| **E. Certificado + prova** | evento de certificado, tela, verificador no cliente, opção de ocultar | **1,5–2 dias** | junto da Era Zero |
| | **Núcleo visível (A0+A1+B+C+D)** | **~9–13 dias-dev** (inalterado — A2 sai do MVP e cai em ago/2027) | |

**A resposta direta: sim, o selo continua sendo uma vitória barata — e ficou um pouco mais barata.** É **aditivo** (só cria tabelas e um campo novo), é honorífico, você **pediu**, ele **compensa emocionalmente a Era Zero** (o reset do nível), e reaproveita uma correção que **vale por si só** (a lista branca do `sync_state`).

**O que a janela mudou no cronograma deste bloco, em três linhas:**

- **O esforço total é o mesmo**, mas ele **se espalha**: o que era um sprint de uma semana virou um item de 0,3 dia agora, um opcional de 1,5–2,5 dias quando der, e 0,5–1 dia em agosto de 2027.
- **A parte irreversível deixou de custar horas de trabalho e passou a custar zero** — é o anúncio. O que custa é **acertar a constante antes de falar**.
- ⚠️ **Mas apareceu uma obrigação nova que não existia:** a UI do selo (blocos C e D) agora precisa estar **pronta e no ar antes de 26/08/2027**, ou você vai fechar a janela de fundação sem ter nada para mostrar a quem entrou por causa dela. **Isso amarra o selo ao calendário do lançamento pela primeira vez** — ver 10.13.

### 10.12 Nota de futuro (uma linha, e só)

Quando (e se) a blockchain própria existir, a raiz OG já carimbada pode entrar no bloco de gênese como constante, com a regra congelada *"o conjunto OG é fechado"*, e cada jogador prova o selo com 32 bytes + a prova de inclusão (192 bytes com 48 folhas, 288 com 500), sem servidor nenhum. **Isso é assunto do documento da blockchain, que está congelado — e nada nesta seção depende disso.** O selo funciona inteiro, hoje, em Web2.

*(Uma consequência pequena da janela: essa constante de gênese **só pode ser escrita depois de 26/08/2027**. Como a blockchain só começa depois do Episódio 2, isso não atrasa nada — mas é bom que esteja anotado, para ninguém tentar congelar a raiz antes de a lista fechar.)*

### 10.13 🆕 Quantas contas isso vira — e o selo continua significando o que você quer?

*(Esta seção nasceu da decisão de 24/09. **É uma observação, não uma proposta de mudar a sua regra** — o corte é seu e eu não recomendo mexer nele. Mas você merece ver o número antes de anunciar, porque depois do anúncio ele não volta atrás.)*

**A conta, com as hipóteses na mesa.** A janela vai de hoje (24/09/2026) a 26/08/2027: **336 dias ≈ 11,0 meses** **[CÁLCULO]**. Hoje existem **~48 contas** (número que aparece em documentos datados do projeto; **ninguém consultou a produção para confirmá-lo**). A taxa histórica de cadastros **não é conhecida** — então, em vez de fingir que é, eu dou três cenários e digo de onde vem cada um:

| Cenário **[HIPÓTESE]** | De onde vem | Novas contas | **Total OG** | Fator |
|---|---|---|---|---|
| **Conservador** — 4 contas/mês | o jogo segue como está, sem lançamento e sem campanha | ~44 | **~92** | **1,9×** |
| **Médio** — 12 contas/mês | o anúncio do selo + divulgação nos canais existentes surtem efeito moderado | ~132 | **~180** | **3,8×** |
| **Alto** — 40 contas/mês | o lançamento (G3) acontece **dentro** da janela e vai bem | ~442 | **~490** | **10,2×** |

**[CÁLCULO]** sobre taxas **[HIPÓTESE]**. Todos os três são plausíveis e **nenhum deles é uma previsão** — a incerteza aqui é de uma ordem de grandeza, e eu não tenho como reduzi-la sem dados que o plano proíbe consultar.

**A leitura honesta, sem exagero e sem alarmismo:**

- **Entre 92 e 490 pessoas ainda é um grupo pequeno.** Não é "todo mundo". Um jogo com dez mil jogadores em 2030 olharia para uma lista de duzentos nomes de 2026–2027 e veria, sem esforço, um grupo fundador. **A palavra "pioneiro" sobrevive a esses números.**
- **Mas o selo mudou de sentido, e vale dizer qual.** Ele deixou de significar *"eu estava aqui antes de o jogo virar um projeto sério"* (~48 pessoas, um fato quase privado) e passou a significar **"eu estava aqui no primeiro ano"** — uma coisa maior, mais comum e mais fácil de conquistar. **As duas são honras legítimas; são honras diferentes.** Se a imagem na sua cabeça era a primeira, o número acima é a hora de saber.
- **O que NÃO acontece:** o selo não vira inflacionado ao ponto de não dizer nada, e não perde a propriedade de ser **para sempre fechado** — que é de onde vem a maior parte do significado. Depois de 26/08/2027, a lista nunca mais cresce, tenha ela 92 ou 490 nomes.
- **E há um ganho que a diluição traz:** um grupo de 48 é frágil demais para o próprio conceito. A Seção 12 (risco 2) mostra que a chance de **alguma** das ~48 Linhas de hoje chegar a 3147 é de **até ~11%, e provavelmente 3–5%** — e diz, com todas as letras, que **"volume também importa: é por isso que a comunicação importa"**. **Uma janela de onze meses é, literalmente, a mecânica de volume que aquele risco pedia.** Com 180 Linhas fundadoras em vez de 48, o mesmo cálculo melhora. **Isto não é um efeito colateral: é provavelmente a maior vantagem não intencional da sua decisão.**

> **Em uma frase, se você só quiser uma:** a janela troca **exclusividade** por **robustez do conceito**, e para um jogo que precisa de gente para atravessar 1.100 anos, essa troca me parece boa. **Mas é uma troca, e a escolha é sua.**

**Três ajustes que eu recomendo se você mantiver a regra** (nenhum deles mexe no corte):

1. **Conte à parte, na estatística pública, as contas anteriores a 22/09/2026.** É o mesmo recurso que a Seção 10.4 (caso nº 10) já usa para as suas contas e as da equipe: não cria uma casta, não dá vantagem nenhuma, e preserva a informação de quem chegou primeiro sem inventar um segundo selo. **Recomendo fortemente contra um "selo OG dourado" ou qualquer hierarquia visual dentro dos OG** — isso reintroduz todos os problemas do 10.7 de uma vez.
2. **Use "founding window" / "fundação", não "first"** nos textos públicos (já refletido nos tooltips de 10.9).
3. **Publique a contagem quando a lista fechar.** Um número final publicado é o que impede a fantasia de que a lista é maior ou menor do que é.

---

#### 10.13.1 A interação nova: o corte e a data de lançamento agora conversam

Isto não existia no desenho antigo e é a consequência menos óbvia da mudança. **O corte (26/08/2027) caiu exatamente em cima da faixa em que o lançamento (G3) pode acontecer** (Seção 11.7):

| Ritmo | Lançamento previsto | O corte cai… | O que o selo acaba significando |
|---|---|---|---|
| **B** (5 dias/semana) | **~mar/2027 a ~jun/2027** | **depois** do lançamento | **toda a primeira onda de jogadores é OG.** É o cenário "Alto" da tabela acima. O selo vira "eu estava no lançamento" |
| **A** (3 dias/semana) | **~jul/2027 a ~nov/2027** | **em cima ou antes** do lançamento | **grande parte de quem chegar pelo lançamento fica de fora.** O selo continua próximo do sentido original — mas você vai anunciar o jogo para um público que **acabou de perder** algo que os anteriores têm |

**Não existe resposta certa aqui, e eu não vou fingir que existe.** O que existe é uma armadilha a evitar: **descobrir isso em julho de 2027**, quando a data já foi anunciada e o lançamento estiver atrasando. As duas saídas honestas, se o Ritmo A se confirmar:

- **Aceitar e comunicar bem:** *"a janela de fundação fechou; quem entrou antes do lançamento carregou o jogo nas costas"*. É defensável e verdadeiro.
- **Lançar antes do corte, nem que seja o MVP enxuto**, tratando 26/08/2027 como uma data de produção real e não só como uma linha no banco.

**O que eu recomendo agora:** nada além de anotar a interação e revisitá-la no **portão G2**, quando a data de lançamento deixa de ser uma faixa e vira uma estimativa. **E não mexer no corte por causa disso** — mover uma data anunciada é bem pior do que qualquer um dos dois cenários acima.

---

## 11. Roadmap

*(fontes: `raw/11_roadmap_produtor.md` e `chain/26_roadmap_v2_produtor.md`, com a metade de blockchain removida — ela vive no outro documento)*

**Unidade:** um **dia de trabalho** = ~4 h de foco real seu, dirigindo os agentes. **Ritmo A** = 3 dias/semana. **Ritmo B** = 5 dias/semana. Todas as estimativas são **[HIPÓTESE]**.

**Dois termos:** **portão go/no-go** é uma lista de conferência no fim de cada fase — só se passa adiante se tudo estiver verde. **Modo sombra** é o servidor calcular a coisa nova **sem aplicar em ninguém**, só gravando, para comparar. É testar o freio com o carro parado antes de descer a ladeira.

### 11.1 As fases e os portões

| Fase | Nome | Depende do conceito? | Dias | Portão |
|---|---|---|---|---|
| **F-1** | 🔴 **Correção do vazamento de e-mail + anúncio da janela OG** | **Não — e o vazamento é o único item deste plano com relógio** | 2–4 | — |
| **0-A′** | Rede de segurança e relógios externos (+ lista branca de campos) | **Não — vale de qualquer jeito** | 16–29 | **G0a** |
| **0-B** | Conta, e-mail transacional e conformidade | **Não — vale de qualquer jeito** | 11–20 | **G0b** |
| **0-C** | Higiene que vale por si (IDs opacos, evento canônico, números como texto, exportação verificável) | parcialmente | 6–10 | — |
| **1′** | Decidir e provar no papel (+ harness do XP) | sim | 9–15 | **G1 — portão do conceito** |
| **2′** | Tempo **e XP** autoritativos **em sombra** | sim | 28–46 + 14 dias de observação | **G2 — portão da sombra** |
| **3′** | **MVP do Legado + selo OG** e lançamento | sim | 40–65 | **G3 — portão de lançamento** |
| **4** | Sucessão real (a Passagem de verdade) | sim | 47–73 | **G4** |
| **5** | Conteúdo e Arquivo (Era II, ranking, export, as duas migrações escondidas) | sim | 36–64 | **G5** |
| **6** | Institucionalização (associação, licença, marca) | sim | 5–10 + terceiros | **G6** |

**Totais:** F-1 + Fase 0 = **35–63 dias** · Fases 1′–3′ = **77–126 dias** · **MVP completo (F-1 a 3′) = 103–173 dias.** *(Inalterados pela decisão de 24/09: a leitura final do selo saiu do MVP e virou um evento datado em ago/2027, de 0,5–1 dia.)*

> 📌 **Um marco fixo que agora atravessa o roadmap inteiro: `2027-08-26` — o fechamento da janela OG.** Ele não é uma fase e não consome dias de trabalho, mas **é a única data deste plano que não se move**, porque terá sido anunciada publicamente. Duas coisas precisam estar prontas antes dela: **(1)** a leitura final e o verificador nas duas linguagens *(barato — o marco interino de 10.2.1 já os terá exercitado)*; **(2)** a **UI do selo no ar**, senão a janela fecha sem que ninguém tenha visto o que ganhou. O item (2) é o que amarra o selo ao calendário de lançamento pela primeira vez — ver 10.13.1.

```
🔴 F-1 (agora) ────────┬─► ANUNCIO da janela OG (+ carimbo do anuncio)
                       ├─► vazamento de e-mail corrigido   [o unico com relogio]
                       └─► (opcional) marco interino carimbado
                                   │
Aprovacao ─► Fase 0-A' ──► G0a ────┤
 ├─► Fase 0-B (e-mail transacional, Termos, exclusao) ───┤
 ├─► Fase 0-C (higiene: IDs opacos, evento canonico) ────┤
 │                                                        ▼
 ├─► Fase 1' (papel + harness de XP) ──► G1 ──► Fase 2' (SOMBRA: tempo E XP, 14 dias)
 │                                                        │
 ├─► Trilha juridica: advogado semana 1 ──► Termos ──► parecer art. 9 III ──► exigido no G3
 │                                                        ▼
 │                                                    G2 ──► Fase 3' (MVP + selo OG) ──► G3  ★ LANCAMENTO
 └─► (depois do G3)  Fase 4 ─► G4 ─► Fase 5 ─► Fase 6

──────────────────────────────────────────────────────────────────────────────
26/08/2027  DATA FIXA — nao depende de nenhuma fase acima, nao se move
   └─► leitura final ─► raiz ─► carimbo ─► classificacao ─► frozen_at
       A janela de fundacao fecha. A lista OG nunca mais cresce.
       Pre-requisito: a UI do selo tem que estar NO AR antes disto (10.13.1).
```

### 11.2 F-1 e a Fase 0 — o que vale mesmo que você recuse o conceito

**F-1 (2–4 dias):**

| # | Item | Prazo |
|---|---|---|
| 1 | 🔴 **Vazamento de e-mail**: lista branca no `sync_state`, id opaco no overworld, espelho no mobile, APK novo | **imediato — é o único item deste plano com relógio correndo** |
| 2 | **Anúncio da janela OG**: fixar a constante (OG1) → texto público → carimbo OTS **do próprio anúncio** → publicar em ≥ 3 testemunhas | **quanto antes** (custa ~0,3 dia e não se retira depois) |
| 3 | **Marco interino do selo** (opcional, 10.2.1): ensaio local → leitura somente-leitura → raiz interina → carimbo → publicação | quando der, **depois** do item 1 |

*(A ordem dos itens 1 e 2 inverteu em 24/09. O snapshot deixou de ser o item 1 e de ser obrigatório; o vazamento de e-mail subiu ao topo — e a janela de onze meses, que é uma campanha de captação, é justamente o que torna o item 1 mais urgente do que era.)*

**0-A′ (16–29 dias):**

| # | Item | Prazo |
|---|---|---|
| 1 | **Corrigir os 4 comentários enganosos de `server/db.js`** e o cabeçalho de `migrate_level_bigint.js` para "EXECUTADA, verificada por checksum" | **esta semana** — é o mais barato do plano inteiro |
| 2 | **Backup que restaura de verdade:** `pg_dump` diário para 2 destinos + teste de restauração + inventário de acessos + **adjunto nomeado** | antes de qualquer migração |
| 3 | **Cifrar ou destruir todo backup anterior a 18/08/2026** (senhas em texto puro) e **contar as linhas com senha não migrada** | junto com o 2 |
| 4 | **Android:** confirmar o que se perde ao reinstalar → **gerar keystore de release** (2 cópias físicas) → **registrar no Developer Console** → APK assinado com aviso de "desinstale e reinstale" | **31/12/2026** (faltam ~98 dias) |
| 5 | **`NUMERIC_BOUNDS`:** subir `time` (1e8 → 1e10) e `score`; pôr o teto de validação de `level` **acima** do teto de jogo (1,01e11); **decidir a estratégia do XP acumulado** (não gravar, e derivar); limite de frequência nos saves; registrar a dívida das 3 colunas `INTEGER` | antes da Fase 2′ |
| 6 | **`token_epoch` + revogação de sessão** (também pré-requisito da troca de senha forçada) | antes da Fase 2′ |
| 7 | **Termos + Política de Privacidade + aceite versionado + canal do titular** | **contratar o advogado na semana 1** |
| 8 | **Higiene:** trocar o texto "records… on the blockchain" do `index.html` (o jogo é 100% Web2); mascarar e-mail nos logs; revisar o CORS **testando no APK**; destruir ou cifrar o `server/game_data.db` antigo | junto com o 7 |
| 9 | **Domínio:** pré-pagar, travar, 2FA físico, monitor externo; espelho do repositório | esta semana (é 1 h sua) |

**0-B (11–20 dias):** e-mail transacional + verificação de endereço + "esqueci minha senha" (web e mobile) — **e é isto que destrava a escada de dormência, a janela de contestação do selo e a troca de senha da coorte OG**; procedimento de exclusão de conta; um **ambiente de teste** (recomendo um segundo projeto Supabase gratuito, mais fácil que Docker para quem está aprendendo); vendorizar as 3 CDNs.

**0-C (6–10 dias) — higiene que vale por si:** `account_id` opaco que **nunca** é o e-mail; registro de eventos canônico append-only (RFC 8785); **números grandes como texto/BigInt** (o XP de 3,64e28 não cabe em `Number`); módulo de regras puras; notário + âncora pública; formato de exportação verificável; tempo em janelas (`day_index`); a porta única de rede (os vários `.emit(` viram um adaptador).

> **Uma pegadinha de deploy que já custou tempo neste projeto:** o console VNC da VPS **perde o Shift**. Variáveis de ambiente novas entram **em minúsculas e sem `_`**, e **os segredos são colados por você** — nenhum agente digita chave nenhuma.

### 11.3 Fases 1′ a 3′, em uma frase cada

- **Fase 1′ (papel, 9–15 dias):** você responde as decisões bloqueantes; **o harness passa 13/13 critérios** (incluindo os dois novos do XP); a tabela de sobrevivência da Linha é publicada **com o número revisado de ~11%** e **você a lê antes de aprovar**; o exploit "zerar num pacote" é reproduzido **num ambiente de teste**; a varredura por outros caminhos de XP em `engine.js` é feita por busca, sem ler os 220 KB; **o ritmo real de kills é medido numa conta descartável** (é o que fecha o `n₀`); o vocabulário é revisado por um falante nativo de inglês. **Nada é construído.**
- **Fase 2′ (sombra, 28–46 dias + 14 de observação):** o servidor passa a medir o tempo **e a conceder o XP** — com spawn autoritativo e recibo de kill — **sem aplicar em ninguém**, até os números baterem por duas semanas. Testes numerados, incluindo "uma sessão atravessando a virada de UTC **não** rende 2 h", "um pacote com `level: 1e11` **não** move o nível de sombra", "um `spawnId` reenviado **não** credita duas vezes" e "kills de ghost secundário **não** entram no orçamento do legado".
- **Fase 3′ (MVP, 40–65 dias):** liga o autoritativo; Nível de Combate logarítmico; Linha + Keeper nº 1 + Crônica **só com eventos automáticos**; **Era Zero** com checksum e carta às 48; **selo OG na tela, web e mobile**; HUD do legado (Dia N, Selo, Anel, Era, Fecho do dia); **Interlude**; designação de Herdeiro + Chave do Legado + `commons_optin`; salvaguardas jurídicas mínimas + kill-switch + Modo Aprendiz; APK assinado + `MIN_CLIENT_VERSION`. **A Passagem real ainda não existe por interface** — se acontecer no ano 1, é assistida por você, por script.

### 11.4 O MVP: o que entra e o que fica de fora

> **Em uma frase:** *o servidor mede o tempo e concede o XP (`τ = 0`); a curva foi provada em simulação; as 48 contas viram Linhas na Era Zero com o selo OG na tela; a Crônica registra só eventos automáticos; a Linha pode designar um Herdeiro e guardar a Chave — mas a Passagem real espera o G4.*

Ele entrega quatro sensações: **"meu dia tem fecho"**, **"estou numa estrada de séculos e vejo o mapa"**, **"isto pode passar para alguém"** e **"eu estava aqui primeiro"**.

| Fica de fora do MVP | Vai para | Gatilho de entrada |
|---|---|---|
| Texto livre na Crônica (epitáfio, Carta ao Herdeiro) | Fase 4 | parecer sobre consentimento + 2 moderadores |
| Passagem por interface (resgate, Vigília, Investidura, MFA) | Fase 4 | pilotos, ou uma família real querendo passar |
| Escada de dormência automática | Fase 4 | precisa do e-mail; **prazo derivado: antes do 1º Sinal, ~6 meses após o lançamento** |
| Certificado OG + prova de inclusão na tela | Fase 4 (ou fim da 3′) | `account_id` estável |
| Era II completa | Fase 5 | — |
| Migração das 333 badges e dos 139 personagens | Fase 5 | roteiro com checksum |
| Ranking, Mapa do Céu, Hall | ano 2 | 100 Linhas ativas |
| Export por endpoint | Fase 5 | (o export **por script** das 48 entra no MVP) |
| `τ > 0` | — | parecer escrito + antibot no ar |
| Keystone / "zerar" | **não existe código** | é um invariante do banco |

### 11.5 Os 13 itens que NÃO podem ser cortados

*(eram 12; a janela de fundação acrescentou o N0-b, que é o primeiro item deste plano com **data pública marcada**)*

| # | Item | Se cortar |
|---|---|---|
| **N0** | **A constante do corte fixada e o anúncio carimbado, antes de a regra circular** *(revisto em 24/09: era "o snapshot carimbado, antes do anúncio" — **a ordem inverteu**)* | a regra perde a propriedade de ter vindo antes dos fatos, e a lista vira "confia em mim" para sempre. **Carimbar o texto do anúncio custa 5 minutos e é o que substitui o snapshot às pressas** |
| **N0-b** | **A leitura final em 26/08/2027 + a UI do selo no ar antes dela** | a janela fecha sem lista e sem ninguém ter visto o que ganhou. **É o único compromisso deste plano com data pública marcada** |
| N1 | **A correção do vazamento de e-mail antes do selo na tela** | o selo vira o motivo de ampliar um vazamento de dado pessoal |
| N2 | Integridade do XP **antes de anunciar** | a régua vira sugestão; você anuncia uma promessa que qualquer um zera — e que o farm da fase 33 zera sem trapacear |
| N3 | Harness 13/13 com as constantes realmente implantadas | erro de premissa custa séculos e só aparece em simulação |
| N4 | Sombra de 14 dias | é a única forma de achar divergência sem afetar 48 jogadores reais |
| N5 | Backup **restaurado** ≤ 24 h + adjunto nomeado + acessos em custódia | *bus factor* 1 |
| N6 | Era Zero aditiva com checksum + export prévio fora do Supabase + carta às 48 | perda irreversível, ou backlash que mata a comunidade inicial |
| N7 | **Uma regra de hash por árvore**, com vetores em duas linguagens **antes do primeiro registro** | duas raízes carimbadas = duas respostas para "quem é OG" |
| N8 | Termos + Política + exclusão + parecer sobre o art. 9º, § único, III antes de menores na régua | fiscalização em curso |
| N9 | `MIN_CLIENT_VERSION` + APK assinado com chave de release | APK velho mandando XP no formato antigo; assinatura debug não sobrevive a 2027 |
| N10 | Invariantes de longo prazo (validação 1,01e11; nenhuma Keystone antes de 3147; Crônica sem dado pessoal; relíquias e selo não transferíveis; `credit_adjustment`; XP acumulado **não gravado**) | baratos agora, impossíveis depois |
| N11 | Comunicação honesta: anunciar só após o G3 (exceto o selo); **não** dizer "testada" antes do G4; **nunca** prometer valor ao selo | promessa lida como garantia vira sensação de fraude |
| N12 | Interlude + carta às 48 | parede de conteúdo no dia ~33 e "reset" mal comunicado são os dois riscos de primeira impressão |

### 11.6 O que NÃO construir agora

Eras III–X · o Coro e o Monumento jogável · **a blockchain própria** (documento separado, **congelado**) · a Keystone · Mapa do Céu e Hall · temporadas (nenhuma até o ano 3) · PvP · Reforge e Óleo da Lanterna (entram com a 1ª Passagem) · Era Packs abertos a terceiros · **`τ > 0`** · convites de retorno · **qualquer benefício econômico para o selo OG** · qualquer mercado ou venda de conta · ofuscação de cliente e CAPTCHA (explicitamente **nunca**) · as duas migrações escondidas · a fundação com fundo patrimonial.

### 11.7 Calendário, capacidade e o caminho crítico

| Marco | Dias acumulados | **Ritmo A** (3 d/sem) | **Ritmo B** (5 d/sem) |
|---|---|---|---|
| F-1 | 2–4 | **agora** (vazamento de e-mail + anúncio) | **agora** |
| G0a | 18–33 | ~nov/2026 a ~dez/2026 | ~out/2026 a ~nov/2026 |
| G0b | 29–53 | ~dez/2026 a ~jan/2027 | ~nov/2026 a ~dez/2026 |
| G1 (conceito) | 44–78 | ~jan/2027 a ~mar/2027 | ~dez/2026 a ~jan/2027 |
| G2 (sombra) | 72–124 | ~abr/2027 a ~jun/2027 | ~jan/2027 a ~mar/2027 |
| **G3 — LANÇAMENTO** | **103–173** | **~jul/2027 a ~nov/2027** | **~mar/2027 a ~jun/2027** |
| 📌 **Fechamento da janela OG** | — | **26/08/2027 — data fixa, igual nos dois ritmos** | **26/08/2027** |

> ⚠️ **Olhe as duas últimas linhas juntas, porque elas se cruzam.** No **Ritmo B** o lançamento cai **antes** do corte e toda a primeira onda de jogadores é OG. No **Ritmo A** o corte cai **em cima ou antes** do lançamento, e boa parte de quem chegar pela divulgação fica de fora. **Nenhum dos dois é errado**, mas é melhor saber disso agora do que em julho de 2027 — a análise está em **10.13.1**, e a recomendação é revisitar no portão **G2**, sem mexer no corte.

**Caminho crítico:** F-1 → decisões A1–A14 → harness 13/13 → spawn autoritativo → 14 dias de sombra → hash + Era Zero + selo + HUD → G3. **E, fora do caminho crítico mas com data fixa:** 26/08/2027, o fechamento da janela OG — que só exige que a UI do selo (dentro da Fase 3′) esteja no ar antes.

**Relógios externos que não esperam pela sua aprovação do conceito:**

| Relógio | Prazo restante (de 24/09/2026) | Independe do conceito? |
|---|---|---|
| 🔴 **Vazamento de e-mail** | **imediato** — e a janela OG, por ser uma captação de onze meses, tornou isto mais urgente | sim |
| **ECA Digital** (fiscalização nov/2026–jan/2027) | **38–129 dias** — ⚠️ **cai dentro da janela OG**; ver a nota de 7.3 | sim |
| **Android** (registro + chave de release até 31/12/2026) | ~98 dias | sim |
| **Fechamento da janela OG** | **336 dias** (26/08/2027) — não é urgente, mas **é a única data que não se move** depois de anunciada | sim |

*(A linha que dizia "🔴 **Snapshot OG** — **vencido**" saiu desta tabela em 24/09: com a janela de fundação, esse prazo deixou de existir. O que ocupou o topo foi o vazamento de e-mail, que já estava aqui e sempre foi real.)*

> **Sobre o Android, uma reconciliação que fecha uma divergência entre relatórios do próprio projeto [VERIFICADO na página oficial, 2026-09-24]:** a onda de **30/09/2026 atinge só lojas participantes**; o APK do seu site é atingido pelo **rollout global de 2027**. Ou seja: **o `ghostgames.club` não quebra em 30/09**. A ação continua a mesma (registrar até 31/12/2026, com a keystore de release criada **antes** e em duas cópias físicas), mas **a urgência relativa é menor** do que alguns relatórios sugeriram — o vazamento de e-mail vem primeiro.
>
> ⚠️ **E uma interação nova, de 24/09:** o **rollout global do Android em 2027** e o **fechamento da janela OG (26/08/2027)** caem no mesmo ano. Se o APK do site parar de instalar no meio da janela, você perde jogadores exatamente durante a campanha que os convida a entrar antes do corte. **Isso não torna o Android mais urgente do que o vazamento de e-mail, mas encurta a folga** — trate 31/12/2026 como prazo de verdade, não como meta.

**O achado de capacidade:** o **primeiro ano depois do lançamento** pede **104–158 dias** de trabalho (sucessão real + Era II + arquivo + rituais) contra uma capacidade de **156 dias/ano** no Ritmo A. Cabe **só no limite**. Decisão de produção: **a Era III sai do ano 1**, e o **Interlude** entra no MVP.

**Um achado de calendário que vale ouro:** com `τ = 0`, a Era I (33 h) acaba no **dia 33** de quem joga 1 h/dia. Sem Era II pronta, o jogador bate na parede em pouco mais de um mês. O **Interlude** — rejogo livre das 33 fases + overworld, com o contador avançando e as Eras seguintes visíveis mas trancadas — é o que impede isso, e custa pouco.

### 11.8 Custos [HIPÓTESE]

| Item | Faixa — 1º ano |
|---|---|
| Supabase pago | US$ 300/ano |
| Backup em 2 armazenamentos + monitor | ≈ US$ 250/ano |
| Domínio (10 anos pré-pagos) | US$ 160 uma vez |
| E-mail transacional | US$ 0–240/ano |
| Android Developer Console | US$ 0–25 |
| **Carimbo do snapshot OG** | **US$ 0** |
| **Advogado / DPO / contador** | **R$ 5.000–20.000 (US$ 900–3.600)** — **é o maior item** |
| Revisão do vocabulário por nativo de inglês | R$ 300–1.000 |
| **Total ano 1** | **≈ US$ 1.600–4.600 (R$ 9.000–25.000)** |

**Recorrente depois:** ~US$ 570–810/ano + jurídico. **Piso de sobrevivência** (arquivo em N3/N4): ~US$ 250/ano. **E o custo que mais importa: 410–690 horas suas** no MVP.

### 11.9 Os três pontos sem volta

1. **O anúncio público da data de corte do selo OG** — e, depois dele, **o carimbo da raiz em ago/2027**. Os dois são irreversíveis **de propósito**. *(Esta é a ordem nova, de 24/09: antes, o ponto sem volta era só o carimbo, que aconteceria naquela semana. Agora o primeiro ponto sem volta é uma **frase** — "quem entrar até 26/08/2027 é OG" — e ela custa zero e vale onze meses. **Acerte a constante antes de falar**, Seção 0.1.)* Por isso o critério das duas implementações (Seção 0.7) vem **antes** do carimbo — e agora há onze meses para cumpri-lo.
2. **A regra de hash da Crônica**, a partir do primeiro evento gravado.
3. **O anúncio público** — a promessa de 1.122 anos não se retira. E **a troca de assinatura do APK**, que é um evento de migração de dados, não um upload.

Tudo o mais é aditivo e reversível voltando o código.

---

## 12. Riscos — os 12 que mais pesam, em linguagem simples

| # | Risco | O que reduz |
|---|---|---|
| **1** | 🔴 **O e-mail de quem está logado sai para os outros jogadores, hoje** — e a janela OG é uma campanha de onze meses convidando gente nova (provavelmente muitos menores) a entrar nesse jogo. **Promovido ao 1º lugar em 24/09**, quando o prazo vencido do snapshot deixou de existir e este virou o único item com relógio de verdade | lista branca no `sync_state` + id opaco, **antes** de o selo aparecer na tela e **antes** de qualquer campanha (Bloqueio 1, Seção 0.7). ~0,5–1,5 dia nas duas plataformas |
| **2** | **A corrente arrebenta muito antes de 3147 — e a conta piorou.** Uma Linha atravessa ~45 trocas; com 90% de sucesso por troca, chega em **0,87%** dos casos. A chance de **alguma** das 48 Linhas de hoje chegar é de **até ~11% como TETO, e 3–5% com correlação realista** — porque as 48 não falham por motivos independentes | **o Commons** é a única mecânica que aumenta isso de verdade. E **volume**: mais Linhas fundadoras. 🆕 **E é aqui que a decisão de 24/09 ajuda de verdade:** a janela de onze meses deve levar a coorte fundadora de ~48 para algo entre ~92 e ~490 Linhas (10.13) — é exatamente o "volume" que esta linha sempre pediu. *(Ressalva honesta: a correlação de causa comum **não** desaparece com o número; mais Linhas melhoram o teto, não a dependência mútua.)* **Leia este número antes de aprovar qualquer coisa** |
| **3** | **Hoje qualquer jogador zera a régua em um pacote de rede — e o farm da fase 33/CAVE1 zera em ~1.900 h ≈ 5,2 anos sem trapacear** | XP autoritativo antes de anunciar (N2), e o multiplicador de fase **+ a escada `1,15^fase` da captura** fora da conta de XP (**decisão A15, já tomada em 25/09 e construível já na Fase 0 — fecha o farm de lugar por completo**) |
| **4** | 🆕 **A regra do selo vira uma promessa pública de onze meses, e promessa pública não se recua.** Se a constante do corte, a leitura do fuso ou a interpretação de *"até dia 26"* estiverem erradas, o erro vai junto — e corrigi-lo depois significa tirar de alguém um selo que ele acha que tem. **Some-se a isso que o corte (26/08/2027) caiu em cima da faixa em que o lançamento pode acontecer** (10.13.1) | **acertar a constante ANTES de falar** (Seção 0.1): instante em UTC, exclusivo, e a ambiguidade de "até dia 26" resolvida por escrito. **Carimbar o próprio anúncio** no dia em que ele sair. E revisitar a interação com a data de lançamento no portão **G2** — sem mexer no corte |
| **5** | **As contas mais antigas são as que tiveram senha em texto puro** (até 18/08/2026, um dia antes da migração). **A janela de 2027 reduziu isto pela metade:** a coorte OG deixou de ser sinônimo da coorte pré-bcrypt, e hoje o problema está localizado nas **~48 contas antigas** em vez de definir o grupo inteiro | contar as linhas não migradas, forçar troca de senha e exigir confirmação por e-mail antes da reivindicação — **só para as contas anteriores a 18/08/2026** (Seção 10.6). Para quem entrar de hoje em diante, não se aplica |
| **6** | **O jogo depende de uma pessoa só.** Se você sumir, somem a chave do app, o domínio, o acesso ao banco e o segredo de sessão — **e o arquivo privado que diz qual folha OG é de quem** | adjunto nomeado + backup restaurado + cópia cifrada do arquivo privado com uma segunda pessoa, **assim que esse arquivo existir** (no marco interino, ou no mais tardar no carimbo de ago/2027). *(Era "antes de anunciar"; com a ordem invertida de 24/09 o anúncio vem primeiro e o arquivo privado só nasce depois, então o gatilho mudou. **E há um agravante novo:** a janela obriga alguém a estar em condições de rodar a leitura final em ago/2027 — se você não estiver disponível naquela semana, **a lista não fecha**. É o primeiro compromisso deste plano com data marcada que depende de uma pessoa só.)* |
| **7** | **A lei brasileira, lida ao pé da letra, chama a régua de "recompensa pelo tempo de uso"** **[VERIFICADO, texto integral]** | `τ = 0` + XP vindo de **derrotar inimigos** + as 12 salvaguardas + parecer escrito + kill-switch. **A sua Parte 1 já melhorou a posição legal** |
| **8** | **Este é o conceito de jogo com maior potencial de chantagem emocional que se pode desenhar:** culpa familiar + aversão à perda + horizonte infinito | o "se assim quiser" como cláusula constitucional, e uma revisão de texto, tela por tela. **A diferença entre legado e corrente é inteiramente de execução** |
| **9** | **Mais de 91% do contador acontece depois do ano 500.** Você, seus filhos e seus netos são uma fração invisível do número | as **Eras** e o **Capítulo do Keeper**: ninguém precisa do 1e11 para ter terminado alguma coisa. Sem resposta pronta para "eu sou 0,0x%", o conceito perde o fundador antes de perder o herdeiro |
| **10** | **Faltar um dia a cada vinte custa 60 anos; um a cada dez, 125** **[CÁLCULO]** | a promessa vira "365 horas por ano, quando der". **A régua literal não sobrevive a um ser humano** |
| **11** | **Duas escolhas no primeiro dia não têm conserto:** a fórmula de hash da Crônica e a raiz OG carimbada | vetores de teste em **duas linguagens** antes do primeiro evento e antes do carimbo |
| **12** | **O custo em horas.** 410–690 h no MVP, num projeto de uma pessoa. Adoecer, mudar de emprego ou perder o interesse por dois meses **é o cenário base**, não a exceção | portões com "retirada honrosa": F-1 e a Fase 0 sobrevivem sozinhas, a sombra sobrevive sozinha, o MVP é reversível |

**E o risco que eu escolhi NÃO listar, e digo por quê:** a blockchain não é risco deste plano, porque **ela não está neste plano**. Ela é um documento separado e congelado. Se alguém disser que algo aqui "depende da chain", está errado.

---

## 13. Matriz de lacunas

**FECHADA** = resolvida, com dono e resposta. **FECHADA COM DECISÃO PENDENTE** = a resposta existe e está recomendada, mas depende do seu "sim". **ABERTA** = ainda falta trabalho de verdade.

| # | Lacuna | Status | Onde | O que ainda depende de você |
|---|---|---|---|---|
| **1** | Definição de "jogo legado" + princípios + vocabulário | **FECHADA COM DECISÃO PENDENTE** | Seção 1 | Três nomes ficaram fechados neste v2 (Legacy Key, Keystone, OG Seal/OG Line). O resto **não foi revisado por falante nativo de inglês** — é barato (R$ 300–1.000) e entra na Fase 1′ |
| **2** | Calibração matemática | **FECHADA COM DECISÃO PENDENTE** | Seção 2 | A4′, A12, A13 — e principalmente A1, A2, A3, A5. O harness precisa **passar 13/13 na Fase 1′**; com `m = 1,00` ele **reprova** hoje |
| **3** | **XP dos inimigos** (seu pedido da Parte 1) **+ XP flat no Episódio 1, CAVE1 e captura de ghost** (suas decisões de 25/09) | **FECHADA** | Seções 2.2–2.6 e **2.14 (incl. 2.14.8)** | Nada de conceito, e **nenhum atalho residual** (todo lugar de farm ficou 0,37×–0,54× a fase 1). Falta **medir o ritmo real de kills** numa conta descartável — fecha o `n₀` **e** o `t_overhead` de uma vez. Falta só a **A15-b** (o princípio vincula os Episódios futuros?) |
| **4** | Precisão numérica e limites por 1.100+ anos | **FECHADA** | Seção 2.10 | Nada. Um achado **novo e perigoso** entrou (o teto `xp: 1e19` e a falha silenciosa) e tem dono e fase |
| **5** | Mecânica de sucessão | **FECHADA COM DECISÃO PENDENTE** | Seção 4 | A9 e as decisões de Fase 4. **Dependência dura:** sem e-mail transacional (0-B) a escada de dormência inteira é letra morta |
| **6** | Integridade do tempo **e do XP** | **FECHADA COM DECISÃO PENDENTE** | Seção 5 | A3, A4′, A5. **Duas coisas ainda não feitas:** o exploit não foi **reproduzido**, e a varredura exaustiva por outros caminhos de XP em `engine.js` não foi feita. As duas são Fase 1′ |
| **7** | Conteúdo e motivação por ~409.000 h | **FECHADA** | Seção 3 | A parede de conteúdo no dia ~33 foi achada e resolvida pelo Interlude |
| **8** | Durabilidade 1.100+ anos | **FECHADA COM DECISÃO PENDENTE** | Seção 6 | A11. **O teste dos 50 anos dá 0 "sim", 3 "parcial", 7 "não"** — cada "não" virou item com dono e data, mas **nenhum foi feito ainda** |
| **9** | Jurídico / ética / privacidade | **FECHADA COM DECISÃO PENDENTE**, e é a que mais depende de terceiros | Seção 7 | A8, A14 — **e o parecer escrito do advogado, cujo prazo você não controla**. Uma pendência do v1 **fechou**: o texto integral do art. 9º foi lido na fonte oficial |
| **10** | Migração das 48 contas / 139 personagens | **FECHADA** | Seção 9.4 | A7. Só falta **autorizar a leitura da distribuição de níveis** — que pode ir junto com a do snapshot |
| **11** | Interação com sistemas existentes | **FECHADA COM DECISÃO PENDENTE** | Seção 3.5 | **Três pontos ainda frouxos, e eu digo:** (i) o ranking por geração tem desenho mas **ninguém implementou nem estimou**; (ii) batalhas ghost-vs-ghost foram propostas, nunca dimensionadas; (iii) **ninguém estimou em dias a normalização do combate e a rebalanceada da Era I** — é o item mais subestimado do plano, e o `game-designer` precisa dar essa estimativa **no portão G1** |
| **12** | Riscos, testes, critérios de aceite, reversão | **FECHADA COM DECISÃO PENDENTE** | Seções 11 e 12 | O harness **reprova** nos critérios 1 e 2 sem margem (é o portão da Fase 1′ por isso), e **ninguém escreveu ainda a suíte de aceite ponta-a-ponta** do XP autoritativo contra o banco real com conta descartável. É pré-requisito do G2 |
| **13** | Roadmap faseado + lista de decisões | **FECHADA** | Seções 11 e 14 | Nada |
| **14** | 🆕 **Selo OG** | **ABERTA — por ação, não por desenho** | Seção 10 | **O desenho está completo. O que falta é o seu "sim" e ~2 horas suas.** Enquanto não houver snapshot carimbado, esta lacuna fica ABERTA, e é a única do plano nessa condição |
| **15** | 🆕 **Spawn autoritativo** (o preço do XP vir do servidor) | **FECHADA COM ESTIMATIVA FRACA** | Seções 2.8, 5.3, 9.2 | O desenho está fechado; **a estimativa de esforço é a mais frágil do plano** (é a maior peça de trabalho, e nenhum relatório a mediu de forma independente). O `backend-architect` precisa dar um número **no G1** |

**Placar: 6 FECHADAS, 7 FECHADAS COM DECISÃO PENDENTE, 1 ABERTA, 1 com estimativa fraca.**

**Mas seja justo com a palavra "fechada".** Fechada quer dizer *"tem resposta escrita, com dono, fase e critério de aceite"* — **não** quer dizer *"está provada em produção"*. **Cinco coisas continuam pendentes e eu não vou maquiar:**

1. o exploit "zerar num pacote" **não foi reproduzido**;
2. a varredura exaustiva de `engine.js` **não foi feita** (220 KB, e a regra do projeto desaconselha ler inteiro);
3. **nenhum achado foi conferido contra o banco de produção** — o modo PLANO proíbe, e isso foi respeitado por todos os agentes, inclusive quando custou o prazo do snapshot;
4. **o ritmo real de kills nunca foi cronometrado** — o `n₀` é uma estimativa ancorada em limitadores verificados, não um número medido;
5. **o vazamento de e-mail foi inferido por leitura estática**, não reproduzido ao vivo (embora o caso do overworld seja forte: o `email` é montado no payload **de propósito**).

Pelo padrão de rigor deste próprio projeto, **um achado não reproduzido é uma hipótese com boa evidência, não um fato.**

---

## 14. Checklist de aprovação

> **Como usar:** leia a pergunta, escolha **a letra**. A coluna "recomendo" é a resposta consolidada. Se concordar com todas, basta dizer **"aprovo todas as recomendadas"**.
>
> **Ordem sugerida** *(revista em 24/09)*: **nada aqui está vencido.** Responda **OG1 e OG3 primeiro** — não porque vençam, mas porque custam trinta segundos e destravam um anúncio que só melhora quanto mais cedo sair. Depois **OG2, OG4, A10, A11, A14, A15 e A15-b**, que destravam F-1 e a Fase 0 — **o XP flat entrou aqui e não lá embaixo de propósito:** é a única decisão deste plano que se constrói hoje, sem spawn autoritativo, e conserta um atalho que existe **agora** no jogo que está no ar. *(A **A15** você já respondeu em 25/09 — CAVE1 e captura de ghost dentro da regra; sobrou só a **A15-b**, o alcance nos Episódios futuros.)* Depois **A1–A5, A12, A13**, que destravam as Fases 1′ e 2′. **A6–A9 podem esperar até o portão G2.**
>
> **E uma coisa que não é decisão e por isso não está neste checklist:** o **vazamento de e-mail** (Seção 0.7, risco nº 1). Ele não espera resposta sua, espera trabalho — e é o único item deste plano com relógio correndo.
>
> **Duas leituras obrigatórias antes de responder:** (1) a tabela de sobrevivência da Linha — Seção 12, risco 2, **com o número revisado de ~11%**; (2) o custo em horas — Seção 11.8.

### 14.1 As 4 decisões do selo OG (primeiro, porque são as mais baratas)

*(Elas encabeçavam a lista por terem prazo. **Não têm mais** — encabeçam agora porque são as que você responde sem trabalho nenhum e porque destravam um anúncio público cujo valor só cresce quanto antes ele sair.)*

---

**OG1 — Você confirma o instante exato do corte da janela de fundação?**
- **(a) `CUTOFF = 2027-08-26T03:00:00Z`, exclusivo** — meia-noite de Brasília entrando em 26/08/2027: **o dia 25 conta inteiro, o dia 26 não** · (b) o mesmo, porém **inclusivo do dia 26** (`2027-08-27T03:00:00Z`) · (c) outra data
- **Recomendo (a).** É a leitura fiel da sua frase: você disse *"depois desta data as contas criadas vêm sem o selo"*, tratando o dia 26 como o começo do "depois". **Mas (b) é uma leitura igualmente defensável de "até dia 26" em português** — e é por isso que eu não decido isto sozinho. **Escolha uma, e escolha antes do anúncio.**
- **Por que em UTC e não "26 de agosto":** um instante absoluto não muda de sentido conforme quem lê, e não se mexe se o horário de verão voltar (Seção 10.4).
- **Consequência:** **zero trabalho, zero reais, e nenhum caminho de volta depois de anunciado.** É a decisão mais barata e mais permanente deste documento inteiro.
- **Trava:** o anúncio (F-1, item 2).

---

**OG1-b — Você autoriza a leitura somente-leitura do banco?** *(deixou de ser urgente e virou opcional)*
- **(a) Sim, agora, como MARCO INTERINO** (10.2.1) — não concede selo a ninguém; serve de ensaio geral, encurta a janela de retrodatação e traz de quebra os dois levantamentos que o plano precisa de qualquer jeito · (b) sim, mas só em ago/2027, na leitura final · (c) só os dois levantamentos (níveis + senhas não migradas), sem raiz nem carimbo
- **Recomendo (a)**, e (c) é um segundo lugar perfeitamente razoável.
- **O que mudou:** no desenho antigo, adiar isto era **irrecuperável**. Agora **não é** — a elegibilidade vem da regra, não da foto. Você compra tranquilidade com ~0,5 dia; não compra o direito de ninguém.
- **Lembre-se de que (b) e (c) NÃO dispensam** a leitura final de 26/08/2027 — essa é obrigatória em qualquer cenário.
- **Você também precisa dizer:** quem executa (**recomendo: você, no seu computador**) e se autoriza, na mesma sessão, a distribuição de níveis (Seção 9.4) e a contagem de senhas não migradas (Seção 10.6). **Esses dois travam a Fase 1′ e a Fase 0-A′ e não dependem do selo.**

---

**OG2 — Quem é elegível?**
- **(a) Regra pública automática** (`qa_*`, `test_*`, `@example.com` fora; duplicata de caixa = 1 selo; `Agent G [IA]` fora; suas contas e da equipe dentro, **contadas à parte**) **+ você revisa a lista de exceções em tela** · (b) só decisão manual, uma a uma · (c) todas elegíveis
- **Recomendo (a).** E **sem numeração ("OG #17")**: a migração de 19/08/2026 perdeu as datas originais, então numerar seria inventar uma ordem.
- 🆕 **Uma sub-decisão que a janela criou — "conta vazia":** a regra antiga aceitava contas vazias porque *"o corte é fixo, incluir vazias não abre nenhuma porta"*. **Com onze meses de janela, abre.** Escolha: **(a1) exigir "sinal de vida"** (≥ 1 personagem) **só para contas criadas a partir do anúncio**, isentando as anteriores — **é o que eu recomendo**, custa uma linha de SQL e nenhum dado novo; ou **(a2) não fazer nada**, aceitando que um colecionador leve alguns enfeites a mais. *(Ver 10.2 e o caso duro nº 4.)*
- **Trava:** a classificação, **depois** da leitura final. **Pode ser respondida com calma** — só a sub-decisão do "sinal de vida" precisa sair **antes do anúncio**, porque ela tem que constar do texto público.

---

**OG3 — Quando anunciar?**
- **(a) Agora** · (b) só depois de um snapshot carimbado · (c) mais para a frente
- **Recomendo (a) — e repare que esta recomendação INVERTEU em 24/09.** A versão anterior dizia "(b), sem exceção", porque um corte secreto no passado convidava a uma corrida de cadastros naquela noite. **Com a data pública e a onze meses, não há data secreta para correr na frente**, e anunciar cedo é o que dá à regra a propriedade de ter vindo antes dos fatos.
- **Três condições, e elas não são burocracia:** (i) a constante de OG1 já decidida; (ii) **carimbe o próprio texto do anúncio** no dia em que ele sair (cinco minutos, OpenTimestamps, de graça); (iii) o texto diz **"honorary only, nothing to buy"** desde a primeira versão — um aviso de contagem regressiva sem isso lê como pré-venda (Seção 10.9).
- ⚠️ **Anunciar ≠ fazer campanha.** Publicar a regra nos canais que já existem pode ser feito já. **Campanha larga de aquisição espera** o vazamento de e-mail corrigido e o item de menores da Fase 0-B (Seção 7.3) — a janela atravessa a fiscalização do ECA Digital.
- **E o selo na tela continua só depois do Bloqueio 1** (o vazamento de e-mail).

---

**OG4 — O selo dá algum benefício?**
- **(a) Nenhum — honorífico puro** · (b) só cosmético não negociável e/ou uma "Sala dos Primeiros Guardiões" na Crônica, com consentimento · (c) qualquer benefício com valor
- **Recomendo (a)**, com (b) disponível se você quiser algo a mais. **Esta recomendação ficou mais firme em 24/09, não menos.**
- **Consequência de (c), e ela cresceu junto com a janela:** antes, dar benefício significava distribuir valor a ~48 contas fechadas — um erro caro, mas estático. Agora significaria **publicar um convite aberto, por onze meses, para criar contas que valem dinheiro**. Isso deixa de ser "um selo com bônus" e vira um programa de distribuição com inscrições abertas (Seção 10.7).
- **Além disso:** as decisões de elegibilidade viram decisões de alto risco, o anúncio passa a exigir revisão jurídica, e um bônus pequeno hoje vira **um abismo intransponível em séculos**.

---

### 14.2 As 5 decisões novas da matemática do XP *(a A15 você já respondeu — está aqui só para registro)*

---

**A4′ — O nível do legado vem do XP ou do tempo?** *(revisa a A4 do v1)*
- (a) tempo creditado pelo servidor (o v1) · (b) XP puro, com orçamento diário · **(c) XP com orçamento diário E um piso — o "Desenho C"**
- **Recomendo (c).** Atende o seu pedido literalmente, é **mais forte que (a) contra o AFK**, protege o iniciante e o herdeiro, e mantém a régua em 1.121,3 anos para todos os arquétipos.
- **Consequência de (c):** exige **spawn autoritativo no servidor**, que hoje não existe — é a maior peça de trabalho do plano. **Consequência de (a):** mais barato, **mas é a versão juridicamente pior** (Seção 7.1) e a mais estranha de explicar ("por que subi de nível sem matar nada?").
- **O recuo existe e é seguro:** começar por (a) e migrar para (c) **não mexe em um único nível de ninguém**, porque as duas são a mesma curva.
- **Trava:** a Fase 2′.

---

**A12 — Quanto o ritmo de kills deve importar?**
- (a) nada (todos iguais) · **(b) até 1,29× de diferença (`n₀ = 13,35`)** · (c) mais que isso
- **Recomendo (b).** 1,29× é sentido como "meu esforço conta" e custa ~8 anos num horizonte de 1.122. **(c)** faz a data de chegada variar séculos entre jogadores honestos.
- **`n₀` tem que ser constante configurável no servidor**, e toda recalibração vale **daqui para frente**, nunca retroativamente.

---

**A13 — Quem cumpre a hora mas mata pouco (criança, iniciante, herdeiro novo) fica para trás?**
- (a) sim, o XP é o XP · **(b) não: piso de 80% do orçamento, se cumpriu a hora E fez ≥ 10 kills** · (c) piso de 100% (na prática vira o desenho antigo)
- **Recomendo (b).** É o que impede o conceito de punir exatamente quem ele mais precisa acolher — e **não reabre a porta do AFK**, porque sem kills não há piso.
- 🆕 **E ganhou uma segunda razão em 25/09:** com o XP flat, quem passa a hora encarando o chefe da fase 33 recebe só **41% do orçamento do dia** (o chefe leva 5 a 17,7 min de tiro para cair). Com o piso, recebe 80%. **A13 passou a proteger também quem enfrenta o boss em vez de moer o corredor** (Seção 2.14.4).

---

**A15 — ✅ XP flat: a CAVE1 entra na regra, e a captura de ghost passa a valer o mesmo que um inimigo?** *(VOCÊ JÁ RESPONDEU SIM PARA AS DUAS em 25/09 — `00_BRIEF.md` §10. Aqui fica só o registro e o número final.)*
- **(a) As duas, sim** — a CAVE1 (`multFase = 500`) entra na mesma regra, e o fantasma de captura da Ghostdex passa a pagar o valor do **inimigo comum**, perdendo a escada própria `1,15^fase` (que valia **87,6×** entre a fase 1 e a 33) · (b) só a CAVE1 · (c) nenhuma das duas *(a versão literal de "as 33 fases")*
- **É (a), e os números confirmam que foi a escolha certa [CÁLCULO, 2.14.8]:** com as três pontas fechadas, **não sobra atalho nenhum**. Todo lugar de farm do jogo fica **mais lento** que o jogador mais devagar da fase 1 — CAVE1 **0,543×**, fase 33 **0,400×**, cactus **0,371×** — e **nada no jogo supera a fase 1 em mais de +1,3%**. A dispersão por *lugar* virou unilateral para baixo: escolher a fase deixou de ser decisão de otimização.
- **O risco que você levantou sem fazer a pergunta — o XP duplo — não existe** **[VERIFICADO: `engine.js:3307-3321`, `ghost_inventory.js:8/43`]**: *capturar* e *matar* são o **mesmo** evento. `UnlockGhostForPlayer()` roda dentro do bloco de morte, depois do **único** `addXp()`, e **não concede XP nenhum** (grava o verbete com `xp: 0`, que é o XP *da espécie*, não o do personagem). A sua regra muda só **o valor** desse crédito único. **Recomendo registrar como invariante de código** para que ninguém acrescente um `addXp` na captura no futuro — é a única forma de o duplo-XP nascer.
- **O bônus que ninguém tinha previsto:** com a captura valendo o mesmo que um comum (e portanto crescendo com `L^1,90`), a **Ghostdex sai de "irrelevante depois do nível 100" para "relevante para sempre"** — de 5.750 XP congelados para 1,59e22 no fim do jogo. **Consequência:** o peso **8** que eu havia dado à captura na tabela por Era da Seção 2.5 fica **superado**; passa a ser **1**, e a tabela precisa ser renormalizada na implementação.
- **Um cuidado de sensação, não de régua:** nos níveis 1 a 4 a captura fica lenta (6 a 115 golpes, porque o HP do fantasma não cresce com o nível) **e** paga como um crow — a primeira captura da vida perde o "uau". **Recomendo cobri-la com o mecanismo já aprovado em 2.6** (primeira vez de cada espécie = evento de história, creditado inteiro, fora da curva de saturação). São só **101 espécies**: conjunto finito, não fonte renovável.
- **O que isto NÃO faz, e é importante você saber:** **não substitui o teto diário**. A dispersão que sobra (37,6×) é **100% "quão rápido você joga"** e **0% "onde você joga"** — comprimi-la é o trabalho do orçamento diário e da curva `n₀` (1,29× residual). **Teto diário impede farm de TEMPO; esta regra impede farm de LUGAR.** Precisa das duas (2.14.6).
- **Custo e trava:** é a **única** peça deste plano construível **hoje**, sem spawn autoritativo e sem migração. São **duas** fórmulas de XP, **um ponto cada por plataforma** — `engine.js:998`→`:1105` e `:3239`→`:3311`, com os pares mobile em `:960`→`:1067` e `:3180`→`:3252` — **sem tocar em nenhum HP**, mais recompilar o APK. **Recomendo tratá-la como item de Fase 0.** Trava: nenhuma, só a paridade web/mobile.

---

**A15-b — 🆕 O princípio de XP flat vincula os Episódios futuros, ou cada um se decide na hora?**
- **(a) Vincula: todo Episódio futuro começa a própria régua de XP flat, igual ao padrão do Episódio 1** — um inimigo se distingue pela **Era** em que morre e pelo seu **tipo**, jamais pelo número da fase · (b) só o Episódio 1 por ora, decidindo os futuros quando existirem
- **Recomendo (a).** A regra por trás é: **o XP codifica *quando* (a Era) e *o quê* (o tipo) — nunca *onde***. "Fase" é lugar, e todo prêmio que depende de lugar cria um lugar ótimo; num jogo de 1.121 anos, um lugar ótimo é um jogador preso num corredor por séculos.
- **Custa zero trabalho a mais que (b)**, porque a tabela por Era da Seção 2.5 **já é indexada por Era e tipo, sem coluna de fase**. (a) só fecha a porta para alguém reabrir o problema no Episódio 2 por distração.
- **Se um Episódio futuro precisar ser "mais lucrativo"**, o lugar disso é **loot, badge e relíquia** — nunca o XP, que é a única grandeza travada pela régua.
- **Trava:** nenhuma hoje (o Episódio 2 não existe). É uma decisão de **princípio**, e o valor dela é justamente estar escrita antes de haver pressão para violá-la.

---

### 14.3 As decisões do v1 que continuam valendo

| # | Pergunta | Recomendo | Trava |
|---|---|---|---|
| **A1** | Formato da curva | **suave**, `L*(H) = 20H + (1e11−20T)(H/T)³`, Eras ancoradas em **tempo** | Fase 2′ |
| **A2** | O que "3147" promete | **"cerca de 365 h/ano, quando der"** + **cada Linha tem a própria estrada**; o que espera pelo calendário é a **Keystone**, não o contador | Fase 1′ |
| **A3** | Quanto rende a hora extra | **`τ = 0`** no lançamento. Subir depois é generosidade; baixar é punição retroativa | Fase 1′ |
| **A5** | A régua é da pessoa ou da Linha | **da Linha** — e com o XP vindo de kills isso virou **obrigatório**, não elegante | Fase 1′ |
| **A6** | Regras de hash *(sem volta)* | **Crônica:** RFC 8785 + prefixo `dgc1:`. **Raiz OG:** `DGOG1` + RFC 6962. **Duas árvores, duas regras declaradas** — e vetores em duas linguagens antes de qualquer registro ou carimbo | Fase 3′ / **antes do carimbo** |
| **A7** | Os ~139 personagens atuais | **Era Zero** (nível antigo vira `pre_era_level`, contador começa em 1) **+ selo OG** como compensação | Fase 3′ |
| **A8** | Menores entram na régua | **sim, com as 12 salvaguardas e kill-switch**, com o **Modo Aprendiz** como padrão provisório até o parecer chegar | Fase 3′ |
| **A9** | Linha órfã pode ser adotada | **sim, só com opt-in**, perguntado obrigatoriamente na Investidura. **É o que torna o conceito viável** (risco 2) | Fase 3′/4 |
| **A10** | Android: registrar-se + chave de release | **sim, até 31/12/2026**, com a keystore criada antes e em 2 cópias físicas. *(O site não quebra em 30/09 — essa onda é só de lojas)* | Fase 0-A′ |
| **A11** | Backup verificado + segunda pessoa | **sim, antes de qualquer migração** — e a segunda pessoa guarda também a cópia cifrada do arquivo privado do snapshot | Fase 0-A′ |

---

**A14 — 🆕 A régua pode aparecer ao jogador como recompensa por tempo conectado?** *(jurídica, e custa zero)*
- **(a) Não: o XP vem de derrotar inimigos; a régua de 1 h/dia é calibração interna e nunca é exibida como "fique conectado e ganhe". Nenhum multiplicador por tempo, nenhum bônus de login, nenhuma tela de "faltam X minutos"** · (b) mostrar o progresso por horas, porque é mais fácil de explicar
- **Recomendo (a), e esta é a única decisão da lista em que uma escolha que você já fez te protegeu sem que ninguém soubesse.** O Decreto 12.880/2026, art. 9º, parágrafo único, III lista *"a oferta de recompensas pelo tempo de uso"* entre os mecanismos proibidos em produtos de acesso provável por crianças **[VERIFICADO, texto integral]** — e a decisão A4 do v1 era literalmente isso.
- **Custo:** (a) custa nada e melhora a posição legal. (b) põe o conceito central do Legado dentro da descrição literal de um inciso proibitivo.
- **Trava:** Fase 3′ (e o parecer do advogado no G3).

---

### 14.4 As importantes, por fase (uma linha cada)

**B1** Nível de Combate logarítmico `100·log₁₀(1+L)` — sem ele o dano chega a ~1,4e8 no ano 1 · **B2** `login_handle` agora, modelo definitivo antes da 1ª Passagem a não-familiar · **B3** web + mobile ao mesmo tempo = **bastão de crédito**, nunca derrubar em silêncio · **B4** `token_epoch` na Fase 0-A′ (conserta um problema que já existe) · **B5** prazos de dormência: Sinal 180 d · aviso ao Heir 270 d · Dormente 365 d · Resguardo 730 d · Vigília 30 d · **B6** só três caminhos para trocar de Guardião: Ritual, Cofre, ordem judicial · **B7** Chave do Legado obrigatória, 24 palavras, 2 cópias, só o `SHA-256` guardado, **reemissível** · **B8** MFA obrigatório para Keepers a partir da 1ª sucessão · **B9** fraude antiga = **Selo de Contestação** + ajuste datado, nunca reescrita · **B10** publicar a "cabeça" da Crônica semanalmente em ≥ 3 testemunhas, ≥ 2 independentes de você · **B11** "zerar" = a Linha se aposenta com honra; Keystone conjunta em caso de empate · **B12** ghosts secundários: Rank 1–100, **sem crédito e sem XP de legado**, e **suas kills não entram no orçamento** · **B13** itens por razão, com Selo de Era e Reforge — nada de power creep por Era · **B14** relíquias **e o selo OG** honoríficos e não transferíveis · **B15** Supabase pago + réplica na VPS + export semanal fora (**réplica não é backup**) · **B16** a conta é **licença**, não propriedade · **B17** Crônica e lista OG com **zero dado pessoal** como padrão global · **B18** anti-RMT estrito: designação ≥ 30 d, guarda de 180 d, atestado de gratuidade, sanção com apelação · **B19** menor como herdeiro: Adulto Responsável + escada pausada · **B20** Termos em PT-BR autoritativo + tradução EN · **B21** 🆕 **o XP acumulado NÃO é gravado** — guarda-se `(nível, XP residual)` e deriva-se o resto · **B22** 🆕 **bônus de XP em item só pode acelerar a chegada ao teto do dia, nunca aumentar o teto**.

### 14.5 As que podem esperar

**C1** travar o vocabulário só **depois** da revisão por nativo de inglês · **C2** 10 Eras ancoradas em tempo · **C3** Era I com 1 fase por hora creditada, rejogo livre · **C4** escada das 333 badges vira Marcos de Dígito (é migração) · **C5** duas moedas: Score + Óleo da Lanterna, **e o Score deixa de ser concedido por chamada de `addXp()`** · **C6** PvP futuro com Nível de Batalha fixo · **C7** Coro e Monumento desenhados agora, implementados só na Era VIII · **C8** moldura narrativa só com canon; E3 desaconselhado · **C9** Legacy Day no aniversário da Fundação, Roll Call em 21 de junho · **C10** eventos dão só memória, nunca poder · **C11** nenhuma temporada até o ano 3 · **C12** placares públicos sem nível e sem horas exatas por 3–5 anos · **C13** rotular o chat MQTT como "public, unmoderated", **não hospedar ritual nele e não pôr selo nele** · **C14** contador "Dia N de 409.538" + página "Saúde do Legado" · **C15** licença AGPL-3.0 + CC BY-SA 4.0, depois de auditoria de titularidade · **C16** trilha jurídica escalonada: adjunto → associação → fundação · **C17** financiar primeiro o piso (N3/N4) · **C18** domínio: pré-pagar 10 anos, travar, 2FA físico, monitor externo · **C19** bot/IA **não** pode ser Keeper nem ter selo OG; IA auxiliar aparece **marcada `[IA]`** · **C20** 2 Lookouts no ano 1, Scribes no ano 2, rodízio de 2 anos · **C21** 🆕 re-carimbar o manifesto OG periodicamente e guardá-lo no Arquivo.

**Mais cinco, de produção:** **P1** qual é o seu ritmo real (3 ou 5 dias/semana) — muda o calendário inteiro · **P2** fazer F-1 e a Fase 0 mesmo se o conceito for recusado (recomendo **sim, começar esta semana**) · **P3** tamanho do MVP (recomendo o enxuto) · **P4** quando anunciar — **revisto em 24/09**: a **regra do selo, agora** (com o texto carimbado); o **conceito** só após o G3; e **campanha larga de aquisição** só depois do vazamento de e-mail e do item de menores (Seção 7.3) · **P5** quem é o adjunto — **eu preciso que você nomeie uma pessoa**, nenhum agente escolhe pessoas.

### 14.6 Como aprovar

**Para destravar a F-1 (o vazamento de e-mail e o anúncio do selo):**

> *"Corrijam o vazamento de e-mail — é prioridade 1. Selo OG: **OG1: (a)**, corte `2027-08-26T03:00:00Z` (exclusivo — o dia 25/08/2027 conta, o 26 não). **OG3: (a)**, anuncio agora, com o texto carimbado e a frase 'honorary only, nothing to buy'. **OG4: (a)**, honorífico puro. **OG2: (a) + (a1)** — sinal de vida para quem se cadastrar depois do anúncio. **OG1-b: (a)** — autorizo o marco interino somente-leitura, **eu** executo, e autorizo na mesma sessão a distribuição de níveis e a contagem de senhas não migradas."*

*(Se você preferir pular o marco interino, troque a última frase por: **"OG1-b: (c)"** — só os dois levantamentos, sem raiz e sem carimbo. Nada do selo se perde: a leitura que vale é a de 26/08/2027.)*

**Para autorizar a Fase 0** (o que vale mesmo que você recuse o conceito):

> *"Aprovo a Fase 0. A10: (a). A11: (a). A14: (a). **A15: (a)** — confirmo o que decidi em 25/09: XP flat nas 33 fases **e na CAVE1**, e a captura de ghost valendo o mesmo que um inimigo comum; tirem o multiplicador de fase e a escada `1,15^fase` da conta do XP já nesta fase, na web e no mobile, **sem tocar em nenhum HP**, e registrem o invariante de que a captura nunca concede XP por si. **A15-b: (a)** — vale como princípio para todo Episódio futuro. B4: sim. B16: (a). B20: (a). C18: sim. P2: sim. Meu adjunto é \<nome\>. Meu ritmo é \<3 ou 5 dias/semana\>."*

Isso libera: corrigir os comentários do `db.js`, montar o backup com teste de restauração, cifrar os dumps antigos, resolver o Android antes de 31/12, arrumar os tetos numéricos, ligar a revogação de sessão, contratar o advogado e cuidar do domínio. **Nada disso constrói o Jogo Legado** — tudo conserta o jogo que já está no ar.

**Para autorizar o conceito** (Fases 1′ a 3′, até o lançamento):

> *"Aprovo o conceito. A1: (b). A2: (b)+(c). A3: (a). A4′: (c). A5: (a). A12: (b). A13: (b). A15: (a). A15-b: (a). A6–A9 decido no portão G2. Autorizo os levantamentos somente-leitura."*

**Se você concordar com tudo o que está recomendado**, basta: ***"Aprovo o snapshot, a Fase 0 e o conceito, com todas as recomendadas. Adjunto: \<nome\>. Ritmo: \<A ou B\>."***

**E se você quiser recusar o conceito**, a saída limpa é: *"Autorizo só a F-1 e a Fase 0."* Nada se perde — o roadmap foi desenhado exatamente para que essa resposta seja possível sem desperdício. **Mas repare:** mesmo recusando o conceito inteiro, **o selo OG continua valendo**, porque ele é o seu pedido, é barato, e não depende de nada disto.

> ⚠️ **Com uma ressalva que a janela criou e que não existia antes.** Se você recusar o conceito **e** anunciar a janela, fica em pé um compromisso público com data marcada: **alguém tem que rodar a leitura final em 26/08/2027 e a UI do selo tem que estar no ar antes disso.** São ~1 dia de trabalho seu e o bloco C+D do selo (~4,5–6,5 dias-dev). **Não é muito — mas é um compromisso de onze meses assumido em público, e ele sobrevive à recusa de tudo o mais neste documento.** Se isso o incomoda, a hora de dizer é **antes** do anúncio, não depois.

### 14.7 Os primeiros 7 dias, se você disser sim a tudo

Esta é a ordem literal, e ela existe porque **a ordem importa**:

**A ordem MUDOU em 24/09, e a mudança é grande.** Na versão anterior, os dias 1 a 4 eram todos sobre congelar a lista OG antes que fosse tarde, e o anúncio só cabia no dia 7 — depois do carimbo. **Agora o anúncio é uma das primeiras coisas** (custa zero e melhora quanto antes sair), **a correção do vazamento de e-mail subiu para o dia 1** (é o único item com relógio) e **a leitura do banco desceu**, porque virou opcional. A classificação de elegibilidade saiu inteira desta semana: ela só acontece em setembro de **2027**.

| Dia | O que acontece | Quem |
|---|---|---|
| **1** | **Você responde OG1** (a constante do corte) e **OG3** (anunciar agora). São trinta segundos e destravam o resto | **você** |
| **1** | **Começa a correção do vazamento de e-mail** — lista branca no `sync_state`, id opaco no overworld. É a prioridade 1 do plano inteiro | agentes |
| **1** | Você pré-paga e tranca o domínio, e liga o 2FA físico (1 hora sua) | **você** |
| **2** | **Anúncio da janela OG** nos canais oficiais: a regra, a data, e *"honorary only, nothing to buy"*. **Carimbe o próprio texto do anúncio** (OpenTimestamps, 5 minutos) e publique em ≥ 3 testemunhas | **você** |
| **2** | Você contrata/agenda o advogado — é o item com maior prazo de terceiros | **você** |
| **2–3** | Vazamento de e-mail: espelho no mobile, `cap sync`, APK novo, verificação do `qa-lead` com duas contas descartáveis em dois aparelhos | agentes + **você no deploy** |
| **4** | Correção dos 4 comentários enganosos do `db.js` (10 linhas) | agentes |
| **4** | O `backend-architect` escreve o script somente-leitura **parametrizado pelo `CUTOFF`** (o mesmo que vai rodar em 2027); o `security-engineer` revisa (`grep` de escrita = zero) | agentes |
| **5** | Ensaio do script num Postgres local com dados falsos. Verificador escrito **em Python** (a segunda linguagem) | agentes |
| **6** | *(opcional, OG1-b)* **Você executa o marco interino.** Raiz interina calculada, manifesto marcado `snapshot_type: "interim"`, `.ots` pedido. Na mesma sessão: distribuição de níveis e contagem de senhas não migradas | **você** |
| **7** | *(opcional)* `ots upgrade` e publicação do marco interino em ≥ 3 testemunhas | **você** + agentes |

**Depois disso, e só depois**, começa a Fase 0-A′ de verdade (backup, Android, tetos numéricos, `token_epoch`, Termos).

> **E os dois compromissos que ficam marcados na agenda para depois desta semana:**
> - **Até 26/08/2027:** a UI do selo (blocos C e D de 10.11) tem que estar **no ar**, senão a janela fecha sem que ninguém veja o que ganhou.
> - **Em 26/08/2027:** rodar o **mesmo** script com o `CUTOFF` final, carimbar, publicar, classificar (aí sim você revisa as exceções em tela), conceder e `frozen_at`. **~1 dia seu, e é a única data deste plano que não se move.**

---

## 15. Anexos

### 15.1 Índice dos relatórios de origem

**Em `danger ghost/docs/legacy-plan/raw/`:**

| Arquivo | Autor | Em uma linha |
|---|---|---|
| `00_BRIEF.md` | MP | O seu pedido verbatim, as restrições inegociáveis e o checklist de 12 lacunas |
| `01_filosofia.md` | `legacy-philosopher` | Definição formal, 5 condições, 10 princípios com fonte verificada, vocabulário, 6 modos de falha ética |
| `02_calibracao.md` | `progression-actuary` | A curva, a definição da hora, o orçamento diário, sensibilidade, precisão numérica, Monte Carlo |
| `03_sucessao_cronica.md` | `legacy-systems-designer` | Papéis, 7 estados, a Passagem, a Crônica em camadas, UX do herdeiro, 30 casos de estresse |
| `04_durabilidade.md` | `deep-time-archivist` | N1–N4, sucessão do operador, o Arquivo, formatos, teste dos 50 anos, financiamento |
| `05_integridade_antiabuso.md` | `security-engineer` | Auditoria do XP de hoje, tempo autoritativo, 14 vetores de abuso, a Chave do Legado, anti-RMT |
| `06_juridico_privacidade.md` | `digital-succession-counsel` | Decreto 12.880, 12 salvaguardas, LGPD × Crônica, menores, herança digital, entidade |
| `07_conteudo_eras_economia.md` | `game-designer` + `level-designer` + `game-economy-designer` | 10 Eras, a hora de 4 Movimentos, escala dos sistemas, economia, o fim de jogo jogável |
| `08_liveops_comunidade_narrativa.md` | `live-ops` + `community-manager` + `narrative-designer` | Moldura no lore canônico, extensões E1–E5, rituais, papéis de comunidade, o Fechamento |
| `09_arquitetura_migracao.md` | `backend-architect` | 9 tabelas, o fluxo autoritativo, sucessão técnica, migração Era Zero, backup, custo em escala |
| **`10_auditoria_adversarial.md`** | `forensic-analyst` | **16 contradições com veredito, 25 cenários de red team, 23 correções — manda sobre os outros nove** |
| `11_roadmap_produtor.md` | `producer` | 7 fases, 6 portões, MVP, itens não cortáveis, calendário, capacidade, custos |
| **`12_xp_inimigos_e_calibracao_por_xp.md`** | `progression-actuary` | **O censo de XP, os multiplicadores 666/500, o orçamento cumulativo, a curva de saturação, o Desenho C. Revisa a A4 — é a base da Seção 2 deste v2.** ⚠️ **Dois números dele estão SUPERADOS** pela Seção 2.14 (25/09): o farm da fase 33 vale **~5,2 anos, não 0,21**, e a dispersão de hoje é **~272×, não 12.375×** — porque ele *supôs* o ritmo de kills em vez de derivá-lo do HP. Onde divergirem, vale a Seção 2.14. Também estão superados dois "limitadores" dele: o cronômetro de 240 s (decorativo) e o dano do inimigo escalando por fase (não escala) |
| **Seção 2.14 (sem relatório separado)** | `progression-actuary` + `game-designer` | **As decisões de XP flat de 25/09**: os 3 cenários calculados, a inversão do atalho da fase 33, a convivência com o orçamento diário, o escopo (A15/A15-b) e, em **2.14.8**, o fechamento da CAVE1 e da captura de ghost — com a prova de que **não existe XP duplo** (capturar é o mesmo evento que matar) e de que **não sobra atalho**. Scripts: `13_xp_flat_ep1.js`, `13b_ancoras.js`, `13c_fechado.js`, `13d_fix.js` (scratchpad) |

**Em `danger ghost/docs/legacy-plan/chain/` (usados aqui só no que é Web2):**

| Arquivo | Usado neste plano para |
|---|---|
| **`24_selo_og.md`** | **A Seção 10 inteira**: elegibilidade, regra `DGOG1`, OpenTimestamps, UI (16 superfícies com arquivo:linha), postura honorífica, LGPD. ⚠️ **A data de corte que ele propõe (`2026-09-22T03:00:00Z`) está SUPERADA** pela decisão do dono de 24/09/2026 — onde ele e a Seção 10 divergirem sobre o corte, **vale a Seção 10** |
| **`25_auditoria_adversarial_chain.md`** | O texto integral do Decreto 12.880 e o achado sobre a **régua**; a senha em texto puro × selo OG; o veredito de **uma regra de hash só**; a sobrevivência revisada para ~11%; o vocabulário canônico. ⚠️ **O "prazo vencido do snapshot" que ele levanta deixou de existir** com a janela de fundação; o resto do relatório continua válido |

> **Por que os arquivos em `chain/` não foram corrigidos:** eles são o **registro histórico** do que se pensou em 21/09, e reescrevê-los apagaria a própria trilha que dá credibilidade a este plano — inclusive a divergência declarada entre `chain/25` e `chain/26` sobre o corte, que a Seção 0.1 da versão anterior arbitrava. **Este documento é a versão vigente; eles são de onde ela veio.**
| `26_roadmap_v2_produtor.md` | A metade Web2 do roadmap (Seção 11) e as estimativas revisadas |
| `13` a `23`, `27` | **Não usados aqui.** São o plano da blockchain — documento separado e congelado |

### 15.2 Glossário curto

| Termo | O que é |
|---|---|
| **Régua** | A sua promessa: 1 h/dia ⇒ nível 1e11 em 3147 |
| **Linha (Line)** | A conta + a corrente de pessoas que a seguraram. **É a unidade do conceito** |
| **Odômetro** | O número do nível, tratado como contador gigante |
| **XP autoritativo** | O servidor concede o XP; o cliente só mostra uma previsão |
| **Orçamento diário de XP** | Quanto XP a Linha pode ganhar no dia, derivado do tempo creditado |
| **Curva de saturação / `n₀`** | O rendimento decrescente dentro do dia: `B × (1 − e^(−n/n₀))` |
| **Piso (Desenho C)** | O mínimo garantido a quem cumpriu a hora e matou ao menos 10 inimigos |
| **Spawn autoritativo / recibo de kill** | O servidor decide quando um inimigo nasce (`spawnId`) e só credita kills que correspondam a um spawn real |
| **Banco de Vigília** | O mecanismo do teto diário, com reposição de dias perdidos |
| **`τ` (tau)** | Quanto rende a hora extra no mesmo dia. `τ = 0` = não rende nada |
| **Monte Carlo / harness** | Rodar a simulação centenas de vezes para ver a distribuição, não só a média / o banco de testes da calibração |
| **Modo sombra** | Calcular sem aplicar, só gravando, para comparar |
| **Portão go/no-go** | Lista de conferência no fim de cada fase; é o freio de mão do projeto |
| **Hash / cadeia de hash** | Uma "impressão digital" de um texto; cada entrada carrega a da anterior, então mexer no passado quebra tudo daí para frente |
| **Árvore Merkle / raiz** | Uma pirâmide de impressões digitais: cada nível junta duas numa, até sobrar uma só. Mudar qualquer folha muda a raiz |
| **Prova de inclusão** | Os poucos "irmãos" que provam que uma folha está na raiz — 192 bytes para 48 folhas |
| **RFC 8785 (JCS) / RFC 6962** | Regra padronizada de escrever JSON sempre igual / regra padronizada de montar árvore Merkle |
| **OpenTimestamps** | Serviço gratuito que carimba uma impressão digital no Bitcoin, sem cadastro e sem chave |
| **`og_id`** | 32 bytes aleatórios que identificam uma conta na lista OG. É a "senha do certificado", e **não** deriva do e-mail |
| **`token_epoch`** | Um contador que, ao subir, invalida todas as sessões abertas |
| **Legacy Key / Chave do Legado** | O segredo em papel que resgata a Linha. Em Web2: 24 palavras do servidor, reemissíveis |
| **Keystone** | **Só** o fim do jogo (colocar a última pedra). Nunca a chave |
| **Keeper / Guardião** | O mesmo papel: `Keeper` em inglês, `Guardião` em português |
| **Sideload / keystore** | Instalar um app Android fora de loja / a chave que assina o app |
| **RMT** | *Real-money trading*: vender conta ou item por dinheiro de verdade |
| **LGPD / ECA Digital / ANPD** | A lei de proteção de dados; a lei de proteção de menores no digital; a agência que fiscaliza |
| **Dark pattern** | Truque de interface feito para você fazer algo que não faria pensando com calma |
| **Bus factor** | Quantas pessoas precisam sumir para o projeto morrer. Hoje: 1 |

### 15.3 Fontes-chave verificadas

- **Decreto nº 12.880, de 18/03/2026** (art. 9º, **parágrafo único, incisos I–IV**) — **texto integral lido na publicação oficial** (Câmara dos Deputados, base LEGIN), consultado em **2026-09-24**. Isto **fecha** a pendência nº 4 do plano v1.
- **Lei nº 15.211/2025 (ECA Digital)** — sancionada em 17/09/2025, em vigor desde 17/03/2026; escopo de "acesso provável"; cronograma de fiscalização **[V-secundário]**.
- **Android:** `developer.android.com/developer-verification`, consultado em **2026-09-24** — 30/09/2026 vale para **lojas participantes**; o rollout **global** é em **2027**.
- **OpenTimestamps:** `opentimestamps.org` e o README do cliente oficial, consultados em 2026-09-21 — gratuito, sem cadastro, ancoragem no Bitcoin em "algumas horas".
- **Herança digital:** STJ REsp 2.124.424 (26/09/2025); ANPD Nota Técnica 3/2023; PL 4/2025; Termos de Steam, PlayStation e Nintendo.
- **Filosofia e cultura:** Jefferson a Madison (06/09/1789); Burke (1790); Paine (1791); Jonas (1979); Parfit (1984); Brand (1999); Ise Jingu (62ª reconstrução em 2013, 63ª em 2033); Plutarco; Sagrada Família (torre central concluída em 20/02/2026); Kongō Gumi (absorvida em 2006); Camus (1942); Erikson; Scheffler; Deci & Ryan.
- **Código do projeto:** `server/db.js`, `server/index.js`, `server/migratetosupabase.js`, `server/migrate_level_bigint.js`, `rpg_system.js`, `js/game/engine.js`, `js/game/overworld.js`, `js/game/network.js`, `js/ui/ui_manager.js`, `js/web2/*`, `android/app/build.gradle`, e os espelhos em `danger_ghost_mobile/www/js/`.

### 15.4 O que NÃO foi verificado — leia antes de confiar demais

1. **Nenhum achado foi reproduzido contra o banco de produção.** O modo PLANO proíbe, e isso foi respeitado — inclusive quando custou o prazo do snapshot OG.
2. **`js/game/engine.js` não foi lido por inteiro** (220 KB). A afirmação "só existem duas fontes de XP" vale **nos dois pontos conhecidos**, encontrados por busca em todos os arquivos carregados pelo `index.html`; a varredura exaustiva continua pendente e é pré-requisito da Fase 2′. 🆕 **Em 25/09 essa afirmação ganhou uma confirmação extra por outro caminho:** a busca por `UnlockGhostForPlayer` em todo o repositório mostra que a captura de ghost **não** concede XP em nenhum arquivo (`ghost_inventory.js` grava o verbete com `xp: 0`), então o único crédito por fantasma morto continua sendo o `addXp` do bloco de morte **[VERIFICADO]**.
3. **O ritmo real de kills nunca foi cronometrado.** Os limitadores estruturais são verificados; o comportamento humano é **[HIPÓTESE]**. 🆕 **Na Seção 2.14 isso vira um parâmetro único e explícito, o `t_overhead` (39,5 s por kill, o tempo de não-combate)**, e a tabela de sensibilidade de 2.14.3 mostra que nenhuma conclusão da decisão A15 muda entre 5 s e 120 s. O que **está** verificado ali: o dano do inimigo **não** escala com a fase (`takeDamage(amount=1)` em todos os chamadores) e o cronômetro de 240 s por fase **não limita nada** (`g_timeRemaining` é reatribuído em todo frame) — os dois corrigem suposições do `raw/12`.
4. **O vazamento de e-mail foi inferido por leitura estática**, não reproduzido ao vivo.
5. **O comportamento real do WebView do app** (heartbeat, recibo de kill, o que se perde ao reinstalar) não foi testado.
6. **Nenhum tamanho de tabela, latência ou custo real foi medido.**
7. **A escala do canvas no mobile** (fator ~0,55 em pé) foi **calculada por proporção, não medida** num aparelho; as posições em pixel do selo são aproximações que **precisam de captura de tela** para fechar.
8. **O modelo de sobrevivência geracional é simples.** Os ~11% são **teto**, não previsão; com correlação realista a ordem é 3–5%. Serve para dar **ordem de grandeza** — e a ordem de grandeza é dura em qualquer variação razoável.
9. **Nada aqui é parecer jurídico.** O texto do Decreto foi lido; a **interpretação** dele aplicada ao seu jogo precisa de advogado.

**O que só você pode informar:** o plano contratado do Supabase; se existe backup hoje; o custo real da VPS; **quais contas são de teste**; se a regressão do botão de pulo no mobile ainda está aberta; quanto o advogado cobra; quem é o adjunto; e o seu ritmo real de trabalho.

---

**Declaração final.** Nenhum arquivo do jogo, do servidor ou do mobile foi alterado. Nenhuma migração foi executada. **Nenhuma consulta foi feita ao banco de produção e nenhum snapshot foi executado.** Nenhuma credencial foi lida. O único arquivo escrito foi este documento.

**E a última frase, que é a única coisa deste plano com hora marcada:** *a lista das contas de hoje ainda não está congelada, e cada dia que passa a torna menos provável.*

*Fim do plano do Jogo Legado. A blockchain é outro documento, e está congelada.*





