# 02 — CALIBRAÇÃO MATEMÁTICA DO JOGO LEGADO

**Agente:** `progression-actuary` · **Data:** 2026-09-20 · **Modo:** PLANO (nenhum arquivo do jogo foi alterado)
**Lacunas do brief que este relatório cobre:** 2, 3, e a metade de simulação da 11. Toca 9 e 10 no que é numérico.

---

## Como ler este documento

Cada afirmação numérica leva uma marcação:

- **[CÁLCULO]** — número que eu produzi rodando um script Node de verdade. O nome do script vem junto.
- **[VERIFICADO]** — número ou comportamento que eu li direto no código-fonte do jogo (arquivo e linha).
- **[HIPÓTESE]** — suposição sobre comportamento humano ou sobre o ritmo de jogo. Não é medição; é premissa declarada, e eu digo a faixa.

Os scripts ficaram no *scratchpad* da sessão (fora do repositório do jogo, como manda o brief §2.2):
`01_base_diagnostico.js`, `02_curvas.js`, `03_orcamento_sensibilidade.js`, `04_precisao.js`, `05_montecarlo.js`, `06_sistemas_derivados.js`, `07_margem.js`.
Todos são determinísticos: qualquer sorteio aleatório usa um gerador com semente fixa, então rodar de novo dá exatamente os mesmos números.

**Glossário mínimo** (aparece explicado de novo na primeira vez que o termo é usado no texto):

| Termo | O que quer dizer aqui |
|---|---|
| **soma acumulada** | somar todos os degraus da escada de XP do nível 1 até o nível L. É isso que custa chegar num nível, não o degrau L sozinho. |
| **float64** | o único tipo de número que o JavaScript tem. Representa inteiros com exatidão só até 9.007.199.254.740.991 (≈ 9,007e15). Acima disso ele *arredonda em silêncio*. |
| **Monte Carlo** | rodar a mesma simulação centenas ou milhares de vezes com sorteios diferentes, para ver a *distribuição* dos resultados (mediana, pior caso, melhor caso) em vez de só a média. |
| **hora de referência** | a unidade da régua do dono. Uma hora *creditada pelo servidor*, não uma hora de relógio de parede. Definida no §3. |
| **ULP** | o menor valor que ainda consegue mudar um número em float64. Quanto maior o número, maior o ULP. Ganhos abaixo do ULP somam **zero**. |

---

## (a) RESUMO EM 10 LINHAS

1. **O insight do MP (§8 do brief) está correto:** 1e11 níveis ÷ 409.538 horas = **244.177,59 níveis/hora**, 0,014743 s por nível — erro do MP de 0,073%. **[CÁLCULO: `01_base_diagnostico.js`]**
2. Mas a média engana: hoje a renda de XP cresce **mais rápido** que o custo (`XP/kill ∝ L^1,90`, `XPRequired ∝ L^1,45`), então o jogador **acelera**: `dL/dt = A·L^0,45`. **[VERIFICADO: engine.js:998,1105 + rpg_system.js:476]**
3. **O sistema atual não é "fácil demais por ordens de grandeza" — ele é *imprevisível***: a 1 h/dia, chegar a 1e11 leva de **11,1 anos** (farmando skull em fase alta) a **1.396 anos** (ritmo lento), com **137,9 anos** no cenário típico. **[CÁLCULO: `01_base_diagnostico.js`]**
4. Isso é **8,13×** mais rápido que a régua no caso típico e **101×** no caso otimista — e uma variação de **0,05 no expoente muda o século de chegada**. A calibração de hoje não é robusta. **[CÁLCULO: `03_orcamento_sensibilidade.js`]**
5. **Recomendação central: o nível do legado deve ser uma função pura do tempo creditado pelo servidor** (`nível = L*(horas)`), não um acumulador de XP. Isso torna a data-alvo exata por construção e elimina o erro numérico de 1.100 anos.
6. **Curva recomendada (Família B):** `L*(H) = 20·H + (1e11 − 20·T)·(H/T)³`, com `T = 409.538 h`. Dia 1 = nível 20; ano 1 = 7.376; ano 100 = 7,17e7; ano 500 = 8,87e9; 3147 = 1e11 **exato**. **[CÁLCULO: `02_curvas.js`]**
7. **Orçamento diário recomendado: "Banco de Vigília"** — o banco enche 1 h/dia (teto 30 h) e é gasto a 1×; hora real além do banco rende só 0,10. Resultado: 1 h/dia = 1.121 anos, 16 h/dia = 449 anos, bot 24/7 = 340 anos. **Ninguém zera sozinho.** **[CÁLCULO: `03_orcamento_sensibilidade.js`]**
8. **A data só fecha com uma trava de calendário** na última Era (ela abre em 3147-01-01). Sem ela, quem joga 3 h/dia chega em 2978. Com ela, 100% dos arquétipos rápidos zeram *durante* 3147. **[CÁLCULO: `05_montecarlo.js`]**
9. **Três tetos do banco já estourariam hoje** e o modo de falha é silencioso (o campo é deletado e o `COALESCE` preserva o valor antigo): `xp` (3,64e28 vs teto 1e19), `score` (4,22e18 vs 1e16) e **`time` (1,47e9 s vs teto 1e8)**. **[CÁLCULO: `04_precisao.js` + VERIFICADO: db.js:425-480]**
10. **Migração:** preservar o nível dos ~139 personagens atuais custa **no máximo 0,74% do horizonte** — é inofensivo para a data. A escolha entre "preservar" e "Era Zero" é narrativa, não matemática. **[CÁLCULO: `06_sistemas_derivados.js`]**

---

## (b) ANÁLISE E PROPOSTA

---

## §1 — DIAGNÓSTICO DO SISTEMA ATUAL

### 1.1 O que o código realmente faz

Li o código, não a documentação. Quatro fórmulas governam a progressão hoje:

| O quê | Fórmula | Onde **[VERIFICADO]** |
|---|---|---|
| Custo de um nível | `XPRequired(L) = floor(100 · L^1,45)` | `rpg_system.js:476` (`BASE_XP=100` linha 2, `XP_EXPONENT=1,45` linha 7) |
| Recompensa por kill | `floor(maxHp · 5)` | `js/game/engine.js:1105` e `:3311` |
| HP do inimigo | `floor(baseHp · L^1,90 · fase)`, `baseHp` = 4 (comum), 9 (cactus), 33 (skull) | `js/game/engine.js:996-998` |
| Fator de fase | `1 + (fase − 1)·0,05` → fase 1 = 1,00; fase 32 = 2,55 | `js/game/engine.js:960-964` |
| Teto | `maxLevel = 100000000000` (1e11) | `rpg_system.js:986`, e `NUMERIC_BOUNDS.level` em `server/db.js:467` |

Dois detalhes importantes do `addXp()` **[VERIFICADO: rpg_system.js:983-1070]**:

- O XP é **consumido** a cada nível (`state.xp -= state.xpRequired`). Logo, "quanto custa chegar ao nível L" é a **soma acumulada** de toda a escada, `Σ 100·k^1,45` de k=1 até L−1 — nunca o degrau `XPRequired(L)` sozinho.
- Existe um **orçamento de 1.024 degraus exatos** (`EXACT_LEVEL_STEP_BUDGET`, linha 533). Se sobrar XP depois disso, o código salta em forma fechada usando `cumulativeXpToLevel()` (Euler-Maclaurin) e `levelFromCumulativeXp()` (busca binária).

### 1.2 O achado principal: a renda cresce mais rápido que o custo

Divida a recompensa pelo custo:

```
níveis por kill = (5 · baseHp · fase · L^1,90) / (100 · L^1,45)
                = 0,05 · baseHp · fase · L^0,45
```

O expoente **0,45 é positivo**. Isso quer dizer que **cada kill vale mais níveis conforme o personagem sobe** — o jogador não desacelera, ele acelera. Com `k` kills por hora:

```
dL/dt = A · L^0,45,   onde A = 0,05 · k · baseHp · fase
Solução:  t(L) = L^0,55 / (0,55 · A)      [horas de jogo até o nível L]
```

**Validei essa fórmula contínua contra uma simulação bruta kill-a-kill** que reimplementa a aritmética exata do `addXp()` (inclusive o orçamento de 1.024 degraus e o salto em forma fechada) **[CÁLCULO: `01_base_diagnostico.js`]**:

| Nível alvo | Horas (simulação kill-a-kill) | Horas (fórmula contínua) | Erro relativo |
|---|---|---|---|
| 1e3 | 6,7667 | 6,7679 | +1,9e-4 |
| 1e4 | 24,0500 | 24,0135 | −1,5e-3 |
| 1e5 | 85,2833 | 85,2032 | −9,4e-4 |
| 1e6 | 302,4333 | 302,3125 | −4,0e-4 |
| 1e7 | 1.072,80 | 1.072,65 | −1,4e-4 |
| 1e8 | 3.806,07 | 3.805,89 | −4,7e-5 |

O erro fica **abaixo de 0,2%** e *diminui* conforme o nível sobe. A fórmula fechada pode ser usada com confiança para o resto da análise.

### 1.3 Quanto tempo leva HOJE, a 1 h/dia?

Aqui entra a única premissa que o código não me dá: **quantas kills por hora um jogador real faz, de que tipo, em que fase**. Declaro três cenários **[HIPÓTESE]** e reporto a faixa inteira em vez de fingir um número único:

| Cenário | kills/h | baseHp | fase | A | Horas ativas até 1e11 | Anos a 1 h/dia | vs. régua (1.121,3 anos) |
|---|---|---|---|---|---|---|---|
| **Pessimista** (fantasma comum, fase 1, ritmo lento) | 20 | 4 | 1,00 | 4,00 | 5,10e5 | **1.396,4** | 0,80× (mais *lento* que a régua) |
| **Típico** (cactus, fase média) | 60 | 9 | 1,50 | 40,50 | 5,04e4 | **137,9** | **8,13× mais rápido** |
| **Otimista** (farm de skull em fase 32) | 120 | 33 | 2,55 | 504,90 | 4,04e3 | **11,1** | **101,4× mais rápido** |

**[CÁLCULO: `01_base_diagnostico.js`]**

### 1.4 O que isso significa, em português

O dono disse "está muito fácil subir de level". Ele está certo — mas o diagnóstico exato é mais interessante do que "fácil demais":

> **O sistema atual não tem *uma* velocidade. Ele tem uma velocidade por estilo de jogo, e elas diferem em 126×.**
> Dois jogadores, ambos honestos, ambos jogando exatamente 1 hora por dia, chegam ao nível 1e11 com **1.385 anos de diferença** entre si.

Uma progressão calibrada a uma **data** não pode conviver com isso. A régua do dono ("1 h/dia ⇒ 1e11 em 3147") é uma promessa sobre o *calendário*, e o sistema atual não faz promessa nenhuma sobre o calendário — ele faz promessa sobre XP.

E há um agravante, medido: **[CÁLCULO: `03_orcamento_sensibilidade.js`]**

| `XP_EXPONENT` (p) | Anos até 1e11 a 1 h/dia (cenário típico) | Fração da régua |
|---|---|---|
| 1,40 | 42,8 | 0,038× |
| 1,43 | 86,2 | 0,077× |
| **1,45 (hoje)** | **137,9** | **0,123×** |
| 1,47 | 220,9 | 0,197× |
| 1,50 | 448,6 | 0,400× |
| 1,55 | 1.469,1 | 1,310× |
| 1,60 | 4.840,2 | 4,317× |

Mexer 0,05 no expoente move a chegada de 138 para 449 anos. **Um parâmetro que muda o século de chegada com a terceira casa decimal não é uma base sólida para um conceito de 1.100 anos.**

### 1.5 Como o jogo se sente hoje (cenário típico)

**[CÁLCULO: `01_base_diagnostico.js`]**

| Nível | Horas ativas | A 1 h/dia | Níveis ganhos por hora nesse ponto |
|---|---|---|---|
| 10 | 0,159 | 9,6 minutos | 40,5 → 128 |
| 100 | 0,565 | 34 minutos | 322 |
| 1.000 | 2,0 | 2 dias | 908 |
| 10.000 | 7,1 | 7 dias | 2.555 |
| 1e6 | 89,6 | 90 dias | 20.298 |
| 1e9 | 4.001 | 11,0 anos | 4,05e5 |
| 1e10 | 14.197 | 38,9 anos | 1,28e6 |
| 1e11 | 50.371 | **137,9 anos** | 3,61e6 |

Traduzindo: hoje, **um jogador sozinho, em uma vida longa e dedicada, zera o jogo**. Isso viola diretamente a restrição que o `legacy-philosopher` fixou em `raw/01_filosofia.md` §C2 ("nenhum perfil humano plausível pode zerar sozinho").

---

## §2 — RECONFERÊNCIA DOS NÚMEROS DO BRIEF

Todos recalculados do zero com `Date.UTC` e aritmética própria, sem confiar no brief.

### 2.1 Contagem de dias **[CÁLCULO: `01_base_diagnostico.js`]**

| De 2026-09-20 até | Dias | Anos |
|---|---|---|
| 3147-01-01 | **409.174** | 1.120,280 |
| 3147-07-02 (meio do ano) | **409.356** | 1.120,779 |
| 3147-12-31 | **409.538** | 1.121,277 |

✅ **Os dois números do brief (409.538 e 409.174) estão corretos.**
A janela do ano 3147 tem 364 dias = **0,0889% do horizonte total**. Isso é uma mira estreitíssima e volta a importar no §6.
Maior ano representável em `Date` do JavaScript: **275.760** — folga enorme para 3147. ✅

### 2.2 A escada de XP atual **[CÁLCULO: `01_base_diagnostico.js`]**

| Grandeza | Valor |
|---|---|
| `XPRequired(1e11)` = `floor(100·(1e11)^1,45)` | **8,9125e17** |
| XP acumulado para chegar a 1e11 (Euler-Maclaurin) | **3,6378e28** |
| Renda constante que fecharia em 409.538 h | **8,8826e22 XP/hora** |

✅ **O "~3,64e28" do brief está confirmado.**

**Validação da aproximação contra força bruta.** `cumulativeXpToLevel()` usa Euler-Maclaurin (uma fórmula que aproxima uma soma muito longa por uma integral mais termos de correção). Somei a escada exata `Σ floor(100·k^1,45)` com soma de Kahan (técnica que cancela o erro de arredondamento) e comparei:

| n | Soma exata | Aproximação | Erro relativo |
|---|---|---|---|
| 10 | 1,294000e4 | 1,294685e4 | **5,294e-4** |
| 100 | 3,281919e6 | 3,281968e6 | 1,507e-5 |
| 1.000 | 9,148829e8 | 9,148834e8 | 5,543e-7 |
| 10.000 | 2,575652e11 | 2,575652e11 | 1,947e-8 |
| 100.000 | 7,258372e13 | 7,258372e13 | 6,894e-10 |
| **1.000.000** | **2,045664683957e16** | **2,045664684007e16** | **2,445e-11** |
| 10.000.000 | 5,765460e18 | 5,765460e18 | 8,703e-13 |

✅ **O valor 2,45e-11 em n=1e6 que a skill cita está confirmado**, e o erro cai como ~n^-1,45. A aproximação é excelente onde é usada (n grande) e ruim onde não é usada (n=10, erro de 0,05% — mas ali o `addXp()` percorre a escada exata degrau a degrau, então não afeta o jogo). **[VERIFICADO: rpg_system.js:498-533]**

**Teste de ida-e-volta.** Testei `levelFromCumulativeXp(cumulativeXpToLevel(L)) == L` em 60 níveis (incluindo as bordas 1, 2, 1023, 1024, 1025, 1e11−1, 1e11 e uma grade log-espaçada): **0 falhas** **[CÁLCULO: `04_precisao.js`]**. A ida-e-volta é consistente porque os dois lados usam a *mesma* aproximação — o que é exatamente o que o `addXp()` precisa. (Consistência interna ≠ exatidão absoluta; a diferença para a escada verdadeira está na tabela acima.)

### 2.3 O insight do §8 do brief — **CONFIRMADO, com uma correção importante de leitura**

**[CÁLCULO: `01_base_diagnostico.js`]**

```
1e11 níveis ÷ 409.538 horas = 244.177,59 níveis por hora
3600 s ÷ 244.177,59          = 0,014743 s por nível
```

O MP disse "~244.000 níveis/hora, ~0,0147 s por nível". **Erro de 0,073%. Confirmado.**
(Até 3147-01-01 dá 244.394,81/h; até o meio de 3147, 244.286,15/h — a escolha do extremo do ano muda 0,09%.)

**A correção de leitura:** esse número é uma **média sobre 1.121 anos**, e média só descreve alguma hora real se a curva for **linear**. Nas curvas do §4:

- Na Família A (linear), toda hora vale exatamente 244.177,59 níveis — inclusive a primeira.
- Na Família B recomendada, a **primeira hora vale 20 níveis** e a **última vale ~732.490**. Nenhuma hora real vale 244.177.

Então a conclusão do MP — *"o nível vira um contador gigante; a experiência de progresso tem que morar em outra unidade"* — **está certa, e eu a sustento**. Mas ela não obriga o dia 1 a ser absurdo. É perfeitamente possível ter um dia 1 humano (20 níveis, um a cada 3 minutos) **e** fechar em 1e11 em 3147: basta que a curva seja **crescente**, jogando o grosso do contador para os séculos finais. É o que a Família B faz.

**Prova aritmética de que o §8 é inescapável em pelo menos um ponto:** se o dono quiser que *nenhuma* hora dê mais de, digamos, 1.000 níveis, então o máximo alcançável em 409.538 horas é 4,1e8 — **244 vezes menos** que 1e11. Ou o contador estoura a escala humana em algum momento, ou o teto 1e11 não é atingível na régua. **Não existe terceira opção.** **[CÁLCULO: aritmética direta, 409538 × 1000]**

---

## §3 — DEFINIÇÃO OPERACIONAL DE "1 HORA DE JOGO"

O `security-engineer` (`raw/05_integridade_antiabuso.md`) já especificou o **mecanismo** (heartbeat de 30 s, relógio só do servidor, `credited_seconds BIGINT`, sessão única por conta). Eu defino aqui a **unidade matemática** — o que a fórmula chama de `H`.

### 3.1 Definição

> **Hora de referência (h_ref):** 3.600 segundos de **tempo ativo creditado pelo servidor** a **uma conta**, acumulados no contador inteiro `credited_seconds`.
>
> Um segundo é creditado quando, e somente quando, **todas** as condições valem:
> 1. existe uma sessão autenticada aberta, com `session_id` gerado pelo servidor;
> 2. o servidor recebeu, dentro da janela de heartbeat, evidência de entrada do jogador (a definição de "entrada plausível" é do `security-engineer`);
> 3. o segundo é medido pelo **relógio do servidor**, nunca pelo do cliente;
> 4. o segundo é atribuído ao **ghost do legado** daquela conta.
>
> **Uma conta = um relógio.** Web e mobile abertos ao mesmo tempo, ou duas abas, creditam **um** segundo por segundo de parede, nunca dois. O crédito é por *conta*, não por socket.

### 3.2 O que conta e o que não conta

| Situação | Conta? | Por quê |
|---|---|---|
| Jogando fase/dungeon | ✅ | é o caso base |
| Overworld isométrico, caminhando | ✅ | é jogo |
| Ghostdex / inventário / paperdoll abertos, com interação | ✅ até um **limite diário de 15 min** | é parte do jogo, mas é trivialmente "AFKável" |
| Cutscene (GIF) rodando | ✅ | é conteúdo; tem duração fixa e finita |
| Chat global sem entrada de jogo | ❌ | não é jogo, e é infinito |
| Menu/pausa parado | ❌ | — |
| Aba em segundo plano / app minimizado | ❌ | o `visibilitychange` já existe no navegador |
| Sem entrada por > 120 s | ❌ (pausa o relógio) | limiar de ociosidade — número exato é decisão do `security-engineer` |
| Ghost secundário (não o do legado) | ❌ para a régua; ✅ para score/badges/itens | a régua é do *ghost do legado* (brief §3) |

### 3.3 Por que a definição tem que ser essa, matematicamente

Porque a data-alvo é uma função **exclusiva** de `H`. Se `H` for medida com um fator de erro `f`, a data de chegada é multiplicada por `f`. Medido **[CÁLCULO: `03_orcamento_sensibilidade.js`]**:

| Se 1 "hora de referência" valer... | Horas reais/dia para ganhar 1 h_ref | Anos até 1e11 jogando 1 h **real**/dia |
|---|---|---|
| 45 min | 0,750 | **841** |
| 50 min | 0,833 | 934 |
| **60 min (recomendado)** | **1,000** | **1.121** |
| 75 min | 1,250 | 1.402 |
| 90 min | 1,500 | 1.682 |

Mudar a definição em 15 minutos move a chegada em **280 anos**. Isto é: **a definição da hora é um parâmetro de calibração tão forte quanto a própria curva**, e merece o mesmo rigor.

### 3.4 Recomendação

**60 minutos de tempo ativo creditado, limiar de ociosidade de 120 s, teto de 15 min/dia para telas não-combate, uma conta = um relógio.**
Motivo: é a única definição que o jogador consegue explicar para outra pessoa sem consultar documentação ("uma hora jogando é uma hora"). Qualquer fator diferente de 1,0 introduz uma conversão mental que vai gerar reclamação por 1.100 anos.

---

## §4 — TRÊS FAMÍLIAS DE CURVA

### 4.0 A decisão de arquitetura que vem antes das curvas

Antes de escolher a *forma* da curva, é preciso escolher **de onde o nível vem**. Duas opções:

| | **(i) Nível acumulado a partir de XP** (como hoje) | **(ii) Nível derivado do tempo creditado** (recomendado) |
|---|---|---|
| Como funciona | o jogo soma XP; o nível é o que a escada permite | o servidor guarda `credited_seconds`; `nível = L*(segundos/3600)` |
| Data-alvo | aproximada, depende do ritmo de kill | **exata por construção** |
| Erro numérico em 1.100 anos | acumulador chega a 3,64e28, onde ganhos abaixo de **4,4e12 XP somam zero** (§7) | **zero** — função pura de um contador inteiro |
| Bot / AFK | ganha tudo que farmar | ganha o mesmo que um humano no mesmo tempo creditado |
| Recalibrar depois | repunitiva ou impossível | trocar a função e versionar a era (§4.5) |

**Recomendo (ii), e todas as três famílias abaixo assumem (ii).** Isso também é o que o `security-engineer` propôs em `raw/05` §3.1 e o que o `backend-architect` já desenhou em `raw/09` §4 (`credited_seconds` como dado primário, XP derivado, `curve_version` na tabela). **Os três relatórios convergiram de forma independente para a mesma arquitetura** — é um bom sinal.

O XP não some: ele continua existindo como a **barra dentro do nível atual** (cosmética, derivada) e como a moeda de score/loot. O que muda é que **o nível do legado deixa de ser um saldo e passa a ser um relógio**.

Notação: `H` = horas de referência acumuladas; `T = 409.538`; `L*(H)` = o nível nessa hora; `v(H) = dL*/dH` = níveis ganhos por hora naquele ponto.

---

### 4.1 Família A — "Odômetro do Tempo" (cadência constante)

```
L*(H) = 244.177,59 · H
v(H)  = 244.177,59  (constante)
```

**[CÁLCULO: `02_curvas.js`]**

| Marco | Horas | Nível | Níveis ganhos nesse dia |
|---|---|---|---|
| 1 hora / 1 dia | 1 | 2,44e5 | 244.178 |
| 1 semana | 7 | 1,71e6 | 244.178 |
| 1 mês | 30 | 7,33e6 | 244.178 |
| 1 ano | 365 | 8,92e7 | 244.178 |
| 10 anos | 3.652 | 8,92e8 | 244.178 |
| 100 anos | 36.524 | 8,92e9 | 244.178 |
| 500 anos | 182.621 | 4,46e10 | 244.178 |
| 1.000 anos | 365.243 | 8,92e10 | 244.178 |
| **3147** | **409.538** | **1,0000e11** | 244.178 |

**Sensação:** o nível **é** o tempo jogado, em outra unidade. Dia 1 você já está no nível 244 mil. Ano 1, nível 89 milhões. O contador nunca surpreende e nunca acelera.

- ✅ A mais honesta e a mais simples de explicar: *"seu nível é o seu tempo de guarda"*.
- ✅ Impossível de quebrar: nenhum exploit de loot muda nada.
- ✅ Variância zero — a data é uma certeza aritmética.
- ❌ **Mata a sensação de crescimento no contador.** A hora 400.000 rende igual à hora 1. Todo o "progresso sentido" precisa vir 100% das Eras/Marcos.
- ❌ Dia 1 já joga o jogador em 6 dígitos — o RPG normal (nível 1, 2, 3...) desaparece na primeira hora.

---

### 4.2 Família B — "Trajetória Polinomial Governada" ⭐ **RECOMENDADA**

```
L*(H) = a·H + (1e11 − a·T) · (H/T)^g
v(H)  = a + (g·(1e11 − a·T)/T) · (H/T)^(g−1)
```

Dois parâmetros com significado direto:

- **`a`** = **quantos níveis por hora no dia 1**. É o "sabor de RPG clássico" do começo.
- **`g`** = **quão para o fim a curva empurra o contador**. `g=1` vira a Família A; `g` maior atrasa mais a explosão.

`L*(T) = 1e11` **exatamente, por construção, para qualquer `a` e `g`.** Isso é a propriedade central: **os parâmetros mudam a *forma*, nunca a *data*.**

#### Calibração recomendada: `a = 20`, `g = 3` **[CÁLCULO: `02_curvas.js`]**

| Marco | Horas | Nível | Níveis nesse dia |
|---|---|---|---|
| 1 hora / dia 1 | 1 | **20** | 20 |
| 1 semana | 7 | 140 | 20 |
| 1 mês | 30 | 600 | 20 |
| 1 ano | 365 | **7.376** | 21 |
| 10 anos | 3.652 | 1,44e5 | 78 |
| 100 anos | 36.524 | 7,17e7 | 5.846 |
| 500 anos | 182.621 | 8,87e9 | 1,46e5 |
| 1.000 anos | 365.243 | 7,09e10 | 5,83e5 |
| **3147** | **409.538** | **1,0000000000e11** ✅ | 7,32e5 |

**Ponto de cruzamento** (onde o termo polinomial ultrapassa o linear): **3.707 h = 10,1 anos**. Ou seja: *o contador começa a acelerar visivelmente na primeira década* — exatamente quando o primeiro Guardião está no auge e o conceito de legado começa a fazer sentido para ele.

#### Comparação de parâmetros **[CÁLCULO: `02_curvas.js`]**

| `a` | `g` | Cruzamento | Nível no ano 1 | Nível no ano 10 | Nível no ano 100 |
|---|---|---|---|---|---|
| 20 | **2** | 34 h (0,1 ano) | 86.836 | 8,03e6 | 7,96e8 |
| **20** | **3** ⭐ | **3.707 h (10,1 anos)** | **7.376** | **1,44e5** | **7,17e7** |
| 20 | 4 | 17.786 h (48,7 anos) | 7.305 | 73.681 | 7,06e6 |
| 10 | 3 | 2.621 h (7,2 anos) | 3.723 | 1,07e5 | 7,13e7 |
| 50 | 3 | 5.861 h (16,0 anos) | 18.333 | 2,54e5 | 7,27e7 |

- `g=2` explode cedo demais (um ano de jogo já são 87 mil níveis) — recai no problema que o §8 do brief pede para evitar.
- `g=4` é lento demais: a primeira geração inteira (48 anos) vive com o contador praticamente parado em ~20 níveis/hora.
- **`g=3` é o equilíbrio:** a primeira década tem cadência humana (20–78 níveis/hora, um nível a cada 1–3 minutos), o primeiro século já mostra aceleração clara, e os séculos finais carregam o contador.

**Sensação, em português:**

- **Dia 1:** você ganha um nível a cada 3 minutos. É um RPG normal. Termina o dia no nível 20.
- **Ano 1:** nível 7.376. Ainda dá para ler o número em voz alta.
- **Década 1:** nível 144 mil, ganhando 78 por hora. O jogador percebe que está acelerando — e a Crônica registra que ele atravessou a primeira Era.
- **Século 1 (o neto do neto):** nível 71,6 milhões, 5.846 níveis/hora. O número já não se lê, vira barra de progresso e Era.
- **Século 5:** 8,87 bilhões. 8,9% do caminho. *91% do contador ainda está pela frente* — e este é o ponto filosófico mais duro: os Guardiões fundadores fazem a parte invisível.

- ✅ Data exata, insensível aos parâmetros de forma.
- ✅ Dia 1 humano, legível, reconhecível como RPG.
- ✅ Dois botões com significado óbvio para o dono.
- ⚠️ A concentração no fim precisa de contra-narrativa (é trabalho do `legacy-philosopher` e do `legacy-systems-designer`, e eu marco como dependência no item (d)).

---

### 4.3 Família C — "Eras Escalonadas" (piecewise)

Cada Era declara sua própria cadência (`níveis/hora` constante dentro da Era). As bordas são **datas de calendário**, não patamares de XP — e isso é uma vantagem de segurança: **um bot não consegue atravessar uma borda de Era, porque a borda não depende do que ele faz**.

Fixei 7 Eras com fronteiras humanas (1 mês, 1 ano, 10 anos, 100 anos, 500 anos, 1.000 anos, 3147) e resolvi numericamente a razão geométrica `r` entre cadências para fechar em 1e11:

#### `v₁ = 20 níveis/hora`, `r = 6,3419` **[CÁLCULO: `02_curvas.js`]**

| Era | De (h) | Até (h) | Níveis/hora | Nível ao fim | % do total |
|---|---|---|---|---|---|
| I — Despertar | 0 | 30 (1 mês) | 20 | 600 | 0,0000% |
| II — Vigília | 30 | 365 (1 ano) | 127 | 4,31e4 | 0,0000% |
| III — Ofício | 365 | 3.652 (10 a) | 804 | 2,69e6 | 0,0027% |
| IV — Linhagem | 3.652 | 36.524 (100 a) | 5.101 | 1,70e8 | 0,1704% |
| V — Dinastia | 36.524 | 182.621 (500 a) | 32.352 | 4,90e9 | 4,8968% |
| VI — Milênio | 182.621 | 365.243 (1.000 a) | 2,05e5 | 4,24e10 | 42,3650% |
| VII — Coroamento | 365.243 | 409.538 (3147) | 1,30e6 | **1,0000e11** ✅ | 100% |

Variando a cadência inicial: `v₁=10` → `r=7,1859`; `v₁=50` → `r=5,3679` **[CÁLCULO: `02_curvas.js`]**.

- ✅ **Máximo controle**: cada Era é um número que o dono escolhe e pode reajustar isoladamente.
- ✅ As bordas viram cerimônias naturais (e o `legacy-systems-designer` já tem rituais para encaixar).
- ✅ Borda por calendário = imune a exploit.
- ❌ **Descontinuidades**: ao virar a Era IV, a cadência salta de 804 para 5.101 níveis/hora **de um dia para o outro** (6,3×). O jogador sente um degrau, não uma curva.
- ❌ 7 Eras em 1.121 anos = uma borda a cada ~160 anos. **Um Guardião típico nunca vê uma virada de Era.** Precisa de subdivisões (Marcos/Graus) de qualquer jeito.

---

### 4.4 Comparação lado a lado **[CÁLCULO: `02_curvas.js`]**

| Marco | Horas | A: nível | B: nível | C: nível | A: nív/h | B: nív/h | C: nív/h |
|---|---|---|---|---|---|---|---|
| 1 hora | 1 | 2,44e5 | **20** | **20** | 2,44e5 | 20 | 20 |
| 1 semana | 7 | 1,71e6 | 140 | 140 | 2,44e5 | 20 | 20 |
| 1 mês | 30 | 7,33e6 | 600 | 600 | 2,44e5 | 20 | 127 |
| 1 ano | 365 | 8,92e7 | 7.376 | 4,31e4 | 2,44e5 | 21 | 804 |
| 10 anos | 3.652 | 8,92e8 | 1,44e5 | 2,69e6 | 2,44e5 | 78 | 5.101 |
| 100 anos | 36.524 | 8,92e9 | 7,17e7 | 1,70e8 | 2,44e5 | 5.846 | 3,24e4 |
| 500 anos | 182.621 | 4,46e10 | 8,87e9 | 4,90e9 | 2,44e5 | 1,46e5 | 2,05e5 |
| 1.000 anos | 365.243 | 8,92e10 | 7,09e10 | 4,24e10 | 2,44e5 | 5,83e5 | 1,30e6 |
| **3147** | 409.538 | **1e11** | **1e11** | **1e11** | 2,44e5 | 7,32e5 | 1,30e6 |

### 4.5 Como a curva vira código (e como recalibrar sem punir ninguém)

A curva nunca deve ser aplicada retroativamente sobre o total de segundos. Se você trocar a fórmula em 2140, o nível de todo mundo mudaria de uma hora para a outra. A saída é **selar as eras de calibração**:

```
nivel = Σ_e  ΔL_e ,  onde ΔL_e = L*_e(H_acumulado_no_fim_da_era_e) − L*_e(H_no_início_da_era_e)
```

Cada recalibração abre uma **nova** `curve_version`; o que foi ganho sob a versão antiga fica congelado **em níveis**. Isso combina exatamente com o `curve_version` que o `backend-architect` já previu em `raw/09` §4 e com a nota dele: *"o ledger guarda segundos, não só XP — tempo é o dado primário"*. Concordo e endosso numericamente.

### 4.6 A unidade que o jogador SENTE (resposta ao §8 do brief)

Uma vez que o nível é um odômetro, a experiência precisa de uma escala **denominada em tempo**, não em nível. Proponho uma escala fractal **[CÁLCULO: divisões diretas de T]**:

| Unidade | Duração (h_ref) | A 1 h/dia | Quantos existem até 3147 |
|---|---|---|---|
| **Vigília** | 1 h | 1 dia | 409.538 |
| **Marco** | 100 h | ~3,3 meses | 4.095 |
| **Grau** | 1.000 h | ~2,7 anos | 410 |
| **Era** | ~58.500 h | ~160 anos | 7 |

Assim todo jogador, em qualquer século, sempre tem: uma Vigília hoje, um Marco em ~3 meses, um Grau nesta fase da vida, e uma Era como herança. **O nível 1e11 vira o que ele é de verdade: o ponteiro final do relógio.**

---

## §5 — ORÇAMENTO DIÁRIO E RENDIMENTO DECRESCENTE

### 5.1 O problema, em um número

Sem nenhum mecanismo, o tempo até 1e11 é `T / (horas por dia)`. **[CÁLCULO: `03_orcamento_sensibilidade.js`]**

| Horas reais/dia | Anos até 1e11 | Cabe numa vida? |
|---|---|---|
| 1 | 1.121 | não |
| 2 | 561 | não |
| 3 | 374 | não |
| 4 | 280 | não |
| 8 | 140 | não, mas 2 gerações |
| **16** | **70** | **SIM — o conceito morre** |
| 24 / bot | **47** | **SIM — o conceito morre** |

Isso confirma e fecha a restrição C2 do `legacy-philosopher`: **um mecanismo anti-maratona não é preferência de design, é requisito matemático.**

### 5.2 Os três mecanismos, com números

#### Mecanismo 1 — Teto rígido diário
Depois de `H_cap` horas creditadas no dia, o ganho é **zero**.

#### Mecanismo 2 — Soft-cap com decaimento
Multiplicador `m(x) = 1` na primeira hora, depois `x^(−α)`. Horas efetivas `E(h) = 1 + [h^(1−α) − 1]/(1−α)` (ou `1 + ln h` se α=1).

#### Mecanismo 3 — "Banco de Vigília" (reservatório) ⭐
Um banco enche **1 h_ref por dia de calendário** (teto 30 h). Você saca do banco a 1×; hora real **além** do banco rende só `τ` (fio d'água). Em regime, para quem joga `h` horas todo dia: **`E(h) = 1 + τ·(h − 1)`**.

#### Tabela comparativa — anos até 1e11 **[CÁLCULO: `03_orcamento_sensibilidade.js`]**

| Arquétipo | Nenhum | Teto 1 h | Teto 3 h | Teto 4 h | Soft α=1 | Soft α=2 | **Banco τ=0,10** ⭐ |
|---|---|---|---|---|---|---|---|
| **1 h/dia (régua)** | 1.121 | 1.121 | 1.121 | 1.121 | 1.121 | 1.121 | **1.121** |
| 2 h/dia | 561 | 1.121 | 561 | 561 | 662 | 748 | **1.019** |
| 3 h/dia | 374 | 1.121 | 374 | 374 | 534 | 673 | **934** |
| 4 h/dia | 280 | 1.121 | 374 | 280 | 470 | 641 | **863** |
| 8 h/dia | 140 | 1.121 | 374 | 280 | 364 | 598 | **660** |
| 16 h/dia | **70** | 1.121 | 374 | 280 | 297 | 579 | **449** |
| 24 h/dia | **47** | 1.121 | 374 | 280 | 268 | 573 | **340** |
| bot 24/7 | **47** | 1.121 | 374 | 280 | 268 | 573 | **340** |
| Só fim de semana (8+8) | 491 | 3.924 | 1.308 | 981 | 1.274 | 2.093 | **994** |
| 1 h/dia, falta 20% dos dias | 1.402 | 1.402 | 1.402 | 1.402 | 1.402 | 1.402 | **1.402** |
| 1 h/dia + 30 dias de férias/ano | 1.222 | 1.222 | 1.222 | 1.222 | 1.222 | 1.222 | **1.222** |

**Razão "dedicado / régua"** (quantas vezes mais rápido):

| Arquétipo | Nenhum | Teto 1 h | Teto 3 h | Soft α=1 | Soft α=2 | **Banco τ=0,10** |
|---|---|---|---|---|---|---|
| 8 h/dia | 8,00× | 1,00× | 3,00× | 3,08× | 1,87× | **1,70×** |
| 16 h/dia | 16,00× | 1,00× | 3,00× | 3,77× | 1,94× | **2,50×** |
| bot 24/7 | 24,00× | 1,00× | 3,00× | 4,18× | 1,96× | **3,30×** |

**Ajuste fino do fio d'água τ** — regime `E(h) = 1 + τ(h−1)` **[CÁLCULO: `03_orcamento_sensibilidade.js`]**:

| h reais/dia | τ=0,05 → anos | τ=0,10 → anos | τ=0,20 → anos |
|---|---|---|---|
| 1 | 1.121 | 1.121 | 1.121 |
| 4 | 975 | 863 | 701 |
| 8 | 831 | 660 | 467 |
| 16 | 641 | **449** | 280 |
| 24 | 522 | **340** | 200 |

**Propriedade central e não óbvia: `τ` não afeta o jogador da régua.** Quem joga exatamente 1 h/dia chega em 1.121 anos com qualquer `τ`. O fio d'água só distribui o excedente. Isso significa que **o dono pode ajustar `τ` depois do lançamento sem mexer na promessa feita ao jogador de referência.**

### 5.3 Efeito psicológico e o risco de punir quem joga mais

Este é o ponto em que a matemática cala e o design fala — mas a matemática delimita o terreno:

| Mecanismo | O que o jogador vê | Risco |
|---|---|---|
| **Teto rígido** | "XP: 0" no meio da sessão. Parede. | **Alto.** Comunica *"pare de jogar"*. Pune o mais engajado e o dono, que testa o jogo horas seguidas. |
| **Soft-cap** | O ganho encolhe, mas nunca zera. | **Médio.** Legível, porém a curva `h^-α` é difícil de explicar sem gráfico. |
| **Banco de Vigília** | Uma barra que enche sozinha enquanto você está fora, e que você *gasta* ao jogar. | **Baixo.** A mensagem é *"volte amanhã que tem mais"*, não *"pare"*. É o mesmo mecanismo do *rested XP* do WoW, que 20 anos de operação mostraram ser aceito. **[HIPÓTESE — analogia de mercado, não medição deste jogo]** |

**Mitigação obrigatória, e eu insisto nela:** o teto vale **só para o nível do legado**. Score, badges (333), loot, tiers de arma, Ghostdex, ranking de geração, batalhas ghost-vs-ghost — **nada disso é limitado**. Quem joga 16 h/dia termina com muito mais *tudo*; ele só não fura a fila do calendário. A frase para o jogador é: **"o teto é no relógio da linhagem, não na diversão."**

### 5.4 Recomendação: **Banco de Vigília, `taxa = 1 h/dia`, `teto = 30 h`, `τ = 0,10`**

Por quê:

1. **Cumpre a restrição C2 com margem:** o mais rápido (bot 24/7) leva **340 anos** — ~6 gerações. Nenhum perfil humano zera sozinho. **[CÁLCULO: `03_orcamento_sensibilidade.js`]**
2. **Preserva o gradiente de esforço:** jogar 16 h/dia é 2,5× mais rápido. Jogar mais *sempre* adianta — só que cada vez menos. É exatamente a opção (b) que o `legacy-philosopher` recomendou em `raw/01` §D4.
3. **É o único que resolve as férias, a doença e o luto sem cláusula especial.** O banco enche mesmo com o jogo fechado: o jogador some 3 semanas e, ao voltar, tem 21 h esperando por ele. Isso converte a régua de *"1 hora todo santo dia por 1.121 anos"* (impossível para qualquer ser humano) em *"365 horas por ano, quando der"*.
4. **Com `τ = 0` ele vira exatamente o teto rígido de 1 h/dia que o `security-engineer` propôs em `raw/05` §8** — mas com memória. Ou seja: **não é uma proposta concorrente, é a mesma proposta com uma melhoria**, e `τ` é o botão que decide quanto do excedente se aproveita. Se o antibot se mostrar fraco, basta baixar `τ` (até 0) e a garantia dele volta integralmente, sem tocar em mais nada.

**A ressalva honesta sobre o bot:** com `τ = 0,10`, um bot 24/7 ganha 3,3× o jogador da régua. Não é "ganha o mesmo". Se o dono quiser a garantia forte do `security-engineer` ("bot de 24 h = humano de 1 h"), o preço é `τ = 0`, e aí jogar mais não adianta nada. **Está no item (e) como decisão D2.**

---

## §6 — SENSIBILIDADE

### 6.1 Data de início: **quase não importa** **[CÁLCULO: `03_orcamento_sensibilidade.js`]**

| Início | → 3147-01-01 | → 3147-07-02 | → 3147-12-31 | Amplitude |
|---|---|---|---|---|
| 2026-09-20 (hoje) | 409.174 | 409.356 | 409.538 | 0,089% |
| 2027-01-01 (lançamento oficial) | 409.071 | 409.253 | 409.435 | 0,089% |
| 2030-01-01 ("Era Zero" futura) | 407.975 | 408.157 | 408.339 | 0,089% |
| 2036-09-20 (+10 anos) | 405.521 | 405.703 | 405.885 | 0,090% |

**Amplitude de TODAS as combinações: 405.521 a 409.538 h = 4.017 h = 0,98% do horizonte.**

**Conclusão prática, e é libertadora:** atrasar o lançamento do conceito em **dez anos** muda o alvo em menos de 1%. **O dono não precisa decidir a data de início com pressa nem com precisão.** Qualquer data entre hoje e 2036 está dentro de 1% da mesma calibração. A `data_de_início` deve ser um **parâmetro de configuração do servidor**, gravado uma vez na "Era Zero", e pronto.

### 6.2 3147-01-01 vs 3147-12-31: **também quase não importa — e é aí que mora a armadilha**

A janela do ano 3147 tem 364 dias = **0,0889% do horizonte**. Para o jogador *cair dentro do ano*, a calibração precisaria de exatidão melhor que **0,09%** ao longo de 1.121 anos. Isso é impossível de garantir só com a curva: qualquer variação de comportamento humano (§6.3) é uma ou duas ordens de grandeza maior que isso.

**Por isso a recomendação é calibrar para o MEIO de 3147 (409.356 h) e adicionar uma TRAVA DE CALENDÁRIO na última Era:** o nível 1e11 **não pode ser cruzado antes de 3147-01-01**. Quem chegar cedo estaciona em 99,99…% e espera — o que, narrativamente, é uma cerimônia de um ano, não um castigo. **Sem a trava, a promessa "no ano de 3147" não é verificável; com ela, é uma garantia.**

Efeito medido **[CÁLCULO: `05_montecarlo.js`]**:

| Arquétipo | % que zera durante 3147, **com** trava |
|---|---|
| 3 h/dia (q=10%) | **100,0%** |
| 8 h/dia (q=5%) | **100,0%** |
| 16 h/dia (q=2%) | **100,0%** |
| bot 24/7 | **100,0%** |
| Só fim de semana | **100,0%** |
| Disciplinado com reposição | **98,4%** |

A trava resolve os que chegam **cedo**. Os que chegam **tarde** (régua com 10% de faltas: mediana 3234) são outro problema — o do §6.3.

### 6.3 Dias perdidos: o achado mais desconfortável do relatório

**[CÁLCULO: `03_orcamento_sensibilidade.js` e `05_montecarlo.js`]**

| q (prob. de não jogar no dia) | Sem banco (anos) | Com banco, jogando **só 1 h** nos dias em que joga | Com banco, **repondo 2 h** ao voltar |
|---|---|---|---|
| 0,00 | 1.121 | 1.121 | 1.019 |
| 0,10 | 1.246 | 1.245 | 1.038 |
| **0,20** | **1.402** | **1.402** | **1.058** |
| 0,30 | 1.602 | 1.601 | 1.078 |
| 0,50 | 2.243 | 2.242 | 1.139 |

**Leia com atenção: o banco NÃO ajuda quem falta e, ao voltar, joga só 1 hora.** O banco é uma *oportunidade* de repor, não uma reposição automática. Quem nunca joga mais de 1 h/dia perde os dias faltados para sempre. Com q=20%, ele chega **281 anos atrasado**.

Isso aparece cru no Monte Carlo **[CÁLCULO: `05_montecarlo.js`, 1.000 réplicas por arquétipo]**:

| Arquétipo | Mediana | P10 | P90 | % em 3147 (com trava) |
|---|---|---|---|---|
| **régua 1 h/dia, q=10%** | **3234,3** | 3233,3 | 3235,3 | **0,0%** |
| casual 0,5 h/dia, q=25% | 4839,1 | 4836,6 | 4841,8 | 0,0% |
| **disciplinado c/ reposição** | **3148,0** | 3148,0 | 3148,0 | **98,4%** |
| 3 h/dia, q=10% | 2978,1 | 2977,9 | 2978,3 | 100,0% |
| 16 h/dia, q=2% | 2477,8 | 2477,6 | 2478,0 | 100,0% |
| bot 24/7 | 2366,5 | 2366,5 | 2366,5 | 100,0% |
| hiato de 5 anos aos 20 | 3277,7 | 3276,8 | 3278,5 | 0,0% |
| cadeia geracional | 3335,1 | 3267,7 | 3417,4 | 0,0% |

O arquétipo **"régua literal com 10% de faltas" chega 87 anos atrasado**. O único que acerta o alvo é o **"disciplinado com reposição"** — aquele que, ao voltar de uma ausência, joga até esvaziar o banco.

**Duas saídas, e elas não são exclusivas:**

1. **Redefinir a régua como MÉDIA** (recomendo): a promessa passa a ser *"365 horas de referência por ano"*, e o Banco de Vigília é o instrumento que torna isso possível. A UI mostra o banco cheio e diz "você tem 14 h guardadas".
2. **Calibrar com margem de presença** (recomendo junto, é a prática atuarial padrão): em vez de exigir `T = 409.538` h, exigir `m·T`. Resultado analítico exato: **com margem `m`, qualquer jogador cuja taxa de longo prazo seja ≥ `m` horas creditadas/dia chega até 3147** — e a trava de calendário segura quem chegar antes.

Confirmado por Monte Carlo (1.000 réplicas por linha) **[CÁLCULO: `07_margem.js`]**:

| `m` | `T` exigido | Arquétipo | Mediana | % que zera em 3147 (com trava) |
|---|---|---|---|---|
| 1,00 | 409.538 | régua q=0% (presença perfeita) | 3148,0 | **100,0%** |
| 1,00 | 409.538 | régua q=10% | 3234,3 | 0,0% ❌ |
| 1,00 | 409.538 | régua q=20% | 3385,3 | 0,0% ❌ |
| 0,95 | 389.061 | régua q=10% | 3173,9 | 0,0% ❌ |
| **0,90** | **368.584** | **régua q=10%** | **3113,6** | **100,0%** ✅ |
| 0,90 | 368.584 | régua q=0% | 3035,9 | 100,0% ✅ (retido pela trava) |
| 0,90 | 368.584 | régua q=20% | 3249,4 | 0,0% ❌ |

Custo de `m = 0,90`: exigir 368.584 h em vez de 409.538 — ou seja, **o jogo fica 10% "mais fácil" no papel para comprar robustez contra a vida real**. Recomendo. É exatamente o que uma seguradora faz ao precificar uma obrigação de longo prazo: você não precifica a média, precifica a média com reserva.

**Como a margem entra na fórmula:** basta trocar `T` por `T_req = m·T` na Família B. A forma da curva não muda; ela só fica 10% "mais curta". Efeito medido **[CÁLCULO: `08_margem_curva.js`]**:

| Marco | Nível com `m=1,00` | Nível com `m=0,90` | Variação |
|---|---|---|---|
| 1 hora | 20 | 20 | 0,0% |
| 1 mês | 600 | 600 | 0,0% |
| 1 ano | 7.376 | 7.402 | +0,4% |
| 10 anos | 1,44e5 | 1,70e5 | +18,3% |
| 100 anos | 7,17e7 | 9,80e7 | +36,8% |
| 500 anos | 8,87e9 | 1,22e10 | +37,2% |
| **Fecha em** | 409.538 h | **368.584 h** | jogador impecável chega em **3035,9** e espera na trava |

O dia 1 e o primeiro mês ficam **idênticos** — a margem só se paga nos séculos finais. É o melhor dos dois mundos: a promessa ao iniciante não muda, e a promessa ao calendário fica robusta.

**Limite honesto da margem:** `m = 0,90` cobre faltas até ~10% dos dias. Quem falta 20% ainda chega atrasado (3249). Cobrir q=20% exigiria `m ≈ 0,80`, o que deixa o jogador assíduo esperando ~200 anos na trava. **A margem certa depende do `q` real, que hoje é chute** — por isso a telemetria de dias jogados está na lista de dados a autorizar (item (f)).

### 6.4 O que muda a data e o que não muda — resumo

| Entrada | Efeito na data de chegada |
|---|---|
| `a` e `g` da Família B | **ZERO** (por construção `L*(T) = 1e11`) |
| Data de início (hoje … 2036) | **< 1%** |
| Jan-1 vs Dez-31 de 3147 | 0,089% |
| **Definição da hora (45 vs 90 min)** | **−25% a +50%** ⚠️ |
| **Probabilidade de faltar (q)** | **+11% a +100%** ⚠️ |
| **Mecanismo de orçamento / `τ`** | **até −70% para quem joga muito** ⚠️ |
| `XP_EXPONENT` (sistema **atual**) | **±300%** ⚠️⚠️ — motivo pelo qual ele não serve de base |

**Constantes que TÊM que ser configuráveis no servidor** (não hardcoded, não no cliente):
`T_alvo`, `data_de_início`, `a`, `g`, `banco_taxa`, `banco_teto`, `τ`, `limiar_de_ociosidade`, `margem_m`, `curve_version`, `data_de_abertura_da_última_Era`.

---

## §7 — PRECISÃO NUMÉRICA

### 7.1 Onde o float64 quebra

`Number.MAX_SAFE_INTEGER` = **9.007.199.254.740.991** (≈ 9,007e15). Acima disso o JavaScript arredonda sem avisar: `9007199254740992 + 1 === 9007199254740992` é **true** **[CÁLCULO: `04_precisao.js`]**.

| Grandeza | Fórmula | Valor em L=1e11 | Cruza 2^53 em L = |
|---|---|---|---|
| `level` | L | 1,0000e11 | **nunca** ✅ |
| `xpRequired` | 100·L^1,45 | 8,9125e17 | **4,21e9** ⚠️ |
| **XP acumulado (escada)** | Σ 100·k^1,45 | **3,6378e28** | **7,16e5** ⚠️⚠️ |
| `pointsToDistribute` | 5/nível | 5,0000e11 | nunca ✅ |
| atributo único | 5/nível | 5,0000e11 | nunca ✅ |
| HP de inimigo (skull, fase 32) | 33·L^1,90·2,55 | 6,6843e22 | 2,42e7 ⚠️ |
| XP por kill | 5·maxHp | 3,3421e23 | 1,04e7 ⚠️ |
| `weapon.damage` tier 0 | 10·L^1,85 | 2,2387e21 | 1,21e8 ⚠️ |
| `weapon.damage` tier 60 | 10·L^1,85·1,12^60 | 2,0095e24 | 3,07e6 ⚠️ |
| score acumulado (se por nível) | ~133·L^1,5 | 4,2164e18 | 1,66e9 ⚠️ |
| **segundos ativos (relógio)** | 3600·409.538 | **1,4743e9** | **nunca** ✅ |

Repare na última linha: **o contador de tempo é a única grandeza da régua inteira que nunca chega perto do limite.** É mais um argumento a favor de derivar o nível dele.

### 7.2 Os tetos declarados hoje vs. o que a régua exige — **três estouram**

**[CÁLCULO: `04_precisao.js`; VERIFICADO: `server/db.js:466-480`]**

| Campo | Teto atual | Exigido pela régua | Veredito |
|---|---|---|---|
| `level` | 1,00e11 | 1,0000e11 | ✅ OK (no limite exato) |
| `xp` | 1,00e19 | **3,6378e28** | ❌ **ESTOURA 3,6e9×** |
| `xpRequired` | 1,00e19 | 8,9125e17 | ✅ OK |
| `pointsToDistribute` | 1,00e13 | 5,0000e11 | ✅ OK |
| `vit`/`agi`/`int`/`pow`/`mag` | 1,00e13 | 5,0000e11 | ✅ OK |
| `score` | 1,00e16 | **4,2164e18** | ❌ **ESTOURA 422×** |
| **`time`** | **1,00e8** | **1,4743e9** | ❌ **ESTOURA 14,7×** |
| `deaths` / `worldLevel` | 1e6 / 999 | 1e6 / 999 | ✅ OK |

**E o modo de falha é o pior possível.** O próprio comentário de `db.js:425-429` avisa: um campo "implausível" é **deletado** da carga, e o `COALESCE` do `saveCharacters` **preserva o valor antigo do banco**. Não há erro, não há log para o jogador. **É progresso congelando em silêncio** — a mesma classe de bug que o projeto já pagou caro para corrigir uma vez (CLAUDE.md §3 / `SAVE_SYSTEM_MASTER_PLAN.md`).

O caso de `time` é o mais urgente **porque acontece antes do fim**: o teto de 1e8 s corresponde a **3,17 anos de jogo acumulado**. Um jogador dedicado atinge isso em décadas, não em séculos.

### 7.3 Absorção: por que NÃO se deve acumular XP num float por 1.100 anos

O **ULP** (menor incremento que ainda muda o número) cresce com a magnitude **[CÁLCULO: `04_precisao.js`]**:

| Magnitude do acumulador | ULP |
|---|---|
| 1,00e6 | 1,16e-10 |
| 1,00e12 | 1,22e-4 |
| 1,00e16 | 2,00 |
| 1,00e20 | 1,64e4 |
| 1,00e24 | 1,34e8 |
| **3,64e28** (escada até 1e11) | **4,40e12** |

Demonstração literal, rodada:

```
3,64e28 + 1e3   → NÃO muda o valor (ganho perdido por completo)
3,64e28 + 1e9   → NÃO muda o valor
3,64e28 + 1e12  → NÃO muda o valor
3,64e28 + 1e13  → muda
```

Ou seja: **com o acumulador em 3,64e28, qualquer kill que valha menos de ~4,4 trilhões de XP soma exatamente zero.** O jogador mata, a barra não anda, e nenhum erro aparece em lugar nenhum.

### 7.4 Erro acumulado em 409.538 passos

Rodei os três jeitos de somar 409.538 incrementos, com referência exata em `BigInt` **[CÁLCULO: `04_precisao.js`]**:

| Método | Erro relativo |
|---|---|
| Soma ingênua (`x += dx`) | 1,82e-15 |
| Soma de Kahan (compensada) | **0,00** |
| Cota teórica do pior caso (`n·2^-53`) | 4,55e-11 |

Traduzido para níveis: no pior caso teórico, **4,55 níveis de erro em 1e11** — irrelevante.

**A conclusão é contraintuitiva e importante:** *o perigo dos 1.100 anos não é a deriva do arredondamento — é a absorção do §7.3.* Somar devagar não estraga nada; somar em cima de um número gigante apaga a parcela pequena por inteiro.

**Solução estrutural (e é a mesma recomendação do §4.0):** guardar **`credited_seconds` como contador inteiro BIGINT** e derivar o nível por **função pura**. Assim não existe acumulador de XP de longo prazo, não existe deriva, não existe absorção, e o estado é **reproduzível**: qualquer auditor recalcula o nível a partir dos segundos e tem que chegar ao mesmo número.

### 7.5 Exibição — `formatBigNumber` quebra acima de 1e21

**[VERIFICADO: `rpg_system.js:28-55`]** — a maior unidade é `Qi` (1e18). Resultado real **[CÁLCULO: `04_precisao.js`]**:

| Valor | `formatBigNumber` devolve |
|---|---|
| 1,0000e11 | `"100B"` ✅ |
| 8,9100e17 | `"891Qa"` ✅ |
| 2,2400e21 | `"2240Qi"` ⚠️ |
| 2,0100e24 | `"2010000Qi"` ❌ |
| 6,6800e22 | `"66800Qi"` ❌ |
| 3,6400e28 | `"36400000000Qi"` ❌ |

Faltam `Sx` (1e21), `Sp` (1e24), `Oc` (1e27), `No` (1e30), `Dc` (1e33) — ou notação de ordem de grandeza. **Correção de ~6 linhas, sem tocar em lógica de jogo**, e precisa ser espelhada em `danger_ghost_mobile/www/js/` (CLAUDE.md §3).

### 7.6 Datas e o ano 2038, por camada

**[CÁLCULO: `04_precisao.js`]**

| Camada | Limite | 3147? |
|---|---|---|
| Unix time de **32 bits** | **2038-01-19T03:14:07Z** | ❌ **quebra** |
| JS `Date` (float64 em ms) | ano 275.760 | ✅ (`Date.UTC(3147,11,31)` = 37.173.945.600.000 ms, exato) |
| Postgres `timestamptz` | 294.276 AD | ✅ |
| Postgres `INTEGER` (32 bits) | 2.147.483.647 | ⚠️ segundos **ativos** da régua = 1.474.336.800 (cabe com 1,46× de folga); segundos de **calendário** em 1.121 anos = 3,54e10 → **estoura** |
| Android/Capacitor | `long` 64 bits; SQLite INTEGER 64 bits | ✅ |

**Bloqueante já identificado e confirmado:** `level BIGINT` está no `CREATE TABLE`, mas **só vale para banco novo**; o banco de produção continua `INTEGER` até alguém rodar `server/migrate_level_bigint.js` à mão **[VERIFICADO: `db.js:56-63`, `:136-152`]**. `INTEGER` estoura em 2,15e9 e o teto é 1e11 — **46× acima**. Sem essa migração, o conceito não sai do papel.

### 7.7 O que precisa mudar e o que já aguenta

| Item | Situação | Ação |
|---|---|---|
| `level` BIGINT no banco **novo** | ✅ já está | — |
| `level` BIGINT em **produção** | ❌ ainda INTEGER | **rodar `migrate_level_bigint.js`** (decisão do dono, CLAUDE.md §7) |
| `types.setTypeParser(20, Number)` | ✅ seguro **hoje** (máximo 5e11 « 9e15) | **manter**, e registrar parser dedicado se surgir coluna que passe de 2^53 (`db.js:15-21` já avisa) |
| `credited_seconds` | ❌ não existe | **criar BIGINT** (nunca INTEGER — ver §7.6) |
| `NUMERIC_BOUNDS.time` | ❌ teto 1e8 | **subir para ≥ 5e9** ou separar o relógio do legado do `time` de sessão |
| `NUMERIC_BOUNDS.xp` | ❌ teto 1e19 | irrelevante se o XP virar barra derivada; **caso contrário, subir para 1e30** |
| `NUMERIC_BOUNDS.score` | ❌ teto 1e16 | **subir para 1e20** ou desacoplar score do nível (§8.2) |
| `weapon.damage` (JSONB) | ⚠️ 2,0e24 perde exatidão | aceitável **se** os dois lados serializarem o mesmo float64; some de vez com o "nível de combate" (§8.3) |
| `formatBigNumber` | ❌ para em `Qi` | **adicionar 5 sufixos** (web **e** mobile) |
| `cumulativeXpToLevel`/`levelFromCumulativeXp` | ✅ ida-e-volta 0/60 falhas | manter como estão se o XP virar derivado |

---

## §8 — IMPACTO NOS DEMAIS SISTEMAS E MIGRAÇÃO

### 8.1 O que acontece com HP e dano em 1e11 **[CÁLCULO: `06_sistemas_derivados.js`]**

| Nível | HP (skull, fase 32) | Dano tier 0 | Golpes p/ matar | Dano tier 60 | Golpes tier 60 |
|---|---|---|---|---|---|
| 1 | 8,415e1 | 1,000e1 | 8,41 | 8,976e3 | 9,4e-3 |
| 100 | 5,310e5 | 5,012e4 | 10,59 | 4,499e7 | 1,2e-2 |
| 1e6 | 2,114e13 | 1,259e12 | 16,79 | 1,130e15 | 1,9e-2 |
| 1e9 | ~2,1e18 | ~1,3e17 | ~23,7 | — | — |
| **1e11** | **6,684e22** | **2,239e21** | **29,86** | 2,010e24 | 3,3e-2 |

Dois achados:

1. **O combate fica 3,55× mais longo ao longo dos 1.121 anos** (de 8,4 para 29,9 golpes), porque o HP escala `L^1,90` e o dano `L^1,85` — a diferença de 0,05 no expoente vira `L^0,05`. É lento e monotônico, mas é uma deriva de dificuldade que ninguém decidiu.
2. **O tier da arma domina tudo.** `1,12^60 = 897,6×`. No tier 60 o jogador mata em **0,033 golpes** (one-shot) em qualquer nível. **A alavanca real de balanceamento não é o expoente do nível, é o tier** — e isso é assunto do `game-designer`, não meu; eu só entrego a medição.

### 8.2 Score e pontos de atributo — os dois que quebram de verdade

**Score.** `ScoreGrant(L) = max(1, floor(200·√L))` **[VERIFICADO: `rpg_system.js:1113`]**. Se fosse concedido **por nível**, o acumulado até 1e11 seria **4,2164e18** — **422× acima** do teto `NUMERIC_BOUNDS.score` (1e16) e acima de 2^53.

Mas há um detalhe que ninguém decidiu e que hoje é acidente: `triggerLevelUpEffect()` é chamado **uma vez por chamada de `addXp()`**, não uma vez por nível **[VERIFICADO: `rpg_system.js:1068`]**. Com o salto em forma fechada, **um salto de 1.000 níveis concede o score de UM level-up**. Ou seja, o score já está de fato atrelado ao número de *kills*, não de níveis — **efeito colateral de uma otimização de performance, não decisão de economia**. Precisa virar decisão explícita (é do `game-economy-designer`; eu sinalizo).

**Pontos de atributo.** 5 por nível × 1e11 = **5e11 pontos**. Cabe no teto e em float64, mas é absurdo de UX (o `allocateAttributeBulk` de `rpg_system.js:1086` já é a gambiarra que admite isso). Alternativas medidas **[CÁLCULO: `06_sistemas_derivados.js`]**:

| Regra | Total de pontos na régua inteira |
|---|---|
| 5 por nível (hoje) | 5,0000e11 |
| **5 por hora de referência** ⭐ | **2,0477e6** |
| 5 por Marco (100 h) | 2,0477e4 |
| 5 por nível de combate (log) | 5,5000e3 |

Recomendo **5 por hora de referência**: dá ~2 milhões de pontos em 1.121 anos, mantém "cada hora jogada te deixa mais forte" e nunca chega perto de nenhum teto.

### 8.3 Proposta para manter significado: o **"Nível de Combate"** logarítmico

O problema de fundo é que um único número (o nível) faz **dois** trabalhos incompatíveis: ser o odômetro de 1.100 anos **e** alimentar as fórmulas de combate. Separe-os:

```
NC = max(1, floor(100 · log10(1 + L)))       // "nível de combate" / poder
```

As fórmulas de HP, dano e score **não mudam uma vírgula** — muda só o `L` que entra nelas:

| Nível do legado | NC | HP (skull f32) | Dano tier 0 | Golpes | Dano tier 60 |
|---|---|---|---|---|---|
| 1 | 30 | 5,390e4 | 5,404e3 | 9,97 | 4,850e6 |
| 10 | 104 | 5,720e5 | 5,389e4 | 10,61 | 4,837e7 |
| 1e3 | 300 | 4,281e6 | 3,825e5 | 11,19 | 3,434e8 |
| 1e6 | 600 | 1,598e7 | 1,379e6 | 11,59 | 1,238e9 |
| 1e9 | 900 | 3,452e7 | 2,920e6 | 11,82 | 2,621e9 |
| **1e11** | **1.100** | **5,055e7** | **4,232e6** | **11,94** | **3,799e9** |

**[CÁLCULO: `06_sistemas_derivados.js`]**

- **Todos** os valores cabem com folga em float64 **exato** — e até em `INTEGER` de 32 bits. Maior valor gerado em toda a régua: **3,80e9**, com **2,37e6× de folga** até 2^53.
- Os golpes para matar ficam entre 9,97 e 11,94 — **o combate para de derivar em dificuldade**.
- `weapon.damage` nunca passa de ~3,8e9, então o problema de precisão do JSONB **desaparece**.
- Custo: o jogador vê dois números — `Nível do Legado 12.345.678.901` (o odômetro, a herança) e `Poder de Combate 1.091` (a luta). Isso é, aliás, exatamente o que o §8 do brief pediu: *"o número do nível é um contador; a experiência mora em outra unidade"*.

### 8.4 Migração das ~48 contas / ~139 personagens

**Opção A — Preservar nível.** Credita ao jogador as horas que a nova curva exigiria para o nível que ele tem. Invertendo a Família B (a=20, g=3) **[CÁLCULO: `06_sistemas_derivados.js`]**:

| Nível hoje | Horas creditadas | Equivale a | % da régua |
|---|---|---|---|
| 1 | 0,05 | 3 min | 1,2e-5 |
| 10 | 0,50 | 30 min | 1,2e-4 |
| 100 | 5,00 | 5 dias | 1,2e-3 |
| 300 | 15,00 | 15 dias | 3,7e-3 |
| 1.000 | 49,99 | 50 dias | 1,2e-2 |
| 10.000 | 491,36 | 1,35 anos | 1,2e-1 |
| 100.000 | 3.011,69 | 8,25 anos | **0,735%** |

**Conclusão numérica forte:** mesmo um personagem de nível 100.000 sairia na frente em **menos de 0,74% do horizonte**. **Preservar nível é matematicamente inofensivo.** O problema de preservar não é a data — é justiça narrativa (há contas de teste antigas com níveis inflados, brief §3).

**Opção B — Preservar tempo investido.** Seria a mais justa em espírito, mas depende da coluna `time`, que (a) tem teto de 1e8 s, (b) nunca foi auditada, e (c) provavelmente mede sessão e não vida do personagem. **Dado de produção que eu NÃO consultei.** Consulta que o dono precisa autorizar (somente leitura, agregada, sem dado pessoal):

```sql
SELECT count(*) AS personagens,
       min(level) AS menor, max(level) AS maior,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY level) AS mediana_level,
       sum(time) AS segundos_totais, max(time) AS maior_time
  FROM characters;
```

**Opção C — "Era Zero".** Todos começam em 0 h creditadas na data de adoção; o nível antigo vira título honorífico ("Pioneiro — nível N") e uma entrada na Crônica. Custo matemático: **zero**. Compensação sugerida: creditar `min(horas_equivalentes, 30 h)` no Banco de Vigília — no máximo **0,0073% da régua**, simbólico e inofensivo.

**Recomendo C (Era Zero) com o selo de Pioneiro + o bônus simbólico de banco.** Isso coincide com a recomendação independente do `backend-architect` em `raw/09` §4.1 — e o argumento dele (a única opção que não depende de um dado que o banco nunca guardou, e cuja reversão é só voltar o código) é o melhor argumento dos três.

---

## §9 — PLANO DE VALIDAÇÃO: O HARNESS DE SIMULAÇÃO

### 9.1 Por que ele tem que existir ANTES do lançamento

Porque a calibração é uma **promessa de 1.121 anos** e não existe teste de produção possível. O único jeito de saber que a curva fecha é simular. E o único jeito de a simulação valer alguma coisa é ela ser **reprodutível**: mesma semente ⇒ mesmos números, para qualquer pessoa, em qualquer ano.

### 9.2 Especificação

**Entradas (todas em arquivo de configuração, nunca hardcoded):**
`data_de_início`, `T_alvo`, `margem_m`, `a`, `g` (ou tabela de Eras), `banco_taxa`, `banco_teto`, `τ`, `limiar_de_ociosidade`, `semente`, `n_réplicas`, `passo` (dia|minuto).

**Arquétipos obrigatórios** (com `q` = prob. de faltar, e variação lognormal nas horas):

| # | Arquétipo | Parâmetros |
|---|---|---|
| 1 | régua 1 h/dia | q=10%, σ=0,25 |
| 2 | casual 0,5 h/dia | q=25%, σ=0,35 |
| 3 | 3 h/dia | q=10% |
| 4 | 8 h/dia | q=5% |
| 5 | 16 h/dia | q=2% |
| 6 | bot 24/7 | q=0, sem variância |
| 7 | só fim de semana (8+8) | — |
| 8 | disciplinado com reposição | q=25%, esvazia o banco ao voltar |
| 9 | hiato de 5 anos | pausa entre os anos 20 e 25 |
| 10 | cadeia geracional | Guardiões de 25–55 anos, hiato de 0–3 anos entre eles |

**Métricas de saída por arquétipo:** mediana, P10, P90 do ano de chegada; % antes de 3147; % **durante** 3147; % depois; razão mais-rápido/régua; nível em 1 dia / 1 ano / 10 / 100 / 500 anos.

**Critérios de aceite (a calibração só é "pronta" se TODOS passarem):**

| # | Critério | Alvo |
|---|---|---|
| 1 | Mediana da régua cai dentro de 3147 (modelo médio **e** P50 do Monte Carlo) | obrigatório |
| 2 | Com trava de calendário, ≥ 95% dos arquétipos 1, 3–8 zeram durante 3147 | obrigatório |
| 3 | Nenhum arquétipo humano zera em < 150 anos | obrigatório |
| 4 | Bot 24/7 no máximo **N×** a régua (N aprovado pelo dono — recomendo 3,5) | obrigatório |
| 5 | Erro de discretização (passo-dia vs passo-minuto) < 0,1% do horizonte | obrigatório |
| 6 | Ida-e-volta `cum`/`inversa` passa em 100% da grade log + bordas | obrigatório |
| 7 | Nenhuma grandeza ultrapassa seu teto declarado em nenhum ponto da trajetória | obrigatório |
| 8 | Tabela de sensibilidade gerada, e as 2 entradas mais sensíveis são configuráveis | obrigatório |
| 9 | Tabela de nível em 1 h / 1 dia / 1 semana / 1 mês / 1 ano publicada (sensação do dia 1) | obrigatório |
| 10 | Caminho de reversão escrito ("calibramos errado, e agora?") | obrigatório |

**Tolerância de data-alvo:** com a trava de calendário, a tolerância aceitável é **assimétrica**: chegar *cedo* é aceitável até 200 anos (a trava absorve); chegar *tarde* é tolerável em **±5 anos** (0,45% do horizonte). Sem a trava, a tolerância precisaria ser ±0,5 ano = 0,045% — inatingível.

### 9.3 Protótipo rodado — a prova de que a conta fecha

Rodei o protótipo com **1.000 réplicas por arquétipo**, semente 20260920, passo diário, mecanismo Banco de Vigília (1 h/dia, teto 30 h, τ=0,10) **[CÁLCULO: `05_montecarlo.js`]**. Resultados na tabela do §6.3.

**Verificação do erro de discretização** (arquétipo 3 h/dia, 50 réplicas, passo-dia vs passo-minuto):

```
média passo-dia    = 2978,150
média passo-minuto = 2978,148
diferença = −0,003 anos = −0,0003% do horizonte  →  passo diário é suficiente
```

**Critérios de aceite nesta rodada (m = 1,00, sem margem de presença):**

| Critério | Resultado |
|---|---|
| 1. Régua com mediana dentro de 3147 | ❌ **FALHA** — mediana 3234,3 |
| 2. Régua com trava: ≥ 95% em 3147 | ❌ **FALHA** — 0,0% |
| 3. Nenhum humano zera em < 100 anos (o critério final recomendado é 150 — também passa) | ✅ PASSA — o mais rápido leva 340 anos |
| 4. Bot 24/7 ≤ 4× a régua | ✅ PASSA — 3,55× |
| 5. Erro de discretização < 0,1% | ✅ PASSA — 0,0003% |

**Os critérios 1 e 2 falharem é o resultado mais valioso deste relatório.** Não é bug do harness: é o harness cumprindo a função dele, **descobrindo antes do lançamento** que a régua literal ("1 hora por dia") não sobrevive a 10% de faltas — e que a correção (margem de presença `m ≈ 0,90`, §6.3) tem que entrar **na calibração**, não numa desculpa depois. É por isso que este harness precisa existir antes de qualquer release: um erro de premissa aqui custa séculos, e só aparece em simulação.

---

## (c) LACUNAS QUE EU FECHEI

1. **Lacuna 2 (calibração matemática)** — fechada: definição da hora de referência (§3), três famílias com parâmetros calibrados numericamente (§4), orçamento diário com mecanismo recomendado e números por arquétipo (§5), sensibilidade completa (§6), comparação com o sistema atual (§1).
2. **Lacuna 3 (precisão numérica e limites por 1.100 anos)** — fechada: §7, com os três tetos que estouram, o ponto exato de quebra de cada grandeza, a medição da absorção, o erro em 409.538 passos e os limites de data por camada.
3. **Metade de simulação da lacuna 11** — fechada: §9, com especificação do harness, critérios de aceite e protótipo rodado (e dois critérios reprovando, com o diagnóstico).
4. **Confirmação/correção do §8 do brief** — §2.3: o número está certo (244.177,59), a leitura precisa de ressalva (média ≠ hora real), e a conclusão de fundo está provada aritmeticamente.
5. **Parte numérica da lacuna 9 (migração)** — §8.4: preservar nível custa ≤0,74% do horizonte; "Era Zero" custa zero.
6. **Parte numérica da lacuna 10 (sistemas escalonados)** — §8.1–8.3, incluindo a proposta do Nível de Combate que mantém todas as fórmulas existentes funcionando.

---

## (d) LACUNAS QUE DEPENDEM DE OUTROS DEPARTAMENTOS

| O que falta | De quem | Por quê |
|---|---|---|
| Limiar de ociosidade, janela de heartbeat, regra de sessão única, detecção de bot | **`security-engineer`** | Eu defini a *unidade* (§3); ele define como ela é medida sem ser forjada. O valor de `τ` (§5.4) depende diretamente da força do antibot dele. |
| `credited_seconds BIGINT`, `curve_version`, ledger selado por dia, migração `migrate_level_bigint.js` | **`backend-architect`** | §4.5 e §7.7 só funcionam com esse esquema. Ele já desenhou compatível em `raw/09`. |
| Narrativa para a concentração de 91% do contador nos últimos 621 anos | **`legacy-philosopher`** + **`legacy-systems-designer`** | É consequência inescapável de qualquer curva crescente (§4.2). A matemática não resolve; o significado, sim. |
| Nomes e cerimônias de Vigília / Marco / Grau / Era; o que acontece no ano de espera da trava de calendário | **`legacy-systems-designer`** | Eu entreguei a grade temporal (§4.6); ele entrega o ritual. |
| Decidir se score é por nível, por kill ou por Marco; recalibrar o tier da arma (`1,12^tier` domina tudo) | **`game-economy-designer`** + **`game-designer`** | §8.1–8.2. Hoje o score é por chamada de `addXp()` por acidente de otimização. |
| Sufixos de `formatBigNumber` e a UI de dois números (Legado + Poder de Combate) | **`ui-ux-designer`** + **`gameplay-engineer`** | §7.5 e §8.3. Precisa ser espelhado no mobile (CLAUDE.md §3). |
| Distribuição real de níveis das ~48 contas/139 personagens | **dono** (autorização) | §8.4, opção B. Consulta pronta, não executada. |
| Redação dos Termos sobre "1 hora por dia é média, não obrigação" | **`digital-succession-counsel`** | §6.3 muda a promessa pública. |

---

## (e) DECISÕES PARA O DONO

### D1 — Qual família de curva?

| | **A — Odômetro** | **B — Polinomial** ⭐ | **C — Eras** |
|---|---|---|---|
| Nível no dia 1 | 244.178 | **20** | 20 |
| Nível no ano 1 | 8,92e7 | **7.376** | 4,31e4 |
| Prós | simplicidade absoluta; variância zero | dia 1 humano; aceleração sentida; 2 botões óbvios; data invariante | controle total; bordas = cerimônia; imune a exploit |
| Contras | contador sem graça; RPG some na 1ª hora | 91% do contador nos últimos 621 anos | degraus bruscos (6,3× de um dia p/ outro); Guardião não vê troca de Era |

> **Recomendo B**, com `a = 20` e `g = 3`, **usando os nomes de Era da Família C como camada de apresentação** (§4.6). Você fica com a suavidade matemática de B e a cerimônia de C, sem os degraus de C.

### D2 — Quanto o jogador dedicado pode adiantar? (o valor de `τ`)

| | **τ = 0** | **τ = 0,05** | **τ = 0,10** ⭐ | **τ = 0,20** |
|---|---|---|---|---|
| 16 h/dia | 1.121 anos | 641 | **449** | 280 |
| bot 24/7 | 1.121 anos | 522 | **340** | 200 |
| Razão bot/régua | 1,00× | 2,15× | **3,30×** | 5,61× |
| Antibot necessário | nenhum | fraco | médio | forte |

> **Recomendo `τ = 0,10`.** Jogar mais sempre adianta (até 3,3×), ninguém zera sozinho (mínimo 340 anos ≈ 6 gerações), e o jogador da régua não é afetado por `τ` nenhum. **Se o `security-engineer` disser que o antibot não fica pronto a tempo, comece em `τ = 0,05` e suba depois** — subir `τ` é generosidade, baixar é punição retroativa.

### D3 — A régua é "1 hora todo dia" ou "365 horas por ano"?

| | **A — Literal** (1 h/dia, sem margem) | **B — Média com margem `m = 0,90`** ⭐ |
|---|---|---|
| Exigência | 409.538 h | 368.584 h |
| Jogador com 10% de faltas | chega em **3234** (87 anos tarde) | chega **em 3147** ✅ |
| Jogador impecável | 3147 | chega cedo, **a trava segura** |
| Honestidade da promessa | "todo santo dia por 1.121 anos" — ninguém cumpre | "365 horas por ano, quando der" |

> **Recomendo B.** É a prática atuarial padrão (precificar com reserva, não com a média) e é a única versão da promessa que um ser humano de verdade consegue cumprir. Combine com o Banco de Vigília (§5.4) e com a trava de calendário (§6.2). **Sem isso, o Monte Carlo reprova a calibração** (§9.3).

### D4 — O que fazer com os ~139 personagens atuais?

| | **A — Preservar nível** | **B — Preservar tempo** | **C — Era Zero** ⭐ |
|---|---|---|---|
| Custo na data-alvo | ≤ 0,74% | desconhecido | **0** |
| Depende de dado que existe? | sim | **não** (`time` não é confiável) | sim |
| Contas de teste antigas | herdam vantagem | idem | **zeradas** |
| Reversão | média | difícil | **só voltar o código** |

> **Recomendo C — "Era Zero"**, com Selo de Pioneiro registrado na Crônica e 30 h simbólicas no Banco de Vigília (0,0073% da régua). Coincide com a recomendação independente do `backend-architect` (`raw/09` §4.1).

### D5 — O nível gigante entra nas fórmulas de combate?

| | **A — Sim (como hoje)** | **B — Nível de Combate logarítmico** ⭐ |
|---|---|---|
| HP máximo | 6,68e22 | **5,06e7** |
| Dano máximo (tier 60) | 2,01e24 | **3,80e9** |
| Passa de 2^53? | sim, muito | **nunca** (2,4e6× de folga) |
| Deriva de dificuldade | 3,55× ao longo da régua | **praticamente nula** |
| Custo | — | dois números na HUD |

> **Recomendo B.** É a tradução mecânica do insight do §8 do brief: o odômetro conta a herança, o Poder de Combate governa a luta. Mantém **todas** as fórmulas atuais (1,90 / 1,85 / 0,5) funcionando sem alteração.

---

## (f) RISCOS E O QUE EU NÃO CONSEGUI VERIFICAR

### Riscos

1. **`τ = 0,10` dá 3,3× ao bot.** Se o antibot falhar, a régua vira decorativa para quem automatiza. Mitigação: `τ` configurável no servidor, com procedimento de baixar sem retro-punir (a redução vale só daí para frente).
2. **A concentração no fim é irreversível.** Qualquer curva que faça o dia 1 ser humano joga o grosso do contador para os últimos séculos. Se o dono achar isso injusto com os fundadores, a alternativa é a Família A — e aí o dia 1 vira nível 244.178. **Não existe curva que evite os dois.**
3. **Trocar a curva depois de lançada é caro.** Com `curve_version` + eras seladas (§4.5) é possível; sem isso, é destruir a história de todo mundo. Esse esquema tem que entrar **antes** do primeiro jogador.
4. **`level` ainda é INTEGER em produção.** Enquanto `migrate_level_bigint.js` não rodar, o teto real é 2,15e9 e não 1e11 — **46× abaixo do conceito**. É bloqueante e é decisão do dono (CLAUDE.md §7).
5. **`NUMERIC_BOUNDS.time` (teto 1e8 s = 3,17 anos de jogo) congela o save em silêncio** quando estourar — e estoura em décadas, não em séculos.
6. **Falta de dados reais de ritmo de jogo.** Todo o §1.3 é faixa declarada, não medição. Se o ritmo real for o otimista, o sistema atual está 101× rápido; se for o pessimista, está 20% *lento*. **Só telemetria resolve, e isso é um pedido ao dono.**
7. **O modelo de faltas (`q`) é chute.** Usei 10–25% por analogia com jogos diários. Não medi nada deste jogo. Se `q` real for 40%, a margem `m = 0,90` é insuficiente.

### O que eu NÃO verifiquei (e por quê)

- **Distribuição real de níveis das 48 contas / 139 personagens.** Não consultei o banco de produção (proibido pelo brief §2.3). Consulta pronta em §8.4.
- **Valores reais de `time` por personagem** — mesmo motivo. Suspeito que a coluna meça sessão, não vida; não confirmei.
- **Kills por hora reais.** Não existe telemetria. Seria preciso instrumentar o cliente (e isso é mudança de código, proibida no modo PLANO).
- **Se a mesma curva se comporta igual no mobile.** Não rodei o APK. `danger_ghost_mobile/www/js/game/rpg_system.js` é uma cópia separada (CLAUDE.md §3) e **pode estar divergente** — alguém precisa conferir se as constantes batem antes de qualquer implementação.
- **`Gemini.md` e os demais docs** não foram auditados contra estes números; se a calibração for aprovada, eles ficam desatualizados na mesma hora (CLAUDE.md §7 exige atualizar no mesmo commit).

### Dados que eu preciso que o dono autorize levantar

1. Agregado de níveis e `time` dos personagens (SQL em §8.4) — **somente leitura, sem dado pessoal**.
2. Telemetria de ritmo: kills/hora, fase média jogada, duração de sessão — **exige instrumentar o cliente**, portanto só depois de sair do modo PLANO.
3. Distribuição de dias jogados por conta nos últimos 90 dias, para estimar `q` de verdade em vez de chutar.

---

*Fim do relatório 02. Scripts reproduzíveis no scratchpad da sessão; nenhum arquivo do jogo foi alterado.*
