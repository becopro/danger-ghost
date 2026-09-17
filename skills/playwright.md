# 🎭 SKILL: PLAYWRIGHT - VISUAL REGRESSION & UI AUTOMATION

Esta skill orienta o desenvolvimento e execução de testes automatizados de regressão visual e E2E usando o Playwright e JSDOM no ecossistema Danger Ghost.

---

## 📸 FLUXO DE VERIFICAÇÃO VISUAL (VISUAL TESTING)

1.  **Mocking DOM:** Garanta que o login local de e-mail/senha (`OpenLoginModal()`, `js/web2/auth.js`) e o Canvas context estejam mockados corretamente nos arquivos de teste (como `test_jsdom.js` e `sandbox_test.js`) — intercepte a chamada de autenticação ao servidor e devolva uma sessão fake, sem bater no Supabase real.
2.  **Screenshots Automatizados:** Ao rodar simulações, use ferramentas automatizadas ou screenshots locais no fim da partida (como a funcionalidade `Download Screenshot` do jogo) para capturar o layout renderizado e auditar anomalias de CSS.
3.  **Auditoria de Erros Globais:** Monitore erros silenciosos anexando listeners a `window.addEventListener('error', ...)` nos arquivos de testes virtuais para interceptar falhas em tempo de execução antes que elas atinjam o jogador final.
