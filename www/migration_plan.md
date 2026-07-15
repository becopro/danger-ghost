Atue como um Arquiteto de Software Sênior especialista em desenvolvimento de jogos e Agentes de IA (vibe coding).
Estou migrando meu jogo de Web3 (blockchain) para Web2 (tradicional) usando a engine Antigravity 2.0 com Antigravity CLI. 

Preciso que você crie um "Plano Mestre de Migração" em formato Markdown. Este plano NÃO é para mim, ele será lido por um Agente Orquestrador de IA, portanto, deve ser extremamente direto, modular e estruturado como uma fila de tarefas (Task Queue).

O jogo atualmente valida na blockchain:
1. Saves do jogador.
2. Geração de atributos dos personagens.
3. Registro de scores e evolução.
4. Inclua outras areas que eu possa ter esquecido.

Diretrizes para a criação do Plano Mestre:
- Divida a migração em 4 ou 5 Fases Estritas.
- Para cada fase, defina:
  - Objetivo claro e isolado.
  - Arquivos ou escopos prováveis a serem rastreados.
  - Qual modelo de IA o Orquestrador deve designar para a tarefa (use modelos 'Rápidos/Baratos' como Flash/Haiku para limpeza e refatoração simples, e 'Modelos Avançados' como Pro/Sonnet para refazer a lógica de Geração de Personagens).
  - Critérios de Aceitação (o que o subagente deve verificar antes de dar a fase como concluída).
  - Instruções de mock (dados falsos temporários) para evitar que a UI quebre durante as transações.

Formate a saída como um documento técnico (.md). Não inclua saudações, vá direto ao conteúdo do documento. O título do documento deve ser "# MASTER_PLAN_WEB3_TO_WEB2".