# 06 — Jurídico, Privacidade e Ética do Jogo Legado

Autor: `digital-succession-counsel` · Data da consulta e do relatório: **2026-09-20** · Modo: PLANO (nada do jogo foi alterado).

> **AVISO OBRIGATÓRIO — leia antes de tudo.**
> **Eu não substituo um advogado.** Este material mapeia riscos e levanta perguntas; **não é aconselhamento jurídico**. O dono do jogo deve validar cada conclusão, os Termos de Uso, a Política de Privacidade e qualquer estrutura de associação/fundação/trust com um profissional habilitado (advogado inscrito na OAB, de preferência com experiência em direito digital/LGPD e em sucessões; contador para qualquer fluxo de dinheiro). Todos os textos-modelo deste relatório são **rascunhos — validar com advogado habilitado** — e não são redação final.
>
> **A legislação muda.** Tudo o que aparece como [VERIFICADO] foi conferido em **2026-09-20**; a lei de herança digital, o ECA Digital e os guias da ANPD estão em movimento (ver §(f)). Refaça a consulta antes de qualquer decisão.

**Legenda:** **[VERIFICADO]** = conferi em fonte (URL e data indicadas; quando a fonte é secundária, digo) · **[M]** = conhecimento geral meu, *não* conferido nesta sessão — o advogado confirma · **[HIPÓTESE]** = raciocínio meu · **[CÁLCULO]** = conta feita · **[DECISÃO]** = escolha do dono.

---

## (a) Resumo em 10 linhas

1. **Achado central (o que você pediu para eu confirmar):** o **Decreto 12.880/2026, art. 9º, parágrafo único, inciso III**, lista "a oferta de recompensas pelo tempo de uso" entre os mecanismos que estimulam uso excessivo, para serviços "direcionados a crianças e adolescentes ou de acesso provável por eles". **[VERIFICADO — texto do decreto na Câmara dos Deputados, 2026-09-20]**. A régua do dono, do jeito que `raw/05` a projeta (nível do legado = função de `segundos_creditados`), **é, numa leitura literal, uma recompensa por tempo de uso**. Não é uma proibição certa — é um **risco de interpretação sério** que precisa de salvaguardas desenhadas *antes* (§B.1) e de parecer de advogado.
2. Jogos eletrônicos têm **presunção de "acesso provável"** por menores no ECA Digital regulamentado **[VERIFICADO, fonte secundária: Data Privacy Brasil, resumo do guia da ANPD]**. Ou seja: o Danger Ghost **já está no escopo hoje** — e hoje tem chat global, mural público (Egregora), amigos e galeria de imagens, sem idade, sem vínculo com responsável e sem Termos.
3. **Não existe Termos de Uso nem Política de Privacidade** no site **[VERIFICADO: grep em `index.html`, sem ocorrência]**, nem rota de exclusão de conta, nem campo de idade. Isso é urgente **independente do Legado**.
4. **Herança digital no Brasil:** sem lei específica; **PL 4/2025** (Código Civil) em comissão do Senado; o **STJ** (REsp 2.124.424, 26/09/2025) criou o "inventariante digital"; a **ANPD** (Nota Técnica 3/2023) entende que a LGPD **não protege dados de falecidos** — a proteção vem dos direitos da personalidade do Código Civil. **[VERIFICADO]**
5. **Conta = licença, não propriedade** (é como Steam, PlayStation e Nintendo tratam) **[VERIFICADO]**; a recomendação é **licença + Passagem oficial designada em vida**, o único mecanismo que Google, Apple e Meta aceitam como "vontade do titular".
6. **Apagamento × Crônica:** o motivo de "continuidade do jogo" **não** está entre as exceções de conservação do art. 16 da LGPD **[VERIFICADO]**; portanto a Crônica precisa ser **desenhada para não conter dado pessoal permanente** (camada de fatos + camada de identidade apagável). Achei **três conflitos concretos** com o desenho de `raw/09` (§B.5.4).
7. **Menores:** vínculo obrigatório a responsável para menores de 16 (art. 15 da Lei 15.211), interação limitada por padrão (art. 21), autodeclaração de idade insuficiente para "verificação confiável" **[VERIFICADO, fontes secundárias]**. Herdeiro menor: a linha espera em Custódia (alinha com `raw/01` F6 e `raw/03` T30).
8. **Anti-RMT:** proibir venda de conta por contrato é prática universal e lícita; o difícil é distinguir Passagem legítima de venda. Solução: **Passagem gratuita atestada + fricções** (designação ≥30 d, guarda mínima 180 d — já em `raw/03` T4 — e teto diário de `raw/05`), com **sanção proporcional e apelação**.
9. **Operador por 1.100 anos:** ninguém garante; o caminho realista é **Associação sem fins lucrativos → Fundação de direito privado** (Código Civil arts. 62–69), cessão de marca/código/domínio à entidade, **licença aberta** e um **compromisso de encerramento (sunset)** de 180 dias (mesma ordem do PL 3612/2026). Trust "de verdade" não existe no Brasil ainda (PL 4758/2020 parado).
10. Entrego **4 textos-modelo** (EN + PT-BR) e uma **lista de 15 itens que exigem profissional real, por urgência** (§B.14).

---

## (b) Análise e proposta detalhada

### B.0 Como ler e o que consegui checar

- **Fontes primárias** que abri: Decreto 12.880/2026 (Câmara dos Deputados), Resolução CD/ANPD nº 2/2022 (site da ANPD), STJ (notícia oficial), Senado (tramitação PL 4/2025 e PL 4758/2020), Steam Subscriber Agreement, PlayStation Network ToS, páginas de suporte de Google/Apple/Facebook/Microsoft, Código Civil arts. 3º, 12, 62, 69 (transcrição de site de legislação), LGPD arts. 14, 18, 19, 7º (espelho `lgpd-brasil.info`).
- **O Planalto (planalto.gov.br) recusou conexão** (ECONNRESET) nas duas tentativas: os artigos da **Lei 15.211/2025** e da **LGPD** vieram de espelhos e de escritórios/imprensa. Marquei "fonte secundária" onde for o caso. **O advogado deve conferir os números de artigos no texto oficial.**
- **Termos que vou explicar na primeira vez que aparecem:** *controlador* (quem decide para que e como os dados são usados — hoje, você), *operador* (quem trata dados por conta do controlador — Supabase e a VPS), *titular* (a pessoa a quem os dados se referem), *base legal* (o "motivo permitido" pela LGPD para tratar o dado; consentimento é só uma das dez), *pseudonimização* (trocar o nome por um código, mas guardar em algum lugar a tabela que liga de volta — **continua sendo dado pessoal**), *anonimização* (perder de vez a possibilidade de ligar o dado a uma pessoa — aí deixa de ser dado pessoal), *encarregado/DPO* (o "canal" e responsável interno por privacidade), *espólio* (o conjunto de bens de quem morreu, antes da partilha), *dark pattern* (truque de interface que empurra a pessoa a fazer o que ela não faria com a cabeça fria), *RMT* (real-money trading: vender/comprar itens ou contas por dinheiro de verdade).

---

### B.1 O achado central: "recompensa pelo tempo de uso" e a régua de 1 h/dia

#### B.1.1 O que a norma diz (texto verificado)

**Decreto 12.880, de 18/03/2026** (regulamenta a Lei 15.211/2025) — **[VERIFICADO: texto no portal de legislação da Câmara dos Deputados, `www2.camara.leg.br/legin/fed/decret/2026/decreto-12880-18-marco-2026-798813-publicacaooriginal-178481-pe.html`, consultado em 2026-09-20]**:

- **Art. 9º, caput:** os fornecedores de produtos ou serviços de TI "direcionados a crianças e adolescentes ou de acesso provável por eles" deverão "implementar mecanismos para evitar o seu uso excessivo, problemático ou compulsivo".
- **Art. 9º, parágrafo único** — mecanismos que estimulam uso excessivo: **I** a ocultação de pontos naturais de parada; **II** o acionamento de novos conteúdos sem solicitação; **III** **a oferta de recompensas pelo tempo de uso**; **IV** o aparecimento de notificações excessivas.
- **Art. 10, parágrafo único:** práticas "manipulativas, enganosas ou coercitivas" = arquiteturas de escolha que interferem na autonomia do usuário ou exploram vulnerabilidades (cognitivas, etárias).
- **Art. 14, III:** ferramentas de supervisão parental "com funcionalidades de bloqueio configuráveis pelos responsáveis legais".
- **Art. 24, §3º:** dados usados para aferição/verificação de idade devem ser "eliminados de modo imediato e irreversível após a captura" **[VERIFICADO, mesmo texto]**.

Confirmação cruzada: a Data Privacy Brasil e resumos de escritórios repetem os mesmos quatro itens, incluindo "recompensas por tempo de uso" **[VERIFICADO, fonte secundária, 2026-09-20]**. Uma segunda fonte (Mattos Filho) resume o art. 9 mas **não** lista o inciso III — não contradiz, apenas resume.

**Escopo ("acesso provável"):** três requisitos cumulativos no guia da ANPD — atratividade para menores (linguagem, estética, personagens, recompensas, gamificação), facilidade de acesso e **grau significativo de risco**; e o decreto estabelece **presunção legal** para "jogos eletrônicos", entre outros **[VERIFICADO, fonte secundária: dataprivacybr.org, resumo do guia/decreto; texto do decreto sobre a presunção não localizei — o art. 9 fetch retornou que o decreto remete à Lei 15.211 para a definição]**. Um aviso "18+" ou uma autodeclaração de idade **não afasta** o "acesso provável" **[VERIFICADO, mesma fonte]**.

**Cronograma de fiscalização (ANPD):** Etapa I (março/2026), Etapa II (agosto/2026: guia atualizado de aferição de idade; consulta pública até 09/07/2026; período de adaptação **ago–nov/2026**), Etapa III (**a partir de jan/2027**: ações de fiscalização) **[VERIFICADO: gov.br/anpd/pt-br/assuntos/eca-digital, 2026-09-20]**. Um escritório (Mayer Brown, abril/2026) fala em início de sanções em novembro/2026 — **divergência entre fontes**; usar o prazo mais rigoroso (nov/2026) no planejamento **[HIPÓTESE conservadora]**.

**Sanções:** advertência, multa de até **10% do faturamento do grupo econômico no Brasil ou R$ 50 milhões por infração**, suspensão ou proibição de atividades (art. 35 da Lei 15.211) **[VERIFICADO, fontes secundárias: juridico.ai e Souto Correa]**. Para um projeto solo sem faturamento, o risco prático é mais **suspensão/ordem de adequação e reputação** do que multa cheia **[HIPÓTESE]**.

**O estado de hoje:** não existe no jogo nenhum contador de tempo, streak, bônus de login diário ou badge por horas jogadas **[VERIFICADO: grep de `playtime|streak|daily_login|horas jogadas|total_time` em `server/seed_badges.js`, `server/index.js`, `server/db.js` — zero ocorrências; e `raw/05` confirma que a coluna `"time"` nunca é incrementada]**. Ou seja: **o Legado introduziria o primeiro mecanismo do tipo** — dá para desenhá-lo certo desde o começo.

#### B.1.2 A régua colide com o inciso III? Análise honesta

**Contra o dono (leitura literal, o cenário que preocupa):**
- `raw/05` §3.1 propõe que **o nível do legado seja função de `segundos_creditados`** pelo servidor. Tempo online → nível. Isso é "recompensa proporcional ao tempo de uso".
- O ritual de "1 h por dia por décadas" é, por desenho, um **hábito diário**; qualquer UI que o celebre (a "lâmpada do dia", o fecho diário) pode ser lida como reforço de hábito.
- A criança que herda uma conta "atrasada" em relação à régua sofre pressão implícita (art. 10: exploração de vulnerabilidade etária).

**A favor do dono (por que a leitura literal provavelmente é exagerada):**
- O alvo do art. 9 é **estimular uso *maior*** (rolagem infinita, autoplay, notificação, bônus por ficar mais tempo). Um **teto diário duro** faz o oposto: **depois de 1 h não rende mais nada**. `raw/05` §3.6 propõe exatamente isso (teto duro 1 h/dia, com banco de até 7 dias). Um teto é um "ponto natural de parada" **imposto**, o contrário do inciso I. **[HIPÓTESE — meu argumento; é o que o advogado/ANPD precisa validar]**
- Todo RPG/MMO recompensa tempo de jogo de algum modo; se o inciso III fosse lido de forma literal, quase todo jogo com progressão por XP cairia nele. A ANPD provavelmente vai focar em **recompensas cujo gatilho é a duração/frequência da presença** (bônus de login, sequência diária, "jogue 3 h para ganhar"), não na progressão em si **[HIPÓTESE; não achei orientação da ANPD sobre jogos e o inciso III — ver §(f)]**.
- Ainda não há orientação definitiva da ANPD nem precedente **[não verificado: guia definitivo de agosto/2026; conferir]**.

**Conclusão:** risco **médio-alto e incerto**, concentrado em contas de **menores** (e em contas de idade desconhecida). Não é motivo para abandonar o conceito; é motivo para (1) desenhar as salvaguardas abaixo como **regra de produto inegociável**, (2) pedir **parecer escrito** de advogado antes de qualquer menor entrar na régua e (3) ter um **plano B** (opção C ou B em D1).

#### B.1.3 Salvaguardas concretas (proponho como "Carta do Sem Pressão" do produto)

Cada uma tem dono (departamento) e critério de aceite testável. Alinha com `raw/01` Princípio 10 e Decisão do tempo em `raw/05`.

| # | Salvaguarda | Como se desenha | Por que ajuda contra art. 9/10 | Quem implementa / valida |
|---|---|---|---|---|
| S1 | **Teto, não meta** | 1 h/dia é **limite de crédito** (`raw/05` §3.6). Passou disso: **zero** progresso de legado. O jogo nunca diz "jogue mais". Nenhuma tela mostra "faltam X min para a meta". | Inverte a lógica do inciso III (tempo extra não rende). | `progression-actuary` + `game-economy-designer` |
| S2 | **Ponto natural de parada visível** | Ao fechar o crédito do dia: tela "**Fecho do dia**" ("O legado de hoje está escrito. Pode continuar a explorar ou voltar amanhã, sem nada a perder."). **Sem** pop-up de "só mais uma"; sem conteúdo novo empurrado (inciso II). | Contra os incisos I e II. | `ui-ux-designer` |
| S3 | **Zero recompensa por presença** | Sem bônus de login, sem "dia 7 de sequência", sem missão diária, sem multiplicador por sessão longa. Recompensas (Relíquias, Marcos, Eras) ligadas a **feitos** (chefes, Ghostdex, contribuições à Crônica), não a horas online. **Auditar as 333 badges** para garantir que nenhuma exija "X horas jogadas" (hoje nenhuma exige — grep acima). | Remove o gatilho do inciso III do desenho de recompensas *visíveis*. | `game-economy-designer` |
| S4 | **Sem streak, sem perda** | Não existe "sequência". Faltar não tira nada: sem decaimento de nível/XP, sem "sua linhagem morre". O banco de dias de `raw/05` §3.6(c) perdoa ausência. **Modo Ausência** (`raw/03` §Guardião impedido). | Art. 10: não explora aversão à perda; `raw/01` F2. | `progression-actuary`, `legacy-systems-designer` |
| S5 | **Sem notificação de cobrança** | Nenhum push, e-mail ou SMS de "volte a jogar". E-mails só de **conta/segurança/sucessão** (escada de dormência, convites) — poucos, neutros, sem culpa. **Nunca** no tom "seu Guardião está em silêncio, você deveria…" endereçado a **responsável de menor**. | Inciso IV. | `ui-ux-designer`, `narrative-designer` |
| S6 | **Sem culpa no texto** | Regra de escrita: proibido "você quebrou a linha", "seu pai ficaria decepcionado" (já em `raw/01` P3). Revisão de todo texto voltado a menor por `narrative-designer` + este agente. | Art. 10. | `narrative-designer` |
| S7 | **Sem "atraso" exibido a criança** | A régua aparece **só descritiva** ("se um Guardião joga 1 h por dia…"), nunca "você está 12 dias atrás". Para menores, nenhum comparativo com a data-alvo. | Art. 10 (vulnerabilidade etária). | `ui-ux-designer`, `progression-actuary` |
| S8 | **Conta de menor: regras mais conservadoras** | Teto de crédito **≤ 1 h/dia**, **sem "catch-up"** do banco de dias acima de 1 h (o banco de 2 h/dia de `raw/05` (c) vale só para adultos); responsável pode **baixar** o teto (nunca subir). Chat/Egregora/amigos/galeria **desligados por padrão** (Lei 15.211 art. 21). | Arts. 9 e 14. | `backend-architect` (após aprovação) |
| S9 | **Sem eventos "perdeu, perdeu"** | Nenhum evento sazonal com recompensa exclusiva e prazo (FOMO). Eventos rituais (Passagem, Renovação) não são "recompensa por tempo"; ainda assim, quem perdeu o evento não perde nada permanente. | Art. 10. | `live-ops`, `game-economy-designer` |
| S10 | **Controles parentais reais** | Vínculo obrigatório a responsável para < 16 (art. 15); painel: limite de tempo (só para baixo), contatos/chat, exportar/apagar dados, ver o que o filho vê. | Art. 14, III do decreto; art. 15 da lei. | `ui-ux-designer`, `backend-architect` |
| S11 | **Registro de revisão ética + RIPD** | Documento datado ("Relatório de Impacto à Proteção de Dados" — RIPD, LGPD art. 38 **[M]**) explicando por que cada mecânica diária não é recompensa por tempo, com avaliação do **melhor interesse da criança** (LGPD art. 14). Prova de boa-fé se houver fiscalização. | Reduz risco sancionatório. | DPO/advogado + `game-director` |
| S12 | **Interruptor reversível (kill-switch)** | Bandeira de recurso ("feature flag") que desliga o crédito/visibilidade da régua **para menores** sem quebrar a linhagem (jogam, mas o tempo deles não conta, ver D1-C). Precaução de Jonas (`raw/01` P4). | Permite obedecer a uma orientação futura da ANPD em dias. | `backend-architect` |

**Interações a resolver com outros departamentos** (não decido sozinho):
- `progression-actuary`: aceitar que **menor credita ≤ 1 h/dia sem catch-up** e que a calibração da linhagem tolera isso (uma criança que joga 30 min/dia não pode "atrasar" a linhagem a ponto de gerar pressão — a régua é da linhagem em séculos, não da criança em semanas).
- `game-economy-designer`: confirmar S3 (nenhum ganho por presença).

#### B.1.4 Plano B se o advogado disser "é recompensa por tempo de uso"

Ver **D1**: (B) adulto-only com Custódia para herdeiro menor; (C) "Modo Aprendiz" — menor joga o mesmo mundo, mas **sem crédito de tempo de legado** e sem exibir a régua; ao fazer 18 vira Guardião e o crédito começa. Ambos preservam a Crônica e o direito de recusar.

---

### B.2 Mapa de dados — o que o jogo guarda hoje, de fato

Lido em `server/db.js` (schema), `server/index.js` (logs/IP/uploads), `js/web2/auth.js` (cliente). **[VERIFICADO: leitura do código em 2026-09-20]**, salvo onde indicado.

| # | Dado pessoal | Onde vive | Finalidade | Base legal provável (art. 7º) **[M]** | Retenção hoje → proposta | Observação |
|---|---|---|---|---|---|---|
| 1 | **E-mail** | `players.email` (**chave primária**, FK em 7 tabelas), `friendships`, `diary_entries`, `egregora_messages`, `player_badges`, `player_stat_progress`, `characters` | Login/identidade da conta | Execução de contrato (V) | Indefinida → enquanto a conta existir; apagar/trocar por `account_id` na exclusão | E-mail é PK **e** `ON DELETE CASCADE`: excluir o jogador apaga tudo em cascata (§B.5.4-a). |
| 2 | **Nome exibido** | `players.name`, `characters.name`, `egregora_messages.player_name` (snapshot permanente **de propósito**, `db.js:178-184`) | Identificação no jogo/mural | Contrato (V) / consentimento p/ exibição pública (I) | Indefinida → apagável | Nome pode ser real; o mural **nunca esquece** (§B.5.4-c). |
| 3 | **Hash bcrypt da senha** | `players.password` | Autenticação | Contrato (V) | Enquanto a conta existir | Correto (bcrypt, CLAUDE.md §4). Não é o dado de maior risco, mas é o mais sensível se vazar. |
| 4 | **Estado do jogo** (nível, XP, inventário, ghostdex, baú, posição no overworld, badges) | `players`, `characters`, `player_badges`, `player_stat_progress` | Prestar o serviço | Contrato (V) | Indefinida | **Não é pessoal por si**; vira pessoal só enquanto ligado ao e-mail (é a ideia da camada de fatos). |
| 5 | **Imagens enviadas** (avatar, galeria, imagem do personagem) | `players.avatar_url`, `gallery_urls`, `characters.image_url` → Supabase Storage (`avatars`, `gallery`; limite 5 MB, `server/index.js:1441`) | Personalização | Consentimento (I) | Indefinida | **Pode conter rosto de pessoa, inclusive menor.** Bucket público ou privado: **não verificado** (dado a levantar). |
| 6 | **Diário** (texto livre) | `diary_entries.content` | Recurso do jogo | Contrato / consentimento | Indefinida | Se aparece a terceiros via `get_player_profile`: **não verificado**. Texto livre pode ter dado de terceiros e sensível. |
| 7 | **Mural global Egregora** (público) | `egregora_messages` (e-mail + nome + texto + data) | Interação social | Consentimento (I) | Indefinida | Conteúdo **público** e **atribuído**. É UGC (conteúdo de usuário): moderação, denúncia, remoção. |
| 8 | **Amizades** | `friendships` (e-mails, status, datas) | Recurso social | Contrato | Indefinida | Grafo social; ECA Digital art. 21 (interação limitada por padrão para menores). |
| 9 | **Chat global** | Não achei persistência no servidor (grep de `global_chat`/`InitGlobalChat` em `server/index.js` sem resultado) | Interação | — | — | **Dado a levantar:** se é só *relay* em memória ou se é gravado em algum lugar; se é gravado, é UGC. |
| 10 | **Endereço IP** | **Só em memória** para rate-limit (`socket.handshake.address`, `req.ip`: `server/index.js` linhas 725, 752, 780, 956, 1017, 1064, 1225, 1694). **A aplicação não grava IP no banco.** | Segurança/antiabuso | Legítimo interesse (IX) | Some ao reiniciar → manter assim | **Mas** o proxy reverso/VPS (nginx? não verificado) e o PM2 podem gravar IP em arquivo. **[HIPÓTESE — dado a levantar]** |
| 11 | **Logs do PM2/console** | `console.log(... email ...)` em ≥15 pontos: login, cadastro, save, badges, amizades, upload (`server/index.js:705, 734, 762, 801, 832, 843, 894, 935, 963, 1024, 1247, 1278, 1743…`) | Operação/diagnóstico | Legítimo interesse | **Desconhecida** (PM2 não rotaciona por padrão **[M]**) | **E-mail em texto puro em arquivo de log**, sem prazo. Achado de higiene: mascarar (hash) e rotacionar. |
| 12 | **Armazenamento local do navegador** | `localStorage`: `dg_cloud_email`, `playerName`, `dg_cloud_profile`, `dg_session_token` (JWT, TTL 30 d — `raw/09`) (`js/web2/auth.js:86-91`) | Sessão | Contrato | Até limpar | Em computador compartilhado é dado exposto; sem consentimento de cookies/armazenamento — pergunta ao advogado (não são cookies de terceiros). |
| 13 | **Vendors (operadores)** | **Supabase** (Postgres + Storage) e **VPS DeSoHosting**; handler Google OAuth existe mas sem uso | Hospedagem | — | — | Transferência internacional se região ≠ Brasil (LGPD arts. 33–36 **[M]**). **Região do Supabase: não verificada.** Contrato de operador/DPA com cada um. |
| 14 | **O que NÃO existe** | — | — | — | — | **Idade/data de nascimento; aceite de Termos (e versão); consentimento; rota de exclusão de conta** (só `delete_character`, `index.js:894`); canal do titular; Termos/Privacidade. |

**Achados independentes do Legado (o dono deveria saber já):**
1. Sem Termos/Privacidade → o tratamento hoje não tem transparência (LGPD art. 9º **[M]**).
2. Sem idade/consentimento → não dá para cumprir art. 14 LGPD nem art. 15 da Lei 15.211.
3. Sem exclusão de conta → o direito do art. 18, VI (eliminação) hoje só se cumpre com SQL manual — e o `CASCADE` apaga o resto junto.
4. E-mail em log sem prazo.
5. **`index.html:1026` diz** "Understand how Ftasma records your attributes, weapons, and stages securely on the blockchain!" — o projeto é **100% Web2** (CLAUDE.md §1). Texto ao jogador que promete blockchain **cria expectativa falsa de imutabilidade** e pode ser publicidade enganosa (CDC art. 37 **[M]**). É do dono/`ui-ux-designer`; sinalizo porque toca "o que o jogador acha que acontece com os dados dele".
6. `cors: { origin: '*' }` (`index.js:47`) → não é meu escopo; repasso a `security-engineer`.

---

### B.3 Natureza da conta: licença ou propriedade? Herança digital

#### B.3.1 O direito brasileiro hoje (verificado em 2026-09-20)

- **Não há lei específica sobre herança digital** **[VERIFICADO — Senado Notícias, 27/03/2026; STJ]**.
- **PL 4/2025** (reforma do Código Civil, autor Sen. Rodrigo Pacheco): em comissão temporária, relator **Sen. Veneziano Vital do Rêgo**; **última ação 16/06/2026**; **893 emendas** **[VERIFICADO — `www25.senado.leg.br/web/atividade/materias/-/materia/166998`]**. O que a imprensa e a doutrina relatam: **bens digitais de valor econômico apreciável** (milhas, criptoativos, perfis monetizados, créditos em aplicativos) **integram o espólio**; **conteúdo privado** (fotos, mensagens, e-mails) **não** entra no inventário, para proteger a intimidade do falecido; **a plataforma não pode se apropriar de contas de rede social**, e sucessores podem pedir **exclusão ou memorialização**; acesso só por decisão judicial fundamentada **[VERIFICADO, fonte secundária: Senado Notícias e Conjur; não recuperei os números dos artigos do texto — dado a levantar]**. O texto **não trata especificamente de contas de jogos** (a matéria do Senado só cita "contas de games" na introdução).
- **STJ, REsp 2.124.424 (3ª Turma, Min. Nancy Andrighi), 26/09/2025**: na falta de lei, o acesso a bens digitais protegidos por senha em inventário faz-se por **"incidente de identificação, classificação e avaliação de bens digitais"**, com **inventariante digital** sob supervisão do juiz; distingue **patrimonial** (transmissível) de **existencial** (intimidade — preservado); **não** discutiu termos de uso nem testamento digital **[VERIFICADO — stj.jus.br, notícia de 01/10/2025]**.
- **Jurisprudência estadual dividida:** TJSP autorizou a mãe a acessar o Apple ID da filha (Apelação 1017379-58.2022.8.26.0068, 26/04/2024); TJMG negou (AI 1.0000.24.174340-0/001, 22/05/2024) **[VERIFICADO, fonte secundária: resumo em busca; conferir nos autos]**.
- **ANPD, Nota Técnica nº 3/2023 (17/03/2023):** a LGPD **não se aplica** a dados de pessoas falecidas (o titular é "pessoa natural", e a personalidade termina com a morte — Código Civil art. 6º); a proteção do morto se dá pelos **direitos da personalidade** (CC arts. 12 e 20); a LGPD **não obriga** a atender pedidos de herdeiros, mas tratamento abusivo pode gerar reparação (CC arts. 186 e 927) **[VERIFICADO, fonte secundária: INPD e Conjur; a página oficial da ANPD respondeu 401]**.
- **Código Civil art. 12, parágrafo único:** para o morto, têm legitimação para exigir que cesse a lesão à personalidade "o cônjuge sobrevivente, ou qualquer parente em linha reta, ou colateral até o quarto grau" **[VERIFICADO — transcrição em `modeloinicial.com.br`, 2026-09-20]**. **Consequência prática para a Crônica:** mesmo que a LGPD não proteja o morto, **parentes até o 4º grau podem exigir a retirada de conteúdo lesivo** — a Crônica precisa de **canal de remoção por parentes**.
- **Saisine** (CC art. 1.784 **[M]**): com a morte, a herança se transmite *de imediato* aos herdeiros civis — daí o debate sobre se uma conta faz parte da herança. Um testamento pode conter disposições **não patrimoniais** (CC art. 1.857 §2º **[M]**), o que abre uma ponte: o jogador pode citar a Passagem no testamento real.

#### B.3.2 Como os grandes serviços tratam — e o que ensina

| Serviço | O que os termos/ferramentas dizem **[VERIFICADO em fonte oficial, 2026-09-20]** | Lição para o Legado |
|---|---|---|
| **Steam** (Subscriber Agreement) | Conteúdo e serviços são "licenciados, não vendidos" (§2.A); **não** se pode transferir a conta nem vender direito de usá-la (§1.C); assinaturas intransferíveis (§9.B); **nenhuma cláusula sobre falecimento** | Licença + intransferível é o padrão de mercado; **o silêncio sobre morte é o que gera disputa e imprensa**. |
| **PlayStation** (PSN ToS) | Licença "pessoal, não transferível" (§10.2); conta não pode ser vendida/transferida; **sem menção a morte**; encerramento "irreversível" (§12.3); Sony pode descontinuar o serviço "sem aviso ou responsabilidade" (§13/17.1) | Não copiar a cláusula de descontinuação "sem aviso": no Brasil tende a ser abusiva com consumidor **[HIPÓTESE; CDC art. 51 **[M]**]**. |
| **Nintendo** | Conta e ID intransferíveis; **familiar imediato/executor pode pedir o encerramento** com certidão de óbito **[VERIFICADO, fonte secundária: busca sobre o Nintendo Account User Agreement e suporte]** | Um canal de "encerrar/memorializar" para família é o mínimo aceito. |
| **Microsoft/Xbox** | **Não entrega conteúdo** sem ordem judicial/intimação; conta fecha por inatividade (congela em 1 ano, apaga em 2 sem acesso); o documento oficial **não menciona Xbox** **[VERIFICADO — support.microsoft.com]** | O que **não** fazer: apagar conta por inatividade curta (a biblioteca some junto). |
| **Google — Gerenciador de Contas Inativas** | Até **10 contatos de confiança**; você escolhe **o que** cada um recebe; contatos só são notificados **depois** da inatividade; sem plano, o Google se reserva o direito de excluir a conta inativa por ≥2 anos. Períodos de 3/6/12/18 meses **[M — confirmado só em fontes secundárias; a página oficial não lista os prazos]** | **Modelo direto da escada de dormência**: tentar o titular primeiro (recuperação de e-mail), depois os contatos; a decisão do titular **em vida** manda. |
| **Apple — Contato de Legado** | Contato precisa de **chave de acesso + certidão de óbito**; acessa fotos, mensagens, notas, arquivos, backups; **não** acessa filmes, músicas, livros, assinaturas nem chaves/senhas | **Separa dados pessoais (passam) de licenças (não passam)**; e a **chave impressa** que sobrevive ao servidor é exatamente o **Selo** de `raw/03`. |
| **Facebook/Meta** | **Memorialização**; contato de legado gerencia, **não** entra na conta, não lê mensagens, não apaga posts antigos; alternativa "excluir após a morte" | **Estado intermediário "em memória"** para o Guardião falecido; e **duas escolhas em vida** (memorial × excluir). |

**O que isso ensina (síntese):** (1) só a **designação feita em vida pelo titular** é aceita por Google/Apple/Meta como legítima — é exatamente a **Carta de Sucessão**; (2) **licença não se herda** (os grandes nunca prometem), mas **dados pessoais podem passar com consentimento**; (3) todos exigem **um segundo fator de prova** (chave, certidão, telefone) — combina com Selo + e-mail do Herdeiro (`raw/03` §2.3); (4) **a inatividade dispara aviso ao titular antes de qualquer coisa**; (5) quem **não** tem caminho (Steam/PSN/Xbox) vira notícia — melhor ter o caminho escrito.

#### B.3.3 "Propriedade" ou "licença"? O que recomendo

**[HIPÓTESE — o advogado valida]:** entre jogador e jogo há **contrato de adesão de consumo** (o CDC se aplica à relação jogador–plataforma **[VERIFICADO, fonte secundária: Âmbito Jurídico, Jusbrasil]**). A recomendação é enquadrar a conta como **licença de uso pessoal, sem valor monetário**, e reconhecer **uma única transferência suportada**: a **Passagem oficial** ao Herdeiro designado.

Um ponto sutil a favor do desenho: o critério do PL 4/2025 para integrar o espólio é o **valor econômico apreciável**. **Se o jogo não permite valor de mercado** (sem venda, sem ranking monetizável — `raw/03` §anti-RMT: "não há nada revendável"), **o argumento de que a conta é herança patrimonial enfraquece**. **Ou seja: a defesa anti-RMT também é a defesa jurídica contra um herdeiro civil hostil.** **[HIPÓTESE]**

**Herdeiro civil x Herdeiro do jogo (o caso hostil):** o filho do Guardião (herdeiro pela lei) pode não ser o Herdeiro da Carta. Os Termos devem dizer, em português claro: (a) a Passagem vale **dentro do jogo**; (b) o herdeiro civil pode **pedir encerramento, memorialização ou remoção de dados**, e obter cópia dos **dados pessoais** do falecido *na medida em que a lei exigir*; (c) **não** há obrigação de entregar a Linhagem a quem não foi designado, **salvo ordem judicial**; (d) o operador cumpre decisão judicial. **Pergunta ao advogado:** essa cláusula resiste a CDC art. 51 (abusividade) e ao art. 1.784 do CC?

#### B.3.4 O que os Termos PRECISAM dizer e o que NÃO podem prometer

**Precisam dizer:** natureza (licença); Passagem como única transferência; Carta = efeito só dentro do jogo; morte/incapacidade; dormência e Custódia; direitos e limites da Crônica; proibição de RMT + sanções + apelação; retenção e exclusão de dados; cessão a entidade sucessora; encerramento (sunset) com prazo de aviso e exportação; menores; foro; idioma (ver D11); versionamento e re-aceite em mudança material.

**NÃO podem prometer:** "1.100 anos" nem "para sempre"; que a Crônica é "imutável/permanente" para sempre (choca com o direito de apagar identidade); que a conta "vale dinheiro" ou "é sua propriedade"; que o Herdeiro "tem direito" à conta (é uma **oferta** que ele pode recusar); que "nunca perde progresso" (o operador pode falhar); exclusão de responsabilidade "total" (cláusula de exoneração é abusiva no consumo **[M]**); arbitragem obrigatória interna sem acesso ao Judiciário **[M — a fonte secundária diz ser ilegal no Brasil; advogado confirma]**.

---

### B.4 LGPD (Lei 13.709/2018) — o que o jogo trata e o que a lei exige

**Papéis [M]:** você é hoje **controlador** (e responde pessoalmente se for pessoa física); **Supabase** e **VPS** são **operadores**. Com a entidade sucessora, o controlador passa a ser ela.

**Bases legais por finalidade** (art. 7º; lista completa I–X **[VERIFICADO — espelho lgpd-brasil.info]**):

| Finalidade | Base proposta **[M]** | Cuidado |
|---|---|---|
| Criar/manter conta, salvar progresso | **V — execução de contrato** | Só o necessário; não condicionar jogo a mais dados. |
| Segurança, rate-limit, antiabuso/RMT | **IX — legítimo interesse** (com teste de balanceamento documentado) | Sinais mínimos e com prazo; decisão automática de sanção → direito de revisão (art. 20 **[M]**). |
| Nome/alias/mensagem **na Crônica pública** | **I — consentimento** (granular, revogável) — *ou* dado não pessoal | Ver §B.6. |
| Imagens (avatar/galeria) | **I — consentimento** | Menor: responsável. |
| Convite ao Herdeiro (e-mail de terceiro) | **V (procedimento preliminar)** / **IX** | Um único convite; sem marketing; apagar se recusar/expirar (§B.8). |
| Cumprimento do Marco Civil (registros de acesso) | **II — obrigação legal**, se aplicável | Ver abaixo. |

**Direitos do titular (art. 18 — incisos I–IX) [VERIFICADO]:** confirmação de tratamento; acesso; correção; **anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade (IV)**; portabilidade; **eliminação dos dados tratados com consentimento (VI)**; informação sobre compartilhamento; informação sobre a possibilidade de não consentir; **revogação do consentimento (IX)**. **Prazo (art. 19):** formato simplificado **imediato**; declaração completa em até **15 dias** — a fonte que li resumiu como "dias úteis", minha memória do texto diz só "quinze dias": **[HIPÓTESE — advogado confirma se corridos]**. **Agentes de pequeno porte têm prazos em dobro** (Res. CD/ANPD 2/2022, art. 14) **[VERIFICADO — site da ANPD]**. Hoje o jogo **não tem canal nem rota** para exercer nada disso (achado 3).

**Encarregado (DPO):** art. 41 **[M]**. A **Resolução CD/ANPD 2/2022** dispensa o **agente de tratamento de pequeno porte** de indicar encarregado, **desde que** ofereça **canal de comunicação com o titular** (art. 11, §1º) **[VERIFICADO — gov.br/anpd]**. **Mas** perde a flexibilização quem faz **tratamento de alto risco**: exige **um critério geral** ("larga escala" *ou* "afeta significativamente direitos") **e um específico** (tecnologias emergentes, vigilância, decisão automatizada, **dados sensíveis ou de crianças**) (art. 4º) **[VERIFICADO]**. Hoje (~48 contas) não é larga escala; **com crescimento e menores, pode deixar de ser**. **Recomendação:** já publicar um **e-mail de privacidade** e nomear uma **pessoa de contato**; contratar **DPO como serviço** quando (i) passar de algumas centenas de contas, (ii) aceitar menores formalmente, ou (iii) constituir a entidade **[HIPÓTESE de gatilhos]**. A Res. 18/2024 regula a atuação do encarregado e mantém a dispensa para pequeno porte **[VERIFICADO, fonte secundária]**.

**Incidentes de segurança:** **Res. CD/ANPD 15/2024** — comunicar à ANPD e aos titulares em **3 dias úteis** do conhecimento de incidente com risco relevante; **registrar todo incidente por 5 anos**; prazo em dobro para pequeno porte **[VERIFICADO, fonte secundária: Cescon Barrieu/Mattos Filho/ANPD news; página oficial deu 401]**. **Peça prática:** um **runbook de incidente** de 1 página (quem avisa quem, modelo do e-mail) — hoje não existe.

**Marco Civil da Internet, art. 15:** provedor de aplicações **pessoa jurídica, com fins econômicos, de forma organizada e profissional** deve guardar **registros de acesso a aplicações por 6 meses**, sigilosos; outros provedores só por ordem judicial **[VERIFICADO — texto resumido por fontes de Jusbrasil/MJ]**. **Pergunta ao advogado:** um dev solo sem receita se enquadra? E a associação/fundação (sem fins econômicos)? Isso decide se o app **precisa passar a gravar IP** (hoje não grava) — o que aumenta o dado pessoal. Preferir **não gravar** até haver obrigação.

**Sanções LGPD (art. 52) [M]:** multa de até 2% do faturamento, limitada a R$ 50 milhões **por infração**, além de advertência, bloqueio e eliminação dos dados.

**Transferência internacional (arts. 33–36; Res. CD/ANPD 19/2024 sobre cláusulas-padrão) [M]:** Supabase provavelmente fora do Brasil — **dado a levantar (região do projeto)**.

**Jogadores estrangeiros:** GDPR (UE/UK) e COPPA (EUA, < 13) podem se aplicar **[M]**. **Dado a levantar:** países dos jogadores. Não peço para consultar; peço autorização ao dono.

**Anonimização — o critério legal:** dado anonimizado **não é dado pessoal**, **salvo** se o processo for revertido "por meios próprios" **ou** se "com esforços razoáveis puder ser revertido" (art. 12) **[VERIFICADO]**; anonimização = meios técnicos razoáveis e disponíveis no momento do tratamento pelos quais o dado perde a possibilidade de associação, direta ou indireta, a um indivíduo (art. 5º, XI) **[VERIFICADO]**. **Repare:** "no momento do tratamento" — e o Legado dura séculos; o que hoje é anônimo pode deixar de ser (§B.5.3).

**Exceções à eliminação (art. 16) [VERIFICADO — texto]:** conservar só para (I) obrigação legal/regulatória, (II) estudo por órgão de pesquisa (com anonimização), (III) transferência a terceiro, (IV) uso exclusivo do controlador, sem acesso de terceiro, **e anonimizados**. **"Continuidade do jogo" e "memória cultural" NÃO estão na lista** → por isso o desenho **não pode depender de exceção**; tem que depender de **anonimização** (§B.5).

---

### B.5 Apagamento (direito ao esquecimento) × Crônica permanente

#### B.5.1 O conflito em uma frase

A Crônica existe para **lembrar para sempre**; a LGPD dá ao titular o direito de **pedir para ser esquecido** (art. 18, IV e VI). E a Crônica de `raw/09` é **append-only com corrente de hashes** — feita para **não** permitir alteração.

#### B.5.2 Solução recomendada: **quatro camadas** (alinhada com `raw/03` §3 "Crônica em duas camadas")

| Camada | O que contém | Base | Pode ser apagada? | Onde mora |
|---|---|---|---|---|
| **L0 — Fatos** | nº da linhagem, nº do mandato ("Guardião #N"), **ano** de início/fim (não data exata), horas creditadas (arredondadas), nível ao passar, marcos, Relíquias, evento de Passagem | Legítimo interesse/contrato; **sem dado pessoal por desenho** | **Não** (é a história) | `chronicle_events` (append-only) |
| **L1 — Apelido** | **alias escolhido pelo jogador** (nunca e-mail, nunca nome civil por padrão) | Consentimento | **Sim**, vira "Guardião anônimo #N" | `guardian_identity` (mutável) |
| **L2 — Identidade/mensagens** | nome civil (opcional), retrato, epitáfio, Carta publicada, dedicatórias | Consentimento **por campo** | **Sim**, irreversível de propósito | `guardian_identity`, `chronicle_text` (mutáveis) |
| **L3 — Selado** | Carta ao Herdeiro e Selos: **privados até a Passagem**; publicar é **segundo consentimento** | Consentimento | Sim | `succession_vault` (criptografado) |

**Regra de ouro:** **apagar a pessoa não apaga a casa.** O pedido de apagamento remove L1–L3 e o **mapeamento** pessoa→mandato; L0 permanece — agora sem ligação com ninguém.

#### B.5.3 A anonimização de L0 é de verdade? Riscos honestos

- **Reidentificação por contexto:** "Guardião #3, 2031–2058, 24.000 h" pode identificar alguém numa comunidade pequena (quem já sabia). **Mitigações:** exibir **só o ano** (ou década), arredondar horas, nunca expor horário; nada que só uma pessoa conhecida teria. **[HIPÓTESE; o advogado decide se com 48 contas isso é "esforço razoável" ou trivial.]** Pelo art. 12, se **for possível reverter com esforços razoáveis, não é anônimo** — com poucos jogadores, **é pseudonimizado**, não anonimizado, até a base crescer. **Sou franco:** enquanto o número de linhagens for pequeno, trate L0 como **pseudonimizado de baixo risco**, não como "anônimo" garantido.
- **Anonimização "no momento do tratamento":** tecnologia futura (cruzamento de bases) pode desfazer no século XXII o que é anônimo hoje. **Regra de projeto:** L0 deve conter **o mínimo que a história exige**, nada "por via das dúvidas".
- **Criptografia por pessoa ("crypto-shredding")** — cifrar L1–L3 com chave por pessoa e **destruir a chave** no apagamento: útil **só no armazenamento mutável**, e só se **nenhuma cópia em claro** sobreviver (backups, exports, arquivos de `raw/04`). **Não** colocar texto cifrado de identidade em **arquivo de longo prazo**: com séculos, a criptografia de hoje pode ser quebrada e um vazamento **futuro** de chave/dado reabre o problema **[HIPÓTESE; o próprio `raw/04` recomenda "A com B só como opção individual"]**. **Pergunta ao advogado/perito:** destruir a chave equivale a eliminar/anonimizar? (A ANPD tem estudo preliminar sobre anonimização/pseudonimização, 48 páginas — **não consegui ler o PDF**; não verifiquei posição da ANPD sobre destruição de chave.)
- **Backups e arquivos contêm dados pessoais:** o plano de arquivamento (`raw/04`) precisa **das mesmas regras de apagamento** — política: (i) **arquivos de longo prazo levam só L0 + L1 consentido**; (ii) L2/L3 ficam **fora**; (iii) backups rotativos expiram (ex.: 35 dias) e um pedido de apagamento é honrado **em até um ciclo de backup**, dito na Política **[HIPÓTESE de valores]**.
- **Blockchain própria futura (CLAUDE.md §2):** o **EDPB** (Diretrizes 02/2025 sobre blockchain, adotadas em abril/2025; **v2.0 adotada em 07/07/2026**) **recomenda não registrar dados pessoais em claro, cifrados ou em hash na cadeia**, e guardar o resto fora da cadeia **[VERIFICADO — edpb.europa.eu e Bird & Bird; é referência europeia, a ANPD não tem equivalente que eu tenha achado]**. **Regra:** a âncora (`raw/09` §1.4, "âncora externa") publica **só hash da camada L0**, jamais L1–L3.

#### B.5.4 Três conflitos concretos com `raw/09` e `raw/03` (para `backend-architect` corrigir *depois* da aprovação)

| # | Onde | Problema | Proposta |
|---|---|---|---|
| (a) | **Hoje**, `players.email` é PK e todas as FKs são `ON DELETE CASCADE` (`db.js:53,133,171,187,200-201,228,247`) | Excluir a conta **apaga em cascata** personagens, diário, mural, amizades, badges. Se alguém "apagar" o e-mail de um Guardião, **a linhagem some** — o oposto do Legado. | `raw/09` já resolve com `lineage_id` UUID e **`ON DELETE RESTRICT`**; **confirmo**: é pré-requisito **jurídico** também. A exclusão de **pessoa** nunca deve atingir `lineages`/`chronicle_events`. |
| (b) | `raw/09` §1.4: `chronicle_events.payload JSONB` com **trigger que proíbe UPDATE/DELETE** e hash encadeado | Se o `payload` tiver nome/apelido/epitáfio, **apagar exige alterar** a corrente. | **Regra:** `payload` só carrega **L0** e **`keeper_id`** (referência opaca). Nomes/textos moram em tabelas **mutáveis**. Se um texto precisar estar "na corrente", grave só um **compromisso** `HMAC(salt_por_pessoa, texto)`; no apagamento, **destrua o salt e o texto** — o compromisso vira ruído. (Hash simples de texto curto é **adivinhável** por dicionário.) |
| (c) | `raw/09` §1.2 `keepers.display_name TEXT NOT NULL` e `contact_email_hash TEXT` "sha256 … sobrevive ao apagamento (LGPD)"; `raw/03` `chronicle_text.frozen_hash` | (1) `display_name` obrigatório impede "Guardião anônimo #N". (2) **sha256 de e-mail é dado pessoal pseudonimizado** — qualquer um que teste e-mails prováveis o reverte; manter "para sempre" fere o art. 16. (3) `frozen_hash` de texto curto idem. | (1) `display_name` **anulável** (o padrão exibido é "Guardião #N"). (2) Trocar por **HMAC-SHA256 com segredo (pepper) fora do banco** e **prazo**: guardar só enquanto houver finalidade declarada (lista "nunca me convide"); apagar depois. (3) hash **salgado por pessoa**. |
| (d) | Mural **Egregora** (hoje): `player_name` **snapshot permanente** e FK CASCADE | O mural público hoje não tem caminho de apagar só o nome preservando o texto. | Na exclusão: trocar `player_name` por "Ghost anônimo" e **desligar** do e-mail (ou apagar a mensagem). Decisão de produto → `community-manager`. |

Também: `raw/03` propõe "7 dias de arrependimento antes de executar" a retirada de identidade **[HIPÓTESE]** — **compatível** com a LGPD **desde que** a resposta ao pedido ocorra no prazo do art. 19 e o titular possa **confirmar antes** para acelerar; **não** aplicar espera quando quem pede é o **responsável de um menor** ou quando há risco (ex.: assédio). O advogado valida.

#### B.5.5 E quando o Guardião original pede exclusão mas a linhagem continua?

O direito de eliminação (art. 18, VI) alcança **dados pessoais**, não **o estado do jogo** (que, dissociado da pessoa, não é dado pessoal — **[HIPÓTESE]**). Proposta em **três caminhos**, escolhidos pelo Guardião:

| Caminho | O que acontece | Consequência |
|---|---|---|
| **1. Apagar minha identidade** | Remove L1–L3 e o mapeamento; vira "Guardião anônimo #N"; **continua** Guardião se quiser jogar | O caso mais comum; nada quebra. |
| **2. Retirar-me (Custódia voluntária)** | Além de (1), devolve a chave: a linhagem vai à **Custódia** (`raw/03` T19), pode ser reclamada pelo Herdeiro | Sai sem destruir. |
| **3. Encerrar a linhagem** | **Não é botão**: é **pedido ao operador**, espera de 30 dias, confirmação reforçada; a Crônica registra "linhagem encerrada a pedido (ano)" com **L0** | Destrói o legado dos antecessores → só com fricção; ver D4. |

**Se o Guardião morreu:** a LGPD não protege o morto (ANPD NT 3/2023) **[VERIFICADO]** — **mas parentes até 4º grau podem exigir remoção** por direito da personalidade (CC art. 12) **[VERIFICADO]**, e **terceiros vivos** citados na Carta/diário continuam protegidos pela LGPD. **Regra:** padrão **mais privado** para falecido/inalcançável (só L0 + alias se ele consentiu em vida; senão "Guardião #N"), e **canal de remoção** para parentes com verificação documental.

**Herdeiro designado (dado de terceiro):** o Guardião informa o e-mail de outra pessoa. O operador usa **só para o convite**; um convite; sem marketing; se recusar/expirar, **apaga** o e-mail em claro em até N dias (D6) e guarda no máximo o fato "uma oferta não foi confirmada" (`raw/03` §Recusa). O Guardião **não pode consentir por** o Herdeiro.

---

### B.6 Consentimento para exibir nome e mensagem

Requisitos (o consentimento LGPD é "livre, informado, inequívoco, para finalidade determinada" — art. 5º XII **[M]** e revogável — art. 8º §5º **[M]**):

1. **Granular:** alias / nome civil / retrato / epitáfio / Carta publicada / "depois da minha morte": cada um separado. **Nada pré-marcado.**
2. **No momento do uso:** ao começar o mandato (Investidura) e de novo ao escrever o epitáfio/Carta.
3. **Versionado:** guardar `text_version` + carimbo de tempo por escolha (`raw/03` `consents jsonb` já prevê).
4. **Revogável em um clique**, com efeito em prazo declarado; aviso honesto: "**não posso recolher cópias que outras pessoas já tenham feito**".
5. **Nunca condicionar o jogo:** menor **não** pode ser obrigado a fornecer dado além do necessário para jogar (**LGPD art. 14 §4 — [VERIFICADO]**).
6. **Padrão para falecido/inalcançável:** o mais privado que preserve L0 (§B.5.5).
7. **Menor:** consentimento **específico e destacado de um responsável** (art. 14 §1º **[VERIFICADO]**) + "esforços razoáveis" para verificar que foi ele (§5º); **nada** de nome civil/retrato/mensagem de menor na Crônica pública sem isso; **mensagens de menor ficam seladas até os 18** (a pessoa decide então se publica).
8. **Herdeiro/sucessor nunca consente pelo predecessor.**

Texto do aviso: **§B.13, Modelo 2.**

---

### B.7 Menores de idade

#### B.7.1 O que a lei diz (verificado)

- **Código Civil:** menores de **16** são **absolutamente incapazes** (art. 3º) — atos por representante; **16–18** relativamente incapazes (art. 4º); a incapacidade cessa aos **18** (art. 5º) **[VERIFICADO — transcrição em modeloinicial.com.br]**. Criança < 12 / adolescente 12–18 (ECA, Lei 8.069/1990, art. 2º **[M]**).
- **LGPD art. 14 [VERIFICADO — espelho]:** tratamento "em seu melhor interesse"; consentimento **específico e destacado** de ao menos um responsável (§1º); informações públicas sobre dados e exercício de direitos (§2º); **proibido condicionar jogo/aplicação a mais dados que o estritamente necessário (§4º)**; esforços razoáveis para verificar o consentimento (§5º); linguagem simples e adequada (§6º). **Enunciado CD/ANPD 1/2023 (22/05/2023):** dados de crianças e adolescentes podem ser tratados com **qualquer** base dos arts. 7º ou 11, **desde que prevaleça o melhor interesse** **[VERIFICADO — gov.br/anpd; resumo em escritórios]**.
- **ECA Digital (Lei 15.211/2025)** — sancionada **17/09/2025**, **em vigor desde 17/03/2026**; **Decreto 12.622/2025** designou a ANPD como autoridade; **Decreto 12.880/2026** (18/03/2026) regulamentou **[VERIFICADO — gov.br/anpd]**. Pontos que atingem este jogo **[VERIFICADO em fontes secundárias: juridico.ai, Souto Correa, Conjur; conferir artigos no texto oficial]**:
  - **Escopo:** produto/serviço "direcionado a crianças e adolescentes ou de acesso provável por eles" (art. 1º), **independentemente do país do fornecedor**.
  - **Art. 14:** medidas técnicas para **aferir idade de modo confiável** — **autodeclaração isolada é vedada** (Souto Correa) — e **art. 24 §3º do decreto:** dados de aferição apagados imediatamente.
  - **Art. 15:** **contas de menores de 16 anos vinculadas a conta de responsável**, com limites de tempo, restrição de contatos, aprovação de compras, relatórios de uso.
  - **Art. 20:** **loot boxes proibidas** em jogos de acesso provável por menores (art. 2º IV define). **O Danger Ghost não tem loot box hoje — manter assim**, e não introduzir "caixas aleatórias" no Legado.
  - **Art. 21:** jogos com interação entre usuários: **interação limitada por padrão**, consentimento dos responsáveis, moderação.
  - **Art. 22:** proibição de perfilamento comportamental/publicidade dirigida a menores.
  - **Art. 31:** relatórios de transparência semestrais para provedores com **> 1 milhão de usuários menores** (não é o caso).
  - **Art. 35:** sanções (§B.1.1).
  - **Art. 9º/10 do decreto:** uso compulsivo e design manipulativo (§B.1).
- **Cronograma de fiscalização:** §B.1.1.

#### B.7.2 O jogo já está exposto hoje (independente do Legado)

Chat global, mural Egregora, amizades por e-mail, galeria de imagens, sem idade, sem responsável, sem moderação formal, sem canal de denúncia, sem Termos. **Se houver menores jogando** (dado a levantar: distribuição de idade — **peço autorização ao dono para levantar; não consultei nada**), o jogo já está em desconformidade provável com arts. 15 e 21. **Isso é o item nº 2 da lista de urgências** (§B.14). O Legado só **aumenta** a exposição (crianças herdando).

#### B.7.3 Proposta de fluxo para menores (alinhada com `raw/01` F6 e `raw/03` T30)

1. **Campo de idade** no cadastro (faixa: <13 / 13–15 / 16–17 / 18+). Usar como **sinal** para defaults conservadores; **não** como "verificação confiável" — a ANPD distingue **aferição** (estimar/inferir faixa, proporcional ao risco) de **verificação** (alta confiança, para bets/álcool/tabaco) **[VERIFICADO — Data Privacy Brasil]**; o advogado diz **qual nível** cabe a um jogo sem compras e sem conteúdo adulto.
2. **< 16:** conta **vinculada a responsável** (art. 15); **Custodiante adulto** é a parte contratante (`raw/03` papel "Custodiante"); chat/Egregora/amigos/galeria **desligados por padrão** (art. 21); sem compras (o jogo não tem).
3. **16–17:** relativamente incapaz; recomendo **também** vínculo a responsável e mesmos padrões (mais simples que criar um terceiro regime).
4. **Guardião (titular contratual com direitos de Passagem):** só **18+**; menor **joga** sob conta vinculada, mas quem "detém" a Linhagem contratualmente é o Custodiante até os 18 (`raw/03` T30: no aniversário de 18, as credenciais passam ao próprio, **mesmo mandato**).
5. **Herdeiro menor:** a Linhagem **não** é atribuída automaticamente (`raw/01` F6): fica **em Custódia** até (i) o responsável aceitar formalmente e vincular conta supervisionada, ou (ii) os 18. Recusa sem rastro além do fato. **Sem pressão:** o texto ao responsável é um **convite**, nunca "sua filha precisa continuar".
6. **Dados de menor na Crônica:** só **L0**; alias **somente** com confirmação do responsável; **nenhum** nome civil, retrato ou mensagem pública **sem** consentimento específico do responsável; mensagem do menor **selada até os 18**.
7. **Menor que morre/adoece:** o jogo **para as automações** (escada de dormência, e-mails de "silêncio") e passa a **canal humano** — um e-mail de "seu Guardião está em silêncio" a uma família enlutada é um dano evitável. Pedido: botão "pausar avisos" e canal de contato humano **[HIPÓTESE de cuidado; sem base legal citada]**.
8. **Ao completar 18:** re-aceite dos Termos como titular (ratificação).

---

### B.8 Recusa, dormência e conta órfã (o que a conformidade impõe)

(Os prazos e estados são de `raw/03`: dormente aos **365 d**, órfã/Custódia aos **730 d**, adoção após Custódia **≥ 5 anos**. Aqui só as **restrições jurídicas** dessa escada.)

- **Aviso antes de tudo (modelo Google):** ≥3 tentativas ao e-mail do titular, espaçadas, **antes** de notificar Herdeiro/Curador; nunca apagar o estado do jogo por inatividade (o contraexemplo é Microsoft/Google apagando contas em 2 anos).
- **Minimização na Custódia:** ao entrar em Custódia, **apagar** e-mail em claro e nome civil após um prazo declarado (D6), manter **L0**, o fantasma e o estado. Manter um **meio de reivindicação** que não dependa de e-mail (Selo físico — `raw/03` §2.3).
- **Custódia não é confisco:** o Guardião ou o Herdeiro podem reivindicar. **Adoção por estranho** só após ≥5 anos **com trilha de avisos documentada** e identidade anterior já removida; o Termo deve prever, desde o cadastro, que **contas dormentes revertem à custódia do operador** (licença, não propriedade — se o titular concordou com isso no contrato, a reatribuição é coerente; **pergunta ao advogado**, sobretudo diante de herdeiro civil que apareça depois).
- **Recusa:** nada além do fato de que "uma oferta não foi confirmada"; e-mail do Herdeiro apagado em N dias; lista "nunca me convide" só com HMAC e prazo (§B.5.4-c).
- **Disputa entre dois pretendentes:** o operador (ou árbitro nomeado) decide com base na **Carta registrada + log de Passagem**; Termos definem foro e recurso (advogado valida).

---

### B.9 Instrução de sucessão dentro do jogo (a "Carta de Sucessão")

- **Nome:** **não** "testamento" — testamento tem formalidades legais **[M]**. Usar **Carta de Sucessão** (já em `raw/03`) e dizer nos Termos e na tela: "**esta Carta vale só dentro do jogo; não substitui testamento, inventário ou ordem judicial**".
- **Pode:** designar Herdeiro + suplente; Carta selada; escolhas de privacidade da Crônica (inclui "depois da minha morte"); pedido de "quem não pode herdar".
- **Não pode:** dispor de bens fora do jogo; citar preço; contrariar a lei; criar condição ao Herdeiro (`raw/01` P3: nada de "só herda se jogar X horas").
- **Histórico de revisões:** a **última revisão válida vence**; revisões anteriores ficam (evidência).
- **Ponte com o mundo real (proposta):** gerar um **PDF "Certificado de Designação"** (com o Selo, a data e o hash) que o jogador possa **anexar ao testamento real** ou entregar a advogado/cartório — o jogo **não** afirma efeito legal, mas o documento **existe fora do servidor** (mesma lógica da chave impressa da Apple). **[HIPÓTESE]**
- **Curador (incapacidade sem morte):** papel opcional, limitado (`raw/03`): avisos, informar impedimento, iniciar Passagem **só** ao Herdeiro já designado. **Pergunta ao advogado:** limites de representação.

---

### B.10 Anti-RMT (compra e venda de contas)

#### B.10.1 Legalidade da proibição

- Proibir venda/aluguel/troca de contas por contrato é **prática universal** (Steam §1.C; PSN; Nintendo) **[VERIFICADO]** e, em regra, **lícita**. O que a lei brasileira **exige** é **procedimento justo**: relação jogador–plataforma é de **consumo**; sanções sem prova ou sem chance de contestação podem ser **nulas** e gerar **dano moral** — e há decisões que consideram **proporcional o banimento quando há prova de uso de programas proibidos** (ex.: bots) **[VERIFICADO, fonte secundária — Âmbito Jurídico/TJSC/TJSP, resumos; conferir acórdãos]**. Não consegui confirmar o que a **Lei 14.852/2024** (marco legal dos jogos eletrônicos) diz sobre contestação de sanções: fontes secundárias citam "clareza nas sanções e mecanismos de contestação"; o texto que li da lei fala em classificação indicativa e microtransações (art. 3º §2º) — **[não verificado; advogado confere]**.
- **Compra de conta de terceiro** costuma virar **golpe** (o vendedor recupera a conta); crime de **estelionato** (CP art. 171 **[M]**). O operador **não arbitra** disputas privadas; os Termos remetem à polícia/Procon e **não** compensam quem comprou fora do rito.

#### B.10.2 Como conciliar "Passagem" (permitida) e "venda" (proibida)

O problema técnico é que uma Passagem legítima e uma venda **são idênticas por fora** (troca de controle). O operador **não vê dinheiro**. Logo: **tornar o caminho legítimo o único fácil, e o de venda, caro e arriscado**:

1. **Único canal:** Passagem oficial com Herdeiro **designado antes** (≥30 d) — `raw/03` T4.
2. **Guarda mínima 180 d** antes de poder passar (exceto morte/incapacidade) — mata o "comprar, flipar" (`raw/03` T4).
3. **Sem troca de e-mail/senha nos 30 d anteriores** (`raw/03` T4) e **sessão única** (`raw/05`).
4. **Passagem gratuita atestada:** na Investidura, **os dois** declaram que **nada foi pago ou prometido** em troca. Falsa declaração = violação dos Termos (quebra o "**preço** implícito" da venda; inverte o ônus para os partes). **[HIPÓTESE — o advogado avalia validade/utilidade.]**
5. **Notificação em todos os canais** ao Guardião de saída; **Vigília** de 14 d cancelável (`raw/03`).
6. **Nada revendável:** ranking é da Linhagem (o "assento"), não da pessoa; relíquias honoríficas (`raw/03` §anti-RMT) — **não criar valor monetário** (também ajuda contra herdeiro civil, §B.3.3).
7. **Teto diário** (`raw/05`): comprar uma conta não compra **tempo**; e o comprador não acelera nada.
8. **Limite de frequência:** uma mesma identidade aceitando Passagens em série é sinal forte (`raw/05` sinais).

#### B.10.3 Cláusula: esboço (redação no Modelo 1, §B.13)

Proibido: vender, comprar, alugar, leiloar, trocar por valor, ou **oferecer/aceitar vantagem** em troca de conta, personagem, "vaga de Herdeiro" ou designação. **Sanções em escada:** aviso → congelamento com revisão → perda do direito de Passagem → encerramento; **cada sanção com motivo em linguagem simples, prazo para apelar (ex.: 30 d) e revisão humana**. **Sem reembolso** a quem comprou fora do rito.

#### B.10.4 Sinais de detecção (privacidade mínima)

Mudança de dispositivo/região/idioma **junto** com troca de credencial; Herdeiro designado poucos dias antes sem vínculo prévio; muitas aceitações da mesma identidade (limite suave anual) — alinhados com `raw/03` §anti-RMT e `raw/05`. **Regra:** registrar **o sinal**, não o histórico de navegação; prazo curto; **decisão automática de sanção sempre com revisão humana** (LGPD art. 20 **[M]**). **Não gravar IP em disco** a menos que a obrigação legal exija (§B.4).

#### B.10.5 Limites honestos

- O operador **não impede venda privada**: só a torna **não suportada, arriscada e sem recurso**.
- O **Selo físico** (papel) também pode ser vendido.
- Um **mercado oficial** (ex.: alguns MMOs tiveram "bazar de personagens" **[M — não verificado]**) resolveria a dor, mas cria valor monetário, obriga a operar pagamentos e **agrava** a discussão de "bem de valor econômico" (§B.3.3) — **não recomendo**.

---

### B.11 Responsabilidade do operador por 1.100 anos

**Verdade de partida:** nenhum direito, contrato ou entidade brasileira dura 1.100 anos com garantia. O que se projeta é uma **cadeia de operadores** e um **compromisso claro** do que acontece quando a cadeia quebra. Este relatório **descreve** as opções e **quem procurar**; não escolhe por você.

#### B.11.1 Quem responde se o jogo acabar?

- **Hoje:** você, pessoa física (ou o CNPJ, se houver), como **controlador** e **fornecedor** perante consumidores **[M]** — responsabilidade **pessoal e ilimitada** se não houver pessoa jurídica. Um dev solo com crianças e dados pessoais é, por si só, **razão para constituir entidade antes de crescer**. **[HIPÓTESE]**
- **Morte do operador:** contratos, domínio, VPS e a "conta" de cada usuário passam ao **seu espólio**; sem testamento e sem quem opere, o serviço cai. **Cláusula de cessão a sucessor** nos Termos + **testamento** do dono sobre marca/código/domínio + **acesso de emergência** (`raw/04`, break-glass) são o mínimo.
- **Encerramento de serviço — o que o Brasil exige hoje:** **não há lei específica** sobre aviso prévio/exportação quando um jogo online acaba; valem princípios gerais do CDC (boa-fé, informação clara) **[M]**. Em movimento: **PL 3612/2026** (Dep. Jandira Feghali, apresentado **22/07/2026**): **aviso ≥180 dias**, e após o fim **uma** de três: atualização offline, ferramentas para servidores da comunidade, ou reembolso proporcional; multa de R$ 500 mil ou 1% do faturamento no Brasil; **fase inicial, sem aprovação**, 360 dias de vacatio se aprovado **[VERIFICADO, fonte: Rolling Stone Brasil; conferir na Câmara]**.
- **Fora do Brasil:** a Comissão Europeia (**Comunicação de 16/06/2026**) respondeu à iniciativa "Stop Destroying Videogames" (1.294.188 assinaturas) que **não** pode propor obrigação legal de manter jogos jogáveis; vai tratar de um **código de conduta** sobre "fim de vida" até o fim de 2026 **[VERIFICADO — citizens-initiative.europa.eu]**. **Califórnia AB 2426 (vigente desde 01/01/2025):** vendedores de bens digitais devem informar que é **licença**, não propriedade **[VERIFICADO — Cooley/Sidley/Greenberg]**; a Ubisoft, processada pelo fim de *The Crew* (mar/2024), sustentou que jogadores tinham "licença limitada" **[VERIFICADO, fonte secundária]**. **Lição:** a defesa "é licença" é aceita **se for dita com clareza antes**; o dano de reputação e o risco de ação vêm de **fechar sem aviso**.
- **Recomendação:** um **Compromisso de Encerramento (Sunset Charter)** nos Termos: aviso **≥180 dias** (igual ao PL 3612), **exportação** do estado do jogador em formato aberto (JSON, `raw/04`), **arquivo estático** da Crônica sob licença aberta, e **transferência** a entidade sucessora quando possível; **sem** prometer sobrevivência.

#### B.11.2 Veículos jurídicos no Brasil (o que cada um exige)

| Opção | O que é / requisitos | Prós | Contras / riscos | Quem procurar |
|---|---|---|---|---|
| **A. Seguir como pessoa física / MEI / Ltda** | Sem estrutura nova | Zero custo | Mortal; responsabilidade pessoal; não sobrevive ao dono | Contador |
| **B. Associação civil sem fins lucrativos** (CC arts. 53–61 **[M]**) | ≥2 pessoas, estatuto, registro no Cartório de Registro Civil de Pessoas Jurídicas **[M]**; sem aprovação do Ministério Público **[M]** | Barata e rápida; pode receber **doação da marca/código/domínio**; sem capital mínimo | Governada por membros (pode dissolver); **não** é perpétua por desenho; depende de gente ativa | Advogado + cartório |
| **C. Fundação de direito privado** (CC arts. 62–69) | Instituída por **escritura pública ou testamento**, com **dotação especial de bens livres**; fim **dentro da lista do art. 62 parágrafo único** (inclui **cultura/defesa e conservação do patrimônio histórico e artístico**; **pesquisa científica, desenvolvimento de tecnologias alternativas … e divulgação de informações técnico-científicas**; educação etc.); **o Ministério Público aprova o estatuto e avalia se o patrimônio basta** e **vela** pela fundação (art. 66); se o fim se torna **ilícito, impossível ou inútil**, o MP pede extinção e **o patrimônio vai para outra fundação de fim igual/semelhante** (art. 69) **[VERIFICADO — texto do art. 62/66 (modeloinicial) e art. 69 (modeloinicial/MPSC)]** | **Perpetuidade por desenho + fiscal externo + sucessão embutida (art. 69)**; ideal para "guardar o legado" | Precisa de **patrimônio** (sem valor fixo em lei **[M]**); MP pode entender que um **jogo** não é "cultura"; burocracia de meses; custo | Advogado (terceiro setor) + contador + cartório/tabelião |
| **D. Fundo patrimonial (endowment) — Lei 13.800/2019** | **Organização gestora** com personalidade própria e **segregada da instituição apoiada**; **Conselho de Administração + Comitê de Investimentos**; apoia fins de interesse público (educação, ciência/tecnologia, cultura…) **[VERIFICADO — IDIS/BNDES/Ibram]** | O jeito reconhecido de **financiar perpetuamente** hospedagem/domínio com rendimento | **Pesado** para um projeto pequeno; precisa de doações reais e instituição apoiada de interesse público | Advogado + contador |
| **E. Trust / fidúcia** | **Não existe** trust anglo-saxão no Brasil. **PL 4758/2020** (contrato de fidúcia) segue no Senado (CAE, relator Sen. Angelo Coronel; **última ação registrada 17/12/2024** — página possivelmente desatualizada) **[VERIFICADO — senado.leg.br; conferir]**. **Fideicomisso** do Código Civil é limitado (arts. 1.951 ss. **[M]** — em geral sucessão testamentária, poucas gerações). Trust estrangeiro: tributação e câmbio (declarações ao BC/Receita) **[M]** | Flexível em tese | Não é solução hoje; risco tributário/cambial | Advogado internacional + contador |

**Trajetória sugerida (Decisão D8):** **agora** — cláusula de cessão nos Termos + **testamento do dono** sobre o jogo + break-glass (`raw/04`); **antes da primeira Passagem real** — **Associação** que recebe marca, código, domínio e contratos por **doação/cessão**; **quando houver dotação** — **Fundação** (com estatuto que **nomeia a associação e o fundo** como sucessores); **se crescer** — fundo patrimonial (Lei 13.800). **[HIPÓTESE de sequência; cada passo exige advogado.]**

**Dinheiro como parâmetro de durabilidade:** com retirada sustentável de 4% ao ano **[HIPÓTESE]**, cada US$ 100/mês de hospedagem pede ≈ US$ 30.000 de principal (100 × 12 ÷ 0,04) **[CÁLCULO]**. Doações à fundação, cosméticos ou qualquer receita → **tributação, CDC, meios de pagamento e (para menores) loot boxes/compras** → **contador e advogado**. **Manter o jogo sem monetização** simplifica a conformidade enquanto possível.

#### B.11.3 Propriedade intelectual, licença e marca

- **Software:** proteção de **50 anos contados de 1º de janeiro do ano seguinte à publicação** (Lei 9.609/1998); obras autorais (arte, texto, música): **vida do autor + 70 anos** (Lei 9.610/1998) **[VERIFICADO, fonte secundária — resumos da Lei do Software]**. **Consequência:** o horizonte de 1.100 anos **excede qualquer prazo de direito autoral**; o código cairá em domínio público de qualquer modo (~2077+). O que a licença resolve é **o uso legítimo nos próximos 50 anos** e a **disponibilidade prática** (quem tem o código-fonte).
- **Sem licença, ninguém pode legalmente reconstruir o jogo** (`raw/04`); "sem dono ativo" ≠ "livre".
- **Opções de licença [M — advogado de PI confirma]:** **AGPL-3.0** (copyleft de rede: quem opera uma versão modificada por rede precisa publicar o código; bom para servidor) · **MIT/Apache-2.0** (permissivas: máxima sobrevivência, permitem forks fechados) · **CC BY-SA 4.0** para arte/texto originais · **CC0** para dedicar ao domínio público. A **AGPL** é compatível com o Brasil (estudo governamental concluiu que a GPL é consistente com o ordenamento — fonte secundária).
- **Auditoria de cadeia de titularidade (pré-requisito):** só se licencia o que se **possui**. Antes de abrir o código: fontes, sprites, música (ex.: `Ghostly Quest 8-Bit.mp3` — **procedência não verificada**), nomes, espécies da Ghostdex, bibliotecas. O CLAUDE.md da raiz cita uma pasta `danger_dave_source/` como "artefato de trabalho antigo": **confirmar se algum código/arte de terceiros (Dangerous Dave é obra comercial de 1990) entrou no jogo** — se sim, **não pode** ser relicenciado por você. **[HIPÓTESE de risco; a pasta é "scratch" segundo o CLAUDE.md raiz — confirmar]** Cessão de direitos de **colaboradores/artistas** (se houver) por escrito.
- **Marca:** "Danger Ghost"/"Ghost Games": **busca de anterioridade** e registro no INPI (classes de jogos/software **[M]**); a marca vale 10 anos, **renovável indefinidamente** (Lei 9.279/1996 **[M]**); deve pertencer à **entidade**, não à pessoa. **Domínio `ghostgames.club`**: registrado no nome da entidade, com trava e 2FA (`raw/04`).
- **Quem pode ser dono:** o dono cede/doa código, arte e marca à entidade (contrato de cessão e, se for **fundação**, faz parte da **dotação** — avaliar valor e tributação com contador).

---

### B.12 Esboço de tópicos dos Termos de Uso (para o advogado — lista, não redação)

1. Partes, definições, idioma (D11) e versionamento/re-aceite. 2. Idade mínima, contas vinculadas a responsável, capacidade. 3. **Natureza da conta (licença)**. 4. **Passagem oficial e Carta de Sucessão (efeito só no jogo)**. 5. Morte, incapacidade e Curador; herdeiro civil. 6. Dormência, Custódia e adoção. 7. **Crônica: licença de exibição com limites, camadas e consentimento**. 8. **Proibição de RMT, sanções, apelação, sem reembolso**. 9. Conduta e conteúdo de usuário (moderação, denúncia). 10. **Dados pessoais** (remete à Política; retenção; canal do titular). 11. **Cessão a entidade sucessora**. 12. **Encerramento (sunset)**. 13. Sem garantia de duração; limites de responsabilidade **dentro do que o CDC permite**. 14. Lei aplicável e **foro** (consumidor pode demandar no domicílio — CDC art. 101, I **[M]**). 15. Alterações.

---

### B.13 Textos-modelo (EN + PT-BR) — **RASCUNHOS — VALIDAR COM ADVOGADO HABILITADO**

> **Antes de usar qualquer um: são rascunhos; não constituem redação final nem aconselhamento jurídico.** Colchetes `[ ]` = valores/nomes que **o dono decide** (ver Decisões). Os textos supõem que os mecanismos existam; **não publicar** uma promessa que o jogo ainda não cumpre.

#### Modelo 1 — Cláusula de sucessão para os Termos de Uso

**DRAFT — validate with a licensed attorney before use.**

> **X. Your Account, Custody and Succession**
>
> **X.1 A licence, not property.** The Account, the Ghost Lineage it holds and the Chronicle are made available to you under a personal, non-exclusive, revocable licence to use the Service. You do not acquire ownership of them, and we do not recognise any monetary value in them. This does not limit any right you have under mandatory law.
>
> **X.2 Custody.** While you are the Keeper, you hold the Lineage in custody for the Keepers who come after you. You may not delete, reset or misrepresent the Lineage's history.
>
> **X.3 The only supported hand-off.** You may pass the Lineage only through the official Handover ritual, to the person you named as Heir in your Letter of Succession. Any other transfer — including selling, buying, renting, auctioning, sharing credentials, or exchanging the Lineage, a Heir slot or a designation for money or any other benefit — is prohibited and is not recognised by us.
>
> **X.4 The Handover is free.** At the Handover, the outgoing Keeper and the Heir each confirm that nothing was paid, given or promised in exchange. A false confirmation is a breach of these Terms.
>
> **X.5 The Letter has effect only inside the game.** The Letter of Succession is a feature of the Service. It is not a will, does not dispose of anything outside the Service, and does not replace a will, an inventory or a court order.
>
> **X.6 The Heir may always decline.** No one is obliged to continue a Lineage. An Heir may decline at any time, without giving a reason and without penalty.
>
> **X.7 If a Keeper dies or cannot act.** The designated Heir may start a claim using the Seal and control of the e-mail address named in the Letter; a waiting period applies. Family members recognised by law may ask us to close the account, turn it into a memorial, or remove personal information; we may ask for documents. We will not disclose private content (for example sealed Letters or messages) except as required by law or by court order.
>
> **X.8 Other heirs.** If someone other than the designated Heir claims rights over the Account, we will, to the extent the law requires, provide the personal data of the deceased Keeper and act on requests to close or remove data. Unless a court orders otherwise, we are not obliged to transfer the Lineage to anyone other than the designated Heir.
>
> **X.9 Minors.** A person under 18 may play only through an account linked to a legal guardian. A legal guardian confirms any irreversible action (Handover, e-mail change, data deletion). At 18 the holder confirms these Terms in their own name.
>
> **X.10 Sanctions and appeal.** If we suspect a breach of X.3 or X.4 we may freeze the Account pending review. We will tell you why in plain language, and you may appeal within [30] days to a human reviewer. We do not refund or compensate anyone for a purchase made outside the Handover.
>
> **X.11 Records.** We record which version of these Terms you accepted and when.

**Tradução PT-BR (para o dono):**

> **X. Sua Conta, Custódia e Sucessão.** **X.1 Licença, não propriedade.** A Conta, a Linhagem de fantasmas que ela guarda e a Crônica são disponibilizadas sob licença de uso pessoal, não exclusiva e revogável. Você não adquire propriedade sobre elas e não reconhecemos valor monetário nelas. Isso não limita direitos que a lei imperativa lhe dê. **X.2 Custódia.** Enquanto for Guardião, você guarda a Linhagem para os Guardiões que vierem depois; não pode apagar, reiniciar ou distorcer a história dela. **X.3 Única transferência suportada.** Só se passa a Linhagem pelo ritual oficial de Passagem, à pessoa nomeada Herdeiro na sua Carta de Sucessão. Qualquer outra transferência — vender, comprar, alugar, leiloar, compartilhar credenciais ou trocar a Linhagem, a vaga de Herdeiro ou a designação por dinheiro ou outro benefício — é proibida e não é reconhecida. **X.4 A Passagem é gratuita.** Na Passagem, o Guardião que sai e o Herdeiro declaram que nada foi pago, dado ou prometido em troca; declaração falsa viola os Termos. **X.5 A Carta só vale dentro do jogo.** Não é testamento, não dispõe de nada fora do serviço e não substitui testamento, inventário ou ordem judicial. **X.6 O Herdeiro pode sempre recusar.** Ninguém é obrigado a continuar uma Linhagem; recusa-se a qualquer momento, sem motivo e sem penalidade. **X.7 Morte ou impedimento.** O Herdeiro designado pode iniciar a reivindicação com o Selo e o controle do e-mail indicado na Carta, com período de espera. Familiares reconhecidos por lei podem pedir encerramento, memorial ou remoção de dados pessoais; podemos pedir documentos. Não revelaremos conteúdo privado (ex.: Cartas seladas, mensagens) salvo exigência legal ou ordem judicial. **X.8 Outros herdeiros.** Se alguém que não é o Herdeiro designado reivindicar a Conta, forneceremos, na medida em que a lei exigir, os dados pessoais do Guardião falecido e atenderemos a pedidos de encerramento ou remoção; salvo decisão judicial em contrário, não somos obrigados a transferir a Linhagem a quem não foi designado. **X.9 Menores.** Menor de 18 só joga em conta vinculada a responsável legal, que confirma toda ação irreversível; aos 18, o titular confirma estes Termos em nome próprio. **X.10 Sanções e apelação.** Se suspeitarmos de violação de X.3/X.4, podemos congelar a Conta para revisão, explicando o motivo em linguagem simples; você pode apelar em [30] dias a um revisor humano; não reembolsamos nem compensamos compra feita fora da Passagem. **X.11 Registros.** Registramos qual versão dos Termos você aceitou e quando.

#### Modelo 2 — Aviso de consentimento da Crônica (texto de tela, em camadas)

**DRAFT — validate with a licensed attorney before use.**

> **Your page in the Chronicle**
>
> The Chronicle is the shared memory of every Keeper of this Lineage.
>
> **Always recorded (no personal data):** which Keeper you were (#N), the year you began and ended, rounded hours, levels reached, milestones. This record stays. It does not include your name, e-mail, photo or messages.
>
> **Only if you choose (each choice is separate; nothing is ticked for you):**
> [ ] Show an **alias** I choose: ________ (otherwise the Chronicle shows "Keeper #N")
> [ ] Show my **real name**
> [ ] Show a **portrait**
> [ ] Publish my **farewell note** (you will be asked again when you write it)
> After my death: ( ) keep what I chose above ( ) show only "Keeper #N"
>
> **You can change your mind at any time** in Settings > Chronicle. We will remove your alias, name, portrait and notes from the live Chronicle within [30] days. We cannot recall copies that other people already made.
>
> **If you cannot be reached or you have died,** we show only what you chose and, when unsure, only "Keeper #N". Close relatives may ask us to remove more.
>
> **You can play the full game without choosing any of these.** [Under 18: a parent or guardian must confirm each choice, and farewell notes stay sealed until you turn 18.]
>
> Consent text v[1] · [date] · [contact e-mail for privacy requests]

**PT-BR:**

> **Sua página na Crônica.** A Crônica é a memória compartilhada de todos os Guardiões desta Linhagem. **Sempre registrado (sem dado pessoal):** qual Guardião você foi (#N), o ano de início e fim, horas arredondadas, níveis, marcos. Isso permanece e não inclui seu nome, e-mail, foto ou mensagens. **Só se você escolher (cada escolha é separada; nada vem marcado):** mostrar um **apelido** seu (senão aparece "Guardião #N"); mostrar seu **nome real**; mostrar um **retrato**; publicar sua **mensagem de despedida** (perguntaremos de novo quando você a escrever). **Depois da minha morte:** manter o que escolhi / mostrar só "Guardião #N". **Você pode mudar de ideia quando quiser** em Configurações > Crônica; removeremos apelido, nome, retrato e mensagens da Crônica ao vivo em até [30] dias; não conseguimos recolher cópias que outras pessoas já fizeram. **Se não pudermos falar com você ou você tiver falecido**, mostramos só o que você escolheu e, na dúvida, só "Guardião #N"; parentes próximos podem pedir remoção maior. **Você joga o jogo inteiro sem escolher nada disso.** [Menores de 18: pai/mãe/responsável confirma cada escolha, e mensagens de despedida ficam seladas até você fazer 18.] Texto de consentimento v[1] · [data] · [e-mail para pedidos de privacidade].

#### Modelo 3 — Aviso "sem garantia de 1.100 anos"

**DRAFT — validate with a licensed attorney before use.**

> **A promise we can keep, and one we cannot**
>
> Danger Ghost is designed so a Lineage can be handed down for generations. **Nobody can guarantee a game will run for 1,100 years — not us, not anyone.** Servers fail, companies close, laws and technology change.
>
> **What we commit to:**
> - We will [keep the game running as long as we reasonably can] and keep a written plan for its continuation, including a successor organisation ([entity name, when it exists]).
> - If we ever have to stop, we will give at least **[180] days' notice** in the game, on our website and by e-mail where we have one.
> - Before we stop, you will be able to **export your Ghost's data** in an open format, and the Chronicle's facts will be published as a static archive.
> - We will not delete an account's game state only because it was inactive.
>
> **What we do not promise:** that the service will run for any set time; that the Chronicle or your account will exist forever; that anything in the game has monetary value.
>
> **No pressure:** you never owe the game your time. There is no penalty for missing a day, a year or a generation, and no one has to continue a Lineage.

**PT-BR:**

> **Uma promessa que podemos cumprir e uma que não.** O Danger Ghost foi desenhado para que uma Linhagem passe por gerações. **Ninguém pode garantir que um jogo funcione por 1.100 anos — nem nós, nem ninguém.** Servidores falham, empresas fecham, leis e tecnologia mudam. **Nos comprometemos a:** [manter o jogo no ar enquanto for razoavelmente possível] e manter um plano escrito de continuidade, incluindo uma organização sucessora ([nome da entidade, quando existir]); se precisarmos parar, avisar com **[180] dias** de antecedência, no jogo, no site e por e-mail quando houver; antes de parar, permitir **exportar os dados do seu fantasma** em formato aberto e publicar os fatos da Crônica como arquivo estático; **não apagar** o estado de jogo de uma conta só por inatividade. **Não prometemos:** que o serviço funcione por prazo determinado; que a Crônica ou sua conta existam para sempre; que algo no jogo tenha valor monetário. **Sem pressão:** você nunca deve seu tempo ao jogo. Não há penalidade por faltar um dia, um ano ou uma geração, e ninguém é obrigado a continuar uma Linhagem.

#### Modelo 4 — Política de conta órfã

**DRAFT — validate with a licensed attorney before use.** (Prazos = `raw/03`; **[valores]** são decisão do dono.)

> **If nobody is playing a Lineage**
>
> **1. Dormant ([365] days without a login).** The account is still the Keeper's. We write to the e-mail on file up to [3] times over [180] days, then to the designated Heir and Curator, if any. Logging in at any time brings the account back with no penalty.
> **2. Custody ([730] days of silence and no Heir acting).** The Lineage is frozen and held by [us / the Foundation]. It is not seized and it is not sold. Its game state, Ghost and Chronicle facts are kept. We **minimise personal data**: after [N] years in Custody we delete the Keeper's e-mail and any name, leaving "Keeper #N". The former Keeper or the Heir may still claim it using the Seal.
> **3. Adoption (only after at least [5] years in Custody).** A new Keeper may adopt a Lineage after public notice, a waiting period and acceptance of the Keeper's Terms. Adoption is free; it cannot be bought or sold. The adopter sees only the Chronicle facts, never the previous Keeper's private data.
> **4. Never shaming.** We will not describe a Lineage as "abandoned" or "dead"; the word is "dormant".
> **5. Sensitive situations.** If you tell us a Keeper has died or is seriously ill, we pause automatic messages and a person will contact you.
> **6. Nothing is sold; no Lineage is deleted for inactivity.**

**PT-BR:**

> **Se ninguém estiver jogando uma Linhagem.** **1. Dormente ([365] dias sem login):** a conta continua do Guardião; escrevemos ao e-mail cadastrado até [3] vezes em [180] dias, depois ao Herdeiro e ao Curador, se houver; um login a qualquer momento a reativa, sem penalidade. **2. Custódia ([730] dias de silêncio e nenhum Herdeiro agindo):** a Linhagem fica congelada e guardada por [nós / pela Fundação]; não é confiscada nem vendida; guardamos estado de jogo, fantasma e fatos da Crônica; **minimizamos dados pessoais**: após [N] anos em Custódia apagamos e-mail e nome, restando "Guardião #N"; o antigo Guardião ou o Herdeiro ainda podem reivindicar com o Selo. **3. Adoção (só após ao menos [5] anos em Custódia):** um novo Guardião pode adotar uma Linhagem após aviso público, espera e aceite dos Termos do Guardião; é gratuita, não se compra nem se vende; o adotante vê só fatos da Crônica, nunca dados privados do anterior. **4. Sem vergonha:** nunca descrevemos uma Linhagem como "abandonada" ou "morta"; a palavra é "dormente". **5. Situações sensíveis:** se você nos avisar que um Guardião faleceu ou está gravemente doente, pausamos as mensagens automáticas e uma pessoa entrará em contato. **6.** Nada é vendido; nenhuma Linhagem é apagada por inatividade.

---

### B.14 Lista final: o que exige profissional real — por urgência

**Bloco 1 — URGENTE, independente do Legado (o jogo já está no ar):**

| # | Item | Profissional | Por quê / gatilho |
|---|---|---|---|
| 1 | **Termos de Uso + Política de Privacidade** (não existem) e **aceite versionado** no cadastro | Advogado de direito digital/LGPD | Transparência (LGPD), contrato de consumo; base de tudo. |
| 2 | **Enquadramento no ECA Digital**: nível de aferição de idade adequado; vínculo <16 (art. 15); interação limitada e moderação (art. 21) para chat/Egregora/amigos/galeria; canal de denúncia | Advogado (ECA Digital/LGPD) | Jogos = presunção de acesso provável; fiscalização até **nov/2026–jan/2027**. |
| 3 | **Canal do titular** (e-mail de privacidade), **registro simplificado** das operações de tratamento, **runbook de incidente** (3 dias úteis), **rota de exclusão de conta** | DPO/consultor de privacidade + dev | Hoje o art. 18 é inexequível. |
| 4 | **E-mail em texto puro nos logs** (retenção e mascaramento); região/contrato do **Supabase e da VPS** (operadores, transferência internacional) | Advogado + `security-engineer` | Dado pessoal sem prazo; transferência internacional. |
| 5 | **Texto "records… on the blockchain"** (`index.html:1026`) contradiz o produto | Advogado (consumidor) + dono | Publicidade enganosa; expectativa falsa de imutabilidade. |

**Bloco 2 — ANTES de anunciar o Legado ou aceitar o 1º Herdeiro real:**

| # | Item | Profissional |
|---|---|---|
| 6 | **Parecer escrito sobre Decreto 12.880 art. 9 (recompensa por tempo de uso)** aplicado à régua e às salvaguardas S1–S12; eventual **consulta à ANPD**; **RIPD** com melhor interesse da criança | Advogado (ECA Digital) + DPO |
| 7 | Validar cláusulas: natureza da conta, sucessão, herdeiro civil, RMT/sanções/apelação, sunset, foro; **versão em português** (D11) | Advogado (digital + sucessões + consumidor) |
| 8 | **Consentimento da Crônica** e o desenho de apagamento (anonimização, HMAC/sal, arquivos, backups); se destruição de chave = eliminação | Advogado LGPD + DPO (+ perito técnico) |
| 9 | **Protocolo de menores** (Custodiante, Herdeiro menor, ratificação aos 18, mensagens seladas) | Advogado (família/ECA/ECA Digital) |
| 10 | **Constituição da entidade** (Associação → Fundação), estatuto, registro, **cessão de marca/código/domínio**, relação com o Ministério Público | Advogado (terceiro setor) + contador + cartório/tabelião |
| 11 | **Testamento do próprio dono** sobre o jogo, marca e domínio; **acesso de emergência** (break-glass) | Advogado (sucessões) + notário |
| 12 | **Auditoria de titularidade + licença** (código, arte, música, nomes; possível material de terceiros) e **registro de marca no INPI** | Advogado de PI |

**Bloco 3 — Quando houver dinheiro, crescimento ou exterior:**

| # | Item | Profissional |
|---|---|---|
| 13 | **Qualquer fluxo de dinheiro** (doações, dotação de fundação, fundo patrimonial Lei 13.800, cosméticos): tributação, CDC, meios de pagamento; loot boxes proibidas para menores | Contador + advogado |
| 14 | **Jogadores estrangeiros** (GDPR/UE, COPPA/EUA, Califórnia AB 2426): aplicabilidade | Advogado internacional (após dado de países) |
| 15 | **Revisão jurídica periódica** (a cada Passagem ou a cada 5 anos, o que vier primeiro, à la "Renovação") — a lei de 2026 não será a de 2126 | Advogado retido ou da entidade |

---

## (c) Lacunas que eu fechei

Do checklist do brief §6: **item 8 (jurídico/ética/privacidade)** completo, com contribuições aos **itens 4** (recusa, dormência, disputa, Custódia — restrições jurídicas), **5** (RMT: cláusula, sanções, apelação, limites) e **7** (operador: entidade, licença, marca, sunset, IP, dinheiro). Especificamente:
- Natureza da conta e o que os Termos devem e não devem prometer (§B.3).
- Mapa de dados real do jogo, com **9 achados independentes do Legado** (§B.2).
- Apagamento × Crônica: **quatro camadas**, três **conflitos concretos** com `raw/09`/`raw/03` e como corrigi-los (§B.5).
- **A colisão com o Decreto 12.880 art. 9º/III**, com 12 salvaguardas e 3 planos (§B.1, D1).
- Fluxo de menores, Herdeiro menor e ratificação aos 18 (§B.7).
- Escada de dormência/Custódia/adoção sob a ótica da LGPD (§B.8).
- Instrução sucessória, com o "Certificado de Designação" como ponte para o testamento real (§B.9).
- Veículos de sucessão do operador no Brasil (associação, fundação, fundo patrimonial, trust) (§B.11).
- **4 textos-modelo** EN + PT-BR (§B.13) e **15 itens por urgência** (§B.14).

## (d) Lacunas que dependem de outros departamentos

| Departamento | O que preciso dele |
|---|---|
| `progression-actuary` | (1) Confirmar S1/S8: menor credita ≤ 1 h/dia, **sem catch-up**, e a calibração tolera isso; (2) que nada mostre "atraso" a criança (S7); (3) que o nível do legado como função de `segundos_creditados` seja **reversível por bandeira** (S12/D1-C). |
| `game-economy-designer` | Auditar as 333 badges e toda recompensa para garantir **zero ganho por presença/horas** (S3); ranking e relíquias sem valor monetário; **zero loot box** (Lei 15.211 art. 20). |
| `legacy-systems-designer` | Confirmar prazos da escada (365/730 d, adoção ≥5 anos) como **[valores]** dos modelos; "pausar avisos" para luto; papel do Custodiante; Herdeiro menor em Custódia. |
| `backend-architect` (após aprovação) | Corrigir os conflitos §B.5.4 (a)–(d): `payload` só L0; `display_name` anulável; HMAC+pepper no lugar de sha256; salt por pessoa; rota de exclusão; log com e-mail mascarado; consentimentos versionados; IP não persistido. |
| `security-engineer` | `origin:'*'`; e-mail em log; Selo/Passagem (já em `raw/05`); pepper fora do banco; runbook de incidente. |
| `deep-time-archivist` | Arquivos de longo prazo **só L0 + L1 consentido** (§B.5.3); backups com expiração; âncora da futura blockchain **só hash de L0** (EDPB). |
| `localization` | **Termos em português como versão autoritativa** para consumidores brasileiros (o jogo é 100% em inglês; CDC exige informação clara em português — art. 31 **[M]**) → D11. |
| `ui-ux-designer` | Telas de consentimento em camadas (Modelo 2), "Fecho do dia", painel parental, remover o texto "blockchain". |
| `narrative-designer` | Regra de escrita sem culpa; revisão de textos voltados a menores/responsáveis. |
| `community-manager` | Moderação e canal de denúncia (Egregora/chat); política de remoção por parentes (CC art. 12). |
| `game-director` / `producer` | Decidir D1–D13; sequenciar o Bloco 1 **antes** do Legado. |

## (e) DECISÕES PARA O DONO

> Todas marcadas **[validar com advogado]** onde a validação for necessária. "Recomendação" = a minha.

**D1 — Como tratar "recompensa por tempo de uso" (Decreto 12.880 art. 9º/III) em contas de menores? [validar com advogado — crítica]**
- **A. Família com salvaguardas S1–S12 + parecer + kill-switch.** Prós: preserva o conceito (criança herda e joga); teto diário é o oposto do que o decreto combate. Contras: risco de interpretação até a ANPD orientar; exige disciplina de produto.
- **B. Adulto-only + Custódia para herdeiro menor até 18.** Prós: reduz exposição (a criança só entra aos 18). Contras: "18+" **não afasta** acesso provável se o jogo continuar atraente a menores; exige aferição de idade mais forte; exclui a infância do conceito.
- **C. Híbrido "Aprendiz":** menor joga o mesmo mundo, **sem crédito de tempo de legado** e sem régua visível; vira Guardião aos 18. Prós: remove a "recompensa por tempo" do menor. Contras: as horas da infância não contam para a linhagem — perde parte da emoção do conceito.
- **Recomendação: A**, com **C como plano B pronto** (S12). Só liberar menores na régua **depois** do parecer escrito.

**D2 — Natureza da conta.** A) **Licença + Passagem oficial** (rec.). B) Licença + reconhecimento amplo de herdeiros civis. C) "Propriedade" (não recomendo: cria valor, abre RMT e disputa). **[validar]**

**D3 — Padrão de privacidade da Crônica.** A) **Camadas + alias por padrão + apagar mapeamento** (rec.). B) A + criptografia por pessoa **apenas** no armazenamento mutável. C) **Zero dado pessoal na Crônica** (só fatos anônimos) — recomendo **como padrão para menores e falecidos**. **[validar]**

**D4 — Guardião pede exclusão.** Caminhos 1 (apagar identidade), 2 (retirar-me/Custódia), 3 (encerrar linhagem: pedido com espera 30 d e memorial L0). **Recomendação:** permitir 1 e 2 sempre; 3 com fricção. Alternativa "proibir 3" arrisca conflito com o direito de eliminação/cláusula abusiva; alternativa "botão livre" destrói o legado dos antecessores. **[validar]**

**D5 — Idade.** A) **Qualquer idade joga via conta vinculada a responsável (<16 obrigatório; 16–17 também recomendado); só 18+ é titular contratual** (rec.). B) 18+ apenas. C) 13+ apenas. **[validar]**

**D6 — Retenção (proposta, todas [HIPÓTESE]).** E-mail do Herdeiro que recusou/expirou: apagar em **30 dias**. Logs de aplicação com e-mail: **mascarar e manter ≤ 30 dias**. IP: **não gravar** (manter só em memória). Backups: expirar em **35 dias**. E-mail em Custódia: apagar após **5 anos** com HMAC "nunca me convide" por até **5 anos**. Diário/imagens: apagar com a conta.

**D7 — Parâmetros anti-RMT.** A) **Estrito:** designação ≥30 d + guarda mínima 180 d + atestado de gratuidade + sanções em escada com apelação em 30 d (rec.). B) Moderado (sem guarda mínima). C) Mercado oficial (não recomendo). **[validar]**

**D8 — Entidade operadora.** A) Só Termos+testamento+break-glass agora, entidade depois. B) **Associação agora (antes da 1ª Passagem real) → Fundação quando houver dotação** (rec.). C) Fundação direta. D) Trust estrangeiro. **[advogado + contador]**

**D9 — Licença.** A) **Abrir cliente+servidor sob AGPL-3.0 e arte/texto sob CC BY-SA 4.0** depois da auditoria de titularidade e da cessão à entidade (rec.). B) Fechado com escrow e liberação automática por gatilho. C) Fechado sem plano (não recomendo). **[advogado de PI]**

**D10 — Sunset.** A) **≥180 dias + exportação aberta + arquivo estático + sucessor** (rec.). B) 90 dias. C) Sem compromisso (contra a boa-fé do CDC).

**D11 — Idioma dos Termos.** A) **PT-BR autoritativo + tradução EN** (rec.). B) EN autoritativo. C) Bilíngue equivalente. **[advogado]**

**D12 — Conta órfã.** A) Custódia sem adoção. B) **Adoção após ≥5 anos de Custódia com aviso público e identidade já removida** (alinha `raw/03` T21; rec.). **[validar contra herdeiro civil tardio]**

**D13 — Ordem de trabalho.** Executar o **Bloco 1 (§B.14) antes** de qualquer lançamento do Legado. **Recomendação: sim.**

### Perguntas para o advogado (numeradas)

1. O inciso III do art. 9º do Decreto 12.880 alcança progressão de jogo por tempo ativo com **teto diário**? Há orientação/consulta da ANPD? Vale pedir manifestação formal?
2. Quais níveis de **aferição de idade** a ANPD espera para um jogo sem compras, sem conteúdo adulto, com chat e mural? Autodeclaração + vínculo de responsável basta?
3. Quais artigos da Lei 15.211 (14, 15, 21) já exigem ação **hoje**, com ~48 contas? E quando começam as sanções (nov/2026 ou jan/2027)?
4. Sou "agente de tratamento de pequeno porte" (Res. 2/2022) sendo pessoa física/sem receita? O tratamento de dados de menores me tira da flexibilização (art. 4º)?
5. Preciso de encarregado agora? Que canal mínimo?
6. A LGPD exige que eu grave IP (Marco Civil art. 15)? Vale para pessoa física sem fins econômicos? Para associação/fundação?
7. Um "estado de jogo" dissociado do titular deixa de ser dado pessoal? Com poucas dezenas de linhagens, "esforços razoáveis" (art. 12) permitem reidentificar L0?
8. Destruir a chave/salt de um campo cifrado/comprometido equivale a **eliminar/anonimizar** (art. 5º XI, 16, 18 VI)? Vale para backups e arquivos?
9. "Continuidade do jogo/memória cultural" pode ser base legal ou exceção do art. 16? (Suspeito que não.)
10. A cláusula "conta é licença sem valor monetário" resiste ao art. 51 do CDC e ao art. 1.784 do CC frente a herdeiro civil hostil?
11. O que o PL 4/2025 (arts. sobre bens digitais) mudaria para contas de jogos sem valor econômico? Devo esperar a votação antes de fechar a cláusula?
12. Reatribuir conta dormente (Custódia → adoção por estranho) exige consentimento do titular no contrato? É válido diante de herdeiro civil tardio?
13. O "atestado de gratuidade" na Passagem é válido/útil? Que sanção é proporcional?
14. Pedidos de parentes até 4º grau (CC art. 12) para remover conteúdo do falecido: que documentação exigir? Prazo?
15. Herdeiro menor: quem assina a aceitação da Passagem (art. 3º CC)? Que ato exige alvará/juiz? Ratificação aos 18?
16. Consentimento de responsável (art. 14 §1º LGPD): forma aceitável de verificar (§5º) sem coletar dados em excesso?
17. Mensagem de menor "selada até os 18" é adequada como proteção?
18. Termos em inglês só: são válidos para consumidor brasileiro (CDC arts. 31, 46, 54)?
19. Foro: consumidor pode demandar no domicílio; posso fixar lei brasileira? E para estrangeiros?
20. Cláusula de exoneração no encerramento: o que posso limitar? O aviso de 180 dias é suficiente?
21. Associação → Fundação: a finalidade "cultura/pesquisa" do art. 62 abrange um **jogo**? Como o Ministério Público (do meu estado) tem tratado?
22. Cessão de código/marca/domínio à entidade: forma, tributação (ITCMD/IRPF?) — com contador.
23. Fundo patrimonial (Lei 13.800): faz sentido para financiar hospedagem? Escala mínima?
24. Licença AGPL/CC BY-SA: compatível com bibliotecas e assets atuais? Há material de terceiros (`danger_dave_source/`, música, sprites)?
25. Como o testamento do dono deve tratar código, marca, domínio e contas administrativas? Break-glass legal (procuração? cofre com advogado?)
26. Texto "blockchain" em `index.html`: risco de publicidade enganosa e como corrigir?
27. Jogadores estrangeiros: GDPR/COPPA/AB 2426 se aplicam? Preciso de representante na UE?
28. Um seguro (responsabilidade civil/cyber) faz sentido para a entidade?

**Perguntas para o contador:** (1) tributação da doação/cessão de marca e código à entidade; (2) dotação de fundação e fundo patrimonial; (3) qualquer receita (doações, cosméticos): regime, nota fiscal, meios de pagamento; (4) manutenção de custo perpétuo (hospedagem, domínio) e rendimento sustentável; (5) IR do dono na cessão; (6) trust estrangeiro: declarações cambiais e tributação.

---

## (f) Riscos e o que eu NÃO consegui verificar

**Limitações de verificação:**
1. **Planalto indisponível** (ECONNRESET, 2 tentativas): os artigos da **Lei 15.211** (14, 15, 20, 21, 22, 31, 35) e da **LGPD** vieram de espelhos e escritórios; **art. 20 e 35 e 14/15 da Lei 15.211 estão em fonte secundária** (juridico.ai, Souto Correa, Conjur, Mayer Brown). Conferir no texto oficial.
2. **ANPD NT 3/2023 e Res. 15/2024:** a página oficial deu **401**; conteúdo confirmado por INPD/Conjur/escritórios.
3. **Google IAM:** prazos 3/6/12/18 meses só em fontes secundárias; a página oficial não os lista.
4. **PL 4/2025:** não recuperei **os números dos artigos** sobre herança digital; a tramitação é a de 16/06/2026 (pode ter mudado).
5. **PL 3612/2026** vem de imprensa; **PL 4758/2020**: a página do Senado mostrava **17/12/2024** (possivelmente desatualizada).
6. **Art. 19 LGPD:** divergência "15 dias" vs "15 dias úteis".
7. **Decreto 12.880 — presunção de "jogos eletrônicos"**: veio do resumo da Data Privacy Brasil; o trecho do decreto que abri remete à Lei 15.211 para "acesso provável". **Definição do art. 1º e §§ da Lei: não li no original.**
8. **Guia definitivo de aferição de idade (ago/2026):** não sei se foi publicado; **não achei orientação da ANPD sobre jogos e o inciso III**.
9. **Divergência de datas de sanção** (nov/2026 vs jan/2027).
10. **Estudo da ANPD sobre anonimização/pseudonimização** (PDF ilegível) — sem posição verificada sobre crypto-shredding.
11. **Lei 14.852/2024:** não confirmei se prevê contestação de sanções (fontes secundárias sugerem; texto lido não).
12. **Nintendo e acórdãos TJSP/TJMG/TJSC:** por resumos de busca; conferir.
13. **Marco Civil art. 15:** aplicação a pessoa física/sem fins econômicos — não resolvi.

**Riscos do próprio desenho:**
- **Risco 1 (o mais grave):** o inciso III do art. 9 ser lido literalmente contra a régua. Mitigação: S1–S12 + parecer + D1-C.
- **Risco 2:** o jogo **já está fora** do que o ECA Digital pede para chat/mural/amigos/galeria se houver menores. Mitigação: Bloco 1.
- **Risco 3:** L0 não ser "anônimo" com poucas linhagens (art. 12) → tratar como pseudonimizado.
- **Risco 4:** a promessa de perpetuidade da Crônica conflitar com direito de eliminação (mitiga: camadas + honestidade nos Termos).
- **Risco 5:** um herdeiro civil hostil (CC art. 1.784) — mitiga: sem valor monetário, Termos claros, canal de encerramento/memorial.
- **Risco 6:** **a lei muda** — a LGPD tem 8 anos; em 100 anos será outra. **Revisão jurídica periódica** (item 15).
- **Risco 7:** **e-mail não existe como infraestrutura** hoje (`raw/03` F5: sem reset de senha, sem verificação de e-mail); toda a escada de avisos e o consentimento parental por e-mail dependem disso — é **pré-requisito**.
- **Risco 8 (humano):** carregar 1.100 anos de dever numa criança. Mitigação: "se assim quiser", recusa confortável, sem culpa (`raw/01`).

**Dados que preciso que o dono autorize levantar (não consultei nada):** distribuição de idade dos jogadores; países; logs do proxy/PM2 (o que gravam e por quanto tempo); região e plano do Supabase; se os buckets de imagens são públicos; se o diário aparece a terceiros; se o chat é persistido; se há alguma cobrança/doação ou publicidade; se existem colaboradores/artistas e contratos de cessão; origem de música e sprites; conteúdo de `danger_dave_source/` versus o jogo.

**Fontes principais consultadas em 2026-09-20** (todas por WebSearch/WebFetch nesta sessão): Decreto 12.880/2026 (`www2.camara.leg.br/legin/fed/decret/2026/decreto-12880-18-marco-2026-798813-publicacaooriginal-178481-pe.html`); ANPD ECA Digital (`gov.br/anpd/pt-br/assuntos/eca-digital`); Data Privacy Brasil (guia de escopo/aferição e decreto); Souto Correa, Mayer Brown, juridico.ai, Conjur (Lei 15.211); Resolução CD/ANPD 2/2022 (`gov.br/anpd/...resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022`); Enunciado CD/ANPD 1/2023; ANPD NT 3/2023 (via INPD/Conjur); Res. 15/2024 (via Cescon Barrieu/Mattos Filho); LGPD arts. 7, 14, 18, 19 (`lgpd-brasil.info`); STJ REsp 2.124.424 (`stj.jus.br`, notícia 01/10/2025); Senado PL 4/2025 e PL 4758/2020; Senado Notícias 27/03/2026; Steam Subscriber Agreement; PlayStation ToS; Google, Apple, Facebook, Microsoft (suporte oficial); Nintendo (busca); CC arts. 3º, 12, 62, 66, 69 (`modeloinicial.com.br`); Lei 13.800/2019 (IDIS/BNDES); EDPB Guidelines 02/2025 e v2.0; Comissão Europeia (Stop Destroying Videogames); Califórnia AB 2426 (Cooley/Sidley/GT); PL 3612/2026 (Rolling Stone Brasil).

---

> **AVISO FINAL — repito.** **Eu não substituo um advogado.** Este relatório mapeia riscos e propõe desenhos; **não é aconselhamento jurídico** e os textos-modelo são **rascunhos**. **Valide cada conclusão, os Termos, a Política de Privacidade, o desenho de apagamento e qualquer estrutura de associação/fundação com advogado habilitado (OAB) e, para dinheiro, com contador — antes de qualquer lançamento.** A legislação citada foi consultada em **2026-09-20** e está em mudança.
