# SPRINT DE FEATURES E UI - 01

## Pacote 1: Polimento de UI e Layout (Usar modelo rápido)
- **Correção da Bag:** O container do inventário não está rolando até o final. Ajustar o CSS/Layout (verificar overflow-y e height) para que a rolagem funcione corretamente e o botão de "Equipar", que fica no final, fique 100% visível e clicável.
- **Troca de Background:** Criar um sistema dinâmico para trocar o cenário de fundo. Garantir que as camadas (layers/parallax) fiquem organizadas corretamente para que o novo background 2D fique sempre atrás dos sprites dos personagens e da HUD, sem sobrepor nada.

## Pacote 2: Inventário e Lógica (Usar modelo rápido/médio)
- **Excluir Itens:** Adicionar botão/ícone de exclusão (lixeira) ao lado de cada item na Bag. Ao clicar, o item deve sumir do array do inventário, a UI deve atualizar imediatamente e a mudança deve ser gravada no SaveManager.

## Pacote 3: Fluxo de Jogo e Telas (Usar modelo avançado)
- **Tela de Seleção (Pré-Jogo):** Antes do jogo iniciar de fato, carregar uma tela de seleção. Ler o SaveManager e exibir os personagens já salvos anteriormente para o jogador escolher, além de uma opção para criar um novo.
- **Game Over e Leaderboard:** No evento de fim de jogo, interromper a ação e exibir uma tela de Game Over contendo um input de texto. O jogador deve digitar seu nome e, ao confirmar, salvar o nome e a pontuação no Leaderboard local.