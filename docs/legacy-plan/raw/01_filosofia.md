# 01 — Filosofia do Jogo Legado

**Agente:** `legacy-philosopher` · **Data:** 2026-09-20 · **Modo:** PLANO (nenhuma linha do jogo foi tocada)
**Li antes de escrever:** `docs/legacy-plan/00_BRIEF.md` (integral), `CLAUDE.md` (integral), skill `intergenerational-design-philosophy`, e confirmei no código real que `rpg_system.js` já tem o teto `100000000000` (linhas 986, 1348, 1406, 1485) e a inversão da soma acumulada de XP (linhas 489–513).
**Todas as fontes citadas foram reverificadas por busca hoje, 2026-09-20.** URLs no Anexo A.

---

## Como ler este documento (leia esta caixa antes do resto)

O dono pediu "sem lacunas em aberto". Para isso, cada afirmação aqui vem com uma etiqueta:

| Etiqueta | O que significa |
|---|---|
| **[VERIFICADO]** | Conferi hoje por busca na web. A fonte está no Anexo A. |
| **[CÁLCULO]** | Vem de conta feita aqui, e eu mostro a conta. |
| **[HIPÓTESE]** | É minha interpretação ou proposta. Não é fato. Você pode discordar sem estar errado. |
| **[CONTESTADO]** | É muito repetido por aí, mas especialistas discutem. Nunca use como se fosse fato provado. |

E, dentro de cada princípio, eu separo três coisas que o pessoal costuma misturar (e é assim que projeto "filosófico" vira enganação):

- **Fato** — aconteceu, alguém escreveu, tem data.
- **Interpretação** — o que dá pra ler naquilo. Pode ser discutido.
- **Proposta** — o que eu sugiro que o *seu jogo* faça por causa disso. É minha opinião de design.

**Glossário rápido de termos que uso o tempo todo** (o dono é programador iniciante, então explico na primeira vez):
- **Mordomia / stewardship**: cuidar de uma coisa que não é sua, em nome de quem vem depois.
- **Usufruto**: no direito, o direito de *usar* uma coisa sem ser dono dela.
- **Mão morta (dead hand)**: quando alguém que já morreu continua mandando no que os vivos podem fazer, via testamento ou regra antiga.
- **Dark pattern**: um truque de interface feito de propósito pra você fazer algo que não faria se pensasse com calma.
- **Condição necessária**: se faltar, a coisa deixa de ser aquilo. **Condição suficiente**: se tiver todas, já é aquilo, não precisa de mais nada.

---

## (a) Resumo em 10 linhas

1. **"Jogo legado" tem definição formal** (§B.1): jogo de progresso único e contínuo, cuja linha de chegada foi posta **de propósito** além de uma vida humana, e que só avança se for **entregue, com consentimento, a outra pessoa**, ficando cada entrega registrada.
2. São **5 condições necessárias**: progresso único e contínuo; fim real além de uma vida; cadeia de pessoas; consentimento nas duas pontas; registro ininterrupto. Juntas, são suficientes.
3. Isso **distingue** Danger Ghost de mundo persistente, jogo idle/incremental, jogo dinástico (CK/Rogue Legacy), herança de item e "forever game" — cada um falha em pelo menos uma das 5 condições (tabela §B.1.3).
4. **Achado de maior impacto:** a condição 2 ("fim além de uma vida") **não é poesia, é um requisito matemático**. Sem teto de rendimento diário, um jogador de 16 h/dia zera dentro da própria vida e o jogo deixa *formalmente* de ser legado. Isso vira a Decisão D4 e uma dependência dura do `progression-actuary`.
5. **10 princípios** fundamentados em estruturas reais e verificadas hoje (§B.2): mordomia/usufruto, Burke, Jefferson-Paine (o contraponto), Jonas, Parfit + horizonte de sete, Long Now/pace layers, Ise Jingu, Navio de Teseu, catedrais + shinise, Camus.
6. **O contraponto é obrigatório** (Princípio 3). Burke sozinho constrói um jogo que acorrenta herdeiros. Jefferson ("a terra pertence aos vivos", 1789) e Paine ("governar além do túmulo é a mais ridícula das tiranias", 1791) são a trava ética: **o direito de recusar é parte do conceito, não uma concessão**.
7. **Vocabulário em inglês proposto** (§B.3), com tradução para você: **Keeper** (Guardião), **Heir** (Herdeiro), **the Chronicle** (a Crônica), **the Legacy Ghost** (o ghost do legado), **the Handover** + **the Investiture** (a passagem + a investidura), **the Keystone** (zerar o jogo).
8. **Armadilhas de tradução que eu peguei e você deve evitar:** `Custodian` = *zelador/faxineiro* no inglês dos EUA; `the Passing` = *falecimento*; `Remembrance Day` = feriado militar real (11/11).
9. **O "porquê jogar" tem três pernas verificadas** (§B.4): o dia vale por si (Camus + competência), contribuir pra algo que te sobrevive (Erikson, generatividade), e pertencer a uma linha que continua (Scheffler). A **autonomia** é a perna que o conceito mais ameaça — e o seu próprio "**se assim quiser**" é justamente o que a protege.
10. **6 modos de falha filosóficos** mapeados com mitigação (fardo herdado, streak como chantagem, o último Guardião niilista, conta abandonada, sunk cost, criança herdando) e **11 decisões** fechadas com recomendação clara em §(e).

---

## (b) Proposta detalhada

### B.1 — Definição formal de "jogo legado"

#### B.1.1 A definição (gênero próximo + diferença específica)

Definição clássica funciona assim: você diz a que **família** a coisa pertence (gênero próximo) e o que a **separa** dos outros membros dessa família (diferença específica). "Cadeira é um móvel (gênero) para uma pessoa sentar, com encosto (diferença)".

> **Gênero próximo:** um jogo de **progressão persistente** — existe um objeto de progresso (aqui: a conta + o ghost) que guarda o avanço e nunca é zerado entre sessões.
>
> **Diferença específica:** esse objeto tem uma **linha de chegada colocada deliberadamente além do alcance de uma única vida humana**, e só continua avançando se for **entregue, por consentimento, a outra pessoa** — sendo a **sequência das entregas** parte do conteúdo do jogo.

Juntando, a definição formal, em um parágrafo:

> **Um jogo legado é um jogo de progressão persistente cujo objeto de progresso é único, contínuo e transferível entre pessoas; cuja condição de término foi posta, de propósito, além do alcance de uma vida humana; e cuja continuidade depende de uma cadeia de detentores voluntários, em que cada entrega é um ato consentido nas duas pontas e registrado de forma permanente — de modo que o registro das entregas é, ele próprio, conteúdo jogável do jogo.**

Nas suas palavras, dono: *"um jogador deixa seu legado no jogo para o próximo jogador **se assim quiser**"*. Essas quatro palavras finais não são um detalhe — elas são a **condição 4** abaixo, e são o que separa um jogo legado de uma corrente de obrigação. Eu tratei "se assim quiser" como cláusula constitucional do conceito inteiro. **[HIPÓTESE — interpretação minha do seu pedido, mas fundamentada; ver Princípio 3]**

#### B.1.2 As 5 condições necessárias (e por que juntas são suficientes)

| # | Condição | Enunciado | Se faltar, vira o quê? |
|---|---|---|---|
| **C1** | **Progresso único e contínuo** | Existe **um** objeto de progresso que nunca é resetado, nem por "prestígio", nem por morte de personagem, nem por temporada. | Vira jogo incremental com *prestige loop*. |
| **C2** | **Fim real, além de uma vida** | Existe uma condição de término **alcançável em princípio** (o nível 1e11) que **nenhum detentor individual consegue atingir sozinho**, por construção da curva. | Vira "forever game" (se não há fim) ou jogo longo comum (se dá pra terminar em uma vida). |
| **C3** | **Cadeia de pessoas** | O objeto passa entre **seres humanos distintos**, não entre personagens do mesmo jogador. | Vira herança de item / conta compartilhada. |
| **C4** | **Consentimento nas duas pontas** | O detentor **escolhe** entregar (ou não) e o herdeiro **escolhe** aceitar (ou não), sem punição por recusar. | Vira obrigação hereditária — e aí é dark pattern, não jogo. |
| **C5** | **Registro ininterrupto** | Toda entrega e todo detentor ficam registrados de forma permanente e legível; o registro é o que garante que continua sendo "o mesmo legado". | Vira só uma conta velha que trocou de dono. |

**Suficiência.** **[HIPÓTESE]** Eu afirmo que C1–C5 bastam: não é preciso que a cadeia seja **familiar** (pode ser amigo, estranho, comunidade); não é preciso **blockchain**; não é preciso que o servidor seja imortal (ver C5 + Princípio 7 — o registro precisa sobreviver *ao próprio jogo*); não é preciso que o herdeiro **continue** jogando (uma linha pode terminar bem). Qualquer coisa que tenha C1–C5 é um jogo legado, mesmo que ninguém chame assim.

#### B.1.3 O que NÃO é — conceitos vizinhos

| Conceito vizinho | Exemplo real | Qual condição ele **quebra** | Diferença em uma frase |
|---|---|---|---|
| **Mundo persistente** | EVE Online (2003), Ultima Online (1997), RuneScape (2001) — todos ainda ativos em 2026 **[VERIFICADO]** | **C2** (não há fim) e **C3** (a conta não passa; ela morre com o jogador) | Ali o que dura é **o mundo**; a conta é descartável. Aqui, o que dura é **a conta**; o mundo é o palco. |
| **Jogo incremental / idle** | Cookie Clicker e afins, com *prestige* (zerar pra ganhar multiplicador) | **C1** (o loop central é o reset) e **C3** | Números astronômicos, sim — mas o horizonte é o do próprio jogador, e resetar é a mecânica, não o fracasso. |
| **Jogo dinástico** | Crusader Kings (dinastia como unidade de jogo); Rogue Legacy (2013, Cellar Door Games — o herdeiro herda ouro e melhorias, com traços aleatórios) **[VERIFICADO]** | **C3** (a dinastia é ficção dentro da sessão; **o jogador é sempre o mesmo**) e, no Rogue Legacy, **C1** (o personagem morre e recomeça) | A dinastia deles é **narrativa**; a sua é **real, fora da tela**. Neles muda o personagem; no seu, muda **a pessoa na cadeira**. |
| **Herança de itens / heirloom** | Itens *account-bound* de Diablo/WoW; o paperdoll de lendários que o seu jogo já tem | **C3** (passa entre personagens do mesmo dono) e **C5** | Passa **coisa**; não passa **custódia**. |
| **"Forever game"** | Minecraft, LoL, Fortnite | **C2** (não existe linha de chegada) | Eles são eternos por **não terminarem**. O seu é longo por ter um **fim colocado longe demais para um só**. |
| **Conta vendida / RMT** | Mercado cinza de contas de MMO | **C4** (não há consentimento cerimonial, há preço) e **C5** | Transferência existe, mas é comércio. No jogo legado a entrega é **gratuita, cerimonial e registrada** — e a venda é proibida. |
| **Save compartilhado em família** | "Meu pai me passou o cartucho" | **C2** e **C5** | Bonito, mas não é sistema: não tem fim declarado nem registro. |

**Busca negativa (o que eu procurei e NÃO achei):** procurei precedente de **uma única conta** projetada para durar ~1.100 anos passando de pessoa em pessoa. **Não existe.** O recorde de MMO mais longevo em atividade é da casa dos ~30 anos (Nexus: The Kingdom of the Winds, lançado em 1996, com recorde Guinness registrado em 2022) **[VERIFICADO]**. Então: Danger Ghost não tem precedente pleno. Tem **precedentes parciais** (dinastia, mundo persistente, incremental) e **precedentes fora dos games** (catedrais, empresas seculares, santuários). Isso é honestidade, não fraqueza — mas significa que **nenhum número deste plano pode se apoiar em "já deu certo antes"**.

#### B.1.4 O que Danger Ghost É e o que NÃO é, sob esse conceito

**Danger Ghost É:**
- Um **jogo legado opcional**: a camada de legado é uma **escolha do jogador**, não o modo obrigatório. (Sua frase: "se assim quiser".)
- Um jogo cujo objeto de legado é a tripla **conta + Legacy Ghost + Chronicle** — e não só o número do nível.
- Um jogo com **fim declarado** (nível 1e11) e uma **régua pública** (1 h/dia, mesmo ghost ⇒ 3147), que funciona como **promessa verificável**: qualquer um pode conferir se a curva cumpre a régua.
- Um jogo em que **a Crônica é conteúdo**: ler quem veio antes é parte de jogar.

**Danger Ghost NÃO é (e o texto público precisa dizer isso com todas as letras):**
- **Não é uma obrigação familiar.** Ninguém deve nada a ninguém por não continuar.
- **Não é instrumento jurídico.** A Carta Selada não é testamento; a designação de herdeiro dentro do jogo não transfere bens (→ `digital-succession-counsel`).
- **Não é culto ancestral nem religião.** Usa a *estrutura* de práticas reais, não os seus símbolos sagrados (Princípio 7 e Decisão D5).
- **Não é promessa de que o servidor viverá até 3147.** Ninguém pode prometer isso. O que se promete é o **protocolo** para quando acabar (Decisão D6).
- **Não é jogo idle/AFK.** O tempo tem que ser tempo humano jogado (→ `legacy-systems-designer`, item 5 do brief).
- **Não é ativo financeiro.** Conta não se vende, não se compra, não vira NFT.
- **Não é, hoje, um jogo legado.** Hoje é um RPG rápido demais. Ele **passa a ser** quando C1–C5 estiverem implementadas e a curva respeitar C2.

#### B.1.5 Testes de caso-limite (a definição tem que aguentar estes sete)

| Caso | A definição responde | Encaminhamento |
|---|---|---|
| **1. Guardião que nunca entrega e morre** | Continua sendo jogo legado (C4 garante o direito de não entregar). A linha entra em **Dormancy** e a Chronicle fecha a entrada com "line ended here" — sem linguagem de culpa. | `legacy-systems-designer` (máquina de estados da dormência) |
| **2. Guardião que joga 16 h/dia** | **Aqui a definição morde.** Se 16 h/dia permite zerar em ~70 anos, **C2 é violada** e o jogo deixa formalmente de ser legado. Logo: **a curva precisa de rendimento decrescente/teto diário**, por definição, não por gosto. | `progression-actuary` (quantificar) + Decisão **D4** |
| **3. Ninguém reivindica a conta** | Dormancy não é morte. A Chronicle continua legível e a linha pode ser **adotada** por alguém do "Commons" **se o Guardião tiver autorizado isso em vida** (consentimento prévio satisfaz C4). | `legacy-systems-designer` + `digital-succession-counsel` |
| **4. O jogo acaba antes de 3147** | Não invalida o conceito, **se** a Chronicle sobreviver ao jogo (C5 exige registro legível, não servidor vivo). O legado passa a ser um documento. | `deep-time-archivist` + Decisão **D6** |
| **5. Dois herdeiros disputam** | Só **uma** conta continua a linha (C1: progresso único). O segundo pode receber uma **cópia da Chronicle** (leitura), nunca do progresso. | `legacy-systems-designer` + `digital-succession-counsel` |
| **6. Um bot/IA "herda" e joga décadas** | **Viola C3 e C4**: um bot não consente e não é pessoa. Proposta de regra: **o Keeper de registro tem que ser uma pessoa**; IA pode auxiliar, desde que **visivelmente marcada como IA** — exatamente a regra inegociável que o workspace já aplica ao `Agent G [IA]` (`CLAUDE.md` da raiz). | Decisão **D7**; integridade técnica → `legacy-systems-designer` |
| **7. Alguém zera (chega a 1e11)** | O conceito **prevê** isso: é a única forma de o jogo "acabar" por dentro. O que acontece depois é escolha de design, não de definição. | Decisão **D9** |

---

### B.2 — Os 10 princípios de design

Formato de cada um: **Fato** (com fonte e etiqueta) → **Interpretação** → **Regra de jogo** (o que o Keeper pode/não pode) → **Mecânica concreta** → **Cuidado ético**.

---

#### Princípio 1 — Custódia, não propriedade (mordomia / usufruto)

- **Fato.** No direito romano e nos códigos que descendem dele existe o **usufruto**: o direito de usar e fruir uma coisa **sem ser dono dela**. Thomas Jefferson usou exatamente essa palavra na carta a James Madison de **6 de setembro de 1789**: *"the earth belongs in usufruct to the living"* **[VERIFICADO]**. A ideia de mordomia (*stewardship*) é antiga e plural — não é de um autor só; não atribua a ninguém em particular. **[HIPÓTESE quanto a qualquer atribuição única]**
- **Interpretação.** Quem segura algo em custódia tem **deveres**, não só direitos. Ele responde a quem vem depois. Um dono pode destruir o que é seu; um custodiante, não.
- **Regra de jogo.** O Keeper **detém, não possui**. Ele pode: jogar, evoluir, equipar, nomear o herdeiro, escrever na Chronicle, recusar entregar, e **encerrar a própria linha**. Ele **não pode**: vender/alugar/trocar a conta por dinheiro, apagar entradas antigas da Chronicle, "resetar" o Legacy Ghost, ou transferir o progresso para outra conta.
- **Mecânica concreta.** Dois campos separados no banco: **`owner_of_record`** (a pessoa/conta) e **`keeper_of_line`** (quem detém a linha agora). São coisas diferentes, e é essa separação que permite tudo o mais (dormência, adoção, disputa). Na UI, a tela do legado abre com uma frase de custódia, não de posse: *"You hold this line."* — não *"Your account"*.
- **Cuidado ético.** A palavra *steward* carrega, em inglês, peso religioso e de hierarquia (e também "comissário de bordo"). Mantenha o termo do jogo **neutro** (ver §B.3). E cuidado com o inverso: custódia sem direito de saída vira servidão — é o Princípio 3 que equilibra este aqui.

---

#### Princípio 2 — A parceria entre os três tempos (Burke)

- **Fato.** Em *Reflections on the Revolution in France* (**1790**), Edmund Burke descreve a sociedade como uma parceria *"not only between those who are living, but between those who are living, those who are dead, and those who are to be born"* — precedida da razão: os fins dessa parceria **não podem ser obtidos em muitas gerações** **[VERIFICADO — citação conferida hoje]**.
- **Interpretação.** O presente é **um elo**, não a corrente inteira. Uma instituição que dura carrega conhecimento acumulado de gente que você nunca vai conhecer.
- **Regra de jogo.** A Chronicle é escrita em **três tempos**, e o Keeper atual só pode **acrescentar** ao seu.
- **Mecânica concreta.** A Chronicle tem três painéis: **The Dead** (Keepers anteriores, com a última mensagem de cada um — somente leitura), **The Living** (o Keeper atual, suas horas, sua era, seu texto editável), **The Unborn** (a **Sealed Letter**: uma carta escrita hoje para um herdeiro que ainda não tem nome, lacrada e só aberta no Handover). Um paralelo cultural real: os **zupu/jiapu** chineses, livros genealógicos de clã que registram não só nomes mas migrações, regras e feitos da linhagem **[VERIFICADO]** — a Chronicle é isso, e não uma tabela de ranking.
- **Cuidado ético.** Burke é um pensador **conservador**, e esse trecho foi escrito para defender a tradição **contra** a reforma. Você pode pegar a imagem sem comprar a política — e deve dizer isso. Não deixe o jogo insinuar "o jeito antigo é bom porque é antigo": o Princípio 6 (pace layers) existe justamente para o jogo poder mudar. Sobre o paralelo chinês: as tradições de veneração ancestral são **vivas e plurais** (variam entre China, Coreia, Vietnã, Japão) — não junte tudo num "tema ancestral asiático" genérico; use a *estrutura* (um livro de linhagem), não a estética.

---

#### Princípio 3 — A terra pertence aos vivos (o contraponto obrigatório)

> **Este é o princípio mais importante do documento.** Sem ele, os outros nove constroem uma corrente.

- **Fato.** Na mesma carta de **06/09/1789**, Jefferson escreve: *"I set out on this ground... that the earth belongs in usufruct to the living: that the dead have neither powers nor rights over it"* **[VERIFICADO]**. Madison respondeu em **04/02/1790** com uma refutação filosófica **[VERIFICADO]**. Thomas Paine, em *Rights of Man* (**1791**), é mais direto: *"Every age and generation must be as free to act for itself... The vanity and presumption of governing beyond the grave, is the most ridiculous and insolent of all tyrannies"* **[VERIFICADO]**. E o direito consuetudinário inglês criou uma trava institucional contra isso: a **rule against perpetuities**, que impede alguém de controlar a propriedade muito além das vidas existentes quando o documento foi escrito ("vida existente + 21 anos"), justamente para limitar o controle da **"mão morta" (mortmain)** **[VERIFICADO]**.
- **Interpretação.** Toda cultura que levou herança a sério **também** construiu um freio contra o morto mandar nos vivos. Um sistema intergeracional sem esse freio não é nobre — é tirania com boas intenções.
- **Regra de jogo.** **O herdeiro pode sempre recusar, sem penalidade, e sem que isso apareça como falha para ninguém.** O Keeper atual **não pode** impor condições ao futuro (nada de "só herda se jogar X horas", nada de metas amarradas). Nenhuma mensagem do jogo pode usar culpa ("you broke the line", "your father would be disappointed", "the line is dying").
- **Mecânica concreta.** Três coisas: **(1) Decline the Charge** — botão de recusa com o mesmo peso visual do de aceitar, e a Chronicle registra apenas *"declined"*, em tom neutro, nunca *"abandoned"* ou *"failed"*; **(2) nenhuma condição herdável** — o sistema tecnicamente não aceita cláusulas do Keeper anterior sobre o comportamento do próximo (é o equivalente da rule against perpetuities dentro do jogo); **(3) Retire the Line** — o Keeper pode encerrar a própria linha com dignidade, e a Chronicle fecha com um texto honroso, não com um obituário de fracasso.
- **Cuidado ético.** O risco aqui é o oposto dos outros princípios: **a beleza do conceito é o que o torna perigoso**. Quanto mais emocionante a Chronicle, mais pesada a recusa. Por isso a recusa precisa ser **projetada para ser fácil**, não só permitida. Recomendo que a tela de Handover mostre, com o mesmo destaque, as duas frases: *"You may accept this."* e *"You may decline this, and nothing is lost."*

---

#### Princípio 4 — Poder cria dever: a precaução do operador (Jonas)

- **Fato.** Hans Jonas, em *Das Prinzip Verantwortung* (**1979**; em inglês *The Imperative of Responsibility*, **1984**), argumenta que a tecnologia ampliou tanto o alcance da ação humana que a ética precisa cobrir efeitos distantes no futuro. Sua máxima: *"Act so that the effects of your action are compatible with the permanence of genuine human life"* **[VERIFICADO]**. É reconhecido como uma das origens filosóficas do **princípio da precaução** **[VERIFICADO]**.
- **Interpretação.** Quem tem poder assimétrico sobre um sistema longo — e aqui **o operador (você, dev solo) tem poder total** — assume dever proporcional. Na dúvida, pese mais o cenário ruim.
- **Regra de jogo.** Esta regra **não é sobre o jogador, é sobre você**: nenhuma operação irreversível sobre a linha de um Keeper (recalibração de curva, merge de contas, reset, migração de banco) sem um **caminho de volta testado antes**.
- **Mecânica concreta.** Um **Amendment Log** público: toda mudança em regra lenta (curva, regras de sucessão, formato da Chronicle) entra numerada, datada, com o estado anterior preservado e um plano de reversão escrito **antes** de aplicar. Casa com o item 11 do brief (critérios de aceite e plano de reversão) e com a prática que o projeto já adota em `docs/SAVE_SYSTEM_MASTER_PLAN.md` (invariantes explícitos).
- **Cuidado ético.** Jonas fala da sobrevivência da humanidade. **Não infle a ética de um jogo até esse registro** — é desonesto e soa ridículo. Use a *forma* do argumento (poder → dever → precaução), não a escala.

---

#### Princípio 5 — O dever é com o cargo, não com a pessoa (Parfit) + o horizonte de sete

- **Fato (a).** Derek Parfit, em *Reasons and Persons* (**1984**), Parte IV, cap. 16, formula o **problema da não-identidade**: escolhas que afetam o futuro também determinam **quem vai existir**, o que torna difícil dizer que aquelas pessoas foram "prejudicadas", já que com outra escolha elas nem existiriam **[VERIFICADO]**.
- **Fato (b).** A ideia de decidir pensando na **sétima geração** é largamente associada à Haudenosaunee (Confederação Iroquesa) e à Grande Lei da Paz. **[CONTESTADO]** — verifiquei hoje: a frase fixa *"consider the impact on the seventh generation"* **não aparece** nas transcrições escritas da constituição Haudenosaunee; a única passagem com o número sete trata das qualidades dos líderes, terminando com um conselho de considerar o bem-estar das gerações futuras. A datação da Grande Lei (entre ~1142 e ~1500) também é discutida entre especialistas **[VERIFICADO que é discutida]**. Cite sempre como *"princípio articulado por lideranças Haudenosaunee"*, **nunca** como regra antiga literal provada.
- **Interpretação.** Combinando: você não pode desenhar deveres para *uma pessoa imaginada* (o filho que você espera ter, com o perfil que você espera). O dever é com **quem quer que segure isto depois** — que pode ser um estranho, uma criança que ainda não nasceu, ou ninguém. E "olhar sete adiante" é um bom **teste prático** de projeto, mesmo sem a autoridade antiga.
- **Regra de jogo.** Nenhuma regra do sistema pode depender de **quem** é o herdeiro. Toda regra tem que funcionar com o slot **vazio**, com um **estranho**, com um **menor de idade** e com **alguém que nunca jogou**.
- **Mecânica concreta.** Duas coisas: **(1)** a ficha de sucessão guarda **papéis** (`heir_slot`), não pessoas — e todo estado do sistema tem comportamento definido para `heir_slot = NULL`; **(2)** um **teste de revisão de design**, obrigatório antes de aprovar qualquer feature do legado: *"o que o **sétimo** Keeper desta linha herda se a gente lançar isso?"*. Com ~25–30 anos por geração **[HIPÓTESE — o `progression-actuary` deve recalcular]**, sete Keepers ≈ 175–210 anos, e os 1.121 anos completos dariam ≈ **37 a 45 Keepers** **[CÁLCULO: 1121 ÷ 30 ≈ 37,4 e 1121 ÷ 25 ≈ 44,8]**. Esse número — "umas 40 pessoas" — é muito mais humano de comunicar do que "1.121 anos".
- **Cuidado ético.** Cultura viva. **Não** use palavras, símbolos ou grafismos Haudenosaunee como skin. Prefira **descrever a ideia** ("look seven Keepers ahead") a adotar o nome da tradição como nome de feature. Isso vira a Decisão **D5**. Quanto a Parfit: é filosofia avançada e fácil de deturpar — use como **lente para casos-limite**, nunca como slogan na tela.

---

#### Princípio 6 — Camadas de ritmo: o rápido aprende, o lento lembra (Long Now / Brand)

- **Fato.** A Long Now Foundation foi cofundada por Stewart Brand em **1996** e promove pensamento de longo prazo na escala de 10.000 anos **[VERIFICADO]**. Em *The Clock of the Long Now* (**1999**), Brand formula as **pace layers** — seis camadas que mudam em velocidades diferentes: **fashion, commerce, infrastructure, governance, culture, nature** — com a frase *"Fast learns, slow remembers. Fast proposes, slow disposes."* **[VERIFICADO]**
- **Interpretação.** Sistemas que duram **separam** o que muda rápido do que muda devagar, e deixam o lento **restringir** o rápido. Se o evento do mês pode mexer na regra de sucessão, o sistema não dura uma década — que dirá um milênio.
- **Regra de jogo.** O que é camada lenta **só muda por emenda**: numerada, datada, anunciada com antecedência, reversível. O que é camada rápida pode mudar toda semana e **nunca** pode reescrever a camada lenta.
- **Mecânica concreta.** Arquitetura em três velocidades, declarada publicamente:

| Camada | Muda em | Contém | Como muda |
|---|---|---|---|
| **Lenta (Bedrock)** | décadas | a curva de XP e o teto 1e11; as regras de Handover; o formato da Chronicle; a proibição de venda | só por **Amendment** (Princípio 4), com aviso prévio e caminho de reversão |
| **Média (Works)** | anos | episódios, ghosts, itens, badges, batalha ghost-vs-ghost | patch normal, com nota na Chronicle se afetar a régua |
| **Rápida (Weather)** | semanas | eventos, cosméticos, ranking sazonal, chat | livre — e **proibida** de tocar em XP do Legacy Ghost |

- **Cuidado ético.** Long Now também é uma marca do Vale do Silício, com estética própria (inclusive escrever anos com cinco dígitos: "01996"). **Use as ideias, não a estética nem o nome.**

---

#### Princípio 7 — Continuidade por renovação periódica (Ise Jingu / shikinen sengu)

- **Fato.** No santuário de Ise, no Japão, edificações são **reconstruídas em terreno adjacente a cada 20 anos**, num ritual chamado **shikinen sengu**. A 62ª reconstrução ocorreu em **2013**; a 63ª está marcada para **2033**; o ciclo de 20 anos é tradicionalmente atribuído ao imperador Tenmu (reinado 673–686) e a tradição é descrita como tendo ~1.300 anos **[VERIFICADO]**.
- **Interpretação.** **[CONTESTADO quanto ao "porquê"]** A leitura mais repetida — que o intervalo de 20 anos existe para transmitir a técnica dos carpinteiros de uma geração à seguinte — é **interpretação** difundida em fontes de turismo e patrimônio, não intenção original comprovada. O que é observável e suficiente para o seu design: **renovar periodicamente mantém a coisa viva; a identidade fica na forma e na prática, não na madeira original**.
- **Regra de jogo.** Nenhum legado atravessa décadas sem manutenção. A **Renewal** é obrigatória em dois momentos: a cada Handover e a cada N anos de custódia contínua (sugiro **20 anos** — mesma ordem de grandeza, e é honesto dizer de onde veio a ideia).
- **Mecânica concreta.** O **Renewal** é, ao mesmo tempo, cerimônia e checklist técnico. Na tela é um ritual curto e bonito. Por baixo é: reemissão de credenciais, verificação de integridade da Chronicle, exportação de uma cópia arquivável para o Keeper, e checagem de migração de formato. **Isso resolve um problema real pelo caminho do ritual** — o jogador acha que está limpando o santuário do ghost; na verdade acabou de rodar seu próprio backup e rotação de senha. (Detalhes técnicos → `deep-time-archivist`.)
- **Cuidado ético.** Ise Jingu é um **santuário xintoísta vivo e em atividade**. **Jamais** use o nome, os ritos, a arquitetura ou a iconografia como skin/tema do jogo. Descreva a *estrutura* ("renewal keeps a thing alive") e credite a inspiração numa página de fontes fora do jogo. Isso entra na Decisão **D5**.

---

#### Princípio 8 — Identidade é continuidade de forma e de história, não de matéria (Navio de Teseu)

- **Fato.** O paradoxo aparece pela primeira vez por escrito em Plutarco, *Vida de Teseu*: os atenienses conservavam o navio trocando as tábuas podres, até não restar peça original — e os filósofos discutiam se ainda era o mesmo navio **[VERIFICADO]**. Hobbes depois complicou o caso (e se remontarem o navio com as tábuas velhas?) **[VERIFICADO]**.
- **Interpretação.** A identidade de uma coisa que dura pode repousar na **continuidade da forma e do relato**, não na permanência das partes. É exatamente o problema que você vai ter: banco migrado (SQLite → Postgres/Supabase já aconteceu em 19/08/2026), curvas recalibradas, plataforma trocada, servidor mudado de máquina.
- **Regra de jogo.** O jogo **dá uma resposta explícita** a essa pergunta, em vez de deixar no ar. Uma linha continua sendo **o mesmo legado** se, e somente se, as três coisas abaixo forem preservadas:
  1. **A linhagem do ghost e o progresso são contínuos** (nunca zerados, nunca copiados para outro objeto);
  2. **A Chronicle é ininterrupta** (nenhuma entrada apagada, nenhum buraco);
  3. **Toda troca de custódia foi registrada.**
- **Mecânica concreta.** Esses três itens viram um **invariante testável** — um teste automatizado que roda antes de qualquer migração e depois dela ("continuity check"). Se a migração preservar os três, ela é legítima, mesmo que troque banco, servidor, linguagem ou fórmula. **E isso resolve o item 9 do brief**: as ~48 contas e ~139 personagens de hoje podem ser migradas como **Era Zero** sem quebrar a identidade — desde que ganhem uma primeira entrada de Chronicle datando de onde vieram, em vez de fingirem que sempre foram legado.
- **Cuidado ético.** Nenhum especial. Só não apresente como "prova" de nada: é um problema em aberto há 2.000 anos; o que o jogo faz é **escolher uma resposta e assumi-la**.

---

#### Princípio 9 — Obra de catedral e sucessão adotiva (catedrais / Sagrada Família / shinise)

- **Fato (a).** A Sagrada Família começou a ser construída em **1882**; Gaudí morreu em **1926** com menos de um quarto da obra pronta; em **20 de fevereiro de 2026** foi instalado o braço superior da cruz da Torre de Jesus Cristo, concluindo as obras externas da torre central e tornando-a a igreja mais alta do mundo, no centenário da morte de Gaudí **[VERIFICADO — notícias de 2026 conferidas hoje]**. São **144 anos** e a obra ainda não está inteira.
- **Fato (b).** A Kongō Gumi, construtora japonesa de templos, é **tradicionalmente datada de 578 d.C.** (as fontes dizem "purportedly" — atribuída, não documentada com certeza) e foi família por mais de 1.400 anos, até tornar-se **subsidiária do Takamatsu Construction Group em janeiro de 2006** **[VERIFICADO]**. Empresas seculares japonesas desse tipo são chamadas **shinise**; a leitura de que são guiadas por uma filosofia de continuidade acima do lucro de curto prazo é comum na literatura de negócios **[CONTESTADO — é leitura, não dado]**.
- **Interpretação.** Duas lições opostas e ambas necessárias. Da catedral: **inacabado não é fracassado**; gente trabalha bem em obras que não verá prontas, desde que **cada geração tenha uma parte sua para apontar**. Da Kongō Gumi: **sucessão adotiva funciona** (as casas japonesas longevas adotavam sucessores quando não havia filho apto) **[HIPÓTESE — verifique com `deep-time-archivist` antes de afirmar o mecanismo]** — e, sobretudo, **1.400 anos não garantem o 1.401º**. A empresa mais velha do mundo acabou absorvida.
- **Regra de jogo.** (i) Cada Keeper tem que **terminar alguma coisa** — a régua não pode ser só "avancei 0,003% do caminho". (ii) O herdeiro **não precisa ser sangue**: pode ser amigo, alguém da comunidade, ou um estranho voluntário.
- **Mecânica concreta.** **Eras**: o caminho até 1e11 é dividido em marcos nomeados (partes da construção), e a Chronicle registra **qual Era cada Keeper ergueu** — assim o filho não lê "meu pai jogou 40 anos", lê "meu pai ergueu a Terceira Era". E **Adoptive Heir**: além do herdeiro nomeado, existe a opção de deixar a linha para o **Commons** (um quadro de linhas órfãs que qualquer jogador pode pedir para assumir). O nome do "zerar" vem daqui: **the Keystone**, a pedra final que quem começou jamais colocaria (§B.3).
- **Cuidado ético.** A Sagrada Família é um templo em uso. Use a **estrutura** (trabalho multigeracional), não a iconografia religiosa. Sobre os shinise: evite o estereótipo nacional ("japonês é paciente") — é fenômeno de história empresarial, não traço de povo. E **não esconda o final da Kongō Gumi**: essa é a parte honesta da história, e ela protege o seu jogo de prometer eternidade.

---

#### Princípio 10 — O dia basta por si (Camus) — e o veneno do streak

- **Fato (a).** *Le Mythe de Sisyphe* (**1942**) termina com *"Il faut imaginer Sisyphe heureux"* — "é preciso imaginar Sísifo feliz" —, precedido de "a própria luta em direção ao alto basta para encher um coração de homem" **[VERIFICADO]**.
- **Fato (b).** Mecânicas de **streak** (sequência diária) são amplamente analisadas como **dark pattern**: apoiam-se em aversão à perda, deslizam de motivação para obrigação, e usam culpa explícita (o caso mais citado é o das notificações do Duolingo, com o mascote "triste") **[VERIFICADO — literatura de UX e gamificação conferida hoje; é análise consolidada, não experimento único]**.
- **Interpretação.** O legado **não pode ser o motivo de jogar hoje**. Se a hora de hoje só vale pela promessa de 3147, o jogador está pagando com a vida dele uma dívida que nunca vence. A hora de hoje tem que valer hoje — e o legado é o **excedente**, não o preço.
- **Regra de jogo.** **O jogo conta horas, não julga dias.** Nada no sistema pune um dia perdido, nem visual, nem numericamente, nem por notificação.
- **Mecânica concreta.** Quatro travas concretas: **(1) sem streak counter visível e sem perda por falta**; **(2) nenhuma notificação de culpa** — o jogo pode avisar de evento, nunca cobrar presença ("we missed you" está proibido); **(3) a sessão tem fecho próprio** — todo dia entrega algo pequeno e completo (um trecho de lore, um item, uma linha da Chronicle), independente da escada de níveis; **(4) a régua é descritiva, não prescritiva**: a frase pública é *"if a Keeper plays about an hour a day..."*, **nunca** *"you must play an hour a day"*.
- **Cuidado ético — o mais grave do documento.** Este conceito é, por construção, **o dark pattern mais potente que um jogo pode ter**: culpa familiar + aversão à perda + horizonte infinito. A diferença entre "jogo legado" e "chantagem hereditária" é inteiramente de execução. Toda mecânica diária deste plano deveria passar por revisão de ética antes de entrar (`digital-succession-counsel` + `game-economy-designer`).

---

### B.3 — Vocabulário do jogo (inglês) com tradução para o dono

O jogo é 100% em inglês, então **os termos oficiais são em inglês** e eu dou a tradução PT-BR para você conversar sobre eles. Cada linha traz 2–3 candidatos, a **recomendação**, o porquê e a **armadilha de conotação** que eu verifiquei.

> Observação de fora do escopo, mas relevante: o roster do projeto (`CLAUDE.md` §8) registra que a tela inicial **hoje mistura PT e EN** (`RESGATAR PROGRESSO` ao lado de `PRESS SPACE TO START`). Se o vocabulário do legado entrar em inglês, isso precisa ser resolvido junto → `localization`.

| Papel / coisa | Candidatos | **Recomendação** | PT-BR (para você) | Por que, e a armadilha verificada |
|---|---|---|---|---|
| **Quem detém a conta agora** | Keeper · Steward · Warden · Custodian · Bearer | **Keeper** | Guardião | `Custodian` em inglês americano é lido antes de tudo como **zelador/faxineiro de escola** **[VERIFICADO]** — descarte. `Warden` puxa **carcereiro**. `Steward` tem carga religiosa e de comissário de bordo. **Keeper** é curto, existe em "keeper of the flame", combina com jogo, e a frase de custódia fica natural: *"You hold this line."* |
| **Quem recebe** | Heir · Successor · Named Heir | **Heir** (nomeado) + **Successor** (genérico/estranho) | Herdeiro / Sucessor | `Heir` é o termo que seu próprio pedido descreve (pai → filho), mas carrega **sangue e morte**. Por isso o par: quem é indicado é *Heir*; quem assume vindo do Commons é *Successor*. Assim ninguém precisa ser "herdeiro" de um estranho. |
| **O registro** | the Chronicle · the Ledger · the Roll · the Book of Keepers | **the Chronicle** | a Crônica / Livro do Legado | `Ledger` puxa contabilidade e cripto — e você não quer que o legado pareça carteira. `Chronicle` diz "relato ao longo do tempo", que é exatamente o que é. Cada registro individual: **an Entry** (uma entrada). |
| **O ghost do legado** | the Legacy Ghost · the Heirloom Ghost · the Lineage Ghost | **the Legacy Ghost** | o ghost do legado | Simples e literal — e literal é o que dura 1.100 anos. `Heirloom` já tem significado técnico em MMOs (item vinculado à conta) e confundiria. Mantém compatível com Ghost #001 Polterstalk como ponto de partida de todo mundo. |
| **A passagem de bastão (o ato)** | the Handover · the Passing · the Succession | **the Handover** | a Passagem | **Atenção:** `the Passing` em inglês é **eufemismo de falecimento** ("his passing") **[VERIFICADO]** — usar isso para o ato de entregar a conta em vida seria macabro e confuso. `Handover` é neutro, claro e funciona em UI. |
| **A cerimônia de aceitar** | the Investiture · the Taking · the Oath | **the Investiture** | a Investidura | É o momento solene do lado de quem recebe. Evite `Oath` (juramento): juramento cria **obrigação**, e o Princípio 3 proíbe. |
| **Aceitar / recusar** | Accept the Charge / Decline the Charge · Claim / Decline | **Accept the Charge / Decline the Charge** | aceitar / recusar o encargo | `Charge` no sentido de "algo confiado aos seus cuidados" é exato e nobre sem ser pesado. Os dois botões com **o mesmo peso visual** (Princípio 3). |
| **A carta para o herdeiro futuro** | the Sealed Letter · the Testament · the Last Word | **the Sealed Letter** | a Carta Selada | **Evite `Testament`/`Will`**: soa como testamento jurídico e pode gerar confusão legal real → `digital-succession-counsel`. |
| **O ritual periódico** | the Renewal · the Rebuilding · the Vigil | **the Renewal** | a Renovação | Princípio 7. `Rebuilding` remete direto a Ise e seria apropriação do nome; `Renewal` descreve a estrutura sem vestir a fantasia. |
| **Conta parada** | Dormant / Dormancy · Abandoned · Lapsed | **Dormant** | Dormente | **Nunca `Abandoned`** — culpa quem parou e quem morreu. `Dormant` diz "pode acordar", que é a verdade do sistema. |
| **Encerrar a linha por escolha** | Retire the Line · End the Line · Close the Book | **Retire the Line** | aposentar a linha | `Retire` é digno e voluntário. `End` soa a falha. |
| **A linhagem inteira** | the Line · the House · the Lineage | **the Line** (e **House <Nome>** opcional, para ranking) | a Linha / a Casa | `Line` é curto e cabe em UI. `House` é ótimo para ranking por geração, mas puxa Crusader Kings — use só como rótulo social opcional. |
| **Marcos de progresso** | Era · Chapter · Age | **Era** | Era | Já é a palavra do brief, funciona igual nos dois idiomas, e é a unidade que o jogador **sente** (resposta direta ao insight §8 do brief: o nível vira contador; a Era é o que é vivido). |
| **Zerar o jogo (chegar a 1e11)** | the Keystone · the Crowning · the Completion · Ascension | **the Keystone** | a Pedra Angular / "zerar" | Vem do Princípio 9: a última pedra, que só existe porque todos os anteriores ergueram o resto. Honra a cadeia inteira em uma palavra, em vez de coroar só o último. `Ascension` puxa religião; `Completion` é burocrático. |
| **Quem zerou** | the Keystone Bearer · the Finisher | **the Keystone Bearer** | quem colocou a pedra angular | Mantém a metáfora e evita "vencedor" (não foi corrida individual). |
| **Dia de leitura dos nomes** | the Roll Call · Remembrance Day · Founders' Day | **the Roll Call** | a Chamada | **Evite `Remembrance Day`**: é **feriado militar real** em países da Commonwealth, 11 de novembro, com a papoula como símbolo **[VERIFICADO]** — usar o nome seria apropriação de um luto de guerra. `Roll Call` (chamada dos nomes) descreve o ato e não pisa em ninguém. |
| **As contas de hoje (~48)** | Era Zero · the First Keepers · the Founding | **Era Zero** + **the First Keepers** | Era Zero / os Primeiros Guardiões | Resolve o item 9 do brief com dignidade: quem já joga não é "conta legada retroativa", é **fundador**. |
| **Linhas órfãs adotáveis** | the Commons · the Orphan Lines · the Open Hall | **the Commons** | o Comum / as linhas abertas | Neutro, sem estigma, e comunica "pertence a todos até alguém assumir". |

**Regra geral de vocabulário que eu recomendo travar agora:** nenhum termo oficial do jogo pode ser palavra sagrada, nome de rito ou nome de povo de uma tradição viva. Tudo acima é ou palavra comum do inglês (keeper, chronicle, renewal) ou metáfora de construção (keystone). A dívida intelectual com Ise, com os Haudenosaunee e com as tradições de veneração ancestral fica **creditada por escrito numa página de fontes fora do jogo** — que é a forma respeitosa de reconhecer sem vestir (Decisão **D5**).

---

### B.4 — O "porquê continuar jogando" (a fundamentação existencial e psicológica)

A pergunta real é: **por que uma pessoa de 2026 — e depois uns 40 desconhecidos — jogaria 1 h/dia por décadas?** Aviso de honestidade: **não existe estudo sobre motivação em escala de séculos** (procurei; não há). O que existe é psicologia verificada sobre por que gente sustenta prática longa e por que gente se importa com o depois. Uso três estruturas reais e marco tudo que é extrapolação minha.

#### As três pernas (e a quarta, que é a trava)

**Perna 1 — O dia tem que valer por si (Camus + competência).**
**[VERIFICADO]** Camus, 1942: o sentido está no ato, não no cume. **[VERIFICADO]** A Teoria da Autodeterminação (Deci & Ryan, desde 1985) identifica três necessidades inatas cuja satisfação prevê motivação intrínseca e bem-estar: **autonomia, competência e pertencimento (relatedness)**. **[HIPÓTESE, minha]** Logo: a sessão de hoje precisa entregar **competência sentida hoje** (fiz algo, melhorei algo, terminei algo), e o legado é o que sobra por cima. Um jogo cujo prazer está todo no futuro não é legado — é dívida.

**Perna 2 — Contribuir para algo que te sobrevive (Erikson).**
**[VERIFICADO]** Erik Erikson chamou de **generatividade × estagnação** o sétimo estágio do desenvolvimento psicossocial (mais ou menos dos 40 aos 65 anos): o impulso de criar ou cuidar de coisas que vão **durar além de você** — filhos, discípulos, obras — cuja virtude associada é o **cuidado (care)**, definido como investir em pessoas, ideias e instituições sem esperar retorno imediato. **[HIPÓTESE, minha]** O jogo legado é uma **máquina de generatividade barata**: oferece a um adulto comum uma obra multigeracional por 1 h/dia. Isso é um apelo genuíno, e é provavelmente o motivo mais forte de um adulto de 45 anos continuar. Mas repare: generatividade é dos 40+. **A criança de 12 anos que herda não está nesse estágio.** Ela precisa da Perna 1 (o jogo tem que ser divertido hoje) e da Perna 3.

**Perna 3 — Pertencer a uma linha que continua (Scheffler).**
**[VERIFICADO]** Samuel Scheffler, *Death and the Afterlife* (2013, baseado nas Tanner Lectures de 2012), argumenta com dois experimentos mentais — o **cenário do juízo final** (a Terra é destruída 30 anos depois da sua morte) e o **cenário da infertilidade** — que a certeza tácita de que **a humanidade continua depois de nós** ("afterlife coletivo") sustenta boa parte do valor que damos às nossas atividades; sem ela, o valorar se erode. **[HIPÓTESE, minha, mas direta]** Traduzindo pro seu jogo: **o jogador não joga pelo nível 1e11; joga porque acredita que a linha continua**. Isso tem uma consequência de design brutal e contraintuitiva: **a saúde percebida da comunidade importa mais para a motivação individual do que a recompensa individual**. Uma Chronicle viva, com outras linhas avançando e Handovers acontecendo, é mais motivadora do que qualquer buff.

**A quarta perna, que é a trava — autonomia.**
**[VERIFICADO]** Das três necessidades de Deci & Ryan, **autonomia** é exatamente a que é destruída por controle e obrigação — e pagar/pressionar alguém por algo que ele já gostava **reduz** o interesse quando a pressão sai. **[HIPÓTESE, minha]** O conceito de legado, por natureza, ataca a autonomia (é uma herança, é um dever, é o pai olhando). **A sua própria frase — "se assim quiser" — é a proteção psicológica do conceito inteiro, e deveria ser a primeira linha do texto público do legado, não uma nota de rodapé.**

#### Os 6 modos de falha filosóficos (com mitigação)

| # | Falha | O que acontece na prática | Mitigação de design |
|---|---|---|---|
| **F1** | **O fardo herdado** | O herdeiro joga por culpa, não por vontade. Acorda pensando "preciso manter a linha do meu pai". Isso é a "mão morta" de Paine acontecendo de verdade **[VERIFICADO que é o argumento dele]**. | Princípio 3 inteiro: recusa fácil e sem penalidade, proibição de condições herdáveis, zero linguagem de culpa. **A recusa precisa ser desenhada para ser confortável, não só permitida.** |
| **F2** | **O streak vira chantagem** | O ritual diário, que era o remédio (Camus), vira a doença: aversão à perda + culpa **[VERIFICADO como padrão de dark pattern]**. Pior aqui do que em qualquer app, porque a "perda" é familiar. | Princípio 10: sem streak, sem punição por falta, sem notificação de cobrança, régua descritiva ("if a Keeper plays...") e nunca prescritiva. |
| **F3** | **O último Guardião niilista** | Um Keeper percebe que não terá herdeiro. Pela lógica de Scheffler **[VERIFICADO]**, se a linha acaba comigo, o valor do que faço hoje se erode — e ele para, não por tédio, mas por vazio. | Três coisas: **(1)** a Chronicle é **exportável** e sobrevive ao jogo (o trabalho não some); **(2)** a opção **Commons** (a linha pode continuar com um estranho — restaura o "afterlife coletivo"); **(3)** as **Eras** dão fecho *dentro* de uma vida: ninguém precisa do 1e11 para ter terminado alguma coisa. |
| **F4** | **A conta abandonada / o cemitério digital** | Dezenas de linhas paradas, virando um mural de fracassos que desanima quem chega. | **Dormant**, nunca "abandoned". Linhas dormentes entram no **Commons** (se autorizado em vida) e o mural mostra **linhas retomadas**, não só interrompidas. Uma linha aposentada com honra é um final, não um cadáver. |
| **F5** | **O legado vira sunk cost** | "Já são 30 anos, não posso parar agora." A pessoa continua por custo afundado, não por prazer — e ensina o mesmo aos filhos. | **Retire the Line** disponível e com texto honroso. E uma regra editorial: o jogo **nunca** exibe "horas investidas" como argumento para continuar. Horas são registro, não cobrança. |
| **F6** | **A criança herdando** | O consentimento de um menor não é consentimento pleno — e C4 exige consentimento real. Sem cuidado, o jogo institucionaliza pressão parental sobre criança. | Proposta: se o herdeiro for menor, a linha **fica Dormant até ele poder aceitar por conta própria** (ou até um responsável aceitar formalmente), e **nunca** é atribuída automaticamente. Idade e forma → **obrigatoriamente** `digital-succession-counsel` (ECA Digital, LGPD). |

---

### B.5 — Mapa: estrutura filosófica → princípio → mecânica → quem implementa

| Estrutura (verificada) | Princípio | Mecânica concreta | Quem leva adiante |
|---|---|---|---|
| Usufruto romano; Jefferson 1789 | 1. Custódia | `owner_of_record` ≠ `keeper_of_line`; proibição de venda | `legacy-systems-designer`, `backend-architect` (só no plano), `digital-succession-counsel` |
| Burke 1790; zupu/jiapu | 2. Três tempos | Chronicle em 3 painéis + Sealed Letter | `legacy-systems-designer`, `narrative-designer` |
| Jefferson 1789; Paine 1791; rule against perpetuities | 3. Direito dos vivos | Decline the Charge; sem condições herdáveis; Retire the Line | `legacy-systems-designer`, `ui-ux-designer`, `digital-succession-counsel` |
| Jonas 1979/1984 | 4. Precaução | Amendment Log + plano de reversão obrigatório | `deep-time-archivist`, `qa-lead`, `game-director` |
| Parfit 1984; horizonte de sete | 5. Dever ao cargo | `heir_slot` nulo bem definido; teste "e o 7º Keeper?" | `legacy-systems-designer`, `progression-actuary` |
| Brand 1999 (pace layers) | 6. Camadas de ritmo | Bedrock / Works / Weather; eventos não tocam XP do Legacy Ghost | `game-director`, `live-ops`, `game-economy-designer` |
| Ise Jingu (shikinen sengu) | 7. Renovação | Renewal = cerimônia + rotação de credenciais + export + integrity check | `deep-time-archivist`, `security-engineer` |
| Plutarco (Teseu) | 8. Identidade | Invariante de continuidade (3 itens) testado antes/depois de migração | `deep-time-archivist`, `qa-lead`, `forensic-analyst` |
| Sagrada Família; Kongō Gumi/shinise | 9. Catedral + adoção | Eras nomeadas; Adoptive Heir; Commons; the Keystone | `game-designer`, `level-designer`, `narrative-designer` |
| Camus 1942; pesquisa sobre streaks | 10. O dia basta | Sem streak; fecho diário; régua descritiva | `game-designer`, `game-economy-designer`, `ui-ux-designer` |

---

## (c) Lacunas que eu fechei

1. **Item 1 do checklist do brief, por inteiro**: definição formal de "jogo legado" (com gênero próximo, diferença específica, 5 condições necessárias e argumento de suficiência), princípios filosóficos verificados e vocabulário do jogo com recomendação.
2. **A fronteira conceitual**: sete conceitos vizinhos mapeados, com **qual condição cada um quebra** — agora dá para responder "isso é um idle game?" sem hesitar.
3. **Sete casos-limite respondidos pela definição** (inclusive o do jogador de 16 h/dia e o do bot herdeiro), com encaminhamento nominal.
4. **A descoberta de que C2 é um requisito matemático**, não retórico — isso muda a natureza do trabalho do `progression-actuary`: o teto de rendimento diário deixa de ser "opção de balanceamento" e passa a ser condição de existência do conceito.
5. **Parte do item 6** (motivação por ~409.000 horas): as três pernas psicológicas verificadas e os seis modos de falha filosóficos com mitigação concreta.
6. **Parte do item 4** (sucessão): o **princípio** do consentimento nas duas pontas e do direito de recusar, que é a restrição que a mecânica de sucessão tem que obedecer.
7. **Parte do item 9** (migração das ~48 contas): o invariante de identidade de três itens (Princípio 8) e o enquadramento **Era Zero / the First Keepers**, que dá uma resposta digna a quem já joga.
8. **Armadilhas de tradução verificadas** (`Custodian`, `the Passing`, `Remembrance Day`) — três erros de naming que teriam sido caros de desfazer depois.
9. **A checagem de apropriação cultural** de todas as fontes usadas, com a decisão correspondente (D5) já formulada em vez de deixada no ar.

---

## (d) Lacunas que dependem de outros departamentos

| Lacuna | Por que não é minha | Quem resolve |
|---|---|---|
| **Qual curva/teto diário faz C2 valer** — o número que impede um jogador de 16 h/dia de zerar em vida | É matemática de calibração, não filosofia | **`progression-actuary`** (urgente: sem isso a definição não fecha) |
| Qual é a unidade de progresso que o jogador **sente** (Eras) e como ela se liga ao nível-contador | Insight §8 do brief; é desenho de progressão | **`progression-actuary`** + **`game-designer`** |
| Máquina de estados de sucessão, UX do Handover, dormência, disputa, múltiplos herdeiros, ranking por geração | Mecânica e UX, não princípio | **`legacy-systems-designer`** |
| Como a Chronicle sobrevive ao fim do servidor; formatos; custódia múltipla; sucessão do **operador** (dev solo) | Preservação técnica | **`deep-time-archivist`** |
| Menor herdando (ECA Digital), LGPD × Chronicle imutável, Termos de Uso, proibição de RMT, natureza jurídica da Sealed Letter | Direito — e **nada aqui substitui advogado** | **`digital-succession-counsel`** |
| Integridade do tempo jogado (bot, AFK, multi-aba, relógio) que sustenta C3 na prática | Anti-abuso | **`legacy-systems-designer`** + **`security-engineer`** |
| Texto final em inglês, nomes das Eras, tom da Chronicle | Escrita de produto | **`narrative-designer`** + **`localization`** (a tela inicial já mistura PT/EN hoje) |
| Decidir o escopo final e o que entra no MVP | Direção | **`game-director`** / **`producer`** |
| Revisão de ética de qualquer mecânica diária antes de implementar | Não posso ser eu o revisor das minhas próprias propostas | **`game-economy-designer`** + **`digital-succession-counsel`** |

---

## (e) DECISÕES PARA O DONO

Nenhuma fica "a definir". Cada uma tem opções, prós/contras e minha recomendação.

**D1 — Como se chama quem detém a conta?**
(a) **Keeper** · (b) Steward · (c) Warden/Custodian.
Prós/contras: `Custodian` = zelador no inglês americano **[VERIFICADO]**; `Warden` = carcereiro; `Steward` tem carga religiosa.
➜ **Recomendo (a) Keeper** (PT: Guardião). Curto, neutro, cabe na UI e a frase "You hold this line" sai natural.

**D2 — A Chronicle é permanente?**
(a) Totalmente imutável · (b) **Append-only (só acrescenta) + direito de resposta + canal de remoção via operador para casos legais** · (c) Editável pelo Keeper atual.
Prós/contras: (a) é linda e **ilegal** — colide com direito ao esquecimento (LGPD); (c) destrói C5 e a identidade do legado (Princípio 8).
➜ **Recomendo (b)**. Ninguém apaga o passado de ninguém; quem discorda **acrescenta** sua versão; e existe um procedimento de exceção, operado por você, para pedido legal legítimo. **Validar com `digital-succession-counsel`.**

**D3 — O herdeiro pode reescrever/renomear o legado?**
(a) Nada · (b) **Pode renomear o Legacy Ghost e a House, e escrever livremente a própria entrada — não pode alterar as entradas anteriores** · (c) Pode tudo.
➜ **Recomendo (b)**. É exatamente o equilíbrio Burke × Paine: o vivo tem liberdade sobre o presente (senão vira mão morta), o morto tem direito ao seu próprio relato.

**D4 — Teto de rendimento diário (a decisão que define se o conceito existe)**
(a) Sem teto · (b) **Rendimento decrescente após ~1 h/dia, com teto duro** · (c) Teto rígido de 1 h contável por dia.
Prós/contras: (a) **quebra C2** — quem joga 16 h/dia zera dentro de uma vida e o jogo deixa de ser legado, por definição. (c) é honesto mas pune quem quer jogar mais num sábado, e frustra sem necessidade.
➜ **Recomendo (b)**: jogar mais **sempre rende mais**, só que cada vez menos, de forma que nem o extremo de 16 h/dia chegue perto do fim em uma vida. **O formato exato da curva é do `progression-actuary`** — eu forneço apenas a restrição: *nenhum perfil humano plausível pode zerar sozinho*.

**D5 — Nomear explicitamente as tradições vivas (Ise Jingu, sétima geração/Haudenosaunee, veneração ancestral)?**
(a) Nomear e creditar dentro do jogo · (b) **Usar a estrutura, com nomes próprios neutros no jogo, e creditar as fontes numa página pública fora do jogo** · (c) Não mencionar nada.
Prós/contras: (a) é o caminho mais curto para apropriação, ainda que bem-intencionada (e a fórmula "sétima geração" é **[CONTESTADO]** quanto à atestação literal antiga). (c) é ingrato: você usou as ideias.
➜ **Recomendo (b)**. Todo o vocabulário de §B.3 já foi construído para isso — nenhum termo do jogo é palavra sagrada de ninguém.

**D6 — O jogo pode acabar antes de 3147. O que fazer?**
(a) Não falar sobre isso · (b) **Escrever AGORA um protocolo de encerramento ("Last Rites"), publicado desde o dia 1** · (c) Prometer que não vai acabar.
Prós/contras: (c) é mentira e destrói a confiança que o conceito inteiro exige. (a) é a mentira por omissão.
➜ **Recomendo (b)**: se o jogo for encerrar, todo Keeper recebe a **exportação completa e legível** da sua Chronicle e do estado final, o estado é publicado e congelado, e a Chronicle continua legível **sem o servidor**. Dizer isso desde o começo é o que torna o resto crível. Conteúdo técnico → `deep-time-archivist`.

**D7 — Um bot/IA pode ser Keeper?**
(a) Sim · (b) **Não: o Keeper de registro é sempre uma pessoa; IA pode auxiliar e tem que aparecer marcada como IA** · (c) Categoria separada de ranking para IA.
➜ **Recomendo (b)**. Bot não consente (viola C4) e não é pessoa (viola C3). E isso mantém coerência com a regra inegociável que o workspace já aplica ao `Agent G [IA]`: IA jogando no mundo multiplayer aparece **marcada**, nunca disfarçada de jogador comum.

**D8 — Recusar a herança tem alguma penalidade ou marca?**
(a) Nenhuma, e o registro é neutro ("declined") · (b) Registra como interrupção da linha · (c) Nem registra.
➜ **Recomendo (a)**. É o Princípio 3 aplicado. "Declined" é um estado legítimo; "broke the line" é chantagem.

**D9 — O que acontece quando alguém coloca a Keystone (zera)?**
(a) O jogo acaba para todos · (b) **A linha se aposenta com honra e entra num Hall permanente; o mundo e as outras linhas continuam** · (c) New Game+.
Prós/contras: (a) transformaria o jogo numa corrida entre linhas — e destruiria o Princípio 3 (todo mundo passaria a cobrar os herdeiros). (c) esvazia o significado do fim.
➜ **Recomendo (b)**. O fim é da **linha**, não do jogo. Isso também protege o jogo do "vencedor único" e mantém o Keystone como honraria de uma cadeia de ~40 pessoas, não troféu de um.

**D10 — Uma conta pode ter vários legados?**
(a) Sim, vários Legacy Ghosts · (b) **Uma conta = uma linha = um Legacy Ghost de registro; os outros ghosts são jogo livre e não contam para a régua** · (c) Só é permitido ter um ghost.
➜ **Recomendo (b)**. É o que sua régua já diz ("o mesmo ghost"), preserva C1 (progresso único) e **não tira** a liberdade de brincar com os outros 100 ghosts do Ghostdex.

**D11 — Herdeiro menor de idade**
(a) Herda normalmente · (b) **A linha fica Dormant até ele poder aceitar por si (ou até um responsável aceitar formalmente), e nunca é atribuída automaticamente** · (c) Proibir menores.
➜ **Recomendo (b)**, **condicionado à validação de `digital-succession-counsel`** (ECA Digital, LGPD, idade mínima). (c) é irreal — seu exemplo original é literalmente "deixo pro meu filho".

---

## (f) Riscos e o que eu NÃO consegui verificar

**Riscos do conceito (honestos):**
1. **Não há precedente.** Procurei e não encontrei nenhum jogo em que **uma única conta** tenha sido projetada para atravessar séculos. Os MMOs mais antigos em atividade têm ~30 anos **[VERIFICADO]**. Tudo aqui é extrapolação de estruturas **de fora dos games**.
2. **Este é o conceito de jogo com maior potencial de dark pattern que eu já analisei.** Culpa familiar + aversão à perda + horizonte infinito. A diferença entre "legado" e "chantagem hereditária" é inteiramente de execução — daí o Princípio 3 e o Princípio 10 serem inegociáveis.
3. **O conceito depende de um número que ainda não existe** (D4). Se o `progression-actuary` concluir que não há curva razoável que impeça o jogador extremo de zerar em vida, **C2 cai** e o conceito precisa ser reformulado (por exemplo, com limite de rendimento por tempo de calendário, não por horas).
4. **Sobrevivência do operador é o ponto único de falha real**, não a tecnologia. Kongō Gumi durou 1.400 anos e mesmo assim foi absorvida em 2006 **[VERIFICADO]**. Um dev solo é infinitamente mais frágil → `deep-time-archivist`.

**O que eu NÃO verifiquei (e você não deve citar como se eu tivesse):**
1. **Página e edição exatas** das citações de Burke, Jonas, Parfit e Camus. Verifiquei que a citação existe, é daquela obra e daquele ano — não conferi a paginação de uma edição específica. Antes de publicar qualquer texto com aspas, cite a edição usada.
2. **A frase da "sétima geração"** como regra antiga literal: **[CONTESTADO]**, e a datação da Grande Lei da Paz também é discutida.
3. **O "porquê" do ciclo de 20 anos de Ise**: a explicação da transmissão de ofício é **interpretação** difundida, não intenção documentada.
4. **A fundação da Kongō Gumi em 578 d.C.**: as fontes dizem "purportedly/tradicionalmente" — é data de tradição, não de documento.
5. **O mecanismo de sucessão adotiva nas casas japonesas longevas**: usei como **[HIPÓTESE]**; não achei fonte primária hoje. Não afirme sem checar.
6. **Conotação do vocabulário por falante nativo**: verifiquei as três armadilhas que eu conhecia (`Custodian`, `the Passing`, `Remembrance Day`). **Recomendo que um falante nativo de inglês revise a lista inteira antes de travar os termos** — nome errado em camada lenta (Princípio 6) é caro de desfazer.
7. **Motivação humana em escala de séculos**: não existe evidência. Erikson, Deci & Ryan e Scheffler são verificados, mas **aplicá-los a 1.121 anos é extrapolação minha [HIPÓTESE]**.
8. **Nada aqui é aconselhamento jurídico.** Custódia, herança, menores, direito ao esquecimento: `digital-succession-counsel` primeiro, advogado habilitado depois.

---

## Anexo A — Fontes verificadas (todas conferidas por busca em 2026-09-20)

| Tema | Fonte / onde conferi |
|---|---|
| Burke, parceria entre vivos, mortos e por nascer (1790) | en.wikiquote.org/wiki/Reflections_on_the_Revolution_in_France; socialsci.libretexts.org (excertos, 1790) |
| Jefferson, "the earth belongs in usufruct to the living" (06/09/1789) e a resposta de Madison (04/02/1790) | founders.archives.gov/documents/Jefferson/01-15-02-0375-0001; tjrs.monticello.org/letter/122; founders.archives.gov/documents/Madison/01-13-02-0019 |
| Paine, *Rights of Man* (1791), "governing beyond the grave" | en.wikiquote.org/wiki/Rights_of_Man; let.rug.nl/usa/documents/1786-1800/thomas-paine-the-rights-of-man/text.php |
| Rule against perpetuities / mortmain / dead hand | en.wikipedia.org/wiki/Rule_against_perpetuities; en.wikipedia.org/wiki/Mortmain; law.cornell.edu/wex/mortmain |
| Jonas, *Das Prinzip Verantwortung* (1979) / *The Imperative of Responsibility* (1984); princípio da precaução | en.wikipedia.org/wiki/Precautionary_principle; lbi.org (Leo Baeck Institute) |
| Sétima geração / Haudenosaunee (**contestado**) | en.wikipedia.org/wiki/Seven_generation_sustainability; ictinc.ca/blog/seventh-generation-principle; longhouse.institute (Great Law of Peace) |
| Parfit, *Reasons and Persons* (1984), não-identidade, cap. 16 | en.wikipedia.org/wiki/Reasons_and_Persons; en.wikipedia.org/wiki/Non-identity_problem; academic.oup.com/book/12484/chapter/163168796 |
| Long Now (1996), *The Clock of the Long Now* (1999), pace layers, "fast learns, slow remembers" | longnow.org/ideas/about/pace-layers-framework/; longnow.org/ideas/pace-layers/; en.wikipedia.org/wiki/Pace_layers |
| Ise Jingu / shikinen sengu: 20 anos, 62ª em 2013, 63ª em 2033, Tenmu (673–686) | worldhistory.org/Ise_Grand_Shrine/; japanfs.org/en/news/archives/news_id034293.html; smithsonianmag.com; iseshima-kanko.jp |
| Navio de Teseu (Plutarco, *Vida de Teseu*; variação de Hobbes) | britannica.com/topic/ship-of-Theseus-philosophy; ebsco.com research starter |
| Kongō Gumi (578, tradicional) → subsidiária da Takamatsu em jan/2006; shinise | en.wikipedia.org/wiki/Kongō_Gumi; en.wikipedia.org/wiki/Takamatsu_Construction_Group; en.wikipedia.org/wiki/List_of_oldest_companies |
| Sagrada Família: 1882, Gaudí †1926, cruz da Torre de Jesus Cristo em 20/02/2026, igreja mais alta do mundo | vaticannews.va (fev/2026); cnn.com (jun/2026); dezeen.com; euronews.com |
| Camus, *Le Mythe de Sisyphe* (1942), "Il faut imaginer Sisyphe heureux" | en.wikipedia.org/wiki/The_Myth_of_Sisyphus; britannica.com/topic/The-Myth-of-Sisyphus |
| Streaks como dark pattern (aversão à perda, culpa, obrigação) | thedecisionlab.com (streak creep); uxmag.com; screenwiseapp.com |
| Erikson, generatividade × estagnação, virtude do "care" | simplyputpsych.co.uk; psychologynoteshq.com; pmc.ncbi.nlm.nih.gov/articles/PMC5398200/ |
| Deci & Ryan, Teoria da Autodeterminação (1985): autonomia, competência, pertencimento | apa.org/research-practice/conduct-research/self-determination-theory; selfdeterminationtheory.org (Ryan & Deci 2000, PDF) |
| Scheffler, *Death and the Afterlife* (2013), afterlife coletivo, cenário do juízo final | ndpr.nd.edu (resenha); global.oup.com; npr.org (excerto) |
| Zupu / jiapu (livros genealógicos de clã); xiao (piedade filial) | chineseancestor.org/culture/zupu/; familysearch.org/en/chinese/research/jiapu; en.wikipedia.org/wiki/Filial_piety |
| MMOs mais longevos ainda ativos (UO 1997, EVE 2003, RuneScape; recorde Guinness: Nexus, 1996) | guinnessworldrecords.com; en.wikipedia.org/wiki/Persistent_world; comicbook.com |
| Rogue Legacy (2013, Cellar Door Games): herdeiros, traços, progressão persistente | en.wikipedia.org/wiki/Rogue_Legacy |
| "Custodian" = zelador (EUA) | merriam-webster.com/dictionary/custodian; dictionary.com/compare-words/custodian-vs-janitor |
| "Passing" = eufemismo de falecimento | merriam-webster.com/dictionary/passing; collinsdictionary.com; en.wikipedia.org/wiki/Pass_away |
| Remembrance Day (11/11, Commonwealth, papoula) | en.wikipedia.org/wiki/Remembrance_Day; iwm.org.uk |

---

*Fim do relatório. Nenhum arquivo do jogo foi lido além do necessário (`rpg_system.js`, só por busca pontual) e **nenhum foi alterado**. Rascunhos ficaram fora do repositório.*
