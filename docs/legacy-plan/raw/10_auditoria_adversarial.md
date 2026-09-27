# 10 — Auditoria Adversarial do Plano do Jogo Legado

Autor: `forensic-analyst` · Data: 2026-09-20 · Modo: **PLANO** (nenhum arquivo do jogo foi tocado; nenhuma consulta ao banco de produção; nenhuma migração rodada)
Escopo: auditar os nove relatórios (`01`–`09`) contra o checklist do brief §6, consolidar e **resolver** as contradições entre eles, conferir fatos de alto impacto, atacar o conceito (red team), e entregar a lista mestra de decisões para o dono.

> **Postura desta auditoria.** Eu assumo que o plano está errado até prova em contrário — do mesmo jeito que assumo que um bug "já corrigido" continua vivo em outro lugar até eu rastrear a cadeia causal inteira. Os nove relatórios são bons; nenhum deles é confiável sozinho, porque **cada um leu uma fatia do sistema e presumiu o resto**. O papel deste documento é achar exatamente onde as fatias não encaixam.

Legenda: **[VERIFICADO]** = li no código/doc citado, ou confirmei por fonte externa (com link e data); **[CÁLCULO]** = recomputei em Node, no scratchpad da sessão; **[HIPÓTESE]** = julgamento meu; **[REFUTADO]** = a afirmação de um relatório está factualmente errada; **[NÃO CONSEGUI VERIFICAR]** = fora do meu alcance no modo PLANO.

**Mini-glossário desta auditoria:** *régua* = a promessa do dono (1 h/dia ⇒ nível 1e11 em 3147); *veredito canônico* = qual versão de uma contradição o plano final deve adotar; *sideload* = instalar um app Android fora de uma loja, por arquivo `.apk`; *chave debug* = a chave de assinatura automática que o Android Studio gera para testes, diferente da chave de release do desenvolvedor.

---

## (a) Resumo em 10 linhas

1. **URGENTE E INDEPENDENTE DO LEGADO:** a data de **30/09/2026** citada por `04` está **[VERIFICADO]** — mas o *escopo* que `04` descreve está errado. A trava dessa data vale para **lojas participantes**, não para o APK baixado do site. O `ghostgames.club` não quebra em 30/09/2026; o risco real é o **rollout global de 2027**, e a chave **debug** é um problema separado e imediato (§1).
2. **A premissa "`level` ainda é INTEGER em produção" está [REFUTADA]** pelo fato da sessão (migração executada e conferida por checksum). `db.js` está **coerente** com o banco migrado, mas **quatro blocos de comentário do próprio `db.js` mentem** — foi de lá que `02`, `04` e `09` tiraram a premissa errada. Isso precisa ser corrigido no código e na síntese (§2.1).
3. **O que continua verdadeiro e é pior do que o `level`:** `NUMERIC_BOUNDS.time` (1e8 s = 3,17 anos) e `score` (1e16) estouram e **congelam o save em silêncio**; e `total_kills`/`total_items_collected`/`total_lives_collected` continuam **INTEGER** — e esses três, por serem somados no servidor, **quebram com erro** em vez de congelar (§2.1).
4. **Recomputei a curva da Família B de `02` inteira [CÁLCULO]:** dia 1 = nível 20; ano 1 = 7.371 (não 7.376 — erro de 0,07% de arredondamento); `L*(T) = 1e11` exato; monotônica em todos os 409.538 passos; "95% dos dias ⇒ 3207" **confere**; "16 h/dia = 449 anos" e "bot = 340 anos" **conferem** (§2.3).
5. **A colisão jurídica é real:** o Decreto 12.880/2026, art. 9º, parágrafo único, III (**"a oferta de recompensas pelo tempo de uso"**) existe, está em vigor desde 18/03/2026 e regulamenta a Lei 15.211/2025 (ECA Digital, vigente desde 17/03/2026). A leitura de `06` é **razoável e bem feita** — mas ela se apoia na frase *"passou de 1 h, o ganho é zero"*, que é verdadeira no teto duro de `05` e **falsa** sob o `τ = 0,10` que `02` recomenda. **A recomendação de `02` enfraquece a defesa jurídica de `06`, e nenhum dos dois percebeu** (§2.4, C-16).
6. **Contradição mais grave entre relatórios:** `09` §3.2 insere o novo Guardião **antes** de encerrar o anterior, violando o índice único que o próprio `09` cria. `03` já achou (DIV-1b) e corrigiu. **Canônico: a versão de `03`** — e isso precisa entrar como teste, não como parágrafo (§4).
7. **Contradição de vocabulário não resolvida:** `01`/`03` dizem **Keeper**, `08` usa **Keeper** mas cria **"the Closing"** para o sunset enquanto `03` usa **Keystone** para o fim e `04` fala em degradação por níveis. São **duas coisas diferentes com nomes parecidos** e o plano final precisa separá-las explicitamente (§4, C-11).
8. **O red team achou 25 cenários não cobertos** — **6 críticos**, e cinco deles são a mesma cegueira: o plano mede **pessoas** quando a unidade real do conceito é a **Linha**. O mais grave de todos é uma conta que ninguém fez: para uma Linha atravessar ~45 Passagens até 3147, **menos de 1,5% delas pode falhar** (§5, R-03).
9. **Decisões do dono:** os nove relatórios somam **~110 decisões**. Deduplicadas e resolvidas, sobram **42**, das quais **11 são BLOQUEANTES** — e uma delas (a régua ser da Linha, não da pessoa) **nenhum relatório listou como decisão** (§(e)).
10. **A recomendação de fundo:** o plano está pronto para virar síntese **depois** de aplicar as 23 correções do §7. Sem elas, o `game-director` vai escrever um documento que se contradiz em seis pontos que o dono só descobriria construindo.

---

## (b) Análise

---

## §1 — URGENTE: a data de 30/09/2026 do Android (checagem do item 3d)

**A afirmação de `04`:** em 30/09/2026 o Android passa a exigir registro de desenvolvedor para instalar APK fora da loja no Brasil.

**Veredito: [VERIFICADO quanto à data e ao país; REFUTADO quanto ao escopo].**

### 1.1 O que a fonte oficial diz

Consulta feita em **20/09/2026** a `https://developer.android.com/developer-verification` (página oficial do Google para desenvolvedores) e a reportagens de imprensa técnica (links no Anexo A).

| Fato | Confirmação |
|---|---|
| Data de corte | **30 de setembro de 2026** | **[VERIFICADO]** |
| Países da primeira onda | **Brasil**, Indonésia, Singapura e Tailândia | **[VERIFICADO]** |
| Aparelhos afetados | apenas **aparelhos certificados** (os que vêm com serviços Google e Play Protect), Android 7 ou superior | **[VERIFICADO]** |
| **Escopo dessa primeira onda** | **apenas as lojas participantes** (Google Play, Galaxy Store, HONOR App Market, OPPO App Market, Palm Store, V-Appstore, GetApps) | **[VERIFICADO — e é aqui que `04` errou]** |
| Quem distribui só fora do Google Play | **precisa se registrar** no *Android Developer Console*, declarando **nome do pacote + chave de assinatura do app** | **[VERIFICADO]** |
| Conta de distribuição limitada (hobby/estudante) | existe: **sem documento de identidade, sem taxa**, limitada a **20 aparelhos** | **[VERIFICADO]** |
| Caminho de escape para o usuário | ADB, ou o "fluxo avançado" de alto atrito (ativar modo desenvolvedor, reiniciar, **esperar 24 h**, reautenticar) | **[VERIFICADO]** |
| Rollout global | **2027**, para todos os aparelhos certificados do mundo | **[VERIFICADO]** |
| APIs/contas de distribuição limitada disponíveis desde | **agosto de 2026** (já aberto hoje) | **[VERIFICADO]** |

### 1.2 O que isso significa, em português, para o `ghostgames.club`

> **Em 30/09/2026 o APK do site NÃO para de instalar.** A onda de setembro de 2026 aperta as **lojas**. O Danger Ghost não está em loja nenhuma (`CLAUDE.md` §8, `publisher-bizdev`), então ele não é alvo dessa trava específica.
>
> **O que muda de verdade, e quando:** a partir de **2027**, quando a exigência virar global e passar a valer para instalação fora de loja em aparelho certificado, um APK de desenvolvedor não registrado só instala pelo **fluxo avançado** — aquele que faz o jogador ligar modo desenvolvedor, reiniciar o celular, **esperar 24 horas** e reautenticar. Na prática, **isso mata a distribuição pelo site**: nenhum jogador casual faz isso.

**Onde `04` acertou e onde errou, para ser justo:** `04` §4.4 descreve datas, países e a conta de distribuição limitada **corretamente**, e **levantou** o problema da chave debug ((c) item 4 e D1). O que `04` errou foi **o escopo da onda de setembro** — ele conclui que "para um APK baixado do site, isso é o risco mais próximo no tempo (E1)" e põe o prazo **30/09/2026** na decisão D1. **O prazo real para o APK do site é 2027**, não 30/09/2026. Isso muda a urgência (de "faltam 10 dias" para "faltam ~15 meses") mas **não muda a ação** — só tira a pressão de decidir no susto.

**O detalhe que vale amplificar:** o registro exige declarar o **nome do pacote e a chave de assinatura**. O APK de hoje é assinado com **chave debug** (`gradlew assembleDebug`, `CLAUDE.md` §3.4). A chave debug é gerada automaticamente pela máquina de quem compila, **não é um segredo custodiado**, e pode ser recriada/perdida a qualquer reinstalação do Android Studio. Amarrar a identidade de desenvolvedor a uma chave debug é construir a distribuição inteira em cima de um arquivo que ninguém tratou como ativo. E num plano que promete **1.121 anos**, "a chave de assinatura do app" vira, ela própria, um item de custódia de longo prazo — o que `04` §3 (sucessão do operador) **deveria ter listado e não listou**.

### 1.3 O que o dono precisa fazer, e até quando

| # | Ação | Prazo | Por quê |
|---|---|---|---|
| A1 | **Gerar uma chave de release própria** (keystore) para o `danger.ghost.mobile`, com senha, e **guardar cópia em dois lugares físicos diferentes** | **antes de qualquer registro** — idealmente **este mês** | Depois de registrada, a chave **não pode ser perdida**: perder a keystore significa não conseguir mais publicar atualização do mesmo app. É irreversível. |
| A2 | **Criar a conta no Android Developer Console** e registrar `danger.ghost.mobile` + a chave de release | até **31/12/2026** (folga confortável antes da onda global de 2027) | A conta "distribuição limitada" é grátis e sem documento, mas **só serve para 20 aparelhos** — não serve para um jogo público. Para o site, é a conta normal. |
| A3 | **Recompilar e republicar o APK assinado com a chave de release**, com aviso aos jogadores | junto com A2 | Quem já tem o APK debug instalado **não consegue atualizar** para um APK de assinatura diferente: tem que desinstalar e reinstalar (perdendo o `localStorage` do app — e com ele, o save local). **Isso é um evento de migração de dados, não um upload.** |
| A4 | Entrar na `04` como item de custódia: a keystore e as credenciais do Developer Console fazem parte do "envelope do operador" | junto com o resto de `04` §3 | Se o dono sumir, quem herda o jogo precisa da keystore para publicar qualquer coisa. |

**[HIPÓTESE fundamentada]** sobre A3: não testei a reinstalação, mas a regra do Android é firme — um app só atualiza sobre si mesmo se a assinatura bater. Recomendo que o `mobile-platform-engineer` confirme **antes** de A3 o que exatamente se perde ao desinstalar (o `localStorage` do WebView sobrevive? o save em nuvem cobre?), porque hoje parte do progresso mora em `localStorage` (`03` F9 lista sete chaves).

**Independência declarada:** nada disso depende do plano do legado. Vale mesmo que o dono rejeite o conceito inteiro.

---

## §2 — Conferência de fatos de alto impacto

### 2.1 (item 3a) O `level` em produção, os tetos de `NUMERIC_BOUNDS` e as colunas INTEGER antigas

#### 2.1.1 A premissa errada, e de onde ela veio

**Correção do MP (fato desta sessão):** `server/migrate_level_bigint.js` **JÁ foi executada em produção e verificada por checksum** — `players.level`, `characters.level`, `points_to_distribute`, `vit`/`agi`/`int`/`pow`/`mag` e `lives` são **BIGINT**; 48 players e 139 characters preservados.

**Confiro no código, sem consultar o banco:**

| Checagem | Resultado |
|---|---|
| O script converte exatamente essas colunas? | **[VERIFICADO]** `server/migrate_level_bigint.js:105-114` lista os 10 alvos: `players.level`, `characters.level`, `characters.points_to_distribute`, `characters.vit/agi/int/pow/mag`, `players.lives`. Bate 1-a-1 com o fato da sessão. |
| O script confere contagem de linhas antes/depois? | **[VERIFICADO]** `:160-163` e `:217-226` — conta `players` e `characters` antes e depois e falha se divergir. É de onde sai o "48 / 139". |
| `db.js` declara essas colunas como BIGINT? | **[VERIFICADO]** `server/db.js:64` (`level BIGINT`), `:71` (`lives BIGINT`), `:140`, `:143`, `:148-152`. **Coerente.** |
| `db.js` tem o parser que um banco BIGINT exige? | **[VERIFICADO e é o ponto mais importante]** `server/db.js:21` — `types.setTypeParser(20, (value) => (value === null ? null : Number(value)))`. Sem essa linha, com o banco já migrado, `loadCharacters()` devolveria `level: "42"` (string) e um level-up viraria **concatenação de string** (`"42" + 1 === "421"`). **A linha está lá e está certa.** O código está coerente com o banco migrado. |
| Os comentários do `db.js` estão coerentes? | **[REFUTADO — quatro blocos mentem hoje]** |

**Os quatro comentários obsoletos (é daqui que os relatórios tiraram a premissa errada):**

| Local | O que o comentário diz hoje | Status real |
|---|---|---|
| `server/db.js:57-63` | *"o banco de produção que já existe continua com INTEGER até alguém rodar `server/migrate_level_bigint.js` à mão"* | **OBSOLETO** — a migração rodou |
| `server/db.js:68-70` | *"Mesma ressalva de banco novo vs. banco de produção"* (sobre `lives`) | **OBSOLETO** |
| `server/db.js:136-139` | *"só vale pra banco novo; o de produção precisa do `server/migrate_level_bigint.js` rodado à mão"* | **OBSOLETO** |
| `server/db.js:442-444` | *"A coluna `points_to_distribute` é INTEGER no schema e PRECISA virar BIGINT — ver `server/migrate_level_bigint.js` (**escrito, NÃO executado**; decisão do usuário, CLAUDE.md §7)"* | **OBSOLETO, e é o mais citado** |

**A cadeia causal do erro, escrita por extenso** (porque é exatamente o tipo de falha que este projeto repete): o comentário foi escrito em 16/09 descrevendo um estado verdadeiro **naquele dia**; a migração rodou depois; ninguém atualizou o comentário; três agentes independentes (`02`, `04`, `09`) leram o comentário como fato de produção — o que era a leitura **correta** dentro da restrição "não consulte o banco" — e propagaram "bloqueante: rodar a migração" para o plano inteiro. **Nenhum dos três agentes errou.** O código errou. Isso é a violação prática do `CLAUDE.md` §7 ("doc desatualizado já causou confusão real neste projeto") aplicada a comentário de código, não a `.md`.

> **Ação para o dono (fora do escopo do legado, mas barata):** pedir ao `backend-architect` que atualize esses quatro comentários e o cabeçalho de `migrate_level_bigint.js` para dizer "**EXECUTADA em <data>, verificada por checksum**". São ~10 linhas. Enquanto não for feito, **todo agente futuro vai reencontrar este mesmo erro.**

**Onde corrigir na síntese:**

| Relatório | Trecho que repete a premissa errada |
|---|---|
| `02_calibracao.md` | §7.6 ("Bloqueante já identificado e confirmado… o banco de produção continua `INTEGER`"); §7.7 linha "`level` BIGINT em **produção** ❌ ainda INTEGER"; **(f) Risco 4** |
| `09_arquitetura_migracao.md` | §0 tabela, linha "Nível"; §4.2 PASSO 0 ("Confirmar que `migrate_level_bigint.js --confirm` JÁ RODOU (pré-requisito absoluto)" — vira "confirmado ✅"); §7 Fase F0 (`migrate_level_bigint.js --confirm` sai da lista); **(f) Risco 3**; (f) "não sei se rodou depois de 16/09" |
| `04_durabilidade.md` | as menções a "migração de tipo pendente" na matriz de risco por camada e em §4 |
| `05_integridade_antiabuso.md` | (f) item 2 ("não sei se `migrate_level_bigint.js` foi rodado") — **resolvido: rodou** |

**Consequência boa que ninguém tirou ainda:** com a migração feita, **a Fase F0 de `09` encolhe** e o item que `02` e `09` chamavam de "bloqueante absoluto" **já está fechado**. O roadmap de 27–41 dias de `09` deve ser reduzido em ~1 dia e, mais importante, **perde o seu único pré-requisito de banco**.

#### 2.1.2 `NUMERIC_BOUNDS.time` e `score` "congelam o save em silêncio" — **[VERIFICADO, e a mecânica é exatamente essa]**

**A mecânica, rastreada:**
1. `sanitizeCharacterPayload` (`db.js:516-536`) roda `isPlausibleNumber(valor, NUMERIC_BOUNDS[campo])` para 13 campos, inclusive `time` e `score`;
2. fora da faixa ⇒ `reject()` ⇒ **`delete clean[field]`** (`db.js:520`) — o campo some do payload, só sobra um `console.warn` no log do servidor;
3. `characterFieldRawValue` (`db.js:664`) devolve `null` para campo ausente **de propósito** (`db.js:659-663`);
4. o `UPSERT` de `saveCharacters` usa `COALESCE($raw, characters.col)` ⇒ **preserva o valor antigo do banco**.

**Resultado: o jogador continua jogando, o número para de subir, e nada aparece na tela.** O próprio `db.js:425-429` descreve esse modo de falha com todas as letras. **`02` §7.2 está certo.**

Os números **[VERIFICADO: `db.js:466-480`]**:

| Campo | Teto em `NUMERIC_BOUNDS` | Exigido pela régua | Quando estoura | Veredito |
|---|---|---|---|---|
| `level` | 1e11 | 1e11 | no último instante do jogo | ⚠️ **no fio da navalha** — ver abaixo |
| `time` | **1e8 s = 3,17 anos** | 1,474e9 s | **em décadas, não em séculos** | ❌ **estoura, silencioso** |
| `score` | **1e16** | ~4,2e18 (se por nível) | depende da decisão de economia | ❌ **estoura, silencioso** |
| `xp` | 1e19 | 3,64e28 (se acumulado) | só se o XP virar acumulador | ⚠️ some se o XP virar derivado |
| `pointsToDistribute`, atributos | 1e13 | 5e11 | nunca | ✅ |
| `deaths` / `worldLevel` | 1e6 / 999 | — | nunca | ✅ |

**Achado meu que nenhum relatório fez — `level: [1, 1e11]` é um teto exclusivo de fato, não inclusivo:** `isPlausibleNumber` é `n >= 1 && n <= 1e11`, então **1e11 exato passa**. Mas qualquer cálculo que produza `1e11 + 1` (arredondamento da curva, bônus de cerimônia, um `Math.ceil` mal colocado no último dia) é **rejeitado em silêncio** e o jogador fica **congelado em 99,999…%** — no dia mais importante do conceito inteiro, o da Keystone. **Recomendação: o teto de validação tem que ser maior que o teto de jogo** (ex.: `level: [1, 1.01e11]`), com a trava do 1e11 aplicada na *lógica*, que erra alto (erra deixando passar e corrige), nunca na *validação*, que erra baixo (erra deletando o campo).

#### 2.1.3 As colunas INTEGER antigas — **[VERIFICADO, e o modo de falha é o OPOSTO do anterior]**

`players.total_kills`, `players.total_items_collected`, `players.total_lives_collected` são **`INTEGER DEFAULT 0`** **[VERIFICADO: `db.js:97, 99, 101`]**, e `characters.world_level` / `characters.deaths` também **[VERIFICADO: `db.js:161-162`]**. A migração BIGINT **não tocou em nenhuma delas** (não estão na lista de alvos do script).

Por que isso importa e por que é uma classe de bug **diferente**: esses três contadores **não vêm do cliente** — são somados no servidor via `incrementPlayerStat()` (`coluna = coluna + delta`, `db.js:1521-1531`). Ou seja, **`NUMERIC_BOUNDS` não os protege** (não passam por `sanitize*`). Quando um deles passar de **2.147.483.647**, o Postgres levanta `integer out of range` e o **`UPDATE` falha com erro** — não congela em silêncio, **quebra ruidosamente**, e provavelmente leva junto o `increment_stat` inteiro daquele jogador para sempre.

**[CÁLCULO]** Quanto tempo até estourar? A 60 kills/hora (cenário "típico" de `02` §1.3) e 1 h/dia: 2,147e9 / 60 = 35,8 milhões de horas = **98.000 anos**. Folgado. **Mas** a 120 kills/h e 16 h/dia: 2,147e9 / (120×16×365) = **3.065 anos** — ainda além de 3147, porém **dentro da ordem de grandeza do conceito**, e isso assumindo que a taxa de kills não cresce (ela cresce: `05` documenta que o jogo acelera). **Veredito: não é bloqueante, mas é dívida declarada.** Deve entrar na lista de "o que migrar na próxima janela", junto com `world_level`/`deaths` que estão folgados. **Nenhum dos nove relatórios mencionou estas três colunas** — é uma lacuna real do item 3 do checklist.

### 2.2 (item 3b) Três afirmações de segurança

| Afirmação | Origem | Veredito | Evidência |
|---|---|---|---|
| `NUMERIC_BOUNDS.level = [1, 1e11]` — ou seja, **o teto de validação é igual ao objetivo final do jogo**, logo é inútil como barreira | `05` §1.1 A2 | **[VERIFICADO]** | `server/db.js:466-467`. `isPlausibleNumber` (`:496-499`) é literalmente `Number.isFinite(n) && n >= 1 && n <= 1e11`. Um `save_game_state` com `level: 1e11` **passa**. |
| **Não existe checagem de delta nem de monotonicidade** | `05` §1.1 A3 | **[VERIFICADO]** | `saveCharacters` (`db.js:711+`) faz `UPSERT` com `COALESCE($raw, characters.col)`. O `COALESCE` preserva campo **ausente**; ele **nunca compara** o valor novo com o gravado. O único desempate por nível (`db.js:720-739`) é **dentro do mesmo payload** (dedupe de `characterId` repetido), não contra o histórico. Nível pode ir de 3 para 1e11 ou voltar de 1e11 para 1 sem nada acontecer. |
| **JWT de 30 dias sem revogação** | `09` §3.3 / `05` A10 / `03` F3 | **[VERIFICADO]** | `server/index.js:121` `const SESSION_TOKEN_TTL = '30d';` e `:123-125` `jwt.sign({ email: email }, JWT_SECRET, { expiresIn: SESSION_TOKEN_TTL })`. O payload tem **só `email`** — nenhum `epoch`, nenhum `jti`. `session_login` (`:788-800`) faz `jwt.verify` e checa se a conta existe. Busca por `token_epoch` / `revok` em `server/index.js`: **zero ocorrências.** Não há lista de revogação, não há troca de senha, não há "esqueci minha senha". |
| **"XP 100% cliente"** | `05` §1.1 A1 | **[VERIFICADO com uma ressalva que o próprio `05` declara]** | Os dois pontos de concessão de XP estão em `js/game/engine.js:1104-1105` e `:3311`, no navegador. O servidor tem `kill_boss` (`index.js:658-660`) que **só retransmite**. **A ressalva:** `05` (f) item 1 admite que não leu `engine.js` inteiro e que pode existir outro caminho que escreva `state.level` direto. Eu **também não li** (`CLAUDE.md` §6 desaconselha, 220 KB). **Portanto a afirmação correta é "XP é concedido no cliente nos dois pontos conhecidos" — a varredura exaustiva continua pendente e é pré-requisito da Fase F1 de `09`.** Marco como **[VERIFICADO parcialmente]**, não como fato fechado. |

**Consequência combinada das quatro, em uma frase:** hoje, uma pessoa logada legitimamente **zera o jogo de 1.121 anos em um pacote de rede**, e o servidor não tem como saber nem como desfazer a sessão dela. Isso não é uma vulnerabilidade do plano do legado — é o **estado atual do jogo**, que o plano do legado apenas torna catastrófico em vez de irrelevante.

### 2.3 (item 3c) Recomputação independente da curva de `02` **[CÁLCULO — script `audit_curve.js`, scratchpad da sessão]**

Reimplementei do zero `L*(H) = 20·H + (1e11 − 20·T)·(H/T)³` com `T = 409.538`, sem olhar os números de `02` antes de rodar.

**Dias e média:**

| Grandeza | Meu valor | `02` diz | Bate? |
|---|---|---|---|
| 2026-09-20 → 3147-01-01 | **409.174** dias | 409.174 | ✅ |
| 2026-09-20 → 3147-12-31 | **409.538** dias | 409.538 | ✅ |
| Níveis/hora médios | **244.177,59** | 244.177,59 | ✅ |
| Segundos por nível | **0,014743** | 0,014743 | ✅ |

**A curva, marco a marco:**

| Marco | H | Meu `L*(H)` | `02` diz | Divergência |
|---|---|---|---|---|
| dia 1 (1 h) | 1 | **20,00** | 20 | ✅ |
| 1 semana | 7 | **140,0** | 140 | ✅ |
| 1 mês | 30 | **600,0** | 600 | ✅ |
| **ano 1** | 365 | **7.370,8** | **7.376** | ⚠️ **−0,07%** |
| 10 anos | 3.652 | **1,4394e5** | 1,44e5 | ✅ |
| 100 anos | 36.524 | **7,1658e7** | 7,17e7 | ✅ |
| 500 anos | 182.621 | **8,8698e9** | 8,87e9 | ✅ |
| 1.000 anos | 365.243 | **7,0937e10** | 7,09e10 | ✅ |
| **3147** | 409.538 | **1,00000000000e11** | 1e11 | ✅ **exato, erro absoluto = 0** |

> **Achado de precisão:** o "7.376" do ano 1 em `02` §4.2 está **errado por 5 níveis** (o valor correto é **7.370,8**, ou 7.371 arredondado). É irrelevante para a matemática, mas **está publicado como número de sensação de jogo em duas tabelas** e vai parar na síntese. `02` provavelmente usou `H = 365,25` em vez de 365. **Correção na síntese: trocar 7.376 por 7.371.**

**Monotonicidade — [VERIFICADO por força bruta]:** percorri todos os **409.539** passos inteiros de `H` (0 a 409.538). `L*` é **estritamente crescente em todos eles**; a menor taxa instantânea é **exatamente 20 níveis/hora** (em `H=0`), e ela **nunca cai**. Ou seja: *nunca existe um dia em que o jogador ganha menos que no dia anterior*. Essa propriedade é importante e `02` não a demonstrou — ele a afirmou. Agora está provada.

**Níveis por hora, década a década (jogador da régua, 1 h/dia):**

| Década | H acumulado | Nível | Níveis por hora |
|---|---|---|---|
| 0 (dia 1) | 0 | 0 | **20** |
| 10 | 36.524 | 7,17e7 | 5.846 |
| 20 | 73.049 | 5,69e8 | 2,33e4 |
| 30 | 109.573 | 1,92e9 | 5,25e4 |
| 40 | 146.097 | 4,54e9 | 9,32e4 |
| 50 | 182.621 | 8,87e9 | 1,46e5 |
| 60 | 219.146 | 1,53e10 | 2,10e5 |
| 70 | 255.670 | 2,43e10 | 2,85e5 |
| 80 | 292.194 | 3,63e10 | 3,73e5 |
| 90 | 328.718 | 5,17e10 | 4,72e5 |
| 100 | 365.243 | 7,09e10 | 5,83e5 |
| 110 | 401.767 | 9,44e10 | 7,05e5 |
| **112,1 (3147)** | 409.538 | **1,00e11** | 7,32e5 |

**A leitura que o dono precisa ouvir, e que `02` suavizou:** na **década 50** — ou seja, depois de **500 anos** e de umas **15 gerações de Guardiões** — o contador está em **8,9% do caminho**. Mais de 91% do número acontece depois que mais gente já passou pela conta do que uma família consegue imaginar. Isso é consequência matemática de *qualquer* curva que faça o dia 1 ser humano (`02` §4.2 prova; eu confirmo), não é um defeito da Família B. Mas significa que **o plano precisa de uma resposta narrativa pronta para "eu e meus netos somos 0,0x% do total"** — e essa resposta é, hoje, o item mais frágil de `01` e `08`.

**"95% dos dias jogados ⇒ chegada em 3207" — [VERIFICADO por cálculo]:**

| Faltas (`q`) | Dias corridos necessários | Ano de chegada |
|---|---|---|
| 0% | 409.538 | **3147** |
| **5%** | 431.093 | **3207** ✅ **confere com `03`/`02`** |
| 10% | 455.042 | 3272 |
| 20% | 511.923 | 3428 |

> Ou seja: **faltar um dia a cada vinte custa 60 anos.** Faltar um a cada dez custa **125 anos**. Esse é, na minha leitura, o número mais importante do plano inteiro para uma conversa honesta com o dono — mais do que qualquer expoente de curva.
>
> **Nota técnica sobre uma divergência de método:** o Monte Carlo de `02` §6.3 dá **3234** para q=10% enquanto meu cálculo determinístico dá **3272**. Não é erro de nenhum dos dois: `02` simula o **Banco de Vigília**, em que parte dos dias faltados é reposta. Meu número é o limite sem reposição nenhuma. Os dois devem aparecer na síntese, rotulados: *"se você falta e nunca repõe: 3272. Se você falta e repõe quando volta: 3234. Se não falta: 3147."*

**Banco de Vigília — `E(h) = 1 + τ·(h−1)`, `τ = 0,10` [CÁLCULO]:**

| Horas reais/dia | Horas efetivas | Anos até 1e11 | `02` diz |
|---|---|---|---|
| 1 (régua) | 1,00 | **1.121,3** | 1.121 ✅ |
| 2 | 1,10 | 1.019,3 | 1.019 ✅ |
| 4 | 1,30 | 862,5 | 863 ✅ |
| 8 | 1,70 | 659,6 | 660 ✅ |
| **16** | 2,50 | **448,5** | **449** ✅ |
| **24 (bot)** | 3,30 | **339,8** | **340** ✅ |

**Veredito: as três afirmações conferem.** "16 h/dia = 449 anos" ✅, "bot = 340 anos" ✅, razão bot/régua = **3,30×** ✅.

**Mas eu discordo da conclusão que `02` tira delas.** `02` §5.4 diz "**Ninguém zera sozinho**" porque 340 anos ≈ 6 gerações. A conta está certa e a conclusão **está errada para o caso que importa**: 340 anos é o tempo de um **bot único ininterrupto**. O conceito não é atacado por um bot; é atacado por **uma linhagem que usa bot** — e aí 340 anos de bot dentro de uma cadeia de Guardiões humanos **não é "ninguém zera sozinho", é "a linhagem que automatizar termina 780 anos antes das outras"**. O `τ` não é um limitador de abuso; é um **multiplicador de desigualdade entre linhagens**, e `02` não olhou para ele desse ângulo porque mediu "indivíduo", não "linhagem". Volto nisso no red team (R-04).

### 2.4 (item 3e) O Decreto 12.880/2026 e a Lei 15.211/2025

Consultas feitas em **20/09/2026**.

| Afirmação de `06` | Veredito | Evidência |
|---|---|---|
| Existe a **Lei nº 15.211/2025** ("ECA Digital") | **[VERIFICADO]** | Sancionada em **17/09/2025**, em vigor desde **17/03/2026** (vacatio de 6 meses, reduzida por MP do prazo original de 1 ano). Aplica-se a **todo produto/serviço de TI direcionado a crianças e adolescentes no Brasil ou de acesso provável por eles**, independentemente de onde seja desenvolvido/operado. |
| Existe o **Decreto nº 12.880/2026** | **[VERIFICADO]** | **18/03/2026**. Regulamenta a Lei 15.211/2025. Publicado no DOU; disponível em `planalto.gov.br` e no Legin da Câmara. |
| O art. 9º trata de prevenção de uso excessivo | **[VERIFICADO]** | Capítulo sobre prevenção de **uso excessivo, problemático ou compulsivo** por crianças e adolescentes; obriga fornecedores a implementar mecanismos de prevenção. |
| O **parágrafo único, inciso III** é **"a oferta de recompensas pelo tempo de uso"** | **[VERIFICADO]** | O parágrafo único elenca os mecanismos que **são considerados incentivo** ao uso excessivo: **I** — ocultação de pontos naturais de parada; **II** — acionamento de conteúdo novo sem solicitação; **III** — **a oferta de recompensas pelo tempo de uso**; **IV** — excesso de notificações. |
| "A régua colide numa leitura literal" | **[RAZOÁVEL — concordo, com três ressalvas importantes que `06` não fez]** | ver abaixo |

**Por que concordo com `06`:** a régua do legado é, **literalmente e por desenho**, uma recompensa concedida em função do tempo de uso — não "recompensa por jogar bem", mas "nível = f(segundos creditados)". É a definição do inciso III lida ao pé da letra. E o jogo é **plausivelmente de acesso provável por crianças** (2D, gratuito, sem portão de idade hoje), o que basta para o escopo da Lei 15.211/2025 — não é preciso que ele seja *direcionado* a crianças.

**Crédito onde é devido:** `06` **formulou bem** a defesa (§B.1.2 "a favor do dono": o alvo do art. 9º é estimular uso *maior*, e um teto diário faz o oposto; S1 "Teto, não meta"; S2 "ponto natural de parada visível", que ataca o inciso I). `06` também leu o texto no Legin da Câmara, o que é uma fonte melhor que as minhas. **O problema não é a análise de `06` — é uma premissa dela que outro relatório derrubou sem que ninguém notasse.**

**As três ressalvas, em ordem de importância:**

1. **A defesa de `06` depende de `τ = 0`, e `02` recomenda `τ = 0,10`.** `06` S1 é literal: *"Passou disso: **zero** progresso de legado."* Isso é verdade no teto duro de `05` §3.6 e é **falso** no Banco de Vigília de `02` §5.4, onde a hora extra rende 10% **para sempre**. Com `τ = 0,10`, a frase que sustenta o parecer deixa de ser verdadeira e o desenho volta a ser, literalmente, uma recompensa crescente com o tempo de uso. **`06` escreveu a defesa antes de `02` existir; `02` escolheu `τ` sem saber que estava mexendo na defesa jurídica.** É a contradição C-16, e é a que eu mais recomendo levar ao advogado.
2. **`08` propõe convites de retorno que `06` S5 proíbe.** `08` §5.4 desenha convites **opt-in** (1 a cada 90 dias, parada automática) com um checklist anti-*dark pattern* de 10 regras; `06` S5 diz "nenhum e-mail de 'volte a jogar'". Os dois estão mirando no inciso IV ("excesso de notificações") e chegaram a respostas opostas. Veredito em C-14: **`08` vence, com três emendas** — e o convite **nunca** vai para conta de menor.
3. **A Família B acelera para sempre, e isso conversa com o inciso I.** `06` S2 cria o "Fecho do dia" como ponto natural de parada — ótimo. Mas vale registrar para o advogado que a curva escolhida faz o ganho por hora **crescer** ao longo dos séculos (de 20 para 732.490 níveis/hora), o que, fora do contexto do teto, é a forma de um incentivo. O teto diário é o que neutraliza — mais um motivo para `τ = 0`.

**O que eu recomendo que vá para o advogado, em uma pergunta:** *"Um jogo cujo progresso principal é função do tempo de sessão, mas que limita o ganho a 1 hora por dia e mostra explicitamente ao jogador quando parar, viola o art. 9º, parágrafo único, III do Decreto 12.880/2026, ou cumpre a finalidade do caput? E isso muda se o jogo adotar verificação de idade e não for direcionado a menores?"*

**Limites honestos desta checagem:** eu **não** li o texto integral do decreto na fonte primária — `planalto.gov.br` recusou a conexão nas duas tentativas (`ECONNRESET`), e o Jusbrasil devolveu HTTP 403. Confirmei o conteúdo do art. 9º por **duas** buscas independentes que retornaram a mesma enumeração de quatro incisos, citando Planalto, Câmara (Legin), Lex e o PDF do Ministério da Justiça. **Classifico como [VERIFICADO por fonte secundária convergente], não como leitura da fonte primária.** Antes de virar cláusula de Termos de Uso, alguém (o dono ou o advogado) precisa abrir o `planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12880.htm` e conferir a redação exata. **Nada aqui é aconselhamento jurídico.**


---

## §3 — Auditoria contra o checklist do brief (§6, itens 1–12)

| # | Lacuna do brief | Status | Quem cobre | **O buraco que sobra** |
|---|---|---|---|---|
| **1** | Definição de "jogo legado" + princípios + vocabulário | **COBERTO** | `01` (B.1, B.2, B.3) | O vocabulário **não foi revisado por falante nativo** (`01` (f) 6 admite). Três termos ainda não travados: **`Vigil`** (`03` marca "[PROVISÓRIO]"), **"Guardian" vs "Keeper"** (`04` usa Guardian; `08` D-L14 manda trocar) e **"Last Rites" vs "the Closing"** (`01` D6 vs `08` §5.5). Resolver por decisão, não por prosa — ver C-11. |
| **2** | Calibração matemática | **COBERTO** (com uma contradição aberta) | `02` inteiro | `02` D1 recomenda curva **suave** (Família B) e **rejeita** a por partes (Família C, "degraus de 6,3×"); `07` DC-3 pede exatamente uma curva **por partes** ("CP"). **São incompatíveis e ninguém arbitrou** — ver C-02. Também: a "1 hora" de `02` §3.2, a janela de ociosidade de `05` §3.4 e os "4 Movimentos de 15 min" de `07` §B.2 são **três definições operacionais diferentes** da mesma hora. |
| **3** | Precisão numérica e limites por 1.100+ anos | **PARCIAL** | `02` §7, `04` §4.1, `09` §1.7 | (a) A premissa do `level INTEGER` está **desatualizada** (§2.1); (b) as **colunas INTEGER antigas** (`total_kills`, `total_items_collected`, `total_lives_collected`) só aparecem em `04` §4.1 e **não estão em nenhum roadmap**; (c) `NUMERIC_BOUNDS.level` tem **teto igual ao objetivo final** (§2.1.2) — ninguém viu; (d) a correção de `formatBigNumber` precisa ser **espelhada no mobile** e nenhum roadmap diz isso. |
| **4** | Mecânica de sucessão | **COBERTO** | `03` (o mais completo), `05` §4, `09` §3 | (a) **DIV-1b** (`09` viola o próprio índice único) está resolvido **em texto**, não em teste; (b) o **modelo de login** tem três versões (C-04); (c) **não existe infraestrutura de e-mail** (`03` F5/P0-1) e **`09` F0 não a inclui** — sem ela, a escada de dormência inteira é letra morta (R-21). |
| **5** | Integridade do tempo de jogo | **COBERTO** | `05` inteiro | (a) A **definição de "dia"** (UTC, `05` §3.5) não foi conciliada com o Banco de Vigília de `02` §5.4 (R-01); (b) **conta usada por várias pessoas em turnos** — o caso central do conceito — **não foi analisado por ninguém** (R-13); (c) `τ = 0,10` foi avaliado por *indivíduo*, nunca por *linhagem* (R-04). |
| **6** | Conteúdo e motivação por ~409.000 h | **COBERTO** | `07` (eras, economia), `08` (rituais, comunidade), `01` §B.4 | (a) Ninguém desenhou **o que se faz durante a espera na trava de calendário** — e com a margem `m = 0,90` de `02` essa espera é de **112 anos** [CÁLCULO], não de um ano (R-20); (b) `07` depende de uma curva que `02` não recomenda (C-02). |
| **7** | Durabilidade 1.100+ anos | **COBERTO** (é o relatório mais completo) | `04` inteiro | (a) A **keystore de release do Android** não está no envelope de custódia (§1.3 A4); (b) **hoje não há backup verificado** (`04` E8) e `04` 8.2 #9 exige isso **antes** da F0 de `09` — e o roadmap de `09` **não tem esse pré-requisito**; (c) os custos reais dependem de dados que só o dono tem. |
| **8** | Jurídico / ética / privacidade | **COBERTO** | `06` inteiro | (a) `06` **D12 (adoção após 5 anos sem consentimento)** contradiz `01` C4/D5 e `03` DIV-5 (C-08); (b) `06` **S5 proíbe** convites de retorno e `08` §5.4 **os permite** com opt-in (C-14); (c) **LGPD × GDPR** para herdeiro em outro país não foi analisado por ninguém (R-17); (d) o **`ON DELETE RESTRICT`** de `09` transforma o pedido de exclusão da LGPD num **erro de banco** (R-16). |
| **9** | Migração das ~48 contas / ~139 personagens | **COBERTO** (os três convergem) | `02` §8.4, `09` §4, `03` §8 | Os três recomendam **"Era Zero" + Selo de Pioneiro** — convergência independente, é o item mais sólido do plano. **Mas** `07` DC-6 (migrar `requirement_value` das 333 badges) e DC-7 (converter os 139 personagens para Rank 1–100) **acrescentam duas migrações que nenhum roteiro prevê**. |
| **10** | Interação com sistemas existentes | **PARCIAL** | `07` §B.3, `02` §8 | (a) **Ranking por geração tem três desenhos concorrentes** (`03` §4.2 Hall, `08` §3.4/3.5 Mapa do Céu + Hall of Keepers, `09` `lineage_standings`) e ninguém unificou; (b) **batalhas ghost-vs-ghost**: só `07` DC-11 propõe e ninguém dimensionou; (c) **o baú de conta compartilhado** permite que um ghost secundário equipe o Legacy Ghost — **transferência de poder que ninguém viu** (R-11). |
| **11** | Riscos, testes, critérios de aceite, reversão | **PARCIAL** | `02` §9 (harness), `09` §4.3 (reversão), `04` §6 (simulacro) | (a) **Os critérios 1 e 2 do harness de `02` REPROVAM** na calibração de hoje; (b) **não existe critério de aceite ponta-a-ponta do tempo autoritativo** — é a especialidade da skill `e2e-db-verification` e **nenhum relatório a aplicou**; (c) a reversão de **curva** depois de lançada tem um erro matemático (R-09). |
| **12** | Roadmap faseado + lista de decisões | **FALTANDO como peça única** | `09` §7 (F0–F6), `04` D0–D4, `07` Horizonte de Conteúdo, `08` §6.2 | **Existem quatro roadmaps concorrentes e nenhum deles é o roadmap.** Unidades diferentes (dias de dev, meses de calendário, horas de conteúdo, rituais/ano), dependências cruzadas não declaradas (`04` exige backup antes de `09` F0; `08` exige `05` no ar antes da Fase 2 de comunicação; `07` exige a curva de `02` antes da Era I) e **nenhum absorve o item do Android (§1)**. **Fundir os quatro é a primeira tarefa do `game-director`.** |

**Placar: 8 COBERTOS, 3 PARCIAIS, 1 FALTANDO.** Nenhum item ficou sem dono — o problema do plano **não é cobertura, é costura**.

---

## §4 — Livro de contradições (com veredito canônico)

Formato: **as posições** → **veredito** → **por quê**. "**Decisão do dono**" marca o que é escolha de valor, não questão técnica — nesses casos dou a recomendação, não o veredito.

### C-01 — A fórmula de hash da Crônica **[CRÍTICO — decidir antes do primeiro evento gravado]**

- **`09` §1.4:** concatena `prev ‖ seq ‖ type ‖ occurred_at_iso ‖ payload_hash`, **sem separador**.
- **`05` §5.1:** `SHA-256(seq ‖ lineage_id ‖ kind ‖ json_canonico(payload) ‖ created_at ‖ prev_hash)` em `BYTEA`, e **alerta** que o `JSONB` do Postgres reordena chaves.
- **`03` DIV-9:** não especifica a fórmula, mas impõe que o `payload` só contenha números de geração, ids opacos e hashes de texto — nunca o apelido (senão apagar a identidade por LGPD **quebra a cadeia**).
- **`04` 8.2 #1:** demonstrou **em Node** que concatenação sem separador **colide** (`"P"+1+"2x"` e `"P"+12+"x"` dão o mesmo SHA-256) e exige **uma regra só**, sobre **JSON canônico (RFC 8785)**, com prefixo de versão e formato de data fixo.

> **VEREDITO CANÔNICO: a regra de `04` 8.2 #1, com a restrição de `03` DIV-9 e o tipo de `05`.**
> `entry_hash = SHA-256("dgc1:" ‖ JCS({v, lineage_id, seq, kind, occurred_at, payload, prev_hash}))`, com `occurred_at` em ISO-8601 UTC com milissegundos, `JCS` = serialização canônica RFC 8785, **a string canônica gravada junto** (nunca recomputada a partir do `JSONB` relido), `payload` sem dado pessoal, hashes em `BYTEA`.
> **Por quê:** é a única posição que foi **testada** em vez de proposta, e é a única mudança do plano inteiro **literalmente impossível de corrigir depois** — mudar a regra invalida todos os hashes já gravados. As outras três não estão erradas, estão subespecificadas.
> **Ação:** critério de aceite da Fase F2 de `09`, com **vetores de teste** publicados e **duas implementações independentes** (JS e Python, `04` 8.3 #2).

### C-02 — A forma da curva: suave (`02`) × por partes (`07`) **[CRÍTICO — bloqueia a Fase F1]**

- **`02` D1:** Família B, `L*(H) = 20·H + (1e11 − 20·T)·(H/T)³`. Rejeita a Família C (por partes) porque "a cadência salta 6,3× de um dia para o outro" e "um Guardião típico nunca vê uma virada de Era".
- **`07` DC-3:** pede uma curva **por partes** ("CP") calibrada para que **cada Era a partir da V atravesse ≥ 0,8 década de dígito**, porque sob a curva de `02` as Eras VIII–X cruzam só 0,43 / 0,29 / 0,08 década — o odômetro quase não muda de ordem de grandeza nas três Eras mais longas.

> **VEREDITO CANÔNICO: `02` na *forma*, `07` no *requisito* — e a costura é de `02`.**
> Mantém-se a **Família B**. Mas `02` precisa entregar uma coisa que não entregou: **verificar se a Família B satisfaz o critério de `07`** e, se não satisfizer, **desacoplar as Eras do odômetro** — que é exatamente o que `07` **DC-2** já recomenda ("as Eras são ancoradas em *tempo creditado*, não em nível") e o que `02` §4.6 já propôs (Vigília / Marco / Grau / Era).
> **Por quê:** se as Eras são ancoradas em tempo, **o requisito de DC-3 deixa de existir** — ele só aparece porque `07` supôs que o marco sentido seria o dígito do odômetro. Os dois relatórios concordam sobre a solução e discordam sobre um problema que a solução já resolve. **Isto é um mal-entendido, não um conflito de projeto** — e vira uma curva por partes desnecessária se ninguém arbitrar.
> **Ação:** `02` roda um teste novo ("sob `a=20, g=3`, quantas décadas de dígito cada uma das 10 Eras de `07` atravessa?") e publica a tabela. Se `07` aceitar, C-02 fecha sem mudar a curva.

### C-03 — O que significa "3147": régua por horas (`03`) × trava de calendário (`02`) **[CRÍTICO — muda a promessa pública]**

- **`03` D2:** a régua é **por horas** — cada Linha precisa das suas ~409.000 h a partir da própria fundação. Consequência explícita: **"3147 só vale para a coorte fundadora"**; uma Linha fundada em 2100 chega em 3221.
- **`02` §6.2 + D3:** calibrar para o meio de 3147 com margem `m = 0,90` **e** pôr uma **trava de calendário**: o nível 1e11 não pode ser cruzado antes de 3147-01-01. `02` chama a espera de "uma cerimônia de um ano".
- **`03` D11:** propõe um "portão de calendário `F`" em ~3100 + "Última Ronda".

> **VEREDITO CANÔNICO: os dois, separados em duas coisas que hoje estão confundidas.**
> 1. **O contador (o nível) é por horas da Linha e nunca trava.** Uma Linha fundada em 2100 chega ao 1e11 em 3221 — correto e honesto.
> 2. **A Keystone (o evento de "zerar") é o que tem portão de calendário**, não o contador. Ninguém coloca a Pedra Angular antes de 3147-01-01.
> **Por quê — e este é um achado, não uma preferência:** `02` §6.2 trava o *nível*, mas o próprio `02` §6.3 recomenda margem `m = 0,90`, sob a qual o jogador impecável chega em **3035,9**. **[CÁLCULO meu: 3035 — confere.]** Isso não é "uma cerimônia de um ano": são **112 anos com o contador congelado no máximo**, ou seja **quatro a cinco gerações inteiras de Guardiões recebendo uma conta que não pode mais subir** — o pior resultado possível para um conceito cujo ponto é "a sua hora conta". Travar o *evento* em vez do *número* resolve sem custo. (Tabela do meu cálculo: `m=1,00` → 3147, espera 0; `m=0,95` → 3091, espera **56 anos**; `m=0,90` → 3035, espera **112 anos**; `m=0,85` → 2979, espera **168 anos**.)
> **Ação:** `02` refaz §6.2 com essa separação. O texto público passa a ser: *"3147 é a data da coorte fundadora. A sua Linha tem a sua própria estrada."*

### C-04 — O modelo de login na Passagem: três respostas incompatíveis

- **`09` D-1 (A):** o e-mail do fundador permanece como login **para sempre**.
- **`05` §4.2/4.3:** separar `users` (a pessoa) de `legacy_accounts` (a Linha); **o Herdeiro entra com a própria conta**; nenhuma credencial troca de mãos.
- **`03` DIV-2:** ponte em dois passos — **Passo 1 (MVP)** = `09`-A **mais** um `login_handle` pseudônimo que substitui o e-mail na tela de login depois da 1ª Passagem; **Passo 2** = o modelo de `05`, obrigatório antes da 1ª Passagem a não-familiar/Adoção.
- **`04` 8.2 #4:** concorda que `09`-A "só serve como passo de migração"; acrescenta o motivo de durabilidade (o e-mail do fundador **morre ou é recomprado por um estranho** — precedente verificado no PyPI).

> **VEREDITO CANÔNICO: a ponte de `03` DIV-2, exatamente como escrita.**
> **Por quê:** três relatórios independentes (`03`, `04`, `05`) convergiram para "o estado final é o de `05`"; `09` só discorda sobre **quando**, e a razão dele (renomear uma PK com FKs em cascata, sem staging) é **válida e decisiva no MVP**. Não é conflito de arquitetura, é conflito de cronograma — e `03` já o resolveu. **`09` D-1 deve ser reescrito para "A′ agora, migrando para o modelo de `05`", não "A para sempre".**
> **Correção factual associada:** `03` DIV-17 recontou **6 tabelas / 7 colunas** dependentes de `players(email)` (`characters`, `diary_entries`, `egregora_messages`, `friendships` ×2, `player_badges`, `player_stat_progress`); `09` §0 diz **8 tabelas**; `05` diz 5. **Canônico: 6 tabelas / 7 colunas.**

### C-05 — Quando o Guardião anterior é encerrado (DIV-1b) **[defeito de desenho, não divergência de opinião]**

- **`09` §1.2** cria `CREATE UNIQUE INDEX ux_keepers_current ON keepers(lineage_id) WHERE ended_at IS NULL` — um Guardião ativo por Linha, como **regra de banco**.
- **`09` §3.2 passo 4** insere o novo Guardião com `generation+1` no resgate e só encerra o anterior no `completed`, 30 dias depois.

> **VEREDITO CANÔNICO: `03` DIV-1b.** O anterior é encerrado **na mesma transação** da Investidura; a janela de 30 dias é **reversão para o Resguardo**, nunca "duas linhas abertas".
> **Por quê:** o `INSERT` de `09` §3.2 **viola o índice único que o próprio `09` §1.2 cria** — a transação falha em produção. É um bug, não uma escolha.
> **Ação:** caso de teste obrigatório da Fase F3 — *"tentar abrir dois Guardiões na mesma Linha tem que falhar no banco, não no código."*

### C-06 — Vigília antes ou depois da mudança de controle (DIV-1)

- **`09` §3.2:** o resgate cria o Guardião novo **na hora**, sobe `token_epoch`, e "o anterior ainda pode cancelar" por 30 dias.
- **`05` §4.3:** espera obrigatória de **30 dias antes**, com o Guardião de saída no controle total e cancelamento por um clique dos dois lados.

> **VEREDITO CANÔNICO: `05`/`03` — a Vigília vem antes.**
> **Por quê:** o argumento de `03` é de mecanismo e é conclusivo: **`token_epoch++` no resgate derruba a sessão do Guardião de saída, que então não consegue exercer o cancelamento que `09` promete a ele.** O desenho de `09` contém a própria contradição. E um vazamento da Chave daria controle **imediato** de uma Linha viva.

### C-07 — Prazos de dormência e da escada de avisos

- **`05`:** Sinal do Guardião aos **180 d**. **`09`:** dormência aos **540 d**, e-mails em 365/450/520, janela de 30 d. **`03` v1:** 365 d, Vigília de 14 d.

> **VEREDITO CANÔNICO: a tabela única de `03` §A.4** — Sinal 180 d · aviso ao Herdeiro 270 d · **Dormente 365 d** · e-mails 365/455/545 · **Resguardo 730 d** · **Vigília 30 d** · experiência 30 d · Commons em Resguardo + 5 anos · Arquivada em Resguardo + 30 anos.
> **Por quê:** `09` declara que os números dele são "meus, não decididos"; `03` é o departamento dono da mecânica; e a tabela dele é a única **completa e internamente coerente** (a escada de e-mails cai *dentro* da janela de dormência, não antes dela).
> **Ressalva dura:** toda essa tabela depende de **e-mail transacional que não existe hoje** (R-21).

### C-08 — Adoção de Linha órfã: com ou sem consentimento prévio **[decisão do dono, com veredito técnico embutido]**

- **`01` caso 3 / C4 / D5** e **`03` DIV-5:** adoção pelo Commons **só se o Guardião autorizou em vida** (`commons_optin`, padrão NÃO); sem isso a Linha termina em Monumento.
- **`06` D12 (B, recomendada):** adoção **após ≥ 5 anos de Custódia**, com aviso público e identidade já removida — **sem exigir consentimento prévio**.

> **VEREDITO: `01`/`03` (opt-in obrigatório) — mas a preocupação de `06` entra como salvaguarda.**
> **Por quê:** o consentimento nas duas pontas é a **condição C4** da definição formal de `01`; sem ele o objeto deixa de ser legado e vira conta reciclada. Isso é definicional, não estético. **Porém** `06` está certo sobre o custo: uma Linha rica que morre com o Guardião vira um Monumento que ninguém herda. **A costura:** o `commons_optin` vira **uma pergunta obrigatória na Investidura**, com as duas respostas igualmente fáceis — a taxa de opt-in sobe sem violar C4.
> Se o dono preferir a versão de `06`, é direito dele — mas ele precisa saber que está **mexendo na definição do próprio conceito**.

### C-09 — Hash da Chave do Legado: Argon2id/bcrypt × SHA-256

- **`05` §4.5:** Argon2id ou bcrypt. **`09` §1.3 / `03` DIV-11 / `04` 8.2 #6:** SHA-256 basta.

> **VEREDITO CANÔNICO: SHA-256.**
> **Por quê:** hash lento protege segredos de **baixa entropia** (senhas humanas). A Chave do Legado tem **256 bits gerados pelo servidor** — não há dicionário a percorrer. E `04` traz o argumento decisivo para o horizonte: **o custo do bcrypt tem teto (31) e chega lá por volta de 2068** [CÁLCULO de `04`], enquanto SHA-256 sobre 256 bits não envelhece. Três contra um, com o melhor argumento.

### C-10 — `contact_email_hash` "sobrevive ao apagamento" (LGPD)

- **`09` §1.2** e **`03` T18:** guardar o SHA-256 do e-mail permite apagar o texto claro e manter o vínculo.
- **`04` 8.2 #3:** um hash **sem chave** de e-mail é **reidentificável por dicionário** — continua dado pessoal.

> **VEREDITO CANÔNICO: `04`.** Se o vínculo for necessário, **HMAC com chave guardada na camada privada**, nunca publicado nem exportado. **Um SHA-256 de e-mail não é anonimização.** Validar com o advogado (pergunta que `04` já encaminhou a `06`).

### C-11 — Vocabulário: Keeper/Guardian, "the Closing"/"Last Rites", Chamada/Sinal

- **`01` B.3 + `03` A.1:** Keeper, Heir/Successor, the Line, the Chronicle/an Entry, the Legacy Ghost, the Handover, the Investiture, the Sealed Letter, the Keystone/Keystone Bearer, the Renewal, the Roll Call, Dormant, Safekeeping, the Commons, Era Zero/the First Keepers.
- **`04`:** usa "Guardião/Guardian" no texto corrido.
- **`01` D6** chama o protocolo de encerramento de **"Last Rites"**; **`08` §5.5** chama de **"the Closing"** e, em **D-L14**, pede a troca ("'Guardian' já é o Gato e a RX no seu lore; 'Last Rites' é sacramento cristão").
- **`01` × `05`:** os dois usam "Chamada" para coisas diferentes; `03` A.1 renomeia a de `05` para **Keeper's Signal** (Sinal do Guardião).

> **VEREDITO CANÔNICO: `08` D-L14 (a) + `03` A.1, integralmente.**
> Travar: **Keeper** (nunca Guardian no texto do jogo), **the Closing** (nunca "Last Rites"), **Keeper's Signal** (nunca "Chamada", que fica só para o Roll Call), **Vigil** para a espera antes da Investidura (`01` o rejeitara apenas como nome da *Renewal*; `03` confirma o uso).
> **Por quê:** `08` D-L14 tem as duas razões certas — colisão com o lore **já existente** do próprio jogo, e "Last Rites" é sacramento de uma tradição viva, o que viola a **regra-mãe de vocabulário do próprio `01`** (§B.3: "nenhum termo oficial pode ser palavra sagrada de uma tradição viva"). `01` se contradiz aqui, e `08` pegou.
> **Pendência barata e ainda aberta:** `01` (f) 6 pediu **revisão do vocabulário por falante nativo de inglês** antes de travar. Não foi feito. Nome errado em camada lenta é caro de desfazer.

### C-12 — Tamanho dos dados: 33 MB × 117 MB por linhagem

- **`09` (a).3 / §6:** ~**33 MB** por linhagem em 1.121 anos; 33 GB para 1.000.
- **`04` 8.2 #2:** ~**117 MB** com hashes em `TEXT`, ~**91 MB** em `BYTEA`; ~117 GB para 1.000.

> **VEREDITO CANÔNICO: os números de `04`, com a conclusão de `09`.** O valor certo é ~91–117 MB; **a conclusão ("Postgres nem sente") continua verdadeira nos dois casos**. Usar o de `04` para dimensionar o plano do Supabase — é 3,5× maior e isso muda a faixa de preço. **Nenhum dos dois mediu tabela real**; medir com `pg_relation_size` numa cópia é tarefa do `backend-architect`.

### C-13 — Nível derivado do tempo × XP do cliente **[a convergência, registrada como tal]**

Não é contradição: `02` §4.0, `05` §3.1 e `09` §2.1 chegaram **independentemente** à mesma arquitetura (nível do legado = função pura de `credited_seconds`; XP do cliente vira cosmético). **Veredito: canônico, sem ressalva.** É a única decisão que torna todos os achados de §2.2 (level forjável, sem delta, sem revogação) **irrelevantes para a régua** sem reescrever o combate no servidor.

### C-14 — Convites de retorno: proibidos (`06`) × opt-in (`08`)

- **`06` S5:** "Nenhum push, e-mail ou SMS de 'volte a jogar'. E-mails **só** de conta/segurança/sucessão."
- **`08` §5.4:** separa **avisos de custódia** (factuais, da escada) de **convites** (opt-in, padrão desligado, **1 a cada 90 dias**, param de vez após 2 sem resposta), com checklist de 10 regras anti-*dark pattern*.

> **VEREDITO CANÔNICO: `08`, com três emendas de `06`.**
> (1) Convite é comunicação de marketing → exige **consentimento específico** e entra no RIPD de `06` S11; (2) **nunca** para conta de menor nem vinculada a responsável (Decreto 12.880, art. 9º, parágrafo único, IV); (3) o "aviso de aniversário da Line" de `08` ("seu e-mail ainda é seu?") é **aviso de segurança**, não convite — fica sempre ligado.
> **Por quê:** `06` escreveu S5 antes de `08` existir e mirou no mecanismo errado (push de engajamento). O que `08` propõe já satisfaz o objetivo de `06`; proibir o convite opt-in retira uma ferramenta legítima sem reduzir risco.

### C-15 — Migração: preservar nível × "Era Zero" **[decisão do dono, com veredito técnico claro]**

- **`02` D4, `09` D-4 e `03` D13** recomendam, independentemente, **"Era Zero" + Selo de Pioneiro**.
- **`02` §8.4 A** mede que preservar nível custaria **≤ 0,74%** do horizonte — matematicamente inofensivo.

> **VEREDITO: Era Zero. A escolha restante é narrativa, não matemática.** O argumento decisivo é o de `09`: **as contas de teste antigas com nível inflado largariam séculos à frente e a régua nasceria mentindo.** A compensação de `02` (30 h simbólicas no Banco de Vigília = 0,0073% da régua) e o Selo de Pioneiro cobrem o custo emocional. Marco como decisão do dono **só porque é a mudança que mais mexe com as 48 pessoas reais que já jogam** — e `08` §4.4 (a carta às contas atuais) é a peça que faz isso dar certo ou errado.

### C-16 — Teto duro (`05`) × Banco de Vigília com `τ = 0,10` (`02`) **[tem consequência jurídica que ninguém ligou]**

- **`05` §3.6 / D1:** recomenda **(iii) teto duro de 1 h + banco de até 7 dias**, gastáveis a no máximo 2 h/dia. Acima disso, **ganho zero**.
- **`02` §5.4 / D2:** recomenda **Banco de Vigília com `τ = 0,10`** — hora extra rende 10%. `02` observa corretamente que "com `τ = 0` ele vira exatamente o teto de `05`".
- **`06` S1** constrói a defesa jurídica central sobre a frase **"passou de 1 h: zero"** — que é verdadeira em `05` e **falsa** em `02`.

> **VEREDITO: decisão do dono, e é uma das mais importantes — mas `06` precisa ser reescrito nos dois cenários.**
> Tecnicamente os dois funcionam e `02` está certo de que `τ` é um botão ajustável sem retro-punição. **O que ninguém viu é que `τ > 0` enfraquece a defesa do art. 9º, III do Decreto 12.880:** com `τ = 0,10`, jogar mais **continua rendendo**, e a frase "o tempo extra não é recompensado" deixa de ser verdade. Com `τ = 0`, a defesa de `06` S1 é literal e forte.
> **Minha recomendação:** **começar com `τ = 0`** (= a proposta de `05`, que é a mais defensável jurídica e tecnicamente) **e só subir para 0,05/0,10 depois do parecer escrito do advogado e do antibot no ar**. `02` já recomenda "subir `τ` é generosidade, baixar é punição" — então começar baixo é a ordem certa de qualquer jeito.

---

## §5 — Red team: 25 ataques ao conceito que ninguém cobriu

Método: peguei cada premissa do conceito e perguntei "o que a quebra?". Só entram aqui cenários **não cobertos** (ou cobertos por engano) pelos nove relatórios. Severidade: **CRÍTICO** = quebra o conceito ou perde dados reais; **ALTO** = quebra uma promessa pública; **MÉDIO** = degrada a experiência ou gera trabalho grande; **BAIXO** = incômodo.

| # | Cenário | Sev. | Quem deveria ter coberto | Correção proposta |
|---|---|---|---|---|
| **R-01** | **O "dia duplo" na virada de UTC.** `05` §3.5 fixa o dia-legado às **00:00 UTC** — 21:00 no horário de Brasília. Uma sessão única das 20h às 22h atravessa a virada e vale **dois** dias-legado. Com teto duro (`05` D1), são **2 h creditadas num único sentar**, todo santo dia, de graça, sem má-fé nenhuma. | **CRÍTICO** | `05` (definiu o dia) + `02` (definiu a hora) — nenhum notou que os dois juntos criam isso | O **Banco de Vigília** já imuniza (ele saca do banco, não do dia) — **mais um argumento estrutural a favor de `02` §5.4 sobre o teto duro de `05`**. Se o dono escolher teto duro, é obrigatório um **limite por janela deslizante de 24 h**, não por dia-calendário. E a HUD tem que mostrar o horário de corte **em hora local**. |
| **R-02** | **Uma família jogando em turnos.** Pai joga 8 h, mãe 8 h, filho 8 h — **na mesma conta**, em horários diferentes. `05` §3.3 (sessão única) impede o *simultâneo*, não o *revezamento*. Com `τ = 0,10` isso é 24 h/dia efetivas = **3,3× a régua = 340 anos em vez de 1.121**. E é **exatamente o caso de uso que o dono descreveu** ("deixo minha conta para meu filho"). | **CRÍTICO** | `05` (modelo de ameaças: os 14 vetores tratam o adversário, nunca a família) e `01` (C3 exige "pessoas distintas", mas não disse o que acontece quando elas são simultâneas em vez de sequenciais) | **É a decisão do dono mais importante que nenhum relatório listou.** Ou (a) aceitar e declarar ("a Linha é da família, não da pessoa" — coerente com o conceito, e aí a régua é da *Linha*), ou (b) `τ = 0` (teto duro), que torna o revezamento inútil sem proibir nada. **Recomendo (b) no MVP**, porque é a única que não exige distinguir família de fazenda de bots. |
| **R-03** | **Sobrevivência da linhagem através das gerações — a conta que decide se o conceito é alcançável.** Nenhum relatório calculou. Com mandato médio de 25 anos são **~45 Passagens** até 3147. Se cada Passagem tem probabilidade `p` de dar certo, a chance de **uma** Linha chegar é `p⁴⁵`. **[CÁLCULO]:** `p=0,80` → **0,004%**; `p=0,90` → **0,87%**; `p=0,95` → **9,9%**; `p=0,98` → **40,3%**; `p=0,99` → **63,6%**. Para uma Linha ter 50% de chance, é preciso **`p ≥ 0,985`** — ou seja, **menos de 1,5% de falha por geração**, ao longo de 45 gerações. | **CRÍTICO** | `02` (simulou "cadeia geracional" mas **assumiu que sempre existe herdeiro**) e `01` (F3/F4 falam de abandono sem quantificar) | Duas saídas, não exclusivas: **(1)** aceitar que o conceito precisa de **volume** — com `p=0,90`, são necessárias **~80 Linhas fundadoras** para 50% de chance de que *alguma* chegue, e **~342** para 95% [CÁLCULO]; com 48 contas hoje, a probabilidade de qualquer Linha chegar a 3147 é **~34%** a `p=0,90`. **(2)** O **Commons** (`01` C4/`03`) é a única mecânica que aumenta `p` de verdade, porque converte "não tinha herdeiro" de fim de linha em troca de Guardião. **Isso eleva o Commons de "recurso bonito" a "requisito de viabilidade" — e reabre C-08 com peso muito maior.** A síntese **precisa** publicar esta tabela: ela é a resposta honesta à pergunta "isso vai dar certo?". |
| **R-04** | **`τ` foi avaliado por indivíduo, nunca por linhagem.** `02` §5.4 conclui "ninguém zera sozinho" porque o bot 24/7 leva 340 anos. Certo — mas o conceito não é atacado por um bot solitário, e sim por **uma Linha que automatiza**: 340 anos dentro de uma cadeia de Guardiões humanos significa que **a Linha que automatizar termina ~780 anos antes das outras**. | **CRÍTICO** | `02` §5 (mediu "indivíduo"), `05` §2 (mediu "ameaça"), nenhum mediu "Linha" | Refazer a tabela de `02` §5.2 com a unidade **Linha** e publicar a razão "Linha automatizada / Linha da régua". E declarar nos Termos que o teto é **da Linha**, não da pessoa — o que também resolve R-02. |
| **R-05** | **O dono some no ano 1.** O *bus factor* de hoje é **1**. Se ele sumir antes da fase D0 de `04`, morrem com ele: a keystore do Android, o domínio, o acesso ao Supabase, o `.jwtsecret`, o repositório e o gerenciador de senhas. Nada do plano sobrevive. | **CRÍTICO** | `04` §3 cobre a mecânica, mas põe D0 como "≤ 30 dias" **sem torná-la pré-requisito de nada** | **D0 de `04` vira pré-requisito de *anunciar* o conceito publicamente** (não de construí-lo). É a única forma de o prazo ser respeitado: o dono não pode prometer 1.121 anos enquanto o projeto inteiro depende de uma pessoa sem substituto nomeado. |
| **R-06** | **A primeira Chave do Legado é perdida.** `03` D4(a) fecha os três caminhos — mas nenhum relatório define a rotina de **reemissão**. Um Keeper vivo que perdeu o papel pode gerar outra (está logado); o problema é que ninguém o **lembra** de fazer isso, e a descoberta só acontece quando ele morre. | **ALTO** | `05` §4.5 (criou a Chave) e `03` §A.4 (criou os prazos) | A **Renewal** (`01` P7, a cada 20 anos) e **toda Investidura** passam a incluir obrigatoriamente: **reemitir a Chave, destruir a anterior, reconfirmar o Heir e reconfirmar o canal de contato.** `08` §5.4 já tem o texto ("seu e-mail ainda é seu? seu Heir ainda é o mesmo?") — falta ligá-lo à reemissão da Chave. |
| **R-07** | **Um herdeiro descobre, no ano 200, um bug que concede 1e11.** Ninguém tratou o exploit *do sistema* (quem o usa age de boa-fé) — `05` §5.4 trata fraude *do jogador*. | **ALTO** | `05` §5.4 | **A trava de calendário da Keystone (C-03) é acidentalmente a melhor defesa que o plano tem contra isso**, e ninguém percebeu: com ela, nenhum exploit **termina** o jogo — no máximo adianta um contador. **Recomendo declarar a trava como invariante de segurança, não só de calibração.** Some-se o alerta "nível impossível para o tempo creditado" de `05` §6.1, que pega o resto. |
| **R-08** | **Corrigir fraude antiga reescreve o nível de quem joga hoje.** `05` §5.4(C) ("Anulação de Era") subtrai segundos de um Keeper de 2150. Mas como **nível = f(segundos acumulados da Linha)** (C-13), subtrair segundos de 2150 **muda o nível de quem estiver jogando em 2400**. Ninguém viu. | **ALTO** | `05` §5.4 + `02` §4.0 (a arquitetura que cria o efeito) | A correção **nunca** reescreve o total: entra como **ajuste datado** (`credit_adjustment`, delta negativo, com Selo de Contestação na Crônica), e o nível exibido é `L*(segundos líquidos)` **com o histórico de ajustes visível**. Assim o passado não é reescrito — ele ganha uma errata, que é exatamente o que `05` queria. |
| **R-09** | **Trocar a curva depois de lançar quebra a promessa de 1e11.** `02` §4.5 sela eras de calibração (`nível = Σ ΔL_e`). Mas a propriedade central da Família B é `L*(T) = 1e11` **exato**; se a curva muda no meio, **a soma dos deltas não fecha em 1e11 no tempo T**. `02` não percebeu que o próprio mecanismo de recalibração destrói a garantia que ele vende. | **ALTO** | `02` §4.5 | Toda nova `curve_version` tem que ser **recalibrada para o que falta**: `T_restante = T − H_já_creditado`, `teto_restante = 1e11 − nível_já_ganho`, e a nova curva fecha *nesse* par. **O harness de `02` §9 ganha um critério 11:** "trocar a curva no ano X e continuar fechando em 3147, para X ∈ {10, 100, 500, 1000}". |
| **R-10** | **O baú de conta é uma transferência de poder entre ghosts que ninguém viu.** `players.chest_items` é **compartilhado por todos os ghosts da conta** (`db.js:116-130`) [VERIFICADO]. Um ghost secundário farmando 16 h/dia enche o baú de lendários e **equipa o Legacy Ghost**. Ou seja: o teto de tempo do legado **não limita o poder do legado**. | **ALTO** | `02` §3.2 e `09` D-3 (os dois dizem "ghost secundário não conta para a régua" e param aí) | `07` **DC-8** (itens por **razão**, não por valor absoluto) neutraliza isso de graça — é mais um argumento forte a favor de DC-8. Alternativa: o Legacy Ghost não pode receber item do baú. **Recomendo DC-8.** |
| **R-11** | **O `ON DELETE RESTRICT` transforma o direito de exclusão da LGPD num erro de banco.** `09` §1.1 usa `RESTRICT` para impedir que apagar a conta apague a Crônica em cascata. O efeito real não é "preserva a Crônica" — é **o `DELETE` falhar**. O jogador pede exclusão e o sistema devolve um erro de chave estrangeira. | **ALTO** | `09` §1.1 (declarou o conflito e encaminhou a `06`) e `06` D4 (propôs os três caminhos, sem olhar a FK) | O pedido de exclusão executa um **procedimento**, não um `DELETE`: anonimizar `keeper_profiles`, apagar contatos, substituir identidade por número de geração na Crônica (já é o desenho de `03` DIV-9), **e só então** apagar a linha de `players` — ou, melhor, marcar `erased_at` e nunca apagar. **Tem que estar escrito como procedimento operacional antes do primeiro pedido real.** |
| **R-12** | **Sem e-mail transacional, a sucessão por dormência não existe.** `03` F5 verificou: **não há envio de e-mail, não há verificação de e-mail, não há "esqueci minha senha"**. Toda a escada de C-07 (avisos em 365/455/545 d) e todo convite de Heir dependem disso. **`09` F0 não inclui.** | **ALTO** | `09` §7 (o roadmap) — `03` P0-1 apontou e ninguém absorveu | Entra na **Fase F0** de `09`: provedor de e-mail transacional, verificação de endereço no cadastro, e a tabela `outbox` que `03` §1.8 já especificou (gravada na mesma transação da mudança de estado). Sem isso, F3 (Sucessão) é decorativa. |
| **R-13** | **Auto-sucessão: a pessoa que passa a Linha para ela mesma.** `03` D19 permite várias Linhas por pessoa via e-mail/handle distinto. Nada impede que o Keeper designe uma segunda conta **dele próprio** como Heir, inflando o contador de gerações e o ranking por geração. | **ALTO** | `03` D19 + `05` §4.8 (anti-RMT olhou para venda, não para auto-transferência) | A guarda mínima de 180 d entre Passagens (`03` §A.4) já encarece; some-se: o Heir precisa ter **histórico independente** (`05` já lista "conta criada na mesma semana" como sinal), e os Termos declaram que **gerações auto-sucedidas não contam para o ranking de gerações**. Não é detectável com certeza — é encarecível. |
| **R-14** | **O jogador impecável espera 112 anos travado no máximo** (a margem `m = 0,90` de `02` §6.3 combinada com a trava do §6.2). | **ALTO** | `02` (as duas recomendações são dele, em seções vizinhas) | Resolvido por **C-03**: trava-se a Keystone, não o contador. |
| **R-15** | **Duas migrações escondidas nas decisões de `07`.** DC-6 (trocar `requirement_value` das 333 badges para Marcos de Dígito) e DC-7 (converter os 139 personagens para Rank 1–100) são migrações de produção **que nenhum roteiro prevê** — e `09` §4.2 é o único roteiro com checksum e reversão. | **MÉDIO** | `07` (propôs) e `09` (escreveu o roteiro) | As duas entram como passos do `migrate_legacy_era_zero.js`, com o mesmo padrão (simulação por padrão, `--confirm`, transação única, checksum das colunas que não podem mudar). E `07` DC-6 tem que dizer o que acontece com badges **já desbloqueadas** sob a escada antiga. |
| **R-16** | **Herdeiros em países diferentes: LGPD × GDPR.** Se o Heir mora na UE, a Crônica pública e o `contact_email_hash` (C-10) caem também no GDPR; a transferência internacional de dados precisa de base própria. Ninguém analisou. | **MÉDIO** | `06` (cobriu LGPD com profundidade; não olhou fora do Brasil) | A opção **`06` D3-C** (zero dado pessoal na Crônica, só fatos anônimos) resolve para os dois regimes de uma vez. Recomendo adotá-la como **padrão global**, não só para menores e falecidos. Vai para a lista de perguntas ao advogado. |
| **R-17** | **Cliente antigo que não consegue atualizar.** `09` §4.4 põe o APK velho em "modo leitura" com link para o novo. Mas o APK vem do **site**; um jogador com APK de 2035 em 2050 pode encontrar um site que mudou de endereço, ou um APK assinado com outra chave (§1.3 A3) que **não instala por cima**. | **MÉDIO** | `09` §4.4 e `04` §4.4 | O texto do modo leitura carrega **URL canônica + instrução de desinstalar/reinstalar**; e `04` arquiva **todas** as versões do APK com os hashes, no Arquivo. |
| **R-18** | **`visibilitychange` não é confiável no WebView do Capacitor.** `02` §3.2 conta com ele para não creditar app minimizado. Não foi testado no APK real; há estados (picture-in-picture, tela dividida, overlay) em que o comportamento difere do navegador. | **MÉDIO** | `02` §3.2 (assumiu) e `05` §3.4 (listou os sinais, todos de socket) | O crédito **nunca** deve depender de `visibilitychange`: `05` §3.4 já é o desenho certo (só creditar com **evento de gameplay qualificado** na janela). Basta `02` remover a linha que atribui a função ao `visibilitychange` e apontar para `05`. Teste no APK fica no checklist do `mobile-platform-engineer`. |
| **R-19** | **Três desenhos concorrentes de ranking por geração** (`03` §4.2 Hall, `08` §3.4/3.5 Mapa do Céu + Hall of Keepers, `09` `lineage_standings`). Se dois forem implementados, viram duas verdades sobre a mesma coisa. | **MÉDIO** | os três | **Canônico: `09` `lineage_standings` como *dado* (uma linha por Linha, atualizada pelo job noturno), `08` como *apresentação* (Mapa do Céu/Hall), `03` como *regra* (o que entra).** É uma separação de camadas, não uma escolha entre três. |
| **R-20** | **Custo real de hospedagem por décadas nunca foi modelado com o número de jogadores.** `04` D4 estima o piso (US$ 8–12 mil) mas assume tráfego constante; `09` §6 dimensiona armazenamento mas não banda/CPU. Se o conceito funcionar, o número de Linhas cresce e o custo com ele. | **MÉDIO** | `04` §3.6 + `09` §6 | `04` já pediu os custos reais ao dono. Acrescentar um cenário "1.000 Linhas ativas" à aritmética do fundo — porque o fundo de `04` foi dimensionado para o **fracasso** (piso N3/N4), nunca para o **sucesso**. |
| **R-21** | **Sair sem apagar a Linha.** Coberto por `06` D4 caminho 2 (Custódia) — mas o efeito técnico é o de R-11. Registrado aqui porque é o pedido mais provável de acontecer de verdade nos primeiros anos. | **MÉDIO** | `06` D4 | Mesmo procedimento de R-11, com o texto de `08` §5.4 (tom neutro, "nada se perdeu"). |
| **R-22** | **Segundo intercalar e a redefinição do UTC.** `04` §4.1 declara "irrelevante se gravarmos contadores e UTC". Verifiquei o raciocínio: como o crédito é `now() − last_beat_at` em segundos do servidor, um segundo intercalar **desloca o resultado em ≤ 1 s** e o dia-legado em menos de um minuto. | **BAIXO** | `04` (cobriu e acertou) | Nenhuma. Registro aqui só para fechar a pergunta do brief: **não é um risco**, e a razão é que o plano guarda contadores, não datas civis. |
| **R-23** | **O jogador que viaja / muda de fuso.** Como o dia-legado é UTC fixo (`05` §3.5), viajar não muda nada — só a **hora local do corte**. | **BAIXO** | `05` (cobriu e acertou) | Só UI: mostrar o corte em hora local do aparelho, e avisar quando ele mudar. |
| **R-24** | **Conteúdo ilegal permanente na Crônica.** `08` R4 (Crônica privada até existirem Scribes) e `09` (trigger append-only + role sem UPDATE/DELETE) juntos criam o pior caso: um texto ilegal que **o próprio sistema se recusa a remover**. | **MÉDIO** | `08` R4 + `09` §1.4 | `03` **DIV-9** já resolve e ninguém ligou os pontos: **o texto livre nunca entra na cadeia de hash — só o hash dele, com sal por texto**. Remover o texto apaga o sal e **não quebra a cadeia**. Confirmar que `09` adota DIV-9 é item de aceite da F2. |
| **R-25** | **O relógio do servidor andando para trás (NTP).** `05` §3.7 cobre: delta negativo é descartado com alerta. | **BAIXO** | `05` (cobriu e acertou) | Nenhuma. Registro para fechar a varredura. |

**Leitura dos 25:** seis CRÍTICOS, e **cinco deles saem do mesmo lugar** — o plano mediu **pessoas** e **ameaças** quando a unidade real do conceito é a **Linha**. R-02 (família em turnos), R-03 (sobrevivência geracional), R-04 (`τ` por linhagem), R-13 (auto-sucessão) e R-10 (baú compartilhado) são todos a mesma cegueira aplicada a lugares diferentes. **Esta é, na minha avaliação, a correção conceitual mais importante deste relatório: a régua é da Linha, não do jogador.**

---

## §6 — Top 10 riscos do conceito, em linguagem simples, do pior para o menos pior

1. **A corrente arrebenta muito antes de 3147 — e a conta prova isso.** Para uma Linha atravessar ~45 trocas de Guardião, é preciso que **menos de 1,5% delas falhem**. Nenhuma família consegue isso. Sem o Commons (uma Linha sem herdeiro poder ser adotada por um estranho que se ofereça), a chance de **qualquer** das 48 contas de hoje chegar a 3147 é da ordem de **um terço** — e isso na hipótese otimista de 90% de sucesso por geração. **[CÁLCULO]**
2. **Hoje, qualquer jogador zera o jogo de 1.121 anos em um pacote de rede.** O servidor aceita `level: 1e11` porque o teto de validação é exatamente 1e11, não compara com o valor anterior, e não sabe expulsar ninguém. Enquanto o nível não vier do tempo medido pelo servidor, a régua é uma sugestão. **[VERIFICADO]**
3. **O jogo depende de uma pessoa só.** Se o dono sumir amanhã, some com ele a chave de assinatura do app, o domínio, o acesso ao banco e o segredo de sessão. **Nenhuma promessa de séculos é honesta antes de existir uma segunda pessoa com acesso.**
4. **A lei brasileira, lida ao pé da letra, chama a régua do legado de "recompensa pelo tempo de uso"** — mecanismo que o Decreto 12.880/2026 lista como incentivo ao uso excessivo por crianças. Não é proibição, é risco real e incerto, e a melhor defesa (o teto diário) **enfraquece** se o dono escolher deixar as horas extras renderem. **[VERIFICADO]**
5. **Este é o conceito de jogo com maior potencial de chantagem emocional que eu já auditei.** Culpa familiar + aversão à perda + horizonte infinito. `01` acertou em fazer do "se assim quiser" a cláusula constitucional — e a diferença entre legado e corrente é **inteiramente de execução**, texto por texto, tela por tela.
6. **Mais de 91% do contador acontece depois do ano 500.** Você, seus filhos e seus netos são uma fração invisível do número. Isso é matemática, não opção: qualquer curva com um dia 1 humano faz isso. Se não houver uma resposta narrativa pronta para "eu sou 0,0x%", o conceito perde o fundador antes de perder o herdeiro.
7. **A distribuição hoje é frágil de um jeito que não tem nada a ver com o legado.** O APK vem de um site, assinado com uma chave de teste, e a partir de **2027** o Android vai exigir desenvolvedor registrado para instalar fora de loja. Resolver isso custa pouco **agora** e muito **depois**. **[VERIFICADO]**
8. **Faltar um dia a cada vinte custa 60 anos; um a cada dez custa 125.** A régua literal ("1 hora todo santo dia") não sobrevive a um ser humano. Ou a promessa vira "365 horas por ano, quando der", ou ela nasce quebrada. **[CÁLCULO]**
9. **Uma escolha tomada errado no primeiro dia não tem conserto:** a fórmula de hash da Crônica. Se ela for gravada com a regra de `09` (que colide) em vez da de `04` (que foi testada), consertar depois invalida **todos** os registros já feitos.
10. **Quatro roadmaps, nenhum roadmap.** Existem hoje quatro planos de fases concorrentes, com dependências cruzadas que nenhum deles declara. Construir seguindo qualquer um isolado significa descobrir a dependência do outro no meio do caminho.

---

## §7 — Correções a aplicar na síntese (lista objetiva para o `game-director`)

Formato: **onde** → **troque X por Y**.

| # | Onde | Troque | Por |
|---|---|---|---|
| 1 | `02` §7.6, §7.7, (f) risco 4; `09` §0, §4.2 PASSO 0, §7 F0, (f) risco 3; `04` matriz de camadas; `05` (f) 2 | "`level` ainda é INTEGER em produção / migração pendente / bloqueante" | "**`migrate_level_bigint.js` foi EXECUTADA e verificada por checksum** (players.level, characters.level, points_to_distribute, vit/agi/int/pow/mag, lives → BIGINT; 48 players, 139 characters). O bloqueante está fechado; a Fase F0 perde este item." |
| 2 | (código, fora do plano) `server/db.js` linhas 57-63, 68-70, 136-139, 442-444 + cabeçalho de `migrate_level_bigint.js` | os comentários "o banco de produção continua com INTEGER até alguém rodar…" e "escrito, NÃO executado" | "EXECUTADA em \<data\>, verificada por checksum." **É o que impede o próximo agente de reencontrar o mesmo erro.** |
| 3 | `02` §4.2 tabela de marcos e §4.4 | nível no ano 1 = **7.376** | **7.371** (recomputado: 7.370,8 com `H = 365`) |
| 4 | `02` §6.2 | "a trava de calendário impede que o **nível 1e11** seja cruzado antes de 3147-01-01" | "a trava de calendário impede que a **Keystone** seja colocada antes de 3147-01-01. **O contador nunca trava.**" (C-03, R-14) |
| 5 | `02` §6.2 | "quem chegar cedo estaciona em 99,99…% e espera — uma cerimônia de um ano" | "com margem `m = 0,90`, o jogador impecável chega em **3035** e espera **112 anos** pela cerimônia — por isso a espera é da Keystone, não do contador" |
| 6 | `02` §4.5 | "cada recalibração abre uma nova `curve_version`; o ganho antigo fica congelado em níveis" | acrescentar: "**e a nova curva é recalibrada para o restante** (`T_restante`, `teto_restante`), senão a promessa de 1e11 em 3147 deixa de valer" (R-09) |
| 7 | `02` §3.2 | "aba em segundo plano / app minimizado ❌ (o `visibilitychange` já existe no navegador)" | "o crédito depende **só** de evento de gameplay qualificado no servidor (`05` §3.4); `visibilitychange` não é fonte de verdade e não foi testado no WebView" (R-18) |
| 8 | `02` §5.4 / D2 e `05` D1 | apresentar Banco de Vigília (`τ=0,10`) e teto duro como propostas concorrentes | apresentar como **um mecanismo com um botão**: Banco de Vigília **começando em `τ = 0`** (idêntico ao teto duro de `05`, com memória) e subindo só após parecer jurídico + antibot no ar (C-16) |
| 9 | `09` §1.4 e `05` §5.1 | as duas fórmulas de hash | a regra única de `04` 8.2 #1 (RFC 8785 + prefixo de versão + `BYTEA` + string canônica gravada), com o `payload` restrito por `03` DIV-9 (C-01) |
| 10 | `09` §3.2 passo 4 | inserir o Guardião novo antes de encerrar o anterior | encerrar o anterior **na mesma transação** da Investidura (C-05); vira caso de teste |
| 11 | `09` §3.2 passo 5 e §3.3 | "o tempo já é creditado ao novo Guardião e o anterior ainda pode cancelar" | Vigília de 30 d **antes** da troca de controle; os 30 d posteriores são período de experiência com devolução ao Resguardo (C-06) |
| 12 | `09` D-1 | "o e-mail do fundador permanece como login para sempre" | "`09`-A′ agora (`account_id` + `login_handle`), **migrando para o modelo de `05`** antes da primeira Passagem a não-familiar" (C-04) |
| 13 | `09` §0 | "8 tabelas apontam para `players(email)`" | "**6 tabelas / 7 colunas**" (recontagem de `03` DIV-17) |
| 14 | `09` (a).3 e §6 | "~33 MB por linhagem / 33 GB para 1.000" | "**~91 MB (`BYTEA`) a ~117 MB (`TEXT`) por linhagem; ~117 GB para 1.000** — a conclusão de viabilidade não muda" (C-12) |
| 15 | `09` §7 Fase F0 | a lista atual | remover `migrate_level_bigint.js --confirm`; **acrescentar e-mail transacional + verificação de endereço + tabela `outbox`** (R-12), e **dump diário verificado para 2 destinos** como pré-requisito (`04` 8.2 #9) |
| 16 | `09` §1.1 (`ON DELETE RESTRICT`) | "impede que apagar a conta apague a linhagem" | "**o `DELETE` falha**; a exclusão da LGPD executa um procedimento de anonimização, nunca um `DELETE` direto" (R-11) |
| 17 | `09` `relics.transferable DEFAULT true` | `true` | `false` (`03` DIV-13, `07` DC-10) |
| 18 | `04` §4.4 e D1 | "30/09/2026 é o prazo para o APK do site" | "**30/09/2026 vale para as lojas participantes; o APK do site é atingido pelo rollout global de 2027.** Prazo prático: registrar até 31/12/2026" (§1) |
| 19 | `04` texto corrido e `01` D6 | "Guardian" e "Last Rites" | "**Keeper**" e "**the Closing**" (`08` D-L14, C-11) |
| 20 | `06` §B.1.2 e S1 | a defesa jurídica baseada em "passou de 1 h: zero" | manter, **mas condicionada a `τ = 0`**; se o dono escolher `τ > 0`, reescrever a defesa e refazer a pergunta ao advogado (C-16) |
| 21 | `06` S5 | "nenhum e-mail de 'volte a jogar'" | a política de `08` §5.4 (convite opt-in, 1/90 d, parada automática), com as três emendas de C-14 |
| 22 | `06` D12 | "adoção após 5 anos de Custódia" | "adoção **só com `commons_optin`**, perguntado obrigatoriamente na Investidura" (C-08) — e, por R-03, **o Commons deixa de ser opcional no discurso: é o que torna o conceito viável** |
| 23 | Todos os relatórios, seção de escopo | "a régua é do jogador / da conta" | "**a régua é da Linha**" — e refazer as tabelas de arquétipo de `02` §5.2 com essa unidade (R-02, R-04) |

**Além disso, três coisas que a síntese precisa *acrescentar*, não corrigir:**
- **A tabela de sobrevivência geracional de R-03.** É a resposta honesta a "isso vai dar certo?" e hoje não existe em lugar nenhum.
- **O item do Android (§1)** como tarefa do dono com prazo, separada do plano do legado.
- **Um roadmap único** que funda `09` F0–F6, `04` D0–D4, `07` Horizonte de Conteúdo e `08` MVP do ano 1, com as dependências cruzadas explícitas (item 12 do checklist).

---

## (c) Lacunas que eu fechei

1. **A premissa errada do `level INTEGER`** — refutada com a evidência do código, com a causa raiz identificada (quatro comentários obsoletos em `db.js`), a lista exata dos trechos a corrigir em quatro relatórios, e a consequência boa (a Fase F0 de `09` perde o seu único pré-requisito de banco). §2.1.
2. **Três achados de código que ninguém tinha feito:** o teto `NUMERIC_BOUNDS.level = [1, 1e11]` é **exclusivo de fato** e congela o jogador no dia da Keystone (§2.1.2); as **colunas INTEGER antigas** falham com **erro**, não em silêncio, porque não passam por `sanitize*` (§2.1.3); e o **baú de conta compartilhado** é uma transferência de poder entre ghosts que o teto de tempo não limita (R-10).
3. **Recomputação independente da curva de `02`** — dias, média, marcos, monotonicidade provada por força bruta nos 409.539 passos, níveis/hora por década, "95% dos dias ⇒ 3207", e as três checagens do Banco de Vigília. Achei um erro de 5 níveis no valor do ano 1. §2.3.
4. **A conta que decide se o conceito é alcançável** — sobrevivência de uma Linha através de ~45 Passagens, e quantas Linhas fundadoras são necessárias. **Nenhum relatório fez essa conta.** R-03.
5. **A contradição interna de `02`** entre a margem `m = 0,90` (§6.3) e a "cerimônia de um ano" (§6.2): a espera real é de **112 anos**. C-03 / R-14.
6. **O erro matemático do mecanismo de recalibração de `02` §4.5** — trocar a curva no meio quebra a garantia `L*(T) = 1e11`. R-09.
7. **Livro de contradições com 16 entradas resolvidas**, incluindo as quatro que são defeitos de desenho e não divergências de opinião (C-01, C-05, C-06, C-10).
8. **Verificação externa da data do Android**, com a correção do escopo (lojas em 2026 × global em 2027) e o que o dono precisa fazer, com prazos. §1.
9. **Verificação do Decreto 12.880/2026 e da Lei 15.211/2025**, com o veredito sobre a leitura de `06` e o achado de que **`τ > 0` enfraquece a própria defesa jurídica de `06`**. §2.4 / C-16.
10. **25 cenários de red team**, dos quais **6 críticos**, e a identificação do padrão comum: o plano mede **pessoas** quando a unidade do conceito é a **Linha**.
11. **A lista mestra de decisões deduplicada** — ~110 decisões espalhadas por nove relatórios viram **42**, agrupadas por urgência, com três bloqueantes que **nenhum relatório havia listado como decisão**.
12. **23 correções objetivas** prontas para o `game-director` aplicar na síntese. §7.

---

## (d) Lacunas que dependem de outros departamentos

| Para quem | O que eu preciso / o que fica com ele |
|---|---|
| **`game-director`** | **Fundir os quatro roadmaps** (`09` F0–F6, `04` D0–D4, `07` Horizonte, `08` MVP ano 1) num só, com as dependências cruzadas declaradas. É o item 12 do checklist e é a única lacuna **FALTANDO**. |
| **`progression-actuary` (`02`)** | (1) Rodar o teste de C-02 (quantas décadas de dígito cada Era de `07` atravessa sob `a=20, g=3`); (2) refazer §6.2 com a separação contador × Keystone (C-03); (3) corrigir o valor do ano 1 (7.371); (4) acrescentar o critério 11 ao harness (trocar a curva no meio e continuar fechando — R-09); (5) refazer a tabela de arquétipos com a unidade **Linha** (R-02/R-04). |
| **`legacy-systems-designer` (`03`)** | (1) Desenhar a **reemissão obrigatória da Chave** na Renewal e na Investidura (R-06); (2) o **procedimento de exclusão** que roda antes de qualquer `DELETE` (R-11/R-21); (3) o conteúdo da espera pela Keystone (a "Última Ronda" de D11 vira obrigatória, não opcional). |
| **`security-engineer` (`05`)** | (1) Fechar C-09 (SHA-256 para a Chave — três relatórios contra o dele); (2) substituir "Anulação de Era" por **ajuste datado** (R-08); (3) revisar o "dia duplo" de UTC (R-01); (4) **reproduzir o cenário de abuso #1 numa conta descartável** (`05` (f) 6 pediu e ninguém fez — é o pré-requisito da priorização inteira dele). |
| **`backend-architect` (`09`)** | (1) Aplicar C-01, C-04, C-05, C-06, C-12, C-13 e as correções 9–17 do §7; (2) atualizar os quatro comentários obsoletos de `db.js` (§2.1.1); (3) migrar `total_kills`/`total_items_collected`/`total_lives_collected` para BIGINT na próxima janela; (4) medir `pg_relation_size` numa cópia. |
| **`deep-time-archivist` (`04`)** | (1) Acrescentar a **keystore de release do Android** e as credenciais do Developer Console ao envelope de custódia (§1.3 A4); (2) arquivar **todas** as versões do APK com hashes (R-17); (3) modelar o custo no cenário de **sucesso** (1.000 Linhas), não só no de fracasso (R-20). |
| **`digital-succession-counsel` (`06`)** | (1) Reescrever B.1.2/S1 condicionado a `τ` (C-16); (2) alinhar D12 com C-08; (3) trocar S5 pela política de `08` com as três emendas (C-14); (4) analisar **GDPR para herdeiros fora do Brasil** (R-16); (5) levar ao advogado a pergunta formulada em §2.4. |
| **`game-economy-designer` + `game-designer`** | Decidir se score é por nível, por kill ou por Marco — hoje é **por chamada de `addXp()`, por acidente de otimização** (`02` §8.2, [VERIFICADO]); e recalibrar o tier da arma, que domina tudo (`1,12⁶⁰ = 897,6×`). |
| **`mobile-platform-engineer`** | (1) Confirmar o que se perde ao desinstalar/reinstalar o APK com assinatura nova (§1.3 A3) — é um evento de migração de dados, não um upload; (2) testar `visibilitychange` no WebView real (R-18); (3) confirmar se o jogo já é instalável como PWA (`04` pediu e ninguém respondeu). |
| **`qa-lead`** | Escrever o **critério de aceite ponta-a-ponta do tempo autoritativo** contra o Supabase real com conta descartável (skill `e2e-db-verification`). Nenhum dos nove relatórios o escreveu, e é o item 11 do checklist. |
| **`localization` + falante nativo de EN** | Revisar o vocabulário inteiro de `01` B.3 antes de travar (`01` (f) 6 pediu; C-11). |
| **o dono (autorização)** | Os três levantamentos somente-leitura que `02`, `05` e `09` pediram (distribuição de níveis, valores de `time`, dias jogados nos últimos 90 dias); o plano contratado do Supabase; os custos reais. |

---

## (e) DECISÕES PARA O DONO — lista mestra deduplicada

As ~110 decisões dos nove relatórios viram **42**. Onde duas recomendações se contradiziam, resolvi (o veredito está no §4) ou marquei **[decisão de valor]**. Para responder, basta dizer o código e a letra.

### (A) BLOQUEANTES — precisam ser decididas antes de qualquer construção

| # | A pergunta, em uma linha | Opções | Recomendação consolidada |
|---|---|---|---|
| **A1** | Qual o formato da curva de nível? | (a) linear "odômetro"; (b) **polinomial suave** `20·H + (1e11−20T)(H/T)³`; (c) por partes, uma cadência por Era | **(b)**, com as Eras ancoradas em **tempo creditado** e não em nível — isso dissolve o pedido de `07` DC-3 por uma curva por partes (C-02). Fonte: `02` D1 + `07` DC-2/DC-3. |
| **A2** | O que exatamente "3147" promete? | (a) "1 hora todo dia, sem falta"; (b) **"365 horas por ano, quando der", com margem de presença `m ≈ 0,90`**; (c) cada Linha tem a própria estrada e 3147 é só a data da coorte fundadora | **(b) e (c) juntos.** A régua é por horas da Linha; "3147" é a data de quem começa agora. E o que espera pelo calendário é a **Keystone**, não o contador (C-03). `02` D3 + `03` D2. |
| **A3** | Quanto uma hora extra no mesmo dia deve render? | (a) **nada (`τ = 0`)** — teto duro com banco; (b) 10% (`τ = 0,10`); (c) 20% | **(a) no lançamento**, subindo para (b) só depois do parecer jurídico e do antibot no ar. Motivo novo: `τ > 0` enfraquece a defesa do art. 9º, III (C-16). Subir `τ` é generosidade; baixar é punição retroativa. `02` D2 + `05` D1 + `01` D4. |
| **A4** | O nível do legado vem do XP do cliente ou do tempo medido pelo servidor? | (a) tempo creditado pelo servidor; (b) XP com combate validado no servidor | **(a).** Três relatórios convergiram sozinhos (C-13). (b) significa reescrever combate, dano, loot e colisão no servidor. **É a decisão de maior alavancagem do plano inteiro.** |
| **A5** | **A régua é da pessoa ou da Linha?** *(NOVA — nenhum relatório listou isto como decisão)* | (a) **da Linha** (uma família revezando conta como uma pessoa); (b) da pessoa (exigiria distinguir família de fazenda de bots — impossível) | **(a).** Coerente com o conceito ("a conta é o artefato herdado") e é a única implementável. Consequência: o teto é por Linha e a comunicação diz isso. Resolve R-02, R-04 e metade de R-13. |
| **A6** | Qual a regra de hash da Crônica? *(irreversível depois do primeiro evento)* | (a) concatenação de `09`; (b) `BYTEA` de `05`; (c) **JSON canônico RFC 8785 + prefixo de versão, de `04`** | **(c).** É a única testada, e a única decisão do plano que **não tem conserto** depois (C-01). Com o `payload` restrito por `03` DIV-9. |
| **A7** | O que acontece com os ~139 personagens atuais? | (a) preservar nível; (b) remapear por tempo; (c) **"Era Zero" + Selo de Pioneiro** | **(c).** `02`, `03` e `09` convergiram. Preservar custaria só 0,74% do horizonte, mas faria a régua nascer mentindo por causa das contas de teste (C-15). Acompanha a carta pessoal de `08` §4.4. |
| **A8** | Menores de idade entram na régua? *(jurídico — exige parecer escrito)* | (a) **sim, com as salvaguardas S1–S12 e kill-switch**; (b) só 18+; (c) "Aprendiz": joga tudo, sem crédito de tempo até os 18 | **(a), com (c) pronto como plano B** (`06` D1). **Só liberar menores depois do parecer escrito.** Um aviso "18+" **não** afasta o "acesso provável" da Lei 15.211. |
| **A9** | Uma Linha sem herdeiro pode ser adotada por um estranho? | (a) **sim, mas só com opt-in do Guardião**, perguntado obrigatoriamente na Investidura; (b) sim, automaticamente após 5 anos; (c) não, vira Monumento | **(a)** — e com uma consequência que nenhum relatório viu: **o Commons é o que torna o conceito viável.** Sem ele, a chance de qualquer Linha chegar a 3147 é de ~1/3 na hipótese otimista (R-03). `01` C4 + `03` D18 × `06` D12 (C-08). |
| **A10** | **Android: registrar-se como desenvolvedor e criar uma chave de release?** *(independente do plano)* | (a) **registrar + chave de release própria em custódia**; (b) conta de distribuição limitada (20 aparelhos) só para testadores + web como caminho principal; (c) tirar o APK do site | **(a) até 31/12/2026, com (b) em paralelo.** A onda de 30/09/2026 é só para lojas; o APK do site é atingido em **2027** (§1). A chave de release tem que existir **antes** do registro, e ser custodiada. |
| **A11** | **Existe hoje um backup verificado e uma segunda pessoa com acesso?** *(independente do plano)* | (a) **dump diário verificado para 2 destinos + adjunto nomeado, antes de qualquer migração**; (b) só antes da primeira migração; (c) confiar no backup do Supabase | **(a)** (`04` D14 + D6). Hoje o *bus factor* é 1 e `04` não encontrou backup nenhum. **Nenhuma promessa de séculos é honesta antes disto.** |

### (B) IMPORTANTES — antes da fase correspondente

| # | A pergunta | Opções | Recomendação |
|---|---|---|---|
| **B1** | O nível gigante entra nas fórmulas de combate? | (a) sim, como hoje; (b) **"Nível de Combate" logarítmico** `100·log₁₀(1+L)` | **(b)** (`02` D5): mantém todas as fórmulas atuais, nada passa de 3,8e9, e a dificuldade para de derivar. |
| **B2** | O e-mail de login muda quando o herdeiro assume? | (a) nunca; (b) **`login_handle` agora, modelo de `05` antes da 1ª Passagem a não-familiar**; (c) renomear a PK | **(b)** — a ponte de `03` DIV-2 (C-04). |
| **B3** | Web + mobile ao mesmo tempo | (a) **bastão de crédito** (uma credita, a outra joga e avisa); (b) bloquear a segunda; (c) somar | **(a)** (`09` D-2, `05` D3). Nunca tirar em silêncio. |
| **B4** | Revogação de sessão (`token_epoch`) | (a) **Fase F0**; (b) só na Fase 3; (c) reduzir o JWT para 24 h | **(a)** (`09` D-6). Conserta hoje um problema que existe independentemente do legado: **não há como expulsar uma sessão** [VERIFICADO]. |
| **B5** | Prazos de dormência e da escada de avisos | (a) conservador 24/48 m; (b) **a tabela de `03` §A.4** (365/730 d, Vigília 30 d); (c) agressivo | **(b)** (C-07) — **condicionado a existir e-mail transacional** (R-12). |
| **B6** | Como a conta muda de Guardião | (a) **só três caminhos: Ritual, Cofre (Chave do Legado), ordem judicial**; (b) + revisão humana de parentesco; (c) + reconhecimento no login | **(a)** (`03` D4, `05` §4.4). (b) é a superfície de engenharia social de um dev solo. |
| **B7** | Chave do Legado em papel | (a) **obrigatória para ser reconhecido como Keeper**; (b) opcional; (c) não existe | **(a)** (`05` D6, `03` D15, `04` D13-A: 24 palavras + papel permanente + 2 cópias, hash SHA-256). |
| **B8** | MFA (TOTP) | (a) nunca; (b) **obrigatório para Keepers a partir da 1ª sucessão**; (c) para todos desde já | **(b)** (`05` D7, `03` DIV-15). (c) afasta jogador novo num jogo com 48 contas. |
| **B9** | Fraude descoberta retroativamente | (a) rollback silencioso; (b) **Selo de Contestação** (nada apagado, correção registrada); (c) anulação de Era | **(b) como padrão, (c) só para fraude sistemática, (a) nunca** (`05` D5) — e a correção entra como **ajuste datado**, nunca reescrita do total (R-08). |
| **B10** | Publicar a "cabeça" da cadeia da Crônica | (a) semanal, **em ≥ 3 testemunhas das quais ≥ 2 independentes de conta do operador**; (b) mensal só nas redes; (c) não publicar | **(a)** (`04` D12 sobre `05` D8): uma conta de rede social é ponto único de falha, não testemunha. |
| **B11** | O que "zerar" significa | (a) o jogo acaba para todos; (b) **a Linha se aposenta com honra em um Hall; mundo e demais Linhas continuam**; (c) New Game+ | **(b)** (`01` D9), com **Monumento + Novo Ciclo como Linha separada** (`03` D8) e **Keystone conjunta por ano civil** em caso de empate (`03` D10). |
| **B12** | Ghosts secundários | (a) níveis astronômicos livres; (b) **Rank 1–100 no Jogo Livre, sem crédito de horas**; (c) sem nível | **(b)** (`07` DC-7) — **mas atenção:** isso é uma migração dos 139 personagens que nenhum roteiro prevê (R-15), e não resolve o baú compartilhado (R-10). |
| **B13** | Power creep por Era no equipamento | (a) sim; (b) **não: itens por razão, com Selo de Era e Refundir** | **(b)** (`07` DC-8) — e é o que neutraliza R-10 de graça. |
| **B14** | Bônus numérico de linhagem / relíquias | (a) **honoríficas e não transferíveis**; (b) bônus aditivo pequeno; (c) negociáveis | **(a)** (`03` D12, `07` DC-10, contra o `DEFAULT true` de `09`). Relíquia com poder é item negociável — o oposto do anti-RMT. |
| **B15** | Infraestrutura de longo prazo | (a) Supabase pago; (b) Postgres na VPS; (c) **Supabase pago + réplica na VPS + export semanal fora** | **(c)**, com (a) como piso (`09` D-5), **lembrando que réplica não é backup** (`04` 8.2). |
| **B16** | Natureza da conta nos Termos | (a) **licença + Passagem oficial**; (b) licença + herdeiros civis amplos; (c) propriedade | **(a)** (`06` D2). "Propriedade" cria valor e abre RMT. |
| **B17** | Padrão de privacidade da Crônica | (a) camadas + alias; (b) + cifra no armazenamento mutável; (c) **zero dado pessoal na Crônica** | **(c) como padrão global** — `06` D3 só a recomendava para menores e falecidos; adotá-la para todos resolve LGPD e GDPR de uma vez (R-16). |
| **B18** | Anti-RMT | (a) **estrito** (designação ≥30 d, guarda mínima 180 d, atestado de gratuidade, sanções com apelação); (b) moderado; (c) mercado oficial | **(a)** (`06` D7, `03` §A.4). A alavanca real: **o comprador leva o save, não a Linha** — nunca aparece na Crônica. |
| **B19** | Menor como Heir | (a) **Adulto Responsável, com a escada de dormência pausada (Reserva) até ele poder aceitar**; (b) só < 12; (c) proibir | **(a)** (`01` D11, `03` D6/DIV-7). Definir o teto da Reserva (proposta: até os 18 do menor). |
| **B20** | Idioma dos Termos | (a) **PT-BR autoritativo + tradução EN**; (b) EN autoritativo; (c) bilíngue equivalente | **(a)** (`06` D11) — o operador e as contas de hoje são brasileiros. |

### (C) PODEM ESPERAR

| # | A pergunta | Recomendação |
|---|---|---|
| **C1** | Vocabulário final em inglês | Travar `01` B.3 + `03` A.1 + `08` D-L14 (**Keeper**, **the Closing**, **Keeper's Signal**), **depois** da revisão por um falante nativo (C-11). |
| **C2** | Quantas Eras, e quais | 10 Eras de `07` DC-4, ancoradas em tempo creditado. |
| **C3** | Era I: 1 fase por hora creditada? | Sim, com rejogo livre (`07` DC-5) — as 33 fases atuais viram o primeiro mês. |
| **C4** | Escada das 333 badges | Trocar para Marcos de Dígito (`07` DC-6), preservando o que já foi ganho — **é uma migração** (R-15). |
| **C5** | Uma moeda ou duas | Score + Óleo da Lanterna (`07` DC-9), o Óleo entrando junto da 1ª Passagem. |
| **C6** | PvP futuro | Nível de Batalha fixo em 100, atributos por razão (`07` DC-11). |
| **C7** | Coro + Monumento jogável no fim | Sim, desenhados agora, implementados só na Era VIII (`07` DC-12). |
| **C8** | Moldura narrativa / lore novo | Camada 1 ("o jogo está voltando para casa"), só canon (`08` D-N1 (a) se não houver resposta); **desaconselhado** E3 ("a Fenda fecha se você não jogar" — é cobrança). |
| **C9** | Datas dos rituais | Legacy Day = aniversário do Day One; Roll Call em 21 de junho (`08` D-L1). |
| **C10** | Recompensa de eventos | Só memória — nunca XP/nível/item (`08` D-L2). Protege a régua e não cria preço de conta. |
| **C11** | Temporadas | Nenhuma até o ano 3 (`08` D-L3). |
| **C12** | Placares públicos | Só Era/continuidade/coortes; sem nível nem horas exatas por 3–5 anos (`08` D-L5). |
| **C13** | Chat global (MQTT público) | Rotular "public, unmoderated", não hospedar rituais nele, mover para canal autenticado antes dos eventos da Crônica (`08` D-L6). |
| **C14** | Contador "Day N of 409.538" + página "Saúde do Legado" | As duas (`08` D-L12); o contador congela no Closing. |
| **C15** | Licença do código e dos assets | AGPL-3.0 + CC BY-SA 4.0 após auditoria de titularidade (`06` D9 / `04` D2), **nunca fechado sem escrow**. |
| **C16** | Casa jurídica | Trilha escalonada: adjunto → associação (antes da 1ª Passagem) → fundação quando houver dotação (`04` D3, `06` D8). |
| **C17** | Meta de financiamento | Piso N3/N4 primeiro; N1 como meta de 5 anos (`04` D4) — **acrescentando o cenário de sucesso** (R-20). |
| **C18** | Domínio | Pré-pagar 10 anos, travar, 2FA físico, monitor externo (`04` D8). |
| **C19** | Blockchain própria | Só depois dos critérios (a)–(d) de `04` §5 — e o papel honesto é carimbar 32 bytes, nunca guardar o jogo (`04` D9, `05` §5.2, `09` §1.4 convergem). |
| **C20** | Voluntários de comunidade | 2 Lookouts no ano 1, Scribes no ano 2, adultos, rodízio de 2 anos (`08` D-L4). |
| **C21** | Bot/IA pode ser Keeper? | Não — o Keeper de registro é sempre uma pessoa; IA auxiliar aparece **marcada como IA** (`01` D7), coerente com a regra do `Agent G [IA]`. |

**Contradições entre recomendações que eu resolvi nesta lista:** A3 (`02` × `05` × `06`), A9 (`06` × `01`/`03`), B2 (`09` × `05` × `03`), B5 (`09` × `05` × `03`), B7 (hash: `05` × os outros três), B14 (`09` × `03`/`07`), B17 (`06` consigo mesmo), e a política de convites (`06` S5 × `08` §5.4, resolvida em C-14 e refletida em B17/C10).

---

## (f) Riscos desta auditoria e o que eu NÃO consegui verificar

**Riscos do meu próprio trabalho, ditos antes que alguém descubra:**

1. **Eu também não li `engine.js` inteiro** (220 KB, `CLAUDE.md` §6). A afirmação "XP é 100% do cliente" continua sendo **"nos dois pontos conhecidos"**, não um fato fechado. A varredura exaustiva por `state.level =` e irmãos é pré-requisito da Fase F1 e **continua pendente** — é do `gameplay-engineer`.
2. **Nenhum dos meus achados foi reproduzido contra o banco real.** O brief proíbe (§2.3) e eu respeitei. Pelo meu próprio padrão, **um achado não reproduzido é uma hipótese com boa evidência, não um fato** — isso vale para o cenário "zerar em um pacote" (que é leitura de código de `05`, confirmada por mim na mesma leitura) e para o modo de falha silencioso do `COALESCE`. O primeiro teste a fazer, numa conta descartável e num banco isolado, é o cenário #1 de `05` §1.1.
3. **A verificação do Decreto 12.880 é de fonte secundária convergente**, não do texto primário — `planalto.gov.br` recusou a conexão duas vezes e o Jusbrasil devolveu 403. **`06` conseguiu ler o texto no Legin da Câmara e a redação dele bate com a minha**, o que aumenta a confiança, mas antes de virar cláusula de Termos alguém precisa abrir a fonte primária.
4. **A página oficial do Android confirma datas, países, escopo de lojas e a conta de distribuição limitada, mas não descreve o bloqueio do sideload em si** — essa parte veio de imprensa técnica (mesma limitação que `04` já registrou). E **a página não diz explicitamente o que acontece com um app assinado com chave debug**; minha conclusão sobre isso é **[HIPÓTESE fundamentada]** e precisa ser confirmada pelo `mobile-platform-engineer`.
5. **Os números de sobrevivência geracional (R-03) usam um modelo simples** (probabilidade independente por Passagem, mandato médio fixo). A realidade tem correlação (uma família que passou bem uma vez passa melhor na seguinte) e mandatos variáveis. **O modelo é para dar ordem de grandeza, não precisão** — mas a ordem de grandeza é o que importa e é devastadora em qualquer variação razoável.
6. **Não recomputei os Monte Carlo de `02`** (só os resultados fechados e as fórmulas em regime). Onde meu número determinístico difere do dele (3272 × 3234 para q=10%), eu expliquei a diferença de método em vez de declarar um errado.
7. **Não li três relatórios por inteiro** — de `06`, `07` e `08` li os resumos, as seções citadas nas contradições e as decisões; de `04`, as seções 4, 5, 8 e as decisões. Li `01`, `02`, `03` §A/§0, `05` e `09` integralmente ou quase. **Se houver contradição fora do que li, ela não está neste livro** — e, pelo tamanho do material (~790 KB), isso é uma limitação real, não uma formalidade.

**Fatos que eu não pude checar e que outros precisam trazer:**

- Se o `migrate_legacy_era_zero.js` em simulação mostraria contas com níveis absurdos (só o dono pode autorizar).
- O plano contratado do Supabase, os custos reais e se existe backup hoje.
- O comportamento real do `visibilitychange` e do `localStorage` no APK.
- Se algum lugar do código já acumula tempo em `characters."time"` (`09` (f) também não conseguiu; o teto de 1e8 vira bug latente se alguém achar que sim).

**Declaração final.** Nenhum arquivo do jogo foi alterado. Nenhuma migração foi executada. Nenhuma consulta foi feita ao banco de produção. Nenhuma credencial foi lida. Os scripts de cálculo (`audit_curve.js`, `lineage_survival.js`) ficaram no scratchpad da sessão, fora do repositório.

---

## Anexo A — Fontes externas consultadas em 2026-09-20

| Tema | Fonte |
|---|---|
| Android: verificação de desenvolvedor, datas, países, escopo de lojas, conta de distribuição limitada, rollout global de 2027 | https://developer.android.com/developer-verification (página oficial, lida por fetch) |
| Android: o que muda na prática para instalação fora de loja, fluxo avançado, ADB | https://www.androidauthority.com/android-sideloading-changes-timeline-3679204/ · https://thehackernews.com/2026/06/google-sets-sept-30-deadline-for.html · https://support.google.com/android-developer-console/answer/16561738 |
| Decreto nº 12.880, de 18/03/2026 — art. 9º, parágrafo único, incisos I a IV | https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12880.htm (fonte primária — **conexão recusada nas minhas tentativas**) · https://www2.camara.leg.br/legin/fed/decret/2026/decreto-12880-18-marco-2026-798813-publicacaooriginal-178481-pe.html (Legin, lido por `06`) · https://www.gov.br/mj/pt-br/assuntos/arquivos-imprensa/sedigi/decretos-eca-digital.pdf |
| Lei nº 15.211/2025 (ECA Digital): sanção 17/09/2025, vigência 17/03/2026, escopo de "acesso provável" | https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/estatuto-digital-da-crianca-e-do-adolescente-lei-n-15-211-2025-entra-em-vigor-em-17-de-marco-de-2026 · https://www.mayerbrown.com/pt/insights/publications/2026/04/enforcement-of-brazils-eca-digital-introduces-new-obligations-for-companies · https://www.gov.br/mj/pt-br/assuntos/sua-protecao/sedigi/eca-digital/eca-digital-1 |

*Fim do relatório.*
