# 04 — Durabilidade: sobreviver, degradar com dignidade, poder ser recriado

Agente: `deep-time-archivist` · Data: 2026-09-20 · Modo: **PLANO** (nada do jogo, do banco, das credenciais ou de produção foi tocado; scripts de teste ficaram no scratchpad da sessão: `dt_limits.js` e `dt_funding.js`).

> **Aviso.** Este documento é planejamento técnico e de risco. **Não é aconselhamento jurídico, contábil nem financeiro.** Tudo o que envolve entidade jurídica, testamento, licença, LGPD, impostos e contratos precisa ser validado por advogado(a) e contador(a) habilitados (o agente `digital-succession-counsel` cobre o mapa jurídico; este relatório só aponta *onde* o profissional é indispensável).
>
> **Legenda.** **[VERIFICADO]** = conferi agora (arquivo lido, comando rodado, ou pesquisa/fetch feito em 2026-09-20; a fonte vai ao lado). **[CÁLCULO]** = conta feita em Node (script citado). **[HIPÓTESE]** = estimativa/juízo meu; o dono deve confirmar ou substituir por dado real. **[M]** = conhecimento geral que não re-verifiquei hoje. **[NÃO VERIFICADO]** = não consegui ver (ex.: painel da VPS, do Supabase, do registrador).

> **Alinhamento (revisão de 2026-09-20, após ler `raw/01_filosofia.md`, `raw/03_sucessao_cronica.md`, `raw/05_integridade_antiabuso.md` e `raw/09_arquitetura_migracao.md`).** Este relatório foi reaberto para casar com os quatro. A seção **8** lista onde **concordo** e onde **discordo explicitamente**. Resumo das discordâncias: (i) as três definições de hash da Crônica (05, 09 e o `custody_log` de 03) são diferentes entre si e a de 09 concatena campos sem separador (mostro a colisão em Node); (ii) o dimensionamento de 09 (33 MB/linhagem/1.121 anos) fica **~3,5× abaixo** do que a própria tabela dele ocupa no Postgres (~117 MB com hashes em `TEXT`); (iii) 09-D1 "A" (o e-mail do fundador fica como login para sempre) é aceitável como **passo**, não como estado final; (iv) 05 propõe Twitter/Telegram como âncora externa — aceito como conveniência, **não** como testemunha; (v) 05 sugere Argon2id/bcrypt para a Chave do Legado de 256 bits — para segredo de alta entropia, SHA-256 basta e **não envelhece**.
>
> **Colisões de vocabulário (regra: o inglês oficial é de `01`).** No jogo, quem detém a linha é **Keeper** (PT: Guardião) — por isso o texto em inglês abaixo diz "Keeper", não "Guardian". `01` proíbe `Custodian` (em inglês americano lê-se "zelador"), e `03` já usa **Custódia** (maiúscula) como *estado* de uma linhagem órfã e **Custodiante** como o adulto responsável por um menor. Por isso, neste relatório: **"mantenedor do arquivo"** (EN: *archive holder*) = quem guarda uma cópia ou uma fração de segredo; **"guarda de cópias"** = o que antes chamei de plano de custódia; e "custódia", em minúscula, só aparece no sentido geral. **Estados de linhagem de `03` (Ativa → Dormente → Custódia → Arquivada) e níveis de serviço N1–N4 daqui são eixos diferentes** — a tabela de correspondência está em 2.1.

---

## (a) Resumo em 10 linhas

1. **Ninguém garante 1.121 anos** (409.538 dias até 31/12/3147 **[CÁLCULO]**). O plano promete três coisas menores e verdadeiras: **sobreviver** às falhas previsíveis, **degradar com dignidade** (nunca perder em silêncio) e **poder ser recriado** por um estranho com o arquivo e um documento.
2. O elo mais fraco é **o operador**: dev solo, cartão pessoal, segredos que só existem na VPS/na máquina dele (`.env*` e `server/.jwtsecret` estão no `.gitignore` **[VERIFICADO]**), nenhum backup automático visível no repositório, nenhuma licença, nenhum segundo humano com acesso.
3. **Urgente (10 dias):** em **30/09/2026** o Android começa a exigir registro de desenvolvedor para instalar apps fora da loja **no Brasil** **[VERIFICADO: developer.android.com/developer-verification]**; o APK do jogo é distribuído pelo site e é assinado com a chave *debug* da máquina do dev **[VERIFICADO: sem `signingConfigs` no `build.gradle`; existe `~/.android/debug.keystore`]**.
4. **Achado de segurança que nasce da durabilidade:** o APK tem `https://ghostgames.club` fixo dentro dele. Se o domínio expirar e um estranho o registrar, **todo APK instalado passa a enviar e-mail e senha para o estranho**. O domínio é a camada mais barata (~US$ 16/ano) e a mais perigosa de perder.
5. **Quatro níveis de continuidade** (N1 jogo vivo → N2 congelado/somente leitura → N3 arquivo consultável estático → N4 registro histórico em texto puro), cada um com custo, gatilho de descida e aviso mínimo. **Descer nunca apaga**: cada descida gera um instantâneo com hash.
6. **Arquivo do Legado**: JSON + SQLite + CSV + Markdown/PDF-A, UTF-8, `format_version`, dicionário de campos, fórmulas com implementação de referência em texto, números grandes (`xp_total` de 3,64e28) como **string decimal**, manifesto SHA-256, README em PT e EN, ≥3 cópias em ≥2 provedores + 1 offline + 1 instituição. **Sem e-mail e sem hash de senha dentro do arquivo.** O envelope de exportação é o de `09` (§5.1), com **uma regra de hash única e sem ambiguidade** (seção 8.2) e âncora semanal em ≥3 testemunhas.
7. **Sucessão em degraus** (custa pouco no começo): adjunto nomeado + "Como reconstruir o jogo" + segredos por compartilhamento (3 de 5) → associação → fundação/fundo patrimonial (Lei 13.800/2019) quando houver capital → doação do arquivo a instituições. **Financiar primeiro o piso (N3/N4 ≈ US$ 8–12 mil de principal)**, o jogo vivo depois.
8. **Limites técnicos** (testados em Node): Y2038 **não** afeta `Date` do JS nem `timestamptz`; **afeta** qualquer coluna `int4`. O jogo tem colunas `INTEGER` que serão o problema real: `total_kills`, `total_items_collected`, `total_lives_collected`, `deaths`, e os `SERIAL`. Ano 10000 quebra a serialização ISO (`+010000-…`).
9. **Blockchain própria futura**: no máximo *uma testemunha* (âncora de hash da Crônica), nunca o armazém. **Nada a ver com a DeSo removida.** Entra só depois de o arquivo, a entidade e o financiamento existirem; até lá, testemunhas baratas já existentes (repositório, Internet Archive, e-mail aos mantenedores, carimbo de tempo aberto).
10. **Teste dos 50 anos: 0 de 10 itens "sim", 3 "parcial", 7 "não"** (seção 6). Cada "não" virou risco com dono e data. Simulacro anual de restauração definido, com critérios de aceite numéricos.

---

## (b) Análise e proposta

### 0. Como este relatório foi feito (método, em 5 linhas)

- Li a persona, a skill `deep-time-preservation`, o brief, `CLAUDE.md`, `ARCHITECTURE.md`, `HANDOVER.md`, `SAVE_SYSTEM_MASTER_PLAN.md`, `server/db.js` (trechos), `server/package.json`, `deploy.sh`, `setup-https.sh`, `capacitor.config.json`, `android/app/build.gradle`, `index.html` (só as URLs externas) e o estado do `.git` (somente leitura).
- Rodei experimentos de limites em Node v24.15.0 (`dt_limits.js`) e de aritmética de custo/tamanho (`dt_funding.js`).
- Pesquisei (2026-09-20): Android developer verification, Node EOL, Let's Encrypt, Supabase, SQLite, PostgreSQL, Domesday, Software Heritage, GitHub Arctic Vault, Surety/NYT, NIST IR 8547, Lei 13.800/2019, Código Civil arts. 62/66, Franklin, Thellusson, Kongō Gumi, limite de 10 anos de domínio, Y2038 no Android/Linux.
- **Não consultei produção** (regra do brief). Tudo o que depende de dado real vai para a lista de "o que preciso que o dono me diga" na seção (f).
- Apliquei em mim mesmo o hábito da skill `forensic-root-cause-analysis`: para cada ameaça, a cadeia causal e a caça a "irmãos" do mesmo formato (um fornecedor / uma pessoa / um arquivo). A tabela de irmãos está em 1.4.

### 1. Inventário do que precisa sobreviver e matriz de risco por camada

#### 1.1 Inventário (o que, onde vive hoje, até quando queremos que dure)

Quatro faixas de tempo (da skill): **Eng.** 1–5 a · **Inst.** 5–50 a · **Cust.** 50–200 a · **Cult.** 200–1.100 a. Em cada linha, "faixa-alvo" é a promessa que o plano tenta fazer; não é "tudo, para sempre".

| # | O que | Onde vive hoje **[VERIFICADO]** salvo indicação | Faixa-alvo | Observação |
|---|---|---|---|---|
| 1 | **Estado do jogo das contas** (ghost, nível, xp, atributos, itens, badges, ghostdex) | Postgres/Supabase: `players` (13 col.), `characters` (25 col.), `player_badges`, `player_stat_progress` (`SAVE_SYSTEM_MASTER_PLAN` §1 item 7) | **Cust.** (registro) / Inst. (serviço vivo) | Sem dado pessoal; é o que deve poder sobreviver ao resto |
| 2 | **Identidade das contas** (e-mail, hash bcrypt, IP, nome) | mesma base; **a chave primária de `players` é o próprio e-mail** e `characters` tem `PRIMARY KEY (email, character_id)`, `ON DELETE CASCADE` | **Inst.** (≤ 50 a), *nunca* no arquivo público | Dado pessoal. Ver 2.4: a identidade da conta precisa virar um `account_id` opaco |
| 3 | **Crônica / Livro do Legado** (+ livro-razão de tempo `playtime_daily`, `custody_log`) | **não existe em produção**; desenhada em `03` §3 (texto) e `09` §1.4–1.5 (tabelas `chronicle_events`, `playtime_daily`) | **Cult.** | O bem mais precioso e o mais barato de guardar (texto). O livro-razão de dias selados é a **prova**; a Crônica é a **história** — as duas entram no Arquivo |
| 4 | **Regras de cálculo** (XP `100·L^1,45`, HP `L^1,90`, dano `L^1,85`, teto 1e11, `NUMERIC_BOUNDS`, catálogo de 333 badges e 101 espécies) | `rpg_system.js`, `server/db.js`, `data/` | **Cult.** | Precisam existir como **texto versionado + implementação de referência**, não só como código do jogo |
| 5 | **Código** (cliente ~1,1 MB de JS em `js/`, `rpg_system.js`, `index.html`, `server/`) | GitHub `becopro/danger-ghost` (1 conta pessoal, 637 commits, todos do mesmo autor) + máquina do dev | **Cust.** | Sem `LICENSE` na raiz (ver 3.4) |
| 6 | **Assets** (art ~26 MB `assets/`, ~13 MB `Ghosts/`, ~4,7 MB `UI/`, música `Ghostly Quest 8-Bit.mp3`) | repo + máquina | **Cust.** | **Nenhum arquivo de créditos/licença de assets na raiz** (busca por `credit/attrib/licen/notice/copying` = vazio); `assets2/` é um "protótipo Dangerous Dave" (`docs/AAA_MASTER_PLAN_2026-09-15.md` linha 118). Procedência a limpar antes de abrir |
| 7 | **Imagens enviadas por jogadores** (avatar/galeria) | **Supabase Storage** (`uploadBufferToSupabaseStorage`, `server/index.js`), URLs públicas gravadas no banco | **Inst.** | Dado pessoal + segundo elo de Supabase; sem cópia, somem juntas com o projeto |
| 8 | **Domínio `ghostgames.club`** | registrador **[NÃO VERIFICADO]** | **Inst.** (por renovação) | Não é "preservável": só se renova. Máximo de 10 anos por pagamento **[VERIFICADO: ICANN, via busca]** ⇒ **113 renovações** até 3147 **[CÁLCULO]** |
| 9 | **Servidor** (VPS no provedor "DeSoHosting" — só o provedor —, Node + PM2, nginx, certbot) | VPS **[NÃO VERIFICADO: SO, versão do Node, backups]** | **Eng.**/Inst. | Deve ser *reconstruível* a partir de documento, não "preservado" |
| 10 | **Segredos/chaves**: nomes das variáveis (`dbhost`, `dbport`, `dbuser`, `dbpass`, `dbname`, `DATABASE_URL`, `jwtsecret`, `supabaseurl`, `supabaseservicerolekey`, `GOOGLE_CLIENT_ID`, `PORT`), `server/.jwtsecret`, keystore Android, logins do registrador/host/GitHub/Supabase, sementes de 2FA | `.env*` e `server/.jwtsecret` fora do git **[VERIFICADO: `.gitignore`]**; keystore `~/.android/debug.keystore` **[VERIFICADO: existe]** | **Inst.** | Só *nomes* de variáveis podem ir para documento; valores nunca. A maioria deve ser **rotacionável**; só o que identifica (chave de assinatura, controle do domínio) precisa ser *preservado* |
| 11 | **Documentação** (`docs/*.md`, `CLAUDE.md`, ~49 arquivos em `.claude/agents` e skills) | repo | **Cust.**→Cult. | Parte da memória institucional do projeto mora em arquivos escritos para agentes de IA; o documento de reconstrução tem que ser legível **sem** IA nenhuma |
| 12 | **Histórico git** | `.git` local: **4,60 GiB de objetos soltos**, 4 arquivos `.idx` sem `.pack` correspondente, 5 arquivos de lixo; `git fsck --connectivity-only` acusou só objetos "dangling" (nenhuma conectividade quebrada) **[VERIFICADO]**; 16 alterações não commitadas | **Cust.** | Repositório saudável, mas inchado por APKs de ~42 MB commitados; risco de rejeição de push por tamanho **[HIPÓTESE, não conferi o GitHub]** |
| 13 | **Canais de aviso** (X `@GhostGamesnit`, Telegram, YouTube) | terceiros | — | Nunca podem ser o *único* lugar de um aviso de encerramento |

#### 1.2 Achados de campo que mudam o plano (evidência, não opinião)

| ID | Achado | Evidência | Efeito na durabilidade |
|---|---|---|---|
| E1 | O APK é **assinado com a chave debug** e construído com `gradlew assembleDebug`; `release` existe no Gradle mas sem `signingConfigs` | `danger_ghost_mobile/android/app/build.gradle` (grep) + `ls ~/.android` | Se `debug.keystore` se perder, ninguém consegue publicar atualização que instale *por cima*. É uma chave de identidade na máquina de uma pessoa |
| E2 | `deploy.sh` instala **Node 20** (EOL em 30/04/2026), instala `sqlite3` (aposentado na migração), cria o processo PM2 com o nome `danger-ghost-server`, enquanto a skill `crossplatform-deploy` diz que o processo se chama `ghost` | `server/deploy.sh` linhas 5–45; skill; busca Node | O único script de "provisionar do zero" está **defasado** e **contradiz** a documentação. Quem reconstruir por ele monta um servidor errado |
| E3 | `setup-https.sh` registra o certbot com o e-mail `contato@ghostgames.club` (uma caixa **dentro do próprio domínio**) e o Let's Encrypt **parou de enviar avisos de expiração em 04/06/2025** | script; busca Let's Encrypt | Circularidade: se o domínio cai, os avisos morrem com ele; e já não existiam. O monitoramento de expiração tem que ser **externo** |
| E4 | O `index.html` ao vivo carrega **3 CDNs em tempo de execução**: `cdnjs` (lz-string 1.4.4), **`unpkg.com/mqtt/dist/mqtt.min.js` sem versão** e `cdn.socket.io/4.8.3`; e fontes do Google. O chat global usa o **broker MQTT público `wss://broker.emqx.io:8084/mqtt`** | `index.html` (grep de `src=`), `js/ui/ui_manager.js` linhas 1053–1100 | Qualquer um desses pode sumir ou mudar; o `mqtt` sem versão pode quebrar o cliente do dia para a noite. Nenhum é necessário para N2–N4 |
| E5 | A **chave da identidade é o e-mail** (`players.email` PK; FKs com `ON DELETE CASCADE`) | `server/db.js` (CREATE TABLE) | Para um jogo em que a conta passa de Guardião a Guardião, a identidade não pode ser o e-mail de uma pessoa. E `DELETE` cascateia tudo |
| E6 | Colunas **`INTEGER` (int4, máx. 2.147.483.647)**: `players.total_kills`, `total_items_collected`, `total_lives_collected`; `characters.world_level`, `deaths`; ids `SERIAL` de `diary_entries`, `egregora_messages`, `friendships` | `server/db.js` linhas 97–101, 161–162, 170, 186, 199 | Ver 4.1: contadores que podem estourar em séculos. **As tabelas novas de `09` já nascem certas** (`total_seconds_credited BIGINT`, `xp_total NUMERIC(40,0)`, `seq BIGINT`, `year SMALLINT` que vai a 32.767); **o que `09` não cobre são estas colunas antigas** |
| E7 | `xp`, `xp_required`, `score`, `time` são **`DOUBLE PRECISION` (float64)** | `server/db.js` linhas 65, 141–142, 159 | O "número verdadeiro" do XP já é aproximado acima de 2^53. O arquivo tem que **declarar** isso |
| E8 | **Nenhum mecanismo de backup** no repositório (busca por `pg_dump`/`backup` só acha scripts de migração e docs); **nenhum CI** (`.github/` não existe); `server/game_data.db` (SQLite antigo, 12 KB, gitignored, de 04/08) segue na máquina | grep; `ls -a`; `ls -la` | Não sei o que há no painel do Supabase nem na VPS. Se o plano for gratuito: **sem backups e pausa após 7 dias sem atividade** **[VERIFICADO: docs/pricing Supabase, via busca]**; backups diários só no Pro (US$ 25/mês) |
| E9 | O único e-mail que o sistema conhece é o de login; **não há código de envio de e-mail** no servidor (nada de nodemailer/SMTP) | grep em `index.js`, `db.js`, `package.json` | Nenhuma recuperação por e-mail hoje (`SAVE_SYSTEM_MASTER_PLAN` §3 confirma); em séculos, e-mails morrem — a recuperação tem que ser pelo designado (herdeiro) |
| E10 | O repositório mobile (`danger_ghost_mobile`) tem **o mesmo `origin`** do web (`becopro/danger-ghost.git`), com histórico divergente | `git remote -v` nos dois | Risco de push que sobrescreve (já anotado na memória do projeto); custódia confusa |
| E11 | O servidor tem só **8 dependências diretas / 136 pacotes** no lockfile; o `package.json` da raiz tem **470** (Playwright, Electron, sharp…) | `package-lock.json` (contagem em Node) | Cada dependência é uma futura queda. As 136 do servidor são vendorizáveis (arquivo `.tgz`); as 470 da raiz são de ferramenta e **não** entram na reconstrução |

#### 1.3 Matriz de risco por camada

"Horizonte" = **quanto tempo a camada realisticamente funciona sem nenhuma intervenção humana** (ninguém paga, ninguém loga, ninguém atualiza). É a pergunta "e se o dev sumir hoje?". Todos os horizontes são **[HIPÓTESE]** salvo quando cito data publicada.

| Camada (aqui) | Horizonte sem intervenção | O que a mata | Tripwire (o que avisa) | Mitigação principal | Nível que sobrevive |
|---|---|---|---|---|---|
| **Hardware/VPS** (provedor "DeSoHosting") | **0–5 anos**, dominado pela validade do cartão de pagamento | falha de pagamento; provedor pequeno encerra/muda termos; disco; suspensão por abuso | pagamento recusado; *heartbeat* externo (ver 6.3) | documento provider-neutral (VM + Node + Postgres + nginx + certbot); pagamento por entidade; dump diário fora do provedor | N1 |
| **Sistema operacional da VPS** | anos, sem patches; **[NÃO VERIFICADO: qual distro/versão]** | fim de suporte; invasão por falta de patch | checagem trimestral da versão | imagem documentada; troca planejada a cada 5 anos | N1 |
| **Postgres/Supabase** (terceiro) | **dias a semanas** se plano gratuito e sem tráfego (pausa em 7 dias) **[V]**; **anos** se pago com cartão válido | pausa por inatividade; mudança de termos; cobrança falha; encerramento do projeto; **PG 18 sai de suporte em 14/11/2030** **[V]** | e-mail do Supabase; teste de login sintético diário | `pg_dump` lógico para ≥2 destinos *fora* da conta Supabase; código já usa `pg` direto (portável); só o Storage é específico | N1→N2 |
| **Supabase Storage** (imagens) | igual ao de cima | igual | — | cópia periódica dos objetos + camada de armazenamento abstrata (`backend-architect`) | N1 |
| **Node/npm** | roda por muito tempo, **sem correções**: Node 24 vai a fim de vida em **30/04/2028** **[V]**; Node 20 já acabou (30/04/2026) **[V]** | CVEs sem patch; `npm` deixar de resolver pacotes; pacote retirado do registro | calendário de EOL revisto todo ano | vendorizar `node_modules` do servidor (136 pacotes) + `package-lock`; **não perseguir versões por séculos** (ver 4.5: seriam da ordem de 450 migrações) | N1 (curto), N3 (indefinido, sem servidor) |
| **Navegador/Web APIs** (Canvas 2D, WebSocket, localStorage, áudio) | **20–50 anos** para o cliente *como está*; muito menos para os 3 CDNs de E4 | mudança de política de autoplay; remoção de API; TLS antigo removido; CDNs saem do ar | teste anual do cliente *offline* num navegador atual | zero requisição externa no cliente de arquivo (N3): tudo local | N1–N3 |
| **Android/Capacitor/APK** | **1–3 anos** sem reconstruir | verificação de desenvolvedor (**30/09/2026 no Brasil; global em 2027** **[V]**); Android 15 recusa instalar app com `targetSdk < 24` **[V]** (o app usa 36, ok hoje); chave debug perdida; toolchain some (`gradle-8.14.3-all.zip` é baixado da internet, AGP 8.13.0, JDK 17/21) | aviso de política; build anual de teste | web como caminho principal; arquivar toolchain; chave de release sob custódia; decisão D1 | N1 (só enquanto houver política favorável) |
| **Domínio/DNS/TLS** | domínio: **até o fim do período pago** (≤ 10 anos por pagamento **[V]**); TLS: **≤ 90 dias** depois de o renovador parar (e **45 dias a partir de 2028** **[V]**) | domínio expira; registrador falha; DNS mal configurado; certbot para | monitor **externo** de expiração de domínio e certificado (E3) | registro em nome da entidade; trava + 2FA; pré-pagar 10 anos; **nunca deixar cair** (ver ameaça T4) | N1–N3 |
| **GitHub** | décadas enquanto a conta existir **[M]**; se a conta for encerrada/suspensa, o código some | morte do titular sem sucessor; 2FA perdido; suspensão; repositório privado que ninguém mais acessa | espelho verificado mensalmente | segundo remoto + Software Heritage + cópia offline (seção 2.5) | N3–N4 |
| **Pagamento da hospedagem** | dura o cartão (**3–5 anos** [H]) | cartão expira; conta bancária encerrada; câmbio | alerta de validade a 90 dias | entidade jurídica paga; fundo; ver 3.5 | N1 |
| **E-mail** (`contato@…`, login dos jogadores) | imprevisível **[NÃO VERIFICADO: onde fica a caixa]** | provedor some; endereço abandonado | — | recuperação pelo herdeiro designado (design), não por e-mail | N1 |
| **Dev solo** | **anos** até uma falta longa (doença, morte, burnout) — sem número honesto possível | tudo acima, sem ninguém para agir | *check-in* periódico (3.2) | adjunto + documento + segredos compartilhados + entidade | tudo |
| **Fundação/associação** (se criada) | **20–100 anos** para uma organização típica **[H]** | orçamento, não disco: o BBC Domesday, um laboratório e uma editora "perderam coleções numa reunião de verba" (persona); a Kongō Gumi (578 d.C.) virou subsidiária em janeiro de 2006 **[V]** | relatório anual público | cláusula de sucessão + transferência de custódia (3.3) | N2–N4 |
| **Arquivo em formatos abertos, 3+ cópias independentes** | **décadas a séculos, com migração periódica** | esquecimento (ninguém confere), formato ilegível, mídia velha, um único fornecedor | *scrub* trimestral de hashes | seção 2 | N3–N4 |

**O que quebra primeiro sem mantenedor (ordem revista pelas evidências, [HIPÓTESE]):** (1) pagamento (VPS ou Supabase) ou pausa do Supabase por inatividade → (2) CDNs/broker MQTT do cliente → (3) domínio (se não estiver pré-pago) → (4) política do Android → (5) fim de suporte de Node/SO/Postgres → (6) TLS (só depois de o servidor parar de renovar).

#### 1.4 Modelo de ameaças para a sobrevivência

Escala: Prob. e Imp. de 1 (baixo) a 3 (alto), **[HIPÓTESE]** do agente; o dono ajusta.

| ID | Ameaça | Prob. | Imp. | Cadeia causal resumida | Mitigação | Dono | Como se testa |
|---|---|---|---|---|---|---|---|
| T1 | Dev morre/some/desiste | 2 | **3** | ninguém tem acesso → cartão vence → VPS cai → domínio expira | adjunto, documento, segredos 3-de-5, entidade | Dono + advogado | simulacro anual de acesso (6.3, passo 7) |
| T2 | Provedor da VPS sai/muda | 2 | 2 | não há como migrar sem documento | doc provider-neutral; dump fora do provedor | Dono/`tools-programmer` | restaurar numa VM de outro provedor no simulacro |
| T3 | Supabase muda termos/pausa/perde projeto | 2 | **3** | banco e imagens só ali | dump lógico + cópia de Storage em ≥2 destinos; **confirmar o plano (D0-4)** | `backend-architect` | restaurar em Postgres puro |
| T4 | **Domínio expira** e é registrado por outra pessoa | 2 | **3** | APK antigo envia e-mail+senha ao novo dono; jogadores perdem o único caminho de aviso; e-mails `@` do domínio passam a chegar a um estranho. **O vetor é real e documentado:** o PyPI passou a desverificar endereços cujo domínio entra em expiração, exatamente para evitar "ressurreição de domínio" (>1.800 endereços desde junho/2025) **[V: blog.pypi.org, 2025-08-18, via busca]** — isso confirma o que `05` §4.7 marcou como hipótese | pré-pagar 10 anos; trava; conta do registrador em nome da entidade; *nunca* remover o domínio; tratar e-mail como canal, não como prova de posse (`05`) | Dono → entidade | checagem trimestral de data de expiração; alerta a 12 meses |
| T5 | Renovação de TLS falha | 2 | 2 | servidor vivo mas certbot quebrou; sem aviso | monitor externo de certificado (≥14 dias) | Dono | alarme de teste |
| T6 | Node/Postgres/SO fim de suporte | **3** | 2 | vulnerabilidades sem patch | calendário de EOL; migrar 1× por ciclo; N3 não precisa de servidor | `backend-architect` | revisão anual |
| T7 | Cadeia de suprimentos (npm/CDN/broker) | 2 | 2 | pacote `mqtt` sem versão muda; CDN sai | vendorizar; fixar versões; remover MQTT público do cliente de arquivo | `tools-programmer` | abrir o cliente offline sem rede |
| T8 | Política do Android/sideload | **3** | 2 | 30/09/2026 (BR) e 2027 (global) | web/PWA como principal; decisão D1 | `mobile-platform-engineer` + Dono | instalar o APK num aparelho com a política ativa |
| T9 | Formato ilegível no futuro | 1 | 3 | dependência de software específico | JSON/CSV/SQLite/UTF-8/Markdown/PDF-A, spec em texto | esta equipe | leitura com ferramenta nova a cada 5 anos |
| T10 | Migração/exportação errada corrompe o registro | 2 | **3** | script muda o significado sem avisar | manter a geração anterior por 1 ciclo; comparação campo a campo; hash | `qa-lead` | diff no simulacro |
| T11 | A própria fundação falha | 2 | 3 | orçamento, conselho, desinteresse | cláusula de transferência de custódia; cópias fora dela | advogado | revisão de 5 em 5 anos |
| T12 | Ordem judicial/reclamação encerra o serviço | 1 | 2 | conteúdo de terceiros (assets), LGPD, marca | limpeza de procedência; termos com cláusula de encerramento; N3/N4 sem dado pessoal | `digital-succession-counsel` | auditoria de assets antes de abrir o código |
| T13 | Conta GitHub/registrador tomada (phishing, SIM swap) | 2 | 3 | uma conta, um e-mail, um 2FA | chaves de segurança físicas, 2 pessoas com recuperação | `security-engineer` | revisão semestral de acessos |
| T14 | Apodrecimento de bits silencioso | 2 | 2 | cópia única, sem verificação | SHA-256 por arquivo, *scrub* trimestral | esta equipe | falha propositalmente injetada num arquivo de teste |
| T15 | Perda de e-mail/identidade do Guardião | **3** | 2 | e-mails morrem em décadas | recuperação por herdeiro designado; `account_id` opaco | `legacy-systems-designer` | fluxo dormente testado |

**Irmãos do mesmo formato ("um fornecedor / uma pessoa / um arquivo") que encontrei:** um registrador; uma caixa de e-mail no próprio domínio (E3); uma chave de assinatura Android (E1); um `.jwtsecret` só na VPS; um GitHub; Supabase = **banco + storage** (mesma conta); três CDNs + um broker MQTT; um cartão de crédito; uma pessoa. A defesa é a mesma em todos: **dois de cada, documentados, verificados uma vez por ano.**

### 2. Estratégia de "sobreviver e degradar com dignidade"

#### 2.1 Os quatro níveis de continuidade

A skill e a persona falam de cinco degraus (pleno → reduzido → somente leitura → arquivo estático → conjunto de dados documentado). Mantive os **quatro níveis N1–N4** pedidos e coloquei o "reduzido" como um degrau dentro de N1 (N1-R).

| Nível | O que é | O que preserva | O que perde | Custo anual (ordem de grandeza, **[HIPÓTESE]**) | Faixa |
|---|---|---|---|---|---|
| **N1 — Jogo vivo** | login, multiplayer, save, Passagem (transferência de Guardião), ranking, chat | tudo | nada | **≈ US$ 1.500** (cenário B: VPS + Postgres gerenciado + domínio + backups) a **≈ US$ 8.000** (cenário C: B + contador/advogado/seguro de uma entidade) | Inst. |
| **N1-R — Reduzido** | modo *offline*/um jogador; Passagem manual (processo assistido); chat e multiplayer desligados; sem MQTT | conta, progresso, Crônica, Passagem | tempo real entre jogadores | ~ metade de N1 [H] | Inst. |
| **N2 — Congelado / somente leitura** | servidor mínimo: ver perfil, Guardiões, Crônica; nada de novo save | registro completo consultável e exportável por conta | jogar | **≈ US$ 300–600** [H] (VPS pequena ou plano estático + um banco somente leitura) | Inst.→Cust. |
| **N3 — Arquivo consultável** | **sem servidor de aplicação**: site estático (um HTML + JSON/SQLite) em ≥2 hospedagens; exportações baixáveis | fatos de todas as contas (camada de fatos), Crônica, regras, catálogo | jogar, entrar com senha, dados pessoais | **≈ US$ 250** (cenário A: domínio + 2 armazenamentos + monitor) | Cust. |
| **N4 — Registro histórico** | conjunto de dados documentado + Crônica em texto puro + documento "Como reconstruir" + índice em papel; tudo cópia-e-cole | as regras, a linhagem de Guardiões, a Crônica, a receita de reconstrução | qualquer interface | **≈ US$ 0–100** (cópias em custódia; custo é de pessoas e verificação) | Cult. |

**Como ler a última coluna:** cada degrau mais baixo custa uma ordem de grandeza menos e é uma promessa mais longa. Por isso o plano manda **financiar primeiro o piso** (N3/N4) e tratar N1 como bônus (decisão D4).

**Correspondência com os estados de linhagem de `03` (dois eixos diferentes, que se cruzam).** Os níveis N1–N4 descrevem **o serviço inteiro** (o que o operador consegue manter); os estados de `03` descrevem **cada linhagem** (Ativa → Dormente 365 d → Custódia 730 d → Arquivada/Monumento 30 anos depois, ou "Coroada"). Regras de cruzamento:

| Serviço em… | Efeito sobre as linhagens |
|---|---|
| **N1 / N1-R** | os estados de `03` valem como escritos (varredor, Vigília, Passagem). Em N1-R a Passagem vira **manual/assistida** e os prazos do varredor **não vencem** (não se leva ninguém à Custódia por um relógio que o serviço não estava em condições de atender) |
| **N2** (somente leitura) | **congela todos os relógios de `03`** (nenhuma linhagem cai em Dormente/Custódia por causa da pausa) e registra o intervalo na Crônica como `service_paused` (evento de `09`); Passagem só por reivindicação documentada, fora do sistema |
| **N3** (arquivo estático) | toda linhagem é, na prática, **Arquivada/Monumento** (`03` §T22: "página pública somente leitura, incluída no arquivo estático") — o Monumento **é** o formato de N3 |
| **N4** | o Monumento vira texto puro (Markdown/PDF-A) |
| **Subida** (N3→N2→N1) | relógios de `03` **recomeçam do zero** (mesma regra que `03` §8 aplica ao Dia da Fundação/Era Zero) |

**Renovação × reconstrução.** `01` (Princípio 7) recomenda a **Renovação** de cada linhagem a cada Passagem e a cada **20 anos** de custódia contínua, com verificação de integridade e exportação. Alinhei o meu ciclo de "reconstrução do sistema inteiro por alguém novo" também para **20 anos** (era 25 na primeira versão) — o mesmo intervalo do santuário de Ise, o que mantém a metáfora coerente. Ver 4.5.

**"Ritos finais" (`01` D6, opção b).** `01` recomenda escrever **desde o dia 1** um protocolo de encerramento (o "Last Rites"). O que descrevo em 2.2 (gatilhos, aviso, exportação individual, snapshot com hash, entrada na Crônica) **é** esse protocolo — proponho publicá-lo sob esse nome.

#### 2.2 Gatilhos para descer (números são **[HIPÓTESE]**; o dono aprova em D5)

| Descida | Gatilho (qualquer um) | Quem decide/aciona | Aviso mínimo ao jogador |
|---|---|---|---|
| N1 → N1-R | 2 cobranças seguidas falham; ou fundo < 12 meses de custo N1; ou o adjunto e o dono ficam inalcançáveis por > 30 dias sem que a rotina automática consiga se manter | Conselho da entidade; na falta, o adjunto | 30 dias (se for plano); aviso na hora se forçado |
| N1(-R) → N2 | fundo < 6 meses de custo; Node/Postgres fora de suporte **sem** orçamento de migração; fornecedor do banco encerra; vulnerabilidade grave sem patch; ordem legal | Conselho/adjunto | **≥ 180 dias** quando puder ser planejado; com **exportação individual** liberada desde o primeiro dia |
| N2 → N3 | fundo < 24 meses do custo de N3; manutenção do backend somente leitura inviável; última pessoa técnica saiu | Conselho/mantenedores | **≥ 365 dias** [H] |
| N3 → N4 | as duas hospedagens estáticas saíram do ar e ninguém as substituiu em 90 dias; navegadores deixaram de abrir o visualizador | mantenedores | aviso publicado nos cópias públicas (repositório, arquivo) |
| **Subida** (ressurreição) | existe entidade + orçamento + alguém que segue o documento e faz o simulacro com sucesso | Conselho | anúncio de retomada com a Crônica registrando o intervalo |

**Invariantes (não negociáveis):**
1. **Descer nunca apaga.** Toda descida gera *snapshot* com manifesto de hash e uma entrada na Crônica (anexo técnico).
2. **Nada silencioso.** O servidor publica um arquivo `status.json` (heartbeat) que um verificador **externo** confere; se ficar velho > 3 dias, alerta ≥ 2 humanos.
3. **Aviso em canais que controlamos:** banner no jogo, página do site, README do repositório, entrada na Crônica, e-mail à última caixa conhecida — e *depois* redes sociais.
4. **O domínio nunca é abandonado**, mesmo em N3/N4 (ver T4): ele serve, no mínimo, uma página estática "o serviço mudou de forma; aqui está o arquivo".

#### 2.3 Especificação do "Arquivo do Legado" (v1) — alinhada a `09` §5.1 e a `03` §3.7

**Princípios:** formatos velhos, simples, muito implementados (JSON, CSV, SQLite, UTF-8, Markdown, PDF/A); nenhum binário customizado; nenhuma DRM; a spec **dentro** do arquivo; **nenhum dado pessoal** na parte pública.

**Estrutura de diretórios**
```
arquivo-do-legado-AAAA-MM-DD/
  LEIA-ME.pt-BR.md            # como ler isto, sem software especial (PT)
  README.en.md                # same, in plain English
  MANIFESTO.sha256            # 1 linha por arquivo: <hash>  <caminho>  (mais MANIFESTO.sha3-256)
  spec/
    formato.md                # dicionário de campos: nome, tipo, unidade, significado
    hash-e-cadeia.md          # a regra de hash única (2.3.2) + vetores de teste
    formulas.md               # XP, HP, dano, score + implementação de referência (texto)
    tempo-e-numeros.md        # como ler datas, contadores e números grandes
    wordlist.txt              # a lista de 2048 palavras da Chave do Legado (2.7)
    glossario.pt-BR.md / glossary.en.md
  regras/
    escada_v1.json            # a escada de XP e constantes, com "rules_version"/"curve_version"
    catalogo_ghostdex.json    # 101 espécies
    catalogo_badges.json      # 333 badges
  linhagens/<lineage_id>.json # UMA linhagem por arquivo = o envelope de 09 §5.1 (1 conta = 1 linhagem, 09 D-3 A)
  cronica/<lineage_id>.md     # a Crônica legível por humano (+ .pdf PDF/A) — 03 §3.7; não precisa de navegador
  global/
    linhagens.jsonl           # uma linha por linhagem (resumo)
    cronica.jsonl             # eventos append-only com cadeia de hash
    ledger_diario.jsonl.gz    # playtime_daily de todas as linhagens (a prova; ver 2.3.3)
    custody_log.jsonl         # cadeia de custódia de 03 (se mantida como tabela própria)
  ancoras/AAAA-Www.txt        # cabeças publicadas (2.6)
  db/
    legado.sqlite             # a mesma informação, consultável
    esquema.sql
  ferramentas/
    verify_chronicle.js/.py   # reimplementação de referência (<100 linhas), NÃO depende de Postgres
    verify_ledger.js/.py
  codigo/                     # instantâneo do repositório + dependências vendorizadas + versões
  assets/                     # sprites, ícones, música + LICENCAS.md
  docs/
    Como_reconstruir_o_jogo.pt-BR.md / .en.md  (+ PDF/A)
  guarda/
    copias.md                 # onde estão as cópias, quem responde por cada
    fixidade-AAAA.md          # resultado das verificações
```

##### 2.3.1 O envelope de exportação por linhagem (adota o de `09` §5.1, com estas mudanças)

`09` propõe `{format, format_version, exported_at, lineage, keepers, characters, chronicle, playtime_daily, relics, integrity}`. **Adoto exatamente essa forma**, e acrescento o que falta para ser um arquivo de séculos (exemplo fictício; nenhum dado real):

```json
{
  "format": "danger-ghost-legacy-export",
  "format_version": 1,
  "spec_url_hint": "spec/formato.md (dentro do Arquivo; não depender de URL)",
  "rules_version": "escada_v1",
  "exported_at": "2026-10-01T00:00:00.000000Z",
  "lineage": {
    "lineage_id": "018f3b2e-7c1a-7b3e-9a52-3f0d2c9a1e44",
    "account_id": "018f3b2e-7c1a-7b3e-9a52-3f0d2c9a1e40",
    "display_name": "Casa Polterstalk",
    "legacy_character_id": "ghost_001",
    "era": "0", "status": "active",
    "chronicle_seq": "1", "chronicle_head": "sha256:…",
    "total_seconds_credited": "43200"
  },
  "keepers": [
    { "generation": "1", "display_name": "Keeper #1", "began_at": "2026-10-01T00:00:00.000000Z",
      "ended_at": null, "end_reason": null, "seconds_credited": "43200" }
  ],
  "characters": [
    { "character_id": "ghost_001",
      "level": "12",
      "xp_residual": "3400",  "xp_residual_representation": "float64-approx",
      "xp_total": "1234567890123456789012345678",
      "xp_total_representation": "exact-decimal",
      "attributes": { "vit": "5", "agi": "5", "int": "5", "pow": "4", "mag": "4" },
      "points_to_distribute": "0" }
  ],
  "chronicle": [ "…eventos com prev_hash, payload_hash, entry_hash (2.3.2)…" ],
  "playtime_daily": [ "…dias selados com day_hash e prev_day_hash…" ],
  "relics": [ "…" ],
  "integrity": {
    "chronicle_head": "sha256:…", "playtime_head": "sha256:…",
    "section_hashes": { "keepers": "sha256:…", "characters": "sha256:…" },
    "hash_rule": "dg-chronicle-1 / dg-day-1 (spec/hash-e-cadeia.md)"
  }
}
```

Regras do formato (o que **acrescento** ou **discordo** em relação a `09`):
1. **Todo inteiro de banco (`BIGINT`, `NUMERIC`) vai como string decimal, mesmo quando cabe em `Number`.** `09` §1.7 já exige `BigInt(string)` para `xp_total`; eu estendo a regra a **todos** os campos numéricos do envelope, para o leitor não precisar adivinhar "às vezes número, às vezes texto" (`03` §1.7 já guarda níveis como `text`). **[CÁLCULO]** `XPRequired(1e11) = 8,913e17` (~99× o limite seguro do `Number`); `xp_total` chega a **3,64e28** (29 dígitos, cabe em `NUMERIC(40,0)`); `JSON.parse("9007199254740993")` devolve `9007199254740992` (perde 1).
2. **Dois campos de XP, com a honestidade escrita:** `xp_residual` (a coluna `DOUBLE PRECISION` de hoje, aproximada acima de 2^53) e `xp_total` (o acumulado **exato** que `09` cria). A curva pode mudar (`curve_version`); os **segundos creditados** são o dado primário e o XP é derivado — `09` §(f) risco 4 diz o mesmo, e eu o registro como regra do arquivo: **guardar segundos, não só XP**.
3. **Tempo:** instante em UTC, RFC 3339, **sempre com 6 casas decimais e `Z`** (é a resolução do `timestamptz` do Postgres **[V]**); ano de 4 dígitos até 9999 e, **a partir de 10000, `+YYYYYY`** (é assim que o `Date` do JS serializa; sem o `+` o próprio JS devolve *Invalid Date* **[V, Node]**). Datas locais são derivadas na leitura; nunca "anos até 3147 = 1121 × 365".
4. **`lineage_id` e `account_id` são UUID aleatórios, não hash do e-mail.** O servidor hoje usa `sha256(email).slice(0,32)` como pasta de imagem **[V: `server/index.js`]** — isso **não** é anonimização (e-mails são adivinháveis por dicionário). A ligação `account_id ↔ e-mail` vive só na camada privada.
5. **O que NÃO vai para o arquivo público** (lista de exclusão, campo a campo do desenho de `09` e `03`): `players.email`/`login_identity`, hash de senha, `keepers.contact_email` **e `keepers.contact_email_hash`**, `succession_vault.*` (hash do token e códigos de resgate), `heir_contact_email`, `succession_letter` (a Carta Selada é privada até a Passagem), IPs. **Discordo de `09` §1.2 quando ele guarda `contact_email_hash` "para sobreviver ao apagamento do claro (LGPD)":** um SHA-256 **sem chave** de um e-mail é **reidentificável por dicionário** — continua dado pessoal. Se for preciso manter um vínculo, que seja **HMAC com chave na camada privada** (a decisão de o que conta como anonimização é do advogado — `digital-succession-counsel`).
6. **A camada de identidade (`03` §1.7 `guardian_identity`: alias, nome real, epitáfio) só entra com o consentimento vigente no momento da exportação** e leva `consent` (versão do texto + data) ao lado; cópias já baixadas por terceiros **não podem ser recolhidas** (`03` §3.7) — a tela de consentimento diz isso.

##### 2.3.2 A regra de hash — **uma só**, sem ambiguidade

Hoje há **três** definições diferentes para a mesma coisa: `09` §1.4 `sha256(prev || seq || type || occurred_at_iso || payload_hash)`; `05` §5.1 `SHA-256(seq || lineage_id || kind || json_canonico(payload) || created_at || prev_hash)` (com `BYTEA` e um `seq` global); e o `custody_log` de `03` §1.7 (`prev_hash bytea`, `hash bytea`, fórmula não especificada). Uma cadeia de hash só vale se **qualquer pessoa, em 2500, reproduz o mesmo hash lendo só a especificação**. Proponho esta regra (para a Crônica, o livro-razão diário e o `custody_log`):

```
JCS(x)       = serialização canônica de JSON, RFC 8785 [M]  (chaves ordenadas, sem espaços, UTF-8)
payload_hash = "sha256:" + hex_minúsculo( SHA-256( JCS(payload) ) )
entry_hash   = "sha256:" + hex_minúsculo( SHA-256( JCS({
                 "v":"dg-chronicle-1", "lineage_id":…, "seq":"<decimal>", "event_type":…,
                 "occurred_at":"<RFC3339 6 casas Z>", "actor_keeper_id":<uuid|null>,
                 "payload_hash":…, "prev_hash":… }) ) )
prev_hash(seq=1) = "sha256:" + 64 zeros            (em vez de o texto 'GENESIS' — mesmo formato sempre)
day_hash     = idem, com "v":"dg-day-1" e os campos de playtime_daily (todos como string) + "prev_day_hash"
```

Motivos, com evidência:
- **Concatenação sem separador é ambígua.** **[VERIFICADO — Node, `dt_sizes.js`]** `("P"+1+"2x")` e `("P"+12+"x")` dão o **mesmo** SHA-256 (`b8a81dfc4be6…`). Com o vocabulário atual de `event_type` (todos começam com letra: `lineage_founded`, `keeper_began`…) esse caso específico **não é explorável hoje**, mas a regra tem que ser inequívoca **por construção** — e consertar isso **depois** de a cadeia existir é impossível (mudar a regra muda todos os hashes). É barato agora e impagável depois. Serializar como **objeto JSON canônico** elimina o problema de fronteira.
- **`JSONB` reordena chaves e reformata números** (`05` §5.1 já alerta e marca como hipótese; eu **confirmo como regra**): o hash é calculado **na aplicação, sobre o valor original**, nunca sobre `JSONB::text` relido do banco. Dentro do `payload`, números acima de 2^53 são **strings** (JCS serializa números como IEEE-754).
- **Armazenamento ≠ formato de arquivo.** O banco pode guardar `BYTEA` (32 B; `05`) ou `TEXT` (`09`); **no Arquivo, o hash é sempre a string `sha256:<64 hex minúsculos>`** — legível por humano, com o algoritmo escrito ao lado (agilidade de algoritmo).
- **Vetores de teste** (entradas fixas e hashes esperados) vão em `spec/hash-e-cadeia.md`; a ferramenta de referência em JS **e** em Python os reproduz. Sem vetor de teste, ninguém sabe se a sua implementação está certa.

**Cabeça global (uma âncora para qualquer número de linhagens).** `09` propõe publicar mensalmente "a lista de `chronicle_head` de todas as linhagens". Publique **a lista** num arquivo (`ancoras/AAAA-Www.txt`) **e** o **hash dessa lista** (SHA-256 das linhas `lineage_id:head` ordenadas, unidas por `\n`) — 32 bytes, para 1 linhagem ou 10.000. Uma testemunha guarda 32 bytes; o arquivo completo fica nas cópias.

##### 2.3.3 Cadência

| Quando | O quê |
|---|---|
| A cada **Passagem** | exportação da linhagem + entrada na Crônica + hash; **a Investidura só acontece se o arquivo verificar** (`03` T7/T9) — o ritual **é** o teste de restauração |
| **Semanal** (automático) | publicar a **cabeça global** e o arquivo de cabeças em ≥ 3 testemunhas (2.6). `05` propõe semanal, `09` mensal: **fico com semanal** (custa 32 bytes e uma linha de `cron`) |
| **Diário** (automático) | dump lógico do banco (`pg_dump`) + exportação JSONL global → ≥ 2 destinos; retenção em camadas (30 diários, 12 semanais, 24 mensais, anuais para sempre **[M: esquema clássico]**) |
| **Mensal** | Arquivo do Legado completo, imutável, com manifesto; `verify_chronicle` e `verify_ledger` rodam **sobre o arquivo exportado** (não sobre o banco) |
| **Trimestral** | *scrub*: recalcular todos os hashes em todas as cópias e comparar |
| **Anual** | simulacro de restauração (6.3) + **selo do ano** (2.3.4) |
| **5 em 5 anos** | migração/reconferência de formato; troca de mídia offline |
| **Na descida de nível** | *snapshot* final com manifesto |

**Fixidade:** SHA-256 **e** SHA3-256 no manifesto (custa quase nada; cobre a quebra de uma família). O manifesto declara o algoritmo — quando um novo padrão surgir, recalcula-se e **adiciona-se** (não se substitui). Hash guardado **fora** do arquivo que descreve.

##### 2.3.4 Tamanho ao longo dos séculos — **recalculado sobre o desenho de `09`** (`dt_sizes.js`)

`09` §1.5 calcula **409.538 linhas ≈ 33 MB por linhagem** para o `playtime_daily` diário (≈ 81 bytes/linha). **Discordo do número, não da conclusão:** a tabela que ele próprio especifica tem `lineage_id`, `keeper_id` (UUID), `utc_day`, três `INTEGER`, `xp_awarded NUMERIC(40,0)`, `level_after BIGINT`, `sealed_at` **e dois hashes de 64 caracteres em `TEXT`** (`day_hash`, `prev_day_hash`). Só os dois hashes já ocupam ~130 bytes. **[CÁLCULO — estimativa por campo, não medida no banco]:**

| Formato | Bytes/linha | Por linhagem em 1.121 anos (409.538 dias) | 1.000 linhagens | 10.000 linhagens |
|---|---|---|---|---|
| Postgres, hashes em `TEXT` hex (como em `09`) | ~285 (tupla ~249 + índice ~36) | **~117 MB** | ~117 GB | ~1,2 TB |
| Postgres, hashes em `BYTEA` (32 B, como em `05`) | ~221 | **~91 MB** | ~91 GB | ~0,9 TB |
| Exportação JSONL (envelope acima) | 490 (medido em 20.000 linhas sintéticas) | **~201 MB** bruto | ~201 GB | ~2,0 TB |
| Exportação JSONL comprimida (`gzip -9`) | 49 (o `prev_day_hash` repete o `day_hash` da linha anterior e o gzip aproveita) | **~20 MB** | ~20 GB | ~200 GB |

Leitura: a diferença de 33 MB para ~91–117 MB **não muda a viabilidade** (continua trivial para Postgres — **~0,1 MB por linhagem por ano**), mas muda três coisas: (i) o **orçamento do plano do Supabase** (um plano gratuito de 500 MB **[V, busca]** não aguenta 1.000 linhagens a longo prazo — reforça `09` D-5); (ii) o **custo de verificar** (conferir 1,2 TB por trimestre é caro; por isso a verificação é **incremental desde a última âncora**, e o histórico frio é verificado por ano); (iii) o **arquivo** — comprimido, 1.000 linhagens de 1.121 anos cabem em ~20 GB.

**Crônica:** `09` §6 calcula ~5 MB por linhagem a 1 evento/mês; com ~600 bytes por evento em JSON o meu número é ~8 MB (13.454 eventos). Concordo com a conclusão dele: **a Crônica é só para eventos significativos** (1 por dia seriam ~246 MB por linhagem); o dia a dia mora no livro-razão.

**Retiro uma recomendação da primeira versão:** eu tinha sugerido "engrossar o passado" (diário → mensal → anual) no histórico. Isso **quebraria a cadeia `day_hash`**, que só se verifica com **todos** os dias. Substituo por: (a) `playtime_sessions` já tem retenção de 2 anos em `09` (é aí que se "engrossa"); (b) o `playtime_daily` **fica inteiro**, mas os anos antigos migram para **armazenamento frio comprimido** (~20 MB por linhagem); (c) um **selo do ano** — `year_hash = SHA-256(JCS({v:"dg-year-1", lineage_id, year, last_day_hash, days:N, seconds_total, xp_total}))` — entra na âncora anual, de modo que o banco quente pode manter só `playtime_yearly` + o último `day_hash`, e qualquer pessoa reverifica o ano a partir do arquivo frio.

#### 2.4 Chave estável e separação pessoa/conta (durabilidade × `legacy-systems-designer`)

Como a identidade hoje é o e-mail (E5), o arquivo e o futuro banco precisam de `account_id` opaco e de **três camadas**: (i) **fatos** (jogo; sem dado pessoal; para sempre), (ii) **identidade** (alias, mensagem, foto; com consentimento; removível), (iii) **credenciais** (e-mail, hash; só no servidor vivo). O arquivo público carrega (i) e o *alias* de (ii) apenas. Se um jogador pedir esquecimento, remove-se (ii) e resta "Guardião anônimo #N"; o *crypto-shredding* (chave por pessoa) só funciona se **nenhuma cópia em texto claro e nenhuma chave** sobreviver em backups — **o arquivo de durabilidade é justamente onde isso falha**, por isso a regra "sem identidade no arquivo público" é mais segura do que "criptografar e prometer" (advogado decide o que conta como anonimização — `digital-succession-counsel`).

#### 2.5 Plano de cópias e guarda (a "custódia do arquivo": ≥3 cópias / ≥2 provedores / ≥1 fora do local / ≥2 instituições)

| # | Onde | Tipo | O que guarda | Independência |
|---|---|---|---|---|
| 1 | Produção (Supabase + VPS) | serviço vivo | tudo | **não conta como backup** |
| 2 | Máquina do dev | disco | tudo, mais recente | mesma pessoa |
| 3 | Armazenamento de objetos, provedor **A** | nuvem | Arquivo mensal + dumps diários (criptografados só a camada privada) | outra empresa e outra conta que a produção |
| 4 | Armazenamento de objetos, provedor **B** (outro país) | nuvem | igual ao 3 | empresa e jurisdição distintas |
| 5 | **Offline** (2 HDs/pen-drives em 2 endereços) + **papel** (documento de reconstrução + índice da Crônica + hashes da cabeça) | mídia | Arquivo público + doc | físico, distinto |
| 6 | **Repositório público + Software Heritage** | arquivo público | código, docs, regras, catálogos (não dados pessoais) | Software Heritage é uma iniciativa sem fins lucrativos apoiada pela UNESCO, com > 27 bilhões de arquivos de código **[V, busca]**; o mecanismo de "arquivar meu repositório" **[M]** |
| 7 | **Internet Archive** (documentos + Arquivo público) | arquivo público | Arquivo público, LEIA-ME | outra instituição **[M: mecanismo de upload não verificado hoje]** |
| 8 | **Instituição parceira** (biblioteca/museu de jogos/universidade) | custódia institucional | Arquivo público + doc | independência institucional (fase 3) |

Regras: (1) a **única** cópia de qualquer coisa nunca fica na mesma conta do fornecedor de produção (uma conta Supabase suspensa não pode levar o próprio backup); (2) **mídias offline duram menos do que se pensa** — trocar a cada 5 anos **[H]**; alegações de "100+ anos" de discos ópticos são de marketing, não confio nelas (tag [C]); (3) para o horizonte de séculos, o **papel** e o **texto** vencem: o Domesday Book seguiu legível por 900 anos enquanto o Domesday da BBC (1986) já estava inacessível em 2002 e só foi resgatado por **emulação** (CAMiLEON, demonstrada em 02/12/2002) **[V, busca]**. O GitHub guardou uma foto dos repositórios públicos ativos em 02/02/2020 (21 TB em 186 rolos de piqlFilm no Arctic World Archive; depósito em 08/07/2020) **[V, busca]** — um precedente de *cópia fria*, mas o snapshot foi de 2020 e **não sei se este repositório é público** **[NÃO VERIFICADO]**, nem se haverá outro.

**Público × privado:** *público* = código, regras, catálogos, documentos, Crônica (camada de fatos + alias consentido), hashes. *Privado/restrito* = identidade, e-mail, imagens de jogadores, IPs, segredos. **Nunca** vai para o arquivo: senha/hash, valores de variáveis de ambiente.

**Acesso de emergência (*break-glass*):** segredos indispensáveis (registrador, VPS, Supabase, GitHub, keystore) ficam num gerenciador de senhas com "acesso de emergência" para o adjunto **e** uma cópia dividida por **compartilhamento de segredo de Shamir (3 de 5)** **[M: Shamir, 1979]** entre pessoas/instituições (advogado/tabelião, adjunto, alguém de confiança do dono, a futura entidade); instruções lacradas com o advogado. **Não recomendo "dead-man's switch" que envia segredos sozinho** (falso positivo vaza tudo; falso negativo trava tudo; depende de um serviço que também morre): recomendo um **check-in** (o dono responde a um e-mail a cada 90 dias; 3 faltas = *alerta* ao adjunto, **não** liberação); a liberação exige um ato humano/legal. É item para `security-engineer` e advogado; **nenhum segredo é escrito em arquivo do repositório**.

#### 2.6 Âncora externa da Crônica: onde ela vive depois do dev (responde a `05` §5.2 e a `09` §1.4)

`05` pergunta a mim "onde a âncora externa vive depois do dev", e `09` propõe publicar a cabeça uma vez por mês "fora do banco". Concordo com os dois quanto ao princípio — **uma cadeia de hash guardada no mesmo lugar que quem a controla não prova nada contra esse alguém** (`05` §5.2; `09` risco 7) — e detalho:

**O que se publica:** apenas 32 bytes por âncora (a **cabeça global**, 2.3.2) e, ao lado, o arquivo `ancoras/AAAA-Www.txt` com as cabeças por linhagem e o **hash do manifesto** do último Arquivo. Nenhum dado pessoal.

**Onde (≥ 3 testemunhas, das quais ≥ 2 que não dependem de uma conta controlada pelo operador):**

| # | Testemunha | Depende de conta do operador? | Observação |
|---|---|---|---|
| W1 | **Commit num repositório público**, com espelho no Software Heritage | sim (o commit), mas o **espelho** é de terceiro | arquivo só-acréscimo; o carimbo do commit é do provedor |
| W2 | **Captura do arquivo de âncora no Internet Archive** | não | terceiro com carimbo próprio **[M: mecanismo não verificado hoje]** |
| W3 | **E-mail** com a cabeça a **todo Keeper ativo** e a todos os mantenedores do arquivo (`05` §5.2 já propõe) | não (cada destinatário guarda a sua cópia) | testemunhas **distribuídas**; ao receber, o mantenedor confere e arquiva |
| W4 | Publicação nos canais sociais (X `@GhostGamesnit`, Telegram) | **sim** | **conveniência, não testemunha** (ver abaixo) |
| W5 | **Papel**, uma vez por ano: as 52 cabeças + o selo do ano, impressos e guardados por mantenedores e pela entidade | não | a testemunha que sobrevive a quase tudo |
| W6 | Serviço aberto de carimbo de tempo (ex.: OpenTimestamps **[M]**) ou, **só depois** dos critérios da seção 5, a blockchain própria | não | mais uma, nunca a única |

**Discordo em parte de `05` §5.2 quando propõe Twitter/Telegram como âncora:** uma conta de rede social é **uma conta** (o mesmo tipo de ponto único que o registrador, o GitHub ou a chave Android) e some junto com o operador, com a suspensão ou com a mudança de termos da plataforma; além disso, o que está lá não é verificável de forma independente daqui a décadas. É boa como **aviso ao público**, não como **prova**. As duas testemunhas realmente independentes são W2, W3 e W5.

**Depois do dev:** a rotina de âncora é um capítulo do "Como reconstruir" (cap. 10), roda por `cron` no servidor **e** pode ser rodada à mão pelo adjunto a partir do último Arquivo; se uma âncora semanal faltar por mais de 14 dias, o monitor externo alerta ≥ 2 humanos. **A primeira âncora é publicada no Dia da Fundação (Era Zero)**, antes de qualquer Passagem.

**Regra de aceite herdada de `05` §5.3 (e que adoto no simulacro):** uma restauração só é aceita se a cabeça restaurada **bater com uma cabeça publicada externamente** (W2/W3/W5), **não** com a que o próprio banco diz. E o job noturno de `05` (repercorrer a cadeia e comparar com a última cabeça publicada) é o *tripwire* correspondente.

#### 2.7 A Chave do Legado em papel (responde a `05` §4.5, item 2: "formato e suporte físico")

`05` propõe uma **Chave do Legado** de **24 palavras / 256 bits**, mostrada uma só vez, escrita em papel; o servidor guarda só o hash; e a chave **não basta sozinha** (Herdeiro autenticado + espera de 30 dias). Concordo com o desenho. O que acrescento é o **como durar**:

- **Formato.** 256 bits aleatórios → **24 palavras de uma lista pública fixa de 2.048 palavras** (11 bits/palavra; 24 × 11 = 264 bits = 256 + 8 de verificação), **a mesma construção dos mnemônicos usados em carteiras de criptoativos (BIP-39)** **[M: não verificado hoje]**. **A lista vai dentro do Arquivo (`spec/wordlist.txt`)** — o formato é auto-descritivo e não depende de nenhuma biblioteca. Os 8 bits de verificação detectam uma palavra copiada errada **antes** de ela importar. QR code pode existir **além** do texto, nunca no lugar.
- **O que o servidor guarda.** Só `SHA-256(chave)`. Como a chave tem 256 bits de entropia, **um hash rápido basta e não envelhece** — é o mesmo raciocínio de `09` §1.3 para o token de resgate. **Discordo levemente de `05` §4.5** ("Argon2id ou bcrypt, mesmo padrão da senha"): bcrypt e Argon2 existem para segredos **de baixa entropia** (senhas de gente), e o **custo do bcrypt tem teto e envelhece** (4.2); aplicá-los a um segredo de 256 bits só acrescenta uma dependência de algoritmo que precisará ser migrada.
- **Papel.** Papel **permanente** conforme **ISO 9706 / ANSI/NISO Z39.48** (reserva alcalina de 2 %, pH 7,5–10, teor de lignina baixo, "para durar várias centenas de anos em condições ótimas") **[V, via busca: NISO/IFLA/SAA]**. **Não** papel térmico (recibo) **[M]**. Impressão a **laser** (toner fundido) ou **tinta pigmentada** — impressões a laser costumam durar mais que jato de tinta com corante, desde que o toner esteja bem fundido (teste de atrito) **[V, via busca, fonte secundária]**. Caneta de tinta pigmentada de arquivo, se for à mão.
- **Redundância.** **2 cópias em 2 endereços**, em envelope de arquivo lacrado; opcionalmente uma terceira com o advogado. Guardar frio, seco e ao escuro **[M]**. A folha traz, em **PT e EN**, o que é aquilo, como usar, e diz explicitamente que **o jogo pode já não existir** e o que fazer nesse caso (procurar o Arquivo). **Não** traz e-mail nem nome de conta: traz o `lineage_id` (UUID) e os 8 primeiros caracteres do hash da chave, só para conferir "esta é a folha certa".
- **Teste de legibilidade.** Sugestão para `05`/`03`: a **Chamada do Guardião** (a cada 180 dias) e a **Renovação** (20 anos) podem pedir "digite a palavra nº 3 e a nº 17" — assim a perda da folha é descoberta **enquanto ainda dá para gerar outra**, sem que o servidor precise ver a chave inteira.
- **Não confundir** com as frações do segredo de *break-glass* do **operador** (Shamir 3-de-5, 2.5): a Chave do Legado é do **Keeper**; as frações protegem o **sistema**. Duas coisas, dois envelopes.

### 3. Sucessão do OPERADOR (o mais crítico e o mais ignorado)

#### 3.1 O enquadramento honesto

O jogo hoje é **uma pessoa**: uma conta GitHub, um cartão, um computador com a chave Android, segredos que só existem fora do git, conhecimento em parte em arquivos de agentes de IA. Em arquivamento digital, coleções raramente morrem por "disco quebrado"; morrem por **orçamento e falta de pessoas** (a persona viu isso três vezes; Kongō Gumi, mesmo com 1.400 anos, deixou de ser independente em 2006 **[V]**). Portanto a sucessão tem **três camadas**, que precisam existir juntas: **(A) conhecimento** (documento de reconstrução), **(B) acesso** (segredos em custódia) e **(C) legitimidade + dinheiro** (uma entidade que sobrevive a uma pessoa, com orçamento).

#### 3.2 Papéis (o mínimo que reduz o risco em semanas)

| Papel | Quem | Poder mínimo | Gatilho por escrito |
|---|---|---|---|
| **Operador** | o dono | tudo | — |
| **Operador adjunto** | uma pessoa técnica de confiança (nomeada, com aceite) | consegue **fazer deploy, restaurar do arquivo, renovar domínio**; não altera regras | "Se o operador não responde a 3 check-ins seguidos (≈ 90 dias), o adjunto pode: renovar domínio, pagar hospedagem, subir N1-R/N2, publicar aviso" |
| **Mantenedor(es)** | ≥ 3 pessoas/instituições | guardam parte do segredo e uma cópia do arquivo | reunião trimestral/anual do simulacro |
| **Guardião do documento** | rotativo | mantém o "Como reconstruir" | revisão anual assinada |

#### 3.3 Opções de casa jurídica e de sucessão (com prós/contras e a quem perguntar)

Não escolho nem redijo instrumentos (isso é do advogado + dono). Descrevo opções e o que cada uma exige.

| Opção | O que é | Prós | Contras/riscos | Exige profissional? |
|---|---|---|---|---|
| **S0. Sucessor técnico nomeado, sem entidade** | adjunto + documento + segredos compartilhados | custo ≈ 0; pode começar **esta semana** | frágil juridicamente (o adjunto age em nome de quem?); cartão ainda pessoal | recomendável ter um advogado revisando a procuração/instrução |
| **S1. Associação sem fins lucrativos** (Código Civil arts. 53 ss. **[M]**) | pessoa jurídica com estatuto e assembleia | barata; pode contratar hospedagem e ser titular do domínio; nasce rápido | **pode ser dissolvida** pelos associados; não tem o "patrimônio afetado" que dá perpetuidade; contabilidade anual | **sim**: advogado de terceiro setor + contador |
| **S2. Fundação privada** (CC art. 62 ss.) | patrimônio afetado a um fim, criado por **escritura pública ou testamento**, com "**dotação especial de bens livres**" **[V, busca; texto do art. 62]**; fiscalizada pelo **Ministério Público do Estado** (art. 66) **[V, busca]**; finalidades restritas, ampliadas pela **Lei 13.151/2015** (inclui pesquisa científica, meio ambiente…) **[V, busca]** | desenhada para ser perpétua; **pode ser instituída em testamento** (sobrevive à morte do fundador) **[V: art. 62 admite testamento]**; MP como guardião externo | precisa de capital viável (não achei mínimo legal — **[NÃO VERIFICADO]**, na prática o MP pergunta pela viabilidade **[M]**); burocracia e custo anual de prestação de contas; **a finalidade tem de caber** (cultural/preservação de patrimônio digital? — pergunta ao advogado) | **sim, indispensável** |
| **S3. Fundo patrimonial (endowment) — Lei 13.800/2019** | uma **organização gestora de fundo patrimonial (OGFP)**, associação ou fundação privada sem fins lucrativos, capta doações, aplica e **resgata só o rendimento líquido de inflação** para "instituições apoiadas" **[V, busca (BNDES, IDIS, Ibram, jusbrasil)]** | é o desenho legal brasileiro para exatamente o problema "quem paga em 2080"; separa o dinheiro do risco da entidade apoiada | camada extra de governança; só faz sentido com capital relevante; a instituição apoiada precisa ser pública ou privada sem fins lucrativos (**precisa existir S1/S2 antes**) | **sim**: advogado + contador |
| **S4. Parceria com arquivo/museu/universidade existente** | doar o Arquivo público e o direito de hospedagem/curadoria | independência institucional real; custo baixo; ótimo para N3/N4 | eles escolhem o que guardar; aceitação não é garantida; não mantém o jogo *vivo* | contrato de doação/licença: advogado |
| **S5. "Trust"/fideicomisso** | — | — | o *trust* de common law **não existe** como tal no direito brasileiro; o **fideicomisso** do Código Civil (arts. 1.951 ss.) é um instrumento **sucessório** (substituição fideicomissária) **[M]**, não um veículo de financiamento perpétuo. Estruturas estrangeiras (fundação holandesa/suíça, entidade sem fins lucrativos nos EUA) trazem tributação, câmbio, LGPD e complexidade | **sim**, e só depois de S1–S3; **não recomendado no começo** |

**Limite jurídico geral (precedente):** sistemas legais **restringem o "controle da mão morta"**. O caso Thellusson (testamento de 1797 mandando acumular renda por gerações) levou o Reino Unido a aprovar a *Accumulations Act* 1800, limitando a acumulação **[V, busca]**. Consequência para o desenho: **não** escrever uma regra imutável que obrigue sucessores; escrever uma entidade que **se renova** por decisão dos seus conselhos (mesma lógica do Ise: renovação mantém a forma).

**Trilha escalonada que recomendo (não é decisão minha, é D3):**
- **Estágio 0 (agora, ≤ 30–90 dias, custo ≈ 0):** S0 + documento + segredos + licença + espelhos + domínio pré-pago.
- **Estágio 1 (≤ 2 anos):** S1 (associação) — titular do domínio, da conta de hospedagem e das cópias; adjunto vira "gerente".
- **Estágio 2 (quando houver capital e propósito claro):** S2 (fundação, possivelmente já **prevista em testamento**) e/ou S3 (OGFP).
- **Estágio 3 (sempre, em paralelo):** S4 — doar o Arquivo a ≥ 1 instituição.

#### 3.4 O documento "Como reconstruir o jogo" (esqueleto e teste)

Objetivo: **um estranho com só o Arquivo e este documento sobe uma instância funcional** (login, save, uma Passagem de teste) numa VM zerada. Idiomas: PT-BR e EN; formatos: Markdown + PDF/A.

Capítulos:
0. Para quem é (leitor sem contexto; sem IA; sem o autor). 1. O que é o jogo (1 página). 2. Mapa do repositório (web × mobile; as duas pastas-armadilha `danger_ghost_mobile/` raiz e `danger ghost/www` — `CLAUDE.md` §3). 3. Dependências com versões exatas + `package-lock` + pacotes vendorizados. 4. Provisionar infraestrutura **sem depender de fornecedor** (VM Linux, Node, Postgres, nginx, certbot; **só o Storage de imagens é específico do Supabase** — o código usa `pg` direto — então documentar a troca por armazenamento S3-compatível ou disco). 5. Restaurar dados a partir do Arquivo (importador: a escrever). 6. Variáveis de ambiente (**apenas nomes**, e onde os valores ficam: gerenciador de senhas). 7. Deploy (**unificar** `deploy.sh`, skill e `pm2` — hoje se contradizem, E2). 8. Build do APK (toolchain arquivado; assinatura; verificação de desenvolvedor). 9. Domínio, DNS, TLS (renovação e monitor externo). 10. Operação: monitor, backup, restore. 11. Verificação: como provar que a instância está certa (hash da cabeça da Crônica reproduzido **e igual à âncora externa publicada (2.6)**; amostra de contas iguais). 12. Regras de cálculo e por quê existem. 13. Glossário. 14. Papéis e mantenedores (papéis, não dados pessoais). 15. Runbooks ("se o banco cair", "se o certificado vencer", "se o domínio estiver para expirar", "se o Node acabar", "se o APK for bloqueado"). 16. **O que NÃO mudar** (identidade do legado: linhagem contínua, Crônica sem lacunas, toda custódia registrada — a "regra de identidade" do Navio de Teseu).

**Teste do documento (critério de aceite):** uma pessoa que **não é o autor** — ou, no mínimo, um agente sem contexto — segue o documento numa VM nova, sem acesso ao autor, e chega a **login funcionando + Crônica verificada em ≤ 8 h** **[HIPÓTESE do prazo]**; cada desvio vira correção do documento. Um agente de IA é um proxy fraco (ele já sabe Node); vale como **piso**, não como prova.

#### 3.5 Código aberto × fechado — o que ajuda a durar

| | Aberto (código sob licença livre) | Fechado (sem licença/ com *escrow*) | Híbrido: aberto por gatilho |
|---|---|---|---|
| **Reconstrução por estranho** | **legal e possível** | ilegal sem autorização; depende de *escrow* (agente terceiro que libera o código sob condições; contrato específico) **[M]** | possível só depois do gatilho |
| **Arquivos independentes aceitam?** | sim (Software Heritage, GitHub Archive) | não | parcial |
| **Clonagem/diluição do "legado oficial"** | risco real (qualquer um sobe outro servidor) — mitigado reservando **marca e Crônica oficial** para a entidade | protegido | protegido até o gatilho |
| **Irreversível** | **sim** (não dá para "des-abrir") | não | sim, no gatilho |
| **Procedência de assets/música** | **bloqueia**: sem `LICENSE`/créditos hoje; `assets2/` vem de um protótipo "Dangerous Dave"; a faixa de música tem origem não documentada | idem, mas menos exposto | idem |
| **Direitos de terceiros** | o dono é o único autor de commit (637/637 do mesmo nome) — **hoje é o melhor momento para licenciar**; com colaboradores depois, exige CLA/DCO | — | — |

Recomendo (D2) **abrir o código do servidor e do cliente** (licença permissiva; escolha entre MIT e Apache-2.0 com o advogado — a Apache traz concessão de patentes **[M]**), **assets sob licença separada só depois de auditar a procedência**, e **reservar marca e Crônica oficial à entidade**. Se o dono não estiver pronto, a opção B (licença que **se abre sozinha** no gatilho N2/N3 ou numa data-limite, depositada com o advogado) é melhor do que nada. O que **não** funciona para durar é ficar fechado *sem* escrow.

#### 3.6 Quem paga a hospedagem em 2080? (financiamento)

**Resposta honesta:** hoje, **o cartão do dono**; o jogo **não tem monetização** (`CLAUDE.md` §8, `game-economy-designer`). Em 2080 o dono terá 54 anos a mais do que hoje; em 2100, provavelmente ninguém que o conheça. Logo o plano precisa de um **fluxo que não dependa de uma pessoa**: **capital (fundo) + doações + parceria**.

**Aritmética [CÁLCULO, `dt_funding.js`]: principal = custo anual ÷ taxa de retirada sustentável.** Os custos são **[HIPÓTESE]**; o dono substitui pelos reais (D4).

| Cenário | Custo/ano | Principal a 4% | a 3% | a 2% |
|---|---|---|---|---|
| **A** — só N3/N4 (domínio + 2 armazenamentos + monitor) | US$ 250 | 6.250 | **8.333** | 12.500 |
| **B** — N1 mínimo (VPS + Postgres gerenciado + domínio + backup) | US$ 1.500 | 37.500 | **50.000** | 75.000 |
| **C** — B + entidade (contador, advogado, seguro, auditoria simples) | US$ 8.000 | 200.000 | **266.667** | 400.000 |

Notas: (1) a regra dos 4% vem de aposentadoria de ~30 anos; **para perpetuidade uso 2–3% real [HIPÓTESE]** — a Lei 13.800 só permite gastar o rendimento **líquido de inflação** **[V]**, o que na prática é essa restrição; (2) só o **domínio** custa ~US$ 16/ano no exemplo de um registrador **[V, busca: Dynadot]** ⇒ **≈ US$ 530 de principal a 3%** bastam para nunca mais deixar o domínio cair: é o investimento de melhor relação risco/custo do plano; (3) precedente de fundo de 200 anos: o legado de Franklin a Boston e Filadélfia (1790) cresceu para mais de US$ 6,5 milhões em ~200 anos segundo a imprensa **[C: as fontes divergem quanto ao valor inicial em dólares; Snopes tem uma verificação sobre isso]** — o ponto útil não é o número, é que *funcionou*, mas passou por décadas de mudança de regras e de decisões políticas; (4) **câmbio e inflação** (o custo é em dólar; a entidade é brasileira) exigem revisão anual; (5) muitas renovações não têm como ser pré-pagas: 113 renovações de domínio, ~4.550 de certificado a 90 dias (~9.100 a 45 dias) e ~13.455 mensalidades **[CÁLCULO]**; só **automação + dinheiro atrelado a uma entidade** aguenta isso.

**Fontes de dinheiro (sem monetização hoje):**

| Modelo | Prós | Contras |
|---|---|---|
| **Fundo (endowment)** | independe de fãs | exige capital de largada; gestão e regulação (S3) |
| **Apoio recorrente** (financiamento coletivo/patronato) | fácil de começar | depende da comunidade continuar; cai quando o jogo cai — bom para custeio de N1, ruim como base perpétua |
| **Doações a uma entidade sem fins lucrativos** | encaixa em S1–S3 | tributação de doações (ITCMD) e regras de recibo **[M]** — contador |
| **Patrocínio/edital cultural** | pode financiar a criação do fundo | competitivo, ciclos curtos; verificar leis de incentivo à cultura **[M]** |
| **Vender cosméticos/itens** | dinheiro contínuo | choca com o anti-RMT do plano e, com menores, com a proibição de *loot boxes* da Lei 15.211/2025 **[V, skill de compliance]**; **não recomendo** |
| **Reduzir o custo (subir o piso)** | um jogo *vivo* caro pode *descer* sem morrer | reduz a experiência, não a existência |

**Regra de decisão:** o **primeiro item do orçamento da entidade é sempre N3/N4**. N1 só é mantido se sobrar.

#### 3.7 O que exige advogado/contador (lista para o `digital-succession-counsel` e profissionais)

1. Escolha e estatuto da entidade (S1/S2/S3) e se a finalidade "preservação de patrimônio cultural digital/jogo" cabe no art. 62 e na Lei 13.800. 2. **Testamento** com cláusula de instituição de fundação e de destinação do domínio, do código e dos ativos. 3. Titularidade do domínio e das contas em nome da entidade (transferência a partir da pessoa física). 4. Licença do código e dos assets; **auditoria de procedência** (`assets2/`, música); registro de marca (INPI **[M]**). 5. *Escrow* (se a opção for fechada). 6. Papéis da LGPD depois do dono (controlador = entidade), transferência internacional aos armazenamentos B/Instituição, e regras de retenção do arquivo. 7. Termos de Uso: **cláusula de cessão do serviço** à entidade sucessora e **cláusula de encerramento gradual** (prazo, exportação, o que resta). 8. Tributação das doações, imunidade/isenção de entidade sem fins lucrativos, contabilidade. 9. Contratos com fornecedores em nome da entidade. 10. Eventual uso de criptoativos/blockchain própria (marco legal) — só depois da fase da seção 5. 11. Procuração e limites de poder do adjunto.

### 4. Limites técnicos de longevidade

#### 4.1 Auditoria de datas e números por camada (testes reais em **Node v24.15.0**, `dt_limits.js`)

**Testes de relógio rodados [VERIFICADO — Node]:**

| Teste | Resultado |
|---|---|
| `2037-12-31T23:59:59Z` | ok, epoch 2.145.916.799 |
| `2038-01-19T03:14:07Z` (último instante de um inteiro de 32 bits) | ok, epoch 2.147.483.647 |
| `2038-01-19T03:14:08Z` (um segundo depois) | **ok** — `Date` do JS não usa 32 bits; mas `(2**31)\|0` e `Int32Array` viram **−2.147.483.648** (a falha existe onde houver `int32`) |
| `2100-02-29` (2100 **não** é bissexto) | `Date` **corrige** para `2100-03-01` silenciosamente — não dá erro |
| `2400-02-29` (bissexto, divisível por 400) | ok |
| `3147-12-31T23:59:59Z` | ok, epoch 37.174.031.999 |
| `9999-12-31T23:59:59Z` | ok |
| `Date.UTC(10000,0,1).toISOString()` | `"+010000-01-01T00:00:00.000Z"` (**ano expandido, com sinal e 6 dígitos**) |
| `new Date("10000-01-01T00:00:00Z")` (sem o `+`) | **Invalid Date** |
| máximo de `Date` | `+275760-09-13`; um milissegundo depois = **Invalid Date** |
| `JSON.parse("9007199254740993")` | `9007199254740992` (**perde 1**); string decimal + `BigInt` preserva |
| `XPRequired(1e11) = 100·L^1,45` | `8,913e17` — **acima** de 2^53 (9,007e15) |

**Tabela por camada:**

| Camada | Limite | Efeito até 3147 | Teste | Fonte |
|---|---|---|---|---|
| JavaScript `Date` | ±8,64e15 ms ⇒ até o ano 275.760 | 3147 ok | acima | **[V] Node** |
| JS `Number` | inteiro seguro até 9.007.199.254.740.991 | **XP, dano, score passam** | acima | **[V] Node** |
| JSON/ISO-8601 | 4 dígitos até 9999; depois `+YYYYYY` | 3147 ok; **10000 exige que leitores aceitem ano expandido** | acima | **[V] Node** |
| Postgres `timestamptz`/`timestamp` | 4713 a.C. a **294276 d.C.**, 1 µs | ok | consultar após restaurar | **[V]** postgresql.org/docs/current/datatype-datetime.html |
| Postgres `date` | até **5874897 d.C.** | ok | — | **[V]** idem |
| Postgres `integer` (int4) | ±2.147.483.647 | **contadores do jogo podem estourar** (abaixo) | inserir 2.147.483.647+1 em cópia | **[V]** definição do tipo; colunas em `server/db.js` |
| Postgres `bigint`/driver `pg` | 2^63−1 = 9.223.372.036.854.775.807; `setTypeParser(20, Number)` só é seguro < 2^53 | ok para nível/atributos (~5e11) | — | **[V]** `db.js` linha 21 |
| SQLite | sem tipo de data nativo; funções de data cobrem **0000-01-01 a 9999-12-31** | 3147 ok; texto ISO de 4 dígitos quebra em 10000 | — | **[M]** (não re-verifiquei); **[V]** política 2050: sqlite.org/lts.html |
| Java/Android | `currentTimeMillis()` é `long`; **`time_t` de 32 bits em ABI de 32 bits** | ok no WebView/JS; risco só em código nativo de 32 bits | emulador com relógio em 2038-01-19 03:14:08 | **[V]** bionic (android.googlesource.com) |
| Linux (servidor) | kernel 5.6+ prepara 32 bits para depois de 2038; 64 bits ok | VPS de 64 bits ok | `date -s` em VM de teste | **[V]** busca (Phoronix/opensource.com) |
| Capacitor WebView | herda JS | igual ao JS | idem | **[M]** |
| Calendário | gregoriano; segundo intercalar em revisão | irrelevante se gravarmos **contadores e UTC** | — | **[M]** |

**O problema real do jogo em 2038 e depois não é `Date`: são as colunas `INTEGER`.** Contas **[CÁLCULO]**:
- **Segundos ativos totais a 1 h/dia até 31/12/3147 = 1.474.336.800 = 68,7 % do `int4`.** Por isso **um contador de segundos em `int4` só cabe para a régua de 1 h/dia**; a **3 h/dia = 4,42e9 estoura**; e **em milissegundos estoura mesmo a 1 h/dia** (1,47e12). Regra: **segundos/milissegundos em `bigint`**. **`09` já cumpre a regra** nas tabelas novas (`lineages.total_seconds_credited BIGINT`, `keepers.seconds_credited BIGINT`, `playtime_yearly.seconds_credited BIGINT`); em `playtime_daily.seconds_*` e `playtime_sessions.seconds_credited` ele usa `INTEGER`, o que é **seguro** porque um dia tem no máximo 86.400 s (o total acumulado é que exige `BIGINT`). Confirmo esse desenho.
- **(Fora do escopo de `09`, e por isso registrado aqui)** as colunas **antigas** continuam `INTEGER`. **`total_kills` (int4)** só cabe se a média for **≤ 5.244 abates/hora** ao longo das 409.538 h (= 87/min). Um jogador de alto nível pode passar disso — **migrar para `bigint`** (dono da tarefa: `backend-architect`; **depende** do que o `progression-actuary` fizer com abates e XP). O mesmo para `total_items_collected`, `total_lives_collected`, `deaths`.
- **`SERIAL` (int4)** de diário/mensagens/amizades: 2,1 bilhões de linhas, sem risco realista (a 1.000 mensagens/dia, ~5.900 anos), mas um *bot* de spam mudaria a conta — usar `bigserial` em tabelas novas.
- Diário (dias jogados) em int4 cabe (409.538 ≪ 2^31).
- `xp`/`score`/`time` (float64): o problema é **precisão**, não faixa (E7).
- **Fuso e horário de verão** mudam por lei (o Brasil aboliu o horário de verão em 2019 **[M]**): guardar **UTC**, derivar a hora local na leitura; a definição de "dia de jogo" para a régua de 1 h/dia é do `progression-actuary`.

**Suíte de testes de relógio para cada camada (parte do simulacro):** ajustar o relógio para 2037-12-31, 2038-01-19T03:14:08Z, 2100-02-29→03-01, 3147-12-31, 9999-12-31 e +10000-01-01 e verificar: (i) cliente JS (nível, XP-string, `toISOString`); (ii) servidor Node; (iii) Postgres e SQLite restaurados; (iv) WebView no emulador Android; (v) o visualizador do Arquivo.

#### 4.2 Criptografia e algoritmos

- **bcrypt.** O servidor usa `bcryptjs` com custo **10** (`db.js` linhas 846–1023 **[V]**). O custo vai de 4 a 31 na implementação **[M]**. **[CÁLCULO, hipótese de hardware dobrando a cada 2 anos]** para manter a mesma dureza o custo equivalente subiria 1 a cada 2 anos e **chegaria ao teto (31) por volta de 2068**. Conclusão: **bcrypt não é uma primitiva de mil anos**; o servidor já tem o padrão "migrar no próximo login" (usado na migração de texto puro para bcrypt em 18/08/2026 **[V: `db.js` 832–852]**), então a rota de trocar de algoritmo existe. E o **arquivo nunca contém hash de senha.**
- **Quântica.** O algoritmo de Grover só dá ganho quadrático em busca (não quebra SHA-256/bcrypt na prática **[M]**); o de Shor ameaça **RSA/ECC** (troca de chaves e assinaturas do TLS). O NIST publicou os padrões FIPS 203 (ML-KEM), 204 (ML-DSA) e 205 (SLH-DSA) e, no **rascunho** IR 8547, propõe **deprecar RSA-2048/ECC P-256 em 2030 e proibir em 2035** **[V, busca; é rascunho, não confirmei se virou final]**. Consequência: a pilha TLS do servidor (nginx/OpenSSL/certbot) precisará de atualização em **~2030–2035** **[H]**. Para o arquivo: hash-chain + várias testemunhas **não dependem de assinatura**; assinatura (Ed25519 hoje; assinatura baseada em hash, como a FIPS 205, como opção conservadora) **acrescenta** identidade mas as chaves morrem — **nunca** deve ser a única prova.
- **Criptografia de arquivos é armadilha em séculos** (perder a chave = perder o dado). Camada pública **em texto claro**; só a camada privada é cifrada (AES-256 simétrico, chaves sob *break-glass*) e com prazo (≤ 25 anos) — **[M]**.
- **TLS/certificados:** 90 dias hoje, **45 dias até 2028** **[V]**; o Let's Encrypt parou os e-mails de aviso em **04/06/2025** **[V]** ⇒ monitor externo obrigatório (E3).
- **JWT:** `jwtsecret` (persistido em `server/.jwtsecret` se ausente do `.env`) — segredo **rotacionável**, não precisa ser preservado; documentar a rotação.

#### 4.3 Navegadores, Canvas e JS

A plataforma web tem histórico forte de compatibilidade **[M]**; o risco está nas **bordas**: (a) **os 3 scripts de CDN e o broker MQTT** (E4), (b) políticas de autoplay/áudio, (c) TLS antigo, (d) mudança de política de segurança (`file://`, CSP). Regras do plano: o **cliente do Arquivo (N3)** é **um único HTML autossuficiente** + JSON, **sem nenhuma requisição externa**, testado abrindo por `file://` **e** por servidor estático, **com a rede desligada**; e a Crônica existe **também em texto puro (`.md`/`.txt`)** que não precisa de navegador. Como *último* recurso, emulação: o Domesday foi salvo assim **[V]**, por isso o documento registra **o ambiente de referência** (versões de Chromium, Node, Postgres, SO) e a receita para recriá-lo.

#### 4.4 APK, Capacitor e política de lojas

- **30/09/2026:** em Brasil, Indonésia, Singapura e Tailândia, dispositivos Android certificados passam a exigir que o desenvolvedor esteja registrado; **2027:** expansão global; aplica-se a Android 7+ **[V: developer.android.com/developer-verification + imprensa]**. Registro pelo *Android Developer Console*; existe conta **"distribuição limitada"** (gratuita, **sem documento de identidade**, até **20 dispositivos**) e registro padrão (com identificação e possível taxa) **[V: mesma página]**; há um "fluxo avançado" de instalação para usuários avançados e o ADB continua possível **[V: imprensa; a página oficial não detalha o bloqueio]**. **Para um APK baixado do site, isso é o risco mais próximo no tempo** (E1).
- **Piso de `targetSdk`:** Android 14 recusa apps com `targetSdk < 23`; Android 15 recusa `< 24` **[V, busca]**. O app usa `targetSdk 36` e `minSdk 24` **[V: `variables.gradle`]** — ok hoje; a régua sobe com os anos, então o APK **precisa ser reconstruído** periodicamente (5.1).
- **Toolchain a arquivar:** `gradle-8.14.3-all.zip` (baixado de `services.gradle.org` em cada build — **dependência de internet**), Android Gradle Plugin 8.13.0, JDK (o `build.gradle` exige compatibilidade 17), SDK platform 36, Capacitor 8.
- **Estratégia:** **a web é o aplicativo** (funciona em qualquer navegador e é a única versão que o arquivo consegue reproduzir sozinha); o APK é conveniência. Decisão D1.

#### 4.5 Cronograma de manutenção (o que exige migração periódica)

Contagem de referência **[CÁLCULO]**: se cada LTS do Node dura ~2–3 anos, **acompanhar cada LTS por 1.121 anos daria da ordem de 400–560 migrações de runtime**; para Postgres (suporte de 5 anos por versão **[V]**), o mínimo é **≈ 224 saltos**. **Conclusão de projeto: o plano não persegue versões por séculos.** Ele **congela** (N3/N4 não têm runtime), **arquiva** (dependências vendorizadas, ambiente de referência) e **recria** quando alguém quiser.

| Periodicidade | Tarefa | Dono |
|---|---|---|
| **Trimestral** | *scrub* de hashes em todas as cópias; restore de teste do dump mais recente; validade de certificado e de cartão a > 90 dias; conferir data de expiração do domínio | adjunto |
| **Anual (1 ano)** | **simulacro de restauração completo** (6.3); testar *break-glass* (mantenedores abrem sua parte, sem usar o segredo); rotacionar segredos; revisar EOL de Node/Postgres/SO (ex.: Node 24 acaba em 30/04/2028 ⇒ migrar até **2027-T4**; PG 18 em 14/11/2030 ⇒ planejar em 2029 **[V]**); rever preços/plano de Supabase/hospedagem; build de teste do APK; suíte de relógio; atualizar o "Como reconstruir"; relatório de saúde na Crônica (anexo técnico) | Guardião do documento |
| **5 anos** | reler os formatos com ferramentas *atuais* e reexportar; guardar a geração anterior por um ciclo; trocar mídia offline; reconstruir o toolchain do APK e o ambiente de referência; migrar Node/SO/Postgres se saíram de suporte; revisar mantenedores e instituições; reestimar o custo real e o fundo (inflação/câmbio); checar contas/relatórios da entidade (prestação de contas ao MP, se fundação) | Conselho |
| **10 anos** | ciclo máximo de renovação do domínio (**10 anos** é o teto **[V]**) + **teste de transferência de registrador**; revisão de hardware e mídia; reavaliar a pilha web (o cliente ainda roda "como está"? portar?); **segunda pessoa revisa o plano inteiro** | Conselho + adjunto |
| **20 anos** (alinhado à Renovação de `01`, Princípio 7; ≈ 1 geração de operador) | **reconstrução do zero por alguém novo** a partir do Arquivo e do documento (a versão "Ise" da migração: a reconstrução *é* a renovação — o santuário de Ise é reconstruído a cada 20 anos, o 62º em 2013 e o próximo em 2033 **[V pela skill 2026-09-20; não re-pesquisei hoje]**; cada linhagem faz a **sua** Renovação no mesmo ritmo — `01`); reaplicar a suíte de datas/algoritmos; recalcular hashes com o padrão então vigente (adicionar, não substituir); revisar idioma dos documentos e acrescentar glossário; renovar o estatuto da entidade | Conselho + novo Guardião do documento |
| **50 anos** | a entidade ainda existe? se não, **transferir a custódia** para outra (S4); copiar o Arquivo público para uma mídia fria de longa duração (precedente: piqlFilm no Arctic World Archive **[V]**) e imprimir índice + hashes da cabeça da Crônica; decidir se N1 ainda faz sentido | mantenedores |
| **100+ anos (a cada século)** | **reescrever este plano**; o LEIA-ME ganha uma seção "o que era um navegador" (Rosetta); verificar UTF-8/Markdown/JSON legíveis; a promessa nessa faixa é só "o registro e as regras podem ser reconstruídos" | quem tiver o arquivo |

### 5. O papel honesto da blockchain proprietária futura

**O que ela é aqui:** um item **real** do roadmap (`CLAUDE.md` §2, pós-Episódio 2), **ainda não iniciado**, e **sem nenhuma relação com a DeSo** (a DeSo foi usada, removida e não volta; "DeSoHosting" é só o nome do provedor da VPS). O plano de durabilidade **não pode depender** de algo que não existe.

**Em que ajuda (como *uma testemunha entre várias*):**
1. **Âncora de hash da Crônica** (a "cabeça" da cadeia de hash de 2.3), dando carimbo de tempo público e verificável, independente do servidor do jogo.
2. **Custódia distribuída** de cópias/manifestos, se houver operadores independentes.
3. **Verificação pública** sem pedir permissão ao operador.

**Em que NÃO ajuda:**
1. **Blockchains também morrem** (abandono, bifurcação, perda de operadores). Até o Bitcoin tem uma pergunta aberta a ~115 anos daqui: o subsídio de bloco chega a zero perto de **2140** (33 *halvings* ≈ 2141 **[CÁLCULO aproximado; o esquema é conhecido, ~2140 **[M]**]**) e a segurança passa a depender só de taxas. Uma cadeia *própria* de um jogo, operada por poucas pessoas, tem risco muito maior.
2. **Não elimina o problema do operador; troca de lugar:** nós, clientes, financiamento, migração e governança continuam existindo.
3. **Custo e complexidade** para um dev solo; **bugs em consenso** são catastróficos; **guardar estado por 1.121 anos on-chain** é caro (por isso só *hash*).
4. **Regulação** (tokens, criptoativos) e tributação — pergunta ao advogado antes de qualquer token.
5. **Não substitui o arquivo**: a cadeia guarda prova, não o jogo.

**Convergência com os colegas.** `05` §5.2 ("o papel honesto e não-hype da blockchain própria é ser a âncora externa da cabeça da Crônica") e `09` §1.4 chegam à mesma conclusão que eu: 32 bytes carimbados, nunca o jogo nem o save. Concordo; a ressalva é a de 2.6 — **uma testemunha só conta se não depender de uma conta do operador**.

**Precedente que relativiza o "precisa ser blockchain":** o serviço Surety publicava semanalmente o hash de todos os selos de tempo num anúncio do *New York Times* desde meados da década de 1990 **[V]**. **Testemunhas baratas já existentes:** repositório público, Internet Archive, e-mail a mantenedores, jornal/publicação impressa e serviços de carimbo de tempo abertos (ex.: OpenTimestamps **[M, não verificado hoje]**).

**O que precisa ser verdade para ela somar durabilidade:** (1) ≥ N operadores **independentes** da organização; (2) especificação e cliente abertos; (3) a Crônica em arquivos continua **autoverificável sem a cadeia** (a cadeia só acrescenta evidência); (4) nós e migração financiados no fundo; (5) plano de saída: poder **re-ancorar** em outra cadeia/serviço; (6) a organização sobrevive ao dono (fase 3.3).

**Recomendação de fase (sem se comprometer com uma tecnologia): entra só depois** de: (a) Arquivo v1 e Crônica com ≥ 1 ano de entradas reais; (b) cadeia de hash em arquivos funcionando e testada no simulacro; (c) entidade jurídica constituída; (d) linha de orçamento para testemunhas. **Se ela nunca sair, nada quebra:** o plano foi desenhado com a regra "cadeia opcional".

### 6. Teste de sobrevivência

#### 6.1 O teste dos 50 anos, respondido (sim / parcial / não, com evidência e risco com dono e data)

Datas de prazo são **propostas [HIPÓTESE]**; o dono confirma em D-roadmap.

| # | Item | Resposta | Evidência | Risco → dono → prazo proposto |
|---|---|---|---|---|
| 1 | Domínio pago e com renovação automática pelo máximo de período, financiado por entidade que não seja o cartão pessoal | **NÃO** | registrador e vencimento **[NÃO VERIFICADO]**; teto de 10 anos **[V]** | R1 domínio pode cair (T4) → Dono → **2026-10-15** (conferir data + trava + 2FA) e **2026-12-31** (pré-pagar) |
| 2 | Hospedagem pré-paga/por fundo; **uma segunda pessoa** sabe subir | **NÃO** | um só operador; `deploy.sh` defasado (E2) | R2 → Dono + adjunto → **2027-03-31** |
| 3 | Todo segredo recuperável por *break-glass*; nenhum no repositório | **PARCIAL** | nenhum segredo no repositório **[V: `.env*`, `.jwtsecret` ignorados]** ✔; recuperação: **inexistente** ✘ | R3 → Dono + `security-engineer` → **2026-11-30** |
| 4 | Arquivo completo, **restaurado em teste**, em ≥ 2 provedores independentes | **NÃO** | sem backup visível (E8); nenhum arquivo definido | R4 → `tools-programmer` + Dono → **2026-12-31** (dump ×2) e **2027-06-30** (Arquivo v1) |
| 5 | Documento de reconstrução seguido com sucesso por quem não é o autor | **NÃO** | não existe; scripts se contradizem | R5 → Dono → **2027-03-31** |
| 6 | Dependências fixadas, espelhadas e com caminho de atualização documentado | **PARCIAL** | `package-lock` existe (servidor 136 pacotes) ✔; **CDNs e `mqtt` sem versão** ✘ (E4); toolchain Android baixado da internet ✘ | R6 → `tools-programmer` → **2026-12-31** |
| 7 | As regras da escada e da Passagem estão **no arquivo**, não só no código | **NÃO** | as regras vivem em `rpg_system.js`; a Passagem ainda não existe | R7 → `legacy-systems-designer` + esta equipe → **2027-06-30** |
| 8 | Entidade jurídica, licença e cláusula de sucessão do operador | **NÃO** | sem `LICENSE`; sem entidade; sem cláusula | R8 → Dono + advogado → licença **2026-12-31**, entidade **2027-12-31** |
| 9 | Testes de relógio/limite passam em todas as camadas | **PARCIAL** | JS/`Date` testado hoje ✔ **[V]**; **Postgres/SQLite/Android não testados**; colunas `int4` existem (E6) | R9 → `backend-architect` + `qa-lead` → **2027-03-31** |
| 10 | Plano de encerramento e escada de degradação **anunciados aos jogadores** | **NÃO** | texto sugerido na seção 7; não publicado | R10 → Dono → **2027-03-31** |

**Placar: 0 sim, 3 parcial (itens 3, 6, 9), 7 não.** Isso não é crítica ao projeto: o conceito é de esta semana. É o ponto de partida honesto.

#### 6.2 "Se o dev sumir por 50 anos, o que acontece no dia X?"

Primeiro **como está hoje** (previsão **[HIPÓTESE]**, dependente de fatos que não vi), depois **como deve ficar** com o plano.

| Quando | Hoje (sem plano) | Com o plano (alvo) |
|---|---|---|
| **D+0 a D+7** | nada muda; o jogo roda | o *check-in* falha; alerta ao adjunto |
| **D+30** | se o Supabase for gratuito e o tráfego cair, **pausa em 7 dias sem atividade** **[V]**; se pago, segue | o adjunto confere pagamentos e o *heartbeat* |
| **D+90** | certificado renova sozinho **se** o certbot funcionar; ninguém é avisado se falhar (E3) | 3 check-ins perdidos ⇒ adjunto assume os poderes mínimos por escrito |
| **Ano 1** | domínio pode expirar se não for renovação automática; Node sem patches | domínio pré-pago; a entidade paga; simulacro anual roda |
| **Ano 2–3** | cartão expira ⇒ **VPS suspensa e Supabase cobrança falha ⇒ jogo fora do ar**; GitHub segue (se público) mas **ninguém tem os segredos**; APK instalado continua apontando para o domínio | fundo cobre N1-R/N2; ou, se não houver, desce para N3 com aviso |
| **Ano 5** | **domínio lapsa; um estranho o registra e passa a receber e-mail+senha dos APKs antigos** (T4) | domínio nunca lapsa (10 anos pré-pagos, entidade, monitor); no fim, um último update do site avisa "serviço mudou de forma" |
| **Ano 10** | restam GitHub (se a conta existir), talvez cópias no computador do dev | Arquivo em ≥ 3 cópias, verificado 40 vezes; simulacro feito 10 vezes; primeira migração de formato concluída |
| **Ano 50** | provavelmente nada utilizável | N3/N4 vivos; a entidade (ou sucessora) segura o Arquivo; reconstrução testada 2 vezes |

**Checklist executável ("dia X")** — marque cada linha com data e responsável na hora do simulacro:
- [ ] Sei **onde** está o domínio, **quando** expira e **quem** tem acesso.
- [ ] O adjunto consegue **logar** no registrador, na VPS, no banco e no repositório **sem falar comigo**.
- [ ] O adjunto consegue **subir** uma instância nova a partir do Arquivo, sozinho, em ≤ 8 h.
- [ ] **≥ 3 dos 5** mantenedores responderam ao contato de teste em ≤ 7 dias.
- [ ] Os **hashes** de todas as cópias batem com o manifesto.
- [ ] A **cabeça da Crônica** reproduz exatamente após a restauração.
- [ ] O **cliente de arquivo** abre offline em um navegador atual.
- [ ] O **APK** (se existir) instala num aparelho com a política vigente.
- [ ] O **certificado** vence em > 14 dias e o alarme externo dispara em teste.
- [ ] O **cartão/fundo** cobre os próximos 12 meses.

#### 6.3 Simulacro anual de recuperação ("treino de incêndio") e critérios de aceite

**Procedimento:**
1. Escolher uma data fixa por ano (sugestão: 20 de setembro) e avisar os mantenedores.
2. **Só** o Arquivo mais recente **de uma cópia que não é a produção**, o documento "Como reconstruir" e o adjunto (sem o autor).
3. VM **nova** em um provedor **diferente** do de produção; Postgres puro.
4. Restaurar: `sha256sum -c MANIFESTO.sha256` (todas as linhas OK); importar `contas.jsonl`/SQLite.
5. Verificar: nº de contas igual; **amostra ≥ 10 contas** (ou todas, se < 100) campo a campo — nível e XP (strings) **idênticos**; **cabeça da Crônica** reproduzida e **comparada com a âncora externa publicada** (2.6).
6. Rodar a suíte de relógio (4.1) na instância restaurada.
7. *Break-glass*: ≥ 3 mantenedores abrem sua parte (não se usa o segredo).
8. Cronometrar; anotar cada divergência entre o documento e a realidade.
9. Publicar o resultado (data, duração, defeitos, próxima data) no **anexo técnico da Crônica**.

**Critérios de aceite (todos):**
| Critério | Meta |
|---|---|
| Integridade | **100 %** dos hashes OK em **todas** as cópias |
| Restauração | **100 %** das contas restauradas; **0** diferenças na amostra |
| Crônica | cabeça reproduzida **exatamente** e **igual a uma cabeça publicada externamente** (W2/W3/W5 de 2.6), não só à que o banco informa (`05` §5.3) |
| Tempo (N1) | **RTO ≤ 8 h** por não-autor; RPO ≤ 24 h **[HIPÓTESE]** |
| Tempo (N3) | recolocar o arquivo público no ar em **≤ 7 dias** |
| Relógio | 6 datas de teste sem falha em todas as camadas |
| Acesso | ≥ 3 de 5 mantenedores em ≤ 7 dias |
| Documento | ≤ 3 correções; **nenhuma** que bloqueie o progresso |
| Custo | fundo ≥ 12 meses do nível corrente |
Falhou um critério? **O risco correspondente sobe de nível, ganha dono e data**, e o simulacro se repete em ≤ 90 dias. **Um mecanismo que ninguém testa por um ano é tratado como quebrado.**

### 7. Honestidade — o que ninguém consegue garantir, e como o plano diz isso

**O que ninguém consegue garantir (em ordem de certeza decrescente):**
- Que **a mesma empresa, site, navegador, formato ou tecnologia** exista em 3147. Nenhuma existirá em 1.121 anos exatamente como hoje; os mais antigos exemplos de continuidade (Ise, Kongō Gumi, o Domesday Book) sobreviveram **por renovação e por pessoas**, e mesmo assim um deles perdeu a independência em 2006.
- Que **este jogo** tenha uma entidade viva em 2080.
- Que **as pessoas de 2100** queiram jogá-lo. A régua de 3147 é um **horizonte de design**, não uma promessa de operação.
- Que a **blockchain**, se vier, dure mais que o restante.
- Que **este plano** esteja certo: ele vence só se for **refeito** a cada ciclo.

**O que o plano promete (e cumpre por processo, não por fé):** sobreviver ao previsível, degradar com aviso e exportação, e ser recriável a partir de texto aberto e cópias independentes, com verificação anual e simulacro.

**Texto sugerido — inglês (para os Termos e para a tela do Legado; rascunho a validar por advogado, não cria garantia):**

> **What we can and cannot promise**
> Danger Ghost is designed to be passed from one Keeper to the next over a very long time. Nobody can promise that a website, a company, an app, or a technology will still exist in the year 3147, and we do not promise it. Here is what we commit to:
> 1. We keep the game record of every account in open, documented formats, and we copy it to several independent places, checking those copies regularly.
> 2. If the live game has to shrink, it will do so in steps — full game, read-only, public archive, documented dataset — with advance notice whenever possible, and with a way for you to export your part.
> 3. We publish how the game works, so that others can rebuild it.
>
> What we cannot promise: that the servers will keep running, that any app or website will stay available, or that any organization, including ours, will still exist. If the service ends, the record and the rules are meant to outlive it. The year 3147 is a design horizon for the game's pace, not a guarantee of service.

**Texto para o dono (PT-BR):**

> **O que podemos e o que não podemos prometer**
> O Danger Ghost foi pensado para passar de Guardião para Guardião por muito tempo. Ninguém pode prometer que um site, uma empresa, um aplicativo ou uma tecnologia existirá em 3147, e nós não prometemos isso. Nós nos comprometemos a: (1) guardar o registro do jogo de cada conta em formatos abertos e documentados, copiado em vários lugares independentes e conferido com regularidade; (2) se o jogo ao vivo precisar encolher, fazê-lo em etapas — jogo completo, somente leitura, arquivo público, conjunto de dados documentado — com aviso antecipado sempre que possível e uma forma de você exportar a sua parte; (3) publicar como o jogo funciona, para que outras pessoas possam recriá-lo. Não podemos prometer que os servidores continuem ligados, que um aplicativo ou site continue disponível, nem que qualquer organização, inclusive a nossa, continue existindo. Se o serviço acabar, o registro e as regras foram feitos para sobreviver a ele. O ano 3147 é um horizonte do ritmo do jogo, não uma garantia de serviço.

**Como comunicar sem prometer o impossível:** (i) esse texto nos Termos e na tela do Legado; (ii) **uma página pública "Saúde do Legado"** com data do último simulacro, quantas cópias existem, próximo vencimento do domínio e nível atual (N1/N2/N3/N4) — **números verificáveis em vez de adjetivos**; (iii) nunca usar "eterno", "para sempre", "garantido"; (iv) nunca vender nada com base em durabilidade (choca com o plano anti-RMT e, com menores, com a Lei 15.211/2025).

### 8. Alinhamento com `01`, `03`, `05` e `09` — onde concordo e onde discordo

Li `09` quase inteiro (§0–§3 e §4.4–§(f)); de `01`, `03` e `05` li as partes que tocam durabilidade (busca por arquivo/exportação/âncora/custódia/e-mail/encerramento e as seções de Crônica, integridade, Cofre, Chave do Legado e e-mail). **O que não li está dito em (f).**

#### 8.1 Onde concordo (e o que isso acrescenta à durabilidade)

| Relatório | Ponto | Por que concordo / o que acrescento |
|---|---|---|
| `09` §1.5 | **Duas camadas de tempo**: sessões quentes (retenção 2 anos, descartáveis) + **dias selados permanentes com hash encadeado**; **heartbeat cru inviável** (24,5 milhões de linhas e ~3 GB por linhagem) | Confirmo. Para o Arquivo: as **sessões cruas nunca são arquivadas**; o **dia selado é a prova** e vai inteiro (2.3.4) |
| `09` §1.5 | **Partições por década** no `playtime_daily` (113) e não por mês (13.452) | **[CÁLCULO]** 1.121 anos ÷ 10 = 112,1 → 113. Concordo; e a partição de uma década vira naturalmente a **unidade de arquivamento frio** |
| `09` §1.7 | **`xp_total NUMERIC(40,0)`** + `BigInt` nos clientes; **nunca** `setTypeParser(1700, Number)` | Confirmo (29 dígitos em 3,64e28 cabem em 40). O envelope do Arquivo espelha: `xp_total` é **string decimal exata** (2.3.1) |
| `09` §5.1 | O **envelope de exportação por linhagem** com bloco `integrity` | **Adotado** (2.3.1), com as mudanças listadas |
| `09` §5.3 | Teste de restauração trimestral (`verify_chronicle.js`, `verify_ledger.js`) | Adotado; passa a ler **do arquivo exportado**, sem Postgres (2.3.2), e a exigir **âncora externa** (2.6) |
| `09` D-5 (C) | **Supabase pago + réplica na VPS + export semanal fora** | Concordo, com 3 ressalvas: (i) **réplica não é backup** — replica o `DELETE`/a corrupção; precisa de **dump com retenção** por cima; (ii) não verifiquei se o plano do Supabase permite replicar para um destino externo **[NÃO VERIFICADO]** — o dump agendado é o mínimo garantido; (iii) a réplica na VPS dá independência **do Supabase**, não **do provedor da VPS** (por isso o Arquivo vai também para 2 armazenamentos de objetos em outras empresas — 2.5) |
| `09` D-6 / `03` R2 | `token_epoch`/`epoch` (revogação de sessão) | Fora do meu escopo; concordo que é pré-requisito da sucessão |
| `05` §4.5, §4.7 | **Papel como âncora do Guardião**; **e-mail é canal, nunca prova de posse** | Adotado (2.7; T15). Meu T4 mostra o **mesmo vetor** pelo lado do domínio (o APK manda a senha ao domínio) |
| `05` §5.3 | Restauração só é aceita se a **cabeça restaurada bater com uma cabeça publicada externamente** | Adotada como critério de aceite (6.3) |
| `03` T7/T9 | **Investidura só ocorre se o arquivo de integridade da linhagem verificar** | Excelente: o ritual **é** o teste de restauração por Passagem (2.3.3) |
| `03` §T22, §3.7 | **Arquivada = Monumento** com página estática; exportação **JSON + Markdown + PDF/A**, hash por arquivo guardado à parte, ≥ 2 cópias em provedores independentes | O Monumento **é** o formato de N3 (2.1); a exportação está em 2.3 |
| `01` D6 (b), Princ. 7, C5 | **"Ritos finais" desde o dia 1**; **Renovação a cada 20 anos**; o registro precisa **sobreviver ao jogo** | Adotados (2.1, 4.5). Vocabulário em inglês: **Keeper**, **Chronicle**, **Handover** |

#### 8.2 Onde discordo ou corrijo, explicitamente

| # | Onde | O que diz | O que eu digo | Evidência | Quem decide |
|---|---|---|---|---|---|
| **1** | `09` §1.4, `05` §5.1, `03` §1.7 | **Três** fórmulas de hash diferentes para a mesma função (a de `09` concatena `prev‖seq‖type‖occurred_at_iso‖payload_hash` sem separador; a de `05` faz o mesmo com `BYTEA`; `03` não especifica) | **Uma regra só**, sobre **objeto JSON canônico** (RFC 8785), com prefixo de versão e formato de data fixo (2.3.2). Consertar depois que a cadeia existir é **impossível** (muda todos os hashes): tem que ser decidido **antes do primeiro evento gravado** | **[V — Node]** `"P"+1+"2x"` e `"P"+12+"x"` → mesmo SHA-256. Não é explorável com os tipos de evento atuais (todos começam com letra); é uma falha de **especificação**, não um exploit | `backend-architect` + coordenador |
| **2** | `09` (a).3, §1.5, §6 | **≈ 33 MB por linhagem**; **33 GB** para 1.000 linhagens | **~117 MB** (hashes em `TEXT`, como em `09`) ou **~91 MB** (em `BYTEA`); **~117 GB** para 1.000 linhagens. **A conclusão dele (viável) continua verdadeira**; o número serve para dimensionar o plano do Supabase e o custo de verificar | **[CÁLCULO]** estimativa por campo (tupla ~249 B + índice ~36 B); exportação medida em 20.000 linhas sintéticas: 490 B/linha bruto, 49 B gzip (`dt_sizes.js`). **Não medido no banco** | `backend-architect` (medir com `pg_relation_size` numa cópia) |
| **3** | `09` §1.2 (`contact_email_hash`) e `03` T18 ("e-mail vira hash 12 meses depois") | Um SHA-256 do e-mail "sobrevive ao apagamento do claro (LGPD)" | Um hash **sem chave** de um e-mail é **reidentificável por dicionário** — continua dado pessoal; **não** entra no arquivo público. Se um vínculo for necessário, **HMAC com chave na camada privada** | raciocínio padrão (e-mails têm entropia baixa) **[M]** | `digital-succession-counsel` |
| **4** | `09` D-1 (A) × `03` T7 × `05` §4.3 | Três respostas incompatíveis para "o que acontece com o login na Passagem": **(A)** o e-mail do fundador fica como login para sempre; **(T7)** a identidade de login **troca** na Investidura e o hash antigo é destruído; **(05)** nenhuma credencial troca de mãos — o Herdeiro entra com a **própria** conta | Do ponto de vista da **durabilidade**, **(A) só serve como passo de migração** (não mexe em PK com 8 FKs): como estado final deixa o Herdeiro **dependente de um endereço que pode morrer ou ser recomprado por um estranho** e mantém o fundador com um caminho de retorno pela caixa dele. O fim deve ser T7/05: **login substituível na Passagem; e-mail = canal**. **Para o meu Arquivo não importa qual modelo vença** (login e e-mail ficam de fora nos três); só um ponto importa: **`lineage_id` tem que ser independente de qualquer login**. Se o modelo de `05` vencer, `account_id` **some** do envelope e `lineage_id` é a única chave | PyPI: domínios em expiração invalidam e-mails **[V]** (T4) | **dono** (`09` D-1) + `legacy-systems-designer` |
| **5** | `05` §5.2 | O "post público semanal" no Twitter/Telegram cumpre a função de âncora | É **conveniência**, não **testemunha**: uma conta é um ponto único (some com o operador, com suspensão ou com mudança de termos). Testemunhas independentes: **Internet Archive, e-mail a todos os Keepers e mantenedores, papel anual** (2.6) | mesma lógica de E1/E3/T13 | dono (D12) |
| **6** | `05` §4.5 | Guardar o hash da Chave do Legado com **Argon2id ou bcrypt** | Para um segredo de **256 bits**, **SHA-256** basta e **não envelhece**; bcrypt/Argon2 são para senhas de gente, e o custo do bcrypt tem teto (4.2) | mesma razão que `09` §1.3 dá para o token de resgate | `security-engineer` |
| **7** | `09` §1.4 vs `05` §5.2 | Âncora **mensal** vs **semanal** | **Semanal** (32 bytes; uma linha de `cron`); a lista completa de cabeças por linhagem vai no arquivo semanal, e o **hash da lista** é a âncora | 2.3.2, 2.6 | dono |
| **8** | `09` §2.6 (`sealDay`) × rotina do Arquivo | `sealDay` roda à noite; o dump/exportação não tem hora definida | O dump, a exportação e a âncora têm que rodar **depois** do `sealDay` e da verificação da cadeia, na ordem **`sealDay` → `verify` → dump → exportação → âncora**, e a âncora carrega `last_sealed_day`. Senão o Arquivo captura um dia pela metade e a cabeça publicada não bate com a restaurada | consequência direta do desenho de `09` | `backend-architect` |
| **9** | `09` roadmap (F0–F6) | Durabilidade é a **última** fase (F6, 3–5 dias) | Concordo que o **exportador completo** venha na F6, mas **duas coisas precisam ser anteriores à F0**: (i) **dump diário verificado para 2 destinos**, e (ii) a regra **"nenhuma migração de F0–F4 roda sem um dump restaurado e verificado nas últimas 24 h"**. Motivo: `migrate_level_bigint.js --confirm` e as migrações seguintes tocam produção **sem staging** (`09` risco 2), e hoje **não vejo backup nenhum** (E8) | E8; `09` §(f) riscos 2–3 | dono + `backend-architect` |
| **10** | esquemas `03` × `09` × `05` | Nomes diferentes para a mesma coisa (`lineage_key` × `lineage_id`; `guardian_term` × `keepers`; `custody_log`+`chronicle_text` × `chronicle_events` × `chronicle_entries`; `seq` global `BIGSERIAL` × `seq` por linhagem) | O exportador precisa de **um** esquema. Sugiro o de `09` (o mais completo e com regras de banco escritas), com o `custody_log` de `03` **absorvido como `event_type` de `chronicle_events`** (ou exportado como seção própria com a mesma regra de hash). `seq` **por linhagem** (permite verificar uma linhagem sem as outras) | — | coordenador + os três autores |

#### 8.3 O contrato que a Fase F6 de `09` precisa cumprir (entrada direta para o `backend-architect`)

1. Exportador por linhagem = envelope de 2.3.1; exportador global = 2.3 (estrutura de diretórios).
2. `verify_chronicle` e `verify_ledger` = implementação de referência **independente do Postgres**, em JS e em Python, com **vetores de teste** (2.3.2); reproduzem `chronicle_head` e `playtime_head` só a partir do JSONL.
3. Ordem noturna: `sealDay` → `verify` → dump → exportação → âncora (com `last_sealed_day`).
4. `status.json` (*heartbeat*) atualizado a cada N minutos e lido por um verificador **externo**.
5. A Investidura de `03` chama o exportador e **só prossegue** se `verify_*` passar.
6. Mensal: Arquivo completo + manifesto; semanal: âncora (2.6); anual: selo do ano e simulacro.

#### 8.4 Correspondência entre as minhas fases D0–D4 e as fases F0–F6 de `09`

| Minha fase | O que é | Onde encaixa em `09` |
|---|---|---|
| **D0** (≤ 30 dias) | decisão do Android (30/09), acessos e segundo humano, plano do Supabase, **dump diário verificado**, espelho do repositório, vendorizar CDNs, travar o domínio | **antes da F0** (é a rede de segurança que a F0 exige — item 9 acima) |
| **D1** (≤ 6 meses) | "Como reconstruir" v1 testado por não-autor; *break-glass*; *heartbeat*; licença; **regra de hash decidida** | em paralelo à F0–F2; a regra de hash **antes de gravar o primeiro evento da F2** |
| **D1/D2** | Arquivo v1: exportador, verificadores, âncora semanal, simulacro nº 1 | = **F5 + F6** de `09` |
| **D2** (≤ 2 anos) | associação, adjunto formal, visualizador N3, página "Saúde do Legado" | depois da F6 |
| **D3/D4** | fundação/fundo, instituição parceira, portão da blockchain | fora de `09` |

---

## (c) Lacunas que eu fechei (brief §6, item 7 e partes dos itens 3 e 9)

1. **Durabilidade 1.100+ anos (item 7):** inventário, matriz por camada, modelo de ameaças (15), níveis N1–N4 com gatilhos e avisos, especificação do Arquivo, custódia, sucessão do operador, casa jurídica com opções, aritmética de financiamento, blockchain, limites, cronograma 1/5/10/20/50/100+, teste dos 50 anos e simulacro, texto de honestidade EN/PT.
2. **Limites por camada (contribuição ao item 3):** testados em Node; achados de `int4` (`total_kills`, contadores) e do ano 10000; segundos ativos a 1 h/dia = 68,7 % do `int4`.
3. **Migração (contribuição ao item 9):** o Arquivo do Legado é a **rede de segurança da "Era Zero"**: antes de qualquer remapeamento das ~48 contas/139 personagens, gerar exportação completa com manifesto; regra "manter a geração anterior por 1 ciclo" ⇒ reversão.
4. **Achados novos que ninguém tinha listado:** verificação de desenvolvedor do Android em 30/09/2026 (Brasil); APK com chave debug; domínio → captura de credenciais dos APKs; `deploy.sh` defasado e contraditório; CDNs e MQTT público; identidade = e-mail; `.git` inchado; ausência de backup/licença/créditos.
5. **Perguntas que outros relatórios me fizeram e que agora têm resposta:** `05` §5.2 (onde vive a âncora externa depois do dev → 2.6), `05` §4.5 (formato e suporte físico da Chave do Legado → 2.7), `05` §4.7 (confirmar com fonte que domínios expirados são recomprados e usados para tomada de conta → T4, PyPI), `05` §5.3/P15 (rotina de restauração → 6.3), `03` §3.7 (formato da exportação → 2.3), `09` §5.1/§5.3 (formato oficial e testes → 2.3.1, 8.3).
6. **Regra de hash única e verificada** (2.3.2): a colisão de concatenação sem separador reproduzida em Node e a regra alternativa, que precisa ser decidida **antes do primeiro evento da Crônica**.
7. **Redimensionamento** do livro-razão diário sobre o desenho de `09` (2.3.4): ~91–117 MB por linhagem em 1.121 anos, ~20 MB exportado e comprimido — e a correção da minha própria recomendação anterior de "engrossar" o histórico (retirada porque quebraria a cadeia).
8. **Correspondência** entre níveis de serviço N1–N4 e estados de linhagem de `03` (2.1), e entre as fases D0–D4 e F0–F6 de `09` (8.4).

## (d) Lacunas que dependem de outros departamentos

| Preciso de… | O quê |
|---|---|
| `progression-actuary` | contadores inteiros como verdade (segundos ativos); definição de "hora"/"dia" (UTC); o que fazer com XP em float64; dimensionar abates por hora |
| `legacy-systems-designer` | esquema da Crônica e da Passagem (campos do `payload`); fluxo de conta dormente e recuperação por herdeiro (sem e-mail); alias e camadas de identidade; ranking por geração |
| `digital-succession-counsel` + advogado/contador | tudo da 3.7; LGPD dentro do arquivo (esquecimento × Crônica); transferência internacional; Termos com cessão e encerramento; menores |
| `backend-architect` | migrar `int4` → `bigint`; `account_id` opaco; exportador; abstrair o Storage; endpoint de *heartbeat*; confirmar se `migrate_level_bigint.js` foi executada (o `HANDOVER` dizia que não) |
| `security-engineer` | *break-glass*, custódia da chave Android, contas com 2FA físico, o cenário de captura de credenciais por domínio, `rejectUnauthorized:false` na conexão do Postgres (só registrei, não é meu escopo) |
| `mobile-platform-engineer` | decisão D1; chave de release; prontidão de PWA (**[NÃO VERIFICADO]** se o jogo tem `manifest`/service worker) |
| `tools-programmer` | vendorizar CDNs e dependências; dump automatizado; verificador de manifesto; visualizador N3 |
| `game-economy-designer` | financiamento sem RMT e sem *loot box* |
| `qa-lead` | transformar o simulacro em rotina (mesma disciplina de `e2e-db-verification`, mas **a partir do arquivo**) |
| `producer` / `project-manager` | encaixar as fases D0–D4 (abaixo) no roadmap (item 12) |
| `backend-architect` (2) | **decidir a regra de hash única antes do primeiro evento** (2.3.2); medir o tamanho real de `playtime_daily` com `pg_relation_size` (8.2 #2); ordem noturna `sealDay → verify → dump → exportação → âncora` (8.2 #8); escolher `BYTEA` ou `TEXT` para hashes; `status.json` de *heartbeat*; regra "nenhuma migração sem dump restaurado nas últimas 24 h" (8.2 #9) |
| coordenador + autores de `03`, `05`, `09` | **unificar o esquema** (`lineage_key`/`lineage_id`; `guardian_term`/`keepers`; `custody_log`/`chronicle_events`/`chronicle_entries`) e **resolver o modelo de login** (`09` D-1 × `03` T7 × `05` §4.3) — bloqueia só o campo `account_id` do meu envelope (8.2 #4, #10) |
| `digital-succession-counsel` (2) | se `contact_email_hash` (SHA-256 sem chave) é dado pessoal; se HMAC com chave privada conta como anonimização (8.2 #3) |
| `security-engineer` (2) | hash da Chave do Legado: SHA-256 em vez de Argon2id/bcrypt (8.2 #6); a testemunha externa que não pode ser conta de rede social (8.2 #5) |
| `progression-actuary` (2) | `raw/02_calibracao.md` **ainda não existe** na pasta; o Arquivo é agnóstico à curva (guarda **segundos** e `curve_version`), mas o teto de `xp_total` e o texto de `formulas.md` dependem dele |
| `legacy-philosopher` | conferir a ponte "Ise ⇒ reconstrução a cada 20 anos" e o vocabulário (Renovação, Passagem) |

**Fases de durabilidade propostas (entrada para o roadmap do item 12):**
- **D0 (imediato, ≤ 30 dias, custo ≈ 0):** decisão D1 do Android (**até 30/09**); inventário de acessos + gerenciador de senhas + segundo humano de confiança; confirmar o plano do Supabase; dump lógico diário para 2 destinos; espelho do repositório e conserto do `.git`; vendorizar 3 CDNs; conferir e travar o domínio.
- **D1 (≤ 6 meses):** "Como reconstruir" v1 testado por não-autor; Arquivo v1 (spec + exportador + manifesto); *break-glass*; *heartbeat*; licença.
- **D2 (≤ 2 anos):** associação (S1), adjunto formal, visualizador N3, simulacro nº 1 e nº 2, página "Saúde do Legado".
- **D3 (≤ 5 anos):** fundação/fundo (S2/S3), instituição parceira (S4), testemunhas públicas.
- **D4 (condicional):** *gate* da blockchain (seção 5).

## (e) DECISÕES PARA O DONO

**D1 — APK e a verificação de desenvolvedor do Android (prazo: 30/09/2026)**
- **A. Registrar-se como desenvolvedor (pessoa física) e continuar com o APK.** + APK segue instalando normal; − exige identidade, possível taxa, e o registro fica no seu nome (será preciso transferir para a entidade depois); a chave debug continua um problema.
- **B. Conta "distribuição limitada" (grátis, sem documento, até 20 aparelhos) só para testadores, e a web/PWA como caminho principal.** + custo zero, nada a perder; − jogadores comuns no Brasil ficam sem instalação "normal" do APK.
- **C. Tirar o APK do site e entregar só a web.** + o caminho mais durável (o arquivo só reproduz a web); − perde quem prefere app.
- **Recomendação: B + C agora** (a web é o aplicativo; o APK vira opcional), **A somente se houver demanda real**, e criar uma **chave de release** guardada em custódia antes de qualquer novo APK. Pergunte ao `mobile-platform-engineer` se o jogo já é instalável como PWA (**[NÃO VERIFICADO]**).

**D2 — Licença do código e dos assets**
- **A. Código aberto agora (licença permissiva; MIT ou Apache-2.0), assets sob licença separada só depois de auditar a procedência, marca e "Crônica oficial" reservadas à entidade.** + reconstrução legal por estranhos, aceito por arquivos públicos; − irreversível, risco de clones, exige limpar `assets2/` e a música primeiro.
- **B. Fonte disponível que vira aberta no gatilho (N2/N3 ou data-limite), depositada com o advogado.** + controle enquanto vive; − depende de documento jurídico sólido e de alguém que o faça valer.
- **C. Fechado (com ou sem *escrow*).** + controle total; − morre com o operador, e sem *escrow* ninguém reconstrói legalmente.
- **Recomendação: A para o código (com o advogado escolhendo a licença); B só se você não estiver pronto; nunca C sem *escrow*.**

**D3 — Casa jurídica e sucessão**
- **A. Trilha escalonada (adjunto agora → associação → fundação/fundo quando houver capital).** + começa hoje, custo baixo, cresce; − exige disciplina e advogado em cada estágio.
- **B. Ir direto à fundação, prevista em testamento.** + perpetuidade desde o início; − precisa de capital e propósito adequados; custo alto; pode não caber em ~US$ 10 mil.
- **C. Só doar o Arquivo a instituições e aceitar que o jogo vivo acaba com você.** + o mais barato e realista; − perde o "jogo vivo" em 3147.
- **Recomendação: A**, com C rodando em paralelo (é o seguro de vida do registro).

**D4 — Meta de financiamento (com os custos reais que só você tem)**
- **A. Financiar só o piso N3/N4** (≈ US$ 8–12 mil de principal, cenário A). + alcançável; − o jogo vivo depende de outra fonte.
- **B. Financiar N1 mínimo** (≈ US$ 50–75 mil, cenário B). + jogo vivo sustentado; − precisa de captação.
- **C. Financiar N1 + entidade** (≈ US$ 270–400 mil, cenário C). + institucional; − fora de alcance no curto prazo.
- **Recomendação: A primeiro, B como meta de 5 anos, C só se a comunidade crescer.** Me diga os custos reais (VPS, Supabase, domínio, câmbio) para eu refazer a tabela sem hipóteses.

**D5 — Gatilhos e prazos de descida**
- **A. Conservador:** desce cedo, avisa 12 meses antes. + dignidade máxima; − perde jogo vivo mais cedo.
- **B. Moderado (a tabela de 2.2).** + equilíbrio; − exige o fundo existir.
- **C. Leniente:** só desce quando o dinheiro acaba. + jogo vivo enquanto der; − risco de descida forçada sem aviso.
- **Recomendação: B**, com as duas invariantes (nada silencioso; nunca apagar) obrigatórias em qualquer opção.

**D6 — Quem são o adjunto e os 5 mantenedores**
- **A. Adjunto técnico de confiança + 1 pessoa não técnica + advogado/tabelião (+ 2 vagas para a entidade/instituição).** + cobre técnico, humano e legal; − pede aceite e confiança de terceiros.
- **B. Só uma pessoa (adjunto).** + simples; − *bus factor* = 2, não 5.
- **C. Voluntários da comunidade.** + escala; − pouca responsabilidade, risco de tomada de controle.
- **Recomendação: A.** Preciso que você **nomeie** (não sou eu que escolho pessoas).

**D7 — Onde ficam as cópias**
- **A. 2 armazenamentos comerciais em países diferentes + 1 offline (2 endereços + papel) + repositório público/Software Heritage + Internet Archive.** + cobre 3-2-1 e independência; − custo baixo mas recorrente (~US$ 250/ano).
- **B. Só o provedor atual + seu computador.** + zero esforço; − é exatamente o cenário de hoje.
- **Recomendação: A** — comece com 2 armazenamentos + 1 disco offline.

**D8 — Domínio**
- **A. Pré-pagar 10 anos agora (o máximo) e depois transferir o registro para a entidade.** + fecha T4 pelo menor custo; − dinheiro adiantado.
- **B. Renovação automática anual.** + simples; − depende do cartão pessoal.
- **Recomendação: A**, com trava, 2FA físico e monitor externo; manter o domínio "estacionado" com página estática mesmo nos níveis N3/N4.

**D9 — Portão da blockchain própria**
- **A. Nunca entra no plano legado.** + simplicidade; − perde a testemunha independente.
- **B. Entra só depois dos critérios (a)–(d) da seção 5.** + honesta; − adia.
- **C. Entra já.** − depende de algo que não existe.
- **Recomendação: B.** Até lá, testemunhas baratas.

**D10 — Dados pessoais no arquivo**
- **A. Nenhum dado pessoal no arquivo público; `account_id` UUID; alias consentido; camada privada separada, cifrada, com prazo.** + é o desenho mais seguro juridicamente; − a Crônica perde nomes reais.
- **B. Incluir nomes reais consentidos na Crônica.** + calor humano; − LGPD/esquecimento; menores.
- **Recomendação: A**, com B só como **opção individual, consentida e revogável** (`digital-succession-counsel` valida).

**D11 — Texto de honestidade**
- **A. Adotar o texto da seção 7 nos Termos e na tela do Legado + página "Saúde do Legado".**
- **B. Só nos Termos.**
- **Recomendação: A.** Números verificáveis geram confiança; adjetivos, não.

**D12 — Âncora externa da Crônica: onde e com que frequência** (responde a `05` §5.2 e `09` §1.4)
- **A. Semanal, em ≥ 3 testemunhas, das quais ≥ 2 independentes de qualquer conta do operador** (Internet Archive, e-mail a todos os Keepers e mantenedores, papel anual; mais repositório público com espelho no Software Heritage; posts sociais só como aviso). + custo ≈ 0; sobrevive ao operador; − exige a rotina (e o monitor) funcionarem e alguém conferir.
- **B. Mensal, só nos canais sociais.** + zero esforço; − uma conta é um ponto único; não é prova independente.
- **C. Esperar a blockchain própria.** + elegante; − ela não existe (`CLAUDE.md` §2) e, sem âncora, a cadeia de hash "dá falsa sensação de imutabilidade" (`05` §(f) 3).
- **Recomendação: A**, começando **no Dia da Fundação (Era Zero)**, antes da primeira Passagem.

**D13 — A Chave do Legado em papel: formato e suporte** (responde a `05` §4.5)
- **A. 24 palavras de uma lista pública que vai dentro do Arquivo, com 8 bits de verificação; papel permanente (ISO 9706 / Z39.48) impresso a laser ou tinta pigmentada; 2 cópias em 2 endereços; servidor guarda só `SHA-256`.** + auto-descritivo, sem dependência de software; detecta erro de cópia; − exige que o jogador tenha uma impressora ou caneta e disciplina de guardar.
- **B. Só QR code.** + rápido; − depende de leitor e de resolução; um arranhão perde tudo.
- **C. Só no gerenciador de senhas do jogador.** + cômodo; − é exatamente o e-mail/serviço que morre em décadas (`05` §4.7).
- **Recomendação: A** (texto + QR opcional); e o hash da chave em **SHA-256**, não Argon2/bcrypt (8.2 #6).

**D14 — Regra de segurança antes de qualquer migração** (8.2 #9)
- **A. "Nenhuma migração de F0–F4 roda sem um dump restaurado e verificado nas últimas 24 h", com o dump diário para 2 destinos pronto antes da F0.** + protege os ~48 contas/139 personagens reais num banco sem staging; − meio dia a dois dias de trabalho antes de começar.
- **B. Só para a `migrate_level_bigint.js --confirm` (a primeira).** + menos atrito; − as seguintes tocam o mesmo banco sem rede de segurança.
- **C. Confiar nos backups do Supabase.** + zero esforço; − **não sei o plano** nem se há backup (E8), e um backup do mesmo fornecedor **não é** independente.
- **Recomendação: A.**

## (f) Riscos e o que eu NÃO consegui verificar

**Não consegui ver (preciso que o dono informe ou autorize levantar — nada foi consultado em produção):**
1. Sistema operacional e versão do Node **na VPS**; se há cron de backup, PM2 configurado, `unattended-upgrades`; nome real do processo PM2 (`ghost` × `danger-ghost-server`).
2. **Plano do Supabase** (gratuito × Pro), região, versão do Postgres, se há PITR/backups, **tamanho real do banco e do Storage**, e a política das imagens (`MAX_UPLOAD_FILE_SIZE_MB` não li).
3. **Registrador, DNS, validade do domínio, 2FA**, e onde fica a caixa `contato@ghostgames.club`.
4. **GitHub**: repositório público ou privado, tamanho remoto, 2FA, existência de outras cópias.
5. **Custos reais** (VPS, Supabase, domínio) — a seção 3.6 usa hipóteses claramente marcadas.
6. `server/game_data.db` (SQLite antigo): **não abri**. Pode conter contas da era de senha em texto puro (`HANDOVER.md`); **não deve entrar em nenhum arquivo** e deve ser destruído ou cifrado quando a migração estiver 100 % confirmada (tarefa do dono/`security-engineer`).
7. Se o jogo já é instalável como **PWA**; se o cliente **quebra** quando o `mqtt` de CDN não carrega.
8. **Postgres/SQLite/Android** com o relógio em 2038: não rodei (só JS/Node); ficam para o simulacro nº 1.
9. `docs/SECURITY_AUDIT.md`, `PRD.md`, `SPEC.md`, `BRIEFING.md` não foram relidos por inteiro.
10. **Relatórios dos colegas lidos só em parte:** de `09` não li §3.3 (credenciais) e §4.1–4.3 (estratégias e roteiro de migração); de `01`, `03` e `05` li as seções que tocam durabilidade e fiz busca por palavra-chave no resto. Se algo fora dessas partes contradisser este relatório, vale o que estiver lá e eu revisto.
11. **`raw/02_calibracao.md` ainda não existe** na pasta (nem `06`, `07`, `08`): tudo o que aqui depende da curva final (teto de `xp_total`, `formulas.md`, o texto de `escada_v1.json`) está condicionado a ele.
12. Os tamanhos de 2.3.4 são **estimativas por campo** (tupla do Postgres) e **uma amostra sintética de 20.000 linhas** para o JSONL — **não medi nenhuma tabela real** (proibido consultar produção e não há cópia local).
13. Não verifiquei o mecanismo de "salvar página" do Internet Archive nem o de "arquivar repositório" do Software Heritage (marcados **[M]**), nem se a lista de palavras da Chave do Legado é de fato a do BIP-39 (marcado **[M]**).

**Limites da pesquisa de hoje (2026-09-20):**
- Vários fatos vêm de **resumos de busca**, não do texto primário: Android (a página oficial confirma datas, países e a conta limitada, mas **não detalha o bloqueio**; o "bloquear instalação normal" veio de imprensa técnica); **NIST IR 8547 é rascunho** (não confirmei se virou versão final); **Lei 13.800/2019 e Código Civil arts. 62/66** vieram de resumos (BNDES, IDIS, Ibram, jusbrasil, Migalhas) — **o advogado tem de conferir o texto vigente**; valores de Franklin **divergem entre fontes**; Domesday, Kongō Gumi e GitHub Arctic Vault vêm de páginas de divulgação/Wikipédia; Ise Jingu **não re-pesquisei hoje** (consta como verificado pela skill na mesma data).
- Novos nesta revisão: **PyPI** (domínios em expiração e e-mails desverificados; blog oficial, via busca) e **ISO 9706 / ANSI/NISO Z39.48** e comparação toner × jato de tinta (NISO/IFLA/SAA e fontes secundárias, via busca). Papel permanente "por várias centenas de anos" é **em condições ótimas** segundo o próprio texto do padrão — não é garantia para uma gaveta.
- Preço do domínio (~US$ 16/ano) e do Supabase Pro (US$ 25/mês) são de **um** registrador e de páginas de terceiros; podem mudar.
- "Horizontes sem intervenção" e probabilidades são **[HIPÓTESE]**; os custos por nível e os prazos de gatilho são **propostas**.

**Risco do próprio plano:** ele exige **pessoas** (adjunto, mantenedores, entidade) e **dinheiro** — se essas duas coisas não aparecerem, o resultado real será **N3/N4 sustentado por poucas cópias e por um documento**, e isso ainda é muito melhor do que o cenário atual. Um plano de durabilidade que ninguém verifica uma vez por ano é um desejo; por isso o **simulacro anual** é a peça mais importante desta proposta.

### Declaração final

**Nenhum plano garante 1.121 anos.** Este plano só promete três coisas que podem ser cumpridas por processo: **sobreviver** às falhas previsíveis, **degradar com dignidade** (com aviso, exportação e sem apagar) e **poder ser recriado** a partir de um arquivo aberto e de um documento escrito para quem não conhece o projeto. Tudo o que estiver além disso — servidores ligados, entidades vivas, tecnologias existentes — é esperança, e o plano diz isso aos jogadores.
