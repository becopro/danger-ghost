# 09 — Arquitetura Técnica e Migração do "Jogo Legado"

**Agente:** `backend-architect` · **Data:** 20/09/2026 · **Modo:** PLANO (nenhum código alterado, nenhuma migração executada, nenhuma consulta ao banco de produção)
**Fontes lidas:** `docs/legacy-plan/00_BRIEF.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/SAVE_SYSTEM_MASTER_PLAN.md`, `server/db.js`, `server/index.js`, `server/migrate_level_bigint.js`, `rpg_system.js` (somente leitura).

**Legenda das marcações** (exigida pelo brief §2.4):
**[VERIFICADO]** = li no código/doc real deste projeto e cito onde. **[CÁLCULO]** = rodei a conta em Node no scratchpad da sessão. **[HIPÓTESE]** = suposição minha, ainda não confirmada.

---

## (a) Resumo em 10 linhas

1. O desenho cabe em **9 tabelas novas** (`lineages`, `keepers`, `successions`, `succession_vault`, `chronicle_events`, `playtime_sessions`, `playtime_daily`, `playtime_yearly`, `relics`) mais **4 colunas aditivas** em `players`/`characters`. Nada é apagado ou reescrito.
2. **Nenhuma tabela atual precisa ser destruída.** `players` e `characters` continuam sendo a verdade do save; as tabelas novas guardam *quem é dono da história*, *quanto tempo real foi investido* e *o que aconteceu*.
3. **[CÁLCULO]** O eixo de tempo é enorme mas o volume de dados é pequeno: um agregado diário por linhagem em 1.121 anos são **409.538 linhas ≈ 33 MB**. Com 1.000 linhagens, **~365 mil linhas por ano**. Postgres nem sente.
4. **[CÁLCULO]** O que *não* cabe: um heartbeat cru por minuto guardado pra sempre dá **24,5 milhões de linhas e ~3 GB por linhagem**. Por isso o ledger tem duas camadas — sessões quentes (descartáveis) e dias selados (permanentes, com hash encadeado).
5. **[VERIFICADO+CÁLCULO]** Achado numérico principal: o `xp` de hoje é o XP *residual* (consumido a cada nível, `rpg_system.js`), e o teto `1e19` de `NUMERIC_BOUNDS` aguenta. O que **não existe hoje** é um **XP acumulado** — e sem ele não há como auditar 1.121 anos de esforço. Ele chega a **3,64e28** e exige `NUMERIC(40,0)` no banco + `BigInt` nos dois clientes.
6. **[VERIFICADO]** Achado de segurança de sucessão: o JWT de sessão é `{email}` com TTL de **30 dias** e **não existe revogação** (`server/index.js`, `signSessionToken`). Sem uma coluna `token_epoch`, o Guardião anterior continua entrando na conta por até 30 dias **depois** de passar o bastão.
7. **Tempo é creditado por LINHAGEM, não por conexão.** Web + mobile ao mesmo tempo não dobram o relógio: uma sessão credita, a outra entra em "modo espectador". Isso também fecha, no escopo do tempo, o risco conhecido nº 1 do `SAVE_SYSTEM_MASTER_PLAN` §3.
8. **Inversão de contrato inevitável:** hoje o cliente calcula XP/nível e o servidor só valida faixa. No legado o **servidor calcula** e o cliente só apresenta. É a maior mudança do plano inteiro.
9. **Migração recomendada: "Era Zero" aditiva** — ninguém perde nada, o número antigo vira histórico + Selo de Pioneiro, e o script só **adiciona** colunas (rollback = voltar o código, sem desfazer DDL).
10. **Roadmap: 27 a 41 dias** de dev solo com ajuda de agentes, em 7 fases. MVP técnico = fases 0+1+2 ("o tempo é verdade e a história existe").

---

## (b) Análise e Proposta detalhada

### 0. O estado de hoje, em uma página (o que eu li, não o que eu presumo)

| Coisa | Como está hoje | Onde eu vi |
|---|---|---|
| Conta | `players`, **PK = `email` (texto)**, 8 tabelas apontam pra ela com `REFERENCES players(email) ON DELETE CASCADE` | `server/db.js:52-252` **[VERIFICADO]** |
| Personagem/ghost | `characters`, **PK composta `(email, character_id)`** | `server/db.js:132-167` **[VERIFICADO]** |
| Nível | `players.level` e `characters.level` **BIGINT** no `CREATE TABLE`… **mas só em banco NOVO.** O banco de produção continua `INTEGER` até alguém rodar `migrate_level_bigint.js` à mão | `server/db.js:56-63` + cabeçalho de `migrate_level_bigint.js:3` ("NÃO EXECUTADA") **[VERIFICADO]** |
| XP | `DOUBLE PRECISION`, é o XP **residual** (o loop faz `state.xp -= state.xpRequired`) | `server/db.js:141` + `rpg_system.js:492-495` **[VERIFICADO]** |
| Validação de números | `NUMERIC_BOUNDS` / `PLAYER_NUMERIC_BOUNDS` — campo fora da faixa é **apagado do payload**, e o `COALESCE(raw, coluna_existente)` do UPSERT preserva o valor ANTIGO | `server/db.js:466-487` e `744-787` **[VERIFICADO]** |
| Ordem das escritas | fila por socket `saveQueues[socket.id]`, compartilhada por `save_game_state`, `delete_character`, `update_profile`, `increment_stat`, `badge_progress` | `server/index.js:812-1152` **[VERIFICADO]** |
| Identidade de escrita | **sempre** `players[socket.id].email`, nunca um `email` vindo no payload | `SAVE_SYSTEM_MASTER_PLAN` §2 **[VERIFICADO]** |
| Contador server-side | padrão já existente: `incrementPlayerStat()` soma `coluna = coluna + delta`, com delta limitado a **50 por chamada** (`INCREMENT_STAT_MAX_PER_CALL`) | `server/db.js:1521-1531` **[VERIFICADO]** |
| Sessão | JWT `{email}`, `expiresIn: '30d'`, segredo persistido em `server/.jwtsecret` | `server/index.js:120-128` **[VERIFICADO]** |
| Tempo de jogo | **não existe.** `characters."time"` é cronômetro de fase, com teto de `1e8` segundos (**[CÁLCULO]** = 3,17 anos) e o próprio comentário do código diz "contador de sessão, não escalado de propósito" | `server/db.js:450-453, 477` **[VERIFICADO]** |

> **Consequência silenciosa que vale gravar:** um campo fora da faixa **não dá erro** — ele é descartado, o `COALESCE` mantém o valor velho, e o progresso **congela sem ninguém ver**. O cabeçalho do `migrate_level_bigint.js:37-39` descreve exatamente esse modo de falha. Todo teto novo que eu propuser abaixo tem que ser calculado *pra cima*, nunca "no olho".

---

### 1. Modelo de dados

#### 1.0 Decisão estrutural que vem antes de tudo: `account_id`

Hoje a chave da conta é o **e-mail**. No legado, o herdeiro assume a conta — e a primeira ideia de todo mundo é "troca o e-mail". **Não faça isso**: `email` é PK de `players` e 8 tabelas dependem dela com `ON DELETE CASCADE` **[VERIFICADO]**; renomear uma PK assim é uma cirurgia de risco alto num banco sem staging.

**Proposta:** adicionar uma chave interna estável e deixar o e-mail ser só "o endereço de login".

```sql
-- Aditivo, sem reescrever nada, seguro de rodar com o jogo no ar.
ALTER TABLE players ADD COLUMN IF NOT EXISTS account_id UUID UNIQUE DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS ux_players_account_id ON players(account_id);
```

*(`gen_random_uuid()` é nativo no Postgres 13+; o Supabase já tem.* **[HIPÓTESE]** *— confirmar a versão antes.)*

Todas as tabelas NOVAS abaixo referenciam `account_id`, **não** `email`. Assim, o dia em que você quiser tornar o e-mail editável, só as tabelas velhas precisam de trabalho, e as do legado já nascem prontas.

#### 1.1 `lineages` — a linhagem (o legado em si)

```sql
CREATE TABLE lineages (
    lineage_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id            UUID NOT NULL REFERENCES players(account_id) ON DELETE RESTRICT,
    display_name          TEXT NOT NULL,              -- "Casa Polterstalk" — nome público da linhagem
    legacy_character_id   TEXT NOT NULL,              -- o "ghost do legado": a régua do dono
    era                   INTEGER NOT NULL DEFAULT 0, -- 0 = Era Zero (ver §4)
    status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','dormant','in_succession','sealed','completed')),
    founded_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at          TIMESTAMPTZ,                -- quando alguém "zerou" (nível 1e11)
    chronicle_head        TEXT,                       -- hash do último evento da Crônica
    chronicle_seq         BIGINT NOT NULL DEFAULT 0,  -- contador do próximo seq
    active_session_id     UUID,                       -- quem está com o "bastão de crédito" agora (§2)
    active_session_until  TIMESTAMPTZ,
    total_seconds_credited BIGINT NOT NULL DEFAULT 0, -- denormalizado; a prova mora no ledger
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (account_id)                               -- 1 conta = 1 linhagem (decisão D-3 em (e))
);
CREATE INDEX idx_lineages_status ON lineages(status) WHERE status <> 'active';
```

**Por que `ON DELETE RESTRICT` e não `CASCADE`:** a Crônica é append-only e é o produto central do conceito. Se apagar a conta apagasse a linhagem em cascata, a história de 6 gerações some num clique. Isso **colide de frente com o direito ao esquecimento (LGPD)** — não é problema meu resolver, é do `digital-succession-counsel`, e eu sinalizo em (d).

**`total_seconds_credited` em BIGINT:** **[CÁLCULO]** 1 h/dia por 409.538 dias = **1.474.336.800 segundos**. Cabe folgado em BIGINT (9,22e18) e **não cabe** no teto de `1e8` do campo `time` atual — por isso coluna nova, nunca reaproveitar `characters."time"`.

#### 1.2 `keepers` — Guardião atual e histórico

```sql
CREATE TABLE keepers (
    keeper_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lineage_id         UUID NOT NULL REFERENCES lineages(lineage_id) ON DELETE RESTRICT,
    generation         INTEGER NOT NULL,            -- 1 = fundador, 2 = filho, ...
    display_name       TEXT NOT NULL,               -- nome público, o que aparece na Crônica
    contact_email      TEXT,                        -- e-mail DESTA pessoa (≠ login da conta)
    contact_email_hash TEXT,                        -- sha256; sobrevive ao apagamento do claro (LGPD)
    began_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at           TIMESTAMPTZ,
    end_reason         TEXT CHECK (end_reason IN
                         ('succession','dormancy','renounced','revoked','deceased')),
    seconds_credited   BIGINT NOT NULL DEFAULT 0,   -- quanto ESTE guardião somou
    UNIQUE (lineage_id, generation)
);
-- INVARIANTE NO BANCO: só pode existir UM guardião ativo por linhagem.
CREATE UNIQUE INDEX ux_keepers_current ON keepers(lineage_id) WHERE ended_at IS NULL;
CREATE INDEX idx_keepers_lineage_gen ON keepers(lineage_id, generation);
```

O índice único parcial é o detalhe que vale mais aqui: ele torna "um Guardião de cada vez" uma **regra do banco**, não uma checagem de código que alguém esquece de fazer num caminho novo. É o mesmo espírito do `UNIQUE(requester_email, addressee_email)` que `friendships` já usa **[VERIFICADO]** `server/db.js:205`.

#### 1.3 `successions` + `succession_vault` — herdeiro designado e estado da sucessão

```sql
CREATE TABLE successions (
    succession_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lineage_id         UUID NOT NULL REFERENCES lineages(lineage_id) ON DELETE RESTRICT,
    from_keeper_id     UUID NOT NULL REFERENCES keepers(keeper_id),
    to_keeper_id       UUID REFERENCES keepers(keeper_id),   -- NULL até o herdeiro aceitar
    heir_label         TEXT NOT NULL,      -- como o Guardião chama o herdeiro
    heir_contact_email TEXT,               -- opcional, só pra avisar
    state              TEXT NOT NULL DEFAULT 'designated' CHECK (state IN
                         ('designated','sealed','pending_acceptance','transition',
                          'completed','cancelled','refused','expired')),
    trigger_type       TEXT NOT NULL CHECK (trigger_type IN ('manual','scheduled','dormancy')),
    trigger_at         TIMESTAMPTZ,        -- data marcada, ou quando o "relógio morto" dispara
    designated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_at         TIMESTAMPTZ,
    transition_ends_at TIMESTAMPTZ,        -- fim da janela de arrependimento
    completed_at       TIMESTAMPTZ,
    closed_reason      TEXT
);
-- INVARIANTE: no máximo UMA sucessão em aberto por linhagem.
CREATE UNIQUE INDEX ux_successions_open ON successions(lineage_id)
    WHERE state IN ('designated','sealed','pending_acceptance','transition');
CREATE INDEX idx_successions_trigger ON successions(trigger_at)
    WHERE state IN ('designated','sealed') AND trigger_at IS NOT NULL;

CREATE TABLE succession_vault (
    vault_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    succession_id        UUID NOT NULL REFERENCES successions(succession_id) ON DELETE CASCADE,
    claim_token_hash     TEXT NOT NULL,      -- sha256 do token. O token em claro NUNCA é gravado.
    claim_token_hint     TEXT,               -- 4 últimos caracteres, só pra suporte identificar
    recovery_code_hashes JSONB NOT NULL DEFAULT '[]',  -- 5 códigos de uso único, hash de cada um
    sealed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at           TIMESTAMPTZ,
    used_at              TIMESTAMPTZ,
    failed_attempts      INTEGER NOT NULL DEFAULT 0
);
```

**Por que SHA-256 e não bcrypt no token:** bcrypt existe pra proteger **senha de gente**, que tem pouca entropia e precisa de um algoritmo lento. Um token gerado com `crypto.randomBytes(32)` tem 256 bits de aleatoriedade — ninguém adivinha por força bruta, e um hash rápido basta. Senha de jogador continua bcrypt, como já é hoje **[VERIFICADO]** `server/db.js:2`.

#### 1.4 `chronicle_events` — a Crônica append-only com hash encadeado

```sql
CREATE TABLE chronicle_events (
    lineage_id      UUID   NOT NULL REFERENCES lineages(lineage_id) ON DELETE RESTRICT,
    seq             BIGINT NOT NULL,             -- 1, 2, 3... por linhagem
    event_type      TEXT   NOT NULL,             -- 'lineage_founded','keeper_began','milestone',
                                                 -- 'succession_designated','succession_completed',
                                                 -- 'relic_forged','dormancy_entered','game_completed'
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),   -- relógio do SERVIDOR, sempre
    actor_keeper_id UUID REFERENCES keepers(keeper_id),
    payload         JSONB  NOT NULL DEFAULT '{}',
    payload_hash    TEXT   NOT NULL,             -- sha256 do payload em JSON canônico (chaves ordenadas)
    prev_hash       TEXT   NOT NULL,             -- entry_hash do seq-1; 'GENESIS' no primeiro
    entry_hash      TEXT   NOT NULL,             -- sha256(prev||seq||type||occurred_at_iso||payload_hash)
    PRIMARY KEY (lineage_id, seq)
);
CREATE INDEX idx_chronicle_type ON chronicle_events(lineage_id, event_type, occurred_at DESC);

-- Append-only de verdade: nem o código do servidor consegue editar.
CREATE OR REPLACE FUNCTION chronicle_is_append_only() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'A Cronica e append-only: UPDATE/DELETE proibidos (lineage %, seq %)',
        OLD.lineage_id, OLD.seq;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chronicle_no_update BEFORE UPDATE OR DELETE ON chronicle_events
    FOR EACH ROW EXECUTE FUNCTION chronicle_is_append_only();
```

**O que é "hash encadeado", em português:** cada entrada guarda uma impressão digital (`entry_hash`) que **inclui a impressão digital da entrada anterior**. Mudar a entrada nº 7 de 1852 muda o hash dela, que deixa de bater com o `prev_hash` da nº 8, que quebra a nº 9, e assim por diante até o `chronicle_head` guardado em `lineages`. Não impede alguém com acesso ao banco de reescrever tudo — **impede reescrever um pedacinho sem ninguém notar**, que é o que importa numa história de séculos.

**Detalhe de concorrência que quebraria isso:** dois eventos gravados ao mesmo tempo podem pegar o mesmo `prev_hash` e bifurcar a corrente. A gravação tem que ser:

```sql
BEGIN;
  SELECT chronicle_head, chronicle_seq FROM lineages WHERE lineage_id = $1 FOR UPDATE;  -- trava a linha
  INSERT INTO chronicle_events (...);
  UPDATE lineages SET chronicle_head = $novo, chronicle_seq = chronicle_seq + 1 WHERE lineage_id = $1;
COMMIT;
```

O `FOR UPDATE` é a trava. Sem ele, a Crônica é confiável só enquanto ninguém joga ao mesmo tempo.

**Âncora externa:** uma vez por mês, publicar o `chronicle_head` de cada linhagem fora do banco (arquivo de export, commit no repositório, futuramente a blockchain própria do roadmap `CLAUDE.md` §2). Assim, mesmo uma reescrita total do banco fica detectável. Coordenar com `deep-time-archivist` (`raw/04_durabilidade.md`).

#### 1.5 `playtime_ledger` — o livro-razão do tempo ativo (duas camadas)

Essa é a peça em que "séculos" deixa de ser retórica e vira dimensionamento.

**[CÁLCULO]** comparando os formatos possíveis, por linhagem, em 1.121 anos:

| Formato | Linhas | Tamanho estimado | Veredito |
|---|---:|---:|---|
| 1 batida por minuto, guardada pra sempre | 24.572.280 | ~2,95 GB | inviável |
| 1 linha por sessão (1 sessão/dia) | 409.538 | ~49 MB | viável, mas cresce sem controle com várias sessões/dia |
| **1 agregado por dia (recomendado)** | **409.538** | **~33 MB** | **viável e permanente** |
| 1 agregado por ano (rollup de leitura) | 1.121 | ~90 KB | ideal pra ranking histórico |

E com **1.000 linhagens**: **[CÁLCULO]** 365.000 linhas por ano no agregado diário, 409 milhões em 1.121 anos (~33 GB). Isso é volume de banco normal — o problema nunca vai ser o tamanho total, e sim **consultar mil anos de linhas numa tela de ranking** (resolvido pelo rollup anual, §6).

**Camada quente — `playtime_sessions`** (retenção curta, descartável):

```sql
CREATE TABLE playtime_sessions (
    session_id       UUID NOT NULL DEFAULT gen_random_uuid(),
    lineage_id       UUID NOT NULL,
    keeper_id        UUID NOT NULL,
    character_id     TEXT NOT NULL,      -- só credita se == lineages.legacy_character_id
    platform         TEXT NOT NULL CHECK (platform IN ('web','android')),
    client_version   TEXT,
    started_at       TIMESTAMPTZ NOT NULL,
    last_beat_at     TIMESTAMPTZ NOT NULL,
    closed_at        TIMESTAMPTZ,
    close_reason     TEXT,               -- 'logout'|'timeout'|'server_restart'|'superseded'|'capped'
    beats_accepted   INTEGER NOT NULL DEFAULT 0,
    beats_rejected   INTEGER NOT NULL DEFAULT 0,
    seconds_credited INTEGER NOT NULL DEFAULT 0,
    seconds_discarded INTEGER NOT NULL DEFAULT 0,
    discard_reason   TEXT,
    PRIMARY KEY (session_id, started_at)
) PARTITION BY RANGE (started_at);        -- partições ANUAIS, apagadas após compactação
CREATE INDEX idx_sessions_lineage ON playtime_sessions(lineage_id, started_at DESC);
```

**Camada permanente — `playtime_daily`** (o livro-razão de verdade, com prova):

```sql
CREATE TABLE playtime_daily (
    lineage_id       UUID NOT NULL REFERENCES lineages(lineage_id) ON DELETE RESTRICT,
    utc_day          DATE NOT NULL,
    keeper_id        UUID NOT NULL REFERENCES keepers(keeper_id),
    seconds_web      INTEGER NOT NULL DEFAULT 0,
    seconds_android  INTEGER NOT NULL DEFAULT 0,
    seconds_raw      INTEGER NOT NULL DEFAULT 0,    -- antes do soft-cap (auditoria)
    seconds_credited INTEGER NOT NULL DEFAULT 0,    -- depois do soft-cap (é o que vira XP)
    xp_awarded       NUMERIC(40,0) NOT NULL DEFAULT 0,
    level_after      BIGINT,
    sessions_count   SMALLINT NOT NULL DEFAULT 0,
    curve_version    SMALLINT NOT NULL,             -- qual calibração gerou esse XP
    day_hash         TEXT NOT NULL,                 -- sha256 do resumo canônico do dia
    prev_day_hash    TEXT NOT NULL,                 -- encadeia os dias => o ledger também é auditável
    sealed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (lineage_id, utc_day)
) PARTITION BY RANGE (utc_day);                     -- partições por DÉCADA
CREATE INDEX idx_daily_keeper ON playtime_daily(keeper_id, utc_day);
```

**Camada de leitura — `playtime_yearly`** (rollup, reconstruível a qualquer momento a partir do diário):

```sql
CREATE TABLE playtime_yearly (
    lineage_id       UUID NOT NULL REFERENCES lineages(lineage_id) ON DELETE RESTRICT,
    year             SMALLINT NOT NULL,
    seconds_credited BIGINT NOT NULL DEFAULT 0,
    xp_awarded       NUMERIC(40,0) NOT NULL DEFAULT 0,
    days_played      SMALLINT NOT NULL DEFAULT 0,
    keepers_count    SMALLINT NOT NULL DEFAULT 1,
    PRIMARY KEY (lineage_id, year)
);
```

**Sobre particionamento** — "particionar" é dividir uma tabela gigante em pedaços por faixa de data, pra o banco só olhar o pedaço certo. **[CÁLCULO]** em 1.121 anos: partições mensais = **13.452** (inviável — o planejador do Postgres degrada bem antes de alguns milhares), anuais = **1.121** (no limite), **por década = 113** (confortável). Por isso: `playtime_sessions` por **ano** (e a partição some quando for compactada), `playtime_daily` por **década** (nunca some).

**Compactação com prova:** o job noturno lê as sessões do dia, escreve a linha de `playtime_daily` com `day_hash` e só então as partições de sessão antigas podem ser descartadas (recomendo reter **2 anos**). O que se perde é o detalhe minuto a minuto; o que **não** se perde é a corrente de hashes que prova que nenhum dia foi adulterado depois.

#### 1.6 `relics` — relíquias

```sql
CREATE TABLE relics (
    relic_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lineage_id          UUID NOT NULL REFERENCES lineages(lineage_id) ON DELETE RESTRICT,
    forged_by_keeper_id UUID REFERENCES keepers(keeper_id),
    relic_type          TEXT NOT NULL,   -- 'pioneer_seal','era_marker','generation_token','bound_item'
    item_payload        JSONB NOT NULL DEFAULT '{}',  -- MESMA forma do inventory atual
    bound_character_id  TEXT,
    inscription         TEXT,            -- a "palavra ao herdeiro" deixada pelo Guardião
    forged_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    chronicle_seq       BIGINT,          -- aponta pro evento da Crônica que registrou a forja
    transferable        BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_relics_lineage ON relics(lineage_id, forged_at DESC);
```

`item_payload` usa **exatamente** a forma de item que `characters.inventory` já usa (`id/name/icon/description/count/quality/...`, conforme o comentário de `chest_items` em `server/db.js:116-130` **[VERIFICADO]**) — relíquia não é um schema de item novo, é um item existente com procedência. Menos código, menos bug.

#### 1.7 Convivência com `players` / `characters` e o que muda em `NUMERIC_BOUNDS`

**Colunas aditivas (nenhuma alteração destrutiva):**

```sql
ALTER TABLE players    ADD COLUMN IF NOT EXISTS account_id     UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE players    ADD COLUMN IF NOT EXISTS token_epoch    INTEGER NOT NULL DEFAULT 1;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS xp_total       NUMERIC(40,0) NOT NULL DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS legacy_level   BIGINT;       -- nível derivado do servidor
ALTER TABLE characters ADD COLUMN IF NOT EXISTS pre_era_level  BIGINT;       -- memória do nível antigo (§4)
```

**Pré-requisito obrigatório:** rodar `server/migrate_level_bigint.js --confirm` **antes de tudo**. Ele está escrito e **não executado** **[VERIFICADO]** (`migrate_level_bigint.js:3`); enquanto o banco de produção tiver `level INTEGER`, o teto real é 2,1 bilhões, **47× abaixo** do 1e11 do conceito. Nada do legado funciona sem esse passo.

**O que eu conferi sobre precisão — e onde eu corrijo uma suposição comum:**

| Grandeza | Valor no nível 1e11 | Cabe onde? |
|---|---:|---|
| `level` | 1,0e11 | **BIGINT** (9,22e18) — folgado **[CÁLCULO]** |
| atributo (5 pts/nível) | 5,0e11 | **BIGINT** — folgado; teto `1e13` de `NUMERIC_BOUNDS` ok **[CÁLCULO]** |
| `xp` **residual** (`XPRequired(1e11)`) | 8,91e17 | cabe no teto atual `1e19`. **Mas passa de `MAX_SAFE_INTEGER` (9,007e15) já no nível ~4,2e9** — perda de precisão *cosmética*, igual ao já documentado pra `weapon.damage` **[CÁLCULO]** |
| **XP acumulado** (soma da escada inteira) | **3,64e28** | **não existe coluna hoje.** Precisa de **`NUMERIC(40,0)`** **[CÁLCULO]** |
| HP (`L^1,90`) | 7,94e20 | **NÃO cabe em BIGINT.** Passa de 9e15 já no nível ~2,5e8 — tem que ser derivado/float ou string, nunca inteiro do banco **[CÁLCULO]** |
| dano de arma (`10·L^1,85`) | 2,24e21 (sem tier) | JSONB; o teto `1e30` já foi previsto em `db.js:459` **[VERIFICADO]**, mas o **valor serializado vem de um float JS** e perde precisão exata a partir do nível ~1,2e8 **[CÁLCULO]** |
| score acumulado (`200·L^0,5`) | ~4,2e18 | teto atual `1e16` **fica pequeno** — precisa subir pra ~1e20 **[CÁLCULO]** |
| tempo ativo total | 1,47e9 s | teto de `time` é `1e8` (3,17 anos) — **14,7× pequeno**; por isso coluna nova, não reuso **[CÁLCULO]** |

**Por que o XP acumulado precisa de `NUMERIC`, e não é frescura:** em ponto flutuante, `a+b+c` nem sempre dá o mesmo que `a+c+b`. Guardando o total como `DOUBLE PRECISION`, o degrau mínimo representável perto de 3,6e28 é de **4,4e12 de XP** **[CÁLCULO]** — pequeno pro jogo, mas suficiente pra que **dois servidores recomputando a mesma história em ordens diferentes cheguem a totais diferentes**. Num sistema cuja promessa é "a Crônica prova o que aconteceu", isso inviabiliza a auditoria. `NUMERIC` é aritmética decimal exata; é mais lenta, e não importa — essa soma acontece **uma vez por dia por linhagem**, não a cada frame.

**Armadilha do driver `pg` (a mais importante desta seção):** `server/db.js:6-21` já registra um parser global que converte **BIGINT (OID 20)** para `Number`, e o comentário avisa em letras garrafais: *se um dia entrar uma coluna que possa passar de `MAX_SAFE_INTEGER`, **não** remova essa linha — registre um parser específico* **[VERIFICADO]**. `NUMERIC` é o **OID 1700** e por padrão volta como **string** — e é assim que tem que ficar. **Nunca** registre `types.setTypeParser(1700, Number)`: isso destruiria exatamente a precisão que a coluna existe pra proteger. No servidor e nos dois clientes, `xp_total` se manipula com `BigInt(stringVinda)`.

**`NUMERIC_BOUNDS` — mudanças propostas:**

| Campo | Hoje | Proposto | Por quê |
|---|---|---|---|
| `level` | `[1, 1e11]` | mantém | já é o teto do conceito |
| `xp` (residual) | `[0, 1e19]` | mantém | `XPRequired(1e11)=8,9e17` cabe **[CÁLCULO]** |
| `xpTotal` | — | **novo**: string decimal, ≤ 40 dígitos, validada com **BigInt**, teto `4e28` | a validação **não pode** usar `Number` — perderia o que quer checar |
| `score` | `[0, 1e16]` | **`[0, 1e20]`** | acumulado real ~4,2e18 **[CÁLCULO]** |
| `time` | `[0, 1e8]` | mantém (é cronômetro de fase) | tempo do legado mora no ledger, não aqui |
| `weapon.damage` | teto `1e30` | mantém o teto, **mas** serializar como **string decimal** no JSONB | evita a perda de precisão na origem (float do JS) |

> Toda linha dessa tabela que depende da **forma final da curva** está condicionada ao relatório do `progression-actuary` (`raw/02_calibracao.md`), que **ainda não existia** quando escrevi isto (a pasta `raw/` estava vazia) — ver (d).

---

### 2. Servidor autoritativo: crédito de tempo e XP com o cliente como mero apresentador

#### 2.1 A inversão

Hoje: o cliente (`rpg_system.js`) calcula XP e nível, manda em `save_game_state`, e o servidor **valida faixa** e grava **[VERIFICADO]**. Existe um hash anti-cheat client-side (`rpg_system.js:467-472`), mas ele é `btoa(dados + sal)` com o sal **dentro do próprio cliente** — protege contra o jogador casual editando um valor no console, não contra alguém que leia o arquivo.

No legado isso tem que inverter: **o servidor decide o XP**. O cliente vira um apresentador — ele mostra o número que o servidor mandou.

Essa é a mudança mais cara do plano inteiro e também a única que faz a régua do dono ser verdade. Sem ela, "1 hora por dia até 3147" é uma sugestão, não uma regra.

#### 2.2 Eventos novos (contrato para os dois clientes)

| Evento | Direção | Payload | Regra |
|---|---|---|---|
| `legacy_session_start` | cliente → servidor | `{characterId, platform, clientVersion}` | servidor responde com `sessionId`, `beatIntervalMs`, e se essa sessão **credita** ou é **espectadora** |
| `legacy_session_started` | servidor → cliente | `{sessionId, crediting: bool, reason}` | `reason: 'other_session_active' \| 'not_legacy_ghost' \| 'ok'` |
| `legacy_heartbeat` | cliente → servidor | `{sessionId, beatSeq}` | **nenhum timestamp do cliente**; `beatSeq` é o contador de idempotência |
| `legacy_heartbeat_ack` | servidor → cliente | `{beatSeq, secondsCreditedToday, softCapReached}` | alimenta o HUD |
| `legacy_state_sync` | servidor → cliente | `{level, xpTotal (string), secondsToday, era, lineage}` | **o cliente obedece**, nunca o contrário |
| `legacy_session_end` | cliente → servidor | `{sessionId}` | fechamento limpo; a ausência dele é resolvida por timeout |

#### 2.3 Como o tempo é creditado (a regra de ouro)

```
crédito = min( agora_no_servidor − last_beat_at , MAX_BEAT_GAP )
```

`agora_no_servidor` é `now()` do Postgres / `Date.now()` do processo Node. **Nunca** um valor declarado pelo cliente. Isso é a aplicação direta do invariante do `SAVE_SYSTEM_MASTER_PLAN` §2: *"'mais recente' tem que ser um timestamp real do servidor (`updated_at`), nunca um valor declarado pelo cliente"* **[VERIFICADO]**. Consequência prática: **mexer no relógio do celular não faz nada**.

`MAX_BEAT_GAP` (sugiro 90 s para um intervalo de 60 s) garante que uma pausa de 3 horas com a aba aberta não vire "3 horas de crédito" quando a batida voltar.

#### 2.4 Idempotência, quedas de conexão, reconciliação

- **Idempotência:** o par `(sessionId, beatSeq)` é único. Batida repetida (retry do socket, reconexão que reenviou) é **no-op** — o servidor responde `ack` e não credita de novo. Sem isso, cada instabilidade de rede vira XP de graça.
- **Queda:** o servidor não precisa saber que caiu. A sessão fica "aberta" e um job de timeout (a cada 5 min) fecha toda sessão com `last_beat_at` mais velho que `MAX_BEAT_GAP`, com `close_reason='timeout'`. **Só conta o que teve batida** — o tempo entre a última batida e o fechamento **não** é creditado.
- **Reconexão:** se o cliente voltar em até `RESUME_WINDOW` (sugiro 5 min) com o mesmo `sessionId`, retoma a mesma sessão (o intervalo sem batida continua não sendo creditado). Depois disso, sessão nova.
- **Restart do servidor:** no boot, fechar em lote todas as sessões abertas com `close_reason='server_restart'`, creditando só até o `last_beat_at`. Isso evita a "sessão zumbi" que nunca fecha.
- **Reconciliação:** a cada `legacy_state_sync`, se o cliente tiver um nível diferente, ele **sobrescreve o próprio estado**. Não existe merge. Se o cliente discordar, o cliente está errado.

#### 2.5 Web + mobile ao mesmo tempo — o "bastão de crédito"

O `SAVE_SYSTEM_MASTER_PLAN` §3 já lista como **risco conhecido não corrigido**: duas conexões da mesma conta não têm lock compartilhado, e a última escrita vence **[VERIFICADO]**. No legado isso deixa de ser incômodo e vira exploit: abrir web + celular dobra o relógio de graça.

**Solução (só para o crédito de tempo, sem redesenhar o save inteiro):**

```sql
-- Ao abrir uma sessão: quem pegar o bastão credita; os outros jogam em modo espectador.
UPDATE lineages
   SET active_session_id = $novaSessao,
       active_session_until = now() + interval '90 seconds'
 WHERE lineage_id = $1
   AND (active_session_id IS NULL OR active_session_until < now());
-- 0 linhas afetadas => outra sessão está com o bastão => esta entra como espectadora.
```

Cada batida aceita renova `active_session_until`. Quem está com o bastão **joga e credita**; quem não está **joga normalmente, salva normalmente, e não credita tempo** — com um aviso claro na UI ("O relógio do legado está correndo no outro aparelho"). Isso é bem melhor que bloquear a segunda sessão: o cross-play continua existindo, só o *relógio* é único.

Para escritas fora de socket (o job noturno), a serialização não pode ser a fila `saveQueues[socket.id]` — ela é por socket e o job não tem socket. Use `pg_advisory_xact_lock(hashtextextended(lineage_id::text, 0))`.

#### 2.6 O job noturno (`sealDay`) — onde o XP nasce

Uma vez por dia, por linhagem, numa única transação:

1. `pg_advisory_xact_lock(lineage)`.
2. Somar `seconds_credited` das sessões daquele dia UTC, separando por plataforma.
3. Aplicar o **soft-cap diário** (rendimento decrescente acima de N horas) — a fórmula é do `progression-actuary`.
4. Calcular `xp_awarded` (NUMERIC) a partir dos segundos creditados e do nível atual, com `curve_version` gravada junto.
5. `UPDATE characters SET xp_total = xp_total + $xp, legacy_level = $novoNivel WHERE ...`.
6. Gravar `playtime_daily` com `day_hash`/`prev_day_hash`.
7. Se cruzou um marco (era, patente, capítulo): `INSERT` na Crônica com o `FOR UPDATE` do §1.4.
8. Atualizar `playtime_yearly` e `keepers.seconds_credited`.

**Por que em lote e não em tempo real:** **[CÁLCULO]** com 1.000 jogadores ativos batendo a cada 60 s, gravar cada batida no banco dá ~16,7 escritas/s — contra um pool de `max: 10` **sem `connectionTimeoutMillis`**, que é risco conhecido documentado (`SAVE_SYSTEM_MASTER_PLAN` §3, com latência medida subindo pra ~5 s sob rajada) **[VERIFICADO]**. Mantendo o estado da sessão **em memória** e persistindo a cada 5 min + no fechamento, cai pra ~3,3 escritas/min por 1.000 jogadores. O preço: um crash do processo perde até 5 minutos de crédito não persistido. **[HIPÓTESE]** perder 5 min num legado de 409 mil horas é aceitável — confirmar com o dono.

#### 2.7 Como isso respeita os invariantes do SAVE_SYSTEM_MASTER_PLAN

| Invariante (§2 do master plan) | Como o desenho respeita |
|---|---|
| Toda escrita na linha do jogador passa por `saveQueues[socket.id]` | `legacy_heartbeat` e `legacy_session_*` **entram na mesma fila** quando tocam `characters`/`players`. O job noturno não tem socket → usa **advisory lock por linhagem**, e escreve **colunas que o caminho de socket nunca escreve** (`xp_total`, `legacy_level`) — separação por propriedade de coluna, não por sorte |
| Identidade vem de `players[socket.id].email` | `lineage_id` é **resolvido no servidor** a partir do e-mail autenticado. O cliente **nunca** manda `lineageId` |
| `updated_at` real do servidor decide "mais recente" | o crédito de tempo é literalmente `now() − last_beat_at`; nenhum timestamp do cliente entra na conta |
| COALESCE, não sobrescrever | `xp_total` só cresce (`xp_total + $delta`), nunca recebe um absoluto do cliente — mesmo padrão já usado em `incrementPlayerStat()` **[VERIFICADO]** |
| Login nunca inicia gameplay como efeito colateral | `legacy_session_start` é evento **separado** do login, disparado por ação explícita do jogador |
| Handler nunca assume que `players[socket.id]` existe | todos os handlers novos chamam `ensurePlayerRecord(socket.id)` antes de qualquer coisa |
| Site e mobile são cópias separadas | todo evento novo é **mudança de contrato para os dois clientes** — item obrigatório do checklist de deploy |

---

### 3. Sucessão técnica

#### 3.1 Máquina de estados

```
                    ┌──────────── cancelled (Guardião desiste)
                    │
designated ──► sealed ──► pending_acceptance ──► transition ──► completed
     │            │               │                   │
     │            │               └── refused         └── cancelled (dentro da janela)
     │            └── expired (token venceu)
     └── cancelled
```

#### 3.2 Fluxo, passo a passo

1. **Designar** (`succession_designate`): exige **re-autenticação por senha** na hora (step-up auth), mesmo com sessão válida — é o ato mais irreversível do jogo. Cria `successions(state='designated')` + evento `succession_designated` na Crônica.
2. **Selar o cofre** (`succession_seal`): o servidor gera `claimToken = crypto.randomBytes(32).toString('base64url')` e **5 códigos de resgate**. Mostra **uma única vez**; grava só os hashes SHA-256. O Guardião imprime, escreve num papel, guarda no cofre da família — o que quiser. Estado vira `sealed`.
3. **Gatilho**, uma de três formas:
   - `manual`: o Guardião entrega o token em vida e o herdeiro resgata.
   - `scheduled`: data marcada; o job noturno abre a janela quando chegar.
   - `dormancy` (**relógio morto**): N dias sem nenhuma batida (sugiro **540 dias**, ~18 meses) → o job noturno marca `lineages.status='dormant'`, avisa por e-mail em 3 ondas (dia 365, 450, 520) e só então libera o resgate.
4. **Resgatar** (`succession_claim`, com o token): o servidor compara o SHA-256, com **rate limit** no mesmo mecanismo `isRateLimited()` já existente **[VERIFICADO]** `server/index.js:401`, e trava o cofre após 5 tentativas erradas. Cria a linha de `keepers` com `generation+1`, estado vira `transition`.
5. **Transição** (janela de arrependimento, sugiro **30 dias**): a conta funciona normalmente sob o novo Guardião, **o tempo já é creditado a ele**, e o Guardião anterior ainda pode cancelar (`succession_cancel`). Depois da janela, `completed`: `keepers.ended_at` do anterior é preenchido, evento `succession_completed` entra na Crônica.
6. **Recusa/expiração/disputa:** `refused` e `expired` são estados finais registrados na Crônica. **Nada é apagado** — inclusive cancelamentos e recusas ficam na história. Disputa entre dois herdeiros é problema **humano e jurídico**, não técnico: o técnico só garante que o token é único e que quem usou primeiro está registrado com data e hora.

#### 3.3 Credenciais — o que transferir e o que NÃO transferir

**Não se transfere senha. Nunca.** Nem em claro, nem o hash bcrypt. O herdeiro **define uma senha nova** no momento do resgate, e o servidor:

```sql
UPDATE players
   SET password = $novoHashBcrypt,
       token_epoch = token_epoch + 1     -- <<< invalida TODAS as sessões antigas
 WHERE account_id = $1;
```

**Aqui está o achado que eu considero mais urgente deste relatório.** Hoje o JWT é `jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' })` **[VERIFICADO]** `server/index.js:123-125`, e `session_login` só faz `jwt.verify` + checa se a conta existe **[VERIFICADO]** `server/index.js:788-800`. **Não existe nenhuma forma de revogar uma sessão.** Ou seja: passar o bastão hoje deixaria o Guardião anterior com acesso pleno à conta por até **30 dias**, sem que ninguém percebesse.

Correção mínima (3 linhas de conceito, aditiva):

```js
// ao assinar
jwt.sign({ email, epoch: player.token_epoch }, JWT_SECRET, { expiresIn: SESSION_TOKEN_TTL });
// ao verificar, em session_login
if (Number(payload.epoch || 0) !== Number(playerData.tokenEpoch)) {
    socket.emit('session_login_error', { message: 'Session revoked, please log in again.' });
    return;
}
```

Isso também resolve, de brinde, dois riscos já listados no master plan §3 (sem "esqueci minha senha", sem jeito de expulsar uma sessão roubada) e serve a qualquer troca de senha futura, não só à sucessão.

**O `players.email` (login) muda?** Minha recomendação: **não**, no MVP. A conta é o artefato herdado — o herdeiro entra com o endereço do fundador e a senha dele próprio, e o e-mail *pessoal* de cada Guardião vive em `keepers.contact_email`. É menos elegante e é muito mais seguro que renomear uma PK com 8 FKs. Virou **DECISÃO D-1** em (e).

---

### 4. Migração das ~48 contas / ~139 personagens

#### 4.1 As três estratégias

| | **A. Preservar nível** | **B. Remapear por tempo investido** | **C. "Era Zero" (recomendada)** |
|---|---|---|---|
| **Como** | o nível atual vira o nível no eixo novo | converte esforço passado em nível novo | todos começam do 1 no eixo novo, na mesma data; o passado vira histórico + Selo de Pioneiro |
| **Prós** | ninguém "perde" nada; zero comunicação difícil | o mais justo em espírito | régua limpa e honesta; a única que não depende de dado que não existe; marco narrativo forte (funda a Era Zero na Crônica) |
| **Contras** | contas de teste antigas com nível inflado largam séculos à frente — a régua nasce mentindo | **o dado não existe**: não há coluna de tempo de conta; `characters."time"` é cronômetro de fase **[VERIFICADO]** `db.js:450-453`. Só dá pra usar proxies (`created_at`, `total_kills`, badges), que são chute com cara de precisão | psicologicamente é "reset" — precisa de comunicação boa |
| **Risco técnico** | baixo | **alto** (fórmula arbitrária, irreversível, impossível de justificar) | baixo |

**Recomendação: C, em versão híbrida e aditiva.** O nível antigo **não é apagado** — vai pra `characters.pre_era_level` e vira uma entrada de fundação na Crônica ("Era -1: chegou ao nível 47 antes da fundação"). O jogador ganha o **Selo de Pioneiro** (`relics.relic_type='pioneer_seal'`), que só existe pra quem estava lá antes e nunca mais pode ser forjado. Ninguém perde memória; a régua nasce limpa.

#### 4.2 Roteiro de migração — mesmo formato do `migrate_level_bigint.js`

O script `server/migrate_legacy_era_zero.js` (a escrever na Fase 4) copia, de propósito, tudo o que já deu certo no `migrate_level_bigint.js` **[VERIFICADO]**: cabeçalho explicando *por quê*, **simulação por padrão**, `--confirm` obrigatório pra escrever, **uma única transação**, **idempotente**, e verificação pós-migração que sai com `exit 1` se algo não bater.

```
PASSO 0 — Pré-voo (sem tocar em nada)
  □ Snapshot no painel do Supabase (Database > Backups) — a única rede de segurança real
  □ Export JSON por conta (§5) das 48 contas, guardado FORA do Supabase
  □ Avisar jogadores: 7 dias antes, 24 h antes, 1 h antes (chat global + Egrégora + redes)
  □ Confirmar que migrate_level_bigint.js --confirm JÁ RODOU (pré-requisito absoluto)

PASSO 1 — Simulação
  node migrate_legacy_era_zero.js
  Imprime: nº de contas, nº de personagens, distribuição de níveis, quem ganha Selo de Pioneiro,
  e o CHECKSUM DE CONTROLE (ver passo 4). Escreve zero bytes.

PASSO 2 — Parar o jogo
  pm2 stop danger-ghost     (ALTER TABLE pega ACCESS EXCLUSIVE LOCK; nenhum save pode estar em voo)

PASSO 3 — Aplicar
  node migrate_legacy_era_zero.js --confirm
  BEGIN;
    -- só ADIÇÕES: colunas novas, tabelas novas, backfill de lineages/keepers/chronicle
    -- pre_era_level := level;  legacy_level := 1;  xp_total := 0;
    -- INSERT lineage + keeper geração 1 + evento 'lineage_founded' na Crônica
    -- INSERT relic 'pioneer_seal' por conta elegível
  COMMIT;

PASSO 4 — Verificação por checksum
  Antes e depois, sobre as colunas que NÃO PODEM mudar:
    SELECT md5(string_agg(email||':'||character_id||':'||inventory::text||':'||equipment::text,
                          '|' ORDER BY email, character_id)) FROM characters;
  Os dois md5 têm que ser IDÊNTICOS. Se diferirem, a migração tocou em dado que não devia.
  Mais: contagem de linhas antes/depois (players, characters) igual — exatamente o que o
  migrate_level_bigint.js já faz nas linhas 217-226.
  E: verify_chronicle.js recomputa a corrente de hashes das 48 linhagens recém-criadas.

PASSO 5 — Subir com trava de versão
  pm2 start + MIN_CLIENT_VERSION no handshake (§4.4)

PASSO 6 — Observação
  48 h monitorando save_error, tempo creditado por linhagem, e o primeiro sealDay noturno.
```

#### 4.3 Reversão

Aqui está a vantagem decisiva da migração **aditiva**: como nenhuma coluna existente é alterada ou apagada, **reverter é voltar o código**, não desfazer DDL. `pm2 stop` → deploy do bundle anterior → `pm2 start`. As tabelas e colunas novas ficam lá, ignoradas e inofensivas.

Isso resolve o problema real apontado no próprio `migrate_level_bigint.js:76-79`: `BIGINT → INTEGER` **[VERIFICADO]** só funciona enquanto nenhum valor passar de 2,1 bilhões — na prática é caminho de ida. Migração aditiva não tem esse defeito.

**Janela de manutenção:** **[CÁLCULO]** com 48 e 139 linhas, os ALTER são questão de **milissegundos**. A janela real é deploy + verificação + margem: **anunciar 2 horas**, esperar usar 20 minutos.

#### 4.4 Paridade web ↔ mobile (o ponto onde esse projeto já se machucou)

O `SAVE_SYSTEM_MASTER_PLAN` §2 é explícito: *"site e mobile são cópias separadas do mesmo comportamento pretendido, não do mesmo arquivo"* **[VERIFICADO]**. E `CLAUDE.md` §3 documenta as duas pastas-armadilha (o `www/` morto dentro de `danger ghost/` e os arquivos soltos na raiz de `danger_ghost_mobile/`).

- **Web:** cache-busting em toda tag `<script>`/`<link>` (`?v=era0`) — sem isso, navegador com cache continua mandando o formato velho.
- **Mobile:** editar **só** `danger_ghost_mobile/www/js/...`, `npx cap sync android`, **APK novo** compilado e publicado no site (não há loja — `CLAUDE.md` §8, `publisher-bizdev`).
- **Versão mínima de cliente (obrigatória):** o cliente passa a mandar `clientVersion` no handshake do socket. O servidor compara com `MIN_CLIENT_VERSION` e:
  - abaixo do mínimo → emite `client_update_required` e coloca a sessão em **modo leitura**: o jogador joga, **não credita tempo e não grava XP**, com um aviso claro e o link do APK novo;
  - **não** derrubar a conexão. Um APK antigo que ninguém atualizou é o cenário mais provável do mundo, e derrubar o jogador só faz ele desinstalar.

Sem essa trava, um APK antigo continuaria mandando `xp`/`level` calculados no cliente e o servidor os aceitaria — o buraco exato que a inversão do §2 existe pra fechar.

---

### 5. Backup, exportação e restauração

#### 5.1 Por conta (o jogador leva o legado dele embora)

`GET /api/legacy/export` autenticada por **Bearer JWT**, reusando `getAuthenticatedEmailFromRequest()` que já existe **[VERIFICADO]** `server/index.js:1528-1541`. Devolve **um arquivo JSON canônico** (chaves ordenadas, UTF-8, sem binário):

```json
{
  "format": "danger-ghost-legacy-export",
  "format_version": 1,
  "exported_at": "2026-09-20T12:00:00Z",
  "lineage":  { "...": "..." },
  "keepers":  [ "...gerações em ordem..." ],
  "characters": [ "...saves completos..." ],
  "chronicle": [ "...eventos com prev_hash e entry_hash..." ],
  "playtime_daily": [ "...dias selados com day_hash..." ],
  "relics": [ "..." ],
  "integrity": {
    "chronicle_head": "sha256:...",
    "playtime_head":  "sha256:...",
    "section_hashes": { "keepers": "sha256:...", "characters": "sha256:..." }
  }
}
```

Formato aberto, legível por humano, sem dependência do Postgres pra ser entendido daqui a 200 anos. O bloco `integrity` é o que permite **verificar** o arquivo sem confiar em quem o entregou. Formato definitivo a combinar com `deep-time-archivist` (`raw/04_durabilidade.md`).

#### 5.2 Global

- **Diário:** backup automático do Supabase (o que o plano contratado oferecer — **[HIPÓTESE]**, preciso que o dono confirme o plano).
- **Semanal:** `pg_dump` completo + export JSONL por tabela, em **3 cópias** e **2 mídias diferentes**, sendo pelo menos uma fora da infraestrutura do jogo.
- **Mensal:** publicar a lista de `chronicle_head` de todas as linhagens (a "âncora" do §1.4).

#### 5.3 O teste de restauração (um backup não testado não é backup)

**Trimestral**, num Postgres vazio e descartável (local, nunca produção):

1. Restaurar o dump mais recente.
2. `verify_chronicle.js`: recomputar `entry_hash` de **todos** os eventos de **todas** as linhagens e comparar com `lineages.chronicle_head`. Qualquer divergência = falha.
3. `verify_ledger.js`: recomputar a corrente `day_hash`/`prev_day_hash` e conferir que `SUM(playtime_daily.seconds_credited)` bate com `lineages.total_seconds_credited`.
4. Conferir contagem de linhas de todas as tabelas contra o export.
5. Subir o servidor apontado pro banco restaurado e fazer um login real com **conta descartável** (`test_xxx_<timestamp>@example.com`), conforme a skill `e2e-db-verification`, e apagar depois.
6. **Registrar o resultado na própria Crônica global** — o teste de restauração vira parte da história do jogo, não um item de checklist que alguém esquece.

---

### 6. Desempenho e custo em escala

| Preocupação | Situação | O que fazer |
|---|---|---|
| **Pool do Postgres** | `max: 10`, **sem `connectionTimeoutMillis`**; medido: 15 jogadores simultâneos subiram a latência de poucos ms pra ~5 s **[VERIFICADO]** master plan §3 | definir `connectionTimeoutMillis: 5000` e subir `max` conforme o plano do Supabase. **Pré-requisito** de qualquer feature nova com escrita periódica |
| **Escrita dos heartbeats** | **[CÁLCULO]** 1.000 jogadores × 1 batida/min = 16,7 escritas/s se persistir cada uma | estado em memória + persistência a cada 5 min ⇒ ~0,06 escritas/s. Reduz ~300× |
| **Tamanho do ledger** | **[CÁLCULO]** 33 MB/linhagem em 1.121 anos (diário); 33 GB com 1.000 linhagens | ok. A camada de sessão (2,95 GB/linhagem se guardada crua) é o que **não** pode ficar — retenção de 2 anos + DROP PARTITION |
| **Tamanho da Crônica** | **[CÁLCULO]** 1 evento/dia = 409.538 eventos ≈ **149 MB/linhagem**; 1 evento/mês = 13.454 eventos ≈ **5 MB** | **a Crônica é só para eventos significativos** (marcos, sucessões, relíquias, eras). O dia a dia mora no ledger. Decisão de design, não de storage |
| **Ranking por linhagem** | `SUM()` sobre séculos de `playtime_daily` a cada abertura de tela é inviável | tabela `lineage_standings` atualizada pelo job noturno; a tela lê **uma linha por linhagem**. Nunca agregar ao vivo |
| **Número de partições** | **[CÁLCULO]** mensal = 13.452 (inviável), anual = 1.121, **década = 113** | `playtime_daily` por década; `playtime_sessions` por ano com descarte |
| **Limites do Supabase** | **[HIPÓTESE]** — não sei qual plano está contratado e **não consultei** (brief §2.3). O plano gratuito historicamente **pausa o projeto após ~7 dias sem atividade**, o que para um jogo de 1.121 anos é risco existencial | **DECISÃO D-5** em (e): confirmar o plano e, se for gratuito, migrar para pago ou para o Postgres da própria VPS |
| **Com milhares de contas** | **[CÁLCULO]** 10.000 linhagens = 3,65 M linhas/ano no diário | continua trivial para Postgres. O gargalo real será **conexões simultâneas do Socket.io**, não o banco |

---

### 7. Roadmap técnico faseado

Estimativas em **dias de trabalho de um dev solo com ajuda de agentes** (dia = ~4 h de foco real), assumindo o ritmo já observado neste projeto **[HIPÓTESE]**.

| Fase | O que entra | Dias | Depende de |
|---|---|---:|---|
| **F0 — Fundações numéricas** | `migrate_level_bigint.js --confirm` (pré-requisito!); `account_id`; `token_epoch` + revogação de sessão; `xp_total NUMERIC`; `NUMERIC_BOUNDS` com BigInt; `connectionTimeoutMillis`; `clientVersion` no handshake | **3–5** | nada. **Pode começar hoje** |
| **F1 — Tempo autoritativo** ⭐ | `playtime_sessions`/`daily`/`yearly`; eventos de sessão e heartbeat; bastão de crédito; job de timeout; job `sealDay` | **5–8** | F0 + **`raw/02_calibracao.md`** (a fórmula de XP) |
| **F2 — Linhagem + Crônica** ⭐ | `lineages`, `keepers`, `chronicle_events` + trigger append-only + gravação com `FOR UPDATE`; eventos de marco | **4–6** | F1 + `raw/03_sucessao_cronica.md` (quais eventos existem) |
| **F3 — Sucessão** | `successions`, `succession_vault`, designar/selar/resgatar/transição/cancelar; relógio morto; step-up auth | **5–7** | F2 + `raw/03` + `raw/06_juridico` (menores, LGPD) |
| **F4 — Migração Era Zero** | `migrate_legacy_era_zero.js`; export por conta; janela; comunicação; APK novo | **3–4** | F0–F3 |
| **F5 — Relíquias, ranking, export** | `relics`, `lineage_standings`, `/api/legacy/export` | **4–6** | F2 |
| **F6 — Durabilidade** | export global, `verify_chronicle.js`, `verify_ledger.js`, teste de restauração, âncora externa | **3–5** | F5 + `raw/04_durabilidade.md` |
| | **Total** | **27–41** | |

⭐ **MVP técnico = F0 + F1 + F2 (12 a 19 dias):** nesse ponto o tempo é autoritativo no servidor, a linhagem existe, a Crônica registra a história e nada disso pode ser forjado pelo cliente. Sucessão ainda é manual (você faz na mão, no banco) — e tudo bem: a primeira sucessão real deste jogo provavelmente acontece daqui a décadas.

#### 7.1 Mudanças mínimas no cliente (só em tópicos — nada implementado)

**Web (`danger ghost/js/...`) e Mobile (`danger_ghost_mobile/www/js/...`) — as duas, sempre:**

- `js/game/network.js`: emitir `legacy_session_start`/`legacy_heartbeat`/`legacy_session_end`; ouvir `legacy_state_sync`, `legacy_heartbeat_ack`, `client_update_required`.
- `rpg_system.js`: **parar de ser a autoridade de XP/nível** — `addXp()` deixa de decidir e passa a aplicar o que o servidor mandou. É a mudança mais invasiva; preservar o cálculo local só como *previsão* de UI.
- Números grandes: exibir `xp_total` via **BigInt/string**, nunca `Number` (senão o total vira um float arredondado na tela).
- HUD do legado: tempo creditado hoje, aviso de soft-cap, aviso de "modo espectador" quando o outro aparelho está com o bastão.
- Telas novas: Crônica (lista paginada por `seq` DESC), Guardião/Herdeiro, resgate por token, relíquias.
- Bloqueio de cliente desatualizado: banner + link do APK, **sem derrubar** o jogador.
- Mobile também: `npx cap sync android` + APK recompilado (`CLAUDE.md` §3.4). **Não editar** os arquivos da raiz de `danger_ghost_mobile/` nem o `www/` morto de `danger ghost/`.

---

## (c) Lacunas que eu fechei

1. **Esquema completo do legado** — 9 tabelas + 5 colunas aditivas, com tipos, chaves, `CHECK`, índices (inclusive os **índices únicos parciais** que transformam "um Guardião por vez" e "uma sucessão aberta por vez" em regra do banco).
2. **Dimensionamento real do ledger por séculos** — 4 formatos comparados com números calculados, escolha de 2 camadas + rollup, estratégia de particionamento com a conta das partições (13.452 vs 1.121 vs 113).
3. **Crônica append-only com hash encadeado** — formato do hash, trigger que proíbe UPDATE/DELETE, e o `SELECT ... FOR UPDATE` sem o qual a corrente bifurca sob concorrência.
4. **Onde a precisão quebra, com número** — XP residual (ok até 1e19), XP **acumulado** (3,64e28, precisa `NUMERIC(40,0)`), HP (7,94e20, não cabe em BIGINT), dano (2,24e21), score acumulado (4,2e18, teto atual pequeno), tempo total (1,47e9 s, 14,7× acima do teto de `time`).
5. **A armadilha do driver `pg` com `NUMERIC`** — por que **não** registrar `setTypeParser(1700, Number)`, ligando ao precedente já documentado no próprio `db.js` para o BIGINT.
6. **Protocolo de crédito de tempo** — idempotência por `(sessionId, beatSeq)`, `MAX_BEAT_GAP`, timeout, retomada, restart do servidor, reconciliação unidirecional.
7. **Web + mobile simultâneos** — "bastão de crédito" com `UPDATE` condicional, que fecha (no escopo do tempo) o risco conhecido nº 1 do master plan sem redesenhar o save.
8. **Revogação de sessão na sucessão** — achado de que o JWT de 30 dias **não tem revogação hoje**, com a correção mínima (`token_epoch`) que também cobre troca de senha e sessão roubada.
9. **Três estratégias de migração comparadas + roteiro executável** no molde do `migrate_level_bigint.js`, com checksum md5 sobre as colunas que não podem mudar, plano de reversão que funciona de verdade (migração aditiva) e janela de manutenção dimensionada.
10. **Versão mínima de cliente** com degradação para modo leitura — sem isso, um APK antigo continuaria escrevendo XP no formato velho.
11. **Teste de restauração** com passos verificáveis (recomputar a corrente de hashes), não "temos backup".

---

## (d) Lacunas que dependem de outros departamentos

| Lacuna | De quem | Situação |
|---|---|---|
| **A fórmula de XP por segundo creditado, o soft-cap diário e a curva final** | `progression-actuary` → `raw/02_calibracao.md` | **BLOQUEANTE para a Fase 1.** Verifiquei: a pasta `docs/legacy-plan/raw/` **não existia** quando escrevi isto. Meu desenho é **agnóstico à curva** de propósito (o XP entra como `NUMERIC` e a versão da curva é gravada em `playtime_daily.curve_version`), mas o job `sealDay` não tem o que calcular sem essa fórmula. **Também preciso** que ele confirme o teto máximo de `xp_total` — dimensionei `NUMERIC(40,0)` a partir de 3,64e28 com a curva atual; se a curva mudar de forma, o teto muda |
| **Quais eventos entram na Crônica e quais são só ledger** | `legacy-systems-designer` → `raw/03_sucessao_cronica.md` | **[CÁLCULO]** é o que separa 5 MB de 149 MB por linhagem. Meu esquema aceita qualquer lista; preciso da lista |
| **Prazos de dormência, janela de transição, nº de códigos de resgate, política de disputa** | `legacy-systems-designer` + `digital-succession-counsel` | sugeri 540 / 30 dias / 5 códigos como ponto de partida — são números **meus**, não decididos |
| **Detecção de bot/AFK/idle, o que conta como "ativo", multi-conta, RMT** | `security-engineer` → `raw/05_integridade_antiabuso.md` | meu desenho entrega **o lugar** onde a decisão dele encaixa (`seconds_discarded`, `discard_reason`, o `beats_rejected`), mas a **regra** é dele. Também preciso que ele revise o `claim_token` e o step-up auth |
| **LGPD × Crônica append-only** | `digital-succession-counsel` | conflito direto: apagar a conta hoje faria `ON DELETE CASCADE` em 8 tabelas **[VERIFICADO]**, e eu usei `ON DELETE RESTRICT` na Crônica pra **impedir** isso. Deixei `keepers.contact_email_hash` como saída (apagar o claro, manter o hash), mas **quem decide é ele** |
| **Formato canônico do arquivo de export e as custódias** | `deep-time-archivist` → `raw/04_durabilidade.md` | propus um esqueleto JSON com bloco de integridade; o formato oficial é dele |
| **Distribuição real de níveis das 48 contas / 139 personagens** | **o dono precisa autorizar** | brief §2.3 me proíbe de consultar produção. Sem isso não dá pra dizer quantas contas ganham Selo de Pioneiro nem se há níveis absurdos de teste. **Roda `migrate_legacy_era_zero.js` em simulação, que imprime tudo sem escrever nada** |
| **Plano contratado do Supabase e limites reais** | **o dono** | **[HIPÓTESE]** não consultei. Risco de pausa por inatividade no plano gratuito |
| **UI dos números gigantes e das telas novas** | `ui-ux-designer` + `mobile-platform-engineer` | só listei em tópicos (§7.1) |

---

## (e) DECISÕES PARA O DONO

### D-1 — O e-mail de login muda quando o herdeiro assume?

| | Opção | Prós | Contras |
|---|---|---|---|
| A | **O e-mail do fundador permanece** como login para sempre; cada Guardião tem seu e-mail de contato em `keepers` | zero risco (não mexe numa PK com 8 FKs); "a conta é o artefato herdado" é narrativamente **melhor** | o herdeiro loga com um endereço que não é dele; se o provedor do e-mail morrer, não há recuperação por e-mail |
| B | Renomear `players.email` na sucessão | intuitivo | reescreve a PK e 8 FKs em cascata, num banco sem staging. Alto risco |
| C | Migrar tudo para `account_id` como PK e deixar o e-mail editável | o "certo" a longo prazo | migração grande, semanas, mexe em tudo que já funciona |

**Minha recomendação: A agora, com `account_id` já criado (parte da Fase 0) para deixar C viável no futuro sem refazer as tabelas do legado.** É a opção que não arrisca dados reais hoje e não fecha nenhuma porta.

### D-2 — Web + mobile ao mesmo tempo: o que acontece com o relógio?

| | Opção | Prós | Contras |
|---|---|---|---|
| A | **Bastão de crédito**: uma sessão credita, a outra joga em modo espectador | cross-play preservado; impossível dobrar o tempo; aviso honesto na UI | o jogador pode estranhar ("por que não estou ganhando tempo?") |
| B | Bloquear a segunda sessão | simples | quebra o cross-play, que é um pilar do projeto (`CLAUDE.md` §3) |
| C | Somar as duas | nenhum | destrói a régua: abrir dois aparelhos dobra o progresso |

**Recomendação: A.**

### D-3 — Uma linhagem por conta, ou várias?

| | Opção | Prós | Contras |
|---|---|---|---|
| A | **1 conta = 1 linhagem = 1 ghost do legado** | é literalmente a régua do dono ("a mesma conta, com o mesmo ghost"); esquema simples; ranking justo | o jogador não pode manter dois legados |
| B | Várias linhagens por conta | flexível | multiplica o tempo creditado por conta ou exige repartir; abre brecha de abuso; complica tudo |

**Recomendação: A** (é por isso que pus `UNIQUE(account_id)` em `lineages`). Ghosts secundários continuam existindo e sendo jogáveis — eles só **não movem o relógio do legado**.

### D-4 — Migração das contas atuais

**Recomendação: C — "Era Zero" aditiva com Selo de Pioneiro**, pelos motivos do §4.1: é a única que não depende de um dado de tempo que o banco nunca guardou, a única que não deixa uma conta de teste largando séculos à frente, e a única cuja reversão é só voltar o código.

### D-5 — Infraestrutura para o longo prazo (decisão de risco, não de gosto)

| | Opção | Prós | Contras |
|---|---|---|---|
| A | Continuar no Supabase, **confirmando um plano pago** | menor esforço; backups gerenciados | dependência de uma empresa; **[HIPÓTESE]** plano gratuito pausa por inatividade |
| B | Postgres na própria VPS (DeSoHosting) | controle total; sem pausa | backup e SSL viram responsabilidade sua |
| C | **Supabase pago + réplica na VPS + export semanal fora**, os três | redundância real | custo e disciplina operacional |

**Recomendação: C**, com A como piso mínimo. Um jogo que promete 1.121 anos não pode depender de um único fornecedor — e essa é a fronteira com o `deep-time-archivist`.

### D-6 — Revogação de sessão (`token_epoch`)

Opções: (A) implementar na Fase 0 **[recomendado]**; (B) implementar só na Fase 3, junto com a sucessão; (C) não implementar e reduzir o TTL do JWT de 30 dias para 24 h.

**Recomendação: A.** É barato, aditivo, e conserta hoje um problema que já existe independentemente do legado: **não há como expulsar uma sessão**. B deixa o buraco aberto até a Fase 3; C piora a experiência de todo mundo sem resolver o problema.

---

## (f) Riscos e o que eu NÃO consegui verificar

### Riscos

1. **A inversão do XP é a mudança mais arriscada do plano.** Hoje o cliente é a autoridade; passar isso para o servidor toca `rpg_system.js` (o coração do RPG), os dois clientes e o formato de save. **Mitigação:** fazer em **modo sombra** primeiro — o servidor calcula, grava em `playtime_daily.xp_awarded`, **não** aplica, e você compara por 2 semanas com o que o cliente calculou. Só depois vira autoritativo.
2. **Não existe ambiente de staging.** `migrate_level_bigint.js:44` diz isso com todas as letras **[VERIFICADO]**. Todo teste real é contra o Supabase de produção com conta descartável (skill `e2e-db-verification`). **Mitigação:** subir um Postgres local (Docker) para a Fase 1 em diante — para este plano, isso deixa de ser luxo.
3. **`migrate_level_bigint.js` ainda não rodou.** Enquanto isso, o teto real do banco de produção é 2,1 bilhões, **47× abaixo** do conceito, e um estouro **congela o progresso em silêncio** via `COALESCE` **[VERIFICADO]**.
4. **Dependência circular de cronograma:** F1 precisa da curva do `progression-actuary`; se `raw/02` mudar a forma da curva depois da F1, o `curve_version` em `playtime_daily` permite recalcular — **desde que** os segundos creditados tenham sido preservados. Por isso o ledger guarda **segundos**, não só XP: **tempo é o dado primário, XP é derivado**. Se você guardar só o XP, uma recalibração futura apaga a história.
5. **Sucessão é um problema humano com uma casca técnica.** Token perdido, herdeiro que não existe mais, disputa entre irmãos, menor de idade — nada disso se resolve em SQL. O técnico só garante unicidade, registro e data.
6. **Dev solo, séculos de horizonte.** A sucessão do *operador* é risco maior que qualquer bug aqui (`deep-time-archivist`).
7. **A Crônica não é imune a quem tem acesso ao banco.** O trigger bloqueia o código do servidor, não um superusuário. **A âncora externa mensal é o que transforma "difícil de adulterar" em "detectável se adulterado"** — sem ela, a corrente de hashes protege menos do que parece.

### O que eu NÃO consegui verificar

- **Nada do banco de produção** — brief §2.3 me proíbe. Não sei a distribuição real de níveis, quantas contas são de teste, se `migrate_level_bigint.js` foi executado depois de 16/09, nem a versão do Postgres no Supabase (`gen_random_uuid()`, particionamento declarativo e `hashtextextended` dependem disso — tudo presente desde o PG 11–13 **[HIPÓTESE]**).
- **O plano contratado do Supabase** e seus limites de armazenamento, conexões e retenção de backup.
- **A curva final** — todos os meus números de XP usam `100·L^1,45`, que **muito provavelmente vai mudar** (o §8 do brief praticamente garante). Os números de *tempo*, *linhas*, *bytes* e *partições* **não** dependem da curva e continuam válidos.
- **Se o overhead de `NUMERIC` sobre `DOUBLE PRECISION`** é irrelevante na prática — argumentei que sim porque a soma é diária, mas **não medi**.
- **Comportamento real do Socket.io com mil conexões** neste servidor. O máximo documentado neste projeto são 15 jogadores simultâneos testados **[VERIFICADO]** (master plan §3).
- **Se `characters."time"` está sendo usado como algo além do cronômetro de fase** — procurei por `.time` em `rpg_system.js` e **não achei uso**; o comentário de `db.js:450-453` diz que é contador de sessão. Não varri `engine.js` inteiro (~220 KB, `CLAUDE.md` §6 desaconselha). Se alguém descobrir que `time` acumula tempo de conta em algum lugar, o teto de `1e8` (3,17 anos) vira um bug latente.

---

*Fim do relatório. Nenhum arquivo do jogo foi alterado; nenhuma migração foi executada; nenhuma consulta foi feita ao banco de produção. Os scripts de cálculo ficaram no scratchpad da sessão.*
