# SPRINT FINAL: ASSETS, UI E STATE MACHINE

Modo: Agente Orquestrador — Leia cada fase em sequência. Execute uma fase por vez. Não prossiga sem aprovação humana.

## FASE 1: Atualização de Assets e UI do Background
**Objetivos Visuais:**
1. **Remoção da marca antiga:** Procurar e remover completamente qualquer arquivo, imagem, menção no código ou na UI relacionada à logo da "deso".
2. **Nova Logo:** Implementar a nova logo oficial do jogo na interface.
3. **Backgrounds Ultrawide:** Configurar o fundo do jogo para rotacionar as 6 novas imagens criadas (proporção aprox. 1584x672).
4. **CSS do Background:** É estritamente proibido usar Flexbox para redimensionar o fundo. O CSS do container do background DEVE usar as propriedades: `background-size: cover;`, `background-repeat: no-repeat;` e `background-position: center;`.
5. **Glassmorphism (Vidro Fumê):** Criar uma camada de sobreposição acima desse background usando CSS nativo (`background-color: rgba(0, 0, 0, 0.4);` e `backdrop-filter: blur(8px);`) para garantir a legibilidade do texto da UI.
6. **Transição Elegante (Fade-In/Out):** A troca do fundo preto nativo para as imagens (e entre as imagens) NÃO deve ter cortes secos. Implemente uma transição suave de opacidade (fade-in) usando CSS `transition` ou `@keyframes`, mantendo o degradê elegante do escuro para a arte ao carregar o cenário.

## FASE 2: Máquina de Estados e Game Loop
**Objetivos de Lógica (Implementar nesta exata ordem temporal):**
1. **Estado INIT (Load):** Ao entrar na página, carregue a imagem inicial e a animação introdutória. A música principal e o loop do jogo DEVEM ficar pausados. Nada de autoplay.
2. **Estado WAIT/SKIP:** Adicione um listener global para a tecla "Space". Se o jogador apertar Space durante a introdução, a animação deve ser pulada.
3. **Estado START:** O jogo e a música só podem iniciar de fato após o jogador apertar a tecla "Space" na tela inicial.
4. **Correção do Botão Play:** O botão "Play Game" não deve sumir se o jogador tiver um save/cookie. Ele deve continuar visível. Se o jogador tiver um save e clicar no botão, carregue o personagem salvo.
5. **Estado GAME OVER:** Na tela de Game Over, escute a tecla "Space". Ao ser pressionada, limpe os estados do jogo e reinicie a partida do zero, sem recarregar (dar F5) na página.

ORDEM DE EXECUÇÃO
FASE 1 → [APROVAÇÃO HUMANA] → FASE 2 → [APROVAÇÃO HUMANA] → DONE

REGRAS DO ORQUESTRADOR
Uma fase por vez. Nunca prosseguir sem aprovação explícita.
node -c em todos os arquivos JS modificados antes de commitar.
Commit atômico por fase com mensagem feat(web2): phase N - [descrição].