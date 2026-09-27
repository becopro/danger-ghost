# BRIEF COMPARTILHADO — Conceito "Jogo Legado" (Danger Ghost)

Data: 2026-09-20. Solicitante: dono do jogo (dev solo). Orquestrador: MP.
**Este arquivo é a fonte da verdade do pedido. Todo agente lê ele antes de começar.**

## 1. O pedido, nas palavras do dono (verbatim, PT-BR)

> O jogo é um jogo legado... legado porque para zerar o jogo tem que alcançar o level 100000000000 e para alcançar o level 100 bilhões a mesma conta deveria jogar 1 hora por dia com o mesmo ghost até a data de 3147, por isso é legado. Ex: eu jogo o máximo que eu puder em vida e deixo minha conta para meu filho, ele joga o máximo possível e deixa a conta para seu filho e isso acontece até alguém que for detentor da conta zerar.
> Está muito fácil subir de level e deve ser do jeito desse parâmetro: se uma conta joga com o mesmo ghost todos os dias por 1 hora, essa conta consegue alcançar o level 100 bilhões no ano de 3147.
> É legado porque um jogador deixa seu legado no jogo para o próximo jogador se assim quiser!
> Faça um plano para eu ver e aprovar se eu gostar! Isso é um conceito novo para meu jogo legado! Então nesse plano deve ter a descrição de um jogo legado utilizando o que eu falei mais estruturas filosóficas já existentes para o conceito de jogo legado ficar bem estruturado, sem lacunas em aberto!
> Faça os agentes necessários com as skills certas para desenvolver esse plano que será construído.
> **Não mexa no jogo, só faça o que eu pedi!**

## 2. Restrições INEGOCIÁVEIS

1. **É só um PLANO.** Nenhum agente altera código do jogo. É PROIBIDO editar/criar/apagar qualquer coisa em: `js/`, `css/`, `index.html`, `rpg_system.js`, `server/`, `assets/`, `www/`, `android/`, `danger_ghost_mobile/` (o repo mobile inteiro), nem rodar migração, deploy, commit ou push.
2. **Só é permitido escrever** em `danger ghost/docs/legacy-plan/` (relatórios) — e, se você for o agente da Onda 0, em `danger ghost/.claude/agents/` e `danger ghost/.claude/skills/`. Scripts de simulação/cálculo descartáveis vão no diretório *scratchpad* da sessão (nunca dentro do repo do jogo).
3. **Não toque no banco de produção** nem em credenciais/variáveis de ambiente. Você pode LER código e docs para saber o que existe hoje. Se precisar de dados reais de produção (ex.: distribuição de níveis das contas), liste isso como "dado que preciso que o dono autorize levantar" em vez de consultar.
4. Trabalho de verdade: números conferidos por cálculo real (rode Node), fatos históricos/filosóficos conferidos por pesquisa (WebSearch/WebFetch se disponível) — nada de citar de memória sem sinalizar incerteza. Marque cada afirmação como **[VERIFICADO]**, **[CÁLCULO]** ou **[HIPÓTESE]**.
5. Idioma dos relatórios: **português brasileiro**, didático (o dono é programador iniciante, está aprendendo). Termos técnicos com uma explicação curta na primeira vez.
6. "Sem lacunas em aberto": todo ponto duvidoso vira uma **DECISÃO PARA O DONO** com 2–3 opções, prós/contras e uma **recomendação clara sua**. Nunca deixe "a definir".
7. Não confundir: a **DeSo** (blockchain antiga) foi removida do projeto e não volta; a **blockchain proprietária futura** (CLAUDE.md §2, pós-Episódio 2) é um item de roadmap real e separado. "DeSoHosting" é só o nome do provedor da VPS.

## 3. Fatos do projeto que você precisa saber (leia `danger ghost/CLAUDE.md` também)

- Jogo 2D RPG multiplayer, web (`danger ghost/`) + mobile Capacitor (`danger_ghost_mobile/`), produção em ghostgames.club (VPS + Node/PM2 + Postgres/Supabase). Login: e-mail + senha (bcrypt). Cross-play: mesma conta na web e no celular.
- Progressão atual (implementada nesta semana, ver `rpg_system.js`): `XPRequired(L) = 100 * L^1.45`; nível máximo por ghost = **100.000.000.000 (1e11)**; HP `baseHp * L^1.90 * fase`; dano de arma `10 * L^1.85 * 1.12^tier`; score por level-up `200 * L^0.5`; atributos `vit/agi/int/pow/mag` e `points_to_distribute` em BIGINT no Postgres; `weapon.damage` é JSONB (precisão de float acima de ~9e15 é uma limitação real). Campos numéricos com limites em `server/db.js` (`NUMERIC_BOUNDS`).
- 101 espécies de ghost (Ghostdex), todo jogador novo começa com o **Ghost #001 (Polterstalk)**. Existem 33 episódios/dungeons de história, 333 badges, sistema elemental e de categorias (preparo para batalhas ghost-vs-ghost futuras), itens raros/épicos/lendários (estilo Diablo 3), paperdoll de equipamento.
- Hoje há ~48 contas e ~139 personagens em produção (dado de auditoria recente). Existem contas de teste antigas.
- O jogador **não** precisa usar o mesmo ghost para todo o resto, mas o conceito do dono é: *o ghost do legado* (mesmo ghost, dia após dia) é a régua.

## 4. Números de referência (já calculados pelo MP — o agente de cálculo deve RECONFERIR)

- De 2026-09-20 até 31/12/3147 = **409.538 dias ≈ 1.121,28 anos**. Até 01/01/3147 = 409.174 dias. Portanto, "1 hora por dia" ⇒ **≈ 409.000 horas de jogo** para chegar ao nível 1e11 (a régua do dono).
- Maior ano representável em `Date` do JavaScript: 275760 (ok para 3147). Atenção a: problema do ano 2038 (timestamps de 32 bits), tipos de data em Postgres/SQLite/Android, `Number.MAX_SAFE_INTEGER` ≈ 9,007e15.

## 5. Interpretação do MP (a confirmar/refinar por cada especialista)

- **Régua:** um jogador de referência que joga 1 hora ativa por dia, com o mesmo ghost, começando na data de adoção do conceito, alcança o nível 1e11 durante o ano de 3147. O sistema atual é rápido demais em ordens de grandeza (a ser quantificado).
- **Legado:** a conta é passada de geração em geração (opcional: "se assim quiser"). Existe um *Guardião* (quem detém a conta agora), o histórico dos Guardiões anteriores, e o progresso é único e contínuo. Quem chegar ao nível 1e11 "zera" o jogo.
- Mais horas por dia deveriam acelerar? Se sim, quanto? (Senão um jogador de 16 h/dia zera o jogo em ~70 anos, dentro de uma vida — o que destrói o conceito.) → tema central de decisão.

## 6. Checklist de LACUNAS que o plano final precisa fechar (cada agente cobre a sua parte e aponta as dos outros)

1. Definição formal do que é "jogo legado" + princípios filosóficos + vocabulário do jogo (ex.: Guardião, Herdeiro, Crônica...).
2. Calibração matemática: "1 hora" = o quê exatamente? Curva de XP, XP por hora de referência, soft-cap/orçamento diário, data-alvo e sensibilidade (e se a data de início muda?), comparação com o sistema atual, tabelas por arquétipo (1h/dia, 3h, 8h, 16h, bot).
3. Precisão numérica e limites técnicos por 1.100+ anos (float vs BIGINT, ano 2038, contadores de horas, tamanho de dados).
4. Mecânica de sucessão: designar herdeiro, transferência segura de credenciais, conta abandonada/dormente, falecimento, disputa, recusa da herança, vários herdeiros, crônica de Guardiões, "Livro do Legado".
5. Integridade do tempo de jogo: bots/AFK/idle farming, multi-aba, web+mobile simultâneos, manipulação de relógio, multi-conta, venda de conta (RMT). Tempo tem que ser autoritativo no servidor.
6. Conteúdo e motivação por ~409.000 horas: eras/marcos, o que se faz em cada fase, sensação de progresso com 1 h/dia, eventos rituais, cadência de conteúdo de séculos, o que acontece no fim ("zerar").
7. Durabilidade 1.100+ anos: hospedagem, custódia, formatos, migração, fundo/estatuto/fundação, sucessão do *próprio operador* do jogo (dev solo!), exportação/arquivamento, papel da blockchain proprietária futura, limites honestos ("ninguém garante 1.100 anos — como se projeta para sobreviver?").
8. Jurídico/ética/privacidade (não é aconselhamento jurídico): herança digital, Termos de Uso, LGPD (direito ao esquecimento vs. crônica imutável), menores herdando, proibição de compra/venda de conta.
9. Migração das ~48 contas/139 personagens atuais e do que foi entregue nesta semana (curvas 1.45/1.90/1.85 etc.) — opções: preservar, remapear, "Era Zero".
10. Interação com sistemas existentes: pontos de atributo por nível, dano/HP em nível astronômico, score, badges, ghosts secundários (só o ghost do legado é a régua?), batalhas ghost-vs-ghost futuras, ranking por geração.
11. Riscos, testes e critérios de aceite: harness de simulação (Monte Carlo por arquétipo), como saber que a calibração está certa ANTES de lançar; plano de reversão.
12. Roadmap faseado realista para dev solo (o que entra em que ordem, o que é MVP) + lista final de DECISÕES para o dono aprovar.

## 7. Protocolo de saída

- Escreva seu relatório completo em `danger ghost/docs/legacy-plan/raw/<NN>_<seu-papel>.md` (o nome do arquivo está na sua tarefa).
- Estrutura obrigatória do relatório: (a) Resumo em 10 linhas; (b) Análise/Proposta detalhada; (c) **Lacunas que eu fechei**; (d) **Lacunas que dependem de outros departamentos** (diga qual); (e) **DECISÕES PARA O DONO** (opções + recomendação); (f) Riscos e o que eu NÃO consegui verificar.
- Sua resposta final ao orquestrador: no máximo ~250 palavras — o que descobriu de mais importante e o caminho do arquivo. Não cole o relatório inteiro na resposta.

## 8. Insight do MP (Onda 1) — o problema central, em uma conta

Chegar a 1e11 níveis em ≈ 409.538 horas significa, **em média, ~244.000 níveis por hora de jogo (~0,0147 s por nível)**. Logo, se cada nível fosse um "evento" (barra enchendo, tela de level-up), o nível 1e11 não é uma jornada de *subir de nível* — o **número do nível vira um contador gigante** (como em jogos incrementais), e a experiência humana de progresso precisa morar em OUTRA unidade (eras, patentes, marcos, capítulos, relíquias, a Crônica). Isso é verdade para QUALQUER curva que cumpra a régua; o que muda é o *formato* da curva. O plano tem que decidir explicitamente: **(a)** qual é a unidade de progresso que o jogador SENTE; **(b)** como o nível-contador se relaciona com ela; **(c)** que a curva não deixe os primeiros dias voarem por milhões de níveis nem deixe os séculos finais parados.
Também: uma curva com XP por hora *constante* + `XPRequired ∝ L^1,45` dá um jogo que passa dos primeiros ~5e8 níveis na primeira hora — o ritmo de ganho precisa ser modelado (XP/hora crescendo com o nível, ou XPRequired reescrita), não só o expoente.
Todo agente deve considerar isso ao propor sua parte (o `progression-actuary` quantifica; os demais assumem o que ele provar e sinalizam dependências).

## 9. Nova decisão do dono (2026-09-25) — XP flat no Episódio 1

Verbatim: "Os inimigos devem dar o mesmo XP que dá na fase 1 em todas as 33 fases do episódio 1. Agregue isso ao plano para eu ver e se gostar eu aprovo para os agentes fazerem o trabalho!"

| # | Decisão | Consequência para os especialistas |
|---|---|---|
| D-XPFLAT | **Todo inimigo, em qualquer uma das 33 fases do Episódio 1, dá o MESMO XP que um inimigo equivalente dá na fase 1.** Sem escalonamento de XP por fase dentro do Episódio 1. | Isto substitui a tabela de XP por Era que o `raw/12`/Desenho C propunha PARA O ESCOPO DO EPISÓDIO 1 especificamente (o dono não falou de Episódios/Eras futuras — trate como aplicável só ao Episódio 1 por ora, e pergunte se deve valer para todo o jogo). **Tensão a resolver com números, não a esconder:** a dificuldade dos inimigos (HP, dano) continua escalando por fase (isso não foi pedido para mudar); se o XP não escala junto, matar na fase 33 vira "mais difícil pelo mesmo prêmio" da fase 1. Calcule se isso é: (a) aceitável/desejável (desincentiva "pular" para fases difíceis achando que rende mais, sem precisar policiar isso — o oposto do problema atual, onde a fase 33 rende MAIS); (b) precisa de compensação (ex.: tempo-para-matar mais baixo em fases fáceis compensa, já que XP/hora pode continuar parecido se fases fáceis morrem mais rápido); ou (c) cria um problema novo (ninguém quer jogar fases difíceis pelo mesmo XP de uma fácil, e a única razão de avançar é a história/itens, não XP — isso pode ser exatamente a intenção). Apresente os números dos 3 cenários e recomende. |

## 10. Extensão da decisão D-XPFLAT (2026-09-25, mesma sessão)

Verbatim: "Inclua a fase CAVE1 [na regra de XP flat] e todos os ghosts devem dar o mesmo XP que os inimigos dão! Inclua isso no plano 1."

| # | Decisão | Consequência |
|---|---|---|
| D-XPFLAT-2 | **(a) A CAVE1 entra na mesma regra de XP flat** (mesmo valor da fase 1) — fecha o atalho de 732× que o `progression-actuary` apontou como ainda aberto. **(b) Captura de ghost na Ghostdex passa a dar o MESMO XP que matar um inimigo dá** (remove a escada própria `1,15^fase` que dava até 87,6× entre a fase 1 e a 33 — ninguém tinha ligado isso ao problema até o próprio relatório apontar). | Recalcule o atalho residual (se sobrou algum) com as duas fontes fechadas. Atualize a mesma seção nova (2.14) e as tabelas de decisão (Seção 0.9/14.2) do `LEGACY_GAME_MASTER_PLAN_2026-09-24.md` que você mesmo editou. Mantenha a distinção: XP por captura pode continuar existindo como eventinho (mecânica), só o VALOR passa a ser igual ao de matar o mesmo inimigo — não dobra a recompensa por "matar E capturar" sem querer (verifique se o jogo hoje permite capturar sem matar, ou se captura substitui o kill; documente o que encontrar). |

## 11. Refinamento de D-XPFLAT (2026-09-26) — valores fixos, não mais fórmula

Verbatim: "Todos os inimigos dão 666 de XP e todos os ghosts dão 1300 de XP. O jogo deve seguir esse parâmetro sempre. Isso em qualquer das 33 fases e na CAV1."

| # | Decisão | Consequência |
|---|---|---|
| D-XPFLAT-3 | **Substitui a fórmula "= valor da fase 1" (implementada em 25/09, `xpHpBase`) por CONSTANTES literais:** todo inimigo comum (`c_Boss`) dá exatamente **666 XP**; toda captura de ghost (`EnemyBoss`) dá exatamente **1300 XP**. Sem fórmula, sem depender do nível do jogador/inimigo, sem depender da fase — sempre os mesmos dois números, nas 33 fases do Episódio 1 e na CAVE1. | Simplifica a implementação anterior (pode até remover o cálculo `xpHpBase` e usar as constantes direto). **Nota para reconciliar depois:** os valores 666/1300 são interinos — o plano mestre (`docs/LEGACY_GAME_MASTER_PLAN_2026-09-24.md` Seção 2, Desenho C) ainda vai definir a tabela de XP por Era com autoridade do servidor e orçamento diário pra bater a régua de 3147; quando esse trabalho maior for construído, os valores 666/1300 (ou seus equivalentes) precisam ser reconferidos contra a régua, não simplesmente mantidos por hábito. |

## 12. Esclarecimento do dono sobre a escala de XP entre Episódios (2026-09-26)

Verbatim: "O XP dos primeiros inimigos e dos 101 ghosts está fixo, mas nos próximos episódios terá outros inimigos e outros ghosts que darão mais XP."

| # | Esclarecimento | Consequência |
|---|---|---|
| D-XPESCALA | O XP fixo (666 inimigo comum / 1300 ghost) vale só para o conteúdo do **Episódio 1** (33 fases + CAVE1 + os 101 ghosts atuais). **Episódios futuros terão inimigos e ghosts novos que dão MAIS XP** — a escalada de XP acontece **entre Episódios**, nunca **dentro** de um Episódio (o que resolve, para o design de longo prazo, a pergunta "como o XP acompanha a curva de nível exigida" — sem precisar tocar de novo no conteúdo já lançado). | Documentar isso como princípio de design permanente: cada Episódio novo define seu próprio patamar de XP (maior que o anterior), mas dentro dele todo inimigo/ghost daquele Episódio continua valendo o mesmo entre si (sem atalho de fase). Isso não muda nada no código hoje — Episódio 2 ainda não existe. |

## 13. Pedido do dono (2026-09-26) — resumo do conceito, sem o número do nível

Verbatim: "Eu quero um resumo sobre o jogo legado! Nesse resumo não fale sobre alcançar o level de 100 bilhões! Nesse resumo deve abordar o conceito do jogo legado de forma lacônica! [...] Não faça nada no jogo! Só faça isso que eu pedi agora!"

Só produzir um texto-resumo do CONCEITO (não um plano técnico), tom lacônico, sem citar o nível-alvo (100 bilhões / 1e11) nem enquadrar o conceito como "chegar a um nível". Nenhuma alteração de código.
