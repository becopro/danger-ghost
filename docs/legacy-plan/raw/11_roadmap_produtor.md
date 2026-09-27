# 11 — Roadmap do Produtor: a ordem real de execução do Jogo Legado

Autor: `producer` · Data: 2026-09-20 · Modo: **PLANO** (nenhum arquivo do jogo foi alterado; nenhuma migração; nenhuma consulta ao banco de produção; o único arquivo escrito é este; a conta de calendário/custos foi feita em Node no scratchpad da sessão)
Entrada principal: `00_BRIEF.md`, `CLAUDE.md`, `raw/10_auditoria_adversarial.md` (integral) + as seções de roadmap, MVP, estimativa e validação de `02`–`09` (o que li e o que não li está em (f)).

**Legenda:** **[VERIFICADO]** = li no código/doc citado; **[CÁLCULO]** = conta refeita em Node; **[HIPÓTESE]** = julgamento meu (todas as estimativas de dias, custos em dinheiro e valores de limiar são hipóteses e estão marcadas com a confiança).

**Mini-glossário (o dono é iniciante — leia antes):**
- **Portão go/no-go** = uma reunião curta, no fim de cada fase, com uma lista de conferência. Só se passa para a fase seguinte se todos os itens obrigatórios estiverem verdes. É o freio de mão do projeto.
- **Modo sombra** = o servidor calcula a coisa nova (o tempo e o nível do legado) **sem aplicar**, só grava, e você compara com o esperado por 2 semanas. Se bater, liga de verdade. É como testar um freio com o carro parado antes de descer a ladeira.
- **Feature flag** = um interruptor no servidor que liga/desliga uma função sem redeploy do código.
- **Ponto sem volta** = decisão ou ato que não dá para desfazer depois (ex.: a regra de hash da Crônica depois do primeiro evento gravado).
- **Caminho crítico** = a sequência de tarefas que, se atrasar, atrasa o lançamento inteiro. O resto pode escorregar sem custo.
- **Dia de trabalho** = ~4 h de foco real do dono dirigindo os agentes (definição de `09` §7). **Ritmo A** = 3 dias de trabalho por semana (12 h focadas); **Ritmo B** = 5 dias por semana (20 h). [HIPÓTESE — o dono precisa dizer o ritmo real, ver P1.]

---

## (a) Resumo em 10 linhas

1. O caminho real tem **7 fases e 6 portões**. Ordem: **(0) o que vale de qualquer jeito → (1) decidir e provar no papel → (2) medir o tempo em sombra → (3) MVP: virar autoritativo + Era Zero + Crônica mínima → (4) sucessão real → (5) conteúdo e arquivo → (6) institucionalização.**
2. **Fase 0 é independente do conceito** (25–45 dias de trabalho, confiança média) e tem **dois relógios externos reais**: Android até **31/12/2026** (102 dias = 14,6 semanas a partir de hoje) **[CÁLCULO]** e a fiscalização do ECA Digital (**nov/2026–jan/2027**, 6 a 15 semanas) **[VERIFICADO em `06`]**. A data de 30/09 **não** é o prazo do APK do site (`10` §1).
3. **MVP do Legado = Fases 0 a 3: 77–130 dias de trabalho ≈ 6–10 meses no Ritmo A (≈ 3,5–6 meses no Ritmo B)** **[CÁLCULO/HIPÓTESE]**. Só as fases do conceito (1–3) somam **52–85 dias: cerca de 4× (2,7 a 7×) os "12–19 dias" do MVP técnico de `09`**, porque `09` contou só servidor: falta a paridade web+mobile (×2), APK, E2E, HUD, a fase de papel, a sombra, o jurídico e a comunicação (§0.2).
4. **O MVP entrega a fantasia em três frases:** *"a minha hora conta"* (tempo autoritativo, teto `τ = 0`, curva provada em Monte Carlo), *"estou numa estrada de séculos e vejo o mapa"* (Era Zero, Selo do Dia, Anel, Era, página "The Long Road") e *"isto pode passar para alguém"* (designação de Herdeiro + Chave do Legado + Crônica automática) — **mas nenhuma Passagem real acontece antes do portão G4**, e o texto público não pode vender a Passagem como "testada".
5. **Não pode ser cortado (11 itens, §8.3):** tempo autoritativo antes de anunciar; harness passando; sombra de 14 dias; backup **restaurado** + adjunto nomeado antes de anunciar; Era Zero aditiva com checksum e carta às 48 contas; regra de hash da Crônica com vetores de teste em 2 linguagens; Termos/exclusão/parecer sobre o art. 9º III antes de menores na régua; versão mínima de cliente + APK assinado com chave de release.
6. **Achado de capacidade que nenhum relatório fez:** o **primeiro ano depois do lançamento** pede 104–158 dias de trabalho (sucessão real + Era II + ranking/arquivo + rituais) contra uma capacidade de **156 dias/ano no Ritmo A** **[CÁLCULO]**. Cabe só no limite; **a Era III sai do ano 1** e o `Interlude` (regra "o progresso nunca trava por falta de conteúdo") entra no MVP.
7. **Achado de calendário:** com `τ = 0` a Era I (33 h) acaba no **dia 33** de quem joga 1 h/dia (`07` B.6.2). Sem Era II pronta, o jogador bate na parede em ~1 mês. O `Interlude` (rejogar as 33 fases + overworld com o contador avançando) é o que impede isso e custa pouco.
8. **Pontos sem volta (só três):** a regra de hash da Crônica (C-01), o **anúncio público** (a promessa de 1.121 anos não se retira; a 1ª âncora externa da Crônica vem junto) e a **troca de assinatura do APK**. Tudo o mais é aditivo e reversível voltando o código.
9. **Custo estimado do 1º ano (Fases 0–3): US$ 1,6–4,6 mil (≈ R$ 9–25 mil) [CÁLCULO sobre HIPÓTESES]**, dominado por advogado/DPO (não por servidor).
10. **Para a reunião de aprovação:** responder **A10, A11 e A1–A5 agora** (destravam as Fases 0–2). **A6–A9 podem esperar até o portão G2** (ninguém grava Crônica, migra contas nem toca em menores antes disso) — mas se o dono quiser responder as 11 de uma vez, cada uma já vem com a resposta recomendada (§13).

---

## (b) Análise e proposta

---

## §0 — Como li os números (capacidade e reconciliação)

### 0.1 As três escalas de estimativa que os relatórios usam (e por que não somam)

| Fonte | O que estimou | Faixa | O que a estimativa **não** incluía |
|---|---|---|---|
| `09` §7 | F0–F6 completos, "dia = 4 h de foco" | **27–41 dias**; "MVP técnico" F0+F1+F2 = **12–19 dias** | paridade web+mobile e APK (o próprio §7.1 lista o trabalho de cliente, mas não o precifica), E2E em produção, HUD, jurídico, comunicação |
| `05` §7 | só integridade P1–P6 | **5–7 semanas concentradas** [HIPÓTESE dele] | migração, Crônica, sucessão |
| `03` §9 | **só o que a sucessão acrescenta** sobre `09` | MVP incremental **36–56 dias** | — (é aditivo a `09`) |
| `07` B.7 | conteúdo do MVP | **P/M/G** (tamanhos de camiseta) — sem dias | dias ("estimativas de dias são do `producer`" — ou seja, minhas) |
| `08` §6.2 | operação do ano 1 | **≈ 83 h** no ano (≈ 21 dias) | — |
| `04` D0–D4 | durabilidade | D0 ≤ 30 dias corridos; D1 ≤ 6 meses; D2 ≤ 2 anos | dias de trabalho |

**Conflito real:** `05` diz 5–7 semanas só para a integridade; `09` diz 5–8 dias para o "tempo autoritativo" (F1). São ordens de grandeza diferentes. A diferença é a que a persona do produtor manda precificar: **`09` conta o servidor; `05` conta servidor + web + mobile + APK + calibração**. Adoto o segundo critério.

### 0.2 Regras de conversão que usei (todas [HIPÓTESE])

1. **Trabalho de cliente vale o dobro do rosto** (web + mobile + `npx cap sync android` + APK + cache-busting; `CLAUDE.md` §3, skill `crossplatform-deploy`). Trabalho só de servidor (`server/*.js`, tabelas, jobs) **não** dobra.
2. **E2E em produção com conta descartável** (skill `e2e-db-verification`) custa **~0,5–1 dia por fase** com mudança de save/auth/tempo — não é opcional.
3. **Cada fase que muda auth, banco ou as duas plataformas passa antes por Plan Mode com o dono** (`CLAUDE.md` §7) — conto ~0,5 dia de alinhamento.
4. Calendário: 1 semana = 3 dias de trabalho (Ritmo A) ou 5 (Ritmo B). **O dono não disse qual é o ritmo real** — por isso todo o calendário vem em duas colunas.
5. **Confiança** = quanto eu confio na faixa: **Alta** (já fizemos coisa igual neste projeto), **Média** (padrão conhecido, mas com integração nova), **Baixa** (nunca feito aqui / depende de terceiros).

**Sanidade contra o ritmo já observado neste projeto** [HIPÓTESE, inferida do índice de memória do projeto, não medida]: correções de segurança de servidor (18/08), migração SQLite→Supabase (19/08) e migração `level`→BIGINT foram feitas em poucos dias cada, com agentes. Então o **extremo baixo** das minhas faixas de servidor é plausível; o **extremo alto** é o cenário "cliente + mobile + algo dá errado".

---

## §1 — O mapa em uma página

### 1.1 As fases

| Fase | Nome | Só faz sentido COM o conceito? | Dias de trabalho | Confiança | Portão |
|---|---|---|---|---|---|
| **0-A** | Rede de segurança e relógios externos | **Não — vale de qualquer jeito** | 14–25 | Média | **G0a** |
| **0-B** | Conta, e-mail e conformidade | **Não — vale de qualquer jeito** | 11–20 | Média | **G0b** |
| **1** | Decidir e provar no papel | Sim | 6–10 (quase tudo agentes) | Alta | **G1 — portão do conceito** |
| **2** | Tempo autoritativo **em sombra** | Sim | 15–24 | Baixa-média | **G2 — portão da sombra** |
| **3** | **MVP do Legado**: virar autoritativo + Linhagem + Crônica mínima + Era Zero + comunicação | Sim | 31–51 | Média-baixa | **G3 — portão de lançamento** |
| **4** | Sucessão real (a Passagem de verdade) | Sim | 47–73 (4a 21–32 · 4b 14–22 · 4c 12–19) | Baixa | **G4 — portão da 1ª Passagem** |
| **5** | Conteúdo e Arquivo (Era II, ranking, export, durabilidade) | Sim | 36–64 | Muito baixa (Era II é [HIPÓTESE] pura) | **G5** |
| **6** | Institucionalização (associação, licença, marca) | Sim (e vale se o dono tiver interesse em legado, mesmo sem o jogo legado) | 5–10 de dev + tempo de terceiros | Baixa | **G6** |

**Totais [CÁLCULO]:** Fase 0 = **25–45 d**; conceito até o MVP (Fases 1–3) = **52–85 d**; **MVP completo (0–3) = 77–130 d**; Fase 4 = 47–73 d.

### 1.2 O grafo de dependências (em texto)

```
Aprovação (S0)
 │
 ├─► Fase 0-A ──► G0a ─────────────────────────┐
 │    (Android, backup, bounds, token_epoch,    │
 │     Termos/aceite, higiene, domínio)         │
 │                                              ▼
 ├─► Fase 1 (papel; agentes) ──► G1 ──► Fase 2 (SOMBRA, 14 dias corridos de observação)
 │                                              │
 ├─► Fase 0-B ── roda DENTRO da janela de       │   (a observação da sombra é tempo de espera:
 │    observação da sombra ───────────────────► ┤    o dev trabalha em 0-B e nas tabelas da Fase 3)
 │                                              ▼
 │                                          G2 ──► Fase 3 (MVP) ──► G3  ★ LANÇAMENTO PÚBLICO
 │
 ├─► Trilha jurídica externa: advogado contratado na S1 ──► Termos (0-A) ──► parecer art. 9º III ──► exigido em G3
 │
 └─► (depois do G3)  Fase 4a ─► G4 ─► 4b/4c ─► Fase 5 ─► Fase 6
```

### 1.3 Quatro roadmaps → um (rastreabilidade)

`10` §3 diz "existem quatro roadmaps e nenhum é o roadmap". Aqui está a fusão:

| Este roadmap | `09` (técnico) | `04` (durabilidade) | `07` (conteúdo) | `08` (operação) | `03`/`05` |
|---|---|---|---|---|---|
| **0-A** | F0 **sem** `migrate_level_bigint` (**já executada**, `10` §2.1) | **D0** | — | — | `05` P5, P15 |
| **0-B** | *(novo — `10` R-12)* | — | — | — | `03` P0-1 (e-mail), `06` Bloco 1 |
| **1** | — | D1 (regra de hash decidida) | Horizonte de Conteúdo (para aceitar o teto `f`) | M0 | — |
| **2** | resto de F0 + **F1** | — | — | — | `05` P1–P4, P6 |
| **3** | **F2 + F4** + subconjunto **manual** de F3 | D1 | Era I + fatia II, Odômetro/Selo/Anel | M1–M3 | `03` MVP parcial |
| **4** | **F3** | D1 | Era II | M4–M5 (Pilots) | `03` MVP incremental, `05` P7–P13 |
| **5** | **F5 + F6** | D1/D2 | Eras II–III | ano 2 | — |
| **6** | — | D2–D4 | — | — | `06` Bloco 2/3 |

**Três correções ao que os relatórios assumiram (o produtor pode fazê-las porque muda sequência, não conteúdo):**
1. `09` põe a migração Era Zero (F4) **depois** da Sucessão (F3). Para o MVP isso não funciona: as 48 contas precisam existir como Linhas para o MVP fazer sentido. **A migração vem com o MVP; a Sucessão completa vem depois (Fase 4).**
2. `09` F0 inclui `xp_total NUMERIC(40,0)` por causa do XP acumulado de 3,64e28. Se **A4(a)** (nível = função do **tempo** creditado) e **A1(b)** (curva `L*(H)`) forem aprovados, o dado primário passa a ser `credited_seconds BIGINT` (o próprio `09` (f) risco 4 diz "tempo é o dado primário, XP é derivado"). **`xp_total NUMERIC` sai da Fase 2** — [HIPÓTESE; o `backend-architect` confirma]. Corta ~1–2 dias e um tipo delicado (a armadilha do `setTypeParser(1700)`).
3. `08` numera os meses a partir da aprovação (M3 = página pública). No meu calendário **a página pública é o G3**, não o mês 3.

---

## §2 — FASE 0: o que vale a pena de qualquer jeito (mesmo que o dono NÃO aprove o conceito)

> **Regra desta fase:** nada aqui depende de o conceito existir. Se o dono rejeitar o Jogo Legado amanhã, **tudo abaixo continua valendo** — porque corrige um risco que o jogo já tem hoje, ou cumpre uma obrigação que já existe. Os itens marcados **⚙ também é pré-requisito do conceito** fazem serviço duplo.

### 2.1 Fase 0-A — Rede de segurança e relógios externos

- **Objetivo (1 frase):** deixar o jogo que já está no ar seguro contra perda de dados, contra sessões sem revogação e contra os dois prazos externos que estão correndo.
- **Decisões do dono antes:** **A10** (Android), **A11** (backup + segunda pessoa), **B4** (revogação de sessão — recomendo sim), **B16 + B20** (natureza da conta e idioma nos Termos, para o advogado redigir), **C18** (domínio). *Nenhuma exige aceitar o conceito.*

| # | Item | Por que vale de qualquer jeito | Dias | Prazo / gatilho | ⚙ |
|---|---|---|---|---|---|
| 1 | **Corrigir os 4 comentários enganosos de `server/db.js`** (~L57–63, 68–70, 136–139, 442–444) e o cabeçalho de `migrate_level_bigint.js` para "**EXECUTADA em \<data\>, verificada por checksum**" | Foi daqui que 3 agentes tiraram a premissa errada (`10` §2.1.1). **[VERIFICADO hoje:** as linhas 59 e 444 ainda dizem "continua com INTEGER" e "escrito, NÃO executado"**]**. A data da execução é o dono quem sabe. | 0,5–1 | esta semana — é o mais barato | ⚙ |
| 2 | **Backup que restaura de verdade:** `pg_dump` diário para **2 destinos** em locais diferentes + **teste de restauração** num Postgres vazio + inventário de acessos (VPS, Supabase, domínio, GitHub, Google, keystore) + **adjunto nomeado** + confirmar o plano do Supabase | Hoje o *bus factor* é 1 e `04` não achou backup nenhum (E8). Plano gratuito pausa após ~7 dias sem atividade e não tem backup diário (`04`, via busca). **A11 / D14.** | 3–5 (+ ações do dono) | **antes de qualquer migração** (regra: "nenhuma migração roda sem dump restaurado nas últimas 24 h") | ⚙ |
| 3 | **Android:** (i) `mobile-platform-engineer` confirma **o que se perde** ao desinstalar/reinstalar com assinatura nova (o `localStorage` do WebView? o save em nuvem cobre?); (ii) **gerar keystore de release** com senha e **2 cópias físicas**; (iii) **criar a conta no Android Developer Console** e registrar `danger.ghost.mobile` + a chave; (iv) compilar APK assinado; (v) publicar no site com aviso de "desinstale e reinstale" | O APK de hoje é assinado com chave **debug** (`assembleDebug`, `CLAUDE.md` §3.4). **[VERIFICADO hoje:** `android/app/build.gradle` → o bloco `release` **não tem `signingConfig`**]**. O rollout global de **2027** faz o sideload virar "fluxo avançado" (esperar 24 h) — mata a distribuição pelo site (`10` §1). | 2–4 | **31/12/2026** (102 dias). Registrar **depois** de ter a keystore; nunca antes. | — |
| 4 | **`NUMERIC_BOUNDS`:** subir `time` (teto 1e8 s = 3,17 anos) e `score` (teto 1e16) e **pôr o teto de validação de `level` acima do teto de jogo** (ex.: 1,01e11); + **rate limit** em `save_game_state` e irmãos (`05` P5, ~2 h) + registrar a dívida das colunas `INTEGER` (`total_kills`, `total_items_collected`, `total_lives_collected`) e migrar em janela própria com `--confirm` | Hoje um número fora da faixa **congela o save em silêncio** (`COALESCE` mantém o valor antigo) — `10` §2.1.2 **[VERIFICADO]**. `level: [1, 1e11]` é exclusivo de fato. Os 3 contadores `INTEGER` **quebram com erro** ao passar de 2,1 bi (`10` §2.1.3). O valor novo tem que ser calculado **para cima**, nunca "no olho" (`09` §0). | 1,5–3 | antes da Fase 2 | ⚙ |
| 5 | **`token_epoch` + revogação de sessão** (B4) | **[VERIFICADO hoje:** zero ocorrências de `token_epoch`/`revok` em `server/*.js`**]**. O JWT é `{email}` com TTL 30 d: não há como expulsar ninguém. Vale por segurança pura. | 1,5–3 | antes da Fase 2 | ⚙ |
| 6 | **Termos de Uso + Política de Privacidade + aceite versionado + canal do titular** (parte de dev; o **texto** é do advogado) | Não existem (`06` B.2 nº 14). ECA Digital em vigor desde 17/03/2026; **fiscalização nov/2026–jan/2027**. | 3–5 | **contratar o advogado na semana 1**; texto até ~nov/2026 | ⚙ |
| 7 | **Higiene:** (a) trocar o texto "records… on the blockchain" (`index.html:1026`) — o jogo é 100% Web2; (b) mascarar e-mail nos logs do PM2; (c) rever `origin:'*'` do CORS **testando no APK** (o WebView do Capacitor tem origem própria); (d) **AÇÃO DO DONO:** destruir/cifrar `server/game_data.db` (SQLite antigo, pode ter senhas da era de texto puro) depois de confirmar a migração 100% | `06` B.14 bloco 1 nº 4–5; `04` (f) 6. | 1–2 | junto com o 6 | — |
| 8 | **Domínio:** pré-pagar (até 10 anos), travar, 2FA físico, monitor externo; **espelho do repositório** + conserto do `.git` inchado | O APK tem `https://ghostgames.club` gravado: se o domínio expirar e um estranho registrar, **todo APK instalado envia e-mail e senha ao estranho** (`04`). Custa ~US$ 16/ano. | 1–2 | esta semana (é 1 hora do dono) | ⚙ |

- **Dependências:** nenhuma entre os itens 1, 2, 3, 8. O 4 e o 5 vêm **depois** do 2 (regra do backup). O 6 depende do advogado (externo).
- **Estimativa:** **14–25 dias de trabalho** (≈ 4,7–8,3 semanas no Ritmo A; 2,8–5 no B). **Confiança: média.**
- **Aceite / verificação (E2E com conta descartável `test_xxx_<timestamp>@example.com`, skill `e2e-db-verification`, simulando "outro aparelho"):**
  1. **Backup:** restaurar o dump mais recente num Postgres vazio; conferir contagem de linhas de `players` (48) e `characters` (139) e o `md5` de `inventory/equipment` — igual ao de produção.
  2. **Bounds:** salvar com `score = 5e16` e `time = 2e9` → o valor **persiste** e não some do payload; salvar com `level = 1e11` → aceito; `level = 2e11` → rejeitado **com `save_error` visível**, não em silêncio.
  3. **`token_epoch`:** logar em 2 "aparelhos"; subir o epoch de um lado; o outro **cai** no próximo `session_login`.
  4. **Android:** APK assinado instala num aparelho limpo; **reinstalar por cima do debug** falha como previsto e o aviso funciona; login no APK continua funcionando **depois** de qualquer mudança de CORS.
  5. **Termos:** conta nova não entra sem aceitar; contas antigas veem o aceite no próximo login (não bloqueia a sessão em andamento).
- **Reversão:** cada item é isolado. Servidor: `git revert` + `pm2 restart ghost`. `token_epoch` é coluna **aditiva** (ignorada se o código voltar). Bounds: constantes. APK: o APK debug antigo continua no ar até o novo ser aceito. **Único item sem volta: a assinatura do APK** (por isso a keystore vem antes e tem 2 cópias).
- **Riscos e gatilhos de parada:** (i) reinstalar o APK apaga `localStorage` e o save local **não** está na nuvem → **parar o item 3** e antes construir "exportar/backup do save local"; (ii) restringir CORS derruba o login do APK → **reverter na hora** (o teste do item 7c é obrigatório); (iii) o teste de restauração **falha** → **parar tudo o resto da fase** até ele passar.
- **Portão G0a (go/no-go):** ☐ dump restaurado com sucesso ≤ 24 h ☐ adjunto nomeado e acessos inventariados ☐ keystore em 2 cópias + conta no Console **ou** decisão consciente por A10(b) ☐ bounds e `token_epoch` verificados em produção ☐ advogado contratado ☐ comentários corrigidos. **Se falhar:** não se inicia a Fase 2 (a Fase 1 continua, porque é só papel).
- **Agentes, em ordem:** `backend-architect` (itens 1, 4, 5 — Haiku só para o item 1, que é mecânico) → `security-engineer` (revisa 4, 5 e o CORS com cenário concreto) → `mobile-platform-engineer` (item 3 inteiro + espelho do "blockchain" e do aceite) → `deep-time-archivist` (envelope de custódia: keystore, credenciais do Console, adjunto; regra 3-2-1) + `tools-programmer` (script de dump/verificação) → `digital-succession-compliance` skill via `digital-succession-counsel` (insumos para o advogado) → `ui-ux-designer` (tela de aceite) → `qa-lead` (E2E acima) → **deploy** (§9.2).

### 2.2 Fase 0-B — Conta, e-mail e conformidade

- **Objetivo:** dar ao jogo uma conta que se recupera, que se verifica e que se apaga, como qualquer serviço que guarda e-mail e senha.
- **Decisões do dono antes:** **B17** (padrão de privacidade — só para não desenhar a exclusão duas vezes), **C15** (licença — não bloqueia), **C13** (rotular o chat MQTT como "público, sem moderação"). Escolha do provedor de e-mail transacional (**P8**).

| # | Item | Por que vale de qualquer jeito | Dias | ⚙ |
|---|---|---|---|---|
| 9 | **E-mail transacional + verificação de endereço + "esqueci minha senha"** (web + mobile) | `03` F5: hoje **não há** envio, verificação nem recuperação de senha. Um jogador que esquece a senha perde a conta. **`09` F0 não incluía isso** (`10` R-12). | 6–10 | ⚙ (a escada de dormência inteira depende dele) |
| 10 | **Procedimento de exclusão de conta** (anonimizar, apagar contatos, depois apagar/marcar `erased_at`) + canal do titular funcionando | Hoje o art. 18 da LGPD só se cumpre com SQL manual, e o `ON DELETE CASCADE` apaga tudo junto (`06` B.2). É um **procedimento**, não um `DELETE` (`10` R-11). | 3–5 | ⚙ (evita o erro de FK do `RESTRICT` no futuro) |
| 11 | **Staging:** um **segundo projeto Supabase gratuito** (recomendo) ou Postgres local em Docker | "Não existe ambiente de staging" (`09` risco 2). Todo teste real hoje é contra produção. Para um iniciante, o segundo projeto Supabase tem curva de aprendizado menor que Docker. [HIPÓTESE] | 1–2 | ⚙ |
| 12 | **Vendorizar as 3 CDNs** (web + mobile) e checar se o cliente quebra sem o `mqtt` da CDN | `04` D0 / (f) 7: se a CDN sumir, o jogo quebra; dependência externa sem contrato. | 1–3 | — |

- **Dependências:** item 9 precisa do provedor escolhido e de SPF/DKIM no DNS do `ghostgames.club` (AÇÃO DO DONO no registrador). Item 10 depende de o advogado revisar o texto do canal. Item 11 antes de qualquer teste da Fase 2.
- **Estimativa:** **11–20 dias** (≈ 3,7–6,7 semanas no Ritmo A). **Confiança: média.**
- **Aceite / verificação:** (E2E, conta descartável) cadastro → e-mail chega em **3 provedores diferentes** (Gmail, Outlook, um doméstico) e não cai em spam; verificação marca a conta; "esqueci minha senha" troca a senha **e sobe o `token_epoch`**; **exclusão**: criar conta descartável com diário + mural + amizade → executar o procedimento → conferir que o e-mail sumiu do banco e dos logs mascarados e que **não houve erro de FK**; staging sobe do zero com o mesmo `schema`.
- **Reversão:** verificação de e-mail entra **sem bloquear** contas antigas (feature flag `verificacao_obrigatoria` desligada por padrão); "esqueci a senha" é rota nova (não altera login); exclusão é opt-in do jogador.
- **Riscos e gatilhos:** (i) entrega de e-mail ruim (domínio novo cai em spam) → **gatilho:** < 90% de chegada na caixa de entrada no teste dos 10 endereços [HIPÓTESE do limiar] → não ligar a verificação obrigatória; (ii) o `npm install` do SDK do provedor é esquecido no deploy (skill `crossplatform-deploy` §6/§7) → o item 9 vai em janela de deploy **com** `npm install` no roteiro; (iii) a chave da API de e-mail entra por variável de ambiente **em minúsculas e sem `_`** (o console VNC perde o Shift: `dbhost`, `jwtsecret` são o padrão — use `emailapikey`) e **é o dono quem cola o valor, nunca o agente**.
- **Portão G0b:** ☐ e-mail verificado em produção ☐ recuperação de senha testada ☐ exclusão testada sem erro de FK ☐ staging funcional ☐ Termos e Política **publicados** (texto do advogado) ☐ chat rotulado. **Se falhar:** o MVP (G3) **não** sai — sem e-mail não existe a escada de dormência e sem exclusão o Crônica vira passivo legal.
- **Agentes, em ordem:** `backend-architect` (rotas, outbox, exclusão) → `security-engineer` (reset de senha é vetor clássico de tomada de conta — revisar) → `network-programmer` + `ui-ux-designer` (telas) → `mobile-platform-engineer` (espelho + APK) → `tools-programmer` (staging, vendorização) → `qa-lead` → deploy.

---

## §3 — FASE 1: Decidir e provar no papel

- **Objetivo:** ter as decisões bloqueantes respondidas por escrito e **provar em simulação** que a promessa fecha, antes de escrever uma linha do legado.
- **Entregas:**
  1. **Reunião de aprovação** (§13) com **A10, A11 e A1–A5** respondidas; **A6–A9** com resposta recomendada registrada e "revisitar em G2".
  2. **`progression-actuary` refaz `02`** com as correções de `10` §7: nível do ano 1 = **7.371** (não 7.376); trava de calendário na **Keystone**, não no contador (**C-03**, senão o jogador impecável espera **112 anos** parado no máximo); nova `curve_version` recalibrada para o restante (**R-09**); tabela de arquétipos com a unidade **Linha** (**A5**); teste de **C-02** (as 10 Eras de `07` atravessam décadas de dígito suficientes sob `a=20, g=3`?).
  3. **Harness Monte Carlo v1 aprovado** (10 critérios de `02` §9.2 **+ critério 11 de `10`**: trocar a curva no ano X ∈ {10, 100, 500, 1000} e continuar fechando em 3147). **Os critérios 1 e 2 reprovavam com `m = 1,00`** (mediana 3234; 0% em 3147) **[VERIFICADO em `02` §9.3]** — a solução (`m ≈ 0,90` + a promessa "365 h/ano, quando der", **A2**) tem que passar nesta fase.
  4. **Tabela de sobrevivência da Linha (R-03)** publicada — a resposta honesta a "isso vai dar certo?": com 90% de sucesso por Passagem, uma Linha chega a 3147 em ~0,87% dos casos; para 50% de chance de *alguma* Linha chegar, **~80 Linhas fundadoras** **[CÁLCULO de `10`]**. O dono precisa **ler** isto antes de aprovar; **muda como o Commons (A9) é tratado**.
  5. **Reprodução do cenário #1 de `05`** ("zerar em um pacote de rede") **numa conta descartável no staging** — `10` (f) 2 lembra que um achado não reproduzido é hipótese com boa evidência, não fato.
  6. **Varredura de `state.level =` e irmãos em `engine.js`** (`gameplay-engineer`, com `Grep`, sem ler os 220 KB) — pré-requisito da Fase 2 que `10` (f) 1 deixou pendente.
  7. **Três levantamentos somente-leitura que o dono autoriza** (`02`, `05`, `09` pediram): distribuição de níveis das 48 contas/139 personagens; valores de `characters."time"`; dias jogados nos últimos 90 dias. E dizer quais contas são de teste.
  8. **Síntese final do `game-director`** aplicando as 23 correções de `10` §7 e incorporando este roadmap; **revisão do vocabulário por falante nativo de inglês** (`10` C-11 / `01` (f) 6) antes de qualquer texto de jogador.
  9. **Parâmetros de calibração que ninguém decidiu:** o teto do Banco de Vigília (`02` propõe 30 h; `05` propõe 7 dias de banco com gasto ≤ 2 h/dia) — fixar no harness; **[HIPÓTESE minha: 30 h de teto de acúmulo, 1 h/dia de taxa, gasto sem teto diário, porque a taxa de longo prazo é o que limita]**.
- **Depende de:** nada técnico (é papel); precisa do dono (decisões e autorização das consultas) e do staging (item 11 da Fase 0-B) **só** para a reprodução do item 5.
- **Decisões prévias:** **A1, A2, A3, A4, A5** (o coração); **A10, A11** (já respondidas para a Fase 0). Opcional agora: A6–A9.
- **Estimativa:** **6–10 dias de trabalho, quase todos de agentes**; o dono gasta ~3–5 h na reunião + ~1–2 dias revisando. Calendário: **2–4 semanas** (espera pelo dono e pelo advogado). **Confiança: alta.**
- **Aceite / verificação:** harness com **11/11 critérios verdes** e relatório reprodutível (mesma semente ⇒ mesmos números); tabela de sensibilidade; exploit #1 reproduzido e **medido** (quantos segundos leva); varredura de `state.level =` listada arquivo:linha; consultas somente-leitura entregues.
- **Reversão:** não há (é papel). Se o harness **não** achar calibração que passe os 11 critérios, **não se avança**: devolve-se ao dono a reformulação da promessa (A2).
- **Agentes, em ordem:** `mp-orchestrator` (triagem) → `progression-actuary` (harness; skill `legacy-pacing-calibration`) ∥ `security-engineer` (exploit, no staging) ∥ `gameplay-engineer` (varredura) ∥ `legacy-systems-designer` (unidade **Linha**, texto da promessa) → `forensic-analyst` (auditoria adversarial rápida do harness — ele assume que nada está provado) → `localization` (revisão nativa) → `game-director` (síntese) → `producer` (portão).
- **Riscos e gatilhos:** (i) **indecisão do dono** — **gatilho:** > 3 semanas sem A1–A5 → congelar a Fase 1 e continuar só a Fase 0; (ii) o harness mostra que **nenhuma** calibração humana zera antes de 3200 sem margem absurda → parar e reabrir A2; (iii) a varredura acha outro caminho que escreve `state.level` direto → ampliar a Fase 2 (+2–4 dias) antes do G1.
- **Portão G1 — portão do conceito:** ☐ A1–A5 respondidas por escrito ☐ harness 11/11 ☐ exploit #1 reproduzido ☐ varredura feita ☐ tabela R-03 lida pelo dono ☐ **G0a verde** (backup restaurado, `NUMERIC_BOUNDS`, `token_epoch`) ☐ advogado contratado ☐ **regressão do botão de pulo no mobile resolvida ou explicitamente adiada pelo dono** (ver P8). **Se falhar:** o conceito **não** entra em construção; a Fase 0 continua sozinha e o dono decide se para aí.

---

## §4 — FASE 2: Tempo autoritativo em sombra

- **Objetivo:** o servidor passa a medir o tempo e a calcular o nível do legado, **sem aplicar em ninguém**, até os números baterem por 14 dias.
- **Entregas:**
  1. Tabelas `playtime_sessions` (quente, descartável), `playtime_daily` (selada, `credited_seconds BIGINT`, `curve_version`, `day_hash`) e `playtime_yearly`; **`credit_adjustment`** (ajuste datado, negativo ou positivo — **R-08**: a fraude retroativa nunca reescreve o total) já na modelagem inicial, porque é barato agora e caro depois.
  2. Protocolo de crédito: `legacy_session_start` / `legacy_heartbeat` / `legacy_session_end`; crédito **só com evento de gameplay qualificado** na janela (`05` §3.4) — **`visibilitychange` não é fonte de verdade** (R-18); idempotência por `(sessionId, beatSeq)`; `MAX_BEAT_GAP`; timeout; retomada após restart.
  3. **Sessão única / bastão de crédito** (B3): web + mobile ao mesmo tempo não dobram o relógio; a segunda vira "espectador" com aviso, **nunca** derrubada em silêncio.
  4. **Banco de Vigília com `τ = 0`** (A3) e a regra do dia por **janela deslizante de 24 h** (não por dia-calendário UTC) — resolve o **"dia duplo" (R-01)**.
  5. Job `sealDay` noturno, **função `L*(H)` e sua inversa** implementadas a partir do harness (o oráculo), `legacy_level_shadow` gravado e **não exibido**.
  6. `account_id` (aditivo) + `login_handle` nulo; `connectionTimeoutMillis: 5000` no pool (**pré-requisito** de qualquer escrita periódica — medido: 15 jogadores simultâneos levaram a latência de poucos ms a ~5 s, `09` §6); `clientVersion` no handshake (**apenas lido e logado** nesta fase; não bloqueia).
  7. **Cliente (web + mobile):** emitir os 3 eventos; HUD mínima "tempo creditado hoje" e aviso de espectador; **`addXp()` não muda** nesta fase (é a sombra).
- **Depende de:** **G1**; **G0a**; staging; Plan Mode aprovado (auth/banco/duas plataformas — `CLAUDE.md` §7).
- **Decisões prévias:** **A1–A5**, **B3**. (A6–A9 **não** são necessárias: não há Crônica, migração nem menor nesta fase.)
- **Estimativa:** **15–24 dias de trabalho** (Ritmo A: 5–8 semanas; B: 3–4,8), mais **14 dias corridos de observação** que **se sobrepõem** ao trabalho da Fase 0-B e da Fase 3 (tabelas). **Confiança: baixa-média** — é a primeira vez que este projeto mede tempo no servidor e a inversão "servidor calcula, cliente mostra" é a mudança mais arriscada do plano (`09` (f) 1). Composição [HIPÓTESE]: servidor 5–8 (`09` F1) + sessão única/bastão 2–3 + cliente web+mobile+HUD 5–8 + APK/cache/deploy/E2E 3–5.
- **Aceite / verificação (E2E com conta descartável, skill `e2e-db-verification`, dois "aparelhos" simulados, contra o Supabase real — regras da skill):**
  | # | Cenário | Resultado exigido |
  |---|---|---|
  | T1 | 60 min de eventos qualificados | `seconds_credited = 3600 ± MAX_BEAT_GAP` |
  | T2 | 15 min sem evento qualificado (aba aberta, parado) | **0** segundos creditados |
  | T3 | segundo aparelho conecta | vira espectador; **nenhum dobro**; assume o bastão quando o primeiro sai |
  | T4 | `pm2 restart ghost` no meio da sessão | retomada; **sem dobro** e **sem perder mais que uma janela** |
  | T5 | uma sessão atravessando 00:00 UTC (21:00 em Brasília) | **não** rende 2 h (R-01) |
  | T6 | relógio do cliente adulterado | ignorado (só vale o do servidor) |
  | T7 | `save_game_state` com `level = 1e11` | `legacy_level_shadow` **inalterado** |
  | T8 | cliente sem `clientVersion` (APK antigo) | sessão continua; log registra a versão |
  | T9 | **carga:** ≥ 15 jogadores simulados | latência p95 do pool < 2 s [HIPÓTESE do limiar; hoje ~5 s] |
  **Equivalência com o harness (uso do Monte Carlo nesta fase):** **replay** dos heartbeats sintéticos dos 10 arquétipos de `02` §9.2 contra o crédito do servidor no staging (com um *seam* de tempo injetável para simular 1 ano em minutos) — o total creditado tem que bater com o do harness em **0,1%**; e a `L*` do servidor tem que passar no **ida-e-volta** (`cum`/`inversa`) em 100% da grade log + bordas e ser **monotônica nos 409.539 passos** (`10` §2.3 já provou a fórmula; aqui prova-se a **implementação**).
- **Reversão:** feature flag `legacy_shadow=off` no servidor; tabelas aditivas ignoradas; o cliente que emite heartbeat sem servidor ouvindo é inofensivo. **Zero DDL a desfazer.** O dado de sombra é **descartado** no Dia da Fundação (declarar isso na política de privacidade).
- **Riscos e gatilhos de parada (orçamento de risco):**
  | Risco | P | I | **Gatilho para parar** |
  |---|---|---|---|
  | dobro/perda de crédito por corrida (dois heartbeats, restart) | M | A | > 1% das sessões de teste com divergência inexplicada → parar e chamar `forensic-analyst` (skill `forensic-root-cause-analysis`) |
  | latência do pool explode com heartbeat | M | A | p95 > 2 s por > 1 h → subir `max`/agregar em memória (persistir a cada 5 min, `09` §6) antes de continuar |
  | `visibilitychange`/heartbeat se comporta diferente no WebView do APK (R-18) | M | M | qualquer divergência web × APK > 5% [HIPÓTESE] → o crédito passa a depender **só** do evento qualificado (já é o desenho) e o teste no APK vira bloqueante |
  | outro caminho de XP no cliente (varredura incompleta) | B | A | se aparecer, +2–4 dias e repetir T7 |
  | estouro de escopo | A | M | **gasto > 1,5× o extremo alto (36 d) ⇒ parar e replanejar com o dono** |
- **Portão G2 — portão da sombra:** ☐ T1–T9 verdes em produção ☐ **14 dias corridos** de sombra com divergência inexplicada ≤ 1% ☐ `save_error` sem regressão ☐ exploit #1 **não** move o nível de sombra ☐ replay do harness bate em 0,1% ☐ dump restaurado ≤ 24 h **antes** de decidir ligar ☐ o dono revisou 5 contas reais lado a lado (cliente × sombra) ☐ **A6–A9 respondidas**. **Se falhar:** estende-se a sombra por mais 14 dias e corrige; **não** se liga o autoritativo.
- **Agentes, em ordem:** `backend-architect` (esquema, protocolo; modelo forte — é arquitetura e dado) → `security-engineer` (revisão do protocolo: janela de ociosidade, forjamento de heartbeat, bastão) → `network-programmer` + `gameplay-engineer` (eventos e sombra no cliente) → `mobile-platform-engineer` (espelho em `danger_ghost_mobile/www/js/...`, `cap sync`, APK) → `ui-ux-designer` (HUD/aviso) → `progression-actuary` (oráculo + replay) → `qa-lead` (T1–T9) → deploy.

---

## §5 — FASE 3: MVP do Legado (lançamento)

- **Objetivo:** virar o tempo autoritativo de verdade, fundar as Linhas das 48 contas na Era Zero e abrir o Legado ao público com uma Crônica mínima e honesta.
- **Entregas (o MVP; justificativa de cada corte em §8):**
  1. **Ligar o autoritativo:** `level` do legado = `L*(segundos creditados)`; `addXp()` do ghost do legado passa a **aplicar o que o servidor manda** (o cálculo local vira previsão de UI). **Nível de Combate `100·log₁₀(1+L)` (B1)** para o combate continuar coerente com as 33 fases (com o nível vindo do tempo, o dano `10·L^1,85` explodiria em semanas: ~1,4e8 no ano 1 **[CÁLCULO]**). Ghosts secundários **continuam como hoje** (Jogo Livre), sem crédito de horas.
  2. **Linhagem + Crônica mínima:** `lineages` (`UNIQUE(account_id)`), `keepers` (Guardião nº 1 = *First Keeper*; índice único parcial "um ativo por Linha", **C-05**), `chronicle_events` com a **regra de hash de `04` 8.2 #1 (RFC 8785 + prefixo `dgc1:` + `BYTEA` + string canônica gravada)**, trigger append-only e `SELECT … FOR UPDATE`. **Só eventos automáticos** (Fundação/Era Zero, Selo, Anel, Marcos de Dígito, mudança de Era). **Sem texto livre** (epitáfio, Carta) — **DIV-9 / R-24**: o texto livre nunca entra na cadeia, e sem consentimento + moderação (`08` R4) ele é passivo.
  3. **Vetores de teste da hash publicados e duas implementações independentes (JS e Python)** dando o mesmo resultado (**critério de aceite de `10` C-01**).
  4. **Era Zero** (`migrate_legacy_era_zero.js`, padrão de `migrate_level_bigint.js`: simulação por padrão, `--confirm`, transação única, idempotente, **checksum `md5`** das colunas que não podem mudar, `exit 1` se algo divergir): `pre_era_level := level`; `legacy_level := 1`; Linha + Guardião nº 1 + evento de fundação; **Selo de Pioneiro** (relíquia honorífica, `transferable = false`, `10` §7 nº 17). **Export JSON por conta das 48 contas, guardado fora do Supabase, antes** (passo 0 de `09` §4.2). O evento de fundação grava o **hash da configuração do harness** (curva, `m`, `τ`) — a promessa fica auditável.
  5. **`MIN_CLIENT_VERSION` ativo:** cliente abaixo do mínimo → `client_update_required` + **modo leitura** (joga, não credita, não grava XP), **nunca** derrubar a conexão (`09` §4.4). **APK novo assinado com a chave de release**, copiado para os **dois** lugares e link com `?v=NN` novo.
  6. **HUD do legado (web + mobile):** contador "Day N", **Selo do Dia**, **Anel** (365 h creditadas), Era atual, **"Fecho do dia"** (salvaguarda S2: ponto natural de parada visível, sem "só mais uma"), página **"The Long Road"** e **"How the ruler works"**. **Marcos de Dígito** só como rótulo (a troca dos valores das 333 badges é **DC-6/R-15 — fica de fora**).
  7. **Interlude** (regra "o progresso nunca trava por falta de conteúdo"): passada a Era I (33 h), a Linha segue no **rejogo livre** das 33 fases + overworld, com o contador avançando; **Eras II–X aparecem como "estrada visível" trancada** (nome/silhueta), só texto/arte.
  8. **Designação de Herdeiro + Chave do Legado** (24 palavras, mostrada **uma vez**, guardada só o `SHA-256`, **C-09**) e **`commons_optin` perguntado na designação** (padrão NÃO, as duas respostas igualmente fáceis, **C-08**) — **sem** Passagem por interface: a Passagem, se acontecer, é **assistida pelo dono por script** (Vigília de 30 dias registrada, cancelamento por e-mail) e **só a partir do G4**.
  9. **Salvaguardas jurídicas mínimas (S1–S4, S6, S7, S12):** teto, não meta; "Fecho do dia"; zero recompensa por presença; sem streak; sem culpa no texto; sem "atraso" exibido; **kill-switch** que desliga o crédito para menores sem quebrar a Linha; **idade autodeclarada** no cadastro e **modo Aprendiz** (joga tudo, não credita) para quem se declara menor **até o parecer escrito chegar** (`06` D1-C como plano B pronto, **A8**).
  10. **Comunicação em degraus (`08` §4.3):** (i) **carta pessoal às ~48 contas antes do público** (`08` §4.4) — 7 dias / 24 h / 1 h antes; (ii) só depois de **48 h de observação pós-migração**, a página pública + FAQ + "Saúde do Legado" + compromisso de encerramento digno; (iii) campanha larga **só depois dos Pilot Handovers**.
- **Depende de:** **G2**; **G0b** (e-mail, exclusão, Termos); **A6, A7, A8, A9 respondidas**; **B1, B2 (ponte `login_handle`), B9, B10, B14, B16, B18**; parecer do advogado **solicitado** (a resposta pode chegar depois **se** menores estiverem em Aprendiz).
- **Estimativa:** **31–51 dias** (Ritmo A: 10,3–17 semanas; B: 6,2–10,2). **Confiança: média-baixa.** Composição [HIPÓTESE]: Linhagem+Crônica+hash com 2 implementações 5–8; Era Zero (script, export, janela, APK, comunicação) 6–8; B1 + conferir dificuldade da Era I 3–6; designação/Chave/script de Passagem 6–10; HUD web+mobile+páginas 6–10; kill-switch + idade + Aprendiz 2–4; `MIN_CLIENT_VERSION` + deploy + E2E de produção 3–5. **Ninguém nos relatórios estimou em dias a normalização do combate e a rebalanceada da Era I** (`07` só deu "M"): é o item mais subestimado do plano — peço ao `game-designer` + `gameplay-engineer` uma estimativa própria no G1.
- **Aceite / verificação:**
  1. **Simulação da migração contra produção (somente leitura, default do script):** imprime nº de contas, personagens, distribuição de níveis, quem ganha o Selo, **checksum de controle**; **0 bytes escritos**.
  2. **Ensaio completo no staging** com 48/139 linhas sintéticas (as reais **não** saem de produção): `--confirm` → `md5` antes = depois; contagem de linhas igual; `verify_chronicle.js` recomputa a corrente das 48 Linhas.
  3. **Vetores de hash:** JS e Python **idênticos** nos vetores de `04` 8.3; e o caso `"P"+1+"2x"` vs `"P"+12+"x"` **não colide**.
  4. **C-05 como teste, não como parágrafo:** "tentar abrir dois Guardiões na mesma Linha **falha no banco**".
  5. **E2E em produção após a janela** (conta descartável): login → tempo credita → nível derivado aparece → exploit #1 **não** move o nível → APK antigo cai em modo leitura → APK novo assinado instala e joga.
  6. **Harness (uso final):** reexecutar o Monte Carlo com **exatamente as constantes implantadas** (`curve_version 1`); os 11 critérios continuam verdes.
  7. **Regra de dupla checagem do dono:** abrir 5 contas reais depois da migração e conferir Selo, Linha, Guardião nº 1 e que o inventário/equipamento **não mudaram**.
- **Reversão:** a migração é **aditiva** → reverter é `pm2 stop ghost` → deploy do bundle anterior → `pm2 start ghost`; as colunas/tabelas novas ficam ignoradas. **Janela: anunciar 2 h, esperar usar ~20 min** (`09` §4.3). **Pontos sem volta desta fase:** (i) **o primeiro evento gravado com a regra de hash** — por isso os vetores em 2 linguagens vêm antes; (ii) **o anúncio público**; (iii) **a 1ª âncora externa da cabeça da cadeia** (B10): uma vez publicada em testemunhas independentes, não se reescreve — **só se começa a publicar depois do G3**, no Dia da Fundação. Reversão da **curva** depois de lançada: só por nova `curve_version` **recalibrada para o restante** (R-09), nunca por troca seca.
- **Riscos e gatilhos:**
  | Risco | P | I | **Gatilho para parar** |
  |---|---|---|---|
  | checksum diverge após `--confirm` | B | A | **imediato:** reverter o código; investigar antes de repetir |
  | **backlash das 48 contas** ("meu nível voltou a 1", `08` R5) | A | M | > 1/3 das respostas à carta são negativas [HIPÓTESE do limiar] → pausar a etapa pública (ii); o dono responde individualmente |
  | **parede de conteúdo no dia ~33** | A | M | se o Interlude não estiver testado, **não lançar** |
  | erro na regra de hash | B | **Crítico** | qualquer divergência JS×Python → **não gravar o primeiro evento** |
  | combate "trivial/impossível" com nível derivado | M | M | playtest do `qa-tester` na Era I: se o TTK fugir de uma faixa aceita → ajustar B1 antes do lançamento |
  | APK trocado quebra login | M | A | gatilho: qualquer falha de login no APK de teste → **não** ativar `MIN_CLIENT_VERSION` |
  | e-mail de aviso cai em spam (a carta às 48) | M | M | usar também o chat global e a Egrégora; **o dono envia**, `marketing`/`community-manager` só rascunham |
  | estouro de escopo | A | M | **gasto > 1,5× o extremo alto (≈ 76 d) ⇒ parar e replanejar** |
- **Portão G3 — portão de lançamento (o mais importante):** ☐ **G2 e G0b verdes** ☐ os 11 itens "não cortáveis" (§8.3) ☐ harness 11/11 com as constantes implantadas ☐ checksum antes = depois ☐ vetores JS = Python ☐ E2E de produção verde ☐ **dump restaurado ≤ 24 h** ☐ **adjunto nomeado, acessos em custódia, keystore em 2 cópias** (**R-05:** o dono não promete 1.121 anos enquanto o projeto depende de uma pessoa sem substituto) ☐ Termos/Privacidade/exclusão publicados ☐ **parecer sobre o art. 9º III solicitado e menores em Aprendiz** (ou parecer em mãos) ☐ carta às 48 enviada e observação de 48 h feita ☐ **nenhum texto promete "1 hora todo dia" nem "testado"** (a promessa é "365 horas por ano, quando der"; "prometer o ritmo, não o futuro", `08` §4.1). **Se falhar:** não se anuncia; a migração pode ficar feita e o Legado "fechado" até os itens virarem verde.
- **Agentes, em ordem:** `backend-architect` (Linhagem, Crônica, migração; **modelo forte**) ∥ `deep-time-archivist` (regra de hash, vetores, 2ª implementação em Python; skill `deep-time-preservation`) ∥ `tools-programmer` (`migrate_legacy_era_zero.js`, `verify_*.js`, export prévio) → `security-engineer` (revisa Chave, hash, `MIN_CLIENT_VERSION`) → `game-economy-designer` (Selo sem valor de mercado; score por Marco vs por nível — hoje é "por chamada de `addXp()`, por acidente") + `game-designer` (B1, Era I) → `gameplay-engineer` + `ui-ux-designer` (HUD, Fecho do dia) → `mobile-platform-engineer` (espelho, `cap sync`, **APK assinado**) → `narrative-designer` + `localization` (textos EN + PT) → `community-manager` + `marketing` (**rascunham** a carta, a página, o FAQ; **o dono envia**) → `digital-succession-counsel` (Termos atualizados, kill-switch, FAQ) → `qa-lead` (ensaio em staging + E2E em produção) → **janela de migração** (§9.2) → 48 h de observação.

---

## §6 — FASE 4: Sucessão real (a Passagem de verdade)

- **Objetivo:** fazer uma Linha **mudar de Guardião de verdade**, com segurança, e prová-lo em 2–3 **Pilot Handovers** antes de vender isso como funcional.
- **Entregas (em três blocos, para o dono poder parar entre eles):**
  - **4a — Passagem segura (21–32 d):** designação com convite/aceite/recusa; **Chave do Legado** como um dos 3 caminhos (Ritual, Cofre, ordem judicial — **B6**); **MFA TOTP obrigatório para Keepers a partir da 1ª sucessão** (B8); **Vigília de 30 d antes** da troca (C-06), **Investidura** que encerra o anterior **na mesma transação** (C-05), 30 d de experiência com devolução ao Resguardo; `token_epoch` no ato; **ponte `login_handle`** (B2); **Sinal do Guardião + escada de dormência** (Sinal 180 d · aviso ao Herdeiro 270 d · Dormente 365 d · Resguardo 730 d, tabela única de C-07; **depende do e-mail da Fase 0-B**); `09` F3.
  - **4b — Herdeiro acolhido e memória (14–22 d):** Livro do Legado v1 (texto livre **com consentimento por campo** e moderação; **só depois** de `06` B.6/B.5 e de existir quem modere); onboarding do Herdeiro (Vestíbulo, Ghost Aprendiz, HUD por Era); Modo Ausência; Disputa por fluxo manual.
  - **4c — Casos difíceis (12–19 d):** **Adulto Responsável + Reserva** para Herdeiro menor (**B19**, só com parecer do advogado); **Commons / Adoção** (**A9** — e **R-03** eleva isto a requisito de viabilidade); Arquivo/Monumento.
- **Depende de:** **G3**; e-mail e exclusão (0-B); **A9, B5, B6, B7, B8, B18, B19**; parecer jurídico sobre menores para o 4c; **prazo derivado:** o relógio de silêncio recomeça no Dia da Fundação (`03` §1.9), então o **Sinal aos 180 d** cai a ~6 meses depois do G3 — **o 4a tem que estar no ar antes disso**, ou o relógio de silêncio começa a contar só quando a escada existir [HIPÓTESE minha — `legacy-systems-designer` decide]. Não se liga aviso que o sistema ainda não consegue cumprir.
- **Estimativa:** **47–73 dias** (4a 21–32; 4b 14–22; 4c 12–19) — Ritmo A: 15,7–24,3 semanas. **Confiança: baixa** — nada disto foi testado em campo (`08` R2). Fonte: `03` §9 (MVP incremental 36–56 d, do qual já contei 5–8 d de e-mail na Fase 0-B e o `login_handle` aqui) + `09` F3 (5–7 d).
- **Aceite / verificação:** as **15 corridas e 30 casos de estresse de `03` §6** viram lista de testes (ex.: "dois cliques simultâneos em Aceitar", "Herdeiro aceita e Guardião cancela no mesmo segundo", "Chave perdida", "e-mail do Herdeiro morreu"); E2E com **duas contas descartáveis** (Guardião → Herdeiro) cobrindo Vigília, cancelamento, Investidura, dormência (com o relógio **injetado** para avançar 365/730 dias no staging) e Resguardo; **cenário de engenharia social**: alguém pede a conta por e-mail alegando ser filho → **o sistema não abre exceção** (B6a); **2–3 Pilot Handovers reais** entre voluntários (amigos/irmãos), rotulados "Pilot", **sem** vender como testado.
- **Reversão:** feature flags por etapa; a Investidura devolve ao **Resguardo** (nunca há "duas linhas abertas"); tudo aditivo. **Sem volta:** uma Passagem real concluída é um fato na Crônica (por isso só depois do G4).
- **Riscos e gatilhos:** (i) **engenharia social contra um dev solo** — `05` (a superfície é o dono) → **gatilho:** qualquer pedido de exceção vira "não" por escrito e é registrado; (ii) Pilots revelam falha de desenho → **parar 4b/4c** e corrigir 4a; (iii) capacidade (§10.4): 4a/4b competem com Era II e com rituais.
- **Portão G4 — portão da 1ª Passagem real:** ☐ 2 Pilot Handovers concluídos **sem incidente** ☐ MFA ativo ☐ escada de dormência testada com relógio injetado ☐ Chave em papel testada por não-autor ☐ o texto público diz "**testada em N Passagens piloto**", com N verdadeiro ☐ (para 4c) parecer sobre menores em mãos. **Se falhar:** as Passagens reais continuam **assistidas e raras**; o marketing não usa "sucessão" como ponto de venda.
- **Agentes, em ordem:** `legacy-systems-designer` (especificação; skill `intergenerational-design-philosophy` só para o vocabulário) → `backend-architect` (`successions`, Vigília, Investidura) → `security-engineer` (Cofre, MFA, engenharia social) → `gameplay-engineer` + `ui-ux-designer` (telas, UX para quem nunca jogou e para criança) → `mobile-platform-engineer` → `narrative-designer` + `localization` (textos) → `digital-succession-counsel` (menores, Commons, RMT — skill `digital-succession-compliance`) → `qa-lead` (as 15 corridas) → `community-manager` (recrutar e acompanhar os Pilots) → deploy.

---

## §7 — FASES 5 e 6 (mais curtas; só depois dos portões)

### Fase 5 — Conteúdo e Arquivo
- **Objetivo:** dar ao Legado **substância depois do 1º mês** (Era II) e transformar a Crônica em algo **exportável e verificável** (o Arquivo).
- **Entregas:** **Era II completa** (`07`: runas/elementos, gear, forja, overworld com POIs — reaproveita o que existe; prazo de `07` ≤ 6 meses); `relics`/`lineage_standings`/`/api/legacy/export` (`09` F5); durabilidade (`verify_chronicle.js`, `verify_ledger.js`, **teste de restauração trimestral**, âncora semanal em ≥ 3 testemunhas com ≥ 2 independentes do operador, **B10**; `09` F6); "Como reconstruir" v1 testado por **não-autor** (`04` D1); simulacro nº 1.
- **Estimativa:** **36–64 dias**: F5 4–6 + F6 3–5 + Arquivo/simulacro 4–8 + **Era II conteúdo 25–45 [HIPÓTESE — confiança muito baixa; `07` dá "40 h autorais", não dias de dev]**. **Ritmo A: 12–21 semanas.**
- **Decisões prévias:** **C2–C5, B12–B14**, e a decisão sobre **DC-6/DC-7** (as duas migrações escondidas, **R-15**) — se o dono aprovar, entram como passos do mesmo `migrate_legacy_*.js`, com `--confirm` e checksum.
- **Aceite:** o export de uma conta reimportado num Postgres limpo reproduz a Crônica e os hashes; restauração trimestral registrada na própria Crônica; Era II jogável por ≥ 3 jogadores reais sem parede; **harness reexecutado** com a nova `curve_version` se a Era II mexer na calibração (critério 11).
- **Reversão:** Era Pack é dado versionado (JSON + imagens, sem código executável, `07` B.6.5); desligar um Pack volta ao `Interlude`.
- **Riscos e gatilhos:** conteúdo atrasado → o `Interlude` absorve (não é emergência); **gatilho de replanejamento:** Era II não sai em 6 meses **e** ≥ 1 Linha atingiu a fronteira → priorizar Era II sobre 4b/4c.
- **Portão G5:** ☐ Arquivo verificado por restauração ☐ Era II jogável ☐ 1º relatório de "Saúde do Legado" ☐ decisão sobre a Era III (ver §11). **Agentes:** `level-designer` → `game-designer` → `concept-artist`/`2d-artist`/`technical-artist` → `gameplay-engineer` → `mobile-platform-engineer` → `qa-tester` (playtest) → `live-ops` (calendário) ∥ `backend-architect` + `tools-programmer` + `deep-time-archivist` (Arquivo).

### Fase 6 — Institucionalização
- **Objetivo:** tirar o projeto do CPF do dono e dar-lhe uma casa jurídica e uma licença (`06` D8/D9, `04` D3).
- **Entregas:** associação **antes da 1ª Passagem a não-familiar** (trilha escalonada: adjunto → associação → fundação quando houver dotação, **C16**); auditoria de titularidade (`assets2/`, música, `danger_dave_source/`) → **AGPL-3.0 + CC BY-SA 4.0 (C15)**, "nunca fechado sem escrow"; marca no INPI; testamento do dono com *break-glass* (`06` B.14 nº 10–12); simulacro anual.
- **Estimativa:** **5–10 dias de dev** (limpeza de assets/licença) + **tempo e dinheiro de terceiros** (advogado, contador, cartório). **Confiança: baixa** (depende de pessoas).
- **Portão G6:** ☐ entidade constituída ☐ licença publicada ☐ testamento/break-glass feitos ☐ simulacro nº 2. **Se falhar:** o jogo segue vivo, mas **o texto público não fala em "séculos"** sem adjunto e sem entidade — vale o que `04` chama de N3/N4 (arquivo e registro histórico) como plano B honesto.
- **Agentes:** `digital-succession-counsel` ∥ `deep-time-archivist` ∥ `publisher-bizdev` (relação com a entidade; **não presumir loja** — `CLAUDE.md` §8) ∥ `skills-curator` (atualizar as skills do Legado com o que a execução ensinou).

---

## §8 — O MVP do Legado

### 8.1 Definição em uma frase
**O menor conjunto que já entrega a fantasia e é seguro de lançar:** *o servidor mede o tempo (tempo autoritativo, `τ = 0`); a curva foi provada em Monte Carlo; as 48 contas viram Linhas na Era Zero (aditiva); a Crônica só registra eventos automáticos; a Linha pode designar um Herdeiro e guardar a Chave — mas a Passagem real espera o G4.*

Ele responde às três sensações de `07` B.7: **(1) "meu dia tem fecho"** (Selo, Fecho do dia), **(2) "estou numa história longa e vejo a estrada"** (Era, Anel, "The Long Road", Eras trancadas), **(3) "isto pode passar para alguém"** (Herdeiro + Chave + Crônica).

### 8.2 O que entra e o que fica de fora (com o porquê)

| Componente | MVP | Por quê / gatilho para entrar |
|---|---|---|
| Tempo autoritativo + sessão única + `τ = 0` + Banco de Vigília | **ENTRA** | Sem isto a régua é uma sugestão (`10` §6 risco 2: qualquer jogador zera o jogo com um pacote) |
| Curva Família B + harness 11/11 | **ENTRA** | Promessa de 1.121 anos não tem teste de produção; só simulação |
| Era Zero aditiva + Selo de Pioneiro + carta às 48 | **ENTRA** | Sem ela a régua "nasce mentindo" (contas de teste com nível inflado) |
| Linhagem + Guardião nº 1 + Crônica **automática** com hash C-01 | **ENTRA** | O hash é o único ponto sem volta técnico — decidir cedo, gravar pouco |
| Texto livre na Crônica (epitáfio, Carta ao Herdeiro, Cartas Seladas) | fora → **Fase 4b** | Exige consentimento por campo, moderação e Scribes (`08` R4; `10` R-24). **Gatilho:** parecer sobre consentimento + ≥ 2 moderadores |
| Designação + Chave do Legado + `commons_optin` | **ENTRA** | É o "isto pode passar para alguém"; guardar o campo agora custa nada e a pergunta é obrigatória (C-08) |
| **Passagem por interface** (resgate, Vigília, Investidura, MFA) | fora → **Fase 4a** | Nenhuma Passagem real é esperada por décadas; a assistida por script cobre o ano 1. **Gatilho:** Pilots ou uma família real querendo passar |
| Escada de dormência automática | fora → **Fase 4a** (com prazo: antes do 1º Sinal, ~6 meses após G3) | Precisa de e-mail (0-B) e ninguém fica dormente antes do relógio zerar na Fundação |
| Nível de Combate (B1) | **ENTRA** | O nível derivado do tempo faria o dano explodir em semanas |
| Rebalancear a Era I pelo TTK completo (`07` B.3.2) | fora → Fase 5 (só a **checagem mínima** entra) | Sem estimativa; o `qa-tester` valida a Era I como está |
| 4 Movimentos (fluxo/UI), Presságio v1, inscrição na arma (`07` #4, #6, #9) | fora → **MVP+** (Fase 5) | Nice-to-have; cada um é M/P e nenhum é requisito de segurança |
| Era II completa, Era III+ | fora | Era II: **≤ 6 meses** (Fase 5); Era III+: ver §11 |
| Estrada visível (Eras II–X trancadas) | **ENTRA** (só texto/arte) | Barata e entrega a sensação (2) |
| **Interlude** | **ENTRA** | Sem ele, o jogador rápido bate na parede no dia ~33 |
| Trocar valores das 333 badges (DC-6), converter os 139 personagens para Rank 1–100 (DC-7) | fora → Fase 5 (**R-15**: duas migrações a mais) | Ghosts secundários seguem como hoje; **gatilho:** decisão B12 + roteiro com checksum |
| Ranking por Linha, Mapa do Céu, Hall, Tributos | fora → ano 2 (`08`) | Três desenhos concorrentes ainda por unificar (R-19); `lineage_standings` como **dado**, `08` como **apresentação**, `03` como **regra** |
| Relíquias além do Selo de Pioneiro | fora → Fase 5 | Honoríficas e `transferable=false` |
| Export por conta (`/api/legacy/export`) | fora → Fase 5 (mas o **export por script** das 48 contas antes da migração **entra**) | O endpoint é portabilidade; o script é a rede de segurança |
| MFA | fora → **Fase 4a** | Obrigatório **antes da 1ª Passagem**, não antes do lançamento |
| Keystone / "zerar" | **NÃO EXISTE código** | Invariante: nenhuma Keystone antes de 3147-01-01 (**C-03/R-07**); o **contador nunca trava** e o teto de validação é **maior** que o de jogo |
| Chat MQTT como canal de rituais | não usar | "Public, unmoderated"; rótulo obrigatório (C13) |
| Convites de retorno (opt-in) | fora | Só depois de parecer + antibot (`10` C-14) |

### 8.3 O que NÃO pode ser cortado — 11 itens, cada um com o "porquê" de não negociar

| # | Item | Se cortar, o que acontece |
|---|---|---|
| N1 | **Integridade do tempo antes de anunciar** (autoritativo + sessão única + `τ = 0`) | A régua vira sugestão; o dono anuncia uma promessa que qualquer um zera em um pacote |
| N2 | **Harness 11/11** com as constantes implantadas | Erro de premissa custa séculos e só aparece em simulação (`02` §9.3) |
| N3 | **Sombra de 14 dias** antes de virar autoritativo | É a única forma de descobrir divergência sem afetar 48 jogadores reais |
| N4 | **Backup restaurado ≤ 24 h + adjunto nomeado + acessos em custódia** antes de anunciar | *Bus factor* 1; "nenhuma promessa de séculos é honesta antes disto" (`10` R-05) |
| N5 | **Era Zero aditiva com checksum, export prévio fora do Supabase e carta pessoal às 48** | Perda irreversível de progresso ou backlash que mata a comunidade inicial |
| N6 | **Regra de hash com vetores JS = Python antes do 1º evento** | É a única decisão do plano **sem conserto** (`10` C-01) |
| N7 | **Termos + Política + exclusão + aceite** (Bloco 1 de `06`) **e parecer sobre o art. 9º III antes de menores na régua** | Risco regulatório real (fiscalização nov/2026–jan/2027); menor na régua sem parecer é o pior cenário |
| N8 | **`MIN_CLIENT_VERSION` + APK assinado com chave de release** | APK antigo continuaria mandando XP no formato velho; assinatura debug não sobrevive a 2027 |
| N9 | **Invariantes de longo prazo:** teto de validação 1,01e11; nada de Keystone antes de 3147; Crônica **sem dado pessoal** e sem texto livre; `relics.transferable = false`; `credit_adjustment`; segundos como dado primário | Baratos agora, impossíveis depois (o teto exclusivo congelaria o jogador **no dia da Keystone**) |
| N10 | **Comunicação honesta:** "prometer o ritmo, não o futuro"; anunciar só após o G3; **não** dizer "testada" antes do G4 | Promessa lida como garantia vira sensação de fraude (`08` R13) |
| N11 | **Interlude + carta às 48** | Parede de conteúdo no dia ~33 e o "reset" mal comunicado são os dois riscos de *primeira impressão* |

---

## §9 — Sequenciamento por agente

### 9.1 Quem executa cada fase (nomes reais de `.claude/agents/`)

| Fase | Ordem de execução (`→` = depois de; `∥` = em paralelo) | Skills que carregam |
|---|---|---|
| **0-A** | `backend-architect` → `security-engineer` → `mobile-platform-engineer` ∥ `deep-time-archivist` + `tools-programmer` → `ui-ux-designer` → `qa-lead` → deploy | `e2e-db-verification`, `crossplatform-deploy`, `deep-time-preservation` |
| **0-B** | `backend-architect` → `security-engineer` → `network-programmer` + `ui-ux-designer` → `mobile-platform-engineer` → `tools-programmer` (staging/CDNs) → `qa-lead` → deploy | `e2e-db-verification`, `crossplatform-deploy`, `digital-succession-compliance` |
| **1** | `mp-orchestrator` → `progression-actuary` ∥ `security-engineer` ∥ `gameplay-engineer` ∥ `legacy-systems-designer` → `forensic-analyst` → `localization` → `game-director` → `producer` | `legacy-pacing-calibration`, `forensic-root-cause-analysis` |
| **2** | `backend-architect` → `security-engineer` → `network-programmer` + `gameplay-engineer` → `mobile-platform-engineer` → `ui-ux-designer` → `progression-actuary` (oráculo/replay) → `qa-lead` → deploy | `e2e-db-verification`, `crossplatform-deploy`, `legacy-pacing-calibration` |
| **3** | `backend-architect` ∥ `deep-time-archivist` ∥ `tools-programmer` → `security-engineer` → `game-economy-designer` + `game-designer` → `gameplay-engineer` + `ui-ux-designer` → `mobile-platform-engineer` → `narrative-designer` + `localization` → `community-manager` + `marketing` (rascunho) → `digital-succession-counsel` → `qa-lead` → **janela de migração** | as 4 do Legado + `e2e-db-verification` + `crossplatform-deploy` |
| **4** | `legacy-systems-designer` → `backend-architect` → `security-engineer` → `gameplay-engineer` + `ui-ux-designer` → `mobile-platform-engineer` → `narrative-designer` + `localization` → `digital-succession-counsel` → `qa-lead` → `community-manager` (Pilots) | `intergenerational-design-philosophy`, `digital-succession-compliance`, `e2e-db-verification` |
| **5** | `level-designer` → `game-designer` → `concept-artist` → `2d-artist` → `technical-artist` → `gameplay-engineer` → `mobile-platform-engineer` → `qa-tester` → `live-ops`; e `backend-architect` + `tools-programmer` + `deep-time-archivist` para o Arquivo | `deep-time-preservation`, `crossplatform-deploy` |
| **6** | `digital-succession-counsel` ∥ `deep-time-archivist` ∥ `publisher-bizdev` ∥ `skills-curator` | `digital-succession-compliance`, `deep-time-preservation` |

**Em todas as fases, quem fecha:** `project-manager` (sequência dos passos) e `game-director` (reconciliação final contra o pedido), e o `producer` (este agente) **replaneja em cada portão**. Escolha de modelo (`CLAUDE.md` §6): edição mecânica (comentários, cache-busting, renomear) → **Haiku**; servidor/banco/auth/protocolo do tempo/regra de hash → **modelo forte**; o restante → **Sonnet**. Não trocar de modelo no meio de uma tarefa.

### 9.2 As regras que valem para **toda** mudança que chega ao ar (não pule nenhuma)

1. **Plan Mode com o dono antes** de qualquer mudança de auth, banco ou nas duas plataformas (`CLAUDE.md` §7).
2. **Paridade web + mobile:** toda mudança em `js/game/` ou `js/web2/` é espelhada em `danger_ghost_mobile/www/js/...` **lendo o arquivo do mobile antes** (não são idênticos; copiar diff às cegas já causou bug). **Nunca** editar os arquivos soltos na raiz de `danger_ghost_mobile/` nem o `www/` morto dentro de `danger ghost/` (as duas pastas-armadilha, `CLAUDE.md` §3.5).
3. **APK novo:** `npx cap sync android` → `gradlew assembleDebug` (ou **release assinado** a partir do G0a) → copiar o APK para **os dois lugares** (`danger_ghost_mobile/DangerGhostMobile.apk` e `danger ghost/DangerGhostMobile.apk`) → **bump `?v=NN` de cada arquivo alterado no `index.html`, inclusive o link do APK** (senão o WebView e o navegador servem cache velho).
4. **Testar local antes de produção:** apontar `BACKEND_URL` do mobile para `http://localhost:3000`, e **`git diff` depois de reverter** para `https://ghostgames.club` — confirmar que a reversão ficou limpa.
5. **Git:** `danger ghost/` → commit, e **push só com o "sim" explícito do dono a cada vez**; `danger_ghost_mobile/` → **commit local somente** (histórico divergente do remoto; skill `crossplatform-deploy` §6). Dependência nova (`npm install` em `server/`, ex.: SDK de e-mail, biblioteca de TOTP, JCS) → `node_modules/` é gitignored, então o **deploy de produção precisa de `npm install`**.
6. **Deploy na VPS pelo console VNC (pegadinhas):** o teclado remoto **perde o Shift** → `~` vira `` ` ``. **Use caminho absoluto** `/home/becopro/danger-ghost/server`, nunca `~`; evite `_` e maiúsculas; **variáveis de ambiente em minúsculas** (`dbhost`, `jwtsecret`, e as novas: `emailapikey`, `hmacpepper`). Roteiro: `cd /home/becopro/danger-ghost/server` → `git pull` → `npm install` → `pm2 restart ghost` → `pm2 logs ghost --lines 20`. **O processo se chama `ghost`**, não `danger-ghost-server` (conferir com `pm2 list`). **Segredos (chaves de API, pepper) são colados pelo dono**; nenhum agente os digita.
7. **Migração transacional com `--confirm`:** `node migrate_xxx.js` (**simulação, escreve zero**) → conferir a saída e o checksum de controle → `pm2 stop ghost` (o `ALTER` pega `ACCESS EXCLUSIVE LOCK`) → `node migrate_xxx.js --confirm` (transação única) → verificação por checksum (o script sai com `exit 1` se algo divergir) → `pm2 start ghost` → 48 h de observação. **Sempre com dump restaurado ≤ 24 h.**
8. **Ordem de deploy:** **servidor primeiro** (aditivo, retrocompatível), **depois** os clientes; **nunca** ativar `MIN_CLIENT_VERSION` antes de o APK novo estar publicado e o link funcionando.
9. **Depois do deploy:** ler `pm2 logs` procurando erro de verdade (não o ruído de conexão/desconexão), e refazer o **E2E contra produção** com conta descartável — passar local não garante variáveis e build de produção.
10. **Docs no mesmo commit/sessão** que muda a arquitetura (`CLAUDE.md` §7): `ARCHITECTURE.md`, `CLAUDE.md`, `Gemini.md` — o `backend-architect` (servidor) e o `mobile-platform-engineer` (APK) atualizam ao fim de cada fase. Doc desatualizado já custou caro aqui (o comentário de `db.js` é o exemplo mais recente).

---

## §10 — Calendário, caminho crítico, paralelismo e orçamento de risco

### 10.1 Calendário sugerido (semanas/meses **a partir da aprovação**; sem datas falsas)

| Fase | Duração de trabalho | **Ritmo A** (3 d/sem) | **Ritmo B** (5 d/sem) |
|---|---|---|---|
| 0-A | 14–25 d | 5–8 sem | 3–5 sem |
| 0-B | 11–20 d | 4–7 sem | 2–4 sem |
| 1 | 6–10 d | 2–4 sem (espera) | 1,5–3 sem |
| 2 | 15–24 d **+ 14 d de sombra** | 5–8 sem (+2 de observação, sobrepostas) | 3–5 sem |
| 3 | 31–51 d **+ 7 d de aviso + 48 h de observação** | 10–17 sem | 6–10 sem |
| **MVP (0–3) — soma** | **77–130 d** | **25–43 sem ≈ 6–10 meses** | **15–26 sem ≈ 3,5–6 meses** |
| 4 | 47–73 d | 16–24 sem (4a: 7–11) | 9–15 sem (4a: 4–6) |
| 5 | 36–64 d | 12–21 sem | 7–13 sem |
| 6 | 5–10 d + terceiros | meses (depende de pessoas) | idem |

**Trilha externa (paralela, não consome dias de dev):** advogado contratado na **semana 1**; Termos até ~nov/2026; **parecer sobre art. 9º III** pedido na semana ~4 e esperado antes do G3 (ou menores em Aprendiz); Google (registro do Console) em paralelo à Fase 1; provedor de e-mail e DNS (SPF/DKIM) na Fase 0-B; **revisão do vocabulário por falante nativo** na Fase 1.

**Relógios externos [CÁLCULO]:** hoje → 31/12/2026 = **102 dias (14,6 semanas)**; hoje → 01/11/2026 = **42 dias (6 semanas)**; hoje → 01/01/2027 = **103 dias (14,7 semanas)**. A Fase 0-A **cabe** antes de 31/12 nos dois ritmos; **antes de 01/11 cabe no Ritmo B e, no Ritmo A, só no extremo baixo (4,7 semanas)** — por isso o advogado e o item 6 (Termos) saem primeiro dentro do 0-A.

### 10.2 O que roda em paralelo (e o que não)
- **Paralelo de verdade (pessoas/agentes diferentes):** Fase 1 (agentes) ∥ Fase 0-A (mãos do dono); advogado ∥ tudo; Google ∥ tudo; `deep-time-archivist` (hash/vetores) ∥ `backend-architect` (tabelas) dentro da Fase 3; comunicação (rascunhos) ∥ código na Fase 3.
- **Paralelo só porque é espera:** a **observação de 14 dias da sombra** — durante ela o dono faz a Fase 0-B e as tabelas da Fase 3. Um dev solo não escala em paralelo; ele **aproveita o tempo morto**.
- **Estritamente sequencial:** G1 → Fase 2 → G2 → Fase 3 → G3; backup restaurado **antes** de cada migração; servidor **antes** do cliente; vetores de hash **antes** do primeiro evento.

### 10.3 Caminho crítico
**Decisões A1–A5 → harness 11/11 → Fase 2 (tempo autoritativo) → 14 dias de sombra → hash + Era Zero + HUD → G3.**
O que **não** é caminho crítico e pode escorregar sem atrasar o lançamento: Android (mas tem prazo próprio: 31/12), Fase 0-B parcial (e-mail é crítico **só** se o G3 exigir verificação — não exige; exige exclusão e Termos), vocabulário, textos de Eras, Fase 5 inteira.

### 10.4 Capacidade depois do lançamento (o achado que faltava)

| Demanda no 1º ano pós-G3 [CÁLCULO] | Dias |
|---|---|
| Fase 4 (sucessão real) | 47–73 |
| Fase 5 (Era II + ranking/export/Arquivo) | 36–64 |
| Operação e rituais (`08` §6.2: ≈ 83 h) | ≈ 21 |
| **Total** | **104–158** |
| **Capacidade do ano** (52 semanas × 3 d = 156; × 5 d = 260) | **156 (A) · 260 (B)** |

No Ritmo A o ano **só cabe no extremo alto sem folga nenhuma**, e **Era III (60 h autorais, ≤ 12 meses em `07`) não cabe**. **Decisão do produtor:** com `τ = 0` a fronteira de conteúdo do jogador legítimo é `f ≈ 1,0 h/dia`, então a Era III só é exigida em **~1 ano** de jogo e o `Interlude` cobre o resto → **Era III é item do ano 2**, e só entra antes se o dono estiver no Ritmo B ou se aparecer ajuda.

### 10.5 Orçamento de risco consolidado

| Fase | O que pode dar errado (top 3) | **Gatilho para parar** | Reserva sugerida |
|---|---|---|---|
| 0-A | reinstalar APK apaga saves; CORS quebra o login do APK; restauração de backup falha | qualquer um dos três → parar o item e corrigir antes de seguir | +25% |
| 0-B | e-mail cai em spam; reset de senha vira vetor de tomada de conta; exclusão dá erro de FK | < 90% de chegada; `security-engineer` reprova; erro de FK no teste | +25% |
| 1 | dono indeciso; harness não fecha; varredura acha outro caminho de XP | > 3 semanas sem A1–A5; nenhuma calibração passa 11/11; novo caminho achado | +20% |
| 2 | dobro/perda de crédito; latência do pool; WebView diferente do navegador | > 1% divergência; p95 > 2 s; diferença web×APK > 5% | +40% (fase inédita) |
| 3 | checksum diverge; backlash das 48; parede de conteúdo; erro de hash; combate quebrado | qualquer divergência de checksum/hash; > 1/3 negativas; Interlude não testado | +40% |
| 4 | engenharia social; Pilots revelam falha; competição por capacidade | pedido de exceção; falha em Pilot; gasto > 1,5× | +40% |
| 5 | Era II atrasa; Arquivo não restaura | 6 meses sem Era II com Linha na fronteira; restauração falha | +50% (muito incerta) |
| **Global** | **estouro de escopo** | **gasto acumulado > 1,5× o extremo alto de qualquer fase ⇒ parar, replanejar com o dono e cortar o MVP+** | — |

---

## §11 — O que NÃO construir agora (e o gatilho para reconsiderar)

| # | Item | Por que **não** agora | Gatilho para entrar |
|---|---|---|---|
| 1 | **Eras III–X (conteúdo)** | 333 h autorais para 409.538 h de jogo (esticamento ~1.230×); com `τ = 0` a fronteira só chega em anos; o `Interlude` cobre. Construir cedo é pagar juros de conteúdo que ninguém vai ver | 1ª Linha a < 30 dias da fronteira da Era seguinte **e** Era anterior estável |
| 2 | **O Coro + Monumento jogável** (fim de jogo) | A Keystone é em 3147; o portão de calendário é invariante, **não** feature. Desenhar em papel só na Era VIII (`07` DC-12) | Décadas; só se o projeto sobreviver ao dono |
| 3 | **Blockchain própria** | Não existe (`CLAUDE.md` §2); o papel honesto é **carimbar 32 bytes**, nunca guardar o jogo (`04` §5, `05` §5.2, `09` §1.4 convergem). Testemunhas baratas (Internet Archive, Software Heritage, e-mail) já resolvem a âncora | critérios (a)–(d) de `04` §5 **e** G6 verde (**C19**) |
| 4 | **Keystone / "zerar" / Última Ronda** | Nenhuma Linha chega perto por séculos (a 1 h/dia, 8,9% do contador só na década 50 — `10` §2.3) | ~ano 3100 (portão `F` de `03` D11) |
| 5 | **Mapa do Céu, Hall of Keepers, Tributos entre Linhas** | 3 desenhos de ranking concorrentes ainda por unificar (R-19); exigem moderação pronta | ano 2 e ≥ 100 Linhas ativas (`08`) |
| 6 | **Temporadas** | "Nenhuma até o ano 3" (`08` D-L3): FOMO vira cobrança | ano 3 |
| 7 | **PvP normalizado / batalhas ghost-vs-ghost** | Só `07` DC-11 propôs; ninguém dimensionou | depois da Era II estável |
| 8 | **Reforge e Óleo da Lanterna** | Entram **com a 1ª Passagem** (`07` §MVP) | G4 |
| 9 | **Era Packs abertos a terceiros / curadoria da comunidade** | Precisa de formato estável, licença (G6) e moderação | G6 + Era II publicada como Pack |
| 10 | **`τ > 0`** (hora extra que rende) | Enfraquece a defesa do art. 9º III (`10` C-16) e é **generosidade**, que se pode dar depois (baixar seria punição) | **parecer escrito do advogado + antibot no ar** |
| 11 | **Convites de retorno (opt-in), Scribes, Curators** | `10` C-14; exigem consentimento específico e moderação | G4 + parecer |
| 12 | **Mercado / venda oficial de contas ou cosméticos** | Cria valor em dinheiro = RMT; loot box é proibida a menores (Lei 15.211 art. 20) | **nunca** sem o advogado (`06` Bloco 3) |
| 13 | **Ofuscação de cliente, *attestation*, biometria comportamental, CAPTCHA no meio do jogo** | `05` §7: "explicitamente NÃO recomendado, em nenhuma fase" | nunca |
| 14 | **Migração das 333 badges (DC-6) e dos 139 personagens (DC-7)** | 2 migrações escondidas (R-15) sem roteiro | Fase 5 + decisão **B12** |
| 15 | **Fundação / fundo patrimonial (Lei 13.800)** | Precisa de capital (US$ 270–400 mil no cenário C de `04`); a **associação** vem primeiro | G6 e dotação real |
| 16 | **`xp_total NUMERIC(40,0)` e XP acumulado** | Só faz sentido se o nível vier do XP; com **A4(a)** o dado primário são segundos | se o dono escolher **A4(b)** |

---

## §12 — Custos e dependências externas

> **Todos os valores em dinheiro são [HIPÓTESE]** (não pedi cotação; o dono tem os custos reais de VPS/Supabase/câmbio, e `04` D4 pede exatamente isso). Câmbio usado: **R$ 5,50/US$** [HIPÓTESE]. Preços de fontes de `04`: domínio ~US$ 16/ano; Supabase Pro US$ 25/mês (de páginas de terceiros, podem mudar).

### 12.1 Dinheiro — 1º ano (Fases 0–3)

| Item | Faixa | Nota |
|---|---|---|
| Supabase **pago** (piso recomendado, A11/B15) | US$ 300/ano | Plano gratuito pausa após ~7 dias sem atividade e não tem backup diário (`04`). **Só se o plano de hoje for gratuito** — o dono confirma |
| Backup em 2 armazenamentos (países diferentes) + monitor | ≈ US$ 250/ano | `04` cenário A |
| Domínio (pré-pagar 10 anos) | US$ 160 uma vez (vs US$ 16/ano) | **C18** |
| VPS (DeSoHosting — só o nome do provedor, **não** a blockchain) | **desconhecido** | O dono informa; provavelmente já é um custo fixo atual |
| E-mail transacional | US$ 0–240/ano | Faixa gratuita costuma bastar para 48 contas [HIPÓTESE]; provedor a escolher (**P8**) |
| Android Developer Console | US$ 0–25 (taxa de registro **não confirmada**; a conta de distribuição limitada é gratuita, `10` §1.1) | Conferir no console antes de pagar |
| **Advogado/DPO/contador** (Termos, Política, exclusão, parecer art. 9º III, consulta ANPD) | **R$ 5.000–20.000 ≈ US$ 900–3.600** | Sem cotação. É **o maior item**. Pedir **orçamento fechado por escopo** (lista de 28 perguntas de `06`) |
| Revisão do vocabulário por nativo de inglês | R$ 300–1.000 | 1 tarefa curta |
| **Total ano 1 [CÁLCULO]** | **≈ US$ 1.600–4.600 (≈ R$ 9.000–25.000)** | recorrente ≈ US$ 566–806/ano + domínio extra + jurídico |

**Anos seguintes:** o **piso de sobrevivência** (`04` N3/N4) é ≈ US$ 250/ano; **N1 mínimo** (jogo vivo) ≈ US$ 1.500/ano; entidade/contador/seguro leva a ≈ US$ 8.000/ano (`04` §2.1). **R-20:** `04` dimensionou o fundo para o **fracasso**, não para o **sucesso** (1.000 Linhas) — rever depois do G3.

### 12.2 Tempo do dono

- **Trabalho dirigido aos agentes:** MVP = 77–130 dias × ~4 h = **≈ 310–520 horas** [CÁLCULO]. No Ritmo A (12 h/semana) são **6–10 meses**; é um segundo emprego. **Este é o custo real do conceito** e o dono precisa saber antes de aprovar.
- **Ações que só o dono pode fazer (com as próprias mãos):** decidir A1–A11 (~2–3 h na reunião); **guardar a keystore em 2 lugares físicos**; **criar a conta no Console** (identidade); **colar segredos** no servidor via VNC; **enviar** a carta às 48 contas (e responder individualmente); **nomear o adjunto**; contratar e falar com o advogado (3–5 encontros de ~1 h); apertar o "sim" do `git push` a cada vez; testar o APK em aparelho real.
- **Operação e comunidade depois do lançamento:** ≈ 83 h/ano (`08` §6.2).

### 12.3 Provedores e dependências externas

| Dependência | Para quê | Risco / observação |
|---|---|---|
| **Supabase** | banco e imagens | pausa/perda; **réplica na VPS + export semanal fora** (B15) |
| **VPS (DeSoHosting)** + console VNC | servidor Node/PM2 | teclado remoto perde o Shift (§9.2) |
| **Registrador do domínio** | `ghostgames.club` | perder o domínio = **todo APK envia credenciais a um estranho** |
| **Google (Android Developer Console)** | registro do pacote + chave (2027) | prazo próprio; lead time da verificação **desconhecido** |
| **Provedor de e-mail transacional** | verificação, reset, escada de dormência | SPF/DKIM no DNS |
| **GitHub** (2FA) + **Internet Archive / Software Heritage** | código e âncora da Crônica | testemunhas independentes do operador |
| **Advogado (digital/LGPD/ECA Digital; depois sucessões e terceiro setor)**, **DPO/consultor**, **contador** | Bloco 1–3 de `06` | única fonte de decisão sobre menores e art. 9º III; **nada deste plano é aconselhamento jurídico** |
| **Falante nativo de inglês** | vocabulário do jogo | antes de travar termos |
| **Adjunto técnico + 1 pessoa não técnica** | *bus factor* | o dono **nomeia**; nenhum agente escolhe pessoas |

---

## §13 — Checklist de decisão para a reunião de aprovação (as 11 bloqueantes, em ordem)

> **Como usar:** leia a pergunta, responda com **a letra**. A coluna "recomendo" é a resposta consolidada de `10` (§(e)); se você concordar com todas, basta dizer **"aprovo todas as recomendadas"**. Marque quando cada uma trava.

| # | Pergunta (1 linha) | Opções | **Recomendo** | O que trava se você não responder |
|---|---|---|---|---|
| **A1** | Qual o formato da curva de nível? | (a) linear · (b) **suave** `20·H + (1e11−20T)(H/T)³` · (c) por partes | **(b)**, com as Eras ancoradas em **tempo**, não em nível | Fase 2 |
| **A2** | O que "3147" promete? | (a) 1 h todo dia · (b) **365 h/ano "quando der", margem `m≈0,90`** · (c) cada Linha tem a própria estrada | **(b) + (c)**; o que espera o calendário é a **Keystone**, não o contador | Fase 1 (harness) |
| **A3** | Quanto rende a hora extra no mesmo dia? | (a) **nada (`τ = 0`)** · (b) 10% · (c) 20% | **(a) no lançamento**; sobe só após parecer + antibot | Fase 1 |
| **A4** | O nível do legado vem do XP do cliente ou do tempo medido pelo servidor? | (a) **tempo creditado no servidor** · (b) XP validado no servidor | **(a)** — é a decisão de maior alavancagem do plano | Fase 2 |
| **A5** | A régua é da pessoa ou da **Linha**? | (a) **Linha** · (b) pessoa | **(a)** (a família em turnos é o caso de uso central; resolve R-02/R-04) | Fase 1 |
| **A6** | Qual a regra de hash da Crônica? *(sem volta)* | (a) concatenação · (b) `BYTEA` · (c) **RFC 8785 + prefixo, de `04`** | **(c)** | **Fase 3 (antes do 1º evento)** |
| **A7** | O que acontece com os ~139 personagens atuais? | (a) preservar · (b) remapear · (c) **Era Zero + Selo de Pioneiro** | **(c)** | Fase 3 |
| **A8** | Menores entram na régua? *(exige parecer escrito)* | (a) **sim, com S1–S12 + kill-switch** · (b) só 18+ · (c) "Aprendiz" | **(a) com (c) pronto como plano B**; **até o parecer, menor declarado = Aprendiz** | Fase 3 (kill-switch e idade) |
| **A9** | Linha sem herdeiro pode ser adotada por um estranho? | (a) **sim, só com opt-in** · (b) automática após 5 anos · (c) não | **(a)** — o Commons é o que torna o conceito viável (R-03) | Fase 3 (campo) / Fase 4c (mecânica) |
| **A10** | Android: registrar-se e criar **chave de release**? *(vale sem o conceito)* | (a) **registrar + chave própria** · (b) só conta limitada + web · (c) tirar o APK | **(a) até 31/12/2026, com (b) em paralelo** | **Fase 0-A (agora)** |
| **A11** | Backup verificado + segunda pessoa com acesso? *(vale sem o conceito)* | (a) **dump diário para 2 destinos + adjunto, antes de qualquer migração** · (b) só antes da 1ª · (c) confiar no Supabase | **(a)** | **Fase 0-A (agora)** |

**Proposta de duas reuniões (P7):** **Reunião 1 (agora):** A10, A11, A1–A5 — destravam as Fases 0, 1 e 2. **Reunião 2 (no portão G2):** A6–A9 — só são necessárias quando alguém for gravar Crônica, migrar contas ou tratar menores, e o dono já terá visto a sombra funcionando.
**Duas leituras obrigatórias antes de responder:** (1) a **tabela de sobrevivência da Linha** (R-03: para 50% de chance de *alguma* Linha chegar a 3147 com 90% de sucesso por Passagem são ~80 Linhas; hoje há 48 contas); (2) o **custo em horas do MVP** (§12.2).

---

## (c) Lacunas que eu fechei

1. **O item 12 do checklist do brief (roadmap único):** fundi `09` F0–F6, `04` D0–D4, `07` Horizonte de Conteúdo e `08` MVP do ano 1 em **um** grafo de dependências, com as dependências cruzadas declaradas (§1.2–§1.3) e três correções de sequência.
2. **A separação pedida entre "vale de qualquer jeito" e "só com o conceito":** Fase 0 (25–45 d) × Fases 1–6, com marcação de qual item da Fase 0 é também pré-requisito do conceito.
3. **Reconciliação das três escalas de estimativa** (`09` 27–41 d, `05` 5–7 sem, `03` +36–56 d) e explicação de por que o "MVP técnico de 12–19 dias" de `09` é cerca de 4× (2,7–7×) menor que o trabalho real do conceito até o lançamento (§0).
4. **Definição do MVP** com justificativa de cada corte, gatilho de entrada de cada item fora, e **11 itens não cortáveis** (§8).
5. **Capacidade do 1º ano pós-lançamento** (104–158 d vs 156 d): decide que **Era III é ano 2** (§10.4). Nenhum relatório somou as demandas concorrentes de um dev só.
6. **Parede de conteúdo no dia ~33** (Era I = 33 h com `f = 1`) → `Interlude` entra no MVP (§5, §8.3 N11).
7. **Relógio de silêncio × escada de dormência:** o 4a tem prazo derivado (Sinal aos 180 d após o Dia da Fundação) — ou o relógio começa quando a escada existir (proposta).
8. **`xp_total NUMERIC` sai da Fase 2** se A4(a)+A1(b) forem aprovadas (§1.3 nº 2); **B1 (Nível de Combate)** entra no MVP pela razão certa (dano ~1,4e8 no ano 1 sem ele), não pela do 2^53, que só chega por volta do ano 150 (L ≈ 2,5e8) **[CÁLCULO]**.
9. **Divisão da reunião de decisão em duas** (A10/A11/A1–A5 agora; A6–A9 no G2) sem perder a segurança do "bloqueante" (P7).
10. **Modo sombra** como fase própria com E2E numerado (T1–T9), uso do Monte Carlo como **oráculo de replay** e critérios numéricos de parada.
11. **Verificação hoje (leitura, sem tocar em nada):** comentários de `db.js` ainda obsoletos (L59, L444); `build.gradle` do APK sem `signingConfig` no `release`; **zero** ocorrências de `token_epoch`/`revok` em `server/*.js`; `NUMERIC_BOUNDS` com `level [1, 1e11]`, `score [0, 1e16]`, `time [0, 1e8]`.
12. **As regras de deploy** (paridade, APK, cache-busting, VNC, `--confirm`) viraram checklist de 10 itens aplicável a toda fase (§9.2), incluindo a nova pegadinha: **variáveis de ambiente novas em minúsculas e sem `_`**, coladas pelo dono.

## (d) Lacunas que dependem de outros departamentos

| Para quem | O que preciso |
|---|---|
| **o dono** | **P1** (ritmo real 3 ou 5 dias/semana) — muda o calendário inteiro; **A1–A11**; autorizar as 3 consultas somente-leitura; dizer o **plano do Supabase**, os **custos reais** (VPS, domínio, câmbio) e **quais contas são de teste**; **nomear o adjunto**; a **data** em que `migrate_level_bigint.js` rodou (para corrigir os comentários) |
| **`progression-actuary`** | refazer `02` com as 23 correções relevantes; harness v1 **11/11**; **definir o teto do Banco de Vigília** (30 h × 7 d); confirmar que A1(b) satisfaz o requisito de `07` DC-3 (C-02); **implementar o oráculo/replay** da Fase 2 |
| **`backend-architect`** | confirmar/estimar a Fase 2 no servidor (5–8 d?) e se `xp_total NUMERIC` pode sair; **medir `pg_relation_size` numa cópia** (C-12: 91–117 MB/linhagem, não 33); ordem noturna `sealDay → verify → dump → exportação → âncora` (`04` 8.2 #8) |
| **`game-designer` + `gameplay-engineer`** | **estimar em dias** a normalização do combate e a Era I (ninguém o fez; é o item mais subestimado); varredura de `state.level =` |
| **`mobile-platform-engineer`** | (1) o que se perde ao reinstalar com assinatura nova; (2) `visibilitychange` no WebView (R-18); (3) o app é instalável como PWA?; (4) **a regressão do botão de pulo continua aberta?** (memória do projeto a marca como prioridade nº 1 do mobile; **não verifiquei se ainda está aberta**) |
| **`security-engineer`** | reproduzir o exploit #1 no staging; revisar heartbeat/janela de ociosidade; revisar reset de senha (vetor de tomada de conta); fechar C-09 (SHA-256 da Chave) |
| **`digital-succession-counsel` + advogado real** | Termos/Política; **parecer sobre art. 9º III** (a pergunta formulada em `10` §2.4, condicionada a `τ`); ECA Digital (aferição de idade aceitável, quando começam as sanções); consentimento da Crônica; menores; **GDPR** para herdeiros fora do Brasil (R-16); o **teor exato do decreto** (fonte primária, que `10` não conseguiu abrir) |
| **`legacy-systems-designer`** | especificar a **Passagem assistida por script** do MVP; decidir **quando o relógio de silêncio começa**; reemissão obrigatória da Chave (R-06) e procedimento de exclusão (R-11/R-21) |
| **`live-ops` + `community-manager`** | **reancorar `08`**: os "M0–M12" dele partem da aprovação; no meu calendário a página pública é o **G3**. Pilot Handovers só depois do 4a |
| **`deep-time-archivist`** | vetores de teste do hash; 2ª implementação (Python); envelope de custódia com keystore e Console (`10` §1.3 A4) |
| **`qa-lead`** | escrever a suíte E2E ponta-a-ponta do tempo autoritativo (T1–T9) e as 15 corridas da Fase 4 |
| **`game-director`** | incorporar este roadmap à síntese final e validar contra o pedido original |

## (e) DECISÕES PARA O DONO (as do produtor — além de A1–A11)

**P1 — Qual é o seu ritmo real de trabalho?**
- (a) **3 dias/semana (12 h focadas)** — MVP em 6–10 meses. (b) 5 dias/semana (20 h) — 3,5–6 meses. (c) menos que (a) — o calendário estica proporcionalmente.
- **Recomendação: declare (a) e replaneje em cada portão.** Prometer o prazo do Ritmo B e entregar o A gera culpa; e culpa é exatamente o que o conceito diz que não vai criar.

**P2 — Fazer a Fase 0 mesmo que o conceito seja rejeitado?**
- (a) **Sim, começar o 0-A esta semana** — os relógios (Android, ECA Digital) não esperam decisão. (b) Só depois de aprovar o conceito. 
- **Recomendação: (a).** Nenhum item do 0-A depende do conceito; adiar só encurta a margem dos prazos externos.

**P3 — Tamanho do MVP.**
- (a) **MVP enxuto** (§8): tempo autoritativo + Era Zero + Crônica automática + designação/Chave, Passagem assistida. (b) **MVP+** (acrescenta 4 Movimentos, Presságio, inscrição na arma, Era II completa): +25–45 dias. (c) **Só sombra** por 6 meses (mede o tempo, não lança o Legado): custo mínimo, mas não entrega a fantasia.
- **Recomendação: (a)**, com (c) como retirada honrosa se o dono achar o custo em horas (§12.2) alto demais no G1.

**P4 — Quando anunciar?**
- (a) **Só após o G3** (carta às 48 → 48 h → página pública). (b) Antes, para "testar interesse".
- **Recomendação: (a).** `08` R6: "anunciar antes da integridade" é o risco em que um pacote adulterado zera a régua diante do público.

**P5 — Quem é o adjunto?** Preciso que você **nomeie** uma pessoa técnica de confiança (e uma não técnica). Sem ela o G0a e o G3 não fecham (`04` D6, `10` R-05). **Recomendação: nomear na semana 1** — ela não precisa saber programar, só precisa ter acesso de emergência ao cofre de senhas.

**P6 — Contratar o advogado agora?** **Sim, semana 1**, com escopo fechado: Termos, Política, canal do titular, exclusão, e a **pergunta sobre o art. 9º III** (§(d)). O parecer tem prazo que você não controla; começar tarde é o que atrasa o G3.

**P7 — Reunião em duas partes** (A10/A11/A1–A5 agora; A6–A9 no G2)? **Recomendação: sim** — reduz a carga de decisão sem abrir mão da segurança.

**P8 — Duas escolhas técnicas baratas:** (i) **provedor de e-mail transacional** (escolher por custo e entregabilidade, com faixa gratuita suficiente para 48 contas); (ii) **staging = segundo projeto Supabase** (recomendo, curva de aprendizado menor) **ou** Postgres local em Docker. **E a regressão do botão de pulo no mobile:** recomendo **resolver antes da Fase 2** — um jogador que não consegue pular não gera evento de gameplay qualificado, e o heartbeat do mobile é testado em cima desse controle.

**P9 — Modo Aprendiz como padrão até o parecer?** **Sim** para quem se declarar menor no cadastro (é o plano B de `06` D1-C, já pronto). Contas de idade desconhecida (as 48 atuais) ficam **na régua** com S1–S12; o dono confirma que conhece pessoalmente os jogadores atuais.

## (f) Riscos e o que eu NÃO consegui verificar

**Riscos deste roadmap (ditos antes que alguém descubra):**
1. **Todas as estimativas de dias são [HIPÓTESE].** Onde `09`/`03`/`05` deram números eu os usei e **apliquei correções de paridade (×2 no cliente) e de E2E**; onde ninguém deu (combate, Era II) chutei com faixa larga e marquei confiança baixa/muito baixa. **A Fase 2 é a de maior incerteza real:** é a primeira vez que o projeto mede tempo no servidor.
2. **O ritmo do dono é desconhecido.** O calendário inteiro depende de P1.
3. **A capacidade é de uma pessoa.** Adoecer, mudar de emprego ou perder o interesse por 2 meses **é** o cenário base de um projeto solo de vários meses — não é exceção. Por isso cada portão tem "retirada honrosa" (a Fase 0 sobrevive sozinha; a sombra sobrevive sozinha; o MVP é reversível).
4. **Os custos em reais/dólares não têm cotação.** Advogado e DPO são a faixa mais incerta.
5. **Não reproduzi nenhum achado contra o banco real** (proibido no modo PLANO). Os comentários de `db.js`, o `build.gradle` e a ausência de `token_epoch` são leitura de código.
6. **Confiança nos números que herdei de `10`:** curva, "faltar 1 dia a cada 20 custa 60 anos", sobrevivência de Linha (R-03) — não os recomputei (usei o que `10` verificou); **os cálculos novos são só de agregação** (somas de dias, semanas, custos, capacidade, datas) e estão no script de scratchpad.
7. **O limiar de vários gatilhos (1% de divergência, p95 < 2 s, 90% de e-mail entregue, 1/3 de respostas negativas) é meu palpite** — servem para forçar uma decisão consciente, não são padrão da indústria.

**Não consegui verificar / li só em parte (declaro para que ninguém suponha que li tudo):**
- **Li integralmente:** `00_BRIEF.md`, `CLAUDE.md`, `10_auditoria_adversarial.md`, o `producer.md` e a skill `crossplatform-deploy`.
- **Li em parte** (só as seções pedidas): `09` (§0, §4–§7, (c)–(f); **não** li §1–§3 em detalhe); `07` (topo, B.6, B.7); `05` (§7 e a lista de decisões; **não** li §1–§6); `06` (B.1, B.2, B.14, decisões); `04` (as decisões, D0–D4 e §8.4; **não** li §1–§7); `03` (§8, §9; **não** li §0–§7); `08` (§6); `02` (§5.4, §6.1, §9). **Não li `01_filosofia.md`.** Se houver contradição fora do que li, ela não está neste roadmap.
- **Não sei:** o plano contratado do Supabase; se existe backup hoje; a data em que `migrate_level_bigint.js` rodou; o custo real da VPS; se o jogo é instalável como PWA; **se a regressão do botão de pulo ainda está aberta**; o lead time de verificação do Google; se a taxa de registro do Console existe e de quanto; **quanto** o advogado cobra.
- **Não verifiquei o texto primário do Decreto 12.880** (`10` já registrou que `planalto.gov.br` recusou a conexão); a data de "fiscalização nov/2026–jan/2027" vem de `06` (ANPD e um escritório divergem; usei a mais rigorosa).
- **Não medi** latência, tamanho de tabela real, nem o comportamento do WebView.

**Declaração final.** Nenhum arquivo do jogo foi alterado. Nenhuma migração foi executada. Nenhuma consulta foi feita ao banco de produção. Nenhuma credencial foi lida. O único arquivo criado no repositório é este; o script de cálculo (`roadmap_calc.js`) ficou no scratchpad da sessão, fora do repo do jogo.

*Fim do relatório.*
