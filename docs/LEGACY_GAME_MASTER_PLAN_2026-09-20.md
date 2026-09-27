# Plano Mestre do Jogo Legado — Danger Ghost

**Para:** o dono do jogo (decisão de aprovar ou não)
**De:** `game-director` (Diretor Criativo), com base nos 11 relatórios em `docs/legacy-plan/raw/`
**Data:** 2026-09-20 · **Modo:** PLANO — nenhuma linha do jogo foi alterada, nenhuma migração rodou, nenhuma consulta ao banco de produção foi feita.

---

## Como ler este documento

Ele é feito em camadas. Você pode parar em qualquer uma:

| Se você tem… | Leia |
|---|---|
| 5 minutos | **Seção 0** (resumo para decidir) |
| 15 minutos | Seção 0 + **Seção 13** (o checklist que você responde) |
| 1 hora | 0, 1, 2, 10, 11, 12, 13 |
| tudo | o documento inteiro; as seções 3 a 9 são o detalhe de cada departamento |

**As seções 0 e 13 são autossuficientes.** Se você só ler essas duas, consegue aprovar ou recusar com consciência.

**Etiqueta de confiança em cada número** (regra do brief):

| Etiqueta | Significa |
|---|---|
| **[VERIFICADO]** | Alguém leu no código real deste projeto (com arquivo e linha) ou conferiu em fonte externa datada. |
| **[CÁLCULO]** | Conta refeita em Node, num script descartável fora do repositório. Vários números foram recalculados duas vezes, por agentes diferentes. |
| **[HIPÓTESE]** | Julgamento, estimativa ou proposta. Não é fato. Você pode discordar sem estar errado. |

**Termos técnicos** ganham uma explicação curta na primeira vez que aparecem. Onde o relatório `raw/10` (auditoria adversarial) corrigiu outro relatório, **vale o `10`** — as 23 correções dele foram todas aplicadas aqui.

**Uma regra que vale para o documento inteiro:** nada aqui é aconselhamento jurídico. A Seção 7 lista o que precisa de um advogado de verdade.

---

## 0. Resumo para decidir em 5 minutos

### 0.1 O conceito, em linguagem simples

Um **jogo legado** é um jogo cuja linha de chegada foi colocada de propósito **longe demais para uma pessoa só**, e que só continua avançando se alguém **entregar a conta a outra pessoa, que aceita de livre vontade**. Cada entrega fica registrada, e esse registro vira parte do jogo.

No Danger Ghost isso quer dizer: uma conta, um ghost (o *Legacy Ghost*), um número que sobe devagar, e uma corrente de pessoas — você, depois quem você escolher, depois quem essa pessoa escolher — até que alguém chegue ao nível **100.000.000.000** (1e11) e coloque a última pedra.

A sua frase original — *"se assim quiser"* — virou **a cláusula constitucional do conceito**. Ninguém é obrigado a continuar, ninguém é obrigado a aceitar, e o jogo é proibido de usar culpa para cobrar presença (→ `raw/01` §B.2 Princípio 3).

### 0.2 A régua, e por que o jogo de hoje não a cumpre

**A régua:** 1 hora por dia, com o mesmo ghost, chega ao nível 1e11 no ano de 3147.

- De 20/09/2026 até 31/12/3147 são **409.538 dias ≈ 1.121,28 anos** **[CÁLCULO, conferido duas vezes]**.
- Isso dá, em média, **244.177 níveis por hora de jogo** — 0,0147 segundo por nível **[CÁLCULO]**. Ou seja: o número do nível **não é mais uma "barrinha de XP"; é um odômetro**, como o hodômetro de um carro. A sensação de progresso tem que morar em outro lugar (Seção 3).
- **O jogo de hoje não é rápido demais — ele é imprevisível.** Com a progressão atual, chegar a 1e11 a 1 h/dia leva de **11,1 anos** (farmando bem) a **1.396 anos** (ritmo lento), com **137,9 anos** no caso típico **[CÁLCULO, `raw/02` §1]**. Dois jogadores honestos, jogando a mesma hora por dia, terminam com **séculos** de diferença. Uma promessa calibrada em cima disso nasceria mentindo.
- Pior: hoje **todo o XP e todo o nível são calculados no navegador do jogador**, e o servidor só arquiva o número que chega. O teto de validação do nível é exatamente `1e11`. Na prática, **um jogador já logado zera o jogo de 1.121 anos em um único pacote de rede** **[VERIFICADO: `server/db.js:466-467`, `js/game/engine.js:1104-1105`]**.

### 0.3 As 5 ideias que fazem o conceito funcionar

1. **O nível vem do tempo medido pelo servidor, não do XP do cliente.** `nível = L*(segundos creditados)`. Três relatórios chegaram a isso de forma independente. É a decisão de maior alavancagem do plano inteiro: ela torna o cliente adulterado irrelevante **sem precisar reescrever o combate no servidor**.
2. **Uma curva única e suave:** `L*(H) = 20·H + (1e11 − 20·T)·(H/T)³`, com `T = 409.538 h`. Dia 1 = nível **20**; ano 1 = **7.371**; ano 500 = 8,87e9; em 3147 = **1e11 exato** **[CÁLCULO]**. Ela nunca dá menos hoje do que deu ontem (provado por força bruta nos 409.539 passos).
3. **Teto diário de 1 hora creditável (`τ = 0`).** A hora extra não rende. É o que impede um jogador de 16 h/dia de terminar dentro da própria vida — e é a espinha dorsal da defesa jurídica (Seção 7).
4. **A régua é da Linha, não da pessoa.** A unidade do legado é a *Line* (a conta + a corrente de pessoas). Uma família revezando a conta joga como **uma** pessoa, com um teto só. Isso resolve de uma vez o revezamento familiar, o bot e a desigualdade entre linhagens.
5. **A sensação de progresso mora em cinco degraus**, não no número: **Selo do Dia** (o dia fecha) → **Anel** (365 h creditadas) → **Marco de Dígito** → **Era** (10 delas) → **Capítulo do Keeper** (~25 anos). O odômetro é rodapé; a Era é o que se vive.

### 0.4 O que este plano NÃO promete

- **Não promete que alguém vai jogar 1.121 anos.** Não promete nem que o servidor estará no ar.
- **Não promete "1 hora todo santo dia".** Faltar um dia a cada vinte custa **60 anos**; um a cada dez custa **125 anos** **[CÁLCULO]**. A promessa pública tem que ser *"cerca de 365 horas por ano, quando der"*, nunca *"todo dia"*.
- **Não promete que a sua Linha chega.** A conta honesta está em 0.5, item 1.
- **Não é aconselhamento jurídico**, não é instrumento de herança, e não transfere bens.
- **Não existe precedente.** Ninguém nunca fez uma conta única projetada para 1.100 anos passando de pessoa em pessoa. O MMO mais longevo em atividade tem ~30 anos **[VERIFICADO]**. Nenhum número deste plano pode se apoiar em "já deu certo antes".

### 0.5 Os quatro riscos que mais pesam

1. **A corrente arrebenta muito antes de 3147 — e a conta prova.** Uma Linha precisa atravessar ~**45 trocas de Guardião**. Se cada troca tem 90% de chance de dar certo, a Linha chega em **0,87%** dos casos. Para 50% de chance, cada troca precisa de **98,5%** de sucesso. Com as 48 contas de hoje e 90% por troca, a chance de **alguma** delas chegar é de **~34%** **[CÁLCULO, `raw/10` R-03]**. **Consequência direta:** o *Commons* (uma Linha sem herdeiro poder ser adotada por um estranho que se ofereça) deixa de ser enfeite e vira **requisito de viabilidade**.
2. **Hoje qualquer jogador zera a régua em um pacote de rede** (0.2). Enquanto o nível não vier do tempo medido no servidor, a régua é uma sugestão.
3. **O jogo depende de uma pessoa só.** Se você sumir amanhã, some com você a chave de assinatura do app, o domínio, o acesso ao banco e o segredo de sessão. Não há backup verificado hoje **[VERIFICADO: `raw/04`]**. **Nenhuma promessa de séculos é honesta antes de existir uma segunda pessoa com acesso.**
4. **A lei brasileira, lida ao pé da letra, chama a régua de "recompensa pelo tempo de uso"** — mecanismo que o Decreto 12.880/2026 (art. 9º, parágrafo único, III) lista como incentivo ao uso excessivo por crianças **[VERIFICADO]**. Não é proibição; é risco real. A melhor defesa é o teto de 1 h (`τ = 0`), e ela **enfraquece** se as horas extras renderem.

### 0.6 O que você precisa decidir agora

São **11 decisões bloqueantes**, todas detalhadas com recomendação na **Seção 13**. Em uma linha cada:

| # | Pergunta | Recomendação |
|---|---|---|
| A1 | Formato da curva | Suave (Família B), Eras ancoradas em tempo |
| A2 | O que "3147" promete | "365 h/ano, quando der" + cada Linha tem a própria estrada |
| A3 | Quanto rende a hora extra | Nada (`τ = 0`) no lançamento |
| A4 | Nível vem do XP ou do tempo | Do **tempo** medido no servidor |
| A5 | A régua é da pessoa ou da Linha | Da **Linha** |
| A6 | Regra de hash da Crônica *(sem volta)* | RFC 8785 + prefixo de versão |
| A7 | O que acontece com os 139 personagens | Era Zero + Selo de Pioneiro |
| A8 | Menores entram na régua | Sim com salvaguardas; até o parecer, "Aprendiz" |
| A9 | Linha órfã pode ser adotada | Sim, só com opt-in |
| A10 | Android: registrar-se + chave de release | Sim, até 31/12/2026 |
| A11 | Backup verificado + segunda pessoa | Sim, antes de qualquer migração |

**As duas últimas (A10 e A11) valem mesmo que você rejeite o conceito inteiro.**

### 0.7 O que é urgente e NÃO depende deste conceito

Três coisas correm sozinhas, com prazo próprio. Se você disser "não" ao Jogo Legado amanhã, elas continuam valendo:

1. **Android.** O APK do site é assinado com **chave debug** (a chave automática do Android Studio) **[VERIFICADO: `android/app/build.gradle` sem `signingConfig` no bloco `release`]**. A trava de **30/09/2026** atinge só **lojas participantes** — o `ghostgames.club` não quebra nessa data. Mas o **rollout global de 2027** atinge o APK do site: sem desenvolvedor registrado, instalar passa a exigir um fluxo que pede modo desenvolvedor, reiniciar o celular e **esperar 24 horas** — o que mata a distribuição pelo site **[VERIFICADO: developer.android.com/developer-verification]**. **Ação:** gerar uma chave de release própria (com duas cópias físicas), registrar `danger.ghost.mobile` no Android Developer Console **até 31/12/2026**, e tratar a republicação do APK como **migração de dados** (quem tem o APK debug instalado não consegue atualizar por cima; tem que desinstalar e reinstalar, e o save local do app vai junto).
2. **Os comentários mentirosos em `server/db.js`.** Quatro blocos (linhas ~57-63, 68-70, 136-139, 442-444) ainda dizem que o banco de produção "continua INTEGER" e que `migrate_level_bigint.js` foi "escrito, NÃO executado". **A migração já rodou e foi conferida por checksum** (48 players, 139 characters, colunas em BIGINT). Três agentes independentes leram esses comentários como fato e propagaram um bloqueante falso para o plano inteiro. Custa ~10 linhas corrigir, e enquanto não for corrigido **todo agente futuro vai reencontrar o mesmo erro**.
3. **Termos de Uso, Política de Privacidade e exclusão de conta.** Não existem hoje **[VERIFICADO: grep em `index.html`]**. O ECA Digital (Lei 15.211/2025) está em vigor desde 17/03/2026 e a fiscalização começa entre **nov/2026 e jan/2027**. Hoje o jogo tem chat global, mural público, amigos e galeria de imagens, sem idade declarada, sem vínculo com responsável e sem Termos.

### 0.8 O tamanho real do compromisso

- **MVP do Legado (Fases 0 a 3): 77–130 dias de trabalho** ≈ **310–520 horas suas** dirigindo os agentes **[CÁLCULO sobre HIPÓTESES, `raw/11`]**. A 3 dias por semana: **6 a 10 meses**. A 5 dias por semana: 3,5 a 6 meses. **É um segundo emprego.**
- **Dinheiro no 1º ano: US$ 1.600–4.600 (≈ R$ 9.000–25.000)** **[HIPÓTESE]**, dominado por advogado/DPO — não por servidor.
- **Depois do lançamento**, o primeiro ano pede 104–158 dias de trabalho contra uma capacidade de ~156 dias/ano no ritmo de 3 dias por semana. Cabe no limite, sem folga.

**A saída honrosa existe e está desenhada:** você pode aprovar só a **Fase 0** (o que vale de qualquer jeito), ver a Fase 1 (papel e simulação) e decidir no portão G1 se continua. Nada do que é feito até ali é irreversível.

---

## 1. O que é um Jogo Legado

*(fonte principal: `raw/01_filosofia.md`)*

### 1.1 Definição formal

Uma definição clássica diz a que **família** a coisa pertence e o que a **separa** das outras da família.

> **Um jogo legado é um jogo de progressão persistente cujo objeto de progresso é único, contínuo e transferível entre pessoas; cuja condição de término foi posta, de propósito, além do alcance de uma vida humana; e cuja continuidade depende de uma cadeia de detentores voluntários, em que cada entrega é um ato consentido nas duas pontas e registrado de forma permanente — de modo que o registro das entregas é, ele próprio, conteúdo jogável do jogo.**

São **cinco condições necessárias** (se faltar uma, deixa de ser jogo legado) que, juntas, bastam (→ `raw/01` §B.1.2):

| # | Condição | Se faltar, vira… |
|---|---|---|
| **C1** | **Progresso único e contínuo** — um objeto de progresso que nunca é resetado | jogo incremental com *prestige* |
| **C2** | **Fim real, além de uma vida** — alcançável em princípio, inalcançável por um só | "forever game" ou jogo longo comum |
| **C3** | **Cadeia de pessoas** — passa entre seres humanos distintos | herança de item / conta compartilhada |
| **C4** | **Consentimento nas duas pontas** — entregar e aceitar são escolhas, sem punição por recusar | obrigação hereditária (dark pattern) |
| **C5** | **Registro ininterrupto** — toda entrega e todo detentor ficam registrados de forma legível | uma conta velha que trocou de dono |

**O achado mais importante desta seção:** a condição **C2 não é poesia, é requisito matemático**. Se 16 h/dia permitir zerar em ~70 anos, o jogo deixa **formalmente** de ser legado. É por isso que o teto diário (decisão A3) não é gosto — é definição.

### 1.2 Os 10 princípios, e de onde eles vêm

Cada princípio nasce de uma estrutura real, verificada. A tabela separa **o fato** (aconteceu, tem data), **a regra de jogo** que sai dele e **o cuidado ético** — porque é exatamente aí que projeto "filosófico" vira enganação.

| # | Estrutura (verificada) | Regra de jogo que sai dela | Cuidado |
|---|---|---|---|
| **1** | **Mordomia / usufruto** — direito romano; Jefferson usa a palavra na carta a Madison de 06/09/1789 **[VERIFICADO]** | O Keeper **detém, não possui**. Pode jogar, evoluir, nomear herdeiro, recusar entregar, encerrar a linha. **Não pode** vender, apagar a Crônica, resetar o Legacy Ghost. Dois campos separados no banco: quem é titular × quem detém a Linha agora | "steward" tem carga religiosa em inglês; custódia sem direito de saída vira servidão |
| **2** | **Burke, *Reflections*, 1790** — a sociedade como parceria "entre os vivos, os mortos e os que ainda vão nascer" **[VERIFICADO]** | A Crônica tem três painéis: **The Dead** (só leitura), **The Living** (o Keeper atual), **The Unborn** (a Carta Selada para um herdeiro que ainda não tem nome) | Burke é conservador e escreveu isso *contra* a reforma; pegue a imagem, não a política |
| **3** | **Jefferson (1789) e Paine (1791)** — "governar além do túmulo é a mais ridícula das tiranias"; e a *rule against perpetuities* do direito inglês, criada para limitar a "mão morta" **[VERIFICADO]** | **O contraponto obrigatório.** Recusa sempre possível, sem penalidade; **nenhuma condição herdável** ("só herda se jogar X horas" é tecnicamente impossível); zero linguagem de culpa | Quanto mais bonita a Crônica, mais pesada a recusa. A recusa precisa ser **projetada para ser fácil**, não só permitida |
| **4** | **Hans Jonas, 1979** — poder ampliado cria dever proporcional; origem do princípio da precaução **[VERIFICADO]** | **Esta regra é sobre você, não sobre o jogador:** nenhuma operação irreversível sobre a Linha de alguém sem caminho de volta testado antes. Um **Amendment Log** público numera toda mudança de regra lenta | Não infle a ética de um jogo até a escala da sobrevivência da humanidade |
| **5** | **Parfit, 1984** (problema da não-identidade) + o **horizonte de sete gerações**, princípio articulado por lideranças Haudenosaunee **[CONTESTADO quanto à formulação literal]** | Nenhuma regra pode depender de **quem** é o herdeiro. Toda regra funciona com o slot vazio, com um estranho, com um menor e com quem nunca jogou. Teste obrigatório de design: *"o que o sétimo Keeper herda se lançarmos isso?"* | **Nunca** use nome, símbolo ou grafismo Haudenosaunee como tema. Descreva a ideia |
| **6** | **Long Now / Stewart Brand, 1999** — *pace layers*: "o rápido aprende, o lento lembra" **[VERIFICADO]** | Três velocidades declaradas: **Bedrock** (curva, teto 1e11, regras de Passagem, formato da Crônica — só muda por emenda), **Works** (episódios, ghosts, itens — patch normal), **Weather** (eventos, cosméticos, chat — livre, e **proibido** de tocar no tempo do legado) | Use as ideias, não a estética nem o nome |
| **7** | **Ise Jingu / shikinen sengu** — reconstrução a cada 20 anos; 62ª em 2013, 63ª marcada para 2033 **[VERIFICADO]** | A **Renewal** é obrigatória a cada Passagem e a cada 20 anos de custódia. Na tela é cerimônia; por baixo é reemissão de credenciais, verificação de integridade, exportação do arquivo e checagem de formato | Santuário xintoísta **vivo**. Jamais usar nome, rito ou iconografia como skin |
| **8** | **Navio de Teseu** (Plutarco) **[VERIFICADO]** | O jogo **dá uma resposta explícita**: uma Linha continua sendo o mesmo legado se (i) o progresso é contínuo, (ii) a Crônica é ininterrupta, (iii) toda troca de custódia foi registrada. Isso vira um **teste automatizado** que roda antes e depois de qualquer migração | É problema aberto há 2.000 anos; o jogo escolhe uma resposta, não "prova" nada |
| **9** | **Catedrais + shinise** — Sagrada Família: obras externas da torre central concluídas em 20/02/2026, 144 anos depois do início **[VERIFICADO]**; Kongō Gumi, ~1.400 anos, **absorvida em 2006** **[VERIFICADO]** | (i) **Cada Keeper tem que terminar alguma coisa** — daí as Eras. (ii) O herdeiro **não precisa ser sangue**: daí o Commons. O nome de "zerar" vem daqui: **the Keystone**, a última pedra que quem começou jamais colocaria | **Não esconda o final da Kongō Gumi.** É a parte honesta: 1.400 anos não garantem o 1.401º |
| **10** | **Camus, 1942** ("é preciso imaginar Sísifo feliz") + a literatura de *dark pattern* sobre streaks **[VERIFICADO]** | **O jogo conta horas, não julga dias.** Sem contador de sequência, sem punição por falta, sem "sentimos sua falta", e a régua é **descritiva** ("*if a Keeper plays about an hour a day…*"), nunca prescritiva | **O cuidado mais grave do plano.** Culpa familiar + aversão à perda + horizonte infinito é a combinação mais potente de chantagem que um jogo pode ter. A diferença entre legado e corrente é inteiramente de execução, texto por texto |

**Motivação, com honestidade:** não existe estudo sobre motivação em escala de séculos (procurou-se; não há). O que existe são três pernas verificadas: **o dia vale por si** (Camus + competência, Deci & Ryan), **contribuir para algo que te sobrevive** (Erikson, generatividade — mas isso é dos 40+; a criança de 12 que herda precisa que o jogo seja divertido hoje) e **pertencer a uma linha que continua** (Scheffler). A quarta perna é a trava: **autonomia**. O conceito de legado, por natureza, ataca a autonomia — e o seu "se assim quiser" é a proteção dela (→ `raw/01` §B.4).

### 1.3 O que Danger Ghost é e o que não é

**É:** um jogo legado **opcional** (a camada de legado é escolha, não modo obrigatório); um jogo cujo objeto herdado é a tripla **conta + Legacy Ghost + Chronicle**, não o número; um jogo com fim declarado (1e11) e régua pública verificável; um jogo em que **ler quem veio antes é parte de jogar**.

**Não é** (e o texto público precisa dizer isso com todas as letras): obrigação familiar; instrumento jurídico; culto ancestral ou religião; promessa de que o servidor viverá até 3147; jogo idle/AFK; ativo financeiro. **E não é, hoje, um jogo legado** — hoje é um RPG rápido demais. Ele *passa a ser* quando C1–C5 existirem e a curva respeitar C2.

### 1.4 A trava ética do "se assim quiser"

Três mecânicas concretas, e todas as três são obrigatórias:

1. **Decline the Charge** — o botão de recusar tem **o mesmo peso visual** do de aceitar. A Crônica registra apenas *"declined"*, em tom neutro; nunca "abandonou" ou "falhou".
2. **Nenhuma condição herdável** — o sistema tecnicamente não aceita cláusulas do Keeper anterior sobre o comportamento do próximo.
3. **Retire the Line** — o Keeper pode encerrar a própria linha com dignidade, e a Crônica fecha com texto honroso.

A tela de Passagem mostra, com o mesmo destaque, as duas frases: *"You may accept this."* e *"You may decline this, and nothing is lost."*

### 1.5 Vocabulário final (in-game em inglês, PT-BR para você)

O jogo é 100% em inglês (`CLAUDE.md`), então os termos oficiais são em inglês. **Regra-mãe: nenhum termo oficial pode ser palavra sagrada, rito ou nome de povo de tradição viva.**

| In-game (EN) | PT-BR | O que é | Armadilha evitada |
|---|---|---|---|
| **Keeper** | Guardião | Quem detém a Linha agora | **Nunca "Guardian"** — no seu lore, Guardian já é o Gato ("the Feline Guardian") e a RX ("Guardians of Ink"). `Custodian` = *zelador* em inglês americano; `Warden` = carcereiro |
| **Heir** / **Successor** | Herdeiro / Sucessor | Nomeado / quem assume vindo do Commons | Assim ninguém precisa ser "herdeiro" de um estranho |
| **the Line** (*House* opcional) | a Linha / a Casa | A linhagem inteira — **a unidade do conceito** | — |
| **the Chronicle** / **an Entry** | a Crônica / uma entrada | O registro | `Ledger` puxa contabilidade e cripto |
| **the Legacy Ghost** | o ghost do legado | O ghost que é a régua | `Heirloom` já significa outra coisa em MMO |
| **the Handover** | a Passagem | O ato de entregar | **Nunca `the Passing`** = falecimento |
| **the Investiture** | a Investidura | A cerimônia de quem recebe | Evitar `Oath` — juramento cria obrigação |
| **Accept / Decline the Charge** | aceitar / recusar o encargo | Os dois botões, mesmo peso | — |
| **the Sealed Letter** | a Carta Selada | Carta para quem vier | Evitar `Testament`/`Will` (confusão jurídica real) |
| **the Vigil** | a Vigília | Os 30 dias de espera antes da Investidura | — |
| **the Renewal** | a Renovação | Ritual a cada Passagem e a cada 20 anos | `Rebuilding` seria apropriação de Ise |
| **Keeper's Signal** | Sinal do Guardião | A prova de vida aos 180 dias | Renomeado para não colidir com o Roll Call |
| **the Roll Call** | a Chamada | Leitura anual dos nomes | **Evitar `Remembrance Day`** = feriado militar real |
| **Dormant** | Dormente | 365 d sem login | **Nunca `Abandoned`** |
| **Safekeeping** | Resguardo | Linha órfã guardada pelo operador | — |
| **Retire the Line** | aposentar a linha | Encerrar por escolha | `End` soa a falha |
| **the Commons** | o Comum / linhas abertas | Linhas órfãs adotáveis | — |
| **the Keystone** / **Keystone Bearer** | a Pedra Angular / quem a coloca | "Zerar" | Honra a cadeia inteira, não só o último |
| **the Closing** | o Encerramento | O protocolo de sunset digno | **Nunca "Last Rites"** = sacramento cristão vivo |
| **Era Zero** / **the First Keepers** | Era Zero / os Primeiros Guardiões | As ~48 contas de hoje | Fundadores, não "contas legadas retroativas" |
| **Day Seal** · **Ring** · **Digit Milestone** · **Odometer** | Selo do Dia · Anel · Marco de Dígito · Odômetro | Os degraus sentidos + o número | — |
| **Movement** · **Omen** · **Vow** · **Echo** · **Mark** · **Aspect** | Movimento · Presságio · Voto · Eco · Marca · Aspecto | Vocabulário de conteúdo (Seção 3) | — |
| **Lantern Oil** · **Reforge** · **Era Pack** · **Great Work** | Óleo da Lanterna · Refundir · Pacote de Era · Grande Obra | Economia e conteúdo | — |

> **Pendência barata e honesta:** o vocabulário **ainda não foi revisado por falante nativo de inglês**. `raw/01` pediu e não foi feito. Nome errado em camada lenta é caro de desfazer — isso entra na Fase 1, antes de qualquer texto de jogador (→ Seção 13, C1).

---

## 2. A régua e a matemática

*(fonte principal: `raw/02_calibracao.md`, com todas as correções de `raw/10` §2.3 e §7 aplicadas)*

### 2.1 O que "1 hora" quer dizer, exatamente

> **Hora de referência:** 3.600 segundos de **tempo ativo creditado pelo servidor** a uma conta.

Um segundo só é creditado quando **todas** estas condições valem (→ `raw/02` §3.1):

1. existe sessão autenticada aberta, com identificador gerado pelo servidor;
2. o servidor recebeu, dentro da janela de *heartbeat* (um "sinal de vida" que o jogo manda periodicamente), **evidência de jogo de verdade** — não basta a aba estar aberta;
3. o segundo é medido pelo **relógio do servidor**, nunca pelo do cliente;
4. o segundo é atribuído ao **Legacy Ghost** daquela conta.

**Uma conta = um relógio.** Web e celular abertos ao mesmo tempo creditam **um** segundo por segundo de parede, nunca dois.

| Situação | Conta? |
|---|---|
| Jogando fase/dungeon, ou andando no overworld | sim |
| Ghostdex / inventário / paperdoll **com interação** | sim, até 15 min/dia |
| Cutscene rodando | sim |
| Chat sem entrada de jogo · menu parado · app minimizado | não |
| Sem entrada por mais de 120 s | não (o relógio pausa) |
| Ghost secundário | não, para a régua (conta para score, badges e itens) |

**Por que a definição precisa desse rigor:** a data de chegada é multiplicada pelo erro de medição. Se "1 hora de referência" valesse 45 minutos, a chegada iria para **841 anos**; se valesse 75 minutos, para **1.402 anos** **[CÁLCULO]**. Mudar a definição em 15 minutos move a chegada em 280 anos. **A definição da hora é um parâmetro de calibração tão forte quanto a própria curva.**

> **Correção aplicada (`raw/10` R-18):** o crédito **não** pode depender do `visibilitychange` do navegador (o evento que avisa que a aba saiu de foco). Ele nunca foi testado no WebView do app Android, e há estados (tela dividida, picture-in-picture, overlay) em que se comporta diferente. A fonte de verdade é **evento de jogo qualificado no servidor**, e só.

### 2.2 A curva

> `L*(H) = 20·H + (1e11 − 20·T)·(H/T)³`, com `T = 409.538` horas creditadas.

Em português: o jogador ganha **20 níveis por hora garantidos desde o primeiro dia**, e por cima disso vem uma parcela que cresce com o cubo da fração do caminho já percorrido. A parte cúbica é quase nada no começo e domina no fim.

**Marcos [CÁLCULO — recomputado do zero por um segundo agente, `raw/10` §2.3]:**

| Marco | Horas creditadas | Nível |
|---|---|---|
| Dia 1 (1 h) | 1 | **20** |
| 1 semana | 7 | 140 |
| 1 mês | 30 | 600 |
| **1 ano** | 365 | **7.371** — *(o `raw/02` dizia 7.376; estava errado por 5 níveis)* |
| 10 anos | 3.652 | 1,44e5 |
| 100 anos | 36.524 | 7,17e7 |
| 500 anos | 182.621 | 8,87e9 |
| 1.000 anos | 365.243 | 7,09e10 |
| **3147** | 409.538 | **1e11 exato (erro = 0)** |

**Três propriedades que foram provadas, não afirmadas:**

- **Monotonicidade [VERIFICADO por força bruta nos 409.539 passos inteiros]:** o jogador **nunca** ganha menos hoje do que ganhou ontem. A menor taxa instantânea é exatamente 20 níveis/hora, no instante zero, e ela nunca cai.
- **A data fecha exatamente** em 1e11, sem arredondamento.
- **O ganho por hora cresce** ao longo dos séculos: 20 níveis/hora no dia 1, 5.846 na década 10, 1,46e5 na década 50, **732.490** no fim.

**A leitura que você precisa ouvir, e que o relatório original suavizou:** na **década 50** — depois de 500 anos e de umas 15 gerações de Keepers — o contador está em **8,9% do caminho**. Mais de 91% do número acontece depois disso. **Isso é consequência matemática de qualquer curva que faça o dia 1 ser humano**, não um defeito desta. Mas significa que o plano precisa de uma resposta narrativa pronta para *"eu e meus netos somos 0,0x% do total"* — e essa resposta são as **Eras** (Seção 3), não o número.

### 2.3 O nível como função do tempo, e o orçamento diário

O nível do legado **não acumula XP**: ele é recalculado como função pura dos segundos creditados. Três consequências boas, de graça:

- a data-alvo é exata **por construção**;
- 1.100 anos de erro de arredondamento somado desaparecem (o contador de segundos é **a única grandeza da régua inteira que nunca chega perto do limite do JavaScript** — ver 2.6);
- todo achado de segurança sobre o nível forjável (Seção 5) vira **irrelevante para a régua**, sem reescrever combate nenhum.

**Orçamento diário — lançar com `τ = 0`.** O mecanismo é o **Banco de Vigília**: o banco enche 1 hora por dia (até um teto de acúmulo de ~30 h **[HIPÓTESE — o parâmetro exato é fixado no harness da Fase 1]**) e é gasto a 1×. A hora real acima do banco rende `τ`.

- **`τ = 0`** = teto duro com memória: a hora extra **não rende nada**, mas quem faltou ontem pode repor hoje.
- `τ = 0,10` = a hora extra rende 10%, para sempre.

**Recomendação: lançar com `τ = 0`** e só subir depois de (i) parecer escrito do advogado e (ii) antibot no ar. O motivo que **nenhum relatório tinha visto** (`raw/10` C-16): a defesa jurídica inteira do relatório `06` se apoia na frase *"passou de 1 hora, o ganho é zero"* — verdadeira com `τ = 0` e **falsa** com `τ = 0,10`. E há uma assimetria: **subir `τ` é generosidade; baixar é punição retroativa.** Comece baixo.

> **Correção aplicada (`raw/10` R-01):** com teto duro, o "dia" tem que ser uma **janela deslizante de 24 h**, não o dia-calendário UTC. Uma sessão das 20h às 22h de Brasília atravessa a virada das 00:00 UTC e valeria **dois dias-legado** — 2 h de graça, todo dia, sem má-fé nenhuma. E a interface precisa mostrar o horário de corte **em hora local**.

### 2.4 Tabela por arquétipo — e por que ela mede Linhas, não pessoas

Com o Banco de Vigília a `τ = 0,10` **[CÁLCULO, conferido duas vezes]**:

| Horas reais/dia | Horas efetivas | Anos até 1e11 | Razão sobre a régua |
|---|---|---|---|
| **1 (a régua)** | 1,00 | **1.121** | 1,00× |
| 2 | 1,10 | 1.019 | 1,10× |
| 4 | 1,30 | 863 | 1,30× |
| 8 | 1,70 | 660 | 1,70× |
| **16** | 2,50 | **449** | 2,50× |
| **24 (bot)** | 3,30 | **340** | 3,30× |

Com **`τ = 0`** a tabela inteira colapsa: **todos os arquétipos levam 1.121 anos**, porque a hora extra não rende. Um bot rodando 24 h por dia ganha exatamente o que um humano que jogou uma hora ganhou. **Não é preciso detectar bot para neutralizá-lo** — é preciso ter teto.

**A correção conceitual mais importante do plano inteiro** (`raw/10` R-02/R-04, decisão **A5**): o relatório original concluiu "ninguém zera sozinho" porque o bot leva 340 anos. A conta está certa e a conclusão está errada para o caso que importa. O conceito **não é atacado por um bot solitário** — é atacado por **uma Linha que automatiza**, ou por uma **família revezando em turnos** (pai 8 h, mãe 8 h, filho 8 h, na mesma conta). Com `τ = 0,10`, essa Linha termina **~780 anos antes** das outras. E note: o revezamento familiar **é exatamente o caso de uso que você descreveu no pedido**.

Por isso: **a régua é da Linha, não da pessoa.** O teto é da Linha, os Termos dizem isso, e a tabela de arquétipos é refeita nessa unidade. É a única versão implementável — a alternativa exigiria distinguir uma família de uma fazenda de bots, o que é impossível.

### 2.5 Sensibilidade: o que acontece quando a vida acontece

**[CÁLCULO]** Porcentagem de dias jogados × ano de chegada:

| Dias jogados | Dias corridos necessários | Chegada |
|---|---|---|
| 100% | 409.538 | **3147** |
| **95%** | 431.093 | **3207** |
| 90% | 455.042 | 3272 (sem repor) · **3234** (repondo pelo Banco) |
| 80% | 511.923 | 3428 |

> **Este é, na avaliação da auditoria, o número mais importante do plano inteiro para uma conversa honesta:** *faltar um dia a cada vinte custa 60 anos. Faltar um a cada dez custa 125.*
>
> A promessa pública **não pode ser "1 hora todo santo dia"** — nenhum ser humano faz isso por décadas. Ela tem que ser **"cerca de 365 horas por ano, quando der"**, com uma margem de presença `m ≈ 0,90` embutida na calibração (decisão **A2**).

**A trava de calendário, corrigida.** O relatório original travava o **nível** em 1e11 antes de 3147-01-01. Com margem `m = 0,90`, o jogador impecável chegaria em **3035** e ficaria **112 anos** — quatro a cinco gerações inteiras de Keepers — recebendo uma conta **congelada no máximo**. É o pior resultado possível para um conceito cujo ponto é "a sua hora conta".

> **Regra canônica (`raw/10` C-03):** **o contador nunca trava.** O que tem portão de calendário é a **Keystone** — o evento de colocar a pedra. Ninguém a coloca antes de 3147-01-01.
>
> E o texto público passa a ser: ***"3147 é a data de quem começa agora. A sua Linha tem a sua própria estrada."*** Uma Linha fundada em 2100 chega ao 1e11 por volta de 3221, e isso é correto e honesto.

**Efeito colateral valioso que ninguém tinha notado** (`raw/10` R-07): a trava da Keystone é **a melhor defesa que o plano tem contra um bug futuro que conceda 1e11 de graça**. Com ela, nenhum exploit *termina* o jogo — no máximo adianta um contador, que depois é corrigido por errata. Recomenda-se declará-la **invariante de segurança**, não só de calibração.

### 2.6 Precisão numérica e limites técnicos por 1.100 anos

O JavaScript representa inteiros com exatidão só até **9.007.199.254.740.991** (≈ 9,007e15); acima disso ele **arredonda em silêncio**.

| Grandeza | Valor em L = 1e11 | Cruza o limite em L = |
|---|---|---|
| `level` | 1e11 | **nunca** |
| **segundos ativos (o relógio)** | **1,4743e9** | **nunca** |
| pontos de atributo | 5e11 | nunca |
| `xpRequired` | 8,91e17 | 4,21e9 (atenção) |
| **XP acumulado** | **3,64e28** | **7,16e5** (atenção dobrada) |
| dano de arma tier 60 | 2,01e24 | 3,07e6 (atenção) |
| score acumulado | 4,22e18 | 1,66e9 (atenção) |

**Leia a segunda linha:** o contador de tempo é a única grandeza da régua que nunca chega perto do limite. É mais um argumento para derivar o nível dele.

**Os tetos de validação de hoje — três estouram [VERIFICADO: `server/db.js:466-480`]:**

| Campo | Teto hoje | Exigido pela régua | Veredito |
|---|---|---|---|
| `level` | 1e11 | 1e11 | **no fio da navalha** — ver abaixo |
| `time` | **1e8 s = 3,17 anos** | 1,47e9 s | **estoura em décadas** |
| `score` | **1e16** | ~4,2e18 | **estoura** |
| `xp` | 1e19 | 3,64e28 se acumulado | some, se o XP virar derivado |

**E o modo de falha é o pior possível.** Um número fora da faixa **não dá erro**: o campo é **apagado** do pacote, e o `COALESCE` do banco **preserva o valor antigo**. O jogador continua jogando, o número para de subir, e nada aparece na tela **[VERIFICADO: `db.js:425-429, 516-536, 664`]**.

**Dois achados que nenhum relatório tinha feito (`raw/10` §2.1):**

1. **`level: [1, 1e11]` é um teto exclusivo de fato.** O 1e11 exato passa — mas qualquer cálculo que produza `1e11 + 1` (arredondamento da curva, bônus de cerimônia, um `Math.ceil` mal colocado no último dia) é rejeitado em silêncio e **congela o jogador em 99,999…% no dia mais importante do conceito inteiro**. **Regra:** o teto de *validação* tem que ser **maior** que o teto de *jogo* (ex.: 1,01e11); a trava do 1e11 vive na lógica, que erra alto e corrige, nunca na validação, que erra apagando.
2. **Três colunas antigas ainda são `INTEGER`** (`total_kills`, `total_items_collected`, `total_lives_collected`) e o modo de falha delas é **o oposto**: por serem somadas no servidor, elas não passam pela validação — quando passarem de 2.147.483.647, o Postgres **quebra com erro**. **[CÁLCULO]** A 60 kills/h e 1 h/dia isso leva 98.000 anos (folgado); a 120 kills/h e 16 h/dia, **3.065 anos** — além de 3147, mas dentro da ordem de grandeza. **Não é bloqueante; é dívida declarada**, e entra na próxima janela de migração.

**Outros limites, resolvidos:**

- **Ano 2038** (o estouro de relógios de 32 bits): **não** afeta o `Date` do JavaScript nem o `timestamptz` do Postgres; afeta qualquer coluna inteira de 4 bytes usada como data — e não há nenhuma **[VERIFICADO]**.
- **Ano 10000** quebra a serialização de datas no formato ISO. Longe, mas registrado.
- **Segundo intercalar / redefinição do UTC:** irrelevante, e a razão é boa — o plano guarda **contadores**, não datas civis. Um segundo intercalar desloca o crédito em no máximo 1 segundo **[VERIFICADO]**.
- **`level` já é BIGINT em produção**: a migração `migrate_level_bigint.js` **foi executada e verificada por checksum** (48 players, 139 characters). O bloqueante que três relatórios citavam **está fechado**; o que sobrou foram quatro comentários desatualizados no código (Seção 0.7, item 2).

### 2.7 O que a simulação provou e o que reprovou

O `raw/02` montou um *harness* (banco de testes automatizado) de Monte Carlo — rodar a mesma simulação centenas de vezes com sorteios diferentes, para ver a **distribuição** dos resultados e não só a média — com **10 critérios de aceite**. O `raw/10` acrescentou o 11º.

**Provado:**

- a fórmula fecha em 1e11 exato e é monotônica em todos os 409.539 passos;
- "95% dos dias jogados ⇒ 3207" confere;
- "16 h/dia = 449 anos" e "bot = 340 anos" conferem (com `τ = 0,10`);
- preservar o nível dos 139 personagens atuais custaria **no máximo 0,74%** do horizonte — matematicamente inofensivo.

**Reprovado — e isso importa:** **os critérios 1 e 2 do harness REPROVAM na calibração sem margem** (com `m = 1,00`, a mediana de chegada foi 3234 e **0%** dos casos chegaram em 3147) **[VERIFICADO em `raw/02` §9.3]**. É exatamente por isso que a promessa precisa da margem de presença `m ≈ 0,90` (decisão **A2**). **O harness passando 11/11 é portão obrigatório da Fase 1** — se nenhuma calibração humanamente possível passar, o plano não avança e a promessa é reformulada.

**O 11º critério, novo (`raw/10` R-09 — um erro matemático real no relatório original):** o mecanismo de recalibração de `raw/02` §4.5 (abrir uma nova versão de curva no meio do caminho) **destrói a garantia que ele vende**, porque a soma dos ganhos das duas curvas não fecha mais em 1e11 no tempo T. **Correção:** toda nova versão de curva tem que ser **recalibrada para o que falta** (`T_restante = T − horas já creditadas`, `teto_restante = 1e11 − nível já ganho`). O critério 11 testa isso trocando a curva nos anos 10, 100, 500 e 1000.

---

## 3. Como o jogador vive isso

*(fonte principal: `raw/07_conteudo_eras_economia.md`)*

### 3.1 O problema, e a resposta

Sob **qualquer** curva que cumpra a régua, o crescimento relativo por sessão desaba: +0,46% por sessão no fim do 1º ano, +0,0009% no ano 500; e o dígito da frente do odômetro pode ficar parado por até **146 anos** (de 1e10 para 2e10) **[CÁLCULO]**. **O número do nível não pode ser a unidade que o jogador sente.**

A resposta é uma escada de cinco degraus, e só o primeiro é diário:

| Degrau | O que é | Cadência |
|---|---|---|
| **Day Seal** (Selo do Dia) | O fecho de uma hora creditada. Contador acumulado ("Days Kept"), **nunca** sequência | todo dia |
| **Ring** (Anel) | 365 horas creditadas da Linha (≈ 1 ano de régua). Contado em **tempo**, não em calendário — assim um dia perdido não desalinha a história | ~1 ano |
| **Digit Milestone** (Marco de Dígito) | Cada troca do dígito da frente do odômetro (1e5 → 2e5 → …). 100 no total | irregular |
| **Era** | A unidade macro. 10 delas | anos a séculos |
| **Capítulo do Keeper** | O mandato de uma pessoa | ~25 anos |

**Decisão de desenho que fecha uma contradição entre relatórios (`raw/10` C-02):** as **Eras são ancoradas em tempo creditado, não em nível**. Isso dissolve o pedido de uma curva "por partes" que o `raw/07` fazia — ele só existia porque se supunha que o marco sentido seria o dígito do odômetro. Com Eras ancoradas em tempo, o requisito desaparece e a curva suave fica.

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

Cada Era traz **um verbo novo** (não só um número maior), uma região, uma paleta, um chefe e uma relíquia honorífica.

**Achado forte e barato [VERIFICADO]:** as **33 fases que o jogo já tem cabem exatamente na Era I = 33 horas creditadas** (um episódio por hora creditada), e as quatro faixas de espécies do Ghostdex casam com as Eras I–IV. O conteúdo do primeiro mês **já existe**.

### 3.3 A "hora completa" — e por que não há streak

A hora é composta de **4 Movimentos de 15 minutos**: **Arrive** (chegar), **Descend** (descer), **Tend** (cuidar) e **Seal** (selar). Fracionáveis, sem penalidade por não completar. A hora do dia 1 e a hora do ano 500 usam os mesmos quatro movimentos, com verbos e sistemas diferentes.

O quarto movimento é o **"Fecho do dia"**: uma tela que diz, em substância, *"O legado de hoje está escrito. Pode continuar explorando, ou voltar amanhã, sem nada a perder."* Ela é, ao mesmo tempo, um bom fecho de sessão e a salvaguarda jurídica S2 (Seção 7) — um **ponto natural de parada visível**, o oposto do que o Decreto 12.880 chama de incentivo ao uso excessivo.

**Proibidos por desenho:** contador de sequência, bônus de login, missão diária, multiplicador por sessão longa, evento com recompensa perdível, e qualquer mensagem de cobrança.

### 3.4 O dia 1, o ano 500 e o herdeiro que nunca jogou

- **Dia 1.** Você entra, joga o primeiro episódio, sobe do nível 0 ao 20, fecha o Selo do Dia e vê a estrada: as Eras II–X aparecem **trancadas**, com nome e silhueta, e o texto diz quanto tempo cada uma leva. Nada é escondido.
- **Ano 500.** O Keeper de 2526 não vê "um número maior": está na Era VIII, num território com verbos que não existiam na Era I, lendo os capítulos das ~15 pessoas que seguraram a lanterna antes dele, e escrevendo o seu. O odômetro está em 8,9% — e o jogo **nunca** apresenta isso como atraso.
- **O herdeiro novato.** Entra pelo **Vestíbulo**: leitura, sem poder, com um **Resumo de 60 segundos** da Linha (barras proporcionais de tempo por Keeper, a Era atual) antes de qualquer capítulo. Pode recusar ali mesmo. Se aceitar, o primeiro dia dele é com um **Ghost Aprendiz** — o sistema de múltiplos personagens que já existe — enquanto o Legacy Ghost "repousa". Ninguém é jogado no meio de uma conta de 400 anos sem tutorial.

### 3.5 Escala dos sistemas que já existem

O problema é real: com o nível derivado do tempo, **o dano de arma chegaria a ~1,4e8 no ano 1** se as fórmulas atuais continuassem valendo **[CÁLCULO]**.

| Sistema | Como fica |
|---|---|
| **Combate** | Entra um **"Nível de Combate" logarítmico**: `100·log₁₀(1+L)`. Todas as fórmulas atuais continuam valendo, nada passa de ~3,8e9, e a dificuldade para de derivar. É **item obrigatório do MVP**, não melhoria |
| **Atributos** | Regra **"razão, não valor"**: todo efeito vira função da *fração* do orçamento de pontos, não do número absoluto (hoje AGI tem teto, vidas são `4+vit`, duração é `1+0,10·int` — tudo quebra cedo) |
| **HP de inimigo** | Derivado de um **tempo-para-matar alvo**, não de `L^1,90` cru |
| **Itens** | Por **razão**, com Selo de Era e **Reforge** (trazer uma peça herdada para a Era atual mantendo nome e inscrição). Isso neutraliza de graça o problema do baú (abaixo) e elimina o *power creep* por Era |
| **Ghostdex** | As 101 espécies ganham **Aspectos** por Era (paleta + aura) — colecionável novo sem arte nova pesada |
| **Badges (333)** | A escada de requisitos migra para **Marcos de Dígito**, preservando o que já foi ganho. **Isso é uma migração de produção** que nenhum roteiro previa — fica para a Fase 5, com checksum |
| **Ghosts secundários** | Continuam no **Jogo Livre**, com Rank 1–100 e **sem crédito de horas**. Também é migração dos 139 personagens — Fase 5 |
| **33 episódios** | Viram a Era I. Rejogáveis livremente |

**Achado que ninguém tinha visto (`raw/10` R-10):** o baú da conta (`players.chest_items`) é **compartilhado por todos os ghosts** **[VERIFICADO: `db.js:116-130`]**. Um ghost secundário farmando 16 h/dia enche o baú de lendários e **equipa o Legacy Ghost** — ou seja, o teto de tempo limitaria o *contador*, mas não o *poder*. A regra "itens por razão" resolve isso sem proibir nada.

### 3.6 Economia

Duas moedas, com papéis separados:

- **Score** — o que já existe. Precisa de uma decisão: hoje ele é concedido **por chamada de `addXp()`, por acidente de otimização** **[VERIFICADO]**. Passa a ser por **Marco** ou por **feito**, nunca por hora.
- **Lantern Oil** (Óleo da Lanterna) — nasce do **tempo** (1 por Selo do Dia), não do nível. Não infla ao longo dos séculos, porque a fonte é limitada pelo teto diário. Entra junto com a primeira Passagem.

**Regra de ferro da economia:** eventos e rituais **dão memória, nunca poder**. Nada de XP, nível ou item exclusivo por participar de um evento. Isso protege a régua e, de quebra, impede que uma conta ganhe preço de mercado.

**Relíquias** são **honoríficas e não transferíveis** (`transferable = false`). Uma relíquia com poder vira item negociável — o oposto exato do anti-RMT (Seção 7).

### 3.7 O fim de jogo, e o "pós-fim"

**Zerar não acaba o mundo.** A Linha que chega a 1e11, depois da Última Ronda e do portão de calendário de 3147, entra no estado **Concluída**: a **Keystone** é colocada, os créditos rolam **todos os Keepers da cadeia**, e a Linha se aposenta com honra num **Monumento** imutável. O mundo e as outras Linhas continuam.

- **Empate é o caso esperado**, não a exceção: na coorte fundadora, várias Linhas chegam no mesmo ano civil. A regra é **Keystone conjunta**.
- Quem quiser continuar começa uma **Linha nova** ("Novo Ciclo"), que é outra Linha — não um "New Game+" que reseta a antiga.
- **O que se faz enquanto se espera o calendário:** a **Última Ronda** vira obrigatória, não opcional — uma Era X com conteúdo próprio. Essa lacuna existia; com a trava sobre a Keystone (e não sobre o contador), a espera deixa de ser "um contador congelado" e passa a ser tempo jogável normal.
- **Nada disso vira código agora.** A Keystone é um invariante do banco ("nenhuma Keystone antes de 3147-01-01"), não uma feature a construir. O Coro e o Monumento jogável só se desenham na Era VIII.

---

## 4. Sucessão e Crônica

*(fonte principal: `raw/03_sucessao_cronica.md`, com os vereditos de `raw/10` §4 aplicados)*

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
| **Operador** | Você hoje; a entidade depois | rodar o varredor; manter o Resguardo; cumprir ordem judicial; corrigir por **errata** | ver senha; **acelerar a Vigília a pedido pessoal — nem você**; reescrever a Crônica; abrir um 4º caminho |

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
| **Ativa** | tem Keeper, o relógio corre |
| **Dormente** | 365 dias sem login autenticado. **Ainda é dele.** Qualquer login o traz de volta, **sem culpa nem multa**. O Heir com a Chave já pode resgatar |
| **Vigília** | os 30 dias de espera antes da Investidura |
| **Resguardo** | escada esgotada (730 d) sem resgate: **nenhum Keeper ativo**. Linha congelada e guardada pelo operador, dados pessoais minimizados. **Não é confisco.** Com `commons_optin`, abre ao Commons depois de 5 anos |
| **Disputa** | contestação, ordem judicial ou fraude |
| **Concluída** | a Keystone foi colocada |
| **Arquivada** | encerrada por escolha (*Retire the Line*) ou 30 anos em Resguardo sem pedido |

**"Conta reclamada" não é estado, é resultado:** alguém completou um resgate, uma adoção ou uma ordem judicial.

### 4.4 A Passagem, passo a passo

1. **Designação.** O Keeper nomeia um Heir (e, se quiser, um suplente). Na mesma tela responde à pergunta **obrigatória** do `commons_optin` (as duas respostas com o mesmo peso). O Heir precisa **reconhecer** a nomeação — designar alguém que nunca respondeu não vale.
2. **A Chave do Legado.** 24 palavras, geradas pelo servidor, **mostradas uma única vez**, impressas em papel, em duas cópias, em lugares diferentes. O sistema guarda só o `SHA-256` delas.
3. **O resgate.** O Heir apresenta a Chave, autenticado na **própria** conta.
4. **A Vigília: 30 dias, ANTES da troca de controle.** Durante ela o Keeper de saída **continua no comando** e qualquer um dos dois cancela com um clique.
5. **A Investidura.** Na **mesma transação** do banco: encerra o mandato anterior, abre o novo, troca a senha (o novo Keeper escolhe a dele), sobe o `token_epoch` e **derruba todas as sessões**, web e celular.
6. **30 dias de experiência.** O novo Keeper pode devolver a Linha ao Resguardo, sem custo.

**Nenhuma senha viaja.** Três fatores: a Chave em papel + o Heir autenticado + a Vigília.

> **Dois defeitos de desenho corrigidos aqui (`raw/10` C-05 e C-06), que eram bugs e não opiniões:**
> - O `raw/09` inseria o Guardião novo **antes** de encerrar o anterior — e isso **viola o índice único que o próprio `raw/09` cria** ("um Keeper ativo por Linha"). A transação falharia em produção. **Vira caso de teste obrigatório:** *"tentar abrir dois Guardiões na mesma Linha tem que falhar no banco, não no código."*
> - O `raw/09` punha a Vigília **depois** da troca de controle, prometendo ao Keeper de saída um direito de cancelar — mas o `token_epoch++` do resgate **derruba a sessão dele**, então ele não consegue exercer o direito prometido. A Vigília vem **antes**. Fim.

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

> **Ressalva dura (`raw/10` R-12):** **toda essa escada depende de e-mail transacional, que hoje não existe.** Não há envio, não há verificação de endereço, não há "esqueci minha senha" **[VERIFICADO]**. Sem isso, a escada inteira é letra morta — por isso ela entra na Fase 0-B do roadmap, antes do conceito.

### 4.5 Recusa, dormência, adoção e ritual

- **Recusar é um direito, e é fácil.** A Crônica registra *"declined"*, em tom neutro. Nada é perdido, ninguém é notificado com julgamento.
- **Dormência não é morte.** É "pode acordar" — e a palavra "abandoned" é proibida no produto inteiro.
- **Adoção (Commons) só com opt-in prévio do Keeper.** Isso é **definicional**: sem consentimento nas duas pontas, a condição C4 cai e o objeto deixa de ser legado, vira conta reciclada. A costura com a preocupação legítima do relatório jurídico (Linhas ricas morrendo por falta de herdeiro) é fazer do `commons_optin` **uma pergunta obrigatória na Investidura**, com as duas respostas igualmente fáceis — a taxa de adesão sobe sem violar a definição.
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

**O hash da Crônica — a única decisão do plano que não tem conserto depois.** Cada entrada carrega o hash da anterior, formando uma corrente: mudar qualquer entrada antiga quebra tudo daí para frente. Três relatórios propuseram três fórmulas diferentes, e a do `raw/09` **colide**: foi demonstrado em Node que concatenar campos sem separador faz `"P"+1+"2x"` e `"P"+12+"x"` darem o mesmo SHA-256.

> **Regra canônica (`raw/10` C-01, a única que foi testada em vez de proposta):**
> `entry_hash = SHA-256("dgc1:" ‖ JCS({v, lineage_id, seq, kind, occurred_at, payload, prev_hash}))`
> com `JCS` = serialização canônica RFC 8785, data em ISO-8601 UTC com milissegundos, a **string canônica gravada junto** (nunca recomputada a partir do JSON relido — o `JSONB` do Postgres reordena chaves), hashes em `BYTEA`, e o `payload` **sem nenhum dado pessoal**.
>
> **Critério de aceite:** vetores de teste publicados e **duas implementações independentes** (JavaScript e Python) dando o mesmo resultado **antes do primeiro evento ser gravado**.

**Por que o texto livre nunca entra na corrente (`raw/10` R-24):** se um texto ilegal for gravado dentro da cadeia de hash, o sistema **se recusa a removê-lo** — o append-only vira um passivo. A solução já estava desenhada e ninguém tinha ligado os pontos: **só o hash do texto entra na cadeia, com um sal por texto**. Remover o texto apaga o sal e **não quebra a corrente**.

### 4.7 UX para quem nunca jogou

O Livro tem três tempos (Burke): **The Dead** (capítulos anteriores, agrupados por Era, paginados a partir de ~100), **The Living** (o mandato atual, ao vivo) e **The Unborn** (escrever uma Carta Selada). A ordem de leitura começa pelo **Resumo de 60 segundos** — uma faixa de tempo com barras proporcionais e a Era atual — e só depois vêm os capítulos. Para uma criança ou para alguém que nunca jogou, esse resumo é a diferença entre "isto é meu" e "isto é grande demais".

### 4.8 Os casos de estresse que mais importam

O `raw/03` listou mais de 30. Estes são os que mudam desenho:

| Caso | Resposta do sistema |
|---|---|
| Dois herdeiros disputam | **Só uma** Linha continua (C1). O segundo recebe uma **cópia da Crônica** (leitura), nunca do progresso |
| Herdeiro menor de idade | **Adulto Responsável** + a escada de dormência **pausada** (Reserva) até ele poder aceitar por conta própria. **Nunca** atribuído automaticamente |
| Chave perdida com o Keeper vivo | reemissão na Renewal (4.5). Com o Keeper morto e sem Chave: a Linha segue a escada até o Resguardo |
| Keeper vivo mas impedido (doença) | **Modo Ausência**; o Curador informa e os relógios param |
| Alguém pede a conta por e-mail dizendo ser filho | **nada acontece.** A resposta é genérica e idêntica, exista ou não a Linha |
| Fraude descoberta 200 anos depois | **ajuste datado** (`credit_adjustment`, delta negativo, com Selo de Contestação), **nunca** reescrita do total — porque o nível é função dos segundos acumulados da Linha, e subtrair segundos de 2150 mudaria o nível de quem estiver jogando em 2400 (`raw/10` R-08) |
| Auto-sucessão (passar a Linha para si mesmo) | não é detectável com certeza, mas é **encarecível**: guarda mínima de 180 dias entre Passagens, exigência de histórico independente do Heir, e os Termos declaram que gerações auto-sucedidas **não contam para o ranking de gerações** |
| Pedido de exclusão pela LGPD | executa um **procedimento** (anonimizar perfil, apagar contatos, substituir identidade por número de geração), **nunca** um `DELETE` direto — ver Seção 7 |

---

## 5. Integridade do tempo e anti-abuso

*(fonte principal: `raw/05_integridade_antiabuso.md`)*

### 5.1 O que está frágil hoje — e isso não é culpa do conceito

Quatro fatos verificados no código, que existem **independentemente** do Jogo Legado:

| # | Achado | Evidência |
|---|---|---|
| 1 | **Todo o XP e todo o nível são calculados no navegador.** Os dois únicos pontos de concessão de XP do jogo rodam no cliente; o servidor tem um evento `kill_boss` que **só retransmite**, não credita nada | `js/game/engine.js:1104-1105` e `:3311`; `server/index.js:658-660` **[VERIFICADO]** |
| 2 | **O teto de validação do nível é o objetivo final do jogo.** `NUMERIC_BOUNDS.level = [1, 1e11]`, e a checagem é literalmente `n >= 1 && n <= 1e11`. Um pacote com `level: 1e11` **passa** | `server/db.js:466-467, 496-499` **[VERIFICADO]** |
| 3 | **Não existe checagem de variação nem de monotonicidade.** O `UPSERT` preserva campo **ausente**, mas **nunca compara** o valor novo com o gravado. O nível pode ir de 3 para 1e11, ou voltar de 1e11 para 1, sem nada acontecer | `server/db.js:711+` **[VERIFICADO]** |
| 4 | **JWT de 30 dias sem revogação.** O token carrega **só o e-mail** — sem época, sem identificador. Busca por `token_epoch` ou `revok` em `server/index.js`: **zero ocorrências**. Não há lista de revogação, não há troca de senha, não há "esqueci minha senha" | `server/index.js:121-125, 788-800` **[VERIFICADO]** |

E um quinto, que é o mais direto: **tempo de jogo não é medido em lugar nenhum.** A coluna `"time"` existe, mas o cliente grava `0` e nunca incrementa **[VERIFICADO]**. A régua do seu pedido, hoje, **não tem base nenhuma no código**.

> **As quatro juntas, em uma frase:** hoje uma pessoa logada legitimamente **zera o jogo de 1.121 anos em um pacote de rede**, e o servidor não tem como saber nem como desfazer a sessão dela.
>
> Duas honestidades sobre este achado: (i) a varredura por outros caminhos que escrevam o nível direto em `engine.js` (220 KB) **não foi feita de forma exaustiva** — a afirmação correta é "nos dois pontos conhecidos", e a varredura completa é pré-requisito da Fase 2; (ii) **nada disso foi reproduzido contra o banco real**, porque o brief proibia. Reproduzir o cenário numa conta descartável, em ambiente de teste, é o **primeiro item da Fase 1**.

### 5.2 O que também já está certo (e não deve ser "consertado")

Para ser justo com o código que existe: a identidade de quem escreve vem **sempre** da sessão autenticada, nunca do payload; os contadores de kills e itens são somados **no servidor**, por delta pequeno; as senhas usam bcrypt; o JWT é verificado de verdade; o login tem limite de tentativas; as queries são parametrizadas **[VERIFICADO]**. O problema é específico: **o número do progresso vem do cliente**.

### 5.3 A proposta: o tempo é a verdade

**Nível do legado = função pura dos segundos creditados pelo servidor.** Três relatórios chegaram a isso independentemente (`raw/02` §4.0, `raw/05` §3.1, `raw/09` §2.1) — é a única convergência unânime do plano inteiro.

O que isso resolve de uma vez:

- o cliente adulterado vira **irrelevante para a régua** (ele pode mentir o nível na tela; o nível do legado é recalculado pelo servidor);
- **não é preciso reescrever combate, dano, loot e colisão no servidor** — que seria a alternativa, e é um projeto de anos;
- o XP do cliente vira **cosmético**: uma previsão de interface, corrigida pelo servidor.

**Como o tempo é creditado, na prática:**

| Peça | Regra |
|---|---|
| Protocolo | `legacy_session_start` → `legacy_heartbeat` (periódico) → `legacy_session_end` |
| Crédito | só com **evento de jogo qualificado** dentro da janela; sem evento, não credita |
| Idempotência | por `(sessionId, beatSeq)` — reenvio não credita duas vezes |
| Quedas | `MAX_BEAT_GAP` + retomada após reinício do servidor, sem dobrar e sem perder mais que uma janela |
| Web + celular juntos | **bastão de crédito**: uma sessão credita, a outra vira espectador **com aviso** — nunca derrubada em silêncio |
| Relógio do cliente adulterado | ignorado. Só vale o relógio do servidor |
| Relógio do servidor andando para trás (NTP) | delta negativo é descartado, com alerta |
| Teto | `τ = 0` por **janela deslizante de 24 h**, por **Linha** |
| Fechamento | job noturno `sealDay` sela o dia, grava `credited_seconds`, `curve_version` e um hash do dia |

### 5.4 Modelo de ameaças, resumido

| Ameaça | Resposta |
|---|---|
| Cliente adulterado mandando nível alto | o nível do legado não vem do cliente. O save "normal" continua existindo, mas não move a régua |
| Bot / macro / AFK 24 h | **o teto resolve sem detectar nada.** Um bot ganha o mesmo que um humano de 1 hora |
| Multi-aba, web + celular | uma conta = um relógio (bastão de crédito) |
| Manipulação de relógio | só o relógio do servidor conta |
| Família revezando em turnos | com `τ = 0` e a régua **da Linha**, o revezamento não rende nada a mais — e não é preciso proibir nem acusar ninguém |
| Multi-conta | não ajuda: cada Linha tem a própria régua, e as horas não se somam entre Linhas |
| Venda de conta (RMT) | fricções (Seção 7). A alavanca real: **o comprador leva o save, não a Linha** — a compra nunca aparece na Crônica |
| Sessão do Keeper anterior após a Passagem | `token_epoch` na Investidura derruba todas as sessões |
| Exploit futuro que conceda 1e11 | a **trava da Keystone** garante que nenhum exploit *termina* o jogo; some-se o alerta "nível impossível para o tempo creditado" |

**Três coisas explicitamente NÃO recomendadas, em nenhuma fase:** ofuscação de cliente, *attestation* de dispositivo e CAPTCHA no meio do jogo. Custam caro, afastam jogador legítimo e não resolvem nada que o teto já não resolva.

### 5.5 O que vem antes de anunciar

Sem discussão, e nesta ordem: **tempo autoritativo → sessão única → teto diário → nível derivado do tempo → limite de frequência nos saves**. Depois disso vêm MFA, Crônica encadeada e âncora pública. **O anúncio público vem por último**, porque anunciar a régua antes da integridade é exatamente o cenário em que um pacote adulterado zera o jogo na frente de todo mundo.

---

## 6. Durabilidade por 1.121 anos

*(fonte principal: `raw/04_durabilidade.md`)*

### 6.1 A promessa honesta

**Ninguém garante 1.121 anos.** O plano promete três coisas menores e verdadeiras:

1. **sobreviver** às falhas previsíveis;
2. **degradar com dignidade** — nunca perder nada em silêncio;
3. **poder ser recriado** por um estranho, a partir do arquivo e de um documento.

### 6.2 Os quatro níveis de continuidade

A ideia é que o serviço **desça de degrau** em vez de morrer. Cada degrau custa uma ordem de grandeza menos e é uma promessa mais longa.

| Nível | O que é | O que perde | Custo anual **[HIPÓTESE]** |
|---|---|---|---|
| **N1 — Jogo vivo** | login, multiplayer, save, Passagem, ranking, chat | nada | **US$ 1.500** (VPS + banco + domínio + backups) a **US$ 8.000** (com contador, advogado e seguro de uma entidade) |
| **N1-R — Reduzido** | um jogador / offline; Passagem manual assistida; sem chat e sem multiplayer | tempo real entre jogadores | ~metade de N1 |
| **N2 — Congelado** | servidor mínimo: ver perfil, Keepers, Crônica; nada de novo save | jogar | **US$ 300–600** |
| **N3 — Arquivo consultável** | **sem servidor de aplicação**: um site estático (HTML + JSON/SQLite) em duas hospedagens; exportações baixáveis | jogar, entrar com senha, dados pessoais | **≈ US$ 250** |
| **N4 — Registro histórico** | conjunto de dados documentado + Crônica em texto puro + documento "Como reconstruir" + índice em papel | qualquer interface | **US$ 0–100** |

**Quatro invariantes não negociáveis:**

1. **Descer nunca apaga.** Toda descida gera um instantâneo com manifesto de hash e uma entrada na Crônica.
2. **Nada silencioso.** O servidor publica um arquivo de "pulso" que um verificador **externo** confere; se ficar velho mais de 3 dias, dois humanos são alertados.
3. **Aviso em canais que controlamos primeiro** (banner no jogo, site, README do repositório, Crônica, e-mail) e **depois** redes sociais. Uma conta de rede social nunca pode ser o único lugar de um aviso.
4. **O domínio nunca é abandonado**, nem em N3/N4 — ele serve, no mínimo, uma página estática dizendo onde está o arquivo.

**Prazos de aviso:** N1→N2 pede **≥ 180 dias**; N2→N3 pede **≥ 365 dias**. E as descidas **congelam todos os relógios de dormência** — ninguém cai em Resguardo por causa de um relógio que o serviço não estava em condições de atender.

**Isso é "the Closing"** — o protocolo de encerramento digno, escrito desde o dia 1 e publicado, não improvisado no fim.

### 6.3 A sucessão do OPERADOR — o item mais crítico e o mais ignorado

Hoje o *bus factor* é **1**: se você sumir, somem com você a keystore do Android, o domínio, o acesso ao Supabase, o `.jwtsecret`, o repositório e o gerenciador de senhas. **[VERIFICADO]** Não há backup automático visível no repositório, não há licença, não há segunda pessoa com acesso.

O caminho é em degraus, e o primeiro custa quase nada:

| Degrau | O que é | Quando |
|---|---|---|
| **Adjunto nomeado** | uma pessoa técnica de confiança, com aceite formal, que consegue **fazer deploy, restaurar do arquivo e renovar o domínio** — e não altera regras. Regra escrita: *"se o operador não responde a 3 check-ins seguidos (~90 dias), o adjunto pode renovar o domínio, pagar a hospedagem, subir o serviço em N1-R/N2 e publicar aviso"* | **semana 1** |
| Segredos em partes | compartilhamento 3-de-5, para que nenhuma pessoa sozinha tenha tudo e três juntas consigam reconstruir | primeiros meses |
| Documento "Como reconstruir o jogo" | testado por **alguém que não o escreveu** | primeiros 6 meses |
| **Associação sem fins lucrativos** | antes da primeira Passagem a não-familiar | ano 1–2 |
| Fundação / fundo patrimonial | só quando houver capital de verdade | anos |

> **Regra dura (`raw/10` R-05):** **nomear o adjunto é pré-requisito de ANUNCIAR o conceito**, não de construí-lo. Você não pode prometer 1.121 anos enquanto o projeto inteiro depende de uma pessoa sem substituto.

### 6.4 Custódia, formatos e o Arquivo do Legado

**O que precisa ser guardado** (e em que faixa de tempo): estado das contas (séculos), identidade (no máximo décadas, e **nunca** no arquivo público), a **Crônica** (o bem mais precioso e o mais barato — é texto), as **regras de cálculo** (como texto versionado + implementação de referência, não só como código), o código, os assets, o domínio, os segredos e a documentação.

**O Arquivo do Legado:** JSON + SQLite + CSV + Markdown/PDF-A, tudo UTF-8, com `format_version`, dicionário de campos, fórmulas escritas por extenso, **números grandes como string decimal** (para não perder precisão), manifesto SHA-256, README em PT e EN. **Sem e-mail e sem hash de senha dentro.** Distribuição: **três cópias em duas hospedagens, mais uma offline e uma em instituição.**

**Itens de custódia que `raw/04` não tinha listado e agora entram (`raw/10` §1.3 A4):** a **keystore de release do Android** e as credenciais do Android Developer Console. Num plano que promete séculos, a chave de assinatura do app é ela própria um item de custódia de longo prazo — e perder a keystore depois do registro significa **não conseguir mais publicar atualização do mesmo app**. É irreversível.

**Tamanho dos dados — a conta certa (`raw/10` C-12):** ~**91 MB** (com hashes em formato binário) a ~**117 MB** por Linha em 1.121 anos, e ~117 GB para mil Linhas. O `raw/09` dizia 33 MB; o valor certo é 3,5× maior. **A conclusão de viabilidade não muda** ("o Postgres nem sente"), mas a faixa de preço do plano contratado muda. Ninguém mediu tabela real — medir numa cópia é tarefa do `backend-architect`.

### 6.5 O teste dos 50 anos

Pergunta: *"se o dev sumir por 50 anos, o que acontece no dia X?"*

**Resultado hoje: 0 "sim", 3 "parcial", 7 "não"** em 10 itens **[VERIFICADO em `raw/04` §6]**. O cenário base é conhecido: no **ano 2 a 3**, o cartão expira, a VPS é suspensa, a cobrança do banco falha e o jogo sai do ar; o GitHub sobrevive (se público), mas **ninguém tem os segredos**; e o APK instalado continua apontando para um domínio que pode ter caído em mãos de terceiros.

**O achado de segurança que nasce da durabilidade:** o APK tem `https://ghostgames.club` gravado dentro dele. **Se o domínio expirar e um estranho o registrar, todo APK instalado passa a enviar e-mail e senha para o estranho.** O domínio é a camada mais barata (~US$ 16/ano) e a mais perigosa de perder. Ação: pré-pagar até 10 anos, travar transferência, 2FA físico e monitor externo.

**Simulacro anual de restauração:** uma vez por ano, alguém restaura o arquivo do zero, com critérios de aceite numéricos, e o resultado é registrado na própria Crônica.

### 6.6 O papel honesto da blockchain própria

Primeiro, a distinção que o `CLAUDE.md` exige: a **DeSo foi removida e não volta**; "DeSoHosting" é só o nome do provedor de VPS; e a **blockchain proprietária futura** é um item de roadmap separado e real.

**Papel honesto dela neste plano:** no máximo **uma testemunha** — carimbar 32 bytes (o hash da cabeça da Crônica) de tempos em tempos. **Nunca o armazém.** Três relatórios independentes chegaram à mesma conclusão.

**E ela não é necessária.** Testemunhas baratas que já existem resolvem hoje: o repositório público, o Internet Archive, o Software Heritage, e-mail aos mantenedores do arquivo. A regra da publicação da "cabeça" da cadeia é **semanal, em pelo menos 3 testemunhas, das quais pelo menos 2 independentes de qualquer conta sua** — uma conta de rede social é ponto único de falha, não testemunha.

**Gatilho para reconsiderar:** só depois de o arquivo existir, a entidade existir e o financiamento existir.

### 6.7 Financiamento, e o texto honesto para os jogadores

**Financie primeiro o piso.** Manter N3/N4 (arquivo consultável + registro histórico) para sempre pede da ordem de **US$ 8–12 mil de principal**; manter o jogo vivo é bônus, não base. O fundo de `raw/04` foi dimensionado para o **fracasso** (o piso) e **nunca para o sucesso** — se o conceito funcionar e houver mil Linhas ativas, a conta muda (`raw/10` R-20). Rever depois do lançamento.

**O texto que vai para os jogadores, em substância:**

> *"Ninguém pode garantir mil anos. O que a gente garante é o seguinte: o seu progresso e a sua Crônica são exportáveis desde o primeiro dia; se o jogo tiver que encolher, ele encolhe com aviso de meses, nunca de um dia para o outro; e se ele acabar, acaba virando um arquivo público que qualquer pessoa consegue ler sem precisar de nós."*

Mais dois compromissos concretos que sustentam isso: o contador público **"Dia N de 409.538"** e uma página **"Saúde do Legado"**, com fatos em vez de adjetivos.

---

## 7. Jurídico, ética e menores

*(fonte principal: `raw/06_juridico_privacidade.md`)*

> **Isto não é aconselhamento jurídico.** Nada aqui substitui um advogado inscrito na OAB. A subseção 7.6 lista o que exige profissional, por urgência.

### 7.1 O achado central

**Decreto nº 12.880, de 18/03/2026**, que regulamenta a **Lei nº 15.211/2025 (ECA Digital)** — em vigor desde 17/03/2026 **[VERIFICADO por duas equipes, em fontes independentes]**:

- **Art. 9º, caput:** fornecedores de produtos ou serviços de TI "direcionados a crianças e adolescentes **ou de acesso provável por eles**" devem implementar mecanismos para evitar uso excessivo, problemático ou compulsivo.
- **Art. 9º, parágrafo único** — o que conta como incentivo ao uso excessivo: **I** ocultar pontos naturais de parada; **II** acionar conteúdo novo sem solicitação; **III** **a oferta de recompensas pelo tempo de uso**; **IV** notificações excessivas.

**O problema, dito sem rodeios:** a régua do legado é, literalmente e por desenho, uma recompensa concedida em função do tempo de uso — `nível = f(segundos creditados)`. É a definição do inciso III lida ao pé da letra. E jogos eletrônicos têm **presunção de "acesso provável"** por menores — **um aviso "18+" não afasta isso**.

**Não é proibição. É risco de interpretação sério**, e precisa de salvaguardas desenhadas *antes* e de parecer escrito de advogado.

**Cronograma que corre sozinho:** período de adaptação até nov/2026; fiscalização a partir de jan/2027 (uma fonte fala em nov/2026 — use o prazo mais rigoroso).

### 7.2 A defesa, e a condição que a sustenta

A defesa é boa e tem três pernas: o alvo do art. 9º é estimular uso **maior**, e **um teto diário faz o oposto**; o jogo mostra explicitamente quando parar (o "Fecho do dia", que ataca o inciso I); e não há nenhuma recompensa por presença.

> **A descoberta que nenhum relatório tinha feito (`raw/10` C-16):** a defesa inteira se apoia na frase *"passou de 1 hora, o ganho é zero"*. Essa frase é **verdadeira com `τ = 0`** e **falsa com `τ = 0,10`**. O relatório jurídico escreveu a defesa antes do relatório de calibração existir; o de calibração escolheu `τ` sem saber que estava mexendo na defesa jurídica. **É a contradição que mais recomendo levar ao advogado.**

**A pergunta exata para o advogado:** *"Um jogo cujo progresso principal é função do tempo de sessão, mas que limita o ganho a 1 hora por dia e mostra explicitamente ao jogador quando parar, viola o art. 9º, parágrafo único, III do Decreto 12.880/2026, ou cumpre a finalidade do caput? E isso muda se o jogo adotar verificação de idade e não for direcionado a menores?"*

### 7.3 As 12 salvaguardas

| # | Salvaguarda | Como se desenha |
|---|---|---|
| **S1** | **Teto, não meta** | 1 h/dia é **limite de crédito**. O jogo nunca diz "jogue mais"; nenhuma tela mostra "faltam X min para a meta" |
| **S2** | **Ponto natural de parada visível** | O "Fecho do dia". Sem pop-up de "só mais uma", sem conteúdo novo empurrado |
| **S3** | **Zero recompensa por presença** | Sem bônus de login, sem "dia 7 de sequência", sem missão diária, sem multiplicador por sessão longa. Recompensas ligadas a **feitos**. As 333 badges são auditadas para garantir que nenhuma exija "X horas jogadas" (hoje nenhuma exige) |
| **S4** | **Sem streak, sem perda** | Faltar não tira nada: sem decaimento, sem "sua linhagem morre". O Banco de Vigília perdoa ausência |
| **S5** | **Sem notificação de cobrança** | E-mails só de conta, segurança e sucessão. Ver a emenda em 7.4 |
| **S6** | **Sem culpa no texto** | Proibido "você quebrou a linha", "seu pai ficaria decepcionado". Todo texto voltado a menor passa por revisão |
| **S7** | **Sem "atraso" exibido a criança** | A régua aparece **descritiva** ("se um Guardião joga cerca de 1 h por dia…"), nunca "você está 12 dias atrás" |
| **S8** | **Conta de menor mais conservadora** | Teto ≤ 1 h/dia, **sem reposição do banco acima de 1 h**; o responsável pode **baixar** o teto, nunca subir; chat, mural, amigos e galeria **desligados por padrão** |
| **S9** | **Sem eventos "perdeu, perdeu"** | Nenhuma recompensa exclusiva com prazo. Quem perdeu o evento não perde nada permanente |
| **S10** | **Controles parentais reais** | Vínculo obrigatório a responsável para menores de 16; painel com limite de tempo (só para baixo), contatos, exportar/apagar, ver o que o filho vê |
| **S11** | **Registro de revisão ética + RIPD** | Documento datado explicando por que cada mecânica diária não é recompensa por tempo, com avaliação do melhor interesse da criança. É prova de boa-fé se houver fiscalização |
| **S12** | **Kill-switch** | Um interruptor que desliga o crédito e a visibilidade da régua **para menores** sem quebrar a Linha. Permite obedecer a uma orientação futura da ANPD em dias, não em meses |

**O plano B, já pronto:** o **"Modo Aprendiz"** — o menor joga o mundo inteiro, mas **sem crédito de tempo de legado** e sem ver a régua; aos 18 vira Keeper e o crédito começa. **Recomendação: até o parecer chegar, quem se declarar menor no cadastro entra em Aprendiz por padrão.**

### 7.4 LGPD e a Crônica

**O conflito:** "continuidade do jogo" **não** está entre as exceções de conservação de dados do art. 16 da LGPD **[VERIFICADO]**. Logo, a Crônica precisa ser **desenhada para não conter dado pessoal permanente** — é o que a estrutura em camadas da Seção 4.6 faz.

**Quatro correções concretas:**

1. **Padrão global: zero dado pessoal na Crônica.** O relatório jurídico recomendava isso só para menores e falecidos. Adotar para **todos** resolve LGPD e GDPR de uma vez — e o GDPR entra em cena assim que um herdeiro morar na União Europeia, o que ninguém tinha analisado (`raw/10` R-16).
2. **Um SHA-256 de e-mail não é anonimização** (`raw/10` C-10). Um hash sem chave é reidentificável por dicionário — continua sendo dado pessoal. Se o vínculo for necessário, use **HMAC com chave guardada na camada privada**, nunca publicado nem exportado.
3. **O pedido de exclusão executa um procedimento, não um `DELETE`** (`raw/10` R-11). O desenho do `raw/09` usa `ON DELETE RESTRICT` para impedir que apagar a conta apague a Crônica em cascata — mas o efeito real não é "preserva a Crônica", é **o `DELETE` falhar com erro de chave estrangeira** na cara do jogador. O procedimento correto: anonimizar o perfil, apagar contatos, substituir identidade por número de geração, **e só então** apagar a linha da conta — ou, melhor, marcar como apagada e nunca apagar. **Tem que estar escrito como procedimento operacional antes do primeiro pedido real.**
4. **Convites de retorno: permitidos, com trava** (`raw/10` C-14). O relatório jurídico proibia qualquer "volte a jogar"; o de comunidade propunha convites **opt-in**, no máximo 1 a cada 90 dias, parando de vez após 2 sem resposta, com um checklist anti-*dark pattern*. Vale a segunda versão, **com três emendas**: (a) convite é comunicação de marketing e exige consentimento específico; (b) **nunca** para conta de menor nem vinculada a responsável; (c) o "aviso de aniversário da Linha" ("seu e-mail ainda é seu? seu herdeiro ainda é o mesmo?") é **aviso de segurança**, não convite — fica sempre ligado.

### 7.5 Herança digital, natureza da conta e anti-RMT

- **Herança digital no Brasil:** não há lei específica. O **PL 4/2025** tramita no Senado; o **STJ** (REsp 2.124.424, 26/09/2025) criou a figura do "inventariante digital"; e a **ANPD** entende que a LGPD **não protege dados de pessoas falecidas** — a proteção vem dos direitos da personalidade do Código Civil **[VERIFICADO]**.
- **A conta é licença, não propriedade** — como Steam, PlayStation e Nintendo tratam **[VERIFICADO]**. A recomendação é **licença + Passagem oficial designada em vida**, que é o único mecanismo que as grandes plataformas aceitam como vontade do titular. Chamar de "propriedade" cria valor econômico e abre a porta para venda de contas.
- **Anti-RMT:** proibir a venda por contrato é prática universal e lícita; o difícil é distinguir Passagem legítima de venda disfarçada. A resposta é **fricção, não vigilância**: designação com pelo menos 30 dias de antecedência, guarda mínima de 180 dias entre Passagens, atestado de gratuidade, e sanção proporcional **com direito de apelação**. **A alavanca real é estrutural:** quem compra uma conta leva o save, **não a Linha** — a compra nunca aparece na Crônica, e a Crônica é o que dá sentido ao objeto.
- **A entidade em duas etapas:** **Associação** sem fins lucrativos primeiro (antes da primeira Passagem a não-familiar), **Fundação** de direito privado (Código Civil arts. 62–69) só quando houver capital. "Trust" de verdade não existe no Brasil ainda. Junto: cessão de marca, código e domínio à entidade, **licença aberta** (proposta: AGPL-3.0 para o código + CC BY-SA 4.0 para os assets, depois de auditoria de titularidade — e **nunca fechado sem escrow**) e um **compromisso público de encerramento (sunset) de 180 dias**.

### 7.6 O que exige um profissional de verdade

Por urgência:

| Urgência | Item |
|---|---|
| **Agora (bloco 1)** | Termos de Uso · Política de Privacidade · canal do titular · procedimento de exclusão · aceite versionado · **parecer escrito sobre o art. 9º, III** · campo de idade e vínculo com responsável |
| **Antes da 1ª Passagem** | cláusula de sucessão da conta nos Termos · menores como herdeiros · atestado de gratuidade e sanções de RMT · consentimento por campo da Crônica |
| **Ano 1–2** | constituição da associação · cessão de marca/código/domínio · licença · RIPD · GDPR para herdeiros fora do Brasil · testamento do operador com *break-glass* |

**Duas honestidades sobre esta seção:** (i) o texto integral do Decreto 12.880 **não foi lido na fonte primária** — o site do Planalto recusou conexão nas tentativas de dois agentes diferentes; o conteúdo foi confirmado por fontes secundárias convergentes (Câmara/Legin, Ministério da Justiça, escritórios), e um dos agentes conseguiu ler no portal da Câmara. **Antes de virar cláusula, alguém precisa abrir o `planalto.gov.br` e conferir a redação exata.** (ii) A lei está em movimento — refaça a consulta antes de qualquer decisão.

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
- **O Keeper não é "o Guardião" do lore** — esse é o Gato. O Keeper é a pessoa **do lado de cá da tela**, alguém do Ponto Cego que carrega a lanterna e escreve a Crônica. É também por isso que o termo in-game é *Keeper*, nunca *Guardian* (Seção 1.5).
- **"Zerar" é o jogo chegar em casa**, no ano em que foi escrito. Quem segura a lanterna nesse dia é o *Keystone Bearer*, mas a chegada é **da Linha inteira**.

### 8.2 As extensões de lore que dependem do seu "sim"

Nada abaixo está escrito no seu lore. Cada uma é um fato novo, e você pediu que os agentes não inventassem.

| # | O que acrescenta | Recomendação |
|---|---|---|
| **E1 — "A âncora"** | todo Legacy Ghost só mantém a forma enquanto alguém o mantém; quando a Linha fica Dormente, o ghost "repousa", nunca morre | **pedido de lore a você**, para um eventual Vol. III. Mexe na física do mundo (hoje só Ftasma é âncora) |
| **E2 — "A Dívida do Céu"** | o nível 1e11 é a dívida do céu paga; em PT-BR, "zerar o jogo" = "zerar a dívida" | **aprovar, se você gostar** — dá peso simbólico ao número gigante. Mas **nunca** exibir "dívida restante" como contagem regressiva |
| **E3 — "A Fenda aberta"** | a estrada 2026→3147 é o tempo que a Fenda precisa ficar aberta | **desaconselhado.** Soa a "a Fenda fecha se você não jogar" — é cobrança disfarçada |
| **E4 — "Uma estrela por Linha"** | cada Linha que coloca a Keystone devolve uma estrela ao céu roubado; o Mapa do Céu mostra as Linhas como estrelas | **aprovar, se você gostar** — resolve a coroação conjunta com elegância e dá imagem final |
| **E5 — "O ronronar do Gato"** | o Gato aparece como presença tranquilizadora na Investidura do herdeiro novato | **pedido de lore a você** — o Gato é personagem-chave |

**Recomendação consolidada:** publicar com **zero fatos novos** (só o canon), e adotar **E2 + E4 apenas se você aprovar por escrito**. Os textos já estão marcados: se você disser não, basta apagar as linhas marcadas e o texto continua inteiro.

### 8.3 Rituais e Commons

**Calendário fixo, e pouco** (a carga do ano 1 é estimada em **~85 h**, podendo chegar a ~125 h no pior caso **[HIPÓTESE]**):

- **Legacy Day** — aniversário do Dia da Fundação de cada Linha;
- **the Roll Call** — leitura anual dos nomes, em 21 de junho;
- **the Renewal** — por Linha, a cada Passagem e a cada 20 anos.

**Regra de ferro:** **eventos dão memória, nunca poder.** Nenhum XP, nível ou item por participar. E nenhum prêmio perdível — sem FOMO punitivo.

**O Commons deixa de ser enfeite.** Pela conta de sobrevivência geracional (Seção 11, risco 1), o Commons é **o único mecanismo que aumenta de verdade a chance de uma Linha chegar a 3147**, porque converte "não tinha herdeiro" de fim de linha em troca de Guardião. Na comunicação ele passa a ser apresentado como o que é: **a razão pela qual o conceito é viável**, não um recurso bonito.

**Papéis de comunidade, poucos e com rodízio:** 2 **Lookouts** no ano 1, **Scribes** a partir do ano 2, sempre adultos, com rodízio de 2 anos.

**Achado real que muda planos [VERIFICADO]:** o chat global de hoje é um **broker MQTT público de terceiros — sem conta, sem moderação e sem possibilidade de banimento**. Ele não serve de base para uma comunidade de décadas. Ação imediata e barata: rotulá-lo como *"public, unmoderated"*. Ação de médio prazo: **não hospedar ritual nenhum nele** e mover para um canal autenticado antes dos eventos da Crônica.

**Ranking por geração — três desenhos viram um (`raw/10` R-19):** existem hoje três propostas concorrentes. A separação correta não é escolher uma, é empilhá-las: `lineage_standings` é o **dado** (uma linha por Linha, atualizada por job noturno), o Mapa do Céu / Hall of Keepers é a **apresentação**, e o `raw/03` é a **regra** (o que entra e o que não entra). Nada disso é MVP: fica para o ano 2, com pelo menos 100 Linhas ativas.

### 8.4 Comunicação sem prometer o futuro

**A regra de escrita:** *prometer o ritmo, não o futuro.*

| Nunca diga | Diga |
|---|---|
| "1.121 anos garantidos" | "o ritmo do jogo foi calibrado para isso; a régua é uma **medida, não uma agenda**" |
| "jogue 1 hora todo dia" | "se um Guardião joga cerca de uma hora por dia…" (descritivo, sempre) |
| "a sucessão está testada" | "testada em N Passagens piloto" — com N verdadeiro, e só depois que houver piloto |
| "você está atrasado" | nada. Esse número não existe na interface |

**Duas peças públicas concretas, que substituem adjetivos por fatos:** o contador **"Dia N de 409.538"** (que congela no Encerramento) e a página **"Saúde do Legado"** — quantas Linhas ativas, quando foi o último teste de restauração, qual o nível de serviço atual.

**Comunicação em degraus, na ordem:** (i) a carta pessoal às ~48 contas; (ii) 48 h de observação; (iii) só então a página pública, o FAQ e o compromisso de encerramento digno; (iv) campanha larga **só depois** dos pilotos de Passagem.

### 8.5 A carta às ~48 contas

É a peça que faz a Era Zero dar certo ou errado. Ela precisa dizer, em substância: *o seu nível atual não é apagado — ele vira história, marcado como `pre_era_level`, e você recebe o **Selo de Pioneiro**; a partir de agora o contador do legado começa em 1, e ele mede outra coisa: tempo, não XP; você é um dos Primeiros Guardiões.*

**Regras de envio:** 7 dias antes, 24 h antes e 1 h antes. **Você envia** — os agentes só rascunham. Se mais de um terço das respostas for negativa, **a etapa pública é pausada** e você responde individualmente **[HIPÓTESE do limiar]**. E como e-mail de domínio novo cai em spam com facilidade, use também o chat global e o mural.

### 8.6 O "sunset" digno

É **the Closing** (Seção 6.2), e ele é escrito e publicado **desde o dia 1**, não improvisado no fim: gatilhos objetivos para descer de nível, aviso de 180 a 365 dias, exportação individual liberada desde sempre, instantâneo com hash a cada descida, e uma **"Última Entrada"** na Crônica já escrita e guardada.

---

## 9. Arquitetura técnica e migração

*(fonte principal: `raw/09_arquitetura_migracao.md`, com as correções de `raw/10` §7 itens 9–17)*

### 9.1 O modelo de dados

**Nada é apagado ou reescrito.** As tabelas `players` e `characters` continuam sendo a verdade do save; as tabelas novas guardam *quem é dono da história*, *quanto tempo real foi investido* e *o que aconteceu*.

| Tabela nova | O que guarda | Colunas-chave |
|---|---|---|
| **`lineages`** | a Linha — o legado em si | `lineage_id`, `account_id` (único), estado (ativa/dormente/vigília/resguardo/disputa/concluída/arquivada), `founded_at`, `commons_optin` |
| **`keepers`** | Guardião atual e todo o histórico | `lineage_id`, `generation`, `started_at`, `ended_at`, `handoff_in_type`, `handoff_out_type`, + **índice único parcial: um Keeper ativo por Linha** |
| **`successions`** | o estado de uma Passagem em andamento | designação, convite, aceite/recusa, início e fim da Vigília, Investidura |
| **`succession_vault`** | o Cofre — só o `SHA-256` da Chave do Legado | nunca a Chave em claro |
| **`chronicle_events`** | a Crônica: append-only, com hash encadeado | `seq`, `kind`, `occurred_at`, `payload` (sem dado pessoal), `prev_hash`, `entry_hash` (`BYTEA`), **string canônica gravada** |
| **`playtime_sessions`** | camada quente, descartável | sessões abertas, heartbeats, idempotência |
| **`playtime_daily`** | camada selada, permanente | `credited_seconds BIGINT`, `curve_version`, `day_hash` |
| **`playtime_yearly`** | agregado anual | para leitura rápida de séculos |
| **`relics`** | relíquias honoríficas | **`transferable = false`** (corrigido — o padrão original era `true`) |

**Mais quatro colunas aditivas** em `players`/`characters`: `account_id` (identificador opaco da conta), `login_handle` (o apelido de login pseudônimo), `token_epoch` (para revogar sessões) e `pre_era_level` (o nível antigo, preservado como história).

**Uma tabela a mais, que o `raw/10` acrescentou:** **`credit_adjustment`** — ajustes datados de tempo, positivos ou negativos. Ela precisa existir **desde a modelagem inicial**, porque é barata agora e cara depois: sem ela, corrigir uma fraude antiga significaria **reescrever o total** e mudar o nível de quem estiver jogando dois séculos depois.

**Volume [CÁLCULO]:** um agregado diário por Linha em 1.121 anos são **409.538 linhas ≈ 91–117 MB**. Com mil Linhas, ~365 mil linhas por ano e ~117 GB no total. **O Postgres nem sente** — mas isso muda a faixa de preço do plano contratado. O que **não** cabe: guardar heartbeat cru para sempre (24,5 milhões de linhas e ~3 GB por Linha) — por isso o livro-razão tem duas camadas.

### 9.2 O fluxo autoritativo — a maior mudança do plano

**Hoje:** o cliente calcula XP e nível, e o servidor valida faixa.
**No legado:** o **servidor calcula** e o cliente apresenta.

```
cliente: legacy_session_start
   -> servidor abre sessão, gera sessionId
cliente: legacy_heartbeat (periódico, com evidência de jogo qualificado)
   -> servidor credita segundos (idempotente por sessionId+beatSeq), só do próprio relógio
cliente: legacy_session_end  (ou timeout)
   -> servidor fecha
job noturno sealDay:
   -> sela o dia: credited_seconds + curve_version + day_hash
   -> recalcula  legacy_level = L*(total de segundos creditados da Linha)
   -> grava evento na Crônica quando cruza Selo / Anel / Marco / Era
```

`addXp()` do Legacy Ghost passa a **aplicar o que o servidor manda**; o cálculo local vira previsão de interface. Ghosts secundários continuam como hoje.

**Ordem noturna recomendada:** `sealDay` → verificação da corrente → dump → exportação → âncora externa. Nessa ordem, e não em outra.

**Detalhe de infraestrutura que é pré-requisito:** o pool de conexões do Postgres precisa de `connectionTimeoutMillis` configurado **antes** de qualquer escrita periódica — hoje, 15 jogadores simultâneos já levaram a latência de poucos milissegundos a ~5 segundos **[medido em `raw/09` §6]**. Com heartbeat isso piora.

### 9.3 Sucessão técnica

- **Login:** o modelo final é separar **a pessoa** (que tem sua própria conta e senha) da **Linha** (o objeto herdado) — assim nenhuma credencial troca de mãos. Mas renomear a chave primária de `players` com chaves estrangeiras em cascata, sem ambiente de teste, é arriscado demais para o MVP. **A ponte (`raw/10` C-04):** agora, `account_id` + `login_handle` pseudônimo que substitui o e-mail na tela de login depois da 1ª Passagem; o modelo definitivo vem **antes da primeira Passagem a não-familiar**. O `raw/09` dizia "o e-mail do fundador fica como login para sempre" — isso está **errado como estado final**: e-mails morrem, e há precedente real de domínio de e-mail recomprado por estranho.
- **Quantas tabelas dependem de `players(email)`:** **6 tabelas / 7 colunas** (`characters`, `diary_entries`, `egregora_messages`, `friendships` ×2, `player_badges`, `player_stat_progress`). O `raw/09` dizia 8 e o `raw/05` dizia 5; a recontagem correta é 6/7.
- **Revogação de sessão:** `token_epoch` sobe na Investidura e em toda troca de senha, derrubando todas as sessões. **Isso conserta hoje um problema que existe independentemente do legado.**

### 9.4 A migração das ~48 contas / ~139 personagens

**"Era Zero" aditiva.** Três relatórios convergiram de forma independente — é o item mais sólido do plano.

- `pre_era_level := level` (o número antigo vira história, preservado);
- `legacy_level := 1` (o contador do legado começa do zero, porque ele mede **outra coisa**: tempo);
- cria a Linha, o Keeper nº 1 (*First Keeper*) e o evento de fundação;
- **Selo de Pioneiro** — relíquia honorífica, `transferable = false`.

**Por que não preservar o nível?** Matematicamente seria inofensivo (custaria no máximo **0,74%** do horizonte). O argumento decisivo é outro: **existem contas de teste antigas com nível inflado**, e elas largariam séculos à frente. **A régua nasceria mentindo.** A compensação emocional é o Selo de Pioneiro + horas simbólicas no Banco de Vigília + a carta pessoal (Seção 8.5).

**O roteiro do script segue o padrão que este projeto já usa** (`migrate_level_bigint.js`): **simulação por padrão** (escreve zero bytes), `--confirm` para valer, transação única, idempotente, **checksum `md5`** das colunas que não podem mudar, e `exit 1` se algo divergir. **Antes de tudo:** export JSON por conta das 48, guardado **fora do Supabase**.

**O evento de fundação grava o hash da configuração do harness** (curva, margem, `τ`) — assim a promessa fica auditável por qualquer pessoa, para sempre.

**Duas migrações escondidas (`raw/10` R-15):** trocar os valores de requisito das 333 badges e converter os 139 personagens para Rank 1–100 são migrações de produção que **nenhum roteiro previa**. Elas entram como passos do mesmo script, na Fase 5, com o mesmo padrão de checksum.

### 9.5 Paridade web + mobile

Este é o ponto onde o projeto **já se machucou**. As regras (`CLAUDE.md` §3, skill `crossplatform-deploy`):

- toda mudança em `js/game/` ou `js/web2/` é espelhada em `danger_ghost_mobile/www/js/...`, **lendo o arquivo do mobile antes** — eles não são idênticos, e copiar diff às cegas já causou bug;
- **nunca** editar os arquivos soltos na raiz de `danger_ghost_mobile/` nem o `www/` morto dentro de `danger ghost/` — são as duas pastas-armadilha;
- APK novo: `npx cap sync android` → build → copiar para **os dois lugares** → subir o `?v=NN` de cada arquivo alterado, **inclusive o link do APK**;
- **servidor primeiro** (aditivo e retrocompatível), clientes depois;
- **`MIN_CLIENT_VERSION`**: cliente antigo cai em **modo leitura** (joga, não credita, não grava XP) com link para atualizar — **nunca** derruba a conexão. E nunca ativar antes de o APK novo estar publicado e o link funcionando.

**Pendências de mobile que precisam de resposta antes da Fase 2:** o que exatamente se perde ao desinstalar/reinstalar com assinatura nova; como o WebView se comporta com o heartbeat; se o jogo é instalável como PWA; e **se a regressão do botão de pulo ainda está aberta** — um jogador que não consegue pular não gera evento de jogo qualificado, e o heartbeat do mobile é testado exatamente em cima desse controle.

### 9.6 Backup, exportação e restauração

- **Backup:** `pg_dump` diário para **dois destinos** em locais diferentes, com **teste de restauração** num Postgres vazio. Regra dura: **nenhuma migração roda sem um dump restaurado nas últimas 24 h.**
- **Réplica não é backup.** Uma réplica copia o erro junto.
- **Exportação por conta:** o jogador leva o legado dele embora — JSON com a Crônica, os fatos e os hashes, reimportável num Postgres limpo. No MVP entra a **exportação por script** das 48 contas (a rede de segurança); o endpoint público fica para a Fase 5.
- **Verificação:** `verify_chronicle.js` recomputa a corrente de hashes de todas as Linhas; um teste de restauração trimestral é registrado **na própria Crônica**.

### 9.7 Custos de escala

| Item | Faixa **[HIPÓTESE]** |
|---|---|
| Supabase pago (piso recomendado) | US$ 300/ano — o plano gratuito **pausa após ~7 dias sem atividade** e não tem backup diário |
| Backup em 2 armazenamentos + monitor | ≈ US$ 250/ano |
| Domínio (pré-pagando 10 anos) | US$ 160 uma vez, contra US$ 16/ano |
| VPS | **você informa** — provavelmente já é custo fixo |
| E-mail transacional | US$ 0–240/ano (a faixa gratuita deve bastar para 48 contas) |

**Recomendação de infraestrutura:** Supabase pago **+ réplica na VPS + exportação semanal para fora**, com o Supabase pago sozinho como piso aceitável.

---

## 10. Roadmap

*(fonte principal: `raw/11_roadmap_produtor.md` — que já fundiu os quatro roadmaps concorrentes num só)*

**Unidade usada:** um **dia de trabalho** = ~4 h de foco real seu, dirigindo os agentes. **Ritmo A** = 3 dias por semana (12 h focadas). **Ritmo B** = 5 dias por semana (20 h). Todas as estimativas de dias e de dinheiro são **[HIPÓTESE]**, com a confiança declarada.

**Dois termos:** **portão go/no-go** é uma lista de conferência no fim de cada fase — só se passa adiante se tudo estiver verde. **Modo sombra** é o servidor calcular a coisa nova **sem aplicar em ninguém**, só gravando, para comparar com o esperado. É testar o freio com o carro parado antes de descer a ladeira.

### 10.1 As 7 fases e os 6 portões

| Fase | Nome | Depende do conceito? | Dias | Confiança | Portão |
|---|---|---|---|---|---|
| **0-A** | Rede de segurança e relógios externos | **Não — vale de qualquer jeito** | 14–25 | média | **G0a** |
| **0-B** | Conta, e-mail e conformidade | **Não — vale de qualquer jeito** | 11–20 | média | **G0b** |
| **1** | Decidir e provar no papel | sim | 6–10 (quase tudo agentes) | alta | **G1 — portão do conceito** |
| **2** | Tempo autoritativo **em sombra** | sim | 15–24 + 14 dias de observação | baixa-média | **G2 — portão da sombra** |
| **3** | **MVP do Legado** e lançamento | sim | 31–51 | média-baixa | **G3 — portão de lançamento** |
| **4** | Sucessão real (a Passagem de verdade) | sim | 47–73 | baixa | **G4 — portão da 1ª Passagem** |
| **5** | Conteúdo e Arquivo (Era II, ranking, export) | sim | 36–64 | muito baixa | **G5** |
| **6** | Institucionalização (associação, licença, marca) | sim | 5–10 + terceiros | baixa | **G6** |

**Totais:** Fase 0 = **25–45 dias** · Fases 1–3 (o conceito até o lançamento) = **52–85 dias** · **MVP completo (0 a 3) = 77–130 dias.**

```
Aprovação
 ├─► Fase 0-A ──► G0a ────────────────────────────┐
 │    (Android, backup, bounds, token_epoch,      │
 │     Termos, higiene, domínio)                  ▼
 ├─► Fase 1 (papel; agentes) ──► G1 ──► Fase 2 (SOMBRA, 14 dias de observação)
 │                                                │
 ├─► Fase 0-B ── roda DENTRO da janela da sombra ─┤
 │                                                ▼
 │                                            G2 ──► Fase 3 (MVP) ──► G3  ★ LANÇAMENTO
 ├─► Trilha jurídica: advogado na semana 1 ──► Termos ──► parecer art. 9º III ──► exigido no G3
 └─► (depois do G3)  Fase 4a ─► G4 ─► 4b/4c ─► Fase 5 ─► Fase 6
```

### 10.2 Fase 0 — o que vale mesmo que você recuse o conceito

**0-A — Rede de segurança e relógios externos (14–25 dias):**

| # | Item | Prazo |
|---|---|---|
| 1 | **Corrigir os 4 comentários enganosos de `server/db.js`** e o cabeçalho de `migrate_level_bigint.js` para "EXECUTADA em \<data\>, verificada por checksum" | **esta semana** — é o mais barato do plano inteiro |
| 2 | **Backup que restaura de verdade:** `pg_dump` diário para 2 destinos + teste de restauração + inventário de acessos + **adjunto nomeado** | **antes de qualquer migração** |
| 3 | **Android:** confirmar o que se perde ao reinstalar → **gerar keystore de release** (2 cópias físicas) → **criar conta no Developer Console** e registrar o pacote + a chave → APK assinado → publicar com aviso de "desinstale e reinstale" | **31/12/2026** (faltam 102 dias) |
| 4 | **`NUMERIC_BOUNDS`:** subir `time` e `score`; pôr o teto de validação de `level` **acima** do teto de jogo (1,01e11); limite de frequência nos saves; registrar a dívida das 3 colunas `INTEGER` | antes da Fase 2 |
| 5 | **`token_epoch` + revogação de sessão** | antes da Fase 2 |
| 6 | **Termos + Política de Privacidade + aceite versionado + canal do titular** (o texto é do advogado) | **contratar o advogado na semana 1**; texto até ~nov/2026 |
| 7 | **Higiene:** trocar o texto "records… on the blockchain" do `index.html` (o jogo é 100% Web2); mascarar e-mail nos logs; revisar o CORS **testando no APK**; destruir ou cifrar o `server/game_data.db` antigo (pode ter senhas da era de texto puro) | junto com o 6 |
| 8 | **Domínio:** pré-pagar, travar, 2FA físico, monitor externo; espelho do repositório | esta semana (é 1 h sua) |

**0-B — Conta, e-mail e conformidade (11–20 dias):** e-mail transacional + verificação de endereço + "esqueci minha senha" (web e mobile); **procedimento de exclusão de conta**; um **ambiente de teste** (recomendo um segundo projeto Supabase gratuito, mais fácil que Docker para quem está aprendendo); vendorizar as 3 CDNs.

**Uma pegadinha de deploy que já custou tempo neste projeto:** o console VNC da VPS **perde o Shift**. Variáveis de ambiente novas entram **em minúsculas e sem `_`** (`emailapikey`, `hmacpepper`), e **os segredos são colados por você** — nenhum agente digita chave nenhuma.

### 10.3 Fases 1 a 3, em uma frase cada

- **Fase 1 (papel, 6–10 dias):** você responde A1–A5; o harness de Monte Carlo passa **11/11 critérios**; a tabela de sobrevivência da Linha é publicada e **você a lê antes de aprovar**; o exploit "zerar num pacote" é reproduzido **num ambiente de teste** e medido; a varredura por outros caminhos de XP em `engine.js` é feita com busca, sem ler os 220 KB; o vocabulário é revisado por um falante nativo de inglês. **Nada é construído.**
- **Fase 2 (sombra, 15–24 dias + 14 de observação):** o servidor passa a medir o tempo e calcular o nível do legado **sem aplicar em ninguém**, até os números baterem por duas semanas. Nove testes numerados (T1 a T9), incluindo "uma sessão atravessando a virada de UTC **não** rende 2 h" e "um pacote com `level: 1e11` **não** move o nível de sombra".
- **Fase 3 (MVP, 31–51 dias):** liga o autoritativo; Nível de Combate logarítmico; Linha + Keeper nº 1 + Crônica **só com eventos automáticos**; **Era Zero** com checksum e carta às 48; HUD do legado (Dia N, Selo, Anel, Era, Fecho do dia, "The Long Road"); **Interlude**; designação de Herdeiro + Chave do Legado + `commons_optin`; salvaguardas jurídicas mínimas + kill-switch + Modo Aprendiz; APK assinado + `MIN_CLIENT_VERSION`. **A Passagem real ainda não existe por interface** — se acontecer no ano 1, é assistida por você, por script.

### 10.4 O MVP: o que entra e o que fica de fora

> **Em uma frase:** *o servidor mede o tempo (`τ = 0`); a curva foi provada em simulação; as 48 contas viram Linhas na Era Zero; a Crônica registra só eventos automáticos; a Linha pode designar um Herdeiro e guardar a Chave — mas a Passagem real espera o G4.*

Ele entrega as três sensações: **"meu dia tem fecho"**, **"estou numa estrada de séculos e vejo o mapa"**, **"isto pode passar para alguém"**.

| Fica de fora do MVP | Vai para | Gatilho de entrada |
|---|---|---|
| Texto livre na Crônica (epitáfio, Carta ao Herdeiro) | Fase 4b | parecer sobre consentimento + 2 moderadores |
| Passagem por interface (resgate, Vigília, Investidura, MFA) | Fase 4a | pilotos, ou uma família real querendo passar |
| Escada de dormência automática | Fase 4a | precisa do e-mail; **prazo derivado: antes do 1º Sinal, ~6 meses após o lançamento** |
| Era II completa | Fase 5 (≤ 6 meses) | — |
| Migração das 333 badges e dos 139 personagens | Fase 5 | decisão B12 + roteiro com checksum |
| Ranking, Mapa do Céu, Hall | ano 2 | 100 Linhas ativas |
| Export por endpoint | Fase 5 | (o export **por script** das 48 entra no MVP) |
| `τ > 0` | — | parecer escrito + antibot no ar |
| Keystone / "zerar" | **não existe código** | é um invariante do banco, não uma feature |

### 10.5 Os 11 itens que NÃO podem ser cortados

| # | Item | Se cortar |
|---|---|---|
| N1 | Integridade do tempo **antes de anunciar** | a régua vira sugestão; você anuncia uma promessa que qualquer um zera |
| N2 | Harness 11/11 com as constantes realmente implantadas | erro de premissa custa séculos e só aparece em simulação |
| N3 | Sombra de 14 dias | é a única forma de achar divergência sem afetar 48 jogadores reais |
| N4 | Backup **restaurado** ≤ 24 h + adjunto nomeado + acessos em custódia | *bus factor* 1 |
| N5 | Era Zero aditiva com checksum + export prévio fora do Supabase + carta às 48 | perda irreversível, ou backlash que mata a comunidade inicial |
| N6 | Regra de hash com vetores JS = Python **antes do 1º evento** | é a única decisão sem conserto |
| N7 | Termos + Política + exclusão + parecer sobre o art. 9º III antes de menores na régua | risco regulatório real, com fiscalização em curso |
| N8 | `MIN_CLIENT_VERSION` + APK assinado com chave de release | APK velho mandando XP no formato antigo; assinatura debug não sobrevive a 2027 |
| N9 | Invariantes de longo prazo (teto de validação 1,01e11; nenhuma Keystone antes de 3147; Crônica sem dado pessoal; relíquias não transferíveis; `credit_adjustment`; segundos como dado primário) | baratos agora, impossíveis depois |
| N10 | Comunicação honesta: anunciar só após o G3; **não** dizer "testada" antes do G4 | promessa lida como garantia vira sensação de fraude |
| N11 | Interlude + carta às 48 | parede de conteúdo no dia ~33 e "reset" mal comunicado são os dois riscos de primeira impressão |

### 10.6 O que NÃO construir agora

Eras III–X · o Coro e o Monumento jogável · **a blockchain própria** (o papel honesto é carimbar 32 bytes; testemunhas baratas já resolvem) · a Keystone · Mapa do Céu e Hall · temporadas (nenhuma até o ano 3) · PvP · Reforge e Óleo da Lanterna (entram com a 1ª Passagem) · Era Packs abertos a terceiros · **`τ > 0`** · convites de retorno · **qualquer mercado ou venda de conta** · ofuscação de cliente e CAPTCHA (explicitamente **nunca**) · as duas migrações escondidas · a fundação com fundo patrimonial · `xp_total NUMERIC(40,0)` (só faz sentido se o nível vier do XP).

### 10.7 Calendário e capacidade

| Fase | Dias | **Ritmo A** (3 d/sem) | **Ritmo B** (5 d/sem) |
|---|---|---|---|
| 0-A | 14–25 | 5–8 sem | 3–5 sem |
| 0-B | 11–20 | 4–7 sem | 2–4 sem |
| 1 | 6–10 | 2–4 sem | 1,5–3 sem |
| 2 | 15–24 + sombra | 5–8 sem (+2 sobrepostas) | 3–5 sem |
| 3 | 31–51 | 10–17 sem | 6–10 sem |
| **MVP (0–3)** | **77–130** | **≈ 6–10 meses** | **≈ 3,5–6 meses** |
| 4 | 47–73 | 16–24 sem | 9–15 sem |
| 5 | 36–64 | 12–21 sem | 7–13 sem |

**Relógios externos [CÁLCULO]:** hoje → 31/12/2026 = **102 dias (14,6 semanas)**. A Fase 0-A cabe antes disso nos dois ritmos. Antes de 01/11/2026, só cabe no Ritmo B — por isso o advogado e os Termos saem primeiro dentro da 0-A.

**Caminho crítico:** decisões A1–A5 → harness 11/11 → tempo autoritativo → 14 dias de sombra → hash + Era Zero + HUD → G3. **Fora do caminho crítico** (podem escorregar sem atrasar o lançamento): Android (mas tem prazo próprio), vocabulário, textos de Eras, a Fase 5 inteira.

**O achado de capacidade que nenhum relatório tinha feito:** o **primeiro ano depois do lançamento** pede **104–158 dias** de trabalho (sucessão real + Era II + arquivo + rituais) contra uma capacidade de **156 dias/ano** no Ritmo A. Cabe **só no limite**. Decisão de produção: **a Era III sai do ano 1**, e o **Interlude** (a regra "o progresso nunca trava por falta de conteúdo") entra no MVP.

**Um achado de calendário que vale ouro:** com `τ = 0`, a Era I (33 h) acaba no **dia 33** de quem joga 1 h/dia. Sem Era II pronta, o jogador bate na parede em pouco mais de um mês. O **Interlude** — rejogo livre das 33 fases + overworld, com o contador avançando e as Eras seguintes visíveis mas trancadas — é o que impede isso, e custa pouco.

### 10.8 Os três pontos sem volta

1. **A regra de hash da Crônica**, a partir do primeiro evento gravado.
2. **O anúncio público** — a promessa de 1.121 anos não se retira; e a primeira âncora externa da Crônica vem junto.
3. **A troca de assinatura do APK.**

Tudo o mais é aditivo e reversível voltando o código.

### 10.9 Custos [HIPÓTESE]

| Item | Faixa — 1º ano |
|---|---|
| Supabase pago | US$ 300/ano |
| Backup em 2 armazenamentos + monitor | ≈ US$ 250/ano |
| Domínio (10 anos pré-pagos) | US$ 160 uma vez |
| E-mail transacional | US$ 0–240/ano |
| Android Developer Console | US$ 0–25 (taxa não confirmada) |
| **Advogado / DPO / contador** | **R$ 5.000–20.000 (US$ 900–3.600)** — **é o maior item.** Peça orçamento fechado por escopo |
| Revisão do vocabulário por nativo de inglês | R$ 300–1.000 |
| **Total ano 1** | **≈ US$ 1.600–4.600 (R$ 9.000–25.000)** |

**Recorrente depois:** ~US$ 570–810/ano + jurídico. **Piso de sobrevivência** (arquivo em N3/N4): ~US$ 250/ano.

**E o custo que mais importa:** **310–520 horas suas** no MVP.

---

## 11. Riscos — os 10 que mais pesam, em linguagem simples

| # | Risco | O que reduz |
|---|---|---|
| **1** | **A corrente arrebenta muito antes de 3147.** Para uma Linha atravessar ~45 trocas de Guardião, **menos de 1,5% delas pode falhar**. Nenhuma família consegue isso sozinha. Com 90% de sucesso por troca, uma Linha chega em **0,87%** dos casos, e a chance de **alguma** das 48 contas de hoje chegar é de **~34%** **[CÁLCULO]** | **o Commons** — é a única mecânica que aumenta essa probabilidade de verdade, porque converte "não tinha herdeiro" em troca de Guardião. E **volume**: para 50% de chance de alguma Linha chegar, com 90% por troca, seriam necessárias **~80 Linhas fundadoras**; para 95%, **~342** |
| **2** | **Hoje qualquer jogador zera o jogo de 1.121 anos em um pacote de rede** **[VERIFICADO]** | tempo autoritativo antes de anunciar (N1) |
| **3** | **O jogo depende de uma pessoa só.** Se você sumir, somem a chave do app, o domínio, o acesso ao banco e o segredo de sessão | adjunto nomeado + backup restaurado, **antes de anunciar** |
| **4** | **A lei brasileira, lida ao pé da letra, chama a régua de "recompensa pelo tempo de uso"** **[VERIFICADO]** | `τ = 0` + as 12 salvaguardas + parecer escrito + kill-switch |
| **5** | **Este é o conceito de jogo com maior potencial de chantagem emocional que se pode desenhar:** culpa familiar + aversão à perda + horizonte infinito | o "se assim quiser" como cláusula constitucional, e uma revisão de texto, tela por tela. **A diferença entre legado e corrente é inteiramente de execução** |
| **6** | **Mais de 91% do contador acontece depois do ano 500.** Você, seus filhos e seus netos são uma fração invisível do número | as **Eras** e o **Capítulo do Keeper**: ninguém precisa do 1e11 para ter terminado alguma coisa. Se não houver resposta pronta para "eu sou 0,0x%", o conceito perde o fundador antes de perder o herdeiro |
| **7** | **A distribuição do app é frágil por motivos que não têm nada a ver com o legado.** APK do site, assinado com chave de teste, e o Android exigindo desenvolvedor registrado a partir de 2027 | resolver **agora** custa pouco; depois custa muito |
| **8** | **Faltar um dia a cada vinte custa 60 anos; um a cada dez, 125** **[CÁLCULO]** | a promessa vira "365 horas por ano, quando der", com margem embutida. A régua literal não sobrevive a um ser humano |
| **9** | **Uma escolha errada no primeiro dia não tem conserto: a fórmula de hash da Crônica** | vetores de teste em duas linguagens antes do primeiro evento |
| **10** | **O custo em horas.** 310–520 h no MVP, num projeto de uma pessoa. Adoecer, mudar de emprego ou perder o interesse por dois meses **é o cenário base**, não a exceção | portões com "retirada honrosa": a Fase 0 sobrevive sozinha, a sombra sobrevive sozinha, o MVP é reversível |

---

## 12. Matriz de lacunas — as 12 do checklist do brief

Status honesto. **FECHADA** = resolvida, com dono e resposta. **FECHADA COM DECISÃO PENDENTE** = a resposta existe e está recomendada, mas depende do seu "sim". **ABERTA** = ainda falta trabalho de verdade — e eu digo quanto.

| # | Lacuna do brief | Status | Onde está resolvida | O que ainda depende de você |
|---|---|---|---|---|
| **1** | Definição de "jogo legado" + princípios + vocabulário | **FECHADA COM DECISÃO PENDENTE** | Seção 1; `raw/01` | O vocabulário **não foi revisado por falante nativo de inglês** — é a última pendência real desta lacuna, e é barata (R$ 300–1.000, 1 tarefa). Sem isso, não trave termos |
| **2** | Calibração matemática | **FECHADA COM DECISÃO PENDENTE** | Seção 2; `raw/02` corrigido por `raw/10` | A6 e principalmente **A1, A2, A3, A5**. E o harness precisa **passar 11/11 na Fase 1** — com `m = 1,00` ele **reprova** hoje |
| **3** | Precisão numérica e limites por 1.100+ anos | **FECHADA** | Seção 2.6 | Nada. Três achados novos entraram (teto exclusivo do `level`, colunas `INTEGER` antigas, espelhar a formatação de números grandes no mobile) e todos têm dono e fase |
| **4** | Mecânica de sucessão | **FECHADA COM DECISÃO PENDENTE** | Seção 4; `raw/03` | A9, B5, B6, B7, B19. **E uma dependência dura:** sem e-mail transacional (Fase 0-B) a escada de dormência inteira é letra morta |
| **5** | Integridade do tempo de jogo | **FECHADA COM DECISÃO PENDENTE** | Seção 5; `raw/05` | A3, A4, A5. **Duas coisas ainda não feitas de verdade:** o exploit não foi **reproduzido** (só lido no código), e a varredura exaustiva por outros caminhos de XP em `engine.js` não foi feita. As duas são item da Fase 1 |
| **6** | Conteúdo e motivação por ~409.000 h | **FECHADA** | Seção 3; `raw/07` | A contradição entre curva suave e curva por partes foi resolvida (Eras ancoradas em tempo). A parede de conteúdo no dia ~33 foi achada e resolvida pelo Interlude |
| **7** | Durabilidade 1.100+ anos | **FECHADA COM DECISÃO PENDENTE** | Seção 6; `raw/04` | A11, C16, C17, C18, C19. **Hoje o teste dos 50 anos dá 0 "sim", 3 "parcial", 7 "não"** — cada "não" virou item com dono e data, mas nenhum foi feito ainda |
| **8** | Jurídico / ética / privacidade | **FECHADA COM DECISÃO PENDENTE**, e é a que mais depende de terceiros | Seção 7; `raw/06` | A8, B16, B17, B18, B20 — **e o parecer escrito do advogado, que você não controla o prazo**. Quatro conflitos internos foram resolvidos aqui (adoção, convites, exclusão × chave estrangeira, hash de e-mail) |
| **9** | Migração das 48 contas / 139 personagens | **FECHADA** | Seção 9.4 | A7. Três relatórios convergiram de forma independente — **é o item mais sólido do plano**. Só falta escolher (a recomendação é Era Zero) |
| **10** | Interação com sistemas existentes | **FECHADA COM DECISÃO PENDENTE** | Seção 3.5 | B1, B12, B13, B14. **Três pontos ainda frouxos, e eu digo:** (i) o ranking por geração tinha três desenhos e agora tem uma separação em camadas, mas **ninguém implementou nem estimou**; (ii) batalhas ghost-vs-ghost só foram propostas, nunca dimensionadas; (iii) **ninguém estimou em dias a normalização do combate e a rebalanceada da Era I** — é o item mais subestimado do plano, e o `game-designer` precisa dar essa estimativa **no portão G1** |
| **11** | Riscos, testes, critérios de aceite, reversão | **FECHADA COM DECISÃO PENDENTE** | Seções 10 e 11 | **Duas coisas honestamente incompletas:** o harness **reprova** nos critérios 1 e 2 na calibração sem margem (é o portão da Fase 1 justamente por isso), e **ninguém escreveu ainda a suíte de aceite ponta-a-ponta do tempo autoritativo** contra o banco real com conta descartável. O `qa-lead` tem essa tarefa, e ela é pré-requisito do G2 |
| **12** | Roadmap faseado + lista de decisões | **FECHADA** | Seções 10 e 13 | Existiam **quatro roadmaps concorrentes e nenhum era o roadmap**. Agora existe um, com as dependências cruzadas declaradas, e o item do Android absorvido |

**Placar: 4 FECHADAS, 8 FECHADAS COM DECISÃO PENDENTE, 0 ABERTAS.** Nenhum item ficou sem dono.

**Mas seja justo com a palavra "fechada".** Fechada quer dizer *"tem resposta escrita, com dono, fase e critério de aceite"* — **não** quer dizer *"está provada em produção"*. Quatro coisas continuam pendentes e eu não vou maquiar:

1. o exploit "zerar num pacote" **não foi reproduzido**;
2. a varredura exaustiva de `engine.js` **não foi feita** (220 KB, e a regra do projeto desaconselha ler inteiro);
3. **nenhum achado foi conferido contra o banco de produção** — o brief proibia, e isso foi respeitado;
4. o texto integral do Decreto 12.880 **não foi lido na fonte primária**.

Pelo padrão de rigor deste próprio projeto, **um achado não reproduzido é uma hipótese com boa evidência, não um fato.**

---

## 13. Checklist de aprovação

> **Como usar:** leia a pergunta, escolha **a letra**. A coluna "recomendo" é a resposta consolidada da auditoria. Se concordar com todas, basta dizer **"aprovo todas as recomendadas"**.
>
> **Duas leituras obrigatórias antes de responder:** (1) a tabela de sobrevivência da Linha — Seção 11, risco 1; (2) o custo em horas — Seção 10.9 e Seção 0.8.
>
> **Sugestão de duas reuniões:** responda **A10, A11 e A1–A5 agora** (destravam as Fases 0, 1 e 2). **A6–A9 podem esperar até o portão G2** — ninguém grava Crônica, migra conta nem toca em menor antes disso, e você já terá visto a sombra funcionando. Se preferir responder as 11 de uma vez, cada uma já vem com a recomendação.

### 13.1 As 11 decisões BLOQUEANTES

---

**A1 — Qual o formato da curva de nível?**
- (a) linear, tipo odômetro puro · **(b) polinomial suave** `L*(H) = 20·H + (1e11−20T)(H/T)³` · (c) por partes, uma cadência por Era
- **Recomendo (b)**, com as Eras ancoradas em **tempo creditado**, não em nível.
- **Consequência de (b):** dia 1 = nível 20, ano 1 = 7.371, e a data fecha exata. Nunca há um dia pior que o anterior. **Consequência de (a):** o dia 1 ficaria absurdo ou o fim ficaria parado. **Consequência de (c):** a cadência salta 6,3× de um dia para o outro, e um Keeper típico nunca veria uma virada de Era — e o problema que (c) tentava resolver **deixa de existir** quando as Eras são ancoradas em tempo.
- **Trava:** a Fase 2.

---

**A2 — O que exatamente "3147" promete?**
- (a) "1 hora todo dia, sem falta" · **(b) "cerca de 365 horas por ano, quando der"**, com margem de presença `m ≈ 0,90` · **(c) cada Linha tem a própria estrada; 3147 é a data de quem começa agora**
- **Recomendo (b) e (c) juntos.** E o que espera pelo calendário é a **Keystone**, não o contador.
- **Consequência de (a):** a promessa nasce quebrada — nenhum ser humano joga todo santo dia por décadas, e faltar 1 dia em 20 já joga a chegada para 3207. **Consequência de (b)+(c):** a promessa é cumprível e verificável, e uma Linha fundada em 2100 chega por volta de 3221, honestamente.
- **Trava:** a Fase 1 (é o que o harness tem que provar).

---

**A3 — Quanto uma hora extra no mesmo dia deve render?**
- **(a) nada (`τ = 0`)** — teto duro com banco de reposição · (b) 10% · (c) 20%
- **Recomendo (a) no lançamento**, subindo só depois do parecer jurídico escrito e do antibot no ar.
- **Consequência de (a):** todos os arquétipos levam 1.121 anos; o bot 24/7 ganha o mesmo que um humano de 1 hora; e a defesa jurídica ("passou de 1 hora, o ganho é zero") é **literalmente verdadeira**. **Consequência de (b)/(c):** uma Linha que automatiza termina ~780 anos antes das outras, e a defesa jurídica deixa de ser verdadeira. **E lembre da assimetria: subir `τ` depois é generosidade; baixar é punição retroativa.**
- **Trava:** a Fase 1.

---

**A4 — O nível do legado vem do XP do cliente ou do tempo medido pelo servidor?**
- **(a) tempo creditado pelo servidor** · (b) XP, com combate validado no servidor
- **Recomendo (a).** É a decisão de maior alavancagem do plano inteiro, e três relatórios chegaram a ela sozinhos.
- **Consequência de (a):** o cliente adulterado vira irrelevante para a régua; a data fecha por construção; o contador de segundos nunca chega perto de nenhum limite numérico. **Consequência de (b):** significaria reescrever combate, dano, loot e colisão no servidor — um projeto de anos, não de meses.
- **Trava:** a Fase 2.

---

**A5 — A régua é da pessoa ou da Linha?**
- **(a) da Linha** — uma família revezando a conta joga como uma pessoa · (b) da pessoa
- **Recomendo (a).**
- **Consequência de (a):** coerente com o conceito ("a conta é o artefato herdado"), resolve o revezamento familiar **que é exatamente o caso de uso que você descreveu**, e neutraliza a Linha que automatiza. O teto passa a ser por Linha, e os Termos dizem isso. **Consequência de (b):** exigiria distinguir uma família de uma fazenda de bots — o que é impossível na prática.
- **Trava:** a Fase 1. *(Nenhum dos nove relatórios tinha listado isto como decisão.)*

---

**A6 — Qual a regra de hash da Crônica?** ⚠️ **sem volta depois do primeiro evento**
- (a) a concatenação do `raw/09` · (b) a do `raw/05` · **(c) JSON canônico RFC 8785 + prefixo de versão, do `raw/04`**
- **Recomendo (c).** É a única que foi **testada** em vez de proposta — e a (a) **comprovadamente colide**.
- **Consequência de errar:** consertar depois **invalida todos os registros já feitos**. Não há migração possível.
- **Trava:** a Fase 3, antes do primeiro evento gravado.

---

**A7 — O que acontece com os ~139 personagens atuais?**
- (a) preservar o nível · (b) remapear por tempo · **(c) "Era Zero" + Selo de Pioneiro**
- **Recomendo (c).** Três relatórios convergiram.
- **Consequência de (c):** o nível antigo é preservado como história (`pre_era_level`), o contador do legado começa em 1 porque mede outra coisa, e as 48 contas viram os **Primeiros Guardiões**. Custo emocional real, coberto pela carta pessoal e pelo Selo. **Consequência de (a):** matematicamente inofensivo (0,74% do horizonte), **mas** as contas de teste antigas com nível inflado largariam séculos à frente — e a régua nasceria mentindo.
- **Trava:** a Fase 3.

---

**A8 — Menores de idade entram na régua?** *(exige parecer escrito)*
- **(a) sim, com as 12 salvaguardas e kill-switch** · (b) só maiores de 18 · **(c) "Aprendiz"**: joga tudo, sem crédito de tempo até os 18
- **Recomendo (a), com (c) pronto como plano B — e (c) como padrão provisório até o parecer chegar.**
- **Consequência:** um aviso "18+" **não** afasta a lei (jogos têm presunção de "acesso provável" por menores). (b) empobrece o jogo sem eliminar o risco. (c) é reversível e barato.
- **Trava:** a Fase 3 (kill-switch e campo de idade).

---

**A9 — Uma Linha sem herdeiro pode ser adotada por um estranho?**
- **(a) sim, mas só com opt-in do Guardião**, perguntado obrigatoriamente na Investidura · (b) sim, automaticamente após 5 anos · (c) não, vira Monumento
- **Recomendo (a).**
- **Consequência que nenhum relatório tinha visto:** **o Commons é o que torna o conceito viável.** Sem ele, a chance de qualquer Linha chegar a 3147 é da ordem de um terço, na hipótese otimista. **Consequência de (b):** adotar sem consentimento **mexe na definição do conceito** (a condição C4 cai, e o objeto vira conta reciclada). Você pode escolher (b) — mas precisa saber que está mudando o que o jogo é. **Consequência de (c):** Linhas ricas morrem com o Guardião e ninguém as herda.
- **Trava:** a Fase 3 (o campo) e a Fase 4c (a mecânica).

---

**A10 — Android: registrar-se como desenvolvedor e criar uma chave de release?** *(vale sem o conceito)*
- **(a) registrar + chave de release própria, em custódia** · (b) conta de distribuição limitada (20 aparelhos) só para testadores, com a web como caminho principal · (c) tirar o APK do site
- **Recomendo (a) até 31/12/2026, com (b) em paralelo.**
- **Consequência:** a onda de 30/09/2026 atinge só lojas; o APK do site é atingido pelo **rollout global de 2027**. A chave de release tem que existir **antes** do registro e ter **duas cópias físicas** — perdê-la depois de registrada significa não conseguir mais atualizar o app, e isso é irreversível. A troca de assinatura é um **evento de migração de dados**, não um upload.
- **Trava:** a Fase 0-A. **Agora.**

---

**A11 — Existe hoje um backup verificado e uma segunda pessoa com acesso?**
- **(a) dump diário verificado para 2 destinos + adjunto nomeado, antes de qualquer migração** · (b) só antes da primeira migração · (c) confiar no backup do Supabase
- **Recomendo (a).**
- **Consequência:** hoje o *bus factor* é 1 e nenhum backup foi encontrado. O plano gratuito do Supabase pausa após ~7 dias sem atividade e não tem backup diário. **Nenhuma promessa de séculos é honesta antes disto** — e nomear o adjunto é pré-requisito de **anunciar**, não de construir.
- **Trava:** a Fase 0-A. **Agora.**

---

### 13.2 As IMPORTANTES, por fase

Cada uma com a recomendação; detalhes em `raw/10` §(e)(B).

| # | Pergunta | Recomendo | Quando |
|---|---|---|---|
| **B1** | O nível gigante entra nas fórmulas de combate? | **"Nível de Combate" logarítmico** `100·log₁₀(1+L)` — sem ele o dano chega a ~1,4e8 no ano 1 | Fase 3 |
| **B2** | O e-mail de login muda quando o herdeiro assume? | `login_handle` agora; modelo definitivo antes da 1ª Passagem a não-familiar | Fase 3/4 |
| **B3** | Web + mobile ao mesmo tempo | **bastão de crédito** (uma credita, a outra avisa) — nunca derrubar em silêncio | Fase 2 |
| **B4** | Revogação de sessão (`token_epoch`) | **sim, na Fase 0-A** — conserta um problema que já existe hoje | Fase 0-A |
| **B5** | Prazos de dormência | a tabela única: Sinal 180 d · aviso ao Heir 270 d · Dormente 365 d · Resguardo 730 d · Vigília 30 d | Fase 4a |
| **B6** | Como a conta muda de Guardião | **só três caminhos:** Ritual, Cofre, ordem judicial. Sem quarto caminho | Fase 4a |
| **B7** | Chave do Legado em papel | **obrigatória** — 24 palavras, 2 cópias, só o `SHA-256` guardado | Fase 3 |
| **B8** | MFA (código de 6 dígitos) | **obrigatório para Keepers a partir da 1ª sucessão** — não antes (afastaria jogador novo) | Fase 4a |
| **B9** | Fraude descoberta muito depois | **Selo de Contestação** (nada apagado, correção registrada) como padrão, via **ajuste datado** | Fase 2 (modelagem) |
| **B10** | Publicar a "cabeça" da Crônica | semanal, em **≥ 3 testemunhas, ≥ 2 independentes de você** | Fase 5 |
| **B11** | O que "zerar" significa | a **Linha** se aposenta com honra; mundo e demais Linhas continuam; Keystone conjunta em caso de empate | design agora, código nunca |
| **B12** | Ghosts secundários | Rank 1–100 no Jogo Livre, **sem crédito de horas** — atenção: é uma migração dos 139 personagens | Fase 5 |
| **B13** | Power creep por Era no equipamento | **não** — itens por razão, com Selo de Era e Reforge | Fase 3/5 |
| **B14** | Relíquias e bônus de linhagem | **honoríficas e não transferíveis.** Relíquia com poder é item negociável | Fase 3 |
| **B15** | Infraestrutura de longo prazo | Supabase pago + réplica na VPS + export semanal fora. **Réplica não é backup** | Fase 0-A |
| **B16** | Natureza da conta nos Termos | **licença + Passagem oficial.** "Propriedade" cria valor e abre a porta para venda de contas | Fase 0-A |
| **B17** | Padrão de privacidade da Crônica | **zero dado pessoal**, como padrão global — resolve LGPD e GDPR de uma vez | Fase 0-B |
| **B18** | Anti-RMT | **estrito**: designação ≥ 30 d, guarda mínima 180 d, atestado de gratuidade, sanção com apelação | Fase 3 |
| **B19** | Menor como herdeiro | **Adulto Responsável** + escada pausada (Reserva) até ele poder aceitar | Fase 4c |
| **B20** | Idioma dos Termos | **PT-BR autoritativo + tradução EN** | Fase 0-A |

### 13.3 As que podem esperar

Uma linha cada; o detalhe está em `raw/10` §(e)(C).

**C1** travar o vocabulário só **depois** da revisão por nativo de inglês · **C2** 10 Eras, ancoradas em tempo · **C3** Era I com 1 fase por hora creditada, rejogo livre · **C4** escada das 333 badges vira Marcos de Dígito (é migração) · **C5** duas moedas: Score + Óleo da Lanterna · **C6** PvP futuro com Nível de Batalha fixo · **C7** Coro e Monumento desenhados agora, implementados só na Era VIII · **C8** moldura narrativa só com canon; **E3 desaconselhado** · **C9** Legacy Day no aniversário da Fundação, Roll Call em 21 de junho · **C10** eventos dão só memória, nunca XP/nível/item · **C11** nenhuma temporada até o ano 3 · **C12** placares públicos sem nível e sem horas exatas por 3–5 anos · **C13** rotular o chat MQTT como "public, unmoderated" e não hospedar ritual nele · **C14** contador "Dia N de 409.538" + página "Saúde do Legado" · **C15** licença AGPL-3.0 + CC BY-SA 4.0, depois de auditoria de titularidade, **nunca fechado sem escrow** · **C16** trilha jurídica escalonada: adjunto → associação → fundação · **C17** financiar primeiro o piso (N3/N4) · **C18** domínio: pré-pagar 10 anos, travar, 2FA físico, monitor externo · **C19** blockchain própria só depois dos critérios e do G6 — e o papel honesto é carimbar 32 bytes · **C20** 2 Lookouts no ano 1, Scribes no ano 2, rodízio de 2 anos · **C21** bot/IA **não** pode ser Keeper; IA auxiliar aparece **marcada como IA**, a mesma regra do `Agent G [IA]`.

**Mais cinco, do produtor:** **P1** qual é o seu ritmo real (3 ou 5 dias/semana) — muda o calendário inteiro · **P2** fazer a Fase 0 mesmo se o conceito for recusado (recomendo **sim, começar esta semana**) · **P3** tamanho do MVP (recomendo o enxuto) · **P4** quando anunciar (recomendo **só após o G3**) · **P5** quem é o adjunto — **eu preciso que você nomeie uma pessoa**, nenhum agente escolhe pessoas.

### 13.4 Como aprovar

**Para autorizar a Fase 0** (o que vale mesmo que você recuse o conceito), responda:

> *"Aprovo a Fase 0. A10: (a). A11: (a). B4: sim. B16: (a). B20: (a). C18: sim. P2: (a). Meu adjunto é \<nome\>. Meu ritmo é \<3 ou 5 dias/semana\>."*

Isso libera: corrigir os comentários do `db.js`, montar o backup com teste de restauração, resolver o Android antes de 31/12, arrumar os tetos numéricos, ligar a revogação de sessão, contratar o advogado e cuidar do domínio. **Nada disso constrói o Jogo Legado** — tudo conserta o jogo que já está no ar.

**Para autorizar o restante** (Fases 1 a 3, até o lançamento), responda também:

> *"Aprovo o conceito. A1: (b). A2: (b)+(c). A3: (a). A4: (a). A5: (a). Autorizo os três levantamentos somente-leitura. A6–A9 decido no portão G2."*

Os três levantamentos são consultas **só de leitura** ao banco, que os agentes pediram e não podem fazer sem a sua autorização: a distribuição de níveis das 48 contas e 139 personagens, os valores atuais da coluna `time`, e os dias jogados nos últimos 90 dias. E você precisa dizer **quais contas são de teste**.

**Se você concordar com tudo o que está recomendado**, basta: ***"Aprovo a Fase 0 e o conceito, com todas as recomendadas. Adjunto: \<nome\>. Ritmo: \<A ou B\>."***

**E se você quiser recusar o conceito**, a saída limpa é: *"Aprovo só a Fase 0."* Nada se perde — o roadmap foi desenhado exatamente para que essa resposta seja possível sem desperdício.

---

## 14. Anexos

### 14.1 Índice dos relatórios de origem

Todos em `danger ghost/docs/legacy-plan/raw/`.

| Arquivo | Autor | Em uma linha |
|---|---|---|
| `00_BRIEF.md` | MP | O seu pedido verbatim, as restrições inegociáveis e o checklist de 12 lacunas |
| `01_filosofia.md` | `legacy-philosopher` | Definição formal, 5 condições, 10 princípios com fonte verificada, vocabulário, 6 modos de falha ética |
| `02_calibracao.md` | `progression-actuary` | A curva, a definição da hora, o orçamento diário, sensibilidade, precisão numérica, Monte Carlo |
| `03_sucessao_cronica.md` | `legacy-systems-designer` | Papéis, 7 estados, a Passagem, a Crônica em camadas, UX do herdeiro, 30 casos de estresse, o fim de jogo |
| `04_durabilidade.md` | `deep-time-archivist` | N1–N4, sucessão do operador, o Arquivo, formatos, limites técnicos, teste dos 50 anos, financiamento |
| `05_integridade_antiabuso.md` | `security-engineer` | Auditoria do XP de hoje, tempo autoritativo, 14 vetores de abuso, a Chave do Legado, anti-RMT |
| `06_juridico_privacidade.md` | `digital-succession-counsel` | Decreto 12.880, 12 salvaguardas, LGPD × Crônica, menores, herança digital, entidade |
| `07_conteudo_eras_economia.md` | `game-designer` + `level-designer` + `game-economy-designer` | 10 Eras, a hora de 4 Movimentos, escala dos sistemas, economia, o fim de jogo jogável |
| `08_liveops_comunidade_narrativa.md` | `live-ops` + `community-manager` + `narrative-designer` | Moldura no lore canônico, extensões E1–E5, rituais, papéis de comunidade, textos prontos, o Encerramento |
| `09_arquitetura_migracao.md` | `backend-architect` | 9 tabelas, o fluxo autoritativo, sucessão técnica, migração Era Zero, backup, custo em escala |
| **`10_auditoria_adversarial.md`** | `forensic-analyst` | **16 contradições com veredito, 25 cenários de red team, 42 decisões deduplicadas, 23 correções — manda sobre os outros nove** |
| `11_roadmap_produtor.md` | `producer` | 7 fases, 6 portões, MVP, 11 itens não cortáveis, calendário, capacidade, custos, checklist da reunião |

### 14.2 Glossário curto

| Termo | O que é |
|---|---|
| **Régua** | A sua promessa: 1 h/dia ⇒ nível 1e11 em 3147 |
| **Linha (Line)** | A conta + a corrente de pessoas que a seguraram. **É a unidade do conceito** |
| **Odômetro** | O número do nível, tratado como contador gigante |
| **Tempo autoritativo** | O servidor mede o tempo; o cliente não tem voto |
| **Banco de Vigília** | O mecanismo do teto diário, com reposição de dias perdidos |
| **`τ` (tau)** | Quanto rende a hora extra no mesmo dia. `τ = 0` = não rende nada |
| **Monte Carlo** | Rodar a simulação centenas de vezes com sorteios diferentes, para ver a distribuição e não só a média |
| **Harness** | O banco de testes automatizado da calibração |
| **Modo sombra** | Calcular sem aplicar, só gravando, para comparar |
| **Portão go/no-go** | Lista de conferência no fim de cada fase; é o freio de mão do projeto |
| **Hash / cadeia de hash** | Uma "impressão digital" de um texto; cada entrada carrega a da anterior, então mexer no passado quebra tudo daí para frente |
| **RFC 8785 (JCS)** | Uma regra padronizada de escrever JSON sempre igual, para que o hash sempre bata |
| **`token_epoch`** | Um contador que, ao subir, invalida todas as sessões abertas |
| **Sideload** | Instalar um app Android fora de loja, por arquivo `.apk` |
| **Keystore / chave debug** | A chave que assina o app. A *debug* é gerada automaticamente pela máquina e não é um segredo custodiado |
| **RMT** | *Real-money trading*: vender conta ou item por dinheiro de verdade |
| **LGPD / ECA Digital / ANPD** | A lei de proteção de dados; a lei de proteção de menores no digital; a agência que fiscaliza |
| **Dark pattern** | Truque de interface feito para você fazer algo que não faria pensando com calma |
| **Bus factor** | Quantas pessoas precisam sumir para o projeto morrer. Hoje: 1 |

### 14.3 Fontes-chave verificadas

- **Android:** `developer.android.com/developer-verification` (datas, países, escopo de lojas, conta de distribuição limitada, rollout global de 2027), mais imprensa técnica para o efeito prático sobre sideload.
- **Decreto nº 12.880, de 18/03/2026** (art. 9º, parágrafo único, I–IV) — lido no portal da Câmara (Legin) e confirmado por fontes secundárias convergentes; **o Planalto recusou conexão** nas tentativas de dois agentes.
- **Lei nº 15.211/2025 (ECA Digital)** — sancionada em 17/09/2025, em vigor desde 17/03/2026; escopo de "acesso provável"; cronograma de fiscalização da ANPD.
- **Filosofia e cultura:** Jefferson a Madison (06/09/1789); Burke, *Reflections* (1790); Paine, *Rights of Man* (1791); Jonas (1979/1984); Parfit (1984); Brand, *The Clock of the Long Now* (1999); Ise Jingu (62ª reconstrução em 2013, 63ª em 2033); Plutarco; Sagrada Família (torre central concluída em 20/02/2026); Kongō Gumi (absorvida em 2006); Camus (1942); Erikson; Scheffler (2013); Deci & Ryan.
- **Herança digital:** STJ REsp 2.124.424 (26/09/2025); ANPD Nota Técnica 3/2023; PL 4/2025; Termos de Steam, PlayStation e Nintendo.
- **Código do projeto:** `server/db.js`, `server/index.js`, `server/migrate_level_bigint.js`, `rpg_system.js`, `js/game/engine.js`, `android/app/build.gradle`, `docs/SAVE_SYSTEM_MASTER_PLAN.md`.

### 14.4 O que NÃO foi verificado — leia antes de confiar demais

**Não foi possível verificar dentro das regras do modo PLANO:**

1. **Nenhum achado foi reproduzido contra o banco de produção.** O brief proibia, e isso foi respeitado. O cenário "zerar em um pacote" é **leitura de código confirmada por dois agentes**, não teste.
2. **`js/game/engine.js` não foi lido por inteiro** (220 KB; a regra do projeto desaconselha). A afirmação "XP é 100% do cliente" vale **nos dois pontos conhecidos**; a varredura exaustiva continua pendente.
3. **O texto integral do Decreto 12.880 não foi lido na fonte primária.**
4. **O comportamento real do WebView do app** (heartbeat, `visibilitychange`, o que se perde ao reinstalar) não foi testado.
5. **Nenhum tamanho de tabela, latência ou custo real foi medido.**
6. **A página oficial do Android não descreve explicitamente o que acontece com um app assinado com chave debug** — essa conclusão é **hipótese fundamentada** e precisa de confirmação.
7. **O modelo de sobrevivência geracional é simples** (probabilidade independente por Passagem, mandato médio fixo). Serve para dar **ordem de grandeza**, não precisão — mas a ordem de grandeza é o que importa, e ela é dura em qualquer variação razoável.
8. **Nenhum agente leu os onze relatórios inteiros.** O total passa de 790 KB. A auditoria declarou o que leu e o que não leu; esta síntese leu integralmente o brief, o `10` e o `11`, e as seções citadas dos demais. **Se houver contradição fora disso, ela não está aqui.**

**O que só você pode informar:** o plano contratado do Supabase; se existe backup hoje; a data em que a migração BIGINT rodou; o custo real da VPS; quais contas são de teste; se a regressão do botão de pulo no mobile ainda está aberta; quanto o advogado cobra; e o seu ritmo real de trabalho.

---

**Declaração final.** Nenhum arquivo do jogo foi alterado. Nenhuma migração foi executada. Nenhuma consulta foi feita ao banco de produção. Nenhuma credencial foi lida. Os únicos arquivos escritos foram os relatórios em `docs/legacy-plan/` e este documento.

*Fim do plano.*
