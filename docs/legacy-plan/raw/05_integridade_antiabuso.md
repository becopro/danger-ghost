# 05 — Integridade e Antiabuso do Jogo Legado

**Agente:** `security-engineer` · **Data:** 20/09/2026 · **Modo:** PLANO (nenhuma linha de código do jogo foi alterada; nenhum acesso a produção, banco ou credenciais)
**Brief de referência:** `docs/legacy-plan/00_BRIEF.md` · **Skills carregadas:** `digital-succession-compliance` (§7 anti-RMT), `forensic-root-cause-analysis`

> **Como ler as marcações:**
> **[VERIFICADO]** = li o código/documento e conferi com `arquivo:linha`.
> **[CÁLCULO]** = número que rodei de verdade em Node nesta sessão (script descartável, no scratchpad da sessão, fora do repo).
> **[HIPÓTESE]** = proposta de projeto ou julgamento meu, ainda não comprovado — precisa de decisão ou de teste.

> **Aviso obrigatório da skill `digital-succession-compliance`:** as partes deste relatório que tocam herança, Termos de Uso, LGPD ou venda de contas são **mapeamento de risco de engenharia, não aconselhamento jurídico**. Nada aqui substitui um advogado inscrito na OAB. O `digital-succession-counsel` cobre o lado legal; eu cubro só "isso pode ser abusado ou pode corromper dado".

---

## (a) Resumo em 10 linhas

1. Hoje **todo o XP e todo o nível são calculados no navegador do jogador** — o servidor nunca vê "matei um inimigo", só recebe o número final pronto (`js/game/engine.js:1104-1105`). **[VERIFICADO]**
2. O servidor aceita esse número final e só confere se ele está **dentro de uma faixa**; e a faixa do nível é `[1, 100000000000]` — ou seja, **1e11 é um valor válido** (`server/db.js:466-467`). **[VERIFICADO]**
3. Na prática: um cliente adulterado, já logado de forma legítima, **zera o jogo num único pacote** `save_game_state`. Não é teoria — é o caminho direto e existente. **[VERIFICADO]**
4. O "anti-cheat" do `rpg_system.js` é `btoa()` com um `salt` sorteado na própria página (`rpg_system.js:71-74, 439-473`). Ele protege contra corrupção acidental, **não contra o jogador**. Isso não é um bug novo — é o escopo real dele, e precisa ser dito em voz alta. **[VERIFICADO]**
5. **Tempo de jogo não é medido em lugar nenhum.** A coluna `"time"` existe no banco mas o cliente grava `0` e nunca incrementa (`server/db.js:160`, `js/web2/game_core.js:216`). A régua do dono (1 h/dia) **hoje não tem base nenhuma no código**. **[VERIFICADO]**
6. Várias coisas **já estão certas** e não devem ser re-sinalizadas: identidade de escrita sempre da sessão autenticada, contadores de kills/itens somados **no servidor** por delta pequeno, bcrypt, JWT verificado de verdade, rate limit de login, queries parametrizadas. **[VERIFICADO]**
7. A proposta central: **o nível do legado não vem do XP do cliente — vem do tempo ativo creditado pelo servidor.** Isso torna o cliente adulterado irrelevante para a régua, sem precisar reescrever o combate.
8. O antídoto contra bot/macro/AFK **não é detectar bot**; é o **teto diário de horas creditáveis**. Com teto de 1 h/dia, um bot rodando 24 h ganha exatamente o mesmo que um humano que jogou 1 h. **[CÁLCULO]**
9. Na posse/sucessão, o problema estrutural é que **a conta É um endereço de e-mail** (chave primária de `players`, `server/db.js:166`) e não existe troca de e-mail, troca de senha nem recuperação. Passar a conta hoje = passar a senha. Por 1.100 anos, e-mail é o elo que mais cedo apodrece.
10. Prioridade: **antes de lançar a régua**, entram tempo autoritativo + sessão única + teto diário + nível do legado derivado do tempo + rate limit nos saves. O resto (MFA, Crônica encadeada, âncora pública, UUID de conta) vem depois, mas o UUID precisa existir **antes da primeira sucessão real**.

---

## (b) Análise e proposta detalhada

### 1. Auditoria: como XP e nível são concedidos HOJE

#### 1.1 O caminho completo, do golpe ao banco

Em uma frase: **o navegador decide tudo e o servidor só arquiva.**

```
inimigo morre (no navegador)
   └─> GhostRPG.addXp(maxHp * 5)          js/game/engine.js:1104-1105 e :3311
         └─> sobe state.level localmente  rpg_system.js:1020-1047
               └─> updateIntegrityHash()  rpg_system.js:439-455  (btoa local)
                     └─> saveLocalStorage()
                           └─> socket.emit('save_game_state', {...})
                                 └─> server/index.js:812  -> savePlayerProgress/saveCharacters
                                       └─> server/db.js  -> UPSERT no Postgres
```

**Achado A1 — XP só existe no cliente. [VERIFICADO]**
`js/game/engine.js:1104-1105` e `js/game/engine.js:3311`:
```js
if (typeof GhostRPG !== 'undefined' && GhostRPG.addXp) GhostRPG.addXp(Math.floor(this.maxHp * 5));
```
São os **dois únicos** pontos de concessão de XP do jogo (busca por `addXp(` em todo o repositório `.js`; os outros resultados são comentários, `patch.js` e um teste). Ambos rodam no navegador. O servidor tem um evento `kill_boss` (`server/index.js:658-660`), mas ele **só retransmite para os outros jogadores** — não credita nada:
```js
socket.on('kill_boss', (data) => { io.emit('boss_killed', { by: socket.id }); });
```
*Em linguagem simples:* o servidor nem sabe que você matou algo. Ele descobre o resultado depois, quando o cliente manda o save.

**Achado A2 — o servidor aceita `level` e `xp` absolutos do payload; a única barreira é uma faixa que inclui 1e11. [VERIFICADO]**
`server/index.js:812-857` (`save_game_state`) chama `savePlayerProgress(email, data)` e `saveCharacters(email, data.characters)`. A validação é `sanitizeCharacterPayload` (`server/db.js:516-536`) e `sanitizePlayerProgressPayload` (`server/db.js:539-568`), que apenas conferem **faixa numérica** contra `NUMERIC_BOUNDS` (`server/db.js:466-480`):
```js
const NUMERIC_BOUNDS = {
    level: [1, 100000000000],   // <-- 1e11 é VÁLIDO
    xp: [0, 1e19],
    pointsToDistribute: [0, 1e13],
    vit: [0, 1e13], /* ... */
};
```
E `isPlausibleNumber` (`server/db.js:496-499`) é literalmente `Number.isFinite(n) && n >= min && n <= max`.

> **Cenário concreto de abuso #1 — "zerar o jogo em um pacote".**
> Um script com `socket.io-client` puro faz login legítimo (e-mail/senha reais da própria conta), e então emite:
> ```js
> socket.emit('save_game_state', { characters: [{
>     characterId: 'ghost_001', level: 1e11, xp: 0, xpRequired: 1e19,
>     vit: 1e13, agi: 1e13, int: 1e13, pow: 1e13, mag: 1e13,
>     pointsToDistribute: 0, score: 1e16,
>     weapon: { name: 'x', damage: 1e30 }
> }]});
> ```
> Cada campo está **dentro** do bound. O servidor grava. O jogador terminou, em 2026, a jornada desenhada para 3147. Nenhum log de anomalia dispara — os `console.warn` de `sanitize*` só disparam para valores **fora** da faixa.
> Isso não exige engenharia reversa: os nomes dos campos estão no código do cliente que o navegador baixa.

**Achado A3 — não existe checagem de monotonicidade nem de delta. [VERIFICADO]**
`saveCharacters` (`server/db.js:711-789`) faz um `UPSERT` com `COALESCE($n, characters.col)` — isso preserva um campo **ausente**, mas nunca compara o valor novo com o que já está no banco. Um nível pode ir de 3 para 1e11, ou cair de 1e11 para 1, sem nada acontecer. O único desempate por nível que existe (`server/db.js:720-739`) é **entre duas entradas do mesmo payload** (dedupe de `characterId`), não contra o histórico da conta.
*Em linguagem simples:* o banco não tem memória de "quanto você tinha ontem". Toda gravação é um estado novo, aceito de cara.

**Achado A4 — o `rpgAntiCheat` não é uma defesa contra o jogador (e isso está correto pelo que ele se propõe). [VERIFICADO]**
`rpg_system.js:71-74`:
```js
var rpgAntiCheat = { salt: Math.random().toString(36).substring(2, 15), hash: "" };
```
e `rpg_system.js:439-473`: `updateIntegrityHash()` faz `btoa(dataStr + salt)` e `verifyIntegrity()` recalcula e compara.

Três motivos pelos quais isso não segura um adversário:
- `btoa` é **Base64**, uma codificação reversível, não uma função de hash criptográfica.
- O `salt` é sorteado **na memória da própria página** — quem controla a página controla o salt.
- Toda função que muda o estado **recalcula o hash logo em seguida** (`rpg_system.js:1067`, `:1077`, `:1104`...). Então `GhostRPG.addXp(1e30)` digitado no console do navegador passa pela verificação por construção.

**Isto não é um defeito introduzido por alguém**: como proteção contra *corrupção acidental* de `localStorage`/memória, o mecanismo funciona e tem valor. O erro seria contar com ele como anti-cheat. **Não o remova** — só não construa a régua de 1.100 anos em cima dele.

**Achado A5 — tempo de jogo não é medido. [VERIFICADO]**
A coluna existe e tem bound: `server/db.js:160` (`"time" DOUBLE PRECISION DEFAULT 0`) e `server/db.js:477` (`time: [0, 100000000]`). Mas o único lugar do cliente que preenche esse campo é a criação de personagem, com zero: `js/web2/game_core.js:216` (`time: 0`). Busca por `state.time`, `g_gameTime`, `gameTime` e `.time +=` em todo o repositório: **nenhum incremento**.
**Consequência direta para este plano:** a régua do dono ("1 hora por dia") mede uma grandeza que **o sistema atual não coleta de forma nenhuma**. Isso não é um ajuste — é um subsistema novo (§3 abaixo).

**Achado A6 — `save_game_state` não tem rate limit. [VERIFICADO]**
O mecanismo `isRateLimited()` existe e é bom (`server/index.js:401-430`), aplicado em: `player_move` (`:493`), `cloud_save_login` (`:725`), `cloud_save_signup` (`:752`), `session_login` (`:780`), `post_diary_entry` (`:956`), `post_egregora_message` (`:1017`), `get_player_profile` (`:1064`), `search_players` (`:1225`), upload (`:1694`).
**Não é aplicado em:** `save_game_state` (`:812`), `delete_character` (`:879`), `update_profile` (`:918`), `increment_stat` (`:1124`), `badge_progress` (`:1179`).
Hoje o impacto é moderado (a fila `saveQueues` serializa por socket, então não vira corrupção). Numa régua de séculos, vira o canal por onde um script empurra estado forjado sem custo e sem trilha.

**Achado A7 — duas conexões da mesma conta não têm trava compartilhada. [VERIFICADO em `docs/SAVE_SYSTEM_MASTER_PLAN.md` §3 e confirmado no código]**
Cada socket tem sua **própria** fila (`saveQueues[socket.id]`, `server/index.js:822`, `:890`, `:926`, `:1137`). Web e mobile logados na mesma conta ao mesmo tempo gravam na mesma linha sem ordem definida: a última escrita a chegar vence. Já está documentado como decisão consciente — mas na régua do legado isso deixa de ser "risco de save" e vira **vetor de crédito duplo** (§2).

#### 1.2 O que já está BEM protegido — não re-sinalizar **[VERIFICADO]**

Falso alarme custa tempo de engenharia. Estes pontos estão corretos e são, inclusive, o **modelo** a copiar:

| Item | Onde | Por que está certo |
|---|---|---|
| Identidade de escrita vem sempre da sessão autenticada | `index.js:813-817`, `:880-884`, `:919-924`, `:1125-1129`, `:1180-1184` | Nunca um `email` cru do payload. O payload só identifica o *alvo*, nunca o *autor*. |
| Contadores de conta somados **no servidor**, por delta limitado | `db.js:94-96`, `index.js:1111-1135` | `increment_stat` só aceita `type ∈ {kill,item,life}` + `Number.isInteger(amount) && amount >= 1`, com teto por chamada, e faz `coluna = coluna + delta` no SQL. **Este é exatamente o padrão que o tempo de jogo deve seguir.** |
| `badge_progress` compara contra o melhor já registrado | `index.js:1158-1165` | MIN/MAX no servidor; reenviar um valor pior não desfaz nada. |
| Rate limit de login 5/min por IP | `index.js:347-349`, `:725`, `:780` | O item "sem limite de força bruta" do `SAVE_SYSTEM_MASTER_PLAN.md` §3 está **desatualizado** — foi corrigido depois daquele documento. |
| JWT verificado de verdade, segredo nunca previsível | `index.js:91-125`, `:790`, `:1538` | Segredo persistido em disco com permissão `0600`, e `process.env.jwtsecret` sempre vence. Fechou o achado #2 de `SECURITY_AUDIT.md`. |
| Senha com bcrypt, hash nunca devolvido ao cliente | `db.js:836-852`, `:878` | Fechou o achado #3 de `SECURITY_AUDIT.md`. |
| SQL sempre parametrizado; nome de coluna vem de mapa fixo | `db.js` inteiro; `db.js:1509-1511` | Sem concatenação de string em query. Sem injeção. |
| Rejeitar payload inteiro em vez de truncar (baú) | `db.js:554-565` | Raciocínio correto e generalizável: truncar silenciosamente deixa o atacante "acertar o tamanho certo". |

---

### 2. Modelo de ameaças do tempo de jogo

Premissa da régua: **1 hora de jogo ativo por dia → nível 1e11 em 3147**. De 20/09/2026 a 31/12/3147 são **409.538 dias ≈ 1.121,28 anos ≈ 409.538 horas** **[CÁLCULO]** (bate com o §4 do brief).

Toda fraude aqui não "rouba itens": ela **antecipa o fim do jogo**, que é o único ativo real do conceito.

| # | Ameaça | Como funciona na prática | Impacto na régua de 3147 | Prob. | Mitigação proposta |
|---|---|---|---|---|---|
| T1 | **Nível forjado direto** | Cenário #1 do §1.1: `save_game_state` com `level: 1e11`. | **Terminal.** Destrói o conceito em um pacote. | **Alta** (trivial, sem ferramenta especial) | §3: nível do legado **derivado do tempo creditado**, não do payload. + rejeitar delta de nível impossível. |
| T2 | **XP arbitrário** | `GhostRPG.addXp(1e30)` no console → o salto em forma fechada (`rpg_system.js:1024-1041`) converte em nível de uma vez. | Terminal (mesmo efeito de T1). | Alta | Mesma de T1. |
| T3 | **Bot / AFK / idle farming** | Script clica/anda sozinho 24 h por dia; nenhum sinal distingue de humano de forma confiável. | Sem teto: **1121 anos → ~47 anos** (24 h/dia). **[CÁLCULO]** | **Alta** | **Teto diário de horas creditáveis.** Com teto de 1 h, o bot ganha *exatamente* o mesmo que o humano. Detecção vira sinal de revisão, não defesa primária. |
| T4 | **Macro / autoclicker** | Mesma coisa que T3, com menos automação. | Idem T3. | Alta | Idem T3 (o teto anula o benefício). |
| T5 | **Múltiplas abas** | 10 abas da mesma conta, cada uma "jogando", 10× o crédito. | 1121 anos → **112 anos** com 10 abas. **[CÁLCULO]** | Alta | **Sessão única por conta** (§3.3) — só uma sessão credita, e o crédito é por conta, nunca por conexão. |
| T6 | **Web + mobile ao mesmo tempo (duplo crédito)** | Cross-play é feature (CLAUDE.md §3). Hoje não há lock compartilhado (A7). | 2× o ritmo, e ainda por cima saves sobrescrevendo um ao outro. | **Alta** (acontece sem má-fé) | Sessão única por conta. A segunda sessão continua jogável, mas **não credita** — e diz isso na tela. |
| T7 | **Manipulação do relógio do cliente** | Mudar a data/fuso do aparelho para "criar" dias novos ou alongar o dia. | Sem defesa: ilimitado. | Média | **Irrelevante por construção**: o servidor nunca lê timestamp do cliente. Só `now()` do servidor decide (§3.2). Já é o padrão da casa (`db.js:1155`). |
| T8 | **Replay / injeção de eventos** | Capturar um heartbeat válido e reenviá-lo N vezes. | Multiplica o crédito. | Média | `session_id` gerado pelo servidor + `seq` monotônico; servidor credita `min(tempo real decorrido, teto por batida)` — reenviar não cria tempo que o relógio do servidor não viu. |
| T9 | **Multi-contas cooperando** | 100 contas-fazenda transferindo valor para a conta do legado. | 1121 anos → **11,2 anos** com 100 contas. **[CÁLCULO]** | Média | **Nunca criar transferência conta→conta de XP/nível/tempo.** Se itens forem negociáveis um dia, o progresso do ghost do legado não pode depender de item recebido. |
| T10 | **Servidor privado / emulador** | Baixar o JS do site, rodar o próprio servidor, ser 1e11 lá. | Nenhum — **se** a Crônica canônica for a do operador. | Média | Aceitar e declarar: só o ledger do servidor oficial conta. Não é combatível e não precisa ser. Honestidade > teatro. |
| T11 | **Cliente modificado** | Recompilar o APK ou rodar um userscript que mente sobre tudo. | Terminal se o cliente for autoridade. | Alta | Mesma de T1: tirar a autoridade do cliente. Ofuscação/attestation **não** é recomendada — é cara, quebra a cada versão de navegador/Android e não sobrevive a séculos. |
| T12 | **Exploits de progressão** | Bug de loot/dano que multiplica XP legitimamente pelo código. | Grave, e **difícil de perceber**: parece jogo normal. | Média | O teto diário limita o estrago por dia. Alerta de "nível ganho por hora creditada acima do teoricamente possível" pega o resto (§6). |
| T13 | **DoS que "congela" o relógio de outros** | Derrubar o servidor ou a conexão de um jogador específico para ele perder horas. | Assimétrico e injusto se o dia perdido for irrecuperável. | Baixa-Média | O teto é **teto**, não exigência: a hora pode ser cumprida em qualquer momento das 24 h. Mais um **banco pequeno de dias não usados** (§3.5) — e, se o servidor cair, *ninguém* acumula, então a queda não favorece ninguém. |
| T14 | **Sequestro de conta** (não é "tempo", mas é o mesmo ativo) | Roubar a conta com 300 anos de horas acumuladas. | Terminal para aquela linhagem. | Média (cresce com o valor) | §4 inteiro. |

**A conclusão que amarra a tabela:** T3, T4, T5, T6, T9 e T12 têm **a mesma mitigação estrutural** — um teto de crédito por dia real, aplicado por conta. Só T1, T2 e T11 exigem tirar a autoridade do cliente. Ou seja: **duas decisões de arquitetura resolvem onze das quatorze ameaças.**

---

### 3. Projeto do "tempo ativo autoritativo"

> **Dependência declarada:** a *unidade matemática* (quanto de progresso 1 hora creditada compra, e se horas extras aceleram) é do **`progression-actuary`**. Eu entrego o **medidor** e as **garantias de integridade** dele; ele entrega o **conversor**. O contrato entre nós é um só número: `segundos_creditados_no_dia`. Tudo que ele propuser deve consumir esse número, nunca `characters.level` vindo do cliente.

#### 3.1 Princípio de projeto (a ideia toda em uma frase)

> **O nível do legado é uma função do tempo que o servidor mediu. O XP do cliente continua existindo para a diversão, mas não define a linhagem.**

Por que isso importa tanto: se `nivel_legado = f(segundos_creditados)` e `segundos_creditados` é medido pelo servidor, então **o cliente pode forjar o que quiser em `characters.level` e não muda nada na régua**. Isso transforma o achado A1/A2 (que exigiria reescrever o combate inteiro no servidor — meses de trabalho para um dev solo) em um problema de **um contador bem feito** — semanas. É o melhor retorno de esforço deste relatório inteiro. **[HIPÓTESE de projeto — depende de o `progression-actuary` aceitar uma unidade baseada em tempo.]**

#### 3.2 O que é "creditar tempo" (definição operacional)

Um segundo é creditado quando, **simultaneamente**:
1. existe uma **sessão de legado aberta** para a conta, e ela é **a sessão ativa** daquela conta (§3.3);
2. o personagem ativo é o **ghost do legado** daquela conta;
3. houve pelo menos **um evento de gameplay qualificado** dentro da janela de ociosidade (§3.4);
4. o **relógio do servidor** avançou (nunca um timestamp do payload);
5. o **teto do dia-legado** ainda não foi atingido (§3.5).

**Regra de ouro:** nenhum campo de tempo vindo do cliente é lido, nunca — nem para conferir. O payload do heartbeat não precisa carregar hora nenhuma. Isso mata T7 por construção, em vez de por validação.

**Sobre "heartbeat assinado":** a resposta honesta é **não vale a pena**. Assinar com HMAC exige uma chave no cliente; a chave está no navegador; quem forja o heartbeat também assina. Assinatura só ajuda quando quem assina e quem ataca são pessoas diferentes — não é o caso aqui. O que de fato funciona é a combinação: **relógio do servidor + sessão única + exigência de atividade + teto diário + detecção de anomalia**. Vender "heartbeat assinado" como proteção seria teatro de segurança. **[HIPÓTESE fundamentada]**

#### 3.3 Sessão única por conta

Estado em memória no servidor: `activeLegacySession[email] = { socketId, sessionId, openedAt, platform }`.

- Um novo login/abertura de sessão **substitui** o anterior. O anterior é marcado `superseded` e **para de creditar imediatamente**.
- A sessão substituída **não é desconectada** (o jogador continua jogando), mas a tela mostra, de forma visível e sem culpa: *"Esta sessão não está contando tempo — o legado está sendo registrado em outro aparelho."*
- **Bônus:** isso também resolve o risco já documentado em `SAVE_SYSTEM_MASTER_PLAN.md` §3 (duas conexões sobrescrevendo o save uma da outra) — a mesma trava serve para as duas coisas. **[HIPÓTESE, precisa de validação do `backend-architect`]**
- Reconexão (queda de rede) não deve criar uma sessão nova do zero: se o mesmo e-mail reconectar em menos de, digamos, 120 s, retoma a sessão (mesmo `sessionId`) em vez de abrir outra.

#### 3.4 Sinais de atividade humana — sem invadir privacidade e sem exigir hardware

**Postura:** não tentar provar que é humano. Tentar apenas provar que **alguém está jogando** — e deixar o *teto* resolver o resto.

Sinais usados (todos **já trafegam hoje**, nenhuma telemetria nova):
- `player_move` com posição efetivamente alterada (`index.js:487`);
- `player_attack` (`index.js:649`);
- `overworld_move` (`index.js:552`);
- conclusão de fase / `badge_progress` / `increment_stat`.

**Explicitamente NÃO usar:** impressão digital de hardware, biometria de movimento de mouse, leitura de lista de processos, exigência de aparelho específico, CAPTCHA no meio do jogo. Motivos: (i) LGPD e princípio de minimização — coordenar com `digital-succession-counsel`; (ii) excluiria jogadores com acessibilidade ou hardware modesto; (iii) **nada disso sobrevive a 1.100 anos de mudança de plataforma**.

**Janela de ociosidade (proposta):** 90 segundos sem nenhum evento qualificado → a sessão entra em `ocioso` e **para de creditar**. Volta a creditar no próximo evento, sem penalidade e sem precisar relogar. Isso mata AFK puro (deixar o jogo aberto) sem punir quem foi atender a porta.

#### 3.5 Dados, eventos e limites

**Eventos (nomes propostos):**

| Evento | Direção | Payload | O que o servidor faz |
|---|---|---|---|
| `legacy_session_open` | cliente → servidor | `{ characterId }` | Valida sessão autenticada; fecha/supersede a anterior da mesma conta; devolve `sessionId` aleatório + `seq` inicial. |
| `legacy_beat` | cliente → servidor | `{ sessionId, seq }` | Confere `sessionId` e `seq` monotônico; calcula `Δ = min(now() - last_beat_at, MAX_BEAT_GAP)`; credita se ativo e sob o teto. **Não lê tempo do cliente.** |
| `legacy_credit_update` | servidor → cliente | `{ creditedToday, dailyCap, state }` | Feedback honesto na HUD: "43 min de 60 creditados hoje". |
| `legacy_session_close` | cliente → servidor | `{ sessionId }` | Fecha; faz o flush final. Um `disconnect` (`index.js:662`) faz o mesmo. |

**Cadência proposta:** batida a cada **30 s**; `MAX_BEAT_GAP = 45 s` (absorve lag sem deixar um intervalo grande virar crédito).

**Tabelas (propostas — só plano, nenhuma migração escrita aqui):**

```
play_sessions        (id UUID PK, account_id, character_id, platform,
                      opened_at TIMESTAMPTZ, last_beat_at TIMESTAMPTZ,
                      credited_seconds BIGINT, last_seq BIGINT,
                      closed_at, close_reason)   -- retenção curta: 90 dias

daily_play_ledger    (account_id, legacy_day DATE, credited_seconds BIGINT,
                      hit_cap BOOLEAN, sessions_count INT,
                      PRIMARY KEY (account_id, legacy_day))   -- permanente

legacy_totals        (account_id PK, lifetime_credited_seconds BIGINT,
                      legacy_level BIGINT, last_recomputed_at)
```

**Limites e um achado numérico que importa: [CÁLCULO]**
- 409.538 horas × 3600 = **1.474.336.800 segundos**. O máximo de um `INTEGER` do Postgres é 2.147.483.647 — cabe, mas com apenas **1,46× de folga**. Se o teto diário for 2 h, o total passa de 2,9e9 e **estoura o INTEGER**.
  → **`credited_seconds` e `lifetime_credited_seconds` têm que ser `BIGINT`, não `INTEGER`.** Mesma lição que o projeto já aprendeu com `level`/atributos (`db.js:140-152`, `migrate_level_bigint.js`). Registrar agora evita repetir a migração.
- `daily_play_ledger` a **uma linha por dia por conta**: 409.538 linhas ao longo dos 1.121 anos, ≈ **49 MB por conta** a 120 bytes/linha. Perfeitamente viável.
- **Nunca** guardar uma linha por batida: a 30 s, seriam **4,9e7 eventos por conta** (1 h/dia por 1.121 anos). Batidas existem só em memória; o que persiste é o agregado.

**O "dia-legado" é em UTC, fixo.** Não no fuso do cliente (seria T7 por outra porta) e não no fuso do servidor (que pode mudar de host em 500 anos). Corte às 00:00 UTC, declarado nos Termos e visível na HUD.

#### 3.6 Teto diário — o mecanismo central

> **Dependência:** o valor do teto é uma decisão conjunta com o `progression-actuary`. Eu mostro a sensibilidade; ele escolhe o número.

Sensibilidade, se a régua exigir as 409.538 horas: **[CÁLCULO]**

| Teto de horas creditáveis/dia | Anos até 1e11 | Ano de conclusão |
|---|---|---|
| 1 h (régua literal) | 1.121,3 | **3147** |
| 1,5 h | 747,5 | 2774 |
| 2 h | 560,6 | 2587 |
| 3 h | 373,8 | 2400 |
| 8 h | 140,2 | 2166 |
| 16 h | 70,1 | **2096 — cabe numa vida só** |
| 24 h (bot) | 46,7 | 2073 |

A leitura é dura e vale dizer com todas as letras: **qualquer teto acima de ~1,3 h/dia coloca o fim do jogo dentro do alcance de uma única pessoa dedicada**, e o conceito de legado deixa de existir. O dono precisa decidir isso conscientemente (D1).

Três formatos possíveis:
- **(i) Teto duro de 1 h/dia.** Simples de entender, simples de auditar, imune a bot. Contra: quem joga 3 h "perde" 2 h de esforço, e isso frustra.
- **(ii) Rendimento decrescente (soft cap).** 1ª hora 100 %, 2ª 20 %, 3ª 5 %, depois ~0. Recompensa quem joga mais sem quebrar a régua. Contra: muito mais difícil de explicar e de calibrar; o bot de 24 h ainda ganha alguma coisa todo dia, e "alguma coisa × 400.000 dias" precisa ser conferido pelo atuário.
- **(iii) Teto duro + banco pequeno.** 1 h/dia, mas dias não usados acumulam até um limite (ex.: 7 dias), gastáveis a no máximo 2 h/dia. Perdoa doença, viagem e queda de servidor (T13) sem abrir a porta do farm.

**Minha recomendação: (iii).** É o único que resolve T13 (DoS/queda) e o problema humano de "perdi um dia, minha linhagem quebrou", sem dar ao bot mais do que um humano.

#### 3.7 O que acontece quando o servidor cai

- **Crédito de uma sessão aberta:** persistido de forma incremental. Proposta: gravar em `daily_play_ledger` **a cada 5 minutos de tempo creditado** (e sempre no `close`/`disconnect`). Pior caso de uma queda abrupta: o jogador perde **menos de 5 minutos**.
- **Crédito retroativo automático: NÃO.** "O servidor caiu, me dá 3 horas" é o pedido mais fácil de forjar que existe e não tem como ser verificado. Se existir automaticamente, vira o vetor preferido.
- **Compensação: sim, mas manual, global e registrada.** Se o operador constatar uma indisponibilidade real, ele concede um crédito **igual para todos os afetados**, com um registro assinado na Crônica (`kind: 'compensacao_operacional'`, com a janela e o motivo). Nunca por pedido individual, nunca sem registro.
- **Justiça:** enquanto o servidor está fora, **ninguém** acumula. A queda não favorece ninguém — o que ela machuca é a *confiança*, e é por isso que a compensação precisa ser pública, não silenciosa.
- **Relógio do próprio servidor:** se um ajuste de NTP der um salto, `Δ = min(now() - last_beat_at, MAX_BEAT_GAP)` já protege do salto para frente; um salto para trás produz `Δ` negativo, que deve ser **descartado com alerta**, não creditado.

#### 3.8 Reconciliação entre plataformas

O crédito é **por conta**, nunca por plataforma. `play_sessions.platform` (web / android) existe só como metadado de detecção. Não existe "orçamento do celular" e "orçamento do PC". Cross-play continua funcionando exatamente como hoje (CLAUDE.md §3) — a diferença é que **só uma sessão credita de cada vez** (§3.3).

**Aviso de paridade (CLAUDE.md §3, regra inegociável):** o cliente de heartbeat precisa ser implementado nas **duas** pastas (`danger ghost/js/...` e `danger_ghost_mobile/www/js/...`) e o APK recompilado. Se o mobile não emitir o heartbeat, jogar no celular simplesmente não conta — um bug que o jogador só descobriria dias depois.

---

### 4. Segurança da POSSE e da SUCESSÃO

> **Aviso:** esta seção é engenharia de risco. O enquadramento legal (herança, LGPD, menores, cláusulas de Termos) é do `digital-succession-counsel` e **precisa de advogado**.

#### 4.1 O problema estrutural de hoje

**Achado A8 — a conta *é* um endereço de e-mail. [VERIFICADO]**
`email` é chave primária de `players` e parte da PK composta de `characters` (`server/db.js:166`), além de chave estrangeira em `diary_entries` (`:171`), `egregora_messages` (`:187`) e `friendships` (`:200-201`).

**Achado A9 — não existe troca de e-mail, troca de senha nem recuperação. [VERIFICADO]**
`updateProfile` (`server/db.js:1129-1147`) só altera `name`, `avatar_url` e `gallery_urls`. Não há handler de troca de senha nem de "esqueci minha senha" (confirmado por busca em `server/`), o que o `SAVE_SYSTEM_MASTER_PLAN.md` §3 já registra.

**O que isso significa para o legado:** hoje, "passar a conta ao filho" **só pode ser feito entregando a senha**. Isso é exatamente o mesmo ato que "vender a conta" — indistinguível para o servidor, sem registro, sem cancelamento, sem Crônica. **A mecânica de sucessão não existe; existe apenas o compartilhamento de credencial.**

**Achado A10 — sessão de 30 dias sem revogação. [VERIFICADO]** `SESSION_TOKEN_TTL = '30d'` (`server/index.js:121`) e não há lista de tokens revogados. Um token capturado vale 30 dias — e, como não dá para trocar a senha, não há como encurtar isso. Importa muito depois de uma sucessão: o Guardião anterior continua com sessão válida por até 30 dias.

#### 4.2 Desenho proposto: separar "quem entra" de "o que é herdado"

```
users            (id UUID PK, email, password_hash, mfa_secret, contact_channel, ...)
                  ^ a PESSOA. Cada Guardião tem o SEU. Ninguém compartilha senha.

legacy_accounts  (id UUID PK, current_guardian_user_id -> users.id,
                  legacy_character_id, opened_at, ...)
                  ^ a LINHAGEM. É isto que passa de geração em geração.
```

**Esta é a mudança estrutural mais importante do relatório.** Enquanto `email` for a chave da conta, toda sucessão é uma troca de chave primária com cascata em cinco tabelas — caro, arriscado, e sem trilha. Com um UUID de linhagem, a sucessão é **uma linha mudando de dono**, e a Crônica fica trivial de manter.

**Quando fazer:** não precisa estar pronto antes de lançar a régua, mas **precisa estar pronto antes da primeira sucessão real**. Fazer depois de milhares de linhas atreladas a e-mail é muito pior.

#### 4.3 Ritual de Passagem (a única porta normal)

1. **Designação.** O Guardião indica o Herdeiro **escolhendo uma conta já existente** (não digitando um e-mail livre — digitar e-mail é o caminho do golpe "digite o meu e-mail que eu te ajudo"). Coordenar UX com `legacy-systems-designer`.
2. **Aceite.** O Herdeiro aceita **dentro do jogo**, logado na conta dele. Sem aceite, não há sucessão.
3. **Espera obrigatória:** recomendo **30 dias**. Durante ela: o Guardião mantém controle total; **qualquer um dos dois cancela com um clique**; ambos são avisados por todos os canais registrados, em vários momentos (não só uma vez).
4. **Efetivação.** `legacy_accounts.current_guardian_user_id` muda. **Nenhuma credencial troca de mãos.** O Herdeiro entra com a senha dele; o Guardião anterior continua existindo como pessoa e como entrada na Crônica.
5. **Higiene pós-passagem:** todas as sessões ativas da linhagem são invalidadas na hora (resolve A10 no ponto em que mais importa), e o Guardião anterior perde acesso de escrita à linhagem imediatamente.

#### 4.4 Anti-sequestro por engenharia social ("sou o filho dele")

O ataque não é contra o código — é **contra o operador**, que é uma pessoa só e vai receber um e-mail comovente. Então a defesa tem que ser uma **regra que o operador se compromete a não quebrar**, escrita antes de a pressão emocional existir:

> **Existem exatamente três caminhos para uma linhagem mudar de Guardião: (1) o Ritual de Passagem, feito pelo Guardião vivo; (2) o Cofre de Sucessão, aberto pelo Herdeiro já designado após o período de inatividade; (3) uma ordem judicial documentada. Não existe um quarto caminho, e o operador não avalia laços familiares por e-mail.**

Isso precisa estar nos Termos **e** no manual de operação, porque o dia em que alguém pedir "por favor, meu pai morreu" vai ser um dia difícil — e a resposta tem que já estar decidida: *"o caminho é o Cofre; posso te explicar como"*.

#### 4.5 Cofre de Sucessão e a Chave do Legado

- No início da posse, o sistema gera uma **Chave do Legado**: segredo de alta entropia (proposta: 24 palavras / 256 bits), **mostrado uma única vez**, guardado no servidor **apenas como hash** (Argon2id ou bcrypt, mesmo padrão já usado para senha).
- O Guardião escreve a chave **em papel** e guarda com os documentos pessoais. Papel não depende de registrador de domínio, de provedor de e-mail, nem de formato de arquivo — é o único suporte deste desenho com chance real de atravessar séculos (ver `deep-time-preservation` / `deep-time-archivist`).
- **A chave sozinha NÃO basta.** Se bastasse, ela viraria um *bearer token* — um objeto transferível, portanto **vendável**, exatamente o que o anti-RMT quer impedir. Exigir **três fatores**:
  1. a **Chave do Legado**;
  2. a conta do **Herdeiro designado** (autenticada, dela mesma);
  3. o **período de espera** (recomendo 30 dias) com notificação em todos os canais e cancelamento por um clique do Guardião.
- **Prova de vida — "Chamada do Guardião":** a cada 180 dias, o Guardião confirma presença (um clique no jogo já basta). Falhar dispara a escada: avisar o Guardião → avisar o Herdeiro → marcar dormência → abrir a janela de sucessão para o Herdeiro designado. É isto que faz a sucessão por falecimento funcionar **sem ninguém precisar provar uma morte** — o que é bom, porque provar morte à distância é justamente onde a fraude documental entra.

#### 4.6 MFA

- **TOTP** (aquele código de 6 dígitos de app autenticador, padrão RFC 6238). Funciona offline, não depende de operadora, e o padrão é público — o que importa num horizonte longo.
- **Evitar SMS**: troca de chip (SIM swap) é um ataque conhecido e barato.
- **Evitar chave física obrigatória**: exclui gente e não existe garantia nenhuma de que o conector de hoje exista em 2200.
- Códigos de recuperação do MFA vão **no mesmo envelope de papel** da Chave do Legado.
- Recomendo: opcional para jogador comum; **obrigatório para ser reconhecido como Guardião de uma linhagem** a partir da primeira sucessão (D7).

#### 4.7 O elo mais fraco por 1.100 anos: o e-mail

Este é, na minha avaliação, **o risco mais subestimado de todo o conceito**.

- Nenhum endereço de e-mail sobrevive a um século, muito menos a onze. Provedores fecham. **Domínios expiram e são recomprados por terceiros** — e aí o endereço antigo na ficha não está apenas morto: ele está **nas mãos de outra pessoa**, que recebe qualquer link de recuperação enviado para lá. **[HIPÓTESE fundamentada — é um vetor de tomada de conta conhecido no setor; não validei fonte externa nesta rodada, e recomendo que o `deep-time-archivist` confirme com pesquisa.]**

Consequências de projeto, todas inegociáveis na minha leitura:
1. **E-mail é canal de notificação, nunca prova de posse.** Não construir "esqueci a senha → link no e-mail" como caminho único de recuperação. Hoje não existe recuperação nenhuma — o que é *mais seguro* do que uma recuperação ruim. Substituir isso deve ser uma decisão deliberada, não um item de conveniência.
2. **Revalidar o canal em toda Chamada do Guardião.** Um endereço que devolve erro, ou que não é confirmado há N anos, entra em estado `obsoleto` e **perde o poder de autorizar qualquer coisa** (continua só recebendo aviso).
3. **A âncora de longo prazo é o papel** (Chave do Legado), não o e-mail.
4. **Tratar "canal de contato" como campo plugável**, não como coluna `email` espalhada pelo código. Em 2300 o canal será outra coisa; o desenho precisa aceitar isso sem reescrita. Isso é mais um argumento para o UUID de §4.2.

#### 4.8 Anti-RMT (venda de contas)

Seguindo `digital-succession-compliance` §7, aplicado a **este** código:

**O problema honesto:** uma sucessão legítima e uma venda são **tecnicamente idênticas** — em ambos os casos o controle muda de pessoa. O operador não vê dinheiro. Portanto o desenho não tenta detectar a venda: ele torna a **rota sancionada a única fácil** e a venda **cara e inútil**.

**A alavanca real num jogo de legado:** quem compra uma senha leva **o save**, não **a linhagem**. Se o registro de Guardião só muda pelo Ritual (com aceite, espera, notificação e cancelamento) e a Crônica registra só o que passou por ele, o comprador **nunca é reconhecido como Guardião e nunca aparece na Crônica**. Ele comprou um número; a história ficou com a família. Isso é mais dissuasivo do que qualquer detector.

**Sinais a registrar — todos já disponíveis hoje, sem vigilância nova:**

| Sinal | Fonte já existente |
|---|---|
| Mudança abrupta de IP / região | `socket.handshake.address`, já usado no rate limit (`index.js:725`) |
| Quebra no formato diário de jogo | `daily_play_ledger` (§3.5) — a "assinatura" de horário de quem joga muda de forma óbvia |
| Herdeiro designado poucos dias após o primeiro login, sem histórico de amizade/chat | `players.created_at`, `friendships` (`db.js:198-207`) |
| Linhagem trocando de mão mais de uma vez em poucos anos | tabela de sucessões |
| Mudança de senha/canal fora do Ritual | evento de auditoria |
| Conta do "Herdeiro" criada na mesma semana da designação | `players.created_at` |

**Ação nos sinais:** **congelar direitos de sucessão por 30 dias** (não congelar o jogo — o jogador continua jogando), com revisão humana e recurso. Nunca banimento automático.

**Limite honesto, para os Termos:** o operador **não consegue impedir** uma venda privada. Consegue tornar a compra **sem suporte, sem reconhecimento e sem reembolso** — e dizer isso claramente para o comprador em potencial é, em si, a melhor prevenção.

---

### 5. Integridade da Crônica e do estado

#### 5.1 Trilha append-only com hash encadeado

"Hash encadeado" (*hash chain*) em linguagem simples: cada registro novo carrega uma impressão digital que inclui a impressão digital do registro anterior. Mudar qualquer registro antigo quebra todas as impressões seguintes — então a adulteração fica **detectável**, mesmo que não seja impedível.

```
chronicle_entries (
  seq          BIGSERIAL PRIMARY KEY,
  lineage_id   UUID NOT NULL,
  kind         TEXT NOT NULL,   -- 'posse_iniciada' | 'dia_creditado' | 'marco' |
                                -- 'passagem' | 'selo_contestacao' | 'compensacao_operacional'
  payload      JSONB NOT NULL,
  prev_hash    BYTEA NOT NULL,
  entry_hash   BYTEA NOT NULL,  -- SHA-256(seq || lineage_id || kind ||
                                --          json_canonico(payload) || created_at || prev_hash)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
)
```
- **Só INSERT.** Impor com um *trigger* que levanta exceção em `UPDATE`/`DELETE` **e** com um papel (role) de banco sem essas permissões na tabela. Dois mecanismos, porque um trigger pode ser desativado por quem tem permissão.
- **Detalhe que quebra na prática:** o `json_canonico` precisa ser determinístico (ordem de chaves, formatação de número). `JSONB` do Postgres **reordena chaves** — então o hash tem que ser calculado sobre uma serialização canônica definida pela aplicação, gravada junto, e **nunca** sobre o `JSONB::text` relido do banco. Isso já mordeu muita gente. **[HIPÓTESE — precisa ser testado de verdade antes de valer alguma coisa]**
- **Granularidade:** um registro por **dia creditado** (não por batida). 409.538 registros por linhagem ao longo dos 1.121 anos — tranquilo. **[CÁLCULO]**

#### 5.2 O limite honesto de uma cadeia interna

Uma cadeia de hash dentro do mesmo banco que o operador controla **não prova nada contra o operador**. Ela pega corrupção acidental e comprometimento parcial do banco — que é muito, mas não é confiança.

Para obter confiança de verdade é preciso uma **âncora externa**: publicar periodicamente (proposta: semanal) apenas a "cabeça" da cadeia — 32 bytes, nenhum dado pessoal — em um lugar fora do controle do operador. O projeto já tem canais públicos (Twitter `@GhostGamesnit`, Telegram — CLAUDE.md §8), e dá para enviar também por e-mail a cada Guardião. É uma "notarização pobre", custa quase nada, e é suficiente para flagrar reescrita retroativa.

**E a blockchain própria?** Este é o papel **honesto e não-hype** dela (CLAUDE.md §2, item de roadmap real): ser a âncora externa da cabeça da Crônica. Não é para guardar o jogo, nem o inventário, nem o save — é para carimbar 32 bytes por semana em um lugar que o operador não pode reescrever sozinho. Até ela existir, um post público semanal cumpre a mesma função com 0 % da complexidade. **[HIPÓTESE de projeto — coordenar com `deep-time-archivist`]**

#### 5.3 Detecção de adulteração no banco e backups verificáveis

- **Job noturno** que repercorre a cadeia de cada linhagem e compara a cabeça com a última publicada. Divergência → alerta + **congelar escrita naquela linhagem** até revisão humana.
- **Backup verificável:** todo backup carrega (i) a cabeça da cadeia, (ii) contagem de linhas por tabela, (iii) SHA-256 do dump. Uma restauração só é aceita se a cabeça restaurada bater com uma cabeça **publicada externamente**. Sem isso, "temos backup" é uma crença, não um fato.
- **Restauração de teste periódica.** Backup não testado não é backup. O horizonte de séculos é do `deep-time-archivist`; o que eu afirmo é a regra mínima: *a verificação faz parte do backup, não é uma etapa opcional depois.*

#### 5.4 Política para fraude descoberta retroativamente

Três opções, com recomendação:

- **(A) Rollback silencioso** — corrige os números e apaga o episódio.
  *Prós:* preserva a régua; simples. *Contras:* contradiz frontalmente a ideia de crônica permanente e, se um dia vazar que foi feito em silêncio, **destrói a confiança de uma vez** — que é o único ativo de um jogo de 1.100 anos.
- **(B) Selo de Contestação — RECOMENDADO** — nada é apagado. Um registro **novo** e assinado entra na cadeia com o achado, a evidência e a correção aplicada; os números **são** corrigidos daquele ponto em diante (o crédito fraudulento é subtraído); a Crônica mostra **as duas coisas** — a alegação original e a correção.
  *Prós:* é o que arquivos e cartórios reais fazem; mantém a cadeia íntegra (nada de reescrever o passado); ensina, para as próximas gerações, que o sistema se corrige à vista de todos. *Contras:* expõe publicamente a fraude de uma pessoa — precisa de cuidado de privacidade (pseudônimo do Guardião, não nome real — `digital-succession-compliance` §3).
- **(C) Anulação de Era** — toda a posse daquele Guardião é marcada como "não computada".
  Reservar para fraude sistemática ao longo de uma posse inteira, onde separar o legítimo do forjado é impossível.

**Recomendação combinada:** **B como padrão**, **C só para fraude sistemática**, **A nunca**.
**Prescrição:** correções continuam possíveis para sempre (a cadeia é para sempre), mas um selo aberto depois de encerrada a posse seguinte só pode corrigir **os números**, nunca apagar a **existência** da pessoa na Crônica. Isso fecha a lacuna "e se acharem fraude em 2400 sobre 2150?" sem transformar a Crônica em terra de ninguém. **[HIPÓTESE — decisão do dono, D5]**

---

### 6. Detecção e resposta

#### 6.1 Métricas e alertas (baratos, e o mais valioso só existe depois do §3)

| Alerta | Regra | Por que |
|---|---|---|
| **Nível impossível para o tempo creditado** | `Δnível` num save > máximo teórico dado `Δsegundos_creditados` | **O alerta mais valioso do sistema.** Só passa a existir quando o tempo é autoritativo — e aí pega T1, T2, T11 e T12 de uma vez. |
| Teto batido todo dia, sem variação nenhuma, por N dias seguidos | ex.: 180 dias exatos no teto, com o mesmo formato de atividade | Sinal de bot. **Nunca banimento automático** — um jogador dedicado faz igual. Vai para revisão. |
| Saves por minuto acima do razoável | contador por conta | Detecta script; hoje nem existe rate limit ali (A6). |
| Nível **diminuindo** num save | `novo < guardado` | Ou é bug de sync, ou é rollback forjado. Ambos merecem olhar. |
| Mais de uma sessão simultânea por dia | `play_sessions` | Multi-aba / web+mobile (T5, T6). |
| Troca de Guardião / de canal / de senha | eventos de auditoria | Anti-RMT (§4.8). |
| Divergência na cadeia da Crônica | job noturno (§5.3) | Adulteração ou corrupção. |

#### 6.2 Revisão manual, banimento e recurso — dimensionados para um dev solo

O dono é **uma pessoa**. Um sistema que exige tribunal 24/7 não vai ser operado. Então:

- **Toda ação automática é reversível** (congelar crédito, pausar direitos de sucessão). **Nenhuma ação irreversível é automática** (apagar conta, zerar linhagem) — essas só por decisão humana registrada.
- **Escada de sanção:** aviso → congelamento do crédito de tempo (o jogo continua jogável) → suspensão da elegibilidade à régua → encerramento da linhagem.
- **Recurso:** um canal único, resposta do operador, decisão registrada na Crônica. A LGPD e o direito do consumidor esperam procedimento justo em decisão automatizada — **isso é do `digital-succession-counsel`, com advogado**.
- **Fila de revisão, não caixa de entrada.** Se a fila crescer mais do que uma pessoa consegue olhar, o limiar do alerta está errado — ajustar o limiar, não ignorar a fila.

#### 6.3 Transparência — o que anunciar

**Anunciar, e de forma destacada:**
- que o tempo é medido **pelo servidor**, e por que;
- o valor **exato** do teto diário e o horário de corte (00:00 UTC);
- que **bot não ganha nada** — declarar isso na abertura desarma metade da tentativa;
- que só uma sessão conta por vez, e onde ver qual é;
- a cabeça da cadeia da Crônica, publicada periodicamente;
- um relatório anual do "estado do legado" (contas ativas, horas creditadas, sucessões, selos aplicados).

**Não anunciar:** os limiares exatos de anomalia e as regras finas de detecção. Publicá-los é entregar o mapa de como ficar logo abaixo da linha.

---

### 7. Priorização e esforço (dev solo)

Estimativas em **[HIPÓTESE]** — são meu julgamento de esforço para um dev solo trabalhando em tempo parcial neste código, não medição.

#### OBRIGATÓRIO antes de lançar a régua

| # | Item | Por quê | Esforço |
|---|---|---|---|
| P1 | **Nível do legado derivado do tempo creditado**, não do payload do cliente | Neutraliza A1, A2, A4, T1, T2, T11 sem reescrever o combate. É a decisão de maior alavancagem do plano. | 1–2 sem (depende do `progression-actuary`) |
| P2 | **Tempo ativo autoritativo** (heartbeat 30 s, relógio do servidor, janela de ociosidade, `daily_play_ledger` em BIGINT) | A régua mede uma grandeza que **hoje não é coletada** (A5). | 2–3 sem (web + mobile + APK) |
| P3 | **Sessão única por conta** | T5, T6; de quebra resolve o "última escrita vence" do master plan §3. | 3–5 dias |
| P4 | **Teto diário + banco de dias** | Anula T3, T4, T12 e parte de T9 de uma vez. | 2–4 dias (a *calibração* é do atuário) |
| P5 | **Rate limit em `save_game_state` e irmãos** | A6. O mecanismo já existe (`index.js:401`); é só aplicar. | **~2 horas** |
| P6 | **Alerta "nível impossível para o tempo creditado"** | O detector mais valioso, e só funciona depois de P1/P2. | 2–3 dias |

**Total do bloco obrigatório: ~5 a 7 semanas de trabalho concentrado.** [HIPÓTESE]

#### PODE VIR DEPOIS (mas com prazo)

| # | Item | Quando, no mais tardar | Esforço |
|---|---|---|---|
| P7 | **UUID de linhagem** (desacoplar conta ↔ e-mail, §4.2) | **Antes da primeira sucessão real.** Depois de anos de dados atrelados a e-mail, fica muito pior. | 2–3 sem |
| P8 | Ritual de Passagem (designar, aceitar, esperar 30 d, cancelar, notificar) | Antes da primeira sucessão | 2 sem |
| P9 | Chave do Legado + Cofre de Sucessão (3 fatores) | Junto com P8 | 1 sem |
| P10 | Crônica em cadeia de hash + job de verificação | Antes de a Crônica virar pública | 1 sem |
| P11 | Âncora externa publicada (cabeça semanal) | Junto com P10 | ~2 dias |
| P12 | MFA TOTP | Antes de as contas ficarem valiosas (anos 5–10) | 1 sem |
| P13 | Chamada do Guardião (prova de vida) + escada de dormência | Antes da primeira sucessão por inatividade | 1 sem |
| P14 | Painel de métricas/alertas + fila de revisão | Quando a base passar de algumas centenas de contas | 1 sem |
| P15 | Backup verificável (cabeça + manifesto + restauração de teste) | Quanto antes; é barato | 3–4 dias |

**Explicitamente NÃO recomendado, em nenhuma fase:** ofuscação de código cliente, *attestation* de hardware, biometria comportamental, CAPTCHA no meio do jogo, transferência de XP/nível/tempo entre contas, recuperação de conta só por e-mail. Cada um custa caro, quebra sozinho com o tempo, ou abre uma porta pior do que a que fecha.

---

## (c) Lacunas que eu fechei

Do checklist do brief (§6), fechei integralmente o item **5 (integridade do tempo de jogo)** e parte do **4 (transferência segura de credenciais)**:

1. Auditoria factual, com `arquivo:linha`, de como XP e nível são concedidos hoje — e a confirmação de que o servidor **não** valida progresso, só faixa numérica (A1–A3).
2. A constatação, com evidência, de que **`NUMERIC_BOUNDS.level` aceita 1e11** — ou seja, o teto de validação é igual ao objetivo final do jogo, o que o torna inútil como barreira (A2).
3. A leitura correta do `rpgAntiCheat`: ele **não é** e não pode virar um anti-cheat; e a recomendação de **não removê-lo** (A4).
4. A constatação de que **tempo de jogo não é medido em lugar nenhum** — a régua do dono não tem base no código atual (A5).
5. O inventário do que **já está certo** e não deve ser re-flagrado (§1.2).
6. Modelo de ameaças com 14 vetores, cada um com impacto **quantificado** na data de 3147 (§2).
7. Projeto completo do tempo autoritativo: definição operacional, eventos, tabelas, limites, cadência, ociosidade, sessão única, comportamento em queda de servidor (§3).
8. Achado numérico: `credited_seconds` **precisa ser BIGINT** — 1,47e9 segundos na régua literal, e um teto de 2 h/dia estoura `INTEGER` (§3.5).
9. A resposta honesta sobre "heartbeat assinado": **não resolve**, e o porquê (§3.2).
10. Desenho de posse/sucessão que **não move credenciais**, com os três fatores do Cofre, e a regra dos três caminhos contra engenharia social (§4.3–4.5).
11. O risco do e-mail em escala de séculos, com as quatro consequências de projeto (§4.7).
12. Anti-RMT aplicado a este código, com a alavanca real ("o comprador leva o save, não a linhagem") e sinais que **não exigem vigilância nova** (§4.8).
13. Política de fraude retroativa com recomendação (Selo de Contestação) e o limite honesto de uma cadeia interna sem âncora externa (§5).
14. Priorização com esforço, incluindo **P5 (~2 horas)** como a melhor relação custo/benefício imediata.

---

## (d) Lacunas que dependem de outros departamentos

| Para quem | O que preciso |
|---|---|
| **`progression-actuary`** | **(1)** Aceita que o nível do legado seja função de `segundos_creditados` (§3.1)? Se não, o custo de P1 explode. **(2)** Qual o **valor do teto diário** (§3.6) — e a decisão sobre horas extras acelerarem. **(3)** A função `nivel = f(segundos)` precisa ser **monotônica e determinística**, para o alerta "nível impossível" (§6.1) ter um limite superior calculável. **(4)** Confirmar a tabela de sensibilidade do §3.6 com a curva dele. |
| **`legacy-systems-designer`** | **(1)** UX do Ritual de Passagem e do Cofre (§4.3, §4.5) — em especial como uma criança ou alguém que nunca jogou recebe isso. **(2)** O que a **segunda sessão** vê (§3.3): espectador, jogável sem crédito, ou desconectada? **(3)** Prazos da escada de dormência. **(4)** Como a **recusa** interage com o Cofre. **(5)** Como o Selo de Contestação aparece na Crônica sem virar pelourinho. |
| **`digital-succession-counsel`** | **(1)** Base legal para registrar IP e formato diário de jogo como antifraude (interesse legítimo? teste de balanceamento?) e por quanto tempo reter. **(2)** Direito de recurso em decisão automatizada (§6.2). **(3)** Menor de idade como Guardião e o papel do adulto responsável no Ritual. **(4)** Cláusulas de Termos: proibição de venda, sanções, três caminhos de sucessão, ausência de reembolso a comprador. **(5)** Selo de Contestação vs. direito ao esquecimento. |
| **`deep-time-archivist`** | **(1)** Onde a **âncora externa** da Crônica vive depois do dev (§5.2). **(2)** Formato e suporte físico da Chave do Legado em papel (§4.5) — tinta, papel, redundância. **(3)** Verificar a afirmação sobre domínios expirados sendo recomprados (§4.7) com fonte. **(4)** Rotina de restauração de teste (§5.3, P15). |
| **`backend-architect`** | **(1)** Viabilidade de `activeLegacySession` por conta e se ele também substitui a fila por socket (§3.3). **(2)** Custo real da migração para UUID de linhagem (§4.2) sobre as FKs de `db.js:171, 187, 200`. **(3)** Serialização canônica determinística para o hash da Crônica (§5.1). |
| **`mobile-platform-engineer`** | Heartbeat espelhado em `danger_ghost_mobile/www/js/...` e APK recompilado (CLAUDE.md §3). Se o mobile não emitir, jogar no celular **não conta** — e o jogador só descobre dias depois. |
| **`game-economy-designer`** | Garantir que score/badges/ranking por geração **nunca** criem valor em dinheiro — valor em dinheiro é o que torna comprar conta atraente (`digital-succession-compliance` §7). |

---

## (e) DECISÕES PARA O DONO

**D1 — Teto diário de horas creditáveis** *(depende do `progression-actuary`)*
- (a) Teto duro de 1 h/dia — simples, auditável, imune a bot; frustra quem joga mais.
- (b) Rendimento decrescente — recompensa quem joga mais; difícil de explicar e calibrar, e o bot ainda ganha um resto todo dia.
- (c) **Teto duro de 1 h + banco de até 7 dias não usados, gastáveis a no máximo 2 h/dia.**
→ **Recomendo (c).** É o único que perdoa doença, viagem e queda de servidor sem dar ao bot mais do que a um humano.

**D2 — De onde vem o nível do legado**
- (a) **Derivado do tempo creditado pelo servidor.** — (b) Derivado do XP, com o combate validado no servidor.
→ **Recomendo (a), com folga.** (b) significa reescrever combate, dano, loot e colisão no servidor: meses de trabalho, risco alto, e o jogo fica dependente de latência. (a) neutraliza o cliente adulterado mantendo o combate exatamente como está hoje.

**D3 — O que acontece com a segunda sessão simultânea**
- (a) Continua jogável, **não credita**, e avisa na tela. — (b) Vira espectadora. — (c) É desconectada.
→ **Recomendo (a).** Nunca tirar silenciosamente — o jogador precisa **ver** por que não está contando, senão vira um "bug" que ele reporta por anos.

**D4 — Crédito retroativo quando o servidor cai**
- (a) Nunca. — (b) **Compensação manual, global e registrada na Crônica.** — (c) Automática por sessão interrompida.
→ **Recomendo (b).** (c) é o pedido mais fácil de forjar que existe. (a) sozinho é justo mas parece desleixo quando a culpa foi do operador.

**D5 — Política para fraude descoberta retroativamente**
- (a) Rollback silencioso. — (b) **Selo de Contestação** (nada apagado, correção registrada, os dois lados visíveis). — (c) Anulação de Era.
→ **Recomendo (b) como padrão, (c) só para fraude sistemática, (a) nunca.**

**D6 — Chave do Legado em papel**
- (a) **Obrigatória para ser reconhecido como Guardião do ghost do legado.** — (b) Opcional. — (c) Não existe.
→ **Recomendo (a).** É o único elemento do desenho com chance real de funcionar daqui a 300 anos. Precisa vir com um momento de cerimônia ("escreva isto num papel agora") — coordenar com `legacy-systems-designer`.

**D7 — MFA obrigatório**
- (a) Nunca. — (b) **Obrigatório para Guardiões a partir da primeira sucessão, opcional antes.** — (c) Obrigatório para todos desde já.
→ **Recomendo (b).** (c) afasta jogador novo num jogo com ~48 contas; (a) deixa o ativo mais valioso do conceito protegido só por senha.

**D8 — Publicar a cabeça da cadeia da Crônica**
- (a) **Sim, semanalmente, nos canais que já existem.** — (b) Só sob pedido. — (c) Não publicar.
→ **Recomendo (a).** Custa quase nada, e é o que transforma "confie no operador" em "verifique você mesmo" — o que importa muito num jogo cuja promessa dura mais que a vida do operador.

---

## (f) Riscos e o que eu NÃO consegui verificar

**Riscos do meu próprio plano (ditos antes que alguém descubra):**
1. **Tempo autoritativo cria um ponto único de falha novo.** Se o crédito parar de funcionar, o jogo continua jogável mas **para de significar** alguma coisa — e essa é uma falha que dá para não perceber por dias. Precisa de monitoração própria ("nenhuma conta creditou nos últimos 30 min" é um alarme).
2. **O teto diário vai frustrar jogador dedicado**, inclusive o dono. É uma decisão de produto com custo emocional real, não só técnico, e vai gerar reclamação legítima.
3. **Cadeia de hash sem âncora externa dá falsa sensação de imutabilidade.** Se for implementada sem o §5.2, é pior do que não ter — porque as pessoas vão *acreditar* nela.
4. **A serialização canônica do JSON é onde isso quebra na prática** (§5.1). Não foi testada; precisa de teste real antes de qualquer promessa.
5. **Sessão única pode punir uso legítimo** (trocar de aparelho no meio da sessão, reconexão instável). A janela de retomada de 120 s é um chute meu, não uma medição.
6. **Estimativas de esforço são julgamento, não medição** — e, historicamente, subestimam o trabalho de espelhar tudo para o mobile e recompilar o APK.

**O que eu não consegui verificar:**
1. **Não li `engine.js` inteiro** (restrição explícita da tarefa e do CLAUDE.md §6). Busquei `addXp(` em todo o repositório `.js` e encontrei exatamente dois pontos de concessão; **pode existir algum caminho que escreva `state.level` direto** por outro mecanismo que a minha busca por `state.level =` / `stats.level =` não tenha pegado. Recomendo uma varredura dedicada do `gameplay-engineer` antes de P1.
2. **Não toquei em produção** (restrição do brief §2.3). Então não sei: a distribuição real de níveis das ~48 contas; se alguma já está com valor implausível; se `migrate_level_bigint.js` foi rodado. → **Dado que preciso que o dono autorize levantar**, antes de calibrar qualquer coisa.
3. **Não li `.env` nem `.jwtsecret`** (credenciais — proibido). Não sei se `jwtsecret` está definido em produção hoje; o código trata os dois casos corretamente (`index.js:91-120`), então isso é operacional, não de código.
4. **Não verifiquei a paridade do mobile** para os achados deste relatório. `danger_ghost_mobile/www/js/game/rpg_system.js` existe como cópia separada (CLAUDE.md §3) e pode divergir. Todo item de P1–P6 precisa de auditoria espelhada.
5. **A afirmação sobre domínios expirados recomprados por terceiros** (§4.7) está marcada **[HIPÓTESE fundamentada]** — é um vetor conhecido no setor, mas não busquei fonte externa nesta rodada. O `deep-time-archivist` deve confirmar antes de isso virar cláusula de Termos.
6. **Não testei nenhum dos cenários de abuso ao vivo.** Eles são leitura de código, não exploração executada — e leitura de código, mesmo cuidadosa, erra. O cenário #1 (§1.1) é o que eu recomendo reproduzir primeiro, **numa conta descartável e num banco isolado** (skill `e2e-db-verification`), antes de qualquer decisão do dono. Se ele **não** funcionar, metade da urgência deste relatório cai — e isso seria uma ótima notícia.

---

> *Repetindo o aviso obrigatório: as partes sobre herança, Termos de Uso, LGPD e venda de contas são mapeamento de risco, **não aconselhamento jurídico**. Nada aqui substitui um advogado inscrito na OAB.*
