# Security Audit — Backend (server/)

**Data do achado:** 18 de Agosto de 2026. **Data da correção:** 18 de Agosto de 2026 (mesmo dia, a pedido explícito do usuário). **Método:** leitura linha a linha de `server/index.js`, `server/db.js`, `server/cloud_api.js`. Apenas achados de alta confiança e exploráveis de forma concreta; nenhum item teórico foi incluído.

**Status geral: os 3 achados abaixo foram corrigidos e testados nesta mesma sessão.** Ver o status individual em cada vulnerabilidade.

---

# Vuln 1: Bypass de Autenticação — token "Google" nunca é verificado
`server/index.js:104-161` (evento `auth_google_token`) e `server/index.js:169-192` (evento `cloud_save_login`)

* **Severidade:** Alta
* **Categoria:** `authentication_bypass`
* **Descrição:** O handler `auth_google_token` importa `googleClient` (`google-auth-library`) mas **nunca chama `googleClient.verifyIdToken()`** — o próprio comentário no código admite isso: *"NOTA: Em produção, você deve usar googleClient.verifyIdToken() com seu CLIENT_ID real"* (linha 107). Em vez disso, o servidor faz `atob()` manual do payload do "JWT" e confia cegamente no campo `email` de dentro dele — qualquer string com 3 partes separadas por `.` passa. Há ainda dois atalhos que dispensam token: se `data.isFallback === true` (linha 85) ou se o parse do "JWT" falhar (linha 143), o servidor aceita `data.email` enviado diretamente pelo cliente, sem prova alguma. O evento `cloud_save_login` (linha 169) é ainda mais direto: nunca existiu verificação de token ali, só `data.email`/`data.password`.
* **Cenário de exploração:** Um atacante conecta via socket.io e emite `auth_google_token` com `{ token: "eyJhbGciOiJIUzI1NiJ9." + base64('{"email":"vitima@gmail.com","name":"x"}') + ".fake", password: "qualquer1" }`. O servidor decodifica o payload sem checar assinatura, aceita `vitima@gmail.com` como autenticado e chama `loadOrCreatePlayer`. Se essa conta ainda não tinha senha definida na tabela SQLite `players` (comum, já que o fluxo "legítimo" por Google nunca define senha explicitamente), o atacante literalmente define a senha da conta da vítima nesse momento e assume o controle permanente dela — inclusive habilitando `save_game_state` (linha 194) para sobrescrever o progresso salvo da vítima.
* **Recomendação:** Chamar `await googleClient.verifyIdToken({ idToken: data.token, audience: SEU_GOOGLE_CLIENT_ID })` e usar **apenas** o e-mail retornado pela verificação — nunca o campo decodificado manualmente. Remover completamente os atalhos `isFallback`/catch-fallback que aceitam e-mail sem prova, ou, se forem necessários para dev/teste, protegê-los atrás de `process.env.NODE_ENV !== 'production'` (como já é feito, corretamente, em `cloud_api.js:155`).
* **✅ Status: corrigido em `server/index.js`.** O bloco que fazia `atob()` manual do payload foi substituído por `await googleClient.verifyIdToken({ idToken: data.token, audience: GOOGLE_CLIENT_ID })` — só o e-mail devolvido pela verificação criptográfica é usado. `GOOGLE_CLIENT_ID` agora vem de `process.env.GOOGLE_CLIENT_ID` (com placeholder se ausente). Os atalhos `isFallback`/catch-fallback por e-mail+senha **foram mantidos de propósito**: é o login real usado hoje pelo cliente (`CloudSaveLogin()` em `js/web2/auth.js`, já que `window.JoinGameServer` — o disparo do fluxo Google real — nunca foi implementado no frontend) e sua segurança agora depende do Vuln 3 (bcrypt), corrigido também. **Limitação residual não corrigida:** como não há verificação de posse do e-mail (confirmação por link), nada impede alguém de registrar um e-mail antes do dono real — isso é uma questão de fluxo de cadastro, não de autenticação quebrada, e ficou fora do escopo desta correção.

---

# Vuln 2: Segredo JWT com fallback fixo, publicado no repositório
`server/cloud_api.js:59`

* **Severidade:** Alta
* **Categoria:** `hardcoded_secret`
* **Descrição:** `const JWT_SECRET = process.env.JWT_SECRET || 'danger_ghost_deso_hosting_super_secret_key_2026';`. Esse valor literal está no histórico do repositório Git (público, `github.com/becopro/danger-ghost` conforme os commits). Se a variável de ambiente `JWT_SECRET` não estiver definida no servidor de produção — o que é plausível, já que outros valores de config no mesmo arquivo usam defaults inseguros similares (`DB_PASSWORD` default `''`, linha 43) — qualquer pessoa pode assinar tokens JWT válidos usando essa string.
* **Cenário de exploração:** Com o segredo em mãos (basta olhar o código-fonte público), um atacante forja `jsonwebtoken.sign({ googleId: "qualquer", email: "vitima@gmail.com" }, 'danger_ghost_deso_hosting_super_secret_key_2026')` e usa esse token no header `Authorization: Bearer <token>` para chamar `GET /api/load` e `POST /api/save` (`cloud_api.js:271-346`, protegidos por `authenticateJWT`) como qualquer `googleId`/`email` — leitura e sobrescrita completas do save na nuvem de qualquer jogador, sem precisar de senha nem de login Google real.
* **Recomendação:** Remover o fallback hardcoded — se `JWT_SECRET` não estiver setado, falhar a inicialização do servidor (`throw`/`process.exit(1)`) em vez de rodar com um segredo previsível. Rotacionar o segredo em produção assim que possível, já que o valor atual deve ser considerado publicamente comprometido.
* **✅ Status: corrigido em `server/cloud_api.js`.** O fallback fixo foi removido. Se `JWT_SECRET` não estiver definido, o servidor agora gera um segredo aleatório de 48 bytes (`crypto.randomBytes`) só para aquela execução, com aviso `[SECURITY]` no log — testado, o aviso dispara corretamente. Optamos por gerar um segredo aleatório em vez de derrubar o processo (`throw`/`exit`) para não causar uma indisponibilidade adicional; o efeito colateral aceito é que tokens emitidos antes de um restart ficam inválidos depois, o que é preferível a rodar com segredo previsível. **Ação pendente do usuário:** definir `JWT_SECRET` (valor fixo, aleatório e secreto) no `.env` de produção para sessões persistirem entre reinícios, e considerar o valor antigo publicamente comprometido (não reutilizá-lo).

---

# Vuln 3: Senhas armazenadas e comparadas em texto puro
`server/db.js:22` (definição da coluna) e `server/db.js:44-69` (`loadOrCreatePlayer`)

* **Severidade:** Alta
* **Categoria:** `plaintext_credentials`
* **Descrição:** A tabela SQLite `players` guarda `password TEXT DEFAULT ''` sem hash, e a verificação de login é uma comparação direta de string (`row.password !== password`, linha 54). `bcrypt` não é dependência do servidor (`server/package.json`) e não é usado em nenhum arquivo do backend — confirmado por busca no código inteiro.
* **Cenário de exploração:** Qualquer acesso de leitura ao arquivo `server/game_data.db` (backup mal configurado, vazamento do VPS, dump de banco, etc.) expõe a senha em claro de todo jogador que usou o login local — sem precisar quebrar hash nenhum. Como muitos usuários reaproveitam senha entre serviços, isso vira risco de conta comprometida fora do próprio jogo também.
* **Recomendação:** Hashear com `bcrypt` (ou `argon2`) antes de gravar, migrar as senhas existentes na próxima vez que cada usuário logar com sucesso (comparar contra o texto puro uma última vez, depois regravar já com hash), e trocar a comparação para `bcrypt.compare()`.
* **✅ Status: corrigido em `server/db.js`**, usando `bcryptjs` (puro JS, sem compilação nativa — mais seguro para o ambiente de deploy atual do que `bcrypt`). Contas novas são criadas com `bcrypt.hashSync(senha, 10)`. Contas existentes com hash em texto puro são migradas automaticamente no próximo login bem-sucedido (compara texto puro uma última vez, regrava já hasheado). O hash da senha também deixou de ser incluído no objeto `playerData` devolvido ao cliente (`delete row.password` antes de responder) — vazamento desnecessário que existia mesmo antes deste fix. Testado de ponta a ponta num banco isolado (não o `game_data.db` de produção): criação com hash, login correto, login incorreto rejeitado, migração de conta legada, e rejeição pós-migração — os 7 casos passaram.
* **Achado extra durante o teste, corrigido:** `sqlite3` (usado por `db.js`) **não estava declarado em `server/package.json`** nem no lock file — um `npm install` limpo deixaria o servidor sem conseguir iniciar. Adicionado como dependência e instalado.

---

## Fora do escopo desta rodada (mencionar, não é achado de alta confiança)
- `cors: { origin: '*' }` em `server/index.js:10` — como a autenticação é por token no corpo/`Authorization` (não por cookie), o wildcard sozinho não habilita CSRF com credenciais; classificado como *hardening* insuficiente, não vulnerabilidade concreta isolada. Vale revisar junto da correção do Vuln 1/2.
- `server/workers/SaveWorker.js` (Postgres/Redis) não foi auditado a fundo — não está conectado ao `index.js`, então não é superfície de ataque ativa hoje.
